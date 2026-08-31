import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AiModule } from './ai/ai.module';
import { McpModule } from './mcp/mcp.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ssl = config.get<boolean>('database.ssl');
        return {
          type: 'postgres' as const,
          url: config.get<string>('database.url'),
          ssl: ssl ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: false,
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          migrationsRun: process.env.RUN_MIGRATIONS === 'true',
        };
      },
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    AiModule,
    McpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
