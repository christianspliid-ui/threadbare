// Census reader (THR-1658): what a `reclaim_homeland` rule reading descent would find.
// Read-only; one world per seed, medium map, unattended (no player, no First) — past.ts's pattern.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/descent-homeland.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/descent-homeland.mjs --external:fs --external:path
//   node .cache/descent-homeland.mjs [seeds=42,99,7] [ticks=150]
//
// At t0, for every living decider with a descent stratum (the holders `mintPastAmbitions`
// would consider): whether `ambition_reclaim_homeland` has a free slot, which of its three
// milestones are ALREADY true (followers / strength / return — the template is 2-of-3),
// who holds their home settlement, and how far the nearest elder ruin of their ancestors'
// empire lies. Across the run: every `reclaim_homeland` minted by any route, and how many
// descendant deciders end the run off their ancestral land.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { evaluateGraphCondition } from '../../../../src/engine/graphConditions';
import { getAmbitionTemplateId } from '../../../../src/engine/ambitionShape';
import { getLocationHolder } from '../../../../src/engine/realmHolder';
import { homeHex, hexOf } from '../../../../src/engine/worldPast';
import { resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { hexDistance } from '../../../../src/lib/hexMath';
import { MAX_ACTIVE_AMBITIONS } from '../../../../src/engine/ambitionAssignment';
import { GRIEVANCE_AMBITION_TEMPLATES } from '../../../../src/data/ambition-templates';
import { locationClassOf } from '../../../../src/data/world-objects';
import { buildAmbitionAgentSnapshot } from '../../../../src/engine/ambitionTick';
import { passesEligibility, scoreDesirability } from '../../../../src/engine/ambitionSelection';
import { AMBITION_TEMPLATES } from '../../../../src/data/ambition-templates';
import { mulberry32 } from '../../../../src/lib/prng';
import type { HexTile } from '../../../../src/types';
import { enableTracing, clearTraces, getTraces } from '../../../../src/engine/traceBuffer';
import type { GameState } from '../../../../src/types/gameState';
import type { WorldGraph } from '../../../../src/engine/graph';
import type { GraphNode } from '../../../../src/types/graph';

const seeds = (process.argv[2] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 150);
const T = 'ambition_reclaim_homeland';
type P = Record<string, unknown>;

const template = GRIEVANCE_AMBITION_TEMPLATES.find(t => t.id === T)!;
const descentOf = (n: GraphNode): string | undefined =>
  Array.isArray(n.properties.backstoryStrata)
    ? ((n.properties.backstoryStrata as P[]).find(s => s.relation === 'descent')?.cultureId as string | undefined)
    : undefined;
const empireOfRegion = (g: WorldGraph, regionId: string | undefined): string | undefined =>
  regionId ? g.getOutgoingEdges(regionId, 'belongs_to').filter(e => (e.properties as P)?.cultureLayer === 'historical').map(e => e.target).sort()[0] : undefined;
let regionAt = new Map<string, string>();
const regionOfActor = (g: WorldGraph, id: string): string | undefined => {
  const n = g.getNode(id); const h = n ? homeHex(g, n) : undefined;
  return h ? regionAt.get(`${h.col},${h.row}`) : undefined;
};
const activePursuits = (g: WorldGraph, id: string) => g.getOutgoingEdges(id, 'pursues').filter(e => e.properties.status === 'active');
// A mortal's holdings: `owns`, or `controls` that is not the strategic stance (realmHolder.ts's filter).
const holdings = (g: WorldGraph, id: string): GraphNode[] => [
  ...g.getOutgoingEdges(id, 'owns'),
  ...g.getOutgoingEdges(id, 'controls').filter(e => e.properties?.controlType !== 'strategic'),
].map(e => g.getNode(e.target)).filter((n): n is GraphNode => !!n && n.type === 'location');
const landEmpireOf = (g: WorldGraph, loc: GraphNode): string | undefined => {
  const parent = resolveToParentLocation(g, loc) ?? loc; const h = hexOf(parent);
  return h ? empireOfRegion(g, regionAt.get(`${h.col},${h.row}`)) : undefined;
};
const loyaltyBonds = (g: WorldGraph, id: string) => g.getOutgoingEdges(id, 'relates_to').filter(e => e.properties.basis === 'loyalty').length;
const inc = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };

const out: Record<string, unknown> = {};
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const rt = createSimulationRuntime();
  const pr = MAP_SIZE_PRESETS.medium;
  const init = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState; tiles: HexTile[] };
  let state = init.state;
  regionAt = new Map(init.tiles.filter(t => t.regionId).map(t => [`${t.coord.col},${t.coord.row}`, t.regionId as string]));
  const g = state.graph;
  const deciders = g.getNodesByType('actor').filter(n => isAutonomousDecisionActor(n) && n.properties.deceased !== true && n.properties.pastOrigin !== 'worldgen');
  const heirs = deciders.filter(n => !!descentOf(n));
  const ruinsByEmpire = new Map<string, GraphNode[]>();
  for (const n of g.getNodesByType('location')) {
    if (n.properties.locationSubtype !== 'elder_ruin' || typeof n.properties.originCultureId !== 'string') continue;
    const l = ruinsByEmpire.get(n.properties.originCultureId) ?? []; l.push(n); ruinsByEmpire.set(n.properties.originCultureId, l);
  }
  const milestonesTrue: Record<string, number> = {};
  const alreadyTwoOfThree: string[] = [];
  const holder: Record<string, number> = {};
  const slots: Record<string, number> = {};
  const ruinDist: number[] = [];
  const byEmpire: Record<string, number> = {};
  for (const h of heirs) {
    const empire = descentOf(h)!;
    inc(byEmpire, empire);
    const free = activePursuits(g, h.id).length < MAX_ACTIVE_AMBITIONS;
    inc(slots, free ? 'free' : 'full');
    let n = 0;
    for (const m of template.milestones) {
      const ok = evaluateGraphCondition(m.condition as never, g as never, h.id, { tick: 0 } as never);
      if (ok) { inc(milestonesTrue, m.id); n++; }
    }
    if (n >= template.completion.requires) alreadyTwoOfThree.push(h.id);
    const locId = g.getOutgoingEdges(h.id, 'located_at')[0]?.target;
    const loc = resolveToParentLocation(g, locId ? g.getNode(locId) : undefined);
    const hold = getLocationHolder(g, loc?.id);
    inc(holder, !hold ? 'none' : hold.isRealm ? 'realm' : 'other_faction');
    const home = homeHex(g, h);
    const ds = (ruinsByEmpire.get(empire) ?? []).map(r => hexOf(r)).filter(Boolean).map(at => hexDistance(home!, at!));
    if (home && ds.length) ruinDist.push(Math.min(...ds));
  }
  ruinDist.sort((a, b) => a - b);
  const t0Holdings = { heirs: heirs.map(h => ({ holdings: holdings(g, h.id).map(l => `${l.properties.locationSubtype ?? l.properties.sublocationTypeId}:${landEmpireOf(g, l) === descentOf(h) ? 'ancestral' : 'other'}`), loyaltyBonds: loyaltyBonds(g, h.id) })) };
  const t0 = {
    t0Holdings,
    deciders: deciders.length,
    descendantDeciders: heirs.length,
    byEmpire,
    slots,
    reclaimMilestonesAlreadyTrue: milestonesTrue,
    wouldCompleteAtOnce: alreadyTwoOfThree.length,
    homeHeldBy: holder,
    nearestAncestralRuinHexes: ruinDist.length ? { min: ruinDist[0], median: ruinDist[Math.floor(ruinDist.length / 2)], max: ruinDist[ruinDist.length - 1] } : null,
    reclaimHoldersAtT0: deciders.filter(n => g.getOutgoingEdges(n.id, 'pursues').some(e => getAmbitionTemplateId(g.getNode(e.target)) === T)).length,
  };

  const mintedRuns: { tick: number; actorId: string; grievance: boolean; descendant: boolean }[] = [];
  const seen = new Set<string>();
  enableTracing(); clearTraces();
  const delves: { tick: number; agentId: string; ruinId: string }[] = [];
  let freeSlotHeirTicks = 0; let heirTicks = 0;
  const heirsWithFreeSlotEver = new Set<string>();
  const ruinEvents: { tick: number; heir: string; ruin: string; ancestral: boolean; eventType: string }[] = [];
  const seenEv = new Set<string>(state.graph.getNodesByType('event').map(e => e.id));
  const heirSet = new Set(heirs.map(h => h.id));
  const atRuin = new Set<string>();
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], rt);
    for (const h of heirs) { const here = state.graph.getOutgoingEdges(h.id, 'located_at')[0]?.target; const n = here ? state.graph.getNode(here) : undefined; const p = n ? (resolveToParentLocation(state.graph, n) ?? n) : undefined; if (p?.properties.locationSubtype === 'elder_ruin' && p.properties.originCultureId === descentOf(h)) atRuin.add(h.id); }
    for (const h of heirs) {
      const node = state.graph.getNode(h.id);
      if (!node || node.properties.deceased === true) continue;
      heirTicks++;
      if (activePursuits(state.graph, h.id).length < MAX_ACTIVE_AMBITIONS) { freeSlotHeirTicks++; heirsWithFreeSlotEver.add(h.id); }
    }
    for (const t of getTraces() as unknown as P[]) { if (t.category === 'ruins.delve_admitted') delves.push({ tick: t.tick as number, agentId: t.agentId as string, ruinId: t.ruinId as string }); }
    clearTraces();
    for (const ev of state.graph.getNodesByType('event')) {
      if (seenEv.has(ev.id)) continue;
      seenEv.add(ev.id);
      const at = state.graph.getOutgoingEdges(ev.id, 'occurred_at')[0]?.target;
      const atNode = at ? resolveToParentLocation(state.graph, state.graph.getNode(at)) ?? state.graph.getNode(at) : undefined;
      if (atNode?.properties.locationSubtype !== 'elder_ruin') continue;
      for (const pe of state.graph.getIncomingEdges(ev.id, 'participated_in')) {
        if (!heirSet.has(pe.source)) continue;
        const heir = heirs.find(x => x.id === pe.source)!;
        ruinEvents.push({ tick: state.tick, heir: heir.id, ruin: atNode.id, ancestral: atNode.properties.originCultureId === descentOf(heir), eventType: String(ev.properties.eventType ?? ev.properties.kind ?? '?') });
      }
    }
    for (const n of state.graph.getNodesByType('actor')) {
      for (const e of state.graph.getOutgoingEdges(n.id, 'pursues')) {
        if (getAmbitionTemplateId(state.graph.getNode(e.target)) !== T || seen.has(e.id)) continue;
        seen.add(e.id);
        mintedRuns.push({ tick: state.tick, actorId: n.id, grievance: e.properties.grievance === true, descendant: !!descentOf(n) });
      }
    }
  }
  const gEnd = state.graph;
  const holdingsReport = (g: WorldGraph, who: GraphNode[]) => {
    let holders = 0; let onOwnAncestralLand = 0; let total = 0;
    for (const h of who) { const hs = holdings(g, h.id); total += hs.length; if (hs.length) holders++; if (hs.some(l => landEmpireOf(g, l) === descentOf(h))) onOwnAncestralLand++; }
    return { holders, total, onOwnAncestralLand };
  };
  const endDeciders = gEnd.getNodesByType('actor').filter(n => isAutonomousDecisionActor(n) && n.properties.deceased !== true);
  const holdingsAtEnd = { deciders: holdingsReport(gEnd, endDeciders), heirs: holdingsReport(gEnd, heirs.map(h => gEnd.getNode(h.id)!).filter(Boolean)), heirLoyaltyBonds: heirs.map(h => loyaltyBonds(gEnd, h.id)),
    decidersWith3Loyalty: endDeciders.filter(d => loyaltyBonds(gEnd, d.id) >= 3).length,
    decidersLoyaltyMax: Math.max(0, ...endDeciders.map(d => loyaltyBonds(gEnd, d.id))),
    tieBasesAmongDeciders: endDeciders.flatMap(d => gEnd.getOutgoingEdges(d.id, 'relates_to').map(e => String(e.properties.basis))).reduce<Record<string, number>>((m, b) => { m[b] = (m[b] ?? 0) + 1; return m; }, {}),
    individualsHoldingSettlement: gEnd.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true && holdings(gEnd, n.id).some(l => !l.properties.parentLocationId && locationClassOf(l.properties.locationSubtype as string) === 'settlement')).length,
    individualsHoldingRuin: gEnd.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && holdings(gEnd, n.id).some(l => l.properties.locationSubtype === 'elder_ruin')).length,
    heldSubtypesByIndividuals: gEnd.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true).flatMap(n => holdings(gEnd, n.id)).filter(l => !l.properties.parentLocationId).reduce<Record<string, number>>((m, l) => { const k = String(l.properties.locationSubtype); m[k] = (m[k] ?? 0) + 1; return m; }, {}) };
  const offLand = heirs.filter(h => {
    const node = gEnd.getNode(h.id);
    if (!node || node.properties.deceased === true) return false;
    return empireOfRegion(gEnd, regionOfActor(gEnd, h.id)) !== descentOf(h);
  }).length;
  const deadHeirs = heirs.filter(h => gEnd.getNode(h.id)?.properties.deceased === true).length;
  const acquired = (g: WorldGraph, id: string) => g.getOutgoingEdges(id, 'owns').filter(e => typeof e.properties.acquiredTick === 'number' && (e.properties.acquiredTick as number) > 0).map(e => g.getNode(e.target)).filter((n): n is GraphNode => !!n && n.type === 'location');
  const acquisitions = {
    decidersAcquiring: endDeciders.filter(d => acquired(gEnd, d.id).length > 0).length,
    deciderAcquisitions: endDeciders.reduce((n, d) => n + acquired(gEnd, d.id).length, 0),
    heirsAcquiringOnAncestralLand: heirs.filter(h => acquired(gEnd, h.id).some(l => landEmpireOf(gEnd, l) === descentOf(h))).length,
    heirsAcquiringAnywhere: heirs.filter(h => acquired(gEnd, h.id).length > 0).length,
    heirKin: heirs.map(h => gEnd.getOutgoingEdges(h.id, 'relates_to').filter(e => e.properties.basis === 'kin').length),
  };
  // Would a descent-gated sibling with reclaim's floors and affinities be taken up by the refill funnel?
  // For each living heir: eligible on reclaim's floors? how many refill-pool templates (AMBITION_TEMPLATES,
  // minus the ones already pursued) are still eligible? and where would reclaim's score rank among them?
  const refill = heirs.filter(h => gEnd.getNode(h.id) && gEnd.getNode(h.id)!.properties.deceased !== true).map(h => {
    const snap = buildAmbitionAgentSnapshot(gEnd, h.id);
    const pursued = new Set(gEnd.getOutgoingEdges(h.id, 'pursues').map(e => getAmbitionTemplateId(gEnd.getNode(e.target))).filter(Boolean) as string[]);
    const pool = AMBITION_TEMPLATES.filter(t => !pursued.has(t.id) && passesEligibility(t, snap));
    const rng = mulberry32(seed);
    const mine = scoreDesirability(template, snap, rng);
    const better = pool.filter(t => scoreDesirability(t, snap, mulberry32(seed)) > mine).length;
    return { eligibleOnReclaimFloors: passesEligibility(template, snap), refillPoolLeft: pool.length, reclaimRankInPool: better + 1, freeSlot: activePursuits(gEnd, h.id).length < MAX_ACTIVE_AMBITIONS };
  });
  const reclaimMilestonesTrueAtEnd: Record<string, number> = {}; let wouldCompleteAtEnd = 0;
  for (const h of heirs) { const node = gEnd.getNode(h.id); if (!node || node.properties.deceased === true) continue; let n = 0;
    for (const m of template.milestones) if (evaluateGraphCondition(m.condition as never, gEnd as never, h.id, { tick: state.tick } as never)) { inc(reclaimMilestonesTrueAtEnd, m.id); n++; }
    if (n >= template.completion.requires) wouldCompleteAtEnd++; }
  out[seed] = { t0, refill, holdingsAtEnd, acquisitions, heirsAtAncestralRuinEver: atRuin.size, reclaimMilestonesTrueAtEnd, wouldCompleteAtEnd, run: { ticks: TICKS, reclaimMinted: mintedRuns.length, mints: mintedRuns.slice(0, 10), descendantDecidersOffAncestralLandAtEnd: offLand, descendantDecidersDead: deadHeirs, heirFreeSlotShare: heirTicks ? +(freeSlotHeirTicks / heirTicks).toFixed(3) : null, heirsWithFreeSlotEver: heirsWithFreeSlotEver.size, heirRuinEvents: ruinEvents.length, delvesAll: delves.length, delvesByDeciders: delves.filter(d => isAutonomousDecisionActor(state.graph.getNode(d.agentId)!)).length, delvesByHeirs: delves.filter(d => heirSet.has(d.agentId)).length, delvesByHeirsAncestral: delves.filter(d => heirSet.has(d.agentId) && state.graph.getNode(d.ruinId)?.properties.originCultureId === descentOf(heirs.find(h => h.id === d.agentId)!)).length, delvesByAnyDescendant: delves.filter(d => { const n = state.graph.getNode(d.agentId); return !!n && !!descentOf(n); }).length, delvesByAnyDescendantAncestral: delves.filter(d => { const n = state.graph.getNode(d.agentId); return !!n && !!descentOf(n) && state.graph.getNode(d.ruinId)?.properties.originCultureId === descentOf(n); }).length, heirAncestralRuinEvents: ruinEvents.filter(r => r.ancestral).length, ruinEventSample: ruinEvents.slice(0, 6) } };
}
console.log(JSON.stringify(out, null, 2));
