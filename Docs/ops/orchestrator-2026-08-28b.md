---
lane: tb-orchestrator
run: 2026-08-28b
promoted: 2
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-08-28 (run b, ~05:40Z)

## Needs Christian

**Two jobs moved onto the shelf this hour — the first promotions in a fortnight of runs.** Both came out of last night's anchor-machinery work ([THR-1212](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)) and neither needs anything from you: [seven chip anchors that name a thing and then draw nothing](https://linear.app/threadbare/issue/THR-1317/seven-chip-anchors-declare-an-entityid-with-no-visualkind-an-anchor), and [the glossary entries for the vocabulary that shipped with it](https://linear.app/threadbare/issue/THR-1316/ul-proposal-worldref-and-the-three-violation-classes-claim-without).

**The proactive-agents program is now entirely in your hands, and moving fast.** You shipped three of its six design docs in about twenty hours yesterday — the substrate, the binder, and the action library. With the action library landed at 21:14 last night, **the last three are all unblocked**: [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) and [the calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) can run in parallel, and [the undertaking factory](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66) — which was waiting on the action library specifically — is now free to be last. Nothing is blocking any of them.

**Standing asks, restated in one line each so you can skip them.** The design column still holds [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (10 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (13 days) — pick one up or park it. Approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks [the camp-seven encounter work](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine).

**One question about how this lane works, not about the game — answer only if you feel like it.** This lane holds a design item in the "In Design" column to signal *a design session is wanted here*, and it will only hold one at a time. But you have picked up all six proactive-agents design docs straight out of `Todo` without that signal ever being used. If you do not read the column, the signal is doing nothing except blocking the lane from flagging the next one. Recorded for the weekly retro rather than acted on — this lane does not change its own rules unasked.

## T1 — unblock sweep

**Promoted: 2. Filed: 0. Held: 0. Declined: the rest.** Both scans complete (`hasNextPage: false` — 47 `Todo`, 6 `Ready for Dev` before the writes, 8 after). `In Dev` holds 4: [THR-1212](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated) working (five slices merged overnight, latest `6e37d9cf` at 03:17 local) plus the same three `Parked` items (THR-1130 / THR-1133 / THR-1168). **No open PRs on the repo**, so nothing is waiting on a gate.

### Promoted

| Issue | Evidence | Coordination block |
|---|---|---|
| [THR-1317](https://linear.app/threadbare/issue/THR-1317/seven-chip-anchors-declare-an-entityid-with-no-visualkind-an-anchor) — seven chip anchors with `entityId` and no `visualKind` | Filed 01:10:22Z, i.e. **after** run —'s 00:27Z sweep, so first assessment not re-check. `blockedBy: []`; no prose or time gate; no comments, so no standing retire verdict (THR-990). Names no plan doc → liveness gate passes trivially. Write verified on `get_issue` re-query: `Ready for Dev`, `assignee` key absent | [Posted](https://linear.app/threadbare/issue/THR-1317/seven-chip-anchors-declare-an-entityid-with-no-visualkind-an-anchor) |
| [THR-1316](https://linear.app/threadbare/issue/THR-1316/ul-proposal-worldref-and-the-three-violation-classes-claim-without) — UL entries for `WorldRef` + the three violation classes | Moved `Idea → Todo` at 00:28:38Z, **71 seconds after** the previous sweep — which is why it was invisible last hour. `blockedBy: []`; no comments. Plan-doc liveness **run, not assumed**: `check:plan-doc-liveness -- Docs/plans/2026-08-27-shared-anchor-machinery.md` → `LIVE … resolves on origin/main`. Write verified, `assignee` absent | [Posted](https://linear.app/threadbare/issue/THR-1316/ul-proposal-worldref-and-the-three-violation-classes-claim-without) |

**Why these two and nothing else: they are the only unblocked candidates on the board that are not design jobs.** Both name every acceptable outcome in their own Done-when, so there is no rules-of-play call for an executor to invent — which is precisely what disqualifies the eight standing candidates below.

**A mutex I was about to assert and did not, because it fails on inspection.** THR-1317's natural-looking mutex is against THR-1130 and THR-1222, on the assumption that the seven declarations live in `src/data/encounter-content.ts` with the WS5 retrofit set. They do not: grepping the three template ids resolves them to `src/data/encounters/toll-of-blades.ts`, `the-drowned-archive.ts` and `the-broken-seal.ts`. THR-688 rule B requires a mutex to carry a verifiable reason; this one had none, so it was dropped and the real one — `worldRefNoOpGate.contract.test.ts`, shared with the live THR-1212 claim — was recorded instead.

**A label that would have mis-routed the gate, flagged on the ticket.** THR-1316 carries `docs-only`, but its Done-when requires `scripts/interface-contracts.ts` in the same PR — a `.ts` path outside every doc exclusion in CI's `detect` filter. The diff therefore classifies as **code**, and the promotion comment says so, telling the executor to believe `npm run classify:diff` over the label. Left unflagged this is a ticket that looks like it owes the ~70-second docs track and actually owes the full one.

### Declined — every line naming its own evidence

* [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) — **unmet blocker**, re-derived from this run's own read rather than inherited: `blockedBy: [THR-1302, THR-1297]`. THR-1297 is `Done` (21:14:07Z); **THR-1302 is `Todo`**. THR-1303 stays blocked behind it.
* [THR-1302](https://linear.app/threadbare/issue/THR-1302/the-boards-ambition-boost-is-true-by-construction-for-undertakings-a) — **wrong destination → T2**, and this is a correction to how earlier runs classified it. `blockedBy: []`: it is *not* gated on the cutover, it is the head of that chain. It declines because its own body says so — *"What a fix looks like (design call, not settled here) … Needs a decision before it is coded."*
* THR-1308 / THR-1309 — **unmet blocker** [THR-1310](https://linear.app/threadbare/issue/THR-1310/strategic-target-rules-have-no-proximity-filter-findvalidtargets), on the shelf and not `Done`. They promote the run after it lands.
* [THR-1315](https://linear.app/threadbare/issue/THR-1315/worldrefkind-codex-is-reserved-no-in-game-codex-destination-exists) — **wrong destination → T2**, self-declared: *"This is a design task, not an executor task … filed to `Todo` for `tb-orchestrator` T2 re-scoping rather than to `Ready for Dev`."*
* [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — **unmet human gate**. Comment thread read this run: the only comment is the filing block, whose `Blocked by:` line reads *"Christian's chat approval of the batch-2 brief (ruling 2) — a state gate, not a ticket."* No approval recorded in four days.
* THR-1298 / THR-1299 / THR-1300 — **wrong destination**: these are design-session tickets whose Done-when *is* "plan doc … moved to Ready for Dev with a coordination block". Ready for Dev is their output, not their destination. Their blockers are now all met (see § Needs Christian) and they are T2's input.
* THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189 — **wrong destination → T2**, all six read in full at run 27k with a decline quotable from each body; none has an `updatedAt` newer than that sweep, so the dispositions stand and are not restated. THR-1287 was re-read this run to confirm (`blockedBy: []`, *"Design decision recorded first — this is a rules-of-play question, not a defect with one right answer"*). Full table: [`…-27k.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27k.md).
* THR-1024 (blocker THR-966 never started), THR-175 (unmet trigger), THR-1256 (time gate, opens 2026-09-08), THR-1218 / THR-1255 (gated on corpus density the factory has not produced) — gates already on record.
* THR-1043, THR-1220, THR-791, THR-1232 — assigned to Christian. THR-870 — parked program.
* All 13 `wayfinder:*` `Todo` issues — **skipped unconditionally**, whatever their blockers say.

**A contradiction worth naming before either side is worked.** [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) wants a design pass deciding *what attending to a hold costs and buys*; [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) wants control upkeep **deleted** outright once the cutover census clears. Whichever lands first makes the other wasted — and routing THR-1287 to a design session while a deletion ticket sits open behind the cutover would spend a session on a subsystem that may be scheduled for removal. Not filed, not acted on: recorded so whoever staffs either one reads both first.

**Ceiling and throttle.** 2 of `ORCH_PROMOTE_BATCH_MAX` (5) used; shelf at 8 is well under the 15-item backed-up threshold, so the one-per-run throttle never engaged and nothing was held back. **Rule-0 / product-vs-process:** both promotions are product — THR-1317 is a content defect a player can see (a chip naming a referent and drawing nothing), THR-1316 is domain vocabulary, not delivery machinery. No process or infrastructure ticket was promoted or filed, and no materiality judgement was owed. The week's completion mix stays product-dominated: THR-1297's six slices and THR-1212's five are all feature work.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, structurally — derived from this run's own complete scan, not inherited.** The `Todo` sweep contains **no `wayfinder:research` and no `wayfinder:task` ticket at all**: all 13 open wayfinder children carry `wayfinder:grilling` or `wayfinder:prototype`, which the skill forbids an agent resolving. Nothing claimed, nothing assigned, no guessed resolution posted.

**Native blocking relations were not re-checked per candidate this run.** The wayfinder set is byte-unchanged since run i, which did that check and surfaced the live questions to Christian; they stand and are not re-listed, because re-surfacing an unchanged set hourly is the dump this lane forbids. One member, THR-1232, is assigned to Christian and so sits outside the frontier by definition.

## T2 — design staging

**Triggered, bound out — and the bound is the board's only real blockage, for a fifteenth run.**

Non-`Deferral` items in Ready for Dev: **1** ([THR-1213](https://linear.app/threadbare/issue/THR-1213/wave-1-design-b-hunger-vocabulary-unification-one-catalog-one-key)), against `ORCH_PROGRAM_WORK_FLOOR` of 2. **This run's two promotions did not move that measure** — both carry `Deferral`, so the shelf grew 6 → 8 while the program-work count stayed at 1. Said plainly rather than letting the shelf number imply progress it did not make.

`In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1, so **no staging was performed and the bound was not overridden**: [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (staged by this lane 2026-08-19, **10 days** unpicked) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (13 days). Both are far past 48h and are therefore **re-surfaced, not re-staged**.

**T2's queue: eight design calls waiting in `Todo`** — THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315 — **plus two parked in the column, plus three proactive-agents plan-doc sessions** now fully unblocked. The headline is unchanged and remains a supply problem, not a tidying one: **the feature pipeline needs design/Christian.** What is new is that the supply is visibly flowing again through a channel this tier does not touch — three plan docs shipped in twenty hours, none of them staged by T2. See the question raised under § Needs Christian.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 07:35 local), and today's earlier run at 02:27 local correctly declined it on the hour gate. Diffed against [`orchestrator-2026-08-27c.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md), yesterday's sweep.

| Detector | Result | vs. 2026-08-27c |
|---|---|---|
| `generate-interface-map:dry` | **8 LEAKED** contracts, all carrying a remediation ticket (exit 0 — the generator fails the build otherwise) | **Unchanged at 8, same membership.** But the *LIVE* number is not comparable — see finding 2 |
| `check:canon-staleness` | **22 warnings** | **21 → 22 — see finding 1.** Fully attributed |
| `sweep:rank-reach` | **UNAVAILABLE this sweep** — started 07:40 local, still running at ~35 min with no output when the report closed. **Not reported as clean** | No comparison possible. Yesterday's PASS (60 rank-gated templates reachable, 0 blocked, 0 unowned) is **not** carried forward as today's result |
| `check:process` | exit 0. `check-design-wiki` OK (24 pages, 23 served files accounted for); `check-wiki-freshness` OK (24 pages, no stale); `check-guidance-freshness` OK, 1 doctrine, `mode=advisory`; four generators up to date; `check:authoring-brief` up to date | **Unchanged in every row.** Its `[WorldGen] Ocean fraction too low: 7.4%` incidental now fires a **fourth** consecutive day at the identical value — recurring, not new, not drifting |

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked from a headless scheduled context. **Not run, and not reported as clean.**

**Three of four detectors ran; `sweep:rank-reach` did not finish and is recorded as unavailable, not as passing.** It was still burning CPU at ~35 minutes (PID alive, memory stable, no output) against a second heavy node process holding 1.7 GB on the same box — the sibling-contention shape, not an obvious hang. It was left running rather than killed; the next daily sweep re-runs it. **Yesterday's PASS is deliberately not carried forward** — an unmeasured check reported as clean is the exact pathology this tier exists to catch, and the rank/reach coverage question is therefore simply unanswered today. The distance-matrix overrun tracked as finding 2 on 2026-08-27 rides on this detector's incidental output, so **that series has no data point today either** and its next reading is tomorrow's sweep.

### The eight LEAKED contracts, listed in full so tomorrow's diff is real

`attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertaking-checkpoint-events` · `undertow-card-drifts-mortal-values`

Yesterday's report named only the *new* member (`undertaking-checkpoint-events`, THR-1293), which meant a membership diff was impossible without re-deriving the other seven. Publishing the set costs one line and removes that.

### New finding 1 — canon staleness moved 21 → 22, and the whole delta is one new generated file

The new row is `Docs/canon/consumption-ledger.generated.md missing or invalid frontmatter field: last_reviewed`. Attributed, not guessed:

```
$ git log --diff-filter=A --format="ADDED %h %ad" --date=iso-strict \
    -- Docs/canon/consumption-ledger.generated.md
ADDED 7e5d91a4 2026-08-28T02:25:09+02:00   (THR-1212 slice 4)
```

The file did not exist at yesterday's sweep. It is **generated**, so `last_reviewed` is meaningless on it by construction — which makes it the fourth member of the known permanent floor, alongside `interface-map.generated.md` (added 2026-07-23), `setting-coverage.generated.md` (2026-07-30) and `systems-inventory.md` (2026-07-18). The floor is now 4 rows, not 3.

**So the verdict is "not decay."** The +1 is a new artifact joining a known-benign class, and the 18 substantive rows are unchanged in count. Two candidate explanations were checked and ruled out rather than assumed: the two `Docs/plans/wiring-checklist.md` rows *look* new because that file's mtime is now 2026-08-28T01:17Z, but its last commit before yesterday's sweep was 2026-08-22T15:24 — already later than both consuming pages' `last_reviewed` dates, so both rows were firing yesterday too.

**Today's full 22, published because yesterday's was not.** `orchestrator-2026-08-27c.md` states *"Today's full list is above, which makes tomorrow's diff a real one"* — but the list is not in that report; only the count and two singled-out rows are. Diffing composition against it was therefore impossible, and this run's attribution had to be rebuilt from git. The list below closes that for tomorrow.

`attachments.md` ← systemic-wiring-guide · `consumption-ledger.generated.md` (missing `last_reviewed`) · `cosmology.md` ← archetype-virtue-vice · `cosmology.md` ← sphere-governed-ascendant · `design-governance.md` ← linear-coordination-protocol · `design-governance.md` ← wiring-checklist · `encounters.md` ← systemic-wiring-guide · `engine.md` ← systemic-wiring-guide · `interface-map.generated.md` (missing) · `process.md` ← linear-coordination-protocol · `process.md` ← systemic-wiring-guide · `process.md` ← user-review-interface · `process.md` ← thr-842 · `process.md` ← wiring-checklist · `prose.md` ← systemic-wiring-guide · `rulebook.md` ← encounter-experience-design-plan · `rulebook.md` ← party-formation · `rulebook.md` ← nudge-model · `rulebook.md` ← thr-868 · `rulebook.md` ← thr-1206-reputation · `setting-coverage.generated.md` (missing) · `systems-inventory.md` (missing)

Two plan docs dominate: `2026-04-16-systemic-wiring-guide.md` (5 rows) and `wiring-checklist.md` (2), and **both were re-touched overnight** by the THR-1297 and THR-1212 waves. Every active program re-stales the same two guides, which is why this list never shrinks on its own.

### New finding 2 — yesterday's LIVE contract count and today's are not the same measurement

Yesterday reported *"8 LEAKED, 122 LIVE"*. Counting unique contract headings today gives **8 LEAKED, 65 LIVE, 19 UNVERIFIED-OK, 94 contracts total** — while counting raw badge occurrences anywhere in the output gives 18 / 132 / 40, because verdict and summary lines repeat the emoji. Yesterday's 122 is an occurrence count; today's 65 is a heading count.

**This is a measurement artifact, not a collapse**, and it is recorded because "LIVE fell 122 → 65 overnight" is exactly the false alarm the next reader would raise. The LEAKED figure is unaffected — it reads 8 either way at the heading level, and its membership is listed above. Future sweeps should count headings (`^### \`name\` — badge`).

### Redundancy pass — assessed, negative on the area probed

**The judgement pass was done, and it came back clean on the area this run's promotions touch:** the reference/routing vocabularies, which are the obvious D7 candidate right now because slice 1 minted a third naming scheme (`WorldRef`, 13 kinds) next to two that already existed.

They **compose rather than duplicate**. `WorldRef → toNavigationTarget → NavigationTarget` and `EntityNotice → notificationRouter → NavigationTarget` both terminate in the single `NavigationTarget` type in `src/types/notification.ts`; `resolveWorldRef` lives in exactly one module. That is convergence on one sink, which is the opposite of the two-implementations-one-job shape. THR-1316 applies the same discipline to the vocabulary — its own ruling is *"single authority + pointers … no third home"*, with the interface map's new badge defined by pointer to the UL entry rather than restating it.

**The honest limit: this is one probed area, not a clean bill across the map.** Yesterday's pass found a real one (attention-tier vs `isFollowedAgent`) and routed it to THR-1299; that finding stands and was not re-derived.

### Stalled work

**No stall.** `In Dev` holds 4 — one live claim and three `Parked`, the sanctioned shape.

* [THR-1212](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated) — live and shipping: five slices merged between 23:22 and 03:17 local. Not stalled by any reading.
* **THR-1130** — `stateHistory` re-read this run: 3 `Ready for Dev → In Dev` transitions, no terminal `Done`, i.e. exactly `ORCH_STALLED_PICKUP_THRESHOLD`. Verdict unchanged for the fifth day: a `Parked` batch-cadence umbrella whose batches ship under their own tickets (batch 1 completed as THR-1221). Repeated pickup is its designed shape, not repeated failure.
* THR-1133, THR-1168 — 1 transition each, both `Parked`.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Friday**. Deliberately not reported from Monday's result — [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops` and stands unchanged.

## Escalations

**None posted to Discord.** Agreed work is not exhausted — the executor has eight jobs on the shelf and a live claim in flight — so the "stop and ask" condition did not fire. The items needing Christian reach him through the hourly briefing under `## Needs Christian`; that is the designed channel and no second one was opened.

**Two observations logged for the weekly retro rather than filed as tickets**, per the process-work throttle (scheduled lanes do not file process/infrastructure tickets; the retro is the single promotion point):

1. **T2's staging signal may be inert.** `ORCH_MAX_IN_DESIGN` has held this tier shut for fifteen consecutive runs on two occupants aged 10 and 13 days, while the director picked up six design tickets straight out of `Todo` without the signal ever being consulted. If the column is not read, the bound is costing the lane its only escalation path and buying nothing. Sub-materiality-bar as a ticket; belongs in a batch.
2. **A lane report claimed to publish a list it did not.** `orchestrator-2026-08-27c.md` asserts its full canon-staleness list is present; it is not, which silently defeated the composition diff it was explicitly setting up. Cost this run: one rebuild from git history. Fixed forward here by publishing the list, but the class — a report asserting its own completeness — is worth one line in the retro.

**Nothing parked.** Both writes were verified on a `get_issue` re-query, both landed, so no impediment #48 mismatch occurred.
