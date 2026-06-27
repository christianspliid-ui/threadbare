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
