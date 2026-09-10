---
lane: tb-orchestrator
run: 2026-09-10i
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-10 (run i, ~12:30–12:50Z)

**Today is the most productive day this board has had, and that is the problem.** Eleven tickets merged between 01:05Z and 12:26Z — roughly one an hour, sustained for eleven hours. Three of those landed since [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10h.md) scanned the board ninety minutes ago. The build shelf has gone **5 → 3** in that time and the executor slot is **empty right now**.

At the measured rate the shelf runs out **this afternoon**, and nothing on this board can refill it: every remaining candidate wants a design pass, and the design tier has been full since 15 August. This lane promoted nothing, staged nothing, and made **no Linear writes at all** this run — the bound holds and it is not this lane's to lift.

## Needs Christian

**One ask, and it now has a clock on it.**

### The builder runs out of work this afternoon — and one word from you is what refills it

Your builder has finished eleven jobs today and has **three left**. At today's pace that is roughly **two to three hours** of work remaining — empty somewhere around mid-afternoon.

There is plenty of work waiting. Seven jobs are sitting ready to be *designed* — including [the one you answered this morning](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) about a held town being a faction position, whose one prerequisite [finished at 07:44Z today](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets). None of them can move, because the design bench holds exactly one job at a time and that seat has been taken since **15 August — twenty-six days**, by:

> [**THR-790 — Traits wave 2: locations, artifacts, and draw-by-trait pools**](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Nothing has actually happened on it in those twenty-six days. It is assigned to you, which is the only reason it still counts — the rule is deliberately built so a lane can never quietly clear a job a person means to do.

**So the question is just: do you still mean to run that design pass yourself?**

- Say **"park THR-790"** and the design bench frees immediately. The next design job queues within the hour, and the builder has something to pick up when it finishes the last three.
- Say **"I'll run it"** and I will leave it exactly where it is and stop raising it.

Either answer takes a second. Not answering means the builder goes idle this afternoon with seven jobs waiting behind a seat nobody is sitting in.

**Still open, unchanged, deliberately not re-argued** — [the `concepts` rule](https://linear.app/threadbare/issue/THR-1053) (say *narrow it* and two encounters finish), the [six glossary words](https://linear.app/threadbare/issue/THR-1449) awaiting a yes (or *delegate it*, which retires that queue permanently), the [Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)'s ten questions, [THR-1198](https://linear.app/threadbare/issue/THR-1198), the [five scene images](https://linear.app/threadbare/issue/THR-876), and the [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133). Run h put all of these to you ninety minutes ago; they are listed so nothing looks dropped, not to ask twice.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers cleared: 0. No Linear write of any kind this run.** Promotion ceiling never engaged — shelf at 3, far below the 15-item backed-up threshold.

Board at scan (~12:31Z): **34 `Todo`** (15 `wayfinder:*`, skipped unconditionally) · **3 `Ready for Dev`**, all three carrying `Deferral` · **1 `In Dev`** ([THR-1130](https://linear.app/threadbare/issue/THR-1130), `Parked` and unassigned, holding no slot) · **1 `In Design`** ([THR-790](https://linear.app/threadbare/issue/THR-790)).

Precheck fingerprint: `rg=no git=no test=1.51s cu=unknown nm=session:healthy linear=nokey freshness=behind:2`. Two tokens need reading rather than passing over:

- **`linear=nokey` is the healthy state** — the credential-free probe reporting reachability, not a failure. The MCP connector answered all sixteen calls this run; the board was never dark.
- **`freshness=behind:2` and `git=no` are both home-tree artifacts, not defects.** This is autosync's read-only mirror of `main` and it trails the tip by the two commits that merged during this run's own scan window. No git state op was run here, and the report publishes by plumbing, which reads the working tree and checks nothing out — so neither token touches this run's output.

### Today's throughput, measured — this is the run's substantive finding

Eleven completions, all on 2026-09-10 UTC, read off `completedAt`:

| Merged (UTC) | Ticket |
|---|---|
| 01:05 · 01:56 · 02:31 | [THR-1002](https://linear.app/threadbare/issue/THR-1002) · [THR-1134](https://linear.app/threadbare/issue/THR-1134) · [THR-1447](https://linear.app/threadbare/issue/THR-1447) |
| 03:20 · 04:32 · 05:19 | [THR-1255](https://linear.app/threadbare/issue/THR-1255) · [THR-1444](https://linear.app/threadbare/issue/THR-1444) · [THR-1443](https://linear.app/threadbare/issue/THR-1443) |
| 07:44 · 09:52 · 10:44 | [THR-1287](https://linear.app/threadbare/issue/THR-1287) · [THR-1446](https://linear.app/threadbare/issue/THR-1446) · [THR-1450](https://linear.app/threadbare/issue/THR-1450) |
| 11:26 · 12:26 | [THR-1114](https://linear.app/threadbare/issue/THR-1114) · [THR-1195](https://linear.app/threadbare/issue/THR-1195) |

**~62 min/ticket across the day; ~38 min across the last four.** Three of the eleven (THR-1450, THR-1114, THR-1195) merged *after* run h's 10:33Z scan, which is why its shelf count of 5 is not a disagreement with this run's 3 — the shelf genuinely drained twice in ninety minutes.

**Projection, stated as a range rather than a point:** 3 items ÷ 38–62 min ≈ **1h55m to 3h05m of work left**, exhausting between roughly **14:30Z and 15:30Z**. The executor slot is free as of this scan, so the countdown is already running.

### The shelf is real, not phantom — verified this run

Worth checking precisely because an empty-looking shelf and an unclaimable one are indistinguishable from a count. **All three carry a complete coordination block in their latest comment**, so `pull-work` Step 3 will claim rather than bounce all three. Each was promoted by an attended design sitting at ~06:57Z this morning.

| Shelf item | Block | Note |
|---|---|---|
| [THR-1424](https://linear.app/threadbare/issue/THR-1424) — the two player-facing percentages | ✅ complete | **Lands first** — THR-1426 is mutex behind it |
| [THR-1426](https://linear.app/threadbare/issue/THR-1426) — tick timestamps and per-tick rates | ✅ complete | Mutex: *after* THR-1424, by both tickets' own blocks |
| [THR-1315](https://linear.app/threadbare/issue/THR-1315) — the reserved `codex` reference kind | ✅ complete | Parallel-safe with both |

The mutex ordering costs nothing at WIP = 1, but it is recorded so a pickup that reaches for THR-1426 first knows to take THR-1424 instead of deferring the hour.

### Candidates — nine non-wayfinder `Todo`, all re-read, two verdicts sharpened

Seven of nine decline as **wrong destination**: the ticket's own body asks for a design pass, and met blockers do not change that. Full re-derivation is in [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md); only what moved is recorded here.

| Ticket | Verdict | Evidence read this run |
|---|---|---|
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) | **Wrong destination → T2** | **Gate independently confirmed discharged:** its named prerequisite THR-1287 shows `completedAt` 2026-09-10T07:44:58Z. Done-when is explicitly a design handoff — *"Plan doc in `Docs/plans/` … moved to Ready for Dev with a coordination block"* |
| [THR-1053](https://linear.app/threadbare/issue/THR-1053) | **Wrong destination → T2** (top candidate) | Latest comment, 07:19:55Z today, is the groomer routing it by hand: *"it needs a design pass to write the ruling, not an executor, and inventing a coordination block for a decision I am not making would be worse than leaving the routing honest."* Not a retire verdict — a destination verdict |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) | **Unmet blocker** | Prose gate *"do not start this before THR-966"*; THR-966 re-read this run and is `Idea`, `statusType: backlog`. Correctly held |
| [THR-1318](https://linear.app/threadbare/issue/THR-1318) | **Direction fork only** | Run h's correction re-verified: THR-1213 `Done` 2026-08-28T08:36Z with slice 4 shipped, so the *"better decided after"* gate is discharged. The fork stands alone as the decline |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) · [THR-1348](https://linear.app/threadbare/issue/THR-1348) · [THR-1393](https://linear.app/threadbare/issue/THR-1393) | **Wrong destination → T2** | Each says so in its own words — *"a design ticket, not a patch"* · *"this is the fork, and it is not the executor's to settle"* · *"a design decision, not an executor's call"* |
| [THR-1133](https://linear.app/threadbare/issue/THR-1133) | **Attended** | An attended pixel pass; not executor work |

**`Idea` column: not re-scanned, and saying so rather than implying coverage.** Run h swept it in full at 10:33Z. A team-wide `updatedAt: -PT3H` sweep this run returned six issues, **none of them newly filed into `Idea`** — the two `Idea` entries (THR-1293, THR-1295) are run h's own evidence comments, not new work. So there was nothing new to find, and re-deriving the same verdicts is the dump this report forbids. The standing gap — T1's `Scan` step prescribes two calls while its `Parse` step says *"for each `Todo` / `Idea` candidate"* — is unchanged and already routed to the retro.

**Standing declines, carried not re-derived:** THR-1380 · THR-1301 · THR-1088 · THR-984 · THR-1189 · THR-1148 · THR-1218 (blocker THR-1043 still `Todo`) · THR-1026 · THR-964 · THR-1198 · THR-716 · THR-1381 · THR-1156 · THR-789 · THR-1155 · THR-1043 · THR-870 · THR-791 · 15 `wayfinder:*`.

**The eight tidying tickets — ninth consecutive run holding the line.** THR-984, THR-758, THR-871, THR-949, THR-882, THR-893, THR-852, THR-752. The shelf is thin enough that promoting one would be *visibly* padding a starved queue with process work, which is precisely what the materiality bar exists to prevent. None carries a quotable above-bar loss or a cost/benefit line. **Not promoted, and the thin shelf is not a licence.**

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2). Twelfth consecutive sweep with nothing agent-doable.**

Re-measured **team-wide by label** this run rather than carried from run h, because it is a one-call check and the claim is strong:

- **`wayfinder:research` — 21 issues, all 21 `Done`.** Most recent: THR-1435 and THR-1400 (Wayfinder map THR-1396).
- **`wayfinder:task` — 5 issues, all 5 `Done`.**

| Map | Open children | Agent-doable |
|---|---|---|
| [THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) Physical Conflict | **10** — 6 `grilling`, 4 `prototype`, none assigned | **0** |
| [THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft | 1 — THR-1232, assigned to Christian | **0** |
| [THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator | 1 — THR-1236, unassigned prototype | **0** |

**Twelve HITL tickets remain and every one waits on Christian.** No map body was edited — this lane resolved nothing, so Decisions-so-far gains no line. No `grilling` or `prototype` ticket was touched.

## T2 — design staging

**Triggered, and barred by the bound for the ninth consecutive run. Nothing staged, nothing mutated.**

Non-`Deferral` items in `Ready for Dev` = **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. Fourth consecutive hour at zero.

`In Design` holds **1 live, 0 excluded**, against `ORCH_MAX_IN_DESIGN` of 1 — exactly at the ceiling:

| Issue | Assignee | Days in column | Classification |
|---|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) | Christian | **26** (entered 2026-08-15) | **Live** — the *assigned + stale* arm of `classifyInDesignItem`, which counts and warns rather than excluding |

**This is the THR-1382 asymmetry working exactly as designed, and it is still the right design.** An *unassigned* dead item would be excluded and the tier would free itself; an *assigned* one counts, because a bound that stopped counting a person's staged work would let this lane stage a second job on top of it. The exit is `Parked` — a human's deliberate act — and applying it is the grooming lane's remit and Christian's call, not this lane's. **Nothing was changed here.** Its `updatedAt` of 08:34:46Z this morning is a relation write shared to within 200ms with THR-1448, not design progress; `stateHistory` shows no state change since 15 August.

**What is new is the cost.** For eight runs this was a starved tier with no deadline attached. This run it acquires one: the shelf that has been absorbing the slack is three items from empty, so the ninth barred run is the first where the bound has a measurable consequence within the day. That is the § *Needs Christian* ask, and it is deliberately routed there rather than filed as a process ticket — the scheduled-lane throttle sends findings about the delivery machine to the impediment log and the weekly retro, not to a ticket from this lane, and the one-word human decision is a faster fix than any rule change.

**T2's candidate queue, strongest first, all seven ready the moment the bench frees:** [THR-1053](https://linear.app/threadbare/issue/THR-1053) (the only candidate blocking finished work — two encounters wait on it), [THR-1448](https://linear.app/threadbare/issue/THR-1448) (this morning's director direction, gate discharged 07:44Z), THR-1274, THR-1393, THR-1348, THR-1026, THR-964.

## T3 — architecture health

**Detectors not due, and none was run. Nothing below is being reported as clean on an unrun check.**

- **Daily sweep already ran today** at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md), past `ORCH_HEALTH_SWEEP_HOUR` (06:00). Its two findings stand unchanged and are not restated: `check:process` exiting 0 with three sub-checks dark, and canon-staleness 27 → 28.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, and not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this sweep.** [Run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md) ran the judgement pass and found the Companies `phaseMatch` regex defect. Re-running it two hours later would re-list one finding. Stated plainly — the pass did not happen, and no reachability result is being dressed as one.

**New findings this run: 0.** The throughput measurement above is a T1 board fact, not an architecture finding, and it is counted as such.

### Standing sub-duties

- **Hand-created `In Dev` tickets: none.** `In Dev` holds only THR-1130, carried from run d.
- **Stalled work: none.** Nothing at or above `ORCH_STALLED_PICKUP_THRESHOLD` (3). All three shelf items entered `Ready for Dev` at ~06:57Z today with zero prior claims.
- **In Design: 1 live, 0 excluded** — THR-790, assigned, 26d → warned, still counted. Printed rather than skipped: its absence is indistinguishable from a tier that did not run.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130)'s park remains stale, and this lane still does not lift it.** `In Dev` + `Parked` + unassigned, holding no executor slot. **Deliberately untouched** — lifting a park on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755).

### Product vs process — the week

Trailing-week measure **~41 product / 10 process (~80% product)**, up nine on the product side on today's eleven merges alone; of those, nine are product (engine, content, UI, bugs) and two are process (THR-1443 session-precheck, THR-1134 the incident bundle). This run promoted nothing, so it moves neither side by its own action.

**The headline is unchanged in shape and changed in urgency.** The build pipeline is not merely fine — it is the best-performing part of this project, clearing a job an hour for eleven hours. Decision throughput is what is starved, on both the design side (seven jobs behind a bench of one) and the arbitration side (six glossary words and twelve map questions that only Christian can answer). Up to now that starvation was absorbed by a shelf deep enough to hide it. **Today the builder ate the buffer.**

## Escalations

**None raised, none parked.** Discord was not contacted: `keep-work-flowing-cc` owns the doorbell and fires at :45, roughly fifteen minutes after this report lands, which is well inside the two-hour window before the shelf empties. Raising the same ask on a second channel would be duplication, not urgency.

Agreed work is not exhausted — there is a great deal of it and it is **design-blocked, not direction-blocked** — so the stop-and-ask clause does not fire.

For the retro rather than for Christian, one row, sharpened rather than new:

1. **`ORCH_MAX_IN_DESIGN` has now barred T2 for nine consecutive runs, and as of this run the bar has a measurable same-day cost** (a builder clearing ~1 job/hour against a 3-job shelf, with seven design-gated candidates queued behind an assigned item untouched for 26 days). Recorded with the count and the cost so the weekly retro can weigh whether the *assigned* arm of `classifyInDesignItem` wants a companion escape — an assigned item stale past some far longer threshold nudging its assignee rather than silently holding the bench. **Not filed as a ticket** (scheduled-lane process throttle), and **not acted on in-run**: the constant is a deliberate THR-1382 decision, and one word from Christian fixes today's instance faster than any rule change would.
