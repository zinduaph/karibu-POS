import { authApiUrl } from '../config'

const STORAGE_KEY_TOKEN = 'karibu_access_token';
const STORAGE_KEY_RESTAURANT = 'karibu_restaurant';

export function getStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function getStoredRestaurant() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESTAURANT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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
  }

  return data
}

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

export async function deleteCashier(accessToken, cashierId) {
  const result = await authRequest(`/delete-cashier/${encodeURIComponent(cashierId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (typeof result?.message !== 'string') {
    throw new Error('The authentication API returned an unexpected response after deleting the cashier.')
  }
  return result
}

export async function resetAdminPassword(accessToken, newpassword) {
  const result = await authRequest('/reset-admin-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ newpassword }),
  })
  if (typeof result?.message !== 'string') {
    throw new Error('The authentication API returned an unexpected response after resetting the password.')
  }
  return result
}

export async function requestAdminPasswordReset(email) {
  return authRequest('/admin/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function completeAdminPasswordReset(email, code, newPassword) {
  return authRequest('/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  })
}
