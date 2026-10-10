/**
 * THR-1765 prototype — NEVER MERGED (lives on proto/thr-1765-god-power).
 *
 * What the god's own power does to the map. Builds the tick-0 world per seed (as THR-1760 did),
 * reads every top-level place, individual and faction under the settled THR-1760 cut
 * (cut B, w = pair strength, power widens the positive side only), and prints the band census
 * at a grid of power factors, so the power-growth decision can see how much turf power alone
 * hands the god — with no Claim, no Shift, no threaded mortal.
 *
 *   npx esbuild scripts/proto-power-census-1765.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/proto-power-census-1765.mjs --external:fs --external:path && \
 *   node .cache/proto-power-census-1765.mjs --seeds 42,99,7 > scripts/proto-power-census-1765.out.txt
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology, SPHERE_OPPOSITIONS } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { getFactionSphereScores } from '../src/engine/sphereAffinity';
import { getLocationNodes } from '../src/engine/sublocationShape';
import type { GameState } from '../src/types/gameState';
import type { SphereName } from '../src/types/sphereAffinity';

type Scores = Partial<Record<SphereName, number>>;

const PAIR_STRENGTH: Record<SphereName, number> = {
  chaos: 1, order: 1, light: 1, darkness: 1,
  force: 0.6, mind: 0.6, life: 0.8, entropy: 0.8,
  energy: 0.4, spirit: 0.4, matter: 0.4, time: 0.4,
};
// THR-1760 settled cut B
const CUT = { foreign: -1.5, touched: 0.5, held: 1.5, sovereign: 3 };
const BANDS = ['Hostile', 'Foreign', 'Touched', 'Held', 'Sovereign'] as const;
const POWER_GRID = [1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3, 10 / 3, 4];

function match(points: Scores, obj: Scores): number {
  let num = 0, den = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    if (!p) continue;
    num += p * ((obj[s] ?? 0) - PAIR_STRENGTH[s] * (obj[SPHERE_OPPOSITIONS[s]] ?? 0));
    den += p;
  }
  return den > 0 ? num / den : 0;
}
function bandIdx(m: number, power: number): number {
  const d = m > 0 ? m * power : m;
  if (d >= CUT.sovereign) return 4;
  if (d >= CUT.held) return 3;
  if (d >= CUT.touched) return 2;
  if (d >= CUT.foreign) return 1;
  return 0;
}

function collect(state: GameState) {
  const g = state.graph;
  const scoresOf = (n: { properties: Record<string, unknown> }): Scores =>
    ((n.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores) ?? {};
  return {
    place: getLocationNodes(g).filter(n => !n.properties.parentLocationId).map(scoresOf),
    individual: g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual').map(scoresOf),
    faction: g.getNodesByType('actor').filter(n => n.properties.actorType === 'faction').map(n => getFactionSphereScores(n)),
  };
}

const a = process.argv.slice(2);
const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const seeds = get('--seeds', '42,99,7').split(',').map(Number);
const map = get('--map', 'medium') as MapSizePreset;

console.log('# THR-1765 — band census by god power (cut B, pair-strength opposition, power widens the positive side only)');
console.log('# columns per power factor: Hostile Foreign Touched Held Sovereign · "free" = places above Foreign that were Foreign at power 1');

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  const { state } = initializeGameState(archetype, 'PowerProto', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const god = state.graph.getNode(state.ascendantId);
  const align = god?.properties.sphereAlignment as { primary?: SphereName; secondary?: SphereName } | undefined;
  const godScores = ((god?.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores) ?? {};
  const kinds = collect(state);
  const vectors: Record<string, Scores> = {
    [`world-god ${align?.primary}3/${align?.secondary}2`]: align?.primary ? { [align.primary]: 3, [align.secondary!]: 2 } : {},
    'shepherd life3/spirit2': { life: 3, spirit: 2 },
    'showcase mind3/spirit2': { mind: 3, spirit: 2 },
    'stone force3/matter2': { force: 3, matter: 2 },
    'spread life2/matter2/mind1': { life: 2, matter: 2, mind: 1 },
  };
  const sum = Object.values(godScores).reduce((x, y) => x + (y ?? 0), 0);
  console.log(`\n## seed ${seed} (${map}) — places ${kinds.place.length}, individuals ${kinds.individual.length}, factions ${kinds.faction.length}; god seeded scores sum ${sum}`);
  for (const [vname, pts] of Object.entries(vectors)) {
    console.log(`\n### ${vname}`);
    for (const [kind, objs] of Object.entries(kinds)) {
      const ms = objs.map(o => match(pts, o));
      const pos = ms.filter(m => m > 0).sort((x, y) => x - y);
      const q = (p: number) => (pos.length ? pos[Math.min(pos.length - 1, Math.floor(p * pos.length))] : 0).toFixed(2);
      console.log(`  ${kind}: positive-match ${pos.length}/${ms.length} (p25 ${q(0.25)} p50 ${q(0.5)} p75 ${q(0.75)} max ${q(0.999)})`);
      for (const P of POWER_GRID) {
        const c = [0, 0, 0, 0, 0];
        let free = 0;
        for (const m of ms) { const b = bandIdx(m, P); c[b]++; if (b >= 2 && bandIdx(m, 1) <= 1) free++; }
        console.log(`    P=${P.toFixed(2)}  ${c.map(n => String(n).padStart(4)).join(' ')}   free ${free}`);
      }
    }
  }
}
