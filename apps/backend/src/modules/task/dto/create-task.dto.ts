import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string

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
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date
}
