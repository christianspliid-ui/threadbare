// Builds ab.ts twice: as shipped ('template_hash') and with the constant patched to 'walk'.
import { build } from 'esbuild';
import { readFile } from 'fs/promises';
const walkPlugin = {
  name: 'walk',
  setup(b) {
    b.onLoad({ filter: /agent-behavior-constants\.ts$/ }, async (args) => {
      const src = await readFile(args.path, 'utf8');
      const out = src.replace(/CAP_FILL_LOCAL_ORDER: CapFillLocalOrder = 'template_hash'/, "CAP_FILL_LOCAL_ORDER: CapFillLocalOrder = 'walk'");
      if (out === src) throw new Error('walk patch did not apply');
      return { contents: out, loader: 'ts' };
    });
  },
};
const common = { entryPoints: ['Docs/audits/2026-09-25-living-world-data/readers/flip-guard.ts'], bundle: true, platform: 'node', format: 'esm', external: ['fs', 'path'], logLevel: 'warning' };
await build({ ...common, outfile: '.cache/flip-guard-hash.mjs' });
await build({ ...common, outfile: '.cache/flip-guard-walk.mjs', plugins: [walkPlugin] });
console.log('built');
