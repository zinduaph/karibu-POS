import { backendUrl } from '../config'
import { getAccessToken, setAccessToken } from './authToken'

let refreshRequest

export async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.accessToken) {
        throw new Error(data.message || 'Your session has expired. Please sign in again.')
      }
      setAccessToken(data.accessToken)
      return data
    })().finally(() => {
      refreshRequest = null
    })
  }
  return refreshRequest
}

export async function authenticatedFetch(url, options = {}) {
  let token = getAccessToken()
  if (!token) {
    try {
      const session = await refreshAccessToken()
      token = session.accessToken
    } catch {
      // The request will return its usual unauthorized response if there is no session.
    }
  }

  const send = (accessToken) => {
    const headers = new Headers(options.headers)
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    })
  }

  let response = await send(token)
  if (response.status === 401 && token) {
    try {
      const session = await refreshAccessToken()
      response = await send(session.accessToken)
    } catch {
      return response
    }
  }
  return response
}
