---
lane: tb-design-lane
run: 2026-10-31c
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-31 (run c, ~17:20Z)

## Needs Christian

Nothing needs you. One small note: the plan leaves some headings without an icon, because no carved shape fits them yet. Their names will join your existing icon pick ([Christian picks carved shapes for the Inspector's tabs with no icon yet](https://linear.app/threadbare/issue/THR-2104)) once the build merges. That includes the god page's own Overview tab.

## Decided for you

All five are on [Art-led pass, slice 2 — every other Inspector page](https://linear.app/threadbare/issue/THR-2098/art-led-pass-slice-2-every-other-inspector-page-places-lands-factions):

- **Towns and cities show their landscape.** Today all 235 places in a seeded world show a placeholder mark in their page header. The plan lets the existing art picker use the town's own land. Veto line: "places keep the placeholder".
- **The Mandate is the god page's one highlighted line.** It shows the Mandate's name, then "Rising." and its current objective, in words. The progress bar stays on the god rail and is not repeated. Veto line: "put the Mandate bar on the god page".
- **Lists of strengths become chips; one-fact rows become sentences.** "Might · Strong" is a chip, and "Here you are Accepted." is a sentence. Bars beside single words drop, because the word already says how strong. Veto line: "keep the bars".
- **Relics lying at a place, or held by a faction, show as painted tiles** beside the page, like The First's carried relics. Veto line: "no relic gallery on places and factions".
- **Headings with no fitting icon draw none** and go on your icon pick list. This replaces the ticket's literal "every heading has its icon", because the icon shapes are your call. Veto line: "pick a near icon instead".

Say "veto <line>" to reverse any of these. The window closes about 05:45 UTC on 1 November.

## Work

- Claimed [Art-led pass, slice 2](https://linear.app/threadbare/issue/THR-2098/art-led-pass-slice-2-every-other-inspector-page-places-lands-factions). Ready for Dev held one item, and no map was open. Slice 1 merged in [PR #2663](https://github.com/christianspliid-ui/threadbare/pull/2663).
- Skipped two candidates that build on decisions still in their veto windows:
  - [Cheap place cards plateau](https://linear.app/threadbare/issue/THR-2094)
  - the story-text follow-ups ([wave 2](https://linear.app/threadbare/issue/THR-2108), [factory habits](https://linear.app/threadbare/issue/THR-2109), [the five novel-prose encounters](https://linear.app/threadbare/issue/THR-2110))
- Measured the substrate:
  - A headless seed-42 census found 235 places, all with map coordinates and none with a painting.
  - Grep found the fifteen rows still drawn as label-and-value lists.
  - The page header code passes no terrain to the art picker.
- Wrote [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2098-art-led-inspector-pages.md) and [its brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2098-art-led-inspector-pages-brainstorm.md). It covers one table per page kind, the icon for every heading, and quoted sample sentences.
- Gates:
  - Intent judge: Revise, Revise, then Allow. The first pass wanted real sample text and tooltip sources for every new sentence and chip. The second found that the Mandate's own objective ("Seize control of 2 settlements.") broke the no-numbers check; it is now a named exception.
  - Audits: NFP, pillars and Vision all pass, two of them with notes.
- Merged via [PR #2666](https://github.com/christianspliid-ui/threadbare/pull/2666). Handed off to Ready for Dev, held until 2026-11-01 05:45 UTC (the veto window), with the hold written in the description.

## Escalations

None.
