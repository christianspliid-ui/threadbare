/**
 * Crown and fealty — PROTOTYPE constants (THR-1917). Throwaway branch `proto/thr-1917-crown`;
 * read only by `scripts/proto/crown-sketch.ts`, an observer ledger that never writes the world.
 * Builds on the THR-1867 faction purse constants (`faction-purse-constants.ts`).
 *
 * | Name                          | Purpose                                                         |
 * |-------------------------------|-----------------------------------------------------------------|
 * | ARMY_UPKEEP_PER_DAY           | decided per-day upkeep by army size (replaces maintenance × 0.6)|
 * | OATH_PROTECTION_W             | weight of protection in a candidate's offer score               |
 * | OATH_GIFT_W                   | weight of the gift (0..1 = share of the full gift affordable)   |
 * | OATH_STANDING_W               | weight of standing (+1 ally, −1 rival, 0 otherwise)             |
 * | OATH_PRIDE_W                  | weight of pride (candidate income ÷ liege income, capped)       |
 * | OATH_PRIDE_CAP                | cap on the pride ratio                                          |
 * | OATH_ACCEPT_THRESHOLD         | score at or above which the candidate swears                    |
 * | OATH_GIFT_DAYS                | full gift = this many days of the candidate's income            |
 * | OATH_GIFT_RESERVE             | coin the liege keeps back before it offers any gift             |
 * | OATH_THREAT_RADIUS_HEXES      | hostile armies within this many hexes of a holding are threats  |
 * | OATH_NO_THREAT_PROTECTION     | protection value when no threat is in range                     |
 * | OATH_COERCE_WINDOW_DAYS       | a town taken from the candidate this recently still coerces;    |
 * |                               | also the window siege ticks are counted over                    |
 * | OATH_COERCE_MIN_SIEGE_TICKS   | siege ticks on the candidate's towns (in the window) to coerce  |
 * | OATH_RESWEAR_COOLDOWN_DAYS    | a broken pair may not re-swear for this many days               |
 * | OATH_RIVAL_MARGIN             | a rival offer must beat the live oath score by this much        |
 * | FEALTY_TAX_SHARE              | share of the vassal's daily income the liege takes              |
 * | LOYALTY_START                 | starting loyalty by oath kind                                   |
 * | LOYALTY_RISE_FLUSH            | daily rise while the liege is Flush or Overflowing              |
 * | LOYALTY_FALL_STRAINED         | daily fall while the liege is Strained                          |
 * | LOYALTY_FALL_BANKRUPT         | daily fall while the liege is Bankrupt                          |
 * | LOYALTY_FAIL_DEFENCE          | fall per holding the vassal lost while sworn                    |
 * | LOYALTY_FALL_OUTGROWN         | daily fall while the vassal out-earns the liege                 |
 * | LOYALTY_FALL_RIVAL_OFFER      | daily fall while a rival liege's offer beats the live oath      |
 * | OATH_BREAK_THRESHOLD          | loyalty below this breaks the oath                              |
 * | REBELLION_INCOME_RATIO        | a breaking realm earning ≥ this × the liege's income rebels     |
 * | CROWN_MIN_OATHS               | oaths a liege must hold to be a Crown                           |
 * | NEVER_SWEAR_DEF_IDS           | definition factions that never swear                            |
 * | NEVER_SWEAR_GUILD_TYPES       | town guild types that never swear                               |
 */

export const ARMY_UPKEEP_PER_DAY = { warband: 1.5, regiment: 2.5, host: 3.5 } as const;

// ── Offer score ──
export const OATH_PROTECTION_W = 1.0;
export const OATH_GIFT_W = 0.8;
export const OATH_STANDING_W = 0.3;
export const OATH_PRIDE_W = 0.3;
export const OATH_PRIDE_CAP = 2;
export const OATH_ACCEPT_THRESHOLD = 0.85;
export const OATH_GIFT_DAYS = 30;
export const OATH_GIFT_RESERVE = 150;
export const OATH_THREAT_RADIUS_HEXES = 6;
export const OATH_NO_THREAT_PROTECTION = 0.5;
export const OATH_COERCE_WINDOW_DAYS = 5;
export const OATH_COERCE_MIN_SIEGE_TICKS = 36;
export const OATH_RESWEAR_COOLDOWN_DAYS = 20;
export const OATH_RIVAL_MARGIN = 0.1;

// ── What the oath carries ──
export const FEALTY_TAX_SHARE = 0.3;

// ── Loyalty ──
export const LOYALTY_START = { persuaded: 0.7, bought: 0.6, coerced: 0.35 } as const;
export const LOYALTY_RISE_FLUSH = 0.01;
export const LOYALTY_FALL_STRAINED = 0.005;
export const LOYALTY_FALL_BANKRUPT = 0.01;
export const LOYALTY_FAIL_DEFENCE = 0.15;
export const LOYALTY_FALL_OUTGROWN = 0.02;
export const LOYALTY_FALL_RIVAL_OFFER = 0.02;
export const OATH_BREAK_THRESHOLD = 0.2;
export const REBELLION_INCOME_RATIO = 0.5;

// ── Crown ──
export const CROWN_MIN_OATHS = 2;

// ── Who never swears ──
export const NEVER_SWEAR_DEF_IDS: readonly string[] = ['thieves_guild', 'underking_court'];
export const NEVER_SWEAR_GUILD_TYPES: readonly string[] = ['thieves'];
