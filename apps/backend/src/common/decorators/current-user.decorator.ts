import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { Request } from 'express'

export interface AuthUser {
  userId: string
}

// 从 Request 上下文中取出 JwtStrategy 注入的当前用户信息
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>()
  return request.user
})
