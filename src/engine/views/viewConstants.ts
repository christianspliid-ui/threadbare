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
