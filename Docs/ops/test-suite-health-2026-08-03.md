---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-08-03 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 12
slowFilesReported: 15
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-08-03

Second run of the duty (THR-942), first on the regular Monday cadence — one day after the 2026-08-01 inaugural sweep (`Docs/ops/test-suite-health-2026-08-01.md`). Diffed against that baseline rather than re-run from scratch.

## 1. Dead-coverage candidates — 12, unchanged

All three prune tickets from the inaugural sweep (THR-950, THR-951, THR-952 — 12 candidates total) are still `Ready for Dev`, unclaimed, un-re-verified. No deletions have happened, so the candidate set is unchanged; not re-listing it here (see the 2026-08-01 report for the full table).

**14 test files were added since the inaugural sweep** (`git log --since <sweep time> --diff-filter=A -- '*.test.ts' '*.test.tsx'`): sound-design wiring, nudge-stage iconography/pips/prose-enrichment, aftermath-consequence adapters, hunger-id bridge, slice fork aftermath resolution, and outcome-band types — all part of the active THR-883/THR-969-973 aftermath work landing this week. **Not rigorously re-verified this pass**: a quick importer grep against guessed module paths returned mostly "file not found," meaning the naive basename-matching heuristic doesn't reliably locate these modules' actual subjects (several live inside `encounter-stage/adapters/` or similarly nested paths the guess missed). Rather than file false candidates off an unreliable check — exactly the noisy-widened-variant trap the inaugural sweep already logged — this is reported as **not assessed**, not clean. A proper pass needs the same node-level import-graph the inaugural sweep built by hand, not a shell grep. Flagging for next week rather than guessing now.

## 2. Slowest test files — top 15 (full local `vitest run`, 951 files, 14,817 tests, all passing)

| # | Duration | File |
|---|---|---|
| 1 | 34.9s | `src/engine/__tests__/debugTickBatch.test.ts` |
| 2 | 28.6s | `src/engine/__tests__/content-layer1-integration.test.ts` |
| 3 | 26.4s | `src/engine/__tests__/doomIdentityMilestones.test.ts` |
| 4 | 21.3s | `src/engine/__tests__/contracts/agent-decision-pipeline.contract.test.ts` |
| 5 | 19.2s | `src/engine/__tests__/traceBuffer-integration.test.ts` |
| 6 | 19.2s | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` |
| 7 | 15.0s | `src/engine/__tests__/tickHealth-integration.test.ts` |
| 8 | 11.1s | `scripts/__tests__/worktree-write-guard.test.ts` |
| 9 | 7.2s | `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` |
| 10 | 6.0s | `src/engine/__tests__/interventionEffects-integration.test.ts` |
| 11 | 4.8s | `src/components/Game/__tests__/DebugPanel-commands.test.tsx` |
| 12 | 4.6s | `src/engine/__tests__/orchestrator.test.ts` |
| 13 | 4.6s | `src/engine/__tests__/chapterArchive.test.ts` |
| 14 | 4.0s | `src/__tests__/debug-bridge.test.ts` |
| 15 | 3.9s | `src/engine/__tests__/coastline-integration.test.ts` |

**Same 7 files hold the top 7 spots as the 2026-08-01 baseline**, same rank order, absolute durations up ~3-8% (34.9s vs 33.8s top file; summed measured differently — this run's totals aren't directly comparable to baseline's 263.9s since this capture used per-file `startTime`/`endTime` from the JSON reporter across 3 parallel pools, not a serial sum). Per the documented variance note (full-suite wall time varies up to 2.2x run-to-run on unchanged code), this reads as noise, not drift — no new file entered the top 10, nothing here is a new finding. `chapterArchive.test.ts` and `debug-bridge.test.ts` are new entrants at #13/#14 displacing baseline's #14/#15 (`interventionEffects-integration` moved up instead) — reshuffling within the already-cheap tail, not a new slow file.

**None of these is a deletion candidate.** Same standing rule as the inaugural sweep: slowness ranks optimisation priority, never deletion grounds.

## 3. Duplicated coverage — still not meaningfully assessed

Carrying forward last week's verdict rather than re-running the same noisy hub-count metric it already rejected (116 subjects imported by ≥5 test files, topped by `graph.ts`/`gameState.ts`/`traceBuffer.ts` — measuring shared-infrastructure fan-in, not duplicated assertions). Last week's report recommended this section either gets an assertion-level comparison or gets dropped. Neither happened this pass — no new tooling was built (duty forbids it) and a manual assertion-diff across 951 files wasn't attempted given the rest of this run's scope. Recording the same open question rather than a third silent carry-forward: **whether to build the assertion-comparison or retire this section is now a call worth someone actually making**, not a stale line quietly repeated line-for-line each week.

## Methodology note

This pass leaned on the inaugural sweep's own findings (the three traps: test-only helpers, type-only imports, filename-doesn't-match-subject) rather than re-deriving them — they still hold, nothing here contradicts them.
