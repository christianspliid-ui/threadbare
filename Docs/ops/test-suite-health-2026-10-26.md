---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-10-26 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 1 new, 6 standing confirmed, 7 carried, 0 resolved (6 new re-export shims, not dead coverage)
slowFilesReported: 10
ticketsFiled: 1 (THR-2049)
---
# Test-suite health — weekly pass, 2026-10-26

Twelfth run of the duty (THR-942). The previous pass was [2026-10-19](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-10-19.md).

**Suite (required projects only): 1673 files, 25492 tests, all passed, 0 failed, 0 skipped.** Run: `npx vitest run --project node --project node-isolated --project dom --reporter=json` against `main` @ `9cfae007`. Summed file time **452.2s**.

**Method change, so the totals are not comparable to last week.** Last week's run included the `heavy` project. This week it did not: THR-2003 restricts local heavy runs to attended sessions, and this is an unattended lane. Heavy cost this week comes from CI instead (§ 2a).

## 1. Dead-coverage candidates

Method: an import graph at `de68cb60` (last week's main) and `9cfae007`, built from `git ls-tree` + `git cat-file` over `src/`, `scripts/` and root configs. Edges: static, re-export, side-effect, dynamic `import()`, `vi.mock`, `require`; `.ts`/`.tsx`/`.js→.ts` and `index.*` resolution. `import type`-only importers counted apart and treated as not live. Test-only modules (`src/testing/`) and entry points excluded. Every candidate then checked by hand with grep.

```
new test files since de68cb60:                     74
subject edges examined:                            646
unique subjects:                                   290
subjects with ZERO runtime production importers:   3 raw → 1 after reading the imports
modules that lost their last prod importer:        6 → all 6 are re-export shims
```

Raw hits that fell: `engine/views/subjects/subjectTypes.ts` and `types/ambition.ts` are types-only modules (trap 2).

**Parser blind spot found this week:** `new Worker(new URL('./X.ts', import.meta.url))` is not an import edge. `services/narration/NarrationWorker.ts` read as zero-importer but is live through `WorkerBackend.ts:80`.

### New candidate

| Candidate | Evidence | Shape |
|---|---|---|
| `src/engine/encounters/relationshipResolver.ts` (`getRelationship`) | Never had a production importer: `git log -S relationshipResolver -- src` shows only its creation (`a52cc4a9`) and a THR-2023 test change. The header claims the cast tile reads it; nothing does. The new `src/engine/__tests__/debtSettle.test.ts:18` uses it as a probe in `relSentiment()` (`:391-394`) | **Mixed.** `relationshipResolver.test.ts` is dead in full; `debtSettle.test.ts` covers live code and needs only its helper repointed |

### Six new re-export shims (not dead coverage)

All are 2-line `export *` shims left by THR-1895 / THR-1897 moving builders into `engine/views/stage/`. Only tests still import through them. Repoint the tests, then delete the shims.

| Shim | Live target | Tests importing through it |
|---|---|---|
| `components/Game/momentCardModel.ts` | `engine/views/stage/momentCardModel.ts` | `MomentCard.test.tsx`, `momentCardModel.test.ts`, `threadWorkAndWant.test.tsx`, `workProgressParity.test.ts` |
| `components/Game/attachmentGlyphs.ts` | `data/attachment-glyphs.ts` | `attachmentGlyphs.test.ts`, `conceptIcons.test.ts` |
| `encounter-stage/adapters/buildStepCastModel.ts` | `engine/views/stage/buildStepCastModel.ts` | `castChannel.test.ts`, `stepCast.thr1670.test.ts` |
| `encounter-stage/adapters/chipCollaborators.ts` | `engine/views/stage/chipCollaborators.ts` | six files, incl. `buildFightChanges.test.ts`, `castChannel.test.ts` |
| `encounter-stage/adapters/encounterIllustration.ts` | `engine/views/stage/encounterIllustration.ts` | `buildUnifiedEncounterStageModel.unpricedChoice.test.ts` |
| `encounter-stage/narrativeLinker.ts` | `engine/views/stage/narrativeLinker.ts` | `narrativeLinkerLocationRender.test.tsx`, `narrativeLinkerLocationTier.test.ts` |

THR-1991 is Done (PR #2546); all 24 of its modules are gone. None of this week's items was on it.

### Standing modules read one by one (promised last week)

| Module | Evidence | Verdict |
|---|---|---|
| `engine/stealth.ts` | `processMortalDetection` has 0 callers. The live `phaseStealth` is a different function in `orchestrator.ts:2684` | Dead with tests: `stealth.test.ts`, `stealth-mandate-integration.test.ts` (maybe mixed) |
| `engine/lakeGeneration.ts` | Last importer was the V1 SVG map (THR-941); lakes now come from `depressionLakes` | Dead with tests: `lakeGeneration.test.ts`; four more tests import it and look mixed |
| `engine/actionCandidates.ts` | Superseded by `unifiedCandidates.ts`; last importer dropped `63be7dbc` | Dead with tests: `actionCandidates.test.ts`, `actionCandidatesWealth.test.ts` |
| `engine/socialOutcome.ts` | 0 callers; header's "called from the orchestrator" is false | Dead with tests: `socialOutcome.test.ts` |
| `components/Game/NarrativeFeed.tsx` | No render; import removed `11bf0756` | Dead with tests: `NarrativeFeed.test.tsx` |
| `components/Game/AttachmentRow.tsx` | No render; last importer went in THR-1492 | Dead with tests: `AttachmentRow.test.tsx` |

These six, `relationshipResolver` and the carried `fogShader` are now one ticket: **THR-2049** (Todo, unassigned). Nothing was deleted here.

The rest of the standing set was checked by module-path grep only (exports not read one by one). Dead-with-tests by that check: `engine/callbackEligibility.ts`, `controlContestationResolver.ts`, `encounters/generateEncounterCandidates.ts`, `hexVignette.ts`, `interventionCost.ts`, `interventionTracking.ts`, `magicPower.ts`, `vignetteNotification.ts`, `types/worldModel.ts`, `data/hex-tile-assets.ts`. Next week's pass reads these before any of them is ticketed. Dead with no tests (not coverage findings) include `components/Game/EventLog.tsx`, `engine/simulation.ts`, `engine/encounterRuntime.ts`, five unused barrels, and **`src/sentry.ts`, which nothing imports, so Sentry is never initialised** (reported in the run's T3 section).

### Carried candidates (re-verified)

| Carried candidate | Re-verified at `9cfae007` | Status |
|---|---|---|
| `getAgentWheelSlots` (`engine/wheel.ts:283`) | 0 production callers; comment mentions only | Unchanged (`delivery-integration` still mixed) |
| `engine/effectScope.ts` | 0 importers outside its test | Unchanged (missing consumer) |
| `RULE_OVERRIDE_MAX_PER_HEX` | `effect-constants.ts:97` and the CMS slider only | Unchanged; still the one plain fix |
| `composition-dsl/harness.ts` | Only `validator.test.ts:5` | Unchanged (THR-952) |
| `data/terrain-overlays.ts` | Only `effectConsolidation.test.ts` | Unchanged |
| `HexMapV2/scene/fogShader.ts` + test | Still 0 production importers | Now on THR-2049 |
| `components/Game/hexMapAgentVisibility.ts` shim | Imported by `spotlightPull.test.ts:38` **and** `hexMapAgentVisibility.test.ts:2` (missed last week) | Unchanged; two tests to repoint |

## 2. Slowest test files: top 10 (required projects)

The top 10 take **36.8%** of summed file time.

| # | Duration | Share | Tests | File |
|---|---|---|---|---|
| 1 | 37.8s | 8.4% | 44 | `scripts/__tests__/review-gate.test.ts` |
| 2 | 22.1s | 4.9% | 25 | `src/engine/__tests__/graphOpExecutor.tradeVerbs.test.ts` |
| 3 | 18.8s | 4.1% | 10 | `src/engine/__tests__/interventionEffects-integration.test.ts` |
| 4 | 15.4s | 3.4% | 4 | `src/engine/__tests__/contracts/mark-reveal-liveness.contract.test.ts` |
| 5 | 14.4s | 3.2% | 5 | `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` |
| 6 | 13.0s | 2.9% | 1 | `src/engine/__tests__/contracts/threaded-agent-balance.contract.test.ts` |
| 7 | 12.8s | 2.8% | 6 | `src/engine/__tests__/worldTilt.test.ts` |
| 8 | 12.0s | 2.6% | 25 | `src/engine/__tests__/seedEchoes.test.ts` |
| 9 | 10.1s | 2.2% | 10 | `src/engine/__tests__/sphereSeeding.test.ts` |
| 10 | 10.0s | 2.2% | 40 | `scripts/__tests__/check-wiki-freshness.test.ts` |

`review-gate.test.ts` (a harness script test, not a world simulation) leads the required gate. One file spends more than 10s on 2 tests or fewer: `threaded-agent-balance.contract` (13.0s). These rank work; they are not deletion candidates.

### 2a. Heavy project, from CI

The **Heavy simulation tests** job is now hitting its `timeout-minutes: 45` (`.github/workflows/heavy-tests.yml:67`). Last week's pass warned it had about 10% headroom (40.5 min). Since 2026-10-23, **7 runs were killed at the 45-minute cap**: 40033756179, 40090763227, 40132053031, 40190831483, 40194613102, 40221864546, 40253745341. GitHub reports a timeout as `cancelled` ("The operation was canceled"), the same as a concurrency cancel, so these runs do not show as red. Successful runs in the same window took 31–45 min. Over the last 40 runs: 10 success, 3 failure, 27 cancelled (most of them concurrency cancels, `cancel-in-progress: true`).

## 3. Duplicated coverage

Assessed at the structural level only; nothing new found. Same limit as before: assertion-level overlap needs coverage instrumentation, which the no-new-tooling charter rules out.

## Tickets filed

- [THR-2049](https://linear.app/threadbare/issue/THR-2049/eight-modules-have-tests-but-no-production-caller-delete-each-with-its): eight modules with tests but no production caller. Todo, unassigned, verified.
