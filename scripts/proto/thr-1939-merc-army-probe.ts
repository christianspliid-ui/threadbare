// Throwaway census for THR-1939 (design lane 2026-10-18a). Never committed.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { createSimulationRuntime } from '../../src/engine/simulationRuntime';

const DAYS = 12;
const TPD = 12;
const seeds = [42];

function isMerc(p: Record<string, unknown>): boolean {
  const s = `${p.factionType ?? ''} ${p.factionDefId ?? ''} ${p.factionClass ?? ''} ${p.guildType ?? ''}`.toLowerCase();
  return s.includes('mercenar');
}

for (const seed of seeds) {
  resetEventCounter();
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  const runtime = createSimulationRuntime();
  let { state } = initializeGameState(archetype, 'merc', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const g = () => state.graph;
  const factions = () => g().getNodesByType('actor').filter((n) => n.properties.actorType === 'faction');
  const mercs = factions().filter((n) => isMerc(n.properties as Record<string, unknown>));
  console.log(`\n=== seed ${seed}: ${factions().length} factions, ${mercs.length} mercenary companies`);
  for (const m of mercs) {
    const p = m.properties as Record<string, unknown>;
    console.log(`  ${m.id} "${p.name}" type=${p.factionType} defId=${p.factionDefId} class=${p.factionClass}`);
  }
  const armies = () => g().getNodesByType('actor').filter((a) => (a.properties as Record<string, unknown>).groupKind === 'army');
  const armyCount = (fid: string) => armies().filter((a) => g().getOutgoingEdges(a.id, 'member_of').some((e) => e.target === fid)).length;
  const allArmies = () => armies().length;
  const oaths = () => g().getEdgesByType('sworn_to' as never) as unknown as { type: string; source: string; target: string; properties: Record<string, unknown> }[];
  const sample = (day: number) => {
    const os = oaths();
    const row = mercs.map((m) => {
      const n = g().getNode(m.id);
      if (!n) return `${m.id}:gone`;
      const w = Number((n.properties as Record<string, unknown>).wealth ?? 0).toFixed(1);
      const sw = os.find((e) => e.source === m.id);
      return `${m.id}: w=${w} armies=${armyCount(m.id)}${sw ? ` sworn->${sw.target}(${sw.properties.kind})` : ''}`;
    }).join(' | ');
    console.log(`  day ${day}: allArmies=${allArmies()} oaths=${os.length} || ${row}`);
  };
  sample(0);
  for (let d = 1; d <= DAYS; d++) {
    for (let t = 0; t < TPD; t++) state = runTick(state, [], runtime);
    for (const a of armies()) { const f = g().getOutgoingEdges(a.id, 'member_of')[0]?.target ?? ''; if (!f.includes('mercenary')) continue; const st = (a.properties as any).armyState; console.log('  d'+d+' '+a.id+' cohesion='+Number(st.cohesion).toFixed(1)+'/'+st.cohesionMax+' supply='+Number(st.supply).toFixed(1)+' paidThrough='+st.paidThroughTick+' obj='+JSON.stringify(st.objective?.type ?? st.objective ?? null)); }
  }
  // who are the oath kinds overall
  const kinds: Record<string, number> = {};
  for (const e of oaths()) kinds[String(e.properties.kind)] = (kinds[String(e.properties.kind)] ?? 0) + 1;
  console.log(`  oath kinds at day ${DAYS}: ${JSON.stringify(kinds)}`);
}
