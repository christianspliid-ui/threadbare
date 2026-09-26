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
 * | `overcome` a **monster** | (D2) the trophy through `drawSeededReward` (site `fight_trophy`), gratitude from the nearest settlement |
 * | `overcome` a **mortal** | (D2) standing with the loser's faction ?? home, drift toward courage |
 * | `driven_off` | (D2) a little gratitude from the nearest settlement |
 * | `bargained` | (D2) the hoard (one trophy draw), drift toward mercy |
 *
 * D2 (THR-1549) also gives the victor of a yield-to-a-mortal their standing, and turns
 * every ending into one `fight_ended` tick event whose message is the face's chronicle
 * line; notable faces clear `phaseNarrative`'s threshold and become chronicle rows.
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
 * **Who can kill.** A monster victor, and a duel's victor (THR-1557): a named mortal
 * victor on a derived card (NPC mode) mauls. In a duel (agent mode) the victor decides
 * over a *beaten* loser on `mercy_ruthlessness` — spared, or finished through the same
 * guards and then one kill draw (`decideBeatenDuellist`) — whichever side lost; a loser
 * who yielded or fled is never finished. The opponent's side is recorded as
 * `fightState.opponentEnding`, and the one `fight.ending` trace carries the mercy fork.
 *
 * NFP #1: every number is in `data/fight-constants.ts`.
 * NFP #2: one `fight.ending` trace per fight; `fightState.ending` on the action.
 * NFP #3: one seeded draw (`ctx.rng`), only on `struck_down`, only after the guards;
 * the trophy draws on `drawSeededReward`'s own keyed stream.
 * NFP #4: each writer's refusal degrades to "mauled" or "skip"; nothing here throws on
 * missing data, and a throw is caught by `finalizeFightEnd`.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { ValuePair } from '../../types/agent';
import type { FightEndingFace, FightEndingRecord, FightMercyRecord, FightState } from '../../types/fight';
import type { FightEndingTrace } from '../../types/traces/fight-traces';
import type { FightEndBranch, FightEndContext } from './fightOutcome';
import {
  FIGHT_BARGAIN_AXIS,
  FIGHT_CONCESSION_AXIS,
  FIGHT_DEATH_HARM_CLASS,
  FIGHT_DUEL_KILL_CHANCE_RUTHLESS,
  FIGHT_ENDING_DRIFT,
  FIGHT_EVENT_SIGNIFICANCE,
  FIGHT_EVENT_TIER_BY_FACE,
  FIGHT_GRATITUDE_CAUSE,
  FIGHT_GRATITUDE_RADIUS_HEXES,
  FIGHT_HUMILIATION_CAUSE,
  FIGHT_HUMILIATION_REPUTATION,
  FIGHT_KILL_CHANCE_BY_TEMPER,
  FIGHT_MERCY_AXIS,
  FIGHT_SCARRED_INTENSITY,
  FIGHT_SCARRED_TRAIT_ID,
  FIGHT_STANDING_CAUSE,
  FIGHT_VICTORY_REPUTATION_DRIVEN_OFF,
  FIGHT_VICTORY_REPUTATION_DUEL,
  FIGHT_VICTORY_REPUTATION_OVERCOME,
} from '../../data/fight-constants';
import {
  FIGHT_CHRONICLE_LINES,
  FIGHT_CHRONICLE_LINES_PLAIN,
  FIGHT_CHRONICLE_NAMELESS_FOE,
  FIGHT_CHRONICLE_NAMELESS_PLACE,
  FIGHT_TROPHY_OUTCOME,
  FIGHT_TROPHY_RECIPE,
  type FightTrophyLairTier,
} from '../../data/fight-ending-content';
import { LOCATION_CLASSES } from '../../data/world-objects';
import { markMortalDead } from '../agentLifecycle';
import { readResidence } from '../agentResidence';
import { applyConditionToActor } from '../effects/conditionApplier';
import { decideBranchPole, driftTowardPole, readLiveAxisLean } from '../encounters/branchDecision';
import { sumHandLean } from '../encounters/poleLean';
import { writeGrudge } from '../grievance/grudgeEdge';
import { createUndertakingOutcomeNode } from '../grievance/undertakingOutcomeNode';
import { isMonster } from '../monsters/isMonster';
import { applyReputationWithDelta } from '../reputation';
import { drawSeededReward } from '../rewardPool';
import { hexDistance } from '../delivery';
import { getAgentFaction } from '../graphQueries';
import { resolveHeldLair } from '../monsters/monsterFelling';
import { touchWorld } from '../simulationRuntime';
import { getLocationNodes, resolveToParentLocation } from '../sublocationShape';
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
    else scarSkipped = applied.reason === 'tag_immunity' ? 'immune'
      : applied.reason === 'prevent_loss' ? 'warded' // THR-1625: a condition guard refused the scar
      : 'definition_missing';
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
  /** THR-1557 — who dies; the fighter by default, the opponent when a duel's fighter finishes them. */
  loserId: string = action.actorId,
): { died: boolean; outcomeNodeId?: string } {
  const fighterId = loserId;
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
      actorId: action.actorId,
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

// ─── Duels: the victor decides (THR-1557, duels plan doc §5, slice E2) ────────

/** A duel — both sides are mortals who roll (agent mode). */
function isDuel(fight: FightState): boolean {
  return fight.fightMode === 'agent';
}

/**
 * The victor's mercy fork (§5): their live `mercy_ruthlessness` lean, plus the god's
 * hand only when the victor is the action's actor — the god's own mortal, the one side
 * the god's cards ever touch (duels plan doc §2, §6). The coin (the step rng) is drawn
 * only inside the neutral band.
 */
function decideVictorMercy(
  state: GameState,
  action: UnifiedAction,
  victorId: string,
  ctx: FightEndContext,
): Omit<FightMercyRecord, 'drift'> {
  const profileLean = readLiveAxisLean(state, victorId, FIGHT_MERCY_AXIS);
  const cardLean = victorId === action.actorId
    ? sumHandLean(ctx.handNudges, action.activeNudges, FIGHT_MERCY_AXIS)
    : 0;
  const decision = decideBranchPole(profileLean, cardLean, ctx.rng);
  return {
    victorId,
    pole: decision.pole,
    profileLean: decision.profileLean,
    cardLean: decision.cardLean,
    decidedBy: decision.decidedBy,
  };
}

/** What the victor's decision over a beaten loser did. */
interface BeatenLoserFate {
  readonly face: 'spared' | 'mauled' | 'slain';
  readonly mercy: FightMercyRecord;
  readonly guard?: FightEndingRecord['guard'];
  readonly killRoll?: { chance: number; roll: number };
  readonly outcomeNodeId?: string;
  readonly scarWritten: boolean;
  readonly scarSkipped?: FightEndingTrace['scarSkipped'];
  readonly grudgeWritten: boolean;
}

/**
 * A beaten duellist's fate (§5) — only a loser whose clock filled or who was struck
 * down reaches here; one who yielded or fled is never finished. The victor's pole:
 *
 * - **spared** (mercy): plan doc 1's scar and `blood_drawn` grudge, and the victor
 *   drifts toward mercy;
 * - **finished** (ruthlessness): plan doc 1's guards first (The First, the avatar), then
 *   one kill draw at `FIGHT_DUEL_KILL_CHANCE_RUTHLESS`, taken only when both guards pass,
 *   so `killRoll` means what it means in D1; a kill goes through the one funnel. A missed
 *   draw, a guard or the ward leaves the loser **mauled** (scar and grudge).
 */
export function decideBeatenDuellist(
  state: GameState,
  action: UnifiedAction,
  loserId: string,
  victorId: string,
  ctx: FightEndContext,
): BeatenLoserFate {
  const decision = decideVictorMercy(state, action, victorId, ctx);
  let face: BeatenLoserFate['face'] = 'mauled';
  let guard: FightEndingRecord['guard'];
  let killRoll: BeatenLoserFate['killRoll'];
  let outcomeNodeId: string | undefined;
  let mercyDrift: FightMercyRecord['drift'];

  if (decision.pole === 'positive') {
    face = 'spared';
    mercyDrift = drift(state, victorId, FIGHT_MERCY_AXIS, 'positive', ctx.tick);
  } else {
    guard = fightDeathGuard(state.graph, loserId);
    if (!guard) {
      const chance = FIGHT_DUEL_KILL_CHANCE_RUTHLESS;
      const roll = ctx.rng();
      killRoll = { chance, roll };
      if (roll < chance) {
        const killed = killStruckDownFighter(state, action, victorId, ctx, loserId);
        if (killed.died) {
          face = 'slain';
          outcomeNodeId = killed.outcomeNodeId;
        } else {
          guard = 'warded';
        }
      }
    }
  }

  const mauled = face === 'slain'
    ? { scarWritten: false, grudgeWritten: false }
    : writeMauled(state, loserId, victorId, ctx.tick);
  return {
    face,
    mercy: { ...decision, ...(mercyDrift ? { drift: mercyDrift } : {}) },
    ...(guard ? { guard } : {}),
    ...(killRoll ? { killRoll } : {}),
    ...(outcomeNodeId ? { outcomeNodeId } : {}),
    scarWritten: mauled.scarWritten,
    ...('scarSkipped' in mauled && mauled.scarSkipped ? { scarSkipped: mauled.scarSkipped } : {}),
    grudgeWritten: mauled.grudgeWritten,
  };
}

/** What the opponent's side of a duel came to (§5), and what the trace needs of it. */
interface DuelOpponentSide {
  readonly ending: FightEndingRecord;
  /** True when the opponent lost, so the chronicle tells their story. */
  readonly opponentLost: boolean;
  readonly fate?: BeatenLoserFate;
  readonly wroteWorld: boolean;
}

/**
 * The opponent's side of a duel's ending (§5), filled into `fightState.opponentEnding`
 * whichever side lost. Runs after the fighter's own ending, so a double knockout decides
 * the fighter's fate first and the opponent's second, each by its own victor (the fail-soft
 * table's "each side's victor decision runs independently").
 *
 * | The opponent… | Writes |
 * |---|---|
 * | was beaten (`opponentLoss` `clock` / `struck_down`) | the fighter's mercy fork: spared / mauled / slain |
 * | yielded to the fighter | humiliation at home, drift toward prudence |
 * | routed | drift toward prudence (`terrified` came with the band) |
 * | yielded in a double yield | nothing: nobody won, so nobody is humiliated |
 * | beat the fighter (struck down, yielded to, fled from) | standing with the fighter's faction ?? home, drift toward courage |
 */
function applyDuelOpponentSide(
  state: GameState,
  action: UnifiedAction,
  fight: FightState,
  fighterEnding: Pick<FightEndingRecord, 'victorStanding'>,
  ctx: FightEndContext,
): DuelOpponentSide | undefined {
  const graph = state.graph;
  const fighterId = action.actorId;
  const opponent = opponentNode(graph, fight);
  if (!opponent || !isMortalOpponent(opponent)) return undefined;
  const opponentId = opponent.id;

  let face: FightEndingFace = 'broke_off';
  let fate: BeatenLoserFate | undefined;
  let humiliation: FightEndingRecord['humiliation'];
  let reputation: FightEndingRecord['reputation'];
  let driftRec: FightEndingRecord['drift'];

  const loss = fight.opponentLoss;
  if (loss === 'clock' || loss === 'struck_down') {
    fate = decideBeatenDuellist(state, action, opponentId, fighterId, ctx);
    face = fate.face;
  } else if (loss === 'yielded') {
    if (fight.result === 'overcome') {
      face = 'yielded_to_mortal';
      driftRec = drift(state, opponentId, FIGHT_CONCESSION_AXIS, 'negative', ctx.tick);
      humiliation = humiliate(state, opponentId, ctx.tick);
    }
    // A double yield is `broke_off`: nobody won, nobody is humiliated.
  } else if (loss === 'routed') {
    face = 'routed';
    driftRec = drift(state, opponentId, FIGHT_CONCESSION_AXIS, 'negative', ctx.tick);
  } else if (fight.result === 'struck_down' || fight.result === 'yielded' || fight.result === 'routed') {
    // The opponent won. A yield already wrote their standing (D2's victorStanding);
    // a struck-down or fled fighter's victor gains it here, by the same rule.
    face = 'overcome_mortal';
    if (fighterEnding.victorStanding) {
      const { counterpartyId, delta } = fighterEnding.victorStanding;
      reputation = { counterpartyId, delta };
    } else {
      reputation = writeStanding(
        state, opponentId, standingCounterparty(graph, fighterId),
        FIGHT_VICTORY_REPUTATION_DUEL, ctx.tick, FIGHT_STANDING_CAUSE,
      );
    }
    driftRec = drift(state, opponentId, FIGHT_CONCESSION_AXIS, 'positive', ctx.tick);
  }

  const ending: FightEndingRecord = {
    face,
    scarWritten: fate?.scarWritten ?? false,
    grudgeWritten: fate?.grudgeWritten ?? false,
    ...(humiliation ? { humiliation } : {}),
    ...(reputation ? { reputation } : {}),
    ...(fate?.killRoll ? { killRoll: fate.killRoll } : {}),
    ...(fate?.guard ? { guard: fate.guard } : {}),
    ...(driftRec ? { drift: driftRec } : {}),
    ...(fate ? { mercy: fate.mercy } : {}),
    eventSignificance: FIGHT_EVENT_SIGNIFICANCE[FIGHT_EVENT_TIER_BY_FACE[face]],
  };
  const wroteWorld = !!(fate || humiliation || reputation || driftRec);
  return { ending, opponentLost: loss !== undefined, ...(fate ? { fate } : {}), wroteWorld };
}

// ─── Victory yields (THR-1549, slice D2, plan doc §4) ─────────────────────────

/** A location node's hex, climbing from a place to its location first. */
function hexOfLocation(graph: WorldGraph, id: string | undefined): { col: number; row: number } | undefined {
  if (!id) return undefined;
  const loc = resolveToParentLocation(graph, graph.getNode(id));
  const col = loc?.properties.hexCol;
  const row = loc?.properties.hexRow;
  return typeof col === 'number' && typeof row === 'number' ? { col, row } : undefined;
}

/**
 * The settlement grateful for a victory at `hex` (§4): the nearest settlement-class
 * location within `FIGHT_GRATITUDE_RADIUS_HEXES` — one on the same hex wins at distance
 * 0 — with ties broken by node id so the answer is deterministic. A lair is never a
 * settlement, so it never qualifies. Undefined when none is in reach.
 */
export function nearestGratefulSettlement(
  graph: WorldGraph,
  hex: { col: number; row: number } | undefined,
): GraphNode | undefined {
  if (!hex) return undefined;
  let best: GraphNode | undefined;
  let bestDist = Infinity;
  for (const loc of getLocationNodes(graph)) {
    if (!SETTLEMENT_SUBTYPES.has(loc.properties.locationSubtype as string)) continue;
    const col = loc.properties.hexCol;
    const row = loc.properties.hexRow;
    if (typeof col !== 'number' || typeof row !== 'number') continue;
    const dist = hexDistance(hex, { col, row });
    if (dist > FIGHT_GRATITUDE_RADIUS_HEXES) continue;
    if (dist < bestDist || (dist === bestDist && best && loc.id < best.id)) {
      best = loc;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Who a mortal's standing is written toward (§4, one rule for both sides): the loser's
 * faction, failing that the loser's home settlement.
 */
function standingCounterparty(graph: WorldGraph, loserId: string): GraphNode | undefined {
  return getAgentFaction(graph, loserId)?.faction ?? fighterHomeSettlement(graph, loserId);
}

/** A `reputation_with` write toward a counterparty; undefined when it did not land. */
function writeStanding(
  state: GameState,
  fromId: string,
  counterparty: GraphNode | undefined,
  delta: number,
  tick: number,
  cause: string,
): { counterpartyId: string; delta: number } | undefined {
  if (!counterparty) return undefined;
  const written = applyReputationWithDelta(state.graph, fromId, counterparty.id, delta, tick, cause);
  return written.applied ? { counterpartyId: written.effectiveTargetId ?? counterparty.id, delta } : undefined;
}

/** The lair a fight's trophy comes from: the opponent monster's held den, when it is one. */
function trophyLair(state: GameState, fight: FightState): GraphNode | undefined {
  const opponent = opponentNode(state.graph, fight);
  return opponent && isMonster(opponent) ? resolveHeldLair(state, opponent) : undefined;
}

/** What a trophy draw did. */
interface TrophyDraw {
  readonly reward?: NonNullable<FightEndingRecord['reward']>;
  readonly skipped?: 'no_lair' | 'minor_lair' | 'empty_pool';
  readonly badOutcome?: boolean;
}

/**
 * The trophy (§4): one draw through `drawSeededReward` — the single draw path, so a
 * `reward_tier_bonus` on the fighter shifts the curve — at the result's band for the
 * lair's tier. A minor lair, or none, holds nothing. The draw is traced by the pool's
 * own content query under site `fight_trophy`.
 */
function drawTrophy(
  state: GameState,
  action: UnifiedAction,
  lair: GraphNode | undefined,
  result: 'overcome' | 'bargained',
  ctx: FightEndContext,
): TrophyDraw {
  if (!lair) return { skipped: 'no_lair' };
  const tier = lair.properties.lairTier as string | undefined;
  if (tier !== 'major' && tier !== 'legendary') return { skipped: 'minor_lair' };
  const draw = drawSeededReward(state.graph, {
    recipe: FIGHT_TROPHY_RECIPE,
    outcomeType: FIGHT_TROPHY_OUTCOME[result][tier as FightTrophyLairTier],
    seed: state.seed,
    tick: ctx.tick,
    actorId: action.actorId,
    templateId: action.templateId,
    overrideCtx: ctx.overrideCtx,
    site: 'fight_trophy',
  });
  if (!draw.instantiation || !draw.drawnTemplateId) {
    return { skipped: 'empty_pool', ...(draw.isBadOutcome ? { badOutcome: true } : {}) };
  }
  return {
    reward: { templateId: draw.drawnTemplateId, instanceId: draw.instantiation.instanceId, tier: draw.tier ?? 1 },
    ...(draw.isBadOutcome ? { badOutcome: true } : {}),
  };
}

/** What the victory writes did (§4). */
interface VictoryWrites {
  reputation?: FightEndingRecord['reputation'];
  reward?: FightEndingRecord['reward'];
  drift?: FightEndingRecord['drift'];
  rewardSkipped?: TrophyDraw['skipped'];
  rewardBadOutcome?: boolean;
}

/**
 * The victory yields for `overcome` / `driven_off` / `bargained` (§4). No new reward
 * system: the trophy is the reward pool's, gratitude and standing are `reputation_with`
 * writes, and the drift is the shared value writer's.
 */
function applyVictory(
  state: GameState,
  action: UnifiedAction,
  fight: FightState,
  face: FightEndingFace,
  ctx: FightEndContext,
): VictoryWrites {
  const graph = state.graph;
  const fighterId = action.actorId;
  const out: VictoryWrites = {};
  const lair = trophyLair(state, fight);
  // Gratitude is anchored on the lair's hex, failing that on where the fight happened.
  const siteHex = hexOfLocation(graph, lair?.id) ?? hexOfLocation(graph, fighterPositionId(graph, fighterId));

  const takeTrophy = (result: 'overcome' | 'bargained'): void => {
    const trophy = drawTrophy(state, action, lair, result, ctx);
    if (trophy.reward) out.reward = trophy.reward;
    if (trophy.skipped) out.rewardSkipped = trophy.skipped;
    if (trophy.badOutcome) out.rewardBadOutcome = true;
  };

  switch (face) {
    case 'overcome_monster': {
      takeTrophy('overcome');
      out.reputation = writeStanding(
        state, fighterId, nearestGratefulSettlement(graph, siteHex),
        FIGHT_VICTORY_REPUTATION_OVERCOME, ctx.tick, FIGHT_GRATITUDE_CAUSE,
      );
      break;
    }
    case 'overcome_mortal': {
      const loserId = fight.opponentId;
      if (loserId) {
        out.reputation = writeStanding(
          state, fighterId, standingCounterparty(graph, loserId),
          FIGHT_VICTORY_REPUTATION_DUEL, ctx.tick, FIGHT_STANDING_CAUSE,
        );
      }
      out.drift = drift(state, fighterId, FIGHT_CONCESSION_AXIS, 'positive', ctx.tick);
      break;
    }
    case 'driven_off':
      out.reputation = writeStanding(
        state, fighterId, nearestGratefulSettlement(graph, siteHex),
        FIGHT_VICTORY_REPUTATION_DRIVEN_OFF, ctx.tick, FIGHT_GRATITUDE_CAUSE,
      );
      break;
    case 'bargained':
      takeTrophy('bargained');
      out.drift = drift(state, fighterId, FIGHT_BARGAIN_AXIS, 'positive', ctx.tick);
      break;
    default:
      break;
  }
  if (!out.reputation) delete out.reputation;
  return out;
}

// ─── The chronicle (THR-1549, slice D2, plan doc §5) ──────────────────────────

/** Fill a chronicle line's three slots from names the branch already holds. */
function fillLine(line: string, names: { fighter: string; opponent: string; place: string }): string {
  return line
    .replace(/\{fighter\}/g, names.fighter)
    .replace(/\{opponent\}/g, names.opponent)
    .replace(/\{place\}/g, names.place);
}

/**
 * The chronicle line for an ending: the face's line, or its plain variant when the
 * write it names was skipped (a bargain with no prize, a mauling with no new scar).
 */
export function fightChronicleLine(
  face: FightEndingFace,
  ending: Pick<FightEndingRecord, 'reward' | 'scarWritten'>,
  names: { fighter: string; opponent: string; place: string },
): string {
  const plain = (face === 'bargained' && !ending.reward) || (face === 'mauled' && !ending.scarWritten);
  const line = (plain ? FIGHT_CHRONICLE_LINES_PLAIN[face] : undefined) ?? FIGHT_CHRONICLE_LINES[face];
  return fillLine(line, names);
}

/**
 * The one `fight_ended` tick event per fight (§5). Notable faces clear
 * `phaseNarrative`'s chronicle threshold; routine ones reach the event log only.
 */
function fightEndedEvent(
  state: GameState,
  action: UnifiedAction,
  fight: FightState,
  ending: FightEndingRecord,
  siteId: string | undefined,
  ctx: FightEndContext,
  /**
   * THR-1557 — tell the opponent's side of a duel instead: a line's {fighter} slot is
   * whoever the face is about, so the opponent takes it and the fighter becomes {opponent}.
   */
  opponentSide = false,
): TickEvent {
  const graph = state.graph;
  const opponentId = opponentNode(graph, fight)?.id;
  const fighterId = opponentSide && opponentId ? opponentId : action.actorId;
  const otherName = opponentSide
    ? graph.getNode(action.actorId)?.name ?? action.actorId
    : opponentNode(graph, fight)?.name ?? FIGHT_CHRONICLE_NAMELESS_FOE;
  const place = siteId ? resolveToParentLocation(graph, graph.getNode(siteId)) : undefined;
  const message = fightChronicleLine(ending.face, ending, {
    fighter: graph.getNode(fighterId)?.name ?? fighterId,
    opponent: otherName,
    place: place?.name ?? FIGHT_CHRONICLE_NAMELESS_PLACE,
  });
  const hexCoords = hexOfLocation(graph, siteId);
  return {
    id: `fight_ended_${action.actionId}_${ctx.tick}${opponentSide ? '_opponent' : ''}`,
    tick: ctx.tick,
    type: 'fight_ended',
    message,
    significance: ending.eventSignificance ?? FIGHT_EVENT_SIGNIFICANCE[FIGHT_EVENT_TIER_BY_FACE[ending.face]],
    actorId: fighterId,
    ...(hexCoords ? { hexCoords } : {}),
  };
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
): { ending: FightEndingRecord; opponentEnding?: FightEndingRecord; events: TickEvent[] } {
  const graph = state.graph;
  const fighterId = action.actorId;
  let face = fightEndingFace(graph, fight);
  // THR-1557 — the victor's mercy fork over a beaten fighter, in a duel.
  let fighterFate: BeatenLoserFate | undefined;
  let scarWritten = false;
  let scarSkipped: FightEndingTrace['scarSkipped'];
  let grudgeWritten = false;
  let guard: FightEndingRecord['guard'];
  let killRoll: FightEndingRecord['killRoll'];
  let outcomeNodeId: string | undefined;
  let humiliation: FightEndingRecord['humiliation'];
  let driftRec: FightEndingRecord['drift'];
  let victorStanding: FightEndingRecord['victorStanding'];
  let victory: VictoryWrites = {};
  // Where the fight happened, read before any write (a death may move nothing, but
  // the chronicle line and the event's hex must not depend on it).
  const siteId = fighterPositionId(graph, fighterId);

  switch (face) {
    case 'yielded_to_mortal': {
      driftRec = drift(state, fighterId, FIGHT_CONCESSION_AXIS, 'negative', ctx.tick);
      humiliation = humiliate(state, fighterId, ctx.tick);
      // The other side of humiliation (§4): the victor gains standing with the
      // yielder's faction ?? the yielder's home settlement.
      const victorId = fight.opponentId;
      if (victorId) {
        const standing = writeStanding(
          state, victorId, standingCounterparty(graph, fighterId),
          FIGHT_VICTORY_REPUTATION_DUEL, ctx.tick, FIGHT_STANDING_CAUSE,
        );
        if (standing) victorStanding = { victorId, ...standing };
      }
      break;
    }
    case 'routed':
      driftRec = drift(state, fighterId, FIGHT_CONCESSION_AXIS, 'negative', ctx.tick);
      break;
    case 'mauled': {
      // A duel's struck-down fighter faces their victor's mercy (THR-1557, §5): the
      // opponent is a mortal who decides, where D1's derived-card victor only mauls.
      const duelVictor = isDuel(fight) ? opponentNode(graph, fight) : undefined;
      if (duelVictor && isMortalOpponent(duelVictor)) {
        fighterFate = decideBeatenDuellist(state, action, fighterId, duelVictor.id, ctx);
        face = fighterFate.face;
        guard = fighterFate.guard;
        killRoll = fighterFate.killRoll;
        outcomeNodeId = fighterFate.outcomeNodeId;
        scarWritten = fighterFate.scarWritten;
        scarSkipped = fighterFate.scarSkipped;
        grudgeWritten = fighterFate.grudgeWritten;
        break;
      }
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
    case 'overcome_monster':
    case 'overcome_mortal':
    case 'driven_off':
    case 'bargained':
      victory = applyVictory(state, action, fight, face, ctx);
      driftRec = victory.drift;
      break;
    default:
      // broke_off, yielded_to_monster: nothing beyond the exchanges' own writes.
      break;
  }

  // THR-1557 — a duel's other side, decided after the fighter's own (a double
  // knockout decides the fighter's fate first, then the opponent's).
  const opponentSide = isDuel(fight)
    ? applyDuelOpponentSide(state, action, fight, { ...(victorStanding ? { victorStanding } : {}) }, ctx)
    : undefined;

  const wroteWorld = scarWritten || grudgeWritten || humiliation || driftRec || victorStanding
    || victory.reputation || victory.reward || fighterFate || opponentSide?.wroteWorld;
  if (ctx.runtime && wroteWorld) touchWorld(ctx.runtime);

  const eventSignificance = FIGHT_EVENT_SIGNIFICANCE[FIGHT_EVENT_TIER_BY_FACE[face]];
  const ending: FightEndingRecord = {
    face,
    scarWritten,
    grudgeWritten,
    ...(humiliation ? { humiliation } : {}),
    ...(victory.reputation ? { reputation: victory.reputation } : {}),
    ...(victory.reward ? { reward: victory.reward } : {}),
    ...(killRoll ? { killRoll } : {}),
    ...(guard ? { guard } : {}),
    ...(driftRec ? { drift: driftRec } : {}),
    ...(victorStanding ? { victorStanding } : {}),
    ...(fighterFate ? { mercy: fighterFate.mercy } : {}),
    eventSignificance,
  };
  const opponentEnding = opponentSide?.ending;
  // The mercy fork the trace names: over the beaten loser — the fighter when they were
  // beaten (including a double), else the opponent.
  const mercy = fighterFate?.mercy ?? opponentSide?.fate?.mercy;
  const opponentFate = opponentSide?.fate;
  const bothStruckDown = !!fighterFate && !!opponentFate;

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
    ...(victory.reputation ? { reputation: victory.reputation } : {}),
    ...(victory.reward ? { reward: victory.reward } : {}),
    ...(victory.rewardSkipped ? { rewardSkipped: victory.rewardSkipped } : {}),
    ...(victory.rewardBadOutcome ? { rewardBadOutcome: true } : {}),
    ...(victorStanding ? { victorStanding } : {}),
    ...(isDuel(fight) && fight.opponentLoss ? { opponentLoss: fight.opponentLoss } : {}),
    ...(bothStruckDown ? { bothStruckDown: true } : {}),
    ...(mercy ? {
      victorPole: mercy.pole,
      victorProfileLean: mercy.profileLean,
      victorCardLean: mercy.cardLean,
      mercyDecidedBy: mercy.decidedBy,
    } : {}),
    ...(opponentEnding ? { opponentFace: opponentEnding.face } : {}),
    ...(bothStruckDown && opponentFate ? {
      opponentVictorPole: opponentFate.mercy.pole,
      opponentMercyDecidedBy: opponentFate.mercy.decidedBy,
    } : {}),
    ...(opponentFate?.killRoll ? { opponentKillRoll: opponentFate.killRoll } : {}),
    ...(opponentFate?.guard ? { opponentGuard: opponentFate.guard } : {}),
    ...(opponentFate?.outcomeNodeId ? { opponentOutcomeNodeId: opponentFate.outcomeNodeId } : {}),
    eventSignificance,
    summary: `fight.ending: ${fighterId} ${fight.result} → ${face}`
      + (victorId && victorId !== fighterId ? ` (by ${victorId})` : '')
      + (guard ? ` [guard ${guard}]` : '')
      + (killRoll ? ` kill ${killRoll.roll.toFixed(3)}<${killRoll.chance}` : '')
      + (scarWritten ? ' scarred' : scarSkipped ? ` scar skipped (${scarSkipped})` : '')
      + (grudgeWritten ? ' grudge' : '')
      + (humiliation ? ` humiliated at ${humiliation.counterpartyId}` : '')
      + (victory.reward ? ` trophy ${victory.reward.templateId} (tier ${victory.reward.tier})` : '')
      + (victory.rewardSkipped ? ` no trophy (${victory.rewardSkipped})` : '')
      + (victory.reputation ? ` +${victory.reputation.delta} with ${victory.reputation.counterpartyId}` : '')
      + (victorStanding ? ` victor +${victorStanding.delta} with ${victorStanding.counterpartyId}` : '')
      + (mercy ? ` mercy ${mercy.pole} by ${mercy.decidedBy}` : '')
      + (opponentEnding ? ` | opponent → ${opponentEnding.face}` : '')
      + (opponentFate?.killRoll ? ` kill ${opponentFate.killRoll.roll.toFixed(3)}<${opponentFate.killRoll.chance}` : '')
      + (opponentFate?.guard ? ` [opponent guard ${opponentFate.guard}]` : '')
      + ` [sig ${eventSignificance}]`,
  } as FightEndingTrace);

  // One chronicle event per loser (§5): a duel the fighter won tells the opponent's
  // story (spared, slain, yielded…), a double tells both, a double yield only the break-off.
  const events: TickEvent[] = [];
  const tellOpponent = !!opponentSide?.opponentLost && fight.result !== 'broke_off';
  if (!(tellOpponent && fight.result === 'overcome')) {
    events.push(fightEndedEvent(state, action, fight, ending, siteId, ctx));
  }
  if (tellOpponent && opponentEnding) {
    events.push(fightEndedEvent(state, action, fight, opponentEnding, siteId, ctx, true));
  }
  return { ending, ...(opponentEnding ? { opponentEnding } : {}), events };
}

/** The dispatcher branch (registered first in `FIGHT_END_BRANCHES`). */
export const fighterEndingBranch: FightEndBranch = (state, action, ctx) => {
  const fight = action.fightState;
  if (!fight?.result) return;
  const { ending, opponentEnding, events } = applyFightEndingForFighter(state, action, fight, ctx);
  return { patch: { ending, ...(opponentEnding ? { opponentEnding } : {}) }, events };
};
