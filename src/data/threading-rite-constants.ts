/**
 * Threading rite tunables (THR-1644, plan `Docs/plans/2026-10-06-thr-1644-threading-ceremony.md`).
 *
 * S1 ships the engine half — one writer, The First is the first, the pending
 * rite and its no-hand fallback. The UI-side counts (tests per shape, the
 * bond-only hand size) and the First's mark land with S2 and S3, beside the code
 * that reads them.
 */

/**
 * D2 — threads 2..N play the short rite (one formative test, then the bond);
 * every later thread plays the bond alone. The first thread always plays the
 * full rite, and a new First plays it whatever its ordinal.
 */
export const RITE_SHORT_MAX_ORDINAL = 3;

/**
 * D1 — how far a rite bends an existing mortal's value pole, relative to a soul
 * the meeting has just invented (scale 1). A grown mortal already has a self;
 * the rite bends it, it does not write it.
 */
export const RITE_EXISTING_MORTAL_SHIFT_SCALE = 0.5;

/**
 * Pending rites held behind the one that is open. A thread beyond this resolves
 * at once as the bond alone, with no hand, and the overflow is traced.
 */
export const RITE_QUEUE_MAX = 3;

/**
 * S1 → S2 switch. While no rite surface exists to open a pending rite, the
 * engine resolves each one at once as *Bond without a hand* (D6): the bond
 * rolls on its seeded stream with no cards and the reception lands. On since
 * S2 (THR-1754): the `ThreadingRite` modal opens the pending rite, so it waits
 * for the player instead. Off again turns the rite back into an instant,
 * no-hand bond everywhere without touching the surface.
 */
export const RITE_SURFACE_ENABLED = true;

// ─── The rite on screen (S2 — THR-1754) ───────────────────────────

/** Formative tests in a card-route First's rite (the meeting keeps its own 2–3). */
export const RITE_FULL_TEST_COUNT_CARD_ROUTE = 2;

/** Formative tests in the short rite (threads 2..`RITE_SHORT_MAX_ORDINAL`). */
export const RITE_SHORT_TEST_COUNT = 1;

/**
 * Cards offered in the bond-only rite — the first N of the meeting's own bond
 * hand (`BOND_NUDGES`: "Still the room", then "Say their name").
 */
export const RITE_BOND_ONLY_HAND_SIZE = 2;

// ─── The First's mark (D5, S3 — THR-1755) ─────────────────────────

/**
 * Raw capability the mark adds in its reach — the scale of one companion's
 * `domainContributions` (`companion-templates.ts`: a Wayfarer is `stone: 2`).
 * Summed by `computeRawScore` like any trait, × the edge level (always 1).
 */
export const FIRST_MARK_REACH_CONTRIBUTION = 2;

/** Trait importance of a mark (feeds NPC importance; harmless on a threaded mortal). */
export const FIRST_MARK_IMPORTANCE = 0.8;

/** Turns D5 off without touching the rite: no mark is granted while false. */
export const FIRST_MARK_ENABLED = true;
