/**
 * Grudges boil over — the grudge-duel trigger (THR-1558, plan doc
 * `Docs/plans/2026-09-23-mortal-duels.md` §6, map decision THR-1267).
 *
 * Runs inside `phaseColocationDetection`, over the same `located_at` grouping. For
 * each co-located pair where one side holds an **injury-class** `hostile_to` toward
 * the other (`isInjuryProvenance`, the motive gate's own authority; `old_quarrel`
 * licenses rivalry, never blood), roll
 * `min(GRUDGE_ESCALATION_MAX, GRUDGE_ESCALATION_BASE × (1 + pairCourage))`. On a hit,
 * spawn `fight.duel.grudge` between them and stamp the pair's cooldown.
 *
 * **Its own stream.** The roll draws from
 * `mulberry32(seed + tick × GRUDGE_ESCALATION_STREAM_SALT + hash(pairKey))`, one per
 * pair, never from the detection stream — so every `agent_encounter` roll is the same
 * whether this trigger is on or off. The spawned action's first-step duration draws
 * from the same pair stream, after the roll.
 *
 * **Who can duel.** Neither side may be a monster, deceased, or the god's avatar
 * (mortals fight; the god leans). Neither may be busy — an unresolved action as
 * actor, a fight as opponent (`fightParticipantIds`), a non-empty movement queue (they
 * would walk off the hex next tick), or already picked for a duel earlier in this
 * pass (`pickedThisPass`: the phase-start actions cannot see this pass's spawns).
 *
 * **Who is the actor.** Grudges are written both ways, so "the grudge-holder" is
 * usually both. The actor is the side the god has threaded if exactly one is; if both
 * are, the higher court position; otherwise the braver side; on a tie, the lower id.
 * The god's hand and the veil reach only the actor, so a threaded mortal is always
 * the actor.
 *
 * **Cooldowns store expiry ticks** in the shared `GameState.fightCooldowns` map
 * (`writeFightCooldown`), so the lair trigger's shorter prune never cuts the grudge
 * pair's 80-tick wait.
 *
 * **Bounded skip traces.** A co-located feud that is busy or cooling down would trace
 * every tick. A skip is traced only on the pair's bucket tick — once per
 * `GRUDGE_DUEL_COOLDOWN_TICKS` window, deterministic, with no state kept. A roll that
 * misses is not traced; a spawn always is.
 *
 * Fail-soft: every missing piece reads as "no duel". A missing template traces
 * `no_template` once and stops spawning for the rest of the pass.
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { MovementState } from '../../types/movement';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { FightTriggerGrudgeSkip, FightTriggerGrudgeTrace } from '../../types/traces/fight-traces';
import {
  GRUDGE_DUEL_COOLDOWN_TICKS,
  GRUDGE_ESCALATION_BASE,
  GRUDGE_ESCALATION_MAX,
  GRUDGE_ESCALATION_STREAM_SALT,
} from '../../data/fight-constants';
import { FIGHT_DUEL_GRUDGE_ID } from '../../data/encounters/fight-duel-grudge';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { mulberry32 } from '../../lib/prng';
import { getAvatarAscendant } from '../graphQueries';
import { isAgentGone } from '../groups/groupQueries';
import { createUnifiedAction } from '../unifiedActionLifecycle';
import { emitTrace } from '../traceBuffer';
import { isInjuryProvenance } from '../undertakingMotive';
import { readLiveAxisLean } from '../encounters/branchDecision';
import { isMonster } from '../monsters/isMonster';
import { fightPairKey, isFightPairOnCooldown, writeFightCooldown } from '../monsters/lairArrivalTrigger';
import { fightParticipantIds } from './fightParticipants';

/** Court rank for the actor rule. A dormant thread does not count as threaded. */
const COURT_RANK: Readonly<Record<string, number>> = { the_first: 3, retinue: 2, watched: 1 };

/** The same 32-bit string hash the fight streams use. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash;
}

/** The pair's own escalation stream for this tick. */
export function grudgeEscalationRng(seed: number, tick: number, pairKey: string): () => number {
  return mulberry32(((seed ?? 0) + tick * GRUDGE_ESCALATION_STREAM_SALT + hashString(pairKey)) >>> 0);
}

/** The escalation chance for a pair whose braver side leans `pairCourage` ∈ [−1, 1]. */
export function grudgeEscalationChance(pairCourage: number): number {
  const courage = Math.max(-1, Math.min(1, Number.isFinite(pairCourage) ? pairCourage : 0));
  return Math.max(0, Math.min(GRUDGE_ESCALATION_MAX, GRUDGE_ESCALATION_BASE * (1 + courage)));
}

/**
 * Whether a skip for this pair is traced this tick — once per cooldown window, on a
 * tick fixed by the pair key, so the bound needs no stored state.
 */
export function isGrudgeSkipTraceTick(tick: number, pairKey: string): boolean {
  const window = GRUDGE_DUEL_COOLDOWN_TICKS;
  const offset = ((hashString(pairKey) % window) + window) % window;
  return (((tick + offset) % window) + window) % window === 0;
}

/** The injury provenance `fromId` holds toward `toId`, if any. */
export function injuryGrudgeCause(state: Pick<GameState, 'graph'>, fromId: string, toId: string): string | undefined {
  try {
    for (const edge of state.graph.getOutgoingEdges(fromId, 'hostile_to')) {
      if (edge.target !== toId) continue;
      const props = (edge.properties ?? {}) as Record<string, unknown>;
      if (!isInjuryProvenance(props)) continue;
      for (const key of ['cause', 'reason', 'basis'] as const) {
        const value = props[key];
        if (typeof value === 'string' && isInjuryProvenance({ [key]: value })) return value;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** The licensing grudge between a pair, either direction; `a`'s own grudge first. */
function pairGrudgeCause(state: Pick<GameState, 'graph'>, a: string, b: string): string | undefined {
  return injuryGrudgeCause(state, a, b) ?? injuryGrudgeCause(state, b, a);
}

/** The court rank of the player's thread to `actorId`, or 0 when unthreaded or dormant. */
function threadRank(state: Pick<GameState, 'graph' | 'ascendantId'>, actorId: string): number {
  const ascendantId = state.ascendantId;
  if (!ascendantId) return 0;
  let best = 0;
  for (const edge of state.graph.getIncomingEdges(actorId, 'thread')) {
    if (edge.source !== ascendantId) continue;
    const pos = (edge.properties as { courtPosition?: string } | undefined)?.courtPosition;
    best = Math.max(best, COURT_RANK[pos ?? ''] ?? 0);
  }
  return best;
}

/**
 * The actor rule (plan doc §6): threaded side (higher court position if both), then
 * the braver side, then the lower id. Returns `[actorId, targetId]`.
 */
export function pickDuelActor(state: GameState, a: string, b: string): [string, string] {
  const rankA = threadRank(state, a);
  const rankB = threadRank(state, b);
  if (rankA !== rankB) return rankA > rankB ? [a, b] : [b, a];
  const courageA = readLiveAxisLean(state, a, 'courage_prudence');
  const courageB = readLiveAxisLean(state, b, 'courage_prudence');
  if (courageA !== courageB) return courageA > courageB ? [a, b] : [b, a];
  return a < b ? [a, b] : [b, a];
}

/** Monster, dead, or the god's avatar: never a duellist, and never traced. */
function isNeverDuellist(graph: GameState['graph'], node: GraphNode | undefined): boolean {
  if (!node || isMonster(node) || isAgentGone(node)) return true;
  try {
    return getAvatarAscendant(graph, node.id) != null;
  } catch {
    return true;
  }
}

function hasMovementQueue(node: GraphNode): boolean {
  const ms = node.properties?.movementState as MovementState | undefined;
  return Array.isArray(ms?.movementQueue) && ms!.movementQueue.length > 0;
}

export interface GrudgeDuelResult {
  /** Every unified action, including this pass's spawns — unchanged reference when none spawned. */
  readonly unifiedActions: readonly UnifiedAction[];
  readonly fightCooldowns: Readonly<Record<string, number>> | undefined;
  readonly spawned: readonly UnifiedAction[];
}

/**
 * Run the grudge escalation over one colocation pass. `locationAgents` is the
 * detection phase's own grouping (location id → co-located individual ids, in graph
 * order); pairs are walked in the same order.
 */
export function runGrudgeDuels(
  state: GameState,
  locationAgents: ReadonlyMap<string, readonly string[]>,
): GrudgeDuelResult {
  const graph = state.graph;
  const tick = state.tick;
  const baseActions = state.unifiedActions ?? [];
  let fightCooldowns = state.fightCooldowns;
  const spawned: UnifiedAction[] = [];

  // Busy at phase start: any unresolved action's actor, and both sides of any fight.
  const busy = fightParticipantIds(baseActions);
  for (const a of baseActions) if (!a.resolved) busy.add(a.actorId);
  const pickedThisPass = new Set<string>();
  let templateMissing = false;

  for (const [, agentIds] of locationAgents) {
    if (agentIds.length < 2) continue;
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const aId = agentIds[i];
        const bId = agentIds[j];
        const cause = pairGrudgeCause(state, aId, bId);
        if (!cause) continue;
        const aNode = graph.getNode(aId);
        const bNode = graph.getNode(bId);
        if (isNeverDuellist(graph, aNode) || isNeverDuellist(graph, bNode)) continue;

        const pairKey = fightPairKey(aId, bId);
        const [actorId, targetId] = pickDuelActor(state, aId, bId);
        const pairCourage = Math.max(
          readLiveAxisLean(state, aId, 'courage_prudence'),
          readLiveAxisLean(state, bId, 'courage_prudence'),
        );
        const chance = grudgeEscalationChance(pairCourage);
        const traceSkip = (skipped: FightTriggerGrudgeSkip, roll = -1): void => {
          if (skipped !== 'no_template' && !isGrudgeSkipTraceTick(tick, pairKey)) return;
          emitGrudgeTrace(state, { actorId, targetId, cause, chance, roll, skipped });
        };

        const isBusy = (id: string, node: GraphNode): boolean =>
          busy.has(id) || pickedThisPass.has(id) || hasMovementQueue(node);
        if (isBusy(aId, aNode!) || isBusy(bId, bNode!)) {
          traceSkip('busy');
          continue;
        }
        if (isFightPairOnCooldown(fightCooldowns, pairKey, tick)) {
          traceSkip('cooldown');
          continue;
        }
        if (templateMissing) continue;

        const rng = grudgeEscalationRng(state.seed, tick, pairKey);
        const roll = rng();
        if (roll >= chance) continue;

        // Fail-soft re-read: the licence must still stand at the instant of the spawn.
        if (!pairGrudgeCause(state, aId, bId)) {
          traceSkip('grudge_gone', roll);
          continue;
        }
        const template = getUnifiedTemplateById(FIGHT_DUEL_GRUDGE_ID);
        if (!template) {
          templateMissing = true;
          traceSkip('no_template', roll);
          continue;
        }

        let action: UnifiedAction;
        try {
          action = createUnifiedAction({
            actorId,
            templateId: FIGHT_DUEL_GRUDGE_ID,
            targetId,
            scale: template.scale,
            source: 'system',
            tick,
            template,
            rng,
            targetProperties: graph.getNode(targetId)?.properties,
          });
        } catch {
          continue;
        }
        spawned.push(action);
        pickedThisPass.add(aId);
        pickedThisPass.add(bId);
        fightCooldowns = writeFightCooldown(fightCooldowns, pairKey, tick + GRUDGE_DUEL_COOLDOWN_TICKS, tick);
        emitGrudgeTrace(state, { actorId, targetId, cause, chance, roll, actionId: action.actionId });
      }
    }
  }

  return {
    unifiedActions: spawned.length > 0 ? [...baseActions, ...spawned] : baseActions,
    fightCooldowns,
    spawned,
  };
}

function emitGrudgeTrace(
  state: GameState,
  t: {
    actorId: string;
    targetId: string;
    cause: string;
    chance: number;
    roll: number;
    skipped?: FightTriggerGrudgeSkip;
    actionId?: string;
  },
): void {
  const actorName = state.graph.getNode(t.actorId)?.name ?? t.actorId;
  const targetName = state.graph.getNode(t.targetId)?.name ?? t.targetId;
  emitTrace({
    category: 'fight.trigger',
    tick: state.tick,
    source: 'grudge',
    aggressorId: t.actorId,
    targetId: t.targetId,
    grudgeCause: t.cause,
    chance: t.chance,
    roll: t.roll,
    ...(t.skipped ? { skipped: t.skipped } : {}),
    ...(t.actionId ? { actionId: t.actionId } : {}),
    summary: t.skipped
      ? `${actorName} and ${targetName} share a grudge (${t.cause}) — no duel (${t.skipped})`
      : `${actorName}'s old grudge against ${targetName} (${t.cause}) boils over into a duel`,
  } as FightTriggerGrudgeTrace & { summary: string });
}
