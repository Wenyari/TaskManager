import { SetMetadata } from '@nestjs/common'

// 标记当前路由为公开接口，绕过全局 JwtAuthGuard
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true)
