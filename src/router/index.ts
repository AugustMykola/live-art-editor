import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useEditorStore } from '../stores/editor'
import HomeView from '../views/HomeView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/editor',
    name: 'editor',
    component: () => import('../views/EditorView.vue'),
    beforeEnter: () => {
      const editor = useEditorStore()
      return editor.hasImage ? true : { name: 'home' }
    },
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
