# Brainstorm companion — A hex card grows the sphere of the place it falls on (THR-2087)

Companion to [the plan](2026-10-28-thr-2087-hex-sphere-pressure.md). Design lane, run 2026-10-28d.

## The question

A hex card's sphere push names `hex_COL_ROW`, which no graph node carries, so the pressure phase drops it. Where should the push land instead?

## Options considered

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. One place on the hex, full push; nearest within 2 if empty** | Weighs what a place card weighs; 99.4% of land covered; no new substrate | The "chief place" pick is by id, not by meaning | **Taken** |
| B. Every place on the hex, full push each | A hex is a region; "regional" scale cards | Up to 3× a town card for similar essence; hex cards become the best Mandate buy | Rejected |
| C. Every place on the hex, push split | Fair total | 3 split two or three ways is 1–1.5 per place, which rarely levels a score | Rejected |
| D. Mortals on the hex | They are graph nodes | Mortals weigh 0.2 in the world total; most hexes hold none at cast time; they walk away | Rejected |
| E. Hex nodes in the graph | Exact | A new node type for one lookup; 712 more nodes; CLAUDE.md says stop and ask before inventing node types | Rejected |
| F. Drop empty-hex pushes | Strict | 70% of land hexes hold no place; Seed Life's barren targets would mostly buy nothing | Rejected (radius 2 instead) |

## Tensions

- **Pick by id vs. by meaning.** The most-populous or the holding place would read better, but adds a rule and a per-cast scan of `located_at` edges. Nothing on screen names which place took the push except the trace and the moved score; id keeps it deterministic and cheap. Revisit if a playtest asks "why did *that* village change?".
- **Radius 1 vs. 2.** Radius 1 covers 87% of land, 86% of Seed Life's terrain. Radius 2 covers 99.4% / 97%. A two-hex reach is still "the nearby town feels the land change". The kill criterion watches both directions.
- **Phase vs. push site.** The Mandate plan edits the push sites (adds `causedBy`); resolving in the phase avoids a three-way edit and lets any writer use hex ids.

## Vision premises

The god acts through the world, and each cast leaves a mark the world can read (Vision north star). A card that says "life takes root" and moves nothing contradicts the card's own words.

## Not decided here

Sustained hex controls' per-tick pressure (their `targetNodeId` is unset for hex targets) and spheres for the 23 untagged hex cards.
