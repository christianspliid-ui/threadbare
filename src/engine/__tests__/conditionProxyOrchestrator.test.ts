/**
 * THR-1257 — the `damaged` raise from an action trigger, asserted through the real
 * orchestrator rather than through the module.
 *
 * This is the assertion the ticket was deferred out of THR-1244 to make. The three
 * `applyActionTriggerPayloads` call sites are not equivalent: the orchestrator's sits
 * **inside** the `runningEffectStates` threading loop, which assigns its map to
 * `state.effectStates` once at end of tick. A raise that wrote `state.effectStates`
 * from in there would be silently discarded by that assignment — the
 * `effect.event_raised` trace would still appear, so the raise would look entirely
 * healthy while every runtime-state write it triggered vanished.
 *
 * A module-level test cannot see that, because the discard happens in the caller. So
 * this one drives `runTick` on a real initialised world and asserts the downstream
 * write is still there **after** the tick returns, which is the only place the
 * question is actually settled.
 *
 * The unit-level companion (with the control arm proving the pre-THR-1257 caller shape
 * loses the write) is `src/engine/effects/__tests__/conditionProxyActionTrigger.test.ts`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { initiateEncounter } from '../encounter';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import * as encounterContent from '../../data/encounter-content';
import { STARTER_CONDITIONS } from '../../data/starter-attachments';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { AttachmentEffect } from '../../types/effects';

/** A harmful condition from the real catalog — `#curse`, normalised to `#negative`. */
const HARM = 'starter_drained_resolve';

/**
 * A one-step encounter that always resolves in a single tick, so the completion
 * branch — and with it the action-trigger site — is reached deterministically rather
 * than by waiting for the simulation to produce one.
 */
const ONE_STEP: UnifiedActionTemplate = {
  id: 'encounter.thr1257_probe',
  name: 'Proxy Probe',
  intrinsicTier: 'background',
  rarityTier: 1,
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  locationSubtypes: ['town'],
  narrativeTemplates: { initiation: 'A probe begins.', success: 'Success.', failure: 'Failure.' },
  steps: [{
    reach: 'iron',
    difficulty: 0.01, // ~always succeeds → `encounter_success` is the trigger event
    duration: { min: 1, max: 1 },
    onSuccess: { narrative: 'Probe success.' } as never,
    onFailure: { narrative: 'Probe failure.' } as never,
    failBehavior: 'continue_weakened',
  }],
} as unknown as UnifiedActionTemplate;

function freshWorld(): GameState {
  resetDecisionCache();
  resetEventCounter();
  const archetype = generateArchetypes(4, 42)[0];
  const preset = MAP_SIZE_PRESETS.small;
  const { state } = initializeGameState(
    archetype, 'Probe-Runner', createBalancedCosmology(), 42, preset.cols, preset.rows,
  );
  // The condition node the payload names must exist, exactly as authored content
  // references catalog nodes by id.
  const harm = STARTER_CONDITIONS.find((c) => c.id === HARM)!;
  if (!state.graph.getNode(HARM)) state.graph.addNode(harm);
  return state;
}

/** Give an agent the trigger that inflicts, and the ward that records the raise. */
function armAgent(state: GameState, agentId: string): void {
  state.graph.addNode({
    id: 'codex', type: 'artifact', name: 'Burned Codex',
    properties: {
      // Both ladder events, because the orchestrator's trigger site fires on
      // `completed` OR `abandoned` and picks the event from `result.success`. Binding
      // to one band would make this test depend on a die roll rather than on the
      // wiring it is here to assert.
      effects: (['encounter_success', 'encounter_failure'] as const).map((on) => ({
        type: 'action_trigger',
        on,
        payload: { kind: 'condition_grant', conditionTraitId: HARM, durationTicks: 10 },
      })) as AttachmentEffect[],
    },
  });
  state.graph.addEdge({
    id: 'e.codex', type: 'possesses', source: agentId, target: 'codex', properties: {},
  });
  // A `stacking` effect on `on_damaged` writes RUNTIME STATE, which is precisely the
  // thing the end-of-tick assignment can discard. A reactive that only mutated the
  // graph would survive the discard and prove nothing about this bug.
  state.graph.addNode({
    id: 'scar', type: 'artifact', name: 'Scar-Ward',
    properties: {
      effects: [{
        type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 5, stackOn: 'on_damaged',
      } as AttachmentEffect],
    },
  });
  state.graph.addEdge({
    id: 'e.scar', type: 'possesses', source: agentId, target: 'scar', properties: {},
  });
}

describe('THR-1257 — the raise survives the orchestrator end-of-tick assignment', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
    vi.spyOn(encounterContent, 'getAnyEncounterById').mockImplementation(
      (id: string) => (id === ONE_STEP.id ? ONE_STEP : undefined),
    );
  });
  afterEach(() => { clearTraces(); disableTracing(); vi.restoreAllMocks(); });

  it('a condition_grant fired by an encounter completion raises damaged through runTick', () => {
    let state = freshWorld();
    const agentId = state.graph.getNodesByType('actor')
      .find((n) => n.properties.actorType === 'individual')!.id;
    armAgent(state, agentId);

    // Drive the probe to completion through the real tick loop. `initiateEncounter`
    // registers the progress on the state itself — pushing it again here would run
    // the encounter twice and mint a duplicate event node.
    initiateEncounter(state, agentId, ONE_STEP.id, state.tick);
    for (let i = 0; i < 4 && !getRaise(); i++) state = runTick(state);

    const raise = getRaise();
    expect(raise, 'no damaged raise reached the orchestrator path').toBeDefined();
    expect(raise).toMatchObject({ site: 'condition_inflicted', agentId });

    // The load-bearing assertion: the runtime-state write the raise triggered is
    // still on the state AFTER runTick returned and did its end-of-tick assignment.
    expect(state.effectStates?.get('scar')?.stacks).toBe(1);

    // And the condition itself really landed — the raise is not firing off an
    // infliction that never happened.
    expect(
      state.graph.getOutgoingEdges(agentId, 'has_trait').some((e) => e.target === HARM),
    ).toBe(true);
  });
});

/** The `damaged` raise from the condition-inflicted site, if one has fired. */
function getRaise() {
  return getTraces().find(
    (t) => t.category === 'effect.event_raised'
      && (t as unknown as { event?: string }).event === 'damaged'
      && (t as unknown as { site?: string }).site === 'condition_inflicted',
  );
}
