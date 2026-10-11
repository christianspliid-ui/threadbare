---
lane: tb-design-lane
run: 2026-10-11d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-11 (run d, ~18:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Dominion core](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods) — the plan for home turf is written and queued for building. Every number comes from the Dominion map you closed this morning. The calls the plan made on its own:
  - **Prices and odds wait for their explanation.** A card will only get cheaper or surer on your ground once the card itself can say why. That switch is turned on by [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750/dominion-on-the-map-and-on-every-sheet-the-player-can-see-their-turf), in the same change that adds the ground marker to the card.
  - **Only your own casts read your ground.** Mortals roll as they always have, wherever they stand.
  - **A thread that doesn't know you yet keeps today's small income.** Deeper threads earn more, and more again on your ground.
  - **Untended ground fades back toward what it was**, but never below that. Places you never touched are never affected.
  - **Claim Dominion and Shift Dominion keep their names.** They now work on towns and sites instead of map tiles.
  - **The chronicle tells you when ground slips or firms**, at most one line a day, and never as a pop-up.
  - *To veto, say:* **"show the cheaper prices straight away"**, **"let mortals use my ground too"** or **"I want a pop-up when I lose ground"**. Building waits until Monday evening, 19:00 UTC (the plan's veto window).

## Work

- **Board on arrival:**
  - No vetoes in the briefing and no claims of this lane's to resume.
  - Ready for Dev held 3 non-Deferral items, below the floor of 4, so this run wrote a plan doc.
  - The first plan doc in the closed [Dominion map](https://linear.app/threadbare/issue/THR-1758)'s carve-up was [Dominion core](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods). Its prerequisites have all shipped, and every decision it draws on is more than 24 hours old.
- **Claimed** the ticket with the lane marker and verified the claim.
- **Measured** today's code before writing:
  - Two of the map's assumptions had gone stale. God cards carry no flat sphere discount (that discount is on the nudge hand, which the map left alone). The cosmology's pair strengths exist only as a comment.
  - The plan corrects for both without changing any number the map decided.
- **Gates:**
  - The intent judge returned *Revise* on round 1, with three real gaps. Mortal steps would have rolled on the god's ground. A heavily imported file was missing from the blast radius. Prices would have changed with nothing on the card saying why.
  - All three gaps were fixed, and round 2 returned *Allow*.
  - The NFP, three-pillar and Vision auditors all returned *pass with notes*. Their notes are answered in the plan.
- **Plan doc:** [2026-10-11 Dominion core](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-11-thr-1748-dominion-core.md), with its [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-11-thr-1748-dominion-core-brainstorm.md). It went in through [PR #2338](https://github.com/christianspliid-ui/threadbare/pull/2338), set to merge automatically.
- **Handed off:** the ticket is in Ready for Dev and unassigned, with the plan-doc line and the hold time in its description, and the handoff comment with the coordination block. The plan was confirmed live on main before the move. It is marked as conflicting with [say it before it happens](https://linear.app/threadbare/issue/THR-1815/say-it-before-it-happens-the-sphere-pour-says-what-it-changes-the), because both touch the words on a card's cost. Whichever is built second is rebased onto the other.

## Escalations

None.
