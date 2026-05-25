import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { isPublic: true }
    },
    {
      path: '/',
      name: 'task',
      component: () => import('@/views/TaskView.vue')
    }
  ]
})

router.beforeEach(to => {
  const userStore = useUserStore()
  if (!to.meta.isPublic && !userStore.token) {
    return { name: 'login' }
  }
})

export default router
