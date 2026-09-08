---
lane: tb-orchestrator
run: 2026-09-08d
promoted: 1
filed: 0
resolved: 1
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-08 (run d, ~19:27–19:36Z)

**Two things this hour. A hold that three runs had been carrying came off, on the event it named. And a second ticket turned out to be finished — shipped in full, under somebody else's number, with nothing that will ever close it.**

[THR-1438](https://linear.app/threadbare/issue/THR-1438) merged at 18:52Z. Run c held [THR-1442](https://linear.app/threadbare/issue/THR-1442) with an explicit terminating condition — *"the first sweep after THR-1438 reaches `Done`"* — and this is that sweep, so it is promoted rather than held a fourth time. The second objection (that a measurement taken mid-rewrite would be stale) is discharged against the tree, not waved off: the ownership table has stopped moving, and the shape THR-1438 left behind makes the ticket's own first question **sharper**, not moot.

Separately, [THR-1380](https://linear.app/threadbare/issue/THR-1380) — three glossary terms proposed a week ago — is done. Every clause of it, disambiguations included, landed inside THR-1299's final slice on 2 September. The glossary entries literally say *"seated by THR-1380"*. The ticket has sat in `Todo` since, and nothing on the board would ever have noticed.

## Needs Christian

Three standing asks, unchanged and restated in full — the briefing builds its list from this section, so anything dropped here reads to you as "no longer wanted". Then one thing that is still not an ask.

### 1. Approve the encounter batch — [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**Five days waiting now, and still the biggest single unblock on the board.** Saying *"Batch 2, run the six"* puts six encounters of content work into the build queue the same hour. The brief is here: [4 September retrofit brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md). The question inside it is whether the camp six should be **repaired in place or re-rolled from fresh premises** — they were written in July, under the old prose doctrine.

### 2. The fighting design waits entirely on you — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)

Unchanged, and re-measured this run: **there is no legwork left anywhere on it.** All four research questions are answered and written up; every one of the ten remaining questions is yours. What defeat should look like. How much monster is just enough. What winning leaves in your hands. Whether companies fight as units. When you have an evening, open a chat and say *"work the physical conflict map"*.

### 3. A yes or no on spending image credits — [regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

Unchanged. Five Meet-The-First scene pictures carry defects — painted-in buttons, baked-in titles, individuated faces. Regenerating them spends image credits, which is the only reason it waits. Nothing is broken meanwhile; substitutes are standing in.

### Still not an ask — the holding-things decision, restated because it just got closer

**When a mortal takes hold of something in the world, that grip is a timer, and there is nothing they can do to renew it.** Attending to what you hold does nothing; after about thirty ticks the grip simply runs out. The manual page says otherwise — Control is described as *"sustained commitment"*, *"a grip you stop renewing slowly opens"* — which implies a renewal that has never existed.

This mattered a little more today than yesterday: [the work that landed this evening](https://linear.app/threadbare/issue/THR-1438) extends holding from *places* to *people* — taking command of a company, seizing an army, standing for leadership of a faction. A mortal can now take command of a company and lose it to the clock with nothing they could have done about it.

**Nothing is blocked on you.** The question is a rules-of-play one and it is yours: what should attending to something you hold *cost*, and what should it *buy*? Three candidate shapes sit on [the ticket](https://linear.app/threadbare/issue/THR-1287) and none is chosen. It needs an answer before holding-things is something a player would care about, not before the next thing ships.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Declined: 1 new, on a verification worth having. The ceiling never engaged** (1 against `ORCH_PROMOTE_BATCH_MAX` 5; shelf at scan was 2, far under the 15-item backed-up threshold).

Board at scan (~19:28Z): **46 `Todo`** (16 carrying a `wayfinder:*` label, skipped unconditionally), **2 `Ready for Dev`**, **3 `In Dev`**, **2 `In Design`**.

**One live claim.** [THR-1439](https://linear.app/threadbare/issue/THR-1439) moved `Ready for Dev` → `In Dev` at **19:02Z**, ~25 minutes before this scan, assigned, with a claim comment. The other two `In Dev` issues ([THR-1392](https://linear.app/threadbare/issue/THR-1392), [THR-1130](https://linear.app/threadbare/issue/THR-1130)) both carry `Parked` with no assignee.

### Promoted — [THR-1442](https://linear.app/threadbare/issue/THR-1442), the grid's `control:claim` churn gap

**Blocker: THR-1438, `Done` at 2026-09-08T18:52:43Z**, merged as PR #1857 / commit `0c898d44`; `origin/main` now at `06d6a86c`. That is the exact event run c named as this hold's terminating condition. Verified by re-query, not inferred: `Ready for Dev`, no assignee key.

Run c's hold had two legs and both are discharged, the second with a measurement:

**Leg 1, the file mutex** — THR-1438 held `src/engine/strategicActionCandidates.ts` while `In Dev`. It merged; the concurrency reason is spent.

**Leg 2, "a measurement today would answer question 1 about a table that stops being consulted"** — this was the stronger objection, and the answer is that the table has settled in a way that makes the ticket *more* worth doing:

```
src/data/strategic-action-constants.ts:948   'control:claim': 'unowned'     ← default, unchanged
src/data/undertaking-cells.ts:192            type.ownershipOverride?.[variant] ?? OWNERSHIP_BY_VERB[variant]
src/engine/undertakingResolver.ts:88         type.ownershipOverride?.[proposed]  ?? OWNERSHIP_BY_VERB[proposed]
src/data/undertaking-objects.ts:1474 (FACTION)  ownershipOverride: { 'control:claim': 'any' }
```

THR-1438 introduced **exactly one override**, on `FACTION`, opening `control:claim` from `unowned` to `any` — because a faction's holder is *derived*, so the object always reads as somebody's and the candidacy cell would otherwise be unreachable by construction. The already-held guard for that one type therefore moved out of the ownership rule and into a hand-written `eligibility` hook (`seat_is_filled`, `already_leads`, `already_stood`).

So THR-1442's first question — *does the cell's target rule already filter held objects?* — now has a **per-object-type** answer rather than a global one, which is precisely the judgement its `Suggested model: Opus` line was written for. Recorded [on the ticket](https://linear.app/threadbare/issue/THR-1442) with the full coordination block, the evidence shape, and a warning to read that table by symbol rather than by line (the description's citations have drifted two ways since it was written).

**The live mutex is stated, not hidden.** THR-1439 is `In Dev` and edits the same file. It is a *concurrency* mutex only — its four cells (`use × Location`, `change:raise × Route`, `control:seize × Agreement`, `use × Standing`) do not touch `control:claim`'s ownership resolution, so unlike THR-1438 it does not move the ground question 1 stands on. It discharges on its merge, exactly as THR-1439 itself reversed THR-1438's mutex at 19:02Z. And with WIP=1 held by a live claim, no pickup happens meanwhile, so this promotion cannot produce the hourly top-of-queue refusal run c was avoiding.

*On ordering:* at `Medium` this sorts above [THR-1440](https://linear.app/threadbare/issue/THR-1440) (`No priority`), and the ticket's own body says it *"sorts by priority and does not jump the queue"*. That is consistent, not contradicted: it is a `Deferral` in a project with active work, which is rule 1 of CLAUDE.md § Prioritization. No priority was set by this lane.

### Declined — [THR-1380](https://linear.app/threadbare/issue/THR-1380) is finished, and no mechanism can close it

The UL proposal for **Calling**, **Moment** and **Follow**. Its only gate was *"entries land with or after the THR-1299 executor's implementation"* — and THR-1299's own final slice is the commit that wrote them. Verified on `origin/main` @ `06d6a86c`:

```
Docs/ubiquitous-language/Agents.md:582   ### Calling
Docs/ubiquitous-language/Agents.md:598   ### Moment
Docs/ubiquitous-language/Agents.md:614   ### Follow
Docs/ubiquitous-language/Prose.md:60     Chronicle Entry → Also see: [[Moment]], [[Calling]]
```

landed by `78caf436` (*"docs+types: the bridge subtype, the rulebook and glossary entries, and the close — THR-1299 slice 6"*, PR #1777). **Checked clause by clause, not by heading count** — a heading proves an entry exists, not that it says what was asked for. All three disambiguations the proposal specifically demanded are present: the faction verb *Kindle a Calling* (THR-433), the retired *Defining Moment*, and *retinue* held to its court sense (THR-1099). Each entry's status line reads `seated by THR-1380`.

Not promoted, because promoting a ticket whose scope is already on `main` buys a bounce, not a merge. Not closed, because this lane does not write `Done` outside the wayfinder carve-out. [Recorded on the ticket](https://linear.app/threadbare/issue/THR-1380) with the full clause table so the next sweep reads it instead of re-deriving it. See § Escalations — it is the second of these now.

### Declined — unchanged, evidence not re-derived

The standing declines ([THR-1222](https://linear.app/threadbare/issue/THR-1222) human-approval gate · [THR-1301](https://linear.app/threadbare/issue/THR-1301) nothing left to implement · [THR-1348](https://linear.app/threadbare/issue/THR-1348) and [THR-1393](https://linear.app/threadbare/issue/THR-1393) wrong destination → T2 · [THR-1287](https://linear.app/threadbare/issue/THR-1287) wrong destination → T2, corrected in run c · 16 `wayfinder:*`) all hold on the evidence [run a recorded](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t1--unblock-sweep). Nothing on any of them changed this hour.

## T1.5 — wayfinder sweep

**Four open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — the queue is empty by measurement, re-taken this run rather than carried over.**

Full label sweep across the team: **`wayfinder:research` 21 of 21 `Done`**, **`wayfinder:task` 5 of 5 `Done`**. No agent-doable decision ticket exists on any map. Every open child of every map carries `grilling` or `prototype` — HITL by label, untouchable by this lane by rule.

**[THR-1396](https://linear.app/threadbare/issue/THR-1396) — Undertakings: the band program is now two-thirds built.** [THR-1438](https://linear.app/threadbare/issue/THR-1438) `Done` 18:52Z; [THR-1439](https://linear.app/threadbare/issue/THR-1439) `In Dev` since 19:02Z, having reversed THR-1438's mutex on the merge evidence; [THR-1440](https://linear.app/threadbare/issue/THR-1440) queued. This map's design work is finished — what remains is build time, not decisions.

**The other three are unchanged:** [THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict (10 open, all HITL, none assigned — the largest HITL debt on the board, and zero remaining legwork), [THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft (sole open child assigned to Christian), [THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator (one unassigned `prototype`).

**No map body was edited** — Decisions-so-far gains a line only for tickets this lane resolved, and it resolved none.

## T2 — design staging

**Triggered on the floor for the first time in days, then barred by the bound. Both measurements below, and this run took the second one from the authoritative source rather than by eye.**

**Trigger: fired.** Non-`Deferral` items in `Ready for Dev` = **1** ([THR-1440](https://linear.app/threadbare/issue/THR-1440); [THR-1256](https://linear.app/threadbare/issue/THR-1256) and the newly promoted [THR-1442](https://linear.app/threadbare/issue/THR-1442) both carry `Deferral`) against `ORCH_PROGRAM_WORK_FLOOR` of 2. Run c predicted *"one more pickup and T2 triggers next hour"*; THR-1439's 19:02Z claim was that pickup.

**Bound: barred. `In Design` holds 2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1.

The skill says the executable copy of this predicate is `classifyInDesignItem` in `scripts/stale-claim-sweep/index.ts`, and that the function wins over prose. So it was read rather than re-derived, and the reading matters:

- **Activity is not `updatedAt`.** `lastInDesignActivityMs` takes the newest of *the newest comment* and *the newest state transition*, and its docblock explains why in the sharpest possible terms: filing THR-1382 cross-linked THR-790 and THR-1002, which bumped both `updatedAt` values to the filing timestamp **to the millisecond** — *"filing the complaint reset the clock on the thing complained about"*. An `updatedAt` predicate would have made the whole guard a no-op on the exact two items it was written for.
- Both items' `updatedAt` read **2026-09-08T18:32:08Z** at this scan — identical to the millisecond across four unrelated issues, which is that same cross-link bump, not activity.
- Under the real predicate: **[THR-1002](https://linear.app/threadbare/issue/THR-1002)** — unassigned, newest comment 2026-09-03T07:19Z (the grooming lane's verdict), so **5 days**, under the 7-day threshold → *live, counts*. **[THR-790](https://linear.app/threadbare/issue/THR-790)** — assigned, so it counts whatever its age.

Run c reached the same numbers by a different route and happened to be right. Recording the derivation because the route matters: the number that decides whether this lane may stage is one bump away from being wrong, and the thing most likely to bump it is another lane commenting about the stall.

**The date to watch is 2026-09-10 ~07:19Z**, when THR-1002 crosses seven days from that grooming comment and stops counting — *unless something comments on it first*. That is [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md)'s Finding 1 in live operation, and it has already fired once: the 2026-09-02 staleness warning correctly excluded THR-1002 at 14 days, and the grooming lane's reasoned reply to that warning on 2026-09-03 reset the clock to zero. Both lanes behaved correctly. The predicate still lost five days.

**Nothing was mutated.** Excluding is a count, not a state change; applying `Parked` is Christian's call.

**The honest reading is unchanged from run c**, and one item stronger: the shelf is now genuinely thin, the staging budget is full, and the two items that most want design ([THR-1287](https://linear.app/threadbare/issue/THR-1287) and [THR-1348](https://linear.app/threadbare/issue/THR-1348)) cannot get it. The constraint is design and approval capacity, not promotion throughput.

## T3 — architecture health

**Not due. Skipped, correctly, and no detector result is reported.**

[Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t3--architecture-health) ran the full sweep at ~16:27Z today; the tier is daily on the first run after `ORCH_HEALTH_SWEEP_HOUR`, and that run was it.

**Explicitly not run and not claimed as clean:** `generate-interface-map:dry`, `check:canon-staleness`, `sweep:rank-reach`, `check:process`. Their last real results are run a's. **`__DEBUG.validateTraitRefs()` remains browser-only and unmeasurable headless.** **Redundancy: not assessed this sweep** — no judgement pass was run.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Tuesday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**The one new finding is counted here but came out of T1 verification, not a detector** — THR-1380 shipped-and-unclosable, above. That is what `newFindings: 1` counts; no detector produced it and none is claimed to have.

**Two items stand open from earlier runs**, restated so a reader of the newest report does not conclude they were dropped: run a's Finding 1 (the `create` verb family losing the `occurred_at` edge that makes witnesses possible — 5 failures in 900 ticks, 100% correlated with `cell.create.*`), and run c's sub-bar note that `strategicControlChurn.test.ts`'s file docblock still advertises two guards THR-1303 deleted. Both go to the weekly retro under the scheduled-lane throttle, not to tickets from a lane. The docblock one is now carried as a ride-along note on THR-1442's coordination comment, where whoever picks that ticket up will read it.

### Product vs process — the week

Not re-derived; the trailing-week measure remains [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md)'s **~24 product / 6 process (~80% product)**. This run promoted one **product** item (engine behaviour in a live game system — the materiality bar governs process tickets and was not engaged) and filed nothing, so the ratio holds. The headline is unchanged and is not a call for more tidying: **the feature pipeline needs design and approval capacity**, which is why all three items in § Needs Christian are asks rather than reports.

## Escalations

**No Discord escalation raised.** Agreed work is not exhausted — three items on the shelf, one live claim against them — so the escalation condition did not fire. The three Christian-facing asks travel by the briefing, which is the sanctioned channel.

**The satisfied-upstream-with-no-closer set is now two, and it is a pattern rather than two accidents.**

- [THR-1301](https://linear.app/threadbare/issue/THR-1301) — all four Done-whens satisfied on `origin/main`; scope shipped under THR-1349 on 2026-09-02.
- [THR-1380](https://linear.app/threadbare/issue/THR-1380) — every clause shipped under THR-1299 on 2026-09-02, in a commit whose artifact names THR-1380 as the authority that seated it.

Both are inert rather than harmful, and both belong to `daily-backlog-grooming`, which owns state contradictions. Neither can be closed by anything that currently runs: this lane may not write `Done`, and an executor claiming an empty ticket produces a bounce.

**The shared mechanism is worth one line at the retro, not a ticket.** Work filed as ticket A gets *implemented* under ticket B, whose closing commit legitimately carries `Fixes THR-B`. Ticket A is then complete, invisible to the line-anchored auto-close, and invisible to every sweep that reads only its own state — so it sits in `Todo` being re-declined forever, costing a slot in each sweep's judgement. This is the same family as run c's escalation (a Done-when that promises to close *another* ticket has no enforcement): in both cases a real dependency between two tickets exists in prose, and no machinery reads it.
