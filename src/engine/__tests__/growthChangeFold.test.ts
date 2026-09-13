/**
 * THR-1467 — a reach that grows twice in one encounter reports one chip, not two.
 *
 * The defect: Snow on the Pass has two steps and both are `stone`, so both grew
 * the same reach, and the growth producer minted one change per step. The ending
 * drew two `BOON · STONE` rows that were identical down to the delta cluster —
 * the pre-flight sweep's DOM census found them byte-identical. Both grants were
 * real, which is why this is not a double *render*: one reach moved, twice, and
 * the ending had no way to say so.
 *
 * The arms below are deliberately paired, because the one-chip assertion alone
 * would pass just as well if the fold were a blanket dedupe that swallowed a
 * genuinely different reach — the failure mode that would turn a fix for an
 * unreadable ending into a fix that *loses* half of one.
 *
 * Verified against the shipped template before it was written (CLAUDE.md
 * § Verify the Noun Before the Verb): `SLICE_SNOW_ON_THE_PASS.steps` is
 * `[PASS_CLIMB_STEP, PASS_NIGHT_STEP]` and both declare `reach: 'stone'`, so the
 * shared-reach arm below is the shipped shape rather than an invented one.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { WorldGraph } from '../graph';
import { SLICE_SNOW_ON_THE_PASS } from '../../data/encounters/vertical-slice';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const fixedRng = () => 0.5;

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Alice',
    properties: { actorType: 'individual' },
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

/** A template whose steps declare exactly the reaches given, in order. */
function makeTemplate(reaches: readonly string[]): UnifiedActionTemplate {
  return {
    id: 'encounter.test.growth-fold',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Growth Fold Test',
    reach: reaches[0],
    crudType: 'read',
    scale: 'local',
    steps: reaches.map(reach => ({
      reach,
      duration: { min: 1, max: 1 },
      difficulty: 0.42,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
    })),
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as unknown as UnifiedActionTemplate;
}

/** Resolve every step of `template` as a success and return the finished action. */
function runAllSteps(template: UnifiedActionTemplate, state: GameState): UnifiedAction {
  let action = createUnifiedAction({
    actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
    scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
  });
  for (let i = 0; i < template.steps.length; i++) {
    action = executeStepResult(action, template, 'success', [], state, fixedRng, 10).updatedAction;
  }
  return action;
}

const growthChanges = (action: UnifiedAction) =>
  (action.aftermathChanges ?? []).filter(c => c.kind === 'growth');

describe('THR-1467 — repeated growth in one reach folds to one change', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
  });

  it('is the shipped shape: both Snow on the Pass steps are the same reach', () => {
    // The premise this whole ticket rests on, asserted rather than assumed —
    // if the template is ever re-authored onto two different reaches, the
    // motivating case is gone and this file should be re-read, not re-run green.
    const reaches = SLICE_SNOW_ON_THE_PASS.steps
      .filter(s => !isActionStepBranch(s))
      .map(s => (s as { reach: string }).reach);
    expect(reaches).toEqual(['stone', 'stone']);
  });

  it('draws one chip for a reach that grew twice, carrying the summed amount', () => {
    const twoStep = runAllSteps(makeTemplate(['stone', 'stone']), createMinimalGameState());
    const folded = growthChanges(twoStep);

    // Before the fix this was 2, with both entries identical on screen.
    expect(folded).toHaveLength(1);

    // The control arm: the same reach, the same difficulty, *one* step. Run as
    // its own resolution rather than read off a constant, so the comparison is
    // against what the growth curve actually pays for one step of this shape.
    const oneStep = runAllSteps(makeTemplate(['stone']), createMinimalGameState());
    const control = growthChanges(oneStep);
    expect(control).toHaveLength(1);

    const foldedRaw = folded[0].magnitude?.raw;
    const controlRaw = control[0].magnitude?.raw;
    expect(foldedRaw).toBeDefined();
    expect(controlRaw).toBeDefined();

    // Summed, not replaced: the folded chip reports strictly more than the one
    // step's growth. A fold that simply kept the last change would land exactly
    // on the control (modulo the curve) and fail here.
    expect(foldedRaw!).toBeGreaterThan(controlRaw!);
  });

  it('leaves two different reaches as two chips', () => {
    // The falsification arm. A blanket dedupe on `kind === 'growth'` passes the
    // test above and fails this one.
    const mixed = runAllSteps(makeTemplate(['stone', 'eye']), createMinimalGameState());
    const changes = growthChanges(mixed);
    expect(changes).toHaveLength(2);
    const nouns = changes.map(c => c.stateNoun?.text).sort();
    expect(new Set(nouns).size).toBe(2);
  });
});
