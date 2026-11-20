/**
 * The race — which clock lands first at this pace (THR-2251, ticket 1 of
 * `Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race.md`).
 *
 * Pure, no graph writes, no randomness. `phaseMandate` calls, once per tick and after
 * the Mandate's progress is computed:
 *  1. `sampleRace`  — one sample of both clocks a day, fifteen kept;
 *  2. `projectRace` — the two paces across the window, each clock's projected end, and
 *                     the state they read as (Doom's end pushed to the post-bond floor);
 *  3. `settleRace`  — the two-day hold, the once-per-age first sight, and the silent
 *                     fall to `hidden` on a data gap.
 * `raceLever` names the one move that would change the race most: a chapter in the
 * Mandate sphere furthest from its target (the First first), else the god's strongest
 * place in that sphere (THR-2254), else Stay the Unmaking.
 *
 * Constants and every player sentence live in `src/data/race-content.ts`.
 */
import type { GameState } from '../types/gameState';
import type { DoomClockState } from '../types/doomClock';
import type { RaceSample, RaceState, RaceWatch } from '../types/mandate';
import type { SphereName } from '../types/index';
import {
  RACE_CLOSE_SHARE,
  RACE_MIN_SAMPLES,
  RACE_SAMPLE_EVERY_TICKS,
  RACE_SHOW_FROM_DOOM,
  RACE_STALL_EPSILON,
  RACE_TURN_HOLD_TICKS,
  RACE_WINDOW_SAMPLES,
} from '../data/race-content';
import { doomFloorMetAtTick } from './doomClock';
import { mandateDeedSpheres, mandateTrendOf } from './mandateLedger';
import { doomStayNotice } from './views/doomStayNotice';
import { getFirstId } from './meetingEncounter';
import { isPlaceNode } from './sublocationShape';

export type { RaceState, RaceWatch, RaceSample } from '../types/mandate';

/** Which ending each state names; a change within one ending is not a turn. */
const RACE_ENDING: Readonly<Record<RaceState, 'none' | 'mandate' | 'doom' | 'close'>> = {
  hidden: 'none',
  mandate_first: 'mandate',
  doom_first: 'doom',
  stalled: 'doom',
  close: 'close',
};

/** The states a lever is offered in — never while the Mandate lands first. */
const LEVER_STATES: ReadonlySet<RaceState> = new Set<RaceState>(['doom_first', 'close', 'stalled']);

export interface RaceProjection {
  state: RaceState;
  /** Projected tick the Mandate fills; `null` with no rise across the window, or hidden. */
  mandateEndTick: number | null;
  /** Projected tick Doom ends the age (never before the post-bond floor); `null` when hidden. */
  doomEndTick: number | null;
}

export type RaceLever =
  | { kind: 'chapter'; sphere: SphereName; mortalId: string }
  /** THR-2254 — tend the god's place holding the most of the short sphere's `godHeld`. */
  | { kind: 'place'; sphere: SphereName; placeId: string }
  /** `held` — Stay is already active; the surfaces show THR-2240's held line, no button. */
  | { kind: 'stay'; held: boolean };

export interface RaceSettle {
  watch: RaceWatch;
  /** The new shown state when this tick owes an alert (a turn or the first sight), else null. */
  turned: RaceState | null;
  /** True when `turned` is the once-per-age first sight, not a turn. */
  firstSight: boolean;
  /** The shown state before this tick (the trace's `from`). */
  from: RaceState;
}

/** An empty watch — what an absent `raceWatch` (an old save) reads as. */
export function emptyRaceWatch(): RaceWatch {
  return { samples: [], shown: 'hidden', seen: false };
}

/** What the surfaces show: the debug override when set, else the settled state. */
export function shownRaceState(watch: RaceWatch | undefined): RaceState {
  return watch?.forced ?? watch?.shown ?? 'hidden';
}

/**
 * Take one sample a day (`RACE_SAMPLE_EVERY_TICKS`) and keep the last
 * `RACE_WINDOW_SAMPLES`. A non-finite reading is skipped (fail-soft).
 */
export function sampleRace(
  watch: RaceWatch | undefined,
  tick: number,
  mandateProgress: number,
  doomProgress: number,
): RaceWatch {
  const base = watch ?? emptyRaceWatch();
  if (!Number.isFinite(tick) || !Number.isFinite(mandateProgress) || !Number.isFinite(doomProgress)) return base;
  const last = base.samples[base.samples.length - 1];
  if (last && tick - last.tick < RACE_SAMPLE_EVERY_TICKS) return base;
  const sample: RaceSample = { tick, mandate: mandateProgress, doom: doomProgress };
  return { ...base, samples: [...base.samples, sample].slice(-RACE_WINDOW_SAMPLES) };
}

export interface ProjectRaceInput {
  /** The Mandate's progress this tick (0–1). */
  mandateProgress: number;
  /** True while the Mandate's trend word reads Rising (`mandateTrendOf === 'rising'`). */
  trendRising: boolean;
}

const HIDDEN: RaceProjection = { state: 'hidden', mandateEndTick: null, doomEndTick: null };

/**
 * Project both clocks from the window's paces (plan decision 1) and read the state
 * (decision 2). Every gap reads `hidden`: no Doom clock, Doom asleep or before Signs,
 * fewer than `RACE_MIN_SAMPLES`, a non-finite value, or a non-positive Doom pace.
 */
export function projectRace(
  watch: RaceWatch | undefined,
  doomClock: DoomClockState | undefined,
  tick: number,
  input: ProjectRaceInput,
): RaceProjection {
  if (!watch || !doomClock) return HIDDEN;
  const doomNow = doomClock.progress;
  const mandateNow = input.mandateProgress;
  if (!Number.isFinite(doomNow) || !Number.isFinite(mandateNow) || !Number.isFinite(tick)) return HIDDEN;
  if (doomNow < RACE_SHOW_FROM_DOOM) return HIDDEN;
  const floor = doomFloorMetAtTick(doomClock);
  if (floor === null) return HIDDEN;
  const samples = watch.samples;
  if (samples.length < RACE_MIN_SAMPLES) return HIDDEN;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const span = last.tick - first.tick;
  if (!(span > 0)) return HIDDEN;

  // Doom — the age ends when the clock fills, never before the post-bond floor.
  const doomRemaining = Math.max(0, 1 - doomNow);
  let doomEndTick: number;
  if (doomRemaining === 0) {
    doomEndTick = tick;
  } else {
    const doomPace = (last.doom - first.doom) / span;
    if (!(doomPace > 0) || !Number.isFinite(doomPace)) return HIDDEN;
    doomEndTick = tick + doomRemaining / doomPace;
  }
  doomEndTick = Math.max(doomEndTick, floor);

  // Mandate — no rise across the window gets no end tick (no division).
  const rise = last.mandate - first.mandate;
  if (!(rise > RACE_STALL_EPSILON)) {
    return { state: input.trendRising ? 'doom_first' : 'stalled', mandateEndTick: null, doomEndTick };
  }
  const mandateEndTick = tick + Math.max(0, 1 - mandateNow) / (rise / span);
  if (!Number.isFinite(mandateEndTick)) return HIDDEN;

  const timeLeftToDoom = Math.max(1, doomEndTick - tick);
  let state: RaceState;
  if (Math.abs(mandateEndTick - doomEndTick) <= RACE_CLOSE_SHARE * timeLeftToDoom) state = 'close';
  else state = mandateEndTick < doomEndTick ? 'mandate_first' : 'doom_first';
  return { state, mandateEndTick, doomEndTick };
}

/**
 * Apply the hold (plan decision 3). A new non-hidden state replaces the shown one only
 * after it has been the computed state for `RACE_TURN_HOLD_TICKS` in a row. The first
 * move out of `hidden` (once per age) shows at once and is the first sight, not a turn.
 * A fall back to `hidden` is a data gap: it shows at once, with no alert, and the return
 * from it is silent too.
 */
export function settleRace(watch: RaceWatch, computed: RaceState, tick: number): RaceSettle {
  const from = watch.shown;
  const { pending: _pending, ...rest } = watch;
  const cleared: RaceWatch = rest;

  if (computed === from) return { watch: cleared, turned: null, firstSight: false, from };

  if (computed === 'hidden') {
    return { watch: { ...cleared, shown: 'hidden' }, turned: null, firstSight: false, from };
  }

  if (from === 'hidden') {
    if (!watch.seen) {
      return { watch: { ...cleared, shown: computed, seen: true }, turned: computed, firstSight: true, from };
    }
    // Return from a data gap — silent.
    return { watch: { ...cleared, shown: computed }, turned: null, firstSight: false, from };
  }

  const pending = watch.pending;
  if (pending && pending.state === computed) {
    if (tick - pending.since >= RACE_TURN_HOLD_TICKS) {
      // `doom_first` ↔ `stalled` names the same ending (Doom first): the shown line
      // updates, but the age has not shifted, so it is no turn and owes no alert.
      const sameEnding = RACE_ENDING[computed] === RACE_ENDING[from];
      return { watch: { ...cleared, shown: computed }, turned: sameEnding ? null : computed, firstSight: false, from };
    }
    return { watch, turned: null, firstSight: false, from };
  }
  return { watch: { ...cleared, pending: { state: computed, since: tick } }, turned: null, firstSight: false, from };
}

/**
 * The living mortals threaded to the god whose chapters credit the Mandate, the First
 * first, then in thread-edge order. Avatars are not mortals bound to the god.
 * Fail-soft: a graph read that throws names nobody.
 */
export function raceLeverMortalIds(
  gameState: Pick<GameState, 'graph' | 'ascendantId' | 'mandateDefinition'>,
): string[] {
  try {
    const { graph, ascendantId } = gameState;
    if (!graph || !ascendantId) return [];
    const avatars = new Set(graph.getIncomingEdges(ascendantId, 'avatar_of').map(e => e.source));
    const ordered: string[] = [];
    let firstId: string | null = null;
    try { firstId = getFirstId(graph, ascendantId); } catch { firstId = null; }
    if (firstId) ordered.push(firstId);
    for (const e of graph.getOutgoingEdges(ascendantId, 'thread')) {
      if (!ordered.includes(e.target)) ordered.push(e.target);
    }
    return ordered.filter(id => {
      if (id === ascendantId || avatars.has(id)) return false;
      const node = graph.getNode(id);
      if (node?.type !== 'actor') return false;
      const p = node.properties ?? {};
      if (p.deceased === true || p.status === 'dead' || p.deceasedTick != null) return false;
      return mandateDeedSpheres(gameState, graph, id).size > 0;
    });
  } catch {
    return [];
  }
}

/**
 * THR-2254 — the god's place holding the largest `godHeld` share in `sphere` (keys are
 * `entityId|sphere`), or null. Only a place whose node still exists counts; a mortal,
 * an artifact or a faction holding points is not a place to tend. Ties break on the id
 * (NFP 3). Fail-soft: a graph read that throws names no place.
 */
export function raceLeverPlaceId(
  gameState: Pick<GameState, 'graph' | 'mandateState'>,
  sphere: SphereName,
): string | null {
  try {
    const held = gameState.mandateState?.godHeld;
    const graph = gameState.graph;
    if (!held || !graph) return null;
    let best: { id: string; points: number } | null = null;
    for (const [key, points] of Object.entries(held)) {
      if (!Number.isFinite(points) || points <= 0) continue;
      const bar = key.lastIndexOf('|');
      if (bar <= 0 || key.slice(bar + 1) !== sphere) continue;
      const id = key.slice(0, bar);
      const node = graph.getNode(id);
      if (!node || !(node.type === 'location' || isPlaceNode(node))) continue;
      if (!best || points > best.points || (points === best.points && id < best.id)) best = { id, points };
    }
    return best?.id ?? null;
  } catch {
    return null;
  }
}

/** The Mandate sphere furthest from its target (the lower share filled); the primary on a tie. */
export function shortMandateSphere(
  gameState: Pick<GameState, 'mandateDefinition' | 'mandateState'>,
): SphereName | null {
  const def = gameState.mandateDefinition;
  const ms = gameState.mandateState;
  if (!def?.primarySphere) return null;
  if (!def.secondarySphere) return def.primarySphere;
  const share = (delta: number | undefined, target: number | undefined): number =>
    target && target > 0 && Number.isFinite(delta ?? 0) ? (delta ?? 0) / target : 0;
  const p = share(ms?.primaryDelta, def.primaryTargetDelta);
  const s = share(ms?.secondaryDelta, def.secondaryTargetDelta);
  return s < p ? def.secondarySphere : def.primarySphere;
}

/**
 * The whole race reading for inspection (`window.__DEBUG.getRace`) and the views:
 * the shown, settled and forced states, this tick's projection, the samples, the pending
 * state under the hold, and the lever for the shown state. Read-only.
 */
export function raceReading(
  gameState: Pick<
    GameState,
    'graph' | 'ascendantId' | 'mandateDefinition' | 'mandateState' | 'unlockedActionIds' | 'controlEffects' | 'unifiedActions' | 'tick'
  > & Partial<Pick<GameState, 'doomClock'>>,
): {
  shown: RaceState;
  settled: RaceState;
  forced: RaceState | null;
  computed: RaceState;
  mandateEndTick: number | null;
  doomEndTick: number | null;
  samples: RaceSample[];
  pending: { state: RaceState; since: number } | null;
  seen: boolean;
  lever: RaceLever | null;
} {
  const ms = gameState.mandateState;
  const watch = ms?.raceWatch ?? emptyRaceWatch();
  const projection = ms
    ? projectRace(watch, gameState.doomClock, gameState.tick, {
        mandateProgress: ms.progress ?? 0,
        trendRising: mandateTrendOf(ms.recentLedgerDelta) === 'rising',
      })
    : HIDDEN;
  const shown = shownRaceState(watch);
  return {
    shown,
    settled: watch.shown,
    forced: watch.forced ?? null,
    computed: projection.state,
    mandateEndTick: projection.mandateEndTick,
    doomEndTick: projection.doomEndTick,
    samples: [...watch.samples],
    pending: watch.pending ? { ...watch.pending } : null,
    seen: watch.seen,
    lever: raceLever(shown, gameState),
  };
}

/**
 * The one move that would change the race most (plan decision 4), or `null`.
 * Offered only in `doom_first`, `close` and `stalled`. A chapter when a mortal bound to
 * the god can credit the Mandate; else the god's strongest place in the short sphere
 * (THR-2254 — a place the god has already tended there, so the promise is one a place
 * cast keeps, THR-2249); else Stay the Unmaking once the god holds the card.
 */
export function raceLever(
  state: RaceState,
  gameState: Pick<
    GameState,
    'graph' | 'ascendantId' | 'mandateDefinition' | 'mandateState' | 'unlockedActionIds' | 'controlEffects' | 'unifiedActions'
  > & Partial<Pick<GameState, 'doomClock'>>,
): RaceLever | null {
  if (!LEVER_STATES.has(state)) return null;
  const sphere = shortMandateSphere(gameState);
  const mortalId = sphere ? raceLeverMortalIds(gameState)[0] : undefined;
  if (sphere && mortalId) return { kind: 'chapter', sphere, mortalId };
  const placeId = sphere ? raceLeverPlaceId(gameState, sphere) : null;
  if (sphere && placeId) return { kind: 'place', sphere, placeId };
  try {
    const stay = doomStayNotice(gameState);
    if (stay.button) return { kind: 'stay', held: false };
    if (stay.line) return { kind: 'stay', held: true };
  } catch {
    // Fail-soft: an unreadable Stay state offers no lever.
  }
  return null;
}
