// Scratch measurement for the design lane's mill-lease pass — never merged (proto branch only).
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit.ts';
import type { MapSizePreset } from '../src/engine/gameInit.ts';
import { runTick, resetEventCounter } from '../src/engine/orchestrator.ts';
import { createBalancedCosmology } from '../src/engine/cosmology.ts';
import { generateArchetypes } from '../src/engine/ascendant.ts';
import { createSimulationRuntime } from '../src/engine/simulationRuntime.ts';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits.ts';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer.ts';
import { isSettlement, isPurseFaction, affinityOf, guildPresenceIndex } from '../src/engine/factionPurse/income.ts';
import type { WorldGraph } from '../src/engine/graph.ts';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const IDS = ['encounter.town.mill_lease_auction', 'town.mill_lease_sealed', 'town.mill_lease_forfeit'];

function snapshot(graph: WorldGraph, label: string) {
  const towns = graph.getNodesByType('location').filter(n => isSettlement(n));
  const factions = graph.getNodesByType('actor').filter(n => isPurseFaction(n));
  const guilds = factions.filter(f => affinityOf(f) !== undefined);
  const presence = guildPresenceIndex(graph, guilds);
  let withMill = 0, millControlled = 0, withGuild = 0, withMillAndGuild = 0;
  const affCount: Record<string, number> = {};
  for (const t of towns) {
    const mills = graph.getOutgoingEdges(t.id, 'contains').map(e => graph.getNode(e.target))
      .filter(p => p && String(p.properties.sublocationTypeId ?? '') === 'sublocation-type.mill');
    const present = guilds.filter(g => presence.get(g.id)?.has(t.id));
    if (mills.length) withMill++;
    if (mills.some(m => m && graph.getIncomingEdges(m.id, 'controls').length > 0)) millControlled++;
    if (present.length) withGuild++;
    if (mills.length && present.length) withMillAndGuild++;
    for (const g of present) { const k = String(g.properties.guildType ?? g.properties.factionDefId); affCount[k] = (affCount[k] ?? 0) + 1; }
  }
  console.log(`${label}: towns=${towns.length} withMill=${withMill} millControlled=${millControlled} withGuildPresent=${withGuild} both=${withMillAndGuild} guildFactions=${guilds.length}/${factions.length} presentBy=${JSON.stringify(affCount)}`);
}

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); enableTracing();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Scratch', createBalancedCosmology(), seed, preset.cols, preset.rows);
  snapshot(state.graph, `seed ${seed} t0`);
  const hits: Record<string, number> = {};
  for (let i = 0; i < ticks; i++) {
    clearTraces();
    state = runTick(state, [], runtime);
    for (const t of getTraces()) {
      const s = JSON.stringify(t);
      for (const id of IDS) if (s.includes(`"${id}"`)) { const k = `${id}|${(t as any).category}`; hits[k] = (hits[k] ?? 0) + 1; }
    }
  }
  snapshot(state.graph, `seed ${seed} t${ticks}`);
  console.log(`seed ${seed} traces: ${JSON.stringify(hits)}`);
}
