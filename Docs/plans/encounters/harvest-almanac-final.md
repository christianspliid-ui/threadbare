# Encounter Pipeline: Calling the Harvest
> Scale: short | Slug: harvest-almanac | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0
> Status: **READY WITH CAVEATS**
> Pass 3b (package, 2026-10-01): PACKAGE FIX applied, one fold. The ambition chip's cause clause and the `assign_ambition` narrativeHook no longer claim an almanac (no graph object; the ambition the player watches is builder-civic). Recaptioned to "Means to build for the valley"; description and design rows aligned. See `harvest-almanac-package.md`.

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | One-step expert Star test: a village asks the reader to name the harvest day with a storm coming; the reader's own stubbornness is the opposition; `drive` + `movement` consequence hand; Stoke Their Pride trait card. |
| Editorial | PASS WITH REVISIONS | Card renamed Sting to Stoke (imperative lexicon) and its delta cut to 0.05; opening and P3 stake rewritten; success_at_cost page conflict fixed; Hasten gets all six band fragments; PATH chip recaptioned. |
| Systems | READY WITH CAVEATS | Every id verified in `src/`. Three fixes merged: `deal.count` 5 (common-option starvation, measured on all 132 god shapes), relocation chip wording (travel is a lean), corrected trait-ref and sphere-floor claims. Relocation null rate measured at 0 of 1,589 rural mortals. |

### Caveats / Blockers

No blockers. Caveats:

1. **Ambition refusal.** `assign_ambition` returns `no_free_slot` for about 21% of mature-world actors (no eviction), so the PATH ambition chip can report a write that did not land. Corpus-wide, shared with every `assign_ambition` encounter.
2. **Sphere breadth.** A starting repertoire deals at most 3 distinct spheres into this hand (Hasten on `time` plus the god's primary and secondary), under the 4-sphere preference. `checkComposedHand` does not check it and no deal count can fix it; it broadens as the god earns spheres.
3. **Relocation is a lean.** `agent_relocation` writes an intent that tilts encounter scoring and lapses after 36 ticks; nothing moves the agent. The chip says "set on the road", not "is travelling".
4. **The almanac is fiction.** `ambition_great_work` is a builder-civic ambition (survey, draft plans, granary, found or grow a settlement); its chip text "Build a Great Work" is true, but no almanac object is authored. Do not claim one in the batch report.
5. **Hasten's art.** `generic.dark` (darkness plate) sits on a `time` card; `generic.time-slow` is the exact-sphere row. Left to the batch report's taste pass.
6. **Live proof.** Take evidence from a seed sweep plus pinned bands (`?spawn=encounter.town.harvest_almanac&outcome=success` and `&outcome=failure`), and run both `compile:encounter --dry-run` and `check:encounter` (impediments #1111, #1113, #1114).

### Editorial Notes Summary

The editor kept the design and fixed it locally. "Sting Their Pride" failed the imperative-lexicon gate and became **Stoke Their Pride** (`harvest.stoke_their_pride`), with its delta cut from 0.08 to 0.05 so it exactly cancels the Proud variant's -0.05 (a free card brings a Proud reader back to level, never past a neutral one). The opening moved the ask to P3, restated the stake as a fact of the world instead of an "if right, then X" mechanic, and fixed two seam echoes. The success_at_cost overview no longer contradicts the trust chip. Hasten The Signs now carries all six outcome fragments so coverage never depends on the gated card; Stoke gained a success fragment. The relocation chip was recaptioned, and the Hasten effect line was disambiguated (the warnings come early, not the storm).

### Implementation File Map

The package compiles to the encounter module, its structural test and both registrations (`compile:encounter`); do not hand-edit those.

- `Docs/plans/encounters/harvest-almanac.package.json` (new; transcribe from the packet below; the `doc` block carries `plotHookRolled` and `plotHookTaken: hook.natural_disaster`).
- `src/data/content-eval/plotHooks.ts`: stamp `usedBy` for `hook.natural_disaster` at closeout.
- No engine, type, art or UI changes.

---

## Encounter Packet

# Encounter Pipeline: Calling the Harvest
> Scale: short | Slug: harvest-almanac | Pass: revised
> Revisions applied: trait card renamed Sting → Stoke Their Pride (imperative lexicon) and its delta cut 0.08 → 0.05 (net zero with the Proud variant); opening rewritten (ask moved to P3, P3 stake stated as a fact rather than "if right, then X", P1/P2 "days" seam fixed); success_at_cost overview no longer contradicts the trust chip; PATH relocation chip recaptioned; Hasten effect line disambiguated; Hasten gains a success_at_cost fragment and Stoke a success fragment; overview, afterimage and fragment line edits (see editorial)
> Date: 2026-09-30 | Pipeline version: 2.0
> Template: `encounter.town.harvest_almanac` (final) · Batch: expert-everyday-2, slot 5 (THR-1679)
> Systems fixes merged (Pass 3): `deal.count` 4 to 5 (common-option starvation, measured); relocation chip detail "is set on the road there" (travel is a lean); trait-ref, sphere-floor and null-rate claims corrected with measurements. No other mechanic changed.

---

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| **Crux** | A village asks {actor} to name the day its harvest starts, and a storm is coming. |
| **Title** | *Calling the Harvest*: a reader calls the day the village cuts. The glance test gives the objective (call the harvest). The id keeps its brief spelling `harvest_almanac`, The almanac survives only in the concept art: the success ambition is Build a Great Work, and no chip claims an almanac (Pass 3b fold). |
| **id** | `encounter.town.harvest_almanac` (binding, brief row 5) |
| **Shape** | Single Test (brief). One step, one call, one roll. |
| **Reach = theme** | Star 0.64 (`steep`), one step. Star covers fate, navigation and the far pattern. The whole scene is one reading of the sky, and the step is about how far to trust it when the weather disagrees. Mean 0.64, window fit 0.78: expert. |
| **Setting** | `rural` only (brief). One opening. The spine names only the barley and the households, which read honestly at `hamlet`, `farmland` and a `mining` settlement with fields around it. The widest honest envelope is kept; it is not narrowed (Pass 2 ruling). |
| **Whose problem** | The agent's, by construction. The village cuts on their word, so the result is theirs (rolled role **suspect or cause**: the reader is the *cause*). |
| **Why here** | `mission` (the elder asks for a reader) and `chance` (a reader passing through at harvest-time). |
| **Rolled dice** | p3 **opportunity** (a reader who calls it right is wanted all down the valley: something valuable, won at the cost of their name) · opposition **own trait**: stubbornness, read from the graph as **Proud** (`trait.core.core_humility.vice`) and **Judgemental** (`trait.personality.eye.vice`, *"Has already decided, and is only gathering proof."*). A reader holding either finds the stars' day harder to give up. · disposition **friendly** (the village wants them there) · role **suspect or cause** (their word causes the outcome) · scale **personal** (their name, one village's year). |
| **The knot** | The stars say the grain wants a few more days, and the storm may not give them. A reader who trusts only the stars cuts too late; the Proud and Judgemental poles make that easier to do. The opposition is never asserted in base prose (prose rule 7): it lives in trait variants, in a trait-gated card, and in the failure afterimages, which say only what the reader did. |
| **Consequence hand (binding, THR-1145)** | `drive` + `movement`, no swap (confirmed with `npm run draw:consequences -- encounter.town.harvest_almanac --reach star --rarity 2`, weights 8 and 7). |
| `movement` | Success half: `agent_relocation` `$actor` → `{ kind: 'nearest_settlement' }`, `mode: 'travel'`. The nearest settlement has heard and sends for the reader who called it right. The resolver skips distance 0, so the destination is honestly somewhere else. |
| `drive` | Success half: `assign_ambition` **`ambition_great_work`** ("Build a Great Work", `AMBITION_TEMPLATES`, `ambition-templates.ts:880`, `boostingTraits` includes `trait.personality.star.virtue`). A reader who called a village's harvest right means to build something the valley can lean on (its undertakings include `strategic_build_granary`). No shipped encounter assigns it yet, so there is no batch collision with the two ambitions batch 1 used. Failure half: `plant_compulsion` `$actor`, `encounterBias: { assist: 0.5 }`, 72 ticks. The reader who called it wrong helps bring in what is left. `assist` is a member of the closed `EncounterType` union. This deliberately avoids batch 1's two `explore` compulsions. |
| Standing (the expert penalty) | `reputation_with` `targetLocationId: '$here'`: +0.06 on the success half, −0.06 on the failure half. Reputation before money. |
| Rewards block | `assign_ambition` is a `PERSISTENT_EFFECT_KINDS` member, so the success half persists. Note: neither `agent_relocation` nor `plant_compulsion` is in that set; both are chip-backing kinds only. The ambition is what satisfies the Rewards block. |
| Cool failure | Nobody is killed, jailed or branded. The storm takes part of the crop, the village trusts the reader less, and the reader stays to help. Pleasure register: the village never turns on them. The worst band says plainly what the reader's name cost. |
| Systems quota | cast (`elder`) + rewards (`assign_ambition`) + reputation (`reputation_with`) = 3, the floor. Relocation and the compulsion are further connections that the quota does not count. Held at 3 on purpose (Pass 2 ruling): an honest fourth would be a personal condition, which the brief says to avoid, or a seed with no second scene to plant. |
| Trait hooks | **Gate:** none (everyday board, no rule gates per the brief). **Variants:** Proud −0.05 (plus `addNudgeIds` for the trait card), Judgemental −0.04, Humble (`trait.core.core_humility.virtue`) +0.04. **Trait-only nudge:** `harvest.stoke_their_pride`, gated on Proud, cost 0, Δ 0.05. The god turns the flaw into fuel, but only back to level: a Proud reader whose god plays it nets zero against a neutral reader (Pass 2 ruling). **Trait fragment:** carried by the trait card's own band fragments. |
| Mortal choice | None; this is a test. The own-trait opposition acts on the odds, not on a fork (brief override: slot 5's rolled `forks` system is exercised by slot 2). |
| Specials | **Hasten The Signs** (Omen, time, 2 essence) acts on the storm the spine establishes. **Stoke Their Pride** (Trait card, Proud-gated, 0 essence) acts on the opposition the dice rolled. No rider, no Boost special, no over-exposed card, no Heavy Hand, no grants. Deal 5 with `tags: ['lore', 'labor']` (raised from 4 in Pass 3: the dealer counts the sphere-less Stoke as a common option even where it is hidden, which left 6 of 132 god shapes with no ungated common card at count 4; 0 of 132 at count 5). |
| Promise → payoff | P3 states that villages all down the valley send for a reader who gets the call right. The success half's `agent_relocation` pays that promise off (prose rule 7b is backed on the only path that makes the promise true). The storm is paid off in every band. |
| Prose rule 7 / 7b | No agent history is asserted. The elder, the barley, the storm and the stars' reading are scene-local. The only forward claims are the relocation (success half), the ambition and the compulsion, and each chip says only what the effect performs. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief). |
| Motivations | `courage_prudence` (cut early before the storm, or wait for the grain) · `tradition_novelty` (the stars' old reading against the weather in front of them). |

**plotHookRolled:** hook.trial_by_combat, hook.siege_and_hold, hook.natural_disaster
**plotHookTaken:** hook.natural_disaster. The storm is the disaster, kept at village scale and weather speed. The Event Archetypes page's core concept for it is *Hubris vs. Humility*, which is exactly the Proud/Humble opposition the dice rolled. Trial by combat and siege-and-hold fought the brief's "this is the batch's pleasure" register and slot 5's everyday, no-fight constraint.

## 1. Inspiration Anchors

- **Event Archetypes → Natural Disaster (The World Shakes)** (`TheFantasyWorldSimulator/Archetypes/Event Archetypes.md`). The core concept, *"Hubris vs. Humility. We're not in control of this"*, became the whole mechanical spine. The storm does not care what the stars say, and the reader's own pride is the opposition. It changed the encounter by moving the opposition from the weather (which the god can nudge) into the mortal (whom the god can only lean on). The Humble variant and the Proud trait card come straight from it.
- **Thematic Pillars → Compassion vs. Power**. The pleasure register comes from "community, friendship, and growth": a village that asks for someone good and wants them there. On failure the reader stays to help (compulsion `assist`), not to be punished.
- **Anti-Patterns avoided:**
  - **#5 Prophecy as Railroad.** The stars' reading can be wrong. It is one input the reader must weigh, never a fate the encounter enacts.
  - **#6 Grimdark for Shock Value.** Nobody dies, and the worst band is a lost crop and a lost name.
  - **#10 Player as Savior.** The god hastens the signs or stokes a pride. The reader still makes the call, and fate rolls it.
  - **#8 Helpful Exposition NPCs.** The elder asks one question and says nothing else.
- **Structural models:** `drowned-mans-testimony` (the one-step expert shape, success/failure-half effects, the reputation, ambition and compulsion chip forms); `feud-mediation` (a trait-gated zero-essence special unlocked by `addNudgeIds`); `the-sign-over-the-ruin` (the `nearest_settlement` relocation and its PATH chip).
- **Difference from the Comet Disputation (same reach, same tier):** that one is a public argument against a rival institution, with a fork. This one is a private reading for a friendly village, with no rival and no fork. The opposition is inside the reader.
- **Dilemma library:** not consulted. The encounter is not morally charged; the knot is judgement under time, not a moral choice.

## 2. Scale Justification

Short, one beat. The whole encounter is one decision the reader makes and one storm that proves it right or wrong. A second beat (cutting the harvest) would test a different reach and repeat what the bands already say. The expert weight comes from the stake, not the length: a village cuts on one word.

## 3. Pressure Knot

The barley around {location} is nearly ripe. A storm is building in the west and will arrive within days. The stars say the grain wants a few more days to fill. Every household in the village will start cutting on the same morning, because the reapers, carts and threshing floor are shared. The elder asks the best star-reader within reach to name that morning.

## 4. Intervention Fantasy

The god works in the two places the reader cannot reach. The first is the weather, whose warnings the god can bring forward so there is more to read before the call. The second is the reader's own pride, which the god can stoke until they check their reading again just to prove the doubters wrong. The god never names the day. The mortal names it, and fate still rolls whether the storm agrees.

## 5. Cast and World Objects

| Object | What it is | Wiring |
|---|---|---|
| `{cast:elder}`: Mael Harrow (spawn name) | The village elder who asks the reader | `supportBundle` actor, `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['elder']`, `spawnNpcRole: 'elder'`, `supportRole: 'harvest_elder'`. Hamlets roster `elder` at 1.0. Never gendered in prose. Named in the spine and in two overviews. |
| The village | The people of `{location}` | `$here`: the `reputation_with` anchor and the reputation chips' `stateNoun.entityId`. |
| The barley / the harvest | The standing crop | Scene fiction. Named in the spine and overviews only; no chip claims it. |
| The storm | Weather building in the west | Scene fiction. The target the Hasten The Signs special acts on. |
| The stars' reading | The sky says wait a few more days | Scene fiction, stated in the spine. The trait variants act on the reader's hold on it. |
| The nearest settlement | Wherever `nearest_settlement` resolves (distance ≥1, within 12 hexes) | `agent_relocation` destination. The chip names it generically ("the nearest settlement"), because the name is not known at authoring. |
| Ambition | `ambition_great_work`, "Build a Great Work" | `assign_ambition`, success half. |
| Compulsion | `{ assist: 0.5 }`, 72 ticks | `plant_compulsion`, failure half. |

## 6. Beat Structure

1. **Name the harvest day**: star 0.64, `fail_action`, `duration { min: 1, max: 2 }`. The reader reads the stars and the storm and names one morning. The village cuts on it. The storm then proves it right or wrong.
   - `successMetadata` (crit, success, success_at_cost, near_miss): `reputation_with $here +0.06`; `agent_relocation` `$actor` → nearest settlement, travel; `assign_ambition ambition_great_work`.
   - `failureMetadata` (failure, critical_failure): `reputation_with $here −0.06`; `plant_compulsion { assist: 0.5 }`, 72 ticks.
   - `deal: { count: 5, tags: ['lore', 'labor'] }` + 2 specials. The composed hand is 7 for a Proud reader and 6 for everyone else.

## 7. Branching Profile

Linear, no branching. Single Test.

## 8. Branching Map

N/A: linear encounter.

## 9. Outcome Ladder

| Band | Progress made | What was spent | New burden / opening |
|---|---|---|---|
| critical_success | The last cart is in the barn when the storm breaks. The elder brings the whole village out to thank the reader. | Nothing | Town trust up; sent for by the nearest settlement; ambition (Build a Great Work) |
| success | The barley is in before the storm; the last carts come home wet | A wet last load | Same as above |
| success_at_cost | The reader changed the day at the last hour. One field was cut half green, and the rest came in dry. | A field of grain | Same chips; the cost is carried in the overview |
| failure | The storm came first and flattened the south fields. Half the barley is lost. | The reader's name as a reader in this village | Town trust down; a compulsion to help others for a while |
| critical_failure | The storm broke days before the cut. Most of the crop lies flat, and the village has too little grain for the winter. | Their name, plainly: the village staked its year on the best, and the best got it wrong | Same as failure |

Cool failure: nobody dies, is jailed or branded. The penalty is standing before money.

## 10. Sample Opening

> {actor} arrives at {location} at the end of summer.
>
> The barley is nearly ripe. The stars say it needs a few more days to fill, but a storm is building in the west and may not give them.
>
> {cast:elder}, the village elder, asks {actor} to read the sky and name the day the harvest starts. Every household cuts on that one word. Villages all down the valley send for a reader who gets that call right.

`openings.rural` = P1. P2 + P3 is the step's `narrativeTemplate` (the spine). Counts: opening 9 + spine 67 = **76 words** (≤80). The P3 stake is stated as a fact of the world, not as an "if right, then X" mechanic. The success-half relocation backs it.

## 11. The Hand Per Step

### Step 0: Name the harvest day (star 0.64) · `deal: { count: 5, tags: ['lore', 'labor'] }` + 2 specials

| Card | Library type | Sphere | Cost | Δ | Image | Effect line |
|---|---|---|---|---|---|---|
| **Hasten The Signs** `harvest.hasten_the_signs` | Omen | time | 2 essence | 0.12 | `generic.dark` | Make the warnings of a coming change show early, so there is more to read before the choice. |
| **Stoke Their Pride** `harvest.stoke_their_pride` | Trait card (`requiredTrait: 'trait.core.core_humility.vice'`, unlocked by the Proud variant's `addNudgeIds`) | none | 0 essence (the price is being Proud) | 0.05 | `generic.focus` | Make every murmur of doubt rankle, so they go over the work again to prove it right. |

No effect line shares a word with its card's name. Both lines are ≤25 words and contain no digits. Both names open with a verb in `IMPERATIVE_VERB_LEXICON` (`hasten`, `stoke`). Neither card decides the day: one changes what there is to read, the other changes how hard the reader looks.

**Stoke's delta is 0.05 on purpose.** It exactly cancels the Proud variant's −0.05. A free card lets the god bring a Proud reader back to level, never past a neutral one; going beyond level is what Hasten's two essence buys.

**The two answer different questions.** Hasten The Signs asks whether there is enough to read (the world). Stoke Their Pride asks whether the reader will look again (the mortal, and specifically the opposition the dice rolled). The dealt fill brings the plain boost, the rider and sphere breadth. Neither special is a Boost, so the dealer never has to skip a type.

**Band fragments.**

*Hasten The Signs*
- critical_success: "The swallows flew low a day early, and {actor} read the storm in them at once."
- success: "The warnings came a day early, and {actor} had weighed every one before the call."
- success_at_cost: "The warnings came early enough for {actor} to change the day, though not for every field."
- near_miss: "The warnings came early, but they did not agree, and {actor} had to guess between them."
- failure: "The warnings came early, and {actor} took them for a passing shower."
- critical_failure: "The warnings came early and loud, and {actor} named a later day all the same."

*Stoke Their Pride*
- success: "Every murmur sent {actor} back to the sky, and the second reading caught the storm."
- success_at_cost: "{actor} went back to the stars again and again to prove the doubters wrong, and did not sleep."
- failure: "{actor} checked the stars again to prove the doubters wrong, and saw only the day already named."
- critical_failure: "Every murmur made {actor} surer, and {actor} would not hear another word about the storm."

Hasten, the ungated special, covers all six `StepOutcome`s by itself, so coverage never depends on the Proud-gated card. Each special has ≥1 failure-band fragment. Neither is big-delta (<0.15), so no dual-failure obligation applies, though both carry both failure depths anyway. Fragments are ≤25 words.

**Sphere coverage and the common option (measured in Pass 3).** `checkComposedHand` asserts neither; both are dealer preferences. Measured over all 132 primary/secondary sphere pairs with the real starting repertoire: at `deal.count` 4 with Stoke authored, 6 pairs (all drawn from order, chaos, darkness) get no ungated common card in the non-Proud hand, because the dealer counts a sphere-less special as a common option before it knows Stoke is hidden. At `deal.count` 5 that is 0 of 132. The hand tops out at 3 distinct spheres for every starting repertoire at any count (Hasten on `time` plus the god's own primary and secondary), so the 4-sphere preference is unreachable until the god earns more spheres; no gate checks it and raising the count cannot add a sphere. Hasten stays on `time`.

## 12. Linear continuation (afterimages)

- critical_success: *{actor} judged the storm would not wait, and named the next morning.*
- success: *{actor} weighed the stars against the storm, and named a day early enough.*
- success_at_cost: *{actor} named a day, then brought it forward at the last hour.*
- failure: *{actor} held to the stars and named a day too late.*
- critical_failure: *{actor} kept the stars' day, even when the wind turned.*

## 13. Aftermath Paragraph

Fallback overview: *The storm has come and gone over {location}.*

Each band overrides it:

- **critical_success:** *The last cart was in the barn when the storm broke. {cast:elder} brought the whole village out to thank {actor} with the first loaf of the new grain.* (29 words)
- **success:** *The barley was in before the storm, though the last carts came home wet. {location} has its grain for the winter.* (21)
- **success_at_cost:** *The changed day cost the village one field, cut half green. The rest came in dry, and {cast:elder} thanked {actor} all the same.* (23)
- **failure:** *The storm came first. It flattened the south fields, and half the barley is lost. No one in {location} blames {actor} out loud.* (23)
- **critical_failure:** *The storm broke days before the cut. Most of the barley lies flat in the mud, and {location} has too little grain for the winter. The village staked its year on the best reader it could find, and the best reader got it wrong.* (44)

The critical_failure overview states plainly why the loss costs more for someone this good (brief § Cool failure). Every overview is ≤60 words.

## 14. Aftermath Reaction Choices

No reaction choices: the consequence is clean. The scene is short and local, every write fires from step metadata, and the player's decisions were the cards.

## 15. Aftermath Kit Summary

Chips per band, in `scar · bond · boon · path` order. Every chip is backed by a write on that band's metadata half. Each chip sentence (`causeClause` + `detail`) is ≤15 words.

**Success side (critical_success, success, success_at_cost), identical chips:**

| id | Category · noun | Kind | Anchor | causeClause | detail | Backing write |
|---|---|---|---|---|---|---|
| `harvest.<band>.town_trust` | BOND · `reputation with {location}` (gain) | `reputation` | `stateNoun { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`; concept "trusts" → `ui.standing` | none | "{location} trusts {actor}'s reading of the sky." | `reputation_with $here +0.06` |
| `harvest.<band>.sent_for` | PATH · `seed` (opens) | `future_hook` | `stateNoun { text: 'seed', tooltipId: 'ui.aftermath_seed' }`; concept "the nearest settlement" (the `the-sign-over-the-ruin` form) | "Sent for by the nearest settlement" | "{actor} is set on the road there." | `agent_relocation` nearest_settlement |
| `harvest.<band>.ambition` | PATH · `ambition` (opens) | `growth` | `stateNoun { text: 'ambition', tooltipId: 'ui.ambition' }`; concept "Build a Great Work" → `ui.ambition` | "Means to build for the valley" | "{actor} is pursuing Build a Great Work now." | `assign_ambition ambition_great_work` |

**Failure side (failure, critical_failure), identical chips:**

| id | Category · noun | Kind | Anchor | causeClause | detail | Backing write |
|---|---|---|---|---|---|---|
| `harvest.<band>.town_trust` | SCAR · `reputation with {location}` (loss) | `reputation` | same `$here` stateNoun; concept "trusts" → `ui.standing` | none | "{location} trusts {actor}'s reading of the sky less." | `reputation_with $here −0.06` |
| `harvest.<band>.compulsion` | SCAR · `compulsion` | `shell_state` | `stateNoun { text: 'compulsion', tooltipId: 'ui.compulsion' }`; concept "helping others" → `ui.compulsion` | none | "For a while {actor} puts helping others before their own work." | `plant_compulsion { assist: 0.5 }` |

**Fallback:** one growth chip, `harvest.a_call_made`: title "A call made", detail "Naming a harvest day against a storm teaches the star reach.", concept "star reach" → `reach.star`. This follows the drowned-man fallback shape.

**Effect strings (player-adjacent):**
- `assign_ambition.narrativeHook`: "They called the harvest right, and mean to build something the whole valley can lean on."
- `plant_compulsion.narrativeHook`: "They called the harvest wrong, and they mean to help bring in what is left."

**Page read (re-done in Pass 2).** Each band was read as one page (overview → chips → no reactions):

- **critical_success:** the overview carries the thanks and the loaf. The chips add trust, the road to the nearest settlement and the ambition. Thanks and trust are different facts, so nothing is told twice.
- **success:** the overview gives the grain in; the chips give trust, the road and the ambition. Clean.
- **success_at_cost:** the overview states the lost field as a cost and says the elder thanked the reader all the same. The trust chip (a gain) agrees. The draft's "the village will remember the field" contradicted the chip and has been removed.
- **failure:** the overview says half the barley is lost and no one blames {actor} out loud. The SCAR trust chip gives the loss of trust, and the compulsion chip gives the forward beat the overview leaves out. The blocks complement each other and nothing repeats.
- **critical_failure:** "staked its year" does not paraphrase the chip's "trusts … less". Clean.

## 16. Support Bundle Contract

| Support object | Delivery mode | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `elder` (village elder) | lazy-materialize-on-trigger | reuse `elder`, else spawn `elder` "Mael Harrow" | must-persist | named in the spine and in two overviews | ready (hamlet roster seeds `elder` at 1.0; farmland/mining fall back to spawn) |
| Reputation with the village | written at resolution | `reputation_with $here` | must-persist (edge) | the location's standing row | ready |
| Travel intent | written at resolution | `agent_relocation` nearest_settlement | intent TTL (`RELOCATION_INTENT_TTL_TICKS`) | the map; the agent's movement | ready (null-safe when no settlement lies within `RELOCATION_NEAREST_SETTLEMENT_MAX_HEXES` = 12; see Concern 1) |
| Ambition | written at resolution | `ambition_great_work` | must-persist | the actor's sheet | ready (subject to the corpus-wide `no_free_slot` refusal; see Concern 2) |
| Compulsion | written at resolution | `plant_compulsion` | 72 ticks | the actor's decision bias | ready |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Steps and difficulty as brief | PASS | star 0.64, one step; `shaping`, so the 0.45 open-draw cap does not bind |
| Setting envelope with one opening per class | PASS | `rural`, one opening; `mining` kept per the widest-honest-envelope rule (Pass 2 ruling) |
| Opening ≤80 words, skeleton P1/P2/P3 | PASS | 76; the ask is in P3 |
| Cast bound, token keys declared | PASS | `elder` |
| Hand: 2 specials + deal, 4–8 composed | PASS | 7 for Proud, 6 otherwise (deal 5) |
| Every special has a failure fragment; six outcomes covered | PASS | Hasten alone covers all six |
| Zero-essence card legal | PASS | trait card only |
| ≤1 rider per hand | PASS | none authored; the dealer may bring one |
| Sphere coverage ≥4, ≥1 common option | CAVEAT | `checkComposedHand` asserts neither. Measured in Pass 3: common option guaranteed at deal 5 (0 of 132 god shapes without one; 6 of 132 at deal 4); 3 spheres is the ceiling for a starting repertoire (Concern 4) |
| Effect lines: no digits, no name word repeated | PASS | |
| Card names: imperative verb + noun, verb in lexicon | PASS | Hasten, Stoke (both in `IMPERATIVE_VERB_LEXICON`) |
| Over-exposed cards avoided | PASS | no `card.boost.*` special, no Undertow, Kindled Ambition, Heavy Hand, Mercy or Compulsion card |
| Consequence hand wired | PASS | movement → `agent_relocation`; drive → `assign_ambition` + `plant_compulsion`; no swap |
| Rewards persist | PASS | `assign_ambition` |
| Systems quota ≥3 | PASS | cast + rewards + reputation (held at the floor, Pass 2 ruling) |
| byOutcome floor | PASS | all five bands |
| Chip nouns = sheet words | PASS with FLAG | `reputation with {location}`, `ambition`, `compulsion`; the relocation chip uses the corpus's `seed` noun (Concern 5) |
| THR-1685: no person-anchored reputation chip | PASS | the town only |
| Law 56 backing per chip per band | PASS | kit table; see Concerns 1–2 for fail-soft refusals |
| Prose rule 7 / 7b | PASS | the P3 promise is backed by the success-half relocation; no stubbornness is asserted in base prose |
| No personal condition on `$actor`, no rule gate, no death/jail/brand | PASS | |
| Trait refs live | PASS (verified in Pass 3) | Proud, Humble (`core-trait-content.ts`) and Judgemental (`personality-trait-content.ts`, `axisRegistry.ts` Eye vice) are all built definitions. `check:encounter` does not run `validateTraitRefs` (it is a graph-wide `__DEBUG` sweep), so the refs were verified directly. On 9 seeded worlds (6,556 mortals, tick 30) 2.0% hold Proud, 2.1% Humble, 2.7% Judgemental. No variant dropped |
| Detectors | PASS (by read) | no evasive terms; no outcome-class indefinites (`nothing`, `someone`, `anything` avoided in overviews and afterimages); annotation count 0; no divine outcome-authorship |
| Word budgets | PASS | opening 76; overviews ≤44; fragments ≤20; effect lines ≤18; chips ≤13; factor lines ≤12 |

### Concerns for Pass 3 (with Pass 2 rulings)

1. **Relocation can resolve to null.** `nearest_settlement` returns null when no hamlet, town, city, capital or camp lies within `RELOCATION_NEAREST_SETTLEMENT_MAX_HEXES` (12) of the reader, with distance 0 excluded. *Pass 2: accepted as an edge case at a 12-hex radius; `away` would be dishonest to the P3 promise.* **Pass 3 measured it: 0 of 1,589 rural mortals (hamlet 1,506, farmland 66, mining 17) across 9 worlds (small, medium, large; seeds 42, 99, 7; 30 ticks) failed to resolve.** The effect is also only a lean (an intent that tilts encounter scoring and lapses after 36 ticks; nothing moves the agent), so the chip now reads "is set on the road there".
2. **Ambition `no_free_slot`.** This is corpus-wide: about 21% of mature-world actors hold 2 active ambitions. It is shared with every `assign_ambition` encounter.
3. **`rural` includes `mining`.** *Pass 2: keep `rural`.* The spec says to write toward the widest honest envelope, enforced by prose and never by narrowing. The spine names only the barley and the households.
4. **Composed-hand sphere floor.** *Pass 3: resolved by measurement.* `checkComposedHand` does not check spheres or the common option. The common-option starvation was real and is fixed by `deal.count: 5`. The 4-sphere preference is unreachable for a starting repertoire at any count (ceiling 3), is checked by no gate, and broadens as the god earns spheres: accepted. Hasten stays on `time`.
5. **The relocation chip noun is `seed`** with `ui.aftermath_seed`. This follows the-sign-over-the-ruin, the-broken-seal and assize-letter, because no travel or journey tooltip exists. The caption was improved in Pass 2 ("Sent for by the nearest settlement / {actor} is set on the road there", reworded in Pass 3 because travel is only a lean), but the noun is still the weakest cover-the-title read on the page. Noted for the batch report as a corpus-wide UI gap.
6. **Trait variant arithmetic.** *Pass 2: resolved.* Stoke is at 0.05 against Proud's −0.05, which nets zero. A Proud reader never out-rolls a neutral one on a free card.

## 18. Concept Art Direction

- **Emotions:** a whole village trusting one person's word; the weight of a single day; relief, or its absence.
- **Image:** a barn door at dusk with its two leaves open on an empty threshing floor. One bound sheaf hangs from a nail beside it. Beyond the door is gold stubble cut in rows, and behind that a dark bank of cloud low on the western edge of the sky. On a bench by the door lies an open almanac with a single day ringed in charcoal. No people. The image shows the harvest in, or about to be, and never which.

## 19. Package field spec

**Template:**
- `id: 'encounter.town.harvest_almanac'` · `name: 'Calling the Harvest'` · `reach: 'star'` · `rarityTier: 2` · `intrinsicTier: 'shaping'` · `scale: 'local'` · `apCost: 1` · `crudType: 'read'`
- `actorAffinities: ['individual']` · `motivations: ['courage_prudence', 'tradition_novelty']` · `settings: ['rural']` · `openings.rural` as § 10 P1
- `consequenceDraw: ['drive', 'movement']` (no swap)
- `traitVariants`:
  - `{ traitId: 'trait.core.core_humility.vice', forecastDelta: -0.05, factorLine: 'Being Proud, they will not easily take back a day once named.', addNudgeIds: ['harvest.stoke_their_pride'] }`
  - `{ traitId: 'trait.personality.eye.vice', forecastDelta: -0.04, factorLine: 'Being Judgemental, they take every sign as proof of their first reading.' }`
  - `{ traitId: 'trait.core.core_humility.virtue', forecastDelta: 0.04, factorLine: 'Being Humble, they will change the day if the storm says so.' }`
- `narrativeTemplates`:
  - initiation: "A village asks a star-reader to name the day its harvest starts, with a storm coming."
  - success: "The call was right, and the harvest came in before the storm."
  - failure: "The call was wrong, and the storm took part of the harvest."
- `description`: "A one-step Star test for an expert in a village: the elder asks a star-reader to name the day the harvest starts, with a storm coming. A right call raises their standing, sends them on the road to the nearest settlement and gives them the Build a Great Work ambition; a wrong one costs their standing and leaves them helping others for a while. Proud and Judgemental readers find it harder to give up the stars' day."

**Step 0:** `reach: 'star'` · `difficulty: 0.64` · `purposeLine: 'Name the harvest day'` · `duration: { min: 1, max: 2 }` · `failBehavior: 'fail_action'` · `onSuccess: []` · `onFailure: []` · `narrativeTemplate` = § 10 P2 + P3 · afterimages § 12 · `deal: { count: 5, tags: ['lore', 'labor'] }` · `nudges`: the two specials in § 11 (`harvest.hasten_the_signs` Δ 0.12, 2 essence, sphere `time`, `generic.dark`; `harvest.stoke_their_pride` Δ 0.05, 0 essence, `requiredTrait: 'trait.core.core_humility.vice'`, `generic.focus`).

```
successMetadata.effects:
  { kind: 'reputation_with', targetLocationId: '$here', delta: 0.06 }
  { kind: 'agent_relocation', targetAgentId: '$actor', destination: { kind: 'nearest_settlement' }, mode: 'travel' }
  { kind: 'assign_ambition', templateId: 'ambition_great_work', priority: 'secondary', targetAgentId: '$actor', narrativeHook: <§ 15> }
failureMetadata.effects:
  { kind: 'reputation_with', targetLocationId: '$here', delta: -0.06 }
  { kind: 'plant_compulsion', targetAgentId: '$actor', encounterBias: { assist: 0.5 }, durationTicks: 72, narrativeHook: <§ 15> }
```

**supportBundle:** `{ kind: 'actor', key: 'elder', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reuseNpcRoles: ['elder'], supportRole: 'harvest_elder', spawnNpcRole: 'elder', spawnName: 'Mael Harrow' }`

**aftermathConfig:** `branchOnStep: 0` · `variants: {}` · `reactions: []` · `fallback` as § 13 and § 15, with `byOutcome` on all five bands.

## Experience Differentiator Gate

**Scene & Prose**
1. Narrator-mode skeleton, ≤80 words, real graph names, facts stated plainly? **YES.** P1 is the arrival. P2 gives the barley, the stars and the storm. P3 gives the elder's ask and the stake stated as a fact. 76 words, `{actor}` / `{location}` / `{cast:elder}`.
2. Every sentence doing challenge/test/outcome work? **YES.** No sensation, no camera, no weather-for-mood: the storm is the clock.
3. Scene names the elements the hand acts on? **YES.** The storm (Hasten The Signs) and the stars' reading the reader must weigh (Stoke Their Pride; the variants).
4. Could a player retell situation and stakes after one read? **YES.** "Name the harvest day before the storm; the village cuts on it; readers who get it right are sent for down the valley."
4b. No seam echoes? **YES.** P1 no longer repeats P2's "days", and the critical_success afterimage no longer repeats the spine's "storm in the west".

**Choices & Intervention**
5. Every card a spell (verb + noun, 1–2 direct sentences), no flavor quote, no scene prose on the face? **YES.** Both faces are generic: Hasten reads in any weather, siege or tide scene, and Stoke in any scene with doubters. Both verbs are in the lexicon.
6. Every price real and legible? **YES.** Essence 2, or zero on a trait card whose price is being Proud.
7. Every card pays off in failure? **YES.** Both cards have both failure depths.
8. Hand grounded? **YES.** Delete the storm and Hasten is senseless; delete the stars' reading and Stoke has nothing to re-check.
9. Cards answer different questions? **YES.** The world (more to read) against the mortal (looks again).
9b. Every nudge-bearing step fully authored, no branch or ending picked by the player? **YES.** One step, 2 specials + deal 5, no fork.

**Aftermath & Consequence**
10. Aftermath has its own prose? **YES.** Five band overviews plus the fallback.
11. Actor-centred consequences with names and faces? **YES.** {actor}, {cast:elder}, {location}; the ambition by name. The `seed` noun on the relocation chip is flagged (Concern 5).
11b. Each band read as one page, nothing told twice, nothing contradicting? **YES.** See § 15, Page read (re-done in Pass 2).
12. Medium+ reaction choices? **N/A.** Short.
13. Reaction stances differ philosophically? **N/A.**

**Presentation**
14. Concept art evocative, not illustrative (residue, absence, mood)? **YES.** An empty threshing floor, a ringed day and a cloud bank; no people and no outcome shown.

## Branch Seduction Self-Check

N/A: linear encounter. The seduction lives in the hand instead. A god chooses **Hasten The Signs** to buy the reader more truth from the world. A god chooses **Stoke Their Pride** because it turns the reader's worst habit into the reason they check again, and it is free. It brings a Proud reader back to level and no further. It is the one card in the game that only a Proud reader's god is offered.
