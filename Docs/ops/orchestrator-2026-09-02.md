---
lane: tb-orchestrator
run: 2026-09-02
promoted: 0
filed: 0
resolved: 0
newFindings: 3
needsChristian: true
---
# Orchestrator — 2026-09-02 (run a, ~05:37–06:05Z; amended ~06:25Z)

> **Amendment, same run.** `sweep:rank-reach` completed after this report was first published and returned `PASS`. The T3 table row and its note are updated, and the Escalations bullet that called it unmeasured is retracted in place. Nothing else changed — no counter, no decline, no Christian item. Amended rather than deferred to the next run because the stale line asserted an absence of measurement that this run in fact had.

First run to publish since [`orchestrator-2026-08-30c.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-30c.md), ~72 hours ago. **That gap is mostly explained and is not a lane failure:** this machine was asleep from 2026-08-30 09:03 to 2026-09-01 19:24 local (58 h, recorded in Windows' power log and corroborated by every scheduled lane's last-run time clustering after the wake). The ~12 hours since the wake are runs that correctly wrote nothing — declines are not substantive. Today's sweep is the first with new findings, so it is the first to publish.

## Needs Christian

**One thing needs finishing, one thing needs a yes, and one thing is unchanged from three days ago.**

**1. Your reactive-loop design doc is written but not saved anywhere permanent.** On Monday evening a design session wrote the full plan for the reactive loop — grievances, grudges, the heat that decays — about 42,000 characters of it. It exists **only as a loose file on this machine**. It is not in the repository, not on any branch, and there is no pull request for it. Nothing has lost it yet, and the working copy is intact; but nothing is protecting it either, and the housekeeping job that clears old workspaces does not know it is there. The fix is a short attended session that commits it the normal way — the same `docs/plan-*` step every other plan doc goes through. **Everything downstream is waiting on that**: the [reactive-loop ticket](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) is still marked "In Design" and holding one of only three design slots, and the [vocabulary proposal it spawned](https://linear.app/threadbare/issue/THR-1379/ul-proposal-grievance-grudge-heat-the-reactive-loops-mechanical-senses) cannot start because it points at a document that is not there.

**2. The one small ask: say yes (or no) to the camp encounters brief.** [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) is seven camp-and-devotion encounters — shrines, resting, the quiet moments between fights — ready to go through the factory line and come out at full standard. It is waiting on nothing but your approval of its brief, and the brief is written and merged: [read it here](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). One yes in chat starts it. It also matters more than its size suggests — `shrine_offering` is the first of the five encounters in [the sit-down where you play the whole slice](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with), and that sitting cannot be scheduled while it is below standard.

**3. Unchanged: two design items have been parked for 14 and 17 days and are blocking four more.** Same as Sunday's report, so one line only — [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (14 days, nobody assigned) and [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (17 days, assigned to you). Releasing either frees a slot.

**Nothing else needs you.** The world's decision-making rewrite hit a real wall this week and the agent working it stopped, wrote down exactly what it measured, and handed the question back — that was the right call and it needs a designer, not you.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0.** Board at the sweep: **44 `Todo`** (`hasNextPage: false`), **1 `Ready for Dev`**, **3 `In Design`**, **4 `In Dev`**. Neither ceiling bound — the shelf is nowhere near the backed-up threshold of 15, and zero promotions is well under `ORCH_PROMOTE_BATCH_MAX` of 5.

**A shelf-count correction worth stating, because it is a trap this lane will hit again.** The `Ready for Dev` scan returned **two** items — THR-1377 and THR-1378. The subsequent `In Dev` scan returned THR-1377 as well, `updatedAt` 05:37:21Z: the executor claimed it *during* this run's own sweep. The Ready-for-Dev read was stale by seconds. **True shelf: 1** ([THR-1378](https://linear.app/threadbare/issue/THR-1378/rulebook-review-2026-09-10-findings), Rulebook review). Recorded because `list_issues` state membership is a snapshot and two state-filtered calls do not share one — the same class as impediment "stale status, confirm with `get_issue`".

### Only two items moved since the last sweep, and both decline

Every other `Todo` item's `updatedAt` predates 2026-08-30T05:40Z, so run c's decline reasoning stands under them unchanged and is not re-derived.

- **[THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) — standing verdict decline, and the ticket asked for this in its own words.** It was promoted by this lane on 08-30, claimed, worked for two days, and returned to `Todo` unassigned at 2026-09-01T17:41Z. Its newest comment (checkpoint #3) is unambiguous: *"Moving to `Todo` and unassigning for T2 re-scoping"* and *"This ticket's title and premise are now three diagnoses out of date… It should not be re-promoted as written."* Re-promoting it would be the THR-990 failure exactly — a `blockedBy` of `[]` overriding a newer verdict about whether the thing should be built as written. **Declined and routed to T2, which is barred (below).** This is the run's most consequential decline: it is the head of the chain THR-1349 → [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) → [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix), and it also gates the largest standing redundancy in the engine (T3, finding 3).
- **[THR-1379](https://linear.app/threadbare/issue/THR-1379/ul-proposal-grievance-grudge-heat-the-reactive-loops-mechanical-senses) — unmet blocker, and the blocker is invisible to `blockedBy`.** Filed 2026-09-01T17:50Z by the THR-1298 design session. Native `relations.blockedBy` is `[]`, so a dependency sweep reading relations alone would promote it. Its description carries a prose gate: *"Definitions become authoritative when the executor lands THR-1298."* THR-1298 is `In Design`, and **its plan doc — the one THR-1379 quotes its three definitions out of — is on no branch and in no commit** (verified below). Promoting would send an executor at a source document that does not resolve: THR-921's stranded-plan-doc class, one step earlier than the version that gate was written for.

### Carried declines, reasons unchanged

- **[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)** — unmet blocker, and it is a **state gate, not a ticket**. Its coordination block reads `Blocked by: Christian's chat approval of Docs/plans/encounters/retrofit-batch-2-brief.md (ruling 2)`. Checked this run rather than assumed: the brief **is** merged and resolves on `origin/main`, so the gate is genuinely one yes and nothing else. Surfaced above as the run's single small ask.
- **[THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) / [THR-1300](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66)** — wrong destination; design-session tickets whose Done-when is *"plan doc in `Docs/plans/`… moved to Ready for Dev with a coordination block"*. → T2. **One improvement since run c:** that run counted three barred plan-doc tickets; THR-1298 has since been picked up by an attended session, so the barred set is two. That is the only forward motion on the design queue in three days.
- **[THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets)**, **[THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)**, **THR-1301 / THR-1303** — unchanged from run c (wrong destination, standing verdict, unmet blocker respectively). Not re-derived; the board did not move under them.
- **15 `wayfinder:*` items** — skipped unconditionally → T1.5.

```
[orchestrator] T1 promote: none
[orchestrator] T1 decline THR-1349: standing verdict — checkpoint #3 (2026-09-01
               T17:41Z) "should not be re-promoted as written", ticket itself asks
               for T2 re-scoping → T2 (barred)
[orchestrator] T1 decline THR-1379: unmet blocker — prose gate on THR-1298 (In
               Design); its source plan doc resolves on no branch and no commit
[orchestrator] T1 decline THR-1222: unmet state gate — Christian's chat approval;
               brief verified merged on origin/main, so the gate is one yes
[orchestrator] T1 decline THR-1299/1300: wrong destination, design-session tickets
               → T2 (barred). THR-1298 left the barred set (now In Design): 3 → 2
[orchestrator] T1 decline (unchanged, not re-derived): run c's remaining lines
[orchestrator] T1 skip 15 wayfinder:* items unconditionally → T1.5
[orchestrator] T1 correction: Ready-for-Dev read stale by seconds — THR-1377
               claimed at 05:37:21Z mid-sweep; true shelf 1, not 2
```

**Week's product-vs-process ratio.** Zero promotions of either kind, so nothing was declined *for* being process work and the materiality bar was not the binding constraint. The headline is unchanged and now three days old: **the feature pipeline needs design supply, not more promotion throughput.** The executor holds one claimable item; the promotion machinery has nothing left to promote that an executor could act on.

## T1.5 — wayfinder sweep

**Three open maps, frontier 11, all HITL. AFK resolved: 0 — the pool is empty, not skipped.**

Membership is unchanged since 2026-08-26 (no wayfinder issue carries a newer `updatedAt`), so the per-ticket table is not reprinted. Frontier recomputed from this run's own `Todo` read:

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 | 6 `grilling`, 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |

The AFK pool is confirmed empty from this run's own data: the 44-item `Todo` read contains **zero** `wayfinder:research` and **zero** `wayfinder:task` items. `ORCH_WAYFINDER_AFK_MAX` (2) is unreachable because there is nothing to reach. Everything on the frontier is `grilling` or `prototype` — Christian, live, in chat — so nothing was claimed and nothing was touched. **Deliberately not re-listed under `## Needs Christian`**: eleven HITL tickets unchanged for a week are a standing shelf, and re-surfacing them every run alongside three live asks is what trains the reader to skip the section. They are surfaced by this table and by the map links above.

```
[orchestrator] T1.5 3 open maps, frontier 11, AFK available 0 (zero research/task
               items in the whole Todo slice), HITL 11 — membership unchanged
               since 2026-08-26, not re-surfaced to Christian this run
```

## T2 — design staging

**Triggered by the shelf, barred by the bound. Not staged. Twenty-fourth consecutive run.**

- **Shelf:** **1** non-`Deferral` item in `Ready for Dev` (THR-1378), against `ORCH_PROGRAM_WORK_FLOOR` of 2.
- **Bound:** `In Design` holds **3** — [THR-1298](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) (live, worked Monday), [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (14 days, unassigned), [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (17 days, assigned to Christian) — against `ORCH_MAX_IN_DESIGN` of 1. Over by two. The two stalled ones re-surfaced per the 48h rule, not re-staged.

**What is new is that the tier now has an explicit inbound request it cannot serve.** Previous barred runs held candidates this lane had *identified*. This run holds one the executor **addressed to it by name**: THR-1349's checkpoint #3 moved itself to `Todo`, unassigned, with *"so `tb-orchestrator` T2 can re-scope"* and a worked-out seam list:

| Seam | Owner | State |
|---|---|---|
| 1. Throughput recovery under a live board — needs a target volume and a mechanism | design / balance | **the blocker**; now mechanically gated by the shipped `CENSUS_UNDERTAKING_START_FLOOR = 700` |
| 2. The cutover itself — mode → `'live'`, contest B + `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` + the strategic clamp deleted, the liveness pin flipped, one commit | executor | blocked on 1; everything it needs is shipped and inert |
| 3. Test-guard fragility | — | impediment #959, retro-batched, correctly not a ticket |

Seam 2 is a well-specified single commit sitting behind a design question nobody can be assigned. **The bound is doing exactly what it was written to do; what it reveals is still that nothing is emptying `In Design`.** Offered as measurement, not as an argument to change the constant — that belongs to the weekly retro, not to a lane.

**A material fact the bound arithmetic hides, and which changes what "release a slot" means.** THR-1298 is not idle like the other two — a session worked it on Monday and produced a 41,697-character plan doc. But that doc is **committed nowhere** (T3, finding 1), so the ticket cannot leave `In Design` by the normal route: its Done-when is *"plan doc in `Docs/plans/`… moved to Ready for Dev with a coordination block"*, and the artifact that would satisfy it is not in the repository. **The design slot is held by finished work that has not been saved**, which is a different and cheaper problem than a stalled design — and it is the first Christian item above.

## T3 — architecture health

**Due and run.** No sweep exists for 2026-08-31, 2026-09-01 or today on `origin/ops` — the last is [`orchestrator-2026-08-30b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-30b.md) — so the once-per-day gate is satisfied by absence of evidence rather than by assumption. Diffed against that report. **Three sweeps' worth of drift compressed into one diff; two of the four detectors moved not at all.**

| Detector | Result | vs. 2026-08-30b |
|---|---|---|
| `generate-interface-map:dry` | **8 LEAKED**, 95 total (exit 0) | **Identical, LEAKED membership member-for-member.** Tenth consecutive day at eight |
| `check:canon-staleness` | **25 warnings** (exit 0) | **Identical, row-for-row.** 0 new, 0 departed — across three days |
| `check:process` | exit 0 overall; **`rebuild-plans-index:check` reports `Docs/plans/INDEX.md is STALE`** | **Changed.** All four generator rows were "up to date" on 08-30b. Finding 1 |
| `sweep:rank-reach` | **`PASS`** — 60 rank-gated templates reachable, 0 blocked, 0 unowned; **16** apex holders at tick 900 (exit 0) | **First measured result in three sweeps.** Landed ~45 min in, after this report was first published; amended below. Apex holders **13 → 16** vs 08-29d |

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked from a headless scheduled context. **Not run, and not reported as clean.**

**`sweep:rank-reach` — amended after publication: it landed, and it is the first real result this column has carried in three sweeps.** This report was first published at ~06:05Z stating the verdict was **unknown**, because the sweep had produced no output ~30 minutes in. It completed at ~06:22Z, exit 0. Amending rather than leaving the stale line standing: a published `unknown` that the same run later resolved is exactly the "green on an unmeasured check" pathology this tier exists to catch, wearing the opposite face.

```
Rank-gated templates at tick 900 — 60 reachable, 0 blocked, 0 unowned
VERDICT: PASS — apex holders at tick 900: 16; blocked gated templates: 0
Member-work cost (NFP #7): 0.261 ms/pass over 429 memberships = 0.044 ms/tick amortized
```

**The one cell that moved: apex holders at tick 900, 13 on 08-29d → 16 today.** Reachability is unchanged (60/0/0, identical member-for-member to the last green), so this is a population shift, not a coverage change, and `PASS` does not depend on it. Recorded so tomorrow's diff is against a real number rather than a four-day-old one. **Not attributed** — three engine PRs landed in the window (#1724, #1758, #1760, all THR-1349) and any of them could move a seeded 900-tick population; naming one without measuring would be a guess.

**Two standing readings the sweep restates, neither new.** `0 of 16 members are individual+spotlight, i.e. can reach phaseAgentDecision at all` — the ambient-tier agency gap owned by THR-814 and re-argued this week on [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the), where the standing director verdict is that the aperture is correct and the sweep reporting the narrowness is the honest response. And `37 faction-template action instances, 0 of them drawn by a member of the owning faction` — unchanged, THR-816's territory. Both are reported by the detector every run; neither is a finding of this one.

**The timing observation survives the PASS, and is the part worth carrying.** Three consecutive sweeps have now had this detector outrun the report: ~35 min on 08-29d, ~40 on 08-28b, ~45 today. It is not that it fails to finish — it is that it finishes *after* the tier that consumes it has written its output. On a strictly hourly lane that makes its column structurally stale by one run unless a run deliberately waits for it, as this one did only by accident of a long T3.

**The eight LEAKED contracts, listed again so tomorrow's diff stays real:** `attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertaking-checkpoint-events` · `undertow-card-drifts-mortal-values`. All eight carry a remediation ticket, so `generate-interface-map` exits 0 by design.

**Canon staleness membership is byte-identical to 08-30b's published 25** — including the four known-benign generated files with no meaningful `last_reviewed`. Not re-listed; 08-30b's list is still the live one. Notable in itself: run b's finding was that `systemic-wiring-guide.md` and `wiring-checklist.md` re-stale five pages apiece whenever touched, and **neither has been touched in three days**, so the count froze exactly as that mechanism predicts. The prediction held, which is the first time this tier has confirmed one.

### New finding 1 — the plans index is stale in this checkout only, and the cause is an unsaved plan doc

`check:process` newly reports `Docs/plans/INDEX.md is STALE`. **It is not drift on `main`, and reporting it as such would be wrong.** Attributed rather than assumed:

- `Docs/plans/INDEX.md` was last regenerated by [`9f6749cb`](https://github.com/christianspliid-ui/threadbare/commit/9f6749cb) (2026-08-30T00:27Z), and **no plan doc tracked on `origin/main` is newer than 2026-08-29** — `git ls-tree origin/main -- Docs/plans/` returns nothing dated 08-30 or later.
- The home tree carries three **untracked** files the index cannot know about: `Docs/plans/2026-09-01-thr-1298-reactive-loop.md` (41,697 bytes), `…-brainstorm.md` (7,117), and `Docs/plans/.intent-proposals/2026-09-01-thr-1298-reactive-loop.md` (7,118).
- `grep -c "2026-09-01-thr-1298" Docs/plans/INDEX.md` → **0**. The generator reads the directory, the committed index does not contain them, so the check fires.

**The finding is therefore the cause, not the symptom: a completed design artifact exists on no branch and in no commit.** Falsified rather than inferred — every local and remote ref was scanned for the path and **none carries it**; the `docs/plan-2026-09-01-reactive-loop` branch that appears to exist for it has **zero commits ahead of `origin/main`**; and `gh pr list` returns `[]`, so there is no open PR either. The only two copies are untracked working-tree files, in the home tree (autosync's read-only mirror of `main`) and in the `plan-thr-1298` worktree — a directory the hourly reaper is entitled to remove.

Consequences already visible, all three traceable to this one cause: the stale index above; THR-1379 undeployable (T1 decline); and one of three design slots held indefinitely (T2). **Recorded, not filed, and deliberately not fixed by this lane** — committing another session's unpublished design work is authoring, which is outside this lane's remit, and there is no way from here to tell whether the session considered it finished. Escalated to Christian as item 1 instead, which is the action that actually resolves it.

### New finding 2 — three worldgen tuning knobs are defined twice with different values, and the tuning panel shows the copy the generator does not read

Found by the redundancy judgement pass, not by a detector. **Both modules are reachable, so no reachability sweep will ever flag this** — which is the D7 class this pass exists for. A mechanical scan for `export const` SCREAMING_CASE names defined in more than one production module under `src/data` and `src/engine` returned 15 candidates; twelve were dismissed on reading (below). Three are real, and they are the same defect three times:

| Constant | `src/engine/terrainPipeline/types.ts` | `src/engine/worldGenData.ts` |
|---|---|---|
| `LAKE_SIZE_MAX` | **6** | **5** |
| `GREAT_LAKE_SIZE_MAX` | **15** | **12** |
| `RIVER_MIN_LENGTH` | **5** | **4** |

**Which copy is live, traced to the call site rather than guessed.** `src/engine/lakeGeneration.ts:5-8` and `src/engine/riverGeneration.ts:9,17` both import from `./worldGenData` — so the world is generated with **5 / 12 / 4**. So do the tests (`lakeGeneration.test.ts:4`, `riverGeneration.test.ts:7`, `worldGen-integration.test.ts:2,6`), which is why the suite is green and silent on this.

**The consumer of the other copy is the tuning surface itself.** `src/components/CMS/tunableConstants.ts:27` does `import * as terrainTypes from '../../engine/terrainPipeline/types'`, and lines 1053–1061 register `RIVER_MIN_LENGTH`, `LAKE_SIZE_MAX` and `GREAT_LAKE_SIZE_MAX` off it. So the panel whose entire purpose is NFP #1 — *"changing game feel = changing a number"* — **displays three numbers the generator does not use.** Reading them there is misinformation, and editing them there is a no-op.

Two properties make this worth a line rather than a shrug. It is **self-concealing**: the tests read the live copy, so the only surface that would expose the mismatch is the one showing the wrong value. And it is **directional** — the dead copy is uniformly the looser bound (6 > 5, 15 > 12, 5 > 4), so anyone tuning from the panel reasons about a world with larger lakes and longer minimum rivers than the one that is generated.

**Dismissed on reading, recorded so the next pass skips them:** `ELEVATION_SCALE` / `_OCTAVES` / `_PERSISTENCE` / `_LACUNARITY`, `MOISTURE_NOISE_SCALE`, `TEMP_NOISE_SCALE`, `TEMP_ALTITUDE_PENALTY` are duplicated across `forceField.ts` / `worldgen/constants.ts` / `terrainPipeline/types.ts` but **agree in every cell** — a drift hazard, not a live defect. `MAX_AWARENESS_HOPS` is an alias (`idleBehavior.ts` re-exports `IDLE_MAX_AWARENESS_HOPS`, both `5`). `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`' second definition is inside `__tests__/encounterPackage.test.ts` — a test baseline, the `AgentDots.test.tsx` trap shape. `OUTCOME_BAND_PROSE` and `OUTCOME_BAND_Q_FLAVOR` are each defined twice with **different types** (`Record<string, string[]>` vs `Record<OutcomeBand, PhraseEntry[]>`); that is a plausible legacy/current pair and is **flagged unresolved, not dismissed** — it needs a prose-corpus reading this pass did not do.

**Recorded, not filed** — process-work throttle; this is an inspectability defect, not an above-bar loss corrupting work now. For the retro: the repair is deleting three constants from one module and repointing the CMS import, with no design content — but *which* copy survives is a real question, since the panel's values may be someone's intended retune that never landed.

### Finding 3 — the shadow-board redundancy stands, and its blocker changed character again

Re-verified at `origin/main` rather than carried forward. `UNIFIED_DECISION_BOARD_MODE` is **still `'shadow'`** (`strategic-action-constants.ts:338`), `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` still `0.85` (`:111`) — so two complete scoring implementations still run on every agent decision, every tick, one of them pure telemetry.

Everything the retirement was waiting on has now shipped and is inert: the variety term (PR #1724), `UNDERTAKING_NEUTRAL_DESIRE = 1.0` (`:440`, PR #1758), and this week's `CENSUS_UNDERTAKING_START_FLOOR` beside `CENSUS_DISTINCT_TEMPLATE_FLOOR` in `scripts/undertaking-census.ts` (PR #1760). **The blocker is no longer any missing mechanism — it is a design question with a measured shape**: a live board loses ~36% of undertaking volume and ~44% of encounter share while every §4 criterion reads green, and the new throughput gate is the first thing that can see it. That is THR-1349 seam 1, which T2 cannot stage.

**Not this lane's to settle** (non-negotiable #3). Its whole cost — a duplicate scorer on every agent every tick — is now the price of one unstageable design question.

### Standing redundancies, re-verified

- **`getAgentsAtLocation` duplicated** — `graphQueries.ts:23` (6 production callers) and `hexZoom.ts:40` (2). Both still present, unchanged. Carried, not new.
- **`getLocationsInRegion` duplicated** — `graphQueries.ts:65` and `viewLevel.ts:22`, the former with no production caller. Still queued for the weekly test-suite pass as a dead-coverage question, not resolved here.

**The honest limit:** one new area probed (duplicated constants) plus three standing findings re-verified. Not a clean bill across the map, and the `OUTCOME_BAND_*` pair above is explicitly left open.

### Stalled work and hand-created tickets

- **No stall at threshold. [THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) is now at 2**, up from 1 on 08-30b — `Ready for Dev → In Dev` on 2026-08-29T08:04Z and again 2026-08-30T06:01Z, no `Done`. `ORCH_STALLED_PICKUP_THRESHOLD` is 3. **The right reading is not "watch for a third pickup" but "a third pickup is the wrong outcome"**: neither pass failed — each resolved its stated blocker and uncovered a structurally different one beneath, and checkpoint #3 asks for a split rather than another attempt. If T2 stays barred and this is re-promoted as written, it will hit the threshold *and* the executor will work a premise the ticket itself calls three diagnoses out of date.
- **No hand-created `In Dev` ticket** (THR-1325 ruling). `In Dev` holds four: THR-1377 (entered via `Ready for Dev` this run, verified in `stateHistory`) and THR-1130 / THR-1133 / THR-1168, all `Parked`, all unassigned, all `updatedAt` unchanged since run c read their histories in full — and a `stateHistory` cannot change without `updatedAt` changing, so that reading still holds by construction.
- **WIP is genuinely occupied for the first time in days** — THR-1377 claimed 05:37Z. When it lands, the shelf drops to one item.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Wednesday**. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised. Note for the next pass: it has now been **missed twice** — 2026-08-31 was a Monday and this machine was asleep through it — so Monday 2026-09-07's pass will be diffing against a two-week-old baseline. Queued for it: the `getLocationsInRegion` dead-coverage question, carried from 08-30b.

## Escalations

- **Nothing asked on Discord this run.** Non-negotiable #3's trigger is *agreed work exhausted*; agreed work is not exhausted, it is **unstageable** — a different condition with a different channel. The three Christian items route through `## Needs Christian` and the hourly briefing, which is the sanctioned non-blocking path. Adding a Discord ping would duplicate the doorbell `keep-work-flowing-cc` owns.
- **Parked, not escalated: the T2 bound.** Twenty-fourth consecutive barred run, now holding an explicitly addressed inbound request (THR-1349 seam 1). Belongs to the weekly retro's batch, not to a lane's unilateral change.
- **Parked: `sweep:rank-reach` finishes after the report that consumes it.** Amended — it did land this run (`PASS`, above), so the previous framing of "unmeasured for a third consecutive sweep" was wrong within an hour of being written and is retracted here rather than left standing. The durable observation is narrower and still true: ~35 / ~40 / ~45 minutes across three sweeps, against a lane that publishes well inside the hour. A retro-batched lane-tooling item (process-work throttle — recorded, not filed); the cheap shapes are to start it at the top of T1 rather than T3, or to let the following run diff a result file it writes. Today's PASS was caught only because this run's T3 happened to be long.
- **Two items recorded for the retro rather than filed:** the worldgen constant divergence (finding 2) and the unsaved-plan-doc failure mode (finding 1). Neither is a loss actively corrupting work as it runs, so neither qualifies for the immediate-filing exception.
