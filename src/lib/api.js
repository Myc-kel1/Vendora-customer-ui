/**
 * Vendora API Client
 * Base URL: https://vendora-api-6xo8.onrender.com
 *
 * All requests inject the Supabase access_token from localStorage.
 * All 4xx/5xx responses are thrown as structured ApiError objects.
 */

export const BASE_URL = 'https://vendora-api-6xo8.onrender.com'

// Keys used to persist auth in localStorage
export const TOKEN_KEY = 'vendora_access_token'
export const REFRESH_KEY = 'vendora_refresh_token'
export const USER_KEY = 'vendora_user'

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(TOKEN_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

// ─── Custom error class ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message)
    this.status = status
    this.detail = detail
    this.name = 'ApiError'
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export async function apiFetch(path, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  // 204 No Content — return null
  if (res.status === 204) return null

  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message = data?.error ?? data?.detail ?? `Request failed (${res.status})`
    throw new ApiError(res.status, message, data)
  }

  return data
}

// ─── Supabase Auth (direct — not through our backend) ────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function supabaseSignUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new ApiError(res.status, data.error_description ?? data.msg ?? 'Sign up failed', data)
  return data
}

export async function supabaseSignIn(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new ApiError(res.status, data.error_description ?? data.msg ?? 'Sign in failed', data)
  return data
}

export async function supabaseRefreshToken(refresh_token) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new ApiError(res.status, 'Token refresh failed', data)
  return data
}

// ─── JWT decoder (no library needed) ─────────────────────────────────────────

export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwt(token)
  if (!payload?.exp) return true
  // Give a 30s buffer so we refresh before actual expiry
  return payload.exp * 1000 < Date.now() + 30_000
}
