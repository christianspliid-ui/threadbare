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
 * | Failure case                    | Fallback                    |
 * |---------------------------------|-----------------------------|
 * | Missing runtime state           | Initialize default state    |
 * | Negative charges                | Clamp to 0                  |
 * | Destroyed attachment not found  | Skip silently               |
 * | Unknown effect type             | Skip silently               |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — all tick operations are deterministic arithmetic.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { WorldGraph } from './graph';
import type {
  AttachmentEffect,
  EffectRuntimeState,
  EffectTickTrace,
} from '../types/effects';
import {
  STACKING_GLOBAL_CAP,
  COOLDOWN_MINIMUM_TICKS,
} from '../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Effect Tick Result
// ═══════════════════════════════════════════════════════════════════

export interface EffectTickResult {
  /** Updated runtime states (keyed by attachment node ID) */
  updatedStates: Map<string, EffectRuntimeState>;
  /** Attachment IDs that should be destroyed (removed from graph) */
  destroyedAttachments: string[];
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
  const traces: EffectTickTrace[] = [];

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

  return { updatedStates, destroyedAttachments, traces };
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
