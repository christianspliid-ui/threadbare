# Brainstorm companion — Sphere scores land where Dominion reads them (THR-1768)

Companion to `Docs/plans/2026-10-06-thr-1768-sphere-score-seeding.md`. Records the alternatives the design lane weighed (run 2026-10-06d) and the tensions it accepted.

## The question underneath

The Dominion ruling makes sphere scores the currency of the god's power loop. Today they are a dormant system: writers press into bags that half the world does not have. The ticket calls it a bookkeeping fix, and it mostly is. The one place it touches meaning is **what a mortal's sphere says about them**, because the Dominion read will later tell the player which people are "theirs".

## Where a mortal's sphere comes from (D1)

| Option | What it would mean in play | Verdict |
|---|---|---|
| **Their culture's venerated spheres** | A people carries its faith with it. A Life-venerating folk settling in a Death god's ground is visibly foreign; converting them is a story. | **Chosen.** Data exists on every mint path, already the culture's sphere identity everywhere else (names, flags, mores, prose). |
| Their calling (Reach) | A smith is Matter, a priest Spirit. | Rejected. Reaches are what you do, Spheres what fuels it; the load-bearing decision keeps them orthogonal, and the parked sphere-governance pivot (THR-870) is where any such fusion would be argued. |
| Their home place's top sphere | People are of their land. | Rejected. Double-counts terrain; the Dominion over a person would only restate the place's. It also makes a migrant instantly native. |
| Nothing (stay zero until pressed) | Only deeds give sphere. | Rejected. 0 % of individuals non-zero means "mortals as world objects" in the Dominion read has no data (THR-1759 audit), so every person reads Foreign forever. |

A culture-based seed still leaves room for deeds: pressure on a mortal (notables, actions, doom cards) moves the bag from there.

## How late-minted nodes get seeded (D2)

The ticket asked for "one helper every location-minting path calls". The census found ~20 location mint sites and four actor mint paths, three of which explicitly write `sphereAffinity: null`. The gap THR-1759 found *is* a mint path nobody remembered. A sweep that seeds any node without a valid bag, run at one place before pressure is consumed, is that one helper called from one site — and it covers the next mint path someone adds. Cost: one property check per node per tick on a set the aggregation phase already walks every tick.

Tension accepted: a node minted mid-tick reads no bag until the sweep runs at Phase 6.639. Every reader is already fail-soft on a missing bag; the Dominion core will be too.

## Faction aggregate shape (D3)

Overwriting the faction's own bag with a derived value would erase the monster-faction birth seed and any pressure aimed at a faction (doom cards, schemes can target factions). Keeping the derived value in its own field and adding the two on read keeps both histories. Mean, not sum, keeps a faction on the same 0–10 scale as a person, so the Dominion bands (THR-1760) can use one set of thresholds across kinds if they want to.

## Declared-sphere places (D4)

Lairs and elder ruins are minted with a sphere as part of their identity (`dominantSphere`, `sphereAlignment`). Terrain alone would make a Darkness lair in a forest read Life. `LOCATION_TYPE_BONUS = 2` has sat unused since the world-soul design (2026-03-28); its name is this job.

## Integer erosion (D5)

Scores are documented as permanent integers on the triangle scale. Notable pressure of 0.6 produced scores of 0.8. Floor keeps the contract: only a whole excess removes a whole point. Partial constructive progress already accumulates in `progress`, so nothing is lost on the build side.

## The god (D6)

The UL entry for Dominion already names the fallback. The point-buy plan (THR-1749) keeps `sphereAlignment` as a derived field of its two largest buys, so seeding from `sphereAlignment` works before and after it ships and does not depend on its veto window. Reading the full bought vector belongs with the question of how the god's power grows (THR-1765).

## Vision premises touched

- *Numbers never reach the player* — unchanged; all of this is internal.
- *Reaches and Spheres are orthogonal* — reinforced by D1's rejection of calling seeds.
- *Measure before tuning* — the plan's last Done-when re-runs the THR-1759 read so the formula ticket tunes against real seeded distributions.
