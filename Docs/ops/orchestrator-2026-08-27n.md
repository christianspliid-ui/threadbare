---
lane: tb-orchestrator
run: 2026-08-27n
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-27 (run n, ~23:27Z)

## Needs Christian

**One ask, and it is the only thing standing between your world and its new brain.**

Tonight the agents' new action library **finished** — six pieces, all merged, closed at 21:14Z ([THR-1297](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions)). Agents can now begin works, hold things, seize them from each other, and earn a name for what they finish.

The last step is switching the world over to the new way agents decide what to do at all. It is **1.7 percentage points short** of the bar on one of the two test worlds — measured twice tonight, and the gap halved when the new work was added, so the direction is right. Turning up a dial would close it on paper, and the evidence says that would make every agent's plans look identical to each other again, so it was deliberately not done.

What it needs instead is **one design call**: *when an agent's ambition points at a job, how strongly should it want that particular job?* Today the answer is "always exactly the same amount," which is why the world cannot tell one of an agent's own plans from another. [The ticket](https://linear.app/threadbare/issue/THR-1302/the-boards-ambition-boost-is-true-by-construction-for-undertakings-a) carries the full evidence and three candidate answers; nobody has chosen between them.

**And here is the part that needs you rather than an agent.** That call cannot be scheduled, because the design column already holds two things nobody has picked up: [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (8 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (12 days). This lane holds one design slot at a time and will not walk either of them backwards out of the column on its own. **Pick one up, or park it, and the queue behind starts moving** — three more plan-doc sessions for this same program are now unblocked and waiting, plus half a dozen smaller design calls.

Nothing is idle in the meantime: the builder is working, and six jobs are on the shelf behind it.

**Standing, unchanged, deliberately not re-argued:** approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)).

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0.** Ready for Dev holds **6** (5 `Deferral` + 1 design handoff); `In Dev` holds **4** — [THR-1212](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated) newly claimed, plus the same three `Parked` items (THR-1130 / THR-1133 / THR-1168). Both scans complete (`hasNextPage: false` — 45 `Todo`, 6 `Ready for Dev`).

**What changed since run m, and nothing else did.** Three facts moved:

1. **[THR-1297](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions) reached `Done` at 21:14:07Z** — six slices, PRs #1670 → #1676. This is the blocker run m was watching.
2. **THR-1213** (wave-1 design B) walked `In Design → Ready for Dev` under an attended session; THR-1212 was claimed into `In Dev`. Net effect on the structural measure: **none** — the non-`Deferral` shelf count is 1 either way.
3. **[THR-1315](https://linear.app/threadbare/issue/THR-1315/worldrefkind-codex-is-reserved-no-in-game-codex-destination-exists) filed at 22:06Z** — a new candidate, the first since run m's set.

**Nothing was promoted, and the interesting case is the one that looked promotable.** [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) (the decision-board cutover) carried exactly one blocker, THR-1297, and it is now `Done`. It was still declined:

- **Unmet blocker, but a different one.** A native `blockedBy: THR-1302` was recorded on it at 21:31Z, after the slice-6 census posted at 20:19Z measured seed 99 at **8.3% against a 0.10 floor** (seed 42 passes at 12.7%). `UNIFIED_DECISION_BOARD_MODE` stays `'shadow'` by the plan's own clause. This is the THR-990 case working as intended: the *named* blocker cleared while the ticket's own gate did not, and an executor claiming it would re-run a census that ran three hours ago, find the same number, and bounce.
- The residual routes to **[THR-1302](https://linear.app/threadbare/issue/THR-1302/the-boards-ambition-boost-is-true-by-construction-for-undertakings-a)**, which is **wrong destination → T2**, quotable from its own body: *"What a fix looks like (design call, not settled here) … Needs a decision before it is coded."* Its Done-when additionally forbids the most obvious answer (*"Not double-counting the signal `computeTemperamentWeight` already reads"*), so there is no agreed outcome for an executor to test against. That is the whole of the critical path now: **1302 lands, then 1301 flips, then 1303 unblocks.**

**Other dispositions this run, each naming its evidence:**

- **[THR-1300](https://linear.app/threadbare/issue/THR-1300)** (undertaking factory, plan doc 6/6) — **newly unblocked** by THR-1297's close, and **wrong destination**: it is a design-session ticket whose Done-when *is* "plan doc written, moved to Ready for Dev with a coordination block." Ready for Dev is its output, not its input. Joins docs 4 and 5 in T2's queue.
- **[THR-1315](https://linear.app/threadbare/issue/THR-1315/worldrefkind-codex-is-reserved-no-in-game-codex-destination-exists)** — **wrong destination**, and it says so itself: *"filed to `Todo` for `tb-orchestrator` T2 re-scoping rather than to `Ready for Dev`, because there is no plan doc for it and an executor would be inventing the surface."* Promoting it would be overruling the author on the one point they were most explicit about.
- **THR-1303** — unmet blocker (THR-1301, itself blocked).
- **THR-1308 / THR-1309** — unmet blocker: both blocked by [THR-1310](https://linear.app/threadbare/issue/THR-1310/strategic-target-rules-have-no-proximity-filter-findvalidtargets), which is on the shelf but not `Done`. They promote automatically the run after it lands.
- **THR-1222** — unmet human gate, unchanged since 2026-08-24T19:24Z.

**The remaining eight unblocked candidates are unchanged since run k**, which read each one in full and quoted its decline out of its own body (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1024, THR-175). No candidate among them has an `updatedAt` newer than that sweep, so those dispositions stand and are deliberately not restated: [`…-27k.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27k.md). All `wayfinder:*` `Todo` issues skipped unconditionally.

**Ceiling and throttle.** Never engaged — 0 of `ORCH_PROMOTE_BATCH_MAX` (5) used; shelf at 6 is far under the 15-item backed-up threshold. **Rule-0 / product-vs-process:** nothing promoted or filed, so no materiality judgement was owed. No process or infrastructure ticket touched this run; the week's completion mix stays product-dominated (THR-1297's six merged slices are feature work).

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, structurally — derived from this run's own complete scan, not inherited.** The `Todo` sweep returned 45 issues with `hasNextPage: false` and contains **no `wayfinder:research` or `wayfinder:task` ticket at all**; every wayfinder child in it carries `wayfinder:grilling` or `wayfinder:prototype`, which the skill forbids an agent resolving. Nothing claimed, nothing assigned, no guessed resolution posted.

**Measured at label-and-assignee precision only, said plainly rather than implied:** 10 unassigned children under Physical Conflict, 1 under Item Generator, 0 under Powers & Spellcraft (its only open child carries an assignee). **Native blocking relations were not re-checked per candidate this run** — the wayfinder set is unchanged since run i, which did that check and surfaced the nine live questions to Christian. Those stand and are not re-listed; re-surfacing an unchanged set hourly is the dump this lane forbids.

## T2 — design authoring

**Triggered, bound out — and the queue behind the bound grew by two this hour, which is the part worth recording.**

Non-`Deferral` items in Ready for Dev: **1** (THR-1213), against a floor of 2. `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1, so no staging was performed and the bound was not overridden:

- [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — card grammar, this lane's own stage, **8 days** unpicked.
- [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — traits wave 2, Christian's, **12 days** unpicked.

Both are past 48h and are therefore **re-surfaced, not re-staged**; the remedy for an unpicked stage grants no authority to walk it backwards out of the design column.

**What is new: the input side moved, twice, while the output side did not.** T2's queue this run holds **nine** items, up from seven — run k's six standing design calls, plus **THR-1300** (unblocked by tonight's close) and **THR-1315** (filed 22:06Z), and now with **THR-1302** sitting on the critical path of the program that has been shipping all day. The headline this section has carried for thirteen runs is unchanged and is now sharper rather than merely repeated: **the feature pipeline needs design/Christian**, and the specific bottleneck is one occupied design slot with two stale occupants, not a shortage of things to design.

## T3 — architecture health

**Not due — already run today.** Run c performed the daily sweep at 04:26Z (06:26 local, first run past `ORCH_HEALTH_SWEEP_HOUR` 6) across all four detectors plus the redundancy judgement and the stalled-work check. Findings stand and are not restated: [`…-27c.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md). The next sweep is due after 06:00 local on 2026-08-28; local clock at this run is 01:27.

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands.

## Escalations

**None posted to Discord.** Agreed work is not exhausted — the executor is working and six jobs sit behind it — so the "stop and ask" condition did not fire. The one item that needs Christian is a design-column decision, which reaches him through the hourly briefing under `## Needs Christian` above; that is the designed channel and no second one was opened.

**Nothing parked.** No write was attempted this run, so no `save_issue` verification mismatch was possible (impediment #48).
