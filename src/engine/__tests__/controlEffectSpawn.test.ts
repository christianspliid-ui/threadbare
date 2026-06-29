/**
 * Tests for controlEffectSpawn — TB-044 ControlEffect spawning from sustained actions.
 *
 * Covers:
 * - spawnControlEffect creates valid ControlEffect from sustained action
 * - Returns null for instant actions, missing controlSpec, non-hex targets
 * - Contract test: spawned effect is valid input for phaseControlEffects
 * - Integration: phaseUnifiedActionProgress spawns ControlEffect on sustained success
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { spawnControlEffect, resetEffectCounter } from '../controlEffectSpawn';
import { phaseControlEffects } from '../phaseControlEffects';
import { phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { ControlEffect } from '../../types/controlEffect';
import type { GameState } from '../../types/gameState';
import type { EssencePool } from '../../types/influence';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const successRng = () => 0.01;

function createEmptyPool(): EssencePool {
  const pool = {} as EssencePool;
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool;
}

function makeSustainedTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'action.control.bless-sustain',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Sustain Blessing',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'gold',
      duration: { min: 2, max: 2 },
      difficulty: 0, // divine — always succeeds
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 3,
    sphereAffinity: 'force',
    actorAffinities: ['ascendant'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'You extend your divine will...',
      success: 'Your presence takes hold.',
      failure: 'The blessing fades.',
    },
    durationMode: 'sustained',
    controlSpec: {
      perTickCost: { force: 0.5 },
      perTickIncome: { force: 0.1 },
      perTickMutations: [{ field: 'divineInfluence', delta: 0.2, source: 'bless-sustain' }],
      narrativeTemplates: {
        established: 'A divine blessing blankets this land.',
        active: 'The blessing persists.',
        lapsed: 'The blessing fades away.',
      },
    },
    ...overrides,
  };
}

function makeInstantTemplate(): UnifiedActionTemplate {
  return {
    id: 'action.instant.test',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Instant Action',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'begins',
      success: 'succeeds',
      failure: 'fails',
    },
  };
}

function makeResolvedAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_1',
    actorId: 'asc-1',
    templateId: 'action.control.bless-sustain',
    targetId: 'hex_5_3',
    scale: 'local',
    source: 'player',
    startTick: 8,
    currentStep: 0,
    stepProgress: 2,
    stepDuration: 2,
    essencePaid: 3,
    resolved: true,
    outcome: 'success',
    stepOutcomes: ['success'],
    ...overrides,
  };
}

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'asc-1', type: 'actor', name: 'Player God',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Market',
    properties: {},
  });
  graph.addEdge({
    id: 'edge-loc-1', source: 'asc-1', target: 'loc-1',
    type: 'located_at', properties: {},
  });

  const pool = createEmptyPool();
  pool.force = 20;

  return {
    tick: 10,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: pool,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('controlEffectSpawn', () => {
  beforeEach(() => {
    resetEffectCounter();
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  describe('spawnControlEffect', () => {
    it('creates a valid ControlEffect from a sustained action success', () => {
      const template = makeSustainedTemplate();
      const action = makeResolvedAction();

      const result = spawnControlEffect(action, template, 10);

      expect(result).not.toBeNull();
      const { effect, event } = result!;

      expect(effect.effectId).toMatch(/^ctrl_/);
      expect(effect.templateId).toBe('action.control.bless-sustain');
      expect(effect.ownerId).toBe('asc-1');
      expect(effect.targetHexCol).toBe(5);
      expect(effect.targetHexRow).toBe(3);
      expect(effect.establishedTick).toBe(10);
      expect(effect.ritualEssenceInvested).toBe(3);
      expect(effect.active).toBe(true);
      expect(effect.ticksActive).toBe(0);
      expect(effect.perTickCost).toEqual({ force: 0.5 });
      expect(effect.perTickIncome).toEqual({ force: 0.1 });
      expect(effect.perTickMutations).toHaveLength(1);
      expect(effect.narrativeTemplates.established).toContain('blessing');

      expect(event.type).toBe('control_effect_established');
      expect(event.significance).toBe(0.7);
    });

    it('returns null for instant actions', () => {
      const template = makeInstantTemplate();
      const action = makeResolvedAction({ templateId: 'action.instant.test' });

      expect(spawnControlEffect(action, template, 10)).toBeNull();
    });

    it('returns null when controlSpec is missing', () => {
      const template = makeSustainedTemplate({ controlSpec: undefined });
      const action = makeResolvedAction();

      expect(spawnControlEffect(action, template, 10)).toBeNull();
    });

    it('returns null for non-hex targets', () => {
      const template = makeSustainedTemplate();
      const action = makeResolvedAction({ targetId: 'loc-1' });

      expect(spawnControlEffect(action, template, 10)).toBeNull();
    });

    it('populates essencePaid from action.essencePaid', () => {
      const template = makeSustainedTemplate();
      const action = makeResolvedAction({ essencePaid: 7 });

      const result = spawnControlEffect(action, template, 10);
      expect(result!.effect.ritualEssenceInvested).toBe(7);
    });

    it('defaults ritualEssenceInvested to 0 when essencePaid is undefined', () => {
      const template = makeSustainedTemplate();
      const action = makeResolvedAction({ essencePaid: undefined });

      const result = spawnControlEffect(action, template, 10);
      expect(result!.effect.ritualEssenceInvested).toBe(0);
    });

    it('copies contestPrerequisites from controlSpec', () => {
      const template = makeSustainedTemplate({
        controlSpec: {
          perTickCost: { force: 0.5 },
          contestPrerequisites: {
            usurp: { reach: { domain: 'gold', minTier: 2 } },
            destroy: { reach: { domain: 'iron', minTier: 3 } },
          },
          narrativeTemplates: {
            established: 'Est.',
            active: 'Act.',
            lapsed: 'Lap.',
          },
        },
      });
      const action = makeResolvedAction();

      const result = spawnControlEffect(action, template, 10);
      expect(result!.effect.contestPrerequisites?.usurp?.reach?.domain).toBe('gold');
      expect(result!.effect.contestPrerequisites?.destroy?.reach?.domain).toBe('iron');
    });

    it('carries perTickThreadAuras + upkeepArtifactId through (THR-509 fields)', () => {
      const template = makeSustainedTemplate({
        controlSpec: {
          perTickCost: { spirit: 0.3 },
          perTickThreadAuras: [{ magnitude: 1 }],
          upkeepArtifactId: 'relic-1',
          narrativeTemplates: { established: 'Est.', active: 'Act.', lapsed: 'Lap.' },
        },
      });
      const action = makeResolvedAction();

      const result = spawnControlEffect(action, template, 10);
      expect(result!.effect.perTickThreadAuras).toEqual([{ magnitude: 1 }]);
      expect(result!.effect.upkeepArtifactId).toBe('relic-1');
    });
  });

  // ─── THR-511: location-targeted sustained control (consecrate) ────────────────
  describe('spawnControlEffect — location targets (THR-511)', () => {
    function makeGraphWithTemple(): WorldGraph {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'asc-1', type: 'actor', name: 'Player God',
        properties: { actorType: 'ascendant' },
      });
      graph.addNode({
        id: 'temple-1', type: 'location', name: 'Sun Temple',
        properties: { locationSubtype: 'temple', hexCol: 7, hexRow: 4 },
      });
      return graph;
    }

    it('resolves a location target to its hex coords and sets targetNodeId', () => {
      const graph = makeGraphWithTemple();
      const template = makeSustainedTemplate({
        controlSpec: {
          perTickCost: { spirit: 0.3 },
          perTickThreadAuras: [{ magnitude: 1 }],
          narrativeTemplates: { established: 'Est.', active: 'Act.', lapsed: 'Lap.' },
        },
      });
      const action = makeResolvedAction({ targetId: 'temple-1' });

      const result = spawnControlEffect(action, template, 10, graph);
      expect(result).not.toBeNull();
      expect(result!.effect.targetHexCol).toBe(7);
      expect(result!.effect.targetHexRow).toBe(4);
      expect(result!.effect.targetNodeId).toBe('temple-1');
      expect(result!.effect.perTickThreadAuras).toEqual([{ magnitude: 1 }]);
    });

    it('returns null for a non-hex target when no graph is supplied (fail-soft)', () => {
      const template = makeSustainedTemplate();
      const action = makeResolvedAction({ targetId: 'temple-1' });
      // No graph → can't resolve location coords → no effect.
      expect(spawnControlEffect(action, template, 10)).toBeNull();
    });

    it('returns null when the location lacks hex coords (fail-soft)', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'temple-2', type: 'location', name: 'Floating Shrine',
        properties: { locationSubtype: 'shrine' }, // no hexCol/hexRow
      });
      const template = makeSustainedTemplate();
      const action = makeResolvedAction({ targetId: 'temple-2' });
      expect(spawnControlEffect(action, template, 10, graph)).toBeNull();
    });

    it('returns null when the target node is not a location', () => {
      const graph = makeGraphWithTemple();
      const template = makeSustainedTemplate();
      const action = makeResolvedAction({ targetId: 'asc-1' }); // actor, not location
      expect(spawnControlEffect(action, template, 10, graph)).toBeNull();
    });

    it('end-to-end: a consecrated site advances a co-located thread each tick', () => {
      const graph = makeGraphWithTemple();
      // A threaded mortal standing in the temple.
      graph.addNode({
        id: 'mortal-1', type: 'actor', name: 'Pilgrim',
        properties: { actorType: 'individual' },
      });
      graph.addEdge({
        id: 'edge-loc', source: 'mortal-1', target: 'temple-1',
        type: 'located_at', properties: {},
      });
      graph.addEdge({
        id: 'edge-thread', source: 'asc-1', target: 'mortal-1',
        type: 'thread', properties: { tier: 1, ticksAtCurrentTier: 0 },
      });

      const template = makeSustainedTemplate({
        controlSpec: {
          perTickCost: { spirit: 0.3 },
          perTickThreadAuras: [{ magnitude: 1 }],
          narrativeTemplates: { established: 'Est.', active: 'Act.', lapsed: 'Lap.' },
        },
      });
      const action = makeResolvedAction({ targetId: 'temple-1' });

      const result = spawnControlEffect(action, template, 10, graph);
      expect(result).not.toBeNull();

      // Tick the effect through phaseControlEffects against the same graph.
      const state = createMinimalGameState();
      // Swap in our temple graph (with the threaded pilgrim).
      (state as { graph: WorldGraph }).graph = graph;
      state.essencePool.spirit = 10;
      state.controlEffects = [result!.effect];

      phaseControlEffects(state);

      // The pilgrim's thread devotion clock advanced by the aura magnitude.
      const thread = graph.getNode('mortal-1') && graph.getOutgoingEdges('asc-1', 'thread')[0];
      expect(thread).toBeDefined();
      expect((thread!.properties.ticksAtCurrentTier as number)).toBe(1);
    });
  });

  // ─── THR-518: relic variant — mint + dynamic upkeepArtifactId injection ───────
  describe('spawnControlEffect — relic variant (THR-518)', () => {
    function makeGraphWithTemple(): WorldGraph {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'asc-1', type: 'actor', name: 'Player God',
        properties: { actorType: 'ascendant' },
      });
      graph.addNode({
        id: 'temple-1', type: 'location', name: 'Sun Temple',
        properties: { locationSubtype: 'temple', hexCol: 7, hexRow: 4 },
      });
      return graph;
    }

    function makeRelicTemplate(): UnifiedActionTemplate {
      return makeSustainedTemplate({
        controlSpec: {
          // A real per-tick cost so the waive is observable end-to-end.
          perTickCost: { spirit: 0.3 },
          perTickThreadAuras: [{ magnitude: 1 }],
          mintUpkeepRelic: { relicName: 'Hallowed Reliquary', tags: ['consecration_relic'] },
          narrativeTemplates: { established: 'Est.', active: 'Act.', lapsed: 'Lap.' },
        },
      });
    }

    it('mints a permanent relic and sets upkeepArtifactId to the new node id', () => {
      const graph = makeGraphWithTemple();
      const action = makeResolvedAction({ targetId: 'temple-1' });

      const result = spawnControlEffect(action, makeRelicTemplate(), 10, graph);
      expect(result).not.toBeNull();

      const relicId = result!.effect.upkeepArtifactId;
      expect(relicId).toBeDefined();
      expect(relicId).toContain('relic_consecrate_');

      const relic = graph.getNode(relicId!);
      expect(relic).toBeDefined();
      expect(relic!.type).toBe('artifact');
      expect(relic!.name).toBe('Hallowed Reliquary');
      expect(relic!.properties.lossCondition).toBe('permanent');
      expect(relic!.properties.source).toBe('consecrate_relic');
      expect(relic!.properties.consecratedBy).toBe('asc-1');
      expect(relic!.properties.consecratedNodeId).toBe('temple-1');

      // Bound to the establishing ascendant via a possesses edge.
      const possesses = graph.getOutgoingEdges('asc-1', 'possesses');
      expect(possesses.some((e) => e.target === relicId)).toBe(true);
    });

    it('mints deterministically — same owner/target/tick yields the same relic id', () => {
      const action = makeResolvedAction({ targetId: 'temple-1' });
      const a = spawnControlEffect(action, makeRelicTemplate(), 10, makeGraphWithTemple());
      const b = spawnControlEffect(action, makeRelicTemplate(), 10, makeGraphWithTemple());
      expect(a!.effect.upkeepArtifactId).toBe(b!.effect.upkeepArtifactId);
    });

    it('a freshly-minted relic overrides any static upkeepArtifactId', () => {
      const graph = makeGraphWithTemple();
      const template = makeSustainedTemplate({
        controlSpec: {
          perTickCost: {},
          upkeepArtifactId: 'static-relic',
          mintUpkeepRelic: { relicName: 'Hallowed Reliquary' },
          narrativeTemplates: { established: 'Est.', active: 'Act.', lapsed: 'Lap.' },
        },
      });
      const action = makeResolvedAction({ targetId: 'temple-1' });

      const result = spawnControlEffect(action, template, 10, graph);
      expect(result!.effect.upkeepArtifactId).not.toBe('static-relic');
      expect(result!.effect.upkeepArtifactId).toContain('relic_consecrate_');
    });

    it('does not mint without a graph (fail-soft) — falls back to static id', () => {
      // Hex target needs no graph to resolve, so the effect still spawns; the
      // mint requires a graph, so no relic is created and the static id stands.
      const template = makeSustainedTemplate({
        controlSpec: {
          perTickCost: {},
          mintUpkeepRelic: { relicName: 'Hallowed Reliquary' },
          narrativeTemplates: { established: 'Est.', active: 'Act.', lapsed: 'Lap.' },
        },
      });
      const action = makeResolvedAction({ targetId: 'hex_5_3' });

      const result = spawnControlEffect(action, template, 10); // no graph
      expect(result).not.toBeNull();
      expect(result!.effect.upkeepArtifactId).toBeUndefined();
    });

    it('end-to-end: the relic waives per-tick cost while it lives, then lapses when destroyed', () => {
      const graph = makeGraphWithTemple();
      const action = makeResolvedAction({ targetId: 'temple-1' });
      const result = spawnControlEffect(action, makeRelicTemplate(), 10, graph);
      const relicId = result!.effect.upkeepArtifactId!;

      const state = createMinimalGameState();
      (state as { graph: WorldGraph }).graph = graph;
      state.essencePool.spirit = 10;
      state.controlEffects = [result!.effect];

      // phaseControlEffects returns a patch (it does not mutate state in place);
      // apply it each tick the way the orchestrator would.
      // Tick once: relic exists → cost waived → spirit pool untouched (would be
      // 9.7 if the 0.3/tick spirit cost were charged).
      const patch1 = phaseControlEffects(state);
      state.controlEffects = patch1.controlEffects!;
      state.essencePool = patch1.essencePool!;
      expect(state.essencePool.spirit).toBe(10);
      expect(state.controlEffects[0].active).toBe(true);

      // Destroy the relic → next tick the effect lapses with the relic reason.
      graph.removeNode(relicId);
      const patch2 = phaseControlEffects(state);
      state.controlEffects = patch2.controlEffects!;
      expect(state.controlEffects[0].active).toBe(false);
      expect(state.controlEffects[0].lapseReason).toBe('upkeep_relic_destroyed');
    });
  });

  describe('contract: spawnControlEffect output → phaseControlEffects input', () => {
    it('spawned ControlEffect is valid for phaseControlEffects ticking', () => {
      const template = makeSustainedTemplate();
      const action = makeResolvedAction();

      const result = spawnControlEffect(action, template, 10);
      expect(result).not.toBeNull();

      // Feed spawned effect into phaseControlEffects
      const state = createMinimalGameState();
      state.controlEffects = [result!.effect];

      const update = phaseControlEffects(state);

      // Effect should still be active after one tick (we have enough essence)
      const effects = update.controlEffects as ControlEffect[];
      expect(effects).toHaveLength(1);
      expect(effects[0].active).toBe(true);
      expect(effects[0].ticksActive).toBe(1);

      // Essence should be drained
      const pool = update.essencePool as EssencePool;
      expect(pool.force).toBe(20 - 0.5 + 0.1); // drained 0.5, gained 0.1

      // Mutations should be queued
      const mutations = update.pendingHexMutations!;
      expect(mutations.length).toBeGreaterThan(0);
      expect(mutations[0].col).toBe(5);
      expect(mutations[0].row).toBe(3);
    });

    it('spawned effect lapses when essence runs out', () => {
      const template = makeSustainedTemplate();
      const action = makeResolvedAction();

      const result = spawnControlEffect(action, template, 10);
      const state = createMinimalGameState();
      state.essencePool.force = 0.3; // Not enough for 0.5 cost
      state.controlEffects = [result!.effect];

      const update = phaseControlEffects(state);

      const effects = update.controlEffects as ControlEffect[];
      expect(effects).toHaveLength(1);
      expect(effects[0].active).toBe(false);
      expect(effects[0].lapseReason).toBe('essence_depleted');
    });
  });

  describe('integration: phaseUnifiedActionProgress spawns ControlEffect', () => {
    it('spawns ControlEffect when sustained action resolves successfully', () => {
      const template = makeSustainedTemplate({
        steps: [{
          reach: 'gold',
          duration: { min: 1, max: 1 },
          difficulty: 0, // divine — always succeeds
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
        }],
      });

      const state = createMinimalGameState();

      // Create a unified action that will complete this tick (1 tick duration, already progressed)
      const action = createUnifiedAction({
        actorId: 'asc-1',
        templateId: template.id,
        targetId: 'hex_5_3',
        scale: 'local',
        source: 'player',
        tick: 9,
        template,
        rng: successRng,
        essencePaid: 3,
      });

      // Manually set stepProgress to stepDuration-1 so next progression completes it
      const readyAction: UnifiedAction = {
        ...action,
        stepProgress: 0, // progressAllActions will increment to 1 = stepDuration
      };

      state.unifiedActions = [readyAction];

      const update = phaseUnifiedActionProgress(state, [template], successRng);

      // Should have spawned a control effect
      expect(update.controlEffects).toBeDefined();
      expect(update.controlEffects!.length).toBe(1);

      const effect = update.controlEffects![0];
      expect(effect.templateId).toBe(template.id);
      expect(effect.ownerId).toBe('asc-1');
      expect(effect.targetHexCol).toBe(5);
      expect(effect.targetHexRow).toBe(3);
      expect(effect.active).toBe(true);
      expect(effect.perTickCost).toEqual({ force: 0.5 });

      // Should have establishment event
      const establishmentEvents = (update.tickEvents ?? []).filter(
        (e) => e.type === 'control_effect_established'
      );
      expect(establishmentEvents.length).toBe(1);
    });

    it('does NOT spawn ControlEffect for instant actions', () => {
      const template = makeInstantTemplate();

      const state = createMinimalGameState();
      const action = createUnifiedAction({
        actorId: 'asc-1',
        templateId: template.id,
        targetId: 'hex_5_3',
        scale: 'personal',
        source: 'player',
        tick: 9,
        template,
        rng: successRng,
      });

      state.unifiedActions = [{ ...action, stepProgress: 0 }];

      const update = phaseUnifiedActionProgress(state, [template], successRng);

      // No control effects should be spawned
      expect(update.controlEffects).toBeUndefined();
    });

    it('does NOT spawn ControlEffect when sustained action fails', () => {
      const failureRng = () => 0.99;
      const template = makeSustainedTemplate({
        steps: [{
          reach: 'gold',
          duration: { min: 1, max: 1 },
          difficulty: 0.95, // very hard — will fail with high roll
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
        }],
      });

      const state = createMinimalGameState();
      const action = createUnifiedAction({
        actorId: 'asc-1',
        templateId: template.id,
        targetId: 'hex_5_3',
        scale: 'local',
        source: 'agent',
        tick: 9,
        template,
        rng: failureRng,
        essencePaid: 3,
      });

      state.unifiedActions = [{ ...action, stepProgress: 0 }];

      const update = phaseUnifiedActionProgress(state, [template], failureRng);

      expect(update.controlEffects).toBeUndefined();
    });
  });
});
