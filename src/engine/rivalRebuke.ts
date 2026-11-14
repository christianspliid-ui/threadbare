/**
 * Rebuke — the god's answer to a rival's landed hand (THR-2209).
 * Plan: `Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md`, slice 3.
 *
 * A rival's probe that lands on an untended place of the god's records it as
 * `RivalState.lastPressed` (not `absorbed`). For `RIVAL_REBUKE_WINDOW_DAYS` after,
 * that place can be rebuked: the card tends it for `RIVAL_REBUKE_HOLD_DAYS` (a fifth
 * `TendedBy`, read through `GameState.rebukedPlaces`), so the next landing there is
 * absorbed exactly as any tending absorbs it. A clean landing also pushes the god's
 * primary sphere back on the place, and the rebuked rival's temper rises with the
 * cause `rebuked`. A crooked landing (`success_at_cost`, Law 26) tends and restores
 * nothing.
 *
 * Pure reads plus one function (`resolveRebuke`) that returns what to write; the
 * caller (`phaseUnifiedActionProgress`) folds the result into its returned state.
 * `raiseRivalHostility` lives here so both the rival phase and the cast share one
 * temper rule. Fail-soft throughout: a missing rival or place skips its part.
 */
import type { GameState } from '../types/gameState';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import type { RivalDefinition, RivalHostilityCause, RivalState } from '../types/rival';
import type { RivalHostilityChangedTrace, RivalRebukedTrace } from '../types/trace';
import type { SphereName } from '../types';
import type { EncounterAftermathChange, StepOutcome } from '../types/unifiedAction';
import { TICKS_PER_DAY } from '../data/attention-constants';
import {
  RIVAL_HOSTILITY_START,
  RIVAL_SCHEME_HOSTILITY_CEILING,
  RIVAL_REBUKE_HOLD_DAYS,
  RIVAL_REBUKE_PUSH,
  RIVAL_REBUKE_TEMPER_RISE,
  RIVAL_REBUKE_WINDOW_DAYS,
} from '../data/rival-scheme-config';
import { RIVAL_REBUKE_RECEIPT_TITLE, RIVAL_REBUKE_TEMPLATE_ID, rivalRebukeReply } from '../data/rival-rebuke-content';
import { emitTrace } from './traceBuffer';
import { placeOf } from './dominion';
import { getSpherePoints, rankSpherePoints } from './spherePoints';

/**
 * THR-2185: raise a rival's temper with its cause, and trace the change. A rise from
 * the rival's own scheme stops at `RIVAL_SCHEME_HOSTILITY_CEILING` (never lowering a
 * temper already above it); only the god's acts (breaking a scheme, a rebuke) reach
 * "wrathful". The cause is recorded either way, so a capped rival still says what it is
 * doing. Pure over the rival state; the trace (only when the number moved) is the only
 * side effect. Moved here from the orchestrator by THR-2209 so the Rebuke cast shares it.
 */
export function raiseRivalHostility(
  rival: Pick<RivalDefinition, 'id' | 'name'>,
  rivalState: RivalState,
  by: number,
  cause: RivalHostilityCause,
  placeName: string | undefined,
): RivalState {
  // Fail-soft: a state with no temper (a hand-built fixture, a damaged save) rises from the start.
  const from = Number.isFinite(rivalState.hostilityToPlayer) ? rivalState.hostilityToPlayer : RIVAL_HOSTILITY_START;
  const ceiling = cause.kind === 'scheme' ? RIVAL_SCHEME_HOSTILITY_CEILING : 1.0;
  const to = Math.max(from, Math.min(ceiling, from + by));
  if (to === from) {
    // A scheme beat that cannot lift a temper the god's act put above the ceiling
    // leaves that act as the reason: the rival is wrathful because of what you did.
    const godsAct = rivalState.hostilityCause?.kind === 'countered' || rivalState.hostilityCause?.kind === 'rebuked';
    if (godsAct && from > ceiling) return rivalState;
    // A capped beat names the current cause but is not a rise: it keeps the last rise's
    // tick, so a quiet day still cools and the next beat is a real rise again.
    const lastRise = rivalState.hostilityCause?.tick;
    return { ...rivalState, hostilityToPlayer: from, hostilityCause: { ...cause, tick: lastRise ?? cause.tick } };
  }
  const trace: Omit<RivalHostilityChangedTrace, 'id' | 'timestamp'> = {
    category: 'rival.hostility_changed',
    tick: cause.tick,
    rivalId: rival.id,
    from,
    to,
    cause: cause.kind,
    ...(cause.placeId ? { placeId: cause.placeId } : {}),
    summary: `${rival.name}: ${from.toFixed(2)} → ${to.toFixed(2)} (${cause.kind}${placeName ? ` at ${placeName}` : ''})`,
  };
  emitTrace(trace);
  return { ...rivalState, hostilityToPlayer: to, hostilityCause: cause };
}

/** The rival whose unabsorbed landing on `placeId` is still inside the rebuke window. */
export interface RebukeTarget {
  readonly rivalId: string;
  readonly pressedAt: number;
}

type RebukeReadState = Pick<GameState, 'rivalStates' | 'tick'> & Partial<Pick<GameState, 'unifiedActions'>>;

/**
 * The rival a Rebuke on `placeId` answers: the most recent active rival whose last
 * landing was there, unabsorbed and not yet rebuked, within `RIVAL_REBUKE_WINDOW_DAYS`.
 * Null otherwise.
 */
export function rebukeTargetFor(state: RebukeReadState, placeId: string | undefined): RebukeTarget | null {
  if (!placeId) return null;
  const windowTicks = RIVAL_REBUKE_WINDOW_DAYS * TICKS_PER_DAY;
  let best: RebukeTarget | null = null;
  for (const rs of state.rivalStates ?? []) {
    const last = rs?.lastPressed;
    if (!rs?.active || !last || last.placeId !== placeId || last.absorbed || last.rebuked) continue;
    const age = state.tick - last.tick;
    if (age < 0 || age > windowTicks) continue;
    if (!best || last.tick > best.pressedAt) best = { rivalId: rs.rivalId, pressedAt: last.tick };
  }
  return best;
}

/**
 * Every place a Rebuke can be played on right now (the card's target filter). A place
 * with a Rebuke cast still in flight is left out: that cast already answers it.
 */
export function rebukablePlaceIds(state: RebukeReadState): Set<string> {
  const inFlight = new Set<string>();
  for (const a of state.unifiedActions ?? []) {
    if (a && !a.resolved && a.templateId === RIVAL_REBUKE_TEMPLATE_ID && a.targetId) inFlight.add(a.targetId);
  }
  const out = new Set<string>();
  for (const rs of state.rivalStates ?? []) {
    const placeId = rs?.lastPressed?.placeId;
    if (placeId && !inFlight.has(placeId) && rebukeTargetFor(state, placeId)) out.add(placeId);
  }
  return out;
}

/** What a resolved Rebuke writes. The caller folds each part into its returned state. */
export interface RebukeResolution {
  readonly rebukedPlaces: Record<string, number>;
  readonly rivalStates?: RivalState[];
  readonly pressure?: SpherePressureEvent;
  readonly change: EncounterAftermathChange;
}

/**
 * Resolve a landed Rebuke on `targetId` (a place, or a sublocation of one). Tends the
 * place until `tick + RIVAL_REBUKE_HOLD_DAYS` days. On a clean landing, while the place
 * is still a rival's rebukable landing, also pushes the god's primary sphere back and
 * raises that rival's temper. Returns null with no place to hold.
 */
export function resolveRebuke(
  state: Pick<GameState, 'graph' | 'ascendantId' | 'rivalStates' | 'rivalDefinitions' | 'rebukedPlaces' | 'tick'>,
  input: { actorId: string; targetId: string | undefined; outcome: StepOutcome; actionId: string },
): RebukeResolution | null {
  const place = placeOf(state.graph, input.targetId);
  if (!place) return null;
  const tick = state.tick;
  const heldUntil = tick + RIVAL_REBUKE_HOLD_DAYS * TICKS_PER_DAY;

  // Prune lapsed rebukes as we write, so the map stays small.
  const rebukedPlaces: Record<string, number> = {};
  for (const [id, until] of Object.entries(state.rebukedPlaces ?? {})) {
    if (typeof until === 'number' && until > tick) rebukedPlaces[id] = until;
  }
  rebukedPlaces[place.id] = Math.max(rebukedPlaces[place.id] ?? 0, heldUntil);

  const crooked = input.outcome === 'success_at_cost';
  const target = rebukeTargetFor(state, place.id);
  const rival = target ? (state.rivalDefinitions ?? []).find(r => r.id === target.rivalId) : undefined;
  const placeName = place.name || undefined;

  let pressure: SpherePressureEvent | undefined;
  let pushed = 0;
  if (!crooked && target) {
    const primary = rankSpherePoints(getSpherePoints(state.graph.getNode(input.actorId)?.properties))[0] as SphereName | undefined;
    if (primary) {
      pushed = RIVAL_REBUKE_PUSH;
      pressure = {
        targetEntityId: place.id,
        sphere: primary,
        magnitude: RIVAL_REBUKE_PUSH,
        source: 'divine_action',
        sourceId: input.actionId,
        causedBy: input.actorId,
        keepOnTarget: true,
      };
    }
  }

  // The rival notices on any landing: even a crooked rebuke turned its hand.
  let rivalStates: RivalState[] | undefined;
  let temperBefore: number | undefined;
  let temperAfter: number | undefined;
  if (target && rival) {
    rivalStates = (state.rivalStates ?? []).map(rs => {
      if (rs.rivalId !== rival.id) return rs;
      temperBefore = Number.isFinite(rs.hostilityToPlayer) ? rs.hostilityToPlayer : RIVAL_HOSTILITY_START;
      const raised = raiseRivalHostility(rival, rs, RIVAL_REBUKE_TEMPER_RISE,
        { kind: 'rebuked', placeId: place.id, tick }, placeName);
      temperAfter = raised.hostilityToPlayer;
      // One landing, one answer: the landing is marked rebuked, so the place leaves
      // the rebuke set and a second cast cannot push or anger twice for one blow.
      return raised.lastPressed ? { ...raised, lastPressed: { ...raised.lastPressed, rebuked: true } } : raised;
    });
  }

  const trace: Omit<RivalRebukedTrace, 'id' | 'timestamp'> = {
    category: 'rival.rebuked',
    tick,
    rivalId: rival?.id ?? null,
    placeId: place.id,
    band: input.outcome,
    heldUntil,
    pushed,
    ...(temperBefore !== undefined ? { temperBefore } : {}),
    ...(temperAfter !== undefined ? { temperAfter } : {}),
    summary: `Rebuke at ${placeName ?? place.id}${rival ? ` against ${rival.name}` : ''}: held until ${heldUntil}`
      + `${pushed ? `, pushed back ${pushed}` : ''}${crooked ? ' (crooked)' : ''}`,
  };
  emitTrace(trace);

  const detail = rivalRebukeReply(crooked || !target ? 'crooked' : 'landed', rival?.name, placeName);
  const change: EncounterAftermathChange = {
    id: `${input.actionId}:rebuke`,
    kind: 'future_hook',
    title: RIVAL_REBUKE_RECEIPT_TITLE,
    detail,
    polarity: 'gain',
    subjectId: place.id,
    ...(placeName ? {
      stateNoun: { text: placeName, entityId: place.id, visualKind: 'location' as const, visualName: placeName },
      concepts: [{ text: placeName, entityId: place.id, visualKind: 'location' as const, visualName: placeName }],
    } : {}),
  };

  return { rebukedPlaces, ...(rivalStates ? { rivalStates } : {}), ...(pressure ? { pressure } : {}), change };
}
