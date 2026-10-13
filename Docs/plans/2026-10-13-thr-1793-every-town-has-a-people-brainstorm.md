# Every town has a people — brainstorm companion (THR-1793)

Companion to [`2026-10-13-thr-1793-every-town-has-a-people.md`](2026-10-13-thr-1793-every-town-has-a-people.md).
Authored by the unattended design lane (run 2026-10-13b) under the 2026-09-25 delegation (THR-1611).

## The question the ticket asked, and why its premise did not hold

The ticket asked: *should worldgen give every settlement NPC its home settlement's culture edge?*
The census says NPCs **already** do that. `mintNpc` (`npcSeeding.ts:278-288`) writes `belongs_to` from
`resolveLocationCulture` whenever the place has one, and on seed 42 / medium at tick 0 no `npc_*` actor at a
culture-bearing place lacks the edge (measured, plan § Substrate). Every one of the 203 cultureless NPCs stands
in a **place that has no culture itself**: 24 settlements (1 capital, 4 cities, 1 town, 12 hamlets, 6 camps)
plus a farmland, a fort and a temple, all five or more hexes from the nearest heartland. The fringe pass
(THR-1632 S1d) stops at `cultureFringeMaxHexes` = 4.

So the fix is a place fix, not an NPC fix. The ticket's own framing anticipated this ("a culture-writer fix,
not a sphere fix"); it only named the wrong writer.

## Considered alternatives

| Option | Taken? | Why |
|---|---|---|
| Copy the home town's culture onto each NPC (the ticket's proposal) | No | Already happens; the towns have no culture to copy |
| Leave the far frontier cultureless | No | THR-1632's brainstorm rejected exactly this ("half of all mortals have no culture"); the 4-hex reach was a speed cut, not a meaning choice. 42 % of mortals still add nothing to the Dominion read |
| Widen the existing fringe reach so every settlement takes its nearest people | **Yes** | No new concept: the UL term *Fringe* already says "the nearest culture within reach". One number moves. Same half-strength, current-only link, still never territory |
| A new, weaker "frontier" tier beyond the fringe (quarter strength, own label) | No | A second word and a second label for the same idea; the half-strength fringe already reads as partial, and nothing measured needs a third strength |
| Mint small local cultures for isolated towns | No | New cultures change what the world's peoples *are* — a meaning fork, and much larger than a bug fix |
| Fall back to the place's sphere scores for a cultureless mortal's sphere bag | No | Fixes the Dominion read only; culture prose, culture traits and openings would still see half the towns as nobody's |
| Give protagonists (agents/individuals) the fringe culture too | No (out of scope) | Protagonist culture is drawn from `locationCultureMap` with draws per actor; reading fringe there shifts the shared worldgen stream for every seed. Their 10 % cultureless roll is designed (`CULTURELESS_PROBABILITY`). Only 12 of 216 |
| A birthplace fallback for newborns | **Yes, small** | Today a birth with no cultured mortal present gets no culture even in a cultured town. Draw-free fallback to the place's current culture — the same rule `mintInhabitant` already uses |

## Tensions

- **Speed vs coverage.** THR-1632 measured 8 hexes at +17 % over the all-"today" world against +10.3 % at
  4 hexes, and lowered the reach. This lane re-measured the actual delta on current `main` in paired same-session
  runs (plan § Performance). The kill line stays the one THR-1632 set: lower the reach first.
- **Fringe is not territory.** Widening the reach must not widen Realm ground, promotion or borders. It cannot:
  fringe links are never added to `locationCultureMap` (THR-1632 S1d), and that invariant is untouched.
- **Cultural mismatch tension** wakes at newly linked towns when outsiders stand there. That is contact, which
  the direction wants (THR-1632 brainstorm § Tensions); the speed measurement includes it.

## Vision premises

- *Narrative over mechanical perfection* — a capital that belongs to no people is a story hole, not a mechanic.
- *Everything is a graph edge* — one more `belongs_to` per settlement, no new node or edge type.
