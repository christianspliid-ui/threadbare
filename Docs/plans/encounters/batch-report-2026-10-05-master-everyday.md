# Encounter batch report — 2026-10-05

**Batch:** 8 encounter(s) (ruling 1 sets the batch at 6)
**Brief:** `Docs/plans/encounters/master-everyday-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.forged_charter_inquest` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.forged_charter_inquest) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.forged_charter_inquest) |
| `encounter.town.cathedral_loan` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.cathedral_loan) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.cathedral_loan) |
| `encounter.town.granary_riot` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation, content_query | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.granary_riot) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.granary_riot) |
| `encounter.town.judicial_duel` | ✅ green | ✅ proved | 🔗 connected | critical_failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.judicial_duel) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.judicial_duel) |
| `encounter.town.coiners_mint` | ✅ green | ✅ proved | 🔗 connected | success_at_cost | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.coiners_mint) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.coiners_mint) |
| `encounter.town.ducal_nativity` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.ducal_nativity) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.ducal_nativity) |
| `encounter.town.cathedral_vault` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.cathedral_vault) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.cathedral_vault) |
| `encounter.town.restless_ossuary` | ✅ green | ✅ proved | 🔗 connected | success_at_cost | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.restless_ossuary) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.restless_ossuary) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**1 of 8** encounter(s) author a content query; **0** resolved one live.

Authored by: `encounter.town.granary_riot`.

> 1 authored quer(ies) did not resolve on their live run — either the band carrying them was not rolled, or the family they name is empty. The `content_query_resolved` claim rows say which.

## Appointment census

**1 of 8** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.forged_charter_inquest`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.forged_charter_inquest` | 🔗 connected | The master's standing with the town rises or falls, and the town's page shows it; a Political Secret record of who forged the count's charter (one of the steward's own clerks) lands in their intelligence panel, where court and intrigue encounters score it; and naming the forger books them to be back in the town hall in three days for court day, with the count's steward there to answer — keep it and the town's charter stands, the town thinks better of them and the steward turns cold toward them, miss it and the steward comes looking for them wherever they are and thinks less of them if they cannot answer. |
| `encounter.town.cathedral_loan` | 🔗 connected | The mortal walks away with a changed bond with the dean (and, by their choice, with the lenders' factor), a changed standing in the town on money, and on a win a holy item from the cathedral treasury (plus a debt to the factor if they stood surety), all of which show on their sheet and the town's standing row and get read when either person is cast again. |
| `encounter.town.granary_riot` | 🔗 connected | Settling the granary raises the mortal's standing with the town, leaves the crowd's speaker (Wynn Halloway, or a reused smith or innkeeper) and the abbey's cellarer (Osric Vane, or a reused priest) trusting them, and plants a town-watch errand that finds them about two days later; failing lowers the town's opinion and leaves both of those people trusting the mortal less, and the aftermath reaction lets the player choose which of the two to side with. |
| `encounter.town.judicial_duel` | 🔗 connected | A won bout leaves Wenna Coldridge owing the mortal a favour, the god's thread to the mortal stronger and the town's regard higher (with an optional Festival on the town); a lost one leaves the town Under Watch for a week, where quiet Shadow work is harder, plus a thinner thread and lower regard, and all of it shows on the mortal's sheet, Wenna's sheet and the town's card. |
| `encounter.town.coiners_mint` | 🔗 connected | Win and the mortal carries The Coiner's Dies in their possessions and stands higher with the town on its standing row; lose and that standing drops; either way the closing choice moves their bond with the mint-master Marrin Coyle up or down, which his sheet shows and the town's later sendings read. |
| `encounter.town.ducal_nativity` | 🔗 connected | The reader comes away pursuing Fulfill the Destiny (shown on their sheet), and if they warned him the duke Aldric Varre owes them a favour; their standing in the town goes up or down; and a failed telling leaves a Plague Scare on the town that makes travellers avoid it for fourteen days. |
| `encounter.town.cathedral_vault` | 🔗 connected | When the vault stands, the town gets a Festival for the new church and the abbot (a lasting named person) comes to trust the builder; when it fails, the abbot blames them and the town's standing toward them drops. All of this shows on the town's page and the abbot's sheet, and later encounters there read it. |
| `encounter.town.restless_ossuary` | 🔗 connected | The mortal's standing with the town goes up or down on the record the Location Profile shows, a ruling that holds puts a #relic possession on their sheet, the night of the laying leaves a good or bad omen that tilts later encounter draws and reaches the chronicle, and the reactions move the weavers' warden Orrin Vasse's feelings toward them, so a later meeting with the warden starts warm or cold. |

## Verdict roll-up

- **Gate green:** 8 / 8
- **Live proved:** 8 / 8
- **Live vacuous:** 0 / 8

## Per-encounter detail

### `encounter.town.forged_charter_inquest`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.forged_charter_inquest) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.forged_charter_inquest) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: charter.warm_the_wax, charter.crack_the_inkwell)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `reward_node` — reward authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `seed_planted` — seed authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — appointment authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `appointment_missed` — appointment authored only in step metadata on a side its step did not take (step outcomes: failure, failure)

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 12 words

The town's charter in {location} has been read against the count's copy.

**`fallback/critical_success`** · 61 words

The council locked both copies in the town chest under its own seal, with the steward watching.

- The council's word on it — {location} thinks well of their work.

- Made in the steward's household — {actor} knows who wrote the count's copy of the charter.

- Court day in the town hall — {cast:steward} answers the findings in {location} in three days.

**`fallback/success`** · 54 words

The council has the findings in writing, signed by {actor}.

- The council's word on it — {location} thinks well of their work.

- Made in the steward's household — {actor} knows who wrote the count's copy of the charter.

- Court day in the town hall — {cast:steward} answers the findings in {location} in three days.

**`fallback/success_at_cost`** · 60 words

The council has the findings, but with the clerk gone they rest on {actor}'s word alone.

- The council's word on it — {location} thinks well of their work.

- Made in the steward's household — {actor} knows who wrote the count's copy of the charter.

- Court day in the town hall — {cast:steward} answers the findings in {location} in three days.

**`fallback/failure`** · 29 words

The council has no answer for the count's lawyers, and it sent for a master to give it one.

- No forger named — {location} thinks less of their work.

**`fallback/critical_failure`** · 25 words

The count's lawyers now have a master's mistake to use against the town's charter.

- Said before the council — {location} thinks less of their work.

</details>

### `encounter.town.cathedral_loan`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.cathedral_loan) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.cathedral_loan) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: cathedral.dull_the_silver, cathedral.open_the_ledger)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 12 words

{actor} left the chapter house once the factor had given an answer.

**`fallback/critical_success`** · 77 words

{cast:dean} thanked {actor} before the whole chapter, and gave them a gift from the cathedral treasury.

- {cast:dean} trusts {actor} now.

- {location} thinks better of {actor}'s word on money.

> Keep the lenders' goodwill Tell the factor the tithes are sound and the lenders were fair. The factor thinks well of the mortal for it.

> Stand with the chapter Tell the dean the lenders pressed too hard. The dean trusts the mortal more, and the factor takes against them.

**`fallback/success`** · 86 words

The chapter will pay off its loan from the tithes in the years ahead. {cast:dean} sent {actor} away with a piece from the cathedral treasury.

- {cast:dean} trusts {actor} now.

- {location} thinks better of {actor}'s word on money.

> Keep the lenders' goodwill Tell the factor the tithes are sound and the lenders were fair. The factor thinks well of the mortal for it.

> Stand with the chapter Tell the dean the lenders pressed too hard. The dean trusts the mortal more, and the factor takes against them.

**`fallback/success_at_cost`** · 101 words

The plate is back inside, but the chapter will pay the lenders a harder rate for a generation. {cast:dean} paid {actor} from the treasury, and called the terms a fair price for the plate.

- {cast:dean} trusts {actor} now.

- {location} thinks better of {actor}'s word on money.

> Stand surety for the chapter Take part of the chapter's debt in the mortal's own name. The mortal owes the factor, and the dean trusts them more for it.

> Leave the chapter its terms The chapter carries its terms alone. None of its debt falls on the mortal, and the dean is cooler toward them.

**`fallback/failure`** · 40 words

A master is judged by what they save. The chapter sent for {actor} by name to save its plate, and the plate is lost.

- Every lender heard — {location} thinks less of {actor}'s word on money.

- {cast:dean} trusts {actor} less.

**`fallback/critical_failure`** · 35 words

The plate is gone to be melted down, and the whole chapter watched it go. {cast:dean} had sent for {actor} to save it.

- {location} thinks less of {actor}'s word on money.

- {cast:dean} trusts {actor} less.

</details>

### `encounter.town.granary_riot`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.granary_riot) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.granary_riot) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: granary.calm_frightened_people, granary.open_closed_hands)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — seed authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — content query authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 57 words

The yard empties, and {location} counts what the granary gave.

> Stay until the last sack leaves The mortal stays at the granary until the last sack of the share has gone, and the town hears of it.

> Sup at the abbey's table The mortal eats at the abbey's table that night. The cellarer will remember the company.

**`fallback/critical_success`** · 99 words

The abbey sold the share {actor} named at last year's price and kept the rest for seed. The abbot came out to thank {actor} in front of the town.

- {location} thinks better of {actor} now.

- {cast:speaker} trusts {actor} now.

- {cast:cellarer} trusts {actor}'s judgment now.

- Word of {actor}'s ruling reaches a town watch.

> Stay until the last sack leaves The mortal stays at the granary until the last sack of the share has gone, and the town hears of it.

> Sup at the abbey's table The mortal eats at the abbey's table that night. The cellarer will remember the company.

**`fallback/success`** · 88 words

{cast:speaker} led the crowd home with bread for the month. The abbey keeps its seed for the spring.

- {location} thinks better of {actor} now.

- {cast:speaker} trusts {actor} now.

- {cast:cellarer} trusts {actor}'s judgment now.

- Word of {actor}'s ruling reaches a town watch.

> Stay until the last sack leaves The mortal stays at the granary until the last sack of the share has gone, and the town hears of it.

> Sup at the abbey's table The mortal eats at the abbey's table that night. The cellarer will remember the company.

**`fallback/success_at_cost`** · 86 words

{cast:speaker} led the crowd home with bread. The abbey has less seed left than it wanted.

- {location} thinks better of {actor} now.

- {cast:speaker} trusts {actor} now.

- {cast:cellarer} trusts {actor}'s judgment now.

- Word of {actor}'s ruling reaches a town watch.

> Stay until the last sack leaves The mortal stays at the granary until the last sack of the share has gone, and the town hears of it.

> Sup at the abbey's table The mortal eats at the abbey's table that night. The cellarer will remember the company.

**`fallback/failure`** · 94 words

Bread is still dear in {location}. People send for a master because a master's word ends quarrels. This quarrel is still going.

- {location} thinks less of {actor} now.

- {cast:speaker} trusts {actor} less now.

- {cast:cellarer} doubts {actor}'s judgment now.

> Side with the crowd The mortal says the town's hunger mattered more than the abbey's seed. The crowd's speaker will remember it kindly, and the cellarer will not.

> Side with the abbey The mortal backs the abbey: the seed should have been kept, whatever the town thinks. The cellarer is grateful; the crowd's speaker is not.

**`fallback/critical_failure`** · 91 words

The abbey has lost most of its seed for the spring. Both sides asked {actor} to settle this, and both have lost by it.

- {location} thinks less of {actor} now.

- {cast:cellarer} trusts {actor} less now.

> Side with the crowd The mortal says the town's hunger mattered more than the abbey's seed. The crowd's speaker will remember it kindly, and the cellarer will not.

> Side with the abbey The mortal backs the abbey: the seed should have been kept, whatever the town thinks. The cellarer is grateful; the crowd's speaker is not.

</details>

### `encounter.town.judicial_duel`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.judicial_duel) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.judicial_duel) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (5 tick(s), hand: duel.reveal_old_habits, duel.twist_their_footing, duel.weigh_a_false_oath)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 56 words

The court reads its verdict, and the crowd leaves the square.

> Offer the beaten champion a hand The mortal helps the order's champion up in front of the court. The champion will remember it.

> Stand the square a feast The mortal turns the verdict into a feast in the square, and the town takes a holiday.

**`fallback/critical_success`** · 90 words

The court gives the farm back to {cast:claimant}'s family and writes the verdict into its rolls. Families from across the valley come to shake {actor}'s hand.

- The god's thread to {actor} runs stronger.

- {cast:claimant} owes {actor} a favour now.

- {location} thinks well of {actor} now.

> Offer the beaten champion a hand The mortal helps the order's champion up in front of the court. The champion will remember it.

> Stand the square a feast The mortal turns the verdict into a feast in the square, and the town takes a holiday.

**`fallback/success`** · 84 words

The court gives the farm back to {cast:claimant}'s family. The order's people pack their carts and leave {location} by evening.

- The god's thread to {actor} runs stronger.

- {cast:claimant} owes {actor} a favour now.

- {location} thinks well of {actor} now.

> Offer the beaten champion a hand The mortal helps the order's champion up in front of the court. The champion will remember it.

> Stand the square a feast The mortal turns the verdict into a feast in the square, and the town takes a holiday.

**`fallback/success_at_cost`** · 85 words

The court gives the farm back to {cast:claimant}'s family, but the whole square saw how near the order came to winning.

- The god's thread to {actor} runs stronger.

- {cast:claimant} owes {actor} a favour now.

- {location} thinks well of {actor} now.

> Offer the beaten champion a hand The mortal helps the order's champion up in front of the court. The champion will remember it.

> Stand the square a feast The mortal turns the verdict into a feast in the square, and the town takes a holiday.

**`fallback/failure`** · 76 words

The court gives the farm to the order, and {cast:claimant}'s family must leave it.

- The order's men keep watch on {location} now.

- The god's thread to {actor} runs thinner.

- {location} thinks less of {actor} now.

> Load the family's cart The mortal stays to help the family move out. The family will remember who stayed.

> Ask the champion to explain the style The mortal asks the order's champion how the style is won, and keeps the answer.

**`fallback/critical_failure`** · 69 words

The court gives the farm to the order. {cast:claimant} tells the whole square that the family trusted {actor}, and {actor} failed them.

- {location} thinks less of {actor} now.

> Load the family's cart The mortal stays to help the family move out. The family will remember who stayed.

> Ask the champion to explain the style The mortal asks the order's champion how the style is won, and keeps the answer.

</details>

### `encounter.town.coiners_mint`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.coiners_mint) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.coiners_mint) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: coin.loosen_a_tongue, coin.harden_a_kind_heart)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 48 words

The assayer has come and weighed the mint's coin.

> Keep the apprentice's name quiet The mortal tells no one who struck the coin. The mint-master will remember the mercy.

> Name the apprentice to the council The town trusts the mortal more, and the mint-master will not forgive it.

**`fallback/critical_success`** · 85 words

The assayer weighed the mint's coin and found it true. {cast:mintmaster} told the town council that {actor} saved the mint, and did not say from what.

- {location} thinks well of {actor} now.

- Carried out of the strongroom — The Coiner's Dies are in {actor}'s possessions now.

> Keep the apprentice's name quiet The mortal tells no one who struck the coin. The mint-master will remember the mercy.

> Name the apprentice to the council The town trusts the mortal more, and the mint-master will not forgive it.

**`fallback/success`** · 78 words

The assayer found the mint's coin true, and the mint stays open. {cast:mintmaster} speaks for {actor} to the council.

- {location} thinks well of {actor} now.

- Carried out of the strongroom — The Coiner's Dies are in {actor}'s possessions now.

> Keep the apprentice's name quiet The mortal tells no one who struck the coin. The mint-master will remember the mercy.

> Name the apprentice to the council The town trusts the mortal more, and the mint-master will not forgive it.

**`fallback/success_at_cost`** · 88 words

The assayer found the coin true, and the mint stays open. The street still talks of a thief at the mint that night.

- Vouched for by {cast:mintmaster} — {location} thinks a little better of {actor}.

- Carried out of the strongroom — The Coiner's Dies are in {actor}'s possessions now.

> Keep the apprentice's name quiet The mortal tells no one who struck the coin. The mint-master will remember the mercy.

> Name the apprentice to the council The town trusts the mortal more, and the mint-master will not forgive it.

**`fallback/failure`** · 71 words

The assayer found light coin in the mint's chests. The mint is shut, and {cast:mintmaster} is held for the crown's court. {location} had sent for {actor} to stop it.

- {location} thinks less of {actor} now.

> Swear for the mint-master The mortal swears the mint-master did not know. The mint-master will remember who stood up.

> Name the apprentice to the court The town hears it, and the mint-master will not forgive it.

**`fallback/critical_failure`** · 65 words

The assayer found light coin, and the mint is shut. {location} sent for {actor} as a master, and now calls them the coiner.

- {location} thinks less of {actor} now.

> Swear for the mint-master The mortal swears the mint-master did not know. The mint-master will remember who stood up.

> Name the apprentice to the court The town hears it, and the mint-master will not forgive it.

</details>

### `encounter.town.ducal_nativity`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.ducal_nativity) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.ducal_nativity) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: nativity.kindle_duty)

- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 8 words

{actor} took the hard star to the duke.

**`positive/critical_success`** · 32 words

{cast:astrologer} left the feast early. The duke's healers are already watching over the child.

- {location} thinks better of {actor}'s star-reading.

- {cast:duke} owes {actor} a favour.

- {actor} is pursuing Fulfill the Destiny now.

**`positive/success`** · 31 words

The court went quiet. No one cheered the cathedral's chart again that night.

- {location} thinks better of {actor}'s star-reading.

- {cast:duke} owes {actor} a favour.

- {actor} is pursuing Fulfill the Destiny now.

**`positive/success_at_cost`** · 36 words

The duke has sent for healers. {cast:astrologer} has told the cathedral that {actor} called its chart a lie.

- {location} thinks better of {actor}'s star-reading.

- {cast:duke} owes {actor} a favour.

- {actor} is pursuing Fulfill the Destiny now.

**`positive/failure`** · 35 words

The duke took the first astrologer's word over {actor}'s. By morning the streets were saying the stars foretell a plague.

- Doors stay shut in {location}, and travellers go around it.

- {location} trusts {actor}'s star-reading less.

**`positive/critical_failure`** · 22 words

{location} is saying the star over the heir's birth means plague, and that {actor} saw it first.

- {location} trusts {actor}'s star-reading less.

**`negative`** · 8 words

{actor} kept the hard star from the court.

**`negative/critical_success`** · 24 words

Only {actor} knows that the child's first year will be hard.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Fulfill the Destiny now.

**`negative/success`** · 21 words

No one asked about the child's first year.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Fulfill the Destiny now.

**`negative/success_at_cost`** · 30 words

The court was satisfied. {cast:astrologer} asked {actor} twice about the child's first year, and got no answer.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Fulfill the Destiny now.

**`negative/failure`** · 30 words

By morning the streets were saying {actor} had seen a plague in the heir's stars.

- Doors stay shut in {location}, and travellers go around it.

- {location} trusts {actor}'s star-reading less.

**`negative/critical_failure`** · 22 words

{location} is saying the star over the heir's birth means plague, and that {actor} saw it first.

- {location} trusts {actor}'s star-reading less.

**`fallback`** · 8 words

{actor} read the sky and told no one.

**`fallback/critical_success`** · 21 words

{actor} read the sky and told no one.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Fulfill the Destiny now.

**`fallback/success`** · 24 words

The court kept its feast, and the cathedral's chart still stands.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Fulfill the Destiny now.

**`fallback/success_at_cost`** · 21 words

{actor} read the sky and told no one.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Fulfill the Destiny now.

**`fallback/failure`** · 29 words

The court never heard of the hard star, and the cathedral's chart still stands.

- Doors stay shut in {location}, and travellers go around it.

- {location} trusts {actor}'s star-reading less.

**`fallback/critical_failure`** · 16 words

{location} is saying the star over the heir's birth means plague.

- {location} trusts {actor}'s star-reading less.

</details>

### `encounter.town.cathedral_vault`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.cathedral_vault) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.cathedral_vault) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: vault.hurry_the_season)

- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — condition authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 7 words

{actor} struck the centering before the rains.

**`positive/critical_success`** · 78 words

The church opened to {location} before the first rain, and the monks held their first service under the new vault that week.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`positive/success`** · 70 words

The church opened before winter, as {cast:abbot} wanted, and the vault needed no repair.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`positive/success_at_cost`** · 73 words

The last dry days went on the vault, and the church opened late, in the first rain.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`positive/failure`** · 87 words

The church stays shut until spring, and the cracked vault must be repaired before it opens. A builder sent for by name is only as good as the last vault they struck.

- {location} no longer trusts {actor}'s word on stone.

- {cast:abbot} blames {actor} for the vault.

> Stay And Rebuild The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.

> Defend Their Name The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.

**`positive/critical_failure`** · 71 words

No one was hurt. The abbey must clear the broken stone and build its vault again.

- {location} no longer trusts {actor}'s word on stone.

- {cast:abbot} blames {actor} for the vault.

> Stay And Rebuild The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.

> Defend Their Name The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.

**`negative`** · 7 words

{actor} kept the centering in until spring.

**`negative/critical_success`** · 74 words

In spring the frame came out in a day, and the church opened with the first fine weather.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`negative/success`** · 79 words

The frame came out in spring, and the vault took its own weight. The church opened a season late, with its vault whole.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`negative/success_at_cost`** · 71 words

The church opened late in spring, once the last work on the vault was done.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`negative/failure`** · 76 words

The cracked bay must come down and be built again before the church can open. The rest of the vault stands.

- {location} no longer trusts {actor}'s word on stone.

- {cast:abbot} blames {actor} for the vault.

> Stay And Rebuild The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.

> Defend Their Name The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.

**`negative/critical_failure`** · 72 words

Half the vault had to come down. {cast:abbot} has sent for another master to build it again.

- {location} no longer trusts {actor}'s word on stone.

- {cast:abbot} blames {actor} for the vault.

> Stay And Rebuild The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.

> Defend Their Name The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.

**`fallback`** · 7 words

{actor} tested the vault for the abbey.

**`fallback/critical_success`** · 74 words

In spring the frame came out in a day, and the church opened with the first fine weather.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`fallback/success`** · 79 words

The frame came out in spring, and the vault took its own weight. The church opened a season late, with its vault whole.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`fallback/success_at_cost`** · 71 words

The church opened late in spring, once the last work on the vault was done.

- {cast:abbot} trusts {actor}'s judgement of stone now.

- {location} keeps a feast for the new church.

> Credit The Crew The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.

> Accept The Thanks The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.

**`fallback/failure`** · 76 words

The cracked bay must come down and be built again before the church can open. The rest of the vault stands.

- {location} no longer trusts {actor}'s word on stone.

- {cast:abbot} blames {actor} for the vault.

> Stay And Rebuild The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.

> Defend Their Name The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.

**`fallback/critical_failure`** · 16 words

The frame stays under the vault, and the abbey has stopped all work on the church.

</details>

### `encounter.town.restless_ossuary`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.restless_ossuary) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.restless_ossuary) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: ossuary.remember_lost_names, ossuary.delay_first_light, ossuary.stir_old_grudges)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 72 words

{actor} has finished the work under the cathedral, and {location} waits to see if its dead stay quiet.

> Credit the weavers' sacrifice The mortal thanks the weavers, in front of every guild, for giving up their first dead. Their warden will remember it kindly.

> Name the weavers' refusal The mortal tells the town the weavers' refusal nearly kept the dead restless. The town agrees, and the weavers' warden will not forget it.

**`fallback/critical_success`** · 94 words

The dead under the cathedral lie quiet, and every guild has put its hand to the ruling. The dean gives {actor} the relic found under the weavers' bones, in front of all the wardens.

- {location} thinks well of {actor} now.

> Credit the weavers' sacrifice The mortal thanks the weavers, in front of every guild, for giving up their first dead. Their warden will remember it kindly.

> Name the weavers' refusal The mortal tells the town the weavers' refusal nearly kept the dead restless. The town agrees, and the weavers' warden will not forget it.

**`fallback/success`** · 79 words

The dead under the cathedral lie quiet. The dean lets {actor} keep the relic found under the weavers' bones.

- {location} thinks well of {actor} now.

> Credit the weavers' sacrifice The mortal thanks the weavers, in front of every guild, for giving up their first dead. Their warden will remember it kindly.

> Name the weavers' refusal The mortal tells the town the weavers' refusal nearly kept the dead restless. The town agrees, and the weavers' warden will not forget it.

**`fallback/success_at_cost`** · 86 words

The dead under the cathedral lie quiet, but the weavers have not forgiven the ruling. The dean still gives {actor} the relic found under their bones.

- {location} thinks well of {actor} now.

> Credit the weavers' sacrifice The mortal thanks the weavers, in front of every guild, for giving up their first dead. Their warden will remember it kindly.

> Name the weavers' refusal The mortal tells the town the weavers' refusal nearly kept the dead restless. The town agrees, and the weavers' warden will not forget it.

**`fallback/failure`** · 80 words

The dead under the cathedral are still restless, and the guilds have torn up the ruling. {actor} was sent for as a master, and every guild watched the work fail.

- {location} thinks less of {actor} now.

> Keep watch unasked The mortal keeps watch over the bones one more night, without being asked, and the town notices.

> Blame the weavers' warden The mortal tells the dean the weavers' warden was the trouble from the start, and the warden hears of it.

**`fallback/critical_failure`** · 76 words

The dead under the cathedral are still restless, and the dean has sent {actor} away. Every guild says a master should not have failed so badly.

- {location} thinks less of {actor} now.

> Keep watch unasked The mortal keeps watch over the bones one more night, without being asked, and the town notices.

> Blame the weavers' warden The mortal tells the dean the weavers' warden was the trouble from the start, and the warden hears of it.

</details>

## Director's sample

Ruling: Christian reviews **2** of the 8, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.town.forged_charter_inquest` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.forged_charter_inquest)
- `encounter.town.cathedral_loan` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.cathedral_loan)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
