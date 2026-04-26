# THR-186 — Ambient Agent Phase Caps

**Date:** 2026-04-19
**Author:** Cowork (design/PM)
**Status:** Implementation plan — ready for CC
**Parent:** THR-162 (investigation, Done) → `Docs/plans/2026-04-19-tick-loop-scaling.md` Part 2
**Project:** Repo Health

---

## Problem

On a large map at tick 72 the population reaches ~1010 actors (~800 ambient NPCs, ~200 lifecycle-born "spotlight", ~20 seeded named). Three O(N_all) phases iterate over every actor every tick regardless of spotlight tier:

| Phase | Orchestrator location | Per-agent cost (each tick) |
|---|---|---|
| Effect Tick (Phase 2a.4) | `src/engine/orchestrator.ts` ~line 1834–1863 | `tickEffects()` runs `getOutgoingEdges` on 3 edge types (`possesses`, `bonded_to`, `has_trait`) + resolves agent node + location node |
| Familiarity Gain (Phase 2.75) | `phaseFamiliarityGain` at `src/engine/orchestrator.ts:1370–1424` (called ~line 2025) | `getNode(locationId)` per actor + emits a trace only when on-hex |
| Mastery Trait Decay (Phase 6.626) | `src/engine/orchestrator.ts` ~line 2108–2116 | `processTraitDecay()` does `getOutgoingEdges(id, 'has_trait')` per actor |

With N = 1010: 5k+ graph queries and allocations per tick from these three phases alone. The vast majority are no-ops — ambient NPCs carry no attachments, no mastery traits, and are nowhere near the avatar's hex.

## Goal

Cut per-tick cost of each of the three phases from O(N_all) to O(N_with_property) without changing observable semantics (same effects tick, same decays fire, same familiarity gains happen). The win is moving the filter earlier so we skip the no-op iterations.

## Non-goals

- Don't change `agentLifecycle.ts` spotlight defaulting — that's THR-185.
- Don't change `touchStructure` / encounter cache rebuild frequency — that's THR-187.
- Don't redesign `phaseColocationDetection` — out of scope; note its O(N²) risk for future follow-up.
- Don't refactor graph schema or add an `effectCount` counter node property; use the graph APIs we already have.

---

## Pillars

### Engine — yes (entire change is here)

#### Phase 2a.4 Effect Tick — skip agents with no effect-bearing edges

**Shape.** Before calling `tickEffects(graph, agent.id, ...)`, do a single cheap prefilter that rejects agents whose three candidate edge types are all empty. Prefer implementation (in priority order):

1. **Orchestrator-side filter** — inline check `hasEffectBearingEdges(graph, agent.id)` that returns false when all three `getOutgoingEdges` calls are empty. This pushes the same 3 queries out of `tickEffects` into the predicate — no savings if every agent has at least one of those edge types, but ambient NPCs typically have zero. Net effect: ambient agents pay only the predicate cost (3 lookups that all return empty arrays is very cheap — early termination once any type hits).
2. **Short-circuit inside `tickEffects`** — add a fast-path at the top of `tickEffects` that returns an empty result when all three `getOutgoingEdges` are empty. Equivalent cost, but keeps the orchestrator shape unchanged. Acceptable alternative.

Either approach must preserve: the `agentNode`/`agentLocationNode` resolution at the top of `tickEffects` (line 416–417) is only needed when there are effects to tick, so it can move behind the guard.

**Do not** introduce a new `graph.hasOutgoingEdge` API in this issue. Use existing `getOutgoingEdges`. If profiling after this change shows the predicate is still the hot spot, a graph-level short-circuit can be added in a follow-up.

**Semantic preservation.** `tickEffects` must still be called for any agent that has at least one edge of types `possesses`, `bonded_to`, or `has_trait`. Tests that rely on effect ticking must still pass — see test surface below.

#### Phase 2.75 Familiarity Gain — proximity prefilter

**Shape.** `phaseFamiliarityGain` currently iterates all `actorType === 'individual'` actors and computes on-hex equality. It only *acts* when distance == 0 (same hex). Replace the per-actor hex-equality check with a proximity prefilter using a named constant.

Preferred implementation: **resolve hex once, then iterate only actors in the avatar's hex.**

- If there is an existing hex→actor index (e.g., via `phaseColocationDetection` or encounter-cache bookkeeping), use it. Skim `src/engine/phaseColocationDetection.ts` and `src/engine/encounterCache.ts` to see if one is already available.
- If not, the fallback is: keep the full iteration, but early-continue when `hexDistance(actorHex, avatarHex) > FAMILIARITY_PROXIMITY_HEX_RANGE` (default 0, i.e. only same hex). Note: `hexDistance` requires reading the actor's location → hex, which is the existing cost. This fallback doesn't save much over what the function already does; the win comes from the avatar-hex-first traversal.

If the fallback is the only available path, document why (in the PR) and file a follow-up to add a hex→actor index.

**Constant:**
- `FAMILIARITY_PROXIMITY_HEX_RANGE = 0` (same hex) — preserves today's semantic. Lives in `src/data/agent-behavior-constants.ts` or equivalent nearby.

**Semantic preservation.** Every actor that is on the avatar's hex must still receive `FAMILIARITY_GAINS.proximity * familiarityGainModifier`, must still emit the `familiarity_change` trace, and must still trigger threshold-crossing detection. Actors NOT on the avatar's hex currently receive nothing; that remains true.

#### Phase 6.626 Mastery Trait Decay — skip agents with no mastery traits

**Shape.** `processTraitDecay` already filters by `traitDef.subcategory !== 'mastery'` inside the loop. The win is avoiding the call entirely for agents whose `has_trait` edge list is empty.

Implementation:

1. **Orchestrator-side filter** — before calling `processTraitDecay(graph, agent.id, tick)`, do `if (graph.getOutgoingEdges(agent.id, 'has_trait').length === 0) continue;`. One graph query per agent, returning an empty array for ambient NPCs.
2. **Alternative: short-circuit inside `processTraitDecay`** — return early when the edge list is empty. Functionally identical, less invasive to orchestrator. Acceptable.

**Semantic preservation.** Every agent with at least one `has_trait` edge still runs `processTraitDecay`, which internally filters to `mastery` subcategory. No behavior change for agents that currently decay traits.

### Content — N/A

No content-authoring surface touched. No prose, no encounter templates, no attachment tables. Explicitly marked N/A in the three-pillar audit because performance optimizations on engine phases do not change authoring vocabulary.

### UI — N/A

No player-facing UI change. No alerts, toasts, chronicle entries, HexMapV2 signifiers, DebugPanel views, or player controls affected. A DebugPanel *perf tab* would be nice to have but is explicitly out of scope — file a follow-up if desired.

---

## Constants table

| Name | Default | Location | Purpose |
|---|---|---|---|
| `FAMILIARITY_PROXIMITY_HEX_RANGE` | `0` | `src/data/agent-behavior-constants.ts` (or nearest) | Max hex distance from avatar at which proximity familiarity gain applies. `0` preserves today's same-hex-only behavior; set higher to extend reach. |

No other new constants. The existing `FAMILIARITY_GAINS.proximity` stays unchanged.

NFP #1 (Tunability) satisfied: the one tunable is named; the skip predicates for Effect Tick and Mastery Decay are not tunable (they're correctness equivalences, not balance knobs).

## Tracing

NFP #2 (Inspectability). Emit one summary trace per phase per tick:

```ts
interface TickPhaseProfileTrace {
  tick: number;
  category: 'tick_phase_profile';
  phase: 'effect_tick' | 'familiarity_gain' | 'mastery_decay';
  totalActors: number;     // N_all at phase start
  processedActors: number; // N after predicate
  skippedActors: number;   // totalActors - processedActors
}
```

**Do not** emit per-agent skip traces — that would re-explode the cost we're trying to remove. One aggregate trace per phase per tick is enough to verify the cap is working and debug regressions. Keep existing per-agent traces (e.g. `familiarity_change`, effect-specific traces) unchanged.

## Fail-soft

NFP #4. The three phases currently have mixed fail-soft behavior:

| Phase | Current fail-soft | After change |
|---|---|---|
| Effect Tick (2a.4) | None — uncaught exception propagates | Preserve existing behavior (don't add try/catch — out of scope). |
| Familiarity Gain (2.75) | `return { familiarityMap: state.familiarityMap }` if no avatar hex | Preserve. If the new prefilter throws on an actor (e.g. missing location), `continue` to next actor rather than aborting the phase. |
| Mastery Decay (6.626) | Phase-level try/catch already present | Preserve. Predicate must itself be exception-safe; fall through to calling `processTraitDecay` on any doubt. |

If the hex→actor index lookup throws, log and fall back to the full iteration. Never crash the tick loop.

## Determinism

NFP #3. The predicates are deterministic given the same graph state. No PRNG use. No iteration-order changes that affect observable state (the set of actors whose effects/traits/familiarity tick is unchanged; only the set we *skip* changes, and skipped actors are no-ops by definition).

**Guard:** run `npm run cli -- --seed 42 --map medium` before and after the change. Tick counts, event counts, and doom progress at tick 30 must match exactly.

---

## Test surface

### Unit / contract tests

1. **Effect Tick preserves semantics** (`src/engine/__tests__/`):
   - Agent with `possesses` edge to an attachment carrying `duration` effect → duration ticks down each tick. Expectation: unchanged after the predicate is added.
   - Agent with *no* attachments and *no* mastery traits → `tickEffects` result identical to an empty result. No crash, no trace leakage.
2. **Mastery decay preserves semantics**:
   - Agent with a `mastery` `has_trait` edge past its `decayPeriod` → level decrements (or edge removed at level 0) as today.
   - Agent with only non-mastery traits → `processTraitDecay` is still called (predicate only checks non-empty, not subcategory), no decay fires because of the internal `subcategory !== 'mastery'` filter. Unchanged.
   - Agent with no `has_trait` edges → `processTraitDecay` is not called (predicate rejects). No trace, no mutation.
3. **Familiarity gain preserves semantics**:
   - Actor on avatar's hex → gains `proximity` amount, emits `familiarity_change` trace, crosses threshold correctly.
   - Actor on a different hex → no gain, no trace. Same as today.
   - Actor with no `locationId` → skipped (today's `continue`). Same as today.

### Determinism / perf guard

4. **`run 30` on medium map, seed 42** — identical tick count, identical tick event counts, identical final agent count before and after. Contract test in `determinism.test.ts` or equivalent.
5. **`run 30` on large map via `npm run cli -- --seed 42 --map large`** — measurable wall-clock improvement. Record baseline time before changes (CC should capture this in the implementation PR); post-change must be strictly lower. No precise threshold required for pass/fail — the issue's acceptance criterion is "measurable improvement at N=1010".

### Tracing assertion

6. In one integration test, after `run 5`, query traces with `category: 'tick_phase_profile'` and assert:
   - `skippedActors >= 0.5 * totalActors` on large map (most ambient NPCs should be skipped).
   - `processedActors + skippedActors === totalActors`.

---

## Implementation sequence (suggested)

1. Baseline profile: `npm run cli -- --seed 42 --map large` → `run 30`, record wall-clock + per-phase times using the existing CLI perf output. Attach to the PR.
2. Add `TickPhaseProfileTrace` type + emission helper.
3. Implement Mastery Decay predicate (cheapest/safest win).
4. Implement Effect Tick predicate.
5. Implement Familiarity proximity prefilter (harder — requires probing for hex→actor index).
6. Re-profile with same CLI command, attach before/after to PR.
7. Run full test suite, typecheck, build. Run determinism test specifically to guard NFP #3.
8. Update `Docs/plans/2026-04-19-tick-loop-scaling.md` Part 4 to mark THR-186 resolved, link to PR.

**Rollback plan:** each of the three predicates is independent. If perf regresses on one of them (unlikely but possible — e.g. if the graph's edge lookup is slower than anticipated), revert just that predicate and file a follow-up.

---

## NFP Compliance

| NFP | Status |
|---|---|
| #1 Tunability | **PASS with note** — one new constant (`FAMILIARITY_PROXIMITY_HEX_RANGE`) named; skip predicates are correctness invariants, not balance knobs. |
| #2 Inspectability | **PASS** — one aggregate trace per phase per tick (`tick_phase_profile`), schema defined. Existing per-agent traces preserved. |
| #3 Determinism | **PASS** — predicates are deterministic; no PRNG; no iteration-order change affecting observable state. Determinism contract test guards the invariant. |
| #4 Fail-soft | **PASS** — predicates must not throw; fall back to full iteration on error. Existing phase-level try/catch preserved. |
| #5 Narrative > mechanical | **PASS (N/A)** — no narrative surface touched. |
| #6 Additive > destructive | **PASS** — predicates are additions; existing call paths unchanged for agents that pass the predicate. |
| #7 Performance budget | **PASS** — this is the performance work itself. Before/after profile numbers required in PR. |

## Wiring

| Surface | Touch |
|---|---|
| Orchestrator phase | Existing phases 2a.4, 2.75, 6.626 modified in place. No new phase added. |
| GameState | No new fields. |
| Trace category | New: `tick_phase_profile`. Update `src/debug-bridge.d.ts` / trace type registry if present. |
| UI component | None. |
| Player control | None. |
| Prose pipeline | None. |
| Constants | `FAMILIARITY_PROXIMITY_HEX_RANGE` in `src/data/agent-behavior-constants.ts` (or nearest canonical constants file). |
| Plan doc | This file. |
| `Docs/plans/wiring-checklist.md` | Add `tick_phase_profile` trace to the trace-category list if that list exists. |

---

## Rejected alternatives

- **Add a dedicated `graph.hasOutgoingEdge(id, type)` API for O(1) existence check.** Tempting but premature — `getOutgoingEdges(...).length === 0` is already cheap against the current graph implementation. Revisit if post-change profiling shows predicates themselves are the bottleneck.
- **Cache an `effectCount` / `masteryTraitCount` counter on actor node properties.** Higher maintenance burden (must be incremented/decremented by every edge add/remove path) for a modest additional speed-up. Not justified until profiling shows the edge-existence predicate is the hot spot.
- **Move all three phases inside a single unified "per-agent tick" loop to amortize graph lookups.** Couples three independent concerns and makes the fail-soft story harder. Reject — keep phase boundaries crisp.
- **Switch phases to process only spotlight-tier actors.** Too aggressive — this would skip e.g. ambient NPCs who legitimately acquired an effect. Use property predicates, not tier predicates.

## References

- `src/engine/orchestrator.ts` lines 1834–1863 (Effect Tick), 1370–1424 + 2025 (Familiarity Gain), 2108–2116 (Mastery Decay)
- `src/engine/effectTick.ts` line 404 (`tickEffects`)
- `src/engine/traits.ts` line 124 (`processTraitDecay`)
- `src/engine/visibility.ts` line 32 (`getAvatarHexPosition`)
- `src/lib/hexMath.ts` (`hexDistance`)
- `Docs/plans/2026-04-19-tick-loop-scaling.md` — parent investigation
- `CLAUDE.md` — Non-Functional Priorities, Known Sandbox Limitations
