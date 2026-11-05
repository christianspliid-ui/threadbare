---
lane: tb-design-lane
run: 2026-11-05f
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-05 (run f, ~20:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Nobody builds on these before 08:45 UTC on 6 November.

- [The mid-game words still mean nothing](https://linear.app/threadbare/issue/THR-2175): the left-hand rail's folded rows now say what they count. "Hooks · 11 on you" becomes "Hooks · 11 unfinished". "Signatures · 3 yours" becomes "Signatures · 3 settled". "Mandate · Holding" becomes "Mandate · Goal · Holding". "Reaches · Eye · Blinkered" becomes "Reaches · Main: Eye · Blinkered". Covenants reads "2 held · upkeep".
- Same ticket: opening one of those rows starts with one quiet sentence saying what it is for, taken from its hover. For Hooks that is *"Marks, clues and vows that tie you to something unfinished."* Mandate gets the hover it never had.
- Same ticket: the caption that tester read as a second meaning of "Reach" now starts with its own word: *"Dominion: how much a place or person is already yours."* Reach stays "what you do".
- Same ticket: the Doom panel stops showing "Counter-omens 0" and "Doom debt 0". Each row comes back as soon as it has something in it, the way the panel already hides its speed row.
- Same ticket: no word is renamed, no row opens by itself, and the rail gets no wider.

## Work

- **Claimed** [the mid-game words still mean nothing](https://linear.app/threadbare/issue/THR-2175), a warm round 3 finding that all three testers hit and the sixth time this class has come back. Three tickets sat on the build shelf, under the floor of four, and all three are inside their veto windows. This was the open UI-legibility finding with the clearest direction.
- **Measured before deciding** (main @ `90221547`). Five of the six rail words already have a hover. Nobody hovered, so the fix makes the visible words carry the meaning. The old "11 on you" also read as a threat, while hooks are unfinished ties. The "two meanings of Reach" came from the Dominion caption, which sits inside the Reaches row without naming itself. The glossary itself is already clear.
- **Plan doc:** [The rail rows say what they are](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-05-thr-2175-rail-rows-say-what-they-are.md), merged by [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2759). The intent judge said Revise on the first pass: "Best: Eye · Before It Happens" would have lost the Reach name on 8 of 40 rungs. That was fixed with a fallback that keeps today's wording, and the second pass said Allow. All three auditors' notes were fixed. Nothing went to you.
- **Filed** the build ticket [the rail rows say what they are](https://linear.app/threadbare/issue/THR-2183) (Ready for Dev, unassigned, claimable from 08:45 UTC on 6 Nov, built after [room for the god-rail hand](https://linear.app/threadbare/issue/THR-2177) because both edit the same rail file); [a glossary rule that "Reach" never names Dominion, and what a Hook is](https://linear.app/threadbare/issue/THR-2181); and [rank words with no scale on the mortal sheet](https://linear.app/threadbare/issue/THR-2182), the part of the finding this slice does not cover.
- **Released** the finding to Todo, unassigned, blocked by the build. It closes when warm round 4 confirms the fix.

## Escalations

None.
