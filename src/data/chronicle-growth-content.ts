/**
 * Chronicle growth content — how a mortal's growth reads in the Chronicle (THR-1986).
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: edit the tier-up sentence here. It must never carry a
 * tier number or a `Q` — the reach word and the granted title say it.
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Master switch for the Chronicle growth gate. On: a tier-up, a rarity
 * graduation or a critical success enters the Chronicle only for a mortal the
 * god holds a thread to. Off: every one enters, as before THR-1986.
 */
export const CHRONICLE_THREADED_GROWTH_ONLY = true;

/**
 * A threaded mortal's tier-up, as the Chronicle reads it. `{word}` is the reach
 * word from the scale the mortal's card prints (`getCapabilityWord`), already
 * carrying its article when it is a noun ("an oracle"); `{reach}` is the reach
 * in title case; `{trait}` is the title the tier granted.
 */
export const CHRONICLE_TIER_UP_LINE = '{name} is now {word} in {reach} and is called {trait}.';
