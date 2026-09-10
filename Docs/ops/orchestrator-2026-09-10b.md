---
lane: tb-orchestrator
run: 2026-09-10b
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-10 (run b, ~03:27–03:40Z)

**The builder is about to run out of work, and this is the first run that can put a time on it.** Three jobs shipped in the last 84 minutes, two are left, and the queue takes one per hour — so the pickup at **06:01Z (08:01 your time)** finds an empty shelf. Nothing this lane can reach will refill it.

## Needs Christian

**One thing, and it is newly urgent rather than newly discovered.**

The builder finishes the last of its queued work in about two and a half hours and then stops. It has been shipping fast — three jobs since 01:56 tonight — and there are two left. The backlog is not empty; it is 40 items deep. But every one of those items needs a decision from you before anyone can build it, so the pile cannot become work on its own.

The unblocking move is unchanged and takes one sitting: say **"rule on the backlog"** and an attended session brings you the ~14 short rulings in game terms, smallest first. That is what converts backlog into buildable work.

**A second option, newly available tonight.** The [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) has been stuck since 4 September, when an attended attempt hit three broken debug tools and had to stop. All three of those tools have since been fixed. It is 19 screenshots across nine game surfaces, one dev-server session — and unlike six days ago, the tooling to reach every surface now works. It does not feed the builder, but it is the one job that is genuinely ready for a session with you in it. [Recorded on the ticket.](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

The two standing items are unchanged and **deliberately not re-asked**: the [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) map's ten questions, and the [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no on credits.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Declined: the standing set.** Ceiling never engaged — shelf was 2 at scan, far under the 15-item backed-up threshold.

Board at scan (~03:28Z): **40 `Todo`** (15 carrying a `wayfinder:*` label, skipped unconditionally), **2 `Ready for Dev`**, **1 `In Dev`** (Parked), **2 `In Design`**. `origin/main` @ `102ef17e`.

**The `Todo` column is byte-identical to [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10.md) two hours ago** — same 40 items, same order. Nothing arrived to promote. What moved is all on the *output* side, and it is covered under § T2 and § Escalations.

### Three declines re-verified from source, not inherited

The standing set was censused on 09-08f and 09-10a. Rather than re-assert it, this run re-opened the three strongest promotion candidates — the ones whose titles read most like mechanical bugs — and read their bodies against `main`. All three hold, and each declines on its own words:

| Candidate | Reads like | Its own body says |
| -- | -- | -- |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) — no non-human cast primitive | an engine gap | *"This is a design ticket, not a patch"* — the shape of a `CastRole` widening must be decided first, per the new-node-type rule |
| [THR-1195](https://linear.app/threadbare/issue/THR-1195) — Divine Herald has no `actorType` | a one-word fix | *"a design call about what the thing is, not a mechanical drift correction"*; first Done-when is *"a recorded decision"* |
| [THR-1133](https://linear.app/threadbare/issue/THR-1133) — attended pixel sweep | a verification chore | requires an attended session; `preview_start` is refused in the unattended lane, and that refusal is an approval gate, not a fault |

**THR-1195 has already been tested against reality.** Its `stateHistory` shows a promotion to `Ready for Dev` on 2026-08-22T18:30:23Z and a demotion **84 seconds later**. Somebody made this exact mistake and reversed it inside two minutes. The decline is not caution.

### THR-1133's three blockers have all cleared — and it is still not promotable

**The one new finding this run.** THR-1133 carries three native `blockedBy` relations. All three are now `Done`:

```
THR-1413  Done  2026-09-04T12:32Z   companion mint route + ascendant surface
THR-1414  Done  2026-09-04T13:35Z   lever to force a premonition
THR-1412  Done  2026-09-06T23:28Z   debug tab strip, fireAction, omniscience
```

This is not three unrelated blockers happening to clear. **All three were filed by THR-1133's own attended attempt on 2026-09-04**, each recording a debug lever that reported success while doing nothing — which is precisely why that attempt could not discharge passes 1, 5, 6 and 7(a). The attempt's failure modes *were* the tickets, and the tickets have shipped. A re-attempt is therefore the first attempt with working tooling, not a retry of a known failure.

**It stays in `Todo`, and promoting it would be a mistake.** The blockers were never the binding constraint — the attended-session requirement is, and that is unchanged. Putting it in `Ready for Dev` would seat an unclaimable item at the head of the executor queue, which is the exact failure THR-1133 was consolidated to *end*: its own body records four unclaimable items making the queue read `healthy` while the executor had nothing to take. [Evidence written to the ticket](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) so the next attended session does not re-derive it. Comment only — no state change, no claim.

### Standing declines, unchanged and not re-derived

THR-1301, THR-1380, THR-1088, THR-984, THR-1024, THR-175, THR-1287, THR-1195, THR-1114, THR-1189, THR-1315, THR-1348, THR-1424, THR-1426, THR-1148, THR-1318, THR-1393, THR-1446, THR-1218 · 15 `wayfinder:*` · THR-1220 (HITL by its own first line) · THR-1133 (attended) · THR-1274, THR-1381, THR-1156, THR-789, THR-1155, THR-1043, THR-870, THR-791 (epics and human checkpoints).

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — measured this run, not carried forward.**

```
list_issues(label:"wayfinder:research")  → 21 issues, all Done
list_issues(label:"wayfinder:task")      →  5 issues, all Done
```

**Fifth consecutive sweep finding no agent-doable decision ticket on any open map.** Twelve open children across the three maps, every one carrying `grilling` or `prototype` — HITL by label, untouchable by this lane by rule:

- **[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children (THR-1263 … THR-1272), all HITL, none assigned. All four research tickets `Done`. Largest HITL debt on the board with zero remaining legwork.
- **[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** — sole open child THR-1232, assigned to Christian.
- **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** — one unassigned prototype, THR-1236.

No map body edited — Decisions-so-far gains a line only for tickets this lane resolves, and it resolved none.

## T2 — design staging

**Not triggered, on the same exact boundary as the last two runs — and the boundary is now load-bearing.**

Non-`Deferral` items in `Ready for Dev` at scan = **2** (THR-1443, THR-1444), against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger is *fewer than* 2, so the floor is met by exactly one item and the tier did not fire.

**Both were checked for claimability, not assumed.** Each carries a full coordination block as its latest comment — `Suggested model`, `Parallel-safe with`, `Mutex with`, `Blocked by: nothing` — so both will pass `pull-work` Step 3. The shelf is 2 *real* jobs, not 2 items that look like jobs.

**The bound is full regardless.** `In Design` holds **2 live, 0 excluded** — THR-1287 (assigned, updated 09-09 20:49Z) and THR-790 (assigned, updated 09-08 18:32Z). Both assigned, both well inside `ORCH_IN_DESIGN_STALE_DAYS` (7), so both count against `ORCH_MAX_IN_DESIGN` of 1.

**Nothing was mutated in this tier.** No comment, no state change, no assignee touched.

**And the bound still is not the constraint** — the argument from runs f/g/b/c stands unchanged and is worth restating because the shelf is now nearly empty: staging produces *a request for an attended session*, not a plan doc. This lane runs Sonnet by Christian's ruling and does not author. Raising `ORCH_MAX_IN_DESIGN` to 3 would stage a third item that no lane can advance. The constraint is design and approval capacity, and tonight it is measurably the only one.

The T2 candidates remain on record if the shelf drops: [THR-1348](https://linear.app/threadbare/issue/THR-1348) (11 of 12 seeds cannot reach the trade-route economy) is the strongest, then THR-1446, THR-1393, THR-1274.

## T3 — architecture health

**Not due, on two independent counts — no detector was run, and none is reported.**

1. **Local time is 05:27**, before `ORCH_HEALTH_SWEEP_HOUR` (06:00).
2. **A full sweep already ran on 2026-09-09** — [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-09b.md) executed all four detectors at ~20:15Z. The duty is daily, once.

`newFindings: 1` in this report's frontmatter is the THR-1133 blocker-clearance finding from § T1, **not** a detector result. No detector ran, so no detector is reported clean. Run b's standing set is unchanged and unrechecked: 7 LEAKED contracts (each with its ticket), 27 canon-staleness warnings, `sweep:rank-reach` PASS, `check:process` exit 0.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**Redundancy: not assessed this sweep** — the tier did not run at all, so the judgement half did not either. Stated rather than left to inference.

### Standing sub-duty item, carried forward unchanged

**[THR-1130](https://linear.app/threadbare/issue/THR-1130)'s park remains stale, and this lane still does not lift it.** `In Dev` + `Parked` + unassigned, holding no executor slot and blocking nothing; its child THR-1222 is merged, so the park's condition is overtaken. **Deliberately untouched** — lifting a park on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755).

## Escalations

**None posted.** The one item worth raising is going out through the designed channel rather than a second one: this report is written at ~03:40Z and the briefing rebuilds at 03:45Z, so `## Needs Christian` reaches him in five minutes. A Discord ping would duplicate that by ~10 minutes and add a second copy of an ask he has already received three times this week.

The lane did not fall through to un-agreed work. It re-verified three declines from source rather than inheriting them, measured the wayfinder frontier fresh, recorded one genuinely new fact on the ticket it belongs to, and promoted nothing because there was nothing to promote.

### The measurement behind the headline

Executor completions tonight, from `completedAt`:

```
THR-1134  01:56Z    THR-1447  02:31Z    THR-1255  03:20Z
```

Three in 84 minutes. The slot was empty at scan because it had finished THR-1255 seven minutes earlier — not because the lane is stalled. **The executor is healthy and fast; it is being starved from the front.** At WIP=1 and hourly pickup, the two remaining jobs are consumed by the 04:01Z and 05:01Z runs, which puts the first empty pickup at **06:01Z**.

**Product vs process, the week:** ~29 product / 7 process (~81% product). THR-1447 and THR-1255 both closed tonight and both move the numerator. This run promoted nothing, so the ratio is unchanged by it.

**Sub-bar notes carried to the weekly retro, not filed** (unchanged from run a unless marked): the `In Design` liveness clock counting bot comments as human activity · `strategicControlChurn.test.ts`'s docblock advertising two guards THR-1303 deleted · `undertaking-objects.ts:1490`'s stale docblock caution · the four-instance *shipped-under-a-sibling-id* class (THR-1301, THR-1380, THR-1441, THR-1088) · the canon-staleness false-positive class against the auto-generated `Docs/plans/INDEX.md` · a coordination block written into a ticket's *description* rather than as a comment still fails `pull-work` Step 3 (THR-1447, run a) · **new this run:** THR-1133's blockers cleared on 09-04 and 09-06 and no lane noticed for six days — the board has no signal for *"a ticket's dependency half went green"* other than a hand read, which is the one thing T1 is supposed to automate and cannot, because these were native relations on a ticket T1 skips for an unrelated reason.
