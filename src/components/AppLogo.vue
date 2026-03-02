<template>
  <div class="app-logo" aria-label="酒の陣めぐり帖">
    <p class="logo-line">酒の陣</p>
    <p class="logo-line logo-line-bottom">めぐり帖</p>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #f7f1dc;
}

.logo-line {
  margin: 0;
  font-size: clamp(40px, 10.5vw, 62px);
  background: linear-gradient(180deg, #fffef8 0%, #f1e2be 52%, #cda35e 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.35),
    0 0 1px rgba(255, 255, 255, 0.4);
}

.logo-line-bottom {
  margin-top: 8px;
  letter-spacing: 0.22em;
}
</style>
