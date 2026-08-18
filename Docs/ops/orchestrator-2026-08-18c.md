---
lane: tb-orchestrator
run: 2026-08-18c
promoted: 2
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-18 (run c, ~06:30Z)

## Needs Christian

**Nothing new from me this hour, and the builder is working again.** Two jobs went onto the shelf this run, so it has roughly the next couple of hours covered without you.

The three asks from overnight still stand and still gate the *new-feature* pipeline. They are listed, not re-argued — this is the fourth run carrying them, and restating the full case every hour is how a list stops being read:

- [Are these two encounters worth meeting twice?](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) — the highest-value one; a yes releases the next nine.
- [Should committing a hand of nudge cards carry ~1.6 seconds of held breath?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) — yes wires it, no deletes it, either answer closes it.
- [The wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) — decides which parts of the game get the new typed-state treatment first.

## T1 — unblock sweep

**Promoted 2**, both found by doing what run b's handoff asked: working the `Idea` pool properly instead of treating it as drained.

```
[orchestrator] T1 scan: Todo 17, Idea 78 (FULL pool, not a recency window), Ready for Dev 1 → 3,
               In Dev 3 (THR-963 claimed 06:20Z + 2 parked), In Design 1
[orchestrator] T1 promote THR-830: blockedBy empty; zero comments (THR-990 check clean); no plan doc
               named so liveness passes trivially; defect re-verified live against main 921ce9b2 —
               edgeSchema.ts:368-372 declares actor/actor, sole production producer
               strategicGraphOps.ts createTradeRoute writes location ids, every other producer is a
               fixture. Verified via get_issue: "Ready for Dev", assignee key absent. Block posted.
[orchestrator] T1 promote THR-745: blockedBy empty; zero comments; no plan doc owed (substrate shipped
               under THR-718); three-pillar satisfied on the ticket as written; carries a membership
               predicate not a count. Verified via get_issue: "Ready for Dev", assignee key absent.
               Block posted.
[orchestrator] T1 skip THR-716: RESOLVED ON MAIN — see finding below. Not a decline, a closure candidate.
[orchestrator] T1 skip THR-965: author's own framing — "needs a creative-direction call", three options
               that differ in what character drift MEANS. Genuine fork → T2/Christian, not the queue.
[orchestrator] T1 skip THR-831: body states "a game-feel call about what broad sphere access should buy,
               so it wants a design verdict rather than an executor picking a number" → T2
[orchestrator] T1 skip THR-662: body states "Design-first: this needs an In Design pass ... before code
               (three-pillar)" → T2
[orchestrator] T1 skip THR-857: asks whether `intelligence` should become a canonical subcategory —
               a terminology call, routes via UL-proposal, not the executor queue
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 still Idea. 20th run.
[orchestrator] T1 skip THR-1155/1134/1002/1114/1052/964/1094/1095/1026/1053/1148: wrong destination,
               each says plan-doc-before-code in its own body → T2 (carried, not re-derived)
[orchestrator] T1 skip THR-1156/789: program epics, containers not claimable
[orchestrator] T1 skip THR-1088: standing verdict "already resolved on main — do not promote", run l
[orchestrator] T1 skip THR-175/870: explicit deferral triggers unmet
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 skip THR-1043/791/877: carry an assignee — not queue candidates
```

### Finding: a second Idea ticket is already fixed on main, and nobody is closing them

**THR-716** (`{actor}` renders literally in encounter prose) was the strongest-looking candidate on the board this run — Medium, player-visible, engine-verifiable. It is **already fixed**. `src/engine/proseEnrichment.ts:583-590` carries exactly the fix its option 1 recommended, plus the `{Actor}` sentence-initial form, under a comment crediting **THR-933**. The ticket is stale, not blocked.

That is the **second** such ticket in the visible pool — THR-1088 has carried the same verdict since run l on 2026-08-17. Two data points is a pattern worth naming: the `Idea` pool has gone unread long enough that some of it has been fixed by other work, and nothing sweeps it. The cost is not hypothetical — this run spent its single best-looking candidate on one, and would have promoted it to the top of the queue had the defect not been re-verified against `main` first. That verification step is the only thing standing between a stale ticket and a wasted executor pickup.

**Logged, not filed** — per the 2026-08-10 process-work throttle, scheduled lanes do not file process tickets; the weekly retro is the single promotion point. Neither ticket was closed by this lane, which does not set terminal states on non-wayfinder issues. Both should be closed by whoever next touches them: THR-716 against the THR-933 fix, THR-1088 against `20bd16ab`.

### Why these two and not more

`ORCH_PROMOTE_BATCH_MAX` (5) did not bind and the shelf is not backed up, so the ceiling was not the constraint — judgement was. Of the pool's genuinely-unblocked items, most decline for one of two honest reasons: they name a design fork the executor may not settle, or they need a browser the unattended lane cannot start. The two promoted are the ones that are neither.

Both are **engine/content repair, not process work** — neither touches the delivery machinery — so the process budget is not spent and Rule 0 does not apply to either.

### The shelf, honestly

`Ready for Dev` now holds **3**: THR-830 and THR-745 (both claimable by the unattended lane) and [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), which its own block rules out for that lane (`preview_start` is refused there — an approval gate, not a fault). **Claimable = 2.**

It was **0** when this run started: the executor took THR-963 at 06:20Z, seven minutes before the scan, draining run b's single promotion inside the hour. Two promotions is deliberately a buffer against that, not an attempt to look busy.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Re-queried live this run by label rather than carried: every `wayfinder:research` (THR-1160, 1158, 1159, 1039, 903) and every `wayfinder:task` (THR-986, 906, 904) issue board-wide is **Done**. Every open wayfinder ticket is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the map-closing sitting) and THR-1162 (`wayfinder:prototype`, downstream of it in practice).
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 open but assigned, so outside the frontier by rule.

## T2 — design staging

**Triggered for the nineteenth consecutive run, and bound again.** Non-`Deferral` items in Ready for Dev: **0** — below `ORCH_PROGRAM_WORK_FLOOR` (2).

This run's promotions did **not** move that number: THR-830 and THR-745 both carry `Deferral`, so they lift the *claimable* shelf without lifting the *program-work* count. Both readings are true and they measure different things — claimable is what the executor can take next hour, program-work is whether anyone is authoring new features.

**Nothing staged.** `In Design` holds 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — exactly `ORCH_MAX_IN_DESIGN` (1). It is now **~58 hours past staging** (staging comment 2026-08-15T20:29:28Z, `updatedAt` unmoved). Re-surfaced in the record, not re-staged; the slot is not released, because reinterpreting the bound to unblock myself is the get-busy failure this lane exists to avoid. Deliberately not repeated under `## Needs Christian` — it has been put to him five runs running and is not one of the things that would move today.

The T2 candidate queue grew by four this run, all declined out of T1 above with their reasons: THR-965, THR-831, THR-662, THR-857. The binding constraint remains design supply plus the `In Design` bound, not candidate shortage.

**Product-vs-process ratio:** not re-measured. Run p's trailing-7-day figure (~2:1 product-favouring) stands; re-deriving a week-wide window hourly is noise, and nothing completed in the last hour would move it.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z (first past `ORCH_HEALTH_SWEEP_HOUR` = 6 local) and its results stand unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` sub-checks green except the longstanding `check:authoring-brief` staleness, one new orphaned four-component cluster (`SceneStatePanel` + 3 siblings), and `sweep:rank-reach` **unavailable** and explicitly not reported as clean.

**No detector was run this run, and none is reported as clean.** The `newFindings: 1` in this run's frontmatter is the T1 finding above (THR-716 resolved-on-main), not a T3 detector result.

**Redundancy: not assessed this sweep** — the judgement pass belongs to T3, and T3 did not run.

Weekly test-suite health is **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check ran** off `stateHistory` already fetched: THR-830 and THR-745 each show a single Idea→Ready-for-Dev transition, so 0 pickups. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

**No Discord question posted, and the trigger was checked rather than skipped.** Run a set the condition: ping if a later run finds the shelf still at zero *and* no verdict movement. The shelf is not at zero — this run put two claimable items on it — so the condition is unmet for the second hour running. A ping now would be a fifth copy of three asks already on tickets, in three run reports, and in the hourly briefing.

**One thing worth watching rather than escalating:** the claimable shelf has now drained to zero twice inside three hours. Two promotions buys roughly two pickups. If run d or e finds it empty again with the three verdicts still open, the honest read is that T1 promotion cannot keep pace with a one-per-hour executor on a backlog this design-gated — and *that* is worth putting to Christian as a supply problem, rather than repeating the three asks a sixth time.

Nothing parked. No detector failed this run because none was due. No verify-after-write mismatch: both writes were re-queried via `get_issue` and both held, with the assignee key absent on each.
