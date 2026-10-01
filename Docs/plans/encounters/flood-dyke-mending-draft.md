# Encounter Pipeline: The Failing Dyke
> Scale: medium | Slug: flood-dyke-mending | Pass: draft
> Date: 2026-10-01 | Pipeline version: 2.0
> Template: `encounter.town.flood_dyke_mending` · Batch: expert-everyday-3, slot 3 (THR-1680) · Brief: `Docs/plans/encounters/expert-everyday-3-brief.md`

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | The village dyke is failing as the river rises, and nobody knows why. |
| Title | **The Failing Dyke** — the complication in three words. |
| Shape | Puzzle – Investigation – Resolution, with the query-prize face. eye 0.56 (`continue_weakened`) → stone 0.64 (`continue_weakened`) → stone 0.68 (`fail_action`). Linear, branch count 0. Mean 0.627, window fit 0.767. |
| Setting | `rural` only (rolled `ruin` overridden in the brief: the old culvert is the ruin). |
| Stake (P3) | mystery (rolled): nobody knows why that section fails. Compounded on purpose with the rolled `competitor` role: a cheaper crew the reeve also hired. |
| Opposition | time (rolled): the meltwater crest. |
| Agent role | competitor (brief override): racing the river and a rival crew. |
| Scale | personal / village. `scale: 'local'`. |
| System target | conditions (rolled): a location condition on `$here`. |
| Plot hook | rolled `hook.descent_into_darkness`, `hook.harvest_reckoning`, `hook.environmental_gauntlet` · **taken `hook.harvest_reckoning`** — the winter wheat behind the dyke is the village's harvest; failure leaves the place Blighted. |
| Consequence hand (binding) | `story_seed` + `place`. story_seed = `encounter_seed` `query: { kind: 'encounter_template', tags: ['#fellowship_errand'] }` on final-step success. place = `apply_condition` `trait.condition.location.harvest_blight` on `$here` on final-step failure. No swap. |
| Query prize | step 2 `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#ancient'] }` — what the first builders left under the culvert's keystone. |
| Standing | `reputation_with $here` +0.06 on step 2 success, −0.06 on step 2 failure; −0.02 on steps 0 and 1 failure (backs the critical_failure chip on every route, since a critical failure at any step ends the action). |
| Cast | `ganger` — the rival crew's leader, must-persist. The reeve is a role noun. |
| Systems | cast · rewards · seeds · conditions · reputation = 5. |
| Mortal choice | None in the steps — this is a test. The choice lives in the aftermath reactions (credit the other crew, or name the sack wall). |
| Cool failure | Nobody dies, nobody is jailed. Failure is the village's harvest and the mason's name in the valley. |
| Cost channels | All specials priced in essence. No Heavy Hand, no rider. |

## 1. Inspiration Anchors

- **Ordeal — The Environmental Gauntlet** (rolled hook): the river is the threat and it has a schedule. Contributed the clock — the crest arrives tonight whatever anyone does.
- **Event — The Harvest Reckoning** (taken hook): the dyke guards the winter wheat. Contributed the stake for the village and the place condition on failure: a drowned field is a short year.
- **Ordeal — Descent Into Darkness** (rolled, not taken): survives only as the culvert — an old structure under the bank that someone has to dig down to.
- Anti-patterns avoided: the "monster in the culvert" (no fight gate on an everyday board), the prize described in prose (it is drawn by tag and named by the engine), the rival as a villain (the cheap crew is just cheaper).

## 2. Scale Justification

Medium: three beats (find, dig, hold), and an expert rarity. The outcome touches one village's year and one mason's name in the valley, which is what an expert everyday job should risk. Medium means reaction choices are owed.

## 3. Pressure Knot

The thaw has started in the hills. The river is rising and a soft stretch of the dyke is already seeping. The reeve has hired two parties: the expert, and a cheaper crew who are piling sacks on top of the soft stretch. The crest comes down tonight either way.

## 4. Intervention Fantasy

The god watches a mason race a river. The hand reaches into memory (an old builder's trick), the ground (water drawn up to show the leak), the body (a crew that does not tire), chance (a rival's small troubles) and the weather up the valley (a cold night that holds the crest back). None of it tells the mason what to dig.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | the mortal | protagonist, sent for by the reeve |
| `{cast:ganger}` | actor, must-persist | leads the cheaper crew; spawn `mason` / reuse `wanderer`; spawnName **Tam Hesketh** |
| the reeve | role noun | pays whoever's work stands in the morning |
| `{location}` (`$here`) | location | the village; carries the standing edge and, on failure, Blighted Harvest |
| the old culvert | scene fiction | under the soft stretch; its roof has fallen in |
| the prize | `possession` drawn by `#ancient` | engine-named |
| the Builders' Fellowship | family tag `#fellowship_errand` | the seed's query |

## 6. Beat Structure

1. **Find why it fails** (eye 0.56, `continue_weakened`). The investigation gate: the old culvert under the soft stretch is revealed in the afterimages, never in the opening.
2. **Dig to the culvert** (stone 0.64, `continue_weakened`). Dig down through the dyke and clear the fallen stone while the rival crew piles sacks over the hole.
3. **Close the dyke before the crest** (stone 0.68, `fail_action`). Set a new roof on the culvert and close the bank over it before the water arrives.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Fields dry, the prize, the fee, the valley hears | nothing | Fellowship seed; standing up |
| success | Fields dry, the prize, the fee | a hard day | Fellowship seed; standing up |
| success_at_cost | Dyke holds, the prize | a strip of wheat, or a quarrel with the crew | Fellowship seed; standing up (net) |
| failure | Fields drowned | the fee, the harvest | Blighted Harvest on the village; standing down |
| critical_failure | The soft stretch breaks | the mason's name in the valley | standing down |

## 10. Sample Opening

**Opening (rural):**
> {actor} arrives at {location} as the river rises with the thaw.

**Spine (step 0 narrative):**
> The dyke that keeps the river off the lower fields has a soft section, and water is seeping through it. The winter wheat is sown behind it.
>
> Nobody knows why that section is failing. The reeve has sent for {actor} to find out and mend it before the meltwater crest. The reeve also hired {cast:ganger}'s cheaper crew, who are piling sacks on top.

Word count: 11 + 26 + 36 = 73.

## 11. The Hand Per Step

### Step 0 — Find why it fails (eye 0.56) · purpose "Find why it fails"
`deal: { count: 3, tags: ['insight', 'labor'] }`

**Afterimages**
- critical_success: "They found an old stone culvert under the soft section, its roof fallen in, and the ditch it drains into."
- success: "They found an old stone culvert under the dyke. Its roof has fallen in, and the river runs through the gap."
- success_at_cost: "They found the collapsed culvert, but only after {cast:ganger}'s crew had piled sacks over the place to dig."
- failure: "They walked the dyke until dark and found only wet earth. They will have to dig blind."
- critical_failure: "They read the seep wrong, and told the reeve the dyke only needed height."

Failure metadata: `reputation_with $here −0.02`.

**Specials**
1. **Recall The Old Craft** — Boost (mind) · essence 2 · Δ 0.10 · `generic.memory`
   effectLine: "Bring back a lesson they half forgot, so they know an old builder's work when they find it."
   - critical_success: "{actor} remembered how old builders ran water under a bank, and walked straight to the culvert's mouth."
   - success: "{actor} remembered that old dykes often hide a drain, and went looking for one."
   - near_miss: "{actor} remembered the old trick late, after an afternoon on the wrong stretch."
   - failure: "{actor} remembered a drain from another valley, and dug for it in the wrong place."
2. **Draw Out The Leak** — Boost (matter) · essence 2 · Δ 0.08 · `generic.matter`
   effectLine: "Pull buried water to the surface, so the soft ground shows plainly where it runs."
   - success: "Water came up in a straight wet line across the dyke, right over the old culvert."
   - success_at_cost: "The wet line showed the culvert, and showed {cast:ganger}'s crew where to pile their sacks."
   - failure: "The ground darkened all along the soft section, and showed nothing narrower than that."
   - critical_failure: "Water came up all along the bank, and the whole dyke looked worse than it was."

### Step 1 — Dig to the culvert (stone 0.64) · purpose "Dig to the culvert"
`deal: { count: 3, tags: ['craft', 'labor'] }`

**Spine:**
> The work now is to dig down through the soft section and make it sound before the crest. {cast:ganger}'s crew is still piling sacks on top, and the sacks are in the way. Wet earth slides back into the hole as fast as it is dug.

**Carryover (from step 0):** crit "They know exactly where the culvert runs." (+0.06) · success "They found the culvert before they started digging." (+0.04) · s@c "{cast:ganger}'s sacks are piled over the dig." (−0.02) · near_miss "They found the culvert late in the day." (−0.03) · failure "They are digging without knowing what is down there." (−0.05) · crit_fail "The reeve no longer trusts their reading." (−0.07)

**Afterimages**
- critical_success: "They dug down to the old culvert and had every fallen stone out of it by noon."
- success: "They dug down to the old culvert and cleared the fallen stone out of it."
- success_at_cost: "They cleared the culvert, but had to pull down part of {cast:ganger}'s sack wall to do it."
- failure: "The hole kept filling with mud, and the culvert was only half cleared by dark."
- critical_failure: "The sides of the hole slid in, and the soft section slumped toward the river."

Failure metadata: `reputation_with $here −0.02`.

**Specials**
1. **Ease Tired Backs** — Boost (life) · essence 2 · Δ 0.10 · `generic.vigor`
   effectLine: "Wash the ache out of working bodies, so a crew keeps digging long after it should stop."
   - critical_success: "Nobody on the dig stopped to rest, and nobody needed to."
   - success: "The diggers worked through the afternoon without slowing."
   - near_miss: "The diggers kept going, but the light was failing before the last stone was out."
   - failure: "The diggers worked on without tiring, and the mud came in faster than they could lift it."
2. **Trip The Rival Crew** — Stumble (chaos) · essence 1 · Δ 0.08 · opposes `ganger` · `generic.luck`
   effectLine: "Make an opponent's work go wrong in small ways, so they lose time they cannot spare."
   - success: "{cast:ganger}'s crew split three sacks and went back to the village for more."
   - success_at_cost: "{cast:ganger}'s crew lost their footing on the bank, and blamed {actor} for it in front of the reeve."
   - failure: "{cast:ganger}'s crew had every small trouble, and still kept piling sacks over the dig."
   - critical_failure: "{cast:ganger}'s crew slipped, and brought half their sack wall down into the hole."

### Step 2 — Close the dyke before the crest (stone 0.68) · purpose "Close the dyke"
`deal: { count: 3, tags: ['labor', 'peril'] }`

**Spine:**
> The crest will come down the river tonight. {actor} must set a new roof on the culvert and close the dyke over it before the water arrives. {cast:ganger} tells the reeve the sacks will hold without it. The reeve will pay whoever's work is standing in the morning.

**Carryover (from step 1):** crit "The culvert is clear with half a day to spare." (+0.06) · success "The culvert is clear before dusk." (+0.04) · s@c "{cast:ganger}'s crew is working against them now." (−0.02) · near_miss "The last of the culvert was cleared in the dark." (−0.03) · failure "The culvert is still half full of mud." (−0.05) · crit_fail "The soft section has already slumped." (−0.07)

**Afterimages**
- critical_success: "The new culvert roof was set and covered by dusk, and the crest passed without a seep."
- success: "The dyke was closed over the new culvert before the crest, and it held through the night."
- success_at_cost: "The dyke held, but the crest washed out {cast:ganger}'s sacks and flooded the nearest strip of wheat."
- failure: "The crest came before the dyke was closed, and the river went through onto the lower fields."
- critical_failure: "The crest tore out the half-built culvert and a length of the dyke with it."

Success metadata: `rewardPool { possession: 1, tagFilters ['#ancient'] }` · `encounter_seed query #fellowship_errand` (delay 48, priority 0.8) · `reputation_with $here +0.06`.
Failure metadata: `apply_condition trait.condition.location.harvest_blight $here 0.6` · `reputation_with $here −0.06`.

**Specials**
1. **Harden The Fresh Clay** — Boost (matter) · essence 2 · Δ 0.10 · `generic.ward`
   effectLine: "Make wet earth pack and set like old ground, so new work holds against the water's push."
   - critical_success: "The new bank set hard by midnight, and the crest broke against it."
   - success: "The clay over the culvert set firm before the water reached it."
   - near_miss: "The clay set, but a seep opened at the foot of the bank and ran until dawn."
   - failure: "The clay set hard, and the water went round it through the old bank beside."
   - critical_failure: "The clay set like stone, and the crest tore the whole length out in one piece."
2. **Chill The High Snow** — Boost (energy) · essence 2 · Δ 0.10 · `generic.energy`
   effectLine: "Draw the warmth out of the hills, so the thaw slows and the river rises later."
   - success: "A cold night up in the hills held the crest back until the work was done."
   - success_at_cost: "The crest came late, but it came higher than anyone had seen."
   - failure: "Frost came back to the hills, and the crest came down on time anyway."

## 12. Linear continuation

> The crest will come down the river tonight. {actor} must set a new roof on the culvert and close the dyke over it before the water arrives. {cast:ganger} tells the reeve the sacks will hold without it. The reeve will pay whoever's work is standing in the morning.

## 13. Aftermath Paragraph (per band)

- **critical_success:** "The lower fields are dry, and the winter wheat stands. Under the culvert's old keystone the first builders had left something, and the reeve gives it to {actor} with the fee. The whole valley hears whose work held."
- **success:** "The lower fields stayed dry, and the reeve paid {actor} the fee. Under the culvert's old keystone the first builders had left something, and the reeve lets {actor} keep it."
- **success_at_cost:** "The dyke holds, and most of the lower fields are dry. The reeve pays {actor} the fee, and lets them keep what the first builders left under the culvert's old keystone."
- **failure:** "The river is over the lower fields, and the winter wheat is drowned. The reeve pays {cast:ganger}'s crew for their sacks and pays {actor} nothing. {location} remembers that the mason it sent for did not hold the dyke."
- **critical_failure:** "The soft section gave way, and the river is over the lower fields. The reeve tells the valley that the mason made it worse. Nobody in {location} will send for {actor} again."
- **fallback:** "The river falls again, and {location} looks at its lower fields."

## 14. Aftermath Reaction Choices

Success side (fallback reactions, inherited by the three success bands):
- **Credit the other crew** — "The mortal tells the reeve the other crew's sacks bought time. {cast:ganger} will remember it kindly." → `bond_change $cast:ganger +0.12`.
- **Name the sack wall for what it was** — "The mortal tells the village the sacks alone would have failed. The village thinks the better of them, and the other crew will not forget it." → `reputation_with $here +0.03`, `bond_change $cast:ganger −0.12`.

Failure side (failure and critical_failure):
- **Help dig out the drains** — "The mortal stays to clear the flooded ditches, and the village marks who stayed." → `reputation_with $here +0.03`.
- **Blame the sack wall** — "The mortal tells the reeve the sacks made the breach worse, and the other crew hears of it." → `bond_change $cast:ganger −0.12`.

## 15. Aftermath Kit Summary (chips)

| Band | Chip | kind / category | stateNoun | Backing write |
|---|---|---|---|---|
| crit / success / s@c | The Dyke Held — "Their mend stood through the crest — {location} thinks well of {actor} now." | reputation / bond / gain | `reputation with {location}` ($here) | step 2 success `reputation_with +0.06` |
| crit / success / s@c | Work From the Fellowship — "Word reaches the Builders' Fellowship, which has work for {actor}." | future_hook / path / opens | `seed` | step 2 success `encounter_seed` |
| crit / success / s@c | PRIZE (engine) | item | drawn item | step 2 `rewardPool` |
| failure | Drowned Wheat — "The river took the lower fields — food in {location} will run short." | trait / scar / loss | `Blighted Harvest` (`trait.condition.location.harvest_blight`) | step 2 failure `apply_condition` |
| failure | The Dyke Failed — "Their dyke gave way — {location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | step 2 failure −0.06 |
| critical_failure | Named in the Valley — "Their work made the breach worse — {location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | −0.02 (steps 0/1) or −0.06 (step 2) |

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `ganger` (rival crew leader) | lazy-materialize-on-trigger | reuse `wanderer`, spawn `mason` "Tam Hesketh", supportRole `dyke_rival_ganger` | must-persist | the bond reactions write onto them | live |
| `$here` | the village | resolved location | n/a | standing edge, Blighted Harvest | live |

## 17. Concept Art Direction

1. *Emotions:* a race lost or won against a clock nobody controls; old work outlasting its makers; a village waiting.
2. *Image:* morning after the crest. A line of split earth sacks lying in brown standing water along the foot of a grass bank; one old dressed keystone, green with age, set upright on the bank top beside a spade. No people. Grey thaw light.

## 18. Trait hooks

1. Gate? None — an everyday board job.
2. Variant? `trait.mastery.steadfast` +0.05 ("Being Steadfast, they keep digging when the cold water comes in.") · `trait.reputation.stone.negative` −0.05 ("Being an Immovable Tyrant, they cannot get the village to dig for them.").
3. Trait-only nudge? None — the variants carry the trait read, and each step already holds two specials.
4. Trait fragment? None.

## 19. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + one opening per class | PASS (rural) |
| Opening ≤80 words | PASS (73) |
| Hand 4–8 composed, ≤2 specials, deal declared | PASS (2 + 3 each step) |
| Every special has a failure-band fragment | PASS |
| All six StepOutcomes covered per step | PASS |
| No digits in effect lines; verb+noun names | PASS |
| Effect line repeats no word of its name | PASS (checked) |
| Consequence hand wired (story_seed + place) | PASS |
| Query prize tag live (`#ancient`, 24 items) | PASS |
| Seed query family live (`#fellowship_errand`, 5 members) | PASS |
| Chips backed per route | PASS (critical_failure carries only the standing chip, backed on all three routes) |
| Systems ≥3 | PASS (5) |
| Reactions for medium | PASS |

## 20. Experience Differentiator Gate

1 YES · 2 YES · 3 YES (sacks, crew, culvert, crest, wheat all in the spines) · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (memory vs ground; bodies vs rival; clay vs weather) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES (generosity to a rival vs public credit at the rival's cost; staying to help vs shifting blame) · 14 YES.
