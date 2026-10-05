# Encounter Pipeline: The Restless Charnel House
> Scale: medium | Slug: restless-ossuary | Pass: editorial
> Date: 2026-10-05 | Pipeline version: 2.0

Judged against `reference/nudge-authoring-spec.md`: § The communication pivot, § The narrator's checklist, § 3 / 3b, § 4, § 6, § Prose doctrine v2, § Detector spec, and § Consequences rules 0–3. Also judged against the batch brief, slot 8. The fixed mechanics are untouched: veil 0.74 / 0.80 / 0.84, `continue_weakened` · `continue_weakened` · `fail_action`, standing + omen, the `#relic` query prize on step 2, `urban` only, every `forecastDelta`, every essence cost, every effect value, the cast key, and the reaction effects.

## 1. Prose Quality

**Opening.** The skeleton is right. P1 states the arrival. P2 states the fault: the room is full, the dead move, and the sexton has stopped going down. P3 states the ask. There are two defects.

- *"Every guild keeps its dead there, and each wants its own bones kept."* The words *keeps* and *kept* echo each other. The sentence also hides the contest. The room is full, so some bones must leave, and no guild will give up its own. The draft leaves the player to work that out from *"rule which bones move"*. Doctrine v2 says to state the fact, not encode it.
- *"The dean asks {actor} to find out why…"* The word *why* points back two sentences.

`[EDITORIAL REWRITE]`
> {actor} arrives in {location}, sent for by the cathedral's dean.
>
> The charnel house under the cathedral is full, and its dead will not lie still. Bones move at night, and the sexton no longer goes down.
>
> Every guild keeps its dead there, and none will let its own bones be moved. {cast:warden}, warden of the weavers, says theirs are the oldest. The dean asks {actor} to find the cause, lay the dead, and rule which bones go.

That is 77 words across the opening and step 0's spine, inside the budget of 80.

**Step 1 spine.** *"The guilds have sent their people to watch it said over their own dead"* reads clumsily, with two *their*s and a buried *it said*. The line *"will not let them be touched"* also echoes the opening's new *"none will let its own bones be moved"*. `[EDITORIAL REWRITE]`: *"Every guild has sent people to watch over its own dead. {cast:warden} stands guard over the weavers' bones and lets no one touch them."*

**Step 1 afterimages.** The critical_success afterimage reads *"an old relic was lifted from under the weavers' bones"*. That plants the prize one step early. A run that goes critical_success at step 1 and then fails step 2 has told the player the relic came up, and then no PRIZE chip appears. The prize is drawn on step 2, when the bones are carried out, so the relic must surface there. `[EDITORIAL REWRITE]` for step 1: *"The rite was said to the end, and the dead lay still from midnight on. The town took the quiet night as a good sign."* For step 2 critical_success: *"The weavers' oldest dead were carried out first, and a relic was found under them. Not one bone moved after. Every warden, {cast:warden} included, put a hand to the ruling."*

**Seam echoes (4b).** The step 1 spine ends with *"without a break"*. The Ward card's critical_success fragment repeats it (*"the rite went on without a break"*). That is a spine-to-band echo. The fragment also restates what the base critical_success already says. `[EDITORIAL REWRITE]` Ward critical_success: *"The dead stayed behind the line all night, and no watcher left a post."*

**Card faces.** All six verbs are in `IMPERATIVE_VERB_LEXICON` (remember, rouse, ward, slow, seal, stir). Four names carry *The*, and every effect line uses *the*. That breaks the rule that an effect line never repeats a word of the card's name. Two lines also need fixing on their own:
- *Remember Lost Names*: *"…so they can tell whose dead are whose"*. The pronoun *they* could mean the bones or the mortal. → *"Bring back the worn marks on the oldest bones, so each one shows which guild laid it there."*
- *Seal The Verdict*: the effect line used *judgment*, so once the name is fixed it must use *ruling*.

`[EDITORIAL REWRITE]`, names only. The ids, types, spheres, costs, deltas and image tags do not change.

| Draft | Revised |
|---|---|
| Rouse The Restless Dead | **Rouse Restless Dead** |
| Ward The Charnel Door | **Ward Charnel Door** |
| Slow The Long Night | **Delay First Light** (`delay` is in the lexicon). The effect line is reworded to drop *dawn's* clash with the name: *"Stretch the dark hours before morning, so the whole rite is said in darkness."* |
| Seal The Verdict | **Seal Final Judgment**. Effect line: *"Make a ruling sound settled and old, so the wardens stop arguing once it is given."* |

**Band fragments.** These are clean, plain, and in narrator mode. Every one is under 25 words. None uses a natural indefinite.

**Aftermath overviews.** See § 6b. Three of the five bands needed rewrites.

**Factor line.** *"Being a Dangerous Sorcerer, they are not trusted alone with the guilds' dead"* runs 13 words, over the budget of 12. → *"Being a Dangerous Sorcerer, they are not trusted with the guilds' dead."*

**Design note.** The § 4 Intervention Fantasy says *"one night and one morning"*. The beats take two nights (the reading, then the rite) and a morning. Corrected.

## 2. Branch Seduction Audit

The encounter is linear. No step asks the player to pick a branch or an ending, and the mortal's only fork is the aftermath reaction. The reaction pairs are honest stances:
- **Success side.** *Credit the weavers' sacrifice*: the mortal gives the credit away to the guild that lost the most and buys the warden's goodwill. *Name the weavers' refusal*: the mortal tells the town a hard truth, wins the town's regard, and pays with the warden.
- **Failure side.** *Keep watch unasked*: the mortal keeps working with no one asking, and wins back a little of the town's regard. *Blame the weavers' warden*: the mortal puts the fault on the person who stood in the way, and loses the bond.

Each pair trades the town against the warden, which fits a judge's job. Two defects in the draft's failure pair, both fixed:
- *"Say the rite again"* cannot be read on a step 0 critical failure, where the rite was called off before it began.
- *"the weavers' claim undid the ruling"* cannot be read on a step 0 or step 1 critical failure, where no ruling was ever given.

`[EDITORIAL REWRITE]`: **Keep watch unasked**: *"The mortal keeps watch over the bones one more night, without being asked, and the town notices."* **Blame the weavers' warden**: *"The mortal tells the dean the weavers' warden was the trouble from the start, and the warden hears of it."*

On the success side, *"Name the weavers' claim as the cause"* overstated the logic. The guilds' digging and the loose relic were the cause, and the weavers' refusal only stood in the way of the fix. → **Name the weavers' refusal**: *"The mortal tells the town the weavers' refusal nearly kept the dead restless. The town agrees, and the weavers' warden will not forget it."*

## 3. Branch Count Assessment

**KEEP 0** (linear). A test, not a fork, is the right shape for a query prize on a three-step investigation → laying → ruling spine.

## 4. Scale Discipline Check

Medium, with three beats at master rarity. The encounter touches the whole settlement (every guild) and one master's name in it. Reactions are owed and present. The scale holds.

## 5. Inspiration Anchor Honesty

The anchors are honest. *Haunted Relic* gives the cause (a relic loose among disturbed bones) and the prize. *Ritual of Undeath* survives as the dusk-to-dawn rite the dead push against. *Convergence* survives as every guild crowding the one room. The listed anti-patterns (no monster gate, the prize not described in prose, the warden not a villain) are all kept.

## 6. Aftermath Payoff

The aftermath is actor-centred. The town's standing and the weavers' warden are the two faces, and each reaction moves one of them. The prize is engine-named. One design gap is noted for Pass 3 and not fixed here, because the mechanics are fixed: the brief's payoff table says `success_at_cost` should cost something (a condition, a debt, an enemy). In this design, success_at_cost writes the same +0.06 standing as success, and its cost lives only in prose. The revised overview names a concrete cost, the weavers' grudge, but nothing backs it with a write. A reaction (*Name the weavers' refusal*) is the only route to a real bond loss. **Consider** for systems: a `bond_change $cast:warden` loss on the success_at_cost variant.

## 6b. Page read

Each band was assembled as overview → chips → reactions and read as one text.

**critical_success** (draft):
> The dead under the cathedral lie quiet, and every guild has put its hand to the ruling. The dean gives {actor} the relic found under the weavers' bones, in front of all the wardens.
> - BOND · reputation with {location}: "Their ruling held — {location} thinks well of {actor} now."
> - PRIZE
> > Credit the weavers' sacrifice / Name the weavers' claim as the cause

**Repetition.** The chip cause *"Their ruling held"* paraphrases the overview's *"every guild has put its hand to the ruling"*. The chip title *"The Dead Lie Quiet"* repeats *"lie quiet"* word for word. → Drop the cause clause and retitle the chip **Well Regarded**. Detail only: *"{location} thinks well of {actor} now."* The same fix applies to success and success_at_cost.

**success**: clean once the chip is fixed.

**success_at_cost** (draft overview): *"The dead lie quiet, but {location} saw how hard it came. The dean still lets {actor} keep the relic…"* This is verbose, and *how hard it came* hides the cost behind *it*. It is also close to a **conflict**: the town *saw how hard it came*, yet the chip says the town *thinks well* of the master. → *"The dead under the cathedral lie quiet, but the weavers have not forgiven the ruling. The dean still gives {actor} the relic found under their bones."* The cost belongs to the weavers and the regard belongs to the town, so the two blocks now agree.

**failure** (draft):
> The dead under the cathedral are still restless, and the guilds have torn up the ruling. {location} sent for {actor} by name, and will not send again.
> - BOND · reputation with {location}: "Sent for by name, and failed — {location} thinks less of {actor} now."

**Repetition.** *"sent for {actor} by name"* in the overview and *"Sent for by name"* in the chip tell the same fact twice (trigger 35). *"will not send again"* is also a promise about later world behaviour that nothing in the engine enforces (trigger 34). The reputation loss lowers standing, but it does not stop the town's board. → Overview: *"The dead under the cathedral are still restless, and the guilds have torn up the ruling. {actor} was sent for as a master, and every guild watched the work fail."* Chip: no cause clause, title **Found Wanting**, detail *"{location} thinks less of {actor} now."* The overview still says plainly why the failure costs more for a master.

**critical_failure** (draft): *"The dean sent for {actor} to settle the dead. Every guild in {location} now says {actor} made the trouble worse, and a master's failure is remembered longest."*

- **Verbosity.** The first sentence restates the opening.
- **Conflict.** On the step 0 critical-failure route the mortal named the wrong dead and the dean called off the rite. Nothing was *made worse* on that route.
- **Trigger 34.** *"remembered longest"* is an aphorism and a soft promise.

→ *"The dead under the cathedral are still restless, and the dean has sent {actor} away. Every guild says a master should not have failed so badly."* This is true on all three critical-failure routes. Chip: title **Out of Favour**, detail *"{location} thinks less of {actor} now."* Read against the reactions, the draft's *"Say the rite again"* also conflicted with the step 0 route. That is fixed in § 2.

## 7. Dilemma Energy

The tension is genuine. The town needs bones moved, the oldest claim is the one that has to give way, and the dead do not care about claims. The god's hand reaches memory, the dead themselves, the threshold, the night, the weight of a ruling, and old grudges. It never names the bones. Rousing the dead and stirring grudges are real risks with failure faces. Posture is revealed by whether the god plays the sure cards (ward, seal) or the volatile ones (rouse, stir).

## 8. Experience Differentiator Gate

1. **YES.** After revision: arrival, then the fault with its costs already paid (the sexton has stopped going down), then the contest stated plainly. 77 words.
2. **YES.** Every sentence carries challenge, test or outcome. There is no camera work.
3. **YES.** The bones, the marks, the stacks, the threshold, the night, the wardens and {cast:warden} are all named in the spines before the cards act on them.
4. **YES.** The player can retell it: "The town's dead won't rest; find the cause, lay them, and rule which guild's bones leave."
4b. **YES, after revision.** The seam echoes fixed: *kept/keeps* in the opening, *will not let… be* from the opening into step 1, and *without a break* from the step 1 spine into the Ward fragment.
5. **YES.** Six spell-style faces with no flavour quote. After the renames no name word repeats in its effect line.
6. **YES.** Each line states its mechanism. Every card is priced in essence.
7. **YES.** Every special has at least one failure-band fragment. No card is big-delta.
8. **YES.** Every card's target is set in prose before the hand is dealt.
9. **YES.** The cards ask different questions: memory against provocation, threshold against time, finality against isolation.
9b. **YES.** Each step is 2 specials plus `deal` 3, a composed hand of 5. No branch pick.
10. **YES.** Every band has an overview.
11. **YES.** The town and the weavers' warden are the faces. The chip noun is `reputation with {location}`, the sanctioned sheet word.
11b. **YES, after revision.** See § 6b. The draft failed on failure (repetition) and critical_failure (conflict, padding). Both are fixed in the revised file.
12. **YES.** Two reactions per side.
13. **YES.** Generosity against hard truth; persistence against blame.
14. **YES.** The art direction shows residue: a bone shuttle on swept flags and a pale square where a stack leaned. No people and no action.

## 9. Verdict

**PASS WITH REVISIONS**, applied in `restless-ossuary-revised.md`. Every trigger that fired was text-level: 35 (failure and critical_failure pages), 34 (*will not send again*, *remembered longest*), and 22 (three seam echoes). Following the `well-sinking` / `comet-disputation` / `wolf-winter-watch` precedent, triggers that are fixed in the same pass do not stop the line. No step, reach, difficulty, delta, cost, card id, type, sphere, cast key, effect or reward recipe changed.

## 10. Revision Summary

**Must fix (applied)**
- Failure and critical_failure pages: removed the repeated *sent for by name*, removed the promises *will not send again* and *remembered longest*, and rewrote the critical_failure overview so it is true on every route.
- Step 1 critical_success no longer lifts the relic. The relic surfaces at step 2, where the prize is drawn.
- Chip titles and cause clauses no longer repeat their overviews (**Well Regarded / Found Wanting / Out of Favour**, detail only).
- Card names no longer share a word with their effect lines (four renames, two effect lines reworded).
- The failure-side reactions now read correctly on the step 0 and step 1 critical-failure routes.

**Should fix (applied)**
- The opening states the contest plainly and loses the *keeps/kept* echo (77 words).
- The step 1 spine's clumsy watch sentence, and the *without a break* echo in the Ward fragment.
- The success_at_cost overview names the cost (the weavers' grudge) instead of *how hard it came*.
- The second trait factor line is cut to 12 words.

**Consider (Pass 3, not applied, since the mechanics are fixed)**
- success_at_cost carries no written cost (see § 6). A `bond_change $cast:warden` loss on that variant would make the brief's payoff row true.
- The `critical_failure` carryover lines (step 1 keyed on step 0, step 2 keyed on step 1) cannot be reached, because a critical failure ends the action. Keep them only if the schema requires all six.
- Confirm that the `stateNoun` `reputation with {location}` renders resolved on the tag. The spec says `stateNoun` is not enriched, and the brief notes THR-1685.
