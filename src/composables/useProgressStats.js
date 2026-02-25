import { computed } from 'vue'

// 地域の定義（表示順・表示名）
export const REGIONS = ['上越', '中越', '下越', '佐渡']

/**
 * 酒造データと訪問記録から進捗統計を算出するコンポーザブル
 *
 * @param {import('vue').Ref<Map>} breweries - BreweryドメインモデルのMap（id => brewery）
 * @param {import('vue').Ref<Object>} visitRecords - ブース状態オブジェクト（id => { id, visited, favorite, memo }）
 * @returns 全体・地域別の集計値（computed）
 */
export function useProgressStats(breweries, visitRecords) {
  /**
   * 全酒造に対して地域別に集計する
   * 将来的に市区町村単位に拡張する場合は、同じパターンで
   * groupByKey を 'city' などに変えれば OK
   */
  const regionStats = computed(() => {
    // 初期値を作成
    const stats = {}
    for (const region of REGIONS) {
      stats[region] = { visited: 0, total: 0, percentage: 0 }
    }

    for (const [id, brewery] of breweries.value) {
      // breweryのregionはApp.vueでIDに変換されているため、元の地域名を使用
      const regionName = brewery.regionName // 「上越」「中越」「下越」「佐渡」
      if (!regionName || !stats[regionName]) continue

      stats[regionName].total++
      if (visitRecords.value[id]?.visited) {
        stats[regionName].visited++
      }
    }

    // パーセンテージを計算
    for (const region of REGIONS) {
      const s = stats[region]
      s.percentage = s.total > 0
        ? Math.round((s.visited / s.total) * 100)
        : 0
    }

    return stats
  })

  const totalCount = computed(() => {
    let count = 0
    for (const region of REGIONS) {
      count += regionStats.value[region].total
    }
    return count
  })

  const totalVisited = computed(() => {
    let visited = 0
    for (const region of REGIONS) {
      visited += regionStats.value[region].visited
    }
    return visited
  })

  const totalPercentage = computed(() =>
    totalCount.value > 0
      ? Math.round((totalVisited.value / totalCount.value) * 100)
      : 0
  )

  return { regionStats, totalCount, totalVisited, totalPercentage }
}
