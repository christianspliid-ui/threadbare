---
lane: tb-orchestrator
run: 2026-08-25b
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-08-25 (run b, ~04:26Z)

## Needs Christian

**The machine has stopped. It has been stopped for two hours.**

The last piece of work finished at 04:31 your time. There is nothing behind it — no job running, no job waiting. The build queue is empty, and the four things sitting in the "in progress" column are all parked, which means nobody is working on them and nobody can.

This is not a fault. It is exactly what the 04:26 note said would happen, and it has now happened.

**One yes restarts it:** [batch 2 — the camp seven](https://linear.app/threadbare/issue/THR-1222). The brief is written and [readable here](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). *"Batch 2, seven is fine"* runs it; *"keep it six"* splits it 6+1. It was asked at 03:58 your time and has not been re-asked since — this line is a status change, not a second nudge.

**Nothing else on the board can be started without you.** Every one of the eighteen waiting items is held on either a decision of yours or a design session that has not happened. That is the whole reason the queue is empty: not that work was skipped, but that everything cheap enough to start on its own has already been built.

**Still standing, unchanged, no reply needed:**

- **Four things want a design session with you**, not a queue slot: [card grammar](https://linear.app/threadbare/issue/THR-1002) (6 days), [traits wave 2](https://linear.app/threadbare/issue/THR-790) (10 days), and the two wave-1 documents you chartered yesterday ([A](https://linear.app/threadbare/issue/THR-1212), [B](https://linear.app/threadbare/issue/THR-1213)).
- **The two new encounters are still worth two minutes** — [The Unclaimed Relic](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_unclaimed_relic) and [One Body Short](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.one_body_short). Whether these read as worth meeting twice is the read that tells us whether the encounter line itself is working, and it applies to everything the line writes after them.

**Product-vs-process, week to 2026-08-25:** of roughly 40 completions, **3** were process or infrastructure ([THR-1190](https://linear.app/threadbare/issue/THR-1190), [THR-1191](https://linear.app/threadbare/issue/THR-1191), [THR-1192](https://linear.app/threadbare/issue/THR-1192), all on 08-22) — about 1 in 13. The rest was game content, encounters, prose and engine fixes. The process-work throttle is not binding, and this lane filed nothing to fill the empty shelf.

## T1 — unblock sweep

Scanned `Todo` (**18**) and `Ready for Dev` (**0**). `In Dev` held **4**, *all four carrying the `Parked` label* — so the executor has no active work and no candidate. Promotion ceiling never engaged.

**Promoted — 0. Filed — 0. No state write of any kind was made by this lane this run.**

**What moved since run a (02:26Z):**

| Change | Evidence |
|---|---|
| [THR-1095](https://linear.app/threadbare/issue/THR-1095) completed | `completedAt` 2026-08-25T02:31:40Z, merged as [PR #1604](https://github.com/christianspliid-ui/threadbare/pull/1604). `stateHistory` shows one clean `Ready for Dev → In Dev → Done` pass |
| Executor went idle | It was the sole `In Dev` item that was not `Parked`. Since 02:31:40Z the lane has had nothing to claim — **~2h 00m** at this run's start |
| `Todo` membership | **Unchanged, 18 items, identical set.** No new filings, no state changes, no new comments on any candidate |
| [THR-1222](https://linear.app/threadbare/issue/THR-1222) | Still one comment, the 2026-08-24T19:24:54Z coordination block. No approval recorded. Verified by `list_comments` this run |

**Declines — all 18, all unchanged from run a, none for a reason an executor could clear.** The full evidence table is in [`orchestrator-2026-08-25.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-25.md) and is not restated here; nothing in it moved. Summarised by reason:

| Reason | Count | Issues |
|---|---|---|
| Unmet gate — Christian's chat approval | 1 | THR-1222 |
| Unmet blocker (native relation or prose) | 4 | THR-1220, THR-1213, THR-1218, THR-1024 |
| Wrong destination — design pass / recorded decision needed | 9 | THR-1212, THR-1134, THR-1195, THR-1189, THR-1114, THR-1148, THR-1155, THR-1156, THR-789 |
| Unmet trigger | 1 | THR-175 |
| Assigned | 2 | THR-1043, THR-791 |
| Parked programme | 1 | THR-870 |

**Escalation-channel check, not a re-ask.** `fetch_messages` on the escalation channel shows the last message is this lane's own 01:58Z post; **no reply from Christian since 2026-08-24T16:08Z**. The batch-2 ask stands unanswered. Per run a's judgement, and because `keep-work-flowing-cc` owns the doorbell, nothing was posted this run — the changed fact (the machine is now actually stopped, not about to stop) goes in `## Needs Christian` above and reaches him through the hourly briefing instead of as a duplicate ping.

## T1.5 — wayfinder sweep

**No open maps.** `list_issues(label:"wayfinder:map", state:"Todo")` returned zero — both maps closed 2026-08-24. Tier skipped; nothing claimed, nothing resolved, nothing surfaced. Chartering a new map is Christian's to start.

## T2 — design staging

**Triggered but bound-blocked — no staging, same as run a.**

- **Trigger:** 0 non-`Deferral` items in `Ready for Dev`, below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` (1) — [THR-1002](https://linear.app/threadbare/issue/THR-1002) (`startedAt` 2026-08-19, 6 days) and [THR-790](https://linear.app/threadbare/issue/THR-790) (`startedAt` 2026-08-15, 10 days). Both are far past 48h, so per the skill they are **re-surfaced, not re-staged** — done above.

Staging a third would not refill the shelf regardless: staging moves a ticket to `In Design` and asks for an attended session, and four already await one. The top candidate when a slot frees remains [THR-1134](https://linear.app/threadbare/issue/THR-1134).

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 06:26 local) and no sweep had run today. Diffed against [`orchestrator-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md) on `ops`, the last run that invoked a detector.

| Detector | Result | vs. 2026-08-24 |
|---|---|---|
| `generate-interface-map:dry` | **74 contracts — 7 LEAKED** | **Unchanged in count *and* membership** — `attachment-activated-effects`, `attachment-edge-modifiers`, `branch-decision-writes-archetype-drift`, `compulsion-card-plants-agent-decision-bias`, `nudge-card-cost-channels-detection-and-doom`, `undertow-card-drifts-mortal-values`, `trait-ref-authoring-vocabulary` |
| `sweep:rank-reach` | **PASS** — 60 rank-gated templates reachable, 0 blocked, 0 unowned; 13 apex holders at tick 900 | Verdict identical. **Its incidental `DistanceMatrix` warn is not** — see finding 2 |
| `check:process` | exit 0. `check:design-wiki` OK (24 pages); `check:wiki-freshness` OK (24, no stale); three generators up to date | **One row cleared:** `check:authoring-brief` was **stale** yesterday and now reports *"up to date"* (re-run standalone to confirm). Core lint still `skipped (no candidate files found)` — same zero-file shape as yesterday, unchanged |
| `check:canon-staleness` | **23 warnings** | **Unchanged, 23 → 23.** Yesterday's new `rulebook.md` row is still present; nothing added, nothing cleared |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, and not reported as clean.**

### New finding 1 — the accessor THR-1183 shipped to fix its own named trap has zero production callers

THR-1183 (shipped 2026-08-22) settled the sublocation shape and wrote the rule into CLAUDE.md verbatim: *"A bare `getNodesByType('location')` returns **both** tiers — a sweep that means settlements must say `getPlaceTierLocations`."* `src/engine/sublocationShape.ts` exports the five sanctioned accessors.

Measured against the tree at `84d68c89`, counting production sites only (tests, fixtures and the defining module excluded):

| Accessor | Production call sites |
|---|---|
| `resolveToParentLocation` | 10 |
| `isPlaceTierLocation` | 5 |
| `isSublocationNode` | 4 |
| `getSublocationNodes` | 4 |
| **`getPlaceTierLocations`** | **0** |

Nine production modules import `sublocationShape`, so the module itself is adopted — four of its five accessors have real callers. **The fifth, and only the fifth, has none** — and it is the one that answers the exact hazard the ticket documented. Against that zero sit **99 production sites** still calling the bare both-tier `getNodesByType('location')`.

**Calibrated, because the raw 99 overstates it.** 34 of the 99 filter on `locationSubtype` / `locationType` / `parentLocationId` within three lines and are self-protecting — `src/engine/armySpawning.ts:149` is the clean example, gating immediately on `SETTLEMENT_TARGET_SUBTYPES`. **How many of the remaining ~65 actually mean settlements is not measured by this pass**, and I am not claiming they are all wrong. Two named instances:

- `src/engine/distanceMatrix.ts:90` — **confirmed**, and the subject of yesterday's finding.
- `src/engine/battleResolution.ts:495` — **candidate, unverified.** It names its result `settlementNodes` but filters only on hex colocation, never on tier, so a sublocation `located_at` that hex would be counted as a settlement. Worth a check; not a claim.

**Not filed.** The process-work throttle bars scheduled lanes from filing infrastructure tickets, and no loss has been demonstrated — this is a condition being measured, not one that broke something. Recorded for the weekly retro, which is where a ticket would be promoted from if the pattern is judged material.

### New finding 2 — the distance-matrix overrun grew 37% in one day, and it is the same measurement error

`sweep:rank-reach` runs seed 42 / medium / 900 ticks, the same command both days. Its incidental warn moved:

| Sweep | Locations counted | Unindexed (dropped) |
|---|---|---|
| 2026-08-24 | 1555 | 355 |
| 2026-08-25 | 1664 → **1688** | 464 → **488** |

`MAX_DISTANCE_MATRIX_SIZE` is 1200. **+133 locations and +133 dropped in twenty-four hours**, on identical inputs — so the growth is content, not seed variance, and the border-perils batch landing in that window is the obvious candidate. `slice(0, 1200)` drops by insertion order, which preferentially drops whatever was minted latest.

This is finding 1's general case with a number on it: `buildDistanceMatrix` counts `graph.getNodesByType('location')`, so the cap is **sized in place-tier units and measured in both-tier units**. CLAUDE.md:327 still records the cap as covering *"all supported presets (`large` ~584, `epic` ~805)"* — a medium map at 1688 is 2.1× the documented `epic` figure.

**Blast radius, stated narrowly and unchanged from yesterday.** Two production consumers of `getDistance`, both in the tick loop (`idleBehavior.ts`, `phaseAgentDecision.ts`). Fail-soft by design — the warn exists and consumers are documented as handling unlisted locations. Encounter awareness is **not** affected; it uses hex distance.

**Not filed**, same reasoning as finding 1. What is new today is the *rate*, which is the part that decides whether this is drift or decay — one more day of content at this pace and the majority of the graph sits outside the index.

### Redundancy pass — assessed, and the candidate came back negative

**The judgement pass was done this sweep.** Candidate: the two LEAKED contracts that both claim to move a mortal's values — `undertow-card-drifts-mortal-values` (`collectNudgeValueDrifts`, `driftTowardPole`) and `branch-decision-writes-archetype-drift` (`applyAgentDecidedBranches`, `decideBranchPole`, `driftAxisIdForValuePair`). Two contracts, two declared modules, one apparent job: D7's exact shape.

**Negative.** Every one of those symbols except `collectNudgeValueDrifts` is defined in a single file, `src/engine/encounters/branchDecision.ts` (`driftAxisIdForValuePair:114`, `decideBranchPole:146`, `driftTowardPole:327`), and `nudgeDispatch.ts:220` routes through it. Both contracts share one implementation and one axis-id derivation. That is two *contracts* over one mechanism — the interface map working as intended — not two mechanisms doing one job. No redundancy, nothing to file.

One incidental, recorded without a claim: `check:process`'s systems-inventory step prints `[WorldGen] Validation errors: [ 'Ocean fraction too low: 7.4%' ]`. No prior report records it, so **I cannot say whether it is new** — noted so the next sweep has a baseline, not asserted as a regression.

### Stalled work

**No stall.** [THR-1130](https://linear.app/threadbare/issue/THR-1130) does show **3** `Ready for Dev → In Dev` transitions with no terminal `Done` (2026-08-15T21:03Z, 08-17T18:03Z, 08-22T14:02Z), which is `ORCH_STALLED_PICKUP_THRESHOLD` exactly — but it is a `Parked` batch-cadence umbrella whose batches ship under their own tickets (batch 1 completed as THR-1221). Repeated pickup is its designed shape, not repeated failure. Same verdict as yesterday's sweep, now with the count behind it.

The other three `In Dev` items (THR-1133, THR-1168, THR-1216) each carry `Parked` and none shows a repeated pickup. Parks are the sanctioned shape.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Tuesday**. Deliberately not reported from Monday's stale result — [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops` and stands unchanged.

## Escalations

**Nothing posted to Discord this run, and that is the deliberate call.** The escalation trigger — agreed work exhausted — is met and has been for two runs. But the ask has been live on the channel since 01:58Z with no reply, and `keep-work-flowing-cc` owns the doorbell; a third message into an unanswered thread would be noise competing with the briefing that already carries it. The changed fact — the executor is now genuinely idle rather than about to be — is written into `## Needs Christian` above, which the briefing's step 2.6 reads.

One item parked: **THR-1222's approval**. The next run re-checks the channel and the ticket's comments for a reply rather than re-asking.

No detector failed, timed out, or was skipped for a reason other than its own schedule. No tool error this run.
