/**
 * Mark Reveal Liveness Contract Test (THR-112)
 *
 * Verifies the hidden mark revelation loop is live end-to-end:
 *   place mark → run ticks → hidden_mark_revealed trace fires (decay OR encounter-based)
 *
 * The simplest verifiable path is decay: a mark placed far enough before the
 * current tick will decay to the floor and emit hidden_mark_revealed within
 * MARK_DECAY_GRACE_TICKS + ~50 ticks. This tests the full loop without
 * requiring the player to choose an encounter reaction (which is UI-driven).
 *
 * A second test verifies scoring: a marked agent scores investigation encounters
 * higher than an unmarked agent.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { seedWorld } from '../../worldSeed';
import { createAscendant } from '../../ascendant';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { generateRivals, createRivalState } from '../../rival';
import { generateDoomClock, createDoomClockState } from '../../doomClock';
import { recalcVisibility, collectLOSSources } from '../../visibility';
import { createGreatChronicle } from '../../chronicle';
import { createDefaultFundament, createResonanceState } from '../../worldSoul';
import { clearTraces, enableTracing, getTraces } from '../../traceBuffer';
import { MARK_DECAY_GRACE_TICKS, MARK_DECAY_FLOOR, evaluateMarkReveals } from '../../hiddenMarks';
import { scoreAndSelect } from '../../encounterScoring';
import { MARK_REVEAL_SCORING_BONUS } from '../../../data/agent-behavior-constants';
import type { GameState } from '../../../types/gameState';
import type { HiddenMark } from '../../../types/unifiedAction';
import type { CosmologyProfile } from '../../../types/index';
import { SPHERE_NAMES } from '../../../types/index';
import type { EncounterCacheEntry } from '../../encounterCache';
import type { ReachDomain } from '../../../types/traits';
import { WorldGraph } from '../../graph';

// ─── Shared helpers ───────────────────────────────────────────────

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function emptyEssencePool() {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool as Record<(typeof SPHERE_NAMES)[number], number>;
}

function mockTiles() {
  const tiles = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland' as const,
      });
    }
  }
  return tiles;
}

function createBaseGameState(seed: number, startTick = 1): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();
  const { graph } = seedWorld(cosmology, tiles, seed);

  graph.addNode({ id: 'loc.start', type: 'location', name: 'Sacred Grove', properties: { locationSubtype: 'town' } });

  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test',
      name: 'The Watcher Divine',
      title: 'The Watcher',
      description: 'Test archetype',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      startingDomainAffinities: { iron: 2, gold: 1 },
      personalitySeed: {
        loyalty_ambition: 0.1, courage_prudence: 0.2, mercy_ruthlessness: -0.3,
        honesty_cunning: 0.0, sacrifice_survival: 0.4, tradition_novelty: 0.1,
        preservation_transformation: -0.2, asceticism_extravagance: 0.3,
      },
      flavorText: 'A test archetype',
    },
    avatar: { name: 'TestAvatar', startLocationId: 'loc.start', formDescription: 'A test avatar' },
  });

  const rivals = generateRivals(cosmology, seed);
  const rivalStates = rivals.map(r => createRivalState(r.id));
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomClock = createDoomClockState('breach', 360);
  const losSources = collectLOSSources(graph, ascendantId, []);
  const gridSize = { cols: 5, rows: 5 };
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, startTick, gridSize.cols, gridSize.rows);

  return {
    cycle: 1,
    tick: startTick,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: startTick, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivals,
    rivalStates,
    doomDefinition: doomDef,
    doomClock,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap,
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    familiarityMap: new Map(),
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
      currentCycle: 1,
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
    hiddenMarks: [],
  };
}

beforeEach(() => {
  resetDecisionCache();
  resetEventCounter();
  enableTracing();
  clearTraces();
});

// ─── Decay liveness ───────────────────────────────────────────────

describe('Mark reveal liveness: decay path', () => {
  it(
    'a placed mark emits hidden_mark_revealed (decay variant) within 100 ticks',
    { timeout: 120_000 },
    () => {
      // Start at a tick after grace period so decay begins immediately
      const startTick = MARK_DECAY_GRACE_TICKS + 1;
      let state = createBaseGameState(42, startTick);

      // Plant a mark with severity just above floor so it decays within a few ticks
      const markSeverity = MARK_DECAY_FLOOR * 2.0;
      const testMark: HiddenMark = {
        markId: 'liveness-mark-001',
        category: 'betrayal',
        severity: markSeverity,
        label: 'Test betrayal mark',
        sourceEncounterId: 'test.encounter',
        placedTick: 0, // placed very early → age well past grace
        targetAgentId: 'agent-nonexistent-ok-for-decay', // decay doesn't need a real agent
        revealFamilies: ['investigation'],
      };
      state = { ...state, hiddenMarks: [testMark] };

      // Run ticks — decay should remove the mark within ~50 ticks
      for (let i = 0; i < 100; i++) {
        state = runTick(state);
        const revealTrace = getTraces().find(
          t => t.category === 'hidden_mark_revealed' && (t as any).markId === 'liveness-mark-001',
        );
        if (revealTrace) {
          expect((revealTrace as any).revealedBy).toBe('decay:severity_floor');
          return; // Test passed
        }
      }

      // If we reach here, no reveal trace was emitted
      expect.fail('No hidden_mark_revealed trace was emitted within 100 ticks');
    },
  );

  it('mark placed within grace period is NOT removed on the first decay tick', () => {
    let state = createBaseGameState(42, 1);
    const testMark: HiddenMark = {
      markId: 'grace-mark-001',
      category: 'betrayal',
      severity: 0.5,
      label: 'Mark within grace',
      sourceEncounterId: 'test.encounter',
      placedTick: 1, // placed at tick 1 — grace lasts until tick 1+MARK_DECAY_GRACE_TICKS
      targetAgentId: 'agent-nonexistent',
      revealFamilies: ['investigation'],
    };
    state = { ...state, hiddenMarks: [testMark] };

    // Run for grace period - 1 ticks — mark should still be present
    for (let i = 0; i < MARK_DECAY_GRACE_TICKS - 1; i++) {
      state = runTick(state);
    }

    const traceBeforeGraceExpires = getTraces().filter(t => t.category === 'hidden_mark_revealed');
    expect(traceBeforeGraceExpires).toHaveLength(0);
    expect(state.hiddenMarks?.some(m => m.markId === 'grace-mark-001')).toBe(true);
  });
});

// ─── Scoring boost ────────────────────────────────────────────────

describe('Mark reveal scoring: matching encounters score higher', () => {
  it('investigation encounter scores higher when agent carries an investigation-family mark', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-a', type: 'location', name: 'Loc A', properties: { locationType: 'settlement', hexCol: 0, hexRow: 0 } });
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Agent', properties: { actorType: 'individual', locationId: 'loc-a' } });

    const investigationCandidate: EncounterCacheEntry = {
      templateId: 'investigation.witness_account',
      locationId: 'loc-a',
      sublocationId: null,
      sublocationTypeId: null,
      reachPrimary: 'iron' as ReachDomain,
      reachSecondary: 'gold' as ReachDomain,
      threatRating: 'moderate' as any,
      encounterType: 'exploration' as any,
      motivations: [],
      requiresPresence: true,
      remotePenalty: 0,
      questPriority: 1.0,
      totalTickCost: 3,
      successRewardEstimate: 2.0,
      stepCount: 1,
      stepDifficulties: [0.5],
      stepReaches: ['iron'] as ReachDomain[],
    };

    const agentMark: HiddenMark = {
      markId: 'scoring-mark-001',
      category: 'betrayal',
      severity: 1.0,
      label: 'Betrayed guild',
      sourceEncounterId: 'broker.quest',
      placedTick: 0,
      targetAgentId: 'agent-1',
      revealFamilies: ['investigation'],
    };

    const withoutMarks = scoreAndSelect([investigationCandidate], 'agent-1', 'loc-a', graph, 10);
    const withMarks = scoreAndSelect([investigationCandidate], 'agent-1', 'loc-a', graph, 10, undefined, undefined, undefined, undefined, [agentMark]);

    const scoreDiff = withMarks.rankedCandidates[0].finalScore - withoutMarks.rankedCandidates[0].finalScore;
    expect(scoreDiff).toBeCloseTo(MARK_REVEAL_SCORING_BONUS * 1.0); // severity=1.0
    expect(withMarks.rankedCandidates[0].markRevealBonus).toBeCloseTo(MARK_REVEAL_SCORING_BONUS);
    expect(withoutMarks.rankedCandidates[0].markRevealBonus).toBe(0);
  });

  it('non-matching encounter is not boosted by mark', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-a', type: 'location', name: 'Loc A', properties: { locationType: 'settlement', hexCol: 0, hexRow: 0 } });
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Agent', properties: { actorType: 'individual', locationId: 'loc-a' } });

    const shadowCandidate: EncounterCacheEntry = {
      templateId: 'shadow.infiltrate',
      locationId: 'loc-a',
      sublocationId: null,
      sublocationTypeId: null,
      reachPrimary: 'iron' as ReachDomain,
      reachSecondary: 'gold' as ReachDomain,
      threatRating: 'moderate' as any,
      encounterType: 'exploration' as any,
      motivations: [],
      requiresPresence: true,
      remotePenalty: 0,
      questPriority: 1.0,
      totalTickCost: 3,
      successRewardEstimate: 2.0,
      stepCount: 1,
      stepDifficulties: [0.5],
      stepReaches: ['iron'] as ReachDomain[],
    };

    const agentMark: HiddenMark = {
      markId: 'scoring-mark-002',
      category: 'betrayal',
      severity: 1.0,
      label: 'Betrayed guild',
      sourceEncounterId: 'broker.quest',
      placedTick: 0,
      targetAgentId: 'agent-1',
      revealFamilies: ['investigation'],
    };

    const withMarks = scoreAndSelect([shadowCandidate], 'agent-1', 'loc-a', graph, 10, undefined, undefined, undefined, undefined, [agentMark]);
    expect(withMarks.rankedCandidates[0].markRevealBonus).toBe(0);
  });
});
