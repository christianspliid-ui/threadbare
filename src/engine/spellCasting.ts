/**
 * Spell casting — the one resolver for every cast (THR-1571, the power runtime S1).
 *
 * Before this module a cast ran `activateSpell` and applied nothing: its only caller,
 * `use × Power`, read the outcome and the soul price and dropped `appliedEffects` and
 * `backlashEffect` on the floor, behind a coin keyed on the caster id's *length*.
 * `resolveCast` is now the only path to a cast. In order it:
 *
 *   1. refuses a sealed caster or a spell with no valid target — before any payment;
 *   2. runs `activateSpell`'s gates (prerequisites, the per-caster cooldown in
 *      `GameState.castCooldowns`, affordability) and pays the price — on every band;
 *   3. on a landed band (`CAST_LANDED_BANDS`) runs each effect through `executeEffect`
 *      → `applyExecutionResult`, the live applier;
 *   4. evaluates backlash against the band (the price layer decides which bands) on
 *      its own seeded stream, and applies it the same way;
 *   5. raises `'spell_cast'` on the caster's own carried triggers;
 *   6. queues the soul price as a `spell_price` quintessence event (FB3's split);
 *   6b. (THR-1572) a generated transgression spell is noticed: a `forbidden_contact`
 *      hidden mark on the caster, once per caster per spell, landed or fizzled;
 *   7. traces `spell.cast_resolved` (and `spell.backlash` when it bit).
 *
 * The band is the roll that already happened — a step's, or an undertaking's final
 * checkpoint. There is never a second outcome die (lane decision 1).
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────────
 * Backlash draws from `hash('backlash:' + seed + ':' + siteRef + ':' + caster)`, a
 * `random` teleport from `hash('teleport:' + …)`, carried triggers from
 * `hash('spell_cast:' + …)`. Each is its own stream, so a cast shifts no other roll.
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * Anything thrown inside is caught: the caller sees `refused: 'error'` and resolves
 * as if no cast happened. Nothing throws into the tick.
 *
 * Plan doc: Docs/plans/2026-09-29-thr-1571-power-runtime.md
 */

import type { GameState } from '../types/gameState';
import type { AttachmentEffect, SpellCost, SpellTemplate } from '../types/effects';
import type { StepOutcome } from '../types/unifiedAction';
import type { WorldGraph } from './graph';
import type { QuintessenceEvent } from '../types/quintessence';
import type { EffectRuntimeState } from '../types/effects';
import { activateSpell, castCooldownKey, type StrainPayer } from './spellActivation';
import { executeEffect, type ExecutionResult } from './effectExecutors';
import { applyExecutionResult } from './effects/effectEventDispatch';
import { applyConditionToActor } from './effects/conditionApplier';
import { isSpellSuppressedFor } from './effects/effectSuppression';
import { collectAttachmentEffects } from './effects/effectWalker';
import { checkAndFireActionTriggers } from './effects/actionTrigger';
import { applyActionTriggerPayloads } from './effects/actionTriggerPayloads';
import { agentPosition, locationHex } from './effects/castRelocation';
import { emitTrace } from './traceBuffer';
import { mulberry32 } from '../lib/prng';
import { hexDistance } from '../lib/hexMath';
import { SPELL_SOUL_PRICE_QUINTESSENCE_SCALE } from '../data/strategic-action-constants';
import { strainConditionId } from '../data/strain-conditions';
import { CAST_LANDED_BANDS, CAST_ENEMY_FILTER_ADMITS_STRANGERS } from '../data/spell-casting-constants';
import { isAlly, actorFactionId } from './allegiance';
import { areFactionsHostile } from './factionNetwork';
import { applyCastChannel, splitCastEffects, type CastChannelResult } from './castChannel';
import { placeSpellNotice, spellNoticeMarkId, spellProvenance } from './spellGenerator/notice';
import { knowsSpellEdge } from './spellGrant';
import { writeAgentDetection } from './agentDetection';
import { DIVINE_TAUGHT_CAST_DETECTION } from '../data/spell-grant-constants';

// ═══════════════════════════════════════════════════════════════════
// Request / result
// ═══════════════════════════════════════════════════════════════════

export interface CastRequest {
  readonly casterId: string;
  readonly spell: SpellTemplate;
  /** The roll that already happened — never a new die. */
  readonly band: StepOutcome;
  /** Resolved by the caller from `spell.targeting` (`resolveCastTarget`). */
  readonly targetId?: string;
  readonly targetHex?: { readonly col: number; readonly row: number };
  readonly tick: number;
  /** S1 ships `'undertaking'`; S2 adds the step cast. */
  readonly site: 'step' | 'undertaking';
  /** `actionId:stepIndex`, or the project id — seeds the cast's consequence streams. */
  readonly siteRef: string;
  /** THR-1683 — mortals the target filter turned away while choosing `targetId` (traced). */
  readonly filterRejected?: number;
}

/** One graph write a cast produced — the only thing a chip may be built from (Law 56). */
export interface CastWrite {
  readonly kind: 'moved' | 'condition' | 'strain' | 'lifted' | 'silenced';
  readonly actorId: string;
  /** The location moved to, the condition landed or lifted, the item silenced. */
  readonly ref: string;
  /** Whether the write came from the backlash rather than the spell landing. */
  readonly fromBacklash?: boolean;
  /**
   * THR-1670 — a condition the spell's *price* put on the caster (a
   * `condition_inflict` cost), read back off the graph after payment.
   */
  readonly fromPrice?: boolean;
  /**
   * THR-1683 — `'cast_condition'` when the write is the cast channel: the spell's
   * modifier-only effects, held on the caster as a timed condition.
   */
  readonly channel?: 'cast_condition';
  /** THR-1683 — a cast-channel bearing that leaves the caster worse off (its chip is a loss). */
  readonly harmful?: boolean;
}

export type CastRefusal = 'prerequisite' | 'cooldown' | 'cost' | 'sealed' | 'no_target' | 'error';

export interface CastResult {
  /** The band landed and the effects were applied. */
  readonly landed: boolean;
  /** Effects executed (empty unless landed). */
  readonly applied: readonly AttachmentEffect[];
  readonly backlash?: { readonly effect: AttachmentEffect; readonly narrative?: string };
  /** What the caster paid (empty when refused). */
  readonly paid: readonly SpellCost[];
  readonly soulPrice?: number;
  readonly writes: readonly CastWrite[];
  readonly refused?: CastRefusal;
  /**
   * THR-1572 — a transgression's notice: the caster's mark for this spell, and whether
   * this cast placed it (a second cast of the same spell places none). Absent for a spell
   * that carries no notice.
   */
  readonly notice?: { readonly markId: string; readonly placed: boolean };
}

const REFUSED = (refused: CastRefusal): CastResult => ({ landed: false, applied: [], paid: [], writes: [], refused });

// ═══════════════════════════════════════════════════════════════════
// Seeded streams
// ═══════════════════════════════════════════════════════════════════

/** FNV-1a over a string — the seed for one cast's consequence stream. */
function hashKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A cast's own seeded stream for one purpose (`backlash`, `teleport`, `spell_cast`). */
export function castStream(state: Pick<GameState, 'seed'>, purpose: string, siteRef: string, casterId: string): () => number {
  return mulberry32(hashKey(`${purpose}:${state.seed ?? 0}:${siteRef}:${casterId}`));
}

// ═══════════════════════════════════════════════════════════════════
// Targets
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a cast's target from `spell.targeting` (§ Resolution logic).
 *
 * - `self` → the caster.
 * - `agent` → the named node when it is a mortal within `range` hexes; else the
 *   nearest other mortal at the caster's own location, by id. Range 0 means the same
 *   hex. Both paths honour `targeting.filter` (THR-1683): before it, Hollow Crown
 *   (`enemy`) was aimed at the caster's own bonded ally because the ally stood
 *   nearest. `filterRejected` counts the mortals the filter turned away.
 * - `hex` / `location` → the named node's hex, else the caster's own hex.
 */
export function resolveCastTarget(
  graph: WorldGraph,
  casterId: string,
  spell: SpellTemplate,
  targetNodeId: string | undefined,
): { targetId?: string; targetHex?: { col: number; row: number }; filterRejected?: number } {
  const t = spell.targeting;
  if (t.type === 'self' || t.type === 'attachment') return { targetId: casterId };

  const casterPos = agentPosition(graph, casterId);
  if (t.type === 'agent') {
    let rejected = 0;
    const withRejected = <T extends object>(r: T): T & { filterRejected?: number } =>
      (rejected > 0 ? { ...r, filterRejected: rejected } : r);
    const named = targetNodeId ? graph.getNode(targetNodeId) : undefined;
    if (named && named.type === 'actor' && named.id !== casterId) {
      const pos = agentPosition(graph, named.id);
      if (!casterPos || !pos || hexDistance(casterPos.hex, pos.hex) <= t.range) {
        if (passesTargetFilter(graph, casterId, named.id, t.filter)) return { targetId: named.id };
        rejected++;
      }
    }
    if (!casterPos) return withRejected({});
    const beside = graph.getIncomingEdges(casterPos.locationId, 'located_at')
      .map(e => e.source)
      .filter(id => id !== casterId && id !== named?.id && graph.getNode(id)?.type === 'actor')
      .sort();
    for (const id of beside) {
      if (passesTargetFilter(graph, casterId, id, t.filter)) return withRejected({ targetId: id });
      rejected++;
    }
    return withRejected({});
  }

  // hex / location
  const hex = (targetNodeId ? (locationHex(graph, targetNodeId) ?? agentPosition(graph, targetNodeId)?.hex) : null)
    ?? casterPos?.hex;
  return hex ? { targetHex: hex, ...(targetNodeId ? { targetId: targetNodeId } : {}) } : {};
}

/**
 * Whether a mortal may be the target of a spell with this filter (THR-1683).
 *
 * `ally` reads `isAlly` — the same allegiance `create × Condition` signs a blessing
 * with. `enemy` is anyone who is *not* an ally; a stranger qualifies while
 * `CAST_ENEMY_FILTER_ADMITS_STRANGERS` holds, else only a mortal of a hostile faction
 * does. `any` or no filter admits everyone.
 */
export function passesTargetFilter(
  graph: WorldGraph,
  casterId: string,
  targetId: string,
  filter: 'ally' | 'enemy' | 'any' | undefined,
): boolean {
  if (!filter || filter === 'any') return true;
  const ally = isAlly(graph, casterId, targetId);
  if (filter === 'ally') return ally;
  if (ally) return false;
  if (CAST_ENEMY_FILTER_ADMITS_STRANGERS) return true;
  return areFactionsHostile(graph, actorFactionId(graph, casterId) ?? undefined, actorFactionId(graph, targetId) ?? undefined);
}

// ═══════════════════════════════════════════════════════════════════
// The resolver
// ═══════════════════════════════════════════════════════════════════

/** Resolve one cast. The only caller of `activateSpell`'s gates in play (THR-1571). */
export function resolveCast(state: GameState, req: CastRequest): CastResult {
  try {
    return resolveCastInner(state, req);
  } catch {
    traceResolved(req, REFUSED('error'));
    return REFUSED('error');
  }
}

function resolveCastInner(state: GameState, req: CastRequest): CastResult {
  const { casterId, spell, band, tick } = req;
  const graph = state.graph;
  if (!graph.getNode(casterId)) return REFUSED('prerequisite');

  // 1. Refusals that cost nothing.
  if (isSpellSuppressedFor(graph, casterId, state.effectStates)) {
    return refuse(req, 'sealed');
  }
  if (spell.targeting.type === 'agent' && !req.targetId) {
    return refuse(req, 'no_target');
  }

  // 2. Gates and price. Strain lands through the one condition writer.
  const writes: CastWrite[] = [];
  const payStrain: StrainPayer = (agentId, reach, durationTicks, atTick) => {
    const conditionId = strainConditionId(reach);
    const result = applyConditionToActor(state, agentId, conditionId, {
      tick: atTick,
      durationTicks,
      edgeId: `has_trait_${agentId}_${conditionId}_${atTick}_${req.siteRef}`,
      edgeProperties: { source: 'spell_strain', spellId: spell.id },
    });
    if (result.applied) {
      writes.push({ kind: 'strain', actorId: agentId, ref: conditionId });
    } else if (result.reason === 'condition_template_missing') {
      // Fail-soft table: the price is still paid, as exhaustion — never the dead property.
      const node = graph.getNode(agentId);
      if (node) node.properties.exhaustedUntilTick = Math.max(Number(node.properties.exhaustedUntilTick ?? 0), atTick + durationTicks);
    }
  };
  if (!state.castCooldowns) state.castCooldowns = new Map();
  // THR-1670 — the caster's bearings before payment, so a `condition_inflict`
  // price can be read back off the graph as a write (Law 56: never off intent).
  const bearingsBefore = new Set(graph.getOutgoingEdges(casterId, 'has_trait').map(e => e.id));
  const activation = activateSpell(
    graph, casterId, spell, req.targetId, tick, 1,
    undefined,
    { graph, effectStates: state.effectStates, persisted: state, tick },
    {
      band,
      backlashRoll: castStream(state, 'backlash', req.siteRef, casterId)(),
      castCooldowns: state.castCooldowns,
      payStrain,
    },
  );
  if (activation.outcome === 'blocked_prerequisite') return refuse(req, 'prerequisite');
  if (activation.outcome === 'blocked_cooldown') return refuse(req, 'cooldown');
  if (activation.outcome === 'blocked_cost') return refuse(req, 'cost');

  collectPriceConditions(state, casterId, bearingsBefore, writes);

  const landed = activation.landed ?? CAST_LANDED_BANDS.includes(band);
  const teleportRng = castStream(state, 'teleport', req.siteRef, casterId);

  // 3. The spell lands.
  const applied: AttachmentEffect[] = [];
  let channelResult: CastChannelResult | undefined;
  if (landed) {
    // THR-1683: the effects `executeEffect` would trace and drop ride the cast
    // channel instead — one timed condition on the caster — so they hold state.
    const { executed, channel } = splitCastEffects(activation.appliedEffects);
    for (const effect of executed) {
      const exec = executeEffect(effect, {
        casterId,
        ...(req.targetId ? { targetId: req.targetId } : {}),
        ...(req.targetHex ? { targetHex: req.targetHex } : {}),
        tick,
        graph,
        rng: teleportRng,
      });
      applyExecutionResult(state, exec, tick);
      collectWrites(state, exec, writes, false);
      applied.push(effect);
    }
    if (channel.length > 0) {
      // `applied` keeps its pre-THR-1683 meaning — every effect the landed band ran —
      // so the channel's effects count whether or not a bearing was written.
      applied.push(...channel);
      channelResult = applyCastChannel(state, casterId, spell, channel, tick, req.siteRef);
      const conditionId = channelResult.applied ? channelResult.conditionId : undefined;
      // Read back off the graph, never off intent (Law 56).
      if (conditionId && graph.getOutgoingEdges(casterId, 'has_trait').some(e => e.target === conditionId)) {
        writes.push({
          kind: 'condition', actorId: casterId, ref: conditionId, channel: 'cast_condition',
          ...(channelResult.harmful ? { harmful: true } : {}),
        });
      }
    }
  }

  // 4. Backlash — it lands on the caster.
  let backlash: CastResult['backlash'];
  if (activation.backlashEffect) {
    const exec = executeEffect(activation.backlashEffect, {
      casterId, targetId: casterId, tick, graph, rng: teleportRng,
    });
    applyExecutionResult(state, exec, tick);
    collectWrites(state, exec, writes, true);
    backlash = { effect: activation.backlashEffect, ...(activation.backlashNarrative ? { narrative: activation.backlashNarrative } : {}) };
    emitTrace({
      category: 'spell.backlash',
      tick,
      agentId: casterId,
      siteRef: req.siteRef,
      casterId,
      spellId: spell.id,
      trigger: spell.backlash?.trigger ?? '',
      band,
      effectType: activation.backlashEffect.type,
      summary: `${spell.name} turns on ${casterId} (${spell.backlash?.trigger ?? '?'} on ${band})`,
    });
  }

  // 5. 'spell_cast' on the caster's own carried triggers.
  const triggersFired = raiseSpellCast(state, casterId, tick, castStream(state, 'spell_cast', req.siteRef, casterId));

  // 6. The soul price lands on quintessence (FB3), queued for the quintessence phase.
  const soulPrice = activation.soulPrice ?? 0;
  if (soulPrice > 0) {
    const events = state.pendingQuintessenceEvents ?? (state.pendingQuintessenceEvents = []);
    events.push({
      targetNodeId: casterId,
      delta: -soulPrice * SPELL_SOUL_PRICE_QUINTESSENCE_SCALE,
      source: 'spell_price',
      tick,
    } satisfies QuintessenceEvent);
  }

  // 6b. A transgression is noticed (THR-1572, Lane decision 5) — on every cast, landed or not.
  // THR-1672 — a god-taught transgression echoes back to the god: the mark names the
  // teaching, and every cast adds detection where the caster stands (Lane decision 4).
  let notice: CastResult['notice'];
  if (spellProvenance(graph, spell.id)?.notice) {
    const taughtByRaw = knowsSpellEdge(graph, casterId, spell.id)?.properties.grantedBy;
    const taughtBy = typeof taughtByRaw === 'string' ? taughtByRaw : undefined;
    const placed = placeSpellNotice(state, casterId, spell, tick, 'cast', undefined, taughtBy);
    notice = { markId: spellNoticeMarkId(casterId, spell.id), placed: placed !== null };
    if (taughtBy) divineEcho(state, taughtBy, casterId, spell, tick, landed);
  }

  const result: CastResult = {
    landed,
    applied,
    ...(backlash ? { backlash } : {}),
    paid: activation.paidCosts,
    ...(soulPrice > 0 ? { soulPrice } : {}),
    writes,
    ...(notice ? { notice } : {}),
  };
  traceResolved(req, result, triggersFired, channelResult);
  return result;
}

/** THR-1672 — each cast of a god-taught transgression adds detection in the caster's region. */
function divineEcho(state: GameState, ascendantId: string, casterId: string, spell: SpellTemplate, tick: number, landed: boolean): void {
  const write = writeAgentDetection(state, casterId, DIVINE_TAUGHT_CAST_DETECTION, tick);
  if (!write) return;
  try {
    emitTrace({
      category: 'spell.divine_echo', tick, agentId: casterId, ascendantId, casterId, spellId: spell.id,
      regionId: write.regionId, detectionDelta: DIVINE_TAUGHT_CAST_DETECTION, landed,
      summary: `${spell.name} was cast by one a god taught it to — the teaching echoes in ${write.regionId}`,
    });
  } catch {
    /* NFP #4 */
  }
}

function refuse(req: CastRequest, refused: CastRefusal): CastResult {
  const result = REFUSED(refused);
  traceResolved(req, result);
  return result;
}

/** Read an executed effect's writes back off the result (never off intent — Law 56). */
function collectWrites(state: GameState, exec: ExecutionResult, writes: CastWrite[], fromBacklash: boolean): void {
  const flag = fromBacklash ? { fromBacklash: true } : {};
  for (const m of exec.moved ?? []) {
    if (state.graph.getOutgoingEdges(m.actorId, 'located_at').some(e => e.target === m.to)) {
      writes.push({ kind: 'moved', actorId: m.actorId, ref: m.to, ...flag });
    }
  }
  for (const c of exec.conditionRequests ?? []) {
    if (state.graph.getOutgoingEdges(c.targetId, 'has_trait').some(e => e.target === c.conditionTraitId)) {
      writes.push({ kind: 'condition', actorId: c.targetId, ref: c.conditionTraitId, ...flag });
    }
  }
  for (const m of exec.mutations) {
    if (m.type === 'remove_edge' && m.edgeId && exec.traces[0]?.effectType === 'dispel') {
      writes.push({ kind: 'lifted', actorId: exec.traces[0].targetId ?? '', ref: m.edgeId, ...flag });
    }
  }
  for (const s of exec.suppressRequests ?? []) {
    writes.push({ kind: 'silenced', actorId: s.casterId, ref: s.attachmentId, ...flag });
  }
}

/**
 * THR-1670 — the conditions the price just put on the caster: every `has_trait`
 * edge to a condition that was not there before payment, minus the strain the
 * strain payer already recorded.
 */
function collectPriceConditions(
  state: GameState,
  casterId: string,
  bearingsBefore: ReadonlySet<string>,
  writes: CastWrite[],
): void {
  const recorded = new Set(writes.filter(w => w.actorId === casterId).map(w => w.ref));
  for (const edge of state.graph.getOutgoingEdges(casterId, 'has_trait')) {
    if (bearingsBefore.has(edge.id) || recorded.has(edge.target)) continue;
    if (state.graph.getNode(edge.target)?.properties.subcategory !== 'condition') continue;
    writes.push({ kind: 'condition', actorId: casterId, ref: edge.target, fromPrice: true });
    recorded.add(edge.target);
  }
}

/**
 * Raise `'spell_cast'` on the caster's carried triggers — the action-trigger moment
 * `ActionTriggerEvent` has declared since THR-719 and nothing ever raised. Mirrors the
 * `movement_complete` site in `phaseMovement.ts`: fire, write resource deltas, merge
 * the trigger states, apply the payloads.
 */
function raiseSpellCast(state: GameState, casterId: string, tick: number, rng: () => number): number {
  const node = state.graph.getNode(casterId);
  if (!node) return 0;
  const props = node.properties as Record<string, unknown>;
  const effectStates: ReadonlyMap<string, EffectRuntimeState> = state.effectStates ?? new Map();
  const res = checkAndFireActionTriggers(
    collectAttachmentEffects(state.graph, casterId, effectStates),
    'spell_cast',
    {
      agentId: casterId,
      tick,
      agentResources: {
        essence: Number(props.essence ?? 0),
        quintessence: Number(props.quintessence ?? 0),
        quintessenceMax: typeof props.quintessenceMax === 'number' ? props.quintessenceMax : Infinity,
        doom: Number(props.doom ?? 0),
        doomThreshold: typeof props.doomThreshold === 'number' ? props.doomThreshold : 100,
      },
      nextRoll: rng,
      actorName: node.name,
    },
    effectStates,
  );
  if (res.firedCount === 0) return 0;
  for (const delta of res.resourceDeltas) props[delta.resource] = delta.after;
  if (!state.effectStates) state.effectStates = new Map();
  for (const [k, v] of res.updatedStates) state.effectStates.set(k, v);
  if (res.payloadIntents.length > 0) applyActionTriggerPayloads(state, casterId, res.payloadIntents, tick);
  return res.firedCount;
}

function traceResolved(req: CastRequest, result: CastResult, triggersFired = 0, channel?: CastChannelResult): void {
  try {
    const channelTrace = channel && (channel.applied || channel.reason || channel.skipped.length > 0)
      ? {
        channel: {
          applied: channel.applied,
          carried: [...channel.carried],
          skipped: [...channel.skipped],
          ...(channel.durationTicks !== undefined ? { durationTicks: channel.durationTicks } : {}),
          ...(channel.reason ? { reason: channel.reason } : {}),
        },
      }
      : {};
    emitTrace({
      category: 'spell.cast_resolved',
      tick: req.tick,
      agentId: req.casterId,
      site: req.site,
      siteRef: req.siteRef,
      casterId: req.casterId,
      spellId: req.spell.id,
      band: req.band,
      landed: result.landed,
      applied: result.applied.map(e => e.type),
      paid: result.paid.map(c => c.type),
      ...(result.soulPrice !== undefined ? { soulPrice: result.soulPrice } : {}),
      ...(result.refused ? { refused: result.refused } : {}),
      triggersFired,
      // THR-1683 — the cast's graph writes, each marked with the channel it came by.
      writes: result.writes.map(w => ({
        kind: w.kind, actorId: w.actorId, ref: w.ref,
        ...(w.channel ? { channel: w.channel } : {}),
        ...(w.harmful ? { harmful: true } : {}),
        ...(w.fromBacklash ? { fromBacklash: true } : {}),
        ...(w.fromPrice ? { fromPrice: true } : {}),
      })),
      ...channelTrace,
      ...(req.filterRejected ? { filterRejected: req.filterRejected } : {}),
      summary: result.refused
        ? `${req.casterId} could not cast ${req.spell.name}: ${result.refused}`
        : `${req.casterId} casts ${req.spell.name} on ${req.band} — ${result.landed ? 'it lands' : 'it fizzles'}${result.backlash ? ', and it bites back' : ''}`,
    });
  } catch {
    /* NFP #4 — a trace that cannot be written must not take the cast with it */
  }
}

/** Re-exported for the debug bridge and tests. */
export { castCooldownKey };
