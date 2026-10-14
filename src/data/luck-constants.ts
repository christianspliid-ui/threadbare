/**
 * Luck protection — tunable constants.
 *
 * Game Design Laws § I, Randomness and luck (`Docs/game-design/laws.md`).
 * Plan: `Docs/plans/2026-10-14-luck-protection-and-tier-first-loot.md`.
 *
 * Luck protection covers only the player's own mortals — those carrying a
 * `thread` edge from the player's ascendant. Everything else in the world rolls
 * plain dice (Law 4).
 *
 * | Name                          | Default | Purpose                                                        |
 * |-------------------------------|---------|----------------------------------------------------------------|
 * | LUCK_BAG_ENABLED              | true    | Master switch for the marble bag; `false` restores plain dice  |
 * | LUCK_BAG_SLICES               | 10      | Slices of the d100 per bag — one roll per slice per bag        |
 * | LEGENDARY_DEADLINE_ENABLED    | true    | Master switch for the hidden Legendary deadline                |
 * | LEGENDARY_DEADLINE_MIN_WINS   | 30      | Earliest win on which a Legendary can be forced                |
 * | LEGENDARY_DEADLINE_MAX_WINS   | 50      | Latest win on which a Legendary is forced                      |
 */

// ─── The marble bag (Laws 4, 5, 8) ─────────────────────────────────────

/** Master switch. `false` gives every roller plain dice, exactly as before. */
export const LUCK_BAG_ENABLED = true;

/**
 * How many slices of the d100 one bag holds. Each bag deals every slice once,
 * in a seeded order, so over any full bag the rolls cover the whole range
 * evenly — the odds the forecast shows are exactly what the bag delivers — while
 * the order inside the bag stays random.
 *
 * Smaller bags cut streaks harder and feel more predictable; larger bags feel
 * more like plain dice. At 10 and even odds the longest losing run a bag can
 * build is about ten (five at the end of one bag, five at the start of the next);
 * plain dice have no ceiling.
 * @range a divisor of 100, 4–20
 */
export const LUCK_BAG_SLICES = 10;

// ─── The Legendary deadline (Laws 3, 5, 7) ─────────────────────────────

/** Master switch. `false` removes the hidden deadline; the tier roll alone decides. */
export const LEGENDARY_DEADLINE_ENABLED = true;

/**
 * The hidden deadline is predetermined: when a protected mortal's Legendary
 * cycle starts, a seeded roll fixes the win by which the next Legendary will have
 * arrived, somewhere in `[MIN, MAX]`. Luck can bring it earlier; the deadline
 * only catches the long droughts. A "win" is a prize draw (not a harm draw) whose
 * tier curve can reach Legendary at all — a success or a critical success.
 *
 * Calibrated against the measured cadence of the First's prize draws (plan §
 * Measurements). The window is a range, not a fixed number, so the guarantee
 * cannot be counted down and saved for the best encounter (Law 5, fixed limit).
 * @range MIN 10–100, MAX ≥ MIN
 */
export const LEGENDARY_DEADLINE_MIN_WINS = 30;
/** @range ≥ LEGENDARY_DEADLINE_MIN_WINS */
export const LEGENDARY_DEADLINE_MAX_WINS = 50;
