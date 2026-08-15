/**
 * THR-924 — branch steps must survive the contract adapter.
 *
 * `UnifiedActionTemplate.steps` is `ActionStepOrBranch[]`. A branch point carries
 * its `reach` on each *variant*, never on itself, so a branch that reaches
 * `defaultPoleForReach` arrives with `reach === undefined` and `undefined[0]`
 * throws. The adapter runs inside `phaseAscendantHandFilter`, which has no
 * per-notification guard — so one fork-bearing pending encounter crashed the
 * whole tick, taking every *other* pending encounter down with it. That is why
 * `snow_on_the_pass` and `shrine_offering` were reported as crashing even though
 * both adapt cleanly on their own.
 *
 * Two gates here:
 *   1. Pool-wide predicate — *every* branch-bearing template in the shipped pool
 *      adapts and yields a valid pole per beat. Predicate, not a snapshot count
 *      (THR-688 rule A), so a newly authored fork is covered the day it lands.
 *   2. Step-transition path — the phase computes a forecast for a fork step at
 *      `stepIndex: 1`, which is the exact call that threw.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { SLICE_TEMPLATE_IDS } from '../../data/encounters/vertical-slice';
import {
  MORAL_AXIS_POLES_BY_REACH,
  QUINTESSENCE_POLES,
} from '../../types/encounter-contract';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import {
  ADAPTER_CONTRACT_METADATA_KEY,
  adaptUnifiedActionTemplateToEncounterContract,
} from '../encounter-contract-adapter';
import { phaseAscendantHandFilter } from '../orchestrator/phaseAscendantHandFilter';
import { WorldGraph } from '../graph';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';

const VALID_POLES = new Set<string>([
  ...Object.values(MORAL_AXIS_POLES_BY_REACH).flat(),
  ...QUINTESSENCE_POLES,
]);

const branchBearingTemplates = UNIFIED_ACTION_TEMPLATES.filter(
  (template) => (template.steps ?? []).some((step) => isActionStepBranch(step)),
);

/**
 * Branch-bearing templates that reach `fallbackContractFromTemplate` — the path
 * that crashed. A template carrying encoded contract metadata is decoded verbatim
 * instead, so its beat count answers to the authored contract rather than to
 * `steps`, and it never touched the broken code.
 */
const fallbackPathBranchTemplates = branchBearingTemplates.filter(
  (template) => !template.illustrationAlt?.startsWith(`${ADAPTER_CONTRACT_METADATA_KEY}:`),
);

describe('encounter contract adapter — branch steps (THR-924)', () => {
  it('finds branch-bearing templates on both adapter paths', () => {
    // Guards the gates below from going vacuous: an empty population makes every
    // `it.each` and `for` loop pass while asserting nothing.
    expect(branchBearingTemplates.length).toBeGreaterThan(0);
    expect(fallbackPathBranchTemplates.length).toBeGreaterThan(0);
  });

  it.each(branchBearingTemplates.map((template) => [template.id, template] as const))(
    'adapts %s without throwing, and every beat carries a real pole',
    (_id, template: UnifiedActionTemplate) => {
      const contract = adaptUnifiedActionTemplateToEncounterContract(template);

      expect(contract.encounter.beats.length).toBeGreaterThan(0);
      for (const beat of contract.encounter.beats) {
        for (const choice of beat.encounter_choices) {
          expect(VALID_POLES.has(choice.moral_axis_pole)).toBe(true);
        }
      }
    },
  );

  it.each(fallbackPathBranchTemplates.map((template) => [template.id, template] as const))(
    'gives %s one beat per step, branches included',
    (_id, template: UnifiedActionTemplate) => {
      // A dropped branch would silently shorten the contract rather than crash,
      // which is the quieter failure of the same bug.
      const contract = adaptUnifiedActionTemplateToEncounterContract(template);
      expect(contract.encounter.beats).toHaveLength(template.steps.length);
    },
  );

  it('takes the branch fallback variant reach for the fork beat', () => {
    const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.crossroads);
    expect(template).toBeDefined();

    const forkIndex = template!.steps.findIndex((step) => isActionStepBranch(step));
    expect(forkIndex).toBeGreaterThan(-1);

    const fork = template!.steps[forkIndex];
    // Narrow for the type checker; the assertion above is the real gate.
    if (!isActionStepBranch(fork)) throw new Error('expected a branch step');

    const contract = adaptUnifiedActionTemplateToEncounterContract(template!);
    const forkBeatChoice = contract.encounter.beats[forkIndex].encounter_choices[0];

    // No choiceHistory is available at template level, so the adapter must pick
    // `fallback` — the same variant `resolveStepDefinition` picks before a choice
    // has been recorded.
    expect(forkBeatChoice.reach).toBe(fork.fallback.reach);
    expect(forkBeatChoice.moral_axis_pole).toBe(
      MORAL_AXIS_POLES_BY_REACH[fork.fallback.reach][0],
    );
  });
});

describe('phaseAscendantHandFilter — step transition into a fork (THR-924)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('computes a forecast for a fork step instead of crashing the tick', () => {
    const encounterTemplateId = SLICE_TEMPLATE_IDS.crossroads;
    const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === encounterTemplateId);
    expect(template).toBeDefined();

    const forkIndex = template!.steps.findIndex((step) => isActionStepBranch(step));
    expect(forkIndex).toBeGreaterThan(-1);

    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc',
      type: 'actor',
      name: 'Ascendant',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'force', secondary: 'spirit' },
      },
    });
    graph.addNode({ id: 'actor-1', type: 'actor', name: 'Actor', properties: { actorType: 'individual' } });
    graph.addNode({
      id: 'loc-1',
      type: 'location',
      name: 'Crossroads',
      properties: { sphereAlignment: 'spirit' },
    });
    graph.addEdge({ id: 'thread-1', source: 'asc', target: 'actor-1', type: 'thread', properties: { tier: 2 } });
    graph.addEdge({ id: 'located-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });

    const action: UnifiedAction = {
      actionId: 'ua-fork',
      actorId: 'actor-1',
      templateId: encounterTemplateId,
      targetId: 'actor-1',
      scale: 'local',
      source: 'player',
      startTick: 39,
      // The transition the bug blocked: step 1 resolved, now standing on the fork.
      currentStep: forkIndex,
      stepProgress: 0,
      stepDuration: 1,
      resolved: false,
      stepOutcomes: ['success'],
    } as unknown as UnifiedAction;

    const state = {
      tick: 41,
      graph,
      ascendantId: 'asc',
      ascendantIdentity: null,
      essencePool: {
        force: 4, spirit: 5, matter: 0, energy: 0, life: 0, mind: 0,
        time: 0, entropy: 0, chaos: 0, order: 0, light: 0, darkness: 0,
      },
      encounterNotifications: [{
        id: 'notif-fork',
        agentId: 'actor-1',
        agentName: 'Actor',
        courtPosition: 'retinue',
        encounterId: encounterTemplateId,
        encounterName: 'A Bargain at the Crossroads',
        sourceSystem: 'unified_action',
        kind: 'encounter',
        stepIndex: forkIndex,
        actionId: action.actionId,
        prose: 'prose',
        choices: [],
        createdTick: 41,
        autoResolveTick: null,
        viewed: true,
        resolved: false,
      }],
      unifiedActions: [action],
    } as unknown as GameState;

    // Pre-fix this threw `Cannot read properties of undefined (reading '0')`,
    // which the orchestrator caught as "Tick crashed, returning previous state".
    expect(() => phaseAscendantHandFilter(state)).not.toThrow();

    // No laundering: `ForecastComputedTrace` is a `TraceEntry` member as of
    // THR-1065, so `trace.category` narrows to include `'forecast_computed'` and
    // this comparison typechecks on its own. An `as string` here would silently
    // re-admit the whole orphaned-payload class, which is what THR-1065 closed.
    const forecastTraces = getTraces().filter(
      (trace) => trace.category === 'forecast_computed',
    );
    expect(forecastTraces).toHaveLength(1);
  });
});
