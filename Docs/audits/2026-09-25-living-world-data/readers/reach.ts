// THR-1597 — gate attribution for encounter templates that never fire.
//
// For every drawable encounter template, runs real worlds (initializeGameState → runTick,
// seeds × ticks, medium) and records where it falls off the road to a firing, in the
// order the engine applies the gates:
//
//   supply    — is it ever offered at all?  location templates: is a Location of an
//               accepted subtype on the map, and does the encounter cache register the
//               template there?  faction templates: does the faction exist, has it a
//               member (member_of with factionDefId), does a member's rank unlock it?
//   travel    — offered, but no mortal is ever within the spatial query range of an
//               entry (the funnel never "considers" it)
//   funnel    — considered, and every consideration is gated by the filter pipeline
//               (awareness / visibility / prerequisites / threat / cap) — read off the
//               engine's own EligibilityFunnelCounters (runtime.eligibilityFunnel)
//   cooldown  — survives the pipeline but is never scored (cooldown / completion cap)
//   outscored — scored, never selected
//   spawn     — selected, never became a unified action
//
// Also: the planted-seed ledger with a reason for every withered seed, subtype
// occupancy (mortal-samples per Location subtype), and the location-trait bonus tags.
//
// Run (repo root):
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/reach.ts --bundle --platform=node --format=esm --outfile=.cache/reach.mjs --external:fs --external:path && node .cache/reach.mjs 42,99 200 > out.json
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../../../../src/data/unified-action-templates';
import { CONTENT_OBJECT_KINDS } from '../../../../src/data/content-objects';
import { getLocationNodes, resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { FACTION_ENCOUNTER_META, metaBelongsToDefinitionId } from '../../../../src/data/faction-encounter-content';
import { getFactionDefinition, ALL_FACTION_DEFINITIONS } from '../../../../src/data/faction-definition-lookup';
import { getAccessibleTemplates } from '../../../../src/engine/factionQuestGeneration';
import { computeRankFromReputation } from '../../../../src/types/faction';
import { getFactionMembershipEdges, getAgentLocation } from '../../../../src/engine/graphQueries';
import { isAutonomousDecisionActor } from '../../../../src/engine/strategicKindReachability';
import { SeedConsumptionLedger } from '../../../../scripts/seed-consumption-ledger';
import { seedContentQuery } from '../../../../src/engine/encounterSeeding';
import { resolveContentQuery } from '../../../../src/engine/contentQuery';
import { sessionContentCatalogs } from '../../../../src/engine/contentCatalogView';
import { getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';
import { templateEffectiveTags } from '../../../../src/engine/locationTraitBonus';
import { LOCATION_TRAIT_ENCOUNTER_BONUS } from '../../../../src/data/location-trait-constants';

const encKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'encounter_template')!;
const isEnc = (id: string) => encKind.idPrefixes.some(p => id.startsWith(p));
const ALL = new Map<string, any>();
for (const t of [...(UNIFIED_ACTION_TEMPLATES as any[]), ...(LOCATION_BRANCHING_ENCOUNTER_TEMPLATES as any[])]) if (isEnc(t.id)) ALL.set(t.id, t);
const DRAWABLE = [...ALL.values()].filter(t => t.drawable !== false);

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);
const SAMPLE_EVERY = 25;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };

/** meta → definition ids it belongs to (class-scoped Realm rows belong to every Realm def). */
function metaDefIds(meta: any): string[] {
  return [...ALL_FACTION_DEFINITIONS.keys()].filter(d => metaBelongsToDefinitionId(meta, d));
}

const perSeed: any = {};
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime: any = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Reach', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;
  const g = () => state.graph;

  const fired: Record<string, { seeded: number; board: number }> = {};
  const seen = new Set<string>();
  const cacheLocs: Record<string, number> = {};   // template → max distinct locations in cache at any sample
  const inCache = new Set<string>();
  const supplied = new Set<string>();            // faction templates in some member's accessible set
  const deciderSupplied = new Set<string>();     // …in some *deciding* member's accessible set
  const factionNodes: Record<string, number> = {};
  const members: Record<string, number> = {};    // defId → max member count at any sample
  const memberRanks: Record<string, Record<string, number>> = {};
  const locSubtypeCount: Record<string, number> = {};
  const occupancy: Record<string, number> = {};  // Location-tier subtype → mortal-samples
  const occupancyFeet: Record<string, number> = {}; // exact located_at node subtype (array path)
  let occupancySamples = 0;
  const deciderMembers: Record<string, number> = {}; // defId → max deciding (spotlight) members at any sample
  const deciderOccupancy: Record<string, number> = {}; // Location-tier subtype → decider-samples
  let deciderSamples = 0;
  const ledger = new SeedConsumptionLedger();
  const withered: any[] = [];

  const sample = () => {
    const cache = runtime.encounterCache;
    if (cache) {
      const per: Record<string, Set<string>> = {};
      for (const e of cache.getAllEntries()) { (per[e.templateId] ??= new Set()).add(e.locationId); inCache.add(e.templateId); }
      for (const [id, s] of Object.entries(per)) cacheLocs[id] = Math.max(cacheLocs[id] ?? 0, s.size);
    }
    const mem: Record<string, number> = {};
    const decMem: Record<string, number> = {};
    for (const n of g().getNodesByType('actor')) {
      const p = n.properties as any;
      if (p.actorType !== 'individual') continue;
      if (p.isDead || p.status === 'dead') continue;
      occupancySamples++;
      const at = getAgentLocation(g(), n.id);
      const loc = resolveToParentLocation(g(), at);
      inc(occupancy, String(loc?.properties?.locationSubtype ?? loc?.properties?.locationType ?? '(off-location)'));
      inc(occupancyFeet, String(at?.properties?.locationSubtype ?? at?.properties?.locationType ?? at?.properties?.sublocationTypeId ?? '(none)'));
      const decides = isAutonomousDecisionActor(n);
      if (decides) { deciderSamples++; inc(deciderOccupancy, String(loc?.properties?.locationSubtype ?? loc?.properties?.locationType ?? '(off-location)')); }
      for (const e of getFactionMembershipEdges(g(), n.id)) {
        const defId = (e.properties as any).factionDefId; if (!defId) continue;
        inc(mem, defId);
        if (decides) inc(decMem, defId);
        const def = getFactionDefinition(defId); if (!def) continue;
        const rank = computeRankFromReputation((e.properties as any).reputation ?? 0, def);
        memberRanks[defId] ??= {}; inc(memberRanks[defId], rank.id);
        for (const t of getAccessibleTemplates(def, rank)) { supplied.add(t.id); if (decides) deciderSupplied.add(t.id); }
      }
    }
    for (const [d, c] of Object.entries(mem)) members[d] = Math.max(members[d] ?? 0, c);
    for (const [d, c] of Object.entries(decMem)) deciderMembers[d] = Math.max(deciderMembers[d] ?? 0, c);
    for (const n of g().getAllNodes()) {
      const p = n.properties as any;
      if (p?.actorType === 'faction' && p.factionDefId) factionNodes[p.factionDefId] = Math.max(factionNodes[p.factionDefId] ?? 0, 1);
    }
  };
  const harvest = () => {
    for (const a of state.unifiedActions ?? []) {
      if (!ALL.has(a.templateId) || seen.has(a.actionId)) continue;
      seen.add(a.actionId);
      const f = (fired[a.templateId] ??= { seeded: 0, board: 0 });
      if (a.spawnedFromSeedId) f.seeded++; else f.board++;
    }
    const before = new Set(ledger.all().filter(e => e.consumption).map(e => e.seedId));
    ledger.observe(state);
    for (const e of ledger.all()) {
      if (e.consumption !== 'family_ready' || before.has(e.seedId)) continue;
      const q = seedContentQuery(e.seed);
      const hits = q ? resolveContentQuery(q, sessionContentCatalogs(g())) : [];
      const tmpls = hits.map((h: any) => getUnifiedTemplateById(h.id)).filter(Boolean) as any[];
      const indiv = tmpls.filter(t => t.actorAffinities?.includes('individual'));
      const accepts = new Set<string>(); let ungated = 0;
      for (const t of indiv) { if (!t.locationSubtypes?.length) ungated++; else for (const s of t.locationSubtypes) accepts.add(s); }
      const at = resolveToParentLocation(g(), getAgentLocation(g(), e.seed.targetAgentId));
      const targetSub = String(at?.properties?.locationSubtype ?? at?.properties?.locationType ?? '(none)');
      const anchor = e.seed.resolutionLocationId ? resolveToParentLocation(g(), g().getNode(e.seed.resolutionLocationId)) : undefined;
      const reason = !q ? 'no_query' : hits.length === 0 ? 'query_no_hits' : indiv.length === 0 ? 'no_individual_member' : 'subtype_mismatch';
      withered.push({
        family: e.seed.encounterFamily ?? null, query: q ? JSON.stringify(q) : null, source: e.seed.sourceEncounterId, reaction: e.seed.sourceReactionId,
        hits: hits.length, individual: indiv.length, ungated, accepts: [...accepts].sort(), targetSub,
        anchorSub: anchor ? String(anchor.properties?.locationSubtype ?? '') : null, reason,
      });
    }
  };

  for (const n of getLocationNodes(g())) inc(locSubtypeCount, String(n.properties.locationSubtype ?? n.properties.locationType ?? '?'));
  harvest(); sample();
  for (let i = 1; i <= TICKS; i++) {
    state = runTick(state, [], runtime);
    harvest();
    if (i % SAMPLE_EVERY === 0) sample();
  }
  const funnel = runtime.eligibilityFunnel?.byTemplate ?? {};
  perSeed[seed] = { fired, cacheLocs, inCache: [...inCache], supplied: [...supplied], deciderSupplied: [...deciderSupplied], factionNodes, members, memberRanks,
    locSubtypeCount, occupancy, occupancyFeet, occupancySamples, deciderMembers, deciderOccupancy, deciderSamples, funnel, funnelTruncated: runtime.eligibilityFunnel?.truncated ?? null,
    ledger: ledger.summary(), withered };
}

// ─── Attribution ────────────────────────────────────────────────────
const STAGES = ['awareness', 'visibility', 'prerequisites', 'threat', 'cap'];
function familyOf(t: any): string {
  const meta = FACTION_ENCOUNTER_META.get(t.id);
  if (meta) return 'faction:' + (meta.factionClass ? 'class:' + meta.factionClass : meta.factionDefId);
  if (t.id.endsWith('.join') || t.id.endsWith('.promotion')) return 'faction:lifecycle';
  const p = t.id.split('.');
  return 'prefix:' + (p.length >= 3 ? p[0] + '.' + p[1] : p[0]);
}
const rows: any[] = [];
for (const t of DRAWABLE) {
  const firedAny = seeds.some(s => { const f = perSeed[s].fired[t.id]; return f && f.seeded + f.board > 0; });
  const meta = FACTION_ENCOUNTER_META.get(t.id);
  const subs: string[] = t.locationSubtypes ?? [];
  const perSeedGate: Record<string, string> = {};
  for (const s of seeds) {
    const d = perSeed[s];
    const f = d.fired[t.id]; if (f && f.seeded + f.board > 0) { perSeedGate[s] = 'FIRED'; continue; }
    const fn = d.funnel[t.id];
    let gate: string;
    const placeExists = subs.length === 0 || subs.some(x => (d.locSubtypeCount[x] ?? 0) > 0);
    if (meta && !d.inCache.includes(t.id)) {
      const defs = metaDefIds(meta);
      if (!defs.some(x => d.factionNodes[x])) gate = 'supply:faction_absent';
      else if (!defs.some(x => d.members[x])) gate = 'supply:no_members';
      else if (!d.supplied.includes(t.id)) gate = 'supply:rank_access';
      else if (!defs.some(x => d.deciderMembers[x])) gate = 'supply:no_deciding_member';
      else if (!d.deciderSupplied.includes(t.id)) gate = 'supply:no_decider_at_rank';
      else gate = fn ? '' : 'travel:never_considered';
    } else if (!d.inCache.includes(t.id)) {
      gate = !placeExists ? 'supply:no_place_of_subtype' : subs.length === 0 ? 'supply:no_subtype_array_only' : 'supply:not_registered_in_cache';
    } else gate = fn ? '' : 'travel:never_considered';
    if (!gate) {
      const survived = fn.considered - Object.values(fn.gatedBy as Record<string, number>).reduce((a, b) => a + b, 0);
      if (survived <= 0) {
        const top = STAGES.map(st => [st, fn.gatedBy[st] ?? 0] as [string, number]).sort((a, b) => b[1] - a[1])[0];
        gate = 'funnel:' + top[0];
      } else if (fn.scored === 0) gate = 'cooldown_or_retired';
      else if (fn.selected === 0) gate = 'outscored';
      else gate = 'selected_not_spawned';
    }
    perSeedGate[s] = gate;
  }
  rows.push({ id: t.id, family: familyOf(t), subtypes: subs, tier: t.intrinsicTier, scale: t.scale, actor: t.actorAffinities,
    tags: templateEffectiveTags(t.id), fired: firedAny, gates: perSeedGate,
    prereqFields: ['requiredTraits', 'blockedByTraits', 'minGroupMembers', 'requiresOpposingBand', 'requiresLiveMonster',
      'requiredReputationWith', 'requiresHold', 'chainId', 'chain', 'prerequisites'].filter(k => t[k] !== undefined && !(Array.isArray(t[k]) && t[k].length === 0)),
    groupOnly: !!(t.actorAffinities?.includes('group') && !t.actorAffinities?.includes('individual')),
    metaQuestType: meta?.questType ?? null, metaMinRank: meta?.minRank ?? null,
    funnel: Object.fromEntries(seeds.map(s => [s, perSeed[s].funnel[t.id] ?? null])) });
}

// Bonus-tag bearers.
const bonusTags = new Set<string>(); for (const m of Object.values(LOCATION_TRAIT_ENCOUNTER_BONUS)) for (const k of Object.keys(m)) bonusTags.add(k);
const bonusBearers: Record<string, number> = {}; for (const tag of bonusTags) bonusBearers[tag] = DRAWABLE.filter(t => templateEffectiveTags(t.id).includes(tag)).length;

console.log(JSON.stringify({ seeds, ticks: TICKS, drawable: DRAWABLE.length, rows, perSeed: Object.fromEntries(seeds.map(s => {
  const d = perSeed[s]; return [s, { ...d, funnel: undefined, inCache: d.inCache.length, supplied: d.supplied.length, deciderSupplied: d.deciderSupplied.length }];
})), bonusBearers }, null, 1));
