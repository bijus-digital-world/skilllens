import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth'
import { api } from './api'

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  logout: () => api.post<{ message: string }>('/auth/logout', {}),
  me: () => api.get<User>('/auth/me'),
}
