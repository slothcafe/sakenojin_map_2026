<template>
  <div class="accordion-root">
    <article
      v-for="section in sections"
      :key="section.region"
      class="accordion-item"
      :class="{
        'is-open': activeRegion === section.region,
        'is-highlighted': highlightedRegion === section.region
      }"
    >
      <button type="button" class="accordion-header" @click="$emit('toggle', section.region)">
        <span class="accordion-arrow" aria-hidden="true">{{ activeRegion === section.region ? '▾' : '▸' }}</span>
        <span class="accordion-region">{{ section.region }}</span>
        <span class="accordion-count">{{ section.visited }} / {{ section.total }}（{{ section.percentage }}%）</span>
      </button>

      <transition name="accordion-panel">
        <div v-if="activeRegion === section.region" class="accordion-panel">
          <p v-if="section.breweries.length === 0" class="accordion-empty">
            この地域の酒造データはありません。
          </p>

          <ul v-else class="brewery-list">
            <li
              v-for="brewery in section.breweries"
              :key="section.region + '-' + brewery.id"
              class="brewery-item"
              :class="{ 'is-unvisited': !brewery.visited }"
            >
              <span class="brewery-mark" aria-hidden="true">{{ brewery.visited ? '✓' : '○' }}</span>
              <span class="brewery-name">{{ brewery.name }}</span>
              <span class="brewery-status">{{ brewery.visited ? '訪問済' : '未訪問' }}</span>
            </li>
          </ul>
        </div>
      </transition>
    </article>
  </div>
</template>

<script setup>
defineProps({
  sections: {
    type: Array,
    default: () => []
  },
  activeRegion: {
    type: String,
    default: null
  },
  highlightedRegion: {
    type: String,
    default: null
  }
})

defineEmits(['toggle'])
</script>

<style scoped>
.accordion-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accordion-item {
  border: 1px solid rgba(184, 153, 71, 0.24);
  border-radius: 12px;
  background: rgba(255, 250, 240, 0.62);
  overflow: hidden;
}

.accordion-item.is-highlighted {
  animation: regionHighlight 0.3s ease;
}

.accordion-header {
  width: 100%;
  border: 0;
  margin: 0;
  padding: 12px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: #2d2a24;
}

.accordion-arrow {
  width: 14px;
  text-align: center;
  color: #7a6743;
  flex-shrink: 0;
}

.accordion-region {
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 700;
  font-size: 15px;
}

.accordion-count {
  margin-left: auto;
  font-size: 13px;
  color: #5a4f3d;
}

.accordion-panel {
  padding: 0 12px 10px;
  border-top: 1px solid rgba(184, 153, 71, 0.2);
}

.accordion-empty {
  margin: 8px 0 4px;
  font-size: 13px;
  color: #7f7360;
}

.brewery-list {
  list-style: none;
  margin: 0;
  padding: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.brewery-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2f2a23;
  min-height: 24px;
}

.brewery-item.is-unvisited {
  color: #918575;
}

.brewery-mark {
  width: 16px;
  text-align: center;
  color: #987d44;
  font-weight: 700;
}

.brewery-item.is-unvisited .brewery-mark {
  color: #b2a48f;
}

.brewery-status {
  margin-left: auto;
  font-size: 12px;
}

.accordion-panel-enter-active,
.accordion-panel-leave-active {
  transition: opacity 0.28s ease;
}

.accordion-panel-enter-from,
.accordion-panel-leave-to {
  opacity: 0;
}

@keyframes regionHighlight {
  0% {
    background-color: rgba(224, 202, 140, 0.28);
  }
  100% {
    background-color: rgba(255, 250, 240, 0.62);
  }
}
</style>
