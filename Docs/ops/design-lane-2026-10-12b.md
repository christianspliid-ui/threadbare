---
lane: tb-design-lane
run: 2026-10-12b
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-12 (run b, ~06:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The screen frame](https://linear.app/threadbare/issue/THR-1828/the-screen-frame-top-bar-with-the-needs-you-queue-the-god-rail-and-the): one row across the top, a rail on each side, and the map gets the rest.
  - **Top bar:** the date, pause *and* speed together, a **Needs you** button that only appears when something is waiting, the Find box, Doom, Omen, and four labelled buttons (Rivals, Notables, Read the Threads, Settings).
  - **Needs you:** lists offers waiting for you, moments queued behind the one on screen, and big news (mandate milestones, ambitions, wars won). That news is made today but never shown.
  - **Left rail:** who you are, your essence and Attention, and your hand of cards. Reaches, Mandate, Covenants and the rest fold into one-line rows.
  - **Right rail:** your threaded mortals and the Chronicle. The Chapter Ledger becomes a Chronicle tab. The World Pulse box goes: its speed control moves to the top, and its agent and culture counts are dropped. The world's mood (World-Soul) becomes one line above the Chronicle. The rail folds to a thin strip whenever you want, and on its own while a page is open.
  - **Readability:** nothing smaller than the game's normal small text, and no tiny spaced capitals.
  - **The map** keeps at least 60% of the screen.
  - Mock: [1440p](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-12-thr-1828-screen-frame/frame-1440p.jpg), [1080p](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-12-thr-1828-screen-frame/frame-1080p.jpg), [1080p with a page and Needs you open](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-12-thr-1828-screen-frame/frame-1080p-inspector-queue.jpg).
  - *To veto, say:* **"keep World-Soul up top"**, **"I want the agent and culture counts"** or **"keep the World Pulse box"**.

## Work

- **Claimed** [The screen frame](https://linear.app/threadbare/issue/THR-1828/the-screen-frame-top-bar-with-the-needs-you-queue-the-god-rail-and-the).
  - It is a frontier ticket on [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823/wayfinder-map-the-map-is-the-table-a-map-first-game-screen-for-1440p), the only open map.
  - Its blocker, [What asks for the god's attention today?](https://linear.app/threadbare/issue/THR-1825/what-asks-for-the-gods-attention-today-every-producer-a-needs-you), is Done.
- **Measured** today's frame:
  - The top bar has pause but no speed. The only speed control sits in World Pulse, in monospace.
  - The alert channel is produced but never rendered.
  - The left rail is a fixed 360 px, with labels down to 9 px in uppercase.
  - World Pulse repeats the season and the omen.
- **Built a mock** at 2560×1440 and 1920×1080 and judged it against UI Laws 25, 52 and 53.
  - The mock showed that a five-card hand fits in the left rail at 1080p. The Inspector decision's fallback, moving the hand to a strip along the map's bottom edge, is not needed.
  - It also showed that words clip in the folded strip, so the strip uses icons with counts.
- **Recorded** the decision on the ticket and closed it (Done, verified). The gist line is on the map's Decisions so far.
- **Decision record:** [Screen frame decision](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md). It merges via [PR #2341](https://github.com/christianspliid-ui/threadbare/pull/2341), with auto-merge armed and the docs gates passed.
- **Shelf:** 4 jobs ready, which is not thin, so this run took a map decision rather than a plan doc.
- **Map progress:** 8 of 12 tickets resolved. Still open: [The encounter Stage](https://linear.app/threadbare/issue/THR-1829/the-encounter-stage-which-beats-play-over-the-dimmed-map-with-their), [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with), [The type system](https://linear.app/threadbare/issue/THR-1833/the-type-system-which-faces-play-which-roles-and-a-specimen-sheet-at) and [The icon family](https://linear.app/threadbare/issue/THR-1834/the-icon-family-pick-or-draw-one-set-with-style-rules-and-every-top).

## Escalations

None.
