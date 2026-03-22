export interface GeneratedQuestion {
  number: number
  question: string
  expectedAnswer: string
  followUp: string
  topic: string
}

export interface QuestionSet {
  id: string
  jd_title: string
  candidate_name: string | null
  difficulty: 'simple' | 'moderate' | 'tough'
  question_count: number
  created_at: string
}

export interface QuestionSetDetail extends QuestionSet {
  questions: GeneratedQuestion[]
  candidate_email: string | null
}
