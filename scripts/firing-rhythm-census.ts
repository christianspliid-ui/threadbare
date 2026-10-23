/**
 * Firing-rhythm census — THR-1218 S1 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Promoted from the natural-firing baseline harness
 * (`Docs/audits/2026-10-16-thr-1218-natural-firing/`): a headless world plus
 * `devSeedTheFirst` (the same bond `?seeded` writes), no spawn levers, every new
 * unified action harvested the tick it appears. It follows The First — the one
 * paused mortal a headless world has — and reports her story rhythm.
 *
 * A **story chapter** is a non-routine encounter (template id `encounter.` / `enc.`,
 * not `routine`). An **own draw** is one she chose herself (`source: 'agent'`) — the
 * only chapters the tellings cap and the drought anchor see.
 *
 * Prints per seed: story chapters per 150-tick quarter, the gap list, tellings per
 * story template, family repeats, halts vs aftermath-only (with what the
 * aftermath-only chapters have in common), and story sources by location. Then
 * the predicates (exit 1 on a FAIL):
 *   - PASS when no own-draw story template is told more than PAUSED_STORY_MAX_TELLINGS
 *     times outside a relaxed window (a gap ≥ STORY_DROUGHT_RELAX_TICKS since her
 *     previous own-draw story chapter);
 *   - PASS when own-draw story chapters per seed are not fewer than the baseline's
 *     (BASELINE_OWN_DRAW_STORY at 617802fb) minus one;
 *   - WARN when a story chapter follows its own family in more than
 *     FAMILY_REPEAT_WARN_RATIO of consecutive pairs (D3's tripwire).
 *
 * Usage:
 *   npm run census:rhythm                                        # seeds 42,7,1234 × 600 ticks, medium
 *   npm run census:rhythm -- --seeds 42 --ticks 300 --map small
 */

import { initializeGameState, MAP_SIZE_PRESETS, devSeedTheFirst } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime, touchStructure } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../src/data/unified-action-templates';
import { getAgentLocationId, getThreadTo } from '../src/engine/graphQueries';
import { PAUSED_STORY_MAX_TELLINGS, STORY_DROUGHT_RELAX_TICKS } from '../src/data/agent-behavior-constants';

/** Own-draw story chapters of The First per seed, 600 ticks, medium, at 617802fb (baseline § 3). */
const BASELINE_OWN_DRAW_STORY: Record<number, number> = { 42: 18, 7: 10, 1234: 13 };
/** Slack on the baseline predicate: "not fewer than the baseline minus one". */
const BASELINE_SLACK = 1;
/** D3's tripwire: a story chapter following its own family in more than this share of pairs. */
const FAMILY_REPEAT_WARN_RATIO = 0.2;
/** Width of one reporting window. */
const QUARTER_TICKS = 150;

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,7,1234').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

interface TemplateInfo { routine?: boolean; encounterType?: string; steps?: unknown[]; name?: string }
const TEMPLATES = new Map<string, TemplateInfo>();
for (const t of [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES] as Array<TemplateInfo & { id: string }>) {
  TEMPLATES.set(t.id, t);
}

const isEncounterId = (id: string) => /^(encounter|enc)\./.test(id);
const familyOf = (id: string) => TEMPLATES.get(id)?.encounterType || id.split('.').slice(0, 2).join('.');

interface Chapter {
  tick: number;
  actionId: string;
  templateId: string;
  source: string;
  ownDraw: boolean;
  effectiveTier: string;
  steps: number;
  locationId: string;
  resolvedTick: number | null;
  halted: boolean;
  aftermath: boolean;
}

function runSeed(seed: number) {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'RHYTHM', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const firstId = devSeedTheFirst(state);
  touchStructure(runtime);
  const established = (getThreadTo(state.graph, firstId)?.properties?.establishedTick as number | undefined) ?? 0;

  const seen = new Set<string>();
  const seenNotif = new Set<string>();
  const chapters: Chapter[] = [];
  const byAction = new Map<string, Chapter>();
  const notif = new Map<string, { halted: boolean; aftermath: boolean }>();

  const harvest = () => {
    for (const a of state.unifiedActions ?? []) {
      const known = byAction.get(a.actionId);
      if (known && known.resolvedTick === null && a.resolved) known.resolvedTick = state.tick;
      if (seen.has(a.actionId)) continue;
      seen.add(a.actionId);
      if (a.actorId !== firstId || !isEncounterId(a.templateId)) continue;
      const t = TEMPLATES.get(a.templateId);
      if (t?.routine === true) continue;
      const ch: Chapter = {
        tick: state.tick,
        actionId: a.actionId,
        templateId: a.templateId,
        source: String(a.source),
        ownDraw: a.source === 'agent' && !a.spawnedFromSeedId,
        effectiveTier: String(a.effectiveTier ?? 'unset'),
        steps: Array.isArray(t?.steps) ? t!.steps!.length : 0,
        locationId: getAgentLocationId(state.graph, firstId) ?? '(none)',
        resolvedTick: a.resolved ? state.tick : null,
        halted: false,
        aftermath: false,
      };
      chapters.push(ch);
      byAction.set(a.actionId, ch);
    }
    for (const n of state.encounterNotifications ?? []) {
      if (seenNotif.has(n.id)) continue;
      seenNotif.add(n.id);
      const key = n.actionId ?? n.encounterId;
      const r = notif.get(key) ?? { halted: false, aftermath: false };
      if (n.kind === 'aftermath') r.aftermath = true;
      else if (n.autoResolveTick === null) r.halted = true;
      notif.set(key, r);
    }
  };

  harvest();
  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    harvest();
  }
  for (const ch of chapters) {
    const r = notif.get(ch.actionId);
    ch.halted = r?.halted ?? false;
    ch.aftermath = r?.aftermath ?? false;
  }
  return { seed, firstId, established, chapters, endTick: state.tick };
}

type SeedResult = ReturnType<typeof runSeed>;

function report(r: SeedResult) {
  const own = r.chapters.filter(c => c.ownDraw);
  console.log(`\n## seed ${r.seed} — The First ${r.firstId}, ${r.chapters.length} story chapters (${own.length} own draws), ticks ${ticks}`);

  const quarters: number[] = [];
  for (const c of r.chapters) {
    const q = Math.floor((c.tick - (r.endTick - ticks)) / QUARTER_TICKS);
    quarters[q] = (quarters[q] ?? 0) + 1;
  }
  console.log(`story chapters per ${QUARTER_TICKS}-tick quarter (all sources): ${Array.from({ length: Math.ceil(ticks / QUARTER_TICKS) }, (_, i) => quarters[i] ?? 0).join(' / ')}`);

  const gaps: number[] = [];
  for (let i = 1; i < own.length; i++) gaps.push(own[i].tick - own[i - 1].tick);
  console.log(`gaps between own-draw story chapters (ticks, sorted): ${[...gaps].sort((a, b) => a - b).join(', ') || '-'}`);

  // Tellings, and whether each telling past the cap fell in a relaxed window.
  const tellings = new Map<string, number>();
  const violations: string[] = [];
  let prevStart = r.established;
  for (const c of own) {
    const n = (tellings.get(c.templateId) ?? 0) + 1;
    tellings.set(c.templateId, n);
    const relaxed = c.tick - prevStart >= STORY_DROUGHT_RELAX_TICKS;
    if (n > PAUSED_STORY_MAX_TELLINGS && !relaxed) violations.push(`${c.templateId} telling #${n} at tick ${c.tick}`);
    prevStart = c.tick;
  }
  console.log('tellings per story template (own draws):');
  for (const [id, n] of [...tellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    console.log(`  ${String(n).padStart(2)}  ${id}`);
  }

  let pairs = 0;
  let sameFamily = 0;
  for (let i = 1; i < r.chapters.length; i++) {
    pairs++;
    if (familyOf(r.chapters[i].templateId) === familyOf(r.chapters[i - 1].templateId)) sameFamily++;
  }
  const familyRatio = pairs > 0 ? sameFamily / pairs : 0;
  console.log(`family repeats: ${sameFamily} of ${pairs} consecutive story pairs (${(familyRatio * 100).toFixed(1)}%)`);

  const halted = r.chapters.filter(c => c.halted);
  const aftermathOnly = r.chapters.filter(c => !c.halted && c.aftermath);
  const silent = r.chapters.filter(c => !c.halted && !c.aftermath);
  console.log(`halts vs aftermath-only: ${halted.length} halted, ${aftermathOnly.length} aftermath-only, ${silent.length} neither`);
  const tally = (list: Chapter[], key: (c: Chapter) => string) => {
    const m = new Map<string, number>();
    for (const c of list) m.set(key(c), (m.get(key(c)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join(', ') || '-';
  };
  const life = (c: Chapter) => (c.resolvedTick === null ? 'unresolved' : c.resolvedTick === c.tick ? 'same-tick' : `${c.resolvedTick - c.tick}t`);
  console.log(`  halted         — tier: ${tally(halted, c => c.effectiveTier)}; source: ${tally(halted, c => c.source)}; life: ${tally(halted, life)}`);
  console.log(`  aftermath-only — tier: ${tally(aftermathOnly, c => c.effectiveTier)}; source: ${tally(aftermathOnly, c => c.source)}; life: ${tally(aftermathOnly, life)}`);

  console.log('story sources by location (own draws: chapters / distinct templates):');
  const byLoc = new Map<string, Set<string> & { n?: number }>();
  const counts = new Map<string, number>();
  for (const c of own) {
    if (!byLoc.has(c.locationId)) byLoc.set(c.locationId, new Set());
    byLoc.get(c.locationId)!.add(c.templateId);
    counts.set(c.locationId, (counts.get(c.locationId) ?? 0) + 1);
  }
  for (const [loc, set] of [...byLoc.entries()].sort((a, b) => (counts.get(b[0]) ?? 0) - (counts.get(a[0]) ?? 0))) {
    console.log(`  ${String(counts.get(loc)).padStart(2)} / ${set.size}  ${loc}`);
  }

  return { own: own.length, violations, familyRatio };
}

let failed = false;
const verdicts: string[] = [];
for (const seed of seeds) {
  const t0 = Date.now();
  const r = runSeed(seed);
  const v = report(r);
  console.log(`(${Date.now() - t0} ms)`);
  if (v.violations.length === 0) {
    verdicts.push(`PASS seed ${seed}: no story told more than ${PAUSED_STORY_MAX_TELLINGS}× outside a relaxed window`);
  } else {
    failed = true;
    verdicts.push(`FAIL seed ${seed}: tellings cap breached — ${v.violations.join('; ')}`);
  }
  const base = BASELINE_OWN_DRAW_STORY[seed];
  if (base === undefined || ticks !== 600 || map !== 'medium') {
    verdicts.push(`n/a  seed ${seed}: no baseline for this seed/ticks/map (own-draw story chapters: ${v.own})`);
  } else if (v.own >= base - BASELINE_SLACK) {
    verdicts.push(`PASS seed ${seed}: ${v.own} own-draw story chapters ≥ baseline ${base} − ${BASELINE_SLACK}`);
  } else {
    failed = true;
    verdicts.push(`FAIL seed ${seed}: ${v.own} own-draw story chapters < baseline ${base} − ${BASELINE_SLACK} (kill criterion: lower STORY_DROUGHT_RELAX_TICKS first)`);
  }
  verdicts.push(v.familyRatio > FAMILY_REPEAT_WARN_RATIO
    ? `WARN seed ${seed}: family repeats ${(v.familyRatio * 100).toFixed(1)}% > ${FAMILY_REPEAT_WARN_RATIO * 100}% (revisit D3)`
    : `PASS seed ${seed}: family repeats ${(v.familyRatio * 100).toFixed(1)}% ≤ ${FAMILY_REPEAT_WARN_RATIO * 100}%`);
}
console.log('\n## verdict');
for (const line of verdicts) console.log(line);
process.exit(failed ? 1 : 0);
