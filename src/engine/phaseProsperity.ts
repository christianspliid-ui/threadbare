/**
 * Phase: Settlement Prosperity — Equilibrium Model
 *
 * Prosperity (0–100) drifts toward an equilibrium TARGET defined by current
 * conditions (trade routes, faction presence, corruption, unrest, divine
 * influence, sphere affinity). If nothing changes, prosperity stays put.
 * Growth and decline always trace to a visible cause.
 *
 * Two inputs each tick:
 *   1. **Equilibrium drift** — prosperity moves toward target at DRIFT_RATE
 *   2. **Shocks** — one-time deltas from discrete events (route lost, raid,
 *      divine blessing) pushed by upstream phases via state.prosperityShocks
 *
 * Resources define carrying capacity (the ceiling), not passive growth.
 * Cities/capitals have upkeep — they decay without active support.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * NFP: Tunability (named constants), Inspectability (full trace breakdown),
 *       Determinism (no PRNG), Fail-soft (all inputs default safely)
 */

import type { GameState, ProsperityShock } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { HexTile } from '../types/index';
import type { ResourceInstance } from '../types/resource';
import type { SphereAffinity, SpherePressureEvent } from '../types/sphereAffinity';
import { emitTrace } from './traceBuffer';
import { getNodeSphereAffinity } from './sphereAffinity';
import { IDENTITY_PROSPERITY_MODIFIER_CAP } from '../types/doomIdentity';
import {
  LOC_HEALTH_DEFAULT_BASELINE,
  LOC_HEALTH_RECOVERY_RATE,
  LOC_HEALTH_PROSPERITY_DAMPENER,
  LOC_HEALTH_DAMPENER_THRESHOLD,
  LOC_PRESENCE_DECAY_RATE,
  LOC_PRESENCE_PROSPERITY_BONUS,
  LOC_PRESENCE_PROSPERITY_THRESHOLD,
} from '../data/location-action-constants';

// ─── Tier Constants ──────────────────────────────────────────────────────────

/** Prosperity threshold for "Flourishing" prose / promotion eligibility */
export const PROSPERITY_TIER_FLOURISHING = 80;

/** Prosperity threshold for "Prosperous" prose / passive wealth generation */
export const PROSPERITY_TIER_PROSPEROUS = 60;

/** Prosperity threshold for "Modest" prose / Market District spawn */
export const PROSPERITY_TIER_MODEST = 40;

/** Prosperity threshold for "Struggling" prose / sublocation dissolution / demotion */
export const PROSPERITY_TIER_STRUGGLING = 20;

// ─── Promotion Constants (consumed by phaseSettlementPromotion) ──────────────

/** Sustained prosperity required for hamlet→town→city promotion */
export const SETTLEMENT_PROMOTION_PROSPERITY = 70;

/** Ticks prosperity must stay above SETTLEMENT_PROMOTION_PROSPERITY to trigger promotion */
export const SETTLEMENT_PROMOTION_SUSTAIN_TICKS = 20;

/** Sustained low prosperity required for city→town→hamlet demotion */
export const SETTLEMENT_DEMOTION_PROSPERITY = 20;

// ─── Population Constants ────────────────────────────────────────────────────

/** Minimum population lag ticks (seeded per settlement at creation via PRNG) */
export const POPULATION_LAG_TICKS_MIN = 1;

/** Maximum population lag ticks (seeded per settlement at creation via PRNG) */
export const POPULATION_LAG_TICKS_MAX = 3;

// ─── Equilibrium Constants ───────────────────────────────────────────────────

/** Max absolute prosperity change per tick (drift + shocks combined) */
export const PROSPERITY_DELTA_CLAMP = 2;

/** Rate at which prosperity drifts toward its target each tick (0–1) */
export const PROSPERITY_DRIFT_RATE = 0.05;

/** Minimum drift magnitude — if drift would be nonzero but below this, snap to this */
export const PROSPERITY_DRIFT_MIN = 0.1;

// ─── Equilibrium Target Components ──────────────────────────────────────────

/** Prosperity gain per active trades_with edge, scaled by normalised volume */
export const PROSPERITY_TRADE_BONUS_PER_ROUTE = 8;

/** Bonus to target per faction with located_at edge at this settlement */
export const FACTION_PRESENCE_BONUS = 5;

/** Cap on total faction presence bonus */
export const FACTION_PRESENCE_MAX_BONUS = 15;

/** Multiplier: corruption above threshold reduces target */
export const CORRUPTION_TARGET_RATE = 20;

/** Corruption level above which target is penalised */
export const CORRUPTION_TARGET_THRESHOLD = 0.2;

/** Cap on corruption-driven target reduction */
export const CORRUPTION_TARGET_MAX_PENALTY = 25;

/** Multiplier: divine influence above threshold increases target */
export const DIVINE_TARGET_RATE = 15;

/** Divine influence level above which target is boosted */
export const DIVINE_TARGET_THRESHOLD = 0.3;

/** Cap on divine-influence-driven target boost */
export const DIVINE_TARGET_MAX_BONUS = 15;

/** Unrest above this level reduces the target */
export const UNREST_TARGET_THRESHOLD = 30;

/** Multiplier: unrest above threshold reduces target */
export const UNREST_TARGET_RATE = 0.3;

/** Cap on unrest-driven target reduction */
export const UNREST_TARGET_MAX_PENALTY = 20;

// ─── Carrying Capacity ──────────────────────────────────────────────────────

/** Floor — every settlement can sustain at least this much prosperity */
export const BASE_CARRYING_CAPACITY = 30;

/** Per point of baseIncome adds to carrying capacity */
export const RESOURCE_CAPACITY_RATE = 0.5;

/** Hard cap on carrying capacity */
export const MAX_CARRYING_CAPACITY = 100;

// ─── Upkeep (large settlements only) ────────────────────────────────────────

/** Per-tick target reduction for cities (requires active support to sustain) */
export const UPKEEP_CITY = 5;

/** Per-tick target reduction for capitals */
export const UPKEEP_CAPITAL = 8;

// ─── Sphere Modifier Constants ───────────────────────────────────────────────

/** Prosperity target bonus per point of Life sphere score at the location */
export const PROSPERITY_LIFE_BONUS = 0.02;

/** Prosperity target bonus per point of Energy sphere score at the location */
export const PROSPERITY_ENERGY_BONUS = 0.015;

/** Prosperity target penalty per point of Entropy sphere score at the location */
export const PROSPERITY_ENTROPY_PENALTY = 0.025;

/** Maximum (and minimum negative) sphere modifier to equilibrium target (as 0–1 fraction) */
export const PROSPERITY_SPHERE_CAP = 0.15;

// ─── Shock Constants (used by upstream phases when pushing shocks) ───────────

/** Prosperity shock when a trade route is established */
export const SHOCK_TRADE_ROUTE_ESTABLISHED = 3;

/** Prosperity shock when a trade route dissolves */
export const SHOCK_TRADE_ROUTE_LOST = -3;

/** Prosperity shock when a trade route is threatened */
export const SHOCK_TRADE_ROUTE_THREATENED = -1.5;

/** Prosperity shock when a trade route threat is cleared */
export const SHOCK_TRADE_ROUTE_SECURED = 1;

/** Prosperity shock when a faction establishes presence */
export const SHOCK_FACTION_ARRIVAL = 2;

/** Prosperity shock when a faction departs */
export const SHOCK_FACTION_DEPARTURE = -2;

// ─── Types ───────────────────────────────────────────────────────────────────

/** Prosperity tier label — used for prose hooks and player-facing descriptions */
export type ProsperityTier = 'Flourishing' | 'Prosperous' | 'Modest' | 'Struggling' | 'Destitute';

/** Population trend label — follows prosperity with a lag */
export type PopulationTrend = 'growing' | 'stable' | 'declining' | 'collapsing';

/** Settlement locationSubtype values that participate in prosperity calculations */
const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a numeric prosperity value (0–100) to its tier label.
 * Exported for use in prose resolvers and UI.
 */
export function getProsperityTier(prosperity: number): ProsperityTier {
  if (prosperity >= PROSPERITY_TIER_FLOURISHING) return 'Flourishing';
  if (prosperity >= PROSPERITY_TIER_PROSPEROUS) return 'Prosperous';
  if (prosperity >= PROSPERITY_TIER_MODEST) return 'Modest';
  if (prosperity >= PROSPERITY_TIER_STRUGGLING) return 'Struggling';
  return 'Destitute';
}

/** Derive population trend from prosperity tier. */
function getPopulationTrend(tier: ProsperityTier): PopulationTrend {
  switch (tier) {
    case 'Flourishing': return 'growing';
    case 'Prosperous': return 'stable';
    case 'Modest': return 'stable';
    case 'Struggling': return 'declining';
    case 'Destitute': return 'collapsing';
  }
}

/**
 * Compute base income from location resources.
 * Used for carrying capacity calculation, NOT direct prosperity growth.
 * Fail-soft: missing or malformed resources → 0.
 */
export function computeBaseIncome(props: Record<string, unknown>): number {
  const resources = props.resources as Record<string, ResourceInstance> | undefined;
  if (!resources || typeof resources !== 'object') return 0;
  return Object.values(resources).reduce((sum, r) => {
    if (r && typeof r.quantity === 'number' && typeof r.renewalRate === 'number') {
      return sum + r.quantity * r.renewalRate;
    }
    return sum;
  }, 0);
}

/**
 * Compute carrying capacity — the maximum prosperity this location can sustain.
 * Based on local resources. A settlement can't grow beyond what the land supports.
 */
function computeCarryingCapacity(props: Record<string, unknown>): number {
  const baseIncome = computeBaseIncome(props);
  return Math.min(MAX_CARRYING_CAPACITY, BASE_CARRYING_CAPACITY + baseIncome * RESOURCE_CAPACITY_RATE);
}

/**
 * THR-401: check whether a location currently has cursed roads — used to
 * zero out trade-route contributions while the curse is active.
 */
function isLocationRoutesCursed(props: Record<string, unknown> | undefined, currentTick: number): boolean {
  const until = props?.routesCursedUntilTick;
  return typeof until === 'number' && currentTick < until;
}

/**
 * Count active (non-threatened) trade routes at a location.
 * Returns { activeRoutes, totalTradeBonus }.
 *
 * THR-401: if either endpoint of a trade route has `routesCursedUntilTick`
 * active at currentTick, the route contributes 0 to either endpoint's
 * prosperity. Cursed status is checked per-route via the source/target node.
 */
function computeTradeTarget(graph: WorldGraph, locationId: string, currentTick: number): { activeRoutes: number; tradeBonus: number; cursedRoutesSkipped: number } {
  const actorEdges = graph.getIncomingEdges(locationId, 'located_at');
  if (actorEdges.length === 0) return { activeRoutes: 0, tradeBonus: 0, cursedRoutesSkipped: 0 };

  // THR-401: if this settlement's roads are cursed, all routes zero out.
  const ownLocation = graph.getNode(locationId);
  if (ownLocation && isLocationRoutesCursed(ownLocation.properties, currentTick)) {
    // Still count routes for trace fidelity, but contribute 0 bonus.
    let cursedRoutesSkipped = 0;
    const seenEdgesLocal = new Set<string>();
    for (const actorEdge of actorEdges) {
      const tradeEdges = graph.getOutgoingEdges(actorEdge.source, 'trades_with');
      for (const edge of tradeEdges) {
        const edgeKey = [edge.source, edge.target].sort().join(':');
        if (seenEdgesLocal.has(edgeKey)) continue;
        seenEdgesLocal.add(edgeKey);
        if (edge.properties?.threatened === true) continue;
        cursedRoutesSkipped++;
      }
    }
    return { activeRoutes: 0, tradeBonus: 0, cursedRoutesSkipped };
  }

  const seenEdges = new Set<string>();
  let totalBonus = 0;
  let activeRoutes = 0;
  let cursedRoutesSkipped = 0;

  for (const actorEdge of actorEdges) {
    const actorId = actorEdge.source;
    const tradeEdges = graph.getOutgoingEdges(actorId, 'trades_with');
    for (const edge of tradeEdges) {
      const edgeKey = [edge.source, edge.target].sort().join(':');
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      // Threatened routes don't contribute to equilibrium target
      if (edge.properties?.threatened === true) continue;

      // THR-401: if the partner endpoint has cursed roads, skip too
      const partnerId = edge.source === actorId ? edge.target : edge.source;
      const partner = graph.getNode(partnerId);
      // partnerId is an actor; their location lives on a `located_at` edge
      const partnerLocEdge = partner ? graph.getOutgoingEdges(partner.id, 'located_at')[0] : undefined;
      const partnerLoc = partnerLocEdge ? graph.getNode(partnerLocEdge.target) : undefined;
      if (partnerLoc && isLocationRoutesCursed(partnerLoc.properties, currentTick)) {
        cursedRoutesSkipped++;
        continue;
      }

      const volume = typeof edge.properties?.volume === 'number' ? edge.properties.volume : 1;
      const normVolume = Math.min(Math.max(volume / 10, 0), 1);
      totalBonus += PROSPERITY_TRADE_BONUS_PER_ROUTE * normVolume;
      activeRoutes++;
    }
  }

  return { activeRoutes, tradeBonus: totalBonus, cursedRoutesSkipped };
}

/**
 * Count distinct factions present at a location (via located_at edges).
 */
function computeFactionPresence(graph: WorldGraph, locationId: string): number {
  const incomingEdges = graph.getIncomingEdges(locationId, 'located_at');
  const factionIds = new Set<string>();
  for (const edge of incomingEdges) {
    const node = graph.getNode(edge.source);
    if (node && node.type === 'faction') {
      factionIds.add(node.id);
    }
  }
  return factionIds.size;
}

/**
 * Look up the hex tile for a location's coordinates.
 * Fail-soft: returns undefined if coordinates missing or tile not found.
 */
function findHexTile(tiles: readonly HexTile[], props: Record<string, unknown>): HexTile | undefined {
  const col = props.hexCol;
  const row = props.hexRow;
  if (typeof col !== 'number' || typeof row !== 'number') return undefined;
  return tiles.find(t => t.coord.col === col && t.coord.row === row);
}

/**
 * Compute the sphere-derived prosperity modifier for a location.
 * Life and Energy sphere scores boost the equilibrium target; Entropy reduces it.
 * Returns a value in [-PROSPERITY_SPHERE_CAP, PROSPERITY_SPHERE_CAP] (fractional 0–1 scale).
 * Multiply by 100 before adding to the 0–100 target.
 *
 * Exported for direct testing.
 * Fail-soft: undefined affinity → 0.
 */
export function computeEquilibriumTargetWithSphere(affinity: SphereAffinity | undefined): number {
  if (!affinity) return 0;
  const raw =
    affinity.scores.life * PROSPERITY_LIFE_BONUS
    + affinity.scores.energy * PROSPERITY_ENERGY_BONUS
    - affinity.scores.entropy * PROSPERITY_ENTROPY_PENALTY;
  return Math.min(PROSPERITY_SPHERE_CAP, Math.max(-PROSPERITY_SPHERE_CAP, raw));
}

/**
 * Compute the equilibrium target for a settlement.
 * This is the prosperity level conditions support — prosperity drifts toward it.
 */
function computeEquilibriumTarget(
  graph: WorldGraph,
  tiles: readonly HexTile[],
  locationId: string,
  props: Record<string, unknown>,
  subtype: string,
  currentTick: number,
): { target: number; breakdown: EquilibriumBreakdown } {
  const carryingCapacity = computeCarryingCapacity(props);

  // Start at carrying capacity — this is the "natural" level for the land
  let target = carryingCapacity;

  // Trade routes boost target (THR-401: cursed routes contribute 0)
  const { activeRoutes, tradeBonus, cursedRoutesSkipped } = computeTradeTarget(graph, locationId, currentTick);
  target += tradeBonus;

  // Faction presence boosts target
  const factionCount = computeFactionPresence(graph, locationId);
  const factionBonus = Math.min(factionCount * FACTION_PRESENCE_BONUS, FACTION_PRESENCE_MAX_BONUS);
  target += factionBonus;

  // Corruption penalises target
  const tile = findHexTile(tiles, props);
  const corruption = tile?.corruption ?? 0;
  const corruptionPenalty = corruption > CORRUPTION_TARGET_THRESHOLD
    ? Math.min((corruption - CORRUPTION_TARGET_THRESHOLD) * CORRUPTION_TARGET_RATE, CORRUPTION_TARGET_MAX_PENALTY)
    : 0;
  target -= corruptionPenalty;

  // Divine influence boosts target
  const divineInfluence = tile?.divineInfluence ?? 0;
  const divineBonus = divineInfluence > DIVINE_TARGET_THRESHOLD
    ? Math.min((divineInfluence - DIVINE_TARGET_THRESHOLD) * DIVINE_TARGET_RATE, DIVINE_TARGET_MAX_BONUS)
    : 0;
  target += divineBonus;

  // Unrest penalises target
  const unrest = typeof props.unrest === 'number' ? props.unrest : 0;
  const unrestPenalty = unrest > UNREST_TARGET_THRESHOLD
    ? Math.min((unrest - UNREST_TARGET_THRESHOLD) * UNREST_TARGET_RATE, UNREST_TARGET_MAX_PENALTY)
    : 0;
  target -= unrestPenalty;

  // Upkeep for large settlements
  const upkeep = subtype === 'capital' ? UPKEEP_CAPITAL
    : subtype === 'city' ? UPKEEP_CITY
    : 0;
  target -= upkeep;

  // Sphere affinity modifier — Life/Energy boost, Entropy penalty
  // getNodeSphereAffinity fails-soft (undefined) when node has no sphereAffinity
  const locationNode = graph.getNode(locationId);
  const locationAffinity = locationNode ? getNodeSphereAffinity(locationNode) : undefined;
  const sphereModifier = computeEquilibriumTargetWithSphere(locationAffinity);
  // Scale fractional modifier to 0–100 target range
  target += sphereModifier * 100;

  // THR-401: divinePresence above threshold adds a flat bonus
  const divinePresence = typeof props.divinePresence === 'number' ? props.divinePresence : 0;
  const presenceBonus = divinePresence >= LOC_PRESENCE_PROSPERITY_THRESHOLD ? LOC_PRESENCE_PROSPERITY_BONUS : 0;
  target += presenceBonus;

  // THR-401: low populationHealth dampens the equilibrium target (multiplier).
  // Fail-soft: absent property defaults to LOC_HEALTH_DEFAULT_BASELINE.
  const populationHealth = typeof props.populationHealth === 'number'
    ? props.populationHealth
    : LOC_HEALTH_DEFAULT_BASELINE;
  let healthDampenerApplied = 0;
  if (populationHealth < LOC_HEALTH_DAMPENER_THRESHOLD) {
    const before = target;
    target *= LOC_HEALTH_PROSPERITY_DAMPENER;
    healthDampenerApplied = before - target;
  }

  // Clamp target to 0–100
  target = Math.max(0, Math.min(100, target));

  return {
    target,
    breakdown: {
      carryingCapacity,
      activeRoutes,
      tradeBonus,
      factionCount,
      factionBonus,
      corruption,
      corruptionPenalty,
      divineInfluence,
      divineBonus,
      unrest,
      unrestPenalty,
      upkeep,
      cursedRoutesSkipped,
      presenceBonus,
      populationHealth,
      healthDampenerApplied,
    },
  };
}

interface EquilibriumBreakdown {
  carryingCapacity: number;
  activeRoutes: number;
  tradeBonus: number;
  factionCount: number;
  factionBonus: number;
  corruption: number;
  corruptionPenalty: number;
  divineInfluence: number;
  divineBonus: number;
  unrest: number;
  unrestPenalty: number;
  upkeep: number;
  cursedRoutesSkipped: number;
  presenceBonus: number;
  populationHealth: number;
  healthDampenerApplied: number;
}

// ─── Phase Function ──────────────────────────────────────────────────────────

/**
 * phaseProsperity — equilibrium-based prosperity model.
 *
 * For each settlement:
 * 1. Compute equilibrium target from current conditions
 * 2. Drift prosperity toward target at DRIFT_RATE
 * 3. Apply any one-time shocks from state.prosperityShocks
 * 4. Clamp total delta to ±PROSPERITY_DELTA_CLAMP
 * 5. Update prosperity and population trend
 * 6. Emit trace with full breakdown
 *
 * Called once per tick, AFTER phaseTradeRouteDecay (so routes are current).
 * Mutates graph node properties in place.
 */
export function phaseProsperity(state: GameState): Partial<GameState> {
  const { graph, tick, tiles } = state;
  const shocks = state.prosperityShocks ?? [];
  const locations = graph.getNodesByType('location');
  const deathSiteSphereEvents: SpherePressureEvent[] = [];

  // Derive map bounds for frontier/center classification (identity location pressure)
  const identityPressure = state.doomIdentityMatrix?.locationPressure;
  let mapMinCol = 0, mapMaxCol = 0, mapMinRow = 0, mapMaxRow = 0;
  if (identityPressure && tiles.length > 0) {
    mapMinCol = Math.min(...tiles.map(t => t.coord.col));
    mapMaxCol = Math.max(...tiles.map(t => t.coord.col));
    mapMinRow = Math.min(...tiles.map(t => t.coord.row));
    mapMaxRow = Math.max(...tiles.map(t => t.coord.row));
  }
  const mapCenterCol = (mapMinCol + mapMaxCol) / 2;
  const mapCenterRow = (mapMinRow + mapMaxRow) / 2;
  // Frontier band: outer 25% of each dimension. Center zone: inner 25%.
  // Both currently use the same fraction; extract as a named constant to tune independently.
  const LOCATION_PRESSURE_BAND_FRACTION = 0.25;
  const frontierColThreshold = (mapMaxCol - mapMinCol) * LOCATION_PRESSURE_BAND_FRACTION;
  const frontierRowThreshold = (mapMaxRow - mapMinRow) * LOCATION_PRESSURE_BAND_FRACTION;
  const centerColThreshold = (mapMaxCol - mapMinCol) * LOCATION_PRESSURE_BAND_FRACTION;
  const centerRowThreshold = (mapMaxRow - mapMinRow) * LOCATION_PRESSURE_BAND_FRACTION;

  // Group shocks by locationId for O(1) lookup
  const shocksByLocation = new Map<string, ProsperityShock[]>();
  for (const shock of shocks) {
    const existing = shocksByLocation.get(shock.locationId);
    if (existing) {
      existing.push(shock);
    } else {
      shocksByLocation.set(shock.locationId, [shock]);
    }
  }

  for (const loc of locations) {
    const subtype = loc.properties?.locationSubtype as string | undefined;

    // Fail-soft: skip non-settlement locations silently
    if (!subtype || !SETTLEMENT_SUBTYPES.has(subtype)) continue;

    // Read current prosperity; default 0 if not yet initialised
    const prevProsperity = typeof loc.properties?.prosperity === 'number'
      ? loc.properties.prosperity
      : 0;

    // 1. Compute equilibrium target
    const { target, breakdown } = computeEquilibriumTarget(
      graph, tiles, loc.id, loc.properties as Record<string, unknown>, subtype, tick,
    );

    // THR-401: natural recovery/decay for populationHealth and divinePresence.
    // Both are fail-soft additive — missing properties default to neutral.
    // Done here (not a separate phase) because we already iterate settlements.
    const prevHealth = typeof loc.properties.populationHealth === 'number'
      ? loc.properties.populationHealth
      : LOC_HEALTH_DEFAULT_BASELINE;
    if (prevHealth < LOC_HEALTH_DEFAULT_BASELINE) {
      const nextHealth = Math.min(LOC_HEALTH_DEFAULT_BASELINE, prevHealth + LOC_HEALTH_RECOVERY_RATE);
      if (nextHealth !== prevHealth) {
        loc.properties.populationHealth = nextHealth;
        emitTrace({
          category: 'location_property_decay',
          tick,
          summary: `${loc.name}: populationHealth ${prevHealth.toFixed(1)} → ${nextHealth.toFixed(1)} (natural_recovery)`,
          locationId: loc.id,
          property: 'populationHealth',
          previousValue: prevHealth,
          newValue: nextHealth,
          reason: 'natural_recovery',
        } as any);
      }
    } else if (prevHealth > LOC_HEALTH_DEFAULT_BASELINE) {
      // Clamp back down toward baseline (e.g., after Bless the Harvest boosted it)
      const nextHealth = Math.max(LOC_HEALTH_DEFAULT_BASELINE, prevHealth - LOC_HEALTH_RECOVERY_RATE);
      if (nextHealth !== prevHealth) {
        loc.properties.populationHealth = nextHealth;
      }
    }
    const prevPresence = typeof loc.properties.divinePresence === 'number'
      ? loc.properties.divinePresence
      : 0;
    if (prevPresence > 0) {
      const nextPresence = Math.max(0, prevPresence - LOC_PRESENCE_DECAY_RATE);
      loc.properties.divinePresence = nextPresence;
      if (prevPresence > 0 && nextPresence === 0) {
        emitTrace({
          category: 'location_property_decay',
          tick,
          summary: `${loc.name}: divinePresence fully decayed`,
          locationId: loc.id,
          property: 'divinePresence',
          previousValue: prevPresence,
          newValue: nextPresence,
          reason: 'natural_decay',
        } as any);
      }
    }

    // THR-401: clear expired countdown properties and emit
    // location_countdown_expired traces so UI narrative-phrase flags
    // (routesCursed, wellsSickened) reflect current state.
    for (const propName of ['routesCursedUntilTick', 'wellsSickenedUntilTick', 'migrationPullUntilTick'] as const) {
      const until = loc.properties[propName];
      if (typeof until === 'number' && tick >= until) {
        delete loc.properties[propName];
        emitTrace({
          category: 'location_countdown_expired',
          tick,
          summary: `${loc.name}: ${propName} expired at tick ${tick} (was set to ${until})`,
          locationId: loc.id,
          property: propName,
          expiredAtTick: tick,
          setAtTick: until,
        } as any);
      }
    }

    // Emit a location_flag_consumed trace once per active flag while it is
    // suppressing trade — useful for inspectability.
    if (breakdown.cursedRoutesSkipped > 0) {
      emitTrace({
        category: 'location_flag_consumed',
        tick,
        summary: `${loc.name}: routesCursedUntilTick suppressed ${breakdown.cursedRoutesSkipped} trade route(s)`,
        locationId: loc.id,
        property: 'routesCursedUntilTick',
        consumingPhase: 'phaseProsperity',
        effect: `trade_routes_zeroed:${breakdown.cursedRoutesSkipped}`,
      } as any);
    }

    // 2. Compute drift toward target
    const gap = target - prevProsperity;
    let drift = 0;
    if (Math.abs(gap) > 0.01) {
      drift = gap * PROSPERITY_DRIFT_RATE;
      // Enforce minimum drift magnitude so we don't stall near target
      if (Math.abs(drift) < PROSPERITY_DRIFT_MIN && Math.abs(gap) >= PROSPERITY_DRIFT_MIN) {
        drift = gap > 0 ? PROSPERITY_DRIFT_MIN : -PROSPERITY_DRIFT_MIN;
      }
    }

    // 3. Sum shocks for this location
    const locationShocks = shocksByLocation.get(loc.id) ?? [];
    const shockTotal = locationShocks.reduce((sum, s) => sum + s.delta, 0);

    // 4. Doom identity location pressure (additive, capped, applied before clamp)
    let identityDelta = 0;
    if (identityPressure) {
      const locCol = typeof loc.properties?.hexCol === 'number' ? loc.properties.hexCol : mapCenterCol;
      const locRow = typeof loc.properties?.hexRow === 'number' ? loc.properties.hexRow : mapCenterRow;
      const isFrontier = (locCol - mapMinCol) < frontierColThreshold || (mapMaxCol - locCol) < frontierColThreshold
        || (locRow - mapMinRow) < frontierRowThreshold || (mapMaxRow - locRow) < frontierRowThreshold;
      const isCenter = Math.abs(locCol - mapCenterCol) < centerColThreshold
        && Math.abs(locRow - mapCenterRow) < centerRowThreshold;
      const rawIdentityDelta = isFrontier ? identityPressure.frontierDelta
        : isCenter ? identityPressure.centerDelta : 0;
      identityDelta = Math.max(-IDENTITY_PROSPERITY_MODIFIER_CAP, Math.min(IDENTITY_PROSPERITY_MODIFIER_CAP, rawIdentityDelta));
    }

    // 5. Combined delta, clamped
    const rawDelta = drift + shockTotal + identityDelta;
    const clampedDelta = Math.max(-PROSPERITY_DELTA_CLAMP, Math.min(PROSPERITY_DELTA_CLAMP, rawDelta));

    // 6. New prosperity, clamped to 0–100
    const newProsperity = Math.max(0, Math.min(100, prevProsperity + clampedDelta));

    const prevTier = getProsperityTier(prevProsperity);
    const newTier = getProsperityTier(newProsperity);
    const tierChanged = prevTier !== newTier;

    // 7. Population trend follows prosperity tier
    const populationTrend: PopulationTrend = getPopulationTrend(newTier);

    // 8. populationLagTicks: if missing, default to min and emit warning trace
    const lagMissing = loc.properties?.populationLagTicks === undefined;
    if (lagMissing) {
      loc.properties.populationLagTicks = POPULATION_LAG_TICKS_MIN;
    }

    // 9. Write updated properties back to node
    loc.properties.prosperity = newProsperity;
    loc.properties.populationTrend = populationTrend;

    // 9.5 Death-site haunting — locations where agents died gain unrest and Spirit pressure each tick.
    // deathCount is incremented by phaseAgentLifecycle when an agent dies here.
    const deathSiteUnrestBonus = identityPressure?.deathSiteUnrestBonus ?? 0;
    const deathSiteSpiritPressure = identityPressure?.deathSiteSpiritPressure ?? 0;
    let deathSiteUnrestApplied = 0;
    if ((deathSiteUnrestBonus > 0 || deathSiteSpiritPressure > 0)) {
      const deathCount = typeof loc.properties.deathCount === 'number' ? loc.properties.deathCount : 0;
      if (deathCount > 0) {
        if (deathSiteUnrestBonus > 0) {
          const prevUnrest = typeof loc.properties.unrest === 'number' ? loc.properties.unrest : 0;
          deathSiteUnrestApplied = deathSiteUnrestBonus;
          loc.properties.unrest = Math.min(100, prevUnrest + deathSiteUnrestApplied);
        }
        if (deathSiteSpiritPressure > 0) {
          deathSiteSphereEvents.push({
            targetEntityId: loc.id,
            sphere: 'spirit',
            magnitude: deathSiteSpiritPressure,
            source: 'doom',
            sourceId: loc.id,
          });
          emitTrace({
            category: 'death_site_spirit_pressure',
            tick,
            agentId: loc.id,
            summary: `${loc.name}: death-site spirit pressure +${deathSiteSpiritPressure} (deathCount=${deathCount})`,
            locationId: loc.id,
          });
        }
      }
    }

    // 10. Emit tick trace with full equilibrium breakdown
    emitTrace({
      category: 'prosperity_tick',
      tick,
      agentId: loc.id,
      summary: `${loc.name}: prosperity ${prevProsperity.toFixed(1)} → ${newProsperity.toFixed(1)} (target ${target.toFixed(1)}, ${newTier})${tierChanged ? ' [tier changed]' : ''}${deathSiteUnrestApplied > 0 ? ` [death-site unrest +${deathSiteUnrestApplied}]` : ''}`,
      locationId: loc.id,
      // Equilibrium model
      equilibriumTarget: target,
      drift,
      shockTotal,
      shockCount: locationShocks.length,
      shocks: locationShocks.map(s => ({ delta: s.delta, causeType: s.causeType, causeId: s.causeId, description: s.description })),
      rawDelta,
      clampedDelta,
      // Breakdown
      ...breakdown,
      // Identity death-site haunting
      deathSiteUnrestApplied,
      // Result
      previousProsperity: prevProsperity,
      newProsperity,
      previousTier: prevTier,
      newTier,
      tierChanged,
    });
  }

  // Clear shocks after consumption; propagate any death-site spirit pressure events
  return {
    prosperityShocks: [],
    ...(deathSiteSphereEvents.length > 0
      ? { pendingSpherePressures: [...(state.pendingSpherePressures ?? []), ...deathSiteSphereEvents] }
      : {}),
  };
}
