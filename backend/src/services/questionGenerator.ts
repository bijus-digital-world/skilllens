import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { config } from '../config'

const TEXT_MODEL_ID = 'amazon.nova-lite-v1:0'

export interface GeneratedQuestion {
  number: number
  question: string
  expectedAnswer: string
  followUp: string
  topic: string
}

function buildPrompt(jdText: string, cvSection: string, difficulty: string, count: number): string {
  return `You are an expert technical interviewer. Generate interview questions based on the job description and candidate resume provided.

Job Description:
${jdText}

${cvSection}

Generate exactly ${count} ${difficulty}-level technical interview questions.

Difficulty guidelines:
- Simple: Fundamental concepts, definitions, basic usage. Tests baseline knowledge.
- Moderate: Application of concepts, scenario-based, requires explanation of how/why. Tests working knowledge.
- Tough: Deep architectural decisions, complex problem-solving, edge cases, system design. Tests expert-level understanding.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "questions": [
    {
      "number": 1,
      "question": "The interview question here?",
      "expectedAnswer": "A comprehensive expected answer that an ideal candidate would give. Include key points the interviewer should listen for.",
      "followUp": "A suggested follow-up question to probe deeper based on the candidate's likely answer.",
      "topic": "The technical topic this question covers"
    }
  ]
}

Make questions specific to the job requirements. Each question should test a distinct skill or concept. Expected answers should be detailed enough to help an interviewer evaluate responses.`
}

export async function generateQuestions(
  jdText: string,
  cvText: string | null,
  difficulty: 'simple' | 'moderate' | 'tough',
  count: number
): Promise<GeneratedQuestion[]> {
  const cvSection = cvText
    ? `Candidate Resume:\n${cvText}\n\nTailor some questions to the candidate's specific experience and projects mentioned in their resume.`
    : 'No candidate resume provided. Generate general questions based on the job description.'

  const prompt = buildPrompt(jdText, cvSection, difficulty, count)

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
        maxTokens: 4096,
        temperature: 0.5,
        topP: 0.9,
      },
    }),
  })

  const response = await client.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  const responseText = responseBody.output?.message?.content?.[0]?.text
    || responseBody.completion
    || ''

  console.log('[QuestionGen] Raw response length:', responseText.length)

  // Parse JSON from response — try multiple extraction strategies
  let jsonStr = responseText.trim()

  // Strategy 1: Extract from markdown code block
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  // Strategy 2: Find first { to last }
  if (!jsonStr.startsWith('{')) {
    const firstBrace = jsonStr.indexOf('{')
    const lastBrace = jsonStr.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
    }
  }

  const parsed = JSON.parse(jsonStr)
  return parsed.questions as GeneratedQuestion[]
}
