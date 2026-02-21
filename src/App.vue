<template>
  <div class="app-container">
    <header class="header">
      <h1>酒の陣 ブースマップ</h1>
      <button @click="resetVisited" class="reset-btn">履歴リセット</button>
    </header>

    <main class="map-container">
      <svg
        :width="mapWidth"
        :height="mapHeight"
        class="booth-map"
      >
        <g v-for="booth in validBooths" :key="booth.id">
          <!-- Booth background -->
          <rect
            :x="booth.x"
            :y="booth.y"
            width="40"
            height="40"
            class="booth-rect"
            :class="{
              'is-visited': visitedIds.has(booth.id),
              'is-selected': selectedBoothId === booth.id
            }"
            @click="selectBooth(booth)"
          />
          <!-- Booth text / ID -->
          <text
            :x="booth.x + 20"
            :y="booth.y + 24"
            text-anchor="middle"
            class="booth-text"
            :class="{'is-visited-text': visitedIds.has(booth.id)}"
          >
            {{ booth.id }}
          </text>
        </g>
      </svg>
    </main>

    <!-- Bottom Panel -->
    <transition name="slide-up">
      <div v-if="selectedBooth" class="bottom-panel">
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
            :class="{ 'is-visited-btn': visitedIds.has(selectedBooth.id) }"
            @click="toggleVisited(selectedBooth.id)"
          >
            {{ visitedIds.has(selectedBooth.id) ? '訪問済みを取り消す' : '訪問済みにする' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// --- Constants ---
const BOOTH_SIZE = 40
const BLOCK_GAP_X = 24
const BLOCK_GAP_Y = 32
const BLOCKS_X = 7
const BLOCKS_Y = 3
const INNER_COLS = 2
const INNER_ROWS = 2

// Calculate Map Size
const mapWidth = BLOCKS_X * (INNER_COLS * BOOTH_SIZE) + (BLOCKS_X - 1) * BLOCK_GAP_X
const mapHeight = BLOCKS_Y * (INNER_ROWS * BOOTH_SIZE) + (BLOCKS_Y - 1) * BLOCK_GAP_Y

// --- State ---
const booths = ref([])
const visitedIds = ref(new Set())
const selectedBoothId = ref(null)

// --- Initialization ---
const initMap = () => {
  const generated = []
  let layoutIndex = 0

  for (let by = 0; by < BLOCKS_Y; by++) {
    for (let bx = 0; bx < BLOCKS_X; bx++) {
      for (let iy = 0; iy < INNER_ROWS; iy++) {
        for (let ix = 0; ix < INNER_COLS; ix++) {
          const x = bx * (INNER_COLS * BOOTH_SIZE + BLOCK_GAP_X) + ix * BOOTH_SIZE
          const y = by * (INNER_ROWS * BOOTH_SIZE + BLOCK_GAP_Y) + iy * BOOTH_SIZE

          generated.push({ layoutIndex, x, y })
          layoutIndex++
        }
      }
    }
  }

  // Generate 82 valid booths up to layoutIndex 81
  const valid = generated.slice(0, 82).map((b, index) => {
    const id = String(index + 1)
    
    // Default Dummy Data
    let name = `ダミー酒造 ${id}`
    let sweetDry = (Math.random() * 4 - 2).toFixed(1)
    let lightRich = (Math.random() * 4 - 2).toFixed(1)

    // Apply specific dummy data if ID is 75
    if (id === '75') {
      name = 'ダミー酒造(株)'
      sweetDry = 1.2
      lightRich = -0.8
    }

    return {
      ...b,
      id,
      name,
      estimated: {
        sweetDry: Number(sweetDry),
        lightRich: Number(lightRich)
      }
    }
  })

  booths.value = valid
}

const loadVisited = () => {
  const stored = localStorage.getItem('sake_visited')
  if (stored) {
    try {
      const arr = JSON.parse(stored)
      visitedIds.value = new Set(arr)
    } catch(e) {}
  }
}

const saveVisited = () => {
  localStorage.setItem('sake_visited', JSON.stringify(Array.from(visitedIds.value)))
}

onMounted(() => {
  initMap()
  loadVisited()
})

// --- Computed ---
const validBooths = computed(() => booths.value)

const selectedBooth = computed(() => {
  return booths.value.find(b => b.id === selectedBoothId.value) || null
})

// --- Actions ---
const selectBooth = (booth) => {
  selectedBoothId.value = booth.id
}

const toggleVisited = (id) => {
  const newSet = new Set(visitedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  visitedIds.value = newSet
  saveVisited()
}

const resetVisited = () => {
  if (confirm('訪問履歴をすべてリセットしますか？')) {
    visitedIds.value = new Set()
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

.booth-rect.is-visited {
  fill: #4caf50; /* visited green */
}

.booth-rect.is-selected {
  stroke: #2563eb; /* selected border */
  stroke-width: 3px;
}

.booth-text {
  font-size: 12px;
  fill: #4b5563;
  font-weight: bold;
  pointer-events: none; /* so click passes through to rect */
}
.is-visited-text {
  fill: #ffffff;
}

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
