/**
 * Rebuke — the god's answer to a rival's landed hand (THR-2209, slice 3 of
 * `Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md`).
 *
 * The card's id and the lines its cast leaves behind. The numbers live in
 * `rival-scheme-config.ts` (`RIVAL_REBUKE_*`); the card's own text lives on its
 * template in `unified-action-templates.ts`; the toast lines live with the other
 * landing lines in `rival-content.ts`. No number reaches the player here.
 */

/** The location card that answers a rival on the place it just pressed. */
export const RIVAL_REBUKE_TEMPLATE_ID = 'loc.rebuke_rival';

/** The cast receipt's title. */
export const RIVAL_REBUKE_RECEIPT_TITLE = 'Rebuke';

/**
 * The cast reply. `{rival}` is the rival god's name, `{place}` the place.
 * `landed`: a clean landing (tended and pushed back). `crooked`: tended, nothing restored.
 */
export const RIVAL_REBUKE_REPLY = {
  landed: "You turned {rival}'s hand from {place}. The place holds against it for a few days.",
  crooked: 'The place holds against {rival} for a few days, but what it took stays taken.',
} as const;

/** Empty-slot fallbacks (PC-3: never a raw slot). */
export const RIVAL_REBUKE_RIVAL_FALLBACK = 'a rival god';
export const RIVAL_REBUKE_PLACE_FALLBACK = 'the place';

/** Fill the cast reply's slots; an empty slot reads its fallback. */
export function rivalRebukeReply(
  kind: keyof typeof RIVAL_REBUKE_REPLY,
  rivalName: string | undefined,
  placeName: string | undefined,
): string {
  const rival = rivalName && rivalName.trim() ? rivalName : RIVAL_REBUKE_RIVAL_FALLBACK;
  const place = placeName && placeName.trim() ? placeName : RIVAL_REBUKE_PLACE_FALLBACK;
  const line = RIVAL_REBUKE_REPLY[kind].replace('{rival}', rival).replace('{place}', place);
  return line.charAt(0).toUpperCase() + line.slice(1);
}
