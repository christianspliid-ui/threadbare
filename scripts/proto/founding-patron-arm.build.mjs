// PROTO — THR-2006. Builds measure-founding-starvation.ts with founding costs ON and the
// patron rule ON (both patched in the bundle only). Never merged.
import { build } from 'esbuild';
import { readFile } from 'fs/promises';
const patch = {
  name: 'costs-and-patron-on',
  setup(b) {
    b.onLoad({ filter: /mortal-means-constants\.ts$/ }, async (args) => {
      let src = await readFile(args.path, 'utf8');
      src = src.replace('export const MEANS_CELL_COST_ENABLED = false;', 'export const MEANS_CELL_COST_ENABLED = true;');
      src = src.replace('export const FOUNDING_PATRON_PROTO = false;', 'export const FOUNDING_PATRON_PROTO = true;');
      if (!src.includes('MEANS_CELL_COST_ENABLED = true') || !src.includes('FOUNDING_PATRON_PROTO = true')) throw new Error('patch miss');
      return { contents: src, loader: 'ts' };
    });
  },
};
await build({ entryPoints: ['scripts/measure-founding-starvation.ts'], bundle: true, platform: 'node', format: 'esm', logLevel: 'warning', external: ['fs', 'path'], outfile: '.cache/founding-patron-on.mjs', plugins: [patch] });
console.log('built');
