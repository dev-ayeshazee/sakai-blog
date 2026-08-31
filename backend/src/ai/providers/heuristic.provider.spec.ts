import { HeuristicAiProvider } from './heuristic.provider';

describe('HeuristicAiProvider', () => {
  const provider = new HeuristicAiProvider();

  it('summarize returns text unchanged when under the limit', async () => {
    const out = await provider.summarize('short text', 200);
    expect(out).toBe('short text');
  });

  it('summarize never exceeds maxChars (+ ellipsis)', async () => {
    const long = 'word '.repeat(200);
    const out = await provider.summarize(long, 50);
    expect(out.length).toBeLessThanOrEqual(51);
  });

  it('summarize prefers a sentence boundary', async () => {
    const text =
      'This first sentence is fairly long and complete. Then more text that keeps going well past the cut.';
    const out = await provider.summarize(text, 60);
    expect(out).toBe('This first sentence is fairly long and complete.');
  });

  it('suggestTags drops stop words and ranks by frequency', async () => {
    const tags = await provider.suggestTags(
      'angular angular angular the the router router signals',
      3,
    );
    expect(tags[0]).toBe('angular');
    expect(tags).not.toContain('the');
    expect(tags.length).toBe(3);
  });

  it('moderate flags disallowed content', async () => {
    const clean = await provider.moderate('a perfectly nice blog post');
    expect(clean.flagged).toBe(false);

    const bad = await provider.moderate('I will kill you if you comment');
    expect(bad.flagged).toBe(true);
    expect(bad.reasons.length).toBeGreaterThan(0);
  });
});
