export interface TaskDocument {
  title: string
  content?: string
  status: string
  priority: string
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}
