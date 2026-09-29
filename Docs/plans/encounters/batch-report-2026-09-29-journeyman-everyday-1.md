# Encounter batch report — 2026-09-29

**Batch:** 6 encounter(s)
**Brief:** `Docs/plans/encounters/journeyman-everyday-1-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.pilots_reckoning` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, seeds, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.pilots_reckoning) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.pilots_reckoning) |
| `encounter.town.overdue_caravan` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation, content_query | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.overdue_caravan) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.overdue_caravan) |
| `encounter.town.assize_letter` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.assize_letter) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.assize_letter) |
| `encounter.town.counting_house_dispute` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.counting_house_dispute) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.counting_house_dispute) |
| `encounter.town.bell_at_the_exchange` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.bell_at_the_exchange) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.bell_at_the_exchange) |
| `encounter.town.masons_commission` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, conditions, reputation, content_query, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.masons_commission) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.masons_commission) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**2 of 6** encounter(s) author a content query; **2** resolved one live.

Authored by: `encounter.town.overdue_caravan`, `encounter.town.masons_commission`.

## Appointment census

**1 of 6** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.masons_commission`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.pilots_reckoning` | 🔗 connected | A mortal who leads the run carries an intelligence record on the merchant house's night route, gains or loses standing with the factor Idris Vell, and is later found by a caravan master who wants a route read (The Caravan Deal); a mortal who declines only loses a little of Idris Vell's regard. |
| `encounter.town.overdue_caravan` | 🔗 connected | The merchant house's steward (a persistent named NPC) now thinks better or worse of the mortal, the mortal's thread to the god is stronger or thinner, and a new road-finding encounter is seeded on the mortal, so the next time the roads call the player sees who is asking and why. |
| `encounter.town.assize_letter` | 🔗 connected | The mortal leaves owing or owed trust with the assize clerk Wenna Loy (a relationship later encounters with her read), knowing who laid the heresy charge (a knowledge record that shapes which encounters they are drawn to), and on the road away from the town where the clerk found them, walking toward a place with something happening, which the player watches on the map. |
| `encounter.town.counting_house_dispute` | 🔗 connected | The arbiter walks away carrying the winning house's fee (Corrow's Letters of Introduction or Aldane's Assessor's Weighted Scales) and a favour owed by that house's factor, a named merchant the favour card can later call in; a refused ruling instead costs standing with the losing factor, and a critical success can raise the town's regard or leave a hidden mark of knowing both ledgers. |
| `encounter.town.bell_at_the_exchange` | 🔗 connected | The mortal walks away with a real trade item drawn from the world's #trade goods (a better one on a better ending) or, on a loss, a lean toward trading and buying that steers their next encounters, and either way the named house buyer's opinion of them moves and persists on that merchant. |
| `encounter.town.masons_commission` | 🔗 connected | A win leaves the town (the mortal's current settlement) holding a Festival and a better opinion of the mason, a tool from the town's store in their pack, and an appointment with the inspector to be back on the site when the scaffold comes down — kept, it opens more building work there; missed, the promise to the inspector breaks — while a loss leaves the town thinking less of them. |

## Verdict roll-up

- **Gate green:** 6 / 6
- **Live proved:** 3 / 6
- **Live vacuous:** 0 / 6

## Per-encounter detail

### `encounter.town.pilots_reckoning`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.pilots_reckoning) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.pilots_reckoning) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: reckoning.clear_the_sky)

- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 14 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 15 words

The wagons are in, and the house knows how its night road went this time.

**`positive/critical_success`** · 61 words

The fault was one star, copied wrong in the house's tables years ago, and {actor} steered around it. The goods sold before any rival's reached the market. {cast:factor} told every house in {location} who had read the road.

- {cast:factor} trusts {actor}'s reckoning now.

- {actor} holds an intelligence record on the house's night route.

- Merchant work will come looking for {actor} again.

**`positive/success`** · 47 words

The fault was one star copied wrong in the house's tables, and {actor} steered around it. The season's goods sold at the agreed price.

- {cast:factor} trusts {actor}'s reckoning now.

- {actor} holds an intelligence record on the house's night route.

- Merchant work will come looking for {actor} again.

**`positive/success_at_cost`** · 51 words

{actor} found the wrong star late, after the wagons had already drifted toward rough ground. The house paid for a new wheel and a crate of spoiled cloth.

- {cast:factor} trusts {actor}'s reckoning now.

- {actor} holds an intelligence record on the house's night route.

- Merchant work will come looking for {actor} again.

**`positive/failure`** · 37 words

The buyer had already bought from another house. {cast:factor} sold the season's goods at a loss and paid the drivers out of the difference.

- The run bore their name — {cast:factor} thinks less of {actor}'s reckoning now.

**`positive/critical_failure`** · 40 words

Half the load came in spoiled, and the buyer was long gone. {cast:pilot} rode in on the last wagon and told the factor to burn the tables.

- The run bore their name — {cast:factor} thinks less of {actor}'s reckoning now.

**`negative`** · 37 words

{actor} gave the house a reading and kept out of the wagons. {cast:factor} has the star tables back with the margin written on, and still has no pilot for tonight.

- {cast:factor} thinks a little less of {actor}.

**`negative/success`** · 38 words

{actor} gave the house a reading and kept out of the wagons. {cast:factor} took the tables back politely and went to find a driver willing to lead on the margin notes.

- {cast:factor} thinks a little less of {actor}.

**`negative/failure`** · 37 words

{actor} handed back the tables and kept out of the wagons. {cast:factor} did not trust the margin notes, paid a stranger to lead the run, and counted the reading as money wasted.

- {cast:factor}'s regard for {actor} fell.

**`negative/critical_failure`** · 39 words

{actor} handed back the tables and kept out of the wagons. {cast:factor} paid a stranger to lead the run, and the whole yard heard why before dusk.

- Called a guesser in public — {cast:factor}'s regard for {actor} fell hard.

**`fallback`** · 16 words

The house's wagons have gone out, and the star tables are back in the factor's hands.

**`fallback/success`** · 14 words

The house has its reading, and the factor has the tables back before dusk.

**`fallback/failure`** · 18 words

The house lost days and money on the night road, and the factor knows who read the tables.

**`fallback/critical_failure`** · 18 words

The house's run went badly wrong, and the factor said in the yard who had read the tables.

</details>

### `encounter.town.overdue_caravan`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.overdue_caravan) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.overdue_caravan) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (5 tick(s), hand: caravan.stir_the_memory, caravan.catch_the_low_sun, caravan.clear_the_sky)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `condition_applied` — template declares no condition effect
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 69 words

The search is over, one way or the other. The house knows now what the old road did with its season.

> Ride back into town beside the steward The market sees the mortal come in with the house's people, and the house marks who stood with it.

> Copy down the marker signs before leaving What the stones said stays with the mortal, whatever the house makes of the search.

**`fallback/critical_success`** · 104 words

Every wagon came home whole, and the house has its full season in the market.

- Read the night sky with the god close — The thread to {actor} runs stronger.

- Led the house to its caravan — {cast:steward} thinks well of {actor} now.

- Read a lost road right — The roads will call on {actor} again.

> Ride back into town beside the steward The market sees the mortal come in with the house's people, and the house marks who stood with it.

> Copy down the marker signs before leaving What the stones said stays with the mortal, whatever the house makes of the search.

**`fallback/success`** · 108 words

The wagons came up out of the cutting one by one, and the house has its season back.

- Picked the right fork with the god close — The thread to {actor} runs stronger.

- Found the house's caravan — {cast:steward} thinks well of {actor} now.

- Known now as a reader of old roads — The roads will call on {actor} again.

> Ride back into town beside the steward The market sees the mortal come in with the house's people, and the house marks who stood with it.

> Copy down the marker signs before leaving What the stones said stays with the mortal, whatever the house makes of the search.

**`fallback/success_at_cost`** · 81 words

The caravan came home short of one wagon's load. {cast:steward} has written the loss down against the search.

- Found the way down with the god close — The thread to {actor} runs stronger.

> Ride back into town beside the steward The market sees the mortal come in with the house's people, and the house marks who stood with it.

> Copy down the marker signs before leaving What the stones said stays with the mortal, whatever the house makes of the search.

**`fallback/failure`** · 112 words

The caravan reached town days later with half its stock spoiled. The house could not pay what it owed on the wagons.

- Lost the fork at dark — {cast:steward} thinks less of {actor} now.

- The search went cold with the god watching — The thread to {actor} runs thinner.

- Known now as a reader of roads — The roads will call on {actor} again.

> Ride back into town beside the steward The market sees the mortal come in with the house's people, and the house marks who stood with it.

> Copy down the marker signs before leaving What the stones said stays with the mortal, whatever the house makes of the search.

**`fallback/critical_failure`** · 98 words

The caravan came in a week late with most of its stock spoiled, and the house has lost its season.

- Led the search down the wrong road — {cast:steward} thinks less of {actor} now.

- Went wrong under the stars with the god watching — The thread to {actor} runs thinner.

> Ride back into town beside the steward The market sees the mortal come in with the house's people, and the house marks who stood with it.

> Copy down the marker signs before leaving What the stones said stays with the mortal, whatever the house makes of the search.

</details>

### `encounter.town.assize_letter`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.assize_letter) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.assize_letter) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (1 tick(s), hand: assize.draw_down_the_river)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 20 words

The assize has sat. The court heard the miller's case with the priest's letter on the table, or without it.

**`fallback/critical_success`** · 70 words

The letter was on the court's table a night early. The priest's oath was read, the charge did not stand, and the mill stays the miller's. Six workers keep their wages.

- Proved a sure carrier — {cast:clerk} trusts them with the assize's business now.

- Stayed for the hearing — {actor} knows who laid the heresy charge, and why.

- Left with the letter — {actor} is travelling away from {location} now.

**`fallback/success`** · 64 words

The letter was read into the record before the miller's case was called. The court heard the priest's oath and let the mill stay his.

- Proved a sure carrier — {cast:clerk} trusts them with the assize's business now.

- Stayed for the hearing — {actor} knows who laid the heresy charge, and why.

- Left with the letter — {actor} is travelling away from {location} now.

**`fallback/success_at_cost`** · 67 words

The letter reached the table as the miller's case was called, and it was read in time. The mill stays his. {actor} has not slept since setting out.

- Proved a sure carrier — {cast:clerk} trusts them with the assize's business now.

- Stayed for the hearing — {actor} knows who laid the heresy charge, and why.

- Left with the letter — {actor} is travelling away from {location} now.

**`fallback/failure`** · 35 words

The letter went back to {cast:clerk} and reached the court by carter, a day after the case was heard. The mill is forfeit.

- Misjudged the ford — {cast:clerk} trusts them less with the assize's business.

**`fallback/critical_failure`** · 36 words

The letter never reached the court. The miller was found guilty without it, the mill is forfeit, and six workers are out of wages.

- Took the wrong road — {cast:clerk} trusts them far less than before.

</details>

### `encounter.town.counting_house_dispute`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.counting_house_dispute) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.counting_house_dispute) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (2 tick(s), hand: counting.reveal_the_cost)

- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 16 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 12 words

{actor} ruled for House Corrow, and House Aldane was told to pay.

**`positive/critical_success`** · 125 words

House Aldane paid the founder in full, and called the ruling fair where the whole counting house could hear. House Corrow kept its carts. It had no coin to spare, and paid the arbiter in kind.

- Ruled for the smaller house — Corrow's factor, {cast:corrow}, owes {actor} a favour.

- The arbiter's fee — {actor} carries Corrow's seals to the houses it trades with.

- Read both ledgers through — {actor} knows who trades with whom in {location}.

> Let the market hear who ruled Let the ruling be told in the market. The town thinks better of the arbiter who made it.

> Let them keep both ledgers to themselves Say nothing of what two houses' books held. The mortal carries those figures away, and nobody knows it.

**`positive/success`** · 58 words

House Aldane paid the founder, and House Corrow kept its carts. Corrow had no coin to spare, and paid the arbiter in kind.

- Ruled for the smaller house — Corrow's factor, {cast:corrow}, owes {actor} a favour.

- The arbiter's fee — {actor} carries Corrow's seals now.

- Read both ledgers through — {actor} knows who trades with whom in {location}.

**`positive/success_at_cost`** · 60 words

Aldane paid the founder, but only after a long afternoon of argument over every clause. Corrow kept its carts, and paid the arbiter in kind.

- Ruled for the smaller house — Corrow's factor, {cast:corrow}, owes {actor} a favour.

- The arbiter's fee — {actor} carries Corrow's seals now.

- Read both ledgers through — {actor} knows who trades with whom in {location}.

**`positive/failure`** · 36 words

House Aldane would not sign. The ruling goes to the magistrate with {actor}'s name on it, and the founder is still waiting to be paid.

- A ruling Aldane refused — {cast:aldane} thinks less of {actor} now.

**`positive/critical_failure`** · 36 words

Aldane walked out and told the market the arbiter was Corrow's creature. The ruling goes to the magistrate, and {actor}'s name goes with it.

- Called bought in open market — {cast:aldane} thinks less of {actor} now.

**`negative`** · 12 words

{actor} ruled for House Aldane, and House Corrow was told to pay.

**`negative/critical_success`** · 112 words

House Corrow paid the founder, and thanked the arbiter for reading the contract plainly. House Aldane paid the arbiter's fee from its own counting room.

- Ruled by the letter — Aldane's factor, {cast:aldane}, owes {actor} a favour.

- The arbiter's fee — {actor} carries the weighing pans Aldane's own assessors use.

- Read both ledgers through — {actor} knows who trades with whom in {location}.

> Let the market hear who ruled Let the ruling be told in the market. The town thinks better of the arbiter who made it.

> Let them keep both ledgers to themselves Say nothing of what two houses' books held. The mortal carries those figures away, and nobody knows it.

**`negative/success`** · 53 words

The debt is off both houses' books. House Aldane paid the arbiter's fee from its own counting room.

- Ruled by the letter — Aldane's factor, {cast:aldane}, owes {actor} a favour.

- The arbiter's fee — {actor} carries Aldane's weighing pans now.

- Read both ledgers through — {actor} knows who trades with whom in {location}.

**`negative/success_at_cost`** · 62 words

Corrow signed only once {actor} had given the house a season to pay, and the founder waits that long. Aldane paid the arbiter's fee all the same.

- Ruled by the letter — Aldane's factor, {cast:aldane}, owes {actor} a favour.

- The arbiter's fee — {actor} carries Aldane's weighing pans now.

- Read both ledgers through — {actor} knows who trades with whom in {location}.

**`negative/failure`** · 36 words

House Corrow would not sign. The ruling goes to the magistrate with {actor}'s name on it, and the founder is still waiting to be paid.

- A ruling Corrow refused — {cast:corrow} thinks less of {actor} now.

**`negative/critical_failure`** · 36 words

Corrow walked out and told the market the arbiter was Aldane's creature. The ruling goes to the magistrate, and {actor}'s name goes with it.

- Called bought in open market — {cast:corrow} thinks less of {actor} now.

**`fallback`** · 19 words

The counting house has closed for the day. The ruling stands or falls on whether the losing house signed.

**`fallback/success`** · 10 words

The losing house signed, and the founder will be paid.

**`fallback/failure`** · 12 words

The losing house would not sign. The ruling goes to the magistrate.

**`fallback/critical_failure`** · 18 words

The losing house walked out, and the ruling goes to the magistrate with the arbiter's name on it.

</details>

### `encounter.town.bell_at_the_exchange`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.bell_at_the_exchange) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.bell_at_the_exchange) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: bell.remember_the_price, bell.cloud_the_count)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 16 words

The bell has rung and the block is empty. The floor is counting the day's takings.

**`fallback/critical_success`** · 34 words

The lot went to {actor} at a fair price. {cast:buyer} bowed to them in front of the whole floor.

- Outbid a house on its own floor — {cast:buyer} rates them as a serious bidder.

**`fallback/success`** · 22 words

The bell rang on their bid. {cast:buyer} went back to the house empty-handed.

- {cast:buyer} thinks better of them as a bidder now.

**`fallback/success_at_cost`** · 25 words

The lot is theirs, bought well past its worth, and the whole floor saw the figure.

- Outlasted the house — {cast:buyer} takes them seriously now.

**`fallback/failure`** · 54 words

The bell rang on the house's bid. The house paid more for the lot than it meant to, because of {actor}.

- For a while they will chase trade and buying before anything else.

- {cast:buyer} holds the cost against them.

- Lost at the bell — A caravan master with unsold cargo will hear of {actor}.

**`fallback/critical_failure`** · 52 words

{actor} pushed the house to its highest figure of the season, and the house still took the lot.

- One raise short — For a while they will chase the next deal first.

- {cast:buyer} will not forget them.

- Lost at the bell — A caravan master with unsold cargo will hear of {actor}.

</details>

### `encounter.town.masons_commission`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.masons_commission) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.masons_commission) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (2 tick(s), hand: commission.loosen_the_spoil, commission.harden_the_bed)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- ❌ `condition_applied` — declared a condition effect on this run's path but none applied — no trait change and no additive condition effect trace
- ❌ `appointment_kept` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block
- ❌ `appointment_missed` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 11 words

The inspector has let the pier to one of two masons.

**`fallback/critical_success`** · 82 words

{cast:inspector} let the pier to {actor} in front of {location}, while the rival's footing was still sinking into the fill. The town paid the first part of the fee in kind.

- Read the ground right — {location} thinks well of their work.

- The trial footing held — {cast:inspector} trusts {actor}'s footings now.

- The pier was shored by nightfall — {location} holds the fair it had put off.

- Let on one condition — due back on the site when the scaffold comes down.

**`fallback/success`** · 77 words

The inspector let the pier to {actor}. {cast:rival} took the refusal badly and left the site. The town paid the first part of the fee in kind.

- Their footing held — {location} thinks well of their work.

- The trial footing held — {cast:inspector} trusts {actor}'s footings now.

- The pier was shored by nightfall — {location} holds the fair it had put off.

- Let on one condition — due back on the site when the scaffold comes down.

**`fallback/success_at_cost`** · 89 words

The inspector let the pier to {actor}, but the footing that won it stood on stone they paid for themselves. The town paid the first part of the fee in kind, and they start the work out of pocket.

- Won the commission — {location} thinks well of their work.

- The trial footing held — {cast:inspector} trusts {actor}'s footings now.

- The pier was shored by nightfall — {location} holds the fair it had put off.

- Let on one condition — due back on the site when the scaffold comes down.

**`fallback/failure`** · 47 words

The inspector let the pier to {cast:rival}. {actor} leaves the site with no fee and a trial footing that settled while the town watched.

- Outbuilt by a cheaper mason — {location} thinks less of their work.

- The trial footing settled — {cast:inspector} trusts {actor}'s footings less now.

**`fallback/critical_failure`** · 50 words

The trial footing broke into the fill in front of {location}. The inspector let the pier to {cast:rival} and told the town why.

- Built on ground they had not read — {location} thinks less of their work.

- The footing broke under load — {cast:inspector} will not trust {actor}'s footings again.

</details>

## Director's sample

Ruling: Christian reviews **2** of the 6, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.town.pilots_reckoning` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.pilots_reckoning)
- `encounter.town.overdue_caravan` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.overdue_caravan)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.

## Live proof beyond the default run

The table above renders one seed (42) with the cheapest hand. At journeyman difficulty the proof's ascendant loses most runs, so success-side blocks are rarely on the path it takes. Two further sweeps are the batch's live evidence.

**Natural rolls, `--play all`, seven seeds:**

| Encounter | seed 42 | seed 99 | seed 7 | seed 11 | seed 3 | seed 17 | seed 6 |
|---|---|---|---|---|---|---|---|
| `encounter.town.pilots_reckoning` | ❌ failure | ❌ failure | ❌ success_at_cost | ❌ failure | ✅ success_at_cost | ❌ failure | ❌ success_at_cost |
| `encounter.town.overdue_caravan` | ✅ failure | ✅ critical_failure | ✅ failure | ✅ failure | ✅ success_at_cost | ✅ failure | ✅ failure |
| `encounter.town.assize_letter` | ✅ failure | ✅ failure | ✅ critical_success | ✅ failure | ✅ failure | ✅ failure | ✅ failure |
| `encounter.town.counting_house_dispute` | ❌ failure | ❌ failure | ❌ failure | ❌ failure | ❌ critical_failure | ❌ failure | ❌ failure |
| `encounter.town.bell_at_the_exchange` | ✅ failure | ✅ failure | ✅ failure | ✅ failure | ✅ failure | ✅ failure | ✅ failure |
| `encounter.town.masons_commission` | ❌ failure | ❌ failure | ❌ failure | ❌ failure | ❌ failure | ❌ failure | ❌ failure |

**Pinned success.** The same proof run with the engine's own `?outcome=` lever (`setOutcomePin`), which substitutes the band at the tail of step resolution, so every downstream consequence fires as a real one would. Seed 42, `--play all`:

| Encounter | pinned `success` | pinned `critical_success` |
|---|---|---|
| `encounter.town.pilots_reckoning` | ✅ on seed 3 (seed 42 takes the decline arm: `negative` variant, no seed by design) | same |
| `encounter.town.overdue_caravan` | ✅ | ✅ |
| `encounter.town.assize_letter` | ✅ | ✅ |
| `encounter.town.counting_house_dispute` | ✅ | ✅ (reaction `counting.neg.tell_the_market`) |
| `encounter.town.bell_at_the_exchange` | ✅ | ✅ |
| `encounter.town.masons_commission` | ✅ (appointment planted, kept + missed branches) | ✅ |

Natural success runs also exist for masons (seeds 10, 16, 20, 28) and assize (seed 7).

**Why a failure-band run can read ❌.** `systemSurfacesForOutcome` treats a step's `successMetadata` as band-less, and so unconditional. On a run whose step failed, the proof still expects the success-side reward, seed or condition. Every ❌ above was checked to be that shape: the failing claim names an effect that sits only in `successMetadata` (or on the other fork arm). None is a block that failed to arrive on a run that reached it. Logged as an impediment against the harness.
