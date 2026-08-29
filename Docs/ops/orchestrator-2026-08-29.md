---
lane: tb-orchestrator
run: 2026-08-29
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-29 (run —, ~00:30Z)

## Needs Christian

**Good news first: the shelf refilled itself.** The executor finished the faction-reach fix an hour ago and, in doing so, found two more real engine problems and wrote them up properly. Both went onto the work shelf this run. The queue is no longer down to a single item, and nothing about tonight needs you to keep it moving.

**One of the two is worth knowing about as a game fact, not a bug report.** The world generator has an entire authored pass — eight reaches' worth of guild halls, spy networks, war councils, hospices, embassies — that has **never once appeared in a generated world**, because it runs before the factions it depends on exist. Measured on one seed: **230 sublocations and 264 named roles** are one ordering change away from existing. Ardenmor Keep alone would draw eighteen new places. That is a visible change to how populated the world feels, and the executor will pick a volume it can defend rather than shipping all of it blind. Flagging it because it changes the world, not because it needs your decision.

**Your three standing asks are unchanged, and unchanged in order:**

1. **Two frozen designs still block all new design work.** [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (**10 days** in the design column) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (**14 days**). While they sit, the lane cannot prepare another design, and three finished-ready plan-doc jobs queue behind them — [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46), [the calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56), [the undertaking factory](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66). Pick one up, or say "park it" and the column opens.

2. **[Approving the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)** unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)) — High priority, written, waiting on one yes or no. Still the biggest single lever on the content side.

3. **Three wayfinder maps wait entirely on you.** Every question an agent could answer alone is answered.
   - **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten open, including [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands) and [how many faces defeat should wear](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum).
   - **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one left: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).
   - **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one left: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

   The two generator sketches are cheapest — you look at a list and react. Say "work the map" when you have an hour.

## T1 — unblock sweep

**Promoted: 2. Filed: 0. Held: 0.** First promotions since run 08-27n.

Board at the sweep: **5 `Ready for Dev`** before the promotions, 7 after (`hasNextPage: false`); **5 `In Dev`** — [THR-1323](https://linear.app/threadbare/issue/THR-1323/faction-nodes-never-carry-reachweights-so-computesettlementreaches) and [THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) genuinely claimed, plus the three `Parked` umbrellas THR-1130 / THR-1133 / THR-1168; **2 `In Design`**; `Todo` returned 49, `hasNextPage: false`. `Idea` queried by hand for the eighth consecutive run.

### Promoted — both THR-1323 closeout deferrals, both unblocked, both product work

Both arrived at 00:10–00:11Z with a **filing coordination block already posted** — THR-836 satisfied at creation by the executor, not derived later by this lane. Neither carries a native `blockedBy` relation, a prose gate, or a time gate. Both are `Deferral`-labelled in an active project (Thematic Pressure & Living World), which is CLAUDE.md § Prioritization **rule 1** — the top of the ordering, ahead of new work by priority.

- **[THR-1344](https://linear.app/threadbare/issue/THR-1344/the-genomes-reach-pass-is-dead-at-worldgen-worldseed-runs-the-genome)** — the genome's Reach pass is dead at worldgen: `runSettlementGenome` fires at `worldSeed.ts:1198`, `seedAllFactions` at :1648, so `computeSettlementReaches` returns `{}` for every settlement being built and Pass 4 — the sole reader of `REACH_SUBLOCATION_MENU` — contributes nothing. Measured on seed 42 / medium: `genomeSourcePass` counts `reach=0` at worldgen; re-running the genome post-seeding yields **230 reach-sourced sublocations and 264 NPC roles** across 19 of 38 settlements, holding on seeds 99 and 7. Medium priority.
- **[THR-1345](https://linear.app/threadbare/issue/THR-1345/two-faction-definitions-declare-reach-keys-that-are-not-reachdomains)** — `flesh` and `force` are declared as `reachWeights` keys in two data files and are not `ReachDomain`s. Currently inert (Pass 4 fail-softs past them) but they travel into settlement reach profiles and skew the normalization divisor. The load-bearing half is establishing *why the typechecker did not reject them*, which decides where the guard belongs. Low priority.

**One caveat was recorded on both promotion comments rather than left for pickup to discover.** THR-1344's filing block asserts *"THR-1323 … is merged."* It is not: THR-1323 is still `In Dev` (updated 00:19Z), and the faction-node `reachWeights` store is **not on `origin/main`** — checked directly (`git show origin/main:src/engine/factionSeeding.ts` has `reachWeights` only at the :47 helper signature and the :239 `deriveDomainCapabilities` call, with no node write). This does **not** block either promotion: THR-1344's ordering defect is true on `main` today and independent of THR-1323, THR-1345's stale keys predate it in both data files, and WIP=1 means pickup cannot precede THR-1323's close in any case. What it does mean is that the quoted measurements only reproduce once THR-1323 lands — so if that PR is reverted rather than merged, the arms must be re-derived before one is chosen. Stated because "the sweep read the unmerged predecessor and judged it non-blocking" and "the sweep did not check" are indistinguishable otherwise.

Both writes were verified by `get_issue` re-query (impediment #48): `status: "Ready for Dev"`, **no `assignee` key present**. Priority untouched on both.

**A note on the promotion, made once rather than argued.** THR-1344's own filing block says the remaining work is *"a design call with worldgen consequences"* — which is close to this lane's `Wrong destination` decline reason. It was promoted, not routed to T2, because the block is written **for pickup** (suggested model, files to touch, evidence shape, the trap to read first) and the fork it names is between two engineering arms plus a retire arm, with a concrete either/or Done-when. Under CLAUDE.md § User review interface rule 4 the *how* of an agreed change and the volume calibration are the executor's; what would be Christian's is a decision to discard the authored menu outright, and the ticket does not require that arm to be taken. Recorded so a later run can disagree with the judgement rather than re-derive it.

### Declined — the standing set, unchanged

No member moved. THR-1222 (unmet chat-approval gate — ask 2 above), THR-1195 (standing verdict on record 2026-08-22), THR-1256 (time gate, opens 2026-09-08), THR-1255 / THR-1218 (gated on content density), THR-1220 (HITL review session, never promotable), THR-870 (parked by creative-director sequencing), THR-1024 (unmet prose gate on THR-966, still `Idea`), THR-175 (unmet trigger gate, opens on a content event), THR-1301 / THR-1303 (chain holds — THR-1302 still `Todo` and is itself T2's input), the design-gated tickets routed to T2 (THR-1155, THR-1274, THR-1287, THR-1114, THR-1134, THR-1189, THR-1302, THR-1315, THR-1318), and the program epics. All `wayfinder:*` items skipped unconditionally.

**Four process tickets declined on the throttle, named so the weekly retro can find them.** [THR-1326](https://linear.app/threadbare/issue/THR-1326/fresh-worktree-node-modules-stub-find-the-producer-31-arrivalsweek-and) (node_modules stub, ~31 arrivals/week), [THR-1327](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is) (project-status renders 1 of 281 fragments), [THR-1328](https://linear.app/threadbare/issue/THR-1328/de-flake-the-three-named-closeout-tests-impediment-id-allocation-5s) (three flaky closeout tests), [THR-1329](https://linear.app/threadbare/issue/THR-1329/seed-99-mints-zero-trade-routes-in-150-ticks-so-the-trade-route-kind-is) (already on the shelf; noted for the ratio only). Under the 2026-08-10 process-work throttle the weekly retro is the single promotion point for delivery-machinery work, and none of these is a loss corrupting work as it runs. THR-1326 and THR-1327 both carry quotable counts and would likely clear the materiality bar **at the retro**; this lane is not their promoter.

## T1.5 — wayfinder sweep

Three open maps, membership unchanged, all three still **entirely HITL**.

| Map | Frontier | AFK resolved | HITL surfaced |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | **0 available** | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | **0 available** | THR-1232 (`prototype`) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | **0 available** | THR-1236 (`prototype`) |

Membership was re-derived from this run's own `Todo` sweep, not inherited: all twelve children present, every one labelled `grilling` or `prototype`. The new-arrivals pass (`createdAt: -PT3H`) returned exactly two issues, THR-1344 and THR-1345, **neither carrying a `wayfinder:*` label** — so no wayfinder ticket has been created since run 08-28l and map membership cannot have grown. Run 08-28k's direct proof stands: `wayfinder:research` (19) and `wayfinder:task` (3) are **all `Done`**, so the zero in the AFK column means every agent-doable ticket these maps have ever carried is finished, not that the sweep failed to look. `ORCH_WAYFINDER_AFK_MAX` (2) did not bind — there was nothing to bind against.

**One membership change worth recording:** [THR-1232](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) now carries an assignee where it did not at run 08-28l. Strictly that removes it from the *frontier* (frontier = open, unblocked, **unclaimed**), but it is a `wayfinder:prototype` ticket, so it was never AFK-eligible and its disposition is unchanged: it waits on Christian either way. It stays surfaced above rather than being silently dropped on a definitional technicality.

Nothing claimed, nothing assigned, no guessed resolution posted. Grilling and prototype tickets are never touched by this lane.

## T2 — design authoring

**Trigger fires on the letter of the metric; barred by the `In Design` bound, as at run 08-28l.**

- **Shelf count: TRIGGERED — but the number is now misleading, and that is this run's one measurement finding.** `ORCH_PROGRAM_WORK_FLOOR` is 2; the trigger counts non-`Deferral` items in `Ready for Dev`. That count is still **1** ([THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach)) because both items promoted this run carry the `Deferral` label. By intent the shelf just gained two genuine engine/content tickets in an active program — 230 sublocations of dead authored content and a type-drift guard are not clean-up chores. **The label is a provenance marker (this was deferred out of another ticket), not a size or value marker**, and the trigger reads it as though it were the latter. Stated, not acted on: the constant is not this lane's to change mid-run, and the bound below makes it moot this hour regardless. Worth one line at the weekly retro.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (10 days, `startedAt` 2026-08-19) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (14 days, `startedAt` 2026-08-15). Both far past the 48h threshold and **re-surfaced, not re-staged**, per the rule.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — unchanged from runs d, e, f and l. Runner-up unchanged: THR-1315.

**The T2 queue is unchanged in composition:** nine design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, THR-1318), the two parked in the column, three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300, all fully unblocked), and twelve wayfinder questions on fully-prepared maps. This run added none and cleared none.

**Product-vs-process ratio.** Both promotions this run were **product** (engine/content), so the one-process-ticket-per-three-runs budget was not spent and the Rule 0 materiality bar was applied only to decline — see the four throttled process tickets in T1. Week to date is unchanged from run 08-28l's measurement (≈70/30 product to process).

**The headline moved for the first time in four runs.** The last four reports read *"the feature pipeline needs design/Christian to keep the executor fed."* Tonight the executor fed itself: shipping one ticket produced two more, both properly specified with coordination blocks at filing. That is the deferral pipeline working exactly as designed, and it buys hours, not days — the design column is still frozen, and self-spawned deferrals cannot substitute for a prepared design indefinitely.

## T3 — architecture health

**Not due — the hour is wrong and the day's sweep has not come round yet.** Local time at this sweep is **02:30**, before `ORCH_HEALTH_SWEEP_HOUR` (6). The 2026-08-29 daily sweep will fall to the first run after 06:00 local. The last completed sweep is run 08-28b at 07:35 local: [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md).

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.** Run 08-28b's judgement pass stands. The T1 promotion reasoning above is a ticket-gate reading, not a redundancy judgement over the interface map and systems inventory.

**Stalled work: not re-assessed this run**, but one observation is worth recording because the `In Dev` set changed. It now holds five: THR-1323 and THR-1322 both genuinely claimed and moving (THR-1323 spawned two deferrals within the hour), plus the three `Parked` umbrellas awaiting Christian. No issue shows the `ORCH_STALLED_PICKUP_THRESHOLD` pattern — repeated `Ready for Dev → In Dev` with no `Done`.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted* — asking rather than falling through to un-agreed work. That threshold is further from being met than at run 08-28l: two agreed engine tickets went onto the shelf this hour, and the T2 queue still holds nine design calls, three plan-doc sessions and twelve wayfinder questions, all agreed. The constraint remains that every route from agreed work to a *prepared design* runs through a person, which is stated under `## Needs Christian` as a decision already on his list rather than asked on Discord.
