---
lane: tb-orchestrator
run: 2026-09-04c
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-04 (run c, ~07:27–07:35Z)

**The board turned over completely in the hour since the last run, and one of the new items had already lost the note the executor reads.** Christian's attended pixel sweep filed **seven** tickets straight onto the shelf at 06:40Z, taking it from 3 to 10 — the largest single refill this lane has recorded. The executor claimed the worst of them 20 minutes later and has a PR open. All seven were filed correctly, with coordination blocks; **one of them was then broken by a different lane**, and repairing it was this run's only write.

## Needs Christian

**Nothing new is asked of you. Two things still wait, and one thing went right.**

**1. Good news first — your pixel sweep is already turning into fixes.** The 1920×1080 pass you ran this morning became seven tickets, and the machine took the worst one straight to a pull request: on encounters with authored choice cards, [**the commit button was unreachable**](https://linear.app/threadbare/issue/THR-1410/authored-choice-veil-the-commit-control-is-unreachable-at-19201080-the) — scrolled to the bottom, it sat *underneath* the `Look away` footer strip, so a click landed on the footer and the encounter could not be committed at all. That is being fixed now ([PR #1813](https://github.com/christianspliid-ui/threadbare/pull/1813)). Six more are queued behind it: the missing stance word, a chip that wraps to four lines, three debug dead-ends, and a dev-server config fault. **Nothing needed from you on any of them.**

**2. The encounter brief — still one yes, and the link is the corrected one.** Unchanged and not re-argued from an hour ago: [**Retrofit batch 2 — the camp six**](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) (the September brief, not the superseded August draft sitting beside it). The ticket parked on your yes is [Encounter Factory pilot volume](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), and the batch itself is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine). The brief asks you one thing inside it: **repair the camp encounters in place, or re-roll them from fresh premises?**

This is still the only queued item that becomes something you can *play* — everything above is repair work on surfaces that already exist.

**3. Traits wave 2 — unchanged, still one word.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has been in the design column 20 days with your name on it. **Are you still planning to design it soon?** Yes means do nothing; no means it gets set aside.

**4. The maps, carried unchanged and not re-argued.** [Undertakings](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) — two questions, the [division rule](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) first because it unblocks four. [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — seven, of which the [monster fight loop](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) and the [person-vs-person fight loop](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs) are the two heads. Plus the [item generator sketch](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to). **No rush from this lane.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Repaired: 1. Held: 1 (unchanged).** Board: **50 `Todo`** (page 1; page 2 holds only the THR-789 epic, measured in run b and unchanged), **10 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`**. Neither ceiling bound — the shelf is 10 against a backed-up threshold of 15, and nothing was eligible to promote regardless.

### The shelf went 3 → 10, and all seven arrivals were filed correctly

Seven tickets were created directly into `Ready for Dev` at 06:39–06:41Z by the attended THR-1133 pixel sweep: THR-1410 (since claimed), THR-1411, THR-1412, THR-1413, THR-1414, THR-1415, THR-1416, THR-1417.

**Every one was checked against the THR-836 direct-file contract, not assumed.** `list_comments` read on each: all carry a coordination block as the filing comment, each with `Suggested model` / `Parallel-safe with` / `Mutex with` and an inline mutex reason per THR-688 rule B. None carries an assignee. The mutex web is real and correctly drawn — THR-1411/THR-1416 against THR-1410 on `EncounterVeil.tsx`, and THR-1412/THR-1413/THR-1414 against each other on the debug-bridge registration block. **No repair was owed on the filings themselves**, which is worth stating because this lane has twice had to reconstruct blocks somebody else skipped.

### The finding — a grooming comment silently un-picked a shelf item, 10 minutes before this run

[THR-1415](https://linear.app/threadbare/issue/THR-1415/vite-dev-server-watches-claudeworktrees-every-lane-worktree-created-or) was filed with a correct block at 06:42:14Z. At **07:19:07Z** `daily-backlog-grooming` posted a comment removing its `docs-only` label — a **correct** fix, and a good one: the ticket edits `vite.config.ts`, and the docs-only fast-track lane (THR-938) selects by label and would have shipped a config change through a gate that runs no tests, no typecheck and no build.

But `pull-work` Step 3 validates the **latest comment**, and that grooming note carries no coordination lines. So a correct hygiene fix left the ticket failing the gate that decides whether it is pickable — the executor would either bounce it or derive a block by guessing from the description, while a correct one sat two comments up.

**This is the hazard run b named an hour ago and avoided by hand.** On THR-1222 that run wrote: *"The three coordination lines were repeated verbatim in that comment — posting a bare correction would have made it the latest comment and left the ticket failing `pull-work` Step 3."* Run b knew to repeat them. The grooming lane does not, and nothing tells it to.

**Repaired**, by restoring the block **verbatim** from the 06:42:14Z comment — not re-derived, so no guess entered the record. [Comment posted](https://linear.app/threadbare/issue/THR-1415/vite-dev-server-watches-claudeworktrees-every-lane-worktree-created-or) at 07:29:00Z and **verified as the latest by re-query**, not assumed from the write's response:

```
[orchestrator] T1 repair THR-1415: latest comment was grooming note (07:19:07Z), no coordination lines
[orchestrator] T1 repair THR-1415: block restored verbatim from 06:42:14Z → list_comments confirms newest ✅
[orchestrator] T1 repair THR-1415: no state, label or assignee write — comment only
```

**Not filed as a ticket** (2026-08-10 throttle): one occurrence, on a Low-priority item that was not near the top of the queue, is below the materiality bar. It is an Escalations row for the retro with its cost line. **The class is what matters, not this instance** — *any* lane that comments on a `Ready for Dev` item displaces the block the executor reads, and the grooming lane comments on shelf items as its normal business.

**THR-1168 checked for the same fault and is clean.** It also shows a 07:19:04Z `updatedAt` from the same grooming run, but that was a field write with no comment: its latest comment is still the 05:51:18Z director-verdict comment, which carries a full block. The two `updatedAt` stamps look identical from a list scan and are not the same event — read the comments, not the timestamp.

### The executor is live and properly claimed

[THR-1410](https://linear.app/threadbare/issue/THR-1410/authored-choice-veil-the-commit-control-is-unreachable-at-19201080-the) moved `Ready for Dev` → `In Dev` at **07:03:11Z** with [PR #1813](https://github.com/christianspliid-ui/threadbare/pull/1813) open. Its `stateHistory` is the sanctioned path — `Ready for Dev` (06:39:45Z) → `In Dev` (07:03:11Z) — so it is **not** a THR-1325 hand-created `In Dev` ticket despite having been created and claimed inside the same hour. Checked explicitly, because a same-hour create-then-claim is exactly the shape that reads like one.

### Held and declined — unchanged, none re-argued

- **[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) — held**, third consecutive run, on the reason run a established: its substantive condition is met (the board decides in `'live'`), only [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking)'s state field is not `Done`. This lane does not rewrite a relation to unblock its own promotion. It promotes on the sweep after THR-1301 closes.
- **THR-1133 returned to `Todo`** at 06:48Z from its `In Dev` park — the attended sweep that spawned the seven tickets closed out. **Not promotable**: it is an attended dev-server session by construction, and its remaining capture debt is now carried explicitly by the shelf tickets that inherited it (THR-1413 names pass-1, THR-1414 names pass-5). Correctly parked in `Todo` behind them.
- **Standing declines**, each on its already-recorded reason: THR-1222 (approval gate), THR-1380 and THR-1301 (satisfied upstream, want a `Done` this lane may not set), THR-1381 / THR-1134 / THR-1155 / THR-1348 (design verdict first → T2's input), THR-1287 (waits behind THR-1303), THR-1256 (time gate, opens 2026-09-08), THR-1024 / THR-1114 / THR-1189 / THR-1195 / THR-1315 / THR-1318 / THR-1274 / THR-1148 / THR-1255 / THR-175 / THR-1393. **16 `wayfinder:*` items** skipped unconditionally → T1.5.

**Week's product-vs-process ratio.** Nothing filed or promoted this run, so the ratio is unmoved: **one filing this week, product** (THR-1409, a terrain-tuning defect). **No process or infrastructure ticket was filed or promoted by this lane.** The headline changed anyway, and honestly: the shelf is no longer starved, and it was refilled by an attended session rather than by this lane. Of the ten items on it, **nine are repair work on surfaces that already exist and one is a config fix** — so the standing finding survives its own good news intact: *the queue has depth now, and still nothing in it is new play.* THR-1222 remains the only lever that changes that.

## T1.5 — wayfinder sweep

**Four open maps. Frontier 11, of which 10 are HITL. Nothing moved since run b, and nothing was touched.**

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 7 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

**Carried, not re-derived, and the licence to carry is measured rather than assumed:** every open wayfinder child in this run's `Todo` slice has an `updatedAt` of 2026-09-03 or earlier — the newest is THR-1396 itself at 2026-09-03T19:32Z. Nothing on any map has moved since run b read all four at relation level, so re-reading `includeRelations` on eleven tickets would have returned the same eleven answers. Both maps' relation reads (run a on THR-1396, run b on Physical Conflict) stand.

**No AFK burn-down was available, for the fourth consecutive run.** Every frontier ticket is `grilling` or `prototype` — HITL, never touched by this lane — except [THR-1405](https://linear.app/threadbare/issue/THR-1405/task-join-the-catalogue-to-the-systems-inventory-owningsystem-values), whose research half was discharged on 2026-09-03 and whose code half is queued as [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap). What remains on it rides on THR-1407 and is code this lane does not ship. **No claim taken, no Decisions-so-far amended** — nothing resolved.

## T2 — design staging

**Not triggered, and not close.** `Ready for Dev` holds **10**, of which **9 are non-`Deferral`** (only THR-1168 carries it) — against `ORCH_PROGRAM_WORK_FLOOR` of 2. The tier fires below the floor; the shelf is more than four times it.

**Worth recording plainly, because this lane has reported the opposite for four days:** the build shelf was at its floor this morning and is now the deepest it has been all week. **This lane did not do that** — an attended session did, in one 90-second burst of filings. The T2 tier that exists to refill a thin shelf has been barred by `ORCH_MAX_IN_DESIGN` for four consecutive days, and the shelf was refilled anyway by the party the tier exists to request. That is worth a line in the retro about what the tier is actually for.

**`In Design` unchanged from both earlier runs**, re-measured against the shipped `classifyInDesignItem` predicate rather than `updatedAt` (a bulk relation-write stamped both at 2026-09-03T07:19:42Z, and that is not activity):

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **16 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **20 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1 and the column reads **1 live**, so the tier had no room regardless. THR-790 re-surfaced above, **not re-staged**. **No mutation** — excluding an item from a count is not a state change, and applying `Parked` is Christian's call and the grooming lane's remit.

## T3 — architecture health

**Not due — already run today.** [`orchestrator-2026-09-04.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04.md) (run a, ~05:50Z) ran the daily sweep: all four detectors completed, zero new detector findings, and a redundancy pass that filed THR-1409. Re-running it 90 minutes later would produce an identical table.

**No detector was run this run, and none is reported as clean.** `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday.

**Board-health lines, from T1's own scan rather than a T3 sweep:**

- **No issue meets `ORCH_STALLED_PICKUP_THRESHOLD`** (3 `Ready for Dev → In Dev` transitions with no `Done`). THR-1410's single transition is 24 minutes old with an open PR.
- `In Design: 1 live, 1 excluded (THR-1002 unassigned 16d → excluded; THR-790 assigned Christian 20d → warned, still counted).`
- **Hand-created `In Dev` (never in `Ready for Dev`): none.** The three occupants are THR-1410 (**live claim**, promoted-then-claimed path verified in `stateHistory`), THR-1392 (`Parked`, assigned Christian) and THR-1130 (`Parked`, unassigned, holding the batch-2 approval). One live claim against WIP=1 with two sanctioned parks is the healthy reading.

## Escalations

- **Nothing asked on Discord.** The trigger is *agreed work exhausted*; it is emphatically not — ten shelf items and a live executor.
- **New for the retro, logged not filed: a comment from any lane onto a `Ready for Dev` item silently un-picks it.** `pull-work` Step 3 reads the **latest** comment for the coordination block, so a hygiene note, a correction or a status line posted after the block displaces it. Measured today: `daily-backlog-grooming` did this to THR-1415 at 07:19:07Z, ten minutes before this run caught it; run b avoided the identical trap on THR-1222 only because that run's author knew to repeat the three lines verbatim. **Cost so far ~0** — caught inside ten minutes, on a Low-priority item. **Cost if it recurs on a top-of-queue item:** one bounced pickup per hour until a lane notices, or a derived-by-guess block replacing a correct one. Two fixes are available and both are cheap: teach every commenting lane to repeat the block (fragile, five lanes to change), or have `pull-work` Step 3 scan back for the **most recent comment containing a block** rather than requiring it be the latest (one predicate, one place). The second is the structural answer. **Below the materiality bar as a single occurrence; batched for the weekly retro with this cost line.**
- **THR-1301 still needs a `Done` no lane may set**, and still holds THR-1303 out of the queue — now a smaller cost than yesterday, since the shelf is 10 rather than 2. Fourth day in the log; carried for the retro.
- **For the retro, second-order:** T2 has been barred by one 20-day assigned item for four consecutive days, and the shelf it exists to refill was refilled today by an attended session in 90 seconds. Whether the tier's bound is calibrated for the way work actually arrives is a question the retro should ask; this lane is not the party to answer it.
- **Carried unchanged:** `Docs/canon/world-objects.md`'s missing `last_reviewed` stamp (one frontmatter line, open two days); UL-proposals expressing their real dependency as prose while `relations.blockedBy` stays empty; the superseded `retrofit-batch-2-brief.md` still resolving beside its September replacement, which no liveness gate distinguishes.
