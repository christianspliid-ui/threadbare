// src/data/binder-constants.ts
//
// Tunable constants for THE BINDER (THR-1296) — the scored find/modify/mint board,
// the persistence ledger, and the mint valve.
//
// Split from `strategic-action-constants.ts` deliberately (the plan left the split
// point to the executor): the binder is its own subsystem with its own retuning
// cadence, and the five weights want to sit adjacent so the mix is legible at a
// glance. NFP #1 (Tunability): changing binder feel is changing a number here.
//
// Plan: Docs/plans/2026-08-27-thr-1296-the-binder.md § Constants table

// ─── The five weights ───────────────────────────────────────────────
//
// These sum to exactly 1.00 — unlike the strategic candidate weights, which are
// relative and deliberately sum past 1. Keep the sum at 1.00 when retuning so a
// raw `bindScore` stays readable as a 0–1 quality figure in traces.

/** Does this candidate's role match what the cast slot asked for? */
export const BINDER_WEIGHT_CAST_ROLE_FIT = 0.3;

/** How rare is this role in the world right now? (Steers reuse vs mint.) */
export const BINDER_WEIGHT_SCARCITY = 0.2;

/** Existing relationships to the undertaking's actor — a reason for the scene. */
export const BINDER_WEIGHT_STORY_TIES = 0.2;

/** How near the stage is this candidate? */
export const BINDER_WEIGHT_DISTANCE = 0.15;

/** Does the candidate's axiological profile satisfy the slot's identity requirement? */
export const BINDER_WEIGHT_IDENTITY = 0.15;

// ─── Board shape ────────────────────────────────────────────────────

/** The mint row's floor before the scarcity term moves it. */
export const BINDER_MINT_BASE = 0.35;

/** Discount applied to a modified row versus pure reuse — modify costs something. */
export const BINDER_MODIFY_PENALTY = 0.1;

/**
 * `castRoleFit` for a candidate carrying no `npcRole` at all.
 *
 * Deliberately mid-band rather than 0: recon found born-later agents carry no
 * `npcRole`, which makes them permanently ineligible for today's reuse scan. At
 * 0.4 they are modify territory instead — the whole born-later population joins
 * the casting pool.
 */
export const BINDER_ROLELESS_ROLE_FIT = 0.4;

/** Bonus for cast already bound at an earlier step — continuity beats novelty. */
export const BINDER_CARRY_FORWARD_BONUS = 0.25;

/** Census count at or above which a role reads as fully commodity (scarcity 0). */
export const BINDER_ROLE_COMMODITY_THRESHOLD = 6;

/**
 * At or above this scarcity, a broken binding halts the checkpoint instead of
 * downgrading it to advance-at-cost — losing the only archmage is not a setback.
 */
export const BINDER_SINGULAR_SCARCITY_THRESHOLD = 0.8;

/** Candidate search radius and the denominator of the distance term. */
export const BINDER_DISTANCE_HORIZON_HEXES = 4;

/** Beyond this distance from the agent, a target requires a commanded anchor. */
export const BINDER_REMOTE_RANGE_HEXES = 2;

/** How near the site a commanded anchor must sit to count. */
export const BINDER_REMOTE_ANCHOR_RANGE_HEXES = 2;

// ─── The mint valve ─────────────────────────────────────────────────

/**
 * Mint requests drained per tick through the lifecycle births block.
 *
 * The budget is the deliverable (THR-814/THR-162 lesson): if mint counts exceed
 * it, fix the routing — never raise this to make the count fit.
 */
export const BINDER_MINT_BUDGET_PER_TICK = 1;

/** Fail-soft queue bound; overflow refuses the bind and traces it. */
export const BINDER_MINT_QUEUE_MAX = 12;

// ─── Compute + trace bounds ─────────────────────────────────────────

/** Max scored rows per cast slot — bounds both the trace payload and the work. */
export const BINDER_MAX_CANDIDATE_ROWS = 24;
