// THR-1967 (undertakings S3) — builds measure-founding-starvation.ts twice and compares:
//   - arm "off": as shipped (founding costs off);
//   - arm "on":  `MEANS_CELL_COST_ENABLED` patched to true in the bundle only — a
//     counterfactual probe, never shipped. Trade pay is on in both (it is live code).
// The kill line holds when, per seed, foundings(on) >= FOUNDING_STARVATION_FLOOR × foundings(off).
// Extra args (`--seeds`, `--ticks`, `--map`) pass through to both runs.
import { build } from 'esbuild';
import { readFile } from 'fs/promises';
import { execFileSync } from 'child_process';

const FLOOR_SRC = await readFile('src/data/undertaking-economy-constants.ts', 'utf8');
const FLOOR = Number(/FOUNDING_STARVATION_FLOOR = ([0-9.]+)/.exec(FLOOR_SRC)?.[1]);

const costsOn = {
  name: 'costs-on',
  setup(b) {
    b.onLoad({ filter: /mortal-means-constants\.ts$/ }, async (args) => {
      const src = await readFile(args.path, 'utf8');
      const out = src.replace('export const MEANS_CELL_COST_ENABLED = false;', 'export const MEANS_CELL_COST_ENABLED = true;');
      if (out === src) throw new Error('costs-on patch did not apply in mortal-means-constants.ts');
      return { contents: out, loader: 'ts' };
    });
  },
};

const common = {
  entryPoints: ['scripts/measure-founding-starvation.ts'],
  bundle: true, platform: 'node', format: 'esm', logLevel: 'warning',
  external: ['fs', 'path'],
};
await build({ ...common, outfile: '.cache/founding-starvation-off.mjs' });
await build({ ...common, outfile: '.cache/founding-starvation-on.mjs', plugins: [costsOn] });

const args = process.argv.slice(2);
const run = (file) => execFileSync('node', [file, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 })
  .split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l));
const off = run('.cache/founding-starvation-off.mjs');
const on = run('.cache/founding-starvation-on.mjs');

let pass = true;
for (const a of off) {
  const b = on.find(r => r.seed === a.seed);
  const ok = b && b.foundings >= FLOOR * a.foundings;
  if (!ok) pass = false;
  console.log(`seed ${a.seed} t${a.ticks}: foundings costs-off ${a.foundings} · costs-on ${b?.foundings} (floor ${FLOOR} × ${a.foundings} = ${(FLOOR * a.foundings).toFixed(1)}) → ${ok ? 'PASS' : 'FAIL'}`);
  for (const [label, r] of [['off', a], ['on', b]]) {
    console.log(`  ${label}: trade runs paid ${r.tradeRuns} (${r.tradePaid} Means, ${r.tradeSkipped} inside the day), Dominate Regional Trade completed ${r.dominateCompleted}, deciders holding ≥2 lanes ${r.lanesHeld2}`);
  }
}
console.log(`founding-starvation: ${pass ? 'PASS' : 'FAIL'}`);
process.exitCode = pass ? 0 : 1;
