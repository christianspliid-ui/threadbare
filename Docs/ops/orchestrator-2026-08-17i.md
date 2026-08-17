---
lane: tb-orchestrator
run: 2026-08-17i
promoted: 1
filed: 0
resolved: 2
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run i, ~14:36Z)

## Needs Christian

**The new architecture map is now fully open, and it is waiting on you rather than on any agent.**

This morning's chip pilot finished landing — four merges between 09:40 and 13:34 — and I spent this hour reading what it actually taught us. That answered the last question on the map that could be answered without you. **Three questions are now ready, and they are one sitting, not three errands.** Say *"work the typed-state map"* when you have an hour.

In the order they want answering:

1. [When the world quietly records something about a person, when does the player get told?](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) — unchanged from earlier today, still the one that unlocks the rest. You have ruled twice in two directions and they need reconciling: reach-reputation tallies are the game's private bookkeeping, invisible but still steering who trusts whom (2026-08-16), while a recording that could become a future story hook is one where *"we need to make it clear to the player that that is what has happened"* (2026-08-17). Three classes are proposed — **acted-on** (something reads it now, player sees it in full), **dormant hook** (recorded for a story not yet written, player is told it was noted), **bookkeeping** (the machine's ledger, invisible by design).
2. [Which parts of the game get fixed first, and in what order](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) — **newly unblocked by this hour's work.** Two things you should know walking in. Its own title still says the wave should be ordered "features-first", which is the answer you *reversed* the same afternoon in favour of architecture-first; I flagged that on the ticket rather than quietly rewriting your question. And it expects an agent to bring you a ranked shortlist first — that shortlist does not exist yet, and building it is design-session work, so this question is genuinely third in line, not second.
3. [React to a rough prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) — also newly unblocked, but **nothing has been built for you to react to.** Same situation as above: somebody has to make the throwaway version first.

**What the pilot taught us, in plain terms, because it changes the shape of the work you are about to order.** The rule you ratified this morning was that every consequence chip has to point at something real in the world. Reading the 48 chips that got sorted: almost none of them were lies — only one named a thing that did not exist. But **44 of 48 could only be pointed at the *person* involved rather than the thing the sentence actually named** — the sack of grain, the gift, the road — because those things have no identity the game can hold onto. That is technically compliant and quietly flatter: the world's consequences all end up pointing back at whoever was standing there. Worth knowing before you decide how much of the game to convert, because the fix for it is a separate piece of work nobody has scheduled.

The other finding is cheerful: **the expensive part was building the machinery, and it is built.** Converting a further area costs a few lines per chip. What it really costs is *rewriting prose* — two thirds of the sentences needed rewording so the noun named something real. So the honest way to size the remaining work is "how much of this area's writing already names real things", not "how many chips".

Your slice-verdict session ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)) is still open and already in your briefing — not restated at length here, because leading with four asks is how all four get skipped.

**Nothing else needs you.** One bug went into the build queue this hour and the executor picked up and finished the previous one while I worked.

## T1 — unblock sweep

**Promoted 1** — [THR-1165](https://linear.app/threadbare/issue/THR-1165/two-dollarcast-sentinels-resolve-to-nothing-at-runtime-the-caravan) (two `$cast:` sentinels resolve to nothing at runtime) → `Ready for Dev`. State re-queried after the write and confirmed stuck; the `assignee` key is **absent on the `get_issue` re-query**, so `pull-work`'s `assignee:null` filter will see it; coordination block posted as the latest comment.

```
[orchestrator] T1 scan: Todo 20, Ready for Dev 1, In Dev 2, In Design 1, Idea≤72h/active-project 1
[orchestrator] T1 promote THR-1165: blockedBy [] live, no prose/time gate, no plan doc named (THR-921 passes trivially), 1 comment carrying no retire verdict → Ready for Dev (project: Encounter Experience)
[orchestrator] T1 skip THR-1155: no blockers, but body states "this is a design ticket — plan doc before code" → T2
[orchestrator] T1 skip THR-1156: program epic, director ratification, needs design → T2/map
[orchestrator] T1 skip THR-1148: design fork, four options, no agreed outcome; its own recommendation already shipped
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried, still Idea
[orchestrator] T1 skip THR-1157/1160/1161/1162/1163/902/907: wayfinder:* labels → T1.5, never Ready for Dev
```

**The promotion.** THR-1165 was filed into `Idea` at 13:27Z by the executor that found it while landing THR-1164 — a genuine player-visible defect, not tidying: `$cast:keeper` and `$cast:trader` resolve to `undefined` at runtime, so the bond to the caravan master and the mark on the swindler are **silently never written**, while the chips above them claim both. It arrived with a coordination block already attached (THR-836 working as intended), so this promotion added evidence rather than authoring the block from scratch.

**One thing changed between the filing and the promotion, and it mattered.** The executor's block said *"serialize behind THR-1164 if it has not merged at pickup."* THR-1164 merged at 13:34Z, seven minutes after the ticket was filed — so that condition is discharged, and the classifier plus the whole-catalog runner this ticket builds on are on `main`. Recorded in the promotion comment so the executor does not serialize behind a merged ticket.

**Mutex handled, not reversed.** `Mutex with: THR-1130` (both edit `src/data/encounters/vertical-slice.ts`) carried forward verbatim. One fact added for the executor to weigh at pickup: THR-1130 currently reads `assignee: null` ∧ `In Dev`, which is a park, so the file is not being actively edited right now. The stated reason still holds if the park lifts mid-work — that is the executor's call at claim time, not a reversal by this lane.

Declines, each naming its evidence:

- **THR-1155** (nations and named areas as real game objects) — wrong destination, not an unmet blocker: `blockedBy: []`, but the body reads *"this is a design ticket — plan doc before code"*. T2 input, and still the standing top T2 candidate.
- **THR-1156** (typed game-state program epic, `Urgent`) — tracking epic for the THR-1157 map; not executor queue work.
- **THR-1148** (`agent_relocation` steers weakly) — unchanged from run h: the THR-1145 half of its revisit trigger cleared at 04:38Z, but the actual predicate is the Consequence Draw putting `movement` in hands that did not choose it *at authored volume*, and no encounter has yet been authored through the draw. Beyond that it is a four-option design fork with no agreed outcome.
- **THR-1024** (DetailModal a11y) — prose gate *"do not start this before THR-966"*. THR-966 re-queried live: still `Idea`, unstarted since 2026-08-02. Unchanged for ten runs.
- **THR-1114** (`sphereAffinity` `shadow`/`void`) — standing wrong-destination verdict in its own body: *"There is no agreed outcome to test against."*
- **THR-1134** (shareable game-state snapshot) — wrong destination; its body says the design session that picks it up authors the coordination block at handoff.
- **THR-1002** (card grammar) — *"This is a design ticket — it needs a plan doc before code."*
- **THR-175** (`agent.sphere` field) — unmet trigger gate; requires a design doc first regardless.
- **THR-789 / THR-791 / THR-1043** — tracking epics / assigned to Christian.
- **THR-870** (sphere-governance pivot) — parked by creative-director sequencing. Not this lane's call.
- **THR-902 / THR-907 / THR-1157 / THR-1160 / THR-1161 / THR-1162 / THR-1163** — `wayfinder:*` → skipped unconditionally in T1, handled in T1.5.

Shelf at scan: **1 item** (THR-1133, a `Deferral`) → **0 non-`Deferral`**. Promotion ceiling not reached and not applicable; nothing held back by it.

**The queue is thin because execution is fast, and this hour is the clean proof.** Run h promoted THR-1140 at 12:31Z; the executor claimed it, and it completed at **14:28Z via PR #1524** — inside two hours, while this run was scanning. My promotion landed into the freed slot about a minute later. Five tickets (THR-1153, THR-1154, THR-1164, THR-1140, THR-1147) have completed since midnight. Nothing is stuck; supply is the constraint, not throughput.

**Product-vs-process ratio, week of 2026-08-10 → 08-17: re-counted this run rather than carried, ~5:1 product** (up from run d's ~3:1). Of ~47 completions inside the window, ~8 were delivery-machinery process items (THR-1065, 1089, 1112, 1117, 1128, 1132, 1058, and one borderline). Two caveats stated rather than hidden: Linear's `updatedAt: -P7D` filter returns items completed well outside the window, so the window was applied to `completedAt` by hand; and the result paginated, so the tail may add a few. The throttle is holding comfortably and no corrective action is indicated. Exactly one item entered the queue this hour, on its own `Medium` priority, with no flow-impediment claim.

## T1.5 — wayfinder sweep

**Two open maps (label-filtered query, not inferred from the Todo scan). One AFK ticket resolved — the first in this map's life — and the frontier changed shape as a result.**

**[THR-1157 — Typed game-state architecture: machinery + first wave](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Six children re-listed live: **3 `Done`, 3 open** after this run's work.

**Resolved: [THR-1160](https://linear.app/threadbare/issue/THR-1160/pilot-learnings-what-the-chip-migration-proved-or-changed-before-the) (`wayfinder:research`, AFK).** Claimed at 14:28Z (verified), research subagent dispatched against the shipped diffs and PR bodies, resolution posted 14:35Z, closed `Done` 14:35Z (verified via `get_issue`), decision line appended to the map's *Decisions so far*.

Why it was resolvable this hour and not before: the 11:30Z blocker comment set the condition *"unblocks when THR-1153 and THR-1164 are both `Done`."* THR-1154 went `Done` 09:40Z, THR-1153 11:34Z, THR-1164 13:34Z. All three read `Done` live at scan. **Run h was right to hold it** — resolving it then would have produced a confident answer about a migration ratio that had not been measured yet, which is exactly the failure that comment was written to prevent.

The four findings, evidence-backed with sources on the ticket:

1. **The typed shape survived unchanged** — `git diff --stat` on `src/types/unifiedAction.ts` across the pilot returns **empty**. Zero authored fields added, renamed or dropped; what changed is that `entityId` may now carry a sentinel. Three deltas against the proposal are recorded, including one **content-visible downgrade**: the proposal's attachment-template anchor shipped on *zero* chips, and five chips instead lost fidelity (`artifact` + a real name → `agent` on the carrier).
2. **The ratio: 44/48 bind (92%), 4/48 static anchor (8%), 0/48 fold** — the pilot's only fold sits outside the 48. Fiction was rare (~2%), but only 10% anchored the object the sentence actually named.
3. **The gate did need live-world context, and the boundary is now explicit in code** — well-formedness is statically checkable; whether a faction *node* exists in this world, whether `actorId` is present, whether a support *binding* was produced are not. THR-1165 sits exactly on that boundary and cuts both ways: the static check caught the chip anchors, and the same sentinels remain live as effect targets writing nothing while passing clause 1.
4. **Cost is prose, not chips** — ~2,100 one-time machinery lines that do not recur per seam; ~3.1 marginal lines/chip; the real tax was rewriting 23 of 29 slice nouns versus 0 of 19 mechanical faction chips.

**Two gaps were stated rather than filled**, which is the half that makes this a usable resolution: per-chip wall-clock was never instrumented and cannot be split out of the ticket's 2h16m span; and the ratio is untested on the 437 older-shape chips that declare no referent — where a wave-1 seam most likely lands. A cheap pre-check that would answer both before the wave-1 sitting is recorded on THR-1163.

**Frontier after the resolution — 3 tickets, all HITL, so this lane can take none of them:**

- **[THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** (`wayfinder:grilling`) — `blockedBy: []` confirmed live. Standing headline ask, restated above because `keep-work-flowing-cc` reads only the newest sibling report.
- **[THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)** (`wayfinder:grilling`) — **newly unblocked by this run** (both blockers now `Done`). A note was posted on it, deliberately not a resolution, carrying three things: its title and body still frame the question *"under the features-first rule"*, which the director **reversed the same day** to architecture-first (left uncorrected in the description — rewriting his question is the sitting's business); the pilot's cost numbers criterion (c) asked for now exist; and it expects an agent-prepared ranked slate that does not exist yet.
- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — **also newly unblocked**, and run h's reading of it needs correcting: its live `blockedBy` is **THR-1159** (`Done` 08:12Z), not THR-1164. So it has been unblocked since this morning, not blocked by the split.

**One structural observation, logged not filed** (process-work throttle — scheduled lanes do not file process tickets): two of the three frontier tickets are stalled on **artifact preparation, not on a decision**. THR-1162 needs a throwaway prototype built before there is anything to react to; THR-1163 needs a ranked slate. Both are agent-doable, and neither is doable by *this* lane, because both carry HITL labels that put them out of reach. The map can therefore sit "fully open" while two of its three open questions are un-askable. Not a defect in any ticket — a gap between what the wayfinder labels authorise and what the tickets ask for. Recorded for the weekly retro to judge; the practical workaround costs nothing, which is that an attended design session builds both.

**[THR-902 — Encounter experience redesign, vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Children re-listed live: **8 children, 7 `Done`, 1 open.** The one open child is [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`, HITL, assigned to Christian) — the standing slice-verdict ask, carried in the briefing.

**AFK burn-down: 1 of `ORCH_WAYFINDER_AFK_MAX` (2) spent.** The second slot went unspent because no second AFK ticket exists: across both maps there is now **zero** open `wayfinder:research` or `wayfinder:task` ticket. Every remaining open child on either map is grilling or prototype.

## T2 — design staging

**Triggered, and bound — for the ninth consecutive run.** Shelf held **0 non-`Deferral` items** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's THR-1165 promotion does not clear it either — THR-1165 carries the `Deferral` label, so the non-`Deferral` count is still 0 after the write.

**Nothing staged**, because `In Design` already holds **1** issue — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). Staged 2026-08-15T20:29Z; the 48h re-surface clock expires **2026-08-17T20:29Z**, so the first run after that re-surfaces it rather than re-staging. This run is ~6h short.

**Candidate ranking, with one change of reasoning:**

1. **[THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)** (nations and named areas as real game objects) — top candidate; High, director direction, explicitly needs a plan doc. **The caveat is now sharper, not merely repeated.** Its position in the wave is THR-1163's call — and THR-1163 became answerable this hour, so the reason to hold this back has shifted from "blocked three deep" to "one sitting away". It also acquired a live technical dependency: the pilot's carrier finding means a nations/named-areas design must decide whether region identity gets a real anchorable id or inherits the carrier flattening.
2. **[THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** (shareable game-state snapshot) — unchanged and still valid.
3. **[THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** and **[THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere)** — feature-class, below the architecture program under the morning's architecture-first ruling.

The binding constraint remains **design supply** plus the `In Design` bound, not a shortage of candidates. This lane deliberately does not author plan docs (Christian's ruling, 2026-08-06).

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local) and carried the full detector pass plus the Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health file, which is confirmed present on `ops` as `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none are reported as clean.** Run d's standing set is carried explicitly **unverified**: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No fresh judgement pass happened and none is claimed.

**Stalled-work check ran** — it reads `stateHistory` this run already fetched, so it costs nothing. THR-1165 has one transition (`Idea → Ready for Dev`, this run). THR-1130 has one `Ready for Dev → In Dev`. THR-1160 has one (`Todo → Done`, this run). THR-1153's two `Ready for Dev → In Dev` transitions both ended in a merge, so they are not stalled claims. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

None. No question was asked on Discord and nothing was parked. Every decline named its evidence; the genuine asks went to `## Needs Christian` as one sitting rather than three errands.

**One standing note, carried because it is read wrong from the state alone — and it moved this hour.** **THR-1130** shows `In Dev` but is a **park** (`assignee: null` ∧ `In Dev`, verified live), waiting solely on Christian's 2-of-6 batch-1 sample verdict. It is not the executor's active claim, so WIP=1 is intact. What moved: the map records that verdict as *held until the pilot's fixes are applied to the sample encounters*, and the pilot's fixes landed today across the slice templates that **are** the sample encounters. So that hold condition is close to discharged — **but not cleanly**, because THR-1165 is an outstanding pilot-surfaced defect sitting in exactly those slice templates. Deliberately **not** surfaced to Christian as "your verdict is ready": inviting the sitting and being wrong wastes the sitting. The next run should re-check once THR-1165 lands, and that is when it becomes an ask.
