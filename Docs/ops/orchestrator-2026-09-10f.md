---
lane: tb-orchestrator
run: 2026-09-10f
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-10 (run f, ~08:27–08:45Z)

**One finding this run, and it was on the item that matters most.** The shelf's highest-leverage ticket — the one standing in front of the only program work on the board — had its coordination block pushed to third-newest by two later comments, which is the comment `pull-work` never reads. Nothing else on the board moved in a way that earns a promotion. The block is restored; no state was written anywhere.

## Needs Christian

**Still one question, and it is the same one as an hour ago.** Nothing has changed about it except that the thing it blocks got closer to finished.

**Does every aftermath line need its concept tags, or only some?**
[THR-1053 — the Composition Contract's `concepts` rule](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change)

Two documents disagree. The content rulebook says every aftermath change must carry concept tags; the code that reads them treats them as optional. Somebody checked the shipped code and **the code is right** — the tags are decoration on top of a sentence that already links up fine without them.

Fourteen of the sixteen retrofit encounters now pass every gate. The last two — *Snow on the Pass* and *Riders Behind the Caravan* — wait only on this. **The recommendation on file is to narrow the rule.** Say *narrow it* and they finish.

**A second question reached you at 08:14 this morning. You can almost certainly ignore it.** The batch-3 session asked whether to wait a day before authoring its one remaining encounter, so that a fix lands first ([THR-1130](https://linear.app/threadbare/issue/THR-1130), recommendation: yes, wait). That fix is [THR-1446](https://linear.app/threadbare/issue/THR-1446/the-consequence-draw-can-deal-a-hand-no-authored-content-can-wire) — it is on the builder's shelf right now, it is a one-to-three-hour job, and this run made sure the builder will pick it up cleanly. **If it lands first, the question answers itself and needs nothing from you.** It is named here only so it is not invisible.

**Still open, deliberately not re-asked:** the [Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)'s ten questions (all the legwork finished a week ago), [THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) (whose story a run tells — your god's memory, or a named campaign), the [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no, the [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), and [THR-790](https://linear.app/threadbare/issue/THR-790) (whether you mean to run the traits-wave-2 design pass yourself — it has sat in the design column since 15 August and is the reason no new design job can be queued).

**Nothing was padded.** The same eight tidying jobs were left alone for the sixth run running.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers cleared: 1.** Promotion ceiling never engaged — shelf at 7 on entry, far below the 15-item backed-up threshold.

Board at scan (~08:27Z): **35 `Todo`** (15 `wayfinder:*`, skipped unconditionally) · **7 `Ready for Dev`**, all carrying `Deferral` · **1 `In Dev`** ([THR-1130](https://linear.app/threadbare/issue/THR-1130), `Parked`, unassigned) · **1 `In Design`** ([THR-790](https://linear.app/threadbare/issue/THR-790)).

Precheck fingerprint: `linear=nokey` (the credential-free probe reached the endpoint; the MCP connector answered every call this run, so the board was never dark), `freshness=behind:2` on the home mirror — noted because the T3 detectors would read that tree, and T3 did not run.

### Finding — the coordination block on [THR-1446](https://linear.app/threadbare/issue/THR-1446) had been displaced, on the ticket the only program work is parked behind

`pull-work` Step 3 reads **the latest comment** on a candidate and nothing else. THR-1446's comment stack at scan:

| Time | Comment | Carries the three lines? |
|---|---|---|
| 08:14:47Z | `tb-opus-pickup` findings note — a third template draws the same unwirable pair | **No** |
| 06:56:14Z | The attended design session's **decision** + full coordination block | Yes |
| 2026-09-09 21:29Z | The filing block | Yes |

So the block existed and was invisible to the gate that reads it. **This is not the THR-836 bounce shape** — the description carries a *Files this touches* section, so Step 3 classifies the ticket **self-scoped** and claims it with a derived block rather than refusing it. The cost is narrower and easier to miss: Done-when #1 on this ticket is *"a design call is recorded choosing among the options"*, and **that call was recorded at 06:56Z** (options 1 + 2 + 4; option 3 rejected). An executor deriving its own block from the description would meet that Done-when with no decision in the comment it was told to read, and could reasonably conclude the design call was still owed.

**Action taken: one comment, no state change** — the three lines restored as the latest comment, with the recorded decision named, two corrections applied, and the mutex direction spelled out. No assignee, no label, no state written.

The two corrections, both of which are this hour's news:

- **THR-1287 reached `Done` at 07:44:58Z.** The 06:56Z block listed it under `Parallel-safe with`; it is now merged.
- **The mutex reads backwards if you only look at the partner's state.** THR-1130 is `In Dev` + `Parked` + unassigned — the park row of Step 3's mutex-liveness table, the row labelled *deadlock, not a queue*. It is not a reason to bounce THR-1446: the mutex's own stated order is that **THR-1446 lands first**, and THR-1130 now carries a `blockedBy` relation on it recording exactly that. Stated explicitly so a correct reading of the park row does not produce the wrong verdict.

### Blocker cleared — [THR-1448](https://linear.app/threadbare/issue/THR-1448) (recorded, still not promoted)

*A held town is a faction position.* Its description gates on *"Sequencing: after THR-1287 lands"*; **THR-1287 went `Done` at 07:44:58Z**, forty-five minutes after run e scanned it as `In Dev` and correctly declined on that line. Recorded on the ticket once so no later sweep re-derives it.

**It still does not promote.** The second decline reason is the binding one and is unchanged: the body reads *"a design ticket; plan doc before code"* and the Done-when is *"Plan doc in `Docs/plans/` … intent-judged and three-way audited."* Met blockers make a ticket **T2's** input, not the executor's. → T2.

### Also cleared, no write needed — [THR-1450](https://linear.app/threadbare/issue/THR-1450)'s live mutex

Run e promoted THR-1450 with its mutex against THR-1287 flagged **LIVE**, and named the two commands that would settle it. THR-1287 is now `Done`, so Step 3's mutex table resolves it on the first row — *claim past it, record the reversal*. **Deliberately no comment written**: run e's block is well-formed and is the latest comment on that issue, and replacing it would put this lane's re-derivation where a correct block already stands. The executor's own procedure handles this without help.

### Declined this run

| Ticket | Verdict | Evidence |
|---|---|---|
| [THR-1380](https://linear.app/threadbare/issue/THR-1380) — UL-proposal: calling, moment, follow | **Standing satisfied-upstream verdict — not re-derived** | Two comments already carry the grep: all three entries plus the See-Also shipped under THR-1299 slice 6 (`78caf436`, PR #1777), each stamped *"seated by THR-1380"*. Nothing remains to build; no lane may close it |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) — the `intelligence` object type | **Wrong destination** | Body: *"a design decision, not an executor's call"*; the Done-when requires naming an engine reader and designing a graph shape first. No blocker named; `relations.blockedBy` is `[]`. → T2 |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) — a held town is a faction position | **Wrong destination** (sequencing half now discharged, above) | Done-when is a plan doc, intent-judged and three-way audited → T2 |

**Standing declines — carried, not re-derived:** THR-1301 · THR-1088 · THR-984 · THR-1024 · THR-175 · THR-1189 · THR-1148 · THR-1318 · THR-1218 · THR-1026 · THR-964 · THR-1198 · THR-716 · 15 `wayfinder:*` · THR-1220 (*"never promote to Ready for Dev"*, its own first line) · THR-1133 (attended) · THR-1274 · THR-1381 · THR-1053 · THR-1156 · THR-789 · THR-1155 · THR-1043 · THR-870 (deferred until Christian moves the project out of `Idea`) · THR-791 · THR-1348.

### The eight tidying tickets — still not promoted

THR-984, THR-758, THR-871, THR-949, THR-882, THR-893, THR-852, THR-752. **Sixth consecutive run holding this line.** The shelf is 7, so the starvation clause does not apply; and none of the eight clears the materiality bar (no quotable above-bar loss, no cost/benefit line), so neither does any reason to promote them. Recorded as a decision under the current board, not an inherited habit.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — re-measured this run, not carried forward.**

```
list_issues(label:"wayfinder:research")  -> 21 issues, all Done
list_issues(label:"wayfinder:task")      ->  5 issues, all Done
```

**Ninth consecutive sweep finding no agent-doable decision ticket on any open map.** Every open child across the three maps is `grilling` or `prototype` — HITL by label, untouchable by rule.

- **[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children (THR-1263 … THR-1272), all HITL, none assigned. All four of its research tickets `Done`. Largest HITL debt on the board with zero remaining legwork.
- **[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** — sole open child THR-1232, assigned to Christian.
- **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** — one unassigned prototype, THR-1236.

No map body edited — this lane resolved nothing, so Decisions-so-far gains no line.

## T2 — design staging

**Triggered, and barred by the bound. Nothing was staged and nothing was mutated.**

Non-`Deferral` items in `Ready for Dev` = **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. All seven shelf items carry `Deferral`. This is a change from run e, which counted 1: [THR-1130](https://linear.app/threadbare/issue/THR-1130) left the shelf at 08:14Z — **not by being claimed, but by being re-parked** into `In Dev` + `Parked` + unassigned, awaiting Christian's yes/no on the batch-3 brief.

`In Design` holds **1 live, 0 excluded**, against `ORCH_MAX_IN_DESIGN` of 1 — exactly at the ceiling:

| Issue | Assignee | Last activity | Classification |
|---|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) | Christian | 09-08 18:32Z (1.7d) | **Live** — assigned, inside `ORCH_IN_DESIGN_STALE_DAYS` (7) |

Neither stale arm engaged, so the sweep's warning does not fire — **but the item entered the column on 2026-08-15 and has had no plan doc, design-session comment or attachment since.** Its `updatedAt` is 1.7 days old; its *design progress* is twenty-six days old. The predicate reads activity, and activity is not the same thing. Both the grooming lane (09-03) and the stale-claim sweep (09-02) have already put the only question to Christian: does he intend to run this design pass himself? If not, unassigning it frees the slot. **Nothing was changed here** — applying `Parked` or demoting is not this lane's call.

**The consequence is worth stating plainly, because this is the first hour it has bitten in both directions at once:** the build shelf holds zero program work, T2 is the mechanism that refills it, and T2 is barred by a single design item that nobody is working. The bar is the bound behaving exactly as designed. The item behind it is the problem.

**T2's candidate queue, strongest first:** [THR-1053](https://linear.app/threadbare/issue/THR-1053) (unchanged at the top — the only candidate blocking a shelf item), then THR-1448 (sequencing now clear), THR-1348, THR-1393, THR-1274, THR-1026, THR-964.

## T3 — architecture health

**Not due. Already run in full today at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md)**, past `ORCH_HEALTH_SWEEP_HOUR` (06:00). The daily sweep is once per day, so **no detector was run this run.**

**`newFindings: 0` in this run's frontmatter means "the sweep did not run", not "the sweep came back clean."** Stated explicitly because a zero that reads as a pass is the exact pathology this tier exists to catch. Run c's two findings stand unchanged and are not restated: `check:process` exiting 0 with three sub-checks dark, and canon-staleness 27 → 28.

**Redundancy: not assessed this sweep.** The judgement budget went to the THR-1446 comment-stack finding. Saying so rather than implying coverage.

**`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, and not reported as clean.**

### Standing sub-duties

Two of the three are T3's and were not re-run this hour; the `In Design` line is reported because T2 measured it anyway.

- **`In Design`: 1 live, 0 excluded** ([THR-790](https://linear.app/threadbare/issue/THR-790), assigned, 1.7d by activity). Printed at 1 rather than skipped, per the tier's rule that a countable bound is the point.
- **Hand-created `In Dev` tickets / stalled work: not re-measured this run** (T3 not due). Run d verified THR-1130 — still the sole `In Dev` issue — passed through `Ready for Dev` on its `stateHistory`, and run e recorded its 4-transition count as a park artifact rather than a stall.
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

### Product vs process — the week

Trailing-week measure **~31 product / 8 process (~79% product)**. THR-1287 closed at 07:44:58Z and moves the numerator by one. This run promoted nothing, so the ratio is otherwise unchanged.

**The headline is run e's, sharpened by one hour.** Run e said *"one design ruling is holding the only program item on the shelf."* That is now literally true rather than nearly so: the program item is off the shelf entirely, parked, and the shelf is seven deferrals. But the path out is shorter than it looks — THR-1446 is queued, cleanly claimable as of this run, and clears batch 3 on its own. **What no lane can shorten is THR-790**, which is barring the tier that would refill the other side.

## Escalations

**Nothing asked on Discord this run, and nothing newly parked.** The two questions in front of Christian are both already on their tickets and both reach him through the briefing; a Discord ping would be a third copy of the same ask rather than a new one.

**One pattern logged, not filed** (below the materiality bar, and § *Process-work throttle* forbids this lane filing process tickets regardless): **a later comment can bury a coordination block where `pull-work` Step 3 cannot see it.** The gate reads only the latest comment by design — that is what makes it cheap — so any lane commenting on a `Ready for Dev` issue silently takes over the block. Two instances now: this run's THR-1446, and run e's observation that a block's *tense* had run ahead of the board on THR-1450. Cost so far is one orchestrator comment per instance, which is why it is a log row and not a ticket. Worth one line at the weekly retro; the cheap repair is a convention — **when commenting on a `Ready for Dev` issue, re-carry the three lines** — not a new gate.
