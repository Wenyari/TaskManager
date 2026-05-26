<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NButton, NSpace, NGrid, NGi, NEmpty, NSpin, NPageHeader, NIcon, NTooltip } from 'naive-ui'
import {
  GridOutline,
  ReorderFourOutline,
  FlameOutline,
  LayersOutline,
  BarChartOutline
} from '@vicons/ionicons5'
import { useTaskStore, type ViewMode, TASK_STATUS } from '@/stores/task'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import type { TaskItem, CreateTaskPayload } from '@/api/task'
import TaskCard from '@/components/TaskCard.vue'
import TaskCompactView from '@/components/TaskCompactView.vue'
import TaskGroupView from '@/components/TaskGroupView.vue'
import TaskGanttView from '@/components/TaskGanttView.vue'
import TaskFormModal from '@/components/TaskFormModal.vue'

const userStore = useUserStore()
const taskStore = useTaskStore()
const themeStore = useThemeStore()

const showModal = ref(false)
const editingTask = ref<TaskItem | null>(null)

const themeIcon = computed(() => (themeStore.mode === 'dark' ? '☼' : '☾'))
const themeLabel = computed(() => (themeStore.mode === 'dark' ? '浅色' : '深色'))

const viewButtons: { mode: ViewMode; label: string; icon: ReturnType<typeof h> }[] = [
  { mode: 'grid', label: '网格视图', icon: h(GridOutline) },
  { mode: 'compact', label: '紧凑视图', icon: h(ReorderFourOutline) },
  { mode: 'priority-group', label: '按优先级分组', icon: h(FlameOutline) },
  { mode: 'status-group', label: '按状态分组', icon: h(LayersOutline) },
  { mode: 'gantt', label: '甘特图', icon: h(BarChartOutline) }
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

onMounted(() => {
  taskStore.fetchList()
})
</script>

<template>
  <div class="library-shell">
    <NPageHeader :title="`${userStore.username}`" subtitle="">
      <template #extra>
        <NSpace>
          <div class="view-bar">
            <NTooltip v-for="btn in viewButtons" :key="btn.mode" placement="bottom">
              <template #trigger>
                <NButton
                  size="small"
                  :type="taskStore.viewMode === btn.mode ? 'primary' : 'default'"
                  :quaternary="taskStore.viewMode !== btn.mode"
                  @click="taskStore.setViewMode(btn.mode)"
                >
                  <template #icon>
                    <NIcon>
                      <component :is="btn.icon" />
                    </NIcon>
                  </template>
                </NButton>
              </template>
              {{ btn.label }}
            </NTooltip>
          </div>
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
      <template v-else>
        <NGrid
          v-if="taskStore.viewMode === 'grid'"
          :x-gap="16"
          :y-gap="16"
          cols="1 s:2 m:3 l:4"
          responsive="screen"
        >
          <NGi v-for="task in taskStore.tasks" :key="task._id">
            <TaskCard
              :task="task"
              @edit="handleEdit"
              @delete="handleDelete"
              @status-change="handleStatusChange"
            />
          </NGi>
        </NGrid>

        <TaskCompactView
          v-else-if="taskStore.viewMode === 'compact'"
          :tasks="taskStore.tasks"
          @edit="handleEdit"
          @delete="handleDelete"
        />

        <TaskGroupView
          v-else-if="taskStore.viewMode === 'priority-group'"
          :tasks="taskStore.tasks"
          group-by="priority"
          @edit="handleEdit"
          @delete="handleDelete"
          @status-change="handleStatusChange"
        />

        <TaskGroupView
          v-else-if="taskStore.viewMode === 'status-group'"
          :tasks="taskStore.tasks"
          group-by="status"
          @edit="handleEdit"
          @delete="handleDelete"
          @status-change="handleStatusChange"
        />

        <TaskGanttView
          v-else-if="taskStore.viewMode === 'gantt'"
          :tasks="taskStore.tasks"
          @edit="handleEdit"
        />
      </template>
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

.view-bar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg);
}
</style>
