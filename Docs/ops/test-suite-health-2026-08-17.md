---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-08-17 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 4
slowFilesReported: 15
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-08-17

Fourth run of the duty (THR-942), one week after 2026-08-10. **This is the first pass with a materially different answer than the week before it**: the duty's entire filed backlog was executed on 2026-08-15, and section 1 was measured rather than deferred for the first time since the inaugural sweep.

Suite: **1028 files, 16492 tests, all passing**, `npx vitest run` exit 0.

## 1. Dead-coverage candidates — 12 → 4, and the 12 were *acted on*

### What happened to the inaugural sweep's candidates

The three prune tickets this duty filed (THR-950, THR-951, THR-952) were **canceled on 2026-08-11T20:24Z**. Last week's pass reported them as "still Ready for Dev, unclaimed, un-re-verified" — that state ended the next day, and a reader diffing on state alone would conclude the duty's output was thrown away. It was not:

> *"Consolidated into THR-1089 (Christian's 2026-08-11 queue review: one batched dead-code sweep instead of seven queue slots). The evidence in this ticket remains the authoritative record for its modules."* — cancel comment on THR-950

**THR-1089 shipped 2026-08-15** ([PR #1467](https://github.com/christianspliid-ui/threadbare/pull/1467), commit `4aa2163a`): **11 units deleted, 21 files, −2085 lines**, of which **10 were test files** that had been running on every CI cycle. Verified against the tree this pass — `artSelection`, `color`, `culturalInsight`, `ghostDots`, `hexTooltipProse`, `compositionResolver` (+`compositionTypes`), `hexGrouping`, `types/climate`, `RetinuePanel`, `checkMarkReveals`, `summarizeEncounterPoolDominance` are all gone.

**The re-verification guardrail earned its place.** One candidate — `services/narration/encounterNarration.ts` — had **gained a production importer** (`ProseTtsButton.tsx:18`) between the 2026-08-02 evidence and the 2026-08-15 pickup. The original evidence was correct when written and wrong when executed. That is the precise failure this duty's standing "the sweep's evidence is a candidate, not a verdict" rule exists to prevent, and it fired.

### The 4 that survived — carried forward, not re-filed

Per the process-work throttle (CLAUDE.md § Continuous Improvement, 2026-08-10), these are **logged here, not filed as tickets**. The weekly retro is the promotion point.

| Carried-forward candidate | Why it survived | Owner |
|---|---|---|
| **SceneStatePanel cluster** (4 components) | *Unwired, not retired* — THR-951's own expected outcome. Renders `DETECTION_THRESHOLD_*` / `CHOICE_DRIFT_MAGNITUDE_*`, whose retire-or-wire call belongs to **THR-964** (still `Idea`). Deleting it would pre-empt a design decision another ticket owns. | THR-964 |
| **`AgentDetailPanel` unit** (1186 lines + `AttachmentRow` + `activitySummary.ts` + 2 test files) | Unrendered, but exports `ActivitySummary` to `src/engine/activitySummary.ts`. Removing it means editing live engine code to relocate a type — THR-1089 predicate rule 3, so noted rather than done. | unassigned |
| **`src/composition-dsl/` sub-island** (`mutationGate` ↔ `findCard` ↔ `validator`) | The *directory* is live (`schema.ts` has five production importers), so THR-952's "decide as a whole unit" rule spared it. The sub-island genuinely has no outside importers. | unassigned |
| **THR-997** — reach-keyed `modifiers` on seeded `possesses` edges | Argument-level deadness across ~11 write sites; a separate engine change deserving its own gate run, not a rider on a 2085-line deletion. Still a 🔴 LEAKED row on the interface map. | unassigned |

Minor cascade recorded by THR-1089 and still true: `GHOST_DOT_INITIAL_OPACITY` / `GHOST_DOT_DECAY_TICKS` in the live `agent-visual-content.ts` are now test-only.

### New test files — assessed, not deferred

The last two passes reported the newly-added files as **"not assessed"**, because a reliable check needs a real import graph rather than a filename guess. That was the honest call then and it has now been closed rather than repeated a third time.

Method (no new tooling, per the duty's charter): resolve every relative import in each new test file to a tracked repo path to get its *subjects*, then build a reverse index of production (non-test) importers across all 4000+ tracked `.ts`/`.tsx` files and look up each subject.

```
new test files since 2026-08-10:            57
subject edges examined:                    267
subjects with ZERO production importers:     3
test files with no local subject import:     1
```

**All 4 flagged results are false positives, and one of them is a new trap class:**

| Flagged | Verdict |
|---|---|
| `scripts/check-typecheck-ratchet.ts` | Live — `package.json:26` `check:typecheck` |
| `scripts/repair-donor-node-modules.ts` | Live — `package.json:104` `repair:donor-node-modules` |
| `scripts/check-ping-gate.ts` | Live — `package.json:47` `check:ping-gate` |
| `src/types/__tests__/trace-cast-ratchet.test.ts` | No local subject **by design** — a source-level `readFileSync` scan. Its own header explains why: a type-level probe "cannot see [the defect] by construction — it would be the vacuous test this file exists to replace." |

**Genuine dead-coverage candidates among the 57 new files: zero.**

## 2. Slowest test files — top 15

Full local `npx vitest run --reporter=json`, 1028 files, 16492 tests, all passing. Summed file time **298.1s**; wall clock 101.7s.

| # | Duration | Share | File |
|---|---|---|---|
| 1 | 40.1s | 13.5% | `src/engine/__tests__/debugTickBatch.test.ts` |
| 2 | 29.2s | 9.8% | `src/engine/__tests__/content-layer1-integration.test.ts` |
| 3 | 26.9s | 9.0% | `src/engine/__tests__/doomIdentityMilestones.test.ts` |
| 4 | 22.1s | 7.4% | `src/engine/__tests__/contracts/agent-decision-pipeline.contract.test.ts` |
| 5 | 19.1s | 6.4% | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` |
| 6 | 18.6s | 6.2% | `src/engine/__tests__/traceBuffer-integration.test.ts` |
| 7 | 13.9s | 4.7% | `src/engine/__tests__/tickHealth-integration.test.ts` |
| 8 | 10.2s | 3.4% | `scripts/__tests__/worktree-write-guard.test.ts` |
| 9 | 7.1s | 2.4% | `src/engine/__tests__/contracts/encounter-experience.contract.test.ts` |
| 10 | 4.5s | 1.5% | `src/engine/__tests__/interventionEffects-integration.test.ts` |
| 11 | 4.1s | 1.4% | `src/engine/__tests__/chapterArchive.test.ts` |
| 12 | 4.0s | 1.4% | `src/components/Game/__tests__/DebugPanel-commands.test.tsx` |
| 13 | 3.9s | 1.3% | `src/engine/__tests__/orchestrator.test.ts` |
| 14 | 3.7s | 1.2% | `src/engine/__tests__/coastline-integration.test.ts` |
| 15 | 3.3s | 1.1% | `src/engine/__tests__/contracts/threaded-agent-balance.contract.test.ts` |

**The top 10 hold 64.3% of summed file time**, against 1028 files. Concentration is unchanged and remains the single most useful fact in this section.

**The same 8 files hold the top 8** as both prior sweeps, with one adjacent swap (`doomIdentityMilestones` and `agent-decision-pipeline.contract` traded #3/#4 back).

**Absolute durations are up ~40% and that is this sweep's own fault, not a regression.** Last week's numbers were measured on an idle machine; this run's suite executed concurrently with the T3 detector batch, including `sweep:rank-reach`'s 900-tick simulation. That is within the documented up-to-2.2× wall-time variance. **Do not read these absolute numbers as a slowdown** — the ranking and the share column are the comparable signals, and both are flat. Next pass should run the suite before the detectors rather than alongside them.

**None of these is a deletion candidate.** Standing rule, every sweep: slowness ranks optimisation priority and is *never* grounds for deletion.

## 3. Duplicated coverage — a verdict, not a third deferral

This section has now carried an identical unresolved question through three consecutive passes: the hub-count metric (subjects imported by ≥5 test files) measures shared-infrastructure fan-in rather than duplicated assertions, and was rejected as noisy on 2026-08-03. Last week's pass flagged that it was becoming "a third silent no-op."

**Verdict, made rather than deferred again:** the section as chartered is undeliverable by this duty. Detecting overlapping *assertions* across 1028 files requires assertion-level comparison tooling; the duty's own guardrails forbid building new tooling, and a manual diff at this scale is not a weekly-sweep-sized task. So the honest options are exactly two, and both belong to the weekly retro, not to a sweep:

1. **Charter the tooling** as its own ticket, with a cost/benefit line — and accept that no duplicated-coverage finding exists until it ships; or
2. **Retire section 3** from the duty and let sections 1 and 2 stand on their own.

**Recommendation: option 2.** Sections 1 and 2 have both now demonstrably produced action (section 1 → THR-1089's 2085-line deletion; section 2 → a stable concentration measurement). Section 3 has produced nothing in four passes and re-states its own inability every week, which is the "trains its reader to skip it" failure the T3 charter explicitly warns against. Per the process-work throttle this is **logged, not filed**.

## Methodology notes

The three traps from the inaugural sweep still hold and were applied: test-only helpers look dead by design; a type-only import marks dead runtime code reachable; a test file named after a dead module may not test it.

**A fourth trap, new this pass:** **a CLI script's entry point is `package.json`, not an import.** All three zero-importer subjects found this week were live npm-script entry points. Any future import-graph sweep over `scripts/` must check `package.json` before flagging, or it will propose deleting the repo's own gates.

## Standing question for the retro — does this duty renew?

Christian's 2026-08-10 sunset rule: a probe that has not caught a real defect in six weeks is presumed deletable, and keeping it requires evidence.

**The evidence exists and is unambiguous.** This duty's output was consolidated into THR-1089 and executed on 2026-08-15: 11 dead units and 10 dead test files removed, −2085 lines, and one candidate correctly *spared* because re-verification found it had come back to life. Section 2's concentration finding is stable and cheap. **Sections 1 and 2 renew on merit; section 3 is the part to cut** (see above). Recorded here for the retro to rule on — this sweep does not decide its own charter.
