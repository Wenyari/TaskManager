import { post } from './request'
import type { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'

export interface TaskItem {
  _id: string
  userId: string
  title: string
  content?: string
  status: TASK_STATUS
  priority: TASK_PRIORITY
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  title: string
  content?: string
  status?: TASK_STATUS
  priority?: TASK_PRIORITY
  dueDate?: string
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  taskId: string
}

export interface QueryTaskPayload {
  status?: TASK_STATUS
  priority?: TASK_PRIORITY
}

export function getTaskList(filter: QueryTaskPayload): Promise<TaskItem[]> {
  return post<TaskItem[]>('/task/get-list', filter as unknown as Record<string, unknown>)
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
