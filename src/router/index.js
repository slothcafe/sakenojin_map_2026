import { createRouter, createWebHistory } from 'vue-router'

import LoadingView from '../views/LoadingView.vue'
import MapView from '../views/MapView.vue'
import TitleView from '../views/TitleView.vue'

const VISITED_KEY = 'niigata_sakenojin_visited'

const routes = [
  {
    path: '/',
    component: TitleView,
    beforeEnter: () => {
      if (typeof window === 'undefined') return true
      return localStorage.getItem(VISITED_KEY) ? '/loading' : true
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
