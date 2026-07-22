/**
 * THR-712 gate: zero prose-QA fails across the ten guild prefixes.
 * Mirrors the DebugPanel Prose QA verdicts headlessly.
 */
import { describe, it, expect } from 'vitest';
import { collectAuthoredProse } from '../collectAuthoredProse';
import { scoreProseBatch } from '../proseQualityScore';

describe('guild prose QA (THR-712)', () => {
  it('has zero fails across tg/ac/bf/cg/hod/uk/rb/mct/lk/ts entries', () => {
    const corpus = collectAuthoredProse();
    const guild = corpus.filter((e) => /^(tg|ac|bf|cg|hod|uk|rb|mct|lk|ts)\./.test(e.entryId));
    expect(guild.length).toBeGreaterThan(50);
    const batch = scoreProseBatch(guild);
    const fails = batch.entries.filter((r) => r.band === 'fail' || r.band === 'error');
    expect(fails.map((f) => f.entryId)).toEqual([]);
  });
});
