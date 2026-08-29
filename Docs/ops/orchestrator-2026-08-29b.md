---
lane: tb-orchestrator
run: 2026-08-29b
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-29 (run b, ~01:30Z)

## Needs Christian

**The executor is feeding itself for a second hour running, and nothing tonight needs you to keep it moving.** Working on the worldgen ordering fix turned up two more real engine problems; both were written up properly and both went onto the work shelf this run. The shelf is at eight, up from one yesterday evening.

**One of the two is a game fact worth knowing, and it corrects something I told you an hour ago.** Last night's brief said the world generator had *"230 sublocations and 264 named roles"* of authored content one ordering change away from existing. The sublocations were real and now exist. **The 264 named roles were not** — the generator has always computed a roster of townspeople (guild masters, hospice keepers, spymasters, one per authored table) and then thrown it away, because nothing on either side of the fix ever turned that list into actual people. So the world will feel more *built* after this work, but not more *peopled*. Correcting it because I gave you the wrong number, not because anything needs deciding.

**Your three standing asks are unchanged, and unchanged in order:**

1. **Two frozen designs still block all new design work.** [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (**10 days** in the design column) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (**14 days**). While they sit, the lane cannot prepare another design, and three finished-and-ready plan-doc jobs queue behind them — [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46), [the calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56), [the undertaking factory](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66). Pick one up, or say "park it" and the column opens.

2. **[Approving the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)** unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)) — High priority, written, waiting on one yes or no. Still the biggest single lever on the content side.

3. **Three wayfinder maps wait entirely on you.** Every question an agent could answer alone is answered — proved directly again this run, not inherited.
   - **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten open, including [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands) and [how many faces defeat should wear](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum).
   - **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one left: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).
   - **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one left: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

   The two generator sketches are cheapest — you look at a list and react. Say "work the map" when you have an hour.

## T1 — unblock sweep

**Promoted: 2. Filed: 0. Held: 0. Declined: the standing set, unchanged.**

Board at the sweep: **6 `Ready for Dev`** before the promotions, **8** after (`hasNextPage: false`); **47 `Todo`** (`hasNextPage: false`), 45 after; **5 `In Dev`** — [THR-1344](https://linear.app/threadbare/issue/THR-1344/the-genomes-reach-pass-is-dead-at-worldgen-worldseed-runs-the-genome) (claimed 00:29Z) and [THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) genuinely claimed, plus the three `Parked` umbrellas THR-1130 / THR-1133 / THR-1168; **2 `In Design`**; `Idea` queried by hand for the ninth consecutive run (`hasNextPage: true`, nothing promotable — the top of it is four `drift-scan` rows, which are process work under the throttle).

### Promoted — both filed 01:20–01:21Z by the THR-1344 session, both unblocked, both product

Neither carries a native `blockedBy` relation, a prose gate, or a time gate; both descriptions state `Blocked by: nothing` outright. Both are `Deferral`-labelled — CLAUDE.md § Prioritization **rule 1**, the top of the ordering — and both are engine/content work, not delivery machinery, so the process throttle does not apply and the Rule 0 materiality bar is not the gate they pass.

- **[THR-1346](https://linear.app/threadbare/issue/THR-1346/the-distance-matrix-is-rebuilt-on-every-structural-change-and-read-by)** (Medium) — the distance matrix is built on every structural change and read by nobody: `getDistance` is imported at `phaseAgentDecision.ts:22` and `idleBehavior.ts:39` and **called in neither**, while `buildDistanceMatrix` runs live from `orchestrator.ts:2847` and `simulationRuntime.ts:414` at O(L·(L+E)) BFS-per-location. Consistent with the settled hex-distance decision in § Rejected Approaches, which retired the consumers and left the producer wired. Second finding in the same module: because `buildDistanceMatrix` walks the bare `getNodesByType('location')` it counts **both** position tiers, so `MAX_DISTANCE_MATRIX_SIZE` (1200) is exceeded on `large` (1628) and `epic` (2549) — and CLAUDE.md's *"large ~584, epic ~805"* is wrong by ~3×. `?view=game&seeded` derives a `large` map, so the deployed build has been running a truncated matrix.
- **[THR-1347](https://linear.app/threadbare/issue/THR-1347/genomeresultnpcs-has-no-consumer-every-genome-pass-computes-an-npc)** (Low) — `genomeResult.npcs` has no consumer: four of the genome's five passes build an NPC roster, `NPC_BUDGET` trims it by tier, `materializeGenome` stores it on the location and creates **no NPC nodes**; the only reader of `genomeResult` anywhere (`proseResolvers.ts:1232`) destructures `.sublocations` and never touches `.npcs`.

**Both writes verified by re-query** (impediment #48): `status: "Ready for Dev"`, **no `assignee` key present** on either. Priority untouched (Medium / Low as filed).

**Both were promoted with zero comments on them, which is the load-bearing thing this run did.** Each carried a well-formed coordination block **in its description** — and `pull-work` Step 3 validates the *latest comment*, not the description. Left as filed, both would have sat at the top of the queue being refused every hour (THR-836). A block was posted on each: promotion evidence, the three coordination lines with the mutex reason inline, `Blocked by: nothing`, and the evidence shape.

**One factual correction was carried into both comments rather than left for pickup.** THR-1346's filing block asserts *"THR-1344 is merged."* **It is not** — THR-1344 is `In Dev` (`startedAt` 00:29Z, updated 01:27Z) and `origin/main` is at `dd1a260d`, the THR-1323 merge, with no THR-1344 commit under `git log origin/main --grep="THR-1344"`. This does not weaken either promotion: THR-1346's whole measurement table was taken *"on `origin/main` at `dd1a260d`"*, which is the current tip, so its `locations on main` column is live and only the forward-looking third column depends on THR-1344 landing; THR-1347 states outright that THR-1344 *"did not change it either way"*. Recorded so "the sweep read the unmerged predecessor and judged it non-blocking" is distinguishable from "the sweep did not check".

**One arm-choice constraint was written onto THR-1347 rather than discovered at review.** Its three arms are not equivalent in whose call they are: *reconcile* (let `seedNpcsAtLocations` read the roster as a role preference) is additive, NFP #6-aligned and fully the executor's; *wire it* moves worldgen output on every seed; *retire it* deletes `NPC_BUDGET` and the `npcRoles` / `capstoneNpcs` tables — real authored content across five sources. The comment names reconcile as the default and rules the retire arm not-unilateral: "should this authored content exist" is a content question, and deletion is the one arm that is not reversible. That is why it was promoted rather than routed to T2 — it has a concrete either/or Done-when, named files, a test home and a live default arm, so it is executable today; it just has no licence to take the destructive arm without asking.

### Declined — the standing set, no member moved

THR-1222 (unmet chat-approval gate — ask 2 above), THR-1195 (standing verdict on record 2026-08-22), THR-1256 (time gate, opens 2026-09-08 — 10 days out), THR-1255 / THR-1218 (gated on content density), THR-1220 (HITL review session, never promotable), THR-870 (parked by creative-director sequencing), THR-1024 (unmet prose gate on THR-966, still `Idea`), THR-175 (unmet trigger gate, opens on a content event), THR-1301 / THR-1303 (chain holds — THR-1302 still `Todo` and is itself T2's input), the design-gated tickets routed to T2 (THR-1155, THR-1274, THR-1287, THR-1114, THR-1134, THR-1189, THR-1302, THR-1315, THR-1318), and the program epics. All 15 `wayfinder:*` items skipped unconditionally.

**Three process tickets declined on the throttle, named again so the weekly retro can find them.** [THR-1326](https://linear.app/threadbare/issue/THR-1326/fresh-worktree-node-modules-stub-find-the-producer-31-arrivalsweek-and) (node_modules stub, ~31 arrivals/week), [THR-1327](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is) (project-status renders 1 of 281 fragments), [THR-1328](https://linear.app/threadbare/issue/THR-1328/de-flake-the-three-named-closeout-tests-impediment-id-allocation-5s) (three flaky closeout tests). Unchanged from run 08-29: the weekly retro is the single promotion point for delivery-machinery work, and none of these is a loss corrupting work as it runs.

### One hygiene defect surfaced, deliberately not fixed

**THR-1346, THR-1347 and THR-1329 all carry no project**, though CLAUDE.md requires every issue to belong to one and deferrals to inherit their parent's — THR-1344 sits in *Thematic Pressure & Living World*. Three orphans filed in under 12 hours is a pattern, not an accident: the closeout path that files deferrals is not carrying the parent's project through. Noted on both promotion comments. **Orphan-project repair belongs to `daily-backlog-grooming`; this lane is not a groomer** and did not write the field. Worth one line at the retro as a producer-side fix rather than a recurring sweep.

## T1.5 — wayfinder sweep

Three open maps, membership unchanged, all three still **entirely HITL**.

| Map | Frontier | AFK resolved | HITL surfaced |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | **0 available** | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | **0 available** | THR-1232 (`prototype`) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | **0 available** | THR-1236 (`prototype`) |

**The zero was re-proved directly this run rather than inherited from 08-28k.** Label sweeps returned **19 `wayfinder:research` and 3 `wayfinder:task`, all 22 `Done`** — so the empty AFK column means every agent-doable ticket these maps have ever carried is finished, not that the sweep failed to look. `ORCH_WAYFINDER_AFK_MAX` (2) did not bind; there was nothing to bind against.

Map membership was re-derived from this run's own `Todo` sweep: all twelve children present, every one labelled `grilling` or `prototype`. The only two issues created since run 08-29 are THR-1346 and THR-1347, **neither carrying a `wayfinder:*` label**, so map membership cannot have grown. THR-1232 still carries the assignee it gained before run 08-29 — strictly off the *frontier* (open, unblocked, **unclaimed**), but it is a `prototype` ticket that was never AFK-eligible and its disposition is unchanged, so it stays surfaced rather than dropped on a definitional technicality.

Nothing claimed, nothing assigned, no guessed resolution posted. Grilling and prototype tickets are never touched by this lane.

## T2 — design authoring

**Trigger fires; barred by the `In Design` bound. Fourth consecutive run in this state.**

- **Shelf count: TRIGGERED.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` is **1** ([THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach)), unchanged by this run because both promotions carry the `Deferral` label. Run 08-29's measurement finding stands and is now firmer with four more data points: **the label is a provenance marker (this was deferred out of another ticket), not a size or value marker**, and the trigger reads it as the latter. A dead per-tick BFS and a truncated matrix on the deployed build are not clean-up chores. Stated, not acted on — the constant is not this lane's to change mid-run. Worth one line at the weekly retro.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (`startedAt` 2026-08-19, 10 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (`startedAt` 2026-08-15, 14 days). Both far past the 48h threshold and **re-surfaced, not re-staged**, per the rule.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — unchanged since run 08-28d. Runner-up unchanged: THR-1315.

**T2 queue composition unchanged:** nine design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, THR-1318), the two parked in the column, three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300, all fully unblocked), and twelve wayfinder questions on fully-prepared maps. This run added none and cleared none.

**Product-vs-process ratio.** Both promotions this run were **product** (engine/content), so the one-process-ticket-per-three-runs budget was again not spent; the materiality bar was applied only to decline. Week to date holds at ≈70/30 product to process. Four promotions in two hours, all four product — **the headline is not "feature pipeline needs supply" tonight**, but that is the deferral pipeline paying out, not a design column that opened. Self-spawned deferrals buy hours; they cannot substitute for a prepared design indefinitely, and every route from agreed work to a prepared design still runs through a person.

## T3 — architecture health

**Not due — wrong hour.** Local time at this sweep is **03:30**, before `ORCH_HEALTH_SWEEP_HOUR` (6). The 2026-08-29 daily sweep falls to the first run after 06:00 local. Last completed sweep: run 08-28b at 07:35 local, [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md).

**No detector ran this run, and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: **not run, not reported as clean**.

**Redundancy: not assessed this sweep.** Run 08-28b's judgement pass stands. Nothing in T1 above is a redundancy result — the two dead-read findings promoted this run came from the executor's own measurement, not from a judgement pass over the interface map and systems inventory, and they must not be counted as one.

**Stalled work: not re-assessed this run.** One observation recorded because the `In Dev` set moved: it now holds THR-1344 (claimed 00:29Z, moving — it spawned both of this run's promotions within the hour) and THR-1322 (claimed 08-28 18:35Z), plus the three `Parked` umbrellas. No issue shows the `ORCH_STALLED_PICKUP_THRESHOLD` pattern of repeated `Ready for Dev → In Dev` with no `Done`. **No hand-created `In Dev` ticket** was seen this sweep — every non-`Parked` member has a `Ready for Dev` state in its history.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted* — asking rather than falling through to un-agreed work. That threshold is further away than at run 08-29: the shelf went from 6 to 8 this hour, and the T2 queue still holds nine design calls, three plan-doc sessions and twelve wayfinder questions, all agreed. The one standing constraint — that every route from agreed work to a prepared design runs through a person — sits under `## Needs Christian` as a decision already on his list, not as a Discord question.
