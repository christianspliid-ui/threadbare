/**
 * Effect Event Handler — fires effects in response to game events.
 *
 * Handles event-triggered primitives:
 *   reactive        — fires a nested effect when a trigger fires on the agent
 *   stacking        — increments stacks when a stackOn event fires
 *   until_event     — expires/destroys attachment when matching event fires
 *   transform       — replaces attachment with a new template on trigger
 *
 * All four primitives check the agent's attachments via the shared walker,
 * evaluate conditions/cooldowns, and return a compact result that the
 * orchestrator applies to graph + effectStates.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                         | Default | Purpose                              |
 * |------------------------------|---------|--------------------------------------|
 * | REACTIVE_DEFAULT_COOLDOWN    | 3       | Min ticks between reactive firings   |
 * | TRANSFORM_DEFAULT_PROB       | 1.0     | Probability when field is omitted    |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                  | Fallback                        |
 * |-------------------------------|---------------------------------|
 * | Missing agent node            | Return empty result             |
 * | No effectStates               | Treat all effects as active     |
 * | Reactive on cooldown          | Skip (no state mutation)        |
 * | Until_event destroyOnEvent=F  | Expire but don't destroy        |
 * | Unknown reach in event        | Default to 'any_encounter' only |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * transform.probability rolls use the provided rng (seeded at call site).
 * All other processing is deterministic.
 *
 * Design doc: Docs/plans/2026-04-05-effect-primitive-architecture.md
 */

import type { WorldGraph } from '../graph';
import type {
  EffectRuntimeState,
  EffectTickTrace,
  StackTrigger,
  ReactiveTrigger,
  ExpiryEvent,
} from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import { collectAttachmentEffects } from './effectWalker';
import { addEventStack } from '../effectTick';
import { STACKING_GLOBAL_CAP } from '../../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

/** Minimum ticks between reactive firings when no cooldown is specified */
const REACTIVE_DEFAULT_COOLDOWN = 3;

/** Default transform probability when not specified */
const TRANSFORM_DEFAULT_PROB = 1.0;

// ═══════════════════════════════════════════════════════════════════
// EffectEvent — game event types that can trigger effects
// ═══════════════════════════════════════════════════════════════════

export type EffectEvent =
  | { type: 'encounter_outcome'; reach: ReachDomain; success: boolean }
  | { type: 'damaged'; amount: number }
  | { type: 'healed'; amount: number }
  | { type: 'entered_hex'; hex: { col: number; row: number } }
  | { type: 'combat_started' }
  | { type: 'combat_ended' }
  | { type: 'rest' }
  | { type: 'doom_threshold'; stage: number };

// ═══════════════════════════════════════════════════════════════════
// EffectEventResult
// ═══════════════════════════════════════════════════════════════════

export interface EffectEventResult {
  /** Updated per-attachment runtime states (merge into GameState.effectStates) */
  updatedStates: Map<string, EffectRuntimeState>;
  /** Attachments whose until_event/transform expiry fired (remove from graph) */
  destroyedAttachments: string[];
  /** Transform requests — attachment should be replaced with a new template (Phase 5) */
  transformRequests: Array<{ attachmentId: string; intoTemplate: string }>;
  /** Reactive effect payloads pending execution — includes full nested effect for orchestrator */
  reactivesFired: Array<{
    attachmentId: string;
    attachmentName: string;
    agentId: string;
    nestedEffect: import('../../types/effects').AttachmentEffect;
  }>;
  /** Trace entries for inspectability */
  traces: EffectTickTrace[];
}

// ═══════════════════════════════════════════════════════════════════
// Event → Trigger Mapping
// ═══════════════════════════════════════════════════════════════════

/** Reaches that count as "combat" for stacking trigger classification */
const COMBAT_REACHES: ReadonlySet<ReachDomain> = new Set(['iron', 'martial']);
/** Reaches that count as "social" for stacking trigger classification */
const SOCIAL_REACHES: ReadonlySet<ReachDomain> = new Set(['heart', 'grace', 'gold']);

/**
 * Map an EffectEvent to the set of StackTrigger strings it fires.
 * A stacking effect's stackOn must be in this set to receive a stack.
 */
function getStackTriggers(event: EffectEvent): StackTrigger[] {
  switch (event.type) {
    case 'encounter_outcome': {
      const triggers: StackTrigger[] = ['any_encounter'];
      if (event.success) {
        if (COMBAT_REACHES.has(event.reach)) triggers.push('combat_success');
        if (SOCIAL_REACHES.has(event.reach)) triggers.push('social_success');
      } else {
        if (COMBAT_REACHES.has(event.reach)) triggers.push('combat_failure');
      }
      return triggers;
    }
    case 'damaged':
      return ['on_damaged'];
    case 'healed':
      return ['on_heal'];
    default:
      return [];
  }
}

/**
 * Map an EffectEvent to the ReactiveTrigger string it fires (if any).
 */
function getReactiveTrigger(event: EffectEvent): ReactiveTrigger | null {
  switch (event.type) {
    case 'damaged':       return 'damaged';
    case 'healed':        return 'healed';
    case 'entered_hex':   return 'entered_hex';
    case 'combat_started': return 'encounter_started';
    default:              return null;
  }
}

/**
 * Map an EffectEvent to the ExpiryEvent string it matches (if any).
 * Used for until_event and transform trigger matching.
 */
function getExpiryEvent(event: EffectEvent): ExpiryEvent | null {
  switch (event.type) {
    case 'combat_started':    return 'enter_combat';
    case 'combat_ended':      return 'leave_combat';
    case 'damaged':           return 'take_damage';
    case 'rest':              return 'rest';
    case 'encounter_outcome': return 'encounter_complete';
    case 'doom_threshold':    return 'doom_threshold';
    default:                  return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main Event Processor
// ═══════════════════════════════════════════════════════════════════

/**
 * Process a game event against all effect-bearing attachments on an agent.
 *
 * Walks attachment edges, evaluates each effect against the event,
 * and returns a compact result for the orchestrator to apply.
 *
 * @param graph       - World graph
 * @param agentId     - Agent receiving the event
 * @param event       - Game event that fired
 * @param effectStates - Current per-attachment runtime states
 * @param tick        - Current tick number
 * @param rng         - Seeded RNG (for transform probability rolls)
 * @returns EffectEventResult with state updates, destroyed ids, and traces
 */
export function processEffectEvent(
  graph: WorldGraph,
  agentId: string,
  event: EffectEvent,
  effectStates: ReadonlyMap<string, EffectRuntimeState>,
  tick: number,
  rng: () => number = Math.random,
): EffectEventResult {
  // Fail-soft: agent must exist
  if (!graph.getNode(agentId)) {
    return {
      updatedStates: new Map(effectStates),
      destroyedAttachments: [],
      transformRequests: [],
      reactivesFired: [],
      traces: [],
    };
  }

  const updatedStates = new Map(effectStates);
  const destroyedAttachments: string[] = [];
  const transformRequests: Array<{ attachmentId: string; intoTemplate: string }> = [];
  const reactivesFired: Array<{ attachmentId: string; attachmentName: string; nestedEffectType: string }> = [];
  const traces: EffectTickTrace[] = [];

  // Pre-compute trigger sets once
  const stackTriggers = getStackTriggers(event);
  const reactiveTrigger = getReactiveTrigger(event);
  const expiryEvent = getExpiryEvent(event);

  for (const entry of collectAttachmentEffects(graph, agentId, updatedStates)) {
    const { attachmentId, attachmentName, effect, runtimeState } = entry;

    // Skip suppressed effects
    if (runtimeState?.suppressed) continue;

    switch (effect.type) {
      // ── Stacking — increment stacks on matching trigger ──────────
      case 'stacking': {
        if (!stackTriggers.includes(effect.stackOn as StackTrigger)) break;

        const newState = addEventStack(attachmentId, updatedStates, effect.stackOn, effect.maxStacks);
        if (newState) {
          traces.push({
            type: 'effect_tick',
            tick,
            agentId,
            attachmentId,
            action: 'stack',
            details: {
              trigger: event.type,
              stackOn: effect.stackOn,
              newStacks: newState.stacks ?? 0,
              maxStacks: effect.maxStacks,
            },
          });
        }
        break;
      }

      // ── Reactive — fire nested effect on matching trigger ────────
      case 'reactive': {
        if (effect.trigger !== reactiveTrigger) break;

        // Check cooldown
        const cooldown = effect.cooldown ?? REACTIVE_DEFAULT_COOLDOWN;
        const lastFired = runtimeState?.reactiveLastTriggeredTick ?? -Infinity;
        if (tick - lastFired < cooldown) break;

        // Update last-triggered tick
        const currentState = updatedStates.get(attachmentId) ?? {};
        updatedStates.set(attachmentId, { ...currentState, reactiveLastTriggeredTick: tick });

        reactivesFired.push({
          attachmentId,
          attachmentName,
          agentId,
          nestedEffect: effect.effect,
        });

        traces.push({
          type: 'effect_tick',
          tick,
          agentId,
          attachmentId,
          action: 'reactive',
          details: {
            trigger: event.type,
            reactiveTrigger: effect.trigger,
            nestedEffect: effect.effect.type,
            cooldownRemaining: 0,
          },
        });
        break;
      }

      // ── Until Event — expire/destroy when matching event fires ──
      case 'until_event': {
        if (effect.event !== expiryEvent) break;

        // Mark the attachment expired (ticksRemaining = 0)
        const currentState = updatedStates.get(attachmentId) ?? {};
        updatedStates.set(attachmentId, { ...currentState, ticksRemaining: 0 });

        if (effect.destroyOnEvent) {
          destroyedAttachments.push(attachmentId);
          traces.push({
            type: 'effect_tick',
            tick,
            agentId,
            attachmentId,
            action: 'destroy',
            details: { reason: 'until_event', event: event.type, expiryEvent },
          });
        } else {
          traces.push({
            type: 'effect_tick',
            tick,
            agentId,
            attachmentId,
            action: 'expire',
            details: { until_event: effect.event, event: event.type },
          });
        }
        break;
      }

      // ── Transform — replace attachment on matching trigger ───────
      case 'transform': {
        if (effect.trigger !== expiryEvent) break;

        // Roll probability
        const probability = effect.probability ?? TRANSFORM_DEFAULT_PROB;
        if (rng() > probability) break;

        // Queue transform — caller creates new attachment node
        transformRequests.push({
          attachmentId,
          intoTemplate: effect.intoTemplate,
        });
        destroyedAttachments.push(attachmentId);

        traces.push({
          type: 'effect_tick',
          tick,
          agentId,
          attachmentId,
          action: 'destroy',
          details: {
            reason: 'transform',
            trigger: effect.trigger,
            intoTemplate: effect.intoTemplate,
            probability,
          },
        });
        break;
      }

      default:
        break;
    }
  }

  return {
    updatedStates,
    destroyedAttachments,
    transformRequests,
    reactivesFired,
    traces,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Helpers for orchestrator consumers
// ═══════════════════════════════════════════════════════════════════

/**
 * Apply an EffectEventResult to the world graph and effectStates.
 * Removes destroyed attachments (edges + node) from the graph.
 * Returns the merged effectStates map.
 *
 * Call this after processEffectEvent to commit the result.
 */
export function applyEffectEventResult(
  graph: WorldGraph,
  result: EffectEventResult,
): Map<string, EffectRuntimeState> {
  // Remove destroyed attachments
  for (const attachId of result.destroyedAttachments) {
    const edges = graph.getIncomingEdges(attachId);
    for (const edge of edges) {
      try { graph.removeEdge(edge.id); } catch { /* already removed */ }
    }
    try { graph.removeNode(attachId); } catch { /* already removed */ }
  }

  return result.updatedStates;
}
