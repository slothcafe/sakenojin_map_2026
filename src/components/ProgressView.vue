<template>
  <div class="progress-view">

    <!-- ① 円形プログレスバー -->
    <section class="section circular-section">
      <h2 class="section-title">総訪問進捗</h2>
      <div class="circular-wrapper">
        <svg :width="circleSize" :height="circleSize" viewBox="0 0 120 120">
          <!-- 背景リング -->
          <circle
            cx="60" cy="60" :r="radius"
            fill="none"
            stroke="#e2d8c6"
            stroke-width="10"
          />
          <!-- プログレスリング -->
          <circle
            cx="60" cy="60" :r="radius"
            fill="none"
            stroke="#7a6643"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 60 60)"
            class="progress-ring"
          />
          <!-- 中央テキスト -->
          <text x="60" y="54" text-anchor="middle" class="circle-label-count">
            {{ totalVisited }} / {{ totalCount }}
          </text>
          <text x="60" y="72" text-anchor="middle" class="circle-label-pct">
            {{ totalPercentage }}%
          </text>
        </svg>
      </div>
    </section>

    <!-- ② 新潟県 簡易 SVGマップ -->
    <section class="section map-section">
      <h2 class="section-title">地域マップ</h2>
      <div class="map-wrapper">
        <svg
          viewBox="0 0 300 320"
          class="niigata-map"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g 
            v-for="(regionData, regionName) in regionPaths" 
            :key="regionName"
            @click="$emit('regionClick', regionName)"
          >
            <path
              :d="regionData.path"
              :fill="regionFill(regionName)"
              stroke="#9d8a6a"
              stroke-width="1.5"
              class="map-region"
            />
            <text :x="getLabelPos(regionName).x" :y="getLabelPos(regionName).y" text-anchor="middle" class="map-label">{{ regionName }}</text>
            <text :x="getLabelPos(regionName).x" :y="getLabelPos(regionName).y + 18" text-anchor="middle" class="map-stat">
              {{ regionStats[regionName]?.visited || 0 }}/{{ regionStats[regionName]?.total || 0 }}
            </text>
          </g>
        </svg>
      </div>
    </section>

    <!-- ③ 地域別ダッシュボード -->
    <section class="section dashboard-section">
      <h2 class="section-title">地域別進捗</h2>
      <div class="dashboard-list">
        <div
          v-for="region in REGIONS"
          :key="region"
          class="dashboard-item"
        >
          <div class="dashboard-row-top">
            <span class="region-name">{{ region }}</span>
            <span class="region-count">
              {{ regionStats[region].visited }} / {{ regionStats[region].total }}
            </span>
            <span class="region-pct">{{ regionStats[region].percentage }}%</span>
          </div>
          <div class="bar-bg">
            <div
              class="bar-fill"
              :style="{ width: regionStats[region].percentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section reset-section">
      <button class="reset-history-btn" type="button" @click="$emit('resetVisited')">
        履歴リセット
      </button>
    </section>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProgressStats, REGIONS } from '../composables/useProgressStats'
import regionPaths from '../assets/niigata_region_paths.json'

const props = defineProps({
  breweries: {
    type: Map,
    required: true
  },
  visitRecords: {
    type: Object,
    required: true
  }
})

defineEmits(['regionClick', 'resetVisited'])

// --- 集計 ---
const { regionStats, totalCount, totalVisited, totalPercentage } = useProgressStats(
  computed(() => props.breweries),
  computed(() => props.visitRecords)
)

const labelPositions = {
  '下越': { x: 230, y: 120 },
  '中越': { x: 160, y: 220 },
  '上越': { x: 70, y: 255 },
  '佐渡': { x: 105, y: 95 }
}

const getLabelPos = (regionName) => {
  return labelPositions[regionName] || { x: regionPaths[regionName]?.center[0] || 150, y: (regionPaths[regionName]?.center[1] || 150) - 10 }
}

// --- 円形プログレスバー ---
const circleSize = 160
const radius = 48
const circumference = 2 * Math.PI * radius

const strokeDashoffset = computed(() => {
  const progress = totalPercentage.value / 100
  return circumference * (1 - progress)
})

// --- マップ塗り分け ---
const regionFill = (region) => {
  const pct = regionStats.value[region]?.percentage ?? 0
  const toneMap = {
    下越: [165, 120, 128],
    中越: [126, 145, 111],
    上越: [114, 123, 145],
    佐渡: [167, 141, 82]
  }
  const [r, g, b] = toneMap[region] || [142, 127, 101]
  const alpha = 0.2 + (pct / 100) * 0.6
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`
}
</script>

<style scoped>
.progress-view {
  --ink: #2A2A2A;
  --ink-subtle: #5C5C5C;
  --accent: #1D2A4B;
  --line-soft: rgba(184, 153, 71, 0.2);
  --line-faint: rgba(184, 153, 71, 0.1);
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-24);
  padding: 0 0 var(--space-24);
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Section cards */
.section {
  width: 100%;
  padding: var(--space-24) var(--space-16);
  background: linear-gradient(180deg, rgba(253, 251, 238, 0.98) 0%, rgba(246, 240, 227, 0.98) 100%);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  box-shadow:
    0 6px 14px rgba(42, 42, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
}

.section + .section {
  border-top: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.05em;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  margin: 0 0 var(--space-16);
}

/* Circular progress */
.circular-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circular-wrapper {
  display: flex;
  justify-content: center;
}

.progress-ring {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.circle-label-count {
  font-size: 20px;
  font-weight: 700;
  fill: var(--ink);
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
}

.circle-label-pct {
  font-size: 13px;
  fill: var(--ink-subtle);
}

/* SVG map */
.map-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.map-wrapper {
  width: 100%;
  max-width: 300px;
}

.niigata-map {
  width: 100%;
  height: auto;
}

.map-region {
  cursor: pointer;
  transition: opacity 0.18s ease;
  filter: saturate(0.68);
}
.map-region:hover {
  opacity: 0.9;
}

.map-label {
  font-size: 13px;
  font-weight: 600;
  fill: var(--ink);
  font-family: "Noto Sans JP", sans-serif;
  pointer-events: none;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
}

.map-stat {
  font-size: 11px;
  fill: rgba(51, 41, 25, 0.78);
  pointer-events: none;
}

/* Region dashboard */
.dashboard-section {
  display: flex;
  flex-direction: column;
}

.dashboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.dashboard-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-12);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(255, 250, 243, 0.72);
}

.dashboard-row-top {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

.region-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  min-width: 3em;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
}

.region-count {
  font-size: 14px;
  color: var(--ink);
  font-weight: 600;
}

.region-pct {
  font-size: 12px;
  color: var(--ink-subtle);
  margin-left: auto;
}

/* Progress bar */
.bar-bg {
  width: 100%;
  height: 8px;
  background: #e6dcc8;
  border-radius: 9999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(180deg, #B89947, #8A7335);
  border-radius: 9999px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.reset-section {
  padding-top: var(--space-16);
  padding-bottom: var(--space-16);
}

.reset-history-btn {
  width: 100%;
  border: 1px solid rgba(184, 153, 71, 0.4);
  background: linear-gradient(180deg, #FDFBEE, #FAFAEA);
  color: #8A7335;
  border-radius: 999px;
  font-size: 14px;
  font-family: "Noto Sans JP", sans-serif;
  font-weight: 600;
  padding: var(--space-12) var(--space-16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
</style>
