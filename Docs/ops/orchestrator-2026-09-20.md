---
lane: tb-orchestrator
run: 2026-09-20
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-20 (run a, ~10:30Z)

## Needs Christian

**Two things are waiting on you, and they are different asks. The second one is new to this report.**

**1. One design chat — the same ask as yesterday.** Start with [THR-1479, the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) (say *"design THR-1479"*). [THR-1448, a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) comes after it. Both have been on the design desk since 11–12 September with nothing left blocking them.

**2. You started playing the five encounters on 12 September and never finished.** You gave feedback in four batches that morning — scar words, chip length, condition tooltips, the agent's name, the crossroads promise, the nudge stage. **All seven tickets that came out of it were fixed the same day.** Then the sitting stopped, and the one question it exists to answer — *is the integrated encounter experience at an acceptable state?* — has been unanswered for eight days. A "yes" is what unlocks the next big chunk of work (the hub map: encounters reaching into factions, war, economy, divine actions), which is the supply the build queue is currently starving for. The five links are on [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with), and the surface has only improved since you last looked.

**The build machine has now been idle for 25 hours** — nothing has been finished since yesterday morning because there is nothing left to pick up. Nothing else needs a decision from you.

## T1 — unblock sweep

Shelf: **0** in `Ready for Dev`, **0** in `In Dev`, **0** in `Implementation Planning`. Re-queried this run, and re-confirmed against the status id directly (`63f54b81`) rather than the name, because an empty shelf two days running is the shape a broken query also has. It is genuinely empty. Last completion was THR-1503 at 2026-09-19T09:12:55Z — **25.3 hours ago**.

`Todo`: **26**, unchanged from yesterday. **15 are wayfinder-labelled** (3 maps + 12 children) and skip unconditionally to T1.5. The other **11 were each re-read this run**, not inherited:

| Issue | Decline | Evidence (quoted from the ticket) |
|---|---|---|
| THR-789 | Wrong destination — epic container | *"Each wave runs design finalization before Ready for Dev."* |
| THR-790 | Wrong destination → T2 | *"Needs its own design finalization before Ready for Dev."* Returned to `Todo` by the stale sweep 2026-09-11 after 27 days in `In Design`. |
| THR-1274 | Wrong destination → T2 | *"This is a design ticket, not a patch: a non-human cast primitive needs its shape decided … before code, per the new-node-type rule."* |
| THR-1348 | Wrong destination → T2 | *"The design question — this is the fork, and it is not the executor's to settle."* Done-when #1 is a recorded verdict between three readings. |
| THR-1393 | Wrong destination → T2 | *"a design decision, not an executor's call"*; the Done-when requires a graph shape to be designed first. |
| THR-1381 | Wrong destination → T2 | *"Design-session work, not execution — no code is owed by this ticket."* |
| THR-1218 | Unmet blocker **and** wrong destination | Blocked on THR-1043 (factory content density); *"Not Ready for Dev — needs a design pass when unblocked."* |
| THR-175 | Unmet gate | *"Do not start this work before the trigger."* Neither trigger (creation-sphere content shipping; a template needing `sphere` independent of `reach`) has fired. |
| THR-870 | Unmet gate — director sequencing | *"activate only when Christian moves the Sphere-Governed Ascendant project out of Idea"*; *"parked by creative-director sequencing."* |
| THR-1220 | Never enters the queue | *"HITL review session — attended chat only. Never promote to Ready for Dev."* Surfaced above instead. |
| THR-791 | Assigned to Christian | Also a wave needing its own design pass, per THR-789's structure. |

**Promotions: 0.** Nothing was eligible. Neither ceiling bound (batch max 5; backed-up threshold 15).

**The shape of this is worth naming plainly: every single promotable-looking item in `Todo` declines for the same reason.** Nine of the eleven are design tickets whose own bodies forbid promotion. This is not a queue that happens to be empty — it is a queue with no executable work in it *by construction*, and the only thing that converts any of it is a design session.

**Rule 0:** no process work promoted, none eligible. Last 48h completions: 4 product (THR-1503, THR-1515, THR-1501, THR-1511) and 3 process (THR-1513, THR-1512, THR-1514). The headline is unchanged and hardening: **"feature pipeline needs a design session"**, never more tidying.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258). None updated since 2026-09-11.

**AFK frontier: 0**, re-verified by label rather than inherited — all 21 `wayfinder:research` and all 5 `wayfinder:task` issues across every map are `Done`. Nothing to burn down; `ORCH_WAYFINDER_AFK_MAX` did not bind.

**HITL frontier: 12** grilling/prototype tickets, unchanged since 2026-08-26 and already carried on the briefing. Not touched, not re-listed here — re-surfacing an unchanged set of twelve every hour is the dump this tier forbids.

## T2 — design authoring

**Triggered but barred.** Non-`Deferral` shelf is **0**, below the floor of 2. `In Design` classifies as **2 live, 0 excluded** against a bound of 1. Nothing staged, nothing mutated.

Both items are unassigned and have sat on the design desk for 9 days (THR-1448) and 8 days (THR-1479). **Under the predicate as THR-1382 intended it, both would be excluded today and T2 would be free.** They are not, for the reason in the finding below.

Practical cost today: **nil**. Staging a third item would produce a third design-chat ask, and two are already unanswered. The bound is misfiring, but it is not what is holding the pipeline — that is stated as a correction to the mechanism, not as a claim of lost work.

## T3 — architecture health

**Due, and all four detectors ran.** First sweep today (local 12:30). Baseline: [2026-09-19](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-19.md).

| Detector | Result | vs. 09-19 |
|---|---|---|
| `generate-interface-map:dry` | 7 LEAKED (all ticketed), 104 LIVE | Unchanged |
| `sweep:rank-reach` | PASS: 60 reachable, 0 blocked, 0 unowned, 13 apex holders at tick 900 | Unchanged |
| `check:process` | OK: systems inventory, setting coverage, plans index, authoring brief all current. Query-prize floor VACUOUS (9 briefs) | Unchanged |
| `check:canon-staleness` | 30 warnings | Unchanged |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **It was not run and is not reported clean.**

### New finding (1): the staleness sweep's own warning resets the staleness clock it measures

Yesterday's run found that *an automated comment* keeps a staged design item live, and named `daily-backlog-grooming` as the instance. That framing was right but too kind. The mechanism is worse and it is **self-referential**, confirmed this run by reading the code rather than inferring from a timeline:

- `classifyInDesignItem` derives age from `lastInDesignActivityMs`, which is `Math.max` over **every comment's `createdAt`** plus state-history entries (`scripts/stale-claim-sweep/index.ts:327–383`).
- When an unassigned item passes day 7, the sweep classifies it `stale-unassigned` → `countsAgainstBound: false`, **`warn: true`**.
- The warning is posted **as a comment on that issue**. That comment is activity. `ageDays` resets to 0, `isStale` goes false, and the item classifies `live` again — counting against the bound for another 7 days.

**Measured instance, this run:** THR-1448 was excluded yesterday at 7.1d. At 2026-09-19T15:45:46Z the sweep posted its *"8 days without activity"* warning — text that ends *"past 7 days an unassigned item stops counting against `ORCH_MAX_IN_DESIGN`"*. That comment made it count. Today it reads 0.8d and is `live`. THR-1479 is the same shape one day offset (grooming comment 09-19T07:18Z, reads 1.1d).

**Consequence:** an unassigned stale `In Design` item can only be excluded during the gap between crossing day 7 and the next sweep fire (`cron: "0 */12 * * *"`, so ≤12h per 7-day cycle) — and only if an orchestrator run lands inside that window, which yesterday's 09:30Z run did by luck. THR-1382's repair is therefore close to a no-op for exactly the two items it was written for.

**Not filed as a ticket.** No work has been lost: the bar it wrongly enforces is gating an ask that is already outstanding twice over. Per the process-work throttle, scheduled lanes log rather than file — **logged for the weekly retro**, which now has two consecutive days of evidence and a named code path.

**Redundancy:** not assessed this sweep.

**Stalled work:** none — `In Dev` is empty.

**Hand-created `In Dev` tickets:** none — `In Dev` is empty.

**In Design: 2 live, 0 excluded** (THR-1448 unassigned, last activity 0.8d — a sweep warning comment; THR-1479 unassigned, last activity 1.1d — a grooming comment). Both would read 9d and 8d on the intended predicate.

Weekly test-suite health: not due. Today is Sunday; the next run is Monday 2026-09-21.

## Escalations

None opened. The only open question is when a design chat and the unfinished encounter sitting happen — both are Christian's call and both are on the briefing above, so a Discord post would add noise rather than information. Nothing parked.
