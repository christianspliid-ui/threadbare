// Builds master-band.ts (THR-1742) with two READ-ONLY hooks, so the reader sees the whole
// decision funnel for a master's free choice:
//   - before scoreAndSelect in phaseAgentDecision: the pool handed to the filter pipeline, what
//     survived it, and what survived cooldown + max-completions (plus the world cache, to tell
//     "absent nearby" from "absent from the world").
//   - on `scored` in encounterScoring: the scorer's full ranked list.
// Neither hook writes anything the engine reads; the reader's `--no-trace` arm proves the ledger
// is unchanged by them.
//
// The second build is a counterfactual PROBE, never shipped: the cap stage also keeps every entry
// the reader's `__MB_KEEP` accepts (master-band work in a reach the decider is a master in). It
// answers "if master work always reached the board, would masters take it, and would the rung
// separate?" — the ceiling that authoring more master templates could reach.
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

// The probe's cap patch (second build only): also keep every entry `__MB_KEEP` accepts.
const KEEP_OWN_MASTER = [
  '  return [...reserved, ...filled];',
  '  const __keep = (globalThis as any).__MB_KEEP;\n'
  + '  if (__keep) for (const e of entries) { const k = e.templateId + ":" + e.locationId; if (!reservedKeys.has(k) && __keep(agentId, graph, e)) { filled.push(e); reservedKeys.add(k); } }\n'
  + '  return [...reserved, ...filled];',
];

const build1 = (keep, outfile) => build({
  entryPoints: ['Docs/audits/2026-09-25-living-world-data/readers/master-band.ts'],
  bundle: true, platform: 'node', format: 'esm', external: ['fs', 'path'], logLevel: 'warning',
  outfile,
  plugins: [
    patchFile('encounterScoring.ts', [['  const top5 = scored.slice(0, 5);', '  (globalThis as any).__OOW_SCORED?.(agentId, tick, scored);\n  const top5 = scored.slice(0, 5);']]),
    // Per-stage snapshots of the filter pipeline, so "cut by the filter" names the stage.
    patchFile('encounterFilterPipeline.ts', [
      ...(keep ? [KEEP_OWN_MASTER] : []),
      ['current = stageAwareness(allEntries, agentId, agentLocationId, graph, mapCols, mapRows);', 'current = stageAwareness(allEntries, agentId, agentLocationId, graph, mapCols, mapRows); (globalThis as any).__MB_FSTAGE?.(\'awareness\', current);'],
      ['current = filterByVisibility(current, agentId, graph);', 'current = filterByVisibility(current, agentId, graph); (globalThis as any).__MB_FSTAGE?.(\'visibility\', current);'],
      ['current = filterByPrerequisites(current, agentId, graph, holdReader);', 'current = filterByPrerequisites(current, agentId, graph, holdReader); (globalThis as any).__MB_FSTAGE?.(\'prerequisites\', current);'],
      ['current = filterByReputationGates(current, agentId, graph);', 'current = filterByReputationGates(current, agentId, graph); (globalThis as any).__MB_FSTAGE?.(\'reputation\', current);'],
      ['current = filterByOutgrowth(current, agentId, graph);', 'current = filterByOutgrowth(current, agentId, graph); (globalThis as any).__MB_FSTAGE?.(\'outgrowth\', current);'],
      ['current = filterByStoryBreath(current, agentId, graph, tick);', 'current = filterByStoryBreath(current, agentId, graph, tick); (globalThis as any).__MB_FSTAGE?.(\'story-breath\', current);'],
      ['current = filterByThreat(current, agentId, graph);', 'current = filterByThreat(current, agentId, graph); (globalThis as any).__MB_FSTAGE?.(\'threat\', current);'],
      ['current = capWithDiversity(current, agentId, graph, tick, capFill, agentLocationId, capReport);', 'current = capWithDiversity(current, agentId, graph, tick, capFill, agentLocationId, capReport); (globalThis as any).__MB_FSTAGE?.(\'cap\', current);'],
    ]),
    patchFile('phaseAgentDecision.ts', [['      const decision = scoreAndSelect(', '      (globalThis as any).__MB_STAGES?.(agentId, state.tick, graph, encounterCache, mergedEntries, rawCandidates, candidates);\n      const decision = scoreAndSelect(']]),
  ],
});
await build1(false, '.cache/master-band.mjs');
await build1(true, '.cache/master-band-keep.mjs');
console.log('built .cache/master-band.mjs and .cache/master-band-keep.mjs');
