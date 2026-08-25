/**
 * Effect Event Dispatch — raise an `EffectEvent` and run everything it triggers.
 *
 * THR-1239. Before this module the full raise sequence (process → apply →
 * instantiate transforms → execute reactive nested effects → emit traces) was
 * written out once, inline, at the single `encounter_outcome` site in the
 * orchestrator. Every other event in the `EffectEvent` union had no producer at
 * all, so the entire executor family — teleport, spawn, compel, cascade, … —
 * was reachable only through spell activation, which is itself dormant. The
 * primitives were not broken; nothing was raising the events that reach them.
 *
 * Adding a producer therefore had to mean copying ~35 lines of dispatch to each
 * new site. This module is that sequence, named once, so `phaseMovement` and
 * `battleResolution` each raise their event in a single call and the next
 * producer (conditions, in stage 6) costs one line rather than a paste.
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * | Failure case                       | Fallback                         |
 * |------------------------------------|----------------------------------|
 * | Agent node missing / already dead  | Return 0, emit nothing           |
 * | Reactive nested effect throws      | Skip that mutation, continue     |
 * | Anything else throws               | Swallow, return 0 — never a crash|
 *
 * The tick loop must never crash on an effect event, so the whole body is
 * guarded. The one deliberate hard failure in this subsystem is the
 * compile-time `never` guard in `executeEffect`, not anything at runtime.
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────────
 * No PRNG of its own — callers pass the seeded stream already in scope at the
 * production site. `transform.probability` is the only consumer.
 *
 * Plan doc: Docs/plans/2026-08-25-effect-vocabulary-activation.md
 */

import type { GameState } from '../../types/gameState';
import type { EffectRuntimeState } from '../../types/effects';
import type { TraceEntry } from '../../types/trace';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { WorldGraph } from '../graph';
import type { ExecutionResult } from '../effectExecutors';
import { executeEffect } from '../effectExecutors';
import { instantiateReward } from '../rewardPool';
import { emitTrace } from '../traceBuffer';
import { processEffectEvent, applyEffectEventResult, type EffectEvent } from './effectEvents';
import { applyExecutionOverlays } from './effectOverlayStore';

/** Where a raise came from — carried on the trace so the producer is one grep away. */
export type EffectEventSite =
  | 'movement_arrival'
  | 'battle_created'
  | 'battle_resolved'
  | 'encounter_outcome'
  | 'doom_threshold';

export interface RaiseEffectEventOptions {
  /** Production site tag, recorded on the `effect.event_raised` trace. */
  site: EffectEventSite;
  /** Seeded RNG from the calling phase (NFP #3) — never `Math.random`. */
  rng: () => number;
  /**
   * The other agent in the event, when one exists. Only `resource_manipulate`
   * with `target: 'other_agent'` reads it; absent means that effect skips.
   */
  counterpartId?: string;
  /**
   * Runtime states to read and update, for a caller threading its own map
   * across a loop instead of using `state.effectStates` (the orchestrator's
   * encounter pass does exactly this and assigns the result at the end of the
   * tick). Omit to read and write `state.effectStates` directly.
   */
  states?: ReadonlyMap<string, EffectRuntimeState>;
}

export interface RaiseEffectEventResult {
  /** Merged runtime states. Also assigned to `state.effectStates` when `opts.states` was omitted. */
  states: Map<string, EffectRuntimeState>;
  /** How many reactive effects fired (0 on any fail-soft path). */
  reactivesFired: number;
}

/**
 * Emit a legacy-shaped effect payload.
 *
 * `EffectTickTrace` and `ExecutionTrace` are keyed on `type`, not `category`, and
 * are not members of the `TraceEntry` union, so they cannot satisfy
 * `TraceEntryInput` without a cast — `emitTrace` normalizes their `type` into a
 * category at runtime. Funnelling both through one function keeps that to a
 * single cast site rather than one per loop (THR-1065 ratchet: casts may only
 * decrease, and each one is a payload the compiler was told not to check).
 */
function emitLegacyEffectTrace(payload: object): void {
  emitTrace(payload as unknown as TraceEntry);
}

/**
 * Apply everything an executed effect produced — graph writes *and* persistence.
 *
 * Named `applyExecutionResult` rather than `...Mutations` because the narrower
 * name was the bug: every consumer read `.mutations`, which looked complete, and
 * silently discarded `terrainOverlays` / `ruleOverrides`. Routing both through
 * one function means the next production site cannot repeat the omission — there
 * is no longer a call that applies only part of a result (THR-1240).
 */
export function applyExecutionResult(
  state: GameState,
  exec: ExecutionResult,
  tick: number,
): void {
  applyExecutionMutations(state.graph, exec.mutations);
  applyExecutionOverlays(state, exec.terrainOverlays, exec.ruleOverrides, tick);
}

/**
 * Apply the graph mutations an executed effect produced.
 *
 * Each mutation is applied independently and fail-soft: one malformed mutation
 * (a dangling edge target, an already-removed node) must not discard the rest
 * of the effect's work.
 */
function applyExecutionMutations(
  graph: WorldGraph,
  mutations: ExecutionResult['mutations'],
): void {
  for (const mut of mutations) {
    try {
      if (mut.type === 'add_node' && mut.data) graph.addNode(mut.data as GraphNode);
      else if (mut.type === 'remove_node' && mut.nodeId) graph.removeNode(mut.nodeId);
      else if (mut.type === 'add_edge' && mut.data) graph.addEdge(mut.data as GraphEdge);
      else if (mut.type === 'remove_edge' && mut.edgeId) graph.removeEdge(mut.edgeId);
    } catch {
      /* fail-soft: skip invalid mutations */
    }
  }
}

/**
 * Raise an `EffectEvent` against one agent's attachments and run the result.
 *
 * Merges the updated runtime states back onto `state.effectStates` (copy-then-
 * assign — `processEffectEvent` returns a fresh map, never the one passed in),
 * instantiates any transform requests, executes every reactive nested effect
 * through the generic dispatcher, and emits both the per-effect traces and one
 * `effect.event_raised` summary.
 *
 * A raise with `reactivesFired: 0` still traces. That is the point: it is the
 * only evidence separating "the production site is live and nothing was
 * listening" from "the production site was never wired" — the exact ambiguity
 * that let the executor family sit dead without anyone noticing.
 *
 * @returns the merged states and how many reactive effects fired
 */
export function raiseEffectEvent(
  state: GameState,
  agentId: string,
  event: EffectEvent,
  opts: RaiseEffectEventOptions,
): RaiseEffectEventResult {
  const incoming: ReadonlyMap<string, EffectRuntimeState> =
    opts.states ?? state.effectStates ?? new Map<string, EffectRuntimeState>();

  try {
    // Fail-soft: a dead or missing agent is silent. Tracing it would spam the
    // buffer on every battle resolution that killed its own commander.
    if (!state.graph.getNode(agentId)) {
      return { states: new Map(incoming), reactivesFired: 0 };
    }

    const result = processEffectEvent(
      state.graph,
      agentId,
      event,
      incoming,
      state.tick,
      opts.rng,
      opts.counterpartId,
    );

    const merged = applyEffectEventResult(state.graph, result);
    // Only own `state.effectStates` when the caller is not threading its own map.
    if (!opts.states) state.effectStates = merged;

    // Transform: the old attachment is already gone (applyEffectEventResult
    // removed it); mint the replacement onto the same bearer.
    for (const req of result.transformRequests) {
      try {
        instantiateReward(state.graph, req.intoTemplate, agentId, state.tick);
      } catch {
        /* fail-soft: a missing template must not abort the remaining transforms */
      }
    }

    for (const fired of result.reactivesFired) {
      try {
        const exec = executeEffect(fired.nestedEffect, {
          casterId: fired.agentId,
          tick: state.tick,
          graph: state.graph,
        });
        applyExecutionResult(state, exec, state.tick);
        for (const trace of exec.traces) emitLegacyEffectTrace(trace);
      } catch {
        /* fail-soft: one bad reactive must not stop the others */
      }
    }

    for (const trace of result.traces) emitLegacyEffectTrace(trace);

    emitTrace({
      category: 'effect.event_raised',
      tick: state.tick,
      agentId,
      event: event.type,
      reactivesFired: result.reactivesFired.length,
      site: opts.site,
      summary: `${event.type} raised at ${opts.site} for ${agentId} (${result.reactivesFired.length} reactive${result.reactivesFired.length === 1 ? '' : 's'} fired)`,
    });

    return { states: merged, reactivesFired: result.reactivesFired.length };
  } catch {
    // NFP #4: the tick loop must never crash on an effect event.
    return { states: new Map(incoming), reactivesFired: 0 };
  }
}
