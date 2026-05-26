<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NTabs, NTabPane, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

const activeTab = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const isSubmitting = ref(false)

const themeIcon = computed(() => (themeStore.mode === 'dark' ? '☼' : '☾'))

async function handleSubmit() {
  if (!username.value.trim() || !password.value) {
    window.$message?.warning('请输入用户名和密码')
    return
  }
  isSubmitting.value = true
  try {
    if (activeTab.value === 'login') {
      await userStore.login(username.value.trim(), password.value)
    } else {
      await userStore.register(username.value.trim(), password.value)
    }
    window.$message?.success(activeTab.value === 'login' ? '登录成功' : '注册成功')
    router.push({ name: 'task' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-shell">
    <button class="theme-toggle" :title="`切换主题`" @click="themeStore.toggle()">{{ themeIcon }}</button>
    <NCard class="login-card">
      <h1 class="brand">任务管理</h1>
      <p class="brand-sub">— Task Library —</p>
      <NTabs v-model:value="activeTab" type="segment" animated>
        <NTabPane name="login" tab="登录">
          <NForm @submit.prevent="handleSubmit">
            <NFormItem label="用户名">
              <NInput v-model:value="username" placeholder="输入用户名" />
            </NFormItem>
            <NFormItem label="密码">
              <NInput v-model:value="password" type="password" show-password-on="click" placeholder="输入密码" />
            </NFormItem>
            <NButton type="primary" block :loading="isSubmitting" attr-type="submit">登录</NButton>
          </NForm>
        </NTabPane>
        <NTabPane name="register" tab="注册">
          <NForm @submit.prevent="handleSubmit">
            <NFormItem label="用户名">
              <NInput v-model:value="username" placeholder="3-32 位字符" />
            </NFormItem>
            <NFormItem label="密码">
              <NInput v-model:value="password" type="password" show-password-on="click" placeholder="至少 6 位" />
            </NFormItem>
            <NButton type="primary" block :loading="isSubmitting" attr-type="submit">注册</NButton>
          </NForm>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<style scoped>
.login-shell {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
}

.login-card {
  width: 380px;
  border: 1px solid var(--app-border);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
}

.brand {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, serif;
  font-size: 28px;
  letter-spacing: 0.4em;
  text-align: center;
  margin: 0 0 4px;
  color: var(--app-primary);
}

.brand-sub {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.5em;
  color: var(--app-text-tertiary);
  margin: 0 0 18px;
}

.theme-toggle {
  position: absolute;
  top: 24px;
  right: 32px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--app-border);
  background: var(--app-bg-elevated);
  color: var(--app-primary);
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.3s ease;
}

.theme-toggle:hover {
  transform: rotate(20deg);
}
</style>
