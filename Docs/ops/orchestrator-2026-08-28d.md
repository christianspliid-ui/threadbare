---
lane: tb-orchestrator
run: 2026-08-28d
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-28 (run d, ~13:35Z)

## Needs Christian

**Two new jobs went onto the shelf this hour, and neither needs anything from you** — both fell out of the warband work that finished at lunchtime, and both are the good kind of finding: the builder measured its own work, found where it fell short, wrote down exactly what it saw, and moved on rather than papering over it.

* **Orders founded during a run show up on the map with no name, no banner and no colours.** Agents can now charter their own factions — four of them in a typical run — but the part of the game that draws a faction only knows about the ones written before the game started, so a player-founded order renders as a blank. [THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui).
* **Raising a warband can't yet promise you the recruits.** The verb works, but only by grabbing whoever happens to be standing nearby — the machinery that would guarantee a body turns out to switch the whole verb off, measured 13 successes down to 0. [THR-1321](https://linear.app/threadbare/issue/THR-1321/a-cast-on-strategic-recruit-warband-halts-it-completely-13-completions).

**The one ask, unchanged since this morning and this is its fourth restatement — skip it if you have already seen it.** The design column holds two items and both are stale: [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) at 9 days unpicked, [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 13. Pick one up or park it, and nine design calls start moving.

**What this run adds to that ask, because it is the sharpest evidence yet and it is one sentence.** I read every promotable candidate on the shelf this hour. Exactly two could be handed to a builder — and *both were filed by the builder itself in the last forty minutes.* Everything else that is unblocked is waiting on a design decision. The board is now being fed almost entirely by the machine's own exhaust: work finishes, notices what it broke, files it, and that becomes the next job. That is a healthy habit and it is not a pipeline. New work still has to come from you.

**Standing, unchanged, deliberately not re-argued:** approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)).

## T1 — unblock sweep

**Promoted: 2. Filed: 0. Held: 0.** Both scans complete (`hasNextPage: false` — 46 `Todo`, 5 `Ready for Dev` before the writes, 7 after). Shelf depth 5 is far below `QUEUE_BACKED_UP_MIN` (15), so the promotion ceiling did not bind and nothing was held back. `In Dev` holds 5: [THR-1319](https://linear.app/threadbare/issue/THR-1319/lairs-can-never-be-cleared-cleared-lair-has-no-writer-so-the-whole) and [THR-1309](https://linear.app/threadbare/issue/THR-1309/t3-undertaking-tier-the-warband-kind-and-the-create-group-strategic-op) claimed, plus the same three `Parked` items (THR-1130 / THR-1133 / THR-1168).

**Both promotions are first assessments, not re-checks.** THR-1321 was filed 12:47Z and THR-1322 at 13:04Z — both *after* run c's 10:30Z sweep, at THR-1309's closeout. Neither has ever been seen by this tier before.

### Promoted

| Issue | Evidence | Coordination block |
|---|---|---|
| [THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) — founded factions render as a fallback in the UI | `Blocked by: nothing`, stated in the filing block and true on inspection — the producer (`dynamicFactionDefinitions`) shipped with THR-1309, which filed this. No prose gate, no time gate. Names no plan doc, so the liveness gate passes trivially. Latest-comment check (THR-990): sole prior comment is the filing block, no retire verdict. Verified by `get_issue`: `Ready for Dev`, `assignee` key absent | [Posted](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) |
| [THR-1321](https://linear.app/threadbare/issue/THR-1321/a-cast-on-strategic-recruit-warband-halts-it-completely-13-completions) — a `cast` halts `strategic_recruit_warband` | Same shape: `Blocked by: nothing`, receiving code shipped with THR-1309, no plan doc named, latest comment is its own filing block. Carries its own three-arm measurement, so there is no design question left in it. Verified identically | [Posted](https://linear.app/threadbare/issue/THR-1321/a-cast-on-strategic-recruit-warband-halts-it-completely-13-completions) |

**One line in THR-1321's block could not have been written at filing time, and it is the reason to read it before claiming.** Its filing comment says `Mutex with: none currently live` — correct when written, because the comment *was* THR-1309's closeout and read its own work as finished. THR-1309 is still `In Dev` as of this promotion (last touched 13:04Z). THR-1321's expected edits are the cast restoration in `src/data/strategic-packs/warlordStrategicPack.ts` and the pin in `src/engine/__tests__/undertakingT3Kinds.test.ts` — **the two files THR-1309 authored.** The promotion comment therefore states `Mutex with: THR-1309 (both edit warlordStrategicPack.ts and undertakingT3Kinds.test.ts) — for as long as THR-1309 remains In Dev`, with the reason inline (THR-688 rule B) and an explicit instruction to check THR-1309's state at claim time and take THR-1322 instead if it has not merged. THR-1322 is genuinely disjoint from both.

**Worth naming, and it is a technical judgement rather than a T3 claim.** THR-1322 is a textbook two-implementations-one-job redundancy — two functions called `getFactionDefinition`, in `src/engine/factionNetwork.ts` and `src/data/faction-definition-lookup.ts`, one dynamic-aware and one not. Both are reachable, so no reachability sweep would ever flag it, and the lookup file's own extraction comment says it exists to prevent exactly this drift. Recorded here because it is the finding that makes the promotion worth its slot; **this is not a T3 redundancy pass** (see below), and it does not amend run b's.

### Declined

Every decline names its evidence. Seven of the nine are the same reason, which is this run's finding.

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) | Unmet gate — Christian's chat approval | Description opens *"Holds in Todo until Christian approves the batch-2 brief in chat (ruling 2)"*; filing block calls it *"a state gate, not a ticket"* |
| [THR-1195](https://linear.app/threadbare/issue/THR-1195/hexsend-heralds-divine-herald-has-no-actortype-so-it-is-located-but) | **Standing verdict** — a considered decline already on record | Latest comment (2026-08-22 18:32Z, orchestrator run i) reverses an earlier promotion of this exact ticket and names what would make it promotable. Nothing has changed since: no comments, no substantive `updatedAt` movement. Re-promoting on identical evidence is the churn that correction exists to prevent |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) | Wrong destination → T2 | *"This is a design ticket, not a patch: a non-human cast primitive needs its shape decided … before code, per the new-node-type rule"* |
| [THR-1315](https://linear.app/threadbare/issue/THR-1315/worldrefkind-codex-is-reserved-no-in-game-codex-destination-exists) | Wrong destination → T2 | Self-nominating: *"filed to `Todo` for `tb-orchestrator` T2 re-scoping rather than to `Ready for Dev`, because there is no plan doc for it and an executor would be inventing the surface"* |
| [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) | Wrong destination → T2 | Done-when's first clause: *"Design decision recorded first (this is a rules-of-play question, not a defect with one right answer)"* |
| [THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere) | Wrong destination → T2 | *"There is no agreed outcome to test against, so this is a design decision"* — a cosmology call about what two actions *are* |
| [THR-1189](https://linear.app/threadbare/issue/THR-1189/taxrate-is-stamped-on-trades-with-routes-and-read-by-nothing-the-toll) | Wrong destination → T2 | *"Wiring a toll into the economy is a new flow … it wants a design pass rather than an executor's judgement call"* |
| [THR-1318](https://linear.app/threadbare/issue/THR-1318/lens-overlay-prose-engine-is-authored-tested-and-has-no-caller) | Wrong destination → T2, plus a soft ordering gate | *"Why this is a decision and not a bug fix"* — activation changes what the player reads at the bonding beat, an experiential call. Also states it is *"better decided after"* THR-1213's content pass |
| [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) | **Unmet time gate** | Title and body name the window: *review on/after 2026-09-08*. Today is 2026-08-28 — **11 days short**. Opens 2026-09-08 |

All `wayfinder:*`-labelled `Todo` items were skipped unconditionally per the standing rule — they are T1.5's input and never enter `Ready for Dev`. The remaining `Todo` members are the design-gated set run c already classified (THR-1134, THR-1302, the three proactive-agents plan-doc sessions, the program epics); that classification stands and was not re-derived, since none of them has moved.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, and this run proved it a stronger way than the last two did.** Runs b and c derived the zero from the `Todo` scan holding no `wayfinder:research` / `wayfinder:task` member. This run queried both labels directly across *all* states:

* `label:"wayfinder:research"` → **19 issues, every one `Done`.**
* `label:"wayfinder:task"` → **3 issues, every one `Done`.**

So the zero is not "none are currently in `Todo`" but **"every agent-doable ticket these maps have ever carried is finished."** All 13 open children across the three maps carry `wayfinder:grilling` or `wayfinder:prototype`, which the skill forbids an agent resolving. Nothing claimed, nothing assigned, no guessed resolution posted.

**Native blocking relations not re-checked per candidate.** The wayfinder set is byte-unchanged (every member's `updatedAt` is 2026-08-25 or 08-26) since run i did that check and surfaced the live questions. Re-surfacing an unchanged set hourly is the dump this lane forbids — so the HITL frontier is **not** re-listed here, deliberately.

**One observation the direct query makes visible and the `Todo`-scan derivation did not.** The Physical Conflict map's four research tickets are all resolved and its "Decisions so far" section is fully populated — company ground truth, encounter substrate, quintessence/Broken/death, monster & lair substrate. That map is **fully prepared and 100% waiting on Christian**: ten questions, every one of them charter-informed. Its research already fed execution once — THR-1319, currently `In Dev`, came straight out of THR-1262's finding that `cleared_lair` has no production writer. Recorded as context for the standing ask, not as a new one.

## T2 — design staging

**Triggered, bound out — for a seventeenth consecutive run.** Nothing was staged and the bound was not overridden.

Non-`Deferral` items in Ready for Dev: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1 — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (staged by this lane 2026-08-19, 9 days unpicked) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (13 days). Both far past 48h, therefore **re-surfaced, not re-staged**.

**This run's two promotions did not move the measure**, and that is stated rather than left for the shelf number to imply otherwise: both carry `Deferral`, so the shelf grew 5 → 7 while program work stayed at 0. Run c logged the reason the measure is wrong — `Deferral` has become the closeout convention for anything filed mid-slice, including program work, so the proxy now under-reports in the direction it was built to over-report. That is an impediment-log row for the weekly retro to batch, not a ticket (process-work throttle); it is **not** re-filed here, and it does not clear the materiality bar on its own.

**Had the bound been open, this run's staging pick would have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — recorded so the choice is on the record rather than re-derived next run. It is the design call with live downstream cost: it caps the encounter portfolio's rank-3 hunt category at four prose-only antagonists and leaves `StepNudge.opposes` dead for the entire `beast` opposition face, and it carries its own cost/benefit line (*"~1 design session + 1 execution session"*). Runner-up: THR-1315, which self-nominates for T2 but blocks a surface that does not exist yet.

**T2's queue: nine design calls waiting in `Todo`** — THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, THR-1318 — **plus two parked in the column, plus three proactive-agents plan-doc sessions, plus ten wayfinder questions on a fully-prepared map.** Unchanged in composition from run c; this run added none and cleared none.

**The headline is unchanged and remains a supply problem, not a tidying one: the feature pipeline needs design/Christian.** What run d adds is the measurement in § Needs Christian — of every promotable candidate on the board this hour, the only two an executor could take were filed by the executor itself, forty minutes earlier.

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6), and its findings stand: [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it.

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.** The `getFactionDefinition` observation in § T1 is a promotion rationale, not a redundancy pass — it was found by reading one ticket, not by a judgement pass over the interface map and systems inventory. Run b's pass (reference/routing vocabularies, negative) stands.

**Stalled work: not re-assessed this run** — run b read `stateHistory` across `In Dev` and found no stall (THR-1130 sits at exactly `ORCH_STALLED_PICKUP_THRESHOLD` by design, as a `Parked` batch umbrella). Nothing in that set has changed state since.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, and none was warranted.** T2's agreed work is not *exhausted* — it is **bound out**, which is a different state and does not trigger the stop-and-ask rule: nine agreed design calls are queued and available the moment the `In Design` column has room. Nothing was parked, no un-agreed roadmap item was picked up to stay busy, and Discord was not contacted.

**Nothing filed.** Two candidates for process tickets were seen and both were correctly withheld: the `Deferral`-as-program-work measurement flaw (logged by run c for the weekly retro) and the distance-matrix overrun (logged by run b with in-run evidence). Scheduled lanes do not file process or infrastructure tickets; the weekly retro is the single promotion point.

**Product-vs-process ratio for the week:** both of this run's promotions are product work — a player-visible rendering defect and a halted gameplay verb. Zero process tickets promoted, zero filed.
