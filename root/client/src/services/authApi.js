import { backendUrl } from '../config'
import { getAccessToken, setAccessToken } from './authToken'
import { authenticatedFetch } from './authenticatedFetch'

const AUTH_BASE_URL = `${backendUrl}/api/auth`

export class AuthApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
  }
}

export async function authRequest(path, options = {}) {
  const { accessToken: includeAccessToken, ...requestOptions } = options
  const headers = new Headers(requestOptions.headers || {})
  if (requestOptions.body) headers.set('Content-Type', 'application/json')
  if (includeAccessToken) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    const url = `${AUTH_BASE_URL}${path}`
    response = includeAccessToken
      ? await authenticatedFetch(url, { ...requestOptions, headers })
      : await fetch(url, { ...requestOptions, credentials: 'include', headers })
  } catch (error) {
    throw new Error('Unable to reach the authentication server. Check your connection and API URL.', {
      cause: error,
    })
  }

  const body = await response.text()
  let data
  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      if (response.ok) throw new Error('The authentication server returned an invalid response.')
    }
  }

  if (!response.ok) {
    const validationErrors = Array.isArray(data?.errors)
      ? data.errors.map(({ field, message }) => `${field}: ${message}`).join(' ')
      : ''
    throw new AuthApiError(
      validationErrors || data?.message || body || 'Authentication request failed.',
      response.status,
    )
  }

  return data
}

export const getStoredToken = () => null // No longer stored in localStorage - use httpOnly cookie instead

export const clearSession = () => {
  // No localStorage to clear - browser handles httpOnly cookie destruction via logout endpoint
  setAccessToken('')
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('restaurant')
}

export const persistSession = (payload) => {
  // No longer persists to localStorage - auth state managed by httpOnly cookies
  // Browser automatically sends rt cookie with every same-origin request
  // Optionally store minimal user info in localStorage if needed for non-auth UI
  if (payload?.accessToken) setAccessToken(payload.accessToken)
  if (payload?.user) {
    window.localStorage.setItem('user', JSON.stringify(payload.user))
  }
  if (payload?.restaurant) {
    window.localStorage.setItem('restaurant', JSON.stringify(payload.restaurant))
  }
}

export const adminRegister = async (payload) => {
  return authRequest('/admin/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const adminLogin = async (payload) => {
  const data = await authRequest('/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  persistSession(data)
  return data
}

export const cashierLogin = async (payload) => {
  const data = await authRequest('/cashier/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  persistSession(data)
  return data
}

export const cashierRegister = async (payload) => {
  const data = await authRequest('/cashier/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export const changeCashierPin = async ({ currentPin, newPin }) => {
  const data = await authRequest('/change-pin', {
    method: 'POST',
    body: JSON.stringify({ currentPin, newPin }),
  })
  persistSession(data)
  return data
}

export const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const data = await authRequest('/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  persistSession(data)
  return data
}

export const markOnboardingComplete = async () => {
  return authRequest('/onboarding/complete', { method: 'POST' })
}
