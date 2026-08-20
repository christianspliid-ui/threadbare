---
lane: daily-backlog-grooming
run: 2026-08-20
promoted: 0
filed: 0
resolved: 0
swept: 3
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-08-20

## Needs Christian
Nothing new from this run. The five standing asks are correctly routed and carried by the 08:57 briefing — verified independently rather than restated: both parks hold the `assignee: null` ∧ `In Dev` shape, and `ops` last published 20 minutes before this run.

Concurring with the briefing's ordering, from the queue side: **resuming the two paused lanes does not by itself refill the shelf.** All four ready jobs are Low-priority cleanup — roughly two runs of work — and nothing sits in design behind them. The wave-1 sitting ([THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)) is the only queued item that converts into new buildable work. Recommend the sitting first, lanes second.

## Work in flight
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** (High) — 6 of 15 retrofitted and shipped, batch-1 re-pass live on the deploy. Parked since 08-17 on the 2-of-6 sample verdict; camp seven + sequels remain. Correctly parked, not stalled.
- **[THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)** (Low) — half shipped (registration cue retired); parked since 08-18 on one feel question. Either answer closes it.

## Technical gates resolved this run
None outstanding — no upstream-shipped misses, no stale In Dev, no missed auto-close.

## Counts by state
Idea 72 · Todo 19 · In Design 2 · Implementation Planning 0 · Ready for Dev 4 · In Dev 2 (both parked)

## Problems found and fixed
- No orphan issues — every issue in every state carries a project. No orphan deferrals in code: 0 `TODO`/`DEFERRED` comments in `src/` lack a `THR-` id.
- All 4 Ready-for-Dev deferrals are claimable — Done-when plus a full T1 coordination block on each (THR-1183, THR-1184, THR-857, THR-1133).
- Roadmap cross-reference: `.planning/ROADMAP.md` Future Work is fully tracked (TB-095→THR-74, TB-099→THR-724, rival activation→THR-66, all Done; phases 3/4/5→THR-54/55/56; Codex→THR-52). Nothing to file.
- **New finding, left standing:** project *Plan Cross-Linking Infrastructure* (Idea/Low) holds zero issues in any state, archived included. Closing it is churn with no cost either way — flagged so it is not rediscovered.
- **THR-1133** is Ready for Dev but needs an attended dev-server session, so no scheduled lane can take it. Correctly placed and already surfaced — noted so its age is not misread as a stall.

## Materiality sweep
In-scope: 3 (THR-1190, THR-1134, THR-1114). **Canceled 0, consolidated 0** — the sweep ran, nothing failed it.
- **THR-1190 stands** — clears the bar on recurrence: 6 logged occurrences, 3 inside the 7 days to 08-19, measured costs (~35 min, and ~47 min of a finished ticket's question invisible to Christian), cost/benefit line present.
- **THR-1134 stands** — in scope only by project. Product carve-out: a UI+Engine ticket for a player-reachable control, filed at Christian's request. Its cost line is missing, but Rule-0 demotion targets process tickets; demoting a director-requested feature reads the rule against its purpose.
- **THR-1114 stands** — in scope only by the `Improvement` label. Same carve-out: two templates claim a Sphere the twelve-Sphere cosmology lacks, `sphereAffinity` is read by prerequisites and scoring, and the Codex renders it. Content correctness, not process.
- Doubt recorded: THR-1134's home in *Continuous Improvement* is what pulls a feature into this sweep daily. Not re-homed — no better project exists and the churn outweighs the noise.

## Pipeline status
Nothing is close to Ready for Dev: Implementation Planning is empty and both In Design items (THR-1002, THR-790) await Christian. Recommended next pickup when the lanes resume: **THR-1183** — the deepest of the four, unblocked, with a real judgement call. But the shelf is cleanup-only, and the fix for that is upstream supply, never more downstream tidying.
