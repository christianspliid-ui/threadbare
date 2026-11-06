---
lane: tb-design-lane
run: 2026-11-06c
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-06 (run c, ~08:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Nobody builds on these before 20:59 UTC on 6 November.

- [Rank words show their ladder](https://linear.app/threadbare/issue/THR-2182) — a mortal's reach tile keeps its rank word and adds one muted line: *"Middle of the ladder · next Fearsome"*, or *"Top of the ladder"* at the top. Hovering the word lists the whole ladder: *"Iron, low to high: Meek, Trained, Formidable, Fearsome, Legendary."*
- Same ticket — the small number testers saw beside every person, hall and resource is the count of your cards that can be cast on that thing. It now says so: *"4 cards"*, not just a card icon and "4".
- Same ticket — the faction ladder's top word changes from "Formidable" to "Foremost". "Formidable" was also the middle of a mortal's Iron ladder, so one word named two places.
- Same ticket — no meter, pips or "3 of 5". A small meter would be a new kind of glyph, and that is your call. Say so if you want one.

## Work

- **Waited, then claimed.** The build shelf holds four, and no design map is open. The UI-focus candidate, [rank words show their ladder](https://linear.app/threadbare/issue/THR-2182), builds on yesterday's 20:40 UTC rail-rows decision, so the run waited until its 12-hour veto window closed at 08:40 UTC before claiming.
- **Measured before deciding** (main @ `dd214308`). The reach tile shows one word, with no hover on the word or the Reach name. The unexplained number is the Inspector's row card count: it draws a card icon and a digit, and says "4 cards" only to screen readers and in its hover. "Formidable" is both the middle of the mortal Iron ladder and the top of the faction ladder.
- **Plan doc:** [Rank words show their ladder](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-06-thr-2182-rank-words-show-their-ladder.md), via [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2765) (merged).
  - Intent judge, first run: Revise. The plan had no player-facing text table with complaint classes. Fixed; the second run said Allow.
  - NFP and three-pillar audits: notes, all fixed. Among them: the card noun gets its own content entry, the faction ladder gets named constants, and an existing Reach primitive was added to the inventory.
  - Vision audit: Revise, fixed. "Middle rung" clashed with the UL's "rung", the step of your card ladder, so it now reads "… of the ladder". "Mighty" sat next to the fight screen's "Might", so it is "Foremost".
- **Handed off** the ticket itself to Ready for Dev, unassigned. Its title now names the build, its description has the plan-doc line and "Claimable from 2026-11-06T20:59Z", and the handoff with its coordination block is the latest comment. None of the four other shelf builds touches its files.
- **Not done this run:** [Plan which of the mortal's own chapters should give the god a hand](https://linear.app/threadbare/issue/THR-2179) is still the next plan-doc candidate. It is content work, so the UI-focus ticket went first.

## Escalations

None.
