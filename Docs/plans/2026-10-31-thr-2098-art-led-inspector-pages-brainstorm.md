# Brainstorm companion — Art-led pass, slice 2 (THR-2098)

Companion to `Docs/plans/2026-10-31-thr-2098-art-led-inspector-pages.md`. Records the alternatives the design lane weighed and why each lost.

## Place header art

- **A (chosen):** pass the tile's terrain to `EntityVisual` and let the resolver's existing `location` branch score the landscape. One path (Law 3), and the land page's art stays its own.
- **B:** set `src` in the page builder with `landHeroArt`, as the land page does. Rejected: a second place-art path beside the resolver's. The land page's use is for a hex, which has no node.
- **C:** leave the glyph tile. Rejected: every one of 235 places shows a placeholder, while the land page beside it draws a landscape. That is the exact "art exists, page shows none" gap the pass exists to close.

## The Mandate on the god page

- **A (chosen):** a highlight with the name and the trend word; the bar stays on the god rail.
- **B:** keep the bar inside the highlight (a new optional `meter` on `highlight`). Rejected for now: it adds a primitive field for one row, and the rail already draws the bar one glance away. Christian can ask for it back; it is one field.
- **C:** keep the panel. Rejected: Law 16.

## Strength lists

Reaches, essence, signatures, faction strengths, ranks and reputations are lists of named things, each with a word. Chips keep each name a concept with its tooltip (Law 17). Sentences would bury eight reaches in one long line. Single-ended bars are dropped: the word ("strong") already says the size, and the taste profile counts bars as numbers in the UI.

## Held relics

- **A (chosen):** an aside gallery row, `relics_here` / `relics_held`, mirroring slice 1's `slots`. The Connections chip row stays, as on the person page.
- **B:** draw the Connections block's artifact rows as tiles. Rejected: it changes the shared block for every kind, and the person page would then show its relics twice as tiles.

## Icons without a shape

Picking a shape is Christian's (THR-2104, THR-1908). Slice 1 set the rule: no fitting idea → no icon, listed. Reusing a near idea, such as `maker` for "made by" or `signature` for the god's Overview, would break "one idea, one shape". The registry's archetype ideas mean a role, not an act.

## Vision premises

- Non-negotiable #3 (mechanics through prose): the strips becoming sentences serves it directly.
- Taste profile, numbers in UI: this slice removes bars and adds none.
