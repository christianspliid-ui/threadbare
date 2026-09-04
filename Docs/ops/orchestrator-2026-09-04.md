---
lane: tb-orchestrator
run: 2026-09-04
promoted: 0
filed: 1
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-04 (run a, ~05:44–05:58Z)

**Two things this run found that four previous sweeps had been carrying wrong.** A ticket declined as blocked for a week is not blocked — its work shipped under a different id on 2026-09-02, and every sweep since has re-declined it on a reason that stopped being true. And the wayfinder map Christian charted on Wednesday has **two open questions, not five**: the other three sit behind native blockers nobody had read, and a fourth was answered on Wednesday evening.

The daily architecture sweep also ran, all four detectors completing, and it produced the first **redundancy** result this tier has offered in three days rather than the "not assessed" it is honest about defaulting to.

## Needs Christian

**Two asks, and one piece of good news that makes your afternoon shorter.**

**1. Retrofit Batch 2 — still the only lever that puts new *content* in the queue.** Unchanged from yesterday and not re-argued: [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) is the seven camp-and-devotion encounters — shrines, resting, the quiet moments between fights. It waits on nothing except your yes to [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). Everything the machine shipped this week has been plumbing; this is the one queued item that would be something you can *play*.

**2. Traits wave 2 — one word, and it is now the only thing stopping design work entirely.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has been in the design column **20 days**, assigned to you. Because it is assigned, the machine keeps holding a slot open rather than quietly setting aside something you might be about to start — and there is only one slot.

> **Are you still planning to design Traits wave 2 soon?** If yes, nothing to do. If not, say so and it gets set aside.

This matters more today than yesterday: the build queue is down to its floor and the design tier that would refill it is barred by this one item.

**3. Good news — your new map went from five questions to two.** [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map). You answered [which open cells are wanted](https://linear.app/threadbare/issue/THR-1397/which-open-cells-are-wanted-yield-and-leverage-ownership-of-people) on Wednesday evening. Of the four that were left, **two turned out to be waiting on the other two** — so they were never yours to answer yet. What is actually open:

- [**The division rule**](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) — should a mortal's possible works be *derived* (what your ambition is picks the verbs, what you are good at picks the things) instead of hand-listed per ambition? **This is the one to do first: four other questions open the moment it is answered.**
- [**The untouched-by-design list**](https://linear.app/threadbare/issue/THR-1401/the-untouched-by-design-list-which-systems-mortals-never-move-by-their) — which parts of the world mortals *should* never touch by their own work (the doom clock, the rival gods' schemes) versus which are simply missing a hand. This one became answerable overnight; the research it waited on is finished.

Say *"work the map"* when you have the appetite. **No rush from this lane** — but if you only have twenty minutes, the division rule is worth four times what anything else on the board is.

**Not re-listed, deliberately:** the eleven fight-design questions on the Physical Conflict map and the one item-generator sketch. Standing shelf, static for nine days.

## T1 — unblock sweep

**Promoted: 0. Filed: 1. Held: 1.** Board at the sweep: **50 `Todo`** (page 1; `hasNextPage:true`), **2 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`**. Neither ceiling bound — `ORCH_PROMOTE_BATCH_MAX` is 5 and a shelf of 2 is nowhere near the 15-item backed-up threshold.

**The executor is live.** [THR-1391](https://linear.app/threadbare/issue/THR-1391/ul-proposal-covet-rivalry-a-hostile-to-the-world-writes-from-coveting) was `Ready for Dev` when this run's first scan read the board at ~05:46Z and `In Dev` at 05:52:12Z, six minutes later — a claim taken mid-sweep. Recorded because it is what dropped the shelf to 1 and made this run's filing load-bearing rather than optional.

### The finding — THR-1301's work shipped on 2026-09-02 and four sweeps have declined it on a dead reason

[THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) has been declined as *"gated behind the cutover"* in every sweep since 2026-08-29, each one inheriting the line from the last. **The cutover happened.** [THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-cutover-re-derive-the-census-gates-on-what-the) reached `Done` at 2026-09-02T19:16:58Z, and its slice 3 is titled *"the board decides — contest B, its bridge and its clamp go with the flip"* ([PR #1781](https://github.com/christianspliid-ui/threadbare/pull/1781)) — verbatim THR-1301's Done-when #3.

**Verified against the tree at `d8861ca6`, not inferred from ticket state:**

```
src/data/strategic-action-constants.ts:462
  export const UNIFIED_DECISION_BOARD_MODE: UnifiedDecisionBoardMode = 'live';
src/engine/__tests__/decisionBoardLiveness.test.ts:117
  expect(UNIFIED_DECISION_BOARD_MODE).toBe('live');
grep -rn 'STRATEGIC_ENCOUNTER_SCORE_BRIDGE' src/   → 5 hits, all prose comments recording
                                                     the deletion; no declaration, no read
ls src/engine/decisionBoardModeGuard.ts            → No such file or directory
```

All four of its Done-whens are satisfied. **Nothing is left to implement**, and its title is stale twice over. [Full evidence posted to the ticket](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) so no fifth sweep re-derives it.

**Not promoted** — promoting a ticket with no remaining work spends a top-of-queue slot to buy a bounce, which is the THR-990 failure this lane exists not to repeat. **Not closed either**: this lane may not set `Done` outside the `wayfinder:*` carve-out, deliberately, because closing on inference is the shape that lets a lane write over live work.

### Held — THR-1303, and this is the first time the unclosable-ticket gap has cost a promotion

[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) (delete control upkeep) carries `blockedBy: THR-1301`, and its own Done-when #1 reads *"THR-1301 merged and the board deciding in `'live'`"*. **The board is deciding in `'live'`** — so the gate this ticket was waiting to become measurable is measurable today, and its self-describing arm (*"below either bar the deletion waits again and says so"*) means a pickup is productive whichever way the census lands.

It is **held, not declined**: the substantive condition is met and only the blocker's *state field* is not. The promotion rule is that every named blocker resolves to `Done` before a promotion, and this lane does not rewrite a relation to unblock its own promotion. **It promotes automatically on the sweep after THR-1301 reaches `Done`**, and nothing further is owed here.

**THR-1301 is the third satisfied-upstream ticket in three days that no lane can close** (after THR-1380 and one before it). The first two were cosmetic. This one holds a Medium engine ticket out of an at-floor queue, which converts a bookkeeping gap into a measurable throughput cost — flagged for the retro rather than filed, per the 2026-08-10 throttle.

### Filed — THR-1409, from the T3 redundancy pass

[**THR-1409**](https://linear.app/threadbare/issue/THR-1409/three-worldgen-constants-are-declared-twice-with-different-values-the) — *Three worldgen constants are declared twice with different values.* Full evidence in the T3 section below. The three writes ran in the order THR-845 requires, and the null assignee was **verified by absence of the key on a `get_issue` re-query** — not off the create response, which omits it while the issue is in fact assigned:

```
[orchestrator] T1 file THR-1409: create → Ready for Dev (project Thematic Pressure & Living World)
[orchestrator] T1 file THR-1409: save_issue(assignee:null) → get_issue: no assignee key present ✅
[orchestrator] T1 file THR-1409: coordination block posted — sonnet advisory; parallel-safe with
               THR-1407 and THR-1391; mutex: none open (whole RfD + In Dev slice checked)
[orchestrator] T1 shelf 1 → 2; ceiling not reached (max 5, backed-up threshold 15)
```

Its `stateHistory` begins at `Ready for Dev` — the sanctioned direct-file path, **not** the THR-1325 hand-created-`In Dev` shape. Noted so a later T3 sweep reading that history does not mis-file it.

**Other declines, unchanged and not re-argued** — each stands on the reason recorded in the 2026-09-03 sweeps: THR-1222 (Christian's chat approval of the batch-2 brief, a state gate rather than a ticket), THR-1380 (satisfied upstream, wants a `Done` this lane may not set), THR-1381 / THR-1134 / THR-1155 / THR-1348 (all four need a design verdict before implementation → T2's input, not T1's), THR-1287 (waits behind THR-1303's deletion by that ticket's own Done-when #4), THR-1256 (time gate — review on/after 2026-09-08, four days out), THR-1024 / THR-1114 / THR-1189 / THR-1195. **16 `wayfinder:*` items** skipped unconditionally → T1.5.

**Week's product-vs-process ratio.** One filing, **product**: a defect in the game's terrain tuning surface, not delivery machinery. **No process or infrastructure ticket was filed or promoted this run.** The headline finding is unchanged from yesterday and the filing does not soften it: *the queue has motion, and still nothing in it is new content or new play.* THR-1222 remains the only lever that changes that, and it is one word from Christian.

## T1.5 — wayfinder sweep

**Four open maps. Frontier 15, of which 14 are HITL. Nothing burned down — and the interesting result is that the frontier is smaller than it has been reported.**

| Map | Frontier | Composition |
|---|---|---|
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | **3** (was reported 6) | 2 `grilling`, 1 `task` |
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 | 6 `grilling`, 4 `prototype` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

### The THR-1396 frontier is 3, not 6 — the correction run b predicted

Run b's own caveat was explicit: *"native-relation blocking was verified only on the two `wayfinder:task` candidates… the HITL counts could be one or two high if an unread relation blocks one of them."* **It was three high.** This run read `includeRelations` on every open child of THR-1396 rather than the two tasks, and the map turns out to be a chain, not a fan:

```
THR-1398 (grilling, division rule)  →  THR-1399 (prototype)  →  THR-1404 (grilling)
                                                              →  THR-1402 (prototype)  →  THR-1403 (task)
THR-1400 (research)  →  THR-1401 (grilling)      [THR-1400 Done 2026-09-03T16:10Z]
THR-1397 (grilling)  →  THR-1402                 [THR-1397 Done 2026-09-03T19:32Z]
THR-1405 (task)      →  unblocked
```

So **four of the seven open children are blocked**, and one of the two blockers cleared on Wednesday evening — **after run b was written** (19:26–19:35Z; THR-1397 closed at 19:32:34Z), which is why that run could not have seen it. Frontier: THR-1398, THR-1401, THR-1405.

**Consequences worth stating plainly, because they change what Christian is asked for:** two HITL questions instead of five, and one of them — the division rule, THR-1398 — is the **head of the chain**, unblocking four tickets the moment it resolves. That is the sequencing this tier exists to produce, and it was invisible while the frontier was computed from labels rather than relations.

### No AFK burn-down was available, and the reason is the same as yesterday's

**THR-1405 remains the only frontier `wayfinder:task` on any map**, and it is deliberately left open rather than resolved: its agent-doable research half was discharged by run a yesterday, and its code half was routed to the executor queue as [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap). What remains on it is the third generated grid view, which rides on THR-1407 and is code this lane does not ship. Re-opening that judgement would be re-litigating a call made correctly one day ago.

**No `grilling` or `prototype` ticket was touched, and no claim was taken.** No map's Decisions-so-far was amended — nothing resolved this run.

**Membership for the other three maps** was re-derived from this run's `Todo` slice and matches run b exactly (Physical Conflict 10, Item Generator 1, Powers 0). **Their relations were not re-read**, so the same caveat run b raised now applies only to them: those counts could be high if an unread relation blocks one. Given the THR-1396 result — three of six — that is no longer a theoretical caveat, and re-reading the Physical Conflict relations is the obvious next sweep's cheap win.

## T2 — design staging

**Not triggered, and it would have been barred had it been.** Both readings, because the shelf moved twice during the run:

- **At scan time**: 2 non-`Deferral` items (THR-1391, THR-1407) → not fewer than `ORCH_PROGRAM_WORK_FLOOR` (2) → not triggered.
- **Mid-run**, after THR-1391 was claimed at 05:52Z: **1** → triggered.
- **After T1's filing**: 2 (THR-1407, THR-1409) → not triggered.

The last is the reading that governs — T1 runs first precisely so its output is the remedy for a thin shelf. But the middle reading is the one worth recording: **the shelf held at floor only because this run filed into it.**

**Either way the bound binds.** `In Design` re-measured against the shipped `classifyInDesignItem` predicate — newest comment or state transition, not `updatedAt`, since a bulk relation-write stamped both at `2026-09-03T07:19:42Z` and that is not activity:

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **16 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **20 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1 and the column reads **1 live**, so the tier had no room regardless of trigger. THR-790 is **re-surfaced, not re-staged** (20 days against a 48h re-surface rule) as `## Needs Christian` item 2. **No mutation was made** — excluding an item from a count is not a state change, and applying `Parked` is Christian's call and the grooming lane's remit.

**This is the third consecutive day the design tier has been barred by one 20-day assigned item while the build shelf sits at its floor.** The predicate change from THR-1382 works exactly as designed on the *unassigned* arm — THR-1002 is correctly excluded. The assigned arm is doing what it was written to do too, and the cost of that correctness is now visible rather than theoretical.

## T3 — architecture health

**Due and run.** No sweep for 2026-09-04 exists on `origin/ops`; the last is [`orchestrator-2026-09-03b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-03b.md), and T3 last actually ran in [run a of 2026-09-03](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-03.md) at ~18:26Z. Diffed against that. **All four detectors completed.**

| Detector | Result | vs. 2026-09-03 run a |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, 101 contracts (exit 0) | **Unchanged** — same seven, same total |
| `check:process` | exit 0; all four generators up to date | **Unchanged** — still clean |
| `check:canon-staleness` | **26 warnings** (exit 0) | **Unchanged** — count *and* membership |
| `sweep:rank-reach` | **`PASS`** — 60 reachable, 0 blocked, 0 unowned; 16 apex holders at tick 900 | Verdict and apex count **identical** |

`__DEBUG.validateTraitRefs()` is browser-only and **cannot be invoked headless. Not run, and not reported as clean.**

**No detector was piped or truncated.** Yesterday's sweep recorded a near-miss where `tail -30` swallowed every LEAKED row and would have reported a false zero; both counts here come from unpiped output with the badge-summary table read directly.

**Zero new detector findings, and that is a real result rather than an empty one.** The seven LEAKED contracts are the same seven, each carrying its remediation ticket: `attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertow-card-drifts-mortal-values`. The 26 canon rows are the same 26, including the **`Docs/canon/world-objects.md` missing `last_reviewed`** stamp that yesterday's sweep raised — **still open, still one frontmatter line**, and still structurally exempt from the staleness check it most needs. `rank-reach` moved only in figures that were flagged as noise last sweep (memberships 308, member-work cost 0.229 ms/pass — well inside NFP #7; faction draw census 22, still `0 drawn by a member of the owning faction`).

### Redundancy — assessed this sweep, for the first time in three days

Both standing redundancy findings were re-verified rather than carried. **They came out opposite ways.**

**Finding 1 (new, and the reason THR-1409 exists): three worldgen constants are declared twice, with different values in each copy, and the tuning panel shows the copy the generator does not read.**

| constant | `src/engine/terrainPipeline/types.ts` | `src/engine/worldGenData.ts` |
|---|---|---|
| `RIVER_MIN_LENGTH` | `5` | `4` |
| `LAKE_SIZE_MAX` | `6` | `5` |
| `GREAT_LAKE_SIZE_MAX` | `15` | `12` |

The consumers are disjoint, which is why this never surfaced as a conflict. The generators read `worldGenData.ts` — `lakeGeneration.ts:3-8` (used at `:72`, `:111`) and `riverGeneration.ts:6-14` (used at `:217`, `:332`) — so **the world is generated with 4 / 5 / 12**. The CMS tuning panel imports `terrainPipeline/types` at `tunableConstants.ts:27` and renders it at `:1053` / `:1057` / `:1061`, so **the panel displays 5 / 6 / 15**.

This was carried as a standing finding since 2026-09-02 and described only as "three duplicated constants". **Measuring it made it worse than the description**: the copies do not merely duplicate, they disagree. It is a direct **NFP #1** failure of the sharpest kind — the panel a designer opens to change a number is wired to a copy nothing reads, so the change is absorbed silently and the displayed numbers are not the numbers in force. Filed as [THR-1409](https://linear.app/threadbare/issue/THR-1409/three-worldgen-constants-are-declared-twice-with-different-values-the) with the import chain attached, per the tier's guardrail that a finding becomes a ticket with evidence and an executor does the change.

**Finding 2 (new, good direction): the shadow-board double scorer is resolved — the two scorers are one pipeline now.** The standing finding was that `scoreStrategicCandidates` and the unified board were two implementations ranking the same candidates. Under the live board they are not: `decisionBoard.ts:510-511` reads `candidate.scoreComponents.varietyPenalty` from the legacy scorer and converts it through `computeBoardVarietyMultiplier`, and `:531` uses the legacy scorer's `candidateIndex` as the deterministic tie-break. So the legacy scorer is a live **component producer** feeding the board's currency, exactly as plan §4 promised and THR-1349 delivered — not a parallel currency. Its composite `finalScore` is now trace-only (`phaseAgentDecision.ts` board-trace summary), which is a leftover rather than a defect and is **not** filed.

**A tier that only ever reports decay is complaining, not measuring.** Recording the retirement is what makes the other finding worth believing.

### Stalled work, `In Design`, and hand-created `In Dev`

**No issue meets `ORCH_STALLED_PICKUP_THRESHOLD`** (3 `Ready for Dev → In Dev` transitions with no `Done`). THR-1349's three transitions terminated in `Done` on 2026-09-02; THR-1301's single one terminated in the `Todo` park recorded above.

`In Design: 1 live, 1 excluded (THR-1002 unassigned 16d → excluded; THR-790 assigned Christian 20d → warned, still counted).`

**Hand-created `In Dev` (never in `Ready for Dev`): none.** The `In Dev` slice is three, down from four: THR-1391 (**live claim**, taken 05:52:12Z, properly promoted first), THR-1392 (`Parked`, assigned Christian), THR-1133 (`Parked`, unassigned). THR-1130 and THR-1168 have left the column since yesterday's sweep. **Explicitly not a defect** — one live claim against WIP=1 with the other two carrying the sanctioned `Parked` shape is the healthy reading.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday.

## Escalations

- **Nothing asked on Discord.** The trigger is *agreed work exhausted*; it is not — the shelf holds two items and the next pickup has work whichever it takes. The standing escalation condition (idle executor, zero shelf, neither Christian ask answered) remains live for a future run.
- **THR-1301 needs a `Done` this lane may not set, and it is now costing a promotion.** Three satisfied-upstream tickets in three days with no lane able to close them; this is the first one whose open state holds a ready ticket (THR-1303) out of an at-floor queue. **For the retro**, with a cost line: closing these is currently nobody's job, the backlog is +1/day, and the first measurable cost arrived today.
- **For the retro, logged not filed** (2026-08-10 throttle): the wayfinder frontier has been computed from labels rather than native relations on three maps, and on the one map where relations were read this run the frontier was **half** what was reported. The cost is Christian's attention — he was pointed at five questions on Wednesday when two were answerable. The fix is one `includeRelations` read per frontier candidate, which T1.5 step 2 already specifies and which no run has done for the Physical Conflict map's ten.
- **Carried unchanged:** `Docs/canon/world-objects.md`'s missing `last_reviewed` stamp (one line, open since yesterday); UL-proposals still express their real dependency as prose while `relations.blockedBy` stays empty.
