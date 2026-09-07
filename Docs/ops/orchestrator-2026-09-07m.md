---
lane: tb-orchestrator
run: 2026-09-07m
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-07 (run m, ~13:26–13:35Z)

**The queue is refilling itself, and it did not need an answer to do it.** Eighteen minutes before this run opened, a design session split the *dormant kinds* band into two tickets — [THR-1429](https://linear.app/threadbare/issue/THR-1429/the-dormant-kinds-i-powers-and-conditions-a-scholar-learns-a-spell-a) (powers and conditions) and [THR-1430](https://linear.app/threadbare/issue/THR-1430/the-dormant-kinds-ii-rings-and-the-plot-a-spider-founds-and-runs-a) (rings and the plot) — and at **13:26:35Z**, one minute before this scan, opened [PR #1840](https://github.com/christianspliid-ui/threadbare/pull/1840) carrying THR-1429's plan doc. Run l named that band as the one thing T2 wanted to stage and could not. It got authored anyway, through the right channel, by an Opus session.

**A second, unrelated finding: a Deferral filed three weeks ago was quietly answered by this morning's merge, and nobody had noticed.** Detail under § T3.

## Needs Christian

**Nothing new is being asked of you this hour.** One item below got sharper, and one thing that was waiting on you is no longer waiting. The rest is carried forward so it stays in front of you.

**What changed, and it is good news:** the next chunk of build work wrote itself. Mortals learning a spell, a zealot blessing, a witch cursing, a rival's power sealed shut — that design was written this hour and is in review now. It needs no decision from you, and it will reach the build queue on its own.

**And the census question got a second piece of evidence behind it.** Last hour's brief said a third of what shipped this morning cannot pay out until the model flips. This hour that turned up a concrete, older example: the **toll on a captured trade road** was filed as broken back in August — a road could be seized and taxed, and nothing ever collected the tax. This morning's work *fixed* it. The collector is built, wired into the tick, and tested. It still pays nobody, because no mortal in a live world controls a road yet — and mortals only start controlling things once the model flips. That flip waits on the census. So this is the second piece of finished, correct, idle machinery found in two hours, and both point at the same single question.

1. **[The two-seed census](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings)** — still the one to answer, and now with two pieces of shipped-but-idle work behind it. Run the callings-and-work census on two worlds and react to the picture: which kinds of work never fire, which callings sit idle.

2. **[The untouched-by-design list](https://linear.app/threadbare/issue/THR-1401/the-untouched-by-design-list-which-systems-mortals-never-move-by-their)** — which parts of the world mortals are *meant* never to move by their own labour (the doom clock, the rival gods' schemes) versus which are simply missing a hand.

3. **[What the player sees](https://linear.app/threadbare/issue/THR-1404/what-the-player-sees-the-callings-spread-on-the-sheet-the-work-on-the)** — whether a mortal's spread of work shows on their sheet, whether the chronicle names deeds by verb and object, whether the grid becomes a codex page.

4. **[Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** — *"Batch 2, run the six"* puts six encounters of content work on the build queue the same hour. Brief: [4 September](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md).

5. **[Regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** for Meet The First — spends image-generation credits, which is why it waits on a yes or no. Nothing is broken meanwhile; substitutes are standing in.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **52 `Todo`** (up one — THR-1430 was created this hour), **0 `Ready for Dev`**, **2 `In Dev`** — [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants) and [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), both carrying `Parked`, so **zero live**. The executor's WIP=1 slot is free and the shelf is empty; that is the ninth consecutive run reading `Ready for Dev: 0`.

**The empty shelf is a gap between two deliveries, not a stall.** THR-1428 drained the shelf by shipping at 12:10Z, and the plan doc for the next band entered review at 13:26Z — 76 minutes of gap, spent authoring.

**Two new `Todo` candidates this hour, both correctly declined:**

- **[THR-1430](https://linear.app/threadbare/issue/THR-1430/the-dormant-kinds-ii-rings-and-the-plot-a-spider-founds-and-runs-a) — declined, wrong destination.** Its description states its plan doc is *"authored by the design session after the dormant kinds I plan doc; queued behind it."* No plan doc exists yet, so there is nothing for an executor to execute; the liveness gate would read `MISSING`. Native `blockedBy` is empty, which is why the `Blocked by` field alone would have promoted it — the prose gate is the real dependency. It is the design session's input, not the queue's, and that session is already holding it.
- **[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — declined, unmet human-approval gate.** First line of its description: *"Holds in Todo until Christian approves the batch-2 brief in chat."* High priority and otherwise unblocked (no `blockedBy`, no assignee, live brief on `main`), so it is one chat sentence away from the queue. Surfaced as `## Needs Christian` item 4.

**[THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) — declined, unmet time gate, unchanged.** Its window opens **2026-09-08**; today is 2026-09-07. Run j verified everything else about it — no blockers, no assignee, coordination block already in its description — so the first run after 00:00Z tomorrow promotes it without re-deriving any of that.

**Wayfinder issues skipped unconditionally:** 20 of the 52 `Todo` items carry a `wayfinder:*` label.

Standing declines on the remaining ~29 keep their evidence in [runs a–l](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07l.md) and are not re-derived here.

## T1.5 — wayfinder sweep

**Four open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — nothing eligible, re-verified board-wide rather than carried from run l.**

Label sweeps this run: **20 of 20 `wayfinder:research` tickets are `Done`**; of five `wayfinder:task`, four are `Done` and the fifth is [THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells), whose native `blockedBy` was re-read this run and still names [THR-1402](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings). The AFK queue is empty because every remaining item on every open map is a decision, not legwork.

**The [undertakings map](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) frontier is unchanged in shape and now has a second band moving behind it:**

| ticket | type | state |
|---|---|---|
| [THR-1401](https://linear.app/threadbare/issue/THR-1401) untouched-by-design list | grilling | frontier — **HITL** |
| [THR-1402](https://linear.app/threadbare/issue/THR-1402) two-seed census | prototype | frontier — **HITL** |
| [THR-1404](https://linear.app/threadbare/issue/THR-1404) what the player sees | grilling | frontier — **HITL** |
| [THR-1403](https://linear.app/threadbare/issue/THR-1403) migrate the 64, flip to cells | task (AFK-eligible) | blocked by THR-1402 |

All three frontier tickets are `grilling` / `prototype` — HITL by rule, untouchable by this lane, surfaced above.

**The map was edited at 13:23Z by the authoring session and is now current on one point and still stale on another.** It gained a correction recorded while writing THR-1430 (the callings × cells prototype had counted `use × Network` as opening Stealth; THR-1397 ruled mortal surveillance never feeds the god's detection pressure, so the dormant band opens Agent lifecycle and scales Secrets & Intelligence instead — band order unaffected). Its plan-doc line still reads *"THR-1428 → Ready for Dev 2026-09-07"* for a band that merged at 12:10Z. Not edited by this lane: a map's body is the charting session's artifact, and the T1.5 carve-out covers appending to Decisions-so-far only for tickets this lane resolved. Flagged for whoever works the map next; run l flagged the same line, so it has now survived one editing pass.

**The other three maps are unchanged** — Physical Conflict, Powers & Spellcraft, Item Generator. Every open child of each is `grilling` or `prototype`.

## T2 — design staging

**Triggered (shelf 0, floor 2) and barred. Nothing staged, nothing mutated — and this hour the bar cost nothing.**

`In Design`: **3 live, 0 excluded.** [THR-1429](https://linear.app/threadbare/issue/THR-1429/the-dormant-kinds-i-powers-and-conditions-a-scholar-learns-a-spell-a) (assigned, created 13:08Z today), [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (assigned, 4d) and [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (unassigned, 4d). All three are under `ORCH_IN_DESIGN_STALE_DAYS` (7) and none carries `Parked`, so all three count against the bound of 1.

**The item this tier wanted to stage staged itself, better.** Run l named the dormant-kinds band as T2's input and said it needed an Opus session because this lane stages and never authors. That session ran: it split the band by object family, filed both halves, took the first into `In Design`, and had the plan doc in review inside twenty minutes. A T2 staging comment would have asked for exactly what was already underway.

**That is the second consecutive run where the bound blocked nothing real**, which is worth recording plainly rather than reading as a bound that is too tight: on both runs the barred work reached an author through the normal design route. The predicate is not currently costing throughput.

No comment posted on THR-790 or THR-1002 — a comment resets the staleness clock and silences the one automated nudge that will eventually point at `Parked`.

## T3 — architecture health

**Detector sweep skipped — already run today.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) was the first run after `ORCH_HEALTH_SWEEP_HOUR` and ran all four detectors, plus the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)). **No detector ran this run, and none is reported clean.**

**Redundancy: not assessed this run.**

**Hand-created `In Dev` tickets: not swept this run.** Both `In Dev` items carry `Parked`.

### One new finding, found in T1 rather than by a detector — a Deferral's premise was closed by this morning's merge

[THR-1189](https://linear.app/threadbare/issue/THR-1189/taxrate-is-stamped-on-trades-with-routes-and-read-by-nothing-the-toll) was filed 2026-08-19: `taxRate` is stamped on `trades_with` routes by `action.gold.tax-trade-route` and **read by nothing** — the player is told a toll is levied and no wealth moves. It has sat in `Todo` since, and no detector covers it: a written-but-unread property is not a reachability failure, so nothing sweeps for it.

**It is no longer true**, and THR-1428 closed it this morning without either ticket noticing the other. Verified on `origin/main`:

- `src/engine/holdingIncome.ts:113` reads the field — `Math.max(1, Math.round(props.volume * props.taxRate))`, paid as `WEALTH_ROUTE_CONTROL_INCOME × scaled`. Its module doc names the defect verbatim: *"a seized route carries a `taxRate` nobody collected."*
- Wired, not orphaned: `orchestrator.ts:3521` runs `phaseHoldingIncome` as an inline tick phase.
- Covered: `holdingIncome.test.ts:51` seeds a `taxRate` route and asserts the payment.

**Reported narrow, not closed.** Of its three Done-whens, one is met at the code level, one shrinks to a wording fix (`action-technical-effects.ts:58` still describes the action as paying at cast time; the engine pays the controller on the `HOLDING_INCOME_INTERVAL_TICKS` cadence), and the third — *"a seeded run shows the toll changing a quantity"* — **cannot be produced today.** The payment gates on `isMortalHolder(controlledBy)`, and no mortal controls a route until `UNDERTAKING_MODEL` flips to cells. That is [THR-1403](https://linear.app/threadbare/issue/THR-1403), gated on the census.

**Deliberately not a promotion and not a close.** A ticket whose remaining proof is unreachable would be bounced at pickup, and closing a ticket this lane did not author is outside its authority. The evidence is [recorded as a comment on THR-1189](https://linear.app/threadbare/issue/THR-1189) so the next reader starts from the current state; the ticket stays in `Todo`.

**Why this is worth a line rather than a shrug:** it is the same shape as the readers finding — work that is built, correct, wired and idle for want of the model flip. Two independent instances in two hours is a pattern, and it is the pattern that makes the census the highest-value answer on the board.

## Escalations

**No Discord message, deliberately.** `keep-work-flowing-cc` owns that doorbell and runs at **12:45Z / 13:45Z**, ten minutes from this run's close. Its step 2.6 reads `## Needs Christian` from the newest sibling report — this one — so everything above reaches him through the owning lane almost immediately. A second lane pinging the same channel ahead of it is a duplicate, not a faster path.

**The stop-and-ask condition is not triggered.** Agreed work is not exhausted, and this hour it is visibly flowing: the dormant-kinds band went from named to plan-doc-in-review inside one hour without any decision from Christian. The constraint on the queue is authoring throughput and the pending answers, not an absence of sanctioned work.

**Nothing parked.**
