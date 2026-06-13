/**
 * Tests for outcome-band prose infrastructure (THR-460).
 *
 * Covers:
 * - OutcomeBand type derivation from StepOutcome
 * - Content table completeness (all 6 bands, ≥3 entries each)
 * - enrichProse {outcome_phrase} and {q_flavor} placeholder resolution
 * - Dedup guard eviction with SimulationRuntime
 * - Fail-soft: no outcomeBand → silent strip
 * - Fail-soft: no runtime → deterministic first-entry pick
 */

import { describe, it, expect, vi } from 'vitest';
import { stepOutcomeToOutcomeBand, OUTCOME_BAND_PROSE, OUTCOME_BAND_Q_FLAVOR, OUTCOME_BAND_PHRASE_HISTORY_WINDOW } from '../../data/outcome-band-content';
import type { OutcomeBand } from '../outcomeConsequences';
import { enrichProse } from '../proseEnrichment';
import type { NarrativeContext } from '../proseEnrichment';
import { createSimulationRuntime } from '../simulationRuntime';

// ─── Minimal NarrativeContext for tests ──────────────────────────────────────

function makeCtx(overrides: Partial<NarrativeContext> = {}): NarrativeContext {
  return {
    agentName: 'Serafina',
    agentId: 'agent-test-1',
    archetypeId: 'witness',
    cultureName: 'Thornfolk',
    primaryReach: 'iron',
    titles: [],
    notableArtifacts: [],
    strongAllies: [],
    rivals: [],
    currentLocationName: 'the Crossroads',
    completedPhases: [],
    beatHistory: [],
    pronouns: { they: 'they', them: 'them', their: 'their', s: 's' },
    tick: 10,
    ...overrides,
  };
}

// ─── stepOutcomeToOutcomeBand ─────────────────────────────────────────────────

describe('stepOutcomeToOutcomeBand', () => {
  it('maps all six StepOutcomes to distinct OutcomeBands', () => {
    const mapping: Array<[Parameters<typeof stepOutcomeToOutcomeBand>[0], OutcomeBand]> = [
      ['critical_success', 'surge'],
      ['success', 'neutral'],
      ['success_at_cost', 'strained'],
      ['near_miss', 'fortunate'],
      ['failure', 'setback'],
      ['critical_failure', 'catastrophe'],
    ];
    for (const [outcome, expected] of mapping) {
      expect(stepOutcomeToOutcomeBand(outcome)).toBe(expected);
    }
  });
});

// ─── Content table completeness ───────────────────────────────────────────────

describe('OUTCOME_BAND_PROSE', () => {
  const bands: OutcomeBand[] = ['surge', 'neutral', 'strained', 'fortunate', 'setback', 'catastrophe'];

  it('has entries for every band', () => {
    for (const band of bands) {
      expect(OUTCOME_BAND_PROSE[band]).toBeDefined();
      expect(OUTCOME_BAND_PROSE[band].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('all phraseIds are unique within a band', () => {
    for (const band of bands) {
      const ids = OUTCOME_BAND_PROSE[band].map(e => e.phraseId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('all phraseIds are globally unique across bands', () => {
    const all = bands.flatMap(b => OUTCOME_BAND_PROSE[b].map(e => e.phraseId));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('OUTCOME_BAND_Q_FLAVOR', () => {
  const bands: OutcomeBand[] = ['surge', 'neutral', 'strained', 'fortunate', 'setback', 'catastrophe'];

  it('has entries for every band', () => {
    for (const band of bands) {
      expect(OUTCOME_BAND_Q_FLAVOR[band]).toBeDefined();
      expect(OUTCOME_BAND_Q_FLAVOR[band].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('all phraseIds are globally unique across bands', () => {
    const all = bands.flatMap(b => OUTCOME_BAND_Q_FLAVOR[b].map(e => e.phraseId));
    expect(new Set(all).size).toBe(all.length);
  });
});

// ─── enrichProse placeholder resolution ──────────────────────────────────────

describe('enrichProse — {outcome_phrase}', () => {
  it('resolves {outcome_phrase} when outcomeBand is set', () => {
    const ctx = makeCtx({ outcomeBand: 'surge' });
    const result = enrichProse('{name} succeeded {outcome_phrase}.', ctx);
    expect(result).toContain('Serafina succeeded');
    expect(result).not.toContain('{outcome_phrase}');
    const pool = OUTCOME_BAND_PROSE['surge'].map(e => e.text);
    const hasPhrase = pool.some(p => result.includes(p));
    expect(hasPhrase).toBe(true);
  });

  it('strips {outcome_phrase} silently when outcomeBand is absent', () => {
    const ctx = makeCtx();
    const result = enrichProse('Outcome: {outcome_phrase}.', ctx);
    expect(result).toBe('Outcome: .');
    expect(result).not.toContain('{outcome_phrase}');
  });

  it('resolves {q_flavor} when outcomeBand is set', () => {
    const ctx = makeCtx({ outcomeBand: 'catastrophe' });
    const result = enrichProse('{q_flavor}', ctx);
    expect(result).not.toContain('{q_flavor}');
    const pool = OUTCOME_BAND_Q_FLAVOR['catastrophe'].map(e => e.text);
    expect(pool.some(p => result.includes(p))).toBe(true);
  });

  it('strips {q_flavor} silently when outcomeBand is absent', () => {
    const ctx = makeCtx();
    const result = enrichProse('{q_flavor}', ctx);
    expect(result).toBe('');
  });

  it('uses first pool entry deterministically when no runtime provided', () => {
    const ctx = makeCtx({ outcomeBand: 'neutral' });
    const first = OUTCOME_BAND_PROSE['neutral'][0].text;
    const r1 = enrichProse('{outcome_phrase}', ctx);
    const r2 = enrichProse('{outcome_phrase}', ctx);
    expect(r1).toBe(first);
    expect(r2).toBe(first);
  });
});

// ─── Dedup guard with SimulationRuntime ──────────────────────────────────────

describe('enrichProse — dedup guard', () => {
  it('avoids repeating phrases when runtime is provided', () => {
    const runtime = createSimulationRuntime();
    const ctx = makeCtx({ outcomeBand: 'surge' });
    const poolSize = OUTCOME_BAND_PROSE['surge'].length;
    const seen = new Set<string>();
    const rng = vi.fn().mockImplementation(() => {
      // Cycling rng so we get deterministic but varying picks
      return Math.random();
    });

    for (let i = 0; i < poolSize; i++) {
      const result = enrichProse('{outcome_phrase}', ctx, { runtime, rng });
      seen.add(result);
    }
    // Should have seen at least 2 distinct phrases across poolSize calls
    expect(seen.size).toBeGreaterThan(1);
  });

  it('evicts oldest entry once history exceeds window', () => {
    const runtime = createSimulationRuntime();
    const ctx = makeCtx({ outcomeBand: 'surge', agentId: 'agent-evict-test' });
    let rngCallCount = 0;
    const rng = () => { rngCallCount++; return 0; };

    // Pump enough calls to exceed the window
    const callCount = OUTCOME_BAND_PHRASE_HISTORY_WINDOW + 5;
    for (let i = 0; i < callCount; i++) {
      enrichProse('{outcome_phrase}', ctx, { runtime, rng });
    }

    const histKey = 'agent-evict-test';
    const usedIds = runtime.outcomeBandPhraseHistory.get(histKey);
    expect(usedIds).toBeDefined();
    // History should be bounded to the window
    expect(usedIds!.size).toBeLessThanOrEqual(OUTCOME_BAND_PHRASE_HISTORY_WINDOW);
  });

  it('uses separate history for outcome_phrase and q_flavor', () => {
    const runtime = createSimulationRuntime();
    const ctx = makeCtx({ outcomeBand: 'setback', agentId: 'agent-sep-test' });
    const rng = () => 0;

    enrichProse('{outcome_phrase} {q_flavor}', ctx, { runtime, rng });

    expect(runtime.outcomeBandPhraseHistory.has('agent-sep-test')).toBe(true);
    expect(runtime.outcomeBandPhraseHistory.has('agent-sep-test__q')).toBe(true);
  });
});
