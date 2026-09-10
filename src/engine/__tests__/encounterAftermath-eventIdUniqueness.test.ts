/**
 * THR-1447 — aftermath event ids must stay unique once `recentEvents` saturates.
 *
 * The defect these tests falsify: the four aftermath event mints suffixed their id
 * with `nextRecentEvents.length`, which is a *saturating* quantity — `appendRecentEvent`
 * slices to MAX_RECENT_EVENTS, so once the buffer is full the "uniquifier" is the
 * constant 100 forever. The id then degenerates to `<prefix>_<reactionId>_<tick>`,
 * which two resolutions of the same reaction on the same tick both mint.
 *
 * That is invisible in a short run (the buffer is still growing, so the suffix really
 * does vary) and appears only deep into a session — which is why it surfaced at tick 140
 * with an id ending in `_100`. Every test here therefore SATURATES the buffer first;
 * an unsaturated fixture passes against the unfixed code and proves nothing.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { MAX_RECENT_EVENTS, type GameState, type TickEvent } from '../../types/gameState';
import type { ClearanceGateRuntimeState } from '../../types/contentShells';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Ashara',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-2',
    type: 'actor',
    name: 'Berun',
    properties: { actorType: 'individual' },
  });

  return {
    tick: 53,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'asc-1',
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map<string, ClearanceGateRuntimeState>(),
  } as GameState;
}

/**
 * Fill `recentEvents` to exactly MAX_RECENT_EVENTS so `appendRecentEvent`'s
 * `slice(-MAX_RECENT_EVENTS)` is at its fixed point — the condition under which
 * the length suffix stops distinguishing anything.
 */
function saturateRecentEvents(state: GameState): GameState {
  const filler: TickEvent[] = Array.from({ length: MAX_RECENT_EVENTS }, (_, i) => ({
    id: `filler_${i}`,
    tick: 1,
    type: 'narrative',
    message: `filler ${i}`,
    significance: 0.1,
  }));
  return { ...state, recentEvents: filler };
}

function makeAction(actorId: string, actionId: string): UnifiedAction {
  return {
    actionId, actorId, templateId: 'enc.comet.turning',
    targetId: actorId, scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction;
}

/** One `recent_event` effect — the shape the observed collision came from. */
const REACTION: EncounterAftermathReaction = {
  id: 'anchored_react_deepen_the_anchor',
  label: 'Deepen the anchor.',
  effects: [
    {
      kind: 'recent_event',
      eventType: 'narrative',
      message: 'The old customs become covenants.',
      significance: 0.8,
    },
  ],
  closeAfterSelection: false,
};

describe('aftermath event id uniqueness on a saturated buffer (THR-1447)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('mints distinct ids when one reaction resolves twice on the same tick', () => {
    const base = saturateRecentEvents(createMinimalGameState());

    const first = applyEncounterAftermathReaction(
      base, makeAction('actor-1', 'ua_a'), REACTION, 53, runtime,
    ).state;
    const second = applyEncounterAftermathReaction(
      first, makeAction('actor-2', 'ua_b'), REACTION, 53, runtime,
    ).state;

    const minted = second.recentEvents.filter(e => e.id.startsWith('enc_after_'));
    // Both resolutions must have landed — if the buffer evicted one, the test would
    // pass vacuously on a single id rather than on two distinct ones.
    expect(minted).toHaveLength(2);
    expect(minted[0].id).not.toBe(minted[1].id);
  });

  it('leaves every id in the buffer unique after the same reaction fires repeatedly', () => {
    let state = saturateRecentEvents(createMinimalGameState());
    for (let i = 0; i < 12; i++) {
      state = applyEncounterAftermathReaction(
        state, makeAction('actor-1', `ua_${i}`), REACTION, 53, runtime,
      ).state;
    }

    const ids = state.recentEvents.map(e => e.id);
    const minted = ids.filter(id => id.startsWith('enc_after_'));
    expect(minted.length).toBeGreaterThan(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps ids distinct across ticks as well as within one', () => {
    let state = saturateRecentEvents(createMinimalGameState());
    for (const tick of [53, 54, 55]) {
      state = applyEncounterAftermathReaction(
        state, makeAction('actor-1', `ua_t${tick}`), REACTION, tick, runtime,
      ).state;
    }
    const minted = state.recentEvents.filter(e => e.id.startsWith('enc_after_')).map(e => e.id);
    expect(minted).toHaveLength(3);
    expect(new Set(minted).size).toBe(3);
  });
});
