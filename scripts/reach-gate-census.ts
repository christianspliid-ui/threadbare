/**
 * Reach-gate census — THR-1562 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Measures what the capability requirements *gate* once every one of them reads the
 * reach share (`computeRawScore ÷ SHARE_FULL_RAW`, capped at 1): ambition floors,
 * milestones, abandonment, the ambition pick, guild joins and spell requirements.
 *
 * **Self-contained on purpose.** The share is computed here from `computeRawScore`
 * (which predates THR-1562), and the live counts read only the graph, so the *same
 * file* runs against a pre-THR-1562 tree for the before arm: copy it into a worktree of
 * the older commit and run it there. The static rows (floor pass rates, milestones met
 * on first check) describe the share semantics on either tree; the **live rows**
 * (ambitions held, completed, abandoned, milestones completed by tick N, the reach
 * term's share of the winning score) are what differ between the arms.
 *
 * Kill criteria read (plan § Kill criteria):
 *   - mortals with capabilities holding ≥ 1 eligible ambition (any pool) ≥ 95%
 *   - protagonist milestones met on first check at tick 0 ≤ 60%
 *
 * Usage:
 *   npm run census:reach-gates                              # seeds 42,99; ticks 0,150; medium
 *   npm run census:reach-gates -- --seeds 42 --ticks 0,60
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { computeRawScore } from '../src/engine/domainCapability';
import { buildAmbitionAgentSnapshot } from '../src/engine/ambitionTick';
import { scoreDesirability, selectAmbitions } from '../src/engine/ambitionSelection';
import { getAmbitionTemplateId } from '../src/engine/ambitionShape';
import {
  AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
} from '../src/data/ambition-templates';
import { SPELL_TEMPLATES } from '../src/data/spell-templates';
import { ARCANE_CIRCLE_DEFINITION } from '../src/data/arcane-circle-definition';
import { HOLY_ORDER_DAWN_DEFINITION } from '../src/data/holy-order-dawn-definition';
import { TEMPLE_OF_SPHERES_DEFINITION } from '../src/data/temple-of-spheres-definition';
import { THIEVES_GUILD_DEFINITION } from '../src/data/thieves-guild-definition';
import { UNDERKING_COURT_DEFINITION } from '../src/data/underking-court-definition';
import { REACH_DOMAINS, type ReachDomain } from '../src/types/traits';
import type { AmbitionTemplate } from '../src/types/ambition';
import type { WorldGraph } from '../src/engine/graph';

// ─── Constants ────────────────────────────────────────────────────

/** Mirrors `REACH_SHARE_FULL_RAW` (40). Duplicated so this file runs on an older tree. */
const SHARE_FULL_RAW = 40;
const DEFAULT_SEEDS: readonly number[] = [42, 99];
const DEFAULT_TICKS: readonly number[] = [0, 150];
/** Kill criterion: share of mortals-with-capabilities holding ≥ 1 eligible ambition. */
const KILL_MIN_ELIGIBLE = 0.95;
/** Kill criterion: protagonist milestones met on first check at tick 0. */
const KILL_MAX_FIRST_CHECK = 0.6;
/** Fixed selection stream for the pick-spread line. */
const PICK_SEED = 7;

// ─── Args ─────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? DEFAULT_SEEDS.join(',')).split(',').map(Number);
const tickMarks = (arg('--ticks') ?? DEFAULT_TICKS.join(',')).split(',').map(Number).sort((a, b) => a - b);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

// ─── Helpers ──────────────────────────────────────────────────────

const ALL_AMBITIONS: readonly AmbitionTemplate[] = [
  ...AMBITION_TEMPLATES,
  ...GRIEVANCE_AMBITION_TEMPLATES,
  ...EVENT_MINTED_AMBITION_TEMPLATES,
];
const JOIN_DEFS = [
  ARCANE_CIRCLE_DEFINITION, HOLY_ORDER_DAWN_DEFINITION, TEMPLE_OF_SPHERES_DEFINITION,
  THIEVES_GUILD_DEFINITION, UNDERKING_COURT_DEFINITION,
];

const pct = (k: number, n: number): string => (n ? `${Math.round((100 * k) / n)}%` : 'n/a');

interface Row { id: string; tier: string; share: Record<ReachDomain, number> }

function shareOf(graph: WorldGraph, id: string, reach: ReachDomain): number {
  const raw = computeRawScore(graph, id, reach);
  return Number.isFinite(raw) && raw > 0 ? Math.min(1, raw / SHARE_FULL_RAW) : 0;
}

function meets(row: Row, req: Partial<Record<ReachDomain, number>>): boolean {
  return Object.entries(req).every(([r, v]) => row.share[r as ReachDomain] >= (v as number));
}

/** A requirement authored on the share must be ≤ 1; a raw-scale number (pre-THR-1562 joins) is converted. */
function asShare(req: Partial<Record<ReachDomain, number>>): Partial<Record<ReachDomain, number>> {
  return Object.fromEntries(Object.entries(req).map(([r, v]) => [r, (v as number) > 1 ? (v as number) / SHARE_FULL_RAW : v]));
}

// ─── Report ───────────────────────────────────────────────────────

function report(graph: WorldGraph, seed: number, tick: number): { eligibleShare: number; firstCheck: number } {
  const mortals = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' && !n.properties.deceased);
  const rows: Row[] = mortals
    .filter(n => n.properties.domainCapabilities)
    .map(n => {
      const share = {} as Record<ReachDomain, number>;
      for (const r of REACH_DOMAINS) share[r] = shareOf(graph, n.id, r);
      return { id: n.id, tier: String(n.properties.spotlightTier ?? 'unset'), share };
    });
  const pops: Record<string, Row[]> = { spotlight: [], notable: [], ambient: [] };
  for (const r of rows) (pops[r.tier] ??= []).push(r);
  pops.all = rows;

  console.log(`\n## seed ${seed} · tick ${tick} · mortals ${mortals.length}, with capabilities ${rows.length} (spotlight ${pops.spotlight.length}, notable ${pops.notable.length}, ambient ${pops.ambient.length})`);

  // 1. Floors by population
  console.log('  floors — standard-pool pass rate (min–max, mean) · ≥1 eligible standard · ≥1 eligible any pool');
  let eligibleShare = 1;
  for (const [pn, rs] of Object.entries(pops)) {
    if (!rs.length) continue;
    const p = AMBITION_TEMPLATES.map(t => rs.filter(r => meets(r, t.reachFloors)).length);
    const anyStd = rs.filter(r => AMBITION_TEMPLATES.some(t => meets(r, t.reachFloors))).length;
    const anyPool = rs.filter(r => ALL_AMBITIONS.some(t => meets(r, t.reachFloors))).length;
    if (pn === 'all') eligibleShare = anyPool / rs.length;
    console.log(`    ${pn.padEnd(9)} n=${String(rs.length).padEnd(4)} ${pct(Math.min(...p), rs.length)}–${pct(Math.max(...p), rs.length)} (mean ${pct(p.reduce((a, b) => a + b, 0) / p.length, rs.length)}) · ${pct(anyStd, rs.length)} · ${pct(anyPool, rs.length)}`);
  }

  // 2. Milestones met on first check, among floor-eligible protagonists
  let pairs = 0, met = 0;
  for (const t of ALL_AMBITIONS) {
    const elig = pops.spotlight.filter(r => meets(r, t.reachFloors));
    for (const m of t.milestones) {
      const c = m.condition;
      if (c.type !== 'agent_reach_above') continue;
      pairs += elig.length;
      met += elig.filter(r => r.share[c.reach] >= c.threshold).length;
    }
  }
  const firstCheck = pairs ? met / pairs : 0;
  console.log(`  milestones met on first check (floor-eligible protagonists): ${pct(met, pairs)} of ${pairs} pairs`);

  // 3. Live ambition state
  const status: Record<string, number> = {};
  let milestonesDone = 0;
  const held: Record<string, number> = {};
  for (const n of mortals) {
    for (const e of graph.getOutgoingEdges(n.id, 'pursues')) {
      const s = String(e.properties.status ?? 'unknown');
      status[s] = (status[s] ?? 0) + 1;
      milestonesDone += ((e.properties.completedMilestones as string[] | undefined) ?? []).length;
      if (s === 'active') {
        const tid = getAmbitionTemplateId(graph.getNode(e.target)) ?? '?';
        held[tid] = (held[tid] ?? 0) + 1;
      }
    }
  }
  console.log(`  live pursues edges: ${JSON.stringify(status)} · milestones completed (all edges): ${milestonesDone}`);
  const top = Object.entries(held).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k.replace('ambition_', '')} ${v}`);
  console.log(`  active ambitions: ${Object.keys(held).length} distinct templates · top ${top.join(', ')}`);

  // 4. The pick, as the live snapshot reads it — reach term's share of the winning score
  let termSum = 0, termN = 0, noneN = 0;
  const picks: Record<string, number> = {};
  for (const r of pops.spotlight) {
    const snap = buildAmbitionAgentSnapshot(graph, r.id);
    const sel = selectAmbitions(AMBITION_TEMPLATES, snap, { maxAmbitions: 2, threshold: 0, seed: PICK_SEED });
    const win = AMBITION_TEMPLATES.find(t => t.id === sel[0]?.templateId);
    if (!win) { noneN++; continue; }
    picks[win.id] = (picks[win.id] ?? 0) + 1;
    const ent = Object.entries(win.reachAffinity);
    const reachTerm = ent.length
      ? ent.reduce((a, [re, w]) => a + (snap.domainCapabilities[re as ReachDomain] ?? 0) * (w as number), 0) / ent.length
      : 0;
    const total = scoreDesirability(win, snap, () => 0);
    if (total > 0) { termSum += reachTerm / total; termN++; }
  }
  console.log(`  protagonist top pick: ${Object.keys(picks).length} distinct templates; none eligible ${noneN}/${pops.spotlight.length}; reach term share of winning score ${pct(termSum, termN)}`);

  // 5. Guild joins and spells
  const joins = JOIN_DEFS.map(d => {
    const req = asShare(d.joinPrerequisites ?? {});
    return `${d.id} ${pct(rows.filter(r => meets(r, req)).length, rows.length)}/${pct(pops.spotlight.filter(r => meets(r, req)).length, pops.spotlight.length)}`;
  });
  console.log(`  guild joins (all/spotlight): ${joins.join(', ')}`);
  const spells = SPELL_TEMPLATES.map(s => {
    const req = (s.prerequisites.minReach ?? {}) as Partial<Record<ReachDomain, number>>;
    return `${s.id.replace('spell_', '')} ${pct(rows.filter(r => meets(r, req)).length, rows.length)}/${pct(pops.spotlight.filter(r => meets(r, req)).length, pops.spotlight.length)}`;
  });
  console.log(`  spell minReach (all/spotlight): ${spells.join(', ')}`);

  return { eligibleShare, firstCheck };
}

// ─── Run ──────────────────────────────────────────────────────────

const preset = MAP_SIZE_PRESETS[map];
let failed = false;
console.log(`# Reach-gate census — share = raw ÷ ${SHARE_FULL_RAW} · map ${map} · seeds ${seeds.join(',')} · ticks ${tickMarks.join(',')}`);
for (const seed of seeds) {
  resetEventCounter();
  resetReputationTraitInit();
  let { state } = initializeGameState(
    generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows,
  );
  const runtime = createSimulationRuntime();
  for (const mark of tickMarks) {
    while (state.tick < mark) state = runTick(state, [], runtime);
    const { eligibleShare, firstCheck } = report(state.graph, seed, state.tick);
    if (eligibleShare < KILL_MIN_ELIGIBLE) {
      failed = true;
      console.log(`  KILL: ≥1-eligible ${pct(eligibleShare, 1)} < ${pct(KILL_MIN_ELIGIBLE, 1)} — lower REACH_SHARE_FULL_RAW toward 30 and re-measure`);
    }
    if (mark === 0 && firstCheck > KILL_MAX_FIRST_CHECK) {
      failed = true;
      console.log(`  KILL: milestones met on first check ${pct(firstCheck, 1)} > ${pct(KILL_MAX_FIRST_CHECK, 1)} — revisit AMBITION_MILESTONE_RESCALE`);
    }
  }
}
console.log(failed ? '\nVERDICT: FAIL (a kill criterion fired)' : '\nVERDICT: PASS (no kill criterion fired)');
process.exitCode = failed ? 1 : 0;
