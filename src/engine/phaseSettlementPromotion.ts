/**
 * Phase: Settlement Tier Promotion / Demotion
 *
 * When a settlement sustains prosperity above SETTLEMENT_PROMOTION_PROSPERITY
 * for SETTLEMENT_PROMOTION_SUSTAIN_TICKS, it promotes one tier (hamlet→town→city).
 * When it sustains prosperity below SETTLEMENT_DEMOTION_PROSPERITY for the same
 * duration, it demotes one tier (city→town→hamlet).
 *
 * Capitals never change tier. The phase tracks sustain counters on location nodes
 * (prosperitySustainAboveTicks, prosperitySustainBelowTicks) and resets them
 * after a tier change.
 *
 * Each tier change:
 * - Mutates the node's locationSubtype in place
 * - Emits a settlement_tier_change trace
 * - Pushes a chronicle TickEvent (significance 0.9)
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * Phase 4 item 10 — Settlement promotion/demotion
 * NFP priorities: Tunability, Inspectability, Fail-soft
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { ChronicleChapter } from '../types/chronicle';
import { emitTrace } from './traceBuffer';
import {
  SETTLEMENT_PROMOTION_PROSPERITY,
  SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
  SETTLEMENT_DEMOTION_PROSPERITY,
} from './phaseProsperity';
import { resolveEconomicChronicle } from './economicChronicle';

// ─── Constants ─────────────────────────────────────────────────────────────

/** Location subtypes that participate in promotion/demotion (capital excluded) */
const PROMOTION_ELIGIBLE: Record<string, string> = {
  hamlet: 'town',
  town: 'city',
};

/** Location subtypes that participate in demotion */
const DEMOTION_ELIGIBLE: Record<string, string> = {
  city: 'town',
  town: 'hamlet',
};

/** All settlement subtypes (including capital, which is never changed) */
const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

// ─── Phase Function ─────────────────────────────────────────────────────────

/**
 * phaseSettlementPromotion — check each settlement for sustained prosperity
 * thresholds and promote or demote as needed.
 *
 * Called once per tick, AFTER phaseProsperity.
 * Mutates graph node properties in place.
 */
export function phaseSettlementPromotion(state: GameState): Partial<GameState> {
  const { graph, tick, seed } = state;
  const events: TickEvent[] = [];
  const chapters: ChronicleChapter[] = [];
  const locations = graph.getNodesByType('location');

  for (const loc of locations) {
    const subtype = loc.properties?.locationSubtype as string | undefined;

    // Skip non-settlement or capital (capital never changes)
    if (!subtype || !SETTLEMENT_SUBTYPES.has(subtype) || subtype === 'capital') continue;

    const prosperity = typeof loc.properties?.prosperity === 'number'
      ? loc.properties.prosperity
      : 0;

    // Read sustain counters (default 0 if not yet initialized)
    let aboveTicks = typeof loc.properties?.prosperitySustainAboveTicks === 'number'
      ? loc.properties.prosperitySustainAboveTicks
      : 0;
    let belowTicks = typeof loc.properties?.prosperitySustainBelowTicks === 'number'
      ? loc.properties.prosperitySustainBelowTicks
      : 0;

    // Update counters based on current prosperity
    if (prosperity >= SETTLEMENT_PROMOTION_PROSPERITY) {
      aboveTicks += 1;
      belowTicks = 0;
    } else if (prosperity <= SETTLEMENT_DEMOTION_PROSPERITY) {
      belowTicks += 1;
      aboveTicks = 0;
    } else {
      // Mid-range: both counters stop accumulating but aren't reset to avoid
      // temporary blips breaking sustained thresholds — only reset on the other direction
      // (no change to counters when prosperity is in the middle band)
    }

    // Check promotion
    const promotionTarget = PROMOTION_ELIGIBLE[subtype];
    if (promotionTarget && aboveTicks >= SETTLEMENT_PROMOTION_SUSTAIN_TICKS) {
      loc.properties.locationSubtype = promotionTarget;
      loc.properties.prosperitySustainAboveTicks = 0;
      loc.properties.prosperitySustainBelowTicks = 0;

      emitTrace({
        category: 'settlement_tier_change',
        tick,
        agentId: loc.id,
        summary: `${loc.name} promoted ${subtype}→${promotionTarget} after ${SETTLEMENT_PROMOTION_SUSTAIN_TICKS} ticks above prosperity ${SETTLEMENT_PROMOTION_PROSPERITY}`,
        locationId: loc.id,
        locationName: loc.name,
        previousSubtype: subtype,
        newSubtype: promotionTarget,
        direction: 'promotion',
        sustainedTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
        prosperity,
      });

      const promotionEntry = resolveEconomicChronicle(
        'settlement_promotion',
        {
          settlement: loc.name,
          oldType: subtype,
          newType: promotionTarget,
          locationId: loc.id,
          hexCoords: typeof loc.properties?.hexCol === 'number' && typeof loc.properties?.hexRow === 'number'
            ? { col: loc.properties.hexCol as number, row: loc.properties.hexRow as number }
            : undefined,
        },
        tick,
        seed + loc.id.charCodeAt(0),
      );

      if (promotionEntry) {
        events.push(promotionEntry.tickEvent);
        chapters.push(promotionEntry.chronicleChapter);
      } else {
        // Fail-soft fallback if template resolution fails
        events.push({
          id: `evt_tier_${loc.id}_${tick}`,
          tick,
          type: 'settlement_tier_change',
          message: `The ${subtype} of ${loc.name} has grown into a proper ${promotionTarget}.`,
          significance: 0.9,
        });
      }
      continue;
    }

    // Check demotion
    const demotionTarget = DEMOTION_ELIGIBLE[subtype];
    if (demotionTarget && belowTicks >= SETTLEMENT_PROMOTION_SUSTAIN_TICKS) {
      loc.properties.locationSubtype = demotionTarget;
      loc.properties.prosperitySustainAboveTicks = 0;
      loc.properties.prosperitySustainBelowTicks = 0;

      emitTrace({
        category: 'settlement_tier_change',
        tick,
        agentId: loc.id,
        summary: `${loc.name} demoted ${subtype}→${demotionTarget} after ${SETTLEMENT_PROMOTION_SUSTAIN_TICKS} ticks below prosperity ${SETTLEMENT_DEMOTION_PROSPERITY}`,
        locationId: loc.id,
        locationName: loc.name,
        previousSubtype: subtype,
        newSubtype: demotionTarget,
        direction: 'demotion',
        sustainedTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
        prosperity,
      });

      const demotionEntry = resolveEconomicChronicle(
        'settlement_demotion',
        {
          settlement: loc.name,
          oldType: subtype,
          newType: demotionTarget,
          locationId: loc.id,
          hexCoords: typeof loc.properties?.hexCol === 'number' && typeof loc.properties?.hexRow === 'number'
            ? { col: loc.properties.hexCol as number, row: loc.properties.hexRow as number }
            : undefined,
        },
        tick,
        seed + loc.id.charCodeAt(0),
      );

      if (demotionEntry) {
        events.push(demotionEntry.tickEvent);
        chapters.push(demotionEntry.chronicleChapter);
      } else {
        events.push({
          id: `evt_tier_${loc.id}_${tick}`,
          tick,
          type: 'settlement_tier_change',
          message: `${loc.name} has fallen on hard times — the ${subtype} shrinks to a ${demotionTarget}.`,
          significance: 0.9,
        });
      }
      continue;
    }

    // Persist updated counters
    loc.properties.prosperitySustainAboveTicks = aboveTicks;
    loc.properties.prosperitySustainBelowTicks = belowTicks;
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
    chronicleEntries: chapters.length > 0
      ? [...state.chronicleEntries, ...chapters.map(ch => ({
          id: ch.id,
          tier: 'chronicle' as const,
          title: ch.title,
          prose: ch.prose,
          promptContext: {
            actors: ch.actorIds,
            location: '',
            sphere: (ch.spheres[0] ?? 'gold') as import('../types/index').SphereName,
            mood: 'economic',
          },
          tick: ch.tick,
        }))]
      : state.chronicleEntries,
  };
}
