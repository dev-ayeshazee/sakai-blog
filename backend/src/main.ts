import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { seed } from './database/seeds/seed';

/** Accept bare hostnames (e.g. from a platform service binding) or full URLs. */
function normalizeOrigins(raw?: string): string[] | boolean {
  if (!raw) return true;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => (/^https?:\/\//.test(o) ? o : `https://${o}`));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: normalizeOrigins(config.get<string>('corsOrigin')),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');

  // Optional: seed demo data on first boot (used by the hosted deployment).
  if (process.env.RUN_SEED === 'true') {
    try {
      const result = await seed(app.get(DataSource), { onlyIfEmpty: true });
      Logger.log(result.message, 'Seed');
    } catch (err) {
      Logger.error(`Seed failed: ${err}`, 'Seed');
    }
  }
}
bootstrap();
