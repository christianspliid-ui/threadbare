---
lane: tb-design-lane
run: 2026-11-01e
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-01 (run e, ~14:18Z)

## Needs Christian

Nothing needs you. The type-hierarchy question on [the UI legibility map](https://linear.app/threadbare/issue/THR-2114) is still yours, from charting.

## Decided for you

- [Panel anatomy — one reading order that every core panel follows](https://linear.app/threadbare/issue/THR-2117/panel-anatomy-one-reading-order-that-every-core-panel-follows) ([decision](https://github.com/christianspliid-ui/threadbare/blob/docs/plan-2026-11-01-panel-anatomy/Docs/audits/2026-11-01-ui-panel-anatomy.md)): every panel reads in the same order. First who or what it is, then one line saying what is going on with it now, then what your god can do, then the detail, then the links out. Veto line: "a different panel order".
- Same ticket: on a wide page, a mortal's or god's name sits above their portrait, not under it. The portrait stays just as big. Veto line: "the portrait comes first".
- Same ticket: an encounter's title becomes the strongest words at the top of the Stage (today it is the faintest), and the line saying what is at stake sits right under it. Veto line: "keep the encounter header as it is".
- Same ticket: a dialog shows its title once (the choice dialog shows it twice today), and the button you press comes last. Veto line: "keep the dialog titles".
- Same ticket: a panel has at most two levels of heading and at most two frames, one inside the other. Text lines up on one left edge and is never centred. Veto line: "keep the centred headers".

## Work

- **Guards:** precheck `linear=nokey freshness=current`, and the board answered on the first read. No veto of this lane's work in the briefing's *From Christian* section. Shelf held 4 items (art-led slices 4–7), so it was not thin. The period focus picked [the UI legibility map](https://linear.app/threadbare/issue/THR-2114) first.
- **Claimed and decided** [Panel anatomy](https://linear.app/threadbare/issue/THR-2117/panel-anatomy-one-reading-order-that-every-core-panel-follows). Both research blockers had been resolved earlier today. The decision was made against [the census](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-legibility-census.md), [the reading-patterns rulebook](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-reading-patterns-research.md), the Inspector's existing page order and the art-led rules R1–R8. Decision record posted on the ticket, ticket closed and verified Done.
- **Output:** [Docs/audits/2026-11-01-ui-panel-anatomy.md](https://github.com/christianspliid-ui/threadbare/blob/docs/plan-2026-11-01-panel-anatomy/Docs/audits/2026-11-01-ui-panel-anatomy.md) in [PR #2685](https://github.com/christianspliid-ui/threadbare/pull/2685), docs-only, with auto-merge armed. Docs gates OK: generated-freshness, impediment-ids, plan-doc lint (skipped, not a plan doc).
- **Map updated:** the decision was added to *Decisions so far*. The tooltip and hover-card fog folded into this decision. The next ticket, [Modules and composition](https://linear.app/threadbare/issue/THR-2120), now has its anatomy input. [Text positions](https://linear.app/threadbare/issue/THR-2119) is also open. [Type hierarchy](https://linear.app/threadbare/issue/THR-2118) stays reserved for you.
- Sizes, weights, colours and the heading style were left out on purpose, because they belong to the reserved type-hierarchy ticket.

## Escalations

None.
