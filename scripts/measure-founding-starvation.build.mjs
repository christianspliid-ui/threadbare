// THR-1967 (undertakings S3) — builds measure-founding-starvation.ts three ways and compares:
//   - arm "off":    as shipped (founding costs off);
//   - arm "on":     `MEANS_CELL_COST_ENABLED` patched to true and the founding patron
//                   (`FOUNDING_PATRON_ENABLED`, THR-2008) patched off — costs alone;
//   - arm "patron": costs patched on, the patron as shipped (on).
// The "on" and "patron" arms are counterfactual probes built in the bundle only, never
// shipped. Trade pay is on in every arm (it is live code).
// The floor holds when, per seed, foundings(patron) >= FOUNDING_STARVATION_FLOOR × foundings(off).
// It is the second of the two predicates `MEANS_CELL_COST_ENABLED` needs (THR-2008); the
// verdict is written to .cache/founding-starvation-verdict.json for `npm run measure:means`.
// Extra args (`--seeds`, `--ticks`, `--map`) pass through to every run. Default seeds are
// the gate seeds (`FOUNDING_GATE_SEEDS`).
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { execFileSync } from 'child_process';

const FLOOR_SRC = await readFile('src/data/undertaking-economy-constants.ts', 'utf8');
const FLOOR = Number(/FOUNDING_STARVATION_FLOOR = ([0-9.]+)/.exec(FLOOR_SRC)?.[1]);
const MEANS_SRC = await readFile('src/data/mortal-means-constants.ts', 'utf8');
const GATE_SEEDS = (/FOUNDING_GATE_SEEDS: readonly number\[\] = \[([0-9, ]+)\]/.exec(MEANS_SRC)?.[1] ?? '42')
  .split(',').map(s => Number(s.trim()));

function patchPlugin(name, patronOn) {
  return {
    name,
    setup(b) {
      b.onLoad({ filter: /mortal-means-constants\.ts$/ }, async (args) => {
        const src = await readFile(args.path, 'utf8');
        let out = src.replace('export const MEANS_CELL_COST_ENABLED = false;', 'export const MEANS_CELL_COST_ENABLED = true;');
        if (out === src) throw new Error(`${name} patch did not apply: MEANS_CELL_COST_ENABLED in mortal-means-constants.ts`);
        if (!patronOn) {
          const before = out;
          out = out.replace('export const FOUNDING_PATRON_ENABLED = true;', 'export const FOUNDING_PATRON_ENABLED = false;');
          if (out === before) throw new Error(`${name} patch did not apply: FOUNDING_PATRON_ENABLED in mortal-means-constants.ts`);
        } else if (!out.includes('export const FOUNDING_PATRON_ENABLED = true;')) {
          throw new Error(`${name}: FOUNDING_PATRON_ENABLED is not shipped on`);
        }
        return { contents: out, loader: 'ts' };
      });
    },
  };
}

const common = {
  entryPoints: ['scripts/measure-founding-starvation.ts'],
  bundle: true, platform: 'node', format: 'esm', logLevel: 'warning',
  external: ['fs', 'path'],
};
await build({ ...common, outfile: '.cache/founding-starvation-off.mjs' });
await build({ ...common, outfile: '.cache/founding-starvation-on.mjs', plugins: [patchPlugin('costs-on', false)] });
await build({ ...common, outfile: '.cache/founding-starvation-patron.mjs', plugins: [patchPlugin('costs-and-patron-on', true)] });

const args = process.argv.slice(2);
if (!args.includes('--seeds')) args.push('--seeds', GATE_SEEDS.join(','));
const seeds = args[args.indexOf('--seeds') + 1].split(',').map(Number);
// One seed per process: three arms on several seeds in one process exceed the command cap.
const run = (file) => seeds.flatMap(seed => {
  const perSeed = [...args];
  perSeed[perSeed.indexOf('--seeds') + 1] = String(seed);
  return execFileSync('node', [file, ...perSeed], { encoding: 'utf8', maxBuffer: 1 << 26 })
    .split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l));
});
const off = run('.cache/founding-starvation-off.mjs');
const on = run('.cache/founding-starvation-on.mjs');
const patron = run('.cache/founding-starvation-patron.mjs');

let pass = true;
const rows = [];
for (const a of off) {
  const b = on.find(r => r.seed === a.seed);
  const c = patron.find(r => r.seed === a.seed);
  const floor = FLOOR * a.foundings;
  const ok = !!c && c.foundings >= floor;
  if (!ok) pass = false;
  rows.push({ seed: a.seed, off: a.foundings, on: b?.foundings ?? null, patron: c?.foundings ?? null, floor, pass: ok });
  console.log(`seed ${a.seed} t${a.ticks}: foundings costs-off ${a.foundings} · costs-on ${b?.foundings} · costs-on + patron ${c?.foundings} (floor ${FLOOR} × ${a.foundings} = ${floor.toFixed(1)}) → ${ok ? 'PASS' : 'FAIL'}`);
  for (const [label, r] of [['off', a], ['on', b], ['patron', c]]) {
    if (!r) continue;
    console.log(`  ${label}: trade runs paid ${r.tradeRuns} (${r.tradePaid} Means, ${r.tradeSkipped} inside the day), Dominate Regional Trade completed ${r.dominateCompleted}, deciders holding ≥2 lanes ${r.lanesHeld2}${r.patronPaid !== undefined ? `, foundings a patron paid ${r.patronPaid}` : ''}`);
  }
}
const gateSeedsCovered = GATE_SEEDS.every(s => rows.some(r => r.seed === s));
console.log(`founding-starvation (patron arm): ${pass ? 'PASS' : 'FAIL'}${gateSeedsCovered ? '' : ` — not every gate seed (${GATE_SEEDS.join(', ')}) was measured`}`);
await mkdir('.cache', { recursive: true });
await writeFile('.cache/founding-starvation-verdict.json', JSON.stringify({ pass: pass && gateSeedsCovered, floor: FLOOR, gateSeeds: GATE_SEEDS, rows, args }, null, 2));
process.exitCode = pass ? 0 : 1;
