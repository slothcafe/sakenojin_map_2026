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
  border: 1px solid rgba(184, 153, 71, 0.3);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(253, 251, 238, 0.98) 0%, rgba(246, 240, 227, 0.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 4px 10px rgba(42, 42, 42, 0.05);
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
  color: var(--ink-muted);
  font-weight: 600;
}

.brewery-name {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 600;
  letter-spacing: 0.05em;
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
  padding: 3px 10px;
  white-space: nowrap;
}

.region-chip {
  border: 1px solid rgba(184, 153, 71, 0.4);
  color: var(--ink);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(184, 153, 71, 0.2);
}

.visit-chip {
  border: 1px solid rgba(130, 108, 70, 0.25);
  color: #6d6252;
  background: #f5f0e5;
}

.visit-chip.is-visited {
  color: var(--ink);
  border-color: rgba(184, 153, 71, 0.6);
  background: linear-gradient(180deg, #E8D399, #B89947);
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
  font-size: 20px;
  color: var(--ink);
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.empty-desc {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.6;
}
</style>
