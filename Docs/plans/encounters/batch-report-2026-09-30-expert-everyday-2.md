# Encounter batch report — 2026-09-30

**Batch:** 6 encounter(s)
**Brief:** `Docs/plans/encounters/expert-everyday-2-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.boundary_survey` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.boundary_survey) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.boundary_survey) |
| `encounter.town.toll_gate_writ` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.toll_gate_writ) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.toll_gate_writ) |
| `encounter.town.wolf_winter_watch` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.wolf_winter_watch) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.wolf_winter_watch) |
| `encounter.town.pawnbrokers_strongroom` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, seeds, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.pawnbrokers_strongroom) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.pawnbrokers_strongroom) |
| `encounter.town.harvest_almanac` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.harvest_almanac) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.harvest_almanac) |
| `encounter.town.oath_breaker_rite` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.oath_breaker_rite) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.oath_breaker_rite) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**0 of 6** encounter(s) author a content query; **0** resolved one live.

> ⚠️ **Zero queries authored.** The batch brief's die-B floor (`query_prize`, ≥1 per batch of six) exists to stop this. Two consecutive batches at zero is the retro's "dead primitive" finding for the content query — record it if this is the second.

## Appointment census

**1 of 6** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.boundary_survey`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.boundary_survey` | 🔗 connected | The surveyor's standing with the village rises or falls (shown on the village's page), a map item and a written note of why the reeve moved the stones land on their sheet, and a success books them to be back in the village in three days for the beating of the bounds with the lord's steward — keep it and the village holds a feast, the steward pays the lord's share of the fee and warms to them; miss it and the steward comes to find them, and thinks less of them if they cannot answer for the survey. |
| `encounter.town.toll_gate_writ` | 🔗 connected | A mortal who names the forged writ false finds the old seal-cutter, gains standing with the town, knows who copies the toll seal, and sets off down the road, then either earns the family's leader's regard or has the toll-master owe them a favour; a mortal who vouches for the family instead has the family's leader owe them a favour and learns the same name secondhand, then either wins back the toll-master's regard or deepens the family's trust; a loss on either path costs standing with the town. |
| `encounter.town.wolf_winter_watch` | 🔗 connected | Holding the fold leaves the village thinking better of the mortal and marked Under Watch for a week, which makes quiet work there harder (the thing that stops the next drover staking carrion), plus the drover's secret to keep as a favour he owes or to spend by naming him; losing the fold leaves the village thinking less of the mortal, who may stay to help with the losses or take the reeve's side against the drover. |
| `encounter.town.pawnbrokers_strongroom` | 🔗 connected | Getting the box out first pays the mortal a #stealth item from the cooper's box and plants a sequel in which the buyer who lost it sends them to a back-room broker (Black Market Deal); losing it leaves the town where the pawnbroker named them thinking less of them and gives the mortal an urge to steal for a few days, while the buyer's hired thief (Wren Hollis, or a reused lookout) stays in the world. |
| `encounter.town.harvest_almanac` | 🔗 connected | Calling the harvest right raises the mortal's standing with the village where it happened, gives them the Build a Great Work ambition and sets them on the road to the nearest settlement; calling it wrong lowers that standing and leaves them helping others before their own work for a while, and the village elder stays in the world as a persistent person a later encounter there can meet again. |
| `encounter.town.oath_breaker_rite` | 🔗 connected | The town where the rite was held keeps the result: a Tended Shrine that makes the next Veil rite there easier, or Under Watch that makes quiet Shadow work there harder, plus the mortal's standing with that town up or down; a failed release also leaves the mortal Cursed for a while, and the weaver and the hedge-priest stay in the town as named people. |

## Verdict roll-up

- **Gate green:** 6 / 6
- **Live proved:** 1 / 6
- **Live vacuous:** 0 / 6

## Per-encounter detail

### `encounter.town.boundary_survey`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.boundary_survey) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.boundary_survey) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: bounds.loose_the_wind, bounds.call_up_the_oath)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- ❌ `appointment_kept` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block
- ❌ `appointment_missed` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 16 words

The boundary between the lord's land and the common in {location} has been surveyed, or lost.

**`fallback/critical_success`** · 54 words

{cast:steward} told the lord's men the survey was fair. The assize paid {actor} in kind.

- Sworn before the village — {location} thinks well of their work.

- {cast:reeve} owed the lord — {actor} knows why the stones were moved.

- A new stone for the line — {cast:steward} witnesses it set in {location} in three days.

**`fallback/success`** · 51 words

The village has its common back. The assize paid {actor} in kind.

- Sworn before the village — {location} thinks well of their work.

- {cast:reeve} owed the lord — {actor} knows why the stones were moved.

- A new stone for the line — {cast:steward} witnesses it set in {location} in three days.

**`fallback/success_at_cost`** · 62 words

The lord's men turned {actor} off the land once before the survey was done. The assize paid them in kind all the same.

- Sworn before the village — {location} thinks well of their work.

- {cast:reeve} owed the lord — {actor} knows why the stones were moved.

- A new stone for the line — {cast:steward} witnesses it set in {location} in three days.

**`fallback/failure`** · 33 words

The lord keeps the grazing that the moved stones took from the common. {location} sent for a sworn surveyor to stop exactly that.

- No line sworn — {location} thinks less of their work.

**`fallback/critical_failure`** · 29 words

{location} sent for a sworn surveyor to win back its common, and is worse off than before.

- Their word for the lord — {location} thinks less of their work.

</details>

### `encounter.town.toll_gate_writ`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.toll_gate_writ) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.toll_gate_writ) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (2 tick(s), hand: writ.cool_their_scorn)

- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 10 words

The toll gate has its answer on the family's writ.

**`positive/critical_success`** · 113 words

The case goes up to the county court: the family for carrying the writ, the seal-cutter for making it. {actor} is sent for to swear to the reading. No one at the toll house has seen a forgery this good caught so quickly.

- The town trusts {actor}'s eye more.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Swear to the seal alone Give the court the reading and no more. The toll-master owes the mortal for a clean case.

> Speak for the family Tell the court the family bought the writ in good faith. The family's leader will think better of the mortal.

**`positive/success`** · 98 words

The case goes up to the county court: the family for carrying the writ, the seal-cutter for making it. {actor} is sent for to swear to the reading.

- The town trusts {actor}'s eye more.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Swear to the seal alone Give the court the reading and no more. The toll-master owes the mortal for a clean case.

> Speak for the family Tell the court the family bought the writ in good faith. The family's leader will think better of the mortal.

**`positive/success_at_cost`** · 101 words

The case goes up to the county court, and {actor} is sent for to swear to the reading. The family spent the whole day held at the gate while {actor} searched.

- The town trusts {actor}'s eye more.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Swear to the seal alone Give the court the reading and no more. The toll-master owes the mortal for a clean case.

> Speak for the family Tell the court the family bought the writ in good faith. The family's leader will think better of the mortal.

**`positive/failure`** · 37 words

Without the maker, the town's court would not hold the family, and let them go. The toll house asked a trained eye to settle the writ, and {actor} left it unsettled.

- The town trusts {actor}'s eye less.

**`positive/critical_failure`** · 40 words

{actor} named the writ false, and the maker was never caught. The town's court let the family go, and every carter at the gate has heard the toll house call {actor}'s reading a guess.

- The town trusts {actor}'s eye less.

**`negative`** · 10 words

The toll gate has its answer on the family's writ.

**`negative/critical_success`** · 111 words

The family is through the gate, and the toll house wrote them down as paid. On the far side, {cast:traveller} told {actor} who made the writ, and why it was sold so cheap.

- {cast:traveller} owes {actor} a favour.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Send the name to the toll house Write to the toll-master naming the seal-cutter, and leave the family out of it. The toll-master will think better of the mortal.

> Keep the family's secret whole Tell no one what the family said on the road. The family's leader will trust the mortal the more for it.

**`negative/success`** · 95 words

The family is through the gate. On the far side, {cast:traveller} told {actor} who made the writ.

- {cast:traveller} owes {actor} a favour.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Send the name to the toll house Write to the toll-master naming the seal-cutter, and leave the family out of it. The toll-master will think better of the mortal.

> Keep the family's secret whole Tell no one what the family said on the road. The family's leader will trust the mortal the more for it.

**`negative/success_at_cost`** · 106 words

The family is through the gate, and {actor}'s name is written in the toll book beside their writ. On the far side, {cast:traveller} told {actor} who made it.

- {cast:traveller} owes {actor} a favour.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Send the name to the toll house Write to the toll-master naming the seal-cutter, and leave the family out of it. The toll-master will think better of the mortal.

> Keep the family's secret whole Tell no one what the family said on the road. The family's leader will trust the mortal the more for it.

**`negative/failure`** · 47 words

The toll house read the writ again and found it false. The family was brought back from the road and held for the town's court. A trained eye passed that forgery, and under the charter it is {actor}'s to answer for.

- The town trusts {actor}'s eye less.

**`negative/critical_failure`** · 44 words

{actor} let a forged writ through the gate, and the toll house found it out the same day. The family is held for the town's court, and every carter at the gate knows whose word passed the writ.

- The town trusts {actor}'s eye less.

**`fallback`** · 10 words

The toll gate has its answer on the family's writ.

**`fallback/critical_success`** · 113 words

The case goes up to the county court: the family for carrying the writ, the seal-cutter for making it. {actor} is sent for to swear to the reading. No one at the toll house has seen a forgery this good caught so quickly.

- The town trusts {actor}'s eye more.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Swear to the seal alone Give the court the reading and no more. The toll-master owes the mortal for a clean case.

> Speak for the family Tell the court the family bought the writ in good faith. The family's leader will think better of the mortal.

**`fallback/success`** · 98 words

The case goes up to the county court: the family for carrying the writ, the seal-cutter for making it. {actor} is sent for to swear to the reading.

- The town trusts {actor}'s eye more.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Swear to the seal alone Give the court the reading and no more. The toll-master owes the mortal for a clean case.

> Speak for the family Tell the court the family bought the writ in good faith. The family's leader will think better of the mortal.

**`fallback/success_at_cost`** · 101 words

The case goes up to the county court, and {actor} is sent for to swear to the reading. The family spent the whole day held at the gate while {actor} searched.

- The town trusts {actor}'s eye more.

- {actor} knows where the false writs on this road come from.

- {actor} is travelling away from {location} now.

> Swear to the seal alone Give the court the reading and no more. The toll-master owes the mortal for a clean case.

> Speak for the family Tell the court the family bought the writ in good faith. The family's leader will think better of the mortal.

**`fallback/failure`** · 37 words

Without the maker, the town's court would not hold the family, and let them go. The toll house asked a trained eye to settle the writ, and {actor} left it unsettled.

- The town trusts {actor}'s eye less.

**`fallback/critical_failure`** · 40 words

{actor} named the writ false, and the maker was never caught. The town's court let the family go, and every carter at the gate has heard the toll house call {actor}'s reading a guess.

- The town trusts {actor}'s eye less.

</details>

### `encounter.town.wolf_winter_watch`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.wolf_winter_watch) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.wolf_winter_watch) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (5 tick(s), hand: wolf.reveal_the_trail, wolf.guard_the_flames, wolf.raise_morale)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- ❌ `condition_applied` — declared a condition effect on this run's path but none applied — no trait change and no additive condition effect trace
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 54 words

The snow stops, and {location} counts its flock.

> Name the drover to the village The mortal names the drover to {location}. The village thinks the better of them, and the drover will not forget it.

> Keep the drover's secret The mortal keeps quiet about the carrion, and the drover owes them for the silence.

**`fallback/critical_success`** · 96 words

{cast:reeve} turns down the drover's offer and sends {cast:drover} home. {actor} has told no one who staked the carrion past the last fold.

- Not one ewe lost all night — {location} thinks well of {actor} now.

- Their watch stays on the folds — quiet work in {location} is harder now.

> Name the drover to the village The mortal names the drover to {location}. The village thinks the better of them, and the drover will not forget it.

> Keep the drover's secret The mortal keeps quiet about the carrion, and the drover owes them for the silence.

**`fallback/success`** · 100 words

{cast:reeve} turns down the drover's offer, and the flock stays in {location}. {actor} has told no one who staked the carrion past the last fold.

- Kept the pack out of the great fold — {location} thinks well of {actor} now.

- Their watch stays on the folds — quiet work in {location} is harder now.

> Name the drover to the village The mortal names the drover to {location}. The village thinks the better of them, and the drover will not forget it.

> Keep the drover's secret The mortal keeps quiet about the carrion, and the drover owes them for the silence.

**`fallback/success_at_cost`** · 116 words

{cast:reeve} turns down the drover's offer, and the flock stays in {location}. {actor} gives the fee to the shepherds who lost ewes this winter. {actor} knows now that {cast:drover} staked the carrion past the last fold, and has told no one.

- Kept the pack out of the great fold — {location} thinks well of {actor} now.

- Their watch stays on the folds — quiet work in {location} is harder now.

> Name the drover to the village The mortal names the drover to {location}. The village thinks the better of them, and the drover will not forget it.

> Keep the drover's secret The mortal keeps quiet about the carrion, and the drover owes them for the silence.

**`fallback/failure`** · 89 words

{cast:reeve} agrees to sell what is left of the flock to {cast:drover}, at the drover's price. This is what {cast:drover} staked carrion past the last fold to get.

- The fold fell under their command — {location} thinks less of {actor} now.

> Help the village count its losses The mortal stays to bury the dead ewes and mend the folds, and the village marks who stayed.

> Speak against the sale The mortal tells the reeve the flock is worth more than the drover offers, and the drover hears of it.

**`fallback/critical_failure`** · 91 words

{cast:reeve} agrees to sell the flock to {cast:drover} for a handful of coin, before the pack takes the rest. Every village in the valley hears whose command it was.

- Found wanting in the worst of winter — {location} thinks less of {actor} now.

> Help the village count its losses The mortal stays to bury the dead ewes and mend the folds, and the village marks who stayed.

> Speak against the sale The mortal tells the reeve the flock is worth more than the drover offers, and the drover hears of it.

</details>

### `encounter.town.pawnbrokers_strongroom`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.pawnbrokers_strongroom) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.pawnbrokers_strongroom) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (4 tick(s), hand: strongroom.quiet_the_cellar_stair, strongroom.hold_the_coal_hatch)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 13 words

Morning comes to the fair. The cooper's box has left the pawnbroker's strongroom.

**`fallback/critical_success`** · 38 words

The cooper has his father's box back, and paid {actor} from inside it before the fair opened. The pawnbroker cannot cry theft without admitting he broke his word.

- The buyer who lost the box will send for {actor}.

**`fallback/success`** · 37 words

The cooper has his box back and paid {actor} from inside it. The pawnbroker has lost his sale, and cannot complain without admitting he broke his word.

- The buyer who lost the box will send for {actor}.

**`fallback/success_at_cost`** · 27 words

The cooper has his box and paid {actor} from inside it, but the job was not clean.

- The buyer who lost the box will send for {actor}.

**`fallback/failure`** · 46 words

{cast:rival} took the cooper's box to the buyer at the fair gate. The pawnbroker found his lock opened and told {location} who he thinks did it.

- Outrun by a hired thief — They look for a lock to prove themselves on.

- {location} thinks less of {actor}.

**`fallback/critical_failure`** · 30 words

The pawnbroker found {actor} below his house with empty hands, so he could not hold them. By noon the whole fair had heard his story.

- {location} thinks less of {actor}.

</details>

### `encounter.town.harvest_almanac`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.harvest_almanac) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.harvest_almanac) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (2 tick(s), hand: harvest.stoke_their_pride)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 8 words

The storm has come and gone over {location}.

**`fallback/critical_success`** · 64 words

The last cart was in the barn when the storm broke. {cast:elder} brought the whole village out to thank {actor} with the first loaf of the new grain.

- {location} trusts {actor}'s reading of the sky.

- Sent for by the nearest settlement — {actor} is set on the road there.

- Means to build for the valley — {actor} is pursuing Build a Great Work now.

**`fallback/success`** · 57 words

The barley was in before the storm, though the last carts came home wet. {location} has its grain for the winter.

- {location} trusts {actor}'s reading of the sky.

- Sent for by the nearest settlement — {actor} is set on the road there.

- Means to build for the valley — {actor} is pursuing Build a Great Work now.

**`fallback/success_at_cost`** · 59 words

The changed day cost the village one field, cut half green. The rest came in dry, and {cast:elder} thanked {actor} all the same.

- {location} trusts {actor}'s reading of the sky.

- Sent for by the nearest settlement — {actor} is set on the road there.

- Means to build for the valley — {actor} is pursuing Build a Great Work now.

**`fallback/failure`** · 42 words

The storm came first. It flattened the south fields, and half the barley is lost. No one in {location} blames {actor} out loud.

- {location} trusts {actor}'s reading of the sky less.

- For a while {actor} puts helping others before their own work.

**`fallback/critical_failure`** · 63 words

The storm broke days before the cut. Most of the barley lies flat in the mud, and {location} has too little grain for the winter. The village staked its year on the best reader it could find, and the best reader got it wrong.

- {location} trusts {actor}'s reading of the sky less.

- For a while {actor} puts helping others before their own work.

</details>

### `encounter.town.oath_breaker_rite`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.oath_breaker_rite) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.oath_breaker_rite) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: oath.remember_old_ways)

- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 16 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 8 words

{actor} held the old rite at the stone.

**`positive/critical_success`** · 42 words

The oath came off the stone before midnight, in front of half the town. {cast:priest} handed the weaver's coin back where everyone could see.

- Rites at the shrine in town take more easily now.

- The town trusts {actor}'s word on oaths more.

**`positive/success`** · 47 words

The oath came off the stone, and the shrine lamp stayed lit when {cast:oathbreaker} walked in. {cast:priest} kept the coin, and the rival rite ended to an empty square.

- Rites at the shrine in town take more easily now.

- The town trusts {actor}'s word on oaths more.

**`positive/success_at_cost`** · 42 words

Most of the crowd had gone home before the old rite ended. The oath is off the stone, and {cast:priest} kept the weaver's coin.

- Rites at the shrine in town take more easily now.

- The town trusts {actor}'s word on oaths more.

**`positive/failure`** · 55 words

The oath is still on the stone, and part of it caught on {actor}. {cast:priest} kept the crowd in the square and blamed the strangers at the gate.

- Misfortune clings to {actor} for a while.

- The town watches every newcomer now, and quiet work there is harder.

- The town trusts {actor}'s word on oaths less.

**`positive/critical_failure`** · 52 words

The whole crowd saw the rite fail. {cast:priest} told the square that the strangers had brought the curse, and that {actor} was one of them.

- Misfortune clings to {actor} for a while.

- The town watches every newcomer now, and quiet work there is harder.

- The town trusts {actor}'s word on oaths less.

**`negative`** · 6 words

{actor} refused to hold any rite.

**`negative/critical_success`** · 38 words

The crowd went home before the rite ended. The strangers at the gate were never named, and {cast:oathbreaker} knows now that there is no curse, only an oath still owed.

- The town trusts {actor}'s word on oaths more.

**`negative/success`** · 26 words

The crowd went home, and {cast:priest} ended the rite early. No one named the strangers at the gate.

- The town trusts {actor}'s word on oaths more.

**`negative/success_at_cost`** · 25 words

The crowd went home, but {cast:oathbreaker} stayed in the square with {cast:priest}, still sure of a curse.

- The town trusts {actor}'s word on oaths more.

**`negative/failure`** · 38 words

{cast:priest} named the strangers at the gate as the cause of the curse, and the crowd believed it.

- The town watches every newcomer now, and quiet work there is harder.

- The town trusts {actor}'s word on oaths less.

**`negative/critical_failure`** · 37 words

{cast:priest} named the strangers at the gate, and named {actor} with them. The square believed every word.

- The town watches every newcomer now, and quiet work there is harder.

- The town trusts {actor}'s word on oaths less.

**`fallback`** · 6 words

{actor} left before any rite began.

**`fallback/success`** · 12 words

{actor} left the shrine with the reading done and no rite held.

**`fallback/failure`** · 12 words

{actor} left the shrine unsure, and the rite went ahead without them.

**`fallback/critical_failure`** · 19 words

{actor} told the weaver the curse was real and left before midnight. The priest's rite went ahead without them.

</details>

## Live proof beyond the default run

The table above renders one seed (42) with the cheapest hand. At expert difficulty (steps 0.56–0.68) the proof's ascendant is not an expert, so five of the six natural runs land on `failure` and the success-side blocks are never on the path the proof takes. As in batch 1, the live evidence is the proof itself run with the engine's `setOutcomePin` (the `?outcome=` lever) set before the spawn, through a scratch wrapper. The pin substitutes the band at the tail of step resolution, so every downstream consequence fires as a real one would. Forked encounters were driven down each arm by dropping one step-0 lean card per run.

**Pinned bands, seed 42, `--play all`:**

| Encounter | `critical_success` | `success` | `success_at_cost` | `failure` | `critical_failure` |
|---|---|---|---|---|---|
| `encounter.town.boundary_survey` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.toll_gate_writ` — Seeker arm | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.toll_gate_writ` — Sentinel arm | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.wolf_winter_watch` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.pawnbrokers_strongroom` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.harvest_almanac` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.oath_breaker_rite` — Archivist arm | ✅ | ✅ | ✅ | ✅ | ✅ |
| `encounter.town.oath_breaker_rite` — Heretic arm | ❌ ² | ❌ ² | ❌ ² | ✅ | ✅ |

**Every success-side pinned band proves on every arm but the oath rite's Heretic arm (²).**

**The appointment, live (pinned `success`, seed 42).** The boundary survey's seed planted with its appointment block (the new stone set at the beating of the bounds, the steward as witness). In the **kept** arm the mortal was present at tick 41 (due 41, window 12), and `town.bounds_beaten` spawned at tick 41. In the **missed** arm the mortal stood elsewhere, the miss closed at tick 54 (`unreachable`, window closed 53), the seed was consumed, and `town.bounds_stone_uprooted` found the mortal at tick 66. The census row above reads 0 kept / 0 missed only because the default run failed its step. `encounterSeedLiveness.test.ts` passes (17), so neither branch is a dead template.

**The query prize.** The pawned box pays its prize through a tag-filtered step `rewardPool` (`#stealth`), the shape batch 1's drowned man used. The content-query census above counts only seed queries, so it reads 0; the prize was proved landing on all three pinned success bands.

¹ **The harness's known false negative** (impediments #1111, #1113, #1118; fourth batch running). `systemSurfacesForOutcome` treats a step's `successMetadata` as band-less, so on a run whose step failed the proof still expects the success-side reward, seed or appointment. Every ❌ ¹ names `reward_node`, `seed_planted`, `condition_applied` or the appointment rows — never a block that failed to arrive on a run that reached it.

² **The same false negative, cross-arm.** The Heretic arm's success writes only `reputation_with`; the proof expects the Tended Shrine and Cursed writes that live on the Archivist arm. The `negative` variant rendered on every run.

## Judgement calls for the director (veto welcome)

- **Reaches: eye ×2, iron ×1, shadow, star, veil** instead of the ticket's literal "iron ×2" — plan D3 counts the existing iron expert toward iron's floor. Result: five reaches now meet the expert floor; gold, heart and stone remain for THR-1680.
- **The oath rite's decline arm is priced at expert odds** (veil 0.62). The shape catalog calls an opt-in exit "cheap"; under an expert-only batch no exit can be cheap in its odds. It still risks less (no Cursed, a smaller standing swing).
- **The toll gate's Sentinel arm tests Heart (0.62) on an Eye-first mortal.** Unaided it forecasts *perilous*; the hand closes most of the gap. Kept for reach variance; the mortal chooses that arm by temperament, and its failure costs only standing.
- **Success-at-cost has no band-keyed write** on the boundary survey and the pawned box (systems audits) (no per-band step predicate exists); the cost is carried in prose, as in batch 1.

## Director's sample

Ruling: Christian reviews **2** of the 6, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- **The Boundary Survey** (the batch's appointment) — [open it at the success ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.boundary_survey&outcome=success)
- **Calling the Harvest** (the batch's pleasure) — [open it at the success ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.harvest_almanac&outcome=success)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
