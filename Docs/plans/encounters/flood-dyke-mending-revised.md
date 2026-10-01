# Encounter Pipeline: The Failing Dyke
> Scale: medium | Slug: flood-dyke-mending | Pass: revised
> Revisions applied: village stake stated in P2; invented fee cut everywhere (trigger 31) and step 2's last spine sentence now names what the standing writes; "never send for again" and "the whole valley" cut (34); failure and critical_success page repetition fixed (35); three detector hits fixed (15); "another valley" history cut (31); faces renamed Trip Up A Rival, Call A Hard Frost, Harden Wet Earth (16); sacks seam echo cut (22); success_at_cost and critical_failure made path-true, every critical_failure route now ends in a breach
> Date: 2026-10-01 | Pipeline version: 2.0
> Template: `encounter.town.flood_dyke_mending` · Batch: expert-everyday-3, slot 3 (THR-1680) · Brief: `Docs/plans/encounters/expert-everyday-3-brief.md`

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | The village dyke is failing as the river rises, and nobody knows why. |
| Title | **The Failing Dyke** |
| Shape | Puzzle – Investigation – Resolution, query-prize face. eye 0.56 (`continue_weakened`) → stone 0.64 (`continue_weakened`) → stone 0.68 (`fail_action`). Linear. Mean 0.627, window fit 0.767. |
| Setting | `rural` only (rolled `ruin` overridden: the old culvert is the ruin). |
| Stake (P3) | mystery (rolled), compounded on purpose with the competitor role (a cheaper crew the reeve also hired). |
| Opposition | time: the meltwater crest. |
| Agent role | competitor. |
| Scale | personal / village; `scale: 'local'`. |
| System target | conditions: a location condition on `$here`. |
| Plot hook | rolled `hook.descent_into_darkness`, `hook.harvest_reckoning`, `hook.environmental_gauntlet` · **taken `hook.harvest_reckoning`**. |
| Consequence hand (binding) | `story_seed` = `encounter_seed` `query #fellowship_errand` on step 2 success · `place` = `apply_condition trait.condition.location.harvest_blight` on `$here` on step 2 failure. No swap. |
| Query prize | step 2 `successMetadata.rewardPool { possession: 1, tagFilters ['#ancient'] }`. |
| Standing | `reputation_with $here` +0.06 / −0.06 on step 2; −0.02 on steps 0 and 1 failure. |
| Cast | `ganger`, must-persist. The reeve is a role noun. |
| Systems | cast · rewards · seeds · conditions · reputation = 5. |
| Mortal choice | None in the steps (a test). The choice is in the reactions. |
| Cost channels | All specials essence-priced. No Heavy Hand, no rider. |

## 1. Inspiration Anchors

- **Ordeal — The Environmental Gauntlet:** the river is the threat, on a schedule.
- **Event — The Harvest Reckoning** (taken): the dyke guards the winter wheat; failure leaves the village a Blighted Harvest.
- **Ordeal — Descent Into Darkness:** survives only as the culvert under the bank.
- Avoided: a monster in the culvert, a prize described in prose, a villainous rival.

## 2. Scale Justification

Medium: three beats and an expert rarity. One village's year and one mason's name are at stake. Reactions owed and present.

## 3. Pressure Knot

The thaw has started. The river is rising, a soft stretch of the dyke is seeping, and the reeve has hired two parties to fix it. The crest comes tonight.

## 4. Intervention Fantasy

The god watches a mason race a river, and reaches into memory, the ground, tired bodies, a rival's luck, the weather and wet earth. None of it tells the mason what to dig.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | the mortal | sent for by the reeve |
| `{cast:ganger}` | actor, must-persist | leads the cheaper crew; reuse `wanderer`, spawn `mason` "Tam Hesketh", supportRole `dyke_rival_ganger` |
| the reeve | role noun | — |
| `{location}` / `$here` | location | standing edge; Blighted Harvest on failure |
| the old culvert | scene fiction | revealed by step 0's afterimages |
| the prize | `possession`, `#ancient` | engine-named |
| the Builders' Fellowship | `#fellowship_errand` | seed query |

## 6. Beat Structure

1. **Find why it fails** — eye 0.56, `continue_weakened`.
2. **Dig to the culvert** — stone 0.64, `continue_weakened`.
3. **Close the dyke** — stone 0.68, `fail_action`.

## 7. Branching Profile

Linear — no branching.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Fields dry, the prize given in front of the village | nothing | Fellowship seed; standing up |
| success | Fields dry, the prize | a hard day | Fellowship seed; standing up |
| success_at_cost | Dyke holds, the prize | time and the reeve's confidence | Fellowship seed; standing up (net) |
| failure | Fields drowned | the harvest | Blighted Harvest on the village; standing down |
| critical_failure | The soft section breaks | the mason's name | standing down |

## 10. Opening and spine (verbatim)

**Opening — rural:**
> {actor} arrives at {location} as the river rises with the thaw.

**Step 0 spine:**
> The dyke that keeps the river off the lower fields has a soft section, and water is seeping through it. If it breaks, the river will drown the winter wheat.
>
> Nobody knows why that section is failing. The reeve has sent for {actor} to find out and mend it before the meltwater crest. The reeve has also hired {cast:ganger}'s cheaper crew, who are piling sacks on top.

## 11. Steps and hands (verbatim)

### Step 0 — eye 0.56 · `continue_weakened` · purposeLine "Find why it fails"
`deal: { count: 3, tags: ['insight', 'labor'] }`

Afterimages:
- criticalSuccess: "They found an old stone culvert under the soft section, its roof fallen in, and the ditch it drains into."
- success: "They found an old stone culvert under the dyke. Its roof has fallen in, and the river runs through the gap."
- successAtCost: "They found the collapsed culvert, but only after {cast:ganger}'s crew had piled sacks over the place to dig."
- failure: "They walked the dyke until dark and found only wet earth. They will have to dig blind."
- criticalFailure: "They read the seep wrong and told the reeve the dyke only needed height. The soft section burst at the first rise of water."

failureMetadata: `reputation_with $here −0.02`.

Specials (prefix `dyke.`):

1. `dyke.recall_the_old_craft` — **Recall The Old Craft** · Boost · mind · essence 2 · Δ 0.10 · `generic.memory`
   effectLine: "Bring back a lesson they half forgot, so they know an old builder's work when they find it."
   - critical_success: "{actor} remembered how old builders ran water under a bank, and walked straight to the culvert's mouth."
   - success: "{actor} remembered that old dykes often hide a drain, and went looking for one."
   - near_miss: "{actor} remembered the old trick late, after an afternoon on the wrong stretch."
   - failure: "{actor} remembered the old trick, and dug for a drain in the wrong place."
2. `dyke.draw_out_the_leak` — **Draw Out The Leak** · Boost · matter · essence 2 · Δ 0.08 · `generic.matter`
   effectLine: "Pull buried water to the surface, so the soft ground shows plainly where it runs."
   - success: "Water came up in a straight wet line across the dyke, right over the old culvert."
   - success_at_cost: "The wet line showed the culvert, and showed {cast:ganger}'s crew where to pile their sacks."
   - failure: "The ground darkened along the whole soft section, and showed them only what they already knew."
   - critical_failure: "Water came up all along the bank, and the whole dyke looked worse than it was."

### Step 1 — stone 0.64 · `continue_weakened` · purposeLine "Dig to the culvert"
`deal: { count: 3, tags: ['craft', 'labor'] }`

Spine:
> The work now is to dig down through the soft section and make it sound before the crest. The sacks {cast:ganger}'s crew has piled are in the way of the dig. Wet earth slides back into the hole as fast as it is dug.

Carryover from step 0:
- critical_success: "They know exactly where the culvert runs." · for · +0.06
- success: "They found the culvert before they started digging." · for · +0.04
- success_at_cost: "{cast:ganger}'s sacks are piled over the dig." · against · −0.02
- near_miss: "They found the culvert late in the day." · against · −0.03
- failure: "They are digging without knowing what is down there." · against · −0.05
- critical_failure: "The reeve no longer trusts their reading." · against · −0.07

Afterimages:
- criticalSuccess: "They dug down to the old culvert and had every fallen stone out of it by noon."
- success: "They dug down to the old culvert and cleared the fallen stone out of it."
- successAtCost: "They cleared the culvert, but had to pull down part of {cast:ganger}'s sack wall to do it."
- failure: "The hole kept filling with mud, and the culvert was only half cleared by dark."
- criticalFailure: "The sides of the hole slid in, and the river broke through the soft section."

failureMetadata: `reputation_with $here −0.02`.

Specials:

1. `dyke.ease_tired_backs` — **Ease Tired Backs** · Boost · life · essence 2 · Δ 0.10 · `generic.vigor`
   effectLine: "Wash the ache out of working bodies, so a crew keeps digging long after it should stop."
   - critical_success: "Nobody on the dig stopped to rest, and nobody needed to."
   - success: "The diggers worked through the afternoon without slowing."
   - near_miss: "The diggers kept going, but the light was failing before the last stone was out."
   - failure: "The diggers worked on without tiring, and the mud came in faster than they could lift it."
2. `dyke.trip_up_a_rival` — **Trip Up A Rival** · Stumble · chaos · essence 1 · Δ 0.08 · opposes `ganger` · `generic.luck`
   effectLine: "Make an opponent's work go wrong in small ways, so they lose time they cannot spare."
   - success: "{cast:ganger}'s crew split three sacks and went back to the village for more."
   - success_at_cost: "{cast:ganger}'s crew lost their footing on the bank, and blamed {actor} for it in front of the reeve."
   - failure: "{cast:ganger}'s crew had every small trouble, and still kept piling sacks over the dig."
   - critical_failure: "{cast:ganger}'s crew slipped, and brought half their sack wall down into the hole."

### Step 2 — stone 0.68 · `fail_action` · purposeLine "Close the dyke"
`deal: { count: 3, tags: ['labor', 'peril'] }`

Spine:
> The crest will come down the river tonight. {actor} must set a new roof on the culvert and close the dyke over it before the water arrives. {cast:ganger} tells the reeve the sacks will hold without it. By morning, the village will know whose work held.

Carryover from step 1:
- critical_success: "The culvert is clear with half a day to spare." · for · +0.06
- success: "The culvert is clear before dusk." · for · +0.04
- success_at_cost: "{cast:ganger}'s crew is working against them now." · against · −0.02
- near_miss: "The last of the culvert was cleared in the dark." · against · −0.03
- failure: "The culvert is still half full of mud." · against · −0.05
- critical_failure: "The soft section has already slumped." · against · −0.07

Afterimages:
- criticalSuccess: "The new culvert roof was set and covered by dusk, and the crest passed without a seep."
- success: "The dyke was closed over the new culvert before the crest, and it held through the night."
- successAtCost: "The dyke held, but the crest washed out {cast:ganger}'s sacks and flooded the nearest strip of wheat."
- failure: "The crest came before the dyke was closed, and the river went through onto the lower fields."
- criticalFailure: "The crest tore out the half-built culvert and a length of the dyke with it."

successMetadata:
- `rewardPool: { categoryWeights: { possession: 1 }, tagFilters: ['#ancient'] }`
- `encounter_seed`: `query { kind: 'encounter_template', tags: ['#fellowship_errand'] }`, `targetAgentId '$actor'`, `delayTicks 48`, `priority 0.8`, seedLabel "The Builders' Fellowship hears who mended the old culvert under the dyke, and has work for them."
- `reputation_with $here +0.06`

failureMetadata:
- `apply_condition` `trait.condition.location.harvest_blight` on `$here`, intensity 0.6
- `reputation_with $here −0.06`

Specials:

1. `dyke.harden_wet_earth` — **Harden Wet Earth** · Boost · matter · essence 2 · Δ 0.10 · `generic.ward`
   effectLine: "Make loose ground pack and set like old ground, so new work holds against water."
   - critical_success: "The new bank set hard by midnight, and the crest broke against it."
   - success: "The clay over the culvert set firm before the water reached it."
   - near_miss: "The clay set, but a seep opened at the foot of the bank and ran until dawn."
   - failure: "The clay set hard, and the water went round it through the old bank beside."
   - critical_failure: "The clay set like stone, and the crest tore the whole length out in one piece."
2. `dyke.call_a_hard_frost` — **Call A Hard Frost** · Boost · energy · essence 2 · Δ 0.10 · `generic.energy`
   effectLine: "Draw the warmth out of the air, so snow and ice melt slower and rivers rise later."
   - success: "A cold night up in the hills held the crest back until the work was done."
   - success_at_cost: "The crest came late, but it came higher than the reeve had ever seen."
   - failure: "Frost came back to the hills, and the crest came down on time anyway."

## 12. Linear continuation

See the step 2 spine above.

## 13. Aftermath (verbatim)

`branchOnStep: 0`, `variants: {}`.

**fallback** — overview: "The river falls again, and {location} counts what it kept." · changes: none · reactions (inherited by the three success bands):
- `dyke.credit_the_other_crew` — **Credit the other crew** — "The mortal tells the reeve the other crew's sacks bought time, and their leader will remember it kindly." → `bond_change withAgentId $cast:ganger sentimentDelta +0.12`
- `dyke.name_the_sack_wall` — **Name the sack wall for what it was** — "The mortal tells the village the sacks alone would have failed. The village thinks the better of them, and the other crew's leader will not forget it." → `reputation_with $here +0.03`, `bond_change $cast:ganger −0.12`

**critical_success** — "The lower fields are dry, and not one row of wheat was lost. The reeve gives {actor} what the first builders left under the culvert's old keystone, in front of the whole village."
- BOND · `reputation with {location}` — title "The Dyke Held" — causeClause "Their mend stood through the crest" — detail "{location} thinks well of {actor} now."
- PATH · `seed` — title "Work From the Fellowship" — detail "Word reaches the Builders' Fellowship, which has work for {actor}."

**success** — "The lower fields stayed dry. The reeve lets {actor} keep what the first builders left under the culvert's old keystone."
- same two chips (ids `dyke.win.*`).

**success_at_cost** — "The dyke holds. It took {actor} longer than it should have, and the reeve saw every slip. The reeve still lets them keep what the first builders left under the culvert's old keystone."
- same two chips (ids `dyke.cost.*`).

**failure** — "The river is over the lower fields, and the winter wheat is drowned. The reeve thanks {cast:ganger}'s crew for their sacks, and walks past {actor} without a word."
- SCAR · `Blighted Harvest` (`trait.condition.location.harvest_blight`) — title "A Short Year" — detail "Food in {location} will run short this year."
- BOND · `reputation with {location}` — title "Found Wanting" — causeClause "Sent for, and found wanting" — detail "{location} thinks less of {actor} now."
- reactions:
  - `dyke.help_dig_out_the_drains` — **Help dig out the drains** — "The mortal stays to clear the flooded ditches, and the village marks who stayed." → `reputation_with $here +0.03`
  - `dyke.blame_the_sack_wall` — **Blame the sack wall** — "The mortal tells the reeve the sacks made the breach worse, and the other crew's leader hears of it." → `bond_change $cast:ganger −0.12`

**critical_failure** — "The reeve sent for a mason to save the dyke, and now blames {actor} for breaking it, in front of everyone in {location}."
- BOND · `reputation with {location}` — title "Blamed for the Breach" — detail "{location} thinks less of {actor} now."
- reactions: the same two as failure (ids `dyke.critfail.*`).

## 14. Aftermath Reaction Choices

Success side: generosity to a competitor (a warmer bond with the crew's leader) against public credit at the competitor's cost (the village's regard, the leader's grudge). Failure side: stay and help (the village's regard) against shifting blame (the leader's grudge). Each pair preserves a different future thread: the village, or the rival.

## 15. Aftermath Kit Summary

| Band | Chip | Backing write |
|---|---|---|
| crit / success / s@c | BOND reputation gain | step 2 success `reputation_with +0.06` |
| crit / success / s@c | PATH seed | step 2 success `encounter_seed` |
| crit / success / s@c | PRIZE (engine) | step 2 `rewardPool` |
| failure | SCAR Blighted Harvest | step 2 failure `apply_condition` |
| failure | BOND reputation loss | step 2 failure −0.06 |
| critical_failure | BOND reputation loss | −0.02 (step 0 or 1 route) / −0.06 (step 2 route) |

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `ganger` | lazy-materialize-on-trigger | reuse `wanderer`; spawn `mason` "Tam Hesketh"; supportRole `dyke_rival_ganger` | must-persist | the bond reactions | live |

## 17. Concept Art Direction

1. *Emotions:* a race against a clock nobody controls; old work outlasting its makers; a village waiting to see.
2. *Image:* the morning after. A line of split earth sacks lying in brown standing water at the foot of a grass bank; one old dressed keystone, green with age, set upright on the bank top beside a spade. No people. Grey thaw light.

## 18. Trait hooks

1. Gate? None.
2. Variant? `trait.mastery.steadfast` +0.05 — "Being Steadfast, they keep digging when the cold water comes in." · `trait.reputation.stone.negative` −0.05 — "Being an Immovable Tyrant, they cannot get the village to dig for them."
3. Trait-only nudge? None — two specials per step, and the variants carry the trait read.
4. Trait fragment? None.

## 19. Narrator's 12 questions

1. P1 arrival with graph names? Yes — `{actor}`, `{location}`, the thaw.
2. P2 events and costs? Yes — the soft section is seeping; the cost of a breach is stated.
3. P3 one stake? Mystery, compounded on purpose with the competing crew.
4. ≤80 words? 78.
5. Read aloud as a report? Yes.
6. Facts stated? Yes — "Nobody knows why", "If it breaks, the river will drown the winter wheat".
7. Every sentence works? Yes.
8. Nothing unintroduced? Soft section, seep, sacks, crew, crest all in the step 0 spine before any card; the culvert is introduced by step 0's afterimages before step 1 names it.
9. One named person? `{cast:ganger}`; the reeve is a role noun.
10. Stake in a sentence? Can `{actor}` find why the dyke is failing and close it before the crest, ahead of a cheaper crew?
11. Cards verb+noun? Recall The Old Craft, Draw Out The Leak, Ease Tired Backs, Trip Up A Rival, Harden Wet Earth, Call A Hard Frost.
12. Opening per class? rural, written.

## 20. Self-Audit

All PASS (see draft § 19), plus: no fee, no unenacted later-tense promise, every band's page read clean.

## 21. Experience Differentiator Gate

All 14 YES (editorial § 8).
