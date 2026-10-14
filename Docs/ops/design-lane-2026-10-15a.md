---
lane: tb-design-lane
run: 2026-10-15a
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-15 (run a, ~22:30Z on 14 Oct)

## Needs Christian

Nothing needs you.

## Decided for you

- [What the player sees of the economy](https://linear.app/threadbare/issue/THR-1870/what-the-player-sees-of-the-economy-prosperity-unrest-tolls-and) — **the economy now tells you what happened, in a few plain words, and the plain map stays quiet.**
  - A town's page gets one line on how it is doing: *"Millbrook is struggling, and its people are restless with hunger."*
  - The Trouble lens shows hungry towns, and towns *on the edge* of turning to another lord.
  - The Trade lens says who tolls a road, which roads are embargoed, and who holds a region's salt.
  - A faction's sheet says where its coin comes from and how long it can pay its soldiers.
  - Every economic god card now says what it changed: *"Ferris has gone lawless."*, *"Its people's anger cools."*
  - A town on the edge does not ask for you on its own; a hungry town on your ground already prays.
  - [The five screens at 1920×1080](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-15-thr-1870-economy-visibility/place.png) ([Trouble](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-15-thr-1870-economy-visibility/trouble.png), [Trade](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-15-thr-1870-economy-visibility/trade.png), [faction purse](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-15-thr-1870-economy-visibility/faction.png), [god-card receipts](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-15-thr-1870-economy-visibility/receipt.png)) and [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-15-thr-1870-economy-visibility-decision.md).
  - *To veto, say:* **"show me famine on the map without a lens"**, **"I want to see how rich a town is at a glance"**, or **"every town about to turn should ask me first"**.

## Work

- **Claimed and decided** [What the player sees of the economy](https://linear.app/threadbare/issue/THR-1870/what-the-player-sees-of-the-economy-prosperity-unrest-tolls-and). It was the last open question on [the mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents).
  - Built a static mock on the same map Christian saw for the lenses, with five screens.
  - A code survey measured the facts behind the decision: receipts carry no economic change today, two prosperity word ladders disagree, and monopolies are debug-only.
  - Decision record, mock and screenshots are in [PR #2407](https://github.com/christianspliid-ui/threadbare/pull/2407). Docs only; both docs gate tracks passed; auto-merge is armed.
  - The ticket is closed; its gist is added to the map's Decisions so far.
- **Map reopened.** Closing that last ticket made Linear close [the mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents) by itself, skipping its carve-up into plan docs.
  - The map is set back to Todo with a comment. Its proper close and carve-up is the next design-lane unit.
  - This is recurring impediment #1061; its count is bumped in the same PR.
- **Shelf** is full: 22 non-Deferral items in Ready for Dev, so no plan doc this run.
- No vetoes were waiting in the briefing.

## Escalations

None.
