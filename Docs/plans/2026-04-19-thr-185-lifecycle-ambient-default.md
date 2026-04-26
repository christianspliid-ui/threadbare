# THR-185 — Lifecycle-born agents default to `ambient`, not `spotlight`

**Date:** 2026-04-19
**Author:** Cowork (design / planning)
**Status:** Ready for Dev handoff
**Project:** Repo Health
**Parent issue:** THR-162 (Tick Loop Scaling — follow-up from 2026-04-19 investigation)
**Type:** Engine bugfix (scoped, tunability-preserving)

---

## Problem

`phaseAgentLifecycle` (births) creates new actor nodes without setting a `spotlightTier`. Downstream filters in `phaseAgentDecision`, `phaseMovement`, and `phaseSlotCaps` treat a missing tier as `'spotlight'` for backward compatibility:

```ts
(n.properties.spotlightTier ?? 'spotlight') === 'spotlight'
```

Consequence: every born agent immediately enters the full decision + movement + slot-cap pipeline. On a `large` map (`?view=game&seeded`), `BIRTH_CHANCE = 0.01` per qualifying location (~584 locations) produces ~5–10 spotlight births per tick. By tick ~72, ~160–190 lifecycle-born spotlight agents have accumulated on top of the ~830–850 initial agents, pushing total decision-eligible agents past ~1000 and crossing the browser frame budget. The stall documented in THR-162 / THR-163 is dominated by this unbounded growth of the spotlight pool, not by the initial seeded count.

Meanwhile, `npcSeeding.ts:245` correctly sets `spotlightTier: 'ambient' as const` on ambient NPCs — so the precedent and mechanism both exist. Only `agentLifecycle.ts` is inconsistent.

## Root cause

`agentLifecycle.ts` lines 232–246 — the `graph.addNode` call for newborns — omits `spotlightTier`. The three filter sites default an absent value to `'spotlight'`:

- `src/engine/phaseAgentDecision.ts:253`
- `src/engine/phaseMovement.ts:61`
- `src/engine/phaseSlotCaps.ts:40,159`

Verified via grep — no other code path writes `spotlightTier` for lifecycle-born agents.

## The fix

Set `spotlightTier: 'ambient'` on the newborn's `properties` bag in `agentLifecycle.ts`. The existing `phaseNpcGraduation` pipeline (`src/engine/npcGraduation.ts`) will organically promote born agents to `spotlight` when they accumulate importance (the currentTier default in `npcGraduation.ts:248` is already `'ambient'`, which confirms the graduation path expects this shape).

No new constants, no new systems, no new edges. One property assignment.

---

## Three-pillar coverage

### Engine (core change)

**File:** `src/engine/agentLifecycle.ts`

Add `spotlightTier: 'ambient' as const` to the `properties` object in the `graph.addNode` call at lines 232–246:

```ts
graph.addNode({
  id: newId,
  type: 'actor',
  name,
  properties: {
    actorType: 'individual',
    axiologicalProfile,
    domainCapabilities: domainCaps,
    locationId: locId,
    narrativeArchetype: archetype.id,
    cooperationStrategy,
    reputationScore: DEFAULT_REPUTATION,
    bornTick: state.tick,
    spotlightTier: 'ambient' as const,   // NEW — organic graduation via phaseNpcGraduation
  },
});
```

**Downstream behaviour (verified, no changes needed):**

| System | File | Behaviour with ambient newborns |
|---|---|---|
| Decision pipeline | `phaseAgentDecision.ts:250-253` | Filter excludes — newborns skip decision tick ✅ |
| Movement | `phaseMovement.ts:58-61` | Filter excludes — newborns don't move until graduated ✅ |
| Slot caps | `phaseSlotCaps.ts:40,159` | Filter excludes — newborns don't participate in cap enforcement ✅ |
| Graduation | `npcGraduation.ts:248` | Already expects `ambient` tier as the promotion source — organic path to spotlight when importance accumulates ✅ |
| Social encounter generation | `socialEncounterGeneration.ts:403-406` | Filters non-spotlight agents unless `factionLinked`. Newborns have no faction at birth → excluded until graduated. **Acceptable** — newborns with no bonds/faction wouldn't produce meaningful social encounters anyway, and the graduation pipeline handles their promotion once they accumulate social edges. |
| Effect tick, mastery decay, familiarity (O(N) phases) | Various | Already iterate over all actors regardless of tier — unchanged behaviour. THR-186 already added early-exit predicates for these (done 2026-04-19, commit `5ab98a08`). |
| Aging / death | `agentLifecycle.ts` death pass | Tier-agnostic — ambient newborns can still die and graduate normally ✅ |

**Edge case check — already-in-flight worlds:** existing saves won't have the new property on pre-fix newborns. The `?? 'spotlight'` fallback means those agents stay spotlight forever, which is the current (broken) behaviour — no regression. New saves get the correct tier from tick 0 of lifecycle operation. No migration needed.

**No new tuning constants.** The fix preserves all existing tunable numbers (`BIRTH_CHANCE`, `BIRTH_DENSITY_THRESHOLD`, graduation thresholds). It aligns `agentLifecycle.ts` with `npcSeeding.ts` behaviour — a consistency fix, not a new lever.

### Content (N/A — with rationale)

No content changes. No encounter templates, prose tables, attachment tables, or data files are touched. Born agents already have no bonds, no artifacts, no reputation — so no content surface references them by default. Once graduated via `phaseNpcGraduation`, they enter the normal content pipeline exactly as they would today.

### UI (verification surface only)

No UI changes required for the fix to work end-to-end. Two verification surfaces already exist and cover this:

- **Debug Panel** — `spotlightTier` is already visible in the agent inspector (spotlight/notable/ambient badge). CC should spot-check a handful of newborn agents via Debug Panel during verification and confirm the badge reads `ambient`.
- **HexMapV2 agent signifiers** — already render ambient NPCs at reduced visual weight (smaller dot, no label unless zoomed). Newborns will inherit this automatically. No new signifier code needed.
- **CLI inspection** — `agent <name>` in `npm run cli` prints `spotlightTier` in the property dump. Spot-check after a lifecycle tick.

If CC finds the Debug Panel inspector does *not* currently show `spotlightTier` on an agent, that is a separate trivial fix (add one row to the property table) and should be landed in the same PR as part of the verification step.

---

## Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Touched? | Notes |
|---|---|---|
| Orchestrator phase | No | `phaseAgentLifecycle` is already wired (orchestrator.ts:2286). Only the property being set inside changes. |
| GameState field | No | `spotlightTier` is an existing actor property. |
| UI component | No | Debug Panel agent inspector already renders the property (verify during QA). |
| Trace category | No | Existing lifecycle traces (`agent_born`) already capture newborn id; tier is derivable from graph state. Optionally: add `spotlightTier: 'ambient'` to the born-agent trace payload for easier filtering — nice-to-have, not required. |
| Debug bridge | No | `window.__DEBUG.gotoAgent` already works for born agents. |
| Player controls | No | No player-facing change. |

---

## Constants table (NFP #1)

No new constants. Affirming that `BIRTH_CHANCE = 0.01` and `BIRTH_DENSITY_THRESHOLD = 3` remain the only lifecycle tunables.

## Tracing (NFP #2)

No new trace types. Existing `agent_born` trace is sufficient. Optional additive enrichment: include `spotlightTier` in the trace payload. Existing `TickPhaseProfileTrace` (added under THR-186) already captures per-phase timings, which is how CC should verify the filter exclusion is producing the expected speedup — `phaseAgentDecision` and `phaseMovement` totals should plateau rather than grow with tick count.

## Fail-soft (NFP #4)

| Failure case | Fallback |
|---|---|
| `phaseAgentLifecycle` throws mid-creation (e.g. graph addNode fails) | Existing try/catch in orchestrator — no change |
| `phaseNpcGraduation` never promotes a born agent | Agent stays ambient forever. Acceptable — graduation is importance-driven, so an agent with no importance accumulation is correctly ambient. |
| Legacy saves / agents without `spotlightTier` | `?? 'spotlight'` fallback keeps legacy behaviour (current bug preserved for legacy entities only — no regression in new worlds) |
| Born agent's `bornTick` needed for age math but tier property accidentally omitted in the edit | Typecheck catches it — `spotlightTier` is a keyed property in the actor properties type |

## Determinism (NFP #3)

Unaffected. The change is purely a static property assignment — no PRNG consumption, no ordering impact. Same seed + same map produces identical newborn properties (the only new field is a constant string literal).

---

## Acceptance criteria (from the Linear issue)

1. **Lifecycle-born agents have `spotlightTier: 'ambient'` in their node properties.**
   Verify via: `eval Object.values(state.graph.nodes).filter(n => n.type === 'actor' && n.properties.bornTick > 0).map(n => n.properties.spotlightTier)` in CLI — all results should be `'ambient'`.
2. **`phaseAgentDecision` and `phaseMovement` no longer include raw lifecycle births.**
   Verify via: `TickPhaseProfileTrace` after 100 ticks with lifecycle active — `phaseAgentDecision` agent-count totals should plateau near the seeded spotlight count + organically graduated agents, not grow linearly with tick.
3. **Agent lifecycle tests still pass.** `npx vitest run src/engine/agentLifecycle.test.ts` (or whatever the current test file is — Grep for the lifecycle tests).
4. **Browser `?view=game&seeded` runs past tick 72 without stalling (or stall threshold increases meaningfully).** Acceptance bar: survive at least tick 150 on `large` map in dev build. If the stall simply moves later (e.g. to tick 200), that is still a pass for THR-185 — THR-187 (encounter cache rebuild frequency) is the next bottleneck and is filed separately.

## Non-acceptance / out of scope

- Changing graduation thresholds — out of scope. Graduation tuning is a separate concern.
- Changing the legacy `?? 'spotlight'` default in the three filter sites — intentionally preserved for backward compat with pre-fix saves. Only the newborn write is changed.
- Changing `npcSeeding.ts` — already correct.
- Removing `socialEncounterGeneration.ts` tier filter — deliberately retained; ambient newborns with no faction are correctly excluded from social encounter generation.
- Re-tuning `BIRTH_CHANCE` — no. The fix solves the pipeline-inclusion bug, not the birth rate itself. If post-fix births still feel too high, that's a separate tuning issue.

---

## Test plan for CC

1. **Unit / integration:**
   - `npx vitest run src/engine/agentLifecycle.test.ts` — green.
   - `npx vitest run src/engine/npcGraduation.test.ts` — green (confirms graduation still promotes `ambient` → `spotlight`).
   - Full suite: `npm test` — green (or at least no new failures vs main baseline).
2. **Typecheck + build:** `npx tsc --noEmit` and `npx vite build` — both clean.
3. **CLI smoke:**
   ```
   npm run cli -- --seed 42 --map medium
   run 100
   eval Object.values(state.graph.nodes).filter(n => n.type === 'actor' && n.properties.bornTick > 0).length
   eval Object.values(state.graph.nodes).filter(n => n.type === 'actor' && n.properties.bornTick > 0 && n.properties.spotlightTier === 'ambient').length
   ```
   Both counts should match (every newborn is ambient). Compare tick-loop cost before/after via `traces` — `phaseAgentDecision` per-tick cost should be lower post-fix.
4. **Browser smoke (user-driven or CC in Chrome):**
   - `?view=game&seeded` (large map)
   - Let it run to tick 100+ without stalling
   - Open Debug Panel → inspect a couple of agents with `bornTick > 0` → confirm `spotlightTier: ambient`
5. **Stall threshold regression check:**
   - Record tick number where frame budget first breaches 16ms (or where the browser first feels sluggish). Post-fix this should be >= 150 on large map. Current baseline: ~72.

---

## References

- `Docs/plans/2026-04-19-tick-loop-scaling.md` — parent investigation (Part 4, THR-185 entry)
- `src/engine/agentLifecycle.ts:232-246` — the site of the fix
- `src/engine/npcSeeding.ts:245` — precedent: ambient NPCs correctly set `spotlightTier: 'ambient'`
- `src/engine/npcGraduation.ts:248` — graduation default expects `ambient` source
- `src/engine/phaseAgentDecision.ts:250-253`, `phaseMovement.ts:58-61`, `phaseSlotCaps.ts:40,159` — downstream filters that exclude non-spotlight agents
- `src/engine/socialEncounterGeneration.ts:403-406` — faction-or-spotlight gate (newborns correctly excluded until graduated)

---

## NFP compliance summary

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | No new numbers, no hardcoded logic. A one-field property alignment. |
| 2. Inspectability | PASS | Existing `agent_born` trace, Debug Panel agent inspector, CLI `agent <name>` all surface the tier. Optional: enrich born trace with `spotlightTier` field. |
| 3. Determinism | PASS | Static property assignment, no PRNG impact. |
| 4. Fail-soft | PASS | Legacy `?? 'spotlight'` fallback preserves old-save behaviour. Newborns fail to a safer default (ambient = excluded from heavy phases). |
| 5. Narrative over mechanical | PASS with note | Narrative loss is near-zero: newborns with no bonds, artifacts, or reputation don't generate meaningful story threads anyway. They earn their way into the spotlight via graduation when they accumulate importance — arguably *more* narrative. |
| 6. Additive over destructive | PASS | One-line addition to a property bag. No refactor, no field removals, no signature changes. |
| 7. Performance budget | PASS | The whole point of the fix is to respect the spotlight-tier budget. Lifecycle-born agents stop inflating the O(N_spotlight) phases. |
