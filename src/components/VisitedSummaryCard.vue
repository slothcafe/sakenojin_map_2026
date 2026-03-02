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
        <svg
          viewBox="0 0 300 320"
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
        <p class="tile-caption">地域をタップで地域別一覧へ</p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import regionPaths from '../assets/niigata_region_paths.json'

const REGIONS = ['上越', '中越', '下越', '佐渡']

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
