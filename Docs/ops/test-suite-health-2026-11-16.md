---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-11-16 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 0 new, 9 standing resolved (THR-2131 shipped), 6 carried unchanged
slowFilesReported: 10
duplicatedFindings: 0 new
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-11-16

Fourteenth run of the duty (THR-942). The previous pass was [2026-11-02](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-11-02.md). **The 2026-11-09 pass did not run**: the lanes were silent from 2026-11-08 13:37 to 2026-11-12, so no Monday run fired. This pass covers two weeks.

**Suite (required projects only): 1804 files, 27094 tests, 27093 passed, 1 failed, 0 skipped.** Run: `npx vitest run --project node --project node-isolated --project dom --reporter=json` in a detached worktree at `origin/main` `2a898612`. Summed file time **481.6s**, wall time 132s. `sweep:rank-reach` ran at the same time, so the durations are inflated.

**The one failure is load, not a defect.** `src/engine/__tests__/conceptTooltipIds.test.ts` › "the derived-attachment corpus is non-empty" failed with `STACK_TRACE_ERROR` while the file took 16.0s under the parallel sweep. Run on its own straight after, the file passed 9/9 in 7.8s. No ticket filed. Flag it if it fails again without parallel load.

## 1. Dead-coverage candidates

Method: an import graph over `git ls-files src scripts`, with static, re-export, dynamic `import()` and `vi.mock` edges. `import type` edges are not counted as runtime. Test-only modules (`__tests__`, `*.test.*`, `src/testing/`) and entry points are excluded. Applied to the test files added since the last pass's base `98de22a3`.

```
new test files since 98de22a3:                     100
unique runtime subjects:                           244
subjects with ZERO runtime production importers:   0
```

### New candidates

**None.**

### Resolved: THR-2131

[THR-2131](https://linear.app/threadbare/issue/THR-2131/nine-more-modules-have-tests-but-no-production-caller-delete-each-with) is Done (2026-11-02T08:17Z). All nine modules are gone from `main`: `callbackEligibility`, `controlContestationResolver`, `encounters/generateEncounterCandidates`, `hexVignette`, `interventionCost`, `interventionTracking`, `magicPower`, `vignetteNotification`, `data/hex-tile-assets`. Also deleted since `98de22a3`: `components/Game/StrandView.tsx` and `engine/strands.ts`.

### Carried candidates (re-verified at `2a898612`)

| Carried candidate | Re-verified | Status |
|---|---|---|
| `getAgentWheelSlots` (`engine/wheel.ts`) | The only non-test mentions are comments (`useAgentInteraction.ts:202`, `unified-action-templates.ts:6362`) | Unchanged |
| `engine/effectScope.ts` | The only non-test reference is `scripts/interface-contracts.ts` (the contract registry, not a caller) | Unchanged |
| `RULE_OVERRIDE_MAX_PER_HEX` | Only `effect-constants.ts` and the CMS slider | Unchanged |
| `composition-dsl/harness.ts` | No non-test importer | Unchanged (THR-952) |
| `data/terrain-overlays.ts` | No non-test importer | Unchanged |
| Re-export shims (`momentCardModel`, `ascendant-bar/selectors`, `hexMapAgentVisibility`, and others) | Still present. No new test imports them | Unchanged |

## 2. Slowest test files: top 10 (required projects)

The top 10 take **31.0%** of summed file time (34.0% on 11-02).

| # | Duration | Share | Tests | File |
|---|---|---|---|---|
| 1 | 33.0s | 6.9% | 44 | `scripts/__tests__/review-gate.test.ts` |
| 2 | 16.0s | 3.3% | 9 | `src/engine/__tests__/conceptTooltipIds.test.ts` |
| 3 | 15.7s | 3.3% | 21 | `src/engine/__tests__/gameInit.test.ts` |
| 4 | 15.2s | 3.2% | 10 | `src/engine/__tests__/interventionEffects-integration.test.ts` |
| 5 | 14.7s | 3.0% | 25 | `src/engine/__tests__/graphOpExecutor.tradeVerbs.test.ts` |
| 6 | 13.2s | 2.7% | 6 | `src/engine/__tests__/worldTilt.test.ts` |
| 7 | 10.8s | 2.2% | 25 | `src/engine/__tests__/seedEchoes.test.ts` |
| 8 | 10.4s | 2.2% | 3 | `src/engine/__tests__/culturePhonetics.sweep.test.ts` |
| 9 | 10.2s | 2.1% | 4 | `src/engine/__tests__/contracts/mark-reveal-liveness.contract.test.ts` |
| 10 | 10.0s | 2.1% | 5 | `src/engine/__tests__/tickReplayDetection.test.ts` |

Movement since 11-02: `gameInit`, `culturePhonetics.sweep` and `tickReplayDetection` entered. `claimItem`, `orchestrator.test.ts` and `encounter-experience.contract` left. `culturePhonetics.sweep` spends 10.4s on 3 tests, the only file in the top 10 above 3s per test. This list ranks work. It is not a list of deletion candidates.

### 2a. Heavy project, from CI

The last 60 runs of `heavy-tests.yml` (2026-11-07 → now): **39 success, 21 cancelled, 0 failure.** Successful runs took 18–33 min against the 45 min cap. The `premonitionSteer` failures from 10-28 / 10-31 have not come back.

## 3. Duplicated coverage

No new structural finding. The 11-02 note on the art-led dressing files (THR-2097 to THR-2103) still stands, report-only. Assertion-level overlap would need coverage instrumentation, which the no-new-tooling charter rules out.

## Ticket candidates

None this week.
