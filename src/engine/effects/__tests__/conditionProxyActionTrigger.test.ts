/**
 * THR-1257 — the action-trigger condition path as the *fourth* infliction site of
 * the `damaged` / `healed` proxy, and the polarity vocabulary that makes it honest.
 *
 * THR-1244 wired the three aftermath sites and stopped there, because
 * `applyActionTriggerPayloads` took a `WorldGraph` while `raiseEffectEvent` needs a
 * `GameState`, and because the conditions *this* path grants live in catalogs that
 * carried no polarity tag at all. Either half alone is worse than neither: wiring the
 * site without the vocabulary produces a raise that is live and silently
 * misclassifies a vault curse as *not harm*, which is harder to notice than a raise
 * that is honestly absent.
 *
 * Three properties carry the weight here, and two of them are absences:
 *
 *   • **A boon raises nothing.** `starter_revelation` is granted by the same payload
 *     kind through the same code path as `starter_drained_resolve`. A suite that only
 *     proved the firing half would pass just as happily against a proxy keyed on "a
 *     condition changed" rather than "a *harmful* condition changed".
 *   • **A non-person carrier raises nothing.** The gate lives in the proxy, not in a
 *     second copy of the predicate at this call site, and this is what proves it.
 *   • **The threaded write survives.** See the control arm in the last describe —
 *     it is the half that would have caught the bug this ticket was deferred over.
 *
 * The fixtures deliberately use the **real** catalog nodes rather than hand-built
 * ones, so a condition that stops shipping its polarity tag fails these tests instead
 * of being papered over by a fixture that invents both sides of the assertion.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { applyActionTriggerPayloads } from '../actionTriggerPayloads';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import { STARTER_CONDITIONS } from '../../../data/starter-attachments';
import { ANOMALY_CONDITIONS } from '../../../data/anomaly-reward-catalog';
import { REWARD_CONDITIONS } from '../../../data/reward-attachment-catalog';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { ECONOMIC_TRAIT_DEFINITIONS } from '../../../data/economic-trait-content';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';
import type { GraphNode } from '../../../types/graph';
import type { ActionTriggerPayloadIntent } from '../actionTrigger';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Real catalog ids, chosen so the assertions bind to shipped content. */
const HARM = 'starter_drained_resolve'; // '#curse' → '#negative'
const BOON = 'starter_revelation';      // '#knowledge' → '#positive'
const WOUND = 'reward_condition_gashed_leg'; // '#wound' → '#negative', reward catalog

let edgeCounter = 0;
function eid() { return `e.atp.${++edgeCounter}`; }

/**
 * A world holding one person and one army, plus every real condition node, so the
 * predicate is exercised against shipped tags rather than fixture tags.
 */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-army', type: 'actor', name: 'The Ninth', properties: { actorType: 'group' } });
  for (const node of allConditionNodes()) graph.addNode(node);
  return {
    tick: 10, seed: 42, phase: 'playing', graph, effectStates: new Map(),
  } as unknown as GameState;
}

function allConditionNodes(): GraphNode[] {
  return [
    ...STARTER_CONDITIONS,
    ...ANOMALY_CONDITIONS,
    ...REWARD_CONDITIONS,
    ...CONDITION_TRAIT_DEFINITIONS,
    ...ECONOMIC_TRAIT_DEFINITIONS,
  ].filter((n) => (n.properties as { subcategory?: string }).subcategory === 'condition');
}

function grant(conditionTraitId: string, intensity?: number): ActionTriggerPayloadIntent {
  return {
    attachmentId: 'att-1', attachmentName: 'Burned Codex',
    payload: { kind: 'condition_grant', conditionTraitId, durationTicks: 10, ...(intensity !== undefined ? { intensity } : {}) },
  } as ActionTriggerPayloadIntent;
}

function removeByTag(...tags: string[]): ActionTriggerPayloadIntent {
  return {
    attachmentId: 'att-2', attachmentName: 'Sunleaf Phial',
    payload: { kind: 'condition_remove', tags },
  } as ActionTriggerPayloadIntent;
}

/** Hang an effect-bearing possession on an agent, the way the walker expects it. */
function giveAttachment(graph: WorldGraph, agentId: string, attachId: string, effects: AttachmentEffect[]) {
  graph.addNode({ id: attachId, type: 'artifact', name: 'Warding Charm', properties: { effects } });
  graph.addEdge({ id: eid(), type: 'possesses', source: agentId, target: attachId, properties: {} });
}

/** `effect.event_raised` traces, optionally filtered to one event type. */
function raises(event?: 'damaged' | 'healed') {
  return getTraces()
    .filter((t) => t.category === 'effect.event_raised')
    .filter((t) => event === undefined || (t as unknown as { event?: string }).event === event);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('THR-1257 — action_trigger is the fourth infliction site', () => {
  beforeEach(() => { edgeCounter = 0; clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  describe('damaged — a harmful condition granted by an item', () => {
    it('condition_grant of a harmful condition raises damaged at condition_inflicted', () => {
      const state = buildState();
      const res = applyActionTriggerPayloads(state, 'actor-hero', [grant(HARM)], state.tick);

      expect(res.conditionsGranted).toBe(1);
      const fired = raises('damaged');
      expect(fired).toHaveLength(1);
      expect(fired[0]).toMatchObject({ agentId: 'actor-hero', site: 'condition_inflicted', tick: 10 });
    });

    it('carries the condition intensity as the amount, not an invented hit-point figure', () => {
      const state = buildState();
      giveAttachment(state.graph, 'actor-hero', 'scar', [{
        type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 5, stackOn: 'on_damaged',
      } as AttachmentEffect]);

      applyActionTriggerPayloads(state, 'actor-hero', [grant(HARM, 0.6)], state.tick);

      // The downstream trigger actually moved — a trace alone would prove the raise
      // happened without proving anything was reachable from it.
      expect(state.effectStates?.get('scar')?.stacks).toBe(1);
    });

    it('raises after the edge exists, so a reactive inspecting the bearer sees it', () => {
      const state = buildState();
      let sawEdge: boolean | undefined;
      giveAttachment(state.graph, 'actor-hero', 'charm', [{
        type: 'reactive', trigger: 'damaged', cooldown: 0,
        effect: { type: 'spawn', what: 'encounter', template: 'test.omen', onHex: 'self' },
      } as AttachmentEffect]);

      applyActionTriggerPayloads(state, 'actor-hero', [grant(HARM)], state.tick);
      sawEdge = state.graph
        .getOutgoingEdges('actor-hero', 'has_trait')
        .some((e) => e.target === HARM);

      expect(raises('damaged')[0]).toMatchObject({ reactivesFired: 1 });
      expect(sawEdge).toBe(true);
    });
  });

  describe('the absences — the half a firing-only suite cannot see', () => {
    it('a BOON granted by an action trigger raises nothing', () => {
      const state = buildState();
      const res = applyActionTriggerPayloads(state, 'actor-hero', [grant(BOON)], state.tick);

      // The grant still happened — this is a polarity gate, not a grant gate.
      expect(res.conditionsGranted).toBe(1);
      expect(raises()).toHaveLength(0);
    });

    it('a harmful condition on an ARMY raises nothing', () => {
      const state = buildState();
      applyActionTriggerPayloads(state, 'actor-army', [grant(HARM)], state.tick);
      expect(raises()).toHaveLength(0);
    });

    it('lifting a boon is not a heal', () => {
      const state = buildState();
      state.graph.addEdge({
        id: eid(), source: 'actor-hero', target: BOON, type: 'has_trait',
        properties: { appliedAt: 1, intensity: 1 },
      });

      const res = applyActionTriggerPayloads(
        state, 'actor-hero', [removeByTag('#knowledge')], state.tick,
      );

      expect(res.conditionsRemoved).toBe(1);
      expect(raises()).toHaveLength(0);
    });

    it('a grant whose condition node is missing raises nothing and still fails soft', () => {
      const state = buildState();
      const res = applyActionTriggerPayloads(
        state, 'actor-hero', [grant('cond.does_not_exist')], state.tick,
      );
      expect(res.conditionsGranted).toBe(0);
      expect(raises()).toHaveLength(0);
    });
  });

  describe('healed — a harmful condition lifted early', () => {
    it('condition_remove of a harmful condition raises healed at condition_lifted', () => {
      const state = buildState();
      state.graph.addEdge({
        id: eid(), source: 'actor-hero', target: HARM, type: 'has_trait',
        properties: { appliedAt: 1, intensity: 0.4 },
      });

      const res = applyActionTriggerPayloads(
        state, 'actor-hero', [removeByTag('#curse')], state.tick,
      );

      expect(res.conditionsRemoved).toBe(1);
      const fired = raises('healed');
      expect(fired).toHaveLength(1);
      expect(fired[0]).toMatchObject({ agentId: 'actor-hero', site: 'condition_lifted' });
    });

    it('a tag removal reaches the reward catalog too — one raise per harmful condition lifted', () => {
      // `condition_remove` matches on TAGS, so the single authored `tags: ['#wound']`
      // removal in the anomaly catalog reaches every `#wound` condition in the repo,
      // `reward-attachment-catalog.ts` included. Normalising only the catalogs the
      // *grants* name would have left this half of the path silently blind.
      const state = buildState();
      for (const id of [WOUND, 'starter_bruised_ribs']) {
        state.graph.addEdge({
          id: eid(), source: 'actor-hero', target: id, type: 'has_trait',
          properties: { appliedAt: 1, intensity: 1 },
        });
      }

      const res = applyActionTriggerPayloads(
        state, 'actor-hero', [removeByTag('#wound')], state.tick,
      );

      expect(res.conditionsRemoved).toBe(2);
      expect(raises('healed')).toHaveLength(2);
    });

    it('removes the edge before raising, so a reactive sees the bearer already clear', () => {
      const state = buildState();
      state.graph.addEdge({
        id: eid(), source: 'actor-hero', target: HARM, type: 'has_trait',
        properties: { appliedAt: 1, intensity: 1 },
      });

      applyActionTriggerPayloads(state, 'actor-hero', [removeByTag('#curse')], state.tick);

      expect(
        state.graph.getOutgoingEdges('actor-hero', 'has_trait').some((e) => e.target === HARM),
      ).toBe(false);
    });
  });

  describe('the orchestrator contract — a threaded write must survive the tick', () => {
    /**
     * The reason this ticket existed rather than being folded into THR-1244.
     *
     * The orchestrator's encounter pass threads `runningEffectStates` across every
     * active encounter and assigns it to `state.effectStates` once at end of tick. A
     * raise that wrote `state.effectStates` from inside that loop would be discarded
     * by the assignment — silently, with the trace still emitted, so the raise would
     * look entirely healthy while its downstream state write vanished.
     *
     * **Scope, stated so this does not read as more than it is.** These replicate the
     * orchestrator's threading sequence rather than running `runTick`; the live
     * end-to-end proof is the seeded CLI run recorded on the ticket, where a real
     * `runTick` emits `condition_inflicted`. What the control arm below adds is the
     * thing a passing-only test cannot give: evidence that this suite would have
     * FAILED against the pre-THR-1257 caller shape.
     */
    function harmWithStackingWard(): { state: GameState; threaded: Map<string, EffectRuntimeState> } {
      const state = buildState();
      giveAttachment(state.graph, 'actor-hero', 'scar', [{
        type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 5, stackOn: 'on_damaged',
      } as AttachmentEffect]);
      return { state, threaded: new Map<string, EffectRuntimeState>() };
    }

    it('returns the merged states and leaves state.effectStates untouched while threading', () => {
      const { state, threaded } = harmWithStackingWard();

      const applied = applyActionTriggerPayloads(
        state, 'actor-hero', [grant(HARM)], state.tick, { states: threaded },
      );

      // The write landed in the returned map...
      expect(applied.effectStates?.get('scar')?.stacks).toBe(1);
      // ...and NOT on the state, which the loop owns and assigns later.
      expect(state.effectStates?.get('scar')).toBeUndefined();
    });

    it('survives the orchestrator end-of-tick assignment', () => {
      const { state, threaded } = harmWithStackingWard();
      let runningEffectStates: ReadonlyMap<string, EffectRuntimeState> = threaded;

      // The orchestrator's exact sequence.
      const applied = applyActionTriggerPayloads(
        state, 'actor-hero', [grant(HARM)], state.tick, { states: runningEffectStates },
      );
      if (applied.effectStates) runningEffectStates = applied.effectStates;
      state.effectStates = new Map(runningEffectStates); // end-of-tick assignment

      expect(state.effectStates.get('scar')?.stacks).toBe(1);
    });

    it('CONTROL: the pre-THR-1257 shape — ignoring the return — loses the write', () => {
      // This is the arm that makes the test above non-vacuous. Before this ticket the
      // orchestrator neither passed `states` nor read a map back, so the end-of-tick
      // assignment overwrote whatever the raise had written. If a future refactor
      // drops the `applied.effectStates` read, the test above goes red and this one
      // stays green, which localises the regression to the caller rather than the module.
      const { state, threaded } = harmWithStackingWard();
      let runningEffectStates: ReadonlyMap<string, EffectRuntimeState> = threaded;

      applyActionTriggerPayloads(
        state, 'actor-hero', [grant(HARM)], state.tick, { states: runningEffectStates },
      );
      // ...return deliberately ignored, as the old caller did.
      state.effectStates = new Map(runningEffectStates);

      expect(state.effectStates.get('scar')).toBeUndefined();
    });

    it('a non-threading caller gets its write on state.effectStates directly', () => {
      // The other two call sites (`phaseMovement`, `unifiedActionResolution`) do not
      // thread, so `raiseEffectEvent` owns the assignment for them and `effectStates`
      // comes back undefined rather than as an empty map to be misread as a loss.
      const { state } = harmWithStackingWard();

      const applied = applyActionTriggerPayloads(state, 'actor-hero', [grant(HARM)], state.tick);

      expect(applied.effectStates).toBeUndefined();
      expect(state.effectStates?.get('scar')?.stacks).toBe(1);
    });
  });
});
