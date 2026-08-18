---
lane: tb-orchestrator
run: 2026-08-18j
promoted: 2
filed: 0
resolved: 0
newFindings: 2
needsChristian: false
---
# Orchestrator — 2026-08-18 (run j, ~20:30Z)

## Needs Christian

**Nothing new needs you this run.** Both jobs promoted below are ordinary builder work with no decision in them.

The two standing items are unchanged and already on your briefing — the ten-minute chat that starts The Grateful Kin's payoff scene ([THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the)), and whether to spend image credits on the three missing nudge-card pictures ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)). They are named here for continuity, not re-asked: repeating an unchanged ask every hour is how a briefing trains its reader to skip it.

## T1 — unblock sweep

**Promoted 2.** Scanned Todo (22) as the candidate pool; Ready for Dev (8 at scan) read for shelf depth, not as candidates; Idea swept in full (60, first page).

```
[orchestrator] T1 scan: Todo 22, Idea 60, Ready for Dev 8 (was 9 at run i — THR-1177 and
               THR-1178 left the shelf), In Dev unchanged
[orchestrator] T1 promote THR-1184: blockedBy empty on live relation query, no prose gate, no
               time gate, no wayfinder label. Parent package THR-1177 Done 2026-08-18T19:50Z
               (merged 5de24cc3, PR #1552). Zero comments, so no retire verdict (THR-990). No
               plan doc named → liveness gate trivially passes. Premise re-verified at HEAD
               69fcfc08: producer + ambition ref + schema row present, zero production
               consumers, KNOWN GAP note located at edgeSchema.ts:477/479. Verified via
               get_issue: "Ready for Dev", assignee key absent. Block posted, mutex THR-830.
               (program: Content Architecture)
[orchestrator] T1 promote THR-1183: blockedBy empty, no gates, no wayfinder label. Same parent
               package, same Done evidence. Zero comments. No plan doc named. Two mint shapes
               re-verified at HEAD; one reader claim in the description falsified (below).
               Verified via get_issue: "Ready for Dev", assignee key absent. Block posted.
               (program: Content Architecture)
[orchestrator] T1 skip THR-1185: filed 20:15Z into Idea, no blocker to clear — promoting it is
               a pure queueing choice, and doc drift sorts by priority (Low) below the five
               deferrals already shelved. Not a decline; nothing holds it.
[orchestrator] T1 decline THR-1182: unchanged from run i — wrong destination, its own Done-when
               step 1 is a chat brief approval no unattended lane can obtain.
[orchestrator] T1 skip THR-1157/1163/1162/902/907: wayfinder:* label — never enter Ready for Dev.
[orchestrator] T1 skip THR-1043/791/877: assigned; promoting an assigned issue hides it from
               pull-work's assignee:null candidate query.
```

**Idea was swept in full this run, closing run i's recorded narrowing.** Run i queried `updatedAt: -P1D` and said plainly that the shortcut is only safe when nothing newly Done is named as a blocker by an unmoved Idea item. THR-1177 went Done at 19:50Z since then, so the check was owed. Full first page (60) read: one new arrival, THR-1185, and no Idea item names THR-1177, THR-1178 or THR-1181 as a blocker. Nothing was missed by run i's shortcut, and the full sweep is now the current reading rather than an inference.

### The two promotions, and why they are queue work rather than process work

Both are the executor's split-outs from [THR-1177](https://linear.app/threadbare/issue/THR-1177/edge-integrity-the-enforce-now-package-validate-at-the-two-generic), the edge-integrity package, which merged at 19:50Z — about three hours after it reached the shelf. Neither is delivery-machine tidying, so the materiality bar does not reach them: one is a shipped strategic project that changes nothing in the fiction, the other is a node-shape incoherence that makes half the sublocations invisible to half the codebase. Both are Deferrals in an **active** project (Content Architecture, which also holds the Urgent typed-state epic), which is prioritization rule 1 — the top of the feature ordering, not a queue-jump.

**[THR-1184](https://linear.app/threadbare/issue/THR-1184/sacred-route-is-registered-but-has-zero-consumers-an-eight-tick) — `sacred_route` has no consumer.** A zealot faction can spend eight ticks and 30 wealth consecrating a pilgrimage route whose prose promises *"Pilgrims will follow where the faithful walked first"*, and nothing anywhere reads the resulting edge. Verified against HEAD rather than trusted: producer at `zealotStrategicPack.ts:96/113`, ambition reference at `ambition-templates.ts:578`, registered at `graph.ts:145` and `edgeSchema.ts:464`, and every remaining hit in the repo is a test.

**[THR-1183](https://linear.app/threadbare/issue/THR-1183/sublocations-are-minted-in-two-incompatible-node-shapes) — sublocations are minted two ways.** `sublocation.ts:312/785` mints `type: 'location'`; `strategicGraphOps.ts:117` mints `type: 'sublocation'`. Both verified at HEAD.

### Two findings handed to the takers rather than left in the tickets

Counted as this run's `newFindings: 2`. Neither is a T3 detector result — T3 did not run (below).

**1. THR-1184's own framing is superseded, by a ruling that landed the day before it was filed.** The ticket calls the defect "the THR-1161 dormant-hook class". [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) resolved 2026-08-17 in an attended sitting, and Christian ruled the opposite in two respects: *"a write nothing consumes is a defect, not a class"*, and hooks are **not** passive — *"they instead spawn new game entities into the encounter system and world graph"*, on a named substrate of encounter seeds and timed attachments, *"never a new system"*. That narrows the ticket's four-candidate menu into a real decision with rules attached: the seeded-encounter route must use the ruled substrate, and any live consumer is an *acted-on* change carrying the player-visibility obligation. Left unread, a taker would have built a second firing mechanism or shipped a silent world change — trading one defect for another. Both quotes are now in the ticket's coordination block.

**2. One of THR-1183's two load-bearing reader claims is false.** The description says both named readers branch on the literal `'sublocation'`, concluding that each shape is invisible to the other's readers. `buildUnifiedEncounterStageModel.ts:113` actually reads `if (targetNode.type === 'location' || targetNode.type === 'sublocation')` — it accepts **both**. So half the "complementary halves" evidence does not hold, and if `encounterAftermath.ts:701` turns out to accept both as well, the honest outcome is the Done-when's second branch (two intended shapes, discriminator named) rather than a migration of shipped writers with live readers. The block tells the taker to check that second reader themselves rather than inherit the claim — and flags two further things found in the same pass: the kind-property may diverge too (`sublocationTypeId` verified on the strategic writer against the description's `locationSubtype`), and two test fixtures mint spellings that may be invented rather than mirrored from production.

**Ceiling did not bind.** Shelf was 8 at scan, well under `QUEUE_BACKED_UP_MIN` (15); two promotions are under `ORCH_PROMOTE_BATCH_MAX` (5). Nothing was held back — the pool held two clean candidates and both promoted.

### The shelf, honestly

`Ready for Dev` now holds **10**: THR-1180, THR-1179, THR-1181, THR-1184, THR-1183, THR-830, THR-857, THR-1173, THR-625, THR-1133.

**Three are non-`Deferral` program work** — THR-1179 (nine unbuilt card mechanics, High), THR-1180 (sphere attunement), THR-1181 (the UL entry defining it). That clears `ORCH_PROGRAM_WORK_FLOOR` (2), so T2 did not fire. The two promoted today are Deferral-labelled but are game defects rather than cleanup, so the bare label undercounts how much of this shelf is real work.

Two standing caveats, unchanged: [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) needs an attended session with a real dev server at 1920×1080 and cannot be taken overnight; and [THR-830](https://linear.app/threadbare/issue/THR-830/edge-schema-declares-trades-with-as-actoractor-but-every-shipped) is now mutexed against THR-1184, since both edit the `EDGE_SCHEMA` table.

**Delivery rate observed, not inferred:** THR-1177 went Ready for Dev → In Dev → Done in 2h55m today, and filed its two follow-ups on the way out. The pipeline the last twenty-four reports called starved is currently converting.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent, because no AFK ticket exists** — re-queried live by label this run rather than carried from run i. All six `wayfinder:research` (THR-1176, 1159, 1160, 1158, 1039, 903) and all three `wayfinder:task` (THR-986, 906, 904) are **Done**. Every open wayfinder ticket board-wide is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, wave-1 selection) and THR-1162 (`wayfinder:prototype`). Its research arm is fully closed, and today it converted: THR-1176's audit produced THR-1177, which shipped and produced the two tickets promoted above. The map is doing exactly what it was charted to do.
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 is open but assigned, so outside the frontier by rule.

Neither map's HITL frontier is repeated under `## Needs Christian` this run — both have been put to him on consecutive runs and neither has changed.

## T2 — design authoring

**Not triggered.** Three non-`Deferral` items on the shelf against `ORCH_PROGRAM_WORK_FLOOR` (2). `In Design` holds 1, at `ORCH_MAX_IN_DESIGN`, so the tier would have been bounded even had the floor been breached.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z (07:27 local), the first past `ORCH_HEALTH_SWEEP_HOUR` (6 local). **No detector was run this run and none is reported as clean.** Its standing results are unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` green except the longstanding `check:authoring-brief` staleness, and `sweep:rank-reach` **unavailable** — still explicitly not clean, merely unmeasured.

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, not reported as clean.**

**Redundancy: not assessed this sweep** — the judgement pass belongs to a due T3, and T3 was not due.

Weekly test-suite health **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check: partial, and said so.** Only the `stateHistory` fetched for this run's candidates was read — THR-1184 and THR-1183 each show a single Todo → Ready for Dev transition (0 pickups), and THR-1177 (Done 19:50Z) shows one clean pickup. Run b's board-wide pass at 05:27Z found THR-1130 highest at 2, under `ORCH_STALLED_PICKUP_THRESHOLD` (3); nothing has been claimed and released since, so that reading still holds — carried, not re-measured.

One note for the next due sweep: run b's `check:authoring-brief` staleness now has a ticket behind it, [THR-1185](https://linear.app/threadbare/issue/THR-1185/docsauthoring-briefmd-sections-de-carry-pre-nudge-pivot-vocabulary), filed 20:15Z — the brief's Sections D/E carry pre-nudge-pivot vocabulary. The standing detector warning and that ticket are the same defect, and a future sweep should stop counting it as an unowned finding.

## Escalations

None. Nothing was parked, no question was asked, and no fail-soft path fired: Linear answered every call, both writes verified on re-query, and no detector was invoked this run.
