---
lane: tb-orchestrator
run: 2026-08-17m
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run m, ~19:30Z)

## Needs Christian

**The two encounters you asked to see again are live, corrected, and waiting for you to play them. This is the ask that was deliberately held back last hour.**

Your instruction was that the sample does not come back until the rewrite is visibly live on the deployed build. That condition was met at 19:05Z and checked rather than assumed — the live site is serving the exact build with the fixes in it. So the question is open now:

**The Grateful Kin** — the one whose bond chip you said did not communicate a state change.
- [Play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [the good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [the bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)

**The Unsafe Bridge** — the one that prompted your "prose and chips are one package" ruling.
- [Play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [the good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [the costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

Three things changed since you last played these. The bond chip now names who owes whom and clicking it opens the person who owes it, instead of pointing back at you. Fifteen chips that reported numbers you could not see are gone — you flagged one, and looking for the pattern found fourteen more, all of which had passed every check because the rule was written down but nothing enforced it. And the prose carries fewer things at once: one named person on stage, props only where you can act on them.

**The one question: are these two worth meeting a second time?** A yes releases the next nine encounters. A no tells the builder what the bar is still missing before nine more get written against it. [The ask is on the ticket](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) with the full detail.

**Still true from last hour, and still the bigger lever:** the [typed-state program](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) is waiting on one write-up — the shared machinery your acted-on/bookkeeping/hook ruling feeds into. Say **"design the shared machinery"** and a session starts there. Not restated further; it has not changed since 18:32Z.

**Nothing else needs you.** One tooling defect went into the build queue after being re-checked and found worse than filed; the builder picked up the next item at 19:27Z and is working.

## T1 — unblock sweep

**Promoted 1**, verified after the write. The value this run is in *what the verification found*, not in the count.

```
[orchestrator] T1 scan: Todo 17, Ready for Dev 3 → 4 (all Deferral), In Dev 2 (one is a park, see below), In Design 1, Idea 79
[orchestrator] T1 promote THR-1032: blockedBy [] live via includeRelations, BOTH findings re-verified at source against main@ef7f5eb5 and finding 1 found WIDER than filed, latest comment = filing block (no retire verdict), no plan doc named, mutex re-derived not inherited → Ready for Dev (project: Encounter Experience)
[orchestrator] T1 skip THR-1052: wrong destination — the body names two candidate fixes and calls the choice "a design call" (repoint vs. generate an art batch) → T2. Its sequencing half genuinely cleared this run and is recorded below; the design fork is why it still does not promote.
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried live, still Idea since 2026-08-10. Unchanged for fourteen runs.
[orchestrator] T1 skip THR-964/THR-1094/THR-1095: wrong destination — each opens "a decision is recorded" → T2, unchanged from run l
[orchestrator] T1 skip THR-1155/1156/1002/1134/1114/175: wrong destination — design ticket, plan doc before code → T2
[orchestrator] T1 skip THR-1026/1053/1148: creative fork or wrong order, unchanged
[orchestrator] T1 skip THR-902/907/1157/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 note THR-1130: In Dev + assignee null = the documented park shape, not a WIP breach. Not a T1 candidate.
```

### [THR-1032](https://linear.app/threadbare/issue/THR-1032/two-debug-aftermath-accessors-cannot-see-the-ascendant-avatar) — promoted, and the re-verification made the ticket bigger

Filed 2026-08-08 and sat nine days, so both findings were re-checked at source before promoting rather than trusted. This morning that same discipline caught THR-1088 already fixed and stopped a wasted queue slot; here it went the other way.

**Finding 2 confirmed, with the ticket's wording corrected.** `getAllNodes` has zero definitions in `src/engine/graph.ts` and exactly one call site in the tree — `src/debug-bridge.ts:1553`, inside `consequencesFor`. But it sits on the right of a `??`, so it short-circuits on an exact node id and throws for everything else. The ticket says *"throws for every argument"*; the accurate predicate is *"throws for every argument that is not an exact node id"* — which still covers the documented `@hero` alias and the whole partial-name-match path the function exists to provide. Recorded on the ticket so the fixer does not read the overstatement, find one working case, and close it short.

**Finding 1 confirmed, and the cause is not the one the ticket guessed — it is wider.** `resolveAgentId` (`GameView.tsx:2918-2926`) matches on exact id, id-prefix, and `node.properties.name`. But `GraphNode` declares `name` as a **top-level field** (`src/types/graph.ts:12`), not a member of `properties`. So that third arm reads `undefined` on every node, collapses to `''.includes(query)`, and returns false for any non-empty query. **The name-match arm is dead for every actor in the game, not only the avatar** — which is exactly why `Vara` and `Vara Enkhet` failed alongside `@hero` in the original finding, a detail the ticket recorded without explaining. Separately there is no `@hero` alias resolution on this path at all.

So the ticket is not "an accessor cannot see one actor class". It is one dead code path plus one missing alias, both small. The untyped `properties` bag is why `tsc` cannot see the first — which makes this a live, small instance of the argument the `Urgent` [THR-1156](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) program is built on.

**Called what it is: process work, not product.** It is developer tooling. What earns it the slot is that it sits *under* the live program rather than beside it — `?spawn=` routes stage every encounter on the avatar, these are the two accessors a reviewer reaches for on that route, and the encounter-review loop is what the director is using this evening. The failure text (`No agent matching`) reads as caller error, which invites a guess-more-ids loop; the original finding burned six spellings before concluding the accessor was broken.

**Mutex re-derived, not inherited.** The filing block's "none" is nine days old and predates every current in-flight item. Live derivation: mutex with THR-1049 only, and conditionally — its "wire or retire" call touches `GameView.tsx` if it lands on *wire*, and is void if it lands on *retire*. THR-995 is worldgen, THR-1130 edits the encounter data files, THR-1091 edits the meeting library and its polarity test, THR-1133 captures screenshots.

**One caution carried onto the ticket,** because it decides whether the fix is real: this ticket's subject *is* the browser bridge, so a jsdom fixture cannot discharge it. A fixture that builds its own agent collection passes while the live avatar still fails — the exact vacuous-gate shape the ticket belongs to. If an unattended run cannot start a dev server, the honest move is to record that the live check was not run, not to substitute a green fixture.

### [THR-1052](https://linear.app/threadbare/issue/THR-1052/27-card-imagetags-across-13-shipped-encounters-name-no-image-library) — the hold changed, the verdict did not

Worth separating, because run l declined it on a reason that has now expired and the ticket still should not promote. Run l's stated hold was sequencing — THR-1130 was re-authoring exactly those cards. That re-pass merged as PR #1528 and THR-1130 is now parked, so **that hold is gone**. Its actual declared mutex is THR-929, which is `Idea` and not in flight either.

It still does not promote, on the reason that was always the load-bearing one: the body names two candidate fixes and says in as many words that the choice is *"a design call"* — repoint 27 dead tags at the nearest existing rows (free, immediate, some concepts have no good match) or generate ~27 new art rows (an art batch). The Done-when is satisfiable either way, and an executor picking silently would be choosing content direction. That is T2 input, not a queue item. Recording it because a decline that keeps its reason after the reason changes is how a stale hold becomes permanent.

## T1.5 — wayfinder sweep

**Two open maps. Zero AFK tickets exist — 0 of `ORCH_WAYFINDER_AFK_MAX` (2) spent, unspent because the work is not there rather than because it was skipped.** Confirmed from the state-filtered scans this run rather than inherited: the only open `wayfinder:*` children anywhere on the board are the three below, and none carries `wayfinder:research` or an agent-doable `wayfinder:task`.

**[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Four of six children `Done`. Frontier is two, both HITL, both unblocked, and both waiting on an artifact nobody has produced rather than on Christian:
- **[THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)** (`wayfinder:grilling`) — wants a ranked seam shortlist that does not exist.
- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — wants the throwaway built before there is anything to react to.

One small thing this run adds to that map rather than to the queue: THR-1032's finding 1 is a **concrete, verified instance of the seam THR-1163 is trying to rank** — an untyped `properties` bag silently swallowing a field that is actually top-level, invisible to `tsc`, dead for nine days across every actor in the game. It is evidence for the shortlist, logged here rather than filed, per the process throttle.

**[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Eight children, 7 `Done`, 1 open — [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`, HITL). Unchanged, and *not* re-surfaced to Christian this run: it is already in his briefing, and the batch-1 sample ask above is the live version of the same conversation.

## T2 — design staging

**Triggered, and bound — for the thirteenth consecutive run.** Shelf holds **0 non-`Deferral` items**; this run's promotion does not change that, since THR-1032 carries `Deferral` too. Below `ORCH_PROGRAM_WORK_FLOOR` (2).

**Nothing staged**, because `In Design` already holds **1** — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1).

**One timing note for the next run.** THR-790 was staged 2026-08-15T20:29Z, so its 48h re-surface clock expires **2026-08-17T20:29Z** — roughly 59 minutes from now, and the next run fires at about 20:27Z. That is two minutes short by the cron and inside the jitter either way, so run n should compute the expiry rather than assume it, and re-surface (not re-stage) if it has passed.

**Candidate ranking, unchanged from run l:** the **shared-machinery plan doc** first — every input it needs now exists and it unblocks both THR-1157 frontier tickets at once — then [THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to), then THR-1134, then THR-1002 / THR-1114, then the design forks T1 has routed here: THR-964, THR-1094, THR-1095, and now **THR-1052** (the art repoint-vs-generate call above).

The binding constraint remains **design supply plus the `In Design` bound**, not a shortage of candidates. That queue grew by one this run and shrank by none.

**Product-vs-process ratio, as the Rule-0 discipline requires.** Everything completed today was process, infrastructure or deferral-class work, and every one of the 4 items now on the shelf carries `Deferral`. **The headline finding is unchanged and is not a request for more cleanup: the feature shelf is empty, and the fix is upstream — design supply, which means the shared-machinery write-up above.** This run promoted one process item, which is the per-run ceiling for a starved shelf, and deliberately did not go looking for a second.

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` (06:00 local) and carried the full detector pass; the Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health pass ran with it and is on `ops` as `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none is reported as clean.** Run d's standing set is carried explicitly **unverified**: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** No fresh judgement pass happened and none is claimed. (THR-1032's dead name-match arm is a *correctness* defect, not a second implementation of one job — it is not offered as a redundancy finding.)

**Stalled-work check ran** — it reads `stateHistory` already fetched this run, so it costs nothing. THR-1032 has exactly one transition (`Idea → Ready for Dev`, this run). THR-1130's history shows a park and a park-release, not repeated failed pickups. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

## Escalations

**None asked, none parked.** Agreed work is not exhausted — T1 had a promotable item and took it, and T2's queue is long. No Discord question was needed this run.

**One observation recorded rather than escalated,** because it is a technical verdict and those are the agent's to make: two issues read `In Dev` simultaneously, which looks like a WIP=1 breach and is not. [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) is `In Dev` with a **null assignee** — the documented park shape — with its 19:05Z comment stating plainly that nothing is in flight and the next step needs Christian's verdict. [THR-995](https://linear.app/threadbare/issue/THR-995/adjacent-lair-spawning-is-unreachable-a-lair-is-always-too-close-to) went `In Dev` at 19:27Z with an assignee. So the executor holds exactly one live claim. Worth stating because the park shape is fragile: a null assignee that silently repopulates would make a finished, waiting-on-Christian ticket invisible to the lane that surfaces it (THR-1058). It held this run.
