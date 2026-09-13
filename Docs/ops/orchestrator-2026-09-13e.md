---
lane: tb-orchestrator
run: 2026-09-13e
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-13 (run e, ~06:27Z)

## Needs Christian

**A finished fix has been stuck outside the game for seven hours, and nothing was ever going to come and get it.** That is the whole of what this hour found, and it is the only thing here worth your attention.

The fix is the one that makes the scene screen speak in sentences. It replaced *"Vara is oracle in eye."* with *"Vara is an oracle in Eye."* — and it turned out the broken shape was never about that one line: four of the eight reaches read that way at their top tier, and had since the line was written. It also replaced the bare fragment *"threads shifting"* with *"The threads are shifting."*, which was showing up in **every encounter that doesn't write its own forecast lines**, not just the one it was spotted on. → [Two factor lines on the scene screen are not sentences](https://linear.app/threadbare/issue/THR-1494/two-factor-lines-on-the-scene-screen-are-not-sentences-vara-is-oracle)

The work is done, tested and written up. The session finished it at 01:18 last night, set it to merge itself the moment the checks went green, and left — which is the normal, sanctioned way to finish. Six minutes later the automated check came back **red**, and a merge that is waiting for green simply waits forever. Nobody was still watching.

**The red is not a real failure.** One test out of 20,308 ran past a five-second limit on a slow machine; every other test passed, and the one that timed out has nothing to do with the text being fixed. The same suite passed in full on the machine that wrote it. Since then the game's main line has moved on twice, so the fix also now needs re-joining to it before it can land.

**What it needs is about two minutes of an attended session**: re-join it to main and push, which both clears the collision and re-runs the checks. I have not done it myself — this lane is deliberately barred from touching work another session has claimed, because that rule is what stops it from writing over something still running. → [pull request #1927](https://github.com/christianspliid-ui/threadbare/pull/1927)

The broader point, which is the actual finding: **"arm it and walk away" has no catcher when the check comes back red.** It has been assumed the builder lane would pick such a thing back up; it structurally cannot, for reasons in the T3 section below. Nothing else is stuck on you — the queue holds twelve pieces of work and one job is in progress.

## T1 — unblock sweep

Shelf at scan: **12** in `Ready for Dev`, **5** of them non-`Deferral`. Below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available and went unspent.

**30 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **15 were judged here.**

### Promoted — 0

**Zero new candidates arrived this hour.** The newest `Todo` item is still [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author) at 04:19Z, which [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t1--unblock-sweep) judged. The candidate count fell 31 → 30 exactly as expected: [THR-1502](https://linear.app/threadbare/issue/THR-1502/getactivitysummary-has-no-production-caller-its-only-renderer-was-the) left `Todo` when run d promoted it. No arithmetic is unaccounted for.

### Re-examined and left declined — 2, recorded because the re-examination was deliberate

Two of the seven design-staging items were re-opened this run rather than carried forward on their recorded grounds, because both had a mutex partner go `Done` overnight and that is the kind of movement that can change a verdict. It did not change either one, and the reason is worth stating so the next run does not re-litigate it a third time.

**[THR-1497](https://linear.app/threadbare/issue/THR-1497/catalystquery-is-repaired-and-gated-but-unreachable-from-the-live) — catalyst query unreachable.** Its coordination block reads `Blocked by: nothing` and names one mutex, [THR-1489](https://linear.app/threadbare/issue/THR-1489/content-model-slice-5-the-harness-closing-sweep-brief-die-composition) (content model slice 5), which went `Done` at **2026-09-12T22:45:52Z** with PR [#1926](https://github.com/christianspliid-ui/threadbare/pull/1926). So the mutex is moot and the dependency check passes cleanly — as it has every hour. The decline stands on **destination**, not dependency: its first Done-when is *"A decision recorded on whether the catalyst belongs on a **cell** … or whether the legacy pack arm is started deliberately for this,"* and the two below it are arms conditional on that decision. Its own block says *"the decision is a design one … answering it means reading the cells model and the grid dispositions rather than editing a field."*

**[THR-1495](https://linear.app/threadbare/issue/THR-1495/six-content-kinds-have-no-codex-category-so-their-content-cards-can) — six content kinds have no codex category.** Same shape. Its block declares parallel-safety with [THR-1492](https://linear.app/threadbare/issue/THR-1492/one-card-one-router-slice-3-sunset-the-duplicate-cards-delete-the), which merged overnight, so nothing there holds it either. It declines on destination: *"five of the six rows are a design judgment (should a player browse encounter templates at all?), not a mechanical fill."*

**The line these two sit on is [run d's](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13d.md#t1--unblock-sweep), and it holds.** A fork settled from measurable technical facts is executor work — that is why THR-1502 was promoted, its arms being *wire a reader* vs *delete dead code*, decidable from an import graph. A fork between two defensible directions is design input, which is why THR-1501 was declined. *Should a player be able to browse encounter templates at all* is a question about what the game means to whoever is playing it, and **the standing delegation to decide-and-invite-veto does not convert a direction question into a build ticket** — it governs how a decision is taken once someone is taking it, not whether this lane may route one to a builder. Both stay in the design-staging backlog.

### Declined — 13 more, all unchanged

No grounds moved. Five unblocked design input ([THR-1501](https://linear.app/threadbare/issue/THR-1501), [THR-790](https://linear.app/threadbare/issue/THR-790), [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1218](https://linear.app/threadbare/issue/THR-1218)); six design-gated or container epics ([THR-1156](https://linear.app/threadbare/issue/THR-1156), [THR-789](https://linear.app/threadbare/issue/THR-789), [THR-1393](https://linear.app/threadbare/issue/THR-1393), [THR-1381](https://linear.app/threadbare/issue/THR-1381), [THR-870](https://linear.app/threadbare/issue/THR-870), [THR-175](https://linear.app/threadbare/issue/THR-175)); one assigned to Christian ([THR-791](https://linear.app/threadbare/issue/THR-791)); one not executor work by construction ([THR-1220](https://linear.app/threadbare/issue/THR-1220), *Christian plays all five encounters*). Per-ticket evidence is in [run c's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t1--unblock-sweep) and is not restated.

**The design-staging backlog holds at seven.** Unchanged for three runs.

### A self-clearing mutex cleared itself — worth one line, because it was designed to

Run d promoted THR-1502 carrying `Mutex with: THR-1492 (both edit src/engine/activitySummary.ts)` **and a stated clearing test**, rather than holding the promotion until #1933 merged. That test has now fired:

```
$ git log origin/main --oneline -1 -- src/engine/activitySummary.ts
012c0ea5 refactor(thr-1492): sunset the duplicate cards, retire the rival section model
```

`AgentDetailPanel.tsx` is gone from `origin/main`. The mutex retired itself on evidence in **under two hours**, with no run of this lane needed to notice and lift it — which is the whole point of writing the test into Linear instead of the reason into an ops report. Recorded once as a working result; it needs no follow-up.

### Held by the ceiling — 0

Ninth consecutive run with zero held, from full headroom (shelf 12 against a threshold of 15) rather than a throttle.

## T1.5 — wayfinder sweep

**Three open maps, zero AFK-resolvable tickets — re-proved from labels this run, not carried forward.**

- `list_issues(label:"wayfinder:research")` → **21 of 21 `Done`**, workspace-wide.
- `list_issues(label:"wayfinder:task")` → **5 of 5 `Done`**.

All twelve open map children therefore carry `wayfinder:grilling` or `wayfinder:prototype`, which are HITL by construction and which this lane must not touch. `ORCH_WAYFINDER_AFK_MAX` (2) went unspent for the "AFK work is finished" cause, not the "found nothing I could do" cause — a distinction only visible if the labels are re-read, which is why they were.

No map or child has moved: the three maps ([Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)) last updated 2026-09-11T06:15–06:16Z, every child 2026-08-26 or earlier. **The twelve HITL questions are deliberately not re-enumerated to Christian this run** — they are unchanged, they were carried in full by runs c and d, and re-listing a static set hourly is the behaviour that trains a reader to skip the section. They are one click away in the maps above.

## T2 — design staging

**Not triggered.** The shelf holds **5** non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2 — two and a half times the floor.

Recorded because it would bar the tier independently: `In Design` holds **2 live, 0 excluded** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointment primitive, unassigned, touched 2026-09-12T22:26Z) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (a held town is a faction position, unassigned, touched 2026-09-12T07:23Z). Both are well inside `ORCH_IN_DESIGN_STALE_DAYS` (7) and neither carries `Parked`, so both count against `ORCH_MAX_IN_DESIGN` of 1. Over bound, unchanged, and not by this lane's hand — no state was mutated; the predicate is warn-only and the exit (`Parked`) is a human's.

## T3 — architecture health

**Skipped — already run today.** [Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t3--architecture-health) executed the full sweep at 04:27Z with four detectors, three new findings and a redundancy result. The tier is once-daily; **no detector was run this hour and none is reported as clean.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Next pass tomorrow.

### New finding — the armed-and-abandoned PR has no catcher

Runs c and d both surfaced [THR-1494](https://linear.app/threadbare/issue/THR-1494/two-factor-lines-on-the-scene-screen-are-not-sentences-vara-is-oracle)'s PR [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) as stuck and both deferred it to `pull-work` as the owner. **That deferral is void, and this run establishes why.** Three facts, none of which were on record before:

**1. The red check is a flake, not a defect.** This is a technical verdict and it is this lane's to make.

```
Test Files  1 failed | 1250 passed (1251)
     Tests  1 failed | 20307 passed (20308)
Error: Test timed out in 5000ms.
 ❯ src/engine/__tests__/orchestrator.test.ts:282  'runTick accumulates recent events'
```

One test of 20,308, failing on a **five-second timeout** on a runner that logged `import 257.22s`. THR-1494's diff touches factor-line producers — prose templates and a word-class table; `runTick` event accumulation is not downstream of any of it. The authoring session recorded `npm test -> 1251 files / 20308 tests passed` plus `test:heavy`, typecheck, build and all three freshness gates green on its own machine. This is the [CI-red-may-be-a-timeout](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) shape, and nobody had diagnosed it — run d recorded "a red required check" without opening it.

**2. `pull-work` structurally cannot recover it.** Step 1.8 treats `In Dev` + assigned + **no claim comment** as unclaimed and takes it. THR-1494 has two comments — a coordination block and a full shipped-evidence comment — so it reads as legitimately claimed and is left alone, correctly. The executor's candidate query is over `Ready for Dev`; a stranded `In Dev` PR is in no lane's field of view. **Seven hourly executor runs have passed since 23:24Z and none of them was ever going to look at it.**

**3. The failure mode is the sanctioned pattern, not a session error.** `gh pr merge --auto --merge` and "do not poll-wait on CI" (THR-675) is the correct closeout, and its stated safety is that GitHub holds the merge until the required check is green. The unexamined half is what happens when the check comes back **red** after the session has exited: auto-merge silently never fires, the branch goes `DIRTY` as `main` advances past it, and the work sits. Measured cost here: a complete, fully-gated fix held out of the game for **7h03m** and counting, with `main` having moved twice beneath it.

**Not filed as a ticket, deliberately.** The process-work throttle (CLAUDE.md § *Continuous Improvement*) bars scheduled lanes from filing process/infrastructure tickets; the sole exception is a loss actively corrupting work as it runs, and a stranded PR is stalled, not corrupting. This is an **impediment-log row and a weekly-retro input**, with the cost quoted above for whoever batches it. The immediate recovery — `git merge origin/main && git push` on `claude/affectionate-newton-61b9d1`, which clears the conflict and re-runs the checks in one action — is named in `## Needs Christian` for an attended session and is **not** performed here: this lane does not write to work another session has claimed, which is the invariant that keeps it from overwriting something still running (impediment #755).

### Standing, not re-reported

The redundancy judgement pass was **not** performed this run — T3 did not run. Run c's result stands; this line exists so the gap is not read as coverage.

## Escalations

**One question posted** to the escalation channel, non-blocking, with the run continuing past it: whether a lane should be given the job of re-checking PRs that armed auto-merge and then went red — and if so, which one. It is the generalisation of the finding above, it is a process-shape question rather than a technical one, and this lane is explicitly not the party that decides its own remit.

**Nothing parked.** No candidate this run was set aside for want of an answer; the two re-examined declines were resolved on the evidence and recorded above.
