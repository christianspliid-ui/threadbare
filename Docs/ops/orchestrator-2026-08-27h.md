---
lane: tb-orchestrator
run: 2026-08-27h
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-27 (run h, ~13:30Z)

## Needs Christian

**Nothing new needs you this hour, and the build is not idle.** The builder picked up last hour's promotion within half an hour and is working on it now; a second defect was filed by that work and is queued behind it. Two jobs waiting, one in progress. Everything below is unchanged from the 12:31 brief and is repeated only because this file is what the brief reads — skip it if you read that one.

**Still one sentence away: the retrofit batch-2 brief.** Fourth day unchanged, still the cheapest thing on the board — it wants your approval, not your time. The camp-seven encounters are written content work with no design session in front of them, parked solely because your own rule from the factory sitting says the brief gets your yes first: **[retrofit-batch-2-brief.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)**. It is also what stands between you and the sitting you asked for on 2026-08-24 — the shrine offering is encounter #1 of that roster, and [the checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) cannot invite you while it is below standard.

**Five design sessions are open to you, unchanged.** In the order I would spend an hour:

1. **[The shareable snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** — your own request from 2026-08-16. When you see a world that looks wrong you still have no way to hand that world to an agent. High, untouched for eleven days.
2. **[The shared anchor machinery](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)** — first of the three typed-game-state documents you ruled on at the wave-1 sitting. Two more designs are chained behind it, so this hour unjams three tickets rather than one.
3. **[A beast that can be a real character in a scene](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — only people can be bound into an encounter's cast today, so a hunted animal can only be described, never opposed. Four planned hunt encounters are capped by this.
4. **[The reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46)** — how a mortal who is wronged comes to want something about it.
5. **[The calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56)** — what a mortal's projects look like on screen, and how you follow someone's story.

**The map questions: nine, unchanged.** Nothing has moved on any of the three maps since 2026-08-26. Full list with links in the [06:26 brief](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md); the two fight loops are still the two worth doing first, because answering them opens three others.

**Two design queues have now been open over a week** — [the card grammar](https://linear.app/threadbare/issue/THR-1002) (8 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790) (12 days). Neither was staged by me and both are yours to close. Noted again because while they sit in the design column they also block this lane from staging anything new, so they cost more than they look.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0. Declined: 0 fresh.**

Ready for Dev held **1** at scan and holds **2** at write. `In Dev` holds 4: the live claim on [THR-1305](https://linear.app/threadbare/issue/THR-1305/the-debug-encounter-tools-bypass-the-scored-binder-spawn-review-casts) plus the three standing `Parked` items. Promotion ceiling never engaged (shelf 1 ≪ 15; 1 of `ORCH_PROMOTE_BATCH_MAX` 5 used).

**Run g's promotion was picked up inside the hour.** THR-1305 → `Ready for Dev` 12:28:23Z, claimed `In Dev` 13:03:18Z — 35 minutes on the shelf. Recorded because it is the measurement that says this tier is feeding a consumer rather than filling a pile.

### promote THR-1306 — filed one minute after the last scan

[THR-1306](https://linear.app/threadbare/issue/THR-1306/complicationeffects-defaults-a-missing-reputationscore-to-0-not) (*`complicationEffects` defaults a missing `reputationScore` to 0, not `DEFAULT_REPUTATION`*) → `Ready for Dev`, verified by re-query: `stateHistory` records the transition at 13:30:53Z, **no `assignee` key present**, priority untouched at Low.

**Nothing had to clear.** Native `blockedBy` is empty and the description carries no prose gate and no time gate. It is new rather than newly-unblocked: filed 12:28:42Z by the THR-1304 executor as an in-scope find, **one minute after run g's board scan at 12:27Z**, so this is the first sweep that could see it. No comments, so no standing retire verdict to check against (THR-990). Names no plan doc, so the THR-921 liveness gate passes trivially.

**The premise was re-verified against `origin/main` @ `d34873bc`** rather than read off the ticket, on the standing principle that a body is a claim about a tree that has since moved twice:

```
$ git show origin/main:src/engine/complicationEffects.ts | sed -n '135,138p'
    case 'reputation_delta': {
      const current = typeof actorNode.properties.reputationScore === 'number'
        ? actorNode.properties.reputationScore : 0;
      actorNode.properties.reputationScore = Math.max(0, Math.min(1, current + effect.delta));

$ git show origin/main:src/engine/npcSeeding.ts | grep -c "reputationScore"
0
```

Both halves hold. The `: 0` is still live and still **persisted** on the next line, and `npcSeeding` still writes no `reputationScore` at all — so the exposed population the ticket names is real and was not closed by THR-1304 merging. The defect is a live product one: a complication carrying any negative delta drops an unseeded agent below `LOW_REP_THRESHOLD`, which is the deaths loop's own predicate, making them a death candidate every tick from a starting point every other reader in the engine calls neutral.

**Its coordination block was posted as a fresh comment, and it corrected the ticket's own mutex line.** The description said `Mutex with: none known at filing … Re-verify at pickup rather than trusting this line` — and that line is now stale, because THR-1297 reached the shelf at 12:27Z, *after* this ticket was filed. THR-1297's recon-record comment commits its executor to editing `npcSeeding.ts:361` in the ~49-site raw `member_of` wrapper sweep and to annotating `complicationEffects.ts:105,182`; both line references confirmed present on `d34873bc` rather than taken from the recon record. So the promoted block reads `Mutex with: THR-1297 (both edit src/engine/npcSeeding.ts; also both touch src/engine/complicationEffects.ts)`, with the reason inline per THR-688 rule B.

One coordination fact was passed to the executor without being turned into a verdict: THR-1306's Done-when deliberately leaves the seam open — fix the reader in `complicationEffects.ts`, or have `npcSeeding` write the field at seed time. The first collides with a file THR-1297 merely *annotates*; the second collides with the file it *sweeps across ~49 sites*. Which to pick is a technical call and stays the executor's; the ticket's own argument that the seeding seam closes the class is the stronger engineering case, and it was not overridden here.

**Not corrected, deliberately: THR-1306 carries no project**, while both its parents (THR-1304, THR-1296) sit in *Thematic Pressure & Living World*. Deferrals inherit their parent's project, so this is an orphan by omission and the executor's Finish-Before-You-Start ordering will read it as belonging to no active project. Project hygiene is `daily-backlog-grooming`'s, not this lane's — recorded in the promotion comment for whoever gets there first, not fixed here.

### The rest of the board is not restated

Run e's exhaustive per-candidate sweep (10:27Z) and run g's spot-check stand. Nothing in `Todo`, `Ready for Dev`, `In Design` or `In Dev` carries an `updatedAt` newer than run g's 12:31Z sweep except THR-1305 (claimed, above) and THR-1306 (promoted, above). In particular the four Proactive-Agent-Actions doc tickets are unchanged and their dispositions are unchanged: [THR-1298](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) and [THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) are unblocked (THR-1292 `Done` 01:42Z) but remain **wrong destination** — a design ticket whose Done-when is a plan doc belongs `In Design`, not in the executor queue, and THR-1297 proved the path this morning by running Todo → In Design → Ready for Dev in 24 minutes. [THR-1300](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66) stays declined on an **unmet blocker**: it stands on doc 2, and THR-1297 is `Ready for Dev`, not `Done` — its kind registry is designed but not built, and a gate cannot check completeness against a schema that does not exist yet in code. Restating forty unchanged declines hourly is what trains a reader to skip this file; [`orchestrator-2026-08-27e.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27e.md) § T1 holds them.

**Rule-0 / product-vs-process.** The one promotion is **product** — an engine correctness defect with a player-visible consequence (agents wrongly entering the death-candidate pool), so the materiality bar and the one-process-ticket-per-three-runs budget do not gate it. No process ticket was filed or promoted this run. The product-vs-process completion split from run c stands unrecomputed rather than re-asserted.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: zero, structurally.** Re-confirmed this run by a label-filtered query rather than inherited from run g: **all 19 `wayfinder:research` tickets across every map are `Done`**, and no `wayfinder:task` exists. The twelve open children are all `wayfinder:grilling` or `wayfinder:prototype` — HITL by construction, and the skill forbids an agent resolving one. Nothing claimed, nothing assigned, correctly. Newest `updatedAt` across the wayfinder set is still 2026-08-26T08:31:10Z, so this is a genuinely static frontier rather than one that moved and settled. Nine questions surfaced under § Needs Christian; three of the twelve stay blocked behind the two fight loops.

## T2 — design authoring

**Triggered by shelf depth, bound out — eighth consecutive run.**

Non-`Deferral` items in Ready for Dev: **1** (THR-1297), below the floor of 2. This run's promotion does not change that number — THR-1306 carries the `Deferral` label and so does not count toward the floor by design, the exclusion existing precisely because executor-filed deferrals were what let the shelf read healthy while authored program work sat in `Todo`.

`In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1: [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, 8 days) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, 12 days). Both far past 48h, so both are **re-surfaced, not re-staged**. No staging performed; the bound was not overridden, and clearing the slot was again declined on the standing grounds — it is Christian's design queue and this lane staged neither item.

The observation runs b–g recorded stands and gained a second data point this morning: THR-1297 passed *through* `In Design` and out in 24 minutes while those two sat. `In Design` is functioning as a parking lot, `ORCH_MAX_IN_DESIGN` counts a park the same as live work, and so two stalled items indefinitely bound out the one tier whose job is to refill the shelf. Logged for the weekly retro per the process-work throttle; **no ticket filed**.

## T3 — architecture health

**Not due — already run today.** Run c performed the daily sweep at 04:26Z (06:26 local, first run past `ORCH_HEALTH_SWEEP_HOUR`), covering all four detectors plus the redundancy judgement and the stalled-work check. Its findings stand and are deliberately not restated: [`orchestrator-2026-08-27c.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md).

**No detector ran this run, and none is reported as clean.** `newFindings: 0` in the frontmatter means *not measured this run*, not *measured and empty*. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless — not run, not reported as clean.

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands.

**Stalled work — one line, since the tier did not run:** `In Dev` holds 4, three `Parked` and one live claim ~30 minutes old. THR-1305 was claimed once, cleanly, on its first pass. Nothing on the board approaches `ORCH_STALLED_PICKUP_THRESHOLD`.

## Escalations

**Nothing asked on Discord; nothing parked.** No question blocked this run.

**Agreed work is not exhausted**, so the strict trigger has not fired and no Discord question is owed. The shelf holds two items and the executor is mid-claim on a third. What remains scarce is *design* supply rather than executable work — unchanged, and unchangeable from this lane while both design slots are parked.

**Home tree left clean.** No git state op was run with the home tree as CWD (THR-672) — this run's git use was read-only (`fetch`, `ls-tree`, `show`, `rev-parse`, `grep`, `sed`). The report publishes via `ops-publish.sh`, which commits by plumbing against a throwaway index and checks nothing out, and is deleted from the working tree afterwards (THR-1056).
