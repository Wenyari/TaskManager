<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { NButton, NSpace, NSelect, NGrid, NGi, NEmpty, NSpin, NPageHeader } from 'naive-ui'
import { TASK_STATUS, TASK_PRIORITY, useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'
import type { TaskItem, CreateTaskPayload } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import TaskFormModal from '@/components/TaskFormModal.vue'

const userStore = useUserStore()
const taskStore = useTaskStore()

const showModal = ref(false)
const editingTask = ref<TaskItem | null>(null)

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
  <div style="max-width: 1200px; margin: 0 auto; padding: 24px">
    <NPageHeader :title="`欢迎, ${userStore.username}`">
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
          <NButton quaternary @click="userStore.logout()">退出</NButton>
        </NSpace>
      </template>
    </NPageHeader>

    <NSpin :show="taskStore.isLoading" style="margin-top: 24px">
      <NEmpty v-if="taskStore.tasks.length === 0 && !taskStore.isLoading" description="暂无任务，点击「新建任务」开始" />
      <NGrid v-else :x-gap="16" :y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGi v-for="task in taskStore.tasks" :key="task._id">
          <TaskCard :task="task" @edit="handleEdit" @delete="handleDelete" @status-change="handleStatusChange" />
        </NGi>
      </NGrid>
    </NSpin>

    <TaskFormModal v-model:show="showModal" :editing-task="editingTask" @submit="handleFormSubmit" />
  </div>
</template>
