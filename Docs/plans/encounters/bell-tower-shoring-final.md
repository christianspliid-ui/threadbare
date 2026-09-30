# Encounter Pipeline: The Leaning Bell Tower
> Scale: short | Slug: bell-tower-shoring | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | Expert two-step Stone job (read the tower, reset the courses); appointment slot with kept/missed seed-only sequels; possession + knowledge hand. |
| Editorial | PASS WITH REVISIONS | Triggers 18, 22, 29, 35 and gate 8 fired; all fixed in the revised file (opening de-ambiguated and recounted to 78, arch no longer named on a card face, step-1 failure/crit made distinct, all five pages de-duplicated, class scenery removed). |
| Systems | READY WITH CAVEATS | Every referenced id verified live. Two corrections applied below (reward-pool shape; missed-sequel regard write retargeted off `$here`). No missing primitives. |

### Corrections applied by Pass 3 (field shapes / ids only — no prose changed)

1. **§ 0 Consequence hand row — reward pool shape.** `{ possession: 1, tagFilters: ['#stone'] }` → `{ categoryWeights: { possession: 1 }, tagFilters: ['#stone'] }` (`RewardPoolRecipe`, `src/types/attachments.ts:232`). The parenthetical asking Pass 3 to confirm is replaced by a confirmation note.
2. **§ 17 missed sequel — regard write retargeted.** `reputation_with $here −0.04` → `reputation_with` `targetAgentId: '$cast:councillor'` `−0.04`. `$here` binds to the mortal's current place, and the missed branch fires wherever the mortal is, so the original would have written the loss to an unrelated town. No sentinel reads the missed appointment's place.
3. **§ 17 kept sequel — reward pool spelled out** as `{ categoryWeights: { possession: 1 }, tagFilters: ['#trade'] }` (the `town.well_first_water` recipe), and the missed-sequel `bond_change` shapes named.
4. **§ 21 (new, Pass 3)** — required fields the packet left unwritten (seed labels, intelligence label/detail, supportRole, chip declarations). They are built from the packet's own sentences; the package pass may tune the wording.

### Caveats / Blockers

1. **Sequel file + hand registration.** Create `src/data/encounters/bell-tower-sequels.ts` (`BELL_TOWER_SEQUELS`) and spread it in `src/data/unified-action-templates.ts` beside `...WELL_SINKING_SEQUELS`. Without it `validateEncounterSeedRefs` reports both appointment branches as `dead_template`.
2. **Required fields** (§ 21): kept `seedLabel`, `appointment.missed.seedLabel`, `intelligence.label` / `.detail`, `supportRole` ×2. Optional: template `tags: ['#build']` (well precedent).
3. **Prose rule 7b, missed sequel.** "…holds back the rest of the fee until the crack is looked at" promises a later payment nothing enacts (success is bond-only). When authoring the sequel, end the sentence at "holds back the rest of the fee", or give the missed success a small `#trade` `rewardPool`. Never write a success afterimage that claims payment on a bond-only success. (The shipped `town.well_gone_foul` has the same hole — not blocking.)
4. *Note, not a defect:* `intrinsicTier: 'shaping'` is deliberate (brief); the 0.45 open-draw cap binds `background` only (`nudgeHandChecklist.ts:419`). No reach gate is authored, so it is the forecast window (mortals engage at ~50–65%) that keeps the job with stone-competent mortals — a low-Stone mortal sees *severe* and declines.

### Editorial Notes Summary

The editor found the draft sound and fixed only words: the opening's ambiguous "think less of both" (which also promised an unbacked lodge-standing loss) became "of them", P2/P3 were split and the word count corrected 72→78; Show The Hidden's effect line stopped naming the hidden arch (gate 8); the step-1 spine now states the iron-ties hazard and softens the stake to "can come down"; step-1 failure (propped and left leaning) and critical failure (the top comes down) became different events; all five aftermath pages were rewritten so no overview retells its afterimage and the success_at_cost overview is true on both paths; "town" scenery was removed from outcome fields and the kept sequel; fragment↔afterimage echoes were cut. It handed Pass 3 the reward-pool shape, the `#stone` / `#trade` liveness checks and the open-draw difficulty question — all answered above.

### Implementation File Map

| File | Action | Notes |
|---|---|---|
| `Docs/plans/encounters/bell-tower-shoring.package.json` | create | Compiles (`compile:encounter`, THR-1246) into `src/data/encounters/bell-tower-shoring.ts`, its structural test and the parent's registrations — not hand-edited. |
| `src/data/encounters/bell-tower-sequels.ts` | create (hand-authored) | `town.bell_tower_first_peal` + `town.bell_tower_cracked`, `drawable: false`, no `locationSubtypes`, `intrinsicTier: 'background'`, exported as `BELL_TOWER_SEQUELS`. Mirror `well-sinking-sequels.ts`. |
| `src/data/unified-action-templates.ts` | modify (2 lines) | Import + spread `BELL_TOWER_SEQUELS` beside `...WELL_SINKING_SEQUELS` — the THR-1677 precedent for seed-only sequels outside the compiled package. |
| `src/data/content-objects.ts` | none | `town.` prefix already claimed. |
| Engine / types / art | none | Image tags are all `generic.*` library entries. |

Full audit: `Docs/plans/encounters/bell-tower-shoring-systems.md`.

---

## Encounter Packet

# Encounter Pipeline: The Leaning Bell Tower
> Scale: short | Slug: bell-tower-shoring | Pass: revised
> Revisions applied: opening de-ambiguated ("think less of both" → "of them"), P2/P3 split, count corrected 72→78; Show The Hidden effect line no longer names the arch; step-1 spine states the iron-ties hazard and softens the stake; step-1 failure vs critical_failure made distinct events; all five aftermath pages rewritten for repetition/path-truth (Page read); "town" class scenery removed from outcome fields and the kept sequel; fragment↔afterimage echoes cut (Show The Hidden, Slow The Settling); Press The Wall near_miss/failure de-duplicated; "hidden arch" made consistent; lodge's master named by placeholder in fragments; missed-sequel prose tidied; chip titles/causes rewritten.
> Date: 2026-09-30 | Pipeline version: 2.0
> Batch: expert-everyday-1 (THR-1678), slot 5 — the batch's appointment slot
> Template id: `encounter.town.bell_tower_shoring`

## 0. Mechanical design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | A tremor has cracked a town's bell tower and it leans; the masons' lodge that built it has already failed to bind the crack, and the council sends for {actor}, the best mason within reach. |
| Title | *The Leaning Bell Tower* — the complication in four words. |
| Shape | **Seeded Sequel — placed/timed variant (appointment, THR-1479)**, two steps, a test and its consequence. Step 0 reads the tower (investigation: what is holding it up); step 1 cuts out and resets the cracked courses. Step 1 success plants an `encounter_seed` with an `appointment` block: kept → `town.bell_tower_first_peal`, missed → `town.bell_tower_cracked`. |
| Reach per step | Step 0 **stone 0.60** — reading masonry under load is Stone's craft. Step 1 **stone 0.66** — resetting courses under a standing tower is Stone's endurance. Mean 0.63, window fit 0.77 (expert band). Words the player reads: *steep*, *severe*. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief: the 0.45 open-draw cap binds `background` only). |
| Settings | `urban`, `rural`. One P1 opening each; the spine, afterimages and overviews name no class scenery (`{location}` wherever the place is meant). |
| Whose problem? | The agent's: their commission, their half-fee in hand, their name as the best mason within reach. |
| Why here? | `mission` — sent for by the council because other hands (the lodge's) already failed. |
| Plot hook | Rolled `hook.puzzle_gauntlet, hook.natural_disaster, hook.death_and_return`. **Taken: `hook.puzzle_gauntlet`, blended with `hook.natural_disaster`.** The lodge built the tower with a hidden arch inside the wall to carry the bell — a builders' trick made by people who expected to be understood, and it still works; a tremor (the disaster) cracked the wall beside it. `death_and_return` set aside: nothing in a shoring job dies and comes back. |
| Seed dice | p3 **plea** (the councillor asks) · opposition **uncanny, its own law**, read as the tower's own weight and age — old stone settles at its own pace and the job has to be done while it stands · disposition **neutral** (the lodge's master neither helps nor hinders) · agentRole **trespasser** — the lodge has never let an outsider work on its tower, and {actor} is that outsider · scale **settlement** (the town's tower, the town's regard). |
| Expert stakes | Someone powerful across the table: the council, which has paid half the fee. Failure costs standing first — the lodge failed once, and if {actor} fails too the place thinks less of them. No death, jail or brand: the council has cleared the houses below. |
| Consequence hand (binding) | `possession` + `knowledge`. No swap. **possession** — step 1 `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#stone'] }` *[Pass 3 correction: was `{ possession: 1, tagFilters: ['#stone'] }`; `RewardPoolRecipe` confirmed, `#stone` resolves to 16 possession items]*: the council adds a gift from the place's stores (renders as the auto PRIZE chip). **knowledge** — `intelligence` (`cultural_knowledge`) on step 1 success: {actor} now knows how the lodge's hidden arch carries the bell. |
| Appointment | Step 1 success: `encounter_seed` `templateId: 'town.bell_tower_first_peal'`, `targetAgentId: '$actor'`, `delayTicks: 36` (three days to market day), `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:councillor', missed: { templateId: 'town.bell_tower_cracked', seedLabel } }`. The spine names the place (the tower) and the time (when the bell rings on market day) — prose rule 7b's one lawful exception. |
| Spine effect | `reputation_with` on `$here`: +0.06 on step 1 success, −0.06 on step 1 failure, and −0.03 on step 0 failure (a step-0 critical_failure ends the action there, so the critical_failure scar chip needs its own backing write on step 0 — the well-sinking lesson). |
| Conditions (system target) | Land in the **kept sequel**: `apply_condition` `trait.condition.location.festival` on `$here` when the first peal goes well — the place keeps the day as a feast. The parent adds no condition on the mortal (brief: avoid a personal condition as the default penalty). |
| Mortal choice | None — this is a test. `motivations: ['preservation_transformation', 'tradition_novelty']` — the scene is about keeping an old thing standing and about an outsider working on a lodge's old work. |
| Trait hooks | Gate: none (everyday by construction). Variant: none — no live trait fits reading load paths better than the reach does. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast · rewards · appointments · reputation — four. |
| Heavy Hand | none authored. |
| Promise → payoff | The hidden arch is promised by nothing in the opening or on any card face (information behind the test); it is revealed in step 0's afterimages and paid off in step 1's knowledge chip (whose detail names it, so the chip reads on the step-0-failure path too). The fee promise pays off in the sequels. |

## 1. Inspiration Anchors

- **`hook.puzzle_gauntlet`** — "built as a test by people who expected to be understood, and it still works." Changed the encounter: the tower is not merely old, it is *clever*, and the mason's test in step 0 is to understand the lodge's trick before cutting anything. It also gave the knowledge family its honest content.
- **`hook.natural_disaster`** — the tremor is the cause, a cost already paid, stated in one sentence.
- **Well Sinking (journeyman appointment)** — the direct precedent for the appointment wiring, the step-0 backing write, and the sequel file shape. Deliberately *not* copied: its rival-on-the-next-plot contest. This one is a plea with a neutral onlooker.
- **Mason's Commission** — a sibling stone job in the same envelope. Avoided: a trial-footing contest, the `#tool` prize, and its card composition (mind/matter/force/chaos).
- Anti-patterns avoided: the helpful passerby (the mortal is sent for and paid); failure as punishment (nobody is hurt; the cost is standing).

## 2. Scale Justification

Short: two beats. The stake is one tower and one reputation; the long tail lives in the appointment, which carries the story forward three days without adding a third beat.

## 3. Pressure Knot

A tremor cracked the tower. The lodge that built it bound the crack with iron and the crack spread past it. The council has paid half the fee to an outsider and cleared the houses below. Only the lodge knows where its iron ties sit in the wall, and its master will not say. Market day is three days away and the bell is rung on market day.

## 4. Intervention Fantasy

The god works on the tower itself — light through a crack, the slow sinking of old stone held back a day, the weight of the upper wall pressed still — and on the pride of the lodge's master, who knows where the iron is and has not said.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `councillor` | Speaks for the council; pays the fee; the appointment's counterparty. Named on step 0. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `elder` / `steward` / `clerk` / `merchant` / `noble`; spawn `elder` "Maud Carrow". |
| `lodgemaster` | Master of the masons' lodge; built/kept the tower; failed with iron; neutral onlooker. Named on step 1. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `mason`; spawn `mason` "Osric Venn". |
| The place (`$here`) | Carries the reputation and the appointment's place. | resolved location |
| Prize | A `#stone` possession from the reward pool. | step 1 `rewardPool` |
| Intelligence record | `cultural_knowledge` — how the lodge's hidden arch carries the bell. | step 1 `intelligence` |
| Appointment | The rest of the fee, at the tower, when the bell rings on market day. | step 1 `encounter_seed` + `appointment` |

## 6. Beat Structure

1. **Read the tower** (stone 0.60, `continue_weakened`) — find what still holds it up. Success reveals the lodge's hidden arch. Failure: props set by guesswork (continues weakened). Critical failure: a prop set against the wrong course opens the crack wider, and the action ends.
2. **Reset the courses** (stone 0.66, `fail_action`) — cut out and reset the cracked courses while the tower stands. Success: the tower stands, prize, knowledge, reputation, appointment planted. Failure: the new courses will not take the weight; the tower is propped again and left leaning; reputation lost. Critical failure: the new courses give way and the top of the tower comes down into the cleared street; reputation lost.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | Tower straighter than in years | the day | appointment; prize; knowledge; the place's regard |
| success | Tower stands without props; families back in their houses | the day | appointment; prize; knowledge; regard |
| success_at_cost | Tower stands; the work ran a day long | the half fee, on timber | appointment; prize; knowledge; regard |
| failure | Tower propped again and left leaning | half fee spent, standing | the place thinks less of them |
| critical_failure | Tower worse than when they came (crack wider, or the top down) | half fee counted as thrown away | the place thinks less of them |

## 10. Sample Opening (narrator mode)

**P1 (rural):** {actor} comes into {location}, sent for by the village council.
**P1 (urban):** {actor} comes into {location}, sent for by the town council.

**P2 (step 0 spine):** A tremor has cracked the bell tower, and now it leans. The masons' lodge that built it bound the crack with iron, and the crack spread.

**P3 (step 0 spine):** {cast:councillor} of the council asks {actor} to save the tower. Half the fee is paid now. The rest will be paid at the tower when the bell rings on market day. If {actor} fails as well, {location} will think less of them.

Word count, P1 + spine (honest recount): P1 10 · P2 26 · P3 42 → rural 78, urban 78. Budget 80 (warn-level).

## 11. The Hand Per Step

### Step 0 — Read the tower (stone 0.60, purpose "Find what holds it")

`deal: { count: 3, tags: ['craft', 'insight'] }` + 2 specials → composed 5.

| id | Name | Type | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bell.show_the_hidden` | Show The Hidden | Whisper | light | 2 | 0.12 | generic.light | Let the low sun shine through the crack, so they can see what carries the weight inside the wall. |
| `bell.slow_the_settling` | Slow The Settling | Long Game | time | 1 | 0.10 | generic.time-slow | Hold back the tower's sinking for a day, so the crack stops spreading while they study it. |

Band fragments:

- **Show The Hidden** — critical_success: "The low sun lit every stone inside the wall through the crack." · success: "The low sun came through the crack and lit the inside of the wall." · near_miss: "The low sun lit the inside of the wall, but only for a moment." · failure: "The low sun came through the crack, but the dust hung too thick to see inside."
- **Slow The Settling** — success_at_cost: "The crack held still for most of the day, and moved once, at dusk." · failure: "The crack held still until noon, then moved again under their hands." · critical_failure: "The tower held still for an hour, then settled all at once."

### Step 1 — Reset the courses (stone 0.66, purpose "Reset the cracked courses")

`deal: { count: 3, tags: ['craft', 'peril'] }` + 2 specials → composed 5.

| id | Name | Type | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `bell.stir_old_pride` | Stir Old Pride | Favor | spirit | 2 | 0.11 | generic.oath | Wake the lodge master's love for the tower, so the master calls out where the lodge set its iron ties. |
| `bell.press_the_wall` | Press The Wall | Boost | force | 2 | 0.12 | generic.strength | Bear down on the upper tower, so it sits still while the courses beneath it are cut out. |

Band fragments:

- **Stir Old Pride** — success: "{cast:lodgemaster} called out from the street where the iron ties sat, and the cuts missed them." · success_at_cost: "{cast:lodgemaster} called out the ties, then walked off before the work was done." · failure: "{cast:lodgemaster} called out where the ties sat, but too late for the first cut."
- **Press The Wall** — critical_success: "The upper tower sat as still as bedrock while the old courses came out." · near_miss: "The upper tower sat still until the last course, then shifted as it went in." · failure: "The upper tower held still for the first courses, then shifted and cracked the new ones." · critical_failure: "The upper tower sat still for a while, then dropped all at once onto the new courses."

Spheres across specials: light, time, spirit, force (4 distinct before the deal; whole-hand variety is the dealer's on a `deal`-bearing step). Common option supplied by the deal. No rider authored. No card grants content. Six StepOutcomes covered by the specials on each step.

## 12. Linear continuation (step 1 spine)

By the second day the props are in. The council has cleared the houses below the tower. {cast:lodgemaster}, the lodge's master, has never let an outsider work on this tower, and watches from the street without helping. Only the lodge knows where its iron ties sit inside the wall. The cracked courses must now be cut out and reset while the tower stands. If the new courses give way, the top of the tower can come down.

### Afterimages

Step 0:
- critical_success: By noon they had found a hidden arch inside the wall that carries the bell, and saw which courses to cut out.
- success: They found the lodge's secret: a hidden arch inside the wall carries the bell, and the crack runs beside it.
- success_at_cost: They found a hidden arch inside the wall that carries the bell, but a loose block fell from the bell chamber while they searched and split a prop.
- failure: They could not find what carried the weight, and set the props by guesswork.
- critical_failure: They set a prop against the wrong course, and the crack opened wider before they could pull it out.

Step 1:
- critical_success: They reset the courses so well that the tower stands straighter than it has in years.
- success: They cut out the cracked courses one at a time and reset them, and the tower stood straight without its props.
- success_at_cost: The tower stood without its props, but it still leans a little, and everyone in {location} can see it.
- failure: The new courses would not take the weight, so the tower was propped again and left leaning.
- critical_failure: The new courses gave way, and the top of the tower came down into the cleared street, bell and all.

## 13. Aftermath Paragraph (per band)

Each overview carries what the ending led to, never a retelling of the afterimage above it, and holds on every path into its band.

- **critical_success:** {cast:lodgemaster} came up the scaffold at dusk to see how the courses were cut. The council added a gift from {location}'s stores.
- **success:** The families below the tower are back in their houses. The council added a gift from {location}'s stores.
- **success_at_cost:** The work ran a day long and used up the half fee on timber. The council added a gift from {location}'s stores all the same.
- **failure:** The lodge failed first, and now {actor} has failed after it.
- **critical_failure:** {location} counts the half fee it paid as thrown away. The lodge's failure looks small beside this one.

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

Chip text (cause + detail ≤ 15 words; no fact shared with the band overview):
- bond (all success bands): title "A tower saved" · cause "Where the lodge had failed" · detail "{location} thinks well of their work." · noun `reputation with {location}` anchored `$here`. (11 words)
- boon (all success bands): title "How the tower stands" · cause "Seen from inside the wall" · detail "{actor} knows how the lodge's hidden arch carries the bell." · noun `knowledge`. (15 words)
- path (all success bands): title "Market day" · cause "Half still owed" · detail "{cast:councillor} pays it at the tower when the bell rings." · noun `appointment` anchored `$appointment`. (13 words)
- scar (failure): title "A tower still propped" · cause "The new courses failed" · detail "{location} thinks less of their work." · noun `reputation with {location}` anchored `$here`. (10 words)
- scar (crit fail): title "Found wanting" · cause "A tower left worse" · detail "{location} thinks less of their work." · noun `reputation with {location}` anchored `$here`. (10 words)

Law 56 backing: bond ← step 1 success `reputation_with +0.06`; scar (failure) ← step 1 failure `−0.06`; scar (crit fail) ← step 1 failure `−0.06` or step 0 failure `−0.03` (the step-0 critical path); boon ← step 1 success `intelligence`; path ← step 1 success `encounter_seed` + `appointment`; PRIZE ← step 1 `rewardPool`.

### Page read (as assembled, for Pass 3 and the batch report)

- **critical_success:** overview (lodge's master on the scaffold · the gift) → BOND "Where the lodge had failed — {location} thinks well of their work." → BOON "Seen from inside the wall — {actor} knows how the lodge's hidden arch carries the bell." → PATH "Half still owed — {cast:councillor} pays it at the tower when the bell rings." → PRIZE.
- **success:** overview (families back in their houses · the gift) → same BOND, BOON, PATH → PRIZE.
- **success_at_cost:** overview (a day long, half fee on timber · the gift all the same) → same BOND, BOON, PATH → PRIZE.
- **failure:** overview (the lodge failed first, and now {actor}) → SCAR "The new courses failed — {location} thinks less of their work."
- **critical_failure:** overview (half fee thrown away · the lodge's failure looks small) → SCAR "A tower left worse — {location} thinks less of their work."

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `councillor` | lazy-materialize-on-trigger | reuse elder/steward/clerk/merchant/noble, else spawn elder "Maud Carrow" | must-persist | appointment counterparty; both sequels (`inheritContext`) | ready |
| `lodgemaster` | lazy-materialize-on-trigger | reuse mason, else spawn mason "Osric Venn" | must-persist | step 1 prose; Stir Old Pride fragments; crit overview | ready |

## 17. Sequels (seed-only, `drawable: false`, THR-1526) — `src/data/encounters/bell-tower-sequels.ts`

- **`town.bell_tower_first_peal` — The First Peal** (kept). Stone 0.35, one step, "Show the tower holds". "{name} is at the bell tower in {location} on market day. {cast:councillor} has the bell rung for the first time since the crack, while people watch from a distance. If the new courses hold through the peal, the councillor pays the rest of the fee." Success: rewardPool `#trade` possession (the fee) *[Pass 3: `{ categoryWeights: { possession: 1 }, tagFilters: ['#trade'] }`]*, `reputation_with $here +0.04`, `bond_change` with the councillor *[`withAgentId: '$cast:councillor'`]*, `apply_condition` festival on `$here` (36 ticks) *[`conditionTraitId: 'trait.condition.location.festival'`, `targetLocationId: '$here'`, `durationTicks: 36`]*. Failure: `bond_change` negative.
- **`town.bell_tower_cracked` — The Crack Reopened** (missed). Heart 0.45, one step, "Talk the fee out". "{name} was not at the bell tower when the bell rang on market day. A new crack opened above the new courses as the bell swung, and nobody from the work was there to see it. {cast:councillor} has come looking for {name}, and holds back the rest of the fee until the crack is looked at." Success: small bond move *[`bond_change`, `withAgentId: '$cast:councillor'`]*. Failure: bond loss + `reputation_with` `targetAgentId: '$cast:councillor'` `−0.04` *[Pass 3 correction: was `reputation_with $here −0.04`; `$here` binds to wherever the mortal stands, and the missed branch fires away from the tower, so the loss would land on an unrelated place. No sentinel reads the missed appointment's place]*. *[Pass 3 caveat, prose rule 7b: "until the crack is looked at" names no enacting effect — end the sentence at "holds back the rest of the fee", or give success a small `#trade` pool; a bond-only success must not claim payment.]*

## 18. Concept Art Direction

1. *Emotions:* the weight of something old that other people trusted, the pressure of being the last one sent for, relief that is not yet payment.
2. *Evocative image:* a bell rope tied off short against a cracked stone wall, timber props wedged at its foot, sawdust and stone dust on the flags, and a single iron tie-bar lying bent where it was pulled out. No people. Evening light from one side.

## 19. Self-Audit

| Item | Verdict |
|---|---|
| Narrator's 12 questions | PASS — see § 20 |
| Opening ≤80 words | PASS (78, honestly recounted; draft's 72 was wrong) |
| Hand 4–8 composed, ≤2 specials + deal | PASS |
| ≥4 spheres, ≥1 common | PASS (specials 4 spheres; deal supplies a common) |
| Every nudge failure fragment; no big-delta | PASS (max Δ 0.12) |
| Six StepOutcomes covered per step by specials | PASS |
| No digits in effect lines; no name word repeated | PASS |
| Card faces name nothing the scene has not established | PASS (Show The Hidden no longer names the arch) |
| Consequence hand wired | PASS — possession (rewardPool), knowledge (intelligence) |
| Appointment has missed branch; both sequels authored | PASS |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), intelligence (step 1 success), appointment seed (step 1 success) |
| Chip ≤15 words; page read clean per band | PASS (see § 15) |
| No class scenery in outcome fields | PASS ({location} throughout) |
| Prose rule 7 | PASS — no asserted history; the lodge, the tremor, and the fee are scene-local |
| Prose rule 7b | PASS — the only later-tense promise (fee at the tower on market day) is the appointment |
| Support bundle class-honest | PASS — councillor roles seeded in hamlet (elder) and town/city (clerk, merchant, noble); lodgemaster spawns a mason where none is seeded |

## 20. The narrator's 12 questions

1. P1 arrival with graph names — yes: `{actor}`, `{location}`, sent for by the council.
2. P2 events with costs paid — the tremor cracked it; the lodge's iron failed and the crack spread.
3. P3 one stake — plea: {cast:councillor} asks {actor} to save the tower; half the fee is paid, the rest is owed on market day, and the cost of failing is stated.
4. ≤80 words — 78.
5. Read aloud as a report — yes.
6. Stated, never encoded — "now it leans", "the crack spread", "will think less of them".
7. Every sentence works — each is the challenge, the test or the stake.
8. Nothing unintroduced — the lodge, the iron, the fee, market day and the bell appear before any card or chip names them; the iron ties' danger and the lodge's master are stated on step 1 before its specials; the hidden arch is named only after the step-0 roll.
9. One named person per beat — step 0 `{cast:councillor}`, step 1 `{cast:lodgemaster}`.
10. Stake in a sentence — "Can the outside mason save the lodge's cracked tower, be paid for it, and keep their name?"
11. Cards verb+noun, spell-style — yes.
12. Opening per class — `rural` and `urban`.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (the crack, the tower's sinking, the lodge's master, the iron ties, the upper tower all named before the hand) · 4 YES · 4b YES (after editorial fixes) · 5 YES · 6 YES (essence on every special) · 7 YES · 8 YES (Show The Hidden no longer names the answer) · 9 YES (reveal / delay / someone's knowledge / raw weight — four different questions) · 9b YES · 10 YES · 11 YES (named councillor, lodge master; sheet-word nouns) · 11b YES (page read § 15; editorial § 6b) · 12 N/A (short) · 13 N/A (short) · 14 YES.

## 21. Systems field completions (Pass 3 — required fields the packet left unwritten)

Built only from sentences already in the packet; the package pass may tune the wording but must keep every field.

- **Step 1 `encounter_seed.seedLabel`** (required): "The rest of the fee is paid at the tower when the bell rings on market day."
- **`appointment.missed.seedLabel`** (required): "Nobody from the work was at the bell tower when the bell rang on market day, and {cast:councillor} comes looking with the fee held back." *(Names where they were not, the well-sinking form; the missed sequel itself stays placeless.)*
- **`appointment`**: `windowTicks` omitted → `APPOINTMENT_WINDOW_TICKS` (12); `missed.delayTicks` omitted → `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` (12).
- **Step 1 `intelligence`** (`label` and `detail` required): `{ kind: 'intelligence', category: 'cultural_knowledge', label: "How the lodge's tower stands", detail: "The lodge's hidden arch inside the wall carries the bell, and the crack runs beside it.", reliability: 0.85, targetAgentId: '$actor' }`.
- **Spine writes**: step 0 `failureMetadata.effects` `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.03 }`; step 1 `successMetadata.effects` `{ …, delta: 0.06 }`; step 1 `failureMetadata.effects` `{ …, delta: -0.06 }`.
- **Support bundle `supportRole`** (required string): `councillor` → `'councillor'`; `lodgemaster` → `'lodge_master'`. Shape as the well precedent (`kind: 'actor'`, `key`, `delivery`, `persistence`, `reuseNpcRoles`, `spawnNpcRole`, `spawnName`).
- **Chip declarations** (well-sinking shape): BOND/SCAR `stateNoun { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` + concept `"thinks well of"` / `"thinks less of"` with `tooltipId: 'ui.standing'`; BOON `stateNoun { text: 'knowledge', tooltipId: 'ui.knowledge' }` (the counting-house precedent); PATH `kind: 'future_hook'`, `category: 'path'`, `stateNoun { text: 'appointment', entityId: '$appointment', visualKind: 'location' }`.
- **Template `tags`** (recommended, not required): `['#build']`, the well precedent's family tag. No reach or sphere tag.
- **Sequels**: `intrinsicTier: 'background'`, `rarityTier: 2`, `scale: 'local'`, `apCost: 1`, `actorAffinities: ['individual']`, `failBehavior: 'fail_action'`, `drawable: false`, no `locationSubtypes` — as `well-sinking-sequels.ts`.
