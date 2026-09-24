/**
 * `calibrate:duels` — the duel calibration evidence (THR-1556, Duels E1).
 *
 * Runs 400 seeded duels of `fight.duel.grudge` through the real unified road
 * between two bold fixture mortals (strong raw clash 30 as the actor, weak raw
 * clash exactly 15, both with Heart ≈ 0.89, complications off, everything reset
 * between duels) and prints THR-1264's six classes beside its row. Exit 1 when a
 * named class misses by more than ±8 points or any duel yields — the plan doc's
 * kill criterion: diagnose before touching a tunable. Routed is diagnostic.
 *
 * Usage: npm run calibrate:duels [-- --duels N] [-- --seed S]
 */

import {
  DUEL_CALIBRATION_CLASSES,
  DUEL_CALIBRATION_DUELS,
  DUEL_CALIBRATION_GATED,
  DUEL_CALIBRATION_TARGET,
  DUEL_CALIBRATION_TOLERANCE,
  runDuelCalibration,
} from '../src/testing/duelCalibration';
import { disableTracing } from '../src/engine/traceBuffer';

const argv = process.argv.slice(2);
const flag = (name: string): number | undefined => {
  const i = argv.indexOf(name);
  const v = i >= 0 ? Number(argv[i + 1]) : NaN;
  return Number.isFinite(v) ? v : undefined;
};

disableTracing();
const duels = flag('--duels') ?? DUEL_CALIBRATION_DUELS;
const seed = flag('--seed') ?? 1264;
const report = runDuelCalibration(duels, seed);

const pad = (s: string, n: number) => s.padEnd(n);
const num = (v: number) => v.toFixed(1).padStart(6);
const cap = (v: number) => v.toFixed(3);
console.log('');
console.log(`duel calibration — fight.duel.grudge × ${report.duels} duels (seed ${seed})`);
console.log(
  `strong (actor): clash ${cap(report.capability.strong.clash)}, nerve ${cap(report.capability.strong.nerve)}, courage +0.35`,
);
console.log(
  `weak:           clash ${cap(report.capability.weak.clash)}, nerve ${cap(report.capability.weak.nerve)}, courage +0.35`,
);
console.log('complications: off');
console.log('');
console.log(`${pad('class', 20)}${pad('count', 8)}${pad('   %', 8)}${pad('target', 8)}${pad('  Δ', 8)}`);
for (const cls of DUEL_CALIBRATION_CLASSES) {
  const gated = (DUEL_CALIBRATION_GATED as readonly string[]).includes(cls);
  const ok = cls === 'yielded'
    ? (report.counts.yielded === 0 ? 'ok' : 'MISS')
    : Math.abs(report.deviation[cls]) <= DUEL_CALIBRATION_TOLERANCE ? 'ok' : (gated ? 'MISS' : 'diag');
  console.log(
    `${pad(cls, 20)}${String(report.counts[cls]).padStart(5)}   ${num(report.percent[cls])}  `
    + `${num(DUEL_CALIBRATION_TARGET[cls])}  ${num(report.deviation[cls])}  ${ok}${gated ? '' : ' (not gated)'}`,
  );
}
console.log('');
console.log(
  report.withinTolerance
    ? `PASS — the four named classes within ±${DUEL_CALIBRATION_TOLERANCE} points of THR-1264, and no bold duellist yielded`
    : `FAIL — a named class misses THR-1264 by more than ±${DUEL_CALIBRATION_TOLERANCE} points, or a duel yielded (kill criterion)`,
);
if (!report.routedWithinTolerance) {
  console.log('note: routed misses 11 by more than 8 — record this breakdown on THR-1264 (the remainder was not routs).');
}
process.exit(report.withinTolerance ? 0 : 1);
