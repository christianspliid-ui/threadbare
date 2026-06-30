/**
 * Reach Signature Content — sphere-power scaling constants.
 *
 * The general "most divine actions scale effect + cost with sphere power" tunables.
 * Reusable, not signature-specific (Christian, 2026-06-30) — reach signatures and any
 * other sphere-gated effect compose against these.
 *
 * This issue (THR-548) seeds the file with constants only. The SignatureMatrix /
 * individualization layer lands in THR-549.
 *
 * Plan: Docs/plans/2026-06-30-ascendant-reach-signatures.md §3.2, §3.8
 */

// ─── Sphere-Power Scaling (NFP #1: Tunability) ────────────────────

/**
 * Effect/cost multiplier at sphere score 0 — actions at no sphere mastery.
 * Below 1.0: a weak-sphere action produces a diminished effect (but cost is floored
 * at base by `scaledCost`, so low power is never a discount).
 */
export const SIGNATURE_SCALE_FLOOR = 0.6;

/**
 * Effect/cost multiplier at MAX_SPHERE_SCORE — actions at full sphere mastery.
 * Above 1.0: a maxed-sphere action produces a larger effect at a higher cost.
 */
export const SIGNATURE_SCALE_CEIL = 2.0;
