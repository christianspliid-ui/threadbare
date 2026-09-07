---
lane: tb-orchestrator
run: 2026-09-07f
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-07 (run f, ~05:26–05:35Z)

**The build queue reached zero during this run.** [THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level) — the single item [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) reported as the whole shelf — was claimed at 05:21Z and merged at 05:28Z ([PR #1837](https://github.com/christianspliid-ui/threadbare/pull/1837), `e4e3706a`). `Ready for Dev` now holds **nothing**, re-queried after the merge to be sure.

This run promoted nothing, and that is not a shortage of work. It is one bound, and the report is mostly about why the lane cannot route around it.

## Needs Christian

**The build shelf is empty — actually zero, for the first time.** The last queued item merged at 07:28 your time. The next automatic build run has nothing to pick up, and so does every one after it until something reaches the queue.

**It is not that there is no work.** There are 53 things waiting. But the six nearest ones all need the same thing before anyone can build them: *a decision about what something should be.* Not a big one — "is a Divine Herald a person or a thing", "does a trade toll actually move money or should we stop claiming it does". Each is half an hour of your time or a design session's.

**The machine has a path for exactly this** — it takes the next such item and sets it up for a design session. It cannot use that path right now, because it is only allowed to hold one thing in design at a time, and **two are already sitting there waiting on you**:

- [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — **23 days**, assigned to you. The only technical thing it waited on finished on 26 July. The question is just whether you mean to run that pass yourself. *"I'll take it"* or *"park it"* — either answer works, and one of them frees the slot.
- [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card-vocabulary) — **19 days**, unassigned. Your own August note that the action cards are too verbose. Worked up enough that a session could start on it cold.

**One word on either restarts the supply.** This is the fifth consecutive run reporting it and the first where it is actually costing build hours rather than being a background note.

The camp six ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)) is still the faster lever if you only have one answer in you — *"batch 2, run the six"* puts content work on the shelf the same hour, without a design session. That one is already the lead in your hourly brief; it is repeated here only because an empty queue changes what it is worth.

**The wayfinder questions are unchanged and are not restated.** Four maps open; every remaining question on all four is one for you rather than for an agent.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **53 `Todo`** (50 + 3), **0 `Ready for Dev`**, **3 `In Dev`** — of which two carry `Parked` and the third ([THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level)) merged mid-run. The executor's WIP=1 slot is now free with nothing to put in it.

**No new `Todo` candidate has arrived since run e.** Every `updatedAt` in the scan predates that run's close at 04:50Z, so all declines are standing and carry their evidence in runs a–e rather than being re-derived here.

### Two standing declines re-verified rather than carried on trust

The shelf being empty raises the value of a wrong decline, so the two candidates that read most like concrete bugs — the shape most likely to have been misfiled as design work — were read in full. **Both self-declare design-first in their own Done-whens. The classification holds.**

| Issue | What its own body says |
|---|---|
| [THR-1195](https://linear.app/threadbare/issue/THR-1195/hexsend-heralds-divine-herald-has-no-actortype-so-it-is-located-but) — herald has no `actorType` | *"Whether a Divine Herald* is *an individual — or wants its own `ActorType`, or should be an attachment rather than an actor — is a design call about what the thing is."* Done-when 1 is literally *"a recorded decision"* |
| [THR-1189](https://linear.app/threadbare/issue/THR-1189/taxrate-is-stamped-on-trades-with-routes-and-read-by-nothing-the-toll) — `taxRate` written, never read | *"Wiring a toll into the economy is a new flow (who pays, out of what, on what cadence…) — it wants a design pass rather than an executor's judgement call"* |

THR-1195 carries harder evidence than its prose: its `stateHistory` shows it was promoted to `Ready for Dev` on 2026-08-22T18:30:23Z and returned to `Todo` at **18:31:47Z — 84 seconds later**. It has already been offered to the executor once and refused. Promoting it again on an empty shelf would repeat that exactly.

### The one decline with a moving date

[THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) — unmet time gate, *"review on/after 2026-09-08"*. **The window opens tomorrow.** The first run after 00:00Z on 09-08 may promote it. It is one item and it is process work, so it will not by itself refill a shelf.

**Wayfinder issues skipped unconditionally**, whatever their blockers say: 21 of the 53 `Todo` items carry a `wayfinder:*` label and are T1.5's input, never T1's.

## T1.5 — wayfinder sweep

**Four open maps. AFK tickets resolved: 0. HITL frontier surfaced: unchanged.**

| Map | Frontier | Disposition |
|---|---|---|
| [THR-1396](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) — Undertakings | 5 | 3 `grilling` + 2 `prototype` — all HITL |
| [THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — Physical Conflict | 9 | all `grilling` / `prototype` — HITL |
| [THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) — Powers & Spellcraft | 1 | `prototype` — HITL |
| [THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) — Item Generator | 1 | `prototype` — HITL |

**Budget used: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — because no ticket was eligible, not because the slots went unspent.** The board holds no `wayfinder:research` ticket at all, and the single `wayfinder:task`, [THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells), is off the frontier: re-checked this run via `get_issue(includeRelations:true)`, native `blockedBy: THR-1402`, a `wayfinder:prototype` still `Todo`. Every remaining frontier ticket across all four maps is HITL and untouchable by rule.

## T2 — design staging

**Triggered, and barred. Nothing was staged and nothing was mutated.**

- **Shelf: 0 non-`Deferral` items** in `Ready for Dev`, against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger is *fewer than* 2, so this tier armed — as it did on run e, now against an empty rather than a thin shelf.
- **`In Design` bound: `ORCH_MAX_IN_DESIGN` is 1 and the executable predicate counts 2 as live.** Staging is barred.

```
In Design: 2 live, 0 excluded (THR-790 assigned Christian, last activity 2026-09-03 → 4d by the shipped
  predicate / 23d since entering the column; THR-1002 unassigned, last activity 2026-09-03 → 4d by the
  predicate / 19d since entering the column). Neither carries `Parked`. Nothing warned, nothing mutated.
```

`classifyInDesignItem` in `scripts/stale-claim-sweep/index.ts` is what actually ran and it returns `live` for both, so both count. The skill's tie-break is explicit — *"when this prose and that function disagree, the function is what actually ran"* — and it is obeyed here even though run e's Finding 1 showed **why** that function returns `live`, which is that warn-only sweep comments keep resetting the staleness clock it reads.

**Neither item was mutated.** Applying `Parked` or demoting to `Todo` would free the tier immediately and is exactly the write this lane may not make: that column is warn-only here by rule, and the disposition belongs to `daily-backlog-grooming` and to Christian.

## T3 — architecture health

**Skipped — already run today, and correctly so.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) was the first run after `ORCH_HEALTH_SWEEP_HOUR`, ran all four detectors unpiped, and also carried the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)).

**No detector was run this run, and none is reported.** The daily budget is spent; re-running them 36 minutes later would produce the same four results and train the reader to skip the tier — which is the failure this tier is written to avoid.

**Redundancy: not assessed this run** (nor on run e). The standing redundancy candidate from the 09-01 pass was THR-1422, which merged this run — so that one is now closed, and the next redundancy pass has no carried-over item.

## Escalations

**No Discord message sent, and that is a deliberate call rather than an omission.**

`keep-work-flowing-cc` pinged the same channel at **05:01Z — 25 minutes before this run** — already leading with *"the build shelf is down to one item and no content work at all. Both design slots are held by things waiting on you."* The only thing this run adds is that "one item" is now "none". Sending a second lane's message 25 minutes behind the first, saying the same thing one number lower, is noise — and the Discord doorbell is that lane's by boundary rule, not this one's.

The corrected number goes in `## Needs Christian` above, which `keep-work-flowing-cc` step 2.6 reads out of the newest sibling report. Its next run is at :45, **nineteen minutes away.** That is the designed path and it is faster than a duplicate ping would be useful.

**Agreed work is not exhausted, so the stop-and-ask condition did not arise.** The constraint is a bound this lane must respect, not a question it needs answered — and the one thing that moves the bound is an attended session, which belongs in the briefing rather than as a question to a channel.

### Carried to the retro — a materiality premise that expired this run

Run e logged its Finding 1 (**the `In Design` staleness exclusion is unreachable for exactly the items it was written for** — warn-only comments reset the clock the predicate reads, so the `stale-unassigned` arm can never fire) as a log row rather than a ticket, on this stated reasoning:

> *"not fixing costs nothing this week, because the bound is genuinely correct right now — two real design items are genuinely waiting on Christian, and staging a third would not help. That is below the materiality bar… It becomes material the moment one of those two items clears."*

**That premise expired 36 minutes later, by a route it did not anticipate.** Neither item cleared. The shelf emptied instead. The bound is no longer harmlessly correct — it is the sole reason the tier that exists to refill an empty shelf cannot run, and the cost is now countable in idle executor runs rather than hypothetical.

**Still not filed as a ticket** — scheduled lanes do not file process tickets, and the weekly retro is the single promotion point. But the cost line the retro will want is now quotable rather than speculative:

> *Costs ~one executor run to fix (exclude the lane's own bot comments from the activity signal, or measure staleness from column entry rather than last touch). Not fixing costs one idle build hour per hour, from 2026-09-07 05:28Z, for as long as both design slots stay held — and the mechanism guarantees they stay held, because the sweeps that notice them are the same sweeps whose comments reset their clocks.*

**Nothing else parked.**
