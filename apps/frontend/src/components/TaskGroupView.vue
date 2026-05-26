<script setup lang="ts">
import { computed } from 'vue'
import { NEmpty, NGrid, NGi } from 'naive-ui'
import { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'
import type { TaskItem } from '@/api/task'
import TaskCard from './TaskCard.vue'

type GroupKey = 'priority' | 'status'

const props = defineProps<{
  tasks: TaskItem[]
  groupBy: GroupKey
}>()

const emit = defineEmits<{
  edit: [task: TaskItem]
  delete: [taskId: string]
  statusChange: [taskId: string, status: TASK_STATUS]
}>()

const PRIORITY_ORDER: { value: TASK_PRIORITY; label: string; accent: string }[] = [
  { value: TASK_PRIORITY.HIGH, label: '高优先', accent: 'var(--app-priority-high)' },
  { value: TASK_PRIORITY.MEDIUM, label: '中优先', accent: 'var(--app-priority-medium)' },
  { value: TASK_PRIORITY.LOW, label: '低优先', accent: 'var(--app-priority-low)' }
]

const STATUS_ORDER: { value: TASK_STATUS; label: string; accent: string }[] = [
  { value: TASK_STATUS.TODO, label: '待办', accent: 'var(--app-text-tertiary)' },
  { value: TASK_STATUS.IN_PROGRESS, label: '进行中', accent: 'var(--app-priority-medium)' },
  { value: TASK_STATUS.DONE, label: '已完成', accent: 'var(--app-priority-low)' }
]

const groups = computed(() => {
  const order = props.groupBy === 'priority' ? PRIORITY_ORDER : STATUS_ORDER
  return order.map(g => ({
    ...g,
    tasks: props.tasks.filter(t => (props.groupBy === 'priority' ? t.priority : t.status) === g.value)
  }))
})

const isEmpty = computed(() => props.tasks.length === 0)
</script>

<template>
  <NEmpty v-if="isEmpty" description="暂无任务" />
  <div v-else class="group-stack">
    <section
      v-for="group in groups"
      :key="group.value"
      class="group-block"
      :style="{ '--group-accent': group.accent }"
    >
      <header class="group-header">
        <span class="group-title">{{ group.label }}</span>
        <span class="group-count">{{ group.tasks.length }}</span>
      </header>
      <div v-if="group.tasks.length === 0" class="group-empty">— 暂无 —</div>
      <NGrid v-else :x-gap="12" :y-gap="12" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGi v-for="task in group.tasks" :key="task._id">
          <TaskCard
            :task="task"
            @edit="emit('edit', task)"
            @delete="emit('delete', task._id)"
            @status-change="(id, status) => emit('statusChange', id, status)"
          />
        </NGi>
      </NGrid>
    </section>
  </div>
</template>

<style scoped>
.group-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-block {
  border-left: 3px solid var(--group-accent);
  padding-left: 16px;
}

.group-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.group-title {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, serif;
  font-size: 16px;
  letter-spacing: 0.1em;
  color: var(--app-text-base);
}

.group-count {
  font-size: 12px;
  color: var(--app-text-tertiary);
  letter-spacing: 0.05em;
}

.group-empty {
  font-size: 12px;
  color: var(--app-text-tertiary);
  padding: 8px 0;
  letter-spacing: 0.1em;
}
</style>
