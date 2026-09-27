---
lane: tb-design-lane
run: 2026-09-27c
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-27 (run c, ~12:15Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [Let written encounters land](https://linear.app/threadbare/issue/THR-1633): **the plan is written and ready to build.** About 400 of the 514 written encounters still never reach a mortal. The plan makes the existing writing reachable before anyone writes more. Plan: [let written encounters land](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1633-written-encounters-land.md). Five calls made along the way, each open to veto:
  - **The "too easy, so skipped" block is already gone.** The new dice switched it off, and mortals now pick challenges near their level, so the plan does no work on it. One side effect worth knowing: the world is already much more varied. Encounters fired nearly twice as often, and the ten most common went from half of everything to a quarter.
  - **The biggest remaining block is the shortlist.** Each time a mortal decides, it looks at only 40 options. Those 40 were filled by whatever the game happened to list first, so about 67 encounters per world were never even looked at. The fix fills the list fairly (one of each before repeats, starting at a different place each time), with the same 40-option size.
  - **Mortals who make their own choices will be able to join guilds.** Today none do. The offer reaches them, but it is scored as worth nothing, and the three times one was picked, no membership followed. The fix makes a guild appealing when it suits the mortal's strengths, so membership follows character, and it finds and fixes the lost memberships. No new heroes are added and ordinary guild members are untouched.
  - **The First gets no special rule.** Its long quiet stretches (up to nearly four in-game days on one test world) come from a general fault: a mortal walking to an encounter it picked drops that goal at the first re-check. Fixing that helps every mortal, The First included.
  - **The place-trait bonuses get tags that encounters actually carry.** Hand-tagging 434 encounters would go stale. Instead the bonus table is rewritten to use tags the encounters already have, plus one new automatic tag per encounter type. A test keeps any bonus from going dead again.

Say "veto written encounters land" to reverse this.

## Work

- **Claimed** [let written encounters land](https://linear.app/threadbare/issue/THR-1633). The build shelf was empty (0 ready to build), so this run wrote a plan. This ticket unblocks [finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634), and both research tickets it draws on are more than 48 hours old.
- **Re-measured on today's `main`**, as the ticket asked. Tests used worlds 42 and 99, 200 ticks, with the audit's own readers. One new reader was written for guilds, and the raw outputs are saved beside the audit's.
  - Written encounters that fire: 100 → 121 of 514.
  - The First now meets its first encounter at tick 18 instead of 90, and reads 40 encounters in 150 ticks instead of 14.
  - The talk-and-tavern encounters now fire (12, up from 0), because the [social cap fix](https://linear.app/threadbare/issue/THR-1614) shipped.
- **Gates:** the intent judge allowed the plan. Its two notes were folded in before merge: plain words instead of a coined term in code names, and a check that the new tags don't change other lookups. The rules, completeness and Vision audits all passed.
- **Merged** via [PR #2094](https://github.com/christianspliid-ui/threadbare/pull/2094); the plan is live on `main`.
- **Handed off** slice 1 (the fair shortlist) to Ready for Dev with its coordination block. The build shelf now has one item.
- **Filed** the other three slices (Todo, each with its coordination block, promoted by the orchestrator as their blockers clear):
  - [A journey keeps its goal](https://linear.app/threadbare/issue/THR-1639), after slice 1.
  - [Mortals who join guilds](https://linear.app/threadbare/issue/THR-1640), after slice 1.
  - [The faction talk and anomaly encounters get a path, and bonus tags get bearers](https://linear.app/threadbare/issue/THR-1641), after the guild slice.
- **Told the next plan its input moved.** [Finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634) was going to polish the ten most-fired encounters. That list is completely different after the new dice, so the ticket now says to re-rank once these slices land.
- **Next run:** three plans are free to start: [someone who wants something](https://linear.app/threadbare/issue/THR-1630), [a world with a past](https://linear.app/threadbare/issue/THR-1631) and [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636). [Faith and politics](https://linear.app/threadbare/issue/THR-1632) becomes free after 18:30 UTC today.

## Escalations

None.
