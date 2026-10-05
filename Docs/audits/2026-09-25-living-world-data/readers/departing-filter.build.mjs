// Builds departing-filter.ts (and lead-survey-arms.ts, for the THR-1686 kept-visit
// comparison) twice: as shipped (priced) and with APPOINTMENT_DEPARTING_PRICED_TRAVEL
// patched to false (proxy). THR-1736.
import { build } from 'esbuild';
import { readFile } from 'fs/promises';
const proxyPlugin = {
  name: 'proxy',
  setup(b) {
    b.onLoad({ filter: /movement-content\.ts$/ }, async (args) => {
      const src = await readFile(args.path, 'utf8');
      const out = src.replace(/APPOINTMENT_DEPARTING_PRICED_TRAVEL = true/, 'APPOINTMENT_DEPARTING_PRICED_TRAVEL = false');
      if (out === src) throw new Error('proxy patch did not apply');
      return { contents: out, loader: 'ts' };
    });
  },
};
const dir = 'Docs/audits/2026-09-25-living-world-data/readers';
const common = { bundle: true, platform: 'node', format: 'esm', external: ['fs', 'path'], logLevel: 'warning' };
for (const name of ['departing-filter', 'lead-survey-arms']) {
  await build({ ...common, entryPoints: [`${dir}/${name}.ts`], outfile: `.cache/${name}-priced.mjs` });
  await build({ ...common, entryPoints: [`${dir}/${name}.ts`], outfile: `.cache/${name}-proxy.mjs`, plugins: [proxyPlugin] });
}
console.log('built');
