const DB_NAME = 'karibu-pos'
const DB_VERSION = 2
const ORDER_STORE = 'orders'
const CACHE_STORE = 'cache'

function openOrdersDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ORDER_STORE)) {
        db.createObjectStore(ORDER_STORE, { keyPath: 'clientOrderId' })
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveOrderLocally(order) {
  const db = await openOrdersDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ORDER_STORE, 'readwrite')
    transaction.objectStore(ORDER_STORE).put(order)

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }

    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }

    transaction.onabort = () => {
      db.close()
      reject(transaction.error || new Error('Saving the order locally was cancelled.'))
    }
  })
}

export async function getOrdersLocally() {
  const db = await openOrdersDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ORDER_STORE, 'readonly')
    const request = transaction.objectStore(ORDER_STORE).getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
    transaction.onabort = () => {
      db.close()
      reject(transaction.error || new Error('Reading locally saved orders was cancelled.'))
    }
  })
}

export async function removeOrderLocally(clientOrderId) {
  const db = await openOrdersDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ORDER_STORE, 'readwrite')
    transaction.objectStore(ORDER_STORE).delete(clientOrderId)

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
    transaction.onabort = () => {
      db.close()
      reject(transaction.error || new Error('Removing the synced order was cancelled.'))
    }
  })
}

async function getCachedValue(key) {
  const db = await openOrdersDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHE_STORE, 'readonly')
    const request = transaction.objectStore(CACHE_STORE).get(key)

    request.onsuccess = () => resolve(request.result?.value ?? null)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
    transaction.onabort = () => {
      db.close()
      reject(transaction.error || new Error('Reading cached data was cancelled.'))
    }
  })
}

async function setCachedValue(key, value) {
  const db = await openOrdersDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHE_STORE, 'readwrite')
    transaction.objectStore(CACHE_STORE).put({ key, value })

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
    transaction.onabort = () => {
      db.close()
      reject(transaction.error || new Error('Saving cached data was cancelled.'))
    }
  })
}

export const getCachedMenuItems = (restaurantId) =>
  getCachedValue(`menu:${restaurantId}`)

export const saveCachedMenuItems = (restaurantId, menuItems) =>
  setCachedValue(`menu:${restaurantId}`, menuItems)

export const getCachedSales = (restaurantId) =>
  getCachedValue(`sales:${restaurantId}`)

export const saveCachedSales = (restaurantId, sales) =>
  setCachedValue(`sales:${restaurantId}`, sales)