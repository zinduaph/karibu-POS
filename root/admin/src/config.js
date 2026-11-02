export const backendUrl = (
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
).replace(/\/+$/, '')

export const clientAppUrl = (
  import.meta.env.VITE_CLIENT_APP_URL || 'http://localhost:5173'
).replace(/\/+$/, '')

export const apiRoot = backendUrl
  ? `${backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`}`
  : '/api'

export const authApiUrl = `${apiRoot}/auth`
