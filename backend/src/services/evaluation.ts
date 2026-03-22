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
  confidenceLevel: 'high' | 'medium' | 'low'  // how confident is the evaluation
  confidenceReason: string  // why confidence is what it is
  followUpAreas: string[]   // topics to probe in next interview round
  hintsNeeded: number       // how many times interviewer had to help/simplify
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

For EACH category, provide THREE scores:
1. "score" (0-10): Overall score for this category
2. "contentScore" (1-4): WHAT they said — substance, accuracy, relevance, depth
   - 4 = Strong Hire signal: thorough, accurate, demonstrates deep understanding
   - 3 = Hire signal: adequate knowledge, correct approach, minor gaps
   - 2 = No Hire signal: significant gaps, vague or generic answers
   - 1 = Strong No Hire signal: incorrect, cannot answer, no relevant knowledge
3. "deliveryScore" (1-4): HOW they said it — clarity, structure, confidence
   - 4 = Articulate, well-structured, confident throughout
   - 3 = Clear enough, occasionally needs prompting
   - 2 = Disorganized, unclear, needed significant guidance
   - 1 = Could not articulate thoughts coherently

IMPORTANT: Content and delivery are SEPARATE. A nervous candidate (deliveryScore=2) who gives technically accurate answers (contentScore=4) is VERY different from a confident candidate (deliveryScore=4) who gives wrong answers (contentScore=1). For technical roles, contentScore matters more.

"evidence" must be a SPECIFIC quote or paraphrase from the transcript. Not "candidate demonstrated good knowledge" — instead: "When asked about caching, candidate described implementing Redis with LRU eviction and TTL-based invalidation for their payment service."

"comments" should explain WHY the score was given, referencing the evidence.

=== OVERALL ASSESSMENT RULES ===

"recommendation" MUST be one of: "Strong Hire", "Hire", "No Hire", "Strong No Hire"
- DO NOT use "Maybe", "Leaning Hire", or any other variant
- A single contentScore of 1 on a critical category should result in "No Hire" regardless of other scores (the Google rule)
- The recommendation should align with the overall picture, not just the numerical average

"confidenceLevel" (high/medium/low): How confident are you in this evaluation?
- "high": Clear signal — candidate clearly strong or clearly weak, enough data points
- "medium": Mixed signals — some strong areas, some weak, would benefit from another interview
- "low": Insufficient data — very short interview, too few questions answered, or mostly "I don't know"

"hintsNeeded": Count how many times the interviewer had to simplify, rephrase, or change topic because the candidate struggled. Each "no worries, let me ask something else" = 1 hint.

"followUpAreas": 1-3 specific topics that should be explored in a follow-up interview. Example: "System design — candidate mentioned experience but wasn't asked about it", "Testing practices — not covered in this interview"

=== RESPONSE FORMAT ===

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "categories": [
    ${categoryJson}
  ],
  "strengths": ["Specific strength 1 with evidence", "Specific strength 2 with evidence"],
  "weaknesses": ["Specific weakness 1 with evidence", "Specific weakness 2 with evidence"],
  "overallRating": 0,
  "overallComments": "2-3 sentence assessment that a hiring manager can read without seeing the transcript and understand the candidate's level",
  "recommendation": "Strong Hire | Hire | No Hire | Strong No Hire",
  "confidenceLevel": "high | medium | low",
  "confidenceReason": "Why this confidence level — e.g. 'Clear strong signal across all categories' or 'Mixed results, only 4 questions answered'",
  "hintsNeeded": 0,
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
