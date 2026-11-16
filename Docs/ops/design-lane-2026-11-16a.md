---
lane: tb-design-lane
run: 2026-11-16a
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-16 (run a, ~02:20Z)

## Needs Christian

Nothing new needs you. Your open question on [which chapters wait for your cards](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows) is unchanged and already in the briefing.

## Decided for you

- ["Fated" fails and nothing says why](https://linear.app/threadbare/issue/THR-2171/fated-fails-and-nothing-says-why-the-top-odds-word-reads-as-certain-a): no more work on it. "Fated" keeps its name, and the game already tells the player "even Fated can miss", both in the legend and at the moment a step misses. Round 4 testers learned that lesson, and none of them read a won chapter as lost any more. Round 5 checks it again. Say "rename Fated" if a Fated miss should never surprise a player, even the first time.

## Work

- **Decided and closed** ["Fated" fails and nothing says why](https://linear.app/threadbare/issue/THR-2171/fated-fails-and-nothing-says-why-the-top-odds-word-reads-as-certain-a) under the design-request carve-out. The decision record is on the ticket.
  - **Why this unit:** Ready for Dev was empty (0 tickets), no map is open, and no ticket was waiting in In Design. Every other open playtest ticket already has a decision and is waiting on a build or a playtest round. This one had its build ([A good-odds step that misses says so](https://linear.app/threadbare/issue/THR-2180)) Done since 6 Nov. [Warm round 4](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-4.md) marked it "partly met", and nobody had decided anything since. It is a UI-words finding, so it falls under the period focus.
  - **Measured** on main @ `2a898612`: the legend line (`nudge-stage-content.ts:211`), the Fated hover with "a sure thing needs no god" (`ui-content.ts:1512`), the miss line "It looked {tier}, but fate rolled against it" (`aftermathWords.ts:1106`) and the alone-miss line (`ui-content.ts:188`) are all live.
  - **What was left over and where it went:** the skimmer asked why anyone plays cards on a Fated step. The hover answers that, and since 14 Nov such steps play out on their own unless the player opens them ([THR-2211](https://linear.app/threadbare/issue/THR-2211)). The veteran's pips confusion went to [One mark, one meaning on the Stage](https://linear.app/threadbare/issue/THR-2231), which is Done. Gold for Fated is still yours ([the reserved question](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided)).
  - **Steps:** claimed with the marker `design-lane claim dl-20261116T0218Z` (assignment checked), posted the decision, set the ticket to Done and checked the change took.
- **Shelf:** still empty. No other agreed work is waiting to be designed. Next design work needs either your direction (the briefing's main ask) or warm round 5's findings.

## Escalations

None.
