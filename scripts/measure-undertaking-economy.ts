/**
 * THR-1937 S1 — undertakings in the economy, measured on real seeded worlds.
 *
 * Runs each seed for `--ticks` (default 600) and reports, per seed:
 *   - towns founded by a mortal, and how many a faction rules (the kill criterion: a run
 *     with no founded town paying tax to any faction means the ruler rule picks nothing);
 *   - Done-when "Taxed": every faction-ruled founded town is in its ruler's last pay day's
 *     `taxHolderOf`, or is a ruin;
 *   - Done-when "Free ground": no two place-tier settlements share a hex that did not at tick 0;
 *   - lanes a mortal founded and tolls, and guilds founded with a calling.
 *
 * `--fingerprint N` instead prints a hash of every `controls`, `owns` and `trades_with`
 * edge at tick N (the rollback Done-when compares it against main with the switch off).
 *
 * Usage: npm run measure:undertaking-economy [-- --seeds 42,99,7 --ticks 600 --map medium]
 */

import { createHash } from 'node:crypto';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { readPurseDay } from '../src/engine/factionPurse';
import { isSettlement } from '../src/engine/factionPurse/income';
import { getLocationNodes } from '../src/engine/sublocationShape';
import { RUINED_SETTLEMENT_PROSPERITY_FLOOR } from '../src/data/strategic-action-constants';
import type { WorldGraph } from '../src/engine/graph';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 600);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;
const FINGERPRINT = argValue('--fingerprint');

function settlementHexes(graph: WorldGraph): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const n of getLocationNodes(graph)) {
    if (!isSettlement(n)) continue;
    const key = `${n.properties.hexCol},${n.properties.hexRow}`;
    const list = out.get(key);
    if (list) list.push(n.id); else out.set(key, [n.id]);
  }
  return out;
}

function edgeFingerprint(graph: WorldGraph): string {
  const rows: string[] = [];
  for (const type of ['controls', 'owns', 'trades_with'] as const) {
    for (const e of graph.getEdgesByType(type)) {
      const p = e.properties ?? {};
      rows.push([type, e.source, e.target, p.controlledBy ?? '', p.taxRate ?? '', p.influence ?? ''].join('|'));
    }
  }
  rows.sort();
  return `${rows.length} edges, sha1 ${createHash('sha1').update(rows.join('\n')).digest('hex').slice(0, 16)}`;
}

function runSeed(seed: number) {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'UndertakingEconomyMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const sharedAtStart = new Set([...settlementHexes(state.graph)].filter(([, ids]) => ids.length > 1).map(([k]) => k));

  const ticks = FINGERPRINT ? Number(FINGERPRINT) : TICKS;
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  const g = state.graph;
  if (FINGERPRINT) return `seed ${seed} t${state.tick}: ${edgeFingerprint(g)}`;

  const founded = g.getEdgesByType('controls').filter(e => e.properties?.via === 'founded' && g.getNode(e.target));
  const factionRuled = founded.filter(e => g.getNode(e.source)?.properties.actorType === 'faction');
  const untaxed: string[] = [];
  let taxed = 0;
  let ruined = 0;
  for (const e of factionRuled) {
    const town = g.getNode(e.target)!;
    const prosperity = typeof town.properties.prosperity === 'number' ? town.properties.prosperity : 0;
    if (prosperity <= RUINED_SETTLEMENT_PROSPERITY_FLOOR) { ruined++; continue; }
    const day = readPurseDay(g.getNode(e.source));
    // A town founded since the ruler's last pay day has not had a pay day yet.
    const foundedTick = typeof e.properties?.establishedTick === 'number' ? e.properties.establishedTick : 0;
    if (day?.taxHolderOf.includes(town.id)) taxed++;
    else if (day && day.tick < foundedTick) taxed++;
    else untaxed.push(`${town.name}←${g.getNode(e.source)?.name}`);
  }
  const shared = [...settlementHexes(g)].filter(([k, ids]) => ids.length > 1 && !sharedAtStart.has(k));
  const lanes = g.getEdgesByType('trades_with').filter(e => {
    const by = e.properties?.controlledBy;
    return typeof by === 'string' && g.getNode(by)?.properties.actorType === 'individual'
      && g.getNodesByType('location').some(n => n.properties.routeEdgeId === e.id
        && g.getOutgoingEdges(n.id, 'constructed_by').some(c => c.target === by));
  });
  const guilds = g.getNodesByType('actor').filter(n => n.properties.actorType === 'faction'
    && typeof n.properties.guildType === 'string' && g.getOutgoingEdges(n.id, 'commanded_by').length > 0);

  return [
    `seed ${seed} t${state.tick}: founded towns ${founded.length} (faction-ruled ${factionRuled.length}, founder-ruled ${founded.length - factionRuled.length})`,
    `  taxed ${taxed} / ruined ${ruined} / untaxed ${untaxed.length}${untaxed.length ? ` — ${untaxed.slice(0, 5).join(', ')}` : ''}`,
    `  new shared settlement hexes: ${shared.length}${shared.length ? ` — ${shared.slice(0, 3).map(([k, ids]) => `${k}: ${ids.join('+')}`).join('; ')}` : ''}`,
    `  founded lanes tolled by founder: ${lanes.length}; founded guilds with a calling: ${guilds.length} (${guilds.map(n => n.properties.guildType).join(', ')})`,
  ].join('\n');
}

for (const seed of SEEDS) console.log(runSeed(seed));
