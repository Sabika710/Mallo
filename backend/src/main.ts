import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })

  const origin = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.setGlobalPrefix('api')

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  }))

  app.useGlobalFilters(new AllExceptionsFilter())

  const port = process.env.PORT ?? 4000
  await app.listen(port)
  console.log(`🚀 Mallo API → http://localhost:${port}/api`)
}

bootstrap()