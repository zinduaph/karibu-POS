export const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/+$/, '') || ''

export const apiRoot = backendUrl
  ? `${backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`}`
  : '/api'

export const authApiUrl = `${apiRoot}/auth`
