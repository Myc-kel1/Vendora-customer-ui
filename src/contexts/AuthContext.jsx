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
  // Initialize user from valid token (non-expired) stored in localStorage
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      // Only restore user if token exists and is NOT expired
      if (token && !isTokenExpired(token)) {
        const payload = decodeJwt(token)
        return userFromPayload(payload)
      }
      return null
    } catch (err) {
      console.warn('[Auth] Failed to initialize user from token:', err.message)
      return null
    }
  })

  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const refreshTimerRef = useRef(null)
  const refreshAttemptRef = useRef(0)

  // Schedule token refresh before expiry
  const scheduleRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)

    const payload = decodeJwt(token)
    if (!payload?.exp) {
      console.warn('[Auth] Token has no expiry, skipping refresh scheduling')
      return
    }

    // Calculate time until refresh: refresh 1 minute before expiry
    const msUntilRefresh = payload.exp * 1000 - Date.now() - 60_000
    if (msUntilRefresh <= 0) {
      // Token already expired or about to expire, attempt refresh immediately
      console.debug('[Auth] Token expiring soon, refreshing immediately')
      attemptRefresh()
      return
    }

    console.debug(`[Auth] Scheduled token refresh in ${Math.round(msUntilRefresh / 1000)}s`)
    refreshTimerRef.current = setTimeout(attemptRefresh, msUntilRefresh)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Attempt to refresh token using refresh token
  const attemptRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    if (!refreshToken) {
      console.debug('[Auth] No refresh token available, skipping refresh')
      return
    }

    // Prevent refresh storms
    refreshAttemptRef.current++
    if (refreshAttemptRef.current > 3) {
      console.error('[Auth] Too many refresh attempts, giving up')
      clearTokens()
      setUser(null)
      return
    }

    try {
      console.debug('[Auth] Attempting token refresh...')
      const data = await supabaseRefreshToken(refreshToken)
      refreshAttemptRef.current = 0 // Reset attempt counter
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
      const payload = decodeJwt(data.access_token)
      const newUser = userFromPayload(payload)
      setUser(newUser)
      scheduleRefresh(data.access_token)
      console.debug('[Auth] Token refreshed successfully')
    } catch (err) {
      console.error('[Auth] Token refresh failed:', err.message)
      clearTokens()
      setUser(null)
    }
  }, [scheduleRefresh])

  // On mount: check if we need to refresh expired token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      // No token stored, auth is ready
      setIsInitialized(true)
      return
    }

    if (isTokenExpired(token)) {
      // Token is expired, try to refresh it
      attemptRefresh()
    } else {
      // Token is valid, schedule refresh before expiry
      scheduleRefresh(token)
    }

    setIsInitialized(true)

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Login with email and password
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await supabaseSignIn(email, password)
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
      const payload = decodeJwt(data.access_token)
      const newUser = userFromPayload(payload)
      setUser(newUser)
      scheduleRefresh(data.access_token)
      refreshAttemptRef.current = 0
      console.debug('[Auth] Login successful')
      return newUser
    } catch (err) {
      console.error('[Auth] Login failed:', err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [scheduleRefresh])

  // Register with email and password
  const register = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await supabaseSignUp(email, password)
      if (data.access_token) {
        setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
        const payload = decodeJwt(data.access_token)
        const newUser = userFromPayload(payload)
        setUser(newUser)
        scheduleRefresh(data.access_token)
        refreshAttemptRef.current = 0
        console.debug('[Auth] Registration successful')
        return newUser
      }
      // Email confirmation required
      return { emailConfirmationRequired: true, email }
    } catch (err) {
      console.error('[Auth] Registration failed:', err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [scheduleRefresh])

  // Logout: clear tokens and user
  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshAttemptRef.current = 0
    clearTokens()
    setUser(null)
    console.debug('[Auth] Logged out')
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      isInitialized,
      login,
      register,
      logout,
      getAccessToken: getToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
