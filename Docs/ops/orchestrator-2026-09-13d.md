---
lane: tb-orchestrator
run: 2026-09-13d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-13 (run d, ~05:30Z)

## Needs Christian

**One small job went into the build queue this hour and it needs nothing from you.** Last night's work deleted a panel nobody could reach; a calculation that only that panel ever used is now sitting in the engine with a test around it and no reader. The job is to decide whether an actor's *current activity* is something the character sheet ought to say — in which case it gets wired to a surface — or whether it goes, test and all. Both answers are fine and the builder can settle it from the code; I have flagged that it must wait its turn behind a job already touching the same file.

**The pile that is waiting on you has not changed since three hours ago**, so I am not re-arguing it: **seven pieces of work** need a design decision from you before anyone can build them, and **twelve map questions** are open across three maps. Both lists, with links and reasoning, are in [this morning's 04:27Z report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#needs-christian). Nothing has been added to either since.

**The build queue holds thirteen jobs and three are being worked on right now.** Nothing is starved.

## T1 — unblock sweep

Shelf at scan: **12** in `Ready for Dev`, **5** of them non-`Deferral`. Below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available.

**31 `Todo` candidates read** — one more than run c. 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **16 were judged here**, of which 15 are the standing set, unchanged and re-declining on the grounds already recorded.

### Promoted — 1

**[THR-1502](https://linear.app/threadbare/issue/THR-1502/getactivitysummary-has-no-production-caller-its-only-renderer-was-the) — `getActivitySummary` has no production caller.** `Low`, unassigned, `Content Architecture`, labels `Deferral` + `Engine`. Created 2026-09-13T05:15:43Z, fifteen minutes before this scan, by the in-flight [THR-1492](https://linear.app/threadbare/issue/THR-1492/one-card-one-router-slice-3-sunset-the-duplicate-cards-delete-the) session while re-verifying its importer greps.

- **Dependency:** `get_issue(includeRelations:true)` returns an empty `blockedBy`. No prose gate, no time gate. Its `relatedTo` links (THR-1492, THR-951) are references, not gates.
- **Plan-doc liveness:** trivial pass — names no plan doc.
- **Standing retire verdict (THR-990):** none; the issue had no comments at all. Which also means it was filed without a coordination block (THR-836), so the promotion comment is that block rather than a supplement to one.
- **Destination:** executor work, not design input. The (a)/(b) fork in its Done-when reads at first glance like the shape that got [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author) declined four hours ago, and it is worth being explicit about why it is not. THR-1501's arms are *retire a content vocabulary* vs *author new scenes* — a content-direction call, which its own body says outright. THR-1502's arms are *wire a reader* vs *delete dead code*, settled from an import graph and a read of what the live sheet already renders. That is a technical disposition, and Christian's standing rule puts the *how* of an agreed direction with the agent. The ticket also hands the executor its own measurement predicate and acceptance criteria for both arms.
- **State verified** on re-query: `Ready for Dev`, and **no `assignee` key present** — a promotion is an update, so the field was never at risk, but checked rather than assumed (impediment #48).

**The premise was re-verified against `origin/main` before promoting, and this is the part worth recording.** The ticket's body describes post-THR-1492 state in the past tense — *"`AgentDetailPanel` … was deleted by THR-1492"* — while THR-1492 is `In Dev` as of 05:02:31Z with PR [#1933](https://github.com/christianspliid-ui/threadbare/pull/1933) still open. That is the [THR-921](https://linear.app/threadbare/issue/THR-921) stranded-artifact hazard wearing an unfamiliar face: not a stranded plan doc, but a **stranded premise**, which the liveness gate does not check because no doc is named.

Checked directly, the finding survives the check on its own:

```
$ git grep -n "getActivitySummary" origin/main -- src scripts | grep -v __tests__
origin/main:src/engine/activitySummary.ts:19:export function getActivitySummary(
```

One hit, the declaration. `AgentDetailPanel.tsx` does still exist on `main` — it is deleted only on #1933 — but it does not call this function and has not been calling it. **The dead-caller measurement is true on `main` today, independent of the unmerged branch**, so the promotion rests on verified state rather than on a branch that might yet be abandoned.

**What is *not* independent of #1933 is the file itself**, and that is recorded as a mutex rather than left for the executor to trip over. `src/engine/activitySummary.ts:11` on `main` still reads `import type { ActivitySummary } from '../components/Game/AgentDetailPanel'`; part of THR-1492's scope is moving that interface *into* this file, while THR-1502's arm (b) deletes the file outright. Two sessions editing one file, with the deletion arm guaranteed to conflict. The block therefore carries `Mutex with: THR-1492 (both edit src/engine/activitySummary.ts)` with its reason inline (THR-688 rule B) **and a stated clearing test** — `git log origin/main --oneline -1 -- src/engine/activitySummary.ts` showing the THR-1492 commit — so the mutex retires itself on evidence instead of needing a later run of this lane to notice and lift it.

**That last point is the deliberate choice here, and it is a correction of this lane's own habit.** The alternative was to *hold* the promotion until #1933 merged. Run c recorded, at length, a decline that stood unexamined for **49 days** because a lane kept re-deriving it hourly and never re-resolved the underlying state. A hold has exactly that failure mode: the reason lives only in an ops report, and clearing it depends on a future run reaching the same conclusion again. A promotion with the constraint written into Linear puts the reason where the executor reads it and gives it a test that clears itself. The ticket is `Low` and sorts to the bottom of a thirteen-item queue, so the cost of being wrong is a skipped candidate, not a blocked one.

### Declined — 15, all unchanged

No candidate's grounds moved this hour. Six design-gated or container epics ([THR-1156](https://linear.app/threadbare/issue/THR-1156), [THR-789](https://linear.app/threadbare/issue/THR-789), [THR-1393](https://linear.app/threadbare/issue/THR-1393), [THR-1381](https://linear.app/threadbare/issue/THR-1381), [THR-870](https://linear.app/threadbare/issue/THR-870), [THR-175](https://linear.app/threadbare/issue/THR-175)); seven unblocked design input ([THR-1501](https://linear.app/threadbare/issue/THR-1501), [THR-790](https://linear.app/threadbare/issue/THR-790), [THR-1497](https://linear.app/threadbare/issue/THR-1497), [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1495](https://linear.app/threadbare/issue/THR-1495), [THR-1218](https://linear.app/threadbare/issue/THR-1218)); one assigned to Christian ([THR-791](https://linear.app/threadbare/issue/THR-791)); one not executor work by construction ([THR-1220](https://linear.app/threadbare/issue/THR-1220), *Christian plays all five encounters*).

Per-ticket evidence is in [run c's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t1--unblock-sweep) and is not restated here. **The design-staging backlog stays at seven** — THR-1502 was new work, not a graduate of that pile.

### Held by the ceiling — 0

Eighth consecutive run with zero held, from full headroom (shelf 12 against a threshold of 15) rather than a throttle.

## T1.5 — wayfinder sweep

**Three open maps, zero AFK-resolvable tickets — re-proved from labels this run, not carried forward.**

- `list_issues(label:"wayfinder:research")` → **21 of 21 `Done`**, workspace-wide.
- `list_issues(label:"wayfinder:task")` → **5 of 5 `Done`**.

All twelve open map children therefore carry `wayfinder:grilling` or `wayfinder:prototype`, which are HITL by construction and which this lane must not touch. `ORCH_WAYFINDER_AFK_MAX` (2) went unspent because there is nothing this lane is permitted to spend it on — the "AFK work is finished" cause, not the "found nothing I could do" cause, and the two are indistinguishable in a counter unless the labels are re-read.

No map or child has moved: the three maps last updated 2026-09-11T06:15–06:16Z, every child 2026-08-26 or earlier. Twelve HITL questions carried to Christian by pointer above rather than re-enumerated.

## T2 — design staging

**Not triggered.** The shelf holds **5** non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2 — two and a half times the floor.

Recorded because it would bar the tier independently: `In Design` holds **2 live, 0 excluded** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointment primitive, unassigned, touched 2026-09-12T22:26Z) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (a held town is a faction position, unassigned, touched 2026-09-12T07:23Z). Both are well inside `ORCH_IN_DESIGN_STALE_DAYS` (7) and neither carries `Parked`, so both count against `ORCH_MAX_IN_DESIGN` of 1. Over bound, unchanged, and not by this lane's hand — no state was mutated; the predicate is warn-only and the exit (`Parked`) is a human's.

## T3 — architecture health

**Skipped — already run today.** [Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t3--architecture-health) executed the full sweep at 04:27Z (local 06:27, past `ORCH_HEALTH_SWEEP_HOUR`) with four detectors, three new findings and a redundancy result. The tier is once-daily; no detector was run this hour and none is reported as clean.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Next pass tomorrow.

One standing item from run c is worth a status line rather than a re-report, because it has aged and nothing has moved it: [THR-1494](https://linear.app/threadbare/issue/THR-1494)'s PR [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) was found `DIRTY` with a red required check and auto-merge armed — a combination that cannot resolve itself — and that was **6h12m** ago as of this scan. Still not this lane's to act on: the ticket is `In Dev` with an assignee, and claim arbitration and PR recovery belong to `pull-work`, which has the comment timestamps and open-PR sweep this lane does not. Not a new finding, not re-filed, noted so the clock on it is visible.

## Escalations

**None raised, and none needed.** Agreed work is not exhausted — the shelf holds thirteen items after this run's promotion and three are being built — so the stop-and-ask condition did not fire. Discord was not contacted.

**Nothing parked.** The seven design-staging candidates are correctly-declined tickets awaiting a design session, not parked items.

**Product vs process:** this run promoted one product-code ticket and filed nothing, so the trailing-week ratio moves marginally toward product, ~37 / 7 (~84%). The process-ticket budget remains untouched; the four candidates run c surfaced are still logged as report lines for the weekly retro's batch, per the throttle.
