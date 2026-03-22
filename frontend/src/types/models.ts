export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface JobDescription {
  id: string
  title: string
  description: string | null
  file_name: string | null
  extracted_text?: string | null
  created_at: string
}

export interface CandidateCV {
  id: string
  candidate_id: string
  file_name: string
  candidate_name: string
  candidate_email: string
  created_at: string
}

export interface Candidate {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Interview {
  id: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  duration_minutes: number
  scheduled_start: string
  scheduled_end: string
  overall_rating: number | null
  candidate_name: string
  candidate_email: string
  jd_title: string
  created_at: string
  persona?: 'friendly' | 'tough' | 'rapid_fire'
  adaptive_difficulty?: boolean
  initial_difficulty?: 'simple' | 'moderate' | 'tough'
  is_practice?: boolean
  candidate_feedback?: {
    summary: string
    communicationTips: string[]
    technicalTips: string[]
    whatWentWell: string[]
  } | null
}
