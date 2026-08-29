---
lane: tb-orchestrator
run: 2026-08-29n
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-29 (run n, ~16:28–16:33Z)

## Needs Christian

**Nothing new arrived for you this hour, and one thing moved without needing you.** A long-held repair to the project-status page was promoted into the work queue — it had been waiting thirteen hours on a self-imposed budget rather than on anything you owe. It needs no decision from you and is mentioned only so the queue movement is not a surprise.

**The one ask is unchanged, and now six days old.** Repeated rather than dropped, because it fell silently off this section for five runs earlier today.

The encounter factory is ready to rewrite seven camp-and-devotion encounters — sharpening a blade, warding a camp, tending a wound, leaving an offering at a shrine. They are the weakest writing in the game right now: almost no mechanical consequence, just a small reputation nudge, no items, no traits, no lasting marks. What you are approving is [the batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) (readable now, already merged), which flags one deviation: **seven** encounters instead of the usual six, because the camp set is one family in one file. Saying "six" restores the split. The ticket is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine), and it moves the moment you say yes in chat. Its first encounter is the shrine offering — encounter #1 of the [integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with), the sitting where you play all five end to end, which cannot invite you while that one is below standard.

**Also still open, unchanged, not repeated in full:** the two design items parked 10 and 14 days that jam all new design staging ([the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card), [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)) — laid out in full in [run k](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29k.md); and the trade-route desire question ([THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) + [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)), laid out in [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29i.md).

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 3 (1 new). Blockers resolved: 0.**

Board at the sweep: **48 `Todo`** (`hasNextPage: false`), **3 `Ready for Dev`** (`hasNextPage: false`), **2 `In Design`**, **8 `In Dev`** (5 live, 3 `Parked`). Neither ceiling bound — shelf 3 against the backed-up threshold of 15, and 1 promotion against `ORCH_PROMOTE_BATCH_MAX` of 5.

```
[orchestrator] T1 promote THR-1327: no blocker ever named; held 13 runs on the Rule-0
               process budget, which reopens this run (run k spent it on THR-1326,
               runs l/m closed) → Ready for Dev (program: Continuous Improvement)
[orchestrator] T1 hold THR-1368 (NEW, filed 16:25:51Z): predecessor THR-1359 In Dev
               since 16:04:03Z and unmerged — origin/main tip cdd12413 still has
               aftermathWords.ts:54 with no THR-1359: comment; same 3 files live
[orchestrator] T1 hold THR-1366 (R4-T5): mutex "R4-T1…T4, T6 (serial round session)"
               still live — THR-1365 In Dev; verdict recorded at run m, not re-derived
[orchestrator] T1 decline THR-1367 (R4-T6): "blocked on all five" — THR-1366 still Todo
```

### The promotion: THR-1327, held on budget for thirteen runs, promoted on the fourteenth

[The 60-line cap defeating `generate-project-status`](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is) has never named a blocker. Every one of its thirteen holds was the Rule-0 process-work budget — at most one process ticket promoted per three runs — and nothing else. Run k spent that allowance on THR-1326; runs l and m were closed; it reopens here and is spent here.

Everything the promotion gate asks was re-checked this run rather than inherited:

| Check | Result |
|---|---|
| Materiality bar | **Passes.** Quotable measured loss (`1 of 281 fragment(s) rendered, 280 held back by the 60-line cap`), plus the required cost/benefit line. A shipped artifact quietly defeated is the qualifying shape. |
| Latest-comment verdict (THR-990) | **Clean.** Only prior comment is the create-path coordination block; no retire/superseded verdict. |
| Plan-doc liveness (THR-921) | **Trivially passes** — names no plan doc, only the retro report that filed it, already on `main`. |
| Mutex | **None.** Re-derived against the live `In Dev` slice; nothing there touches `scripts/generate-project-status.ts`. |
| Assignee after write | **Absent key on `get_issue` re-query** — verified on the re-read, not on the write response (THR-845). |

[Coordination block posted](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is) at 16:30:06Z carrying all three required lines, so `pull-work` Step 3 reads them off the latest comment rather than bouncing the candidate.

### The new candidate: THR-1368, held because its predecessor has not landed

[`reach.flesh` and four `action.flesh.*` nodes](https://linear.app/threadbare/issue/THR-1368/reachflesh-and-four-actionflesh-nodes-still-ship-in-world-modeljson) was filed at 16:25:51Z — three minutes before this sweep, the only genuinely new T1 input this hour. It is a well-formed deferral with its coordination block filed alongside it (THR-836 observed correctly). It was still held, on evidence its own block does not carry.

Its block states *"THR-1359 shipped the `src/` half; both display maps carry an explicit `THR-1359:` comment"*. Checked against `origin/main` this run at tip `cdd12413`: `src/engine/aftermathWords.ts:54` still reads `flesh: 'Flesh', time: 'Time', life: 'Life'` with **no** such comment, and [THR-1359](https://linear.app/threadbare/issue/THR-1359/flesh-survives-as-a-live-key-in-10-production-sites-outside) is `In Dev` (claimed 16:04:03Z), not `Done`. The past tense in the filing block describes the authoring session's own working tree, not any tree an executor would cut.

**Held, not declined** — the ticket is sound and its artifact is hours away at most, which is the plan-doc-liveness shape (THR-921). Promoting it would be actively worse than waiting: THR-1368 edits `aftermathWords.ts`, `codexRegistry.ts` and `tooltipValidation.test.ts`, and a live session is inside those same three files under THR-1359 right now. That is the THR-1245 collision (impediment #763) reached by promotion instead of by self-claim — the one failure mode this lane is positioned to cause rather than merely observe.

A mechanical promotion condition was [recorded on the ticket](https://linear.app/threadbare/issue/THR-1368/reachflesh-and-four-actionflesh-nodes-still-ship-in-world-modeljson) at 16:30:44Z so the next sweep acts on it without re-deriving: promote once THR-1359 is `Done` **and** the keep-comment is readable on `origin/main` in both display maps. The comment carries the three coordination lines forward so it does not strip them from the latest-comment position, and adds the `Mutex with: THR-1359` line the filing block could not have known to write.

### Round 4 — one step completed, the standing disposition unchanged

[THR-1364 (R4-T3)](https://linear.app/threadbare/issue/THR-1364/r4-t3-skills-sweep-engine-architecture-testing-patterns) reached `Done` at 16:27:33Z via [PR #1738](https://github.com/christianspliid-ui/threadbare/pull/1738), which is now `main`'s tip. THR-1365 (R4-T4) remains `In Dev`; THR-1366 and THR-1367 remain `Todo`.

Both holds stand for exactly the reasons [run m recorded on the tickets](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29m.md) and are **not re-derived here**: R4-T5's serial-round mutex is still live (T4 is running), and R4-T6 states its dependency outright as *"blocked on all five"*, of which two are unmet. The deeper reason also stands unchanged — round 4 does not run through the executor queue at all, so promoting either would hand a self-claiming attended session's next step to `tb-opus-pickup`.

### THR-1327's promotion does not change the shelf's composition problem

**Product-vs-process completion ratio, measured this run** over completions dated 2026-08-22 → 08-29: roughly **26 product / 26 process**, about half and half. **This is not a complete census** — the `Done` slice truncated at 100 with `hasNextPage: true`, so the figure is the shape rather than the count, and it is reported as such rather than as a precise ratio.

**The headline finding is unchanged and is not "promote more process work".** After this promotion the shelf holds **two** non-`Deferral` items — THR-1328 and THR-1327 — and **both are process tickets**. Zero product work is queued for the executor. That is not a queue this lane can fix by promoting harder: every product candidate in `Todo` is blocked on a design pass or on Christian, and the design column that would unblock them has been full for sixteen consecutive runs. **The feature pipeline needs design capacity and Christian's one approval, not another promotion.**

**Unchanged declines, not re-derived:** THR-1222 (human approval gate — the ask this report leads with), THR-1024 (gate chain terminating at THR-964 in `Idea`), THR-1301, THR-1303, THR-1349, THR-1256 (time gate, opens **2026-09-08**), THR-1255 / THR-1218 / THR-1220 / THR-870 / THR-175 / THR-1348 / THR-1195 / THR-1114 / THR-1189 / THR-1315 / THR-1274 / THR-1287 / THR-1134 / THR-1318 / THR-1148, the program epics (THR-1156, THR-789, THR-1043), the three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300 — design-session tickets, T2 input, not executor work), and all **15** `wayfinder:*` items skipped unconditionally.

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open (0 on frontier) | 0 available | THR-1232 (`prototype`, **assigned** — off the frontier by the assignee rule) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership re-derived from **this run's own** `Todo` sweep, not inherited: **3 maps + 12 children = 15 `wayfinder:*` items**, every child labelled `grilling` or `prototype`. `ORCH_WAYFINDER_AFK_MAX` did not bind because there was nothing to bind against — no `wayfinder:research` or `wayfinder:task` item appears anywhere in the 48-item `Todo` slice.

Nothing claimed, nothing assigned, no guessed resolution posted. **No `grilling` or `prototype` ticket was touched.**

## T2 — design authoring

**Shelf trigger fired at the scan; the `In Design` bound bars staging again. Sixteenth consecutive run barred.**

- **Shelf count: TRIGGERED at the scan.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` at scan time was **1** — THR-1328 alone. (THR-1359 left the shelf for `In Dev` at 16:04Z; THR-1316 and THR-1314 both carry `Deferral`, which this count excludes by design.)
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (10 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (14 days). Both far past the 48h threshold and **re-surfaced, not re-staged**.
- **Note for next run:** T1's promotion raises the post-run non-`Deferral` count to **2**, exactly at the floor, so the shelf trigger may not fire next hour. That is a counting artifact, not a recovery — both shelf items are process tickets, and the product pipeline is no healthier than it was an hour ago. Recorded so a future run does not read the un-triggered shelf as good news.

**Had the bound been open, the staging pick would still have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — a beast cannot be a bound scene actor, blocking every hunt encounter from being written — unchanged for twelve consecutive runs.

**T2 queue composition: no net change this run.** The ten standing design calls in `Todo`, the two parked in the column, three Proactive Agent Actions plan-doc sessions, twelve wayfinder questions on fully-prepared maps, and THR-964's wire-or-retire call. THR-1368 is **not** T2 input — it is fully specified executor work waiting only on its predecessor to merge.

## T3 — architecture health

**Detector sweep not due — the daily pass already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z / 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified by reading that report's T3 section on `origin/ops`. **No detector was run this hour**, and none of run d's results is restated here as if freshly measured.

**New findings this run: 0.**

**The hand-created `In Dev` count moved 3 → 2, which is a decrease and therefore not a new finding.** [THR-1364](https://linear.app/threadbare/issue/THR-1364/r4-t3-skills-sweep-engine-architecture-testing-patterns) completed at 16:27:33Z and left the slice. Re-stated per the THR-1325 item-3 ruling — surfaced, never normalised:

```
hand-created In Dev (never in Ready for Dev): THR-1361 (1.9h old, assignee Christian Spliid)
  — created DIRECTLY into In Dev, single stateHistory entry from 14:38:09Z
hand-created In Dev (never in Ready for Dev): THR-1365 (1.4h old, assignee Christian Spliid)
  — Todo → In Dev → Todo → In Dev, no Ready for Dev state ever
claim arbitration is pull-work Step 1.8's; not normalised.
```

**THR-1359 is explicitly *not* in that list**, though it is `In Dev` and self-claimed. Its `stateHistory` reads `Idea → Todo → Ready for Dev (11:30:35Z) → In Dev (16:04:03Z)` — it passed through the queue properly, so it is not the hand-created shape. Checked rather than assumed, because a self-claimed ticket and a hand-created one look identical from the assignee field alone.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised here.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** Daily-sweep judgement pass; run d did it. Not re-derived, and not implied to have been. Nothing in this run's reads is a redundancy judgement over the interface map and systems inventory.

**Stalled-work (repeated-claim class): not re-assessed** — daily-sweep item, run d's result stands. No issue in this run's board reads shows the `ORCH_STALLED_PICKUP_THRESHOLD` pattern of repeated `Ready for Dev → In Dev` with no `Done`.

## Escalations

**None raised, none parked.** No question was posted to Discord this run. The THR-1368 hold and the round-4 holds are technical judgements this lane is explicitly authorised to make, and none needed a direction call. Agreed work is not exhausted — the T2 queue holds fifteen-plus items and is blocked on design capacity and one chat approval, not on a missing decision, so the stop-and-ask condition did not fire.
