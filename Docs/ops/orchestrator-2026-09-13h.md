---
lane: tb-orchestrator
run: 2026-09-13h
promoted: 3
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-13 (run h, ~10:32Z)

## Needs Christian

**Nothing needs you.** No decision is blocking a builder, and nothing on your list changed.

What moved, in a sentence: **three small repairs went into the build queue, and two of them only became doable in the last hour.** The detail-page panel — the stacked pages that open when you click a name in the game — got its keyboard handling finished about half an hour ago, and the moment it landed, one remaining gap in it became fixable: the trail of links across the top of that panel can be clicked but not reached by keyboard. That is now queued. The third is a piece of the content-model work that had been waiting on a sibling task which finished last night.

One thing deliberately **not** brought to you: a lane is currently regenerating five pieces of scene art, which spends image credits. Its ticket says to confirm with you first, but your 2026-09-11 ruling already covers it — spend inside a ticket's stated batch is the builder's call, it just has to tell you the count. Five images plus retries. Flagging the number, not asking.

## T1 — unblock sweep

Shelf at scan: **10** in `Ready for Dev`, **4** of them non-`Deferral`. Below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available; **3 were spent**, leaving the shelf at 13.

`In Dev` holds **one** issue, [THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) (scene-asset regeneration), claimed at 10:03:14Z — **29 minutes old, a live claim, not touched.** Its `stateHistory` shows a clean `Ready for Dev` → `In Dev` transition (promoted 2026-09-11, claimed today), so it is **not** a hand-created `In Dev` ticket and needs no T3 flag. Its assignee field is absent, which is the known queue-assignee shape and `stale-claim-sweep`'s to repair — not this lane's, and certainly not on a claim half an hour old.

### The `Todo` slice: 31 candidates, 0 promotions

**15 carry a `wayfinder:*` label** and were skipped unconditionally to T1.5. Of the remainder, two are assigned (THR-791, THR-1232) and two are programme epics that are containers rather than work (THR-1156, THR-789). The rest were judged and **every one declined on destination** — each ticket says, in its own words, that the decision it turns on is not an executor's:

| ticket | the sentence that declines it |
| -- | -- |
| [THR-1503](https://linear.app/threadbare/issue/THR-1503) | *"that is a call for a design pass, not for the executor who found it"* |
| [THR-1501](https://linear.app/threadbare/issue/THR-1501) | *"Deleting vocabulary is a design-session / weekly-retro decision … not an executor's"* |
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) | *"this is the fork, and it is not the executor's to settle"* — three readings that are *"genuinely different games"* |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) | *"This is a design ticket, not a patch"* |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) | *"a design decision, not an executor's call"* — plus a new graph shape, which the load-bearing rule gates behind full design |
| [THR-790](https://linear.app/threadbare/issue/THR-790) | *"Needs its own design finalization before Ready for Dev"* |
| [THR-1381](https://linear.app/threadbare/issue/THR-1381) | *"Design-session work, not execution — no code is owed by this ticket"* |
| [THR-1218](https://linear.app/threadbare/issue/THR-1218) | *"Not Ready for Dev — needs a design pass when unblocked"*; also blocked on the Encounter Factory raising density |
| [THR-175](https://linear.app/threadbare/issue/THR-175) | trigger gate unmet — needs creation-sphere content shipping or a template needing `sphere` independent of `reach` |
| [THR-1220](https://linear.app/threadbare/issue/THR-1220) | *"Never promote to Ready for Dev; this is not executor work"* — and Christian is actively playing it, leaving feedback batches (latest 2026-09-12T06:50Z, *"Checkpoint still open"*) |

That is nine consecutive T2-shaped declines in one column, which is the finding underneath the numbers: **the `Todo` column is now almost entirely design-gated work.** It is not a queue the executor can draw from at all, and no amount of T1 sweeping will change that — only design sessions will. T2 is barred this run on its own count (below), so this is recorded rather than acted on.

### The `Idea` slice — where all three promotions came from

Scanned per the practice [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13g.md#the-idea-slice-was-scanned--and-held-two-promotable-bugs) established: the skill's step 1 scans `Todo` + `Ready for Dev` while step 2 judges *"each `Todo` / `Idea` candidate"*, so `Idea` is inside the judgement set and outside the scan. Exactly **one** item is new there since run g — everything else is the ungroomed ~50-item tail that belongs to `daily-backlog-grooming`.

**Promoted — 3.** All three have an empty native `blockedBy`, no prose or time gate, no comment carrying a retire verdict, and a coordination block posted at promotion carrying the three required lines plus the evidence shape:

- **[THR-1504](https://linear.app/threadbare/issue/THR-1504/detailbreadcrumb-crumbs-are-click-only-spans-law-23-and-the-one)** (Low, `UI`, *Encounter Experience*) — breadcrumb crumbs are click-only `<span>`s: no `role="button"`, no `tabIndex`, no key handler (Law 23). Filed into `Idea` at 10:14Z, 18 minutes before promotion. **Two claims re-verified on `origin/main` before the write rather than taken on the ticket's word.** (1) The defect is real — `git show origin/main:src/components/shared/DetailBreadcrumb.tsx` shows the bare `<span onClick={…}>` in the `clickable` branch, exactly as described. (2) **The surface is live, which the ticket does not establish itself** — THR-1024 was filed with an explicit warning that the detail-page cluster had zero production importers and might be *pruned*, in which case this work dies. That disposition resolved the other way: [THR-966](https://linear.app/threadbare/issue/THR-966) closed 2026-09-12 as **mount**, via THR-1490. So this is a fix on a surface a player can reach, not polish on dead code. Its context ticket [THR-1024](https://linear.app/threadbare/issue/THR-1024) went `Done` at **10:28:29Z — four minutes before this promotion**, which is what makes the Done-when's Tab-cycle assertion writable today rather than aspirational.
- **[THR-1495](https://linear.app/threadbare/issue/THR-1495/six-content-kinds-have-no-codex-category-so-their-content-cards-can)** (Low, `Content`/`UI`, *Content Architecture*) — six content kinds have no codex category, so their cards can offer no sheet. A slice-2 deferral of [THR-1482](https://linear.app/threadbare/issue/THR-1482), an agreed and actively shipping programme. Plan-doc liveness checked before the write (THR-921 gate): `npm run check:plan-doc-liveness -- Docs/plans/2026-09-12-thr-1482-one-card-one-router.md` returns **LIVE** on `origin/main`.
- **[THR-1497](https://linear.app/threadbare/issue/THR-1497/catalystquery-is-repaired-and-gated-but-unreachable-from-the-live)** (Low, `Content`/`Engine`, *Content Architecture*) — `catalystQuery` resolves correctly but no cell carries it, so no mortal on a default seed reaches a catalyst seed. Its filing block already recorded `Blocked by: nothing`; what actually held it was the stated mutex against [THR-1489](https://linear.app/threadbare/issue/THR-1489) over `scripts/undertaking-live-proof.ts`. **THR-1489 went `Done` 2026-09-12T22:45Z** (PR #1926), so the mutex is discharged *and* the `catalyst_seeded` live-proof claim its third Done-when may satisfy now exists rather than being promised. Both facts are stated in the promotion comment so the executor can reverse that mutex on evidence (THR-688 rule B) instead of guessing.

**A note on what these three are not.** All three are `Deferral`-labelled, so none of them lifts the non-`Deferral` count that gates T2. The shelf is deeper; the *programme* shelf is not.

**Rule-0 discipline.** None of the three is process or infrastructure work — all three are product (two content-model, one player-facing accessibility), so the materiality bar did not need to be applied. **Week's product-vs-process completion ratio: strongly product** — the last day's closes (THR-1024, THR-1489, THR-1490, THR-1492, THR-1484, THR-966) are all product or programme slices, with no process ticket among them.

### Held by the ceiling — 0

Twelfth consecutive run with zero held, from real headroom (shelf 10 against a threshold of 15) rather than a throttle.

## T1.5 — wayfinder sweep

**Three open maps, zero AFK-resolvable tickets — and this run proved the stronger form of that.** Rather than re-deriving it from the `Todo` scan alone, both AFK labels were queried workspace-wide:

- `label:"wayfinder:research"` → **21 issues, all 21 `Done`.**
- `label:"wayfinder:task"` → **5 issues, all 5 `Done`.**

So there is not an open AFK wayfinder ticket anywhere in the workspace, on any map, in any state. `ORCH_WAYFINDER_AFK_MAX` (2) went unspent for the **"AFK work is finished"** cause, not the "found nothing I could do" cause — and that is now a measured claim rather than an inference from one column.

All twelve open children of the three maps ([Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258)) carry `wayfinder:grilling` or `wayfinder:prototype` — HITL by construction, which this lane must not touch. They are **not** re-enumerated: the set is unchanged, every child was last touched 2026-08-26 or earlier, runs c and d carried them in full, and re-listing a static set hourly is what trains a reader to skip the section.

## T2 — design staging

**Not triggered.** The shelf holds **4** non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2 — twice the floor.

Recorded because it would bar the tier independently: `In Design` holds **2 live, 0 excluded** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointment primitive, unassigned, touched 2026-09-12T22:26Z) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (a held town is a faction position, unassigned, touched 2026-09-12T07:23Z). Both sit well inside `ORCH_IN_DESIGN_STALE_DAYS` (7) and neither carries `Parked`, so both count against `ORCH_MAX_IN_DESIGN` of 1. Over bound, unchanged, and not by this lane's hand — no state was mutated; the predicate is warn-only and the exit (`Parked`) is a human's.

**The tension worth naming, since it is now visible from two directions at once.** T2 is barred twice over — once by a healthy shelf count, once by an over-bound design column — while the `Todo` column has accumulated **nine tickets that each say in their own words that they need a design pass**. The barring is correct by every constant, and the queue it produces is still one the executor cannot draw from beyond the deferral tail. This is not a defect in any single rule and not this lane's to resolve; it is input for the weekly retro, recorded here so the shape is countable at the time rather than in hindsight.

## T3 — architecture health

**Skipped — already run today.** [Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t3--architecture-health) executed the full sweep at 04:27Z with four detectors. The tier is once-daily; **no detector ran this hour and none is reported as clean.** The redundancy judgement pass was likewise **not performed this run** — run c's result stands, and this line exists so the gap is not mistaken for coverage.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Next pass tomorrow.

One check was made outside the tier because the queue scan surfaced it directly and it costs nothing: **hand-created `In Dev` tickets — none.** The single `In Dev` issue (THR-876) has a `Ready for Dev` state in its history, so the THR-1325 class is absent right now.

`newFindings: 0` is a consequence of the tier not running, not of a sweep that found nothing.

## Escalations

**Nothing asked, nothing parked.** No candidate this run was set aside for want of an answer.

**One question still outstanding from run e and deliberately not re-posted** — whether some lane should own re-checking PRs that armed auto-merge and then went red. Re-asking an open question hourly is noise, and its urgency fell when the instance behind it cleared. It stands as a process-shape question for the weekly retro.

**One judgement recorded rather than escalated.** THR-876's description says its image-credit spend is *"Worth confirming with Christian before running the batch."* That sentence predates the **2026-09-11 blanket ruling**, which makes spend inside a ticket's stated batch the executor's call with the count disclosed. Surfacing it would have been exactly the failure that ruling was written to stop — one of thirteen asks that all got the same one-word answer. The count (5 images plus retries) is in `## Needs Christian` as a disclosure, not a question. The ticket's own sentence is now stale against the ruling; correcting someone else's live ticket mid-claim is not this lane's act, so it is left for the session holding it.
