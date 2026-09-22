---
lane: tb-orchestrator
run: 2026-09-22b
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-22 (run b, ~04:35Z)

## Needs Christian

**One ask: an hour of design, in a chat, on one question.**

The build queue is thin — one job waiting, two being worked — but that is not the real shortage. The real shortage is that **five questions are sitting where work should be**, and none of them can be handed to a builder as written. Three arrived last night; the other twelve (yes, twelve) are the older question-piles on the three mapped-out efforts — powers, items, fights — untouched since 26 August.

I have picked the most consequential of the new three and put it on the design desk for you:

**[Scenes are being offered to exactly the people who will refuse them](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its)**

In game terms: when the world decides *which mortal* should be handed a scene, it favours mortals who lean one way on the scene's named value — tradition over novelty, say. But when that scene's choice then *forks* on the same value, the arm that actually matters is often the other one. So the game reliably hands a two-way choice to the person who will take the boring arm.

It is measured, not suspected. A Bargain at the Crossroads fired **once in a thousand ticks, and was refused** — the meeting it was supposed to arrange never happened on any seed. A content fix was applied to that one scene last night and it immediately fired 3 and 11 times on two seeds instead. But every other scene written to the same house guide is still starved, **and the guide still tells authors to write them that way**, so the corpus grows the problem while the question waits.

The question is genuinely a fork, which is why it is yours and not mine: either the rule was always meant to draw both kinds of mortal (and the code has quietly disagreed with its own documentation for months), or the lopsidedness *is* the design — a Protector really should be drawn to a mercy scene — and the house guide needs to stop telling authors to reuse that axis for the fork. Both readings are defensible. Whichever you pick, the work after it is ordinary.

**What I need:** open a chat and say you want to work THR-1525. I can't write the design from this lane — that's an attended session's job, by your own ruling.

**Nothing else needs you this hour.** Last night's two erasure incidents cannot repeat before you next look: I checked every parent job that still has unfinished pieces under it, and none is anywhere near finishing. The one-toggle fix is still the standing ask on the briefing and I have not re-argued it here.

## T1 — unblock sweep

| Column | On arrival (04:30Z) | On departure |
|---|---|---|
| `Ready for Dev` | 1 | 1 |
| `Ready for Dev`, non-`Deferral` | **1** | **1** |
| `In Design` | 0 | **1** (staged by T2, below) |
| `In Dev` | 2 | 2 |
| `Todo` | 29 | **28** (THR-1525 → `In Design`) |

`Todo` composition unchanged from run a: **15 wayfinder-labelled** (skipped unconditionally — T1.5's input, never `Ready for Dev`) and 14 non-wayfinder.

### Promoted: none — 0 state changes into the queue

**No `Todo` candidate changed since run a two hours ago.** Every non-wayfinder candidate carries `updatedAt` ≤ 02:33Z, and the only two writes in that window were run a's own cascade restorations. The declines below are therefore **re-checked for change and unchanged**, not re-derived — per the reporting rule that "we looked and it stayed blocked" is the healthy steady state, not a finding.

- **[THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits)** (traits wave 2 slice 3) — **unmet blocker.** Its blocker THR-1520 is still `Ready for Dev`, not `Done`; it entered the queue at 21:32Z on 09-21 and has not been claimed in seven hours. Declines exactly as it did in run a.
- **[THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant)** (slice 4) — **kill criterion met, blocker irrelevant.** Blocker THR-790 is `Done`, but slice 1's own census answered the gate this ticket set for itself and answered it *no*: the pool term is live but its composition reads flat, so the limit is eligibility rather than weight and two of its three pieces would push the wrong lever. Quoted from run a rather than re-measured.
- **[THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live)** and **[THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less)** — **wrong destination**, each on its own section heading (*"Scope (needs a small design before pickup)"*, *"The design question (not the executor's to settle)"*). T2's input; both named below as the next candidates.
- **[THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its)** — **wrong destination**, and this run acted on that rather than merely recording it: **staged to `In Design` by T2** (below). This is the first of the three night-filed questions to leave `Todo` in either direction.
- **Standing, unchanged:** THR-1274 (*"premise corrected; deliberately not promoted"*), THR-1220 (its own first line forbids promotion — it is Christian's sitting), THR-1393 / THR-1381 / THR-1218 (each states it needs a design pass), THR-175 (trigger condition unmet), THR-870 (design ticket in a parked direction), THR-789 / THR-791 (an epic, and an assigned child).

**Ceiling:** neither bound engaged — shelf 1 on arrival, far under the backed-up threshold of 15; 0 promotions of a permitted 5. **No candidate was held back by a ceiling.** The queue is thin because nothing is *eligible*, not because this lane throttled it, and that distinction is the run's headline: **every remaining candidate is blocked on a design decision, not on another ticket.** T1 cannot fix that; T2 and Christian can.

**Rule 0 / materiality:** nothing filed, deliberately. The one defect found this run (§ T3) is a single stuck pull request with a named, ordinary fix and an owner already assigned — nowhere near the materiality bar, and a ticket would duplicate a comment. **Product-vs-process completion ratio, trailing 48h: 8 product : 4 process**, unchanged from run a (no work has completed since).

## T1.5 — wayfinder sweep

Three open maps, unchanged since 2026-09-11: Item Generator ([THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)), Powers & Spellcraft ([THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)), Physical Conflict ([THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)).

**AFK frontier: 0 — established directly this run, by label, across every state.** Run a reached the same conclusion by inference from its `Todo` and `Ready for Dev` scans; this run replaced that inference with the stronger read, because an AFK ticket parked in some third state would have been invisible to the weaker one:

| Label | Open | Total | Verdict |
|---|---|---|---|
| `wayfinder:research` | **0** | 21 | all 21 `Done` |
| `wayfinder:task` | **0** | 5 | all 5 `Done` |

`ORCH_WAYFINDER_AFK_MAX` (2) did not bind. **Nothing claimed, nothing resolved, nothing closed** — the sole sanctioned exception to "never assign yourself" went unused because there was nothing eligible for it.

**HITL frontier: 12** — 6 `wayfinder:grilling`, 6 `wayfinder:prototype`, 11 unassigned and THR-1232 assigned to Christian. **Unchanged since 2026-08-26 — four weeks.** Not re-listed by id here, and deliberately not raised as twelve separate asks against this hour's single ask; it is folded into the supply paragraph under `## Needs Christian` as one fact, which is the honest weight. Method note: with no AFK ticket to gate, per-candidate `includeRelations` reads were **not** run, so "frontier" here means *open and unassigned*, not *relation-unblocked*.

## T2 — design authoring

**Triggered, and staged one item — the first time this tier has fired since the shelf measurement was corrected.**

Non-`Deferral` `Ready for Dev` was **1** (THR-1520 alone) against `ORCH_PROGRAM_WORK_FLOOR` of 2 — under the floor. It read 3 at run a's departure; THR-1448 and THR-1519 were both claimed in the intervening two hours, leaving one. `In Design` was **0 live, 0 excluded**, so `ORCH_MAX_IN_DESIGN` (1) had nothing to bind.

**Staged: [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) → `In Design`.** Design-request comment posted first, then the state write, then a `get_issue` re-query: `status: "In Design"`, `stateHistory` shows the single `Todo → In Design` transition at 04:37:11Z, **and no `assignee` key is present** — absence read off the re-query, never off the write response.

**No plan doc was authored and none will be from this lane** (Christian's ruling 2026-08-06). The comment carries what an attended session needs to start cold: why this one over its two siblings (blast radius — it governs every spec-authored fork in the corpus while the others are each one behaviour), why it counts as agreed work rather than a direction call (a measured defect in a blessed system, two readings already written down), the Step-0 canon loads, the named constants and modules, and the warning that **option 1 cannot be chosen without the corpus census the ticket asks for** — that census is the first work of the pass, not a follow-up.

**Named for the next trigger, in priority order, unchanged from run a:** THR-1526 (untrue prose reaching live mortals), THR-1523 (attention model; four options, each with an unmeasured tick cost).

**The supply signal, stated plainly because it is the durable finding:** three design questions arrived in four hours last night, one has now been staged, and **zero design sessions have been run against any of them**. The queue is being fed by repairs. This tier can stage one item at a time and cannot author; the bottleneck is downstream of it and is surfaced to Christian above.

## T3 — architecture health

**Due and run — all four detectors, first sweep of the local day.** Last full sweep: [09-21 run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-21.md) (local 17:40); local time at this run is **06:35 on 09-22**, past `ORCH_HEALTH_SWEEP_HOUR` (06:00). Today's earlier run (02:30Z / 04:30 local) correctly did not run it and inherited nothing.

| Detector | Result | vs. 09-21 |
|---|---|---|
| `generate-interface-map:dry` | 7 LEAKED (THR-720, THR-997, THR-883 ×3, THR-1130, THR-800) | **Unchanged** — same set |
| `sweep:rank-reach` | PASS: 60 reachable, 0 blocked, 0 unowned, 13 apex holders at tick 900 | **Unchanged** |
| `check:process` | passed-with-gaps, 1 warning (die-B floors VACUOUS, 9 briefs). **3 sub-checks did not run** — `LINEAR_API_KEY` unset, so recent-plan-references, orphan-issues and Ready-for-Dev-handoff-keywords were skipped and are **not reported clean** | Unchanged |
| `check:canon-staleness` | **32 warnings** | **30 → 32 (+2)** — cause identified below |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **It was not run and is not reported clean.** The weekly test-suite pass ran [09-21](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-21.md) and is not due until 09-28 — today is Tuesday, `ORCH_TESTHEALTH_DOW` is Monday, so nothing is said about it rather than a stale result being repeated.

**The canon delta is accounted for and is not banked as a finding.** The three sources that moved are real edits, not filesystem-mtime churn from an autosync pull — checked, because that was the likelier explanation and it was wrong: `2026-04-16-systemic-wiring-guide.md` and `wiring-checklist.md` both carry a genuine commit at 2026-09-22T02:02:15+02:00 (THR-790 slice 1), and three plan docs were merged by the 09-21 design sessions. Six canon pages declare those as sources and have not been re-reviewed since. **This is routine documentation drift, which the prioritization rules explicitly exclude from Rule 0** — reported, not ticketed.

**Redundancy: assessed this sweep** — one targeted probe and one recheck, both negative, which is the honest result rather than a disclaimer:

- **Appointment planter — one, not two.** The likeliest place for a fresh duplicate this week: THR-1479's plan says "one planter, not two" and THR-1519 is mid-build against a planter it must *reuse*. Measured: `src/engine/appointments.ts` defines it, `src/engine/encounterSeeding.ts` is its only production caller, and the two remaining hits are its own tests. **No second implementation exists**; the constraint held.
- **`effectScope.ts` — 09-21's finding recheck, unchanged and unrepaired.** Still zero production callers: the only non-test hits are the module itself, the CMS constant declaration, and the contract registry. `RULE_OVERRIDE_MAX_PER_HEX` remains inert. **Carried, not re-banked as new.**

### New finding (1): a pull request is armed to merge itself on a check that has already failed

[PR #1981](https://github.com/christianspliid-ui/threadbare/pull/1981) ([THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)) has auto-merge armed and **will never merge**, and nothing in the system is watching:

| | |
|---|---|
| Auto-merge armed | 04:11:15Z |
| Last commit | `11acaf79`, 04:10:02Z |
| Required `Test · Typecheck · Build` | **FAILURE**, 04:18:44Z |
| `mergeStateStatus` | `BLOCKED` |
| CI runs on the branch | exactly one — no rerun, no newer commit |

**The failure is a real defect, not a flake and not a timeout** — the distinction this lane is required to make rather than report red-and-move-on. `check-typecheck-ratchet: FAIL — type errors increased: 2828 → 2830 (+2)`, with three named test files rising by one each, two of them the branch's own.

**The shape is the finding, not the defect.** Arming auto-merge and exiting is correct practice and explicitly sanctioned (THR-675) — it removes the waiting, not the gate. But it assumes the verdict arrives green. Here the session armed at 04:11:15 and moved on at 04:14:55 to claim its next ticket; the red landed at 04:18:44, four minutes after it had gone. **Armed auto-merge on a failed required check is a terminal state, not a waiting one**, and no lane currently reads it: the executor resumes `In Dev` work but has no reason to re-read a PR it believes it queued successfully. A twenty-minute-old stall at this sweep would have been an eight-hour one by the next attended session.

**Diagnosis recorded as a comment on THR-1448** — the exact failing gate, the reproduce command (`npx tsc -b --force`, never `tsc --noEmit`), the sanctioned `--update` exit and its ordering constraint, and the note that pushing a fix re-fires the existing arm without re-arming. **No state was written, no assignee touched, no PR action taken** — this lane does not write into `In Dev`, and a comment is the strongest correct instrument.

**Not filed as a ticket** (process-work throttle: scheduled lanes log, the weekly retro promotes). One stuck PR with an assigned owner and an ordinary fix is far below the materiality bar. If a *second* instance appears, the pattern — not this instance — is the retro's to weigh, and the compensating detector would be a sweep for `OPEN` + auto-merge-armed + red-required-check, which is one API call.

**Stalled work: none by the threshold.** Both `In Dev` issues show exactly one `Ready for Dev → In Dev` transition against `ORCH_STALLED_PICKUP_THRESHOLD` (3).

**WIP is 2, and it is the armed-and-exited shape rather than a double-build.** THR-1448 claimed 03:16:55Z, THR-1519 claimed 04:14:55Z — the second claim came 3m40s after the first ticket's PR was armed, i.e. the first session had finished and left. Recorded because the WIP=1 invariant is nominally breached and a reader should not have to re-derive that it is benign; the un-benign part is finding (1), which is that the first ticket is not actually finished.

**Hand-created `In Dev` tickets: none.** Both occupants' `stateHistory` opens through `Ready for Dev` — THR-1448 via `Todo → In Design → Implementation Planning → Ready for Dev`, THR-1519 via `Todo → Ready for Dev`. Neither skipped the claim step.

**In Design: 1 live, 0 excluded** (THR-1525, staged this run, 0d — counted). Printed rather than skipped: the count is the signal that the staging budget is now spent until that item moves.

**Cascade blast radius, re-checked because it fired twice last night: nil this hour.** The only parent with an unfinished child is THR-1479, and it is **already** `Done` (22:12:37Z on 09-21) — that closure *was* the first cascade, and a completed parent cannot fire a second time. The traits epic THR-789 is `Todo` with one assigned child and nowhere near closing. **No parent is in a position to erase anything before the next run.**

## Escalations

**None opened on Discord, nothing parked, nothing blocked.**

Discord was considered for the design-session ask and declined: it is a single non-urgent item, `keep-work-flowing-cc` republishes the briefing within the hour and reads this report's `## Needs Christian` section into it, and local time is 06:35 — the briefing reaches him in the same place, sooner than he would read a ping.

Environment note, recorded rather than actioned: this lane performed no git state operations in the home tree. Detectors are `npm` runs, the report was published to `ops` by plumbing that checks nothing out, and every Linear write was followed by a `get_issue` re-query before being reported.
