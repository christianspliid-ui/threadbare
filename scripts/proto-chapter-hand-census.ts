/**
 * PROTOTYPE (THR-2179, design lane) — never merged; lives on proto/thr-2179-chapter-hand-census.
 *
 * Which story chapters do threaded mortals actually START, and how many of them
 * offer the god a move? Medium map, The First pre-bonded (`devSeedTheFirst`, pause
 * mode — "Asks you"), unattended player. Every new unified action whose actor holds
 * a thread is logged once at first sight, with:
 *   - routine (daily life) or story;
 *   - chapterOffersPlayerMove (the THR-2178 predicate — any step with nudges or a deal);
 *   - step-0 offers a move;
 *   - effectiveTier at first sight;
 *   - the THR-2178 wait word as the Ledger would show it.
 *
 *   node --experimental-strip-types scripts/proto-chapter-hand-census.ts --seeds 42,99,7 --ticks 600 --out <file>
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS, devSeedTheFirst } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { unattended, chapterOffersPlayerMove, stepOffersPlayerMove, chapterWaitWord } from '../src/engine/playerStepHold';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { getUnifiedTemplateById } from '../src/data/unified-action-templates';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const out = arg('--out');

interface Start {
  seed: number; tick: number; actorId: string; templateId: string; name: string;
  known: boolean; routine: boolean; chapterMove: boolean; step0Move: boolean;
  steps: number; tier: string; word: string;
}

const starts: Start[] = [];
for (const seed of seeds) {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.medium;
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'HAND', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const firstId = devSeedTheFirst(state);
  const seen = new Set<string>();
  const t0 = Date.now();
  for (let i = 0; i < ticks; i++) {
    state = unattended(runTick(state, [], runtime));
    const threaded = new Set(state.graph.getOutgoingEdges(state.ascendantId, 'thread').map(e => e.target));
    for (const a of state.unifiedActions ?? []) {
      if (seen.has(a.actionId)) continue;
      seen.add(a.actionId);
      if (!threaded.has(a.actorId)) continue;
      const tpl = getUnifiedTemplateById(a.templateId);
      starts.push({
        seed, tick: state.tick, actorId: a.actorId === firstId ? 'FIRST' : a.actorId, templateId: a.templateId,
        name: tpl?.name ?? '?', known: !!tpl, routine: tpl?.routine === true,
        chapterMove: chapterOffersPlayerMove(tpl), step0Move: stepOffersPlayerMove(tpl, 0),
        steps: tpl?.steps?.length ?? 0, tier: String(a.effectiveTier ?? 'none'),
        word: String(chapterWaitWord(state.graph, a.actorId, tpl, a.choiceHistory, a.effectiveTier) ?? 'none'),
      });
    }
  }
  console.error(`seed ${seed}: ${ticks} ticks in ${((Date.now() - t0) / 1000).toFixed(0)} s, threaded starts so far ${starts.length}`);
}

const story = starts.filter(s => !s.routine);
const byTpl = new Map<string, { n: number; s: Start; seeds: Set<number> }>();
for (const s of story) {
  const e = byTpl.get(s.templateId) ?? { n: 0, s, seeds: new Set<number>() };
  e.n++; e.seeds.add(s.seed); byTpl.set(s.templateId, e);
}
const ranked = [...byTpl.values()].sort((a, b) => b.n - a.n);
const count = (f: (s: Start) => boolean) => story.filter(f).length;
const summary = {
  seeds, ticks,
  threadedStarts: starts.length, routine: starts.length - story.length, story: story.length,
  storyNoMove: count(s => !s.chapterMove), storyStep0Move: count(s => s.step0Move),
  storyUnknownTemplate: count(s => !s.known),
  words: Object.fromEntries(['waits', 'theirs_alone', 'none'].map(w => [w, count(s => s.word === w)])),
  tiers: Object.fromEntries([...new Set(story.map(s => s.tier))].map(t => [t, count(s => s.tier === t)])),
  distinctStoryTemplates: ranked.length,
  distinctNoMove: ranked.filter(r => !r.s.chapterMove).length,
  top20NoMove: ranked.slice(0, 20).filter(r => !r.s.chapterMove).length,
  top20StartsShare: +(ranked.slice(0, 20).reduce((t, r) => t + r.n, 0) / Math.max(1, story.length)).toFixed(3),
};
console.log(JSON.stringify(summary, null, 1));
console.log('| # | template | name | starts | seeds | steps | any move | step-0 move |');
console.log('|---|---|---|---|---|---|---|---|');
ranked.slice(0, 30).forEach((r, i) => console.log(
  `| ${i + 1} | \`${r.s.templateId}\` | ${r.s.name} | ${r.n} | ${r.seeds.size} | ${r.s.steps} | ${r.s.chapterMove ? 'yes' : '**no**'} | ${r.s.step0Move ? 'yes' : 'no'} |`));
if (out) writeFileSync(out, JSON.stringify({ summary, starts }, null, 1));
