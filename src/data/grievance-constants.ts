// src/data/grievance-constants.ts
//
// Tuning for the reactive loop (THR-1298) — how hot a harm burns and how it cools.
//
// The plan left the constants' home to the executor ("`ambition-selection-constants.ts`
// or fold into an existing constants file"). A dedicated file wins because the
// grievance family spans three consumers that share no other constants file between
// them — the mint lane (`ambitionTick`), the decay pass, and the decision board — and
// folding them into any one of those three would make the other two import across a
// seam that has nothing else to do with them.
//
// NFP #1: changing how long a world holds a grudge is changing a number here.

/**
 * Heat ceiling. A grievance opens at `harmMagnitude × GRIEVANCE_HEAT_INITIAL_SCALE`,
 * clamped here, so the worst harm in the table cannot open hotter than the scale's top
 * and the re-ignition boost has somewhere to saturate against.
 */
export const GRIEVANCE_HEAT_INITIAL_MAX = 1.0;

/**
 * Harm magnitude → opening heat.
 *
 * At 1.0 the two scales are the same scale, which is deliberate for v1: a killing
 * (magnitude 1.0) opens at maximum heat and an abandoned undertaking (0.3) opens
 * barely warm. Lowering this makes every grievance cool faster without touching the
 * relative ordering of the harms.
 */
export const GRIEVANCE_HEAT_INITIAL_SCALE = 1.0;

/**
 * Heat lost per 15-tick milestone pass.
 *
 * At 0.06 a maximum-heat grievance (1.0) reaches the cooling threshold in roughly
 * fourteen passes — about ten in-game days at 12 ticks to the day. That is the whole
 * temporal shape of a vendetta in one number: raise it and the world forgives quickly,
 * lower it and grudges outlive the people who earned them.
 */
export const GRIEVANCE_HEAT_DECAY_PER_CHECK = 0.06;

/**
 * At or below this heat, the grievance stops being a drive and becomes a grudge.
 *
 * Not zero, deliberately. A drive that decays to exactly nothing would sit at the
 * bottom of the board forever, technically active and never chosen — the starved-shelf
 * shape. Demoting at a floor above zero means a cold grievance leaves the board
 * outright and keeps existing as relationship colour instead.
 */
export const GRIEVANCE_COOL_THRESHOLD = 0.15;

/**
 * How much of a repeat harm's magnitude feeds the standing grievance's heat.
 *
 * Below 1.0 because a second injury from the same hand should reignite the first
 * rather than stack into a permanently maximal fury — the harm is already represented
 * by the grievance that exists.
 */
export const GRIEVANCE_HEAT_FEED = 0.5;

/**
 * How much heavier a new harm must be than the standing one to take its slot.
 *
 * Above 1.0 so that ties and near-ties never displace: the first wound keeps the slot
 * unless the new one is decisively worse. Without the margin, two comparable harms
 * would trade the slot back and forth and the agent would pursue neither.
 */
export const GRIEVANCE_REPLACE_RATIO = 1.25;

/**
 * Opening-heat multiplier when the culprit already holds a grudge edge with the victim.
 *
 * This is what makes the second betrayal worse than the first. Clamped against
 * `GRIEVANCE_HEAT_INITIAL_MAX` at the call site, so a boost can saturate but never
 * mint a grievance hotter than the scale admits.
 */
export const GRIEVANCE_REIGNITION_BOOST = 1.5;

/**
 * How far past the answered magnitude a reprisal must land to re-open the chain.
 *
 * Answered is not the same as wronged: a proportionate revenge closes the account and
 * mints nothing back. Only an answer that overshoots this ratio starts the next link,
 * which is why most chains end at one round by construction rather than by a cap.
 */
export const GRIEVANCE_OVERSHOOT_RATIO = 1.5;

/**
 * Maximum links in a revenge chain before victims get grudge edges only.
 *
 * Two, so a harm can be avenged and the avenging answered, and the third party holds a
 * grudge instead of a drive. Chains stay spotlight-only: an unbounded chain would turn
 * one razed village into a world where every agent is pursuing somebody.
 */
export const GRIEVANCE_CHAIN_DEPTH_MAX = 2;

/**
 * Board weight added to a strategic candidate whose ambition is a hot grievance.
 *
 * Scaled by `heat / GRIEVANCE_HEAT_INITIAL_MAX`, so urgency is the decay curve rather
 * than a scheduling special case: a fresh grievance outranks ordinary ambitions, and as
 * it cools it competes fairly and eventually leaves the board on its own.
 */
export const GRIEVANCE_URGENCY_WEIGHT = 0.4;

// ─── Prose bands (THR-1298 slice 7) ───────────────────────────────
//
// Heat reaches the player as one of three words, never as a numeral. The bands are
// constants and not a hardcoded ladder because they are the only place the decay curve
// becomes something a player can read: move `GRIEVANCE_HEAT_DECAY_PER_CHECK` and these
// decide how long each word is on screen.

/** At or above this heat, a grievance reads **burning**. */
export const GRIEVANCE_HEAT_BAND_BURNING = 0.7;

/**
 * At or above this heat (and below burning), a grievance reads **hot**.
 *
 * Below it reads **cooling** — which runs down to `GRIEVANCE_COOL_THRESHOLD`, where the
 * drive demotes to a grudge and leaves the intent list entirely. So "cooling" is a real
 * window an agent lives in, not a floor label nobody ever sees.
 */
export const GRIEVANCE_HEAT_BAND_HOT = 0.4;
