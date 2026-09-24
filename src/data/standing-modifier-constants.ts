/**
 * THR-1535 — the unified road's roll reads a mortal's standing modifiers.
 *
 * "Standing modifiers" are everything `computeResolutionModifiers` sums for an
 * actor on a step's reach: items and their effects, traits, terrain, the place's
 * conditions, sphere alignment, divine attention, auras and altered rules. The
 * attended forecast (`buildNudgePhaseModel`) always added them; before THR-1535
 * the roll did not, so every item bonus moved the percentage the player was shown
 * and never the dice.
 *
 * One-flag revert (NFP #1): `false` restores the pre-THR-1535 roll exactly —
 * the term is computed as 0, and the planner reads 0 too, so the forecast/roll
 * parity the planner test pins still holds in either position.
 */
export const UNIFIED_ROLL_READS_STANDING_MODIFIERS: boolean = true;
