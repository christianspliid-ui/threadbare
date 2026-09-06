---
lane: tb-orchestrator
run: 2026-09-01
promoted: 1
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-01 (run —, ~17:47Z)

## Needs Christian

**1. One yes/no would unblock the top content ticket on the board.** [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — seven camp-and-devotion encounters through the factory line, starting with the shrine offering — is held on exactly one thing: your approval of its brief in chat. Nothing technical blocks it. It is also the encounter that has to be at standard before the [integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) can invite you to play.

**2. The bottleneck is design sessions, not the queue.** Three things are sitting in "In Design" waiting for an attended session, two of them since Friday: [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46), [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (locations, artifacts, draw-by-trait pools), and [unifying the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card-vocabulary). Meanwhile the ready-to-build shelf is down to a single item. This run could not stage a fourth — the lane holds at most one at a time and three are already parked there.

**3. Two forks look like yours, and they are both about what the world *is*.** Eight tickets declined this run because they need a decision, not a dependency (detail in T1). Two of them are game questions rather than engineering ones:

- **Should the world's merchants be able to build things off-screen?** Right now only the ~17 spotlight actors can pursue an ambition, so ten strategic templates — the whole merchant-expansion family — are unreachable, and a twelve-seed sweep found the trade-route economy works on exactly one seed. Three readings are on the table and they are genuinely different games. ([THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the))
- **Should holding something cost upkeep, or just expire on a timer?** Today a control stance always collapses on a fixed schedule no matter what its holder does — the fiction says "a grip you stop renewing slowly opens", but renewal is impossible by construction. ([THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets))

**4. Two wayfinder maps are waiting on you, and their homework is finished.** Every research question on every open map is now answered — the agent-doable half is exhausted, so nothing else moves without you.

- [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) has ten questions ready, six to talk through and four to look at. The talking ones include [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands), [how many faces defeat wears](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum) and [whether companies fight as units](https://linear.app/threadbare/issue/THR-1271/companies-in-fights).
- [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) and [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) each have a generated batch to react to — [twenty spells](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) and [thirty items](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

Open a chat and say "work the map" when you have the appetite.

## T1 — unblock sweep

Scan: `Todo` 43 issues, `Ready for Dev` 2 at 17:40:34Z. Sorted in memory (no `orderBy:priority` — impediment #49).

**15 wayfinder-labelled issues skipped unconditionally** (3 maps + 12 children) — decisions, not executor work; they are T1.5's input and never enter `Ready for Dev`. Of the remaining 28, twelve were read in full.

### Promoted (1)

- **[THR-1378](https://linear.app/threadbare/issue/THR-1378/rulebook-review-2026-09-10-findings) — Rulebook review 2026-09, 10 findings** → `Ready for Dev`. **Blocked by: nothing** — no coordination line, no prose gate, no time gate, `relations.blockedBy` empty. Filed into `Todo` at 17:39Z by the `monthly-rulebook-review` lane; promoted 7 minutes later. Standing-verdict check (THR-990): zero comments, so no retire verdict to override the premise. Plan-doc liveness (THR-921): passes trivially — names no plan doc; both subject files are on `origin/main` today. Write verified by a server-side state-filtered re-query; assignee absent (promotion is an update, so it was never set). [Coordination block posted](https://linear.app/threadbare/issue/THR-1378/rulebook-review-2026-09-10-findings) and confirmed as the only — therefore latest — comment, which is what `pull-work` Step 3 validates.

  Judged **content, not process**, so the throttle does not bar it: the deliverable corrects canon that states the rules of play, and its worst finding (F5) is that the always-load quick-reference card has told every session since 2026-08-10 that the game's opening encounter still runs the rejected pre-nudge model. The one process-flavoured finding (F9) explicitly declines to request a gate.

**Promotion ceiling: not reached.** Shelf was 1 at promotion time against `QUEUE_BACKED_UP_MIN` of 15, and `ORCH_PROMOTE_BATCH_MAX` of 5 was never approached. **Nothing was held back this run** — the constraint was candidate supply, not the ceiling.

### Declined — dependency or gate unmet (5)

- **[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)** (High) — human gate. Its own coordination block (2026-08-24) reads *"Blocked by: Christian's chat approval of `Docs/plans/encounters/retrofit-batch-2-brief.md` (ruling 2) — a state gate, not a ticket."* `list_comments` returns that one comment and no approval record. Routed to `## Needs Christian` item 1.
- **[THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking)** — three unmet native blockers: THR-1349 (`Todo`), THR-1302, THR-1297.
- **[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix)** — gated on a post-cutover decision-mix floor, i.e. on THR-1301 above. Transitively blocked.
- **[THR-1024](https://linear.app/threadbare/issue/THR-1024/detailmodal-forks-its-own-overlay-instead-of-composing-modal-no)** — explicit prose gate: *"Sequencing — do not start this before THR-966."* THR-966 (the DetailModal cluster's mount-vs-prune call) is not Done. The ticket adds that if the cluster is pruned this dies with it, so doing it first is wasted either way.
- **[THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn)** — time gate, window opens **2026-09-08**; seven days short. Independently corroborated by this run's `check:process` output, which prints `mode=advisory (burn-in; flip reviewed after 2026-09-08, THR-1256)`.

### Declined — wrong destination: needs a design decision, not a dependency (8)

**This is the run's finding, and it is not a judgement I had to make** — each of these eight states it in its own body, in its own words:

| Issue | Its own words |
|---|---|
| [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) | *"this is the fork, and it is not the executor's to settle"* — three readings, *"genuinely different games"* |
| [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) | *"Design decision recorded first… a rules-of-play question, not a defect with one right answer"* |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) | *"This is a design ticket, not a patch"* — the new-node-type rule binds it |
| [THR-1318](https://linear.app/threadbare/issue/THR-1318/lens-overlay-prose-engine-is-authored-tested-and-has-no-caller) | *"Why this is a decision and not a bug fix"*; also *"better decided after"* THR-1213's content pass |
| [THR-1195](https://linear.app/threadbare/issue/THR-1195/hexsend-heralds-divine-herald-has-no-actortype-so-it-is-located-but) | *"A recorded decision on what a Divine Herald is"* |
| [THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere) | *"Why it is a content call, not an executor one… no agreed outcome to test against"* |
| [THR-1189](https://linear.app/threadbare/issue/THR-1189/taxrate-is-stamped-on-trades-with-routes-and-read-by-nothing-the-toll) | *"it wants a design pass rather than an executor's judgement call"* |
| [THR-1315](https://linear.app/threadbare/issue/THR-1315/worldrefkind-codex-is-reserved-no-in-game-codex-destination-exists) | *"This is a design task, not an executor task… filed to `Todo` for `tb-orchestrator` T2 re-scoping rather than to `Ready for Dev`"* |

Eight of twelve candidates examined. Met blockers do not make these dev-ready; they make them T2's input — and T2 could absorb none of them this run (below). THR-1315 in particular was addressed *to* this lane and could not be served.

**Product-vs-process ratio.** The one promotion is product (canon content). No process ticket was promoted, and none was filed — the throttle's budget was not spent. With the product shelf effectively empty, the headline is the one the rule prescribes: **the feature pipeline needs design and Christian, not another process promotion.**

### Traces

```
[orchestrator] T1 promote THR-1378: no blocker, no verdict comment, no plan doc → Ready for Dev (program: Content Architecture)
[orchestrator] T1 skip THR-1222: human gate — Christian's chat approval of retrofit-batch-2-brief.md, unrecorded → Needs Christian
[orchestrator] T1 skip THR-1301: blockers THR-1349(Todo), THR-1302, THR-1297 — none Done
[orchestrator] T1 skip THR-1303: transitively blocked on THR-1301
[orchestrator] T1 skip THR-1024: prose gate — "do not start before THR-966"; THR-966 not Done
[orchestrator] T1 skip THR-1256: time gate — window opens 2026-09-08, 7 days short
[orchestrator] T1 skip THR-1348/1287/1274/1318/1195/1114/1189/1315: design decision required → T2 (T2 bound-out this run)
[orchestrator] T1 ceiling not reached (shelf 1 ≤ 15, 1 promoted) — nothing held back
```

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) (THR-1258), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) (THR-1226), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) (THR-1227).

**AFK burn-down: 0 resolved, and none was available.** A label-filtered sweep of `wayfinder:research` across the team returns **19 tickets, every one `Done`** — including all four on Physical Conflict, whose findings are already written into that map's *Decisions so far*. No open `wayfinder:research` or agent-doable `wayfinder:task` exists on any map. **The agent-resolvable half of every open map is exhausted**, which is a materially different state from "the sweep found nothing" — it means these maps cannot advance at all without an attended session.

**HITL frontier: 12, all surfaced** under `## Needs Christian` item 4.

| Map | Open children | Shape |
|---|---|---|
| Physical Conflict | 10 | 6 `wayfinder:grilling`, 4 `wayfinder:prototype` |
| Powers & Spellcraft | 1 | `wayfinder:prototype` (THR-1232, assigned) |
| Item Generator | 1 | `wayfinder:prototype` (THR-1236) |

**Honest limit on the frontier figure.** These counts are *open and unclaimed*, not *open, unclaimed and unblocked* — verifying native Linear blocking relations needs one `get_issue` per child and was not done this run. The numbers are therefore an **upper bound** on the true frontier. It does not change the disposition: every member is HITL, so none was touchable either way.

Physical Conflict's charter is settled (nine decisions recorded from Christian's 2026-08-26 live chat) and its substrate research is complete, so its ten remaining questions are ready to work rather than needing preamble.

```
[orchestrator] T1.5 map "Physical Conflict": frontier ≤10 (10 HITL surfaced, 0 AFK available — all 4 research tickets Done)
[orchestrator] T1.5 map "Powers & Spellcraft": frontier ≤1 (1 HITL surfaced, 0 AFK available)
[orchestrator] T1.5 map "Item Generator": frontier ≤1 (1 HITL surfaced, 0 AFK available)
```

## T2 — design staging

**Triggered, and bound out. Nothing staged.**

- **Trigger fired.** `Ready for Dev` held 2 at scan — THR-1349 and THR-1377 — **both `Deferral`-labelled**, so **0** non-`Deferral` program items against `ORCH_PROGRAM_WORK_FLOOR` of 2. (THR-1349 then left for `Todo` at 17:41:22Z, 48 seconds after the scan read it, leaving the shelf at 1. The program count was 0 either way.)
- **Bound blocked it.** `ORCH_MAX_IN_DESIGN` is **1**; `In Design` already holds **3** — [THR-1298](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) (the reactive loop), [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (traits wave 2), [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card-vocabulary) (card grammar). Staging a fourth would make the bound meaningless.

**Two re-surfaced, not re-staged** (the 48h rule): THR-790 and THR-1002 both last moved **2026-08-29** — three days unpicked. THR-1298 was touched today at 17:30Z by another lane.

**The measurement worth keeping.** The shelf is empty of program work *and* the design-staging tier has nothing left to give, because staging is not the scarce resource — attended design sessions are. Eight T1 declines are waiting on exactly the same thing as the three items already parked in `In Design`. Had the bound been free, the top candidate under the prioritization rules would have been THR-1348 (a `Deferral` in Thematic Pressure & Living World, the project with the only active shelf item); it is routed to Christian directly instead, as its fork is a direction call rather than a plan-doc gap.

## T3 — architecture health

**Due and run.** First run past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started **19:40 local**) with no sweep yet today — and no orchestrator report exists on `ops` for 2026-09-01 at all. Diffed against [`orchestrator-2026-08-30b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-30b.md), the last sweep that actually ran.

| Detector | Result | vs. 2026-08-30b |
|---|---|---|
| `generate-interface-map:dry` | **8 LEAKED**, 67 LIVE, 18 UNVERIFIED-OK, 2 PARTIAL, **95 total** (exit 0) | **Identical in every cell, LEAKED membership member-for-member** |
| `check:canon-staleness` | **25 warnings** (exit 0) | **Identical, member-for-member.** No new row, none departed |
| `check:process` | exit 0. `check-design-wiki` OK (24 pages, 23 served); `check-wiki-freshness` OK (24 pages vs `origin/main`); `check-guidance-freshness` OK (8 doctrines, `mode=advisory`); four generators up to date; `check:authoring-brief` up to date | **Unchanged in every row.** `[WorldGen] Ocean fraction too low: 7.4%` fires again at the identical value — recurring, not drifting |
| `sweep:rank-reach` | **Not measured** — see below | Deliberately **not** carried forward |

**`sweep:rank-reach` — not measured this sweep.** Started 17:43Z; still executing (900 ticks, seed 42, medium) when this report was written. It took ~35 minutes on 08-29d and ~40 on 08-28b, the same sibling-contention shape. Its verdict is **unknown, not `PASS`** — the 08-29d green is not restated, because carrying a stale green forward is exactly the pathology this tier exists to catch.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked from a headless scheduled context. **Not run, and not reported as clean.**

**The eight LEAKED contracts, listed again so tomorrow's diff stays real:**
`attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertaking-checkpoint-events` · `undertow-card-drifts-mortal-values`

Two consecutive sweeps at a fixed point across every count and every member, with two days between them. That stability is itself information: nothing that shipped over the weekend touched a declared cross-system boundary.

### New finding 1 — the daily sweep silently skipped a day, and the no-op gate is why

**No `orchestrator-2026-08-31*.md` exists on `ops`.** The last report of any kind was `orchestrator-2026-08-30c` (05:26Z Sunday); the next is this one, ~60 hours later. Verified by listing the branch, not the working tree (THR-947).

That is a *legitimate* outcome under the THR-920 no-op rule if every run on 08-31 promoted nothing and surfaced nothing new. But it exposes a coupling nobody chose: **T3 is a standing daily duty and T1 is a per-run sweep, yet they share one publish gate.** A quiet board suppresses the architecture-health check — which has nothing to do with the board — and with it the diff baseline the tier depends on. The weekly test-suite pass was collateral: **2026-08-31 was a Monday**, `ORCH_TESTHEALTH_DOW`, so the weekly pass did not run either and the next is 2026-09-07.

The tension is real in both directions and this run is not the place to settle it: `check:substantive` exists precisely because hourly "we looked and it stayed blocked" reports trained the reader to skip this file. The narrow observation for the retro is that a *sweep that ran and found nothing new* and a *sweep that never ran* are currently indistinguishable in the published record — which is the same shape as reporting a failed detector as clean, one level up.

**Recorded, not filed** — the process throttle. THR-954 already tracks whether the no-op gate should relax; this is evidence for that ticket, not a new one.

### New finding 2 — redundancy pass: one tunable, many independent literals

Found by the judgement pass, not by a detector, and a **new probe class** rather than a re-run of yesterday's. Yesterday scanned duplicate *function* names; this scanned duplicate *constant* definitions — the tunability axis (NFP #1), where the failure mode is not a wrong result today but a divergence the first time someone tunes one copy.

Method: every `export const UPPER_SNAKE` in production `src/`. **4,008 exported constants; 25 names defined in more than one module.** Each candidate's module imports were then read, because the interesting question is not "defined twice" but "defined twice *with no shared source*".

**Benign — one source plus adapters, the correct pattern, not findings:** `MAX_AWARENESS_HOPS` (`idleBehavior.ts` re-exports `IDLE_MAX_AWARENESS_HOPS`), `DEFAULT_DOOM_TICKS` (`gameState.ts` re-exports `CONFIG_DEFAULT_DOOM_TICKS`), `REACH_TO_SPHERE` in `SphereIcon.tsx` (re-exports `_REACH_TO_SPHERE`). This is the shape THR-1322's fix produced last week and it is what a repair looks like.

**Real — the same literal typed twice, neither module importing the other:**

- **`SEA_LEVEL = 0.38` — the load-bearing one, and it is worse than a pair.** `src/components/HexMapV2/palette/waterPalette.ts:31` holds the **renderer's** water line; `src/engine/worldgen/constants.ts:115` holds **worldgen's**. Neither imports the other. On top of that, the worldgen copy's doc-comment reads *"matches terrain.ts `ELEV.SEA_LEVEL`"* and `src/engine/worldgen/types.ts:81` carries *"default 0.38 (from `ELEV.SEA_LEVEL`)"* — but **`ELEV.SEA_LEVEL` no longer exists anywhere in `src/`** (`src/engine/terrain.ts` is still there; the symbol is not). So one number has two independent definitions, two comments citing a third authority that is gone, and a fourth restatement of the literal in prose. Move one and the map paints water where the engine says land.
- **`TRUST_COOPERATE_DELTA` (0.03), `TRUST_DEFECT_DELTA` (−0.08), `TRUST_DECAY_PER_TICK` (0.002)** — `src/data/agent-behavior-constants.ts:292/300` and `src/types/disposition.ts:124/130`. `disposition.ts` imports nothing from the constants module; both blocks carry their own doc-comments. Three social tunables, each with two authorities.
- **`REACH_TO_SPHERE`** — two *independent maps* (`src/components/icons/constants.ts:17`, `src/data/premonition-constants.ts:114`). Two reach→sphere mappings can disagree about the cosmology itself, which is not a style question.
- **`SPHERE_COLORS`** — same two modules (`:5`, `:138`). Two sphere→colour maps can paint one Sphere two colours on two surfaces (a Law 4 / Law 14 hazard that renders as "the UI is subtly wrong", never as an error).
- **`GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN = 3`** — `src/data/content-eval/nudgeAuthoringConstants.ts:397` and `src/data/encounter-image-library.ts:58`.
- **`TRACE_CATEGORIES`** — `src/engine/traceBuffer.ts:25` and `src/types/trace.ts:460`. A known multi-site shape (trace categories already require registration in four places), listed for completeness rather than as a surprise.

**Weaker case, not asserted:** `OUTCOME_BAND_PROSE` is `Record<string, string[]>` in `narrative-content.ts:1296` but `Record<OutcomeBand, PhraseEntry[]>` in `outcome-band-content.ts:32`. **Different types**, so this is more likely migration residue than a live duplicate — a dead-code question, not a tunability one. Flagged for whoever looks, not claimed.

**Not individually verified this run:** the worldgen noise cluster (`ELEVATION_SCALE/OCTAVES/PERSISTENCE/LACUNARITY`, `TEMP_NOISE_SCALE`, `TEMP_ALTITUDE_PENALTY`, `MOISTURE_NOISE_SCALE`, `LAKE_SIZE_MAX`, `GREAT_LAKE_SIZE_MAX`, `RIVER_MIN_LENGTH`) plus `CATEGORY_COLORS`, `DOOM_ARCHETYPES` and `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` all appear in the duplicate list and were **not** read. Named so the next pass finishes the probe rather than re-starting it.

**Why no detector can see this, and why it is worth a line.** Both copies are reachable and both are *correct today* — there is no failing state to detect. The cost is entirely deferred to the first person who tunes one. And this repo has a live, dated proof of exactly that cost: **F3 of THR-1378, promoted by this very run**, is this class one layer up — a doc-comment in `factionNetwork.ts` still asserting `EXPANSION_PROSPERITY_THRESHOLD = 0.6` while the constant has read `0.3` since THR-711 shipped on 2026-07-22. Six weeks undetected, found by a human review rather than a gate.

**Recorded, not filed** — the process throttle. For the retro, ranked: `SEA_LEVEL` earns a ticket on its own (crosses the engine/render boundary, and its comment already cites a dead authority); the trust triple and the two sphere maps are one repoint-the-imports change each; `OUTCOME_BAND_PROSE` is a separate dead-code question.

### Standing redundancy re-verified — `getAgentsAtLocation`, unrepaired

Yesterday's finding 6 stands. `src/engine/graphQueries.ts:23` and `src/engine/hexZoom.ts:40` both still export `getAgentsAtLocation` with semantically identical bodies, and both remain production-reachable — so no reachability sweep will ever flag it.

**Not asserted:** whether the caller split moved. A grep for files importing from `hexZoom` and naming the symbol returns four (`useHexZoomData.ts`, `hexActionBridge.ts`, `hexVignette.ts`, `surveyProseComposer.ts`) against yesterday's recorded two, but that grep counts *files mentioning the name*, which is looser than yesterday's per-call attribution and would double-count a file importing from both modules. The verified claim is narrower and sufficient: **both copies live, unrepaired, one week on.**

**Redundancy honest limit:** one new probe class plus one standing finding re-verified. **Not a clean bill across the map.** Yesterday's second item (`getLocationsInRegion`, zero production callers) is a dead-coverage question belonging to the weekly test-suite pass and was deliberately left alone.

### Stalled work

- **[THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) at 2 of 3 — the watch item, and a different shape from the last one.** Its `stateHistory` records two `Ready for Dev → In Dev` transitions (08-29 08:04Z, 08-30 06:01Z) with no `Done`, one short of `ORCH_STALLED_PICKUP_THRESHOLD`. It bounced `In Dev → Ready for Dev` at 17:15Z and `Ready for Dev → Todo` at **17:41:22Z today** — 48 seconds after this run's shelf scan read it. What distinguishes it from yesterday's closed watch: THR-1322 reached 2 with no attempted PRs and then closed cleanly, whereas THR-1349 carries **three attached PRs** ([#1724](https://github.com/christianspliid-ui/threadbare/pull/1724), [#1758](https://github.com/christianspliid-ui/threadbare/pull/1758), [#1760](https://github.com/christianspliid-ui/threadbare/pull/1760)) and is still not Done. Three attempts that did not close it is a stronger signal than the transition count alone. Consistent with 08-30b's finding 5, which recorded that its blocker had changed character from a build task to a design fork. **Carry to the next sweep.**
- **No hand-created `In Dev` ticket** (THR-1325 ruling). `In Dev` holds three — THR-1133, THR-1168, THR-1130 — all `Parked`, all unassigned. THR-1133 and THR-1168 had `updatedAt` move to 2026-09-01T17:30Z, so run b's inheritance-by-construction argument no longer covers them; **both `stateHistory` records were re-read in full this run** and both pass through `Ready for Dev` (THR-1133: `Ready for Dev` 08-16 → `In Dev` 08-22; THR-1168: `Idea` → `Ready for Dev` 08-17 → `In Dev` 08-18). Each is at **1** transition — parked by intent, not failed pickups.
- **Coverage gap, stated rather than papered over:** THR-1130's `stateHistory` was **not** re-read this run, and its `updatedAt` (2026-08-30T05:32Z) postdates run b's 04:26Z sweep — so strictly it is unverified today. Run b read it and found it clean; that is inheritance without the timestamp argument to back it. Next sweep should re-read it.
- **THR-1377** — 0 transitions, filed today. Not a signal.

### Queue hygiene — observed, not written

THR-1349 was sitting in `Ready for Dev` **assigned to Christian Spliid** when this run's first shelf scan read it at 17:40:34Z. It carries no `Parked` label and has three attached PRs — the signature of the known assignee-restore hazard (impediment #607: opening or merging a PR named for an issue repopulates a nulled assignee). It has since moved to `Todo`, so the queue-visibility consequence is already moot.

**Not repaired here, deliberately.** Clearing an assignee this lane did not set belongs to `stale-claim-sweep`'s queue-assignee pass; this lane does not write assignees, and the `Parked`-label convention that distinguishes a deliberate park from a stale claim is that sweep's to apply.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Tuesday**. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised here.

**But the Monday pass was missed.** 2026-08-31 *was* the `ORCH_TESTHEALTH_DOW` Monday and no orchestrator report exists for it (new finding 1), so no weekly pass ran — the sweep is now nine days stale against a seven-day cadence. Next due **Monday 2026-09-07**, with one item still queued for it from 08-30b: the `getLocationsInRegion` dead-coverage question.

## Escalations

**None posted, and none needed.** Agreed work is not exhausted — twelve candidates were examined and the constraint is design throughput, not the absence of direction — so the "stop and ask" clause did not fire. `ORCH_ESCALATION_CHANNEL` was not used.

**Parked this run, all routed rather than dropped:**

- Eight T1 declines needing a design decision (T1 table) — routed to T2, which was bound out; the two that read as direction calls rather than plan-doc gaps are surfaced to Christian directly.
- One design-staging candidate not staged (THR-1348) — `ORCH_MAX_IN_DESIGN` exceeded 3×.
- One detector unmeasured (`sweep:rank-reach`) — reported `unknown`, not carried forward as green.
- Two findings recorded rather than filed, per the process throttle: the no-op-gate / daily-duty coupling (evidence for THR-954, not a new ticket) and the duplicate-constant class.
- One verification gap named rather than assumed: THR-1130's `stateHistory`.
