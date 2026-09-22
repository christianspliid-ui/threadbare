---
lane: tb-orchestrator
run: 2026-09-22f
promoted: 0
filed: 0
resolved: 0
newFindings: 3
needsChristian: true
---
# Orchestrator — 2026-09-22 (run f, ~10:35Z)

## Needs Christian

**The ask has changed for the first time in five hours. It is no longer the design hour — it is the builder, and it is one click.**

**The machine that builds has been dead for three hours.** Its 10:11, 11:11 and 12:11 local runs all stopped on the same message: *"You've reached your Fable limit."* The first died sixteen minutes in; the other two lasted seven and eight seconds. The next attempt is 13:10 local and will do the same.

**So the thing I have asked for five hours running would not help right now, and I should say so plainly.** For the last five reports I have led with "an hour of design breaks the logjam". That was true while the builder ran. It is not true this hour: a design hour produces a job, and there is nothing alive to build it. The work would stack up unbuilt.

**The two problems are currently hiding each other.** Nothing is being lost right now — the builder is dead, but the shelf it would pull from is empty anyway, so there is nothing for it to fail to build. That is the only reason this is not urgent yet. **But the moment you fix either one alone, the other becomes the wall.** Fix the design shortage first and the finished designs pile up with no builder. Fix the builder first and it finds an empty shelf within the hour.

**So both, in this order:**

1. **First, the builder — minutes, and only you can do it.** Either top up at [claude.ai usage settings](https://claude.ai/settings/usage), or have a session move that lane off Fable. This is already on your list from the briefing; what is new is that it should now be *above* the design ask rather than below it.
2. **Then the design hour, unchanged:** **[Scenes are being offered to exactly the people who will refuse them](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its)** — open a chat and say you want to work THR-1525. In game terms, unchanged from this morning: when the world picks *which mortal* gets handed a scene, it favours the mortal who leans one way on the scene's named value; but when that scene's choice then forks on the same value, the arm that matters is usually the other one. So the game reliably offers a two-way choice to the person who will take the dull arm. Measured, not suspected, and it governs every scene written to the current house guide.

**One correction to this morning's briefing, so it does not become work nobody needs.** It reported the slow post-merge test job as "still red for about four hours, and the fix it needs is owed". That is not what happened — the same commit that failed at 09:27 local **passed on a re-run at 10:32**, and the current state of the code is green. Two test files are timing out intermittently under load, which is a known and already-tracked nuisance, not a broken build. Nothing is owed and nothing is at risk. Detail in T3.

**Nothing else needs you.** No pull requests are open. The one job in flight is a dead claim left by the builder's first failure — no work was lost, no code was written, and an automatic sweep at 14:00 local releases it.

## T1 — unblock sweep

| Column | Run e (08:35Z) | This run (10:35Z) |
|---|---|---|
| `Ready for Dev` | 0 | **0** |
| `Ready for Dev`, non-`Deferral` | 0 | **0** |
| `In Design` | 1 (0 excluded) | 1 (0 excluded) |
| `In Dev` | 1 | 1 (*dead claim — see T3*) |
| `Todo` | 28 | 28 |

**Nothing promoted. Nothing was promotable** — re-derived from this run's own scan, not inherited.

`Todo` composition: **15 wayfinder-labelled** (skipped unconditionally — T1.5's input, never `Ready for Dev`) and **13 non-wayfinder**. No `Todo` item carries an `updatedAt` newer than 08:22:54Z, so **the column has not moved since run e's scan** — the three 08:22:54Z timestamps are THR-1528's relation-link edit, already accounted for last hour.

The thirteen non-wayfinder items, each with the reason it is not dev-ready — checked against this run's scan for movement, none found:

- **Design-first (T2's input, not T1's): 6** — THR-1523, THR-1526, THR-1528 (each names a plan doc it must first *author*), THR-1274 (a new cast primitive), THR-1381 (a spec task), THR-1522 (kill criterion met by slice 1's own census).
- **Trigger unmet: 3** — THR-175 (explicitly DEFERRED, its own unblock condition unfired), THR-1218 (waits on factory content raising encounter density), THR-1393 (lands only with its reader).
- **Not executor work: 4** — THR-1220 (HITL sitting; its first line forbids promotion), THR-870 (parked direction, awaits Christian moving the project out of `Idea`), THR-789 (epic), THR-791 (assigned to Christian).

**Ceiling: neither bound engaged.** Shelf 0 at scan time, far under the backed-up threshold of 15; 0 promotions of a permitted 5. **No candidate was held back by a ceiling** — every item above is excluded on its own merits.

**Rule 0 / materiality:** nothing filed, nothing promoted. Three findings below all sit in the delivery machinery, and **none was filed as a ticket** — the process-work throttle (Christian, 2026-08-10) gives scheduled lanes the log and the run report, and the weekly retro the single promotion point. None is a loss actively corrupting work as it runs, which is the sole exception. **The headline finding remains that the feature pipeline needs supply — and now also that it needs a builder** — never another process promotion.

## T1.5 — wayfinder sweep

Three open maps, unchanged since 2026-09-11: Item Generator ([THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)), Powers & Spellcraft ([THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)), Physical Conflict ([THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)).

**AFK frontier: 0.** Read off this run's own `Todo` scan: the 15 wayfinder items are 3 `wayfinder:map`, 6 `wayfinder:grilling`, 6 `wayfinder:prototype` — **zero `wayfinder:research`, zero `wayfinder:task`**. Every wayfinder `updatedAt` is 2026-08-26 or 2026-09-11. `ORCH_WAYFINDER_AFK_MAX` (2) did not bind; **nothing claimed, nothing resolved, nothing closed** — the sole sanctioned exception to "never assign yourself" went unused because nothing was eligible for it.

**HITL frontier: 12** — 6 grilling, 6 prototype; 11 unassigned, THR-1232 assigned to Christian. **Unchanged since 2026-08-26 — twenty-seven days.** Deliberately not re-listed by id against this hour's two asks; folded into the supply picture as one fact, which is its honest weight.

## T2 — design authoring

**Triggered, and barred — unchanged from the last three runs.**

Non-`Deferral` `Ready for Dev` is **0** against `ORCH_PROGRAM_WORK_FLOOR` of 2, so the trigger fires hard. `In Design` holds **1 live** item — [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), staged by run b at 04:37:11Z, unassigned, ~6h old, and therefore **counting** by the liveness predicate (only `Parked`, or unassigned-and-stale-past-7-days, are excluded). `ORCH_MAX_IN_DESIGN` is 1. **Nothing staged.**

Named for the next trigger, in priority order: THR-1526 (untrue prose reaching live mortals, Medium), THR-1523 (attention model, Medium), THR-1528 (battle-history record, Low).

`ORCH_MAX_IN_DESIGN` is **not** being raised in-run to route around the bar — that belongs to the weekly retro or to Christian, and a second *staged* item would put nothing on the build shelf regardless, since staging is not authoring. Stated once, not re-argued.

## T3 — architecture health

**The daily sweep is not due — it ran at [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-22b.md) (06:35 local), past `ORCH_HEALTH_SWEEP_HOUR`. No detector was run this hour and none is reported clean.** The weekly test-suite pass is not due until 09-28 (today is Tuesday; `ORCH_TESTHEALTH_DOW` is Monday), so nothing is said about it rather than a stale result being repeated. **Redundancy: not assessed this sweep.** `__DEBUG.validateTraitRefs()` is browser-only and was not run.

The three findings below came out of **verifying another lane's claims**, not from a detector sweep.

### New finding (1): the builder lane is dead, and the binding constraint has inverted

`tb-opus-pickup` has failed **three consecutive runs**, all on the same error — *"You've reached your Fable limit."*

| Run | Started | Ran for | Outcome |
|---|---|---|---|
| 08:11:01Z | 10:11 local | 26m 33s | claimed THR-1521, then died |
| 09:11:00Z | 11:11 local | **7s** | died immediately |
| 10:11:05Z | 12:11 local | **8s** | died immediately |

The 10:11Z failure is **new since the 10:00Z briefing**, which knew of two and predicted the third. The prediction is now confirmed rather than expected.

**The finding is not the outage — the briefing already has that. The finding is that it changes what should be asked for first.** This lane has led five consecutive reports with "supply is the constraint; one design hour breaks it". With no builder, supply is no longer the binding constraint and a design hour yields nothing buildable. Both fixes are needed; the ordering has flipped, and the re-ranking is in `## Needs Christian` above. **Not filed as a ticket and not escalated** — a credit top-up is Christian's alone, and moving another lane off its model is a change to his configuration, not a fix a session makes unasked.

### New finding (2): the heavy-lane timeout class has reached two new files, where no detector can see it

The briefing reported the post-merge job as *"still red for about four hours ... the fix it needs is owed and no session has claimed it."* **That reading does not survive the run list, and the distinction matters** — this lane is required to separate a real defect from a timeout rather than report red-and-move-on.

| Run | Sha | Event | Conclusion |
|---|---|---|---|
| 07:27:05Z | `f3f9fb60` | push | **failure** |
| 08:32:14Z | `f3f9fb60` | schedule | **success** |

**The same commit, the same job definition** (`heavy-tests.yml` runs one job, `npm run test:heavy`, for both triggers), opposite verdicts. That is nondeterminism, not a regression — and `main`'s tip is currently **green**.

The failures, with ANSI stripped from the logs:

| Run | Sha | Failing file(s) |
|---|---|---|
| 07:27Z | `f3f9fb60` | `peopleThingsCells.test.ts` (1) |
| 05:53Z | `6922b33e` | `peopleThingsCells.test.ts` (2), `yieldBandCells.test.ts` (2) |
| 03:24Z | `25cb19d5` | `yieldBandCells.test.ts` (1) |

The assertion is not an assertion: `Error: Test timed out in 5000ms` on `an army whose commander dies is offered to a faction-mate`, whose first line is `world(SEED, TICKS)`. **A world-building test on the default 5s budget** — the exact shape impediments #1007, #1010, #1050 and #1054 already record, most recently as five armed PRs in four days on `orchestrator.test.ts`. **The class is not new and I am not re-discovering it**; #1054 already carries the standing retro suggestion (give those arms an explicit per-test timeout).

**What is new is where it landed and what that costs.** On the required check, a timeout blocks a PR and somebody looks. On the **heavy** lane it is invisible by construction: the lane is deliberately non-required, and `check:workflows` escalates a red only after `PUSH_LANE_RED_GRACE_HOURS` (24h). **A test that flickers never stays red for 24 hours**, so this class can recur on the heavy lane indefinitely without ever reaching anyone — and it just produced four reds in six runs inside one morning without surfacing. The compensating signal, if the retro wants one, is *repeated* failure across distinct shas rather than *sustained* red.

**Logged here, not ticketed** — process-work throttle; the weekly retro (Friday) owns the class and already has the family. Nothing was corrupted and the tip is green.

### New finding (3): a live twice-daily lane that writes to Linear is missing from the registry

`.github/workflows/stale-claim-sweep.yml` runs on `cron: "0 */12 * * *"` (00:00 and 12:00 UTC) and **writes to Linear** — it is what releases the dead claim described below. The registry's GitHub Actions table ([`Docs/ops/scheduled-tasks-registry.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md), § Actions lanes) lists **only** the drift scan and the heavy tests. The sweep appears in that file exactly once, in prose in an unrelated incident note, never as a row.

CLAUDE.md requires a new lane's cron *and* observed fire time to be recorded in the registry in the same commit. This one is not, which is why the briefing's "twice-daily, next 14:00 local" had to be verified against the workflow file rather than read off the registry. **The claim checks out** — `0 */12 * * *` next fires 12:00Z = 14:00 local. **Logged, not ticketed**: documentation drift is explicitly excluded from Rule 0, and the throttle routes it to the retro.

### Standing checks

**THR-1521 is a dead claim, and it is benign.** [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) was claimed at 08:21:53Z by the builder run that died sixteen minutes later. **No branch exists** — `git ls-remote --heads origin | grep 1521` returns nothing — and **no PR exists**. Verified, not assumed. Nothing was lost; the ticket is exactly where it started. The 12:00Z stale-claim sweep releases it, which is that lane's remit and not this one's: **no assignee was touched and no state was written.**

**Stalled work: 0 by threshold.** THR-1521's history shows one `Ready for Dev → In Dev` transition against `ORCH_STALLED_PICKUP_THRESHOLD` (3).

**Hand-created `In Dev`: 0.** THR-1521 passed through `Ready for Dev` — this lane promoted it there at 06:30Z.

**In Design: 1 live, 0 excluded** (THR-1525, unassigned, ~6h old → counts). T2 is bound, not free to stage.

**WIP is 1 of 1 on paper and 0 in practice** — the slot is held by a claim whose session is dead. Recorded because a reader should not have to re-derive that the build capacity is actually zero, not one.

**Open PRs: 0.**

## Escalations

**None opened on Discord, nothing parked, nothing blocked.**

Discord was considered for the builder outage and **declined, on a different basis from the last three runs.** The earlier declines were "an unchanged ask is not news". This one is not unchanged — but it is already item 1 of 6 on Christian's list from the 10:00Z briefing, `keep-work-flowing-cc` republishes at **10:53Z (18 minutes from now)** and folds this report's `## Needs Christian` into it, and the outage is **costing nothing this hour** because the shelf the dead builder would draw from is empty. A second channel firing for an item already queued to surface in under twenty minutes, at zero current cost, is how a channel stops being read. Local time is 12:35.

Environment note: no git state operation was performed in the home tree — this run's git use was `fetch`, `show`, `ls-tree`, `ls-remote` and `gh` reads only. The board was read through the MCP connector; the precheck's `linear=nokey` reports only that the probe script has no key of its own, which is the normal state on this machine and says nothing about the connector. **Zero Linear writes this run** — nothing promoted, nothing staged, no comment posted, no assignee set or cleared, nothing written into `In Dev`, no PR touched, no ticket filed.
