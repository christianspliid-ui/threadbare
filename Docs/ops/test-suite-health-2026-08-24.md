---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-08-24 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 4
slowFilesReported: 15
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-08-24

Fifth run of the duty (THR-942), one week after [2026-08-17](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-17.md).

Suite: **1056 files, 17291 tests, all passing**, `npx vitest run` exit 0. Growth over the week: **+28 files, +799 tests**.

Two things to read this pass for, because the rest is stable: a **new #2 entry in the slow list holding 11% of summed suite time on its own**, and a **cross-cutting fixture defect in 38 test files** that no prior pass has recorded.

## 1. Dead-coverage candidates — 4, unchanged, all four re-verified

### New test files — zero genuine candidates, and trap 4 fired again

Method unchanged from last pass (no new tooling, per the duty's charter): resolve every relative import in each new test file to a tracked repo path to get its *subjects*, build a reverse index of production (non-test) importers across all tracked `.ts`/`.tsx`, look up each subject, then check `package.json` before flagging anything under `scripts/`.

```
new test files since 2026-08-17:            35
subject edges examined:                    182
subjects with ZERO production importers:     1
test files with no local subject import:     0
```

The single flag is a **false positive, and it is trap 4 doing its job**:

| Flagged | Verdict |
|---|---|
| `scripts/check-generated-freshness.ts` (via `scripts/__tests__/check-generated-freshness.test.ts`) | **Live** — `package.json` `check:generated-freshness`, a blocking CI gate |

Had trap 4 not been in the method, this pass would have proposed deleting the freshness gate that guards every generated artifact in the repo. That is the third consecutive pass in which the entry-point check changed an answer, and it is worth keeping for that reason alone.

**Genuine dead-coverage candidates among the 35 new files: zero.**

### The 4 carried forward — each re-verified against the tree this pass

Per the process-work throttle (CLAUDE.md § Continuous Improvement), these are **logged here, not filed as tickets**. The weekly retro is the promotion point. None has changed state since 2026-08-17.

| Carried candidate | Re-verified this pass | Status |
|---|---|---|
| **SceneStatePanel cluster** (4 components) | Membership resolved rather than assumed: `SceneStatePanel.tsx` imports `ThreadStrip.tsx`, `DetectionThread.tsx`, `DriftIndicator.tsx` — that is the four. `SceneStatePanel`'s only importer anywhere in `src/` is its own test file. | Unchanged. Retire-or-wire call still belongs to **THR-964** (still `Idea`) — deleting it would pre-empt a design decision another ticket owns |
| **`AgentDetailPanel` unit** | The type-only trap (trap 2) still holds exactly: `AgentDetailPanel.tsx` has **1** production importer and it is `src/engine/activitySummary.ts` importing a *type*; `activitySummary.ts` itself has **0**. The pair is a closed island, reachable on paper and dead at runtime. | Unchanged. Still blocked on relocating a type out of live engine code |
| **`src/composition-dsl/` sub-island** | Directory still live — `schema.ts` has **12** importers including `src/components/Game/debug/CompositionView.tsx`, a real production component. The sub-island is `harness.ts` (0 importers) → `validator.ts` → `findCard.ts` → `mutationGate.ts`, with no importer from outside the directory. | Unchanged. THR-952's "decide as a whole unit" rule still spares it |
| **THR-997** — reach-keyed `modifiers` on seeded `possesses` edges | Confirmed independently by this morning's T3 detector run: `attachment-edge-modifiers` is still one of the 7 🔴 LEAKED rows on the interface map. | Unchanged |

## 2. Slowest test files — top 15, and one new entrant worth naming

Full local `npx vitest run --reporter=json`, 1056 files, 17291 tests, all passing. Summed file time **377.5s**.

| # | Duration | Share | File | vs. 2026-08-17 |
|---|---|---|---|---|
| 1 | 47.8s | 12.7% | `src/engine/__tests__/debugTickBatch.test.ts` | #1 → #1 |
| 2 | 41.7s | 11.0% | `src/engine/__tests__/edgeIntegrity.test.ts` | **NEW — absent from last week's top 15** |
| 3 | 31.8s | 8.4% | `src/engine/__tests__/content-layer1-integration.test.ts` | #2 → #3 |
| 4 | 29.2s | 7.7% | `src/engine/__tests__/doomIdentityMilestones.test.ts` | #3 → #4 |
| 5 | 21.7s | 5.7% | `src/engine/__tests__/contracts/agent-decision-pipeline.contract.test.ts` | #4 → #5 |
| 6 | 21.2s | 5.6% | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` | #5 → #6 |
| 7 | 21.0s | 5.6% | `src/engine/__tests__/traceBuffer-integration.test.ts` | #6 → #7 |
| 8 | 17.6s | 4.7% | `src/engine/__tests__/tickHealth-integration.test.ts` | #7 → #8 |
| 9 | 8.0s | 2.1% | `scripts/__tests__/worktree-write-guard.test.ts` | #8 → #9 |
| 10 | 7.7s | 2.0% | `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` | #9 → #10 |
| 11 | 6.1s | 1.6% | `src/engine/__tests__/graphOpExecutor.tradeVerbs.test.ts` | **NEW** |
| 12 | 4.8s | 1.3% | `src/engine/__tests__/chapterArchive.test.ts` | #11 → #12 |
| 13 | 4.6s | 1.2% | `src/engine/__tests__/interventionEffects-integration.test.ts` | #10 → #13 |
| 14 | 4.2s | 1.1% | `src/engine/__tests__/orchestrator.test.ts` | #13 → #14 |
| 15 | 4.2s | 1.1% | `src/components/Game/__tests__/DebugPanel-commands.test.tsx` | #12 → #15 |

**The top 10 hold 65.6% of summed file time**, against 1056 files (64.3% last week). Concentration is flat and remains this section's most useful fact.

**The "same 8 files hold the top 8" streak ended, and for a legible reason.** `edgeIntegrity.test.ts` arrived at **#2 with 11.0% of summed suite time on its own**, displacing everything below it by one. It is the test that shipped with THR-1176's edge-integrity audit (Done 2026-08-18) — a seeded-world sweep over every schema-constrained edge family, so a heavy runtime is intrinsic to what it checks rather than a defect. `graphOpExecutor.tradeVerbs.test.ts` at #11 is THR-1188's trade-verb rebinding, same shape.

Recorded as a **measurement, not a complaint**: one week added ~48s of summed suite time in two files, both of which buy real coverage of newly-typed graph writes. If the pattern repeats — each engine audit landing a 40s seeded sweep — the concentration figure will move, and that is the thing to watch rather than either file.

**Absolute durations are up ~27% week-on-week and are again not comparable.** This run overlapped the T3 detector batch, including `sweep:rank-reach`'s 900-tick simulation — the same contention last week's pass recorded and explicitly recommended avoiding. **That recommendation was not followed this pass** (the suite was launched while the detectors were still running, to fit both into one hourly slot) so the caveat is repeated rather than resolved: **ranking and the share column are the comparable signals; the absolute seconds are not.** Documented wall-time variance on this repo is up to 2.2×.

**None of these is a deletion candidate.** Standing rule, every sweep: slowness ranks optimisation priority and is *never* grounds for deletion.

## 3. Duplicated coverage — the standing verdict, not re-derived

Last pass ruled this section undeliverable as chartered (assertion-level comparison across 1000+ files needs tooling the duty is forbidden to build) and recommended **retiring section 3**, leaving sections 1 and 2 to stand on their own. That recommendation is for the weekly retro to rule on, and today *is* the retro day.

**Nothing is re-derived here.** Re-stating the same inability a fifth time is the "trains its reader to skip it" failure the T3 charter warns about. The recommendation stands unchanged; the retro owns the verdict.

## New this pass — a fixture defect in 38 test files

Not a dead-coverage or timing finding, so it belongs in neither section above, but it came out of this run and no prior pass has recorded it.

`vite:esbuild` emitted **84 `Duplicate key` warnings across 38 test files** during the run:

| Duplicated key | Warnings |
|---|---|
| `loyalty_ambition` | 38 |
| `mercy_ruthlessness` | 36 |
| `sacrifice_survival` | 10 |

All three are value axes, duplicated inside an `AxiologicalProfile`-shaped object literal in test fixtures — worst concentrations in `actionCandidates.test.ts` (12), `interventionEffects.test.ts` (5), `backstoryResolvers.test.ts` (4) and `ScryOverlay.test.tsx` (4).

**Why it is worth a line even though nothing is failing.** A duplicate key means the *first* value is silently discarded — so each of these fixtures declares fewer distinct axes than it appears to. It is inert **today** only because the fixtures set every axis to the same value (`0.5`), which makes the discard unobservable. The moment a test sets differing values per axis to check axis-specific behaviour, one axis will silently take the wrong value and the test will assert against a profile it did not write. That is a latent vacuous-test generator of exactly the class this repo has logged repeatedly.

**Not filed.** No loss has been measured, nothing player-facing is affected, and per the process-work throttle a sub-bar finding is a log row rather than a ticket. Recorded here so the retro can batch it if it recurs or if someone hits the latent case. The fix is mechanical (delete the duplicate line in each fixture) and would be a reasonable rider on any pass already editing these files.

## Methodology notes

The four standing traps were applied and two of them changed an answer this pass:

1. **Test-only helpers look dead by design** — excluded before flagging.
2. **A type-only import marks dead runtime code reachable** — this is the whole reason the `AgentDetailPanel` unit still reads as having an importer (**fired**).
3. **A test file named after a dead module may not test it** — read the test's imports, never its filename.
4. **A CLI script's entry point is `package.json`, not an import** — the sole flag this pass (**fired**).

## Does this duty renew?

Christian's 2026-08-10 sunset rule: a probe that has not caught a real defect in six weeks is presumed deletable, and keeping it requires evidence.

**Sections 1 and 2 renew on evidence, both of it recent.** Section 1's output was consolidated into THR-1089 and executed 2026-08-15 (11 dead units, 10 dead test files, −2085 lines), and its re-verification guardrail has now correctly *spared* two candidates that a naive sweep would have deleted — `encounterNarration.ts` last pass, `check-generated-freshness.ts` this one. Section 2 produced a named, legible new finding this week rather than a repeat.

**Section 3 has produced nothing in five passes** and its retirement recommendation is on the retro's table today. This sweep does not decide its own charter.
