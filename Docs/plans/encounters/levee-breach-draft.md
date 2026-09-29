# Encounter Pipeline: The Levee Breach
> Scale: medium (3 steps, `scale: 'local'`) | Slug: levee-breach | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Batch: journeyman-everyday-2, slot 2 (THR-1677) · templateId `encounter.town.levee_breach`
> Package: `Docs/plans/encounters/levee-breach.package.json` (`compile:encounter --dry-run` exits 0; stamped hand `['thread', 'place']`)

## 1. Inspiration Anchors

- **Plot hooks rolled:** `hook.ritual_of_undeath`, `hook.endless_pursuit`, `hook.heresy_hunt`.
- **Taken: `hook.heresy_hunt`**, with no religion in it. What is left is the hunt for someone to blame: the warden names the culprit (the evening watch) before anyone has looked for the fault, and the mortal has to find the real fault to answer the charge. It is blended with `endless_pursuit` for the night-long chase after the water along the bank. `ritual_of_undeath` was dropped because it pulls the scene off the everyday board the brief confines it to.
- **Seed Dice honoured:** P3 choice (banking the mill saves the houses and leaves the far bank and its fields unwatched). Opposition is `faction (orders)`, read as the levee warden's orders: a town office, not a faction node (brief § Overrides). Disposition is hostile: the warden blames the mortal. Agent role is suspect or cause: the mortal stood the evening watch on the bank that is seeping. Scale is settlement: the town's harvest and its houses.
- **Anti-patterns avoided:** a flood scene the agent watches (the agent hauls, searches and holds at every step); weather written as atmosphere (the river is stated as a height and a leak); a failure that drowns or jails anyone.

## 2. Scale Justification

Three steps, medium. The shape is investigation → resolution, and it needs three beats: the ordered work at the mill (the warden's theory), the search along the far bank (the real fault), and the stand in the breach (the resolution). Each beat inherits the last one's band through carryover lines. The stakes are journeyman stakes: the town's harvest and the mortal's name in it. Rarity 2, local.

## 3. Pressure Knot

The river is at the top of the levee after rain upstream. Water is seeping through below the mill. The mortal stood the evening watch on that bank and went home at the change. The levee warden has already decided whose fault the seep is, and has put every hand on the mill bank. Nobody is watching the far bank, and the fields under it are a month from harvest.

## 4. Intervention Fantasy

The god works on the things a night on a levee depends on. The wet sacking keeps its shape. Running water catches the lantern so a leak shows. The current leans a little less on the stack. The night passes quicker for tired people. The mortal still hauls, searches and holds, and fate rolls. The god's hand shows in failure too: the bags keep their shape and the water comes under them, and every puddle on the bank shines the same as the leak.

## 5. Cast and World Objects

- **`{cast:warden}`**: the levee warden (spawn `Hale Brannock`, role `elder`; reuse `elder` / `guard_captain` / `guard`, which the hamlet and town rosters both seed; must-persist). The one named person on all three beats. Hostile: blames the mortal, orders them onto the line, and threatens to tell the town who ran. Never gendered in prose.
- **The mill bank, the far bank, the sandbag line, the breach** (scene-local, prose only). None is a chip referent.
- **`$here`**: the town. Carries `trait.condition.location.harvest_blight` on the failure side and the `reputation_with` edge both ways.
- **The thread** `$ascendant` ↔ `$actor`, strengthened or weakened on the final step.
- **Reputation channel**: `reputation_with` on `$here`, ±0.06 on the final step, +0.03 on one reaction.

## 6. Beat Structure

| Step | Reach · difficulty | Purpose | failBehavior |
|---|---|---|---|
| 0 | iron 0.42 | Haul the sandbags | continue_weakened |
| 1 | eye 0.40 | Find the washout (carryover on step 0) | continue_weakened |
| 2 | iron 0.45 | Hold the breach (carryover on step 1) | fail_action |

Mean 0.423. Iron by two steps to one. `background` tier, every step at or under 0.45.

## 7. Branching Profile

Linear, no branching. Carryover lines carry each step's result into the next.

## 8. Branching Map

N/A, linear encounter.

## 9. Outcome Ladder

- **critical_success**: the river falls at dawn with the far bank whole, and a new bank is built behind the breach. The warden tells the town whose work saved the harvest. Thread up, the town's regard up.
- **success**: the far bank holds until the river falls; the fields will be cut at harvest. Thread up, the town's regard up (the blame is lifted).
- **success_at_cost**: the breach holds, but the field at its foot goes under with its crop. Thread up, the town's regard up.
- **failure**: the breach opens before dawn and the river has the fields by morning. The town goes short this winter (`harvest_blight` on `$here`). Thread down, the town's regard down.
- **critical_failure**: the far bank tears open in the night and the river takes every field below it; the warden says it was the mortal's watch. Same writes as failure, told harder.

Cool failure throughout: money, food, standing and a night's bruises. Nobody drowns and nobody is jailed.

## 10. Sample Opening (narrator mode, ≤80 words with the step-0 spine)

**Urban.** {actor} is woken in {location} after midnight by the bell on the river gate.

**Rural.** {actor} is woken at {location} after midnight by shouting from the river bank.

**Spine (step 0).** The river is at the top of the levee, and water is seeping through below the mill. {actor} stood the evening watch on that bank. {cast:warden}, the levee warden, blames {actor} for missing the seep and orders them onto the sandbag line. Banking the mill will save the houses. It leaves the far bank unwatched, with the fields below it a month from harvest.

(78 words urban, 77 rural.)

## 11. The Hand Per Step

Every step authors specials and a `deal` fill. The over-exposed list is respected: no special is a core Boost, an energy signature, darkness undertow, mercy, mind compulsion, spirit kindled ambition or force heavy hand. No rider, no cost channel and no grant on any special.

- **Step 0** (deal 4: `might`, `labor`)
  - *Boost-type special, matter.* **Firm The Sacking** (2 essence, +0.10). "Stiffen wet cloth and sand, so each bag sits where it is laid and does not slump." Fragments: success, failure.
- **Step 1** (deal 4: `insight`, `peril`)
  - *Boost-type special, light.* **Silver The Leak** (2, +0.12). "Make running water catch the lantern's glow, so a seep stands out against the still river." Fragments: critical_success, success, failure.
- **Step 2** (deal 3: `might`, `peril`)
  - *Boost-type special, force.* **Brace The Wall** (2, +0.12). "Lean against the current where it strikes the stack, so the sacks take less of its weight." Fragments: success, failure, critical_failure.
  - *Long Game-type special, time.* **Hasten The Dawn** (2, +0.10). "Make the night pass quicker for the people on the bank, so the river falls before their strength does." Fragments: success_at_cost, near_miss, failure.

No card's effect line shares a word with its name. No digits, no odds-talk. The two step-2 specials buy different certainties (the wall's load against the night's length).

Fragments, verbatim:

- Firm The Sacking: success "The bags sat square on the bank and did not slump as they soaked." · failure "The bags kept their shape, and the water came in under the bottom row."
- Silver The Leak: critical_success "The leak shone in the lantern, and so did a thin line of water running back under the bank." · success "Water running out of the far bank caught the lantern and shone." · failure "Every puddle on the bank shone alike, and the leak shone with them."
- Brace The Wall: success "The current struck the stack and slid off it, and the sacks stayed put." · failure "The current eased against the stack, and came round the end of it instead." · critical_failure "The stack stood, and the river tore out the bank beside it."
- Hasten The Dawn: success_at_cost "The night went quickly, and the river fell an hour after the first field went under." · near_miss "Morning came early, and the river was slow to follow it." · failure "The night went quickly, and the men tired just as fast."

## 12. Linear continuation

Step 1: The mill bank holds, but water is still rising in the lowest houses. It is coming through somewhere on the far bank. {actor} leaves the sandbag line to walk it in the dark. {cast:warden} shouts that anyone who leaves the line will answer for it, and that the town will hear who ran.

Step 2: The water has cut into the far bank above the fields. {cast:warden} brings the men over. {actor} stands in the water to the waist, holding the bags while the others stack behind. The breach must hold until dawn, when the river starts to fall. If it goes, the harvest goes, and {location} will blame {actor}.

Carryover lines (step 1 on step 0's band): crit "There are bags to spare for the far bank." · success "The mill bank holds without them." · at cost "Their back is torn from the hauling." · near miss "The mill bank is still seeping a little." · failure "The mill bank is still seeping, and the men are tired." · crit fail "The warden saw their wall slide into the river."

Carryover lines (step 2 on step 1's band): crit "They know where the water is going, and why." · success "They found the washout before it opened." · at cost "They lost the lantern in the ditch." · near miss "They found the washout late." · failure "The water found the washout before they did." · crit fail "The warden's men were banking the wrong stretch."

Afterimages, verbatim:

| Step | crit success | success | at cost | failure | crit failure |
|---|---|---|---|---|---|
| 0 | They banked the mill in an hour, with bags to spare for the far bank. | They carried bags until the seep below the mill stopped. | The seep below the mill stopped, and they tore their back hauling the last of the bags. | They carried bags all night, and the mill bank was still seeping at the change of watch. | A wall of bags they set slid into the river, and the warden saw it go. |
| 1 | They found the washout, and the old drain under the bank that the water is following. | They found where the far bank is washing out from beneath, above the fields. | They found the washout, and slid into the ditch below it and lost the lantern. | They walked the far bank twice and found nothing before the water found it. | They sent the warden's men to the wrong stretch, and the far bank went on washing out. |
| 2 | The breach held, and by dawn the warden's men had a new bank built behind it. | The bags held until the river fell, and the fields below stayed dry. | The breach held until dawn, and the one field at its foot went under. | The breach opened wider before dawn, and the river went over the fields. | The breach tore open in the night, and the river took every field below it. |

## 13. Aftermath Paragraph

Fallback: "The river is falling, and {location} has counted what the night cost." Each band overrides it with its own overview:

- critical_success: "The river fell at dawn with the far bank whole. {cast:warden} told {location} whose work had saved the harvest."
- success: "The far bank held until the river fell. The fields below it will be cut at harvest."
- success_at_cost: "The breach held until dawn, but the field at its foot went under, and its crop with it."
- failure: "The breach opened before dawn. {cast:warden} and the men fell back to the mill, and by morning the river had the fields."
- critical_failure: "The far bank tore open in the night. The river took every field below it, and {cast:warden} says it was {actor}'s watch that missed it."

## 14. Aftermath Reaction Choices

Two stances on the fallback, inherited by every band:
- **Stay on to rebuild the far bank**: be seen working past the watch. `reputation_with` `$here` +0.03.
- **Walk the levee again at first light**: keep what the night showed about the bank, whatever the town makes of the watch. `intelligence` (`cultural_knowledge`, "The Levee's Weak Place").

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) | Backing write |
|---|---|---|
| critical_success | BOND · thread ("Held the breach with the god close — The thread to {actor} runs stronger."); BOND · reputation with {location} ("Stood in the breach all night — {location} thinks well of {actor} now.") | step 2 success: `thread_strengthen`, `reputation_with $here +0.06` |
| success | BOND · thread; BOND · reputation with {location} | same |
| success_at_cost | BOND · thread | same |
| failure | SCAR · Blighted Harvest ("The fields were under water for days — {location} will go short this winter."); SCAR · reputation with {location}; SCAR · thread | step 2 failure: `apply_condition harvest_blight $here`, `reputation_with $here −0.06`, `thread_weaken` |
| critical_failure | SCAR · Blighted Harvest; SCAR · reputation with {location}; SCAR · thread | same |

Every chip sentence (cause + detail) is 12–14 words. The fallback also carries the reach-growth line ("A night hauling and holding a bank teaches the iron reach.").

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| warden (`elder`) | lazy-materialize-on-trigger | reuse elder / guard_captain / guard, else spawn `Hale Brannock` | must-persist | named in step prose and two overviews | declared |
| `trait.condition.location.harvest_blight` on `$here` | aftermath effect | existing condition (`src/data/condition-trait-content.ts`) | 240 ticks | movement tax and target gates read it | resolves |
| `reputation_with` edge to `$here` | aftermath effect | existing kind | must-persist | reputation readers | resolves |

## 17. Self-Audit

- Composition Contract: **PASS expected**. Steps 3, each plain. Cast: `warden` declared. Rewards: persistent condition on the failure side. Aftermath: all five bands, every change anchored by a `stateNoun`. Systems: cast + conditions + reputation. Not yet run through `check:encounter` (it needs the compiled template; the dry-run only).
- Consequence hand `thread` + `place`: **PASS**. The dry-run's generated test stamps `['thread', 'place']`. Thread on both sides of the final step; place on the failure side.
- Six StepOutcomes covered across fragments plus the dealt fill: **PASS expected** (the dealer fills every step).
- Prose rule 7 (no invented game state): **FLAG, low**. "{actor} stood the evening watch on that bank" asserts a fact about the agent. It is tonight's scene-local roster, with no life outside the encounter, but a critic may read it as agent history.
- Chip nouns are sheet words (`thread`, `reputation with {location}`, `Blighted Harvest` — the condition's own name): **PASS**.
- **FLAG (design):** the place family fires only on the failure side. No existing location condition fits "the levee held", and `festival` would be a stretch (batch 1 already spent it). If the critic wants both sides, `festival` on critical success is the only candidate.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (mill, far bank, fields, sandbag line, warden all in step 0) · 4 YES · 5 YES · 6 YES (essence on all four) · 7 YES · 8 YES (sacking, leak, stack, night on the bank) · 9 YES · 9b YES · 10 YES · 11 YES (the warden named, the town named) · 11b YES · 12 YES (two reactions) · 13 YES (standing vs knowledge) · 14 YES (below).

**Concept art direction.** Emotions: blame laid before the facts, a harvest riding on one night, exhaustion. Image: a sandbag wall at grey dawn on a levee top, one lantern on its side in the mud at the foot of it, and flat brown water on the far side reaching to a line of standing wheat. No people.

## Critic revisions (Passes 2 / 3 / 3b, 2026-09-29)

Applied to `levee-breach.package.json`, which is authoritative. Where the prose in §§10–15 above differs, the package wins. Verdicts: editorial **PASS WITH REVISIONS** · systems **READY FOR IMPLEMENTATION** · package **connected / PACKAGE PASS**. The scratch `check:encounter` is clean with 0 warnings, and `compile:encounter --dry-run` exits 0.

- **Invented state (trigger 31), step-0 spine.** "{actor} stood the evening watch on that bank" → "{cast:warden}, the levee warden, says {actor} stood the evening watch on that bank and missed the seep." The narrator now reports the warden's accusation rather than stating the agent's history, and the charge can be false (the heresy-hunt shape). The opening is 78 words urban and 77 rural.
- **Step-1 spine.** "The mill bank holds, but water is still rising in the lowest houses" asserted step 0's band and put the far-bank water in the houses. → "Water is spreading across the lowest fields, and it is not coming from the mill bank."
- **Step-2 spine.** The seam with the step-1 afterimage was removed: → "The water breaks through the bank late in the night. {cast:warden} brings the men over from the mill. {actor} stands in the breach up to the waist…"
- **Card faces made generic (trigger 16), with lexicon verbs.**
  - Firm The Sacking → **Stiffen The Load**
  - Silver The Leak → **Show The Leak**
  - Brace The Wall → **Bolster The Wall**
  - Hasten The Dawn keeps its name.

  All four effect lines were rewritten scene-neutral, and the ids were renamed to match.
- **Hasten The Dawn's type.** It is a **Boost** (time), not a Long Game: a Long Game plants a hidden mark, this card grants nothing, and the brief forbids card grants. Its image tag moves from `generic.focus` (the mind plate) to `generic.time-slow`.
- **Fragment seams.**
  - Show The Leak, critical success: "…the trickle feeding it from further along"
  - Show The Leak, success: "Water running out of the earth…"
  - Bolster The Wall, critical failure: "…and the bank gave way beside it"
  - Hasten The Dawn, success at cost: "…the river was falling within the hour"
- **Step-2 critical-success afterimage.** "a new bank built behind it" → "a second wall of sacks built behind it" (it no longer conflicts with the "rebuild the far bank" reaction).
- **Overviews rewritten for the page read (trigger 35) and the seams (trigger 22).**
  - Critical success: the warden takes back the charge in public.
  - Success: the warden drops the charge.
  - Success at cost: the mortal comes off the levee at noon. The old overview was false on the paths where step 2 succeeded cleanly.
  - Failure: fall back to the mill bank, and the far bank is left to the river.
  - Critical failure: the warden tells the town at dawn that it was {actor}'s watch.
  - Fallback: "…counting sacks and fields". The old "what the night cost" was evasive.
- **Chip causes de-duplicated against their overviews.** The success at cost band gains a `BOND · reputation with {location}` chip, backing the `+0.06` that step 2 already writes on every success-at-cost path.
- **Description.** "really" was removed (intensifier warning).
- **The place family on the failure side only.** Judged acceptable (systems §6). No honest location condition exists for "the levee held", and the success side still moves the town's standing.
