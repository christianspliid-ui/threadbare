# Declarative engine phase registry

**Date:** 2026-04-29
**Linear:** [THR-238](https://linear.app/threadbare/issue/THR-238)
**Project:** Continuous Improvement
**Source council:** `Docs/design-councils/2026-04-22-workflow-easier-to-change.md` → Engine perspective item 2 (declarative phase registry)
**Suggested model:** opus
**Status:** Ready for Dev

---

## TL;DR

Convert orchestrator phase wiring from inline `s = { ...s, ...phaseFoo(s) };` blocks in `src/engine/orchestrator.ts` to a declarative registry of phase descriptors. Each registered phase exports `{ id, run, beforePhase?, afterPhase?, ... }`; the orchestrator imports the registry, topologically sorts it once, and executes phases in order. Adding a new phase becomes "create the file, register the descriptor" — no edit to `orchestrator.ts`. Missing dependencies, cycles, and id collisions surface as compile- or boot-time errors instead of as silent integration drift caught later by `wiring-checklist.md`.

This ships in **three landings** so the diff is reviewable and reversible:

1. **Land 1 — type, registry skeleton, topo-sort, conformance test, DebugPanel tab.** No phase migrations yet. Registry is empty; `runTick` calls `runRegisteredPhases(s, runtime, slot: 'pre' | 'post')` that does nothing in this landing. Provides the seam.
2. **Land 2 — migrate two leaf phases as canaries.** `phaseEmittedOmenDecay` (no upstream consumer of its events) and `phaseReputationDecay` (no inline orchestrator logic between it and its neighbours). Establishes the migration recipe and proves equivalence-trace capture.
3. **Land 3 — migrate remaining file-extracted phases.** Walk the table from `wiring-checklist.md` § 1. Inline blocks (Phase 2a.1, 2a.4) stay inline — registry is for file-extracted phases only.

Each landing is an independent commit with its own `Fixes THR-238` keyword on Land 3. Landings 1 and 2 close the issue's risk; Land 3 finishes the migration sweep.

---

## Why

`Docs/plans/wiring-checklist.md` is the social contract that catches "I extracted a phase module but forgot to call it from `orchestrator.ts`" — a recurring failure mode (`feedback_wiring_verification` memory; multiple retros; the 2026-04-22 council's Engine perspective item 2). The checklist is a doc — it depends on the agent reading it, mapping their new module against it, and updating it. It misses regressions silently. Type-checked phase registration replaces "the agent should remember" with "the compiler refuses to build".

The 2026-04-22 council ratified "automation over social convention" as a cross-pillar principle (Synthesis § Unratified takeaways). Four issues are direct expressions of it; this is the Engine-pillar one.

Secondary upside: `runTick` is currently a 600+ line procedural blob (`orchestrator.ts:1906–2520ish`) with 61 `phaseEventCounts[...]` updates and 30+ phase calls. Converting it to a registry walk shrinks the function to a few dozen lines and makes per-phase profiling (`tick_phase_profile`) trivially uniform.

---

## Why now

- The 2026-04-22 council surfaced this as one of the strongest "automation > convention" candidates, alongside THR-237 (count-assertions → invariants), THR-240 (`check:process` lint), THR-241 (session-precheck).
- The Encounter Format Migration project (Urgent priority) is mid-flight and isolated to content files — registry work doesn't collide with it. **Mutex with**: nothing in flight. **Parallel-safe with**: encounter migration phases (THR-103/104/107) and any non-`orchestrator.ts` engine work.
- Orchestrator is currently stable; no other ticket is mid-edit there. Future work (e.g. THR-238-style cleanups, new phases for Social Systems Expansion) will be cheaper after this lands.

---

## Three pillars

### Engine pillar (primary)

#### New types

`src/engine/phaseRegistry.ts`:

```ts
import type { GameState } from '../types/gameState';
import type { SimulationRuntime } from './simulationRuntime';

/** Inputs every registered phase receives. */
export interface PhaseContext {
  runtime?: SimulationRuntime;
  // Reserved for future expansion: rng, scryTargets, prevTickEventCount, etc.
  // Phases that need these are migrated last; for now, phases requiring extra args stay inline.
}

/** What a phase returns. Mirrors today's `Partial<GameState>` contract. */
export type PhaseResult = Partial<GameState>;

/** Slot the phase runs in. Determines coarse position relative to legacy inline blocks. */
export type PhaseSlot =
  | 'pre-doom'         // before phaseDoom (rarely used)
  | 'post-doom'        // after phaseDoom, before unified action progress
  | 'post-resolution'  // after phase 2a, before agent decision
  | 'post-decision'    // after agent decision + movement
  | 'post-narrative'   // after phaseNarrative
  | 'post-economy'     // after settlement/prosperity
  | 'pre-lifecycle';   // before agentLifecycle

export interface EnginePhase {
  /** Stable string id. Used for traces, ordering, and DebugPanel display. Must be unique across the registry. */
  id: string;

  /** Coarse slot. The orchestrator runs each slot at a hardcoded position in `runTick`. */
  slot: PhaseSlot;

  /** Phases that must run before this one. Compile-time-checked against registry ids. */
  afterPhase?: readonly string[];

  /** Phases that must run after this one. Compile-time-checked against registry ids. */
  beforePhase?: readonly string[];

  /** The work. Must not throw — all errors caught and traced as `tick_crash` (NFP #4). */
  run: (state: GameState, ctx: PhaseContext) => PhaseResult;

  /** Optional human label for DebugPanel. Defaults to `id`. */
  label?: string;
}
```

#### Registry file

`src/engine/phases/index.ts`:

```ts
import type { EnginePhase } from '../phaseRegistry';
// Import each phase's descriptor:
import { emittedOmenDecayPhase } from './emittedOmenDecay';
import { reputationDecayPhase } from './reputationDecay';
// ... migrated phases registered here

export const ENGINE_PHASES: readonly EnginePhase[] = [
  emittedOmenDecayPhase,
  reputationDecayPhase,
  // ...
];
```

Each phase file moves from `src/engine/phaseFoo.ts` (exporting `phaseFoo: (state) => Partial<GameState>`) to ALSO exporting a descriptor:

```ts
// src/engine/phases/emittedOmenDecay.ts (new file; re-exports the legacy fn for back-compat)
import type { EnginePhase } from '../phaseRegistry';
import { phaseEmittedOmenDecay } from '../phaseOmenAgenda';

export const emittedOmenDecayPhase: EnginePhase = {
  id: 'emitted_omen_decay',
  slot: 'post-doom',
  afterPhase: ['omen_agenda'],
  run: (state) => phaseEmittedOmenDecay(state),
};
```

This keeps the implementation in its existing file and adds a thin descriptor file. Existing tests (which import the function directly) keep working unchanged.

#### Topological sort + validation

`src/engine/phaseRegistry.ts` exports:

```ts
export function buildPhasePlan(
  phases: readonly EnginePhase[]
): Map<PhaseSlot, EnginePhase[]>;
```

Behavior:
- Group by `slot`.
- Within each slot, topologically sort using `afterPhase`/`beforePhase`.
- **Hard errors** (thrown at module-load time so they fail in CI, not at tick 1):
  - Duplicate `id`.
  - `afterPhase` or `beforePhase` references an unknown id.
  - Cycle inside a slot.
  - Cross-slot dependency (`afterPhase` references a phase in a different slot — error message tells the author to use a different slot rather than allowing the cross-slot edge).

The plan is computed once at module-load time and frozen. `runTick` reads `PHASE_PLAN.get(slot)` — no per-tick cost.

#### Runtime integration

In `runTick`:

```ts
// At the position that used to host the inline `phaseFoo` calls for this slot:
s = runRegisteredPhases(s, ctx, 'post-doom');
```

`runRegisteredPhases` is a small helper:

```ts
function runRegisteredPhases(
  state: GameState,
  ctx: PhaseContext,
  slot: PhaseSlot
): GameState {
  let s = state;
  let prevEventCount = s.tickEvents.length;
  const phases = PHASE_PLAN.get(slot) ?? [];
  for (const phase of phases) {
    const phaseStart = performance.now();
    try {
      s = { ...s, ...phase.run(s, ctx) };
    } catch (err) {
      // NFP #4: fail-soft. Emit tick_crash, don't propagate.
      emitTrace({
        tick: s.tick,
        category: 'tick_crash',
        phase: phase.id,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
    const eventDelta = s.tickEvents.length - prevEventCount;
    emitTrace({
      tick: s.tick,
      category: 'tick_phase_profile',
      phase: phase.id,
      durationMs: performance.now() - phaseStart,
      eventDelta,
      summary: `${phase.id}: ${eventDelta} events in ${(performance.now() - phaseStart).toFixed(2)}ms`,
    });
    prevEventCount = s.tickEvents.length;
  }
  return s;
}
```

This subsumes the per-phase `phaseEventCounts['x'] = ...` boilerplate. Existing `tick_phase_profile` consumers keep working — registered phases now emit it uniformly, where today only some phases do.

#### Equivalence validation

`src/engine/__tests__/phaseRegistry.equivalence.test.ts`:

- **Order baseline test:** seed a small game, run 10 ticks, capture the sequence of `tick_phase_profile` traces (phase ids in execution order). Assert the sequence matches a hand-edited baseline `phaseRegistry.baseline.json`. Diffs require an explicit baseline update (which CC will do as part of Land 2/3 commits).
- **Determinism test:** run the same seed twice, assert phase output state is byte-identical (already the project invariant — this just exercises it through the registry path).
- **Conformance test:** every `EnginePhase.id` in `ENGINE_PHASES` must appear at least once in `wiring-checklist.md` § 1 (or in the new "Registered phases (declarative)" subsection that this plan adds). Catches `id` typos and reminds authors to update the checklist sub-table.

#### Constants

| Constant | Default | Purpose | Location |
|---|---|---|---|
| `PHASE_REGISTRY_PROFILE_TRACE_CATEGORY` | `'tick_phase_profile'` | Existing trace category reused for registered phase telemetry | `src/engine/phaseRegistry.ts` |
| `PHASE_REGISTRY_FAIL_SOFT_TRACE_CATEGORY` | `'tick_crash'` | Existing trace category reused for fail-soft phase errors | `src/engine/phaseRegistry.ts` |

No new tunable numbers. The work is mostly type-system and structural.

#### Tracing

| Trace category | Where emitted | Shape |
|---|---|---|
| `tick_phase_profile` (existing) | `runRegisteredPhases` per phase per tick | `{ tick, category, phase, durationMs, eventDelta, summary }` |
| `tick_crash` (existing) | `runRegisteredPhases` catch block | `{ tick, category, phase, error }` |

No new categories. The registry deliberately reuses `tick_phase_profile` so existing dashboards/DebugPanel work unchanged.

#### Fail-soft table

| Failure | Behavior | Trace |
|---|---|---|
| Phase `run` throws | Skip phase output; continue to next | `tick_crash` with `phase: <id>`, `error: <message>` |
| Duplicate `id` at module-load | Throw (boot fails — CI catches in `npx tsc --noEmit` and `npm test`) | N/A (compile/boot error) |
| Cycle in `afterPhase`/`beforePhase` | Throw at module-load | N/A (compile/boot error) |
| Unknown `afterPhase`/`beforePhase` reference | Throw at module-load with helpful message ("phase 'foo' references unknown afterPhase 'bar'; available ids in slot 'post-doom' are: …") | N/A |
| Cross-slot dependency reference | Throw at module-load | N/A |

The boot-fail-fast contract is the whole point — these are exactly the conditions that the wiring-checklist could only catch socially.

#### Migration recipe (Land 2/3 per phase)

For each file-extracted phase migrated:

1. Create `src/engine/phases/<id>.ts` exporting the descriptor.
2. Add the import + entry to `src/engine/phases/index.ts`.
3. Delete the inline call (`s = { ...s, ...phaseFoo(s) };` and its `phaseEventCounts` line) from `runTick`.
4. Update `Docs/plans/wiring-checklist.md` § 1: move the phase from "Current phases in order" table to a new "Registered phases (declarative)" sub-table, noting `id`, `slot`, `afterPhase`, `beforePhase`.
5. Run the equivalence baseline test; if order changed, update `phaseRegistry.baseline.json` deliberately.
6. Verify `npm test`, `npx tsc --noEmit`, `npx vite build` still pass; run `npm run cli -- --seed 42 --map medium` then `tick 30; status` to sanity-check.

#### Inline blocks stay inline

Phase 2a.1 (thread-bind familiarity grant) and Phase 2a.4 (effect tick) are inline orchestrator blocks, not file-extracted phases. They reach into `runTick`-local state (`prevActions` from input `state`, fresh per-actor mutations to `effectStates`). Migrating them requires changes beyond the registry contract (e.g. exposing the previous-tick state to the descriptor). Out of scope for this issue. Tracked as a follow-up via a new Linear issue if/when needed.

#### Phases that need extra arguments

Some phases take extra inputs:

- `phaseUnifiedActionProgress(s, UNIFIED_ACTION_TEMPLATES, uaRng, runtime)`
- `phaseAgentDecision(s, ..., runtime, distanceMatrix, ...)`
- `phaseJourneyBeat(s, JOURNEY_BEAT_TEMPLATES)`

For these, the descriptor's `run` closes over the constants:

```ts
export const journeyBeatPhase: EnginePhase = {
  id: 'journey_beat',
  slot: 'post-doom',
  afterPhase: ['doom'],
  run: (state) => phaseJourneyBeat(state, JOURNEY_BEAT_TEMPLATES),
};
```

For `runtime`-needing phases, the descriptor reads `ctx.runtime` and forwards it. PRNG-needing phases derive their RNG from `state.seed + state.tick * salt` inside `run` (the existing pattern). If a future phase truly needs the orchestrator-shared `uaRng` instance, the migration deferral kicks in until the registry context is extended.

### UI pillar

Player-facing surface: **none**. This is an engine refactor with no narrative or gameplay impact. UI pillar requirement is satisfied via DebugPanel inspection.

#### DebugPanel: new "Phases" tab

Add `phases` to `ViewMode` in `DebugPanel.tsx`. New sub-component `PhasesDebugTab.tsx`:

- Lists every registered phase grouped by slot, in resolved execution order.
- Each row: id (label), slot, `afterPhase`/`beforePhase` chips, last-tick `durationMs` (read from latest `tick_phase_profile` traces), last-tick `eventDelta`.
- Status badge: 🟢 ran clean / 🟡 ran with skipped events (eventDelta=0) / 🔴 last call emitted `tick_crash`.
- Empty state when registry is empty (Land 1 ship state): "No phases registered yet — registry is the seam being wired in. Migrated phases will appear here from THR-238 Land 2 onward."

This satisfies the "every engine surface needs DebugPanel inspection" rule (NFP #2) and gives the migration a visible artifact: as Land 3 progresses, the tab fills in.

#### Rationale for not adding to chronicle/toast/alerts

This is infrastructure with no player-visible effect. Registered phases produce the same `TickEvent`s, traces, and prose as their inline counterparts. There is nothing for the chronicle, toast stack, or notification overlay to surface that they don't already surface — the events flow through unchanged.

### Content pillar

**Marked N/A with rationale.** This work is structural — no encounter templates, no prose tables, no attachment content, no data tables. Content authors are unaffected: the phases that drive their content (encounter progression, narrative emission, prose enrichment) keep their existing names and signatures; only their wiring location moves.

---

## Wiring section

| Surface | Connection |
|---|---|
| **Orchestrator** | Add `runRegisteredPhases(s, ctx, slot)` calls at 7 hardcoded slot positions in `runTick`. Each replaces a contiguous run of inline `s = { ...s, ...phaseX(s) };` blocks as Land 3 progresses. |
| **GameState flow** | No new `GameState` fields. Registered phases write the same `Partial<GameState>` they wrote inline. |
| **Traces** | `tick_phase_profile` (existing) emitted uniformly per registered phase. `tick_crash` (existing) emitted on phase exception. |
| **DebugPanel** | New `Phases` tab (`PhasesDebugTab.tsx`) showing the registry, execution order, and last-tick profile data. Reads `ENGINE_PHASES` + recent `tick_phase_profile` / `tick_crash` traces. |
| **Prose pipeline** | N/A — registry doesn't generate prose. |
| **Player controls** | None. |
| **Prerequisite health** | Orchestrator must be running (it always is). No upstream throughput dependency. |
| **`wiring-checklist.md` update** | Add "Registered phases (declarative)" sub-table under § 1. Each migrated phase moves from the legacy table to this one. Land 3's last commit moves the migration completion note to the top. |

### Wiring-checklist update (concrete)

Add to `Docs/plans/wiring-checklist.md` § 1, just after the current "Current phases in order" table:

> **Registered phases (declarative — THR-238):**
>
> Phases below are registered in `src/engine/phases/index.ts` and run via `runRegisteredPhases(state, ctx, slot)` from `runTick`. Adding a new declarative phase = create the descriptor file, add it to the index. No edit to `orchestrator.ts` required. Type errors at boot prevent silent integration drift.
>
> | Slot | Phase id | afterPhase | beforePhase | Source file |
> |---|---|---|---|---|
> | … | … | … | … | … |

CC fills the rows as Land 3 advances.

---

## Migration plan + landing details

### Land 1 — type, registry skeleton, conformance test, DebugPanel tab

**Diff scope:**
- New `src/engine/phaseRegistry.ts` (types, `buildPhasePlan`, `runRegisteredPhases` helper).
- New `src/engine/phases/index.ts` (empty registry: `export const ENGINE_PHASES: readonly EnginePhase[] = [];`).
- New `src/engine/__tests__/phaseRegistry.test.ts` (unit tests for topo-sort, cycle detection, duplicate detection, cross-slot detection).
- `runTick` adds 7 `runRegisteredPhases` calls at slot positions. Empty registry → no-op. No behavioral change.
- New `src/components/Game/debug/PhasesDebugTab.tsx` + register `phases` ViewMode.

**Done when:**
- `npm test` green; new `phaseRegistry.test.ts` passes (≥10 cases).
- `npx tsc --noEmit` green.
- `npx vite build` green.
- DebugPanel "Phases" tab opens, shows empty-state copy.
- `npm run cli -- --seed 42 --map medium` → `tick 30; status` matches output from `main` (deterministic regression check).

### Land 2 — canary migrations

**Diff scope:**
- `src/engine/phases/emittedOmenDecay.ts` + `src/engine/phases/reputationDecay.ts` descriptors.
- Add to `ENGINE_PHASES`.
- Delete the two inline calls + their `phaseEventCounts` lines from `runTick`.
- Update `phaseRegistry.baseline.json` (created in Land 2) with the now-non-empty order.
- Update `wiring-checklist.md` sub-table.

**Done when:**
- Equivalence baseline test passes.
- Determinism test passes (`tick 100` byte-identical between this branch and `main`).
- DebugPanel "Phases" tab shows both phases with profile data.

**Why these two first:** `phaseEmittedOmenDecay` has no consumer between it and the next phase (its output `state.emittedOmens` is consumed only by `phaseAgentDecision` later); `phaseReputationDecay` is a self-contained scalar tick. If equivalence breaks, the failure is local and easy to diagnose.

### Land 3 — full migration

**Diff scope:** descriptors for the remaining file-extracted phases per `wiring-checklist.md` § 1. Order per the migration recipe.

**Phases in scope** (about 25, derived from `wiring-checklist.md` § 1):
- `phaseDoom`, `phaseJourneyBeat`, `phaseOmenAgenda`, `phaseComposition`
- `phaseEffectShells`, `phaseEncounterProgressionV2`, `phaseEncounterVisibility`
- `phaseStrategicProjects`, `phaseSlotCaps`, `phaseDisposalTimeout`
- `phaseAgentDecision`, `phaseMovement`, `phaseColocationDetection`
- `phaseDilemmaDetection`, `phaseFamiliarityGain`, `phaseRivalActions`, `phaseStealth`
- `phaseNarrative`, `phaseEssence`, `phaseHiddenMarkDecay`, `phaseIntelligenceDecay`
- `runDivineProximityPhase`, `phaseDivineInfluenceDecay`, `phaseTradeRouteDecay`
- `phaseProsperity`, `phaseEconomicTraits`, `phaseReputationTraits`, `phaseSettlementPromotion`
- `phaseHexState`, `phaseUnrest`, `phaseMagicalSaturation`
- `phaseInfluenceTierPromotion`, `phaseSublocations`, `phaseEconomicChronicle`
- `phaseAmbitionProgress`, `phaseAgentLifecycle`, `phaseMandate`, `phaseDoomExpiry`
- `phaseQuintessence`, `phaseRuinQuestHooks`, `phaseDelveAdmission`, `phaseDelveProgression`, `phaseDelveEmergence`, `phasePlaceOfPowerStreams`, `phaseSecretsFavors`, `phaseFactionActions`

**Phases explicitly out of scope (stay inline):**
- Phase 2a.1 (thread-bind familiarity grant) — reaches into input `state` for previous-tick context.
- Phase 2a.4 (effect tick) — multi-step orchestration with intermediate `effectStates` accumulator and PRNG access.
- Any phase taking the orchestrator-shared `uaRng` instance (`phaseUnifiedActionProgress` is the only one) — keep inline until the registry context is extended.

For phases that take extra args (`phaseUnifiedActionProgress`), the descriptor `run` closes over module-imported constants. If `phaseUnifiedActionProgress` cannot be migrated cleanly because of `uaRng`, leave it inline and note the deferral with `// TODO(THR-XXX): migrate to phase registry once context exposes per-tick rng`.

**Done when:**
- Registry contains every migrable phase from `wiring-checklist.md` § 1.
- `runTick` body is reduced to: setup → slot calls → teardown (target: under 200 lines, down from ~600).
- All tests pass; equivalence baseline updated; deterministic CLI smoke clean.
- `wiring-checklist.md` § 1 reorganised: "Registered phases (declarative)" is the primary sub-section; remaining inline blocks documented in a smaller sub-section labelled "Inline orchestrator blocks (intentional — see THR-238 plan § Phases explicitly out of scope)".

---

## NFP audit

| NFP | Compliance | Note |
|---|---|---|
| 1. Tunability | PASS — no new magic numbers; no game-feel parameters touched. |
| 2. Inspectability | PASS with note — uniformises `tick_phase_profile` emission across all registered phases (today only some emit it). New DebugPanel tab provides direct visibility into registry contents and per-phase tick cost. |
| 3. Determinism | PASS — phases retain their identity and order; topological sort is stable (sorted by `id` for ties to keep order stable across module-load orderings). Equivalence baseline test enforces byte-identical phase order against `main`. |
| 4. Fail-soft | PASS — `runRegisteredPhases` wraps each `phase.run` in try/catch and emits `tick_crash`. Boot-time validation throws (intentional — these are CI errors, not runtime errors). |
| 5. Narrative over mechanical perfection | PASS (N/A) — no narrative impact. |
| 6. Additive over destructive | PASS with note — Land 1 is purely additive (registry is empty). Land 2/3 deletes inline calls only after the descriptor is verified equivalent. The phase implementation files (`src/engine/phaseFoo.ts`) are kept; only the inline `runTick` call is removed. Reversible by reverting the relevant Land's commit. |
| 7. Performance budget | PASS — `runRegisteredPhases` adds a fixed-size loop and one `performance.now()` call per phase. Today's hand-coded `phaseEventCounts[...]` already does the equivalent eventDelta tracking. No measurable per-tick regression expected; the `tick_phase_profile` trace will surface any if it appears. |

---

## Rejected approaches

- ❌ **Single global ordered list (no slots).** Treated all phases as one topo-sort problem. Rejected because the orchestrator has natural anchor points (clock advance, scry resolution, runtime cache rebuild, event-counter resets) that cannot move. Slots make those anchors explicit and prevent the registry from accidentally ordering a phase before runtime cache initialization.
- ❌ **Auto-discovery via filesystem (`import.meta.glob`).** Considered scanning `src/engine/phases/*.ts` automatically. Rejected: filesystem-driven registries are harder to reason about, harder to type-check, and break under bundler tree-shaking. Explicit `index.ts` re-exports are boring and obvious.
- ❌ **Migrate inline blocks (Phase 2a.1, 2a.4) in this issue.** Rejected as scope creep. The registry seam is the deliverable; inline-block extraction is its own design problem (needs a richer `PhaseContext`).
- ❌ **Replace `phaseEventCounts` map with per-phase profile traces in a separate issue first.** Rejected: doing it as part of `runRegisteredPhases` is a free win and doesn't expand scope materially.
- ❌ **Make `EnginePhase` take a `dependencies: string[]` field instead of `afterPhase`/`beforePhase`.** Rejected: directional dependencies are easier to read at the descriptor declaration site. `afterPhase: ['omen_agenda']` reads naturally; `dependencies: ['omen_agenda']` requires the reader to remember the convention.

---

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Equivalence baseline drifts because phase order silently changes when descriptors are reorganized | Medium | The baseline test asserts byte-equal phase id sequence over 10 ticks. Order changes require an explicit baseline update commit. |
| A phase's inline block had implicit ordering with non-registered code (e.g. `prosperityShocks` reset at top of `runTick`) | Low-Medium | Slots are positioned at the same anchor points as today's inline calls. The first-pass migration (Land 2) explicitly canaries this. |
| `runtime`-dependent phases (`phaseUnifiedActionProgress`, `phaseAgentDecision`) prove un-migratable cleanly | Medium | Plan accommodates this — leave them inline and note with a `TODO(THR-XXX)`. The registry doesn't have to be 100% complete to deliver value. |
| Boot-time validation errors look noisy in CI | Low | Error messages name the offending id and list valid alternatives. Test suite covers each error class so regressions catch immediately. |
| Land 3 takes longer than expected because of long-tail phases with quirks | Medium | Each phase migrates in its own commit. CC can stop Land 3 at any point and ship the partial registry. The remaining phases stay inline until later. |

---

## Acceptance criteria

- [ ] `src/engine/phaseRegistry.ts` exists with `EnginePhase`, `PhaseSlot`, `PhaseContext`, `buildPhasePlan`, `runRegisteredPhases`.
- [ ] `src/engine/phases/index.ts` exists with the registry array.
- [ ] `runTick` calls `runRegisteredPhases(s, ctx, slot)` at the 7 slot anchors.
- [ ] `phaseRegistry.test.ts` covers: duplicate id, unknown afterPhase, cycle, cross-slot ref, empty registry no-op, single-phase run, multi-phase topo-sort.
- [ ] `phaseRegistry.equivalence.test.ts` baseline matches `main` for 10 ticks on the seeded world.
- [ ] At least 2 phases migrated (Land 2 canaries) and visible in the DebugPanel "Phases" tab.
- [ ] Land 3: ≥80% of file-extracted phases migrated; remaining phases listed with rationale in `wiring-checklist.md`.
- [ ] `wiring-checklist.md` § 1 has a "Registered phases (declarative)" sub-table.
- [ ] `Fixes THR-238` in the closing commit body, with verification evidence (raw `npm test`, `npx tsc --noEmit`, `npx vite build` output).

---

## Open questions

None. Source council settled the design direction; the open items here are migration-mechanical and resolvable inside CC's session.

---

## Appendix — referenced anchors

- Source council: `Docs/design-councils/2026-04-22-workflow-easier-to-change.md`
- Wiring checklist: `Docs/plans/wiring-checklist.md`
- Memory entry on the recurring failure: `feedback_wiring_verification`
- Coordination protocol: `Docs/plans/2026-04-13-linear-coordination-protocol.md`
- Orchestrator current state: `src/engine/orchestrator.ts:1906–2520ish`
