import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { config } from '../config'
import { pool } from '../db/pool'

const TEXT_MODEL_ID = 'amazon.nova-lite-v1:0'

export interface TranscriptHighlight {
  exchangeIndex: number
  type: 'strong' | 'weak' | 'red_flag'
  note: string
}

export interface EvaluationResult {
  categories: Array<{
    name: string
    score: number
    maxScore: number
    weight?: number
    comments: string
    evidence: string     // specific quote or reference from transcript
    contentScore?: number   // what they said (substance) — 1-4
    deliveryScore?: number  // how they said it (clarity, confidence) — 1-4
  }>
  strengths: string[]
  weaknesses: string[]
  overallRating: number
  overallComments: string
  recommendation: 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire'
  riskFactors: string[]     // what could go wrong if we hire this person
  confidenceLevel: 'high' | 'medium' | 'low'
  confidenceReason: string
  followUpAreas: string[]
  hintsNeeded: number
  selfCorrectionCount: number  // times candidate caught their own mistakes (positive signal)
  highlights?: TranscriptHighlight[]
}

interface ProfileCategory {
  name: string
  weight: number
  description: string
}

const STRICTNESS_EVAL: Record<string, string> = {
  lenient: 'Score generously. Credit partial knowledge and correct reasoning direction. A candidate heading the right way but lacking polish earns 6-7. Learning potential matters.',
  moderate: 'Score fairly. Expect working knowledge with real examples. Partial but correct reasoning = 5-6. Confident, complete answers = 7-8. Process matters as much as the answer.',
  strict: 'Score rigorously. Expect depth, precision, and evidence of real-world experience. Only 8+ for exceptional answers with trade-off analysis and nuanced understanding.',
}

const SENIORITY_EXPECTATIONS: Record<string, string> = {
  junior: `SENIORITY: Junior (0-2 years). Expectations:
- Score 4: Can explain basic concepts clearly and shows eagerness to learn
- Score 3: Understands fundamentals but needs prompting
- Score 2: Shaky on basics, unclear explanations
- Score 1: Cannot articulate basic concepts
Do NOT penalize for lack of system design knowledge or architectural experience. Focus on fundamentals, learning ability, and communication clarity.`,
  mid: `SENIORITY: Mid-level (3-5 years). Expectations:
- Score 4: Provides specific project examples with clear STAR structure, understands trade-offs
- Score 3: Has relevant experience but examples lack depth or specificity
- Score 2: Vague or generic answers, cannot describe their specific contribution
- Score 1: No relevant experience or cannot articulate past work
Expect practical, hands-on knowledge. "Tell me about a time" answers should be concrete with measurable outcomes.`,
  senior: `SENIORITY: Senior (5+ years). Expectations:
- Score 4: Discusses architecture decisions, trade-offs, mentoring, and cross-team impact with depth
- Score 3: Has senior-level experience but explanations lack architectural thinking
- Score 2: Answers at mid-level depth despite senior title
- Score 1: Cannot demonstrate senior-level thinking
Expect system-level thinking, opinions on technology choices, and evidence of technical leadership.`,
  lead: `SENIORITY: Lead/Principal. Expectations:
- Score 4: Demonstrates organizational impact, strategic thinking, and ability to drive technical direction
- Score 3: Strong technical leadership but limited strategic or cross-org evidence
- Score 2: Operates at senior level, not lead level
- Score 1: Cannot demonstrate leadership or strategic impact
Expect discussion of team building, technical strategy, stakeholder management, and organization-wide decisions.`,
}

export function buildEvaluationPrompt(
  jdText: string,
  cvText: string,
  transcriptText: string,
  categories?: ProfileCategory[],
  strictness?: string,
  passThreshold?: number,
  experienceLevel?: string
): string {
  const cats = categories || [
    { name: 'Technical Competency', weight: 30, description: 'Depth and accuracy of technical knowledge relevant to the role' },
    { name: 'Problem Solving', weight: 25, description: 'Approach to problems — clarifying questions, structured thinking, trade-off analysis' },
    { name: 'Communication', weight: 20, description: 'Clarity of explanation, ability to articulate thoughts, organized responses' },
    { name: 'Relevant Experience', weight: 15, description: 'Depth of hands-on experience relevant to the JD, with specific examples' },
    { name: 'Role Fit', weight: 10, description: 'Alignment with role expectations — seniority level, domain, team dynamics' },
  ]
  const categoryJson = cats.map((c) => `{"name": "${c.name}", "score": 0, "maxScore": 10, "weight": ${c.weight}, "comments": "...", "evidence": "...", "contentScore": 0, "deliveryScore": 0}`).join(',\n    ')

  const scoringGuidance = STRICTNESS_EVAL[strictness || 'moderate'] || STRICTNESS_EVAL.moderate
  const seniorityGuide = SENIORITY_EXPECTATIONS[experienceLevel || 'mid'] || SENIORITY_EXPECTATIONS.mid
  const threshold = passThreshold || 6.0

  return `You are a senior hiring committee member evaluating an interview transcript. Your evaluation will be used to make a real hiring decision. Be thorough, evidence-based, and fair.

=== CONTEXT ===

Job Description:
${jdText}

Candidate Resume:
${cvText}

=== INTERVIEW TRANSCRIPT ===

${transcriptText}

=== EVALUATION FRAMEWORK ===

${seniorityGuide}

Scoring Approach: ${scoringGuidance}
Pass Threshold: ${threshold}/10

=== SCORING RULES (follow exactly) ===

STEP 1: Score each category INDEPENDENTLY. Do NOT let a strong answer in one area inflate scores in another area (this is called the "halo effect" — avoid it). Evaluate each category as if it's the only thing you're scoring.

For EACH category, provide THREE scores:
1. "score" (0-10): Overall score for this category
2. "contentScore" (1-4): WHAT they said — substance, accuracy, relevance, depth
   - 4 = Strong Hire: thorough, accurate, specific examples with concrete details (metrics, names, technical specifics). Demonstrates understanding beyond the surface level.
   - 3 = Hire: adequate knowledge, correct approach, minor gaps. Can explain concepts but lacks depth or specificity in examples.
   - 2 = No Hire: significant gaps, vague or generic answers. Uses buzzwords without backing them up. Gives hypothetical answers when asked for real experience.
   - 1 = Strong No Hire: incorrect, cannot answer, no relevant knowledge. Fundamental misunderstanding of concepts in their claimed area of expertise.
3. "deliveryScore" (1-4): HOW they said it — clarity, structure, confidence
   - 4 = Articulate, well-structured, confident throughout
   - 3 = Clear enough, occasionally needs prompting
   - 2 = Disorganized, unclear, needed significant guidance
   - 1 = Could not articulate thoughts coherently

CRITICAL: Content and delivery are SEPARATE. NEVER let delivery override content.
- Nervous but accurate (content=4, delivery=2) → STRONG candidate. Nervousness is not a predictor of job performance.
- Confident but wrong (content=1, delivery=4) → WEAK candidate. Confidence without substance is the most common cause of bad hires.
- For technical roles, weight contentScore 3-4x more than deliveryScore.

"evidence" must be a SPECIFIC quote or paraphrase from the transcript. Not "candidate demonstrated good knowledge" — instead: "When asked about caching, candidate described implementing Redis with LRU eviction and TTL-based invalidation for their payment service."

"comments" should explain WHY the score was given, referencing the evidence.

=== DETECTING REHEARSED VS GENUINE ANSWERS ===

Look for these signals and note them in your evaluation:

REHEARSED (flag as yellow):
- Perfect STAR structure from the first word with no pauses or self-correction
- Generic examples that could apply to any company ("we improved performance")
- Cannot go deeper when the interviewer asks follow-ups beyond the prepared answer
- Uses exact phrasing from common interview prep resources

GENUINE (positive signal):
- Starts roughly then organizes thoughts — may self-correct mid-answer
- Includes specific details: names, numbers, timelines, technology-specific details
- Can answer unexpected follow-ups with the same level of detail
- Includes emotional/contextual detail ("that was a stressful week because...")

=== WHAT THEY DIDN'T SAY (evaluate meaningful absences) ===

Note in your evaluation if the candidate:
- Never mentioned testing, error handling, or edge cases (red flag for senior roles)
- Always said "we" and never described their specific individual contribution
- Never mentioned learning from failures or mistakes (may lack self-awareness)
- Never mentioned collaboration or working with others (if role requires it)
- Gave zero concrete metrics or numbers across the entire interview
- Avoided answering a direct question by redirecting to a different topic

Include these observations in the relevant category comments. A meaningful absence is as informative as what was said.

=== "I DON'T KNOW" EVALUATION ===

"I don't know" is NOT automatically negative. Score it based on context:

POSITIVE "I don't know":
- Followed by reasoning: "I haven't used that, but based on what I know about X, I'd guess..."
- For genuinely obscure or niche knowledge outside their claimed expertise
- Accompanied by honesty about knowledge boundaries: "I'm stronger in X than Y"
- This shows intellectual humility — a strong predictor of on-the-job learning

NEGATIVE "I don't know":
- For fundamental concepts in their claimed area of expertise
- Not followed by any attempt to reason through the problem
- Repeated pattern across many questions (lack of preparation or depth)
- For topics prominently listed on their own resume

=== OVERALL ASSESSMENT RULES ===

Score each category independently FIRST. Then compute the overall assessment.

"recommendation" MUST be one of: "Strong Hire", "Hire", "No Hire", "Strong No Hire"
- DO NOT use "Maybe", "Leaning Hire", or any other variant
- A single contentScore of 1 on a critical category → "No Hire" regardless of other scores (the Google rule)
- The recommendation should align with the overall profile, NOT just the numerical average
- A candidate with scores of 9, 9, 9, and 2 is NOT the same as a candidate with all 7s — present the profile, not the average

"riskFactors": List 1-3 specific risks of hiring this candidate. What could go wrong?
- Example: "May struggle with system design at scale — all examples were small team/small codebase"
- Example: "Strong individual contributor but no evidence of mentoring or leadership"
- Example: "All experience is with one tech stack — may resist adopting new technologies"
Even for strong candidates, identify risks. Every hire has risks.

"trainability": For each weakness identified, note whether it's a SKILL gap (trainable) or a WILL gap (much harder to change):
- Skill gap: "Hasn't used GraphQL but has strong API design fundamentals — could learn quickly"
- Will gap: "Consistently dismissive of testing — may resist adopting team testing practices"

"confidenceLevel" (high/medium/low): How confident are you in this evaluation?
- "high": Clear signal — candidate clearly strong or clearly weak, enough data points
- "medium": Mixed signals — some strong areas, some weak, would benefit from another interview
- "low": Insufficient data — very short interview, too few questions answered, or mostly "I don't know"

"hintsNeeded": Count how many times the interviewer had to simplify, rephrase, or change topic because the candidate struggled. Each "no worries, let me ask something else" = 1 hint.

"followUpAreas": 1-3 specific topics that should be explored in a follow-up interview. Example: "System design — candidate mentioned experience but wasn't asked about it", "Testing practices — not covered in this interview"

"selfCorrectionCount": How many times did the candidate catch and correct their own mistake during the interview? Self-correction is a STRONG positive signal — people who catch their own errors on the job are significantly more effective.

=== RESPONSE FORMAT ===

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "categories": [
    ${categoryJson}
  ],
  "strengths": ["Specific strength with evidence from the interview"],
  "weaknesses": ["Specific weakness with evidence — note if it's a skill gap (trainable) or will gap"],
  "riskFactors": ["What could go wrong if we hire this person — be specific"],
  "overallRating": 0,
  "overallComments": "2-3 sentence executive summary a hiring manager can read in 30 seconds and understand the candidate's level, key strengths, and key risks",
  "recommendation": "Strong Hire | Hire | No Hire | Strong No Hire",
  "confidenceLevel": "high | medium | low",
  "confidenceReason": "Why this confidence level",
  "hintsNeeded": 0,
  "selfCorrectionCount": 0,
  "followUpAreas": ["Topic to explore in next round"],
  "highlights": [
    {"exchangeIndex": 0, "type": "strong", "note": "Specific observation about this exchange"},
    {"exchangeIndex": 3, "type": "weak", "note": "..."},
    {"exchangeIndex": 5, "type": "red_flag", "note": "..."}
  ]
}

Score 0-10 per category. Overall rating = weighted average (can be decimal like 7.2).
Every score must have specific evidence from the transcript.
Mark 3-8 transcript highlights as "strong", "weak", or "red_flag" with specific notes.

=== SPEECH ANALYTICS (factor into deliveryScore) ===

Analyze the candidate's speech patterns from the transcript:
- FILLER WORDS: Count approximate "um", "uh", "like", "you know", "basically", "actually", "sort of" usage. Heavy filler = deliveryScore 2. Moderate = 3. Minimal = 4.
- ANSWER STRUCTURE: Does the candidate give structured answers (situation, action, result) or ramble? Structured = higher deliveryScore.
- DIRECTNESS: Does the candidate answer the question asked, or go on tangents? Direct answers = higher deliveryScore.
- SPECIFICITY: Does the candidate give concrete examples with details, or vague generalities? Specific = higher contentScore.

Include these observations in the category comments where relevant. Do not create a separate speech analytics section — weave it into the existing scores naturally.`
}

export async function evaluateInterview(interviewId: string): Promise<EvaluationResult> {
  // Fetch interview data with profile
  const result = await pool.query(
    `SELECT i.transcript, i.profile_id, jd.extracted_text as jd_text, cv.extracted_text as cv_text,
            ep.categories as profile_categories, ep.strictness as profile_strictness, ep.pass_threshold,
            ep.experience_level as profile_experience_level
     FROM interviews i
     JOIN job_descriptions jd ON jd.id = i.jd_id
     JOIN candidate_cvs cv ON cv.id = i.cv_id
     LEFT JOIN evaluation_profiles ep ON ep.id = i.profile_id
     WHERE i.id = $1`,
    [interviewId]
  )

  if (result.rows.length === 0) {
    throw new Error('Interview not found')
  }

  const row = result.rows[0]
  const { transcript, jd_text, cv_text } = row

  // Format transcript — skip evaluation if no meaningful transcript
  if (!transcript || !Array.isArray(transcript) || transcript.length < 2) {
    throw new Error('Interview has no transcript to evaluate')
  }

  const transcriptText = transcript
    .map((entry: { role: string; text: string }) => `${entry.role}: ${entry.text}`)
    .join('\n\n')

  // Parse profile categories
  const profileCategories = row.profile_categories
    ? (typeof row.profile_categories === 'string' ? JSON.parse(row.profile_categories) : row.profile_categories)
    : undefined

  const prompt = buildEvaluationPrompt(
    jd_text || 'Not provided',
    cv_text || 'Not provided',
    transcriptText,
    profileCategories,
    row.profile_strictness,
    row.pass_threshold ? parseFloat(row.pass_threshold) : undefined,
    row.profile_experience_level
  )

  // Call Nova text model
  const client = new BedrockRuntimeClient({ region: config.aws.region })
  const command = new InvokeModelCommand({
    modelId: TEXT_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      messages: [
        { role: 'user', content: [{ text: prompt }] },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.3,
        topP: 0.9,
      },
    }),
  })

  const response = await client.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  // Extract text from response
  const responseText = responseBody.output?.message?.content?.[0]?.text
    || responseBody.completion
    || ''

  // Parse JSON from response (handle possible markdown wrapping)
  let jsonStr = responseText.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  let evaluation: EvaluationResult
  try {
    evaluation = JSON.parse(jsonStr)
  } catch {
    // Try extracting JSON between first { and last }
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start !== -1 && end > start) {
      evaluation = JSON.parse(jsonStr.slice(start, end + 1))
    } else {
      throw new Error('AI returned invalid evaluation format. Please retry.')
    }
  }

  // Generate candidate-facing feedback (no scores, just actionable tips)
  const candidateFeedback = generateCandidateFeedback(evaluation)

  // Store in database
  await pool.query(
    `UPDATE interviews
     SET score = $1, overall_rating = $2, candidate_feedback = $3, status = 'completed', updated_at = NOW()
     WHERE id = $4`,
    [JSON.stringify(evaluation), evaluation.overallRating, JSON.stringify(candidateFeedback), interviewId]
  )

  return evaluation
}

export interface CandidateFeedback {
  summary: string
  communicationTips: string[]
  technicalTips: string[]
  whatWentWell: string[]
}

function generateCandidateFeedback(evaluation: EvaluationResult): CandidateFeedback {
  const communicationTips: string[] = []
  const technicalTips: string[] = []
  const whatWentWell: string[] = []

  for (const cat of evaluation.categories) {
    if (cat.score >= 7) {
      whatWentWell.push(`Strong performance in ${cat.name.toLowerCase()}`)
    }
    if (cat.deliveryScore != null && cat.deliveryScore <= 2) {
      communicationTips.push(`Work on articulating your ${cat.name.toLowerCase()} answers more clearly — practice explaining your thought process step by step`)
    }
    if (cat.contentScore != null && cat.contentScore <= 2) {
      technicalTips.push(`Brush up on ${cat.name.toLowerCase()} — try working through practical examples and real-world scenarios`)
    }
  }

  // Add generic tips based on hints needed
  if (evaluation.hintsNeeded && evaluation.hintsNeeded >= 3) {
    communicationTips.push('Practice answering questions directly before expanding — lead with the key point')
  }

  // Ensure at least one item in each
  if (whatWentWell.length === 0) {
    whatWentWell.push('You showed up and completed the interview — that takes courage')
  }
  if (communicationTips.length === 0) {
    communicationTips.push('Keep practicing with mock interviews to build comfort and fluency')
  }
  if (technicalTips.length === 0) {
    technicalTips.push('Continue building projects and exploring new technologies in your domain')
  }

  const rating = evaluation.overallRating
  const summary = rating >= 7
    ? 'Great interview! You demonstrated solid knowledge and communicated your ideas well.'
    : rating >= 5
    ? 'Good effort. There are some areas where additional preparation would help you stand out.'
    : 'Thank you for participating. Here are some areas to focus on for your next interview.'

  return { summary, communicationTips, technicalTips, whatWentWell }
}
