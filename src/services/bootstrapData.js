import { getStorageItems } from './persistentStorage.js'
const LOCAL_STATE_KEY = 'sakenojin_state_v1'

let cachedBootstrapData = null
let cachedBootstrapPromise = null

const safeParse = (raw, fallback) => {
  if (!raw) return fallback

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const loadHistoryData = async () => {
  if (typeof window === 'undefined') {
    return {
      state: {},
      visitedBreweries: [],
      sakeVisited: {}
    }
  }

  const stored = await getStorageItems([
    LOCAL_STATE_KEY,
    'visitedBreweries',
    'sake_visited'
  ])

  return {
    state: safeParse(stored[LOCAL_STATE_KEY], {}),
    visitedBreweries: safeParse(stored.visitedBreweries, []),
    sakeVisited: safeParse(stored.sake_visited, {})
  }
}

export const loadBreweryData = async () => {
  const [breweriesModule, scoresModule, flavorModule] = await Promise.all([
    import('../assets/data/breweries/niigata_sakenojin_breweries_list_sample.json'),
    import('../assets/data/breweries/brewery_scores_sample.json'),
    import('../assets/data/breweries/brewery_flavor_sample.json')
  ])

  return {
    breweriesData: breweriesModule.default ?? [],
    breweryScores: scoresModule.default ?? [],
    breweryFlavor: flavorModule.default ?? []
  }
}


export const primeBootstrapData = (data) => {
  cachedBootstrapData = data
  cachedBootstrapPromise = Promise.resolve(data)
}

export const loadBootstrapData = () => {
  if (cachedBootstrapData) {
    return Promise.resolve(cachedBootstrapData)
  }

  if (cachedBootstrapPromise) {
    return cachedBootstrapPromise
  }

  cachedBootstrapPromise = Promise.all([loadBreweryData(), loadHistoryData()])
    .then(([breweryData, historyData]) => {
      cachedBootstrapData = {
        ...breweryData,
        historyData
      }
      return cachedBootstrapData
    })
    .catch((error) => {
      cachedBootstrapPromise = null
      throw error
    })

  return cachedBootstrapPromise
}

export const getCachedBootstrapData = () => cachedBootstrapData
