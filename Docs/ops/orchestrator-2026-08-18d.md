---
lane: tb-orchestrator
run: 2026-08-18d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-18 (run d, ~07:29Z)

## Needs Christian

**Nothing new from me. The builder is working and has roughly two jobs of runway.**

The same three verdicts still gate the new-feature pipeline. Listed, not re-argued — this is the fifth run carrying them:

- [Are these two encounters worth meeting twice?](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) — the highest-value one; a yes releases the next nine.
- [Should committing a hand of nudge cards carry ~1.6 seconds of held breath?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) — yes wires it, no deletes it, either answer closes it.
- [The wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) — decides which parts of the game get the new typed-state treatment first.

## T1 — unblock sweep

**Promoted 1.** The shelf did not run dry this hour, so this run went for quality of fit rather than volume.

```
[orchestrator] T1 scan: Todo 17, Idea 78 (full pool), Ready for Dev 2 → 3, In Dev 3, In Design 1
[orchestrator] T1 promote THR-1169: blockedBy empty; zero comments (THR-990 check clean); names no plan
               doc so liveness passes trivially; premise re-verified live against origin/main —
               reward-attachment-catalog.ts:1648 carries the "Effect Primitive Exercisers" marker and
               all six named T3/T4 artifacts sit inside that block (Null Circlet :1800, Fatesight Lens
               :1844, The Sweating Vessel :2049, Bag of Conveyance :2155, The Trembling Needle :2179,
               The Anvilbone :2200), with item-stat-bands.ts and its contract test both present.
               Verified via get_issue: "Ready for Dev", assignee key absent. Block posted, carrying a
               LIVE mutex against THR-745.
[orchestrator] T1 skip THR-876: body states "worth confirming with Christian before running the batch"
               — it spends image-generation credits. An unattended lane spending credits unprompted on
               a Low-priority deferral is not a call this lane makes. Not surfaced to Christian either:
               it is Low, blocks nothing, and a fourth ask would dilute the three that matter.
[orchestrator] T1 skip THR-854: body states the fix "is a design question, not a mechanical one" and
               lists three candidate answers that each change the heraldic vocabulary → T2
[orchestrator] T1 skip THR-829: body states "Fix options (pick one at design time)" — three options with
               different blast radius, plus a browser-evidence Done-when → T2
[orchestrator] T1 skip THR-742: body is an Idea note carrying its own "Design questions for the eventual
               ticket" — not yet an executable ticket → T2
[orchestrator] T1 skip THR-716/THR-1088: standing resolved-on-main verdicts, runs c and l. Unchanged.
[orchestrator] T1 skip THR-965/831/662/857/1155/1134/1002/1114/1052/964/1094/1095/1026/1053/1148:
               wrong destination, each names a design fork or plan-doc-before-code in its own body → T2
               (carried from run c, not re-derived)
[orchestrator] T1 skip THR-1156/789: program epics, containers not claimable
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 still Idea. 21st run.
[orchestrator] T1 skip THR-175/870: explicit deferral triggers unmet
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 skip THR-1043/791/877: carry an assignee — not queue candidates
```

### The one promotion, and why it carries a live mutex

[THR-1169](https://linear.app/threadbare/issue/THR-1169/stat-contribution-migration-the-effect-primitive-exerciser-block-and) was filed by the executor at 07:12Z as it worked THR-745, seventeen minutes before this scan — a fresh, fully-specified deferral naming its own predicate, its own fixed calibration, its own contract test, and its own evidence shape (CLI/headless, no browser owed). That is the best-shaped ticket the board has produced this week, and it needed no design call to become claimable.

It does, however, edit the same two catalog files as **THR-745, which was still `In Dev` and unmerged at promotion time**. So the block carries that mutex with its reason stated inline, and says plainly that the reason lapses the moment THR-745 merges. The executor should take THR-830 if it arrives before that merge. This is the mutex mechanism working as designed, not a promotion made in spite of a conflict — but it is honest to record that **claimable-right-now is 1, not 2**, until THR-745 lands.

### Why one and not more

`ORCH_PROMOTE_BATCH_MAX` (5) did not bind and the shelf is not backed up, so the ceiling was not the constraint. Four fresh candidates were opened this run and all four declined on their own words: one owes Christian a cost confirmation, three name design forks the executor may not settle. The pool's supply of *executable* work is genuinely thin, and manufacturing a fifth promotion out of a design ticket would hand the executor a bounce, not a job.

THR-1169 is content repair, not process work, so the process budget is untouched and Rule 0 does not apply.

### The shelf, honestly

`Ready for Dev` holds **3**: THR-830 (claimable now), THR-1169 (claimable once THR-745 merges), and [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), which its own block rules out for the unattended lane. **Claimable now = 1; claimable within the hour = 2.**

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Re-queried live by label rather than carried from run c: every `wayfinder:research` (THR-1160, 1158, 1159, 1039, 903) and every `wayfinder:task` (THR-986, 906, 904) issue board-wide is `Done`. Every open wayfinder ticket is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the map-closing sitting) and THR-1162 (`wayfinder:prototype`).
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 open but assigned, so outside the frontier by rule.

## T2 — design staging

**Triggered for the twentieth consecutive run, and bound again.** Non-`Deferral` items in Ready for Dev: **0** — below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's promotion did not move that number: THR-1169 carries `Deferral`, so it lifts the claimable shelf without lifting the program-work count.

**Nothing staged.** `In Design` holds 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — exactly `ORCH_MAX_IN_DESIGN` (1), now **~59 hours past staging** (`updatedAt` unmoved since 2026-08-15T20:29:32Z). Re-surfaced in the record, not re-staged, and deliberately not repeated under `## Needs Christian` — it has been put to him six runs running and is not among the things that would move today.

The T2 candidate queue grew by three more this run, all declined out of T1 with their reasons: THR-854, THR-829, THR-742. The binding constraint remains design supply plus the `In Design` bound, never candidate shortage.

**Product-vs-process ratio:** not re-measured. Run p's trailing-7-day figure (~2:1 product-favouring) stands; nothing completed in the last hour would move it, and re-deriving a week-wide window hourly is noise.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z, the first past `ORCH_HEALTH_SWEEP_HOUR` (6 local), and its results stand unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` sub-checks green except the longstanding `check:authoring-brief` staleness, one orphaned four-component cluster (`SceneStatePanel` + 3 siblings), and `sweep:rank-reach` **unavailable** and explicitly not reported as clean.

**No detector was run this run, and none is reported as clean.** `newFindings: 0` in the frontmatter means this run surfaced no new finding of its own — it is not a detector verdict.

**Redundancy: not assessed this sweep** — the judgement pass belongs to T3, and T3 did not run.

Weekly test-suite health is **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check ran** off the `stateHistory` already fetched: THR-1169 shows a single Idea→Ready-for-Dev transition, so 0 pickups. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

**No Discord question posted, and the trigger was checked rather than skipped.** Run c set the condition: ping if run d or e finds the claimable shelf at zero *and* no verdict movement. It was not at zero — THR-830 was on it throughout, and this run added a second behind a mutex that should lapse within the hour. The condition is unmet for the third hour running, and a ping now would be a sixth copy of three asks already on their tickets, in four run reports, and in the hourly briefing.

**The supply pattern is worth watching, and is not yet an escalation.** Three consecutive runs have each found roughly one genuinely executable ticket in a pool of ~95. That is not a shortage of tickets; it is a shortage of tickets that do not first require a design verdict. The three open asks are the head of that queue, which is why they keep being the answer. If a run finds the pool exhausted of executable work entirely — zero promotable, shelf at zero — that is the point at which it becomes a supply problem to put to Christian in those terms, rather than a fourth restatement of the same three questions.

Nothing parked. No detector failed this run because none was due. No verify-after-write mismatch: the single write was re-queried via `get_issue` and held, with the assignee key absent.
