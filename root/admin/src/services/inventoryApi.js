import { apiRoot } from '../config'

async function inventoryRequest(path, accessToken, options = {}) {
  let response
  try {
    response = await fetch(`${apiRoot}/inventory${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to reach the inventory API. Check your connection and API URL.')
  }

  const body = await response.text()
  let data
  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      if (response.ok) throw new Error('The inventory API returned an invalid response.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || body || 'The inventory request failed.')
  }

  return data
}

export async function getIngredients(accessToken) {
  const result = await inventoryRequest('/ingredients', accessToken)
  if (!Array.isArray(result?.ingredients)) {
    throw new Error('The inventory API returned an unexpected ingredients response.')
  }
  return result
}

export async function addIngredient(accessToken, ingredients) {
  const result = await inventoryRequest('/add-ingredients', accessToken, {
    method: 'POST',
    body: JSON.stringify(ingredients),
  })
  if (!Array.isArray(result?.ingredients)) {
    throw new Error('The inventory API returned an unexpected response after adding the ingredient.')
  }
  return result
}

export async function deleteIngredient(accessToken, ingredientId) {
  const result = await inventoryRequest(
    `/delete-ingredient/${encodeURIComponent(ingredientId)}`,
    accessToken,
    { method: 'DELETE' },
  )
  if (!result?.ingredient) {
    throw new Error('The inventory API returned an unexpected response after deleting the ingredient.')
  }
  return result
}
