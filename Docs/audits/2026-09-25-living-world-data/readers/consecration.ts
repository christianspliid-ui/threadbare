// Census reader (THR-1660): mid-game consecration of pilgrim routes — what the world has
// today that a faith-driven consecration would read and write. Read-only; one world per
// seed, medium map, unattended (no player, no First), default scenario — faith.ts's pattern.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/consecration.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/consecration.mjs --external:fs --external:path
//   node .cache/consecration.mjs [seeds=42,99,7] [ticks=300] [out.json]
// (without an out path the JSON is printed to stdout, interleaved with worldgen logs)
//
// Snapshot sections A/B/C/F are taken at tick 0 and again at the final tick. D/E/G are
// accumulated across the run. Identification (see the THR-1660 census report):
//   - congregation: actor faction with factionDefId 'temple_of_spheres' AND a
//     `veneratedSphere` key (worldScenarioCensus.ts — the same predicate);
//   - presence in a town: faction --located_at{role:'guild_hall'}--> Location
//     (factionSeeding.ts, the hall writer; read by worldScenarioCensus.ts as hallCount);
//   - membership: individual --member_of--> faction;
//   - active ambition: agent --pursues{status:'active'}--> ambition node, template id via
//     getAmbitionTemplateId (phaseAgentDecision.ts strategic-candidate block);
//   - undertakings: state.strategicState.projects (new projectIds) + .history (rolling).
//
// THR-1660 (the build): section J counts the consecration cell itself — `sacred_route`
// edges by `origin`, `cell.create.pilgrim_way` projects started and finished by holder,
// pilgrimages offered and run at consecrated sites, and the board's refusal reasons for
// the cell (from `strategic_candidates_generated` traces) for the kill criterion.
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { EncounterCacheManager } from '../../../../src/engine/encounterCache';
import { getLocationNodes, resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { getAmbitionTemplateId } from '../../../../src/engine/ambitionShape';
import { TEMPLE_OF_SPHERES_DEF_ID } from '../../../../src/data/world-scenario';
import { UNDERTAKING_MODEL, STRATEGIC_TARGET_SCAN_CAPS } from '../../../../src/data/strategic-action-constants';
import { orderTargetsByProximity } from '../../../../src/engine/strategicActionCandidates';
import { getAgentLocationId } from '../../../../src/engine/graphQueries';
import { resolveLocationToHex } from '../../../../src/engine/encounterAwareness';
import { enableTracing, getTraces } from '../../../../src/engine/traceBuffer';
import type { GameState } from '../../../../src/types/gameState';
import type { WorldGraph } from '../../../../src/engine/graph';

const seeds = (process.argv[2] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 300);
const OUT_PATH = process.argv[4];
const WARMUP = 5;
const POOL_SAMPLE_EVERY = 25;
const PILGRIMAGE = 'encounter.pilgrimage_trial';
const FAITH = 'ambition_spread_faith';
const SETTLEMENT = new Set(['town', 'city', 'capital']);
const HOLY = new Set(['shrine', 'temple']);
const CONSECRATE = 'cell.create.pilgrim_way';

type P = Record<string, unknown>;

function locClass(subtype: string | undefined): string {
  if (subtype && HOLY.has(subtype)) return 'shrine_temple';
  if (subtype === 'capital') return 'capital';
  return 'other';
}

function parentLocOf(g: WorldGraph, nodeId: string | undefined) {
  if (!nodeId) return undefined;
  return resolveToParentLocation(g, g.getNode(nodeId));
}

function whereActor(g: WorldGraph, actorId: string) {
  const here = g.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  const node = here ? g.getNode(here) : undefined;
  const loc = parentLocOf(g, here);
  return {
    locationId: loc?.id ?? null,
    locationSubtype: (loc?.properties.locationSubtype as string | undefined) ?? null,
    onPlace: !!node && node.id !== loc?.id,
  };
}

function congregationsOf(g: WorldGraph) {
  return g.getNodesByType('actor').filter(n => {
    const p = n.properties as P;
    return p.actorType === 'faction' && p.factionDefId === TEMPLE_OF_SPHERES_DEF_ID && 'veneratedSphere' in p;
  });
}

function faithHolders(g: WorldGraph): string[] {
  const out = new Set<string>();
  for (const e of g.getEdgesByType('pursues')) {
    if ((e.properties as P)?.status !== 'active') continue;
    if (getAmbitionTemplateId(g.getNode(e.target)) !== FAITH) continue;
    const a = g.getNode(e.source);
    if (a?.properties.actorType === 'individual' && a.properties.deceased !== true) out.add(e.source);
  }
  return [...out].sort();
}

function locationCultureOf(g: WorldGraph, locationId: string): string | null {
  let best: string | null = null; let bestStrength = -Infinity;
  for (const e of g.getOutgoingEdges(locationId, 'belongs_to')) {
    const p = e.properties as P;
    if (p.cultureLayer !== 'current') continue;
    if (g.getNode(e.target)?.properties.actorType !== 'culture') continue;
    const s = typeof p.culturalStrength === 'number' ? p.culturalStrength : 0;
    if (s > bestStrength) { best = e.target; bestStrength = s; }
  }
  return best;
}

function snapshot(state: GameState) {
  const g = state.graph;
  // A. sacred_route edges
  const routes = g.getEdgesByType('sacred_route').map(e => {
    const s = g.getNode(e.source); const t = g.getNode(e.target);
    const sp = (s?.properties ?? {}) as P; const tp = (t?.properties ?? {}) as P;
    return {
      sourceId: e.source, sourceName: s?.name ?? null, sourceNodeType: s?.type ?? null,
      actorType: sp.actorType ?? null, factionType: sp.factionType ?? null, factionClass: sp.factionClass ?? null,
      factionDefId: sp.factionDefId ?? null,
      targetId: e.target, targetName: t?.name ?? null, targetSubtype: tp.locationSubtype ?? null,
      targetIsCapital: tp.locationSubtype === 'capital',
      origin: (e.properties as P).origin ?? null, establishedTick: (e.properties as P).establishedTick ?? null,
      routeType: (e.properties as P).routeType ?? null,
    };
  });
  const routedTargets = new Set(routes.map(r => r.targetId));

  // B. congregations, their presence, candidate destinations
  const locIds = new Set(getLocationNodes(g).map(n => n.id));
  const congs = congregationsOf(g).map(c => {
    const p = c.properties as P;
    const seatId = (p.homeLocationId as string | undefined) ?? null;
    const halls = [...new Set(g.getOutgoingEdges(c.id, 'located_at')
      .filter(e => (e.properties as P).role === 'guild_hall' && locIds.has(e.target))
      .map(e => e.target))];
    const hallSubtypes: Record<string, number> = {};
    for (const h of halls) {
      const st = String(g.getNode(h)?.properties.locationSubtype ?? 'none');
      hallSubtypes[st] = (hallSubtypes[st] ?? 0) + 1;
    }
    const candidates = halls.filter(h => SETTLEMENT.has(String(g.getNode(h)?.properties.locationSubtype)) && !routedTargets.has(h));
    const members = g.getIncomingEdges(c.id, 'member_of')
      .filter(e => { const a = g.getNode(e.source); return a?.properties.actorType === 'individual' && a.properties.deceased !== true; }).length;
    return {
      id: c.id, name: c.name, veneratedSphere: p.veneratedSphere ?? null,
      seatId, seatSubtype: seatId ? (g.getNode(seatId)?.properties.locationSubtype ?? null) : null,
      presenceLocations: halls.length, presenceBySubtype: hallSubtypes,
      settlementPresenceWithoutRoute: candidates.length,
      candidateDestinations: candidates.map(id => ({ id, subtype: g.getNode(id)?.properties.locationSubtype ?? null })),
      livingMembers: members,
    };
  });
  const congIds = new Set(congs.map(c => c.id));

  // C. spread_faith holders
  const holders = faithHolders(g).map(id => {
    const a = g.getNode(id)!;
    const culture = g.getOutgoingEdges(id, 'belongs_to').map(e => g.getNode(e.target))
      .find(n => n?.properties.actorType === 'culture');
    const memberOfCong = g.getOutgoingEdges(id, 'member_of').filter(e => congIds.has(e.target)).map(e => e.target);
    const w = whereActor(g, id);
    return {
      id, name: a.name, cultureId: culture?.id ?? null, cultureName: culture?.name ?? null,
      congregationMemberOf: memberOfCong,
      otherFactions: g.getOutgoingEdges(id, 'member_of').filter(e => !congIds.has(e.target))
        .map(e => String(g.getNode(e.target)?.properties.factionDefId ?? g.getNode(e.target)?.properties.factionType ?? e.target)),
      ...w,
      atHolyPlace: HOLY.has(String(w.locationSubtype)),
    };
  });
  const holderSubtypes: Record<string, number> = {};
  for (const h of holders) holderSubtypes[String(h.locationSubtype)] = (holderSubtypes[String(h.locationSubtype)] ?? 0) + 1;

  // F. holy places
  const holyPlaces = getLocationNodes(g).filter(n => HOLY.has(String(n.properties.locationSubtype)));
  const holyBySubtype: Record<string, number> = {};
  for (const n of holyPlaces) { const s = String(n.properties.locationSubtype); holyBySubtype[s] = (holyBySubtype[s] ?? 0) + 1; }

  // H. town/city/capital Locations whose own culture has a congregation, with no route.
  // Location culture: its `belongs_to` edges to culture actors on the `current` layer,
  // strongest `culturalStrength` wins (npcSeeding.ts:338 resolveLocationCulture prefers
  // `current`; culturalTension.ts:47 getLocationCultureIds filters to culture actors —
  // both private, so inlined). Congregation culture: the Temple faction's own
  // `belongs_to` culture edge (worldSeed.ts:2117 assignCultureToActor).
  const congCultures = new Set<string>();
  for (const c of congregationsOf(g)) {
    for (const e of g.getOutgoingEdges(c.id, 'belongs_to')) {
      if (g.getNode(e.target)?.properties.actorType === 'culture') congCultures.add(e.target);
    }
  }
  const settlements = getLocationNodes(g).filter(n => SETTLEMENT.has(String(n.properties.locationSubtype)));
  const hPass = new Set<string>();
  let hNoCulture = 0; let hCultureNoCong = 0; let hRouted = 0;
  for (const n of settlements) {
    const culture = locationCultureOf(g, n.id);
    if (!culture) { hNoCulture++; continue; }
    if (!congCultures.has(culture)) { hCultureNoCong++; continue; }
    if (routedTargets.has(n.id)) { hRouted++; continue; }
    hPass.add(n.id);
  }

  // I. per alive holder: the 8 nearest town/city/capital Locations, ordered exactly as
  // strategicActionCandidates.ts:790-810 does for a location_subtype target rule —
  // all `location` nodes filtered by subtype, `orderTargetsByProximity` from the hex of
  // `getAgentLocationId` (strategicActionCandidates.ts:206-209), cap
  // STRATEGIC_TARGET_SCAN_CAPS.location_subtype (= 8). The own-settlement exclusion
  // (route-creating templates only) is NOT applied: a consecration is not a trade route.
  const allSettlementLike = g.getNodesByType('location')
    .filter(n => SETTLEMENT.has(String(n.properties.locationSubtype ?? n.properties.locationType)));
  const iCounts = faithHolders(g).map(id => {
    const locId = getAgentLocationId(g, id);
    const hex = locId ? resolveLocationToHex(g, locId) : null;
    const near = orderTargetsByProximity(g, allSettlementLike, hex, STRATEGIC_TARGET_SCAN_CAPS.location_subtype);
    return near.filter(n => hPass.has(n.id)).length;
  }).sort((a, b) => a - b);

  return {
    tick: state.tick,
    H_congregationCultureSettlementsWithoutRoute: {
      townCityCapital: settlements.length,
      pass: hPass.size,
      noCulture: hNoCulture,
      cultureWithoutCongregation: hCultureNoCong,
      alreadyRouted: hRouted,
    },
    I_holderNearestEightPassing: {
      cap: STRATEGIC_TARGET_SCAN_CAPS.location_subtype,
      holders: iCounts.length,
      min: iCounts[0] ?? null,
      median: iCounts.length ? iCounts[Math.floor(iCounts.length / 2)] : null,
      max: iCounts[iCounts.length - 1] ?? null,
      holdersWithZero: iCounts.filter(x => x === 0).length,
      distribution: iCounts,
    },
    A_sacredRoutes: { count: routes.length, routes },
    B_congregations: {
      count: congs.length,
      totalCandidateDestinations: congs.reduce((a, c) => a + c.settlementPresenceWithoutRoute, 0),
      congregations: congs,
    },
    C_faithHolders: {
      aliveCount: holders.length,
      congregationMembers: holders.filter(h => h.congregationMemberOf.length > 0).length,
      byLocationSubtype: holderSubtypes,
      holders,
    },
    F_holyPlaces: {
      count: holyPlaces.length, bySubtype: holyBySubtype,
      holdersAtHolyPlace: holders.filter(h => h.atHolyPlace).length,
    },
  };
}

function poolSample(cache: EncounterCacheManager | null, g: WorldGraph) {
  if (!cache) return null;
  const locs = new Set(cache.getAllEntries().filter(e => e.templateId === PILGRIMAGE).map(e => e.locationId));
  const byClass: Record<string, number> = { shrine_temple: 0, capital: 0, other: 0 };
  const routed = new Set(g.getEdgesByType('sacred_route').map(e => e.target));
  let onRouted = 0;
  for (const id of locs) {
    byClass[locClass(g.getNode(id)?.properties.locationSubtype as string | undefined)]++;
    if (routed.has(id)) onRouted++;
  }
  return { locations: locs.size, byClass, onRoutedDestination: onRouted };
}

const out: Record<string, unknown> = { undertakingModel: UNDERTAKING_MODEL, ticks: TICKS, map: 'medium', scenario: 'default' };

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const rt = createSimulationRuntime();
  if (process.env.CENSUS_TRACE !== '0') enableTracing();
  const pr = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(
    generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows,
  ) as { state: GameState };

  const t0 = snapshot(state);
  let poolT0: unknown;
  try {
    const cache = new EncounterCacheManager();
    cache.buildFullCache(state.graph, 0);
    poolT0 = poolSample(cache, state.graph);
  } catch (err) { poolT0 = `unreadable: ${String(err).slice(0, 80)}`; }

  const report: P = { t0, E_poolAtT0: poolT0 };

  if (TICKS > 0) {
    let steadyMs = 0; let steadyTicks = 0;
    const holdersEver = new Set<string>(faithHolders(state.graph));
    const seenProjects = new Set<string>();
    const seenHistory = new Set<string>();
    const projectsByTemplate: Record<string, { started: number; byFaithHolder: number; faithAmbition: number }> = {};
    const faithHistory: Record<string, Record<string, number>> = {};
    const holderHistory: Record<string, Record<string, number>> = {};
    const pilgrimage = new Map<string, { cls: string; resolved: boolean; outcome: string | null; onRoute: boolean }>();
    const poolSamples: Array<{ tick: number; sample: unknown }> = [];
    // J (THR-1660)
    const jStartedBy: Record<string, number> = {};
    const jFinished: Record<string, number> = {};
    const jRefusals: Record<string, number> = {};
    const jPilgrimageAtConsecrated = new Set<string>();
    const jPilgrimageAtConsecratedResolved = new Set<string>();

    for (let i = 0; i < TICKS; i++) {
      const s = Date.now();
      state = runTick(state, [], rt);
      const ms = Date.now() - s;
      if (i >= WARMUP) { steadyMs += ms; steadyTicks++; }
      const g = state.graph;

      const holdersNow = new Set(faithHolders(g));
      for (const h of holdersNow) holdersEver.add(h);

      // D. undertakings
      for (const p of state.strategicState?.projects ?? []) {
        if (seenProjects.has(p.projectId)) continue;
        seenProjects.add(p.projectId);
        const row = (projectsByTemplate[p.templateId] ??= { started: 0, byFaithHolder: 0, faithAmbition: 0 });
        row.started++;
        // Holder at the tick the project first appears (the actor's active ambition then).
        if (holdersNow.has(p.actorId)) row.byFaithHolder++;
        if (p.ambitionId === FAITH) row.faithAmbition++;
        if (p.templateId === CONSECRATE) jStartedBy[p.actorId] = (jStartedBy[p.actorId] ?? 0) + 1;
      }
      for (const h of state.strategicState?.history ?? []) {
        const key = `${h.tick}|${h.actorId}|${h.templateId}|${h.outcome}|${h.targetNodeId ?? ''}`;
        if (seenHistory.has(key)) continue;
        seenHistory.add(key);
        if (h.ambitionId === FAITH) {
          const r = (faithHistory[h.templateId] ??= {});
          r[h.outcome] = (r[h.outcome] ?? 0) + 1;
        }
        if (h.templateId === CONSECRATE) jFinished[h.outcome] = (jFinished[h.outcome] ?? 0) + 1;
        if (holdersEver.has(h.actorId)) {
          const r = (holderHistory[h.templateId] ??= {});
          r[h.outcome] = (r[h.outcome] ?? 0) + 1;
        }
      }

      // E. pilgrimage runs (faith.ts's method: unifiedActions by templateId)
      const routed = new Set(g.getEdgesByType('sacred_route').map(e => e.target));
      for (const a of state.unifiedActions ?? []) {
        if (a.templateId !== PILGRIMAGE) continue;
        const target = g.getNode(a.targetId);
        const loc = target?.type === 'location'
          ? resolveToParentLocation(g, target)
          : parentLocOf(g, g.getOutgoingEdges(a.actorId, 'located_at')[0]?.target);
        if (loc && g.getIncomingEdges(loc.id, 'sacred_route').some(e => (e.properties as P).origin === 'undertaking')) {
          jPilgrimageAtConsecrated.add(a.actionId);
          if (a.resolved === true) jPilgrimageAtConsecratedResolved.add(a.actionId);
        }
        const prev = pilgrimage.get(a.actionId);
        pilgrimage.set(a.actionId, {
          cls: prev?.cls ?? locClass(loc?.properties.locationSubtype as string | undefined),
          resolved: (prev?.resolved ?? false) || a.resolved === true,
          outcome: (a.outcome as string | undefined) ?? prev?.outcome ?? null,
          onRoute: prev?.onRoute ?? (!!loc && routed.has(loc.id)),
        });
      }
      for (const t of getTraces() as Array<P>) {
        if (t.category !== 'strategic_candidate_board' || t.tick !== state.tick - 1) continue;
        const rej = t.refusals as Array<{ templateId?: string; reason?: string }> | undefined;
        if (!Array.isArray(rej)) continue;
        for (const r of rej) {
          if (r.templateId !== CONSECRATE || !r.reason) continue;
          const reason = r.reason.split(':').slice(0, 2).join(':');
          jRefusals[reason] = (jRefusals[reason] ?? 0) + 1;
        }
      }
      if ((i + 1) % POOL_SAMPLE_EVERY === 0) {
        poolSamples.push({ tick: state.tick, sample: poolSample(rt.encounterCache, g) });
      }
    }

    const pilgrimageByClass: Record<string, { offeredRuns: number; resolved: number }> = {};
    const outcomes: Record<string, number> = {};
    let onRoute = 0;
    for (const v of pilgrimage.values()) {
      const r = (pilgrimageByClass[v.cls] ??= { offeredRuns: 0, resolved: 0 });
      r.offeredRuns++;
      if (v.resolved) r.resolved++;
      if (v.outcome) outcomes[v.outcome] = (outcomes[v.outcome] ?? 0) + 1;
      if (v.onRoute) onRoute++;
    }

    report.tEnd = snapshot(state);
    report.C_holdersEverUnion = holdersEver.size;
    report.D_undertakings = {
      field: 'state.strategicState.projects (new projectId) + state.strategicState.history (deduped)',
      projectsStartedTotal: seenProjects.size,
      projectsByFaithHolders: Object.fromEntries(Object.entries(projectsByTemplate).filter(([, r]) => r.byFaithHolder > 0)),
      projectsWithFaithAmbition: Object.fromEntries(Object.entries(projectsByTemplate).filter(([, r]) => r.faithAmbition > 0)),
      historyWithFaithAmbition: faithHistory,
      historyByFaithHolders: holderHistory,
    };
    report.E_pilgrimage = {
      actionsStarted: pilgrimage.size,
      onRoutedDestination: onRoute,
      byClass: pilgrimageByClass,
      outcomes,
      poolSamples,
    };
    const byOrigin: Record<string, number> = {};
    for (const e of state.graph.getEdgesByType('sacred_route')) {
      const o = String((e.properties as P).origin ?? 'legacy');
      byOrigin[o] = (byOrigin[o] ?? 0) + 1;
    }
    report.J_consecration = {
      sacredRoutesByOriginAtEnd: byOrigin,
      projectsStarted: Object.values(jStartedBy).reduce((a, b) => a + b, 0),
      startedByHolder: jStartedBy,
      historyOutcomes: jFinished,
      boardRefusals: jRefusals,
      pilgrimagesAtConsecratedSites: jPilgrimageAtConsecrated.size,
      pilgrimagesAtConsecratedSitesResolved: jPilgrimageAtConsecratedResolved.size,
    };
    report.G_steadyMsPerTick = steadyTicks ? +(steadyMs / steadyTicks).toFixed(1) : null;
  }
  out[seed] = report;
}
// Worldgen logs to stdout too, so the JSON goes to a file when a path is given.
if (OUT_PATH) fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
else console.log(JSON.stringify(out, null, 2));
