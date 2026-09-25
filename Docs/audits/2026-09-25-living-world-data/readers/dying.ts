// Throwaway reader (THR-1595): the kinds that are seeded and then die, or are never
// produced. Read-only. One pass per seed, medium map, unattended (no player, no First).
// Usage: node .cache/dying.mjs [seeds=42,99] [ticks=300]
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getLocationNodes } from '../../../../src/engine/sublocationShape';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { computeCapability, computeTier } from '../../../../src/engine/domainCapability';
import { findEligibleApprentices } from '../../../../src/engine/mentorshipUndertaking';
import { REACH_DOMAINS } from '../../../../src/types/traits';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 300);
const SNAP = new Set([0, 1, 20, 36, 37, 38, 40, 60, 100, 150, 200, 250, 300]);
const EDGES = ['trades_with', 'reputation_with', 'accompanies', 'mentors', 'leads', 'will_succeed', 'sacred_route',
  'knows_spell', 'holds_place_of_power', 'constructed_by', 'knows_clue_of', 'owns'] as const;

const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const idShape = (id: string) => id.replace(/[0-9]+/g, '#').slice(0, 60);
const out: Record<string, unknown> = {};

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const rt = createSimulationRuntime(); const pr = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };
  const g = () => state.graph;
  const snaps: Record<number, unknown> = {};
  const traceCounts: Record<string, number> = {};
  const repCauses: Record<string, number> = {};
  const successionOutcomes: Record<string, number> = {};
  const dissolved: Array<{ tick: number; edgeId: string; establishedTick: unknown; totalTicksActive: unknown }> = [];
  const projects = new Map<string, { templateId: string; started: number; status: string; actorId: string }>();
  const wgLanes = g().getEdgesByType('trades_with').map(e => ({ id: e.id, by: e.properties.establishedBy, vol: e.properties.volume, lastTraded: e.properties.lastTraded, establishedTick: e.properties.establishedTick }));
  const laneGoneAt: Record<string, number> = {};
  const unkFirstSeen: Record<string, number> = {};
  const unkSample: Record<string, { keys: string; createdBy: unknown; subtypeProp: unknown; tick: number }> = {};

  const harvest = () => {
    for (const t of getTraces() as ReadonlyArray<Record<string, unknown>>) {
      const c = String(t.category);
      if (/reputation_with|faction_succession|trade_route_dissolved|mentorship|companion|power_learned|ruins\.|clue|delve|undertaking_cell_unreachable/.test(c)) inc(traceCounts, c);
      if (c === 'reputation_with_changed') inc(repCauses, String(t.cause ?? '').split(':')[0]);
      if (c === 'faction_succession') inc(successionOutcomes, String(t.outcome));
      if (c === 'trade_route_dissolved') dissolved.push({ tick: t.tick as number, edgeId: String(t.edgeId), establishedTick: t.establishedTick, totalTicksActive: t.totalTicksActive });
      if (c === 'undertaking_cell_unreachable') inc(traceCounts, `unreachable:${t.templateId ?? ''}:${t.reason ?? ''}`);
    }
    clearTraces();
  };

  const snapshot = (tick: number) => {
    const edges: Record<string, number> = {};
    for (const t of EDGES) edges[t] = g().getEdgesByType(t).length;
    const lanesBy: Record<string, number> = {};
    for (const e of g().getEdgesByType('trades_with')) inc(lanesBy, String(e.properties.establishedBy === 'worldgen' ? 'worldgen' : 'mortal'));
    const routeIds = getLocationNodes(g()).filter(n => n.properties.locationSubtype === 'trade_route');
    const routeOwned = routeIds.filter(n => g().getIncomingEdges(n.id, 'owns').length > 0).length;
    const routeIdLive = routeIds.filter(n => typeof n.properties.routeEdgeId === 'string' && g().getEdge(n.properties.routeEdgeId as string)).length;
    const clues: Record<string, number> = {};
    for (const e of g().getEdgesByType('knows_clue_of')) inc(clues, `${e.properties.precision}${e.properties.consumed ? ':consumed' : ''}`);
    const elder = g().getNodesByType('location').filter(n => n.properties.locationType === 'elder_ruin');
    // Located-clue holders standing on the ruin's hex (the delve admission predicate).
    let locatedOnHex = 0; let locatedHolders = 0;
    for (const e of g().getEdgesByType('knows_clue_of')) {
      if (e.properties.precision !== 'located' || e.properties.consumed) continue;
      locatedHolders++;
      const ruin = g().getNode(e.target);
      const loc = g().getOutgoingEdges(e.source, 'located_at')[0];
      let n = loc ? g().getNode(loc.target) : undefined;
      if (n?.properties.parentLocationId) n = g().getNode(n.properties.parentLocationId as string) ?? n;
      if (ruin && n && n.properties.hexCol === ruin.properties.hexCol && n.properties.hexRow === ruin.properties.hexRow) locatedOnHex++;
    }
    const spellDefs = g().getNodesByType('trait').filter(n => n.properties.subcategory === 'spell').map(n => n.id);
    const spellSet = new Set(spellDefs);
    const wieldedSpells = g().getEdgesByType('has_trait').filter(e => spellSet.has(e.target)).length;
    const companions = g().getNodesByType('companion' as never).length;
    // Mortals and culture: individual actors, alive.
    const mortals = g().getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && !n.properties.isDead && n.properties.status !== 'dead');
    const isCultureNode = (id: string) => { const c = g().getNode(id); return c?.properties.actorType === 'culture' || !!c?.properties.cultureIdentity; };
    const noCultureShapes: Record<string, number> = {};
    let withCulture = 0; let noCultureButHomeCulture = 0;
    for (const m of mortals) {
      const has = g().getOutgoingEdges(m.id, 'belongs_to').some(e => isCultureNode(e.target));
      if (has) { withCulture++; continue; }
      inc(noCultureShapes, `${idShape(m.id)} | role=${m.properties.role ?? m.properties.npcRole ?? '-'} | ${m.properties.source ?? m.properties.origin ?? m.properties.spawnSource ?? '-'}`);
      if (m.properties.cultureId || m.properties.originCultureId) noCultureButHomeCulture++;
    }
    // Mentorship potential among deciders.
    const deciders = mortals.filter(n => isAutonomousDecisionActor(n));
    let mentorCapable = 0; let mentorWithApprentice = 0; const maxTierHist: Record<string, number> = {};
    for (const d of deciders) {
      let best = 0;
      for (const r of REACH_DOMAINS) best = Math.max(best, computeTier(computeCapability(g(), d.id, r)));
      inc(maxTierHist, String(best));
      if (best >= 6) { mentorCapable++; if (findEligibleApprentices(g(), d.id).length > 0) mentorWithApprentice++; }
    }
    const unk = getLocationNodes(g()).filter(n => !n.properties.locationSubtype);
    for (const n of unk) {
      const k = idShape(n.id);
      if (unkFirstSeen[k] === undefined) unkFirstSeen[k] = tick;
      if (!unkSample[k]) unkSample[k] = { keys: Object.keys(n.properties).sort().join(','), createdBy: n.properties.createdBy, subtypeProp: n.properties.locationType, tick };
    }
    const constructedBySrc: Record<string, number> = {};
    for (const e of g().getEdgesByType('constructed_by')) inc(constructedBySrc, e.id.startsWith('edge_built_') ? 'worldSeed' : 'mint');
    snaps[tick] = {
      edges, lanesBy, routeIdentities: routeIds.length, routeOwned, routeIdLive, clues, elderRuins: elder.length,
      locatedHolders, locatedOnHex, spellDefs: spellDefs.length, wieldedSpells, companions,
      activeDelves: (state.activeDelves ?? []).length, delveQueue: (state.delveAdmissionQueue ?? []).length,
      echoStates: (state.echoStates ?? []).length, mortals: mortals.length, withCulture, noCultureButHomeCulture,
      noCultureShapes: Object.fromEntries(Object.entries(noCultureShapes).sort((a, b) => b[1] - a[1]).slice(0, 12)),
      deciders: deciders.length, mentorCapable, mentorWithApprentice, maxTierHist,
      subtypelessLocations: unk.length, constructedBySrc,
    };
  };

  snapshot(0);
  for (let t = 1; t <= TICKS; t++) {
    state = runTick(state, [], rt);
    harvest();
    for (const p of state.strategicState?.projects ?? []) {
      const cur = projects.get(p.projectId);
      if (!cur) projects.set(p.projectId, { templateId: p.templateId, started: p.startedTick, status: p.status, actorId: p.actorId });
      else cur.status = p.status;
    }
    for (const l of wgLanes) if (laneGoneAt[l.id] === undefined && !g().getEdge(l.id)) laneGoneAt[l.id] = t;
    if (SNAP.has(t)) snapshot(t);
  }
  // Projects that dropped out of the active list: resolve their end from history if present.
  const hist = state.strategicState?.history ?? [];
  const histById = new Map<string, string>();
  for (const h of hist as ReadonlyArray<Record<string, unknown>>) if (h.projectId) histById.set(String(h.projectId), String(h.outcome ?? h.status ?? h.kind ?? '?'));
  const byTemplate: Record<string, { started: number; completed: number; failed: number; active: number }> = {};
  for (const [id, p] of projects) {
    if (!/companion|power|train_apprentice|route|standing|faction/.test(p.templateId)) continue;
    const row = byTemplate[p.templateId] ?? (byTemplate[p.templateId] = { started: 0, completed: 0, failed: 0, active: 0 });
    row.started++;
    const st = state.strategicState?.projects.find(x => x.projectId === id)?.status ?? histById.get(id) ?? p.status;
    if (/complet/.test(st)) row.completed++; else if (/fail|stall/.test(st)) row.failed++; else row.active++;
  }
  out[seed] = { wgLanes, laneGoneAt, dissolved, snaps, traceCounts, repCauses, successionOutcomes, projectsByTemplate: byTemplate, unkFirstSeen, unkSample };
  console.log(`seed ${seed} done: lanes gone at ${JSON.stringify(laneGoneAt)}`);
}
const path = process.argv[4] ?? 'Docs/audits/2026-09-25-living-world-data/output/dying.json';
writeFileSync(path, JSON.stringify(out, null, 1));
console.log('wrote', path);
