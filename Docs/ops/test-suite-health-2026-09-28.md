---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-09-28 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 0 new, 4 carried
slowFilesReported: 10
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-09-28

Eighth run of the duty (THR-942). The previous pass is [2026-09-21](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-21.md), one week ago, so the week-on-week comparisons below use a one-week baseline.

**Suite: 1410 files, 22251 tests.** That is +103 files and +1412 tests over the week. The run was `npx vitest run --reporter=json` against `origin/main` @ `a5c41a3f` (all projects, including `heavy`). This is the same command as last week.

**Caveat on timing (read before comparing):** this run shared the machine with the daily `sweep:rank-reach` (single-threaded, 900 ticks), which was running at the same time. Two tests timed out under that load: `peopleThingsCells.test.ts` and `conceptTooltipIds.test.ts`, both with `STACK_TRACE_ERROR` at a hook or test deadline. **Both pass in isolation** (13/13 in 18.6s), so they are contention timeouts, not defects. Absolute durations are therefore inflated, and **summed file time is not comparable week on week** (1271.3s here against 729.1s last week). File ranks and shares are still usable.

## 1. Dead-coverage candidates

The method is unchanged: resolve the static, `export … from` and dynamic `import()` subjects of every test file added since `df1cf66c` (main at the 09-21 pass). Build a reverse index of production importers. Check `package.json` entry points and confirm the flagged file exists (trap 6).

```
new test files since df1cf66c (2026-09-21):  103
subject edges examined:                      1042
unique subjects:                             326
subjects with ZERO runtime production importers: 5
new test files with no local subject import:     0
```

**All five flags are type-only modules, so there are no new candidates.** `src/types/rival.ts` (10 type importers), `src/types/mandate.ts` (8), `src/types/ambition.ts` (20), `src/types/traces/fight-traces.ts` (8) and `src/types/traces/monster-traces.ts` (3) are `src/types/` declaration modules. Every production consumer imports them with `import type`, as a types module should. This is trap 2 in the opposite direction: a type-only importer set is the *healthy* shape for a types file. It is not evidence that the module is dead.

### Carried candidates (all re-verified, all unchanged)

| Carried candidate | Re-verified this pass | Status |
|---|---|---|
| `src/engine/effectScope.ts` (`resolveScope`) | Still exactly two files mention `resolveScope`: the module and `effectScope.region.test.ts`. No production caller | Unchanged. This is the likely missing-consumer case (THR-1155 slice 1) |
| `RULE_OVERRIDE_MAX_PER_HEX` | Still read only by `src/data/effect-constants.ts` (definition) and `src/components/CMS/tunableConstants.ts` (CMS slider). There is no engine reader | Unchanged. The CMS still offers a control that moves nothing. **This is still the one item that is a fix, not a judgement call** |
| SceneStatePanel cluster | Still just the component, its test and its snapshot. No importer | Unchanged, now nearly five months cold. Retire or wire is THR-964's call |
| `src/composition-dsl/harness.ts` | Still tracked, still no importer of any kind | Unchanged. THR-952's rule (decide the unit as a whole) applies |
| `src/data/terrain-overlays.ts` | Still referenced only by `effectConsolidation.test.ts` | Unchanged |

## 2. Slowest test files: top 10

The numbers are inflated by contention (see the caveat above). The top 10 take **53.1%** of summed file time (53.2% last week), so the concentration is stable.

| # | Duration | Share | Tests | File | vs. 2026-09-21 |
|---|---|---|---|---|---|
| 1 | 131.4s | 10.3% | 7 | `src/engine/__tests__/numericPropertyIntegrity.test.ts` | #1 → #1 |
| 2 | 79.7s | 6.3% | 3 | `src/engine/__tests__/engagementWindow.invariant.test.ts` | **NEW to top 10** (added 2026-09-24) |
| 3 | 78.1s | 6.1% | 17 | `src/engine/__tests__/edgeIntegrity.test.ts` | #2 → #3 |
| 4 | 68.3s | 5.4% | **1** | `src/engine/__tests__/premonitionGateChain.test.ts` | #3 → #4 |
| 5 | 61.1s | 4.8% | **1** | `src/engine/__tests__/worldPast-generatedWorld.test.ts` | **NEW** (added today, THR-1631) |
| 6 | 54.6s | 4.3% | 14 | `src/engine/__tests__/content-layer1-integration.test.ts` | #4 → #6 |
| 7 | 53.3s | 4.2% | 7 | `src/engine/__tests__/debugTickBatch.test.ts` | #5 → #7 |
| 8 | 49.8s | 3.9% | 10 | `src/engine/__tests__/traceBuffer-integration.test.ts` | #6 → #8 |
| 9 | 49.4s | 3.9% | 3 | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` | #8 → #9 |
| 10 | 49.2s | 3.9% | 8 | `src/engine/__tests__/doomIdentityMilestones.test.ts` | #7 → #10 |

`undertakingCapabilityGrowth.live.test.ts` and `agent-decision-pipeline.contract.test.ts` dropped out of the top 10. The two new entrants displaced them.

**Cost-per-test outliers.** Seven files each spend more than 10s on 2 tests or fewer. Last week there were five. The two new ones are `worldPast-generatedWorld.test.ts` (61.1s, 1 test) and `appointment-generatedWorld.test.ts` (28.7s, 2 tests). Both are generated-world liveness tests, which is exactly the anti-vacuity shape this repo asks for. **They rank work; they are not deletion candidates.**

**Related engine-cost signal (from T3, not from this suite):** the `measure:tick-cost` steady-state figure rose from 125 to ~145 ms/tick between yesterday's `main` (`64127257`) and today's (`a5c41a3f`). The two runs were back to back under the same load. `agent_decision` rose from 7.7s to 9.7s. The last row in the (untracked) trend file is 58–64 ms/tick on 2026-09-13. Liveness tests that drive real worlds inherit this cost directly, so it is the likely common cause of the top-10 growth. The details are in the run report.

## 3. Duplicated coverage

**Assessed at the structural level only, and nothing was found.** This is the same method and the same honest limit as last week. Shared-subject counts measure fixture dependency (`graph.ts`, `gameState.ts` and the other hot files), not assertion overlap. The stem clusters remain facet-named partitions. Assertion-level overlap is not visible without coverage instrumentation, which the no-new-tooling charter rules out.

## Tickets filed

**None**, per the process-work throttle: the weekly retro is the single promotion point. Nothing was deleted.
