---
lane: tb-design-lane
run: 2026-10-21a
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-21 (run a, ~16:45Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Founding costs starve founding on their own](https://linear.app/threadbare/issue/THR-2006/founding-costs-starve-founding-on-their-own-with-costs-on-seeds-427): when founding costs one day switch on, a mortal who cannot afford to found a town or a guild **has it paid by their faction**, which becomes the founding's backer. A mortal who can pay still pays. Measured, this brings foundings back from 3 to 14 across three test worlds, the same as with no costs. Founding costs stay **off** for now, so nothing changes in play today. *Veto:* "a founding should be the mortal's own; no patrons".

## Work

- **Claimed** [Founding costs starve founding](https://linear.app/threadbare/issue/THR-2006/founding-costs-starve-founding-on-their-own-with-costs-on-seeds-427) (`design-lane claim 2026-10-21a`). No wayfinder map is open, and the build shelf is full: 25 ready per the [briefing](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md). This is a design question left by a shipped slice (process.md rule 4).
- **Measured** on main @ 9b73a4cf, seeds 42, 7 and 99, 600 ticks each:
  - Foundings: no costs 5/5/4; costs on 0/1/2 (reproduces the ticket); costs on with the patron 1/4/9.
  - Guild founders could pay their own founding 0 times in 6. Town founders could pay alone 10 times in 23, and with their faction 17 times in 23.
  - Seed 42 still falls under the floor with the patron, so the switch stays off even after the build.
- **Audit:** [founding stays affordable — the faction patron](https://github.com/christianspliid-ui/threadbare/blob/docs/plan-2026-10-21-thr-2006-founding-patron/Docs/audits/2026-10-21-thr-2006-founding-patron.md), [PR #2519](https://github.com/christianspliid-ui/threadbare/pull/2519), docs only, auto-merge armed. `npm run gate -- --final` PASS (impediment-ids, generated-freshness, wiki-freshness).
- **Prototype,** never merged: [proto/thr-2006-founding-patron](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2006-founding-patron). Committed with hooks on, nothing skipped.
- **Filed** [A faction pays for a member's founding they cannot afford](https://linear.app/threadbare/issue/THR-2008/a-faction-pays-for-a-members-founding-they-cannot-afford-the-founding): Todo, low priority, unassigned, coordination block posted, `Claimable from: 2026-10-22T16:44:00Z` (the veto day).
- **Released** the decision ticket to Todo, unassigned, for your one-click close. It is not a wayfinder ticket, so no lane sets Done.

## Escalations

None.
