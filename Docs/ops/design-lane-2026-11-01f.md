---
lane: tb-design-lane
run: 2026-11-01f
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-01 (run f, ~17:19Z)

## Needs Christian

Nothing needs you. The type-size question on [the UI legibility map](https://linear.app/threadbare/issue/THR-2114/map-ui-legibility-and-usability-do-the-core-panels-read-the-way-people) is still yours from charting. This run did not touch it.

## Decided for you

- [Text positions — where labels, values, numbers and captions sit](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit) ([decision](https://github.com/christianspliid-ui/threadbare/blob/docs/thr-2119-text-positions/Docs/audits/2026-11-01-ui-text-positions.md)): a label sits above the thing it names. Today a mortal's facts put the label at the left edge and the answer at the far right edge, sometimes 239 pixels apart. In a list of short facts, the labels now line up in one column right next to their answers. Veto line: "labels on the left, like a character sheet".
- Same ticket: each panel has one left edge for its words and one right edge kept for small marks (a "go there" arrow, a toggle). Words are never centred, except the big single lines of the ceremonies and the start page. The choice dialog's title moves to the left edge. Veto line: "keep the centred titles".
- Same ticket: a count stays next to its heading ("Your cards 2"), not pushed to the far edge of the panel. Veto line: "counts on the right".
- Same ticket: the words about a small picture sit to its right. A big picture has its name above it. A label under a tile in a grid lines up with the tile's left edge. Veto line: "captions under pictures".
- Same ticket: any interface paragraph of three lines or more gets the same line-length cap as story text, about 70 letters a line. On the widest screens some god and faction pages now run to 99. Veto line: "let the text run wide".
- Same ticket: a small tag about one row comes after that row's name, and a count badge sits right after its word. Tooltips keep opening where they open today, and that placement is now the written rule. Veto line: "tags before the name".

## Work

- **Claimed** [Text positions](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit) under the UI legibility focus period. The shelf had 3 ready tickets, below the floor of 4, but no UI plan-doc candidate existed. The map's next unblocked ticket was the focus unit; [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) builds on this afternoon's lane decision, so it waits for a later run.
- **Measured before deciding.** The shared facts row ([Section.tsx on main](https://github.com/christianspliid-ui/threadbare/blob/main/src/components/shared/Section.tsx)) uses `justifyContent: 'space-between'` at 0.8rem. Seven person-page sections draw through it ([personRows.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/views/subjects/personRows.ts)). That row is the source of the label gaps the census found.
- **Decided and closed** the ticket. The decision record is on it, the gist line is added to the map's *Decisions so far*, and the output is [PR #2689](https://github.com/christianspliid-ui/threadbare/pull/2689) (docs only, auto-merge armed, docs gates green). No new fog graduated. The remaining frontier is Modules and composition. Type hierarchy stays reserved.
- **Passing note for the plan doc:** the facts row's 12.8 px text is below the 16 px floor that is already canon. The map's plan doc fixes it. No size was chosen here.

## Escalations

None.
