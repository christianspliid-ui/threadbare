/**
 * THR-551: Veil / Rend the Gate — per-tick rift behavior in phaseControlEffects.
 *
 * Covers the two new ControlEffect fields:
 *  - `perTickSphereInfluence`: pushes scaled sphere pressure onto the target node
 *    each tick, up to a cap (additive to the generic CONTROL_PRESSURE_PER_TICK).
 *  - `perTickLeak`: a seeded per-tick chaos-pulse roll (hex corruption + entropy
 *    pressure + trace + tick event) that is deterministic and replayable.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { phaseControlEffects, RIFT_LEAK_SEED_OFFSET } from '../phaseControlEffects';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { mulberry32 } from '../../lib/prng';
import { hashString } from '../factionAmbitions';
import type { GameState } from '../../types/gameState';
import type { ControlEffect } from '../../types/controlEffect';
import type { EssencePool } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

function pool(): EssencePool {
  const p = {} as EssencePool;
  for (const s of SPHERE_NAMES) p[s] = 50;
  return p;
}

function buildGraph(locScore = 0): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc_1', type: 'actor', name: 'Veil', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc-rift', type: 'location', name: 'Riftmouth',
    properties: {
      hexCol: 3, hexRow: 5,
      sphereAffinity: { scores: { entropy: locScore }, progress: {} },
    },
  });
  return graph;
}

function makeRift(overrides: Partial<ControlEffect> = {}): ControlEffect {
  return {
    effectId: 'rift_eff_1',
    templateId: 'enc.rift',
    ownerId: 'asc_1',
    targetHexCol: 3,
    targetHexRow: 5,
    targetNodeId: 'loc-rift',
    establishedTick: 10,
    ritualEssenceInvested: 0,
    perTickCost: { entropy: 0.8 },
    perTickMutations: [],
    perTickGraphOps: [],
    perTickSphereInfluence: { sphere: 'entropy', magnitude: 4, cap: 10 },
    perTickLeak: { chance: 0, corruption: 6, entropyPressure: 2 },
    active: true,
    ticksActive: 0,
    narrativeTemplates: { established: 'open', active: 'thrum', lapsed: 'seal' },
    ...overrides,
  };
}

function makeState(graph: WorldGraph, effects: ControlEffect[], overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 20, seed: 42, cycle: 1, phase: 'playing', graph,
    essencePool: pool(), controlEffects: effects,
    tiles: [{ coord: { col: 3, row: 5 }, terrain: 'grassland', divineInfluence: 0.5, corruption: 0.1, biome: 'temperate' } as never],
    tickEvents: [], pendingHexMutations: [], pendingSpherePressures: [],
    cosmology: {} as never, clock: {} as never,
    ascendantId: 'asc_1', mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [], doomDefinition: {} as never, doomClock: {} as never,
    recentEvents: [], chronicleEntries: [], stealthExposure: 0,
    visibilityMap: {} as never, familiarityMap: {} as never, culturalInsightMap: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [], chronicle: {} as never,
    ...overrides,
  } as GameState;
}

describe('phaseControlEffects — rift (THR-551)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  describe('perTickSphereInfluence', () => {
    it('pushes scaled sphere pressure onto the target node while below the cap', () => {
      const state = makeState(buildGraph(0), [makeRift()]);
      const result = phaseControlEffects(state);
      const infl = (result.pendingSpherePressures ?? []).find(
        p => p.sourceId === 'rift_eff_1' && p.sphere === 'entropy' && p.magnitude === 4,
      );
      expect(infl).toBeDefined();
      expect(infl!.targetEntityId).toBe('loc-rift');
      expect(infl!.source).toBe('control_effect');
    });

    it('stops amplifying once the node score reaches the cap', () => {
      // score already at cap → no influence pressure (magnitude 4) pushed.
      const state = makeState(buildGraph(10), [makeRift({ perTickSphereInfluence: { sphere: 'entropy', magnitude: 4, cap: 10 } })]);
      const result = phaseControlEffects(state);
      const infl = (result.pendingSpherePressures ?? []).find(p => p.sourceId === 'rift_eff_1' && p.magnitude === 4);
      expect(infl).toBeUndefined();
      // The generic per-cost pressure (magnitude 1) still fires — influence is additive.
      const generic = (result.pendingSpherePressures ?? []).find(p => p.sourceId === 'rift_eff_1' && p.magnitude === 1);
      expect(generic).toBeDefined();
    });
  });

  describe('perTickLeak', () => {
    it('does not leak when chance is 0', () => {
      const state = makeState(buildGraph(0), [makeRift({ perTickLeak: { chance: 0, corruption: 6, entropyPressure: 2 } })]);
      const result = phaseControlEffects(state);
      const corruption = (result.pendingHexMutations ?? []).find(m => m.source.startsWith('rift_leak:'));
      expect(corruption).toBeUndefined();
      expect(getTraces().find(t => t.category === 'ascendant.signature.rift_leak')).toBeUndefined();
    });

    it('leaks a chaos pulse when chance is 1: corruption mutation + entropy pressure + trace + event', () => {
      const state = makeState(buildGraph(0), [makeRift({ perTickLeak: { chance: 1, corruption: 6, entropyPressure: 2 } })]);
      const result = phaseControlEffects(state);

      const corruption = (result.pendingHexMutations ?? []).find(m => m.source === 'rift_leak:rift_eff_1');
      expect(corruption).toBeDefined();
      expect(corruption!.field).toBe('corruption');
      expect(corruption!.delta).toBe(6);
      expect(corruption!.col).toBe(3);
      expect(corruption!.row).toBe(5);

      const entropy = (result.pendingSpherePressures ?? []).find(p => p.sourceId === 'rift_eff_1' && p.sphere === 'entropy' && p.magnitude === 2);
      expect(entropy).toBeDefined();

      const trace = getTraces().find(t => t.category === 'ascendant.signature.rift_leak');
      expect(trace).toBeDefined();

      const event = (result.tickEvents ?? []).find(e => e.message.includes('chaos pulse'));
      expect(event).toBeDefined();
    });

    it('is deterministic: same seed+tick+effectId → identical leak outcome', () => {
      // Pick a chance just above the known roll so the boundary is genuinely exercised.
      const expectedRoll = mulberry32(42 + 20 * RIFT_LEAK_SEED_OFFSET + hashString('rift_eff_1'))();
      const chanceJustAbove = Math.min(1, expectedRoll + 0.001);
      const chanceJustBelow = Math.max(0, expectedRoll - 0.001);

      const above = phaseControlEffects(makeState(buildGraph(0), [makeRift({ perTickLeak: { chance: chanceJustAbove, corruption: 6, entropyPressure: 2 } })]));
      expect((above.pendingHexMutations ?? []).some(m => m.source === 'rift_leak:rift_eff_1')).toBe(true);

      clearTraces();
      const below = phaseControlEffects(makeState(buildGraph(0), [makeRift({ perTickLeak: { chance: chanceJustBelow, corruption: 6, entropyPressure: 2 } })]));
      expect((below.pendingHexMutations ?? []).some(m => m.source === 'rift_leak:rift_eff_1')).toBe(false);
    });
  });
});
