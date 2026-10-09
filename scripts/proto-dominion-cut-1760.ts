/**
 * THR-1760 prototype — NEVER MERGED (lives on proto/thr-1760-dominion-cut).
 *
 * Builds a world per seed, reads every hex, location, sublocation, individual and
 * faction at tick 0 and tick N, and prints the Dominion band census under candidate
 * cuts so the formula ticket can choose normalisation, opposite-pole weight, how
 * the god's power enters, and the five thresholds against measured distributions.
 *
 *   npx esbuild scripts/proto-dominion-cut-1760.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/proto-dominion.mjs --external:fs --external:path && \
 *   node .cache/proto-dominion.mjs --seeds 42,99,7 --ticks 240
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology, SPHERE_OPPOSITIONS } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { seedHexSphereAffinity, getFactionSphereScores } from '../src/engine/sphereAffinity';
import { getLocationNodes, getPlaceNodes } from '../src/engine/sublocationShape';
import type { GameState } from '../src/types/gameState';
import type { SphereName } from '../src/types/sphereAffinity';

type Scores = Partial<Record<SphereName, number>>;

// ─── Candidate constants (the decision picks one row of each) ─────────────

/** Opposition strength per pair, from the code comment in cosmology.ts (The Cosmological Pattern). */
const PAIR_STRENGTH: Record<SphereName, number> = {
  chaos: 1, order: 1, light: 1, darkness: 1,
  force: 0.6, mind: 0.6, life: 0.8, entropy: 0.8,
  energy: 0.4, spirit: 0.4, matter: 0.4, time: 0.4,
};
const OPP_WEIGHTS: Record<string, (s: SphereName) => number> = {
  full: () => 1,
  half: () => 0.5,
  pair: s => PAIR_STRENGTH[s],
};

/** Band cut on the normalised match (score units, −10..10). Lower bounds of Foreign/Touched/Held/Sovereign. */
interface Cut { name: string; foreign: number; touched: number; held: number; sovereign: number }
const CUTS: Cut[] = [
  { name: 'A (−1/0.5/1.5/3)', foreign: -1, touched: 0.5, held: 1.5, sovereign: 3 },
  { name: 'B (−1.5/0.5/1.5/3)', foreign: -1.5, touched: 0.5, held: 1.5, sovereign: 3 },
  { name: 'C (−2/1/2/4)', foreign: -2, touched: 1, held: 2, sovereign: 4 },
];
const BANDS = ['Hostile', 'Foreign', 'Touched', 'Held', 'Sovereign'] as const;

/** Power baseline: the god's seeded score sum (2 + 1). Power factor = sum / baseline. */
const POWER_BASELINE = 3;

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  return {
    seeds: get('--seeds', '42,99,7').split(',').map(Number),
    ticks: Number(get('--ticks', '240')),
    map: get('--map', 'medium') as MapSizePreset,
    out: get('--out', '.cache/proto-dominion-1760.json'),
  };
}

/** Normalised match: Σ points·(s − w·opp) / Σ points. Power not inside the sum (scalar decision). */
function matchShape(points: Scores, obj: Scores, w: (s: SphereName) => number): number {
  let num = 0, den = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    if (!p) continue;
    const opp = SPHERE_OPPOSITIONS[s];
    num += p * ((obj[s] ?? 0) - w(s) * (obj[opp] ?? 0));
    den += p;
  }
  return den > 0 ? num / den : 0;
}

/** The ruling read literally: per-sphere points × per-sphere god power inside the sum, normalised by Σ points·power. */
function matchLiteral(points: Scores, power: Scores, obj: Scores, w: (s: SphereName) => number): number {
  let num = 0, den = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    const W = (p ?? 0) * (power[s] ?? 0);
    if (!W) continue;
    num += W * ((obj[s] ?? 0) - w(s) * (obj[SPHERE_OPPOSITIONS[s]] ?? 0));
    den += W;
  }
  return den > 0 ? num / den : 0;
}

function band(m: number, cut: Cut): typeof BANDS[number] {
  if (m >= cut.sovereign) return 'Sovereign';
  if (m >= cut.held) return 'Held';
  if (m >= cut.touched) return 'Touched';
  if (m >= cut.foreign) return 'Foreign';
  return 'Hostile';
}

interface Kinds { hex: Scores[]; location: Scores[]; sublocation: Scores[]; individual: Scores[]; faction: Scores[] }

function collect(state: GameState): Kinds {
  const g = state.graph;
  const scoresOf = (n: { properties: Record<string, unknown> }): Scores =>
    ((n.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores) ?? {};
  return {
    hex: state.tiles.filter(t => t.terrain !== 'ocean' && t.terrain !== ('deep_ocean' as never))
      .map(t => seedHexSphereAffinity(t.terrain).scores),
    location: getLocationNodes(g).map(scoresOf),
    sublocation: getPlaceNodes(g).map(scoresOf),
    individual: g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual').map(scoresOf),
    faction: g.getNodesByType('actor').filter(n => n.properties.actorType === 'faction').map(n => getFactionSphereScores(n)),
  };
}

function stats(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
  return { n: s.length, min: s[0] ?? 0, p10: q(0.1), p50: q(0.5), p90: q(0.9), max: s[s.length - 1] ?? 0,
    neg: s.filter(x => x < 0).length, zero: s.filter(x => x === 0).length, pos: s.filter(x => x > 0).length };
}

function census(ms: number[], cut: Cut, powerFactor: number) {
  const c: Record<string, number> = Object.fromEntries(BANDS.map(b => [b, 0]));
  // Power widens the friendly bands only: the positive side of the match scales; the hostile side does not.
  for (const m of ms) c[band(m > 0 ? m * powerFactor : m, cut)]++;
  return c;
}

const args = parseArgs();
const out: Record<string, unknown> = {};
const fmtRow = (c: Record<string, number>) => BANDS.map(b => String(c[b]).padStart(4)).join(' ');

for (const seed of args.seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[args.map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'DominionProto', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const snaps: { tick: number; kinds: Kinds; godPower: Scores; alignment: unknown }[] = [];
  const snap = () => {
    const god = state.graph.getNode(state.ascendantId);
    snaps.push({
      tick: state.tick,
      kinds: collect(state),
      godPower: { ...((god?.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores ?? {}) },
      alignment: god?.properties.sphereAlignment,
    });
  };
  snap();
  for (let i = 0; i < args.ticks; i++) state = runTick(state, [], runtime);
  snap();

  const align = snaps[0].alignment as { primary?: SphereName; secondary?: SphereName } | undefined;
  const presets: Record<string, Scores> = {
    [`world-god ${align?.primary}3/${align?.secondary}2`]: align?.primary ? { [align.primary]: 3, [align.secondary!]: 2 } : {},
    'showcase mind3/spirit2': { mind: 3, spirit: 2 },
    'stone force3/matter2': { force: 3, matter: 2 },
    'spread life2/matter2/mind1': { life: 2, matter: 2, mind: 1 },
  };

  console.log(`\n## seed ${seed} (${args.map}) — god alignment ${align?.primary}/${align?.secondary}`);
  for (const sn of snaps) {
    const nonzero = Object.entries(sn.godPower).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(' ');
    console.log(`  t${sn.tick} god power: ${nonzero || '(none)'}`);
  }

  const seedOut: Record<string, unknown> = {};
  for (const [pname, points] of Object.entries(presets)) {
    console.log(`\n### preset ${pname}`);
    for (const [wname, w] of Object.entries(OPP_WEIGHTS)) {
      for (const sn of snaps) {
        const line: string[] = [];
        for (const [kind, objs] of Object.entries(sn.kinds) as [keyof Kinds, Scores[]][]) {
          const st = stats(objs.map(o => matchShape(points, o, w)));
          line.push(`${kind} n${st.n} p10=${st.p10.toFixed(2)} p50=${st.p50.toFixed(2)} p90=${st.p90.toFixed(2)} max=${st.max.toFixed(2)} neg=${st.neg} 0=${st.zero} pos=${st.pos}`);
          seedOut[`${pname}|${wname}|t${sn.tick}|${kind}|stats`] = st;
        }
        console.log(`  [w=${wname} t${sn.tick}] ` + line.join(' · '));
      }
    }
    // Band census for each cut at w=pair and w=half, power factor from the god's real power.
    for (const wname of ['pair', 'half', 'full']) {
      const w = OPP_WEIGHTS[wname];
      for (const cut of CUTS) {
        for (const sn of snaps) {
          const pf = Object.values(sn.godPower).reduce((a, b) => a + (b ?? 0), 0) / POWER_BASELINE || 1;
          const rows = (Object.entries(sn.kinds) as [keyof Kinds, Scores[]][]).map(([kind, objs]) => {
            const c = census(objs.map(o => matchShape(points, o, w)), cut, pf);
            seedOut[`${pname}|${wname}|${cut.name}|t${sn.tick}|${kind}`] = c;
            return `${kind.slice(0, 5).padEnd(5)} ${fmtRow(c)}`;
          });
          console.log(`  cut ${cut.name} w=${wname} t${sn.tick} pf=${pf.toFixed(2)}  [H F T Hd S]  ` + rows.join(' | '));
        }
      }
    }
    // Literal per-sphere power read vs shape read: how many objects change band (cut A, w=pair, t0).
    const sn0 = snaps[0];
    let flips = 0, total = 0;
    for (const objs of Object.values(sn0.kinds) as Scores[][]) {
      for (const o of objs) {
        total++;
        const a = band(matchShape(points, o, OPP_WEIGHTS.pair), CUTS[0]);
        const b = band(matchLiteral(points, sn0.godPower, o, OPP_WEIGHTS.pair), CUTS[0]);
        if (a !== b) flips++;
      }
    }
    const zeroPowerBought = Object.keys(points).filter(s => !(sn0.godPower[s as SphereName] ?? 0));
    console.log(`  literal-vs-shape band flips at t0 (cut A, w=pair): ${flips}/${total}; bought spheres with zero god power: ${zeroPowerBought.join(',') || 'none'}`);
    seedOut[`${pname}|literalFlips`] = { flips, total, zeroPowerBought };
  }
  out[String(seed)] = seedOut;
}
writeFileSync(args.out, JSON.stringify(out, null, 1));
console.log(`\nwrote ${args.out}`);
