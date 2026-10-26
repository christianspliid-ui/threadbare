# Action proposal — 2026-10-26-thr-2059-the-path-steers

## intent_quote

There is no live user ask. This is an unattended design-lane run (tb-design-lane, run 2026-10-26d) under Christian's delegation of 2026-09-25 (THR-1611):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

The work item is the round-5 cold-playtest ticket THR-2059, filed by the playtest lane. Its design question and recommended direction, verbatim:

> **Design question.** Once the player says "Morthane will become the unseen blade", what should make the next hour feel like an unseen blade's life: chapter selection weighting the path, God's Will offering only path-shaped work, or both? And when the god compels a piece of work, how does its result come back to the player?

> **Recommended direction.**
> 1. Leave routine chores out of God's Will candidates; offer work that can raise a chapter.
> 2. When a compelled target resolves, it always reports one line back ("Morthane serviced the dead drop; no one saw").
> 3. Give the chosen path a positive weight in chapter scoring (bounded, a named constant), so the path's own chapters come first.

> **Fixed when** a round-6 tester who chose a path names at least one later chapter or God's Will option that fits it, and no tester reports compelled work that vanished.

> **Done when** this ticket's implementation tickets are filed into this milestone (*Cold playtest · round 5*) and this ticket is closed by the design pass.

## scope (what this plan does)

It designs one implementation slice (S1). God's Will (the compulsion premonition) stops offering routine chores and fills from the ranked list. A compelled scene's resolution pushes one toast naming its band. The First's chosen path (its two Reaches) gets a ×1.5 lean, applied on the live decision board and in the God's Will ranking. A God's Will option that fits the path shows "Fits the <path>". It also files one finding: the trade's role lean never reaches the live board.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change the "Your will holds / fades" start lines or compulsion costs, cooldown or hold.
- It does not change what compulsion is (Law 9; THR-1781 shipped it).
- It does not filter God's Will to path-shaped work only.
- It does not fix path words used as God's Will labels (THR-2057 item 1).
- It does not fix the role-lean board gap (filed as its own ticket).
- It does not re-author any encounter template or vision, and does not read secondary Reaches (the cache drops them).
- It does not change retinue mortals.

## impact_class

Reversible. Additive optional fields, two constants, and a pure function. Setting `FIRST_PATH_PULL = 0` and `COMPULSION_MIN_STORY_OPTIONS = 0` restores most of today's behaviour.

## evidence cited

- **Linear issue:** THR-2059 (originals THR-1988, THR-1982, THR-1984; related THR-1781, THR-1802, THR-2057, THR-2058).
- **Vision premises invoked:** `Docs/game-design/laws.md` laws 9, 11, 12, 13, 42, 45.
- **UL terms touched:** none new (God's Will, chapter, routine/daily life, path, The First are existing).
- **Canon pages consulted:** `Docs/canon/rulebook.md` §4, §7; `Docs/game-design/laws.md`; `Docs/design-system/laws.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md` (left this ticket out of scope).
- **Rejected approaches considered and dismissed:** a path-only filter on God's Will; a lean placed only in `finalScore`; per-vision authored tag lists (deferred).

## load-bearing decisions touched

- "The world graph is mutated in place": no change detection is added. The new fields ride on actions and records, not on the graph.
- "Engine caches are owned per session": no new cache.
- "Everything is a graph node/edge": the path is read from the existing `thread` edge's `meetingChoiceRecord`. No new edge or property field relates entities.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (716 importers), `src/types/trace.ts` (156), `src/engine/orchestrator.ts` (152). The plan has a Blast Radius section.

## kill criteria

- Round 6: if a tester who chose a path still names no fitting chapter or option, raise `FIRST_PATH_PULL` or move to authored per-vision tags (brainstorm option D).
- If a tester reports The First "only ever does one kind of thing", lower the constant.
- If God's Will stops appearing for long stretches (the `COMPULSION_MIN_STORY_OPTIONS` gate), measure the emission rate in a 600-tick run and lower the minimum to 1.
