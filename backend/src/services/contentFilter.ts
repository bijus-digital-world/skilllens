/**
 * Server-side content filter for interview conversations.
 * Acts as a safety net behind the prompt-level guardrails.
 * Flags content for admin review and can trigger interview termination.
 */

export type FilterResult = {
  flagged: boolean
  category: string | null
  severity: 'low' | 'medium' | 'high' | null
  action: 'allow' | 'warn' | 'end_interview'
}

// Patterns that should never appear in a professional interview
const PROFANITY_PATTERNS = /\b(fuck|shit|bitch|asshole|bastard|dick|cunt|nigger|faggot|retard)\b/i

// Prompt injection patterns — candidate trying to manipulate the AI
const INJECTION_PATTERNS = /\b(ignore\s+(your|all|previous)\s+(instructions|prompts?|rules?)|you\s+are\s+now|pretend\s+(you|i|that)|system\s*prompt|forget\s+(everything|your|all)|act\s+as\s+(if|a)|new\s+instructions?|override|jailbreak|disregard)\b/i

// Threats or safety concerns
const SAFETY_PATTERNS = /\b(kill\s+(myself|yourself|them|him|her|someone)|suicide|self[- ]?harm|bomb|shoot|attack|weapon|hurt\s+(myself|someone|you))\b/i

// Score/evaluation manipulation
const MANIPULATION_PATTERNS = /\b(give\s+me\s+(a\s+)?(perfect|high|good|full)\s+score|mark\s+me\s+(as\s+)?(pass|hired|selected)|change\s+my\s+(score|rating|evaluation))\b/i

export function filterContent(text: string): FilterResult {
  if (!text || typeof text !== 'string') {
    return { flagged: false, category: null, severity: null, action: 'allow' }
  }

  const cleaned = text.trim().toLowerCase()
  if (cleaned.length === 0) {
    return { flagged: false, category: null, severity: null, action: 'allow' }
  }

  // Check safety first — highest priority
  if (SAFETY_PATTERNS.test(cleaned)) {
    return { flagged: true, category: 'safety', severity: 'high', action: 'warn' }
  }

  // Check profanity
  if (PROFANITY_PATTERNS.test(cleaned)) {
    return { flagged: true, category: 'profanity', severity: 'medium', action: 'warn' }
  }

  // Check prompt injection
  if (INJECTION_PATTERNS.test(cleaned)) {
    return { flagged: true, category: 'prompt_injection', severity: 'medium', action: 'allow' }
    // Allow through — the prompt-level guardrails will ignore it
    // But we log it for admin visibility
  }

  // Check score manipulation
  if (MANIPULATION_PATTERNS.test(cleaned)) {
    return { flagged: true, category: 'manipulation', severity: 'low', action: 'allow' }
  }

  return { flagged: false, category: null, severity: null, action: 'allow' }
}

export interface GuardrailEvent {
  type: 'content_filter'
  timestamp: string
  category: string
  severity: string
  text: string // truncated for storage
  action: string
}

export function createGuardrailEvent(text: string, result: FilterResult): GuardrailEvent {
  return {
    type: 'content_filter',
    timestamp: new Date().toISOString(),
    category: result.category || 'unknown',
    severity: result.severity || 'low',
    text: text.slice(0, 200), // truncate for storage
    action: result.action,
  }
}
