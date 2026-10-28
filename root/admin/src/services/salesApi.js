import { apiRoot } from '../config'

export async function getSales(accessToken, page = 1, limit = 10, status) {
  let response
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) query.set('status', status)

  try {
    response = await fetch(`${apiRoot}/sales?${query}`, {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch {
    throw new Error('Unable to reach the sales API. Check your connection and API URL.')
  }

  const body = await response.text()
  let data
  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      if (response.ok) throw new Error('The sales API returned an invalid response.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || body || 'The sales request failed.')
  }
  if (!Array.isArray(data?.sales) || !Number.isInteger(data?.totalPages)) {
    throw new Error('The sales API returned an unexpected orders response.')
  }

  return data
}

export async function getAllSales(accessToken) {
  const firstPage = await getSales(accessToken, 1, 100)
  const sales = [...firstPage.sales]

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await getSales(accessToken, page, 100)
    sales.push(...result.sales)
  }

  return sales
}
