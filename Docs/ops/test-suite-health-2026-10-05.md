---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-10-05 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 1 new, 4 carried, 1 resolved
slowFilesReported: 10
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-10-05

Ninth run of the duty (THR-942). The previous pass was [2026-09-28](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-28.md).

**Suite: 1513 files, 23352 tests** (23349 passed, 0 failed, 3 skipped). That is +103 files and +1101 tests over the week. The run was `npx vitest run --reporter=json` against `origin/main` @ `f905e996`, all projects including `heavy`, the same command as last week. **It ran alone this week:** the T3 detectors had finished before it started, so no contention timeouts occurred. Summed file time was 1596.7s against 1271.3s last week. Last week's figure was contention-inflated, so the real growth is larger than this comparison shows. Ranks and shares are comparable.

## 1. Dead-coverage candidates

The method is unchanged. Take every test file added since `a5c41a3f` (main at the 09-28 pass). Resolve its static, `export … from`, dynamic `import()` and `vi.mock` subjects. Build a reverse index of **runtime** production importers, where an `import type` importer is counted separately. Exclude entry points.

```
new test files since a5c41a3f (2026-09-28):          108
subject edges examined:                              677
unique subjects:                                     313
subjects with ZERO runtime production importers:     2
new test files with no local subject import:         2
```

- **`src/data/content-eval/firedTemplateCompletion.ts` is not a candidate.** It is the THR-1634 E3 ratchet list, which exists to be read by its test, so it falls under trap 1 (a test-only helper by design). Its own header says "Authoring side only … off the client bundle."
- **The two files with no local import are not candidates.** `scripts/__tests__/lint-plan-doc-bare.test.ts` bundles the real script into a throwaway repo. `src/components/shared/__tests__/dialogContextTokens.test.ts` parses `index.css` from disk. Neither reaches its subject through an import edge.
- **NEW: `getAgentWheelSlots` in `src/engine/wheel.ts`.** Both new test files that flagged it import only the `WheelSlot` *type*. That is trap 2, so I traced the runtime function instead.
  - **The type is live.** `WheelSlot` has 7 production importers, all of them `import type`.
  - **The function has no production caller.** `useAgentInteraction.ts:187` and `unified-action-templates.ts:5620` both say it was retired by THR-501, the legacy tier-based intervention wheel ("Intervention wheel (AgentWheel)" is on the Rejected Approaches list).
  - **Three test files still exercise it.** Their imports were read, not their filenames:

    | Test file | Tests | Imports | Verdict |
    |---|---|---|---|
    | `src/engine/__tests__/wheel.test.ts` | 28 | `getAgentWheelSlots` + `createEmptyEssencePool` | Dead coverage in full |
    | `src/engine/__tests__/actionCardRedesign-integration.test.ts` | 10 | `getAgentWheelSlots` + `WheelSlot` type + fs reads | Dead coverage in full (every `it` calls the wheel) |
    | `src/engine/__tests__/delivery-integration.test.ts` | 3 | `getAgentWheelSlots` **plus live** `delivery.ts`, `dream.ts`, `types/dream` | **Mixed.** Only the wheel calls are dead. Keep the delivery/dream assertions |

  - **Prune shape for an executor:** move `WheelSlot` to a types module, or keep it in place, and delete `getAgentWheelSlots` (~130 of `wheel.ts`'s 399 lines). Then delete or rewrite the three tests as the table above says. **Nothing was deleted here.**
  - It was missed until now because every earlier pass only looked at test files added that week, and these three tests are older than the duty's baselines.

### Carried candidates (re-verified)

| Carried candidate | Re-verified this pass | Status |
|---|---|---|
| `src/engine/effectScope.ts` (`resolveScope`) | Still only the module and `effectScope.region.test.ts` | Unchanged (THR-1155 slice 1, missing consumer) |
| `RULE_OVERRIDE_MAX_PER_HEX` | Still only `effect-constants.ts` (definition) and the CMS slider in `tunableConstants.ts` | Unchanged. **This is still the one item that is a fix, not a judgement call.** The CMS still offers a control that moves nothing |
| SceneStatePanel cluster | **Gone.** Deleted by THR-964 (`2893cfa1`, 2026-10-02, "retire the choice-commit pipeline") | **Resolved, dropped from the carry list** |
| `src/composition-dsl/harness.ts` | Still tracked, still no importer | Unchanged (THR-952: decide the unit as a whole) |
| `src/data/terrain-overlays.ts` | Still referenced only by `effectConsolidation.test.ts` | Unchanged |

## 2. Slowest test files: top 10

The top 10 take **50.5%** of summed file time, against 53.1% last week.

| # | Duration | Share | Tests | File | vs. 2026-09-28 |
|---|---|---|---|---|---|
| 1 | 112.7s | 7.1% | 7 | `src/engine/__tests__/numericPropertyIntegrity.test.ts` | #1 → #1 |
| 2 | 95.4s | 6.0% | **1** | `src/engine/__tests__/arrivalCommitmentBoard.test.ts` | **NEW to top 10** (THR-1668, added 09-28) |
| 3 | 93.8s | 5.9% | 17 | `src/engine/__tests__/edgeIntegrity.test.ts` | #3 → #3 |
| 4 | 93.3s | 5.8% | 9 | `src/engine/__tests__/engagementWindow.invariant.test.ts` | #2 → #4 (3 → 9 tests) |
| 5 | 82.8s | 5.2% | **1** | `src/engine/__tests__/premonitionGateChain.test.ts` | #4 → #5 |
| 6 | 74.4s | 4.7% | 7 | `src/engine/__tests__/debugTickBatch.test.ts` | #7 → #6 |
| 7 | 65.6s | 4.1% | 14 | `src/engine/__tests__/content-layer1-integration.test.ts` | #6 → #7 |
| 8 | 65.6s | 4.1% | 3 | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` | #9 → #8 |
| 9 | 62.5s | 3.9% | 2 | `src/engine/__tests__/worldPast-generatedWorld.test.ts` | #5 → #9 |
| 10 | 60.3s | 3.8% | 8 | `src/engine/__tests__/doomIdentityMilestones.test.ts` | #10 → #10 |

`traceBuffer-integration.test.ts` dropped out of the top 10.

**Cost-per-test outliers.** Ten files each spend more than 10s on 2 tests or fewer, against seven last week. The new ones are:

- `arrivalCommitmentBoard.test.ts` (95.4s / 1)
- `journeyKeepsGoal.test.ts` (57.0s / 1)
- `undertakingCheckpointLiveness.test.ts` (23.6s / 1)
- `GameView-momentCard.test.tsx` (16.8s / 1)
- `pathfindingSingleSource.heavy.test.ts` (16.7s / 1)
- `holdStandingReach.test.ts` (12.0s / 1)
- `undertakingPortent.live.test.ts` (11.0s / 1)

Some of these may have sat just under the bar last week under contention. Almost all are generated-world liveness tests, the anti-vacuity shape this repo asks for. **They rank work. They are not deletion candidates.** The one that is not a world-driver is `GameView-momentCard.test.tsx`, a 16.8s single UI test, which is the cheapest to look at if someone wants a speed target.

## 3. Duplicated coverage

**Assessed at the structural level only, and nothing was found.** This is the same method and the same honest limit as before. Assertion-level overlap is not visible without coverage instrumentation, which the no-new-tooling charter rules out.

## Tickets filed

**None.** The weekly retro is the single promotion point, and that includes the new `getAgentWheelSlots` candidate. Nothing was deleted.
