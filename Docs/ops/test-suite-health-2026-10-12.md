---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-10-12 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 0 new, 4 carried, 0 resolved
slowFilesReported: 10
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-10-12

Tenth run of the duty (THR-942). The previous pass was [2026-10-05](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-10-05.md).

**Suite: 1581 files, 24171 tests** (24169 passed, **1 failed**, 1 skipped). That is +68 files and +819 tests over the week. The run was `npx vitest run --reporter=json` against `origin/main` @ `f19ce3ab`, all projects including `heavy`, the same command as last week. Summed file time was 2101.9s against 1596.7s last week: +32% for +4.5% more files.

**This week's run was contended.** The file count grew 4.5% while summed time grew 32%, so other work on the machine slowed the run. The one failure is a timeout caused by that contention, not a defect:

- **`src/engine/__tests__/doomIdentityMilestones.test.ts` › "milestone triggered flag persists — no re-emission after first crossing"** took 19.6s against its own `MILESTONE_SMOKE_TIMEOUT_MS = 15_000`. Vitest reports this as a `STACK_TRACE_ERROR` anchored at the `it(` on line 95.
- **The test passes on its own.** Re-run alone, the file is 8/8 green, and that test takes 9.1s, 61% of its budget.
- **The headroom is thin.** Under contention the test needs about 1.3× its budget. It belongs on the same list as `ci_red_may_be_timeout_not_defect`. That is a reason to watch it, not to file a ticket.

The skipped test is the same deliberate `it.skip` as before: `engagementWindow.invariant.test.ts`, "masters attempt harder content than experts" (THR-1575).

Absolute durations are inflated this week, so the week-on-week comparison runs on ranks and shares only.

## 1. Dead-coverage candidates

The method is unchanged. Take every test file added since `f905e996` (main at the 10-05 pass). Resolve its static, `export … from`, dynamic `import()`, side-effect and `vi.mock` subjects. Build a reverse index of **runtime** production importers across `src/`, `scripts/` and the root `vite`/`vitest` configs. An `import type` importer is counted separately, and so is an all-`type` brace list. Exclude test-only modules (trap 1) and entry points.

```
new test files since f905e996 (2026-10-05):          68
subject edges examined:                              424
unique subjects:                                     181
subjects with ZERO runtime production importers:     0
new test files with no local subject import:         1
```

- **No new candidates this week.** All 181 subjects have at least one runtime production importer.
- **The one file with no local import is not a candidate.** `src/components/Game/__tests__/thr1803NoSummedEncounterEssence.test.ts` is a source guard. It reads `GameView.tsx` from disk with `readFileSync` and pins the veil wiring with a regex, because GameView is too heavy to mount. Its subject is live, and the test reaches it through the filesystem, not through an import.
- **None of the 68 new test files imports any carried subject.**

### Carried candidates (re-verified)

| Carried candidate | Re-verified this pass | Status |
|---|---|---|
| `getAgentWheelSlots` in `src/engine/wheel.ts` | **0 runtime production importers.** `wheel.ts` has 7 importers, all `import type` (the `WheelSlot` type). The only other mentions are comments: `useAgentInteraction.ts:189`, `unified-action-templates.ts:5629` (both "retired by THR-501"), and `useAgentInteraction-effects.test.tsx:362`. `wheel.ts` was last touched 2026-09-10 | Unchanged |
| ↳ `src/engine/__tests__/wheel.test.ts` | Still present, last touched 2026-09-10 | Unchanged. Dead coverage in full |
| ↳ `src/engine/__tests__/actionCardRedesign-integration.test.ts` | Still present, last touched 2026-08-29 | Unchanged. Dead coverage in full |
| ↳ `src/engine/__tests__/delivery-integration.test.ts` | Still present, last touched 2026-03-30 | Unchanged. **Mixed:** keep the delivery/dream assertions |
| `src/engine/effectScope.ts` (`resolveScope`) | Still 0 importers outside `effectScope.region.test.ts`. The `tunableConstants.ts` and `interface-contracts.ts` hits are strings, not imports | Unchanged (THR-1155 slice 1, missing consumer) |
| `RULE_OVERRIDE_MAX_PER_HEX` | Still only `effect-constants.ts:97` (the definition) and the CMS slider at `tunableConstants.ts:1288` | Unchanged. **This is still the one item that is a fix, not a judgement call.** The CMS still offers a control that moves nothing |
| `src/composition-dsl/harness.ts` | Still tracked, still 0 importers | Unchanged (THR-952: decide the unit as a whole) |
| `src/data/terrain-overlays.ts` | Still referenced only by `effectConsolidation.test.ts` | Unchanged |

The prune shape for `getAgentWheelSlots` is unchanged from last week's pass. **Nothing was deleted here.**

## 2. Slowest test files: top 10

The top 10 take **49.0%** of summed file time, against 50.5% last week.

| # | Duration | Share | Tests | File | vs. 2026-10-05 |
|---|---|---|---|---|---|
| 1 | 133.5s | 6.4% | 7 | `src/engine/__tests__/numericPropertyIntegrity.test.ts` | #1 → #1 |
| 2 | 133.1s | 6.3% | **1** | `src/engine/__tests__/arrivalCommitmentBoard.test.ts` | #2 → #2 |
| 3 | 118.3s | 5.6% | 17 | `src/engine/__tests__/edgeIntegrity.test.ts` | #3 → #3 |
| 4 | 108.9s | 5.2% | 9 | `src/engine/__tests__/engagementWindow.invariant.test.ts` | #4 → #4 |
| 5 | 105.8s | 5.0% | **1** | `src/engine/__tests__/premonitionGateChain.test.ts` | #5 → #5 |
| 6 | 98.2s | 4.7% | **1** | `src/engine/__tests__/thr1779-chapterSeamSweep.test.ts` | **NEW to top 10** (THR-1779, added 10-09) |
| 7 | 85.8s | 4.1% | 7 | `src/engine/__tests__/debugTickBatch.test.ts` | #6 → #7 |
| 8 | 83.4s | 4.0% | 3 | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` | #8 → #8 |
| 9 | 82.3s | 3.9% | 14 | `src/engine/__tests__/content-layer1-integration.test.ts` | #7 → #9 |
| 10 | 80.7s | 3.8% | 8 | `src/engine/__tests__/doomIdentityMilestones.test.ts` | #10 → #10 (holds the run's one timeout, see above) |

`worldPast-generatedWorld.test.ts` dropped out (#9 → #14, 64.4s). `traceBuffer-integration.test.ts` (75.0s) and `appointment-generatedWorld.test.ts` (73.9s) sit just below the cut at #11 and #12.

**Cost-per-test outliers.** Ten files each spend more than 10s on 2 tests or fewer, the same count as last week.

- **New: `thr1779-chapterSeamSweep.test.ts`** (98.2s / 1). It is a generated-world sweep, the same shape as the others.
- **Dropped below the bar:** `undertakingPortent.live.test.ts` (9.4s / 1).
- **Unchanged:** `arrivalCommitmentBoard`, `premonitionGateChain`, `journeyKeepsGoal` (65.3s), `worldPast-generatedWorld` (64.4s / 2), `undertakingCapabilityGrowth.live` (62.6s), `pathfindingSingleSource.heavy` (26.3s), `undertakingCheckpointLiveness` (25.6s), `GameView-momentCard` (18.1s), `holdStandingReach` (14.9s).

As before, these are mostly generated-world liveness tests. **They rank work. They are not deletion candidates.** `GameView-momentCard.test.tsx` is still the one non-world-driver, and the cheapest speed target.

## 3. Duplicated coverage

**Assessed at the structural level only, and nothing was found.** The new test files' most-imported local modules are `gameState` (25 files), `traceBuffer` (16), `unifiedAction` (14) and `influence` (10). These are shared infrastructure the tests use to set up, not overlapping subjects. This is the same method and the same honest limit as before: assertion-level overlap is not visible without coverage instrumentation, which the no-new-tooling charter rules out.

## Tickets filed

**None.** The weekly retro is the single promotion point. Nothing was deleted.
