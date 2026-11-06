/**
 * THR-2185 — the lines of a rival god's opened entry in the Rival gods panel.
 *
 * A rival is run state, not a graph node, so it has no sheet; its panel entry is the
 * sheet. Below the spheres line the entry says why its temper is what it is (the
 * cause line), where its hand last landed (a place link), and how the god answers it.
 * Pure over the rival state, the tick and a place-name lookup; the words live in the
 * `ui.rival.*` tooltip registry (`data/ui-content.ts`), with fallbacks here so a
 * surface without the registry still reads a sentence (Law 43: never a raw token).
 *
 * Plan: `Docs/plans/2026-11-06-thr-2172-a-rival-move-has-a-place-and-an-answer.md` § Decisions 5–6.
 */
import type { RivalState } from '../../types/rival';
import { resolveTooltip } from '../tooltipResolver';
import { countWord } from '../aftermathWords';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { RIVAL_HOSTILITY_CAUSE_STALE_DAYS } from '../../data/rival-scheme-config';

/** One run of an entry line: words, or a place that links. */
export type RivalLineSegment = { text: string } | { placeId: string; name: string };

/** A place's display name, or undefined when it no longer resolves. */
export type PlaceNameLookup = (placeId: string) => string | undefined;

const FALLBACK_WORDS: Record<string, string> = {
  'ui.rival.cause_scheme': 'Its scheme against {place} is under way.',
  'ui.rival.cause_scheme_noplace': 'Its scheme is under way.',
  'ui.rival.cause_countered': 'You broke its scheme against {place}.',
  'ui.rival.cause_countered_noplace': 'You broke one of its schemes.',
  'ui.rival.cause_cooling': 'and cooling',
  'ui.rival.cause_none': 'as rival gods are',
  'ui.rival.last_pressed': 'Last pressed {place}, {when}.',
  'ui.rival.answer': 'Places you tend shrug off its hand. Your seat, your threaded, a claim, or an anointed faction tends one.',
};

/** The registry's words for a `ui.rival.*` id, or the fallback. */
export function rivalWords(id: string): string {
  return resolveTooltip(id)?.desc ?? FALLBACK_WORDS[id] ?? '';
}

/** Fill a template's tokens, splitting it on `{place}` so the place can render as a link. */
function withPlace(
  template: string,
  place: { placeId: string; name: string } | null,
  fills: Record<string, string> = {},
): RivalLineSegment[] {
  const filled = template.replace(/\{(\w+)\}/g, (m, k: string) => (k === 'place' ? m : fills[k] ?? m));
  const parts = filled.split('{place}');
  if (parts.length < 2 || !place) return [{ text: filled }];
  const out: RivalLineSegment[] = [];
  if (parts[0]) out.push({ text: parts[0] });
  out.push(place);
  const rest = parts.slice(1).join(place.name);
  if (rest) out.push({ text: rest });
  return out;
}

/**
 * What follows "Toward you: {temper word}": no cause yet → ", as rival gods are.";
 * a cause older than `RIVAL_HOSTILITY_CAUSE_STALE_DAYS` days → ", and cooling.";
 * otherwise ". " and the cause sentence, its place a link while the place resolves.
 */
export function rivalCauseSegments(
  state: RivalState | undefined,
  tick: number,
  placeName: PlaceNameLookup,
): RivalLineSegment[] {
  const cause = state?.hostilityCause;
  if (!cause) return [{ text: `, ${rivalWords('ui.rival.cause_none')}.` }];
  if (tick - cause.tick >= RIVAL_HOSTILITY_CAUSE_STALE_DAYS * TICKS_PER_DAY) {
    return [{ text: `, ${rivalWords('ui.rival.cause_cooling')}.` }];
  }
  const name = cause.placeId ? placeName(cause.placeId) : undefined;
  const place = cause.placeId && name ? { placeId: cause.placeId, name } : null;
  const key = cause.kind === 'countered' ? 'ui.rival.cause_countered' : 'ui.rival.cause_scheme';
  return [{ text: '. ' }, ...withPlace(rivalWords(place ? key : `${key}_noplace`), place)];
}

/** "today", "yesterday", or "{n} days ago" spelled out (Law 13). */
export function rivalWhenWords(ticksAgo: number): string {
  const days = Math.max(0, Math.floor(ticksAgo / TICKS_PER_DAY));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${countWord(days)} days ago`;
}

/** "Last pressed {place}, {when}.", or null when nothing has landed or the place is gone. */
export function rivalLastPressedSegments(
  state: RivalState | undefined,
  tick: number,
  placeName: PlaceNameLookup,
): RivalLineSegment[] | null {
  const last = state?.lastPressed;
  if (!last) return null;
  const name = placeName(last.placeId);
  if (!name) return null;
  return withPlace(
    rivalWords('ui.rival.last_pressed'),
    { placeId: last.placeId, name },
    { when: rivalWhenWords(tick - last.tick) },
  );
}

/** Flatten segments to plain text (aria labels, tests). */
export function segmentsText(segments: readonly RivalLineSegment[]): string {
  return segments.map((s) => ('text' in s ? s.text : s.name)).join('');
}
