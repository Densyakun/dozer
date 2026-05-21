'use client'

const DB_NAME = 'dozer-persistence'
const STORE_NAME = 'keyval'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
  })
}

export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(name)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result ?? null)
      tx.oncomplete = () => db.close()
    })
  },

  setItem: async (name: string, value: string): Promise<void> => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(value, name)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
    })
  },

  removeItem: async (name: string): Promise<void> => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(name)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
    })
  },
}
