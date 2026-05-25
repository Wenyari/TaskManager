import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'
import {
  getTaskList,
  createTask as apiCreate,
  updateTask as apiUpdate,
  deleteTask as apiDelete,
  type TaskItem,
  type CreateTaskPayload,
  type UpdateTaskPayload
} from '@/api/task'

export { TASK_STATUS, TASK_PRIORITY }

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<TaskItem[]>([])
  const isLoading = ref(false)
  const filter = reactive<{ status?: TASK_STATUS; priority?: TASK_PRIORITY }>({})

  async function fetchList() {
    isLoading.value = true
    try {
      tasks.value = await getTaskList(filter)
    } finally {
      isLoading.value = false
    }
  }

  async function createTask(payload: CreateTaskPayload) {
    await apiCreate(payload)
    await fetchList()
  }

  async function updateTask(payload: UpdateTaskPayload) {
    await apiUpdate(payload)
    await fetchList()
  }

  async function deleteTask(taskId: string) {
    await apiDelete(taskId)
    await fetchList()
  }

  return { tasks, isLoading, filter, fetchList, createTask, updateTask, deleteTask }
})
