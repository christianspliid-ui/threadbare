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
// Default seeds are the gate seeds (`FOUNDING_GATE_SEEDS`); see the args note below.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { createHash } from 'crypto';
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
// `--no-build` reuses the bundles of an earlier run: parallel commands must not rewrite a bundle
// another one is about to execute. `--build-only` builds and exits.
if (!process.argv.includes('--no-build')) {
  await build({ ...common, outfile: '.cache/founding-starvation-off.mjs' });
  await build({ ...common, outfile: '.cache/founding-starvation-on.mjs', plugins: [patchPlugin('costs-on', false)] });
  await build({ ...common, outfile: '.cache/founding-starvation-patron.mjs', plugins: [patchPlugin('costs-and-patron-on', true)] });
}
if (process.argv.includes('--build-only')) process.exit(0);

// Args: `--seeds 42,7` (default: the gate seeds), `--arms off,on,patron` (default: all
// three); `--ticks` / `--map` pass through. Each arm × seed runs in its own process and
// its result is cached under .cache/founding-starvation/, keyed by the run's ticks and
// map, so the gate can be measured one arm or one seed per command: three arms on one
// seed already exceed the 600 s command cap. Every report reads the whole cache.
const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (flag('--seeds') ?? GATE_SEEDS.join(',')).split(',').map(Number);
const arms = (flag('--arms') ?? 'off,on,patron').split(',');
const passThrough = argv.filter((x, i) => !['--seeds', '--arms', '--no-build', '--build-only'].includes(x) && !['--seeds', '--arms'].includes(argv[i - 1]));
const runKey = JSON.stringify(passThrough);
const ARM_FILE = { off: '.cache/founding-starvation-off.mjs', on: '.cache/founding-starvation-on.mjs', patron: '.cache/founding-starvation-patron.mjs' };
for (const arm of arms) if (!ARM_FILE[arm]) throw new Error(`unknown arm "${arm}" (want off, on, patron)`);

// One file per arm × seed, so separate commands may run arms in parallel.
const CACHE_DIR = `.cache/founding-starvation/${createHash('sha1').update(runKey).digest('hex').slice(0, 10)}`;
await mkdir(CACHE_DIR, { recursive: true });
for (const arm of arms) {
  for (const seed of seeds) {
    const out = execFileSync('node', [ARM_FILE[arm], ...passThrough, '--seeds', String(seed)], { encoding: 'utf8', maxBuffer: 1 << 26 });
    const row = out.split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l))[0];
    if (row) await writeFile(`${CACHE_DIR}/${arm}-${seed}.json`, JSON.stringify(row));
  }
}
const results = {};
for (const f of await readdir(CACHE_DIR)) {
  const m = /^(off|on|patron)-(\d+)\.json$/.exec(f);
  if (m) results[`${m[1]}:${m[2]}`] = JSON.parse(await readFile(`${CACHE_DIR}/${f}`, 'utf8'));
}

const measuredSeeds = [...new Set(Object.keys(results).map(k => Number(k.split(':')[1])))].sort((a, b) => a - b);
const rows = [];
for (const seed of measuredSeeds) {
  const a = results[`off:${seed}`];
  const b = results[`on:${seed}`];
  const c = results[`patron:${seed}`];
  const floor = a ? FLOOR * a.foundings : null;
  const ok = !!a && !!c && c.foundings >= floor;
  rows.push({ seed, off: a?.foundings ?? null, on: b?.foundings ?? null, patron: c?.foundings ?? null, floor, pass: ok, complete: !!a && !!c });
  console.log(`seed ${seed}: foundings costs-off ${a?.foundings ?? '—'} · costs-on ${b?.foundings ?? '—'} · costs-on + patron ${c?.foundings ?? '—'} (floor ${FLOOR} × ${a?.foundings ?? '—'} = ${floor === null ? '—' : floor.toFixed(1)}) → ${!a || !c ? 'not measured yet' : ok ? 'PASS' : 'FAIL'}`);
  for (const [label, r] of [['off', a], ['on', b], ['patron', c]]) {
    if (!r) continue;
    console.log(`  ${label}: trade runs paid ${r.tradeRuns} (${r.tradePaid} Means, ${r.tradeSkipped} inside the day), Dominate Regional Trade completed ${r.dominateCompleted}, deciders holding ≥2 lanes ${r.lanesHeld2}, foundings a patron paid ${r.patronPaid ?? 0}`);
  }
}
const gateRows = GATE_SEEDS.map(s => rows.find(r => r.seed === s));
const covered = gateRows.every(r => r?.complete);
const pass = covered && gateRows.every(r => r.pass);
console.log(`founding-starvation floor (patron arm) on every gate seed (${GATE_SEEDS.join(', ')}): ${covered ? (pass ? 'PASS' : 'FAIL') : 'not every gate seed measured yet'}`);
await writeFile('.cache/founding-starvation-verdict.json', JSON.stringify({ pass, floor: FLOOR, gateSeeds: GATE_SEEDS, runKey, rows }, null, 2));
const requested = rows.filter(r => seeds.includes(r.seed) && r.complete);
process.exitCode = requested.every(r => r.pass) ? 0 : 1;
