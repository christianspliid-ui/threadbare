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
 * Seven passes (W2…W8), run in order after every existing seed step. Each:
 *   - is guarded by its own constant (`0` — or `'round_robin'` for territory — disables it),
 *   - reuses the writer the in-run system already uses (no second spelling of anything),
 *   - is wrapped in its own try/catch, so a throwing pass is reported and skipped
 *     rather than invalidating the world (NFP #4), with per-item fail-soft inside,
 *   - chooses by sorting, never by drawing (NFP #3).
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
import { spawnArmy } from './armySpawning';
import { REWARD_POSSESSIONS } from '../data/reward-attachment-catalog';
import {
  UNDERTAKING_DEFAULT_MARK_SECRET_TYPE,
  UNDERTAKING_DEFAULT_MARK_MAGNITUDE,
} from '../data/strategic-action-constants';
import { AMBITION_KIND_FACTION, AMBITION_KIND_KEY } from './ambitionShape';
import {
  LIVING_WORLD_DEFAULTS,
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
  quarrels: number;
  marks: number;
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
 * A gold-, stone- or heart-leaning protagonist holds a Place at home.
 *
 * Through `grantHolding` with `via: 'creation'`, so the holding face artifact the
 * sheet reads is minted exactly as it is for a claimed freehold — the seeded holder
 * is not a special case anywhere downstream.
 */
export function seedFreeholds(
  graph: WorldGraph,
  ctx: LivingWorldContext,
  k: LivingWorldConstants,
): number {
  if (k.WORLDGEN_FREEHOLDS_PER_SPOTLIGHT <= 0) return 0;

  const wantedClasses = new Set<string>(k.WORLDGEN_FREEHOLD_PLACE_CLASSES);
  const wantedReaches = new Set<string>(k.WORLDGEN_FREEHOLD_LEADING_REACHES);
  let granted = 0;

  for (const mortal of collectSpotlightMortals(graph, ctx.individualIds)) {
    const reach = leadingReach(mortal);
    if (!reach || !wantedReaches.has(reach)) continue;
    const homeId = homeLocationOf(graph, mortal.id);
    if (!homeId) continue;

    const places = graph.getNodesByType('location')
      .filter(n =>
        n.properties.parentLocationId === homeId
        && wantedClasses.has(placeClassOf(n.properties.sublocationTypeId as string | undefined) ?? '')
        && graph.getIncomingEdges(n.id, 'owns').length === 0)
      .sort(byId);

    for (const place of places.slice(0, k.WORLDGEN_FREEHOLDS_PER_SPOTLIGHT)) {
      try {
        const result = grantHolding(graph, mortal.id, place.id, { tick: 0 }, 'creation');
        if (result.success) granted++;
      } catch {
        // Per-item fail-soft: one unheld Place costs a stake, never the world.
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
 * One protagonist of each culture knows something about another.
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
    const homeId = homeLocationOf(graph, mortal.id);
    const cultureId = homeId ? ctx.locationCultureMap.get(homeId)?.cultureId : undefined;
    if (cultureId) cultureOf.set(mortal.id, cultureId);
  }

  let minted = 0;
  for (const cultureId of [...ctx.cultureIds].sort()) {
    const members = mortals.filter(m => cultureOf.get(m.id) === cultureId);
    if (members.length < 2) continue;

    const byShadow = [...members].sort((a, b) =>
      capabilityOf(b, 'shadow') - capabilityOf(a, 'shadow') || byId(a, b));
    const holder = byShadow[0];
    const subjects = members
      .filter(m => m.id !== holder.id)
      .sort((a, b) => capabilityOf(b, 'eye') - capabilityOf(a, 'eye') || byId(a, b));

    for (const subject of subjects.slice(0, k.WORLDGEN_SEEDED_MARKS_PER_CULTURE)) {
      try {
        const result = mintLeverageMark(
          graph, holder.id, subject.id,
          UNDERTAKING_DEFAULT_MARK_SECRET_TYPE, UNDERTAKING_DEFAULT_MARK_MAGNITUDE, 0,
        );
        if (result.success) minted++;
      } catch {
        // Per-item fail-soft.
      }
    }
  }
  return minted;
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

    // The controller *after* W2 — lowest edge id when a capital somehow carries two.
    const controlEdge = graph.getIncomingEdges(capitalId, 'controls').slice().sort(byId)[0];
    const factionId = controlEdge?.source;
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

      // The faction's ambition, shared when one faction holds two capitals.
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
        graph.addEdge({
          id: `e_pursues_${factionId}_garrison`,
          source: factionId,
          target: ambitionId,
          type: 'pursues',
          properties: { priority: 0.5, status: 'active', milestones: [] },
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
    quarrels: 0,
    marks: 0,
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
  run('quarrels', () => { summary.quarrels = seedQuarrels(graph, ctx, k); });
  run('marks', () => { summary.marks = seedMarks(graph, ctx, k); });
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
    + ` · quarrels ${s.quarrels} · marks ${s.marks} · garrisons ${s.garrisons}`;
  return s.failedPasses.length > 0 ? `${base} · failed: ${s.failedPasses.join(', ')}` : base;
}
