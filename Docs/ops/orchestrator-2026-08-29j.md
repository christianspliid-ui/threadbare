---
lane: tb-orchestrator
run: 2026-08-29j
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-29 (run j, ~11:27–11:32Z)

## Needs Christian

**One ask, and it is one word long. It has been waiting five days, and this lane stopped mentioning it five runs ago — that part is our fault, not yours.**

The encounter factory is ready to run its next batch of seven camp-and-devotion encounters — the small moments where a character sharpens a blade, wards a camp, tends a wound, or leaves an offering at a shrine. Right now those seven are the weakest writing in the game: they have almost no mechanical consequence at all, just a reputation nudge, no items, no traits, no lasting marks. The batch rewrites all seven to full standard.

**What you are approving:** [the batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) — readable now, already merged. One deviation is flagged in it for you: it does **seven** encounters instead of the usual six, because the camp set is one family in one file and splitting the seventh off would cost a whole extra cycle for nothing. Saying "six" restores the split.

**Why it matters beyond seven encounters:** the first one in the batch is the shrine offering, and that is encounter #1 of the [integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) — the sitting where you play all five encounters end to end. That checkpoint cannot invite you while the shrine offering is below standard. So this yes is what eventually gets you the playtest.

The ticket: [Run Retrofit Batch 2 — the camp seven](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine). It moves the moment you say yes in chat.

**Still open from earlier today, unchanged and not repeated here:** the trade-route desire question ([THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) + [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)), laid out in full in [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29i.md). And the two design items parked for 10 and 14 days — [the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which between them block every new design session from being staged.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0. Blockers resolved: 0.**

Board at the sweep: **47 `Todo`** (`hasNextPage: false`), **5 `Ready for Dev`** (`hasNextPage: false`), **2 `In Design`**, **5 `In Dev`** (2 live claims, 3 `Parked`). The promotion ceiling did not bind (shelf 5, threshold 15) and `ORCH_PROMOTE_BATCH_MAX` was nowhere near approached.

```
[orchestrator] T1 promote THR-1359: blockedBy [] (always was), no plan doc named
               → liveness passes trivially; latest comment 11:19:49Z is the filing
               session's own coordination block, no retire verdict → Ready for Dev
               11:30:35Z, verified by re-query; assignee key absent on re-query
```

### The promotion, and the one fact in it that had to be corrected

[THR-1359](https://linear.app/threadbare/issue/THR-1359/flesh-survives-as-a-live-key-in-10-production-sites-outside) arrived in `Todo` at 11:19:59Z — eight minutes before this run's scan, filed by the THR-1345 closeout as its deferral. `flesh` is a retired ninth Reach that still lives as an object key in roughly ten production sites; the type system cannot see it because the bags are annotated `Record<string, …>`.

It arrived **already carrying a coordination block** — the THR-836 path working as designed, filed by the party that actually knew the scope. That block was accurate on every line but one:

> **Mutex with: nothing currently open.** THR-1345 is the parent and has shipped.

THR-1345 has not shipped. It was still `In Dev` and assigned at 11:26Z, one minute before the scan, and `git log origin/main --grep="THR-1345"` returns no commit. The filing session wrote that line mid-closeout, before its own merge — an honest tense error, not a wrong judgement.

Checking the two halves separately mattered, because only one of them was wrong:

| Half of the claim | Verdict |
|---|---|
| The two tickets touch disjoint source files | **Correct.** `git diff --name-only origin/main...origin/claude/thr-1345-reach-key-drift` returns ten paths; not one of THR-1359's ten source files is among them. |
| Therefore no mutex | **Wrong.** Both write `typecheck-baseline.json` — and THR-1359's third Done-when is specifically *"do not add newly-surfaced errors to the baseline"*. Narrowing a widened annotation is exactly the operation that tempts a ratchet `--update`. |

So the promotion carries **`Mutex with: THR-1345 (both write typecheck-baseline.json)`**, with the reason inline per THR-688 rule B and an explicit reversal test: `git log origin/main --oneline --grep="THR-1345"`; a hit spends the mutex. This is a mutex on the ratchet file, not a dependency — `Blocked by: nothing` stands.

**Why the promotion comment restates the whole block rather than posting a one-line correction.** `pull-work` Step 3 validates the *latest* comment for all three coordination lines. A bare correction would have become the latest comment, missing two required lines, and the executor would refuse the very ticket this run promoted — the exact failure mode 4b exists to prevent.

**Not a Rule 0 promotion, and not charged to the process budget.** THR-1359 is Engine + Content product code — game lookup tables carrying a retired Reach — not delivery machinery. It sorts on its `Low` priority like any other product ticket. The one-process-ticket-per-three-runs allowance, spent on THR-1328 at run h, is untouched and still reopens at run k.

### Declined, with the reasons that changed

Only one decline is worth restating, because it is the ask this report leads with:

```
[orchestrator] T1 decline THR-1222: no blocker; held by a human approval gate in
               its own description ("Holds in Todo until Christian approves the
               batch-2 brief in chat, ruling 2") → not a blocker this lane can clear
```

Two things checked here that had not been checked before, both because the ask was about to be put in front of Christian:

- **The brief is live.** `npm run check:plan-doc-liveness -- Docs/plans/encounters/retrofit-batch-2-brief.md` → `LIVE … resolves on origin/main`. Asking him to approve a document he cannot open would have been the THR-921 stranded-artifact failure wearing a Christian-facing face.
- **`relations.blockedBy` is `[]`.** Nothing mechanical holds it. The gate is entirely the chat approval, which means one word moves a `High`-priority Content ticket into a queue that currently holds two non-`Deferral` items.

**And the lane's own lapse, recorded rather than quietly fixed.** THR-1222 appeared under `## Needs Christian` on essentially every run from 2026-08-26 through 2026-08-29d — thirty-four consecutive reports — then vanished from runs **e through i** while remaining just as unapproved. Nothing resolved it; it fell off the list. Restored here, and flagged in the section itself so he does not read a five-day-old ask as new.

**Unchanged declines, not re-derived:** THR-1301 (blocker THR-1349 still `Todo`), THR-1303 (blocker THR-1301 `Todo`), THR-1349 itself (wrong destination — run i's routing verdict stands, recorded on the ticket 09:30:51Z), THR-1256 (time gate, opens **2026-09-08**), THR-1255 / THR-1218 / THR-1220 / THR-870 / THR-1024 / THR-175 / THR-1348 / THR-1195, the program epics (THR-1156, THR-789, THR-1043), the eight design-gated items routed to T2, the three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300), and all **15** `wayfinder:*` items skipped unconditionally. THR-1326 / THR-1327 stay declined on the process budget alone, not on merit.

**Product-vs-process ratio.** This run's single promotion is product-code work, so week to date moves slightly toward product and stands at roughly **65/35 product to process** by completion. The shelf is thin but not starved — 6 items after the promotion, none claimed — so the headline is not "feature pipeline needs supply". It is that the only High-priority product content ready to move is waiting on one word in chat.

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open (0 on frontier) | 0 available | THR-1232 (`prototype`, **assigned** — off the frontier by the assignee rule) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership re-derived from this run's own `Todo` sweep: **3 maps + 12 children = 15 `wayfinder:*` items**, every child labelled `grilling` or `prototype`. The AFK column was re-proved directly this run rather than inherited — a label-filtered `list_issues(label:"wayfinder:research")` returns **19 issues, all `Done`**, and no `wayfinder:research` or `wayfinder:task` item appears anywhere in the 47-item `Todo` slice.

`ORCH_WAYFINDER_AFK_MAX` did not bind; there was nothing to bind against. Nothing claimed, nothing assigned, no guessed resolution posted. **No `grilling` or `prototype` ticket was touched.**

## T2 — design authoring

**Trigger does not fire on shelf count; would be barred by the `In Design` bound regardless. Twelfth consecutive run barred.**

- **Shelf count: NOT triggered.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` at the scan is **2** — THR-1328 and THR-1324. Exactly at the floor, not below it. THR-1359's promotion does not change this: it is `Deferral`-labelled and excluded from the count by construction.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (`startedAt` 2026-08-19, **10 days**) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (2026-08-15, **14 days**). Both far past the 48h threshold and **re-surfaced, not re-staged**.

**Had the bound been open, the staging pick would still have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — a beast cannot be a bound scene actor, which blocks every hunt encounter from being written — unchanged for eight consecutive runs, with THR-1349 + THR-1348 as the runner-up pair.

**T2 queue composition: unchanged at ten design calls** in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315, THR-1318, THR-1348, THR-1349), the two parked in the column, three Proactive Agent Actions plan-doc sessions, and twelve wayfinder questions on fully-prepared maps.

## T3 — architecture health

**Not due — the daily sweep already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z / 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified by reading that report's T3 section on `origin/ops`. **No detector was run this hour**, and none of run d's results is restated here as if freshly measured. `newFindings: 0` accordingly.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised here.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** Daily-sweep judgement pass; run d did it. Not re-derived, and not implied to have been.

**Stalled work: not re-assessed** — daily-sweep item, run d's result stands.

**Hand-created `In Dev`: the count fell 5 → 0, and the fall is the good kind.** Run i's five were all round-3 UI cleanup tickets from one attended session; four have since merged (PRs [#1726](https://github.com/christianspliid-ui/threadbare/pull/1726), [#1727](https://github.com/christianspliid-ui/threadbare/pull/1727), [#1728](https://github.com/christianspliid-ui/threadbare/pull/1728), [#1729](https://github.com/christianspliid-ui/threadbare/pull/1729), [#1730](https://github.com/christianspliid-ui/threadbare/pull/1730)) and the round is complete. `In Dev` now holds 5 issues, of which **2 are live claims that both passed through `Ready for Dev`** (THR-1345, THR-1330) and 3 are `Parked`. Delta on a standing finding, not a new one — the practice that produced it was one session sequencing its own work, and it ended when that work did.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted*, and that threshold is nowhere near: ten design calls, three plan-doc sessions and twelve wayfinder questions are all agreed and all waiting. Nothing was asked of Discord.

One item for the weekly retro, logged here rather than filed, per the process-work throttle:

**A Christian-facing ask can fall off the briefing without anything resolving it.** THR-1222 was surfaced under `## Needs Christian` on thirty-four consecutive reports, then dropped silently for five runs while its approval gate stayed shut. Nothing detected the disappearance; this run found it by grepping its own predecessors, which is not a mechanism. The observable cost so far is *deferred* work rather than lost work — under the materiality bar, hence a log row and not a ticket — but the shape is worth naming: the `## Needs Christian` section is rebuilt by judgement each hour, so a standing ask persists only as long as each run independently remembers it. A carried-forward list with an explicit drop reason would close it, and that is a retro decision rather than an in-run one.

**`ORCH_MAX_IN_DESIGN` still has no ageing escape** — restated from run i without new evidence, and deliberately not re-argued. Twelve consecutive runs now report the same two ids to the same reader.
