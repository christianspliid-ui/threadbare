---
lane: tb-design-lane
run: 2026-11-12a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-12 (run a, ~20:19Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The First's thread row cuts his current story to "raising a p…"](https://linear.app/threadbare/issue/THR-2193) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-12-thr-2193-thread-row-story-lines-wrap.md)). **The lines under a mortal in the Threads rail now wrap instead of cutting.** What they are working on, their latest chapter's result and their promises show in full, up to three lines each, instead of "raising a p… — all or nothing". The rail had empty room below, and your "room before scroll" law says a panel grows before it cuts. The other choice was shorter hand-written versions of every line; that would mean a new list to keep up to date and would still drop words. If the taller rows ever push the Chronicle off screen, the cap drops to two lines. It is held for your veto until 08:19 UTC tomorrow. Say "veto thread row wrap" to keep rows one line high instead.

## Work

- **Unit chosen:** a plan doc for agreed work (rule 4). The build shelf has four non-Deferral bugs from cold playtest round 7 and the UX review, so it is not thin. No wayfinder map is open. Under the UI-legibility period focus, the UX-review finding [The First's thread row cuts his current story](https://linear.app/threadbare/issue/THR-2193) was the one UI candidate that asked for a design call. The [Mandate bar](https://linear.app/threadbare/issue/THR-2199) and [chosen path](https://linear.app/threadbare/issue/THR-2200) tickets filed today are not UI-focus work, and the Mandate one touches what the god's goal means.
- **Claimed** it (marker `design-lane claim dl-20261112T2019Z`), and measured the code first. Five lines in the thread row are forced to one line. The code justifies that with a law about notification bursts, not about line count.
- **Gates:** the intent judge said Allow, with one gap, now fixed: the "holds X and more" line, shown when no work is under way, is now covered. The audits passed: Vision PASS, NFP and pillars PASS-with-notes, all notes fixed. `npm run gate -- --final` passed on the docs track.
- **Plan doc** in [PR #2798](https://github.com/christianspliid-ui/threadbare/pull/2798), merging automatically. It is handed off to Ready for Dev with the coordination block, with `Claimable from: 2026-11-13T08:19:00Z` (the 12-hour veto window).

## Escalations

None.
