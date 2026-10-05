# Encounter Pipeline: The Restless Charnel House
> Scale: medium | Slug: restless-ossuary | Pass: draft
> Date: 2026-10-05 | Pipeline version: 2.0
> Template: `encounter.town.restless_ossuary` · Batch: master-everyday, slot 8 (THR-1688) · Brief: `Docs/plans/encounters/master-everyday-brief.md`

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | The dead under the town's cathedral will not lie still, and every guild wants its own bones kept there. |
| Title | **The Restless Charnel House** — the complication in the title. |
| Shape | Query prize on a three-step Puzzle – Investigation – Resolution spine. veil 0.74 (`continue_weakened`) → veil 0.80 (`continue_weakened`) → veil 0.84 (`fail_action`). Linear, branch count 0. Mean 0.793, window fit 0.933 (master band). |
| Setting | `urban` only (rolled `arcane` overridden in the brief: the arcane place survives as the charnel house under the cathedral). |
| Stake (P3) | contest (rolled): every guild wants the same room for its own dead. |
| Opposition | terrain (indifference), read as the dead's indifference to the living's claims: they lie quiet only if the right bones move. |
| Agent role | judge asked to rule (rolled): the dean asks the master to rule which bones move. |
| Scale | settlement — every guild in the town. `scale: 'local'`. |
| System target | favors (rolled, advisory) — not taken; the standing edge and the reaction bonds carry the people. |
| Plot hook | rolled `hook.haunted_relic`, `hook.the_convergence`, `hook.ritual_of_undeath` · **taken `hook.haunted_relic`** — an old relic buried with the weavers' first dead is why they will not rest; the prize is that relic, drawn by tag. |
| Consequence hand (binding) | `standing` + `omen`. standing = `reputation_with $here` (+0.06 on step 2 success, −0.06 on step 2 failure, −0.02 on step 0 and step 1 failure). omen = `emit_omen` (cultural, global) on **both sides of step 1** (the laying): a good sign if the dead lie still (`spirit`), a bad one if the rite breaks (`entropy`). No swap. |
| Query prize | step 2 `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#relic'] }` — the relic lifted from under the weavers' bones, which no guild will claim. `#relic`: item 14 bearers. |
| Standing chips | `reputation with {location}` gain on the three success bands, loss on failure and critical failure. The −0.02 on steps 0 and 1 backs the critical_failure chip on every route (a critical failure at any step ends the action). |
| Omen chip | None. An omen is dressing, not held state; there is no omen anchor in the catalog. The sign is told in the step-1 afterimages. |
| Cast | `warden` — {cast:warden}, warden of the weavers' guild, must-persist, reuse/spawn `merchant`. The dean and the sexton are role nouns. |
| Systems | cast · rewards · reputation = 3 (the floor). |
| Mortal choice | None in the steps — this is a test. The choice lives in the aftermath reactions (credit the weavers, or name their claim as the cause). |
| Cool failure | Nobody dies, nobody is jailed or branded. Failure is the town's regard: a master is sent for by name, and a town that has seen a master fail does not send again. |
| Cost channels | All specials priced in essence. No Heavy Hand, no rider, no Undertow. |
| Not colliding | The two veil experts: *The Drowned Man's Will* (call up a drowned man to testify) and *The Widow's Dream*. This one lays the dead and judges between the living; no card questions the dead. |

## 1. Inspiration Anchors

- **Adventure & Quest — The Haunted Relic Recovery** (taken hook): the thing worth carrying out sits under the thing that will not let anyone near it. Contributed the cause and the prize: an old relic buried with the weavers' first dead keeps them restless, and the dean gives it to the master if the ruling holds.
- **Event — The Ritual of Undeath** (rolled, not taken): survives only as the rite of laying — a rite said from dusk to dawn that the dead push back against.
- **Event — The Convergence** (rolled, not taken): survives as the guilds all arriving at once at the same full room.
- Anti-patterns avoided: the undead fight (no monster gate on an everyday board), the prize described in prose (it is drawn by tag and named by the engine), the guild warden as a villain (the weavers' claim is old and honest; it is just wrong for the dead).

## 2. Scale Justification

Medium: three beats (read, lay, rule) at master rarity. The outcome touches every guild in a town and one master's name in it, which is what a master's everyday job should risk. Medium means reaction choices are owed.

## 3. Pressure Knot

The charnel house under the cathedral is full. Last winter the guilds dug among the oldest stacks to make room for new burials, and since then the dead have moved at night. The sexton will not go down. Each guild wants its own dead left where they are, and the weavers, whose dead are the oldest, refuse loudest. The dean has sent for a master.

## 4. Intervention Fantasy

The god watches a master of the unseen settle the dead and the living in one night and one morning. The hand reaches into memory (the worn guild marks on the first bones), the dead themselves (stirred harder so the cause shows), a line at the threshold, the length of the night, the weight of a judgment, and the old quarrels between guilds. None of it tells the master which bones to name.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | the mortal | protagonist, sent for by the dean |
| `{cast:warden}` | actor, must-persist | warden of the weavers' guild; reuse/spawn `merchant`; spawnName **Orrin Vasse**; never gendered in prose |
| the dean | role noun | sent for the master; gives the relic if the ruling holds |
| the sexton | role noun | keeps the charnel house; will not go down |
| `{location}` (`$here`) | location | the town; carries the standing edge |
| the charnel house | scene fiction | under the cathedral; the bones are stacked by guild |
| the relic | `possession` drawn by `#relic` | engine-named; lifted from under the weavers' first dead |
| the omen | `emit_omen`, global, cultural | the town's reading of the night of the laying |

## 6. Beat Structure

1. **Read the restless dead** (veil 0.74, `continue_weakened`). Which dead move, and why. The reveal (the weavers' oldest dead, disturbed when the guilds dug to make room, an old relic loose among them) lives behind the bands.
2. **Lay the dead** (veil 0.80, `continue_weakened`). The rite of laying, dusk to dawn, without a break, with every guild watching its own dead. The omen fires on both sides.
3. **Rule between the guilds** (veil 0.84, `fail_action`). The wardens meet at first light. The bones named are carried to new ground. The dead stay quiet only if the right bones move. The prize and the main standing write.

## 7. Branching Profile

Linear — no branching. Branch count 0. The choice lives in the aftermath reactions.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | The dead lie quiet; every warden signs the ruling. | Nothing beyond the night. | The relic (prize); the town thinks well of the master. |
| success | The dead lie quiet; the ruling stands. | The night's work. | The relic; the town thinks well of the master. |
| success_at_cost | The dead lie quiet, but the town saw how hard it came. | The town saw the strain. | The relic; the town still thinks well of the master. |
| failure | The dead are still restless; the wardens tear up the ruling. | The master's name in the town. | The town thinks less of the master and will not send again. |
| critical_failure | The dean and every guild say the master made it worse. | The master's name, loudly. | The town thinks less of the master. |

## 10. Sample Opening

> {actor} arrives in {location}, sent for by the cathedral's dean.
>
> The charnel house under the cathedral is full, and the dead in it will not lie still. Bones move in the night, and the sexton no longer goes down.
>
> Every guild keeps its dead there, and each wants its own bones kept. {cast:warden}, warden of the weavers, says theirs are the oldest. The dean asks {actor} to find out why, lay the dead, and rule which bones move.

(78 words across the opening and step 0's spine.)

`openings.urban`: `{actor} arrives in {location}, sent for by the cathedral's dean.`

Step 0 `narrativeTemplate`: `The charnel house under the cathedral is full, and the dead in it will not lie still. Bones move in the night, and the sexton no longer goes down.\n\nEvery guild keeps its dead there, and each wants its own bones kept. {cast:warden}, warden of the weavers, says theirs are the oldest. The dean asks {actor} to find out why, lay the dead, and rule which bones move.`

## 11. The Hand Per Step

Every step: two authored specials (`ossuary.*`) plus a declared `deal` fill of 3 → composed hand of 5.

### Step 0 — Read the restless dead (veil 0.74)

- `purposeLine`: **Read the restless dead**
- `deal`: `{ count: 3, tags: ['lore', 'insight'] }`
- Afterimages:
  - critical_success: "They found the cause by midnight. The weavers' first dead were dug up to make room, and an old relic buried with them was left loose."
  - success: "They traced the trouble to the weavers' oldest dead, dug up last winter to make room for new burials."
  - success_at_cost: "They traced the trouble to the weavers' oldest dead, but {cast:warden} saw them handle the weavers' bones and called it an insult."
  - failure: "They watched the bones until dawn and could not say why they moved. They will have to lay the dead without knowing."
  - critical_failure: "They named the wrong dead as restless. The dean lost faith in them and called off the rite."
- `failureMetadata`: `reputation_with $here −0.02`.

**Special 1 — Remember Lost Names** (Boost, memory) · `mind` · essence 2 · Δ 0.10 · `generic.memory`
- effectLine: "Bring back the marks worn off the first bones laid there, so they can tell whose dead are whose."
- critical_success: "{actor} read the worn guild marks on the oldest skulls and went straight to the weavers' dead."
- success: "The worn marks on the oldest bones came clear enough to read, and they were the weavers'."
- near_miss: "The marks came clear only near dawn, after a night spent on the wrong stacks."
- failure: "The worn marks came back, and showed that three guilds had stacked their dead together."

**Special 2 — Rouse The Restless Dead** (Gambit-flavoured Boost) · `spirit` · essence 2 · Δ 0.08 · `generic.blessing`
- effectLine: "Stir the uneasy bones harder for one night, so the cause of their trouble shows plainly."
- success: "The bones shifted hardest over one place in the weavers' stacks, and {actor} dug there."
- success_at_cost: "The bones moved hard enough to fall, and {cast:warden} saw weavers' skulls on the floor."
- failure: "The bones moved all through the charnel house at once, and showed no single cause."
- critical_failure: "A whole stack fell into the passage, and the sexton ran to wake the dean."

### Step 1 — Lay the dead (veil 0.80)

- `narrativeTemplate`: "The rite of laying must be said over the restless bones from dusk until dawn without a break. Each time it stops, the bones move again. The guilds have sent their people to watch it said over their own dead. {cast:warden} stands over the weavers' bones and will not let them be touched."
- `purposeLine`: **Lay the dead**
- `deal`: `{ count: 3, tags: ['lore', 'peril'] }`
- Afterimages:
  - critical_success: "The rite was said to the end, and an old relic was lifted from under the weavers' bones. The dead lay still, and the town took the quiet night as a good sign."
  - success: "The rite held until dawn, and the dead lay still. The town took the quiet night as a good sign for the year."
  - success_at_cost: "The dead lay still by dawn, but the rite broke twice, and the watching guilds saw the bones move each time. The town still took the quiet dawn as a good sign."
  - failure: "The rite broke before dawn, and the bones moved again in front of every guild. The town took the night as a bad sign."
  - critical_failure: "The rite broke at midnight, and bones fell from the stacks into the passage. The guilds carried the story through the town as a bad sign."
- Carryover lines (into step 1, keyed on step 0):
  - critical_success (for, +0.06): "They know which bones are restless, and why."
  - success (for, +0.04): "They know which dead are restless."
  - success_at_cost (against, −0.02): "{cast:warden} is angry that they touched the weavers' bones."
  - near_miss (against, −0.03): "They found the restless dead only near dawn."
  - failure (against, −0.05): "They do not know why the dead are restless."
  - critical_failure (against, −0.07): "The dean no longer trusts their reading."
- `successMetadata`: `emit_omen` cultural 0.3 global `spirit`, hook "The dead under a town's cathedral were laid in one night, and the town took the quiet for a good year."
- `failureMetadata`: `emit_omen` cultural 0.3 global `entropy`, hook "The dead under a town's cathedral moved through the rite meant to lay them, and the town took it for a bad year." + `reputation_with $here −0.02`.

**Special 3 — Ward The Charnel Door** (Insurance-flavoured Boost, ward) · `order` · essence 2 · Δ 0.10 · `generic.ward`
- effectLine: "Set a line at the threshold the restless dead cannot cross, so what wakes below stays below."
- critical_success: "The dead stayed behind the line all night, and the rite went on without a break."
- success: "The bones pressed at the threshold and did not cross it."
- near_miss: "The line held, but the guilds' watchers would not stand near it, and the rite was said short-handed."
- failure: "The line held at the door, and the bones moved inside it instead."
- critical_failure: "The line held at the door, and shut the guilds' watchers in with the moving dead until dawn."

**Special 4 — Slow The Long Night** (Long Game, time) · `time` · essence 2 · Δ 0.08 · `generic.time-slow`
- effectLine: "Stretch the dark hours before dawn, so the whole rite is said before the light comes."
- success: "Dawn came late, and the last words of the rite were said before it."
- success_at_cost: "Dawn came late, and the watchers grew afraid of the long dark and left their posts."
- failure: "The dark ran long, and the rite still broke before it was finished."

### Step 2 — Rule between the guilds (veil 0.84)

- `narrativeTemplate`: "At first light the guild wardens meet in the charnel house to hear the ruling. Every bone {actor} names will be carried to new ground outside the walls. {cast:warden} says the weavers' dead stay where they lie. The dead care nothing for the guilds' claims. They will stay quiet only if the right bones are moved."
- `purposeLine`: **Rule between the guilds**
- `deal`: `{ count: 3, tags: ['lore', 'social'] }`
- Afterimages:
  - critical_success: "The weavers' oldest dead were carried out first, and not one bone moved after. Every warden, {cast:warden} included, put a hand to the ruling."
  - success: "The bones {actor} named were carried out, and the dead stayed quiet. The wardens accepted the ruling."
  - success_at_cost: "The dead stayed quiet, but {cast:warden} called the ruling theft and walked out before it was sealed."
  - failure: "The wrong bones were carried out, and the dead were moving again by night. The wardens tore up the ruling."
  - critical_failure: "The bones began to move while the wardens were still arguing, and every guild left the charnel house blaming {actor}."
- Carryover lines (keyed on step 1):
  - critical_success (for, +0.06): "The dead have lain quiet since the rite."
  - success (for, +0.04): "The rite held until dawn."
  - success_at_cost (against, −0.02): "The guilds saw the bones move during the rite."
  - near_miss (against, −0.03): "The rite held, but only just."
  - failure (against, −0.05): "The dead are still restless."
  - critical_failure (against, −0.07): "The guilds think the rite failed."
- `successMetadata`: `rewardPool { possession: 1 } tagFilters ['#relic']` + `reputation_with $here +0.06`.
- `failureMetadata`: `reputation_with $here −0.06`.

**Special 5 — Seal The Verdict** (Boost, oath) · `order` · essence 2 · Δ 0.08 (step 2 specials sum 0.16: 0.84 + 0.16 = 1.00, the forecast ceiling) · `generic.oath`
- effectLine: "Make a judgment sound settled and old, so the wardens stop arguing once it is given."
- critical_success: "The wardens heard the ruling once and asked for no second reading."
- success: "The wardens argued for an hour, then let the ruling stand."
- near_miss: "The wardens let the ruling stand, but only after {cast:warden} had it read three times."
- failure: "The wardens let the ruling stand, and the dead it left in place moved that night."
- critical_failure: "The wardens accepted the ruling at once, and the wrong bones went out the door before {actor} saw the mistake."

**Special 6 — Stir Old Grudges** (Stumble, opposes `warden`) · `chaos` · essence 1 · Δ 0.08 · `generic.rumor`
- effectLine: "Remind the other guilds of every slight a rival has dealt them, so the rival stands alone."
- success: "The other wardens remembered old quarrels with the weavers, and none of them backed {cast:warden}."
- success_at_cost: "The other wardens turned on {cast:warden}, and the weavers' guild blamed {actor} for it."
- failure: "The old quarrels came up, and the wardens spent the morning on them instead of the ruling."
- critical_failure: "Every warden remembered a grudge, and the meeting broke up in shouting."

### Trait hooks

1. Gate? No — everyday board, no rule gate.
2. Variant? Yes:
   - `trait.mastery.spell-weaver` +0.05: "Being a Spell-Weaver, they know the old rite of laying by heart."
   - `trait.reputation.veil.negative` −0.05: "Being a Dangerous Sorcerer, they are not trusted alone with the guilds' dead."
3. Trait-only nudge? No.
4. Trait fragment? No.

## 12. Linear continuation

Step 1 and step 2 spines above. The later paragraph is step 2's: the wardens meet at first light; whatever bones are named go to new ground; the weavers' warden refuses; the dead care only that the right bones move.

## 13. Aftermath Paragraph

fallback overview: "The ruling is given, and {location} counts which of its dead were moved."

| Band | overview |
|---|---|
| critical_success | "The dead under the cathedral lie quiet, and every guild has put its hand to the ruling. The dean gives {actor} the relic found under the weavers' bones, in front of all the wardens." |
| success | "The dead under the cathedral lie quiet. The dean lets {actor} keep the relic found under the weavers' bones." |
| success_at_cost | "The dead lie quiet, but {location} saw how hard it came. The dean still lets {actor} keep the relic found under the weavers' bones." |
| failure | "The dead under the cathedral are still restless, and the guilds have torn up the ruling. {location} sent for {actor} by name, and will not send again." |
| critical_failure | "The dean sent for {actor} to settle the dead. Every guild in {location} now says {actor} made the trouble worse, and a master's failure is remembered longest." |

## 14. Aftermath Reaction Choices

Success bands (fallback reactions):
- **Credit the weavers' sacrifice** — "The mortal thanks the weavers in front of every guild for giving up their first dead. Their warden will remember it kindly." → `bond_change $cast:warden +0.12`.
- **Name the weavers' claim as the cause** — "The mortal tells the town the weavers' claim kept the dead restless. The town thinks the better of the mortal, and the weavers' warden will not forget it." → `reputation_with $here +0.03`, `bond_change $cast:warden −0.12`.

Failure and critical failure:
- **Say the rite again** — "The mortal stays another night over the bones, and the town marks who stayed." → `reputation_with $here +0.03`.
- **Blame the weavers' warden** — "The mortal tells the dean the weavers' claim undid the ruling, and the weavers' warden hears of it." → `bond_change $cast:warden −0.12`.

The stances: give the credit away to the people who lost the most; tell the hard truth and take the town's regard; stay and work without being asked; put the blame where the claim was.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) |
|---|---|
| critical_success | BOND · reputation with {location} (gain) — "The Dead Lie Quiet" · cause "Their ruling held" · detail "{location} thinks well of {actor} now." · PRIZE (engine, from the rewardPool) |
| success | same chip, same prize |
| success_at_cost | same chip, same prize |
| failure | BOND · reputation with {location} (loss) — "Found Wanting" · cause "Sent for by name, and failed" · detail "{location} thinks less of {actor} now." |
| critical_failure | BOND · reputation with {location} (loss) — "Blamed for the Dead" · detail "{location} thinks less of {actor} now." |

The omen is not chipped: no omen anchor exists, and an omen is dressing. It is told in step 1's afterimages and is live in the world (it biases encounter draws and reaches the chronicle).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `warden` (weavers' warden) | lazy-materialize-on-trigger | reuse `merchant`, else spawn `merchant` "Orrin Vasse" | must-persist | reaction `bond_change` edges | live (THR-696 cast binding) |
| the relic | step 2 `rewardPool` `#relic` | item library (14 bearers) | must-persist (possession) | PRIZE chip | live |
| standing | `reputation_with $here` | the town | must-persist | chips | live |
| omen | `emit_omen` global cultural | omen system | timed (default duration) | encounter bias, chronicle | live |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Design block before prose | PASS | § 0 |
| Opening skeleton ≤80 words | PASS | 78 |
| Narrator mode | PASS | report throughout |
| One named person per beat | PASS | {cast:warden}; dean and sexton role nouns |
| Hand 4–8 per step, ≥4 spheres, ≥1 common | PASS (by deal) | 2 specials + deal 3 each step; the dealer supplies the common option |
| Every nudge has a failure fragment | PASS | all six |
| Big-delta cards | n/a | none ≥ 0.15 |
| Effect line repeats no word of its name | PASS | checked |
| Six StepOutcomes covered per step | PASS | across specials |
| byOutcome ≥3 bands | PASS | all five |
| Every chip backed | PASS | reputation_with on the path of each band; prize from rewardPool |
| Consequence hand wired | PASS | standing = reputation_with; omen = emit_omen |
| Query prize tag live | PASS | `#relic` item 14 |
| Systems ≥3 | PASS | cast, rewards, reputation |
| Prose rule 7 / 7b | PASS | no history asserted; no later promise beyond "will not send again", which is the reputation write |
| Trait hooks answered | PASS | § 11 |

### Concept Art Direction

1. Emotions: crowding, old claims, the living arguing over the dead, quiet bought at a price.
2. Image: a single guild token (a weaver's shuttle carved in bone) lying alone on swept flagstones where a stack of skulls used to stand; a pale square on the wall where the stack leaned. Residue, no people, no bones in motion.

## Experience Differentiator Gate

1. YES — arrival, situation, problem; 78 words; graph names.
2. YES — every sentence is challenge, test or outcome.
3. YES — bones, guild marks, threshold, night, wardens, the weavers' warden all in the spines before the cards act on them.
4. YES — "The dead under the cathedral won't rest; lay them and rule which guild's bones move."
5. YES — six spell-style faces, no flavor quote.
6. YES — all essence-priced.
7. YES — every card has a failure-band fragment.
8. YES — each card acts on a target the spine names.
9. YES — memory / stirring the dead (step 0); a ward / the night's length (step 1); a judgment's weight / a rival's isolation (step 2).
9b. YES — composed 5 per step; no branch choice.
10. YES — overview per band.
11. YES — the town and the weavers' warden; chips name `reputation with {location}`.
11b. YES — read as pages; no fact told twice.
12. YES — two reactions per side.
13. YES — credit given away vs hard truth; stay and work vs blame.
14. YES — residue image.
