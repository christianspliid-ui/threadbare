import { describe, expect, it } from 'vitest';
import {
  BAD_PROSE_FLOWERY,
  BAD_PROSE_HARD_EXCLUSION,
  BAD_PROSE_STATIC_STRINGS,
  BAD_PROSE_TELL_DONT_SHOW,
  GOOD_PROSE_FIXTURES,
} from '../../../data/__fixtures__/prose-quality-eval';
import { scoreProseBatch, scoreProseEntry } from '../proseQualityScore';

describe('scoreProseEntry', () => {
  describe('good fixtures', () => {
    it('enriched narrative entries all pass', () => {
      for (const entry of GOOD_PROSE_FIXTURES) {
        const result = scoreProseEntry(entry);
        expect(result.band, `${entry.entryId} should pass`).toBe('pass');
        expect(result.score, `${entry.entryId} should score ≥85`).toBeGreaterThanOrEqual(85);
        expect(result.flags.filter(f => f.severity === 'gate')).toHaveLength(0);
      }
    });

    it('preserves marquee flag from input', () => {
      const marqueeEntry = GOOD_PROSE_FIXTURES.find(e => e.marquee === true);
      expect(marqueeEntry).toBeDefined();
      const result = scoreProseEntry(marqueeEntry!);
      expect(result.marquee).toBe(true);
    });
  });

  describe('static-string detection', () => {
    it('flags dynamic fields with no placeholders', () => {
      for (const entry of BAD_PROSE_STATIC_STRINGS) {
        const result = scoreProseEntry(entry);
        const staticFlags = result.flags.filter(f => f.category === 'static-string');
        expect(staticFlags.length, `${entry.entryId} should have static-string flags`).toBeGreaterThan(0);
      }
    });

    it('static-string penalty degrades score below pass floor', () => {
      const result = scoreProseEntry(BAD_PROSE_STATIC_STRINGS[0]);
      expect(result.score).toBeLessThan(85);
    });
  });

  describe('flowery phrase detection', () => {
    it('flags purple prose phrases as voice-contract violations', () => {
      for (const entry of BAD_PROSE_FLOWERY) {
        const result = scoreProseEntry(entry);
        const voiceFlags = result.flags.filter(
          f => f.category === 'voice-contract' && f.detail.startsWith('purple prose'),
        );
        expect(voiceFlags.length, `${entry.entryId} should have flowery flags`).toBeGreaterThan(0);
      }
    });

    it('flowery flags have loud severity', () => {
      const result = scoreProseEntry(BAD_PROSE_FLOWERY[0]);
      const floweryFlags = result.flags.filter(f => f.detail.startsWith('purple prose'));
      for (const flag of floweryFlags) {
        expect(flag.severity).toBe('loud');
      }
    });
  });

  describe('tell-dont-show detection', () => {
    it('flags emotion-naming constructions', () => {
      for (const entry of BAD_PROSE_TELL_DONT_SHOW) {
        const result = scoreProseEntry(entry);
        const tdsFlags = result.flags.filter(
          f => f.category === 'voice-contract' && f.detail.includes("tell-don't-show"),
        );
        expect(tdsFlags.length, `${entry.entryId} should have tell-dont-show flags`).toBeGreaterThan(0);
      }
    });
  });

  describe('hard-exclusion gate', () => {
    it('clamps score to 0 and band to fail on gate hit', () => {
      for (const entry of BAD_PROSE_HARD_EXCLUSION) {
        const result = scoreProseEntry(entry);
        expect(result.score, `${entry.entryId} should score 0`).toBe(0);
        expect(result.band, `${entry.entryId} should fail`).toBe('fail');
        const gateFlags = result.flags.filter(f => f.severity === 'gate');
        expect(gateFlags.length, `${entry.entryId} should have a gate flag`).toBeGreaterThan(0);
      }
    });

    it('gate flag has hard-exclusion category', () => {
      const result = scoreProseEntry(BAD_PROSE_HARD_EXCLUSION[0]);
      const gateFlag = result.flags.find(f => f.severity === 'gate');
      expect(gateFlag?.category).toBe('hard-exclusion');
    });
  });

  describe('scoring mechanics', () => {
    it('clean entry with name + conditional scores 100', () => {
      const result = scoreProseEntry({
        entryId: 'clean',
        contentType: 'encounter',
        fields: { prose: '{name} left at dawn. {?is_hunted}Running still.{/?is_hunted}' },
      });
      expect(result.score).toBe(100);
      expect(result.band).toBe('pass');
    });

    it('config override respects passFloor', () => {
      const result = scoreProseEntry(
        { entryId: 'clean', contentType: 'encounter', fields: { prose: '{name} left at dawn.' } },
        { passFloor: 101 },
      );
      // Score is 100, but passFloor is 101 → should warn
      expect(result.band).toBe('warn');
    });

    it('entryId and contentType are preserved in result', () => {
      const result = scoreProseEntry(GOOD_PROSE_FIXTURES[0]);
      expect(result.entryId).toBe(GOOD_PROSE_FIXTURES[0].entryId);
      expect(result.contentType).toBe(GOOD_PROSE_FIXTURES[0].contentType);
    });
  });
});

describe('scoreProseBatch', () => {
  const allBad = [...BAD_PROSE_STATIC_STRINGS, ...BAD_PROSE_FLOWERY, ...BAD_PROSE_HARD_EXCLUSION];

  it('returns summary counts matching individual results', () => {
    const result = scoreProseBatch([...GOOD_PROSE_FIXTURES, ...allBad]);
    expect(result.summary.total).toBe(GOOD_PROSE_FIXTURES.length + allBad.length);
    expect(result.summary.pass).toBe(GOOD_PROSE_FIXTURES.length);
  });

  it('entries are sorted worst-first (lowest score first)', () => {
    const result = scoreProseBatch([...GOOD_PROSE_FIXTURES, ...BAD_PROSE_HARD_EXCLUSION]);
    const scores = result.entries.map(e => e.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });

  it('bottomTail length is at least 1', () => {
    const result = scoreProseBatch([GOOD_PROSE_FIXTURES[0]]);
    expect(result.bottomTail.length).toBeGreaterThanOrEqual(1);
  });

  it('marquee entries surface all marquee inputs', () => {
    const result = scoreProseBatch(GOOD_PROSE_FIXTURES);
    const marqueeIds = GOOD_PROSE_FIXTURES.filter(e => e.marquee).map(e => e.entryId);
    const surfacedIds = result.marqueeEntries.map(e => e.entryId);
    for (const id of marqueeIds) {
      expect(surfacedIds).toContain(id);
    }
  });

  it('empty batch returns zero totals', () => {
    const result = scoreProseBatch([]);
    expect(result.summary.total).toBe(0);
    expect(result.entries).toHaveLength(0);
  });
});
