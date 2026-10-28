import { backendUrl } from '../config'
import { getAccessToken } from './authToken'

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
  const headers = new Headers(requestOptions.headers)
  if (requestOptions.body) headers.set('Content-Type', 'application/json')
  if (includeAccessToken) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`${AUTH_BASE_URL}${path}`, {
      ...requestOptions,
      credentials: 'include',
      headers,
    })
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
