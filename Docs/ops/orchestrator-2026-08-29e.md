---
lane: tb-orchestrator
run: 2026-08-29e
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-08-29 (run e, ~05:27–06:15Z)

## Needs Christian

**Nothing new arrived for you this hour.** Two things from earlier this morning are still waiting, and they are the same two — repeated here only so they do not fall out of the briefing when it reads this newer report.

**1. A design session is what the pipeline is short of.** The work shelf is being emptied faster than it is being refilled, and every remaining route from "we agree on this" to "an executor can build it" runs through you sitting down with an attended session. The one waiting to be picked up is the **non-human cast problem**: right now a beast cannot be a character in a scene — the game has no way to bind an animal as an actor — which is what blocks every hunt encounter from being written. Two design efforts have also been sitting open in the design column for 10 and 14 days ([the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)), which is why no new one can be staged behind them.

**2. A world fact, not a decision request.** Overnight work measured that on one of the two test worlds, **ten of the strategic things characters can decide to pursue are unreachable** — the whole merchant-expansion family among them — because those ambitions are only ever held by characters below the attention threshold, who have no way to act on them. Whether background characters *should* be able to build things off-screen is a question about what the game is, so it is [filed as a design call](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) rather than answered by an agent. Nothing is blocked on it today.

Everything else this hour was housekeeping, and none of it needs you.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers resolved: 0.**

Board at the sweep: **45 `Todo`** (`hasNextPage: false`), **6 `Ready for Dev`**, **2 `In Design`**, **6 `In Dev`**. The promotion ceiling did not bind — the shelf is at 6, well under the 15-item backed-up threshold. An `Idea` slice was also scanned (50 returned, `hasNextPage: true`) for completeness, since step 2 names `Idea` as a candidate state.

**Nothing was promotable, and the reason is precise rather than "we looked and it was quiet."** Exactly two things changed on the board since [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) closed at 04:30Z, and neither unblocks anything:

| Change | Effect on the promotable set |
|---|---|
| [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) `Ready for Dev` → `In Dev` (05:02Z, assigned) | Run d's promotion was claimed by the executor within 32 minutes. It leaves the shelf; it gates nothing else that is not already gated on it. |
| [THR-1329](https://linear.app/threadbare/issue/THR-1329/seed-99-mints-zero-trade-routes-in-150-ticks-so-the-trade-route-kind) → `Done` (04:49Z, merged `3094916f`, [PR #1720](https://github.com/christianspliid-ui/threadbare/pull/1720)) | **`get_issue(includeRelations:true)` returns `blocks: []`.** Nothing on the board named it as a blocker, so its closure frees nothing. Checked natively rather than by grepping descriptions. |

No candidate's named blocker moved. **No `save_issue` was called this run**, so there is no write to verify.

**The standing declined set is unchanged, member for member,** from run d's enumeration: THR-1303 (still behind THR-1301, which is `In Dev`, not `Done` — one hop away, not zero), THR-1222, THR-1195, THR-1256 (time gate, opens 2026-09-08), THR-1255 / THR-1218, THR-1220, THR-870, THR-1024, THR-175, the eight design-gated items routed to T2, THR-1348, the program epics, and all 15 `wayfinder:*` items skipped unconditionally. The three process tickets (THR-1326, THR-1327, THR-1328) stay declined on the throttle — the weekly retro is their single promotion point, and none is a loss corrupting work as it runs.

**Product-vs-process ratio.** No promotion this run, so the one-process-ticket-per-three-runs budget is untouched. Week to date holds at ≈70/30 product to process.

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | 0 available | THR-1232 (`prototype`) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership was re-derived from this run's own state-filtered `Todo` sweep — all twelve children present, every one labelled `grilling` or `prototype`. This run changed no issue's state at all, so membership cannot have grown since run d re-proved the empty AFK column directly (19 `wayfinder:research` + 3 `wayfinder:task`, all 22 `Done`).

`ORCH_WAYFINDER_AFK_MAX` did not bind; there was nothing to bind against. Nothing claimed, nothing assigned, no guessed resolution posted.

## T2 — design authoring

**Trigger fires; barred by the `In Design` bound. Seventh consecutive run in this state.**

- **Shelf count: TRIGGERED.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` is **1** ([THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach)). Run d's promotion left the shelf an hour later without changing this count, because THR-1301 carried the `Deferral` label — an **eighth** data point for the standing measurement finding that *the label is a provenance marker, not a size or value marker*, and the trigger reads it as the latter. Stated, not acted on; the constant is not this lane's to change mid-run. Worth one line at the weekly retro.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — THR-1002 (`startedAt` 2026-08-19, 10 days) and THR-790 (`startedAt` 2026-08-15, 14 days). Both far past the 48h threshold and **re-surfaced, not re-staged**, per the rule.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** (no non-human cast primitive), unchanged for three consecutive runs. Runner-up unchanged: THR-1315.

**T2 queue composition: unchanged and net flat.** Nine design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315, THR-1318, THR-1348), the two parked in the column, three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300, all fully unblocked), and twelve wayfinder questions on fully-prepared maps. THR-1348 remains the strongest entrant — the only one arriving with a full measurement attached rather than needing a survey before design can start.

## T3 — architecture health

**Not due — the daily sweep already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z, 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified by reading that report's own T3 section on `origin/ops`, not inferred. Its results stand: 8 LEAKED interface contracts (membership byte-identical, sixth consecutive day), 95 contracts, canon staleness 18, `check:process` exit 0. One sweep per day; this run does not repeat it.

**The exception is the one row run d explicitly handed forward.** Run d recorded `sweep:rank-reach` as *"still executing at report-publication time, ~25 minutes in, with no output emitted … not measured this sweep"* and said: *"If it lands before the next hourly run, that run diffs it."* This run picked that up. It produced two findings — the second of which is a correction to how yesterday's row was read.

> **Correction, appended after first publish.** This report was first published at ~06:15Z with the `sweep:rank-reach` verdict recorded as *not measured this sweep* and finding 1 marked provisional, because the run had not completed. It completed at **06:26Z**, and both are now settled on the complete 900-tick output. The two paragraphs below are the corrected text; the provisional framing they replace is preserved in the `ops` history at `0673d96`. Same precedent as 08-28b, which also landed this detector's result after its first publish.

| Detector | Result | vs. 2026-08-28b |
|---|---|---|
| `sweep:rank-reach` | **PASS** — 60 rank-gated templates reachable, **0 blocked, 0 unowned**; 13 apex holders at tick 900; exit 0 | **Verdict identical for the fifth consecutive day.** Its incidental `DistanceMatrix` warn is **gone — 0 occurrences, where 08-28b measured +142 and 08-27c +151.** See finding 1 |

Full incidentals from the completed run, published so tomorrow's diff is real: `[WorldGen] Ocean fraction too low: 7.4%` (**sixth** consecutive day at the identical value — recurring, not new, not drifting); reputation census 825 increases / +57.603; faction-template draw census **69 action instances, 0 drawn by a member of the owning faction**; member-work resolution 3171 jobs / 1453 succeeded / 204 promotions; **draw-path eligibility 0 of 13 members individual+spotlight** (the standing THR-814 condition, and the same shape THR-1348 measured this morning from the other end); member-work cost 0.070 ms/tick amortized, comfortably inside NFP #7.

**Replicated, and the divergence is informative.** This sweep was run twice this session — once piped (finding 2) and once redirected — both to completion. The two outputs are **identical line for line except one**: `Member-work cost`, which read `0.419 ms / 0.070 ms per tick` and `0.297 ms / 0.049 ms per tick`. Every substantive field matched: `PASS`, 60/0/0, 13 apex holders, zero `DistanceMatrix` warnings, and all four censuses to the digit.

Two things follow, and the second is the useful one. The zero-warn result now rests on **two independent complete runs**, not one. And 08-27c asserted this sweep's determinism from source — *"confirmed deterministic at `scripts/rank-reach-sweep.ts:54–55` — fixed seed, fixed preset"* — which was a code reading with no two runs to compare; it is now measured, and it comes with the exception named: **`Member-work cost` is the one line that legitimately moves between runs**, because it is a wall-clock timing taken under whatever sibling load the box has (this box was running ~180 worktrees' worth of node processes). A future sweep that reports that line moving as a finding is reporting contention, not drift. The `= 0.070 ms/tick` figure quoted above is therefore an upper bound from the more contended of the two runs, which is the conservative direction for an NFP #7 budget check.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Deliberately not reported from Monday's result; [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops`.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** The judgement pass belongs to the daily sweep and run d did it (finding: the shadow decision board, now with an unblocked retirement path via THR-1301; plus the two `getFactionDefinition` implementations owned by THR-1322). Not re-derived here, and not implied to have been.

### New finding 1 — the `DistanceMatrix` warn this tier has tracked as a rising number for four days appears to have been an artifact, and THR-1346 removed it

**The observation, on a completed run.** `sweep:rank-reach` (seed 42, medium, 900 ticks — the identical command all five days) ran to completion in this session, exit 0, and emitted **zero `[DistanceMatrix]` warnings across the full 900 ticks.** On each of the prior four sweeps that same command emitted them repeatedly, at a count this tier reported as *moving*: `+151` on 08-27c, `+142` on 08-28b, where 08-28b noted it *"was caught rising within a single run."*

**The mechanism, and it is not a coincidence of timing.** The warn has exactly one source, `src/engine/distanceMatrix.ts:142`, and it fires when the indexed location count exceeds `MAX_DISTANCE_MATRIX_SIZE` (1200). [THR-1346](https://linear.app/threadbare/issue/THR-1346/the-distance-matrix-is-rebuilt-on-every-structural-change-and-read-by) merged at **02:35:46Z today** (`c4773305`, [PR #1718](https://github.com/christianspliid-ui/threadbare/pull/1718)) and changed that function's input from the bare `getNodesByType('location')` to `getPlaceTierLocations(graph)`. Since THR-1183 unified the two sublocation shapes, the bare sweep returned **both tiers** at roughly 2:1 sublocations over place-tier — so the count being compared against the cap was inflated by a factor of ~3, and grew as the world minted sublocations over 900 ticks. Excluding them leaves a medium map's place-tier count near 214, which cannot approach 1200 in this run.

**Why this matters more than one quiet log line.** For four consecutive days this tier reported the warn's movement as a *finding about the world* — a growth signal to be attributed. It was a symptom of the double-counting defect THR-1346 fixed. Those deltas measured the bug, not the simulation. And the direction it moved in today is the one nobody audits: a tracked number went to zero because the instrument was repaired, which is the same shape as impediment **#936** (logged four hours ago) and as run d's finding 2 about canon-staleness rows silently leaving.

**Confirmed, not inferred.** The provisional caveat this paragraph originally carried — that a partial run could not exclude a late-firing warn, since pre-fix the inflated count had to *grow* past 1200 during the run — is now discharged: the run finished, and the count is **zero for the full 900 ticks**, alongside an unchanged `PASS` verdict. So the fix removed the warn without moving the thing the sweep actually measures, which is what a correct scoping change should look like.

**One thing this does not license.** Zero warns means the cap is no longer *reached on this seed and preset*; it does not mean the cap can no longer bind. CLAUDE.md records place-tier counts of 542 (`large`) and 791 (`epic`) against the 1200 cap, so the headroom is real but finite, and the assertion guarding it belongs on a generated world rather than a fixture. The retired signal was never a load-bearing alarm — it was noise from the wrong denominator — and it should not be missed as if it had been.

### New finding 2 — the detector was never unavailable; it was piped into `tail`, which buffers until exit

**Correction to yesterday's row, and to today's run d.** Both recorded `sweep:rank-reach` as producing no output for 25–40 minutes and correctly declined to report it as clean. This run reproduced that exactly — `npm run sweep:rank-reach 2>&1 | tail -60`, 13 minutes, **zero bytes**. Re-invoking the identical command **unpiped, redirected to a file**, produced its header within **three minutes** and streamed from there.

`tail` cannot emit anything until its input closes, so a long-running detector piped into it is indistinguishable from a hung one for its entire runtime. Nothing was wrong with the detector on either day.

**Proven end-to-end, not argued.** The piped invocation was left running and completed at 06:26Z — at which point it emitted its **entire 3,448 bytes at once**, the complete sweep including the `VERDICT: PASS` line, none of it truncated. The same process that read as zero bytes for 13 minutes had been producing all of it the whole time. So "no output emitted" was never a statement about the detector; it was a statement about `tail`.

**A second edge worth naming while it is in hand:** that piped run's harness-reported exit code was `0`, which here happens to match the sweep's own `0`. It matches by luck. Had the sweep failed, the pipe would have reported `tail`'s success just the same — the familiar false-green, sitting on the same command as the false-unavailable.

**This is a live trap, not a curiosity.** The repo already forbids piping gate runs for a different reason — `npm test 2>&1 | tail` reports *tail's* exit code, not the suite's, so a red suite reads green. This is the same pipe with the opposite failure: the command is fine and the *observation* is destroyed. One costs a false pass; this one costs a false "detector unavailable", which is cheaper but recurs every time a lane watches a slow detector, and it has now consumed part of three sweeps.

**Not filed as a ticket** — the process-work throttle bars scheduled lanes from filing infrastructure tickets, and the weekly retro is the single promotion point. Recorded for that batch with the fix attached: redirect long detectors to a file and poll the file; never pipe one into `tail`, `head`, or `grep` when the run itself is what you are watching.

### Stalled work

**Not re-assessed this run** — it is a daily-sweep item and run d assessed it at 04:30Z. Its result stands and is not restated as if freshly measured. One line is carried forward because run d asked for it explicitly: [THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) sits at **2** `Ready for Dev → In Dev` transitions, one short of `ORCH_STALLED_PICKUP_THRESHOLD` (3). It is still `In Dev` with its PR attached and did not release this hour, so the baseline is unmoved.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted* — asking rather than falling through to un-agreed work — and that threshold did not move closer: the T2 queue holds nine design calls, three plan-doc sessions and twelve wayfinder questions, all agreed.

The one standing constraint is unchanged and already on Christian's list above: every remaining route from agreed work to a prepared design runs through a person. Seven consecutive runs of a barred T2 column is that constraint being visible rather than a new problem.
