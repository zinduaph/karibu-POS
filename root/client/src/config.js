export const backendUrl = (
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

export const salesApiUrl = (
  import.meta.env.VITE_SALES_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '')
