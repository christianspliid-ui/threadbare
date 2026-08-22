---
lane: tb-orchestrator
run: 2026-08-22
promoted: 1
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-08-22 (run a, ~07:20Z)

## Needs Christian

**The game has not moved in three days, and it is waiting on you rather than on itself.** The last piece of work finished at 05:38 on Tuesday 19 August. Since then: nothing completed. The machine itself is fine — it went quiet overnight Thursday into Saturday and came back on its own this morning, and an agent picked up its first ticket again at 09:17. What it came back to is a shelf with nothing play-facing on it, because everything that could move next needs a decision from you first.

Six things wait on you. The first two are the ones that actually unblock work.

1. **One yes/no, now four days old.** [Should committing a hand of nudge cards carry about 1.6 seconds of held breath before you find out what happened?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) The sound is already built and sitting unused: a held inhale, a cello drone pulling taut while the moment hangs, then a struck note tinted to the reach the mortal used. Today you commit and the outcome is simply *there*. For: it is the beat where the dice are in the air. Against: 1.6 seconds on every commit, unskippable, and tense becomes waiting fast. **Yes** wires it to the encounter veil; **no** deletes it with the timings written down. Either answer closes the ticket. There is no right outcome to test against, which is why it is yours.

2. **One half-hour decision unlocks a batch of design work.** [Which parts of the game-state rework go first](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under). Every piece of research behind it is finished and closed. Your own map says answering this clears the last fog and triggers the carve-up into individual design sessions — which is exactly what an empty shelf needs. Still the highest-leverage half hour on the board, and unchanged since Wednesday.

3. **One design session would refill the shelf by itself.** [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — your note from 6 August: the action cards are too wordy, and playing one tells you nothing. It has been queued for design with the reading gathered for three days now, and it needs an attended chat session to write the plan. Two more are queued behind it and cannot start until it moves: [a one-button "something looks wrong here" capture](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) so you can hand a broken-looking run straight to an agent, and [making nations and named areas real](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) instead of only drawn.

4. **Two hands-on sessions, ready whenever you are.** [Try the anchor idea on a second surface](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) — a throwaway prototype you react to — and [the encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game), your ruling on prose, firing, UI and feel. Both blocked on nothing but your time.

5. **One encounter waiting on approval to be written.** [The Grateful Kin's return visit](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the) — the town owes the player a welcome, and a player can see it on the map, but nobody ever walks back in to collect it. Writing the scene needs a brief approved by you first, per your own Encounter Factory rule.

6. **One two-minute settings toggle, queued for an agent to write up first.** Finished tickets that carry a question for you keep going invisible, because opening a pull request quietly re-assigns them and they drop off this list. It has happened six times. The fix is a switch in Linear's GitHub settings that only you can flip — an agent will find the exact control and write it up before asking you, which is what I queued this run.

Nothing is on fire.

## T1 — unblock sweep

Scanned 20 `Todo` and 3 `Ready for Dev` (state-filtered; `orderBy:"priority"` not passed — it errors at runtime, impediment #49; sorted in memory). **Shelf depth at scan: 3, every one `Deferral`-labelled and `Low` — zero non-`Deferral` program work, third consecutive run in that state.** Promotion ceiling did not apply (3 < 15); 1 of `ORCH_PROMOTE_BATCH_MAX` 5 used.

**Promoted (1).**

- `[orchestrator] T1 promote THR-1190: no blocker ever named — the filing block (weekly-workflow-retro, 08-19T13:27Z) reads "Blocked by: nothing". Latest-comment check (THR-990) clean: zero comments existed at promotion, so no standing retire verdict. Plan-doc liveness (THR-921): check:plan-doc-liveness on Docs/plans/2026-04-13-linear-coordination-protocol.md → LIVE, resolves on origin/main. → Ready for Dev (project: Continuous Improvement). State verified by get_issue re-query — stateHistory shows Todo→Ready for Dev at 07:21:25Z and the assignee key is absent. Coordination block posted as the latest comment.`

This is process work, so it clears **Rule-0 materiality explicitly** rather than by category: impediments #607 (08-15) and #657 ×2 (08-18) are three instances of one failure inside a week, on top of #306 / #380 / #508; the quotable losses are THR-875's park cleared by hand ~35 min later, THR-1168's question invisible under `## Needs Christian` for ~47 min, and #657's full re-derivation of a settled finding; and the required cost/benefit line is present in the ticket — *"~10 minutes to write up plus a ~2-minute settings toggle … not fixing it costs ~30–45 minutes per recurrence … roughly 2 recurrences/week."* It was filed by `weekly-workflow-retro`, the single sanctioned promotion point for process work under the 2026-08-10 throttle, not self-spawned by a lane. It is the only promotion this run, honouring the throttle's one-process-item-per-run limit on a starved shelf.

**Declined (9), each naming its evidence.** Only the first two are new information; the rest are unchanged from 2026-08-19 run b and are the healthy steady state.

- `[orchestrator] T1 skip THR-1189 (new candidate, filed 08-19T05:17Z): wrong destination — the ticket's own text says wiring a toll into the economy "wants a design pass rather than an executor's judgement call", and it carries no coordination block. T2 input, and T2 is bound this run.`
- `[orchestrator] T1 skip THR-1024: unmet blocker — prose gate "do not start this before THR-966". THR-966 re-read live this run: still Idea, mount-vs-prune disposition still undecided.`
- `[orchestrator] T1 skip THR-1156: wrong destination — programme epic, and its own body states "no execution ticket files directly against it" until a map or per-seam plan docs exist. Its charter is THR-1157, which is T1.5's input.`
- `[orchestrator] T1 skip THR-1182: unmet gate — its own Blocked-by line reads "blocked in process on the ruling-2 brief approval", a Christian chat approval preceding authoring. Promoting parks the WIP=1 slot on a human gate. Surfaced under Needs Christian.`
- `[orchestrator] T1 skip THR-1134, THR-1155: wrong destination — both explicitly want a plan doc before code. T2 input, and T2 is bound this run.`
- `[orchestrator] T1 skip THR-1114: standing verdict — latest comment "Why this is Todo and not Ready for Dev" states an executor would have to invent a cosmology alignment. Carried from run b, not re-read this sweep.`
- `[orchestrator] T1 skip THR-1148: wrong destination — the ticket is itself a design question ("decide whether that is the design") and its own recommended option is already shipped. Carried.`
- `[orchestrator] T1 skip THR-175: unmet trigger — "intentionally deferred… not actively claimable"; named trigger unmet. Carried.`
- `[orchestrator] T1 skip THR-1157, THR-1163, THR-1162, THR-902, THR-907: wayfinder-labelled — decisions, not executor work; never enter Ready for Dev. Routed to T1.5.`

Skipped without assessment: THR-1043 and THR-791 (assigned to Christian), THR-870 (parked programme), THR-789 (programme epic).

**Throughput note — the constraint moved, and it is worth being precise about where.** Run b's diagnosis was that the executor consumes the shelf faster than T1 can supply it. That still holds in principle, but it is not what happened here: **nothing has completed since THR-1188 at 2026-08-19T05:38Z, ~74 hours ago.** The briefing lane published hourly through Thursday 20 August 21:57 local, then nothing until 09:15 this morning — a ~35-hour all-lane gap. Lane silence can be deliberate (token-limit pauses), and this run does not diagnose it beyond the dates. The executor is demonstrably alive again: it claimed THR-857 at 07:17:49Z, four minutes before this scan. What it has to work with is the problem, not whether it is running.

**Week's completion mix (product vs process), 2026-08-15 → 2026-08-22:** ~26 product against **1** process-infrastructure (THR-1058), 3 wayfinder decision tickets and 2 UL proposals. Strongly product-dominated; no process binge, and this run's single process promotion does not change that. **The headline finding stands and is upstream: the shelf holds no product work, and an empty shelf is fixed by design and by Christian, never by promoting more process work.**

## T1.5 — wayfinder sweep

Two open maps. **AFK tickets resolved: 0**, and again not through failure — both maps have burned down every research and agent-doable ticket, and what remains on each is exactly the human-in-the-loop half this lane must not touch. `ORCH_WAYFINDER_AFK_MAX` (2) was never approached. Third consecutive run in that state.

- `[orchestrator] T1.5 map THR-1157 "Typed game-state architecture — machinery + first wave": 7 children, 5 Done. Frontier 2, both HITL (THR-1163 wayfinder:grilling, THR-1162 wayfinder:prototype). Native blocking relations re-read live per candidate — THR-1163 blockedBy THR-1160 + THR-1158 (both Done), THR-1162 blockedBy THR-1159 (Done). Both genuinely unblocked. Surfaced under Needs Christian.`
- `[orchestrator] T1.5 map THR-902 "Encounter experience redesign — vertical slice": 8 children, 7 Done. Frontier 0 by the rule — the sole open child THR-907 (wayfinder:prototype) carries an assignee (Christian), which drops it from the frontier set. It is on his plate, not stalled. Surfaced under Needs Christian.`

Both maps remain blocked *entirely* on Christian, with zero agent-resolvable work left on either.

## T2 — design staging

**Trigger met, action bounded to zero.** Non-`Deferral` items in `Ready for Dev` at scan: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2.

`ORCH_MAX_IN_DESIGN` is 1 and the lane-staged slot is **occupied**: run b's predecessor staged THR-1002 at 2026-08-19T02:31Z. Nothing was staged this run. (`In Design` reads 2 in raw terms — THR-1002 plus THR-790, which is assigned to Christian and was never staged by this lane. The bound counts lane-staged items, so it stands at 1 of 1.)

**THR-1002 is now due its 48h re-surface** — staged ~77 hours ago and still unpicked. Per the skill it is re-surfaced, not re-staged: it is named again under Needs Christian, one item up the list, with the two candidates queued behind it made explicit so the cost of the bound is visible rather than implied.

Two High-priority design candidates went unstaged for the bound rather than on their merits, and are named so the deferral is not silent:

- **THR-1134** (shareable game-state snapshot) — Christian-requested, scope decisions already recorded in the ticket, no sequencing dependency. Strongest candidate the moment the slot frees.
- **THR-1155** (nations and named areas rendered, not simulated) — director direction, but sequenced *by* THR-1163's wave-1 call. Staging it would fork a decision Christian is slated to make. Judgement unchanged from run b.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 09:18 local). No sweep had run since 2026-08-19 run b (~04:26 local), so this diff spans **three days**, not one.

| Detector | Result | vs. 2026-08-19 run b |
|---|---|---|
| `generate-interface-map:dry` | 72 contracts — 50 LIVE, 14 UNVERIFIED-OK, 1 PARTIAL, **7 LEAKED**, 0 UNWIRED | **Identical**, count *and* membership. All 7 LEAKED rows are the same rows, same remediation tickets (THR-720, THR-997, THR-883 ×3, THR-1130, THR-800). No decay, no improvement |
| `check:process` | `passed-with-gaps: 1 warning` — `check:authoring-brief` stale vs `Docs/plans/2026-04-16-systemic-wiring-guide.md`; `check:design-wiki` OK (24 pages); `check:wiki-freshness` OK (24 pages, no stale); the three `:check` generators up to date | Stale authoring-brief unchanged. **Three sub-checks did not run** — finding 1 below |
| `check:canon-staleness` | **21 warnings** | Count unchanged. Row set read in full this run and recorded below, so next sweep can diff membership rather than only the count |
| `sweep:rank-reach` | **PASS** — seed 42, medium, 900 ticks. 60 rank-gated templates reachable, 0 blocked, 0 unowned; 13 apex holders at tick 900 | **Recovered.** Ran clean after two consecutive failures — see the correction below |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, and not reported as clean.**

### New finding 1 — three `check:process` sub-checks are structurally unmeasured in this lane

`check:process` reports honestly and this report has not been reading it:

```
[WARN] linear-auth global LINEAR_API_KEY is unset; skipped Linear-backed checks
       (recent plan references, orphan issues, Ready-for-Dev handoff keywords).
check:process passed-with-gaps: 1 warning(s). 3 sub-check(s) did not run.
```

`LINEAR_API_KEY` is unset in the scheduled environment, so **recent plan references, orphan issues, and Ready-for-Dev handoff keywords are unmeasured on every run of this lane** — and the third of those is directly load-bearing for T1, since it checks the exact handoff-comment shape a promotion must produce.

**This is under-reporting corrected, not new decay.** `scripts/check-process.ts` has no commits since 2026-08-18, so the `passed-with-gaps` line was already printing when run b recorded `check:process` sub-checks as green. Run b named six sub-checks and never mentioned these three. Same class as run b's own finding about the core lint inspecting nothing: the script's verdict was accurate and the report was not.

**Logged, not filed** (2026-08-10 process throttle — the weekly retro is the single promotion point). It does not clear the materiality bar alone: nothing has been lost, and the checks do run in CI where they are load-bearing. Recording it so the retro can decide whether this lane should carry a read-only key.

### Correction — `sweep:rank-reach` recovered; the carried failure pattern does **not** clear the bar

This section was first drafted calling the detector unavailable for a third consecutive sweep, on the evidence of ~7 minutes of empty output. That draft was wrong: the sweep completed shortly after and returned `VERDICT: PASS`. It is slow (~6 minutes to first output on this run), and the two prior sweeps were stopped at ~18 and ~20 minutes — long enough that the failure reading was reasonable, and still a reading, not a measurement.

So run b's standing prediction — that a third failure would make the pattern ticketable — **does not fire**. Two instances, not three, and the detector demonstrably works. Nothing is filed and nothing is handed to the retro on this. What *is* worth carrying forward is the operational note that this detector needs a patient timeout: a sweep that emits its header and then nothing for five-plus minutes is working, not hung, and killing it early manufactures a false failure — which is exactly what this report nearly recorded as a third data point.

Two standing caveats inside the passing result, neither new and both already ticketed, recorded so `PASS` is not read as broader than it is: `0 of 13 members are individual+spotlight`, so no member can reach `phaseAgentDecision` at all (THR-814), and the faction-template draw census shows `21 action instances, 0 of them drawn by a member of the owning faction`. The 60 gated templates are reachable *by rank*; the population that would draw them is off the decision loop. The verdict measures the first and not the second.

### New finding 2 — a carried redundancy finding does not survive contact

Run b carried three standing redundancy findings unverified. One was checked this run and **does not hold as stated**:

- **`composition-dsl` is not an isolated sub-island.** It has four production importers outside its own directory — `src/engine/phaseComposition.ts`, `src/engine/notableAgendas.ts`, `src/engine/rival.ts`, `src/components/Game/debug/CompositionView.tsx` — plus a type reference from `src/types/gameState.ts`. It is wired into a live tick phase. Whatever the original finding meant, "unreachable sub-island" is not it, and it should not be carried forward again in that form.
- **`SceneStatePanel` confirmed unreachable** — the only non-test file naming it is itself; no production importer. That is a **reachability** result (dead code), not a redundancy result, and is labelled as such. It is already covered by the standing prune candidate THR-951.
- **The `*IconGlyph` finding could not be resolved.** No file matches that name; the symbol appears inside five production files and one test, one of which (`AgentDetailPanel.tsx`) is the known dead-but-type-imported component from the skill's own trap list. **Not verified either way** — the carried finding names something that cannot be located from its own description.

### Redundancy pass

**Partially assessed, and the boundary is stated rather than blurred.** Three carried findings were re-read (above); no fresh end-to-end pass over `Docs/canon/interface-map.md` or `Docs/canon/systems-inventory.md` happened, so no *new* redundancy candidate was sought. Nothing here should be read as a clean redundancy sweep. The one genuine two-implementations-for-one-job case on the board — sublocations minted in two incompatible node shapes — is already filed as THR-1183 and sitting in Ready for Dev.

### Canon-staleness membership (recorded so the next sweep can diff rows, not just the count)

21 warnings across 9 canon pages: `attachments.md` (1), `cosmology.md` (2), `design-governance.md` (1), `encounters.md` (4), `engine.md` (1), `process.md` (5), `prose.md` (1), `rulebook.md` (3), plus 3 generated pages missing a `last_reviewed` frontmatter field (`interface-map.generated.md`, `setting-coverage.generated.md`, `systems-inventory.md`). The three generated-page rows are arguably a schema mismatch rather than staleness — a generated artifact has no human review date to carry — but that is an observation, not a diagnosis, and no change is proposed on it here.

### Stalled-work check

**Ran, and scoped honestly.** No issue is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3) `Ready for Dev → In Dev` transitions.

- THR-1130 — **2** transitions (08-15T21:03, 08-17T18:03), unchanged since run b and still the board maximum. Now carries an explicit `Parked` label, which protects it from the stale-claim sweep: a park, not a stall, and now legibly so.
- THR-857 — 1 transition, claimed 07:17:49Z this morning. Active work.
- THR-1168 — 1 transition. Parked unassigned with the unanswered question at the top of this report.

Not re-derived board-wide: run b measured the full board and found max 2, and the maximum can only rise through a new `Ready for Dev → In Dev` transition. Exactly two have occurred since (THR-857, and this run's promotion of THR-1190 which has not been claimed), both enumerated, so the carried maximum is sound without a fresh sweep.

### Weekly test-suite health

**Not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Saturday. Last pass: `Docs/ops/test-suite-health-2026-08-17.md`. Nothing about suite health is asserted here.

## Escalations

None raised. No question needed the Discord channel this run — every open decision is already a named Linear ticket surfaced under Needs Christian, which is the routing that exists for exactly that.

Nothing parked by this lane. The two T2 candidates held back by `ORCH_MAX_IN_DESIGN` (THR-1134, THR-1155) are named in the T2 section rather than parked silently, and the three-day work stoppage is recorded in T1 as an observation with its dates rather than escalated as a diagnosis this run cannot support.
