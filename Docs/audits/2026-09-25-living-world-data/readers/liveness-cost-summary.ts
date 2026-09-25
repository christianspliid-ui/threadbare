// THR-1592: summarise liveness-cost.jsonl into arm x seed means, noise, deltas and the
// phases that moved. `node --experimental-strip-types liveness-cost-summary.ts <in.jsonl> <out.json>`
import { readFileSync, writeFileSync } from 'fs';

type Rec = {
  arm: string; seed: number; rep: number; ms1_20: number; ms21_150: number; ms21_end: number; median21_end: number;
  atStart: Record<string, number>; atEnd: Record<string, number>; lever: Record<string, unknown>;
  phaseSteadyMsPerTick: Record<string, number>; eventsEmitted: number;
};
const [inPath, outPath] = process.argv.slice(2);
const recs: Rec[] = readFileSync(inPath, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map(x => (x - m) ** 2))); };
const r1 = (x: number) => +x.toFixed(1);
// Median across reps is the headline estimator: interleaved runs on a shared desktop
// catch intermittent interference (a whole rep ~30% slow), and the median discards it
// where a mean would not. Same-arm reps are bit-identical simulations (event counts
// match exactly), so rep spread is pure machine noise.
const median = (xs: number[]) => { const s = [...xs].sort((p, q) => p - q); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };

const groups = new Map<string, Rec[]>();
for (const r of recs) { const k = `${r.arm}|${r.seed}`; groups.set(k, [...(groups.get(k) ?? []), r]); }
const seeds = [...new Set(recs.map(r => r.seed))].sort((a, b) => a - b);
const arms = [...new Set(recs.map(r => r.arm))];

const rows: any[] = [];
for (const arm of arms) for (const seed of seeds) {
  const g = groups.get(`${arm}|${seed}`); if (!g) continue;
  const base = groups.get(`baseline|${seed}`) ?? [];
  const m = (f: (r: Rec) => number, rs: Rec[]) => median(rs.map(f));
  const steady = m(r => r.ms21_end, g), bSteady = m(r => r.ms21_end, base);
  const warm = m(r => r.ms1_20, g), bWarm = m(r => r.ms1_20, base);
  // phases that moved most vs baseline (steady ms/tick)
  const phases = new Set<string>(); for (const r of [...g, ...base]) for (const p of Object.keys(r.phaseSteadyMsPerTick)) phases.add(p);
  const moved = [...phases].map(p => ({ phase: p, delta: m(r => r.phaseSteadyMsPerTick[p] ?? 0, g) - m(r => r.phaseSteadyMsPerTick[p] ?? 0, base), armMs: m(r => r.phaseSteadyMsPerTick[p] ?? 0, g) }))
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)).slice(0, 8).map(x => ({ phase: x.phase, deltaMs: +x.delta.toFixed(2), armMs: +x.armMs.toFixed(2) }));
  rows.push({
    arm, seed, reps: g.length,
    estimator: 'median across reps',
    ms1_20: r1(warm), ms21_150: r1(m(r => r.ms21_150, g)), ms21_200: r1(steady), meanOfReps21_200: r1(mean(g.map(r => r.ms21_end))),
    perRep21_200: g.map(r => r1(r.ms21_end)), perRep1_20: g.map(r => r1(r.ms1_20)),
    repSd21_200: r1(sd(g.map(r => r.ms21_end))), repRange21_200: [r1(Math.min(...g.map(r => r.ms21_end))), r1(Math.max(...g.map(r => r.ms21_end)))],
    deltaSteadyMs: arm === 'baseline' ? 0 : r1(steady - bSteady), deltaSteadyPct: arm === 'baseline' ? 0 : r1((steady / bSteady - 1) * 100),
    deltaWarmPct: arm === 'baseline' ? 0 : r1((warm / bWarm - 1) * 100),
    decidersStartEnd: [g[0].atStart.deciders, r1(m(r => r.atEnd.deciders, g))], aliveMortalsEnd: r1(m(r => r.atEnd.aliveMortals, g)),
    eventsEmitted: r1(m(r => r.eventsEmitted, g)), lever: g[0].lever, phasesMoved: moved,
  });
}
writeFileSync(outPath, JSON.stringify(rows, null, 2));
for (const r of rows) console.log([r.arm.padEnd(11), r.seed, `n=${r.reps}`, `1-20 ${r.ms1_20}`, `21-200 ${r.ms21_200} (sd ${r.repSd21_200})`, `Δ ${r.deltaSteadyMs}ms ${r.deltaSteadyPct}%`, `Δwarm ${r.deltaWarmPct}%`, `dec ${r.decidersStartEnd.join('→')}`, `ev ${r.eventsEmitted}`,
  r.phasesMoved.slice(0, 4).map((p: any) => `${p.phase}:${p.deltaMs}`).join(' ')].join(' | '));
