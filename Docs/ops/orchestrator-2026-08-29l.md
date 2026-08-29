---
lane: tb-orchestrator
run: 2026-08-29l
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-29 (run l, ~14:27–14:35Z)

## Needs Christian

**Still one word, now six days waiting — and it is the same word as the last three hours.** Nothing new arrived for you this hour. This section repeats deliberately rather than dropping, because the same ask fell silently off it for five runs earlier today.

The encounter factory is ready to rewrite seven camp-and-devotion encounters — sharpening a blade, warding a camp, tending a wound, leaving an offering at a shrine. They are the weakest writing in the game right now: almost no mechanical consequence, just a small reputation nudge, no items, no traits, no lasting marks. What you are approving is [the batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) (readable now, already merged), which flags one deviation: **seven** encounters instead of the usual six, because the camp set is one family in one file. Saying "six" restores the split. The ticket is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine), and it moves the moment you say yes in chat. Its first encounter is the shrine offering — encounter #1 of the [integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with), the sitting where you play all five end to end, which cannot invite you while that one is below standard.

**Also still open, unchanged, not repeated in full:** the two design items parked 10 and 14 days that jam all new design staging ([the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card), [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)) — laid out in full in [run k](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29k.md); and the trade-route desire question ([THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) + [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)), laid out in [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29i.md).

**Nothing in this run's one finding needs you.** It is a technical judgement about three tickets waiting on each other, and it is routed to a design session, not to you.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 1. Blockers resolved: 0.**

Board at the sweep: **45 `Todo`** (`hasNextPage: false`), **5 `Ready for Dev`** (`hasNextPage: false`), **2 `In Design`**, **5 `In Dev`** (2 live claims, 3 `Parked`). Neither ceiling bound — shelf 5 against the backed-up threshold of 15, and 0 promotions against `ORCH_PROMOTE_BATCH_MAX` of 5.

```
[orchestrator] T1 hold THR-1327: blockedBy [], Rule 0 evidence + cost/benefit line
               both present, coordination block already filed → merit is not the
               question; process budget spent at run k on THR-1326, reopens at run n
[orchestrator] T1 decline THR-1024: prose gate "do not start before THR-966";
               THR-966 is Idea, its own gate names THR-951 (Canceled 08-11) →
               unresolvable reference, chain traced and recorded on the ticket
```

### Last run's promotions both cleared the board, one of them all the way

Run k's two promotions have already moved. [THR-1326](https://linear.app/threadbare/issue/THR-1326/fresh-worktree-node-modules-stub-find-the-producer-31-arrivalsweek-and) was promoted 12:30:20Z, claimed 13:02:52Z, and reached **`Done` at 13:33:13Z** — 63 minutes end to end, shipped as [PR #1734](https://github.com/christianspliid-ui/threadbare/pull/1734) (`1373d460`, *"nothing was deleting node_modules — the precheck's green was"*). [THR-1347](https://linear.app/threadbare/issue/THR-1347/genomeresultnpcs-has-no-consumer-every-genome-pass-computes-an-npc) was claimed at 14:02:46Z, twenty-five minutes before this scan. Neither needed anything from this run.

### THR-1327 is held on budget, not on merit — for the twelfth consecutive run

[The 60-line cap defeating `generate-project-status`](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is) carries both halves the materiality bar demands — a quotable loss (*"1 of 281 fragment(s) rendered, 280 held back by the 60-line cap"*, and the one that rendered was the **shortest** of its day's eight) and a cost/benefit line. It also already carries a coordination block, filed with the ticket per THR-836. It is not promotable this run for one reason only: **run k spent the one-process-ticket-per-three-runs allowance on THR-1326**, so the budget is closed for runs l and m and reopens at run n. Named here rather than dropped, per the held-back-candidate rule.

### The finding — a four-node gate chain that no sweep can see the end of

This is the one substantive thing this run produced, and it came out of reading a decline that eleven previous runs carried forward without evidence.

[THR-1024](https://linear.app/threadbare/issue/THR-1024/detailmodal-forks-its-own-overlay-instead-of-composing-modal-no) (`DetailModal` forks its own overlay — no `role="dialog"`, no focus contract) has `blockedBy: []`, so a sweep reading only the dependency half would promote it. What actually holds it is a **prose gate** in its own description, and following that gate to its end takes four hops:

| Node | State | The gate it carries |
|---|---|---|
| THR-1024 | `Todo`, filed 08-07 (22d) | *"do not start this before THR-966"* |
| [THR-966](https://linear.app/threadbare/issue/THR-966/detail-page-tts-is-unreachable-the-detailmodaldetailpage-cluster-is) | **`Idea`**, filed 08-02 (27d) | *"Decide the cluster's fate in coordination with THR-951"* |
| THR-951 | **`Canceled`** 08-11 | consolidated into THR-1089 |
| THR-1089 | `Done` 08-15, [PR #1467](https://github.com/christianspliid-ui/threadbare/pull/1467) | answered THR-951's half: *"unwired, not retired… Its retire-or-wire call is owned by **THR-964**, still at Idea"* (`4aa2163a`) |
| [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice) | **`Idea`**, filed 08-02 (27d) | *"A decision is recorded: wire the producer, or retire the pipeline"* — an explicit design call |

**Why it stayed invisible for three weeks, and why that is structural rather than an oversight.** T1 scans `Todo` and `Ready for Dev`. The only member of this chain in either state is THR-1024 — and its gate names a ticket in a state T1 never reads. So the sweep declines it correctly, every hour, and can never reach the terminal node to discover that the thing being waited on is a design decision nobody has queued. Two of the four open nodes sit in `Idea`, outside this lane's field of view entirely.

By the decline taxonomy this is an **unresolvable reference** — a gate naming a `Canceled` id is neither met nor unmet — which the taxonomy says to log verbatim and never promote on. That is exactly what has been happening, just without anyone writing it down. **Recorded as a comment on THR-1024 at 14:33:06Z**, so the next sweep reads the verdict instead of re-deriving it (the run-i precedent). No state written, no assignee set.

**Two facts have moved under these tickets since they were written, and neither is reflected in them:**

1. **The fix shape is decided and already shipped.** THR-1079 reached `Done` on 08-10 ([PR #1393](https://github.com/christianspliid-ui/threadbare/pull/1393)), putting the Law 50 focus contract into the `Modal` primitive for all 22 consumers, and says in its own body: *"THR-1024 is sequenced after this one… it should compose `Modal` once this lands."* THR-1024's second Done-when alternative (hand-roll the focus contract) is therefore dead — composing `Modal` now satisfies both halves.
2. **The cluster is smaller than THR-966 describes.** `src/components/Game/Encounter/DetailPage/openDetailPage.ts` — one of four files in THR-966's *Files involved* list — was deleted 08-18 by THR-1167 (`978697f6`, *"0 importers; displaced by DetailPageOpenerContext"*). Part of the prune arm ran under a different ticket. `DetailModal.tsx` and `DetailModalStackContext.tsx` do survive — verified in the tree this run, not inferred from the ticket.

**Routed to T2, not promoted.** The terminal question is wire-or-retire on `pendingChoiceCommits`, which is a design call and explicitly not executor work.

**Unchanged declines, not re-derived:** THR-1222 (human approval gate in its own description — the ask this report leads with), THR-1301 (blocker THR-1349 still `Todo`), THR-1303 (blocker THR-1301 `Todo`, re-read this run), THR-1349 (wrong destination — run i's routing verdict stands, recorded on the ticket), THR-1256 (time gate, opens **2026-09-08**), THR-1255 / THR-1218 / THR-1220 / THR-870 / THR-175 / THR-1348 / THR-1195, the program epics (THR-1156, THR-789, THR-1043), the design-gated items routed to T2, the three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300), and all **15** `wayfinder:*` items skipped unconditionally.

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open (0 on frontier) | 0 available | THR-1232 (`prototype`, **assigned** — off the frontier by the assignee rule) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership re-derived from this run's own `Todo` sweep: **3 maps + 12 children = 15 `wayfinder:*` items**, every child labelled `grilling` or `prototype`.

**The AFK column was re-proved directly this run, not inherited from run k.** Label-filtered queries return **19 `wayfinder:research` + 3 `wayfinder:task` = 22 tickets, every one of them `Done`**, and no AFK-class item appears anywhere in the 45-item `Todo` slice. `ORCH_WAYFINDER_AFK_MAX` did not bind because there was nothing to bind against.

Nothing claimed, nothing assigned, no guessed resolution posted. **No `grilling` or `prototype` ticket was touched.**

## T2 — design authoring

**Shelf trigger fires for the second consecutive run — and the `In Design` bound bars it again. Fourteenth consecutive run barred.**

- **Shelf count: TRIGGERED.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` at the scan is **1** — THR-1328 alone, unchanged from run k. The other four shelf items (THR-1360, THR-1359, THR-1316, THR-1314) all carry `Deferral`, which this count excludes by design.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (10 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (14 days). Both far past the 48h threshold and **re-surfaced, not re-staged**.

**Had the bound been open, the staging pick would still have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — a beast cannot be a bound scene actor, blocking every hunt encounter from being written — unchanged for ten consecutive runs.

**T2 queue composition: one net addition this run.** The ten standing design calls in `Todo`, the two parked in the column, three Proactive Agent Actions plan-doc sessions, and twelve wayfinder questions on fully-prepared maps — **plus THR-964's wire-or-retire call**, routed here by this run's T1 finding. It is a genuinely new member rather than a re-count: it has sat in `Idea` since 08-02 and no prior sweep had reached it.

## T3 — architecture health

**Not due — the daily sweep already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z / 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified by reading that report's T3 section on `origin/ops`, not carried forward from a later run's assertion. **No detector was run this hour**, and none of run d's results (8 LEAKED contracts, 95 total; canon staleness 18; `check:process` exit 0; `sweep:rank-reach` PASS) is restated here as if freshly measured.

**The one new finding this run is a T1-derived stalled-work observation, reported in full above rather than duplicated here** — the THR-1024 → THR-966 → THR-951/THR-1089 → THR-964 chain, two of whose four open nodes sit in `Idea`, outside T1's scan. It is the T3 stalled-work class (*"an issue failing repeatedly that nothing else notices"*) arriving through the T1 door, which is why `newFindings: 1`. It is **not** a detector result and is not counted as one.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised here.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** Daily-sweep judgement pass; run d did it. Not re-derived, and not implied to have been. The finding above is a *ticket-gate* reading, not a redundancy judgement over the interface map and systems inventory, and must not be counted as one.

**Stalled-work (issue-claim class): not re-assessed** — daily-sweep item, run d's result stands. No issue in this run's board reads shows the `ORCH_STALLED_PICKUP_THRESHOLD` pattern of repeated `Ready for Dev → In Dev` with no `Done`.

**Hand-created `In Dev`: still 0.** `In Dev` holds 5 — THR-1347 and THR-1330 as live claims, 3 `Parked`. THR-1347's `stateHistory` was read this run and shows `Todo 01:21Z → Ready for Dev 01:30Z → In Dev 14:02Z`; it passed through the queue properly. Delta on a standing finding, not a new one.

## Escalations

**None raised, none parked.** No question was posted to Discord this run: the T1 finding is a technical judgement this lane is explicitly authorised to make and route, and it needed no direction call. Agreed work is not exhausted — the T2 queue holds fourteen-plus items and is blocked on capacity in the design column, not on a missing decision from Christian, so the stop-and-ask condition did not fire.
