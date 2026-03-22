<template>
  <div class="progress-view">
    <section class="layer-card summary-layer">
      <VisitedSummaryCard
        :totalVisited="totalVisited"
        :totalBreweries="TOTAL_BREWERIES"
        :regionStats="regionStats"
        :breweries="breweries"
        :visitedHistoryRecords="visitedHistoryRecords"
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
      <VisitTimeline :records="timelineRecords" @memoTap="onTimelineMemoTap" />
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

    <section class="layer-card data-management-layer">
      <h2 class="section-title">データ管理</h2>
      <div class="data-management-actions">
        <button class="data-action-btn" type="button" @click="$emit('exportBackup')">
          データを書き出す
        </button>
        <button class="data-action-btn" type="button" @click="openImportFileDialog">
          データを読み込む
        </button>
        <button class="data-action-btn danger" type="button" @click="$emit('resetVisited')">
          巡歴を削除する
        </button>
      </div>
      <input
        ref="importFileInputRef"
        class="import-file-input"
        type="file"
        accept="application/json,.json"
        @change="onImportFileChange"
      >
      <p class="data-management-note">
        機種変更や再インストール前に書き出しておくことをおすすめします。
      </p>
    </section>

    <div class="data-info-area">
      <hr class="data-info-divider" />
      <div class="data-info-content">
        <button class="data-info-link" type="button" @click="isDataSourceModalOpen = true">
          データ出典
        </button>
        <span class="data-info-version">version 1.0</span>
      </div>
    </div>

    <!-- Data Source Modal -->
    <div v-if="isDataSourceModalOpen" class="data-source-modal-overlay" @click="isDataSourceModalOpen = false">
      <div class="data-source-modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">データ出典</h3>
          <button class="modal-close-btn" type="button" @click="isDataSourceModalOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="source-section">
            <h4 class="source-title">地図データ</h4>
            <p class="source-text">
              「国土数値情報（行政区域データ）」<br>
              （国土交通省 国土数値情報ダウンロードサイト）<br>
              <a href="https://nlftp.mlit.go.jp/" target="_blank" rel="noopener">https://nlftp.mlit.go.jp/</a>
            </p>
            <p class="source-note">※上記サイトのデータを加工して作成しています</p>
          </div>
          <div class="source-section">
            <h4 class="source-title">酒造情報</h4>
            <p class="source-text">
              「にいがた酒の陣」公式サイト<br>
              <a href="https://www.niigata-sake.or.jp/sakenojin/" target="_blank" rel="noopener">https://www.niigata-sake.or.jp/sakenojin/</a>
            </p>
            <p class="source-note">※公式サイトの公開情報をもとに作成</p>
          </div>
        </div>
      </div>
    </div>
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

const emit = defineEmits(['resetVisited', 'exportBackup', 'importBackup', 'openMemoForBrewery'])

const timelineSectionRef = ref(null)
const regionSectionRef = ref(null)
const importFileInputRef = ref(null)
const activeRegion = ref(null)
const highlightedRegion = ref(null)
const highlightTimer = ref(null)
const isDataSourceModalOpen = ref(false)

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

const timelineRecords = computed(() => {
  return props.visitedHistoryRecords.map((record) => {
    const breweryId = String(record?.breweryId || '')
    const memo = typeof props.visitRecords[breweryId]?.memo === 'string'
      ? props.visitRecords[breweryId].memo
      : ''
    return {
      ...record,
      memo
    }
  })
})

const onTimelineMemoTap = (breweryId) => {
  if (!breweryId) return
  emit('openMemoForBrewery', String(breweryId))
}

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

const openImportFileDialog = () => {
  importFileInputRef.value?.click()
}

const onImportFileChange = (event) => {
  const input = event.target
  const [file] = input?.files || []
  if (file) {
    emit('importBackup', file)
  }
  if (input) {
    input.value = ''
  }
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

.data-management-layer {
  padding: var(--space-16);
}

.data-management-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.data-action-btn {
  width: 100%;
  border: 1px solid rgba(184, 153, 71, 0.4);
  background: linear-gradient(180deg, #fdfbee, #fafaea);
  color: #8a7335;
  border-radius: 12px;
  font-size: 14px;
  font-family: "Noto Sans JP", sans-serif;
  font-weight: 600;
  padding: 12px var(--space-16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  text-align: left;
}

.data-action-btn.danger {
  color: #7d4e34;
  border-color: rgba(160, 112, 80, 0.4);
}

.import-file-input {
  display: none;
}

.data-management-note {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-subtle);
}

@media (max-width: 420px) {
  .progress-view {
    gap: var(--space-16);
  }
}

.data-info-area {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-info-divider {
  width: 100%;
  border: none;
  border-top: 1px solid rgba(184, 153, 71, 0.3);
  margin: 0;
}

.data-info-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.data-info-link {
  background: none;
  border: none;
  color: var(--ink-subtle);
  font-size: 13px;
  text-decoration: underline;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}

.data-info-version {
  color: rgba(92, 92, 92, 0.6);
  font-size: 12px;
}

/* Modal Styles */
.data-source-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(42, 42, 42, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-20);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.data-source-modal-content {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-16) var(--space-20);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--ink-subtle);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-body {
  padding: var(--space-20);
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.source-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  border-left: 3px solid #8a7335;
  padding-left: 8px;
}

.source-text {
  margin: 0;
  font-size: 13px;
  color: var(--ink-subtle);
  line-height: 1.6;
}

.source-text a {
  color: #0066cc;
  text-decoration: none;
  word-break: break-all;
}

.source-note {
  margin: 0;
  font-size: 12px;
  color: rgba(92, 92, 92, 0.8);
  line-height: 1.4;
}
</style>
