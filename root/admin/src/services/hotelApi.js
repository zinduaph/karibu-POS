import { apiRoot } from '../config'

async function requestHotelDetails(accessToken, method = 'GET', details) {
  let response
  try {
    response = await fetch(`${apiRoot}/products/hotel-details`, {
      method,
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(details ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(details ? { body: JSON.stringify(details) } : {}),
    })
  } catch {
    throw new Error('Unable to reach the hotel settings API. Check your connection and API URL.')
  }

  const body = await response.text()
  let data
  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      if (response.ok) throw new Error('The hotel settings API returned an invalid response.')
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || body || 'The hotel settings request failed.')
  }
  return data
}

export async function getHotelDetails(accessToken) {
  const result = await requestHotelDetails(accessToken)
  return result.hotelDetails
}

export async function saveHotelDetails(accessToken, details) {
  const result = await requestHotelDetails(accessToken, 'POST', details)
  if (!result?.hotelDetails) {
    throw new Error('The hotel settings API returned an unexpected response after saving.')
  }
  return result.hotelDetails
}
