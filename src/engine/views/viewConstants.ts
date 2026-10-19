/**
 * The view-model seam's tunables (THR-1822, plan § Constants table).
 *
 * Constants for the later families (Connections, Find, Needs you, the knowledge
 * floor) join this file with the slice that builds their surface — plan § D16.
 */

/**
 * Upper bound on cached view models per session. When a new entry would pass it,
 * the entry read longest ago is evicted. Sized for a long Inspector history plus
 * the map, lens, Find and Needs-you entries; correctness never depends on a hit.
 */
export const VIEW_CACHE_MAX_ENTRIES = 128;

/**
 * Rows a long Connections group keeps when a docked page must fold to fit (THR-1822 § D8,
 * THR-1876 § D6). Wide and Full ignore it — every group shows whole there (Law 57).
 */
export const CONNECTIONS_DOCKED_FOLD_AFTER = 6;

/**
 * THR-1875 (frame plan § F5) — a Needs-you News row lapses after this many attention
 * days (× `TICKS_PER_DAY` ticks). The alert router trims the channel by the same rule,
 * so the list and the channel never disagree. Raise it if players report news vanishing
 * before they read it (plan § Kill criteria).
 */
export const NEEDS_YOU_NEWS_KEEP_DAYS = 3;

/**
 * THR-1913 (Inspector plan § Constants, S5 Done-when) — one frame, in ms: the measured
 * ceiling for `actOnCounts` over a docked page's rendered rows on the seed-42 medium world
 * (and, with S6, for `buildArmedTargets`). Over it, plan kill criterion 6 applies: count
 * rows lazily as they scroll into view.
 */
export const INSPECTOR_VIEW_BUDGET_MS = 16;

/**
 * THR-1914 (Inspector plan § Constants) — how long "Illuminating Whisper left your hand.
 * Nothing was spent." stays in the banner (or as a toast) before it clears, in ms.
 */
export const ARMED_CLEARED_LINE_MS = 2500;

/**
 * THR-1914 — the lit strength of a hex holding only locked targets, as a fraction of a
 * castable hex's: 1 is as bright as castable, 0 as dim as a non-target. The dim plate on
 * such a hex is drawn at `LENS_DIM_ALPHA × (1 − ARMED_LOCKED_LIT)`.
 */
export const ARMED_LOCKED_LIT = 0.5;
