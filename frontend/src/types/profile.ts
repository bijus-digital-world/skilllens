export interface ProfileCategory {
  name: string
  weight: number
  description: string
}

export interface EvaluationProfile {
  id: string
  name: string
  description: string | null
  experience_level: 'junior' | 'mid' | 'senior' | 'lead'
  role_type: 'ic' | 'tech_lead' | 'manager'
  domain: 'frontend' | 'backend' | 'fullstack' | 'devops' | 'data'
  categories: ProfileCategory[]
  strictness: 'lenient' | 'moderate' | 'strict'
  pass_threshold: number
  is_preset: boolean
  created_at: string
}
