<template>
  <div class="app-shell">
    <div class="map-container" aria-hidden="true"></div>
    <header class="app-header">
      <div class="header-inner">
        <div class="title-block">
          <h1>酒の陣2026</h1>
          <p>会場マップ</p>
        </div>
        <div class="header-metrics" aria-live="polite">
          <div class="metric-row">
            <span class="metric-label">訪問</span>
            <span class="metric-value">{{ visitedBreweryIds.length }} / {{ breweries.size }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">進捗</span>
            <span class="metric-value">{{ progressPercent }}%</span>
          </div>
        </div>
      </div>
    </header>

    <nav class="tab-bar" role="tablist" aria-label="表示タブ">
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'map' }"
        @click="currentView = 'map'"
      >
        マップ
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'heatmap' }"
        @click="currentView = 'heatmap'"
      >
        ヒートマップ
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'favorites' }"
        @click="currentView = 'favorites'"
      >
        ★お気に入り
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'progress' }"
        @click="currentView = 'progress'"
      >
        進捗
      </button>
    </nav>

    <section class="content-area">
      <main v-if="isMapLikeView" class="map-page">
        <div class="map-topbar">
          <div v-if="currentView === 'map'" class="legend-row">
            <div v-for="r in regionDataList" :key="r.id" class="legend-chip">
              <span class="legend-color" :style="{ backgroundColor: r.color, borderColor: r.stroke }"></span>
              <span>{{ r.name }}</span>
            </div>
          </div>

          <div v-else class="heatmap-control-block">
            <div class="axis-selector" role="group" aria-label="ヒートマップ軸選択">
              <button
                v-for="axis in heatmapAxes"
                :key="axis.id"
                class="axis-btn"
                :class="{ 'is-active': heatmapAxis === axis.id }"
                @click="heatmapAxis = axis.id"
              >
                {{ axis.name }}
              </button>
            </div>

            <div class="heatmap-legend">
              <span class="legend-label min">{{ heatmapMinLabel }}</span>
              <div class="legend-gradient" :class="heatmapAxis + '-gradient'"></div>
              <span class="legend-label max">{{ heatmapMaxLabel }}</span>
            </div>
          </div>

        </div>

        <div
          ref="mapViewportRef"
          class="map-viewport"
          :class="{ 'is-zoomed': isZoomed }"
          @pointerdown="onMapPointerDown"
          @pointerup="onMapPointerUp"
          @pointercancel="clearPointerState"
          @pointerleave="clearPointerState"
        >
          <div class="map-canvas" :style="mapCanvasFrameStyle">
            <svg
              :width="mapWidth"
              :height="mapHeight"
              class="booth-map"
              :style="mapSvgStyle"
            >
              <defs>
                <linearGradient id="booth-sheen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24" />
                  <stop offset="45%" stop-color="#ffffff" stop-opacity="0.12" />
                  <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
                </linearGradient>
              </defs>

              <g v-for="booth in validBooths" :key="booth.id">
                <rect
                  v-if="!booth.isEmpty"
                  :x="booth.x"
                  :y="booth.y"
                  width="64"
                  height="64"
                  class="booth-rect"
                  :style="getBoothStyle(booth)"
                />

                <rect
                  v-if="!booth.isEmpty"
                  :x="booth.x"
                  :y="booth.y"
                  width="64"
                  height="64"
                  rx="6"
                  class="booth-gradient-overlay"
                />

                <rect
                  v-if="!booth.isEmpty"
                  :x="booth.x"
                  :y="booth.y"
                  width="64"
                  height="64"
                  rx="6"
                  class="booth-border-overlay"
                />

                <rect
                  v-else
                  :x="booth.x"
                  :y="booth.y"
                  width="64"
                  height="64"
                  class="booth-rect is-empty"
                />

                <text
                  v-if="!booth.isEmpty"
                  :x="booth.x + 32"
                  :y="booth.y + 16"
                  text-anchor="middle"
                  class="booth-text"
                >
                  {{ booth.id }}
                </text>

                <text
                  v-if="!booth.isEmpty"
                  :x="booth.x + 12"
                  :y="booth.y + 16"
                  text-anchor="middle"
                  class="visited-check"
                  :class="{ 'is-visible': visitedBoothIdSet.has(booth.id) }"
                >
                  ✔
                </text>

                <text
                  v-if="!booth.isEmpty"
                  :x="booth.x + 52"
                  :y="booth.y + 16"
                  text-anchor="middle"
                  class="favorite-star"
                  :class="{ 'is-visible': favoriteBoothIdSet.has(booth.id) }"
                >
                  ★
                </text>

                <template v-if="!booth.isEmpty">
                  <text
                    v-for="(line, index) in booth.nameLines"
                    :key="'name-' + index"
                    :x="booth.x + 32"
                    :y="booth.y + 44 - (booth.nameLines.length - 1) * 8 + index * 16"
                    text-anchor="middle"
                    class="booth-name-text"
                    :class="{
                      'is-small-text': booth.name === 'ラグーン ブリュワリー',
                      'is-medium-text': booth.name === 'マスカガミ'
                    }"
                  >
                    {{ line }}
                  </text>
                </template>
              </g>

              <g class="facility-layer" aria-hidden="true">
                <g class="facility-zone">
                  <rect
                    class="facility-zone-bg"
                    :x="FACILITY_A_CENTER_X - FACILITY_ZONE_WIDTH / 2"
                    :y="FACILITY_BASE_Y"
                    :width="FACILITY_ZONE_WIDTH"
                    :height="FACILITY_ZONE_HEIGHT"
                    rx="12"
                  />
                  <text
                    :x="FACILITY_A_CENTER_X"
                    :y="FACILITY_BASE_Y + 24"
                    text-anchor="middle"
                    class="facility-title"
                  >
                    A御猪口交換所
                  </text>
                </g>

                <g class="stairs-zone">
                  <rect
                    v-for="step in STAIRS_STEP_COUNT"
                    :key="'a-stair-' + step"
                    :x="FACILITY_A_CENTER_X - 72 + (step - 1) * 20"
                    :y="STAIRS_TOP_Y"
                    width="12"
                    height="36"
                    class="stairs-step"
                  />
                  <text
                    :x="FACILITY_A_CENTER_X"
                    :y="STAIRS_TOP_Y+20"
                    text-anchor="middle"
                    class="stairs-label"
                  >
                    1F⇄2F 階段
                  </text>
                </g>

              </g>

              <rect
                v-if="selectedBooth && !selectedBooth.isEmpty"
                :x="selectedBooth.x"
                :y="selectedBooth.y"
                width="64"
                height="64"
                fill="none"
                stroke="#1E2A38"
                stroke-width="4"
                rx="4"
                class="selected-highlight"
                pointer-events="none"
              />
            </svg>
          </div>
        </div>
      </main>

      <main v-else-if="currentView === 'favorites'" class="favorites-page">
        <FavoritesView
          :favorites="favoriteList"
          :regionStyles="regionStyleMap"
          @selectBooth="selectBooth"
        />
      </main>

      <main v-else class="progress-page">
        <ProgressView
          :breweries="breweries"
          :visitRecords="visitRecords"
          @resetVisited="resetVisited"
        />
      </main>
    </section>

    <transition name="panel-slide">
      <div
        v-if="showDetailPanel"
        ref="bottomPanelRef"
        class="bottom-panel"
        :class="{ 'is-expanded': panelVisualExpanded, 'is-dragging': isPanelDragging }"
        :style="panelDragOffsetStyle"
        @pointerdown="onPanelPointerDown"
        @pointermove="onPanelPointerMove"
        @pointerup="onPanelPointerUp"
        @pointercancel="onPanelPointerCancel"
      >
        <div class="panel-handle" aria-hidden="true"></div>
        <div class="panel-header">
          <div class="title-row">
            <h2>{{ selectedBooth.name }}</h2>
            <span class="booth-id-badge">No.{{ selectedBooth.id }}</span>
          </div>
          <button class="close-btn" @click="closeDetailPanel">×</button>
        </div>

        <div class="panel-body">
          <div class="taste-bars">
            <div class="taste-row">
              <span class="taste-title">甘辛</span>
              <span class="bar-limit-label min">甘</span>
              <div class="bar-container">
                <div class="bar-bg sweet-dry-bg"></div>
                <div class="center-line"></div>
                <div
                  class="pointer"
                  :style="{ left: getBarPosition(selectedBooth.estimated.sweetDry, -2, 2) + '%' }"
                ></div>
              </div>
              <span class="bar-limit-label max">辛</span>
              <span class="taste-current-label">{{ getSweetDryLabel(selectedBooth.estimated.sweetDry) }}</span>
            </div>

            <div class="taste-row">
              <span class="taste-title">濃淡</span>
              <span class="bar-limit-label min">淡</span>
              <div class="bar-container">
                <div class="bar-bg light-rich-bg"></div>
                <div class="center-line"></div>
                <div
                  class="pointer"
                  :style="{ left: getBarPosition(selectedBooth.estimated.lightRich, -2, 2) + '%' }"
                ></div>
              </div>
              <span class="bar-limit-label max">濃</span>
              <span class="taste-current-label">{{ getLightRichLabel(selectedBooth.estimated.lightRich) }}</span>
            </div>

            <div class="taste-row">
              <span class="taste-title">香り</span>
              <span class="bar-limit-label min">控</span>
              <div class="bar-container no-center">
                <div class="bar-bg aroma-bg"></div>
                <div
                  class="pointer"
                  :style="{ left: getBarPosition(selectedBooth.estimated.aroma, 0, 4) + '%' }"
                ></div>
              </div>
              <span class="bar-limit-label max">華</span>
              <span class="taste-current-label">{{ getAromaLabel(selectedBooth.estimated.aroma) }}</span>
            </div>
          </div>

          <div v-if="panelVisualExpanded" class="brewery-extra">
            <dl class="extra-list">
              <div class="extra-item">
                <dt>住所</dt>
                <dd>{{ selectedBooth.address || '情報なし' }}</dd>
              </div>
              <div class="extra-item">
                <dt>代表銘柄</dt>
                <dd>{{ selectedBooth.brand || '情報なし' }}</dd>
              </div>
              <div class="extra-item">
                <dt>サマリー</dt>
                <dd>{{ selectedBooth.summary || '情報なし' }}</dd>
              </div>
              <div class="extra-item">
                <dt>URL</dt>
                <dd>
                  <a
                    v-if="selectedBooth.url"
                    class="extra-link"
                    :href="resolveExternalUrl(selectedBooth.url)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ displaySelectedBoothUrl }}
                  </a>
                  <span v-else>情報なし</span>
                </dd>
              </div>
            </dl>

            <div v-if="panelExpanded" class="memo-section">
              <h3 class="memo-title">メモ</h3>
              <textarea
                class="memo-textarea"
                :value="memoDraft"
                maxlength="200"
                placeholder="気になった味わいや銘柄をメモ"
                @input="onMemoInput"
              ></textarea>
              <p class="memo-counter">{{ memoDraft.length }} / 200</p>
            </div>
          </div>

          <div class="visited-control">
            <div class="status-controls">
              <label class="visited-checkbox-label">
                <input
                  type="checkbox"
                  :checked="visitedBoothIdSet.has(selectedBooth.id)"
                  @change="toggleVisited(selectedBooth.id)"
                >
                <span class="checkbox-custom"></span>
                訪問済み
              </label>
              <button
                type="button"
                class="favorite-toggle-btn"
                :class="{
                  'is-active': favoriteBoothIdSet.has(selectedBooth.id),
                  'is-pulsing': favoritePulseBoothId === selectedBooth.id
                }"
                @click="toggleFavorite(selectedBooth.id)"
              >
                <span class="favorite-icon">{{ favoriteBoothIdSet.has(selectedBooth.id) ? '★' : '☆' }}</span>
                お気に入り
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import breweriesData from '../niigata_sakenojin_breweries_list.json'
import breweryScores from '../brewery_scores.json'
import breweryFlavor from '../brewery_flavor.json'
import ProgressView from './components/ProgressView.vue'
import FavoritesView from './components/FavoritesView.vue'

const BOOTH_SIZE = 64
const BLOCK_GAP_X = 24
const BLOCK_GAP_Y = 32
const BLOCKS_X = 7
const BLOCKS_Y = 3
const INNER_COLS = 2
const INNER_ROWS = 2

const OVERVIEW_SCALE = 0.6
const FOCUSED_SCALE = 1.3
const TAP_MOVE_THRESHOLD = 10
const TAP_TIME_THRESHOLD = 280
const PANEL_OVERLAP_FALLBACK_COLLAPSED = 164
const PANEL_OVERLAP_FALLBACK_EXPANDED = 310
const MAP_EXTRA_BOTTOM = 252
const MAP_MOTION_MS = 620
const DETAIL_RECALC_DELAY_MS = 360
const PANEL_HEIGHT_RATIO_COLLAPSED = 0.38
const PANEL_HEIGHT_RATIO_EXPANDED = 0.68
const PANEL_HEIGHT_CAP_COLLAPSED = 300
const PANEL_HEIGHT_CAP_EXPANDED = 560
const PANEL_DRAG_UP_PULL_LIMIT = 164
const PANEL_DRAG_CLOSE_THRESHOLD = 84
const PANEL_DRAG_EXPAND_THRESHOLD = 48
const PANEL_DRAG_PREVIEW_THRESHOLD = 20
const PANEL_DRAG_ACTIVATION_THRESHOLD = 6
const LOCAL_STATE_KEY = 'sakenojin_state_v1'
const MEMO_MAX_LENGTH = 200
const MEMO_SAVE_DEBOUNCE_MS = 500
const FAVORITE_PULSE_MS = 260

const mapWidth = BLOCKS_X * (INNER_COLS * BOOTH_SIZE) + (BLOCKS_X - 1) * BLOCK_GAP_X
const boothAreaHeight = BLOCKS_Y * (INNER_ROWS * BOOTH_SIZE) + (BLOCKS_Y - 1) * BLOCK_GAP_Y
const mapHeight = boothAreaHeight + MAP_EXTRA_BOTTOM

const FACILITY_BASE_Y = boothAreaHeight + 24
const FACILITY_ZONE_WIDTH = 232
const FACILITY_ZONE_HEIGHT = 56
const FACILITY_A_CENTER_X = Math.round(mapWidth * 0.56)
const STAIRS_TOP_Y = FACILITY_BASE_Y + 82
const STAIRS_STEP_COUNT = 7

const regionDataList = [
  { id: 'kaetsu', name: '下越', color: '#D6A9B8', stroke: '#C293A4' },
  { id: 'chuetsu', name: '中越', color: '#A9C8A9', stroke: '#8EAF8E' },
  { id: 'joetsu', name: '上越', color: '#AEB9C8', stroke: '#8E9BAC' },
  { id: 'sado', name: '佐渡', color: '#D4B84F', stroke: '#B29739' }
]

const heatmapAxes = [
  { id: 'sweetDry', name: '甘辛' },
  { id: 'lightRich', name: '淡濃' },
  { id: 'aroma', name: '香り' }
]

const baseBooths = ref([])
const breweries = ref(new Map())
const boothStates = ref({})
const selectedBoothId = ref(null)
const currentView = ref('map')
const heatmapAxis = ref('sweetDry')
const memoDraft = ref('')
const memoSaveTimerId = ref(null)
const favoritePulseBoothId = ref(null)
const favoritePulseTimerId = ref(null)

const mapViewportRef = ref(null)
const bottomPanelRef = ref(null)
const mapScale = ref(OVERVIEW_SCALE)
const mapOffsetY = ref(0)
const panelOverlapPx = ref(0)
const pointerState = ref(null)
const panelExpanded = ref(false)
const panelDragOffsetPx = ref(0)
const panelDragState = ref(null)
const overviewAnchorBoothId = ref(null)
const mapAnimationRafId = ref(null)
const mapRecalcTimerId = ref(null)

const flavorAxes = {
  sweetDry: {
    min: -2,
    max: 2,
    colors: ['#f8c8dc', '#e9edf5', '#4a90e2']
  },
  lightRich: {
    min: -2,
    max: 2,
    colors: ['#dff5e1', '#f3e6d4', '#b36a2e']
  },
  aroma: {
    min: 0,
    max: 4,
    colors: ['#ede6f7', '#9a7bbd', '#3e2a6f']
  }
}

const isMapLikeView = computed(() => currentView.value === 'map' || currentView.value === 'heatmap')
const isZoomed = computed(() => mapScale.value > OVERVIEW_SCALE + 0.01)
const visitRecords = computed(() => boothStates.value)
const visitedBoothIdSet = computed(() => {
  const ids = new Set()
  Object.values(boothStates.value).forEach(state => {
    if (state.visited) ids.add(state.id)
  })
  return ids
})
const favoriteBoothIdSet = computed(() => {
  const ids = new Set()
  Object.values(boothStates.value).forEach(state => {
    if (state.favorite) ids.add(state.id)
  })
  return ids
})
const visitedBreweryIds = computed(() => Array.from(visitedBoothIdSet.value))
const regionStyleMap = computed(() => {
  return regionDataList.reduce((acc, region) => {
    acc[region.id] = { color: region.color, stroke: region.stroke, name: region.name }
    return acc
  }, {})
})

const progressPercent = computed(() => {
  const total = breweries.value.size
  if (!total) return 0
  return Math.round((visitedBreweryIds.value.length / total) * 100)
})

const heatmapMinLabel = computed(() => {
  if (heatmapAxis.value === 'aroma') return '控えめ'
  if (heatmapAxis.value === 'lightRich') return '淡麗'
  return '甘口'
})

const heatmapMaxLabel = computed(() => {
  if (heatmapAxis.value === 'aroma') return '華やか'
  if (heatmapAxis.value === 'lightRich') return '濃醇'
  return '辛口'
})

const mapCanvasFrameStyle = computed(() => ({
  width: `${mapWidth * mapScale.value}px`,
  height: `${mapHeight * mapScale.value}px`
}))

const mapSvgStyle = computed(() => ({
  transform: `translate3d(0, ${mapOffsetY.value}px, 0) scale(${mapScale.value})`,
  transformOrigin: 'top left'
}))

const showDetailPanel = computed(() => {
  const inDetailEnabledView = isMapLikeView.value || currentView.value === 'favorites'
  return inDetailEnabledView && !!selectedBooth.value && !selectedBooth.value.isEmpty
})
const isPanelDragging = computed(() => !!panelDragState.value)
const panelVisualExpanded = computed(() => {
  if (panelExpanded.value) return true
  return isPanelDragging.value && panelDragOffsetPx.value <= -PANEL_DRAG_PREVIEW_THRESHOLD
})
const panelDragOffsetStyle = computed(() => ({
  '--panel-drag-offset': `${panelDragOffsetPx.value}px`
}))
const displaySelectedBoothUrl = computed(() => {
  const url = selectedBooth.value?.url
  if (!url) return ''
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
})

const sweetDryGradient = computed(() => `linear-gradient(to right, ${flavorAxes.sweetDry.colors[0]}, ${flavorAxes.sweetDry.colors[1]}, ${flavorAxes.sweetDry.colors[2]})`)
const lightRichGradient = computed(() => `linear-gradient(to right, ${flavorAxes.lightRich.colors[0]}, ${flavorAxes.lightRich.colors[1]}, ${flavorAxes.lightRich.colors[2]})`)
const aromaGradient = computed(() => `linear-gradient(to right, ${flavorAxes.aroma.colors[0]}, ${flavorAxes.aroma.colors[1]}, ${flavorAxes.aroma.colors[2]})`)

const sweetDryBarGradient = computed(() => `linear-gradient(to right, ${interpolateColor(-2, 'sweetDry', false)}, ${interpolateColor(0, 'sweetDry', false)}, ${interpolateColor(2, 'sweetDry', false)})`)
const lightRichBarGradient = computed(() => `linear-gradient(to right, ${interpolateColor(-2, 'lightRich', false)}, ${interpolateColor(0, 'lightRich', false)}, ${interpolateColor(2, 'lightRich', false)})`)
const aromaBarGradient = computed(() => `linear-gradient(to right, ${interpolateColor(0, 'aroma', false)}, ${interpolateColor(2, 'aroma', false)}, ${interpolateColor(4, 'aroma', false)})`)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5)
const resolveExternalUrl = (url) => {
  if (!url) return '#'
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}

const interpolateColor = (val, axis, forHeatmap = true) => {
  const config = flavorAxes[axis]
  const normalized = (Math.max(config.min, Math.min(config.max, val)) - config.min) / (config.max - config.min)

  let hex
  if (normalized <= 0.5) {
    const t = normalized * 2
    hex = interpolateHex(config.colors[0], config.colors[1], t)
  } else {
    const t = (normalized - 0.5) * 2
    hex = interpolateHex(config.colors[1], config.colors[2], t)
  }

  if (forHeatmap) {
    return adjustSaturation(hex, 1.5)
  }
  return adjustSaturation(hex, 0.7)
}

const interpolateHex = (color1, color2, factor) => {
  const r1 = parseInt(color1.substring(1, 3), 16)
  const g1 = parseInt(color1.substring(3, 5), 16)
  const b1 = parseInt(color1.substring(5, 7), 16)

  const r2 = parseInt(color2.substring(1, 3), 16)
  const g2 = parseInt(color2.substring(3, 5), 16)
  const b2 = parseInt(color2.substring(5, 7), 16)

  const r = Math.round(r1 + factor * (r2 - r1))
  const g = Math.round(g1 + factor * (g2 - g1))
  const b = Math.round(b1 + factor * (b2 - b1))

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const adjustSaturation = (hex, factor) => {
  let r = parseInt(hex.substring(1, 3), 16) / 255
  let g = parseInt(hex.substring(3, 5), 16) / 255
  let b = parseInt(hex.substring(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h
  let s
  const l = (max + min) / 2

  if (max === min) {
    h = 0
    s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }

  s = Math.min(1, s * factor)

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  const hue2rgb = (pv, qv, t) => {
    let temp = t
    if (temp < 0) temp += 1
    if (temp > 1) temp -= 1
    if (temp < 1 / 6) return pv + (qv - pv) * 6 * temp
    if (temp < 1 / 2) return qv
    if (temp < 2 / 3) return pv + (qv - pv) * (2 / 3 - temp) * 6
    return pv
  }

  r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
  g = Math.round(hue2rgb(p, q, h) * 255)
  b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const getBoothStyle = (booth) => {
  if (booth.isEmpty) return {}

  const isVisited = visitedBoothIdSet.value.has(booth.id)
  let fill = '#e5e7eb'
  let stroke = '#ffffff'

  if (currentView.value === 'map') {
    const regionDef = regionDataList.find(r => r.id === booth.region)
    if (regionDef) {
      fill = regionDef.color
      stroke = regionDef.stroke
    }
  } else {
    fill = interpolateColor(booth.estimated[heatmapAxis.value], heatmapAxis.value, true)
    stroke = adjustSaturation(fill, 1.2)
  }

  return {
    fill,
    stroke,
    strokeWidth: '2px',
    opacity: currentView.value === 'map' ? (isVisited ? 1 : 0.42) : 1
  }
}

const formatNameWithLineBreaks = (rawName) => {
  const clean = rawName
    .replace(/(株式会社|\(株\)|有限会社|\(有\)|合名会社|\(名\)|合資会社|\(資\)|合同会社|\(同\))/g, '')
    .trim()

  if (clean.includes(' ')) return clean.split(' ')
  if (clean.includes('　')) return clean.split('　')
  if (clean === 'よしかわ杜氏の郷') return ['よしかわ', '杜氏の郷']

  const suffixes = ['酒造場', '酒造店', '醸造所', '酒造', '醸造', 'ブリュワリー']
  for (const suffix of suffixes) {
    if (clean.endsWith(suffix) && clean !== suffix) {
      const prefix = clean.slice(0, -suffix.length)
      return [prefix, suffix]
    }
  }

  if (clean.length >= 7) {
    const mid = Math.ceil(clean.length / 2)
    return [clean.slice(0, mid), clean.slice(mid)]
  }

  return [clean]
}

const generateGridCoordinates = () => {
  const COLS = BLOCKS_X * INNER_COLS
  const ROWS = BLOCKS_Y * INNER_ROWS

  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const bx = Math.floor(c / INNER_COLS)
      const by = Math.floor(r / INNER_ROWS)
      const x = bx * (INNER_COLS * BOOTH_SIZE + BLOCK_GAP_X) + (c % INNER_COLS) * BOOTH_SIZE
      const y = by * (INNER_ROWS * BOOTH_SIZE + BLOCK_GAP_Y) + (r % INNER_ROWS) * BOOTH_SIZE
      grid[r][c] = { x, y }
    }
  }

  return { grid, ROWS, COLS }
}

const generateBooths = (grid, ROWS, COLS) => {
  const generatedBooths = []
  let currentId = 1
  let cellCount = 0

  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = COLS - 1; c >= 0; c--) {
      const { x, y } = grid[r][c]
      let isEmptyBooth = false

      if (cellCount === 34 && currentId === 35) {
        isEmptyBooth = true
      } else if (cellCount === 48 && currentId === 48) {
        isEmptyBooth = true
      }

      if (isEmptyBooth) {
        generatedBooths.push({ id: `empty-${cellCount}`, x, y, isEmpty: true })
      } else if (currentId <= 82) {
        generatedBooths.push({ id: String(currentId), x, y, isEmpty: false })
        currentId++
      }
      cellCount++
    }
  }

  return generatedBooths
}

const attachBreweries = () => {
  const breweryMap = new Map()
  const scoreMap = new Map()
  const summaryMap = new Map()

  breweryScores.forEach(s => {
    scoreMap.set(s.id, s)
  })
  breweryFlavor.forEach(f => {
    if (f && f.id) {
      summaryMap.set(f.id, f.summary || '')
    }
  })

  for (const b of breweriesData) {
    const rawName = b['酒造名']
    const cleanName = rawName
      .replace(/(株式会社|\(株\)|有限会社|\(有\)|合名会社|\(名\)|合資会社|\(資\)|合同会社|\(同\))/g, '')
      .trim()

    const regionNameJa = b['地域'] || b['地区'] || null
    let regionId = regionNameJa
    if (regionId === '下越') regionId = 'kaetsu'
    else if (regionId === '中越') regionId = 'chuetsu'
    else if (regionId === '上越') regionId = 'joetsu'
    else if (regionId === '佐渡') regionId = 'sado'

    const score = scoreMap.get(b.id)
    const taste = score
      ? {
          sweetDry: score.relative.sweetDry_z,
          lightRich: score.relative.lightRich_z,
          aroma: score.relative.aroma_z
        }
      : { sweetDry: 0, lightRich: 0, aroma: 0 }

    breweryMap.set(b.id, {
      id: b.id,
      name: cleanName,
      rawName,
      region: regionId,
      regionName: regionNameJa,
      taste,
      address: b['住所'] || '',
      brand: b['代表銘柄'] || '',
      url: b.URL || '',
      summary: summaryMap.get(b.id) || ''
    })
  }

  breweries.value = breweryMap
}

const initMap = () => {
  const { grid, ROWS, COLS } = generateGridCoordinates()
  baseBooths.value = generateBooths(grid, ROWS, COLS)
  attachBreweries()
}

const createDefaultBoothState = (id) => ({
  id: String(id),
  visited: false,
  favorite: false,
  memo: ''
})

const ensureBoothState = (id) => {
  const key = String(id)
  if (!boothStates.value[key]) {
    boothStates.value[key] = createDefaultBoothState(key)
  }
  return boothStates.value[key]
}

const ensureAllBoothStates = () => {
  let added = false
  const next = { ...boothStates.value }
  for (const [id] of breweries.value) {
    if (!next[id]) {
      next[id] = createDefaultBoothState(id)
      added = true
    }
  }
  if (added) {
    boothStates.value = next
  }
  return added
}

const normalizeStateMap = (parsed) => {
  const normalized = {}
  let shouldRewrite = false

  const assignNormalized = (id, raw) => {
    const key = String(id)
    if (!key) return

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const memoRaw = typeof raw.memo === 'string' ? raw.memo : ''
      const memo = memoRaw.slice(0, MEMO_MAX_LENGTH)
      normalized[key] = {
        id: key,
        visited: !!raw.visited,
        favorite: typeof raw.favorite === 'boolean' ? raw.favorite : false,
        memo
      }
      if (
        String(raw.id ?? key) !== key ||
        typeof raw.favorite !== 'boolean' ||
        typeof raw.memo !== 'string' ||
        raw.memo !== memo
      ) {
        shouldRewrite = true
      }
      return
    }

    shouldRewrite = true
    normalized[key] = {
      id: key,
      visited: !!raw,
      favorite: false,
      memo: ''
    }
  }

  if (Array.isArray(parsed)) {
    shouldRewrite = true
    parsed.forEach((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        if (entry.id != null) {
          assignNormalized(entry.id, entry)
        }
      } else if (entry != null) {
        assignNormalized(String(entry), { id: String(entry), visited: true })
      }
    })
  } else if (parsed && typeof parsed === 'object') {
    Object.entries(parsed).forEach(([id, raw]) => assignNormalized(id, raw))
  } else {
    shouldRewrite = true
  }

  return { normalized, shouldRewrite }
}

const buildLegacyStateMap = () => {
  const visitedIds = new Set()

  const visitedBreweries = localStorage.getItem('visitedBreweries')
  if (visitedBreweries) {
    try {
      const parsed = JSON.parse(visitedBreweries)
      if (Array.isArray(parsed)) {
        parsed.forEach(id => visitedIds.add(String(id)))
      }
    } catch {
      // noop
    }
  }

  const sakeVisited = localStorage.getItem('sake_visited')
  if (sakeVisited) {
    try {
      const parsed = JSON.parse(sakeVisited)
      if (Array.isArray(parsed)) {
        parsed.forEach(id => visitedIds.add(String(id)))
      } else if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach((id) => {
          if (parsed[id]?.visited) visitedIds.add(String(id))
        })
      }
    } catch {
      // noop
    }
  }

  const legacy = {}
  visitedIds.forEach((id) => {
    legacy[id] = {
      id,
      visited: true,
      favorite: false,
      memo: ''
    }
  })
  return legacy
}

const triggerLightHaptic = () => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(10)
  }
}

const saveBoothStates = ({ withHaptics = false } = {}) => {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(boothStates.value))
  if (withHaptics) {
    triggerLightHaptic()
  }
}

const loadBoothStates = () => {
  let loaded = {}
  let shouldRewrite = false

  const stored = localStorage.getItem(LOCAL_STATE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const result = normalizeStateMap(parsed)
      loaded = result.normalized
      shouldRewrite = result.shouldRewrite
    } catch {
      shouldRewrite = true
    }
  }

  if (!Object.keys(loaded).length) {
    const legacy = buildLegacyStateMap()
    if (Object.keys(legacy).length) {
      loaded = legacy
      shouldRewrite = true
    }
  }

  boothStates.value = loaded
  if (ensureAllBoothStates()) {
    shouldRewrite = true
  }
  if (shouldRewrite) {
    saveBoothStates()
  }
}

const mapBoothsWithBreweryData = computed(() => {
  return baseBooths.value.map(booth => {
    if (booth.isEmpty) {
      return { ...booth }
    }

    const brewery = breweries.value.get(booth.id)
    const name = brewery ? brewery.name : `不明 ${booth.id}`
    const rawName = brewery ? brewery.rawName : `不明 ${booth.id}`

    return {
      ...booth,
      name,
      nameLines: formatNameWithLineBreaks(rawName),
      estimated: brewery ? brewery.taste : { sweetDry: 0, lightRich: 0, aroma: 0 },
      region: brewery ? brewery.region : null,
      address: brewery ? brewery.address : '',
      brand: brewery ? brewery.brand : '',
      url: brewery ? brewery.url : '',
      summary: brewery ? brewery.summary : ''
    }
  })
})

const favoriteList = computed(() => {
  const favorites = []
  for (const booth of mapBoothsWithBreweryData.value) {
    if (booth.isEmpty) continue
    const state = boothStates.value[booth.id]
    if (!state?.favorite) continue
    favorites.push({
      ...booth,
      visited: !!state.visited
    })
  }
  return favorites
})

const validBooths = computed(() => mapBoothsWithBreweryData.value)

const selectedBooth = computed(() => {
  return mapBoothsWithBreweryData.value.find(b => b.id === selectedBoothId.value) || null
})

const findNearestBooth = (mapX, mapY) => {
  let nearest = null
  let minDistanceSq = Number.POSITIVE_INFINITY

  for (const booth of validBooths.value) {
    if (booth.isEmpty) continue

    const centerX = booth.x + BOOTH_SIZE / 2
    const centerY = booth.y + BOOTH_SIZE / 2
    const dx = centerX - mapX
    const dy = centerY - mapY
    const distanceSq = dx * dx + dy * dy

    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq
      nearest = booth
    }
  }

  return nearest
}

const findNearestBoothFromEvent = (event) => {
  const viewport = mapViewportRef.value
  if (!viewport) return null

  const viewportRect = viewport.getBoundingClientRect()
  const localX = clamp(event.clientX - viewportRect.left, 0, viewportRect.width)
  const localY = clamp(event.clientY - viewportRect.top, 0, viewportRect.height)

  const mapX = (viewport.scrollLeft + localX) / mapScale.value
  const mapY = (viewport.scrollTop + localY - mapOffsetY.value) / mapScale.value

  if (mapY < 0 || mapY > boothAreaHeight) return null

  return findNearestBooth(mapX, mapY)
}

const refreshPanelOverlap = () => {
  if (!showDetailPanel.value) {
    panelOverlapPx.value = 0
    return
  }

  const viewport = mapViewportRef.value
  const panel = bottomPanelRef.value
  if (!viewport || !panel) return

  const viewportRect = viewport.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()

  panelOverlapPx.value = Math.max(0, viewportRect.bottom - panelRect.top)
}

const estimatePanelOverlap = () => {
  const viewport = mapViewportRef.value
  const fallback = panelExpanded.value ? PANEL_OVERLAP_FALLBACK_EXPANDED : PANEL_OVERLAP_FALLBACK_COLLAPSED
  if (!viewport) return fallback

  const ratio = panelExpanded.value ? PANEL_HEIGHT_RATIO_EXPANDED : PANEL_HEIGHT_RATIO_COLLAPSED
  const cap = panelExpanded.value ? PANEL_HEIGHT_CAP_EXPANDED : PANEL_HEIGHT_CAP_COLLAPSED
  const estimatedPanelHeight = Math.min(window.innerHeight * ratio, cap)
  const boundedHeight = Math.min(viewport.clientHeight - 24, estimatedPanelHeight + 18)
  return Math.max(fallback, boundedHeight)
}

const cancelMapAnimation = () => {
  if (mapAnimationRafId.value !== null) {
    cancelAnimationFrame(mapAnimationRafId.value)
    mapAnimationRafId.value = null
  }
}

const cancelRecalcTimer = () => {
  if (mapRecalcTimerId.value !== null) {
    clearTimeout(mapRecalcTimerId.value)
    mapRecalcTimerId.value = null
  }
}

const animateMapState = ({ targetScale, targetLeft, targetTop, targetOffsetY, smooth = true }) => {
  const viewport = mapViewportRef.value
  if (!viewport) return

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finalMaxScrollLeft = Math.max(0, mapWidth * targetScale - viewport.clientWidth)
  const finalMaxScrollTop = Math.max(0, mapHeight * targetScale - viewport.clientHeight)
  const resolvedTargetLeft = clamp(targetLeft, 0, finalMaxScrollLeft)
  const resolvedTargetTop = clamp(targetTop, 0, finalMaxScrollTop)

  if (!smooth || reduced) {
    cancelMapAnimation()
    mapScale.value = targetScale
    mapOffsetY.value = targetOffsetY
    viewport.scrollLeft = resolvedTargetLeft
    viewport.scrollTop = resolvedTargetTop
    return
  }

  cancelMapAnimation()

  const startScale = mapScale.value
  const startLeft = viewport.scrollLeft
  const startTop = viewport.scrollTop
  const startOffsetY = mapOffsetY.value
  const startedAt = performance.now()

  const tick = (now) => {
    const elapsed = now - startedAt
    const progress = clamp(elapsed / MAP_MOTION_MS, 0, 1)
    const eased = easeOutQuint(progress)

    const nextScale = startScale + (targetScale - startScale) * eased
    const nextOffsetY = startOffsetY + (targetOffsetY - startOffsetY) * eased
    const nextLeftRaw = startLeft + (resolvedTargetLeft - startLeft) * eased
    const nextTopRaw = startTop + (resolvedTargetTop - startTop) * eased
    const currentMaxScrollLeft = Math.max(0, mapWidth * nextScale - viewport.clientWidth)
    const currentMaxScrollTop = Math.max(0, mapHeight * nextScale - viewport.clientHeight)

    mapScale.value = nextScale
    mapOffsetY.value = nextOffsetY
    viewport.scrollLeft = clamp(nextLeftRaw, 0, currentMaxScrollLeft)
    viewport.scrollTop = clamp(nextTopRaw, 0, currentMaxScrollTop)

    if (progress < 1) {
      mapAnimationRafId.value = requestAnimationFrame(tick)
    } else {
      mapScale.value = targetScale
      mapOffsetY.value = targetOffsetY
      viewport.scrollLeft = resolvedTargetLeft
      viewport.scrollTop = resolvedTargetTop
      mapAnimationRafId.value = null
    }
  }

  mapAnimationRafId.value = requestAnimationFrame(tick)
}

const centerOverview = (smooth = true) => {
  const viewport = mapViewportRef.value
  if (!viewport) return

  const scaledWidth = mapWidth * OVERVIEW_SCALE
  const scaledHeight = mapHeight * OVERVIEW_SCALE
  const maxScrollLeft = Math.max(0, scaledWidth - viewport.clientWidth)
  const maxScrollTop = Math.max(0, scaledHeight - viewport.clientHeight)
  const targetLeft = maxScrollLeft / 2
  const targetTop = maxScrollTop / 2
  const centeredOffsetY = scaledHeight <= viewport.clientHeight
    ? Math.max(0, (viewport.clientHeight - scaledHeight) / 2)
    : 0

  animateMapState({
    targetScale: OVERVIEW_SCALE,
    targetLeft,
    targetTop,
    targetOffsetY: centeredOffsetY,
    smooth
  })
}

const centerOnBooth = (booth, { smooth = true, targetScale = FOCUSED_SCALE, panelAware = true } = {}) => {
  const viewport = mapViewportRef.value
  if (!viewport || !booth) return

  const scaledWidth = mapWidth * targetScale
  const scaledHeight = mapHeight * targetScale

  const centerX = (booth.x + BOOTH_SIZE / 2) * targetScale
  const centerY = (booth.y + BOOTH_SIZE / 2) * targetScale

  const maxScrollLeft = Math.max(0, scaledWidth - viewport.clientWidth)
  const maxScrollTop = Math.max(0, scaledHeight - viewport.clientHeight)
  const targetLeft = clamp(centerX - viewport.clientWidth / 2, 0, maxScrollLeft)

  const estimatedPanelOverlap = estimatePanelOverlap()
  const safeBottom = panelAware
    ? Math.max(panelOverlapPx.value, estimatedPanelOverlap) + 16
    : 16
  const topPadding = 24
  const maxVisibleY = Math.max(topPadding + 24, viewport.clientHeight - safeBottom - 24)
  const targetY = (topPadding + maxVisibleY) / 2

  const unclampedOffset = targetY - centerY
  let targetOffsetY = 0
  let targetTop = 0

  if (scaledHeight > viewport.clientHeight) {
    targetTop = clamp(centerY - targetY, 0, maxScrollTop)
    targetOffsetY = 0
  } else {
    const centeredOffset = (viewport.clientHeight - scaledHeight) / 2
    const travel = panelAware ? Math.max(24, panelOverlapPx.value * 0.75) : 100
    const minOffset = centeredOffset - travel
    const maxOffset = centeredOffset + 24
    targetOffsetY = clamp(unclampedOffset, minOffset, maxOffset)
    targetTop = 0
  }

  animateMapState({
    targetScale,
    targetLeft,
    targetTop,
    targetOffsetY,
    smooth
  })
}

const focusCurrentSelection = (smooth = true) => {
  if (!isMapLikeView.value) return

  if (selectedBooth.value && !selectedBooth.value.isEmpty) {
    centerOnBooth(selectedBooth.value, {
      smooth,
      targetScale: FOCUSED_SCALE,
      panelAware: true
    })
    return
  }

  if (overviewAnchorBoothId.value) {
    const anchoredBooth = validBooths.value.find(b => b.id === overviewAnchorBoothId.value && !b.isEmpty)
    if (anchoredBooth) {
      centerOnBooth(anchoredBooth, {
        smooth,
        targetScale: OVERVIEW_SCALE,
        panelAware: false
      })
      return
    }
  }

  centerOverview(smooth)
}

const scheduleFocusRecalc = (smooth = false) => {
  requestAnimationFrame(() => {
    refreshPanelOverlap()
    focusCurrentSelection(smooth)
  })
}

const selectBooth = (booth) => {
  if (!booth || booth.isEmpty) return

  overviewAnchorBoothId.value = null
  const sameBooth = selectedBoothId.value === booth.id
  if (!sameBooth) {
    panelExpanded.value = false
  }
  panelDragOffsetPx.value = 0
  panelDragState.value = null
  selectedBoothId.value = booth.id

  if (sameBooth) {
    scheduleFocusRecalc(true)
  }
}

const closeDetailPanel = () => {
  panelExpanded.value = false
  panelDragOffsetPx.value = 0
  panelDragState.value = null
  overviewAnchorBoothId.value = selectedBoothId.value
  selectedBoothId.value = null
}

const onPanelPointerDown = (event) => {
  if (!showDetailPanel.value) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  panelDragState.value = {
    pointerId: event.pointerId,
    startY: event.clientY,
    active: false
  }
  panelDragOffsetPx.value = 0
}

const onPanelPointerMove = (event) => {
  const drag = panelDragState.value
  if (!drag || drag.pointerId !== event.pointerId) return

  const deltaY = event.clientY - drag.startY
  if (!drag.active) {
    if (Math.abs(deltaY) < PANEL_DRAG_ACTIVATION_THRESHOLD) return
    drag.active = true
    const panel = bottomPanelRef.value
    if (panel && panel.setPointerCapture) {
      panel.setPointerCapture(event.pointerId)
    }
  }

  if (deltaY >= 0) {
    panelDragOffsetPx.value = Math.min(deltaY, 420)
  } else if (panelExpanded.value) {
    panelDragOffsetPx.value = Math.max(deltaY * 0.45, -72)
  } else {
    panelDragOffsetPx.value = Math.max(deltaY, -PANEL_DRAG_UP_PULL_LIMIT)
  }

  if (event.cancelable) {
    event.preventDefault()
  }
}

const settlePanelDrag = (event, cancelled = false) => {
  const drag = panelDragState.value
  if (!drag || drag.pointerId !== event.pointerId) return

  const panel = bottomPanelRef.value
  if (panel && panel.hasPointerCapture && panel.hasPointerCapture(event.pointerId)) {
    panel.releasePointerCapture(event.pointerId)
  }

  const wasActiveDrag = drag.active
  const deltaY = panelDragOffsetPx.value
  panelDragState.value = null
  panelDragOffsetPx.value = 0

  if (!wasActiveDrag) return
  if (cancelled) return

  if (deltaY >= PANEL_DRAG_CLOSE_THRESHOLD) {
    closeDetailPanel()
    return
  }

  if (deltaY <= -PANEL_DRAG_EXPAND_THRESHOLD && !panelExpanded.value) {
    panelExpanded.value = true
  }
}

const onPanelPointerUp = (event) => {
  settlePanelDrag(event, false)
}

const onPanelPointerCancel = (event) => {
  settlePanelDrag(event, true)
}

const onMapPointerDown = (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  // Prioritize user drag/scroll over pending auto-focus motion.
  cancelMapAnimation()
  cancelRecalcTimer()

  pointerState.value = {
    x: event.clientX,
    y: event.clientY,
    time: Date.now()
  }
}

const onMapPointerUp = (event) => {
  const start = pointerState.value
  pointerState.value = null
  if (!start) return

  const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y)
  const elapsed = Date.now() - start.time
  if (moved > TAP_MOVE_THRESHOLD || elapsed > TAP_TIME_THRESHOLD) return

  const nearest = findNearestBoothFromEvent(event)
  if (nearest) {
    selectBooth(nearest)
  }
}

const clearPointerState = () => {
  pointerState.value = null
}

const clearFavoritePulseTimer = () => {
  if (favoritePulseTimerId.value !== null) {
    clearTimeout(favoritePulseTimerId.value)
    favoritePulseTimerId.value = null
  }
}

const startFavoritePulse = (id) => {
  clearFavoritePulseTimer()
  favoritePulseBoothId.value = id
  favoritePulseTimerId.value = setTimeout(() => {
    favoritePulseBoothId.value = null
    favoritePulseTimerId.value = null
  }, FAVORITE_PULSE_MS)
}

const clearMemoSaveTimer = () => {
  if (memoSaveTimerId.value !== null) {
    clearTimeout(memoSaveTimerId.value)
    memoSaveTimerId.value = null
  }
}

const scheduleMemoSave = () => {
  clearMemoSaveTimer()
  memoSaveTimerId.value = setTimeout(() => {
    memoSaveTimerId.value = null
    saveBoothStates({ withHaptics: true })
  }, MEMO_SAVE_DEBOUNCE_MS)
}

const toggleVisited = (id) => {
  const state = ensureBoothState(id)
  state.visited = !state.visited
  saveBoothStates({ withHaptics: true })
}

const toggleFavorite = (id) => {
  const state = ensureBoothState(id)
  state.favorite = !state.favorite
  startFavoritePulse(id)
  saveBoothStates({ withHaptics: true })
}

const onMemoInput = (event) => {
  if (!selectedBoothId.value) return

  const value = String(event.target.value || '').slice(0, MEMO_MAX_LENGTH)
  memoDraft.value = value
  const state = ensureBoothState(selectedBoothId.value)
  state.memo = value
  scheduleMemoSave()
}

const getBarPosition = (z, min, max) => {
  const clipped = Math.max(min, Math.min(max, z))
  return ((clipped - min) / (max - min)) * 100
}

const getSweetDryLabel = (z) => {
  if (z >= 1.5) return '超辛口'
  if (z >= 0.8) return '辛口'
  if (z >= 0.3) return 'やや辛口'
  if (z >= -0.3) return '中間'
  if (z >= -0.8) return 'やや甘口'
  if (z >= -1.5) return '甘口'
  return '超甘口'
}

const getLightRichLabel = (z) => {
  if (z >= 1.5) return '超濃醇'
  if (z >= 0.8) return '濃醇'
  if (z >= 0.3) return 'やや濃醇'
  if (z >= -0.3) return '中間'
  if (z >= -0.8) return 'やや淡麗'
  if (z >= -1.5) return '淡麗'
  return '超淡麗'
}

const getAromaLabel = (z) => {
  if (z >= 1.5) return '華やか'
  if (z >= 0.8) return 'やや華やか'
  if (z >= 0.3) return 'ほどよい'
  return '控えめ'
}

const resetVisited = () => {
  if (confirm('訪問履歴をすべてリセットしますか？')) {
    Object.values(boothStates.value).forEach((state) => {
      state.visited = false
    })
    saveBoothStates({ withHaptics: true })
    overviewAnchorBoothId.value = null
    selectedBoothId.value = null
  }
}

const onResize = () => {
  scheduleFocusRecalc(false)
}

watch(selectedBoothId, async (id) => {
  clearMemoSaveTimer()
  memoDraft.value = id ? (boothStates.value[id]?.memo || '') : ''
  await nextTick()
  scheduleFocusRecalc(true)
})

watch(currentView, async (view) => {
  if (view !== 'map' && view !== 'heatmap') return
  await nextTick()
  scheduleFocusRecalc(false)
})

watch(panelExpanded, async () => {
  if (!showDetailPanel.value) return
  await nextTick()
  scheduleFocusRecalc(true)
})

watch(showDetailPanel, async () => {
  await nextTick()
  cancelRecalcTimer()
  if (!showDetailPanel.value) {
    clearMemoSaveTimer()
    panelExpanded.value = false
    panelDragOffsetPx.value = 0
    panelDragState.value = null
    return
  }
  mapRecalcTimerId.value = setTimeout(() => {
    scheduleFocusRecalc(true)
    mapRecalcTimerId.value = null
  }, DETAIL_RECALC_DELAY_MS)
})

onMounted(async () => {
  initMap()
  loadBoothStates()
  await nextTick()
  centerOverview(false)
  window.addEventListener('resize', onResize, { passive: true })
})

onUnmounted(() => {
  cancelMapAnimation()
  cancelRecalcTimer()
  clearMemoSaveTimer()
  clearFavoritePulseTimer()
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.app-shell {
  /* Palette + spacing tokens */
  --ink: #1e1e1e;
  --ink-subtle: #6b6b6b;
  --ink-muted: #888888;
  --accent: #1e2a38;
  --paper-base: #fcfaf2; /* わずかに黄みのある白（和紙の地色） */
  --paper-elevated: #ffffff;
  --paper-modal: #fdfcf9;
  --line-soft: rgba(0, 0, 0, 0.08);
  --line-faint: rgba(0, 0, 0, 0.05);
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --safe-top: env(safe-area-inset-top, 0px);
  --header-height: 56px;
  --tab-height: 48px;
  position: relative;
  height: 100%;
  background: var(--paper-base);
  color: var(--ink);
  overflow: hidden;
  font-family: "Yu Gothic", "Hiragino Sans", "Noto Sans JP", sans-serif;
}

/* 背景のベースカラーと和紙テクスチャの合成 */
.map-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: var(--paper-base);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.05; /* 極薄度合い */
}

.app-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 40;
  background: rgba(245, 243, 239, 0.96);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(8px);
}

.header-inner {
  height: calc(var(--header-height) + var(--safe-top));
  padding: var(--safe-top) var(--space-16) 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
}

.title-block h1 {
  margin: 0;
  font-size: 22px;
  font-family: "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.title-block p {
  margin: 0;
  font-size: 14px;
  color: var(--ink-subtle);
}

.header-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.metric-row {
  display: flex;
  gap: var(--space-8);
  font-size: 12px;
  line-height: 1.2;
}

.metric-label {
  color: var(--ink-subtle);
}

.metric-value {
  color: var(--ink);
  font-weight: 600;
}

.tab-bar {
  position: fixed;
  top: calc(var(--safe-top) + var(--header-height));
  inset-inline: 0;
  height: var(--tab-height);
  z-index: 39;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: var(--paper-modal);
  border-bottom: 1px solid var(--line-soft);
}

.tab-btn {
  border: 0;
  margin: 0;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-subtle);
  background: transparent;
  border-bottom: 3px solid transparent;
  transition: color 0.24s ease, border-color 0.24s ease, opacity 0.24s ease;
}

.tab-btn.is-active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.content-area {
  position: absolute;
  inset: calc(var(--safe-top) + var(--header-height) + var(--tab-height)) 0 0;
  overflow: hidden;
}

.map-page {
  height: 100%;
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  overflow: hidden;
  animation: tabFadeIn 0.24s ease;
}

.map-topbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.legend-row {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
  animation: tabFadeIn 0.22s ease;
}

.legend-chip {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  background: var(--paper-elevated);
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  padding: 4px var(--space-12);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border-width: 1px;
  border-style: solid;
}

.heatmap-control-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  animation: tabFadeIn 0.22s ease;
}

.axis-selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-8);
}

.axis-btn {
  border: 1px solid var(--line-soft);
  background: var(--paper-elevated);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-subtle);
  padding: var(--space-8) 0;
  transition: all 0.2s ease;
}

.axis-btn.is-active {
  color: #ffffff;
  background: var(--accent);
  border-color: var(--accent);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.legend-label {
  width: 40px;
  font-size: 12px;
  color: var(--ink-subtle);
  font-weight: 600;
}

.legend-label.min {
  text-align: right;
}

.legend-gradient {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  filter: saturate(0.75);
}

.sweetDry-gradient {
  background: v-bind(sweetDryGradient);
}

.lightRich-gradient {
  background: v-bind(lightRichGradient);
}

.aroma-gradient {
  background: v-bind(aromaGradient);
}

.map-viewport {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
  border-radius: 16px;
  border: 1px solid var(--line-soft);
  background: linear-gradient(180deg, #ffffff 0%, #fbfaf7 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  scroll-behavior: auto;
  overscroll-behavior: contain;
}

.map-viewport.is-zoomed {
  cursor: grab;
}

.map-canvas {
  position: relative;
}

.booth-map {
  display: block;
  pointer-events: none;
  transition: none;
  will-change: transform;
}

.booth-rect {
  fill: #e5e7eb;
  stroke: #ffffff;
  stroke-width: 2px;
  rx: 6px;
  transition: fill 0.2s ease, opacity 0.2s ease;
}

.booth-rect.is-empty {
  fill: transparent;
  stroke: #d8d3ca;
  stroke-dasharray: 4;
}

.booth-gradient-overlay {
  fill: url(#booth-sheen);
  pointer-events: none;
}

.booth-border-overlay {
  fill: none;
  stroke: var(--line-faint);
  stroke-width: 1;
  pointer-events: none;
}

.booth-text {
  font-size: 12px;
  fill: #4d4d4d;
  font-weight: 600;
  pointer-events: none;
}

.booth-name-text {
  font-size: 13px;
  fill: #1f2937;
  font-weight: 600;
  pointer-events: none;
}

.booth-name-text.is-small-text {
  font-size: 10px;
}

.booth-name-text.is-medium-text {
  font-size: 12px;
}

.visited-check {
  font-size: 13px;
  fill: #8b4b5e;
  font-weight: 700;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.favorite-star {
  font-size: 13px;
  fill: #b2892b;
  font-weight: 700;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.visited-check.is-visible,
.favorite-star.is-visible {
  opacity: 1;
}

.selected-highlight {
  filter: drop-shadow(0 0 5px rgba(30, 42, 56, 0.24));
}

.facility-layer {
  pointer-events: none;
}

.facility-zone-bg {
  fill: #e6ebf1;
  stroke: #c4ced8;
  stroke-width: 2;
}

.facility-title {
  fill: #324153;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.facility-subtitle {
  fill: #4b5563;
  font-size: 14px;
  font-weight: 600;
}

.stairs-label {
  fill: #5b6472;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.stairs-step {
  fill: #c4c6cc;
  rx: 4;
}

.progress-page {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--space-16);
  animation: tabFadeIn 0.24s ease;
}

.favorites-page {
  height: 100%;
  overflow: hidden;
  padding: var(--space-16);
  animation: tabFadeIn 0.24s ease;
}

.bottom-panel {
  --panel-base-translate: 0px;
  --panel-drag-offset: 0px;
  --taste-value-width: clamp(64px, 20vw, 82px);
  position: fixed;
  inset: auto 0 0 0;
  z-index: 50;
  transform: translate3d(0, calc(var(--panel-base-translate) + var(--panel-drag-offset)), 0);
  background: var(--paper-modal);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
  padding: 10px var(--space-16) calc(var(--space-16) + env(safe-area-inset-bottom, 0px));
  max-height: min(40dvh, 300px);
  overflow-y: auto;
  touch-action: none;
}

.bottom-panel.is-expanded {
  max-height: min(72dvh, 560px);
}

.bottom-panel.is-dragging {
  transition: none !important;
}

.panel-handle {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  margin: 0 auto 10px;
  background: rgba(30, 42, 56, 0.24);
  cursor: grab;
  touch-action: none;
}

.bottom-panel.is-dragging .panel-handle {
  cursor: grabbing;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-family: "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif;
  font-weight: 600;
  line-height: 1.25;
  color: var(--ink);
}

.booth-id-badge {
  font-size: 12px;
  color: var(--ink-muted);
  font-weight: 500;
}

.close-btn {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: rgba(30, 42, 56, 0.08);
  color: #51606f;
  font-size: 1.08rem;
  line-height: 1;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.taste-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.taste-row {
  display: grid;
  grid-template-columns: 34px 16px minmax(0, 1fr) 16px var(--taste-value-width);
  align-items: center;
  gap: 8px;
}

.taste-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-subtle);
}

.taste-current-label {
  width: var(--taste-value-width);
  justify-self: end;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  text-align: right;
}

.bar-limit-label {
  font-size: 11px;
  color: var(--ink-subtle);
  font-weight: 500;
  text-align: center;
}

.bar-container {
  position: relative;
  min-width: 0;
  height: 10px;
  display: flex;
  align-items: center;
}

.bar-bg {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  opacity: 0.78;
  filter: saturate(0.72);
}

.sweet-dry-bg {
  background: v-bind(sweetDryBarGradient);
}

.light-rich-bg {
  background: v-bind(lightRichBarGradient);
}

.aroma-bg {
  background: v-bind(aromaBarGradient);
}

.center-line {
  position: absolute;
  left: 50%;
  top: -1px;
  bottom: -1px;
  width: 2px;
  background: var(--accent);
  opacity: 0.3;
  z-index: 1;
}

.pointer {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: #ffffff;
  border: 2px solid var(--accent);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.visited-control {
  padding-top: 10px;
  border-top: 1px solid var(--line-soft);
}

.status-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-12);
}

.brewery-extra {
  padding-top: 10px;
  border-top: 1px solid var(--line-soft);
  animation: tabFadeIn 0.2s ease;
}

.extra-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.extra-item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.extra-item dt {
  font-size: 12px;
  color: var(--ink-muted);
  font-weight: 600;
}

.extra-item dd {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink);
  word-break: break-word;
}

.extra-link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.visited-checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.visited-checkbox-label input {
  display: none;
}

/* Toggle-like checkbox */
.checkbox-custom {
  width: 44px;
  height: 26px;
  border: 1px solid rgba(30, 42, 56, 0.22);
  border-radius: 999px;
  position: relative;
  background: rgba(30, 42, 56, 0.12);
  transition: all 0.24s ease;
}

.checkbox-custom::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16);
  transition: transform 0.24s ease;
}

.visited-checkbox-label input:checked + .checkbox-custom {
  background: var(--accent);
  border-color: var(--accent);
}

.visited-checkbox-label input:checked + .checkbox-custom::after {
  transform: translateX(18px);
}

.visited-checkbox-label input:focus-visible + .checkbox-custom {
  outline: 2px solid rgba(30, 42, 56, 0.42);
  outline-offset: 2px;
}

.favorite-toggle-btn {
  border: 1px solid rgba(30, 42, 56, 0.18);
  background: #ffffff;
  color: #556170;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.favorite-toggle-btn.is-active {
  color: #7a5a12;
  border-color: rgba(178, 137, 43, 0.46);
  background: #fff7df;
}

.favorite-toggle-btn.is-pulsing {
  animation: favoritePulse 0.26s ease;
}

.favorite-icon {
  width: 14px;
  text-align: center;
}

.memo-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.memo-title {
  margin: 0;
  font-size: 13px;
  color: var(--ink-subtle);
  font-weight: 700;
}

.memo-textarea {
  width: 100%;
  min-height: 88px;
  max-height: 150px;
  border: 1px solid rgba(30, 42, 56, 0.16);
  border-radius: 10px;
  background: #ffffff;
  color: var(--ink);
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.45;
  resize: vertical;
}

.memo-textarea:focus-visible {
  outline: 2px solid rgba(30, 42, 56, 0.28);
  outline-offset: 1px;
}

.memo-counter {
  margin: 0;
  text-align: right;
  font-size: 11px;
  color: var(--ink-muted);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  --panel-base-translate: 24px;
  opacity: 0;
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes favoritePulse {
  0% {
    transform: scale(0.9);
  }
  55% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .booth-map,
  .map-page,
  .progress-page,
  .legend-row,
  .heatmap-control-block,
  .panel-slide-enter-active,
  .panel-slide-leave-active {
    transition: none;
    animation: none;
  }
}
</style>
