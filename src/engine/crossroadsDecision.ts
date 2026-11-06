/**
 * The Crossroads at decision time (THR-1926) — the three steps `phaseAgentDecision`
 * runs for a held lean, as functions so the ordering in the phase stays a few lines
 * and each step is testable on a synthetic board.
 *
 * 1. `prepareCrossroadsLean` — before the board: read the held lean (a malformed one
 *    reads as absent and is flagged for clearing), check its hold, and make sure an
 *    encounter target can reach the board (`findHeldEncounter`, shared with the
 *    Compulsion). Returns the *effective* lean the board multiplies — for an encounter
 *    found at another place, retargeted to that instance.
 * 2. `resolveCrossroadsLean` — after the live branch, before the Compulsion Override:
 *    the outcome, the trace payload, the one toast (outcome + the mortal's answer), and
 *    `leanTurned` for the engagement gauge.
 * 3. `isThreadedByGod` — whether to write the snapshot afterwards.
 *
 * @see Docs/plans/2026-10-14-thr-1926-the-crossroads.md § Tick phases
 */

import type { WorldGraph } from './graph';
import type { BoardEntry } from './decisionBoard';
import type { ScoredCandidate } from './encounterScoring';
import type { ScoredStrategicCandidate } from './strategicActionScoring';
import type { BondReception } from '../data/meeting-nudge-constants';
import type { CrossroadsLeanOutcomeTrace } from '../types/traces/crossroads-traces';
import { findHeldEncounter } from './premonitionSteer';
import {
  boardEntryIdentity,
  boardWinnerWithoutLean,
  readCrossroadsLean,
  resolveLeanOutcome,
  sameRoad,
  type CrossroadsIdentity,
  type CrossroadsLean,
  type LeanOutcome,
} from './crossroads';
import { crossroadsRoadName } from './crossroadsNames';
import { CROSSROADS_HOLD_MAX_TICKS } from '../data/premonition-constants';
import {
  CROSSROADS_ANSWER,
  CROSSROADS_ANSWER_DEFAULT,
  OUTCOME_TOAST,
  fillCrossroadsLine,
} from '../data/crossroads-content';

export interface PreparedLean {
  /** The lean as held on the node; `null` when none (or malformed). */
  held: CrossroadsLean | null;
  /** A value sat on `crossroadsLean` that did not read as a lean — clear it, trace it, no toast. */
  malformed: boolean;
  /** Held past `CROSSROADS_HOLD_MAX_TICKS` — resolves `lapsed_expired`, the board is not leaned. */
  expired: boolean;
  /** The lean the board multiplies (retargeted to the instance that reaches it), or `null`. */
  effective: CrossroadsLean | null;
  /** The encounter found only on the ranked list, to append to `topCandidates`. */
  pulledUp: ScoredCandidate | null;
}

export function prepareCrossroadsLean(
  rawLean: unknown,
  decision: { rankedCandidates: ScoredCandidate[]; topCandidates: ScoredCandidate[] },
  strategicCandidates: readonly ScoredStrategicCandidate[],
  tick: number,
): PreparedLean {
  const held = readCrossroadsLean(rawLean);
  const malformed = rawLean !== undefined && rawLean !== null && held === null;
  const none: PreparedLean = { held, malformed, expired: false, effective: null, pulledUp: null };
  if (!held) return none;
  if (tick - held.tick > CROSSROADS_HOLD_MAX_TICKS) return { ...none, expired: true };
  if (held.family === 'encounter') {
    const found = findHeldEncounter(decision, held.templateId, held.targetId ?? undefined);
    if (!found) return none;
    return {
      ...none,
      effective: { ...held, targetId: found.candidate.entry.locationId ?? null },
      pulledUp: found.fromRanked ? found.candidate : null,
    };
  }
  const onBoard = strategicCandidates.some(c => c.templateId === held.templateId && (c.targetNodeId ?? null) === held.targetId);
  return onBoard ? { ...none, effective: held } : none;
}

export interface ResolvedLean {
  outcome: LeanOutcome;
  leanTurned: boolean;
  trace: Omit<CrossroadsLeanOutcomeTrace, 'id' | 'timestamp'>;
  /** The toast line (outcome + answer); every resolved lean has one. */
  message: string;
}

/** The thread's bond reception, when the god's thread to this mortal carries one. */
export function bondReceptionOf(graph: WorldGraph, ascendantId: string | null | undefined, agentId: string): BondReception | undefined {
  if (!ascendantId) return undefined;
  const edge = graph.getOutgoingEdges(ascendantId, 'thread').find(e => e.target === agentId);
  return edge?.properties?.bondReception as BondReception | undefined;
}

export function isThreadedByGod(graph: WorldGraph, ascendantId: string | null | undefined, agentId: string): boolean {
  if (!ascendantId) return false;
  return graph.getOutgoingEdges(ascendantId, 'thread').some(e => e.target === agentId);
}

/**
 * Resolve a prepared lean against the decided board. `boardWinner` is the floored
 * winner the live branch acted on (`null` = idle).
 */
export function resolveCrossroadsLean(
  prepared: PreparedLean,
  board: { entries: readonly BoardEntry[]; winner: BoardEntry | null },
  encounterCandidates: readonly ScoredCandidate[],
  strategicCandidates: readonly ScoredStrategicCandidate[],
  ctx: {
    agentId: string; agentName: string; tick: number; floor: number; reception?: BondReception;
    /**
     * The road actually taken when an override (a held Compulsion, a compelled
     * journey) replaced the board's winner. The outcome and the toast then describe
     * what the mortal really does, and the lean turned nothing (review-gate round 1).
     */
    overriddenTo?: CrossroadsIdentity;
  },
): ResolvedLean | null {
  const held = prepared.held;
  if (!held) return null;
  const overridden = ctx.overriddenTo !== undefined;
  const winner: CrossroadsIdentity | null = overridden
    ? ctx.overriddenTo!
    : board.winner
      ? boardEntryIdentity(board.winner, encounterCandidates, strategicCandidates)
      : null;
  const lean = prepared.effective ?? held;
  const outcome: LeanOutcome = prepared.expired
    ? 'lapsed_expired'
    : resolveLeanOutcome(lean, winner, prepared.effective !== null, ctx.tick);

  let leanTurned = false;
  if (prepared.effective && !overridden) {
    const unleaned = boardWinnerWithoutLean(board.entries, ctx.floor);
    const unleanedId = unleaned ? boardEntryIdentity(unleaned, encounterCandidates, strategicCandidates) : null;
    leanTurned = !(unleanedId === null && winner === null)
      && !(unleanedId !== null && winner !== null && sameRoad(unleanedId, winner));
  }

  const name = ctx.agentName;
  const road = crossroadsRoadName(lean);
  let line: string;
  if (outcome === 'followed') line = OUTCOME_TOAST.followed[lean.direction];
  else if (outcome === 'resisted') {
    line = lean.direction === 'toward' && !winner ? OUTCOME_TOAST.resisted_idle : OUTCOME_TOAST.resisted[lean.direction];
  } else line = OUTCOME_TOAST[outcome];
  const chosen = winner ? crossroadsRoadName(winner) : '';
  let message = fillCrossroadsLine(line, { name, road, chosen });
  if (outcome === 'followed' || outcome === 'resisted') {
    const answers = (ctx.reception && CROSSROADS_ANSWER[ctx.reception]) || CROSSROADS_ANSWER_DEFAULT;
    message = `${message} ${fillCrossroadsLine(answers[outcome], { name })}`;
  }

  return {
    outcome,
    leanTurned,
    message,
    trace: {
      category: 'crossroads_lean_outcome',
      tick: ctx.tick,
      agentId: ctx.agentId,
      family: lean.family,
      templateId: lean.templateId,
      targetId: lean.targetId,
      direction: lean.direction,
      outcome,
      heldTicks: ctx.tick - held.tick,
      winnerFamily: winner?.family ?? 'idle',
      winnerId: winner?.templateId ?? null,
      leanTurned,
      forecastAtPlacement: held.forecastAtPlacement,
      summary: message,
    },
  };
}
