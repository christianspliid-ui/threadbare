---
lane: tb-orchestrator
run: 2026-08-27m
promoted: 5
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-27 (run m, ~20:30Z)

## Needs Christian

**One small naming call, with a default already chosen so nothing waits on you.**

Two different things in the game are about to be called the same word. A company under strain currently reads as **holding** — one of the four states a group's cohesion shows the player (*bound · holding · frayed · breaking*), and it is quoted in the rulebook. The ownership work that just shipped wants **a holding** to mean a thing somebody owns — a mine, a road, a hall — that can be seized and passed on. Both are words players see.

Three ways to go:

1. **Let both stand.** A company *is holding*; a *holding* is owned. Different grammar, and the two never appear side by side. Free, and exactly the kind of drift the glossary exists to catch.
2. **Rename the cohesion state.** Cleanest for the new word, but that vocabulary already ships and sits in the rulebook, so it is the expensive side to move.
3. **Rename the new ownership category.** Newer word, nothing player-facing depends on it yet, and the underlying "owns" relationship already carries the meaning without the word.

**Unless you say otherwise, we take option 3 and record why** — you can reverse it later at low cost, which is the whole reason it is the default. The ticket is [UL-proposal: work, holding, kind row, christening, failure-name register](https://linear.app/threadbare/issue/THR-1314/ul-proposal-work-holding-kind-row-christening-failure-name-register); it is in the builder's queue now and will not sit waiting for an answer.

**Still standing, still not urgent:** approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)). Unchanged since the last three briefs — flagged, not re-argued.

**Good news you do not need to act on:** the builder's queue went from one job to six this hour. The undertaking work finished its last slice and left behind five properly-written follow-ups, all of which I checked and queued. One is worth naming: **every lair in the world is currently called "Lair 0", "Lair 1", "Lair 2"** — seventeen out of seventeen — on exactly the wilderness places your agents now spend most of their idle time. That one is queued as [THR-1312](https://linear.app/threadbare/issue/THR-1312/every-lair-in-the-world-is-named-lair-0-lair-1-placeholder-names-ship).

## T1 — unblock sweep

**Promoted: 5. Filed: 0. Declined: 5. Held: 0.** Ready for Dev went **1 → 6**; `In Dev` holds 4 (THR-1297 live, plus the same three `Parked` items THR-1130 / THR-1133 / THR-1168). Both scans complete (`hasNextPage: false` — 49 `Todo`, 6 `Ready for Dev`).

**What changed since run l:** [THR-1297](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions) reached slice 6 closeout at ~20:14–20:19Z and filed **ten** deferrals in five minutes, each with a coordination block already attached (THR-836 compliance — the executor did this correctly, so no derivation was needed at claim time). That is the first genuinely new candidate set in three runs; run l's "byte-identical to run k" no longer holds, and the whole set was read in full.

**Promoted — each verified `Ready for Dev` on a re-query (impediment #48), each `assignee` key absent on read-back, each carrying a promotion comment with all three coordination lines (without which `pull-work` Step 3 bounces the candidate):**

- [THR-1310](https://linear.app/threadbare/issue/THR-1310/strategic-target-rules-have-no-proximity-filter-findvalidtargets) (Medium) — `blockedBy: []`; it **blocks** THR-1308 and THR-1309, so it is the unblocker for the whole T2/T3 undertaking tier. Measured defect: `findValidTargets` scans all 868 locations with no proximity filter, and at `requiresLocation: true` the `chart_find` kind produced **zero** completions across two seeds. Highest-leverage item on the board.
- [THR-1312](https://linear.app/threadbare/issue/THR-1312/every-lair-in-the-world-is-named-lair-0-lair-1-placeholder-names-ship) (Medium) — `blockedBy: []`. 17/17 lairs carry placeholder names, on the location class slice 5 just made a primary destination (700 of 798 idle decisions happen at lairs).
- [THR-1311](https://linear.app/threadbare/issue/THR-1311/settlement-genomes-faction-reach-contribution-is-a-dead-term-it-reads) (Low) — `blockedBy: []`. Dead term: 0 location-targeted `member_of` edges across 730 locations, and the schema forbids one existing.
- [THR-1313](https://linear.app/threadbare/issue/THR-1313/worldseedts-settlement-name-prefix-ternary-has-two-identical-branches) (Low) — `blockedBy: []`. One expression, bounded either/or.
- [THR-1314](https://linear.app/threadbare/issue/THR-1314/ul-proposal-work-holding-kind-row-christening-failure-name-register) (Low) — `blockedBy: []`. Docs-only as scoped; carries the `holding` collision surfaced above.

None of the five names a plan-doc path, so the THR-921 liveness gate passes trivially rather than being skipped. Each thread's latest comment before mine was its filing block — no retire, supersede or do-not-build verdict anywhere (THR-990 check, run per candidate rather than assumed).

**One judgement worth recording, because it went against the default reading.** [THR-1311](https://linear.app/threadbare/issue/THR-1311/settlement-genomes-faction-reach-contribution-is-a-dead-term-it-reads) says in its own body that the fix is *"a design call"*, which is normally a **wrong-destination** decline routing to T2. It was promoted anyway: the ticket **bounds both arms and states acceptance criteria for each**, which makes it an implementation fork inside agreed scope — the executor's to settle and record — rather than an unresolved design question. The promotion comment names the delete arm as the default and forbids collapsing the fork silently. If that reading is wrong, it is wrong in one direction only: an executor bounces it at pickup, costing one slot.

**Declined — every line naming its evidence:**

- [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) — **unmet blocker.** Native relation `blockedBy: THR-1297`, and THR-1297 is `In Dev`, not `Done` (PR [#1676](https://github.com/christianspliid-ui/threadbare/pull/1676), slice 6/6, still open). Its first Done-when requires `motivations` authored, which is exactly what THR-1297 is closing out. **Worth watching:** the moment #1676 merges this becomes promotable, and it carries the decision-board cutover.
- [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) — **unmet blocker.** `blockedBy: THR-1301`, itself blocked. Gated on a post-cutover decision-mix floor that cannot be measured before the cutover.
- [THR-1302](https://linear.app/threadbare/issue/THR-1302/the-boards-ambition-boost-is-true-by-construction-for-undertakings-a) — **wrong destination.** Unblocked, but its own body reads *"What a fix looks like (design call, not settled here) … Needs a decision before it is coded"*, and its third Done-when requires re-running THR-1301's cutover census. Blockers being absent does not make it dev-ready; it makes it T2's input. Routed there, not promoted.
- [THR-1308](https://linear.app/threadbare/issue/THR-1308/t2-undertaking-tier-route-blockade-kinds-and-the-create-location) / [THR-1309](https://linear.app/threadbare/issue/THR-1309/t3-undertaking-tier-the-warband-kind-and-the-create-group-strategic-op) — **unmet blocker.** Both blocked by THR-1310 via native relations. THR-1310's body states why the wall gets harder rather than easier at T2: *"founding a settlement at a site sampled from all 868 locations is worse than charting one."* T1 promotes both automatically once THR-1310 reaches `Done`.
- [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — **unmet gate**, unchanged since 2026-08-24T19:24Z: Christian's chat approval of the batch-2 brief, a state gate rather than a ticket. Correctly not promoted.

All `wayfinder:*`-labelled `Todo` issues skipped unconditionally — decisions, not executor work, and they never enter `Ready for Dev`.

**Ceiling and throttle.** `ORCH_PROMOTE_BATCH_MAX` (5) reached **exactly** — every unblocked, dev-ready candidate on the board was promoted, so the cap bound nothing and held nothing back. Shelf at 6 is far under the 15-item backed-up threshold. **Rule-0 / product-vs-process:** all five promotions are product work (engine defects, player-facing content, game vocabulary) inside a live, agreed program. **Zero process or infrastructure tickets promoted or filed this run**, so the one-per-three-runs process budget is untouched and the week's completion mix stays product-dominated.

**One caution passed to the executor rather than resolved here:** THR-1297's slice 6 PR is armed and open as of 20:32Z. THR-1310 re-points the seven strategic packs that same PR is closing out, so its coordination block tells whoever claims it to confirm #1676 has merged before editing pack files. Declared, not serialized by hand — the PR is minutes from landing.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, structurally — derived from this run's own complete scan, not inherited.** The `Todo` sweep returned 49 issues with `hasNextPage: false` and contains **no `wayfinder:research` or `wayfinder:task` ticket at all**. Every wayfinder child in it is `wayfinder:grilling` or `wayfinder:prototype`, which the skill forbids an agent resolving — resolving one is the broken-HITL failure mode. Nothing claimed, nothing assigned, no guessed resolution posted.

**HITL frontier, stated at the precision it was actually measured.** By label and assignee: 10 unassigned children under Physical Conflict, 1 under Item Generator, and 0 under Powers & Spellcraft (its only open child, THR-1232, carries an assignee and so is not frontier). **Native blocking relations were not re-checked per candidate this run** — the wayfinder set is unchanged since run i, which did that check and surfaced the nine live questions to Christian. Those stand and are deliberately not re-listed; re-surfacing an unchanged set hourly is the dump this lane forbids. Said explicitly rather than implying coverage: this run measured labels and assignees, not relations.

## T2 — design authoring

**Triggered, bound out — and this time the bound is doing the right thing rather than merely holding.**

Non-`Deferral` items in Ready for Dev: **1** (THR-1212), against a floor of 2 — so the tier triggers. **This is the number that matters, and it is worth stating against the headline:** the executor-facing shelf went 1 → 6 this hour, but five of the six carry the `Deferral` label and the T2 floor deliberately excludes them. That exclusion exists precisely so a shelf full of executor-filed follow-ups cannot read as a healthy design pipeline. The distinction holds here too — the five are substantive product work rather than tidying, but the structural measure has not moved and must not be reported as though it had.

`In Design` holds **3** against `ORCH_MAX_IN_DESIGN` of 1, so no staging was performed and the bound was not overridden:

- [THR-1213](https://linear.app/threadbare/issue/THR-1213/wave-1-design-b-hunger-vocabulary-unification-one-catalog-one-key) — **new since run l**, moved in at 20:15Z and assigned. The second wave-1 design is being authored right now in an attended session. Run l recorded it as mutexed behind THR-1212's artifacts; it has been taken up anyway, which is the director's call to make.
- [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (card grammar, this lane's own stage, 8 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (traits wave 2, 12 days) — both past 48h, both **re-surfaced rather than re-staged**. The remedy for an unpicked stage grants no authority to walk it backwards out of the design column.

**No ticket filed** — a bound behaving as designed while a design session is actively running is not a defect, and is far under the materiality bar.

**Thirteen runs of this section read "the feature pipeline needs design/Christian". That finding is now answered from the supply side twice over** — THR-1212 handed off last hour, THR-1213 in design this hour, both from attended Opus sessions. The upstream fix this lane kept correctly naming, and structurally cannot perform itself, is happening.

## T3 — architecture health

**Not due — already run today.** Run c performed the daily sweep at 04:26Z (06:26 local, the first run past `ORCH_HEALTH_SWEEP_HOUR` 6), covering all four detectors plus the redundancy judgement and the stalled-work check. Findings stand and are not restated: [`…-27c.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md).

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands.

**Stalled work — one line, since the tier did not run:** THR-1297 holds a single clean `Ready for Dev → In Dev` transition and has now shipped all six slices (PR #1676 armed, auto-merge enabled 20:32Z). The five newly promoted issues have never been claimed. Nothing on the board approaches `ORCH_STALLED_PICKUP_THRESHOLD` of 3.

**Gate health, incidental but checked:** one open PR repo-wide (#1676), `mergeStateStatus: BLOCKED` with auto-merge armed 7 seconds after creation — the normal shape while required checks run, not a stall. Nothing else is waiting on a gate.

## Escalations

**Nothing asked on Discord, nothing parked.** `ORCH_ESCALATION_CHANNEL` is for questions this lane cannot resolve about its own work, and it had none — the `holding` naming call is Christian's rather than the lane's, and it routes through the briefing with a default attached rather than blocking anything.

**Why this run published:** five verified promotions taking the executor's shelf from 1 to 6, and a new player-facing naming fork surfaced with its options and a default. Both are substantive under the frontmatter counters; declines alone would not have justified a file.
