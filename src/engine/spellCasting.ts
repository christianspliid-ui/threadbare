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
import { CAST_LANDED_BANDS } from '../data/spell-casting-constants';

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
}

/** One graph write a cast produced — the only thing a chip may be built from (Law 56). */
export interface CastWrite {
  readonly kind: 'moved' | 'condition' | 'strain' | 'lifted' | 'silenced';
  readonly actorId: string;
  /** The location moved to, the condition landed or lifted, the item silenced. */
  readonly ref: string;
  /** Whether the write came from the backlash rather than the spell landing. */
  readonly fromBacklash?: boolean;
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
 *   hex. The ally/enemy filter is not re-checked here: the cell that proposed the work
 *   already chose its target, and the fallback only ever picks someone standing beside
 *   the caster.
 * - `hex` / `location` → the named node's hex, else the caster's own hex.
 */
export function resolveCastTarget(
  graph: WorldGraph,
  casterId: string,
  spell: SpellTemplate,
  targetNodeId: string | undefined,
): { targetId?: string; targetHex?: { col: number; row: number } } {
  const t = spell.targeting;
  if (t.type === 'self' || t.type === 'attachment') return { targetId: casterId };

  const casterPos = agentPosition(graph, casterId);
  if (t.type === 'agent') {
    const named = targetNodeId ? graph.getNode(targetNodeId) : undefined;
    if (named && named.type === 'actor' && named.id !== casterId) {
      const pos = agentPosition(graph, named.id);
      if (!casterPos || !pos || hexDistance(casterPos.hex, pos.hex) <= t.range) return { targetId: named.id };
    }
    if (!casterPos) return {};
    const beside = graph.getIncomingEdges(casterPos.locationId, 'located_at')
      .map(e => e.source)
      .filter(id => id !== casterId && graph.getNode(id)?.type === 'actor')
      .sort();
    return beside[0] ? { targetId: beside[0] } : {};
  }

  // hex / location
  const hex = (targetNodeId ? (locationHex(graph, targetNodeId) ?? agentPosition(graph, targetNodeId)?.hex) : null)
    ?? casterPos?.hex;
  return hex ? { targetHex: hex, ...(targetNodeId ? { targetId: targetNodeId } : {}) } : {};
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

  const landed = activation.landed ?? CAST_LANDED_BANDS.includes(band);
  const teleportRng = castStream(state, 'teleport', req.siteRef, casterId);

  // 3. The spell lands.
  const applied: AttachmentEffect[] = [];
  if (landed) {
    for (const effect of activation.appliedEffects) {
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

  const result: CastResult = {
    landed,
    applied,
    ...(backlash ? { backlash } : {}),
    paid: activation.paidCosts,
    ...(soulPrice > 0 ? { soulPrice } : {}),
    writes,
  };
  traceResolved(req, result, triggersFired);
  return result;
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

function traceResolved(req: CastRequest, result: CastResult, triggersFired = 0): void {
  try {
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
