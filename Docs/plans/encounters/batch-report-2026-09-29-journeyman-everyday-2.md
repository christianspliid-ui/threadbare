# Encounter batch report — 2026-09-29

**Batch:** 6 encounter(s)
**Brief:** `Docs/plans/encounters/journeyman-everyday-2-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.fair_bout` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.fair_bout) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.fair_bout) |
| `encounter.town.levee_breach` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.levee_breach) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.levee_breach) |
| `encounter.town.ledger_by_lamplight` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, seeds, conditions, reputation, content_query | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.ledger_by_lamplight) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.ledger_by_lamplight) |
| `encounter.town.smugglers_ford` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.smugglers_ford) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.smugglers_ford) |
| `encounter.town.well_sinking` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation, factions, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.well_sinking) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.well_sinking) |
| `encounter.town.cunning_fair` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.cunning_fair) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.cunning_fair) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**1 of 6** encounter(s) author a content query; **1** resolved one live.

Authored by: `encounter.town.ledger_by_lamplight`.

## Appointment census

**1 of 6** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.well_sinking`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.fair_bout` | 🔗 connected | A mortal who wins the fair's purse bout walks away with a hedge-healer companion, a favour owed by the backer Oda Brisk, and the beaten champion Bram Tallow's resentment; a lost bout costs Oda Brisk's regard, and walking away from the challenge costs a little of Bram Tallow's. |
| `encounter.town.levee_breach` | 🔗 connected | If the far bank breaks, the town (the mortal's current settlement) carries Blighted Harvest for the season — its fields failed, food short, travellers going round it — and thinks less of the mortal the warden blamed, while a held bank leaves the town thinking better of them; either way the mortal's thread to the god runs stronger or thinner. |
| `encounter.town.ledger_by_lamplight` | 🔗 connected | A clean copy leaves the mortal holding a shadow-work item paid in kind, the rival house's factor trusting them, and a seed: the factor sends for them with more quiet work (a theft or smuggling job, drawn by family) — while a cracked or caught copy leaves the town Under Watch, which makes the next quiet job there harder, and the factor trusting them less. |
| `encounter.town.smugglers_ford` | 🔗 connected | A mortal who leads the salt train over the ford sets off on the road away from the town with it and gains the trust of the carrier Wenna Tarrow; one who is caught loses her regard and is known by face to the exciseman Oswin Keel; either way the chronicle records an omen that the river favours, or has turned against, night crossings, which tilts what the world offers for a while; a mortal who declines only loses a little of Wenna's regard, plus the turning omen if her crossing then fails. |
| `encounter.town.well_sinking` | 🔗 connected | A lined well leaves the village (the mortal's current settlement) thinking better of the well-sinker, puts the mortal on the rolls of the Builders Fellowship on the rival wright's word, and binds them to be back at the new well in three days when the reeve pays the second half of the fee (kept → the reeve pays at the well; missed → the reeve comes looking with the money held back) — while a collapsed shaft leaves the village thinking less of them and counting its advance as thrown away. |
| `encounter.town.cunning_fair` | 🔗 connected | A true reading of the widow's dream gives the mortal a talisman drawn from the world's #talisman items (a better one on the best ending), raises their standing in the town or village where it happened, strengthens the god's thread to them, and leaves a hidden mark (they know there is coin in the widow's house) that steers them toward shadow and settlement work until it surfaces; a wrong reading lowers that standing and thins the thread. |

## Verdict roll-up

- **Gate green:** 6 / 6
- **Live proved:** 4 / 6
- **Live vacuous:** 0 / 6

## Per-encounter detail

### `encounter.town.fair_bout`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.fair_bout) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.fair_bout) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: bout.cool_the_blood)

- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 14 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 11 words

The bout is over, and the fair saw how it went.

**`positive/critical_success`** · 44 words

By dusk, every stall at the fair was talking about the stranger who beat {cast:champion}.

- {cast:champion} thinks less of {actor} now.

- Left the beaten corner — A hedge-healer travels with {actor} now.

- Paid out on a quiet bet — {cast:backer} owes {actor} a favour.

**`positive/success`** · 43 words

{cast:backer} had laid a quiet bet on {actor} against the whole fair, and collected on it without a word to anyone.

- {cast:champion} thinks less of {actor} now.

- Left the beaten corner — A hedge-healer travels with {actor} now.

- {cast:backer} owes {actor} a favour.

**`positive/success_at_cost`** · 48 words

{actor} came out of the last round with one eye swelling shut, and {cast:champion} walked off without a word.

- {cast:champion} thinks less of {actor} now.

- Stitched their split brow — A hedge-healer travels with {actor} now.

- Paid out on a quiet bet — {cast:backer} owes {actor} a favour.

**`positive/failure`** · 23 words

{cast:backer} lost the quiet bet laid on {actor}, and the champion's backers collected from the whole crowd.

- {cast:backer} thinks less of {actor} now.

**`positive/critical_failure`** · 29 words

{cast:backer} lost every coin laid on {actor}, and the crier called the result round the fair before {actor} was back on their feet.

- {cast:backer} thinks less of {actor} now.

**`negative`** · 28 words

The crier named the refusal at the ring, as the fair's custom says, and {cast:champion} kept the purse without a bout.

- {cast:champion} thinks a little less of {actor}.

**`negative/success`** · 24 words

The crier named the refusal at the ring, and the fair moved on to the next bout.

- {cast:champion} thinks a little less of {actor}.

**`negative/failure`** · 22 words

The crier named the refusal at the ring, and the stewards watched {actor} out of the fair.

- {cast:champion}'s regard for {actor} fell.

**`negative/critical_failure`** · 22 words

The crier named {actor} a coward at the ring, loud enough for the whole fair to hear.

- {cast:champion}'s regard for {actor} fell.

**`fallback`** · 28 words

The crier named the refusal at the ring, as the fair's custom says, and {cast:champion} kept the purse without a bout.

- {cast:champion} thinks a little less of {actor}.

**`fallback/success`** · 24 words

The crier named the refusal at the ring, and the fair moved on to the next bout.

- {cast:champion} thinks a little less of {actor}.

**`fallback/failure`** · 22 words

The crier named the refusal at the ring, and the stewards watched {actor} out of the fair.

- {cast:champion}'s regard for {actor} fell.

**`fallback/critical_failure`** · 22 words

The crier named {actor} a coward at the ring, loud enough for the whole fair to hear.

- {cast:champion}'s regard for {actor} fell.

</details>

### `encounter.town.levee_breach`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.levee_breach) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.levee_breach) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (5 tick(s), hand: levee.stiffen_the_load, levee.show_the_leak, levee.bolster_the_wall)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 68 words

The river is falling, and {location} is out on the levee counting sacks and fields.

> Stay on to rebuild the far bank The mortal works past the end of the watch where the town can see it, and the town marks who stayed.

> Walk the levee again at first light What the night showed about the bank stays with the mortal, whatever the town makes of the watch.

**`fallback/critical_success`** · 99 words

{cast:warden} takes back the charge about the evening watch, in front of the men who heard it made.

- Held the breach with the god close — The thread to {actor} runs stronger.

- Found the real fault and held it — {location} thinks well of {actor} now.

> Stay on to rebuild the far bank The mortal works past the end of the watch where the town can see it, and the town marks who stayed.

> Walk the levee again at first light What the night showed about the bank stays with the mortal, whatever the town makes of the watch.

**`fallback/success`** · 95 words

{cast:warden} drops the charge about the evening watch and sends everyone home to sleep.

- Stood in the water with the god close — The thread to {actor} runs stronger.

- Held the far bank until morning — {location} thinks well of {actor} now.

> Stay on to rebuild the far bank The mortal works past the end of the watch where the town can see it, and the town marks who stayed.

> Walk the levee again at first light What the night showed about the bank stays with the mortal, whatever the town makes of the watch.

**`fallback/success_at_cost`** · 98 words

{actor} comes off the levee at noon, long after the others, and sleeps through the rest of the day.

- Held the bank with the god close — The thread to {actor} runs stronger.

- Kept the far bank standing — {location} thinks well of {actor} now.

> Stay on to rebuild the far bank The mortal works past the end of the watch where the town can see it, and the town marks who stayed.

> Walk the levee again at first light What the night showed about the bank stays with the mortal, whatever the town makes of the watch.

**`fallback/failure`** · 117 words

{cast:warden} and the men fall back to the mill bank and keep the houses dry. The far bank is left to the river.

- The crop rotted in the ground — {location} will go short this winter.

- Blamed for the watch and the breach — {location} thinks less of {actor} now.

- The bank broke with the god watching — The thread to {actor} runs thinner.

> Stay on to rebuild the far bank The mortal works past the end of the watch where the town can see it, and the town marks who stayed.

> Walk the levee again at first light What the night showed about the bank stays with the mortal, whatever the town makes of the watch.

**`fallback/critical_failure`** · 124 words

{cast:warden} and the men fall back to the houses and leave the far bank to the river. At dawn the warden tells {location} that the river came in through {actor}'s watch.

- The crop drowned where it stood — {location} will go short this winter.

- Believed to have missed the seep — {location} thinks less of {actor} now.

- The flood came with the god watching — The thread to {actor} runs thinner.

> Stay on to rebuild the far bank The mortal works past the end of the watch where the town can see it, and the town marks who stayed.

> Walk the levee again at first light What the night showed about the bank stays with the mortal, whatever the town makes of the watch.

</details>

### `encounter.town.ledger_by_lamplight`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.ledger_by_lamplight) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.ledger_by_lamplight) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (4 tick(s), hand: ledger.stretch_the_rounds, ledger.clear_the_head)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 14 words

One page of a sealed ledger was copied, or nearly, before the dawn check.

**`fallback/critical_success`** · 39 words

{actor} handed {cast:factor} two pages instead of one. The house checked its seals at dawn and found nothing wrong. The factor paid in kind.

- {cast:factor} trusts {actor} with quiet work now.

- {cast:factor} will send for {actor} with more work.

**`fallback/success`** · 37 words

{actor} gave {cast:factor} the copied page before dawn. The house checked its seals and found nothing wrong. The factor paid in kind.

- {cast:factor} trusts {actor} with quiet work now.

- {cast:factor} will send for {actor} with more work.

**`fallback/success_at_cost`** · 42 words

{actor} brought {cast:factor} half a page. The house checked its seals at dawn and found nothing wrong. The factor paid in kind for what there was.

- {cast:factor} trusts {actor}'s hands, if not their speed.

- {cast:factor} will send for {actor} with more work.

**`fallback/failure`** · 42 words

The house knows its ledger was read. {cast:factor} will not pay for a secret the house knows is out.

- The house raised the alarm — {location} is watched now, and quiet work there is harder.

- {cast:factor} trusts {actor} less with quiet work.

**`fallback/critical_failure`** · 45 words

{cast:factor} paid nothing for an empty page. A copyist seen at the press is no use to a house that buys secrets.

- The clerk raised the alarm — {location} is watched now, and quiet work there is harder.

- {cast:factor} trusts {actor} less with quiet work.

</details>

### `encounter.town.smugglers_ford`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.smugglers_ford) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.smugglers_ford) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: ford.count_the_fine)

- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 16 ending(s), read each for repetition, verbosity, conflict</summary>

**`negative`** · 14 words

The salt train has met the ford, and the post has had its night.

**`negative/critical_success`** · 39 words

{cast:carrier} counted out the guide's share twice over on the far bank. {location} says the river favours whoever crosses by night.

- {cast:carrier} trusts {actor} with a lead rope now.

- {actor} is headed away from {location} with the salt train.

**`negative/success`** · 45 words

The post never knew a train had passed, and {cast:carrier} paid the guide's share on the far bank. {location} says the river favours whoever crosses by night.

- {cast:carrier} trusts {actor} with a lead rope now.

- {actor} is headed away from {location} with the salt train.

**`negative/success_at_cost`** · 41 words

The crossing came dear, and {cast:carrier} took the loss out of the guide's share. {location} says the river favours whoever crosses by night.

- {cast:carrier} trusts {actor} with a lead rope now.

- {actor} is headed away from {location} with the salt train.

**`negative/failure`** · 45 words

The watch waded out and took the salt, and the excise fined {cast:carrier} for it. {location} says the river has turned against night crossings.

- {cast:carrier} thinks less of {actor} as a guide.

- Seen holding the rope — {cast:exciseman} knows {actor}'s face now, and not kindly.

**`negative/critical_failure`** · 38 words

The excise seized every mule and fined {cast:carrier} a season's profit. {location} says the river has turned against night crossings.

- {cast:carrier} thinks less of {actor} as a guide.

- {cast:exciseman} knows {actor}'s face now, and has it written down.

**`positive`** · 23 words

{cast:carrier} has the lead rope back, and {actor}'s reading of the watch.

- {cast:carrier} thinks a little less of {actor} for refusing the rope.

**`positive/critical_success`** · 30 words

The salt went over unseen on {actor}'s reading, and {cast:carrier} sent a drover back with a share for it.

- {cast:carrier} thinks a little less of {actor} for refusing the rope.

**`positive/success`** · 27 words

{cast:carrier} put a hired boy on the rope and crossed on {actor}'s reading of the watch.

- {cast:carrier} thinks a little less of {actor} for refusing the rope.

**`positive/success_at_cost`** · 22 words

{cast:carrier} crossed late on the reading, with the fog already thinning.

- {cast:carrier} thinks a little less of {actor} for refusing the rope.

**`positive/failure`** · 39 words

{cast:carrier} did not trust the reading, waited for a guide who never came, and watched the river rise over the ford. {location} says the ford has turned against night crossings.

- {cast:carrier} thinks less of {actor} for refusing the rope.

**`positive/critical_failure`** · 43 words

The salt stayed in the reeds past dawn, and the river took the ford. By noon all of {location} knew who had refused the rope, and said the ford had turned against night crossings.

- {cast:carrier} thinks less of {actor} as a guide now.

**`fallback`** · 18 words

The salt train has gone to the ford, and the lead rope is back in the carrier's hands.

**`fallback/success`** · 14 words

The carrier has the watch's rounds, and a way over the ford before dawn.

**`fallback/failure`** · 26 words

The salt train lost its night at the ford, and the carrier knows who read the watch. {location} says the ford has turned against night crossings.

**`fallback/critical_failure`** · 27 words

The salt train's night went badly wrong, and the carrier said in {location} who had read the watch. {location} says the ford has turned against night crossings.

</details>

### `encounter.town.well_sinking`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.well_sinking) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.well_sinking) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: well.bind_the_sand, well.sway_the_neighbour)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- ❌ `appointment_kept` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block
- ❌ `appointment_missed` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 13 words

A new well has been sunk in {location}, or lost to the rain.

**`fallback/critical_success`** · 68 words

The spring came to {actor}'s shaft first, and the lord's well on the next plot stands dry. {cast:wright} came over in the morning to look down it.

- A clean job — {location} thinks well of their work.

- Vouched for by {cast:wright} — {actor} is on the rolls of the Builders Fellowship now.

- The shaft stands — {cast:reeve} pays the rest at the well when its water runs clear.

**`fallback/success`** · 57 words

The spring came into {actor}'s shaft, and the lord's well on the next plot stands dry.

- Lined in time — {location} thinks well of their work.

- Vouched for by {cast:wright} — {actor} is on the rolls of the Builders Fellowship now.

- The shaft stands — {cast:reeve} pays the rest at the well when its water runs clear.

**`fallback/success_at_cost`** · 61 words

The spring came into {actor}'s shaft, but the work went wrong in places and used up most of the advance.

- Lined in time — {location} thinks well of their work.

- Vouched for by {cast:wright} — {actor} is on the rolls of the Builders Fellowship now.

- The shaft stands — {cast:reeve} pays the rest at the well when its water runs clear.

**`fallback/failure`** · 27 words

The spring went to the lord's well, and the advance went into the ground with the shaft.

- Unlined at nightfall — {location} thinks less of their work.

**`fallback/critical_failure`** · 21 words

{location} counts the advance it paid as thrown away.

- A shaft that fell in — {location} thinks less of their work.

</details>

### `encounter.town.cunning_fair`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.cunning_fair) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.cunning_fair) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: cunning.borrow_her_sleep)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 17 words

The fair has moved on from the square. The widow's house has its answer, right or wrong.

**`fallback/critical_success`** · 58 words

Someone climbed the widow's chimney in front of the whole fair and brought down his savings in a cloth bag. {cast:rival} packed away the charms and left early.

- {location} thinks better of their readings.

- Read the dream with the god close — The thread to {actor} runs stronger.

- {actor} knows there is coin in the widow's house now.

**`fallback/success`** · 51 words

His savings were up the chimney in a cloth bag, blocking the smoke. With them out, her fire burns clean again.

- {location} thinks better of their readings.

- Read the dream with the god close — The thread to {actor} runs stronger.

- {actor} knows there is coin in the widow's house now.

**`fallback/success_at_cost`** · 55 words

The fair saw the first answer fail, and {cast:rival} calls the second one luck. Still, the widow's fire burns and her husband's savings are back.

- {location} thinks better of their readings.

- Read the dream with the god close — The thread to {actor} runs stronger.

- {actor} knows there is coin in the widow's house now.

**`fallback/failure`** · 34 words

The widow bought {cast:rival}'s charm and hung it over the hearth. Her fire still smokes.

- Misread the dream with the god watching — The thread to {actor} runs thinner.

- {location} trusts their readings less.

**`fallback/critical_failure`** · 37 words

{cast:rival} sold a charm against the angry dead to every house on the square by nightfall.

- Blamed the dead man's anger with the god watching — The thread to {actor} runs thinner.

- {location} trusts their readings less.

</details>

## Director's sample

Ruling: Christian reviews **2** of the 6, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.town.fair_bout` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.fair_bout)
- `encounter.town.levee_breach` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.levee_breach)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.

## Live proof beyond the default run

The table above renders one seed (42) with the cheapest hand. At journeyman difficulty the proof's ascendant loses most runs, so success-side blocks are rarely on the path it takes (batch 1 recorded the same). Two further sweeps are the batch's live evidence. Both used the proof itself, with the engine's `setOutcomePin` (the `?outcome=` lever) set before the spawn. The pin substitutes the band at the tail of step resolution, so every downstream consequence fires as a real one would.

**Natural rolls, `--play all`:**

| Encounter | seed 42 | seed 99 | seed 7 |
|---|---|---|---|
| `encounter.town.fair_bout` | ✅ failure | ✅ success_at_cost | ✅ failure |
| `encounter.town.levee_breach` | ✅ failure | ✅ failure | ✅ success_at_cost |
| `encounter.town.ledger_by_lamplight` | ❌ failure ¹ | ❌ failure ¹ | ✅ success_at_cost ² |
| `encounter.town.smugglers_ford` | ✅ failure | ✅ failure | ✅ success_at_cost |
| `encounter.town.well_sinking` | ❌ failure ¹ | ❌ failure ¹ | ❌ failure ¹ |
| `encounter.town.cunning_fair` | ✅ failure | ✅ success_at_cost | ✅ failure |

**Pinned bands, seed 42, `--play all`:**

| Encounter | `critical_success` | `success` | `success_at_cost` | `critical_failure` |
|---|---|---|---|---|
| `encounter.town.fair_bout` | ✅ | ✅ | ✅ | ❌ ¹ |
| `encounter.town.levee_breach` | — | ✅ | — | ✅ |
| `encounter.town.ledger_by_lamplight` | ✅ | ✅ | ✅ | ❌ ¹ |
| `encounter.town.smugglers_ford` | ✅ | ✅ | ✅ | ❌ ¹ |
| `encounter.town.well_sinking` | ✅ | ✅ | ✅ | ❌ ¹ |
| `encounter.town.cunning_fair` | — | ✅ | — | ✅ |

**The appointment, live (pinned `success`, seed 42).** The seed planted with its appointment block. The **kept** arm was met at tick 41 (due 41, window 12), and sequel `town.well_first_water` spawned at the well. In the **missed** arm the mortal stood elsewhere, the miss closed at tick 54 (`unreachable`), and sequel `town.well_gone_foul` spawned at tick 66. That makes this batch's appointment census 1 of 6, authored and proved both ways. The census row above reads 0 kept / 0 missed only because the default run failed its step.

¹ **The harness's known false negative** (batch 1, same shape). `systemSurfacesForOutcome` treats a step's `successMetadata` as band-less, and so unconditional. On a run whose step failed, the proof still expects the success-side reward, seed or appointment. Every ❌ here was checked to be that shape: the failing claim names an effect that sits only in `successMetadata`, never a block that failed to arrive on a run that reached it.

² Proved after the Law 2 fix below. The first sweep read `concepts_declared` ❌ on this run.

**One real defect the sweep caught, fixed before commit.** Twelve success-side chips (three each on fair bout, ledger, smugglers' ford and well sinking) carried no `concepts` (Law 2). The critics had removed `{actor}` concepts that could never match unexpanded text and left the chips bare. Each now carries a phrase from its own sentence, and every success-side pinned band above proves on the fixed tree.
