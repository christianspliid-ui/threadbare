---
lane: tb-orchestrator
run: 2026-09-20c
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-20 (run c, ~14:31Z)

## Needs Christian

**The same two asks as this morning. Nothing new needs a decision from you.**

**1. One design chat.** Say *"design THR-1479"* — [the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by). [THR-1448, a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) comes after it.

**2. Finish the encounter sitting** you started on 12 September — the five links are on [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with).

**One thing has improved since the last report, and it is worth a line.** The build machine is no longer idle. Run b found a real bug at 13:32Z and the builder picked it up 29 minutes later — it is working on it now. So the *immediate* pressure is off; the standing asks above are about the next several days of supply, not the next hour.

## T1 — unblock sweep

Shelf: **0** in `Ready for Dev`. **1** in `In Dev` — [THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver), filed by run b into `Ready for Dev` at 13:32Z, claimed by the executor at 14:01Z, PR [#1968](https://github.com/christianspliid-ui/threadbare/pull/1968) open. **The 29-minute file→claim turnaround is the first measured evidence today that the promotion path itself is healthy** — what is missing is supply, not plumbing. THR-1516's `stateHistory` confirms it passed through `Ready for Dev`, so it is not a hand-created `In Dev` ticket.

`Todo`: **26**, the same set as runs a and b. **15 wayfinder-labelled** → skip unconditionally to T1.5. The other **11** decline exactly as run a recorded them, and the decline table is not reprinted — re-listing an unchanged set hourly is the dump this report forbids.

One `updatedAt` did move since run a: **THR-790** now reads 13:32:48Z. Checked rather than assumed — it is THR-1516's `relatedTo` wiring touching the row, not a change to the ticket. Its decline (*"Needs its own design finalization before Ready for Dev"*) stands on unchanged text.

**Promotions: 0.** Nothing eligible; neither ceiling bound (batch max 5, backed-up threshold 15).

**Rule 0 / materiality:** no process work promoted, none eligible. No process ticket was filed — per the throttle, this lane logs rather than files, and the one mechanism finding from run a is already logged for the weekly retro. 48h completion ratio unchanged at **4 product : 3 process**. Headline unchanged and now three runs deep: **the feature pipeline needs a design session**, never more tidying.

### The `Idea`-column survey, continued from run b

Run b's finding — *"nothing promotable in `Todo`" is not the same claim as "nothing executable exists"* — earned a second pass. Two `Encounter Experience` candidates were taken to code this run, both chosen because they sit on the surface Christian is being asked to judge:

| Candidate | Verdict |
|---|---|
| [THR-964](https://linear.app/threadbare/issue/THR-964) — `pendingChoiceCommits` has no producer | **Declined, wrong destination.** Its own Done-when is *"a decision is recorded: wire the producer, or retire the pipeline"*, and the body is explicit: *"this is a design call rather than a patch."* Design input, not executor work. Not promoted, not touched. |
| [THR-1088](https://linear.app/threadbare/issue/THR-1088) — legacy intervention row renders `+3% success` | **Already satisfied.** See the finding below. |

No new work was filed. **That is a deliberate stop, not an exhausted search:** the remaining `Idea` tail that could be converted this hour is dead-code pruning and tooling hygiene, which CLAUDE.md § Prioritization names as explicitly non-qualifying and the process throttle tells this lane not to file. Manufacturing a ticket from it would have made the shelf look healthier without making the game better.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258). None updated since 2026-09-11.

**AFK frontier: 0** — re-verified by label this run rather than inherited. All 21 `wayfinder:research` and all 5 `wayfinder:task` issues across every map are `Done`. `ORCH_WAYFINDER_AFK_MAX` did not bind; nothing was claimed, resolved or closed.

**HITL frontier: 12 open children, 11 of them unassigned** (THR-1232, the power-generator sketch, is assigned to Christian). Ten belong to Physical Conflict, two to the Powers/Item maps. Unchanged since 2026-08-26 and already carried on the briefing — not re-listed.

One honesty note on method: because no AFK ticket existed to gate, per-candidate `includeRelations` blocker reads were **not** run. "Frontier" above therefore means *open and unassigned*, not *open, unassigned and relation-unblocked*. Stated rather than glossed, since the two counts can differ.

## T2 — design authoring

**Triggered, and barred.** Non-`Deferral` `Ready for Dev` is **0**, below the floor of 2. `In Design` classifies **2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1, so nothing could be staged. **Nothing was mutated** — neither item was parked, demoted, or commented on.

THR-1448 and THR-1479 are both unassigned and have stood since 11–12 September. On the predicate as THR-1382 intended it both would be excluded and this tier would be free; they are not, for the self-referential reason run a documented this morning (the staleness sweep's own warning comment resets the clock it measures). That mechanism finding is run a's and is not re-counted here.

Practical cost this run: **nil**, and for the same reason as the previous two runs — staging a third item would produce a third unanswered design ask, not a third design.

The classifier in `scripts/stale-claim-sweep/index.ts` was **not** executed to confirm the split. It posts warning comments as a side effect, and a read-only tier must not mutate issues to measure them; the classification above is by hand against the documented predicate.

## T3 — architecture health

**Not due — the daily sweep already ran today** (run a, ~10:30Z, all four detectors). Not re-run, and none of its results are restated.

`__DEBUG.validateTraitRefs()` is browser-only, **was not run, and is not reported clean.**

### New finding (1): THR-1088 was repaired on day 4 and has sat open for 40 days

A Law 13 ticket — *"the legacy intervention row renders `+3% success` on a nudge-less encounter step"* — filed 2026-08-11 and still in `Idea`. It was fixed by THR-1121 on 2026-08-15. Verified against `origin/main` @ `83fc7e88` in code rather than inferred from sibling states:

- The render branch this ticket names is **deleted**. `ChoiceBlock` in `EncounterVeil.tsx` now computes `boostLabel` as `'fate decides'` for `withdrawn` and `undefined` otherwise — the percentage is unrenderable by construction, not merely unreached.
- **No other production path renders it.** `probabilityBoost` survives as a data field with four live writers that all hardcode `0`; a sweep for a percent-formatted boost interpolation in any non-test `.tsx` returns zero matches.
- All three Done-whens are met, including the third — a regression lock at `EncounterVeil.test.tsx:241` whose own doc comment records its falsification against boosts of 0.2 and 0.35. It is a real guard, not a vacuous one.

Evidence posted to the ticket with a **closure recommendation**. Deliberately **not closed**: closing another party's ticket is not this lane's call, and the carve-out permitting a `Done` write is scoped to `wayfinder:*` labels. No state, assignee, priority, label or relation changed.

This is the class T3 owns and no detector produces — **an open ticket on a repaired-and-locked surface**, invisible to every reachability sweep because both halves are individually healthy. It is the backlog's version of green tests on a dead contract.

Counted as this run's one new finding. **Redundancy: not assessed this sweep** beyond this single surface.

**Stalled work:** none. THR-1516 is on its first claim.

**Hand-created `In Dev` tickets:** none — THR-1516's `stateHistory` shows `Ready for Dev` 13:32Z → `In Dev` 14:01Z.

**In Design: 2 live, 0 excluded** (THR-1448 and THR-1479, both unassigned, both reading <1.2d to the classifier and 9d/8d in truth).

Weekly test-suite health: **not due.** Today is Sunday; `ORCH_TESTHEALTH_DOW` is Monday, so the next pass is 2026-09-21.

## Escalations

None opened, nothing parked. The two standing asks are Christian's to schedule and are carried in the briefing section above; posting them to Discord a third time today would add noise to a question already asked twice.
