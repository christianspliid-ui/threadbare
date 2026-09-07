---
lane: tb-orchestrator
run: 2026-09-07i
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-07 (run i, ~08:27–08:33Z)

**Run h read the `Idea` column for the first time and found one ticket finished weeks ago and never closed. This run read it properly and found a second.** Both are the same shape: a real defect, filed twice under two numbers, fixed once, closed once. That makes it a pattern rather than an accident — and it is the reason the shelf keeps reading "exhausted" while work sits in a column T1's scan step does not open.

## Needs Christian

**Both standing asks are unchanged, and I am not re-arguing either. They are restated only so they stay in the briefing** — the hourly brief reads this section from the newest report, so dropping them here would drop them from your inbox.

1. **[Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** — still the biggest thing one answer from you can move. *"Batch 2, run the six"* puts six encounters of content work on the build queue the same hour. The brief is the [4 September one](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md).
2. **[Regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** for Meet The First — costs image-generation credits, which is why it needs your yes or no before anyone runs it. Nothing is broken meanwhile; substitutes are standing in.

If you only answer one this morning, answer the batch.

**Wayfinder questions unchanged and not restated.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **53 `Todo`**, **71 `Idea`**, **0 `Ready for Dev`**, **2 `In Dev`** — both carrying `Parked`, so **zero live**. The executor's WIP=1 slot is free with nothing to put in it, for the **fifth consecutive run**.

**Nothing on the board has moved since run h.** A `-PT75M` sweep returns exactly two touched issues, both of them run h's own work: its evidence comment on THR-1088, and the THR-1222 grooming edit it had already read. Every standing `Todo` decline keeps its evidence in [runs a–h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07h.md) and is not re-derived here.

### Finding — THR-716 is already shipped, under a different number

[THR-716](https://linear.app/threadbare/issue/THR-716/actor-token-renders-literally-in-encounter-step-prose-resolve-or) — *`{actor}` renders literally in encounter step prose* — has sat in `Idea` since **23 July**. On an empty shelf it is the strongest promotion shape in the column: a concrete player-visible defect, no blockers, no assignee, a CLI reproduction command in the body, and a three-part executable Done-when. That is exactly why it was verified rather than promoted.

Its fix shipped **1 August** under [THR-933](https://linear.app/threadbare/issue/THR-933/attended-encounter-stage-leaks-actor-literally-prose-enricher-never) ([PR #1237](https://github.com/christianspliid-ui/threadbare/pull/1237)) — and THR-933 chose **the option THR-716 itself recommended**, the resolver alias over a corpus migration. The two were filed nine days apart by the same author, neither references the other, so one closed and one did not.

**Verified against the code this run, not inferred from THR-933's `Done` status:**

| THR-716 Done-when | Evidence |
|---|---|
| No authored prose surface renders a literal `{actor}` | `proseEnrichment.ts:590-591` aliases `{actor}` and `{Actor}`. The step-prose path THR-716 named (`unifiedActionResolution.ts` → `enrichProse`) calls it at `unifiedActionResolution.ts:1905` |
| A regression test asserts no raw `{token}` survives `enrichProse` | `buildSimpleEncounterStageModel.test.ts` — `not.toMatch(/\{[a-zA-Z?/]/)` across `situationProse`, `pressureProse` and every narrative segment |
| Decision recorded (alias vs migration) | `proseEnrichment.ts:583-589`, with the reasoning for the alias |

**The guard is falsifiable, not vacuous** — it carries its own falsification note (*"Removing the `{actor}` / `{Actor}` alias lines from enrichProse must turn this red"*) plus a positive assertion that the tokens resolved to the actor's name rather than merely vanishing. Worth stating: a bare no-raw-braces check passes on empty prose, and this one does not.

What is genuinely unshipped is THR-716's **optional** follow-up — 39 files under `src/data/` still carry the literal `{actor}` convention. The body scopes that as *"a follow-up sweep at leisure"*, the alias makes it cosmetic rather than player-visible, and nothing in the Done-when asks for it. It should not hold the ticket open.

[Evidence comment posted](https://linear.app/threadbare/issue/THR-716/actor-token-renders-literally-in-encounter-step-prose-resolve-or) recommending the ticket be marked Done. **No state change** — closing is outside this lane's authority; the `Done` carve-out is `wayfinder:*` only.

### The pattern, and why it is a retro item rather than a ticket

Two in one morning — [THR-1088](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) (run h, fixed under THR-1121) and THR-716 (this run, fixed under THR-933). Same shape both times: **a defect filed twice under two numbers, fixed once, closed once**, the survivor left in `Idea` where no scan opens it. Both sat six weeks and three weeks respectively looking like prime promotable work.

Cost line for whoever batches it:

> *Costs one line in T1's scan step to read `Idea`, plus a closure pass over what that surfaces. Not fixing it has now produced two false promotion candidates in a single morning, each of which would have cost a full executor run to discover the same thing, on a board reporting an empty shelf five hours running.*

**I did not edit the lane's own procedure.** Changing how the machine works belongs to the retro with the measurement attached, not to the run that noticed it — which is also run h's reasoning, and it has not improved by being true twice.

### Three more unreachability claims checked, none promotable

Cheap greps against the strongest remaining `Idea` shapes. **None is a second closure candidate, and none is promotable:**

| Issue | Result |
|---|---|
| [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice-commit) — `pendingChoiceCommits` has no producer | **Premise still live.** Readers exist (`phaseChoiceResolution`, `phaseDetectionPressure`) and `orchestrator.ts:3154` writes the field, but only ever from a result the module returns as `[]` at both exits. Not promoted: the fix implies deciding *what should* produce a commit, which is a design question |
| [THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — 48 mandate strings unreachable | **Partially live, ambiguous.** `mandateGenerator.ts` does select from `MANDATE_TEMPLATES`, while `mandateMilestoneProse.ts:22` states in-source that its own path *"has no production caller"*. Not a clean closure and not a clean promotion |
| [THR-966](https://linear.app/threadbare/issue/THR-966/detail-page-tts-is-unreachable-the-detailmodaldetailpage-cluster-is) — DetailModal cluster mounted only in tests | **Inconclusive from a grep**; the component exists, mount-site verification needs more than this run's budget. Left open, not judged |

**Wayfinder issues skipped unconditionally:** 22 of the 53 `Todo` items carry a `wayfinder:*` label.

## T1.5 — wayfinder sweep

**Four open maps, unchanged. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2).**

The budget went unused because nothing is eligible, and [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07g.md) established this board-wide rather than frontier-only: every `wayfinder:research` ticket in the workspace is `Done`, and the single `wayfinder:task` ([THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells)) is natively blocked by [THR-1402](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings), still `Todo`. **Nothing has changed since**, so that finding is cited rather than re-derived.

Every remaining frontier ticket across all four maps is `grilling` or `prototype` — HITL, untouchable by rule.

## T2 — design staging

**Triggered (shelf 0, floor 2) and barred. Nothing staged, nothing mutated.**

`In Design`: **2 live, 0 excluded** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (assigned, 4d) and [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (unassigned, 4d). Both under `ORCH_IN_DESIGN_STALE_DAYS` (7); neither carries `Parked`. Bound is 1, so staging needs **zero** live.

**Runs g–h analysed this bound in full and that analysis stands** — including that THR-1002 self-excludes once it crosses the staleness threshold and that this still leaves the count at 1, so T2 stays barred regardless; the only same-hour unbar is `Parked` on THR-790. Nothing has moved in an hour, and re-deriving it hourly is the noise the reporting rule forbids.

**No comment posted on either issue** — a comment resets the staleness clock and silences the one automated nudge pointing at `Parked`.

## T3 — architecture health

**Skipped — already run today.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) was the first run after `ORCH_HEALTH_SWEEP_HOUR` and ran all four detectors, plus the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)).

**No detector ran this run, and none is reported clean.**

**Redundancy: not assessed this run.** The finding above was reached by code-reading and judgement, not by a detector — recorded as such so `newFindings: 1` is not read as detector output.

**Hand-created `In Dev` tickets: not swept this run** — T3's daily budget is spent. Both `In Dev` items carry `Parked`.

## Escalations

**No Discord message, deliberately.** `keep-work-flowing-cc` owns that doorbell and runs at **08:45Z**, minutes from this run's close. Its step 2.6 reads `## Needs Christian` from the newest sibling report — this one — so both standing asks reach him through the owning lane almost immediately. A second lane pinging the same channel minutes ahead of it is a duplicate, not a faster path.

**Agreed work is not exhausted, but unblocked agreed work is** — for the fifth consecutive run. Every candidate across 124 `Todo` + `Idea` issues is held by one of three things: a design pass nobody has run, a ruling only Christian can give, or a native blocker. The stop-and-ask condition is still not triggered, because the constraint is not a question this lane needs answered — it is a queue whose two refill valves (T2 staging, and Christian's two pending answers) are both closed.

**Nothing parked.**
