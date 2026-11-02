---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-11-02 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 0 new, 9 standing confirmed by reading, 6 carried, 8 resolved (THR-2049 shipped), 1 standing fell; 8 re-export shims (1 newly found), not dead coverage
slowFilesReported: 10
duplicatedFindings: 1 (structural, report-only)
ticketsFiled: 1 (THR-2131)
---
# Test-suite health — weekly pass, 2026-11-02

Thirteenth run of the duty (THR-942). The previous pass was [2026-10-26](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-10-26.md).

**Suite (required projects only): 1720 files, 26038 tests, all passed, 0 failed, 0 skipped.** Run: `npx vitest run --project node --project node-isolated --project dom --reporter=json` against the home tree at `2526793c`. Summed file time **452.7s**, wall time 131s. The import graph was built at `origin/main` `98de22a3`; the three commits between the two SHAs are docs-only (two plan docs and the plans index), so the code measured is the same. Other detectors may have been running at the same time, so durations may be inflated. The run printed esbuild "duplicate key" warnings for test fixtures in `agendaGenerator.test.ts` and `decayCurve.test.ts`; these are warnings, not failures.

Same method as last week: no `heavy` project locally (THR-2003). Heavy cost comes from CI (§ 2a).

## 1. Dead-coverage candidates

Method: an import graph at `9cfae007` (last week's main) and `98de22a3`, built from `git ls-tree` + `git cat-file` over `src/`, `scripts/` and root configs. Edges: static, re-export, side-effect, dynamic `import()`, `vi.mock`, `require`, and `new Worker(new URL(...))` (last week's blind spot, now parsed). `.ts`/`.tsx`/`.js→.ts` and `index.*` resolution. Importers that use `import type` only are counted apart and treated as not live. Test-only modules (`src/testing/`) and entry points excluded. Every hit then checked by hand with `git grep`.

```
new test files since 9cfae007:                     56
subject edges examined:                            469
unique subjects:                                   235
subjects with ZERO runtime production importers:   5 raw → 0 after reading the imports
modules that lost reachability since 9cfae007:     0
```

### New candidates

**None.** The five raw hits all fell:

- `types/attention.ts`, `types/chapterRecord.ts`, `types/omen.ts` and `engine/views/subjects/subjectTypes.ts` export only types, and the new tests import them with `import type` (trap 2).
- `components/Game/ascendant-bar/selectors.ts` is a one-line `export *` shim over `engine/views/subjects/godSheet.ts` (THR-1876). See the shim table below.

### Resolved since last week: THR-2049

[THR-2049](https://linear.app/threadbare/issue/THR-2049/eight-modules-have-tests-but-no-production-caller-delete-each-with-its) shipped (PR #2592, merge `fb76e287`). All eight modules are gone from `main`: `engine/stealth.ts` (and `types/stealth.ts`), `engine/lakeGeneration.ts`, `engine/actionCandidates.ts`, `engine/socialOutcome.ts`, `components/Game/NarrativeFeed.tsx`, `components/Game/AttachmentRow.tsx`, `engine/encounters/relationshipResolver.ts`, `HexMapV2/scene/fogShader.ts`, with their only-covering tests. The follow-up THR-2050 (`92164e67`) deleted the knobs those modules were the only readers of. No other module lost its last importer as a side effect (reachability diff is empty).

### Standing modules read one by one (promised last week)

Last week these ten were checked only by module-path grep. This week every runtime export was grepped by name across `src/` and `scripts/`, and every importing test's other subjects were listed.

| Module | Evidence | Test (last touched) | Verdict |
|---|---|---|---|
| `engine/callbackEligibility.ts` | `getCallbackCandidates`: 0 non-test refs | `callbackEligibility.test.ts` (2026-05-07) | Dead with tests |
| `engine/controlContestationResolver.ts` | All 9 exports: 0 non-test refs | `controlContestationResolver.test.ts` (2026-03-30) | Dead with tests |
| `engine/encounters/generateEncounterCandidates.ts` | `generateGraphEncounterCandidates`: 0 refs. The only mention is a comment in `unifiedCandidates.ts:5`, which says it was merged in | `generateEncounterCandidates.test.ts` (2026-05-07) | Dead with tests |
| `engine/hexVignette.ts` | All 5 exports: 0 non-test refs | `hexVignette.test.ts` (2026-03-30) | Dead with tests |
| `engine/interventionCost.ts` | `triangularCost`, `computeSphereMultiplier`: 0 refs. `computeInterventionCost` matches only `engine/dream.ts:54`, which is **a separate function with the same name**, not an import | `interventionCost.test.ts` (2026-03-30) | Dead with tests |
| `engine/interventionTracking.ts` | All 3 exports: 0 refs. The `interventionTracking` hits in `encounterVisibility.ts`, `journeyEngine.ts`, `returnEngine.ts` are a node property of the same name | `interventionTracking.test.ts` (2026-03-30) | Dead with tests |
| `engine/magicPower.ts` | All 8 exports: 0 non-test refs. Note: THR-2081 (`e3490514`, 2026-10-28) still edited it, adding `causedBy`, so dead code is still getting maintenance | `src/__tests__/engine/magicPower.test.ts` (2026-03-30) | Dead with tests |
| `engine/vignetteNotification.ts` | All 3 exports: 0 non-test refs | `vignetteNotification.test.ts` (2026-06-12) | Dead with tests |
| `data/hex-tile-assets.ts` | All 4 runtime exports: 0 refs. Its one importer, `hex-vignette-content.ts`, takes a type only | `hex-tile-assets.test.ts` (2026-04-06) | Dead with tests |
| `types/worldModel.ts` | Types only | `worldModel.test.ts` | **Falls.** The test checks the live `data/world-model.json` (read by `scripts/validate-world-model.ts`, CMS and Codex registries). Live coverage; trap 3 |

Each of the nine dead modules' tests imports nothing else live except shared fixtures (`engine/graph.ts`, `traceBuffer.ts`, `influence.ts`, `sphereAffinity.ts`), so each test is dead in full, not mixed. Except for `vignetteNotification.test.ts`, which also imports `divineAttention.ts`; read it before deleting, to check it covers nothing of that module.

Side finding: five CMS sliders tune constants that only these dead modules read. `INTERVENTION_MAX_BONUS`, `OPPOSING_SPHERE_COST_MULTIPLIER` and `NEUTRAL_SPHERE_COST_MULTIPLIER` (read only by `interventionCost.ts`), and `VIGNETTE_MAX_PER_TICK` and `VIGNETTE_QUEST_PRIORITY_THRESHOLD` (read only by `vignetteNotification.ts`). They are exposed in `components/CMS/tunableConstants.ts:861-873, 1186-1190` and change nothing in a running game. This is the same shape as THR-2050.

The rest of the graph's unreachable-with-tests set (51 modules) is unchanged from last week: no module joined it. It is mostly types-only modules, the `composition-dsl/` tree (THR-952), and the shims below.

### Re-export shims (not dead coverage)

Only tests import through these. Repoint the tests, then delete the shims. All seven from last week are still present; one more was found this week.

| Shim | Live target | Importers |
|---|---|---|
| `components/Game/ascendant-bar/selectors.ts` (**newly found**, exists since THR-1876 on 2026-10-18) | `engine/views/subjects/godSheet.ts` | 12 tests at runtime, incl. the new `railDressingThr2099.test.tsx`. Seven bar components (`CovenantsBlock`, `EssenceBlock`, `IdentityStrip`, `MandateBlock`, `ReachesBlock`, `SeatLine`, `SignaturesBlock`) import types through it, so repointing it touches production files too |
| `components/Game/momentCardModel.ts` | `engine/views/stage/momentCardModel.ts` | 4 tests |
| `components/Game/attachmentGlyphs.ts` | `data/attachment-glyphs.ts` | 2 tests |
| `encounter-stage/adapters/buildStepCastModel.ts` | `engine/views/stage/buildStepCastModel.ts` | 2 tests |
| `encounter-stage/adapters/chipCollaborators.ts` | `engine/views/stage/chipCollaborators.ts` | 6 tests |
| `encounter-stage/adapters/encounterIllustration.ts` | `engine/views/stage/encounterIllustration.ts` | 1 test |
| `encounter-stage/narrativeLinker.ts` | `engine/views/stage/narrativeLinker.ts` | 2 tests |
| `components/Game/hexMapAgentVisibility.ts` | (carried) | `spotlightPull.test.ts`, `hexMapAgentVisibility.test.ts` |

### Carried candidates (re-verified at `98de22a3`)

| Carried candidate | Re-verified | Status |
|---|---|---|
| `getAgentWheelSlots` (`engine/wheel.ts:283`) | 0 production callers; mentions in comments only. It is the module's **only runtime export**; the nine production importers of `wheel.ts` all take types. `wheel.test.ts` and `actionCardRedesign-integration.test.ts` exercise it directly | Unchanged (`delivery-integration` still mixed) |
| `engine/effectScope.ts` | Only `effectScope.region.test.ts` | Unchanged (missing consumer) |
| `RULE_OVERRIDE_MAX_PER_HEX` | `effect-constants.ts:97` and the CMS slider only | Unchanged; still the one plain fix |
| `composition-dsl/harness.ts` | Only `validator.test.ts` | Unchanged (THR-952) |
| `data/terrain-overlays.ts` | Only `effectConsolidation.test.ts` | Unchanged |
| `components/Game/hexMapAgentVisibility.ts` shim | Two tests | Unchanged (moved to the shim table) |

## 2. Slowest test files: top 10 (required projects)

The top 10 take **34.0%** of summed file time (36.8% last week).

| # | Duration | Share | Tests | File |
|---|---|---|---|---|
| 1 | 37.7s | 8.3% | 44 | `scripts/__tests__/review-gate.test.ts` |
| 2 | 16.3s | 3.6% | 10 | `src/engine/__tests__/interventionEffects-integration.test.ts` |
| 3 | 15.2s | 3.4% | 25 | `src/engine/__tests__/graphOpExecutor.tradeVerbs.test.ts` |
| 4 | 14.2s | 3.1% | 9 | `src/engine/__tests__/conceptTooltipIds.test.ts` |
| 5 | 13.2s | 2.9% | 6 | `src/engine/__tests__/worldTilt.test.ts` |
| 6 | 12.7s | 2.8% | 5 | `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` |
| 7 | 11.7s | 2.6% | 12 | `src/engine/__tests__/claimItem.test.ts` |
| 8 | 11.4s | 2.5% | 25 | `src/engine/__tests__/seedEchoes.test.ts` |
| 9 | 10.9s | 2.4% | 23 | `src/engine/__tests__/orchestrator.test.ts` |
| 10 | 10.6s | 2.3% | 4 | `src/engine/__tests__/contracts/mark-reveal-liveness.contract.test.ts` |

Movement since last week: `conceptTooltipIds`, `claimItem` (grew under THR-2031) and `orchestrator.test.ts` entered. `threaded-agent-balance.contract` (13.0s → 8.8s), `sphereSeeding` (10.1s → 8.8s) and `check-wiki-freshness` (10.0s → 9.5s) left. `conceptTooltipIds.test.ts` did not change since last week, so its rise is likely machine load. `review-gate.test.ts` still leads the required gate by more than twice the next file. No file spends more than 10s on 2 tests or fewer this week. These rank work; they are not deletion candidates.

### 2a. Heavy project, from CI

**Recovered.** Last week the Heavy simulation tests job was being killed at its `timeout-minutes: 45` (`.github/workflows/heavy-tests.yml:67`). THR-2082 / THR-2083 / THR-2084 (2026-10-27) cut the army-longevity heavy test to 45 days and reworked two other heavy tests. Over the last 40 runs (2026-10-27 → 2026-11-02): **30 success, 4 failure, 6 cancelled.** Successful runs took 17–32 min. The longest run was 31.5 min, so there is about 30% headroom under the cap. All 6 cancels ended at 4–22 min, so they are concurrency cancels (`cancel-in-progress: true`), not timeouts.

The 4 failures (40612850994, 40619338870 on 10-28; 41197611019, 41203837564 on 10-31) were all in `src/engine/__tests__/premonitionSteer.integration.test.ts` (THR-2068 "a compelled journey whose scene is gone on arrival lapses aloud", and on 10-28 also "chooses the compelled template at The First's next decision"). Every run since 2026-10-31 13:29Z has passed (23 in a row).

## 3. Duplicated coverage

Assessed at the structural level only.

**One finding, report-only.** The art-led dressing pass (THR-2097 to THR-2103) added seven test files, one per surface: `artLedDressing.thr2097`, `artLedDressing.thr2098`, `railDressingThr2099`, `stageDressingThr2100`, `dialogDressingThr2101`, `ceremonyDressingThr2102`, `listDressingThr2103`. Five of them repeat the same two rule shapes. (1) Walk a surface's heading table and assert every icon is an `ICON_REGISTRY` idea or on that surface's "no idea" list. (2) Assert an unknown mortal draws the silhouette and a known mortal draws the portrait (Law 8). Rule 1 tests a different table each time, so it is not real overlap. Rule 2 runs through the shared `entityVisualResolver` and is asserted again on each surface. That overlap is small and is how per-surface wiring regressions get caught, so leave it. If the silhouette rule changes, expect to edit several of these files.

Of the 56 new test files, 17 carry a ticket number in their filename, and `data/unified-action-templates.ts` picked up 16 more test importers (203 in total). Neither is a duplication finding by itself. Assertion-level overlap needs coverage instrumentation, which the no-new-tooling charter rules out.

## Ticket candidates

Filed by the lane after this pass as [THR-2131](https://linear.app/threadbare/issue/THR-2131) (Todo, unassigned, verified), in the THR-2049 shape:

- **Nine modules have tests but no production caller.** These are the nine "Dead with tests" rows above: `callbackEligibility`, `controlContestationResolver`, `generateEncounterCandidates`, `hexVignette`, `interventionCost`, `interventionTracking`, `magicPower`, `vignetteNotification`, `hex-tile-assets`. Evidence: each runtime export grepped by name at `98de22a3` has 0 non-test references, and none is reachable from an entry point in the import graph. Two references look live but are not: `computeInterventionCost` in `dream.ts` is a separate function with the same name, and `interventionTracking` is also a node property name. Each covering test imports only shared fixtures besides its subject (read `vignetteNotification.test.ts` for `divineAttention.ts` first). The same ticket should remove the five CMS sliders whose constants only `interventionCost.ts` and `vignetteNotification.ts` read, as THR-2050 did. The executor re-verifies before deleting.

Lower-value, unchanged: repoint the tests behind the eight shims and delete the shims (the `ascendant-bar/selectors.ts` one also touches seven production `import type` lines).
