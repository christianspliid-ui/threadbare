import { describe, expect, it } from 'vitest';
import { scoreRegisterCompliance } from '../registerCompliance';
import { scoreProseEntry, scoreProseBatch } from '../proseQualityScore';

describe('scoreRegisterCompliance', () => {
  describe('register resolution', () => {
    it('defaults to baseline when no register is declared', () => {
      const r = scoreRegisterCompliance({ fields: { narrative: 'A short plain line.' } });
      expect(r.register).toBe('baseline');
      expect(r.declared).toBe(false);
    });

    it('honours a declared register and marks it declared', () => {
      const r = scoreRegisterCompliance({ register: 'peak', fields: { narrative: 'A short plain line.' } });
      expect(r.register).toBe('peak');
      expect(r.declared).toBe(true);
    });
  });

  describe('rareWordDensity (ornate-diction density)', () => {
    it('passes plainspoken baseline prose (0 ornate)', () => {
      const r = scoreRegisterCompliance({
        register: 'baseline',
        fields: { narrative: "The merchant owed too many people too much. He'd started checking the door." },
      });
      const metric = r.metrics.find((m) => m.name === 'rareWordDensity');
      expect(metric?.band).toBe('pass');
      expect(r.band).toBe('pass');
    });

    it('fails stacked ornate diction at baseline', () => {
      const r = scoreRegisterCompliance({
        register: 'baseline',
        fields: { narrative: "The merchant's ambit had grown parlous, freighted with unspoken covenants and ineffable dread." },
      });
      const metric = r.metrics.find((m) => m.name === 'rareWordDensity');
      expect(metric?.band).toBe('fail');
      expect(r.band).toBe('fail');
    });

    it('tolerates elevated vocabulary at peak register', () => {
      const peak = scoreRegisterCompliance({
        register: 'peak',
        fields: { narrative: 'The luminous firmament wheeled, and one ancient reverie surfaced from the dark.' },
      });
      const baseline = scoreRegisterCompliance({
        register: 'baseline',
        fields: { narrative: 'The luminous firmament wheeled, and one ancient reverie surfaced from the dark.' },
      });
      // Same text is stricter at baseline than at peak.
      const rank: Record<string, number> = { pass: 0, warn: 1, fail: 2, skipped: -1 };
      expect(rank[peak.band]).toBeLessThanOrEqual(rank[baseline.band]);
    });

    it('does not hard-fail a short entry on a single ornate word', () => {
      const r = scoreRegisterCompliance({
        register: 'baseline',
        fields: { afterimage: 'An ineffable hush.' },
      });
      const metric = r.metrics.find((m) => m.name === 'rareWordDensity');
      expect(metric?.band).not.toBe('fail'); // short-entry floor caps at warn
    });
  });

  describe('avgSentenceLength', () => {
    it('fails a baseline entry whose sentences run long', () => {
      const long =
        'The merchant considered the long and winding road ahead of him with a great and abiding weariness that settled deep into his tired and aching bones as the evening light slowly faded across the wide and empty fields beyond the town.';
      const r = scoreRegisterCompliance({ register: 'baseline', fields: { narrative: long } });
      const metric = r.metrics.find((m) => m.name === 'avgSentenceLength');
      expect(metric?.band).toBe('fail');
    });

    it('allows a stretched rhythm at peak that would fail at baseline', () => {
      // 27 words, one sentence: over the baseline fail ceiling (22.5) but under
      // the peak fail ceiling (32.5), so baseline fails and peak only warns.
      const stretched =
        'The merchant considered the long road ahead with a weariness that settled into his bones as the evening light faded across the empty fields beyond the town.';
      const peak = scoreRegisterCompliance({ register: 'peak', fields: { narrative: stretched } });
      const baseline = scoreRegisterCompliance({ register: 'baseline', fields: { narrative: stretched } });
      expect(peak.metrics.find((m) => m.name === 'avgSentenceLength')?.band).not.toBe('fail');
      expect(baseline.metrics.find((m) => m.name === 'avgSentenceLength')?.band).toBe('fail');
    });
  });

  describe('figurativeDensity', () => {
    it('passes one figurative image per paragraph at peak', () => {
      const r = scoreRegisterCompliance({
        register: 'peak',
        fields: { narrative: 'The bells stopped. Whatever had been holding its breath beneath the city grew still.' },
      });
      const metric = r.metrics.find((m) => m.name === 'figurativeDensity');
      expect(metric?.band).toBe('pass');
    });

    it('warns at one figurative image per paragraph at baseline', () => {
      const r = scoreRegisterCompliance({
        register: 'baseline',
        fields: { narrative: 'He waited by the door like a stone left in a field.' },
      });
      const metric = r.metrics.find((m) => m.name === 'figurativeDensity');
      expect(metric?.band === 'warn' || metric?.band === 'fail').toBe(true);
    });
  });

  describe('interactivePlainness (label-class fields)', () => {
    it('passes a plain short label', () => {
      const r = scoreRegisterCompliance({ fields: { name: 'Part the Veil' } });
      const metric = r.metrics.find((m) => m.name === 'interactivePlainness');
      expect(metric?.band).toBe('pass');
    });

    it('fails a label carrying ornate diction', () => {
      const r = scoreRegisterCompliance({ fields: { name: 'Beseech the Ineffable' } });
      const metric = r.metrics.find((m) => m.name === 'interactivePlainness');
      expect(metric?.band).toBe('fail');
    });

    it('warns on an over-long label', () => {
      const r = scoreRegisterCompliance({ fields: { name: 'Ask the guard about the missing grain sacks now' } });
      const metric = r.metrics.find((m) => m.name === 'interactivePlainness');
      expect(metric?.band).toBe('warn');
    });
  });

  describe('fail-soft', () => {
    it('skips (never throws) when there is no scoreable prose', () => {
      const r = scoreRegisterCompliance({ fields: {} });
      expect(r.band).toBe('skipped');
    });
  });
});

describe('registerCompliance wired into the prose scorer', () => {
  it('attaches registerCompliance to every scored entry', () => {
    const result = scoreProseEntry({
      entryId: 'test.plain',
      contentType: 'encounter',
      fields: { narrative: 'The gate was open. No one had bothered to close it.' },
    });
    expect(result.registerCompliance).toBeDefined();
    expect(result.registerCompliance.register).toBe('baseline');
    expect(result.registerCompliance.declared).toBe(false);
  });

  it('folds register counts into the batch summary', () => {
    const batch = scoreProseBatch([
      { entryId: 'a', contentType: 'encounter', fields: { narrative: 'A short plain line.' } },
      {
        entryId: 'b',
        contentType: 'encounter',
        register: 'peak',
        fields: { narrative: 'The bells stopped.' },
      },
    ]);
    const reg = batch.summary.register;
    expect(reg.pass + reg.warn + reg.fail + reg.skipped).toBe(batch.summary.total);
    // Entry 'a' declared nothing → counts as undeclared; 'b' declared peak → not.
    expect(reg.undeclared).toBe(1);
  });
});
