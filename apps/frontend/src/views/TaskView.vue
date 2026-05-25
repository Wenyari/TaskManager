<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { NButton, NSpace, NSelect, NGrid, NGi, NEmpty, NSpin, NPageHeader } from 'naive-ui'
import { TASK_STATUS, TASK_PRIORITY, useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import type { TaskItem, CreateTaskPayload } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import TaskFormModal from '@/components/TaskFormModal.vue'

const userStore = useUserStore()
const taskStore = useTaskStore()
const themeStore = useThemeStore()

const showModal = ref(false)
const editingTask = ref<TaskItem | null>(null)

const themeIcon = computed(() => (themeStore.mode === 'dark' ? '☼' : '☾'))
const themeLabel = computed(() => (themeStore.mode === 'dark' ? '浅色' : '深色'))

const statusOptions = [
  { label: '全部状态', value: null as unknown as string },
  { label: '待办', value: TASK_STATUS.TODO },
  { label: '进行中', value: TASK_STATUS.IN_PROGRESS },
  { label: '已完成', value: TASK_STATUS.DONE }
]

const priorityOptions = [
  { label: '全部优先级', value: null as unknown as string },
  { label: '高', value: TASK_PRIORITY.HIGH },
  { label: '中', value: TASK_PRIORITY.MEDIUM },
  { label: '低', value: TASK_PRIORITY.LOW }
]

function handleCreate() {
  editingTask.value = null
  showModal.value = true
}

function handleEdit(task: TaskItem) {
  editingTask.value = task
  showModal.value = true
}

async function handleDelete(taskId: string) {
  await taskStore.deleteTask(taskId)
  window.$message?.success('已删除')
}

async function handleStatusChange(taskId: string, status: TASK_STATUS) {
  await taskStore.updateTask({ taskId, status })
}

async function handleFormSubmit(payload: CreateTaskPayload & { taskId?: string }) {
  if (payload.taskId) {
    await taskStore.updateTask(payload as CreateTaskPayload & { taskId: string })
    window.$message?.success('已更新')
  } else {
    await taskStore.createTask(payload)
    window.$message?.success('已创建')
  }
}

watch(
  () => [taskStore.filter.status, taskStore.filter.priority],
  () => taskStore.fetchList(),
  { deep: true }
)

onMounted(() => {
  taskStore.fetchList()
})
</script>

<template>
  <div class="library-shell">
    <NPageHeader :title="`${userStore.username}`" subtitle="">
      <template #extra>
        <NSpace>
          <NSelect
            v-model:value="taskStore.filter.status"
            :options="statusOptions"
            placeholder="状态筛选"
            clearable
            style="width: 130px"
          />
          <NSelect
            v-model:value="taskStore.filter.priority"
            :options="priorityOptions"
            placeholder="优先级筛选"
            clearable
            style="width: 130px"
          />
          <NButton type="primary" @click="handleCreate">新建任务</NButton>
          <NButton quaternary :title="`切换到${themeLabel}模式`" @click="themeStore.toggle()">
            {{ themeIcon }} {{ themeLabel }}
          </NButton>
          <NButton quaternary @click="userStore.logout()">退出</NButton>
        </NSpace>
      </template>
    </NPageHeader>

    <NSpin :show="taskStore.isLoading" style="margin-top: 24px">
      <NEmpty
        v-if="taskStore.tasks.length === 0 && !taskStore.isLoading"
        description="点击「新建任务」添置"
      />
      <NGrid v-else :x-gap="16" :y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGi v-for="task in taskStore.tasks" :key="task._id">
          <TaskCard :task="task" @edit="handleEdit" @delete="handleDelete" @status-change="handleStatusChange" />
        </NGi>
      </NGrid>
    </NSpin>

    <TaskFormModal v-model:show="showModal" :editing-task="editingTask" @submit="handleFormSubmit" />
  </div>
</template>

<style scoped>
.library-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.library-shell :deep(.n-page-header__title) {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, serif;
  letter-spacing: 0.06em;
}

.library-shell :deep(.n-page-header__subtitle) {
  color: var(--app-text-tertiary);
  letter-spacing: 0.4em;
  font-size: 12px;
}
</style>
