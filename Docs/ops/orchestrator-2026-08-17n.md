---
lane: tb-orchestrator
run: 2026-08-17n
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run n, ~21:30Z)

## Needs Christian

**No new ask. One consequence you should know about the ask you already have: the build queue runs dry tonight, and your answer is what refills it.**

The two encounters are still waiting for your verdict — [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) and [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge). That question went to you two hours ago and nothing about it has changed, so it is not restated here.

What has changed is the cost of leaving it open. **A yes releases nine more encounters** — the camp seven and the sequels, the remaining 9 of 15, which is the single largest block of ready-to-build game content on the board. Right now the builder has **one** item left after the one it is working on. At the pace it has kept this evening — three finished since 19:38 — that is roughly two hours of work left, and then it stops with nothing to take.

It is not stuck for lack of things to do; it is stuck for lack of things that are *decided*. Everything else waiting is waiting on a judgement call, not on effort.

**One other thing has now been sitting two full days.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — the one that would let places and objects carry traits the way people already do — was put up for a design session on Friday evening and no session has picked it up in 48 hours. It is not blocked and nobody has objected to it; it simply needs someone to sit down and write it. Flagging the elapsed time, not re-asking.

**Nothing else needs you.** Nothing was promoted, filed or escalated this run.

## T1 — unblock sweep

**Promoted 0.** Every candidate declined on a reason re-checked live this run, not inherited.

```
[orchestrator] T1 scan: Todo 17, Ready for Dev 2 (both Deferral; 1 claimable — see below), In Dev 2 (one is a park), In Design 1
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried live — still Idea, stateHistory shows a single unbroken Idea span since 2026-08-02. Fifteenth consecutive run.
[orchestrator] T1 skip THR-1114: wrong destination — its own filing comment says "the Done-when contains a design question with no agreed outcome to test against" → T2. Body confirms: which of the twelve Spheres `plant_secret` and `nullify` become is a cosmology call.
[orchestrator] T1 skip THR-1167 (new, filed 21:13Z): wrong order — it is the residue of THR-1049, which went In Dev seven minutes after it was filed and is still in flight. Its scope is defined by how THR-1049 resolves (wire vs retire); promoting it now would queue a ticket whose contents are unknown and mutex it against live work.
[orchestrator] T1 skip THR-1052/964/1094/1095/1026/1053/1148: design forks → T2, each re-confirmed unchanged
[orchestrator] T1 skip THR-1155/1156/1002/1134/175: wrong destination — plan doc before code → T2
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 note THR-1130: In Dev + null assignee = the documented park shape. Not a T1 candidate.
```

### Last run's promotion paid, and quickly

Worth one line because it is the evidence this tier works: **THR-1032 was promoted at 19:29Z and was `Done` at 20:35Z** — 66 minutes, merged as [PR #1530](https://github.com/christianspliid-ui/threadbare/pull/1530). It had sat in `Idea` for nine days. The executor then took THR-995 and THR-1049 in sequence. Three items finished in the two hours since that promotion, which is also why the shelf is now nearly bare.

### The shelf reads 2 and is effectively 1

**This is the finding of the run, and it is not a detector result — it is a count that is honest in Linear and misleading in practice.**

`Ready for Dev` holds two items. Only one of them can be taken by the hourly unattended lane:

- **[THR-1091](https://linear.app/threadbare/issue/THR-1091/converted-reach-specific-templates-have-no-polarity-guard)** — claimable. Engine/test work, no browser dependency.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — **not claimable by this lane, by its own coordination block**: *"Requires an **attended** session; the hourly unattended lane cannot discharge it (`preview_start` is refused there)."* It has sat `Ready for Dev` since 2026-08-16T07:20Z — 38 hours, unclaimed, and correctly so.

So after THR-1049 completes, the claimable shelf is exactly one item deep.

The distortion is documented by THR-1133 itself, which was filed *to fix this very problem* — it consolidated four attended-only tickets into one precisely because `keep-work-flowing-cc` judges queue health on **count**, so unclaimable items reported `healthy` while the executor had nothing to take. The consolidation cut the error from four to one; it did not remove it. At a shelf of two, an off-by-one is the difference between "thin" and "empty".

Recorded here rather than filed as a ticket, per the process throttle — scheduled lanes log, the weekly retro promotes. It is one line of arithmetic, well under the materiality bar on its own.

## T1.5 — wayfinder sweep

**Two open maps. Zero AFK tickets exist anywhere on the board — 0 of `ORCH_WAYFINDER_AFK_MAX` (2) spent, and this run proved it rather than inferring it.**

Previous runs concluded "no AFK work" from the state-filtered scans, which only sees the states scanned. This run queried the labels directly across **all** states:

- `wayfinder:research` — 5 issues, **all 5 `Done`** (THR-1160, THR-1158, THR-1159, THR-1039, THR-903)
- `wayfinder:task` — 3 issues, **all 3 `Done`** (THR-986, THR-906, THR-904)

So the AFK budget is unspent because the work does not exist, not because it was skipped or missed. Every remaining open wayfinder ticket is HITL by label.

**[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Four of six children `Done`. Frontier is two, both HITL, both unblocked, both waiting on an artifact nobody has produced rather than on Christian: [THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) (`wayfinder:grilling`) wants a ranked seam shortlist that does not exist; [THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) (`wayfinder:prototype`) wants a throwaway built before there is anything to react to. Both are downstream of the shared-machinery write-up.

**[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** 7 of 8 children `Done`; [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`) open. Unchanged, and deliberately **not** re-surfaced — the batch-1 sample verdict already in Christian's briefing is the live form of the same conversation, and surfacing both would read as two asks where there is one.

## T2 — design staging

**Triggered for the fourteenth consecutive run, and bound.** Shelf holds **0 non-`Deferral`** items — both remaining items carry `Deferral`. Below `ORCH_PROGRAM_WORK_FLOOR` (2).

**Nothing staged.** `In Design` holds 1 — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1).

**THR-790's 48h clock has expired — re-surfaced, not re-staged.** Run m computed the expiry as 2026-08-17T20:29Z and asked this run to check rather than assume. Verified from the staging comment itself (`createdAt` 2026-08-15T20:29:28Z) and from the issue's `updatedAt`, which is still that same timestamp — so nothing has touched it in 48 hours and 58 minutes. It is surfaced under `## Needs Christian` above and the slot is **not** released; per the skill an expired item is re-surfaced, not re-staged, and not replaced.

**Candidate ranking, unchanged:** the **shared-machinery plan doc** first — it unblocks both THR-1157 frontier tickets at once — then [THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to), then THR-1134, then THR-1002 / THR-1114, then the design forks T1 has routed here: THR-964, THR-1094, THR-1095, THR-1052, THR-1053, THR-1148.

The binding constraint is **design supply plus the `In Design` bound**, not a shortage of candidates. That queue is eleven deep and has not shrunk in fourteen runs.

**Product-vs-process ratio, per Rule 0.** Of the three items the executor finished this evening, all three were process, infrastructure or deferral-class. Both items now on the shelf carry `Deferral`. **The headline finding is unchanged and sharper than last run: the feature shelf is empty, the claimable shelf is one deep, and the fix is upstream — design supply and the sample verdict, not more cleanup.** This run promoted nothing and deliberately did not go hunting for a process item to fill the gap.

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` (06:00 local) and carried the full detector pass. The Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health pass ran with it and is on `ops` as `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none is reported as clean.** Run d's standing set is carried explicitly **unverified**: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No judgement pass happened and none is claimed.

**Stalled-work check ran** — it reads `stateHistory` already fetched this run, so it costs nothing. THR-1032's history is a clean single pass (`Idea → Ready for Dev → In Dev → Done`). THR-1133 has exactly one transition and has never been claimed — 38 hours at rest is not a stall, it is an attended ticket correctly waiting for an attended session. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

**None asked, none parked.** No Discord question was needed: agreed work is not exhausted in the sense the rule means — the T2 candidate queue is eleven deep and the constraint is design *capacity*, not a shortage of blessed direction. That is not a question for Christian to answer, it is a session that needs to run.

**One observation, recorded as a technical verdict rather than escalated.** Two issues read `In Dev`, which is not a WIP breach: [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) is `In Dev` with a **null assignee** — the documented park shape, its 19:05Z comment stating plainly that nothing is in flight — while [THR-1049](https://linear.app/threadbare/issue/THR-1049/prototype-disposition-encounterscreen-castrail-casttile-effectregistration) went `In Dev` with an assignee at 21:20Z. One live claim. The park held again this run, which is worth stating each time because a silently-repopulating assignee would make a finished ticket invisible to the lane that surfaces it (THR-1058).
