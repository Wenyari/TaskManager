import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TaskDocument, TaskSchema } from './schemas/task.schema'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: TaskDocument.name, schema: TaskSchema }])],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService]
})
export class TaskModule {}
