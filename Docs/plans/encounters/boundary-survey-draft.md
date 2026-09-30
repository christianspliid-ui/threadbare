# Encounter Pipeline: The Boundary Survey
> Scale: short | Slug: boundary-survey | Pass: draft
> Date: 2026-09-30 | Pipeline version: 2.0
> Batch: expert-everyday-2 (THR-1679), slot 1 — the batch's appointment slot
> Template id: `encounter.town.boundary_survey`

## 0. Mechanical design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | The stones between a lord's land and a village common have moved, and the county assize sends for {actor}, the sworn surveyor, to find where the true line runs. |
| Title | *The Boundary Survey* — the objective, readable at a glance. |
| Shape | **Seeded Sequel — placed/timed variant (appointment, THR-1479)**, two steps, a test and its consequence (Test & Consequence, carryover). Step 0 reads the ground against the charter (investigation: where did the stones stand?); step 1 finds the true line from the charter's marks. Step 1 success plants an `encounter_seed` with an `appointment` block: kept → `town.bounds_beaten`, missed → `town.bounds_stone_uprooted`. |
| Reach per step | Step 0 **eye 0.58** — reading moved ground against a written charter is Eye's craft (reading truly). Step 1 **eye 0.66** — finding a line from three old marks, one of them gone, is Eye's harder test. Mean 0.62, window fit 0.76 (expert band). Words the player reads: *steep*, *severe*. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief: the 0.45 open-draw cap binds `background` only). |
| Settings | `rural` only (the brief's binding row). One P1 opening; the spine names no class scenery beyond the lord's land and the common, which are the premise. |
| Whose problem? | The agent's: their sworn survey, their name as the assize's surveyor. The village and the lord are where the problem lives. |
| Why here? | `mission` — sent for by the county assize, because the charter says a sworn survey settles the line. |
| Plot hook | Rolled `hook.betrayal_revealed, hook.oath_breaking_scandal, hook.prophetic_investigation`. **Taken: `hook.betrayal_revealed`, blended with `hook.oath_breaking_scandal`.** The village's reeve, who swears to the bounds every year, moved the stones himself to clear a debt to the lord — someone trusted, working against the household, and an oath broken in public when the line is read out. The archetype's "the betrayer has a reasonable justification" note is kept: the debt. `hook.prophetic_investigation` set aside: nothing in a land survey is prophecy. |
| Seed dice | p3 **mystery** ("Nobody in {location} will say who moved the stones") · opposition **faction (doctrine)** — the charter's own law: only a survey sworn from its marks counts, and one of its three marks (the old oak) is gone; the steward holds the charter to that letter · disposition **friendly** — the reeve walks the bounds with {actor} and helps (the betrayal reads under that friendliness) · agentRole **trespasser** — the true line runs across the lord's land, and the lord's men watch anyone who walks it · scale **region** (recorded; the template field stays `local`, per the brief). |
| Expert stakes | Someone with standing across the table: the county assize and the lord's steward. Failure costs standing first: {location} thinks less of the surveyor who could not find the line. No death, jail or brand. |
| Consequence hand (binding) | `possession` + `knowledge`. No swap. **possession** — step 1 `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#map'] }`: the assize pays in kind (renders as the auto PRIZE chip; `#map` has six bearers, including the Cartographer's Survey). **knowledge** — `intelligence` (`political_secret`) on step 1 success: {actor} knows why the reeve moved the stones. |
| Appointment | Step 1 success: `encounter_seed` `templateId: 'town.bounds_beaten'`, `targetAgentId: '$actor'`, `delayTicks: 36` (three days to the beating of the bounds), `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:steward', missed: { templateId: 'town.bounds_stone_uprooted', seedLabel } }`. The step-1 spine names the place and the time (the beating of the bounds, in three days) — prose rule 7b's one lawful exception, and only on the success path. |
| Spine effect | `reputation_with` on `$here`: +0.06 on step 1 success, −0.06 on step 1 failure, −0.03 on step 0 failure (a step-0 critical_failure ends the action, so the critical_failure SCAR chip needs its own backing write on step 0 — the well-sinking / bell-tower lesson). |
| Conditions (system target) | Land in the **kept sequel**: `apply_condition` `trait.condition.location.festival` on `$here` — the beating of the bounds ends in a feast. The parent puts no condition on the mortal (brief: reputation is the expert penalty). |
| Mortal choice | None — this is a test. `motivations: ['honesty_cunning', 'tradition_novelty']` — the scene is about telling a true line from a false one, and about an old charter's law. |
| Trait hooks | Gate: none (everyday by construction). Variant: none — no live trait fits reading ground better than the reach does. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast · rewards · seeds (appointment) · reputation — four. |
| Heavy Hand | none authored (slot 4 is the batch's home for it). |
| Tags | `['#territorial']` — "of ground held, claimed, or argued over" (family axis, seated). |
| Promise → payoff | "Nobody will say who moved the stones" (opening) → paid in step 1's success afterimages (the reeve owns to it) and the knowledge chip (why). "A new stone is set at the beating of the bounds" (step-1 spine, conditional) → the appointment and both sequels. |

## 1. Inspiration Anchors

- **`hook.betrayal_revealed`** (vault `Archetypes/Event Archetypes.md` § Betrayal Revealed) — "someone trusted … working against the household." Changed the encounter: the mystery's answer is the friendly reeve, the one person the village trusts with the bounds. The archetype's note that a betrayer "has reasonable justification" gave the knowledge record its honest content (a debt to the lord), so the reveal is not a villain unmasked but a neighbour who sold the village's grass to pay what he owed.
- **`hook.oath_breaking_scandal`** — the reeve swears to the bounds every year. That sworn word is what the order card (Call Up The Oath) works on, and the confession is a public broken oath.
- **Bell Tower Shoring (batch-1 appointment)** — the worked example for the appointment wiring, the step-0 backing write, the sequel file shape and the missed-sequel regard write retargeted off `$here`. Deliberately *not* copied: its plea shape, its light/time/spirit/force spheres, its Favor + Boost hand on step 1.
- **Masons' Commission / Well Sinking** — sibling "read the ground" steps. Avoided: the "Stir The Memory" / "Wake The Memory" mind card both already ship.
- Anti-patterns avoided: the Dark Lord problem (the lord is never a villain; the steward is the law's face, and the betrayer has a reason); the helpful passerby (the mortal is sent for and sworn); failure as punishment (nobody is hurt; the cost is standing).

## 2. Scale Justification

Short: two beats. The stake is one boundary and one surveyor's name; the long tail lives in the appointment, which carries the story three days forward to the beating of the bounds without adding a third beat.

## 3. Pressure Knot

The stones marking the bounds have been moved out onto the common, and the common is smaller. The lord's steward says nothing has moved. The charter says only a survey sworn from its marks settles it, and one of its marks, the old oak, was felled years ago. The assize has sent for a sworn surveyor, and whatever they find will be read out before the village.

## 4. Intervention Fantasy

The god works on the ground and on the people who hold the truth: grass quickened overnight so dug turf shows, a steward's certainty knocked loose so the charter is read out whole, a reeve held to the oath he swears every year, and a dream of the old line sent to the surveyor.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `steward` | The lord's steward; holds the charter; says nothing has moved; the appointment's counterparty and witness at the beating of the bounds. Named on step 0. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `steward` / `noble` / `clerk`; spawn `steward` "Edric Payne". |
| `reeve` | The village's reeve; swears to the bounds every year; walks {actor} round (friendly); moved the stones to clear a debt to the lord. Named on step 1. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `elder` (seeded at 1.0 in hamlets); spawn `elder` "Wat Hollis". |
| The village (`$here`) | Carries the reputation and the appointment's place. | resolved location |
| Prize | A `#map` possession from the reward pool (the assize pays in kind). | step 1 `rewardPool` |
| Intelligence record | `political_secret` — why the reeve moved the stones. | step 1 `intelligence` |
| Appointment | The new stone set at the beating of the bounds, in three days, with the steward as witness. | step 1 `encounter_seed` + `appointment` |

## 6. Beat Structure

1. **Read the moved stones** (eye 0.58, `continue_weakened`) — find where the stones used to stand. Success: each was moved out onto the common. Failure: only the charter to go on (continues weakened). Critical failure: the moved stones taken for the old ones, before the steward — ends it.
2. **Find the true line** (eye 0.66, `fail_action`) — measure the line from the spring, the wayside cross and the felled oak's place, across the lord's land. Success: the true line found, the reeve owns to moving the stones; prize, knowledge, reputation, appointment planted. Failure: no line sworn; reputation lost. Critical failure: a line sworn that gives the lord more of the common than the moved stones did.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | True line found by dusk; the steward vouches for the survey before the lord's men | the day | appointment; prize; knowledge; the village's regard |
| success | True line found; the common restored | the day | appointment; prize; knowledge; regard |
| success_at_cost | True line found a day over, under the lord's men's eyes | an extra day | appointment; prize; knowledge; regard |
| failure | No line sworn; the lord keeps the grazing | the survey | the village thinks less of them |
| critical_failure | The survey sided with the moved stones | the survey, and the common | the village thinks less of them |

## 10. Sample Opening (narrator mode)

**P1 (rural):** {actor} comes into {location}, sent for by the county assize.

**Spine (step 0), P2:** The stones marking the bounds between the lord's land and the village common have moved. The common is smaller than it was.

**Spine (step 0), P3:** The charter says a survey sworn from its marks settles the line. {cast:steward}, the lord's steward, holds the charter and says nothing has moved. Nobody in {location} will say who moved the stones. If {actor} cannot find the true line, {location} will think less of them.

Word count, P1 + P2 + P3: 10 + 22 + 46 = **78**.

## 11. The Hand Per Step

### Step 0 — Read the moved stones (eye 0.58, purpose "Read the moved stones")

`deal: { count: 3, tags: ['insight', 'lore'] }` + 2 specials → composed 5.

| id | Name | Type | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bounds.quicken_the_turf` | Quicken The Turf | Whisper | life | 2 | 0.12 | generic.vigor | Make the grass along the bounds grow in a night, so ground that was dug shows a darker green. |
| `bounds.crack_the_certainty` | Crack The Certainty | Stumble | chaos | 1 | 0.10 | generic.luck | Knock the steward off balance, so every mark the charter names gets read out aloud. |

Band fragments:

- **Quicken The Turf** — critical_success: "By morning the grass stood dark green in a ring wherever a stone had been lifted." · success: "By morning the grass had grown darker over ground that had been dug." · near_miss: "The grass grew darker over the dug ground, but sheep had grazed it short by noon." · failure: "The grass grew darker over all the ploughed ground, dug or not."
- **Crack The Certainty** — success_at_cost: "{cast:steward} read out the charter's marks, then took the charter back to the lord's house." · failure: "{cast:steward} began to read out the marks, then stopped and rolled the charter up." · critical_failure: "{cast:steward} read out the marks, and misread where the oak had stood."

### Step 1 — Find the true line (eye 0.66, purpose "Find the true line")

`deal: { count: 3, tags: ['insight', 'journey'] }` + 2 specials → composed 5.

| id | Name | Type | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bounds.call_up_the_oath` | Call Up The Oath | Favor | order | 2 | 0.12 | generic.oath | Hold the reeve to the word given at every beating of the bounds, so the reeve shows where the oak truly stood. |
| `bounds.walk_the_old_line` | Walk The Old Line | Compulsion | mind | 2 | 0.11 | generic.memory | Send them a night's dream of the bounds being beaten, so they wake set on measuring from the spring. |

Band fragments:

- **Call Up The Oath** — success: "{cast:reeve} walked back and pointed again, this time to the oak's true place." · success_at_cost: "{cast:reeve} pointed to the oak's true place, then would not look at the village for the rest of the day." · failure: "{cast:reeve} started toward the oak's true place, then stopped and kept to the first answer."
- **Walk The Old Line** — critical_success: "They woke before dawn and went straight to the spring, and every measure after it ran true." · near_miss: "They woke set on starting from the spring, and lost the morning to mist." · failure: "They woke set on starting from the spring, but the spring had shifted with the years." · critical_failure: "They woke sure of the old line, and trusted the dream over the charter."

Spheres across specials: life, chaos, order, mind (4 distinct before the deal). Common option supplied by the deal. No rider authored. No card grants content. Card-type composition: step 0 Whisper + Stumble; step 1 Favor + Compulsion (batch-1 bell tower: Whisper + Long Game / Favor + Boost — no repeat).

## 12. Linear continuation (step 1 spine)

The charter marks the line by an old oak, a spring and a wayside cross. The oak was felled years ago. {cast:reeve}, who swears to the bounds for the village every year, shows {actor} where it stood. The true line runs across the lord's land, and the lord's men watch anyone who walks it. If the line is found, a new stone is set at the beating of the bounds in three days, with the lord's steward as witness.

### Afterimages

Step 0:
- critical_success: By noon they had found where every stone used to stand, and each one had been moved out onto the common.
- success: They found where the stones used to stand. Each one had been moved out onto the common.
- success_at_cost: They found where most of the stones used to stand, but the plough had wiped out the rest.
- failure: They could not tell where the stones used to stand, and had only the charter to go on.
- critical_failure: They took the moved stones for the old ones, and said so in front of {cast:steward}.

Step 1:
- critical_success: They found the true line by dusk, and {cast:reeve} owned to moving the stones before it was read out.
- success: They found the true line from the spring and the cross. When it was read out, {cast:reeve} owned to moving the stones.
- success_at_cost: They found the true line a day late, after the lord's men turned them off the land once. When it was read out, {cast:reeve} owned to moving the stones.
- failure: They could not make the spring and the cross agree on one line, and no line was sworn.
- critical_failure: They swore a line that gave the lord more of the common than the moved stones had.

## 13. Aftermath Paragraph (per band)

- **critical_success:** {cast:steward} told the lord's men the survey was fair. The assize paid {actor} in kind.
- **success:** The village has its common back. The assize paid {actor} in kind.
- **success_at_cost:** The survey ran a day over, and the lord's men watched every step of it. The assize paid {actor} in kind all the same.
- **failure:** The lord keeps the grazing, and the village keeps the smaller common. The assize sent for a sworn surveyor so that this would not happen.
- **critical_failure:** {location} counts the survey as the lord's win. The village asked for a sworn line and got one that sided with the moved stones.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (short scale; the forward thread is the appointment, which the mortal keeps or misses by their own movement).

## 15. Aftermath Kit Summary

| Band | scar | bond | boon | path |
|---|---|---|---|---|
| critical_success | — | reputation with {location} (gain) | knowledge | appointment |
| success | — | reputation with {location} (gain) | knowledge | appointment |
| success_at_cost | — | reputation with {location} (gain) | knowledge | appointment |
| failure | reputation with {location} (loss) | — | — | — |
| critical_failure | reputation with {location} (loss) | — | — | — |

Plus the auto PRIZE chip (the `#map` reward pool) on the success bands.

Chip text (cause — detail; word count):
- bond (all success bands): title "A common restored" · cause "The true line sworn" · detail "{location} thinks well of their work." (4 + 6 = 10). `stateNoun` `reputation with {location}`, `entityId: '$here'`, `visualKind: 'location'`, `tooltipId: 'ui.reputation_with'`.
- boon (all success bands): title "Why the stones moved" · cause "A debt to the lord" · detail "{actor} knows why {cast:reeve} moved the stones." (5 + 7 = 12). `stateNoun` `knowledge`, `tooltipId: 'ui.knowledge'`; concept "why {cast:reeve} moved the stones" → `ui.knowledge`.
- path (all success bands): title "The new stone" · cause "At the beating of the bounds" · detail "{cast:steward} witnesses it set in {location} in three days." (6 + 9 = 15). `stateNoun` `appointment`, `entityId: '$appointment'`, `visualKind: 'location'`.
- scar (failure): title "A line not proved" · cause "No line sworn" · detail "{location} thinks less of their work." (3 + 6 = 9).
- scar (critical_failure): title "A false survey" · cause "Sworn against the common" · detail "{location} thinks less of their work." (4 + 6 = 10).

Page read (assembled, scar · bond · boon · path):
- **critical_success:** "{cast:steward} told the lord's men the survey was fair. The assize paid {actor} in kind." · BOND "The true line sworn — {location} thinks well of their work." · BOON "A debt to the lord — {actor} knows why {cast:reeve} moved the stones." · PATH "At the beating of the bounds — {cast:steward} witnesses it set in {location} in three days." Each block adds one fact: the steward's word, the pay, the regard, the motive, the date. The afterimage above carried the confession; the chip adds only the reason.
- **success:** "The village has its common back. The assize paid {actor} in kind." · same chips. "The true line sworn" and "has its common back" are cause and effect, not one fact twice.
- **success_at_cost:** "The survey ran a day over, and the lord's men watched every step of it. The assize paid {actor} in kind all the same." · same chips. True on every path into the band (a step-0 plough-wiped or charter-only read, or a step-1 day lost to the lord's men): the job ran long either way.
- **failure:** "The lord keeps the grazing, and the village keeps the smaller common. The assize sent for a sworn surveyor so that this would not happen." · SCAR "No line sworn — {location} thinks less of their work." The overview carries the cost to the village and why it costs an expert more; the chip carries the regard.
- **critical_failure:** "{location} counts the survey as the lord's win. The village asked for a sworn line and got one that sided with the moved stones." · SCAR "Sworn against the common — {location} thinks less of their work." True on both paths: the step-0 read that took the moved stones for the old ones, and the step-1 line that gave the lord more. The overview says plainly why the extreme is worse (the survey itself sided with the fraud).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `steward` | lazy-materialize-on-trigger | reuse steward/noble/clerk, else spawn steward "Edric Payne" | must-persist | appointment counterparty; both sequels (`inheritContext`); PATH chip | ready |
| `reeve` | lazy-materialize-on-trigger | reuse elder, else spawn elder "Wat Hollis" | must-persist | step 1 prose; knowledge record and BOON chip | ready |

## 17. Concept Art Direction

1. *Emotions:* a quiet betrayal by a neighbour, the weight of a sworn word, land that people's living depends on, the loneliness of the one sent to say what is true.
2. *Evocative image:* a squared boundary stone lying on its side in wet grass, a raw hollow in the turf a few feet from it, a surveyor's chain coiled on top of the stone, and a peeled hazel wand pushed into the ground beside the hollow. No people. Grey morning light, a line of mist along a hedge.

## 18. Self-Audit

| Item | Verdict |
|---|---|
| Narrator's 12 questions | PASS — see § 19 |
| Opening ≤80 words | PASS (78) |
| Hand 4–8 composed, ≤2 specials + deal | PASS |
| ≥4 spheres, ≥1 common | PASS (specials: life, chaos, order, mind; deal supplies a common) |
| Every nudge has a failure fragment; no big-delta | PASS (max Δ 0.12) |
| Six StepOutcomes covered per step by specials | PASS — step 0: CS/S/NM/F (Quicken) + SAC/F/CF (Crack); step 1: S/SAC/F (Oath) + CS/NM/F/CF (Walk) |
| No digits in effect lines; no name word repeated in its effect line | PASS |
| Card faces name nothing the scene has not established | PASS — the grass/dug ground (moved stones, P2), the steward and the charter (P3), the reeve and the bounds oath, the oak and the spring (step-1 spine) |
| Consequence hand wired | PASS — possession (rewardPool `#map`), knowledge (intelligence `political_secret`) |
| Appointment has missed branch; both sequels authored | PASS (§ Sequels) |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), intelligence (step 1 success), appointment seed (step 1 success) |
| Chip ≤15 words; page read per band | PASS (see § 15) |
| No class scenery in outcome fields | PASS ({location} / "the village" only; single `rural` class) |
| Prose rule 7 | PASS — the charter, the reeve's oath and debt, and the moved stones are scene-local |
| Prose rule 7b | PASS — the only later-tense promise (the new stone at the beating of the bounds in three days) is conditional on finding the line and rides the appointment; the missed sequel names no place |
| Support bundle class-honest | PASS — hamlet seeds `elder` at 1.0 (reeve reuses it); steward spawns where no steward/noble/clerk is seeded |
| Detector scan (outcome fields) | PASS by hand — no `someone / nothing / anything / thing / way / whatever` in outcome fields; "nothing" appears once, in the step-0 spine (scene class, lawful) |
| Annotations (≤1) | PASS — zero "not … but" / "— not" clauses |

## 19. The narrator's 12 questions

1. P1 arrival with graph names — `{actor}` comes into `{location}`, sent for by the county assize.
2. P2 events with costs paid — the stones have moved; the common is smaller than it was.
3. P3 one stake — mystery: nobody will say who moved the stones; the charter's rule and the steward's denial set the test; the cost of failing is stated.
4. ≤80 words — 78.
5. Read aloud as a report — yes.
6. Stated, never encoded — "have moved", "smaller than it was", "says nothing has moved", "will think less of them".
7. Every sentence works — each is the complication, the rule, the opposition, the mystery or the stake.
8. Nothing unintroduced — the charter, the steward and the moved stones precede step 0's cards; the oak, the spring, the reeve and the reeve's oath precede step 1's cards; the appointment is stated before its chip.
9. One named person per beat — step 0 `{cast:steward}`, step 1 `{cast:reeve}` (the steward is role-voiced there).
10. Stake in a sentence — "Can the assize's surveyor find the true line between the lord's land and the common, and keep their name?"
11. Cards verb+noun, spell-style — Quicken The Turf, Crack The Certainty, Call Up The Oath, Walk The Old Line (verbs quicken, crack, call, walk are in the imperative lexicon).
12. Opening per class — `rural`, written.

## 20. Sequels (seed-only, `drawable: false`, THR-1526) — `src/data/encounters/boundary-survey-sequels.ts`

Modelled on `src/data/encounters/bell-tower-sequels.ts`: one step each, `intrinsicTier: 'background'`, no `locationSubtypes`, outside the factory catalog (`town.` prefix), `inheritContext` carries `{cast:steward}`.

### `town.bounds_beaten` — The Bounds Beaten (kept)

- Reach **eye 0.35** (`BOUNDS_BEATEN_DIFFICULTY` — the line was already found once; this is setting the stone to it before witnesses), one step, `failBehavior: 'fail_action'`, purpose **"Set the stone true"**, `crudType: 'read'`, `motivations: ['tradition_novelty']`.
- `narrativeTemplate`: "{name} is at the beating of the bounds in {location}. The village walks the line with {cast:steward} as the lord's witness, and the new stone goes into the ground where {name} swore the line runs. If the stone is set true to the charter's marks, the steward seals the survey for the lord."
- successAfterimage: "The stone went in true to the spring and the cross, and {cast:steward} sealed the survey in front of the village."
- failureAfterimage: "The stone went in a hand's width off the line, and {cast:steward} would not seal the survey until it was dug up and set again."
- successMetadata: `rewardPool { categoryWeights: { possession: 1 }, tagFilters: ['#trade'] }` (the survey fee) · `reputation_with $here +0.04` · `bond_change withAgentId '$cast:steward' sentimentDelta 0.06 trustDelta 0.1` · `apply_condition conditionTraitId 'trait.condition.location.festival' targetLocationId '$here' intensity 0.5 durationTicks 36` (`BOUNDS_BEATEN_FEAST_TICKS` — the beating of the bounds ends in a feast).
- failureMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.03 trustDelta −0.05`.
- narrativeTemplates: initiation "{name} is at the beating of the bounds, where the new stone is set." · success "The new stone was set true, the steward sealed the survey, and {location} kept the day as a feast." · failure "The new stone went in off the line, and the steward would not seal the survey that day."
- aftermathConfig fallback overview: "{name} kept the day at the beating of the bounds, and the new stone went into the ground." (no chips, per the sequel precedent).

### `town.bounds_stone_uprooted` — The Stone Uprooted (missed)

- Reach **heart 0.45** (`STONE_UPROOTED_DIFFICULTY`), one step, `failBehavior: 'fail_action'`, purpose **"Stand by the survey"**, `crudType: 'read'`, `motivations: ['honesty_cunning']`.
- `narrativeTemplate`: "{name} was not at the beating of the bounds. With no surveyor there to swear to it, the new stone was pulled up in the night. {cast:steward} has come looking for {name}, and says the lord will not accept a stone that nobody swore to." (Names no place: the missed branch fires wherever the mortal stands.)
- successAfterimage: "{cast:steward} took {name}'s word for the line, and agreed to have the stone set again."
- failureAfterimage: "{cast:steward} left without agreeing to anything, and the line stays unsettled."
- successMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.02 trustDelta 0.02` (a small mend; no payment claimed, so no reward pool).
- failureMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.1 trustDelta −0.12` · `reputation_with targetAgentId '$cast:steward' −0.04` (never `$here` — the bell-tower Pass 3 correction: `$here` binds wherever the mortal stands, far from the village).
- narrativeTemplates: initiation "The new stone was pulled up after nobody from the survey came to the beating of the bounds, and the steward has come looking." · success "The steward agreed to have the stone set again on the surveyor's word." · failure "The steward left, and the line stays unsettled."
- aftermathConfig fallback overview: "Nobody from the survey was at the beating of the bounds, and the new stone did not stay in the ground." (no chips).

*Pass 3 note on 7b:* "agreed to have the stone set again" is a scene-local agreement, reported in the afterimage; nothing in the prose tells the mortal to be anywhere later. "the line stays unsettled" is a present-tense state claim with no world object behind it — acceptable as afterimage prose (it claims no chip); flag if the critic reads it as a state assertion.

## Experience Differentiator Gate

1. **YES** — P1 arrival with graph names, P2 moved stones and the smaller common (cost paid), P3 one mystery with its rule and cost; 78 words.
2. **YES** — every sentence is the complication, the rule, the opposition, the mystery or the stake.
3. **YES** — the moved stones, the charter, the steward (step 0); the oak, the spring, the cross, the reeve and the reeve's yearly oath, the lord's men (step 1) — all named before the hands.
4. **YES** — "The assize's surveyor must find the true line between the lord's land and the common, and keep their name."
5. **YES** — four verb+noun names, direct effect lines, no flavor quote, no effect line repeats a word from its name.
6. **YES** — every special is essence-priced (2 / 1 / 2 / 2).
7. **YES** — every special has a failure fragment; no card reaches the big-delta line.
8. **YES** — delete the grass, the steward, the reeve's oath or the spring and the matching card is senseless here.
9. **YES** — where the stones stood (ground) / what the charter says (a keeper's certainty) / where the oak stood (a person's sworn word) / where to begin (the surveyor's own dream): four different questions.
9b. **YES** — two specials + deal on each step; no step asks for a branch or an ending.
10. **YES** — an overview on every band.
11. **YES** — the steward and the reeve are named; nouns are `reputation with {location}`, `knowledge`, `appointment`, and the auto PRIZE.
11b. **YES** — § 15 page read; the confession sits in the afterimage and the chip carries only the motive.
12. **N/A** (short).
13. **N/A** (short).
14. **YES** — emotions named first; the image is residue (a lifted stone, a hollow, a coiled chain, a hazel wand), no people.
