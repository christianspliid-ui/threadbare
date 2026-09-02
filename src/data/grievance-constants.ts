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
