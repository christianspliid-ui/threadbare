/**
 * THR-1763 prototype — NEVER MERGED (lives on proto/thr-1763-erosion).
 *
 * How fast does held ground erode under candidate opposition shapes, and can one
 * Claim hold it? Reuses the THR-1762 pace harness: every tick-0 Foreign place of
 * seeds 42/99/7, four god vectors, power 1, driven through the REAL sphere-pressure
 * consumer (`resolveSpherePressure`). Each place is first brought up by the chosen
 * THR-1762 policy (Claim 0.03 across the bought vector + Shift 6 while opposed, at
 * most every 3 days); the state the first tick it reads Held, and the first tick it
 * reads Sovereign, is snapshotted. From each snapshot the god stops tending and one
 * opposition shape runs for 90 days:
 *
 *   1  decay r      — prototype-local term, NOT in src: bought-sphere scores relax toward
 *                     their tick-0 value at r a tick (drains progress, then a whole level),
 *                     only while no carrier (Claim / seat / thread) stands on the place.
 *      decay+opp r  — the same, and eroded opposing poles regrow toward tick-0 at r.
 *   2  burst m / k  — an opposing-pole burst of m every k days. The rival picks the
 *                     bought sphere whose opposite does most damage this tick (trial
 *                     resolve through the real consumer).
 *   3  sink m / N   — bursts at H/N a day, spread over the god's 3 most-held places, so
 *                     each of those places is hit every 3N/H days (H = Held+Sovereign count).
 *   4  doom         — the shipped cadence: stage thresholds 0.2/0.4/0.6/0.8 of the
 *                     1,080-tick clock = a crossing every 18 days; each crossing pushes
 *                     DOOM_PRESSURE_PER_TIER = 4 entropy on every location plus that stage's
 *                     all-locations card pressure (read from the seed's doomDefinition).
 *
 * Each shape is run twice: untended (days to lose a band / to fall to Foreign) and
 * with one Claim 0.03 continuing (does the place keep its band; ever fall to Foreign).
 * The claim run from the Held snapshot is also part C (a god with only its seat).
 *
 *   npx esbuild scripts/proto-erosion-1763.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/proto-erosion-1763.mjs --external:fs --external:path && \
 *   node .cache/proto-erosion-1763.mjs --seeds 42,99,7 > scripts/proto-erosion-1763.out.txt
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology, SPHERE_OPPOSITES } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { resolveSpherePressure } from '../src/engine/phaseSpherePressure';
import { getLocationNodes } from '../src/engine/sublocationShape';
import { createDefaultSphereAffinity, DOOM_PRESSURE_PER_TIER, triangleCost } from '../src/types/sphereAffinity';
import type { SphereAffinity, SpherePressureEvent, SphereName } from '../src/types/sphereAffinity';

type Scores = Partial<Record<SphereName, number>>;

// ─── The settled THR-1760 cut ─────────────────────────────────────────────
const PAIR_STRENGTH: Record<SphereName, number> = {
  chaos: 1, order: 1, light: 1, darkness: 1,
  force: 0.6, mind: 0.6, life: 0.8, entropy: 0.8,
  energy: 0.4, spirit: 0.4, matter: 0.4, time: 0.4,
};
const CUT = { foreign: -1.5, touched: 0.5, held: 1.5, sovereign: 3 };
const BANDS = ['Hostile', 'Foreign', 'Touched', 'Held', 'Sovereign'] as const;
const B_FOREIGN = 1, B_TOUCHED = 2, B_HELD = 3, B_SOV = 4;

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
function bandIdx(m: number, power: number): number {
  const d = m > 0 ? m * power : m;
  if (d >= CUT.sovereign) return 4;
  if (d >= CUT.held) return 3;
  if (d >= CUT.touched) return 2;
  if (d >= CUT.foreign) return 1;
  return 0;
}

const GODS: Record<string, Scores> = {
  showcase: { mind: 3, spirit: 2 },
  shepherd: { life: 3, spirit: 2 },
  stone: { force: 3, matter: 2 },
  spread: { life: 2, matter: 2, mind: 1 },
};
const POWER = 1;
const TICKS_PER_DAY = 12;
const WINDOW_TICKS = 1080;
const CLAIM = 0.03;           // DOMINION_CLAIM_PRESSURE_PER_TICK (THR-1762)
const BREAK = 6;              // DOMINION_BREAK_PRESSURE
const BREAK_EVERY = 36;       // Shift at most every 3 days
const SINK_FOCUS = 3;         // the sink spreads over the god's 3 most-held places
const DOOM_CROSSING_EVERY = 216; // 0.2 × DEFAULT_DOOM_TICKS 1080

const sum = (o: Scores) => Object.values(o).reduce((a, b) => a + (b ?? 0), 0);
function claimEvents(points: Scores, rate: number): SpherePressureEvent[] {
  const tot = sum(points);
  return (Object.entries(points) as [SphereName, number][]).map(([s, p]) =>
    ({ targetEntityId: 'x', sphere: s, magnitude: rate * p / tot, source: 'divine_action', sourceId: 'claim' }));
}
function opposed(points: Scores, aff: SphereAffinity): boolean {
  return (Object.keys(points) as SphereName[]).some(s => { const o = SPHERE_OPPOSITES[s]; return !!o && aff.scores[o] > 0; });
}
function breakSphere(points: Scores, aff: SphereAffinity): SphereName {
  let best: SphereName | null = null, bestW = 0;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    const opp = SPHERE_OPPOSITES[s];
    const o = opp ? aff.scores[opp] : 0;
    const w = p * PAIR_STRENGTH[s] * o;
    if (o > 0 && w > bestW) { best = s; bestW = w; }
  }
  if (best) return best;
  let pick = Object.keys(points)[0] as SphereName, room = -1;
  for (const [s, p] of Object.entries(points) as [SphereName, number][]) {
    const r = p / (1 + aff.scores[s]);
    if (r > room) { room = r; pick = s; }
  }
  return pick;
}

/**
 * Build phase: the chosen THR-1762 policy. A place that has *just* crossed into a band
 * sits on the band edge with near-empty progress, so any push back drops it at once.
 * The snapshots are therefore typical, not edge, states:
 *   Held      = midway through the stretch the policy keeps it at Held (first Held →
 *               first Sovereign, or → day 90 if it never gets there);
 *   Sovereign = 14 days of further tending after it first reads Sovereign.
 */
const SOV_SETTLE_TICKS = 14 * TICKS_PER_DAY;
function build(start: Scores, points: Scores) {
  const init = (): SphereAffinity => {
    const d = createDefaultSphereAffinity();
    return { scores: { ...d.scores, ...start } as SphereAffinity['scores'], progress: { ...d.progress } };
  };
  const seed0 = init();
  const step = (aff: SphereAffinity, t: number) => {
    const ev = claimEvents(points, CLAIM);
    if (t % BREAK_EVERY === 0 && opposed(points, aff))
      ev.push({ targetEntityId: 'x', sphere: breakSphere(points, aff), magnitude: BREAK, source: 'divine_action', sourceId: 'shift' });
    return resolveSpherePressure(aff, ev).updated;
  };
  let aff = init();
  let tHeld: number | null = null, tSov: number | null = null;
  for (let t = 1; t <= WINDOW_TICKS && tSov === null; t++) {
    aff = step(aff, t);
    const b = bandIdx(match(points, aff.scores), POWER);
    if (b >= B_HELD && tHeld === null) tHeld = t;
    if (b >= B_SOV && tSov === null) tSov = t;
  }
  const snapHeldAt = tHeld === null ? null : tHeld + Math.floor(((tSov ?? WINDOW_TICKS) - tHeld) / 2);
  const snapSovAt = tSov === null ? null : tSov + SOV_SETTLE_TICKS;
  let held: { aff: SphereAffinity; t: number } | null = null, sov: { aff: SphereAffinity; t: number } | null = null;
  aff = init();
  const last = snapSovAt ?? snapHeldAt ?? 0;
  for (let t = 1; t <= last; t++) {
    aff = step(aff, t);
    if (t === snapHeldAt && bandIdx(match(points, aff.scores), POWER) === B_HELD) held = { aff, t: tHeld! };
    if (t === snapSovAt && bandIdx(match(points, aff.scores), POWER) === B_SOV) sov = { aff, t: tSov! };
  }
  return { seed0, held, sov };
}

// ─── Opposition shapes ────────────────────────────────────────────────────
type Shape =
  | { kind: 'decay'; r: number; regrowOpp: boolean }
  | { kind: 'burst'; m: number; everyDays: number }
  | { kind: 'doom' };

function shapeKey(s: Shape) {
  return s.kind === 'decay' ? `decay${s.regrowOpp ? '+opp' : ''} r=${s.r}`
    : s.kind === 'burst' ? `burst m=${s.m} every ${s.everyDays}d` : 'doom (shipped)';
}

/** Rival burst: the bought sphere whose opposite, pushed now, leaves the lowest match. */
function rivalBurst(points: Scores, aff: SphereAffinity, m: number, base: SpherePressureEvent[]): SpherePressureEvent {
  let best: SpherePressureEvent | null = null, bestM = Infinity;
  for (const s of Object.keys(points) as SphereName[]) {
    const o = SPHERE_OPPOSITES[s];
    if (!o) continue;
    const e: SpherePressureEvent = { targetEntityId: 'x', sphere: o, magnitude: m, source: 'rival', sourceId: 'opposition' };
    const mm = match(points, resolveSpherePressure(aff, [...base, e]).updated.scores);
    if (mm < bestM) { bestM = mm; best = e; }
  }
  return best!;
}

/** Decay: drain progress, then a whole level, toward the tick-0 value (never below it). */
function decay(aff: SphereAffinity, seed0: SphereAffinity, points: Scores, r: number, regrowOpp: boolean): SphereAffinity {
  const scores = { ...aff.scores }, progress = { ...aff.progress };
  for (const s of Object.keys(points) as SphereName[]) {
    if (scores[s] > seed0.scores[s] || (scores[s] === seed0.scores[s] && progress[s] > seed0.progress[s])) {
      progress[s] -= r;
      if (progress[s] < 0) {
        if (scores[s] > seed0.scores[s]) { scores[s] -= 1; progress[s] += triangleCost(scores[s] + 1); }
        else progress[s] = seed0.progress[s];
      }
      if (scores[s] === seed0.scores[s] && progress[s] < seed0.progress[s]) progress[s] = seed0.progress[s];
    }
    const o = SPHERE_OPPOSITES[s];
    if (regrowOpp && o && scores[o] < seed0.scores[o]) {
      progress[o] += r;
      const cost = triangleCost(scores[o] + 1);
      if (progress[o] >= cost) { scores[o] += 1; progress[o] -= cost; }
    }
  }
  return { scores, progress };
}

interface ErodeResult { drop: number | null; foreign: number | null; end: number; min: number }
function erode(aff0: SphereAffinity, seed0: SphereAffinity, points: Scores, shape: Shape, claim: boolean,
  doomEvents: { sphere: SphereName; magnitude: number }[][]): ErodeResult {
  let aff = aff0;
  const start = bandIdx(match(points, aff.scores), POWER);
  let drop: number | null = null, foreign: number | null = null, min = start;
  const everyTicks = shape.kind === 'burst' ? shape.everyDays * TICKS_PER_DAY : 0;
  for (let t = 1; t <= WINDOW_TICKS; t++) {
    const ev: SpherePressureEvent[] = claim ? claimEvents(points, CLAIM) : [];
    if (shape.kind === 'burst' && Math.floor(t / everyTicks) > Math.floor((t - 1) / everyTicks))
      ev.push(rivalBurst(points, aff, shape.m, ev));
    if (shape.kind === 'doom' && t % DOOM_CROSSING_EVERY === 0) {
      const k = t / DOOM_CROSSING_EVERY - 1; // crossings into stage 2..5
      for (const d of doomEvents[k] ?? []) ev.push({ targetEntityId: 'x', sphere: d.sphere, magnitude: d.magnitude, source: 'doom', sourceId: 'doom' });
    }
    if (ev.length) aff = resolveSpherePressure(aff, ev).updated;
    // Decay is gated on "no carrier this tick"; the claim run applies it anyway, to show
    // what one Claim nets against it if decay ignored carriers.
    if (shape.kind === 'decay') aff = decay(aff, seed0, points, shape.r, shape.regrowOpp);
    const b = bandIdx(match(points, aff.scores), POWER);
    if (b < min) min = b;
    if (drop === null && b < start) drop = t;
    if (foreign === null && b <= B_FOREIGN) foreign = t;
  }
  return { drop, foreign, end: bandIdx(match(points, aff.scores), POWER), min };
}

function q(xs: number[], p: number) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}
const days = (t: number) => (Number.isNaN(t) ? '   — ' : (t / TICKS_PER_DAY).toFixed(1).padStart(5));
const pct = (n: number, d: number) => (d ? `${Math.round(100 * n / d)}%` : '—').padStart(4);

// ─── Run ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const seeds = (argv.includes('--seeds') ? argv[argv.indexOf('--seeds') + 1] : '42,99,7').split(',').map(Number);
const maxPlaces = argv.includes('--max-places') ? Number(argv[argv.indexOf('--max-places') + 1]) : Infinity;

const BURST_INTERVALS = [0.375, 0.75, 1.5, 3, 5, 6, 10, 20];
const SHAPES: Shape[] = [
  ...[0.005, 0.01, 0.02].flatMap(r => [false, true].map(regrowOpp => ({ kind: 'decay', r, regrowOpp }) as Shape)),
  ...[3, 4, 6].flatMap(m => BURST_INTERVALS.map(everyDays => ({ kind: 'burst', m, everyDays }) as Shape)),
  { kind: 'doom' },
];

const scoreSig = (points: Scores, a: SphereAffinity) => (Object.keys(points) as SphereName[]).map(s => `${s}${a.scores[s]}`).join(" ") + ((Object.keys(points) as SphereName[]).some(s => { const o = SPHERE_OPPOSITES[s]; return o && a.scores[o] > 0; }) ? " (opp>0)" : "");
const top3 = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${k} ×${n}`).join("; ");
// results[god][start][shapeKey] = list of { untended, claim }
type Row = { u: ErodeResult; c: ErodeResult };
const results: Record<string, Record<'Held' | 'Sovereign', Record<string, Row[]>>> = {};
const buildStats: Record<string, { foreign: number; held: number; sov: number; heldT: number[]; sovT: number[]; heldS: Record<string, number>; sovS: Record<string, number> }> = {};
const doomLog: string[] = [];

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS.medium;
  const archetype = generateArchetypes(4, seed)[0];
  const { state } = initializeGameState(archetype, 'ErosionProto', createBalancedCosmology(), seed, preset.cols, preset.rows);
  // Doom: per crossing into stage 2..5, entropy 4 on every location + that stage's all-locations card pressure.
  const doomEvents = [2, 3, 4, 5].map(stage => {
    const out: { sphere: SphereName; magnitude: number }[] = [{ sphere: 'entropy', magnitude: DOOM_PRESSURE_PER_TIER }];
    for (const e of state.doomDefinition.stages[stage - 1]?.events ?? [])
      if (e.effectType === 'location_pressure' && e.targetKind === 'all_locations')
        out.push({ sphere: e.sphere ?? 'entropy', magnitude: e.magnitude ?? 0 });
    return out;
  });
  doomLog.push(`seed ${seed}: doom ${state.doomDefinition.archetype}, thresholds ${state.doomDefinition.stages.map(s => s.tickThreshold).join('/')}; crossings at days 18/36/54/72 carry ${doomEvents.map(es => es.map(e => `${e.sphere} ${e.magnitude}`).join(' + ')).join(' | ')}`);

  const places = getLocationNodes(state.graph).map(n => ({
    id: n.id,
    scores: ((n.properties.sphereAffinity as { scores?: Scores } | undefined)?.scores) ?? {},
  }));
  for (const [god, points] of Object.entries(GODS)) {
    results[god] ??= { Held: {}, Sovereign: {} };
    buildStats[god] ??= { foreign: 0, held: 0, sov: 0, heldT: [], sovT: [], heldS: {}, sovS: {} };
    let foreign = places.filter(p => bandIdx(match(points, p.scores), POWER) === B_FOREIGN);
    if (foreign.length > maxPlaces) { const stride = foreign.length / maxPlaces; foreign = Array.from({ length: maxPlaces }, (_, i) => foreign[Math.floor(i * stride)]); }
    for (const p of foreign) {
      const { seed0, held, sov } = build(p.scores, points);
      const bs = buildStats[god];
      bs.foreign++;
      if (held) { bs.held++; bs.heldT.push(held.t); const k = scoreSig(points, held.aff); bs.heldS[k] = (bs.heldS[k] ?? 0) + 1; }
      if (sov) { bs.sov++; bs.sovT.push(sov.t); const k = scoreSig(points, sov.aff); bs.sovS[k] = (bs.sovS[k] ?? 0) + 1; }
      for (const [label, snap] of [['Held', held], ['Sovereign', sov]] as const) {
        if (!snap) continue;
        for (const sh of SHAPES) {
          const k = shapeKey(sh);
          (results[god][label][k] ??= []).push({
            u: erode(snap.aff, seed0, points, sh, false, doomEvents),
            c: erode(snap.aff, seed0, points, sh, true, doomEvents),
          });
        }
      }
    }
    process.stderr.write(`seed ${seed} ${god}: ${foreign.length} places\n`);
  }
}

// ─── Report ───────────────────────────────────────────────────────────────
console.log('# THR-1763 erosion shapes on the real consumer (resolveSpherePressure)');
console.log(`seeds ${seeds.join(',')}, power ${POWER}, every tick-0 Foreign place${Number.isFinite(maxPlaces) ? ` (sampled ≤${maxPlaces} per god-seed)` : ''}; build = Claim ${CLAIM} vector + Shift ${BREAK} while opposed /3d; erosion window 90 days`);
for (const l of doomLog) console.log(`  ${l}`);
console.log('\n## Build (chosen THR-1762 policy)');
for (const [god, bs] of Object.entries(buildStats)) {
  console.log(`  ${god.padEnd(9)} Foreign places ${bs.foreign}; reach Held ${bs.held} (p50 ${days(q(bs.heldT, 0.5))} d); reach Sovereign ${bs.sov} (p50 ${days(q(bs.sovT, 0.5))} d)`);
  console.log(`            typical Held snapshot scores: ${top3(bs.heldS)}`);
  console.log(`            typical Sovereign snapshot scores: ${top3(bs.sovS)}`);
}

console.log('\n## A. Untended: days to lose one band / to fall to Foreign (p50 p90 never-in-90d), and one Claim 0.03 continuing: keeps its band at day 90 / ever falls to Foreign');
console.log('   decay rows: the claim columns apply decay EVEN WITH the Claim present (by the rule, a carrier stops decay — then a Claim holds 100% by construction).');
const rates: Record<string, Record<string, Record<string, { dropP50: number | null; dropNever: number; foreignP50: number | null; n: number }>>> = {};
for (const label of ['Held', 'Sovereign'] as const) {
  for (const god of Object.keys(GODS)) {
    const byShape = results[god][label];
    const n = Object.values(byShape)[0]?.length ?? 0;
    console.log(`\n### ${god} from ${label} (n=${n})`);
    console.log('   shape'.padEnd(30) + '  lose 1 band p50/p90/never   →Foreign p50/p90/never | Claim: keeps band  ever Foreign  min band p10');
    for (const sh of SHAPES) {
      const k = shapeKey(sh);
      const rows = byShape[k] ?? [];
      const drops = rows.map(r => r.u.drop).filter((x): x is number => x !== null);
      const fors = rows.map(r => r.u.foreign).filter((x): x is number => x !== null);
      const keep = rows.filter(r => r.c.end >= (label === 'Held' ? B_HELD : B_SOV)).length;
      const everF = rows.filter(r => r.c.foreign !== null).length;
      const minB = q(rows.map(r => r.c.min), 0.1);
      console.log(`   ${k.padEnd(28)} ${days(q(drops, 0.5))} ${days(q(drops, 0.9))} ${String(rows.length - drops.length).padStart(4)}   ${days(q(fors, 0.5))} ${days(q(fors, 0.9))} ${String(rows.length - fors.length).padStart(4)} |       ${pct(keep, rows.length)}          ${pct(everF, rows.length)}     ${Number.isNaN(minB) ? '—' : BANDS[minB]}`);
      ((rates[label] ??= {})[god] ??= {})[k] = { dropP50: drops.length ? q(drops, 0.5) / TICKS_PER_DAY : null, dropNever: rows.length - drops.length, foreignP50: fors.length ? q(fors, 0.5) / TICKS_PER_DAY : null, n: rows.length };
    }
  }
}

// Pooled over gods: the band-step rates the economy proxy reads.
console.log('\n## Pooled over the four gods (feeds the economy proxy): untended days to lose one band from Held, p50 (never-in-90d share)');
const pooled: Record<string, { dropDaysP50: number | null; neverShare: number; foreignDaysP50: number | null }> = {};
for (const sh of SHAPES) {
  const k = shapeKey(sh);
  const rows = Object.keys(GODS).flatMap(g => results[g].Held[k] ?? []);
  const drops = rows.map(r => r.u.drop).filter((x): x is number => x !== null);
  const fors = rows.map(r => r.u.foreign).filter((x): x is number => x !== null);
  pooled[k] = {
    dropDaysP50: drops.length ? +(q(drops, 0.5) / TICKS_PER_DAY).toFixed(2) : null,
    neverShare: rows.length ? +((rows.length - drops.length) / rows.length).toFixed(3) : 1,
    foreignDaysP50: fors.length ? +(q(fors, 0.5) / TICKS_PER_DAY).toFixed(2) : null,
  };
  console.log(`   ${k.padEnd(28)} ${pooled[k].dropDaysP50 ?? '—'} d (${Math.round(100 * pooled[k].neverShare)}% never)   →Foreign ${pooled[k].foreignDaysP50 ?? '—'} d`);
}
// Doom: bands lost per crossing, pooled, from Held, untended.
const doomRows = Object.keys(GODS).flatMap(g => results[g].Held['doom (shipped)'] ?? []);
const doomLossAt90 = doomRows.map(r => B_HELD - r.u.end);
console.log(`   doom: bands lost by day 90 from Held, untended — p50 ${q(doomLossAt90, 0.5)}, p90 ${q(doomLossAt90, 0.9)}, mean ${(doomLossAt90.reduce((a, b) => a + b, 0) / (doomLossAt90.length || 1)).toFixed(2)}`);

// Shape 3 table: sink m/N for H held places → per-place interval 3N/H days (focused on the top 3).
console.log('\n## Shape 3 — sink grows with the god: H/N bursts a day on the 3 most-held places (each hit every 3N/H days). Pooled over gods, from Held.');
console.log('   m  N   H   per-place interval  untended lose-1-band p50  claim keeps band  claim ever Foreign');
for (const m of [4, 6]) for (const N of [5, 10]) for (const H of [5, 10, 20, 40]) {
  const iv = SINK_FOCUS * N / H;
  const k = shapeKey({ kind: 'burst', m, everyDays: iv });
  const rows = Object.keys(GODS).flatMap(g => results[g].Held[k] ?? []);
  const drops = rows.map(r => r.u.drop).filter((x): x is number => x !== null);
  const keep = rows.filter(r => r.c.end >= B_HELD).length, everF = rows.filter(r => r.c.foreign !== null).length;
  console.log(`   ${m}  ${String(N).padStart(2)}  ${String(H).padStart(2)}   ${iv.toFixed(3).padStart(6)} d           ${days(q(drops, 0.5))} d                 ${pct(keep, rows.length)}             ${pct(everF, rows.length)}`);
}
console.log('   (uniform targeting instead of the top 3: every held place is hit every N days whatever H is — the shape-2 row for k = N.)');

console.log('\n## C. Last held place — a god with only its seat (free standing Claim 0.03), seat already Held. Ever below Touched in 90 days?');
console.log('   shape                          places ever Foreign-or-worse   min band p10 / p50     → answer');
const cShapes: Shape[] = [
  { kind: 'decay', r: 0.02, regrowOpp: true },
  ...[3, 4, 6].flatMap(m => [5, 10, 20].map(everyDays => ({ kind: 'burst', m, everyDays }) as Shape)),
  ...[4, 6].flatMap(m => [0.375, 0.75, 1.5, 3].map(everyDays => ({ kind: 'burst', m, everyDays }) as Shape)),
  { kind: 'doom' },
];
for (const sh of cShapes) {
  const k = shapeKey(sh);
  const rows = Object.keys(GODS).flatMap(g => results[g].Held[k] ?? []);
  const below = rows.filter(r => r.c.min < B_TOUCHED).length;
  const note = sh.kind === 'decay' ? ' (rule: the seat is a carrier, so decay never applies — row shows decay forced on)' : '';
  console.log(`   ${k.padEnd(30)} ${String(below).padStart(4)} / ${rows.length} (${pct(below, rows.length)})          ${BANDS[q(rows.map(r => r.c.min), 0.1)]} / ${BANDS[q(rows.map(r => r.c.min), 0.5)]}   → ${below ? 'YES' : 'no'}${note}`);
}
console.log('   Shape 3 with only the seat: H = 1, so N/1 bursts a day all land on the seat — every N days = the shape-2 row for k = N (5 or 10).');

writeFileSync('scripts/proto-erosion-1763.rates.json', JSON.stringify({ pooledFromHeld: pooled, doomBandsLostBy90: { p50: q(doomLossAt90, 0.5), mean: doomLossAt90.reduce((a, b) => a + b, 0) / (doomLossAt90.length || 1) }, perGod: rates }, null, 1));
