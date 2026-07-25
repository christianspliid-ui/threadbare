/**
 * Player Action Progression — tunable constants (THR-613, plan §3.5).
 *
 * God-side capability growth: the ascendant accrues `reachPractice` in its two
 * permanent reaches by resolving in-domain actions, feeding Domain Capability
 * through the same sigmoid as agents (`computeRawScore`). Crossing a Domain
 * Capability tier fires a Deepening beat through the shipped Ascendant Beat
 * Director (`pending` slot).
 *
 * All numbers here are tunable (NFP #1) and surfaced in the CMS constants
 * registry (`src/components/CMS/registry.ts`). Changing game feel = changing a
 * number, not rewriting logic.
 */

import type { ReachDomain } from '../types/traits';

/** Base reach-practice granted per resolved in-domain player action. */
export const PLAYER_PRACTICE_PER_ACTION = 0.4;

/**
 * Rate at which high capability damps further practice (0–1). Mirrors the agent
 * `DIMINISHING_RETURNS_FACTOR` for curve parity — "easy to start, hard to master".
 */
export const PLAYER_DIMINISHING_RETURNS_FACTOR = 0.7;

/**
 * Practice granted from shaping an in-domain encounter step via divine intervention.
 * Reserved for Slice 2 (encounter-shaping accrual); declared now so the accrual
 * surface is a single named constant.
 */
export const PLAYER_PRACTICE_ENCOUNTER_SHAPE = 0.4;

/**
 * Secondary reach accrues practice slower than the primary — identity has a lead
 * axis (plan §2.1). Applied as a multiplier when the resolved reach is the
 * ascendant's second-ranked affinity.
 */
export const SECONDARY_REACH_PRACTICE_MULT = 0.7;

/** Dedup cap: at most this many Deepening beats enqueue per tick (plan §3.2). */
export const DEEPENING_BEAT_MAX_PER_TICK = 1;

/**
 * Controlled essence sources that fire the breadth (milestone) beat (plan §3.5/§4.2).
 * Reached by counting the ascendant's `controls` edges into source-bearing hosts.
 */
export const MILESTONE_SOURCES_FOR_BEAT = 3;

/**
 * Flowering sources that fire the milestone beat on their own (plan §4.2 — "at
 * `MILESTONE_SOURCES_FOR_BEAT` controlled sources **or** first Flowering source").
 * A single flowering source is a deeper achievement than three dormant ones — it
 * means the god actually tended what it took — so it qualifies alone.
 */
export const MILESTONE_FLOWERING_FOR_BEAT = 1;

/**
 * The essence-source milestone beat id (plan §4.2, Axis B breadth). One per run,
 * deduped through `AscendantProperties.milestoneBeatsFired`.
 */
export const MILESTONE_SOURCE_BEAT_ID = 'beat.milestone.the_wellspring_flows';

/**
 * The company milestone beat id (THR-74). Fires once, the first time a company that
 * carries at least one threaded mortal exists in the world — the moment the bonds the
 * player has been following gather into a band worth naming. Grants `company.bless`.
 * Deduped through `AscendantProperties.milestoneBeatsFired`, like the source milestone.
 */
export const MILESTONE_COMPANY_BEAT_ID = 'beat.milestone.the_first_company';

/**
 * The gathering-bonds milestone beat id (THR-74). Fires once, the first time the
 * ascendant threads at least {@link DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK} living
 * mortals — the moment the player has raw material for a company and "draw them
 * together" first has meaning. Grants `company.draw_together`. Distinct from the
 * first-company milestone: this unlocks the *formation tool* before any company
 * exists, so a player can gather their first band deliberately rather than waiting
 * on the systemic roll. Deduped through `AscendantProperties.milestoneBeatsFired`.
 */
export const MILESTONE_GATHERING_BEAT_ID = 'beat.milestone.the_gathering_bonds';

/**
 * The empty-road milestone beat id (THR-732). Fires once, the first time a company
 * the ascendant was bound to has *ended* — and grants both remaining company verbs,
 * `company.reunite` and `company.sunder`, together.
 *
 * The trigger is the unlock's own precondition: Reunite can only be cast on a
 * disbanded company, so granting it before one exists would hand the player a card
 * with nothing in the world to target. Sunder rides the same beat rather than one of
 * its own because it is the same lesson learned from the other side — the first time
 * the player sees that a company can come apart is the moment both *undoing* it and
 * *causing* it become live verbs. (Granting a pair from one beat follows THR-724's
 * two secrets verbs.) Deduped through `AscendantProperties.milestoneBeatsFired`.
 */
export const MILESTONE_EMPTY_ROAD_BEAT_ID = 'beat.milestone.the_empty_road';

/**
 * Deterministic Deepening beat id for a reach. Slice 2 authors the matching
 * `UnifiedActionTemplate` content per reach (plan §4.1); Slice 1 enqueues by this id.
 */
export function deepeningBeatIdForReach(reach: ReachDomain): string {
  return `beat.deepening.${reach}`;
}
