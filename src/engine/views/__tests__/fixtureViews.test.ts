/**
 * THR-1822 slice 1 on a hand-built graph: hexContents agrees with
 * buildHexActorIndex, a Place resolves to its Location's hex, a hidden Place is
 * absent, a siege stays a siege, every slice-1 view model is plain data, and the
 * two D15 writes bump worldVersion so a cached view model re-reads.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime } from '../../simulationRuntime';
import { buildHexActorIndex } from '../../hexActorIndex';
import { recordStoryBeatDismissed } from '../../phaseAttention';
import { recordJourneyChoice } from '../../journeyEngine';
import type { GameState } from '../../../types/gameState';
import type { JourneyVignetteData } from '../../../types/journeyEngine';
import { readView, type ViewSelector } from '../readView';
import { hexContentsIndexSelector, hexContentsSelector } from '../hexContents';
import { mapArmiesAndBattlesSelector } from '../map/armiesAndBattles';
import { mapAgentsSelector } from '../map/agents';
import { mapThreadLinesSelector } from '../map/threadLines';
import { mapPlacesSelector } from '../map/places';
import { mapCompaniesSelector } from '../map/companies';
import { mapActivitySelector } from '../map/activityIcons';
import { assertSerialisable } from './viewContract';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';

const ASC = 'asc';

function fixture(): { graph: WorldGraph; state: GameState } {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Hawkgate', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'inn', type: 'location', name: 'The Gilded Inn', properties: { parentLocationId: 'town', sublocationTypeId: 'inn', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'crypt', type: 'location', name: 'The Hidden Crypt', properties: { parentLocationId: 'town', sublocationTypeId: 'crypt', hidden: true } });
  graph.addEdge({ id: 'e_town_inn', source: 'town', target: 'inn', type: 'contains', properties: {} });
  graph.addEdge({ id: 'e_town_crypt', source: 'town', target: 'crypt', type: 'contains', properties: {} });
  graph.addNode({ id: 'wild', type: 'location', name: 'Thornwood', properties: { locationType: 'forest', hexCol: 5, hexRow: 5 } });
  graph.addNode({ id: 'ann', type: 'actor', name: 'Ann', properties: { actorType: 'individual', locationId: 'inn', spotlightTier: 'notable' } });
  graph.addNode({ id: 'bo', type: 'actor', name: 'Bo', properties: { actorType: 'individual', locationId: 'town' } });
  graph.addNode({ id: 'cy', type: 'actor', name: 'Cy', properties: { actorType: 'individual', locationId: 'wild', deceased: true } });
  graph.addEdge({ id: 'e_ann_at', source: 'ann', target: 'inn', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e_bo_at', source: 'bo', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e_thread_ann', source: ASC, target: 'ann', type: 'thread', properties: { courtPosition: 'retinue', beatHistory: [] } });
  // A faction, an army in it, and a siege at the town.
  graph.addNode({ id: 'faction_def_iron_band', type: 'actor', name: 'The Iron Band', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'army1', type: 'actor', name: 'Iron Host', properties: { actorType: 'group', armyState: { headcount: 120 } } });
  graph.addEdge({ id: 'e_army_at', source: 'army1', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e_army_member', source: 'army1', target: 'faction_def_iron_band', type: 'member_of', properties: {} });
  graph.addNode({ id: 'siege1', type: 'actor', name: 'Siege of Hawkgate', properties: { actorType: 'group', battleState: { battleType: 'siege', attackerArmyId: 'army1' } } });
  graph.addEdge({ id: 'e_siege_at', source: 'siege1', target: 'town', type: 'located_at', properties: {} });
  const state = { graph, ascendantId: ASC, tick: 12, unifiedActions: [], encounterProgress: [] } as unknown as GameState;
  return { graph, state };
}

describe('hexContents (fixture)', () => {
  it('people per hex equal buildHexActorIndex; the dead are absent', () => {
    const { graph, state } = fixture();
    const index = readView(null, state, hexContentsIndexSelector, undefined);
    for (const [key, ids] of buildHexActorIndex(graph).byHex) {
      expect(index[key].people.map(p => p.ref.id)).toEqual(ids);
    }
    expect(index['3,4'].people.map(p => p.name)).toEqual(['Ann', 'Bo']);
    expect(index['5,5'].people).toEqual([]);
  });

  it('a Place sits on its Location\'s hex; a hidden Place is absent', () => {
    const { state } = fixture();
    const hex = readView(null, state, hexContentsSelector, { hexKey: '3,4' });
    expect(hex.locations).toEqual([{ ref: { kind: 'location', id: 'town' }, name: 'Hawkgate' }]);
    expect(hex.places.map(p => p.ref)).toEqual([{ kind: 'sublocation', id: 'inn' }]);
  });

  it('an empty hex is an empty row set, not a throw', () => {
    const { state } = fixture();
    expect(readView(null, state, hexContentsSelector, { hexKey: '9,9' })).toEqual({ hexKey: '9,9', col: 9, row: 9, people: [], locations: [], places: [] });
  });
});

describe('map selectors (fixture)', () => {
  it('a siege stays a siege, and the army carries its faction index and headcount', () => {
    const { state } = fixture();
    const vm = readView(null, state, mapArmiesAndBattlesSelector, undefined);
    expect(vm.battles).toEqual([{ id: 'siege1', hexCol: 3, hexRow: 4, isSiege: true, attackerName: 'The Iron Band' }]);
    expect(vm.armies).toEqual([{ armyId: 'army1', hexCol: 3, hexRow: 4, factionIndex: 0, factionDefId: 'iron_band', headcount: 120, isInBattle: false }]);
  });

  it('map.places lists Locations only, never Places', () => {
    const { state } = fixture();
    const vm = readView(null, state, mapPlacesSelector, undefined);
    expect(vm.map(p => p.name)).toEqual(['Hawkgate', 'Thornwood']);
  });

  it('every slice-1 view model is plain data', () => {
    const { state } = fixture();
    const runtime = createSimulationRuntime();
    const cases: Array<[ViewSelector<unknown, unknown>, unknown]> = [
      [mapAgentsSelector as ViewSelector<unknown, unknown>, { avatarNodeId: 'bo' }],
      [mapThreadLinesSelector as ViewSelector<unknown, unknown>, { avatarNodeId: 'bo', hexSize: 10 }],
      [mapCompaniesSelector as ViewSelector<unknown, unknown>, { hexSize: 10 }],
      [mapActivitySelector as ViewSelector<unknown, unknown>, { hexSize: 10, threadedAgentIds: ['ann'], telemetryVersion: 0, actionsVersion: 0 }],
      [mapPlacesSelector as ViewSelector<unknown, unknown>, undefined],
      [mapArmiesAndBattlesSelector as ViewSelector<unknown, unknown>, undefined],
      [hexContentsIndexSelector as ViewSelector<unknown, unknown>, undefined],
      [hexContentsSelector as ViewSelector<unknown, unknown>, { hexKey: '3,4' }],
    ];
    for (const [sel, args] of cases) {
      const vm = readView(runtime, state, sel, args);
      assertSerialisable(vm, sel.id);
      // Determinism: a fresh build deep-equals the cached one.
      expect(readView(null, state, sel, args), sel.id).toEqual(vm);
    }
    const lines = readView(runtime, state, mapThreadLinesSelector, { avatarNodeId: 'bo', hexSize: 10 });
    expect(lines.map(l => [l.agentId, l.courtPosition])).toEqual([['ann', 'retinue']]);
  });
});

describe('map.activity keys on the action lists (review-gate finding, THR-1822)', () => {
  it('an action added out of tick shows once the host bumps actionsVersion, with no worldVersion bump', () => {
    const { state } = fixture();
    const runtime = createSimulationRuntime();
    const args = { hexSize: 10, threadedAgentIds: [] as string[], telemetryVersion: 0, actionsVersion: 1 };
    expect(readView(runtime, state, mapActivitySelector, args)).toEqual([]);
    const template = UNIFIED_ACTION_TEMPLATES[0];
    const withAction = {
      ...state,
      unifiedActions: [{ actionId: 'a1', templateId: template.id, actorId: 'bo', resolved: false }],
    } as unknown as GameState;
    const v0 = runtime.worldVersion;
    const rows = readView(runtime, withAction, mapActivitySelector, { ...args, actionsVersion: 2 });
    expect(runtime.worldVersion).toBe(v0);
    expect(rows.map(r => r.agentId)).toEqual(['bo']);
  });
});

describe('D15 — out-of-tick writes bump worldVersion', () => {
  const probe: ViewSelector<void, { beat: unknown; at: unknown }> = {
    id: 'test.pacing',
    invalidation: 'world',
    key: () => '',
    fallback: () => ({ beat: null, at: null }),
    build: (ctx) => {
      const p = ctx.graph.getNode(ctx.ascendantId)!.properties;
      return { beat: p.pacingActiveStoryBeat ?? null, at: p.pacingLastCompletedTick ?? null };
    },
  };

  it('recordStoryBeatDismissed clears the beat, bumps worldVersion, and a cached view model re-reads', () => {
    const { graph, state } = fixture();
    graph.getNode(ASC)!.properties.pacingActiveStoryBeat = 'beat_1';
    const runtime = createSimulationRuntime();
    const before = readView(runtime, state, probe, undefined);
    expect(before.beat).toBe('beat_1');
    const v0 = runtime.worldVersion;
    expect(recordStoryBeatDismissed(graph, runtime, ASC, 12)).toBe(true);
    expect(runtime.worldVersion).toBe(v0 + 1);
    expect(readView(runtime, state, probe, undefined)).toEqual({ beat: null, at: 12 });
  });

  it('recordStoryBeatDismissed writes nothing when the ascendant is gone', () => {
    const { graph } = fixture();
    const runtime = createSimulationRuntime();
    expect(recordStoryBeatDismissed(graph, runtime, 'nobody', 1)).toBe(false);
    expect(runtime.worldVersion).toBe(0);
  });

  it('recordJourneyChoice records the beat on the thread edge and bumps worldVersion', () => {
    const { graph, state } = fixture();
    const runtime = createSimulationRuntime();
    const edgeProbe: ViewSelector<void, number> = {
      id: 'test.beats',
      invalidation: 'world',
      key: () => '',
      fallback: () => -1,
      build: (ctx) => ((ctx.graph.getOutgoingEdges(ASC, 'thread')[0].properties.beatHistory as unknown[]) ?? []).length,
    };
    expect(readView(runtime, state, edgeProbe, undefined)).toBe(0);
    const vignette = {
      agentId: 'ann', phase: 'call', tick: 12, templateId: 't', variantKey: 'v', stateSnapshot: {},
      doomClockPercent: 0, isOrdeal: false,
      choices: [{ id: 'c1', label: 'Go', effects: {} }],
    } as unknown as JourneyVignetteData;
    const v0 = runtime.worldVersion;
    expect(recordJourneyChoice(graph, runtime, ASC, vignette, 'c1', 12)).toBe(true);
    expect(runtime.worldVersion).toBe(v0 + 1);
    expect(readView(runtime, state, edgeProbe, undefined)).toBe(1);
  });

  it('recordJourneyChoice writes nothing without a thread to the mortal', () => {
    const { graph } = fixture();
    const runtime = createSimulationRuntime();
    const vignette = { agentId: 'bo', choices: [] } as unknown as JourneyVignetteData;
    expect(recordJourneyChoice(graph, runtime, ASC, vignette, 'c1', 12)).toBe(false);
    expect(runtime.worldVersion).toBe(0);
  });
});
