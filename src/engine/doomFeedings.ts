/**
 * The Doom feeds at a place (THR-2255, slice 1 of
 * `Docs/plans/2026-11-19-thr-2247-dooms-last-stage-is-a-stand.md`, Decisions 1–3).
 *
 * A failure's `doom_micro_tick` is written to the top-level place it happened at
 * (`GameState.doomFeedings`), unless the god tends that place — then the push is
 * absorbed (`DOOM_FEED_ABSORB_SHARE`) and nothing is recorded. An untended place with
 * a feeding inside `DOOM_REBUKE_WINDOW_DAYS` can be Rebuked; the landing sets
 * `heldUntil`, so the feedings it answered are not offered again.
 *
 * Pure reads and copy-on-write writers. Fail-soft: a missing record reads as empty,
 * a missing graph skips the tending check (the caller's own tending check stands).
 */
import type { DoomFeeding, GameState } from '../types/gameState';
import type { TendedBy } from './dominion';
import { TICKS_PER_DAY } from '../data/attention-constants';
import { DOOM_REBUKE_WINDOW_DAYS } from '../data/game-config';
import { buildTendingIndex, dominionOf, isTended, rebukeTendingOf } from './dominion';

/** The shared window, in ticks: the record, the Rebuke offer and the panel read one span. */
export function doomFeedWindowTicks(): number {
  return DOOM_REBUKE_WINDOW_DAYS * TICKS_PER_DAY;
}

function inWindow(tick: number, at: number): boolean {
  const age = tick - at;
  return age >= 0 && age <= doomFeedWindowTicks();
}

/**
 * Drop feedings older than the window, and a place's whole entry once it has no recent
 * feeding and its Rebuke hold ended more than the window ago. Returns a new record.
 */
export function pruneDoomFeedings(
  feedings: Readonly<Record<string, DoomFeeding>> | undefined,
  tick: number,
): Record<string, DoomFeeding> {
  const out: Record<string, DoomFeeding> = {};
  for (const [placeId, f] of Object.entries(feedings ?? {})) {
    if (!f) continue;
    const recentTicks = (f.recentTicks ?? []).filter(t => typeof t === 'number' && inWindow(tick, t));
    const heldRecently = typeof f.heldUntil === 'number' && tick - f.heldUntil <= doomFeedWindowTicks();
    if (recentTicks.length === 0 && !heldRecently) continue;
    out[placeId] = { ...f, recentTicks };
  }
  return out;
}

/** Record one feeding at `placeId` (a top-level place id). Prunes as it writes. */
export function recordDoomFeeding(
  feedings: Readonly<Record<string, DoomFeeding>> | undefined,
  placeId: string,
  actorId: string,
  tick: number,
): Record<string, DoomFeeding> {
  const out = pruneDoomFeedings(feedings, tick);
  const prev = out[placeId];
  out[placeId] = {
    ...(prev ?? {}),
    lastTick: tick,
    lastActorId: actorId,
    recentTicks: [...(prev?.recentTicks ?? []), tick],
  };
  return out;
}

/** Mark a doom Rebuke's hold on `placeId`. Prunes as it writes; a place with no entry gains one. */
export function holdDoomFeeding(
  feedings: Readonly<Record<string, DoomFeeding>> | undefined,
  placeId: string,
  heldUntil: number,
  tick: number,
): Record<string, DoomFeeding> {
  const out = pruneDoomFeedings(feedings, tick);
  const prev = out[placeId];
  out[placeId] = prev
    ? { ...prev, heldUntil: Math.max(prev.heldUntil ?? 0, heldUntil) }
    : { lastTick: tick, lastActorId: '', recentTicks: [], heldUntil };
  return out;
}

/**
 * The latest feeding at `placeId` a Rebuke can still answer: inside the window, and
 * not from before a doom Rebuke already held the place. Null otherwise.
 */
export function latestAnswerableFeeding(
  state: Pick<GameState, 'tick'> & Partial<Pick<GameState, 'doomFeedings'>>,
  placeId: string | undefined,
): number | null {
  if (!placeId) return null;
  const f = state.doomFeedings?.[placeId];
  if (!f) return null;
  let best: number | null = null;
  for (const t of f.recentTicks ?? []) {
    if (typeof t !== 'number' || !inWindow(state.tick, t)) continue;
    if (typeof f.heldUntil === 'number' && t < f.heldUntil) continue;
    if (best === null || t > best) best = t;
  }
  return best;
}

export type DoomReadState = Pick<GameState, 'tick'>
  & Partial<Pick<GameState, 'doomFeedings' | 'graph' | 'ascendantId' | 'controlEffects' | 'rebukedPlaces'>>;

/** Who tends what this tick, built the way `phaseDominion` builds it. Empty without a graph. */
export function doomTendingIndex(state: DoomReadState): ReadonlyMap<string, TendedBy[]> {
  const { graph, ascendantId } = state;
  if (!graph || !ascendantId) return new Map();
  return buildTendingIndex(graph, ascendantId, state.controlEffects,
    placeId => dominionOf(graph, ascendantId, placeId).band,
    rebukeTendingOf({ rebukedPlaces: state.rebukedPlaces, tick: state.tick }));
}

/**
 * Every place where the Doom fed inside the window, that still exists, that the god does
 * not tend, with a feeding no Rebuke has answered: the Doom half of Rebuke's target set.
 */
export function doomRebukablePlaceIds(state: DoomReadState): Set<string> {
  const out = new Set<string>();
  const feedings = state.doomFeedings;
  if (!feedings || Object.keys(feedings).length === 0) return out;
  let index: ReadonlyMap<string, TendedBy[]> = new Map();
  try {
    index = doomTendingIndex(state);
  } catch {
    // fail-soft: no tending read → every answerable feeding is offered
  }
  for (const placeId of Object.keys(feedings)) {
    if (latestAnswerableFeeding(state, placeId) === null) continue;
    if (state.graph && !state.graph.getNode(placeId)) continue; // a place that no longer exists
    if (isTended(index, placeId)) continue;
    out.add(placeId);
  }
  return out;
}

/** The doom-fed place the god can Rebuke that was fed most recently (the alert's place), or null. */
export function latestDoomRebukablePlace(state: DoomReadState, candidates?: ReadonlySet<string>): { placeId: string; fedAt: number } | null {
  let best: { placeId: string; fedAt: number } | null = null;
  for (const placeId of [...(candidates ?? doomRebukablePlaceIds(state))].sort()) {
    const fedAt = latestAnswerableFeeding(state, placeId);
    if (fedAt !== null && (!best || fedAt > best.fedAt)) best = { placeId, fedAt };
  }
  return best;
}
