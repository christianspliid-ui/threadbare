import { describe, it, expect, beforeEach } from 'vitest';
import { getEncounterForeshadowing } from '../getEncounterForeshadowing';
import { attributeRecentInterventions } from '../attributeRecentInterventions';
import { resolveForeshadowingPlaceholders, GENERIC_FORESHADOWING_FALLBACK } from '../genericFallback';
import { createSimulationRuntime } from '../../simulationRuntime';
import type { SimulationRuntime } from '../../simulationRuntime';
import type { GameState } from '../../../types/gameState';
import { WorldGraph } from '../../graph';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';

// ─── Minimal game state factory ────────────────────────────────────────────

function makeGraph(agentId: string, name: string, gender?: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: agentId,
    type: 'actor',
    name,
    properties: { gender: gender ?? 'neutral', archetypeId: 'witness' },
  });
  return graph;
}

function makeState(agentId: string, name: string, gender?: string): GameState {
  return {
    graph: makeGraph(agentId, name, gender),
    intelligenceRecords: [],
    unifiedActions: [],
    tick: 10,
  } as unknown as GameState;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('resolveForeshadowingPlaceholders', () => {
  it('replaces {name.first} with first word of agent name', () => {
    const result = resolveForeshadowingPlaceholders(
      'Hello, {name.first}.',
      'Kael Thornweaver',
      'Plague Outbreak',
      'he',
    );
    expect(result).toBe('Hello, Kael.');
  });

  it('replaces {encounter.heading}', () => {
    const result = resolveForeshadowingPlaceholders(
      'Trouble in {encounter.heading}.',
      'Kael',
      'Plague Outbreak',
      'he',
    );
    expect(result).toBe('Trouble in Plague Outbreak.');
  });

  it('replaces {pronoun.subject} and {pronoun.subject_capitalized}', () => {
    const result = resolveForeshadowingPlaceholders(
      '{pronoun.subject_capitalized} believes {pronoun.subject} can help.',
      'Mira',
      'Guild Audition',
      'she',
    );
    expect(result).toBe('She believes she can help.');
  });

  it('uses they/them as default pronoun capitalization', () => {
    const result = resolveForeshadowingPlaceholders(
      '{pronoun.subject_capitalized} steps forward.',
      'River',
      'Market Day',
      'they',
    );
    expect(result).toBe('They steps forward.');
  });

  it('handles single-word agent names', () => {
    const result = resolveForeshadowingPlaceholders(
      '{name.first} arrives.',
      'Mira',
      'Shrine Pilgrimage',
      'she',
    );
    expect(result).toBe('Mira arrives.');
  });
});

describe('attributeRecentInterventions (Phase 1 stub)', () => {
  it('returns null — full attribution deferred to Phase 3', () => {
    const state = makeState('agent-1', 'Kael');
    const result = attributeRecentInterventions(state, 'agent-1', 'encounter.plague_outbreak', 10);
    expect(result).toBeNull();
  });
});

describe('getEncounterForeshadowing', () => {
  let runtime: SimulationRuntime;

  beforeEach(() => {
    runtime = createSimulationRuntime();
    disableTracing();
    clearTraces();
  });

  it('returns prose for a known agent (selects most-specific variant for plague_outbreak)', () => {
    const state = makeState('agent-1', 'Kael Thornweaver', 'male');
    const result = getEncounterForeshadowing(state, 'agent-1', 'encounter.plague_outbreak', 10, runtime);

    expect(result.prose).toContain('Kael');
    // plague_outbreak Phase-1 signals: intelligenceTier:'unknown', topMotive:'awareness', dominantReach:'eye'
    // healer_curiosity (2 conditions: topMotive+dominantReach) wins over unknown (1 condition)
    expect(result.variantId).toBe('plague_outbreak.healer_curiosity');
    expect(result.interventionAttribution).toBeNull();
    expect(result.resolvedAtTick).toBe(10);
  });

  it('uses the agent first name in prose', () => {
    const state = makeState('agent-2', 'Serafina Valdris', 'female');
    const result = getEncounterForeshadowing(state, 'agent-2', 'encounter.plague_outbreak', 5, runtime);

    expect(result.prose).toContain('Serafina');
    expect(result.prose).not.toContain('Valdris');
  });

  it('falls back gracefully when agent node is missing', () => {
    const graph = new WorldGraph();
    const state = { graph, intelligenceRecords: [], unifiedActions: [], tick: 0 } as unknown as GameState;

    const result = getEncounterForeshadowing(state, 'missing-agent', 'encounter.plague_outbreak', 0, runtime);
    // Should not throw — prose may be generic but must be a string
    expect(typeof result.prose).toBe('string');
    expect(result.prose.length).toBeGreaterThan(0);
  });

  describe('cache', () => {
    it('returns the same result on the second call (cache hit)', () => {
      const state = makeState('agent-3', 'Dorn');
      const r1 = getEncounterForeshadowing(state, 'agent-3', 'encounter.plague_outbreak', 1, runtime);
      const r2 = getEncounterForeshadowing(state, 'agent-3', 'encounter.plague_outbreak', 2, runtime);

      // Same object reference — served from cache
      expect(r1).toBe(r2);
      expect(r2.resolvedAtTick).toBe(1); // tick from first resolution
    });

    it('resolves afresh for a different agent', () => {
      const state1 = makeState('agent-a', 'Alpha');
      const state2 = makeState('agent-b', 'Beta');
      const r1 = getEncounterForeshadowing(state1, 'agent-a', 'encounter.plague_outbreak', 1, runtime);
      const r2 = getEncounterForeshadowing(state2, 'agent-b', 'encounter.plague_outbreak', 1, runtime);

      expect(r1).not.toBe(r2);
      expect(r1.prose).toContain('Alpha');
      expect(r2.prose).toContain('Beta');
    });

    it('resolves afresh for a different encounter', () => {
      const state = makeState('agent-4', 'Mira');
      const r1 = getEncounterForeshadowing(state, 'agent-4', 'encounter.plague_outbreak', 1, runtime);
      const r2 = getEncounterForeshadowing(state, 'agent-4', 'encounter.guild_audition', 1, runtime);

      expect(r1).not.toBe(r2);
    });

    it('cache is cleared by foreshadowingCache.clear()', () => {
      const state = makeState('agent-5', 'Tomas');
      const r1 = getEncounterForeshadowing(state, 'agent-5', 'encounter.plague_outbreak', 1, runtime);
      runtime.foreshadowingCache.clear();
      const r2 = getEncounterForeshadowing(state, 'agent-5', 'encounter.plague_outbreak', 2, runtime);

      // Different object after cache clear
      expect(r1).not.toBe(r2);
      expect(r2.resolvedAtTick).toBe(2);
    });
  });

  describe('tracing', () => {
    beforeEach(() => {
      enableTracing();
    });

    it('emits a foreshadowing trace on first resolution', () => {
      const state = makeState('agent-t', 'Trace');
      getEncounterForeshadowing(state, 'agent-t', 'encounter.plague_outbreak', 7, runtime);

      const traces = getTraces().filter(t => t.category === 'foreshadowing');
      expect(traces.length).toBeGreaterThanOrEqual(1);

      const trace = traces[0] as { cacheHit: boolean; agentId: string };
      expect(trace.cacheHit).toBe(false);
      expect(trace.agentId).toBe('agent-t');
    });

    it('emits a cache-hit trace on second call', () => {
      const state = makeState('agent-tc', 'TraceCached');
      getEncounterForeshadowing(state, 'agent-tc', 'encounter.plague_outbreak', 3, runtime);
      clearTraces();
      getEncounterForeshadowing(state, 'agent-tc', 'encounter.plague_outbreak', 4, runtime);

      const traces = getTraces().filter(t => t.category === 'foreshadowing');
      expect(traces.length).toBeGreaterThanOrEqual(1);
      const trace = traces[0] as { cacheHit: boolean };
      expect(trace.cacheHit).toBe(true);
    });
  });

  describe('signals', () => {
    it('defaults to unknown intelligence tier and awareness motive in Phase 1', () => {
      const state = makeState('agent-s', 'Signals');
      const result = getEncounterForeshadowing(state, 'agent-s', 'encounter.plague_outbreak', 1, runtime);

      expect(result.signals.intelligenceTier).toBe('unknown');
      expect(result.signals.topMotive).toBe('awareness');
      expect(typeof result.signals.dominantReach).toBe('string');
    });
  });
});

describe('GENERIC_FORESHADOWING_FALLBACK template', () => {
  it('contains all required placeholder tokens', () => {
    expect(GENERIC_FORESHADOWING_FALLBACK).toContain('{name.first}');
    expect(GENERIC_FORESHADOWING_FALLBACK).toContain('{encounter.heading}');
    expect(GENERIC_FORESHADOWING_FALLBACK).toContain('{pronoun.subject}');
    expect(GENERIC_FORESHADOWING_FALLBACK).toContain('{pronoun.subject_capitalized}');
  });
});
