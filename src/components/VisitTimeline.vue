<template>
  <div class="timeline-root">
    <p v-if="groups.length === 0" class="timeline-empty">
      まだ訪問記録がありません。酒造を訪問済みにするとここに時系列で表示されます。
    </p>

    <div v-else class="timeline-groups">
      <section v-for="group in groups" :key="group.dateKey" class="timeline-group">
        <h3 class="timeline-date">{{ group.dateLabel }}</h3>
        <ul class="timeline-list">
          <li
            v-for="item in group.items"
            :key="item.breweryId + item.visitedAt"
            class="timeline-item"
            :class="{ 'is-clickable': item.hasMemo }"
            @click="onItemTap(item)"
          >
            <span class="timeline-dot" aria-hidden="true"></span>
            <div class="timeline-body">
              <div class="timeline-line">
                <span class="timeline-time">{{ item.timeLabel }}</span>
                <span class="timeline-booth">No.{{ item.breweryId }}</span>
                <span class="timeline-name">{{ item.breweryName }}</span>
                <span class="timeline-region">（{{ item.region }}）</span>
              </div>
              <p v-if="item.hasMemo" class="timeline-memo-preview">{{ item.memoPreview }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const MEMO_PREVIEW_LIMIT = 15

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['memoTap'])

const pad2 = (num) => String(num).padStart(2, '0')

const toDateLabel = (date) => `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`
const toTimeLabel = (date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
const normalizeMemo = (text) => String(text || '').replace(/\s+/g, ' ').trim()
const getMemoPreview = (text) => {
  const memo = normalizeMemo(text)
  if (!memo) return ''
  if (memo.length > MEMO_PREVIEW_LIMIT) {
    return `${memo.slice(0, MEMO_PREVIEW_LIMIT)}…`
  }
  return memo
}

const onItemTap = (item) => {
  if (!item?.hasMemo) return
  emit('memoTap', item.breweryId)
}

const groups = computed(() => {
  const sorted = [...props.records]
    .filter((record) => record?.visitedAt)
    .sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime())

  const byDate = new Map()

  sorted.forEach((record) => {
    const date = new Date(record.visitedAt)
    if (Number.isNaN(date.getTime())) return

    const dateKey = toDateLabel(date)
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, {
        dateKey,
        dateLabel: dateKey,
        items: []
      })
    }

    byDate.get(dateKey).items.push({
      breweryId: String(record.breweryId ?? ''),
      breweryName: record.breweryName || '不明な酒造',
      region: record.region || '地域不明',
      visitedAt: record.visitedAt,
      timeLabel: toTimeLabel(date),
      hasMemo: !!normalizeMemo(record.memo),
      memoPreview: getMemoPreview(record.memo)
    })
  })

  return Array.from(byDate.values())
})
</script>

<style scoped>
.timeline-root {
  min-height: 56px;
}

.timeline-empty {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #746b5b;
}

.timeline-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-group {
  position: relative;
}

.timeline-date {
  margin: 0 0 8px;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: #514738;
  font-weight: 700;
}

.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 14px;
  position: relative;
}

.timeline-list::before {
  content: "";
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: 1px;
  background: rgba(158, 132, 75, 0.36);
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  min-height: 24px;
  padding-left: 10px;
  font-size: 14px;
  line-height: 1.45;
  color: #2f2b23;
}

.timeline-item.is-clickable {
  cursor: pointer;
}

.timeline-item.is-clickable:active {
  opacity: 0.78;
}

.timeline-dot {
  position: absolute;
  left: -14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b89a56;
  box-shadow: 0 0 0 2px rgba(250, 246, 236, 0.95);
}

.timeline-body {
  min-width: 0;
  width: 100%;
}

.timeline-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}

.timeline-time {
  width: 38px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: #64553a;
}

.timeline-name {
  font-weight: 500;
}

.timeline-booth {
  display: inline-block;
  min-width: 42px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(184, 153, 71, 0.16);
  border: 1px solid rgba(154, 134, 82, 0.3);
  color: #5f4d2f;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.timeline-region {
  color: #76674b;
  font-size: 13px;
}

.timeline-memo-preview {
  margin: 0 0 0 8px;
  max-width: calc(100% - 8px);
  color: #666;
  font-size: 0.9em;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
