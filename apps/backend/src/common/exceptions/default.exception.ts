import { HttpException, HttpStatus } from '@nestjs/common'

// 业务统一异常，遵循 AGENTS.md 第 8 条
export class DefaultException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status)
  }
}
