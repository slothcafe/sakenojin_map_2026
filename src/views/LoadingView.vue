<template>
  <div class="loading-view" :style="viewStyle">
    <div class="overlay"></div>

    <main class="logo-anchor">
      <AppLogo />
      <span class="gold-line" aria-hidden="true"></span>
    </main>

    <p class="loading-message">{{ loadingMessage }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLogo from '../components/AppLogo.vue'
import {
  loadBreweryData,
  loadHistoryData,
  primeBootstrapData
} from '../services/bootstrapData.js'

const MIN_LOADING_MS = 600
const router = useRouter()

const MESSAGES = [
  '酒蔵データを準備しています…',
  '味わいマップを描いています…',
  '今日の一杯を探しています…'
]

const loadingBgUrl = new URL('../../loading.png', import.meta.url).href
const loadingMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

const viewStyle = computed(() => ({
  backgroundImage: `url(${loadingBgUrl})`
}))

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms)
})

onMounted(async () => {
  try {
    const [loadedData] = await Promise.all([
      Promise.all([loadBreweryData(), loadHistoryData()]).then(
        ([breweryData, historyData]) => ({
          ...breweryData,
          historyData
        })
      ),
      wait(MIN_LOADING_MS)
    ])

    primeBootstrapData(loadedData)
    router.replace('/map')
  } catch (error) {
    console.error('Loading bootstrap data failed:', error)
    router.replace('/map')
  }
})
</script>

<style scoped>
.loading-view {
  --logo-anchor-top: clamp(25vh, 30vh, 35vh);
  position: relative;
  min-height: 100dvh;
  padding: 24px 24px calc(28px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  color: #f8f0d8;
  text-align: center;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 12, 18, 0.42) 0%, rgba(10, 12, 18, 0.56) 100%);
  z-index: -1;
}

.logo-anchor {
  margin-top: var(--logo-anchor-top);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.gold-line {
  width: min(240px, 68vw);
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(232, 211, 153, 0) 0%,
    rgba(232, 211, 153, 0.95) 50%,
    rgba(232, 211, 153, 0) 100%
  );
  animation: linePulse 2.4s ease-in-out infinite;
}

.loading-message {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(248, 240, 216, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

@keyframes linePulse {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gold-line {
    animation: none;
    opacity: 0.8;
  }
}

@media (max-width: 480px) {
  .loading-view {
    padding: 24px 18px calc(24px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
