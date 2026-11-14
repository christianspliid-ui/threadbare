/**
 * Attention content — the player-facing words of the firing rhythm (THR-1218 /
 * THR-1959). Numbers live in `agent-behavior-constants.ts`; this file holds text.
 */

/**
 * The Chronicle line when a paused mortal's story drought sends her on the road
 * (THR-1959). `{name}` and `{place}` are filled with declared references, so both
 * render as links (UI Laws 2, 21); the line is never parsed for them.
 */
export const RESTLESS_ROAD_LINE = '{name} grows restless and takes the road to {place}.';

/** Stands in for an unresolvable destination name, so no `{token}` reaches the screen (UI Law 43). */
export const RESTLESS_ROAD_FALLBACK_PLACE = 'a far place';

/** Stands in for an unresolvable mortal name. */
export const RESTLESS_ROAD_FALLBACK_NAME = 'A mortal';

/**
 * THR-2214 — the path's road: The First sets out for the nearest place whose
 * stories fit the path the god chose. `{name}` and `{place}` are segments with
 * references (links, as the restless road's); `{path}` is `firstPathInLine`
 * ("the uniter of the clans"). Unresolvable names use the restless road's
 * fallbacks (UI Law 43).
 */
export const FIRST_PATH_ROAD_LINE = '{name} takes the road to {place}, where {path} has work.';
