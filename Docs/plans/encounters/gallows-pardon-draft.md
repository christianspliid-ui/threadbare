# Encounter Pipeline: The Gallows Pardon
> Scale: medium | Slug: gallows-pardon | Pass: draft (master-everyday-3 slot 3, THR-1840)
> Date: 2026-10-15 | Pipeline version: 2.0
> Template id: `encounter.town.gallows_pardon` · heart 0.76 → heart 0.80 · rarityTier 2 · local · shaping · urban
> Package: `gallows-pardon.package.json` (gated green with the private batch-3 bundle at draft time)

## Mechanical design block (fixed before the premise)

- **Crux.** A youth is to hang at noon for a theft half the town thinks he did not do, and his mother has begged {actor} to speak for him before a crowd that wants its hanging.
- **Shape.** Seeded Sequel (placeless) carried on Danger → Confrontation. Step 0 heart 0.76 `continue_weakened` (win the crowd and the hangman's pause); step 1 heart 0.80 `fail_action` (plead before the justice on the gallows steps). Linear, branch count 0. Mean 0.78, window fit 0.92 (master band). Step 1 carryover lines key on step 0's band.
- **Consequence hand (binding, `draw:consequences -- encounter.town.gallows_pardon --reach heart --rarity 2`):** `relationship` (bond_change) + `story_seed` (encounter_seed). No swap.
  - relationship: `bond_change $cast:mother` −0.06 on step 0 failure; +0.12/+0.10 on step 1 success; −0.12/−0.10 on step 1 failure. `bond_change $cast:justice` −0.08/−0.04 on step 1 success (the enemy the s@c row asks for, carried on every success band).
  - story_seed: placeless `encounter_seed` by `query` `#tavern_night` (ten registered, drawable members — Tavern Brawl, Overheard Rumor, Drinking Contest, Bardic Performance, Shady Deal, Recruiting Drive, The Challenge, Confession Over Drinks, Merchant's Pitch, The Warning), delay 36, on step 1 success **and** step 1 failure. The youth, spared or hanged, has people, and they find {actor} one evening. Heart's other master (granary_riot) already seeds `#watch_errand`; this one reaches a different family.
- **Standing.** `reputation_with $here` +0.06 / −0.06 on step 1; −0.02 on step 0 failure (backs the crit-fail town chip on the step-0 route).
- **Bands.** crit: the youth home, the town knows who spoke · success: the youth home · s@c: the youth home, the justice resents it, the town not fully convinced · failure: the youth hangs, the mother blames the master, the master's name pays · crit-fail: the youth hangs and the crowd says the plea hurried the rope.
- **Cool failure.** The master is never killed, jailed or branded. The youth hangs: stated in one plain sentence. The master's loss is the name — "a master's plea was meant to move the justice, and this one did not."
- **Cost channels.** Specials essence-priced except the Silver Tongue trait card (cost 0). No Heavy Hand, rider, grant or over-exposed card as a special.

## 1. Inspiration Anchors

- **Plot hook (taken): `hook.the_great_building`** — "a community pouring itself into building something; who decides and whose labour pays." The town is building a new bridge. The lead stolen from the works is what a stone-carrier is to hang for; the justice wants the works kept honest, and a labourer's son is the cheap example. Rolled alongside: `hook.reconciliation`, `hook.rebuilding_trust` (the latter already taken by hostage_exchange).
- **Seed dice.** p3 *unmitigated risk* (the rope at noon) · opposition *beast (territory)*, read per the brief as the crowd that came for its hanging and the law's duty behind the justice · disposition *open* (half the town doubts the theft) · agentRole *trespasser* (the master steps between the sentence and the rope) · scale *settlement*.
- **Anti-patterns avoided.** No villain justice (he is the law doing its duty); no last-minute proof of innocence (the plea is the test, not an investigation); no lurid hanging.

## 2. Scale Justification

Medium: two beats (the crowd, then the justice) and reaction choices on both sides. A life is the stake, but the scene is one noon at one gallows.

## 3. Pressure Knot

The sentence is passed, the rope is up, the bell rings at noon. Half the town doubts the theft; the other half has come to watch. The mother has already begged the master.

## 4. Intervention Fantasy

The god does not speak for the youth. The god softens a crowd, slows a bell, presses a sentence on a judge's conscience — and watches the mortal plead.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:mother}` | actor, lazy, must-persist, spawn weaver "Agnes Thorne" | named in step 0; bond target both sides |
| `{cast:justice}` | actor, lazy, must-persist, reuse noble/steward, spawn noble "Sir Walter Greve" | named in step 1; bond target on success |
| the youth | role noun only | deliberately not a cast member: he may hang, and a hanged cast agent would persist in the graph |
| `$here` | location | standing edge |
| `#tavern_night` | encounter family | the sequel |

## 6. Beat Structure

1. **Turn the crowd** (heart 0.76): win the crowd over so the hangman holds back.
2. **Win the pardon** (heart 0.80): plead before the justice on the gallows steps.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | youth pardoned, home with his mother | — | the justice resents being argued down; the youth's people stand the master a night |
| success | youth pardoned | — | same |
| success_at_cost | youth pardoned | the town not fully convinced; (route) the crowd jeered or the justice pardoned against his judgement | justice grudge; the youth's people |
| failure | youth hanged | the master's name | mother blames the master; the youth's people come looking |
| critical_failure | youth hanged | the master's name, worse | the crowd says the plea hurried the rope; mother blames the master |

## 9b. Stakes Line

```
goal:      win a pardon for the youth at the gallows
risk:      be blamed for the youth's hanging
won:       won a pardon for the youth at the gallows
lost:      pleaded for the youth and saw him hang at noon
lostBadly: was blamed for the youth's hanging
```

## 10. Sample Opening (urban)

{actor} reaches the gallows at the crossroads outside {location} at mid-morning.

A youth who carried stone on the new bridge is to hang at noon for stealing lead from the works. Half the town thinks he did not do it. The rest have come to watch.

{cast:mother}, his mother, has begged {actor} to speak for him. Unless the crowd turns, the hangman will not wait. First {actor} must win the crowd over and make the hangman hold back.

(78 words.)

**Step 1 spine.** {cast:justice}, the lord's justice, stands on the gallows steps with the sentence in his hand. The lead was found under the youth's bed, and the town wants the bridge works kept honest.

{cast:justice} will hear one plea before he gives the word. {actor} must win a pardon from {cast:justice}, or the youth hangs.

## 11. The Hand Per Step

**Step 0 — Turn the crowd.** Specials 2 + `deal: { count: 3, tags: [presence, social] }`.

| id | Type | Sphere | Name | Cost | Δ | Effect line |
|---|---|---|---|---|---|---|
| gallows.soften_hard_hearts | Signature | spirit | Soften Hard Hearts | 2 | 0.10 | Turn a crowd's appetite for punishment toward pity, so it will hear a plea before it shouts. |
| gallows.slow_the_hour | Long Game | time | Slow The Hour | 2 | 0.08 | Stretch the last moments before a deadline, so there is time for one more voice to be heard. |

Fragments: Soften (crit, success, near_miss, failure); Slow (success, s@c, failure, crit-fail). All six bands covered.

**Step 1 — Win the pardon.** Specials 2 + `deal: { count: 3, tags: [social, insight] }`.

| id | Type | Sphere | Name | Cost | Δ | Effect line |
|---|---|---|---|---|---|---|
| gallows.press_the_conscience | Whisper | mind | Press The Conscience | 2 | 0.10 | Press the weight of a sentence on the one who must give it, so they hear the whole plea before deciding. |
| gallows.find_the_right_words | Trait card (Silver Tongue) | — | Find The Right Words | 0 | 0.08 | Put a plea into words the listener cannot wave away, so even a hard judge has to answer it. |

Fragments as in the package.

## 12. Linear continuation

Step 1's afterimages carry the plea's result: the sentence torn up and the works searched again (crit); the hangman cuts the youth's hands free (success); the pardon given "against his own judgement" (s@c); the word given and the youth hanged at noon (failure); the plea taken as an insult and the word given at once, in front of the mother (crit-fail).

## 13. Aftermath Paragraph

Success: "The youth is home with {cast:mother}, and the rope at the crossroads hangs empty." Failure: "The youth hanged at noon, and {cast:mother} went home alone. A master's plea was meant to move the justice, and this one did not."

## 14. Aftermath Reaction Choices

- Success side (fallback): **Walk the youth home** (mother +0.04 — a private kindness) vs **Give the justice the credit** (justice +0.04 — mend the grudge at the price of the master's own glory; the −0.08 grudge stays true).
- Failure side (both bands): **Stay with the mother** (mother +0.04 — comfort) vs **Say he was innocent** (town −0.03 — keep the case open at the cost of the town's patience).

## 15. Aftermath Kit Summary

Town standing ± · mother bond ± · justice grudge (success) · `#tavern_night` seed (step 1 either side).

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| mother | lazy-materialize-on-trigger | spawn weaver | must-persist | bond; may meet the master again | ok |
| justice | lazy-materialize-on-trigger | reuse noble/steward, spawn noble | must-persist | grudge bond | ok |
| `#tavern_night` sequel | registered family | tavern-encounter-content.ts | — | the seed | ok |

## 17. Self-Audit

- Opening skeleton, ≤80 words, graph names: PASS (78).
- Composed hands 4–8, ≥4 spheres, ≥1 common: PASS (gate's composed-hand check).
- Every nudge ≥1 failure fragment; no big-delta cards: PASS.
- Trait refs live: PASS (gate).
- Every chip backed by a firing effect (Law 56): PASS — crit-fail carries no PATH chip because the step-0 crit-fail route plants no seed.
- Seed target exists: PASS (`content_query` system in the gate).
- No `{target}` in person chips (THR-1685): PASS.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (crowd's pity vs the bell's time; the judge's conscience vs the mortal's own words) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES · 14 YES (below).

## Concept Art Direction

Emotions: a life held on one word; a town split; noon. Image: an empty noose turning slowly over a crossroads at midday, a coil of new bridge lead on the gallows step below it. No people.
