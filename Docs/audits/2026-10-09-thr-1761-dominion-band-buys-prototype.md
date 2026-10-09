> **Prototype audit for THR-1761** (wayfinder map THR-1758, project Dominion — Player Power Progression). Design lane run 2026-10-09b, unattended. Inputs: the settled formula (`Docs/audits/2026-10-09-thr-1760-dominion-formula-cut-prototype.md`), the full-window model (`scripts/power-progression-model.mjs`, THR-1767), Christian's 2026-10-05 ruling (`Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md` § Director's ruling), the shipped THR-1747 economy, the THR-1775 cast-odds re-measure (`Docs/status/2026-10-09-thr-1775.md`). The prototype is code on the never-merged branch `proto/thr-1761-band-buys`.

# THR-1761 — what the Dominion band buys

Ground truth: `main` @ `b8e91e55`, 2026-10-09. Two prototype scripts, both on `proto/thr-1761-band-buys`:

```
# 1. Where a god's holdings actually sit (the settled THR-1760 cut, real worlds)
npx esbuild scripts/proto-band-holdings-1761.ts --bundle --platform=node --format=esm \
  --outfile=.cache/proto-band-holdings.mjs --external:fs --external:path
node .cache/proto-band-holdings.mjs --seeds 42,99,7 --ticks 240      # → scripts/proto-band-holdings-1761.out.txt

# 2. The 1,080-tick scripted player with a band on every held mortal and source
node scripts/proto-band-economy-1761.mjs              # → scripts/proto-band-economy-1761.out.txt
node scripts/proto-band-economy-1761.mjs --summary    # → scripts/proto-band-economy-1761.summary.txt
```

## The decision — one table

| Band | Card cost × | Cast odds (sphere factor) | Thread yield × | Source income × |
|---|---|---|---|---|
| Hostile | 1.5 | −0.10 | 0.5 | 0 |
| Foreign | 1.0 | 0 | 1.0 | 1.0 |
| Touched | 0.9 | +0.03 | 1.1 | 1.1 |
| Held | 0.8 | +0.06 | 1.25 | 1.25 |
| Sovereign | 0.75 | +0.10 | 1.5 | 1.5 |

- **Foreign is par.** A holding on neutral ground costs and pays exactly what it does on `main` today. Home turf adds upside; hostile ground takes it away.
- **Thread yield** becomes a per-tier base (THR-1745 Model B: 0.15 / 0.30 / 0.45 / 0.60 by thread tier) times the mortal's band multiplier, replacing the flat 0.1. A location thread reads the place's band.
- **Source income** is the existing typed income (base × flowering × same-sphere diminishing returns) times the host place's band multiplier. There is no Held gate.
- **Card cost** reads the band of the card's target. A card with no world target (self, the god's own pool) is priced at par. The band multiplier applies to the authored cost first, rounded half up; the existing flat discounts (`SPHERE_DISCOUNT`, `SECONDARY_SPHERE_DISCOUNT`) apply after it; the result is floored at `max(SPHERE_DISCOUNT_MIN_COST, ceil(authored × 0.5))`, so the two layers together never take more than half a card's price.
- **Cast odds** read the target's band as the resolution `sphereFactor`, which is hard-coded 0 today (`src/engine/unifiedActionResolution.ts:434`). The card's forecast words (`CARD_READOUT_SPHERE_FACTOR`, `src/engine/playerCastReadout.ts:64`) must read the same value, or the words lie.
- **Effect magnitude does not read the band.** It stays on `spherePowerMultiplier`, the god's own score. The band moves price and odds; the god's power moves magnitude. Each channel is read once.

Named constants for the core plan doc (THR-1748): `DOMINION_COST_MULTIPLIER`, `DOMINION_COST_FLOOR_SHARE` (0.5), `DOMINION_SPHERE_FACTOR`, `ESSENCE_PER_THREAD_BY_TIER`, `DOMINION_THREAD_YIELD_MULTIPLIER`, `DOMINION_SOURCE_INCOME_MULTIPLIER`, each keyed by band, each with a CMS row.

## Measured input — where a god's holdings sit

The settled cut, read on real headless worlds (seeds 42 / 99 / 7, medium, tick 0 and tick 240), for the world's own god, the Shepherd (life 3 / spirit 2), the showcase god (mind 3 / spirit 2) and a spread buy. Every world seeds six latent essence sources. Full output: `scripts/proto-band-holdings-1761.out.txt`.

| god | seed | source hosts at t0 (H/F/T/Hd/S) | at t240 | best six mortals at t0 | at t240 |
|---|---|---|---|---|---|
| world god | 42 | 0/5/1/0/0 | 0/5/1/0/0 | Foreign (match 0) | Foreign |
| world god | 99 | 0/6/0/0/0 | 0/6/0/0/0 | Foreign | Foreign |
| world god | 7 | 0/1/5/0/0 | 0/0/6/0/0 | Foreign | one Held, five Foreign |
| Shepherd | 42 | 0/5/1/0/0 | 0/4/1/1/0 | Touched (0.8) | Touched |
| Shepherd | 99 | 0/6/0/0/0 | 0/6/0/0/0 | Foreign | Foreign |
| Shepherd | 7 | 0/6/0/0/0 | 0/6/0/0/0 | Touched | Touched |
| showcase | 42 | 0/6/0/0/0 | 0/5/1/0/0 | Touched | Touched |
| showcase | 99 | 0/6/0/0/0 | 0/5/1/0/0 | Foreign | Foreign |
| showcase | 7 | 0/6/0/0/0 | 0/2/4/0/0 | Touched | Touched |
| spread | 42 | 0/4/2/0/0 | 0/4/2/0/0 | Foreign (0.4) | Touched |
| spread | 99 | 0/2/4/0/0 | 0/2/0/4/0 | Touched | Touched |
| spread | 7 | 0/6/0/0/0 | 0/6/0/0/0 | Foreign | Touched |

**Of the 72 source-host reads at tick 0, none is Held.** By tick 240, with no player at all, 5 of 72 are. Seeded mortals carry almost no sphere score (their best match is exactly 0, 0.4 or 0.8), so the best mortal a god can thread is Foreign or Touched. One mortal in the whole census (seed 7, world god, tick 240) reads Held.

This is the measurement that decided the source column. The 2026-10-05 sketch ("source income: Held and above only") switches the source economy off for every god on every seed, until something this map has not designed yet moves a place up a band.

## Measured result — the economy under each candidate table

The THR-1767 model, base economy = `main` after THR-1747 (thread upkeep 0.1 / 0.2 / 0.35 / 0.5, the Wellspring at bond + 48, source upkeep 0.15 charged, the held-ground milestone at two flowering sources). Three gods, bands taken from the census above, best first:

- **Shepherd** (seed 42): threads Touched, sources Touched + three Foreign.
- **Showcase, thin turf** (seed 99): threads and sources all Foreign.
- **World god, rich sources** (seed 7): threads Foreign, sources all Touched.

Three turf scenarios, because the writers that move a band are other tickets on this map:

- **static**: bands never move (today's engine: no frontier verbs, THR-1762; no secondary-actor writer, THR-1764).
- **growing**: every holding climbs one band per 20 days held. A stand-in for the frontier verbs, not a design.
- **pressed**: from day 30, every holding loses one band per 20 days. A stand-in for the opposing dominion (THR-1763), deliberately harsh.

Income per tick at days 10 / 30 / 60 / 90 (primary net after upkeep in brackets at day 90), from `scripts/proto-band-economy-1761.summary.txt`:

| table | scenario | Shepherd | thin | rich |
|---|---|---|---|---|
| T0 no band (`main` today) | any | 2.7 / 3.8 / 6.1 / 7.1 (0.8) | same | same |
| T1 the 2026-10-05 sketch (Held+ gates) | static | 2.2 / 2.2 / 2.8 / 2.8 (−0.6) | same | same |
| T1 | growing | 2.2 / 3.6 / 5.9 / 10.1 (1.8) | 2.2 / 2.2 / 5.7 / 7.5 (0.8) | 2.2 / 2.7 / 6.5 / 9.6 (1.7) |
| T2 graded, Foreign pays half | static | 3.1 / 5.0 / 7.8 / 9.1 (0.9) | 2.6 / 3.2 / 4.4 / 5.5 (**0.0**) | 2.8 / 4.2 / 7.1 / 8.3 (1.2) |
| **T4 par at Foreign (chosen)** | **static** | **3.2 / 5.5 / 8.9 / 10.5 (2.1)** | **3.1 / 5.2 / 8.5 / 10.1 (1.8)** | **3.1 / 5.3 / 8.7 / 10.3 (2.1)** |
| **T4** | **growing** | **3.2 / 5.8 / 10.2 / 12.8 (3.5)** | **3.1 / 5.4 / 9.5 / 12.6 (3.4)** | **3.1 / 5.6 / 9.9 / 12.8 (3.7)** |
| T5 par, steeper (×1.25 / 1.5 / 2) | growing | 3.4 / 6.4 / 11.9 / 15.6 (5.2) | 3.1 / 5.7 / 10.5 / 15.2 (5.1) | 3.2 / 6.1 / 11.4 / 15.6 (5.5) |
| T6 par, flat 0.1 yield kept | growing | 2.8 / 4.0 / 6.6 / 8.4 (2.0) | 2.7 / 3.9 / 6.6 / 8.4 (2.0) | 2.8 / 4.1 / 7.0 / 8.6 (2.2) |

The target shape is the THR-1745 Model B and C tables: income rising with turf, 12.5 (B) and 12.0 (C) a tick at day 90, a primary pool never pinned at zero.

**What the table shows:**

- **T1, the sketch, starves every god.** With static bands, income sits at 2.2–2.8 a tick for the whole run, and the god's own pool runs a deficit from day 30 (net −0.6). That is Model 0's failure again. Even with growing turf the thin god earns nothing from its sources until day 60.
- **T2 punishes having no turf.** Paying half on Foreign ground leaves the thin-turf god worse off than today's game (5.5 against 7.1 at day 90), with its pool pinned at zero by day 90. The god the terrain lacks (the map's fog line from THR-1760) is the god this table hurts most.
- **T4 lands on the target.** Static, it lifts every god from 7.1 to 10.1–10.5 a tick, because threads finally pay their keep. Growing, it reaches 12.6–12.8 a tick by day 90, which is Model B's and C's day-90 figure, with the primary pool positive at every snapshot. The three gods end within 0.2 a tick of each other: turf decides income only once turf moves. The thin god's handicap is a slower climb, not a lower ceiling.
- **T5 overshoots.** 15.2–15.6 a tick at day 90, a quarter above the target. That is the "late game goes infinite" risk the ticket named.
- **T6 keeps the threads a pure cost.** At the flat 0.1, a thread's yield equals its tier-1 upkeep and never catches up, so "spending through a sphere builds infrastructure that pays back" (the ruling) does not hold. Income tops out at 8.4–8.6.

### Card cost — rounding blunts Touched

Card costs are small integers. With half-up rounding, ×0.9 changes nothing below a cost of 6 (3 → 2.7 → 3; 4 → 3.6 → 4; 5 → 4.5 → 5), so on Touched ground only the dearer cards (bind 10 → 9, claim 5 → 5) get cheaper. Held (×0.8) cuts a 3 to 2 and a 4 to 3; Sovereign (×0.75) cuts a 2 to 2, a 3 to 2, a 4 to 3. Over a growing run the scripted player's spend index falls to 0.84–0.90; static, it stays at 0.98–1.00. That is intended: Touched is "a little", and the price the player can feel arrives at Held. Showing the player *why* a card got cheaper is THR-1766's mock.

### Cast odds — measured by formula

`computeResolutionThreshold` (`src/engine/resolutionService.ts:124`) adds `sphereFactor` outside the gain: P = 0.40 + 1.25 × (capability − difficulty) + sphereFactor + modifiers, clamped to [0.05, 0.95] (`ODDS_AT_PAR`, `ODDS_GAIN`). So the band shifts the odds by exactly its table value. On THR-1775's re-measured fresh-god casts (difficulty 0.35): a primary-reach cast at P 0.405 goes to 0.505 on Sovereign ground and 0.305 on Hostile; an off-domain cast at 0.172 goes to 0.272 and 0.072. The largest band swing (+0.10) is smaller than the gap between the god's primary and off-domain reach (0.23). Who the god is still matters more than where it acts. `ResolutionInput.sphereFactor` is documented as 0.0–0.2 (`src/types/resolution.ts:25`); the table stays inside it on the friendly side and adds a negative value for Hostile, which that comment must widen to −0.10..0.2.

## Options weighed

- **The 2026-10-05 sketch (T1).** Its source and yield gates are the session's engine translation of the ruling, not Christian's words. His words are "cheaper and more powerfully" and "graded". It fails the run (static income flat, pool in deficit from day 30).
- **Graded with Foreign at half (T2).** Fails the thin-turf god.
- **Steeper upside (T5).** Overshoots the target by a quarter.
- **Keep the flat 0.1 thread yield (T6).** Threads never pay back.
- **Effect magnitude by band** (a second multiplier on effect size). Rejected: `spherePowerMultiplier` already scales magnitude by the god's power. Reading the band there too would count turf twice in one roll.
- **A cost multiplier that stacks freely on the flat discounts.** Rejected in favour of the half-price floor: a 3-cost secondary-sphere card on Sovereign ground would otherwise fall to 1.

## Would change the call

- **THR-1762 (the frontier verbs) moving bands much faster than one band per 20 days.** The growing column is a stand-in. If the real verbs make Sovereign routine by day 30, T4's day-90 income rises toward T5's and the upper multipliers should come down.
- **THR-1763 (the opposing dominion).** The pressed column is a harsh stand-in: every holding loses a band every 20 days from day 30. Under T4 that pins the primary pool by day 60 for all three gods (net −1.0 to −1.4), because hostile sources pay nothing while upkeep still runs. How hard losing ground should bite is THR-1763's question, and the map lists it as a candidate for Christian to keep. This table fixes the floor values only. If THR-1763 decides losing ground must never lock the god out, it should soften the Hostile row (source 0 → 0.5, yield 0.5 → 0.75) or slow the erosion; the economy script re-runs either in seconds.
- **The card-buy fork (THR-1770, reserved).** Under every table here the last new card arrives on day 40–42. That fails the target's "a card still arriving in the last third", and no band multiplier can fix it. It is the gift-or-market question already waiting on Christian.

## Not measured

- **A bonded browser world.** The `?seeded` cosmology differs from the CLI seeds; the showcase vector is measured on CLI worlds.
- **Location threads.** The model threads mortals only. A location thread reads its place's band, and the place census above says those sit Foreign–Held.
- **Rival escalation off the top thread tier.** It is unchanged by this table, and the model does not simulate rivals.
- **Mortal-minted shrines and relics** (Model B's source writers). They are not decided on this map, so they are left out. With them, Model B reached 16 flowering sources; the Held-band multiplier would compound on them.
