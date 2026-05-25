import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'

export class UpdateTaskDto {
  @IsMongoId()
  taskId!: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string

  @IsOptional()
  @IsEnum(TASK_STATUS)
  status?: TASK_STATUS

  @IsOptional()
  @IsEnum(TASK_PRIORITY)
  priority?: TASK_PRIORITY

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date
}
