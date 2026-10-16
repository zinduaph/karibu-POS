import { backendUrl } from '../config'

const API_BASE_URL = `${backendUrl}/api`
const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'token'

const request = async (path, options = {}) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    throw new Error(
      'Unable to reach the backend. Check that the API server is running.',
      { cause: error },
    )
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

export const getSales = async () => {
  const firstPage = await request('/sales?page=1&limit=100')
  const sales = [...firstPage.sales]

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const response = await request(`/sales?page=${page}&limit=100`)
    sales.push(...response.sales)
  }

  return { ...firstPage, sales }
}

export const createSale = (sale) =>
  request('/sales', {
    method: 'POST',
    body: JSON.stringify(sale),
  })

export const collectCashPayment = ({ orderId, amountReceived }) =>
  request('/sales/cash-payment', {
    method: 'POST',
    body: JSON.stringify({ orderId, amountReceived }),
  })
