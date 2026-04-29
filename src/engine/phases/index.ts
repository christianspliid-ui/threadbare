/**
 * Engine Phase Registry — THR-238
 *
 * Each entry registers a tick-loop phase with the orchestrator. The orchestrator
 * resolves the registry into a per-slot, topologically-sorted plan at module-load
 * time and walks it via `runRegisteredPhases(state, ctx, slot, PHASE_PLAN)` from
 * the appropriate slot anchors in `runTick`.
 *
 * Adding a new phase:
 *  1. Create `src/engine/phases/<id>.ts` exporting an `EnginePhase` descriptor.
 *  2. Import and add it to the `ENGINE_PHASES` array below.
 *  3. No edit to `orchestrator.ts` required — the slot anchor will pick it up.
 *
 * Validation: duplicate ids, cycles, unknown refs, and cross-slot dependencies all
 * throw at module load (CI catches them via `npx tsc --noEmit` and the unit tests
 * in `__tests__/phaseRegistry.test.ts`).
 *
 * Land 1 (THR-238): registry skeleton lands empty. Land 2 onward populates it.
 */
import { buildPhasePlan, type EnginePhase } from '../phaseRegistry';

export const ENGINE_PHASES: readonly EnginePhase[] = [
  // Land 2 will register canary phases here:
  //   emittedOmenDecayPhase,
  //   reputationDecayPhase,
  // Land 3 will sweep the remaining file-extracted phases per the plan in
  // Docs/plans/2026-04-29-declarative-engine-phase-registry.md.
];

/** Slot-keyed, topo-sorted execution plan. Computed once at module load. */
export const PHASE_PLAN = buildPhasePlan(ENGINE_PHASES);
