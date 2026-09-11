---
lane: tb-orchestrator
run: 2026-09-11i
promoted: 0
filed: 1
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-09-11 (run i, ~11:29Z)

## Needs Christian

**Nothing new needs you, and one thing that was about to has been stopped.**

An hour ago an agent played all five slice encounters start to finish — the pre-flight before the sitting you were promised. It came back with a clear verdict: **the slice is not ready for you yet.** Five things are wrong, two of them badly enough to spoil the session — the very first divine choice in the game renders its two cards as illegible overlapping text, and the little "who is in the scene" row shows three dead placeholder people on every single encounter, including one where they are the *only* people shown while the family the story is about is missing.

The good news underneath that: **the writing itself is in good shape on all five.** Four of the five faults are presentation, not content, and none of them need an encounter re-written.

**Why you are hearing about this rather than getting an invitation.** When the pre-flight finished, the board briefly read as though the sitting were ready — all its recorded prerequisites had been ticked off, and the five new faults were attached in a way that recorded them without holding anything up. The next automated pass would have invited you to play a game with two known-broken screens in it, which is exactly what your own rule forbids. That gap is closed: the fix-then-re-check work is now wired in front of the invitation, so it cannot fire early.

**The order from here:** fix the two bad ones → an agent re-plays all five and confirms → *then* you get the invitation, with a date. No action from you at any point.

**One standing ask, unchanged since this morning:** a design session for [A held town is a faction position](https://linear.app/threadbare/issue/THR-1448), whenever you have an hour — say *"work the held-town design"*. Staged at 06:36Z, ~5h old, nowhere near stale. A reminder, not a nudge.

## T1 — unblock sweep

Two state-filtered reads (`Todo` **28**, `Ready for Dev` **14** at scan) — never one unfiltered sweep (THR-686), sorted by priority in memory (`orderBy:"priority"` errors, impediment #49). Promotion ceiling did not apply (14 < 15). **Promoted: 0. Filed: 1.**

### Nothing new to promote

A `createdAt:-PT3H` sweep returns seven rows, and **every one of them is already past this tier**: THR-1463 (`Done`), and THR-1464 / THR-1465 / THR-1466 / THR-1467 / THR-1468 filed *directly into* `Ready for Dev` by the executor running THR-1463, each with its own coordination block (spot-checked on [THR-1465](https://linear.app/threadbare/issue/THR-1465) — three lines present, mutex reason stated inline per THR-688 rule B, unassigned). THR-1462 was promoted by run g. No issue has entered `Todo` since run h.

The eight standing declines are unchanged and deliberately not re-argued; evidence in [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11d.md#t1--unblock-sweep). THR-1218 remains the wrong-destination decline recorded by run h — T2's input, and T2 is at its ceiling.

### Filed — [THR-1469](https://linear.app/threadbare/issue/THR-1469), and the gate it closes

**Run h flagged this exact failure as a hypothetical. One hour later it was real.**

[THR-1463](https://linear.app/threadbare/issue/THR-1463) — the slice pre-flight run h filed at 10:32Z — was claimed, executed and closed `Done` inside 46 minutes. Its verdict on [THR-1220](https://linear.app/threadbare/issue/THR-1220): **"not level — 5 defects, 2 of them `High`. Do not send the invitation yet."**

That closure is what created the defect. THR-1220's dependency half now reads:

| Blocker | State | Cleared |
|---|---|---|
| THR-1219 — slice prose to the 08-15 standard | `Done` | 2026-08-24T15:40:07Z |
| THR-1223 — corpus to Prose Doctrine v2 | `Done` | 2026-08-25T20:16:49Z |
| THR-1222 — Retrofit Batch 2, the camp six | `Done` | 2026-09-09T21:46:09Z |
| THR-1463 — the pre-flight | `Done` | 2026-09-11T~11:18Z |

**Four of four `Done`.** The five defects the verdict names were wired as `relatedTo`, which carries no gating semantics — so a `High`-priority review gate read as fully unblocked while the verdict written on it said the opposite. Every lane that consumes the dependency half — this tier, and the hourly briefing that surfaces review invitations — would have read "ready" and invited Christian to rule around two known-broken screens. That is the breach `Docs/canon/process.md` § User review interface rule 5 exists to prevent, and run h predicted it in terms: *"a lane surfacing it on that reading would breach rule 5."*

**Nothing owned the re-run**, confirmed by search before filing — the same absence that made THR-1463 necessary, recurring one step down the chain. THR-1469 is it, and the chain is now:

```
THR-1464 ┐
         ├─→ THR-1469 (re-run the pre-flight) ─→ THR-1220 (the invitation)
THR-1465 ┘
```

- **Agreed, not direction (D2).** Protocol step 1 is Christian's, chartered 2026-08-24; THR-1463's closing recommendation is *"land THR-1464 and THR-1465, then re-run the pre-flight and send the invitation."* Filing the ticket for a duty two records already name is advancing agreed work.
- **The bar is THR-1463's, adopted rather than invented, and stated as reversible.** The gate is the two `High` defects. THR-1466 / THR-1467 / THR-1468 stay `relatedTo` — judged noticeable but not session-spoiling by the session that played it, and THR-1468 is explicitly *"filed as a decision, not a bug — it may be correct."* Gating an attended sitting on an open authoring question would over-gate. THR-1469's scope step 4 makes the reversal cheap: the re-runner must re-check all three in an integrated walk and hold the invitation if any reads worse there than in isolation.
- **Filed into `Todo`, not `Ready for Dev`** — deliberately. Its own blockers are open, so entering the queue now would let the executor claim a ticket it cannot start. It reaches the shelf through this tier's ordinary T1 promotion once both clear, which is the machinery working as designed rather than around it.
- **Scope carved: verify and rule, do not fix.** Folding the two repairs in would make one ticket mutex with two shelf items and bury the verdict under them.
- **Roster stated as a predicate (THR-688 rule A)** — the parent templates declared in `src/data/encounters/vertical-slice.ts`, with the five current ids named as of filing and the predicate governing if that set moves.
- **Rule 0 / materiality:** product work — the gate on the slice-validated milestone — so the process-ticket bar does not apply and no cost/benefit line is owed.
- **Three-write create sequence (THR-845), all verified.** create → **separate** `save_issue(assignee:null)` → `get_issue`. The re-query carries **no `assignee` or `assigneeId` key**, `status: Todo`, `priority: High`, labels `Content`/`UI`, project Encounter Experience.
- **Relations verified on the same re-query:** `blocks: [THR-1220]`, `blockedBy: [THR-1465, THR-1464]`. **THR-1220's state, assignee, priority, description and four existing relations were not touched** — its state history is still a single unbroken `Todo` since 2026-08-24.

*Not candidates, stated so the sweep is legible:* THR-1156 and THR-789 are program-epic containers; THR-791 carries an assignee; THR-1220 is attended work by construction; THR-870 is the parked Sphere-Governed Ascendant pivot. **15 `wayfinder:*` issues skipped unconditionally** — T1.5's input, never `Ready for Dev`.

**Shelf after filing: 14 items, 9 non-`Deferral`** — THR-1469 sits in `Todo` and does not count. Three Linear writes plus one comment this run; every one re-queried and confirmed.

## T1.5 — wayfinder sweep

**Three open maps**, unchanged: [Item Generator](https://linear.app/threadbare/issue/THR-1227) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Physical Conflict](https://linear.app/threadbare/issue/THR-1258).

**AFK burn-down: 0 resolved, 0 available — re-measured this run, not inherited from run h.** Two label-filtered sweeps: **21 of 21 `wayfinder:research` `Done`**, **5 of 5 `wayfinder:task` `Done`**. Nothing open in either label across every map ever charted. Eighth consecutive run at zero — structural, not transient.

**HITL frontier: 12 tickets, routed nowhere by this lane.** Under the 2026-09-11 ruling ([`Docs/canon/process.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) § User review interface, rule 4) grilling and prototype tickets are decided by the design session that works them, never listed as Christian's in the briefing — so they appear nowhere under § Needs Christian. Run d's structural note (twelve decisions with no lane scheduled to pick them up) stands and belongs to the retro.

## T2 — design staging

**Not triggered — the bound decided it, and the floor agrees.**

`In Design` holds **1 live, 0 excluded**: [THR-1448](https://linear.app/threadbare/issue/THR-1448), staged by run d at 06:36:29Z, unassigned, ~5h old and nowhere near `ORCH_IN_DESIGN_STALE_DAYS` (7). `ORCH_MAX_IN_DESIGN` is 1, so the tier is at ceiling regardless of the shelf.

Shelf for the record: **9 non-`Deferral`** items, well above `ORCH_PROGRAM_WORK_FLOOR` (2) — the highest program-work reading this week, five of them filed in the last fifteen minutes by the pre-flight. **No plan doc authored, and none will be by this lane** — Christian's 2026-08-06 ruling.

THR-1218 remains queued for this tier and unable to enter it, waiting on the `In Design` ceiling. Named so it is visibly deferred rather than silently dropped.

## T3 — architecture health

**Not due — already run today, and nothing below is claimed as clean on an unrun check.**

[Run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md) executed the full daily sweep at 06:27 local, including a genuine redundancy judgement pass. Its findings stand and are deliberately not restated.

- **Not run this hour:** `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this run.** Run b assessed it this morning; this run performed no judgement pass and claims none.

### New finding — defect tickets filed against a gate carry no gating semantics

`newFindings: 1`. Surfaced by T1's relation read rather than by a detector, and recorded in full [on THR-1220](https://linear.app/threadbare/issue/THR-1220).

The pre-flight session did everything its ticket asked — played the five, filed five well-specified defects with coordination blocks, posted a clear verdict, wired each defect to the checkpoint. It wired them as **`relatedTo`**, which is a documentation relation. The gating half of the board therefore read `4 of 4 blockers Done` on a `High` review gate whose own newest comment said *"do not send the invitation yet."*

**The general shape, which will recur:** a verdict written in a comment is invisible to every lane that reads relations. THR-990 already established the mirror of this for promotion — *a met blocker is not a live premise, read the latest comment* — and this is the same defect pointed the other way: **a cleared relation is not a satisfied gate.** Anything that discharges a gate by *producing a defect list* has to wire that list as `blockedBy`, or the gate opens the moment the discharging ticket closes.

**Not filed as a ticket, deliberately.** Per CLAUDE.md § *Process-work throttle*, a scheduled lane logs a delivery-machinery defect and moves on; the weekly retro is the single promotion point. One occurrence, and the instance is already repaired. **Impediment-log candidate for the weekly retro**, alongside run h's parent-cascade finding on THR-1043 — both are "the board's machine-readable half disagreed with its human-readable half", which is a family worth naming once rather than twice.

### Standing sub-duties

- **`In Design`: 1 live, 0 excluded** — THR-1448 (unassigned, ~5h). Printed rather than skipped: a `0 excluded` line is the signal the predicate was actually applied.
- **Hand-created `In Dev` / stalled work: not re-measured** (T3 not due). Run b's sweep stands.
- **WIP: zero `In Dev`.** THR-1463 closed and nothing has been claimed since. Observed in passing, not a measured sweep — but worth one line, because the shelf gained five items in the same fifteen minutes the executor emptied its slot, so the next pickup has an unusually rich queue.
- **Precheck:** `freshness=behind:2` on the home tree — autosync mirror lag, not decay; this lane runs no git state op there and publishes via plumbing. `linear=nokey` is the normal home-machine state and says nothing about the MCP connector, which answered every read and write this run.

### Product vs process — the week

This run filed **one product item and zero process items**, and promoted nothing. The process-ticket budget (at most one per three runs) remains untouched; the one process-shaped finding above was logged rather than filed. **Headline: supply is healthy and the constraint is now repair, not authoring.** Nine program items on the shelf, five of them filed this hour by a review pass doing exactly what review passes are for, an executor slot free, and the encounter content line finished. Nothing here says "the feature pipeline needs supply."

## Escalations

**None.** No question asked, no item parked, no fail-soft path taken. Three Linear writes and one comment, every one re-queried and confirmed — including the null-assignee check read off `get_issue` rather than off the create response (THR-845). The bar adopted for THR-1469's gate is THR-1463's own recommendation, quoted rather than inferred, and recorded as reversible on both tickets.
