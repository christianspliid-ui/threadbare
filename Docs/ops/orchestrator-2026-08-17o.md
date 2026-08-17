---
lane: tb-orchestrator
run: 2026-08-17o
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run o, ~22:31Z)

## Needs Christian

**The build queue ran dry tonight, exactly as last run said it would. I found one more job to keep it moving for an hour or so. After that it stops until a design session runs.**

At 22:25 the builder finished the last thing it could take. Two minutes later this run started and found an empty shelf. I promoted one small cleanup job — deleting six encounter-screen components that nothing on screen uses any more — which buys roughly an hour. That is a stopgap, not a fix.

**Nothing new is being asked of you.** The encounter verdict from earlier this evening is still the one outstanding question and it has not changed, so it is not restated here — [the two encounters are still waiting](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).

**What has changed is that I can now name the single most valuable session you could sit down to**, and it is not the encounter one:

> **[The wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)** — picking which parts of the game get rebuilt on the new typed foundation first, and in what order.

Two reasons it is the one:

1. **You already ranked it top.** Yesterday, about this architecture work: *"lets get it sorted. higest priority. new features can wait as they will just be implemented badly due to these issues."* Everything else on the board is the new features you said could wait.
2. **Everything it needed is now finished.** Three background investigations fed into it and all three are done — what machinery already exists, where the game's weak seams actually are, and what the chip rebuild cost in practice. The last one landed this afternoon. Last night's report said this sitting was "waiting on a shortlist nobody has produced"; **that is no longer true, and I am correcting it rather than repeating it.** The seam investigation produced a candidate shortlist of five — the hunger vocabulary, the chips already done, region identity, mandate prose, and follow-on tags. What is missing is not the homework. It is you and a session, in a chat, ranking those five.

Resolving that one question is expected to close the map and turn it into the written plans the builder actually eats. That is the thing that refills the queue for days rather than for an hour.

**One thing has now been sitting 50 hours.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — letting places and objects carry traits the way people already do — was put up for a design session on Friday evening and no session has picked it up. Not blocked, nobody has objected. Flagging the elapsed time again, not re-asking. It is also the reason I could not queue anything else for design this run: it occupies the one design slot.

## T1 — unblock sweep

**Promoted 1** — the first promotion in six runs, and it went to the only claimable item on the board.

```
[orchestrator] T1 scan: Todo 17, Idea 50+ (paginated), Ready for Dev 1 → 2, In Dev 1 (park), In Design 1
[orchestrator] T1 promote THR-1167: blocker THR-1049 → Done 2026-08-17T21:34:47Z (PR #1531, resolved BY DELETION);
               blockedBy empty, no plan doc named, zero prior comments so no standing retire verdict.
               Verified via get_issue: status "Ready for Dev", assignee key absent (null holds).
               Coordination block posted — the ticket had none, and pull-work Step 3 would have bounced it.
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried live — still Idea. Sixteenth run.
[orchestrator] T1 skip THR-1156: its own body forbids it — "no execution ticket files directly against this epic".
               It is a container; its charter vehicle is the THR-1157 map, which exists and is open.
[orchestrator] T1 skip THR-1155/1134/1002/1114/175: wrong destination — each says plan-doc-before-code in its own text → T2
[orchestrator] T1 skip THR-1052/964/1094/1095/1026/1053/1148: design forks → T2, unchanged
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 skip THR-1043/791: carry an assignee — not queue candidates
[orchestrator] T1 note THR-1130: In Dev + null assignee = the documented park shape, held again this run
```

### The promotion, and why the previous run was right to refuse it

THR-1167 was filed at 21:13Z and declined at 21:30Z as *wrong order* — its scope was defined by how THR-1049 resolved, and THR-1049 was still in flight. **THR-1049 reached Done at 21:34:47Z, four minutes after that decline**, and resolved by deleting all five prototypes rather than wiring them. So the fork this ticket inherits is answered, and the ticket became promotable in the gap between two runs. Both halves are recorded on the ticket so the promotion is diagnosable later.

**One correction carried into the coordination block.** The ticket's out-of-scope clause defers four components to THR-951. THR-951 is **Canceled** (2026-08-11) — folded into THR-1089, which is **Done** (2026-08-15, PR #1467, "deletes eleven modules and spares four"). An executor reading THR-951 as live work would find a canceled ticket and no closeout. Pointed at THR-1089's closeout instead, with the note that four candidates there were *spared* and so may still be in the tree.

### The shelf reads 2 and is still effectively 1

Unchanged from last run and worth restating because the arithmetic is what makes the headline true. `Ready for Dev` holds two:

- **THR-1167** — claimable, promoted this run.
- **THR-1133** — **not claimable by the unattended lane, by its own coordination block**: it needs an attended session, because `preview_start` is refused in scheduled runs. Ready for Dev since 2026-08-16T07:20Z — 39 hours, unclaimed, and correctly so.

So the claimable shelf went 1 → 0 → 1 in the last hour, and the 1 is a short cleanup job.

### Ceiling and throttle

The `ORCH_PROMOTE_BATCH_MAX` (5) ceiling did not bind — nothing else qualified. The **process-work throttle** did: with the shelf holding only process/deferral work, the rule permits at most one such promotion per run, and this run took exactly one and did not go looking for a second. **Product-vs-process ratio: of the last three completions (THR-1091 22:25Z, THR-1049 21:34Z, THR-995 earlier), all three were process, infrastructure or deferral class. Zero product items completed and zero are queued.** The headline finding is upstream supply, per the rule.

## T1.5 — wayfinder sweep

**Two open maps. Zero AFK tickets exist on the entire board — 0 of `ORCH_WAYFINDER_AFK_MAX` (2) spent, re-proved this run by direct label query rather than inherited from last run's proof.**

- `wayfinder:research` — 5 issues, **all 5 Done** (THR-1160, THR-1158, THR-1159, THR-1039, THR-903)
- `wayfinder:task` — 3 issues, **all 3 Done** (THR-986, THR-906, THR-904)

The AFK budget is unspent because the work does not exist, not because it was skipped. Every open wayfinder ticket is HITL by label.

**[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Four of six children Done. Frontier is two, both HITL, both unassigned, **both verified unblocked this run via native relations**:

- [THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) (`wayfinder:grilling`) — blockers THR-1160 and THR-1158, both Done. **This is the map-closing ticket**: its own text says resolving it "is expected to clear the last fog and trigger the map-closing carve-up: one design-session plan doc per wave-1 seam plus one for the shared machinery." Surfaced under `## Needs Christian`.
- [THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) (`wayfinder:prototype`) — blocker THR-1159, Done. Wants a throwaway branch applying the typed anchor to the plot-hook table, for Christian to react to. Genuinely downstream of the wave-1 ruling, since the sitting may change which seam is worth prototyping.

**Correcting last run on THR-1163.** Run n described it as "waiting on an artifact nobody has produced — a ranked seam shortlist that does not exist." Re-reading its two Done blockers, that is too pessimistic and it matters, because it reads as a reason not to surface the ticket. THR-1158's resolution already carries a **worst-five slate for wave 1** (hunger vocabulary, chips, region identity, mandate prose, `followOnTags`), and THR-1160 supplies the cost model to rank it with ("a seam is estimated by how many of its nouns already name a real carrier"). The homework is done. What THR-1163 wants is the *sitting* — the agent ranks those five against the three stated criteria and Christian rules in chat.

**Concrete cheap prep for whoever runs that sitting**, named by THR-1160 and not yet done: run the clause-2 predicate with its "declares a referent" scope removed (491 unscoped, per PR #1522) against each candidate seam. Recorded here rather than filed — filing a new map child is chartering, which the wayfinder skill reserves for explicit invocation.

**[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** 7 of 8 children Done; [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) open, carries an assignee so it is outside the frontier by rule. Deliberately **not** re-surfaced, unchanged reasoning: the THR-1130 sample verdict already in Christian's briefing is the live form of the same conversation, and surfacing both reads as two asks where there is one.

## T2 — design staging

**Triggered for the fifteenth consecutive run, and bound again.** Shelf holds **0 non-`Deferral`** items — both Ready-for-Dev entries carry `Deferral`, including the one promoted this run. Below `ORCH_PROGRAM_WORK_FLOOR` (2).

**Nothing staged.** `In Design` holds 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1).

**THR-790 is now 50h03m past staging** (staging comment `createdAt` 2026-08-15T20:29:28Z; issue `updatedAt` still that same timestamp, so nothing has touched it). Re-surfaced, not re-staged, and the slot is not released — per the skill an expired item is re-surfaced and not replaced.

**Candidate ranking, revised this run.** Last run ranked the shared-machinery plan doc first. That is now second, because the wave-1 sitting is what decides *what the shared machinery is for* and which seams it must serve — writing it first risks designing for a slate that the sitting reorders. Revised order:

1. **The wave-1 sitting (THR-1163)** — not a plan doc, a chat sitting; unblocks the carve-up into plan docs.
2. **The shared-machinery plan doc** — unblocks both THR-1157 frontier tickets once the slate is fixed.
3. [THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) — **and note its position is THR-1163's call by that ticket's own text** ("presumptively wave 1 … but its *position* in the wave is this ticket's call"), and THR-1158 recommends *widening* its scope to region identity. Designing it before the sitting risks designing the narrow version.
4. THR-1134, then THR-1002 / THR-1114, then the design forks T1 routes here: THR-964, THR-1094, THR-1095, THR-1052, THR-1053, THR-1148.

The binding constraint remains **design supply plus the `In Design` bound**, not a shortage of candidates. That queue is eleven deep and has not shrunk in fifteen runs.

## T3 — architecture health

**Not due.** Local time is 2026-08-18 00:27, before `ORCH_HEALTH_SWEEP_HOUR` (06:00 local). The last sweep was run d at ~04:26Z (06:26 local, 2026-08-17); the next is due after ~04:00Z on 2026-08-18.

**No detectors ran this run, and none is reported as clean.** Run d's standing set is carried explicitly **unverified**: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No judgement pass happened and none is claimed.

**Test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; local day is Tuesday. Monday's pass ran with run d and is on `ops` as `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check ran** — it reads `stateHistory` already fetched this run, so it costs nothing. THR-1091 and THR-1049 both show clean single passes (`Idea → Ready for Dev → In Dev → Done`). THR-1167 has one transition, made this run. THR-1133 has one transition and has never been claimed — 39 hours at rest is not a stall, it is an attended ticket correctly waiting for an attended session. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

**None asked, none parked.** No Discord question was needed. Agreed work is not exhausted in the sense the rule means — the T2 candidate queue is eleven deep and the constraint is design *capacity*, not a shortage of blessed direction. That is not a question for Christian to answer; it is a session that needs to run, which is what `## Needs Christian` says.

**One verdict recorded rather than escalated.** The park on THR-1130 held again this run — `In Dev` with a null assignee, its 19:05Z comment stating plainly that nothing is in flight and the sample ask is live. Worth stating each run, because a silently-repopulating assignee would make a finished ticket invisible to the lane that surfaces it (THR-1058).
