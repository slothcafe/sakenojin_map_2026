<template>
  <article class="pwa-install-card" role="region" aria-label="ホーム画面追加案内">
    <button
      type="button"
      class="pwa-close-btn"
      aria-label="ホーム画面追加案内を閉じる"
      @click="$emit('dismiss')"
    >
      ×
    </button>

    <h3 v-if="topText" class="pwa-title">{{ topText }}</h3>
    <p class="pwa-text">{{ bottomText }}</p>

    <button type="button" class="pwa-guide-btn" @click="$emit('showGuide')">
      {{ actionLabel }}
    </button>
  </article>
</template>

<script setup>
defineProps({
  topText: {
    type: String,
    default: ''
  },
  bottomText: {
    type: String,
    default: ''
  },
  actionLabel: {
    type: String,
    default: '追加方法を見る'
  }
})

defineEmits(['dismiss', 'showGuide'])
</script>

<style scoped>
.pwa-install-card {
  margin: 8px 12px 8px;
  padding: 10px 16px 8px;
  background: linear-gradient(135deg, rgba(254, 252, 245, 0.96), rgba(248, 243, 229, 0.93));
  border: 1px solid rgba(184, 153, 71, 0.24);
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(140, 110, 50, 0.07);
  position: relative;
  overflow: hidden;
}

.pwa-install-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(184, 153, 71, 0.3), transparent);
}

.pwa-close-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(137, 115, 78, 0.25);
  background: linear-gradient(180deg, #fffdfa, #efe5d1);
  color: #7e6846;
  font-size: 13px;
  line-height: 1;
  display: grid;
  place-items: center;
}

.pwa-text {
  margin: 0;
  color: #5c4a2a;
  font-size: 13px;
  line-height: 1.55;
  text-align: center;
  font-family: "Noto Sans JP", sans-serif;
}

.pwa-title {
  margin: 0 0 4px;
  color: #4f3a21;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
}

.pwa-guide-btn {
  margin: 8px auto 0;
  display: block;
  border: 0;
  background: transparent;
  color: #8a744b;
  font-size: 12px;
  letter-spacing: 0.08em;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  padding: 0;
}
</style>
