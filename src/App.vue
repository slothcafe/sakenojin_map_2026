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
      <div class="map-controls">
        <div class="mode-toggle">
          <button 
            class="mode-btn" 
            :class="{ 'is-active': displayMode === 'normal' }"
            @click="displayMode = 'normal'"
          >
            通常
          </button>
          <button 
            class="mode-btn" 
            :class="{ 'is-active': displayMode === 'heatmap' }"
            @click="displayMode = 'heatmap'"
          >
            ヒートマップ
          </button>
        </div>

        <div v-if="displayMode === 'heatmap'" class="axis-selector">
          <button 
            v-for="axis in [
              { id: 'sweetDry', name: '甘辛' },
              { id: 'lightRich', name: '淡濃' },
              { id: 'aroma', name: '香り' }
            ]" 
            :key="axis.id"
            class="axis-btn"
            :class="{ 'is-active': heatmapAxis === axis.id }"
            @click="heatmapAxis = axis.id"
          >
            {{ axis.name }}
          </button>
        </div>

        <div v-if="displayMode === 'heatmap'" class="heatmap-legend">
          <span class="legend-label min">{{ heatmapAxis === 'aroma' ? '控えめ' : (heatmapAxis === 'lightRich' ? '淡麗' : '甘口') }}</span>
          <div class="legend-gradient" :class="heatmapAxis + '-gradient'"></div>
          <span class="legend-label max">{{ heatmapAxis === 'aroma' ? '華やか' : (heatmapAxis === 'lightRich' ? '濃醇' : '辛口') }}</span>
        </div>
      </div>

      <div v-if="displayMode === 'normal'" class="legend">
        <div v-for="r in regionDataList" :key="r.id" class="legend-item">
          <div :style="{ backgroundColor: r.color, borderColor: r.stroke }" class="legend-color-box"></div>
          <span>{{ r.name }}</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">訪問計画:</span>
          <span class="stat-val">{{ visitedBreweryIds.length }} / {{ breweries.size }} 蔵</span>
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
            v-if="!booth.isEmpty && visitedBreweryIds.includes(booth.id)"
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

    <!-- Bottom Panel (Modal) -->
    <transition name="slide-up">
      <div v-if="selectedBooth && !selectedBooth.isEmpty" class="bottom-panel">
        <div class="panel-header">
          <div class="title-row">
            <h2>{{ selectedBooth.name }}</h2>
            <span class="booth-id-badge">No.{{ selectedBooth.id }}</span>
          </div>
          <button class="close-btn" @click="selectedBoothId = null">×</button>
        </div>
        
        <div class="panel-body">
          <div class="taste-bars">
            <!-- 甘辛 -->
            <div class="taste-row">
              <div class="taste-header">
                <span class="taste-title">甘辛</span>
                <span class="taste-current-label">{{ getSweetDryLabel(selectedBooth.estimated.sweetDry) }}</span>
              </div>
              <div class="taste-bar-wrapper">
                <span class="bar-limit-label min">甘口</span>
                <div class="bar-container">
                  <div class="bar-bg sweet-dry-bg"></div>
                  <div class="center-line"></div>
                  <div 
                    class="pointer" 
                    :style="{ left: getBarPosition(selectedBooth.estimated.sweetDry, -2, 2) + '%' }"
                  ></div>
                </div>
                <span class="bar-limit-label max">辛口</span>
              </div>
            </div>

            <!-- 淡濃 -->
            <div class="taste-row">
              <div class="taste-header">
                <span class="taste-title">淡濃</span>
                <span class="taste-current-label">{{ getLightRichLabel(selectedBooth.estimated.lightRich) }}</span>
              </div>
              <div class="taste-bar-wrapper">
                <span class="bar-limit-label min">淡麗</span>
                <div class="bar-container">
                  <div class="bar-bg light-rich-bg"></div>
                  <div class="center-line"></div>
                  <div 
                    class="pointer" 
                    :style="{ left: getBarPosition(selectedBooth.estimated.lightRich, -2, 2) + '%' }"
                  ></div>
                </div>
                <span class="bar-limit-label max">濃醇</span>
              </div>
            </div>

            <!-- 香り -->
            <div class="taste-row">
              <div class="taste-header">
                <span class="taste-title">香り</span>
                <span class="taste-current-label">{{ getAromaLabel(selectedBooth.estimated.aroma) }}</span>
              </div>
              <div class="taste-bar-wrapper">
                <span class="bar-limit-label min">控えめ</span>
                <div class="bar-container no-center">
                  <div class="bar-bg aroma-bg"></div>
                  <div 
                    class="pointer" 
                    :style="{ left: getBarPosition(selectedBooth.estimated.aroma, 0, 4) + '%' }"
                  ></div>
                </div>
                <span class="bar-limit-label max">華やか</span>
              </div>
            </div>
          </div>

          <div class="visited-control">
            <label class="visited-checkbox-label">
              <input 
                type="checkbox" 
                :checked="visitedBreweryIds.includes(selectedBooth.id)"
                @change="toggleVisited(selectedBooth.id)"
              >
              <span class="checkbox-custom"></span>
              訪問済み
            </label>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import breweriesData from '../niigata_sakenojin_breweries_list.json'
import breweryScores from '../brewery_scores.json'
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
const visitRecords = ref({}) // 訪問記録 (旧形式との互換性用)
const visitedBreweryIds = ref([]) // 新形式: ["75", "12"]
const selectedBoothId = ref(null)
const currentView = ref('map') // 'map' | 'progress'
const displayMode = ref('normal') // 'normal' | 'heatmap'
const heatmapAxis = ref('sweetDry') // 'sweetDry' | 'lightRich' | 'aroma'

// --- Constants & Config ---
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

// Helper to interpolate colors (vibrant for heatmap, muted for bars)
const interpolateColor = (val, axis, forHeatmap = true) => {
  const config = flavorAxes[axis]
  const normalized = (Math.max(config.min, Math.min(config.max, val)) - config.min) / (config.max - config.min)
  
  let hex;
  if (normalized <= 0.5) {
    const t = normalized * 2;
    hex = interpolateHex(config.colors[0], config.colors[1], t);
  } else {
    const t = (normalized - 0.5) * 2;
    hex = interpolateHex(config.colors[1], config.colors[2], t);
  }

  if (forHeatmap) {
    // ヒートマップ用：彩度を少し上げる
    return adjustSaturation(hex, 1.5)
  }
  // バー用：やや淡くする（彩度を下げる or 透明度を調整）
  return adjustSaturation(hex, 0.7)
}

const interpolateHex = (color1, color2, factor) => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const adjustSaturation = (hex, factor) => {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  s = Math.min(1, s * factor);

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  g = Math.round(hue2rgb(p, q, h) * 255);
  b = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const getBoothStyle = (booth) => {
  if (booth.isEmpty) return {}
  
  const isVisited = visitedBreweryIds.value.includes(booth.id)
  let fill = '#e5e7eb'
  let stroke = '#ffffff'

  if (displayMode.value === 'normal') {
    const regionDef = regionDataList.find(r => r.id === booth.region)
    if (regionDef) {
      fill = regionDef.color
      stroke = regionDef.stroke
    }
  } else {
    // Heatmap mode
    const taste = booth.estimated
    fill = interpolateColor(taste[heatmapAxis.value], heatmapAxis.value, true)
    stroke = adjustSaturation(fill, 1.2)
  }

  return {
    fill: fill,
    stroke: stroke,
    strokeWidth: '2px',
    opacity: isVisited ? 1 : 0.4
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
  const scoreMap = new Map()
  
  // スコアデータをMap化
  breweryScores.forEach(s => {
    scoreMap.set(s.id, s)
  })

  for (const b of breweriesData) {
    const rawName = b['酒造名']
    const cleanName = rawName.replace(/(株式会社|\(株\)|有限会社|\(有\)|合名会社|\(名\)|合資会社|\(資\)|合同会社|\(同\))/g, '').trim()
    
    const regionNameJa = b['地域'] || b['地区'] || null
    let regionId = regionNameJa
    if (regionId === '下越') regionId = 'kaetsu';
    else if (regionId === '中越') regionId = 'chuetsu';
    else if (regionId === '上越') regionId = 'joetsu';
    else if (regionId === '佐渡') regionId = 'sado';

    const score = scoreMap.get(b.id)
    const taste = score ? {
      sweetDry: score.relative.sweetDry_z,
      lightRich: score.relative.lightRich_z,
      aroma: score.relative.aroma_z
    } : { sweetDry: 0, lightRich: 0, aroma: 0 }

    breweryMap.set(b.id, {
      id: b.id,
      name: cleanName,
      rawName: rawName,
      region: regionId,
      regionName: regionNameJa,
      taste: taste
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
  // 新形式 ["75", "12"] を優先
  const newFormat = localStorage.getItem('visitedBreweries')
  if (newFormat) {
    try {
      visitedBreweryIds.value = JSON.parse(newFormat)
      // visitRecords も同期 (ProgressView 等で使用されている可能性があるため)
      const records = {}
      visitedBreweryIds.value.forEach(id => {
        records[id] = { visited: true }
      })
      visitRecords.value = records
      return
    } catch(e) {}
  }

  // 旧形式
  const stored = localStorage.getItem('sake_visited')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const ids = []
      const records = {}
      if (Array.isArray(parsed)) {
        parsed.forEach(id => {
          ids.push(String(id))
          records[id] = { visited: true }
        })
      } else {
        Object.keys(parsed).forEach(id => {
          if (parsed[id].visited) {
            ids.push(id)
            records[id] = { visited: true }
          }
        })
      }
      visitedBreweryIds.value = ids
      visitRecords.value = records
    } catch(e) {}
  }
}

const saveVisited = () => {
  localStorage.setItem('visitedBreweries', JSON.stringify(visitedBreweryIds.value))
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
  const index = visitedBreweryIds.value.indexOf(id)
  if (index === -1) {
    visitedBreweryIds.value.push(id)
    visitRecords.value[id] = { visited: true, visitedAt: new Date().toISOString() }
  } else {
    visitedBreweryIds.value.splice(index, 1)
    delete visitRecords.value[id]
  }
  saveVisited()
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
    visitedBreweryIds.value = []
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
  background-color: #f8f7f4;
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

/* Map Controls */
.map-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mode-toggle {
  display: flex;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
}

.mode-btn {
  padding: 6px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  background: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.is-active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.axis-selector {
  display: flex;
  gap: 8px;
}

.axis-btn {
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 20px;
  color: #4b5563;
  cursor: pointer;
}

.axis-btn.is-active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

/* Heatmap Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 300px;
}

.legend-gradient {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #f3f4f6, #8b5cf6); /* Default */
}

.sweetDry-gradient {
  background: v-bind('`linear-gradient(to right, ${flavorAxes.sweetDry.colors[0]}, ${flavorAxes.sweetDry.colors[1]}, ${flavorAxes.sweetDry.colors[2]})`');
}

.lightRich-gradient {
  background: v-bind('`linear-gradient(to right, ${flavorAxes.lightRich.colors[0]}, ${flavorAxes.lightRich.colors[1]}, ${flavorAxes.lightRich.colors[2]})`');
}

.aroma-gradient {
  background: v-bind('`linear-gradient(to right, ${flavorAxes.aroma.colors[0]}, ${flavorAxes.aroma.colors[1]}, ${flavorAxes.aroma.colors[2]})`');
}

.legend-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  min-width: 40px;
}

.legend-label.min { text-align: right; }
.legend-label.max { text-align: left; }

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
  gap: 12px;
  justify-content: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stats-row {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  align-items: center;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
}

.stat-val {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 700;
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
  align-items: flex-start;
  margin-bottom: 20px;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #111827;
  line-height: 1.2;
}

.booth-id-badge {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  font-size: 1.2rem;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.taste-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.taste-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.taste-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.taste-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
  min-width: 34px;
}

.taste-current-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #2563eb;
}

.taste-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 6px;
  border-left: 2px solid #e5e7eb;
}

.bar-limit-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  min-width: 42px;
}

.bar-limit-label.min { text-align: right; }
.bar-limit-label.max { text-align: left; }

.bar-container {
  position: relative;
  height: 12px;
  flex: 1;
  display: flex;
  align-items: center;
}

.bar-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
  opacity: 0.8;
}

.sweet-dry-bg {
  background: v-bind('`linear-gradient(to right, ${interpolateColor(-2, "sweetDry", false)}, ${interpolateColor(0, "sweetDry", false)}, ${interpolateColor(2, "sweetDry", false)})`');
}

.light-rich-bg {
  background: v-bind('`linear-gradient(to right, ${interpolateColor(-2, "lightRich", false)}, ${interpolateColor(0, "lightRich", false)}, ${interpolateColor(2, "lightRich", false)})`');
}

.aroma-bg {
  background: v-bind('`linear-gradient(to right, ${interpolateColor(0, "aroma", false)}, ${interpolateColor(2, "aroma", false)}, ${interpolateColor(4, "aroma", false)})`');
}

.center-line {
  position: absolute;
  left: 50%;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: #9ca3af;
  z-index: 1;
}

.pointer {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: white;
  border: 3px solid #1f2937;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.visited-control {
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.visited-checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
}

.visited-checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 24px;
  height: 24px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  position: relative;
  transition: all 0.2s;
}

.visited-checkbox-label input:checked + .checkbox-custom {
  background: #2563eb;
  border-color: #2563eb;
}

.visited-checkbox-label input:checked + .checkbox-custom::after {
  content: "✔";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
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
