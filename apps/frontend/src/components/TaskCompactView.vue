<script setup lang="ts">
import { computed } from 'vue'
import { NEmpty, NEllipsis, NPopconfirm, NButton, NSpace } from 'naive-ui'
import { TASK_PRIORITY } from '@taskmanager/shared'
import type { TaskItem } from '@/api/task'

const props = defineProps<{ tasks: TaskItem[] }>()
const emit = defineEmits<{
  edit: [task: TaskItem]
  delete: [taskId: string]
}>()

function spineColor(priority: string): string {
  switch (priority) {
    case TASK_PRIORITY.HIGH:
      return 'var(--app-priority-high)'
    case TASK_PRIORITY.MEDIUM:
      return 'var(--app-priority-medium)'
    case TASK_PRIORITY.LOW:
      return 'var(--app-priority-low)'
    default:
      return 'var(--app-border)'
  }
}

const isEmpty = computed(() => props.tasks.length === 0)
</script>

<template>
  <NEmpty v-if="isEmpty" description="暂无任务" />
  <ul v-else class="compact-list">
    <li
      v-for="task in tasks"
      :key="task._id"
      class="compact-item"
      :style="{ '--spine-color': spineColor(task.priority) }"
      @click="emit('edit', task)"
    >
      <NEllipsis :line-clamp="1" class="compact-title">{{ task.title }}</NEllipsis>
      <NSpace size="small" align="center" @click.stop>
        <NPopconfirm @positive-click="emit('delete', task._id)">
          <template #trigger>
            <NButton size="tiny" quaternary type="error">删</NButton>
          </template>
          确定删除此任务？
        </NPopconfirm>
      </NSpace>
    </li>
  </ul>
</template>

<style scoped>
.compact-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}

.compact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-left: 3px solid var(--spine-color);
  background: var(--app-bg-elevated);
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.compact-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.compact-title {
  flex: 1;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, serif;
  font-size: 14px;
  letter-spacing: 0.03em;
}
</style>
