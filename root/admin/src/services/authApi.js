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
