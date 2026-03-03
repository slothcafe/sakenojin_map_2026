<template>
  <article class="summary-card">
    <h2 class="summary-title">巡歴サマリー</h2>

    <div class="summary-body">
      <button type="button" class="summary-tile chart-tile" @click="$emit('timelineTap')">
        <svg class="donut" :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="訪問進捗">
          <circle
            :cx="half"
            :cy="half"
            :r="radius"
            class="donut-track"
          />
          <circle
            :cx="half"
            :cy="half"
            :r="radius"
            class="donut-progress"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashOffset"
            :transform="`rotate(-90 ${half} ${half})`"
          />
          <text :x="half" :y="half - 6" text-anchor="middle" class="donut-count">
            {{ totalVisited }} / {{ totalBreweries }}
          </text>
          <text :x="half" :y="half + 14" text-anchor="middle" class="donut-pct">
            {{ percentage }}%
          </text>
        </svg>
        <span class="tile-caption">タップでタイムラインへ</span>
      </button>

      <div class="summary-tile map-tile">
        <div
          class="map-stage"
          :class="{ 'is-resettable': showMessage }"
          @click="onMapAreaTap"
        >
          <button
            v-if="!isPlaying"
            type="button"
            class="trajectory-trigger-btn"
            :disabled="!canPlayTrajectory"
            @click.stop="playTrajectory"
          >
            軌跡を見る
          </button>

          <svg
            v-if="!isPlaying"
            :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
            class="region-map"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="地域別訪問状況"
          >
            <g
              v-for="region in REGIONS"
              :key="region"
              class="map-region-group"
              tabindex="0"
              @click="$emit('regionTap', region)"
              @keydown.enter.prevent="$emit('regionTap', region)"
              @keydown.space.prevent="$emit('regionTap', region)"
            >
              <path
                :d="regionPaths[region].path"
                :fill="regionFill(region)"
                class="map-region"
              />
              <text :x="labelPositions[region].x" :y="labelPositions[region].y" text-anchor="middle" class="map-label">
                {{ region }}
              </text>
              <text
                :x="labelPositions[region].x"
                :y="labelPositions[region].y + 15"
                text-anchor="middle"
                class="map-stat"
              >
                {{ regionStats[region]?.visited || 0 }}/{{ regionStats[region]?.total || 0 }}
              </text>
            </g>
          </svg>

          <svg
            v-else
            :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
            class="region-map"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="訪問市町村の軌跡"
          >
            <g class="municipality-layer">
              <path
                v-for="municipality in municipalityPaths"
                :key="municipality.name"
                :d="municipality.path"
                :data-municipality="municipality.name"
                class="municipality-path"
                :class="municipalityClass(municipality.name)"
              />
            </g>
          </svg>

          <div
            class="trajectory-overlay"
            :class="{ 'is-visible': showOverlay }"
            aria-hidden="true"
          ></div>
        </div>
        <p class="trajectory-message" :class="{ 'is-visible': showMessage }">{{ trajectoryMessage }}</p>
        <p v-if="!showMessage" class="tile-caption">地域をタップで地域別一覧へ</p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import regionPaths from '../assets/niigata_region_paths.json'
import municipalitiesGeoJson from '../../niigata_municipalities_map.json'

const REGIONS = ['上越', '中越', '下越', '佐渡']
const VIEWBOX_WIDTH = 300
const VIEWBOX_HEIGHT = 320
const MAP_PADDING = 12
const OVERLAY_FADE_MS = 250
const STEP_INTERVAL_MS = 700
const FINAL_HOLD_MS = 900

defineEmits(['timelineTap', 'regionTap'])

const props = defineProps({
  totalVisited: {
    type: Number,
    required: true
  },
  totalBreweries: {
    type: Number,
    default: 82
  },
  breweries: {
    type: Map,
    required: true
  },
  visitedHistoryRecords: {
    type: Array,
    default: () => []
  },
  regionStats: {
    type: Object,
    required: true
  }
})

const size = 130
const half = size / 2
const radius = 45
const circumference = 2 * Math.PI * radius

const percentage = computed(() => {
  if (!props.totalBreweries) return 0
  return Math.round((props.totalVisited / props.totalBreweries) * 100)
})

const strokeDashOffset = computed(() => circumference * (1 - (percentage.value / 100)))
const isPlaying = ref(false)
const currentIndex = ref(-1)
const showOverlay = ref(false)
const showMessage = ref(false)
const abortController = ref(false)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const collectCoordinates = (geometry, visitor) => {
  if (!geometry || !geometry.type) return

  const collectFromRing = (ring) => {
    if (!Array.isArray(ring)) return
    ring.forEach((point) => {
      if (!Array.isArray(point) || point.length < 2) return
      visitor(point)
    })
  }

  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(collectFromRing)
    return
  }

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach(collectFromRing)
    })
  }
}

const createProjector = (features) => {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  features.forEach((feature) => {
    collectCoordinates(feature?.geometry, ([x, y]) => {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })
  })

  const sourceWidth = Math.max(1, maxX - minX)
  const sourceHeight = Math.max(1, maxY - minY)
  const availableWidth = VIEWBOX_WIDTH - MAP_PADDING * 2
  const availableHeight = VIEWBOX_HEIGHT - MAP_PADDING * 2
  const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight)
  const offsetX = MAP_PADDING + (availableWidth - sourceWidth * scale) / 2
  const offsetY = MAP_PADDING + (availableHeight - sourceHeight * scale) / 2

  return ([x, y]) => {
    const svgX = offsetX + (x - minX) * scale
    const svgY = offsetY + (maxY - y) * scale
    return [svgX, svgY]
  }
}

const geometryToPath = (geometry, projector) => {
  if (!geometry) return ''

  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : []

  const segments = []

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      if (!Array.isArray(ring) || ring.length === 0) return

      const commands = ring.map((point, index) => {
        const [x, y] = projector(point)
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
      })

      segments.push(`${commands.join(' ')} Z`)
    })
  })

  return segments.join(' ')
}

const projector = createProjector(municipalitiesGeoJson.features)

const municipalityPaths = municipalitiesGeoJson.features.map((feature, index) => ({
  name: String(feature?.properties?.市町村 || `municipality-${index}`),
  path: geometryToPath(feature?.geometry, projector)
}))

const labelPositions = {
  下越: { x: 230, y: 120 },
  中越: { x: 160, y: 220 },
  上越: { x: 70, y: 255 },
  佐渡: { x: 105, y: 95 }
}

const regionFill = (region) => {
  const pct = props.regionStats[region]?.percentage ?? 0
  const toneMap = {
    下越: [165, 120, 128],
    中越: [126, 145, 111],
    上越: [114, 123, 145],
    佐渡: [167, 141, 82]
  }
  const [r, g, b] = toneMap[region] || [142, 127, 101]
  const alpha = 0.22 + (pct / 100) * 0.6
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`
}

const visitedMunicipalitiesOrdered = computed(() => {
  const unique = new Set()
  const ordered = []

  const orderedRecords = [...props.visitedHistoryRecords]
    .filter((record) => {
      if (!record?.breweryId || !record?.visitedAt) return false
      return !Number.isNaN(new Date(record.visitedAt).getTime())
    })
    .sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime())

  orderedRecords.forEach((record) => {
    const brewery = props.breweries.get(String(record.breweryId))
    const municipality = String(brewery?.municipality || '').trim()
    if (!municipality || unique.has(municipality)) return
    unique.add(municipality)
    ordered.push(municipality)
  })

  return ordered
})

const canPlayTrajectory = computed(() => visitedMunicipalitiesOrdered.value.length > 0)

const currentMunicipality = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= visitedMunicipalitiesOrdered.value.length) {
    return ''
  }
  return visitedMunicipalitiesOrdered.value[currentIndex.value]
})

const pastMunicipalitySet = computed(() => {
  const set = new Set()
  if (currentIndex.value < 0) return set

  const end = Math.min(currentIndex.value, visitedMunicipalitiesOrdered.value.length)
  for (let i = 0; i < end; i++) {
    set.add(visitedMunicipalitiesOrdered.value[i])
  }
  return set
})

const trajectoryMessage = computed(() => `${visitedMunicipalitiesOrdered.value.length}市町村を巡りました`)

const municipalityClass = (municipalityName) => {
  if (!isPlaying.value) return ''
  if (municipalityName === currentMunicipality.value) return 'highlight-current'
  if (pastMunicipalitySet.value.has(municipalityName)) return 'highlight-past'
  return ''
}

const resetTrajectory = () => {
  abortController.value = true
  currentIndex.value = -1
  showOverlay.value = false
  showMessage.value = false
  isPlaying.value = false
}

const playTrajectory = async () => {
  if (isPlaying.value || !canPlayTrajectory.value) return

  resetTrajectory()
  abortController.value = false
  isPlaying.value = true
  showOverlay.value = true

  await delay(OVERLAY_FADE_MS)
  if (abortController.value) return

  for (let i = 0; i < visitedMunicipalitiesOrdered.value.length; i++) {
    if (abortController.value) return
    currentIndex.value = i
    await delay(STEP_INTERVAL_MS)
  }

  if (abortController.value) return
  await delay(FINAL_HOLD_MS)
  if (abortController.value) return

  currentIndex.value = visitedMunicipalitiesOrdered.value.length
  showMessage.value = true
}

const onMapAreaTap = () => {
  if (!showMessage.value) return
  resetTrajectory()
}

onUnmounted(() => {
  resetTrajectory()
})
</script>

<style scoped>
.summary-card {
  padding: 18px 16px;
}

.summary-title {
  margin: 0 0 12px;
  font-size: 15px;
  letter-spacing: 0.04em;
  color: #2a2a2a;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
}

.summary-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
  gap: 12px;
  align-items: stretch;
}

.summary-tile {
  border: 1px solid rgba(184, 153, 71, 0.24);
  border-radius: 12px;
  background: rgba(255, 250, 240, 0.66);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.chart-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  color: inherit;
}

.donut-track {
  fill: none;
  stroke: rgba(184, 153, 71, 0.2);
  stroke-width: 9;
}

.donut-progress {
  fill: none;
  stroke: #9a8652;
  stroke-width: 9;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.donut-count {
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-size: 14px;
  fill: #2a2a2a;
  font-weight: 600;
}

.donut-pct {
  font-size: 12px;
  fill: #665a43;
}

.map-tile {
  padding: 10px 10px 8px;
}

.map-stage {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
}

.map-stage.is-resettable {
  cursor: pointer;
}

.trajectory-trigger-btn {
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 3;
  border: none;
  background: transparent;
  color: #6f6248;
  font-size: 12px;
  font-family: "Noto Sans JP", sans-serif;
  padding: 4px 6px;
  border-radius: 6px;
  opacity: 0.72;
  transition: opacity 0.2s ease;
}

.trajectory-trigger-btn:hover {
  opacity: 0.92;
}

.trajectory-trigger-btn:active {
  opacity: 0.56;
}

.trajectory-trigger-btn:disabled {
  opacity: 0.4;
}

.region-map {
  width: 100%;
  height: auto;
  display: block;
}

.map-region-group {
  cursor: pointer;
  outline: none;
}

.map-region {
  stroke: #9d8a6a;
  stroke-width: 1.25;
  transition: filter 0.28s ease, transform 0.28s ease;
  transform-origin: center;
}

.map-region-group:active .map-region,
.map-region-group:focus-visible .map-region {
  filter: saturate(1.1);
  transform: translateY(-1px);
}

.map-label {
  pointer-events: none;
  font-size: 12px;
  fill: #2d2a23;
  font-weight: 600;
}

.map-stat {
  pointer-events: none;
  font-size: 10px;
  fill: rgba(51, 41, 25, 0.82);
}

.municipality-path {
  fill: rgba(255, 252, 245, 0.45);
  stroke: rgba(126, 111, 86, 0.45);
  stroke-width: 0.7;
  transition: fill 0.5s ease, filter 0.5s ease;
}

.municipality-path.highlight-current {
  fill: #b9b3a6;
  transition: fill 0.5s ease;
  filter: brightness(1.1);
}

.municipality-path.highlight-past {
  fill: #a39b8b;
  filter: brightness(0.95);
}

.trajectory-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.trajectory-overlay.is-visible {
  opacity: 1;
}

.trajectory-message {
  margin: 8px 0 0;
  min-height: 1.4em;
  text-align: center;
  font-size: 11px;
  color: rgba(58, 50, 37, 0.78);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.trajectory-message.is-visible {
  opacity: 1;
}

.tile-caption {
  margin: 0;
  text-align: center;
  font-size: 11px;
  color: #74664a;
}

@media (max-width: 420px) {
  .summary-body {
    grid-template-columns: 1fr;
  }
}
</style>
