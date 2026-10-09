/**
 * THR-1761 prototype — NEVER MERGED (lives on proto/thr-1761-band-buys).
 *
 * Where does a god's holding actually sit, band-wise? Under the settled THR-1760 formula,
 * reads the band of (a) every latent essence-source host, (b) every place, (c) the six
 * best-matched mortals a scripted player would thread, for four god vectors on three
 * seeds at tick 0 and tick N. Its output is the band input for the THR-1761 economy run
 * (`scripts/proto-band-economy-1761.mjs`).
 *
 *   npx esbuild scripts/proto-band-holdings-1761.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/proto-band-holdings.mjs --external:fs --external:path && \
 *   node .cache/proto-band-holdings.mjs --seeds 42,99,7 --ticks 240
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology, SPHERE_OPPOSITIONS } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { getLocationNodes } from '../src/engine/sublocationShape';
import { readEssenceSource } from '../src/engine/essenceSources';
import type { GameState } from '../src/types/gameState';
import type { SphereName } from '../src/types/sphereAffinity';

type Scores = Partial<Record<SphereName, number>>;

// The settled THR-1760 cut (Docs/audits/2026-10-09-thr-1760-dominion-formula-cut-prototype.md).
const PAIR_STRENGTH: Record<SphereName, number> = {
  chaos: 1, order: 1, light: 1, darkness: 1,
  force: 0.6, mind: 0.6, life: 0.8, entropy: 0.8,
  energy: 0.4, spirit: 0.4, matter: 0.4, time: 0.4,
};
const BANDS = ['Hostile', 'Foreign', 'Touched', 'Held', 'Sovereign'] as const;
type Band = typeof BANDS[number];
const CUT = { foreign: -1.5, touched: 0.5, held: 1.5, sovereign: 3 };
const POWER_BASELINE = 3;
const THREADED_MORTALS = 6;

function match(points: Scores, obj: Scores): number {
  let num = 0, den = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    if (!p) continue;
    num += p * ((obj[s] ?? 0) - PAIR_STRENGTH[s] * (obj[SPHERE_OPPOSITIONS[s]] ?? 0));
    den += p;
  }
  return den > 0 ? num / den : 0;
}
function band(m: number, power: number): Band {
  const d = m > 0 ? m * power : m;
  if (d >= CUT.sovereign) return 'Sovereign';
  if (d >= CUT.held) return 'Held';
  if (d >= CUT.touched) return 'Touched';
  if (d >= CUT.foreign) return 'Foreign';
  return 'Hostile';
}
const scoresOf = (n: { properties: Record<string, unknown> }): Scores =>
  ((n.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores) ?? {};
const count = (bs: Band[]) => BANDS.map(b => bs.filter(x => x === b).length).join('/');

const a = process.argv.slice(2);
const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const seeds = get('--seeds', '42,99,7').split(',').map(Number);
const ticks = Number(get('--ticks', '240'));
const map = get('--map', 'medium') as MapSizePreset;
const out: Record<string, unknown> = {};

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'BandProto', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const read = (s: GameState) => {
    const g = s.graph;
    const god = g.getNode(s.ascendantId);
    const gp = (god?.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores ?? {};
    const power = (Object.values(gp).reduce((x, y) => x + (y ?? 0), 0) / POWER_BASELINE) || 1;
    const places = getLocationNodes(g);
    const sourceHosts = g.getNodesByType('location').filter(n => readEssenceSource(n.properties));
    const mortals = g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
    return { tick: s.tick, power, places, sourceHosts, mortals, alignment: god?.properties.sphereAlignment as { primary?: SphereName; secondary?: SphereName } | undefined };
  };
  const snaps = [read(state)];
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  snaps.push(read(state));

  const al = snaps[0].alignment;
  const gods: Record<string, Scores> = {
    [`world-god ${al?.primary}3/${al?.secondary}2`]: al?.primary ? { [al.primary]: 3, [al.secondary!]: 2 } : {},
    'shepherd life3/spirit2': { life: 3, spirit: 2 },
    'showcase mind3/spirit2': { mind: 3, spirit: 2 },
    'spread life2/matter2/mind1': { life: 2, matter: 2, mind: 1 },
  };
  console.log(`\n## seed ${seed} (${map}) — world god ${al?.primary}/${al?.secondary}`);
  const seedOut: Record<string, unknown> = {};
  for (const [gname, pts] of Object.entries(gods)) {
    for (const sn of snaps) {
      const placeBands = sn.places.map(n => band(match(pts, scoresOf(n)), sn.power));
      const srcBands = sn.sourceHosts.map(n => band(match(pts, scoresOf(n)), sn.power));
      const mortalMatches = sn.mortals.map(n => match(pts, scoresOf(n))).sort((x, y) => y - x);
      const best = mortalMatches.slice(0, THREADED_MORTALS).map(m => band(m, sn.power));
      const row = {
        power: +sn.power.toFixed(2),
        places: count(placeBands),
        sourceHosts: count(srcBands),
        sourceHostCount: srcBands.length,
        mortals: count(mortalMatches.map(m => band(m, sn.power))),
        best6Mortals: best.join(','),
        best6MortalMatch: mortalMatches.slice(0, THREADED_MORTALS).map(m => +m.toFixed(2)),
      };
      seedOut[`${gname}|t${sn.tick}`] = row;
      console.log(`  ${gname.padEnd(28)} t${String(sn.tick).padEnd(4)} pf=${row.power}  places[H/F/T/Hd/S]=${row.places}  sourceHosts(${row.sourceHostCount})=${row.sourceHosts}  mortals=${row.mortals}  best6=${row.best6Mortals} (${row.best6MortalMatch.join(' ')})`);
    }
  }
  out[String(seed)] = seedOut;
}
writeFileSync(get('--out', '.cache/proto-band-holdings-1761.json'), JSON.stringify(out, null, 1));
