export interface ModerationResult {
  flagged: boolean;
  reasons: string[];
}

/**
 * Contract every AI provider (offline heuristic, Anthropic, or an MCP-backed
 * one) must satisfy. The rest of the app depends only on this interface, so
 * swapping providers is a config change — see AiModule.
 */
export interface AiProvider {
  readonly name: string;

  /** Produce a <= maxChars plain-text summary/excerpt of `text`. */
  summarize(text: string, maxChars: number): Promise<string>;

  /** Suggest up to `limit` lowercase topic tags for `text`. */
  suggestTags(text: string, limit: number): Promise<string[]>;

  /** Lightweight content moderation for user-submitted post bodies. */
  moderate(text: string): Promise<ModerationResult>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
