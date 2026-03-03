<template>
  <teleport to="body">
    <transition name="guide-fade">
      <div v-if="modelValue" class="guide-overlay" @click.self="close">
        <section class="guide-modal" role="dialog" aria-modal="true" aria-labelledby="pwa-guide-title">
          <button type="button" class="guide-close-btn" aria-label="閉じる" @click="close">×</button>
          <h2 id="pwa-guide-title">ホーム画面への追加方法</h2>
          <ol>
            <li v-for="(step, index) in steps" :key="index">{{ step }}</li>
          </ol>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  steps: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const close = () => {
  if (!props.modelValue) return
  emit('update:modelValue', false)
}
</script>

<style scoped>
.guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(32, 27, 18, 0.34);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  padding: 20px;
}

.guide-modal {
  width: min(420px, 100%);
  border-radius: 14px;
  border: 1px solid rgba(184, 153, 71, 0.28);
  background: linear-gradient(180deg, rgba(253, 251, 238, 0.98), rgba(246, 240, 227, 0.98));
  box-shadow: 0 18px 36px rgba(42, 42, 42, 0.18);
  padding: 18px 18px 16px;
  position: relative;
}

.guide-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(137, 115, 78, 0.26);
  background: linear-gradient(180deg, #fffdfa, #efe5d1);
  color: #7e6846;
  font-size: 14px;
  line-height: 1;
  display: grid;
  place-items: center;
}

h2 {
  margin: 0 24px 10px 0;
  font-size: 16px;
  color: #4f3a21;
  font-weight: 700;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  letter-spacing: 0.04em;
}

ol {
  margin: 0;
  padding-left: 20px;
  color: #5c4a2a;
}

li {
  font-size: 14px;
  line-height: 1.7;
}

.guide-fade-enter-active,
.guide-fade-leave-active {
  transition: opacity 0.2s ease;
}

.guide-fade-enter-from,
.guide-fade-leave-to {
  opacity: 0;
}
</style>
