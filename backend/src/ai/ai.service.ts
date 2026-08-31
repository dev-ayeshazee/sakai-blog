import { Injectable, Inject, Logger } from '@nestjs/common';
import { AI_PROVIDER, AiProvider, ModerationResult } from './providers/ai-provider.interface';
import { McpClientService } from '../mcp/mcp-client.service';

export interface PostEnrichment {
  excerpt: string;
  tags: string[];
  moderation: ModerationResult;
}

/**
 * AI middleware: the pre-processing step run on every post before it is
 * persisted. Content moderation and tag suggestion go through the MCP
 * client (bundled mock by default); the excerpt uses the configured AI
 * provider directly when one is set (e.g. Anthropic), else the MCP tool.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly EXCERPT_MAX = 200;

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly mcp: McpClientService,
  ) {
    this.logger.log(`AI provider: ${provider.name}`);
  }

  async enrichPost(body: string): Promise<PostEnrichment> {
    const [moderation, excerpt, tags] = await Promise.all([
      this.moderate(body),
      this.buildExcerpt(body),
      this.suggestTags(body),
    ]);
    return { excerpt, tags, moderation };
  }

  private async buildExcerpt(body: string): Promise<string> {
    try {
      if (this.provider.name !== 'heuristic') {
        return await this.provider.summarize(body, this.EXCERPT_MAX);
      }
      const res = await this.mcp.callTool('generate_excerpt', {
        text: body,
        maxChars: this.EXCERPT_MAX,
      });
      return this.mcp.text(res);
    } catch (err) {
      this.logger.warn(`excerpt fell back to naive slice: ${err}`);
      return body.replace(/\s+/g, ' ').trim().slice(0, this.EXCERPT_MAX);
    }
  }

  private async suggestTags(body: string): Promise<string[]> {
    try {
      const res = await this.mcp.callTool('suggest_tags', {
        text: body,
        limit: 5,
      });
      return JSON.parse(this.mcp.text(res)) as string[];
    } catch (err) {
      this.logger.warn(`suggestTags failed: ${err}`);
      return [];
    }
  }

  private async moderate(body: string): Promise<ModerationResult> {
    try {
      const res = await this.mcp.callTool('moderate_content', { text: body });
      return JSON.parse(this.mcp.text(res)) as ModerationResult;
    } catch (err) {
      this.logger.warn(`moderation failed open: ${err}`);
      return { flagged: false, reasons: [] };
    }
  }
}
