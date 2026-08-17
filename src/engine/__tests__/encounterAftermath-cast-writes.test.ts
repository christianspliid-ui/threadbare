/**
 * THR-1165 — the repaired cast targets actually write, headless.
 *
 * The static gate (`castTargetViolations`, `check:cast-targets`) proves the
 * *authoring* rule. It cannot prove the write lands, and that distinction is the
 * whole ticket: the pre-fix content passed every static surface it had —
 * `$cast:keeper` was a declared key, `check:chip-anchors` classified it `ok` — and
 * still wrote nothing, because the key came from a bind-only setting-class default
 * that materialized nobody.
 *
 * So this file drives the real reactions off the real shipped templates through
 * `applyEncounterAftermathReaction` and asserts the graph afterwards. Each case is
 * falsified in the same breath by running the identical reaction with **no**
 * binding for the key — the exact pre-fix runtime state, measured on seed 42 as
 * `supportBindings: []` — and asserting the write is absent. A test that only ever
 * shows the green half cannot tell a working write from a vacuous assertion.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime } from '../simulationRuntime';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type { EncounterSupportBinding } from '../../types/encounter';
import type {
  EncounterAftermathReaction,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const HERO = 'actor-hero';
const CAST_NODE = 'actor-cast-subject';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: HERO, type: 'actor', name: 'Hero', properties: { actorType: 'individual', reputationScore: 0.5 } });
  graph.addNode({ id: CAST_NODE, type: 'actor', name: 'The Subject', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Town', properties: { hexCol: 1, hexRow: 1 } });
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    hiddenMarks: [], intelligenceRecords: [], pendingEncounterSeeds: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(
  templateId: string,
  bindings: readonly EncounterSupportBinding[],
): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: HERO, templateId, targetId: HERO,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    supportBindings: bindings,
  } as unknown as UnifiedAction;
}

function binding(key: string): EncounterSupportBinding {
  return {
    key, nodeId: CAST_NODE, kind: 'actor',
    delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false,
  } as unknown as EncounterSupportBinding;
}

/** The shipped reaction, pulled from the live template rather than retyped. */
function shippedReaction(templateId: string, reactionId: string): EncounterAftermathReaction {
  const template = getUnifiedTemplateById(templateId) as UnifiedActionTemplate | undefined;
  expect(template, `${templateId} missing from the catalog`).toBeDefined();
  const faces = [
    ...Object.values(template?.aftermathConfig?.variants ?? {}),
    template?.aftermathConfig?.fallback,
  ];
  for (const face of faces) {
    const found = (face?.reactions ?? []).find(r => r.id === reactionId);
    if (found) return found;
  }
  throw new Error(`reaction ${reactionId} not found on ${templateId}`);
}

function run(
  templateId: string,
  reactionId: string,
  bindings: readonly EncounterSupportBinding[],
): GameState {
  const state = buildState();
  const runtime = createSimulationRuntime();
  return applyEncounterAftermathReaction(
    state,
    makeAction(templateId, bindings),
    shippedReaction(templateId, reactionId),
    state.tick,
    runtime,
  ).state;
}

describe('THR-1165 — the caravan bond is written to the caravan master', () => {
  const TEMPLATE = 'encounter.slice.riders_behind_caravan';
  const REACTION = 'slice.caravan.part_ways';

  it('writes a bond edge to the cast subject when the key binds', () => {
    const state = run(TEMPLATE, REACTION, [binding('caravan_master')]);
    const edges = state.graph.getAllEdgesForNode(CAST_NODE);
    const bond = edges.find(e => e.source === HERO || e.target === HERO);
    expect(bond, 'no edge between the hero and the caravan master').toBeDefined();
  });

  it('writes NOTHING when the key does not bind — the pre-fix runtime state', () => {
    // `supportBindings: []` is exactly what seed 42 produced before the repair.
    const state = run(TEMPLATE, REACTION, []);
    const edges = state.graph.getAllEdgesForNode(CAST_NODE);
    expect(edges.filter(e => e.source === HERO || e.target === HERO)).toEqual([]);
  });
});

describe('THR-1165 — the swindler mark is written to the swindler', () => {
  const TEMPLATE = 'encounter.slice.swindler_found';
  const REACTION = 'slice.swindler.market_closes';

  it('marks the cast subject when the key binds', () => {
    const state = run(TEMPLATE, REACTION, [binding('swindler')]);
    const marks = (state.hiddenMarks ?? []).filter(m => m.targetAgentId === CAST_NODE);
    expect(marks).toHaveLength(1);
    expect(marks[0]?.label).toContain('deeds to land that was never his');
  });

  it('marks NOBODY when the key does not bind — the pre-fix runtime state', () => {
    const state = run(TEMPLATE, REACTION, []);
    expect((state.hiddenMarks ?? []).filter(m => m.targetAgentId === CAST_NODE)).toEqual([]);
  });

  it('never marks the hero by accident when the sentinel is unbound', () => {
    // The failure mode worth naming: an unbound sentinel that fell back to the
    // actor would brand the player with the swindler's crime.
    const state = run(TEMPLATE, REACTION, []);
    expect((state.hiddenMarks ?? []).filter(m => m.targetAgentId === HERO)).toEqual([]);
  });
});

describe('THR-1165 — the bridge keeper mark is written to the keeper', () => {
  const TEMPLATE = 'encounter.slice.unsafe_bridge';
  const REACTION = 'slice.bridge.walk_on';

  it('marks the cast subject when the key binds', () => {
    const state = run(TEMPLATE, REACTION, [binding('bridge_keeper')]);
    const marks = (state.hiddenMarks ?? []).filter(m => m.targetAgentId === CAST_NODE);
    expect(marks).toHaveLength(1);
    expect(marks[0]?.label).toContain('planking she knows is failing');
  });

  it('marks NOBODY when the key does not bind — the pre-fix runtime state', () => {
    const state = run(TEMPLATE, REACTION, []);
    expect((state.hiddenMarks ?? []).filter(m => m.targetAgentId === CAST_NODE)).toEqual([]);
  });
});
