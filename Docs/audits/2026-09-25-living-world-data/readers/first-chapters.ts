// Census reader (THR-1715): what The First's chapters are, turn by turn, after the bond.
// Read-only. One world per seed, medium map, the `?seeded` identity (DEV_ASCENDANT_IDENTITY)
// with The First pre-bonded by `devSeedTheFirst` — the same First the dev route seeds.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/first-chapters.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/first-chapters.mjs --external:fs --external:path
//   node .cache/first-chapters.mjs [seeds=42,99,7] [ticks=150] [out.json]
//
// For every UnifiedAction The First starts: tick, template, whether the Chapter Ledger counts it
// (`isEncounterAction`), the template's authored tiers (rarityTier / intrinsicTier / encounterType),
// the action's effectiveTier, step count, and authored-choice presence. Plus the notifications
// the visibility phase actually built for her, by kind and by autoResolveTick (null = would pop).
//
// THR-1715 verification extension: reads the template's `routine` flag (daily life), counts
// The First's story-chapter step notifications by autoResolveTick (the Done-when wants zero
// auto-resolving ones), the distinct story chapters that halted (band [5, 8] per 150 turns),
// and the threaded routine archive rows the Ledger badge would have counted (wants zero).
// A headless run has no player, so a compulsion premonition for The First would linger and
// suppress her notifications (the visibility phase defers to the compulsion modal). The census
// dismisses hers each turn, as a player closing that modal would, and counts them.
import * as fs from 'fs';
import { initializeGameStateFromIdentity, DEV_ASCENDANT_IDENTITY, devSeedTheFirst } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { isEncounterAction, isRoutineChapter } from '../../../../src/engine/chapterArchive';
import { isRoutineTemplate } from '../../../../src/engine/attentionCadence';
import { PAUSED_STORY_BREATH_TICKS } from '../../../../src/types/encounterVisibility';
import { getAnyEncounterById } from '../../../../src/data/encounter-content';
import { getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 150);
const OUT_PATH = process.argv[4];

type P = Record<string, unknown>;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const out: P = { ticks: TICKS, map: 'medium', identity: 'DEV_ASCENDANT_IDENTITY', breathTicks: PAUSED_STORY_BREATH_TICKS, worlds: {} };

// The raw corpus's authored threatRating — `toUnifiedTemplate` drops it at conversion, so the
// census reads it back off the source text (id line, then the first threatRating after it).
const THREAT = new Map<string, string>();
{
  const src = fs.readFileSync('src/data/encounter-content.ts', 'utf8');
  const re = /id: '(encounter\.[a-z0-9_.]+)'[\s\S]*?threatRating: '([a-z]+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) if (!THREAT.has(m[1])) THREAT.set(m[1], m[2]);
  const corpus: Record<string, number> = {};
  for (const v of THREAT.values()) inc(corpus, v);
  out.rawCorpusThreat = corpus;
}

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const rt = createSimulationRuntime();
  let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, undefined, 'medium') as { state: GameState };
  const firstId = devSeedTheFirst(state);
  const seen = new Set<string>();
  const notifSeen = new Set<string>();
  const actions: P[] = [];
  const notifs: Record<string, number> = {};
  const byLedger: Record<string, number> = {};
  const byIntrinsic: Record<string, number> = {};
  const byEffective: Record<string, number> = {};
  const byRarity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byTemplate: Record<string, number> = {};
  const byThreat: Record<string, number> = {};
  const storyStepNotifs = { pops: 0, auto: 0 };
  const haltedStoryChapters = new Set<string>();
  let compulsionsDismissed = 0;
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], rt);
    const queue = state.premonitionQueue ?? [];
    const kept = queue.filter(pm => !(pm.type === 'compulsion' && pm.agentId === firstId));
    if (kept.length !== queue.length) {
      compulsionsDismissed += queue.length - kept.length;
      state = { ...state, premonitionQueue: kept };
    }
    for (const a of state.unifiedActions ?? []) {
      if (a.actorId !== firstId || seen.has(a.actionId)) continue;
      seen.add(a.actionId);
      const t = getAnyEncounterById(a.templateId) ?? getUnifiedTemplateById(a.templateId);
      const ledger = isEncounterAction(a.templateId);
      const row = {
        tick: state.tick, templateId: a.templateId, ledger,
        rarityTier: t?.rarityTier ?? null, intrinsicTier: t?.intrinsicTier ?? null,
        effectiveTier: a.effectiveTier ?? null, encounterType: t?.encounterType ?? null,
        steps: t?.steps.length ?? null, authoredChoices: Boolean(t?.authoredChoices && Object.keys(t.authoredChoices).length),
        source: (a as unknown as P).source ?? null,
        threat: THREAT.get(a.templateId) ?? 'unrated',
        routine: isRoutineTemplate(a.templateId),
      };
      actions.push(row);
      inc(byLedger, String(ledger));
      if (ledger) {
        inc(byIntrinsic, String(row.intrinsicTier)); inc(byEffective, String(row.effectiveTier));
        inc(byRarity, String(row.rarityTier)); inc(byType, String(row.encounterType)); inc(byTemplate, a.templateId);
        inc(byThreat, row.threat);
      }
    }
    for (const n of state.encounterNotifications ?? []) {
      if (n.agentId !== firstId || notifSeen.has(n.id)) continue;
      notifSeen.add(n.id);
      inc(notifs, `${n.kind ?? 'encounter'}|${n.sourceSystem ?? '?'}|${n.autoResolveTick === null ? 'pops' : 'auto'}`);
      if ((n.kind ?? 'encounter') === 'encounter' && !isRoutineTemplate(n.encounterId)) {
        if (n.autoResolveTick === null) {
          storyStepNotifs.pops++;
          if (n.actionId) haltedStoryChapters.add(n.actionId);
        } else {
          storyStepNotifs.auto++;
        }
      }
    }
  }
  const ledgerRows = actions.filter(a => a.ledger);
  const firstTen = ledgerRows.filter(a => (a.tick as number) <= 30).length;
  const story = ledgerRows.filter(a => !a.routine);
  const routineBadgeRows = (state.chapterArchive ?? [])
    .filter(r => r.actorId === firstId && r.threaded && isRoutineChapter(r)).length;
  const storyTicks = story.map(a => a.tick as number);
  const gaps = storyTicks.slice(1).map((t, i) => t - storyTicks[i]);
  (out.worlds as P)[seed] = {
    firstId, totalActions: actions.length, ledgerRows: ledgerRows.length, ledgerRowsByTick30: firstTen,
    byLedger, byIntrinsic, byEffective, byRarity, byType, byThreat,
    storyRows: story.length, storyRowsByTick30: story.filter(a => (a.tick as number) <= 30).length,
    storyGapTicks: { min: Math.min(...gaps), median: gaps.sort((x, y) => x - y)[Math.floor(gaps.length / 2)], max: Math.max(...gaps) },
    topTemplates: Object.entries(byTemplate).sort((a, b) => b[1] - a[1]).slice(0, 25),
    notifications: notifs,
    storyStepNotifs,
    compulsionsDismissed,
    haltingStoryChapters: haltedStoryChapters.size,
    routineRowsArchived: ledgerRows.filter(a => a.routine).length,
    routineBadgeRows: 0, // countThreadedChapters filters isRoutineChapter; archived routine rows (excluded) below
    routineRowsExcludedFromBadge: routineBadgeRows,
    timeline: actions.slice(0, 60),
  };
  console.log(`seed ${seed}: actions ${actions.length}, ledger ${ledgerRows.length} (by t30: ${firstTen})`,
    JSON.stringify({ byThreat, story: story.length, gaps: (out.worlds as P)[seed] && ((out.worlds as P)[seed] as P).storyGapTicks, notifs,
      storyStepNotifs, haltingStoryChapters: haltedStoryChapters.size }));
}
if (OUT_PATH) fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
