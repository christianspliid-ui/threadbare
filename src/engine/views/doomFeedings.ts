/**
 * Where the Doom feeds — the Doom panel's list, the Doom bar's hover line and the place
 * page's doom lead (THR-2256, slice 2 of
 * `Docs/plans/2026-11-19-thr-2247-dooms-last-stage-is-a-stand.md`, Decision 4 and the
 * Player-facing text table).
 *
 * A pure view model over `GameState.doomFeedings` (written by slice 1, THR-2255): the
 * surfaces only render. Every listed place can still be Rebuked, is held, or lost its hold
 * inside the window (PC-6 / PC-8). Words only, no numbers (UI Law 13).
 *
 * Fail-soft: a missing record, graph or tending read yields an empty view, never a throw.
 */
import type { GameState } from '../../types/gameState';
import type { TendedBy } from '../dominion';
import { isTended } from '../dominion';
import { DOOM_FEED_LIST_MAX, DOOM_FEED_OFTEN_COUNT } from '../../data/game-config';
import { doomFeedWindowTicks, doomTendingIndex, latestAnswerableFeeding, pruneDoomFeedings } from '../doomFeedings';
import { rebukeAnswerFor } from '../rivalRebuke';
import { godHoldsRebuke } from './rivalEntry';
import { countWord } from '../aftermathWords';
import { DOOM_FEED_NAME_FALLBACK } from '../../data/doom-feed-content';

/** The panel's and the place page's words (the plan's Player-facing text table, verbatim). */
export const DOOM_FEED_WORDS = {
  sectionLabel: 'Where it feeds',
  empty: 'The doom has not fed anywhere lately.',
  once: 'fed here once',
  often: 'fed here often',
  held: 'held',
  noLongerHeld: 'no longer held',
  rebukeButton: 'Rebuke',
  /** Doom bar hover: `{place}` is the newest fed place, `{others}` the rest. */
  hoverOne: 'It feeds on failures at {place}.',
  hoverMany: 'It feeds on failures at {place} and {others}.',
  otherOne: 'one other place',
  otherMany: '{count} other places',
  /** The place page lead. `{name}` is the mortal who failed. */
  leadHeadline: 'The doom fed here when {name} failed.',
  leadAnswerRebuke: 'Rebuke it here, or tend it.',
  leadAnswerTend: 'Ground you tend here starves it.',
} as const;

export type DoomFeedStatus = 'once' | 'often' | 'held' | 'no_longer_held';

export interface DoomFeedRowView {
  readonly placeId: string;
  readonly placeName: string;
  readonly status: DoomFeedStatus;
  /** The row's word ("fed here once" / "fed here often" / "held" / "no longer held"). */
  readonly word: string;
  /** The tick the row sorts by (its last feeding, or its hold's end). */
  readonly at: number;
  /** True when the god holds Rebuke and a Rebuke here answers the Doom now (UI Law 25). */
  readonly rebukable: boolean;
}

export interface DoomFeedingsView {
  /** Newest first, at most `DOOM_FEED_LIST_MAX`. */
  readonly rows: readonly DoomFeedRowView[];
  /** Every listable place. */
  readonly total: number;
  /** Places the Doom is feeding at now (status once/often), newest first. */
  readonly fed: readonly { placeId: string; placeName: string }[];
  readonly holdsRebuke: boolean;
}

export type DoomFeedReadState = Pick<GameState, 'tick'>
  & Partial<Pick<GameState, 'doomFeedings' | 'graph' | 'ascendantId' | 'controlEffects' | 'rebukedPlaces'
    | 'unlockedActionIds' | 'rivalStates' | 'unifiedActions'>>;

type RebukeRead = Parameters<typeof rebukeAnswerFor>[0];

const EMPTY: DoomFeedingsView = { rows: [], total: 0, fed: [], holdsRebuke: false };

function placeNameOf(state: DoomFeedReadState, placeId: string): string | null {
  const name = state.graph?.getNode(placeId)?.name;
  return typeof name === 'string' && name.trim() ? name : null;
}

/** Feedings at `placeId` inside the window that no doom Rebuke has answered yet. */
function answerableCount(state: DoomFeedReadState, placeId: string): number {
  const f = state.doomFeedings?.[placeId];
  if (!f) return 0;
  const windowTicks = doomFeedWindowTicks();
  let n = 0;
  for (const t of f.recentTicks ?? []) {
    if (typeof t !== 'number') continue;
    const age = state.tick - t;
    if (age < 0 || age > windowTicks) continue;
    if (typeof f.heldUntil === 'number' && t < f.heldUntil) continue;
    n += 1;
  }
  return n;
}

function safeTendingIndex(state: DoomFeedReadState): ReadonlyMap<string, TendedBy[]> {
  try {
    return doomTendingIndex(state);
  } catch {
    return new Map(); // fail-soft: nothing reads as tended
  }
}

/** The whole view: one read of state, newest first. */
export function selectDoomFeedings(state: DoomFeedReadState): DoomFeedingsView {
  try {
    const holdsRebuke = godHoldsRebuke({ unlockedActionIds: state.unlockedActionIds });
    const feedings = pruneDoomFeedings(state.doomFeedings, state.tick);
    if (Object.keys(feedings).length === 0) return { ...EMPTY, holdsRebuke };
    const read: DoomFeedReadState = { ...state, doomFeedings: feedings };
    const index = safeTendingIndex(read);
    const windowTicks = doomFeedWindowTicks();
    const all: DoomFeedRowView[] = [];
    for (const [placeId, f] of Object.entries(feedings)) {
      const placeName = placeNameOf(read, placeId);
      if (!placeName) continue; // a place that no longer exists, or has no name to show
      let status: DoomFeedStatus | null = null;
      let at = f.lastTick;
      if (isTended(index, placeId)) {
        status = 'held';
      } else if (latestAnswerableFeeding(read, placeId) !== null) {
        status = answerableCount(read, placeId) >= DOOM_FEED_OFTEN_COUNT ? 'often' : 'once';
      } else if (typeof f.heldUntil === 'number' && f.heldUntil <= state.tick && state.tick - f.heldUntil <= windowTicks) {
        status = 'no_longer_held';
        at = f.heldUntil;
      }
      if (!status) continue;
      let rebukable = false;
      if (holdsRebuke && (status === 'once' || status === 'often')) {
        try {
          rebukable = rebukeAnswerFor(read as RebukeRead, placeId)?.kind === 'doom';
        } catch {
          rebukable = false;
        }
      }
      const word = status === 'once' ? DOOM_FEED_WORDS.once
        : status === 'often' ? DOOM_FEED_WORDS.often
          : status === 'held' ? DOOM_FEED_WORDS.held
            : DOOM_FEED_WORDS.noLongerHeld;
      all.push({ placeId, placeName, status, word, at, rebukable });
    }
    all.sort((a, b) => b.at - a.at || a.placeId.localeCompare(b.placeId));
    const fed = all
      .filter(r => r.status === 'once' || r.status === 'often')
      .map(r => ({ placeId: r.placeId, placeName: r.placeName }));
    return { rows: all.slice(0, DOOM_FEED_LIST_MAX), total: all.length, fed, holdsRebuke };
  } catch {
    return EMPTY;
  }
}

/** The Doom bar's hover line, or null when the Doom is feeding nowhere now. */
export function doomFeedHoverLine(view: DoomFeedingsView): string | null {
  const first = view.fed[0];
  if (!first) return null;
  const others = view.fed.length - 1;
  if (others <= 0) return DOOM_FEED_WORDS.hoverOne.replace('{place}', first.placeName);
  const othersText = others === 1
    ? DOOM_FEED_WORDS.otherOne
    : DOOM_FEED_WORDS.otherMany.replace('{count}', countWord(others));
  return DOOM_FEED_WORDS.hoverMany.replace('{place}', first.placeName).replace('{others}', othersText);
}

/**
 * The place page's doom lead: the headline "The doom fed here when {name} failed." and its
 * answer — Rebuke here (when held and a Rebuke here answers the Doom), else tending. Null
 * unless the Doom fed here inside the window on ground the god does not tend, and null when
 * a rival's landing here is the Rebuke's target (the rival lead wins, as Rebuke's target does).
 */
export function doomFedLead(state: DoomFeedReadState, placeId: string): { headline: string; answer: string } | null {
  try {
    const f = state.doomFeedings?.[placeId];
    if (!f || latestAnswerableFeeding(state, placeId) === null) return null;
    if (isTended(safeTendingIndex(state), placeId)) return null;
    const answer = rebukeAnswerFor(state as RebukeRead, placeId);
    if (answer?.kind === 'rival') return null;
    const actorName = f.lastActorId ? state.graph?.getNode(f.lastActorId)?.name : undefined;
    const name = actorName && actorName.trim() ? actorName : DOOM_FEED_NAME_FALLBACK.toLowerCase();
    const holds = godHoldsRebuke({ unlockedActionIds: state.unlockedActionIds }) && answer?.kind === 'doom';
    return {
      headline: DOOM_FEED_WORDS.leadHeadline.replace('{name}', name),
      answer: holds ? DOOM_FEED_WORDS.leadAnswerRebuke : DOOM_FEED_WORDS.leadAnswerTend,
    };
  } catch {
    return null;
  }
}
