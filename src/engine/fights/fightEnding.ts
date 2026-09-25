/**
 * The fighter-side ending of a fight (THR-1548, plan doc
 * `Docs/plans/2026-09-23-defeat-and-victory.md` §1–3, slice D1).
 *
 * The fighter branch of the post-fight dispatcher (`fightOutcome.ts`). It turns the
 * fight's result into what the world remembers about the *fighter*: a scar, a grudge,
 * lost face, a death with a culprit. Every write goes through a writer that already
 * exists — the death funnel, `writeGrudge`, the condition applier, the reputation
 * writer, the value-drift writer and the reactive loop's outcome node.
 *
 * | Result | Writes (D1) |
 * |---|---|
 * | `broke_off` | nothing |
 * | `yielded` to a **monster** (or to no opponent node) | nothing |
 * | `yielded` to a **mortal** | drift toward prudence, and **humiliation**: face lost at home |
 * | `routed` | drift toward prudence |
 * | `struck_down` | the death gate: guards, then one kill draw (monster victors only); **mauled** (Scarred + a `blood_drawn` grudge) or **slain** (the funnel + the reactive loop) |
 * | `overcome` / `driven_off` / `bargained` | the face only — the victory yields are D2 |
 *
 * Whatever the face, the branch records what it wrote as `fightState.ending` (the
 * `FightEndingRecord`), returned as its patch, so plan doc 4's chips read state and
 * never the trace buffer (Law 56).
 *
 * **Guards before any kill** (the funnel carries neither): The First is never killed
 * in a fight, and neither is the god's avatar. Both guards are checked first, then the
 * single kill draw, so `killRoll` is present exactly when a draw happened. The ward
 * (`death_prevented`) is the funnel's own and surfaces here as `guard: 'warded'`.
 *
 * **Who can kill.** Only a monster victor, in v1: a named mortal victor on a derived
 * card mauls; a duel victor's mercy is plan doc 5's E2 (THR-1557), which calls this
 * module's `fightDeathGuard` and `killStruckDownFighter` in the same order.
 *
 * NFP #1: every number is in `data/fight-constants.ts`.
 * NFP #2: one `fight.ending` trace per fight; `fightState.ending` on the action.
 * NFP #3: one seeded draw (`ctx.rng`), only on `struck_down`, only after the guards.
 * NFP #4: each writer's refusal degrades to "mauled" or "skip"; nothing here throws on
 * missing data, and a throw is caught by `finalizeFightEnd`.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { ValuePair } from '../../types/agent';
import type { FightEndingFace, FightEndingRecord, FightState } from '../../types/fight';
import type { FightEndingTrace } from '../../types/traces/fight-traces';
import type { FightEndBranch, FightEndContext } from './fightOutcome';
import {
  FIGHT_CONCESSION_AXIS,
  FIGHT_DEATH_HARM_CLASS,
  FIGHT_ENDING_DRIFT,
  FIGHT_HUMILIATION_CAUSE,
  FIGHT_HUMILIATION_REPUTATION,
  FIGHT_KILL_CHANCE_BY_TEMPER,
  FIGHT_SCARRED_INTENSITY,
  FIGHT_SCARRED_TRAIT_ID,
} from '../../data/fight-constants';
import { LOCATION_CLASSES } from '../../data/world-objects';
import { markMortalDead } from '../agentLifecycle';
import { readResidence } from '../agentResidence';
import { applyConditionToActor } from '../effects/conditionApplier';
import { driftTowardPole } from '../encounters/branchDecision';
import { writeGrudge } from '../grievance/grudgeEdge';
import { createUndertakingOutcomeNode } from '../grievance/undertakingOutcomeNode';
import { isMonster } from '../monsters/isMonster';
import { applyReputationWithDelta } from '../reputation';
import { touchWorld } from '../simulationRuntime';
import { resolveToParentLocation } from '../sublocationShape';
import { emitTrace } from '../traceBuffer';
import { readOpponentCard } from './opponentCard';

/** Why a struck-down fighter was not killed before any draw was taken. */
export type FightDeathGuard = 'the_first' | 'avatar';

const SETTLEMENT_SUBTYPES: ReadonlySet<string> = new Set(LOCATION_CLASSES.settlement ?? []);

/** A living opponent node, or undefined for a default card / a gone opponent. */
function opponentNode(graph: WorldGraph, fight: FightState): GraphNode | undefined {
  if (!fight.opponentId) return undefined;
  return graph.getNode(fight.opponentId) ?? undefined;
}

/** A mortal a fighter can yield *to*: an individual actor that is not a lair's monster. */
function isMortalOpponent(node: GraphNode | undefined): boolean {
  return !!node && node.type === 'actor' && node.properties.actorType === 'individual' && !isMonster(node);
}

/**
 * The guards a fight's death gate checks before any kill draw (plan doc §2). The First
 * — the target of an ascendant's `thread` edge marked `courtPosition: 'the_first'` —
 * and any god's avatar are never killed by a fight in v1. Read from the fighter's own
 * edges, so the guard holds for every ascendant without knowing which one is playing.
 *
 * Exported for plan doc 5's E2, which calls the same guards in the same order.
 */
export function fightDeathGuard(graph: WorldGraph, fighterId: string): FightDeathGuard | undefined {
  const isFirst = graph.getIncomingEdges(fighterId, 'thread').some(
    e => (e.properties as { courtPosition?: string } | undefined)?.courtPosition === 'the_first',
  );
  if (isFirst) return 'the_first';
  if (graph.getOutgoingEdges(fighterId, 'avatar_of').length > 0) return 'avatar';
  return undefined;
}

/** The face of a fight's ending, from the fighter's side (before the death gate). */
export function fightEndingFace(graph: WorldGraph, fight: FightState): FightEndingFace {
  const opponent = opponentNode(graph, fight);
  switch (fight.result) {
    case 'overcome':
      return isMortalOpponent(opponent) ? 'overcome_mortal' : 'overcome_monster';
    case 'driven_off': return 'driven_off';
    case 'bargained': return 'bargained';
    // Nobody was yielded to when there is no opponent node, so nobody tells (§2b).
    case 'yielded': return isMortalOpponent(opponent) ? 'yielded_to_mortal' : 'yielded_to_monster';
    case 'routed': return 'routed';
    case 'struck_down': return 'mauled';
    case 'broke_off':
    default:
      return 'broke_off';
  }
}

/** A settlement-class location, climbing from a place to its location first. */
function asSettlement(graph: WorldGraph, id: string | undefined): GraphNode | undefined {
  if (!id) return undefined;
  const loc = resolveToParentLocation(graph, graph.getNode(id));
  if (!loc || loc.type !== 'location') return undefined;
  return SETTLEMENT_SUBTYPES.has(loc.properties.locationSubtype as string) ? loc : undefined;
}

/**
 * The settlement the fighter calls home (§2b): the residence's origin, climbed to its
 * location, when that is a settlement; failing that, the last observed position under
 * the same test; failing both, none.
 */
export function fighterHomeSettlement(graph: WorldGraph, fighterId: string): GraphNode | undefined {
  const residence = readResidence(graph, fighterId);
  return asSettlement(graph, residence.originLocationId) ?? asSettlement(graph, residence.positionId);
}

/** Where the fighter stands, captured before any write (the site of a fight death). */
function fighterPositionId(graph: WorldGraph, fighterId: string): string | undefined {
  return graph.getOutgoingEdges(fighterId, 'located_at')[0]?.target;
}

/** Drift the fighter's values one ending-step toward a pole (the shared value writer). */
function drift(
  state: GameState,
  fighterId: string,
  axis: ValuePair,
  pole: 'positive' | 'negative',
  tick: number,
): { axis: ValuePair; pole: 'positive' | 'negative' } {
  // Fail-soft: a state that never carried a drift array starts one here.
  state.archetypeDrift = driftTowardPole(state.archetypeDrift ?? [], fighterId, axis, pole, tick, FIGHT_ENDING_DRIFT).drift;
  return { axis, pole };
}

/** What the mauled writes did. */
interface MauledWrites {
  readonly scarWritten: boolean;
  readonly scarSkipped?: FightEndingTrace['scarSkipped'];
  readonly grudgeWritten: boolean;
}

/**
 * The mauled writes (plan doc §2): a permanent Scarred edge through the condition
 * applier — unless the fighter already bears one, since the first scar is the story —
 * and a `blood_drawn` grudge toward the victor, monster or mortal, upgrading a standing
 * friction edge (`old_quarrel`, `covets`) to the injury.
 */
export function writeMauled(
  state: GameState,
  fighterId: string,
  victorId: string | null,
  tick: number,
): MauledWrites {
  const graph = state.graph;
  let scarWritten = false;
  let scarSkipped: MauledWrites['scarSkipped'];

  const alreadyScarred = graph.getOutgoingEdges(fighterId, 'has_trait').some(e => e.target === FIGHT_SCARRED_TRAIT_ID);
  if (alreadyScarred) {
    // The applier would mint a second edge (it never reads `maxLevel`); D1 checks first.
    scarSkipped = 'already_scarred';
  } else {
    const applied = applyConditionToActor(state, fighterId, FIGHT_SCARRED_TRAIT_ID, {
      tick,
      intensity: FIGHT_SCARRED_INTENSITY,
      edgeId: `has_trait_${fighterId}_${FIGHT_SCARRED_TRAIT_ID}`,
      edgeProperties: { ...(victorId ? { inflictedBy: victorId } : {}), scarredTick: tick },
    });
    if (applied.applied) scarWritten = true;
    else scarSkipped = applied.reason === 'tag_immunity' ? 'immune' : 'definition_missing';
  }

  const grudgeWritten = victorId
    ? writeGrudge(graph, fighterId, victorId, tick, 'blood_drawn', { upgradeCause: true })
    : false;

  return { scarWritten, ...(scarSkipped ? { scarSkipped } : {}), grudgeWritten };
}

/** What the death gate decided for a struck-down fighter. */
interface DeathGateResult {
  readonly face: 'mauled' | 'slain';
  readonly guard?: FightEndingRecord['guard'];
  readonly killRoll?: { chance: number; roll: number };
  readonly outcomeNodeId?: string;
}

/**
 * Kill a struck-down fighter through the one funnel, and emit the plot's shape into the
 * reactive loop when they died (plan doc §2–3). Exported for plan doc 5's E2.
 *
 * `warded` / `not_a_mortal` → the fighter lives (`guard: 'warded'`); `echo` → an Aspect
 * lives on as myth, which the funnel handles, and the harm is emitted as the plot's is.
 */
export function killStruckDownFighter(
  state: GameState,
  action: UnifiedAction,
  victorId: string,
  ctx: FightEndContext,
): { died: boolean; outcomeNodeId?: string } {
  const fighterId = action.actorId;
  const siteId = fighterPositionId(state.graph, fighterId);
  const death = markMortalDead(
    state.graph, fighterId, ctx.tick,
    { cause: 'fight', byActorId: victorId, mode: 'retain' },
    ctx.runtime, ctx.overrideCtx,
  );
  if (death.outcome === 'warded' || death.outcome === 'not_a_mortal') return { died: false };

  // A fight death is a harm with a culprit, exactly the plot's shape: `named_death`,
  // the victor in the primary role, the dead in the target role (THR-1536 routes it on
  // to their living bonds). The god is excluded as a culprit by the writer itself.
  const outcomeNodeId = createUndertakingOutcomeNode({
    graph: state.graph,
    source: {
      kind: 'fight',
      actorId: fighterId,
      actionId: action.actionId,
      templateId: action.templateId,
      targetNodeId: fighterId,
      ...(siteId ? { siteId } : {}),
    },
    harmClass: FIGHT_DEATH_HARM_CLASS,
    tick: ctx.tick,
    culpritAgentId: victorId,
    victimAgentId: fighterId,
    ascendantId: state.ascendantId,
  });
  return { died: true, ...(outcomeNodeId ? { outcomeNodeId } : {}) };
}

/**
 * The death gate for a struck-down fighter (plan doc §2): guards first, then — for a
 * monster victor only — one kill draw at its temper's chance.
 */
function struckDown(
  state: GameState,
  action: UnifiedAction,
  fight: FightState,
  ctx: FightEndContext,
): DeathGateResult {
  const graph = state.graph;
  const guard = fightDeathGuard(graph, action.actorId);
  if (guard) return { face: 'mauled', guard };

  const victor = opponentNode(graph, fight);
  // Only a monster victor kills in v1: a named mortal on a derived card mauls, and a
  // duel's mercy is plan doc 5's (E2). No victor node, no draw.
  if (!victor || !isMonster(victor)) return { face: 'mauled' };

  const temper = readOpponentCard(graph, victor.id, ctx.tick).temper;
  const chance = FIGHT_KILL_CHANCE_BY_TEMPER[temper] ?? 0;
  const roll = ctx.rng();
  const killRoll = { chance, roll };
  if (roll >= chance) return { face: 'mauled', killRoll };

  const killed = killStruckDownFighter(state, action, victor.id, ctx);
  if (!killed.died) return { face: 'mauled', killRoll, guard: 'warded' };
  return { face: 'slain', killRoll, ...(killed.outcomeNodeId ? { outcomeNodeId: killed.outcomeNodeId } : {}) };
}

/** Face lost at home for yielding to a person (§2b). Undefined when no write landed. */
function humiliate(
  state: GameState,
  fighterId: string,
  tick: number,
): { counterpartyId: string; delta: number } | undefined {
  const home = fighterHomeSettlement(state.graph, fighterId);
  if (!home) return undefined;
  const delta = -FIGHT_HUMILIATION_REPUTATION;
  const written = applyReputationWithDelta(state.graph, fighterId, home.id, delta, tick, FIGHT_HUMILIATION_CAUSE);
  return written.applied ? { counterpartyId: home.id, delta } : undefined;
}

/** Who won the fight, from the fighter's side (the trace's `victorId`). */
function victorOf(action: UnifiedAction, fight: FightState): string | null {
  switch (fight.result) {
    case 'overcome': case 'driven_off': case 'bargained': return action.actorId;
    case 'yielded': case 'routed': case 'struck_down': return fight.opponentId ?? null;
    default: return null;
  }
}

/**
 * The fighter-side ending: every defeat face's writes and the record of them. Pure
 * apart from the writers it calls; returns the `FightEndingRecord` and the trace.
 */
export function applyFightEndingForFighter(
  state: GameState,
  action: UnifiedAction,
  fight: FightState,
  ctx: FightEndContext,
): { ending: FightEndingRecord; events: TickEvent[] } {
  const graph = state.graph;
  const fighterId = action.actorId;
  let face = fightEndingFace(graph, fight);
  let scarWritten = false;
  let scarSkipped: FightEndingTrace['scarSkipped'];
  let grudgeWritten = false;
  let guard: FightEndingRecord['guard'];
  let killRoll: FightEndingRecord['killRoll'];
  let outcomeNodeId: string | undefined;
  let humiliation: FightEndingRecord['humiliation'];
  let driftRec: FightEndingRecord['drift'];

  switch (face) {
    case 'yielded_to_mortal':
      driftRec = drift(state, fighterId, FIGHT_CONCESSION_AXIS, 'negative', ctx.tick);
      humiliation = humiliate(state, fighterId, ctx.tick);
      break;
    case 'routed':
      driftRec = drift(state, fighterId, FIGHT_CONCESSION_AXIS, 'negative', ctx.tick);
      break;
    case 'mauled': {
      const gate = struckDown(state, action, fight, ctx);
      face = gate.face;
      guard = gate.guard;
      killRoll = gate.killRoll;
      outcomeNodeId = gate.outcomeNodeId;
      if (gate.face === 'mauled') {
        const victorId = opponentNode(graph, fight)?.id ?? null;
        const mauled = writeMauled(state, fighterId, victorId, ctx.tick);
        scarWritten = mauled.scarWritten;
        scarSkipped = mauled.scarSkipped;
        grudgeWritten = mauled.grudgeWritten;
      }
      break;
    }
    default:
      // broke_off, yielded_to_monster: nothing beyond the exchanges' own writes.
      // overcome / driven_off / bargained: the victory yields are D2's.
      break;
  }

  if (ctx.runtime && (scarWritten || grudgeWritten || humiliation || driftRec)) touchWorld(ctx.runtime);

  const ending: FightEndingRecord = {
    face,
    scarWritten,
    grudgeWritten,
    ...(humiliation ? { humiliation } : {}),
    ...(killRoll ? { killRoll } : {}),
    ...(guard ? { guard } : {}),
    ...(driftRec ? { drift: driftRec } : {}),
  };

  const victorId = victorOf(action, fight);
  emitTrace({
    category: 'fight.ending',
    tick: ctx.tick,
    agentId: fighterId,
    actionId: action.actionId,
    fighterId,
    victorId,
    result: fight.result!,
    face,
    ...(killRoll ? { killRoll } : {}),
    ...(guard ? { guard } : {}),
    scarWritten,
    ...(scarSkipped ? { scarSkipped } : {}),
    grudgeWritten,
    ...(outcomeNodeId ? { outcomeNodeId } : {}),
    ...(humiliation ? { humiliation } : {}),
    ...(driftRec ? { drift: driftRec } : {}),
    summary: `fight.ending: ${fighterId} ${fight.result} → ${face}`
      + (victorId && victorId !== fighterId ? ` (by ${victorId})` : '')
      + (guard ? ` [guard ${guard}]` : '')
      + (killRoll ? ` kill ${killRoll.roll.toFixed(3)}<${killRoll.chance}` : '')
      + (scarWritten ? ' scarred' : scarSkipped ? ` scar skipped (${scarSkipped})` : '')
      + (grudgeWritten ? ' grudge' : '')
      + (humiliation ? ` humiliated at ${humiliation.counterpartyId}` : ''),
  } as FightEndingTrace);

  return { ending, events: [] };
}

/** The dispatcher branch (registered first in `FIGHT_END_BRANCHES`). */
export const fighterEndingBranch: FightEndBranch = (state, action, ctx) => {
  const fight = action.fightState;
  if (!fight?.result) return;
  const { ending, events } = applyFightEndingForFighter(state, action, fight, ctx);
  return { patch: { ending }, events };
};
