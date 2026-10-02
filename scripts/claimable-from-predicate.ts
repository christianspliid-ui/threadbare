/**
 * THR-1694 — the `Claimable from:` hold, read before the claim.
 *
 * ## The problem this closes
 *
 * A ticket handed off under a veto window (the design lane's
 * `DESIGN_LANE_VETO_WINDOW_HOURS`, a design session's "let Christian veto first")
 * sits in `Ready for Dev` while the window is open. The hold used to live only in a
 * comment, and `pull-work` reads comments *after* claiming (claim-before-read,
 * impediment row 48). So the hourly pickup claimed the held ticket, read the hold,
 * released it and exited — every hour until the window closed. On 2026-10-01 THR-1687
 * made six In Dev → Ready for Dev round trips (07:11 … 12:11Z) and the whole queue
 * (THR-1572, THR-1686, THR-1687) read as three claimable items while holding none
 * (impediment row 1121).
 *
 * ## The fix shape
 *
 * Whoever hands off under a hold writes one machine-readable line into the issue
 * **description** — `Claimable from: <ISO-8601 UTC>` — and `pull-work` Step 1 drops
 * any candidate whose time is still in the future. The description is already in the
 * board-scan response, so this is a filter on data already read: claim-before-read is
 * untouched. A ticket with no line, or a line that does not parse, stays claimable —
 * a malformed hold must never hide work (the THR-845 lesson: silent absence from the
 * queue is the worst shape a queue bug can take).
 *
 * Living in its own module, like `coordination-block-predicate.ts`, so the rule has
 * one runnable definition that tests pin and the skills point at.
 */

/**
 * Line-anchored, tolerant of markdown emphasis around the label (`**Claimable from:**`)
 * and of the value sitting in backticks. The value itself must be an ISO-8601 instant
 * that `Date.parse` accepts; anything else is treated as no hold.
 */
export const CLAIMABLE_FROM_LINE_PATTERN =
  /^[ \t>*_-]*\**Claimable from:\**[ \t]*`?([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+(?:Z|[+-][0-9]{2}:?[0-9]{2}))`?/gim;

/**
 * The hold time a description declares, or `null` when it declares none (or only unparseable ones).
 * Writers replace an existing line, but if a re-handoff leaves a stale one behind, the **latest**
 * time wins: honouring the longer hold costs at most a delayed pickup, while honouring the older one
 * would build the ticket inside a veto window that is still open.
 */
export function parseClaimableFrom(description: string | null | undefined): Date | null {
  let latest: number | null = null;
  for (const match of (description ?? "").matchAll(CLAIMABLE_FROM_LINE_PATTERN)) {
    const ms = Date.parse(match[1]);
    if (!Number.isNaN(ms) && (latest === null || ms > latest)) latest = ms;
  }
  return latest === null ? null : new Date(latest);
}

/** True when the description holds the ticket past `now`. The boundary instant is claimable. */
export function isHeld(description: string | null | undefined, now: Date): boolean {
  const from = parseClaimableFrom(description);
  return from !== null && from.getTime() > now.getTime();
}

export type QueueCandidate = { id: string; description?: string | null };

export type HeldCandidate<T extends QueueCandidate> = { candidate: T; claimableFrom: Date };

export type HoldPartition<T extends QueueCandidate> = {
  /** Candidates that may be claimed now, in input order. */
  claimable: T[];
  /** Candidates still inside their hold, in input order. */
  held: HeldCandidate<T>[];
  /** The earliest hold expiry, so an all-held queue can say when it opens. `null` when nothing is held. */
  earliestRelease: Date | null;
};

/** Split the `Ready for Dev` candidates into claimable and held, before the priority sort. */
export function partitionHeldCandidates<T extends QueueCandidate>(candidates: readonly T[], now: Date): HoldPartition<T> {
  const claimable: T[] = [];
  const held: HeldCandidate<T>[] = [];
  for (const candidate of candidates) {
    const from = parseClaimableFrom(candidate.description);
    if (from !== null && from.getTime() > now.getTime()) held.push({ candidate, claimableFrom: from });
    else claimable.push(candidate);
  }
  const earliestRelease = held.reduce<Date | null>(
    (min, h) => (min === null || h.claimableFrom < min ? h.claimableFrom : min),
    null,
  );
  return { claimable, held, earliestRelease };
}

/** The trace lines `pull-work` Step 1 emits — one per held candidate, plus the all-held verdict. */
export function formatHoldTrace<T extends QueueCandidate>(partition: HoldPartition<T>): string[] {
  const lines = partition.held.map(
    (h) => `[pull-work] skipped ${h.candidate.id} — claimable from ${h.claimableFrom.toISOString()}`,
  );
  if (partition.claimable.length === 0 && partition.earliestRelease !== null) {
    lines.push(`[pull-work] Step 1: queue held until ${partition.earliestRelease.toISOString()} — no claimable work.`);
  }
  return lines;
}
