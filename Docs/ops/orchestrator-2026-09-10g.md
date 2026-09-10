---
lane: tb-orchestrator
run: 2026-09-10g
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-10 (run g, ~09:30–09:45Z)

**The board moved once this hour, and it moved the way run f arranged.** [THR-1446](https://linear.app/threadbare/issue/THR-1446) — the ticket run f found with a displaced coordination block — was claimed by the builder at ~08:57Z and is `In Dev`. Nothing else changed: no blocker cleared, no candidate became promotable, no state was written by this lane.

So the run's judgement budget went where it had not gone in six consecutive runs: the **redundancy / substrate-existence pass** that T3 owns and that no detector performs. It found one thing, and the finding is real.

## Needs Christian

**One question, unchanged for three hours. It is still the only thing standing between the encounter retrofit and finished.**

**Does every aftermath line need its concept tags, or only some?**
[THR-1053 — the Composition Contract's `concepts` rule](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change)

Two documents disagree. The content rulebook says every aftermath change must carry concept tags; the code that reads them treats them as optional. Somebody checked the shipped code and **the code is right** — the tags decorate a sentence that already links up fine without them. Fourteen of the sixteen retrofit encounters pass every gate; the last two — *Snow on the Pass* and *Riders Behind the Caravan* — wait only on this. **The recommendation on file is to narrow the rule.** Say *narrow it* and they finish.

**The second question from this morning has very likely answered itself.** The batch-3 session asked whether to wait a day so a fix could land first. That fix is [THR-1446](https://linear.app/threadbare/issue/THR-1446/the-consequence-draw-can-deal-a-hand-no-authored-content-can-wire) — **the builder picked it up an hour ago and is working it now.** If it finishes, the question dissolves and needs nothing from you. Named only so it is not invisible.

**Still open, deliberately not re-asked:** the [Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)'s ten questions (every piece of legwork on it finished a week ago), [THR-1198](https://linear.app/threadbare/issue/THR-1198) (whose story a run tells), the [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no, the [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133), and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — whether you mean to run the traits-wave-2 design pass yourself. That last one has sat in the design column since 15 August and is the single reason no new design job can be queued.

**Nothing was padded.** The same eight tidying jobs were left alone for the seventh run running.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers cleared: 0.** Promotion ceiling never engaged — shelf at 6, far below the 15-item backed-up threshold.

Board at scan (~09:32Z): **35 `Todo`** (15 `wayfinder:*`, skipped unconditionally) · **6 `Ready for Dev`**, all six carrying `Deferral` · **2 `In Dev`** ([THR-1446](https://linear.app/threadbare/issue/THR-1446) claimed + assigned; [THR-1130](https://linear.app/threadbare/issue/THR-1130) `Parked`, unassigned) · **1 `In Design`** ([THR-790](https://linear.app/threadbare/issue/THR-790)).

Precheck fingerprint: `rg=no git=yes test=5.43s nm=session:healthy linear=nokey freshness=current`. `nokey` is the credential-free probe reporting reachability, not a failure — and the MCP connector answered every call this run, so the board was never dark.

**The shelf lost one item and gained none.** THR-1446 left `Ready for Dev` by being *claimed*, which is the healthy exit. The six that remain all carry `Deferral`, so **program work on the shelf is 0** for the second consecutive hour.

### Every candidate declined, and they decline for one reason

Nine non-wayfinder candidates were read in full this run. **Seven of the nine decline as *wrong destination* — the ticket needs a design pass, not an executor.** That is not a queue problem; it is the same starvation reported for six runs, seen from the T1 side.

| Ticket | Verdict | Evidence |
|---|---|---|
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) — a held town is a faction position | **Wrong destination** | Sequencing gate discharged (THR-1287 `Done` 07:44:58Z, recorded by run f). Binding reason unchanged: body says *"a design ticket; plan doc before code"*; Done-when is a plan doc, intent-judged and three-way audited → T2 |
| [THR-1053](https://linear.app/threadbare/issue/THR-1053) — the `concepts` rule | **Wrong destination**, and now explicitly so | `Blocked by: nothing` in its own block. Its **latest comment** (groomer, 07:19:55Z) rules: *"Not promoted past `Todo`: it needs a design pass to write the ruling, not an executor, and inventing a coordination block for a decision I am not making would be worse than leaving the routing honest."* Promoting it would overrule that verdict → T2 |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) — no non-human cast primitive | **Wrong destination** | Body: *"This is a design ticket, not a patch"*; the shape must be decided before code per the new-node-type rule → T2 |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) — the `intelligence` object type | **Wrong destination** | *"a design decision, not an executor's call"* → T2 |
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) — ambitions below the spotlight tier | **Direction fork, not this lane's and not the executor's** | Body names three readings that are *"genuinely different games"* and says outright *"this is the fork, and it is not the executor's to settle"* |
| [THR-1318](https://linear.app/threadbare/issue/THR-1318) — the lens overlay engine | **Direction fork** + soft gate | *"changes what the player reads at the most load-bearing beat in the game"*; body also says it is *"better decided after"* THR-1213's content pass |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) — DetailModal forks its overlay | **Unmet blocker** | Its own heading: *"do not start this before THR-966"*. [THR-966](https://linear.app/threadbare/issue/THR-966) is `Idea` — verified on `stateHistory`, never left the backlog column |
| [THR-175](https://linear.app/threadbare/issue/THR-175) — `agent.sphere` field | **Unmet condition gate** | *"Unblocks when creation-sphere content starts shipping"* — it has not; and *"write a full design doc before coding"* |
| [THR-1220](https://linear.app/threadbare/issue/THR-1220) — integrated slice checkpoint | **Never promotable by construction** | Its own first line: *"Never promote to Ready for Dev; this is not executor work."* Blocked on the THR-1219 prose rewrite; its pre-flight has not run |

**Standing declines — carried, not re-derived:** THR-1380 (satisfied upstream; evidence already on the ticket, no lane may close it) · THR-1301 · THR-1088 · THR-984 · THR-1189 · THR-1148 · THR-1218 · THR-1026 · THR-964 · THR-1198 · THR-716 · THR-1381 · THR-1156 · THR-789 · THR-1155 · THR-1043 · THR-870 · THR-791 · 15 `wayfinder:*` · THR-1133 (attended).

### The eight tidying tickets — still not promoted

THR-984, THR-758, THR-871, THR-949, THR-882, THR-893, THR-852, THR-752. **Seventh consecutive run holding this line.** The shelf is 6, so the starvation clause does not apply; none of the eight carries a quotable above-bar loss or a cost/benefit line, so the materiality bar does not either. A decision under the current board, not an inherited habit.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — re-measured this run against each map's children, not carried forward.**

**Tenth consecutive sweep finding no agent-doable decision ticket on any open map.** Every open child across all three maps is `grilling` or `prototype` — HITL by label, untouchable by rule.

| Map | Open children | Research/task remaining |
|---|---|---|
| [THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict | **10**, all HITL (6 grilling, 4 prototype), none assigned | **0** — all four research tickets `Done`, last on 09-07 |
| [THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft | 1 — THR-1232, assigned to Christian | **0** |
| [THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator | 1 — THR-1236, unassigned prototype | **0** |

**The agent-doable half of all three maps is finished.** Twelve HITL tickets remain and every one of them waits on Christian. No map body was edited — this lane resolved nothing, so Decisions-so-far gains no line.

## T2 — design staging

**Triggered, and barred by the bound. Nothing staged, nothing mutated.**

Non-`Deferral` items in `Ready for Dev` = **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2.

`In Design` holds **1 live, 0 excluded**, against `ORCH_MAX_IN_DESIGN` of 1 — exactly at the ceiling:

| Issue | Assignee | Classification |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) | Christian | **Live** — assigned, so it counts on both arms of the `classifyInDesignItem` predicate regardless of staleness |

Its `updatedAt` moved to 08:34:46Z this morning, but `stateHistory` shows **no state change since it entered the column on 2026-08-15** and the touch shares a timestamp with THR-1448 to the same 200ms — a relation write, not design progress. **Twenty-six days in column; the predicate reads activity, and activity is not the same thing.** Verified against the executable predicate in `scripts/stale-claim-sweep/index.ts`, not re-derived from prose: an assigned item counts on both the stale and non-stale arms, so no warning fires and the slot stays held.

**Nothing was changed here.** Applying `Parked` or demoting is the grooming lane's remit and Christian's call.

**T2's candidate queue, strongest first:** [THR-1053](https://linear.app/threadbare/issue/THR-1053) (unchanged at the top — the only candidate blocking finished work), then THR-1448 (sequencing clear as of last hour), THR-1274, THR-1393, THR-1348, THR-1026, THR-964. **Four of those seven were declined by T1 this very run for wanting the tier that cannot open.**

## T3 — architecture health

**Detectors not due. Already run in full today at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md)**, past `ORCH_HEALTH_SWEEP_HOUR` (06:00). The daily sweep is once per day, so **no detector was run this run.** Run c's two findings stand unchanged and are not restated: `check:process` exiting 0 with three sub-checks dark, and canon-staleness 27 → 28.

**`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, and not reported as clean.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

### The judgement pass ran this run — and it is not a redundancy result

Six consecutive runs recorded *"redundancy: not assessed this sweep."* This run had no promotion to make and no item to stage, so the budget went there. **State the result precisely: I did not find two implementations doing one job.** What the pass found instead is a defect in the surface that exists to *prevent* that — which is the same failure mechanism (THR-614) one step upstream, and is reported as what it is rather than dressed as the thing that was looked for.

#### Finding 1 (new) — the company system is listed with no tick-loop presence, on the row the file calls highest-risk

`Docs/canon/systems-inventory.md` is the generated substrate-existence surface, and the required Step-0 load before any Engine-pillar design pass. Its **Companies & Group Travel** row reads `Tick phases: —` and carries the 🟠 DORMANT badge, under a heading that names these rows *"the highest-risk substrate for a design agent"*.

**Phase `2.34 "Companies"` runs on the tick path every tick** (`src/engine/orchestrator.ts:3237`, sixteen modules under `src/engine/groups/`). The same generated file lists it in **Unclassified tick phases** — the table whose stated meaning is *"no subsystem registry entry claims"* it and whose prescribed remedy is *"add it to `SUBSYSTEMS` in the generator"*.

**A registry row exists. The remedy the file prescribes is the wrong remedy.** The cause is one regex:

```
scripts/subsystems-registry.ts:213   aliases:    [..., 'companies', ...]
scripts/subsystems-registry.ts:216   phaseMatch: /\bgroups?\b/i          ← does not match "Companies"
```

Verified mechanically by running each unclassified phase name against both fields: `2.34` matches the Companies row **on its own alias list** and on no `phaseMatch` in the registry. Of the seven unclassified phases it is the **only** one with an owning row that the regex misses — for the other six the file's prescribed remedy is correct, so this is one row, not a class.

**Consequence.** A design agent doing Step 0 on anything company-, party- or band-shaped is told by the canonical surface that the subsystem has no tick-loop presence, on precisely the row the file warns will otherwise be silently duplicated. The DORMANT badge itself may well be correct — it is driven independently by `activityKeywords`, and no company plausibly forms on seed 42 in 120 ticks — **so that half is deliberately not asserted.** The `Tick phases: —` column and the unclassified listing are the unambiguous errors.

**Cost/benefit:** costs one word in one regex (`/\b(groups?|companies)\b/i`) plus `npm run generate-systems-inventory`; not fixing it leaves one of three highest-risk rows misreporting itself to every Engine design pass indefinitely.

**Logged, not filed.** No ticket was created: this is delivery machinery, the process-work throttle reserves promotion to the weekly retro, and it carries no quotable above-bar loss yet — so it is an impediment-log row, not a ticket. Recorded here for the retro to batch.

### Standing sub-duties

- **Hand-created `In Dev` tickets: none.** Both `In Dev` issues passed through `Ready for Dev` — THR-1446 verified on `stateHistory` this run (`Ready for Dev` → `In Dev` at 08:57Z), THR-1130 verified by run d.
- **Stalled work: none.** Nothing at or above `ORCH_STALLED_PICKUP_THRESHOLD` (3). THR-1130's 4-transition count is a park artifact, recorded by run e, and it is no longer on the shelf.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130)'s park remains stale, and this lane still does not lift it.** `In Dev` + `Parked` + unassigned, holding no executor slot. **Deliberately untouched** — lifting a park on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755).

### Product vs process — the week

Trailing-week measure **~31 product / 8 process (~79% product)**, unchanged — nothing closed this hour. This run promoted nothing, so it moves neither side.

**The headline is unchanged, and this run measured the reason from a new angle.** Run f said one design ruling holds the only program item. T1 can now say the same thing from its own side: **seven of nine candidates it read this hour declined because they want a design pass, and the tier that would give them one is barred by a single item nobody is working.** The build pipeline is healthy — the builder claimed work cleanly this hour, exactly as run f arranged. What is starved is design, and no lane can unstarve it.

## Escalations

**None raised, none parked.** No question needed asking that is not already in front of Christian in § Needs Christian, and Discord was not contacted — re-asking an unanswered question hourly is the noise this lane is supposed to avoid.

The one thing worth naming for the retro rather than for Christian: **Finding 1 above**, logged not filed, per the process-work throttle.
