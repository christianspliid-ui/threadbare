---
lane: tb-orchestrator
run: 2026-08-18b
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-18 (run b, ~05:27Z)

## Needs Christian

**The builder has something to do again — but the thing that refills the shelf properly is still the three verdicts you were asked for overnight.**

Three hours ago you were told everything was waiting on you. That was true of the *feature* pipeline and is still true. It was not quite true of the board: there was a shelf of already-agreed repair work nobody had looked at, and this run found it and put one job back in front of the builder (a rival-detection ladder that currently jumps from "nobody notices" to "rivals move against you" in a single step, with no middle). So the next hour is not wasted. That is a patch on the symptom, not the cure.

The cure is unchanged, and one of the three is worth far more than the other two:

**Are these two encounters worth meeting twice?** ([the ask, with play links](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to))

- The Grateful Kin — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)
- The Unsafe Bridge — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

A yes releases the next nine encounters — days of building. A no tells the builder what the bar is still missing.

The other two are still open and unchanged, so they are listed rather than re-argued: the [1.6-second held breath before a nudge outcome lands](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) (yes wires it, no deletes it — either answer closes it), and the [wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) that decides which parts of the game get the new typed-state treatment first.

## T1 — unblock sweep

**Promoted 1** — [THR-963](https://linear.app/threadbare/issue/THR-963/detection-pressure-is-fed-essence-costs-123-on-a-0-1-clamped-scale-so), onto a claimable shelf that had been at zero since 00:02Z.

```
[orchestrator] T1 scan: Todo 17, Ready for Dev 1 → 2, In Dev 2 (both parked), In Design 1, Idea 30+ (paginated)
[orchestrator] T1 promote THR-963: blockedBy empty; zero comments so no standing retire verdict (THR-990 check);
               no plan doc named so the liveness gate passes trivially; defect re-verified live against main
               tip 921ce9b2 at src/engine/encounters/detectionPressure.ts:24-26. Verified via get_issue:
               status "Ready for Dev", assignee key absent. Coordination block posted.
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried live — still Idea. 19th run.
[orchestrator] T1 skip THR-1155/1134/1002/1114: wrong destination — each says plan-doc-before-code in its own body → T2
[orchestrator] T1 skip THR-1052/964/1094/1095/1026/1053/1148: design forks → T2, carried from run o's live check
[orchestrator] T1 skip THR-1156/789: program epics, containers not claimable
[orchestrator] T1 skip THR-1088: standing verdict "already resolved on main — do not promote", run l, unchanged
[orchestrator] T1 skip THR-175/870: explicit deferral triggers unmet
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 skip THR-1043/791: carry an assignee — not queue candidates
[orchestrator] T1 note THR-1130/1168: In Dev + assignee key absent on get_issue = the sanctioned park shape, both holding
```

### The finding behind the promotion — this lane has been scanning past its own backlog

The last eighteen runs reported, correctly by their own method, that nothing was promotable. The method was wrong. T1's scan is prescribed as two state-filtered calls, `Todo` and `Ready for Dev`, but the judging step is written to consider **`Todo` / `Idea`** candidates — so `Idea` is never fetched by the prescribed scan. Runs papered over that with an ad-hoc filter, visible in the scan lines: run j read "Idea (recent) 4", run p "Idea (last 24h) 1 new", run a this morning "Idea (updated ≤2d) 2".

That filter catches deferrals filed by last night's closeouts, which is why the lane has looked healthy. It cannot see anything filed before the window. THR-963 was filed 2026-08-02 and has sat unread for sixteen days: no blocker, no assignee, no verdict, no plan doc, Medium priority, in an active project. It was never assessed and declined — it was never looked at. Run o's scan line ("Idea 50+ (paginated)") is the only recent run that saw the true depth, and it enumerated only the seven known design forks.

So "everything is waiting on Christian" was a conclusion drawn from a partial scan. The three verdicts genuinely do gate the *feature* pipeline; they do not gate the repair backlog, and the two were being reported as one thing.

**Deliberately not fixed by fiat this run.** Rewriting the tier's scan contract is a change to the skill, not a promotion, and this lane does not get to quietly redefine its own remit mid-run. What it can do is promote correctly *now* and hand the next run a scan that starts from the true pool. Logged for the weekly retro rather than filed as a ticket, per the process-work throttle.

### Why THR-963 and not one of the others

It is product, not process: a rival-detection ladder with three authored bands — "rivals are starting to notice" → "rivals turn" → "rivals move against you" — that is unreachable by construction, because the delta is priced in essence-cost units (1/2/3) and written into a scale clamped to 0–1. The smallest possible choice already clears two bands. Engine-only, so the unattended lane can discharge it without a browser; the Done-when is a unit test pinning the ladder.

Two things settled in the coordination block so the executor does not bounce it: the body's "needs a decision" line is **calibration, and therefore the agent's call** under the standing delegation rule, not a Christian fork; and scope excludes THR-964 (the missing producer), which is its own ticket.

**One promotion, not five.** `ORCH_PROMOTE_BATCH_MAX` (5) did not bind and the shelf is not backed up, so the ceiling was not the constraint — judgement was. The remaining unscanned pool is mostly process-class or needs art generation the unattended lane cannot run; draining it to look busy is the failure this lane is built to avoid. The next run should work the pool properly rather than treat it as drained.

### The shelf, honestly

`Ready for Dev` now holds 2: THR-963 (claimable) and [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), which its own coordination block rules out for the unattended lane (`preview_start` is refused there — an approval gate, not a fault). So **claimable = 1**, up from 0. Both In Dev entries are parks holding questions, not work in flight.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Every `wayfinder:research` and `wayfinder:task` issue board-wide is Done; every open wayfinder ticket is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Four of six children Done. Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the map-closing sitting) and THR-1162 (`wayfinder:prototype`, downstream of it in practice). Carried from run a's live relation check; not re-queried this run, and recorded as carried rather than re-verified.
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Seven of eight children Done; THR-907 open but assigned, so outside the frontier by rule.

## T2 — design staging

**Triggered for the eighteenth consecutive run, and bound again.** Non-`Deferral` items in Ready for Dev: **0** — below `ORCH_PROGRAM_WORK_FLOOR` (2). Note the promotion did not move this number: THR-963 carries the `Deferral` label, so it lifts the *claimable* shelf without lifting the *program-work* count. Both readings are true and they measure different things.

**Nothing staged.** `In Design` holds 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). It is now **~57 hours past staging** (staging comment 2026-08-15T20:29:28Z, `updatedAt` unmoved since). Re-surfaced in the record, not re-staged, and the slot is not released — reinterpreting the bound to unblock myself is the get-busy failure. Deliberately not repeated under `## Needs Christian`: it has been put to him four runs running and is not one of the things that would move today.

Candidate ranking unchanged and not restated. The binding constraint is design supply plus the `In Design` bound, not candidate shortage.

**Product-vs-process ratio:** not re-measured. Run p's trailing-7-day figure (~2:1 product-favouring) stands; nothing completed since would move it, and re-deriving a week-wide window hourly is noise.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 07:27 local). Diffed against the last full sweep, 2026-08-17 run d.

| Detector | Result | vs. 2026-08-17 run d |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED** — `attachment-activated-effects`, `attachment-edge-modifiers`, `authored-nudge-hand-reaches-resolution`, `branch-decision-writes-archetype-drift`, `compulsion-card-plants-agent-decision-bias`, `nudge-card-cost-channels-detection-and-doom`, `trait-ref-authoring-vocabulary`. 81 contracts total: 48 LIVE, 13 UNVERIFIED-OK, 7 LEAKED | No change — same 7 |
| `check:process` sub-checks | `check:design-wiki` OK (24 pages); `check:wiki-freshness` OK (24 pages, no stale); `generate-systems-inventory:check`, `generate-setting-coverage:check`, `rebuild-plans-index:check` all up to date. `check:authoring-brief` **stale** vs `Docs/plans/2026-04-16-systemic-wiring-guide.md` | No change (authoring-brief staleness longstanding and known) |
| `check:canon-staleness` | **21 warnings** | No change — same count |
| `sweep:rank-reach` | **UNAVAILABLE this sweep** — produced only its header in ~18 minutes and was stopped. **Not reported as clean**; rank/reach coverage is unmeasured today | Regression in the *detector*, not a known finding about the code |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, not reported as clean.**

### New finding (1): a four-component orphaned cluster left behind by last night's cleanups

`src/components/Game/Encounter/SceneStatePanel.tsx` now has **zero production importers** — its only consumer is its own test. And it is the sole importer of three siblings, so the whole subtree is unreachable:

| Module | Production importers |
|---|---|
| `SceneStatePanel.tsx` | none (test only) |
| `ThreadStrip.tsx` | `SceneStatePanel.tsx` only |
| `DetectionThread.tsx` | `SceneStatePanel.tsx` only |
| `DriftIndicator.tsx` | `SceneStatePanel.tsx` only |

Plus `__tests__/SceneStatePanel.test.tsx` and its snapshot, which mount the cluster and therefore pass regardless.

This is **new as of last night**: THR-1049 (`3fa9d975`) and THR-1167 (`978697f6`) deleted the prototype tree around it, and this root went with the consumers rather than with the deletions. It survived because run d classified it as a *redundancy* finding (an encounter-state duplicate) rather than as *displaced residue* — the two disposition classes THR-1167 forked on — so the cleanup ticket never had it in scope.

Checked against the three standing dead-code traps: the grep is on import paths, not the bare string; `ProseTtsButton.tsx` in the same directory **is** live (imported by `EncounterVeil.tsx`), which is the control proving the method discriminates; and no barrel file re-exports the cluster. The `DetailPage/` sibling is also orphaned but is **already tracked as THR-966** — not double-filed here.

**Logged, not filed.** Per Christian's 2026-08-10 process-work throttle, scheduled lanes do not file process/infrastructure tickets; the weekly retro is the single promotion point. This is the T3 guardrail's "prune candidate with import-graph evidence attached", parked in the log for that retro. **Nothing was deleted** — this duty never deletes, and the executor re-verifies before any removal.

### Redundancy pass

**Assessed, partially.** The three standing findings from run d were re-verified live and all still hold: the `SceneStatePanel` encounter-state duplicate (now reclassified above — it is dead, not merely redundant), the `*IconGlyph` parallel representation path (still exactly four live sites: `AgentDetailPanel`, `AgentInfoCard`, `BondsTab`, `OverviewTab`), and the `composition-dsl` validation sub-island (five production importers outside its own tree). A delta check over last night's merges confirmed they removed duplication rather than adding any.

What did **not** happen is a full fresh read of `Docs/canon/interface-map.md` and `Docs/canon/systems-inventory.md` end to end. So: standing set verified plus a delta pass, not a complete judgement sweep. Recording the distinction rather than implying the stronger one.

### Stalled-work check

**Ran** — off `stateHistory` already fetched. THR-1130 has **2** `Ready for Dev → In Dev` transitions, the highest on the board and still under `ORCH_STALLED_PICKUP_THRESHOLD` (3); both ended in real work, and the second followed a deliberate re-park. THR-1168 has 1. THR-963 has 0 (promoted this run). Nothing at or over the threshold.

### Weekly test-suite health

**Not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`. Nothing about suite health is asserted here.

## Escalations

**No Discord question posted, and the trigger for one was explicitly checked.** Run a committed to pinging if this run found "the shelf still at zero **and** no movement". The shelf is no longer at zero — this run put a claimable item on it — so the condition it set is not met. A ping now would be a fourth copy of three asks already on tickets, in run a's report, and in the hourly briefing, which is what trains a reader to stop reading. If the next run finds the shelf drained again with no verdict movement, that is the moment.

**One detector regression parked:** `sweep:rank-reach` did not complete. Not investigated this run — diagnosing a detector is not this tier's job and doing it would have displaced the sweep itself. If it fails again on tomorrow's sweep, that is a pattern worth a line in the retro rather than a one-off.

Nothing else parked. No verify-after-write mismatch: the single write was re-queried and held.
