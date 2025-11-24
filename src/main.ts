import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TraceIdInterceptor } from './common/interceptors/trace-id.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ErrorHandlingInterceptor } from './common/interceptors/error-handling.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe with automatic transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors for tracing, logging, and error handling
  app.useGlobalInterceptors(
    new TraceIdInterceptor(),
    new LoggingInterceptor(),
    new ErrorHandlingInterceptor(),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Devices API')
    .setDescription('REST API for managing device resources with caching and tracing')
    .setVersion('1.0')
    .addTag('devices')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
