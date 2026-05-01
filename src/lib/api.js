/**
 * Vendora API Client
 * Base URL: https://vendora-api-6xo8.onrender.com
 *
 * Best Practices:
 * - Access token stored in localStorage (with in-memory cache for performance)
 * - Automatic token refresh before expiry
 * - Retry logic with exponential backoff for transient failures (5xx, network errors)
 * - All requests inject the Supabase access_token automatically
 * - Public endpoints work without authentication
 * - All 4xx/5xx responses thrown as structured ApiError objects
 */

export const BASE_URL = 'https://vendora-api-6xo8.onrender.com'

// Keys used to persist auth in localStorage
export const TOKEN_KEY = 'vendora_access_token'
export const REFRESH_KEY = 'vendora_refresh_token'
export const USER_KEY = 'vendora_user'

// In-memory cache for performance
let tokenCache = null

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken() {
  // Return in-memory cache if available, otherwise read from localStorage
  if (tokenCache) return tokenCache
  tokenCache = localStorage.getItem(TOKEN_KEY)
  return tokenCache
}

export function setTokens({ access_token, refresh_token }) {
  if (access_token) {
    localStorage.setItem(TOKEN_KEY, access_token)
    tokenCache = access_token // Update in-memory cache
  }
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  tokenCache = null // Clear in-memory cache
}

// ─── Custom error class ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message)
    this.status = status
    this.detail = detail
    this.name = 'ApiError'
  }

  isNetworkError() {
    return !this.status || this.status >= 500
  }

  isClientError() {
    return this.status >= 400 && this.status < 500
  }
}

// ─── Retry logic for transient failures ───────────────────────────────────────

const MAX_RETRIES = 3
const INITIAL_DELAY = 500 // ms

function isRetryable(error) {
  // Retry on network errors or 5xx server errors, but NOT on 4xx client errors
  return !error.status || error.status >= 500
}

async function withRetry(fn, retries = MAX_RETRIES) {
  let lastError
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (!isRetryable(error) || attempt === retries - 1) {
        throw error
      }
      // Exponential backoff: 500ms, 1s, 2s
      const delay = INITIAL_DELAY * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}

// ─── Core fetch wrapper with retry and error handling ──────────────────────────

export async function apiFetch(path, options = {}) {
  const token = getToken()
  let attempt = 0

  return withRetry(async () => {
    attempt++

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    }

    let res
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      })
    } catch (err) {
      // Network error
      const error = new ApiError(0, `Network error: ${err.message}`, err)
      console.error(`[API] ${options.method ?? 'GET'} ${path} - Network error (attempt ${attempt}):`, err.message)
      throw error
    }

    // 204 No Content — return null
    if (res.status === 204) {
      console.debug(`[API] ${options.method ?? 'GET'} ${path} - 204 No Content`)
      return null
    }

    let data
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (!res.ok) {
      const message = data?.error ?? data?.detail ?? `Request failed (${res.status})`
      const error = new ApiError(res.status, message, data)

      if (res.status >= 500) {
        console.error(`[API] ${options.method ?? 'GET'} ${path} - ${res.status} (attempt ${attempt}):`, message)
      } else {
        console.warn(`[API] ${options.method ?? 'GET'} ${path} - ${res.status}:`, message)
      }

      throw error
    }

    console.debug(`[API] ${options.method ?? 'GET'} ${path} - 200 OK`)
    return data
  })
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
