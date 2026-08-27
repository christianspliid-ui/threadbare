---
lane: tb-orchestrator
run: 2026-08-27i
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-27 (run i, ~14:35Z)

## Needs Christian

**One new thing, and it has a clock on it.** The action-library design session that finished at lunch left a single question open for you, and it will answer itself by silence if nobody asks. In game terms:

> **Should your people fight a little better when they are defending something they own?**

Right now they do not. An agent standing on their own farm, shop or stronghold is scored by the engine as if they were an intruder on somebody else's ground — the inventory that fed this design found it and called it a gap. The plan closes it: standing on your own holding counts as home ground, the same small bonus the rule already gives people on their home territory. It is one authored rule, reversible, and the design session flagged it as **the only behavioral change in the whole document with no ruling of yours behind it**.

- The work: **[The action library — works, holdings & naming](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions)**
- The exact clause: [plan doc, the holdings section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-08-27-thr-1297-action-library-works-holdings-naming.md#L126-L134)

**The clock:** this is the only job on the shelf and the builder went free eleven minutes ago, so it is likely to be picked up within the hour; the rule lands in the third slice of that build. Say *"veto the home-ground rule"* and it comes out; say nothing and it ships. Either is a fine answer — I am surfacing it because you are the only one who can give it, and Linear cannot reach you.

*(Why this is only reaching you now: it was posted to Linear at 12:27 and my last two runs read that ticket for other reasons without noticing the veto line in it. My miss, not a new development.)*

**Everything else below is unchanged from the 13:30 brief.** Skip it if you read that one.

**Still one sentence away: the retrofit batch-2 brief.** Fourth day unchanged, still the cheapest thing on the board — it wants your approval, not your time: **[retrofit-batch-2-brief.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)**. It is also what stands between you and the sitting you asked for on 2026-08-24 — the shrine offering is encounter #1 of that roster, and [the checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) cannot invite you while it is below standard.

**Five design sessions are open to you, unchanged.** In the order I would spend an hour:

1. **[The shareable snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** — your own request from 2026-08-16. When you see a world that looks wrong you still have no way to hand that world to an agent. High, untouched for eleven days.
2. **[The shared anchor machinery](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)** — first of the three typed-game-state documents you ruled on at the wave-1 sitting. Two more designs are chained behind it.
3. **[A beast that can be a real character in a scene](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — only people can be bound into an encounter's cast today, so a hunted animal can only be described, never opposed. Four planned hunt encounters are capped by this.
4. **[The reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46)** — how a mortal who is wronged comes to want something about it.
5. **[The calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56)** — what a mortal's projects look like on screen, and how you follow someone's story.

**The map questions: nine, unchanged.** Nothing has moved on any of the three maps since 2026-08-26. Full list with links in the [06:26 brief](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md); the two fight loops are still the two worth doing first, because answering them opens three others.

**Two design queues have now been open over a week** — [the card grammar](https://linear.app/threadbare/issue/THR-1002) (8 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790) (12 days). Neither was staged by me and both are yours to close. While they sit in the design column they also block this lane from staging anything new, so they cost more than they look.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Declined: 0 fresh.**

Ready for Dev holds **1** ([THR-1297](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions)). `In Dev` holds **3**, all `Parked` — the executor is idle as of 14:27Z. Promotion ceiling never engaged (shelf 1 ≪ 15, 0 of `ORCH_PROMOTE_BATCH_MAX` 5 used).

**Nothing in `Todo` carries an `updatedAt` newer than run h's 13:30Z sweep.** The board is byte-for-byte the board run h assessed, so its dispositions stand unrestated rather than re-derived — [`orchestrator-2026-08-27h.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27h.md) § T1 and [`…-27e.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27e.md) § T1 hold the per-candidate detail. A zero-promotion run is the expected steady state of a board whose only unblocked candidates are design tickets; it is not a finding.

**The two dispositions worth one line each, because both were re-checked rather than inherited:**

- [THR-1298](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) and [THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) — **wrong destination, and now with direct evidence rather than a reading.** Both are unblocked (native `blockedBy` is THR-1292 alone, `Done` 01:42Z; `get_issue(includeRelations)` confirms no second blocker). Their Done-when is *"plan doc in `Docs/plans/` … moved to Ready for Dev with a coordination block"* — i.e. reaching Ready for Dev is their **output**, not their entry. THR-1296, the same shape from the same carve-up, proves the intended path in its own `stateHistory`: `Todo → In Design 06:23 → Implementation Planning 06:45 → Ready for Dev 06:46 → In Dev 07:01 → Done 11:44`. It reached the executor queue *after* its plan doc merged, never before. Promoting these two would put a ticket in the queue whose Done-when the executor cannot satisfy by executing. They are T2's input; T2 is bound out (below).
- [THR-1300](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66) — **unmet blocker, unchanged.** It stands on doc 2, and THR-1297 is `Ready for Dev`, not `Done`. Worth noting the near-miss: THR-1297's handoff comment lists THR-1300 under `Parallel-safe with`, which is true of the *design sessions* (docs-only) and is not a statement that doc 6 may start. The distinction is why the decline stands.

**Run h's promotion completed inside two hours.** [THR-1306](https://linear.app/threadbare/issue/THR-1306/complicationeffects-defaults-a-missing-reputationscore-to-0-not) → `Ready for Dev` 13:30:53Z, claimed 14:15:11Z (45 min on the shelf), `Done` 14:27:48Z. Recorded because shelf-time is the measurement that says this tier feeds a consumer rather than fills a pile; two consecutive promotions have now been consumed inside the hour they were made.

**One coordination observation, passed on rather than acted on.** THR-1297 has been on the shelf since 12:27Z and has been passed over by two claims (THR-1305 at 13:03Z, THR-1306 at 14:15Z), both `Low`-priority deferrals filed after it. Its latest comment is a complete, valid coordination block, so `pull-work` Step 3 is not bouncing it; the likelier reading is ordering — THR-1297 carries **No priority**, which sorts below `Low` in an in-memory priority sort. **This lane does not set priority** (settled scope trap), so this is recorded, not fixed. It resolves itself the moment the shelf holds nothing else, which is now.

**Rule-0 / product-vs-process.** Nothing promoted, so no materiality judgement was owed and no process ticket was filed or promoted. The product-vs-process completion split from run c stands unrecomputed rather than re-asserted.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: zero, structurally — re-measured this run, not inherited.** A label-filtered query returns **19 `wayfinder:research` tickets, all `Done`**, and no `wayfinder:task` exists anywhere on the board. Every open map child is `wayfinder:grilling` or `wayfinder:prototype`, which are HITL by construction and which the skill forbids an agent resolving. Nothing claimed, nothing assigned. Newest `updatedAt` across the whole wayfinder set is still 2026-08-26T07:02Z — a genuinely static frontier, not one that moved and settled.

Nine questions surfaced under § Needs Christian; three of the twelve open children stay blocked behind the two fight loops.

## T2 — design authoring

**Triggered by shelf depth, bound out — ninth consecutive run.**

Non-`Deferral` items in Ready for Dev: **1** (THR-1297), below the floor of 2.

`In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1: [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, `updatedAt` 2026-08-19 — 8 days) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, 2026-08-15 — 12 days). Both far past 48h, so both are **re-surfaced, not re-staged**. No staging performed; the bound was not overridden, and clearing the slot was again declined on the standing grounds — it is Christian's design queue and this lane staged neither item.

The standing observation gained no new evidence this hour and is not re-argued: `In Design` is functioning as a parking lot, `ORCH_MAX_IN_DESIGN` counts a park the same as live work, and two stalled items therefore bind out the one tier whose job is to refill the shelf — with two unblocked, agreed, docs-only design tickets (THR-1298, THR-1299) sitting in `Todo` waiting for exactly that tier. Logged for the weekly retro per the process-work throttle; **no ticket filed**.

## T3 — architecture health

**Not due — already run today.** Run c performed the daily sweep at 04:26Z (06:26 local, the first run past `ORCH_HEALTH_SWEEP_HOUR`), covering all four detectors plus the redundancy judgement and the stalled-work check. Its findings stand and are deliberately not restated: [`orchestrator-2026-08-27c.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md).

**No detector ran this run, and none is reported as clean.** `newFindings: 0` in the frontmatter means *not measured this run*, not *measured and empty*. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless — not run, not reported as clean.

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands.

**Stalled work — one line, since the tier did not run:** `In Dev` holds 3, all `Parked`; no live claim. THR-1305 and THR-1306 each completed after a single clean `Ready for Dev → In Dev` transition. Nothing on the board approaches `ORCH_STALLED_PICKUP_THRESHOLD`.

## Escalations

**Nothing asked on Discord, nothing parked.** The one open question this run found (the home-ground veto) belongs to Christian by construction and is routed through § Needs Christian, which is the sanctioned path; `ORCH_ESCALATION_CHANNEL` is for questions this lane cannot resolve about its *own* work, and it had none.

**Process note, for the weekly retro, no ticket:** the home-ground veto sat unread in a Linear comment for two hours across two runs that both opened that ticket for other reasons. Runs g and h each read THR-1297 — one to record its arrival, one to derive a mutex from its recon record — and neither scanned it for a Christian-facing ask. There is no rule that says to; the § Needs Christian sweep looks at the board, not at the comment bodies of shelf items. Cost this time was two hours of a reversible decision, well under the materiality bar, so it is a log row rather than a ticket. Worth a retro sentence because the shape recurs: a design session's veto line is addressed to someone who does not read the surface it is written on.
