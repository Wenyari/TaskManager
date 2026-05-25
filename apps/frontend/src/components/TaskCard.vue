<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NSpace, NButton, NPopconfirm, NEllipsis } from 'naive-ui'
import StatusBadge from './StatusBadge.vue'
import { TASK_STATUS, TASK_PRIORITY } from '@taskmanager/shared'
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

const spineColor = computed(() => {
  switch (props.task.priority) {
    case TASK_PRIORITY.HIGH:
      return 'var(--app-priority-high)'
    case TASK_PRIORITY.MEDIUM:
      return 'var(--app-priority-medium)'
    case TASK_PRIORITY.LOW:
      return 'var(--app-priority-low)'
    default:
      return 'var(--app-border)'
  }
})
</script>

<template>
  <NCard hoverable size="small" class="book-card" :style="{ '--spine-color': spineColor }">
    <template #header>
      <NEllipsis :line-clamp="1" class="book-title">{{ task.title }}</NEllipsis>
    </template>
    <template #header-extra>
      <StatusBadge :value="task.priority" type="priority" />
    </template>
    <p v-if="task.content" class="book-content">
      <NEllipsis :line-clamp="2">{{ task.content }}</NEllipsis>
    </p>
    <NSpace align="center" size="small">
      <span style="cursor: pointer" @click="handleStatusClick">
        <StatusBadge :value="task.status" type="status" />
      </span>
      <span v-if="task.dueDate" class="book-due">截止 · {{ formatDate(task.dueDate) }}</span>
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

<style scoped>
.book-card {
  height: 100%;
  position: relative;
  overflow: hidden;
  border-left: 4px solid var(--spine-color);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.book-card::after {
  content: '';
  position: absolute;
  inset: 0 0 0 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, transparent 8px);
}

.book-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
}

.book-title {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, serif;
  letter-spacing: 0.04em;
}

.book-content {
  color: var(--app-text-secondary);
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.65;
}

.book-due {
  font-size: 12px;
  color: var(--app-text-tertiary);
  letter-spacing: 0.08em;
}
</style>
