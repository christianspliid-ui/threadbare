---
lane: tb-orchestrator
run: 2026-09-07n
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-07 (run n, ~15:27–15:45Z)

**Two of the four questions waiting on Christian were answered in the last hour, and the third was built.** [THR-1401](https://linear.app/threadbare/issue/THR-1401) closed at 14:30Z, [THR-1404](https://linear.app/threadbare/issue/THR-1404) at 14:49Z, and at 15:13Z the two-seed census — the item this lane has led its brief with all day — was **run, with numbers, and narrowed to a single decision that has a recommendation attached.** The build shelf refilled 0 → 4 in the same window. None of that was this lane's doing; all of it was the right channels working.

**Two new findings**, both verified at the source rather than relayed: the deciding-mortal budget is more than half inert, and a ticket whose work shipped five days ago is still holding a downstream ticket shut. Detail under § T3.

## Needs Christian

**One question this hour, and it is much smaller than last hour's.** Two of the four things waiting on you are done.

### 1. The census ran. It needs one decision — [the two-seed census](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings)

This has been top of your list all day. It is now **built and run** — two worlds, 150 turns each, [with the picture drawn out](https://claude.ai/code/artifact/16daf1ae-2412-4501-8e32-a91012e0a97a).

What it found: of the **42 kinds of work** a mortal could take up, 16 happened in one world and 18 in the other. Mortals began 144 and 83 pieces of work and finished 78 and 23.

**23 kinds never fired at all**, and they split cleanly:

- **18 the world has not grown into.** There is nothing of that kind yet for a mortal to act on — no rings, no standing agreements, no powers or curses held by mortals; in some cases the thing exists but no mortal owns one.
- **5 nobody wants.** Lowering a trade road, seizing a settlement by force, destroying an army, destroying an item, destroying a place.

**Your call is on those five.** Three options: leave them live and wait for the world to want them; retire them; or widen who can reach them, so more than one kind of person can take that work up. **The recommendation on the table is to retire the five nobody wants and keep the eighteen the world has not grown into** — a world that has not filled out yet is a different thing from work that should not exist.

Answering this unblocks the flip of the whole model, which is the last step of this stretch of work.

### 2. Still waiting: approve the encounter batch — [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)

Unchanged. Saying *"Batch 2, run the six"* puts six encounters of content work on the build queue the same hour. Brief: [4 September](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md).

### 3. Still waiting: a yes or no on spending image credits — [regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

Unchanged. Five Meet-The-First scene pictures carry defects — painted-in buttons, baked-in titles, individuated faces. Regenerating them spends image credits, which is the only reason it waits. Nothing is broken meanwhile; substitutes are standing in.

### And two things came off this list

**[The untouched-by-design list](https://linear.app/threadbare/issue/THR-1401)** and **[what the player sees of a mortal's work](https://linear.app/threadbare/issue/THR-1404)** were both answered in the last hour, and the answers have already become build tickets — the shelf went from empty to four while this ran.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **48 `Todo`** (down from 52), **4 `Ready for Dev`** (up from 0), **3 `In Dev`** of which **one is live** — [THR-1431](https://linear.app/threadbare/issue/THR-1431) claimed 14:30Z; [THR-1392](https://linear.app/threadbare/issue/THR-1392) and [THR-1130](https://linear.app/threadbare/issue/THR-1130) both carry `Parked`. The executor's WIP=1 slot is occupied with depth behind it, for the first time in ten runs.

**The shelf refilled without this lane touching it.** [THR-1430](https://linear.app/threadbare/issue/THR-1430) was promoted by the authoring session; [THR-1432](https://linear.app/threadbare/issue/THR-1432), [THR-1433](https://linear.app/threadbare/issue/THR-1433) and [THR-1434](https://linear.app/threadbare/issue/THR-1434) were filed straight into it.

**Run m's THR-1430 decline is closed out, correctly and by someone else.** Run m declined it as *wrong destination* — its plan doc did not exist, so the liveness gate would have read `MISSING`. Checked this run: its handoff comment names `Docs/plans/2026-09-07-thr-1430-dormant-kinds-rings-plot.md`, merged via [PR #1841](https://github.com/christianspliid-ui/threadbare/pull/1841), `check:plan-doc-liveness → LIVE`, with a full coordination block and mutex reasons stated inline. Its mutex read *"land THR-1429 first"*; [THR-1429](https://linear.app/threadbare/issue/THR-1429) went `Done` at 15:07Z, so that has cleared too. Nothing for this lane to do — recorded because the decline was this lane's and its resolution should be traceable to the same file.

### Declines re-derived this run

Only those whose evidence could have moved, given the fourteen completions of the last two days.

- **[THR-1301](https://linear.app/threadbare/issue/THR-1301) — standing satisfied-upstream verdict. All three blockers are `Done`, and promoting anyway would have been the exact THR-990 failure.** Detail under § T3; this is the run's second finding.
- **[THR-1256](https://linear.app/threadbare/issue/THR-1256) — unmet time gate, unchanged.** Window opens **2026-09-08**; today is 2026-09-07. Everything else was verified in run j. The first run after 00:00Z tomorrow promotes it.
- **[THR-1222](https://linear.app/threadbare/issue/THR-1222) — unmet human-approval gate.** Held in `Todo` until Christian approves the batch-2 brief in chat. No blockers, no assignee, brief live on `main`. Surfaced above as item 2.
- **[THR-1393](https://linear.app/threadbare/issue/THR-1393) — wrong destination.** Native `blockedBy` is empty, so the dependency field alone would promote it. Its body does not permit that: it requires picking an engine reader for intelligence records and *designing* the `knows_of`-or-successor schema, which it names as *"a design decision, not an executor's call."* THR-1428's owed-readers work shipped this morning and did **not** cover intelligence — the census independently confirms nothing reads it. T2's input, not the queue's.
- **[THR-1348](https://linear.app/threadbare/issue/THR-1348) — wrong destination.** Also no native blockers. Done-when 1 is *"a verdict is recorded on which of the three readings holds"*, and the body states the fork *"is not the executor's to settle."* A comment was posted this run (§ T3) — evidence only, no verdict, no state change.

**Wayfinder issues skipped unconditionally:** 17 of the 48 `Todo` items carry a `wayfinder:*` label (was 20 — THR-1399, THR-1401 and THR-1404 all closed).

Standing declines on the remaining ~26 keep their evidence in [runs a–m](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07m.md) and are not re-derived here.

## T1.5 — wayfinder sweep

**Four open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — the queue is empty, re-verified board-wide by label rather than carried forward.**

- `wayfinder:research`: **20 of 20 `Done`.**
- `wayfinder:task`: **4 of 5 `Done`.** The fifth is [THR-1403](https://linear.app/threadbare/issue/THR-1403), whose native `blockedBy` was re-read this run and still names [THR-1402](https://linear.app/threadbare/issue/THR-1402).

Every remaining item on every open map is a decision, not legwork — which is why this tier resolves nothing and is not failing to.

**The [undertakings map](https://linear.app/threadbare/issue/THR-1396) frontier halved this hour, 4 → 2:**

| ticket | type | state |
|---|---|---|
| [THR-1401](https://linear.app/threadbare/issue/THR-1401) untouched-by-design list | grilling | **`Done` 14:30Z** |
| [THR-1404](https://linear.app/threadbare/issue/THR-1404) what the player sees | grilling | **`Done` 14:49Z** |
| [THR-1402](https://linear.app/threadbare/issue/THR-1402) two-seed census | prototype | frontier — **HITL**, legwork complete, one decision open |
| [THR-1403](https://linear.app/threadbare/issue/THR-1403) migrate the 64, flip to cells | task (AFK-eligible) | blocked by THR-1402 |

**THR-1402 has changed shape, and that is the run's main news.** It is still `wayfinder:prototype` and still untouchable by this lane. But the prototype has been *built and run* — a throwaway branch, a division rule, `UNDERTAKING_MODEL='cells'`, seeds 42 and 99 at 150 ticks — and its comment ends with one scoped question and a recommendation. The map's entire downstream now hangs on a single answer rather than three questions plus a build.

Its comment also carries three method notes written explicitly for THR-1403's plan — completions appear in no trace and must be harvested from `strategicState.history` every tick; a claim is a stance, so a "failed claim" means held-then-collapsed; `strategic_action_started` carries `agentId`, not `actorId`. Those are what will make THR-1403 AFK-doable the moment its blocker clears.

**The other three maps are unchanged** — Physical Conflict, Powers & Spellcraft, Item Generator. Every open child of each is `grilling` or `prototype`.

**Map body not edited by this lane.** Its stale plan-doc line (flagged in runs l and m) is the charting session's to fix; the T1.5 carve-out covers appending to Decisions-so-far only for tickets this lane resolved, and this lane resolved none.

## T2 — design staging

**Not triggered. Shelf holds 4 non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2 — the first run in ten where this tier had no reason to fire.**

All four are program work in *Thematic Pressure & Living World*; none carries `Deferral`, so the count is the honest one the floor was written to measure rather than occupancy.

**Nothing staged, nothing mutated, and the `In Design` bound was never consulted** — the trigger did not fire, so the bound did not come up. Worth stating plainly after several runs of *"triggered and barred"*: the bound is not what stopped this tier this hour. There was nothing to stage.

## T3 — architecture health

**Detector sweep skipped — already run today.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) ran all four detectors, plus the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)). **No detector ran this run, and none is reported clean.**

**Redundancy: not assessed this run.**

**Hand-created `In Dev` tickets: not swept this run.**

Both findings below came out of T1, not out of a detector.

### Finding 1 — the deciding-mortal budget is more than half inert

No detector covers this: an actor that reaches the decision loop and generates nothing is not a reachability failure, not a leaked contract, and not stale canon. It surfaced because [THR-1402](https://linear.app/threadbare/issue/THR-1402)'s census reported it two hours ago as an aside.

**Verified against `origin/main` rather than taken on the census's word** — both ends of the mechanism:

- **The writer stamps nothing.** `src/engine/lairEscalation.ts:219` — `createNamedElite` adds `type:'actor'` with `actorType:'individual'`, `isMonsterElite`, `roleLabel`, `dominantSphere`, `lairId`, `spawnedAtTick`. **No `spotlightTier`, no capabilities, no ambition.**
- **The reader lets them straight in.** `src/engine/strategicKindReachability.ts:54` — `isAutonomousDecisionActor` is `actorType === 'individual' && (spotlightTier ?? 'spotlight') === 'spotlight'`. An unstamped elite satisfies both clauses. `phaseAgentDecision.ts:305` filters on exactly that function, shared on purpose since THR-1329 so the instrument cannot drift from the loop it measures.

**Measured effect (census, seeds 42/99, 150 ticks, medium): 23 of 40 and 20 of 37 deciding mortals decide nothing.**

**Why it matters beyond the number.** [THR-1348](https://linear.app/threadbare/issue/THR-1348) has held a three-way design fork since 2026-08-29, and its Reading 1 — *"17 autonomous actors is the intended attention budget"* — was the strongest of the three on cost grounds. It is weaker now: the budget is not 17 deciding mortals, it is ~17 slots of which **55–57% are occupied by actors with nothing to decide.** That gives the fork a fourth option it did not have when filed — the aperture may be the right size and simply mis-occupied — and unlike Reading 2 it *narrows* the population, so it carries no per-tick cost to measure.

**Recorded as [a comment on THR-1348](https://linear.app/threadbare/issue/THR-1348), not as a promotion, a verdict or a new ticket.** The elite stamp is a technical defect and this lane says so; which reading holds for *real* ambition-holders below the line is the design fork the ticket exists to carry, and it stays open. Two independent defects — clearing one does not admit the other, and the census's numbers do not show whether stamping elites ambient would lift `merchant-expansion` to the ticket's "reachable on ≥2 of 3 seeds" bar. This lane did not measure that and does not claim it.

**Not filed as a process ticket, and it is not one:** an Engine-pillar game defect, not delivery machinery, so the scheduled-lane filing throttle does not reach it. Folding it into the ticket that already owns the question beats a second ticket beside it.

### Finding 2 — a ticket that shipped five days ago is still holding a downstream ticket shut, and no lane can open it

**This run came within one write of the THR-990 failure, and the comment check is what stopped it.** [THR-1301](https://linear.app/threadbare/issue/THR-1301)'s three native blockers are **all `Done`** — THR-1297 (2026-08-27T21:14Z), THR-1302 (2026-08-29T03:42Z), THR-1349 (2026-09-02T19:16Z). On the `Blocked by` half alone it promotes cleanly, and it has been promotable for five days.

Its **latest comment**, dated 2026-09-04T05:55Z and therefore *after* the last blocker cleared, is a standing satisfied-upstream verdict: *"this ticket's remaining scope shipped under THR-1349… Nothing is left to implement."* That is the one decline reason the dependency field cannot express, and it is precisely why THR-990 added the check.

**Re-verified on `origin/main` this run rather than inherited from that comment:**

```
src/data/strategic-action-constants.ts:462
  export const UNIFIED_DECISION_BOARD_MODE: UnifiedDecisionBoardMode = 'live';

git cat-file -e origin/main:src/engine/decisionBoardModeGuard.ts
  → does not exist in 'origin/main'          (Done-when 4, deleted)
```

So the ticket is genuinely finished. **Declined, and no new comment posted** — the 09-04 verdict stands unchanged and re-stating it hourly is the noise this report is meant not to be.

**What is new is the accrued cost.** [THR-1303](https://linear.app/threadbare/issue/THR-1303) carries `blockedBy: THR-1301` and its own Done-when 1 reads *"THR-1301 merged and the board deciding in `'live'`."* The board **is** deciding in `'live'`. THR-1303's gate has therefore been evaluable since 2026-09-02 and is held shut by nothing but a state field on a finished ticket. That is now **five days for THR-1301 and three since the verdict was written**, and it will not clear on its own: this lane may not set `Done` outside the `wayfinder:*` carve-out, and the executor never claims it because its own queue never sees it.

The 09-04 comment called this *"the third satisfied-upstream ticket in three days that no lane can close"* and named THR-1380 as another. **This one is the first with a measured downstream cost**, which is what moves it from a curiosity to a flow defect.

**Logged here, deliberately not filed.** The process-work throttle makes the weekly retro the single promotion point for delivery-machinery defects, and this is one — the cost is one blocked ticket, below the bar that would justify a lane filing on its own initiative. **Recorded so the retro can quote it:** a satisfied-upstream ticket has no closer, and the count is now at least three in a week with one of them blocking real work.

**Product-vs-process completion ratio:** of the **46 completions this lane can see since 2026-08-31**, **38 are product** (engine, content, UI, game design, map decisions) and **8 are process/infrastructure** (THR-1382, THR-1384, THR-1385, THR-1386, THR-1389, THR-1412, THR-1415, THR-1422). The pipeline is running on product; its constraint is answers and authoring throughput, not a shortage of sanctioned work.

## Escalations

**No Discord message, deliberately.** `keep-work-flowing-cc` owns that doorbell and runs at :45, minutes from this run's close. Its step 2.6 reads `## Needs Christian` from the newest sibling report — this one — so the census question reaches him through the owning lane almost immediately. A second lane pinging the same channel ahead of it is a duplicate, not a faster path.

**The stop-and-ask condition is not triggered.** Agreed work is flowing visibly: two map questions answered, a plan doc merged, a band shipped and four tickets filed to the shelf, all inside the last two hours and none of it needing a decision from Christian to happen.

**Nothing parked.**
