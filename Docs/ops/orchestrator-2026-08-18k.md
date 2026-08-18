---
lane: tb-orchestrator
run: 2026-08-18k
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-18 (run k, ~23:35Z)

## Needs Christian

**One ask: the design queue has been stuck since Friday, and the builder shelf just ran down to one real job.**

Three things you asked for are waiting for a design sitting that nobody can schedule, because the lane may only hold one job "in design" at a time and that slot has been occupied since Friday evening by [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — staged 3½ days ago and never picked up. Everything queued behind it is your own direction:

- [Nations and named areas are drawn but not simulated](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) — your call on 2026-08-17: *"nations and areas only have the rendering implemented and the game state part is not there."* Until this lands, a kingdom or a named region cannot be something an encounter points at, a faction claims, or a chip links to. It has sat untouched for two days.
- [The one-button snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) — the thing that would let you hand a weird-looking run straight to an agent instead of a screenshot and a sentence. Filed at your request on 2026-08-16, also untouched.
- [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) itself — location traits, artifact traits, and drawing encounters by trait.

**What would unstick it:** either an hour of design on one of these, or telling me Traits wave 2 can go back in the pile so the newer two can move. Either answer frees the queue; leaving it as-is means the design side stays frozen while the builder side empties.

The builders are not idle tonight — eight jobs are still shelved and they shipped [all nine nudge card types](https://linear.app/threadbare/issue/THR-1179/nudge-card-mechanics-build-every-card-type-whose-library-status-is-not) in the last three hours. But only one shelved job is newly-designed work; the rest are defect repairs. That is the pipeline running on stored supply.

The two standing items from earlier today are unchanged and not re-asked: the Grateful Kin's payoff scene ([THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the)) and the three missing nudge-card pictures ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)).

## T1 — unblock sweep

**Promoted 0.** No blocker cleared into any candidate this run.

```
[orchestrator] T1 scan: Todo 19, Idea 60 (first page, full), Ready for Dev 8, In Dev 3,
               In Design 1. Shelf unchanged in count since run j (8); membership shifted —
               THR-1179 Done 22:44Z, THR-1180 claimed 23:02Z.
[orchestrator] T1 newly-Done since run j: THR-1179 (22:44:47Z) and THR-1178 (20:44:12Z, after
               run j's 20:30Z scan). Both checked as blockers: THR-1179 relations blocks:[] on
               live query; board-wide description search for "THR-1179" and "THR-1178" each
               returns only the issue itself. Neither unblocks anything. Zero promotions is the
               correct output, not a skipped sweep.
[orchestrator] T1 decline THR-1155: wrong destination — the ticket says "this is a design
               ticket — plan doc before code" and its Done-when is a plan doc in Docs/plans/.
               blockedBy empty; nothing holds it. Routed to T2.
[orchestrator] T1 decline THR-1134: wrong destination — "Scope for the design pass", and its
               own executor note says "the design session that picks it up authors one at
               handoff". blockedBy empty. Routed to T2.
[orchestrator] T1 decline THR-1182: unchanged from runs i and j — its Done-when step 1 is a
               chat brief approval no unattended lane can obtain.
[orchestrator] T1 skip THR-1157/1163/1162/902/907: wayfinder:* label — never enter Ready for Dev.
[orchestrator] T1 skip THR-1043/791/877: assigned; promoting an assigned issue hides it from
               pull-work's assignee:null candidate query.
[orchestrator] T1 skip THR-1185: no blocker to clear, filed 20:15Z into Idea. Doc drift at Low
               sorts below the shelved deferrals. Not a decline; nothing holds it.
```

**Idea swept in full again** (60, first page). Owed because two issues went Done since run j's sweep. Nothing new arrived and no Idea item names either as a blocker — run j's reading still holds, now re-measured rather than carried.

**Ceiling did not bind.** Shelf 8, well under `QUEUE_BACKED_UP_MIN` (15). Nothing was held back: the pool produced no promotable candidate, which is a different thing from a throttle and is recorded as such.

### The shelf, honestly — and why the floor now reads breached

`Ready for Dev` holds **8**: [THR-1181](https://linear.app/threadbare/issue/THR-1181/ul-proposal-sphere-attunement), [THR-830](https://linear.app/threadbare/issue/THR-830/edge-schema-declares-trades-with-as-actoractor-but-every-shipped), [THR-857](https://linear.app/threadbare/issue/THR-857/possession-subcategory-vocabulary-has-3-off-union-strays-intelligence), [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), [THR-1173](https://linear.app/threadbare/issue/THR-1173/location-link-tier-is-capability-complete-but-unexercised-no-shipped), [THR-625](https://linear.app/threadbare/issue/THR-625/world-volume-backstory-strata-prose-expansion-content-follow-on-to-thr), [THR-1183](https://linear.app/threadbare/issue/THR-1183/sublocations-are-minted-in-two-incompatible-node-shapes), [THR-1184](https://linear.app/threadbare/issue/THR-1184/sacred-route-is-registered-but-has-zero-consumers-an-eight-tick). Every one carries no assignee — verified on this run's re-query, not inferred.

**Exactly one is non-`Deferral`** — THR-1181, a UL terminology entry. Run j read three; THR-1179 shipped and THR-1180 was claimed, so the count fell 3 → 1, below `ORCH_PROGRAM_WORK_FLOOR` (2). That is the T2 trigger, and it is the first breach since run h.

Two honest qualifications on that number, in both directions. It **undercounts** real work: THR-1183 and THR-1184 are `Deferral`-labelled but are game defects rather than cleanup, and THR-625 is genuine prose content. The executor is not short of things to do tonight. It **also flatters** the pipeline: of the eight, only THR-1181 came from a design pass; the other seven are repairs to things already built. A shelf made entirely of repairs is a shelf with no upstream supply, which is exactly the condition the floor exists to detect.

Standing caveats unchanged: THR-1133 needs an attended session with a real dev server at 1920×1080; THR-830 stays mutexed against THR-1184 (both edit `EDGE_SCHEMA`).

**Product-vs-process completion ratio, week to date:** 56 issues completed since 2026-08-12, of which **5** are delivery-machine work (THR-1167, THR-1091, THR-1089, THR-1032, THR-1065) — roughly **51 product : 5 process**, about 9:1 in favour of the game. Measured off the first page (100) of issues updated in the last 8 days, so the absolute count is a floor, not a total; the proportion is the reportable part. The 2026-08-10 process-work throttle is holding comfortably, and no process ticket was promoted or filed this run.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — no AFK ticket exists to spend them on.** Re-queried live by label this run rather than carried from run j: all six `wayfinder:research` (THR-1176, 1159, 1160, 1158, 1039, 903) and all three `wayfinder:task` (THR-986, 906, 904) are `Done`. Every open wayfinder ticket board-wide is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier two, both HITL, both unassigned: [THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) (`wayfinder:grilling`) and [THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) (`wayfinder:prototype`).
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 is open but assigned, so outside the frontier by rule.

Neither map's HITL frontier is repeated under `## Needs Christian` this run — both have been put to him on consecutive runs and neither has changed. This run's ask is the design queue, which is a different and newly-breached condition.

## T2 — design authoring

**Triggered by the floor, and bounded to zero by the ceiling.** Non-`Deferral` shelf count 1 < `ORCH_PROGRAM_WORK_FLOOR` (2), so the tier fired for the first time since run h. `In Design` holds 1 = `ORCH_MAX_IN_DESIGN`, so no item could be staged.

The occupant is [THR-790 (Traits wave 2)](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools), staged by this lane on 2026-08-15 at 20:29Z (run h) — **3 days 3 hours unpicked**, well past the 48h mark. Per the skill it is **re-surfaced, not re-staged**, and that is what the `## Needs Christian` section above does.

Two agreed, unblocked candidates are queued behind it and were declined by T1 this run as design input rather than dev work:

- **[THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)** (High, filed 2026-08-17) — agreed by direct director quote in the ticket body. `blockedBy` empty. Would be this run's staging pick.
- **[THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** (High, filed 2026-08-16) — filed from an attended session at Christian's explicit request, with the scope decisions already recorded in the body. `blockedBy` empty.

Neither is a new direction, so neither needed asking about; both are ordinary staging that the `ORCH_MAX_IN_DESIGN` bound prevented. **No un-agreed roadmap item was substituted to keep the tier busy** — the alternative to staging is nothing, and nothing is what happened.

## T3 — architecture health

**Not due.** Local time is 01:35 on 2026-08-19, before `ORCH_HEALTH_SWEEP_HOUR` (6 local); the next due sweep is the first run after 06:00 local. Run b performed the last full sweep at ~05:27Z.

**No detector was run this run, and none is reported as clean.** Run b's standing results are unmodified and are not re-asserted as fresh: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` green except the longstanding `check:authoring-brief` staleness, and `sweep:rank-reach` **unavailable** — explicitly not clean, merely unmeasured.

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, not reported as clean.**

**Redundancy: not assessed this sweep** — the judgement pass belongs to a due T3, and T3 was not due.

Weekly test-suite health **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Wednesday (3) local. Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check: carried, not re-measured, and said so.** Run b's board-wide pass at 05:27Z found THR-1130 highest at 2 pickups, under `ORCH_STALLED_PICKUP_THRESHOLD` (3). THR-1179's `stateHistory` was read this run in full (Ready for Dev → In Dev 21:02Z → Done 22:44Z, one clean pickup) and adds nothing. THR-1130 remains `In Dev` and unassigned since 20:16Z — a park, not a stall, and outside this tier's threshold either way.

### The one new finding this run

`newFindings: 1`, and it is **not** a detector result — T3 did not run.

**The T2 staging tier can be jammed indefinitely by a single unpicked item, and tonight it is.** `ORCH_MAX_IN_DESIGN` is 1 and counts *staged* items, with no expiry: an item that is staged and never picked holds the slot forever, so every later floor breach resolves to "triggered, bounded to zero" no matter how much agreed work has accumulated behind it. The 48h re-surface rule is the only pressure valve, and it is advisory — it writes a line in a report and changes no state.

This is the third consecutive day the slot has been held, and the first day the floor has breached underneath it, so the bound is now costing something measurable rather than being theoretical: two director-requested High items sat unstaged this run for a reason unrelated to their own readiness.

**Filed as a report line, not a ticket** — the 2026-08-10 process-work throttle puts scheduled lanes out of the process-ticket business, and the weekly retro is the single promotion point. It also does not clear the materiality bar on today's evidence: the measurable loss so far is staging latency, not lost work. If the same jam recurs after Christian resolves the current occupant, the retro has a pattern with three dated instances and can weigh a slot-expiry rule against it.

## Escalations

**None asked, one parked.** Nothing was escalated to Discord: the design-queue jam is a question for Christian in the briefing, not a question about direction, and the skill's escalation path is for exhausted agreed work — agreed work is not exhausted here, it is queued behind a bound.

Parked: staging THR-1155 (and after it THR-1134), pending the `In Design` slot freeing. Both will be re-offered by the next run that finds the slot open.

No fail-soft path fired. Linear answered every call; no write was attempted this run, so no verify-after-write was owed; no detector was invoked.
