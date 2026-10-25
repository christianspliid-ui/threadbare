/**
 * THR-1918 — realm membership over a run, measured on real seeded worlds.
 *
 * Runs each seed for 600 ticks and reports, per faction at t0 / t300 / t600:
 *   - members (non-army, non-group actors with a `member_of` edge into the faction);
 *   - excommunications so far (from the faction action history plus `hostile_to`
 *     edges with reason `excommunicated`, since the history is capped);
 *   - the reputation and rival-membership of each excommunicated member at the moment
 *     it was struck (read from the graph on the tick before the action ran).
 *
 * Time: ~6–9 min per seed at 600 ticks on medium (≈0.8 s per tick, more as the world
 *       grows); one seed per command keeps a call under the 600 s command cap. The plan's
 *       three seeds (42,99,7) are three commands.
 * Usage: npm run measure:realm-membership [-- --seeds 42 --ticks 600 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import type { GameState } from '../src/types/gameState';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 600);
console.error('[THR-2041] ~6–9 min per seed at 600 ticks on medium; run one seed per command (600 s command cap).');
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;
const CHECKPOINTS = [0, Math.floor(TICKS / 2), TICKS];

interface MemberInfo { rep: number; rival: boolean }

function memberMap(state: GameState, factionId: string): Map<string, MemberInfo> {
  const g = state.graph;
  const rivals = new Set(g.getOutgoingEdges(factionId, 'relates_to')
    .filter(e => e.properties.isRival).map(e => e.target));
  const out = new Map<string, MemberInfo>();
  for (const e of g.getIncomingEdges(factionId, 'member_of')) {
    const n = g.getNode(e.source);
    if (!n || n.type !== 'actor') continue;
    if (n.properties.actorType === 'group' || n.properties.armyState != null) continue;
    const rival = g.getOutgoingEdges(n.id, 'member_of').some(me => rivals.has(me.target));
    out.set(n.id, { rep: (e.properties.reputation as number) ?? 0, rival });
  }
  return out;
}

function runSeed(seed: number): void {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'RealmMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const factions = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'faction');
  const rows = new Map<string, { cls: string; members: number[]; excomm: number[] }>();
  for (const f of factions) rows.set(f.id, { cls: String(f.properties.factionClass ?? '?'), members: [], excomm: [] });
  const excommCount = new Map<string, number>();
  const struck: { faction: string; cls: string; rep: number; rival: boolean; tick: number }[] = [];

  const snapshot = (): void => {
    for (const f of factions) {
      const r = rows.get(f.id)!;
      r.members.push(memberMap(state, f.id).size);
      r.excomm.push(excommCount.get(f.id) ?? 0);
    }
  };
  snapshot();

  for (let i = 0; i < TICKS; i++) {
    const before = new Map(factions.map(f => [f.id, memberMap(state, f.id)]));
    const hostileBefore = new Set(state.graph.getEdgesByType('hostile_to').map(e => e.id));
    state = runTick(state, [], runtime);
    for (const e of state.graph.getEdgesByType('hostile_to')) {
      if (hostileBefore.has(e.id) || e.properties.reason !== 'excommunicated') continue;
      excommCount.set(e.source, (excommCount.get(e.source) ?? 0) + 1);
      const info = before.get(e.source)?.get(e.target);
      struck.push({
        faction: e.source, cls: rows.get(e.source)?.cls ?? '?',
        rep: info?.rep ?? -1, rival: info?.rival ?? false, tick: state.tick,
      });
    }
    if (CHECKPOINTS.includes(state.tick)) snapshot();
  }

  console.log(`\n=== seed ${seed} (${MAP}, ${TICKS} ticks) ===`);
  console.log(`faction\tclass\tmembers ${CHECKPOINTS.join('/')}\texcomm ${CHECKPOINTS.join('/')}`);
  for (const [id, r] of rows) {
    console.log(`${id}\t${r.cls}\t${r.members.join(' → ')}\t${r.excomm.join(' → ')}`);
  }
  const byClass = new Map<string, { n: number; rival: number; repSum: number; lowRep: number }>();
  for (const s of struck) {
    const c = byClass.get(s.cls) ?? { n: 0, rival: 0, repSum: 0, lowRep: 0 };
    c.n++; if (s.rival) c.rival++; c.repSum += s.rep; if (s.rep < 0.2) c.lowRep++;
    byClass.set(s.cls, c);
  }
  for (const [cls, c] of byClass) {
    console.log(`struck ${cls}: ${c.n} (rival-dual ${c.rival}, rep<0.2 ${c.lowRep}, mean rep ${(c.repSum / c.n).toFixed(2)})`);
  }
}

for (const seed of SEEDS) runSeed(seed);
