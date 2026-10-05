// Builds out-of-window.ts (THR-1689) twice. Both builds carry three READ-ONLY patches so the
// reader sees the whole decision:
//   - BOARD_TRACE_TOP_N 5 → 100000: only `board.top` reads it, and only traces read `board.top`.
//   - the trace ring 2000 → 2000000: the reader clears it every tick anyway.
//   - a hook handing the encounter scorer's FULL ranked list (up to MAX_SCORED_CANDIDATES) to the
//     reader, so "no in-window encounter on the board" splits into "cut by the board's top-5
//     slice" vs "absent from the scored list". It reads `scored` and writes nothing.
// The reader's `--no-trace` arm proves the ledger is unchanged by them.
//
// The second build is a counterfactual PROBE, never shipped: branching quests lose the window's
// too-easy exemption. The outgrowth FILTER's exemption (encounterFilterPipeline) is left alone —
// that filter is off anyway (THR-1581) — so a quest stays reachable, just discounted like any
// other above-window challenge.
import { build } from 'esbuild';
import { readFile } from 'fs/promises';

// esbuild runs only the first matching onLoad per file, so each file gets one plugin carrying
// all of its replacements.
const patchFile = (file, steps) => ({
  name: `patch-${file}`,
  setup(b) {
    b.onLoad({ filter: new RegExp(`${file.replace('.', '\\.')}$`) }, async (args) => {
      let src = await readFile(args.path, 'utf8');
      for (const [from, to] of steps) {
        const out = src.replace(from, to);
        if (out === src) throw new Error(`patch did not apply in ${file}: ${from}`);
        src = out;
      }
      return { contents: src, loader: 'ts' };
    });
  },
});

const SCORED_HOOK = ['  const top5 = scored.slice(0, 5);', '  (globalThis as any).__OOW_SCORED?.(agentId, tick, scored);\n  const top5 = scored.slice(0, 5);'];
const QUEST_OFF = [
  'exemptTooEasy: BRANCHING_QUEST_SKIP_OUTGROWTH && entry.isQuestEncounter === true,',
  'exemptTooEasy: false && BRANCHING_QUEST_SKIP_OUTGROWTH && entry.isQuestEncounter === true,',
];
const plugins = (questOff) => [
  patchFile('strategic-action-constants.ts', [['export const BOARD_TRACE_TOP_N = 5;', 'export const BOARD_TRACE_TOP_N = 100000;']]),
  patchFile('traceBuffer.ts', [['const BUFFER_SIZE = 2000;', 'const BUFFER_SIZE = 2000000;']]),
  patchFile('encounterScoring.ts', questOff ? [SCORED_HOOK, QUEST_OFF] : [SCORED_HOOK]),
];
const common = {
  entryPoints: ['Docs/audits/2026-09-25-living-world-data/readers/out-of-window.ts'],
  bundle: true, platform: 'node', format: 'esm', external: ['fs', 'path'], logLevel: 'warning',
};
await build({ ...common, outfile: '.cache/out-of-window.mjs', plugins: plugins(false) });
await build({ ...common, outfile: '.cache/out-of-window-noquest.mjs', plugins: plugins(true) });
console.log('built .cache/out-of-window.mjs and .cache/out-of-window-noquest.mjs');
