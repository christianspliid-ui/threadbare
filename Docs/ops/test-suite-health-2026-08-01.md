---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-08-01 (inaugural, manual)
deadCoverageCandidates: 12
slowFilesReported: 15
ticketsFiled: 3
---
# Test-suite health — inaugural sweep (2026-08-01Z / 2026-08-02 local)

First run of the test-suite health duty (THR-942). Executed manually rather than by a scheduled `tb-orchestrator` T3 pass, because the duty is landing in the same change; from here it runs weekly on `ORCH_TESTHEALTH_DOW` (Monday).

**Nothing was deleted.** Three prune tickets were filed with the evidence attached — THR-950, THR-951, THR-952 — and each requires independent re-verification before any deletion. That separation is the duty's central guardrail, not a formality.

## Method

No new tooling was added (the duty forbids it). An ad-hoc import-graph sweep over `src/` + `scripts/` + root config resolved every static `import` / `export … from`, bare side-effect import, dynamic `import()` and `require()` to an on-disk file, then computed reachability from real entry points: `src/main.tsx`, `src/App.tsx`, `src/cli/`, `scripts/`, `vite.config.*`, `vitest.config.*`, `src/debug-bridge.ts`.

A **dead-coverage candidate** is a test file where *every* subject module it imports is both unreachable from an entry point and has zero production importers outside its own directory. Each candidate was then re-checked with a whole-repo string grep for the module basename, to catch registry/dynamic references an import graph cannot see.

**Detector validation (positive control).** The sweep was re-run against `1aa6fc4e^` — the tree immediately before THR-941 deleted the dead V1 SVG hex map — and it flagged `src/components/HexMap/__tests__/HexDefs.test.tsx`. On the current tree it flags nothing under `src/components/HexMap/`, which no longer exists. The detector therefore responds to a known-dead cluster appearing and disappearing.

## Totals

| Measure | Value |
|---|---|
| Code files scanned (`src/` + `scripts/` + root) | 2,359 |
| Test files | 931 |
| Production files | 1,427 |
| Reachable from an entry point | 1,339 |
| Unreachable production files | 113 |
| **Dead-coverage candidates** | **12** |
| Tests executed (full suite, local) | 14,592 passed / 0 failed |

## 1. Dead-coverage candidates — 12

All 12 are filed. Every module below has zero production importers outside its own directory, is unreachable from every entry point, and returned no dynamic references on a string grep.

| Test file | Subject(s) | Prod importers | Last touched | Ticket |
|---|---|---|---|---|
| `src/engine/__tests__/artSelection.test.ts` | `engine/artSelection.ts` | 0 | 2026-04-06 | THR-950 |
| `src/engine/__tests__/color.test.ts` | `engine/color.ts` | 0 | 2026-03-30 | THR-950 |
| `src/engine/__tests__/culturalInsight.test.ts` | `engine/culturalInsight.ts` | 0 | 2026-03-30 | THR-950 |
| `src/engine/__tests__/ghostDots.test.ts` | `engine/ghostDots.ts` | 0 | 2026-03-30 | THR-950 |
| `src/engine/__tests__/hexTooltipProse.test.ts` | `engine/hexTooltipProse.ts` | 0 | 2026-03-30 | THR-950 |
| `src/components/Game/Encounter/__tests__/SceneStatePanel.test.tsx` | `SceneStatePanel` + `ThreadStrip`, `DriftIndicator`, `DetectionThread` | 0 (root) | 2026-05-07 | THR-951 |
| `src/components/Game/__tests__/AttachmentRow.test.tsx` | `Game/AttachmentRow.tsx` | 1 (unrendered parent) | 2026-03-30 | THR-952 |
| `src/components/HexMapV2/signifiers/__tests__/compositionResolver.test.ts` | `signifiers/compositionResolver.ts` | 0 | 2026-03-30 | THR-952 |
| `src/composition-dsl/__tests__/mutationGate.test.ts` | `composition-dsl/mutationGate.ts` | 2 (closed island) | 2026-04-20 | THR-952 |
| `src/lib/__tests__/hexGrouping.test.ts` | `lib/hexGrouping.ts` | 0 | 2026-03-30 | THR-952 |
| `src/services/narration/__tests__/encounterNarration.test.ts` | `services/narration/encounterNarration.ts` | 0 | 2026-03-30 | THR-952 |
| `src/types/__tests__/climate.test.ts` | `types/climate.ts` | 0 | 2026-03-30 | THR-952 |

Two candidates carry a judgement call and were filed with it stated rather than as straight deletions: the **SceneStatePanel cluster** names live encounter concepts (drift, detection, threads) and may be built-ahead-of-wiring rather than retired — THR-951 makes "file a wiring ticket instead" an explicitly valid outcome. **`AttachmentRow`** depends on whether its unrendered parent `AgentDetailPanel.tsx` is dead, so THR-952 sequences the parent first.

## 2. Slowest test files — top 15

From a full local `vitest run` (937 files reported, 14,592 tests, all passing). Wall clock **61.2s** across the three pools; summed per-file duration **263.9s**.

| # | Duration | Share | File |
|---|---|---|---|
| 1 | 33.8s | 12.8% | `src/engine/__tests__/debugTickBatch.test.ts` |
| 2 | 27.4s | 10.4% | `src/engine/__tests__/content-layer1-integration.test.ts` |
| 3 | 25.4s | 9.6% | `src/engine/__tests__/doomIdentityMilestones.test.ts` |
| 4 | 20.3s | 7.7% | `src/engine/__tests__/contracts/agent-decision-pipeline.contract.test.ts` |
| 5 | 17.6s | 6.7% | `src/engine/__tests__/traceBuffer-integration.test.ts` |
| 6 | 17.4s | 6.6% | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` |
| 7 | 13.3s | 5.0% | `src/engine/__tests__/tickHealth-integration.test.ts` |
| 8 | 8.3s | 3.2% | `scripts/__tests__/worktree-write-guard.test.ts` |
| 9 | 7.1s | 2.7% | `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` |
| 10 | 5.0s | 1.9% | `src/engine/__tests__/chapterArchive.test.ts` |
| 11 | 4.8s | 1.8% | `src/engine/__tests__/contracts/mark-reveal-liveness.contract.test.ts` |
| 12 | 4.1s | 1.6% | `src/components/Game/__tests__/DebugPanel-commands.test.tsx` |
| 13 | 4.0s | 1.5% | `src/engine/__tests__/interventionEffects-integration.test.ts` |
| 14 | 3.7s | 1.4% | `src/engine/__tests__/coastline-integration.test.ts` |
| 15 | 3.7s | 1.4% | `src/engine/__tests__/orchestrator.test.ts` |

Concentration is extreme: the **top 10 files are 66.5% of summed file time**, and 7 files exceed 10s while only 10 exceed 5s at all — the remaining ~921 files are collectively cheap. Every one of the top 7 is an engine integration or contract test that drives real ticks, so the cost is inherent to what they cover, not obviously waste.

**None of these is a deletion candidate, and none appears in the prune tickets.** Slowness ranks where optimisation effort would pay; it is never grounds for deletion. Keeping the two lists apart is a standing rule of this duty.

## 3. Duplicated coverage — not meaningfully assessed

**Reporting this as not-assessed rather than clean.** The naive metric (subjects imported by ≥5 distinct test files) returns 116 subjects, topped by `src/engine/graph.ts` (387 test files), `src/types/gameState.ts` (213) and `src/engine/traceBuffer.ts` (125). Those are precisely the high-impact hub modules CLAUDE.md already lists — the metric is measuring "how many tests import shared infrastructure", which is not the question. Real duplicated coverage means overlapping *assertions* on one module's behaviour, which needs assertion-level comparison this sweep did not do.

Next week's pass should either compare assertion text within a directory or drop the section rather than keep publishing hub counts as findings.

## Methodology findings worth keeping

Three traps surfaced here and are now written into the duty text, because each produces a confidently wrong answer:

1. **A test-only helper looks dead.** `src/testing/contentInvariants.ts` has zero *production* importers by design — only tests import it. A widened "any subject dead" variant of the sweep surfaced 60 candidates, largely this artefact, and was discarded as too noisy to file from.
2. **A type-only import is not a live rendering path.** `src/components/Game/AgentDetailPanel.tsx` is never rendered, yet `src/engine/activitySummary.ts` does `import type { ActivitySummary }` from it, which a naive graph reads as reachable.
3. **A test named after a dead module may not test it.** Of the 8 test files THR-941 deleted with the V1 hex map, only 7 imported a V1 component. `AgentDots.test.tsx` imported **only** `src/data/agent-visual-content` — a live module. Read imports, never filenames.

**THR-941 re-verified as safe.** Because of finding 3, this sweep checked whether that deletion orphaned live coverage. `src/data/agent-visual-content.ts` retains 5 covering test files including a dedicated `src/data/__tests__/agent-visual-content.test.ts`, so no coverage was lost. Recorded as a near-miss rather than a defect — the same pattern with a less-covered module would have silently removed a real regression test.

## Sensitivity — what this sweep does not catch

The strict rule (**every** subject dead) is deliberately conservative and under-reports. On the pre-THR-941 tree it flagged 1 of that cluster's 8 test files: the other 7 imported a dead V1 component *and* a live shared module such as `types/` or `lib/hexMath`, so the all-subjects-dead rule excluded them. A test that exercises one dead module alongside live ones will not appear here. The widened variant that would catch them is too noisy to act on (finding 1), so this gap is accepted and stated rather than closed — an unmeasured case reported as clean is the pathology T3 exists to prevent.
