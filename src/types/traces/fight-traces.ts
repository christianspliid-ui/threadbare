/**
 * Fight traces (THR-1537, plan doc `Docs/plans/2026-09-23-fight-block.md` § Tracing).
 *
 * Each is registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`,
 * `TraceEntry`) in the slice that first emits it: `fight.step` in FB1;
 * `fight.clock` and `fight.end` in FB2; `fight.fork` in FB4. Dotted, as the plan
 * names them, following `resolution.input`.
 */

import type { TraceBase } from '../trace';
import type { ActionScale, StepOutcome } from '../unifiedAction';
import type { ReachDomain } from '../traits';
import type { FightOpponentStatus, FightRatingWord, FightRole, OpponentCardSource } from '../fight';

/** Emitted once per fight step, after the band is known. */
export interface FightStepTrace extends TraceBase {
  category: 'fight.step';
  actionId: string;
  templateId: string;
  fighterId: string;
  opponentId: string | null;
  opponentStatus: FightOpponentStatus;
  role: FightRole;
  /** The step index inside the action (the plan's `exchange`; 0 is the nerve step of a block). */
  exchange: number;
  card: {
    dread: FightRatingWord;
    might: FightRatingWord;
    /** The reach this step resolved at, after the override chain. */
    reach: ReachDomain;
    authoredReach: ReachDomain;
    readFrom: OpponentCardSource;
  };
  difficulty: number;
  opponentModifierDelta: number;
  /** Always `FIGHT_STEP_SCALE` today. */
  scale: ActionScale;
  /** The fighter's named terms; cards and trait variants ride `resolution.input`. */
  modifiers: { name: string; delta: number }[];
  band: StepOutcome;
  probability: number;
  /** FB2 (THR-1538) writes the clock; until then no fight step moves it. */
  clockDelta: number;
  clockNow: number;
  clockSize: number;
  /** FB3 (THR-1539) queues fight harm; until then 0. */
  harmQueued: number;
  conditionsApplied: string[];
}
