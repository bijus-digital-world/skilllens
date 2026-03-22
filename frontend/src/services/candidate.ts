import type { Interview, PaginatedResponse } from '@/types/models'
import { api } from './api'

export const candidateService = {
  getInterviews: (params?: { page?: number; limit?: number }) => {
    const q = params ? `?page=${params.page || 1}&limit=${params.limit || 20}` : ''
    return api.get<PaginatedResponse<Interview>>(`/interviews${q}`)
  },
}
