/**
 * `CONTENT_TAG_RETROFIT_PENDING` — the closed tag vocabulary's ratchet. THR-1486,
 * slice 2 of THR-1481.
 *
 * `undertakingRetrofitPending.ts` and `retrofitPending.ts` are the siblings and set
 * the rules; this file inherits them without restating the reasoning:
 *
 * **What it is.** Every catalog-entry id here is allowed to carry a tag that is not in
 * `CONTENT_TAGS` without failing CI. Everything *not* here must carry seated tags only.
 *
 * **Why a named list and not a count.** A threshold lets a new unseated tag hide behind
 * a grandfathered one. A named list cannot: adding an entry means adding its id in a
 * diff someone reviews, and `contentTags.test.ts` refuses any id that is not already
 * here.
 *
 * **It only ever shrinks**, and `contentTags.test.ts` fails **both ways** — a listed
 * entry whose tags are now all seated is stale and fails, and an unlisted entry with an
 * unseated tag fails. That is what makes the empty state below load-bearing rather than
 * decorative: with nothing listed, *any* unseated tag anywhere in the catalogs is a
 * failure by name.
 *
 * **It is empty, and that is the migration's result, not an oversight.** The slice-2
 * sweep rewrote sixteen bare spellings onto their `#` form and removed sixty-three
 * spellings that had neither a runtime reader nor
 * `CONTENT_TAG_MIN_BEARERS` bearers, which left no entry carrying an unseated tag. The
 * file exists anyway for the reason a ratchet exists at all: the *next* author who adds
 * a tag without seating it needs somewhere legible to be told no, and a list that has to
 * be created in the same commit as the first offender is a list that gets created
 * generously. An empty ratchet is also what let the catalog-entry types tighten to
 * `readonly ContentTag[]` in this same slice (THR-1486 scope item 6).
 *
 * **This is not an exemption mechanism.** Per-entry, temporary, one direction of travel.
 * A tag an author wants back is seated in `content-tags.ts` by a design-session
 * decision recorded on `Docs/canon/content-objects.md` — never parked here.
 */
export const CONTENT_TAG_RETROFIT_PENDING: readonly string[] = [];

const PENDING_SET: ReadonlySet<string> = new Set(CONTENT_TAG_RETROFIT_PENDING);

/** Membership test, so callers do not each build their own Set. */
export function isContentTagRetrofitPending(entryId: string): boolean {
  return PENDING_SET.has(entryId);
}
