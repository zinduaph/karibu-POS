<<<<<<< HEAD
import { backendUrl } from '../config'

const API_BASE_URL = `${backendUrl}/api`
const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'token'

export const getStoredToken = () => window.localStorage.getItem(AUTH_TOKEN_KEY)

export const getStoredUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    window.localStorage.removeItem('user')
    return null
  }
}

export const getStoredRestaurant = () => {
  try {
    return JSON.parse(window.localStorage.getItem('restaurant') || 'null')
  } catch {
    window.localStorage.removeItem('restaurant')
    return null
  }
}

export const clearSession = () => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('restaurant')
}

const persistAdminSession = (data) => {
  if (data.user?.role !== 'admin' || !data.accessToken) {
    throw new Error('The server returned an invalid admin session.')
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken)
  window.localStorage.setItem('user', JSON.stringify(data.user))
  if (data.restaurant) {
    window.localStorage.setItem('restaurant', JSON.stringify(data.restaurant))
  }
  return data
}

const postAuth = async (path, payload) => {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error('Unable to reach the backend. Check that the API server is running.', {
      cause: error,
    })
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    const validationErrors = data.errors
    const message =
      Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors.map(({ field, message: issue }) => `${field}: ${issue}`).join(' ')
        : data.message || `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export const adminRegister = async (payload) =>
  persistAdminSession(await postAuth('/auth/admin/register', payload))

export const adminLogin = async ({ email, password }) => {
  return persistAdminSession(await postAuth('/auth/admin/login', { email, password }))
}

export const cashierRegister = async ({ name, username, pin }) => {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/auth/cashier/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ name, username, pin }),
    })
  } catch (error) {
    throw new Error('Unable to reach the backend. Check that the API server is running.', {
      cause: error,
    })
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    const validationErrors = data.errors
    const message =
      Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors.map(({ field, message: issue }) => `${field}: ${issue}`).join(' ')
        : data.message || `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
=======
import { authApiUrl } from '../config'

export class AuthApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
  }
}

export async function authRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${authApiUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to reach the authentication server. Check your connection and API URL.')
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
>>>>>>> 61924c3bf27ac1f8dd1d0fe45d66ff45031f43e2
  }

  return data
}
<<<<<<< HEAD
=======

export function registerCashier(accessToken, values) {
  return authRequest('/cashier/register', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(values),
  })
}

export async function getCashiers(accessToken) {
  const result = await authRequest('/get-cashier', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!Array.isArray(result?.cashiers)) {
    throw new Error('The authentication API returned an unexpected cashier list response.')
  }
  return result.cashiers
}
>>>>>>> 61924c3bf27ac1f8dd1d0fe45d66ff45031f43e2
