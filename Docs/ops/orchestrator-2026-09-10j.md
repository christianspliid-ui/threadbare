---
lane: tb-orchestrator
run: 2026-09-10j
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-10 (run j, ~13:27–13:40Z)

**Two jobs left on the shelf, the builder is idle, and this run found a third job that was ready all along and unreachable.** [THR-1315](https://linear.app/threadbare/issue/THR-1315) merged at **13:27:42Z** — the twelfth completion today — taking the shelf **3 → 2** with the executor slot empty as of that moment.

The substantive work of this run was not promotion; nothing was promotable. It was reading two tickets nobody had re-read since their premises changed, and finding that **both are further along than the board says**:

- [**THR-1130**](https://linear.app/threadbare/issue/THR-1130) (retrofit batch 3, `High`) is parked on a question that **events have answered** — and it is structurally unreachable from the queue where it sits.
- [**THR-1220**](https://linear.app/threadbare/issue/THR-1220) (the integrated slice checkpoint, `High`) has had **all three of its blockers `Done` since last night** and nothing has advanced it or surfaced it.

Two Linear comments were written recording those verdicts. **No state was changed, nothing was claimed, no assignee was touched.**

## Needs Christian

**Your lead ask is unchanged and is not re-argued here** — [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10i.md) and the 13:00 briefing put the [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) question to you well, and it still stands: *do you still mean to run that design pass yourself, or not?* One word either way.

Two things changed since that briefing, and both are worth a minute.

### One item comes **off** your list — the encounter batch needs nothing from you

This morning a session drafted the batch-3 brief and asked you one yes/no: *should we wait a day for a gate fix before running it?* Its own recommendation was **yes, wait**.

**The thing it was waiting for finished at 09:52 this morning**, and it landed the generous version of the fix rather than the cheap one. So I checked what each of your possible answers would now produce:

- If you had said **wait** — the wait is over. Run it.
- If you had said **don't wait** — it would already have run, using a workaround it no longer needs.

**Both answers now lead to exactly the same next step, and the better one.** There is no decision left in it. The batch is one encounter — *Leave a Shrine Offering* — and it is ready to run.

What it needs is not a word from you but a **session to pick it up**, and that is where it is stuck: the ticket is sitting in a state the automatic queue cannot see. Tomorrow's tidy-up pass will free it; an attended session could do it in a minute. Flagging it because it is real, scoped work sitting idle while the builder has nothing to do.

### The thing you asked for in August is one step away

Back in August you said you had never seen a prototype where *all* the components from different systems were at an acceptable state at the same time. The checkpoint built from that — **[playing all five encounters end to end in one sitting](https://linear.app/threadbare/issue/THR-1220)** — has been waiting on three pieces of work. **The last of them finished last night.** It is unblocked.

**I am deliberately not inviting you to it yet**, because your own rule says a review ask only goes out when everything is level, and one step is still owed: an agent has to play all five through first and fix or file anything broken, so you are never asked to judge around a known-bad neighbour. That pass has never been run.

So this is a heads-up, not an invitation: **the integrated playthrough is now one agent session away.** It is probably worth doing right after the shrine encounter above, so you are not reviewing a roster whose first encounter is about to be rewritten.

**Still open, unchanged, listed so nothing looks dropped, not to ask twice:** [the `concepts` rule](https://linear.app/threadbare/issue/THR-1053), the [six glossary words](https://linear.app/threadbare/issue/THR-1380), the [Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)'s ten questions, [THR-1198](https://linear.app/threadbare/issue/THR-1198), the [five scene images](https://linear.app/threadbare/issue/THR-876), and the [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133).

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers cleared: 0. No state write of any kind.** Two comments written (below). Promotion ceiling never engaged — shelf at 2, far under the 15-item backed-up threshold.

Board at scan (~13:28Z): **34 `Todo`** (15 `wayfinder:*`, skipped unconditionally) · **2 `Ready for Dev`**, both carrying `Deferral` · **1 `In Dev`** ([THR-1130](https://linear.app/threadbare/issue/THR-1130), `Parked` and unassigned, holding no slot) · **1 `In Design`** ([THR-790](https://linear.app/threadbare/issue/THR-790)).

Precheck fingerprint: `rg=no git=no test=1.28s cu=unknown nm=session:healthy linear=nokey freshness=behind:2`. `linear=nokey` is the healthy credential-free reachability signal, not a failure — the MCP connector answered all eleven calls this run. `freshness=behind:2` and `git=no` are home-tree mirror artifacts; no git state op was run here and the report publishes by plumbing.

### The shelf, and the countdown

| Shelf item | Block | Note |
|---|---|---|
| [THR-1424](https://linear.app/threadbare/issue/THR-1424) — the two player-facing percentages | ✅ complete | **Lands first** — THR-1426 is mutex behind it |
| [THR-1426](https://linear.app/threadbare/issue/THR-1426) — tick timestamps and per-tick rates | ✅ complete | Mutex: *after* THR-1424, by both tickets' own blocks |

Both re-verified claimable this run: complete coordination blocks in their latest comments, so `pull-work` Step 3 claims rather than bounces. **Non-`Deferral` program work on the shelf: 0** — fifth consecutive hour.

Twelve completions today. Adding THR-1315 (13:27Z) to [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10i.md)'s eleven gives **~62 min/ticket across the day, ~31 min across the last five**. Two items at that spread projects exhaustion between roughly **14:30Z and 15:30Z**, and the slot is free now, so the clock is already running.

### THR-1130 — the park is discharged by events, and the ticket is unreachable

This is the run's most useful finding and it required reading four comments rather than a field.

**What the board says:** `In Dev`, `Parked`, unassigned, `blockedBy` THR-1446 and THR-1053.

**What actually happened.** At 07:19Z the groomer lane cleared an older, genuinely stale park and routed the ticket to `Ready for Dev`. At 08:14Z a session claimed it, drafted the batch-3 brief ([PR #1874](https://github.com/christianspliid-ui/threadbare/pull/1874), docs-only), and **deliberately re-parked** it under the standing ruling-2 loop with one yes/no for Christian: *"Do we wait a day for THR-1446 before running batch 3? My recommendation: yes."* It cleared its own assignee and left the state at `In Dev`.

**[THR-1446](https://linear.app/threadbare/issue/THR-1446) went `Done` at 2026-09-10T09:52:46Z** ([PR #1875](https://github.com/christianspliid-ui/threadbare/pull/1875), commit `5314be8f`), and it took **option 1 + 2 of its four** — shipping the `$ascendant` and `$here` scene sentinels — rather than the cheap weight-to-zero option 3. That is exactly the fix the park was waiting on: Shrine Offering was dealt `thread` (unwirable everywhere — nothing bound `ascendantId`/`mortalId`) and `place` (unwirable on a self-targeted encounter). **Both now bind.**

**The verdict, and why it is stronger than "the wait is over":** *yes, wait* → the wait ended at 09:52Z, run it; *no, don't wait* → it would already have run, on a two-swap fallback it no longer needs. **Both branches converge on the same next action**, and the recommended branch is the one that materialised, with the better outcome. There is no answer left that changes anything — so this is moot, not pending. That is a technical verdict on a discharged condition, which is this lane's to make.

**The part nobody had written down:** the ticket is `In Dev` ∧ `Parked` ∧ `assignee: null`. `pull-work` builds candidates from **`Ready for Dev` ∧ `assignee: null`**, so it never sees this ticket. The shape that correctly frees the WIP slot is the same shape that makes the work unreachable. Owners who *can* move it: `daily-backlog-grooming` (did exactly this at 07:19Z; next pass tomorrow) or an attended session. **This lane is read-only on `In Dev` by its own non-negotiable, so it commented rather than wrote** — [comment `86817257`](https://linear.app/threadbare/issue/THR-1130).

**Not acted on, deliberately, and the reasoning recorded so it is not re-litigated hourly.** Moving `In Dev → Ready for Dev` violates none of the three literal non-negotiables, and the T3 anti-normalisation ruling is scoped to *hand-created* `In Dev` tickets (this one has a proper `Ready for Dev` history). The invariant still wins: *"a lane that may rewrite `In Dev` on inference will eventually do it to live work."* The correct owner exists, runs daily, and has demonstrated the exact action today. What the situation buys is urgency, not authority.

### THR-1220 — unblocked since last night, and nothing noticed

[THR-1220](https://linear.app/threadbare/issue/THR-1220) is the integrated slice checkpoint, `High`, born from Christian's 2026-08-24 remark that he had never seen every component at an acceptable state simultaneously. **All three declared blockers are `Done`:**

| Blocker | Cleared |
|---|---|
| [THR-1219](https://linear.app/threadbare/issue/THR-1219) — slice prose to the 08-15 standard | 2026-08-24T15:40:07Z |
| [THR-1223](https://linear.app/threadbare/issue/THR-1223) — nudge corpus to Prose Doctrine v2 | 2026-08-25T20:16:49Z |
| [THR-1222](https://linear.app/threadbare/issue/THR-1222) — retrofit batch 2, the camp six | 2026-09-09T21:46Z |

Unblocked **~16 hours**, absent from the briefing, and not named by any prior run's candidate table. Correctly **not promoted** — its own body reads *"Never promote to Ready for Dev; this is not executor work"* — but that is a decline reason, not a reason for nothing to happen.

What it owes is protocol step 1: an **agent pre-flight** — play all five roster encounters end-to-end, assert prose/bands/chip grants/no legacy patterns/console clean, fix or file every defect *before* inviting Christian. Never run. Under the level-system rule (`Docs/canon/process.md` § User review interface, rule 5) that gate is what keeps him from ruling around a known-broken neighbour, so the honest status is **unblocked, un-preflighted** — owed a session, not a review ask.

**One ambiguity recorded rather than ruled:** the declared blocker list omits batch 3, but THR-1130's 07:19Z grooming comment states `shrine_offering` *"is roster encounter #1 of the integrated-slice checkpoint THR-1220, so it gates that review."* Two records disagree about whether the roster is level. Cheap resolution: run batch 3 first, then pre-flight the five — rather than pre-flighting a roster whose first encounter is about to be rewritten. Written to the ticket as a sequencing note ([comment `aeeac416`](https://linear.app/threadbare/issue/THR-1220)); **no blocker relation added**, since inventing one would be this lane choosing the sequencing rather than surfacing the conflict.

### Candidates — nine non-wayfinder `Todo`, verdicts carried

Seven decline as **wrong destination**: the ticket's own body asks for a design pass, and met blockers do not change that. Full derivations in [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md) and [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10i.md); only movement is recorded.

| Ticket | Verdict | Movement this run |
|---|---|---|
| [THR-1220](https://linear.app/threadbare/issue/THR-1220) | **HITL, never promotable** | **New** — blockers verified all `Done`; pre-flight owed. See above |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) · [THR-1053](https://linear.app/threadbare/issue/THR-1053) | **Wrong destination → T2** | None. THR-1053 remains T2's strongest candidate — two encounters wait on it |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) | **Unmet blocker** | None — THR-966 still `Idea` |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) · [THR-1348](https://linear.app/threadbare/issue/THR-1348) · [THR-1393](https://linear.app/threadbare/issue/THR-1393) | **Wrong destination → T2** | None |
| [THR-1318](https://linear.app/threadbare/issue/THR-1318) | **Direction fork** | None |
| [THR-1133](https://linear.app/threadbare/issue/THR-1133) | **Attended** | None |

**`Idea` column: not re-scanned, and saying so rather than implying coverage.** Run h swept it at 10:33Z; nothing new has been filed into it. The standing spec gap — T1's `Scan` step prescribes two calls while its `Parse` step says *"for each `Todo` / `Idea` candidate"* — is unchanged and already routed to the retro.

**Standing declines, carried not re-derived:** THR-1380 · THR-1301 · THR-1088 · THR-984 · THR-1189 · THR-1148 · THR-1218 · THR-1026 · THR-964 · THR-1198 · THR-716 · THR-1381 · THR-1156 · THR-789 · THR-1155 · THR-1043 · THR-870 · THR-791 · THR-175 · 15 `wayfinder:*`.

**The eight tidying tickets — tenth consecutive run holding the line.** THR-984, THR-758, THR-871, THR-949, THR-882, THR-893, THR-852, THR-752. None carries a quotable above-bar loss or a cost/benefit line. **A two-item shelf is not a licence** — promoting process work into a starved queue is visibly padding, which is what the materiality bar exists to prevent. Note that this run instead found *two* pieces of real product work already sitting ready, which is the honest answer to a thin shelf.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2). Thirteenth consecutive sweep with nothing agent-doable.**

Re-measured team-wide by label this run rather than carried — two calls, and the claim is strong enough to be worth re-proving:

- **`wayfinder:research` — 21 issues, all 21 `Done`.**
- **`wayfinder:task` — 5 issues, all 5 `Done`.**

| Map | Open children | Agent-doable |
|---|---|---|
| [THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) Physical Conflict | **10** — 6 `grilling`, 4 `prototype`, none assigned | **0** |
| [THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft | 1 — THR-1232, assigned to Christian | **0** |
| [THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator | 1 — THR-1236, unassigned prototype | **0** |

**Twelve HITL tickets remain and every one waits on Christian.** No map body edited — this lane resolved nothing, so Decisions-so-far gains no line. No `grilling` or `prototype` ticket touched.

## T2 — design staging

**Triggered, and barred by the bound for the tenth consecutive run. Nothing staged, nothing mutated.**

Non-`Deferral` items in `Ready for Dev` = **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2.

`In Design` holds **1 live, 0 excluded**, against `ORCH_MAX_IN_DESIGN` of 1 — exactly at the ceiling:

| Issue | Assignee | Days in column | Classification |
|---|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) | Christian | **26** (entered 2026-08-15) | **Live** — the *assigned + stale* arm of `classifyInDesignItem`: counts, warns, is not excluded |

Verified live this run: `updatedAt` 08:34:46Z is the same relation write it shared with THR-1448, not design progress; `stateHistory` shows no state change since 15 August. **Nothing was changed here** — the exit is `Parked`, a human's deliberate act, and applying it is the grooming lane's remit and Christian's call.

**One thing to be honest about, since this tier has now reported the same bar ten times.** The bound genuinely blocks staging. But this run demonstrates that the shelf's thinness was **not solely** the design bench's fault: two pieces of `High`, fully-scoped, already-designed product work ([THR-1130](https://linear.app/threadbare/issue/THR-1130) batch 3, [THR-1220](https://linear.app/threadbare/issue/THR-1220) pre-flight) were sitting ready and unreachable for hours. A thin shelf reading as "we need more design" was, at least in part, "we lost track of two jobs". That sharpens the T2 story rather than replacing it — the seven design-gated candidates are still real, and the bench is still full.

**T2's candidate queue, strongest first, unchanged:** [THR-1053](https://linear.app/threadbare/issue/THR-1053), [THR-1448](https://linear.app/threadbare/issue/THR-1448), THR-1274, THR-1393, THR-1348, THR-1026, THR-964.

## T3 — architecture health

**Detectors not due, and none was run. Nothing below is reported as clean on an unrun check.**

- **Daily sweep already ran today** at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md), past `ORCH_HEALTH_SWEEP_HOUR` (06:00). Its two findings stand unchanged and are not restated.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this sweep.** [Run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md) ran the judgement pass. Stated plainly — the pass did not happen here, and no reachability result is dressed as one.

### New finding — the stalled-work detector has been reading the wrong slice, and has a false-positive class behind it

**New findings this run: 1.** This is a defect in one of T3's own standing sub-duties, found by applying it properly.

**The measurement.** [THR-1130](https://linear.app/threadbare/issue/THR-1130)'s `stateHistory` carries **five `Ready for Dev → In Dev` transitions with no `Done`** — 2026-08-15 21:03Z, 08-17 18:03Z, 08-22 14:02Z, 09-04 06:02Z, 09-10 08:04Z. `ORCH_STALLED_PICKUP_THRESHOLD` is **3**. The detector fires, and has been firing for weeks.

**Prior runs reported `stalled work: none`.** Run i's evidence line reads *"All three shelf items entered `Ready for Dev` at ~06:57Z today with zero prior claims"* — which is true, and is the wrong population. The duty says *"an issue claimed N times without a merge"*; a claimed issue is by definition no longer on the shelf, so **a check scoped to `Ready for Dev` can never find one.** The detector's only possible subjects live in the `In Dev` slice, which is exactly where it was not looking. A green result on an uncovered condition — the pathology this tier exists to catch, in this tier's own report.

**And the judgement, which is why the fix is not simply "count harder".** THR-1130 is a **batch-cadence ticket by design**: ruling 2 requires it to re-park for Christian's approval after each batch brief, so claim → park → re-claim is its intended shape, not repeated failure. Batch 1 shipped, batch 2 shipped. Five cycles here means the loop is *working*. So the raw count is a **false positive**, and reporting it as a stalled ticket would be its own kind of wrong.

**What this means for the duty, recorded for the weekly retro rather than filed as a ticket** (scheduled-lane process throttle): the check needs both halves fixed together — scope it to `In Dev` (or it can never fire) *and* make it park-aware (or it fires forever on every park-and-resume ticket). Fixing only the first half would replace a silent miss with a permanent false alarm, which is worse. **Cost:** ~1h. **Cost of not fixing:** a stalled-work duty that has been structurally incapable of firing since it was written, on a board that has run 5-cycle tickets for a month.

### Standing sub-duties

- **Hand-created `In Dev` tickets: none.** `In Dev` holds only THR-1130, whose `stateHistory` shows a proper `Ready for Dev → In Dev` path — verified this run, not assumed.
- **Stalled work: 1 raw hit, judged a false positive.** THR-1130 at 5 cycles; see above. No ticket surfaced as stalled.
- **In Design: 1 live, 0 excluded** — THR-790, assigned, 26d → warned, still counted. Printed rather than skipped: its absence is indistinguishable from a tier that did not run.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130)'s park is discharged and this lane still does not lift it.** Reasoning recorded under T1 rather than repeated.

### Product vs process — the week

Trailing-week **~42 product / 10 process (~81% product)**, up one on the product side with THR-1315. This run promoted nothing, so it moves neither side by its own action.

**Headline, and it has changed shape since run i.** Yesterday's reading was "the build pipeline is the healthiest part of this project; decision throughput is starved." That is still true. What this run adds is that **the starvation is partly a bookkeeping loss, not only a decision loss** — two `High`, fully-designed, unblocked jobs were sitting unreachable while the shelf was reported as empty of program work. The design bench being full is real; so is the fact that nobody had re-read two tickets whose premises changed underneath them. **The feature pipeline needs design and Christian — and also needs someone to notice when work becomes ready.**

## Escalations

**None raised, none parked.** Discord was not contacted: `keep-work-flowing-cc` owns the doorbell and fires at :45, roughly five minutes after this report lands, and inside the window before the shelf empties. Raising the same asks on a second channel would be duplication, not urgency.

Agreed work is **not** exhausted — this run found two unblocked pieces of it — so the stop-and-ask clause does not fire.

For the retro rather than for Christian, two rows:

1. **The stalled-work sub-duty has never been able to fire** (scoped to `Ready for Dev`, where a claimed issue cannot be), and fixing the scope alone would convert a silent miss into a permanent false alarm on park-and-resume tickets. Both halves want fixing together. Evidence and cost above.
2. **`ORCH_MAX_IN_DESIGN` has now barred T2 for ten consecutive runs.** Carried from [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10i.md) with its cost measurement intact, and **sharpened**: part of the shelf pressure attributed to this bar was in fact two unreachable ready jobs, so the bar's measured cost is smaller than yesterday's framing implied. Worth the retro knowing before it weighs whether the *assigned* arm of `classifyInDesignItem` wants a companion escape. **Not filed as a ticket, not acted on in-run.**
