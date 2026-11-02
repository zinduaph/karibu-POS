import { backendUrl } from '../config'
import { getAccessToken } from './authToken'

const API_BASE_URL = `${backendUrl}/api`

const request = async (path, options = {}) => {
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (cause) {
    const error = new Error(
      'Unable to reach the backend. Check your connection.',
      { cause },
    )
    error.code = 'NETWORK_ERROR'
    throw error
  }

  let data
  try {
    data = await response.json()
  } catch (cause) {
    const error = new Error(
      response.ok
        ? 'The backend returned an invalid response.'
        : `Request failed (${response.status}).`,
      { cause },
    )
    error.status = response.status
    error.code = response.ok ? 'INVALID_RESPONSE' : undefined
    throw error
  }
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

export const recordTillPayment = ({ orderId, receiptLast4 }) =>
  request('/sales/till-payment', {
    method: 'POST',
    body: JSON.stringify({ orderId, receiptLast4 }),
  })

export const sendMpesaPrompt = ({ orderId, phoneNumber }) =>
  request('/sales/mpesa-prompt', {
    method: 'POST',
    body: JSON.stringify({ orderId, phoneNumber }),
  })
