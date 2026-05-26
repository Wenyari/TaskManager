import { TASK_PRIORITY, TASK_STATUS } from './enums'

// 用户文档字段契约
export interface UserDocument {
  username: string // 用户名（唯一）
  password: string // bcrypt 加密后的哈希值
  createdAt: Date // 注册时间
  updatedAt: Date // 最后修改时间
}

// 任务文档字段契约
export interface TaskDocument {
  userId: string // 关联的创建者 ID（前后端传输统一使用字符串形式）
  title: string // 任务标题
  status: TASK_STATUS // 任务状态
  priority: TASK_PRIORITY // 任务优先级
  createdAt: Date // 创建时间
  updatedAt: Date // 最后修改时间
  content?: string // 任务详细描述
  startDate?: Date // 计划开始日期（甘特图起点）
  dueDate?: Date // 期望截止日期（甘特图终点）
}
