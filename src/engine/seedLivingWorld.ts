// src/engine/seedLivingWorld.ts

/**
 * Seed the living world — the tail pass of `seedWorld` (THR-1437).
 *
 * THR-1435 measured what the starting world actually holds: of 476 mortals, 14 carry
 * capabilities and the spotlight tier, and of 50 edge types 15 exist at tick 0 — none
 * of them `owns`, `trades_with`, `knows_secret_of` or `hostile_to`. So the trade
 * phases, the toll and the tithe, the motive gate and the leverage cells have no
 * object to read until an undertaking makes one, and the undertakings that make them
 * are held by fourteen people.
 *
 * Seven passes (W2…W8), run in order after every existing seed step, plus the people web
 * (THR-1630: ties, home standing, favours) between possessions and quarrels, and one
 * notable per settlement (THR-1654) between marks and garrisons. Each:
 *   - is guarded by its own constant (`0` — or `'round_robin'` for territory — disables it),
 *   - reuses the writer the in-run system already uses (no second spelling of anything),
 *   - is wrapped in its own try/catch, so a throwing pass is reported and skipped
 *     rather than invalidating the world (NFP #4), with per-item fail-soft inside,
 *   - chooses by sorting, never by drawing (NFP #3) — except `seedTies`, which draws from
 *     its own reserved stream over id-sorted lists, and `seedNotables`, whose hydration
 *     draws a notable's archetype and values from its own.
 *
 * The PRNG streams are *reserved* rather than used: see `WORLDGEN_LIVING_PRIMES`.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { GameState } from '../types/gameState';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import { hexDistance } from '../lib/hexMath';
import { stampRealmSeat } from './realmSeat';
import type { HexCoord } from '../types/index';
import { LOCATION_CLASSES, placeClassOf } from '../data/world-objects';
import { isPlaceNode } from './sublocationShape';
import { createTradeRoute, mintLeverageMark } from './strategicGraphOps';
import { mintRouteIdentity } from './tradeRouteOps';
import { grantHolding } from './holdings';
import { instantiateReward } from './rewardPool';
import { writeGrudge } from './grievance/grudgeEdge';
import { createFavorEdge } from './secretGeneration';
import { joinFaction } from './factionMembership';
import { isMonster } from './monsters/isMonster';
import { spawnArmy } from './armySpawning';
import { REALM_FACTION_CLASS } from '../data/realm-content';
import { REWARD_POSSESSIONS } from '../data/reward-attachment-catalog';
import {
  UNDERTAKING_DEFAULT_MARK_SECRET_TYPE,
  UNDERTAKING_DEFAULT_MARK_MAGNITUDE,
} from '../data/strategic-action-constants';
import { AMBITION_KIND_FACTION, AMBITION_KIND_KEY } from './ambitionShape';
import { hydrateToTier, ROLE_WEALTH, DEFAULT_WEALTH } from './npcGraduation';
import type { SublocationTag } from './settlementGenome/types';
import {
  LIVING_WORLD_DEFAULTS,
  WORLDGEN_TIES_PRIME_INDEX,
  WORLDGEN_NOTABLES_PRIME_INDEX,
  NOTABLE_ORIGIN_WORLDGEN,
  type LivingWorldConstants,
} from '../data/worldgen-living-constants';

// ─── Seeded PRNG (same shape as worldSeed's; reserved streams only) ─────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Context & summary ─────────────────────────────────────────────────────

/**
 * Everything the passes read, handed in from `seedWorld` at the one point where all
 * of it exists (after `assignFactionsToExistingNpcs` — the THR-1344 lesson).
 */
export interface LivingWorldContext {
  seed: number;
  locationIds: readonly string[];
  /** The seeded protagonists (`ind_i`) — spotlight mortals with capabilities. */
  individualIds: readonly string[];
  /** Generic factions (`faction_i`) — the round-robin territory holders. */
  factionIds: readonly string[];
  /** Data-driven factions (`faction_def_*`) — the ones with a home Location. */
  factionDefIds: readonly string[];
  cultureIds: readonly string[];
  locationCultureMap: ReadonlyMap<string, { cultureId: string; role: number }>;
}

export interface LivingWorldSummary {
  territoryRetargeted: number;
  routes: number;
  freeholds: number;
  possessions: number;
  /** THR-1630: seeded kin / friend / rival ties (each counted once, though written both ways). */
  ties: SeededTiesSummary;
  /** THR-1630: hero memberships moved to the Realm holding their home. */
  homeStandingMoves: HomeStandingMove[];
  /** THR-1630: favours owed inside a hero's faction. */
  favors: number;
  quarrels: number;
  marks: number;
  /** THR-1654: one notable per settlement, and every settlement whose package came up short. */
  notables: SeededNotablesSummary;
  garrisons: number;
  /** Garrison captains minted — protagonists by construction, folded into `individualIds`. */
  captainIds: string[];
  /** Pass labels that threw. The world is still valid; the line says what is missing. */
  failedPasses: string[];
}

// ─── Shared helpers (sorted-first, id tie-breaks — NFP #3) ─────────────────

const SETTLEMENT_SUBTYPES: ReadonlySet<string> = new Set(LOCATION_CLASSES.settlement);

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function hexOf(graph: WorldGraph, locationId: string): HexCoord | undefined {
  const node = graph.getNode(locationId);
  const col = node?.properties.hexCol;
  const row = node?.properties.hexRow;
  if (typeof col !== 'number' || typeof row !== 'number') return undefined;
  return { col, row };
}

function subtypeOf(node: GraphNode | undefined): string {
  return (node?.properties.locationSubtype as string | undefined) ?? '';
}

/**
 * The location a mortal calls home.
 *
 * `properties.locationId` is what the individuals loop stamps; the `located_at` edge
 * is the fallback for a captain or NPC minted without it. A mortal standing in a Place
 * resolves up to its parent Location — the tier every pass here reasons at.
 */
function homeLocationOf(graph: WorldGraph, actorId: string): string | undefined {
  const node = graph.getNode(actorId);
  let raw = node?.properties.locationId as string | undefined;
  if (typeof raw !== 'string' || raw.length === 0) {
    raw = graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  }
  if (!raw) return undefined;
  const rawNode = graph.getNode(raw);
  if (!rawNode) return undefined;
  if (isPlaceNode(rawNode)) {
    const parent = rawNode.properties.parentLocationId as string | undefined;
    return typeof parent === 'string' ? parent : undefined;
  }
  return raw;
}

/**
 * Every spotlight mortal: the seeded protagonists first (in `individualIds` order,
 * sorted), then any other individual actor carrying the spotlight tier and
 * capabilities — which is how a garrison captain minted by W8 becomes visible to a
 * later pass in the same run.
 */
export function collectSpotlightMortals(
  graph: WorldGraph,
  individualIds: readonly string[],
): GraphNode[] {
  const seen = new Set<string>();
  const out: GraphNode[] = [];
  for (const id of [...individualIds].sort()) {
    const node = graph.getNode(id);
    if (!node || !node.properties.domainCapabilities) continue;
    seen.add(id);
    out.push(node);
  }
  const others = graph.getNodesByType('actor')
    .filter(n =>
      !seen.has(n.id)
      && n.properties.actorType === 'individual'
      && n.properties.spotlightTier === 'spotlight'
      && !!n.properties.domainCapabilities)
    .sort(byId);
  return [...out, ...others];
}

/** Highest `domainCapabilities` value; ties break in `REACH_DOMAINS` order. */
export function leadingReach(node: GraphNode | undefined): ReachDomain | undefined {
  const caps = node?.properties.domainCapabilities as Partial<Record<ReachDomain, number>> | undefined;
  if (!caps) return undefined;
  let best: ReachDomain | undefined;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (const domain of REACH_DOMAINS) {
    const value = caps[domain];
    if (typeof value !== 'number') continue;
    if (value > bestValue) { bestValue = value; best = domain; }
  }
  return best;
}

function capabilityOf(node: GraphNode, domain: ReachDomain): number {
  const caps = node.properties.domainCapabilities as Partial<Record<ReachDomain, number>> | undefined;
  const value = caps?.[domain];
  return typeof value === 'number' ? value : 0;
}

/** Locations of one culture, sorted by id — the unit every per-culture pass works over. */
function locationsOfCulture(ctx: LivingWorldContext, cultureId: string): string[] {
  const out: string[] = [];
  for (const [locId, entry] of ctx.locationCultureMap) {
    if (entry.cultureId === cultureId) out.push(locId);
  }
  return out.sort();
}

/**
 * The culture's seat: its `capital`, else its first `city`, else its first `town`, by id.
 *
 * Fail-soft rather than assumed — the promotion pass makes exactly one capital per
 * culture, but a culture with no promotable Location gets none (plan § Fail-soft).
 */
export function findCapital(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  cultureId: string,
): string | undefined {
  const locIds = locationsOfCulture(ctx, cultureId);
  for (const wanted of ['capital', 'city', 'town'] as const) {
    for (const locId of locIds) {
      if (subtypeOf(graph.getNode(locId)) === wanted) return locId;
    }
  }
  return undefined;
}

// ─── W2 — territory by province ────────────────────────────────────────────

/**
 * Reconcile a Realm's worldgen territory with the definition factions that keep a
 * hall of their own (THR-1155).
 *
 * The Realm mint writes the territory: at worldgen every Location inside a culture
 * domain gets one `controls` edge from that culture's Realm, which is what makes the
 * red border on the map the towns a nation holds. What this pass is still for is the
 * one collision that mint cannot see from where it stands — a definition faction's
 * **home** Location already carries a `controls` edge from that faction
 * (`ensureFactionControlAtHomeLocations`, seeded after the mint), so the Realm's edge
 * there is a second holder on one town, a shape no other writer produces and the shape
 * THR-1297 warns about (readers key on `getIncomingEdges(loc, 'controls')[0]?.source`).
 * The guild's own hall is the guild's; the Realm's redundant edge is dropped.
 *
 * **What this pass deliberately no longer does.** Before THR-1155 it also *moved* a
 * cultured Location's edge to the nearest same-culture definition-faction home within
 * `WORLDGEN_TERRITORY_MAX_HEXES`, and round-robined whatever was left over the
 * culture list. Both existed because the holder it was moving away from was one of two
 * or three generically-named factions that no system could see — moving the ground to a
 * guild at least gave it a holder that meant something. Measured on seed 42 medium, that
 * reach took **37 of the 40** Locations inside a domain, which under this plan is a
 * merchants' guild holding a kingdom's towns and a nation with three. A Realm is the
 * political holder; a guild holds its hall.
 *
 * @returns how many Realm edges were dropped as redundant.
 */
export function retargetTerritoryByProvince(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  _k: LivingWorldConstants,
): number {
  const realmFactions = new Set(ctx.factionIds);
  if (realmFactions.size === 0) return 0;

  const definitionFactions = new Set(ctx.factionDefIds);

  let dropped = 0;
  for (const locId of [...ctx.locationCultureMap.keys()].sort()) {
    const controlEdges = graph.getIncomingEdges(locId, 'controls').slice().sort(byId);
    const realmEdge = controlEdges.find(e => realmFactions.has(e.source));
    if (!realmEdge) continue;

    const heldByDefinition = controlEdges.some(
      e => e.id !== realmEdge.id && definitionFactions.has(e.source),
    );
    if (!heldByDefinition) continue;

    const lostSeat = realmEdge.properties.role === 'seat';
    graph.removeEdge(realmEdge.id);
    dropped++;
    // The Realm may have been seated on the very town the guild's hall stands in.
    // Re-seat it rather than leave a court with no hall it still holds.
    if (lostSeat) stampRealmSeat(graph, realmEdge.source);
  }
  return dropped;
}

// ─── W3 — trade routes ─────────────────────────────────────────────────────

/**
 * A lane from each culture's seat to its nearest settlements, minted by the op the
 * `found × Route` cell uses, then given the identity node THR-1436 mints.
 *
 * Unowned by design: a lane nobody holds is exactly what `claim × Route` is for.
 */
export function seedTradeRoutes(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): number {
  if (k.WORLDGEN_TRADE_ROUTES_PER_CULTURE <= 0) return 0;

  let minted = 0;
  for (const cultureId of [...ctx.cultureIds].sort()) {
    const capitalId = findCapital(graph, ctx, cultureId);
    if (!capitalId) continue;
    const capitalHex = hexOf(graph, capitalId);
    if (!capitalHex) continue;

    const candidates: Array<{ id: string; distance: number }> = [];
    for (const locId of locationsOfCulture(ctx, cultureId)) {
      if (locId === capitalId) continue;
      if (!SETTLEMENT_SUBTYPES.has(subtypeOf(graph.getNode(locId)))) continue;
      const hex = hexOf(graph, locId);
      if (!hex) continue;
      const distance = hexDistance(capitalHex, hex);
      if (distance > k.WORLDGEN_TRADE_ROUTE_MAX_HEXES) continue;
      candidates.push({ id: locId, distance });
    }
    // Nearest first, id tie-break.
    candidates.sort((a, b) => a.distance - b.distance || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    for (const partner of candidates.slice(0, k.WORLDGEN_TRADE_ROUTES_PER_CULTURE)) {
      let result;
      try {
        result = createTradeRoute(graph, capitalId, partner.id, 'worldgen', 0);
      } catch {
        continue; // per-item fail-soft
      }
      if (!result.success) continue; // e.g. route_already_exists — skip the pair
      minted++;
      try {
        mintRouteIdentity(graph, capitalId, partner.id, result.createdId, 'worldgen', 0);
      } catch {
        // The edge stands; it is counted as a lane, not as a Route object.
      }
    }
  }
  return minted;
}

// ─── W4 — freeholds ────────────────────────────────────────────────────────

/**
 * A gold-, stone- or heart-leaning protagonist holds a Place at home — or, when home
 * has none to hold, in the nearest settlement that does.
 *
 * Through `grantHolding` with `via: 'creation'`, so the holding face artifact the
 * sheet reads is minted exactly as it is for a claimed freehold — the seeded holder
 * is not a special case anywhere downstream.
 *
 * **Why the settlement fallback (THR-1588).** Protagonists are placed by a uniform draw
 * over *every* Location, and only settlements carry commerce or authority Places. So a
 * protagonist living at a tower, an ancient road or a point of interest had nothing to
 * hold, and whether seed 42 minted any freehold at all came down to where four draws
 * happened to land: 8 at the THR-1437 closeout, 0 once THR-1155's Realm mint shifted the
 * worldgen stream. A mortal who lives out by the old road and keeps a stall in the
 * nearest town is ordinary; a merchant with no stake anywhere because of where the dice
 * put their bed is not. The reach gate is untouched — it says *who* holds property, and
 * that was never what drifted.
 */
export function seedFreeholds(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): number {
  if (k.WORLDGEN_FREEHOLDS_PER_SPOTLIGHT <= 0) return 0;

  const wantedClasses = new Set<string>(k.WORLDGEN_FREEHOLD_PLACE_CLASSES);
  const wantedReaches = new Set<string>(k.WORLDGEN_FREEHOLD_LEADING_REACHES);

  // Eligible Places by parent Location, sorted by id — built once, read per mortal.
  const placesByParent = new Map<string, GraphNode[]>();
  for (const n of graph.getNodesByType('location')) {
    const parent = n.properties.parentLocationId;
    if (typeof parent !== 'string') continue;
    if (!wantedClasses.has(placeClassOf(n.properties.sublocationTypeId as string | undefined) ?? '')) continue;
    const list = placesByParent.get(parent) ?? [];
    list.push(n);
    placesByParent.set(parent, list);
  }
  for (const list of placesByParent.values()) list.sort(byId);

  // Settlements that carry at least one eligible Place — the fallback's candidates.
  const settlements = graph.getNodesByType('location')
    .filter(n => SETTLEMENT_SUBTYPES.has(subtypeOf(n)) && placesByParent.has(n.id))
    .sort(byId);

  const unheld = (place: GraphNode): boolean => graph.getIncomingEdges(place.id, 'owns').length === 0;

  /** Home first; then settlements within reach, nearest first, id tie-break. */
  const candidateLocations = (homeId: string): string[] => {
    const out = [homeId];
    const homeHex = hexOf(graph, homeId);
    if (!homeHex) return out;
    const near: Array<{ id: string; distance: number }> = [];
    for (const s of settlements) {
      if (s.id === homeId) continue;
      const hex = hexOf(graph, s.id);
      if (!hex) continue;
      const distance = hexDistance(homeHex, hex);
      if (distance > k.WORLDGEN_FREEHOLD_SETTLEMENT_MAX_HEXES) continue;
      near.push({ id: s.id, distance });
    }
    near.sort((a, b) => a.distance - b.distance || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return [...out, ...near.map(n => n.id)];
  };

  let granted = 0;
  for (const mortal of collectSpotlightMortals(graph, ctx.individualIds)) {
    const reach = leadingReach(mortal);
    if (!reach || !wantedReaches.has(reach)) continue;
    const homeId = homeLocationOf(graph, mortal.id);
    if (!homeId) continue;

    let held = 0;
    for (const locId of candidateLocations(homeId)) {
      if (held >= k.WORLDGEN_FREEHOLDS_PER_SPOTLIGHT) break;
      for (const place of (placesByParent.get(locId) ?? []).filter(unheld)) {
        if (held >= k.WORLDGEN_FREEHOLDS_PER_SPOTLIGHT) break;
        try {
          const result = grantHolding(graph, mortal.id, place.id, { tick: 0 }, 'creation');
          if (result.success) { granted++; held++; }
        } catch {
          // Per-item fail-soft: one unheld Place costs a stake, never the world.
        }
      }
    }
  }
  return granted;
}

// ─── W5 — possessions ──────────────────────────────────────────────────────

const TIER_ONE_POSSESSIONS: readonly GraphNode[] = [...REWARD_POSSESSIONS]
  .filter(n => n.properties.tier === 1)
  .sort(byId);

/**
 * Every protagonist carries something.
 *
 * The hand-seeded starters count toward the quota, so `ind_0`…`ind_6` — who already
 * hold a blade, a horse, a cloak — are untouched. The pick is the first tier-1 catalog
 * template tagged with the holder's leading Reach, else the first tier-1 template.
 */
export function seedPossessions(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): number {
  if (k.WORLDGEN_POSSESSIONS_PER_SPOTLIGHT <= 0) return 0;

  let minted = 0;
  for (const mortal of collectSpotlightMortals(graph, ctx.individualIds)) {
    let held = graph.getOutgoingEdges(mortal.id, 'possesses').length;
    if (held >= k.WORLDGEN_POSSESSIONS_PER_SPOTLIGHT) continue;

    const reachTag = `#${leadingReach(mortal) ?? ''}`;
    const tagged = TIER_ONE_POSSESSIONS.filter(t =>
      Array.isArray(t.properties.tags) && (t.properties.tags as string[]).includes(reachTag));
    // Tagged first, then the rest — so the fallback is "the first tier-1 template by id".
    const order = [...tagged, ...TIER_ONE_POSSESSIONS.filter(t => !tagged.includes(t))];

    for (const template of order) {
      if (held >= k.WORLDGEN_POSSESSIONS_PER_SPOTLIGHT) break;
      if (!graph.getNode(template.id)) continue; // catalog node absent — nothing to clone
      try {
        const result = instantiateReward(graph, template.id, mortal.id, 0);
        if (!result) continue;
        held++;
        minted++;
      } catch {
        // Per-item fail-soft.
      }
    }
  }
  return minted;
}

// ─── S1 — the people web (THR-1630) ────────────────────────────────────────

/**
 * The settlement whose people a named hero is tied to: home, when home is a settlement;
 * otherwise the nearest settlement of home's culture within
 * `WORLDGEN_TIE_FALLBACK_MAX_HEXES` (any culture, when home has none), id tie-break.
 *
 * Half the deciders live at towers, ruins and roadside places (plan § Re-measured, 4),
 * so the fallback is load-bearing. `undefined` = no pool; the hero gets no ties.
 */
export function tiePoolSettlementOf(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
  actorId: string,
): string | undefined {
  const homeId = homeLocationOf(graph, actorId);
  if (!homeId) return undefined;
  if (SETTLEMENT_SUBTYPES.has(subtypeOf(graph.getNode(homeId)))) return homeId;

  const homeHex = hexOf(graph, homeId);
  if (!homeHex) return undefined;
  const homeCulture = ctx.locationCultureMap.get(homeId)?.cultureId;

  let best: { id: string; distance: number } | undefined;
  for (const n of graph.getNodesByType('location')) {
    if (!SETTLEMENT_SUBTYPES.has(subtypeOf(n))) continue;
    if (typeof n.properties.parentLocationId === 'string') continue;
    if (homeCulture && ctx.locationCultureMap.get(n.id)?.cultureId !== homeCulture) continue;
    const hex = hexOf(graph, n.id);
    if (!hex) continue;
    const distance = hexDistance(homeHex, hex);
    if (distance > k.WORLDGEN_TIE_FALLBACK_MAX_HEXES) continue;
    if (!best || distance < best.distance || (distance === best.distance && n.id < best.id)) {
      best = { id: n.id, distance };
    }
  }
  return best?.id;
}

/** Individuals standing in `settlementId` or any of its Places, monsters excluded, sorted by id. */
function residentsOf(graph: WorldGraph, settlementId: string): GraphNode[] {
  const out: GraphNode[] = [];
  const seen = new Set<string>();
  const collect = (locId: string): void => {
    for (const e of graph.getIncomingEdges(locId, 'located_at')) {
      if (seen.has(e.source)) continue;
      const node = graph.getNode(e.source);
      if (!node || node.type !== 'actor' || node.properties.actorType !== 'individual') continue;
      if (isMonster(node) || node.properties.alive === false) continue;
      seen.add(e.source);
      out.push(node);
    }
  };
  collect(settlementId);
  for (const place of graph.getNodesByType('location')) {
    if (place.properties.parentLocationId === settlementId) collect(place.id);
  }
  return out.sort(byId);
}

function hasTieWith(graph: WorldGraph, a: string, b: string): boolean {
  return graph.getOutgoingEdges(a, 'relates_to').some(e => e.target === b)
    || graph.getOutgoingEdges(b, 'relates_to').some(e => e.target === a);
}

/** Write one seeded tie in both directions, stamped `origin: 'worldgen'`. `false` if it already exists. */
function writeSeededTie(
  graph: WorldGraph,
  a: string,
  b: string,
  basis: string,
  sentiment: number,
  strength: number,
  k: LivingWorldConstants,
): boolean {
  const forward = `edge_tie_${a}_${b}_${basis}`;
  const backward = `edge_tie_${b}_${a}_${basis}`;
  if (graph.getEdge(forward) || graph.getEdge(backward)) return false;
  const properties = {
    sentiment,
    strength,
    basis,
    trust: sentiment * k.WORLDGEN_TIE_TRUST_FROM_SENTIMENT,
    origin: 'worldgen',
  };
  graph.addEdge({ id: forward, source: a, target: b, type: 'relates_to', properties: { ...properties } });
  graph.addEdge({ id: backward, source: b, target: a, type: 'relates_to', properties: { ...properties } });
  return true;
}

export interface SeededTiesSummary {
  kin: number;
  friendship: number;
  rivalry: number;
  /** Heroes with no settlement home and none of their culture in reach. */
  protagonistsWithoutPool: string[];
}

/**
 * Each named hero gets one kin, one friend and one rival among the people of their
 * tie-pool settlement — protagonists count, so two heroes sharing a home tie to each
 * other first (THR-1594). Both directions, `origin: 'worldgen'`.
 *
 * The only pass here that draws: one `mulberry32(seed + prime)` stream, reserved in
 * `WORLDGEN_LIVING_PRIMES`, over candidate lists sorted by id (NFP #3). A pool too small
 * for all three fills kin, then rival, then friend.
 */
export function seedTies(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): SeededTiesSummary {
  const summary: SeededTiesSummary = { kin: 0, friendship: 0, rivalry: 0, protagonistsWithoutPool: [] };
  const prime = k.WORLDGEN_LIVING_PRIMES[WORLDGEN_TIES_PRIME_INDEX];
  if (typeof prime !== 'number') return summary;
  const rng = mulberry32(ctx.seed + prime);

  const between = (range: readonly [number, number]): number => range[0] + rng() * (range[1] - range[0]);

  for (const heroId of [...ctx.individualIds].sort()) {
    const hero = graph.getNode(heroId);
    if (!hero) continue;
    const poolId = tiePoolSettlementOf(graph, ctx, k, heroId);
    if (!poolId) { summary.protagonistsWithoutPool.push(heroId); continue; }

    const candidates = residentsOf(graph, poolId)
      .filter(n => n.id !== heroId && !hasTieWith(graph, heroId, n.id));

    const wants: Array<'kin' | 'friendship' | 'rivalry'> = [];
    const kin = Array<'kin'>(Math.max(0, k.WORLDGEN_KIN_PER_PROTAGONIST)).fill('kin');
    const friends = Array<'friendship'>(Math.max(0, k.WORLDGEN_FRIENDS_PER_PROTAGONIST)).fill('friendship');
    const rivals = Array<'rivalry'>(Math.max(0, k.WORLDGEN_RIVALS_PER_PROTAGONIST)).fill('rivalry');
    const total = kin.length + friends.length + rivals.length;
    // A full pool takes kin, friend, rival; a short one fills kin, then rival, then friend.
    if (candidates.length >= total) wants.push(...kin, ...friends, ...rivals);
    else wants.push(...[...kin, ...rivals, ...friends].slice(0, candidates.length));

    for (const basis of wants) {
      if (candidates.length === 0) break;
      const pick = candidates.splice(Math.floor(rng() * candidates.length), 1)[0];
      let sentiment: number;
      let strength: number;
      if (basis === 'kin') {
        sentiment = k.WORLDGEN_KIN_SENTIMENT;
        strength = k.WORLDGEN_KIN_STRENGTH;
      } else {
        sentiment = between(basis === 'friendship' ? k.WORLDGEN_FRIEND_SENTIMENT_RANGE : k.WORLDGEN_RIVAL_SENTIMENT_RANGE);
        strength = k.WORLDGEN_RANDOM_TIE_STRENGTH_MIN + rng() * k.WORLDGEN_RANDOM_TIE_STRENGTH_SPAN;
      }
      try {
        if (writeSeededTie(graph, heroId, pick.id, basis, sentiment, strength, k)) summary[basis]++;
      } catch {
        // Per-item fail-soft.
      }
    }
  }
  return summary;
}

export interface HomeStandingMove {
  actorId: string;
  fromFactionId: string;
  toFactionId: string;
}

/** The Realm holding a settlement through `controls`, lowest edge id first. */
function realmHolding(graph: WorldGraph, ctx: LivingWorldContext, settlementId: string): string | undefined {
  const realms = new Set(ctx.factionIds);
  return graph.getIncomingEdges(settlementId, 'controls')
    .filter(e => realms.has(e.source))
    .sort(byId)[0]?.source;
}

/**
 * A hero's starting membership moves to the Realm that holds their home (THR-1594's
 * "home-Realm standing" half; THR-1620 shipped the standing but drew the Realm at random).
 *
 * A post-pass rather than an edit to the draw in `seedWorld`, which would shift the shared
 * stream. Only a Realm membership the draw wrote moves, and only when home (or, failing
 * that, the hero's tie-pool settlement) is held by a *different* Realm; an unheld home
 * keeps what was drawn. The moved edge keeps its seeded
 * reputation and rank — THR-1620's standing, now at home.
 */
export function seedHomeStanding(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): HomeStandingMove[] {
  const moves: HomeStandingMove[] = [];
  const realms = new Set(ctx.factionIds);
  for (const heroId of [...ctx.individualIds].sort()) {
    const drawn = graph.getOutgoingEdges(heroId, 'member_of')
      .filter(e => realms.has(e.target) && e.properties.joinedTick === 0)
      .sort(byId)[0];
    if (!drawn) continue;
    // Home itself first — a hero at a Realm's fossil bed or tower is that Realm's — then
    // the settlement they are tied to.
    const homeId = homeLocationOf(graph, heroId);
    const poolId = tiePoolSettlementOf(graph, ctx, k, heroId);
    const home = (homeId ? realmHolding(graph, ctx, homeId) : undefined)
      ?? (poolId ? realmHolding(graph, ctx, poolId) : undefined);
    if (!home || home === drawn.target) continue;

    try {
      const carried = { ...drawn.properties };
      graph.removeEdge(drawn.id);
      const joined = joinFaction(graph, heroId, home, 0);
      if (!joined.changed || !joined.factionNodeId) continue;
      const edge = graph.getOutgoingEdges(heroId, 'member_of').find(e => e.target === joined.factionNodeId);
      if (!edge) continue;
      const factionDefId = graph.getNode(home)?.properties.factionDefId as string | undefined;
      graph.updateEdge(edge.id, {
        properties: {
          rank: carried.rank,
          reputation: carried.reputation,
          ...(factionDefId ? { factionDefId } : {}),
          lastFactionActivityTick: 0,
        },
      });
      moves.push({ actorId: heroId, fromFactionId: drawn.target, toFactionId: home });
    } catch {
      // Per-item fail-soft.
    }
  }
  return moves;
}

/**
 * Each hero with a faction owes a favour to the fellow member standing highest in it —
 * nearest home as the tiebreak, then id — plus a friendship pair when the two have no tie,
 * because `phaseSecretsFavors` drift reads a positive tie. An early-game hook: an unpaid
 * favour sours after 30 ticks and is forgiven at 81 (`FAVOR_MAX_AGE_TICKS`).
 */
export function seedFavors(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): number {
  if (k.WORLDGEN_FAVORS_PER_FACTION_PROTAGONIST <= 0) return 0;
  let written = 0;
  for (const heroId of [...ctx.individualIds].sort()) {
    const membership = graph.getOutgoingEdges(heroId, 'member_of').sort(byId)[0];
    if (!membership) continue;
    const factionId = membership.target;
    const homeHex = (() => { const h = homeLocationOf(graph, heroId); return h ? hexOf(graph, h) : undefined; })();

    const fellows = graph.getIncomingEdges(factionId, 'member_of')
      .filter(e => e.source !== heroId)
      .map(e => {
        const node = graph.getNode(e.source);
        const home = homeLocationOf(graph, e.source);
        const hex = home ? hexOf(graph, home) : undefined;
        return {
          node,
          reputation: typeof e.properties.reputation === 'number' ? e.properties.reputation : 0,
          distance: homeHex && hex ? hexDistance(homeHex, hex) : Number.POSITIVE_INFINITY,
        };
      })
      .filter((f): f is { node: GraphNode; reputation: number; distance: number } =>
        !!f.node && f.node.properties.actorType === 'individual' && !isMonster(f.node))
      .sort((a, b) => b.reputation - a.reputation || a.distance - b.distance || byId(a.node, b.node));

    let owed = 0;
    for (const fellow of fellows) {
      if (owed >= k.WORLDGEN_FAVORS_PER_FACTION_PROTAGONIST) break;
      try {
        if (!createFavorEdge(heroId, fellow.node.id, k.WORLDGEN_FAVOR_MAGNITUDE, 'worldgen', 0, graph)) continue;
        owed++;
        written++;
        if (!hasTieWith(graph, heroId, fellow.node.id)) {
          writeSeededTie(graph, heroId, fellow.node.id, 'friendship',
            k.WORLDGEN_FAVOR_FRIENDSHIP_SENTIMENT, k.WORLDGEN_FAVOR_FRIENDSHIP_STRENGTH, k);
        }
      } catch {
        // Per-item fail-soft.
      }
    }
  }
  return written;
}

// ─── W6 — quarrels ─────────────────────────────────────────────────────────

/**
 * A seeded rivalry deep enough to be a standing quarrel becomes a `hostile_to` pair.
 *
 * The cause is `'old_quarrel'`, deliberately **absent** from
 * `undertakingMotive.GRUDGE_PROVENANCE`: the motive gate must read a starting quarrel
 * as `rivalry` — which licenses lower, seize and destroy on *things* — and never as
 * `grudge`, which licenses the plot. A quarrel the world begins with is history, not
 * an unseen harm (THR-1383's seen-harm rule is untouched).
 */
export function seedQuarrels(
  graph: WorldGraph,
  _ctx: LivingWorldContext,
  k: LivingWorldConstants,
): number {
  let written = 0;
  for (const edge of graph.getEdgesByType('relates_to')) {
    const sentiment = edge.properties.sentiment;
    if (typeof sentiment !== 'number' || Number.isNaN(sentiment)) continue;
    if (sentiment > k.WORLDGEN_QUARREL_SENTIMENT_MAX) continue;

    const a = graph.getNode(edge.source);
    const b = graph.getNode(edge.target);
    if (a?.properties.actorType !== 'individual') continue;
    if (b?.properties.actorType !== 'individual') continue;

    try {
      if (writeGrudge(graph, edge.source, edge.target, 0, 'old_quarrel')) written++;
    } catch {
      // Per-item fail-soft.
    }
  }
  return written;
}

// ─── W7 — marks ────────────────────────────────────────────────────────────

/**
 * Protagonists know things about each other — `WORLDGEN_MARKS_PER_PROTAGONIST` per hero
 * (THR-1630; before, one per culture), within `WORLDGEN_SEEDED_MARKS_PER_CULTURE` per culture.
 *
 * Holder is the highest Shadow, subject the highest Eye among the rest — the two
 * capabilities the leverage economy is about, so the seeded pair is the pair the
 * systems would have made. Fewer than two protagonists in the culture → nothing.
 */
export function seedMarks(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): number {
  if (k.WORLDGEN_SEEDED_MARKS_PER_CULTURE <= 0) return 0;

  const mortals = collectSpotlightMortals(graph, ctx.individualIds);
  const cultureOf = new Map<string, string>();
  for (const mortal of mortals) {
    // THR-1630: a hero living off the settlement map belongs to the culture of the
    // settlement they are tied to — the same pool `seedTies` uses.
    const homeId = homeLocationOf(graph, mortal.id);
    const poolId = tiePoolSettlementOf(graph, ctx, k, mortal.id);
    const cultureId = (homeId ? ctx.locationCultureMap.get(homeId)?.cultureId : undefined)
      ?? (poolId ? ctx.locationCultureMap.get(poolId)?.cultureId : undefined);
    if (cultureId) cultureOf.set(mortal.id, cultureId);
  }

  // Every candidate pair per culture, in preference order: holders by Shadow, subjects by
  // Eye among the rest — the two capabilities the leverage economy is about.
  const pairsByCulture: Array<Array<[GraphNode, GraphNode]>> = [];
  for (const cultureId of [...ctx.cultureIds].sort()) {
    const members = mortals.filter(m => cultureOf.get(m.id) === cultureId);
    if (members.length < 2) continue;
    const byShadow = [...members].sort((a, b) =>
      capabilityOf(b, 'shadow') - capabilityOf(a, 'shadow') || byId(a, b));
    const byEye = [...members].sort((a, b) =>
      capabilityOf(b, 'eye') - capabilityOf(a, 'eye') || byId(a, b));
    const pairs: Array<[GraphNode, GraphNode]> = [];
    for (const holder of byShadow) {
      for (const subject of byEye) if (subject.id !== holder.id) pairs.push([holder, subject]);
    }
    pairsByCulture.push(pairs.slice(0, k.WORLDGEN_SEEDED_MARKS_PER_CULTURE));
  }
  if (pairsByCulture.length === 0) return 0;

  // THR-1630: the count is per hero (0.33 each, floored), at least one while any culture
  // holds two heroes. Taken in rounds across cultures so no one culture gets them all.
  const wanted = Math.max(1, Math.floor(k.WORLDGEN_MARKS_PER_PROTAGONIST * ctx.individualIds.length));

  let minted = 0;
  for (let round = 0; minted < wanted; round++) {
    let offered = false;
    for (const pairs of pairsByCulture) {
      if (minted >= wanted) break;
      const pair = pairs[round];
      if (!pair) continue;
      offered = true;
      try {
        const result = mintLeverageMark(
          graph, pair[0].id, pair[1].id,
          UNDERTAKING_DEFAULT_MARK_SECRET_TYPE, UNDERTAKING_DEFAULT_MARK_MAGNITUDE, 0,
        );
        if (result.success) minted++;
      } catch {
        // Per-item fail-soft.
      }
    }
    if (!offered) break;
  }
  return minted;
}

// ─── S2 — one notable in every settlement (THR-1654) ───────────────────────

export interface SeededNotablesSummary {
  notables: number;
  /** Settlement ids whose notable got no holding (no unheld Place). */
  notablesWithoutHolding: string[];
  /** Settlement ids whose notable got no old quarrel (no decider in reach, no other notable). */
  notablesWithoutQuarrel: string[];
  /** Settlement ids whose notable got no secret or favour (no decider in reach). */
  notablesWithoutLeverage: string[];
  /** Settlement ids with no ambient resident to promote. */
  settlementsWithoutResident: string[];
}

/** An ambient resident: an individual with no tier above ambient, no capabilities, no host. */
function isAmbientResident(node: GraphNode): boolean {
  const tier = node.properties.spotlightTier;
  if (tier !== undefined && tier !== 'ambient') return false;
  if (node.properties.domainCapabilities) return false;
  if (node.properties.armyState) return false;
  return true;
}

function wealthOfRole(node: GraphNode): number {
  const role = node.properties.npcRole;
  return typeof role === 'string' ? (ROLE_WEALTH[role] ?? DEFAULT_WEALTH) : DEFAULT_WEALTH;
}

/**
 * One resident of each settlement becomes a notable — the wealthiest role, id tie-break —
 * with a stake, an old quarrel and a secret or favour tied to a decider (THR-1593's t0
 * package). No ambition (0 of 10 templates pass eligibility for a hydrated notable) and no
 * `relates_to`, so importance stays 0 and seeding graduates nobody.
 *
 * Two loops: every notable is promoted first, then each is given its package, so the
 * quarrel fallback ("the nearest other settlement's notable") always has someone to name —
 * including for the settlement that sorts first.
 *
 * Draws only through `hydrateToTier` (archetype, values, capabilities), on its own reserved
 * stream; every choice of who and what is a sort (NFP #3).
 */
export function seedNotables(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): SeededNotablesSummary {
  const summary: SeededNotablesSummary = {
    notables: 0,
    notablesWithoutHolding: [],
    notablesWithoutQuarrel: [],
    notablesWithoutLeverage: [],
    settlementsWithoutResident: [],
  };
  const prime = k.WORLDGEN_LIVING_PRIMES[WORLDGEN_NOTABLES_PRIME_INDEX];
  if (typeof prime !== 'number') return summary;
  const rng = mulberry32(ctx.seed + prime);

  const settlements = graph.getNodesByType('location')
    .filter(n => typeof n.properties.parentLocationId !== 'string' && SETTLEMENT_SUBTYPES.has(subtypeOf(n)))
    .sort(byId);

  // ── 1. Promote ──
  const seeded: Array<{ settlementId: string; notableId: string; hex: HexCoord | undefined }> = [];
  for (const settlement of settlements) {
    const count = k.NOTABLES_PER_SETTLEMENT[subtypeOf(settlement)] ?? 0;
    if (count <= 0) continue;
    const residents = residentsOf(graph, settlement.id)
      .filter(isAmbientResident)
      .sort((a, b) => wealthOfRole(b) - wealthOfRole(a) || byId(a, b));
    if (residents.length === 0) { summary.settlementsWithoutResident.push(settlement.id); continue; }
    for (const resident of residents.slice(0, count)) {
      try {
        hydrateToTier(graph, resident.id, 'notable', rng);
        graph.updateNode(resident.id, { properties: { notableOrigin: NOTABLE_ORIGIN_WORLDGEN } });
        seeded.push({ settlementId: settlement.id, notableId: resident.id, hex: hexOf(graph, settlement.id) });
        summary.notables++;
      } catch {
        // Per-item fail-soft: a resident who cannot be promoted stays ambient.
      }
    }
  }

  // Deciders with a hex, nearest-first per query — sorted by id once so ties break by id.
  const deciders = collectSpotlightMortals(graph, ctx.individualIds)
    .filter(n => n.properties.alive !== false)
    .map(n => {
      const home = homeLocationOf(graph, n.id);
      return { id: n.id, hex: home ? hexOf(graph, home) : undefined };
    })
    .filter((d): d is { id: string; hex: HexCoord } => !!d.hex);
  const nearestDeciders = (from: HexCoord, maxHexes: number): string[] =>
    deciders
      .map(d => ({ id: d.id, distance: hexDistance(from, d.hex) }))
      .filter(d => d.distance <= maxHexes)
      .sort((a, b) => a.distance - b.distance || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map(d => d.id);

  // Unheld Places by parent settlement, in holding-preference order, then id.
  const preferred = k.WORLDGEN_NOTABLE_HOLDING_PLACE_CLASSES;
  const rankOf = (place: GraphNode): number => {
    const cls = placeClassOf(place.properties.sublocationTypeId as string | undefined) ?? '';
    const i = preferred.indexOf(cls as SublocationTag);
    return i < 0 ? preferred.length : i;
  };
  const placesOf = (settlementId: string): GraphNode[] =>
    graph.getNodesByType('location')
      .filter(n => n.properties.parentLocationId === settlementId)
      .filter(n => graph.getIncomingEdges(n.id, 'owns').length === 0)
      .sort((a, b) => rankOf(a) - rankOf(b) || byId(a, b));

  // ── 2. The package ──
  seeded.forEach((entry, index) => {
    const { settlementId, notableId, hex } = entry;

    // Holding — a Place in their own settlement nobody holds.
    let held = false;
    for (const place of placesOf(settlementId)) {
      try {
        if (grantHolding(graph, notableId, place.id, { tick: 0 }, 'creation').success) { held = true; break; }
      } catch {
        // Per-item fail-soft: try the next Place.
      }
    }
    if (!held) summary.notablesWithoutHolding.push(settlementId);

    // Old quarrel — the nearest decider in reach, else the nearest other seeded notable.
    let partner = hex ? nearestDeciders(hex, k.WORLDGEN_NOTABLE_QUARREL_MAX_HEXES)[0] : undefined;
    if (!partner && hex) {
      let best: { id: string; distance: number } | undefined;
      for (const other of seeded) {
        if (other.notableId === notableId || other.settlementId === settlementId || !other.hex) continue;
        const distance = hexDistance(hex, other.hex);
        if (!best || distance < best.distance || (distance === best.distance && other.notableId < best.id)) {
          best = { id: other.notableId, distance };
        }
      }
      partner = best?.id;
    }
    let quarrelled = false;
    if (partner) {
      try {
        // `'old_quarrel'` stays outside GRUDGE_PROVENANCE: the motive gate reads rivalry (THR-1383).
        quarrelled = writeGrudge(graph, notableId, partner, 0, 'old_quarrel')
          || graph.getOutgoingEdges(notableId, 'hostile_to').some(e => e.target === partner);
      } catch {
        // Per-item fail-soft.
      }
    }
    if (!quarrelled) summary.notablesWithoutQuarrel.push(settlementId);

    // Secret or favour with a decider — preferring one who is not the quarrel partner.
    // Even-indexed settlements: the notable knows something about the hero. Odd: the hero
    // owes the notable. The binder's story-tie term then casts the notable in that hero's scenes.
    const inReach = hex ? nearestDeciders(hex, k.WORLDGEN_NOTABLE_TIE_MAX_HEXES) : [];
    const decider = inReach.find(id => id !== partner) ?? inReach[0];
    let leveraged = false;
    if (decider) {
      try {
        leveraged = index % 2 === 0
          ? mintLeverageMark(graph, notableId, decider,
            UNDERTAKING_DEFAULT_MARK_SECRET_TYPE, k.WORLDGEN_NOTABLE_MARK_MAGNITUDE, 0).success
          : createFavorEdge(decider, notableId, k.WORLDGEN_NOTABLE_FAVOR_MAGNITUDE, 'worldgen', 0, graph);
      } catch {
        // Per-item fail-soft.
      }
    }
    if (!leveraged) summary.notablesWithoutLeverage.push(settlementId);

    // Faction — the holder of their settlement.
    const holder = graph.getIncomingEdges(settlementId, 'controls').slice().sort(byId)[0]?.source;
    if (holder) {
      try {
        joinFaction(graph, notableId, holder, 0);
      } catch {
        // Per-item fail-soft: an unaffiliated notable is still a notable.
      }
    }
  });

  return summary;
}

// ─── W8 — garrisons ────────────────────────────────────────────────────────

/**
 * A captain and a host at each culture's capital, on the mercenary-commander pattern.
 *
 * The ambition is the *faction's* (`resource_acquisition` — the faction-ambition union
 * has no `territory_defense`), and the army pursues it. The captain gets no ambition of
 * their own: a garrison's captain wants what the faction wants, and giving them a
 * second want would put two pursuers on one muster.
 *
 * The captain is a protagonist by construction — spotlight tier, capabilities, a name —
 * so `seedWorld` folds the ids into `individualIds`.
 */
export function seedGarrisons(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): { garrisons: number; captainIds: string[] } {
  const captainIds: string[] = [];
  if (k.WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE <= 0) return { garrisons: 0, captainIds };

  let garrisons = 0;
  for (const cultureId of [...ctx.cultureIds].sort()) {
    const capitalId = findCapital(graph, ctx, cultureId);
    if (!capitalId) continue;
    const capital = graph.getNode(capitalId);
    if (!capital) continue;

    // Whose garrison this is: the culture's **Realm**, where one exists (THR-1155).
    //
    // This pass predates Realms and read the controller off the capital's `controls`
    // edges, lowest id first — a proxy for "who holds this seat" that was the best
    // available when the holder was a nameless generic faction. It is now wrong twice
    // over on seed 42: the guild-hall reconciliation drops the Realm's edge at a
    // Location a definition faction calls home, so at two of the three capitals the
    // Realm holds no edge at all and the *only* remaining holder is the guild. The
    // captain of the capital's garrison therefore swore to the Arcane Circle at `loc_9`
    // and to the Temple of Spheres at `loc_1`, and each took the "hold the seat" army
    // with them — a library guild fielding a host to hold a nation's capital.
    //
    // A Realm is the political holder of its culture's ground whether or not a guild
    // keeps a hall on the seat, so the culture answers the question the edge was only
    // approximating. The edge rule stays as the fallback for a culture with no Realm
    // (a bare-`seedWorld` world with no domains — see the mint's legacy note).
    //
    // This is why it matters here rather than as a tidy-up: the captain carries
    // `WORLDGEN_GARRISON_CAPTAIN_IRON`, and ambient NPCs carry no `domainCapabilities`
    // at all, so the captain is the only member of a Realm's court who can clear
    // `ARMY_SPAWN_IRON_TIER_MIN`. Losing them to a guild is losing the Realm's only
    // possible commander.
    const realmId = graph.getNodesByType('actor').find(
      n => n.properties.factionClass === REALM_FACTION_CLASS
        && n.properties.cultureId === cultureId,
    )?.id;
    const controlEdge = graph.getIncomingEdges(capitalId, 'controls').slice().sort(byId)[0];
    const factionId = realmId ?? controlEdge?.source;
    if (!factionId || !graph.getNode(factionId)) continue;

    const captainId = `agent_garrison_${cultureId}`;
    if (graph.getNode(captainId)) continue; // already minted — never mint twice

    const factionNode = graph.getNode(factionId);
    const factionDefId = factionNode?.properties.factionDefId as string | undefined;

    try {
      graph.addNode({
        id: captainId,
        type: 'actor',
        name: `Captain of ${capital.name}`,
        properties: {
          actorType: 'individual',
          spotlightTier: 'spotlight' as const,
          domainCapabilities: {
            iron: k.WORLDGEN_GARRISON_CAPTAIN_IRON,
            gold: k.WORLDGEN_GARRISON_CAPTAIN_GOLD,
            shadow: 20,
            veil: 10,
            heart: 15,
            eye: 15,
            stone: 20,
            star: 10,
          },
          locationId: capitalId,
          displaced: false,
        },
      });
      captainIds.push(captainId);

      graph.addEdge({
        id: `e_located_at_${captainId}`,
        source: captainId,
        target: capitalId,
        type: 'located_at',
        properties: {},
      });

      graph.addEdge({
        id: `e_member_of_${captainId}`,
        source: captainId,
        target: factionId,
        type: 'member_of',
        properties: {
          role: 'commander',
          rank: 0.8,
          reputation: 0.9,
          ...(factionDefId ? { factionDefId } : {}),
          joinedTick: 0,
          lastFactionActivityTick: 0,
        },
      });

      // The garrison's ambition — the *host's*, not the faction's (THR-1155).
      //
      // This node exists because `spawnArmy` requires one to hang the army's own
      // `pursues` edge on. It used to be given to the faction as well, which was
      // harmless while exactly one faction per world held a garrison and wanted
      // nothing else. It stops being harmless the moment every Realm has one:
      // `phaseFactionAmbitions` scores a want only for a faction with **no** active
      // `pursues` edge, and this ambition carries `targetNodeId: null`, so it is never
      // abandoned — it is permanent by construction. Three garrisons would therefore
      // have pinned all three Realms to `resource_acquisition` for the life of the run
      // and locked every one of them out of `territorial_expansion`, which is the gate
      // the whole conquest path opens through. Measured: with the faction edge written,
      // no Realm held a territorial want at tick 150; without it, `faction_1` does.
      //
      // A garrison is a standing commitment, not a nation's want. The host keeps the
      // seat; what the Realm *wants* is scored from its definition like any faction's.
      const ambitionId = `amb_${factionId}_garrison`;
      if (!graph.getNode(ambitionId)) {
        graph.addNode({
          id: ambitionId,
          type: 'ambition',
          name: `${factionNode?.name ?? factionId} — hold the seat`,
          properties: {
            [AMBITION_KIND_KEY]: AMBITION_KIND_FACTION,
            ambitionType: 'resource_acquisition',
            priority: 0.5,
            targetNodeId: null,
            grievanceDecay: 0,
            createdTick: 0,
          },
        });
      }

      // `spawnArmy` derives its id from (faction, tick), so a faction that already
      // holds a host at tick 0 must not be asked for a second: the duplicate-id throw
      // lands in spawnArmy's own catch, which cleans up by removing *that* id — the
      // existing army. Guard rather than discover.
      const armyId = `army_${factionId}_0`;
      if (!graph.getNode(armyId)) {
        const spawned = spawnArmy({ graph, tick: 0 } as GameState, factionId, captainId, ambitionId);
        if (spawned) garrisons++;
      }
    } catch {
      // Per-culture fail-soft: a captain without a host is a mortal like any other.
    }
  }
  return { garrisons, captainIds };
}

// ─── Orchestration ─────────────────────────────────────────────────────────

/**
 * Run W2 → W8 in order. Each pass is independently caught: a throw is reported in
 * `failedPasses` and skips that pass only — the world stays valid (NFP #4).
 */
export function seedLivingWorld(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  overrides: Partial<LivingWorldConstants> = {},
): LivingWorldSummary {
  const k: LivingWorldConstants = { ...LIVING_WORLD_DEFAULTS, ...overrides };

  // Reserved PRNG streams — one per pass. None is drawn today (every choice below is a
  // sort); reserved so a later pass that *does* draw cannot perturb the streams already
  // in use. `void` is the reservation's only consumer, deliberately.
  const reservedStreams = k.WORLDGEN_LIVING_PRIMES.map(prime => mulberry32(ctx.seed + prime));
  void reservedStreams;

  const summary: LivingWorldSummary = {
    territoryRetargeted: 0,
    routes: 0,
    freeholds: 0,
    possessions: 0,
    ties: { kin: 0, friendship: 0, rivalry: 0, protagonistsWithoutPool: [] },
    homeStandingMoves: [],
    favors: 0,
    quarrels: 0,
    marks: 0,
    notables: {
      notables: 0,
      notablesWithoutHolding: [],
      notablesWithoutQuarrel: [],
      notablesWithoutLeverage: [],
      settlementsWithoutResident: [],
    },
    garrisons: 0,
    captainIds: [],
    failedPasses: [],
  };

  const run = (label: string, pass: () => void): void => {
    try {
      pass();
    } catch (e) {
      summary.failedPasses.push(label);
      console.warn(`[WorldGen] Living world pass "${label}" failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  run('territory', () => { summary.territoryRetargeted = retargetTerritoryByProvince(graph, ctx, k); });
  run('routes', () => { summary.routes = seedTradeRoutes(graph, ctx, k); });
  run('freeholds', () => { summary.freeholds = seedFreeholds(graph, ctx, k); });
  run('possessions', () => { summary.possessions = seedPossessions(graph, ctx, k); });
  // THR-1630: ties before quarrels, so a deep seeded rivalry still becomes an old quarrel;
  // home standing before favours, so the favour is owed inside the faction the hero ends in.
  run('ties', () => { summary.ties = seedTies(graph, ctx, k); });
  run('home standing', () => { summary.homeStandingMoves = seedHomeStanding(graph, ctx, k); });
  run('favors', () => { summary.favors = seedFavors(graph, ctx, k); });
  run('quarrels', () => { summary.quarrels = seedQuarrels(graph, ctx, k); });
  run('marks', () => { summary.marks = seedMarks(graph, ctx, k); });
  // THR-1654: after quarrels and marks (a notable's quarrel partner may be a hero), before
  // garrisons (a captain is minted with a capital already holding its notable).
  run('notables', () => { summary.notables = seedNotables(graph, ctx, k); });
  run('garrisons', () => {
    const result = seedGarrisons(graph, ctx, k);
    summary.garrisons = result.garrisons;
    summary.captainIds = result.captainIds;
  });

  return summary;
}

/** The one console line the pass reports itself with — checked against the census, never trusted. */
export function formatLivingWorldSummary(s: LivingWorldSummary): string {
  const base = `[WorldGen] Living world: realm edges dropped at guild halls ${s.territoryRetargeted}`
    + ` · routes ${s.routes} · freeholds ${s.freeholds} · possessions ${s.possessions}`
    + ` · ties kin ${s.ties.kin}/friend ${s.ties.friendship}/rival ${s.ties.rivalry}`
    + ` (no pool ${s.ties.protagonistsWithoutPool.length}) · home-realm moves ${s.homeStandingMoves.length}`
    + ` · favours ${s.favors}`
    + ` · quarrels ${s.quarrels} · marks ${s.marks}`
    + ` · notables ${s.notables.notables} (no holding ${s.notables.notablesWithoutHolding.length}`
    + ` / no quarrel ${s.notables.notablesWithoutQuarrel.length}`
    + ` / no secret-or-favour ${s.notables.notablesWithoutLeverage.length}`
    + ` / no resident ${s.notables.settlementsWithoutResident.length})`
    + ` · garrisons ${s.garrisons}`;
  return s.failedPasses.length > 0 ? `${base} · failed: ${s.failedPasses.join(', ')}` : base;
}
