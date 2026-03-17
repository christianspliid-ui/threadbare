/**
 * Phase: Settlement Prosperity
 *
 * Ticks economic vitality for all settlement-type locations.
 * Prosperity (0–100) is driven by local resources and active trade routes.
 * Population trend label is updated each tick to follow prosperity tier.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { ResourceInstance } from '../types/resource';
import { emitTrace } from './traceBuffer';

// ─── Constants (System 1) ─────────────────────────────────────────────────

/** Max absolute prosperity change per tick */
export const PROSPERITY_DELTA_CLAMP = 10;

/** Prosperity gain per active trades_with edge, scaled by normalised volume */
export const PROSPERITY_TRADE_BONUS_PER_ROUTE = 2;

/** Prosperity threshold for "Flourishing" prose / promotion eligibility */
export const PROSPERITY_TIER_FLOURISHING = 80;

/** Prosperity threshold for "Prosperous" prose / passive wealth generation */
export const PROSPERITY_TIER_PROSPEROUS = 60;

/** Prosperity threshold for "Modest" prose / Market District spawn */
export const PROSPERITY_TIER_MODEST = 40;

/** Prosperity threshold for "Struggling" prose / sublocation dissolution / demotion */
export const PROSPERITY_TIER_STRUGGLING = 20;

/** Minimum population lag ticks (seeded per settlement at creation via PRNG) */
export const POPULATION_LAG_TICKS_MIN = 1;

/** Maximum population lag ticks (seeded per settlement at creation via PRNG) */
export const POPULATION_LAG_TICKS_MAX = 3;

/** Sustained prosperity required for hamlet→town→city promotion */
export const SETTLEMENT_PROMOTION_PROSPERITY = 70;

/** Ticks prosperity must stay above SETTLEMENT_PROMOTION_PROSPERITY to trigger promotion */
export const SETTLEMENT_PROMOTION_SUSTAIN_TICKS = 3;

/** Sustained low prosperity required for city→town→hamlet demotion */
export const SETTLEMENT_DEMOTION_PROSPERITY = 20;

// ─── Types ────────────────────────────────────────────────────────────────

/** Prosperity tier label — used for prose hooks and player-facing descriptions */
export type ProsperityTier = 'Flourishing' | 'Prosperous' | 'Modest' | 'Struggling' | 'Destitute';

/** Population trend label — follows prosperity with a lag */
export type PopulationTrend = 'growing' | 'stable' | 'declining' | 'collapsing';

/** Settlement locationSubtype values that participate in prosperity calculations */
const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

// ─── Helpers ──────────────────────────────────────────────────────────────

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
 * Formula: sum(quantity × renewalRate) for each resource instance.
 * Fail-soft: missing or malformed resources property → 0.
 */
function computeBaseIncome(props: Record<string, unknown>): number {
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
 * Compute trade bonus from trades_with edges for actors at this location.
 * Bonus per route = PROSPERITY_TRADE_BONUS_PER_ROUTE × (volume / TRADE_ROUTE_MAX_VOLUME).
 * Counts each unique edge once even if both endpoints are at the same location.
 */
function computeTradeBonus(graph: WorldGraph, locationId: string): number {
  const actorEdges = graph.getIncomingEdges(locationId, 'located_at');
  if (actorEdges.length === 0) return 0;

  const seenEdges = new Set<string>();
  let totalBonus = 0;

  for (const actorEdge of actorEdges) {
    const actorId = actorEdge.source;
    const tradeEdges = graph.getOutgoingEdges(actorId, 'trades_with');
    for (const edge of tradeEdges) {
      // Deduplicate: canonical key = sorted endpoint pair
      const edgeKey = [edge.source, edge.target].sort().join(':');
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);
      const volume = typeof edge.properties?.volume === 'number' ? edge.properties.volume : 1;
      // Normalise volume against max (10); clamp to 0–1
      const normVolume = Math.min(Math.max(volume / 10, 0), 1);
      totalBonus += PROSPERITY_TRADE_BONUS_PER_ROUTE * normVolume;
    }
  }

  return totalBonus;
}

// ─── Phase Function ────────────────────────────────────────────────────────

/**
 * phaseProsperity — update prosperity and population trend for all settlements.
 *
 * Called once per tick. Processes all location nodes with a settlement subtype.
 * Mutates graph node properties in place (same pattern as other tick phases).
 * Emits one ProsperityTickTrace per settlement per tick.
 */
export function phaseProsperity(state: GameState): Partial<GameState> {
  const { graph, tick } = state;
  const locations = graph.getNodesByType('location');

  for (const loc of locations) {
    const subtype = loc.properties?.locationSubtype as string | undefined;

    // Fail-soft: skip non-settlement locations silently
    if (!subtype || !SETTLEMENT_SUBTYPES.has(subtype)) continue;

    // Read current prosperity; default 0 if not yet initialised
    const prevProsperity = typeof loc.properties?.prosperity === 'number'
      ? loc.properties.prosperity
      : 0;

    // 1. Base income from local resources (fail-soft: no resources → 0)
    const baseIncome = computeBaseIncome(loc.properties as Record<string, unknown>);

    // 2. Trade bonus from active trades_with edges via actors at this location
    const tradeBonus = computeTradeBonus(graph, loc.id);

    // 3. Disruption penalty — Phase 2 will add threatened-edge logic; 0 for now
    const disruptionPenalty = 0;

    // 4. Net delta, clamped to ±PROSPERITY_DELTA_CLAMP
    const rawDelta = baseIncome + tradeBonus - disruptionPenalty;
    const netDelta = Math.max(
      -PROSPERITY_DELTA_CLAMP,
      Math.min(PROSPERITY_DELTA_CLAMP, rawDelta),
    );

    // 5. New prosperity, clamped to 0–100
    const newProsperity = Math.max(0, Math.min(100, prevProsperity + netDelta));

    const prevTier = getProsperityTier(prevProsperity);
    const newTier = getProsperityTier(newProsperity);
    const tierChanged = prevTier !== newTier;

    // 6. Population trend follows prosperity tier
    const populationTrend: PopulationTrend = getPopulationTrend(newTier);

    // 7. populationLagTicks: if missing, default to min and emit warning trace
    const lagMissing = loc.properties?.populationLagTicks === undefined;
    if (lagMissing) {
      loc.properties.populationLagTicks = POPULATION_LAG_TICKS_MIN;
      emitTrace({
        category: 'prosperity_tick',
        tick,
        agentId: loc.id,
        summary: `${loc.name}: populationLagTicks missing — defaulted to ${POPULATION_LAG_TICKS_MIN}`,
        locationId: loc.id,
        baseIncome: 0,
        tradeBonus: 0,
        disruptionPenalty: 0,
        netDelta: 0,
        previousProsperity: prevProsperity,
        newProsperity: prevProsperity,
        previousTier: prevTier,
        newTier: prevTier,
        tierChanged: false,
      });
    }

    // 8. Write updated properties back to node
    loc.properties.prosperity = newProsperity;
    loc.properties.populationTrend = populationTrend;

    // 9. Emit tick trace (one per settlement per tick)
    emitTrace({
      category: 'prosperity_tick',
      tick,
      agentId: loc.id,
      summary: `${loc.name}: prosperity ${prevProsperity.toFixed(1)} → ${newProsperity.toFixed(1)} (${newTier})${tierChanged ? ' [tier changed]' : ''}`,
      locationId: loc.id,
      baseIncome,
      tradeBonus,
      disruptionPenalty,
      netDelta,
      previousProsperity: prevProsperity,
      newProsperity,
      previousTier: prevTier,
      newTier,
      tierChanged,
    });
  }

  return {};
}
