/**
 * Tests for the Ruins Layer clue lifecycle (THR-150).
 *
 * Covers:
 *   - selectClueRecipient: Kael/Mira 1000-trial worked example (design doc §2.2)
 *   - selectClueRecipient: saga tier floor suppresses background candidates
 *   - phaseClueDecay: TTL expiry pruning
 *   - phaseClueDecay: no-op on non-interval ticks
 *   - findAnyRuinId: returns null with no ruins, returns ID when ruins present
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import { mulberry32 } from '../../../lib/prng';
import type { EncounterProgress } from '../../../types/encounter';
import type { KnowsClueOfEdgeProperties } from '../../../types/knowledge';
import type { GameState } from '../../../types/gameState';
import {
  selectClueRecipient,
  phaseClueDecay,
  findAnyRuinId,
} from '../clueLifecycle';

// ─── Graph builders ──────────────────────────────────────────────────────────

/**
 * Build the Kael/Mira worked example graph from design doc §2.2.
 *
 * Kael Thornweaver: shaping, bonded, portfolio-pinned, guild senior (no leader bonus),
 *   spirit sphere, thanate exile culture tie → score 192.0
 * Mira Voss: story_beat, not bonded, not pinned, guild master (leader bonus 2.5),
 *   order sphere, no culture tie → score 14.0
 */
function buildWorkedExampleGraph(): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'ascendant-god',
    type: 'actor',
    name: 'The God',
    properties: { actorType: 'ascendant' },
  });

  graph.addNode({
    id: 'kael',
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: {
      actorType: 'individual',
      isPortfolioPinned: true,
      primarySphere: 'spirit',
      originCultureId: 'culture-thanate',
    },
  });

  graph.addNode({
    id: 'mira',
    type: 'actor',
    name: 'Mira Voss',
    properties: {
      actorType: 'individual',
      primarySphere: 'order',
    },
  });

  graph.addNode({
    id: 'faction-guild',
    type: 'actor',
    name: 'The Guild',
    properties: { actorType: 'faction' },
  });

  graph.addNode({
    id: 'ruin-veil-well',
    type: 'location',
    name: 'The Veil-Well',
    properties: {
      ruinMagnitude: 0.78,
      sphereAlignment: 'darkness',
      originCultureId: 'culture-thanate',
    },
  });

  // Kael is bonded to the god
  graph.addEdge({
    id: 'thread-god-kael',
    source: 'ascendant-god',
    target: 'kael',
    type: 'thread',
    properties: { strength: 1.0 },
  });

  // Mira is guild master (reputation >= FACTION_LEADER_MIN_REPUTATION = 0.75)
  graph.addEdge({
    id: 'member-mira-guild',
    source: 'mira',
    target: 'faction-guild',
    type: 'member_of',
    properties: { reputation: 0.9, role: 'master', rank: 'master', joinedTick: 0 },
  });

  return graph;
}

function buildWorkedExampleEncounterProgress(): EncounterProgress[] {
  return [
    {
      encounterId: 'enc-kael-1',
      actorId: 'kael',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 90,
      effectiveTier: 'shaping',
    },
    {
      encounterId: 'enc-mira-1',
      actorId: 'mira',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 90,
      effectiveTier: 'story_beat',
    },
  ];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('selectClueRecipient', () => {
  it('Kael/Mira worked example: Kael wins ~93% over 1000 trials', () => {
    const graph = buildWorkedExampleGraph();
    const encounterProgress = buildWorkedExampleEncounterProgress();

    let kaelWins = 0;
    let miraWins = 0;

    // Use a different RNG seed per trial by advancing a master seed
    let masterSeed = 0xdeadbeef;
    const masterRng = mulberry32(masterSeed);

    for (let trial = 0; trial < 1000; trial++) {
      const trialSeed = (masterRng() * 0xffffffff) >>> 0;
      const trialRng = mulberry32(trialSeed);

      const result = selectClueRecipient({
        candidatePool: ['kael', 'mira'],
        ruinMagnitude: 0.78,
        ruinSphereAlignment: 'darkness',
        ruinOriginCultureId: 'culture-thanate',
        ascendantId: 'ascendant-god',
        tick: 100,
        graph,
        encounterProgress,
        rng: trialRng,
      });

      expect(result.selectedAgentId).not.toBeNull();
      if (result.selectedAgentId === 'kael') kaelWins++;
      else if (result.selectedAgentId === 'mira') miraWins++;
    }

    // Kael's expected win rate: 192 / (192 + 14) ≈ 0.932
    // Allow ±6% tolerance (well outside 5σ of binomial variance)
    expect(kaelWins + miraWins).toBe(1000);
    expect(kaelWins / 1000).toBeGreaterThan(0.87);
    expect(kaelWins / 1000).toBeLessThan(0.97);
    expect(miraWins / 1000).toBeGreaterThan(0.03);
    expect(miraWins / 1000).toBeLessThan(0.13);
  });

  it('Kael/Mira worked example: scores match design doc exactly', () => {
    const graph = buildWorkedExampleGraph();
    const encounterProgress = buildWorkedExampleEncounterProgress();

    // Use an RNG that always returns 0 so the first candidate in topN wins — this
    // lets us inspect the score breakdown without randomness affecting selection.
    const deterministicRng = () => 0;

    const result = selectClueRecipient({
      candidatePool: ['kael', 'mira'],
      ruinMagnitude: 0.78,
      ruinSphereAlignment: 'darkness',
      ruinOriginCultureId: 'culture-thanate',
      ascendantId: 'ascendant-god',
      tick: 100,
      graph,
      encounterProgress,
      rng: deterministicRng,
    });

    expect(result.scores).toHaveLength(2);

    const kaelScore = result.scores.find(s => s.knowerId === 'kael');
    const miraScore = result.scores.find(s => s.knowerId === 'mira');

    expect(kaelScore).toBeDefined();
    expect(miraScore).toBeDefined();

    expect(kaelScore!.finalScore).toBeCloseTo(192.0, 5);
    expect(miraScore!.finalScore).toBeCloseTo(14.0, 5);
  });

  it('suppresses all candidates when none meet saga tier floor', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'god', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'bg-agent', type: 'actor', name: 'Background Agent', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'ruin-saga', type: 'location', name: 'Saga Ruin', properties: { ruinMagnitude: 0.9 } });

    // background-tier encounter progress
    const ep: EncounterProgress[] = [{
      encounterId: 'enc-1',
      actorId: 'bg-agent',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 0,
      effectiveTier: 'background',
    }];

    const result = selectClueRecipient({
      candidatePool: ['bg-agent'],
      ruinMagnitude: 0.9,
      ruinSphereAlignment: '',
      ruinOriginCultureId: '',
      ascendantId: 'god',
      tick: 10,
      graph,
      encounterProgress: ep,
      rng: mulberry32(1),
    });

    expect(result.selectedAgentId).toBeNull();
    expect(result.suppressedReason).toBe('no_candidates_meet_tier_floor');
  });

  it('selects the single eligible candidate without randomness issues', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'god', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'agent-a', type: 'actor', name: 'Agent A', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'ruin-r', type: 'location', name: 'Ruin', properties: { ruinMagnitude: 0.1 } });

    const ep: EncounterProgress[] = [{
      encounterId: 'enc-a',
      actorId: 'agent-a',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 0,
      effectiveTier: 'background',
    }];

    const result = selectClueRecipient({
      candidatePool: ['agent-a'],
      ruinMagnitude: 0.1,
      ruinSphereAlignment: '',
      ruinOriginCultureId: '',
      ascendantId: 'god',
      tick: 10,
      graph,
      encounterProgress: ep,
      rng: mulberry32(99),
    });

    expect(result.selectedAgentId).toBe('agent-a');
  });
});

// ─── phaseClueDecay ──────────────────────────────────────────────────────────

describe('phaseClueDecay', () => {
  function buildMinimalState(graph: WorldGraph, tick: number): GameState {
    return {
      graph,
      tick,
      seed: 42,
      tickEvents: [],
      recentEvents: [],
      encounterProgress: [],
      unifiedActions: [],
      pendingEncounterSeeds: [],
      hiddenMarks: [],
      intelligenceRecords: [],
      emittedOmens: [],
      clearanceGateStates: undefined,
    } as unknown as GameState;
  }

  it('removes expired vague clue after CLUE_MAX_AGE_TICKS_VAGUE (20) ticks', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'knower', type: 'actor', name: 'Knower', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'ruin', type: 'location', name: 'Ruin', properties: { ruinMagnitude: 0.1 } });

    const discoveredTick = 0;
    const clueProps: KnowsClueOfEdgeProperties = {
      magnitude: 0.3,
      precision: 'vague',
      source: 'tavern_rumor',
      discoveredTick,
      consumed: false,
    };

    graph.addEdge({
      id: 'clue-edge-1',
      source: 'knower',
      target: 'ruin',
      type: 'knows_clue_of',
      properties: clueProps,
    });

    // tick 20 = age exactly 20, max is 20 — not expired yet (age > maxAge, not >=)
    const state20 = buildMinimalState(graph, 20);
    phaseClueDecay(state20);
    expect(graph.getEdge('clue-edge-1')).toBeDefined();

    // tick 30 (age = 30, runs on CLUE_DECAY_CHECK_INTERVAL = 10) — expired
    const state30 = buildMinimalState(graph, 30);
    phaseClueDecay(state30);
    expect(graph.getEdge('clue-edge-1')).toBeUndefined();
  });

  it('does not run on non-interval ticks', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'knower', type: 'actor', name: 'Knower', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'ruin', type: 'location', name: 'Ruin', properties: { ruinMagnitude: 0.1 } });

    const clueProps: KnowsClueOfEdgeProperties = {
      magnitude: 0.3,
      precision: 'vague',
      source: 'tavern_rumor',
      discoveredTick: 0,
      consumed: false,
    };
    graph.addEdge({ id: 'clue-noop', source: 'knower', target: 'ruin', type: 'knows_clue_of', properties: clueProps });

    // tick 5 is not a multiple of CLUE_DECAY_CHECK_INTERVAL (10)
    phaseClueDecay(buildMinimalState(graph, 5));
    expect(graph.getEdge('clue-noop')).toBeDefined();

    // tick 7 — not multiple of 10
    phaseClueDecay(buildMinimalState(graph, 7));
    expect(graph.getEdge('clue-noop')).toBeDefined();
  });

  it('removes consumed clue edges as housekeeping', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'knower', type: 'actor', name: 'Knower', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'ruin', type: 'location', name: 'Ruin', properties: { ruinMagnitude: 0.1 } });

    const clueProps: KnowsClueOfEdgeProperties = {
      magnitude: 0.3,
      precision: 'narrowed',
      source: 'library_research',
      discoveredTick: 0,
      consumed: true,
      consumedTick: 5,
    };
    graph.addEdge({ id: 'clue-consumed', source: 'knower', target: 'ruin', type: 'knows_clue_of', properties: clueProps });

    phaseClueDecay(buildMinimalState(graph, 10));
    expect(graph.getEdge('clue-consumed')).toBeUndefined();
  });

  it('preserves fresh clues within their TTL', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'knower', type: 'actor', name: 'Knower', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'ruin', type: 'location', name: 'Ruin', properties: { ruinMagnitude: 0.1 } });

    graph.addEdge({
      id: 'fresh-located',
      source: 'knower',
      target: 'ruin',
      type: 'knows_clue_of',
      properties: {
        magnitude: 0.8,
        precision: 'located',
        source: 'spy_debrief',
        discoveredTick: 50,
        consumed: false,
      } satisfies KnowsClueOfEdgeProperties,
    });

    // tick 60, discoveredTick 50 → age 10, max for 'located' = 80
    phaseClueDecay(buildMinimalState(graph, 60));
    expect(graph.getEdge('fresh-located')).toBeDefined();
  });
});

// ─── findAnyRuinId ───────────────────────────────────────────────────────────

describe('findAnyRuinId', () => {
  it('returns null when no ruins exist in graph', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });
    expect(findAnyRuinId(graph)).toBeNull();
  });

  it('returns the ruin node ID when one exists', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'ruin-1',
      type: 'location',
      name: 'Ancient Ruin',
      properties: { ruinMagnitude: 0.5 },
    });
    expect(findAnyRuinId(graph)).toBe('ruin-1');
  });

  it('picks from multiple ruins when rng is provided', () => {
    const graph = new WorldGraph();
    for (let i = 0; i < 5; i++) {
      graph.addNode({
        id: `ruin-${i}`,
        type: 'location',
        name: `Ruin ${i}`,
        properties: { ruinMagnitude: 0.1 + i * 0.1 },
      });
    }
    // Over multiple RNG values, we should hit different ruins
    const results = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const result = findAnyRuinId(graph, mulberry32(seed));
      if (result) results.add(result);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
