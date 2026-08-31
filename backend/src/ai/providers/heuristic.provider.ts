import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  ModerationResult,
} from './ai-provider.interface';

const STOP_WORDS = new Set(
  `a about above after again against all am an and any are aren't as at be because been before being below between both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves`.split(
    /\s+/,
  ),
);

const BANNED = [
  /\b(kill|murder)\s+(you|him|her|them)\b/i,
  /\bhate\s+speech\b/i,
  /\b(f\*{2,}k|sh\*t)\b/i,
];

/**
 * Zero-dependency, fully offline provider. Always available so the app
 * degrades gracefully when no API key / MCP server is configured.
 */
@Injectable()
export class HeuristicAiProvider implements AiProvider {
  readonly name = 'heuristic';

  async summarize(text: string, maxChars: number): Promise<string> {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxChars) return clean;

    // Prefer to cut on a sentence boundary, then a word boundary.
    const slice = clean.slice(0, maxChars);
    const lastSentence = Math.max(
      slice.lastIndexOf('. '),
      slice.lastIndexOf('! '),
      slice.lastIndexOf('? '),
    );
    if (lastSentence > maxChars * 0.6) {
      return slice.slice(0, lastSentence + 1).trim();
    }
    const lastSpace = slice.lastIndexOf(' ');
    return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxChars).trim()}…`;
  }

  async suggestTags(text: string, limit: number): Promise<string[]> {
    const freq = new Map<string, number>();
    for (const raw of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
      if (STOP_WORDS.has(raw)) continue;
      freq.set(raw, (freq.get(raw) ?? 0) + 1);
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  async moderate(text: string): Promise<ModerationResult> {
    const reasons = BANNED.filter((re) => re.test(text)).map(
      (re) => `matched ${re}`,
    );
    return { flagged: reasons.length > 0, reasons };
  }
}
