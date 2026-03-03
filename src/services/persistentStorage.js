import { openDB } from 'idb'

const DB_NAME = 'sakenojin_app'
const DB_VERSION = 1
const STORE_NAME = 'keyval'
const MIGRATION_FLAG_KEY = '__migrated_from_local_storage_v1'

const LEGACY_KEYS = [
  'niigata_sakenojin_visited',
  'sakenojin_state_v1',
  'visitedBreweries',
  'sake_visited',
  'hasVisitedBooth',
  'pwaPromptDismissed'
]

let dbPromise = null
let migrationPromise = null

const getLocalStorage = () => {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

const getDb = async () => {
  if (typeof window === 'undefined' || !window.indexedDB) return null

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    }).catch(() => null)
  }

  return dbPromise
}

const migrateLocalStorageIfNeeded = async () => {
  if (migrationPromise) return migrationPromise

  migrationPromise = (async () => {
    const db = await getDb()
    if (!db) return

    const migrated = await db.get(STORE_NAME, MIGRATION_FLAG_KEY)
    if (migrated === 'true') return

    const localStorage = getLocalStorage()
    if (localStorage) {
      for (const key of LEGACY_KEYS) {
        const existing = await db.get(STORE_NAME, key)
        if (existing != null) continue

        const localValue = localStorage.getItem(key)
        if (localValue != null) {
          await db.put(STORE_NAME, localValue, key)
        }
      }
    }

    await db.put(STORE_NAME, 'true', MIGRATION_FLAG_KEY)
  })().catch(() => {
    // IndexedDB migration failure falls back to localStorage reads/writes.
  })

  return migrationPromise
}

export const getStorageItem = async (key) => {
  const db = await getDb()
  if (db) {
    try {
      await migrateLocalStorageIfNeeded()
      const value = await db.get(STORE_NAME, key)
      if (value != null) return String(value)
    } catch {
      // Continue to localStorage fallback.
    }
  }

  const localStorage = getLocalStorage()
  return localStorage ? localStorage.getItem(key) : null
}

export const getStorageItems = async (keys) => {
  const pairs = await Promise.all(
    keys.map(async (key) => [key, await getStorageItem(key)])
  )
  return Object.fromEntries(pairs)
}

export const setStorageItem = async (key, value) => {
  const stringValue = String(value)
  const db = await getDb()
  if (db) {
    try {
      await migrateLocalStorageIfNeeded()
      await db.put(STORE_NAME, stringValue, key)
      return
    } catch {
      // Continue to localStorage fallback.
    }
  }

  const localStorage = getLocalStorage()
  if (!localStorage) return
  try {
    localStorage.setItem(key, stringValue)
  } catch {
    // noop
  }
}

export const removeStorageItem = async (key) => {
  const db = await getDb()
  if (db) {
    try {
      await migrateLocalStorageIfNeeded()
      await db.delete(STORE_NAME, key)
    } catch {
      // Continue to localStorage fallback.
    }
  }

  const localStorage = getLocalStorage()
  if (!localStorage) return
  try {
    localStorage.removeItem(key)
  } catch {
    // noop
  }
}
