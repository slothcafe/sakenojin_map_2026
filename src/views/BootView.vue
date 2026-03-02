<template>
  <div class="boot-view" aria-hidden="true"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const VISITED_KEY = 'niigata_sakenojin_visited'
const router = useRouter()

onMounted(() => {
  const visited = localStorage.getItem(VISITED_KEY)
  if (!visited) {
    router.replace('/title')
  } else {
    router.replace('/loading')
  }
})
</script>

<style scoped>
.boot-view {
  display: none;
}
</style>
