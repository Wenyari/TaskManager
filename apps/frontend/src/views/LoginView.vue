<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NTabs, NTabPane, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const activeTab = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const isSubmitting = ref(false)

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
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh">
    <NCard style="width: 380px">
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
