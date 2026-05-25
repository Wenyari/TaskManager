<script setup lang="ts">
import { NCard, NSpace, NButton, NPopconfirm, NEllipsis } from 'naive-ui'
import StatusBadge from './StatusBadge.vue'
import { TASK_STATUS } from '@taskmanager/shared'
import type { TaskItem } from '@/api/task'

const props = defineProps<{ task: TaskItem }>()
const emit = defineEmits<{
  edit: [task: TaskItem]
  delete: [taskId: string]
  statusChange: [taskId: string, status: TASK_STATUS]
}>()

function nextStatus(current: TASK_STATUS): TASK_STATUS | null {
  switch (current) {
    case TASK_STATUS.TODO:
      return TASK_STATUS.IN_PROGRESS
    case TASK_STATUS.IN_PROGRESS:
      return TASK_STATUS.DONE
    default:
      return null
  }
}

function handleStatusClick() {
  const next = nextStatus(props.task.status)
  if (next) {
    emit('statusChange', props.task._id, next)
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<template>
  <NCard hoverable size="small" style="height: 100%">
    <template #header>
      <NEllipsis :line-clamp="1">{{ task.title }}</NEllipsis>
    </template>
    <template #header-extra>
      <StatusBadge :value="task.priority" type="priority" />
    </template>
    <p v-if="task.content" style="color: var(--vt-c-text-light-2); margin-bottom: 8px; font-size: 13px">
      <NEllipsis :line-clamp="2">{{ task.content }}</NEllipsis>
    </p>
    <NSpace align="center" size="small">
      <span style="cursor: pointer" @click="handleStatusClick">
        <StatusBadge :value="task.status" type="status" />
      </span>
      <span v-if="task.dueDate" style="font-size: 12px; color: #999">截止: {{ formatDate(task.dueDate) }}</span>
    </NSpace>
    <template #action>
      <NSpace justify="end" size="small">
        <NButton size="tiny" quaternary @click="emit('edit', task)">编辑</NButton>
        <NPopconfirm @positive-click="emit('delete', task._id)">
          <template #trigger>
            <NButton size="tiny" quaternary type="error">删除</NButton>
          </template>
          确定删除此任务？
        </NPopconfirm>
      </NSpace>
    </template>
  </NCard>
</template>
