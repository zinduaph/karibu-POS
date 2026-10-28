import { apiRoot } from '../config'

export async function addMenuItem(accessToken, menuItem) {
  let response
  try {
    response = await fetch(`${apiRoot}/menu-items`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(menuItem),
    })
  } catch {
    throw new Error('Unable to reach the menu API. Check your connection and API URL.')
  }

  const body = await response.text()
  let data
  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      if (response.ok) throw new Error('The menu API returned an invalid response.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || body || 'The menu item could not be added.')
  }
  if (!data?.menuItem) {
    throw new Error('The menu API returned an unexpected response after adding the item.')
  }

  return data.menuItem
}

async function requestMenuItems(path, accessToken, method = 'GET') {
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${accessToken}`)

  let response
  try {
    response = await fetch(`${apiRoot}/menu-items${path}`, {
      method,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new Error('Unable to reach the menu API. Check your connection and API URL.')
  }

  const body = await response.text()
  let data
  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      if (response.ok) throw new Error('The menu API returned an invalid response.')
    }
  }
  if (!response.ok) {
    throw new Error(data?.message || body || 'The menu request failed.')
  }
  return data
}

export async function getMenuItems(accessToken) {
  const result = await requestMenuItems('', accessToken)
  if (!Array.isArray(result?.menuItems)) {
    throw new Error('The menu API returned an unexpected menu items response.')
  }
  return result.menuItems
}

export async function deleteMenuItem(accessToken, menuItemId) {
  const result = await requestMenuItems(`/${encodeURIComponent(menuItemId)}`, accessToken, 'DELETE')
  if (result?.success !== true) {
    throw new Error('The menu API returned an unexpected response after deleting the item.')
  }
  return result
}
