---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-08-10 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 12
slowFilesReported: 15
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-08-10

Third run of the duty (THR-942), one week after 2026-08-03. Diffed against that baseline rather than re-run from scratch.

## 1. Dead-coverage candidates — 12, unchanged

The three prune tickets from the inaugural sweep (THR-950 — 5 engine modules, THR-951 — SceneStatePanel cluster, THR-952 — 6-module tail) are all still `Ready for Dev`, unclaimed, un-re-verified, exactly as they stood on 2026-08-03. No deletions have happened, so the candidate set is unchanged. Not re-listing the table here — see `Docs/ops/test-suite-health-2026-08-01.md` for the full evidence.

**14 test files were added between 2026-08-01 and 2026-08-03** (already noted last week, not re-flagged). Between 2026-08-03 and today the suite grew from 951 to **981 files** (+30) — the WS5/nudge content batches and this week's meeting-dilemma/aftermath work account for the bulk of it. Not rigorously re-verified against the import graph this pass either, for the same reason as last week: a reliable dead-coverage check needs the node-level import graph the inaugural sweep built by hand, not a filename-guess grep, and building that fresh for 30 new files wasn't attempted this run. Reported as **not assessed**, not clean.

## 2. Slowest test files — top 15 (full local `vitest run`, 981 files, 15,492 tests, all passing)

| # | Duration | File |
|---|---|---|
| 1 | 28.5s | `src/engine/__tests__/debugTickBatch.test.ts` |
| 2 | 19.0s | `src/engine/__tests__/content-layer1-integration.test.ts` |
| 3 | 18.0s | `src/engine/__tests__/contracts/agent-decision-pipeline.contract.test.ts` |
| 4 | 16.7s | `src/engine/__tests__/doomIdentityMilestones.test.ts` |
| 5 | 16.0s | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` |
| 6 | 16.0s | `src/engine/__tests__/traceBuffer-integration.test.ts` |
| 7 | 12.9s | `src/engine/__tests__/tickHealth-integration.test.ts` |
| 8 | 10.1s | `scripts/__tests__/worktree-write-guard.test.ts` |
| 9 | 8.9s | `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` |
| 10 | 6.1s | `src/engine/__tests__/chapterArchive.test.ts` |
| 11 | 5.2s | `src/engine/__tests__/interventionEffects-integration.test.ts` |
| 12 | 3.8s | `src/engine/__tests__/contracts/threaded-agent-balance.contract.test.ts` |
| 13 | 3.8s | `src/engine/__tests__/orchestrator.test.ts` |
| 14 | 3.5s | `src/components/Game/__tests__/DebugPanel-commands.test.tsx` |
| 15 | 3.2s | `src/engine/__tests__/grantedTraitConsumers.test.ts` |

**Same 9 files hold the top 9 spots as the 2026-08-03 baseline**, reshuffled by at most one rank each (`doomIdentityMilestones` and `agent-decision-pipeline.contract` swapped #3/#4; `encounter-liveness.contract` and `traceBuffer-integration` swapped #5/#6). Absolute durations down ~15-20% across the board (28.5s vs 34.9s top file) — this run had no other lane contending for CPU; reads as environment variance, not a suite speedup, per the documented up-to-2.2x wall-time variance note.

**Two new entrants in the tail:** `threaded-agent-balance.contract.test.ts` (#12) and `grantedTraitConsumers.test.ts` (#15), both new test files from this week's content work, displacing last week's `debug-bridge.test.ts` (#14) and `coastline-integration.test.ts` (#15) out of the top 15. Reshuffling within the already-cheap tail, not a new slow file — neither new entrant is remotely close to the top-9 durations.

**None of these is a deletion candidate.** Same standing rule as every prior sweep: slowness ranks optimisation priority, never deletion grounds.

## 3. Duplicated coverage — still not meaningfully assessed

Carrying forward the open question from 2026-08-03 rather than a third silent repeat: the hub-count metric (subjects imported by ≥5 test files) measures shared-infrastructure fan-in, not duplicated assertions, and was already rejected as noisy. Building an assertion-level comparison is new tooling, which this duty is not chartered to build; a manual assertion-diff across 981 files was not attempted this run either, for the same scope reason as last week. This section has now carried the identical unresolved question for two consecutive weekly passes without anyone deciding whether to build the real check or retire the section — flagging that explicitly rather than letting it become a third silent no-op.

## Methodology note

Leaned on the 2026-08-01 inaugural sweep's own findings (test-only helpers, type-only imports, filename-doesn't-match-subject) rather than re-deriving them — they still hold.
