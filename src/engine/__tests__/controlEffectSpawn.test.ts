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
