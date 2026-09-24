/**
 * What a fight step costs the fighter, and what it carries forward (THR-1539,
 * plan doc `Docs/plans/2026-09-23-fight-block.md` §7).
 *
 *  - **Harm** — `computeFightErosion`, `computeScaledErosion`'s shape on the fight
 *    band tables, queued for `phaseQuintessence` as `source: 'fight_harm'`. A fight
 *    step skips the generic quintessence band consequence, so this is the one harm
 *    path. It never writes quintessence directly (THR-1261).
 *  - **The floor** — harm is clamped by headroom above `QUINTESSENCE_RATIO_FLOOR`,
 *    or above `MEETING_QUINTESSENCE_FLOOR` when the fighter is The First: The First
 *    never dies in a fight, and because harm is queued, the floor has to live here
 *    rather than at the ending (plan doc 1's guard).
 *  - **Band conditions** — through `applyConditionToActor`, the one condition
 *    writer, so tag immunity and the `damaged` proxy behave as they do everywhere.
 *  - **Momentum** — the band's carry into the next fight step.
 *
 * Deterministic: no rng is drawn here.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { StepOutcome } from '../../types/unifiedAction';
import type { FightRole } from '../../types/fight';
import type { QuintessenceEvent } from '../../types/quintessence';
import {
  QUINTESSENCE_DEFAULT,
  QUINTESSENCE_MAX_DEFAULT,
} from '../../types/quintessence';
import {
  FIGHT_BERSERK_HARM_MULT,
  FIGHT_CLASH_CONDITIONS,
  FIGHT_CLASH_HARM_MULT,
  FIGHT_CLASH_MOMENTUM,
  FIGHT_CONDITION_INTENSITY,
  FIGHT_CONDITION_INTENSITY_SEVERE,
  FIGHT_HARM_BASE,
  FIGHT_HARM_SOURCE,
  FIGHT_NERVE_CARRY,
  FIGHT_NERVE_CONDITIONS,
  FIGHT_NERVE_HARM_MULT,
  type FightBandCondition,
} from '../../data/fight-constants';
import {
  DIFFICULTY_EROSION_SCALE,
  EROSION_ATTENDED_MULT,
  QUINTESSENCE_RATIO_FLOOR,
} from '../../data/nudge-constants';
import { MEETING_QUINTESSENCE_FLOOR } from '../../data/meeting-nudge-constants';
import { CONDITION_DURATIONS } from '../../data/condition-trait-content';
import { applyConditionToActor } from '../encounterAftermath';

/** Inputs to the fight harm formula. */
export interface FightErosionInput {
  readonly role: FightRole;
  readonly band: StepOutcome;
  /** `action.effectiveTier === 'story_beat'` — never the template's `intrinsicTier`. */
  readonly attended: boolean;
  /** The step's **resolved** difficulty (the card's), 0–1. */
  readonly difficulty: number;
  /** The fighter's quintessence ratio, net of harm already queued this tick. */
  readonly currentRatio?: number;
  readonly berserk?: boolean;
  /** The ratio harm may not take the fighter below. Defaults to `QUINTESSENCE_RATIO_FLOOR`. */
  readonly floor?: number;
}

/**
 * The quintessence ratio a fight step takes from the fighter (plan doc §7):
 *
 *     FIGHT_HARM_BASE × bandMult × (attended ? EROSION_ATTENDED_MULT : 1)
 *       × (1 + difficulty × DIFFICULTY_EROSION_SCALE) × (berserk ? FIGHT_BERSERK_HARM_MULT : 1)
 *
 * clamped by headroom above the floor. Fail-soft: a non-finite difficulty reads 0;
 * a missing ratio skips the clamp.
 */
export function computeFightErosion(input: FightErosionInput): number {
  const table = input.role === 'nerve' ? FIGHT_NERVE_HARM_MULT : FIGHT_CLASH_HARM_MULT;
  const bandMult = table[input.band] ?? 0;
  if (bandMult <= 0) return 0;
  const difficulty = Number.isFinite(input.difficulty) ? Math.max(0, Math.min(1, input.difficulty)) : 0;
  const raw = FIGHT_HARM_BASE
    * bandMult
    * (input.attended ? EROSION_ATTENDED_MULT : 1)
    * (1 + difficulty * DIFFICULTY_EROSION_SCALE)
    * (input.berserk ? FIGHT_BERSERK_HARM_MULT : 1);
  if (input.currentRatio === undefined || !Number.isFinite(input.currentRatio)) return raw;
  const headroom = input.currentRatio - (input.floor ?? QUINTESSENCE_RATIO_FLOOR);
  if (headroom <= 0) return 0;
  return Math.min(raw, headroom);
}

/** Whether `actorId` is a bonded First (a `thread` edge at `courtPosition: 'the_first'`). */
export function isBondedFirst(graph: WorldGraph, actorId: string): boolean {
  return graph.getIncomingEdges(actorId, 'thread').some(
    (e) => (e.properties as { courtPosition?: string } | undefined)?.courtPosition === 'the_first',
  );
}

/** The ratio a fighter's fight harm may not take them below. */
export function fightHarmFloorFor(graph: WorldGraph, actorId: string): number {
  return isBondedFirst(graph, actorId) ? MEETING_QUINTESSENCE_FLOOR : QUINTESSENCE_RATIO_FLOOR;
}

/**
 * The fighter's quintessence ratio **as it will settle**: the node's ratio plus
 * every delta already queued for them this tick. Several fight steps can queue
 * harm before `phaseQuintessence` settles, and the floor must hold across all of
 * them, not per step.
 */
export function pendingQuintessenceRatio(
  state: Pick<GameState, 'graph' | 'pendingQuintessenceEvents'>,
  actorId: string,
): number | undefined {
  const node = state.graph.getNode(actorId);
  if (!node) return undefined;
  const max = (node.properties.quintessenceMax ?? QUINTESSENCE_MAX_DEFAULT) as number;
  if (!Number.isFinite(max) || max <= 0) return undefined;
  const current = (node.properties.quintessence ?? QUINTESSENCE_DEFAULT) as number;
  const queued = (state.pendingQuintessenceEvents ?? [])
    .filter((e) => e.targetNodeId === actorId)
    .reduce((sum, e) => sum + e.delta, 0);
  return (current + queued) / max;
}

/**
 * Compute and queue this step's fight harm. Returns the ratio queued (0 when the
 * band costs nothing or the fighter is at their floor).
 */
export function queueFightHarm(
  state: Pick<GameState, 'graph' | 'pendingQuintessenceEvents'>,
  actorId: string,
  input: Omit<FightErosionInput, 'currentRatio' | 'floor'>,
  tick: number,
): number {
  const node = state.graph.getNode(actorId);
  const ratio = pendingQuintessenceRatio(state, actorId);
  const harm = computeFightErosion({
    ...input,
    currentRatio: ratio,
    floor: fightHarmFloorFor(state.graph, actorId),
  });
  if (harm <= 0 || !node) return 0;
  const max = (node.properties.quintessenceMax ?? QUINTESSENCE_MAX_DEFAULT) as number;
  const event: QuintessenceEvent = {
    targetNodeId: actorId,
    // The ratio is converted to the node's own scale, as a ratio floor demands.
    delta: -harm * (Number.isFinite(max) && max > 0 ? max : 1),
    source: FIGHT_HARM_SOURCE,
    tick,
  };
  if (!state.pendingQuintessenceEvents) {
    (state as { pendingQuintessenceEvents?: QuintessenceEvent[] }).pendingQuintessenceEvents = [];
  }
  state.pendingQuintessenceEvents!.push(event);
  return harm;
}

/** The condition a band leaves on the fighter, if any. */
export function fightBandCondition(role: FightRole, band: StepOutcome): FightBandCondition | undefined {
  return (role === 'nerve' ? FIGHT_NERVE_CONDITIONS : FIGHT_CLASH_CONDITIONS)[band];
}

/**
 * Land the band's condition on the fighter through `applyConditionToActor`.
 * Returns the condition trait id when it landed (tag immunity can refuse it).
 */
export function applyFightBandCondition(
  state: GameState,
  actorId: string,
  role: FightRole,
  band: StepOutcome,
  tick: number,
  actionId: string,
): string | undefined {
  const condition = fightBandCondition(role, band);
  if (!condition) return undefined;
  const result = applyConditionToActor(state, actorId, condition.conditionTraitId, {
    tick,
    intensity: condition.severe ? FIGHT_CONDITION_INTENSITY_SEVERE : FIGHT_CONDITION_INTENSITY,
    durationTicks: CONDITION_DURATIONS[condition.conditionTraitId] ?? 0,
    edgeId: `has_trait_${actorId}_${condition.conditionTraitId}_${tick}_fight_${actionId}`,
    edgeProperties: { sourceActionId: actionId, source: 'fight' },
  });
  return result.applied ? condition.conditionTraitId : undefined;
}

/** The modifier this band carries into the next fight step (plan doc §7). */
export function fightMomentumAfter(role: FightRole, band: StepOutcome): number {
  return (role === 'nerve' ? FIGHT_NERVE_CARRY : FIGHT_CLASH_MOMENTUM)[band] ?? 0;
}
