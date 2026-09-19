/**
 * THR-1484 — every writer of a duration-bearing `has_trait` edge spells the
 * authored total `durationTicks`, and the one reader hands it back as a numeric
 * `totalTicks`.
 *
 * ─── The defect ──────────────────────────────────────────────────
 * `readEdgeDuration` (agentAttachments.ts) reads `durationTicks` and *exposes* it
 * to the UI as `totalTicks`. That name collision — view prop vs edge property —
 * let two writers mint the total under the unread spelling `totalTicks`. The
 * condition still decayed correctly, because decay counts `ticksRemaining`, which
 * every writer set; only the *display* total went missing. So:
 *
 * - `AttachmentDetailView`'s Duration section never rendered (gated on `totalTicks`)
 * - `AttachmentRow`'s progress bar had no denominator
 *
 * ─── Why a contract test and not three unit assertions ───────────
 * The ticket named two writers. A third — `rewardPool.instantiateReward` — was the
 * one actually producing the damage: in a seed-42 medium world at tick 60, 13 of the
 * 14 duration-bearing condition edges came from it, every one unreadable. A test
 * that pins only the writers someone thought of is how the third one got there.
 * Each arm below drives a writer through its **real** grant path and then reads back
 * through the **real** reader, so a fourth writer that invents a fourth name fails
 * here rather than shipping a blank Duration row.
 *
 * ─── Two writers, not three (THR-1503) ───────────────────────────
 * The ticket's named writer, `phaseEncounterTraits.processEncounterConditions`,
 * is gone. It gated on a template `category` no shipped template carries, and was
 * called only from the orchestrator's loop over the legacy `state.encounterProgress`
 * collection, which no production path populates (THR-1069). The arm that covered it
 * had to mock `getAnyEncounterById` to reach the path at all — the one mocked arm in
 * a contract test whose whole point is real grant paths. That arm and its mock went
 * with the function. Conditions are consequences authored on the aftermath path and
 * drawn from the reward pool; those are the writers below.
 *
 * Each arm asserts two things, and needs both: that the grant happened at all
 * (otherwise the duration assertion is vacuously true over an empty list), and that
 * the total survives the round trip as a number.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentAttachments, type AttachmentFullEntry } from '../agentAttachments';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { instantiateReward, REWARD_CONDITION_DEFAULT_TICKS } from '../rewardPool';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

const HERO = 'actor-hero';
const START_TICK = 10;

/** A graph carrying just the hero — condition definition nodes are seeded per arm. */
function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HERO, type: 'actor', name: 'Hero',
    properties: { actorType: 'individual' },
  });
  return graph;
}

function buildState(graph: WorldGraph): GameState {
  return {
    tick: START_TICK, seed: 42, cycle: 1, phase: 'playing', graph,
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
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: HERO, templateId: 'enc.test', targetId: HERO,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

/** Seed the one condition definition the aftermath arms point their edges at. */
function addConditionDefinition(graph: WorldGraph, id: string): void {
  graph.addNode({
    id, type: 'trait', name: 'Inspired',
    properties: { subcategory: 'condition', tags: ['#condition', '#positive'] },
  });
}

/** The aftermath writer: one `apply_condition` effect with an authored total. */
function applyInspired(graph: WorldGraph, runtime: SimulationRuntime, durationTicks: number): WorldGraph {
  const reaction: EncounterAftermathReaction = {
    id: 'react-apply', label: 'Apply',
    effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.inspired', durationTicks }],
  } as unknown as EncounterAftermathReaction;
  const { state: next } = applyEncounterAftermathReaction(
    buildState(graph), makeAction(), reaction, START_TICK, runtime,
  );
  return next.graph;
}

/**
 * The reader half of every arm: what the sheet and the progress bar actually see.
 * Returns the single condition entry, failing loudly if the grant never happened —
 * an empty list would make the duration assertion pass by vacuity.
 */
function readSoleCondition(graph: WorldGraph): AttachmentFullEntry {
  const { conditions } = getAgentAttachments(graph, HERO);
  expect(conditions).toHaveLength(1);
  return conditions[0];
}

describe('THR-1484 — has_trait duration contract across every writer', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('aftermath apply_condition — the writer that was already correct', () => {
    const graph = buildGraph();
    addConditionDefinition(graph, 'trait.condition.inspired');

    const condition = readSoleCondition(applyInspired(graph, runtime, 8));
    expect(condition.totalTicks).toBe(8);
    expect(condition.ticksRemaining).toBe(8);
  });

  it('rewardPool.instantiateReward — 13 of 14 live edges came from here, all unreadable', () => {
    const graph = buildGraph();
    // A reward *template* node: `instantiateReward` clones it and hangs the clone
    // off a has_trait edge. `ticksRemaining` on the template is the authored total.
    graph.addNode({
      id: 'tpl.condition.gale_touched', type: 'trait', name: 'Gale-Touched',
      properties: { subcategory: 'condition', ticksRemaining: 20, tier: 1, tags: ['#condition'] },
    });

    const result = instantiateReward(graph, 'tpl.condition.gale_touched', HERO, START_TICK);
    expect(result).not.toBeNull();
    expect(result!.category).toBe('condition');

    const condition = readSoleCondition(graph);
    expect(condition.totalTicks).toBe(20);
    expect(condition.ticksRemaining).toBe(20);
  });

  it('rewardPool.instantiateReward — falls back to the default total, still readable', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 'tpl.condition.no_authored_total', type: 'trait', name: 'Unspecified Ache',
      properties: { subcategory: 'condition', tier: 1, tags: ['#condition'] },
    });

    expect(instantiateReward(graph, 'tpl.condition.no_authored_total', HERO, START_TICK)).not.toBeNull();

    // The default matters as much as an authored value: it is what most reward
    // conditions actually ship with, and it went to the unread name too.
    expect(readSoleCondition(graph).totalTicks).toBe(REWARD_CONDITION_DEFAULT_TICKS);
  });

  it('no writer leaves the total under the unread `totalTicks` spelling', () => {
    // The falsification arm, stated over the edge rather than the view: `totalTicks`
    // on a has_trait edge is read by nothing, so any writer still using it is
    // shipping a blank Duration row. Asserted across every writer at once, because
    // the defect was always one writer disagreeing with the rest.
    const graph = buildGraph();
    graph.addNode({
      id: 'tpl.condition.reward', type: 'trait', name: 'Reward Condition',
      properties: { subcategory: 'condition', ticksRemaining: 20, tier: 1, tags: ['#condition'] },
    });
    addConditionDefinition(graph, 'trait.condition.inspired');
    instantiateReward(graph, 'tpl.condition.reward', HERO, START_TICK);
    const written = applyInspired(graph, runtime, 8);

    const durationBearing = written.getOutgoingEdges(HERO, 'has_trait')
      .filter(e => e.properties.ticksRemaining != null);
    expect(durationBearing.length).toBeGreaterThanOrEqual(2); // both live writers fired

    for (const edge of durationBearing) {
      expect(edge.properties.durationTicks, `edge ${edge.id} must carry durationTicks`).toBeTypeOf('number');
      expect(edge.properties.totalTicks, `edge ${edge.id} must not carry totalTicks`).toBeUndefined();
    }
  });
});
