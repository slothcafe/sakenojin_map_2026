<template>
  <section class="favorites-view">
    <div v-if="favorites.length === 0" class="empty-state">
      <p class="empty-title">★ お気に入りはまだありません</p>
      <p class="empty-desc">
        気になる酒蔵を★で保存すると<br>
        ここに表示されます
      </p>
    </div>

    <ul v-else class="favorite-list">
      <li v-for="booth in favorites" :key="booth.id" class="favorite-item">
        <button type="button" class="favorite-row" @click="$emit('selectBooth', booth)">
          <div class="favorite-main">
            <p class="booth-line">No.{{ booth.id }}</p>
            <h3 class="brewery-name">{{ booth.name }}</h3>
          </div>

          <div class="favorite-meta">
            <span
              class="region-chip"
              :style="{
                backgroundColor: resolveRegionStyle(booth.region).color,
                borderColor: resolveRegionStyle(booth.region).stroke
              }"
            >
              {{ resolveRegionStyle(booth.region).name }}
            </span>
            <span class="visit-chip" :class="{ 'is-visited': booth.visited }">
              {{ booth.visited ? '訪問済み' : '未訪問' }}
            </span>
          </div>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
const props = defineProps({
  favorites: {
    type: Array,
    required: true
  },
  regionStyles: {
    type: Object,
    required: true
  }
})

defineEmits(['selectBooth'])

const fallbackRegion = { color: '#e5e7eb', stroke: '#d1d5db', name: '未分類' }

const resolveRegionStyle = (regionId) => {
  if (!regionId) return fallbackRegion
  return props.regionStyles?.[regionId] || fallbackRegion
}
</script>

<style scoped>
.favorites-view {
  height: 100%;
  padding: 0 0 var(--space-16);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.favorite-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.favorite-item {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: var(--paper-elevated);
}

.favorite-row {
  width: 100%;
  border: 0;
  margin: 0;
  padding: 12px;
  border-radius: 14px;
  background: transparent;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.favorite-main {
  min-width: 0;
}

.booth-line {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--ink-subtle);
  font-weight: 600;
}

.brewery-name {
  margin: 0;
  font-size: 15px;
  color: var(--ink);
  line-height: 1.35;
}

.favorite-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.region-chip,
.visit-chip {
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 3px 9px;
  white-space: nowrap;
}

.region-chip {
  border: 1px solid transparent;
  color: #293241;
}

.visit-chip {
  border: 1px solid rgba(30, 42, 56, 0.2);
  color: #5f6b77;
  background: #f6f4f0;
}

.visit-chip.is-visited {
  color: #ffffff;
  border-color: #1e2a38;
  background: #1e2a38;
}

.empty-state {
  height: 100%;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--ink-subtle);
  padding: var(--space-24) var(--space-16);
}

.empty-title {
  margin: 0;
  font-size: 18px;
  color: var(--ink);
  font-weight: 700;
}

.empty-desc {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.6;
}
</style>
