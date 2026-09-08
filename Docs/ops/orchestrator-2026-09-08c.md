---
lane: tb-orchestrator
run: 2026-09-08c
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-08 (run c, ~18:26–18:35Z)

**One thing happened this hour that changes what the board means: a ticket two sweeps had written off as superseded is not superseded, and nothing was ever going to notice.**

[THR-1303](https://linear.app/threadbare/issue/THR-1303) landed at 17:45Z. Its closing checklist promised to retire [THR-1287](https://linear.app/threadbare/issue/THR-1287) *"when the deletion lands"* — and runs [a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md) and [b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08b.md) both declined THR-1287 on exactly that basis. **The deletion landed and kept the machine** — its own merge commit says so in the title, *"the control family deletes, but not the machine underneath it"*. THR-1287's defect is verified live on `main` today. Since THR-1303 is now `Done` and closed, nothing would ever have revisited that promise, and every future sweep would have re-read "superseded pending THR-1303" and declined again — the dead-wait shape run a broke for [THR-1301](https://linear.app/threadbare/issue/THR-1301), rebuilding itself one ticket over. [Corrected on the ticket](https://linear.app/threadbare/issue/THR-1287) with the verification, so the next sweep reads it instead of re-deriving it.

**Promoted nothing.** The one candidate that came free this hour ([THR-1442](https://linear.app/threadbare/issue/THR-1442)) had its blocker replaced by a new one seventeen minutes later. Detail in T1 — the hold is renewed on fresh evidence, not carried over.

## Needs Christian

Three standing asks, unchanged, restated because the briefing reads its list from this section and dropping them would read as "nothing needs you". Then one new thing that is **not** an ask yet.

### 1. Approve the encounter batch — [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**Now four days waiting — still the longest-standing ask and the biggest single unblock.** Saying *"Batch 2, run the six"* puts six encounters of content work on the build queue the same hour. Brief: [4 September](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md). The question inside it is whether the camp six should be **repaired in place or re-rolled from fresh premises** — they were written in July under the old prose doctrine.

### 2. The fighting design waits entirely on you — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)

Unchanged. All four research questions are answered and written up; **there is no legwork left on it.** The remaining ten are all yours: what defeat should look like, how much monster is just enough, what winning leaves in your hands, whether companies fight as units. When you have an evening, open a chat and say *"work the physical conflict map"*.

### 3. A yes or no on spending image credits — [regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

Unchanged. Five Meet-The-First scene pictures carry defects — painted-in buttons, baked-in titles, individuated faces. Regenerating them spends image credits, which is the only reason it waits. Nothing is broken meanwhile; substitutes are standing in.

### Not an ask yet — a decision you will want when you next touch undertakings

**Holding something in the world is currently a timer, not a commitment.** When a mortal takes control of a place, that grip decays on a fixed schedule — about thirty ticks — and **there is no action they can take to renew it.** Attending to what you hold does nothing. The grip simply runs out.

The game says otherwise: the manual page frames Control as *"sustained commitment"* and *"a grip you stop renewing slowly opens"*, which implies renewal is possible. It never has been.

This is worth knowing **now** rather than later because [the work landing today](https://linear.app/threadbare/issue/THR-1438/the-ownership-of-people-things-claim-and-seize-a-company-an-army-a) extends holding from places to **people-things** — taking command of a company, seizing an army, standing for leadership of a faction. Once it lands, a mortal can take command of a company and then lose it to the clock with nothing they could have done about it.

**The open question is yours, and it is a rules-of-play one:** what should attending to something you hold *cost*, and what should it *buy*? There are three candidate shapes on [the ticket](https://linear.app/threadbare/issue/THR-1287) and none is chosen. **Nothing is blocked on you today** — the band shipping now doesn't need the answer to land. It needs it before holding-things is something you'd want a player to care about.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 1. Corrected: 1.** The ceiling never engaged — shelf at scan was 3, far under the 15-item backed-up threshold, so nothing below is throttling.

Board at scan (~18:27Z): **47 `Todo`** (16 carrying a `wayfinder:*` label, skipped unconditionally), **3 `Ready for Dev`**, **3 `In Dev`**, **2 `In Design`**.

**One live claim.** [THR-1438](https://linear.app/threadbare/issue/THR-1438) moved `Ready for Dev` → `In Dev` at **18:02:00Z**, ~25 minutes before this scan, assigned. The other two `In Dev` issues ([THR-1392](https://linear.app/threadbare/issue/THR-1392), [THR-1130](https://linear.app/threadbare/issue/THR-1130)) both carry `Parked` with no assignee. No open PRs on the repo at scan time.

### Held — [THR-1442](https://linear.app/threadbare/issue/THR-1442), the grid's `control:claim` churn gap

**Run b's hold condition fired.** THR-1303 reached `Done` at 17:45:14Z and the deletion is real — verified against `origin/main` @ `03da0b3c` (run b measured `df715a4d`):

```
STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS   → no match in src/
evaluateControlClaimGate                   → no match
computeControlPressure                     → no match
control_already_held                       → no match
```

Run b's objection is fully discharged: Done-when #3 asks for that constant to *return*, which is now meaningful against the tree rather than already-satisfied.

**A new blocker replaced it seventeen minutes later.** THR-1438's own handoff comment declares `Mutex with: any ticket editing src/data/undertaking-objects.ts, src/engine/strategicActionCandidates.ts or src/engine/phaseFactionSuccession.ts` — and THR-1442's work lands in `strategicActionCandidates.ts`. The mutex holds from both directions and its stated reason is verifiably applicable, so it is not reversible under THR-688 rule B.

**Why not promote and let the mutex bounce it:** at `Medium` it sorts above THR-1439 and THR-1440 (both `No priority`), so `pull-work` reaches it first and refuses it every hour until THR-1438 merges — the top-of-queue-refusal shape the promotion rules exist to avoid, bought for nothing.

**And the collision is worse than scheduling.** THR-1442's first question asks whether the cell's target rule already filters held objects, citing `'control:claim': 'unowned'` in `OWNERSHIP_BY_VERB` (`src/data/strategic-action-constants.ts:944`, confirmed present today). THR-1438 rewrites exactly that path — `findValidTargets` reads a new `ownershipOverride` hook *in place of* `OWNERSHIP_BY_VERB` for Company/Army/Faction. **A measurement taken today would answer a question about a table that stops being consulted within hours.**

Held, not declined; **terminating condition: the first sweep after THR-1438 reaches `Done`.** [Recorded on the ticket](https://linear.app/threadbare/issue/THR-1442) with the coordination block carried verbatim, since a bare comment would have become the newest and stripped the three lines `pull-work` Step 3 reads.

### Corrected — [THR-1287](https://linear.app/threadbare/issue/THR-1287) is not superseded, and the standing decline was wrong

Runs a and b declined this as "superseded pending THR-1303's deletion", quoting THR-1303's Done-when #4. **That premise did not survive THR-1303's own implementation.** The predicate re-verified on `origin/main` @ `03da0b3c`:

```
strategicActionLifecycle.ts:1094   const newNeglect = control.neglectTicks + 1;   ← only ever increments
strategicActionLifecycle.ts:1100   retireControl(..., neglectTicks: newNeglect, degradation: 1)
strategicActionLifecycle.ts:1102   { ...control, neglectTicks: newNeglect, degradation: newDegradation }
strategicActionLifecycle.ts:1105   { ...control, neglectTicks: newNeglect }
```

The only `neglectTicks: 0` write is line 537, inside the `claimControl` success arm — **establishing a stance, never renewing one.** `retireControl`, `claimControl` and the whole neglect/degradation/collapse loop are intact.

**The defect got quieter, not smaller.** Pre-deletion, `computeControlPressure` read `neglectTicks / 8` to raise an upkeep candidate that `claimControl` then refused. Useless, but visible. That reader is now deleted, so `neglectTicks` is incremented every tick, rendered in `strategicTelemetry.ts:97`, and **read by nothing that makes a decision.** Live, not hypothetical: THR-1442's own census measured `strategic_control` at 58/1347 decisions (seed 42) and 18/1263 (seed 99).

**Still declined for T1 — but on the ticket's own words, not the dead supersession.** Its Done-when opens *"Design decision recorded first (this is a rules-of-play question, not a defect with one right answer)"* → wrong destination, routes to T2. T2 could not take it either (see below). Surfaced to Christian above instead. A coordination block was derived into the comment, flagged as derived — the ticket had none.

### Declined — unchanged, evidence not re-derived

The standing declines ([THR-1222](https://linear.app/threadbare/issue/THR-1222) human-approval gate · [THR-1301](https://linear.app/threadbare/issue/THR-1301) nothing left to implement · [THR-1348](https://linear.app/threadbare/issue/THR-1348) and [THR-1393](https://linear.app/threadbare/issue/THR-1393) wrong destination → T2 · 16 `wayfinder:*`) all hold on the evidence [run a recorded](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t1--unblock-sweep). Nothing on any of them changed. Re-listing them with fresh timestamps would be the stale-decline noise the reporting rules forbid.

## T1.5 — wayfinder sweep

**Four open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — the queue is empty by measurement, not by skipping it.**

Re-measured this run by label sweep across the whole team: **every `wayfinder:research` ticket is `Done` (21 of 21)** and **every `wayfinder:task` ticket is `Done` (5 of 5)**. No agent-doable decision ticket exists on any map. Every open child of every map is `grilling` or `prototype` — HITL by label, untouchable by this lane by rule.

**[THR-1396](https://linear.app/threadbare/issue/THR-1396) — Undertakings: all three bands now in flight or built.** Its third band [THR-1438](https://linear.app/threadbare/issue/THR-1438) entered `In Dev` at 18:02Z; [THR-1439](https://linear.app/threadbare/issue/THR-1439) and [THR-1440](https://linear.app/threadbare/issue/THR-1440) remain queued. This map's design work is finished — what remains is build time, not decisions.

**The other three maps** are unchanged: [THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict (10 open, all HITL, none assigned — the largest HITL debt, zero remaining legwork), [THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft (sole open child assigned to Christian), [THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator (one unassigned `prototype`).

**Nothing was owed from this lane and no map body was edited** — Decisions-so-far gains a line only for tickets this lane resolved, and it resolved none.

## T2 — design staging

**Not triggered, and separately barred. Both measurements below.**

**Trigger:** non-`Deferral` items in Ready for Dev = **2** ([THR-1439](https://linear.app/threadbare/issue/THR-1439), [THR-1440](https://linear.app/threadbare/issue/THR-1440); [THR-1256](https://linear.app/threadbare/issue/THR-1256) carries `Deferral`) against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger is *fewer than* 2, so it did not fire — **by one item.** THR-1438 leaving the shelf for `In Dev` is what took this from 3 to 2. One more pickup and T2 triggers next hour.

**Bound:** `In Design` holds **2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1 — [THR-790](https://linear.app/threadbare/issue/THR-790) (assigned, 5.5d) and [THR-1002](https://linear.app/threadbare/issue/THR-1002) (unassigned, 5.5d). Both sit under `ORCH_IN_DESIGN_STALE_DAYS` (7), so both count. **So even had the floor fired, staging was unavailable** — which is what stopped THR-1287 being staged this run despite being T2's proper destination.

**Nothing was mutated.** Excluding is a count, not a state change; applying `Parked` is Christian's call.

**The date to watch is still 2026-09-10**, when THR-1002 crosses 7 days and should stop counting — but only if nothing comments on it first. That is [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md)'s Finding 1, a warn-only guard whose warning resets the clock it reads.

**The honest reading:** the shelf is one pickup from thin, the staging budget is full, and the one item that most wants design (THR-1287) cannot get it. The constraint remains design and approval capacity, not promotion throughput.

## T3 — architecture health

**Not due. Skipped, correctly, and no detector result is reported.**

[Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t3--architecture-health) ran the full sweep at ~16:27Z today — the tier is daily on the first run after `ORCH_HEALTH_SWEEP_HOUR`, and that run was it.

**Explicitly not run and not claimed as clean:** `generate-interface-map:dry`, `check:canon-staleness`, `sweep:rank-reach`, `check:process`. Their last real results are run a's. **`__DEBUG.validateTraitRefs()` remains browser-only and unmeasurable headless.** **Redundancy: not assessed this sweep** — no judgement pass was run.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Tuesday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**The one new finding this run is counted here but came out of T1 verification, not a detector sweep** — the THR-1287 supersession failure above. It is what `newFindings: 1` counts; no detector produced it and none is claimed to have.

**Run a's Finding 1 stands open and unfiled** — the `create` verb family losing the `occurred_at` edge that makes witnesses possible (5 failures in 900 ticks, 100% correlated with `cell.create.*`). Per the scheduled-lane throttle it goes to the weekly retro rather than becoming a ticket from a lane. Restated only so a reader of the newest report does not conclude it was dropped.

**One sub-bar observation, deliberately not filed.** `src/engine/__tests__/strategicControlChurn.test.ts` was correctly narrowed by THR-1303 — its five surviving tests all exercise the retained lifecycle and none is vacuous (I read the bodies, not the filename). But its **file docblock** still advertises three pinned behaviours, two of which were deleted with the gate. Doc drift explicitly does not clear the materiality bar and scheduled lanes do not file process tickets, so it is a heads-up on [THR-1442](https://linear.app/threadbare/issue/THR-1442) for whoever picks that up and a line here — nothing more.

### Product vs process — the week

Not re-derived; the trailing-week measure remains [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md)'s **~24 product / 6 process (~80% product)**. **This run promoted nothing and filed nothing**, so it moved neither side. The headline is unchanged and is not a call for more tidying: the constraint is design and approval capacity.

## Escalations

**No Discord escalation raised.** Agreed work is not exhausted — three items on the shelf, two of them program work, one live claim against them — so the escalation condition did not fire. The three Christian-facing asks travel by the briefing, which is the sanctioned channel.

**A closing checklist made a promise nothing can now keep — handled, not escalated.** THR-1303's Done-when #4 committed to closing THR-1287 "when the deletion lands". THR-1303 is `Done`; the deletion landed; THR-1287 is untouched and its premise is intact. There is no mechanism that revisits a closed ticket's unmet checklist item, so the obligation would simply have evaporated. Discharged by [correcting THR-1287 directly](https://linear.app/threadbare/issue/THR-1287) rather than filing anything. **Worth one line at the retro as a pattern, not a ticket:** a Done-when that promises to close *another* ticket has no enforcement, and when the implementation narrows mid-flight the promise silently inverts.

**Still parked with no owner: [THR-1301](https://linear.app/threadbare/issue/THR-1301) cannot be closed by anything that currently runs.** All four Done-whens are satisfied on `origin/main` and its scope shipped under THR-1349, but this lane may not write `Done` outside the wayfinder carve-out and an executor claiming it would bounce. Inert rather than harmful. Still routed to `daily-backlog-grooming`, which owns state contradictions. Unchanged from runs a and b; restated because it has no other surface.
