/**
 * Tests for ascendant self-action effects (THR-399).
 *
 * Verifies that the 4 self-targeting divine actions apply their effects correctly:
 *   - Stillness:  essence regenerated on primary sphere
 *   - Recede:     nextActionDiscount written to ascendant node
 *   - Focus:      nextActionTierBoost written to ascendant node
 *   - Reveal:     divineInfluences pushed onto mortals on the avatar's hex
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';
import {
  STILLNESS_ESSENCE_REGEN,
  RECEDE_DISCOUNT_FRACTION,
  FOCUS_TIER_BOOST,
  REVEAL_DEVOTION_DELTA,
} from '../../data/self-action-constants';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────

/** Minimal GameState for self-action tests. */
function createSelfActionTestState(): GameState {
  const graph = new WorldGraph();

  // Ascendant node with essence pool and sphere alignment
  graph.addNode({
    id: 'asc-1', type: 'actor', name: 'The Weaver',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'spirit', secondary: 'mind' },
      essencePool: { spirit: 20, mind: 10, time: 5, life: 5, iron: 5, gold: 5, shadow: 5, stone: 5, order: 5 },
      maxEssence: 100,
      archetypeId: 'witness',
      interventionHistory: {},
      avatarId: 'avatar-1',
    },
  });

  // Avatar node (acts as the ascendant's body in the world)
  graph.addNode({
    id: 'avatar-1', type: 'actor', name: 'The Wanderer',
    properties: {
      actorType: 'individual',
      locationId: 'loc-1',
    },
  });

  // avatar_of edge: avatar → ascendant (getAvatarsOf queries incoming edges on ascendant)
  graph.addEdge({
    id: 'e-avatar', source: 'avatar-1', target: 'asc-1',
    type: 'avatar_of', properties: {},
  });

  // Location on hex (2, 3)
  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Village Square',
    properties: { locationType: 'town', locationSubtype: 'town', hexCol: 2, hexRow: 3 },
  });

  // Individual mortal on the same hex
  graph.addNode({
    id: 'mortal-1', type: 'actor', name: 'Alice',
    properties: {
      actorType: 'individual',
      locationId: 'loc-1',
      divineInfluences: [],
    },
  });

  // Mortal on a different hex (should NOT be affected by Reveal)
  graph.addNode({
    id: 'other-loc', type: 'location', name: 'Far Forest',
    properties: { locationType: 'forest', hexCol: 9, hexRow: 9 },
  });
  graph.addNode({
    id: 'mortal-far', type: 'actor', name: 'Bob',
    properties: {
      actorType: 'individual',
      locationId: 'other-loc',
      divineInfluences: [],
    },
  });

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
    essencePool: {} as any,
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
    omenState: null,
    flipTableStates: new Map(),
    clearanceGateStates: new Map(),
    digestBuffer: [],
  } as unknown as GameState;
}

/** Run one pipeline tick with a single self-action already progressed to completion. */
function runSelfAction(
  state: GameState,
  templateId: string,
  targetId = 'asc-1',
): Partial<GameState> {
  const template = getUnifiedTemplateById(templateId)!;
  const action = createUnifiedAction({
    actorId: 'asc-1',
    templateId,
    targetId,
    scale: template.scale,
    source: 'player',
    tick: 10,
    template,
    rng: () => 0.5,
  });
  state.unifiedActions = [action];
  state.tick = 11; // advance so step completes
  return phaseUnifiedActionProgress(state, UNIFIED_ACTION_TEMPLATES, () => 0.5);
}

// ─── Template Structure Tests ────────────────────────────────────

describe('self-action templates exist and have correct structure', () => {
  it('all 4 templates are registered', () => {
    const ids = [
      'divine.self.stillness',
      'divine.self.recede',
      'divine.self.focus',
      'divine.self.reveal',
    ];
    for (const id of ids) {
      expect(getUnifiedTemplateById(id), `Missing template: ${id}`).toBeDefined();
    }
  });

  it('Stillness and Recede have rarityTier 1, trayTier self', () => {
    for (const id of ['divine.self.stillness', 'divine.self.recede']) {
      const t = getUnifiedTemplateById(id)!;
      expect(t.rarityTier).toBe(1);
      expect(t.trayTier).toBe('self');
      expect(t.essenceCost).toBe(0);
    }
  });

  it('Focus has rarityTier 2, trayTier self, essenceCost 5', () => {
    const t = getUnifiedTemplateById('divine.self.focus')!;
    expect(t.rarityTier).toBe(2);
    expect(t.trayTier).toBe('self');
    expect(t.essenceCost).toBe(5);
  });

  it('Reveal has rarityTier 3, trayTier rare, essenceCost 15', () => {
    const t = getUnifiedTemplateById('divine.self.reveal')!;
    expect(t.rarityTier).toBe(3);
    expect(t.trayTier).toBe('rare');
    expect(t.essenceCost).toBe(15);
  });

  it('all 4 templates require actorType: ascendant target', () => {
    const ids = [
      'divine.self.stillness', 'divine.self.recede',
      'divine.self.focus', 'divine.self.reveal',
    ];
    for (const id of ids) {
      const t = getUnifiedTemplateById(id)!;
      expect(t.requiredNodeProperties?.actorType).toBe('ascendant');
      expect(t.targetCategories).toContain('actor');
      expect(t.actorAffinities).toContain('ascendant');
    }
  });

  it('all 4 templates have 1-tick duration and difficulty 0', () => {
    const ids = [
      'divine.self.stillness', 'divine.self.recede',
      'divine.self.focus', 'divine.self.reveal',
    ];
    for (const id of ids) {
      const t = getUnifiedTemplateById(id)!;
      expect(t.steps[0].duration.min).toBe(1);
      expect(t.steps[0].difficulty).toBe(0);
    }
  });
});

// ─── Effect Tests ────────────────────────────────────────────────

describe('Stillness effect', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('adds STILLNESS_ESSENCE_REGEN to primary sphere on success', () => {
    const state = createSelfActionTestState();
    const before = (state.graph.getNode('asc-1')!.properties.essencePool as any).spirit;

    runSelfAction(state, 'divine.self.stillness');

    const after = (state.graph.getNode('asc-1')!.properties.essencePool as any).spirit;
    expect(after).toBe(before + STILLNESS_ESSENCE_REGEN);
  });

  it('does not exceed maxEssence when already near cap', () => {
    const state = createSelfActionTestState();
    // Set spirit pool to 2 below max
    state.graph.updateNode('asc-1', {
      properties: { essencePool: { spirit: 98, mind: 10, time: 5, life: 5, iron: 5, gold: 5, shadow: 5, stone: 5, order: 5 } },
    });

    runSelfAction(state, 'divine.self.stillness');

    const after = (state.graph.getNode('asc-1')!.properties.essencePool as any).spirit;
    expect(after).toBe(100); // capped at maxEssence
  });

  it('resolves the action successfully', () => {
    const state = createSelfActionTestState();
    const result = runSelfAction(state, 'divine.self.stillness');
    const resolved = result.unifiedActions!.find(a => a.templateId === 'divine.self.stillness')!;
    expect(resolved.resolved).toBe(true);
    expect(resolved.outcome).toBe('success');
  });
});

describe('Recede effect', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('sets nextActionDiscount on ascendant node', () => {
    const state = createSelfActionTestState();
    runSelfAction(state, 'divine.self.recede');
    const props = state.graph.getNode('asc-1')!.properties;
    expect(props.nextActionDiscount).toBe(RECEDE_DISCOUNT_FRACTION);
  });

  it('resolves successfully', () => {
    const state = createSelfActionTestState();
    const result = runSelfAction(state, 'divine.self.recede');
    const resolved = result.unifiedActions!.find(a => a.templateId === 'divine.self.recede')!;
    expect(resolved.resolved).toBe(true);
    expect(resolved.outcome).toBe('success');
  });
});

describe('Focus effect', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('sets nextActionTierBoost on ascendant node', () => {
    const state = createSelfActionTestState();
    runSelfAction(state, 'divine.self.focus');
    const props = state.graph.getNode('asc-1')!.properties;
    expect(props.nextActionTierBoost).toBe(FOCUS_TIER_BOOST);
  });

  it('resolves successfully', () => {
    const state = createSelfActionTestState();
    const result = runSelfAction(state, 'divine.self.focus');
    const resolved = result.unifiedActions!.find(a => a.templateId === 'divine.self.focus')!;
    expect(resolved.resolved).toBe(true);
    expect(resolved.outcome).toBe('success');
  });
});

describe('Reveal effect', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('applies divineInfluences to mortals on the avatar hex', () => {
    const state = createSelfActionTestState();
    runSelfAction(state, 'divine.self.reveal');

    const mortalNode = state.graph.getNode('mortal-1')!;
    const influences = mortalNode.properties.divineInfluences as any[];
    expect(influences.length).toBeGreaterThan(0);
    expect(influences[0].interventionType).toBe('reveal');
    expect(influences[0].devotionDelta).toBe(REVEAL_DEVOTION_DELTA);
  });

  it('does NOT affect mortals on a different hex', () => {
    const state = createSelfActionTestState();
    runSelfAction(state, 'divine.self.reveal');

    const farMortal = state.graph.getNode('mortal-far')!;
    const influences = farMortal.properties.divineInfluences as any[];
    expect(influences.length).toBe(0);
  });

  it('stores expiresAtTick on each influence record', () => {
    const state = createSelfActionTestState();
    runSelfAction(state, 'divine.self.reveal');

    const influences = state.graph.getNode('mortal-1')!.properties.divineInfluences as any[];
    expect(influences[0].expiresAtTick).toBeGreaterThan(10); // tick was 11
  });

  it('resolves successfully', () => {
    const state = createSelfActionTestState();
    const result = runSelfAction(state, 'divine.self.reveal');
    const resolved = result.unifiedActions!.find(a => a.templateId === 'divine.self.reveal')!;
    expect(resolved.resolved).toBe(true);
    expect(resolved.outcome).toBe('success');
  });
});
