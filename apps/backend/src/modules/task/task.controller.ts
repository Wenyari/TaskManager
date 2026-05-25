import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { CreateTaskDto } from './dto/create-task.dto'
import { DeleteTaskDto } from './dto/delete-task.dto'
import { QueryTaskDto } from './dto/query-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TaskService } from './task.service'

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('get-list')
  @HttpCode(HttpStatus.OK)
  async getList(@CurrentUser() user: AuthUser, @Body() dto: QueryTaskDto) {
    return this.taskService.getList(user.userId, dto)
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createTask(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.taskService.createTask(user.userId, dto)
  }

  @Post('update')
  @HttpCode(HttpStatus.OK)
  async updateTask(@CurrentUser() user: AuthUser, @Body() dto: UpdateTaskDto) {
    return this.taskService.updateTask(user.userId, dto)
  }

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  async deleteTask(@CurrentUser() user: AuthUser, @Body() dto: DeleteTaskDto) {
    return this.taskService.deleteTask(user.userId, dto.taskId)
  }
}
