// @vitest-lane heavy
/**
 * THR-1959 — the restless road on a generated world: the decision phase reads
 * the drought, runs the check once, and on `set_out` moves her and lands one
 * Chronicle entry whose names are declared links.
 *
 * Heavy (a generated medium world and real ticks): runs in `npm run test:heavy`.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { runTick, resetEventCounter } from '../orchestrator';
import { createSimulationRuntime, touchStructure } from '../simulationRuntime';
import { getThreadTo, getAgentLocationId } from '../graphQueries';
import { resolveLocationToHex } from '../encounterAwareness';
import { isRoutineTemplate } from '../attentionCadence';
import { hexDistance } from '../../lib/hexMath';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { STORY_DROUGHT_TICKS, MAX_AWARENESS_HOPS, EDGE_HEX_AWARENESS_BONUS, MAX_COMPLETIONS_PER_TEMPLATE } from '../../data/agent-behavior-constants';
import type { RestlessRoadTrace } from '../../types/trace';
import type { GameState } from '../../types/gameState';

const FIRST = 'ind_dev_the_first';

/** Seed 42 medium with The First bonded in pause mode and her drought aged past the threshold. */
function setup(retireNearbyStories: boolean) {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, createBalancedCosmology(), 'medium') as { state: GameState };
  devSeedTheFirst(state);
  touchStructure(runtime);
  if (retireNearbyStories) {
    // One tick builds the encounter cache; then every story within her awareness is
    // one she has told to retirement, so the nearest story she may draw lies beyond it.
    state = runTick(state, [], runtime);
    const home = resolveLocationToHex(state.graph, getAgentLocationId(state.graph, FIRST)!)!;
    const range = MAX_AWARENESS_HOPS + EDGE_HEX_AWARENESS_BONUS + 1;
    const attemptCount: Record<string, number> = {};
    for (const e of runtime.encounterCache!.getAllEntries()) {
      const hex = resolveLocationToHex(state.graph, e.locationId);
      if (hex && hexDistance(home, hex) <= range && !isRoutineTemplate(e.templateId)) attemptCount[e.templateId] = MAX_COMPLETIONS_PER_TEMPLATE;
    }
    state.graph.getNode(FIRST)!.properties.familiarityRecord = { attemptCount };
  }
  const thread = getThreadTo(state.graph, FIRST)!;
  state.graph.updateEdge(thread.id, { properties: { lastStoryChapterStartTick: state.tick - STORY_DROUGHT_TICKS - 10, attentionMode: 'pause' } });
  return { runtime, state };
}

function runUntilRoad(runtime: ReturnType<typeof createSimulationRuntime>, start: GameState) {
  let state = start;
  clearTraces();
  enableTracing();
  const roads: RestlessRoadTrace[] = [];
  for (let i = 0; i < 40; i++) {
    state = runTick(state, [], runtime);
    for (const t of getTraces()) {
      if (t.category === 'agent.restless_road' && t.agentId === FIRST) roads.push(t as unknown as RestlessRoadTrace);
    }
    clearTraces();
  }
  return { state, roads };
}

describe('THR-1959 — the restless road on the seeded medium world', () => {
  it('with a story at home, the drought is checked once and she stays', () => {
    const { runtime, state: s0 } = setup(false);
    const { state, roads } = runUntilRoad(runtime, s0);
    // 40 ticks < RESTLESS_ROAD_COOLDOWN_TICKS: one check, not one per decision.
    expect(roads.map(r => r.outcome)).toEqual(['story_at_home']);
    expect(roads[0].droughtTicks).toBeGreaterThanOrEqual(STORY_DROUGHT_TICKS);
    const props = getThreadTo(state.graph, FIRST)!.properties as Record<string, unknown>;
    expect(props.restlessRoadCheckTick).toBe(roads[0].tick);
    expect(props.lastRestlessRoadTick).toBeUndefined();
  });

  it('with every nearby story told out, she sets out, moves, and the Chronicle names both as links', () => {
    const { runtime, state: s0 } = setup(true);
    const { state, roads } = runUntilRoad(runtime, s0);
    expect(roads).toHaveLength(1);
    const road = roads[0];
    expect(road.outcome).toBe('set_out');
    expect(road.toLocationId).toBeTruthy();
    expect(road.hexDistance).toBeGreaterThan(0);
    expect(road.storyTemplateIds.length).toBeGreaterThan(0);
    const props = getThreadTo(state.graph, FIRST)!.properties as Record<string, unknown>;
    expect(props.lastRestlessRoadTick).toBe(road.tick);
    const entry = state.chronicleEntries.find(e => e.id === `restless_road_${FIRST}_${road.tick}`);
    expect(entry?.prose).toMatch(/^.+ grows restless and takes the road to .+\.$/);
    const refs = entry?.segments?.filter(s => s.ref).map(s => s.ref!);
    expect(refs?.map(r => r.kind)).toEqual(['agent', expect.stringMatching(/^(location|sublocation)$/)]);
    expect(refs?.[1].id).toBe(road.toLocationId);
  });
});
