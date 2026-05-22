import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './common/interceptors/response-interceptor';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
const app = await NestFactory.create(AppModule, { bufferLogs: true });
// app.useLogger(app.get(Logger));

  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use(cookieParser());

  app.setGlobalPrefix("api");
 app.useGlobalInterceptors(
    new ResponseInterceptor(),
  );
  await app.listen(5000);
}

bootstrap();