/**
 * The Crossroads (THR-1926) — read a threaded mortal's next three roads off the one
 * decision board, and turn a god's lean into one more board multiplier.
 *
 * Pure: no graph writes, no randomness (the module never imports `rng` and never takes
 * the shared `decisionRng` — an ordering change there would shift every later agent's
 * draws). Everything here is a deterministic function of board numbers and the
 * § CROSSROADS constants in `premonition-constants.ts`.
 *
 * **One multiplier function, two callers (Law 18).** `crossroadsLeanMultiplier` is what
 * `scoreUnifiedBoard` multiplies into each entry at decision time *and* what
 * `forecastLean` applies to the snapshot at click time, so the forecast word is the
 * decision's arithmetic on the decision's own numbers.
 *
 * Writers of the two node properties live elsewhere: `phaseAgentDecision` writes
 * `crossroads` (the snapshot) and clears `crossroadsLean` at resolution;
 * `crossroadsActions` places and lifts `crossroadsLean`.
 *
 * @see Docs/plans/2026-10-14-thr-1926-the-crossroads.md
 */

import type { BoardEntry } from './decisionBoard';
import type { ScoredCandidate } from './encounterScoring';
import type { ScoredStrategicCandidate } from './strategicActionScoring';
import type { ReachDomain } from '../types/traits';
import type { CreationSphereName } from '../types';
import { REACH_DOMAINS } from '../types/traits';
import { pickPrimaryReach } from './undertakingCheckpoints';
import { getStrategicTemplate } from './strategicActionCandidates';
import {
  CROSSROADS_OPTION_COUNT,
  CROSSROADS_LEAN_TOWARD_MULT,
  CROSSROADS_LEAN_AWAY_MULT,
  CROSSROADS_TORN_RATIO,
  CROSSROADS_LEANING_RATIO,
  CROSSROADS_LIKELY_MARGIN,
  CROSSROADS_LEAN_COST_BASE,
  CROSSROADS_LEAN_COST_PER_RANK,
  CROSSROADS_LEAN_AWAY_COST,
  CROSSROADS_HOLD_MAX_TICKS,
  CROSSROADS_AWAY_WAITS_FOR_REACH,
} from '../data/premonition-constants';
import { BOARD_SCORE_FLOOR } from '../data/strategic-action-constants';

// ─── Shapes ─────────────────────────────────────────────────────

export type CrossroadsFamily = 'encounter' | 'strategic_action';
export type LeanDirection = 'toward' | 'away';

/** What identifies one road: family + template + target. */
export interface CrossroadsIdentity {
  family: CrossroadsFamily;
  templateId: string;
  /** encounter: the cache entry's `locationId` · undertaking: the candidate's `targetNodeId`. */
  targetId: string | null;
}

/** One option the mortal weighs. */
export interface CrossroadsOption extends CrossroadsIdentity {
  /** The board score as the board computed it (whisper, window, … already folded in). */
  score: number;
  /** Prices and tints the lean (`REACH_TO_SPHERE`). */
  reach: ReachDomain;
  /**
   * THR-2214 — the road fits The First's chosen path: its board entry carried
   * `firstPathPull > 1`. Absent otherwise (and on every other mortal).
   */
  fitsPath?: true;
}

/** Written on the mortal at each full decision (node property `crossroads`). */
export interface CrossroadsSnapshot {
  tick: number;
  /** Top `CROSSROADS_OPTION_COUNT`, after the entry just taken and secret cells are dropped. */
  options: CrossroadsOption[];
}

/** Held on the mortal from the click until the next full decision (node property `crossroadsLean`). */
export interface CrossroadsLean extends CrossroadsIdentity {
  direction: LeanDirection;
  /** When placed — the hold clock. */
  tick: number;
  sphere: CreationSphereName;
  essencePaid: number;
  /** Rank in the snapshot when placed (0-based) — for the trace and the receipt. */
  rankWhenPlaced: number;
  /** The forecast word read at placement — traced beside the outcome for calibration. */
  forecastAtPlacement: LeanForecast;
}

export type SettlednessWord = 'set' | 'leaning' | 'torn';
export type LeanForecast = 'likely' | 'may' | 'not_enough';
export type LeanOutcome = 'followed' | 'resisted' | 'lapsed_expired' | 'lapsed_unavailable';

// ─── Identity ───────────────────────────────────────────────────

/** Same road: family, template and target all match (an absent target matches only an absent one). */
export function sameRoad(a: CrossroadsIdentity, b: CrossroadsIdentity): boolean {
  return a.family === b.family && a.templateId === b.templateId && (a.targetId ?? null) === (b.targetId ?? null);
}

/** The identity of a board entry, resolved back through its family's candidate array. */
export function boardEntryIdentity(
  entry: Pick<BoardEntry, 'family' | 'candidateIndex'>,
  encounterCandidates: readonly ScoredCandidate[],
  strategicCandidates: readonly ScoredStrategicCandidate[],
): CrossroadsIdentity | null {
  if (entry.family === 'encounter') {
    const c = encounterCandidates[entry.candidateIndex];
    return c ? { family: 'encounter', templateId: c.entry.templateId, targetId: c.entry.locationId ?? null } : null;
  }
  if (entry.family === 'strategic_action') {
    const c = strategicCandidates[entry.candidateIndex];
    return c ? { family: 'strategic_action', templateId: c.templateId, targetId: c.targetNodeId ?? null } : null;
  }
  return null;
}

// ─── The multiplier ─────────────────────────────────────────────

/** The board multiplier a held lean puts on one road: 1 unless the identity matches. */
export function crossroadsLeanMultiplier(
  road: CrossroadsIdentity,
  lean: Pick<CrossroadsLean, 'family' | 'templateId' | 'targetId' | 'direction'> | null | undefined,
): number {
  if (!lean || !sameRoad(road, lean)) return 1;
  return lean.direction === 'toward' ? CROSSROADS_LEAN_TOWARD_MULT : CROSSROADS_LEAN_AWAY_MULT;
}

// ─── The snapshot ───────────────────────────────────────────────

export interface CrossroadsSnapshotBuild {
  snapshot: CrossroadsSnapshot;
  /** The id of the entry skipped because the mortal just took it. */
  excludedTaken: string | null;
  /** How many secret-cell entries were skipped (THR-1433: never shown). */
  excludedSecret: number;
}

/**
 * The snapshot of the board the mortal just decided with: its entries in board order,
 * minus the entry it took (it is already doing that — the lean applies to the *next*
 * choice) and minus secret cells, cut at `CROSSROADS_OPTION_COUNT`. An entry whose
 * candidate cannot be resolved (index drift) is skipped, never thrown.
 *
 * `taken` is the board entry the mortal took, or — when an override (a held
 * Compulsion, a compelled journey) took something else — that road's identity.
 *
 * **The lean just resolved is divided back out** (review-gate round 1): it is cleared
 * at this same decision, so the next decision will not apply it. Scores and order are
 * the unleaned board's (the board's own comparator), so the next reading, its
 * settledness and every forecast word are the next decision's arithmetic (Law 18).
 */
export function buildCrossroadsSnapshotDetailed(
  entries: readonly BoardEntry[],
  encounterCandidates: readonly ScoredCandidate[],
  strategicCandidates: readonly ScoredStrategicCandidate[],
  taken: BoardEntry | CrossroadsIdentity | null,
  isSecret: (templateId: string) => boolean,
  tick: number,
): CrossroadsSnapshotBuild {
  const options: CrossroadsOption[] = [];
  let excludedTaken: string | null = null;
  let excludedSecret = 0;
  const unleaned = entries
    .map((e, pos) => ({ e, pos, s: e.score / (e.crossroadsLean ?? 1) }))
    .sort((a, b) => (Number(!!b.e.restlessRoadGoal) - Number(!!a.e.restlessRoadGoal))
      || (b.s - a.s) || (a.pos - b.pos));
  for (const { e: entry, s: score } of unleaned) {
    if (options.length >= CROSSROADS_OPTION_COUNT) break;
    if (entry.family === 'strategic_action' && isSecret(entry.id)) {
      excludedSecret++;
      continue;
    }
    if (!Number.isFinite(score)) continue;
    const identity = boardEntryIdentity(entry, encounterCandidates, strategicCandidates);
    if (!identity) continue;
    const isTaken = taken !== null && ('candidateIndex' in taken
      ? entry.family === taken.family && entry.candidateIndex === taken.candidateIndex
      : sameRoad(identity, taken));
    if (isTaken && excludedTaken === null) {
      excludedTaken = entry.id;
      continue;
    }
    const reach = identity.family === 'encounter'
      ? encounterCandidates[entry.candidateIndex]?.entry.reachPrimary
      : pickPrimaryReach(getStrategicTemplate(identity.templateId));
    options.push({
      ...identity,
      score,
      reach: isReach(reach) ? reach : 'iron',
      ...((entry.firstPathPull ?? 1) > 1 ? { fitsPath: true as const } : {}),
    });
  }
  return { snapshot: { tick, options }, excludedTaken, excludedSecret };
}

export function buildCrossroadsSnapshot(
  entries: readonly BoardEntry[],
  encounterCandidates: readonly ScoredCandidate[],
  strategicCandidates: readonly ScoredStrategicCandidate[],
  taken: BoardEntry | CrossroadsIdentity | null,
  isSecret: (templateId: string) => boolean,
  tick: number,
): CrossroadsSnapshot {
  return buildCrossroadsSnapshotDetailed(entries, encounterCandidates, strategicCandidates, taken, isSecret, tick).snapshot;
}

function isReach(value: unknown): value is ReachDomain {
  return typeof value === 'string' && (REACH_DOMAINS as readonly string[]).includes(value);
}

// ─── Words ──────────────────────────────────────────────────────

/**
 * How far ahead the first road is, `r = s₂ / s₁`: `torn` at or above
 * `CROSSROADS_TORN_RATIO`, `leaning` strictly above `CROSSROADS_LEANING_RATIO`, else
 * `set`. The ratios are chosen against both multipliers, so *set* means no single lean
 * in either direction turns them. `null` under two options, and `null` when the first
 * road is below `BOARD_SCORE_FLOOR` (an idle board: nothing there to be torn between —
 * review-gate round 2).
 */
export function settledness(snapshot: CrossroadsSnapshot | null | undefined, floor: number = BOARD_SCORE_FLOOR): SettlednessWord | null {
  const options = snapshot?.options ?? [];
  if (options.length < 2) return null;
  const s1 = options[0].score;
  const s2 = options[1].score;
  if (!(s1 >= floor)) return null;
  const r = s2 / s1;
  if (r >= CROSSROADS_TORN_RATIO) return 'torn';
  if (r > CROSSROADS_LEANING_RATIO) return 'leaning';
  return 'set';
}

/**
 * What a lean would do to this snapshot, in one word: apply the decision's own
 * multiplier, re-sort (ties keep snapshot order, the board's rule) and read the lead.
 *
 * - toward: the target leads by ≥ `CROSSROADS_LIKELY_MARGIN` → `likely`; leads by less → `may`; behind → `not_enough`.
 * - away on the leader: the new leader leads by the margin → `likely`; by less → `may`; the leader holds → `not_enough`.
 * - away on a non-leader: `likely` — the leader still leads (the row only offers away on the leader).
 * - THR-2189, `awayWaits` on (default `CROSSROADS_AWAY_WAITS_FOR_REACH`): away on the leader → `likely`.
 *   The lean now waits for the decision where the mortal reaches for that road again, and the
 *   snapshot's lead carries no signal about that decision; the word is its measured rate (74%).
 *
 * The board's floor binds as it does at the decision (review-gate round 2): a toward
 * target whose leaned score stays below `floor` cannot win — the board idles — so it
 * reads `not_enough`, never an infinite lead over a zero runner-up.
 */
export function forecastLean(
  snapshot: CrossroadsSnapshot,
  lean: Pick<CrossroadsLean, 'family' | 'templateId' | 'targetId' | 'direction'>,
  floor: number = BOARD_SCORE_FLOOR,
  awayWaits: boolean = CROSSROADS_AWAY_WAITS_FOR_REACH,
): LeanForecast {
  const options = snapshot.options;
  const targetIdx = options.findIndex(o => sameRoad(o, lean));
  if (targetIdx < 0) return 'not_enough';
  if (lean.direction === 'away' && targetIdx !== 0) return 'likely';
  if (lean.direction === 'away' && awayWaits) return 'likely';
  const ranked = options
    .map((o, i) => ({ i, s: o.score * crossroadsLeanMultiplier(o, lean) }))
    .sort((a, b) => (b.s - a.s) || (a.i - b.i));
  const leader = ranked[0];
  const runnerUp = ranked[1];
  const lead = !runnerUp || runnerUp.s <= 0 ? Infinity : leader.s / runnerUp.s;
  const marginWord: LeanForecast = lead >= CROSSROADS_LIKELY_MARGIN ? 'likely' : 'may';
  if (lean.direction === 'toward') return leader.i === targetIdx && leader.s >= floor ? marginWord : 'not_enough';
  return leader.i === targetIdx ? 'not_enough' : marginWord;
}

/** The lean's price before Dominion: toward climbs a step per rank; away is flat (leader only). */
export function leanBaseCost(rank: number, direction: LeanDirection): number {
  if (direction === 'away') return CROSSROADS_LEAN_AWAY_COST;
  return CROSSROADS_LEAN_COST_BASE + CROSSROADS_LEAN_COST_PER_RANK * Math.max(0, Math.floor(rank));
}

// ─── Resolution ─────────────────────────────────────────────────

/**
 * How a held lean ended at the full decision that reads it.
 *
 * | condition | outcome |
 * |---|---|
 * | held longer than `CROSSROADS_HOLD_MAX_TICKS` | `lapsed_expired` |
 * | the target is not on the board | `lapsed_unavailable` |
 * | toward, the winner is the target / away, the winner is not | `followed` |
 * | otherwise | `resisted` |
 */
export function resolveLeanOutcome(
  lean: Pick<CrossroadsLean, 'family' | 'templateId' | 'targetId' | 'direction' | 'tick'>,
  winner: CrossroadsIdentity | null,
  targetOnBoard: boolean,
  tick: number,
): LeanOutcome {
  if (tick - lean.tick > CROSSROADS_HOLD_MAX_TICKS) return 'lapsed_expired';
  if (!targetOnBoard) return 'lapsed_unavailable';
  const winnerIsTarget = winner !== null && sameRoad(winner, lean);
  if (lean.direction === 'toward') return winnerIsTarget ? 'followed' : 'resisted';
  return winnerIsTarget ? 'resisted' : 'followed';
}

/**
 * The board's winner had the lean not been there: each entry's score with its
 * `crossroadsLean` divided back out, sorted by the board's own comparator, floored.
 * `leanTurned` is "this differs from the actual winner" — a god's lean is not the
 * mortal's free choice, so the engagement gauge keeps it out of the per-band invariant.
 */
export function boardWinnerWithoutLean(
  entries: readonly BoardEntry[],
  floor: number,
): BoardEntry | null {
  let best: { e: BoardEntry; s: number } | null = null;
  for (const e of entries) {
    const s = e.score / (e.crossroadsLean ?? 1);
    if (!best) { best = { e, s }; continue; }
    const cmp = (Number(!!e.restlessRoadGoal) - Number(!!best.e.restlessRoadGoal))
      || (s - best.s)
      || (best.e.candidateIndex - e.candidateIndex);
    if (cmp > 0) best = { e, s };
  }
  return best && best.s >= floor ? best.e : null;
}

// ─── Fail-soft readers (malformed saves read as absent) ─────────

function isIdentity(v: Record<string, unknown>): boolean {
  return (v.family === 'encounter' || v.family === 'strategic_action')
    && typeof v.templateId === 'string'
    && (v.targetId === null || typeof v.targetId === 'string');
}

export function readCrossroadsSnapshot(value: unknown): CrossroadsSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.tick !== 'number' || !Array.isArray(v.options)) return null;
  const options = (v.options as unknown[]).filter((o): o is CrossroadsOption =>
    !!o && typeof o === 'object' && isIdentity(o as Record<string, unknown>)
    && typeof (o as Record<string, unknown>).score === 'number'
    && isReach((o as Record<string, unknown>).reach));
  return { tick: v.tick, options };
}

export function readCrossroadsLean(value: unknown): CrossroadsLean | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!isIdentity(v)) return null;
  if (v.direction !== 'toward' && v.direction !== 'away') return null;
  if (typeof v.tick !== 'number' || typeof v.sphere !== 'string') return null;
  return {
    family: v.family as CrossroadsFamily,
    templateId: v.templateId as string,
    targetId: (v.targetId as string | null) ?? null,
    direction: v.direction,
    tick: v.tick,
    sphere: v.sphere as CreationSphereName,
    essencePaid: typeof v.essencePaid === 'number' ? v.essencePaid : 0,
    rankWhenPlaced: typeof v.rankWhenPlaced === 'number' ? v.rankWhenPlaced : 0,
    forecastAtPlacement: v.forecastAtPlacement === 'likely' || v.forecastAtPlacement === 'may'
      ? v.forecastAtPlacement : 'not_enough',
  };
}
