/**
 * Tests for executeChoiceSet (TB-128).
 *
 * Covers:
 *  - Predicate filtering (options gated by predicates are removed)
 *  - Fallback when all predicates fail (use unfiltered list + warn)
 *  - AI auto-resolve determinism (ai_auto picks first available)
 *  - Weighted random determinism (same seed → same pick)
 *  - Player mode returns pendingChoice, no mutations
 *  - CHOICE_SET_MAX_OPTIONS UX cap
 *  - Empty options array → skip + warn
 *  - Trace emission for all modes
 */

import { describe, it, expect } from 'vitest';
import { executeChoiceSet, type ExecutionContext } from '../effectExecutors';
import { WorldGraph } from '../graph';
import type { ChoiceSetEffect, ChoiceOption, PredicateContext } from '../../types/effects';

// ─── Helpers ────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    casterId: 'agent-001',
    tick: 10,
    graph: new WorldGraph(),
    ...overrides,
  };
}

function makeOption(id: string, predicate?: ChoiceOption['predicate']): ChoiceOption {
  return {
    id,
    label: `Option ${id}`,
    description: `Description for ${id}`,
    predicate,
    consequences: [],
  };
}

const alwaysTrue: ChoiceOption['predicate'] = 'in_combat'; // will be true with combat ctx
const alwaysFalse: ChoiceOption['predicate'] = 'in_social'; // will be false with combat ctx

const combatCtx: PredicateContext = {
  inCombat: true,
  inSocial: false,
  inExploration: false,
  inMystical: false,
  atHomeTerritory: false,
  inEnemyTerritory: false,
  inWilderness: false,
  healthLow: false,
  healthHigh: true,
  alone: false,
  outnumbered: false,
  nearWater: false,
  biome: 'grassland',
  agentTraits: new Set(['warrior']),
  reachValues: {},
  factionRank: 0,
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('executeChoiceSet', () => {

  // ── Guard cases ──────────────────────────────────────────────────

  it('returns failure for empty options array', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [],
      selectionMode: 'ai_auto',
    };
    const result = executeChoiceSet(effect, makeCtx());
    expect(result.success).toBe(false);
    expect(result.warnings).toContain('choice_set has no options — skipped');
    expect(result.mutations).toHaveLength(0);
  });

  // ── Predicate filtering ──────────────────────────────────────────

  it('passes all options when no predicate context supplied', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [makeOption('a', alwaysTrue), makeOption('b', alwaysFalse)],
      selectionMode: 'ai_auto',
    };
    const ctx = makeCtx(); // no predicateContext
    const result = executeChoiceSet(effect, ctx);
    expect(result.success).toBe(true);
    const trace = result.traces[0].details as { filteredOptions: string[] };
    // Both options pass when context is absent
    expect(trace.filteredOptions).toEqual(['a', 'b']);
  });

  it('filters out options whose predicate fails', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [
        makeOption('a', alwaysTrue),  // passes (in_combat = true)
        makeOption('b', alwaysFalse), // fails (in_social = false)
        makeOption('c'),              // no predicate — always passes
      ],
      selectionMode: 'ai_auto',
    };
    const ctx = makeCtx({ predicateContext: combatCtx });
    const result = executeChoiceSet(effect, ctx);
    const trace = result.traces[0].details as { filteredOptions: string[]; availableOptions: string[] };
    expect(trace.availableOptions).toEqual(['a', 'b', 'c']);
    expect(trace.filteredOptions).toEqual(['a', 'c']); // b filtered out
    expect(result.warnings).toBeUndefined(); // no fallback needed
  });

  it('falls back to unfiltered list when all predicates fail, emits warning', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [makeOption('a', alwaysFalse), makeOption('b', alwaysFalse)],
      selectionMode: 'ai_auto',
    };
    const ctx = makeCtx({ predicateContext: combatCtx });
    const result = executeChoiceSet(effect, ctx);
    expect(result.success).toBe(true);
    const trace = result.traces[0].details as { filteredOptions: string[]; usedFallback: boolean };
    // Fallback: all options available
    expect(trace.filteredOptions).toEqual(['a', 'b']);
    expect(trace.usedFallback).toBe(true);
    expect(result.warnings).toContain('All choice_set predicates failed — fallback options shown');
  });

  // ── ai_auto mode ─────────────────────────────────────────────────

  it('ai_auto picks the first available option', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [makeOption('first'), makeOption('second')],
      selectionMode: 'ai_auto',
    };
    const result = executeChoiceSet(effect, makeCtx());
    expect(result.success).toBe(true);
    const trace = result.traces[0].details as { selectedOptionId: string; selectionMode: string };
    expect(trace.selectedOptionId).toBe('first');
    expect(trace.selectionMode).toBe('ai_auto');
    expect(result.mutations).toHaveLength(0);
    expect(result.pendingChoice).toBeUndefined();
  });

  // ── weighted_random mode — determinism ───────────────────────────

  it('weighted_random produces deterministic picks for the same (casterId, tick)', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [makeOption('a'), makeOption('b'), makeOption('c')],
      selectionMode: 'weighted_random',
    };
    const ctx = makeCtx({ casterId: 'agent-777', tick: 42 });
    const r1 = executeChoiceSet(effect, ctx);
    const r2 = executeChoiceSet(effect, ctx);
    const t1 = r1.traces[0].details as { selectedOptionId: string };
    const t2 = r2.traces[0].details as { selectedOptionId: string };
    expect(t1.selectedOptionId).toBe(t2.selectedOptionId);
    expect(['a', 'b', 'c']).toContain(t1.selectedOptionId);
  });

  it('weighted_random picks differ for different seeds', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [makeOption('a'), makeOption('b'), makeOption('c'), makeOption('d'), makeOption('e')],
      selectionMode: 'weighted_random',
    };
    const results = new Set<string>();
    for (let tick = 0; tick < 20; tick++) {
      const r = executeChoiceSet(effect, makeCtx({ tick }));
      const trace = r.traces[0].details as { selectedOptionId: string };
      results.add(trace.selectedOptionId);
    }
    // With 5 options and 20 different seeds, expect more than 1 unique pick
    expect(results.size).toBeGreaterThan(1);
  });

  // ── player mode ──────────────────────────────────────────────────

  it('player mode returns pendingChoice with filtered options, no mutations', () => {
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options: [makeOption('loot'), makeOption('info'), makeOption('alliance')],
      selectionMode: 'player',
      timeoutMs: 15_000,
    };
    const ctx = makeCtx({ casterId: 'hero-001', tick: 5 });
    const result = executeChoiceSet(effect, ctx, 'encounter-reward');
    expect(result.success).toBe(true);
    expect(result.mutations).toHaveLength(0);
    expect(result.pendingChoice).toBeDefined();
    expect(result.pendingChoice!.actorId).toBe('hero-001');
    expect(result.pendingChoice!.options).toHaveLength(3);
    expect(result.pendingChoice!.timeoutMs).toBe(15_000);
    expect(result.pendingChoice!.sourceId).toBe('encounter-reward');
    // choiceId is stable for same (casterId, tick, sourceId)
    expect(result.pendingChoice!.choiceId).toBe('choice_hero-001_5_encounter-reward');
    const trace = result.traces[0].details as { awaitingPlayerChoice: boolean; selectedOptionId: null };
    expect(trace.awaitingPlayerChoice).toBe(true);
    expect(trace.selectedOptionId).toBeNull();
  });

  // ── UX cap ───────────────────────────────────────────────────────

  it('caps options at CHOICE_SET_MAX_OPTIONS (6)', () => {
    const options = Array.from({ length: 8 }, (_, i) => makeOption(`opt-${i}`));
    const effect: ChoiceSetEffect = {
      type: 'choice_set',
      options,
      selectionMode: 'player',
    };
    const result = executeChoiceSet(effect, makeCtx());
    expect(result.pendingChoice!.options).toHaveLength(6);
  });

  // ── Trace emission ───────────────────────────────────────────────

  it('emits a choice_set trace for every resolution mode', () => {
    for (const mode of ['ai_auto', 'weighted_random', 'player'] as const) {
      const effect: ChoiceSetEffect = {
        type: 'choice_set',
        options: [makeOption('x'), makeOption('y')],
        selectionMode: mode,
      };
      const result = executeChoiceSet(effect, makeCtx({ tick: 1 }));
      expect(result.traces).toHaveLength(1);
      expect(result.traces[0].effectType).toBe('choice_set');
    }
  });
});
