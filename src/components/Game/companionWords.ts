import { reachDisplayName } from '../../engine/aftermathWords';

/**
 * Which Reaches a companion steadies, in words (THR-1413, shared by THR-1421).
 *
 * Deliberately *not* the raw term (`+3 iron`). That is a numeral on a
 * player-facing surface — Law 13 — and a raw internal reach key besides — Law
 * 14. Banding the value instead would mean inventing a ladder for the raw
 * contribution scale, which Law 15 makes a ruling rather than an implementation
 * choice. So this names the Reaches and lets the authored `goodFor` line carry
 * the "how much" as fiction, which is what the player can actually act on.
 * The exact term stays where Law 13 puts it: in the trace and the designer view.
 *
 * **Why it lives here rather than in either component.** It was born local to
 * `AscendantSheet` while `AttachmentsTab` rendered the same companion as signed
 * deltas — one companion described two ways on two surfaces, which is the state
 * THR-1421 existed to end. Copying the function would have ended it for exactly
 * as long as the copies stayed in step. Sharing it makes parity structural: a
 * future change to the wording reaches both surfaces or neither.
 *
 * Contributions are positive by construction — `COMPANION_CONTRIBUTION_RANGE`
 * is `{ min: 1, max: 3 }`, pinned by the template library test — so the `v > 0`
 * filter drops nothing a companion can actually carry. It is a guard against a
 * malformed entry, not a silent policy on penalties; a companion that ever
 * *costs* a Reach needs its own wording, and that is a ruling under Law 15.
 */
export function companionReachLine(contributions: Record<string, number>): string {
  const reaches = Object.entries(contributions)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([reach]) => reachDisplayName(reach));

  if (reaches.length === 0) return 'No help in any Reach — just company.';
  if (reaches.length === 1) return `Steadies your ${reaches[0]}.`;
  return `Steadies your ${reaches.slice(0, -1).join(', ')} and ${reaches[reaches.length - 1]}.`;
}
