<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { NMessageProvider, NConfigProvider, darkTheme, lightTheme } from 'naive-ui'
import MessageProvider from '@/components/MessageProvider.vue'
import { useThemeStore } from '@/stores/theme'
import { lightThemeOverrides, darkThemeOverrides, getPalette } from '@/themes'

const themeStore = useThemeStore()

const naiveTheme = computed(() => (themeStore.mode === 'dark' ? darkTheme : lightTheme))
const themeOverrides = computed(() =>
  themeStore.mode === 'dark' ? darkThemeOverrides : lightThemeOverrides
)

watchEffect(() => {
  const palette = getPalette(themeStore.mode)
  const root = document.documentElement
  root.style.setProperty('--app-bg', palette.bg)
  root.style.setProperty('--app-bg-elevated', palette.bgElevated)
  root.style.setProperty('--app-text-base', palette.textBase)
  root.style.setProperty('--app-text-secondary', palette.textSecondary)
  root.style.setProperty('--app-text-tertiary', palette.textTertiary)
  root.style.setProperty('--app-border', palette.border)
  root.style.setProperty('--app-divider', palette.divider)
  root.style.setProperty('--app-primary', palette.primary)
  root.style.setProperty('--app-priority-high', palette.priorityHigh)
  root.style.setProperty('--app-priority-medium', palette.priorityMedium)
  root.style.setProperty('--app-priority-low', palette.priorityLow)
  root.style.setProperty('--app-shelf-stripe', palette.shelfStripe)
  root.dataset.theme = themeStore.mode
})
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <MessageProvider>
        <RouterView />
      </MessageProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

body {
  background-color: var(--app-bg);
  color: var(--app-text-base);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'Times New Roman', Georgia, serif;
  transition: background-color 0.4s ease, color 0.4s ease;
}

/* 书架横纹纹理：让整个 body 有"层叠书页"的暗示 */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: repeating-linear-gradient(
    180deg,
    transparent 0,
    transparent 38px,
    var(--app-shelf-stripe) 38px,
    var(--app-shelf-stripe) 39px
  );
  opacity: 0.55;
}

#app {
  position: relative;
  z-index: 1;
}
</style>

