/**
 * THR-1789 — an ending shows one reputation row per mortal, carrying the net.
 *
 * Warm round 1 read six identical `BOND · WORLD STANDING` rows for one mortal's
 * single quantity. They stacked in two ways. Up to three producers (authored,
 * branch, residual) pushed a row per step, and the steps' rows only appended.
 * The residual also reported the step's *total*, so the same movement showed
 * twice. These arms pin the fold through the real resolution path and the
 * arithmetic through the pure helpers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { WorldGraph } from '../graph';
import {
  foldActorReputation,
  reputationFoldId,
  stepReputationParts,
} from '../reputationAftermathFold';
import type {
  EncounterAftermathChange,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const fixedRng = () => 0.5;

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Kael',
    properties: { actorType: 'individual', reputationScore: 0.5 },
  });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
  graph.addEdge({
    id: 'edge-loc-1', source: 'actor-1', target: 'loc-1',
    type: 'located_at', properties: {},
  });
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
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never,
  } as unknown as GameState;
}

/** A template whose every step authors `reputationDelta` on success. */
function makeTemplate(stepDeltas: readonly number[]): UnifiedActionTemplate {
  return {
    id: 'encounter.test.reputation-fold',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Reputation Fold Test',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    steps: stepDeltas.map(delta => ({
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: 0.42,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      successMetadata: { reputationDelta: delta },
    })),
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as unknown as UnifiedActionTemplate;
}

/** Resolve every step as a success, keeping each step's change ids. */
function runAllSteps(template: UnifiedActionTemplate, state: GameState) {
  let action: UnifiedAction = createUnifiedAction({
    actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
    scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
  });
  const idsPerStep: string[][] = [];
  for (let i = 0; i < template.steps.length; i++) {
    action = executeStepResult(action, template, 'success', [], state, fixedRng, 10).updatedAction;
    idsPerStep.push(reputationRows(action).map(c => c.id));
  }
  return { action, idsPerStep };
}

const reputationRows = (action: UnifiedAction) =>
  (action.aftermathChanges ?? []).filter(c => c.kind === 'reputation');

describe('THR-1789 — reputation folds to one row per mortal', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
  });

  it('a 3-step action that moves reputation every step ends with one row carrying the sum, id stable', () => {
    const { action, idsPerStep } = runAllSteps(makeTemplate([0.05, 0.05, 0.05]), createMinimalGameState());
    const rows = reputationRows(action);

    expect(rows).toHaveLength(1);
    expect(rows[0].magnitude?.raw).toBeCloseTo(0.15, 6);
    expect(rows[0].actorId).toBe('actor-1');
    // The same id after every step, so the row is replaced rather than appended.
    const expectedId = reputationFoldId(action.actionId, 'actor-1');
    expect(idsPerStep).toEqual([[expectedId], [expectedId], [expectedId]]);
  });

  it('names the mortal and links to them', () => {
    const { action } = runAllSteps(makeTemplate([0.1]), createMinimalGameState());
    const [row] = reputationRows(action);
    expect(row.stateNoun?.text).toBe("Kael's reputation");
    expect(row.stateNoun?.entityId).toBe('actor-1');
    expect(row.detail).toBe("Kael's reputation rose noticeably.");
  });

  it('movements that cancel across steps leave no row', () => {
    const { action } = runAllSteps(makeTemplate([0.08, -0.08]), createMinimalGameState());
    expect(reputationRows(action)).toHaveLength(0);
  });

  it('a mortal at the ceiling gets no row for a rise the score could not take', () => {
    const state = createMinimalGameState();
    state.graph.getNode('actor-1')!.properties.reputationScore = 1;
    const { action } = runAllSteps(makeTemplate([0.05, 0.05, 0.05]), state);
    expect(reputationRows(action)).toHaveLength(0);
  });

  it('a step with no movement keeps the earlier row', () => {
    const { action } = runAllSteps(makeTemplate([0.08, 0]), createMinimalGameState());
    const rows = reputationRows(action);
    expect(rows).toHaveLength(1);
    expect(rows[0].magnitude?.raw).toBeCloseTo(0.08, 6);
  });
});

describe('THR-1789 — the fold arithmetic', () => {
  it('the residual carries only what authored and branch do not explain', () => {
    const parts = stepReputationParts({ authored: 0.05, branch: 0.02, total: 0.10 });
    expect(parts.residual).toBeCloseTo(0.03, 6);
    // The row reports the measured movement once, never 0.10 + 0.07.
    expect(parts.net).toBeCloseTo(0.10, 6);
  });

  it('a shift the clamp swallowed reports nothing — the net is what the score did', () => {
    // A mortal at the ceiling: +0.05 authored, the score cannot move.
    const parts = stepReputationParts({ authored: 0.05, branch: 0, total: 0 });
    expect(parts.residual).toBeCloseTo(-0.05, 6);
    expect(parts.net).toBeCloseTo(0, 6);
  });

  it('no residual when authored and branch explain the total', () => {
    const parts = stepReputationParts({ authored: 0.05, branch: 0.02, total: 0.07 });
    expect(parts.residual).toBe(0);
    expect(parts.net).toBeCloseTo(0.07, 6);
  });

  it('three steps of authored plus branch fold to one change carrying the sum', () => {
    let accumulated: EncounterAftermathChange[] = [];
    const id = reputationFoldId('ua_1', 'actor-1');
    for (let step = 0; step < 3; step++) {
      const parts = stepReputationParts({ authored: 0.04, branch: 0.02, total: 0.06 });
      const fold = foldActorReputation({
        prior: accumulated, actionId: 'ua_1', actorId: 'actor-1', stepNet: parts.net,
      });
      accumulated = accumulated.filter(c => !fold.supersededIds.includes(c.id));
      accumulated.push({
        id,
        kind: 'reputation',
        title: 'Reputation shifted',
        detail: 'x',
        polarity: 'gain',
        actorId: 'actor-1',
        magnitude: { ladder: 'reputation', band: 0, raw: fold.net },
      } as EncounterAftermathChange);
    }
    expect(accumulated).toHaveLength(1);
    expect(accumulated[0].id).toBe(id);
    expect(accumulated[0].magnitude?.raw).toBeCloseTo(0.18, 6);
  });

  it('another mortal\'s row is never folded into this one', () => {
    const other = {
      id: reputationFoldId('ua_1', 'actor-2'),
      kind: 'reputation',
      magnitude: { ladder: 'reputation', band: 0, raw: 0.2 },
    } as EncounterAftermathChange;
    const fold = foldActorReputation({ prior: [other], actionId: 'ua_1', actorId: 'actor-1', stepNet: 0.05 });
    expect(fold.supersededIds).toEqual([]);
    expect(fold.net).toBeCloseTo(0.05, 6);
  });
});
