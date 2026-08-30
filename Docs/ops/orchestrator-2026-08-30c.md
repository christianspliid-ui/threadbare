---
lane: tb-orchestrator
run: 2026-08-30c
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-30 (run c, ~05:26–05:40Z)

## Needs Christian

**One thing is now off your list, and it is the one that has been on it longest.**

The merchants-and-trade-routes question — *should a mortal pursue work their nature doesn't value?* — has been carried to you as an open ask in every briefing since yesterday morning. **You already answered it.** On Discord at 10:39 UTC yesterday you said you want other gods competing, with their own threaded agents doing things off-screen. That settles it: the world's off-screen life comes from **threading**, not from widening what the simulation watches. A lane recorded that on the ticket at 04:56 this morning, and I have acted on it — the work is unblocked and queued. **Nothing is needed from you unless that reading is wrong**, in which case say so and I will park it again. [The ruling as recorded](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) · [the work it unblocked](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade).

**The one ask this hour — and it is a small one that unblocks four pieces of work.**

Two design items have been sitting in "In Design" for **11 and 15 days** with nobody working them, and the rule that stops me piling more in is a limit of one. So four things that are otherwise ready to be designed cannot start. The two blockers are:

- [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — 11 days, nobody assigned.
- [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — 15 days, **assigned to you**.

**Either finish one, or say "drop them back to the queue" and I will clear the jam.** One word either way.

What is waiting behind them — the last three chapters of the Proactive Agent Actions design you approved, all of which became startable three days ago and which nothing has noticed until now: [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) (how outcomes give mortals new drives — grudges, grievances, the culprit who caused it), [the calling and the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) (following an agent's arc, moment cards, works and holdings on the character sheet), and [the undertaking factory](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66) (the production line for undertakings, mirroring the encounter factory). Plus [the incident-bundle button](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) you asked for.

**Still standing from earlier briefings, unchanged and not re-argued:**

- **Approve encounter batch 2** — seven encounters written and unable to start. One read, one word. [Ticket](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) · [brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). Standing 6 days.
- **Eleven fight-and-magic questions** on your three maps (T1.5 below). Unchanged since 26 Aug.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0.** Board at the sweep: **44 `Todo`** (`hasNextPage: false`), **0 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`** (all `Parked`, all unassigned). Neither ceiling bound — shelf 0 against the backed-up threshold of 15, one promotion against `ORCH_PROMOTE_BATCH_MAX` of 5.

### The promotion — [THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade), and it reverses this lane's own decline from yesterday

**Exactly one thing on the board moved since run b's sweep**, and it is the thing that matters. Every other `Todo` item's `updatedAt` still predates 2026-08-29T14:38Z; `In Dev` and `In Design` membership is byte-identical. The mover is [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) at **2026-08-30T04:56:43Z** — a comment, not a state change, which is why a sweep reading states alone would have missed it. Run b's own T1 window was 04:26–05:15Z and its board read predates the comment by ~30 minutes.

The comment is a **director ruling** filed by `keep-work-flowing-cc`, recording Christian on Discord at 2026-08-29 10:39 UTC:

> so i think in the longer term we want other gods competing and so having threaded agents that are not the players. those would be able to do stuff "off-screen".

Two consequences, both stated explicitly in the ruling:

1. **THR-1348 is settled** — a fourth reading, landing closest to reading 3 (the aperture is correct; `census:reachability` reporting the narrowness is the honest response). Reading 2 is declined, so its per-tick cost never needs measuring. The ruling instructs that it *"should not be promoted on the strength of an empty `blockedBy`, and it should not appear in any lane's Needs Christian section."* **Both obeyed** — declined, and dropped from the Christian section above.
2. **THR-1349 is unblocked**, verbatim: *"It does not need Christian."*

That directly retires the reason this lane declined THR-1349 at 09:30Z yesterday ("wrong destination — routed to Christian"). The newest verdict wins, which is the THR-990 rule running in the unblocking direction for the first time rather than the blocking one.

**Checks that ran before the write, not after:** `blockedBy` `[]`; latest-comment scan (the 04:56Z ruling is the newest verdict on the pair, 19½ hours newer than the decline it supersedes); plan-doc liveness **LIVE** — `Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md` resolves at `origin/main` (`608c553b`). Liveness was checked by direct resolution in a worktree cut from `origin/main` rather than `npm run check:plan-doc-liveness`, because this run's worktree has no `node_modules`; recorded as a substitution rather than reported as the script's verdict.

**Write verified.** `save_issue` → `get_issue` at 05:31:27Z: `status: "Ready for Dev"`, `stateHistory` carries the transition, **no `assignee` key present** on the re-query. Coordination block posted 05:32:12Z and is the latest comment, so `pull-work` Step 3 will not bounce it.

**Two things the promotion comment carries that a bare state change would not**, both of which decide whether this promotion is worth anything:

- **An honesty flag.** The ruling describes THR-1349's open choice as *"a diversity term in the board's currency vs. consuming the strategic scorer's `varietyPenalty`"* — but **that choice was already made and shipped** in [PR #1724](https://github.com/christianspliid-ui/threadbare/pull/1724) and did not move the number it was prescribed to move. The fork actually remaining is a *different* one (should a template whose authored `motivations` mismatch its proposer be effectively unselectable — `desireMultiplier` `0.0112` against a winner's `2.7750`). The lane's read is stated on the ticket so it can be corrected rather than assumed: the operative sentence is "it does not need Christian", process.md rule 4 puts the *how* with the agent, and Christian's own words lean toward the mismatch being correct. **Surfaced above as a veto invitation, not an ask** — which is what the ruling permits and what re-routing it would violate.
- **Three falsified Done-when items, struck with the ticket's own evidence.** `trades_with > 0` on seed 42 under a live board is unreachable (measured 0 with *and* without the variety term) and is not a valid signal at all (the shipped `'shadow'` board writes 0 on seed 99, so gating it reds the census on `main`). The variety term and the composition gate are both already shipped. Promoting without striking these would have sent the executor at an unsatisfiable acceptance signal — the THR-945 failure this tier exists to avoid, one step later in the pipeline.

### Declines — only the ones whose reasoning is new this run

Run b's fourteen unchanged decline lines are not reprinted; the board did not move under them.

- **[THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)** — **standing verdict decline**, and the ruling that unblocked its sibling is the same ruling that closes this one. `blockedBy` `[]`, `Deferral` in an active project, top of the priority ordering — everything a dependency sweep reads says promote. Its own newest comment says *"long-term direction, not near-term work… should not be promoted on the strength of an empty `blockedBy`."*
- **[THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets)** — **wrong destination**, read in full this run because a `Bug` label makes it look like agreed work by definition. `blockedBy` `[]`, and it is a real defect (nothing anywhere resets `neglectTicks`, so every control stance collapses on a fixed schedule regardless of its holder). But its own Done-when opens *"Design decision recorded first (this is a rules-of-play question, not a defect with one right answer)"*, and [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) proposes deleting control upkeep outright — so fix-versus-delete is undecided and an executor would be guessing which. → T2.
- **[THR-1298](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) / [THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) / [THR-1300](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66)** — **wrong destination, and this is the finding of the tier after the promotion.** All three are `Todo`, unassigned, and **all three are now fully unblocked**, verified by reading native relations rather than inferred from the carve-up's prose: THR-1298 and THR-1299 `blockedBy` THR-1292 (`Done` 2026-08-27T01:42Z); THR-1300 `blockedBy` THR-1297 (`Done` 2026-08-27T21:14Z). They are **design-session tickets** — each Done-when is *"plan doc in `Docs/plans/`… moved to Ready for Dev with a coordination block"* — so they are T2's input, not T1's, and T2 is barred (below). **Three unblocked plan-doc tickets have been sitting startable for three days and no tier has named them.** Run b named only THR-1134 as T2's candidate; this is the first run to count the whole barred set.
- **[THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) / [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix)** — **unmet blocker**, and correctly so even after the promotion. THR-1349 `blocks` THR-1301 as a native relation; THR-1303 is gated on a post-cutover decision-mix floor. The chain THR-1349 → THR-1301 → THR-1303 is three deep and its head just became claimable, so the next two should fall in sequence rather than being promoted early.
- **15 `wayfinder:*` items** skipped unconditionally → T1.5.

```
[orchestrator] T1 promote THR-1349: director ruling on THR-1348 (2026-08-30T04:56Z,
               "it does not need Christian") supersedes this lane's 08-29 09:30Z
               decline; blockedBy [], plan doc LIVE at 608c553b → Ready for Dev,
               assignee null verified on re-query, coordination block 05:32:12Z
[orchestrator] T1 decline THR-1348: standing verdict — same ruling says long-term
               direction, not near-term work; also struck from Needs Christian per
               its explicit instruction
[orchestrator] T1 decline THR-1287: wrong destination — Done-when opens "design
               decision recorded first"; fix-vs-delete undecided against THR-1303
[orchestrator] T1 decline THR-1298/1299/1300: wrong destination — design-session
               tickets, all three verified unblocked (THR-1292 Done 08-27,
               THR-1297 Done 08-27) → T2, which is barred
[orchestrator] T1 decline THR-1301, THR-1303: unmet blocker — downstream of the
               ticket promoted this run
[orchestrator] T1 skip 15 wayfinder:* items unconditionally → T1.5
[orchestrator] T1 decline (unchanged, not re-derived): the 14 lines in run b
```

**Week's product-vs-process ratio.** This run promoted **one product/engine ticket and zero process tickets**, and nothing was declined *for* being process work — Rule 0 and the materiality bar were not the binding constraint. The headline is unchanged in kind but improved in degree: the executor now has exactly one claimable item where it had none, and the constraint behind that is still design supply rather than promotion throughput.

## T1.5 — wayfinder sweep

**Three open maps, frontier 11, all HITL. AFK resolved: 0 — the pool is empty, not skipped.**

Membership is unchanged since 2026-08-26 (no wayfinder issue carries a newer `updatedAt`), so the per-ticket table is not reprinted. Frontier, recomputed from this run's own `Todo` read rather than carried forward:

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 | 6 `grilling`, 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |

The AFK pool is confirmed empty from this run's own data rather than assumed from run b's: the 44-item `Todo` read contains **zero** `wayfinder:research` and **zero** `wayfinder:task` items. `ORCH_WAYFINDER_AFK_MAX` (2) is unreachable because there is nothing to reach. Everything on the frontier is `grilling` or `prototype` — Christian, live, in chat — so nothing was claimed and nothing was touched.

```
[orchestrator] T1.5 3 open maps, frontier 11, AFK available 0 (zero research/task
               items in the whole Todo slice), HITL surfaced 11 — membership
               unchanged since 2026-08-26
```

## T2 — design staging

**Triggered by the shelf, barred by the bound. Not staged. Twenty-third consecutive run.**

- **Shelf:** **0** non-`Deferral` items in `Ready for Dev`, against `ORCH_PROGRAM_WORK_FLOOR` of 2. **Unchanged by this run's promotion** — THR-1349 carries the `Deferral` label, so the executor gained work while the program-work floor did not move. Worth stating plainly rather than letting a promotion read as a shelf repair.
- **Bound:** `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (11 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (15 days, assigned to Christian) — against `ORCH_MAX_IN_DESIGN` of 1. Over by one. Both re-surfaced per the 48h rule, not re-staged.

**What is new this run is the size of what the bound is holding, which no previous run has counted.** Runs b and earlier named a single held-back candidate (THR-1134). The barred set is actually **four**, and three of them became startable on 2026-08-27 when the Proactive Agent Actions carve-up's docs 1 and 2 both went `Done`:

| Held | Blockers | Startable since |
|---|---|---|
| [THR-1298](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) reactive loop | THR-1292 `Done` | 2026-08-27 |
| [THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) calling & surfaces | THR-1292 `Done` | 2026-08-27 |
| [THR-1300](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66) undertaking factory | THR-1297 `Done` | 2026-08-27 |
| [THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) incident bundle | none | — |

Add the two T1 declines routed here this run (THR-1287, and THR-1348's now-settled status) and the design queue behind a one-slot bound is six items deep. **This is the measurement the retro needs**, and it is offered as measurement rather than as an argument to change the bound: the bound is doing exactly what it was written to do, and what it reveals is that nothing is emptying `In Design`. Escalated to Christian above as the run's single ask, because releasing two stalled items is the cheapest thing that moves it.

## T3 — architecture health

**Skipped — already run today.** [`orchestrator-2026-08-30b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-30b.md) ran the daily sweep at 06:26 local (04:26Z) with six new findings recorded. This run started 07:26 local, same UTC day, so the tier is skipped by its own once-per-day rule rather than by omission. **No detector ran this run and none is reported as clean.** The hand-created-`In Dev` check and the redundancy judgement pass are part of the skipped tier and were **not assessed this run**.

One item carried forward for the next sweep, unresolved: run b's `sweep:rank-reach` did not finish inside its window and its verdict remains **unknown**, not `PASS`. Nothing this run produced a result for it, and yesterday's green is deliberately not restated.

## Escalations

- **Nothing asked on Discord this run.** Agreed work was not exhausted — the run found and made a promotion — so non-negotiable #3's "stop and ask" did not fire. The one Christian item is routed through this report's `## Needs Christian` and the hourly briefing, which is the sanctioned channel for a non-blocking ask.
- **Parked, not escalated:** the T2 bound. Twenty-third consecutive barred run, now with the six-deep queue measured above. It belongs to the weekly retro's batch, not to a lane's unilateral change.
- **One correction issued rather than parked:** run b's Christian item 2 (the merchants fork) was already answered when it was written. Not a fault in run b — the answer landed on a *sibling* ticket 30 minutes after run b read the board. Recorded because it is a repeatable failure shape: **a ruling filed on one ticket silently settles another**, and only reading the newest comment across a related set catches it.
