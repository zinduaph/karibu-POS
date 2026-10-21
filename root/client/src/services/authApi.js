import { backendUrl } from '../config'

const API_BASE_URL = `${backendUrl}/api`

export const getStoredToken = () => null // No longer stored in localStorage - use httpOnly cookie instead

export const clearSession = () => {
  // No localStorage to clear - browser handles httpOnly cookie destruction via logout endpoint
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('restaurant')
}

export const persistSession = (payload) => {
  // No longer persists to localStorage - auth state managed by httpOnly cookies
  // Browser automatically sends rt cookie with every same-origin request
  // Optionally store minimal user info in localStorage if needed for non-auth UI
  if (payload?.user) {
    window.localStorage.setItem('user', JSON.stringify(payload.user))
  }
  if (payload?.restaurant) {
    window.localStorage.setItem('restaurant', JSON.stringify(payload.restaurant))
  }
}

const request = async (path, options = {}) => {
  // credentials: 'include' automatically sends httpOnly cookies (rt refresh token)
  // No need to manually attach Bearer token - cookie handles auth
  const headers = new Headers(options.headers || {})

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include', // <--- CRITICAL: sends httpOnly cookie automatically
      headers,
    })
  } catch (error) {
    throw new Error('Unable to reach the backend. Check that the API server is running.', {
      cause: error,
    })
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.message === 'Invalid credentials' || data.message === 'Unauthorized' || data.message === 'No refresh token cookie') {
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
  // persistSession no longer sets auth tokens - they're in httpOnly cookies
  // We still store minimal user info for UI convenience
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

export const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const data = await request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  persistSession(data)
  return data
}

export const getOnboardingStatus = async () => {
  return request('/auth/onboarding/status', { method: 'GET' })
}

export const adminChangePassword = async ({ currentPassword, newPassword }) => {
  return request('/auth/onboarding/admin/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export const updateRestaurantDetails = async (payload) => {
  return request('/auth/onboarding/restaurant/details', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const markOnboardingComplete = async () => {
  return request('/auth/onboarding/complete', { method: 'POST' })
}

export const addProduct = async (payload) => {
  return request('/auth/onboarding/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const listProducts = async () => {
  return request('/auth/onboarding/products', { method: 'GET' })
}

export const updateProduct = async (id, payload) => {
  return request(`/auth/onboarding/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const deleteProduct = async (id) => {
  return request(`/auth/onboarding/products/${id}`, { method: 'DELETE' })
}