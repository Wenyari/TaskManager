import { post } from './request'
import type { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'

export interface TaskItem {
  _id: string
  userId: string
  title: string
  content?: string
  status: TASK_STATUS
  priority: TASK_PRIORITY
  startDate?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  title: string
  content?: string
  status?: TASK_STATUS
  priority?: TASK_PRIORITY
  startDate?: string
  dueDate?: string
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  taskId: string
}

export function getTaskList(): Promise<TaskItem[]> {
  return post<TaskItem[]>('/task/get-list', {})
}

export function createTask(payload: CreateTaskPayload): Promise<TaskItem> {
  return post<TaskItem>('/task/create', payload as unknown as Record<string, unknown>)
}

export function updateTask(payload: UpdateTaskPayload): Promise<TaskItem> {
  return post<TaskItem>('/task/update', payload as unknown as Record<string, unknown>)
}

export function deleteTask(taskId: string): Promise<{ taskId: string }> {
  return post<{ taskId: string }>('/task/delete', { taskId })
}
