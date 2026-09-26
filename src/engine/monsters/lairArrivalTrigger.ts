/**
 * Walking into the lair — the lair-arrival fight trigger (THR-1547, plan doc
 * `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 6, THR-1267).
 *
 * A mortal whose movement ends at a lair location, or at a place inside one, while
 * the lair's named elite lives, is confronted: `fight.lair.confront` is spawned
 * against the monster. The trigger is forced — no roll — because the monster's name,
 * Dread word and clock are on the lair's sidebar (plan doc 4's F4), so walking in is
 * a choice the player could see coming.
 *
 * **Location-granular by design.** Hex co-presence never triggers: settlements share
 * lair hexes, and THR-1319 measured mortals on lair hexes routinely with none at the
 * lair node. Only the agent's resolved position counts.
 *
 * Who is never confronted:
 * - the god's avatar (`avatar`) — mortals fight, the god leans;
 * - a mortal who walked here *to hunt* the beast (`arriving_for_hunt`): the hunt is
 *   the deliberate entrance and brings its own fight, so a confront on arrival would
 *   make them fight twice back to back;
 * - a hunter keeping a hunt appointment at this den (`hunt_appointment`, THR-1560):
 *   the appointment's kept branch is their confront;
 * - a busy mortal (`busy`) — one unresolved action at a time;
 * - a pair still on cooldown (`cooldown`);
 * - a dead or missing monster (`monster_dead`).
 * A monster or a dead mortal arriving is not a candidate at all and is not traced.
 *
 * **Cooldowns store expiry ticks** (the plan doc 5 amendment on THR-1547). One map,
 * `GameState.fightCooldowns`, serves every fight trigger, and each trigger writes its
 * own length. Storing the expiry, not the write tick, keeps a longer cooldown (the
 * grudge duel's 80 ticks) intact when a shorter trigger prunes the map later.
 *
 * Fail-soft: every missing piece reads as "no trigger". Nothing is cached at module
 * scope; the check is one position resolve and one `namedEliteId` read per arrival.
 */

import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { FightTriggerSkip, FightTriggerTrace } from '../../types/traces/monster-traces';
import { FIGHT_TRIGGER_COOLDOWN_TICKS } from '../../data/fight-constants';
import { FIGHT_LAIR_CONFRONT_ID } from '../../data/encounters/fight-lair-confront';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { getAvatarAscendant, getAgentLocationId } from '../graphQueries';
import { resolveToParentLocation } from '../sublocationShape';
import { isAgentGone } from '../groups/groupQueries';
import { createUnifiedAction, isUnifiedAgentIdle } from '../unifiedActionLifecycle';
import { emitTrace } from '../traceBuffer';
import { isMonster } from './isMonster';
import { liveHuntFavourAt } from './hunts';

/** The one key rule for every fight trigger: the two ids, sorted, joined with `|`. */
export function fightPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** True while the pair's stored expiry lies in the future. Missing map or key: off cooldown. */
export function isFightPairOnCooldown(
  cooldowns: Readonly<Record<string, number>> | undefined,
  key: string,
  tick: number,
): boolean {
  const expiry = cooldowns?.[key];
  return typeof expiry === 'number' && tick < expiry;
}

/**
 * Write `key`'s expiry and prune every expired entry (`expiry <= tick`) — they can no
 * longer block anything. Returns a new map; the input is not mutated.
 */
export function writeFightCooldown(
  cooldowns: Readonly<Record<string, number>> | undefined,
  key: string,
  expiry: number,
  tick: number,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [k, v] of Object.entries(cooldowns ?? {})) {
    if (typeof v === 'number' && tick < v) next[k] = v;
  }
  next[key] = expiry;
  return next;
}

export interface LairArrivalResult {
  /** The spawned confront, when one fired. */
  readonly action?: UnifiedAction;
  /** The updated cooldown map, when a confront fired. */
  readonly fightCooldowns?: Record<string, number>;
  /** Why no confront fired, when the arrival was at a lair with a named elite. */
  readonly skipped?: FightTriggerSkip;
}

export interface LairArrivalContext {
  /** Every unified action, including any spawned earlier this phase — the busy test reads it. */
  readonly actions: readonly UnifiedAction[];
  readonly fightCooldowns: Readonly<Record<string, number>> | undefined;
  /** The arrival branch's stream; `createUnifiedAction` draws the first step's duration from it. */
  readonly rng: () => number;
  /** The encounter the mortal walked here to take up, if any (`movementState.targetEncounterId`). */
  readonly targetEncounterId?: string;
}

/**
 * Run the lair-arrival check for `mortalId`, who has just arrived. Emits one
 * `fight.trigger` trace when the arrival was at a lair naming an elite; returns an
 * empty result (no trace) for every other arrival.
 */
export function checkLairArrival(
  state: GameState,
  mortalId: string,
  ctx: LairArrivalContext,
): LairArrivalResult {
  const graph = state.graph;
  const mortal = graph.getNode(mortalId);
  if (!mortal || isMonster(mortal) || isAgentGone(mortal)) return {};

  const positionId = getAgentLocationId(graph, mortalId);
  if (!positionId) return {};
  const lair = resolveToParentLocation(graph, graph.getNode(positionId));
  if (!lair || lair.properties.locationSubtype !== 'lair') return {};
  const monsterId = lair.properties.namedEliteId;
  if (typeof monsterId !== 'string' || monsterId.length === 0) return {};

  const tick = state.tick;
  const trace = (skipped?: FightTriggerSkip, actionId?: string): void => {
    emitTrace({
      category: 'fight.trigger',
      tick,
      source: 'lair_arrival',
      mortalId,
      monsterId,
      lairId: lair.id,
      ...(skipped ? { skipped } : {}),
      ...(actionId ? { actionId } : {}),
      summary: skipped
        ? `${mortal.name} walks into ${lair.name} — no confront (${skipped})`
        : `${mortal.name} walks into ${lair.name} and is confronted by its beast`,
    } as FightTriggerTrace & { summary: string });
  };

  const monster = graph.getNode(monsterId);
  if (!monster || !isMonster(monster) || isAgentGone(monster)) {
    trace('monster_dead');
    return { skipped: 'monster_dead' };
  }
  if (getAvatarAscendant(graph, mortalId) != null) {
    trace('avatar');
    return { skipped: 'avatar' };
  }
  if (ctx.targetEncounterId && getUnifiedTemplateById(ctx.targetEncounterId)?.requiresLiveMonster) {
    trace('arriving_for_hunt');
    return { skipped: 'arriving_for_hunt' };
  }
  // THR-1560: a hunter keeping a hunt appointment here arrives holding the seed, whose
  // kept branch is the confront — a second one on arrival would be a double spawn.
  if (liveHuntFavourAt(graph, mortalId, lair.id)) {
    trace('hunt_appointment');
    return { skipped: 'hunt_appointment' };
  }
  if (!isUnifiedAgentIdle(ctx.actions, mortalId)) {
    trace('busy');
    return { skipped: 'busy' };
  }
  const key = fightPairKey(mortalId, monsterId);
  if (isFightPairOnCooldown(ctx.fightCooldowns, key, tick)) {
    trace('cooldown');
    return { skipped: 'cooldown' };
  }

  const template = getUnifiedTemplateById(FIGHT_LAIR_CONFRONT_ID);
  if (!template) return {};
  const action = createUnifiedAction({
    actorId: mortalId,
    templateId: FIGHT_LAIR_CONFRONT_ID,
    targetId: monsterId,
    scale: template.scale,
    source: 'system',
    tick,
    template,
    rng: ctx.rng,
    targetProperties: monster.properties,
  });
  trace(undefined, action.actionId);
  return {
    action,
    fightCooldowns: writeFightCooldown(ctx.fightCooldowns, key, tick + FIGHT_TRIGGER_COOLDOWN_TICKS, tick),
  };
}
