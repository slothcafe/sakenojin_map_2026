<template>
  <div class="route-stage">
    <RouterView v-slot="{ Component, route }">
      <Transition name="route-crossfade">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
.route-stage {
  position: relative;
  min-height: 100dvh;
  isolation: isolate;
  overflow: hidden;
  background: #fdfbee;
}

.route-crossfade-enter-active,
.route-crossfade-leave-active {
  position: absolute;
  inset: 0;
  width: 100%;
  transition: opacity 0.45s ease;
}

.route-crossfade-enter-active {
  z-index: 1;
}

.route-crossfade-leave-active {
  z-index: 2;
}

.route-crossfade-enter-from,
.route-crossfade-enter-to,
.route-crossfade-leave-from {
  opacity: 1;
}

.route-crossfade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .route-crossfade-enter-active,
  .route-crossfade-leave-active {
    transition: none;
  }
}
</style>
