<template>
  <div class="app-container">
    <header class="header">
      <h1>酒の陣</h1>
      <button @click="resetVisited" class="reset-btn">履歴リセット</button>
    </header>

    <!-- タブ切り替え -->
    <nav class="tab-bar">
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'map' }"
        @click="currentView = 'map'"
      >
        🗺 マップ
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'progress' }"
        @click="currentView = 'progress'"
      >
        📊 進捗
      </button>
    </nav>

    <!-- マップ画面 -->
    <main v-if="currentView === 'map'" class="map-container">
      <div class="legend">
        <div v-for="r in regionDataList" :key="r.id" class="legend-item">
          <div :style="{ backgroundColor: r.color, borderColor: r.stroke }" class="legend-color-box"></div>
          <span>{{ r.name }}</span>
        </div>
      </div>

      <svg
        :width="mapWidth"
        :height="mapHeight"
        class="booth-map"
      >
        <g v-for="booth in validBooths" :key="booth.id">
          <!-- Booth background -->
          <rect
            v-if="!booth.isEmpty"
            :x="booth.x"
            :y="booth.y"
            width="64"
            height="64"
            class="booth-rect"
            :style="getBoothStyle(booth)"
            @click="selectBooth(booth)"
          />
          <!-- 空ブースの場合は背景枠だけ描画（クリック不可） -->
          <rect
            v-else
            :x="booth.x"
            :y="booth.y"
            width="64"
            height="64"
            class="booth-rect is-empty"
          />

          <!-- Booth text / ID -->
          <text
            v-if="!booth.isEmpty"
            :x="booth.x + 32"
            :y="booth.y + 16"
            text-anchor="middle"
            class="booth-text"
          >
            {{ booth.id }}
          </text>

          <!-- Visited badge -->
          <text
            v-if="!booth.isEmpty && visitRecords[booth.id]?.visited"
            :x="booth.x + 52"
            :y="booth.y + 16"
            text-anchor="middle"
            class="visited-check"
          >
            ✔
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

        <!-- 選択中ブースのハイライト枠（常に手前に表示） -->
        <rect
          v-if="selectedBooth && !selectedBooth.isEmpty"
          :x="selectedBooth.x"
          :y="selectedBooth.y"
          width="64"
          height="64"
          fill="none"
          stroke="black"
          stroke-width="4"
          rx="4"
          class="selected-highlight"
          pointer-events="none"
        />
      </svg>
    </main>

    <!-- 進捗画面 -->
    <main v-else-if="currentView === 'progress'" class="progress-container">
      <ProgressView
        :breweries="breweries"
        :visitRecords="visitRecords"
      />
    </main>

    <!-- Bottom Panel -->
    <transition name="slide-up">
      <div v-if="selectedBooth && !selectedBooth.isEmpty" class="bottom-panel">
        <div class="panel-header">
          <h2>{{ selectedBooth.name }}</h2>
          <button class="close-btn" @click="selectedBoothId = null">×</button>
        </div>
        <div class="panel-body">
          <div class="tasting-info">
            <div class="tasting-item">
              <span class="label">甘辛度</span>
              <span class="val">{{ selectedBooth.estimated.sweetDry > 0 ? '+' : '' }}{{ selectedBooth.estimated.sweetDry }}</span>
            </div>
            <div class="tasting-item">
              <span class="label">濃淡度</span>
              <span class="val">{{ selectedBooth.estimated.lightRich > 0 ? '+' : '' }}{{ selectedBooth.estimated.lightRich }}</span>
            </div>
          </div>
          <button
            class="visit-btn"
            :class="{ 'is-visited-btn': visitRecords[selectedBooth.id]?.visited }"
            @click="toggleVisited(selectedBooth.id)"
          >
            {{ visitRecords[selectedBooth.id]?.visited ? '訪問済みを取り消す' : '訪問済みにする' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import breweriesData from '../niigata_sakenojin_breweries_list.json'
import ProgressView from './components/ProgressView.vue'

// --- Constants ---
const BOOTH_SIZE = 64
const BLOCK_GAP_X = 24
const BLOCK_GAP_Y = 32
const BLOCKS_X = 7
const BLOCKS_Y = 3
const INNER_COLS = 2
const INNER_ROWS = 2

// Calculate Map Size
const mapWidth = BLOCKS_X * (INNER_COLS * BOOTH_SIZE) + (BLOCKS_X - 1) * BLOCK_GAP_X
const mapHeight = BLOCKS_Y * (INNER_ROWS * BOOTH_SIZE) + (BLOCKS_Y - 1) * BLOCK_GAP_Y

// Region Display Colors
const regionDataList = [
  { id: 'kaetsu', name: '下越', color: '#D6A9B8', stroke: '#C293A4' },
  { id: 'chuetsu', name: '中越', color: '#A9C8A9', stroke: '#8EAF8E' },
  { id: 'joetsu', name: '上越', color: '#AEB9C8', stroke: '#8E9BAC' },
  { id: 'sado', name: '佐渡', color: '#D4B84F', stroke: '#B29739' }
]

// --- State ---
const baseBooths = ref([]) // 座標のみを持つBooth配列
const breweries = ref(new Map()) // BreweryドメインモデルのMap
const visitRecords = ref({}) // 訪問記録
const selectedBoothId = ref(null)
const currentView = ref('map') // 'map' | 'progress'

const getBoothStyle = (booth) => {
  if (booth.isEmpty) return {}
  const regionDef = regionDataList.find(r => r.id === booth.region)
  let fill = '#e5e7eb'
  let stroke = '#ffffff'
  
  if (regionDef) {
    fill = regionDef.color
    stroke = regionDef.stroke
  }

  const isVisited = visitRecords.value[booth.id]?.visited

  return {
    fill: fill,
    stroke: stroke,
    strokeWidth: '2px',
    opacity: isVisited ? 1 : 0.3
  }
}

// --- Helper ---
const formatNameWithLineBreaks = (rawName) => {
  let clean = rawName.replace(/(株式会社|\(株\)|有限会社|\(有\)|合名会社|\(名\)|合資会社|\(資\)|合同会社|\(同\))/g, '').trim()
  
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

const generateDummyTaste = (brewery) => {
  return {
    sweetDry: Number((Math.random() * 4 - 2).toFixed(1)),
    lightRich: Number((Math.random() * 4 - 2).toFixed(1))
  }
}

// --- Initialization ---
const generateGridCoordinates = () => {
  const COLS = BLOCKS_X * INNER_COLS // 14
  const ROWS = BLOCKS_Y * INNER_ROWS // 6
  
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
  for (const b of breweriesData) {
    const rawName = b['酒造名']
    const cleanName = rawName.replace(/(株式会社|\(株\)|有限会社|\(有\)|合名会社|\(名\)|合資会社|\(資\)|合同会社|\(同\))/g, '').trim()
    
    const regionNameJa = b['地域'] || b['地区'] || null // 日本語地域名（「上越」「中越」「下越」「佐渡」）
    let regionId = regionNameJa
    if (regionId === '下越') regionId = 'kaetsu';
    else if (regionId === '中越') regionId = 'chuetsu';
    else if (regionId === '上越') regionId = 'joetsu';
    else if (regionId === '佐渡') regionId = 'sado';

    breweryMap.set(b.id, {
      id: b.id,
      name: cleanName,
      rawName: rawName,
      region: regionId,
      regionName: regionNameJa, // 集計ロジック用（日本語地域名を保持）
      taste: generateDummyTaste(b)
    })
  }
  breweries.value = breweryMap
}

const initMap = () => {
  const { grid, ROWS, COLS } = generateGridCoordinates()
  baseBooths.value = generateBooths(grid, ROWS, COLS)
  attachBreweries()
}

const loadVisited = () => {
  const stored = localStorage.getItem('sake_visited')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        // Migrate array (old format) to object (new format)
        const migrated = {}
        for (const id of parsed) {
          migrated[id] = { visited: true }
        }
        visitRecords.value = migrated
      } else {
        visitRecords.value = parsed
      }
    } catch(e) {}
  }
}

const saveVisited = () => {
  localStorage.setItem('sake_visited', JSON.stringify(visitRecords.value))
}

onMounted(() => {
  initMap()
  loadVisited()
})

// --- Computed ---
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
      estimated: brewery ? brewery.taste : { sweetDry: 0, lightRich: 0 },
      region: brewery ? brewery.region : null
    }
  })
})

const validBooths = computed(() => mapBoothsWithBreweryData.value)

const selectedBooth = computed(() => {
  return mapBoothsWithBreweryData.value.find(b => b.id === selectedBoothId.value) || null
})

// --- Actions ---
const selectBooth = (booth) => {
  if (booth.isEmpty) return
  selectedBoothId.value = booth.id
}

const toggleVisited = (id) => {
  const record = visitRecords.value[id] || { visited: false }
  visitRecords.value = {
    ...visitRecords.value,
    [id]: {
      ...record,
      visited: !record.visited,
      visitedAt: !record.visited ? new Date().toISOString() : undefined
    }
  }
  saveVisited()
}

const resetVisited = () => {
  if (confirm('訪問履歴をすべてリセットしますか？')) {
    visitRecords.value = {}
    saveVisited()
    selectedBoothId.value = null
  }
}
</script>

<style scoped>
/* App Layout */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background-color: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.is-active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* Progress Container */
.progress-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #f9fafb;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  z-index: 10;
}

.header h1 {
  font-size: 1.2rem;
  margin: 0;
  color: #111827;
}

.reset-btn {
  font-size: 0.8rem;
  padding: 6px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #4b5563;
  cursor: pointer;
}

/* Main Map Area */
.map-container {
  flex: 1;
  overflow: auto; /* Enable horizontal/vertical scrolling */
  padding: 24px 16px 120px 16px; /* space at bottom for panel */
  -webkit-overflow-scrolling: touch;
}

.booth-map {
  display: block;
  margin: 0 auto;
}

/* Booth Styles */
.booth-rect {
  fill: #e5e7eb; /* unvisited light gray */
  stroke: #ffffff;
  stroke-width: 2px;
  rx: 4px; /* rounded corners */
  cursor: pointer;
  transition: all 0.2s ease;
}

.booth-rect.is-empty {
  fill: transparent; /* 空枠は透明か薄い枠線のみなどにする */
  stroke: #e5e7eb;
  stroke-dasharray: 4; /* 点線表現などで空きを示す */
  cursor: default;
}

.visited-check {
  font-size: 14px;
  fill: #e11d48;
  font-weight: bold;
  pointer-events: none;
}

.legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color-box {
  width: 16px;
  height: 16px;
  border-width: 2px;
  border-style: solid;
  border-radius: 2px;
}

.legend-item span {
  font-size: 14px;
  color: #4b5563;
  font-weight: bold;
}

.booth-text {
  font-size: 14px;
  fill: #4b5563;
  font-weight: bold;
  pointer-events: none; /* so click passes through to rect */
}

.booth-name-text {
  font-size: 16px;
  fill: #4b5563;
  font-weight: bold;
  pointer-events: none;
}

.booth-name-text.is-small-text {
  font-size: 10px;
}

.booth-name-text.is-medium-text {
  font-size: 12px;
}

/* .is-visited-text removed */

/* Bottom Panel */
.bottom-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px 20px 24px;
  z-index: 20;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  padding: 0 8px;
  cursor: pointer;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tasting-info {
  display: flex;
  gap: 24px;
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 8px;
}

.tasting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tasting-item .label {
  font-size: 0.75rem;
  color: #6b7280;
}
.tasting-item .val {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.visit-btn {
  width: 100%;
  padding: 14px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.visit-btn.is-visited-btn {
  background: #ef4444; /* red to unvisit */
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
