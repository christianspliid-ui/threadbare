# Orchestrator — 2026-07-27

**First run.** Executed by hand during the THR-826 build session rather than by the scheduler, so that the lane's behaviour is evidenced before it runs unattended. `tb-orchestrator` is registered and enabled from this point; its next scheduled run is ~:26 past the hour.

## Needs Christian

**A new automated lane went live today, and it can move work forward without asking you first.**

Until now, every routine we run was downstream of a decision you had already made — one executes tickets, one reports on them, a few tidy up. None of them decided *what happens next*. That was you, in sessions you started by hand. It is why the four Nudge Model workstreams you released on Discord at 14:38 today sat untouched for four hours: the message was recorded correctly, but no routine reads it.

The new lane fills that gap. Once an hour it checks whether anything that was waiting on something else is now free to start, and releases it to the build queue. It also takes on a standing job you have said you don't have the skills for and shouldn't have to: watching for parts of the codebase that have gone redundant or unreachable, and telling you plainly when it finds them.

**What it will never do:** pick a new direction for the game, decide a feature isn't fun, or take a build slot away from the executor. Direction and fun stay yours. It only advances things you have already agreed to.

**If you want it stopped**, say so and it is one switch — the lane is disabled without touching anything else. Nothing it has done needs undoing.

## T1 — unblock sweep

Shelf depth at run time: **23** items in Ready for Dev (9 of them program work, 14 self-filed deferrals).

**Promoted (1):**

- `[orchestrator] T1 promote THR-619` — blocker **THR-615** resolved `Done 2026-07-05T07:17Z`. The ticket says *"Do not start until THR-615 is Done"* and calls itself *"hard-blocked on THR-615"*; that blocker cleared roughly six hours after the ticket was filed. It then sat in `Todo` for **22 days**. Moved `Todo` → `Ready for Dev`, verified by re-query, coordination block posted. Program: Thematic Pressure & Living World.

**Declined (2) — two different reasons, both named:**

- `[orchestrator] T1 skip THR-655` — **time gate not yet open.** The ticket reads *"Run ~1 week after THR-654 lands"*. THR-654 completed `2026-07-21T08:48Z`, so the window opens `2026-07-28T08:48Z` — about 13 hours after this run. Correct to hold; a promotion here would have been a parsing success and a judgement failure.
- `[orchestrator] T1 skip THR-790` — **blocker met, destination wrong.** Its stated blocker THR-786 is `Done 2026-07-26`, but the ticket also says *"Needs its own design finalization before Ready for Dev."* Met blockers make it T2's input, not dev-ready work. Routed to T2's queue rather than promoted.

**Held by the promotion ceiling (1 named):**

- `[orchestrator] T1 hold THR-618` — **verifiably unblocked** (both blockers Done: THR-617 `2026-07-22`, THR-611 `2026-07-05`) and would otherwise have promoted this run. Held because the shelf is at 23, past the backed-up threshold of 15, where the rule is at most one promotion per run. Named here rather than silently dropped; it is first in line next run.

Two further candidates — THR-621 and THR-626 — look unblocked on a first read (their named blockers THR-611 and THR-616/THR-617 are all Done) but were **not fully verified this run** and are recorded as *unassessed*, not as *ready and deferred*. Next sweep resolves them properly.

**What this sweep says about the board.** The three promotable tickets found in a single pass had been unblocked for 22, 5 and 22 days respectively. This is not a backlog that ran dry; it is a backlog whose dependency field nobody read. That is the whole thesis of THR-826, and it held up on first contact.

## T2 — design authoring

**Not triggered.** 9 non-`Deferral` items in Ready for Dev, against a floor of 2.

Note the measurement that matters: counting *all* Ready-for-Dev items gives 23 and reads healthy. Counting only program work gives 9 — still healthy, but it is the number that would have caught the starvation this lane exists to prevent, because the executor files deferrals under itself and can keep its own shelf stocked indefinitely.

## T3 — architecture health

**This is a baseline, not a diff.** There is no previous orchestrator report to compare against, so everything below is stated as current state. The next sweep reports only what changed.

**Detectors that ran (4):**

| Detector | Result |
|---|---|
| `generate-interface-map:dry` | **5 LEAKED contracts, all carrying a remediation ticket** — `attachment-activated-effects` (THR-720), `attachment-edge-modifiers` + `attachment-tier-advancement` (THR-723), `authored-nudge-hand-reaches-resolution` (THR-774), `trait-ref-authoring-vocabulary` (THR-800). No untracked leak. |
| `sweep:rank-reach` | **PASS** — 13 apex holders at tick 900, 0 blocked gated templates. |
| `check:canon-staleness` | **13 warnings** (see below). |
| `check:process` | Passed with 1 warning; three sub-checks stale (see below). |

**Detector that did NOT run:** `__DEBUG.validateTraitRefs()`. It is a **browser-only bridge method** and cannot be invoked from a headless scheduled context. Trait-ref coverage was therefore **not measured this sweep** — recorded as unmeasured rather than clean, because an unmeasured check reported as passing is the precise failure this tier exists to catch.

**Redundancy pass: not assessed this sweep.** The judgement pass over the interface map and systems inventory — two implementations doing one job, which no reachability sweep can flag because both are reachable — was not performed. It is the weaker half of this tier by construction and is stated as absent rather than implied by the four green detectors above.

### New findings worth acting on

1. **`check:process` reports "passed" while silently skipping its three most valuable checks.** `LINEAR_API_KEY` is unset in the scheduled-task environment, so the recent-plan-reference, orphan-issue, and Ready-for-Dev-handoff-keyword checks are skipped — and the script still prints `check:process passed with 1 warning(s)`. A gate that announces a pass for checks it never ran is the "green check on an uncovered condition" pattern this repo has logged repeatedly. **Filed as THR-828.**
2. **`check:canon-staleness` emits two permanently unfixable warnings.** `interface-map.generated.md` and `systems-inventory.md` are flagged for *missing `last_reviewed` frontmatter* — but both are **generated files**, so no human review date is meaningful and no edit will ever clear them. Two of thirteen warnings are noise by construction, which is how a 13-line advisory output becomes a thing people stop reading. Recorded for next sweep.

### Known and already tracked (not re-filed)

- `Docs/plans/INDEX.md` stale — **THR-807**.
- `Docs/canon/systems-inventory.md` stale vs generator — regenerate via `npm run generate-systems-inventory`.
- `Docs/authoring-brief.md` stale vs the systemic wiring guide.
- 11 genuine canon-staleness warnings (`attachments`, `cosmology`, `design-governance`, `engine`, `process` ×4, `prose`, `rulebook` ×2) — canon pages whose source plans have moved since last review.
- Rank-reach census: *0 of 13 faction members can reach `phaseAgentDecision` at all* — **THR-814**.

## Escalations

None. No item required a question this run, so nothing was parked and the Discord channel was not used.
