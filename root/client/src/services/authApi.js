import { backendUrl } from '../config'

const API_BASE_URL = `${backendUrl}/api`
const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'token'

export const getStoredToken = () => window.localStorage.getItem(AUTH_TOKEN_KEY)

export const clearSession = () => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('restaurant')
}

export const persistSession = (payload) => {
  if (payload?.accessToken) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, payload.accessToken)
  }
  if (payload?.user) {
    window.localStorage.setItem('user', JSON.stringify(payload.user))
  }
  if (payload?.restaurant) {
    window.localStorage.setItem('restaurant', JSON.stringify(payload.restaurant))
  }
}

const request = async (path, options = {}) => {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    })
  } catch (error) {
    throw new Error('Unable to reach the backend. Check that the API server is running.', {
      cause: error,
    })
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || `Request failed (${response.status})`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const adminRegister = async (payload) => {
  return request('/auth/admin/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const adminLogin = async (payload) => {
  const data = await request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  persistSession(data)
  return data
}

export const cashierLogin = async (payload) => {
  const data = await request('/auth/cashier/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  persistSession(data)
  return data
}

export const cashierRegister = async (payload) => {
  const data = await request('/auth/cashier/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export const changeCashierPin = async ({ currentPin, newPin }) => {
  const data = await request('/auth/change-pin', {
    method: 'POST',
    body: JSON.stringify({ currentPin, newPin }),
  })
  persistSession(data)
  return data
}
