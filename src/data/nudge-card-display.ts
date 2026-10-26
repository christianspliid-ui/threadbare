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
import type { IconName } from './icons/iconRegistry';
import { PIP_ODDS_TIERS, oddsPips } from './nudge-pip-vocabulary';

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
 * The carved icon per card type (THR-1904, plan THR-1879 Appendix B). The keyword chip draws it
 * (THR-1906) and so does the picture band's fallback tile; the text-glyph column it replaced is
 * gone (THR-1907). Keyed on the live {@link NudgeCardTypeId} union, so a type added to the library
 * without an icon here is a type error rather than a blank chip.
 * Several types draw an idea another class shares (`kindled_ambition` → `ambition`, `whisper` →
 * `reveal`): one meaning, one shape.
 */
export const NUDGE_CARD_TYPE_ICON_NAMES: Readonly<Record<NudgeCardTypeId, IconName>> = {
  boost: 'boost',
  heavy_hand: 'heavy-hand',
  insurance: 'insurance',
  mercy: 'mercy',
  gambit: 'gambit',
  side_bet: 'side-bet',
  long_game: 'long-game',
  whisper: 'reveal',
  trait_card: 'trait',
  signature: 'signature',
  bargain: 'bargain',
  undertow: 'undertow',
  stumble: 'stumble',
  kindled_ambition: 'ambition',
  omen: 'omen',
  cache: 'cache',
  balm: 'balm',
  veil: 'veil',
  favor: 'favour',
  fellowship: 'company',
  compulsion: 'compel',
};

export interface NudgeCardKeyword {
  readonly typeId: NudgeCardTypeId;
  /** Player-facing keyword, as printed on the card. */
  readonly keyword: string;
  /** The carved icon for the card type (THR-1906). */
  readonly iconName: IconName;
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
    iconName: NUDGE_CARD_TYPE_ICON_NAMES[member.typeId],
  };
}

// ─── Glyph legend (THR-972) ─────────────────────────────────────────

/**
 * The three glyph vocabularies a card draws, named.
 *
 * The director's find, 2026-08-02: *"on the cards there are three different icon
 * types. help me understand which is which."* They were genuinely ambiguous —
 * an essence price and an odds contribution both rendered as a small row of
 * repeated glyphs, so two vocabularies meaning **opposite** things (what you
 * spend vs. what you gain) were distinguishable only by glyph shape at 12px.
 *
 * The structural half of the fix is in the components: cost now renders as a
 * framed price badge rather than a pip row, so the two stop sharing a silhouette.
 * This legend is the naming half — a player who wants the vocabulary spelled out
 * gets it in one glance instead of inferring it from context.
 *
 * Ordered as the card reads them: price first (top-right), then the odds row,
 * then the setback that only some cards carry.
 */
export interface NudgeGlyphLegendEntry {
  readonly id: 'price' | 'odds' | 'setback';
  readonly glyph: string;
  /** One or two words. This is a legend, not an explanation — the tooltip explains. */
  readonly label: string;
}

/** THR-2061 — the odds entry's words: the hollow pip is named by what filling it means. */
export const NUDGE_ODDS_LEGEND_LABEL = 'odds: more filled is stronger';

/**
 * The odds entry's glyphs for a set of tiers, weakest first: the weakest tier's
 * filled and hollow shapes together (`●○`), then each stronger tier's filled
 * shape. One hollow is enough to name ○ — a mixed hand's hollow is the lowest
 * present tier's (plan grey zone). Empty for no tiers.
 */
export function nudgeOddsLegendGlyph(tierIndexes: readonly number[]): string {
  const tiers = [...new Set(tierIndexes)]
    .filter((i) => i >= 0 && i < PIP_ODDS_TIERS.length)
    .sort((a, b) => a - b)
    .map((i) => PIP_ODDS_TIERS[i]);
  if (tiers.length === 0) return '';
  const [lowest, ...rest] = tiers;
  return [`${lowest.filledGlyph}${lowest.hollowGlyph}`, ...rest.map((t) => t.filledGlyph)].join(' ');
}

const PRICE_ENTRY: NudgeGlyphLegendEntry = { id: 'price', glyph: ESSENCE_PIP_GLYPH, label: 'price' };
const SETBACK_ENTRY: NudgeGlyphLegendEntry = { id: 'setback', glyph: '▼', label: 'setback' };

/** The full legend — every odds tier. A surface with a hand uses {@link nudgeGlyphLegendForHand}. */
export const NUDGE_GLYPH_LEGEND: readonly NudgeGlyphLegendEntry[] = [
  PRICE_ENTRY,
  // THR-1985 — the whole pip ladder, so ★ reads as the strongest odds, not the price.
  { id: 'odds', glyph: nudgeOddsLegendGlyph(PIP_ODDS_TIERS.map((_, i) => i)), label: NUDGE_ODDS_LEGEND_LABEL },
  SETBACK_ENTRY,
];

/**
 * THR-2061 (plan U6) — the legend for this hand: the odds entry shows only the
 * pip shapes the hand's cards actually carry (each card's `forecastDelta`, read
 * through the same `oddsPips` the card face draws with). A hand whose cards move
 * no positive odds shows price and setback only. Pure.
 */
export function nudgeGlyphLegendForHand(forecastDeltas: readonly number[]): NudgeGlyphLegendEntry[] {
  const tierIndexes: number[] = [];
  for (const delta of forecastDeltas) {
    const reading = oddsPips(delta);
    if (reading?.polarity !== 'gain') continue;
    const index = PIP_ODDS_TIERS.indexOf(reading.tier);
    if (index >= 0) tierIndexes.push(index);
  }
  const glyph = nudgeOddsLegendGlyph(tierIndexes);
  return glyph
    ? [PRICE_ENTRY, { id: 'odds', glyph, label: NUDGE_ODDS_LEGEND_LABEL }, SETBACK_ENTRY]
    : [PRICE_ENTRY, SETBACK_ENTRY];
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
