---
lane: tb-orchestrator
run: 2026-09-07j
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-07 (run j, ~09:27–09:35Z)

**Run i found a ticket already shipped under another number. This run checked the strongest remaining `Idea` candidate and found the opposite shape: a ticket whose premise is live but whose *stated reason for being Low* is factually wrong — and which is nonetheless correctly Low, on evidence nobody had measured.** The correction matters more than the ticket: a future reader was going to inherit a claim that a gate blocks when it cannot.

## Needs Christian

**Both standing asks are unchanged and are restated only so the briefing keeps carrying them** — the hourly brief reads this section from the newest report, so dropping them here drops them from your inbox. I am not re-arguing either.

1. **[Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** — still the biggest thing one answer from you can move. *"Batch 2, run the six"* puts six encounters of content work on the build queue the same hour. The brief is the [4 September one](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md).
2. **[Regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** for Meet The First — costs image-generation credits, which is why it needs a yes or no before anyone runs it. Nothing is broken meanwhile; substitutes are standing in.

If you only answer one, answer the batch.

**Wayfinder questions unchanged and not restated.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **53 `Todo`**, **71 `Idea`**, **0 `Ready for Dev`**, **2 `In Dev`** — both carrying `Parked`, so **zero live**. The executor's WIP=1 slot is free with nothing to put in it, for the **sixth consecutive run**.

**Nothing on the board moved since run i.** A `-PT75M` sweep returns three touched issues, all of them run i's own work on THR-716 / THR-933 / THR-1088. Standing `Todo` declines keep their evidence in [runs a–h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07h.md) and are not re-derived.

**Wayfinder issues skipped unconditionally:** 22 of the 53 `Todo` items carry a `wayfinder:*` label.

### The first candidate with a date on it — [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn)

**Declined: unmet time gate. The window opens tomorrow, 2026-09-08.**

Worth naming rather than burying in a decline list, because on a shelf that has read empty for six runs this is the only candidate with a known arrival time. Its body says *"do not action before 2026-09-08; the burn-in window is the whole point"*, and the date is also pinned in code as `GUIDANCE_GATE_MODE.flipReviewAfter` so it cannot lapse by inattention.

It is **promotion-ready the moment the window opens**: no blockers (`blockedBy: []` on a relations query), no assignee, and it already carries a complete coordination block in its own description — `Suggested model: sonnet`, `Parallel-safe with`, and a `Mutex with` that states its reason inline (`any other ticket editing .github/workflows/ci.yml`). The next run after 00:00Z tomorrow should promote it without re-deriving any of this.

### New finding — [THR-984](https://linear.app/threadbare/issue/THR-984/npm-run-lintplan-doc-with-no-args-lints-zero-files-and-always-reports-a)'s premise is live, its severity rationale is wrong, and its priority is right anyway

Checked because on an empty shelf it has the strongest promotable shape in `Idea`: a concrete tooling defect, no design question, no blockers, no assignee. Verified against the tree at `198310f0`.

**The premise holds.** `parseCli` defaults `mode` to `'paths'` with an empty path list, so a bare invocation lints nothing and exits 0:

```
$ npm run lint:plan-doc
lint:plan-doc skipped (no candidate files found).
exit=0
```

**The correction.** The 2026-08-02 coordination comment set the priority on this:

> *"A malformed plan doc cannot reach `main` through a normal commit, because the hook passes `--staged` and does lint."*

The hook does lint. It does not block. `printFindings` ends `return strict && errors.length > 0 ? 1 : 0`, and **nothing anywhere passes `--strict`** — `.husky/pre-commit` is the only call site in the repo (`npm run lint:plan-doc -- --staged`), and no CI workflow invokes it at all. Measured: `--all` prints 16,733 errors and still exits 0. The plan-doc lint is advisory at every call site it has, and `--strict` is dead code reachable only by hand.

**Why the ticket is still correctly Low — and why the alarming number is a trap.** 561 of 675 plan docs carry ≥1 ERROR, and that figure should not be quoted as a defect count: the checks are the *template* schema, and most of the corpus predates the template. It measures the lint's inertness, not 561 broken documents. The measurement that actually answers "is advisory enough?" restricts to docs written under the hook (shipped 2026-07-21):

> **Of 131 plan docs added in the last 30 days, 3 carry any ERROR-severity finding.**

~98% clean under a gate that has never once blocked a commit. Authors read the advisory output and act on it. That is a better argument for Low than the one the ticket rests on, and it argues against escalating.

**The one thing worth changing is a doc fix, not a code fix.** `Docs/canon/verification-gates.md:29` — the authoritative gate law since THR-1336 — prescribes the **bare** form for docs-only diffs. `CLAUDE.md:191`, explicitly the *summary* of that page, prescribes `lint:plan-doc -- --staged`. The summary is right and the authority is wrong, so an executor following the authority runs the form that lints zero files and records a satisfied gate. Aligning that one line removes the defect from the surface where it actually misleads.

**Disposition: not promoted, stays `Idea`, [evidence comment posted](https://linear.app/threadbare/issue/THR-984/npm-run-lintplan-doc-with-no-args-lints-zero-files-and-always-reports-a).** No above-bar loss is quotable — 3 of 131, no artifact corrupted — so it does not clear the materiality bar for a process ticket, and per the process-work throttle this lane logs rather than files. Routed to the weekly retro, which can batch the one-line canon fix into the guidance-divergence sweep it already owns.

**No new ticket filed, deliberately.** The throttle's sole immediate-file exception is a loss corrupting work as it runs; 3-of-131 is not that.

## T1.5 — wayfinder sweep

**Four open maps, unchanged. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2).**

The budget went unused because nothing is eligible, and [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07g.md) established this board-wide rather than frontier-only: every `wayfinder:research` ticket in the workspace is `Done`, and the single `wayfinder:task` ([THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells)) is natively blocked by [THR-1402](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings), still `Todo`. Nothing has changed since, so that finding is cited rather than re-derived.

Every remaining frontier ticket across all four maps is `grilling` or `prototype` — HITL, untouchable by rule.

## T2 — design staging

**Triggered (shelf 0, floor 2) and barred. Nothing staged, nothing mutated.**

`In Design`: **2 live, 0 excluded** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (assigned, 4d) and [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (unassigned, 4d). Both under `ORCH_IN_DESIGN_STALE_DAYS` (7); neither carries `Parked`. The bound is 1, so staging needs **zero** live.

Runs g–i analysed this bound in full and that analysis stands, including that THR-1002 self-excludes once it crosses the staleness threshold and the count still lands at 1 — so T2 stays barred either way, and the only same-hour unbar is `Parked` on THR-790. **No comment posted on either issue**: a comment resets the staleness clock and silences the one automated nudge pointing at `Parked`.

## T3 — architecture health

**Skipped — already run today.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) was the first run after `ORCH_HEALTH_SWEEP_HOUR` and ran all four detectors, plus the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)).

**No detector ran this run, and none is reported clean.**

**Redundancy: not assessed this run.** The finding above came from code-reading and judgement during T1 candidate verification, not from a detector — recorded as such so `newFindings: 1` is not read as detector output.

**Hand-created `In Dev` tickets: not swept this run** — T3's daily budget is spent. Both `In Dev` items carry `Parked`.

## Escalations

**No Discord message, deliberately.** `keep-work-flowing-cc` owns that doorbell and runs at **09:45Z**, ten minutes from this run's close. Its step 2.6 reads `## Needs Christian` from the newest sibling report — this one — so both standing asks reach him through the owning lane almost immediately. A second lane pinging the same channel minutes ahead of it is a duplicate, not a faster path.

**Agreed work is not exhausted, but unblocked agreed work is** — for the sixth consecutive run. The stop-and-ask condition is still not triggered, because the constraint is not a question this lane needs answered: it is a queue whose refill valves are Christian's two pending answers and a design pass this lane may not run. **That changes tomorrow** — THR-1256's window opens 2026-09-08 and it is promotion-ready, which is the first non-Christian-gated refill in six runs.

**Nothing parked.**
