# Encounter batch report — 2026-10-14

**Batch:** 8 encounter(s) (ruling 1 sets the batch at 6)
**Brief:** `Docs/plans/encounters/master-everyday-2-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.poisoned_feast` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation, content_query | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.poisoned_feast) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.poisoned_feast) |
| `encounter.town.salt_monopoly` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.salt_monopoly) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.salt_monopoly) |
| `encounter.town.hostage_exchange` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.hostage_exchange) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.hostage_exchange) |
| `encounter.town.tourney_marshal` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.tourney_marshal) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.tourney_marshal) |
| `encounter.town.guildhall_spy` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation, factions, content_query | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.guildhall_spy) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.guildhall_spy) |
| `encounter.town.easter_reckoning` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.easter_reckoning) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.easter_reckoning) |
| `encounter.town.hill_conduit` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.hill_conduit) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.hill_conduit) |
| `encounter.town.witch_trial` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.witch_trial) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.witch_trial) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**2 of 8** encounter(s) author a content query; **1** resolved one live.

Authored by: `encounter.town.poisoned_feast`, `encounter.town.guildhall_spy`.

> 1 authored quer(ies) did not resolve on their live run — either the band carrying them was not rolled, or the family they name is empty. The `content_query_resolved` claim rows say which.

## Appointment census

**1 of 8** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.easter_reckoning`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.poisoned_feast` | 🔗 connected | The master's standing with the town rises or falls on its page, a win leaves the town coroner owing them a favour, the poisoner they failed to name carries a hidden mark, and whoever paid for the poison sends hired strangers after them some days later (The Hired Knives), so the cost of surviving the feast comes back on the road. |
| `encounter.town.salt_monopoly` | 🔗 connected | The mortal walks out holding the town's Gate Seal Case and with their standing in the town moved up or down, and on a win the rival salt house's factor is seated, by name, as the rival bidder when The Mill Lease finds the mortal later. |
| `encounter.town.hostage_exchange` | 🔗 connected | When the exchange works, the master leaves with the held heir Edric Marrow trusting them, a sellsword band hired on a short contract, the captain Bram Hollis holding a grudge, and better standing in the town; when it fails, the heir doubts them and the town thinks less of them, and the player sees each change on the heir's sheet, the captain's sheet and the Companions row. |
| `encounter.town.tourney_marshal` | 🔗 connected | The young noble's house owes the marshal a favour that can be called in later, the town keeps a Festival and thinks better of its marshal; on failure the noble carries a Wounded condition, the house trusts the marshal less and the town thinks less of them, and the success-side reactions move the marshal's bond with the champion or the noble. |
| `encounter.town.guildhall_spy` | 🔗 connected | Naming the spy puts the mortal on the Merchant Consortium's rolls (visible on their sheet and the faction's roster) and plants Consortium errand work that turns up later; failing costs them standing with the town, and the reaction moves the guildhall warden's regard either way. |
| `encounter.town.easter_reckoning` | 🔗 connected | A proved reckoning books the master into the town's chapter house on synod day, three days out, with the dean Osric Fenwold as counterparty (kept or missed by where they go, and the dean comes looking if they miss it), moves their standing with the town, gives them the Spread the Faith ambition, and leaves a good-year or bad-year omen that the prose now states and that tilts later encounter draws. |
| `encounter.town.hill_conduit` | 🔗 connected | The town's standing with the master moves either way, a success leaves the master Inspired and pursuing Build a Great Work, a failure puts a Plague Scare on the town and a compulsion toward building work on the master, and the reeve Edith Marlow and herdsman Hob Fenner carry the bonds the reactions make. |
| `encounter.town.witch_trial` | 🔗 connected | The mortal leaves either a healer (Maud Ellery, or the town's own healer) who trusts them and a healing remedy in hand, or a magistrate who trusts them less; the town's regard moves either way, a hidden mark records that the miller ground the spoiled rye knowingly (a later investigation can surface it), and the quiet reaction leaves the magistrate owing them a favour. |

## Verdict roll-up

- **Gate green:** 8 / 8
- **Live proved:** 8 / 8
- **Live vacuous:** 0 / 8

## Per-encounter detail

### `encounter.town.poisoned_feast`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.poisoned_feast) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.poisoned_feast) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: feast.rouse_the_stricken, feast.cool_a_hot_grudge)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `condition_applied` — template declares no condition effect
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 11 words

The coroner's inquest at the guild feast in {location} is closed.

**`fallback/critical_success`** · 40 words

{cast:coroner} ruled the guild-master poisoned by {cast:poisoner}, and the guild-master is awake and mending.

- {location} thinks well of {actor}.

- Spared a wrong ruling — {cast:coroner} owes {actor} a favour.

- Whoever paid for the poison is sending their people after {actor}.

**`fallback/success`** · 39 words

{cast:coroner} ruled that {cast:poisoner} poisoned the cup, and {actor} leaves the inquest cleared.

- {location} thinks well of {actor}.

- Spared a wrong ruling — {cast:coroner} owes {actor} a favour.

- Whoever paid for the poison is sending their people after {actor}.

**`fallback/success_at_cost`** · 44 words

{cast:coroner} ruled for {actor}, but the guild has not forgiven the master who named one of its own.

- {location} thinks well of {actor}.

- Spared a wrong ruling — {cast:coroner} owes {actor} a favour.

- Whoever paid for the poison is sending their people after {actor}.

**`fallback/failure`** · 33 words

{cast:coroner} closed the inquest with no hand named, and half the guild believes {actor} poured the cup.

- {location} thinks less of {actor}.

- Whoever paid for the poison is sending their people after {actor}.

**`fallback/critical_failure`** · 23 words

{cast:coroner}'s record names {actor} as the likeliest hand, and the guild believes it.

- Before the whole guild — {location} thinks less of {actor}.

</details>

### `encounter.town.salt_monopoly`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.salt_monopoly) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.salt_monopoly) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: salt.cloud_the_tally, salt.stretch_the_hour)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `reward_node` — reward authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `seed_planted` — seed authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 11 words

{actor} left the chancery once the clerk had sealed the licence.

**`fallback/critical_success`** · 113 words

The salt of the whole region is the town's for ten years. The council read the duke's licence aloud in the square, with {actor}'s name beside the town's.

- Handed over with the licence — {actor} holds the stamp for the town's licensed salt.

- {location} trusts {actor} with its trade.

- Outbid at the chancery — {cast:merchant} will bid against {actor} for the next lease.

> Offer the losing house the carting Give the rival house the work of carting the town's salt. The factor is warmer toward the mortal for it.

> Keep every cart for the town The town's own carters keep the work. The town's regard rises, and the factor takes against the mortal.

**`fallback/success`** · 103 words

The salt of the region is the town's for ten years, and the council knows who won it.

- Handed over with the licence — {actor} holds the stamp for the town's licensed salt.

- {location} trusts {actor} with its trade.

- Outbid at the chancery — {cast:merchant} will bid against {actor} for the next lease.

> Offer the losing house the carting Give the rival house the work of carting the town's salt. The factor is warmer toward the mortal for it.

> Keep every cart for the town The town's own carters keep the work. The town's regard rises, and the factor takes against the mortal.

**`fallback/success_at_cost`** · 102 words

The licence is the town's, but part of the price is still owed to the chancery, and someone must stand for it.

- Handed over with the licence — {actor} holds the stamp for the town's licensed salt.

- {location} trusts {actor} with its trade.

- Outbid at the chancery — {cast:merchant} will bid against {actor} for the next lease.

> Carry the town's debt The mortal owes the chancery what the town could not pay. The town's regard rises for it.

> Leave the debt with the council The council pays the rest itself. None of it falls on the mortal, and the town's regard falls.

**`fallback/failure`** · 34 words

The council sent {actor} by name to win the salt, and the salt has gone to the rival town for ten years.

- Every backer heard — {location} thinks less of {actor}'s word on money.

**`fallback/critical_failure`** · 35 words

The salt has gone to the rival town for ten years, and the whole council saw the town's purse fall short. {actor} was the one it sent.

- {location} thinks less of {actor}'s word on money.

</details>

### `encounter.town.hostage_exchange`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.hostage_exchange) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.hostage_exchange) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: hostage.loosen_guarded_tongues, hostage.stand_as_surety)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 61 words

The bridge empties, and {location} talks about the exchange.

> Let the captain go quietly The mortal keeps the captain's demand out of the town's talk. The captain will remember the kindness.

> Tell the town what the captain asked The mortal tells the town what the captain demanded on the bridge. The town will think better of the mortal for refusing it.

**`fallback/critical_success`** · 99 words

The two houses renewed their peace in front of the town that evening, with {actor} standing between them.

- {location} thinks better of {actor} now.

- {cast:heir} trusts {actor} now.

- The sergeant's men quit the captain for a short contract with {actor}.

- {cast:captain} blames {actor} for the lost ransom.

> Let the captain go quietly The mortal keeps the captain's demand out of the town's talk. The captain will remember the kindness.

> Tell the town what the captain asked The mortal tells the town what the captain demanded on the bridge. The town will think better of the mortal for refusing it.

**`fallback/success`** · 93 words

Both heirs are home, and the peace between the two houses holds.

- {location} thinks better of {actor} now.

- {cast:heir} trusts {actor} now.

- The sergeant's men quit the captain for a short contract with {actor}.

- {cast:captain} blames {actor} for the lost ransom.

> Let the captain go quietly The mortal keeps the captain's demand out of the town's talk. The captain will remember the kindness.

> Tell the town what the captain asked The mortal tells the town what the captain demanded on the bridge. The town will think better of the mortal for refusing it.

**`fallback/success_at_cost`** · 96 words

Both heirs are home, but the exchange came close to blows before it was done.

- {location} thinks better of {actor} now.

- {cast:heir} trusts {actor} now.

- The sergeant's men quit the captain for a short contract with {actor}.

- {cast:captain} blames {actor} for the lost ransom.

> Let the captain go quietly The mortal keeps the captain's demand out of the town's talk. The captain will remember the kindness.

> Tell the town what the captain asked The mortal tells the town what the captain demanded on the bridge. The town will think better of the mortal for refusing it.

**`fallback/failure`** · 82 words

Both heirs are still hostages, and the two houses are counting the days again. They sent for a master so the haggling would end, and the captain outlasted {actor}.

- {location} thinks less of {actor} now.

- {cast:heir} trusts {actor} less now.

> Stand by the held heir The mortal stays at the held heir's side until the houses part. The heir will remember it kindly.

> Blame the captain openly The mortal names the captain's greed before both houses. The captain will not forgive it.

**`fallback/critical_failure`** · 79 words

The peace between the two houses is broken, and both heirs are still hostages. Both houses sent for {actor}, and both now blame {actor} for it.

- {location} thinks less of {actor} now.

- {cast:heir} trusts {actor} less now.

> Stand by the held heir The mortal stays at the held heir's side until the houses part. The heir will remember it kindly.

> Blame the captain openly The mortal names the captain's greed before both houses. The captain will not forgive it.

</details>

### `encounter.town.tourney_marshal`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.tourney_marshal) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.tourney_marshal) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: tourney.halt_the_blade, tourney.dull_the_sword_arm)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 14 words

The heralds close the lists, and the crowd goes back through the town gate.

**`fallback/critical_success`** · 104 words

The order and {cast:heir}'s house both agreed before the whole field that the bout was ended, and both fighters walked out of the lists.

- {cast:heir} owes {actor} a favour now.

- {location} keeps the tourney's last day as a feast.

- {location} thinks well of {actor} now.

> Give the order its honour Announce that the champion lowered the sword at the marshal's word. The champion will remember it, and the young noble's house will not like it.

> Call the bout a draw Announce that neither fighter yielded and neither lost. The noble's family thinks better of the mortal, and the champion takes it as a slight.

**`fallback/success`** · 102 words

{cast:heir}'s house carried the young noble home on a litter, bruised and alive. The order's knights rode out of {location} by evening.

- {cast:heir} owes {actor} a favour now.

- {location} keeps the tourney's last day as a feast.

- {location} thinks well of {actor} now.

> Give the order its honour Announce that the champion lowered the sword at the marshal's word. The champion will remember it, and the young noble's house will not like it.

> Call the bout a draw Announce that neither fighter yielded and neither lost. The noble's family thinks better of the mortal, and the champion takes it as a slight.

**`fallback/success_at_cost`** · 113 words

The bout is ended and {cast:heir} is alive, but it came closer to a killing than a marshal should allow. The order's knights left the field that evening without a word to {actor}.

- {cast:heir} owes {actor} a favour now.

- {location} keeps the tourney's last day as a feast.

- {location} thinks well of {actor} now.

> Give the order its honour Announce that the champion lowered the sword at the marshal's word. The champion will remember it, and the young noble's house will not like it.

> Call the bout a draw Announce that neither fighter yielded and neither lost. The noble's family thinks better of the mortal, and the champion takes it as a slight.

**`fallback/failure`** · 86 words

The heralds closed the lists, and the order rode out of {location} calling the bout won. The town made {actor} marshal to stop exactly this.

- {cast:heir} is Wounded from the bout.

- {location} thinks less of {actor} now.

- {cast:heir} trusts {actor} less.

> Carry the young noble to the healers The mortal stays with the house until the healers are done. The house will remember who stayed.

> Ask the champion about the doctrine The mortal asks the order's champion what the doctrine holds to, and keeps the answer.

**`fallback/critical_failure`** · 81 words

{cast:heir} was carried off the field more dead than alive. The young noble's house told the whole town that its marshal could not keep the lists.

- {location} thinks less of {actor} now.

- {cast:heir} trusts {actor} less.

> Carry the young noble to the healers The mortal stays with the house until the healers are done. The house will remember who stayed.

> Ask the champion about the doctrine The mortal asks the order's champion what the doctrine holds to, and keeps the answer.

</details>

### `encounter.town.guildhall_spy`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.guildhall_spy) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.guildhall_spy) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (1 tick(s), hand: spy.show_an_honest_face)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `reward_node` — reward authored only in step metadata on a side its step did not take (step outcomes: failure)
- · `seed_planted` — seed authored only in step metadata on a side its step did not take (step outcomes: failure)
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — content query authored only in step metadata on a side its step did not take (step outcomes: failure)
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 7 words

The council has voted on the gates.

**`fallback/critical_success`** · 93 words

The council voted to close the gates to the rival city once the letters were read to the inner council.

- Vouched for by {cast:warden} — {actor} is on the rolls of the Merchant Consortium now.

- Word of the spy reaches the Merchant Consortium, which has work for {actor}.

> Name the spy in open hall The whole council hears who betrayed it. The warden wanted it kept quiet, and will hold that against the mortal.

> Keep the name inside the council Only the inner council keeps the name. The warden will remember the discretion.

**`fallback/success`** · 88 words

The council voted to close the gates to the rival city, with its spy held.

- Vouched for by {cast:warden} — {actor} is on the rolls of the Merchant Consortium now.

- Word of the spy reaches the Merchant Consortium, which has work for {actor}.

> Name the spy in open hall The whole council hears who betrayed it. The warden wanted it kept quiet, and will hold that against the mortal.

> Keep the name inside the council Only the inner council keeps the name. The warden will remember the discretion.

**`fallback/success_at_cost`** · 95 words

The council voted to close the gates to the rival city, with its spy gone and nobody held for it.

- Vouched for by {cast:warden} — {actor} is on the rolls of the Merchant Consortium now.

- Word of the spy reaches the Merchant Consortium, which has work for {actor}.

> Name the spy in open hall The whole council hears who fled and why. The warden wanted it kept quiet, and will hold that against {actor}.

> Keep the name inside the council The town hears only that a councillor has left. The warden will remember the discretion.

**`fallback/failure`** · 28 words

The vote to close the gates failed by the spy's own vote. {location} asked {actor} for a name and never got one.

- {location} thinks less of {actor} now.

**`fallback/critical_failure`** · 37 words

The council spent the sitting on the wrong name, and the gates stay open to the rival city. {location} asked {actor} for the spy and was handed an honest councillor instead.

- {location} thinks less of {actor} now.

</details>

### `encounter.town.easter_reckoning`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.easter_reckoning) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.easter_reckoning) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: reckoning.clear_the_dawn, reckoning.rouse_the_elder)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `reward_node` — reward authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `seed_planted` — seed authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — appointment authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `appointment_missed` — appointment authored only in step metadata on a side its step did not take (step outcomes: failure, failure)

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 11 words

The cathedral's tables in {location} have been reckoned against the sky.

**`fallback/critical_success`** · 57 words

The bishop has told the diocese to wait for the synod before proclaiming the feast.

- The chapter's word on it — {location} thinks well of their reckoning.

- Every parish on the true day — {actor} is pursuing Spread the Faith now.

- Synod day in the chapter house — {cast:dean} answers the reckoning in {location} in three days.

**`fallback/success`** · 52 words

The chapter has the reckoning in writing, under {actor}'s hand.

- The chapter's word on it — {location} thinks well of their reckoning.

- Every parish on the true day — {actor} is pursuing Spread the Faith now.

- Synod day in the chapter house — {cast:dean} answers the reckoning in {location} in three days.

**`fallback/success_at_cost`** · 51 words

Half the chapter now sides with {cast:dean} against {actor}.

- The chapter's word on it — {location} thinks well of their reckoning.

- Every parish on the true day — {actor} is pursuing Spread the Faith now.

- Synod day in the chapter house — {cast:dean} answers the reckoning in {location} in three days.

**`fallback/failure`** · 41 words

The cathedral will proclaim the feast a week late, which the bishop sent a master to stop, and the old priests say a year begun on a false feast goes badly.

- The tables stand — {location} thinks less of their reckoning.

**`fallback/critical_failure`** · 27 words

The dean now has a master's own error to set against the old priests.

- An error in their own reckoning — {location} thinks less of their reckoning.

</details>

### `encounter.town.hill_conduit`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.hill_conduit) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.hill_conduit) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: conduit.mark_the_boundary)

- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 10 words

{actor} laid the conduit the long way round the pasture.

**`positive/critical_success`** · 68 words

The lord's pasture was never touched, and {location} has its spring water within the month.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

> Accept The Thanks The mortal takes the thanks of {location} in person. Its people think better of them.

**`positive/success`** · 70 words

The work ran a month long, and the lord's grazing is whole. The sick children are mending.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

> Accept The Thanks The mortal takes the thanks of {location} in person. Its people think better of them.

**`positive/success_at_cost`** · 67 words

{location} spent another week on its old wells, but the spring water runs now.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

> Accept The Thanks The mortal takes the thanks of {location} in person. Its people think better of them.

**`positive/failure`** · 102 words

The long conduit runs, but what reaches {location} is no better than its wells. A master sent for by name is judged by whether the water came.

- {location} no longer trusts {actor} with its water.

- Travellers now steer clear of {location} for fear of sickness.

- For a while {actor} is drawn to building work over all else.

> Cart The Water The mortal carts spring water down to {location} for the sick. {cast:reeve} thinks better of them.

> Blame The Hill The mortal tells {location} the hill falls too little for a long line. Its people hear them out; {cast:reeve} does not believe it.

**`positive/critical_failure`** · 70 words

No clean water came down to {location}, and {cast:reeve} has sent for another builder in {actor}'s place.

- {location} no longer trusts {actor} with its water.

> Cart The Water The mortal carts spring water down to {location} for the sick. {cast:reeve} thinks better of them.

> Blame The Hill The mortal tells {location} the hill falls too little for a long line. Its people hear them out; {cast:reeve} does not believe it.

**`negative`** · 8 words

{actor} cut the conduit across the lord's pasture.

**`negative/critical_success`** · 72 words

Clean water reached {location} within days, and the herdsmen have made their peace with the line under their grass.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Pay For The Grazing The mortal pays the herdsmen for the grass the trench cost. {cast:herdsman} remembers it.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

**`negative/success`** · 68 words

The sick children of {location} are mending, and the old wells are being filled in.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Pay For The Grazing The mortal pays the herdsmen for the grass the trench cost. {cast:herdsman} remembers it.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

**`negative/success_at_cost`** · 71 words

The water came down at last. The herdsmen cursed every day the trench lay open in their grass.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Pay For The Grazing The mortal pays the herdsmen for the grass the trench cost. {cast:herdsman} remembers it.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

**`negative/failure`** · 93 words

{location} still draws its water from the old wells. A master sent for by name is judged by whether the water came.

- {location} no longer trusts {actor} with its water.

- Travellers now steer clear of {location} for fear of sickness.

- For a while {actor} is drawn to building work over all else.

> Cart The Water The mortal carts spring water down to {location} for the sick. {cast:reeve} thinks better of them.

> Blame The Herdsmen The mortal tells {location} the herdsmen broke the work. Its people hear them out; {cast:herdsman} does not forgive it.

**`negative/critical_failure`** · 69 words

{location} still has only its foul wells, and {cast:reeve} has sent for another builder in {actor}'s place.

- {location} no longer trusts {actor} with its water.

> Cart The Water The mortal carts spring water down to {location} for the sick. {cast:reeve} thinks better of them.

> Blame The Pasture The mortal tells {location} the lord's guarded pasture stood in the way. Its people hear them out; {cast:herdsman} does not forgive it.

**`fallback`** · 6 words

{actor} surveyed the hill for {location}.

**`fallback/critical_success`** · 68 words

The lord's pasture was never touched, and {location} has its spring water within the month.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

> Accept The Thanks The mortal takes the thanks of {location} in person. Its people think better of them.

**`fallback/success`** · 70 words

The work ran a month long, and the lord's grazing is whole. The sick children are mending.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

> Accept The Thanks The mortal takes the thanks of {location} in person. Its people think better of them.

**`fallback/success_at_cost`** · 67 words

{location} spent another week on its old wells, but the spring water runs now.

- Bringing the water down has left {actor} Inspired.

- {actor} is pursuing Build a Great Work now.

> Teach The Upkeep The mortal shows {cast:reeve} how to clear the conduit each spring. The reeve trusts their work.

> Accept The Thanks The mortal takes the thanks of {location} in person. Its people think better of them.

**`fallback/failure`** · 102 words

The long conduit runs, but what reaches {location} is no better than its wells. A master sent for by name is judged by whether the water came.

- {location} no longer trusts {actor} with its water.

- Travellers now steer clear of {location} for fear of sickness.

- For a while {actor} is drawn to building work over all else.

> Cart The Water The mortal carts spring water down to {location} for the sick. {cast:reeve} thinks better of them.

> Blame The Hill The mortal tells {location} the hill falls too little for a long line. Its people hear them out; {cast:reeve} does not believe it.

**`fallback/critical_failure`** · 42 words

The survey line rises halfway down, and {location} has stopped all work on the conduit.

- {location} no longer trusts {actor} with its water.

> Cart The Water The mortal carts spring water down to {location} for the sick. {cast:reeve} thinks better of them.

</details>

### `encounter.town.witch_trial`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.witch_trial) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.witch_trial) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (5 tick(s), hand: witch.settle_frightened_breath, witch.quicken_hidden_rot, witch.silence_angry_square)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 72 words

{actor} has given the magistrate a ruling, and {location} waits to see what it does with the healer.

> Name the miller in the square The mortal tells the whole square what the miller did. The town is grateful; the magistrate wanted it kept quiet.

> Leave the miller to the magistrate The mortal tells only the magistrate, and keeps the miller's part out of the square. The magistrate owes them for the quiet.

**`fallback/critical_success`** · 98 words

{cast:accused} is cleared, and the whole lane saw it done. The healer presses a remedy from the house into {actor}'s hands in thanks.

- {cast:accused} trusts {actor} now.

- {location} thinks well of {actor} now.

- {actor} knows the miller ground the rye knowing it was spoiled.

> Name the miller in the square The mortal tells the whole square what the miller did. The town is grateful; the magistrate wanted it kept quiet.

> Leave the miller to the magistrate The mortal tells only the magistrate, and keeps the miller's part out of the square. The magistrate owes them for the quiet.

**`fallback/success`** · 97 words

{cast:accused} is out of the stocks, and the pyre comes down. The healer gives {actor} a remedy from the house in thanks.

- {cast:accused} trusts {actor} now.

- {location} thinks well of {actor} now.

- {actor} knows the miller ground the rye knowing it was spoiled.

> Name the miller in the square The mortal tells the whole square what the miller did. The town is grateful; the magistrate wanted it kept quiet.

> Leave the miller to the magistrate The mortal tells only the magistrate, and keeps the miller's part out of the square. The magistrate owes them for the quiet.

**`fallback/success_at_cost`** · 104 words

{cast:accused} is out of the stocks and gives {actor} a remedy from the house in thanks. The miller is still calling {actor} a liar to anyone who will listen.

- {cast:accused} trusts {actor} now.

- {location} thinks well of {actor} now.

- {actor} knows the miller ground the rye knowing it was spoiled.

> Name the miller in the square The mortal tells the whole square what the miller did. The town is grateful; the magistrate wanted it kept quiet.

> Leave the miller to the magistrate The mortal tells only the magistrate, and keeps the miller's part out of the square. The magistrate owes them for the quiet.

**`fallback/failure`** · 103 words

The healer is alive and held in chains, and the pyre still stands in the square. The magistrate sent for a master to settle this, and it is not settled.

- {cast:magistrate} trusts {actor} less now.

- {location} thinks less of {actor} now.

> Sit with the healer in chains The mortal sits by the healer through the night, where the town can see. The healer will remember it, and the town will too.

> Stay clear of the healer The mortal keeps away from the healer that night, so the crowd has no reason to turn on them too. The healer sees who did not come.

**`fallback/critical_failure`** · 103 words

The crowd burned the healer's house and every remedy in it, and the healer is held in chains. A master was sent for to stop this, and it happened anyway.

- {cast:magistrate} trusts {actor} less now.

- {location} thinks less of {actor} now.

> Sit with the healer in chains The mortal sits by the healer through the night, where the town can see. The healer will remember it, and the town will too.

> Stay clear of the healer The mortal keeps away from the healer that night, so the crowd has no reason to turn on them too. The healer sees who did not come.

</details>

## Director's sample

Ruling: Christian reviews **2** of the 8, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.town.poisoned_feast` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.poisoned_feast)
- `encounter.town.salt_monopoly` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.salt_monopoly)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.

## Success-side evidence (seed sweep, `check:encounter-live --play all`)

At master difficulty the proof ascendant loses most natural runs, so the table above (seed 42) shows the failure side only. A seed sweep took each encounter's success side where one exists:

| Encounter | Success-side run | Result |
|---|---|---|
| `encounter.town.poisoned_feast` | seed 99, seed 4 | success_at_cost, proved |
| `encounter.town.salt_monopoly` | seed 4 | success_at_cost (`salt.sac.take_the_debt`), proved: reward and seed arrived |
| `encounter.town.hostage_exchange` | seed 99 | success_at_cost (`hostage.let_the_captain_go_quietly`), proved |
| `encounter.town.tourney_marshal` | seeds 1–15, 42, 99 | **not exercised**: 17 seeds, all failure or critical_failure. Success-side rows are unproved, not proved |
| `encounter.town.guildhall_spy` | seed 99 | success_at_cost (`spy.name_in_hall.cost`), proved |
| `encounter.town.easter_reckoning` | seed 4 | success_at_cost, proved, **appointment kept and missed both proved** |
| `encounter.town.hill_conduit` | seed 2 | success_at_cost (`conduit.pos.cost.teach_upkeep`), proved; seeds 42 / 99 took the two arms of the fork |
| `encounter.town.witch_trial` | seed 3 | success_at_cost (`witch.name_the_miller`), proved |

## Critic loop

Each encounter had an author pass (draft → self-edit against the 35 REVISE triggers → package, gated with `check:encounter --package`) and then a separate cold critic pass (editorial + systems + package critic, fixes applied, re-gated). All eight closed in one loop: editorial PASS WITH REVISIONS ×8; systems READY ×2 / READY WITH CAVEATS ×6; package PASS (connected) ×8; none parked. Critic files: `<slug>-editorial.md`, `<slug>-systems.md`, `<slug>-package.md`, `<slug>-final.md`.
