/**
 * Effect Tick — per-agent per-tick effect bookkeeping.
 *
 * Handles all time-based effect lifecycle:
 * - Duration countdown + destruction on expiry
 * - Cooldown cycling (active → dormant → ready)
 * - Decay/escalation per tick
 * - Tick-based stack accumulation + decay
 * - Consumable charge tracking
 * - Event-based expiry checks
 * - Axiological drift (slow value axis shift toward limit)
 * - Hex effect (per-tick property delta on agent's current hex tile)
 * - Resource manipulate in per_tick mode (drain/restore essence/quintessence)
 *
 * Called once per agent per tick from phaseEffectTick in the orchestrator.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                     | Default | Purpose                                |
 * |--------------------------|---------|----------------------------------------|
 * | STACKING_GLOBAL_CAP      | 10      | Hard cap on stacks                     |
 * | DECAY_MIN_TICK_INTERVAL  | 1       | How often decay recalculates           |
 * | COOLDOWN_MINIMUM_TICKS   | 5       | Floor for cooldown values              |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Emits EffectTickTrace for each state change.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                         | Fallback                              |
 * |--------------------------------------|---------------------------------------|
 * | Missing runtime state                | Initialize default state              |
 * | Negative charges                     | Clamp to 0                            |
 * | Destroyed attachment not found       | Skip silently                         |
 * | Unknown effect type                  | Skip silently                         |
 * | axiological_drift: missing profile   | Skip silently                         |
 * | hex_effect: mode != 'add'            | Skip (set mode not supported via tick) |
 * | hex_effect: property not in enum     | Skip silently                         |
 * | hex_effect: missing hex coords       | Skip silently                         |
 * | resource_manipulate: mode != per_tick| Skip (one_shot handled by events)     |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — all tick operations are deterministic arithmetic.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type {
  AttachmentEffect,
  EffectRuntimeState,
  EffectTickTrace,
} from '../types/effects';
import type { HexMutation } from '../types/hexMutation';
import {
  STACKING_GLOBAL_CAP,
  COOLDOWN_MINIMUM_TICKS,
} from '../data/effect-constants';
import { getAgentLocation } from './graphQueries';

// ═══════════════════════════════════════════════════════════════════
// Effect Tick Result
// ═══════════════════════════════════════════════════════════════════

export interface EffectTickResult {
  /** Updated runtime states (keyed by attachment node ID) */
  updatedStates: Map<string, EffectRuntimeState>;
  /** Attachment IDs that should be destroyed (removed from graph) */
  destroyedAttachments: string[];
  /** Hex tile mutations produced by hex_effect primitives this tick */
  hexMutations: HexMutation[];
  /** Trace entries for inspectability */
  traces: EffectTickTrace[];
}

// ═══════════════════════════════════════════════════════════════════
// Per-Effect Tick Handlers
// ═══════════════════════════════════════════════════════════════════

function tickDuration(
  effect: { type: 'duration'; ticks: number; destroyOnExpiry: boolean },
  state: EffectRuntimeState,
  attachmentId: string,
  agentId: string,
  tick: number,
): { state: EffectRuntimeState; destroy: boolean; trace?: EffectTickTrace } {
  const remaining = (state.ticksRemaining ?? effect.ticks) - 1;
  const newState = { ...state, ticksRemaining: Math.max(0, remaining) };

  if (remaining <= 0 && effect.destroyOnExpiry) {
    return {
      state: newState,
      destroy: true,
      trace: {
        type: 'effect_tick', tick, agentId, attachmentId,
        action: 'destroy',
        details: { reason: 'duration_expired', effectType: 'duration' },
      },
    };
  }

  if (remaining <= 0) {
    return {
      state: newState,
      destroy: false,
      trace: {
        type: 'effect_tick', tick, agentId, attachmentId,
        action: 'expire',
        details: { effectType: 'duration', ticksRemaining: 0 },
      },
    };
  }

  return {
    state: newState,
    destroy: false,
    trace: {
      type: 'effect_tick', tick, agentId, attachmentId,
      action: 'decrement',
      details: { effectType: 'duration', ticksRemaining: remaining },
    },
  };
}

function tickCooldown(
  effect: { type: 'cooldown'; activeTicks: number; cooldownTicks: number },
  state: EffectRuntimeState,
  attachmentId: string,
  agentId: string,
  tick: number,
): { state: EffectRuntimeState; trace?: EffectTickTrace } {
  const elapsed = (state.cooldownTicksElapsed ?? 0) + 1;
  const isActive = state.cooldownActive ?? true; // start active by default

  const activeLength = Math.max(effect.activeTicks, 1);
  const dormantLength = Math.max(effect.cooldownTicks, COOLDOWN_MINIMUM_TICKS);

  if (isActive && elapsed >= activeLength) {
    // Transition: active → dormant
    return {
      state: { ...state, cooldownTicksElapsed: 0, cooldownActive: false },
      trace: {
        type: 'effect_tick', tick, agentId, attachmentId,
        action: 'cooldown_cycle',
        details: { effectType: 'cooldown', transition: 'active_to_dormant' },
      },
    };
  }

  if (!isActive && elapsed >= dormantLength) {
    // Transition: dormant → active
    return {
      state: { ...state, cooldownTicksElapsed: 0, cooldownActive: true },
      trace: {
        type: 'effect_tick', tick, agentId, attachmentId,
        action: 'cooldown_cycle',
        details: { effectType: 'cooldown', transition: 'dormant_to_active' },
      },
    };
  }

  // Continue in current phase
  return {
    state: { ...state, cooldownTicksElapsed: elapsed },
  };
}

function tickDecay(
  effect: {
    type: 'decay';
    startValue: number;
    changePerTick: number;
    limitValue: number;
    destroyAtLimit: boolean;
  },
  state: EffectRuntimeState,
  attachmentId: string,
  agentId: string,
  tick: number,
): { state: EffectRuntimeState; destroy: boolean; trace?: EffectTickTrace } {
  const current = state.decayCurrentValue ?? effect.startValue;
  let next = current + effect.changePerTick;

  // Clamp to limit
  if (effect.changePerTick < 0) {
    next = Math.max(next, effect.limitValue);
  } else {
    next = Math.min(next, effect.limitValue);
  }

  const atLimit = next === effect.limitValue;

  if (atLimit && effect.destroyAtLimit) {
    return {
      state: { ...state, decayCurrentValue: next },
      destroy: true,
      trace: {
        type: 'effect_tick', tick, agentId, attachmentId,
        action: 'destroy',
        details: { reason: 'decay_at_limit', currentValue: next },
      },
    };
  }

  return {
    state: { ...state, decayCurrentValue: next },
    destroy: false,
    trace: {
      type: 'effect_tick', tick, agentId, attachmentId,
      action: 'decay',
      details: { previousValue: current, currentValue: next },
    },
  };
}

function tickStacking(
  effect: {
    type: 'stacking';
    maxStacks: number;
    stackOn: string;
    decayPerTick?: number;
  },
  state: EffectRuntimeState,
  attachmentId: string,
  agentId: string,
  tick: number,
): { state: EffectRuntimeState; trace?: EffectTickTrace } {
  let stacks = state.stacks ?? 0;

  // Tick-based stacking
  if (effect.stackOn === 'per_tick') {
    stacks = Math.min(stacks + 1, effect.maxStacks, STACKING_GLOBAL_CAP);
  }

  // Decay per tick (regardless of stack trigger)
  if (effect.decayPerTick && effect.decayPerTick > 0 && stacks > 0) {
    stacks = Math.max(0, stacks - effect.decayPerTick);
  }

  if (stacks !== (state.stacks ?? 0)) {
    return {
      state: { ...state, stacks },
      trace: {
        type: 'effect_tick', tick, agentId, attachmentId,
        action: 'stack',
        details: { previousStacks: state.stacks ?? 0, currentStacks: stacks },
      },
    };
  }

  return { state: { ...state, stacks } };
}

function tickConsumable(
  state: EffectRuntimeState,
  attachmentId: string,
  agentId: string,
  tick: number,
): { state: EffectRuntimeState; destroy: boolean; trace?: EffectTickTrace } {
  const charges = Math.max(0, state.chargesRemaining ?? 0);

  if (charges <= 0) {
    return {
      state: { ...state, chargesRemaining: 0 },
      destroy: true,
      trace: {
        type: 'effect_tick', tick, agentId, attachmentId,
        action: 'destroy',
        details: { reason: 'charges_depleted' },
      },
    };
  }

  return { state: { ...state, chargesRemaining: charges }, destroy: false };
}

/** Valid hex tile mutable property keys that can be targeted by hex_effect */
const HEX_EFFECT_VALID_FIELDS: ReadonlySet<string> = new Set([
  'divineInfluence',
  'corruption',
  'explorationAttraction',
]);

/**
 * Axiological drift — shift one value axis toward a limit per tick.
 * Mutates agent node properties.axiologicalProfile in place.
 */
function tickAxiologicalDrift(
  effect: { type: 'axiological_drift'; axis: string; ratePerTick: number; limitValue: number },
  agentNode: GraphNode,
  attachmentId: string,
  agentId: string,
  tick: number,
): { trace?: EffectTickTrace } {
  const profile = agentNode.properties.axiologicalProfile as Record<string, number> | undefined;
  if (!profile) return {};

  const current = profile[effect.axis] ?? 0;
  let next: number;

  // Drift toward limitValue: rate is signed — positive drifts up, negative drifts down
  if (effect.ratePerTick >= 0) {
    next = Math.min(current + effect.ratePerTick, effect.limitValue);
  } else {
    next = Math.max(current + effect.ratePerTick, effect.limitValue);
  }

  // Clamp to [-1, 1] axiological range
  next = Math.max(-1, Math.min(1, next));

  if (next === current) return {};

  // Mutate in place — same pattern as other graph node property mutations
  profile[effect.axis] = next;

  return {
    trace: {
      type: 'effect_tick', tick, agentId, attachmentId,
      action: 'decay',
      details: { effectType: 'axiological_drift', axis: effect.axis, previousValue: current, currentValue: next },
    },
  };
}

/**
 * Hex effect — produce a HexMutation for the agent's current hex tile.
 * Only 'add' mode is supported (delta-based, matches HexMutation contract).
 * Fail-soft: returns empty if agent has no location, hex coords, or unsupported property.
 */
function tickHexEffect(
  effect: { type: 'hex_effect'; property: string; value: number | string | boolean; mode: 'set' | 'add'; radius?: number },
  agentLocationNode: GraphNode | undefined,
  attachmentId: string,
): { hexMutation?: HexMutation } {
  // Only numeric 'add' deltas are supported through HexMutation
  if (effect.mode !== 'add' || typeof effect.value !== 'number') return {};
  if (!agentLocationNode) return {};
  if (!HEX_EFFECT_VALID_FIELDS.has(effect.property)) return {};

  const col = agentLocationNode.properties.hexCol as number | undefined;
  const row = agentLocationNode.properties.hexRow as number | undefined;
  if (col === undefined || row === undefined) return {};

  return {
    hexMutation: {
      col,
      row,
      field: effect.property as HexMutation['field'],
      delta: effect.value,
      source: attachmentId,
    },
  };
}

/**
 * Resource manipulate (per_tick mode) — drain or restore essence/quintessence each tick.
 * Mutates agent node property in place. Clamps to [0, ∞).
 * one_shot mode is handled by the event handler (processEffectEvent), not here.
 */
function tickResourceManipulate(
  effect: { type: 'resource_manipulate'; resource: 'essence' | 'quintessence'; target: string; amount: number; mode: 'per_tick' | 'one_shot' },
  agentNode: GraphNode,
  attachmentId: string,
  agentId: string,
  tick: number,
): { trace?: EffectTickTrace } {
  if (effect.mode !== 'per_tick') return {};
  if (effect.target !== 'self') return {}; // 'other_agent' targeting not handled per-tick

  const current = (agentNode.properties[effect.resource] as number) ?? 0;
  // Clamp to [0, max]. Quintessence has a max capacity; essence has no defined max.
  const max = effect.resource === 'quintessence'
    ? (agentNode.properties.quintessenceMax as number | undefined) ?? 1.0
    : Infinity;
  const next = Math.max(0, Math.min(max, current + effect.amount));
  if (next === current) return {};

  agentNode.properties[effect.resource] = next;

  return {
    trace: {
      type: 'effect_tick', tick, agentId, attachmentId,
      action: 'decay',
      details: { effectType: 'resource_manipulate', resource: effect.resource, previousValue: current, currentValue: next },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Main Tick Function
// ═══════════════════════════════════════════════════════════════════

/**
 * Process one tick of effect bookkeeping for a single agent.
 *
 * Walks all attachment edges, reads effects[], and updates runtime
 * state for time-based effects (duration, cooldown, decay, stacking).
 *
 * @param graph - World graph
 * @param agentId - Agent to process
 * @param tick - Current tick number
 * @param effectStates - Current per-attachment runtime states
 * @returns Updated states, destroyed attachments, and traces
 */
export function tickEffects(
  graph: WorldGraph,
  agentId: string,
  tick: number,
  effectStates: Map<string, EffectRuntimeState>,
): EffectTickResult {
  const updatedStates = new Map(effectStates);
  const destroyedAttachments: string[] = [];
  const hexMutations: HexMutation[] = [];
  const traces: EffectTickTrace[] = [];

  // Resolve agent node and location once — needed for axiological_drift, hex_effect, resource_manipulate
  const agentNode = graph.getNode(agentId);
  const agentLocationNode = agentNode ? getAgentLocation(graph, agentId) : undefined;

  const edgeTypes = ['possesses', 'bonded_to', 'has_trait'] as const;

  for (const edgeType of edgeTypes) {
    const edges = graph.getOutgoingEdges(agentId, edgeType);
    for (const edge of edges) {
      const node = graph.getNode(edge.target);
      if (!node) continue;

      const effects = node.properties.effects as AttachmentEffect[] | undefined;
      if (!effects || !Array.isArray(effects)) continue;

      let state = updatedStates.get(node.id) ?? {};
      let shouldDestroy = false;

      for (const effect of effects) {
        switch (effect.type) {
          case 'duration': {
            const r = tickDuration(effect, state, node.id, agentId, tick);
            state = r.state;
            if (r.destroy) shouldDestroy = true;
            if (r.trace) traces.push(r.trace);
            break;
          }
          case 'cooldown': {
            const r = tickCooldown(effect, state, node.id, agentId, tick);
            state = r.state;
            if (r.trace) traces.push(r.trace);
            break;
          }
          case 'decay': {
            const r = tickDecay(effect, state, node.id, agentId, tick);
            state = r.state;
            if (r.destroy) shouldDestroy = true;
            if (r.trace) traces.push(r.trace);
            break;
          }
          case 'stacking': {
            const r = tickStacking(effect, state, node.id, agentId, tick);
            state = r.state;
            if (r.trace) traces.push(r.trace);
            break;
          }
          case 'consumable_charge': {
            // Initialize charges on first tick if not set
            if (state.chargesRemaining === undefined) {
              state = { ...state, chargesRemaining: effect.charges };
            }
            // Only destroy if charges are 0 and destroyOnEmpty is true
            if (state.chargesRemaining! <= 0 && effect.destroyOnEmpty) {
              const r = tickConsumable(state, node.id, agentId, tick);
              state = r.state;
              if (r.destroy) shouldDestroy = true;
              if (r.trace) traces.push(r.trace);
            }
            break;
          }
          case 'axiological_drift': {
            if (agentNode) {
              const r = tickAxiologicalDrift(effect, agentNode, node.id, agentId, tick);
              if (r.trace) traces.push(r.trace);
            }
            break;
          }
          case 'hex_effect': {
            const r = tickHexEffect(effect, agentLocationNode, node.id);
            if (r.hexMutation) hexMutations.push(r.hexMutation);
            break;
          }
          case 'resource_manipulate': {
            if (agentNode) {
              const r = tickResourceManipulate(effect, agentNode, node.id, agentId, tick);
              if (r.trace) traces.push(r.trace);
            }
            break;
          }
          // Non-time-based effects: no tick processing needed
          default:
            break;
        }
      }

      updatedStates.set(node.id, state);

      if (shouldDestroy) {
        destroyedAttachments.push(node.id);
      }
    }
  }

  return { updatedStates, destroyedAttachments, hexMutations, traces };
}

/**
 * Add stacks to an effect from an external event trigger.
 * Called by encounter resolution when events like combat_success occur.
 *
 * @param attachmentId - The attachment containing the stacking effect
 * @param effectStates - Current runtime states
 * @param trigger - The stack trigger event
 * @param maxStacks - Per-effect max stacks
 * @returns Updated state (or undefined if no change)
 */
export function addEventStack(
  attachmentId: string,
  effectStates: Map<string, EffectRuntimeState>,
  trigger: string,
  maxStacks: number,
): EffectRuntimeState | undefined {
  const state = effectStates.get(attachmentId) ?? {};
  const current = state.stacks ?? 0;
  const cap = Math.min(maxStacks, STACKING_GLOBAL_CAP);

  if (current >= cap) return undefined;

  const newState = { ...state, stacks: Math.min(current + 1, cap) };
  effectStates.set(attachmentId, newState);
  return newState;
}
