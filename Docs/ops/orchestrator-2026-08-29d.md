---
lane: tb-orchestrator
run: 2026-08-29d
promoted: 1
filed: 0
resolved: 1
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-08-29 (run d, ~04:30Z)

## Needs Christian

**The big one finished on its own overnight, and you do not have to do anything about it.**

The unified decision board — the piece of machinery that decides what every agent in the world does on a given tick — has been running in **shadow** for weeks: the old code decides, the new board scores the same choice alongside it, and the two are compared. It has been stuck there because a measurement kept failing on the second test world. Overnight the executor fixed the last thing pinning it, the measurement came back green on **both** worlds, and [the cutover job](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) went onto the work shelf this run. When it lands, the world starts running on the new board and a whole layer of scaffolding gets deleted.

**One honest caveat, since it is the kind of thing that gets overclaimed:** the measurement had already gone green *before* last night's fix, from other work landing in between. The fix was still real and still needed — it repaired a number that was secretly frozen — but it did not rescue the gate. The executor caught that and said so; I am repeating it so nobody later reads a rescue into it.

**A world fact worth knowing, not a decision to make.** The executor also measured something uncomfortable while finishing the trade-route investigation: **of twelve test worlds, exactly one can produce a trade route at all.** Merchant ambitions are held almost entirely by background characters, and only foreground characters get to act — so eight of the trade guild's actions, plus both of the legendary-crafting ones, have never once been reachable. Every measurement of the route economy we have taken has therefore been taken on the one world in twelve where it happens to work. [It is written up](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) with three possible readings, one of which is "this is correct and we should just say so out loud". I am **not** asking you to pick — it goes into the design queue behind the two frozen ones below. Flagging it because it changes what you should believe about the world, not because it needs you.

**Your three standing asks are unchanged, and unchanged in order.** Nothing below is new — same list as an hour ago, repeated because this is how it reaches you.

1. **Two frozen designs still block all new design work.** [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (**10 days** in the design column) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (**14 days**). While they sit, I cannot prepare another design, and three finished-and-ready plan-doc jobs queue behind them — [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46), [the calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56), [the undertaking factory](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66). Pick one up, or say "park it" and the column opens.

2. **[Approving the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)** unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)) — High priority, written, waiting on one yes or no. Still the biggest single lever on the content side.

3. **Three wayfinder maps wait entirely on you.** Every question an agent could answer alone is answered — re-proved directly again this run, not inherited.
   - **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten open, including [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands) and [how many faces defeat should wear](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum).
   - **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one left: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).
   - **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one left: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

   The two generator sketches are cheapest — you look at a list and react. Say "work the map" when you have an hour.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0. Blockers resolved: 1.**

Board at the sweep: **46 `Todo`** (`hasNextPage: false`), 45 after; **6 `Ready for Dev`** before, **7** after; **2 `In Design`**; **6 `In Dev`** (3 live claims, 3 `Parked`). The promotion ceiling did not bind — the shelf is at 7, far under the 15-item backed-up threshold.

### Promoted — the standing automatic promise fired exactly as written

**[THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking)** (Medium, `Deferral`, *Thematic Pressure & Living World*) — cut the unified decision board over to live.

**No judgement was made this run.** On 2026-08-27T21:31Z this lane added `blockedBy: THR-1302` as a native relation and recorded a commitment: *"this lane will promote this ticket automatically once THR-1302 reaches `Done`, with no further reading required."* The only work owed this run was checking that the condition actually landed. It did.

**Blocker state, verified natively.** `get_issue(includeRelations:true)` on THR-1301 returns `blockedBy: [THR-1302, THR-1297]`. Both are `Done`:

| Blocker | Cleared | Evidence |
|---|---|---|
| THR-1302 | 2026-08-29T03:42:44Z | merged as `2cd82074`, [PR #1719](https://github.com/christianspliid-ui/threadbare/pull/1719) |
| THR-1297 (doc 2) | 2026-08-27T21:14:07Z | historical; satisfied since |

**The gate that actually held it back is now green — and the reason it is green is not the reason the ticket says.** Four prior sweeps correctly declined this on its own Done-when #2 rather than on the blocker name: the 08-27T20:19Z census measured seed 99 at **8.3% against a 0.10 floor**. THR-1302's closeout re-ran the same instrument and reports **PASS on both seeds, 42 at 17.4% and 99 at 13.7%**, both inside `[0.10, 0.35]`.

But that closeout is also explicit that the census was **already green at its own pickup, before its change**: baseline 42 at 18.3%, 99 at 13.9%. Work landing between filing and pickup had moved it, and THR-1302's change moved the numbers slightly *down* (−0.9 / −0.2) as the honest cost of unpinning a frozen term. So the correct premise for THR-1301 is not "the sibling fix lifted the share over the floor" — it is "the envelope clears with room, and the open question is whether `shadow` → `live` is warranted now that it does." That distinction is carried into the promotion comment verbatim so the executor does not inherit a rescue narrative. (Logged on THR-1302 as impediment **#936** — a stale premise that moved in the *favourable* direction, which is the direction nobody re-checks.)

**Plan-doc liveness checked before promoting** (THR-921): `npm run check:plan-doc-liveness -- Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md` → `LIVE … resolves on origin/main`. §4 is readable from any fresh worktree.

**Latest-comment check** (THR-990): the newest comment was this lane's own 08-27T21:31Z sequencing record. Not a retire verdict — the opposite.

**Write verified by re-query** (impediment #48): `status: "Ready for Dev"`, **no `assignee` key present**, priority untouched at Medium, project intact, `stateHistory` shows the single `Todo → Ready for Dev` transition at 04:29:29Z.

**A coordination block was posted as the latest comment, and it mattered here for the same reason it did on THR-1302 an hour ago.** THR-1301 already carried a well-formed block — from 08-27T01:23Z, *below* two later comments. `pull-work` Step 3 validates the **latest** comment, so the block that existed was invisible to it and the ticket would have been refused at pickup. The new one carries the promotion evidence, the three coordination lines with mutex reasons inline, `Blocked by: nothing`, and the engine-pillar evidence shape. Three things were added that the old block did not have:

- **A caution the Done-when omits.** Done-when #2's census measures the board in `shadow`, where legacy still decides; Done-when #3 then re-keys idle to `BOARD_SCORE_FLOOR` and deletes the bridge, the clamp and the B/C contest blocks — all of which can move the mix. A *post-flip* re-run is the honest confirmation. If it does not survive, report it rather than turning a constant to rescue it.
- **THR-1348 added as a mutex.** It is brand new (filed 04:25Z) and its subject is `phaseAgentDecision`'s spotlight-tier aperture — the same function THR-1301 rewrites the decision block of.
- **THR-1302 removed as a mutex.** It is `Done` and merged; a stale mutex costs a future executor a needless bounce.

The standing instruction not to turn `UNDERTAKING_PAYOFF_SCALE` was carried forward unchanged. The stale title (*"blocked on undertaking `motivations` being authored"*) was deliberately **not** edited — the block says so and tells the executor to treat Done-when #1 as satisfied and verify rather than re-do it.

### Declined — one new candidate, and the standing set otherwise unmoved

**[THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)** (Medium, `Deferral`, filed 04:25Z at THR-1329's closeout, **no project**) — declined on **wrong destination**, routed to T2.

`blockedBy: []` — nothing gates it. It is declined on its own body, which states the fork explicitly: *"this is the fork, and it is not the executor's to settle."* Three readings are enumerated and the ticket itself calls them *"genuinely different games"*: the attention aperture is correct and the content is mis-tiered; the aperture is too narrow and background characters should carry strategic work off-screen; or it is correct as-is and the honest response is only to report it.

**This is deliberately not the reversal THR-1302 got an hour ago, and the difference is worth stating so the two are not confused.** Rule 4's test is whether there is an agreed outcome to test against. THR-1302 had three, written as its own Done-when, with a shipped instrument. THR-1348's first Done-when is *"a verdict is recorded on which of the three readings holds"* — a decision, not a measurement. Reading 2 has a measurable cost (it changes how much of the simulation runs per tick) but choosing *whether* the world's merchants get to build things off-screen is a question about what the game is, with no gate that can answer it. It goes to T2.

Its measured content is strong and is why it is surfaced to Christian as a world fact: 10 strategic templates unreachable on seed 99, the whole `merchant-expansion` family plus both `ambition_forge_legend` templates; at 150 ticks, 195 of ~722 actors eligible for the trade ambition and 3 pursuing it, none of them spotlight; **1 of 12 seeds route-capable**.

**The standing set, no member moved.** THR-1303 (gated on a post-cutover decision-mix floor, so it sits behind THR-1301 — it now has a one-hop path to promotion for the first time), THR-1222 (unmet chat-approval gate — ask 2 above), THR-1195 (standing verdict 2026-08-22), THR-1256 (time gate, opens 2026-09-08 — 10 days out), THR-1255 / THR-1218 (gated on content density), THR-1220 (HITL review session, never promotable — its own description forbids it), THR-870 (parked by creative-director sequencing), THR-1024 (unmet prose gate on THR-966, still `Idea`), THR-175 (unmet trigger gate, opens on a content event), the design-gated set routed to T2 (THR-1155, THR-1274, THR-1287, THR-1114, THR-1134, THR-1189, THR-1315, THR-1318), and the program epics. All 15 `wayfinder:*` items skipped unconditionally.

**Three process tickets declined on the throttle, named again so the weekly retro can find them.** [THR-1326](https://linear.app/threadbare/issue/THR-1326/fresh-worktree-node-modules-stub-find-the-producer-31-arrivalsweek-and) (node_modules stub, ~31 arrivals/week), [THR-1327](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is) (project-status renders 1 of 281 fragments), [THR-1328](https://linear.app/threadbare/issue/THR-1328/de-flake-the-three-named-closeout-tests-impediment-id-allocation-5s) (three flaky closeout tests). Unchanged: the weekly retro is the single promotion point for delivery-machinery work, and none of these is a loss corrupting work as it runs.

**Queue-block hygiene spot-check.** All 7 shelf items re-read for an assignee: **none carries one**. THR-1345's latest comment is a full coordination block (00:29Z run). No shelf item was found sitting refusable this sweep.

**One hygiene observation, not acted on.** THR-1329 and THR-1348 both carry **no project**, violating the no-orphans rule; THR-1348 is a deferral and should inherit its parent's project. That is `daily-backlog-grooming`'s remit, not this lane's — recorded so it is countable rather than fixed here.

## T1.5 — wayfinder sweep

Three open maps, membership unchanged, all three still **entirely HITL**.

| Map | Frontier | AFK resolved | HITL surfaced |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | **0 available** | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | **0 available** | THR-1232 (`prototype`) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | **0 available** | THR-1236 (`prototype`) |

**The zero was re-proved directly this run rather than inherited.** Two label sweeps returned **19 `wayfinder:research` and 3 `wayfinder:task`, all 22 `Done`** — so the empty AFK column means every agent-doable ticket these maps have ever carried is finished, not that the sweep failed to look. `ORCH_WAYFINDER_AFK_MAX` (2) did not bind; there was nothing to bind against.

Map membership was re-derived from this run's own state-filtered `Todo` sweep: all twelve children present, every one labelled `grilling` or `prototype`. The only issue whose state this run changed is THR-1301, which carries no `wayfinder:*` label, so membership cannot have grown.

Nothing claimed, nothing assigned, no guessed resolution posted.

## T2 — design authoring

**Trigger fires; barred by the `In Design` bound. Sixth consecutive run in this state.**

- **Shelf count: TRIGGERED.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` is **1** ([THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach)), unchanged by this run — THR-1301 carries the `Deferral` label. The standing measurement finding gains a seventh data point: **the label is a provenance marker, not a size or value marker**, and the trigger reads it as the latter. A ticket that cuts the world's entire agent-decision layer over to new machinery is not a clean-up chore. Stated, not acted on — the constant is not this lane's to change mid-run. Worth one line at the weekly retro.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (`startedAt` 2026-08-19, 10 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (`startedAt` 2026-08-15, 14 days). Both far past the 48h threshold and **re-surfaced, not re-staged**, per the rule.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — unchanged since run 08-28d. Runner-up unchanged: THR-1315.

**T2 queue composition — net flat, with one in and one out.** THR-1301 left by promotion; THR-1348 arrived. Eight design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315, THR-1318) plus THR-1348 as the ninth, the two parked in the column, three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300, all fully unblocked), and twelve wayfinder questions on fully-prepared maps.

**THR-1348 is the strongest new entrant this queue has had in days** and should be ranked accordingly whenever the column opens: it is the only one of the nine that arrives with a full measurement attached (12-seed sweep, template-level reachability counts, an eligible-vs-pursuing population split) rather than needing a survey before the design can start. Its Reading 2 also has a named precedent — THR-815 solved the identical shape faction-side by resolving work in `phaseFactionActions` rather than widening the decision loop — so the design session has somewhere to start.

**Product-vs-process ratio.** The single promotion this run was **product** (engine), so the one-process-ticket-per-three-runs budget went unspent again; the materiality bar was applied only to decline. Week to date holds at ≈70/30 product to process. **The headline is still not "feature pipeline needs supply"** — six promotions across four hours, all six product — but that remains the deferral pipeline paying out. Self-spawned deferrals buy hours; they cannot substitute for a prepared design indefinitely, and every remaining route from agreed work to a prepared design still runs through a person.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started **06:27 local**), and today's three earlier runs correctly declined it on the hour gate. Diffed against [`orchestrator-2026-08-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md), yesterday's sweep.

| Detector | Result | vs. 2026-08-28b |
|---|---|---|
| `generate-interface-map:dry` | **8 LEAKED**, 67 LIVE, 18 UNVERIFIED-OK, **95 contracts** (exit 0) | LEAKED **unchanged at 8, byte-identical membership.** Total 94 → 95, LIVE 65 → 67, UNVERIFIED 19 → 18 — **all three deltas fully attributed**, finding 3 |
| `check:canon-staleness` | **18 warnings** (exit 0) | **22 → 18 — the first decrease this tier has recorded.** Two-thirds is real repair; one-third is not a repair at all — findings 1 and 2 |
| `check:process` | exit 0. `check-design-wiki` OK; `check-wiki-freshness` OK; `check-guidance-freshness` OK (`mode=advisory`); four generators up to date; `check:authoring-brief` up to date | **Unchanged in every row.** Its `[WorldGen] Ocean fraction too low: 7.4%` incidental now fires a **fifth** consecutive day at the identical value — recurring, not new, not drifting |
| `sweep:rank-reach` | **See the status line below** | — |

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked from a headless scheduled context. **Not run, and not reported as clean.**

**`sweep:rank-reach` status: still executing at report-publication time, ~25 minutes in, with no output emitted.** It is recorded as **not measured this sweep**, not as passing. This is the same shape 08-28b hit (that run took ~40 minutes under sibling contention and was initially, correctly, recorded as unavailable). Carrying yesterday's PASS forward as today's result would be the exact pathology this tier exists to catch. If it lands before the next hourly run, that run diffs it; nothing here is inferred from its previous verdict.

### The eight LEAKED contracts, listed in full so tomorrow's diff stays real

`attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertaking-checkpoint-events` · `undertow-card-drifts-mortal-values`

Identical to yesterday's set, member for member. Six consecutive days at eight.

### New finding 1 — canon staleness fell 22 → 18, and two-thirds of the drop is genuine repair

**Five rows cleared because `Docs/canon/process.md` was actually rewritten and re-stamped.** Commit `a1b680e5` ("CLAUDE.md diet — gate law and sandbox lore move to canon/ops with pointers", the THR-1336 work) carries `last_reviewed: 2026-08-28`, which retires all five of yesterday's `process.md` rows at once: ← `linear-coordination-protocol`, ← `systemic-wiring-guide`, ← `user-review-interface`, ← `thr-842`, ← `wiring-checklist`. That is the single largest staleness repair this tier has seen, and it was a side-effect of doc-cleanup work rather than of anyone reading this report — worth saying, because it is evidence the count responds to real editing rather than only to detector noise.

**Three new rows arrived, all from one commit, and they are genuine.** `Docs/canon/encounters.md` (stamped 2026-08-25) is now stale against three of its declared sources — `2026-05-04-encounter-experience-design-plan.md`, `2026-05-04-encounter-experience-player-journey.md`, `2026-07-26-nudge-model-encounter-system.md` — all three edited in commit `8b89df98` ("R2 plan-doc supersession markers"), context-cleanup round 2. The identical mtimes look like a checkout artifact and are not: one commit touched all three.

**The mechanism 08-28b named is now confirmed on a third pair.** Yesterday's reading was *"every active program re-stales the same two guides, which is why this list never shrinks on its own."* Today it shrank — and the thing that shrank it and the thing that grew it are **the same program**. Context-cleanup round 2 re-stamped one canon page and re-staled another in the same wave. So the honest generalisation is not "programs only add staleness"; it is that a doc program moves this count in both directions and the net is uninformative without attribution.

Today's full 18, published so tomorrow's diff is a real one: `attachments.md` ← systemic-wiring-guide · `consumption-ledger.generated.md` (missing `last_reviewed`) · `cosmology.md` ← archetype-virtue-vice · `cosmology.md` ← sphere-governed-ascendant · `design-governance.md` ← linear-coordination-protocol · `design-governance.md` ← wiring-checklist · `encounters.md` ← systemic-wiring-guide · `encounters.md` ← encounter-experience-design-plan **(new)** · `encounters.md` ← encounter-experience-player-journey **(new)** · `encounters.md` ← nudge-model **(new)** · `engine.md` ← systemic-wiring-guide · `interface-map.generated.md` (missing) · `prose.md` ← systemic-wiring-guide · `rulebook.md` ← encounter-experience-design-plan · `rulebook.md` ← nudge-model · `rulebook.md` ← thr-1206-reputation · `setting-coverage.generated.md` (missing) · `systems-inventory.md` (missing).

The known-benign floor is unchanged at 4 generated files with no meaningful `last_reviewed`.

### New finding 2 — this detector keys on filesystem mtime, so its membership is not stable across a day and cannot carry a diff

Two rows on yesterday's list are gone today **with no review having happened**, and that is not a repair — it is the measurement moving under us.

`rulebook.md` ← `2026-07-23-party-formation-group-mechanics.md` and `rulebook.md` ← `2026-07-30-thr-868-meet-the-first-nudge-conversion.md` were both on 08-28b's published list of 22. Today:

- `Docs/canon/rulebook.md` still reads `last_reviewed: 2026-08-19` — **unchanged**. Nobody reviewed it.
- Both source files still exist and are **still declared as sources** on that page (lines 269 and 408).
- Both now carry mtimes that *predate* the stamp: `2026-07-23T19:49:06Z` and `2026-07-30T14:50:03Z`, each matching its own last commit date.

So on 2026-08-28 those two files must have carried mtimes later than 2026-08-19, and they no longer do. mtime does not travel backwards on its own — something restored them to their committed values between the two sweeps (a worktree operation is the obvious candidate; this box holds ~180 of them).

**Why this matters more than two rows.** The detector's comparison is `plan mtime > canon last_reviewed`, and mtime is a property of *this checkout*, not of the repository. That means its output is not reproducible across machines, is not reproducible across checkouts on the same machine, and **can move in the favourable direction without anything being fixed**. 08-28b brushed against this — it caught two `wiring-checklist` rows that *looked* new and were not — but treated it as an attribution nuisance to work around. Today's instance is the stronger form: rows silently *leaving*, which is the direction nobody audits. It is the same shape as impediment #936, logged on THR-1302 four hours ago: a number that improved for a reason unrelated to the work.

**Not filed** — the process-work throttle bars scheduled lanes from filing infrastructure tickets, and the weekly retro is the single promotion point. Recorded for that batch with the attribution attached. The cheap remediation, for whoever picks it up: compare against `git log -1 --format=%ct` for the source rather than `stat` mtime, which makes the check reproducible and removes both failure directions at once.

### Finding 3 — the interface-map deltas, all three attributed

Nothing here is decay; it is recorded because "LIVE moved and the total moved" is exactly the shape that gets read as drift on a later skim.

- **Total 94 → 95.** One contract added: **`hunger-resonance-weighs-the-meeting-deal`**, by commit `a54bfb22` (THR-1213 slice 2, "the Hunger you chose finally decides what the meeting asks of your First"). Verified by diffing the contract-name list at `35de802c` (yesterday's sweep tip) against `ee2bad8b`: exactly one addition, no removals. It lands LIVE.
- **UNVERIFIED-OK 19 → 18, LIVE 65 → 67.** The +1 total accounts for one LIVE gain; the other is a genuine **promotion** — commit `00f6ccc2` (THR-1321) added a `verifiedLive` block to the undertaking mint-valve row. That promotion is the strong form and deserves naming: it is a **controlled arm**, `origin/main` → 0 actors born through the valve, post-fix → 42, each carrying `mintedForProjectId` and a real placement, across two distinct feeding templates. Its own note says the row would otherwise have read LIVE off symbol presence while no mortal had ever been born through it. That is the downgrade-only rule doing exactly its job.
- **Counting method unchanged from 08-28b** — unique `^### \`name\` — badge` headings, not raw badge occurrences. The two sweeps are like-for-like.

### Redundancy pass — assessed, and the largest one in the engine just got an unblocked exit

**The judgement pass was done.** Probed area: the agent-decision scoring path, chosen because it is what this run's promotion touches and because it is where a duplicate would be most expensive.

**It found a real one, and it is textbook D7.** `UNIFIED_DECISION_BOARD_MODE` is `'shadow'` (`src/data/strategic-action-constants.ts:309`), which means **two complete scoring implementations run on every agent decision, every tick**: the legacy path decides, and the unified board scores the same choice alongside it purely to emit a `decision_board_comparison` trace (`phaseAgentDecision.ts:778-860`). Both are reachable — that is the definition of the shape no reachability sweep can flag. The duplication also has three pieces of dedicated scaffolding keeping it honest: `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` (a commensurability constant), the clamp at `strategicActionScoring.ts:82`, and `decisionBoardModeGuard.ts`, a whole module whose only job is to warn if the mode is set to `'live'` before the live branch exists.

**It is deliberate, owned, and — as of this run — no longer indefinite.** This is a measured cutover, not an accident, and the ticket that deletes every piece of it is [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking), which this run promoted. So the finding is not "here is an unowned duplicate" but the more useful "the biggest known duplicate in the engine has had a blocked retirement path for weeks, and it is unblocked as of 03:42Z today." Worth tracking to completion: while it stands, the shadow board is pure telemetry cost on every agent every tick.

**A second confirmed redundancy, already owned, not re-derived:** two `getFactionDefinition` implementations — `src/engine/factionNetwork.ts` (dynamic-aware) and `src/data/faction-definition-lookup.ts` (module-eval static map). THR-1322 names it and is In Dev with [PR #1714](https://github.com/christianspliid-ui/threadbare/pull/1714) attached.

**The honest limit:** two areas probed, not a clean bill across the map. Yesterday's finding (attention-tier vs `isFollowedAgent`, routed to THR-1299) stands and was not re-derived.

### Stalled work

**No stall at threshold, and one worth watching.** `In Dev` holds 6 — three live claims, three `Parked`, the sanctioned shape. Every one of the three live claims passed through `Ready for Dev`; **no hand-created `In Dev` ticket** exists this sweep.

* **[THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui)** — `stateHistory` read in full: **2** `Ready for Dev → In Dev` transitions, no terminal `Done`. One short of `ORCH_STALLED_PICKUP_THRESHOLD` (3). Its history is a genuine bounce pattern rather than a long single claim: claimed 14:06Z, released two minutes later at 14:08Z, demoted to `Todo` at 15:08Z, re-promoted 18:35Z, re-claimed 22:02Z and live since (6.5h) with a PR attached. **Not stalled — but one more release trips the threshold, and it is the only issue on the board anywhere near it.** Flagged now so the next sweep has a baseline rather than discovering it at 3.
* THR-1344 (PR #1717 attached, 3.5h), THR-1329 (claimed 04:03Z, 25 min) — 1 transition each, both shipping.
* THR-1130, THR-1133, THR-1168 — `Parked`. THR-1130's standing verdict is unchanged for the sixth day: at exactly 3 transitions, but a `Parked` batch-cadence umbrella whose batches ship under their own tickets. Repeated pickup is its designed shape, not repeated failure.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Saturday**. Deliberately not reported from Monday's result — [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops` and stands unchanged.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted* — asking rather than falling through to un-agreed work. That threshold did not move closer: the shelf is at seven, and the T2 queue holds nine design calls, three plan-doc sessions and twelve wayfinder questions, all agreed.

One item is deliberately **not** an escalation. THR-1348 asks a question this lane may not answer — whether background characters should be able to build things off-screen — but it is not blocking anything today, so it enters the T2 queue rather than interrupting Christian on Discord. Its measured content reaches him as a world fact under `## Needs Christian`, framed as information rather than a decision request, which is where a fork with no deadline belongs.

The one standing constraint — that every remaining route from agreed work to a prepared design runs through a person — sits under `## Needs Christian` as a decision already on his list.
