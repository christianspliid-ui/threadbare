/**
 * Ascendant Expression Card constants (THR-508).
 *
 * Tunable numbers for the early expression cards — generic divine verbs the
 * player-god unlocks early via Ascendant Beats. The verb is universal; the
 * magic it produces is flavored by the ascendant's primary domain + sphere
 * (two-domain lock, THR-503).
 *
 * This run ships `imbue` (the one card that composes the already-shipped
 * THR-509 primitives end-to-end with zero new consumer wiring). `consecrate`,
 * `bestow`, and `anoint` are split into their own issues — each needs a
 * genuinely-new consumer subsystem (location-sustained spawn bridge / agent
 * casting / chosen-power consumer) per plan §4.4.
 *
 * Design doc: Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md §4.4
 *
 * NFP #1 (Tunability): every magnitude is a named constant here.
 */

/**
 * Essence cost to imbue an artifact with a sphere-flavored power.
 * Mirrors the `artifact.enchant` cost tier (4) — imbue is a stronger,
 * domain-flavored sibling that actually mutates the artifact's effects.
 */
export const IMBUE_ESSENCE_COST = 4;

/**
 * Upfront essence to establish a `consecrate` site (THR-511). Charged once when
 * the sustained control effect is spawned; mirrors `hex.cultivate`'s upfront tier.
 * The ongoing devotion is `CONSECRATE_PERTICK`; the per-tick faith-spread
 * magnitude reuses `CONSECRATE_DEVOTION_PER_TICK` (src/types/ascendantPrimitives.ts).
 */
export const CONSECRATE_ESTABLISH_COST = 4;

/**
 * Per-tick spirit essence to sustain a consecrated site (THR-511). Mirrors
 * `hex.claim_dominion`'s 0.3/tick sustain cost — consecration is a held presence,
 * not a one-shot. While paid, the site's `perTickThreadAuras` advance every
 * co-located thread toward tier promotion (faith-spread).
 */
export const CONSECRATE_PERTICK = 0.3;
