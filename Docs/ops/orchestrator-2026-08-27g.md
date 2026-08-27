---
lane: tb-orchestrator
run: 2026-08-27g
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-27 (run g, ~12:31Z)

## Needs Christian

**The build has two jobs queued and is not running dry.** An hour ago the shelf was empty and the last brief said so. Since then the binder finished, one of its follow-up defects went to the builder, and a second one — plus a freshly designed piece of the mortal-projects work — is now waiting. Nothing below has got worse; one thing got better on its own.

**Still one sentence away: the retrofit batch-2 brief.** Unchanged for a third day, and still the cheapest thing on the board — it needs your approval rather than your time. The camp-seven encounters are written content work with no design session in front of them, parked only because your own rule from the factory sitting says the brief gets your yes first. It is merged and readable: **[retrofit-batch-2-brief.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)**. It is also what stands between you and the sitting you asked for on 2026-08-24 — the shrine offering is encounter #1 of that roster, and [the checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) cannot invite you while it is below standard.

**Five design sessions are open to you, unchanged.** In the order I would spend an hour:

1. **[The shareable snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** — your own request from 2026-08-16. When you see a world that looks wrong you currently have no way to hand that world to an agent. High, untouched for eleven days.
2. **[The shared anchor machinery](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)** — first of the three typed-game-state documents you ruled on at the wave-1 sitting. High, and two more designs are chained behind it, so this hour unjams three tickets rather than one.
3. **[A beast that can be a real character in a scene](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — only people can be bound into an encounter's cast today, so a hunted animal can only be described, never opposed. Four planned hunt encounters are capped by this.
4. **[The reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46)** — how a mortal who is wronged comes to want something about it.
5. **[The calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56)** — what a mortal's projects look like on screen, and how you follow someone's story.

**The map questions: nine, unchanged.** Nothing has moved on any of the three maps since 2026-08-26. The full list with links is in the [06:26 brief](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md); the two worth doing first are still the two fight loops, because answering them opens three others.

**Two design queues have been sitting open for over a week**, and I am not the one who can close them: [the card grammar](https://linear.app/threadbare/issue/THR-1002) (8 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790) (12 days). Neither was staged by me. They are noted here rather than acted on because they are yours — but while they sit in the design column they also block this lane from staging anything new, so they are quietly costing more than they look.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0. Declined: 1 fresh.**

Ready for Dev held **0** at scan (12:27Z) and holds **2** at write — one of them mine, one landed by an attended design session mid-run (below). `In Dev` holds 4: the live claim on [THR-1304](https://linear.app/threadbare/issue/THR-1304/birth-path-defects-the-binder-recon-measured-but-did-not-fix) (claimed 11:32Z, run f's promotion, picked up within the hour) plus the three standing `Parked` items. Promotion ceiling never engaged (shelf 0 ≪ 15; 1 of `ORCH_PROMOTE_BATCH_MAX` 5 used).

### promote THR-1305 — the hold from run f cleared

[THR-1305](https://linear.app/threadbare/issue/THR-1305/the-debug-encounter-tools-bypass-the-scored-binder-spawn-review-casts) → `Ready for Dev`, verified by re-query: `stateHistory` records the transition at 12:28:23Z, **no `assignee` key present**, priority untouched at Medium, project intact.

Run f held this deliberately rather than declining it, on the grounds that its substrate had not merged. That was the correct call and it has now paid off — the hold cleared without further judgement, exactly as predicted. THR-1296's slice 6 merged ~11:57Z (`f678c892`, PR #1665 → `074dbadc`), and THR-1296 auto-closed to `Done` at 11:44Z.

**Both Done-when artifacts re-checked against `origin/main` @ `b8ff6dce`**, not taken from run f's prediction:

```
$ git cat-file -e origin/main:src/engine/binding/__tests__/encounterBinderOptIn.test.ts
PRESENT
$ git grep -c "useScoredBinder" origin/main -- src/
src/data/encounters/one-body-short.ts:1
src/engine/binding/__tests__/encounterBinderOptIn.test.ts:4
src/engine/encounterSupportBundle.ts:2
src/types/unifiedAction.ts:1
```

**The premise was re-verified rather than trusted**, on the principle that a ticket's body is a claim about a tree that has since moved:

* The two call sites are exactly where the ticket says — `debugEncounterTools.ts:426` and `:531` — line numbers still accurate after slice 6.
* `debugEncounterTools.ts` matches neither `SimulationRuntime` nor `EncounterBinderContext` anywhere, confirming the ticket's *"there is none in scope to pass"*.
* `phaseAgentDecision.ts:1095` is the sole production supplier, assembling `census` + `index` + ledger, with an inline comment stating the fail-soft. So the seam is real: spawn-lever review casts through the legacy resolver, live play through the scored board.

**Its coordination block was posted as a fresh comment**, which mattered here more than usual. The description already carried a good block, but `pull-work` Step 3 reads the **latest comment** — and the latest comment was run f's *hold* note, which carries no coordination lines. Left alone, a correctly-promoted ticket would have been bounced hourly on the strength of the very comment that protected it. The mutex (`encounterSupportBundle.ts`) was also checked against the live board and recorded as inapplicable: nothing in Ready for Dev or In Dev touches either file.

### decline THR-1302 — design decision owed inside its own Done-when

[THR-1302](https://linear.app/threadbare/issue/THR-1302/the-boards-ambition-boost-is-true-by-construction-for-undertakings-a) is the one Todo item filed today that does not announce a gate in its title, so it was assessed fresh this run rather than inherited from run e's sweep. Declined on two independent grounds, either sufficient:

* **Wrong destination.** Its own body heads a section *"What a fix looks like (design call, not settled here)"* and closes it *"Needs a decision before it is coded."* Blockers being empty does not make it dev-ready; it makes it T2's input.
* **Chained blocker.** Its third Done-when requires the cutover census ([THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking)) re-run with the change in place, and THR-1301 is itself blocked on undertaking `motivations` being authored — which is doc 2's job, designed but not built.

Worth recording because the finding underneath it is sharp: the measured desire multiplier is `0.354` at p25, p50 **and** p75 across two seeds — a weight that cannot discriminate because the population it scores is generated by the thing it tests. That is the same vacuity class as impediment #829, one term over.

Its siblings THR-1301 and THR-1303 stay declined on the gates named in their own titles; the chain is intact and unchanged.

### The rest of the board is not restated

Run e's exhaustive per-candidate sweep (10:27Z) and run f's spot-check stand. Nothing in `Todo`, `Ready for Dev`, `In Design`, `In Dev` or `Idea` carries an `updatedAt` newer than run f's 11:33Z sweep except THR-1305 (promoted above) and THR-1297 (below). Restating forty unchanged declines hourly is what trains a reader to skip this file: [`orchestrator-2026-08-27e.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27e.md) § T1 holds them.

### Not mine, but checked: THR-1297 reached the shelf mid-run

[THR-1297](https://linear.app/threadbare/issue/THR-1297/the-action-library-works-holdings-and-naming-proactive-agent-actions) (the action library, plan doc 2/6) moved `Todo` → `In Design` 12:03Z → `Implementation Planning` 12:27Z → `Ready for Dev` 12:27:23Z — an attended design session, concluding between this run's two Linear calls. The first Ready-for-Dev scan at 12:27Z returned empty; the re-scan holds it.

**Audited rather than assumed, because it arrived by a path this lane does not control:**

* **Native `blockedBy` fully satisfied** — THR-1296 `Done` 11:44:04Z, THR-1292 `Done` 01:42:26Z. Both are real completions with merged slice PRs attached, not state edits.
* **Plan doc live**, the THR-921 check: `Docs/plans/2026-08-27-thr-1297-action-library-works-holdings-naming.md` resolves on `origin/main` (merged as PR #1666, `93258586`). Not stranded on an unmerged branch.

No action needed and none taken. Recorded so the shelf count below is traceable to two different authors.

**Rule-0 / product-vs-process.** The one promotion is **product** — an engine correctness defect where content review casts differently from live play, so the materiality bar and the one-process-ticket-per-three-runs budget do not gate it. No process ticket was filed this run, and none was promoted. The product-vs-process completion split from run c stands unrecomputed rather than re-asserted.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**Frontier re-derived from this run's own scan, not carried from run f.** Twelve open children across the three maps, and the label on every one of them is `wayfinder:grilling` or `wayfinder:prototype`:

| Label | Open children |
|---|---|
| `wayfinder:grilling` | THR-1266, THR-1267, THR-1268, THR-1269, THR-1270, THR-1271 |
| `wayfinder:prototype` | THR-1232, THR-1236, THR-1263, THR-1264, THR-1265, THR-1272 |
| `wayfinder:research` | **none open** — every one is `Done` |

**AFK burn-down: zero, structurally, not for want of trying.** Both AFK-eligible ticket types are exhausted: there is no open `wayfinder:research` ticket on any map, and no `wayfinder:task`. Everything left is HITL by construction, and the skill forbids an agent resolving one — resolving a grilling or prototype ticket is the broken-HITL failure mode. Nothing claimed, nothing assigned, correctly.

The newest `updatedAt` across the entire wayfinder set is still 2026-08-26T08:31:10Z, so this is a genuinely static frontier rather than one that moved and settled. Nine open questions surfaced under § Needs Christian; three of the twelve remain blocked behind the two fight loops.

## T2 — design authoring

**Triggered by shelf depth, bound out — seventh consecutive run.**

Non-`Deferral` items in Ready for Dev: **1** (THR-1297), below the floor of 2. THR-1305 carries the `Deferral` label and so does not count toward the floor by design — the exclusion exists precisely because executor-filed deferrals were what let the shelf read healthy while authored program work sat in `Todo`.

`In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1: [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, `startedAt` 2026-08-19, **8 days**) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, `startedAt` 2026-08-15, **12 days**). Both far past 48h, so both are **re-surfaced, not re-staged**. No staging performed; the bound was not overridden, and clearing the slot was again declined on the standing grounds — it is Christian's design queue and this lane staged neither item.

**One thing did change, and it is worth naming precisely.** THR-1297 passed *through* `In Design` and out to `Ready for Dev` inside 24 minutes this hour. That is what the column is for, and it is direct evidence that the two items sitting in it for 8 and 12 days are parked rather than in progress — the same column, the same hour, one item moving and two not. The observation runs b–f recorded stands and is now better evidenced: `In Design` is functioning as a parking lot, and `ORCH_MAX_IN_DESIGN` counts a park the same as live work, so two stalled items indefinitely bound out a tier whose whole job is to refill the shelf. Logged for the weekly retro per the process-work throttle; **no ticket filed**.

## T3 — architecture health

**Not due — already run today.** Run c performed the daily sweep at 04:26Z (06:26 local, the first run past `ORCH_HEALTH_SWEEP_HOUR`), covering all four detectors plus the redundancy judgement and the stalled-work check. Its three findings stand and are deliberately not restated: [`orchestrator-2026-08-27c.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27c.md).

**No detector ran this run, and none is reported as clean.** `newFindings: 0` in the frontmatter means *not measured this run*, not *measured and empty*. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless — not run, not reported as clean.

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands.

**Stalled work — one line, since the tier did not run:** `In Dev` holds 4, three `Parked` and one live claim ~1h old. THR-1296 completed this hour after a single clean claim (one `Ready for Dev → In Dev` transition, six slices, no re-claims). Nothing on the board approaches `ORCH_STALLED_PICKUP_THRESHOLD`.

## Escalations

**Nothing asked on Discord; nothing parked.** No question blocked this run.

**Agreed work is not exhausted**, so the strict trigger has not fired and no Discord question is owed. The shelf holds two items and the executor is mid-claim on a third. What remains scarce is *design* supply rather than executable work — and for the first hour in seven that scarcity eased without Christian, because doc 2 got its session.

**The binder programme closed cleanly.** THR-1296 `Done` 11:44Z across six merged slices; its two filed deferrals are now both dispatched — THR-1304 claimed and in flight, THR-1305 promoted this run. Nothing from that programme is left unrouted.

**Home tree left clean.** No git state op was run with the home tree as CWD (THR-672) — this run's git use was read-only (`fetch`, `ls-tree`, `show`, `log`, `grep`, `cat-file`). The report publishes via `ops-publish.sh`, which commits by plumbing against a throwaway index and checks nothing out, and is deleted from the working tree afterwards (THR-1056).
