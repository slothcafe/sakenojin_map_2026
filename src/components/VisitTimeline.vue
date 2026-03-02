<template>
  <div class="timeline-root">
    <p v-if="groups.length === 0" class="timeline-empty">
      まだ訪問記録がありません。酒造を訪問済みにするとここに時系列で表示されます。
    </p>

    <div v-else class="timeline-groups">
      <section v-for="group in groups" :key="group.dateKey" class="timeline-group">
        <h3 class="timeline-date">{{ group.dateLabel }}</h3>
        <ul class="timeline-list">
          <li v-for="item in group.items" :key="item.breweryId + item.visitedAt" class="timeline-item">
            <span class="timeline-dot" aria-hidden="true"></span>
            <span class="timeline-time">{{ item.timeLabel }}</span>
            <span class="timeline-booth">No.{{ item.breweryId }}</span>
            <span class="timeline-name">{{ item.breweryName }}</span>
            <span class="timeline-region">（{{ item.region }}）</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

const pad2 = (num) => String(num).padStart(2, '0')

const toDateLabel = (date) => `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`
const toTimeLabel = (date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`

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
      timeLabel: toTimeLabel(date)
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
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding-left: 10px;
  font-size: 14px;
  line-height: 1.45;
  color: #2f2b23;
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

.timeline-time {
  width: 38px;
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
</style>
