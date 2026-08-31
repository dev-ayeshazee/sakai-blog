import { DataSource, DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

const ssl =
  ['1', 'true', 'yes', 'on'].includes(
    (process.env.DATABASE_SSL ?? '').toLowerCase(),
  ) || undefined;

/**
 * Shared TypeORM options. Used both by the Nest runtime (see AppModule)
 * and by the TypeORM CLI for generating / running migrations.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://blog:blog@localhost:5432/blog',
  ssl: ssl ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
};

/** CLI entrypoint: `npm run migration:run`, `migration:generate`, etc. */
export default new DataSource(dataSourceOptions);
