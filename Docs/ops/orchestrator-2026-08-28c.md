---
lane: tb-orchestrator
run: 2026-08-28c
promoted: 3
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-28 (run c, ~10:30Z)

## Needs Christian

**One ask, unchanged, and this is its third restatement today — skip it if you have already seen it.** The design column holds two items and both are stale: [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) at **9 days** unpicked, [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at **13**. This lane holds one design slot and will not walk either of them out of the column on its own. Pick one up or park it, and the nine design calls queued behind start moving.

**What changed since this morning, and it is good news you do not have to act on.** The builder finished the proximity fix ([THR-1310](https://linear.app/threadbare/issue/THR-1310/strategic-target-rules-have-no-proximity-filter-findvalidtargets)) at 09:36 and the hunger-vocabulary work ([THR-1213](https://linear.app/threadbare/issue/THR-1213/wave-1-design-b-hunger-vocabulary-unification-one-catalog-one-key)) at 08:36. THR-1310 clearing unblocked the next two rungs of the agent-ambition ladder — **trade routes and blockades, then warbands** — and both went onto the shelf this run. So agents can shortly undertake to found a trade route, blockade one, or raise a warband, each with a way for someone else to undo it. Eight jobs now sit ready behind the one in progress.

**Worth knowing about the proximity fix, because it corrected its own ticket.** The expectation was that once agents stopped picking absurdly distant sites, the "you must be standing there" requirement could be switched back on. It was measured and it cannot: nothing in the game yet *walks an agent to the thing it decided to do*. That mover is a later piece of the same program. The fix is real — agents now choose nearby sites — but the walking half is still missing, and both new tickets carry that warning so nobody re-derives it.

**Standing, unchanged, deliberately not re-argued:** approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)).

## T1 — unblock sweep

**Promoted: 3. Filed: 0. Held: 0.** Both scans complete (`hasNextPage: false` — 46 `Todo`, 5 `Ready for Dev` before the writes, 8 after). `In Dev` holds 4: [THR-1312](https://linear.app/threadbare/issue/THR-1312/every-lair-in-the-world-is-named-lair-0-lair-1-placeholder-names-ship) working (PR [#1688](https://github.com/christianspliid-ui/threadbare/pull/1688) opened 10:22:29Z, `BLOCKED` with auto-merge armed — normal for checks in flight) plus the same three `Parked` items (THR-1130 / THR-1133 / THR-1168).

**Two issues went `Done` between run b and this one, and that is what made this sweep substantive:** THR-1213 at 08:36:24Z and **THR-1310 at 09:36:32Z** (PR [#1687](https://github.com/christianspliid-ui/threadbare/pull/1687) → `45a1fdab`). THR-1310 was the sole `blockedBy` on two tickets whose filing blocks explicitly predicted this promotion.

### Promoted

| Issue | Evidence | Coordination block |
|---|---|---|
| [THR-1308](https://linear.app/threadbare/issue/THR-1308/t2-undertaking-tier-route-blockade-kinds-and-the-create-location) — T2 tier: route + blockade kinds, `create_location` | `blockedBy: [THR-1310]`, now `Done` 09:36:32Z. Plan-doc liveness **run**: `LIVE … resolves on origin/main`. Latest comment was the filing block, not a retire verdict. Verified: `Ready for Dev`, `assignee` absent | [Posted](https://linear.app/threadbare/issue/THR-1308/t2-undertaking-tier-route-blockade-kinds-and-the-create-location) |
| [THR-1309](https://linear.app/threadbare/issue/THR-1309/t3-undertaking-tier-the-warband-kind-and-the-create-group-strategic-op) — T3 tier: warband kind, `create_group` | Same blocker, same clearance, same liveness run (shared plan doc). Verified identically | [Posted](https://linear.app/threadbare/issue/THR-1309/t3-undertaking-tier-the-warband-kind-and-the-create-group-strategic-op) |
| [THR-1319](https://linear.app/threadbare/issue/THR-1319/lairs-can-never-be-cleared-cleared-lair-has-no-writer-so-the-whole) — `cleared_lair` has no writer | Filed 10:16:14Z, **after** run b's sweep — first assessment, not a re-check. `blockedBy: []`; no prose or time gate; names no plan doc so the liveness gate passes trivially. Latest comment was its own filing block. Verified: `Ready for Dev`, `assignee` absent | [Posted](https://linear.app/threadbare/issue/THR-1319/lairs-can-never-be-cleared-cleared-lair-has-no-writer-so-the-whole) |

**Both filing blocks named this lane as the party that would promote them** — *"the `blockedBy` relation is set, so `tb-orchestrator` T1 will promote this to Ready for Dev once THR-1310 clears."* That is the dependency half of the coordination block being consumed exactly as designed, which is the thing this tier exists to do and had not had an opportunity to do all week.

### A correction carried into both promotion comments, because the tickets are wrong on their face

THR-1308's scope says to choose `requiresLocation` *"see the proximity blocker below before choosing that value"* — which reads as: once proximity lands, `true` becomes available. **THR-1310's own closeout falsified that**, and the finding is in its status doc under a heading naming the problem:

> Re-measured with the fix in place, they **cannot**. The wanderer family still reports **0/115 rolled on seed 42 and 0/31 on seed 99** at `true` — 100% `actor_absent`, the same total inertness as before the fix.

Proximity and presence are different claims: `isActorAtStage` demands the agent *be at* the site, and the mover that would put it there is doc 3's binder (`TODO(THR-1294)`), unshipped. Left unflagged, both tickets invite an executor to author `requiresLocation: true` and reproduce the `press_the_mark` failure THR-1309's own body warns about — a verb that appears in the completion history while minting nothing. Quoted with its source on both.

### Two mutex corrections, both derived rather than inherited

- **THR-1319's filing block says `Mutex with: nothing currently open` and is already stale.** It was written 10:16:31Z describing THR-1312's work in the past tense as shipped; PR [#1688](https://github.com/christianspliid-ui/threadbare/pull/1688) opened at 10:22:29Z, **six minutes later**. Its file list, read this run, contains `src/engine/lairEscalation.ts` and `src/engine/__tests__/lairEscalation.test.ts` — the two files THR-1319 must edit. Recorded as a live mutex with that reason (THR-688 rule B), lapsing on its own when #1688 merges.
- **THR-1310 comes off both T2/T3 mutex lists** — it was recorded as "blocking, not merely mutex", and is now `Done`. Its files (`strategicActionCandidates.ts`, `strategic-action-constants.ts`, `wandererStrategicPack.ts`) do not overlap either ticket's expected set. The live mutex is now **THR-1308 ↔ THR-1309**: both add rows to `src/data/undertaking-kinds.ts` and both edit `src/engine/strategicGraphOps.ts`, both files confirmed present this run. Their filing blocks say "either order works"; both comments now say **take T2 first**, because T3's `payoffValue` ≈ 2.0 is tuned against the EVT envelope T2 establishes at 1.0–1.5.

### Declined — each line naming its own evidence

* [THR-1318](https://linear.app/threadbare/issue/THR-1318/lens-overlay-prose-engine-is-authored-tested-and-has-no-caller) — **wrong destination → T2**, new this run (filed 07:25:56Z, after run b). `blockedBy: []`, so it is unblocked and still not promotable: its own body says *"**Why this is a decision and not a bug fix** … That is an experiential call about the THR-868 formative-test flow … not a wiring omission."* Activate-or-retire on the prose a player reads at the bonding beat is a creative fork, not a mechanism choice. **Its soft ordering gate is now met** — the body says it is *"better decided after"* THR-1213's content pass, and THR-1213 went `Done` at 08:36:24Z — so it is ripe for a design session, which is the queue that is bound out.
* [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) — **unmet blocker**, re-read this run: `blockedBy: [THR-1302, THR-1297]`. THR-1297 is `Done`; **THR-1302 is still `Todo`**. THR-1303 stays blocked behind it.
* [THR-1302](https://linear.app/threadbare/issue/THR-1302/the-boards-ambition-boost-is-true-by-construction-for-undertakings-a) — **wrong destination → T2**. `blockedBy: []`; it is the head of that chain, not gated on the cutover, and its body says *"Needs a decision before it is coded."*
* THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315 — **wrong destination → T2**, dispositions read in full at run 27k with a decline quotable from each body; none has an `updatedAt` newer than that sweep, so they stand and are not restated. Full table: [`…-27k.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27k.md).
* [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — **unmet human gate**, unchanged: its filing block's `Blocked by:` line reads *"Christian's chat approval of the batch-2 brief — a state gate, not a ticket."* No approval in four days.
* THR-1298 / THR-1299 / THR-1300 — **wrong destination**: design-session tickets whose Done-when *is* "moved to Ready for Dev with a coordination block". Ready for Dev is their output, not their destination.
* THR-1024, THR-175, THR-1256 (time gate, opens 2026-09-08), THR-1218, THR-1255 — gates already on record.
* THR-1043, THR-1220, THR-791, THR-1232 — assigned to Christian. THR-870 — parked program.
* All 13 `wayfinder:*` `Todo` issues — **skipped unconditionally**, whatever their blockers say.

**Ceiling and throttle.** 3 of `ORCH_PROMOTE_BATCH_MAX` (5) used; shelf at 8 is under the 15-item backed-up threshold, so the one-per-run throttle never engaged and **nothing was held back**. **Rule-0 / product-vs-process:** all three promotions are product. THR-1308/1309 are whole gameplay tiers (agents undertaking routes, blockades, warbands, each with a counter-play); THR-1319 is a live gameplay asymmetry — lairs seed, grow and spread with nothing pushing back, while the wiki promises players "the darkness can seep back in". No process or infrastructure ticket was promoted or filed, so no materiality judgement was owed. The week's completion mix stays product-dominated.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, structurally** — derived from this run's own complete `Todo` scan, not inherited. It contains **no `wayfinder:research` and no `wayfinder:task` ticket at all**: all 13 open wayfinder children carry `wayfinder:grilling` or `wayfinder:prototype`, which the skill forbids an agent resolving. Nothing claimed, nothing assigned, no guessed resolution posted.

**Native blocking relations not re-checked per candidate this run.** The wayfinder set is byte-unchanged since run i (every member's `updatedAt` is 2026-08-25 or 08-26), which did that check and surfaced the live questions to Christian. Re-surfacing an unchanged set hourly is the dump this lane forbids.

## T2 — design staging

**Triggered, bound out — for a sixteenth consecutive run.**

Non-`Deferral` items in Ready for Dev: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1, so **no staging was performed and the bound was not overridden**: [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (staged by this lane 2026-08-19, 9 days unpicked) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (13 days). Both far past 48h, therefore **re-surfaced, not re-staged**.

### The measure is now wrong, and this run is the clearest evidence yet

**The trigger reads "non-`Deferral` items in Ready for Dev" as a proxy for *program work*. This run put two whole undertaking tiers on the shelf and the measure still reads 0**, because THR-1308 and THR-1309 carry `Deferral` — filed at a slice closeout, which is what that label records. They are not deferrals in the sense the floor was written for: they are the next two rungs of an authored plan doc, each a full vertical slice with its own census gate.

The exclusion exists for a real reason — the executor files small self-scoped cleanups under itself, and counting those let the shelf read "healthy" while authored work sat in `Todo`. But the label has since become the closeout convention for *anything* filed mid-slice, including program work, so the proxy now under-reports in the direction it was built to over-report. Every run since has declared a starved shelf partly on an instrument that cannot see the tickets that would un-starve it.

**Logged, not filed.** Scheduled lanes do not file process tickets (process-work throttle, 2026-08-10); this is an impediment-log row for the weekly retro to batch, and it does not clear the materiality bar on its own. It is recorded here because the number in the line above is this lane's own headline finding, and it should not be read as more precise than it is.

**T2's queue: nine design calls waiting in `Todo`** — THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, and now THR-1318 — **plus two parked in the column, plus three proactive-agents plan-doc sessions.** The headline is unchanged and remains a supply problem: **the feature pipeline needs design/Christian.** As at run b, supply is visibly flowing through a channel this tier does not touch — THR-1213 and THR-1310 both shipped since the last sweep, neither staged by T2.

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6), and its findings stand: [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it.

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands.

## Escalations

None raised. No question was blocked on Christian that the briefing does not already carry, and the standing design-column ask is restated above rather than re-asked on Discord — asking hourly on an unchanged item is the noise this lane is meant to avoid.

One item **recorded and not acted on**, carried unchanged from run b because both sides are still open: [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) wants a design pass deciding what attending to a hold costs and buys, while [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) wants control upkeep **deleted** once the cutover census clears. Whichever lands first makes the other wasted. Whoever staffs either one should read both.
