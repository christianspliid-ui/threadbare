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
 * Each arm asserts two things, and needs both: that the grant happened at all
 * (otherwise the duration assertion is vacuously true over an empty list), and that
 * the total survives the round trip as a number.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentAttachments, type AttachmentFullEntry } from '../agentAttachments';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { instantiateReward, REWARD_CONDITION_DEFAULT_TICKS } from '../rewardPool';
import { processEncounterConditions } from '../phaseEncounterTraits';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { CONDITION_WOUNDED_DURATION, CONDITION_TERRIFIED_DURATION } from '../../data/condition-trait-content';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

// The phase writer gates on a template `category`, which it reads through
// `getAnyEncounterById`. Only that one lookup is replaced — the rest of the content
// module stays real, so nothing else in the import graph changes shape.
vi.mock('../../data/encounter-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/encounter-content')>();
  return {
    ...actual,
    getAnyEncounterById: (id: string) =>
      id === PHASE_COMBAT_ENCOUNTER_ID
        ? { id, category: 'combat', threatRating: 'hard' }
        : actual.getAnyEncounterById(id),
  };
});

const HERO = 'actor-hero';
const START_TICK = 10;
const PHASE_COMBAT_ENCOUNTER_ID = 'enc.test.combat';

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

/** Same, for an arm that grants more than one condition — named, never positional. */
function readCondition(
  graph: WorldGraph,
  traitId: string,
): AttachmentFullEntry {
  const entry = getAgentAttachments(graph, HERO).conditions.find(c => c.id === traitId);
  expect(entry, `expected a granted condition ${traitId}`).toBeDefined();
  return entry!;
}

describe('THR-1484 — has_trait duration contract across every writer', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('aftermath apply_condition — the writer that was already correct', () => {
    const graph = buildGraph();
    addConditionDefinition(graph, 'trait.condition.inspired');
    const reaction: EncounterAftermathReaction = {
      id: 'react-apply', label: 'Apply',
      effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.inspired', durationTicks: 8 }],
    } as unknown as EncounterAftermathReaction;

    const { state: next } = applyEncounterAftermathReaction(
      buildState(graph), makeAction(), reaction, START_TICK, runtime,
    );

    const condition = readSoleCondition(next.graph);
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

  it('phaseEncounterTraits.processEncounterConditions — the ticket\'s named writer', () => {
    const graph = buildGraph();
    // This path seeds its own definition nodes via `ensureTraitNodes`, so the
    // graph starts bare on purpose — that seeding is part of the path under test.
    processEncounterConditions(
      graph, HERO, PHASE_COMBAT_ENCOUNTER_ID,
      /* stepSuccess */ false, /* isCompleted */ true, START_TICK,
    );

    // A failed hard combat encounter grants both conditions this path can mint on
    // failure — wounded and terrified. Both go through the same `assignCondition`
    // write, so both are in scope here.
    const wounded = readCondition(graph, 'trait.condition.wounded');
    expect(wounded.totalTicks).toBe(CONDITION_WOUNDED_DURATION);
    expect(wounded.ticksRemaining).toBe(CONDITION_WOUNDED_DURATION);

    const terrified = readCondition(graph, 'trait.condition.terrified');
    expect(terrified.totalTicks).toBe(CONDITION_TERRIFIED_DURATION);
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
    instantiateReward(graph, 'tpl.condition.reward', HERO, START_TICK);
    processEncounterConditions(
      graph, HERO, PHASE_COMBAT_ENCOUNTER_ID, false, true, START_TICK,
    );

    const durationBearing = graph.getOutgoingEdges(HERO, 'has_trait')
      .filter(e => e.properties.ticksRemaining != null);
    expect(durationBearing.length).toBeGreaterThanOrEqual(2); // both writers fired

    for (const edge of durationBearing) {
      expect(edge.properties.durationTicks, `edge ${edge.id} must carry durationTicks`).toBeTypeOf('number');
      expect(edge.properties.totalTicks, `edge ${edge.id} must not carry totalTicks`).toBeUndefined();
    }
  });
});
