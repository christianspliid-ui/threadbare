> **Prototype audit for THR-1763** (wayfinder map THR-1758, project Dominion — Player Power Progression). Design lane run 2026-10-09d, unattended. Inputs: the THR-1759 writer table (`Docs/audits/2026-10-06-thr-1759-dominion-writers-and-read-research.md`), the THR-1760 cut, the THR-1761 band buys and the THR-1762 frontier pace (`Docs/audits/2026-10-09-thr-176{0,1,2}-*.md`), Christian's 2026-10-05 ruling (`Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md` § Director's ruling and the THR-1745 gate comment: *"it supplies the sink the three models lacked (the frontier erodes)"*). The prototype is code on the never-merged branch `proto/thr-1763-erosion` (commit `cb306f02`).

# THR-1763 — the opposing dominion as a force

Ground truth: `main` @ `c4e887ed`, 2026-10-09. The CLI census ran on seed 42, medium map, with `state.doomClock.wokeAtTick = 0` forced by `eval` so doom and rivals act headless.

```
# Erosion on the REAL consumer (resolveSpherePressure), every tick-0 Foreign place of seeds 42/99/7,
# four god vectors, brought to Held / Sovereign by Claim 0.03 + Shift 6, then pressed.
npx esbuild scripts/proto-erosion-1763.ts --bundle --platform=node --format=esm \
  --outfile=.cache/proto-erosion-1763.mjs --external:fs --external:path
node .cache/proto-erosion-1763.mjs --seeds 42,99,7          # → scripts/proto-erosion-1763.out.txt (+ .rates.json)
# The THR-1761/1762 full-window economy with each erosion shape.
node scripts/proto-band-economy-1763-erosion.mjs            # → scripts/proto-band-economy-1763-erosion.out.txt
```

## Who pushes back today (measured)

Several THR-1759 facts moved since 10-06 (THR-1768 shipped). Erosion now removes whole points (`phaseSpherePressure.ts:271`, `Math.floor`). Missing scores are backfilled at init and every tick (`gameInit.ts:323`, `phaseSpherePressure.ts:395`). The god starts with real scores, and cultures seed 293 of 509 individuals.

| Force | What it does today | Evidence |
|---|---|---|
| **Rival probe** | 2 in the rival's primary, aimed at `rival.id`, which is not a graph node, so the consumer drops it. Over 218 ticks: 40 events, 80 magnitude, **all dropped**. | `orchestrator.ts:2005-2013`, `phaseSpherePressure.ts:440`, `RIVAL_PRESSURE_MAGNITUDE` (`types/sphereAffinity.ts:67`) |
| **Rival schemes** | 0.04 a phase (crack 0.1) on a target chosen uniformly from all top-level places, with no reference to the god's turf. Floors to 0 against any opposing score: **can never erode**. 19 events, 1.3 magnitude. | `orchestrator.ts:2140-2160, 2273-2282, 1773-1788`; `rival-scheme-config.ts:45-48` |
| **Rival spheres** | Drawn from the bottom four of the World-Soul ranking, **not** from `SPHERE_OPPOSITES`. Every non-god sphere has the same base weight and the sort is stable, so "bottom four" is the last four of `SPHERE_NAMES` (mind, spirit, time, entropy). | `rival.ts:57-74`, `remembrance.ts:406`, `types/index.ts:2-16` |
| **Doom** | 4 entropy on **every** location (both tiers) per stage crossing, plus archetype cards (force / chaos / mind / spirit, 3 × severity) on all locations or 2–3 threaded agents. Four crossings per clock (thresholds 0.2…0.8 of 1,080), the clock running ~1.19× game time once the First is bonded. Untargeted. One crossing (convergence) stripped life from 370 of 412 life-holding places. The always-Breach bug is fixed (THR-1774). | `phaseDoom.ts:417-426, 170-197`; `doomClock.ts:729-743`; `src/data/doom/*.json:5` |
| **Lairs** | 8 of the lair's sphere every 25 ticks **into itself only**; they spread by spawning new lairs (15 % per neighbour), not by pressure. The header comment "emits sphere pressure to adjacent hexes" is stale. | `lairEscalation.ts:5, 43-46, 336-376, 440-452` |
| **Decay** | **None.** Nothing lowers a sphere score except erosion and the cap. The 0.02 contested-source drain lowers sanctity, not scores. The nearest "untended" pattern is mortal stance degradation (10 grace ticks, then +0.05 a tick). | `phaseSpherePressure.ts:271-276`; `essenceSources.ts:259-262`; `strategicActionLifecycle.ts:1304-1316` |
| **Cultures** | Carry real scores from `veneratedSpheres`, and pass them to their members, who add to the break threshold as present mortals. Nothing else reads a culture's sphere for resistance. `culturalGravity`'s private opposition map (matter↔spirit, energy↔time) contradicts `SPHERE_OPPOSITES` (matter↔time, energy↔spirit). | `engine/sphereAffinity.ts:281-293`; `culturalGravity.ts:29-38`; `cosmology.ts:62-77` |
| **Absorption** | A push below the threshold (opposite score + floor(ally / 2) + present mortals) leaves no residue. Slow erosion is impossible under the current rule. When a carrier pushes the same place in the same tick, the cancelled remainder rounds down, so a burst exactly one point over the defence erodes nothing. | `phaseSpherePressure.ts:247-276` |

**Today, rival gods cannot move a god's turf at all, and the only real opposing force is doom, which hits everyone.**

## Canon on losing ground

- `Docs/canon/rulebook.md:598-604`: a run ends when the Mandate completes or the Doom Clock culminates; *"There is no soft-loss or hard-loss"*; both are *"kinds of endings, not kinds of wins"*.
- `rulebook.md:109, 195, 384`: control is contestable; rivals usurp or shatter control effects; schemes are *"an active antagonist, not just ambient sphere pressure"*.
- Vision north star: *"Losing a thread should hurt."* Nothing in canon or Vision describes a god being driven out of its ground.

## Measured erosion (prototype)

1,856 tick-0 Foreign places (four gods × three seeds, power 1) brought to Held and Sovereign by the THR-1762 policy. Held typically reads mind 2 / spirit 2; Sovereign mind 4 / spirit 3.

| Shape (from Held, left alone) | Lose one band, p50 days | To Foreign | One continuing Claim keeps the band |
|---|---|---|---|
| decay 0.005 a tick toward the seeded value | 45–51 | 78–87 | 100 % (decay skips tended places) |
| **decay 0.01** | **22–26** | **39–44** | **100 %** |
| decay 0.02 | 11–13 | 20–22 | 100 % |
| decay + broken poles regrow (0.005 / 0.01 / 0.02) | 17–20 / 8–10 / 4–5 | 55–60 / 27–30 / 14–15 | 100 % |
| burst 3, any interval | mostly never | never | 100 % |
| **burst 4 every k days** | **at the first burst** | **2k–3k** | **79–100 %** (spread buy lowest) |
| burst 6, every 10 days or faster | at the first burst | 2 bursts | 0–17 % |
| burst 6, every 20 days | 20 | 40 | 100 % |
| sink: burst 4, one a day per N Touched-or-better places | 3N / H days | — | 98 % → 87 % as held places grow 5 → 40 |
| sink: burst 6 | 3N / H days | — | 0 % |
| doom as shipped | Shepherd 18, spread 54, others never | Shepherd 36 | 100 % |

### Economy (T4 band table; income a tick at days 10 / 30 / 60 / 90)

| Variant | Shepherd | Thin turf | Rich sources | Primary pool pinned? |
|---|---|---|---|---|
| THR-1762 pace, no erosion | 3.2 / 6.0 / 10.6 / 13.2 | 3.1 / 5.5 / 10.3 / 13.1 | 3.1 / 5.7 / 10.6 / 13.2 | no |
| decay (any rate) | 3.2 / 5.9 / 9.9 / 12.0 | 3.1 / 5.4 / 9.6 / 11.7 | 3.1 / 5.6 / 9.8 / 12.0 | no |
| sink, burst 4, N = 10 | 3.2 / 6.0 / 9.7 / 11.7 | 3.1 / 5.5 / 9.3 / 11.8 | 3.1 / 5.7 / 9.4 / 11.7 | no |
| doom as shipped | 3.2 / 5.6 / 9.4 / 11.7 | = no erosion | = no erosion | no |
| THR-1761 harsh stand-in (a band per 20 days, everywhere) | 3.2 / 4.8 / 4.9 / 5.0 | 3.1 / 2.9 / 4.0 / 4.4 | 3.1 / 4.3 / 5.5 / 5.0 | **yes, days 60 and 90** |

Every targeted shape keeps the pool off zero; only blanket erosion pins it. The Model B / C day-90 target was 12.5 / 12.0.

### The last place

A god with only its seat (a free standing Claim) on Held ground: decay never applies (the seat is tended), burst 3 never takes it, burst 4 every 10 days or slower never does (every 3 / 5 days: 6 % / 2 %), doom as shipped never does (0 of 1,856). Burst 6 every 10 days or faster takes 82–100 % of seats to Foreign.

## The decision

**Three forces push back, each through a writer that already exists or one new term. Neglect fades your turf, rivals raid it, and doom scorches everyone's. Tending is the defence: one Claim, the seat or a single threaded mortal standing in a place keeps it. Your seat can never be taken, because canon has no losing state. A drop of a band is a chronicle line and a badge, never an interrupt.**

| Force | Rule | Named constant |
|---|---|---|
| **Neglect** (new, the steady sink) | On a place with no carrier this tick (no Claim, not the seat, no threaded mortal standing there), scores in the god's bought spheres relax toward their seeded value. Never below it, and broken opposing poles do not regrow. An untended Held place loses a band in about three weeks and is Foreign in about six. | `DOMINION_UNTENDED_DECAY_PER_TICK` = 0.01 |
| **Rivals** (re-aimed) | A rival's primary is drawn from the opposite poles of the god's bought spheres (`SPHERE_OPPOSITES`), weighted by points. The probe gets a real target: one of the god's Touched-or-better places, untended ones weighted first. It lands at 4 in the rival's primary. Its landings on the god's turf are throttled to one a day per 10 such places, all rivals together, so the raids grow as the turf grows. Scheme targeting (`selectSchemeTarget`) prefers the god's turf the same way. Scheme pressure stays at its narrative size. | `RIVAL_PRESSURE_MAGNITUDE` 2 → 4; `DOMINION_RAID_PLACES_PER_DAILY_BURST` = 10 |
| **Doom** (unchanged) | Stays world-wide and untargeted: it scorches everyone's ground, the god's included. | as shipped |
| **Cultures** (unchanged) | No extra resistance term. Culture scores already reach their members, and present mortals already add to the break threshold, so a town of the opposite faith holds out against a single Shift. | as shipped |
| **The seat** | Cannot fall below Touched. This is a guarantee, not a hope: the seat is a standing carrier, so neglect skips it, and a raid of 4 never takes a tended place at the throttled pace. The core plan doc adds a floor clamp so no future writer breaks it. | `DOMINION_SEAT_FLOOR_BAND` = Touched |
| **Band table** | Unchanged. The THR-1761 Hostile row stays (cost ×1.5, source ×0, yield ×0.5): no targeted shape pins the pool. | — |

**Tending as the defence** is a rule, not the rounding accident the prototype found. In the core, a place with a carrier this tick absorbs one raid burst without losing a band. Today that happens only because the engine rounds down a cancelled remainder. The core plan doc writes it as an explicit check so a non-integer burst (doom severity ≠ 1) does not slip through.

**What the player sees:**

- **A place drops a band:** one chronicle line naming the place, the new band word and the cause ("Hollowmere has slipped from Held to Touched; no one tends it", or the rival's name). Lines are coalesced to one a day when several places drop (Law 49).
- **The map overlay** carries a fading mark on that place until the player looks (a badge, Laws 39–40); its look is [THR-1766](https://linear.app/threadbare/issue/THR-1766)'s.
- **Never an interrupt.** Only a Followed mortal's moments interrupt (`Docs/ubiquitous-language/Agents.md:687`). A raid landing keeps today's rival toast.
- **Numbers never reach the player** (Law 13).

### Sub-decisions, each answered

1. **Are rivals generated opposite the player?** Not today: they are biased against a World-Soul ranking that collapses onto the last four sphere names. Yes from now on, through `SPHERE_OPPOSITES`, because Christian's ruling 2 says opposition follows the designed cosmology.
2. **Is rival pressure routed through the god's opposites?** Yes, through the rival's own primary, which is now one of those opposites, aimed at the god's turf.
3. **Do doom stages push onto the god's turf?** They already do, as they push onto every place. Aiming doom at the god would make the clock a second rival. Doom is the world ending for everyone, so it stays untargeted.
4. **Natural erosion of an untended Held place:** about one band per three weeks (0.01 a tick). That is slower than the frontier gains a band under a Claim (about two weeks), so a god that tends advances and a god that neglects retreats at a comparable pace.
5. **Does an opposed culture resist harder?** It already does, through present mortals in the break threshold. No new term.
6. **The player-facing event:** a chronicle line plus a map badge, coalesced, never an interrupt.
7. **Does the sink grow with the god?** Yes. Raids scale with held ground, and neglect scales with the ground a god cannot tend. A god with many places and few carriers loses the edges.
8. **Severity (can a god be driven out of its last Held place?):** no. The evidence settles it: canon says a run has no losing state (`rulebook.md:600`), and the measured shapes that would take a seat (bursts of 6 every 10 days or faster) are the same shapes that beat a tending Claim everywhere, which would break "tending is the defence". The god can lose everything it took, but never its home.

## Options weighed

- **Blanket erosion (the THR-1761 stand-in):** every holding loses a band every 20 days. Pins the primary pool by day 60 for all three gods; with a softened Hostile row it still touches zero. Rejected.
- **Decay at 0.02:** a band in 11–13 days, faster than a Claim advances. Neglect would outpace building and turn the game into upkeep. **Decay at 0.005:** six weeks per band; too slow to feel inside a 90-day run.
- **Broken poles regrow:** doubles the decay rate and makes Shift Dominion's work vanish. Rejected; a broken pole stays broken until something pushes it.
- **Raids of 6:** beat a tending Claim on 83–100 % of places and take the seat. Rejected, both for severity and because no defence would work. **Raids of 3:** never take Held ground. Too soft to count as a force.
- **Unthrottled raids:** every rival probe (about two a day) aimed at the god is a fixed tax that does not grow with the god. Rejected for the sink that grows with turf.
- **Aiming doom at the god's turf:** makes the world's ending a personal antagonist and doubles the rival's job.
- **A culture resistance term:** already carried by present mortals; a second term would count the same resistance twice.
- **Softening the Hostile row** (source 0 → 0.5, yield 0.5 → 0.75): only needed under blanket erosion. Kept as it is.
- **Reserving severity for Christian:** the ticket allowed it if the evidence could not settle it. Canon's "no soft-loss or hard-loss" settles it, so it is decided, with a veto line.

## Would change the call

- **Christian wants a god that can be driven from its home** ("losing ground should be able to end me"). That is a change to canon's endings, not to this ticket. The raid magnitude and a seat floor of Foreign would be the levers.
- **[THR-1765](https://linear.app/threadbare/issue/THR-1765), the god's own power.** Power multiplies the positive side of the band read, so a strong god's Held places sit further above the line, and raids of 4 bite less. If power grows fast, the raid throttle should tighten (fewer places per daily burst).
- **[THR-1764](https://linear.app/threadbare/issue/THR-1764), secondary actors.** If a bestowed power on a mortal makes it a stronger carrier, tending gets cheaper and neglect bites less; the decay rate may need to rise.
- **The combined run.** Neglect and raids were measured one at a time (day-90 income 12.0 and 11.7). Together they will land lower; the core plan doc ([THR-1748](https://linear.app/threadbare/issue/THR-1748)) re-runs them together, with the Claim's upkeep charged, before the numbers are frozen. Below about 10.5 a tick at day 90 (the static-turf figure), the throttle loosens to 15 places per burst.

## Findings for the map (not decisions)

- **The rival probe has never landed pressure.** It aims at a non-node id. The re-aim fixes it; recorded for the core plan doc.
- **`culturalGravity`'s private opposition map contradicts canon.** Filed as a bug in this project.
- **`lairEscalation.ts:5`'s header** claims pressure on adjacent hexes; the code pushes into the lair only. Folded into the same bug ticket.

## Not measured

- Neglect and raids together, and the Claim's upkeep (above).
- Present mortals in the break threshold: places are treated as empty, so a populated town holds longer than the tables show.
- Power above 1. The seat guarantee holds at power 1, the weakest case; a stronger god's places sit further from the line.
- Doom severity ≠ 1 (non-integer bursts). The breach archetype rolled on all three seeds has no all-locations sphere card.
- The browser `?seeded` world.
