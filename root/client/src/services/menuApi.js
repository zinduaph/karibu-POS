import { backendUrl } from '../config'
import { authenticatedFetch } from './authenticatedFetch'
import { getCachedMenuItems, saveCachedMenuItems } from './offlineOrders'

export async function getMenuItems(restaurantId) {
  if (!restaurantId) {
    throw new Error('Your restaurant session is unavailable. Reconnect and sign in again.')
  }

  if (!navigator.onLine) {
    const cachedItems = await getCachedMenuItems(restaurantId)
    if (cachedItems) return cachedItems
    throw new Error('No saved menu is available offline. Connect to the internet to load it first.')
  }

  const headers = new Headers()

  let response
  try {
    response = await authenticatedFetch(`${backendUrl}/api/menu-items`, { headers })
  } catch (cause) {
    const cachedItems = await getCachedMenuItems(restaurantId)
    if (cachedItems) return cachedItems
    throw new Error('Unable to reach the backend and no menu is saved on this device.', { cause })
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

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || body || `Menu request failed (${response.status})`)
  }
  if (!Array.isArray(data?.menuItems)) {
    throw new Error('The menu API returned an unexpected menu items response.')
  }

  try {
    await saveCachedMenuItems(restaurantId, data.menuItems)
  } catch (error) {
    console.error('Unable to cache menu items for offline use:', error)
  }
  return data.menuItems
}
