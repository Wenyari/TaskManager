import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const configService = app.get(ConfigService)

  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api'
  const port = configService.get<number>('app.port') ?? 3000

  app.setGlobalPrefix(apiPrefix)
  app.enableCors()
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false }
    })
  )

  await app.listen(port)
  Logger.log(`Backend listening on http://localhost:${port}/${apiPrefix}`, 'Bootstrap')
}

void bootstrap()
