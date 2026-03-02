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
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      state: {},
      visitedBreweries: [],
      sakeVisited: {}
    }
  }

  return {
    state: safeParse(localStorage.getItem(LOCAL_STATE_KEY), {}),
    visitedBreweries: safeParse(localStorage.getItem('visitedBreweries'), []),
    sakeVisited: safeParse(localStorage.getItem('sake_visited'), {})
  }
}

export const loadBreweryData = async () => {
  const [breweriesModule, scoresModule, flavorModule] = await Promise.all([
    import('../../niigata_sakenojin_breweries_list.json'),
    import('../../brewery_scores.json'),
    import('../../brewery_flavor.json')
  ])

  return {
    breweriesData: breweriesModule.default ?? [],
    breweryScores: scoresModule.default ?? [],
    breweryFlavor: flavorModule.default ?? []
  }
}

export const loadMapData = async () => {
  const mapModule = await import('../../niigata_region_map.json')
  return mapModule.default ?? null
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

  cachedBootstrapPromise = Promise.all([loadBreweryData(), loadMapData(), loadHistoryData()])
    .then(([breweryData, mapData, historyData]) => {
      cachedBootstrapData = {
        ...breweryData,
        mapData,
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
