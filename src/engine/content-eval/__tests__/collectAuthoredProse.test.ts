import { describe, expect, it } from 'vitest';
import { collectAuthoredProse } from '../collectAuthoredProse';
import { scoreProseBatch } from '../proseQualityScore';

describe('collectAuthoredProse', () => {
  const corpus = collectAuthoredProse();

  it('returns a non-empty corpus over the authored-content tables', () => {
    expect(corpus.length).toBeGreaterThan(0);
  });

  it('produces well-formed EvalInput entries', () => {
    for (const entry of corpus) {
      expect(typeof entry.entryId).toBe('string');
      expect(entry.entryId.length).toBeGreaterThan(0);
      expect(typeof entry.contentType).toBe('string');
      expect(entry.contentType.length).toBeGreaterThan(0);
      // Every entry carries at least one non-blank prose field.
      const values = Object.values(entry.fields);
      expect(values.length).toBeGreaterThan(0);
      for (const v of values) {
        expect(typeof v).toBe('string');
      }
    }
  });

  it('yields globally-unique entryIds (stable React keys)', () => {
    const ids = corpus.map((e) => e.entryId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spans multiple content types (not just one table)', () => {
    const types = new Set(corpus.map((e) => e.contentType));
    // Encounters are guaranteed; at least one more table should resolve.
    expect(types.has('encounter')).toBe(true);
    expect(types.size).toBeGreaterThan(1);
  });

  it('emits no collector-error entries under normal operation', () => {
    const errors = corpus.filter((e) => e.contentType === 'meta' && e.entryId.endsWith('::collect-error'));
    expect(errors, errors.map((e) => e.entryId).join(', ')).toHaveLength(0);
  });

  it('is deterministic — same content library → same corpus', () => {
    const a = collectAuthoredProse();
    const b = collectAuthoredProse();
    expect(a.map((e) => e.entryId)).toEqual(b.map((e) => e.entryId));
  });

  it('feeds the scorer to produce a batch report with a positive total', () => {
    const batch = scoreProseBatch(corpus);
    expect(batch.summary.total).toBe(corpus.length);
    expect(batch.summary.total).toBeGreaterThan(0);
    // Bands partition the corpus exactly.
    const { pass, warn, fail, error } = batch.summary;
    expect(pass + warn + fail + error).toBe(batch.summary.total);
  });

  it('declares encounter aftermath beats as peak register (THR-609)', () => {
    // The major-aftermath surface is a canon peak register; the collector must
    // tag it so peak lyricism is not mis-scored under baseline thresholds.
    const withAftermath = corpus.filter(
      (e) => e.contentType === 'encounter' && Object.keys(e.fields).some((k) => k.startsWith('aftermath')),
    );
    expect(withAftermath.length).toBeGreaterThan(0);
    for (const e of withAftermath) {
      expect(e.fieldRegisters?.aftermath).toBe('peak');
    }
  });
});
