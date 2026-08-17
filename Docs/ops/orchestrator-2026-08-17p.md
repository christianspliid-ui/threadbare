---
lane: tb-orchestrator
run: 2026-08-17p
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-08-17 (run p, ~23:29Z)

## Needs Christian

**Nothing new needs you, and one small piece of good news about the warning you were given an hour ago.**

Last run told you the build queue would run dry within about an hour. It has not, and it will not for another hour or two — the builder finished the cleanup job it was given, and in finishing it *found its own next job* and wrote it up. I promoted that one this run. So the queue keeps moving overnight without you.

That is the same stopgap as last time, not a fix, and the shape of it is worth one sentence: **the board is now feeding itself on tidying up after itself.** Two runs in a row, the only promotable thing on the entire board was a ticket the builder filed about the job it had just finished. Nothing new that adds to the game has entered the pipeline. The fix for that is upstream — a design session — and the two questions already in your briefing are unchanged, so they are not restated here.

## T1 — unblock sweep

**Promoted 1.** Second consecutive run with a promotion, and again it was the only claimable item on the board.

```
[orchestrator] T1 scan: Todo 17, Idea (last 24h) 1 new, Ready for Dev 1 → 2, In Dev 2 (one is a park), In Design 1
[orchestrator] T1 promote THR-1168: filed 23:07:59Z by THR-1167 at closeout; blockedBy [] verified via
               get_issue(includeRelations:true) — the five relatedTo links are context, not blockers;
               no plan doc named (liveness gate passes trivially); list_comments returned zero, so no
               standing retire verdict (THR-990). Verified via get_issue: status "Ready for Dev",
               assignee key absent (null holds). Coordination block posted — it had none and was born
               failing pull-work Step 3 (THR-836).
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966". THR-966 re-queried live this
               run — still Idea, single unbroken Idea span since 2026-08-02. Seventeenth consecutive run.
[orchestrator] T1 skip THR-1156: its own body forbids it — "no execution ticket files directly against
               this epic". Container; its charter vehicle is the THR-1157 map, open.
[orchestrator] T1 skip THR-1155/1134/1002/1114/175: wrong destination — plan-doc-before-code → T2
[orchestrator] T1 skip THR-1052/964/1094/1095/1026/1053/1148: design forks → T2 (carried from run o,
               not individually re-queried this run — see the honesty note below)
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 skip THR-1043/791: carry an assignee — not queue candidates
[orchestrator] T1 note THR-1130: In Dev + null assignee = the documented park shape, held again
```

### The promotion, and the one thing that makes it unusual

THR-1168 is the "built ahead of its wiring" half of THR-1167's per-module fork — two authored encounter audio moments (a 1.6s tension reveal, and a per-registration cue) that are complete and unit-tested but whose UI consumer was a prototype THR-1049 deleted. THR-1167 kept them deliberately rather than deleting authored sound design recoverable only from git history, and filed this to force a verdict.

**It carries a live mutex, and I promoted it anyway — on purpose.** [PR #1533](https://github.com/christianspliid-ui/threadbare/pull/1533) (THR-1167's own closeout) is OPEN as of 23:27Z, `mergeStateStatus: BLOCKED` on `Test · Typecheck · Build` still running, auto-merge armed at 23:20:33Z. Its diff touches `src/audio/encounterSoundDesign.ts`, `src/hooks/useThreadReveal.ts` and `ThreadOverlay.tsx` — the exact files THR-1168's evidence describes, and the tree state THR-1168 assumes is not on `origin/main` until that PR lands.

That is a real mutex, but it is **self-clearing within minutes**, which is why this is a promotion with a mutex line rather than a decline. The distinction against run n's refusal of THR-1167 itself matters and is worth recording: THR-1167 was declined then because its *scope was undefined* until THR-1049 resolved — nobody could know what the ticket contained. THR-1168's scope is fully defined; only the tree it lands on is a few minutes behind. Scope-undefined is a decline; file-overlap is a mutex line. The coordination block spells out "do not claim until #1533 has merged" and names the condition under which the mutex may be reversed (THR-688 rule B).

### One boundary written into the block rather than assumed

THR-1168's body is explicit that whether the encounter veil *should* carry a 1.6s tension-reveal on commit is a **feel** question. The coordination block records that Member 2 (the registration cue) is the executor's mechanical call, that Member 1 may not be, and that "Member 2 decided, Member 1 needs a verdict" is a valid completion shape. Left unsaid, the pressure of an empty shelf makes "retire it" the path of least resistance, and that would delete authored sound design to close a checkbox.

### Honesty note on the carried declines

Re-checked **live this run**: THR-966 (THR-1024's gate), THR-1168's relations and comments, the `wayfinder:*` labels, and the assignees on THR-1043/791. The seven design forks in Idea (THR-1052/964/1094/1095/1026/1053/1148) were **not** individually re-queried this run — they are carried from run o's live check 58 minutes ago. Recording that rather than implying a sweep I did not run.

## T1.5 — wayfinder sweep

**Two open maps, unchanged. Zero AFK tickets exist board-wide — 0 of `ORCH_WAYFINDER_AFK_MAX` (2) spent, because the work does not exist, not because it was skipped.** Every `wayfinder:research` (5) and `wayfinder:task` (3) issue on the board is Done. Every open wayfinder ticket is HITL by label.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Four of six children Done. Frontier is two, both HITL, both unassigned. THR-1163 (`wayfinder:grilling`) re-verified unblocked this run via native relations — blockers THR-1160 and THR-1158 both Done. It remains the map-closing ticket. THR-1162 (`wayfinder:prototype`) sits downstream of it.
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** 7 of 8 children Done; THR-907 open but carries an assignee, so outside the frontier by rule. Not re-surfaced, unchanged reasoning.

**Not re-surfaced to Christian this run.** Run o put the wave-1 sitting in front of him 58 minutes ago with a full case for it. Nothing about it has changed, and re-flagging an unchanged ask hourly is precisely what trains a reader to skip the section.

## T2 — design staging

**Triggered for the sixteenth consecutive run, and bound again.** Ready for Dev holds **0 non-`Deferral`** items — both entries (THR-1133, and THR-1168 promoted this run) carry `Deferral`. Below `ORCH_PROGRAM_WORK_FLOOR` (2).

**Nothing staged.** `In Design` holds 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1).

**THR-790 is now 51h00m past staging** (staging comment 2026-08-15T20:29:28Z; issue `updatedAt` still that same timestamp, so nothing has touched it). Re-surfaced in the record, not re-staged, and the slot is not released — per the skill an expired item is re-surfaced and not replaced. It is deliberately **not** repeated under `## Needs Christian`, having been put to him in each of the last two runs.

Candidate ranking is unchanged from run o and is not restated: the wave-1 sitting (THR-1163) first, the shared-machinery plan doc second, THR-1155 third with its scope contingent on the sitting. The binding constraint remains design supply plus the `In Design` bound, not a shortage of candidates — that queue is eleven deep and has not shrunk in sixteen runs.

**Product-vs-process completion ratio, trailing 7 days** (classified by hand over the `completedAt >= 2026-08-10` page of Done issues; the query paginates, so this is the first page and approximate): roughly **33 product : 15 process : 6 wayfinder-design**, about 2:1 product-favouring. That is a genuine improvement on the 2026-08-10 measurement that motivated the process-work throttle, and it means the empty *shelf* is a supply problem at the design end, not process work crowding the queue out.

## T3 — architecture health

**Not due.** `ORCH_HEALTH_SWEEP_HOUR` is 6 (local); this run fired at 01:27 local on 2026-08-18. No detector was run, and none is reported as clean.

Weekly test-suite health is also not due — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2).

**Redundancy: not assessed this sweep** — the judgement pass over the interface map and systems inventory does not run outside T3.

## Escalations

None. No question was asked and no item was parked; the one promotable candidate this run was promotable on its own evidence.
