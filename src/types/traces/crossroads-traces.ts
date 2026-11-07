/**
 * Crossroads trace variants (THR-1926).
 *
 * Emitted by `crossroadsActions` (placed, lifted) and `phaseAgentDecision` (outcome,
 * snapshot). Registered in `TraceCategory`, `TRACE_CATEGORIES` and `TraceEntry`.
 * `forecastAtPlacement` beside `outcome` is the Law 18 calibration measure: the share
 * of `likely` leans that end `followed`.
 *
 * @see Docs/plans/2026-10-14-thr-1926-the-crossroads.md § Tracing
 */

import type { CreationSphereName } from '../index';
import type { DominionBand } from '../../data/dominion-content';
// Type-only, deliberately circular: `trace.ts` names these interfaces as `TraceEntry`
// members (THR-1065) while they extend its base. `import type` is erased at build.
import type { TraceBase } from '../trace';

type Family = 'encounter' | 'strategic_action';
type Direction = 'toward' | 'away';
type Forecast = 'likely' | 'may' | 'not_enough';

/** The player placed a lean (`crossroadsActions.placeCrossroadsLean`). */
export interface CrossroadsLeanPlacedTrace extends TraceBase {
  category: 'crossroads_lean_placed';
  agentId: string;
  family: Family;
  templateId: string;
  targetId: string | null;
  direction: Direction;
  rankWhenPlaced: number;
  forecast: Forecast;
  essenceCost: number;
  baseCost: number;
  dominionBand: DominionBand;
  sphere: CreationSphereName;
}

/** The player lifted a held lean (no refund). */
export interface CrossroadsLeanLiftedTrace extends TraceBase {
  category: 'crossroads_lean_lifted';
  agentId: string;
  templateId: string;
  heldTicks: number;
}

/** A held lean resolved at the mortal's next full decision. */
export interface CrossroadsLeanOutcomeTrace extends TraceBase {
  category: 'crossroads_lean_outcome';
  agentId: string;
  family: Family;
  templateId: string;
  targetId: string | null;
  direction: Direction;
  outcome: 'followed' | 'resisted' | 'lapsed_expired' | 'lapsed_unavailable';
  heldTicks: number;
  winnerFamily: Family | 'idle';
  winnerId: string | null;
  /** The lean changed the board winner. */
  leanTurned: boolean;
  forecastAtPlacement: Forecast;
}

/**
 * A held lean's road was on no list at this full decision, so the lean waits for the
 * next one instead of lapsing (THR-2188). At most one per decision per threaded mortal
 * holding a lean, for at most `CROSSROADS_HOLD_MAX_TICKS`.
 */
export interface CrossroadsLeanWaitingTrace extends TraceBase {
  category: 'crossroads_lean_waiting';
  agentId: string;
  family: Family;
  templateId: string;
  targetId: string | null;
  direction: Direction;
  /** tick − lean.tick */
  heldTicks: number;
}

/** A threaded mortal's snapshot was written — emitted only while tracing is on (NFP #7). */
export interface CrossroadsSnapshotTrace extends TraceBase {
  category: 'crossroads_snapshot';
  agentId: string;
  options: Array<{ family: string; templateId: string; targetId: string | null; score: number }>;
  excludedTaken: string | null;
  excludedSecret: number;
  settledness: 'set' | 'leaning' | 'torn' | null;
}
