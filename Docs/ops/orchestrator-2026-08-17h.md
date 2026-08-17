---
lane: tb-orchestrator
run: 2026-08-17h
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run h, ~12:31Z)

## Needs Christian

**One question is waiting for you, and it is the one that unlocks the rest of the new architecture map.**

[When the world quietly records something about a person, when does the player get told?](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) You have already ruled twice in two directions and they need reconciling into one rule: reach-reputation tallies are the game's private bookkeeping, invisible everywhere, still steering who trusts whom (your call, 2026-08-16) — but a recording that could become a future story hook is one where *"we need to make it clear to the player that that is what has happened"* (your call, 2026-08-17). The proposal on the table is three classes: **acted-on** (something reads it now, so the player sees it in full), **dormant hook** (recorded for a story that has not been written yet, so the player is told it was noted), and **bookkeeping** (the machine's own ledger, invisible by design). The open bits are whether a dormant hook expires if nothing ever picks it up, whether the player watches that happen, and who is allowed to mint one.

This resolves live in a chat, roughly a grilling session. Say *"work the typed-state map"* when you have the time. It is the only unblocked question on that map, and the wave-order decision behind it cannot be taken until it lands.

Your slice-verdict session ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)) is still open and still in your briefing — not restated here, because leading with two asks is how both get skipped.

**Nothing else needs you.** One small cleanup went into the build queue this hour; the chip-anchoring work you kicked off this morning is being built right now.

## T1 — unblock sweep

**Promoted 1** — [THR-1140](https://linear.app/threadbare/issue/THR-1140/reputation-tallies-are-system-visible-with-no-designer-surface) (reputation-tally vocabulary with no caller since THR-1136 §5) → `Ready for Dev`. State re-queried after the write and confirmed stuck; the `assignee` key is absent on the re-query, so `pull-work`'s `assignee:null` filter will see it; coordination block posted as the latest comment.

```
[orchestrator] T1 scan: Todo 20, Implementation Planning 0, Idea≤72h/active-project 1, In Design 1, In Dev 2, Ready for Dev 1
[orchestrator] T1 promote THR-1140: blockedBy [] live, no prose/time gate, 0 comments (no retire verdict) → Ready for Dev (project: Encounter Experience)
[orchestrator] T1 skip THR-1155: no blockers, but body states "this is a design ticket — plan doc before code" → T2
[orchestrator] T1 skip THR-1156: program epic, director ratification, needs design → T2/map
[orchestrator] T1 skip THR-1148: design fork, four options, no agreed outcome; its own recommendation already shipped
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried, still Idea
[orchestrator] T1 skip THR-1157/1160/1161/1162/1163/902/907: wayfinder:* labels → T1.5, never Ready for Dev
```

**The promotion, and why no earlier run made it.** THR-1140 was filed by the executor on 2026-08-16 into `Idea` while shipping THR-1136 §5, carrying a derived coordination block in its body. It has no blocker of any kind — `blockedBy: []` read live, no prose gate, no time gate — and its design question is not open: your 2026-08-16 ruling already settled that tallies are system-visible, so the ticket offers two acceptable outcomes (build the designer readout, or prune the orphaned vocabulary) with either closing it. Zero comments, so the THR-990 latest-comment check found no standing retire verdict. **It was never declined by runs d–g; it was never seen.** Those sweeps scanned `Todo` plus `Implementation Planning`, and this ticket sat in `Idea` — inside the exact `Idea`-membership predicate (created ≤72h, project with active work) that those runs have each been proposing for the retro. This run applied the predicate and it returned one candidate, which promoted. That is the seventh consecutive run's hand-patch finally paying rather than merely being noted; still **logged, not filed**, per the process-work throttle.

**One live interaction recorded on the ticket rather than decided here.** THR-1161 — the grilling ticket surfaced above — is grilling the *bookkeeping* class that these tallies are the motivating example of. Outcome 1 (designer readout) survives any answer it produces; outcome 2 (prune) deletes the only key→words vocabulary a designer surface could use, and so forecloses a question Christian has not been asked. The coordination block states the dependency and leaves the scope call to the executor at pickup, which is where it belongs.

**Rule-0 / materiality note.** This is not a Rule-0 promotion and makes no queue-jumping claim: it carries no demonstrated-loss evidence, sorts at `Low` on its own priority, and is not delivery-machinery process work (it is game-engine residue in a product project, filed by the executor as tracked-rather-than-invisible debt). The shelf held **0 non-`Deferral` items** at scan, so it displaced nothing.

Declines, each naming its evidence:

- **THR-1155** (nations and named areas as real game objects) — wrong destination, not an unmet blocker: `blockedBy: []`, but the body reads *"this is a design ticket — plan doc before code"* and its Done-when is a plan doc handed off with a coordination block. T2 input, and the standing top T2 candidate.
- **THR-1156** (typed game-state program epic, `Urgent`) — tracking epic for the THR-1157 map; not executor queue work.
- **THR-1148** (`agent_relocation` steers weakly) — **the decline reason has changed and the change is worth recording.** Runs c/d declined it on "its revisit trigger is THR-1145 landing, which has not happened." THR-1145 completed **2026-08-17T04:38Z**, so that half has now cleared. It still declines, on the other half: the trigger's actual predicate is the Consequence Draw *putting `movement` in hands that did not choose it at authored volume*, and no encounter has yet been authored through the draw — the factory batch (THR-1130) is parked on your sample verdict. Beyond that it is a four-option design fork with no agreed outcome, and its own recommendation (accept and document) is already shipped. T2/Christian input if it ever moves.
- **THR-1024** (DetailModal a11y) — prose gate *"do not start this before THR-966"*. THR-966 re-queried live this run: still `Idea`, unstarted since 2026-08-02. Unchanged for nine runs.
- **THR-1114** (`sphereAffinity` `shadow`/`void`) — standing wrong-destination verdict in its own body: *"There is no agreed outcome to test against."*
- **THR-1134** (shareable game-state snapshot) — wrong destination; its body says the design session that picks it up authors the coordination block at handoff.
- **THR-1002** (card grammar) — *"This is a design ticket — it needs a plan doc before code."*
- **THR-175** (`agent.sphere` field) — unmet trigger gate; requires a design doc first regardless.
- **THR-789 / THR-791 / THR-1043** — tracking epics / assigned to Christian.
- **THR-870** (sphere-governance pivot) — parked by creative-director sequencing. Not this lane's call.
- **THR-902 / THR-907 / THR-1157 / THR-1160 / THR-1161 / THR-1162 / THR-1163** — `wayfinder:*` → skipped unconditionally in T1, handled in T1.5.

Shelf at scan: **1 item**, THR-1133, a `Deferral` — so **0 non-`Deferral`**. Promotion ceiling not reached and not applicable; nothing was held back by it.

**Product-vs-process ratio, week of 2026-08-10 → 08-17: unchanged from run d's measurement (~3:1 product).** Not re-counted this run — the window has moved by eight hours and the completions inside it are the same set run d read. The throttle is holding and no corrective action is indicated. Per the throttle's own clause, the shelf being empty of product work is **not** a licence to promote process items in volume: exactly one item entered the queue this hour, and it entered on its own priority, not on a flow-impediment claim.

## T1.5 — wayfinder sweep

**Two open maps. Children re-listed live this run rather than carried, and the sequencing moved in a way that matters.**

**[THR-1157 — Typed game-state architecture: machinery + first wave](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Six children re-listed live: **2 `Done`, 4 open**, none assigned. Frontier is **1 ticket**:

- **[THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** (`wayfinder:grilling`) — `blockedBy: []` confirmed live again. Genuinely ready, HITL. **Surfaced above, and restated deliberately** — `keep-work-flowing-cc` reads only the *newest* sibling report, so this run writing a report at all makes restating it mandatory; omitting it would drop the ask out of the briefing rather than let run g's copy persist.

- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — **off the frontier this run, and that is a change.** Run g held it by judgement while its declared blockers all read `Done`; it is now blocked by the relation graph itself. The pilot was **split at pickup**: THR-1153 kept the reported defect and the adapter route (both shipped, PRs #1520 / #1522, merged this morning), while the 48-chip corpus sweep and the anchor-resolution gate moved to **[THR-1164](https://linear.app/threadbare/issue/THR-1164/anchor-the-corpus-sort-every-chip-that-names-a-referent-and-gate-on)**, filed 11:18Z and claimed by the executor at 12:02Z. So the migration proper is being built right now, and the question this prototype asks — does the anchor type survive contact with a *second* seam — still cannot be asked honestly, for the same reason as run g but now on a live blocker rather than a judgement call.

- **THR-1160** (`wayfinder:research`, AFK) — blocked by THR-1164, read live. This is the ticket this lane resolves without Christian the moment the corpus sweep merges, and it is the next thing to unlock. **THR-1163** (`wayfinder:grilling`, wave-1 selection) sits behind THR-1160.

**[THR-902 — Encounter experience redesign, vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Unchanged: **8 children, 7 `Done`, 1 open.** Frontier is **1 ticket**, [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`, HITL) — the standing slice-verdict ask, carried in the briefing and deliberately not made this run's headline.

**AFK burn-down: 0 tickets, `ORCH_WAYFINDER_AFK_MAX` (2) unspent.** Across both maps there is not one open `wayfinder:research` or `wayfinder:task` ticket that is unblocked — THR-1160, the only research ticket left, waits on THR-1164 by design. This lane does not touch grilling or prototype tickets.

## T2 — design staging

**Triggered, and bound — for the eighth consecutive run.** Shelf held **0 non-`Deferral` items** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2). The floor fired. (This run's THR-1140 promotion does not clear it: THR-1140 carries the `Deferral` label, so the non-`Deferral` count is still 0 after the write.)

**Nothing staged**, because `In Design` already holds **1** issue — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). Staged 2026-08-15T20:29Z; the 48h re-surface clock expires **2026-08-17T20:29Z**, so the first run after that re-surfaces it rather than re-staging. This run is ~8h short of it.

**Candidate ranking, unchanged from runs f and g:**

1. **[THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)** (nations and named areas as real game objects) — top candidate; High, director direction, explicitly needs a plan doc. **Caveat unchanged:** its position in the wave is THR-1163's call, and THR-1163 is blocked behind THR-1160, which is blocked behind THR-1164. Staging it today would still pre-empt a decision the map deliberately holds.
2. **[THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** (shareable game-state snapshot) — unchanged and still valid.
3. **[THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** (card grammar) and **[THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere)** (sphereAffinity strays) — feature-class, below the architecture program by the morning's ruling.

**The constraint is unchanged and is worth stating plainly, because the shelf number reads alarming and is not.** The queue is thin because execution is fast, not because promotion is failing: THR-1153, THR-1154, THR-1145 and THR-1147 all merged inside the last twelve hours, and the executor is on THR-1164 now. What is genuinely constrained is **design supply**, and the binding constraints are the `In Design` bound plus the map's own sequencing — not a shortage of candidates. This lane deliberately does not author plan docs (Christian's ruling, 2026-08-06).

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local) and carried the full detector pass plus the Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health file, `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none are reported as clean.** Run d's standing set is carried explicitly unverified: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No fresh judgement pass happened this run and none is claimed.

**Stalled-work check ran** — it reads the `stateHistory` this run already fetched. THR-1140 has **one** state transition (its promotion, this run). THR-1164 has one `Ready for Dev → In Dev`. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

None. No question was asked on Discord and nothing was parked. Every decline named its evidence, and the one genuine ask went to `## Needs Christian` — it is a design conversation to schedule, not a blocker to unblock.

**Two standing notes, carried because both are read wrong from the state alone.**

**THR-1130** shows `In Dev` but is a **park** — `assignee: null` ∧ `In Dev`, verified live again this run — waiting solely on Christian's 2-of-6 batch-1 sample verdict. It is not the executor's active claim; THR-1164 is, so WIP=1 is intact rather than doubled.

**THR-1164 was filed by the executor directly into `Ready for Dev` and self-claimed 44 minutes later.** That is the sanctioned split-at-pickup route, not a queue bypass: THR-1153's re-promotion comment from run g explicitly delegated the scope-split call, and the split ticket carries its own predicate, membership count and Done-when. Recorded here only so a later reader does not mistake a same-hour file-and-claim for the executor jumping its own queue.
