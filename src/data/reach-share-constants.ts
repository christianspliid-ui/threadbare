/**
 * Reach share — the one scale every capability *threshold* is read on (THR-1562).
 *
 * Plan: `Docs/plans/2026-09-24-thr-1562-reach-on-one-scale.md`.
 *
 * Content authors write every capability requirement — ambition floors and milestones,
 * spell `minReach`, `reach_above:` predicates, guild `joinPrerequisites` — as a share of
 * a 0–1 scale. The engine stores capability on a raw scale (worldgen rolls
 * `10 + rand(31)` for a protagonist, plus boosts). The reach share bridges them:
 *
 *   share = min(1, effectiveRawScore / REACH_SHARE_FULL_RAW)
 *
 * Two scales stay deliberately separate: the **dice** read the sigmoid
 * (`computeCapability`), and **fights / sieges / journeys** read the raw score with
 * thresholds authored raw. Every *requirement* reads the share.
 *
 * Tuning rule: if a kill criterion in the plan fires, move this constant — never
 * individual authored thresholds.
 */

/**
 * The effective raw score that reads as a full share (1.0): the top of an unboosted
 * protagonist's worldgen roll (`10 + floor(rng × 31)`, `worldSeed.generateDomainCapabilities`).
 * So 1.0 means "as good as the best ordinary protagonist starts".
 */
export const REACH_SHARE_FULL_RAW = 40;

/**
 * Documented, one-time multiplier applied to the authored `agent_reach_above`
 * milestone thresholds in `ambition-templates.ts` when they moved onto the share
 * (THR-1562), capped at 1.0. Recorded so the reason survives; not read at runtime —
 * `ambitionTemplatesReachScale.test.ts` pins that the authored values carry it.
 */
export const AMBITION_MILESTONE_RESCALE = 1.25;

/** Convert a raw capability score to its reach share. Non-finite or negative → 0. */
export function rawToReachShare(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(1, raw / REACH_SHARE_FULL_RAW);
}
