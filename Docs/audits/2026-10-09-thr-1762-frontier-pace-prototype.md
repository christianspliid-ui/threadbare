> **Prototype audit for THR-1762** (wayfinder map THR-1758, project Dominion — Player Power Progression). Design lane run 2026-10-09c, unattended. Inputs: the THR-1759 writer table (`Docs/audits/2026-10-06-thr-1759-dominion-writers-and-read-research.md`), the settled THR-1760 cut (`Docs/audits/2026-10-09-thr-1760-dominion-formula-cut-prototype.md`), the THR-1761 band buys and their economy model (`Docs/audits/2026-10-09-thr-1761-dominion-band-buys-prototype.md`), Christian's 2026-10-05 ruling (`Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md` § Director's ruling). The prototype is code on the never-merged branch `proto/thr-1762-frontier-pace`.

# THR-1762 — how the frontier moves

Ground truth: `main` @ `de881c96`, 2026-10-09. Two scripts on `proto/thr-1762-frontier-pace`:

```
# 1. Pace: drives the REAL sphere-pressure consumer (resolveSpherePressure) on every
#    tick-0 place of seeds 42/99/7, four god vectors, power 1 and 1.33, 90 days.
npx esbuild scripts/proto-frontier-pace-1762.ts --bundle --platform=node --format=esm \
  --outfile=.cache/proto-frontier-pace.mjs --external:fs --external:path
node .cache/proto-frontier-pace.mjs --seeds 42,99,7       # → scripts/proto-frontier-pace-1762.out.txt

# 2. Economy at a faster turf pace: the THR-1761 model with the growth step read from env.
GROW_EVERY=168 node scripts/proto-band-economy-1762-pace.mjs --summary   # → scripts/proto-band-economy-1762-pace.out.txt
```

God vectors: showcase mind 3 / spirit 2, Shepherd life 3 / spirit 2, stone force 3 / matter 2, spread life 2 / matter 2 / mind 1. Power 1 is a fresh god; 1.33 is the god's power at tick 240 measured by THR-1760. The band read is the settled THR-1760 cut (pair-weighted opposition, power on the positive side only, Hostile < −1.5 ≤ Foreign < 0.5 ≤ Touched < 1.5 ≤ Held < 3.0 ≤ Sovereign).

## What the substrate does today (measured)

- **Neither Dominion card writes turf.** `hex.shift_dominion` (`src/data/unified-action-templates.ts:3638`) adds 0.15 to the legacy `sphereInfluence` bag under the key `'resonance'`, which is not a sphere, via `src/engine/hexActionBridge.ts:385-412`. `hex.claim_dominion` (`:4325`) is a sustained hold costing spirit 0.3 a tick that writes the hex field `divineInfluence`; a hex target leaves `targetNodeId` undefined (`src/engine/controlEffectSpawn.ts:95-96`), so `phaseControlEffects` pushes no sphere pressure. Both cards target hexes, and hexes are not graph nodes.
- **The other 18 sustained holds are far too fast.** `CONTROL_PRESSURE_PER_TICK` = 1 (`src/types/sphereAffinity.ts:61`) on each `perTickCost` sphere of a hold aimed at a node. On the primary alone that makes an unopposed Foreign place Sovereign in **1.3–2.9 days**, the row "today" in every table of the output.
- **A trickle never beats an opposing pole.** `resolveSpherePressure` (`src/engine/phaseSpherePressure.ts:247-276`) treats pressure in sphere *s* on a place that holds any of *opposite(s)* as destructive, and it erodes only `floor(pressure − (opposite score + floor(ally / 2) + present mortals' score))` **within one tick**. Below the threshold the push is absorbed and nothing builds. So today's hold leaves **34–85 of every god's 104–236 Foreign places untouched for the whole 90 days** (the "never" column of the "today" row), and a slow hold with no burst leaves up to 162 short of Sovereign. The engine already separates two moves: a burst that breaks ground, and a trickle that builds on clear ground.
- **Threads carry nothing.** No pressure writer reads `thread` edges. The only per-mortal writer is the legacy encounter step (`ENCOUNTER_PRESSURE_PER_STEP` = 1 at the actor's place), which nudge-model encounters never fire.
- **Ordinary casts already write.** A resolved cast whose template has a `sphereAffinity` pushes 3 on success / 1 on failure in that sphere at its target (`src/engine/unifiedActionResolution.ts:4126-4137`); 83 templates carry one. The player's casts go through it.
- **Adjacency is thin.** Only 70 / 89 / 89 of 235 / 238 / 246 places have an `adjacent` edge (`getAdjacentLocationIds`, `src/engine/graphQueries.ts:421`).
- **There is no god's seat in code** (no seat on the ascendant or `GameState`); THR-1792 names it.
- One in-world day = 12 ticks (`TICKS_PER_DAY`, `src/data/attention-constants.ts:14`).

## Measured pace

Days from Foreign to the first tick a place reads each band, p50 / p90 over every tick-0 Foreign place, seed 42 (seeds 99 and 7 agree within a day on every two-sphere god; full output in the proto branch):

| policy, steady on one place | showcase →Touched / Held / Sovereign | Shepherd | stone | spread (three spheres) | places that never move |
|---|---|---|---|---|---|
| today: hold 1 a tick on the primary | 0.1 / 0.5 / 1.3 | 0.1 / 0.5 / 1.3 | 0.3 / 0.5 / 1.8 | 0.2 / 0.8 / 2.9 | 34–85 |
| hold 0.1 a tick across the bought vector | 4.2 / 13.9 / 20.8 | 2.8 / 12.5 / 12.5 | 4.2 / 8.3 / 29.3 | 8.3 / 31.3 / 18.8 | 7–77 (Sovereign) |
| a 3-cast every 3 days, nothing else | 6 / 12 / 21 | 6 / 12 / 21 | 6 / 12 / 21 | 3 / 12 / 24 | 22–74 |
| Claim 0.03 across the vector, no break | 13.9 / 27.8 / 41.7 | 9.3 / 13.9 / 41.7 | 13.9 / 27.8 / 41.7 | 27.8 / 20.8 / 62.5 | 7–126 |
| **Claim 0.02 + Shift 6 while opposed, every 3 days** | 7.0 / 20.8 / 62.5 | 7.0 / 20.8 / 62.5 | 7.0 / 20.8 / 62.5 | 13.4 / 34.3 / 65.5 | 0 (73 spread never Sovereign) |
| **Claim 0.03 + Shift 6 while opposed (chosen)** | **4.7 / 13.9 / 41.7** | **4.7 / 13.9 / 41.7** | **4.7 / 13.9 / 41.7** | **10.0 / 23.8 / 65.5** | **0** |
| Claim 0.04 + Shift 6 | 3.5 / 10.4 / 31.3 | 3.5 / 10.4 / 31.3 | 3.5 / 10.4 / 31.3 | 8.3 / 18.7 / 49.9 | 0 |
| Claim 0.06 + Shift 6 | 3.0 / 7.7 / 20.8 | 3.0 / 7.0 / 20.8 | 3.0 / 7.0 / 20.8 | 6.5 / 13.4 / 34.3 | 0 |
| Claim 0.03 ×1.5 beside held ground + Shift 6 | 3.2 / 9.3 / 27.8 | 3.2 / 9.3 / 27.8 | 3.2 / 9.3 / 27.8 | 7.7 / 16.9 / 44.8 | 0 |
| Claim 0.03 + Shift 4 | 6.0 / 13.9 / 41.7 | 4.7 / 13.9 / 41.7 | 4.7 / 13.9 / 41.7 | 7.0 / 20.8 / 62.5 | 0–32 |

(p50 medians are taken over the places that reached the band, so a Sovereign median can sit below a Held median when few places reach Sovereign.)

At power 1.33 every Claim row is about a third faster to Sovereign (Claim 0.03 + Shift 6: 27.8 days on every two-sphere god, 41.7–44.7 on the spread buy). Shift 6 clears every opposing pole on every seed and god; Shift 4 leaves 0–32 places it cannot break.

### The economy at that pace

THR-1761 measured its chosen table under a stand-in where every holding climbs one band per 20 days held. The chosen Claim rate climbs about one band per 14 days at a fresh god's power. The same model, growth step shortened (`scripts/proto-band-economy-1762-pace.out.txt`), T4 table, income a tick at days 10 / 30 / 60 / 90:

| one band per | Shepherd | thin turf | rich sources |
|---|---|---|---|
| 20 days (THR-1761 stand-in) | 3.2 / 5.8 / 10.2 / 12.8 | 3.1 / 5.4 / 9.5 / 12.6 | 3.1 / 5.6 / 9.9 / 12.8 |
| **14 days (the chosen pace)** | **3.2 / 6.0 / 10.6 / 13.2** | **3.1 / 5.5 / 10.3 / 13.1** | **3.1 / 5.7 / 10.6 / 13.2** |
| 10 days | 3.3 / 6.4 / 10.8 / 13.2 | 3.1 / 5.9 / 10.7 / 13.2 | 3.2 / 6.2 / 10.8 / 13.3 |

Day-90 income rises 3–4 % over the stand-in and saturates (bands stop at Sovereign), far below the T5 overshoot of 15.2–15.6 that THR-1761 rejected. The band table holds at this pace without re-tuning.

## The decision

**Two moves, the way the engine already works: a god breaks ground with a cast, then tends it with a hold. Threads and the seat tend for free, more slowly. Steady attention on one place takes it from Foreign to Held in about two weeks and to Sovereign in about six; a stronger god does it in four.**

| Verb | What it pushes | Where | Rate (named constant) | Cost |
|---|---|---|---|---|
| **Claim Dominion** (re-keyed) | the god's bought vector, split by points | a place (not a hex) | `DOMINION_CLAIM_PRESSURE_PER_TICK` = 0.03 total a tick | 0.3 a tick, re-keyed from spirit to the god's primary |
| **Shift Dominion** (re-keyed: "break ground") | the one bought sphere whose opposing pole at that place weighs most (points × pair strength × opposite score) | a place | `DOMINION_BREAK_PRESSURE` = 6, once per cast | 4 essence, unchanged |
| **The god's seat** (THR-1792) | the god's bought vector, split by points | the seat town | a standing Claim at `DOMINION_SEAT_PRESSURE_PER_TICK` = 0.03 | free |
| **A threaded mortal** | the god's bought vector, split by points | the place the mortal stands in (sublocations resolve to their place) | `DOMINION_THREAD_CARRY_PER_TICK` by tier 0.005 / 0.01 / 0.015 / 0.02; all carriers in one place capped together at `DOMINION_CARRY_CAP_PER_PLACE` = 0.03 | the thread's existing upkeep |
| **Every other sustained hold** | its `perTickCost` spheres, as today | its target node, as today | `CONTROL_PRESSURE_PER_TICK` 1 → 0.03 | unchanged |
| **Every other cast** | its card's sphere, as today | its target, as today | `ACTION_PRESSURE_SUCCESS` 3 / `_FAILURE` 1, unchanged | unchanged |

Sub-decisions, each answered:

1. **Vector or one sphere.** Tending (Claim, seat, threads) pushes the god's whole bought vector by points; that is what the band reads, and on the primary alone the hold leaves a god's secondary sphere unbuilt and stalls on every place that holds the primary's opposite. Breaking ground pushes one sphere, the one whose opposite weighs most at that place, because only a single-sphere burst can clear a threshold. Ordinary casts keep their card's sphere; a card's sphere is its identity.
2. **Magnitudes.** Above. Shift 6 clears every tick-0 opposing pole measured; 4 leaves up to 32 places unbreakable for the showcase god on seed 7. Present mortals add their opposing score to the threshold, so a crowded town of the opposite pole can still hold out against one Shift. That resistance is the engine's, and is left as it is.
3. **Target pace.** About one band per two weeks of steady attention at a fresh god's power. It is not a feel number: the THR-1761 economy was measured against one band per 20 days and named "Sovereign routine by day 30" as the overshoot risk. At 0.03 one place reaches Sovereign by day 42 (28 at power 1.33), and the economy stays on target. The Claim's upkeep (0.3 a tick from the primary, about 3.6 a day) against THR-1761's primary net after upkeep (0.9 a tick at day 10, 3.4–3.7 at day 90) affords one or two concurrent claims early and about ten late. Growing power and income widen the frontier, as the ruling asks.
4. **Adjacency.** No bonus in this pass. Only 30–37 % of places have an `adjacent` edge, so "easier beside held ground" would apply to a third of the map with no visible rule for which third. Measured, a ×1.5 bonus would take Sovereign from 41.7 to 27.8 days where it applies.
5. **Must the carrier be Held?** No. Among thousands of seeded mortals, THR-1761 found one that reads Held by tick 240. A Held gate would mean threads never spread turf, against the ruling's "you build threads to help you spread dominion through secondary actors". The thread itself is the qualifier, scaled by tier. Whether a power bestowed on a mortal adds to this is [THR-1764](https://linear.app/threadbare/issue/THR-1764)'s question.
6. **The seat (map fog, from THR-1760).** The seat is a standing, free Claim. A mind/spirit god the terrain lacks gets one place it can always grow. An unopposed seat reaches Held in about two weeks; an opposed seat needs the god's first Shift there. That gives the opening a natural first act.

## Options weighed

- **Keep today's rates.** One day to Sovereign, and a third or more of the map is unreachable because the trickle is absorbed. Fails "expanded strategically".
- **Hold on the primary only.** The secondary never builds; 34–85 places stall per god.
- **Casts as the only writer.** 22–74 places never move (a 3 cannot clear thresholds of 3 and up), and turf would grow by cast-spam, not by holding.
- **Claim 0.02** (exactly the THR-1761 stand-in). Sovereign at 62 days, and a three-sphere buy never reaches Sovereign on 73–103 places inside the window. Too slow for the spread buy.
- **Claim 0.04–0.06.** Sovereign at 21–31 days at a fresh god, about 14–21 at power 1.33. That is "Sovereign routine by day 30", the overshoot THR-1761 warned of.
- **An adjacency bonus.** Ruled out above, on measured coverage.
- **A Held or Touched gate on carriers.** Ruled out above; threads would carry nothing for a thin-turf god.
- **Wellspring sources as writers.** Left out. A source is income, already scaled by its host's band (THR-1761). Making it a writer too would count the same holding twice.

## Would change the call

- **[THR-1763](https://linear.app/threadbare/issue/THR-1763), the opposing dominion.** These rates are measured with no erosion. If THR-1763 erodes held ground faster than about one band per two weeks, a single Claim cannot hold a place against it, and either the Claim rate rises or the erosion slows. THR-1763 owns that trade, and these constants are its input.
- **[THR-1765](https://linear.app/threadbare/issue/THR-1765), the god's own power.** Power multiplies the positive side of the band read, so a god whose power grows past about 1.5 will reach Sovereign in under four weeks per place. If THR-1765 grows power fast, the Claim rate should come down with it.
- **A playtest that finds two weeks to Held too slow to feel.** The constants are named and re-run in seconds.
- **The economy model does not yet charge the Claim's upkeep** against its spending. The core plan doc ([THR-1748](https://linear.app/threadbare/issue/THR-1748)) should add it before the numbers are frozen.

## Finding for the map (not a decision)

The THR-1760 census tested the world's own god, the showcase god and a spread buy, and found nothing Hostile and nothing Sovereign at tick 0. This run's census adds two vectors and finds both at tick 0:

- **Shepherd (life 3 / spirit 2):** 4–12 Hostile places per seed (lairs, elder ruins, a sacrifice site: entropy holds) and 4–8 Sovereign (healing springs, groves, a herb garden, two elder ruins, one lair).
- **Stone (force 3 / matter 2), seed 7:** 28 Sovereign at power 1. At power 1.33, 13–48 per seed (crystal caverns, iron seeps, forts, capitals, 30 elder ruins on seed 99).

A life god facing entropy lairs as hostile ground matches the cosmology. The THR-1760 claims "no world starts hostile" and "Sovereign is never given" hold only for the vectors it measured. This is recorded on the map for [THR-1763](https://linear.app/threadbare/issue/THR-1763) and the core plan doc. It does not reopen THR-1760.

## Not measured

- **Present mortals' resistance** in the break threshold. The prototype treats every place as empty, so a populated town of the opposite pole will hold out longer than the table shows.
- **Thread carry in a running world.** The rate is set by arithmetic: a tier-4 champion pushes two-thirds of one Claim, and a town of carriers is capped at one Claim. Where mortals actually stand over a run is not simulated.
- **Pressure from other writers on the same places** (notables, lairs, trade). THR-1759 measured it as small on places (0.44 magnitude per place over 240 ticks), except at lairs.
- **The browser `?seeded` world**, whose cosmology and map differ from the CLI seeds.
