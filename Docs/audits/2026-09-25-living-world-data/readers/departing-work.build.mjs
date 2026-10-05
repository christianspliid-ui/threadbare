// Builds departing-filter.ts twice for THR-1737: as shipped (max — the departing filter
// prices work at its longest roll) and with APPOINTMENT_DEPARTING_PRICES_LONGEST_ROLL
// patched to false (min — the `duration.min` sum, THR-1736's state). Then
//   node .cache/departing-filter-<arm>.mjs <seed> [ticks=200]
import { build } from 'esbuild';
import { readFile } from 'fs/promises';
const minPlugin = {
  name: 'min',
  setup(b) {
    b.onLoad({ filter: /movement-content\.ts$/ }, async (args) => {
      const src = await readFile(args.path, 'utf8');
      const out = src.replace(/APPOINTMENT_DEPARTING_PRICES_LONGEST_ROLL = true/, 'APPOINTMENT_DEPARTING_PRICES_LONGEST_ROLL = false');
      if (out === src) throw new Error('min patch did not apply');
      return { contents: out, loader: 'ts' };
    });
  },
};
const dir = 'Docs/audits/2026-09-25-living-world-data/readers';
const common = { bundle: true, platform: 'node', format: 'esm', external: ['fs', 'path'], logLevel: 'warning' };
await build({ ...common, entryPoints: [`${dir}/departing-filter.ts`], outfile: '.cache/departing-filter-max.mjs' });
await build({ ...common, entryPoints: [`${dir}/departing-filter.ts`], outfile: '.cache/departing-filter-min.mjs', plugins: [minPlugin] });
console.log('built');
