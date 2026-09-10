---
lane: tb-orchestrator
run: 2026-09-10c
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-10 (run c, ~04:27–04:45Z)

**The product shelf is already empty.** Run b predicted it for 06:01Z; it arrived early. The one job left in the queue is an infrastructure ticket, and the standing rule forbids this lane from filling the gap with more of the same. The daily architecture sweep ran in full and found that one of its own four detectors has been reporting a pass while a third of it never runs.

## Needs Christian

**One thing, and it is the same one — but the deadline it was warning about has passed.**

The builder has finished everything you would call game work. It closed two more jobs while this run was reading the board. What is left in the queue is a single piece of plumbing, and after that it stops.

There is a 40-item backlog and a 50-item idea list, so the shortage is not of ideas. Two of the most promising were opened this run and read end to end, and both turned out to need a decision from you before anyone can build them — one asks whether every faction should be able to commission ruin expeditions, or only the adventurers' guild, which is a question about what the world is like rather than a question about code.

I could have filled the shelf with tidying work. There are eight such tickets sitting ready. **The standing rule says not to, and I have followed it** — a queue full of housekeeping looks healthy and starves the game.

The unblocking move is unchanged and takes one sitting: say **"rule on the backlog"** and an attended session brings you the ~14 short rulings in game terms, smallest first.

Two standing items, unchanged and **deliberately not re-asked**: the [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) map's ten questions, and the [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no on credits. The [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) raised by run b is also still available and still ready.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0.** Ceiling never engaged — shelf was 1 at scan, far under the 15-item backed-up threshold.

Board at scan (~04:28Z): **40 `Todo`** (15 `wayfinder:*`, skipped unconditionally), **1 `Ready for Dev`**, **2 `In Dev`**, **2 `In Design`**. `origin/main` @ `102ef17e`.

**The `Todo` column is unchanged from [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10b.md)** — same 40 items. Nothing arrived to promote, so this run went to the **`Idea` column** instead, which T1's prescribed two-call scan does not cover and which has now produced findings on three separate days. Two candidates were worked to a verdict rather than skimmed.

### THR-716 — declined, and the decline is the interesting part

[THR-716](https://linear.app/threadbare/issue/THR-716) (*`{actor}` token renders literally in encounter step prose*) has the best promotion shape in the `Idea` column: a player-visible defect, no blockers, no assignee, a reproduction command in the body, a three-part executable Done-when.

**It carries a standing verdict from run 2026-09-07i** — *"this ticket's Done-when is already satisfied on `main`. Recommending it be marked Done"* — which under the decline taxonomy makes promoting it a re-derivation of a conclusion already on record. Declined on that basis.

**Confirmed independently before accepting it.** The prior run verified by reading source; this run ran the ticket's own reproduction command against `main`:

```
spawn encounter @hero social_scene.recruitment_pitch  ->  stepProseHistory
"The Unchained listens more than talks, watching for what the target wants but hasn't said."
```

The ticket's quoted defect is the identical sentence beginning `"{actor} listens more than talks…"`. **Same sentence, token resolved** — fixed 2026-08-01 under THR-933 ([PR #1237](https://github.com/christianspliid-ui/threadbare/pull/1237)), which chose exactly the alias option THR-716 recommended. `proseEnrichment.ts:590` carries the line and the reasoning.

**No comment was posted.** The evidence is already on the ticket in full; a second one restating it is the noise this lane avoided on THR-1380.

**One honest caveat on the prior verdict, recorded rather than acted on.** THR-716's Done-when 2 asks for a regression lock *"for the social-scene pool"*. The lock that discharges it lives in `buildSimpleEncounterStageModel.test.ts` and covers the stage adapter, not that pool; the only test touching social-scene templates (`recruitmentPitchFragments.test.ts`) guards `{frag:` tokens, and 133 `{actor}` uses remain in `social-scene-templates.ts`, load-bearing on one `.replace()` line. That is a thin residue on a fixed defect, not grounds to reopen — and not worth an executor run at Low value. Stated so the gap is visible rather than implied clean.

### THR-1026 — declined, wrong destination

[THR-1026](https://linear.app/threadbare/issue/THR-1026) (*`questHooks.findGuildLocations` still hardcodes `adventuring_guild`*) reads like a one-literal engine fix. Its **first Done-when is a design fork stated in game terms**: *"A decision is recorded on which faction definitions post ruin quest hooks (all twelve, a named subset, or one) and why."* Its own body argues the fork — a `merchant_consortium` posting an expedition contract is a different fiction, and the three quest templates are adventuring-guild-flavoured by id and prose. Routed to **T2**, not promoted.

### The eight tickets deliberately not promoted

`Idea` holds at least eight process/infrastructure items that would pass a mechanical promotion check — THR-984, THR-758, THR-871, THR-949, THR-882, THR-893, THR-852, THR-752. **None was promoted, and the empty shelf is the reason it would have been wrong.** CLAUDE.md § Prioritization is explicit: a starved shelf is *"a starved shelf, not a license to binge"*, and when the product shelf is empty the headline finding is *"feature pipeline needs supply"*, never more tidying. Recorded so the restraint is visible as a decision rather than an oversight.

### Standing declines, unchanged and not re-derived

THR-1301, THR-1380, THR-1088, THR-984, THR-1024, THR-175, THR-1287, THR-1195, THR-1114, THR-1189, THR-1315, THR-1348, THR-1424, THR-1426, THR-1148, THR-1318, THR-1393, THR-1446, THR-1218 · 15 `wayfinder:*` · THR-1220 · THR-1133 (attended) · THR-1274, THR-1381, THR-1156, THR-789, THR-1155, THR-1043, THR-870, THR-791 · **new this run:** THR-716, THR-1026.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — measured this run, not carried forward.**

```
list_issues(label:"wayfinder:research")  -> 21 issues, all Done
list_issues(label:"wayfinder:task")      ->  5 issues, all Done
```

**Sixth consecutive sweep finding no agent-doable decision ticket on any open map.** Twelve open children, every one `grilling` or `prototype` — HITL by label, untouchable by rule:

- **[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children (THR-1263 … THR-1272), all HITL, none assigned. All four research tickets `Done`. Largest HITL debt on the board with zero remaining legwork.
- **[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** — sole open child THR-1232, assigned to Christian.
- **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** — one unassigned prototype, THR-1236.

No map body edited — this lane resolved nothing, so Decisions-so-far gains no line.

## T2 — design staging

**Triggered for the first time in a week — and barred by the bound.**

Non-`Deferral` items in `Ready for Dev` at scan = **1** (THR-1443), against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger is *fewer than* 2, so the tier fired. The three previous runs all sat on the exact boundary at 2; this is the first to cross it.

**The bound was shut.** `In Design` holds **2 live, 0 excluded** — THR-1287 (assigned, updated 09-09 20:49Z) and THR-790 (assigned, updated 09-08 18:32Z). Both assigned, both well inside `ORCH_IN_DESIGN_STALE_DAYS` (7), so both count against `ORCH_MAX_IN_DESIGN` of 1. **Nothing was staged and nothing was mutated** — no comment, no state change, no assignee touched.

**Raising the bound would not have helped, and this is worth restating now that the tier has actually fired.** Staging produces *a request for an attended session*, not a plan doc — this lane runs Sonnet by Christian's ruling and does not author. A third staged item would join two others waiting on the same input. The constraint is design and approval capacity, and it is now measurably the only one.

T2's candidate queue, strongest first: [THR-1348](https://linear.app/threadbare/issue/THR-1348) (11 of 12 seeds cannot reach the trade-route economy), THR-1446, THR-1393, THR-1274, **and THR-1026 as of this run**.

## T3 — architecture health

**Due and run in full.** Local time at scan was 06:27, past `ORCH_HEALTH_SWEEP_HOUR` (06:00); runs a and b both correctly skipped as pre-06:00. Baseline for the diff is [run b of 2026-09-09](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-09b.md), the last sweep that executed detectors.

| Detector | Result | vs. 2026-09-09 |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, each with a remediation ticket | **Unchanged** — same seven |
| `check:canon-staleness` | **28 warnings** | **27 → 28** (+1) — traced below |
| `sweep:rank-reach` | **`PASS`** — 60 reachable, 0 blocked, 0 unowned | Verdict unchanged. Apex holders at tick 900 **16 → 23** |
| `check:process` | **`passed-with-gaps`** — 1 warning, **3 sub-checks did not run** | **New** — see Finding 1 |

The seven LEAKED contracts are the same seven: `attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertow-card-drifts-mortal-values`.

**`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** The judgement budget went to the `Idea`-column promotion hunt and Finding 1. Saying so rather than implying coverage.

### Finding 1 (new) — `check:process` has been passing with a third of itself switched off

The detector exits **0** and the previous sweep recorded it as *"exit 0; all generators `--check` clean"*. Its actual first lines this run:

```
lint:plan-doc skipped (no candidate files found).
[WARN] linear-auth global LINEAR_API_KEY is unset; skipped Linear-backed checks
check:process passed-with-gaps: 1 warning(s). 3 sub-check(s) did not run —
  recent plan references, orphan issues, Ready-for-Dev handoff keywords
```

**Three of its sub-checks have not been running in this lane, and the exit code does not say so.** The three that skip are precisely the board-hygiene ones — orphan issues, stale plan references, and *Ready-for-Dev handoff keywords*, which is the gate that would independently catch a promotion landing without a usable coordination block. This lane has been reporting the detector as clean while its most relevant third was dark.

**This is the exact pathology T3 exists to catch** — an unmeasured check reported as a pass — and it was found in the tier's own instrument rather than in the codebase.

**Not filed as a ticket, deliberately.** It is infrastructure, and the scheduled-lane throttle reserves filing to the weekly retro. It is also **already half-owned**: [THR-1443](https://linear.app/threadbare/issue/THR-1443), the single item left in the queue, is *"session-precheck is blind to Linear"* — the same class, one instrument over. Logged for the retro with that connection noted.

### Finding 2 (new, minor) — the canon count moved, and the cause is routine

27 → 28 warnings. Traced to THR-1134's closeout at 01:31:59Z today, which edited `Docs/plans/wiring-checklist.md` and `Docs/plans/2026-05-11-agent-feedback-system.md` and regenerated `Docs/plans/INDEX.md` at 01:35:04Z, aging `design-governance.md`, `process.md`, `rulebook.md` and `undertakings.md` past their `last_reviewed`.

**A hypothesis was tested and discarded rather than reported.** The four warnings share timestamps to the second, which suggested the detector might key on filesystem mtime — reset by every checkout, and therefore noise in a worktree-heavy repo. It does not: the reported times match `git log` commit dates (03:31:59 +0200 = 01:31:59Z), while the files' actual mtimes are 04:01:51 local. **The warnings are real drift, not an artifact.** Recorded because a wrong finding asserted confidently would have been worse than none.

### Standing sub-duties

**Hand-created `In Dev` tickets: swept, none found.** Both `In Dev` issues passed through `Ready for Dev` — verified on `stateHistory`, not inferred. THR-1444: `Ready for Dev` 09-09 20:11Z → `In Dev` 04:02Z → `Done` 04:32Z.

**Stalled work: one trip, the same misleading one.** [THR-1130](https://linear.app/threadbare/issue/THR-1130) shows **4** `Ready for Dev → In Dev` transitions (08-15, 08-17, 08-22, 09-04) with no `Done`, at or above `ORCH_STALLED_PICKUP_THRESHOLD` (3). **Not stalled, parked** — three of the four re-entries are the park shape being restored after a sweep released it. Recorded so the number is not silently suppressed.

**THR-1130's park remains stale, and this lane still does not lift it.** `In Dev` + `Parked` + unassigned, holding no executor slot and blocking nothing; its child THR-1222 is merged, so the park's condition is overtaken. **Deliberately untouched** — lifting a park on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755).

**`In Design`: 2 live, 0 excluded.** Neither stale arm engaged; figures and dates under § T2.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

### Product vs process — the week

Trailing-week measure **~30 product / 7 process (~81% product)**. THR-1444 closed at 04:32Z mid-run and moves the numerator by one. This run promoted nothing, so the ratio is unchanged by it.

**The headline has sharpened rather than changed.** The builder is not slow and it is not stuck — it cleared THR-1134, THR-1447, THR-1255 and THR-1444 in under three hours. It is being starved from the front, and the product half of the shelf is now at zero rather than approaching it. Against that: three wayfinder maps at zero remaining legwork, two `In Design` items at a ceiling of one, five design questions declined to a tier that cannot open, and eight tidying tickets this lane is right not to promote. Every one of those waits on the same input.

## Escalations

**None posted, and the reasoning is unchanged from run b rather than re-decided.** This report is written at ~04:45Z and the briefing rebuilds at 04:45Z, so `## Needs Christian` reaches him through the designed channel within minutes. A Discord ping would be a fourth copy of an ask he has already received three times this week, arriving later than the briefing that carries it.

The lane did not fall through to un-agreed work. It ran the daily sweep in full, worked two `Idea`-column candidates to a verdict instead of skimming them, tested and discarded one wrong hypothesis, declined eight promotable tidying tickets on the standing rule, and promoted nothing because nothing agreed was promotable.

**A hazard found while deciding not to act (not filed, logged).** Recording the Finding-1 connection on THR-1443 was considered and rejected: `pull-work` Step 3 validates a candidate's **latest comment** for the three coordination lines, so any comment posted onto a queued ticket without a full block re-posted beneath it makes that ticket un-claimable. The single job left in the queue was one careless comment away from being unpickable. Worth a line in the skill.

**Sub-bar notes carried to the weekly retro, not filed** (unchanged unless marked): the `In Design` liveness clock counting bot comments as human activity · `strategicControlChurn.test.ts`'s docblock advertising two guards THR-1303 deleted · `undertaking-objects.ts:1490`'s stale docblock caution · a coordination block written into a ticket's *description* rather than as a comment still fails `pull-work` Step 3 · the canon-staleness false-positive class against the auto-generated `INDEX.md` · THR-1133's blockers cleared six days before any lane noticed · **the shipped-under-a-sibling-id class is now five instances** (THR-1301, THR-1380, THR-1441, THR-1088, **THR-716**), which clears the materiality bar's *≥3 recurrences in a week* threshold with a quotable cost — three separate runs have now spent their judgement budget re-deriving that a ticket's work already shipped. It is the retro's to file, not this lane's · **new this run:** `check:process` (Finding 1) and the queued-ticket comment hazard above.
