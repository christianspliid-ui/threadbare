# Encounter Pipeline: The Boundary Survey
> Scale: short | Slug: boundary-survey | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0
> Batch: expert-everyday-2 (THR-1679), slot 1 · Template id: `encounter.town.boundary_survey`
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | Expert two-step Eye job (read the moved stones, find the true line); the batch's appointment slot with kept/missed seed-only sequels (`town.bounds_beaten`, `town.bounds_stone_uprooted`); possession (`#map` pool) + knowledge (`political_secret`) hand; betrayal hook: the friendly reeve moved the stones. |
| Editorial | PASS WITH REVISIONS | Triggers 15, 17, 22, 29, 35 and gate 8 fired; all fixed in the revised file (step-1 spine states the reeve's wrong place; Crack The Certainty replaced by Loose The Wind; Call Up The Oath relabelled Signature; critical_failure page made true on both paths; page repetitions removed; missed sequel's "anything" and unenacted "set again" promise removed). |
| Systems | READY WITH CAVEATS | Every referenced id verified live. No field-shape corrections needed (reward-pool shape and the `$cast:steward`-targeted missed-sequel regard write were already in their corrected form). No missing primitives. Required fields the packet left unwritten are supplied in § 21. |

### Fixes merged by Pass 3

No prose changed. Field shapes and completions only:

1. **§ 21 added (new, Pass 3)**: seed labels, intelligence label/detail, `supportRole` ×2, chip declarations, template tags/settings, sequel field completion and the hand-registration line.
2. **Confirmations recorded, no edit needed:** reward-pool shape is `{ categoryWeights: { possession: 1 }, tagFilters: ['#map'] }` (`RewardPoolRecipe`); missed sequel regard write targets `$cast:steward`, never `$here`; `#territorial` is a lawful family tag; `loose` is already in `IMPERATIVE_VERB_LEXICON` (not new); the steward always spawns on a `rural` place (no rural roster seeds steward/noble/clerk) and the reeve reuses `elder` only at hamlets.

### Caveats / Blockers

1. **Sequel file + hand registration.** Create `src/data/encounters/boundary-survey-sequels.ts` (`BOUNDARY_SURVEY_SEQUELS`, content in § 20) and spread it in `src/data/unified-action-templates.ts` beside `...BELL_TOWER_SEQUELS`. Without it `validateEncounterSeedRefs` reports both appointment branches as `dead_template`.
2. **Required fields** (§ 21): kept `seedLabel`, `appointment.missed.seedLabel`, `intelligence.label` / `.detail`, `supportRole` ×2, chip declarations, `tags: ['#territorial']`.
3. **Live proof.** Evidence from a seed sweep plus one pinned run per band (`?view=game&seeded&size=medium&spawn=encounter.town.boundary_survey&outcome=<band>`), reading `await window.__DEBUG.getOutcomePinVerdict()` until it says `band_rendered` (impediments #1111 / #1113 / #1118). Run `check:encounter` as well as the dry-run compile (#1114). Prove both appointment branches.
4. *Note, not a defect:* `intrinsicTier: 'shaping'` is deliberate; the 0.45 open-draw cap binds `background` only. No reach gate is authored, so the forecast window keeps the job with Eye-competent mortals.
5. *Note, success_at_cost:* the cost is prose-carried (the lost day, turned off the land once) plus a smaller net regard on the step-0-failure path; no band-keyed effect exists to add one honestly. Same as the shipped bell tower.
6. *Note:* step-1 deal tag `insight` can also draw the library `card.compulsion.signature.mind` as a dealt card alongside the authored Walk The Old Line; the brief's at-most-once cap covers authored specials. Watch the batch coverage audit.

### Editorial Notes Summary

The editor found the draft sound and fixed only words. The step-1 spine now says the reeve's place misses the cross (grounding Call Up The Oath) and links his yearly oath to the beating of the bounds. The step-0 chaos card failed trigger 17 (mechanism) and became Loose The Wind, a true Stumble. Call Up The Oath was relabelled Signature (order) because the library Favor calls in a debt owed. The critical_failure page was made true on both entry paths (step-0 misread, step-1 false oath), and repetitions on the success_at_cost, failure and BOND/BOON/PATH captions were cut. The missed sequel lost "anything" and an unenacted "set again" promise; the kept sequel's second payment got its fiction (the lord's share of the fee) and its overview stopped retelling the afterimage. `#territorial`, the festival-condition reuse and the Stumble/Whisper/Compulsion labels were ruled lawful.

### Implementation File Map

| File | Action | Notes |
|---|---|---|
| `Docs/plans/encounters/boundary-survey.package.json` | create | Compiles (`compile:encounter`, THR-1246) into `src/data/encounters/boundary-survey.ts`, its structural test and the parent's registrations. Not hand-edited. |
| `src/data/encounters/boundary-survey-sequels.ts` | create (hand-authored) | `town.bounds_beaten` + `town.bounds_stone_uprooted`, `drawable: false`, no `locationSubtypes`, `intrinsicTier: 'background'`, exported as `BOUNDARY_SURVEY_SEQUELS`. Mirror `bell-tower-sequels.ts`. |
| `src/data/unified-action-templates.ts` | modify (2 lines) | Import + spread `BOUNDARY_SURVEY_SEQUELS` beside `...BELL_TOWER_SEQUELS` (the THR-1677 / THR-1678 precedent). |
| `src/data/content-objects.ts` | none | `town.` prefix already claimed. |
| Generated census artifacts / action-catalog wiki page | regenerate / exempt | As the THR-1678 closeout did. |
| Engine / types / art | none | Image tags are `generic.*` library entries. |

Full audit: `Docs/plans/encounters/boundary-survey-systems.md`.

---

## Encounter Packet

# Encounter Pipeline: The Boundary Survey
> Scale: short | Slug: boundary-survey | Pass: revised
> Revisions applied: step-1 spine states the reeve's wrong place (grounds Call Up The Oath) and links his oath to the beating of the bounds; step-0 chaos card replaced (Crack The Certainty → Loose The Wind, a true Stumble with a stated mechanism); Call Up The Oath relabelled Signature (order); critical_failure page conflict fixed (new step-1 crit afterimage, overview, SCAR cause); page repetitions removed on success_at_cost, failure and the BOND/BOON/PATH captions; seam and fragment-ordering fixes; missed sequel's "anything" and unenacted "set again" promise removed; kept sequel's fee given fiction and its overview de-duplicated
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
| Seed dice | p3 **mystery** ("Nobody in {location} will say who moved the stones") · opposition **faction (doctrine)** — the charter's own law: only a survey sworn from its marks counts, and one of its three marks (the old oak) is gone; the steward holds the charter to that letter · disposition **friendly** — the reeve walks the bounds with {actor} and helps (the betrayal reads under that friendliness) · agentRole **trespasser** — the true line runs across the lord's land, and the lord's men watch anyone who crosses it · scale **region** (recorded; the template field stays `local`, per the brief). |
| Expert stakes | Someone with standing across the table: the county assize and the lord's steward. Failure costs standing first: {location} thinks less of the surveyor who could not find the line. No death, jail or brand. |
| Consequence hand (binding) | `possession` + `knowledge`. No swap. **possession** — step 1 `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#map'] }`: the assize pays in kind (renders as the auto PRIZE chip; `#map` has six bearers, including the Cartographer's Survey). **knowledge** — `intelligence` (`political_secret`) on step 1 success: {actor} knows why the reeve moved the stones. |
| Appointment | Step 1 success: `encounter_seed` `templateId: 'town.bounds_beaten'`, `targetAgentId: '$actor'`, `delayTicks: 36` (three days to the beating of the bounds), `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:steward', missed: { templateId: 'town.bounds_stone_uprooted', seedLabel } }`. The step-1 spine names the place and the time (this year's beating of the bounds, in three days) — prose rule 7b's one lawful exception, and only on the success path. |
| Spine effect | `reputation_with` on `$here`: +0.06 on step 1 success, −0.06 on step 1 failure, −0.03 on step 0 failure (a step-0 critical_failure ends the action, so the critical_failure SCAR chip needs its own backing write on step 0 — the well-sinking / bell-tower lesson). |
| Conditions (system target) | Land in the **kept sequel**: `apply_condition` `trait.condition.location.festival` on `$here` — the beating of the bounds ends in a feast. The parent puts no condition on the mortal (brief: reputation is the expert penalty). |
| Mortal choice | None — this is a test. `motivations: ['honesty_cunning', 'tradition_novelty']` — the scene is about telling a true line from a false one, and about an old charter's law. |
| Trait hooks | Gate: none (everyday by construction). Variant: none — no live trait fits reading ground better than the reach does. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast · rewards · seeds (appointment) · reputation — four. |
| Heavy Hand | none authored (slot 4 is the batch's home for it). |
| Tags | `['#territorial']` — "of ground held, claimed, or argued over" (family axis, seated; encounters author `form`/`family` only — editorial ruling: lawful). |
| Promise → payoff | "Nobody will say who moved the stones" (opening) → paid in step 1's success afterimages (the reeve owns to it) and the knowledge chip (why). "A new stone is set at this year's beating of the bounds" (step-1 spine, conditional) → the appointment and both sequels. |

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

The god works on the ground and on the people who hold the truth: grass quickened overnight so dug turf shows, a gust that throws the charter open so every mark is read aloud, a reeve held to the oath he swears every year, and a dream of the old line sent to the surveyor.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `steward` | The lord's steward; holds the charter; says nothing has moved; the appointment's counterparty and witness at the beating of the bounds. Named on step 0. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `steward` / `noble` / `clerk`; spawn `steward` "Edric Payne". |
| `reeve` | The village's reeve; leads the beating of the bounds and swears to them every year; walks {actor} round (friendly); moved the stones to clear a debt to the lord. Named on step 1. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `elder` (seeded at 1.0 in hamlets); spawn `elder` "Wat Hollis". |
| The village (`$here`) | Carries the reputation and the appointment's place. | resolved location |
| Prize | A `#map` possession from the reward pool (the assize pays in kind). | step 1 `rewardPool` |
| Intelligence record | `political_secret` — why the reeve moved the stones. | step 1 `intelligence` |
| Appointment | The new stone set at this year's beating of the bounds, in three days, with the steward as witness. | step 1 `encounter_seed` + `appointment` |

## 6. Beat Structure

1. **Read the moved stones** (eye 0.58, `continue_weakened`) — find where the stones used to stand. Success: each was moved out onto the common. Failure: only the charter to go on (continues weakened). Critical failure: the moved stones taken for the old ones, before the steward — ends it.
2. **Find the true line** (eye 0.66, `fail_action`) — measure the line from the spring, the wayside cross and the felled oak's place (the reeve's place misses the cross), across the lord's land. Success: the true line found, the reeve owns to moving the stones; prize, knowledge, reputation, appointment planted. Failure: no line sworn; reputation lost. Critical failure: the moved stones sworn to as the true line.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | True line found by dusk; the steward vouches for the survey before the lord's men | the day | appointment; prize; knowledge; the village's regard |
| success | True line found; the common restored | the day | appointment; prize; knowledge; regard |
| success_at_cost | True line found a day late; the lord's men turned the surveyor off the land once | an extra day | appointment; prize; knowledge; regard |
| failure | No line sworn; the lord keeps the grazing | the survey | the village thinks less of them |
| critical_failure | The survey sided with the moved stones (taken for the old ones at step 0, or sworn to at step 1) | the survey, and the common | the village thinks less of them |

## 10. Sample Opening (narrator mode)

**P1 (rural):** {actor} comes into {location}, sent for by the county assize.

**Spine (step 0), P2:** The stones marking the bounds between the lord's land and the village common have moved. The common is smaller than it was.

**Spine (step 0), P3:** The charter says a survey sworn from its marks settles the line. {cast:steward}, the lord's steward, holds the charter and says nothing has moved. Nobody in {location} will say who moved the stones. If {actor} cannot find the true line, {location} will think less of them.

Word count, P1 + P2 + P3: 10 + 22 + 46 = **78**.

## 11. The Hand Per Step

### Step 0 — Read the moved stones (eye 0.58, purpose "Read the moved stones")

`deal: { count: 3, tags: ['insight', 'lore'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bounds.quicken_the_turf` | Quicken The Turf | Whisper | life | 2 | 0.12 | generic.vigor | Make the grass along the bounds grow in a night, so ground that was dug shows a darker green. |
| `bounds.loose_the_wind` | Loose The Wind | Stumble | chaos | 1 | 0.10 | generic.luck | Send a gust across the common as the steward unrolls the charter, so it blows open and every mark on it is read aloud. |

Band fragments:

- **Quicken The Turf** — critical_success: "Overnight the grass had grown dark green in a ring wherever a stone had been lifted." · success: "Overnight the grass had grown darker over every patch that had been dug." · near_miss: "The grass grew darker over the dug ground, but sheep had grazed it short by noon." · failure: "The grass grew darker over all the ploughed ground, dug or not."
- **Loose The Wind** — success_at_cost: "The gust blew the charter open and its marks were read aloud, and then {cast:steward} took it back to the lord's house." · failure: "The gust blew the charter open, but the ink at the fold had faded past reading." · critical_failure: "The gust blew the charter into the ditch, and {cast:steward} blamed {actor} for it."

### Step 1 — Find the true line (eye 0.66, purpose "Find the true line")

`deal: { count: 3, tags: ['insight', 'journey'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bounds.call_up_the_oath` | Call Up The Oath | Signature | order | 2 | 0.12 | generic.oath | Hold the reeve to the word sworn at every beating of the bounds, so the reeve points to the oak's true place. |
| `bounds.walk_the_old_line` | Walk The Old Line | Compulsion | mind | 2 | 0.11 | generic.memory | Send them a night's dream of the bounds being beaten, so they wake set on measuring from the spring. |

Band fragments:

- **Call Up The Oath** — success: "{cast:reeve} had already gone back and shown them the oak's true place." · success_at_cost: "{cast:reeve} had shown them the oak's true place, and would not look at the village afterwards." · failure: "{cast:reeve} started toward the oak's true place, then stopped and kept to the first answer."
- **Walk The Old Line** — critical_success: "They had woken before dawn and gone straight to the spring, and every measure after it ran true." · near_miss: "They woke set on starting from the spring, and lost the morning to mist." · failure: "They woke set on starting from the spring, but the spring had shifted with the years." · critical_failure: "They woke sure of the line in the dream, and trusted it over the charter's marks."

Spheres across specials: life, chaos, order, mind (4 distinct before the deal). Common option supplied by the deal. No rider authored. No card grants content. Card-type composition: step 0 Whisper + Stumble; step 1 Signature + Compulsion (batch-1 bell tower: Whisper + Long Game / Favor + Boost — no repeat). Type-label note: Call Up The Oath is **not** a Favor — the library Favor creates or calls in a favor owed (favors host system, `requiresFavor` precedent in `the-garrisons-price.ts`), and a reeve's yearly oath is no debt owed to the mortal or the god. Batch note: Walk The Old Line is an authored mind Compulsion special; the brief caps the library `card.compulsion.signature.mind` at once across the batch, so no other slot should add a second mind Compulsion special.

## 12. Linear continuation (step 1 spine)

The charter marks the line by an old oak, a spring and a wayside cross. The oak was felled years ago. {cast:reeve}, who leads the beating of the bounds each year and swears to them, shows {actor} where it stood, but a line from there misses the cross. The true line runs across the lord's land, and the lord's men watch anyone who crosses it. If the line is found, a new stone is set at this year's beating of the bounds, in three days, with the lord's steward as witness.

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
- success_at_cost: They found the true line a day late, after measuring once from the wrong place. When it was read out, {cast:reeve} owned to moving the stones.
- failure: They could not make the spring and the cross agree on one line.
- critical_failure: They swore to the moved stones as the true line.

## 13. Aftermath Paragraph (per band)

- **critical_success:** {cast:steward} told the lord's men the survey was fair. The assize paid {actor} in kind.
- **success:** The village has its common back. The assize paid {actor} in kind.
- **success_at_cost:** The lord's men turned {actor} off the land once before the survey was done. The assize paid them in kind all the same.
- **failure:** The lord keeps the grazing that the moved stones took from the common. {location} sent for a sworn surveyor to stop exactly that.
- **critical_failure:** {location} sent for a sworn surveyor to win back its common, and is worse off than before.

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
- bond (all success bands): title "A line proved" · cause "Sworn before the village" · detail "{location} thinks well of their work." (4 + 6 = 10). `stateNoun` `reputation with {location}`, `entityId: '$here'`, `visualKind: 'location'`, `tooltipId: 'ui.reputation_with'`; concept "thinks well of" → `ui.standing`.
- boon (all success bands): title "Why the stones moved" · cause "{cast:reeve} owed the lord" · detail "{actor} knows why the stones were moved." (4 + 7 = 11). `stateNoun` `knowledge`, `tooltipId: 'ui.knowledge'`; concept "why the stones were moved" → `ui.knowledge`.
- path (all success bands): title "The beating of the bounds" · cause "A new stone for the line" · detail "{cast:steward} witnesses it set in {location} in three days." (6 + 9 = 15). `stateNoun` `appointment`, `entityId: '$appointment'`, `visualKind: 'location'`.
- scar (failure): title "A line not proved" · cause "No line sworn" · detail "{location} thinks less of their work." (3 + 6 = 9).
- scar (critical_failure): title "A false survey" · cause "Their word for the lord" · detail "{location} thinks less of their work." (5 + 6 = 11).

Page read (assembled, scar · bond · boon · path; afterimage held alongside):
- **critical_success:** "{cast:steward} told the lord's men the survey was fair. The assize paid {actor} in kind." · BOND "Sworn before the village — {location} thinks well of their work." · BOON "{cast:reeve} owed the lord — {actor} knows why the stones were moved." · PATH "A new stone for the line — {cast:steward} witnesses it set in {location} in three days." Each block adds one fact: the steward's word, the pay, the regard and why, the motive, the date. The afterimage carried the finding and the confession; nothing on the page retells them.
- **success:** "The village has its common back. The assize paid {actor} in kind." · same chips. Clean.
- **success_at_cost:** "The lord's men turned {actor} off the land once before the survey was done. The assize paid them in kind all the same." · same chips. The afterimage carries the lost day (measured once from the wrong place); the overview carries the lord's men. True on every path into the band: the spine has already said the lord's men watch anyone who crosses the line, and no path contradicts it.
- **failure:** "The lord keeps the grazing that the moved stones took from the common. {location} sent for a sworn surveyor to stop exactly that." · SCAR "No line sworn — {location} thinks less of their work." The afterimage says the marks would not agree; the overview says what it cost the village and why it costs an expert more; the chip says what did not happen and the regard.
- **critical_failure:** "{location} sent for a sworn surveyor to win back its common, and is worse off than before." · SCAR "Their word for the lord — {location} thinks less of their work." True on both paths: the step-0 read that took the moved stones for the old ones, said in front of the steward, and the step-1 oath to the moved stones. The overview says plainly why the extreme is worse (the surveyor's own word now backs the moved stones).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `steward` | lazy-materialize-on-trigger | reuse steward/noble/clerk, else spawn steward "Edric Payne" | must-persist | appointment counterparty; both sequels (`inheritContext`); PATH chip; Loose The Wind fragments | ready |
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
| Six StepOutcomes covered per step by specials | PASS — step 0: CS/S/NM/F (Quicken) + SAC/F/CF (Loose The Wind); step 1: S/SAC/F (Oath) + CS/NM/F/CF (Walk) |
| No digits in effect lines; no name word repeated in its effect line | PASS |
| Card faces name nothing the scene has not established | PASS — the grass/dug ground (moved stones, P2), the steward, the charter and the common (P2–P3), the reeve, his yearly oath at the beating of the bounds, the oak's place and the spring (step-1 spine) |
| Consequence hand wired | PASS — possession (rewardPool `#map`), knowledge (intelligence `political_secret`) |
| Appointment has missed branch; both sequels authored | PASS (§ 20) |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), intelligence (step 1 success), appointment seed (step 1 success) |
| Chip ≤15 words; page read per band | PASS (see § 15) |
| No class scenery in outcome fields | PASS ({location} / "the village" only; single `rural` class) |
| Prose rule 7 | PASS — the charter, the reeve's oath and debt, and the moved stones are scene-local |
| Prose rule 7b | PASS — the only later-tense promise (the new stone at this year's beating of the bounds, in three days) is conditional on finding the line and rides the appointment; the missed sequel names no place and promises no later act |
| Support bundle class-honest | PASS — hamlet seeds `elder` at 1.0 (reeve reuses it); steward spawns where no steward/noble/clerk is seeded |
| Detector scan (outcome fields) | PASS by hand — no evasive or natural-indefinite term in any outcome field (incl. sequels); "nothing"/"Nobody" appear only in scene-class fields |
| Annotations (≤1) | PASS — zero "not … but" / "— not" clauses |
| Intensifiers | PASS — "truly" removed from Call Up The Oath and its fragments |

## 19. The narrator's 12 questions

1. P1 arrival with graph names — `{actor}` comes into `{location}`, sent for by the county assize.
2. P2 events with costs paid — the stones have moved; the common is smaller than it was.
3. P3 one stake — mystery: nobody will say who moved the stones; the charter's rule and the steward's denial set the test; the cost of failing is stated.
4. ≤80 words — 78.
5. Read aloud as a report — yes.
6. Stated, never encoded — "have moved", "smaller than it was", "says nothing has moved", "will think less of them", "a line from there misses the cross".
7. Every sentence works — each is the complication, the rule, the opposition, the mystery or the stake.
8. Nothing unintroduced — the charter, the steward and the moved stones precede step 0's cards; the oak, the spring, the cross, the reeve, his yearly oath and his place that misses the cross precede step 1's cards; the appointment is stated before its chip.
9. One named person per beat — step 0 `{cast:steward}`, step 1 `{cast:reeve}` (the steward is role-voiced there).
10. Stake in a sentence — "Can the assize's surveyor find the true line between the lord's land and the common, and keep their name?"
11. Cards verb+noun, spell-style — Quicken The Turf, Loose The Wind, Call Up The Oath, Walk The Old Line (verbs quicken, loose, call, walk are in `IMPERATIVE_VERB_LEXICON`).
12. Opening per class — `rural`, written.

## 20. Sequels (seed-only, `drawable: false`, THR-1526) — `src/data/encounters/boundary-survey-sequels.ts`

Modelled on `src/data/encounters/bell-tower-sequels.ts`: one step each, `intrinsicTier: 'background'`, no `locationSubtypes`, outside the factory catalog (`town.` prefix), `inheritContext` carries `{cast:steward}`.

### `town.bounds_beaten` — The Bounds Beaten (kept)

- Reach **eye 0.35** (`BOUNDS_BEATEN_DIFFICULTY` — the line was already found once; this is setting the stone to it before witnesses), one step, `failBehavior: 'fail_action'`, purpose **"Set the stone true"**, `crudType: 'read'`, `motivations: ['tradition_novelty']`.
- `narrativeTemplate`: "{name} is at the beating of the bounds in {location}. The village walks the line with {cast:steward} as the lord's witness, and the new stone goes into the ground where {name} swore the line runs. If the stone is set true to the charter's marks, the steward seals the survey and pays the lord's share of the fee."
- successAfterimage: "The stone went in true to the spring and the cross. {cast:steward} sealed the survey and paid the lord's share of the fee, and the village sat down to its feast."
- failureAfterimage: "The stone went in a hand's width off the line, and {cast:steward} would not seal the survey that day."
- successMetadata: `rewardPool { categoryWeights: { possession: 1 }, tagFilters: ['#trade'] }` (the lord's share of the survey fee) · `reputation_with $here +0.04` · `bond_change withAgentId '$cast:steward' sentimentDelta 0.06 trustDelta 0.1` · `apply_condition conditionTraitId 'trait.condition.location.festival' targetLocationId '$here' intensity 0.5 durationTicks 36` (`BOUNDS_BEATEN_FEAST_TICKS` — the beating of the bounds ends in a feast; the condition is a shared catalog entry, reuse is lawful).
- failureMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.03 trustDelta −0.05`.
- narrativeTemplates: initiation "{name} is at the beating of the bounds, where the new stone is set." · success "The new stone was set true, the steward sealed the survey and paid the lord's share of the fee, and {location} kept the day as a feast." · failure "The new stone went in off the line, and the steward would not seal the survey that day."
- aftermathConfig fallback overview: "{name} kept the day at the beating of the bounds, with {cast:steward} there as the lord's witness." (no chips, per the sequel precedent).

### `town.bounds_stone_uprooted` — The Stone Uprooted (missed)

- Reach **heart 0.45** (`STONE_UPROOTED_DIFFICULTY`), one step, `failBehavior: 'fail_action'`, purpose **"Stand by the survey"**, `crudType: 'read'`, `motivations: ['honesty_cunning']`.
- `narrativeTemplate`: "{name} was not at the beating of the bounds. The new stone went in with no surveyor there to swear to it, and it was pulled up in the night. {cast:steward} has come looking for {name}, and says the lord will not seal the survey without the surveyor's word." (Names no place: the missed branch fires wherever the mortal stands.)
- successAfterimage: "{cast:steward} took {name}'s word for the line, and sealed the survey without the stone."
- failureAfterimage: "{cast:steward} left without agreeing to set the stone again, and thinks less of the surveyor who stayed away."
- successMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.02 trustDelta 0.02` (a small mend; no payment claimed, so no reward pool).
- failureMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.1 trustDelta −0.12` · `reputation_with targetAgentId '$cast:steward' −0.04` (never `$here` — the bell-tower Pass 3 correction: `$here` binds wherever the mortal stands, far from the village). The failure afterimage's "thinks less of the surveyor" is this write.
- narrativeTemplates: initiation "The new stone was pulled up after nobody from the survey came to the beating of the bounds, and the steward has come looking." · success "The steward sealed the survey on the surveyor's word." · failure "The steward left without agreeing to set the stone again."
- aftermathConfig fallback overview: "Nobody from the survey was at the beating of the bounds, and the new stone did not stay in the ground." (no chips).

*Rule 7b note:* the missed sequel promises no later act. Its success reports a finished one (the survey sealed on the mortal's word), and its failure reports the steward's standing, which the `reputation_with` / `bond_change` writes back. Neither sequel binds the mortal to a later place or time.

## Experience Differentiator Gate

1. **YES** — P1 arrival with graph names, P2 moved stones and the smaller common (cost paid), P3 one mystery with its rule and cost; 78 words.
2. **YES** — every sentence is the complication, the rule, the opposition, the mystery or the stake.
3. **YES** — the moved stones, the charter, the steward (step 0); the oak, the spring, the cross, the reeve, his yearly oath, his place that misses the cross, the lord's men (step 1) — all named before the hands.
4. **YES** — "The assize's surveyor must find the true line between the lord's land and the common, and keep their name."
4b. **YES** — seams read sentence against sentence: no repeated image or sentence shape at opening→spine, spine→afterimage, afterimage→fragment or afterimage→page.
5. **YES** — four verb+noun names, direct effect lines, no flavor quote, no effect line repeats a word from its name.
6. **YES** — every effect line says what the god does and why it moves the odds; every special is essence-priced (2 / 1 / 2 / 2).
7. **YES** — every special has a failure fragment; no card reaches the big-delta line.
8. **YES** — delete the grass, the charter in the steward's hands, the reeve's place that misses the cross, or the spring, and the matching card is senseless here.
9. **YES** — where the stones stood (ground) / what the charter says (the opposition's paper) / where the oak stood (a person's sworn word) / where to begin (the surveyor's own dream): four different questions.
9b. **YES** — two specials + deal on each step; no step asks for a branch or an ending.
10. **YES** — an overview on every band.
11. **YES** — the steward and the reeve are named; nouns are `reputation with {location}`, `knowledge`, `appointment`, and the auto PRIZE.
11b. **YES** — § 15 page read: no fact told twice, no padding, and the critical_failure page is true on both entry paths.
12. **N/A** (short).
13. **N/A** (short).
14. **YES** — emotions named first; the image is residue (a lifted stone, a hollow, a coiled chain, a hazel wand), no people.

## 21. Systems field completions (Pass 3: required fields the packet left unwritten)

Built only from sentences already in the packet; the package pass may tune the wording but must keep every field.

- **Template:** `id: 'encounter.town.boundary_survey'`, `tags: ['#territorial']` (family axis; no reach or sphere tag), `settings: ['rural']`, `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'`, `motivations: ['honesty_cunning', 'tradition_novelty']`.
- **Step 0:** reach `eye`, difficulty 0.58, `failBehavior: 'continue_weakened'`, `deal: { count: 3, tags: ['insight', 'lore'] }`; `failureMetadata.effects`: `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.03 }` (backs the step-0 critical_failure SCAR).
- **Step 1:** reach `eye`, difficulty 0.66, `failBehavior: 'fail_action'`, `deal: { count: 3, tags: ['insight', 'journey'] }`.
- **Step 1 `successMetadata.rewardPool`:** `{ categoryWeights: { possession: 1 }, tagFilters: ['#map'] }` (`RewardPoolRecipe`, `src/types/attachments.ts:232`; six `#map` possession bearers).
- **Step 1 `successMetadata.effects`:** `{ kind: 'reputation_with', targetLocationId: '$here', delta: 0.06 }`, plus the `intelligence` and `encounter_seed` below. **`failureMetadata.effects`:** `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.06 }`.
- **Step 1 `intelligence`** (`label` and `detail` required): `{ kind: 'intelligence', category: 'political_secret', label: 'Why the stones moved', detail: 'The reeve owed the lord a debt and moved the stones to clear it.', reliability: 0.85, targetAgentId: '$actor' }`.
- **Step 1 `encounter_seed`:** `{ kind: 'encounter_seed', templateId: 'town.bounds_beaten', targetAgentId: '$actor', delayTicks: 36, inheritContext: true, seedLabel: "A new stone is set at this year's beating of the bounds, with the steward as witness.", appointment: { locationId: '$here', counterpartyId: '$cast:steward', missed: { templateId: 'town.bounds_stone_uprooted', seedLabel: 'Nobody from the survey was at the beating of the bounds, and the steward comes looking for the surveyor.' } } }`. *(Package pass 2026-10-01: `seedLabel` is never enriched — `encounterSeeding.ts` prints it raw into "A planted thread bears fruit: …" — so `{cast:steward}` would reach the player as a literal token; role-voiced "the steward", the bell-tower form.)* `windowTicks` omitted gives `APPOINTMENT_WINDOW_TICKS` (12); `missed.delayTicks` omitted gives `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` (12). `delayTicks: 36` is three days (`TICKS_PER_DAY` = 12). *(The missed seed label names where they were not; the missed sequel itself stays placeless, the bell-tower form.)*
- **Support bundle `supportRole`** (required string): `steward` → `'steward'`; `reeve` → `'reeve'`. Shape as the well / bell-tower precedent: `kind: 'actor'`, `key`, `delivery: 'lazy-materialize-on-trigger'`, `persistence: 'must-persist'`, `reuseNpcRoles`, `spawnNpcRole`, `spawnName`. Steward: `reuseNpcRoles: ['steward', 'noble', 'clerk']`, `spawnNpcRole: 'steward'`, `spawnName: 'Edric Payne'` (on every `rural` place the steward spawns; no rural roster seeds one). Reeve: `reuseNpcRoles: ['elder']`, `spawnNpcRole: 'elder'`, `spawnName: 'Wat Hollis'` (hamlets seed an `elder`; farmland and mining spawn).
- **Chip declarations** (well-sinking / bell-tower shape): BOND and SCAR `stateNoun { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` + concept `"thinks well of"` / `"thinks less of"` with `tooltipId: 'ui.standing'`; BOON `stateNoun { text: 'knowledge', tooltipId: 'ui.knowledge' }` (no `entityId`; the counting-house precedent), concept "why the stones were moved" → `ui.knowledge`; PATH `kind: 'future_hook'`, `category: 'path'`, `stateNoun { text: 'appointment', entityId: '$appointment', visualKind: 'location' }`.
- **Sequels** (`src/data/encounters/boundary-survey-sequels.ts`, content in § 20): `drawable: false`, `intrinsicTier: 'background'`, `rarityTier: 2`, `scale: 'local'`, `apCost: 1`, `actorAffinities: ['individual']`, `crudType: 'read'`, `failBehavior: 'fail_action'`, `branchOnStep: 0` aftermath with a `fallback` overview and `changes: []`, no `locationSubtypes`; export `BOUNDARY_SURVEY_SEQUELS: readonly UnifiedActionTemplate[] = [BOUNDS_BEATEN, BOUNDS_STONE_UPROOTED]`. `description`: kept "{name} is at the beating of the bounds, where the new stone is set against the charter's marks."; missed "The beating of the bounds went ahead with no surveyor there, and the new stone was pulled up." Kept `rewardPool`: `{ categoryWeights: { possession: 1 }, tagFilters: ['#trade'] }`. Kept `apply_condition`: `{ conditionTraitId: 'trait.condition.location.festival', targetLocationId: '$here', intensity: 0.5, durationTicks: 36 }`.
- **Hand registration:** import `BOUNDARY_SURVEY_SEQUELS` in `src/data/unified-action-templates.ts` and spread it beside `...BELL_TOWER_SEQUELS`.
- **Lexicon:** `quicken`, `loose`, `call`, `walk` are already in `IMPERATIVE_VERB_LEXICON` (`loose` is not new).
