export type UserRole = 'admin' | 'candidate'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: UserRole
}

export interface AuthResponse {
  user: User
  message: string
}
