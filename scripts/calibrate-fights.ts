/**
 * `calibrate:fights` — the fight block's calibration evidence (THR-1543, FB7).
 *
 * Runs 400 seeded fights of `fight.lair.confront` through the real unified road
 * against THR-1531's "Major elite" row (steep / steep / clock 4 / stubborn), fought
 * by its "bold guard" (courage +0.35; clash and nerve re-stamped by THR-1581 so each
 * step rolls `main`'s odds on the re-fitted dice — see `fightCalibration.ts`), and
 * prints the result distribution beside the row. It then prints a capability-1.0
 * "master" run of the same row as a diagnostic — reported, never gated. Exit 1 when any class misses by more than
 * ±10 points — the plan doc's kill criterion: diagnose before touching a tunable.
 *
 * Usage: npm run calibrate:fights [-- --fights N] [-- --seed S]
 */

import {
  FIGHT_CALIBRATION_CLASSES,
  FIGHT_CALIBRATION_FIGHTS,
  FIGHT_CALIBRATION_TARGET,
  FIGHT_CALIBRATION_TOLERANCE,
  runFightCalibration,
} from '../src/testing/fightCalibration';
import { disableTracing } from '../src/engine/traceBuffer';

const argv = process.argv.slice(2);
const flag = (name: string): number | undefined => {
  const i = argv.indexOf(name);
  const v = i >= 0 ? Number(argv[i + 1]) : NaN;
  return Number.isFinite(v) ? v : undefined;
};

disableTracing();
const fights = flag('--fights') ?? FIGHT_CALIBRATION_FIGHTS;
const seed = flag('--seed') ?? 1531;
const report = runFightCalibration(fights, seed);

const pad = (s: string, n: number) => s.padEnd(n);
const num = (v: number) => v.toFixed(1).padStart(6);
console.log('');
console.log(`fight calibration — fight.lair.confront × ${report.fights} fights (seed ${seed})`);
console.log(`opponent: Major elite (steep / steep / clock 4 / stubborn)`);
console.log(
  `fighter:  bold guard, odds-preserved (clash ${report.fighterCapability.clash.toFixed(3)}, `
  + `nerve ${report.fighterCapability.nerve.toFixed(3)}, courage +0.35)`,
);
console.log('');
console.log(`${pad('class', 12)}${pad('count', 8)}${pad('   %', 8)}${pad('target', 8)}${pad('  Δ', 8)}`);
for (const cls of FIGHT_CALIBRATION_CLASSES) {
  const ok = Math.abs(report.deviation[cls]) <= FIGHT_CALIBRATION_TOLERANCE ? 'ok' : 'MISS';
  console.log(
    `${pad(cls, 12)}${String(report.counts[cls]).padStart(5)}   ${num(report.percent[cls])}  `
    + `${num(FIGHT_CALIBRATION_TARGET[cls])}  ${num(report.deviation[cls])}  ${ok}`,
  );
}
console.log('');
console.log(`mean segments dealt: ${report.meanSegments.toFixed(2)} (THR-1531: 1.3)`);
console.log(`mean harm queued:    ${report.meanHarm.toFixed(3)} (THR-1531: 0.13, attended; this run is unattended)`);
console.log(
  report.withinTolerance
    ? `PASS — every class within ±${FIGHT_CALIBRATION_TOLERANCE} points of THR-1531`
    : `FAIL — a class misses THR-1531 by more than ±${FIGHT_CALIBRATION_TOLERANCE} points (kill criterion)`,
);

// THR-1581 diagnostic — what a master (capability 1.0 in both reaches) does to a steep
// elite on the re-fitted dice. Not gated: the row describes a bold guard.
const master = runFightCalibration(fights, seed, 'master');
console.log('');
console.log(
  `diagnostic (not gated): master (clash ${master.fighterCapability.clash.toFixed(3)}, `
  + `nerve ${master.fighterCapability.nerve.toFixed(3)})`,
);
for (const cls of FIGHT_CALIBRATION_CLASSES) {
  console.log(`  ${pad(cls, 12)}${String(master.counts[cls]).padStart(5)}   ${num(master.percent[cls])}`);
}
process.exit(report.withinTolerance ? 0 : 1);
