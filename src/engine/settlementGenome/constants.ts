// ── Sphere Thresholds ──
export const SPHERE_CONTRIBUTION_THRESHOLD = 0.3;
export const SPHERE_STRONG_THRESHOLD = 0.6;

// ── Reach Thresholds ──
export const REACH_CONTRIBUTION_THRESHOLD = 0.3;

// ── Vitality ──
export const SETTLEMENT_VITALITY_PROMOTION_THRESHOLD = 0.75;
export const SETTLEMENT_VITALITY_DEMOTION_THRESHOLD = 0.25;
export const SETTLEMENT_VITALITY_SUSTAIN_TICKS = 60;
export const SETTLEMENT_VITALITY_CRISIS_THRESHOLD = 0.1;
export const VITALITY_PROSPERITY_WEIGHT = 0.5;
export const VITALITY_FACTION_WEIGHT = 0.2;
export const VITALITY_THREAT_WEIGHT = 0.2;
export const VITALITY_TRADE_WEIGHT = 0.1;
export const VITALITY_DRIFT_RATE = 0.05;

// ── Sublocation Budget (THR-1344) ──
// A per-tier ceiling on the genome's *additive* passes. Archetype capstones are added
// after enforcement and sit above it, so an observed total runs a little over the cap —
// measured 32 at a capped-30 capital, 28 at a capped-26 city. That is deliberate: a
// capstone is the settlement's identity, not a contribution competing for room.
//
// Passes 2–4 are additive by construction: every qualifying culture, sphere and reach
// contributes its whole tier-gated list, and nothing subtracts. That was invisible while
// Passes 2 and 4 were dead at worldgen — the eager genome pass ran upstream of both
// culture assignment and faction seeding, so only infrastructure and sphere ever landed.
// With the second worldgen pass live, measured uncapped on seed 42 / medium: capitals at
// 38 sublocations, cities at 31, towns at 23. Thirty-eight distinct places inside one
// settlement is a list, not a place.
//
// Calibrated to bind the dense upper tail while leaving the typical settlement of each
// tier intact — the shape is deliberately loose, because the cost of trimming is authored
// content going unseen and the cost of not trimming is only legibility. Tunable (NFP #1):
// settlement density is one edit here, not a change to any pass.
export const SUBLOCATION_BUDGET: Record<string, number> = {
  hamlet:  10,
  town:    20,
  city:    26,
  capital: 30,
};

// ── NPC Budget ──
export const NPC_BUDGET: Record<string, { base: number; perSublocation: number }> = {
  hamlet:  { base: 3,  perSublocation: 1 },
  town:    { base: 6,  perSublocation: 1.5 },
  city:    { base: 10, perSublocation: 2 },
  capital: { base: 15, perSublocation: 2.5 },
};

// ── Reassessment Timing ──
export const PROMOTION_REASSESSMENT_DELAY = 6;
export const DEMOTION_RUIN_DECAY_TICKS = 120;

// ── Archetype ──
export const ARCHETYPE_MAX_PER_SETTLEMENT = 1;

// ── Culture Strength ──
export const CULTURE_STRENGTH_BASE = 0.4;
export const CULTURE_STRENGTH_HEARTLAND_BONUS = 0.3;
export const CULTURE_STRENGTH_HOME_PLACE_BONUS = 0.2;
export const CULTURE_STRENGTH_DILUTION_PENALTY = 0.1;
export const CULTURE_STRENGTH_MIN_FOR_ADDITIONS = 0.3;
