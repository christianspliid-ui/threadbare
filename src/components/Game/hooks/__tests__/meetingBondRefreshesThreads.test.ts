// @vitest-environment jsdom
/**
 * THR-1704 — after the bond, the Threads panel lists The First without a tick.
 *
 * Cold playtest round 2: *"I bound Thessa in a cinematic, then came back to the
 * map and Threads said 'No Threads'."* The bond mutates the live graph in place,
 * so `gameState.graph` keeps its identity and the hook's `threadedNodes` /
 * `retinueAgents` memos return their pre-bond results until `worldVersion` moves.
 * The clock comes back paused, so nothing else moves it.
 *
 * These tests drive the real hook across the real bond with no tick in between —
 * the paused shape the player saw — and a falsification arm proving the bare
 * `createAgentFromMeeting` call reproduces the stale panel, so the fix is pinned
 * to the touch rather than to some incidental re-render.
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAgentInteraction } from '../useAgentInteraction';
import { bondFirstFromMeeting } from '../../meetingBond';
import { WorldGraph } from '../../../../engine/graph';
import { createAgentFromMeeting } from '../../../../engine/meetingEncounter';
import { createSimulationRuntime } from '../../../../engine/simulationRuntime';
import { generateArchetypes } from '../../../../engine/ascendant';
import { SPHERE_NAMES } from '../../../../types';
import { VALUE_PAIRS } from '../../../../types/agent';
import { REACH_DOMAINS } from '../../../../types/traits';
import type { GameState } from '../../../../types/gameState';
import type { EssencePool } from '../../../../types/influence';
import type { MeetingEncounterResult } from '../../../../types/meetingEncounter';

const ASCENDANT_ID = 'asc';
const LOCATION_ID = 'loc_village';
const FIRST_NAME = 'Thessa';
const TICK = 10;

const ARCHETYPE = generateArchetypes(1, 42)[0];
const ESSENCE: EssencePool = Object.fromEntries(
  SPHERE_NAMES.map(s => [s, 10]),
) as EssencePool;

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'life', secondary: 'spirit' },
      firstSlotCooldownUntil: 0,
    },
  });
  graph.addNode({
    id: LOCATION_ID,
    type: 'location',
    name: 'Ashenmoor',
    properties: { locationType: 'settlement', locationSubtype: 'hamlet', cultureId: 'culture_1' },
  });
  return {
    graph,
    tick: TICK,
    seed: 42,
    ascendantId: ASCENDANT_ID,
    essencePool: ESSENCE,
    familiarityMap: new Map(),
    agentKnowledge: new Map(),
    unifiedActions: [],
    encounterProgress: [],
    premonitionQueue: [],
    controlEffects: [],
  } as unknown as GameState;
}

function makeResult(): MeetingEncounterResult {
  const profile = {} as MeetingEncounterResult['axiologicalProfile'];
  for (const pair of VALUE_PAIRS) (profile as Record<string, number>)[pair] = 0;
  const caps = {} as MeetingEncounterResult['reachCapabilities'];
  for (const r of REACH_DOMAINS) (caps as Record<string, number>)[r] = 0.3;
  return {
    name: FIRST_NAME,
    archetypeId: 'iron_heart',
    cultureId: 'culture_1',
    axiologicalProfile: profile,
    reachCapabilities: caps,
    primaryReach: 'iron',
    secondaryReach: 'heart',
    sphere: 'force',
    cooperationStrategy: 'tit-for-tat',
    foundingGateTags: ['heroic_origin'],
    traitSeeds: [],
    portraitAssetPath: '/assets/meet-the-first/thessa.jpg',
    appearanceSeed: 12345,
    meetingChoiceRecord: {
      encounterTick: TICK,
      locationId: LOCATION_ID,
      candidateIndex: 0,
      archetypeId: 'iron_heart',
      dilemmaChoices: [],
      sparkVisionId: 'spark_invest_iron',
      ascendantSphere: 'life',
      foundingGateTags: ['heroic_origin'],
    },
    locationId: LOCATION_ID,
  };
}

function renderInteraction() {
  const state = makeState();
  const runtime = createSimulationRuntime();
  const hook = renderHook(() =>
    useAgentInteraction({
      gameState: state,
      setGameState: () => undefined,
      archetype: ARCHETYPE,
      onOpenScry: () => undefined,
      runtime,
      omniscienceMode: true,
    }),
  );
  return { ...hook, state, runtime };
}

const threadedAgentNames = (nodes: { category: string; name?: string }[]) =>
  nodes.filter(n => n.category === 'agent').map(n => n.name);

describe('Meet The First bond refreshes the Threads panel without a tick (THR-1704)', () => {
  it('lists The First in threadedNodes and the retinue immediately after the bond', () => {
    const { result, rerender, state, runtime } = renderInteraction();
    expect(threadedAgentNames(result.current.threadedNodes)).toEqual([]);
    const before = runtime.worldVersion;

    let agentId = '';
    act(() => {
      agentId = bondFirstFromMeeting(state.graph, makeResult(), ASCENDANT_ID, TICK, runtime);
    });
    // The host re-renders (setMeetingState / setGameState); no tick runs.
    rerender();

    expect(runtime.worldVersion).toBeGreaterThan(before);
    expect(threadedAgentNames(result.current.threadedNodes)).toContain(FIRST_NAME);
    expect(result.current.retinueAgents.map(a => a.id)).toContain(agentId);
  });

  it('FALSIFICATION — the bare createAgentFromMeeting call leaves the panel stale', () => {
    // The pre-fix host call. If this ever shows The First, the memo keys have
    // changed and the assertions above no longer prove the touch is what fixes it.
    const { result, rerender, state, runtime } = renderInteraction();
    const before = runtime.worldVersion;

    act(() => {
      createAgentFromMeeting(state.graph, makeResult(), ASCENDANT_ID, TICK);
    });
    rerender();

    expect(runtime.worldVersion).toBe(before);
    expect(threadedAgentNames(result.current.threadedNodes)).toEqual([]);
  });
});
