import { IsMongoId } from 'class-validator'

export class DeleteTaskDto {
  @IsMongoId()
  taskId!: string
}
