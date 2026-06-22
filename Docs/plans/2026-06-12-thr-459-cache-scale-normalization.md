> **title:** Cache scale normalization — remove `normalizeLegacyDifficulty` from scoring/forecast/encounter paths (THR-459)
> **linear_issue:** THR-459
> **author:** Cowork
> **created:** 2026-06-12
> **three_pillars:** Engine `done` · Content `N/A — no template, prose, or attachment edits` · UI `N/A — no player-facing or debug surface changes`

# Cache scale normalization — THR-459

*One sentence:* `EncounterCacheEntry.stepDifficulties` is currently a mixed-scale field (0–100 from the unified path, 0–1 from the faction/social paths), and every consumer hides the divergence behind `normalizeLegacyDifficulty`; collapsing the cache to a single 0–1 scale fixes a latent scoring bug, deletes ~80 lines of adapter code, and removes the last `// TODO(THR-419)` from `resolutionService.ts`.

## Why this is load-bearing

`normalizeLegacyDifficulty` was kept alive in Phase 5 (THR-62) as an `@internal` adapter because the encounter cache stored difficulty in the legacy 0–100 scale. That was supposed to be a temporary boundary. In the months since, two new cache producers shipped — `factionQuestGeneration.ts:178` and `socialEncounterGeneration.ts:274–435` — and both store `stepDifficulties` in the raw template scale (0–1, no ×100). The cache field is therefore a **silent type bifurcation**: which scale you get back depends on which producer made the entry.

`encounterScoring.estimateStepProbability` and `plannerForecast.forecastStepProbabilities` both call `normalizeLegacyDifficulty(d)` (÷100) on the cache value. For unified-pipeline encounters that's correct. For faction-quest and social-encounter cache entries the call instead divides an already-normalized value (0–1) by 100, producing 0.000–0.01 difficulty — which means scoring sees faction and social encounters as trivially easy compared to ambient encounters. That bias has been live since faction-quest generation shipped and is not currently surfaced anywhere in tests because every test fixture hardcodes the 0–100 scale.

Picking a canonical scale (0–1 — already the resolver contract) and removing the adapter (a) closes the latent bug, (b) eliminates the `isUATStep ? d : normalize(d)` branch in `encounter.ts`, (c) deletes a function whose existence keeps inviting new misuse, and (d) lets `plannerForecast.ts:345`'s `>= 30` magic threshold become a proper named constant in the same scale as everyone else's difficulty math. The unblock target named in the issue is THR-62 Phase 5 closeout debt; the actual payoff is correctness for two of the game's three main encounter sources.

## Engine pillar

### Systems design

One value, one scale. `EncounterCacheEntry.stepDifficulties: number[]` becomes documented and enforced as **normalized 0–1**, matching the contract `ResolutionInput.difficulty` already uses everywhere downstream.

The migration is a producer-first walk: change every site that *creates* a cache entry to emit 0–1, then change every site that *consumes* the array to read 0–1, then delete the adapter. Tests get updated in the same pass (their fixtures encode the old scale and are now the only thing tying us to it).

No new modules. No new types. No new orchestrator phases. This is a refactor that converges three divergent producers onto a contract that two of them already follow.

### Graph nodes / edges

No graph schema changes. `EncounterCacheEntry` is a cache row, not a graph node.

### Tick phases

No tick-phase ordering changes. The scoring phase (`runEncounterDecisionPhase` in `orchestrator.ts`) reads from `encounterScoring.ts`, which already calls into the shared resolver math via the same code path; the only difference is that the difficulty value handed to `computeOutcomeProbabilities` no longer needs the ÷100 adapter.

### Resolution logic

The resolver math itself (`computeResolutionThreshold`) is unchanged. The change is purely at the caller boundary:

* **Before:** `cache.stepDifficulties[i]` is in 0–100 for unified, 0–1 for faction/social; consumer calls `normalizeLegacyDifficulty(...)` which ÷100; result is 0–1 for unified, 0–0.01 for faction/social (bug).
* **After:** `cache.stepDifficulties[i]` is uniformly 0–1; consumer passes it directly to `computeOutcomeProbabilities({ difficulty: d, ... })`; result is 0–1 for everything.

The single explicit threshold that bakes in the old scale is `plannerForecast.ts:345`:

```ts
// Only push on hard steps (difficulty >= 30, matching runtime's >= 0.3 normalized)
if (entry.stepDifficulties[i] >= 30) {
```

This becomes a named constant `HARD_STEP_DIFFICULTY_THRESHOLD = 0.3` exported from `plannerForecast.ts` (or moved to `src/data/balance.ts` if a near-neighbor constant already lives there — the implementer should check before duplicating). Comparison flips from `>= 30` to `>= HARD_STEP_DIFFICULTY_THRESHOLD`.

### PRNG callouts

No new randomness. The resolver's PRNG handling is unchanged.

### Files to touch

| File | What changes |
|---|---|
| `src/engine/encounterCache.ts` | Line 217 — drop the `* 100`; store `s.difficulty * difficultyMultiplier` directly. Update the comment on line ~216 ("UAT difficulty is 0-1; convert to legacy 0-100 scale for scoring compatibility") to reflect the new contract. Update the JSDoc on `EncounterCacheEntry.stepDifficulties` (~line 107) to explicitly say "normalized 0..1". |
| `src/engine/encounterScoring.ts` | Remove the `normalizeLegacyDifficulty` import on line 50. Remove the call on line 625 — pass `difficulty` directly. (Lines 650 and 910 already pass `stepDifficulties[i]` through helpers that take 0–1; only the names of the locals change.) |
| `src/engine/plannerForecast.ts` | Remove the `normalizeLegacyDifficulty` import on line 43. Remove the call on line 140 — pass `difficulty` directly. Introduce `HARD_STEP_DIFFICULTY_THRESHOLD = 0.3` constant; replace the literal `30` on line 345 and update the inline comment. |
| `src/engine/encounter.ts` | Lines 460–462: remove the `isUATStep` branch and the `normalizeLegacyDifficulty` import on line 26. `normalizedDifficulty` simply becomes `effectiveDifficulty` because UAT, faction, and social paths now all produce 0–1. Verify by tracing every call site that feeds `effectiveDifficulty` into this function. |
| `src/engine/resolutionService.ts` | Delete `normalizeLegacyDifficulty` (lines ~83–85) once `grep -rn normalizeLegacyDifficulty src/` is clean. Delete the related JSDoc on lines 9–14 and the `LEGACY_DIFFICULTY_DIVISOR` constant if it's no longer referenced anywhere. |
| `src/engine/factionQuestGeneration.ts` | Verify line 178 already emits 0–1 (it does) — add an inline comment noting "0..1 scale per EncounterCacheEntry contract" so future readers don't reintroduce the bifurcation. |
| `src/engine/socialEncounterGeneration.ts` | Same verification + comment treatment as `factionQuestGeneration.ts`. Five call sites (lines 274, 309, 343, 377, 411). |
| `src/engine/encounterFilterPipeline.ts` | Line 347 reads `stepDifficulties` for an average. Verify no implicit 0–100 assumption (the value is summed and divided; the absolute scale doesn't matter for ordering, but any downstream threshold against the average would). |
| `src/engine/__tests__/contracts/intel-consumption-liveness.contract.test.ts` | Line 99: change fixture `stepDifficulties: [50]` → `[0.5]`. |
| `src/engine/__tests__/contracts/mark-reveal-liveness.contract.test.ts` | Lines 234, 279: same — `[50]` → `[0.5]`. |
| `src/engine/__tests__/encounterAwareness.test.ts` | Line 36: `[40]` → `[0.4]`. |
| `src/engine/__tests__/encounterCache.test.ts` | Lines 344–363: the `stepDifficulties and stepReaches arrays match template steps` test currently asserts the 0–100 round-trip; rewrite to assert 0–1 round-trip. |
| `src/engine/__tests__/encounterFilterPipeline.test.ts` | Line 54: `[40]` → `[0.4]`. |

The implementer should `grep -rn 'stepDifficulties' src/` once more after the migration to catch any test or helper file added since this plan was written.

### Constants

| Constant | Default | Purpose |
|---|---|---|
| `HARD_STEP_DIFFICULTY_THRESHOLD` | `0.3` | Threshold above which `plannerForecast` considers a step "hard" and evaluates the push modifier. Lives in `plannerForecast.ts` (or `src/data/balance.ts` if that's where similar planner constants already live). |
| `LEGACY_DIFFICULTY_DIVISOR` | (existed; delete) | Defined in `resolutionService.ts`, was used only by `normalizeLegacyDifficulty`. Delete after the function is gone. |

### Tracing

No new trace types. The existing `encounter.scoring.*` and `encounter.resolution.*` traces already record the difficulty value seen by the resolver; their semantics tighten (faction and social difficulty values they emit now correctly reflect the template) but the field names and shapes don't change. No `TraceEvent` interface edits.

### Fail-soft table

| Failure case | Fallback behavior |
|---|---|
| Cache entry built with the old 0–100 value somehow survives (e.g., serialized state from before this change) | The resolver clamps `difficulty` to `[0, 1]` via `Math.max(0, Math.min(1, inputs.difficulty))` in `computeResolutionThreshold`; a stale 0–100 value collapses to `1` (maximally hard), which is conservative — encounters become harder, not impossibly easy. No throw. |
| `stepDifficulties[i]` is `undefined` (missing template step data) | Existing behavior preserved: `estimateStepProbability` and `forecastStepProbabilities` are called with `undefined`, which propagates through the resolver and gets clamped to 0 (treated as trivial). Out of scope to harden further. |
| A test fixture missed in the migration still uses `[40]` or `[50]` | Test fails loudly because the resolver clamps to 1 and the assertion expecting a mid-probability outcome no longer holds. This is the desired loud-failure behavior; the migration walk is the protection. |
| `HARD_STEP_DIFFICULTY_THRESHOLD` import is missing in `plannerForecast.ts` | TypeScript compile error — caught by `npx tsc --noEmit` in the pre-commit checklist. Cannot ship. |

## Content pillar

Content: N/A — no encounter templates, prose tables, attachment content, or world-model data change. This refactor operates entirely on engine-internal cache representation and the resolver-boundary adapter. Encounter template authors will see no API change because templates already use 0–1 difficulty (`ActionStep.difficulty: number` in the 0–1 range); the bug being fixed is downstream of authoring.

## UI pillar

UI: N/A — no player-facing display, notification, debug panel, or HexMap signifier changes. `EncounterCacheView.tsx` reads `stepDifficulties` from the cache for display (per the importer scan, it's one of the 10 consumers); the implementer should verify it formats values as either a percent or a fraction, and update any "× 100" presentation step it does (likely none — but worth a one-line check). If it currently shows a raw number like `45`, that needs to become `0.45` or `45%` after the change to remain meaningful. This counts as a debug-surface verify, not a UI design change.

**Screenshot tool:** N/A — no UI surface changes. The Definition of Done browser-verify requirement is exempt under "types-only refactor / pure-engine refactor verified by tests + typecheck." The implementer must state this exemption in the closing commit body: `Browser-verify exempt: pure engine refactor, no UI render behavior changes, EncounterCacheView spot-check confirmed.`

## Wiring

Per `Docs/plans/wiring-checklist.md`, this change touches no orchestrator phases, no modals, no GameState fields, no trace categories, no player controls. Nothing in the wiring checklist needs an update beyond the implementer confirming the same.

No update to `Docs/plans/2026-04-16-systemic-wiring-guide.md` either — the change does not add or modify a content-facing engine capability; it tightens an internal contract.

## NFP compliance

| # | Priority | Verdict | Note |
|---|---|---|---|
| 1 | Tunability | PASS | `HARD_STEP_DIFFICULTY_THRESHOLD` becomes a named constant; the only magic number introduced is replaced by a name. |
| 2 | Inspectability | PASS | No trace shape changes. Existing scoring/resolution traces remain readable; their values now correctly reflect difficulty for faction and social paths (a strict improvement). |
| 3 | Determinism | PASS | No new PRNG calls. Same seed + same inputs → same outputs. Note: the **outputs themselves change** for faction and social encounters because the bug fix shifts their scoring; this is intentional and within tunable bounds. Any test snapshot that hardcoded the buggy behavior will need a one-line regeneration (none expected — the fixture-only tests use unified-style entries). |
| 4 | Fail-soft | PASS | Resolver clamping (`Math.max(0, Math.min(1, ...))`) makes a missed-migration scale mismatch conservative (encounter becomes hard, not impossible-easy). TypeScript catches missing imports. No throw paths introduced. |
| 5 | Narrative over mechanical perfection | PASS — N/A direction | Pure engine plumbing; no narrative tradeoff. |
| 6 | Additive over destructive | PASS with note | This **is** a destructive change (delete `normalizeLegacyDifficulty`, change a cache field's effective scale). Justified because the old shape is actively producing wrong results, not just sub-optimal results. The note in the closing commit must call this out so future archeologists can find the rationale. |
| 7 | Performance budget | PASS | Removes a function call per scoring/forecast step; net neutral-to-positive on hot path. No new allocations. |

## Vision audit

Cross-checked against `Vision/` premises (read via Obsidian MCP). This change does not touch any Vision premise — it's a numerical-scale hygiene fix on engine-internal cache representation, two layers below anything that could contradict or update a Vision statement. No Vision edit required, no Vision section to flag.

## Rulebook impact

Cross-checked against `Docs/canon/rulebook.md`. This change does not modify any rule of play — turn structure, action verbs, prerequisites, resources, encounters (as authored), clocks, or win/loss conditions are unaffected. The change is below the rule layer. No rulebook update required.

## Done when

- [ ] `grep -rn normalizeLegacyDifficulty src/` returns **no matches**
- [ ] `grep -rn 'stepDifficulties' src/` shows all production sites emitting and consuming 0–1 (a quick reviewer-check, not enforced by tooling)
- [ ] `HARD_STEP_DIFFICULTY_THRESHOLD` exists as a named constant; no literal `30` remains in `plannerForecast.ts` for this purpose
- [ ] `LEGACY_DIFFICULTY_DIVISOR` deleted from `resolutionService.ts`
- [ ] Test fixtures updated to 0–1 scale (5 known files; sweep for any new ones added since)
- [ ] `npm test` green
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vite build` succeeds
- [ ] `npm run check:process` advisory-clean
- [ ] 30-tick CLI smoke: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` reaches tick 30 with no exceptions, non-zero agent count, ≥1 trace/event line. Paste last ~10 lines of `status` output into closing comment.
- [ ] `EncounterCacheView.tsx` spot-checked — if it displayed raw `stepDifficulties` values, the formatting still reads correctly (or has been updated)
- [ ] Closing commit body includes `Fixes THR-459` and the `Browser-verify exempt: pure engine refactor, no UI render behavior changes` line
- [ ] Final assignee comment includes the verification-evidence block (terminal output for `npm test`, `npx tsc --noEmit`, `npx vite build`, and the 30-tick CLI smoke)
- [ ] `// TODO(THR-419)` comment in `src/engine/resolutionService.ts` is gone (it was the cookie crumb pointing here)

## Coordination block

* **Suggested model:** `model:sonnet` — bounded refactor with a producer-first migration walk and a known list of touch points. The trickiest cognitive load is the test-fixture sweep + verifying that the latent bug fix doesn't surface a snapshot regression elsewhere; sonnet handles this size cleanly. Apply matching `model:sonnet` label to the issue.
* **Parallel-safe with:** any work that doesn't touch `src/engine/encounter*.ts`, `src/engine/resolutionService.ts`, `src/engine/plannerForecast.ts`, `src/engine/factionQuestGeneration.ts`, `src/engine/socialEncounterGeneration.ts`, or the encounter test fixtures. Faction-content and social-content authoring (template edits) is safe. UI work is safe. Documentation work is safe.
* **Mutex with:** any in-flight work editing `src/engine/encounterCache.ts`, `src/engine/encounterScoring.ts`, or `src/engine/resolutionService.ts`. Currently none in In Dev for either executor as of this plan's writing.
* **Codex review:** **no** — the latent-bug discovery means the change subtly shifts scoring behavior for two encounter classes. CC should ship and the human reviews the result via the closeout verification block; a Codex review pass would duplicate effort without catching the kind of issue the closeout evidence already surfaces.

## Implementation notes (carry into the working session)

1. **Producer-first migration order matters.** Change `encounterCache.ts` line 217 first, run `npm test` — many encounter-scoring tests will go red because the cache they build now emits 0–1 but the fixtures and consumers still expect 0–100. Fix consumers and fixtures in the same change set; do not commit a half-migrated state.
2. **The latent bug is real, not theoretical.** After the change lands, faction-quest and social encounter selection probabilities will increase relative to ambient encounters because they were previously being scored with difficulty 0–0.01 (trivially easy → low growth-value → previously *under*-selected, depending on which scoring branch dominated). Watch the 30-tick CLI smoke for noticeable distribution shifts; a single-seed shift is fine, a 5× swing in faction-quest selection rate would warrant a tuning note.
3. **`EncounterCacheView.tsx` is the one UI hook to spot-check.** Five seconds with the file open in DebugPanel — if numbers display as 45 or 60 they need to display as 0.45/0.6 (or be formatted as percent). Either fix the formatting in this PR or open a deferral with `// TODO(THR-XXX)` and a Linear issue per the no-orphan-deferrals rule.
4. **Don't grow scope into Phase 5 retune debt.** This is a hygiene refactor; balancing implications are documented as a side-effect, not a goal. If the 30-tick CLI smoke surfaces a meaningful selection-rate shift, file a follow-up issue in Agent Success Redesign — don't tune in this PR.
