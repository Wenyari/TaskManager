import { IsEnum, IsOptional } from 'class-validator'
import { TASK_PRIORITY, TASK_STATUS } from '@taskmanager/shared'

export class QueryTaskDto {
  @IsOptional()
  @IsEnum(TASK_STATUS)
  status?: TASK_STATUS

  @IsOptional()
  @IsEnum(TASK_PRIORITY)
  priority?: TASK_PRIORITY
}
