/**
 * Delve admission scans from lead holders — old-scan equivalence (THR-1663, seeded
 * things stay alive S2 item 4).
 *
 * `phaseDelveAdmission` used to walk every actor × every location each tick. It now
 * walks only the mortals holding a live `located` lead. The inline snapshots below
 * were recorded against the **old** every-actor scan before it was replaced, so a
 * change in who is admitted, who is queued, in what order, or which leads are spent
 * fails here. The worlds are dense on purpose: several holders sharing a hex, two
 * ruins on one hex, saga/major caps that queue, vague and spent leads, leads on a
 * ruin the holder is not standing on, and mortal ruins either side of the decay
 * window.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { RUINED_SETTLEMENT_DELVE_DECAY_TICKS } from '../../../data/strategic-action-constants';
import { phaseDelveAdmission } from '../delveVariant';
import { mulberry32 } from '../../../lib/prng';

function makeState(tick: number, graph: WorldGraph): GameState {
  return {
    tick,
    seed: 42,
    graph,
    ascendantId: 'god-1',
    activeDelves: [],
    delveAdmissionQueue: [],
    chronicleEntries: [],
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

const PRECISIONS = ['vague', 'narrowed', 'located', 'located'] as const;

/** A seeded dense world: 5×5 hexes, ruins and mortals scattered, leads everywhere. */
function denseWorld(seed: number, tick: number): WorldGraph {
  const rng = mulberry32(seed);
  const pick = (n: number) => Math.floor(rng() * n);
  const graph = new WorldGraph();
  graph.addNode({ id: 'god-1', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });

  // Ruins first so location order interleaves with the mortals' own Locations below.
  const ruinIds: string[] = [];
  for (let i = 0; i < 8; i++) {
    const id = `ruin-${i}`;
    const col = pick(3);
    const row = pick(3);
    const magnitude = [0.2, 0.5, 0.8][pick(3)];
    if (i % 3 === 2) {
      graph.addNode({
        id, type: 'location', name: id,
        properties: {
          locationSubtype: 'ruins', ruinedTick: pick(2) === 0 ? 0 : tick, ruinMagnitude: magnitude,
          hexCol: col, hexRow: row,
        },
      });
    } else {
      graph.addNode({
        id, type: 'location', name: id,
        properties: { locationType: 'elder_ruin', hexCol: col, hexRow: row, ruinMagnitude: magnitude },
      });
    }
    ruinIds.push(id);
  }

  for (let a = 0; a < 40; a++) {
    const id = `agent-${a}`;
    const loc = `loc-${a}`;
    graph.addNode({ id, type: 'actor', name: id, properties: { actorType: a % 5 === 4 ? 'faction' : 'individual' } });
    graph.addNode({ id: loc, type: 'location', name: loc, properties: { hexCol: pick(3), hexRow: pick(3) } });
    graph.addEdge({ id: `at-${a}`, source: id, target: loc, type: 'located_at', properties: {} });
    const leads = pick(6);
    for (let c = 0; c < leads; c++) {
      const ruinId = ruinIds[pick(ruinIds.length)];
      graph.addEdge({
        id: `clue-${a}-${c}`, source: id, target: ruinId, type: 'knows_clue_of',
        properties: {
          magnitude: 0.5, precision: PRECISIONS[pick(PRECISIONS.length)],
          source: 'tavern_rumor', discoveredTick: 1, consumed: pick(6) === 0,
        },
      });
    }
  }
  return graph;
}

/** What the phase decided, in the order it decided it. */
function digest(state: GameState, patch: Partial<GameState>): string {
  const delves = (patch.activeDelves ?? []).map(d => `${d.agentId}>${d.ruinId}:${d.delveScale}`);
  const queued = (patch.delveAdmissionQueue ?? []).map(q => `${q.agentId}>${q.ruinId}:${q.admissionBlockedReason}`);
  const liveLeads = state.graph.getEdgesByType('knows_clue_of').length;
  return `admit[${delves.join(' ')}] queue[${queued.join(' ')}] leads=${liveLeads}`;
}

function run(seed: number, tick: number): string {
  const graph = denseWorld(seed, tick);
  const state = makeState(tick, graph);
  const first = phaseDelveAdmission(state);
  const second = phaseDelveAdmission({ ...state, ...first, tick: tick + 1 });
  return `${digest(state, first)} | then ${digest(state, second)}`;
}

describe('phaseDelveAdmission — scanning from lead holders admits exactly what the full scan did (THR-1663)', () => {
  const tick = RUINED_SETTLEMENT_DELVE_DECAY_TICKS + 5;

  it('seed 1', () => {
    expect(run(1, tick)).toMatchInlineSnapshot(`"admit[agent-26>ruin-6:minor agent-34>ruin-4:minor] queue[] leads=79 | then admit[agent-26>ruin-6:minor agent-34>ruin-4:minor] queue[] leads=79"`);
  });
  it('seed 7', () => {
    expect(run(7, tick)).toMatchInlineSnapshot(`"admit[agent-2>ruin-7:minor agent-8>ruin-4:major agent-11>ruin-6:minor] queue[] leads=72 | then admit[agent-2>ruin-7:minor agent-8>ruin-4:major agent-11>ruin-6:minor] queue[] leads=72"`);
  });
  it('seed 42', () => {
    expect(run(42, tick)).toMatchInlineSnapshot(`"admit[agent-0>ruin-3:saga agent-35>ruin-5:minor] queue[agent-23>ruin-6:saga_active agent-34>ruin-4:saga_active] leads=86 | then admit[agent-0>ruin-3:saga agent-35>ruin-5:minor] queue[agent-23>ruin-6:saga_active agent-34>ruin-4:saga_active] leads=86"`);
  });
  it('seed 99', () => {
    expect(run(99, tick)).toMatchInlineSnapshot(`"admit[agent-24>ruin-3:major agent-28>ruin-6:major agent-37>ruin-4:minor] queue[] leads=73 | then admit[agent-24>ruin-3:major agent-28>ruin-6:major agent-37>ruin-4:minor] queue[] leads=73"`);
  });
  it('seed 3', () => {
    expect(run(3, tick)).toMatchInlineSnapshot(`"admit[agent-1>ruin-4:saga] queue[agent-9>ruin-0:saga_active] leads=86 | then admit[agent-1>ruin-4:saga] queue[agent-9>ruin-0:saga_active] leads=86"`);
  });
  it('seed 11', () => {
    expect(run(11, tick)).toMatchInlineSnapshot(`"admit[agent-3>ruin-0:major agent-8>ruin-2:major agent-32>ruin-4:minor] queue[] leads=70 | then admit[agent-3>ruin-0:major agent-8>ruin-2:major agent-32>ruin-4:minor] queue[] leads=70"`);
  });
  it('seed 2026', () => {
    expect(run(2026, tick)).toMatchInlineSnapshot(`"admit[agent-25>ruin-5:major agent-30>ruin-0:major agent-30>ruin-1:minor agent-38>ruin-2:minor] queue[agent-36>ruin-3:major_cap] leads=50 | then admit[agent-25>ruin-5:major agent-30>ruin-0:major agent-30>ruin-1:minor agent-38>ruin-2:minor] queue[agent-36>ruin-3:major_cap] leads=50"`);
  });
});
