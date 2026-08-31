import { Injectable, Logger } from '@nestjs/common';
import {
  AiProvider,
  ModerationResult,
} from './ai-provider.interface';
import { HeuristicAiProvider } from './heuristic.provider';

interface AnthropicOptions {
  apiKey: string;
  model: string;
}

/**
 * Calls the Anthropic Messages API via global fetch (Node >= 18). Any error
 * (missing key, network, rate limit, bad JSON) transparently falls back to
 * the heuristic provider so post creation never fails because of AI.
 */
@Injectable()
export class AnthropicAiProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicAiProvider.name);
  private readonly fallback = new HeuristicAiProvider();

  constructor(private readonly opts: AnthropicOptions) {}

  private async ask(system: string, user: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.opts.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.opts.model,
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const json = (await res.json()) as {
      content: { type: string; text: string }[];
    };
    return json.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('')
      .trim();
  }

  async summarize(text: string, maxChars: number): Promise<string> {
    try {
      const out = await this.ask(
        `You write concise blog excerpts. Reply with ONLY the excerpt, no preamble, at most ${maxChars} characters.`,
        text,
      );
      return out.slice(0, maxChars);
    } catch (err) {
      this.logger.warn(`summarize fell back to heuristic: ${err}`);
      return this.fallback.summarize(text, maxChars);
    }
  }

  async suggestTags(text: string, limit: number): Promise<string[]> {
    try {
      const out = await this.ask(
        `Suggest up to ${limit} lowercase topic tags. Reply as a comma-separated list only.`,
        text,
      );
      return out
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, limit);
    } catch (err) {
      this.logger.warn(`suggestTags fell back to heuristic: ${err}`);
      return this.fallback.suggestTags(text, limit);
    }
  }

  async moderate(text: string): Promise<ModerationResult> {
    try {
      const out = await this.ask(
        `You are a content moderator. Reply with JSON {"flagged":boolean,"reasons":string[]} only.`,
        text,
      );
      return JSON.parse(out) as ModerationResult;
    } catch (err) {
      this.logger.warn(`moderate fell back to heuristic: ${err}`);
      return this.fallback.moderate(text);
    }
  }
}
