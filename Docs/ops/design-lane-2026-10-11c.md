---
lane: tb-design-lane
run: 2026-10-11c
promoted:
filed:
resolved: THR-1831
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-11 (run c, ~12:30Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Map chrome and markers](https://linear.app/threadbare/issue/THR-1831/map-chrome-and-markers-zoom-controls-minimap-opening-zoom-agent-marker) — the map gets zoom, "centre on my First" and "show known land" buttons in its corner, plus matching keys, and a minimap at 1440p.
  - **The game opens** on your First with all your known land in view, instead of the 300 px close-up.
  - **Your own mortals** keep a portrait at every zoom, and portraits push place names aside, never cover them.
  - **Realm borders** are drawn in each holder's own ink: red now means danger and doom only, gold means your frontier.
  - **Uncharted land** looks like parchment, not a black void.
  - **Place names** grow as you zoom in.
  - *To veto, say:* **"I want to start face to face with my mortal"**, **"keep the red borders"** or **"no minimap"**.

## Work

- **Board on arrival:**
  - No vetoes in the briefing and no claims of this lane's to resume.
  - Ready for Dev held 4 non-Deferral items, which is not below the floor of 4, so a map decision outranked a plan doc.
  - The only open map was [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823/wayfinder-map-the-map-is-the-table-a-map-first-game-screen-for-1440p).
- **Claimed** [Map chrome and markers](https://linear.app/threadbare/issue/THR-1831/map-chrome-and-markers-zoom-controls-minimap-opening-zoom-agent-marker). It was the map's only unblocked frontier ticket marked "decidable by delegation from measurement". It is not an aesthetic bet: the dark-map ticket, which the map flags as one, was left alone.
- **Measured** on the deployed build ([seeded medium map](https://threadbearer.co/?view=game&seeded&size=medium)) at 2560×1440 and 1920×1080, and in code:
  - The run fits at zoom 2.74, then an old rule jumps to zoom 15. That gives 300 px hexes, with 5–7 showing across the screen.
  - The map has no zoom buttons, no minimap and no keys.
  - Every border is one red.
  - Labels are fixed at 11–16 px, all bold.
  - The First's portrait covers its own place name.
- **Output:** the [decision audit with every number](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1831-map-chrome-decision.md), with screenshots of the [1440p opening](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1831-map-chrome/opening-view-1440p.jpg), the [1080p opening](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1831-map-chrome/opening-view-1080p.jpg) and the [zoomed-out view](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1831-map-chrome/zoomed-out-1440p.jpg).
  - It went in through [PR #2335](https://github.com/christianspliid-ui/threadbare/pull/2335), set to merge automatically.
  - The docs gate passed.
- **Closed** the ticket with the decision record on it. Its gist is added to the map's Decisions so far.
  - Four small code defects it found go to the map's lenses-and-chrome plan doc, not to separate tickets.

## Escalations

None.
