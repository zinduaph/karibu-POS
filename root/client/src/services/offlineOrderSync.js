import { createSale } from './salesApi'
import { getOrdersLocally, removeOrderLocally } from './offlineOrders'

let activeSync

export function syncOfflineOrders(restaurantId) {
  if (!restaurantId) return Promise.resolve()
  if (activeSync) return activeSync

  activeSync = (async () => {
    if (!navigator.onLine) return

    const queuedOrders = (await getOrdersLocally())
      .filter((order) => order.restaurantId === restaurantId)
    for (const order of queuedOrders) {
      try {
        await createSale(order)
        await removeOrderLocally(order.clientOrderId)
      } catch (error) {
        console.error(`Unable to sync offline order ${order.clientOrderId}:`, error)
        if (error.code === 'NETWORK_ERROR') break
      }
    }
  })().finally(() => {
    activeSync = null
  })

  return activeSync
}
