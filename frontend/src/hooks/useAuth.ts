import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth'

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    let cancelled = false
    authService
      .me()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
    return () => {
      cancelled = true
    }
  }, [setUser, setLoading])

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password })
    setUser(res.user)
    return res
  }

  const register = async (email: string, password: string, name: string, role: 'admin' | 'candidate') => {
    const res = await authService.register({ email, password, name, role })
    setUser(res.user)
    return res
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return { user, isLoading, login, register, logout }
}
