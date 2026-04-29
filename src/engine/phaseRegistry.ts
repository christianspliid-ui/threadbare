/**
 * Declarative Engine Phase Registry — THR-238
 *
 * Phases are registered as descriptors in `src/engine/phases/index.ts` and grouped
 * into coarse slots positioned at fixed anchor points in `runTick`. The orchestrator
 * resolves the slot plan once at module-load time (topo-sort + validation) and walks
 * it per tick. This replaces the wiring-checklist social contract with type and
 * boot-time errors: missing dependencies, cycles, and id collisions all fail before
 * the first tick runs.
 *
 * Authors add a new phase by creating a descriptor file under `src/engine/phases/`
 * and adding it to the index — no edit to `orchestrator.ts` required.
 */
import type { GameState } from '../types/gameState';
import type { SimulationRuntime } from './simulationRuntime';
import { emitTrace } from './traceBuffer';

/** Inputs every registered phase receives. */
export interface PhaseContext {
  /** Per-session runtime (caches, version counters). Undefined for legacy callers. */
  runtime?: SimulationRuntime;
  /**
   * Reserved for future expansion: rng, scryTargets, prevTickEventCount, etc.
   * Phases that need these stay inline in `runTick` for now (see plan § Phases that
   * need extra arguments).
   */
}

/** Mirrors today's per-phase contract: a partial state delta merged into `s`. */
export type PhaseResult = Partial<GameState>;

/**
 * Coarse position slot. The orchestrator runs each slot at a hardcoded anchor in
 * `runTick`; phases never cross slot boundaries (cross-slot dependencies are
 * rejected at boot). Slot semantics:
 *
 * - `pre-doom`        — before phaseDoom. Earliest hook.
 * - `post-doom`       — after the doom/omen/composition cluster, before unified action progress.
 * - `post-resolution` — after the Phase 2a unified-action cluster, before agent decision.
 * - `post-decision`   — after agent decision, movement, colocation, social, before rival actions.
 * - `pre-economy`     — after the rival/stealth/essence/control cluster, before reputation/decay/settlement work.
 * - `post-economy`    — after settlement/prosperity/economic chronicle, before ambition progress.
 * - `pre-lifecycle`   — after the ruin/delve cluster, before agent lifecycle (death/birth).
 * - `post-narrative`  — after phaseNarrative, before mandate/doom-expiry.
 */
export type PhaseSlot =
  | 'pre-doom'
  | 'post-doom'
  | 'post-resolution'
  | 'post-decision'
  | 'pre-economy'
  | 'post-economy'
  | 'pre-lifecycle'
  | 'post-narrative';

/** All slot ids in execution order. Used by tests + DebugPanel grouping. */
export const PHASE_SLOTS: readonly PhaseSlot[] = [
  'pre-doom',
  'post-doom',
  'post-resolution',
  'post-decision',
  'pre-economy',
  'post-economy',
  'pre-lifecycle',
  'post-narrative',
] as const;

export interface EnginePhase {
  /** Stable string id. Unique across the registry. Used for traces, ordering, DebugPanel. */
  id: string;

  /** Coarse slot. Determines anchor position in `runTick`. */
  slot: PhaseSlot;

  /**
   * Phase ids that must run before this one (within the same slot). Validated against
   * the registry at module-load time; unknown refs and cycles throw at boot.
   */
  afterPhase?: readonly string[];

  /** Phase ids that must run after this one (within the same slot). Same validation as afterPhase. */
  beforePhase?: readonly string[];

  /**
   * The phase work. Must not throw — `runRegisteredPhases` catches and emits
   * `tick_crash` (NFP #4 fail-soft). Returns a partial state delta merged into
   * the running state.
   */
  run: (state: GameState, ctx: PhaseContext) => PhaseResult;

  /** Optional human label for DebugPanel. Defaults to `id`. */
  label?: string;
}

/** Per-slot, topologically sorted plan. Frozen and reused across ticks. */
export type PhasePlan = ReadonlyMap<PhaseSlot, readonly EnginePhase[]>;

/**
 * Validate + topo-sort phase descriptors into a slot-keyed plan.
 *
 * Throws (at module-load time) on:
 *  - duplicate `id`
 *  - `afterPhase`/`beforePhase` references an unknown id
 *  - `afterPhase`/`beforePhase` references a phase in a different slot
 *  - cycle in the same slot
 *
 * Empty registry returns an empty plan (no slots populated, all `runRegisteredPhases`
 * calls become no-ops). This is the Land 1 ship state.
 *
 * Stable tie-breaking: when two phases in the same slot have no ordering constraint
 * relative to each other, they are ordered by `id` ascending. This keeps phase order
 * deterministic across module-load orderings (NFP #3).
 */
export function buildPhasePlan(phases: readonly EnginePhase[]): PhasePlan {
  // Detect duplicate ids.
  const idToPhase = new Map<string, EnginePhase>();
  for (const phase of phases) {
    if (idToPhase.has(phase.id)) {
      throw new Error(
        `[phaseRegistry] Duplicate phase id "${phase.id}". Each EnginePhase.id must be unique.`,
      );
    }
    idToPhase.set(phase.id, phase);
  }

  // Group by slot.
  const bySlot = new Map<PhaseSlot, EnginePhase[]>();
  for (const phase of phases) {
    const arr = bySlot.get(phase.slot) ?? [];
    arr.push(phase);
    bySlot.set(phase.slot, arr);
  }

  // Validate cross-references and build per-slot adjacency.
  for (const phase of phases) {
    for (const ref of phase.afterPhase ?? []) {
      const target = idToPhase.get(ref);
      if (!target) {
        const slotIds = (bySlot.get(phase.slot) ?? []).map(p => p.id).join(', ');
        throw new Error(
          `[phaseRegistry] Phase "${phase.id}" references unknown afterPhase "${ref}". ` +
          `Available ids in slot "${phase.slot}": ${slotIds || '(none)'}.`,
        );
      }
      if (target.slot !== phase.slot) {
        throw new Error(
          `[phaseRegistry] Phase "${phase.id}" (slot "${phase.slot}") references afterPhase "${ref}" ` +
          `which lives in slot "${target.slot}". Cross-slot dependencies are not supported — ` +
          `move "${phase.id}" to slot "${target.slot}" or reorganize the slots.`,
        );
      }
    }
    for (const ref of phase.beforePhase ?? []) {
      const target = idToPhase.get(ref);
      if (!target) {
        const slotIds = (bySlot.get(phase.slot) ?? []).map(p => p.id).join(', ');
        throw new Error(
          `[phaseRegistry] Phase "${phase.id}" references unknown beforePhase "${ref}". ` +
          `Available ids in slot "${phase.slot}": ${slotIds || '(none)'}.`,
        );
      }
      if (target.slot !== phase.slot) {
        throw new Error(
          `[phaseRegistry] Phase "${phase.id}" (slot "${phase.slot}") references beforePhase "${ref}" ` +
          `which lives in slot "${target.slot}". Cross-slot dependencies are not supported — ` +
          `move "${phase.id}" to slot "${target.slot}" or reorganize the slots.`,
        );
      }
    }
  }

  // Per-slot topo sort with stable tie-break (alphabetical by id).
  const plan = new Map<PhaseSlot, readonly EnginePhase[]>();
  for (const slot of PHASE_SLOTS) {
    const slotPhases = bySlot.get(slot) ?? [];
    if (slotPhases.length === 0) continue;
    plan.set(slot, topoSortSlot(slotPhases));
  }
  return plan;
}

/**
 * Kahn's algorithm with alphabetical tie-break.
 *
 * Edge convention: A -> B means A must run before B. So `afterPhase: ['x']` on
 * phase Y produces edge x -> Y; `beforePhase: ['x']` on phase Y produces edge Y -> x.
 */
function topoSortSlot(phases: readonly EnginePhase[]): readonly EnginePhase[] {
  const idToPhase = new Map(phases.map(p => [p.id, p]));
  const indeg = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const p of phases) {
    indeg.set(p.id, 0);
    outgoing.set(p.id, []);
  }
  for (const p of phases) {
    for (const ref of p.afterPhase ?? []) {
      // ref must run before p → ref -> p
      outgoing.get(ref)!.push(p.id);
      indeg.set(p.id, (indeg.get(p.id) ?? 0) + 1);
    }
    for (const ref of p.beforePhase ?? []) {
      // p must run before ref → p -> ref
      outgoing.get(p.id)!.push(ref);
      indeg.set(ref, (indeg.get(ref) ?? 0) + 1);
    }
  }

  const result: EnginePhase[] = [];
  // Use a sorted ready set so tie-breaking is deterministic.
  const ready: string[] = [...indeg.entries()]
    .filter(([, d]) => d === 0)
    .map(([id]) => id)
    .sort();
  while (ready.length > 0) {
    // Always pick the alphabetically smallest ready id (stable tie-break).
    ready.sort();
    const id = ready.shift()!;
    result.push(idToPhase.get(id)!);
    for (const next of outgoing.get(id) ?? []) {
      const newDeg = (indeg.get(next) ?? 0) - 1;
      indeg.set(next, newDeg);
      if (newDeg === 0) ready.push(next);
    }
  }

  if (result.length !== phases.length) {
    const remaining = phases.filter(p => !result.find(r => r.id === p.id)).map(p => p.id);
    throw new Error(
      `[phaseRegistry] Cycle detected in slot "${phases[0].slot}". ` +
      `Phases involved: ${remaining.join(', ')}. ` +
      `Check afterPhase/beforePhase declarations for circular references.`,
    );
  }
  return result;
}

/**
 * Run all registered phases for a given slot.
 *
 * Per-phase contract:
 *  - Phase output is merged via `{ ...s, ...result }`, matching the legacy inline pattern.
 *  - Exceptions are caught and emitted as `tick_crash` traces (NFP #4 fail-soft).
 *    The crashing phase contributes nothing to state; subsequent phases keep running.
 *  - Each phase emits a `tick_phase_profile` trace with `phase: <id>`, `durationMs`,
 *    and `eventDelta` (count of `tickEvents` added).
 *
 * Empty plan (Land 1 ship state) is a no-op: returns the input state unchanged.
 */
export function runRegisteredPhases(
  state: GameState,
  ctx: PhaseContext,
  slot: PhaseSlot,
  plan: PhasePlan,
): GameState {
  const phases = plan.get(slot);
  if (!phases || phases.length === 0) return state;

  let s = state;
  let prevEventCount = s.tickEvents.length;
  for (const phase of phases) {
    const phaseStart = performance.now();
    try {
      const delta = phase.run(s, ctx);
      s = { ...s, ...delta };
    } catch (err) {
      emitTrace({
        tick: s.tick,
        category: 'tick_crash',
        summary: `Phase "${phase.id}" threw during ${slot}: ${err instanceof Error ? err.message : String(err)}`,
        type: 'tick_exception',
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      } as Parameters<typeof emitTrace>[0]);
      // Skip this phase's output, continue with next phase.
      prevEventCount = s.tickEvents.length;
      continue;
    }
    const eventDelta = s.tickEvents.length - prevEventCount;
    emitTrace({
      tick: s.tick,
      category: 'tick_phase_profile',
      summary: `${phase.id}: ${eventDelta} events in ${(performance.now() - phaseStart).toFixed(2)}ms`,
      phase: phase.id,
      durationMs: performance.now() - phaseStart,
      eventDelta,
    });
    prevEventCount = s.tickEvents.length;
  }
  return s;
}
