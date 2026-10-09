/**
 * THR-1762 prototype — NEVER MERGED (lives on proto/thr-1762-frontier-pace).
 *
 * How fast does a place climb the Dominion bands under candidate frontier verbs?
 * Builds a headless world per seed, takes every place-tier node at tick 0, and for
 * each god vector drives the REAL sphere-pressure consumer (`resolveSpherePressure`)
 * tick by tick under candidate push policies, recording the tick each place first
 * reads Touched / Held / Sovereign under the settled THR-1760 cut.
 *
 *   npx esbuild scripts/proto-frontier-pace-1762.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/proto-frontier-pace.mjs --external:fs --external:path && \
 *   node .cache/proto-frontier-pace.mjs --seeds 42,99,7
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology, SPHERE_OPPOSITES } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { resolveSpherePressure } from '../src/engine/phaseSpherePressure';
import { getLocationNodes } from '../src/engine/sublocationShape';
import { getAdjacentLocationIds } from '../src/engine/graphQueries';
import { createDefaultSphereAffinity } from '../src/types/sphereAffinity';
import type { SphereAffinity, SpherePressureEvent } from '../src/types/sphereAffinity';
import type { SphereName } from '../src/types/sphereAffinity';

type Scores = Partial<Record<SphereName, number>>;

// ─── The settled THR-1760 cut ─────────────────────────────────────────────
const PAIR_STRENGTH: Record<SphereName, number> = {
  chaos: 1, order: 1, light: 1, darkness: 1,
  force: 0.6, mind: 0.6, life: 0.8, entropy: 0.8,
  energy: 0.4, spirit: 0.4, matter: 0.4, time: 0.4,
};
const CUT = { foreign: -1.5, touched: 0.5, held: 1.5, sovereign: 3 };
const BANDS = ['Hostile', 'Foreign', 'Touched', 'Held', 'Sovereign'] as const;
type Band = typeof BANDS[number];

function match(points: Scores, obj: Scores): number {
  let num = 0, den = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    if (!p) continue;
    const opp = SPHERE_OPPOSITES[s];
    num += p * ((obj[s] ?? 0) - PAIR_STRENGTH[s] * (opp ? (obj[opp] ?? 0) : 0));
    den += p;
  }
  return den ? num / den : 0;
}
function band(m: number, power: number): Band {
  const d = m > 0 ? m * power : m;
  if (d >= CUT.sovereign) return 'Sovereign';
  if (d >= CUT.held) return 'Held';
  if (d >= CUT.touched) return 'Touched';
  if (d >= CUT.foreign) return 'Foreign';
  return 'Hostile';
}

// ─── Gods ─────────────────────────────────────────────────────────────────
const GODS: Record<string, Scores> = {
  showcase: { mind: 3, spirit: 2 },
  shepherd: { life: 3, spirit: 2 },
  stone: { force: 3, matter: 2 },
  spread: { life: 2, matter: 2, mind: 1 },
};

// ─── Policies ─────────────────────────────────────────────────────────────
const TICKS_PER_DAY = 12;
const WINDOW_TICKS = 1080;

interface Policy {
  name: string;
  /** Per-tick sustained push, total magnitude; split by the god's points ('vector') or all on the primary. */
  hold: number;
  holdShape: 'vector' | 'primary';
  /** A burst every `burstEvery` ticks (0 = never) of `burst` magnitude in the sphere that best breaks ground. */
  burst: number;
  burstEvery: number;
  /** 'always' bursts on cadence; 'whenOpposed' bursts only while an opposing pole stands (the break-ground verb). */
  burstMode?: 'always' | 'whenOpposed';
}

const POLICIES: Policy[] = [
  { name: 'today: hold 1/tick on primary (CONTROL_PRESSURE_PER_TICK)', hold: 1, holdShape: 'primary', burst: 0, burstEvery: 0 },
  { name: 'hold 1/tick across the bought vector', hold: 1, holdShape: 'vector', burst: 0, burstEvery: 0 },
  { name: 'hold 0.25/tick vector', hold: 0.25, holdShape: 'vector', burst: 0, burstEvery: 0 },
  { name: 'hold 0.1/tick vector', hold: 0.1, holdShape: 'vector', burst: 0, burstEvery: 0 },
  { name: 'cast only: 3 every day (ACTION_PRESSURE_SUCCESS)', hold: 0, holdShape: 'vector', burst: 3, burstEvery: 12 },
  { name: 'cast only: 3 every 3 days', hold: 0, holdShape: 'vector', burst: 3, burstEvery: 36 },
  { name: 'hold 0.1 vector + cast 3 every 3 days', hold: 0.1, holdShape: 'vector', burst: 3, burstEvery: 36 },
  { name: 'hold 0.1 vector + cast 6 every 3 days', hold: 0.1, holdShape: 'vector', burst: 6, burstEvery: 36 },
  { name: 'hold 0.05 vector + cast 6 every 3 days', hold: 0.05, holdShape: 'vector', burst: 6, burstEvery: 36 },
  // Candidate design: Claim Dominion = vector hold at h; Shift Dominion = break 6 only while opposed, at most every 3 days.
  { name: 'CLAIM 0.02 + BREAK 6 when opposed /3d', hold: 0.02, holdShape: 'vector', burst: 6, burstEvery: 36, burstMode: 'whenOpposed' },
  { name: 'CLAIM 0.03 + BREAK 6 when opposed /3d', hold: 0.03, holdShape: 'vector', burst: 6, burstEvery: 36, burstMode: 'whenOpposed' },
  { name: 'CLAIM 0.04 + BREAK 6 when opposed /3d', hold: 0.04, holdShape: 'vector', burst: 6, burstEvery: 36, burstMode: 'whenOpposed' },
  { name: 'CLAIM 0.06 + BREAK 6 when opposed /3d', hold: 0.06, holdShape: 'vector', burst: 6, burstEvery: 36, burstMode: 'whenOpposed' },
  { name: 'CLAIM 0.03 x1.5 adjacency + BREAK 6 /3d', hold: 0.045, holdShape: 'vector', burst: 6, burstEvery: 36, burstMode: 'whenOpposed' },
  { name: 'CLAIM 0.03, no break', hold: 0.03, holdShape: 'vector', burst: 0, burstEvery: 0 },
  { name: 'BREAK 4 when opposed /3d + CLAIM 0.03', hold: 0.03, holdShape: 'vector', burst: 4, burstEvery: 36, burstMode: 'whenOpposed' },
];
function opposed(points: Scores, aff: SphereAffinity): boolean {
  return (Object.keys(points) as SphereName[]).some(s => { const o = SPHERE_OPPOSITES[s]; return !!o && aff.scores[o] > 0; });
}

/** The burst sphere: break the strongest opposing pole the god's buy faces here; else build the primary. */
function burstSphere(points: Scores, aff: SphereAffinity): SphereName {
  let best: SphereName | null = null, bestW = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    const opp = SPHERE_OPPOSITES[s];
    const o = opp ? aff.scores[opp] : 0;
    const w = p * PAIR_STRENGTH[s] * o;
    if (o > 0 && w > bestW) { best = s; bestW = w; }
  }
  if (best) return best;
  // otherwise build the bought sphere with the most room per point
  let pick: SphereName = primaryOf(points), room = -1;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    const r = p / (1 + aff.scores[s]);
    if (r > room) { room = r; pick = s; }
  }
  return pick;
}
function primaryOf(points: Scores): SphereName {
  return (Object.entries(points) as [SphereName, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

function simulate(start: Scores, points: Scores, pol: Policy, power: number) {
  let aff: SphereAffinity = createDefaultSphereAffinity();
  aff = { scores: { ...aff.scores, ...start } as SphereAffinity['scores'], progress: { ...aff.progress } };
  const first: Partial<Record<Band, number>> = {};
  const total = Object.values(points).reduce((a, b) => a + (b ?? 0), 0);
  for (let t = 1; t <= WINDOW_TICKS; t++) {
    const ev: SpherePressureEvent[] = [];
    if (pol.hold > 0) {
      if (pol.holdShape === 'primary') ev.push({ targetEntityId: 'x', sphere: primaryOf(points), magnitude: pol.hold, source: 'divine_action', sourceId: 'hold' });
      else for (const [s, p] of Object.entries(points) as [SphereName, number][])
        ev.push({ targetEntityId: 'x', sphere: s, magnitude: pol.hold * (p ?? 0) / total, source: 'divine_action', sourceId: 'hold' });
    }
    if (pol.burstEvery && t % pol.burstEvery === 0 && (pol.burstMode !== 'whenOpposed' || opposed(points, aff)))
      ev.push({ targetEntityId: 'x', sphere: burstSphere(points, aff), magnitude: pol.burst, source: 'divine_action', sourceId: 'cast' });
    aff = resolveSpherePressure(aff, ev).updated;
    const b = band(match(points, aff.scores), power);
    const idx = BANDS.indexOf(b);
    for (let i = 2; i <= idx; i++) if (first[BANDS[i]] === undefined) first[BANDS[i]] = t;
  }
  return first;
}

function q(xs: number[], p: number) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}
const days = (t: number) => (Number.isNaN(t) ? '  —  ' : (t / TICKS_PER_DAY).toFixed(1).padStart(5));

const argv = process.argv.slice(2);
const seeds = (argv.includes('--seeds') ? argv[argv.indexOf('--seeds') + 1] : '42,99,7').split(',').map(Number);
const powers = [1, 1.33];

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS.medium;
  const archetype = generateArchetypes(4, seed)[0];
  const { state } = initializeGameState(archetype, 'FrontierProto', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const places = getLocationNodes(state.graph).map(n => ({
    id: n.id,
    scores: ((n.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores) ?? {},
  }));
  const adjCount = getLocationNodes(state.graph).filter(n => getAdjacentLocationIds(state.graph, n.id).length > 0).length;
  console.log(`\n=== seed ${seed}: ${places.length} places, ${adjCount} with an adjacent place ===`);
  for (const [godName, points] of Object.entries(GODS)) {
    for (const power of powers) {
      const startBands: Record<string, number> = {};
      for (const p of places) { const b = band(match(points, p.scores), power); startBands[b] = (startBands[b] ?? 0) + 1; }
      const foreign = places.filter(p => band(match(points, p.scores), power) === 'Foreign');
      const opposed = foreign.filter(p => (Object.keys(points) as SphereName[]).some(s => { const o = SPHERE_OPPOSITES[s]; return o && (p.scores[o] ?? 0) > 0; }));
      console.log(`\n-- ${godName} ${JSON.stringify(points)} power ${power}: start ${BANDS.map(b => `${b[0]}${startBands[b] ?? 0}`).join(' ')}; Foreign ${foreign.length} (${opposed.length} face an opposing pole)`);
      console.log('   policy'.padEnd(62) + '  →Touched p50/p90/never   →Held p50/p90/never   →Sovereign p50/p90/never  (days)');
      for (const pol of POLICIES) {
        const res = foreign.map(p => simulate(p.scores, points, pol, power));
        const col = (b: Band) => {
          const hit = res.map(r => r[b]).filter((x): x is number => x !== undefined);
          const never = res.length - hit.length;
          return `${days(q(hit, 0.5))} ${days(q(hit, 0.9))} ${String(never).padStart(4)}`;
        };
        console.log(`   ${pol.name.padEnd(60)} ${col('Touched')}   ${col('Held')}   ${col('Sovereign')}`);
      }
    }
  }
}
