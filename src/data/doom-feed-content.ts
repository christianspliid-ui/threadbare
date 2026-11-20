/**
 * The Doom feeds at a place — the player-facing lines (THR-2255, slice 1 of
 * `Docs/plans/2026-11-19-thr-2247-dooms-last-stage-is-a-stand.md`, Player-facing text table).
 *
 * The numbers live in `game-config.ts` (`DOOM_FEED_*`, `DOOM_REBUKE_*`). The held
 * complication lines live on their templates (`heldProse` in `complication-templates.ts`);
 * the Rebuke result lines live with Rebuke's own (`rival-rebuke-content.ts`). Words
 * only, no numbers (UI Law 13). `{place}` is a top-level place's name.
 */

/** Added to a fed complication line while the god holds Rebuke (PC-9: name the answer). */
export const DOOM_FEED_REBUKE_SENTENCE = 'Rebuke it at {place} and the doom finds nothing there.';

/** Added to the stage notice when the Doom enters its last stage (PC-7: what the stand is). */
export const DOOM_FEED_LAST_STAGE_LINE = 'From here a failure can feed the doom. Ground you tend starves it.';

/** The last-stage daily alert (non-pausing; opens the place). */
export const DOOM_FEED_ALERT_LINE = 'The doom fed at {place}. Rebuke it there.';

/** Empty-slot fallbacks (PC-3: never a raw slot). */
export const DOOM_FEED_PLACE_FALLBACK = 'that place';
export const DOOM_FEED_NAME_FALLBACK = 'A mortal';

/** Fill `{place}` and `{name}`; an empty slot reads its fallback. */
export function fillDoomFeedLine(line: string, placeName: string | undefined, name?: string): string {
  const place = placeName && placeName.trim() ? placeName : DOOM_FEED_PLACE_FALLBACK;
  const who = name && name.trim() ? name : DOOM_FEED_NAME_FALLBACK;
  const filled = line.replace(/\{place\}/g, place).replace(/\{name\}/g, who);
  return filled.charAt(0).toUpperCase() + filled.slice(1);
}
