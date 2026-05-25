import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { MongooseModule } from '@nestjs/mongoose'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { appConfig, databaseConfig, jwtConfig } from './config'
import { AuthModule } from './modules/auth/auth.module'
import { TaskModule } from './modules/task/task.module'
import { UserModule } from './modules/user/user.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig]
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri')
      })
    }),
    UserModule,
    AuthModule,
    TaskModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter }
  ]
})
export class AppModule {}
