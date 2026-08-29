---
lane: tb-orchestrator
run: 2026-08-29g
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-29 (run g, ~07:27–07:40Z)

## Needs Christian

**Nothing new arrived for you this hour.** The two things from earlier this morning are unchanged and repeated only so they stay in the briefing, which reads the newest orchestrator report and would otherwise show you an empty list.

**1. A design session is still what the pipeline is short of.** Unchanged for nine hours. Every remaining route from "we agree on this" to "an executor can build it" runs through you sitting down with an attended session. The one waiting to be picked up is the **non-human cast problem** — a beast cannot currently be a character in a scene, which is what blocks every hunt encounter from being written ([THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)). Two design efforts have been open in the design column for 10 and 14 days ([the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card), [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)), which is why no new one can be staged behind them.

**2. The unreachable-ambitions world fact, still a design call and still not blocking anything today** — ten of the strategic things characters can decide to pursue are unreachable on one of the two test worlds, because only background characters ever hold them ([THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)).

**One thing worth knowing, not doing.** For most of this morning two finished pieces of work sat unable to merge — not because either was wrong, but because a **test time limit that nobody had re-measured in months** had quietly become too tight for a world that has grown since. The two changes waited 8.7 and 5.7 hours on a check that was failing for no real reason. An automated lane found it, measured the drift, and is fixing the limits now. Nothing is lost and nothing needs you; it is here because "the gate said no while nothing was broken" is the kind of thing worth seeing once.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers resolved: 0.**

Board at the sweep: **46 `Todo`** (`hasNextPage: false`), **7 `Ready for Dev`** (`hasNextPage: false`), **2 `In Design`**, **7 `In Dev`** (4 live claims, 3 `Parked`). An `Idea` slice was scanned as well (25 returned, `hasNextPage: true`) since step 2 names `Idea` as a candidate state — its head is four `drift-scan` rows plus two undertaking-chain deferrals, nothing promotable. The promotion ceiling did not bind: the shelf is at 7, well under the 15-item backed-up threshold.

**Nothing was promotable. Three things changed on the board since [run f](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29f.md) closed at 06:35Z, and none of them opens a promotion.**

| Change | Effect on the promotable set |
|---|---|
| [THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) `In Dev` → **`Done`** (07:21:49Z, PR [#1714](https://github.com/christianspliid-ui/threadbare/pull/1714)) | **Unblocks nothing.** Checked directly rather than assumed: `relations.blocks` is `[]`. It carries 24 `relatedTo` edges and zero blocking edges, which is exactly the shape that reads like a cascade and is not one. |
| [THR-1352](https://linear.app/threadbare/issue/THR-1352/two-heavy-world-build-tests-drifted-3x-past-their-documented-cost) created directly into **`In Dev`** (07:10:21Z) by `tb-opus-pickup` | Never entered the promotable set. Surfaced below as this run's one new finding. |
| ~12 issues stamped `updatedAt` 07:19–07:20Z | **Metadata churn, not board movement** — relation edges written by THR-1352's filing pass. Every affected issue holds its prior state (`Ready for Dev` ×3, `Todo` ×2, `Done` ×2 with unchanged `completedAt`). Recorded because a wall of near-identical timestamps reads like a state sweep and is not one. |

**The undertaking chain is unmoved and still two hops deep:** THR-1349 → THR-1301 → THR-1303. Verified this run from `THR-1301`'s own relations rather than carried forward — `blockedBy` is THR-1349 (`Ready for Dev`, **not** `Done`), THR-1302 (`Done` 03:42Z) and THR-1297 (`Done` 08-27 21:14Z). One live gate, unchanged.

**[THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) has now sat unclaimed for 1h44m** as the queue's top product candidate, correctly filed and fully unblocked. That is not a defect and needs no repair: the executor's hour went to a Rule-0 flow impediment instead (THR-1352 below), which is the priority order working as written. Noted so tomorrow's sweep can tell "waiting its turn" from "being refused".

**No `save_issue` was called this run**, so there is no write to verify.

### One standing decline reason corrected — the throttle was being cited for something it does not say

[THR-1328](https://linear.app/threadbare/issue/THR-1328/de-flake-the-three-named-closeout-tests-impediment-id-allocation-5s) (three flaky closeout tests) has been declined for five consecutive runs on the reason *"the weekly retro is their single promotion point."* **That reason is imprecise, and this run stops repeating it.** CLAUDE.md's throttle says the retro *"batches the log and **files** the few tickets that clear the materiality bar"* — the retro is the **filing** point, and it already filed THR-1328 on 2026-08-28. This lane's own Rule-0 discipline bars a process ticket *"without quotable above-bar loss AND a cost/benefit line"*; THR-1328 has both (impediments #779/#819/#869 this cycle plus #527/#644, ~3 hits/week, 41 minutes of a blocked armed PR on PR [#1676](https://github.com/christianspliid-ui/threadbare/pull/1676), and *"costs ~1 h total; not fixing costs ~15–40 min/week"*). Left as written, the old reason would have parked a retro-blessed ticket in `Todo` indefinitely on a rule that never applied to it.

**It is still declined this hour, for two reasons that are actually true:**

1. **Adjacency to a live claim.** THR-1352 is `In Dev` right now doing the same class of work — recalibrating test budgets — and the two are linked `relatedTo` in Linear. THR-1328's step 1 (*"mark them no-parallel — whichever the vitest config supports cleanly"*) can land in the same config THR-1352 touches. Promoting now buys a mutex, not throughput.
2. **The shelf is not starved.** Seven items are on it and the top one is unclaimed; adding an eighth does not feed anybody.

**Reassess next run after THR-1352 merges** — its fix may subsume or reshape THR-1328's first item, and the honest sequence is measure-then-scope rather than promote-then-collide. Its two siblings, [THR-1326](https://linear.app/threadbare/issue/THR-1326/fresh-worktree-node-modules-stub-find-the-producer-31-arrivalsweek-and) and [THR-1327](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is), stay declined and inherit the same corrected reasoning: they are retro-filed and quotable, so the bar is not what holds them — the budget and the queue are, and neither is a loss corrupting work as it runs.

**The rest of the standing declined set: unchanged member for member** from run f — THR-1303 (blocker THR-1301 is `Todo`), THR-1222, THR-1195, THR-1256 (time gate, opens 2026-09-08), THR-1255 / THR-1218, THR-1220, THR-870, THR-1024, THR-175, the eight design-gated items routed to T2, THR-1348, the program epics, and all 15 `wayfinder:*` items skipped unconditionally.

**Product-vs-process ratio.** No promotion this run, so the one-process-ticket-per-three-runs budget is untouched. Week to date holds at ≈70/30 product to process. The shelf holds unclaimed product work, so the headline is **not** "feature pipeline needs supply" this hour — it is the one standing constraint already on Christian's list: every remaining route from agreed work to a *prepared design* runs through a person.

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | 0 available | THR-1232 (`prototype`) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership re-derived from this run's own state-filtered `Todo` sweep — 3 maps + 12 children, every child labelled `grilling` or `prototype`, 15 `wayfinder:*` items total. Run d proved the AFK column empty directly (19 `wayfinder:research` + 3 `wayfinder:task`, all 22 `Done`); no issue has changed label or state since, so that proof still holds rather than being re-asserted.

`ORCH_WAYFINDER_AFK_MAX` did not bind — there was nothing to bind against. Nothing claimed, nothing assigned, no guessed resolution posted. **No `grilling` or `prototype` ticket was touched**, per the standing rule.

## T2 — design authoring

**Trigger fires; barred by the `In Design` bound. Ninth consecutive run in this state.**

- **Shelf count: TRIGGERED.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` is **1** ([THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach)). The shelf held flat at 7 this hour and the trigger did not move. A **tenth** data point for the standing measurement finding: *the label is a provenance marker, not a size or value marker*, and the trigger reads it as the latter — six of the seven shelf items carry `Deferral`, including a two-seed balance judgement (THR-1349) and a UI-pillar chip fix. Stated, not acted on; the constant is not this lane's to change mid-run, and it belongs in one line at the weekly retro.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — THR-1002 (`startedAt` 2026-08-19, 10 days) and THR-790 (`startedAt` 2026-08-15, 14 days). Both far past the 48h threshold and **re-surfaced, not re-staged**, per the rule.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** (no non-human cast primitive), unchanged for five consecutive runs. Runner-up unchanged: THR-1315.

**T2 queue composition: unchanged and net flat.** Nine design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315, THR-1318, THR-1348), the two parked in the column, three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300, all fully unblocked), and twelve wayfinder questions on fully-prepared maps.

## T3 — architecture health

**Not due — the daily sweep already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z / 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified by reading that report's own T3 section on `origin/ops`, not inferred. **No detector was run this hour**, and none of run d's results (8 LEAKED contracts, 95 total, canon staleness 18, `check:process` exit 0, `sweep:rank-reach` PASS) is restated here as if freshly measured.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Deliberately not reported from Monday's result; [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops`.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** It is a daily-sweep judgement pass and run d did it. Not re-derived here, and not implied to have been.

### New finding — the hand-created `In Dev` count went 2 → 3, and the third has a different producer than the first two

A state observation from this run's own board reads, not a detector result; it changed after run f measured it at 2.

| Issue | Created | State history | Producer |
|---|---|---|---|
| [THR-1352](https://linear.app/threadbare/issue/THR-1352/two-heavy-world-build-tests-drifted-3x-past-their-documented-cost) — heavy test budgets drifted ~3× past their documented cost | 07:10:21Z (~17 min) | **`In Dev` only** — one entry, never `Ready for Dev` | **`tb-opus-pickup`, a scheduled lane** |

Runs b–d recorded this count clean; run f found THR-1350 and THR-1351, both created 06:17Z by an *attended* session on Christian's direct chat asks. THR-1352 is the third today and the **first from an automated lane**, which makes it a second producer class rather than a third instance of one.

**Per the THR-1325 item-3 ruling, this lane reports and does not normalise.** The issue was not written to and was not moved back to `Ready for Dev`. Claim arbitration is `pull-work` Step 1.8's — it holds the comment timestamps and open-PR view this lane does not.

**The honest severity, and it cuts two ways.** The *filing* is correct and well-evidenced: two armed PRs (#1714 / #1717) sat red on the required check for **526 and 342 minutes** on a single timeout, both budgets measured stale by ~3× (`debugTickBatch` claimed "~18s standalone", measured 44.9s; `lairClearing` claimed "~15s", measured 45.7s), with a cost/benefit line and a PR ([#1723](https://github.com/christianspliid-ui/threadbare/pull/1723)) already attached. That is squarely the *"a loss actively corrupting work right now"* exception to the process-work throttle, which permits a lane to file immediately — so **this is not a throttle violation and must not be counted at the retro as one.** What it *is* is the third ticket today to skip `Ready for Dev`, and therefore the third to carry no coordination block and no T1 Rule-0 classification. The ruling asked for that to be made countable rather than fixed in flight; three data points in one day, from two producer classes, is what countable looks like.

**Not `In Dev` overload.** The four live claims (THR-1344, THR-1350, THR-1351, THR-1352) are four *different* issues across sessions, which the WIP rule permits — one In Dev per session, parallel work on different issues. Recorded so a later reader does not misread the count as a violation. THR-1322 left the set to `Done` at 07:21Z.

### Stalled work

**Not re-assessed this run** — a daily-sweep item, assessed by run d at 04:30Z; its result stands. One line carried forward because the `In Dev` set moved:

- **THR-1322 closed at 2 transitions and is now moot.** Run f flagged it at 2 `Ready for Dev → In Dev` transitions, one short of `ORCH_STALLED_PICKUP_THRESHOLD` (3). It reached `Done` at 07:21:49Z, so it never crossed and leaves the watch list. Its full arc — Idea → Todo → RfD → In Dev → RfD → Todo → RfD → In Dev → Done across 08-28/08-29 — is a ticket that bounced twice and then shipped, not a stall.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted* — asking rather than falling through to un-agreed work — and that threshold did not move closer: the T2 queue holds nine design calls, three plan-doc sessions and twelve wayfinder questions, all agreed.

The one standing constraint is unchanged and already on Christian's list: every remaining route from agreed work to a prepared design runs through a person. Nine consecutive runs of a barred T2 column is that constraint staying visible, not a new problem.
