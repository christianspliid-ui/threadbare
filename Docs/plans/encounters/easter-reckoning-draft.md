# Encounter Pipeline: The Easter Reckoning
> Scale: short | Slug: easter-reckoning | Pass: draft
> Date: 2026-10-14 | Pipeline version: 2.0
> Batch: master-everyday-2 (THR-1757), slot 6 — the batch's appointment slot
> Template id: `encounter.town.easter_reckoning`

## 0. Mechanical design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | The cathedral's tables put this year's Easter feast a week late, and the bishop has sent for {actor} to reckon the true day from the moon and the equinox and prove it before the canons, with the dean answering for the tables. |
| Title | *The Easter Reckoning* — the brief's title: a feast, and a count of days. |
| Shape | **Seeded Sequel — placed/timed variant (appointment, THR-1479)** on a linear two-step. Step 0 reckons the true day from the sky; step 1 proves the reckoning against the cathedral's tables before the canons. Step 1 success plants an `encounter_seed` with an `appointment` block: kept → `town.easter_reckoning_heard`, missed → `town.easter_reckoning_defaulted`, both seed-only (`drawable: false`). |
| Reach per step | Step 0 **star 0.74** — fixing the equinox and the full moon after it, to the morning and the hour, is Star's craft at its hardest. Step 1 **star 0.82** — proving a reading of the sky against two hundred years of copied tables, to men who hold the tables cannot be wrong. Mean 0.78, window fit 0.92 (master band). Words the player reads: *severe*, *severe*. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief, binding). |
| Settings | `urban` only (brief row; the rolled `stronghold` is overridden to the settlement board and survives as the chapter house). One P1 opening. The spine names a cathedral, a bishop, a dean, canons and a diocese — every town, city and capital with a cathedral carries them. |
| Whose problem? | The agent's: their reckoning, their proof, their name as the master the bishop sent for. The cathedral and the diocese are where the problem lives. |
| Why here? | `mission` — sent for by the bishop, because old priests say the tables are a week late. |
| Plot hook | Packet rolled `hook.gods_fall, hook.prophetic_investigation, hook.builders_dilemma`. **Taken: `hook.prophetic_investigation`** — drifted: the old priests' saying that a year begun on a false feast goes badly circulates, and the town argues whether the bad year has already begun. It rides the failure-side omen. `hook.gods_fall` set aside (no god is gone; the dispute is a count of days). `hook.builders_dilemma` set aside (nothing is built). |
| Seed dice | p3 **mystery** — "Nobody in {location} can say whether the tables or the priests are right." · opposition **faction (doctrine)** — the canons hold that the cathedral's tables cannot be wrong, and the dean answers for them · disposition **hostile** — "the canons will hear no word against them" · agentRole **competitor** — the master's reckoning set against the cathedral's own tables · scale **region** (the feast day of the whole diocese; the template field stays `local`, per the brief). |
| Master stakes | Who sits across the table: the dean and the canons, with the feast day of a whole diocese on the table. Failure is the name before the purse: {location} thinks less of the master, the feast is proclaimed a week late — what the bishop sent a master to stop — and on a critical failure the dean holds the master's own error against the old priests. No death, jail or brand. |
| Consequence hand (binding) | `drive` + `omen`. No swap. **drive** — `assign_ambition` `ambition_spread_faith` on `$actor`, step 1 success (the master means every parish to keep the true day; Star/Heart devotion ambition). **omen** — `emit_omen` `cultural`, `global`, intensity 0.3, on step 1 success (`time`: the town says the year will go well on the true feast) and step 1 failure (`entropy`: the old priests' saying about a false feast, and the town's argument over whether the bad year has begun). |
| Appointment | Step 1 success: `encounter_seed` `templateId: 'town.easter_reckoning_heard'`, `targetAgentId: '$actor'`, `delayTicks: 36` (three days to synod day), `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:dean', missed: { templateId: 'town.easter_reckoning_defaulted', seedLabel } }`. The step-1 spine names the place and time (the chapter house on synod day, in three days) — prose rule 7b's one lawful exception, and only on the success path. |
| Spine effect | `reputation_with` on `$here`: +0.06 on step 1 success, −0.06 on step 1 failure, −0.03 on step 0 failure (a step-0 critical_failure ends the action, so the critical_failure SCAR needs its own backing write — the forged-charter lesson). |
| Carryover | Step 1 authors `carryoverFactorLines` keyed on step 0's band (no `critical_failure` row: a step-0 critical failure ends the action). |
| Mortal choice | None — this is a test. `motivations: ['tradition_novelty', 'honesty_cunning']` — the old tables against a new reckoning, and saying plainly that the cathedral is wrong. |
| Trait hooks | Gate: none (everyday by construction). Variant: none — the reckoning is the sky and the sums; no live trait reads either better than the reach does. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast (dean) · seeds (the appointment) · reputation · ambition (rewards) — four, plus the omen. `check:encounter` reports `cast, rewards, reputation, appointments`. |
| Heavy Hand | none authored (the batch's one belongs to slot 5). |
| Tags | `['#sacred']` — "of holy ground — a place kept, tended, and answered to" (family axis, seated): the cathedral and its feast. |
| Promise → payoff | "Nobody in {location} can say whether the tables or the priests are right" (step 0) → paid in step 0's success afterimages (the true feast falls a week before the tables' day). "Says a copy that old cannot be wrong" (step 1) → paid by Crack The Binding's fragments (a copyist skipped a line) and step 1's success afterimages (the canons check the tables row by row). "It is read before the whole synod in the chapter house on synod day, in three days" (step 1, conditional) → the appointment and both sequels. |
| Not colliding | The Star master *The Duke's Nativity* (read a newborn's stars, warn a duke) and the Star experts *The Comet Disputation* (argue what a comet means) and *Calling the Harvest* (cast an almanac for the sowing). Here the sky is read for a date, not a fate, and the opposition is a copied table, not a rival reader. Spheres avoid all three (they use light, time, order, chaos, mind, spirit); the specials use darkness, force, entropy, life. |

## 1. Inspiration Anchors

- **`hook.prophetic_investigation`** — a prophecy circulates and nobody can agree whether it has begun. Changed the encounter: it gave the failure side its omen — a year begun on a false feast goes badly, and the town argues whether the bad year has begun — so a lost reckoning leaves the town something to fear, not only a wrong date.
- **The Forged Charter (master-everyday appointment)** — the worked example for the appointment wiring, the step-0 backing write, the sequel file and the missed sequel's regard write aimed off `$here`. Copied: its structure. Not copied: its Eye craft, its two-documents premise, its forger cast, its Signature (entropy) "damp the ink" verb (here entropy splits a binding, a different question: where the copy went wrong, not which copy is new).
- **The Duke's Nativity** — the nearest Star scene. Avoided: its fate reading, its Kindled Ambition / Whisper / Stumble / Omen composition, its light card.
- Anti-patterns avoided: the Dark Lord problem (the dean is defending two hundred years of the cathedral's own work, not plotting); the helpful passerby (the master is sent for); failure as punishment (nobody is hurt; the cost is the master's name and a feast kept on the wrong day).

## 2. Scale Justification

Short: two beats. One feast day, one table, one master's name. The long tail lives in the appointment, which carries the story three days forward to synod day without a third beat.

## 3. Pressure Knot

The cathedral's tables set the Easter feast for every parish in the diocese. They have been copied from book to book for two hundred years, and this year old priests say they put the feast a week late. The dean keeps the tables and the canons will not hear them questioned. The feast must be proclaimed, and the synod sits in three days.

## 4. Intervention Fantasy

The god works on the night, the dawn, the dean's book and an old man's legs: lamps going out across the close so the full moon shows plain, haze driven off the eastern hills so the equinox sunrise runs straight down the aisle, a binding that splits to show where a copyist skipped a line, and the strength for the oldest doubting priest to climb the chapter house stair and speak.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `dean` | The cathedral's dean. Keeps the tables and answers for them before the canons; hostile to a correction; the appointment's counterparty. Named on step 0 and step 1. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `priest`; spawn `priest` "Osric Fenwold". |
| The canons / the bishop / the old priests | Scene furniture: the bishop sends for the master, the canons hear the proof, the old priests doubt the tables. Not cast — no write targets them and no chip names them. | prose only |
| The town (`$here`) | Carries the reputation and the appointment's place. | resolved location |
| Ambition | `ambition_spread_faith` — every parish on the true day. | step 1 `assign_ambition` |
| Omen | cultural, global — the town's reading of the feast, good or bad. | step 1 `emit_omen` (success and failure) |
| Appointment | The reckoning read before the whole synod in the chapter house on synod day, in three days, with the dean there to answer it. | step 1 `encounter_seed` + `appointment` |

## 6. Beat Structure

1. **Reckon the true day** (star 0.74, `continue_weakened`) — fix the spring equinox and the full moon after it. Success: the true feast falls a week before the tables' day. Failure: cloud hides the full moon; the master can say only that the tables might be a week out (continues weakened). Critical failure: the full moon reckoned a night early, and the dean's clerks write it down — ends it.
2. **Prove it before the canons** (star 0.82, `fail_action`) — prove the reckoning against the copied tables before the canons, with the dean answering. Success: the canons agree the synod must hear it; reputation, ambition, omen, appointment. Failure: the tables are read out as they stand; reputation lost, the bad-year omen. Critical failure: the dean finds an error in the master's own sums.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | The canons check every row and ask the master to stand with them at the synod | the nights on the tower | appointment; ambition; regard; good-year omen |
| success | The canons agree the synod must hear the reckoning | the nights on the tower | appointment; ambition; regard; good-year omen |
| success_at_cost | The synod will hear it, but the dean has told the bishop the master shamed the chapter | half the chapter's goodwill | appointment; ambition; regard; good-year omen |
| failure | The tables stand; the feast is proclaimed a week late | the bishop's case | the town thinks less of them; bad-year omen |
| critical_failure | An error in the master's own reckoning, read out by the dean | the bishop's case | the town thinks less of them; bad-year omen on the step-1 route |

### Stakes Line

```
goal:      reckon the true day of the Easter feast and prove it
risk:      have the dean find an error in the reckoning
won:       reckoned the true day of the Easter feast and proved it
lost:      could not prove the cathedral's tables wrong
lostBadly: had the dean find an error in the reckoning
```

`lostBadly` is true on both critical-failure routes: step 0 (the full moon a night early, written down by the dean's clerks) and step 1 (an error in the master's own sums, read out by the dean).

**Description (player prose):** "The cathedral's tables put this year's Easter feast a week late, and the canons will hear no word against them. Someone has to reckon the true day from the moon and the equinox, and prove it before the canons and their dean."

## 10. Sample Opening (narrator mode)

**P1 (urban):** {actor} arrives in {location}, sent for by the bishop.

**Spine (step 0), P2:** The cathedral's tables set the day of the Easter feast for the whole diocese. This year, old priests say the tables put it a week late. The dean, {cast:dean}, keeps the tables, and the canons will hear no word against them.

**Spine (step 0), P3:** The bishop asks {actor} to reckon the true day from the moon and the equinox. Nobody in {location} can say whether the tables or the priests are right.

Word count, P1 + P2 + P3: 9 + 40 + 27 = **76**.

## 11. The Hand Per Step

### Step 0 — Reckon the true day (star 0.74, purpose "Reckon the true day")

`deal: { count: 3, tags: ['lore', 'insight'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `reckoning.deepen_the_dark` | Deepen The Dark | Signature (darkness) — one-off, no `libraryCardId`; never `card.undertow.signature.darkness` | darkness | 2 | 0.11 | generic.dark | Put out every lamp in the cathedral close tonight, so the moon's edge and the faint stars show plainly. |
| `reckoning.clear_the_dawn` | Clear The Dawn | Signature (force) — one-off, no `libraryCardId` | force | 1 | 0.09 | generic.strength | Drive the haze off the eastern hills at sunrise, so the morning the sun rises straight down the cathedral's aisle shows plainly. |

The two answer different questions: the full moon (night) and the equinox (dawn).

Band fragments:

- **Deepen The Dark** — critical_success: "Every lamp in the close went out, and the moon rose clear of the roofs to its full." · success: "The lamps in the close went out, and the edge of the full moon showed plainly." · near_miss: "The lamps went out, but a tavern fire kept the low sky bright." · failure: "The lamps went out, and cloud came over the moon anyway."
- **Clear The Dawn** — success_at_cost: "The haze lifted at sunrise, and the sun rose straight down the aisle while the dean's sexton watched." · failure: "The haze lifted, but the sun rose behind the bell tower and could not be read." · critical_failure: "The haze lifted a day too soon, and they took the wrong morning for the equinox."

### Step 1 — Prove it before the canons (star 0.82, purpose "Prove it before the canons")

`deal: { count: 3, tags: ['social', 'presence'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `reckoning.crack_the_binding` | Crack The Binding | Signature (entropy) — one-off, no `libraryCardId`; `opposes: 'dean'` | entropy | 2 | 0.12 | generic.decay | Split the spine of the dean's copy of the tables, so its loose leaves show where a copyist skipped a line. |
| `reckoning.rouse_the_elder` | Rouse The Elder | Balm (life) — one-off, no `libraryCardId` | life | 1 | 0.09 | generic.vigor | Give the oldest of the doubting priests the strength to climb the chapter house stair and speak. |

Forecast arithmetic: 0.82 + 0.12 + 0.09 = 1.03.

Band fragments:

- **Crack The Binding** — critical_success: "The dean's copy split at the spine, and the leaf with the skipped line fell open in front of the canons." · success: "The old spine split, and the canons saw where a copyist had skipped a line." · near_miss: "The old spine split, but the dean gathered up the loose leaves before the canons read them." · failure: "The old spine split, and the dean blamed the damp in the chapter house."
- **Rouse The Elder** — success_at_cost: "The oldest priest climbed the stair and spoke for the reckoning, and the dean sent him back to his parish for it." · failure: "The oldest priest climbed the stair, but his voice was too weak to carry across the chapter house." · critical_failure: "The oldest priest climbed the stair and could not remember which year the tables went wrong."

Spheres across specials: darkness, force, entropy, life (4 distinct before the deal; none used by the Star master or either Star expert). Common option supplied by the deal. No rider authored. No card grants content. No special binds a `libraryCardId`. Card-type composition: three Signatures (darkness, force, entropy) + Balm (life) — the Duke's Nativity is Kindled Ambition + Whisper / Stumble + Omen; the Forged Charter is Signature (entropy, energy) / Signature (mind) + Stumble — no sibling repeats this composition.

## 12. Linear continuation (step 1 spine)

The canons meet in the chapter house to hear the reckoning. {cast:dean} answers for the cathedral's tables, which have been copied from book to book for two hundred years, and says a copy that old cannot be wrong. If {actor} proves the reckoning, it is read before the whole synod in the chapter house on synod day, in three days, with the dean there to answer it. If not, {location} will think less of {actor}.

### Carryover factor lines (step 1, keyed on step 0)

- critical_success (for, +0.05): "They can name the hour of the full moon."
- success (for, +0.03): "They know the true feast falls a week early."
- success_at_cost (against, −0.02): "The dean knows they read the sky from his tower."
- near_miss (for, +0.01): "They know the full moon only to the night."
- failure (against, −0.03): "They can say only that the tables might be wrong."

### Afterimages

Step 0:
- critical_success: They fixed the equinox to the morning and the full moon to the hour, and the true feast falls a week before the tables' day.
- success: They fixed the equinox and the full moon after it, and the true feast falls a week before the tables' day.
- success_at_cost: They fixed the true day, a week before the tables' day, but the dean's clerks saw them on the cathedral tower at night.
- failure: Cloud hid the full moon, and they could say only that the tables might be a week out.
- critical_failure: They reckoned the full moon a night early, and the dean's clerks wrote the mistake down.

Step 1:
- critical_success: The canons checked every row of the tables against the reckoning, and asked {actor} to stand beside them at the synod.
- success: The canons checked the reckoning against the tables row by row, and agreed the synod must hear it.
- success_at_cost: The canons agreed the synod must hear it, but {cast:dean} told the bishop that {actor} had shamed the chapter.
- failure: The canons would not see the fault, and {cast:dean} had the tables read out as they stand.
- critical_failure: {cast:dean} found an error in {actor}'s own sums and read it out to the canons.

### Effect prose and narrative templates

- `assign_ambition` narrativeHook (step 1 success): "Proved the cathedral's feast tables a week wrong before the canons, and means every parish to keep the true day."
- `emit_omen` narrativeHook (step 1 success, `time`): "A master proved a cathedral's feast tables a week wrong, and the town began to say the year will go well if the feast is kept on its true day."
- `emit_omen` narrativeHook (step 1 failure, `entropy`): "A cathedral will keep the Easter feast a week late, the old priests say a year begun on a false feast goes badly, and the town argues whether the bad year has begun."
- Appointment seedLabel (kept): "The reckoning is read before the synod in the chapter house on synod day, with the dean there to answer it."
- Appointment seedLabel (missed): "The reckoning was not read on synod day, and the dean comes looking for the master who made it."
- narrativeTemplates: initiation "The cathedral in {location} has the Easter feast a week wrong, and the bishop has sent for a master to reckon it." · success "The reckoning was proved before the canons, and the synod hears it on synod day." · failure "The reckoning was not proved."

## 13. Aftermath Paragraph (per band)

- **critical_success:** The bishop has told every parish to wait for the synod before proclaiming the feast.
- **success:** The chapter has the reckoning in writing, under {actor}'s hand.
- **success_at_cost:** The synod will hear the reckoning, but half the chapter now sides with the dean against {actor}.
- **failure:** The cathedral will proclaim the feast a week late, and that is what the bishop sent for a master to stop.
- **critical_failure:** The dean now holds a master's own error against anyone who doubts the tables.

Base fallback overview: "The cathedral's tables in {location} have been reckoned against the sky."

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (short scale; the forward thread is the appointment, which the mortal keeps or misses by their own movement).

## 15. Aftermath Kit Summary

| Band | scar | bond | boon | path |
|---|---|---|---|---|
| critical_success | — | reputation with {location} (gain) | — | ambition · appointment |
| success | — | reputation with {location} (gain) | — | ambition · appointment |
| success_at_cost | — | reputation with {location} (gain) | — | ambition · appointment |
| failure | reputation with {location} (loss) | — | — | — |
| critical_failure | reputation with {location} (loss) | — | — | — |

The omen (both sides) is unchipped: an omen is dressing and has no anchor kind (the restless-ossuary precedent). It is told in the failure overview's "a week late" and in the omen's own chronicle line.

Chip text (cause — detail):
- bond (all success bands): title "A reckoning heard" · cause "The chapter's word on it" · detail "{location} thinks well of their reckoning." `stateNoun` `reputation with {location}` on `$here`.
- path (all success bands): title "A new ambition" · cause "Every parish on the true day" · detail "{actor} is pursuing Spread the Faith now." `stateNoun` `ambition`; concept "Spread the Faith".
- path (all success bands): title "The synod" · cause "Synod day in the chapter house" · detail "{cast:dean} answers the reckoning in {location} in three days." `stateNoun` `appointment`, `entityId: '$appointment'`, concept "answers the reckoning".
- scar (failure): title "A reckoning unproved" · cause "The tables stand" · detail "{location} thinks less of their reckoning."
- scar (critical_failure): title "A wrong sum" · cause "An error in their own reckoning" · detail "{location} thinks less of their reckoning." True on both routes: the step-0 full moon reckoned a night early and the step-1 error in the sums are both errors in their own reckoning.

Page read (assembled, scar · bond · boon · path):
- **critical_success:** the overview names what the bishop has done; BOND the town's regard; PATH the ambition and why (every parish on the true day); PATH the synod and its day. Nothing told twice.
- **success:** the overview names what the chapter now holds; chips as above.
- **success_at_cost:** the overview names the cost (half the chapter with the dean), true on every path into the band; chips as success.
- **failure:** the overview says what happens to the feast and why a master's failure costs more; the SCAR carries the regard and names why ("the tables stand").
- **critical_failure:** the overview says what the dean gained; the SCAR names how it was lost. True on both routes.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `dean` | lazy-materialize-on-trigger | reuse priest, else spawn priest "Osric Fenwold" | must-persist | appointment counterparty; both sequels (`inheritContext`); PATH chip | ready |

## 17. Concept Art Direction

1. *Emotions:* a count of days that a whole diocese lives by, the weight of two hundred years of copying, one person's arithmetic against an institution.
2. *Evocative image:* an open bound book of tables on a lectern in an empty chapter house, its spine split and one leaf lying loose on the stone floor, a thin line of dawn light crossing the floor from a high east window. No people.

## 18. Self-Audit

| Item | Verdict |
|---|---|
| Opening ≤80 words | PASS (76) |
| Hand 4–8 composed, ≤2 specials + deal | PASS (5 and 5) |
| ≥4 spheres, ≥1 common | PASS (darkness, force, entropy, life; the deal supplies a common) |
| Every nudge has a failure fragment; no big-delta | PASS (max Δ 0.12) |
| Six StepOutcomes covered per step | PASS — step 0: CS/S/NM/F (Deepen) + SAC/F/CF (Clear); step 1: CS/S/NM/F (Crack) + SAC/F/CF (Rouse) |
| Forecast arithmetic | not yet checked |
| Card types match mechanism | PASS — no special binds a `libraryCardId` |
| Consequence hand wired | PASS — drive (`assign_ambition` `ambition_spread_faith`), omen (`emit_omen` cultural/global, both sides) |
| Appointment has missed branch; both sequels authored | PASS (§ 20) |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), ambition (step 1 success), appointment seed (step 1 success) |
| Prose rule 7b | PASS — the later-tense promise (read before the synod on synod day) rides the appointment and its kept sequel; no overview promises the synod's ruling |
| Steps within 0.72–0.85 | PASS (0.74, 0.82) |
| Over-exposed cards | PASS — none used as a special |
| `check:encounter --package` | not yet run |

## 19. The narrator's 12 questions

1. P1 arrival with graph names — `{actor}` arrives in `{location}`, sent for by the bishop.
2. P2 events with costs paid — the tables set the feast for the diocese; old priests say they put it a week late; the dean keeps them and the canons will hear no word against them.
3. P3 one stake — mystery: nobody can say whether the tables or the priests are right; the bishop asks {actor} to reckon the true day.
4. ≤80 words — 76.
5. Read aloud as a report — yes.
6. Stated, never encoded — "put it a week late", "will hear no word against them", "nobody can say".
7. Every sentence works — the stake (the feast of the diocese), the doubt, the opposition, the ask, the mystery.
8. Nothing unintroduced — the tables, the moon, the equinox, the old priests, the cathedral and the dean precede step 0's cards; the chapter house, the copied tables and the dean precede step 1's cards.
9. One named person per beat — `{cast:dean}` on both spines.
10. Stake in a sentence — "Can the bishop's master reckon the true feast day and prove it against the cathedral's own tables, and keep their name?"
11. Cards verb+noun, spell-style — Deepen The Dark, Clear The Dawn, Crack The Binding, Rouse The Elder (deepen, clear, crack, rouse in `IMPERATIVE_VERB_LEXICON`); no effect line repeats a word of its name; no digits.
12. Opening per class — `urban`, written.

## 20. Sequels (seed-only, `drawable: false`, THR-1526) — `src/data/encounters/easter-reckoning-sequels.ts`

Modelled on `charter-inquest-sequels.ts`: one step each, `intrinsicTier: 'background'`, no `locationSubtypes`, outside the factory catalog (`town.` prefix), `inheritContext` carries `{cast:dean}`. Registered beside `CHARTER_INQUEST_SEQUELS` in `RAW_UNIFIED_ACTION_TEMPLATES`.

### `town.easter_reckoning_heard` — The Reckoning Heard (kept)

- Reach **star 0.40** (`EASTER_RECKONING_HEARD_DIFFICULTY`). The reckoning is already proved; this step holds it against the dean before the synod. One step, `fail_action`, purpose **"Read the reckoning to the synod"**, `crudType: 'update'`, `motivations: ['tradition_novelty']`.
- `narrativeTemplate`: "{name} is in the chapter house in {location} on synod day. The synod sits to hear the reckoning, and {cast:dean} answers for the cathedral's tables. If the reckoning holds against the dean, the synod moves the Easter feast to its true day."
- successAfterimage: "The dean could not fault the reckoning. The synod moved the Easter feast to its true day, and every parish in the diocese will keep it there."
- failureAfterimage: "The dean questioned the reckoning line by line until the synod put off its ruling, and the feast stays where the tables put it."
- successMetadata: `reputation_with $here +0.05` · `bond_change withAgentId '$cast:dean' sentimentDelta −0.06 trustDelta 0.02` (the dean lost, and knows who beat the tables).
- failureMetadata: `reputation_with $here −0.03`.
- stakes: goal "hold the reckoning against the dean before the synod" · risk "see the synod put off its ruling on the feast" · won "held the reckoning, and the synod moved the feast" · lost "saw the synod put off its ruling on the feast".
- narrativeTemplates: initiation "{name} is in the chapter house on synod day, where the synod hears the reckoning." · success "The synod moved the Easter feast to its true day." · failure "The synod put off its ruling."
- aftermathConfig fallback overview: "{name} kept synod day in the chapter house, with the dean there to answer." (no chips, per the sequel precedent).

### `town.easter_reckoning_defaulted` — The Reckoning Defaulted (missed)

- Reach **heart 0.45** (`EASTER_RECKONING_DEFAULTED_DIFFICULTY`), one step, `fail_action`, purpose **"Answer the dean"**, `crudType: 'read'`, `motivations: ['loyalty_ambition']`.
- `narrativeTemplate`: "{name} was not in the chapter house on synod day, and the reckoning was never read. The synod kept the cathedral's tables, and the Easter feast will be kept a week late. {cast:dean} has come looking for {name} with a paper, to have the reckoning signed away as a mistake." The template places the mortal nowhere: the chapter house is where they were not, because the missed branch fires wherever the mortal stands.
- successAfterimage: "{name} would not sign, and {cast:dean} left with the paper still blank."
- failureAfterimage: "{cast:dean} thinks less of the master who stayed away, and says so at the bishop's table."
- successMetadata: `bond_change withAgentId '$cast:dean' sentimentDelta −0.04 trustDelta 0.03`.
- failureMetadata: `bond_change withAgentId '$cast:dean' sentimentDelta −0.08 trustDelta −0.1` · `reputation_with targetAgentId '$cast:dean' −0.04`. Never `$here`.
- stakes: goal "refuse to sign the reckoning away as a mistake" · risk "be shamed at the bishop's table for staying away" · won "refused to sign the reckoning away as a mistake" · lost "was shamed at the bishop's table for staying away".
- narrativeTemplates: initiation "The reckoning was not read on synod day, and the dean has come looking." · success "{name} would not sign the reckoning away." · failure "The dean thinks less of the master who stayed away."
- aftermathConfig fallback overview: "Nobody read the reckoning on synod day, and the cathedral's tables stand." (no chips).

*Rule 7b note:* neither sequel binds the mortal to a later place or time. The kept sequel reports a finished act (the feast moved, or the ruling put off). The missed sequel's "to have the reckoning signed away" is the dean's motive, not a later act the engine owes; its success reports a finished act, and its failure reports the dean's standing, which the writes back.

## Experience Differentiator Gate

1. YES · 2. YES · 3. YES · 4. YES — "The bishop's master must reckon the true feast day and prove it against the cathedral's tables, or lose their name." · 4b. YES — no seam echo (P2 → P3 → step-0 afterimages; step-1 spine → afterimages checked) · 5. YES · 6. YES · 7. YES · 8. YES — the night sky and the moon / the equinox dawn / the dean's copied tables / the old priests · 9. YES — moon, equinox, the copy's fault, a witness · 9b. YES · 10. YES · 11. YES · 11b. YES (§ 15 page read) · 12. N/A (short) · 13. N/A (short) · 14. YES.
