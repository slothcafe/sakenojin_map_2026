<template>
  <div v-if="hasPlottedPoints" class="visited-route-map">
    <svg
      class="route-svg"
      viewBox="0 0 1040 448"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      :aria-label="ariaLabel"
      preserveAspectRatio="xMidYMid meet"
    >
      <g class="booth-map">
        <g v-for="booth in boothCells" :key="`booth-${booth.id}`" class="booth-cell-group">
          <rect
            class="booth-cell"
            :class="{ 'is-visited': visitedBreweryIdSet.has(booth.id) }"
            :x="booth.left"
            :y="booth.top"
            :width="BOOTH_SIZE"
            :height="BOOTH_SIZE"
            rx="8"
          />
          <text
            class="booth-id"
            :class="{ 'is-visited': visitedBreweryIdSet.has(booth.id) }"
            :x="booth.x"
            :y="booth.y + 3"
            text-anchor="middle"
          >
            {{ booth.id }}
          </text>
          <title v-if="booth.visitedName">{{ booth.visitedName }}</title>
        </g>
      </g>
      <polyline
        v-if="hasRouteLine"
        class="route-line"
        :points="polylinePoints"
      />
      <g class="route-points">
        <circle
          v-for="(point, index) in plottedPoints"
          :key="`${point.breweryId}-${point.visitedAt}`"
          class="route-point"
          :class="{ 'is-start': index === 0, 'is-latest': index === latestIndex }"
          :cx="point.x"
          :cy="point.y"
          :r="index === 0 ? 4.4 : 3.4"
          :opacity="index === latestIndex ? 1 : 0.7"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const BOOTH_SIZE = 64

const props = defineProps({
  visitedBreweries: {
    type: Array,
    default: () => []
  },
  breweryCoordinates: {
    type: Object,
    default: () => ({})
  }
})

const sortedVisitedBreweries = computed(() => {
  return props.visitedBreweries
    .slice()
    .filter((record) => {
      if (!record?.breweryId || !record?.visitedAt) return false
      return !Number.isNaN(new Date(record.visitedAt).getTime())
    })
    .sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime())
})

const plottedPoints = computed(() => {
  return sortedVisitedBreweries.value
    .map((record) => {
      const breweryId = String(record.breweryId)
      const coordinate = props.breweryCoordinates[breweryId]
      const x = Number(coordinate?.x)
      const y = Number(coordinate?.y)

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null
      }

      return {
        breweryId,
        visitedAt: record.visitedAt,
        x,
        y
      }
    })
    .filter(Boolean)
})

const visitedBreweryIdSet = computed(() => {
  const ids = new Set()
  sortedVisitedBreweries.value.forEach((record) => {
    ids.add(String(record.breweryId))
  })
  return ids
})

const visitedNameMap = computed(() => {
  const names = {}
  sortedVisitedBreweries.value.forEach((record) => {
    const key = String(record.breweryId)
    if (typeof record.breweryName === 'string' && record.breweryName) {
      names[key] = record.breweryName
    }
  })
  return names
})

const boothCells = computed(() => {
  const cells = []
  Object.entries(props.breweryCoordinates).forEach(([id, coordinate]) => {
    const x = Number(coordinate?.x)
    const y = Number(coordinate?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    cells.push({
      id: String(id),
      x,
      y,
      left: x - BOOTH_SIZE / 2,
      top: y - BOOTH_SIZE / 2,
      visitedName: visitedNameMap.value[String(id)] || ''
    })
  })

  cells.sort((a, b) => {
    const aId = Number(a.id)
    const bId = Number(b.id)
    if (Number.isNaN(aId) || Number.isNaN(bId)) {
      return a.id.localeCompare(b.id, 'ja')
    }
    return aId - bId
  })
  return cells
})

const latestIndex = computed(() => plottedPoints.value.length - 1)
const hasPlottedPoints = computed(() => plottedPoints.value.length > 0)
const hasRouteLine = computed(() => plottedPoints.value.length >= 2)

const polylinePoints = computed(() => {
  return plottedPoints.value
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
})

const ariaLabel = computed(() => {
  if (!hasPlottedPoints.value) return '巡った足跡マップ'
  if (hasRouteLine.value) return `訪問順で${plottedPoints.value.length}地点を接続した巡った足跡マップ`
  return '1地点の巡った足跡マップ'
})
</script>

<style scoped>
.visited-route-map {
  width: 100%;
}

.route-svg {
  display: block;
  width: 100%;
  height: 220px;
  animation: route-fade-in 0.3s ease both;
}

.route-line {
  fill: none;
  stroke: #9a8652;
  stroke-width: 2.4;
  opacity: 0.82;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.route-point {
  fill: #9a8652;
  stroke: rgba(253, 251, 238, 0.9);
  stroke-width: 0.8;
}

.booth-cell {
  fill: rgba(128, 110, 73, 0.08);
  stroke: rgba(128, 110, 73, 0.32);
  stroke-width: 1.15;
}

.booth-cell.is-visited {
  fill: rgba(184, 153, 71, 0.22);
  stroke: rgba(154, 134, 82, 0.52);
}

.booth-id {
  fill: rgba(84, 71, 43, 0.72);
  font-size: 24px;
  font-family: "Noto Sans JP", sans-serif;
  font-weight: 700;
  stroke: rgba(253, 251, 238, 0.95);
  stroke-width: 1.2;
  paint-order: stroke fill;
  pointer-events: none;
}

.booth-id.is-visited {
  fill: rgba(68, 53, 27, 0.9);
}

@media (max-width: 420px) {
  .route-svg {
    height: 216px;
  }

  .booth-id {
    font-size: 12px;
  }
}

@keyframes route-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
