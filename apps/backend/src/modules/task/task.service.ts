import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, Types } from 'mongoose'
import { DefaultException } from '../../common/exceptions/default.exception'
import { CreateTaskDto } from './dto/create-task.dto'
import { QueryTaskDto } from './dto/query-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TaskDocument, TaskModel } from './schemas/task.schema'

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(TaskDocument.name) private readonly taskModel: Model<TaskDocument>
  ) {}

  async getList(userId: string, filter: QueryTaskDto): Promise<TaskModel[]> {
    const query: FilterQuery<TaskDocument> = { userId: new Types.ObjectId(userId) }
    if (filter.status) {
      query.status = filter.status
    }
    if (filter.priority) {
      query.priority = filter.priority
    }
    return this.taskModel.find(query).sort({ createdAt: -1 }).exec()
  }

  async getDetail(userId: string, taskId: string): Promise<TaskModel> {
    const task = await this.taskModel.findOne({ _id: taskId, userId: new Types.ObjectId(userId) }).exec()
    if (!task) {
      throw new DefaultException('task not found', HttpStatus.NOT_FOUND)
    }
    return task
  }

  async createTask(userId: string, dto: CreateTaskDto): Promise<TaskModel> {
    const task = new this.taskModel({ ...dto, userId: new Types.ObjectId(userId) })
    return task.save()
  }

  async updateTask(userId: string, dto: UpdateTaskDto): Promise<TaskModel> {
    const { taskId, ...rest } = dto
    const updated = await this.taskModel
      .findOneAndUpdate({ _id: taskId, userId: new Types.ObjectId(userId) }, rest, { new: true })
      .exec()
    if (!updated) {
      throw new DefaultException('task not found', HttpStatus.NOT_FOUND)
    }
    return updated
  }

  async deleteTask(userId: string, taskId: string): Promise<{ taskId: string }> {
    const result = await this.taskModel.deleteOne({ _id: taskId, userId: new Types.ObjectId(userId) }).exec()
    if (result.deletedCount === 0) {
      throw new DefaultException('task not found', HttpStatus.NOT_FOUND)
    }
    return { taskId }
  }
}
