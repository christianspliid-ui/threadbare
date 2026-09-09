---
lane: tb-orchestrator
run: 2026-09-09b
promoted: 0
filed: 1
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-09-09 (run b, ~20:05–20:20Z)

**Your answer landed and the machine moved.** At 19:55Z you said *"Batch 2, run the six"*; ten minutes later the batch was in the build queue, and this run found it there. The queue is no longer empty, the builder has something to pick up within the hour, and this run added a second job behind it. Nothing needs you.

## Needs Christian

**Nothing needs you.** This is the first orchestrator run in a week that says that without a caveat.

Your one-line answer this evening cleared the whole standing ask. [The camp-six encounter retrofit](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-six-through-the-factory-line-shrine) is queued and the builder will start it on its next hourly pass. [The card-name tightening](https://linear.app/threadbare/issue/THR-1255/tighten-nudge-name-max-words-6-4-once-the-corpus-can-meet-it) that was queued invisibly behind it is now one step from release — it opens the moment the six ship.

Two things stay open and are **deliberately not re-asked tonight**, because neither is urgent and you have just spent attention:

- The [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) map's ten questions — the largest single block of waiting work on the board, and every piece of legwork under it is finished.
- The [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no on credits.

Whenever you want the rest cleared in one go, saying **"rule on the backlog"** brings you the ~13 one- and two-sentence rulings in game terms, smallest first.

## T1 — unblock sweep

**Promoted: 0 (nothing was mine to promote). Filed: 1. Declined: 1 with new evidence. Held: 0.** Ceiling never engaged — shelf 1, far under the 15-item backed-up threshold.

Board at scan (~20:04Z): **43 `Todo`** (15 carrying a `wayfinder:*` label, skipped unconditionally), **1 `Ready for Dev`**, **1 `In Dev`**, **2 `In Design`**. `origin/main` @ `a87e8f24`.

### The board changed under the scan — three state moves in the six minutes around it

| time | what | consequence |
|---|---|---|
| 19:55Z | Christian approves batch 2 in chat | the gate [THR-1222](https://linear.app/threadbare/issue/THR-1222) named is met |
| 19:59:25Z | [THR-1392](https://linear.app/threadbare/issue/THR-1392) → `Done` | the `In Dev` slice empties to one parked item |
| 20:05:38Z | THR-1222 → `Ready for Dev`, by an attended session | **the shelf stops being empty** |

The first `Ready for Dev` query of this run, at ~20:04Z, returned **zero issues** — 94 seconds before the promotion landed. Re-scanned rather than reported, which is the only reason this report is not wrong about the single most important fact on the board.

**The promotion was not this lane's and is correct.** An attended session made it, recorded the approval verbatim, and noted it acted *"because the orchestrator lane was stalled"* — accurate: T1 had correctly declined this ticket for sixteen days on an unmet human gate, and a human gate met in chat is not a thing T1 can observe.

### The promotion was one comment short of usable — repaired, no state touched

`pull-work` Step 3 validates the **latest comment** for `Suggested model` / `Parallel-safe with` / `Mutex with`. THR-1222's latest comment was the 20:00:16Z approval record, which carries none of the three; the authored block sat two comments back, from 2026-08-24.

**This would not have stalled the queue** — and saying so plainly matters more than claiming a save. The ticket is *self-scoped* (its description names `src/data/encounter-content.ts` and `RETROFIT_PENDING`), so Step 3 would have claimed it and derived a block rather than bouncing it (THR-836). What a derivation would have missed is the reason the block was worth re-posting:

- **The mutex on this ticket has been dead for fifteen days.** It reads *"Mutex with THR-1221 — run in sequence"*. [THR-1221](https://linear.app/threadbare/issue/THR-1221) reached `Done` at **2026-08-25T01:45:10Z** and shipped as PR #1603. Reversal recorded in a comment per THR-688 rule B, with the stated reason shown verifiably inapplicable rather than merely unlikely to bite.
- **Plan-doc liveness `LIVE`**, verified by `git ls-tree` against `origin/main` this run — and the trap named: the superseded 2026-08-24 brief **also resolves**, so nothing 404s and the wrong path reads plausible.
- **The description contradicts the approval on three numbers** (seven vs six, `shrine_offering` first vs held to batch 3, and the director sample). Restated at the top of the thread so a pickup reading top-down does not run the wrong scope.

[Comment posted](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-six-through-the-factory-line-shrine). No promotion, no claim, no state change, no assignee touched.

### Filed: THR-1444 — evidence under T3

[THR-1444](https://linear.app/threadbare/issue/THR-1444/undertaking-outcomes-silently-lose-their-site-occurred-at-points-at-a) filed straight into `Ready for Dev` by the three-write sequence (create → separate `assignee:null` → `get_issue`). **Assignee verified absent on the re-query, not on the create echo** — the THR-859 trap. Coordination block posted as the first comment (THR-836).

### One decline re-derived, because its blocker cleared this hour

[THR-1393](https://linear.app/threadbare/issue/THR-1393) (*the `intelligence` object type lands only with its reader*) was carried in run a's standing-decline list. THR-1392 going `Done` at 19:59Z means it now needs a fresh reading, and the reading changed: it is no longer *unmet blocker* but **wrong destination → T2**, on its own words:

> *"which is a THR-1348-class repair in its own right and* **a design decision, not an executor's call**"

and a Done-when whose first line — *"a named engine reader consumes intelligence records"* — requires somebody to choose the reader from three candidates the ticket itself lists. Blockers clearing did not make it dev-ready; it made it design input. Routed, not promoted.

**Standing declines, evidence not re-derived** (run a censused all eleven in full 20 hours ago and every one reproduced): THR-1301, THR-1380, THR-1088, THR-984 (materiality bar), THR-1024, THR-175, THR-1287, THR-1195, THR-1114, THR-1189, THR-1315, THR-1134, THR-1348, THR-1424, THR-1426, THR-1148, THR-1318 · 15 `wayfinder:*`. [THR-1255](https://linear.app/threadbare/issue/THR-1255) stays declined and its predicate is now one step from met — it reads *"THR-1222 **ships**"*, and THR-1222 is queued, not shipped.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — measured this run, not carried forward.**

```
list_issues(label:"wayfinder:research")  → 21 issues, all Done
list_issues(label:"wayfinder:task")      →  5 issues, all Done
```

**Not one agent-doable decision ticket exists on any open map**, for the second consecutive sweep. Every open child of every open map carries `grilling` or `prototype` — HITL by label, untouchable by this lane by rule. Twelve tickets, all waiting on Christian:

- **[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children (THR-1263 … THR-1272), all HITL, none assigned. All four research tickets `Done`. Largest HITL debt on the board, zero remaining legwork.
- **[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** — sole open child THR-1232, assigned to Christian.
- **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** — one unassigned prototype, THR-1236.

**No map body was edited** — Decisions-so-far gains a line only for tickets this lane resolves, and it resolved none. No claim, no assignment, no state change.

## T2 — design staging

**Triggered on the floor. Barred by the bound.** Third consecutive run with this shape, and the shape is unchanged.

- **Trigger fired:** non-`Deferral` items in `Ready for Dev` = **1** (THR-1222; THR-1444 also counts, filed after the measurement — either way under `ORCH_PROGRAM_WORK_FLOOR` of 2).
- **Bound barred it:** `In Design` holds **2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1 — measured on the `classifyInDesignItem` predicate in `scripts/stale-claim-sweep/index.ts`, not on column occupancy.
  - [THR-790](https://linear.app/threadbare/issue/THR-790) — **assigned to Christian** → counts whatever its age. `In Design` since 2026-08-15, **25 days**. Its exit is `Parked`, never demotion; warn-only, and the sweep has already warned.
  - [THR-1002](https://linear.app/threadbare/issue/THR-1002) — unassigned; newest comment **2026-09-03T07:19:42Z**, re-verified this run rather than inherited → **6.5 days**, under the 7-day threshold → live, counts.

**Nothing was mutated.** Excluding is a count, not a state change; applying `Parked` is Christian's call.

**Run a's date to watch is confirmed a second time: 2026-09-10 ~07:19Z**, when THR-1002 crosses seven days and stops counting. **It will change nothing** — THR-790 is assigned and sits at the ceiling of 1 on its own, so the bound stays shut. Worth stating flatly, because two consecutive reports have named that date and a reader could reasonably expect it to unblock something.

**The bound is still not the binding constraint.** Staging produces *a request for an attended session*, not a plan doc — this lane runs Sonnet by Christian's ruling and does not author. Raising `ORCH_MAX_IN_DESIGN` would stage a third item no lane can advance.

## T3 — architecture health

**Due and run in full.** No sweep had run today: [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-09.md) executed at 02:31 local, before `ORCH_HEALTH_SWEEP_HOUR` (06:00), and correctly skipped. Baseline for the diff is [`orchestrator-2026-09-08.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md), the last sweep that executed detectors.

| Detector | Result | vs. 2026-09-08 |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, **115** contracts total (85 LIVE · 2 PARTIAL · 21 UNVERIFIED-OK · 0 HOLLOW · 0 UNWIRED) | LEAKED **unchanged** — same seven, each with its ticket. Total **112 → 115** (+3) |
| `check:canon-staleness` | **27 warnings** | **Unchanged** — 27 → 27. No new page went stale |
| `sweep:rank-reach` | **`PASS`** — 60 reachable, 0 blocked, 0 unowned | Verdict unchanged. Apex holders at tick 900 **18 → 16** |
| `check:process` | exit 0; all generators `--check` clean; wiki-freshness OK across 26 pages | Unchanged |

The seven LEAKED contracts are the same seven: `attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertow-card-drifts-mortal-values`.

**`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** The judgement budget went to the THR-1222 coordination repair and the finding below. Saying so rather than implying coverage.

### Finding 1 (new) — the site-loss bug is not a `create` bug, and yesterday's diagnosis pointed the wrong way

Filed as [THR-1444](https://linear.app/threadbare/issue/THR-1444/undertaking-outcomes-silently-lose-their-site-occurred-at-points-at-a).

Yesterday's sweep found undertaking outcome events losing their `occurred_at` site — the edge the grievance lane walks to find witnesses — and measured **5 failures in 900 ticks, all `cell.create.*`**. It read that 100% correlation as a mechanism and recommended starting at where `originLocationId` is assigned for `create` cells.

This sweep re-ran the same 900 ticks. **4 failures, and only two of them are `create`:**

```
evt_und_proj_cell.control_seize.item_agent_garrison_culture_0_373_421      → loc_2
evt_und_proj_cell.control_seize.location_agent_garrison_culture_0_371_425  → loc_2
evt_und_proj_cell.create.location_ind_5_744_780                            → loc_14
evt_und_proj_cell.create.route_ind_5_745_781                               → loc_14
```

**The shape is per-actor, not per-verb.** Two actors account for all four. `agent_garrison_culture_0` fails twice against `loc_2`; `ind_5` fails twice against `loc_14`. Each actor's two failures carry adjacent cell ids — one actor pointing at one dead location, failing on every cell it runs in that window.

That single `control_seize` observation retires the earlier hypothesis outright: **`control_seize.item_…` creates no location at all**, so "a `create` cell stamps its origin with the site it means to create" cannot explain it. The two verbs share nothing except a location id that is no longer in the graph. The reading the data now favours is a plain **dangling reference** — a location retired while an undertaking is in flight, leaving `project.originLocationId ?? <actor's located_at>` pointing at a node the graph no longer holds.

**The 09-08 reasoning was sound on the data it had.** One extra sample from a second seed-window changed the answer, which is the argument for running this sweep daily rather than trusting a single measurement — and the argument for saying so here rather than quietly filing a ticket that contradicts a sibling report.

**Filed rather than logged, and the throttle permits it:** the scheduled-lane rule bars lanes from filing *process and infrastructure* tickets. This is an engine correctness defect — product work, and a bug is agreed work by D2. Filed `Low` deliberately: four events in 900 ticks does not justify displacing content work, and Rule 0 does not apply.

### Standing sub-duties

**Hand-created `In Dev` tickets: swept, none found.** The one `In Dev` issue passed through `Ready for Dev` — verified on `stateHistory`, not inferred.

**Stalled work: one trip, and it is the same misleading one.** [THR-1130](https://linear.app/threadbare/issue/THR-1130) shows **4** `Ready for Dev → In Dev` transitions (08-15, 08-17, 08-22, 09-04) with no `Done`, at or above `ORCH_STALLED_PICKUP_THRESHOLD` (3). Unchanged from yesterday and still **not stalled, parked** — three of the four re-entries are the park shape being restored after a sweep released it. Recorded so the number is not silently suppressed.

**THR-1130's park is now stale, and this lane does not lift it.** Its park condition was Christian's approval of the batch-2 brief. That approval arrived at 19:55Z. The ticket is `In Dev` + `Parked` + unassigned, so no session holds the executor's slot and nothing is blocked — but it is occupying a state whose stated condition is met. **Deliberately not acted on**: a park is a human's deliberate act, and lifting one on an inference about liveness is exactly the shape that let a lane strip a running session's assignee twice (impediment #755). Flagged for whoever next touches it — most likely the executor, at pickup of its child THR-1222. Pre-empted where it could have bitten: THR-1222's new coordination block names THR-1130 explicitly as a parked parent holding no live surface, so a Step 3 read does not have to guess.

**`In Design`: 2 live, 0 excluded** — figures, dates and both warn arms under § T2.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Wednesday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md). Saying nothing further rather than re-reporting a stale result.

### Product vs process — the week

Trailing-week measure **~25 product / 7 process (~78% product)** — THR-1392 (`Game Design` · `Engine` · `Improvement`) closed at 19:59Z and moves the numerator by one. This run filed one product ticket and promoted no process work.

**The headline has changed for the first time in a week, and only halfway.** The build pipeline is no longer starved: two jobs are queued and the builder is free. What is still starved is *design* — all three wayfinder maps and both `In Design` items wait on the same missing input, an attended session or a ruling. Batch 2 buys roughly one build cycle, not a refilled shelf.

## Escalations

**None posted, and none warranted.** Run g's escalation of 2026-09-08 22:31Z was answered by Christian in chat at 19:55Z today — the ask is discharged, not merely aged out, so it is closed rather than re-parked.

The lane did not fall through to un-agreed work: it filed one bug (agreed by D2) found by its own detectors, repaired one coordination block, and stopped. The sub-bar process work sitting in `Idea` remains unpromoted.

**Sub-bar notes carried to the weekly retro, not filed** (unchanged from run a unless marked): the `In Design` liveness clock counting bot comments as human activity · `strategicControlChurn.test.ts`'s docblock advertising two guards THR-1303 deleted · `undertaking-objects.ts:1490`'s stale docblock caution · the four-instance *shipped-under-a-sibling-id* class (THR-1301, THR-1380, THR-1441, THR-1088) · **new this run:** the canon-staleness detector's false-positive class, where a page goes stale against the auto-generated `Docs/plans/INDEX.md` rather than against anything it documents — a calibration item, and one of the 27 standing warnings is currently of that kind.
