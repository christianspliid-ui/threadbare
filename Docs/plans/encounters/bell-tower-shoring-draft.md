# Encounter Pipeline: The Leaning Bell Tower
> Scale: short | Slug: bell-tower-shoring | Pass: draft
> Date: 2026-09-30 | Pipeline version: 2.0
> Batch: expert-everyday-1 (THR-1678), slot 5 — the batch's appointment slot
> Template id: `encounter.town.bell_tower_shoring`

## 0. Mechanical design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | A tremor has cracked a town's bell tower and it leans; the masons' lodge that built it has already failed to bind the crack, and the council sends for {actor}, the best mason within reach. |
| Title | *The Leaning Bell Tower* — the complication in three words. |
| Shape | **Seeded Sequel — placed/timed variant (appointment, THR-1479)**, two steps, a test and its consequence. Step 0 reads the tower (investigation: what is holding it up); step 1 cuts out and resets the cracked courses. Step 1 success plants an `encounter_seed` with an `appointment` block: kept → `town.bell_tower_first_peal`, missed → `town.bell_tower_cracked`. |
| Reach per step | Step 0 **stone 0.60** — reading masonry under load is Stone's craft. Step 1 **stone 0.66** — resetting courses under a standing tower is Stone's endurance. Mean 0.63, window fit 0.77 (expert band). Words the player reads: *steep*, *severe*. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief: the 0.45 open-draw cap binds `background` only). |
| Settings | `urban`, `rural`. One P1 opening each; the spine names no class scenery. |
| Whose problem? | The agent's: their commission, their half-fee in hand, their name as the best mason within reach. |
| Why here? | `mission` — sent for by the council because other hands (the lodge's) already failed. |
| Plot hook | Rolled `hook.puzzle_gauntlet, hook.natural_disaster, hook.death_and_return`. **Taken: `hook.puzzle_gauntlet`, blended with `hook.natural_disaster`.** The lodge built the tower with a hidden arch inside the wall to carry the bell — a builders' trick made by people who expected to be understood, and it still works; a tremor (the disaster) cracked the wall beside it. `death_and_return` set aside: nothing in a shoring job dies and comes back. |
| Seed dice | p3 **plea** (the councillor asks) · opposition **uncanny, its own law**, read as the tower's own weight and age — old stone settles at its own pace and the job has to be done while it stands · disposition **neutral** (the lodge's master neither helps nor hinders) · agentRole **trespasser** — the lodge has never let an outsider work on its tower, and {actor} is that outsider · scale **settlement** (the town's tower, the town's regard). |
| Expert stakes | Someone powerful across the table: the town council, which has paid half the fee. Failure costs standing first — the lodge failed once, and if {actor} fails too the town thinks less of them. No death, jail or brand: the council has cleared the houses below. |
| Consequence hand (binding) | `possession` + `knowledge`. No swap. **possession** — step 1 `successMetadata.rewardPool` `{ possession: 1, tagFilters: ['#stone'] }`: the council adds a gift from the town's stores (renders as the auto PRIZE chip). **knowledge** — `intelligence` (`cultural_knowledge`) on step 1 success: {actor} now knows how the lodge built its tower (the hidden arch). |
| Appointment | Step 1 success: `encounter_seed` `templateId: 'town.bell_tower_first_peal'`, `targetAgentId: '$actor'`, `delayTicks: 36` (three days to market day), `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:councillor', missed: { templateId: 'town.bell_tower_cracked', seedLabel } }`. The spine names the place (the tower) and the time (when the bell rings on market day) — prose rule 7b's one lawful exception. |
| Spine effect | `reputation_with` on `$here`: +0.06 on step 1 success, −0.06 on step 1 failure, and −0.03 on step 0 failure (a step-0 critical_failure ends the action there, so the critical_failure scar chip needs its own backing write on step 0 — the well-sinking lesson). |
| Conditions (system target) | Land in the **kept sequel**: `apply_condition` `trait.condition.location.festival` on `$here` when the first peal goes well — the town keeps the day as a feast. The parent adds no condition on the mortal (brief: avoid a personal condition as the default penalty). |
| Mortal choice | None — this is a test. `motivations: ['preservation_transformation', 'tradition_novelty']` — the scene is about keeping an old thing standing and about an outsider working on a lodge's old work. |
| Trait hooks | Gate: none (everyday by construction). Variant: none — no live trait fits reading load paths better than the reach does. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast · rewards · appointments · reputation — four. |
| Heavy Hand | none authored. |
| Promise → payoff | The hidden arch is promised by nothing in the opening (information behind the test); it is revealed in step 0's afterimages and paid off in step 1's knowledge chip. The fee promise pays off in the sequels. |

## 1. Inspiration Anchors

- **`hook.puzzle_gauntlet`** — "built as a test by people who expected to be understood, and it still works." Changed the encounter: the tower is not merely old, it is *clever*, and the mason's test in step 0 is to understand the lodge's trick before cutting anything. It also gave the knowledge family its honest content.
- **`hook.natural_disaster`** — the tremor is the cause, a cost already paid, stated in one sentence.
- **Well Sinking (journeyman appointment)** — the direct precedent for the appointment wiring, the step-0 backing write, and the sequel file shape. Deliberately *not* copied: its rival-on-the-next-plot contest. This one is a plea with a neutral onlooker.
- **Mason's Commission** — a sibling stone job in the same envelope. Avoided: a trial-footing contest, the `#tool` prize, and its card composition (mind/matter/force/chaos).
- Anti-patterns avoided: the helpful passerby (the mortal is sent for and paid); failure as punishment (nobody is hurt; the cost is standing).

## 2. Scale Justification

Short: two beats. The stake is one tower and one reputation; the long tail lives in the appointment, which carries the story forward three days without adding a third beat.

## 3. Pressure Knot

A tremor cracked the tower. The lodge that built it bound the crack with iron and the crack spread past it. The council has paid half the fee to an outsider and cleared the houses below. Market day is three days away and the bell is rung on market day.

## 4. Intervention Fantasy

The god works on the tower itself — light through a crack, the slow sinking of old stone held back a day, the weight of the upper wall pressed still — and on the pride of the lodge's master, who knows where the iron is and has not said.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `councillor` | Speaks for the council; pays the fee; the appointment's counterparty. Named on step 0. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `elder` / `steward` / `clerk` / `merchant` / `noble`; spawn `elder` "Maud Carrow". |
| `lodgemaster` | Master of the masons' lodge; built/kept the tower; failed with iron; neutral onlooker. Named on step 1. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `mason`; spawn `mason` "Osric Venn". |
| The town (`$here`) | Carries the reputation and the appointment's place. | resolved location |
| Prize | A `#stone` possession from the reward pool. | step 1 `rewardPool` |
| Intelligence record | `cultural_knowledge` — how the lodge built the tower. | step 1 `intelligence` |
| Appointment | The rest of the fee, at the tower, when the bell rings on market day. | step 1 `encounter_seed` + `appointment` |

## 6. Beat Structure

1. **Read the tower** (stone 0.60, `continue_weakened`) — find what still holds it up. Success reveals the lodge's hidden arch. Failure: props set by guesswork (continues weakened). Critical failure ends it.
2. **Reset the courses** (stone 0.66, `fail_action`) — cut out and reset the cracked courses while the tower stands. Success: the tower stands, prize, knowledge, reputation, appointment planted. Failure: the top of the tower comes down into the cleared street; reputation lost.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | Tower straighter than in years | the day | appointment; prize; knowledge; the town's regard |
| success | Tower stands without props | the day | appointment; prize; knowledge; regard |
| success_at_cost | Tower stands, not as straight as hoped | extra work | appointment; prize; knowledge; regard |
| failure | Tower not saved | half fee spent, standing | the town thinks less of them |
| critical_failure | Tower worse than when they came | half fee counted as thrown away | the town thinks less of them |

## 10. Sample Opening (narrator mode)

**P1 (rural):** {actor} comes into {location}, sent for by the village council.
**P1 (urban):** {actor} comes into {location}, sent for by the town council.

**Spine (step 0):** A tremor has cracked the bell tower, and now it leans. The masons' lodge that built it bound the crack with iron, and the crack spread. {cast:councillor} speaks for the council and asks {actor} to save the tower. Half the fee is paid now. The rest is paid at the tower when the bell rings on market day. If {actor} fails too, {location} will think less of both.

Word count, P1 + spine: rural 72, urban 72.

## 11. The Hand Per Step

### Step 0 — Read the tower (stone 0.60, purpose "Find what holds it")

`deal: { count: 3, tags: ['craft', 'insight'] }` + 2 specials → composed 5.

| id | Name | Type | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bell.show_the_hidden` | Show The Hidden | Whisper | light | 2 | 0.12 | generic.light | Let the low sun fall through the crack, so the buried arch inside the wall can be seen. |
| `bell.slow_the_settling` | Slow The Settling | Long Game | time | 1 | 0.10 | generic.time-slow | Hold back the tower's sinking for a day, so the crack stays put while they study it. |

Band fragments:

- **Show The Hidden** — critical_success: "The sun lit the whole buried arch through the crack, stone by stone." · success: "The low sun came through the crack and lit the curve of a buried arch." · near_miss: "The low sun lit the arch through the crack, but only for a moment." · failure: "The low sun came through the crack, but the dust hid the arch from them."
- **Slow The Settling** — success_at_cost: "The crack held still for most of the day, and moved once, at dusk." · failure: "The crack held still until noon, then moved again under their hands." · critical_failure: "The crack held still for an hour, then opened all at once."

### Step 1 — Reset the courses (stone 0.66, purpose "Reset the cracked courses")

`deal: { count: 3, tags: ['craft', 'peril'] }` + 2 specials → composed 5.

| id | Name | Type | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bell.stir_old_pride` | Stir Old Pride | Favor | spirit | 2 | 0.11 | generic.oath | Wake the lodge master's love for the tower, so the master calls out where the lodge set its iron ties. |
| `bell.press_the_wall` | Press The Wall | Boost | force | 2 | 0.12 | generic.strength | Bear down on the upper tower, so it sits still while the courses beneath it are cut out. |

Band fragments:

- **Stir Old Pride** — success: "The lodge's master called out from the street where the iron ties sat, and the cuts missed them." · success_at_cost: "The lodge's master called out the ties, then walked off before the work was done." · failure: "The lodge's master called out where the ties sat, but too late for the first cut."
- **Press The Wall** — critical_success: "The upper tower sat as still as bedrock while the old courses came out." · near_miss: "The upper tower sat still until the last course, then shifted as it went in." · failure: "The upper tower held still for the first courses and shifted on the last." · critical_failure: "The upper tower sat still for a while, then dropped all at once onto the new courses."

Spheres across specials: light, time, spirit, force (4 distinct before the deal). Common option supplied by the deal. No rider authored. No card grants content.

## 12. Linear continuation (step 1 spine)

By the second day the props are in, and the tower leans on them alone. The council has cleared the houses below. {cast:lodgemaster}, the lodge's master, has never let an outsider work on this tower, and watches from the street without helping. The cracked courses must be cut out and reset while the tower stands. If the new courses fail, the top of the tower comes down.

### Afterimages

Step 0:
- critical_success: They found the hidden arch inside the wall by noon, and saw exactly which courses to cut out.
- success: They found the lodge's secret: a hidden arch inside the wall carries the bell, and the crack runs beside it.
- success_at_cost: They found the hidden arch, but a loose block fell from the bell chamber while they searched and split a prop.
- failure: They could not find what carried the weight, and set the props by guesswork.
- critical_failure: They set a prop against the wrong course, and the crack opened wider before they could pull it out.

Step 1:
- critical_success: They reset the courses so well that the tower stands straighter than it has in years.
- success: They cut out the cracked courses one at a time and reset them, and the tower stood straight without its props.
- success_at_cost: The tower stood without its props, but it still leans a little, and the whole town can see it.
- failure: The new courses would not take the weight, and the bell chamber came down into the cleared street.
- critical_failure: The top of the tower came down into the cleared street, bell and all.

## 13. Aftermath Paragraph (per band)

- **critical_success:** The tower stands straighter than it has in years. {cast:lodgemaster} came up the scaffold at dusk to see how the courses were cut. The council added a gift from the town's stores.
- **success:** The tower stands straight without its props. The council added a gift from the town's stores.
- **success_at_cost:** The tower stands, but not as straight as the council hoped. The council added a gift from the town's stores all the same.
- **failure:** The tower was not saved. The lodge failed first, and now {actor} has failed after it, in front of the whole town.
- **critical_failure:** {location} counts the half fee it paid as thrown away. The tower is worse than it was when {actor} arrived.

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

Plus the auto PRIZE chip (reward pool) on the success bands.

Chip text:
- bond (crit): title "A tower saved" · cause "Straighter than before" · detail "{location} thinks well of their work."
- bond (success): title "A tower saved" · cause "Reset without props" · detail "{location} thinks well of their work."
- bond (SAC): title "Saved, if not straight" · cause "The tower stands" · detail "{location} thinks well enough of their work."
- boon (all success bands): title "The lodge's arch" · cause "Cut the old courses out" · detail "{actor} knows how the lodge built its tower." · noun `knowledge`.
- path (all success bands): title "Paid at the tower" · cause "The tower stands" · detail "{cast:councillor} pays the rest when the bell rings on market day." · noun `appointment` anchored `$appointment`.
- scar (failure): title "Failed where the lodge failed" · cause "The tower was lost" · detail "{location} thinks less of their work."
- scar (crit fail): title "A tower made worse" · cause "Worse than they found it" · detail "{location} thinks less of their work."

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `councillor` | lazy-materialize-on-trigger | reuse elder/steward/clerk/merchant/noble, else spawn elder "Maud Carrow" | must-persist | appointment counterparty; both sequels (`inheritContext`) | ready |
| `lodgemaster` | lazy-materialize-on-trigger | reuse mason, else spawn mason "Osric Venn" | must-persist | step 1 prose; crit overview | ready |

## 17. Sequels (seed-only, `drawable: false`, THR-1526) — `src/data/encounters/bell-tower-sequels.ts`

- **`town.bell_tower_first_peal` — The First Peal** (kept). Stone 0.35, one step, "Show the tower holds". "{name} is at the bell tower in {location} on market day. {cast:councillor} has the bell rung for the first time since the crack, while the town watches from a distance. If the new courses hold through the peal, the councillor pays the rest of the fee." Success: rewardPool `#trade` possession (the fee), `reputation_with $here +0.04`, `bond_change` with the councillor, `apply_condition` festival on `$here` (36 ticks). Failure: `bond_change` negative.
- **`town.bell_tower_cracked` — The Crack Reopened** (missed). Heart 0.45, one step, "Talk the fee out". "Nobody from the work was at the bell tower when the bell rang on market day. Nobody checked the new courses as the bell swung, and a new crack opened above them. {cast:councillor} has found {name} with the rest of the fee held back, and wants the crack looked at before any of it is paid." Success: small bond move. Failure: bond loss + `reputation_with $here −0.04`.

## 18. Concept Art Direction

1. *Emotions:* the weight of something old that other people trusted, the pressure of being the last one sent for, relief that is not yet payment.
2. *Evocative image:* a bell rope tied off short against a cracked stone wall, timber props wedged at its foot, sawdust and stone dust on the flags, and a single iron tie-bar lying bent where it was pulled out. No people. Evening light from one side.

## 19. Self-Audit

| Item | Verdict |
|---|---|
| Narrator's 12 questions | PASS — see § 20 |
| Opening ≤80 words | PASS (72) |
| Hand 4–8 composed, ≤2 specials + deal | PASS |
| ≥4 spheres, ≥1 common | PASS (specials 4 spheres; deal supplies a common) |
| Every nudge failure fragment; no big-delta | PASS (max Δ 0.12) |
| Six StepOutcomes covered per step by specials | PASS |
| No digits in effect lines; no name word repeated | PASS |
| Consequence hand wired | PASS — possession (rewardPool), knowledge (intelligence) |
| Appointment has missed branch; both sequels authored | PASS |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), intelligence (step 1 success), appointment seed (step 1 success) |
| Prose rule 7 | PASS — no asserted history; the lodge, the tremor, and the fee are scene-local |
| Prose rule 7b | PASS — the only later-tense promise (fee at the tower on market day) is the appointment |
| Support bundle class-honest | PASS — councillor roles seeded in hamlet (elder) and town/city (clerk, merchant, noble); lodgemaster spawns a mason where none is seeded |

## 20. The narrator's 12 questions

1. P1 arrival with graph names — yes: `{actor}`, `{location}`, sent for by the council.
2. P2 events with costs paid — the tremor cracked it; the lodge's iron failed; half the fee is paid.
3. P3 one stake — plea: {cast:councillor} asks {actor} to save the tower; the cost of failing is stated.
4. ≤80 words — 72.
5. Read aloud as a report — yes.
6. Stated, never encoded — "now it leans", "the crack spread", "will think less of both".
7. Every sentence works — each is the challenge, the test or the stake.
8. Nothing unintroduced — the lodge, the iron, the fee, market day and the bell all appear before any card or chip names them; the lodge's master is introduced on step 1 before its special.
9. One named person per beat — step 0 `{cast:councillor}`, step 1 `{cast:lodgemaster}`.
10. Stake in a sentence — "Can the outside mason save the lodge's cracked tower, be paid for it, and keep their name?"
11. Cards verb+noun, spell-style — yes.
12. Opening per class — `rural` and `urban`.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (the crack, the lodge's master, the upper tower, the iron ties all named before the hand) · 4 YES · 5 YES · 6 YES (essence on every special) · 7 YES · 8 YES · 9 YES (reveal / delay / someone's knowledge / raw weight — four different questions) · 9b YES · 10 YES · 11 YES (named councillor, lodge master; sheet-word nouns) · 11b YES (overview never retells a chip) · 12 N/A (short) · 13 N/A (short) · 14 YES.
