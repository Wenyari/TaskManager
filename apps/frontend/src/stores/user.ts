import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin, register as apiRegister } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const userId = ref('')
    const username = ref('')

    async function login(name: string, password: string) {
      const res = await apiLogin(name, password)
      token.value = res.token
      userId.value = res.userId
      username.value = res.username
    }

    async function register(name: string, password: string) {
      const res = await apiRegister(name, password)
      token.value = res.token
      userId.value = res.userId
      username.value = res.username
    }

    function logout() {
      token.value = ''
      userId.value = ''
      username.value = ''
      router.push({ name: 'login' })
    }

    return { token, userId, username, login, register, logout }
  },
  { persist: true }
)
