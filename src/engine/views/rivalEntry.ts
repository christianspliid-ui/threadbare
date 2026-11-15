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
import type { GameState } from '../../types/gameState';
import { resolveTooltip } from '../tooltipResolver';
import { rebukablePlaceIds, rebukeTargetFor } from '../rivalRebuke';
import { RIVAL_REBUKE_TEMPLATE_ID } from '../../data/rival-rebuke-content';
import { countWord } from '../aftermathWords';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { RIVAL_HOSTILITY_CAUSE_STALE_DAYS, RIVAL_HOSTILITY_START } from '../../data/rival-scheme-config';

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
  'ui.rival.answer_rebuke': 'Rebuke it at {place}, or tend your places.',
  'ui.rival.pressed_now': '{rival} pressed it {when}.',
  'ui.rival.pressed_answer_rebuke': 'Rebuke it here, or tend it, and its next blow is turned.',
  'ui.rival.pressed_answer_tend': 'A place you tend turns its next blow.',
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
    // A rival already back at its floor has nothing left to cool: it reads as rival gods do.
    const h = state?.hostilityToPlayer;
    const atFloor = typeof h !== 'number' || !Number.isFinite(h) || h <= RIVAL_HOSTILITY_START;
    return [{ text: `, ${rivalWords(atFloor ? 'ui.rival.cause_none' : 'ui.rival.cause_cooling')}.` }];
  }
  const name = cause.placeId ? placeName(cause.placeId) : undefined;
  const place = cause.placeId && name ? { placeId: cause.placeId, name } : null;
  const key = cause.kind === 'countered' ? 'ui.rival.cause_countered'
    : cause.kind === 'rebuked' ? 'ui.rival.cause_rebuked'
      : 'ui.rival.cause_scheme';
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

/**
 * The place-name lookup the panel reads (the view-model seam: components never query
 * the graph). A place with no name reads as gone, so its clause drops (fail-soft).
 */
export function rivalPlaceNameLookup(graph: { getNode(id: string): { name?: string } | undefined | null }): PlaceNameLookup {
  return (placeId) => {
    try {
      return graph.getNode(placeId)?.name || undefined;
    } catch {
      return undefined;
    }
  };
}

// ─── THR-2237: the answer is where the threat is ───────────────────────────

/** Whether the god holds Rebuke (the first-rebuke gift has been received). */
export function godHoldsRebuke(state: Pick<GameState, 'unlockedActionIds'>): boolean {
  return (state.unlockedActionIds ?? []).includes(RIVAL_REBUKE_TEMPLATE_ID);
}

/**
 * What a Rebuke can answer now: each rebukable place, keyed to the rival a Rebuke there
 * answers (`rebukeTargetFor` — the most recent unabsorbed, unrebuked landing).
 */
export interface RivalAnswerInputs {
  holdsRebuke: boolean;
  /** placeId → the rivalId a Rebuke cast there answers. */
  answeredBy: ReadonlyMap<string, string>;
}

/**
 * The entry's "How to answer it" line. While the god holds Rebuke and a Rebuke on this
 * rival's last-pressed place would answer *this* rival, it names the place: "Rebuke it at
 * {place}, or tend your places." Otherwise the tending line, as before. (Review gate,
 * THR-2237: another rival's fresher landing on the same place must not name it here.)
 */
export function rivalAnswerSegments(
  state: RivalState | undefined,
  answer: RivalAnswerInputs,
  placeName: PlaceNameLookup,
): RivalLineSegment[] {
  const placeId = state?.lastPressed?.placeId;
  if (answer.holdsRebuke && placeId && state && answer.answeredBy.get(placeId) === state.rivalId) {
    const name = placeName(placeId);
    if (name) return withPlace(rivalWords('ui.rival.answer_rebuke'), { placeId, name });
  }
  return [{ text: rivalWords('ui.rival.answer') }];
}

/** The panel's answer inputs, read once from state (the view-model seam; fail-soft). */
export function rivalAnswerInputs(
  state: Pick<GameState, 'unlockedActionIds' | 'rivalStates' | 'tick'> & Partial<Pick<GameState, 'unifiedActions'>>,
): RivalAnswerInputs {
  const answeredBy = new Map<string, string>();
  try {
    for (const placeId of rebukablePlaceIds(state)) {
      const target = rebukeTargetFor(state, placeId);
      if (target) answeredBy.set(placeId, target.rivalId);
    }
  } catch {
    // fail-soft: no answerable place
  }
  return { holdsRebuke: godHoldsRebuke(state), answeredBy };
}

/** A rival's landing the god can still answer: who pressed which place, and when. */
export interface RivalPressedView {
  readonly rivalId: string;
  readonly rivalName: string;
  readonly placeId: string;
  readonly placeName: string;
  readonly pressedAt: number;
}

type PressedReadState = Pick<GameState, 'rivalStates' | 'rivalDefinitions' | 'tick' | 'graph'>
  & Partial<Pick<GameState, 'unifiedActions'>>;

function pressedView(state: PressedReadState, placeId: string): RivalPressedView | null {
  const target = rebukeTargetFor(state, placeId);
  if (!target) return null;
  const rivalName = (state.rivalDefinitions ?? []).find(r => r.id === target.rivalId)?.name;
  const placeName = rivalPlaceNameLookup(state.graph)(placeId);
  if (!rivalName || !placeName) return null;
  return { rivalId: target.rivalId, rivalName, placeId, placeName, pressedAt: target.pressedAt };
}

/** The rival whose rebukable landing is on `placeId`, or null (fail-soft on any gap). */
export function rivalPressedOn(state: PressedReadState, placeId: string): RivalPressedView | null {
  try {
    return rebukablePlaceIds(state).has(placeId) ? pressedView(state, placeId) : null;
  } catch {
    return null;
  }
}

/** The most recent rebukable landing anywhere (the Rebuke gift's place), or null. */
export function latestRebukableLanding(state: PressedReadState): RivalPressedView | null {
  try {
    let best: RivalPressedView | null = null;
    for (const placeId of [...rebukablePlaceIds(state)].sort()) {
      const v = pressedView(state, placeId);
      if (v && (!best || v.pressedAt > best.pressedAt)) best = v;
    }
    return best;
  } catch {
    return null;
  }
}

/** The pressed place's Now line: headline "{Rival} pressed it {when}." and its answer line. */
export function rivalPressedNowLine(
  view: RivalPressedView,
  tick: number,
  holdsRebuke: boolean,
): { headline: string; answer: string } {
  const headline = rivalWords('ui.rival.pressed_now')
    .replace('{rival}', view.rivalName)
    .replace('{when}', rivalWhenWords(tick - view.pressedAt));
  return {
    headline,
    answer: rivalWords(holdsRebuke ? 'ui.rival.pressed_answer_rebuke' : 'ui.rival.pressed_answer_tend'),
  };
}

/** Flatten segments to plain text (aria labels, tests). */
export function segmentsText(segments: readonly RivalLineSegment[]): string {
  return segments.map((s) => ('text' in s ? s.text : s.name)).join('');
}
