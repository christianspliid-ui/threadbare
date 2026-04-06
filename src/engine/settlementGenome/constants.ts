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
