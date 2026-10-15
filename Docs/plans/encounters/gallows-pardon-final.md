# Encounter Pipeline: The Gallows Pardon
> Scale: medium | Slug: gallows-pardon | Pass: final
> Date: 2026-10-15 | Pipeline version: 2.0
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | heart 0.76 → 0.80, seeded sequel on danger → confrontation; relationship + story_seed |
| Editorial | PASS WITH REVISIONS | success / failure / crit-fail pages contradicted their own reactions or routes; hanging told twice at the seam; opening told its stake twice; two effect lines repeated their card names; reusable justice gendered |
| Systems | READY WITH CAVEATS | the `#tavern_night` seed could never fire (members gate on a tavern Place, the seeding site judges the Location tier). Retargeted to `#fellowship_errand`; every chip backed per route |
| Package | connected · PACKAGE PASS | 17 chips (8 distinct) anchored, none folded |

### Caveats / Blockers
- Placeless seed: if the mortal is outside a town / city / capital when the seed comes due (36 ticks), the Fellowship sequel withers to a narrative line. This is standard for a query seed, and the chip names no place.
- Mother recurrence: `must-persist` + `supportRole` match means a second run in the same town reuses Agnes Thorne. Rare at rarity 2; not fixed.
- Backlog (engine, not this slot): the seeding site cannot see tavern Places, so any `#tavern_night` query seed is dead. See `gallows-pardon-systems.md` § 6.

### Editorial Notes Summary
Success overviews now read "The youth lives…" and the crit afterimage no longer walks him home, so **Walk the youth home** is true. The failure overview drops "went home alone" (it sat under **Stay with the mother**). The crit-fail overview says "{actor} only hurried the rope", which is true when no plea was made. The overviews no longer repeat the afterimage's hanging line. Opening P3 is one stake sentence (72 words). The justice is de-gendered. "Press…" → "Lay…" and "words" were dropped from effect lines. The PATH chip is "The Builders' Work". Full list: `gallows-pardon-editorial.md` § 9.

### Implementation File Map
Compiler-owned only: `npm run compile:encounter -- Docs/plans/encounters/gallows-pardon.package.json`. At closeout, stamp `hook.the_great_building.usedBy` and add any THR-1526 seed-pin rows the compile asks for.

---

## Encounter Packet

## Mechanical design block (fixed before the premise)

- **Crux.** A youth is to hang at noon for a theft half the town thinks he did not do, and his mother has begged {actor} to speak for him before a crowd that wants its hanging.
- **Shape.** Seeded Sequel (placeless), carried on Danger → Confrontation. Step 0 heart 0.76 `continue_weakened` (win the crowd and the hangman's pause). Step 1 heart 0.80 `fail_action` (plead before the justice on the gallows steps). Linear, branch count 0. Mean 0.78, window fit 0.92 (master band). Step 1's carryover lines key on step 0's band.
- **Consequence hand (binding, `draw:consequences -- encounter.town.gallows_pardon --reach heart --rarity 2`):** `relationship` (bond_change) + `story_seed` (encounter_seed). No swap.
  - relationship: `bond_change $cast:mother` −0.06/−0.06 on step 0 failure; +0.12/+0.10 on step 1 success; −0.12/−0.10 on step 1 failure. `bond_change $cast:justice` −0.08/−0.04 on step 1 success. This is the enemy the s@c row asks for, carried on every success band.
  - story_seed: placeless `encounter_seed` by `query` `#fellowship_errand` ("Work set by the Builders' Fellowship"), delay 36, on step 1 success **and** step 1 failure. The youth, spared or hanged, has people: the builders he carried stone for. They heard the master speak for him, and they send the master work. There are five members (Repair the Wall, Lay a Foundation, Forge New Tools, Survey a Building Site, Fulfill a Craft Commission), all individual-performable and all accepting town / city / capital, which is exactly `urban`. The label promises only work, and every member delivers that. *(Critic retarget: `#tavern_night` was unreachable from a placeless seed. See systems § 4.)*
- **Standing.** `reputation_with $here` +0.06 / −0.06 on step 1; −0.02 on step 0 failure (backs the crit-fail town chip on the step-0 route).
- **Bands.** crit: the youth lives, and the town knows who spoke. success: the youth lives. s@c: the youth lives, the justice resents it, and the town is not fully convinced. failure: the youth hangs, the mother blames the master, and the master's name pays. crit-fail: the youth hangs, and the crowd says the master only hurried the rope.
- **Cool failure.** The master is never killed, jailed or branded. The youth hangs, stated in one plain sentence in the afterimage. The master's loss is the name: "A master's plea was meant to move the justice, and this one did not."
- **Cost channels.** Specials essence-priced except the Silver Tongue trait card (cost 0). No Heavy Hand, rider, grant or over-exposed card as a special.

## 1. Inspiration Anchors

- **Plot hook (taken): `hook.the_great_building`**: "a community pouring itself into building something; who decides and whose labour pays." The town is building a new bridge. A stone-carrier is to hang for the lead stolen from the works. The justice wants the works kept honest, and a labourer's son is the cheap example. The builders he worked beside are the sequel. Rolled alongside: `hook.reconciliation`, `hook.rebuilding_trust` (the latter already taken by hostage_exchange).
- **Seed dice.** p3 *unmitigated risk* (the rope at noon). Opposition *beast (territory)*, read per the brief as the crowd that came for its hanging and the law's duty behind the justice. Disposition *open* (half the town doubts the theft). agentRole *trespasser* (the master steps between the sentence and the rope). Scale *settlement*.
- **Anti-patterns avoided.** No villain justice (he is the law doing its duty). No last-minute proof of innocence (the plea is the test, not an investigation). No lurid hanging.

## 2. Scale Justification

Medium: two beats (the crowd, then the justice) and reaction choices on both sides. A life is the stake, but the scene is one noon at one gallows.

## 3. Pressure Knot

The sentence is passed, the rope is up, and the bell rings at noon. Half the town doubts the theft; the other half has come to watch. The mother has already begged the master.

## 4. Intervention Fantasy

The god does not speak for the youth. The god softens a crowd, slows a bell, and lays a sentence's weight on a judge's conscience. Then the god watches the mortal plead.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:mother}` | actor, lazy, must-persist, spawn weaver "Agnes Thorne" | named in step 0; bond target both sides |
| `{cast:justice}` | actor, lazy, must-persist, reuse noble/steward, spawn noble "Sir Walter Greve" | named in step 1; bond target on success; prose carries no pronoun for them (reuse can bind anyone) |
| the youth | role noun only | deliberately not a cast member: he may hang, and a hanged cast agent would persist in the graph |
| `$here` | location | standing edge |
| `#fellowship_errand` | encounter family | the sequel |

## 6. Beat Structure

1. **Turn the crowd** (heart 0.76): win the crowd over so the hangman holds back.
2. **Win the pardon** (heart 0.80): plead before the justice on the gallows steps.

## 7. Branching Profile

Linear, no branching. Branch count 0.

## 8. Branching Map

N/A (linear encounter).

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | youth pardoned, the works searched again | — | the justice resents being argued down; the builders send the master work |
| success | youth pardoned | — | same |
| success_at_cost | youth pardoned | the town not fully convinced; (route) the crowd jeered, or the justice pardoned against the court's judgement | justice grudge; the builders' work |
| failure | youth hanged | the master's name | mother blames the master; the builders' work |
| critical_failure | youth hanged | the master's name, worse | the crowd says the master only hurried the rope; mother blames the master |

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

{cast:mother}, his mother, has begged {actor} to speak for him. {actor} must win the crowd over first, or the hangman will not wait for a plea.

(72 words.)

**Step 0 afterimages.**
- critical_success: The crowd fell silent, and voices in it called for the youth to be heard. The hangman stepped back from the rope.
- success: The crowd went quiet enough to hear a plea, and the hangman stepped back to wait.
- success_at_cost: The hangman stepped back to wait, but the crowd jeered {actor} as the thief's friend.
- failure: The crowd shouted {actor} down, and {cast:mother} stopped believing {actor} could save her son.
- critical_failure (ends the action): The crowd shouted {actor} down, and the hangman did not wait for a plea. The youth hanged at noon.

**Step 1 spine.**

{cast:justice}, the lord's justice, stands on the gallows steps holding the sentence. The lead was found under the youth's bed, and the town wants the bridge works kept honest.

{cast:justice} will hear one plea before giving the word. {actor} must win a pardon from {cast:justice}, or the youth hangs.

**Step 1 carryover lines (keyed on step 0's band).** crit (for, +0.06): "The crowd is calling for the youth to be heard." · success (for, +0.04): "The crowd is quiet and willing to listen." · s@c (against, −0.02): "The crowd jeers whoever speaks for the youth." · near_miss (against, −0.03): "The crowd went quiet only just before noon." · failure (against, −0.05): "The crowd shouted the last speaker down."

**Step 1 afterimages.**
- critical_success: {cast:justice} tore up the sentence on the steps and ordered the bridge works searched again.
- success: {cast:justice} pardoned the youth, and the hangman cut his hands free.
- success_at_cost: {cast:justice} pardoned the youth, but told the crowd the pardon went against the court's judgement.
- failure: {cast:justice} heard the plea and gave the word. The youth hanged at noon.
- critical_failure: {cast:justice} took the plea as an insult to the lord's court and gave the word at once. The youth hanged at noon, in front of {cast:mother}.

## 11. The Hand Per Step

**Step 0: Turn the crowd.** 2 specials + `deal: { count: 3, tags: [presence, social] }`.

| id | Type | Sphere | Name | Cost | Δ | Image | Effect line |
|---|---|---|---|---|---|---|---|
| gallows.soften_hard_hearts | Signature | spirit | Soften Hard Hearts | 2 | 0.10 | generic.warmth | Turn a crowd's appetite for punishment toward pity, so it will hear a plea before it shouts. |
| gallows.slow_the_hour | Long Game | time | Slow The Hour | 2 | 0.08 | generic.memory | Stretch the last moments before a deadline, so there is time for one more voice to be heard. |

Fragments:
- Soften Hard Hearts. crit: "People at the front began to call the youth by his name, and the shouting stopped." · success: "The shouting died down, and people began to look at the youth instead of the rope." · near_miss: "The crowd quieted, but not until the noon bell was nearly due." · failure: "The crowd pitied the mother out loud, and still called for the rope."
- Slow The Hour. success: "The bell-ringer was late to the bell, and {actor} had time to be heard." · s@c: "The bell rang late, and the crowd blamed {actor} for keeping them waiting." · failure: "The bell rang late, and the crowd spent the wait shouting {actor} down." · crit-fail: "The bell rang late, and the hangman went ahead without it."

**Step 1: Win the pardon.** 2 specials + `deal: { count: 3, tags: [social, insight] }`.

| id | Type | Sphere | Name | Cost | Δ | Image | Effect line |
|---|---|---|---|---|---|---|---|
| gallows.press_the_conscience | Whisper | mind | Press The Conscience | 2 | 0.10 | generic.focus | Lay the weight of a sentence on the one who must give it, so they hear the whole plea before deciding. |
| gallows.find_the_right_words | Trait card (Silver Tongue, `card.trait_card.core`) | — | Find The Right Words | 0 | 0.08 | generic.mercy | Shape a plea the listener cannot wave away, so even a hard judge has to answer it. |

Fragments:
- Press The Conscience. crit: "{cast:justice} stopped the hangman and asked to see the lead and the youth's bed." · success: "{cast:justice} heard the plea to the end without once looking at the hangman." · near_miss: "{cast:justice} heard the plea out, but kept hold of the sentence a long while." · failure: "{cast:justice} heard every word of the plea, and gave the word anyway."
- Find The Right Words. success: "{actor} put the case in three plain sentences, and {cast:justice} had no answer to them." · failure: "{actor} pleaded well, and {cast:justice} said a fine speech did not put the lead back."

**Trait variants.** Silver Tongue (`trait.mastery.silver-tongue`) +0.05, "Having a Silver Tongue, they are heard out when they plead." It adds Find The Right Words. Bitter (`trait.core.core_hope.vice`) −0.04, "Being Bitter, they expect the rope to win before they begin."

## 12. Linear continuation

Step 1's afterimages carry the plea's result. On crit, the sentence is torn up and the works searched again. On success, the hangman cuts the youth's hands free. On s@c, the pardon is given "against the court's judgement". On failure, the word is given and the youth hangs at noon. On crit-fail, the plea is taken as an insult and the word given at once, in front of the mother.

## 13. Aftermath Paragraph

| Band | Overview |
|---|---|
| critical_success | The youth lives, and the whole town knows who spoke for him at the gallows. |
| success | The youth lives, and the rope at the crossroads hangs empty. |
| success_at_cost | The youth lives, though not everyone in {location} believes he is innocent. |
| failure | {cast:mother} has lost her son. A master's plea was meant to move the justice, and this one did not. |
| critical_failure | {cast:mother} has lost her son, and the crowd went home saying {actor} only hurried the rope. |

Chips:

| Bands | Title | Noun | Detail |
|---|---|---|---|
| crit / success / s@c | The Town's Thanks | `reputation with {location}` ($here) | {location} thinks better of {actor} now. |
| crit / success / s@c | The Mother's Trust | `reputation` + {cast:mother} concept | {cast:mother} trusts {actor} now. |
| crit / success / s@c | The Justice's Grudge | `reputation` + {cast:justice} concept | {cast:justice} resents being argued down before the town. |
| crit / success / s@c / failure | The Builders' Work | `seed` + {actor} concept | The builders who worked beside the youth will send {actor} work. |
| failure | A Plea That Failed | `reputation with {location}` | {location} thinks less of {actor} now. |
| failure / crit-fail | The Mother's Blame | `reputation` + {cast:mother} concept | {cast:mother} blames {actor} for her son. |
| crit-fail | Blamed for the Rope | `reputation with {location}` | {location} thinks less of {actor} now. |

Seed label (both sides): "The builders who worked beside the youth heard {actor} speak for him at the gallows, and have work for them."

Fallback overview (unreached, since every band authors its own): "The crowd leaves the crossroads gallows, and {location} talks about the plea."

Story beats (`narrativeTemplates`): initiation "A youth is to hang at the crossroads gallows outside {location}, and his mother has begged {actor} to speak for him." · success "The youth was pardoned at the gallows." · failure "The youth hanged at noon."

Description (Codex): "A youth is to hang at noon at the crossroads gallows for stealing lead from the bridge works, and half the town thinks he did not do it. Someone has to turn the crowd that came to watch, then plead for his life before the lord's justice."

## 14. Aftermath Reaction Choices

- Success side (fallback, all three success bands): **Walk the youth home**, "The mortal walks the youth to his mother's door through the staring town. She will remember it." (mother +0.04, a private kindness) vs **Give the justice the credit**, "The mortal tells the crowd the pardon was the justice's own mercy. The justice will remember the courtesy." (justice +0.04, mending the grudge at the price of the master's own glory; the −0.08 grudge stays true).
- Failure side (both bands): **Stay with the mother**, "The mortal stays at the gallows with the mother until the crowd is gone. She will remember that much." (mother +0.04) vs **Say he was innocent**, "The mortal tells the town the youth never stole the lead. The town will not thank them for it." (town −0.03).

## 15. Aftermath Kit Summary

Town standing ± · mother bond ± · justice grudge (success) · `#fellowship_errand` seed (step 1 either side).

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| mother | lazy-materialize-on-trigger | spawn weaver | must-persist | bond; may meet the master again | ok |
| justice | lazy-materialize-on-trigger | reuse noble/steward, spawn noble | must-persist | grudge bond | ok |
| `#fellowship_errand` sequel | registered family | builders-fellowship-encounter-content.ts | — | the seed | ok |

## 17. Self-Audit

- Opening skeleton, ≤80 words, graph names: PASS (72).
- Composed hands 4–8, ≥4 spheres, ≥1 common: PASS (the gate's composed-hand check).
- Every nudge ≥1 failure fragment; no big-delta cards: PASS.
- Trait refs live: PASS (gate).
- Every chip backed by a firing effect (Law 56): PASS. Crit-fail carries no PATH chip because the step-0 crit-fail route plants no seed.
- Seed target exists **and can fire at the seeding site**: PASS (`#fellowship_errand`, all members accept the urban subtypes).
- No `{target}` in person chips (THR-1685): PASS.
- No card's effect line repeats a word of its name: PASS.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 4b YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (the crowd's pity vs the bell's time; the judge's conscience vs the mortal's own words) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES · 14 YES (below).

## Concept Art Direction

Emotions: a life held on one word; a town split; noon. Image: an empty noose turning slowly over a crossroads at midday, with a coil of new bridge lead on the gallows step below it. No people.
