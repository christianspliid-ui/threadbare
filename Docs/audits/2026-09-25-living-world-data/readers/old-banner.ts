// Census reader (THR-1658 DW5): what Raise the Old Banner does in an unattended world.
// Read-only; one world per seed, medium map, unattended (no player, no First) — past.ts's pattern.
// Self-contained (no import of the THR-1658 modules), so the same file runs against `main`
// for the before column: there every banner count reads 0 and the t0 digest is the baseline.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/old-banner.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/old-banner.mjs --external:fs --external:path
//   node .cache/old-banner.mjs [seeds=42,99,7] [ticks=300]
//
// t0: deciders, the past's own mints (THR-1657), and a digest of every (actor, template)
// pursuit — identical before/after means the drive changed nothing at world start.
// Run: heirs (deciders with descent at t0); heirs with a free slot at a re-evaluation tick;
// drives taken up (and by whom — never a non-heir); milestones met; completed; abandoned;
// where each holder's post-assignment holding landed (old land or not); heirs who stood on
// an ancestral-ruin hex at any tick (the kill criterion's "between checks" read); ms/tick.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { resolveRegionId } from '../../../../src/engine/graphConditions';
import { getAmbitionTemplateId } from '../../../../src/engine/ambitionShape';
import { MAX_ACTIVE_AMBITIONS } from '../../../../src/engine/ambitionAssignment';
import { PAST_REVENGE_TEMPLATE_ID, PAST_WONDER_TEMPLATE_ID } from '../../../../src/engine/worldPastAmbitions';
import { hexDistance } from '../../../../src/lib/hexMath';
import { AMBITION_TEMPLATES } from '../../../../src/data/ambition-templates';
import { passesEligibility, scoreDesirability } from '../../../../src/engine/ambitionSelection';
import { buildAmbitionAgentSnapshot } from '../../../../src/engine/ambitionTick';
import { mulberry32 } from '../../../../src/lib/prng';
import type { GameState } from '../../../../src/types/gameState';
import type { WorldGraph } from '../../../../src/engine/graph';
import type { GraphNode } from '../../../../src/types/graph';

const seeds = (process.argv[2] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 300);
const T = 'ambition_raise_the_old_banner';
const REEVAL = 25;
type P = Record<string, unknown>;

const descentOf = (n: GraphNode | undefined): string[] =>
  Array.isArray(n?.properties.backstoryStrata)
    ? [...new Set((n!.properties.backstoryStrata as P[]).filter(s => s?.relation === 'descent').map(s => s.cultureId as string))].sort()
    : [];
const empireOfRegion = (g: WorldGraph, regionId: string | undefined): string | undefined =>
  regionId ? g.getOutgoingEdges(regionId, 'belongs_to').filter(e => (e.properties as P)?.cultureLayer === 'historical').map(e => e.target).sort()[0] : undefined;
const hexOfLoc = (g: WorldGraph, id: string | undefined): { col: number; row: number } | undefined => {
  for (let d = 0, cur = id; d < 4 && cur; d++) {
    const n = g.getNode(cur); if (!n) return undefined;
    if (typeof n.properties.hexCol === 'number' && typeof n.properties.hexRow === 'number') return { col: n.properties.hexCol, row: n.properties.hexRow };
    cur = n.properties.parentLocationId as string | undefined;
  }
  return undefined;
};
const active = (g: WorldGraph, id: string) => g.getOutgoingEdges(id, 'pursues').filter(e => e.properties.status === 'active');
const individuals = (g: WorldGraph) => g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true);
function digest(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

const out: Record<string, unknown> = {};
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const rt = createSimulationRuntime();
  const pr = MAP_SIZE_PRESETS.medium;
  let state: GameState = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows).state;
  const g0 = state.graph;
  const deciders = individuals(g0).filter(isAutonomousDecisionActor);
  const heirs = deciders.filter(n => descentOf(n).length > 0);
  const pursuits = individuals(g0).flatMap(n => g0.getOutgoingEdges(n.id, 'pursues').map(e => `${n.id}:${getAmbitionTemplateId(g0.getNode(e.target))}:${e.properties.status}`)).sort();
  const t0 = {
    deciders: deciders.length,
    heirs: heirs.length,
    pastMints: pursuits.filter(p => p.includes(PAST_REVENGE_TEMPLATE_ID) || p.includes(PAST_WONDER_TEMPLATE_ID)).length,
    pursuits: pursuits.length,
    pursuitDigest: digest(pursuits.join('|')),
    bannerHolders: pursuits.filter(p => p.includes(T)).length,
  };

  const ruinHexes = new Map<string, { col: number; row: number }[]>();
  for (const n of g0.getNodesByType('location')) {
    if (n.properties.locationSubtype !== 'elder_ruin' || typeof n.properties.originCultureId !== 'string') continue;
    const h = hexOfLoc(g0, n.id); if (!h) continue;
    const l = ruinHexes.get(n.properties.originCultureId) ?? []; l.push(h); ruinHexes.set(n.properties.originCultureId, l);
  }
  const heirIds = new Set(heirs.map(h => h.id));
  const freeAtReeval = new Set<string>();
  const atRuinEver = new Set<string>();
  // Why a freed heir did not take it: per heir still holding a free slot just after a
  // re-evaluation tick, the gate verdict and where the banner ranked among eligible templates.
  const notTaken: { tick: number; heir: string; eligible: boolean | 'absent'; rank?: number; poolLeft?: number }[] = [];
  const takers = new Map<string, { actorId: string; tick: number; label?: string; heir: boolean; decider: boolean }>();
  const start = performance.now();
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], rt);
    const g = state.graph;
    for (const h of heirs) {
      const node = g.getNode(h.id); if (!node || node.properties.deceased === true) continue;
      if (state.tick % REEVAL === 0 && active(g, h.id).length < MAX_ACTIVE_AMBITIONS) {
        freeAtReeval.add(h.id);
        const banner = AMBITION_TEMPLATES.find(t => t.id === T);
        if (!banner) { notTaken.push({ tick: state.tick, heir: h.id, eligible: 'absent' }); }
        else if (!g.getOutgoingEdges(h.id, 'pursues').some(e => getAmbitionTemplateId(g.getNode(e.target)) === T)) {
          const snap = buildAmbitionAgentSnapshot(g, h.id);
          const pursued = new Set(g.getOutgoingEdges(h.id, 'pursues').map(e => getAmbitionTemplateId(g.getNode(e.target))));
          const pool = AMBITION_TEMPLATES.filter(t => !pursued.has(t.id) && passesEligibility(t, snap));
          const mine = scoreDesirability(banner, snap, mulberry32(seed));
          notTaken.push({ tick: state.tick, heir: h.id, eligible: passesEligibility(banner, snap), rank: pool.filter(t => scoreDesirability(t, snap, mulberry32(seed)) > mine).length + 1, poolLeft: pool.length });
        }
      }
      const here = hexOfLoc(g, g.getOutgoingEdges(h.id, 'located_at')[0]?.target);
      if (here && descentOf(node).some(c => (ruinHexes.get(c) ?? []).some(r => hexDistance(here, r) === 0))) atRuinEver.add(h.id);
    }
    if (state.tick % REEVAL === 0) {
      for (const n of individuals(g)) for (const e of g.getOutgoingEdges(n.id, 'pursues')) {
        if (takers.has(e.id) || getAmbitionTemplateId(g.getNode(e.target)) !== T) continue;
        takers.set(e.id, { actorId: n.id, tick: e.properties.assignedTick as number, label: e.properties.mintedByLabel as string | undefined, heir: heirIds.has(n.id), decider: isAutonomousDecisionActor(n) });
      }
    }
  }
  const msPerTick = +((performance.now() - start) / TICKS).toFixed(1);
  const g = state.graph;
  const status: Record<string, number> = {}; const milestones: Record<string, number> = {};
  const claims = { oldLand: 0, elsewhere: 0 };
  for (const [edgeId, t] of takers) {
    const e = g.getEdge?.(edgeId) ?? g.getOutgoingEdges(t.actorId, 'pursues').find(x => x.id === edgeId);
    if (!e) continue;
    const st = String(e.properties.status); status[st] = (status[st] ?? 0) + 1;
    for (const m of (e.properties.completedMilestones as string[] | undefined) ?? []) milestones[m] = (milestones[m] ?? 0) + 1;
    const blood = descentOf(g.getNode(t.actorId));
    for (const own of g.getOutgoingEdges(t.actorId, 'owns')) {
      if (typeof own.properties.acquiredTick !== 'number' || (own.properties.acquiredTick as number) < t.tick) continue;
      const emp = empireOfRegion(g, resolveRegionId(g, own.target));
      if (emp && blood.includes(emp)) claims.oldLand++; else claims.elsewhere++;
    }
  }
  out[seed] = {
    t0,
    run: {
      ticks: TICKS, msPerTick,
      heirsWithFreeSlotAtReeval: freeAtReeval.size,
      heirsOnAncestralRuinHexEver: atRuinEver.size,
      takenUp: takers.size,
      takenUpByNonHeir: [...takers.values()].filter(t => !t.heir).length,
      takenUpByNonDecider: [...takers.values()].filter(t => !t.decider).length,
      status, milestones, claimsSinceAssigned: claims,
      sample: [...takers.values()].slice(0, 4),
      notTaken: notTaken.slice(0, 8),
    },
  };
}
console.log(JSON.stringify(out, null, 2));
