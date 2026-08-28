---
lane: tb-orchestrator
run: 2026-08-28e
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-28 (run e, ~14:30Z)

## Needs Christian

**One more job went onto the shelf this hour, and it needs nothing from you.** While finishing the settlement-genome work, the builder found that a settlement's "which trades and crafts thrive here" profile has **never** worked in any world ever generated — the game asks each faction what it contributes and every faction answers with silence, because the number it would answer with was never written down when the faction was created. Nothing broke, because nothing reads the answer. So the job is a straight choice between wiring it up and deleting it, and the builder can make that call alone. [THR-1323](https://linear.app/threadbare/issue/THR-1323/faction-nodes-never-carry-reachweights-so-computesettlementreaches).

**The one ask, unchanged, fifth restatement — skip it if you have seen it.** The design column holds two items and both are stale: [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) at **9 days** unpicked, [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at **13**. Pick one up or park it, and nine design calls start moving. Run d's measurement stands and is not re-argued here.

**Standing, unchanged:** approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)).

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0.** Both scans complete (`hasNextPage: false` — 44 `Todo`, 6 `Ready for Dev` before the write, 7 after). Shelf depth 6 is far below `QUEUE_BACKED_UP_MIN` (15), so the promotion ceiling did not bind and nothing was held back. `In Dev` holds 5: [THR-1311](https://linear.app/threadbare/issue/THR-1311/settlement-genomes-faction-reach-contribution-is-a-dead-term-it-reads) and [THR-1309](https://linear.app/threadbare/issue/THR-1309/t3-undertaking-tier-the-warband-kind-and-the-create-group-strategic-op) claimed, plus the same three `Parked` items (THR-1130 / THR-1133 / THR-1168).

**Exactly one candidate has moved since run d's 13:35Z sweep**, and it is the only issue this run assessed. [THR-1323](https://linear.app/threadbare/issue/THR-1323/faction-nodes-never-carry-reachweights-so-computesettlementreaches) was filed 14:14Z at THR-1311's closeout — a first assessment, not a re-check. Four `Ready for Dev` members also carry a 14:14:53Z `updatedAt`; that is the relation-linking write from THR-1323's filing touching both sides of each link, not a state change, and none of them moved column.

### Promoted

| Issue | Evidence | Coordination block |
|---|---|---|
| [THR-1323](https://linear.app/threadbare/issue/THR-1323/faction-nodes-never-carry-reachweights-so-computesettlementreaches) — faction nodes never carry `reachWeights`, so `computeSettlementReaches` returns `{}` world-wide | `blockedBy` relation set empty; filing block states `Blocked by: nothing` and it holds on inspection. No prose gate, no time gate, no phase alias. Names no plan doc → liveness gate (THR-921) passes trivially. Latest-comment check (THR-990): sole prior comment is its own filing block, no retire verdict. Verified by `get_issue`: `Ready for Dev`, `assignee` key absent | [Posted](https://linear.app/threadbare/issue/THR-1323/faction-nodes-never-carry-reachweights-so-computesettlementreaches) |

**Why this was promoted rather than routed to T2, when six of the board's `Todo` members currently are.** The ticket carries an open question — wire `reachWeights` through at seed time, or delete the `settlementReachProfile` chain entirely — and an open question is exactly what sent THR-1274, THR-1287, THR-1114, THR-1189, THR-1315 and THR-1318 to design. **The distinction is what kind of question it is.** Those six each ask what something in the game *means*: what two actions *are* in a twelve-Sphere field, whether control upkeep is a rule of play, what shape a non-human cast primitive takes. This one asks what to do with **a computed field that has no consumer** — `grep -rn settlementReachProfile src/` returns the producer and its type entry and nothing else. That is a dead-code disposition, which is a technical verdict and the executor's to make (CLAUDE.md § User review interface, rule 4). The ticket's own body delegates it in those words: *"Whoever takes it should decide which, not assume the repair."* Promoting it is the correct read; the promotion comment tells the executor explicitly not to bounce it back for a design pass.

**A mutex flagged as hypothetical at filing had become real by the time of promotion, fifteen minutes later — and this is the run's finding.** THR-1323's filing block, written by THR-1311's closeout, said `Mutex with: none live at filing` and instructed the claimer to *"check `runGenome.ts` and the test file against open PRs at claim time — THR-1311 edits both and its PR may still be open."* At promotion THR-1311 is `In Dev`, last touched 14:24Z, five minutes prior. Both of THR-1323's arms edit `src/engine/__tests__/settlementGenome-vitality.test.ts` and the delete arm edits `src/engine/settlementGenome/runGenome.ts` — the two files THR-1311 is authoring now. The promotion comment therefore states `Mutex with: THR-1311 (both edit runGenome.ts and settlementGenome-vitality.test.ts)` as **live**, with the reason inline (THR-688 rule B), a verifiable reversal condition (THR-1311 has merged), and named disjoint alternatives (THR-1322, THR-1313) to take instead.

This is the second consecutive run where a filing-time coordination block aged between filing and promotion — run d found the same shape on THR-1321, whose `Mutex with: none currently live` was written by the very ticket that then stayed `In Dev`. **The pattern is structural, not a mistake either author made:** a closeout comment reads its own work as finished at the moment it writes, and it is right about the code and wrong about the state. It is a reason to keep T1 deriving the mutex fresh at promotion rather than forwarding the filed one, which is what this tier now does; it is *not* a defect worth a ticket, and is recorded here rather than filed (process-work throttle).

### Declined

**Nothing was re-derived.** Run d's classification of the `Todo` set stands unchanged: THR-1222 (unmet chat-approval gate), THR-1195 (standing verdict on record), THR-1256 (unmet time gate — opens 2026-09-08, 11 days out), the six design-gated tickets routed to T2, and the program epics and plan-doc sessions run c classified. No member of that set has moved since, so re-listing it hourly with identical evidence is the dump this lane forbids. All `wayfinder:*`-labelled `Todo` items were skipped unconditionally per the standing rule — they are T1.5's input and never enter `Ready for Dev`.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, re-proved by direct label query rather than inherited from run d.** `label:"wayfinder:research"` returns **19 issues, every one `Done`** — byte-identical to run d's set, newest `updatedAt` 2026-08-27. So the zero is again "every agent-doable ticket these maps have ever carried is finished", not "none happens to be in `Todo`". All open children across the three maps carry `wayfinder:grilling` or `wayfinder:prototype`, which the skill forbids an agent resolving. Nothing claimed, nothing assigned, no guessed resolution posted.

**HITL frontier deliberately not re-listed.** The wayfinder set is unchanged since 2026-08-26 and run i already surfaced its questions; re-surfacing an identical set hourly is the same dump. Native blocking relations not re-checked per candidate for the same reason.

**One observation the label query surfaces and the map-state scan does not.** Four of the 19 research tickets (THR-1277, THR-1278, THR-1288, THR-1289) belong to parent THR-1276, a map that no longer appears in the open-map scan — its research is complete and its output is the three Proactive Agent Actions plan-doc sessions now sitting in `Todo` (THR-1298 / THR-1299 / THR-1300). That map closed cleanly and its work is downstream of the same design bottleneck as everything else. Context for the standing ask, not a new one.

## T2 — design staging

**Triggered, bound out — for an eighteenth consecutive run.** Nothing was staged and the bound was not overridden.

Non-`Deferral` items in Ready for Dev: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1 — THR-1002 (staged by this lane 2026-08-19, **9 days** unpicked) and THR-790 (**13 days**). Both far past 48h, therefore **re-surfaced, not re-staged**.

**This run's promotion did not move the measure either**, and it is stated rather than left implied: THR-1323 carries `Deferral`, so the shelf grew 6 → 7 while program work stayed at 0. That is now three consecutive runs where every promotion was `Deferral`-labelled. Run c logged the reason the measure is wrong — `Deferral` has become the closeout convention for anything filed mid-slice, including work that is not deferred in any meaningful sense — and that remains an impediment-log row for the weekly retro to batch, **not** a ticket. It does not clear the materiality bar on its own and is not re-filed here.

**Had the bound been open, this run's staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)**, unchanged from run d and recorded so the choice stays on the record rather than being re-derived next run: it caps the encounter portfolio's rank-3 hunt category at four prose-only antagonists, leaves `StepNudge.opposes` dead for the whole `beast` opposition face, and carries its own cost/benefit line. Runner-up unchanged: THR-1315.

**T2's queue: nine design calls waiting in `Todo`** — THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, THR-1318 — **plus two parked in the column, plus three proactive-agents plan-doc sessions, plus ten wayfinder questions on a fully-prepared map.** Unchanged in composition; this run added none and cleared none.

**The headline is unchanged and remains a supply problem: the feature pipeline needs design/Christian.** Run d's measurement is the sharpest statement of it and is not restated.

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6), and its findings stand: [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it.

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.** Run b's pass stands. Nothing in § T1 above amends it — the mutex-ageing observation is a coordination-protocol finding, not a redundancy finding, and it was reached by reading two tickets rather than by a judgement pass over the interface map and systems inventory.

**Stalled work: not re-assessed this run.** Run b read `stateHistory` across `In Dev` and found no stall (THR-1130 sits at exactly `ORCH_STALLED_PICKUP_THRESHOLD` by design, as a `Parked` batch umbrella). Nothing in that set has changed state since.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, and none was warranted.** T2's agreed work is not *exhausted* — it is **bound out**, a different state that does not trigger the stop-and-ask rule: nine agreed design calls are queued and available the moment the `In Design` column has room. Nothing was parked, no un-agreed roadmap item was picked up to stay busy, and Discord was not contacted.

**Nothing filed.** One candidate for a process ticket was seen and correctly withheld: the filing-time-mutex-ageing pattern documented in § T1, now observed on two consecutive runs. It is a coordination-protocol observation with no measured loss — both instances were caught at promotion and neither cost a run — so it does not clear the materiality bar and belongs in the impediment log for the weekly retro to batch, not in a ticket. Scheduled lanes do not file process or infrastructure tickets.

**Product-vs-process ratio for the week:** this run's single promotion is product work — a world-generation defect in the settlement genome. Zero process tickets promoted, zero filed.
