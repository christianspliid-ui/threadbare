---
lane: tb-orchestrator
run: 2026-08-24g
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-24 (run g, ~16:26Z)

## Needs Christian

**The build queue reached zero this hour. For the first time today there is nothing waiting behind the agent that is currently working.**

It is not stalled — it finished the slice prose rewrite at 17:40 your time and picked up the next job twenty minutes later, which already has a pull request open. When that lands, the shelf behind it is empty. Six runs today have reported it thinning; this is the run where it ran out.

**Two yeses would refill it, and neither takes a minute.**

**1 — the six-encounter batch, unchanged from the last hour and still the big one.** [The Encounter Factory](https://linear.app/threadbare/issue/THR-1043/the-encounter-factory-agentic-workflow-for-composition-complete) has nothing left in it but one content batch and your sample verdict at the end. A brief for it is written and waiting on your approval in chat: six encounters on dangerous ground — a ruin, a battlefield, a fort, a wayside — where the world can finally hurt you. Your own ruling makes that yes the gate. It is worth six pieces of work; everything else on this page is worth one.

**2 — five pieces of scene art, and this one is new.** [Five images in the Meet-The-First scenes](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) are unusable and are currently just switched off: two have words painted into the picture, two show individual faces (which the art doctrine reserves for portraits), and one has the old choice buttons painted in as scenery. Nothing is broken today — substitutes cover the slots — but those five scenes are art nobody made for them. Regenerating the set **spends image-generation credits** (five images plus retries), which is why nobody has run it. Everything else about the job is settled: the sizes, the rules, the acceptance check. Say go and it becomes tonight's work.

Both are genuinely optional. The honest summary is that the machine is out of things it is allowed to start on its own, and the map you have been asked about twice is still the thing that changes that permanently.

## T1 — unblock sweep

Scanned `Todo` (17) and `Ready for Dev` (**0** — re-queried to confirm, since an empty result is a strong claim). Promotion ceiling not engaged.

**Promoted — 0.**

**The shelf is empty, and the executor is healthy.** [THR-1219](https://linear.app/threadbare/issue/THR-1219/rewrite-the-slice-prose-to-the-2026-08-15-standard-direct-pass) went `Ready for Dev` → `In Dev` → `Done` in 66 minutes (claimed 15:01:41Z, completed 15:40:07Z, [PR #1596](https://github.com/christianspliid-ui/threadbare/pull/1596) merged as `9918fcbf`). [THR-1211](https://linear.app/threadbare/issue/THR-1211/four-reputation-adjacent-dead-reads-found-in-the-thr-1206-survey-a) was claimed 22 minutes later at 16:02:26Z and already carries [PR #1597](https://github.com/christianspliid-ui/threadbare/pull/1597). **Two tickets consumed in 85 minutes against a reserve that produced nothing new all day** — the queue did not decay, it was drained by an executor working at full rate.

Nothing in `Todo` moved since run f's scan (newest `updatedAt` is THR-1043 at 14:38:36Z). The 9 declines recorded in [`orchestrator-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md) / [`-24b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24b.md), plus THR-1218, THR-1220 and THR-1043 from runs e and f, carry forward unchanged and are not re-derived.

### The reserve pass, continued — four more items, and one that had already shipped

Run e examined five reserve candidates and found four were decisions rather than work. With the shelf at zero this run went back for five more, choosing the ones that looked most mechanical. **The finding holds, and one item was worse than un-promotable — it was already done.**

| Issue | Verdict | Evidence, from the ticket's own text |
|---|---|---|
| [THR-1088](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) (Law 13 raw percentages) | **Already shipped — do not promote** | Fixed by THR-1121 (PR #1474, 2026-08-15) and THR-1048 together; the `+N% success` branch is gone from `EncounterVeil.tsx` with a comment standing where it was, and two tests pin the absence over a non-empty option set. **This lane has verified and recorded that twice — 2026-08-17 and 2026-08-23 — and the ticket is still open.** See § Escalations |
| [THR-1026](https://linear.app/threadbare/issue/THR-1026/questhooksfindguildlocations-still-hardcodes-adventuring-guild-so) (quest hooks posted at one faction's halls) | **Wrong destination — design ruling** | *"a design question the ticket did not ask and an executor should not answer alone"* — Done-when 1 is a recorded decision on which of the twelve factions commission ruin delves, and the three quest templates are adventuring-guild-voiced by id and prose |
| [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice) (choice-commit pipeline unreachable) | **Wrong destination — design ruling** | *"this is a design call rather than a patch"*, wire-the-producer vs retire-the-pipeline, with four dead constant families riding on the answer |
| [THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two) (two halves of the nudge verify path disagree) | **Wrong destination — design ruling** | *"the choice is a real design call rather than a detail"* — two shapes, one of which risks re-opening the scoring door the exemplar deliberately keeps shut |
| [THR-854](https://linear.app/threadbare/issue/THR-854/three-faction-pairs-render-byte-identical-heraldry-asserting-a-kinship) (byte-identical heraldry) | **Wrong destination — design ruling** | *"the fix is a design question, not a mechanical one — what should distinguish two factions with the same reach profile and type?"* Three candidate answers, all of which change the heraldic vocabulary |

**Nine reserve items have now been examined across runs e and g. Eight say in their own text that a decision is owed; the ninth had already shipped.** That is no longer a sample — it is the shape of the pile. The reserve is not a queue with a slow tap; it is a decision backlog wearing a ticket backlog's clothes.

**[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) remains the single exception and is deliberately still not promoted.** It is fully specified and asks nobody to decide anything about the game — but its own text carries a spend gate (*"this ticket spends image-generation credits (5 images, plus retries). Worth confirming with Christian before running the batch"*), and the standing rule is that costs are disclosed before they are billed. Promoting it would hand an unattended executor a spend decision. Run e withheld it to avoid competing with the map ask; **with the shelf now at zero that trade has flipped**, so it is surfaced above as the cheapest available unblock rather than held back.

### Rule-0 discipline

**Nothing was promoted, so the process budget is not engaged.** Nothing process-shaped was a candidate: of the five examined, four are game content or game systems and the fifth is a debug-bridge defect that is itself gated on a design call.

**Week's product-vs-process completion ratio: ~47 product : 3 process** (plus 9 design/research). Up one on the product side since run f — THR-1219 completed at 15:40:07Z and now counts. Floors rather than exact totals, for the pagination reason recorded at 05:39Z.

**The starved-shelf clause applies and this is its headline: the shelf is empty, and the fix is upstream supply — design rulings and two director yeses — never downstream tidying.** No process ticket was promoted to fill the gap, which is the specific temptation the clause exists to refuse.

## T1.5 — wayfinder sweep

**No open maps — third consecutive run.** The label-filtered query returns two issues, both `Done`: [THR-1157](https://linear.app/threadbare/issue/THR-1157) (typed game-state, closed 05:52Z) and [THR-902](https://linear.app/threadbare/issue/THR-902) (vertical slice, closed 14:27Z).

**Frontier: empty. AFK tickets resolved: 0. HITL tickets surfaced: 0.** `ORCH_WAYFINDER_AFK_MAX` was not approached, no subagent was spawned, and **no ticket was claimed, resolved or closed by this lane this run.**

This tier has nothing to sweep until a map is chartered — which is the standing lead ask on the briefing and is deliberately not restated as a third competing item above.

## T2 — design staging

**Trigger met, bound exceeded. Nothing staged — seventh consecutive run today.**

- **Trigger: met, and now by the widest possible margin.** Non-`Deferral` program work in `Ready for Dev` is **0** against a floor of 2 — and so is total work, which is new this run.
- **Bound: exceeded.** `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, staged 5 days) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, 9 days) — against `ORCH_MAX_IN_DESIGN` of 1.

The full argument for why the constraint is drawdown rather than supply was made at 07:31Z and is not re-argued. **One thing this run does add:** eight of the nine reserve items examined need exactly what `In Design` is for, and two items have been sitting in it unpicked for 5 and 9 days. The bound is not the thing keeping them out — nothing is drawing from that lane at all. Staging a third would deepen a queue with no reader, which is the same defect as promoting into a queue with no executor.

## T3 — architecture health

**Not due — skipped, and no detector was run.** The daily sweep ran at 05:39Z ([`orchestrator-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md)) and Monday's weekly test-suite health pass ran with it ([`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops`); `ORCH_TESTHEALTH_DOW` is satisfied for the week.

`newFindings: 0` therefore means **no sweep ran**, not *a sweep found nothing*. No detector result of any kind appears in this report.

**Redundancy pass: not assessed this run.** Done at 05:39Z, not re-run within a day. Stated rather than omitted so its absence is not read as a clean result.

**Stalled work:** no issue crossed `ORCH_STALLED_PICKUP_THRESHOLD` (3). THR-1219 and THR-1211 each show exactly one clean `Ready for Dev → In Dev` transition in `stateHistory`.

**Home-tree health, re-checked because run f logged a hazard against it:** `threadbare-autosync.log` is green through 17:50 local (fast-forwarded 2 commits to `9918fcbf`), cadence unbroken. The hazard is still latent and still not firing — see § Escalations.

The Linear reads quoted in § T1 are **not** detector results. They are ticket-body reads on five specific candidates this run was deciding about, not a survey of the tree.

## Escalations

**No Discord question was asked, and the reasoning is timing rather than reluctance.** The escalation rule fires on *agreed work exhausted*, which is now unambiguously true. The briefing runs at :45 — nineteen minutes from this run — and reads § Needs Christian out of the newest report, so both asks reach him on the sanctioned channel before a Discord ping would land. Pinging as well would ask the same two questions twice in the same quarter-hour. **If the shelf is still zero at tomorrow's first run, the ping is the escalation** — recorded here so the next run does not have to re-derive that threshold.

**A verdict with no consumer — logged, not filed** (scheduled lanes do not file process tickets; the weekly retro promotes if it recurs):

[THR-1088](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) has been verified as already-shipped by this lane **twice** — 2026-08-17T18:32Z and 2026-08-23T07:32Z — each time with a full evidence comment ending *"recommended disposition: close as resolved-by-THR-1121"*. Both times the closure was left to "whoever holds it", because this lane does not set terminal states on non-wayfinder issues. **Nobody holds it.** `daily-backlog-grooming` fires ~09:16 daily and owns exactly this class (state contradictions), and has passed over it at least twice since the first verdict. The cost is small and precise: every time the shelf empties, this ticket resurfaces as the most mechanical-looking candidate in the reserve and costs a pre-promotion verification — three times now, including this run. It also makes the `Idea` shelf read one item deeper than it is, which matters more than usual on a day spent arguing about reserve depth. **The fix is one lane consuming a verdict that is already written, not another verdict.**

**Run f's untracked-brief hazard: still latent, still not firing, unchanged.** `Docs/plans/encounters/border-perils-brief.md` remains untracked in the home tree (4,919 bytes, last written 14:49Z — no edits since run f flagged it) and is absent from `origin/main`, which carries nine other files in that directory. The THR-937 collision only fires when `main` commits *that path*; autosync is green through 17:50 local. **Still deliberately not repaired by this lane** — deleting it destroys the only copy of a live artifact, and committing another session's draft would exceed the remit and hand its author a conflict on their own file. Carried forward so a later run recognises the failure on sight rather than diagnosing it from a behind-count.

Bare `THR-XXX` references throughout — nothing in this report is intended to close anything.
