---
lane: tb-orchestrator
run: 2026-08-17j
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run j, ~16:32Z)

## Needs Christian

**One question is genuinely ready for you. The other two on the new architecture map are not, and I would rather say so than pad the list.**

- **[When the world quietly records something about a person, when does the player get told?](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** — ready now, nothing blocking it, and it unlocks the rest of the map. You have ruled twice in two directions and they need reconciling: reach-reputation tallies are private bookkeeping that still steers who trusts whom (2026-08-16), while a recording that could become a future story hook is one where *"we need to make it clear to the player that that is what has happened"* (2026-08-17). Three classes proposed — **acted-on** (something reads it now, player sees it in full), **dormant hook** (recorded for a story not yet written, player is told it was noted), **bookkeeping** (the machine's ledger, invisible by design).
- **[Your slice verdict session](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)** — still open, already in your briefing. Not restated at length.

Say *"work the typed-state map"* when you have an hour and we take the first one.

**The other two map questions are waiting on somebody to build something, not on you** — [wave-1 selection](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) needs a ranked shortlist that does not exist yet, and [the second-seam prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) needs the throwaway version built before there is anything to react to. Both are design-session work. Unchanged since this morning, and flagged again only so the map does not read as three questions waiting on you when it is one.

**Nothing else needs you.** Two bugs went into the build queue this hour; the executor shipped one ticket and is mid-way through another while I worked.

## T1 — unblock sweep

**Promoted 2**, both verified after the write (state re-queried, `assignee` key absent on the `get_issue` re-query so `pull-work`'s filter will see them), both carrying a full coordination block as the latest comment.

```
[orchestrator] T1 scan: Todo 18, Ready for Dev 1, In Dev 2, In Design 1, Idea (recent) 4
[orchestrator] T1 promote THR-1048: blockedBy [] live, 0 comments (no retire verdict), no plan doc named, mutex THR-1031 Done 2026-08-10 → Ready for Dev (project: Encounter Experience)
[orchestrator] T1 promote THR-1049: blockedBy [] live, 0 comments, premise re-derived from the import graph and holds → Ready for Dev (project: Encounter Experience)
[orchestrator] T1 skip THR-1053: design reconciliation touching the Composition Contract while THR-1130's sample sits parked under review
[orchestrator] T1 skip THR-1155/1156/1002/1134/1114/175: wrong destination — design ticket, plan doc before code → T2
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried, still Idea
[orchestrator] T1 skip THR-902/907/1157/1161/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
```

**[THR-1048](https://linear.app/threadbare/issue/THR-1048/the-legacy-encounter-choice-card-breaks-laws-13-and-14-15percent) — a live Law 14 violation on a player-facing card, and the promotion is worth more than the state change.** The ticket claims two violations. Verified against `main` at `965a2edc`: **one of them was fixed nine days ago and the ticket does not know.** THR-1121 removed the `+N% success` branch from `ChoiceBlock` along with the mechanic it reported — the code now carries a comment saying exactly that. The Law 14 half is still live: `EncounterVeil.tsx:2578-2589` renders `{choice.interventionType}` verbatim (`supportive` / `coercive` / `withdrawn`), raw engine enum, no display vocabulary.

Three ways an executor would have lost time, all recorded on the ticket:

- It would have hunted a percentage that no longer exists on the card.
- It would have followed *"delete `formatSignedPercent` if nothing else calls it"* — something does. Its sole remaining caller is the resolution readout, which THR-1124 made **designer-view only** (`if (!designerView) return null;`). Raw magnitudes are correct there; deleting the helper would have broken a surface that is behaving.
- Its Done-when 1 (*"no `%` renders anywhere on the veil"*) is now **false as a target**, because the designer view legitimately renders `Capability 62% · Modifiers +15% · Threshold 12`. A machine gate written to that wording goes red on a correct surface. Rescoped on the ticket to the mortal-facing choice block, flagged as the executor's call per canon process rule 4.

Mutex handled rather than inherited: the body's `Mutex with: THR-1031` is **discharged** — THR-1031 completed 2026-08-10T15:51Z, so its stated reason is verifiably inapplicable, which is the one condition permitting reversal (THR-688 rule B). Every other recent editor of that file is also `Done` (THR-1136 08-16, THR-1152 08-17), and nothing `In Dev` touches it.

**[THR-1049](https://linear.app/threadbare/issue/THR-1049/prototype-disposition-encounterscreen-castrail-casttile) — prototype disposition, promoted as the one hygiene item, honestly labelled.** Its "styleguide-only" premise was filed 08-08 and the encounter tree has been rebuilt repeatedly since, so it was re-derived from the import graph rather than trusted. It holds. Two corrections went onto the ticket: `useEffectSequencing.ts` and `encounter-experience-constants.ts` reference `EffectRegistration` only in **comments**, not imports (so the components really are styleguide-plus-one-test); and the body's **named list is narrower than the body's own predicate** — by *"unrendered outside the styleguide"*, `EncounterChoiceCard` and `EiraHeroPanel` are members too and go unnamed, which THR-688 rule A resolves in the predicate's favour.

This is hygiene-class and does not jump the queue — the comment says so explicitly and tells the executor to take THR-1048 first.

Declines, each naming its evidence:

- **THR-1053** (Composition Contract `concepts` conflict) — the one judgment call this run. `blockedBy: []` and it is arguably executable, but it would narrow or confirm a gate across all 191 templates **while THR-1130's batch-1 sample sits parked awaiting Christian's verdict on those very encounters**. Changing the contract under a sample under review is the wrong order. It is mutex with THR-1051 besides. Re-assess once the THR-1130 park lifts.
- **THR-1155** (nations and named areas as real game objects) — wrong destination: `blockedBy: []`, but the body reads *"this is a design ticket — plan doc before code"*. Standing top T2 candidate.
- **THR-1156** (typed game-state program epic, `Urgent`) — tracking epic for the THR-1157 map; not executor queue work.
- **THR-1148** (`agent_relocation` steers weakly) — four-option design fork, no agreed outcome; its revisit predicate (the Consequence Draw putting `movement` in hands that did not choose it, at authored volume) is still unmet.
- **THR-1024** (DetailModal a11y) — prose gate *"do not start this before THR-966"*; THR-966 re-queried live, still `Idea`. Unchanged for eleven runs.
- **THR-1114 / THR-1134 / THR-1002 / THR-175** — wrong destination; each body requires a design pass or plan doc first.
- **THR-789 / THR-791 / THR-1043** — tracking epics / assigned.
- **THR-870** (sphere-governance pivot) — parked by creative-director sequencing. Not this lane's call.
- **THR-59** (Encounter Veil Watched-tier redesign) — a redesign with no agreed outcome; T2 input at best.

Shelf at scan: **1 item** (THR-1133, a `Deferral`) → **0 non-`Deferral`**. Promotion ceiling (5/run, and 1/run above a 15-item shelf) nowhere near reached; nothing held back.

**One flow observation, logged not filed (scheduled lanes do not file process tickets).** Both tickets promoted this run were filed **2026-08-08** and sat in `Idea` for nine days while the shelf repeatedly read empty. The skill has T1 scan *"each `Todo` / `Idea` candidate"*, but recent runs have in practice applied a recency window to the `Idea` half — run i's own scan line records `Idea≤72h/active-project 1`, which structurally cannot see a nine-day-old ticket. So the lane has been reporting a starved shelf while two promotable items sat one query away. Cheap to fix (drop the recency filter on `Idea` for active projects, or widen it), and worth the weekly retro's judgement rather than a ticket — the cost so far is opportunity cost, not lost work.

**Product-vs-process ratio, week of 2026-08-10 → 08-17: ~5:1 product, carried from run d/i rather than re-derived** — nothing in the intervening two hours plausibly moves a seven-day ratio, and a re-count costs pagination for no decision. This hour's completion (THR-1166, a content/canon bug) is product; neither promotion this run is delivery-machinery process. The throttle is holding and no corrective action is indicated.

## T1.5 — wayfinder sweep

**Two open maps, label-filtered rather than inferred. No AFK tickets exist to burn down — 0 of `ORCH_WAYFINDER_AFK_MAX` (2) spent, and the slots went unspent because the work is not there, not because it was skipped.**

**[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Six children re-listed live: **3 `Done`** (THR-1158, THR-1159, THR-1160 — the last resolved by run i), **3 open, all HITL**:

- **[THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** (`wayfinder:grilling`) — unblocked, the headline ask above.
- **[THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)** (`wayfinder:grilling`) — unblocked since run i, but needs an agent-prepared ranked slate that does not exist.
- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — unblocked, but nothing has been built to react to.

**[THR-902 — Encounter experience redesign, vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Eight children: **7 `Done`, 1 open** — [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`, HITL). THR-974, its consequence-verdict sibling, closed 14:51Z and spawned THR-1166, which shipped at 15:36Z.

**The structural note from run i stands and is now the whole tier's shape:** across both maps there is **zero** open `wayfinder:research` or `wayfinder:task` ticket. Every remaining open child is grilling or prototype, and two of the four are stalled on *artifact preparation* rather than on a decision — both agent-doable, neither reachable by this lane, because their HITL labels put them out of reach. Logged for the weekly retro, not filed. The practical workaround costs nothing: an attended design session builds both.

## T2 — design staging

**Triggered, and bound — for the tenth consecutive run.** Shelf held **0 non-`Deferral` items** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's two promotions do not clear it either: THR-1048 and THR-1049 both carry the `Deferral` label, so the non-`Deferral` count is still **0** after both writes.

**Nothing staged**, because `In Design` already holds **1** issue — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). Staged 2026-08-15T20:29Z; the 48h re-surface clock expires **2026-08-17T20:29Z**, so the first run after that re-surfaces it rather than re-staging. This run is ~4h short.

Candidate ranking unchanged from run i: **THR-1155** (nations and named areas) remains the top candidate, still one THR-1161 sitting away from having its wave position settled; then **THR-1134** (shareable game-state snapshot); then **THR-1002** and **THR-1114** as feature-class work sorting below the architecture program under the architecture-first ruling.

The binding constraint is **design supply** plus the `In Design` bound, not a shortage of candidates. This lane deliberately does not author plan docs (Christian's ruling, 2026-08-06).

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local) and carried the full detector pass plus the Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health file, confirmed present on `ops` as `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none are reported as clean.** Run d's standing set is carried explicitly **unverified**: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No fresh judgement pass happened and none is claimed.

**Stalled-work check ran** — it reads `stateHistory` already fetched this run, so it costs nothing. THR-1048 and THR-1049 each have exactly one transition (`Idea → Ready for Dev`, this run). THR-1166 ran `Ready for Dev → In Dev → Done` once. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

None. No question was asked on Discord and nothing was parked.

**One standing note, carried because the state reads wrong on its own.** **THR-1130** shows `In Dev` but is a **park** (`assignee: null` ∧ `In Dev`, verified live), waiting on Christian's 2-of-6 batch-1 sample verdict. It is not the executor's active claim, so WIP=1 is intact — THR-1165 is the live claim. Its hold condition (the pilot's fixes applied to the sample encounters) is **still not discharged**: THR-1165, the outstanding pilot-surfaced defect sitting in exactly those slice templates, went `In Dev` at 16:23Z and has not landed. Deliberately not surfaced to Christian as "your verdict is ready" — inviting the sitting and being wrong wastes the sitting. Re-check once THR-1165 merges; that is when it becomes an ask.
