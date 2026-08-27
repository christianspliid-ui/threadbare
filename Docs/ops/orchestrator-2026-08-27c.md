---
lane: tb-orchestrator
run: 2026-08-27c
promoted: 0
filed: 0
resolved: 0
newFindings: 3
needsChristian: true
---
# Orchestrator — 2026-08-27 (run c, ~04:26Z)

## Needs Christian

**The ask is unchanged and it is still one sentence: say yes to the retrofit batch-2 brief.**

Nothing moved on the board in the two hours since the last brief. The builder still has nothing to build — the undertaking substrate finished at 01:42 this morning and the shelf behind it is empty. The camp-seven encounters (the shrine offering, rest and reflect, and five siblings) are real, buildable content work that needs no design session, parked only because your own rule from the factory sitting says the brief gets your approval first. The brief is merged and ready to read: **[retrofit-batch-2-brief.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)**. It is also still the thing standing between you and the sitting you asked for on 2026-08-24 — the shrine offering is encounter #1 of the slice roster, so [the integrated checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) cannot invite you while it is below standard.

**The map questions: nine, not twelve — and there is now an obvious place to start.**

The last two briefs said twelve and flagged that the number was an upper bound. This run did the check they owed. Three of the ten Physical Conflict questions are waiting on other questions, so they are not actually open to you yet. Nine are.

Two of them unlock three others, so they are worth doing first — **how a fight between two people plays out** ([agent-mode fight loop](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs)) and **how a fight against a monster plays out** ([NPC-mode fight loop](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton)). Both are things to look at and react to, not conversations. Answering them opens up the fight-on-screen mock, the mid-fight event table, and how a fight embeds in an encounter.

The other five Physical Conflict questions are open now and independent of those two: [Companies in fights?](https://linear.app/threadbare/issue/THR-1271/companies-in-fights), [Monster opponents — just enough monster](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster), [Systemic triggers — walking into the lair, grudges boiling over](https://linear.app/threadbare/issue/THR-1267/systemic-triggers-v1-walking-into-the-lair-grudges-boiling-over), [Defeat wears many faces](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum), [Victory yields — what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands).

And two sketches elsewhere, both ready: [twenty generated spells](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) and [thirty generated items](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

Say "work the map" when you have an hour.

**A design session, when you can spare a second hour.** Five fully-scoped Proactive Agent Actions design tickets are filed and need nobody's permission to begin — but they need an attended session, which the automated lanes cannot run. Two older design items have now sat untouched for 8 and 12 days: [the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools).

**One thing found this morning that you may want to have an opinion on eventually, but not now.** The god's "let this mortal go quiet" action promises their encounters stop surfacing — and it keeps that promise. But the new undertaking system, when it grows a player-facing surface, would still interrupt you about that same mortal's projects. Two different parts of the game disagree about what "I am watching this person" means. It cannot reach you today (that surface does not exist yet), and it has been written up on the ticket that will build it, so the person doing that work will meet it at the right moment. No action needed from you; recorded so it is not discovered as mystery noise later.

## T1 — unblock sweep

Ready for Dev held **0** items at scan (04:26Z) — third consecutive run at zero. Promotion ceiling never engaged.

**Promoted: none. Filed: none. No candidate was new since run b.** The newest `updatedAt` across all 45 `Todo` items is `2026-08-27T01:33:38Z` (THR-1303), which run b already assessed at 02:26Z. Nothing has entered, left, or moved in the queue in two hours.

Rather than restate eighteen unchanged declines, the standing evidence is carried by reference — [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27.md) recorded the full set at 00:26Z and [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-27b.md) added the four undertaking-substrate spinoffs at 02:26Z. Re-deriving them hourly on identical inputs is the churn this lane's own reporting rule forbids. The four load-bearing ones, unchanged:

* `skip THR-1222` — unmet blocker, a **state gate not a ticket**: Christian's chat approval of the batch-2 brief. Plan-doc liveness **LIVE**. Surfaced under Needs Christian.
* `skip THR-1301` — unmet blocker, native Linear relation `blockedBy: THR-1297` (`Todo`). Plan doc **LIVE**; only the blocker holds it.
* `skip THR-1303` — unmet blocker, two hops out: THR-1301 blocks it, and THR-1301 is itself blocked.
* `skip THR-1302` / `THR-1287` — wrong destination; both name an unmade design decision in their own Done-when. T2's input.

Fifteen `wayfinder:*` issues skipped unconditionally as T1.5's input.

**Rule-0 / product-vs-process ratio.** Re-measured this run rather than carried: of the completions with a `completedAt` inside the trailing seven days, roughly **28 product** (engine, content, bugs), **16 wayfinder/design** (research and grilling tickets on the three open maps plus the closed Proactive Agent Actions map), and **5 process** (THR-1283, THR-1273, THR-1253, THR-1252, THR-1250). Process is ≈10% of completions — comfortably inside the one-in-three throttle. The count is a **floor** (the Linear page truncated at 100 with `hasNextPage: true`) and the classification is judgement, not a metric. No process ticket was promoted this run; none was a candidate.

The product shelf being empty makes the headline finding **"feature pipeline needs design/Christian"**, per the throttle. This run took no process work as a substitute.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) (THR-1258), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) (THR-1226), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) (THR-1227).

**AFK burn-down: zero, and structurally so.** Re-verified this run rather than carried: a label sweep across every state returns **19 `wayfinder:research` issues, all `Done`**. There is no open AFK ticket anywhere on the board. The entire remaining frontier is `wayfinder:grilling` and `wayfinder:prototype` — HITL by construction, and resolving one is the broken-HITL failure mode the wayfinder skill names.

### The owed relations check, discharged — the frontier is 9, not 12

Runs a and b both reported 12 and both flagged the same honest limitation: the frontier was computed from state + label + assignee only, with native blocking relations **not** re-queried per candidate, making 12 an upper bound rather than a verified count. This run ran `get_issue(id, includeRelations:true)` on all twelve. Three are blocked:

| Issue | Blocked by | State of blocker |
|---|---|---|
| THR-1269 — embedding the fight block | THR-1264, THR-1263 | both `Todo` |
| THR-1272 — the fight on screen | THR-1264, THR-1263 | both `Todo` |
| THR-1265 — mid-fight event table | THR-1264 | `Todo` |

The remaining nine are genuinely open — every named blocker resolves to `Done`:

* **Physical Conflict (7):** THR-1271, THR-1268, THR-1267, THR-1266, THR-1270 (grilling); THR-1264, THR-1263 (prototype).
* **Powers & Spellcraft (1):** THR-1232 — blockers THR-1237, THR-1228 both `Done`.
* **Item Generator (1):** THR-1236 — blockers THR-1237, THR-1228, THR-1235, THR-1234 all `Done`.

**The useful half is the shape, not the correction.** THR-1264 and THR-1263 — the two fight loops — are unblocked *and* between them gate all three blocked tickets. They are the map's critical path, and nothing in the previous two briefs said so, because a flat list of twelve cannot. Surfaced to Christian as a start-here rather than as a pick-any.

**One bookkeeping note.** THR-1232 carries `assignee: Christian Spliid`. A strict reading of the frontier rule ("drop any with an assignee") would exclude it, but an assignee of Christian on a HITL ticket is the correct owner rather than an agent claim, so it is counted in the nine. Recorded because the rule as written does not distinguish the two cases.

## T2 — design authoring

**Triggered by shelf depth, then bound out — third consecutive run.**

Non-`Deferral` items in Ready for Dev: **0**, below the floor of 2. `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1 — [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, staged 2026-08-19, **8 days**) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, staged 2026-08-15, **12 days**). No staging performed. Both are far past the 48-hour threshold, so both are **re-surfaced, not re-staged**, per the rule.

The flow observation run b recorded stands unchanged and is not restated: `In Design` is functioning as a parking lot rather than a queue, and because the bound counts parks the same as live work, two stale parks jam the only supply valve this lane has. Logged for the weekly retro; no ticket filed, per the process-work throttle.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 06:26 local), and runs a (02:26 local) and b (04:26 local) both correctly declined it on the hour gate. Diffed against [`orchestrator-2026-08-26b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-26b.md), the last run that invoked a detector.

| Detector | Result | vs. 2026-08-26b |
|---|---|---|
| `generate-interface-map:dry` | **8 LEAKED**, 122 LIVE; every leak carries a remediation ticket | **7 → 8 — see finding 1.** New member: `undertaking-checkpoint-events` (THR-1293) |
| `sweep:rank-reach` | **PASS** — 60 rank-gated templates reachable, 0 blocked, 0 unowned; 13 apex holders at tick 900 | Verdict identical. **Its incidental `DistanceMatrix` warn moved +151 and now has a mechanism — see finding 2** |
| `check:process` | exit 0. `check-design-wiki` OK (24 pages); `check-wiki-freshness` OK (24, no stale); `check-guidance-freshness` OK, 1 doctrine, `mode=advisory`; four generators up to date; `check:authoring-brief` up to date | **Unchanged in every row.** The `[WorldGen] Ocean fraction too low: 7.4%` incidental fires a **third** time at the identical value — recurring, not new, not drifting |
| `check:canon-staleness` | **21 warnings** | Count unchanged at 21 — see finding 3 for the honest limit on the composition diff |

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked from a headless scheduled context. **Not run, and not reported as clean.**

### New finding 1 — the undertaking substrate shipped a LEAKED contract, and it is the one its own deferral predicted

`undertaking-checkpoint-events` joined the leak set overnight, which is exactly what should happen: THR-1292 merged at 01:42Z and its sibling deferral THR-1293 was filed at 01:33Z saying precisely this. The detector and the deferral agree, which is the healthy case.

Verified rather than taken from the verdict line — the detector's own text asks for this check before treating it as a leak:

```
$ grep -rn "undertaking_checkpoint\|undertaking_fork" src --include=*.ts | grep -v __tests__
src/engine/undertakingCheckpoints.ts:547:    category: 'undertaking_fork',
src/engine/undertakingCheckpoints.ts:713:    category: 'undertaking_checkpoint',
src/types/trace.ts:118,119,506,507,1812,1844          (category union + registration only)
```

Emit site and type registration, and **no read site anywhere in `src/`**. The leak is real. `resolveMomentPresentation` computes a salience verdict inside the emitting module and stamps it on a trace nobody consumes. Already owned: THR-1299 (doc 5) names THR-1293 under "known scope this doc owns."

**Not filed, correctly** — this is a leak with a ticket and a named home, which is the state the interface map exists to produce.

### New finding 2 — the distance-matrix overrun is no longer static; it now grows with play

Same command all four days (`sweep:rank-reach`, **seed 42 / medium / 900 ticks**). Confirmed deterministic at `scripts/rank-reach-sweep.ts:54–55` — fixed seed, fixed preset — so day-to-day movement is attributable to the tree, not to run variance.

| Sweep | Locations counted | Unindexed (dropped) |
|---|---|---|
| 2026-08-24 | 1555 | 355 |
| 2026-08-25 | 1688 | 488 |
| 2026-08-26 | 1442 | 242 |
| **2026-08-27** | **1593** | **393** |

**+151 locations in twenty-four hours, and the dropped set grew 62%.** The one thing that merged in that window is THR-1292, the undertaking substrate.

The attribution is **structural, not correlational** — three facts, each read off the tree this morning:

1. `src/engine/distanceMatrix.ts:90` counts `graph.getNodesByType('location')`.
2. Per THR-1183, the sublocation tier **is** a `location` node carrying `parentLocationId`. So that sweep returns **both tiers**, and every sublocation consumes a matrix slot.
3. The strategic/undertaking lifecycle mints sublocations as undertakings complete — `strategicActionLifecycle.ts:613, 697, 705` call `createSublocation`, which writes `type: 'location'` at `strategicGraphOps.ts:128`. Warehouses, guild chapters, and hint-driven places.

That changes the character of the standing condition rather than just its magnitude. It has been read for three days as a **content-volume** overrun that authored content grows slowly — and yesterday's report correctly retired the "decay" reading as two points not being a trend. The fourth point plus the mechanism says something different: **it grows with play.** Every economic undertaking that completes permanently consumes a distance-matrix slot, in a budget CLAUDE.md still documents as covering *"all supported presets (`large` ~584, `epic` ~805)"* — figures that are **settlement** counts. The cap is sized in place-tier units and measured in both-tier units, and the undertaking substrate has just become an active producer on the measured side.

`buildDistanceMatrix` truncates with `.slice(0, 1200)`, i.e. by insertion order, so *which* 393 get dropped is arbitrary rather than chosen — late-minted settlements are as droppable as warehouses.

**Blast radius is still narrow and still fail-soft**: two production consumers of `getDistance`, both in the tick loop (`idleBehavior.ts`, `phaseAgentDecision.ts`). Encounter awareness is unaffected — it uses hex distance, per the load-bearing decision. So this is not breaking anything today; it is a budget quietly changing from fixed-cost to per-play-cost without anyone deciding that.

**Not filed** — the process-work throttle bars scheduled lanes from filing infrastructure tickets, and the weekly retro is the single promotion point. Recorded here for that batch, now with the mechanism attached rather than as a fourth number in a column.

### New finding 3 — canon staleness holds at 21, and the composition diff has an honest limit

Count unchanged, 21 → 21. Three of the rows remain the known permanent floor — `interface-map.generated.md`, `setting-coverage.generated.md`, `systems-inventory.md` each report *missing or invalid frontmatter field: `last_reviewed`*, and all three are **generated**, so the stamp would be meaningless by construction.

The two rows yesterday singled out are both still present, and the source has moved again: `Docs/plans/2026-04-16-systemic-wiring-guide.md` now reads mtime **2026-08-26T09:21:00Z** (it was 02:35:41Z at yesterday's sweep), so `encounters.md` and `prose.md` — reviewed 2026-08-25 — have been re-staled a second time by a second edit to the same guide within a day. That guide is a declared source for **five** canon pages, which is why it dominates this list.

**The honest limit:** yesterday's report published the count and the two singled-out rows, not the full 21. So "the composition is unchanged" is *not* something I can assert — only that the count matches and the specific rows called out yesterday persist. Today's full list is above, which makes tomorrow's diff a real one.

### Redundancy pass — assessed, positive, and routed rather than filed

**The judgement pass was done this sweep.** It came back positive, on a genuine D7 shape: two mechanisms answering one question, both reachable, neither wrong alone, invisible to any reachability sweep.

**"Is the player watching this agent?" has two implementations that disagree on a case a player action creates.**

| | Predicate | Keyed on | Dormant-threaded agent |
|---|---|---|---|
| Attention Tier Model | `resolveEffectiveTier` (`attentionTier.ts:39`) | `courtPosition` off the `thread` edge | **`'invisible'`** |
| Undertaking presenter | `isFollowedAgent` (`undertakingCheckpoints.ts:212`) | *existence* of a `thread` edge, + `followedAgentIds` | **`true`** |

`courtPosition` is a property **on** the thread edge (`ThreadEdgeProperties`, read at `encounterVisibility.ts:338`), so going dormant does not remove the edge — and `isFollowedAgent` tests only that the edge exists.

The divergence is manufactured by a player action whose own authored description is the spec it breaks. `thread.dormant` (`unified-action-templates.ts:5374`): *"their encounters no longer surface as tugs … **The thread persists**; reactivation is swift."* The thread persisting is the point of the action. So every mortal the player has explicitly gone dormant on still reads as followed, and `resolveMomentPresentation` returns `'interrupt'` for their completions, forks, abandonments and complications — while `phaseAttention.ts:186,251` and `encounterVisibility.ts:43,150` all correctly treat them as unwatched.

Latent today: it cannot reach a player, because of finding 1 — nothing consumes the checkpoint stream. It goes live the moment doc 5 builds the surface that reads it, and it will present then as *"the interrupt is too noisy"*, which is a much harder symptom to trace back to a predicate disagreement.

**Routed, not filed** — posted as a finding on [THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) (doc 5, which owns the affected surface), because `isFollowedAgent`'s own doc comment names doc 5 as the owner: *"that is doc 5's problem to solve when it builds the affordance."* No state, assignee or priority was written; the ticket's null assignee was re-verified absent after the comment. The two design options were laid out without a recommendation — this lane does not choose direction.

### Stalled work

**No stall.** `In Dev` holds **3**, all three carrying `Parked` — the sanctioned shape:

* **THR-1130** — 3 `Ready for Dev → In Dev` transitions with no terminal `Done`, i.e. exactly `ORCH_STALLED_PICKUP_THRESHOLD`. Verdict unchanged for the fourth day: a `Parked` batch-cadence umbrella whose batches ship under their own tickets (batch 1 completed as THR-1221). Repeated pickup is its designed shape, not repeated failure.
* **THR-1133** — 1 transition. Attended-only by construction.
* **THR-1168** — 1 transition.

Yesterday's fourth, THR-1244, is gone — completed 2026-08-26T04:44Z. **There is no live claim at all**, which is the corroborating half of the empty-shelf finding: the executor is not stalled, it is idle.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Thursday**. Deliberately not reported from Monday's result — [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops` and stands unchanged.

## Escalations

**Nothing asked on Discord; nothing parked.** No question blocked this run.

**Agreed work is not exhausted** — five filed, fully-scoped design tickets plus two sat In Design, all agreed. What is exhausted is *executable* work. The only two refill valves are an attended design session or Christian's approval of the retrofit brief, and neither is something this lane may do for him, which is why it is reported rather than routed. Third consecutive run reporting it; the report is the correct response, not a Discord question, because the situation is understood and the doorbell belongs to `keep-work-flowing-cc`.

**One process note recorded for the weekly retro, not filed.** The T1.5 frontier rule ("drop any candidate with an assignee") does not distinguish an agent claim from Christian owning a HITL ticket. THR-1232 is assigned to him and is nonetheless a live question for him — counting it as claimed would hide it from the very brief that exists to surface it. Small, but it is the kind of rule that silently under-reports rather than erroring.

**Home tree left clean.** All four detectors ran with the home tree as CWD (read-only commands, no git state ops per THR-672). `git status --porcelain` afterwards shows one pre-existing tracked modification (`.claude/settings.local.json`) and **zero untracked files** — no THR-937 autosync collision introduced.
