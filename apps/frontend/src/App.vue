<script setup lang="ts">
import { NMessageProvider, NConfigProvider } from 'naive-ui'
import MessageProvider from '@/components/MessageProvider.vue'
</script>

<template>
  <NConfigProvider>
    <NMessageProvider>
      <MessageProvider>
        <RouterView />
      </MessageProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
