---
lane: tb-orchestrator
run: 2026-08-17l
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run l, ~18:32Z)

## Needs Christian

**You cleared the map's biggest question yourself an hour ago, and it unblocked more than it looks like.**

At 17:51Z your ruling on [the acted-on taxonomy](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) landed and the ticket closed. Three classes now have definitions in game terms — a change the player is *told about* through a card or chip or icon; a tally the machine keeps quietly and shows you at the moments it decides to; and a hook, which you reframed away from "dormant" entirely: it plants a real thing in the world at the moment it is set, and becomes visible when it fires. The bandit who got away plants his revenge encounter *then*, not later. That reframing is the part that makes the rest buildable, because it turns a vocabulary argument into two systems that already exist — encounter seeds and timed attachments.

**One thing follows from it, and it is a single session's work, not a program.** The definitions now need writing up as the plan the builders work from — the shared piece of machinery that every one of these changes hangs off, the ledger of what the player has been told, and your "no naked text" rule (any word naming a real game object renders as a real game component, never as bare prose). That write-up is what [the whole typed-state program](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) is waiting on, and it is now the top of the design queue. Say **"design the shared machinery"** and it starts there.

**Two questions on that map are still yours, and both are waiting on somebody to prepare something rather than on you** — the [wave-1 ordering](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) wants a ranked shortlist that nobody has written, and [the second-seam prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) wants the throwaway version built before there is anything to react to. Both come after the write-up above, and both come from the same session. Not restated as separate asks.

**Your [slice verdict session](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) is unchanged and already in your briefing.** The batch-1 encounter sample is still deliberately not an ask — your instruction was that it waits until the prose re-pass is visibly live, and the builder started that re-pass this hour.

**Nothing else needs a decision from you.** One bug was found to have already fixed itself, one guard went into the build queue, and the builder is working.

## T1 — unblock sweep

**Promoted 1**, verified after the write. **One candidate was checked and found already fixed** — recorded below, because that is the more useful half of this run.

```
[orchestrator] T1 scan: Todo 18, Ready for Dev 3 (all Deferral), In Dev 1, In Design 1, Idea 80 (unfiltered — run j/k correction held)
[orchestrator] T1 promote THR-1091: blockedBy [] live, premise re-counted against main@af7ac9d3 (24 of 40 reach_specific carry a test block, guard filters on category), mutex re-derived not inherited, latest comment = filing block (no retire verdict), no plan doc named → Ready for Dev (project: Encounter Experience)
[orchestrator] T1 close-candidate THR-1088: sequencing hold cleared at 17:36Z; re-verified before promoting and the violation is GONE — THR-1121 removed the percentage, THR-1048 removed the enum, and a rendered gate already pins both. Verdict recorded on the ticket, not promoted.
[orchestrator] T1 skip THR-964/THR-1094/THR-1095: wrong destination — each Done-when opens with "a decision is recorded", i.e. a design fork → T2
[orchestrator] T1 skip THR-1052: sequencing hold now stronger, not weaker — THR-1130 went In Dev at 17:27Z and is re-authoring exactly those cards
[orchestrator] T1 skip THR-1026/1053/1148: creative fork or wrong order, unchanged from run k
[orchestrator] T1 skip THR-1155/1156/1002/1134/1114/175: wrong destination — design ticket, plan doc before code → T2
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried, still Idea
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
```

### [THR-1088](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) — the run's most valuable result is a promotion that did not happen

This ticket was first in line. Run k declined it only on sequencing (same `EncounterVeil` surface as THR-1048, which was `In Dev`), and that hold cleared when THR-1048 merged at 17:36Z. So it was re-verified against `main` at `af7ac9d3` before promoting, per the stale-ticket discipline — **and both halves of the violation it reports are already gone, fixed by two tickets that never referenced it**:

- **The percentage.** `EncounterVeil.tsx:2487-2494` no longer has the `+N% success` branch; THR-1121 removed it along with the mechanic that produced it, leaving `fate decides` for `withdrawn`. The ticket asked for the number to be banded into a word; what happened instead is stronger — there is no number left to band.
- **The stance row.** THR-1048 shipped 55 minutes before this check (`20bd16ab`): `ChoiceBlock` now renders `lend strength` / `press them` / `stand back` from `src/engine/interventionStanceWords.ts`.
- **Its test Done-when is satisfied too**, which is what makes this a confident call rather than a hopeful one. `encounterVeilChoiceLaws.test.tsx` asserts the rendered veil contains no `%` **over three choices carrying live `probabilityBoost` values of 0.15 and 0.03** — the exact numbers this ticket quotes as `+15%` and `+3%` — behind an anti-vacuity gate that first proves the choice block rendered at all. The only `%` left in the file is inside `ResolutionReadoutBlock`, which is designer-view-only (THR-1124) and outside Law 13.

Had it been promoted on run k's clearance, an executor would have taken a top-of-queue slot to discover this. The verdict is written **on THR-1088 itself**, not only here — deliberately, because the flow defect this lane logged one hour ago was a settled decision recorded on the *asking* ticket and never on the *asked-about* one, which left a closed question reading as open. Same shape, so the same fix applies to our own output. It is left in `Idea` rather than closed: this lane does not set terminal states on non-wayfinder issues.

### [THR-1091](https://linear.app/threadbare/issue/THR-1091/converted-reach-specific-templates-have-no-polarity-guard) — promoted, and labelled honestly

Twenty-four converted `reach_specific` meeting templates have **no machine check on their pole binding at all**. The guard that catches inverted polarity — the defect THR-1071 found in 37 of 40 dilemmas, where showing mercy made an agent more ruthless — filters on `t.category === 'axiological'`, so the `RC-*` conversions are outside it by construction.

The premise was **re-counted, not trusted** (filed 08-12; the meeting corpus has moved): on `main`, `src/data/meeting-dilemma-library.ts` holds 40 `reach_specific` templates of which **24 carry a `test` block**, against 45 `axiological` of which 40 do and are covered. The ticket's count and its predicate agree. `axiologicalPolarity.test.ts:144-146` still filters as described, and `:153` still asserts the recorded-readings key set equals the covered set exactly — so rows cannot be added without widening the filter.

**Mutex re-derived rather than inherited.** The filing block's "none currently" is five days old; `git log` shows nothing has touched either file since `a2e7f02c` (THR-1062, the conversion that opened the gap), and the one issue `In Dev` edits `src/data/encounters/**`, a disjoint family.

**Two judgement calls recorded on the ticket.** First, its Done-when 3 branch — *"if the heuristic does not separate cleanly, the alternative is chosen and recorded"* — is gate calibration and the *how* of an already-agreed guard, so it is the executor's call under canon process rule 4, not a park waiting for Christian. Only a finding that a template's band prose genuinely reads backwards escalates, because that is a content defect rather than a calibration question. Second, the caution that matters here: this widens a guard onto a population it was not derived from, so the covered **set** gets diffed before and after — a filter change that quietly drops an axiological template while adding `RC-*` ones reads as a win on the count and is a loss on coverage.

**Called what it is: guard-extension work, not product.** It protects shipped content correctness rather than the delivery machine, which is why it clears the bar at all — but it is not the feature program, and promoting it does not mean the shelf is healthy.

Other declines, each naming its evidence:

- **[THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice)** (`pendingChoiceCommits` has no producer — an entire pipeline unreachable), **[THR-1094](https://linear.app/threadbare/issue/THR-1094/conditions-are-named-on-player-surfaces-but-are-not-a-tooltip-class)** (conditions are not a tooltip class), **[THR-1095](https://linear.app/threadbare/issue/THR-1095/the-shared-tooltip-trigger-is-not-focusable-so-every-tooltip-in-the)** (every tooltip is hover-only) — all three examined in full this run and all three declined on the same ground: their first Done-when is *"a decision is recorded"*, and each body names two or three candidate shapes with an explicit instruction not to let an executor guess. Wrong destination, not wrong work. All three are T2 input and all three are real — THR-964 in particular reports four constant families reachable only from tests.
- **THR-1052** — the hold is *stronger* than run k found it, not weaker: THR-1130 moved to `In Dev` at 17:27Z, so the encounter cards whose `imageTag`s this would repoint are being re-authored right now.
- **THR-1024** — prose gate *"do not start before THR-966"*; THR-966 re-queried live, still `Idea` since 2026-08-02. Unchanged for thirteen runs.
- **THR-1026 / THR-1053 / THR-1148 / THR-1155 / THR-1156 / THR-1002 / THR-1114 / THR-1134 / THR-175** — unchanged from run k; creative fork, wrong order, or design-before-code.
- **THR-789 / THR-791 / THR-1043** — tracking epics or assigned. **THR-870** — parked by creative-director sequencing.

**Shelf after this run: 4 items, every one of them `Deferral`** — THR-1049, THR-1133, THR-995, THR-1091. **Non-`Deferral` count: 0**, because THR-1130 left the shelf for `In Dev` at 17:27Z. Promotion ceiling (5/run; 1/run above a 15-item shelf) nowhere near reached — nothing was held back by the ceiling. What is missing is not promotion capacity.

**Product-vs-process ratio, week of 2026-08-10 → 08-17: ~5:1 product**, carried from runs d/i/k rather than re-derived — one hour does not move a seven-day ratio. This run's single promotion is guard-extension work, so it **does** draw on the process budget: with a starved shelf the rule is at most one process item per run, and exactly one was taken. The headline finding stands as the rule requires — the feature pipeline needs design, not more tidying.

## T1.5 — wayfinder sweep

**Two open maps. Zero AFK tickets exist to burn down — 0 of `ORCH_WAYFINDER_AFK_MAX` (2) spent, unspent because the work is not there rather than because it was skipped.**

**[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map). Four of six children now `Done` — [THR-1161 closed at 17:51Z](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions), an hour after the last run reported it open.** It was resolved the way the 13:59Z correction said it would be: not by this lane, and not as the question originally posed. Christian ruled live in an attended sitting, and the resolution is on the ticket in full.

The substance matters for sequencing, so it is recorded rather than merely linked. Three classes, cut by **how the player is told**: *acted-on* (an entity changed and the player sees it as a card/chip/icon, awareness-scoped so fog and secrets are exempt); *bookkeeping* (invisible accumulation, visible result at tally-points — which reconciles the 08-16 tally ruling, since a threshold trait mint **is** an acted-on event); and *hook*, which Christian reframed off "dormant" entirely — a hook spawns a real entity at planting, with metadata governing when it fires, and firing upgrades it to acted-on. The substrate is explicitly **encounter seeds plus timed attachments** — existing machinery, not a new system. A candidate law came out of it too ("no naked state": text naming a simulation object always renders as an anchored component), enforced structurally as a generalization of Law 56.

**Why this is the run's most consequential change.** Run k's headline was that four items were all stuck behind the same missing design step. One of the four was this, and it is now answered — which converts the remaining work from "waiting on a ruling" to "waiting on a write-up". The resolution names its own downstream: *"feeds the shared-machinery plan doc … and the wave-1 selection sitting."*

Frontier, both HITL, both now genuinely unblocked and both waiting on an artifact rather than on Christian:

- **[THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)** (`wayfinder:grilling`) — expects an agent-prepared ranked slate that still does not exist. Its stale "features-first" premise, flagged at 14:36Z, is now doubly stale: the taxonomy ruling is a further input its criteria have not absorbed.
- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — blocker THR-1159 confirmed `Done` via `includeRelations`, so it is unblocked; nothing has been built to react to. Its default target is the plot-hook table, which the taxonomy ruling has just given a definition to — so the prototype is better-specified now than when it was filed.

**[THR-902 — Encounter experience redesign, vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Eight children, 7 `Done`, 1 open — [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`, HITL). Unchanged.

**The structural finding, updated rather than repeated.** Run k reported every open child on both maps as grilling or prototype, three of four stalled on artifact preparation. That still holds — but the count of items stalled on *Christian* has gone from one to zero, and the write-up that would clear the rest is a single session with its inputs now complete. The wall is unchanged in shape and materially lower.

## T2 — design staging

**Triggered, and bound — for the twelfth consecutive run.** Shelf holds **0 non-`Deferral` items** (THR-1130 left for `In Dev` at 17:27Z), below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's promotion does not change that: THR-1091 carries the `Deferral` label too.

**Nothing staged**, because `In Design` already holds **1** issue — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). Staged 2026-08-15T20:29Z; the 48h re-surface clock expires **2026-08-17T20:29Z**, about two hours from now, so the next run but one re-surfaces it rather than re-staging.

**The candidate ranking changes this run, for the first time in a week.** The new top candidate is the **shared-machinery plan doc** that [THR-1161's resolution](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) explicitly feeds — the anchor type, the acted-on ledger, and the "no naked state" law as a `laws.md` addition. It displaces THR-1155 because every input it needs now exists (seam inventory, substrate inventory, pilot learnings, and as of 17:51Z the taxonomy itself), because it is what the `Urgent` program epic [THR-1156](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) is blocked on, and because it unblocks both remaining wayfinder frontier tickets at once rather than one item.

No ticket was filed for it: it belongs to the THR-1157 map and THR-1156 epic, which already carry the work, and this lane does not author plan docs (Christian's ruling, 2026-08-06). Ranking behind it, unchanged: **THR-1155** (nations and named areas), then **THR-1134**, then **THR-1002** / **THR-1114**, then the three design forks T1 declined into this tier this run — **THR-964**, **THR-1094**, **THR-1095**.

The binding constraint remains **design supply plus the `In Design` bound**, not a shortage of candidates. That queue grew by three this run and shrank by none.

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local) and carried the full detector pass; the Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health pass ran with it and is on `ops` as `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none is reported as clean.** Run d's standing set is carried explicitly **unverified**: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No fresh judgement pass happened and none is claimed.

**Stalled-work check ran** — it reads `stateHistory` already fetched this run, so it costs nothing. THR-1091 now has exactly one transition (`Idea → Ready for Dev`, this run). THR-1048 ran `Idea → Ready for Dev → In Dev → Done` once, cleanly, in 66 minutes. THR-1088 has never transitioned. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

None. No question was asked on Discord and nothing was parked — the one item that would have gone to Christian this hour is a design-session request, which reaches him through the briefing rather than the escalation channel.

**One flow observation, logged not filed** (scheduled lanes do not file process tickets; the weekly retro is the promotion point). THR-1088 was fixed by THR-1121 and THR-1048 without either knowing it existed, and would have been claimed had this run promoted it on run k's cleared hold. The near-miss and the THR-1052 case run k logged are the same shape from opposite ends: **work whose status changed somewhere other than its own ticket**. The cheap general defence is the one this run used and the one THR-990 already put in the promotion path — re-verify a ticket's premise against `main` immediately before promoting, never against the state it was filed in. Cost this run: two minutes of grep. Cost of skipping it: one executor pickup. Below the materiality bar as a single incident; worth the retro's attention as a pattern, since this is its second instance in two hours.
