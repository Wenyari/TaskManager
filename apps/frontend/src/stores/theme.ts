import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeMode } from '@/themes'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const mode = ref<ThemeMode>('light')

    function toggle() {
      mode.value = mode.value === 'light' ? 'dark' : 'light'
    }

    function set(next: ThemeMode) {
      mode.value = next
    }

    return { mode, toggle, set }
  },
  { persist: true }
)
