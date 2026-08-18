---
lane: tb-orchestrator
run: 2026-08-18e
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-08-18 (run e, ~08:30Z)

## Needs Christian

**Nothing new needs you this hour.** The three verdicts you already have in front of you are still the head of the queue, and they are already in the briefing — putting them to you a seventh time would not make them arrive sooner. One item found a way to move without you, and it has moved.

There is one thing worth knowing rather than doing: some art regeneration work ([THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five Meet-The-First scene images that have text or faces painted into them, which the art doctrine forbids) is ready to run but spends image-generation credits. Nothing is broken today; substitutes are already covering those slots. It is being held rather than queued, because an unattended builder should not spend credits on a cosmetic fix without you saying so. Say the word whenever you want it run — there is no cost to leaving it.

## T1 — unblock sweep

**Promoted 1.** Scanned Todo (17) and Idea (60, paged), both state-filtered; Ready for Dev (2) read for shelf depth, not as candidates.

```
[orchestrator] T1 promote THR-1052: sole gate was "Mutex with: THR-929"; THR-929 Done
               2026-08-10T06:31:16Z (PRs #1379, #1380 merged) → mutex reason verifiably
               inapplicable. blockedBy empty on live relation query; zero comments so no
               retire verdict to weigh (THR-990); names no plan doc so liveness passes
               trivially. Write re-queried via get_issue: state held, assignee key absent.
               Coordination block posted. (program: Encounter Experience)
```

**On the mutex reversal.** THR-688 rule B permits an executor to reverse a mutex only when the stated reason is verifiably inapplicable, recorded in a comment. That test is met here in the strongest form available: the reason was a file collision with THR-929, and THR-929 is not merely quiet but **finished and merged**. The reversal and its evidence are in the promotion comment on the ticket, not only in this report.

**Scope steer attached rather than left to the executor.** THR-1052 offers two fixes — repoint dead `imageTag`s at existing library rows (free), or generate ~27 new art rows (billed). Its Done-when is satisfied by either. The promotion comment authorises the repoint half only and tells the executor to record unmatched concepts as art candidates instead of generating them. Same reasoning as the THR-876 hold below: a credit spend is Christian's call, and a promotion should not launder one.

**Declines — six assessed fresh this run, each naming its evidence:**

```
[orchestrator] T1 skip THR-1026: wrong destination — body states the faction question "is a
               design question the ticket did not ask and an executor should not answer
               alone"; Done-when #1 is "a decision is recorded ... in game terms". → T2.
[orchestrator] T1 skip THR-1094: wrong destination — "The question, which is a design call
               and not an executor's"; choice is route condition.* as a tooltip class vs.
               rule conditions permanently plain prose. → T2.
[orchestrator] T1 skip THR-1095: wrong destination — "pick one in design, do not let an
               executor guess"; three candidate shapes, game-wide tab-order blast radius.
[orchestrator] T1 skip THR-977: wrong destination — "this needs a design call, not a fix";
               four options on what DerivedFactorLine.delta should hold.
[orchestrator] T1 skip THR-964: wrong destination — "a design call rather than a patch":
               wire the pendingChoiceCommits producer, or retire the pipeline. See T3.
[orchestrator] T1 hold THR-876: executable and unblocked, but its own body says "this ticket
               spends image-generation credits ... worth confirming with Christian before
               running the batch". Held, not declined — a queued ticket whose first step is
               an unbudgeted spend is a trap for an unattended executor.
```

Standing declines from earlier runs re-confirmed by state, not re-derived: THR-1088 (resolved on main), THR-1024 (prose gate on THR-966, still Idea — nineteenth consecutive run), THR-1155 / THR-1134 / THR-1002 (each says plan-doc-before-code in its own body), THR-1114, THR-1148, THR-1156 / THR-789 (program epics, containers not claims), THR-175 / THR-870 (deferral triggers unmet), THR-1043 / THR-791 (carry an assignee, so not queue candidates), THR-902 / 907 / 1157 / 1162 / 1163 (`wayfinder:*` → T1.5, never Ready for Dev).

**Ceiling did not bind.** Shelf was 2, well under `QUEUE_BACKED_UP_MIN` (15), and one promotion is under `ORCH_PROMOTE_BATCH_MAX` (5). Nothing was held back by a cap; the single promotion is what the pool actually yielded.

**Shelf after this run: 3 claimable** — [THR-830](https://linear.app/threadbare/issue/THR-830/edge-schema-declares-trades-with-as-actoractor-but-every-shipped), [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), and THR-1052. Worth stating plainly: **one of those three is not takeable by the overnight lane.** THR-1133 needs an attended session with a dev server and a real 1920×1080 viewport. So the unattended executor's real shelf is two.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Re-queried live by label this run rather than carried: all five `wayfinder:research` (THR-1160, 1158, 1159, 1039, 903) and all three `wayfinder:task` (THR-986, 906, 904) are **Done**. Every open wayfinder ticket board-wide is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the map-closing sitting) and THR-1162 (`wayfinder:prototype`).
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 open but assigned, so outside the frontier by rule.

## T2 — design staging

**Triggered for the twenty-first consecutive run, and bound again.** Non-`Deferral` items in Ready for Dev: **0** — below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's promotion did not move that number either: THR-1052 carries `Deferral`, so it lifts the claimable shelf without lifting the program-work count. All three shelf items are deferrals.

**Nothing staged.** `In Design` holds exactly 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is `ORCH_MAX_IN_DESIGN` (1). It is now **~60 hours past staging** (`updatedAt` unmoved since 2026-08-15T20:29:32Z). Re-surfaced in the record, not re-staged, and the slot is not released — reinterpreting the bound to unblock myself is the get-busy failure this lane exists to avoid.

The T2 candidate queue grew by five this run, all declined out of T1 above with their reasons: THR-1026, THR-1094, THR-1095, THR-977, THR-964. **THR-964 is the one worth ranking first** when the `In Design` slot frees — not on its own priority (Medium), but because T3 below shows it silently owns the disposition of a four-component UI cluster as well as four dead constant families. Two findings, one verdict.

**Product-vs-process ratio:** not re-measured. Run p's trailing-7-day figure (~2:1 product-favouring) stands; nothing completed in the last hour would move it, and re-deriving a week-wide window hourly is noise.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z, the first past `ORCH_HEALTH_SWEEP_HOUR` (6 local). **No detector was run this run and none is reported as clean.** Its standing results are unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` green except the longstanding `check:authoring-brief` staleness, and `sweep:rank-reach` **unavailable** — still explicitly not clean, merely unmeasured.

**Redundancy: not assessed this sweep** — the judgement pass belongs to a due T3, and T3 was not due.

Weekly test-suite health **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check ran** off the `stateHistory` already fetched: THR-1052 shows a single Idea → Ready-for-Dev transition, so 0 pickups. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

### Correction (1): run b's "new finding" is neither new nor unowned

Run b reported the four-component `SceneStatePanel` cluster as a **new** orphan created last night by THR-1049 / THR-1167, surviving because run d had misclassified it as redundancy rather than displaced residue. Checked against the record this run, that attribution does not hold, and the correction matters because it changes what should happen next.

The cluster has been evidenced as zero-importer since **2026-08-01** under [THR-951](https://linear.app/threadbare/issue/THR-951/prune-candidate-the-scenestatepanel-encounter-ui-cluster-4-components), which was **canceled 2026-08-11** and consolidated — at Christian's direction, one batched sweep instead of seven queue slots — into [THR-1089](https://linear.app/threadbare/issue/THR-1089/dead-code-prune-sweep-re-verify-and-delete-the-unreachable-modules). THR-1089 ran on **2026-08-15** (PR [#1467](https://github.com/christianspliid-ui/threadbare/pull/1467), commit `4aa2163a`), re-verified every candidate against the live import graph as its predicate required, deleted eleven modules — and **spared this cluster deliberately**, quoting its reason:

> The SceneStatePanel cluster is unwired, not retired (THR-951 Done-when #3). Its retire-or-wire call is owned by THR-964, still at Idea, which governs the `pendingChoiceCommits` pipeline whose `DETECTION_THRESHOLD_*` and `CHOICE_DRIFT_MAGNITUDE_*` constants DetectionThread and DriftIndicator render.

Verified against `origin/main`: all four components plus the test and its snapshot are present, exactly as spared.

So three things are true that run b's framing obscured. The orphan is **three weeks old, not one night**. It is **already owned** — by THR-964, named in the sweep commit. And it was spared **on a recorded judgement**, not missed — the very "unwired, not retired" outcome THR-951's Done-when #3 declared valid. Last night's deletions did not create it.

**Consequence:** no new ticket is warranted, and per the process-work throttle this lane would not file one regardless — a scheduled lane logs and the weekly retro promotes. The actionable item is that THR-964 is load-bearing for more than its own title suggests: settling *wire or retire* on `pendingChoiceCommits` also disposes of four components, a test, a snapshot, and four constant families. That is why it is ranked first in T2 above.

**Worth watching, not yet a finding.** This is the second time in two days a T3 pass has surfaced this cluster as though fresh (run d as redundancy, run b as displaced residue). The common cause is that neither pass consulted the canceled-and-consolidated tickets, where the evidence and the disposition both live. A canceled ticket is not a closed question here — the consolidation pattern deliberately moves the answer elsewhere and cancels the original. If a third pass rediscovers it, that is a repeatable defect in how T3 diffs findings and belongs in the retro with the accumulated cost quoted.

## Escalations

**No Discord question posted, and the trigger was checked rather than skipped.** Run c set the condition and run d restated it: ping when a run finds the pool exhausted of executable work entirely — zero promotable **and** shelf at zero. Neither half is met. One ticket promoted, shelf at three. The condition is unmet for the fourth hour running.

**The supply reading is unchanged and still short of an escalation, but the margin is thinner than the promotion count suggests.** This run assessed six candidates fresh and exactly one was executable — a Low-priority deferral. The other five each said, in their own body, that they need a design verdict first. That is not a shortage of tickets; it is a backlog whose executable layer has been drained while its design layer waits on one bound `In Design` slot and three standing verdicts. The counts to watch next run: non-`Deferral` Ready for Dev is **0** for the twenty-first consecutive run, and the unattended-takeable shelf is **2**, not 3.

Nothing parked. No detector failed this run because none was due. No verify-after-write mismatch: the single write was re-queried via `get_issue` and held, with the assignee key absent on the re-query rather than on the mutation echo.
