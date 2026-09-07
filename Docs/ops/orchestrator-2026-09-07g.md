---
lane: tb-orchestrator
run: 2026-09-07g
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-07 (run g, ~06:27–06:40Z)

**This run promoted nothing and the board is unchanged since [run f](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07f.md).** It is published for one reason: the ask run f put in front of Christian names **two** levers, and only **one** of them moves anything. Sending him at the other would waste the answer.

## Needs Christian

**Correction to the last brief. One item, not two.**

The last hour told you that a word on *either* of the two things sitting in design would restart the supply. That is wrong, and here is the corrected version:

- **[Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — this is the one.** 23 days, assigned to you. *"I'll take it"* or *"park it"*, either works.
- **[Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — do not spend an answer here.** The machine sets this one aside by itself on **11 September**. Answering it changes nothing before then and nothing after.

**And an honest caveat the last brief did not carry.** Freeing that slot does **not** put anything on the build queue. It lets the machine tee up *one more thing that also needs you* — a design session. The build queue stays empty either way.

**The one lever that actually puts buildable work on the shelf today is still the camp six** — [the retrofit batch](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), waiting on your go-ahead for the 4 September batch brief ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)). *"Batch 2, run the six"* is content work on the shelf the same hour, with no design session in the way. If you have one answer in you this morning, spend it there rather than on either design item.

**Wayfinder questions unchanged and not restated.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **53 `Todo`** (50 + 3), **0 `Ready for Dev`**, **2 `In Dev`** — both carrying `Parked`, so **zero live**. The executor's WIP=1 slot is free with nothing to put in it, for the second consecutive run.

**No new `Todo` candidate since run f.** The newest `updatedAt` in the scan is 04:31Z, which predates run f's close. Every standing decline keeps its evidence in runs a–f and is not re-derived here.

### Two candidates assessed for the first time today — both decline, both *wrong destination*

Neither had been read in any of today's runs, and on an empty shelf a wrong decline is expensive, so both were read in full. **Both self-declare design-first in their own descriptions.**

| Issue | What its own body says |
|---|---|
| [THR-1156](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) — typed game-state epic, **Urgent** | *"this epic is the container and record; **no execution ticket files directly against it**."* Its own deliverable is a charter, and the recommended vehicle is a wayfinder map — which the wayfinder skill requires the director to invoke. Not executable, and not this lane's to charter. |
| [THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) — nations/named areas, **High**, director direction | *"Scope of the design (**this is a design ticket — plan doc before code**)"*. T2's input, not T1's. It has also already been weighed once and declined for sequencing: the 2026-08-19 T2 staging comment on THR-1002 records that its wave position is THR-1163's call, so staging it would fork a decision Christian is slated to make. |

Being *Urgent* and *High* with no blockers is exactly what makes these two look promotable at a glance. They are not — the priority field measures how much the work matters, not whether it is executable.

**One decline with a moving date:** [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) — unmet time gate, *"review on/after 2026-09-08"*. **The window opens tomorrow.** One item, and process work, so it will not refill a shelf by itself.

**Wayfinder issues skipped unconditionally**, whatever their blockers say: **22 of the 53** `Todo` items carry a `wayfinder:*` label and are T1.5's input, never T1's.

## T1.5 — wayfinder sweep

**Four open maps, unchanged. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2). HITL frontier unchanged and not restated.**

**The budget went unused because nothing was eligible, and this run checked that board-wide rather than frontier-only.** A `list_issues(label:"wayfinder:research")` across every state returns **20 tickets, all of them `Done`** — there is no open research ticket anywhere on the board, so the cheapest AFK class is exhausted rather than merely off-frontier. The single `wayfinder:task`, [THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells), stays off the frontier: native `blockedBy: THR-1402`, still `Todo`.

Every remaining frontier ticket across all four maps is `grilling` or `prototype` — HITL, and untouchable by rule.

## T2 — design staging

**Triggered (shelf 0, floor 2) and barred. Nothing staged, nothing mutated.** The finding is *why*, and it corrects a premise run f left on the record for the retro.

### Finding — the staging bound does not self-clear, and only one occupant is the lever

**The arithmetic first.** `ORCH_MAX_IN_DESIGN` is 1 and the bound is *"never hold more than 1 live"* — so staging is permitted only at **zero** live. One live item bars the tier exactly as two do.

**What the shipped predicate returns today** (`classifyInDesignItem`, `scripts/stale-claim-sweep/index.ts`):

```
In Design: 2 live, 0 excluded
  THR-790  assigned Christian — last activity 2026-09-03T07:19:31Z → 4d → live
  THR-1002 unassigned         — last activity 2026-09-03T07:19:42Z → 4d → live
Neither carries `Parked`. Nothing warned, nothing mutated.
```

**Where run f's premise is wrong.** Its retro line reads *"the mechanism guarantees they stay held, because the sweeps that notice them are the same sweeps whose comments reset their clocks."* The clock has in fact been running clean for four days — `stale-claim-sweep` (`0 */12 * * *`) only comments when an item is already stale, and `daily-backlog-grooming` has not commented since 09-03. So THR-1002's exclusion arm **is** reachable:

- `ageDays > 7` is met at **2026-09-11T07:19:42Z**. At that morning's 00:00Z sweep the age still floors to 7, so nothing resets it.
- Unassigned + stale → `stale-unassigned` → **excluded**. The window closes at the **12:00Z** sweep, whose warn comment resets the clock — roughly **4h40m**, with four hourly orchestrator runs inside it.

**And why it does not matter.** THR-790 is **assigned**, so it classifies `stale-assigned` — warned but **still counted, permanently**, by deliberate design (a bound that stopped counting a person's staged work would let this lane stage on top of it). When THR-1002 drops out on 09-11 the count goes 2 → 1, which is still at the bound. **T2 stays barred.**

So the exit is narrower than either previous run said:

| Action on THR-790 | Effect on the bound |
|---|---|
| Apply `Parked` | **Excluded immediately** — the only same-hour unbar |
| Christian takes the design pass | Item leaves the column |
| Unassign it | **Not immediate.** It would classify `live` at 4d and keep counting; exclusion only from 09-11 |

That last row also corrects the `daily-backlog-grooming` verdict standing on THR-790, which tells the reader *"unassigning it frees the slot"*. It does not, today.

**This retargets the retro's fix.** The repair is not "stop bot comments resetting the staleness clock" — that arm works often enough to fire on 09-11. It is that **a bound of 1 which counts an assigned-stale item forever leaves the lane no path back at all**, and the tier it disables is the one that exists to refill an empty shelf. Still logged rather than filed: scheduled lanes do not file process tickets, and the weekly retro is the single promotion point. The cost line it will want:

> *Costs ~one executor run to fix. Not fixing costs the design-staging tier entirely, for as long as one assigned item sits in `In Design` — currently 23 days and counting, against an empty build shelf.*

### One thing this run deliberately did not do

**No corrective comment was posted on THR-790, though the correction belongs there.** Posting it would reset that issue's staleness clock and push its next `stale-claim-sweep` warn from 09-11 out to 09-15 — silencing the one automated nudge pointing at `Parked`, which is the exact pathology this finding is about. Committing it knowingly to make a point about it would be worse than the point. The correction goes to Christian through `## Needs Christian` instead, which costs nothing and reaches him faster.

## T3 — architecture health

**Skipped — already run today.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) was the first run after `ORCH_HEALTH_SWEEP_HOUR` and ran all four detectors, plus the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)).

**No detector was run this run and none is reported.** The `In Design` split above is T3's line by rule (THR-1382) and is reported under T2 because that tier's own analysis produced it — it is not a detector result.

**Redundancy: not assessed this run.** The `newFindings: 1` in the frontmatter is the staging-bound finding above, reached by judgement rather than by a detector; recorded as such so the counter is not read as a detector result.

**Hand-created `In Dev` tickets: not swept this run** (T3's daily budget is spent). Both current `In Dev` items carry `Parked`.

## Escalations

**No Discord message, deliberately.** `keep-work-flowing-cc` owns that doorbell, pinged the channel at 05:01Z, and runs again at **06:45Z — minutes from this run's close.** Its step 2.6 reads `## Needs Christian` out of the newest sibling report, which is this one, so the correction reaches him through the owning lane almost immediately. A second lane pinging the same channel minutes ahead of it would be a duplicate, not a faster path.

**Agreed work is not exhausted** — 53 `Todo` items, many of them agreed. The stop-and-ask condition did not arise: the constraint is a bound this lane must respect, not a question it needs answered.

**Nothing parked.**
