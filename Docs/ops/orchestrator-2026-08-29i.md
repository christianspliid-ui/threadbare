---
lane: tb-orchestrator
run: 2026-08-29i
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-29 (run i, ~09:27–09:36Z)

## Needs Christian

**One new thing arrived for you this hour, and it is a game question.**

A builder took the trade-route problem, did exactly what the ticket prescribed, measured the result, and found the prescription was aimed at the wrong thing. Then it stopped and handed the question back rather than tuning a number until the graph looked right. That is the behaviour you want, and it means the answer is now yours.

**The question, in game terms.** Characters in the world decide what to do by weighing how much they *want* a thing. A merchant proposing to establish a trade route is currently scored as wanting it almost not at all — the route's authored motivations (*asceticism/extravagance*, *loyalty/ambition*, *tradition/novelty*) do not match the profile of the only kind of character who ever proposes it. Because wanting is a multiplier rather than a bonus, that mismatch is not a small penalty: the route needs roughly **ninety times** the payoff of a well-matched alternative to ever win. So in practice no merchant ever builds one.

Two readings, both defensible, and they make different worlds:

1. **The world should not silence a merchant's own trade.** Ambitions people actually hold get a floor on desire, the way encounters already do. Merchants build routes; the economy has a visible supply side.
2. **The mismatch is correct and mortals genuinely do not pursue what they do not value.** In that case the route's authored motivations are simply written wrong for merchants, and it is a content fix rather than an engine one — but it also means the game is willing to let a whole category of thing quietly never happen because nobody wants it.

The ticket is [the decision board has no variety term](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade). It pairs with one already on your list — [ten of the things characters can pursue are unreachable on one of the two test worlds](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the), because only background characters ever hold them. Same economy, same shape of question: how much of the world is allowed to happen off-screen. They probably want answering in one sitting.

**And the standing ask is unchanged, now for the eleventh hour.** Everything above needs a design session, and no new one can be staged because two have been open in the design column for **10 and 14 days** — [the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools). Closing or parking either one unblocks the queue behind it. The one waiting longest to be picked up is still the **non-human cast problem** — a beast cannot currently be a character in a scene, which blocks every hunt encounter from being written ([THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)).

**No action needed on the round-3 UI cleanup** — it is running well under its own steam and is mentioned only so you do not read the numbers below as trouble.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers resolved: 0.**

Board at the sweep: **48 `Todo`** (`hasNextPage: false`), **7 `Ready for Dev`** (`hasNextPage: false`), **2 `In Design`**, **9 `In Dev`** (6 live claims, 3 `Parked`). The promotion ceiling did not bind (shelf 7, threshold 15) and `ORCH_PROMOTE_BATCH_MAX` was never approached.

### The one movement this hour, and why it is a decline rather than a promotion

```
[orchestrator] T1 decline THR-1349: blockedBy [] and always was, but latest comment
               (08:35:42Z) is a partial ship whose measurement falsifies three of the
               six Done-when items → wrong destination, routed to T2 (barred)
```

[THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) left `In Dev` for `Todo` at **08:35:42Z**, eight minutes into run h's window and after its scan — so this is the first run to see it. [PR #1724](https://github.com/christianspliid-ui/threadbare/pull/1724) shipped the variety term (`BOARD_VARIETY_PENALTY_WEIGHT = 0.18`, multiplicative) and the composition gate (`CENSUS_DISTINCT_TEMPLATE_FLOOR = 30`), then the session unassigned itself and asked this lane's T2 to re-scope the remainder.

**This is the decline that only the THR-990 comment read can catch.** `relations.blockedBy` is `[]` and always was, so a sweep reading the dependency half alone would promote it every hour, indefinitely. What actually holds it is in the comment body:

| Done-when item | Status after #1724 |
|---|---|
| Diversity term in the board's currency | ✅ shipped |
| Composition gate on `undertaking-census.ts` | ✅ shipped |
| Census re-run, both seeds, §4 criteria | ✅ passing |
| `trades_with` non-zero under a live board | ❌ **falsified** — 0 → 0 on both seeds *with* the term |
| Mode → `'live'`, contest B / bridge / clamp deleted | ❌ blocked on the above |
| `decisionBoardLiveness.test.ts` pin flipped | ❌ blocked on the above |

And `trades_with > 0` cannot be the acceptance signal at all: the **currently shipped** `'shadow'` board writes zero on seed 99, so gating on it would red the census on `main`. The measured cause is a desire mismatch (`desireMultiplier` `0.0112` — the `MINIMUM_DESIRE` floor — against a winner's `2.7750`), which an 18% variety discount cannot close.

Per the decline taxonomy this is **wrong destination**, not an unmet blocker: met blockers do not make a ticket dev-ready when the remaining work is a design fork. **Routing recorded as a comment on the ticket** (09:30:51Z) so the next run reads the verdict instead of re-deriving it, and so no future sweep re-promotes it off the empty `blockedBy` field. Nothing was written to its state; no promotion, no assignment.

### The undertaking chain shortened by two links and grew a design head

THR-1301's blocker set was three; two cleared today — **THR-1302 `Done` 03:42:44Z**, **THR-1297 `Done` 2026-08-27T21:14Z**. THR-1349 is now the only one left, and it is no longer a build question. Chain unchanged in depth, changed in kind:

```
[orchestrator] T1 decline THR-1301: 2 of 3 blockers cleared (THR-1302 Done 03:42Z,
               THR-1297 Done 08-27); THR-1349 remains Todo → still gated
[orchestrator] T1 decline THR-1303: blocker THR-1301 is Todo
```

### Declined, unchanged from run h

THR-1222, THR-1195, THR-1256 (time gate, opens **2026-09-08**), THR-1255 / THR-1218, THR-1220, THR-870, THR-1024, THR-175, THR-1348, the program epics (THR-1156, THR-789, THR-1043), the eight design-gated items routed to T2, the three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300 — all three fully unblocked now that docs 1–3 are `Done`, all three design work rather than executor work), and all **15** `wayfinder:*` items skipped unconditionally.

**THR-1326 / THR-1327 stay declined on the process budget alone**, not on merit. Run h spent the *one process ticket per three runs* allowance on THR-1328; this is run i, so the budget reopens at run k at the earliest. Both are retro-filed with quotable above-bar loss and remain the default candidates when it does.

### New this hour and deliberately not promoted: the round-3 sweep tickets

[THR-1357](https://linear.app/threadbare/issue/THR-1357/r3-t5-code-debts-delete-agentwheel-honest-removal-test-harvest) and [THR-1358](https://linear.app/threadbare/issue/THR-1358/r3-t6-register-the-ui-laws-doctrine-stamps-round-3-complete) were filed into `Todo` at 09:00Z by the attended round-3 session. Both declined, on two independent grounds:

- **Assigned.** Both carry `assignee: Christian Spliid`. Promotion is an update and would leave that intact, producing a `Ready for Dev` item invisible to `pull-work`'s `assignee:null` candidate filter — a promotion into a slot nothing can claim.
- **Actively sequenced by their author.** THR-1357 moved `Todo → In Dev` at 09:28:21Z **during this run**, without any help. THR-1358 additionally has two open native blockers (THR-1353, THR-1355). The session that wrote these tickets is walking them itself; a promoter reaching into that would be interfering, not unblocking.

**Product-vs-process ratio.** Zero promotions, so this run moves it nowhere; week to date stands at roughly **65/35 product to process** by completion. The shelf is not starved — 7 items, none claimed — so the headline is **not** "feature pipeline needs supply". It is the standing one: every route from agreed work to a *prepared design* runs through a person, and this hour added a second design fork to that queue rather than clearing one.

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open (0 on frontier) | 0 available | THR-1232 (`prototype`, **assigned** — off the frontier by the assignee rule) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership re-derived from this run's own state-filtered `Todo` sweep: **3 maps + 12 children = 15 `wayfinder:*` items**, every child labelled `grilling` or `prototype`. Run d's direct proof that the AFK column is empty (19 `wayfinder:research` + 3 `wayfinder:task`, all `Done`) still holds — no issue has changed label or state since.

`ORCH_WAYFINDER_AFK_MAX` did not bind; there was nothing to bind against. Nothing claimed, nothing assigned, no guessed resolution posted. **No `grilling` or `prototype` ticket was touched.**

## T2 — design authoring

**Trigger does not fire on shelf count; would be barred by the `In Design` bound regardless. Eleventh consecutive run barred.**

- **Shelf count: NOT triggered.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` is **2** — THR-1328 and THR-1324. Exactly at the floor, not below it, so the trigger is off by one item. Run h predicted this in as many words, and the prediction held: the count sits at 2 because *this lane promoted THR-1328 last hour*, not because program work arrived.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — THR-1002 (`startedAt` 2026-08-19, **10 days**) and THR-790 (2026-08-15, **14 days**). Both far past the 48h threshold and **re-surfaced, not re-staged**.

**A hand-off addressed to this tier arrived and could not be taken.** THR-1349's 08:35Z comment says, in its own words, that it is moving to `Todo` and unassigning *"so `tb-orchestrator` (T2) can re-scope"*. T2 read it and is barred. That is the first time this lane has been named as the destination for work it then could not accept, and it is worth stating plainly rather than burying: the bound is doing its job (one staged item at a time), but the column it guards has not moved in ten days, so the bound is functionally a wall rather than a valve.

Recorded on the ticket rather than acted on. Merging THR-1349's desire fork into THR-1348 — which the 08:35Z comment itself suggests — is a scoping decision for whichever design session takes them, not a bookkeeping move a promoter should make unilaterally.

**Had the bound been open, the staging pick would still have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)**, unchanged for seven consecutive runs, with THR-1349 + THR-1348 as the new runner-up pair on strength of freshness and a live executor hand-off.

**T2 queue composition: net +1.** Ten design calls in `Todo` (the nine from run h — THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315, THR-1318, THR-1348 — plus THR-1349), the two parked in the column, three Proactive Agent Actions plan-doc sessions, and twelve wayfinder questions on fully-prepared maps.

## T3 — architecture health

**Not due — the daily sweep already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z / 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified by reading that report's T3 section on `origin/ops`. **No detector was run this hour**, and none of run d's results is restated here as if freshly measured.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised here.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** It is a daily-sweep judgement pass; run d did it. Not re-derived, and not implied to have been.

**Stalled work: not re-assessed** — daily-sweep item, run d's result stands.

**Hand-created `In Dev` went 2 → 5, and the growth is not the hazard the ruling names.** Delta on run d's standing finding, not a new one — `newFindings` is 0 accordingly.

| Issue | Path | Ready for Dev ever? |
|---|---|---|
| THR-1350, THR-1351 | created **directly into** `In Dev` 06:17Z | no (run h's finding, unchanged) |
| THR-1354 | `Todo` 09:00:03 → `In Dev` 09:09:04 | no — `stateHistory` read this run |
| THR-1356 | `Todo` 09:00:17 → `In Dev` 09:20:44 | no — `stateHistory` read this run |
| THR-1357 | `Todo` 09:00:25 → `In Dev` 09:28:21 | no |

All five belong to the attended round-3 UI cleanup and share one author. **They satisfy the finding's predicate by the letter and not its purpose**, which is worth saying rather than letting a count triple unqualified. The ruling exists because a ticket skipping `Ready for Dev` skips the claim step and carries no coordination block — which is how THR-1245 got implemented twice concurrently. These carry the mutex inline in the description instead: THR-1354 reads *"Mutex with R3-T1 (both edit INDEX.md, frontend-ui, typography.md) — worked serially after T1 merges"*, and each has a human-gate record, its own branch and an open PR. A single attended session sequencing its own tickets cannot race itself.

**Nothing was normalised and nothing was written to.** Claim arbitration remains `pull-work` Step 1.8's. The countability the ruling asks for is served by the number moving in the record — with the distinction attached, so a future reader does not price five deliberate attended tickets as five near-misses.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted*, and that threshold moved further away, not closer: the T2 queue grew to ten design calls plus three plan-doc sessions and twelve wayfinder questions, all agreed. Nothing was asked of Discord.

One item for the weekly retro, logged here rather than filed, per the process-work throttle:

**`ORCH_MAX_IN_DESIGN` has no ageing escape.** The bound is 1, the column holds 2 items aged 10 and 14 days, and the rule for a stale staged item is "re-surface, not re-stage" — which produces exactly the observed steady state: eleven consecutive runs reporting the same two ids to the same reader, while a live executor hand-off addressed to this tier is refused. Not filed as a ticket: cost is currently *deferred* work rather than lost work, which is under the materiality bar, and the fix is a constant plus an ageing rule — a decision for the retro, not a promotion.
