> **Prototype audit for THR-1760** (wayfinder map THR-1758, project Dominion — Player Power Progression). Design lane run 2026-10-09a, unattended. Inputs: the THR-1759 research (`Docs/audits/2026-10-06-thr-1759-dominion-writers-and-read-research.md`), the THR-1768 seeding fix (`Docs/status/2026-10-08-thr-1768.md`), Christian's 2026-10-05 ruling (`Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md` § Director's ruling), the THR-1749 point-buy plan. The prototype is code on the never-merged branch `proto/thr-1760-dominion-cut` (`scripts/proto-dominion-cut-1760.ts`, raw output `scripts/proto-dominion-cut-1760.out.txt`).

# THR-1760 — the Dominion formula: normalisation, opposition weight, power, and the five bands

Ground truth: `main` @ `84894af3` (THR-1768 merged), 2026-10-09. Every number below re-runs with:

```
npx esbuild scripts/proto-dominion-cut-1760.ts --bundle --platform=node --format=esm \
  --outfile=.cache/proto-dominion.mjs --external:fs --external:path
node .cache/proto-dominion.mjs --seeds 42,99,7 --ticks 240
```

Each seed is a headless medium world (`initializeGameState` + `runTick`, the `census-seeded-world` harness), read at tick 0 and tick 240. Five object kinds: **hexes** (land tiles, read from `seedHexSphereAffinity(terrain)` because hexes are not graph nodes), **places** (`getLocationNodes`, the settlement/site tier), **sublocations** (`getPlaceNodes`), **mortals** (individual actors), **factions** (`getFactionSphereScores`: own bag + member-mean aggregate). Four god vectors: the world's own god (its `sphereAlignment` as a 3 + 2 buy), the showcase mind 3 / spirit 2, a stone force 3 / matter 2, and a spread life 2 / matter 2 / mind 1.

## The formula settled

```
match(obj)    = Σ_s points[s] × ( score_obj[s] − OPPOSITION_WEIGHT[s] × score_obj[opposite(s)] )  /  Σ_s points[s]
power         = Σ_s god.sphereAffinity.scores[s]  /  DOMINION_POWER_BASELINE
dominion(obj) = match > 0 ? match × power : match
band          = Hostile < −1.5 ≤ Foreign < 0.5 ≤ Touched < 1.5 ≤ Held < 3.0 ≤ Sovereign
```

| Named constant | Value | Why |
|---|---|---|
| `DOMINION_OPPOSITION_WEIGHT` | chaos/order, light/darkness 1.0 · life/entropy 0.8 · force/mind 0.6 · energy/spirit 0.4 · matter/time 0.4 | The pair strengths already written into `src/engine/cosmology.ts` from The Cosmological Pattern (5/5, 4/5, 3/5, 2/5, 2/5). Designed, not tuned here. |
| `DOMINION_POWER_BASELINE` | 3 | The god's seeded score sum (2 + 1, THR-1768 D6). A fresh god reads power 1.0. |
| `DOMINION_BAND_FOREIGN_MIN` | −1.5 | No object reads Hostile at tick 0 on any seed, preset, or weight tested (table below). |
| `DOMINION_BAND_TOUCHED_MIN` | 0.5 | One point of the god's primary sphere on a place, or a seeded mortal of the god's culture, reaches it. |
| `DOMINION_BAND_HELD_MIN` | 1.5 | Reached at tick 0 only where terrain and site type both carry the god's spheres. |
| `DOMINION_BAND_SOVEREIGN_MIN` | 3.0 | Empty at tick 0 on every seed and preset; reached by tick 240 only where pressure has levelled a place. |

### Sub-decision 1 — power is one number outside the sum, not a per-sphere weight inside it

The ruling's formula, read literally, multiplies each bought sphere by the god's grown score in that sphere. THR-1768 seeds the god's score on its **two largest** spheres only (2 / 1), and the point-buy plan forbids seeding it from the full vector ("that is THR-1748's call"). So any third bought sphere, and any buy that differs from the god's alignment, gets a weight of zero. Measured band changes at tick 0 between the literal read and the shape read (cut as above but Hostile at −1, pair weights):

| god vector | seed 42 | seed 99 | seed 7 | zero-power bought spheres |
|---|---|---|---|---|
| the world's own god (3 + 2 on its alignment) | 15 / 2,329 | 14 / 2,673 | 38 / 2,708 | none |
| showcase mind 3 / spirit 2 | 259 / 2,329 | 23 / 2,673 | 176 / 2,708 | mind, spirit |
| stone force 3 / matter 2 | 743 / 2,329 | 1,014 / 2,673 | 930 / 2,708 | force, matter |
| spread life 2 / matter 2 / mind 1 | 986 / 2,329 | 1,074 / 2,673 | 1,191 / 2,708 | life, matter, mind |

Even when the god's power covers its bought spheres, the per-sphere product changes 14–38 objects' bands. It reweights the god's identity by whatever pressure happened to land. THR-1759 measured the same sign-flips (6–9 of 118 places). Power as one scalar keeps "what the god is" (the bought vector, fixed for the run) apart from "how strong the god is" (its grown score). That second meaning is what the ruling's "factored by the god's sphere score" asks for.

### Sub-decision 2 — power widens the friendly bands only

`dominion = match × power` on the positive side; a negative match is not scaled. Card cost reads the band (×1.5 Hostile → ×0.75 Sovereign, ruling table). Scaling the negative side too would make a stronger god pay **more** on hostile ground as it grows, so growth would punish the player. With this rule, growth only ever extends the home turf. Measured: the god's score sum rises from 3 to 4 by tick 240 on all three seeds (a mandate milestone lifts the primary 2 → 3), so power = 1.33. How fast power should grow is [THR-1765](https://linear.app/threadbare/issue/THR-1765)'s question. This ticket only sets how power enters the formula.

### Sub-decision 3 — opposition weighted by the designed pair strength

At full weight, a god whose spheres oppose the common terrain opens on a hostile map. Seed 7's time / energy god (tundra, coast and mountains are rich in matter, the opposite of time): **268 of 760 hexes and 91 of 246 places Hostile at tick 0**, against the ticket's goal that "the rest of the map reads Foreign rather than Hostile". Under the pair weights (matter↔time 0.4) that row is 0 hexes and 0 places. Half weight gives nearly identical counts (within 12 places on any row). The pair weights win because they are the cosmology's own designed numbers, not a value chosen for this ticket. Foundation pairs keep full opposition, as the cosmology says.

### Sub-decision 4 — one scale for every kind, no per-kind normalisation

Every kind already sits on the 0–10 sphere score scale. Places, mortals and cultures hold scores directly. Factions use a member **mean** (THR-1768 D3, chosen "so a faction of 40 stays on a person's 0–10 scale"). Hexes use the same terrain table that seeds places. Dividing by `Σ points` makes the match a weighted mean on that same scale, so one cut serves all five kinds. Measured maxima at tick 0 (world god, pair weight): hex 0.8–1.6, place 1.6–2.4, mortal 0.8, faction 0.0. Mortals top out at Touched and factions at Foreign in the opening. They climb through threads and pressure, which is the loop the ruling describes ("you build threads to help you spread dominion through secondary actors"). The Held mortal and the Held faction are earned, not given.

## The band census under the chosen cut

Band counts as **Hostile / Foreign / Touched / Held / Sovereign**, pair weights, power from the god's real score.

**The world's own god** (3 + 2 on its alignment):

| seed · god | tick | hexes | places | sublocations | mortals | factions |
|---|---|---|---|---|---|---|
| 42 · chaos/energy | 0 | 0/579/184/0/0 | 0/188/36/11/0 | 0/629/141/0/0 | 0/509/0/0/0 | 0/52/0/0/0 |
| 42 · chaos/energy | 240 | 0/527/236/0/0 | 2/224/64/9/11 | 1/688/146/0/0 | 0/761/0/0/0 | 0/70/10/0/0 |
| 99 · energy/light | 0 | 0/532/45/178/0 | 0/180/8/50/0 | 0/704/0/274/0 | 0/643/0/0/0 | 0/59/0/0/0 |
| 99 · energy/light | 240 | 0/532/45/178/0 | 0/240/19/71/12 | 0/765/0/297/0 | 0/942/0/0/0 | 0/73/0/9/0 |
| 7 · time/energy | 0 | 0/516/176/68/0 | 0/167/79/0/0 | 0/810/160/0/0 | 0/674/0/0/0 | 0/58/0/0/0 |
| 7 · time/energy | 240 | 0/516/176/68/0 | 10/189/106/16/0 | 0/882/177/0/0 | 0/1037/0/1/0 | 0/74/0/0/0 |

**The showcase god** (mind 3 / spirit 2, the `?seeded` review god):

| seed | tick | hexes | places | sublocations | mortals | factions |
|---|---|---|---|---|---|---|
| 42 | 0 | 0/758/5/0/0 | 0/180/50/5/0 | 0/770/0/0/0 | 0/310/199/0/0 | 0/52/0/0/0 |
| 42 | 240 | 0/681/82/0/0 | 6/215/81/8/0 | 0/693/142/0/0 | 0/492/269/0/0 | 0/70/10/0/0 |
| 99 | 0 | 0/748/7/0/0 | 0/222/16/0/0 | 0/978/0/0/0 | 0/643/0/0/0 | 0/59/0/0/0 |
| 99 | 240 | 0/685/70/0/0 | 6/282/54/0/0 | 0/933/129/0/0 | 0/942/0/0/0 | 0/82/0/0/0 |
| 7 | 0 | 0/760/0/0/0 | 0/236/10/0/0 | 0/970/0/0/0 | 0/545/129/0/0 | 0/58/0/0/0 |
| 7 | 240 | 0/615/145/0/0 | 0/276/45/0/0 | 0/841/218/0/0 | 0/880/158/0/0 | 0/70/4/0/0 |

**A spread buy** (life 2 / matter 2 / mind 1), which the literal formula would read wrongly:

| seed | tick | hexes | places | sublocations | mortals | factions |
|---|---|---|---|---|---|---|
| 42 | 0 | 0/325/438/0/0 | 0/104/110/21/0 | 0/366/404/0/0 | 0/509/0/0/0 | 0/52/0/0/0 |
| 42 | 240 | 0/152/534/77/0 | 4/75/131/82/18 | 0/247/423/165/0 | 0/619/142/0/0 | 0/62/18/0/0 |
| 7 | 0 | 0/347/413/0/0 | 0/111/108/27/0 | 0/345/625/0/0 | 0/674/0/0/0 | 0/58/0/0/0 |
| 7 | 240 | 0/292/323/145/0 | 7/134/102/66/12 | 0/332/469/258/0 | 0/741/297/0/0 | 0/59/15/0/0 |

**What the table shows:**

- **Nothing opens Hostile.** Every seed and every god vector has 0 Hostile objects at tick 0. The first Hostile ground appears by tick 240 (0–10 places) as lairs and notables press opposing spheres. The opposing dominion becomes something the player watches arrive. It does not greet them at the start.
- **Every god opens with a home turf** of Touched ground with some Held: 8–110 Touched places and 0–52 Held per seed and vector.
- **Sovereign is never given.** It is empty at tick 0 everywhere, and by tick 240 it appears only where pressure levelled a place of the god's spheres (9–18 places for the world god and the spread buy, none for the showcase god).
- **Home turf grows over a headless run** with no player at all, through power 1.0 → 1.33 and world pressure.

## What stays open

- **A mind / spirit god opens with a thin home turf.** Seed 7: 10 Touched places, 0 Held, 0 Touched hexes; seed 99: 16 Touched places, 0 Held. The cut does not cause this. The terrain table holds almost no mind or spirit: only sacred groves carry spirit 3, forests spirit 1 and ruins mind 1. Lowering Touched to 0.4 would admit every place with one point of the secondary sphere on every seed, which blurs the band for every other god. This goes to the map's fog as "the opening home turf for a god the terrain lacks", next to the god's seat ([THR-1792](https://linear.app/threadbare/issue/THR-1792)). The seat is the natural anchor, but making the seat a dominion writer belongs to [THR-1762](https://linear.app/threadbare/issue/THR-1762)'s frontier verbs.
- **Hexes never move.** Nothing writes to a hex, so the terrain read is fixed for the run. How the map overlay composes a hex's terrain band with the bands of the places on it is [THR-1766](https://linear.app/threadbare/issue/THR-1766)'s mock question, not the formula's.
- **Which spheres sum into power.** This prototype sums all twelve of the god's scores. A mandate presses the god's primary, so in practice the sum and the bought-only sum agree in every run measured. If THR-1765 adds a writer that grows an unbought sphere, it should revisit this.

## Not measured

- A bonded world's doom writer (4 entropy on every location per stage). It is asleep headless, as in THR-1759. Doom pressure is the opposing dominion's job ([THR-1763](https://linear.app/threadbare/issue/THR-1763)), and it will move the Hostile column, which is the intended direction.
- The browser `?seeded` world (a different cosmology and map from the CLI seeds). The showcase vector above is the same god, but on CLI worlds.
