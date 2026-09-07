---
lane: tb-orchestrator
run: 2026-09-07h
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-07 (run h, ~07:27–07:40Z)

**This run found the lane's own blind spot.** Seven runs today scanned `Todo` and `Ready for Dev` and reported the board exhausted. T1's remit covers **`Todo` *and* `Idea`** — and no run today had read the `Idea` column, which holds **71 issues**. This run read it. It did not yield a promotion, but it did yield a ticket that has been finished for three weeks and never closed, and the one item on the whole board that is buildable today for the price of a one-word answer.

## Needs Christian

**The lead ask has not changed, and I am not going to re-argue it.** [The retrofit batch](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) is still waiting on your go-ahead for the [4 September batch brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md). *"Batch 2, run the six"* is six encounters of content work on the build queue the same hour. It remains the biggest thing one answer from you can move.

**One new thing, and it is deliberately not a competitor to that.** It is a different kind of question — a spending one, and it takes a yes or a no:

- **[Regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) for the Meet The First encounter.** Five of the pictures in that scene's library are unusable and are already switched off — one has old UI buttons painted into the art, two have titles baked into the picture, two show individual faces close up, which the art rules forbid. Nothing is broken right now; substitutes are standing in. What it costs is **image-generation credits for five pictures plus retries**, which is why nobody has run it. The ticket has said *"worth confirming with Christian first"* since July and nobody has asked you. I am asking. **Yes or no.**

To be straight about the sizes: the batch is six encounters, this is five pictures. If you only answer one thing this morning, answer the batch.

**Wayfinder questions unchanged and not restated.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **53 `Todo`**, **71 `Idea`**, **0 `Ready for Dev`**, **2 `In Dev`** — both carrying `Parked`, so **zero live**. The executor's WIP=1 slot is free with nothing to put in it, for the **fourth consecutive run**.

### Finding 1 — T1 has never scanned the `Idea` column

The lane's own procedure says *"for each `Todo` / `Idea` candidate"*, and its decline taxonomy is written to apply to both. **The scan step names only two calls, and neither is `Idea`.** So the tier has been reading roughly 43% of its candidate pool and reporting the rest of the board exhausted.

Grep across all seven of today's reports returns **two** mentions of `Idea`, both incidental — [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07c.md) noting that THR-1024's sequencing gate points at THR-966, *"and THR-966 is `Idea`, never started"*. The column has been visible to the lane only as a place other tickets are blocked behind, never as a source.

**This is worth a line to the retro rather than a ticket** (scheduled lanes do not file process tickets). Cost line for whoever batches it:

> *Costs one line in the scan step to fix. Not fixing hid a three-week-stale ticket and left the one buildable-today item unasked for six weeks, on a board that has now reported an empty shelf four hours running.*

I did not correct the procedure file myself — editing the lane's own spec mid-run is a change to how the machine works, and that belongs to the retro with the measurement attached, not to the run that noticed it.

### Finding 2 — THR-1088 is already done, and nobody closed it

[THR-1088](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) — *legacy intervention row renders `+3% success`, Law 13* — was filed 2026-08-11 and has sat in `Idea` since. It reads as a live, well-scoped, executable UI ticket: concrete violation, replacement vocabulary already in the codebase, no design fork, three-part Done-when. **On an empty shelf it is exactly what a promotion looks for, which is why it was worth verifying rather than promoting.**

Its defect shipped fixed on **2026-08-15**, four days after filing, under [THR-1121](https://linear.app/threadbare/issue/THR-1121/encounterveil-still-runs-the-pre-nudge-intervention-pattern-generic) (*"the encounter veil stops selling odds"*, [PR #1474](https://github.com/christianspliid-ui/threadbare/pull/1474)) — whose Done-when 1, *"No step surface offers `+N% success` stance purchases"*, is THR-1088's Done-when 1 in other words.

**Verified against the code this run, not inferred from the sibling's `Done` status:**

| Check | Result |
|---|---|
| `grep -rn "buildInterventionChoices" src/` | **Zero hits.** The producer THR-1088 names (`encounterVisibility.ts:60-106`) was retired, not hidden |
| `probabilityBoost` in any non-test `.tsx` | One hit — `GameView.tsx:3410`, inside a `console.debug` payload. Not a player-facing render |
| THR-1088's Done-when 3 (a test pinning `%` absence over a non-empty option set) | Already satisfied twice — `encounterVeilChoiceLaws.test.tsx` (three stances at `probabilityBoost` 0.15/0.03/0) and `nudgeStageFateAlone.test.tsx` (`not.toMatch(/\d\s*%/)` on the nudge-less path) |

Both tests describe the row in the **past tense** — *"the fields that used to print raw"*, *"the retired stance set printed `+3% success`"*.

[Evidence comment posted](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) recommending closure. **No state change** — closing is outside this lane's authority (the `Done` carve-out is `wayfinder:*` only).

**Why this nearly went the other way.** THR-1088 is one of a family this repo has been clearing all week — THR-1048, THR-1124, THR-1008, THR-1070, THR-1421, THR-1423, THR-1425 all `Done`, the last two overnight. A family with seven green siblings and a proven-executable shape is the strongest promotion signal a shelf-starved run can see. Checking the code before promoting cost one grep; promoting would have cost a full executor run to discover the same thing.

### The Idea column's other 69 — nothing else promotable

Read for shape, not in full. The column is a genuine backlog: brainstorms (THR-219, THR-71), design-needed items (THR-624, THR-964, THR-966), parked work (THR-720), `drift-scan` and `UL-proposal` filings, and deferrals whose Done-when opens with *a decision is recorded*. Three were read in full and declined:

| Issue | Decline |
|---|---|
| [THR-1026](https://linear.app/threadbare/issue/THR-1026/questhooksfindguildlocations-still-hardcodes-adventuring-guild-so) — quest hooks hardcode `adventuring_guild` | **Wrong destination.** Done-when 1 is *"a decision is recorded on which faction definitions post ruin quest hooks… in game terms"*, and the body says outright it is *"a design question the ticket did not ask and an executor should not answer alone"* — whether a merchant consortium commissions ruin delves is fiction, not a patch |
| [THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — regenerate 5 quarantined scene assets | **Held on a cost disclosure, not on a dependency.** Fully specified, membership predicate, executable Done-when, no blockers — the only gate is its own *"spends image-generation credits… worth confirming with Christian"*. Surfaced above rather than promoted: an executor that claims it and then stops to ask has burned the run, and spending credits without disclosure is against standing direction |
| [THR-984](https://linear.app/threadbare/issue/THR-984/npm-run-lintplan-doc-with-no-args-lints-zero-files-and-always-reports) — `lint:plan-doc` with no args always passes | **Not promoted on the empty shelf.** A gate passing while broken is real, but this is process work, and the throttle is explicit that an empty product shelf's headline is *"the feature pipeline needs supply"*, never another process promotion. Logged, not promoted |

### `Todo` — standing declines unchanged, not re-derived

Every `Todo` decline keeps its evidence in [runs a–g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07g.md). **No new `Todo` candidate since run g.** Two field changes, neither a promotion signal:

- **[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) touched at 07:20:57Z** — the newest `updatedAt` on the board, and the ticket run g named as the lever, so it was read in full rather than assumed. It is a **grooming description edit**, not an approval: a note repointing the superseded 08-24 brief at the live 09-04 one. `list_comments` shows no new comment; the latest is still this lane's 09-04 entry. **The approval gate is unmet and the decline stands.**
- **[THR-1398](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) assigned to Christian at 06:38:30Z**, minutes after run g's scan closed. No comment attached. It is `wayfinder:grilling`, so it is skipped by T1 unconditionally and sits off the T1.5 frontier by virtue of being assigned. Recorded because it postdates run g's board, not because it is actionable here.

**One decline with a moving date:** [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) — time gate *"review on/after 2026-09-08"*. **Opens tomorrow.** One Low process item; it will not refill a shelf.

**Wayfinder issues skipped unconditionally:** 22 of the 53 `Todo` items carry a `wayfinder:*` label.

## T1.5 — wayfinder sweep

**Four open maps, unchanged. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2).**

The budget went unused because nothing is eligible, and [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07g.md) established this board-wide rather than frontier-only: every `wayfinder:research` ticket in the workspace is `Done`, and the single `wayfinder:task` ([THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells)) is natively blocked by [THR-1402](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings), still `Todo`. **Nothing has changed since**, so that finding is cited rather than re-derived.

Every remaining frontier ticket across all four maps is `grilling` or `prototype` — HITL, untouchable by rule. **HITL frontier unchanged and not restated** to Christian.

## T2 — design staging

**Triggered (shelf 0, floor 2) and barred. Nothing staged, nothing mutated.**

`In Design`: **2 live, 0 excluded** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (assigned, 4d) and [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (unassigned, 4d). Both under `ORCH_IN_DESIGN_STALE_DAYS`; neither carries `Parked`. Bound is 1, so staging needs **zero** live.

**Run g's analysis of this bound stands in full and is not re-derived** — including that THR-1002 self-excludes on 09-11 and that this still leaves the count at 1, so T2 stays barred regardless; the only same-hour unbar is `Parked` on THR-790. Nothing about that has moved in an hour, and re-deriving it hourly is the noise the reporting rule forbids.

**No comment posted on either issue**, for run g's reason: a comment resets the staleness clock and silences the one automated nudge pointing at `Parked`.

## T3 — architecture health

**Skipped — already run today.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) was the first run after `ORCH_HEALTH_SWEEP_HOUR` and ran all four detectors, plus the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)).

**No detector ran this run and none is reported clean.** The `In Design` split above is T3's line by rule and appears under T2 because that tier's analysis produced it — it is not a detector result.

**Redundancy: not assessed this run.** Both findings above were reached by judgement and code-reading, not by a detector; recorded as such so `newFindings: 2` is not read as detector output.

**Hand-created `In Dev` tickets: not swept this run** — T3's daily budget is spent. Both `In Dev` items carry `Parked`.

## Escalations

**No Discord message, deliberately.** `keep-work-flowing-cc` owns that doorbell and runs at **07:45Z — minutes from this run's close.** Its step 2.6 reads `## Needs Christian` from the newest sibling report, which is this one, so the new THR-876 ask reaches him through the owning lane almost immediately. A second lane pinging the same channel minutes ahead of it would be a duplicate, not a faster path.

**Agreed work is not exhausted** — but on the evidence of four consecutive empty-shelf runs, *unblocked* agreed work now is. Every remaining candidate across 124 `Todo` + `Idea` issues is held by one of three things: a design pass nobody has run, a ruling only Christian can give, or a native blocker. The stop-and-ask condition was not triggered, because the constraint is not a question this lane needs answered — it is a queue whose two refill valves (T2 staging, and Christian's two pending answers) are both closed.

**Nothing parked.**
