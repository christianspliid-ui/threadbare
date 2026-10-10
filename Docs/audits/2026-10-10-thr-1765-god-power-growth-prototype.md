> **Prototype audit for THR-1765** (wayfinder map THR-1758, project Dominion — Player Power Progression). Design lane run 2026-10-10b, unattended, decided by delegation (process.md rule 4). Inputs: the THR-1760 cut (power = the god's score sum ÷ 3, widening the positive side only), the THR-1761 band table, the THR-1762 frontier pace, the THR-1763 erosion rules, the THR-1764 carriers (`Docs/audits/2026-10-09-thr-176{0,1,2,3}-*.md`, `Docs/audits/2026-10-10-thr-1764-*.md`), the THR-1745 Model C sketch and Christian's 2026-10-05 ruling (`Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md`), the THR-1749 point-buy plan. The prototype is code on the never-merged branch `proto/thr-1765-god-power`.

# THR-1765 — how the god's own power grows

Christian's ruling: dominion scores on the god's affinity to the spheres, *"factored by the god's sphere power"*, and he wants the late game *"to feel like a god grown in power"*. THR-1760 fixed how power enters the band read and left how fast it grows to this ticket.

Ground truth: `main` @ `1ae960cb`, 2026-10-10.

```
# on proto/thr-1765-god-power
npx esbuild scripts/proto-power-census-1765.ts --bundle --platform=node --format=esm \
  --outfile=.cache/proto-power-census-1765.mjs --external:fs --external:path
node .cache/proto-power-census-1765.mjs --seeds 42,99,7     # → scripts/proto-power-census-1765.out.txt
node scripts/proto-power-economy-1765.mjs                   # → scripts/proto-power-economy-1765.out.txt
```

## What grows the god's power today (measured)

| Fact | Evidence |
|---|---|
| The god's `sphereAffinity.scores` seed primary 2 / secondary 1 (sum 3, power 1.0). | `Docs/status/2026-10-08-thr-1768.md` D6; THR-1760 `DOMINION_POWER_BASELINE` 3 |
| A score levels by triangle cost: level n costs n progress. 2 → 3 costs 3, 3 → 4 costs 4. | `src/types/sphereAffinity.ts:119` (`triangleCost(n) = n`), `phaseSpherePressure.ts:320` |
| **One writer:** mandate pressure, +2 at each of two stage advances and +5 at completion, onto the mandate's sphere. Nine progress a run: primary 2 → 4, power 1.0 → 1.67. | `phaseMandate.ts:322-356, 440-456`; `MANDATE_PRESSURE_MILESTONE` 2, `_COMPLETION` 5 (`types/sphereAffinity.ts:71-73`) |
| **Two readers of the score besides Dominion:** the Iron warhost and the Veil rift signatures, through `spherePowerMultiplier(primary score)` = 0.6 + 0.14 × score (0.88× at 2, 1.16× at 4, 2.0× at 10). | `sphereScaling.ts:25`; `encounterAftermath.ts:3821, 3936`; `SIGNATURE_SCALE_FLOOR/CEIL` 0.6 / 2.0 (`reach-signature-content.ts:32-38`) |
| Attunement marks fire at 20 and 60 essence **earned** through a sphere and grant a repertoire card; they push no score. The crossing helper takes its threshold table as a parameter. | `nudge-constants.ts:521`; `essenceEarned.ts:99-117` (`attunementThresholdsCrossed(before, after, thresholds = SPHERE_ATTUNEMENT_THRESHOLDS)`) |
| Under the THR-1747 economy the scripted player earns about **2,960 primary essence a run** (secondary about 120, because its pool sits at the cap). THR-1745's Model C ladder [20, 60, 150, 300, 600] was sized for the starved Model 0 economy: here all five marks are spent by day 40. | `scripts/proto-power-economy-1765.out.txt`, `earned` column |

## What power does to the map (census)

Tick-0 worlds, seeds 42 / 99 / 7, top-level places only (235–246), settled cut B with pair-strength opposition. Each cell is **places at Touched or better / of which Sovereign**, one per seed.

| God (bought vector) | power 1.0 | 1.33 | 1.67 | **2.0** | 2.67 | 3.33 |
|---|---|---|---|---|---|---|
| Shepherd life 3 / spirit 2 | 41/5 · 53/4 · 52/8 | 48/8 · 61/5 · 58/12 | 48/21 · 61/18 · 58/32 | **73/21 · 92/18 · 69/32** | 74/30 · 111/28 · 76/38 | = 2.67 |
| Showcase mind 3 / spirit 2 | 55/0 · 16/0 · 10/0 | 80/0 · 37/0 · 38/0 | 80/0 · 37/0 · 38/0 | **86/5 · 44/0 · 40/0** | 95/8 · 51/0 · 52/0 | 95/10 · 51/4 · 52/7 |
| Stone force 3 / matter 2 | 105/0 · 112/0 · 136/28 | 106/13 · 113/42 · 136/48 | 106/68 · 113/71 · 136/79 | **106/71 · 113/72 · 136/80** | 106/79 · 113/79 · 136/122 | 106/103 · 113/79 · 136/135 |
| Spread life 2 / matter 2 / mind 1 | 131/0 · 153/0 · 135/0 | 172/0 · 162/0 · 136/0 | 172/12 · 162/52 · 136/24 | **172/21 · 164/52 · 136/27** | 177/77 · 164/107 · 136/66 | 178/99 · 178/120 · 152/97 |
| The world's own god (chaos/energy, energy/light, time/energy) | 47/0 · 58/0 · 79/0 | 56/0 · 62/4 · 92/0 | = 1.33 (+1) | 56/11 · 62/50 · 92/0 | 69/12 · 71/51 · 92/7 | 69/12 · 82/51 · 92/32 |

Two readings:

- **Power never makes a neutral place friendly.** It multiplies a positive match only (THR-1760), so the places it can lift are the ones already leaning the god's way. The count of friendly places stops growing at about power 2 for every vector (Shepherd 69–92 at 2.0, 74–111 at 2.67; Showcase 40–86 → 51–95).
- **Past power 2, power only stacks Sovereign onto ground that is already friendly.** The spread god goes from 21–52 Sovereign places at 2.0 to 66–107 at 2.67; the stone god from 71–80 to 79–122. THR-1762 made Sovereign the reward for about six weeks of tending a place. Unbounded power would hand it out across a third to half of the map without the god ever looking at those places.

## What power does to the economy (full-window model)

The THR-1763 economy with one change of shape: every holding carries a continuous match, and its band is read through the god's power, so power is live on every price, yield and source. Neglect (0.04 match a day on an untended holding) and raids (burst 4, one landing a day per 10 Touched-or-better holdings) run **together** from day 30. That is the combined run THR-1763 left owed. Income a tick at days 10 / 30 / 45 / 60 / 90:

| Variant | Shepherd | Thin turf | Rich sources | Power at day 90 | Primary score / signature | Sphere levels (day) |
|---|---|---|---|---|---|---|
| Power pinned at 1 (the THR-1761..1763 baseline) | 3.3 / 5.9 / 8.8 / 10.0 / 11.9 | 3.2 / 5.9 / 8.6 / 9.8 / 11.8 | 3.2 / 5.9 / 8.8 / 10.0 / 12.0 | 1.0 | 2 / ×0.88 | — |
| V0 today: mandate only | … / 10.2 / 12.2 | … / 10.1 / 12.0 | … / 10.2 / 12.6 | 1.67 | 4 / ×1.16 | 50, 75 |
| V1 mandate + Model C ladder [20, 60, 150, 300, 600], +1 a mark, both bought spheres | 3.3 / 6.2 / 9.3 / 10.4 / 12.4 | 3.2 / 6.0 / 9.2 / 10.3 / 12.3 | 3.2 / 6.1 / 9.5 / 10.8 / 12.6 | 2.33 | 5 / ×1.30 | 12, 31, 40, 75 |
| V2 as V1, +2 a mark | 3.4 / 6.6 / 9.6 / 10.7 / 12.4 | 3.3 / 6.6 / 9.2 / 10.6 / 12.3 | 3.3 / 6.6 / 9.5 / 10.8 / 12.8 | 2.67 (2.0 by day 30) | 6 / ×1.44 | 7, 10–12, 19, 31–32, 75 |
| V3 Model C: ladder on the primary + clash trials (6 secondary every 120 ticks for +2) | 3.3 / 6.6 / 9.3 / 10.7 / 12.4 | 3.2 / 6.3 / 9.2 / 10.6 / 12.3 | 3.2 / 6.6 / 9.5 / 10.8 / 12.8 | 2.67 | 7 / ×1.58 | 10, 20, 30, 50, 75 |
| V4 V1 + turf feedback (+1 progress per Sovereign holding every 10 days) | 3.3 / 6.6 / 9.6 / 10.8 / 12.9 | … / 12.5 | … / 13.3 | **3.67** | **9–10 / ×1.86–2.0** | eight to nine levels |
| **V6 mandate + run-long ladder, +1 a mark, both bought spheres, power cap 2.0** | **3.3 / 6.2 / 9.3 / 10.4 / 12.4** | **3.2 / 6.0 / 9.2 / 10.3 / 12.3** | **3.2 / 6.1 / 9.5 / 10.8 / 12.6** | **2.0 (cap from day 40)** | **6 / ×1.44** | **12, 31, 40, 70, 86** |

No variant pins the primary pool, and no variant leaves upkeep unpaid. Power moves day-90 income by at most +0.5 a tick with the cap and +1.3 without it, because tended holdings reach Sovereign by tending anyway. The economy is not where power bites. **Its weight is on the map (above) and on the signatures (×0.88 → ×1.44).**

The combined erosion run lands at 11.8–12.0 a tick at day 90 with power pinned at 1. That is above THR-1763's 10.5 trip-wire, so its raid throttle stays at 10 places per daily burst.

## The decision

**The god grows by spending through its spheres. Every so often the essence it has drawn through a bought sphere attunes it a little further, and the mandate's milestones lift it as they do today. That makes five sphere levels across a run, roughly one every two to four weeks. As the god grows, its home turf widens: friendly ground firms from Touched toward Held, and its signatures strike harder. The widening stops at double strength. Beyond that, deeper ground has to be won place by place with Claim and Shift.**

| Rule | Value | Named constant |
|---|---|---|
| **Writer 1: mandate (kept as shipped)** | +2 at each stage advance, +5 at completion, onto the mandate's sphere | `MANDATE_PRESSURE_MILESTONE` 2, `MANDATE_PRESSURE_COMPLETION` 5 |
| **Writer 2: attunement (new use of an existing counter)** | Essence earned through a **bought** sphere crosses a run-long ladder of marks. Each mark adds +1 progress to that sphere's score through the existing pressure path (`source: 'attunement'`). It is a separate table from the card marks: `SPHERE_ATTUNEMENT_THRESHOLDS` [20, 60] keeps granting repertoire cards exactly as today, and is pinned by test to the repertoire. | `DOMINION_ATTUNEMENT_MARKS` = [20, 60, 150, 300, 600, 1000, 1500, 2100, 2800]; `ATTUNEMENT_SPHERE_PROGRESS` = 1 |
| **Power sums the bought spheres only** | power = Σ score over the bought spheres ÷ that same sum at the start of the run, so every god opens at power 1.0 whatever its point-buy. (THR-1760 summed all twelve; it asked this ticket to revisit that if a writer could grow an unbought sphere. The 4% income floor would let attunement do so: 4% of a run's income is about 345 essence per unbought sphere. A god that spends those trickles, and the omen market will price cards in them, would cross four marks and gain two levels in each of ten spheres, +20 to the sum.) | `DOMINION_POWER_BASELINE` becomes the god's seeded bought-sphere sum (3 for every preset seeded 2 / 1) |
| **Ceiling, on the band read only** | The power factor in `dominion = match × power` is clamped at 2.0. The scores keep growing to `MAX_SPHERE_SCORE` 10, and the signatures keep reading the primary's score unclamped, so late growth still lands somewhere the player feels. Measured: the best path reaches primary 6 by day 90, so 10 is never a binding cap within a run. | `DOMINION_POWER_CAP` = 2.0 |
| **The secondary sphere** | The same rule on its own counter. It grows more slowly (it earns 25% of the essence, not 35%, and is spent less), measured 1 → 2. When the omen market (THR-1770) prices cards in the essence earned through their sphere, spending the secondary attunes it. | — |
| **Per sphere or one number** | Both, each in its own role. Scores stay per sphere, as stored. The band read takes one number, the capped power. Signatures take the primary's score (THR-548). | — |
| **Decay** | None. The god's power does not fade when a sphere goes unspent. A god that hoards sits at the essence cap, earns nothing, and so attunes to nothing: the rulebook's brake (*"nothing is earned until you spend"*). The run's sink is turf, through neglect and raids (THR-1763). Fading the god as well would charge one lapse twice. | — |

**What the player sees.** A level is a moment the god feels, and attunement already has its prose (THR-1180). The core plan doc gives a power level one chronicle line naming the sphere ("Your hold on the green deepens") and lets the map overlay show home turf firming. No number reaches the player (Law 13). The power word on the god's bar is the screen mock's question ([THR-1766](https://linear.app/threadbare/issue/THR-1766)).

### Sub-decisions, each answered

1. **What grows it:** mandate milestones plus attunement on the bought spheres. Clash trials and turf feedback are rejected (below).
2. **How fast:** five levels a run (days 12, 31, 40, 70 and 86 on the scripted player). The ladder's later steps (1,000 to 2,800) are sized to the roughly 3,000 primary essence a run earns now, so levels keep arriving to the end of the run instead of stopping at day 40.
3. **Per-run ceiling:** 2.0 on the band read, chosen at the census knee: up to 2.0 power widens how far the turf reaches, and past it power only stacks Sovereign. No ceiling on the scores themselves, because the writers' pace is the cap (primary 6 at day 90). A god at 10 would double every signature, and no run gets near it.
4. **Does the secondary grow at the same rate:** same rule, slower in practice, because it earns less.
5. **Per sphere or one number:** per sphere in storage, one number in the band read, the primary in the signatures.
6. **Decay when unspent:** none. A hoarding god simply stops growing.

## Options weighed

- **Mandate only (today):** power reaches 1.67 by day 75 with two levels, both late. The first half of the run never grows. Too thin for *"a god grown in power"*.
- **The Model C ladder [20, 60, 150, 300, 600] as sketched:** every mark is spent by day 40 under the THR-1747 economy. Front-loaded, and then the god stops growing.
- **+2 progress a mark:** power 2.0 by day 30. Same front-loading, faster.
- **Clash trials (Model C):** a fixed price in essence buys power on a timer. Every optimiser answers every trial, so it adds a chore, not a choice. And the omen channel now carries the card market Christian picked on THR-1770 (B), so a second recurring omen offer would crowd it. Rejected.
- **Turf feedback (Sovereign places grow the god):** a positive loop. Power raises Sovereign counts, which raise power. Measured: power 3.67 and signatures ×1.86–2.0 by day 90. Exactly the *"rich-get-richer"* the THR-870 decision record warns of. Rejected.
- **No ceiling:** past 2.0 the census shows Sovereign spreading over a third to half of the map for the spread and stone gods, without the god tending any of it. That undoes THR-1762's "Sovereign is earned".
- **Ceiling 1.67:** stops the widening by day 31. The middle of the run then loses the "my ground is firming" feel, for no gain the economy needs (income is the same to one decimal place).
- **A gentler slope instead of a cap** (power factor = 1 + ½ × growth): same end point at a score sum no run reaches. It re-opens THR-1760's normalisation for no measured gain. Rejected in favour of one clamp.
- **Decay of unspent spheres:** double-charges the turf sink. The essence cap already stops a hoarder growing.

## Would change the call

- **Christian wants the god's power to keep widening the turf to the end** (*"my god should keep growing its land"*). Raise `DOMINION_POWER_CAP` to 2.67. The census row shows what that costs: Sovereign at 66–122 places for the spread and stone gods.
- **Christian wants growth earned by deeds, not spending** (*"power should come from what I do, not what I spend"*). That reopens clash trials or a deed-based writer. It is a fork in what growth means, and it would be his.
- **The browser playtest.** If the cap lands before day 30 on a real run (players who spend faster than the scripted one), stretch the ladder's middle marks. If levels bunch, the 1,000 → 2,800 steps are the lever.
- **[THR-1794](https://linear.app/threadbare/issue/THR-1794), the card tiers.** If a tier rung opens on sphere score (Model C's score-keyed cards), that reader joins the signatures as a reason score growth matters past the cap. This ticket does not decide it.

## Findings for the map (not decisions)

- **The combined erosion run** (neglect and raids together, THR-1763's owed measurement): day-90 income 11.8–12.0 a tick with power pinned at 1, 12.2–12.6 with the decided growth. Never pinned, above the 10.5 trip-wire. THR-1763's throttle of 10 stands. The core plan doc ([THR-1748](https://linear.app/threadbare/issue/THR-1748)) should still re-run it with Claim upkeep charged.
- **THR-1745's Model C ladder is stale**: sized to a pre-THR-1747 economy that earned about a tenth as much primary essence.
- **Seeding the god's score from its bought points** stays THR-1748's call (the THR-1749 plan says so). The baseline rule above keeps power at 1.0 at the start whichever seed it picks.

## Not measured

- The real engine's mandate timing. The model assumes stage advances at ticks 300 and 600 and completion at 900; THR-1760 saw the first milestone by tick 240 headless.
- Holdings as continuous match is a prototype simplification calibrated to the THR-1762/1763 band times. Real places step by whole score points.
- Present mortals and the browser `?seeded` world.
- The signature readers past ×1.44 (warhost strength, rift cost and leak). They scale linearly by design (THR-548), and nothing here changes them.
