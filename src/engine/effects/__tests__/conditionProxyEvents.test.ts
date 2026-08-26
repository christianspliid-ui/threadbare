/**
 * THR-1244 — the condition-based `damaged` / `healed` proxy (stage 6 of the
 * effect-vocabulary activation program).
 *
 * `damaged` and `healed` have been in the `EffectEvent` union, and mapped to
 * three trigger families, since the primitive architecture landed. Nothing ever
 * raised either one, because the game has no hit-point model to raise them from.
 * These tests assert the proxy that closes that: a harmful *condition* inflicted
 * is `damaged`, a harmful condition lifted early is `healed`.
 *
 * Two properties are asserted by their **absence**, and those are the tests that
 * carry the weight:
 *
 *   • **Natural expiry raises nothing.** "Healed" means lifted early; waiting out
 *     a wound is not being healed. A suite that only proved the firing half
 *     would pass just as happily against a proxy that raised `healed` on every
 *     `decayConditions` sweep — which would fire every ward in the world every
 *     time any bruise timed out.
 *   • **Polarity is a gate in both directions.** Gaining `blessed` is not damage
 *     and losing it is not a heal, so a proxy keyed on "a condition changed"
 *     rather than "a *harmful* condition changed" is wrong in a way a
 *     wound-only suite cannot see.
 *
 * The firing tests go end-to-end through `applyEncounterAftermathReaction` and
 * assert the downstream trigger actually moved — a stack incremented, an
 * attachment destroyed — rather than only that a trace appeared. A trace proves
 * the raise happened; it does not prove anything was reachable from it, and
 * unreachability behind a live-looking surface is the exact failure this whole
 * program exists to end.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { applyEncounterAftermathReaction } from '../../encounterAftermath';
import { decayConditions } from '../../conditionDecay';
import { seedEncounterTraitDefinitions } from '../../traitDefinitionSeeding';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../../simulationRuntime';
import { isHarmfulCondition, isPersonCarrier, HARMFUL_CONDITION_TAG } from '../conditionProxyEvents';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { STARTER_CONDITIONS } from '../../../data/starter-attachments';
import { ANOMALY_CONDITIONS } from '../../../data/anomaly-reward-catalog';
import { REWARD_CONDITIONS } from '../../../data/reward-attachment-catalog';
import { ECONOMIC_TRAIT_DEFINITIONS } from '../../../data/economic-trait-content';
import type { GraphNode } from '../../../types/graph';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect } from '../../../types/effects';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../../types/unifiedAction';

const WOUNDED = 'trait.condition.wounded';
const CURSED = 'trait.condition.cursed';
const BLESSED = 'trait.condition.blessed';
const PASS_CLOSED = 'trait.condition.location.pass_closed';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let edgeCounter = 0;
function eid() { return `e.proxy.${++edgeCounter}`; }

/**
 * A world holding one person, one army, one place — the three carrier shapes the
 * gate has to tell apart — plus the real seeded trait definitions, so a
 * definition that stopped shipping `#negative` fails these tests rather than
 * being papered over by a hand-built fixture node.
 */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-army', type: 'actor', name: 'The Ninth', properties: { actorType: 'group' } });
  graph.addNode({
    id: 'loc-pass', type: 'location', name: 'The Kingsteeth Pass',
    properties: { locationSubtype: 'waypoint', hexCol: 3, hexRow: 4 },
  });
  seedEncounterTraitDefinitions(graph);
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
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(), effectStates: new Map(),
  } as unknown as GameState;
}

function makeAction(targetId = 'actor-hero'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'actor-hero', templateId: 'enc.test', targetId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

function reactionOf(...effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'react-test', label: 'Test Reaction', effects };
}

/** Hang an effect-bearing possession on an agent, the way the walker expects to find it. */
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

function apply(state: GameState, runtime: SimulationRuntime, ...effects: EncounterAftermathReactionEffect[]) {
  return applyEncounterAftermathReaction(state, makeAction(), reactionOf(...effects), state.tick, runtime);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('THR-1244 — condition → damaged/healed proxy', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { edgeCounter = 0; clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  describe('the harm predicate reads a tag that actually ships', () => {
    it('every condition in EVERY catalog declares exactly one polarity', () => {
      // The plan doc called this "the wound/disease/curse subfamily". No such
      // field exists — `#negative` / `#positive` is the vocabulary the content
      // has. If a future condition ships with neither, the proxy silently stops
      // covering it, so this is the test that would notice.
      //
      // **Scope was widened from one catalog to all of them by THR-1257.** It used
      // to cover only `CONDITION_TRAIT_DEFINITIONS` — the catalog the three THR-1244
      // aftermath sites draw from — while the other four tagged topically (`#cursed`,
      // `#curse`, `#pain`, `#wound`, `#blessing`) with no polarity, so
      // `anomaly_vault_curse` classified as *not harm*. That was inert only while
      // `actionTriggerPayloads` raised nothing; wiring that fourth site made those
      // catalogs live, and 47 conditions were normalised in the same change.
      //
      // Enumerating the catalogs by import rather than by scanning `src/data` is
      // deliberate: a scan would silently pass on a *new* file it did not know to
      // look in, which is the failure mode this guard exists to prevent. A new
      // catalog must be added here, and that is the point.
      const catalogs: Array<[string, GraphNode[]]> = [
        ['condition-trait-content', CONDITION_TRAIT_DEFINITIONS],
        ['starter-attachments', STARTER_CONDITIONS],
        ['anomaly-reward-catalog', ANOMALY_CONDITIONS],
        ['reward-attachment-catalog', REWARD_CONDITIONS],
        ['economic-trait-content', ECONOMIC_TRAIT_DEFINITIONS],
      ];
      let checked = 0;
      for (const [catalog, defs] of catalogs) {
        const conditions = defs.filter(
          (d) => (d.properties as { subcategory?: string }).subcategory === 'condition',
        );
        // Guard the guard: an empty catalog would pass vacuously and report nothing.
        expect(conditions.length, `${catalog} contributed no conditions`).toBeGreaterThan(0);
        for (const def of conditions) {
          const tags = (def.properties as { tags?: string[] }).tags ?? [];
          const polarity = tags.filter((t) => t === '#negative' || t === '#positive');
          expect(polarity, `${catalog}/${def.id} declares no single polarity tag`).toHaveLength(1);
          checked++;
        }
      }
      // Pins the population so a catalog that stops exporting its conditions fails
      // here rather than shrinking the sweep to nothing and still reading green.
      expect(checked).toBe(60);
    });

    it('classifies wounds and curses as harm, boons as not', () => {
      const graph = buildState().graph;
      expect(isHarmfulCondition(graph, WOUNDED)).toBe(true);
      expect(isHarmfulCondition(graph, CURSED)).toBe(true);
      expect(isHarmfulCondition(graph, BLESSED)).toBe(false);
      // Fail-soft: an id with no node is not harm.
      expect(isHarmfulCondition(graph, 'trait.condition.does_not_exist')).toBe(false);
      expect(HARMFUL_CONDITION_TAG).toBe('#negative');
    });

    it('counts persons as carriers and armies, places and missing nodes as not', () => {
      const graph = buildState().graph;
      expect(isPersonCarrier(graph, 'actor-hero')).toBe(true);
      expect(isPersonCarrier(graph, 'actor-army')).toBe(false);
      expect(isPersonCarrier(graph, 'loc-pass')).toBe(false);
      expect(isPersonCarrier(graph, 'nobody')).toBe(false);
    });
  });

  describe('damaged — a harmful condition is inflicted', () => {
    it('apply_condition on a person raises damaged at the condition_inflicted site', () => {
      const state = buildState();
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, intensity: 0.6, durationTicks: 24,
      } as EncounterAftermathReactionEffect);

      const fired = raises('damaged');
      expect(fired).toHaveLength(1);
      expect(fired[0]).toMatchObject({ agentId: 'actor-hero', site: 'condition_inflicted', tick: 10 });
    });

    it('condition_attachment raises it too — the path the shipped wound content actually uses', () => {
      // Every `trait.condition.wounded` in the tavern package is authored as a
      // `condition_attachment`, not an `apply_condition`. Wiring only the latter
      // would have left the busiest infliction path silent while the stage read
      // as done, which is this program's signature failure.
      const state = buildState();
      apply(state, runtime, {
        kind: 'condition_attachment', templateId: WOUNDED,
      } as EncounterAftermathReactionEffect);

      expect(raises('damaged')).toHaveLength(1);
    });

    it('reaches the damaged reactive trigger and runs its nested effect', () => {
      const state = buildState();
      giveAttachment(state.graph, 'actor-hero', 'charm', [{
        type: 'reactive', trigger: 'damaged', cooldown: 0,
        effect: { type: 'spawn', what: 'encounter', template: 'test.omen', onHex: 'self' },
      } as AttachmentEffect]);

      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, durationTicks: 24,
      } as EncounterAftermathReactionEffect);

      expect(raises('damaged')[0]).toMatchObject({ reactivesFired: 1 });
      // The executor's own trace — proof the nested effect reached executeEffect,
      // not merely that the dispatcher matched it.
      const executed = getTraces().filter(
        (t) => (t as unknown as { effectType?: string }).effectType === 'spawn',
      );
      expect(executed).toHaveLength(1);
    });

    it('reaches the on_damaged stacking trigger', () => {
      const state = buildState();
      giveAttachment(state.graph, 'actor-hero', 'scar', [{
        type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 5, stackOn: 'on_damaged',
      } as AttachmentEffect]);

      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, durationTicks: 24,
      } as EncounterAftermathReactionEffect);

      expect(state.effectStates?.get('scar')?.stacks).toBe(1);
    });

    it('reaches the take_damage expiry event', () => {
      const state = buildState();
      giveAttachment(state.graph, 'actor-hero', 'ward', [{
        type: 'until_event', event: 'take_damage', reach: 'iron', value: 0.1, destroyOnEvent: true,
      } as AttachmentEffect]);

      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, durationTicks: 24,
      } as EncounterAftermathReactionEffect);

      expect(state.graph.getNode('ward')).toBeUndefined();
    });

    it('does NOT raise for a boon — gaining blessed is not damage', () => {
      const state = buildState();
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: BLESSED, durationTicks: 36,
      } as EncounterAftermathReactionEffect);

      expect(raises('damaged')).toHaveLength(0);
    });

    it('does NOT raise when the carrier is a place', () => {
      const state = buildState();
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: PASS_CLOSED,
        targetLocationId: 'loc-pass', durationTicks: 360,
      } as EncounterAftermathReactionEffect);

      // The edge lands — the gate is on the raise, not on the condition.
      expect(state.graph.getOutgoingEdges('loc-pass', 'has_trait').map((e) => e.target))
        .toContain(PASS_CLOSED);
      expect(raises()).toHaveLength(0);
    });
  });

  describe('healed — a harmful condition is lifted early', () => {
    it('remove_condition on a person raises healed at the condition_lifted site', () => {
      const state = buildState();
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, durationTicks: 24,
      } as EncounterAftermathReactionEffect);
      clearTraces();

      apply(state, runtime, {
        kind: 'remove_condition', conditionTraitId: WOUNDED,
      } as EncounterAftermathReactionEffect);

      const fired = raises('healed');
      expect(fired).toHaveLength(1);
      expect(fired[0]).toMatchObject({ agentId: 'actor-hero', site: 'condition_lifted' });
    });

    it('reaches the on_heal stacking trigger', () => {
      const state = buildState();
      giveAttachment(state.graph, 'actor-hero', 'mend', [{
        type: 'stacking', reach: 'heart', valuePerStack: 0.02, maxStacks: 5, stackOn: 'on_heal',
      } as AttachmentEffect]);
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, durationTicks: 24,
      } as EncounterAftermathReactionEffect);

      apply(state, runtime, {
        kind: 'remove_condition', conditionTraitId: WOUNDED,
      } as EncounterAftermathReactionEffect);

      expect(state.effectStates?.get('mend')?.stacks).toBe(1);
    });

    it('does NOT raise when the removal found nothing to lift', () => {
      // `remove_condition` traces `success: true` whether or not an edge existed
      // (deliberately — "a removal is not a promise"). A proxy keyed on that flag
      // would report a heal for every miss.
      const state = buildState();
      apply(state, runtime, {
        kind: 'remove_condition', conditionTraitId: WOUNDED,
      } as EncounterAftermathReactionEffect);

      expect(raises('healed')).toHaveLength(0);
    });

    it('does NOT raise when a boon is removed — losing blessed is not a heal', () => {
      const state = buildState();
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: BLESSED, durationTicks: 36,
      } as EncounterAftermathReactionEffect);
      clearTraces();

      apply(state, runtime, {
        kind: 'remove_condition', conditionTraitId: BLESSED,
      } as EncounterAftermathReactionEffect);

      expect(raises('healed')).toHaveLength(0);
    });
  });

  describe('natural expiry is silent — the half that keeps "early" honest', () => {
    it('a wound that runs out its own clock raises no healed', () => {
      const state = buildState();
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, durationTicks: 3,
      } as EncounterAftermathReactionEffect);
      clearTraces();

      // Decay past the countdown. `decayConditions` is the one tick-driven expiry
      // path (THR-761), and the proxy is deliberately not wired into it.
      let removed = 0;
      for (let t = 11; t <= 15; t++) removed += decayConditions(state.graph, t).length;

      expect(removed, 'the condition must actually have expired, or this asserts nothing')
        .toBe(1);
      expect(state.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .some((e) => e.target === WOUNDED)).toBe(false);
      expect(raises('healed')).toHaveLength(0);
    });

    it('and an early removal of the same condition DOES raise — the two paths differ', () => {
      // The controlled arm. Without it the test above passes against a proxy that
      // never raises `healed` from anywhere.
      const state = buildState();
      apply(state, runtime, {
        kind: 'apply_condition', conditionTraitId: WOUNDED, durationTicks: 3,
      } as EncounterAftermathReactionEffect);
      clearTraces();

      decayConditions(state.graph, 11); // one tick down, still 2 to run
      apply(state, runtime, {
        kind: 'remove_condition', conditionTraitId: WOUNDED,
      } as EncounterAftermathReactionEffect);

      expect(raises('healed')).toHaveLength(1);
    });
  });
});
