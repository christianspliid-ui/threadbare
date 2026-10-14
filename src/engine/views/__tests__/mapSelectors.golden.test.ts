// @vitest-lane heavy — builds a small generated world and ticks it 40 times, then compares every moved map selector with the GameView memo it replaced (THR-1822)
/**
 * THR-1822 slice 1 — golden equivalence on a generated world.
 *
 * Each map selector, plus the host adapter that applies the scene's render
 * constants, must return exactly what GameView's memo returned on the same state
 * (`legacyMapMemos.ts` is that memo, copied verbatim). The world gets a few extra
 * thread edges so the thread-line, agent and activity paths have rows to compare.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../orchestrator';
import { resetReputationTraitInit } from '../../phaseReputationTraits';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime, touchWorld, type SimulationRuntime } from '../../simulationRuntime';
import { getAvatarsOf } from '../../graphQueries';
import { buildHexActorIndex } from '../../hexActorIndex';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import { HEX_CONSTANTS } from '../../../components/HexMapV2/scene/HexFillMesh';
import { toAgentRenderData, toArmyRenderData, toActivityIconData } from '../../../components/Game/map/mapViewAdapters';
import { readView } from '../readView';
import { mapAgentsSelector } from '../map/agents';
import { mapThreadLinesSelector } from '../map/threadLines';
import { mapCompaniesSelector } from '../map/companies';
import { mapActivitySelector } from '../map/activityIcons';
import { mapPlacesSelector } from '../map/places';
import { mapArmiesAndBattlesSelector } from '../map/armiesAndBattles';
import { hexContentsIndexSelector } from '../hexContents';
import { lensViewSelector } from '../lenses/lensView';
import { ensureDominionProjection } from '../../simulationRuntime';
import { dominionLensVM, godPrimarySphere } from '../../dominionViewModels';
import { VIEW_SELECTORS } from '../selectors';
import { assertSerialisable } from './viewContract';
import { buildViewContext } from '../viewContext';
import { getOriginPortraitUrl } from '../../../data/avatar-portrait-assets';
import { getSphereSymbol } from '../../../data/sphereIcons';
import {
  legacyAgentRenderData,
  legacyThreadLineData,
  legacyCompanyRenderData,
  legacyActivityIconData,
  legacyLocationNodes,
  legacyArmiesAndBattles,
  type LegacyInputs,
} from './legacyMapMemos';

const SEED = 42;
const TICKS = 40;
/** Extra threads planted so the thread paths have rows. */
const PLANTED_THREADS = 4;
/** ≈8× the worst lane figure for a 40-tick small world (THR-1517 rule). */
const WORLD_TIMEOUT_MS = 120_000;

let state: GameState;
let runtime: SimulationRuntime;
let tiles: HexTile[];
let inputs: LegacyInputs;

beforeAll(() => {
  resetEventCounter();
  resetDecisionCache();
  resetReputationTraitInit();
  runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, SEED)[0];
  const init = initializeGameState(archetype, 'Seam', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  state = init.state;
  tiles = init.tiles;
  for (let t = 0; t < TICKS; t++) state = runTick(state, [], runtime);

  const threaded = new Set(state.graph.getOutgoingEdges(state.ascendantId, 'thread').map(e => e.target));
  const candidates = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true && !threaded.has(n.id))
    .slice(0, PLANTED_THREADS);
  candidates.forEach((n, k) => {
    state.graph.addEdge({
      id: `thr1822_thread_${k}`,
      source: state.ascendantId,
      target: n.id,
      type: 'thread',
      properties: { courtPosition: k % 2 === 0 ? 'retinue' : 'watched' },
    });
  });
  touchWorld(runtime);

  const avatar = getAvatarsOf(state.graph, state.ascendantId)[0];
  const threadedIds = state.graph.getOutgoingEdges(state.ascendantId, 'thread').map(e => e.target);
  inputs = {
    state,
    runtime,
    avatarNodeId: avatar?.id ?? threadedIds[0] ?? null,
    sphereColor: '#abcdef',
    originFragmentId: undefined,
    primarySphere: archetype.sphereAlignment.primary,
    threadedAgentIds: threadedIds,
  };
}, WORLD_TIMEOUT_MS);

const hexSize = HEX_CONSTANTS.HEX_SIZE;

describe('THR-1822 map selectors reproduce the GameView memos (generated world)', () => {
  it('map.agents + toAgentRenderData equals agentRenderData', () => {
    const rows = readView(runtime, state, mapAgentsSelector, { avatarNodeId: inputs.avatarNodeId ?? null }, tiles);
    const adapted = toAgentRenderData(rows, {
      portraitUrl: getOriginPortraitUrl(inputs.originFragmentId ?? ''),
      sphereColor: inputs.sphereColor,
      sigil: getSphereSymbol(inputs.primarySphere),
    });
    const legacy = legacyAgentRenderData(inputs);
    expect(legacy.length).toBeGreaterThan(0);
    expect(adapted).toEqual(legacy);
  });

  it('map.threadLines equals threadLineData', () => {
    const vm = readView(runtime, state, mapThreadLinesSelector, { avatarNodeId: inputs.avatarNodeId ?? null, hexSize }, tiles);
    const legacy = legacyThreadLineData(inputs);
    expect(legacy.length).toBeGreaterThan(0);
    expect(vm).toEqual(legacy);
  });

  it('map.companies equals companyRenderData', () => {
    const vm = readView(runtime, state, mapCompaniesSelector, { hexSize }, tiles);
    expect(vm).toEqual(legacyCompanyRenderData(inputs));
  });

  it('map.activity + toActivityIconData equals activityIconData', () => {
    const rows = readView(runtime, state, mapActivitySelector, {
      hexSize, threadedAgentIds: inputs.threadedAgentIds, telemetryVersion: runtime.balanceTelemetryVersion, actionsVersion: 0,
    }, tiles);
    expect(toActivityIconData(rows)).toEqual(legacyActivityIconData(inputs));
  });

  it('map.places equals locationNodes', () => {
    const vm = readView(runtime, state, mapPlacesSelector, undefined, tiles);
    const legacy = legacyLocationNodes(inputs);
    expect(legacy.length).toBeGreaterThan(0);
    expect(vm).toEqual(legacy);
  });

  it('map.armiesAndBattles + toArmyRenderData equals the army/battle memo', () => {
    const vm = readView(runtime, state, mapArmiesAndBattlesSelector, undefined, tiles);
    const legacy = legacyArmiesAndBattles(inputs);
    expect(toArmyRenderData(vm.armies)).toEqual(legacy.armyRenderData);
    expect(vm.battles).toEqual(legacy.battleRenderData);
  });

  it('the Dominion lens arm deep-equals dominionLensVM on the same projection', () => {
    const projection = ensureDominionProjection(runtime, state.graph, tiles, state.ascendantId, state.tick);
    const expected = dominionLensVM(projection, godPrimarySphere(state.graph, state.ascendantId), [], true);
    const vm = readView(runtime, state, lensViewSelector, { lensId: 'dominion', stamp: 'golden' }, tiles);
    expect(vm).toEqual(expected);
  });

  it('the lens keeps the same object across a tick while its projection stamp holds (review-gate finding)', () => {
    const args = { lensId: 'dominion' as const, stamp: 'held-stamp' };
    const first = readView(runtime, state, lensViewSelector, args, tiles);
    touchWorld(runtime);
    expect(readView(runtime, state, lensViewSelector, args, tiles)).toBe(first);
    expect(readView(runtime, state, lensViewSelector, { ...args, stamp: 'moved' }, tiles)).not.toBe(first);
  });

  it('hexContents people per hex equal buildHexActorIndex on the generated world', () => {
    const index = readView(runtime, state, hexContentsIndexSelector, undefined, tiles);
    const actorIndex = buildHexActorIndex(state.graph);
    let compared = 0;
    for (const [key, ids] of actorIndex.byHex) {
      expect(index[key]?.people.map(p => p.ref.id)).toEqual(ids);
      compared++;
    }
    expect(compared).toBeGreaterThan(0);
    const withPeople = Object.values(index).filter(h => h.people.length > 0).length;
    expect(withPeople).toBe(actorIndex.byHex.size);
  });

  it('every registered selector builds a serialisable view model on the generated world', () => {
    const args: Record<string, unknown> = {
      avatarNodeId: inputs.avatarNodeId ?? null,
      hexSize,
      threadedAgentIds: inputs.threadedAgentIds,
      telemetryVersion: runtime.balanceTelemetryVersion,
      actionsVersion: 0,
      lensId: 'dominion',
      stamp: 'serialisable',
      hexKey: Object.keys(readView(runtime, state, hexContentsIndexSelector, undefined, tiles))[0] ?? '0,0',
    };
    for (const sel of VIEW_SELECTORS) {
      const vm = readView(runtime, state, sel, args, tiles);
      assertSerialisable(vm, sel.id);
      // Determinism: a fresh build at the same versions deep-equals the cached one.
      expect(sel.build(ctxOf(), args), sel.id).toEqual(vm);
    }
  });
});

// ── helpers ────────────────────────────────────────────────────────────────

function ctxOf() {
  return buildViewContext(runtime, state, tiles);
}
