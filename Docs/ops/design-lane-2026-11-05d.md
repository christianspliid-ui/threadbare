---
lane: tb-design-lane
run: 2026-11-05d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-05 (run d, ~14:19Z)

## Needs Christian

Nothing needs you.

## Decided for you

Nobody builds on these before 02:45 UTC on 6 November.

- [The god-rail hand has no room](https://linear.app/threadbare/issue/THR-2177/god-rail-the-pinned-essence-block-leaves-the-hand-no-room-eight-50-px) — each card in the left-hand rail becomes one line, its name on the left and its price on the right, like a deck list. The words stay the same. At 1920×1080 that shows six cards where today it shows two and a half.
- Same ticket — every essence pool keeps everything you chose for it ("53 / 55", the bar that ends at the limit, the refill dots, the trend arrow). Each row just gets a little shorter. No pool is hidden or shrunk to an icon.
- Same ticket — the hand always keeps room for three cards. Opening Reaches, Mandate, Signatures or Hooks no longer pushes the hand off the screen; that row's contents scroll inside their own box instead.
- Same ticket — [the hand clips its only card](https://linear.app/threadbare/issue/THR-2176) has the same cause, so it gets built and closed with this one, not separately.

## Work

- Claimed [the god-rail hand ticket](https://linear.app/threadbare/issue/THR-2177/god-rail-the-pinned-essence-block-leaves-the-hand-no-room-eight-50-px). Why this one: the shelf had 3 ready tickets, all held, and this is the period focus (UI legibility). Measured on the live build at both screen sizes first: at 1920 the hand region is 168 px and a card is 61 px.
- Wrote [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-05-thr-2177-god-rail-hand-room.md) and [its brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-05-thr-2177-god-rail-hand-room-brainstorm.md). Intent judge: Allow, and both of its advisory notes were fixed. NFP, three-pillar and Vision audits all passed. Merged in [PR #2756](https://github.com/christianspliid-ui/threadbare/pull/2756); the liveness check reads LIVE.
- Handed off to Ready for Dev, unassigned, `Claimable from: 2026-11-06T02:45:00Z`, with the coordination block. Commented on [the one-card clip](https://linear.app/threadbare/issue/THR-2176) so it is built with this one.

## Escalations

None.
