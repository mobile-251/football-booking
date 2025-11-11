import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  return app;
}

async function bootstrap() {
  if (process.env.VERCEL) return;
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
void bootstrap();
