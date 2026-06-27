/**
 * Chosen Faction Powers — the consumer for `anoint` (THR-513).
 *
 * THR-509 shipped `applyChosenStatusGrant` + `CHOSEN_POWER_TABLE` as a scaffold:
 * it stamps a `chosen` status (with a domain-keyed power) onto a node, but
 * **nothing read it** — so the power was dead content. This phase closes that
 * gap. Each tick it walks every chosen faction and grants the faction's members
 * a power-keyed reputation gain through the existing reputation system
 * (`applyFactionReputationGain`), so anointing genuinely strengthens a faction:
 * standing rises, which drives rank, access, and bonuses (see factionReputation.ts).
 *
 * v1 mechanical payload: every chosen power channels through **member reputation**
 * (the faction's universal lever per the issue's "member reputation/leadership
 * bonus" example). The power *flavor* differs per (faction × ascendant domain)
 * via CHOSEN_POWER_TABLE; the *magnitude* differs per power via the table below.
 * Richer per-type mechanics (a true combat leadership aura, a faith aura beyond
 * the hex) can layer on later by branching in this same consumer.
 *
 * Design doc: Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md §4.4
 *
 * NFP compliance:
 *   #1 Tunability: every per-tick magnitude is a named constant / table entry.
 *   #2 Inspectability: one `chosen_faction_power` summary trace per chosen
 *      faction per tick, plus the per-member `faction_reputation` traces from
 *      applyFactionReputationGain.
 *   #3 Determinism: arithmetic only — no PRNG.
 *   #4 Fail-soft: missing power / dissolved faction / no members → skip, never throw.
 */

import type { GameState } from '../types/gameState';
import type { ChosenStatus } from './ascendantPrimitives';
import { getFactionNodes } from './factionNetwork';
import { applyFactionReputationGain } from './factionReputation';
import { CHOSEN_FACTION_REPUTATION_PER_TICK } from '../data/ascendant-expression-constants';
import { emitTrace } from './traceBuffer';

/** Trace category for the chosen-faction consumer. Registered in TRACE_CATEGORIES. */
export const CHOSEN_FACTION_POWER_TRACE_CATEGORY = 'chosen_faction_power' as const;

/**
 * Per-power per-tick member reputation gain (0–1 scale), keyed by the chosen
 * power id recorded in CHOSEN_POWER_TABLE (THR-509). Powers absent here fall
 * back to `CHOSEN_FACTION_REPUTATION_PER_TICK`. The literal reputation power
 * (gold) is strongest; the clandestine/secretive powers are subtler.
 */
export const CHOSEN_POWER_EFFECT_TABLE: Record<string, number> = {
  'chosen.gold.reputation': 0.005,          // Favoured Charter — standing accrues fastest
  'chosen.iron.leadership_aura': 0.004,     // Banner of the Chosen — a rallied martial faction
  'chosen.heart.faith_spread': 0.004,       // Hallowed Devotion — radiant faith lifts the faithful
  'chosen.star.fated_banner': 0.004,        // Fated Banner — providence lifts standing
  'chosen.eye.illumined_charter': 0.003,    // Illumined Charter — sharpened insight
  'chosen.stone.enduring_foundation': 0.003,// Enduring Foundation — durable standing
  'chosen.shadow.veiled_reach': 0.002,      // Veiled Mandate — quiet, unseen gains
  'chosen.veil.whispered_sanction': 0.002,  // Whispered Sanction — unrecorded dealings
};

/**
 * Per-tick consumer for chosen factions. Mirrors the placement of
 * `phaseFactionReputationDecay` (the two together net a chosen faction's members
 * upward): for every faction flagged chosen with a non-null power, apply the
 * power's per-tick reputation gain to each member.
 *
 * Registered in orchestrator.ts immediately after faction reputation decay.
 */
export function phaseChosenFactionPowers(state: GameState): Partial<GameState> {
  const graph = state.graph;
  const tick = state.tick;

  for (const faction of getFactionNodes(graph)) {
    // Skip dissolved factions (mirrors phaseFactionReputationDecay).
    if (faction.properties.dissolved) continue;

    const chosen = faction.properties.chosen as ChosenStatus | undefined;
    if (!chosen?.power) continue; // not chosen, or chosen with no power → nothing to consume

    const perTick = CHOSEN_POWER_EFFECT_TABLE[chosen.power.id] ?? CHOSEN_FACTION_REPUTATION_PER_TICK;
    if (perTick <= 0) continue;

    const memberEdges = graph.getIncomingEdges(faction.id, 'member_of');
    if (memberEdges.length === 0) continue;

    let touched = 0;
    for (const edge of memberEdges) {
      const result = applyFactionReputationGain(
        graph,
        edge.source,
        faction.id,
        perTick,
        tick,
        'chosen_power',
      );
      // newReputation 0 with no edge → member lookup failed; otherwise counts.
      if (result.newRank !== 'none') touched++;
    }

    emitTrace({
      tick,
      category: CHOSEN_FACTION_POWER_TRACE_CATEGORY,
      type: 'chosen_faction_power',
      summary: `chosen_faction_power: ${faction.name ?? faction.id} (${chosen.power.label}) → +${perTick} reputation to ${touched} member(s)`,
      factionId: faction.id,
      powerId: chosen.power.id,
      byAscendantId: chosen.byAscendantId,
      domain: chosen.domain,
      perTick,
      memberCount: touched,
    } as never);
  }

  return {};
}
