---
lane: tb-orchestrator
run: 2026-08-28l
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-28 (run l, ~23:27Z)

## Needs Christian

**One thing changed tonight, and it is the thing runs i–k warned about: the work shelf has run down to a single piece of game work.**

Two items finished in the last hour ([the CLAUDE.md diet](https://linear.app/threadbare/issue/THR-1336/claudemd-diet-gate-law-and-sandbox-lore-move-to-canonops-pages-with) at 23:16Z and [the pull-work claim-predicate fix](https://linear.app/threadbare/issue/THR-1325/pull-works-claim-predicates-miss-two-live-states-a-lane-resumes-a-live) at 23:15Z). The queue is now **six items, of which five are small deferred clean-ups and exactly one is real game work** — [the Prose Doctrine v2 remediation sweep](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach). The machine that builds things is working fine and drained two items this hour. What it is running out of is things to build.

Normally this is the moment the lane prepares another design itself. **It cannot, because two designs are already frozen waiting for a person** — and that is now costing something concrete rather than being a bookkeeping note.

**Your three standing asks, in the order they now matter:**

1. **Two frozen designs are the bottleneck, and there are now three finished design jobs queued behind them.** [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (**9 days**) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (**13 days**) are both sitting in the design column. While they sit, no new design can be prepared. Behind them, the Proactive Agent Actions programme has just finished its first three plan docs ([the substrate](https://linear.app/threadbare/issue/THR-1292/the-undertaking-substrate-proactive-agent-actions-plan-doc-16), [the binder](https://linear.app/threadbare/issue/THR-1296/the-binder-proactive-agent-actions-plan-doc-36), [the action library](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions)) and **the remaining three are all fully unblocked and ready to be written** — [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46), [the calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56), and [the undertaking factory](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66). Either pick up one of the two frozen ones, or say "park it" and the column opens.

2. **[Approving the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)** unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)). The brief is written and on main; the ticket is High priority and waiting on one yes or no from you. It is the biggest single lever on the content side and would put real game work back on the shelf immediately.

3. **Three wayfinder maps are waiting entirely on you.** Every question an agent could answer alone is answered; what is left is judgement about how the game should feel.
   - **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten open, including [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands) and [how many faces defeat should wear](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum).
   - **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one left: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).
   - **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one left: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

   The two generator sketches are the cheapest — you look at a list and react. Say "work the map" when you have an hour.

Nothing has gone wrong, and nothing here is a technical problem. All three are supply decisions only you can make.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0.** Nothing was promotable. Two candidates were newly classified (below), which narrows the unclassified set rather than moving anything.

Board at the sweep: **6 `Ready for Dev`** (`hasNextPage: false`), down from 8 at run k; **4 `In Dev`** — only THR-1322 genuinely claimed (assigned to Christian), plus the three `Parked` umbrellas THR-1130 / THR-1133 / THR-1168; **2 `In Design`**; `Todo` returned 46, `hasNextPage: false`. **`Idea` queried by hand** for the seventh consecutive run.

### The shelf drained and nothing refilled it

Two items completed since run k, both Continuous Improvement: [THR-1336](https://linear.app/threadbare/issue/THR-1336/claudemd-diet-gate-law-and-sandbox-lore-move-to-canonops-pages-with) (23:16:12Z) and [THR-1325](https://linear.app/threadbare/issue/THR-1325/pull-works-claim-predicates-miss-two-live-states-a-lane-resumes-a-live) (23:15:15Z). THR-1325 was one of the two non-`Deferral` items run k counted, so **program work on the shelf fell 2 → 1** and crossed below `ORCH_PROGRAM_WORK_FLOOR` for the first time in this run sequence. See T2.

### New-arrivals pass — empty, and it does double duty

`createdAt: -PT3H` returned **zero** issues. Beyond confirming no new T1 candidates, this is the proof T1.5 needs: no wayfinder ticket can have been created since run k's sweep, so map membership cannot have grown. One call, two answers.

### Two candidates classified for the first time

Both were in the `Todo` set but named in no prior run's decline list. Recorded so they are not re-derived.

- **[THR-1024](https://linear.app/threadbare/issue/THR-1024/detailmodal-forks-its-own-overlay-instead-of-composing-modal-no)** (DetailModal forks its own overlay) — **declined, unmet blocker.** Its description carries an explicit prose gate: *"Sequencing — do not start this before THR-966."* [THR-966](https://linear.app/threadbare/issue/THR-966/detail-page-tts-is-unreachable-the-detailmodaldetailpage-cluster-is) is still `Idea`, and it holds a prune-vs-mount decision that would make this ticket die outright — the ticket says so itself (*"If the cluster is pruned, this ticket dies with it"*). Promoting it risks paying for work that is deleted on the next decision.
- **[THR-175](https://linear.app/threadbare/issue/THR-175/ui-overhaul-08-deferred-agentsphere-field-engine-schema)** (agent.sphere field) — **declined, unmet trigger gate.** It carries a two-branch trigger (creation-sphere content shipping, or a template needing `sphere` as an axis independent of `reach`), neither of which has fired, plus an explicit *"Do not start this work before the trigger"* and a design-doc-first requirement. Not a dated gate, so there is no date to name — it opens on a content event, and the lane re-checks it each sweep.

### Declined — the standing set, unchanged

No member moved. THR-1222 (unmet chat-approval gate — ask 2 above), THR-1195 (standing verdict on record 2026-08-22), THR-1256 (time gate, opens 2026-09-08), THR-1255 / THR-1218 (gated on content density), THR-1220 (HITL review session, never promotable), THR-870 (parked by creative-director sequencing), the design-gated tickets routed to T2 (THR-1155, THR-1274, THR-1287, THR-1114, THR-1134, THR-1189, THR-1302, THR-1315, THR-1318), THR-1301 and THR-1303 (see below), and the program epics. All `wayfinder:*` items skipped unconditionally.

**THR-1301 / THR-1303 re-read this run because a blocker moved.** [THR-1297](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions) went `Done` 2026-08-27T21:14:07Z, which is a real blocker clearing. It is **not enough for either ticket**: [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) lists two native `blockedBy` relations and the second, [THR-1302](https://linear.app/threadbare/issue/THR-1302/the-boards-ambition-boost-is-true-by-construction-for-undertakings-a), is still `Todo` — and THR-1302 itself says its fix is *"a design call, not settled here"*, so it is T2's input, not a promotable ticket. [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) is blocked by THR-1301 in turn. The chain is real and holds. Recorded because "the sweep read the cleared blocker and it changed nothing" and "the sweep did not look" are indistinguishable otherwise.

## T1.5 — wayfinder sweep

Three open maps, membership unchanged, all three still **entirely HITL**.

| Map | Frontier | AFK resolved | HITL surfaced |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | **0 available** | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | **0 available** | THR-1232 (`prototype`) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | **0 available** | THR-1236 (`prototype`) |

Frontier membership was **re-derived from this run's own `Todo` sweep**, not inherited: all twelve children are present, every one labelled `grilling` or `prototype`, none assigned. Run k proved independently — via direct `wayfinder:research` (19, all `Done`) and `wayfinder:task` (3, all `Done`) queries — that the zero in the AFK column means *every agent-doable ticket these maps have ever carried is finished*, not that the sweep failed to look. That proof is still sound this run without re-running the two queries, because the new-arrivals pass above returned empty: no wayfinder ticket has been created since. `ORCH_WAYFINDER_AFK_MAX` (2) did not bind — there was nothing to bind against.

Nothing claimed, nothing assigned, no guessed resolution posted. Grilling and prototype tickets are never touched by this lane. Surfaced by name under `## Needs Christian`.

## T2 — design authoring

**Trigger fired for the first time. Still barred — on one ground now, not two.**

- **Shelf count: TRIGGERED.** `ORCH_PROGRAM_WORK_FLOOR` is 2 and the trigger is *fewer than* 2 non-`Deferral` items in `Ready for Dev`. The count is **1** — only [THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach). The other five shelf items all carry `Deferral`. Runs i–k reported this count at 2 (at the floor, not below it); THR-1325 completing at 23:15Z is what moved it.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1 and `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (9 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (13 days). Both are far past the 48h threshold and are **re-surfaced, not re-staged**, per the rule.

**This is the run where the two grounds stopped agreeing, and that is the finding.** For four runs T2 was barred twice over, so the `In Design` bound cost nothing — the shelf was adequate anyway. It is now the sole thing standing between an empty program shelf and a prepared design. The bound is correct and is not being argued with; what has changed is that it has acquired a price, and the price is paid by whoever finds the queue empty in a few hours.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** (no non-human cast primitive — a beast cannot be bound cast, capping the four planned `encounter.hunt.*` members at prose-only antagonists). Unchanged from runs d, e and f. Runner-up unchanged: THR-1315.

**The T2 queue is unchanged in composition:** nine design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, THR-1318), plus the two parked in the column, plus three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300 — **all three now fully unblocked**, docs 1–3 having completed 08-27), plus twelve wayfinder questions on fully-prepared maps. This run added none and cleared none.

**Product-vs-process ratio.** No promotion this run, so neither the Rule 0 materiality bar nor the one-per-three-runs process budget was exercised. For the week (completions with `completedAt` in 2026-08-22 → 08-28, first page of a paginated query, so approximate): **≈37 product/design to ≈17 process, about 70/30.** That is a healthy ratio and worth stating plainly — the 2026-08-08 concern that half of all completions were self-spawned Continuous Improvement work does not describe this week, even though tonight's attended context-cleanup burst (seven tickets, 20:40–21:15Z) was entirely process.

**The headline is unchanged in kind but sharper in degree: the feature pipeline needs design/Christian, and as of this hour it needs it to keep the executor fed rather than merely to stay ahead.**

## T3 — architecture health

**Not due — already run today, and the hour is wrong regardless.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6): [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). Local time at this sweep is 01:27, before the hour; one sweep per day, and this run does not repeat it.

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.** Run b's judgement pass stands; nothing above amends it. The two classifications in T1 are ticket-gate readings, not a redundancy judgement over the interface map and systems inventory.

**Stalled work: not re-assessed this run.** One inherited observation stands: `In Dev` holds four, of which three are `Parked` umbrellas awaiting Christian and one is his own attended claim, so no issue is stalled in the `ORCH_STALLED_PICKUP_THRESHOLD` sense (repeated `Ready for Dev → In Dev` with no `Done`).

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, and no item parked.** The lane's escalation path exists for *agreed work being exhausted* — asking rather than falling through to un-agreed work. That threshold is not met: the T2 queue holds nine design calls, three plan-doc sessions and twelve wayfinder questions, all of them agreed. The constraint is not a shortage of agreed work; it is that every route from agreed work to a prepared design currently runs through a person. That is stated under `## Needs Christian` rather than asked on Discord, because it is not a question — it is a decision already on his list, now with a measured cost attached.
