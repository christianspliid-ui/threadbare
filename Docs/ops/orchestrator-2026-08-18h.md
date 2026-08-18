---
lane: tb-orchestrator
run: 2026-08-18h
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-08-18 (run h, ~14:30Z)

## Needs Christian

**Nothing new this hour.** The one question already in front of you — whether to spend image-generation credits on the missing nudge-card plates ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)) — is unchanged. Repeating it hourly would not make it arrive sooner.

The builder is working and the queue behind it grew this hour: it finished one job, filed two fresh defects it found on the way, and this run added a third piece of work. Nothing is waiting on you to move.

## T1 — unblock sweep

**Promoted 1.** Scanned Todo (18) and Idea (60, paged) as candidate pools; Ready for Dev (6) read for shelf depth, not as candidates.

```
[orchestrator] T1 scan: Todo 18, Idea 60 (paged), Ready for Dev 6, In Dev 3, In Design 1
[orchestrator] T1 promote THR-857: blockedBy empty on live relation query, no prose gate, no
               time gate, names no plan doc so liveness passes trivially. Zero prior comments,
               so no retire or supersede verdict to weigh (THR-990). Premise re-verified against
               the tree, not trusted: all five off-union sites present as described, and the
               PossessionSubcategory union is 7 members. Verified via get_issue: "Ready for Dev",
               assignee key absent. Block posted. Mutex: none. (program: UI Visual Overhaul)
[orchestrator] T1 decline THR-1088: standing verdict on the ticket dated 2026-08-17T18:32Z —
               "Already resolved on main — do not promote this." Closure candidate, not queue work.
[orchestrator] T1 decline THR-1114: body states "this is a content call, not an executor one …
               no agreed outcome to test against" → T2's input, not T1's.
[orchestrator] T1 skip THR-1157/1163/1162/902/907: wayfinder:* label — never enter Ready for Dev.
[orchestrator] T1 skip THR-1043/791/877: assigned; promoting an assigned issue hides it from
               pull-work's assignee:null candidate query.
```

**The one promotion, and the check that made it promotable.** [THR-857](https://linear.app/threadbare/issue/THR-857/possession-subcategory-vocabulary-has-3-off-union-strays-intelligence) reports five content sites writing a `subcategory` value outside the declared `PossessionSubcategory` union. Its description frames two branches and recommends neither, which is usually the shape that routes to design rather than the queue. It is promotable anyway, because only one branch is an execution pass: rewriting the five sites to canonical values is the reading the *already shipped* `SUBCATEGORY_ART_ALIASES` table encodes (`talisman`/`charm` → `relics_talismans`, `intelligence` → `tomes_scrolls`), so it applies a recorded decision rather than making a new one. The other branch — promoting `intelligence` to a canonical eighth subcategory — expands the possession vocabulary and belongs in a `UL-proposal`, which the coordination block says explicitly so the taker does not quietly widen scope into it.

**One check run for the taker rather than left to be discovered after merge.** The description says to check the `slotTag` interaction before rewriting. Run, and the answer is not "no change": none of the five entries carries an explicit `slotTag`, so `resolveSlotTag` falls through, misses `SUBCATEGORY_TO_SLOT_TAG`, and the items sit in `'uncategorized'` today. Rewriting the field moves all five into **capped** slots (`tome` cap 2, `ring` cap 2), so an agent holding two tomes plus a Shrine Map can now overflow where today it could not. That reads as the fix rather than a regression, but it is a behavioural change to pin in a test and state in the PR body. Roughly two minutes of grep spent here saves the taker rediscovering it mid-implementation, or worse, not at all.

**The THR-990 comment check earned itself again this run.** [THR-1088](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) (Law 13, raw percentages on the legacy intervention row) passes every structural test: no blockers, no gate, Low priority, a clean three-part Done-when. It is also **already fixed on `main`** — yesterday's run l verified that at `af7ac9d3` and wrote the finding onto the ticket, including that Done-when 3's test already exists in `encounterVeilChoiceLaws.test.tsx`. Reading the latest comment before promoting is the only step in T1 that would have caught it; the `Blocked by` half says nothing. Cost of the check: one call. Cost of skipping it: a top-of-queue slot spent on work that does not exist.

**THR-1088 needs closing, and this lane may not close it.** It is not wayfinder-labelled, so the terminal-state carve-out does not reach it, and it will keep surfacing as a structurally-clean candidate on every future sweep until someone closes it against `20bd16ab` / THR-1121. Flagged here for whoever next touches that area — not filed as a ticket, per the process-work throttle.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Re-queried live by label this run rather than carried from run g: all five `wayfinder:research` (THR-1159, 1160, 1158, 1039, 903) and all three `wayfinder:task` (THR-986, 906, 904) are **Done**. Every open wayfinder ticket board-wide is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the map-closing sitting) and THR-1162 (`wayfinder:prototype`). Its research arm is now complete end to end — THR-1159, the last of the three, closed at 11:52Z.
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 is open but assigned, so outside the frontier by rule.

Neither map's HITL frontier is repeated under `## Needs Christian` this run — both have been put to him on consecutive runs, and neither is what would move today.

## T2 — design staging

**Triggered for the twenty-fourth consecutive run, and bound again.** Non-`Deferral` items in Ready for Dev: **0** — below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's promotion did not move that number either: THR-857 carries `Deferral`, so it lifts the *claimable* shelf without lifting the *program-work* count. All six shelf items are deferrals.

**Nothing staged.** `In Design` holds exactly 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is `ORCH_MAX_IN_DESIGN` (1). It is now **~66 hours past staging** (`updatedAt` unmoved since 2026-08-15T20:29:32Z). Re-surfaced in the record, not re-staged, and the slot is not released — reinterpreting the bound to unblock myself is the get-busy failure this lane exists to avoid.

The T2 candidate queue grew by one this run: **THR-1114** (two action templates carrying a `sphereAffinity` outside the twelve Spheres), declined out of T1 above on its own body's verdict that choosing the replacement Sphere changes what the action means cosmologically. [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice-commit) remains the one to rank first when the slot frees, for the reason run e established: it silently owns the disposition of a four-component UI cluster, a test, a snapshot and four constant families as well as its own title.

**Product-vs-process ratio:** not re-measured. Run p's trailing-7-day figure (~2:1 product-favouring) stands, and re-deriving a week-wide window hourly is noise. Direction of travel is right — this run's promotion is content.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z (07:27 local), the first past `ORCH_HEALTH_SWEEP_HOUR` (6 local). **No detector was run this run and none is reported as clean.** Its standing results are unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` green except the longstanding `check:authoring-brief` staleness, and `sweep:rank-reach` **unavailable** — still explicitly not clean, merely unmeasured.

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, not reported as clean.**

**Redundancy: not assessed this sweep** — the judgement pass belongs to a due T3, and T3 was not due.

Weekly test-suite health **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check: partial, and said so.** Only the `stateHistory` already fetched for this run's candidates was read — THR-857 shows a single Idea → Ready for Dev transition (0 pickups), and THR-745 (Done 07:29Z) shows one clean pickup. Run b's board-wide pass at 05:27Z found THR-1130 highest at 2, under `ORCH_STALLED_PICKUP_THRESHOLD` (3); THR-1130 has been In Dev since then without a further release, so that reading still holds — carried, not re-measured.

## Escalations

None. Nothing was parked and no question was asked — the pool yielded genuine work, so the agreed-work-exhausted branch did not fire. The shelf doubled this hour (3 → 6) without any promotion pressure from this lane: two of the three additions were filed by the executor from defects found while working THR-733. Supply is healthy at the *claimable* layer and still zero at the program layer, which is the same shape as the last twenty-three runs and is a design-supply question, not a candidate shortage.

No verify-after-write mismatch: the single write was re-queried via `get_issue` and held, with the assignee key absent on the re-query rather than on the mutation echo.
