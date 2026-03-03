<template>
  <div class="title-view" :style="viewStyle">
    <div class="overlay"></div>

    <main class="logo-anchor">
      <div class="logo-fade-in">
        <AppLogo />
      </div>
      <p class="sub-title">にいがた酒の陣2026 非公式ガイド</p>
    </main>

    <button class="start-btn" type="button" @click="handleStart">
      はじめる
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLogo from '../components/AppLogo.vue'
import { setStorageItem } from '../services/persistentStorage.js'

const VISITED_KEY = 'niigata_sakenojin_visited'
const router = useRouter()
const isRouting = ref(false)

const titleBgUrl = new URL('../../title.webp', import.meta.url).href

const viewStyle = computed(() => ({
  backgroundImage: `url(${titleBgUrl})`
}))

const handleStart = async () => {
  if (isRouting.value) return

  isRouting.value = true
  await setStorageItem(VISITED_KEY, 'true')
  router.replace('/map')
}
</script>

<style scoped>
.title-view {
  --logo-anchor-top: clamp(25vh, 30vh, 35vh);
  position: relative;
  min-height: 100dvh;
  padding: 24px 24px calc(42px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  color: #f7f1dc;
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
  background: linear-gradient(180deg, rgba(10, 12, 18, 0.35) 0%, rgba(10, 12, 18, 0.52) 100%);
  z-index: -1;
}

.logo-anchor {
  margin-top: var(--logo-anchor-top);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logo-fade-in {
  opacity: 0;
  animation: titleLogoFadeIn 1.2s ease forwards;
}

.sub-title {
  margin: 0;
  font-size: clamp(13px, 3.8vw, 17px);
  letter-spacing: 0.1em;
  color: rgba(247, 241, 220, 0.9);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  opacity: 0;
  animation: titleLogoFadeIn 1.2s ease 0.2s forwards;
}

.start-btn {
  min-width: 220px;
  padding: 13px 30px;
  border: 1px solid rgba(235, 213, 160, 0.9);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(38, 33, 25, 0.82) 0%, rgba(23, 20, 15, 0.88) 100%);
  color: #f6e8c3;
  font-size: 16px;
  letter-spacing: 0.14em;
  font-family: "Noto Serif JP", serif;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.start-btn:active {
  transform: translateY(1px) scale(0.99);
}

.start-btn:focus-visible {
  outline: 2px solid rgba(248, 227, 175, 0.9);
  outline-offset: 3px;
}

@keyframes titleLogoFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .title-view {
    padding: 24px 18px calc(30px + env(safe-area-inset-bottom, 0px));
  }

  .start-btn {
    width: min(260px, 86vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-fade-in,
  .sub-title {
    animation: none;
    opacity: 1;
  }

  .start-btn {
    transition: none;
  }
}
</style>
