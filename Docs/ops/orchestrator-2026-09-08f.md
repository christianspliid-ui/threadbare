---
lane: tb-orchestrator
run: 2026-09-08f
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-08 (run f, ~21:27–21:40Z)

**The last buildable ticket was claimed at 21:01Z, and this run stopped asserting that the queue cannot refill itself and measured it instead: every remaining candidate on the board was opened and read, and not one of them is executor work.**

[THR-1442](https://linear.app/threadbare/issue/THR-1442) reached `Done` at **20:37Z** — run d promoted it, run e watched it get claimed, and it shipped inside the hour. [THR-1440](https://linear.app/threadbare/issue/THR-1440), the capability rider, was claimed at **21:01Z** and is the executor's live work. That leaves exactly one item on the shelf.

Run e wrote that *"nothing an agent can do refills it."* That was a judgement. This run turned it into a census: **nine `Todo` candidates that no previous run had ever tabled were opened and read, and every one of them is gated on a decision no agent may make** — seven say so in their own words. The pipeline is not short of work. It is short of rulings.

## Needs Christian

Three asks, unchanged and restated in full — the briefing builds its list from this section, so anything dropped here reads to you as "no longer wanted". The first one is worth more than it was yesterday, and that is the only thing that moved.

### 1. Approve the encounter batch — [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**Five days waiting, and it buys more than it did.** Saying *"Batch 2, run the six"* puts six encounters of content work into the build queue the same hour. The brief is here: [4 September retrofit brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md). The question inside it is whether the camp six should be **repaired in place or re-rolled from fresh premises** — they were written in July, under the old prose doctrine.

**New this run:** it turns out a second, entirely separate ticket is waiting behind the same yes. [Tightening the card-name limit](https://linear.app/threadbare/issue/THR-1255) — a small, fully-specified job that has been ready for two weeks — cannot run until the camp encounters are rewritten, because two of them carry names too long under the tighter rule. So one approval releases the six encounters *and* the cleanup that has been queued behind them.

### 2. The fighting design waits entirely on you — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)

Unchanged, and re-measured this run: **ten open questions, all yours, none of them with any legwork left.** All four research questions were answered and written up days ago. What defeat should look like. How much monster is just enough. What winning leaves in your hands. Whether companies fight as units. When you have an evening, open a chat and say *"work the physical conflict map"*.

### 3. A yes or no on spending image credits — [regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

Unchanged. Five Meet-The-First scene pictures carry defects — painted-in buttons, baked-in titles, individuated faces. Regenerating them spends image credits, which is the only reason it waits. Nothing is broken meanwhile; substitutes are standing in.

### The queue is down to its last item, and now we know exactly why

Run e said the build queue would run dry in about two hours of work. One of those two hours is being spent right now, on [the capability rider](https://linear.app/threadbare/issue/THR-1440). After it, [one gate flip](https://linear.app/threadbare/issue/THR-1256) remains — and then nothing.

The new part is the reason. Twenty-nine tickets sit in the backlog that are not fighting-design questions. **Every one that this lane could plausibly have promoted was opened and read this run, and each is waiting on a ruling rather than on effort** — what a Divine Herald actually *is*, which of the twelve Spheres two actions belong to, whether a toll should move wealth or be deleted, whether a page you can open mid-game should exist at all. These are one- and two-sentence answers from you that each release a piece of buildable work. None of them is a large design session; several are smaller than the three asks above.

If it would help, the next attended session could work a batch of them in one sitting rather than one at a time. Say *"rule on the backlog"* and they will be brought to you framed in game terms, smallest first.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. The ceiling never engaged** (shelf at scan 1, far under the 15-item backed-up threshold; 0 against `ORCH_PROMOTE_BATCH_MAX` 5).

Board at scan (~21:28Z): **45 `Todo`** (16 carrying a `wayfinder:*` label, skipped unconditionally), **1 `Ready for Dev`**, **3 `In Dev`**, **2 `In Design`**. `origin/main` @ `f19fb632`.

**One live claim.** [THR-1440](https://linear.app/threadbare/issue/THR-1440) moved `Ready for Dev` → `In Dev` at **21:01:49Z**, assigned. The other two `In Dev` issues ([THR-1392](https://linear.app/threadbare/issue/THR-1392), [THR-1130](https://linear.app/threadbare/issue/THR-1130)) both carry `Parked` with no assignee. The WIP slot is occupied; nothing promoted this hour would have been picked up before the next run regardless.

**Nothing was created or re-stated on the board this hour.** A `-PT2H` sweep returned eleven touched issues, all of them completions or grooming timestamp bumps — no new candidate, no changed premise, no comment bearing a verdict.

### The census — nine candidates read for the first time, none promotable

Run a's decline table named five non-wayfinder tickets and promoted two, which accounts for seven of the thirty-one non-wayfinder `Todo` items. The other twenty-four had never been individually assessed by any run — they were simply not promoted. With the shelf one item from empty, *why* they are not promotable stopped being a footnote, so the nine that could plausibly have been executor work were opened and read in full.

**Not one is.** Seven of the nine say so in their own body text — this is not the lane inferring a design gate, it is the lane reading a gate the filing author already wrote:

| ticket | gate | quoted from the ticket |
|---|---|---|
| [THR-1195](https://linear.app/threadbare/issue/THR-1195) Divine Herald `actorType` | **Design fork** | *"a design call about what the thing is, not a mechanical drift correction"* — three live options. Also **already refused once**: `stateHistory` shows `Ready for Dev` 2026-08-22T18:30:23Z → `Todo` 18:31:47Z, a 84-second bounce |
| [THR-1114](https://linear.app/threadbare/issue/THR-1114) `shadow` / `void` sphere affinities | **Design fork** | *"There is no agreed outcome to test against, so this is a design decision"* — and the body forbids the mechanical fix outright |
| [THR-1189](https://linear.app/threadbare/issue/THR-1189) `taxRate` collected by nothing | **Design fork** | *"it wants a design pass rather than an executor's judgement call"* — who pays, out of what, on what cadence |
| [THR-1315](https://linear.app/threadbare/issue/THR-1315) `WorldRefKind: 'codex'` | **Explicitly routed to T2** | *"filed to `Todo` for `tb-orchestrator` T2 re-scoping rather than to `Ready for Dev`, because there is no plan doc for it and an executor would be inventing the surface"* |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) DetailModal forks its overlay | **Unmet blocker** | *"do not start this before THR-966"* — and [THR-966](https://linear.app/threadbare/issue/THR-966) is `Idea`, itself a prune-or-mount decision coordinated with THR-951 |
| [THR-1255](https://linear.app/threadbare/issue/THR-1255) tighten `NUDGE_NAME_MAX_WORDS` | **Unmet blocker, chains to ask 1** | Its unblock predicate names [THR-1222](https://linear.app/threadbare/issue/THR-1222) shipping. See below — this is the run's one finding |
| [THR-175](https://linear.app/threadbare/issue/THR-175) `agent.sphere` field | **Unmet state gate** | *"Do not start this work before the trigger"* — creation-sphere content shipping, or a template needing sphere independent of reach. Neither has happened; filed 2026-04-18 |
| [THR-1424](https://linear.app/threadbare/issue/THR-1424) / [THR-1426](https://linear.app/threadbare/issue/THR-1426) percentages and tick shapes | **Design ruling** | Both title a *"Law 15 ruling needed"* — a UI-law verdict, not an implementation |

The four remaining unassessed non-wayfinder items self-declare from their titles and were not re-opened: [THR-1133](https://linear.app/threadbare/issue/THR-1133) (attended dev-server session, human by construction), [THR-1318](https://linear.app/threadbare/issue/THR-1318) (*"activate … or retire it"*), [THR-1148](https://linear.app/threadbare/issue/THR-1148) (*"decide whether that is the design"*), [THR-1218](https://linear.app/threadbare/issue/THR-1218) (gated on factory content raising the density). The rest are program epics and human checkpoints — [THR-1156](https://linear.app/threadbare/issue/THR-1156), [THR-789](https://linear.app/threadbare/issue/THR-789), [THR-1155](https://linear.app/threadbare/issue/THR-1155), [THR-1043](https://linear.app/threadbare/issue/THR-1043), [THR-1220](https://linear.app/threadbare/issue/THR-1220), [THR-870](https://linear.app/threadbare/issue/THR-870), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1381](https://linear.app/threadbare/issue/THR-1381), [THR-1134](https://linear.app/threadbare/issue/THR-1134), [THR-791](https://linear.app/threadbare/issue/THR-791).

**What this changes.** It does not change a single promotion decision — the outcome is identical to a run that had shrugged. It changes what the lane can honestly say about the exhaustion condition. "Agreed work is exhausted" is the one state that stops this lane, and until now the evidence for approaching it was an absence (nothing promoted) rather than a measurement (nothing promotable). The distinction matters because the two have different fixes: a thin shelf caused by a parsing bug is repaired by fixing the parser, and a thin shelf caused by thirteen unanswered design questions is repaired only by answering them. It is the second.

### The one finding — ask 1 releases a second ticket, and nothing said so

[THR-1255](https://linear.app/threadbare/issue/THR-1255) tightens the nudge card-name clamp from 6 words to 4. It was attempted under THR-1225, **measured red, and correctly reverted** — at 4 words, `npm run check:encounter -- --all` fails on four cards across three templates. Its unblock predicate has two legs:

1. [THR-1222](https://linear.app/threadbare/issue/THR-1222) ships, taking `encounter.sharpen_blades` and `encounter.ward_the_camp` off `RETROFIT_PENDING` with Doctrine-v2 names.
2. `company.betrayal.the_work_calls` in `src/data/encounters/company-drama.ts` is renamed to ≤4 words — *"on no retrofit list and no other ticket names it — it is this ticket's own content work."*

THR-1222 is the batch-2 approval ask. So the dependency chain runs **Christian's yes → THR-1222 → THR-1255**, and THR-1255 is otherwise complete: it already carries a full coordination block, a named model, a stated mutex with its reason, and a Done-when with the exact gate command. It is the most execution-ready ticket on the board and it is invisible behind an approval nobody knew it was waiting on.

**Not filed as anything, and nothing was written to either ticket.** THR-1255's own description states the predicate correctly; there is no defect to repair. The value is in ask 1 now carrying its true weight, which is where it has been put.

### Standing declines — evidence not re-derived

[THR-1222](https://linear.app/threadbare/issue/THR-1222) (human-approval gate) · [THR-1301](https://linear.app/threadbare/issue/THR-1301) (nothing left to implement) · [THR-1380](https://linear.app/threadbare/issue/THR-1380) (shipped in full under THR-1299) · [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1393](https://linear.app/threadbare/issue/THR-1393), [THR-1287](https://linear.app/threadbare/issue/THR-1287) (wrong destination → T2) · 16 `wayfinder:*` (skipped unconditionally). All hold on the evidence recorded by [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t1--unblock-sweep), [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08d.md#t1--unblock-sweep) and [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08e.md#t1--unblock-sweep). Nothing on any of them changed this hour.

[THR-1441](https://linear.app/threadbare/issue/THR-1441) (the *Agreement* / *Means* glossary proposal) sits in `Idea`, where run e's assessment left it — outside this tier's scan by state, and still correctly barred from the queue by the materiality bar.

### The shelf's last item is pickable — verified rather than assumed

With one ticket standing between the executor and an empty queue, it is worth knowing that ticket can actually be claimed. [THR-1256](https://linear.app/threadbare/issue/THR-1256) carries a complete coordination block posted by run a at 16:31Z — `Suggested model`, `Parallel-safe with`, `Mutex with` (with its reason inline), `Blocked by: nothing`, files to touch, and the evidence shape. `pull-work` Step 3 will not bounce it. Its time gate opened today, and **retiring the gate is an in-scope outcome of it, not a failure** — worth restating, because a fast reading of that ticket flips a CI step that may not have burned in.

## T1.5 — wayfinder sweep

**Four open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — the queue is empty by measurement taken this run, not carried over from run e.**

```
list_issues(label:"wayfinder:research")  → 21 issues, all Done
list_issues(label:"wayfinder:task")      → 5 issues, all Done
```

No agent-doable decision ticket exists on any map, open or otherwise. Every open child of every map carries `grilling` or `prototype` — HITL by label, untouchable by this lane by rule.

**[THR-1396](https://linear.app/threadbare/issue/THR-1396) — Undertakings: one ticket from delivered.** THR-1438 `Done`, THR-1439 `Done`, [THR-1440](https://linear.app/threadbare/issue/THR-1440) now claimed and in flight. Both of its `wayfinder:task` children (THR-1403, THR-1405) closed today. When THR-1440 lands, the map is complete.

**[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children, every one HITL, none assigned: THR-1263, THR-1264, THR-1265, THR-1266, THR-1267, THR-1268, THR-1269, THR-1270, THR-1271, THR-1272. All four research tickets (THR-1259 through THR-1262) are `Done`. This is the largest HITL debt on the board and it has zero remaining legwork — surfaced as ask 2.

**[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** (sole open child THR-1232 assigned to Christian) and **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** (one unassigned `prototype`, THR-1236) are unchanged.

**No map body was edited** — Decisions-so-far gains a line only for tickets this lane resolved, and it resolved none.

## T2 — design staging

**Triggered on the floor. Barred by the bound. Both numbers below.**

**Trigger: fired, and harder than last hour.** Non-`Deferral` items in `Ready for Dev` = **0** — the shelf holds exactly one issue, [THR-1256](https://linear.app/threadbare/issue/THR-1256), and it carries `Deferral`. Against `ORCH_PROGRAM_WORK_FLOOR` of 2. Run e measured 1; THR-1440's 21:01Z claim took it to 0.

**Bound: barred. `In Design` holds 2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1 — measured on the `classifyInDesignItem` predicate, not by column occupancy:

- **[THR-1002](https://linear.app/threadbare/issue/THR-1002)** — unassigned; newest comment 2026-09-03T07:19:42Z → **5.6 days**, under the 7-day threshold → live, counts.
- **[THR-790](https://linear.app/threadbare/issue/THR-790)** — assigned → counts whatever its age.

**The date to watch is unchanged: 2026-09-10 ~07:19Z**, when THR-1002 crosses seven days from that comment and stops counting — unless something comments on it first, which is the warn-only guard whose warning resets the clock it reads.

**Nothing was mutated.** Excluding is a count, not a state change; applying `Parked` is Christian's call.

**The reading, now with the census behind it:** staging a third item would not produce a line of code, because the two already staged are waiting on the same missing input as everything in § T1's table — an attended session with authority to rule. The bound is not the constraint. The constraint is that this lane may stage design work and may not do it, and the queue of things needing a ruling is now thirteen deep.

## T3 — architecture health

**Not due. Skipped, and no detector result is reported.**

[Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t3--architecture-health) ran the full sweep at ~16:27Z today; the tier is daily on the first run after `ORCH_HEALTH_SWEEP_HOUR`, and that run was it.

**Explicitly not run and not claimed as clean:** `generate-interface-map:dry`, `check:canon-staleness`, `sweep:rank-reach`, `check:process`. Their last real results are run a's. **`__DEBUG.validateTraitRefs()` remains browser-only and unmeasurable headless.** **Redundancy: not assessed this sweep** — no judgement pass was run.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Tuesday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**The one counted finding came out of T1's census, not a detector** — the THR-1222 → THR-1255 chain, above. No detector produced it and none is claimed to have.

**Items standing open from earlier runs**, restated so a reader of the newest report does not conclude they were dropped: run a's Finding 1 (the `create` verb family losing the `occurred_at` edge that makes witnesses possible — 5 failures in 900 ticks, 100% correlated with `cell.create.*`), run c's note that `strategicControlChurn.test.ts`'s docblock still advertises two guards THR-1303 deleted, and run e's `undertaking-objects.ts:1490` docblock caution (a comment claiming the war readout reads `strategicIntelligence` back, when that reader is the debug bridge). All three are sub-bar and go to the weekly retro under the scheduled-lane throttle, not to tickets from a lane.

### Product vs process — the week

Not re-derived; the trailing-week measure remains **~24 product / 6 process (~80% product)**. This run promoted nothing, so the ratio holds. The headline is unchanged and is explicitly not a call for more tidying: **the feature pipeline needs design and approval capacity.** The census above is the strongest evidence yet for that reading — the backlog is not thin, it is 100% blocked on rulings.

## Escalations

**No Discord escalation raised, and the reasoning is recorded rather than assumed.** The escalation condition is *agreed work exhausted*, and it has not fired: [THR-1440](https://linear.app/threadbare/issue/THR-1440) is in flight and [THR-1256](https://linear.app/threadbare/issue/THR-1256) is on the shelf, both agreed, both real work. What *is* exhausted is the **promotable pool** — the T1 input — and that is a different condition with no escalation attached to it.

A Discord post this hour would also duplicate rather than add. The three asks reach Christian hourly through the briefing, and the fact that the queue is emptying was carried by run e. The one genuinely new thing — that ask 1 releases THR-1255 as well — belongs in § Needs Christian, where it now is, not on a second channel restating what the first already says. **If THR-1440 lands and THR-1256 is claimed before an approval arrives, the exhaustion condition fires for real and the next run escalates.**

**The uncloseable set is unchanged at three, and the third is still the only live one.**

- [THR-1301](https://linear.app/threadbare/issue/THR-1301) — scope shipped under THR-1349; complete, and nothing can close it.
- [THR-1380](https://linear.app/threadbare/issue/THR-1380) — every clause shipped under THR-1299; complete, and nothing can close it.
- [THR-1441](https://linear.app/threadbare/issue/THR-1441) — real work, gate met 20:07Z last night, correctly barred from the queue by the materiality bar, and picked up only by a future PR whose author happens to read its comment.

The shared mechanism is the one run d named: **a real dependency between two tickets, stated in prose, that no machinery reads.** This run found a fourth instance of that class — THR-1255's dependency on an approval — which strengthens the case for the weekly retro to look at it as a pattern rather than as three one-offs. Still one line at the retro, not a ticket from this lane.
