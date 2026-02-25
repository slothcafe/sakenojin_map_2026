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
            stroke="#e5e7eb"
            stroke-width="10"
          />
          <!-- プログレスリング -->
          <circle
            cx="60" cy="60" :r="radius"
            fill="none"
            stroke="#1E2A38"
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
          <!-- 下越（右上寄り・北東） -->
          <g @click="$emit('regionClick', '下越')">
            <path
              d="M 155,10 L 230,20 L 240,60 L 210,90 L 190,120 L 155,125 L 140,100 L 145,50 Z"
              :fill="regionFill('下越')"
              stroke="#94a3b8"
              stroke-width="1.5"
              class="map-region"
            />
            <text x="190" y="72" text-anchor="middle" class="map-label">下越</text>
            <text x="190" y="90" text-anchor="middle" class="map-stat">
              {{ regionStats['下越'].visited }}/{{ regionStats['下越'].total }}
            </text>
          </g>

          <!-- 佐渡（左上・離島） -->
          <g @click="$emit('regionClick', '佐渡')">
            <path
              d="M 30,30 L 100,18 L 115,55 L 80,75 L 40,65 Z"
              :fill="regionFill('佐渡')"
              stroke="#94a3b8"
              stroke-width="1.5"
              class="map-region"
            />
            <text x="73" y="50" text-anchor="middle" class="map-label">佐渡</text>
            <text x="73" y="66" text-anchor="middle" class="map-stat">
              {{ regionStats['佐渡'].visited }}/{{ regionStats['佐渡'].total }}
            </text>
          </g>

          <!-- 中越（中央） -->
          <g @click="$emit('regionClick', '中越')">
            <path
              d="M 140,100 L 155,125 L 190,120 L 210,90 L 220,140 L 210,185 L 175,195 L 145,190 L 125,165 L 115,135 Z"
              :fill="regionFill('中越')"
              stroke="#94a3b8"
              stroke-width="1.5"
              class="map-region"
            />
            <text x="170" y="155" text-anchor="middle" class="map-label">中越</text>
            <text x="170" y="173" text-anchor="middle" class="map-stat">
              {{ regionStats['中越'].visited }}/{{ regionStats['中越'].total }}
            </text>
          </g>

          <!-- 上越（南西・下部） -->
          <g @click="$emit('regionClick', '上越')">
            <path
              d="M 115,135 L 125,165 L 145,190 L 175,195 L 180,230 L 155,270 L 120,290 L 90,280 L 70,250 L 75,210 L 95,185 L 100,155 Z"
              :fill="regionFill('上越')"
              stroke="#94a3b8"
              stroke-width="1.5"
              class="map-region"
            />
            <text x="128" y="235" text-anchor="middle" class="map-label">上越</text>
            <text x="128" y="253" text-anchor="middle" class="map-stat">
              {{ regionStats['上越'].visited }}/{{ regionStats['上越'].total }}
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
  // 0% -> alpha=0.15, 100% -> alpha=1.0
  const alpha = 0.15 + (pct / 100) * 0.85
  return `rgba(37, 99, 235, ${alpha.toFixed(2)})`
}
</script>

<style scoped>
.progress-view {
  --ink: #1e1e1e;
  --ink-subtle: #6b6b6b;
  --accent: #1e2a38;
  --line-soft: rgba(0, 0, 0, 0.08);
  --line-faint: rgba(0, 0, 0, 0.05);
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
  background: #ffffff;
  border: 1px solid var(--line-faint);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}

.section + .section {
  border-top: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-subtle);
  letter-spacing: 0.04em;
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
  font-size: 18px;
  font-weight: 600;
  fill: var(--ink);
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
  transition: opacity 0.2s ease;
  filter: saturate(0.72);
}
.map-region:hover {
  opacity: 0.85;
}

.map-label {
  font-size: 13px;
  font-weight: 600;
  fill: #1f1f1f;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.map-stat {
  font-size: 11px;
  fill: rgba(0, 0, 0, 0.72);
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
  background: #fffdf9;
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
  background: #e8e5df;
  border-radius: 9999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(180deg, #33485f, #1e2a38);
  border-radius: 9999px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.reset-section {
  padding-top: var(--space-16);
  padding-bottom: var(--space-16);
}

.reset-history-btn {
  width: 100%;
  border: 1px solid rgba(30, 42, 56, 0.25);
  background: #ffffff;
  color: var(--accent);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  padding: var(--space-12) var(--space-16);
}
</style>
