import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'

@Schema({ timestamps: true, collection: 'tasks' })
export class TaskDocument {
  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true, index: true })
  userId: Types.ObjectId

  @Prop({ required: true, trim: true })
  title: string

  @Prop({ type: String })
  content?: string

  @Prop({ type: String, enum: TASK_STATUS, default: TASK_STATUS.TODO, required: true })
  status: TASK_STATUS

  @Prop({ type: String, enum: TASK_PRIORITY, default: TASK_PRIORITY.MEDIUM, required: true })
  priority: TASK_PRIORITY

  @Prop({ type: Date })
  dueDate?: Date

  createdAt: Date

  updatedAt: Date
}

export type TaskModel = HydratedDocument<TaskDocument>

export const TaskSchema = SchemaFactory.createForClass(TaskDocument)
