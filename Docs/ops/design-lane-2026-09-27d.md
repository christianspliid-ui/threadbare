---
lane: tb-design-lane
run: 2026-09-27d
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-27 (run d, ~18:15Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [Someone who wants something in every settlement, and people tied to each other](https://linear.app/threadbare/issue/THR-1630): **the plan is written and ready to build.** Every settlement gets one local figure who owns something there, has an old quarrel, and knows a secret about (or is owed a favour by) a nearby hero. Every named hero starts with a relative, a friend and a rival among their neighbours. Plan: [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md). Five calls made along the way, each open to veto:
  - **Mortals no longer climb into the deciding tier past the attention limit you set.** Today, on one test world, the number of mortals making their own decisions grows from 19 to 47 over 200 ticks, partly through a promotion path that skips your "attention follows ambition" limit. After this, a newcomer takes the place of someone nobody has watched, or waits. This will make the late game quieter in one way, so it is measured before it ships and can be switched off.
  - **Family is called "kin" everywhere.** Four different words for family were in use, and nothing ever wrote any of them. Old words still work, so no written content changes.
  - **A hero's starting Realm is the one that holds their home.** Today it is picked at random.
  - **A local figure's ambitions are about their own story:** their quarrel, the rival's property, their own town. It is never a feud with a distant king.
  - **Masters and apprentices at game start are left for later.** They need their own writer in the mentorship system.

Say "veto notables and ties" to reverse this.

## Work

- **Claimed** [someone who wants something in every settlement](https://linear.app/threadbare/issue/THR-1630). The build shelf was thin (3 ready to build, below 4), so this run wrote a plan. It is the first of the living-world map's seven jobs, and its three input decisions are more than two days old with no veto.
- **Re-measured on today's `main`** (worlds 42 and 99, fresh game start). This corrected seven facts in the two-day-old research without changing any decision:
  - only half the heroes live in a town, so the "nearest town of their culture" fallback carries half the ties;
  - the fix that gave heroes a starting standing picked a random Realm, not their home;
  - the local-agenda limit the research named did not exist yet.
- **Gates:** the intent judge allowed the plan. Its two notes (how the new word "kin" enters the glossary, and writing the failure plans into the doc) were folded in before merge. The rules, completeness and Vision audits all passed.
- **Merged** via [PR #2101](https://github.com/christianspliid-ui/threadbare/pull/2101). The plan is live on `main`.
- **Handed off** slice 1 (heroes' ties and the "kin" word) to Ready for Dev with its coordination block.
- **Filed** the other three slices (Todo, each with its coordination block, released by the orchestrator as their blockers clear):
  - [the attention limit applies to newcomers](https://linear.app/threadbare/issue/THR-1653), after slice 1;
  - [one notable in every settlement](https://linear.app/threadbare/issue/THR-1654), after the attention slice;
  - [the player sees who matters here](https://linear.app/threadbare/issue/THR-1655), after the notables slice.
- **Next run:** [a world with a past](https://linear.app/threadbare/issue/THR-1631), [faith and politics](https://linear.app/threadbare/issue/THR-1632) and [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636) are free to start.

## Escalations

None.
