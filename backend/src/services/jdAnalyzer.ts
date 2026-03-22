import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { config } from '../config'
import { pool } from '../db/pool'

const TEXT_MODEL_ID = 'amazon.nova-lite-v1:0'

export interface JdAnalysis {
  skills: Array<{ name: string; importance: 'must_have' | 'nice_to_have'; category: string }>
  experienceLevel: { detected: string; years: string; confidence: string }
  suggestedProfile: 'junior' | 'mid' | 'senior' | 'lead'
  suggestedDuration: number
  roleSummary: string
  flags: string[]
  interviewFocus: string[]
}

export async function analyzeJd(jdId: string, jdText: string): Promise<JdAnalysis> {
  const prompt = `Analyze the following job description for a technical interview platform. Extract structured information that helps an interviewer prepare.

Job Description:
${jdText}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "skills": [
    {"name": "React.js", "importance": "must_have", "category": "Frontend"},
    {"name": "GraphQL", "importance": "nice_to_have", "category": "API"}
  ],
  "experienceLevel": {
    "detected": "Senior Developer",
    "years": "5-8 years",
    "confidence": "high"
  },
  "suggestedProfile": "senior",
  "suggestedDuration": 30,
  "roleSummary": "One sentence summary of the role and its core responsibility",
  "flags": ["Any concerns about the JD - unrealistic requirements, missing info, contradictions"],
  "interviewFocus": ["Top 3-5 areas the interview should focus on based on this JD"]
}

Rules:
- suggestedProfile must be one of: junior, mid, senior, lead
- suggestedDuration should be 15, 30, 45, or 60
- skills should list 5-15 key technical skills with importance level
- category should be: Frontend, Backend, Database, Cloud, DevOps, Testing, Architecture, Soft Skills, or Other
- flags should be empty array if no concerns. Be specific and helpful, not generic.
- interviewFocus should be concrete areas, not vague topics`

  const client = new BedrockRuntimeClient({ region: config.aws.region })
  const command = new InvokeModelCommand({
    modelId: TEXT_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 2048, temperature: 0.3, topP: 0.9 },
    }),
  })

  const response = await client.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))
  const responseText = responseBody.output?.message?.content?.[0]?.text || ''

  let jsonStr = responseText.trim()
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()
  if (!jsonStr.startsWith('{')) {
    const first = jsonStr.indexOf('{')
    const last = jsonStr.lastIndexOf('}')
    if (first !== -1 && last !== -1) jsonStr = jsonStr.substring(first, last + 1)
  }

  const analysis: JdAnalysis = JSON.parse(jsonStr)

  // Store in database
  await pool.query(
    'UPDATE job_descriptions SET analysis = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(analysis), jdId]
  )

  return analysis
}
