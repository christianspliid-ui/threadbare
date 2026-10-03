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
import * as fs from 'fs';
import { initializeGameStateFromIdentity, DEV_ASCENDANT_IDENTITY, devSeedTheFirst } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { isEncounterAction } from '../../../../src/engine/chapterArchive';
import { getAnyEncounterById } from '../../../../src/data/encounter-content';
import { getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 150);
const OUT_PATH = process.argv[4];

type P = Record<string, unknown>;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const out: P = { ticks: TICKS, map: 'medium', identity: 'DEV_ASCENDANT_IDENTITY', worlds: {} };

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
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], rt);
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
    }
  }
  const ledgerRows = actions.filter(a => a.ledger);
  const firstTen = ledgerRows.filter(a => (a.tick as number) <= 30).length;
  const story = ledgerRows.filter(a => a.threat !== 'trivial');
  const storyTicks = story.map(a => a.tick as number);
  const gaps = storyTicks.slice(1).map((t, i) => t - storyTicks[i]);
  (out.worlds as P)[seed] = {
    firstId, totalActions: actions.length, ledgerRows: ledgerRows.length, ledgerRowsByTick30: firstTen,
    byLedger, byIntrinsic, byEffective, byRarity, byType, byThreat,
    storyRows: story.length, storyRowsByTick30: story.filter(a => (a.tick as number) <= 30).length,
    storyGapTicks: { min: Math.min(...gaps), median: gaps.sort((x, y) => x - y)[Math.floor(gaps.length / 2)], max: Math.max(...gaps) },
    topTemplates: Object.entries(byTemplate).sort((a, b) => b[1] - a[1]).slice(0, 25),
    notifications: notifs,
    timeline: actions.slice(0, 60),
  };
  console.log(`seed ${seed}: actions ${actions.length}, ledger ${ledgerRows.length} (by t30: ${firstTen})`,
    JSON.stringify({ byThreat, story: story.length, gaps: (out.worlds as P)[seed] && ((out.worlds as P)[seed] as P).storyGapTicks, notifs }));
}
if (OUT_PATH) fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
