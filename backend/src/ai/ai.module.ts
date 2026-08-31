import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpModule } from '../mcp/mcp.module';
import { AiService } from './ai.service';
import { AI_PROVIDER, AiProvider } from './providers/ai-provider.interface';
import { HeuristicAiProvider } from './providers/heuristic.provider';
import { AnthropicAiProvider } from './providers/anthropic.provider';

@Module({
  imports: [McpModule],
  providers: [
    HeuristicAiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, HeuristicAiProvider],
      useFactory: (
        config: ConfigService,
        heuristic: HeuristicAiProvider,
      ): AiProvider => {
        const provider = config.get<string>('ai.provider');
        const apiKey = config.get<string>('ai.anthropicApiKey');
        if (provider === 'anthropic' && apiKey) {
          return new AnthropicAiProvider({
            apiKey,
            model: config.get<string>('ai.model') ?? '',
          });
        }
        return heuristic;
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
