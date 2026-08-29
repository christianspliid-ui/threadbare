---
lane: tb-orchestrator
run: 2026-08-29k
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-29 (run k, ~12:27–12:31Z)

## Needs Christian

**Two things, and the second one changed today — the design pipeline has actually run dry, not just nearly.**

**1. The batch-2 word. Still one word, now six days waiting.** Unchanged from [run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29j.md), repeated here deliberately rather than dropped — the same ask fell silently off this section for five runs earlier today, and that is not allowed to happen twice.

The encounter factory is ready to rewrite seven camp-and-devotion encounters — sharpening a blade, warding a camp, tending a wound, leaving an offering at a shrine. They are currently the weakest writing in the game: almost no mechanical consequence, just a small reputation nudge, no items, no traits, no lasting marks. What you are approving is [the batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) (readable now, already merged), which flags one deviation for you: **seven** encounters instead of the usual six, because the camp set is one family in one file. Saying "six" restores the split. The ticket is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine), and it moves the moment you say yes in chat. The first encounter in it is the shrine offering — encounter #1 of the [integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with), the sitting where you play all five end to end. That sitting cannot invite you while the shrine offering is below standard.

**2. New today: two parked design items are now blocking all new design work, not just theoretically.**

For twelve runs this lane has reported that it *could not* stage new design work because two items have been sitting in the design column for 10 and 14 days. Until this morning that was harmless — there was enough ready work that nothing was actually waiting. As of this run there is not. The pool of ready product work has fallen to effectively one item, which is the point at which this lane is supposed to go stage the next design, and it cannot, because the column is full.

The two sitting there:

- [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — making action cards read the same way encounter cards do, so a cast returns a result the player can actually read. Waiting since 19 August.
- [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — letting places and objects carry traits, so the world can draw content from what a location *is*. Waiting since 15 August.

Neither is blocked by anything technical. They are waiting for a design session to be run on them, which is attended work — an Opus chat session, not this lane. **Nothing here needs a decision from you about what the game should be.** What would unblock it is either sitting down with one of them, or telling us to set one aside so the column frees up. Behind them, the strongest candidate waiting is [a beast cannot be a bound scene actor](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) — which is what currently blocks every hunt encounter from being written at all.

**Also still open, unchanged, not repeated in full:** the trade-route desire question ([THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) + [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)), laid out in full in [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29i.md).

## T1 — unblock sweep

**Promoted: 2. Filed: 0. Held: 0. Blockers resolved: 0.**

Board at the sweep: **47 `Todo`** (`hasNextPage: false`), **5 `Ready for Dev`** (`hasNextPage: false`), **2 `In Design`**, **4 `In Dev`** (1 live claim, 3 `Parked`). Neither ceiling bound — shelf 5 against the backed-up threshold of 15, and 2 promotions against `ORCH_PROMOTE_BATCH_MAX` of 5.

```
[orchestrator] T1 promote THR-1360: blockedBy [] (never had one), no plan doc named
               → liveness passes trivially; latest comment 12:16:47Z is the filing
               session's own coordination block, no retire verdict → Ready for Dev
               12:28:50Z, verified by re-query; assignee key absent on re-query
[orchestrator] T1 promote THR-1326: blockedBy [], retro doc LIVE on origin/main;
               Rule 0 above bar (~31 arrivals/wk + cost/benefit line); process
               allowance last spent run h, reopened this run → Ready for Dev
               12:30:20Z, verified by re-query; assignee key absent on re-query
```

### THR-1360 — the product promotion

[Four shipped foreshadowing clauses open on `Something`](https://linear.app/threadbare/issue/THR-1360/four-shipped-foreshadowing-clauses-open-on-the-evasive-lexicons) arrived in `Todo` at 12:16:25Z, eleven minutes before this run's scan, filed by the THR-1324 closeout as its content-side residue. `'something'` is in `EVASIVE_VAGUENESS_TERMS`, enforced at zero in every field class, and four live clauses in `src/data/foreshadowing-content.ts` open on it.

It arrived carrying its own coordination block — the THR-836 path working as intended. **One line of that block was re-verified rather than inherited, and unlike run j's case it held.** The block said *"No live mutex known at filing"*:

| Claim | Verdict |
|---|---|
| THR-1324's doc half has shipped | **Correct.** `git log origin/main --grep="THR-1324"` → `6dc47f32 docs(prose): the guidance stopped teaching the mode it retired`. |
| Nothing else is editing the file | **Correct.** Swept every remote branch not merged into `origin/main` for a diff hit on `src/data/foreshadowing-content.ts` — zero hits. |

So the mutex stands as filed: conditional (any future ticket touching that file), not live. The promotion comment restates the block in full rather than posting a bare correction, because `pull-work` Step 3 validates the *latest* comment — a one-line note would have become the latest comment, missing two required lines, and the executor would have refused the ticket this run just promoted.

**Not charged to the process budget.** This is player-facing prose data under `src/data/` — product content, not delivery machinery. It sorts on its `Low` priority like any other product ticket.

### THR-1326 — the process promotion, and why this one

[The fresh-worktree `node_modules` stub](https://linear.app/threadbare/issue/THR-1326/fresh-worktree-node-modules-stub-find-the-producer-31-arrivalsweek-and) has sat in `Todo` since the 2026-08-28 retro filed it, held by the process budget alone — never by a dependency (`blockedBy: []`). The allowance is one process ticket per three runs; it was last spent at run h on THR-1328 and reopened this run. Run j predicted exactly that and it came due.

Spending it here rather than on THR-1327 is a Rule 0 judgement against the materiality bar, and this ticket carries both halves the bar demands:

- **Quotable above-bar loss** — ~31 stub/missing `node_modules` arrivals in fresh/pool worktrees in 7 days, itemised by impediment number, ~1 h/week of rote repair. The 2026-08-22 watch trigger of ≥3/week fired at roughly 10×.
- **An explicit cost/benefit line** — *costs ~2–4 h of forensics plus a small precheck change; not fixing costs ~1 h/week of repair, ~30 tally rows/week of log noise, and a standing misleading green.*

The second half is what actually settles it, and it is the reason this outranks the rest of the process queue: **`session-precheck` reports `test: yes` against a tree whose own `nm:` line simultaneously says `session:stub`.** A tree that cannot run the suite reports that it can, on the first signal every session reads. That is the *gate passing while broken* class, not tidying.

The promotion comment adds a scope note the filed block did not carry: **item 2 is deliverable alone.** The producer forensics in item 1 may prove harness-owned and unreachable from inside a session; the precheck coherence fix must not be held hostage to that. It also supplies the `Blocked by:` line the filed block was missing, and states explicitly that THR-1111 and THR-1115 are *related, not blocking* — their scope was the home-tree donor wiper, which the description is explicit was never this producer.

**THR-1327 stays declined on budget alone, not on merit** — the 60-line cap defeating `generate-project-status` is real; it is simply not this run's slot.

### Declines — unchanged, and deliberately not re-derived

THR-1222 (human approval gate in its own description, `blockedBy: []`, brief verified `LIVE` at run j — the ask this report leads with), THR-1301 (blocker THR-1349 still `Todo`), THR-1303 (blocker THR-1301 `Todo`), THR-1349 (wrong destination — run i's routing verdict stands), THR-1256 (time gate, opens **2026-09-08**), THR-1255 / THR-1218 / THR-1220 / THR-870 / THR-1024 / THR-175 / THR-1348 / THR-1195, the program epics (THR-1156, THR-789, THR-1043), the design-gated items routed to T2, the three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300), and all **15** `wayfinder:*` items skipped unconditionally.

### Product-vs-process ratio — measured, and it disagrees with run j

Classifying every THR-tagged merge into `origin/main` since 2026-08-22 by the nature of the work: **~9 product against ~19 process, roughly one-third product by merged-ticket count.**

Product: THR-1307, 1317, 1321, 1322, 1323, 1329, 1344, 1345, 1346. Process/guidance: THR-1331–1336, 1338–1343, 1353–1358, plus the test-budget and retro merges.

**Two things about that number.** First, it diverges from run j's *"roughly 65/35 product to process"* — same lane, same week, near-inverse figure. Run j did not state its method, and this one does (merge-commit classification over a fixed 7-day window), so the disagreement is a measurement-method gap worth settling at the retro rather than a correction of substance; both cannot be describing the same quantity.

Second, and more important for reading it correctly: **the process mass here is not the pathology the throttle targets.** Nearly all of it is the three context-cleanup rounds — Christian's own agreed program — not lanes filing tidying tickets at each other. The throttle exists to stop the latter, and the latter is not what shipped this week.

**And the honest note on this run's own arithmetic:** promoting THR-1326 lifts the non-`Deferral` shelf count from 1 back to 2, which is the T2 floor. That restores the *number* without restoring product supply, because THR-1326 is infrastructure. The count should not be read as the pipeline recovering. **The headline finding stands: the feature pipeline needs a design session, and the design column is full.**

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open (0 on frontier) | 0 available | THR-1232 (`prototype`, **assigned** — off the frontier by the assignee rule) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership re-derived from this run's own `Todo` sweep: **3 maps + 12 children = 15 `wayfinder:*` items**, every child labelled `grilling` or `prototype`.

**The AFK column was re-proved directly this run, not inherited.** Label-filtered queries return **19 `wayfinder:research` + 3 `wayfinder:task` = 22 tickets, every one of them `Done`**, and no AFK-class item appears anywhere in the 47-item `Todo` slice. `ORCH_WAYFINDER_AFK_MAX` did not bind because there was nothing to bind against.

Nothing claimed, nothing assigned, no guessed resolution posted. **No `grilling` or `prototype` ticket was touched.**

## T2 — design authoring

**The shelf trigger fires for the first time — and the `In Design` bound bars it. Thirteenth consecutive run barred.**

- **Shelf count: TRIGGERED.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` at the scan is **1** — THR-1328 alone. Run j measured 2 (THR-1328 + THR-1324); THR-1324 has since left the shelf, dropping the count below the floor. This is the first run where the trigger fires on its own terms rather than being moot.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (`startedAt` 2026-08-19, **10 days**) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (2026-08-15, **14 days**). Both far past the 48h threshold and **re-surfaced, not re-staged**.

**This is the run where the twelve-run standing complaint acquired a cost.** For twelve runs the bound was reported as blocking while the shelf was comfortable, which made it a theoretical objection. It is no longer theoretical: the trigger that exists to refill the pipeline fired, and the bound stopped it. Nothing was lost *yet* — the shelf holds 7 items after this run's promotions — but the mechanism that refills it is now demonstrably jammed, and that is a different report than the previous twelve.

**Had the bound been open, the staging pick would still have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — a beast cannot be a bound scene actor, blocking every hunt encounter from being written — unchanged for nine consecutive runs, with THR-1349 + THR-1348 as the runner-up pair.

**T2 queue composition: unchanged at ten design calls** in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315, THR-1318, THR-1348, THR-1349), the two parked in the column, three Proactive Agent Actions plan-doc sessions, and twelve wayfinder questions on fully-prepared maps.

## T3 — architecture health

**Not due — the daily sweep already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z / 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified by reading that report's T3 section on `origin/ops`. **No detector was run this hour**, and none of run d's results is restated here as if freshly measured. `newFindings: 0` accordingly.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised here.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** Daily-sweep judgement pass; run d did it. Not re-derived, and not implied to have been.

**Stalled work: not re-assessed** — daily-sweep item, run d's result stands.

**Hand-created `In Dev`: still 0, and the column shrank the good way.** `In Dev` fell 5 → 4 as THR-1345 merged (`bd321486`, PR [#1732](https://github.com/christianspliid-ui/threadbare/pull/1732)), leaving 1 live claim (THR-1330, which passed through `Ready for Dev`) and 3 `Parked`. No issue in the column shows a `stateHistory` lacking `Ready for Dev`. Delta on a standing finding, not a new one.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted*, and that threshold is not met: ten design calls, three plan-doc sessions and twelve wayfinder questions are all agreed and all waiting. What is exhausted is not the agreed work — it is this lane's ability to *stage* any of it. That is a bound, not a shortage, and it is surfaced to Christian rather than asked of Discord.

Two items for the weekly retro, logged here rather than filed, per the process-work throttle:

**`ORCH_MAX_IN_DESIGN` now has a demonstrated cost, not just an argument.** Thirteen runs have reported the same two ids to the same reader. Today the T2 trigger fired and the bound stopped it — the constant has no ageing escape, so two items parked 10 and 14 days hold the design pipeline closed for as long as they sit there, regardless of how thin the shelf gets. The fix is a design decision (age out of `In Design`? raise the bound? treat an unpicked staging as not counting?), which is retro work, not in-run work. Recorded now with the date the cost first materialised.

**Two consecutive reports from this lane state near-inverse product/process ratios for the same week.** Run j: ~65/35 product to process. This run: ~33/67, by merge-commit classification over a fixed 7-day window. One of the two is measuring something other than what it says. The ratio is a line CLAUDE.md requires every run to state, so an unstated and inconsistent method makes that line unreadable over time — worth one retro decision fixing the method, after which the number means something.
