---
lane: tb-design-lane
run: 2026-10-13d
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-13 (run d, ~16:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The type system](https://linear.app/threadbare/issue/THR-1833/the-type-system-which-faces-play-which-roles-and-a-specimen-sheet-at) — **the game gets three typefaces, each with one job.**
  - **Cinzel names things.** A person's, place's or power's name, and encounter titles, only at large sizes. Smaller names use the plain UI face, so you never see rows of tiny spaced capitals.
  - **Alegreya tells the story.** Encounter text, afterimages, the Chronicle and card flavour get a book face that matches the UI. It replaces Georgia, which looks different on every computer and cannot go into a Unity build.
  - **Alegreya Sans runs the game.** It covers labels, numbers, choices, card rules, tooltips and town names on the map. Labels like *Quintessence* become plain bold words at full size, not tiny spaced capitals. Numbers that sit in a column line up. The typewriter-style numbers leave the game screens.
  - **Story text sits one size larger than interface text**, because Alegreya reads a little smaller than Georgia at the same size.
  - **Map labels:** big towns are heavier than small ones (capital, city, town and hamlet each step down). Realm names keep Cinzel while they are large.
  - **Links:** [what it looks like at 2560×1440](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-13-thr-1833-type-system/specimen-1440p.png), [at 1920×1080](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-13-thr-1833-type-system/specimen-1080p.png), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-13-thr-1833-type-system-decision.md). The bottom strip of each picture shows today's version next to the new one.
  - Nothing is built yet. This becomes part of the type-and-icons plan when [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823/wayfinder-map-the-map-is-the-table-a-map-first-game-screen-for-1440p) closes.
  - *To veto, say:* **"keep Georgia for the story"** or **"keep Cinzel for every name"**.

## Work

- **Why a map decision, not a plan doc.** Ready for Dev holds 3 non-Deferral items, below the floor of 4. Every plan-doc candidate still sits inside a 24 h veto window or waits on content:
  - [The world remembers](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with) builds on [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811/god-cards-carry-their-progression-as-data-a-tier-how-a-god-gets-each), whose window closes about 22:15 UTC today.
  - [Places founded during play take no culture](https://linear.app/threadbare/issue/THR-1839/places-founded-during-play-take-no-culture-a-hamlet-founded-at-tick) builds on [Two in five mortals belong to no people](https://linear.app/threadbare/issue/THR-1793/216-of-509-seed-42-mortals-have-no-culture-edge-so-their-sphere-bag-is), whose window closes about 01:15 UTC tomorrow.
  - [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) still waits for a second hunt encounter.
  - So I took the next frontier ticket on [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823/wayfinder-map-the-map-is-the-table-a-map-first-game-screen-for-1440p).
- **Why the type system first.** Of the four open frontier tickets it has no blocker and a self-contained answer. [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with) hosts the Dominion overlay, which is still inside its veto window until 21:40 UTC today, so it is better taken after that. Still open: [the encounter Stage](https://linear.app/threadbare/issue/THR-1829/the-encounter-stage-which-beats-play-over-the-dimmed-map-with-their-hex), [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with), [the icon family](https://linear.app/threadbare/issue/THR-1834/the-icon-family-pick-or-draw-one-set-with-style-rules-and-every-top).
- **Claimed** with the marker `design-lane claim 2026-10-13d`. Assignment verified, decision recorded, ticket closed as Done and verified. The gist line was added to the map's *Decisions so far*.
- **Measured** on `origin/main` at `41497a0d`:
  - 85 Georgia / `--font-prose` lines.
  - `uppercase` 373 times in 117 component files.
  - Monospace on about 14 player surfaces; `tabular-nums` used 6 times.
  - The game's own Alegreya Sans file keeps tabular figures: "1111" 55 px vs "0000" 84 px by default, both 76 px with tabular figures on.
  - Alegreya Sans has no 600 weight, so the city-label weight from [Map chrome and markers](https://linear.app/threadbare/issue/THR-1831/map-chrome-and-markers-zoom-controls-minimap-opening-zoom-agent-marker) is corrected to 700.
  - The specimen fits one screen at both sizes with no panel overflow.
- **PR:** [docs(audit): 2026-10-13 type system decision and specimen](https://github.com/christianspliid-ui/threadbare/pull/2356). Docs-only, `npm run gate -- --final` PASS, auto-merge armed. It was still waiting on the required checks when this report was written.
- **No vetoes** in the briefing's *From Christian* section. No lane claims to resume.

## Escalations

None.
