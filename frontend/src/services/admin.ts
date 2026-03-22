import type { JobDescription, CandidateCV, Candidate, Interview, PaginatedResponse } from '@/types/models'
import { api } from './api'

const API_BASE = '/api'

export const adminService = {
  // Job Descriptions
  getJobDescriptions: (params?: { page?: number; limit?: number }) => {
    const q = params ? `?page=${params.page || 1}&limit=${params.limit || 20}` : ''
    return api.get<PaginatedResponse<JobDescription>>(`/job-descriptions${q}`)
  },
  getJobDescription: (id: string) => api.get<JobDescription>(`/job-descriptions/${id}`),
  deleteJobDescription: (id: string) => api.delete<{ message: string }>(`/job-descriptions/${id}`),
  createJobDescription: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/job-descriptions`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(err.message)
    }
    return res.json() as Promise<JobDescription>
  },

  // CVs
  getCVs: (params?: { candidateId?: string; page?: number; limit?: number }) => {
    const parts: string[] = []
    if (params?.candidateId) parts.push(`candidateId=${params.candidateId}`)
    if (params?.page) parts.push(`page=${params.page}`)
    if (params?.limit) parts.push(`limit=${params.limit}`)
    const q = parts.length ? `?${parts.join('&')}` : ''
    return api.get<PaginatedResponse<CandidateCV>>(`/cvs${q}`)
  },
  deleteCV: (id: string) => api.delete<{ message: string }>(`/cvs/${id}`),
  uploadCV: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/cvs`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(err.message)
    }
    return res.json() as Promise<CandidateCV>
  },

  // Candidates
  getCandidates: () => api.get<Candidate[]>('/candidates'),

  // Interviews
  getInterviews: (params?: { page?: number; limit?: number }) => {
    const q = params ? `?page=${params.page || 1}&limit=${params.limit || 20}` : ''
    return api.get<PaginatedResponse<Interview>>(`/interviews${q}`)
  },
  createInterview: (data: {
    candidateId: string
    jdId: string
    cvId: string
    durationMinutes: number
    scheduledStart: string
    profileId?: string
    interviewerGender?: string
    persona?: string
    adaptiveDifficulty?: boolean
    initialDifficulty?: string
    isPractice?: boolean
  }) => api.post<Interview>('/interviews', data),
  cancelInterview: (id: string) =>
    fetch(`${API_BASE}/interviews/${id}/cancel`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed' }))
        throw new Error(err.message)
      }
      return res.json()
    }),
}
