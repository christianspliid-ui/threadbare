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
 *     FAMILY_REPEAT_WARN_RATIO of consecutive pairs (D3's tripwire);
 *   - PASS when every drought window (her drought anchor unchanged) holding
 *     RESTLESS_ROAD_COOLDOWN_TICKS ticks on which she was due and free (no
 *     appointment, journey, action or encounter in hand) holds at least one
 *     `agent.restless_road` check (THR-1959 S2). The engine skips the check by
 *     design while she is not free, so only free, due ticks count toward a miss. Each window's outcomes and the first check's delay are listed;
 *     `no_destination` is listed, not failed (the relax window covers it).
 *
 * Time: ~6–9 min per seed at 600 ticks on medium (≈0.8 s per tick, more as the world
 *       grows); one seed per command keeps a call under the 600 s command cap. The
 *       baseline's three seeds (42,7,1234) are three commands.
 * Usage:
 *   npm run census:rhythm                                        # seed 42 × 600 ticks, medium
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
import { PAUSED_STORY_MAX_TELLINGS, STORY_DROUGHT_RELAX_TICKS, STORY_DROUGHT_TICKS, RESTLESS_ROAD_COOLDOWN_TICKS } from '../src/data/agent-behavior-constants';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import type { RestlessRoadTrace } from '../src/types/trace';
import { restlessRoadDue } from '../src/engine/restlessRoad';
import { agentAppointmentSeeds } from '../src/engine/appointments';

/**
 * Own-draw story chapters of The First per seed, 600 ticks, medium, on main
 * `cf6fb7de` *without* the THR-1218 S1 rules (this script run on that tree).
 * Re-anchored from the design-time baseline at `617802fb` (18 / 10 / 13, audit § 3):
 * main moved between the two, and seed 42 fell to 6 with no S1 code present, so
 * the old numbers no longer measured what the cap costs. Re-anchor again when a
 * content or decision change moves these without touching the cap.
 */
const BASELINE_OWN_DRAW_STORY: Record<number, number> = { 42: 6, 7: 19, 1234: 12 };
/** Slack on the baseline predicate: "not fewer than the baseline minus one". */
const BASELINE_SLACK = 1;
/** D3's tripwire: a story chapter following its own family in more than this share of pairs. */
const FAMILY_REPEAT_WARN_RATIO = 0.2;
/** Width of one reporting window. */
const QUARTER_TICKS = 150;

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
console.error('[THR-2041] ~6–9 min per seed at 600 ticks on medium; run one seed per command (600 s command cap).');

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
  /** A compulsion was pending for her on some tick the chapter was live (the visibility phase skips her then). */
  compulsionPending: boolean;
  /** Another of her chapters held an unanswered pause notification while this one was live. */
  otherVeilOpen: boolean;
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
  enableTracing();
  clearTraces();
  /** THR-1959 — drought windows: one per drought anchor, with the restless-road checks inside it. */
  const windows: Array<{ anchor: number; endTick: number; roads: RestlessRoadTrace[]; openedBy: string; freeDueTicks: number }> = [];
  const anchorNow = () => {
    const a = getThreadTo(state.graph, firstId)?.properties?.lastStoryChapterStartTick;
    return typeof a === 'number' ? a : established;
  };

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
        compulsionPending: false,
        otherVeilOpen: false,
      };
      chapters.push(ch);
      byAction.set(a.actionId, ch);
    }
    const anchor = anchorNow();
    const cur = windows[windows.length - 1];
    if (!cur || cur.anchor !== anchor) {
      // What started the story that moved her anchor — any non-routine template counts.
      const opener = (state.unifiedActions ?? []).find(a => a.actorId === firstId && a.startTick === anchor);
      windows.push({ anchor, endTick: state.tick, roads: [], openedBy: opener?.templateId ?? '(start)', freeDueTicks: 0 });
    } else cur.endTick = state.tick;
    // A tick she ended still due (the check did not run) while free to decide: no
    // appointment, no journey, no action or encounter in hand. Only these count
    // toward a miss — the engine skips the check by design in every other state.
    const node = state.graph.getNode(firstId);
    const queue = (node?.properties?.movementState as { movementQueue?: unknown[] } | undefined)?.movementQueue;
    const free = agentAppointmentSeeds(state, firstId).length === 0
      && !(queue && queue.length > 0)
      && !(state.unifiedActions ?? []).some(a => a.actorId === firstId && !a.resolved)
      && !(state.encounterProgress ?? []).some(ep => ep.actorId === firstId && ep.status === 'active');
    if (free && restlessRoadDue(state.graph, firstId, state.tick) !== null) windows[windows.length - 1].freeDueTicks++;
    for (const t of getTraces()) {
      if (t.category !== 'agent.restless_road' || t.agentId !== firstId) continue;
      const road = t as unknown as RestlessRoadTrace;
      const w = windows.find(x => x.anchor === road.tick - road.droughtTicks) ?? windows[windows.length - 1];
      w.roads.push(road);
    }
    clearTraces();
    for (const n of state.encounterNotifications ?? []) {
      if (seenNotif.has(n.id)) continue;
      seenNotif.add(n.id);
      const key = n.actionId ?? n.encounterId;
      const r = notif.get(key) ?? { halted: false, aftermath: false };
      if (n.kind === 'aftermath') r.aftermath = true;
      else if (n.autoResolveTick === null) r.halted = true;
      notif.set(key, r);
    }
    // Why a chapter never halts headless: flag what was in the way while it was live.
    const compulsion = (state.premonitionQueue ?? []).some(
      p => p.type === 'compulsion' && p.agentId === firstId && p.eligibleUntilTick > state.tick,
    );
    const openVeils = new Set(
      (state.encounterNotifications ?? [])
        .filter(n => !n.resolved && n.kind !== 'aftermath' && n.autoResolveTick === null && n.actionId)
        .map(n => n.actionId as string),
    );
    for (const ch of chapters) {
      if (ch.resolvedTick !== null) continue;
      if (compulsion) ch.compulsionPending = true;
      for (const id of openVeils) if (id !== ch.actionId) ch.otherVeilOpen = true;
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
  return { seed, firstId, established, chapters, endTick: state.tick, windows };
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
  const blockers = (c: Chapter) => [c.compulsionPending ? 'compulsion' : '', c.otherVeilOpen ? 'other-veil-open' : ''].filter(Boolean).join('+') || 'none';
  console.log(`  blockers while live — halted: ${tally(halted, blockers)}; aftermath-only: ${tally(aftermathOnly, blockers)}`);

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

  // THR-1959 — the restless road: every drought window that reached the threshold.
  const roadMisses: string[] = [];
  let setOuts = 0;
  console.log(`restless road (drought windows reaching ${STORY_DROUGHT_TICKS} ticks):`);
  for (const w of r.windows) {
    const threshold = w.anchor + STORY_DROUGHT_TICKS;
    if (w.endTick < threshold) continue;
    setOuts += w.roads.filter(x => x.outcome === 'set_out').length;
    const first = w.roads[0];
    const outcomes = w.roads.map(x => `t${x.tick} ${x.outcome}${x.toLocationId ? ` → ${x.toLocationId} (${x.hexDistance} hex)` : ''}`).join('; ') || 'none';
    console.log(`  anchor t${w.anchor}, threshold t${threshold}, window ends t${w.endTick}: first check ${first ? `+${first.tick - threshold}t` : '-'} — ${outcomes}`);
    if (!first && w.freeDueTicks >= RESTLESS_ROAD_COOLDOWN_TICKS) {
      roadMisses.push(`anchor t${w.anchor}: no restless-road check in ${w.freeDueTicks} free, due ticks past the threshold`);
    }
  }
  if (!r.windows.some(w => w.endTick >= w.anchor + STORY_DROUGHT_TICKS)) console.log('  (no drought reached the threshold)');
  const longest = r.windows.reduce((m, w) => Math.max(m, w.endTick - w.anchor), 0);
  const openers = new Map<string, number>();
  for (const w of r.windows) {
    const key = w.openedBy.split('.').slice(0, 2).join('.');
    openers.set(key, (openers.get(key) ?? 0) + 1);
  }
  console.log(`  longest drought window: ${longest} ticks; drought anchors set by (template prefix): ${[...openers.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join(', ')}`);

  return { own: own.length, violations, familyRatio, roadMisses, setOuts };
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
  verdicts.push(v.roadMisses.length === 0
    ? `PASS seed ${seed}: every drought past the threshold was checked by the restless road (${v.setOuts} set out)`
    : `FAIL seed ${seed}: restless road never fired — ${v.roadMisses.join('; ')}`);
  if (v.roadMisses.length > 0) failed = true;
}
console.log('\n## verdict');
for (const line of verdicts) console.log(line);
process.exit(failed ? 1 : 0);
