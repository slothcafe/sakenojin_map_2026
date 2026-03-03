import { createRouter, createWebHistory } from 'vue-router'
import { getStorageItem } from '../services/persistentStorage.js'

import LoadingView from '../views/LoadingView.vue'
import MapView from '../views/MapView.vue'
import TitleView from '../views/TitleView.vue'

const VISITED_KEY = 'niigata_sakenojin_visited'

const routes = [
  {
    path: '/',
    component: TitleView,
    beforeEnter: async () => {
      if (typeof window === 'undefined') return true
      const visited = await getStorageItem(VISITED_KEY)
      return visited ? '/loading' : true
    }
  },
  {
    path: '/title',
    component: TitleView
  },
  {
    path: '/loading',
    component: LoadingView
  },
  {
    path: '/map',
    component: MapView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
