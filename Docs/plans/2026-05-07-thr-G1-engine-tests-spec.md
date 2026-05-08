---
status: current
title: THR-343 (G1) — Encounter Engine Test Hardening Spec
date: 2026-05-07
linear: THR-343
parent_plan: 2026-05-05-encounter-ui-implementation-phasing.md
audience: codex
---

# THR-343 (G1) — Encounter Engine Test Hardening Spec (2026-05-07)

**Status:** Tightened Codex spec for THR-343 (Phase G1). Sharpens the phasing-plan §3 G1 entry and design-plan §12 "Engine unit tests" + "Engine integration tests" lists into a binary, file-list-anchored execution plan suitable for Codex pickup.

**Audience:** Codex executor.

**Inputs (read these first):**

- Phasing plan: `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §3 Phase G1
- Design plan: `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §3 (Engine pillar), §7 (Constants), §8 (Tracing), §9 (Fail-soft table), §12 (Test strategy)
- Constants file: `src/data/encounter-experience-constants.ts`
- Trace types: search for `EncounterUITraceKind` (or equivalent union introduced by THR-351)
- Existing engine tests in `src/engine/encounters/__tests__/` and `src/engine/__tests__/`
- Existing contract-test pattern: `src/engine/__tests__/contracts/encounter-lifecycle.contract.test.ts`, `encounter-liveness.contract.test.ts`

**Why this spec exists.** The phasing-plan G1 entry lists modules and integration scenarios but leaves "fill coverage gaps" undefined. Codex needs binary acceptance — this spec pins each gap to a concrete missing-test scenario, names every file path, and removes design judgment from the implementation. All Phase B engine modules have shipped; this ticket is pure test authoring against existing surfaces.

---

## 1. Goal and scope

Harden engine test coverage for Phase B encounter modules. Every public function gets at least one happy-path test and one fail-soft test. Five named integration tests land in a new contract-test file. CLI smoke test added to the pre-commit checklist.

**Output:**

1. New contract test file: `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` containing the five integration tests.
2. Coverage extensions to seven existing unit-test files (see §3 below).
3. CLI smoke-test assertion added to the contract file (test that the CLI tick-30 path produces non-empty `encounters` output via `runTick` directly — does not shell out).
4. All new tests pass cleanly under `npm test`; full suite ≤ 60s.
5. `npx tsc --noEmit` clean; `npx vite build` clean.

**Out of scope:**

- UI snapshot tests (those are G2 / THR-344).
- Content lint tests (those are G3 / THR-345).
- New engine functionality. If a test scenario can't be expressed against the existing module, **stop and bounce back to Cowork** — do not change module code.
- Performance benchmarks. Any test running >1.5s should be split or simplified.
- Tests that require a real game-init or a real WorldGraph instance — use minimal hand-built graph fixtures.

---

## 2. Phase B modules under test (verify paths after pickup)

The Cowork worktree at spec time was at commit `0a3bf034`, which lags `main`. **First action after `/pull-work`:** `git pull origin main` then verify each path below exists. Closeout comments on shipped tickets reference the canonical paths.

| Module | Path (canonical, per Linear closeout) | Existing test file | Linear ticket |
|---|---|---|---|
| Choice resolution | `src/engine/encounters/choiceResolution.ts` | `src/engine/encounters/__tests__/choiceResolution.test.ts` | THR-321 (B1) |
| Drift accumulator | `src/engine/encounters/driftAccumulator.ts` | `src/engine/encounters/__tests__/driftAccumulator.test.ts` | THR-321 (B1) |
| Outcome forecast | `src/engine/encounters/outcomeForecast.ts` | `src/engine/encounters/__tests__/outcomeForecast.test.ts` | THR-324 (B2) |
| Hand filter | `src/engine/encounters/handFilter.ts` | `src/engine/encounters/__tests__/handFilter.test.ts` | THR-325 (B3) |
| Detection pressure | `src/engine/encounters/detectionPressure.ts` (+ `src/engine/orchestrator/phaseDetectionPressure.ts`) | likely `src/engine/encounters/__tests__/detectionPressure.test.ts` | THR-326 (B4) |
| Encounter template graph | new node types in `src/types/graph.ts`; traversal helpers likely in `src/engine/graphQueries.ts` or new file | not yet sure — discover via grep `gates_to\|spawns_from\|enables` | THR-327 (B5) |
| Aftermath effects (incl. `archetype_drift_register`) | `src/engine/encounterAftermath.ts` | `src/engine/__tests__/encounterAftermath.test.ts`, `encounterAftermath.worldShaping.test.ts`, `encounterAftermath.resolveContext.test.ts` | THR-328 (B6) |
| Callback eligibility | `src/engine/callbackEligibility.ts` | `src/engine/__tests__/callbackEligibility.test.ts` | THR-329 (B7) |
| Item consumption | `src/engine/encounters/itemConsumption.ts` | `src/engine/encounters/__tests__/itemConsumption.test.ts` | (shipped earlier) |

If a module's path or test file path differs from the table after `git pull origin main`, **follow what's actually on disk** — the closeout comments are authoritative for path intent but Codex should verify.

---

## 3. Unit-test coverage gaps to close

For each module, add the listed missing scenarios to its existing test file. **Do not duplicate scenarios already present** — read the existing test file first, only add what's missing.

### 3.1 `choiceResolution.test.ts`

Add (only if not already present):

- **Trace emission:** `resolveEncounterChoice` returns/emits `choice_resolved` trace (or whatever the Phase A2 trace union calls it) with the rolled d100, outcome band, and committed `agentId` + `encounterId`. Assert trace shape, not just trace count.
- **Fail-soft NaN probability:** `effectiveProbability: NaN` resolves without throwing; outcome band falls to lowest tier; trace emitted with `outcomeBand: 'critical_failure'` (or whatever the lowest enumerated tier is).
- **Fail-soft missing reach (per design §9 row 1):** commit with `reach: undefined` (or invalid value) defaults internally to `'iron'`, logs a `console.warn`, returns valid resolution. Use `vi.spyOn(console, 'warn')` to assert the warning fires.
- **Fail-soft missing moral_axis_pole (per design §9 row 2):** drift not applied, no throw, resolution proceeds.

### 3.2 `driftAccumulator.test.ts`

Add (only if not already present):

- **Threshold crossing fires effect:** call `applyDrift` repeatedly until cumulative drift on one axis crosses the `DRIFT_THRESHOLD_MAJOR` constant (read it from `encounter-experience-constants.ts`). Assert next call produces a queued `archetype_drift_register` aftermath effect (or returns a flag indicating the crossing).
- **Decay-to-zero:** apply drift, then run decay phase enough ticks to bring drift below `DRIFT_DECAY_FLOOR` (read constant). Assert drift clamps to zero and no spurious threshold-crossing events fire.
- **Multi-axis interleave:** apply drift on Iron axis then Heart axis; assert each axis tracks independently, no cross-contamination.
- **Overflow clamp (per design §9 row 11):** push drift past +1.0 in one application; assert clamped to ±1.0.

### 3.3 `outcomeForecast.test.ts`

Add (only if not already present):

- **5-tier band boundaries:** for each of the five tiers (verify enum names from the module), call the forecast function with inputs that should produce a band exactly at the tier boundary on each side. Assert the boundary maps to the expected tier (no off-by-one). Five boundary tests, one per tier.
- **No numeric strings in factor list:** call the forecast function and assert each string in the returned factor list does not match `/\d/` (numbers leak into player-visible prose — explicitly disallowed by design plan §5.2).
- **Empty factor list (per design §9 row 4):** input that produces no factors returns the qualitative tier alone — assert factor list is `[]` and tier is non-null.
- **Out-of-range band (per design §9 row 5):** input that would produce a band outside the enumerated tiers gets clamped to the nearest valid tier.

### 3.4 `handFilter.test.ts`

Add (only if not already present):

- **Full cascade:** assemble a scene with 7+ candidate cards. Each filter level (target match → cost → sphere → bond → place gating) eliminates known cards. After cascade, assert exactly the expected subset remains. This is one comprehensive test, not five.
- **Dim-vs-hide differentiation:** assert that cards failing a "soft" filter (e.g., insufficient essence) are returned with a `dimmed: true` flag (or whatever the contract uses), while cards failing a "hard" filter (wrong target type) are omitted entirely.
- **Empty hand fail-soft:** input with zero candidate cards returns `[]` without throwing.

### 3.5 `detectionPressure.test.ts`

After `git pull` confirms the file path, add (only if not already present):

- **Cross-phase decay:** advance pressure, then run the decay phase via `phaseDetectionPressure` for `DETECTION_PRESSURE_DECAY_TICKS` (read constant). Assert pressure decreases monotonically and reaches floor at expected tick.
- **One-shot fire idempotency:** raise pressure to ≥1.0; advance two ticks; assert exactly one `detection_threshold_crossed` trace and exactly one rival-detection encounter seed queued total (not two).
- **Overflow clamp (per design §9 row 12):** apply enough pressure to push past 1.0; assert clamped to 1.0; assert no re-firing on subsequent push attempts at saturation.

### 3.6 `encounterAftermath.test.ts` (extend in-place)

Add (only if not already present):

- **`archetype_drift_register` effect kind dispatch:** craft an aftermath payload of kind `archetype_drift_register`; call the dispatcher; assert it routes to the new handler added in B6, not the unknown-effect fallback.
- **Unknown effect kind fail-soft (per design §9 row 6):** payload with effect kind `'made_up_kind' as never`; dispatcher logs a warning, skips that effect, processes remaining effects. Spy on `console.warn`.

### 3.7 `callbackEligibility.test.ts`

Add (only if not already present):

- **Author-pin override:** input with `authorPinnedEventIds` returns those events first, in authored order, even when graph-derived scoring would rank others higher.
- **Empty event history fail-soft (per existing closeout note):** confirmed already covered — skip.

### 3.8 `itemConsumption.test.ts`

Add (only if not already present):

- **Atomic removal before aftermath:** consume an item via the choice path; assert the item leaves the actor's `possessions` graph edge before any aftermath effect handler is called (sequence assertion via mock-ordering or graph-snapshot diff).
- **Item-not-in-possessions fail-soft (per design §9 row 17):** attempt to consume an item the actor doesn't own; engine logs warning; choice resolution proceeds without consumption; no throw.

---

## 4. Integration tests — new file

Create `src/engine/__tests__/contracts/encounter-experience.contract.test.ts`. Follow the structure of existing contract tests (e.g., `encounter-lifecycle.contract.test.ts`): top-level `describe('encounter-experience contract')`, one `describe` block per scenario, minimal setup helpers in a `helpers` section at the top of the file.

The five tests below are mandatory. Each must assert the **observable outcome via traces or graph state**, not module internals.

### 4.1 Full-pipeline encounter run-through

**Setup:** Build a minimal `GameState` with one ascendant agent, one threaded NPC, one encounter template with two beats and one choice each.

**Exercise:** Commit choice on beat 1 → advance tick → commit choice on beat 2 → advance tick (aftermath phase).

**Assert:**
- Both `choice_resolved` traces emitted (one per beat) in order.
- Aftermath traces emitted for beat 2's effects.
- Encounter status transitions to `'resolved'` (or whatever the closed state is) on the agent's GameState.
- Drift accumulator has at least one non-zero entry on the agent.

### 4.2 Drift threshold crosses → aftermath effect fires

**Setup:** Agent with drift accumulator pre-loaded to `DRIFT_THRESHOLD_MAJOR - 0.01` on Iron axis.

**Exercise:** Commit one Iron-axis choice with `driftMagnitude: 0.05`.

**Assert:**
- Drift on Iron axis crosses threshold.
- An `archetype_drift_register` aftermath effect appears in the queue/applied list with the correct axis and tier payload.
- Trace emitted with shape consistent with §8 of design plan.

### 4.3 Detection threshold → rival-detection encounter seed

**Setup:** Region with detection pressure at `DETECTION_THRESHOLD - 0.01`.

**Exercise:** Apply enough pressure-bump to cross 1.0 → run `phaseDetectionPressure` once → run encounter-seed-emission phase once.

**Assert:**
- Exactly one `detection_threshold_crossed` trace.
- Exactly one rival-detection encounter seed queued for that region's encounter pool.
- A second tick produces no new seed (one-shot fire — clamping at 1.0 prevents re-firing).

### 4.4 Item-consuming choice atomically removes item

**Setup:** Agent with one consumable item I in possessions. Encounter beat with one choice card carrying `consumes_item: I.id`.

**Exercise:** Commit the choice.

**Assert:**
- Item I removed from agent's `possessions` (graph edge gone) **before** any aftermath effect handler runs. Implementation hint: mock or spy on the aftermath dispatcher and assert possessions delta has already happened at first call.
- One `item_consumed` trace (or whatever the existing trace name is — discover from `itemConsumption.ts`).
- A second commit on a now-itemless choice fails-soft per §9 row 17 (warning, no throw).

### 4.5 Encounter `gates_to` unlocks downstream encounter

**Setup:** Two encounter-template graph nodes A and B. A has edge `gates_to → B`. B is initially in agent's `ineligible-encounters` set (or absent from eligible set, depending on B5 implementation).

**Exercise:** Agent completes A with a non-failure outcome → run encounter-eligibility computation (whichever phase recomputes the eligible set).

**Assert:**
- B is now in the agent's eligible-encounters set.
- A second agent who has not completed A still does not see B as eligible (per-agent gating).

### 4.6 Hand filter cascade with realistic scene context (CLI-level smoke)

**Setup:** Full scene context: 4 cast members (mix of allies, neutrals), one place node with `places.tavern` subtype, two factions present, agent with limited essence, one bond active.

**Exercise:** Call `filterAscendantHand` (or the canonical filter entrypoint) with the realistic scene + agent's full action template list.

**Assert:**
- Filter elimination order matches design plan §3.4: target → cost → sphere → bond → place. Tracked via filter-stage telemetry if exposed; otherwise assert the count of cards remaining at each stage matches expected by counting eliminations bucket-by-bucket.
- Non-empty result (≥1 card remains for a reasonable scene).
- No card with `requires_place: 'temple'` survives a tavern scene.

### 4.7 (Bonus, not gating) CLI smoke equivalent

In the same contract file, add one final test that calls `runTick` directly 30 times on a seed-42 medium-map game state and asserts:
- No throws across 30 ticks.
- At least one encounter is created/resolved over the 30-tick window (the `encounters` CLI command surfaces this — query equivalent state directly).
- Final tick's GameState passes the existing graph-validity check (whatever validator the codebase already exports).

This is a **smoke test**, not a deep assertion — it ensures the engine doesn't crash on a representative run. Keep it under 1.5s.

---

## 5. Trace assertions (NFP #2 — Inspectability)

Per design plan §8, the encounter UI introduces traces. Each Phase B module emits at least one trace per relevant event. The G1 tests must assert trace shape (not just count) for:

- `choice_resolved` (B1) — payload has `agentId`, `encounterId`, `beatIndex`, `outcomeBand`, `rolledD100`.
- `drift_threshold_crossed` (B1) — payload has `agentId`, `axis`, `previousTier`, `newTier`.
- `forecast_computed` (B2) — payload has `agentId`, `encounterId`, `tier`, `factors`.
- `detection_threshold_crossed` (B4) — payload has `regionId`, `previousPressure`, `newPressure`.
- `archetype_drift_register` (B6) — payload has `agentId`, `axis`, `tier`.

Trace names above are intent — verify against the actual Phase A2 trace union (THR-351 closeout). If a name differs, follow what's in the code.

**How to assert.** The existing tests use the engine's trace buffer (search `traceBuffer` or `getTraces`). Mirror that pattern. Do not introduce new trace utilities.

---

## 6. CLI / pre-commit verification

Codex's commit must include verification evidence per CLAUDE.md "Definition of Done" — the closing comment includes raw output for:

```
npm test                     # full suite, all green
npx tsc --noEmit             # type-check clean
npx vite build               # production build green
```

Plus, paste the running time of `npm test` to confirm the ≤60s budget is held.

If `npm test` exceeds 60s after this work, Codex should bisect with `npx vitest run <single-file>` to find the slow new tests and split or simplify them. Do not let the suite drift past 60s.

---

## 7. NFP compliance

| NFP | How this work satisfies |
|---|---|
| #1 Tunability | Tests read thresholds from `encounter-experience-constants.ts`, not hard-coded duplicates. PASS. |
| #2 Inspectability | Trace assertions on every Phase B emission point (§5). PASS. |
| #3 Determinism | All tests use `constantPrng` or seeded values — no `Math.random`. Mirror `choiceResolution.test.ts` pattern. PASS. |
| #4 Fail-soft | Each module gets at least one fail-soft test from the §9 fail-soft table (§3 above maps each row that's still uncovered to a test). PASS. |
| #5 Narrative-first | N/A — test-only work. |
| #6 Additive | All work in test files; no source-file edits. PASS. |
| #7 Performance budget | ≤60s suite budget enforced; per-test ≤1.5s. PASS. |

---

## 8. Coordination block (for the Linear comment)

```
Plan doc: Docs/plans/2026-05-07-thr-G1-engine-tests-spec.md
Parent plan: Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md §3 Phase G1
Parallel-safe with: G2 (THR-344, in Idea), G3 (THR-345, in Codex queue)
Mutex with: none — pure test code, no source edits
Codex review: no (test code; review via diff + green CI)

Files to touch
- src/engine/__tests__/contracts/encounter-experience.contract.test.ts (new)
- src/engine/encounters/__tests__/choiceResolution.test.ts (extend)
- src/engine/encounters/__tests__/driftAccumulator.test.ts (extend)
- src/engine/encounters/__tests__/outcomeForecast.test.ts (extend)
- src/engine/encounters/__tests__/handFilter.test.ts (extend)
- src/engine/encounters/__tests__/detectionPressure.test.ts (extend; verify path after git pull)
- src/engine/encounters/__tests__/itemConsumption.test.ts (extend)
- src/engine/__tests__/encounterAftermath.test.ts (extend)
- src/engine/__tests__/callbackEligibility.test.ts (extend; verify path after git pull)

Done when
- [ ] All §3 unit-test gaps filled (only those not already present in the existing files — read first, then extend)
- [ ] All §4 integration tests (4.1–4.6 + 4.7 smoke) implemented in the new contract file
- [ ] All §5 trace shape assertions present in the relevant tests
- [ ] `npm test` green, full suite under 60s wall-clock
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vite build` clean
- [ ] No source-file edits under src/engine/encounters/*.ts or src/engine/encounterAftermath.ts or src/engine/callbackEligibility.ts (test-only ticket; if a test can't be written, bounce back to Cowork rather than mutating source)
- [ ] Commit body includes `Fixes THR-343`
- [ ] Verification evidence (raw `npm test` / `tsc` / `build` output, including suite runtime) pasted into the closeout comment
```
