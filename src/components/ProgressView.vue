<template>
  <div class="progress-view">
    <section class="layer-card summary-layer">
      <VisitedSummaryCard
        :totalVisited="totalVisited"
        :totalBreweries="TOTAL_BREWERIES"
        :regionStats="regionStats"
        @timelineTap="scrollToTimeline"
        @regionTap="onSummaryRegionTap"
      />
    </section>

    <section v-if="hasVisitedRouteMap" class="layer-card route-layer">
      <h2 class="section-title">巡った足跡マップ</h2>
      <VisitedRouteMap
        :visitedBreweries="visitedHistoryRecords"
        :breweryCoordinates="breweryCoordinates"
      />
    </section>

    <section ref="timelineSectionRef" class="layer-card timeline-layer">
      <h2 class="section-title">訪問タイムライン</h2>
      <VisitTimeline :records="visitedHistoryRecords" />
    </section>

    <section ref="regionSectionRef" class="layer-card region-layer">
      <h2 class="section-title">地域別訪問状況</h2>
      <RegionAccordion
        :sections="regionSections"
        :activeRegion="activeRegion"
        :highlightedRegion="highlightedRegion"
        @toggle="toggleRegion"
      />
    </section>

    <section class="layer-card reset-layer">
      <button class="reset-history-btn" type="button" @click="$emit('resetVisited')">
        履歴リセット
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useProgressStats, REGIONS } from '../composables/useProgressStats'
import VisitedSummaryCard from './VisitedSummaryCard.vue'
import VisitedRouteMap from './VisitedRouteMap.vue'
import VisitTimeline from './VisitTimeline.vue'
import RegionAccordion from './RegionAccordion.vue'

const HIGHLIGHT_MS = 320
const TOTAL_BREWERIES = 82

const props = defineProps({
  breweries: {
    type: Map,
    required: true
  },
  visitRecords: {
    type: Object,
    required: true
  },
  visitedHistoryRecords: {
    type: Array,
    default: () => []
  },
  breweryCoordinates: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['resetVisited'])

const timelineSectionRef = ref(null)
const regionSectionRef = ref(null)
const activeRegion = ref(null)
const highlightedRegion = ref(null)
const highlightTimer = ref(null)

const { regionStats, totalVisited } = useProgressStats(
  computed(() => props.breweries),
  computed(() => props.visitRecords)
)

const regionSections = computed(() => {
  const grouped = {}
  for (const region of REGIONS) {
    grouped[region] = []
  }

  for (const [id, brewery] of props.breweries) {
    const region = brewery?.regionName
    if (!region || !grouped[region]) continue

    grouped[region].push({
      id: String(id),
      name: brewery?.name || `不明 ${id}`,
      visited: !!props.visitRecords[id]?.visited
    })
  }

  return REGIONS.map((region) => {
    const breweries = grouped[region].sort((a, b) => {
      const aNum = Number(a.id)
      const bNum = Number(b.id)
      if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
        return a.id.localeCompare(b.id, 'ja')
      }
      return aNum - bNum
    })

    const visited = breweries.reduce((count, item) => count + (item.visited ? 1 : 0), 0)
    const total = breweries.length
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0

    return {
      region,
      visited,
      total,
      percentage,
      breweries
    }
  })
})

const hasVisitedRouteMap = computed(() => {
  return props.visitedHistoryRecords.some((record) => {
    const breweryId = String(record?.breweryId || '')
    const visitedAtMs = new Date(record?.visitedAt || '').getTime()
    const point = props.breweryCoordinates[breweryId]
    return Number.isFinite(point?.x) && Number.isFinite(point?.y) && !Number.isNaN(visitedAtMs)
  })
})

const scrollToTimeline = () => {
  timelineSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const clearHighlightTimer = () => {
  if (highlightTimer.value !== null) {
    clearTimeout(highlightTimer.value)
    highlightTimer.value = null
  }
}

const onSummaryRegionTap = (region) => {
  activeRegion.value = region
  highlightedRegion.value = region
  regionSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  clearHighlightTimer()
  highlightTimer.value = setTimeout(() => {
    highlightedRegion.value = null
    highlightTimer.value = null
  }, HIGHLIGHT_MS)
}

const toggleRegion = (region) => {
  activeRegion.value = activeRegion.value === region ? null : region
}

onUnmounted(() => {
  clearHighlightTimer()
})
</script>

<style scoped>
.progress-view {
  --ink: #2a2a2a;
  --ink-subtle: #5c5c5c;
  --line-soft: rgba(184, 153, 71, 0.2);
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  width: min(100%, 560px);
  margin: 0 auto;
  padding-bottom: var(--space-24);
}

.layer-card {
  background: linear-gradient(180deg, rgba(253, 251, 238, 0.98) 0%, rgba(246, 240, 227, 0.98) 100%);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: var(--space-16);
  box-shadow:
    0 6px 14px rgba(42, 42, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.summary-layer {
  padding: 0;
  overflow: hidden;
}

.section-title {
  margin: 0 0 var(--space-12);
  font-size: 15px;
  letter-spacing: 0.04em;
  color: var(--ink);
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 700;
}

.reset-layer {
  padding: var(--space-16);
}

.reset-history-btn {
  width: 100%;
  border: 1px solid rgba(184, 153, 71, 0.4);
  background: linear-gradient(180deg, #fdfbee, #fafaea);
  color: #8a7335;
  border-radius: 999px;
  font-size: 14px;
  font-family: "Noto Sans JP", sans-serif;
  font-weight: 600;
  padding: 12px var(--space-16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

@media (max-width: 420px) {
  .progress-view {
    gap: var(--space-16);
  }
}
</style>
