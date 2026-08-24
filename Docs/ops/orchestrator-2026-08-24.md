---
lane: tb-orchestrator
run: 2026-08-24
promoted: 1
filed: 0
resolved: 0
newFindings: 3
needsChristian: true
---
# Orchestrator — 2026-08-24 (first run of day, ~05:39Z)

## Needs Christian

**One ask: the game needs a design session, and it is the only thing holding up new work.**

The dev queue is empty of new feature work — not because nothing is ready to build, but because two designs have been sitting waiting for you (or an attended session) to work them through, and nothing downstream can start until one of them is finished:

- [**Unify the card grammar**](https://linear.app/threadbare/issue/THR-1002) — making action cards read the same way nudge cards do, so a cast returns a legible result instead of a verbose blur. This is your own 2026-08-06 direction (*"the action cards are too verbose and their actual action in the game is very hard to understand"*). It has been waiting **5 days**.
- [**Traits wave 2**](https://linear.app/threadbare/issue/THR-790) — traits on locations and artifacts, and drawing encounters by trait. Waiting **9 days**.

Everything the agents finished this week was cleanup and defect work on systems you already agreed. That well is deep and still productive, but it does not add anything new to the game. **One session on either ticket above unblocks the next stretch of building.**

**Two map questions also need you**, whenever you next have an hour for the board:

- On the [Typed game-state map](https://linear.app/threadbare/issue/THR-1157): [prove the anchor type works on a second seam](https://linear.app/threadbare/issue/THR-1162) — a throwaway prototype to check the pattern generalises beyond chips before it is built everywhere. Every other question on that map is answered; this is the last one.
- On the [Encounter slice map](https://linear.app/threadbare/issue/THR-902): [the slice verdict session](https://linear.app/threadbare/issue/THR-907) — you ruling on prose, firing, UI and game feel for the five slice encounters. Open a chat and say *"work the map"* when ready.

**One thing worth knowing, no action needed.** Yesterday's reputation work shipped three of its four parts. The fourth — the *old* one-sided reputation number that still runs on its own decay clock and still gates encounter outcomes — was left in place, so the world currently has two different things called reputation. Nothing is visibly broken; the details are recorded on the ticket for whoever picks up the follow-through. I have not filed anything for it.

## T1 — unblock sweep

Scanned `Todo` (20) and `Ready for Dev` (1). **Shelf depth: 1, and it is `Deferral`-labelled — non-`Deferral` program work in the queue: zero**, against a floor of 2. Promotion ceiling not engaged (shelf far below 15).

**Promoted — 1.**

- **THR-1207** (dead reputation-tally keys) → `Ready for Dev`. Blocker **THR-1206 is `Done`**, `completedAt` 2026-08-23T19:05:21Z, shipped as PR #1586 (`965bcbce`, merged as `fb5bbcc8`) — it delivered the `reputation_with` effect this sweep was waiting on. Latest-comment check (THR-990) read first: the newest comment is *"Unblocked — THR-1206 shipped the effect and the gate"*, an enabling note, not a retire verdict. Plan-doc liveness (THR-921): `Docs/plans/2026-08-23-thr-1206-reputation-unification.md` resolves on `origin/main` — **LIVE**. State write verified by `get_issue` re-query; no assignee key present. Coordination block posted, carrying the mutex against **THR-1208** (In Dev *right now*, same `src/data/encounters/*` aftermath blocks) and **THR-1130** (Parked), plus the three corrections from the enabling comment that the description contradicts — the real count is 171/518 not 154/501, the "temporary allowlist" is `TALLY_KEY_RATCHET` enforced from two places, and `check:encounter --all` alone covers a tenth of the class.

**Declined — 7, each with the evidence that held it.**

| Issue | Reason | Evidence |
|---|---|---|
| THR-1195 (`hex.send_herald` `actorType`) | **Standing considered decline** | Latest comment (2026-08-22T18:32Z) is a deliberate reversal of a promotion made 84 seconds earlier, listing what would make it promotable. Nothing has changed since — no comments, no `updatedAt` movement. Re-promoting on identical evidence is the exact churn that comment exists to prevent |
| THR-1182 (Grateful Kin return encounter) | **Process-gated on Christian** | Its own coordination block: *"Blocked in process on the ruling-2 brief approval, which is step 1 of the task."* Encounter Factory ruling 2 requires a chat-approved brief before authoring; an unattended executor cannot satisfy that |
| THR-1024 (DetailModal dialog semantics) | **Unmet blocker** | Explicit sequencing gate: *"do not start this before THR-966."* THR-966 is `Idea` — the prune-vs-mount decision for the whole detail-page cluster is unmade, and if it prunes, this ticket dies with it |
| THR-1189 (`taxRate` never collected) | **Wrong destination — T2 input** | *"it wants a design pass rather than an executor's judgement call"* — wiring a toll into the economy is a new flow (who pays, out of what, on what cadence) |
| THR-1114 (two off-union `sphereAffinity`) | **Wrong destination — T2 input** | *"There is no agreed outcome to test against, so this is a design decision"* — picking which of the twelve Spheres each action means changes what the action *is* |
| THR-175 (`agent.sphere` field) | **Unmet trigger gate** | *"Do not start this work before the trigger."* Neither condition met: creation-sphere content is not shipping, and no template needs `sphere` independent of `reach` |
| THR-1148 (`agent_relocation` steering) | **Decision ticket** | Title is the verdict: *"decide whether that is the design"* |

**Skipped — 4 wayfinder issues** (THR-1157, THR-1162, THR-902, THR-907). Anything carrying a `wayfinder:*` label never enters `Ready for Dev` — they are decisions, and T1.5's input.

**Not assessed as T1 candidates — 6 program epics** (THR-1156, THR-1155, THR-789, THR-791, THR-1043, THR-870). All are design-stage or Christian-assigned; two (THR-1043, THR-791) carry his assignee. THR-1155's position is explicitly THR-1163's call, and THR-870 (sphere-governed ascendant) is parked.

### Rule-0 discipline

**Nothing process-shaped was promoted this run, and nothing needed to be.** The one promotion is a content/bug ticket with quotable player-facing loss (shipped content whose authored mechanical effect never fires). THR-1134 (shareable game-state snapshot, High, `Continuous Improvement`) was **not** promoted — it asks for a design pass by its own text, so it is T2 input, not queue work.

**Week's product-vs-process completion ratio: ~42 product : 3 process** (plus 7 design/research completions — wayfinder tickets and UL-proposals). Counted by `completedAt` ≥ 2026-08-17 and classified by project + label; the Linear page was truncated (`hasNextPage: true`), so these are floors rather than exact totals, and the `updatedAt: -P7D` filter returned items well outside the window, so the window was applied in memory.

**That ratio is the headline good news.** On 2026-08-10 the measurement that produced the process-work throttle was 32-of-35 queue items being Low-priority process cleanup with zero feature work entering. Two weeks later, process work is ~7% of completions. **The throttle worked and does not need tightening.** The constraint has moved upstream, which is what § T2 below is about.

## T1.5 — wayfinder sweep

**Two open maps. Frontier: 2 tickets, both HITL. AFK tickets resolved: 0 — there were none to resolve.**

| Map | Frontier | Disposition |
|---|---|---|
| [THR-1157](https://linear.app/threadbare/issue/THR-1157) — Typed game-state architecture (machinery + first wave) | **1** — THR-1162, `wayfinder:prototype` | HITL. Surfaced. All six other children (THR-1158, 1159, 1160, 1161, 1163, 1176) are `Done` — this is the map's last open question |
| [THR-902](https://linear.app/threadbare/issue/THR-902) — Encounter experience redesign, vertical slice | **1** — THR-907, `wayfinder:prototype` | HITL. Surfaced. Seven of eight children `Done`; this one carries Christian's assignee and has been open since 2026-08-15 |

**No `wayfinder:research` or agent-doable `wayfinder:task` ticket was open on either frontier**, so `ORCH_WAYFINDER_AFK_MAX` (2) was not reached — the burn-down had nothing to burn. Both maps have been driven down to their human decision points, which is the intended end state of the AFK half, not a stall in it.

One deviation recorded: THR-907 carries an assignee (Christian), which step 2 of the tier would normally drop from the frontier. It is surfaced anyway, because dropping it would hide the map's only remaining question from the only person who can answer it, and the assignee *is* that person.

**No ticket was claimed, resolved, or closed by this lane this run.**

## T2 — design staging

**Triggered by shelf depth, blocked by its own bound. Nothing staged.**

- **Trigger: met.** Non-`Deferral` program work in `Ready for Dev` = **0**, floor is `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound: exceeded.** `In Design` holds **2** — THR-1002 and THR-790 — against `ORCH_MAX_IN_DESIGN` (1). Staging a third would deepen a queue nobody is drawing from.

So this run **re-surfaces rather than re-stages**, per the tier's 48-hour rule:

| Issue | In Design since | Age |
|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002) — unify the card grammar | 2026-08-19 (T2-staged, ~02:30Z) | **5 days** |
| [THR-790](https://linear.app/threadbare/issue/THR-790) — traits wave 2 | ~2026-08-15 | **9 days** |

**This is the run's real finding, and it is a supply problem, not a sequencing one.** T2 staged THR-1002 five days ago with a full Step-0 load list and three drafting flags already worked out; it has not been picked up since. The queue is not empty because the board is groomed badly — it is empty because **the design step has no throughput**, and this lane is structurally forbidden from supplying it (it runs Sonnet by direction, 2026-08-06; plan-doc authoring is attended Opus work).

Per the process-work throttle: **shelf empty → the feature pipeline needs design/Christian.** That is the headline, and it is not fixed by promoting more cleanup. Surfaced as one ask under § Needs Christian.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 07:36 local), and no sweep had run today. Diffed against [`Docs/ops/orchestrator-2026-08-23.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-23.md) on `ops` — the last run that actually invoked a detector.

| Detector | Result | vs. 2026-08-23 run a |
|---|---|---|
| `generate-interface-map:dry` | **74 contracts — 7 LEAKED** | **+2 contracts, LEAKED unchanged in count *and* membership**: `attachment-activated-effects`, `attachment-edge-modifiers`, `branch-decision-writes-archetype-drift`, `compulsion-card-plants-agent-decision-bias`, `nudge-card-cost-channels-detection-and-doom`, `undertow-card-drifts-mortal-values`, `trait-ref-authoring-vocabulary`. One of the two new contracts is `reputation-with-unified-read` from THR-1206 — declared and classified without adding a leak |
| `sweep:rank-reach` | **PASS** — 60 rank-gated templates reachable, 0 blocked, 0 unowned; 13 apex holders at tick 900 | Identical. ~9 min to first output again |
| `check:process` | exit 0. `check:authoring-brief` **stale** vs `2026-04-16-systemic-wiring-guide.md`; `check:design-wiki` OK (24 pages); `check:wiki-freshness` OK (24, no stale); three generators up to date | Unchanged, including the zero-file core lint — see below |
| `check:canon-staleness` | **23 warnings** | **+1 — one of this sweep's three new findings** |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, and not reported as clean.**

### New finding 1 — the distance-matrix cap is exceeded in a routine run, and its documented rationale is falsified

`sweep:rank-reach` emitted this repeatedly during its 900-tick seed-42 **medium**-map run:

```
[DistanceMatrix] Location count (1555) exceeds MAX_DISTANCE_MATRIX_SIZE (1200).
355 locations will not be indexed. Systems using getDistance() for those locations will get Infinity.
```

CLAUDE.md:327 records the cap as a load-bearing decision with this justification:

> Raised to 1200 in TB-088 — **now covers all supported presets** (`large` ~584, `epic` ~805).

A medium map reaching **1555** is 2.6× the documented `epic` figure. The premise is not wrong about worldgen — it is wrong about *play*: those numbers are counts at world creation, and locations are minted continuously during a run.

**The sharper version, and the part worth acting on.** `buildDistanceMatrix` counts `graph.getNodesByType('location')` (`src/engine/distanceMatrix.ts:90`). Per THR-1183 — shipped 2026-08-22, two days ago — **a sublocation *is* a `type: 'location'` node**, discriminated only by `parentLocationId`. So the cap is **sized in place-tier units and measured in both-tier units**, and `slice(0, 1200)` then drops by insertion order, which preferentially drops whatever was minted latest. This is exactly the trap THR-1183 named: a bare `getNodesByType('location')` returns both tiers, and a sweep that means settlements must say `getPlaceTierLocations`.

**Blast radius, stated narrowly.** Production consumers of `getDistance` are two, both in the tick loop: `src/engine/idleBehavior.ts` and `src/engine/phaseAgentDecision.ts`. It is **fail-soft by design** — the warn exists, and consumers are documented as needing to handle unlisted locations, so this is degradation, not a crash. And encounter awareness is **not** affected: it uses hex distance, location-hop awareness having been explicitly rejected.

**Honesty caveat: new to this report, not provably new to the tree.** Prior sweeps recorded only `sweep:rank-reach`'s verdict line, so whether this warn fired last week is unknown. I am not claiming a regression.

**Not filed** — no demonstrated loss, so it does not clear Rule 0's materiality bar, and scheduled lanes log rather than file. Recorded for the retro, which sits today.

### New finding 2 — the redundancy pass produced a result, and it is a real one

**The judgement pass was actually done this sweep** — the first time in several runs it has not been recorded as "not assessed."

THR-1206 shipped yesterday promising that of the four mechanisms doing reputation's job, *"none survives as an unreconciled synonym."* Three have owners (THR-1207 tallies, THR-1210 vocabulary, THR-1211 four dead reads). **`reputationScore` has none** — and measured against `fb5bbcc8` it is the *larger* system: 14 production write sites, 18 production read files, its own tick phase (`phaseReputationDecay.ts`), an encounter-effect gate (`effectPredicates.ts:98`), range validation, and world seeding — against 5 production files for the new pairwise `getReputationWith`.

`src/data/content-eval/consequenceDraw.ts:183` now enumerates **five** standing mechanisms in one group, which is that design's stated anti-goal written out in code.

This is redundancy in D7's exact sense: two implementations of one job, **both reachable**, invisible to any reachability sweep. Full evidence posted as a comment on THR-1206 — the design whose Done-when named it — rather than as a new ticket, per the process-work throttle. **No ticket filed, no state changed.**

One player-facing rider, worth separating: `reputationScore`'s only surface is `AgentDetailPanel.tsx:792`, and this morning's test-health pass re-verified `AgentDetailPanel` is **unrendered**. So a quantity that gates encounter outcomes has no reachable player surface — a visibility-parity gap independent of the redundancy.

### New finding 3 — one new canon-staleness row

22 → 23. The new row is `Docs/canon/rulebook.md` stale vs `Docs/plans/2026-08-23-thr-1206-reputation-unification.md` (plan mtime 2026-08-23T17:10:48Z, `last_reviewed` 2026-07-21). Caused by yesterday's reputation work landing after that sweep ran. Five other rows show refreshed mtimes against `2026-04-16-systemic-wiring-guide.md` (now 2026-08-23T18:49Z, THR-1206's Capability 22 addition) but those rows already existed — the count moved by exactly one. **Documentation drift; does not qualify under Rule 0.** Logged, not ticketed.

### `check:process`'s core lint inspected zero files again

Not new, and stated plainly so the table row above is not misread:

```
check:process skipped (no candidate files found).
```

Exit 0 regardless. What that row verified is the six chained sub-checks, **not** the lint the script is named after. Same shape as impediment #409. Not filed — no loss measured, and these checks are load-bearing in CI where they do run against a real changed set.

### Stalled work

No issue in the board scan showed `ORCH_STALLED_PICKUP_THRESHOLD` (3) or more `Ready for Dev → In Dev` transitions without a `Done`. THR-1195 has one reversed promotion in its history, which is a decline being corrected, not a repeated failed pickup.

Three `In Dev` items carry the `Parked` label (THR-1130, THR-1133, THR-1168) and one is actively assigned (THR-1208). Parks are the sanctioned shape, not stalls.

### Weekly test-suite health

**Due and run** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Monday. Written to [`Docs/ops/test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md).

Suite **1056 files / 17291 tests, all passing** (exit 0; +28 files, +799 tests on the week). **Dead-coverage candidates 4** — all carried forward and each re-verified against the tree, zero genuine new ones from 35 new test files. **Slowest 15 reported**, top 10 holding 65.6% of summed file time; `edgeIntegrity.test.ts` is a new #2 at 11.0% on its own. **Duplicated coverage: standing retirement recommendation, not re-derived** — the retro owns that verdict, and it sits today. **0 tickets filed.** One new cross-cutting item recorded there: 84 `Duplicate key` warnings across 38 test fixtures.

## Escalations

**No question was asked and nothing was parked.** Agreed work is not exhausted — the design step is the constraint, and that is a Christian/attended-session ask surfaced through the briefing rather than a Discord escalation.

One methodological miss to record against this lane, not a blocker: last week's test-health pass recommended running the suite **before** the T3 detectors rather than alongside them, to get comparable absolute timings. This run overlapped them again to fit both into one hourly slot, so the absolute seconds in section 2 of the health report are again non-comparable and the caveat is repeated rather than resolved. Ranking and share columns are unaffected.

Bare `THR-XXX` references throughout — nothing in this report is intended to close anything.
