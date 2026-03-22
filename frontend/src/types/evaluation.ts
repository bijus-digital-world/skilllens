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
    evidence?: string
    contentScore?: number
    deliveryScore?: number
  }>
  strengths: string[]
  weaknesses: string[]
  overallRating: number
  overallComments: string
  recommendation: string
  confidenceLevel?: 'high' | 'medium' | 'low'
  confidenceReason?: string
  followUpAreas?: string[]
  hintsNeeded?: number
  highlights?: TranscriptHighlight[]
}

export interface ProctoringEvent {
  type: string
  timestamp: string
  detail?: string
}

export interface ProctoringSummary {
  tabSwitches: number
  fullscreenExits: number
  devtoolsOpens: number
  snapshotCount: number
  suspiciousScore: number
  flag: 'low' | 'medium' | 'high'
}

export interface InterviewDetail {
  id: string
  status: string
  duration_minutes: number
  scheduled_start: string
  scheduled_end: string
  actual_start: string | null
  actual_end: string | null
  overall_rating: number | null
  score: EvaluationResult | null
  transcript: Array<{ role: string; text: string }> | null
  snapshots: string[] | null
  proctoring_events: ProctoringEvent[] | null
  proctoring_summary: ProctoringSummary | null
  candidate_name: string
  candidate_email: string
  jd_title: string
  persona: string
  adaptive_difficulty: boolean
  initial_difficulty: string
}
