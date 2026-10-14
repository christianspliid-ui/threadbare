# Encounter Pipeline: The Hill Conduit
> Scale: medium | Slug: hill-conduit | Pass: revised
> Revisions applied (self-edit against the editorial prompt's 35 REVISE triggers): condition family rewired from a location condition to `trait.condition.inspired` on `$actor` (gate: a condition on `$here` counts as `place`, not `condition`), Festival dropped, Plague Scare kept as the place extra; opening trimmed to 75 / 78 words and "between them" disambiguated; spine → step-0 afterimage seam echo removed ("falls all the way" told twice); card name/effect word repeats fixed (*Mark The Boundary* no longer says "boundary"); "the moment" (evasive nominal) cut from *Harden The Lining*; "town" removed from a card face and from two reactions (class scenery on a rural envelope); six overview ↔ afterimage echoes rewritten; the Inspired chip no longer paraphrases the ambition chip.
> Date: 2026-10-14 | Pipeline version: 2.0
> Batch: master-everyday-2 (THR-1757), slot 7 · templateId `encounter.town.hill_conduit`

## 0. Binding row and mechanical design block (designed before the prose)

```
Brief row       reach stone · steps stone 0.76 → stone 0.82 (mean 0.79, window fit 0.93) ·
                shape opt-in complication · settings rural + urban · consequence hand
                condition + drive (binding, no swap) · rarityTier 2 · scale local ·
                intrinsicTier shaping · id encounter.town.hill_conduit (final)
Rolled          plotHookRolled: hook.followed_on_the_road, hook.underground_city,
                                hook.shifting_shape
                plotHookTaken:  hook.underground_city, drifted — "another place under the
                                known one, with its own politics and no interest in yours"
                                becomes the lord's high pasture: ground the water must pass
                                under, kept by herdsmen with no interest in the town's wells.
                                followed_on_the_road and shifting_shape set aside (no pursuer,
                                no shape-change in a water job).
                p3Shape obstruction · opposition beast (territory), read as a herd and its
                herdsmen guarding their grazing (brief override: no monster gate) ·
                disposition wary · agentRole trespasser (on the cut arm) · scale personal
                (rolled; the outcome in fact touches the whole settlement's water) ·
                system movement (advisory, not taken — brief override)
Crux            The town's wells have gone foul, and {actor} must bring clean spring water
                down from the hill, either across a lord's guarded pasture or the long way
                round it.
Title           The Hill Conduit — the objective (a conduit, down a hill).
Whose problem?  The agent's: they are the master builder the reeve sent for, and the
                conduit is their work. Scene-local (the summons is why they came; no prior
                graph tie asserted — prose rule 7).
Reach = theme?  Stone throughout — building and endurance. Step 0 (stone 0.76) surveys a
                line that falls all the way from the springs. The fork, on Stone's own axis
                preservation_transformation: the Shaper (negative) cuts the short line
                straight across the pasture (stone 0.82, the brief's step 2) and lays it
                while the herd presses in; the Guardian (positive) leaves the pasture whole
                and lays the long line round its edge (stone 0.78), where the fall is slight
                and a flat stretch fouls the water. Both arms are master tests.
Shape           Opt-in Complication. Step 0 is taken by every mortal; then an agent-decided
                fork on preservation_transformation. The decline arm (round the pasture) is
                LEGIBLE (no trench across the lord's grazing, no herd, a slower job) and
                CHEAPER IN WHAT IT RISKS (smaller reputation swing, no quarrel with the
                herdsmen), but priced in the master band, because declining the pasture does
                not make the long line easy. The two step-0 specials carry opposite pole
                leans; the player never picks.
Carryover       Step 0 continue_weakened. Both arms author carryoverFactorLines keyed on
                step 0 (critical_failure omitted: a step-0 critical failure ends the action).
Forecast sums   step 0: 0.76 + 0.06 + 0.06 = 0.88 · cut: 0.82 + 0.10 + 0.08 = 1.00 ·
                long line: 0.78 + 0.10 + 0.08 = 0.96 — every step ≤ 1.
Opposition      The herd and its herdsmen on the cut arm; the slight fall of the hill on the
                long arm. No villain.
Consequence hand (binding, THR-1145): condition + drive — no swap.
  condition     condition_attachment trait.condition.inspired on $actor, every success side
                of both arms (ends warm: brief, slot 7). Success-side, so not the defaulted
                failure penalty, and not apply_condition on $actor.
  drive         Success side: assign_ambition ambition_great_work (secondary). Failure side:
                plant_compulsion encounterBias { build: 0.5 }, 72 ticks.
Place extra     apply_condition trait.condition.location.plague_scare on $here, every
                failure side: the wells stay foul, travellers steer clear.
Extras          reputation_with $here on failure sides (−0.08 cut, −0.05 long); reactions add
                bond_change with $cast:herdsman (cut arm) and $cast:reeve, and
                reputation_with $here.
Cool failure?   None killed, jailed or branded. Cut-arm critical failure: the bull scatters
                the diggers and the lord forbids the work. Long-arm critical failure: the
                long conduit silts up and the reeve sends for another builder.
Trait hooks     Gate: none. Variant: Careful (trait.personality.stone.virtue) +0.04 —
                "Being Careful, they take every level twice." Trait-only nudge: none.
                Trait fragment: none.
Systems quota   cast + rewards + conditions + reputation — four (gate-counted).
Heavy Hand      none. No card grants. No libraryCardId bound on any special.
```

## 1. Inspiration Anchors

- **hook.underground_city** (vault: Archetypes/Adventure & Quest): another place under the known one, with its own keepers and no interest in yours. Drifted to ground rather than a city: the conduit must run *under* the lord's pasture, and that pasture has its own people (the herdsmen) who care nothing for the town's wells. It gave the encounter its obstruction and the trespasser role on the cut arm.
- **Anti-patterns avoided:** the monster gate (the bull is a bull in a field, the herd is livestock); the villain lord (the lord never appears — his herdsmen do their job); the player-picked ending (the fork is the mortal's stance on Stone's own axis); repeating the stone master and experts. Cathedral vault: *test the vault / strike the centering / keep the frame sound*, cards *Hasten, Reveal, Bind, Steady, Stretch, Draw*. Bell tower and flood dyke: cards *Show The Hidden, Slow The Settling, Stir Old Pride, Press The Wall, Remember The Old Craft, Raise Hidden Water, Ease Tired Backs, Hound A Rival, Harden Wet Earth, Call A Hard Frost*. The journeyman well sinking (*Wake The Memory, Bind The Sand, Hold Off The Rain, Sway The Neighbour*) digs down for water; this encounter brings it down from a hill. This encounter's step verbs: *survey the fall, cut the conduit, lay the long conduit*; card verbs *show, mark, calm, harden, quicken, even*. *Harden* is shared with *Harden Wet Earth* as a lexicon verb only; the object and the mechanism differ.
- Fork axis deliberately not courage_prudence (the model's axis): Stone's own preservation_transformation — keep the land as it is, or cut it to serve.

## 2. Scale Justification

Medium (one survey plus a fork into one execution beat). A master's job here is one judgement of the ground and one hard piece of work; a third beat would pad. The outcome touches the whole settlement — its water.

## 3. Pressure Knot

The wells are already foul and two children are already sick before the mortal arrives. The springs are clean but sit above a pasture whose herdsmen will not let it be dug. Every week of delay is another week on the foul wells.

## 4. Intervention Fantasy

The god watches a master builder decide whether a lord's grass matters more than a town's water, and leans on the ground itself: the line they see, the stones they notice, the bull at the head of the herd, the stone as it sets, the water in the flat stretches.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| Reeve `{cast:reeve}` | support actor, must-persist | reuse `elder` / `clerk` (seeded at hamlet / town / city), spawn `elder`, spawnName *Edith Marlow*. Named in the spine and the long arm. |
| Herdsman `{cast:herdsman}` | support actor, must-persist | no reuse (no herdsman role in the rosters), spawn `hunter`, supportRole `head_herdsman`, spawnName *Hob Fenner*. Named on the cut arm. |
| the lord | role-voiced, unbound | never on stage; his pasture and his marker stones are scene-local. |
| the herd and the bull | scene-local | the obstruction on the cut arm. |
| `{location}` | `$here` | carries Plague Scare on failure; `reputation_with` target. |
| Inspired | `trait.condition.inspired` | on `$actor`, success side. |
| Build a Great Work | `ambition_great_work` | on `$actor`, success side. |
| compulsion (build) | `plant_compulsion` | on `$actor`, failure side. |

## 6. Beat Structure

1. **Survey the fall** (stone 0.76, every mortal) — find a line from the springs that falls all the way.
2. **Fork** on preservation_transformation, decided by the mortal's live lean plus the step-0 cards' pole leans:
   - negative (Shaper) — **Cut the conduit** (stone 0.82): straight across the pasture, against the herd.
   - positive (Guardian) — **Lay the long conduit** (stone 0.78): round the pasture's edge, against the slight fall.

## 7. Branching Profile

- Branch depth: light · Branch count: 2
- Where branching lives: step-1 prose, hand, afterimages, aftermath variants and reactions.
- Convergence: both arms end at the same question — did clean water reach `{location}` — with the same consequence families; the cut arm swings harder (bigger reputation loss, the herdsmen as a second party).
- Shape: Opt-in Complication (catalog), gate = the agent-decided fork.

## 8. Branching Map

- Step 0 → the fork pole is recorded. Show The Straight Course leans negative; Mark The Boundary leans positive.
- Negative → the herdsman takes the stage; cut-arm aftermath (Pay For The Grazing / Blame The Herdsmen).
- Positive → the reeve stays on stage; long-arm aftermath (Accept The Thanks / Blame The Hill).

## 9. Outcome Ladder

| Band | Cut arm | Long arm | Writes |
|---|---|---|---|
| critical_success | laid in a day; herdsmen make their peace | the pasture never touched; water within the month | Inspired, ambition |
| success | water comes down; the sick children mend | a month's work; grazing whole | Inspired, ambition |
| success_at_cost | the bull breaks the trench twice; days lost | one flat stretch relaid; a week more on the wells | Inspired, ambition |
| failure | the herd breaks the open trench | a flat stretch spoils the water | Plague Scare, reputation −, compulsion |
| critical_failure | the bull scatters the diggers; the lord forbids the work | the long conduit silts up; another builder sent for | Plague Scare, reputation −, compulsion |

## 9b. Stakes Line

```
goal:      bring clean water down from the hill springs
risk:      leave the foul wells as the only water
won:       brought clean water down from the hill springs
lost:      laid the long conduit too flat to carry clean water
lostBadly: let the long conduit silt up before any water came
arms.negative:
  won:       brought clean water down across the lord's pasture
  lost:      let the herd break the open trench
  lostBadly: was driven off the lord's pasture by the bull
```

**description:** The wells have gone foul, and clean springs rise on the hill above, past a lord's guarded pasture and its bull. Someone has to survey the hill and bring the water down in a buried conduit, across the pasture or the long way round it.

## 10. Sample Opening (narrator mode)

**rural:** {actor} comes by farm track to {location}, sent for as a master builder.
**urban:** {actor} arrives at {location}, sent for as a master builder.

**spine (step 0):**

> The wells of {location} have gone foul, and two children are sick from the water. Clean springs rise on the hill above. Between the springs and the wells lies the lord's high pasture, guarded by his herdsmen and a bull.
>
> Reeve {cast:reeve} wants the water brought down in a buried conduit. First {actor} must survey the hill for a line that falls all the way.

75 words (urban) / 78 (rural).

## 11. The Hand Per Step

### Step 0 — Survey the fall (stone 0.76) · deal `{ count: 4, tags: ['craft', 'wild'] }`

| id | name | type | sphere | cost | Δ | lean | image |
|---|---|---|---|---|---|---|---|
| `conduit.show_the_straight_course` | Show The Straight Course | Whisper | mind | 1 | 0.06 | negative | generic.focus |
| `conduit.mark_the_boundary` | Mark The Boundary | Whisper | order | 1 | 0.06 | positive | generic.ward |

- **Show The Straight Course** — *Fix the shortest line down the hill in their mind. They lean toward cutting across the pasture.*
  - success: The short line stayed in their mind, and they levelled it first.
  - success_at_cost: The short line held their eye, and they had to level the long one twice.
  - near_miss: The short line held their eye, and they hurried the stretch below the springs.
  - failure: The short line held their eye, and they never levelled the ground round the pasture.
- **Mark The Boundary** — *Bring the lord's marker stones to their notice at every turn. They lean toward keeping off his ground.*
  - critical_success: They walked every marker stone, and found the fall on both sides of the line.
  - success: They kept to the marker stones, and found the fall along them.
  - failure: They kept to the marker stones, and lost the fall where the wall turns.
  - critical_failure: They followed the marker stones down, and marked a line that climbs.

### Step 1, negative — Cut the conduit (stone 0.82) · deal `{ count: 4, tags: ['labor', 'peril'] }`

| id | name | type | sphere | cost | Δ | image |
|---|---|---|---|---|---|---|
| `conduit.calm_the_bull` | Calm The Bull | Balm | life | 2 | 0.10 | generic.warmth |
| `conduit.harden_the_lining` | Harden The Lining | Boost (scoped) | matter | 2 | 0.08 | generic.matter |

- **Calm The Bull** — *Settle the beast at the head of the herd. It grazes on and leaves the diggers be.*
  - success: The bull put its head down to graze, and the diggers worked round it.
  - success_at_cost: The bull grazed through the morning, then broke the trench at noon.
  - failure: The bull grazed for a while, then the herd came on behind it.
  - critical_failure: The bull grazed until the trench reached it, then charged the diggers.
- **Harden The Lining** — *Make each stone set firm as soon as it goes in. Hooves cannot break a finished stretch.*
  - critical_success: Each stone set as it went in, and the herd walked over finished work.
  - success: The stones set fast, and the cattle could not break the laid stretches.
  - near_miss: The stones set fast, but the herd broke the stretch still open.
  - failure: The stones set fast, but the cattle trampled the trench ahead of them.

### Step 1, positive — Lay the long conduit (stone 0.78) · deal `{ count: 4, tags: ['craft', 'labor'] }`

| id | name | type | sphere | cost | Δ | image |
|---|---|---|---|---|---|---|
| `conduit.quicken_the_flow` | Quicken The Flow | Boost (scoped) | energy | 2 | 0.10 | generic.energy |
| `conduit.even_the_levels` | Even The Levels | Boost (scoped) | order | 2 | 0.08 | generic.oath |

- **Quicken The Flow** — *Hurry the water through the flat stretches. It runs on before it can stand and spoil.*
  - critical_success: The water ran fast through every flat stretch, and none of it stood.
  - success: The water ran on through the flat stretches.
  - near_miss: The water ran on, but slowed where the line turns past the wall.
  - failure: The water ran fast at first, then stood in the flattest stretch.
- **Even The Levels** — *Give every stretch of the conduit the same small drop. No length lies flatter than the rest.*
  - success: Every stretch took the same small drop, and the water never slowed.
  - success_at_cost: Every stretch took the same drop, but only after one was laid twice.
  - failure: The drop held on most stretches, and failed on the one past the wall.
  - critical_failure: Every stretch took the same drop, and the whole line lay too flat.

Every step's two specials cover all six `StepOutcome`s between them; every special carries ≥1 failure-band fragment; no Δ ≥ 0.15; no rider authored (the deal supplies any rider). Over-exposed cards (brief): none authored; `card.kindled_ambition.signature.spirit` not authored.

## 12. Branch-Dependent Later Paragraphs

**Cut arm (negative):**
> {actor} marks the short line straight across the lord's pasture and sets the diggers on. Herdsman {cast:herdsman} drives the herd up to the line, with the bull in front. The herdsmen will not let a trench split their grazing. The conduit must be dug, laid in stone and covered while the cattle press in, or they will trample it.

**Long arm (positive):**
> {actor} leaves the lord's pasture whole and takes the long line round its edge. On the long line the hill falls only a little. Every stretch must drop, or the water will stand in the conduit and go foul like the wells. Reeve {cast:reeve} sends carts of stone for a month of work.

### Afterimages

| | Step 0 | Cut arm | Long arm |
|---|---|---|---|
| crit | They found a clean fall from the springs, both across the pasture and round it. | The conduit was laid and covered in a day, and the herd grazed over it by evening. | The long conduit fell evenly all the way, and the water ran clear. |
| success | They found a fall that will carry the water down. | The conduit was laid across the pasture, and clean water ran down to {location}. | The long conduit was laid, and the water came down clean. |
| cost | They found a fall, but the survey took most of the week. | The conduit was laid, but the bull broke the trench twice and the work ran on for days. | The water came down, but one flat stretch had to be dug up and laid again. |
| failure | They could not be sure the water would reach the foot of the hill. | The herd broke the open trench, and the herdsmen filled it in. | One stretch was laid too flat, and the water stood in it and spoiled. |
| crit fail | They marked a line that rises again halfway down the hill. | The bull scattered the diggers, and the lord forbade any work on his ground. | The long conduit silted up along half its length, and no water came down. |

### Carryover factor lines (keyed on step 0)

| step-0 band | Cut arm | Long arm |
|---|---|---|
| critical_success | They know the short line falls clean across the pasture. (+0.06) | They know where the long line falls least. (+0.05) |
| success | They know the water will carry down the hill. (+0.04) | They know the long line will carry the water. (+0.03) |
| success_at_cost | Most of the week went on the survey. (−0.02) | Most of the week went on the survey. (−0.02) |
| near_miss | They know most of the line will fall. (+0.02) | They know most of the long line will fall. (+0.02) |
| failure | They are not sure the line reaches the foot of the hill. (−0.03) | They do not know which stretch lies too flat. (−0.03) |

## 13. Aftermath Paragraphs (overviews)

| Band | Cut arm | Long arm |
|---|---|---|
| critical_success | Clean water reached {location} within days, and the herdsmen have made their peace with the line under their grass. | The lord's pasture was never touched, and {location} has its spring water within the month. |
| success | The sick children of {location} are mending, and the old wells are being filled in. | The work ran a month long, and the lord's grazing is whole. The sick children are mending. |
| success_at_cost | The water came down at last. The herdsmen cursed every day the trench lay open in their grass. | {location} spent another week on its old wells, but the spring water runs now. |
| failure | {location} still draws its water from the old wells. A master sent for by name is judged by whether the water came. | The long conduit runs, but what reaches {location} is no better than its wells. A master sent for by name is judged by whether the water came. |
| critical_failure | No one was hurt. {location} has no water now but its old wells, and the springs are out of reach. | {cast:reeve} has sent for another builder to dig the long conduit out. |

Fallback variant (no recorded pole): the long arm's bands, with overview "{actor} surveyed the hill for {location}." and a chipless critical_failure: "The survey line rises halfway down, and {location} has stopped all work on the conduit."

## 14. Aftermath Reaction Choices

| Arm / side | Reaction | Intent | Effect |
|---|---|---|---|
| cut, success side | **Pay For The Grazing** | The mortal pays the herdsmen for the grass the trench cost. {cast:herdsman} remembers it. | bond_change herdsman +0.12 |
| both, success side | **Teach The Upkeep** | The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work. | bond_change reeve +0.08 / trust +0.06 |
| long, success side | **Accept The Thanks** | The mortal takes the thanks of {location} in person. Its people think better of them. | reputation_with $here +0.04 |
| both, failure side | **Cart The Water** | The mortal stays to cart spring water down until the sickness passes. {cast:reeve} thinks better of them. | bond_change reeve +0.06 / trust +0.04 |
| cut, failure side | **Blame The Herdsmen** | The mortal tells {location} the herdsmen broke the work. Its people hear them out; {cast:herdsman} does not forgive it. | reputation_with +0.03, bond_change herdsman −0.08 |
| long, failure side | **Blame The Hill** | The mortal tells {location} the hill falls too little for a long line. Its people hear them out; {cast:reeve} does not believe it. | reputation_with +0.03, bond_change reeve −0.06 |

Stances: on success, make peace with who paid for it (the herdsmen) or leave the town able to keep it (the reeve) or take the credit (the town); on failure, carry the cost yourself or put the blame where you think it belongs.

## 15. Aftermath Kit Summary

| Chip | Category | stateNoun | Backed by | Bands |
|---|---|---|---|---|
| High Spirits — "Seeing the water run clean has lifted {actor}'s spirits." | boon | Inspired (`trait.condition.inspired`) | condition_attachment, step successMetadata | crit / success / cost, both arms |
| More To Build — "{actor} is pursuing Build a Great Work now." | path | ambition | assign_ambition, step successMetadata | crit / success / cost, both arms |
| Lost Trust — "{location} no longer trusts {actor} with its water." | scar | reputation with {target} ($here) | reputation_with, step failureMetadata | failure / crit fail, both arms |
| Word Of Sickness — "Travellers now steer clear of {location} for fear of sickness." | scar | Plague Scare (`trait.condition.location.plague_scare`) | apply_condition $here, step failureMetadata | failure / crit fail, both arms |
| Unfinished Work — "For a while {actor} is drawn to building work over all else." | scar | compulsion | plant_compulsion { build }, step failureMetadata | failure / crit fail, both arms |

### Page read (assembled, cut arm, failure)

> {location} still draws its water from the old wells. A master sent for by name is judged by whether the water came.
> - SCAR · reputation with {location} — {location} no longer trusts {actor} with its water.
> - SCAR · Plague Scare — Travellers now steer clear of {location} for fear of sickness.
> - SCAR · compulsion — For a while {actor} is drawn to building work over all else.
> > Cart The Water — The mortal stays to cart spring water down until the sickness passes. {cast:reeve} thinks better of them.
> > Blame The Herdsmen — The mortal tells {location} the herdsmen broke the work. Its people hear them out; {cast:herdsman} does not forgive it.

Each block adds one fact: the wells (overview), the town's trust (chip), the travellers (chip), the mortal's urge (chip), two stances. No fact told twice; no contradiction (the afterimage above it carries the broken trench, which the page does not retell).

### Page read (assembled, long arm, success)

> The work ran a month long, and the lord's grazing is whole. The sick children are mending.
> - BOON · Inspired — Seeing the water run clean has lifted {actor}'s spirits.
> - PATH · ambition — {actor} is pursuing Build a Great Work now.
> > Teach The Upkeep — The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.
> > Accept The Thanks — The mortal takes the thanks of {location} in person. Its people think better of them.

Clean.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| reeve | lazy-materialize-on-trigger | reuse elder/clerk, else spawn elder | must-persist | bond_change targets | built |
| herdsman | lazy-materialize-on-trigger | spawn hunter (no roster role) | must-persist | bond_change targets | built |
| Inspired | existing condition | condition-trait-content.ts | duration row | sheet | built |
| Plague Scare | existing location condition | condition-trait-content.ts | duration row | location page, pool | built |
| Build a Great Work | existing ambition | ambition-templates.ts | — | ambition tick | built |

## 17. Self-Audit

| Item | Verdict |
|---|---|
| Binding row (id, reach, step reaches/difficulties, shape, settings, rarity 2, local, shaping) | PASS |
| Consequence hand wired: condition (Inspired on $actor), drive (assign_ambition / plant_compulsion) | PASS — gate green |
| Hands: 2 specials + deal on every nudge-bearing step; six bands covered; failure fragments on every card | PASS |
| Forecast sums ≤ 1 | PASS (0.88 / 1.00 / 0.96) |
| Names on the imperative lexicon; effect lines share no word with their names | PASS |
| No digits in effect lines; no vagueness-lexicon hits | PASS — gate green, zero warnings |
| Class scenery in spine/afterimages/overviews | PASS — "town" only in the brief's own crux and the doc block |
| Cast never gendered; the lord (unbound) is the only "his" | PASS |
| Prose rule 7 / 7b | PASS — no prior tie asserted; no promise about later place or time |
| Law 56: every chip backed by an effect on its band | PASS |
| Systems ≥ 3 | PASS — cast, rewards, conditions, reputation |
| `apply_condition` on $actor | none (brief cap respected) |
| Known caveat | step-0 critical_failure ends the action; the arm's critical_failure chips render without writes (corpus-wide engine gap, inherited) |

### Narrator's 12 questions

1. P1 arrival with graph names — yes. 2. P2 events with costs — foul wells, two sick children. 3. P3 one stake — obstruction (the pasture between springs and wells), survey asked first. 4. ≤80 words — 75 / 78. 5. Read aloud as a report — yes. 6. Facts stated — yes. 7. Every sentence works — yes. 8. Nothing unintroduced — yes. 9. One named person per beat — reeve; herdsman; reeve. 10. Stake in a sentence — "Bring clean water down from the hill springs, across the lord's guarded pasture or round it." 11. Cards verb + noun — yes. 12. Opening per class — rural, urban.

## 18. Concept Art Direction

1. *Emotions:* thirst put off too long; the cost of crossing someone else's ground; quiet relief.
2. *Image:* a stone well-head in a yard, its bucket left upturned on the rim and a rope coiled beside it, a thin line of turned earth running up a green hillside behind it toward a spring marked by a single standing stone. No people, no animals. Residue, not the work.

## 19. Experience Differentiator Gate

1 YES · 2 YES · 3 YES (reeve, springs, pasture, herdsmen, bull, conduit all named before the hand) · 4 YES · 5 YES · 6 YES (essence on every card) · 7 YES · 8 YES · 9 YES (lean vs lean; animal vs stone; water vs levels) · 9b YES · 10 YES · 11 YES · 11b YES (page reads above) · 12 YES · 13 YES · 14 YES.

## Branch Seduction Self-Check

- **Cut (Shaper):** a mortal who reshapes the world to serve — two children are sick, and grass grows back. The god watches nerve against a herd and can calm the bull or set the stone. Protects the town's time.
- **Long (Guardian):** a mortal who keeps the land as it is — the lord's grazing is not theirs to cut. The god watches patience against a slight fall and can quicken the water or even the levels. Protects the herdsmen's living and the master's peace with the lord.
- Without labels: one is a fight with animals in a morning, the other a month of exact levels. Distinct.
