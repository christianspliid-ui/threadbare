// Builds window-replan.ts (THR-1740) once per arm. Every arm except `main` is a counterfactual
// PROBE, never shipped — build-time patches on the shipped source:
//   main         — shipped `main`.
//   noquest      — branching quests lose the window's too-easy exemption (THR-1689's probe).
//   questfloor   — quests ride the too-easy ramp but bottom out at 0.50, not ENGAGE_TOO_EASY_FIT (the
//                  "milder quest floor" option).
//   noquest_below — noquest + ENGAGE_REFUSE_BELOW 0.30 → 0.40 (the below ramp 0.20 → 0.10 wide).
//   noquest_neutral — noquest + odds-neutral value above the window midpoint: an encounter's value per tick
//                  is scaled by (window midpoint ÷ F) when F is above it, so a sure thing stops earning
//                  extra value for being sure (expected utility already weights reward by the odds).
//   threadonly_neutral — noquest_neutral, except a quest keeps the too-easy exemption when the deciding
//                  mortal is threaded to the ascendant (the population THR-452/465 wrote the exemption for).
//   threadkeep   — threadonly_neutral, and a threaded mortal's quests also skip the odds-neutral scale:
//                  everything a threaded mortal sees in a quest is exactly as shipped.
//   noquest_both  — noquest_below + ENGAGE_TOO_EASY_AT 0.75 → 0.70 (the above ramp 0.10 → 0.05 wide;
//                  outside the constant's documented @range 0.75–0.95, measured to bound decision 3).
import { build } from 'esbuild';
import { readFile } from 'fs/promises';

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

const QUEST_OFF = ['exemptTooEasy: BRANCHING_QUEST_SKIP_OUTGROWTH && entry.isQuestEncounter === true,',
  'exemptTooEasy: false && BRANCHING_QUEST_SKIP_OUTGROWTH && entry.isQuestEncounter === true,'];
const QUEST_FLOOR = ["  if (opts?.exemptTooEasy) return { fit: 1, zone: 'above', ...base };",
  "  if (opts?.exemptTooEasy) { const qs = ENGAGE_TOO_EASY_AT - windowHigh; const qt = qs > 0 ? Math.min(1, (f - windowHigh) / qs) : 1; return { fit: 1 - (1 - 0.5) * qt, zone: 'above', ...base }; }"];
const REFUSE_040 = ['export const ENGAGE_REFUSE_BELOW = 0.30;', 'export const ENGAGE_REFUSE_BELOW = 0.40;'];
const ODDS_NEUTRAL = ['    const valuePerTick = (euRanking + pushBenefit + resistBenefit) / totalCost;',
  '    const valuePerTick = (euRanking + pushBenefit + resistBenefit) / totalCost * (Number.isFinite(engagementForecast) && engagementForecast > 0.575 ? 0.575 / engagementForecast : 1);'];
const QUEST_THREADED_ONLY = ['exemptTooEasy: BRANCHING_QUEST_SKIP_OUTGROWTH && entry.isQuestEncounter === true,',
  'exemptTooEasy: BRANCHING_QUEST_SKIP_OUTGROWTH && entry.isQuestEncounter === true && graph.getIncomingEdges(agentId, "thread").length > 0,'];
const ODDS_NEUTRAL_THREADKEEP = [ODDS_NEUTRAL[0], ODDS_NEUTRAL[1].replace('engagementForecast > 0.575 ?', 'engagementForecast > 0.575 && !(entry.isQuestEncounter === true && graph.getIncomingEdges(agentId, "thread").length > 0) ?')];
const TOO_EASY_070 = ['export const ENGAGE_TOO_EASY_AT = 0.75;', 'export const ENGAGE_TOO_EASY_AT = 0.70;'];

const ARMS = {
  main: [],
  noquest: [patchFile('encounterScoring.ts', [QUEST_OFF])],
  questfloor: [patchFile('engagementWindow.ts', [QUEST_FLOOR])],
  noquest_below: [patchFile('encounterScoring.ts', [QUEST_OFF]), patchFile('agent-behavior-constants.ts', [REFUSE_040])],
  noquest_neutral: [patchFile('encounterScoring.ts', [QUEST_OFF, ODDS_NEUTRAL])],
  threadonly_neutral: [patchFile('encounterScoring.ts', [QUEST_THREADED_ONLY, ODDS_NEUTRAL])],
  threadkeep: [patchFile('encounterScoring.ts', [QUEST_THREADED_ONLY, ODDS_NEUTRAL_THREADKEEP])],
  noquest_both: [patchFile('encounterScoring.ts', [QUEST_OFF]), patchFile('agent-behavior-constants.ts', [REFUSE_040, TOO_EASY_070])],
};
const only = process.argv.slice(2);
for (const [arm, plugins] of Object.entries(ARMS)) {
  if (only.length && !only.includes(arm)) continue;
  await build({
    entryPoints: ['Docs/audits/2026-09-25-living-world-data/readers/window-replan.ts'],
    bundle: true, platform: 'node', format: 'esm', external: ['fs', 'path'], logLevel: 'warning',
    banner: { js: `globalThis.__WINDOW_REPLAN_ARM = ${JSON.stringify(arm)};` },
    outfile: `.cache/window-replan-${arm}.mjs`, plugins,
  });
  console.log(`built .cache/window-replan-${arm}.mjs`);
}

// The same arms through THR-1689's out-of-window reader (own-window share, board joins), with that
// reader's three read-only trace patches (see out-of-window.build.mjs). Arms with an encounterScoring
// patch carry the scored-list hook in the same plugin (esbuild runs one onLoad per file).
const SCORED_HOOK = ['  const top5 = scored.slice(0, 5);', '  (globalThis as any).__OOW_SCORED?.(agentId, tick, scored);\n  const top5 = scored.slice(0, 5);'];
const OOW_ARMS = {
  questfloor: { scoring: [SCORED_HOOK], window: [QUEST_FLOOR], constants: [] },
  noquest_below: { scoring: [SCORED_HOOK, QUEST_OFF], window: [], constants: [REFUSE_040] },
  noquest_both: { scoring: [SCORED_HOOK, QUEST_OFF], window: [], constants: [REFUSE_040, TOO_EASY_070] },
  noquest_neutral: { scoring: [SCORED_HOOK, QUEST_OFF, ODDS_NEUTRAL], window: [], constants: [] },
  threadonly_neutral: { scoring: [SCORED_HOOK, QUEST_THREADED_ONLY, ODDS_NEUTRAL], window: [], constants: [] },
  threadkeep: { scoring: [SCORED_HOOK, QUEST_THREADED_ONLY, ODDS_NEUTRAL_THREADKEEP], window: [], constants: [] },
};
for (const [arm, p] of Object.entries(OOW_ARMS)) {
  if (only.length && !only.includes(arm)) continue;
  const plugins = [
    patchFile('strategic-action-constants.ts', [['export const BOARD_TRACE_TOP_N = 5;', 'export const BOARD_TRACE_TOP_N = 100000;']]),
    patchFile('traceBuffer.ts', [['const BUFFER_SIZE = 2000;', 'const BUFFER_SIZE = 2000000;']]),
    patchFile('encounterScoring.ts', p.scoring),
  ];
  if (p.window.length) plugins.push(patchFile('engagementWindow.ts', p.window));
  if (p.constants.length) plugins.push(patchFile('agent-behavior-constants.ts', p.constants));
  await build({
    entryPoints: ['Docs/audits/2026-09-25-living-world-data/readers/out-of-window.ts'],
    bundle: true, platform: 'node', format: 'esm', external: ['fs', 'path'], logLevel: 'warning',
    outfile: `.cache/out-of-window-${arm}.mjs`, plugins,
  });
  console.log(`built .cache/out-of-window-${arm}.mjs`);
}
