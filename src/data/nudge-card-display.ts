/**
 * Nudge card display vocabulary — THR-890 (UI pillar of the locked card format).
 *
 * The keyword chip's icons, the essence pip glyph, and the alternate-cost
 * channel icons. Every player-facing glyph and word the card row draws that is
 * not already owned by `nudge-stage-content.ts` (prose) or
 * `nudge-pip-vocabulary.ts` (odds) lives here (NFP #1).
 *
 * **No parallel type field.** The keyword a card prints is derived from its
 * `libraryCardId` through `NUDGE_CARD_LIBRARY` — the card type union is the
 * library's, and this file only decorates it. Adding a `typeId` to `StepNudge`
 * would mint a second authority on what a card *is*, which is exactly the drift
 * the library exists to prevent; an authored one-off with no `libraryCardId`
 * simply prints no chip.
 *
 * Spec: `Docs/plans/2026-07-30-nudge-card-repertoire.md` § Decision 4.
 */

import {
  NUDGE_CARD_TYPES,
  nudgeCardMember,
  type NudgeCardTypeId,
} from './nudge-card-library';

/** One essence pip. Cost is drawn, never counted out in digits. */
export const ESSENCE_PIP_GLYPH = '✦';

/**
 * Most essence pips drawn before the row collapses to a glyph and an overflow
 * mark. Authored nudge costs run 0–3, so this is headroom rather than a limit
 * anything hits today — it exists so a future 12-cost card degrades to a
 * readable row instead of a wall of glyphs.
 */
export const MAX_COST_PIPS = 6;

/** Drawn once after a capped cost row to say "and more than this". */
export const COST_OVERFLOW_GLYPH = '⋯';

/**
 * Keyword icon per card type. One glyph, chosen to read at chip size and to
 * carry the type's *feel* rather than to illustrate it literally.
 *
 * Keyed on the live {@link NudgeCardTypeId} union, so a type added to the
 * library without an icon here is a type error rather than a blank chip.
 */
export const NUDGE_CARD_TYPE_ICONS: Readonly<Record<NudgeCardTypeId, string>> = {
  boost: '◈',
  heavy_hand: '✊',
  insurance: '⛨',
  mercy: '☙',
  gambit: '⚄',
  side_bet: '⚂',
  long_game: '⧗',
  whisper: '❧',
  trait_card: '❖',
  signature: '✶',
  bargain: '⚖',
  undertow: '≈',
  stumble: '⤫',
  kindled_ambition: '✧',
  omen: '☄',
  cache: '◫',
  balm: '❦',
  veil: '☁',
  favor: '⚭',
  fellowship: '⚯',
  compulsion: '➶',
};

export interface NudgeCardKeyword {
  readonly typeId: NudgeCardTypeId;
  /** Player-facing keyword, as printed on the card. */
  readonly keyword: string;
  readonly icon: string;
}

/**
 * The keyword a library-backed card prints, or `undefined` for a one-off
 * authored option that is not in the library.
 *
 * Fail-soft (NFP #4): an id that names no library member — a retired card an old
 * template still deals — yields `undefined` and the card renders chipless rather
 * than throwing on the encounter stage.
 */
export function nudgeCardKeyword(libraryCardId: string | undefined): NudgeCardKeyword | undefined {
  if (!libraryCardId) return undefined;
  const member = nudgeCardMember(libraryCardId);
  if (!member) return undefined;
  const type = NUDGE_CARD_TYPES.find((t) => t.id === member.typeId);
  if (!type) return undefined;
  return {
    typeId: member.typeId,
    keyword: type.keyword,
    icon: NUDGE_CARD_TYPE_ICONS[member.typeId],
  };
}

/** Cost channels beyond essence — the keys of `NudgeCostChannels`. */
export type NudgeCostChannelId = 'detection' | 'doom';

export interface NudgeCostChannelDisplay {
  readonly icon: string;
  /** Plain-language price, shown beside the icon. Never a numeral. */
  readonly label: string;
}

/**
 * How a non-essence price reads. A card that is cheap or free in essence and
 * paid for somewhere else says so on its face — that is the whole design of The
 * Heavy Hand, The Veil, and The Bargain, and hiding it would make "Free" a lie.
 *
 * Each channel carries both directions because the deltas are signed: a card can
 * calm the doom clock as easily as accelerate it.
 */
export const NUDGE_COST_CHANNEL_DISPLAY: Readonly<
  Record<NudgeCostChannelId, { readonly worse: NudgeCostChannelDisplay; readonly better: NudgeCostChannelDisplay }>
> = {
  detection: {
    worse: { icon: '👁', label: 'Someone will notice' },
    better: { icon: '👁', label: 'Draws the eye away' },
  },
  doom: {
    worse: { icon: '⧖', label: 'The hour comes sooner' },
    better: { icon: '⧖', label: 'The hour comes slower' },
  },
};
