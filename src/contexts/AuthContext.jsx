import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  supabaseSignIn,
  supabaseSignUp,
  supabaseRefreshToken,
  setTokens,
  clearTokens,
  getToken,
  decodeJwt,
  isTokenExpired,
  TOKEN_KEY,
  REFRESH_KEY,
} from '@/lib/api'

const AuthContext = createContext(undefined)

function userFromPayload(payload) {
  if (!payload) return null
  return {
    id: payload.sub,
    email: payload.email ?? '',
    role: payload.app_metadata?.role ?? 'user',
    created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token || isTokenExpired(token)) return null
      return userFromPayload(decodeJwt(token))
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(false)
  const refreshTimerRef = useRef(null)

  const scheduleRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const payload = decodeJwt(token)
    if (!payload?.exp) return
    const msUntilRefresh = payload.exp * 1000 - Date.now() - 60_000
    if (msUntilRefresh <= 0) { attemptRefresh(); return }
    refreshTimerRef.current = setTimeout(attemptRefresh, msUntilRefresh)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const attemptRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    if (!refreshToken) return
    try {
      const data = await supabaseRefreshToken(refreshToken)
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
      const payload = decodeJwt(data.access_token)
      setUser(userFromPayload(payload))
      scheduleRefresh(data.access_token)
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [scheduleRefresh])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    if (isTokenExpired(token)) { attemptRefresh() }
    else { scheduleRefresh(token) }
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await supabaseSignIn(email, password)
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
      const payload = decodeJwt(data.access_token)
      const u = userFromPayload(payload)
      setUser(u)
      scheduleRefresh(data.access_token)
      return u
    } finally {
      setLoading(false)
    }
  }, [scheduleRefresh])

  const register = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await supabaseSignUp(email, password)
      if (data.access_token) {
        setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
        const payload = decodeJwt(data.access_token)
        const u = userFromPayload(payload)
        setUser(u)
        scheduleRefresh(data.access_token)
        return u
      }
      return { emailConfirmationRequired: true, email }
    } finally {
      setLoading(false)
    }
  }, [scheduleRefresh])

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, getAccessToken: getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
