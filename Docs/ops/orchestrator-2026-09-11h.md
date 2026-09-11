---
lane: tb-orchestrator
run: 2026-09-11h
promoted: 0
filed: 1
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-11 (run h, ~10:35Z)

## Needs Christian

**One ask, unchanged — and one piece of news that needs nothing from you.**

**The ask:** a design session for [A held town is a faction position](https://linear.app/threadbare/issue/THR-1448), whenever you have an hour — say *"work the held-town design"*. Staged at 06:36Z this morning, so four hours old; still nowhere near stale. Same ask as the last few hours, not a new one.

**The news:** the encounter content line has finished everything it set out to do. Batch 3 merged this morning, which was the last of the fifteen old encounters being brought up to the new standard — so every encounter in the game now meets the bar, and the machine that rewrites them has nothing left in its queue.

What that unlocks is the sitting you asked for back in August: **you play the five slice encounters start to finish and rule on whether the whole thing hangs together**, rather than on one component at a time. That sitting is not ready for you yet, and I am deliberately not inviting you to it. Your own rule is that you only get asked to look at something once every part of it is actually finished and on screen — so an agent plays all five first, writes down anything broken, and those get fixed. That pre-flight job did not exist as a task anywhere; it does now, and it is queued at the top.

**Nothing for you to decide.** The next time this appears it should be a real invitation with a date, or a short list of what is still broken.

## T1 — unblock sweep

Two state-filtered reads (`Todo` **28**, `Ready for Dev` **10** at scan) — never one unfiltered sweep (THR-686), sorted by priority in memory (`orderBy:"priority"` errors, impediment #49). Promotion ceiling did not apply (10 < 15). **Promoted: 0. Filed: 1.**

### Nothing new to promote

No issue has been created or moved into `Todo` since [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11g.md) at 09:30Z — checked with a `createdAt:-P1D` sweep, whose newest row is THR-1462 (09:16Z, promoted by run g). The eight standing declines are unchanged and are deliberately not re-argued; their evidence is in [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11d.md#t1--unblock-sweep).

**One decline changed its reason, which is worth one line.** [THR-1218](https://linear.app/threadbare/issue/THR-1218) (encounter firing pruning pass) was declined every prior run today on an unmet blocker — [THR-1043](https://linear.app/threadbare/issue/THR-1043) was `Todo`. THR-1043 went `Done` at **09:36:51Z**, six minutes after run g's scan, so that blocker is now met. THR-1218 still does not promote: its description ends *"Not Ready for Dev — needs a design pass when unblocked"*, which is the **wrong-destination** decline. It is now T2's input rather than T1's, and T2 is at its ceiling (below). Recorded so tomorrow does not re-derive it as an unmet blocker.

### Filed — [THR-1463](https://linear.app/threadbare/issue/THR-1463), the slice-checkpoint pre-flight

**A `High`-priority, director-chartered review gate had been fully unblocked for ~37 hours with no lane able to advance it.** That is a sequencing gap, which is this lane's whole remit.

[THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, Christian's sitting, chartered at the close of the [vertical-slice wayfinder map](https://linear.app/threadbare/issue/THR-902) — carries three **native Linear `blockedBy` relations**, read with `includeRelations:true` this run rather than parsed out of prose:

| Blocker | State | Completed |
|---|---|---|
| [THR-1219](https://linear.app/threadbare/issue/THR-1219) — slice prose to the 08-15 standard | `Done` | 2026-08-24T15:40:07Z |
| [THR-1223](https://linear.app/threadbare/issue/THR-1223) — corpus to Prose Doctrine v2 | `Done` | 2026-08-25T20:16:49Z |
| [THR-1222](https://linear.app/threadbare/issue/THR-1222) — Retrofit Batch 2, the camp six | `Done` | 2026-09-09T21:46:09Z |

All three `Done` since **2026-09-09T21:46Z**. Nothing moved it, and structurally nothing could:

- **T1 cannot promote it.** Its description forbids promotion in terms — *"HITL review session — attended chat only. Never promote to Ready for Dev; this is not executor work."* This lane has correctly declined it hourly as attended work by construction, which is exactly why the gap stayed invisible: the decline was right every time.
- **T2 cannot stage it.** It needs no design pass; it needs someone to play the game.
- **The executor never sees it**, because it never enters the queue.

The thing that actually needed doing is written *inside* THR-1220 as Protocol step 1 — an agent pre-flight (play all five roster encounters end to end, assert the checklist, file every defect) that must run **before** the invitation reaches Christian, per the level-system rule (`Docs/canon/process.md` § User review interface, rule 5). **That duty had no ticket**, confirmed by search before filing. THR-1463 is it.

- **Agreed, not direction (D2).** The protocol is Christian's, chartered in chat 2026-08-24. Filing the ticket for a duty he already wrote down is advancing agreed work, not choosing any.
- **Scope carved deliberately: verify and file, do not fix.** This ticket produces the verdict and the defect list; each defect becomes its own ticket; THR-1220's invitation fires when that list is empty. Folding the fixes in would make one ticket mutex with half the encounter corpus and bury the verdict under the repairs.
- **Roster stated as a predicate (THR-688 rule A)**, resolved from the header of `src/data/encounters/vertical-slice.ts`: five parents (`unsafe_bridge`, `snow_on_the_pass`, `riders_behind_caravan`, `bargain_at_crossroads`, `swindled_family`) plus four seeded sequels which are *not* in the five. The predicate governs if the file's parent set has moved by pickup.
- **Rule 0 / materiality:** not a process ticket. Product work — the gate on the slice-validated milestone — so the bar does not apply and no cost/benefit line is owed.
- **Three-write create sequence (THR-845), all verified.** `save_issue` create → **separate** `save_issue(assignee:null)` → re-query. The re-query returns **no `assignee` or `assigneeId` key**, and the same response carries both fields on a neighbouring row, which is what makes the absence meaningful rather than a field the query omitted. Status `Ready for Dev`, priority `High`, labels `Content`/`UI`, project Encounter Experience.
- **Coordination block posted** 10:33:04Z — `Suggested model: Opus` (advisory), `Parallel-safe with: everything on the shelf`, `Mutex with: nothing` with its reason inline (the sweep writes no source file), `Blocked by: nothing` naming the three now-`Done` relations, and the browser evidence shape.
- **One relation written:** `THR-1463 blocks THR-1220`, verified on re-query. Without it the checkpoint reads as ready-to-invite on a board where all three original blockers are `Done` — and a lane surfacing it on that reading would breach rule 5 by inviting Christian to review a surface nobody has played. **THR-1220's state, assignee and priority were not touched**; it is still `Todo`, unassigned, with an unchanged state history.

*Not candidates, stated so the sweep is legible:* THR-1156 and THR-789 are program-epic containers; THR-791 carries an assignee; THR-870 is the parked Sphere-Governed Ascendant pivot. **15 `wayfinder:*` issues skipped unconditionally** — T1.5's input, never `Ready for Dev`.

**Shelf after filing: 11 items, 6 non-`Deferral`.** Two Linear writes plus two comments this run; every one re-queried and confirmed.

## T1.5 — wayfinder sweep

**Three open maps**, unchanged: [Item Generator](https://linear.app/threadbare/issue/THR-1227) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Physical Conflict](https://linear.app/threadbare/issue/THR-1258).

**AFK burn-down: 0 resolved, 0 available — re-measured this run, not inherited from run g.** Two label-filtered sweeps: **21 of 21 `wayfinder:research` `Done`**, **5 of 5 `wayfinder:task` `Done`**. Nothing open in either label across every map ever charted. Seventh consecutive run at zero — a structural fact, not a transient.

**HITL frontier: 12 tickets, routed nowhere by this lane.** Under the 2026-09-11 ruling ([`Docs/canon/process.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) § User review interface, rule 4) grilling and prototype tickets are decided by the design session that works them, never listed as Christian's in the briefing — so they appear nowhere under § Needs Christian. Run d's structural note (twelve decisions with no lane scheduled to pick them up) stands unchanged and belongs to the retro.

## T2 — design staging

**Not triggered — the bound decided it, and the floor agrees.**

`In Design` holds **1 live, 0 excluded**: [THR-1448](https://linear.app/threadbare/issue/THR-1448), staged by run d at 06:36:29Z, unassigned, ~4h old and nowhere near `ORCH_IN_DESIGN_STALE_DAYS` (7). `ORCH_MAX_IN_DESIGN` is 1, so the tier is at its ceiling regardless of the shelf.

The shelf reading for the record: **6 non-`Deferral`** items, comfortably above `ORCH_PROGRAM_WORK_FLOOR` (2). **No plan doc authored, and none will be by this lane** — Christian's 2026-08-06 ruling.

**One item is now queued for this tier and cannot enter it:** THR-1218's blocker cleared at 09:36Z, making it T2's input by the wrong-destination decline above. It waits for the `In Design` ceiling to free. Named here so it is visibly deferred rather than silently dropped.

## T3 — architecture health

**Not due — already run today, and nothing below is claimed as clean on an unrun check.**

[Run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md) executed the full daily sweep at 06:27 local (past `ORCH_HEALTH_SWEEP_HOUR`), including a genuine redundancy judgement pass. Its findings stand and are deliberately not restated.

- **Not run this hour:** `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this run.** Run b assessed it this morning; this run performed no judgement pass and claims none.

### New finding — an epic closed by parent-cascade with its last Done-when unmet

`newFindings: 1`. Surfaced by T1's blocker re-check rather than by a detector, and recorded as a comment on the issue itself.

[THR-1043](https://linear.app/threadbare/issue/THR-1043) (the Encounter Factory, `High`) went `Done` at **09:36:51.738Z**. Its second and last child [THR-1130](https://linear.app/threadbare/issue/THR-1130) went `Done` at **09:36:51.486Z** — **252 ms earlier** — via line-anchored auto-close when PR [#1900](https://github.com/christianspliid-ui/threadbare/pull/1900) merged at 09:36:30Z. Linear's auto-close-parent-when-all-sub-issues-are-closed setting then fired. Three pieces of corroboration that it was the cascade and not a deliberate closure:

- **No commit on `main` names THR-1043** (`git log origin/main --grep="THR-1043"`, last 24h, empty), so `linear-autoclose.yml` did not close it.
- **State history is `Todo → Done` with no `In Dev`** — nobody claimed, worked and shipped it.
- **No closing comment.** The newest comment before this run's was 2026-08-25.

**Why it matters:** THR-1043's own record names its remaining scope twice — *"the pilot batch and Christian's 2-of-6 sample verdict"*, the verdict folded into THR-1220 by the 2026-08-24 comment. THR-1220 is still `Todo`. So the Encounter Factory is genuinely **built and its pilot volume shipped**, but **not reviewed**, while the board now reads as though it were. The gate is not lost — THR-1220 holds it, and THR-1463 now blocks THR-1220 — but the link from the epic to it was about to become invisible.

**Not filed as a ticket, deliberately.** Per CLAUDE.md § *Process-work throttle*, a scheduled lane logs a delivery-machinery defect and moves on; the weekly retro is the single promotion point. One occurrence, gate already tracked elsewhere, does not clear the materiality bar. **Impediment-log candidate for the weekly retro**, as a second direction on the impediment #605 cascade family (which is attached to this very issue, running parent→child rather than child→parent). Recorded in full [on THR-1043](https://linear.app/threadbare/issue/THR-1043).

### Standing sub-duties

- **`In Design`: 1 live, 0 excluded** — THR-1448 (unassigned, ~4h). Printed rather than skipped: a `0 excluded` line is the signal that the predicate was actually applied.
- **Hand-created `In Dev` / stalled work: not re-measured** (T3 not due). Run b's sweep stands.
- **WIP healthy:** exactly one issue `In Dev` ([THR-1457](https://linear.app/threadbare/issue/THR-1457), last touched 10:20Z — actively running). Observed in passing, not a measured sweep.

### Product vs process — the week

This run filed **one product item and zero process items**, and promoted nothing. The process-ticket budget (at most one per three runs) remains untouched, and the one process-shaped finding above was deliberately logged rather than filed. **Headline: the feature pipeline is supplied, and the binding constraint has moved from supply to review.** Eleven items on the shelf, six of them program work, a design item staged, and the encounter content line has now finished its retrofit queue — what it is waiting on is a play-through, not more authoring.

## Escalations

**None.** No question asked, no item parked, no fail-soft path taken. Every Linear write re-queried and confirmed; every substrate claim resolved against the repo (`vertical-slice.ts` header for the roster, `git log origin/main` for the absent close keyword, `grep` for the zero authoring-metadata and zero `RETROFIT_PENDING` counts) rather than by inference.
