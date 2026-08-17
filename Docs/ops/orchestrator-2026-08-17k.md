---
lane: tb-orchestrator
run: 2026-08-17k
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run k, ~17:30Z)

## Needs Christian

**First, a correction to what the last brief told you — because it asked you for something you had already ruled out.**

Two hours ago this lane put [the acted-on taxonomy question](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) at the top of your list as *"ready now, nothing blocking it"*. It was not ready, and you are the one who said so. On Discord at 13:01 today you asked: *"What even is a dormant plot hook in this game systemically? I think we need to define that in technical terms"* — and the PM lane recorded that on the ticket at 13:59 and removed it from your asks. The previous run did not read that note before writing its brief. **The question comes back to you once somebody has written the definition, not before.** Nothing for you to do here except ignore the earlier ask.

**What that leaves: nothing new needs a decision from you this hour.** Your [slice verdict session](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) is still open and already in your briefing — not restated at length, because leading with three asks is how all three get skipped. The batch-1 encounter sample is deliberately **not** an ask yet: your own instruction was that it does not come back to you until the prose re-pass is visibly live on the deployed Bridge and Grateful Kin, and that re-pass has not run.

**The one thing genuinely worth your attention is a shape, not a question.** Everything the game wants to build next is stuck behind the same missing step — somebody sitting down and designing it. Four separate items are waiting on exactly that and no automated lane can do any of them:

- the [dormant-hook definition](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) above;
- a ranked shortlist of which parts of the game get converted first, which [that question](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) expects to be handed;
- the [throwaway prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) you would react to;
- and [nations and named areas becoming real things the world simulates](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) rather than pictures, which you directed this morning.

The build queue is not empty — it has three items and the builder is busy — but it is being fed bug fixes and cleanup, not the program you actually asked for. The unblock is one attended design session, whenever you have the hour. Say *"design the dormant-hook definition"* or *"design nations and named areas"* and it starts there.

## T1 — unblock sweep

**Promoted 1** — [THR-995](https://linear.app/threadbare/issue/THR-995/adjacent-lair-spawning-is-unreachable-a-lair-is-always-too-close-to) (adjacent lair spawning unreachable) → `Ready for Dev`. State re-queried after the write and confirmed stuck; the `assignee` key is **absent on the `get_issue` re-query**, so `pull-work`'s `assignee:null` filter will see it; coordination block posted as the latest comment.

```
[orchestrator] T1 scan: Todo 18, Ready for Dev 3, In Dev 1, In Design 1, Idea 60+ (full scan, no recency window — run j's correction applied)
[orchestrator] T1 promote THR-995: blockedBy [] live, THR-817(Done) shipped its seam, 0 comments (no retire verdict), no plan doc named, defect re-verified against main@d0d1dba0 → Ready for Dev (project: Continuous Improvement)
[orchestrator] T1 skip THR-1052: mutex-by-sequencing with THR-1130's live rewrite of the same encounter files, and its art arm was answered in chat but never recorded here
[orchestrator] T1 skip THR-1088: same surface as THR-1048, which is In Dev right now — serialize, do not queue alongside
[orchestrator] T1 skip THR-1026: Done-when 1 is "a decision is recorded on which factions post ruin quests, in game terms" → creative fork, T2/Christian
[orchestrator] T1 skip THR-1155/1156/1002/1134/1114/175: wrong destination — design ticket, plan doc before code → T2
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried, still Idea
[orchestrator] T1 skip THR-902/907/1157/1161/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
```

**[THR-995](https://linear.app/threadbare/issue/THR-995/adjacent-lair-spawning-is-unreachable-a-lair-is-always-too-close-to) — an authored world-dynamics feature that has never fired once, and the promotion turns on a scope call worth recording.** The ticket is 11 days old, so the defect was re-verified against `main` at `d0d1dba0` rather than trusted. All three composing facts hold: `ADJACENT_SPAWN_MIN_SEPARATION = 3` (`lairEscalation.ts:52`); `lairExistsNearby` (`:131-142`) tests `< minDist` over a list that **includes the source lair**, called at `:377`; every `getHexNeighbors` result sits at Manhattan 1–2. So `spawnAdjacentLair` (`:228`, sole call site `:398`) is unreachable, and the file's own comment at `:212-219` says so and points at this ticket.

**Promoted as direction 1 (fix the guard) only — the fix-or-retire fork is not handed to the executor.** The ticket frames itself as a design question and the *retire* arm genuinely is one. Direction 1 is not: it restores an intent already recorded in the code. `LAIR_ADJACENT_SPAWN_CHANCE = 0.15`, the zone-eligibility rules and the separation rule were all authored deliberately and then silently never ran. A separation rule a lair fails against *itself* plainly means "not too close to a **different** lair". Repairing that is the *how* of an already-agreed design — the agent's call under `Docs/canon/process.md` § User review interface rule 4 — while deleting an authored feature would be a direction change and would go to Christian. Recorded on the ticket so the executor neither re-opens it nor escalates it.

The behaviour-change risk is handled by the ticket's own third Done-when, made binding in the block: a CLI sweep measuring lair count over ~200 ticks before and after, so the spread rate is a number rather than an assumption. If that number reads wrong, `LAIR_ADJACENT_SPAWN_CHANCE` is already a named constant (NFP #1) and tuning it is the executor's, not a re-opened fork.

Mutex **verified rather than inherited**: the body's "any ticket editing `src/engine/lairEscalation.ts`, none queued at filing" still holds — `git log` shows no commit touching that file since before 2026-08-10, the only `In Dev` claim is THR-1048 (UI, `EncounterVeil`), and the rest of the shelf is content/UI.

Declines, each naming its evidence:

- **[THR-1052](https://linear.app/threadbare/issue/THR-1052/27-card-imagetags-across-13-shipped-encounters-name-no-image-library)** (27 dead card `imageTag`s) — the closest thing to a second promotion, declined on **sequencing**, not on merit. Its own mutex names `src/data/encounters/**`, and [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) went claimable at 17:27Z with a batch-1 re-pass that re-authors exactly those cards. Repointing tags into prose about to be rewritten is work thrown away. Re-assess once the re-pass lands.
- **[THR-1026](https://linear.app/threadbare/issue/THR-1026/questhooksfindguildlocations-still-hardcodes-adventuring-guild-so)** (quest hooks hardcode `adventuring_guild`) — wrong destination. Its first Done-when is *"a decision is recorded on which faction definitions post ruin quest hooks... and why, in game terms"*, and the body asks whether a merchant consortium commissioning a ruin delve is even the right fiction. That is a creative fork with no agreed outcome — Christian's, not an executor's.
- **THR-1088** (legacy intervention row renders raw percentages, Law 13) — same `EncounterVeil` surface as THR-1048, which is `In Dev` right now. Queuing it alongside invites a collision on a file being actively edited; and THR-1121 may already have removed the branch it reports. Re-assess after THR-1048 merges.
- **THR-1155 / THR-1156 / THR-1002 / THR-1114 / THR-1134 / THR-175** — wrong destination; each body requires a design pass or plan doc before code. THR-1155 remains the standing top T2 candidate.
- **THR-1053** — unchanged from run j: it would narrow a gate across all 191 templates while THR-1130's batch-1 sample is mid-re-pass. Wrong order.
- **THR-1148** — four-option design fork, revisit predicate still unmet.
- **THR-1024** — prose gate *"do not start before THR-966"*; THR-966 re-queried live, still `Idea` since 2026-08-02. Unchanged for twelve runs.
- **THR-789 / THR-791 / THR-1043** — tracking epics / assigned. **THR-870** — parked by creative-director sequencing.

**Shelf at scan: 3 items** — THR-1133 and THR-1049 (both `Deferral`) plus [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), which returned from its park at 17:27:19Z, three minutes before this scan. **Non-`Deferral` count: 1.** Promotion ceiling (5/run, 1/run above a 15-item shelf) nowhere near reached; nothing held back.

**The `Idea` recency window flagged by run j is dropped, and it paid immediately.** Run j observed that recent runs were in practice applying a recency filter to the `Idea` half of the T1 scan, which structurally cannot see an older ticket. This run scanned `Idea` unfiltered (60+ items). THR-995 was filed 2026-08-06 and had sat eleven days — invisible to every recency-windowed scan since. Logged for the weekly retro, not filed; the fix is a scan habit, not a code change.

**One flow observation, logged not filed.** THR-1052's blocking question — generate the ~12 missing art plates or remap onto the 16 that exist — **was put to Christian on 2026-08-15 and answered in chat**, per the `daily-backlog-grooming` correction of 08-16 (*"That comment parks on two questions. Both were answered by Christian in chat overnight"*). Which arm he chose was never written down anywhere, and THR-1052 still carries zero comments. So a settled decision reads as an open design call on the only ticket that needs it. Cost so far is one deferred promotion, below the materiality bar; the general shape — a chat ruling recorded on the *asking* ticket but not the *asked-about* one — is worth the retro's attention.

**Product-vs-process ratio, week of 2026-08-10 → 08-17: ~5:1 product**, carried from runs d/i rather than re-derived — nothing in the last hour moves a seven-day ratio. This run's single promotion is an engine gameplay defect (an authored world-dynamics feature that never fires), not delivery machinery, so it does not draw on the one-process-ticket-per-three-runs budget. The throttle is holding; no corrective action indicated.

## T1.5 — wayfinder sweep

**Two open maps, label-filtered rather than inferred. Zero AFK tickets exist to burn down — 0 of `ORCH_WAYFINDER_AFK_MAX` (2) spent, unspent because the work is not there rather than because it was skipped.**

**[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Six children re-listed live: **3 `Done`** (THR-1158, THR-1159, THR-1160), **3 open, all HITL** — and the reading of one of them is corrected this run:

- **[THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** (`wayfinder:grilling`) — **not a live ask, contrary to run j.** Its 13:59Z comment records Christian's own Discord direction that the technical definition must be authored first and he rules on *that*; the PM lane removed it from `Design/briefing.md` at 13:55. Run j reinstated it as the headline ask two hours later without reading the ticket's comments. This is the THR-990 class exactly — a met blocker is not a live premise — arriving on the surfacing side rather than the promotion side, where the skill's rule currently only binds T1. Worth the retro's judgement: the "read the latest comment first" discipline should cover anything this lane puts in front of Christian, not only anything it promotes. The ticket also acquired an assignee at 17:28:50Z with no accompanying claim comment; noted, not acted on — a grilling ticket is unresolvable by any agent whatever its assignee says.
- **[THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)** (`wayfinder:grilling`) — unblocked, but expects an agent-prepared ranked slate that does not exist.
- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — unblocked, but nothing has been built to react to.

**[THR-902 — Encounter experience redesign, vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Eight children: **7 `Done`, 1 open** — [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`, HITL). Unchanged.

**The structural finding hardens.** Across both maps every open child is grilling or prototype, and **three of the four are stalled on artifact preparation rather than on a decision** — a definition to be written, a slate to be ranked, a prototype to be built. All three are agent-doable design-session work; none is reachable by this lane, because their HITL labels put them out of reach and this lane does not author. That is the same wall T2 hits from the other side, and it is now the dominant constraint on the whole board. Logged for the weekly retro rather than filed (scheduled lanes do not file process tickets); the practical unblock costs one attended session.

## T2 — design staging

**Triggered, and bound — for the eleventh consecutive run.** Shelf held **1 non-`Deferral` item** at scan (THR-1130, returned from park at 17:27Z), below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's promotion does not clear it either: THR-995 carries the `Deferral` label.

**Nothing staged**, because `In Design` already holds **1** issue — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). Staged 2026-08-15T20:29Z; the 48h re-surface clock expires **2026-08-17T20:29Z**, so the first run after that re-surfaces it rather than re-staging. This run is ~3h short.

Candidate ranking unchanged: **THR-1155** (nations and named areas) remains the top candidate; then **THR-1134** (shareable game-state snapshot); then **THR-1002** and **THR-1114** as feature-class work sorting below the architecture program under the architecture-first ruling. Newly joining the queue behind them, from T1.5: the dormant-hook **definition pass** that THR-1161 now waits on.

The binding constraint remains **design supply** plus the `In Design` bound, not a shortage of candidates — and T1.5 now supplies three more items waiting on the same missing step. This lane deliberately does not author plan docs (Christian's ruling, 2026-08-06).

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local) and carried the full detector pass. The Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health pass also ran with it; confirmed present on `ops` as `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none is reported as clean.** Run d's standing set is carried explicitly **unverified**: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No fresh judgement pass happened and none is claimed.

**Stalled-work check ran** — it reads `stateHistory` already fetched this run, so it costs nothing. THR-995 has exactly one transition (`Idea → Ready for Dev`, this run). THR-1130 has run `Ready for Dev → In Dev → Ready for Dev` once, with the return an explicit park release rather than a failed pickup. THR-1165 ran `Idea → Ready for Dev → In Dev → Done` once. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

None. No question was asked on Discord and nothing was parked.

**The standing THR-1130 park note is retired — the park lifted during this hour and the resolution is worth recording, because it was a deadlock that no blocker field could express.** Run j carried it as "waiting on Christian's verdict, re-check once THR-1165 merges". THR-1165 merged at 16:31Z; at 17:27Z an attended session released the park with the correct diagnosis: **the verdict had been sequenced behind the ticket's own next action, so the park was waiting on itself** — 44 hours, flagged by the hourly brief. The next action (the batch-1 prose re-pass to the plainness and density bars, chip copy state-first, remove the authored `reputation_tally` chip) needs nobody's approval and is claimable now. THR-1130 is `Ready for Dev`, `assignee` absent, and is the only non-`Deferral` item on the shelf.
