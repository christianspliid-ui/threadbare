# Encounter batch report — 2026-10-15

**Batch:** 8 encounter(s) (ruling 1 sets the batch at 6)
**Brief:** `Docs/plans/encounters/master-everyday-3-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.returned_heir` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.returned_heir) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.returned_heir) |
| `encounter.town.wool_staple` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.wool_staple) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.wool_staple) |
| `encounter.town.gallows_pardon` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, reputation, content_query | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.gallows_pardon) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.gallows_pardon) |
| `encounter.town.tannery_fire` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.tannery_fire) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.tannery_fire) |
| `encounter.town.fugitive_friar` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation, factions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.fugitive_friar) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.fugitive_friar) |
| `encounter.town.bloodletting_hour` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.bloodletting_hour) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.bloodletting_hour) |
| `encounter.town.silver_drift_rescue` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, conditions, reputation, factions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.silver_drift_rescue) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.silver_drift_rescue) |
| `encounter.town.sin_eater` | ✅ green | ✅ proved | — not run | failure | cast, rewards, conditions, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.sin_eater) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.sin_eater) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**1 of 8** encounter(s) author a content query; **1** resolved one live.

Authored by: `encounter.town.gallows_pardon`.

## Appointment census

**1 of 8** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.returned_heir`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.returned_heir` | 🔗 connected | A finding the master can stand behind books them into the manor court in the town on court day, three days out, with the steward Wystan Pell to hear it (kept: the court names the man the lord's son; missed: the claimant Aldous Harrow comes looking for them wherever they are), and either way it moves their standing with the town and their bond with Aldous Harrow, and a failed reading has them shown the road away from the town. |
| `encounter.town.wool_staple` | 🔗 connected | Winning the sale leaves the agent holding Merchant Silks and better regard in the town, lets them sign a Trade Treaty with the market's mayor (Agnes Fallow), and plants a seed that brings the same ring's factor (Pieter Holm) back later to bid against them in The Last Lot at the Exchange, where his opinion of them is the stake; losing leaves the town thinking less of the agent's word on wool. |
| `encounter.town.gallows_pardon` | 🔗 connected | Whether the youth lives or hangs, the master leaves with his mother Agnes Thorne trusting or blaming them, the town thinking better or worse of them, the lord's justice Sir Walter Greve holding a grudge if the plea won, and a Builders' Fellowship errand coming their way later, and the player sees each change on Agnes's and the justice's sheets, the town's standing row, and the errand when it arrives. |
| `encounter.town.tannery_fire` | 🔗 connected | If the firebreak holds, the town is put Under Watch (guards posted, which makes shadow work there harder) and thinks better of the master, while Gerold Ashby the master tanner holds the lost hides against them; if it fails, the town catches a Plague Scare that keeps travellers away, thinks less of the master, and Sergeant Hob Ketteridge of the watch trusts them less. |
| `encounter.town.fugitive_friar` | 🔗 connected | A master who gets Brother Wendel Ashby out through the water-gate joins the Thieves Guild and keeps his Prayer Scroll; one who hides him under the stable floor keeps the scroll and wins the friar's trust; one who fails loses standing with the town — and each lands on a surface the player can open: the Guild's roster, the Attachments tab, the friar's sheet, the town's standing row. |
| `encounter.town.bloodletting_hour` | 🔗 connected | A mortal who holds the physicians to the figure's hour gains standing with the town, learns that the bishop hides a canker from his chapter, and has the bishop owe them a favour, then either softens or sours the senior physician; a mortal who loses the bedside loses standing with the town instead. |
| `encounter.town.silver_drift_rescue` | 🔗 connected | The mortal who brings the four miners out goes onto the Builders Fellowship's rolls (which opens that faction's work to them), and wins or loses the trust of the reeve and the regard of the village, while a failure leaves the named trapped miner carrying a Wounded condition, all of which the player sees on the chips and on the Fellowship, reeve, miner and village pages. |
| `encounter.town.sin_eater` | — not run | — |

## Verdict roll-up

- **Gate green:** 8 / 8
- **Live proved:** 8 / 8
- **Live vacuous:** 0 / 8

## Per-encounter detail

### `encounter.town.returned_heir`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.returned_heir) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.returned_heir) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: heir.deepen_his_sleep, heir.uncover_old_letters)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — seed authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — appointment authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `appointment_missed` — appointment authored only in step metadata on a side its step did not take (step outcomes: failure, failure)

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 69 words

The manor has a master's reading of the man who says he is the lord's son.

> Sit with the son at his mother's table The mortal eats with the family on the night before the court sits. The son will remember who sat with him.

> Keep the finding for the court The mortal tells no one what the finding is until the hearing. The town will respect the discretion.

**`fallback/critical_success`** · 109 words

The steward has written the finding into the manor rolls, and the widow has asked {actor} to stand beside her son in court.

- Read the man true — {location} thinks well of {actor} now.

- Named him the son — {cast:claimant} trusts {actor} now.

- Court day — {cast:steward} hears the finding sworn in {location} in three days.

> Sit with the son at his mother's table The mortal eats with the family on the night before the court sits. The son will remember who sat with him.

> Keep the finding for the court The mortal tells no one what the finding is until the hearing. The town will respect the discretion.

**`fallback/success`** · 104 words

The steward has the finding in writing, and the manor's servants already call the man the young lord.

- Read the man true — {location} thinks well of {actor} now.

- Named him the son — {cast:claimant} trusts {actor} now.

- Court day — {cast:steward} hears the finding sworn in {location} in three days.

> Sit with the son at his mother's table The mortal eats with the family on the night before the court sits. The son will remember who sat with him.

> Keep the finding for the court The mortal tells no one what the finding is until the hearing. The town will respect the discretion.

**`fallback/success_at_cost`** · 104 words

The steward has the finding in writing, and the uncle tells the whole manor the widow bought it.

- Read the man true — {location} thinks well of {actor} now.

- Named him the son — {cast:claimant} trusts {actor} now.

- Court day — {cast:steward} hears the finding sworn in {location} in three days.

> Sit with the son at his mother's table The mortal eats with the family on the night before the court sits. The son will remember who sat with him.

> Keep the finding for the court The mortal tells no one what the finding is until the hearing. The town will respect the discretion.

**`fallback/failure`** · 109 words

The court will sit with no finding before it, and the uncle keeps the manor. The man will face the court with only his mother's word.

- The manor's talk — {location} thinks less of {actor} now.

- His reader failed him — {cast:claimant} blames {actor} now.

- The uncle's order — {actor} is travelling away from {location} now.

> Write the man what was found The mortal sends the man an honest account of what could and could not be read. He will blame them a little less.

> Leave the notes with the steward The mortal leaves every note with the steward for the next reader. The steward will remember the honesty.

**`fallback/critical_failure`** · 99 words

The uncle now has a master's own error to hold up in court against the man, and the manor will send for someone else next time.

- Talk of the household — {location} thinks less of {actor} now.

- Misread before his mother — {cast:claimant} blames {actor} now.

> Write the man what was found The mortal sends the man an honest account of what could and could not be read. He will blame them a little less.

> Leave the notes with the steward The mortal leaves every note with the steward for the next reader. The steward will remember the honesty.

</details>

### `encounter.town.wool_staple`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.wool_staple) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.wool_staple) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: wool.dull_the_factor, wool.steady_the_scales)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `reward_node` — reward authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `seed_planted` — seed authored only in step metadata on a side its step did not take (step outcomes: failure, failure)
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 12 words

{actor} left the weighing house once the mayor had closed the scales.

**`fallback/critical_success`** · 108 words

The town's clip sold well above the ring's price, and the shepherds have their rent money. The wool guild praised {actor} by name at the close of the fair.

- The guild's fee, paid in kind — {actor} holds dyed silk the buyers paid.

- {location} trusts {actor} to sell its wool.

- Beaten at the wool market — {cast:buyer} will come to bid against {actor} again.

> Sign the mayor's contract The mortal binds their own trade to this market. The mayor holds the paper.

> Make peace with the ring's factor The mortal stands the factor a meal and talks of next year. The factor is less sour toward the mortal.

**`fallback/success`** · 91 words

The town's wool is sold, and the shepherds can pay their rents.

- The guild's fee, paid in kind — {actor} holds dyed silk the buyers paid.

- {location} trusts {actor} to sell its wool.

- Beaten at the wool market — {cast:buyer} will come to bid against {actor} again.

> Sign the mayor's contract The mortal binds their own trade to this market. The mayor holds the paper.

> Make peace with the ring's factor The mortal stands the factor a meal and talks of next year. The factor is less sour toward the mortal.

**`fallback/success_at_cost`** · 90 words

The shepherds can pay their rents. {cast:mayor} now wants the guild's next clip promised to this market.

- The guild's fee, paid in kind — {actor} holds dyed silk the buyers paid.

- {location} trusts {actor} to sell its wool.

- Beaten at the wool market — {cast:buyer} will come to bid against {actor} again.

> Give the mayor the guild's pledge The mortal signs the paper for the guild. The mayor holds the guild to it.

> Refuse the pledge The guild stays free to sell where it likes. The mayor takes it badly.

**`fallback/failure`** · 29 words

At the ring's price the shepherds cannot pay their rents. The guild had sent {actor} by name to break the ring.

- {location} thinks less of {actor}'s word on wool.

**`fallback/critical_failure`** · 32 words

Half the town's clip went back to the sheds unsold, and the shepherds cannot pay their rents. The guild had sent {actor} by name.

- {location} thinks less of {actor}'s word on wool.

</details>

### `encounter.town.gallows_pardon`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.gallows_pardon) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.gallows_pardon) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: gallows.slow_the_hour, gallows.find_the_right_words)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `condition_applied` — template declares no condition effect
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 56 words

The crowd leaves the crossroads gallows, and {location} talks about the plea.

> Walk the youth home The mortal walks the youth to his mother's door through the staring town. She will remember it.

> Give the justice the credit The mortal tells the crowd the pardon was the justice's own mercy. The justice will remember the courtesy.

**`fallback/critical_success`** · 88 words

The youth lives, and the whole town knows who spoke for him at the gallows.

- {location} thinks better of {actor} now.

- {cast:mother} trusts {actor} now.

- {cast:justice} resents being argued down before the town.

- The builders who worked beside the youth will send {actor} work.

> Walk the youth home The mortal walks the youth to his mother's door through the staring town. She will remember it.

> Give the justice the credit The mortal tells the crowd the pardon was the justice's own mercy. The justice will remember the courtesy.

**`fallback/success`** · 84 words

The youth lives, and the rope at the crossroads hangs empty.

- {location} thinks better of {actor} now.

- {cast:mother} trusts {actor} now.

- {cast:justice} resents being argued down before the town.

- The builders who worked beside the youth will send {actor} work.

> Walk the youth home The mortal walks the youth to his mother's door through the staring town. She will remember it.

> Give the justice the credit The mortal tells the crowd the pardon was the justice's own mercy. The justice will remember the courtesy.

**`fallback/success_at_cost`** · 85 words

The youth lives, though not everyone in {location} believes he is innocent.

- {location} thinks better of {actor} now.

- {cast:mother} trusts {actor} now.

- {cast:justice} resents being argued down before the town.

- The builders who worked beside the youth will send {actor} work.

> Walk the youth home The mortal walks the youth to his mother's door through the staring town. She will remember it.

> Give the justice the credit The mortal tells the crowd the pardon was the justice's own mercy. The justice will remember the courtesy.

**`fallback/failure`** · 88 words

{cast:mother} has lost her son. A master's plea was meant to move the justice, and this one did not.

- {location} thinks less of {actor} now.

- {cast:mother} blames {actor} for her son.

- The builders who worked beside the youth will send {actor} work.

> Stay with the mother The mortal stays at the gallows with the mother until the crowd is gone. She will remember that much.

> Say he was innocent The mortal tells the town the youth never stole the lead. The town will not thank them for it.

**`fallback/critical_failure`** · 74 words

{cast:mother} has lost her son, and the crowd went home saying {actor} only hurried the rope.

- {location} thinks less of {actor} now.

- {cast:mother} blames {actor} for her son.

> Stay with the mother The mortal stays at the gallows with the mother until the crowd is gone. She will remember that much.

> Say he was innocent The mortal tells the town the youth never stole the lead. The town will not thank them for it.

</details>

### `encounter.town.tannery_fire`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.tannery_fire) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.tannery_fire) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: tannery.steady_the_line, tannery.show_the_danger)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 13 words

The fire bell stops, and the watch walks the burnt quarter until dawn.

**`fallback/critical_success`** · 107 words

The fire went out at the gap where the sheds had stood. Not one house beyond the quarter burned, and no one was hurt at the sheds.

- {cast:tanner} counts the lost hides against {actor}.

- The watch keeps men posted in the burnt quarter of {location}.

- {location} thinks well of {actor} now.

> Ask the town to rebuild the sheds The mortal asks the council to pay for the master tanner's sheds. The tanner may let the grudge go, and the town will ask why it should pay.

> Give the watch the credit The mortal tells the town the bucket lines saved the street. The sergeant will remember it.

**`fallback/success`** · 104 words

The fire burned out at the gap where the sheds had stood. Half the tanners' quarter is ash, and the street beyond it stands.

- {cast:tanner} counts the lost hides against {actor}.

- The watch keeps men posted in the burnt quarter of {location}.

- {location} thinks well of {actor} now.

> Ask the town to rebuild the sheds The mortal asks the council to pay for the master tanner's sheds. The tanner may let the grudge go, and the town will ask why it should pay.

> Give the watch the credit The mortal tells the town the bucket lines saved the street. The sergeant will remember it.

**`fallback/success_at_cost`** · 111 words

The fire burned out at the gap, and the street beyond the quarter stands, but it was a closer thing than the watch wanted. The journeymen blame {actor} for the sheds.

- {cast:tanner} counts the lost hides against {actor}.

- The watch keeps men posted in the burnt quarter of {location}.

- {location} thinks well of {actor} now.

> Ask the town to rebuild the sheds The mortal asks the council to pay for the master tanner's sheds. The tanner may let the grudge go, and the town will ask why it should pay.

> Give the watch the credit The mortal tells the town the bucket lines saved the street. The sergeant will remember it.

**`fallback/failure`** · 102 words

By morning the fire was out, two streets past the sheds. The tanning pits burst in the heat and fouled the river. The watch had sent for {actor} to stop exactly this.

- Travellers keep away from {location}, for fear of sickness.

- {location} thinks less of {actor} now.

- {cast:sergeant} trusts {actor} less.

> Find roofs for the burned-out families The mortal spends the next day finding beds for the families the fire turned out. The town will see who stayed.

> Ask the tanners what caught first The mortal asks the tanners what caught first and why it spread so fast, and keeps the answer.

**`fallback/critical_failure`** · 86 words

The fire spread past the tanners' quarter and did not stop until the wind turned at dawn. {actor} was the one the watch sent for.

- {location} thinks less of {actor} now.

- {cast:sergeant} trusts {actor} less.

> Find roofs for the burned-out families The mortal spends the next day finding beds for the families the fire turned out. The town will see who stayed.

> Ask the tanners what caught first The mortal asks the tanners what caught first and why it spread so fast, and keeps the answer.

</details>

### `encounter.town.fugitive_friar`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.fugitive_friar) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.fugitive_friar) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: friar.show_the_way_out)

- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 7 words

{actor} took the friar to the water-gate.

**`positive/critical_success`** · 68 words

Brother {cast:friar} is free, and the watch does not know how he left. The smugglers who use the water-gate saw who got him out.

- The Thieves Guild has put {actor} on its rolls.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`positive/success`** · 66 words

Brother {cast:friar} is out of the town and on the road. The smugglers who use the water-gate saw who got him out.

- The Thieves Guild has put {actor} on its rolls.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`positive/success_at_cost`** · 71 words

Brother {cast:friar} is out of the town, after a night that went worse than {actor} planned. The smugglers who use the water-gate saw who got him out.

- The Thieves Guild has put {actor} on its rolls.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`positive/failure`** · 48 words

Brother {cast:friar} is in the bishop's cells, and the watch knows whose stable he hid in.

- {location} trusts {actor} less.

> Speak Up For Him {actor} says openly that he was wronged, and the town hears it.

> Keep Clear Of Him {actor} lets the friar face the bishop alone.

**`positive/critical_failure`** · 51 words

Brother {cast:friar} is in the bishop's cells, and the watch has told the whole town that {actor} hid him.

- {location} trusts {actor} less.

> Speak Up For Him {actor} says openly that he was wronged, and the town hears it.

> Keep Clear Of Him {actor} lets the friar face the bishop alone.

**`negative`** · 8 words

{actor} hid the friar under the stable floor.

**`negative/critical_success`** · 60 words

Brother {cast:friar} is free, and the sergeant who searched the stable never knew he was there.

- Kept him hidden — Brother {cast:friar} trusts {actor} now.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`negative/success`** · 58 words

Brother {cast:friar} is on the road, and the street never learned he was there.

- Kept him hidden — Brother {cast:friar} trusts {actor} now.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`negative/success_at_cost`** · 60 words

Brother {cast:friar} is out of the town, after a search that came closer than {actor} wanted.

- Kept him hidden — Brother {cast:friar} trusts {actor} now.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`negative/failure`** · 46 words

Brother {cast:friar} is in the bishop's cells, and the street knows who hid him.

- {location} trusts {actor} less.

> Speak Up For Him {actor} says openly that he was wronged, and the town hears it.

> Keep Clear Of Him {actor} lets the friar face the bishop alone.

**`negative/critical_failure`** · 51 words

Brother {cast:friar} is in the bishop's cells, and the watch has told the whole town that {actor} hid him.

- {location} trusts {actor} less.

> Speak Up For Him {actor} says openly that he was wronged, and the town hears it.

> Keep Clear Of Him {actor} lets the friar face the bishop alone.

**`fallback`** · 8 words

{actor} hid the friar under the stable floor.

**`fallback/critical_success`** · 60 words

Brother {cast:friar} is free, and the sergeant who searched the stable never knew he was there.

- Kept him hidden — Brother {cast:friar} trusts {actor} now.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`fallback/success`** · 58 words

Brother {cast:friar} is on the road, and the street never learned he was there.

- Kept him hidden — Brother {cast:friar} trusts {actor} now.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`fallback/success_at_cost`** · 60 words

Brother {cast:friar} is out of the town, after a search that came closer than {actor} wanted.

- Kept him hidden — Brother {cast:friar} trusts {actor} now.

- Brother {cast:friar}'s parting gift to {actor}.

> Ask Him To Keep Preaching {actor} backs his cause, and he knows it.

> Ask Him To Preach Elsewhere {actor} wants no more trouble between the town and the bishop.

**`fallback/failure`** · 46 words

Brother {cast:friar} is in the bishop's cells, and the street knows who hid him.

- {location} trusts {actor} less.

> Speak Up For Him {actor} says openly that he was wronged, and the town hears it.

> Keep Clear Of Him {actor} lets the friar face the bishop alone.

**`fallback/critical_failure`** · 51 words

Brother {cast:friar} is in the bishop's cells, and the watch has told the whole town that {actor} hid him.

- {location} trusts {actor} less.

> Speak Up For Him {actor} says openly that he was wronged, and the town hears it.

> Keep Clear Of Him {actor} lets the friar face the bishop alone.

</details>

### `encounter.town.bloodletting_hour`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.bloodletting_hour) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.bloodletting_hour) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: bleeding.fix_the_sums, bleeding.warm_the_chamber)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 7 words

The bishop of {location} has been bled.

**`fallback/critical_success`** · 110 words

The bishop is sitting up, and the household will ask {actor} for the hour of every bleeding now.

- Word from the palace — {location} thinks well of {actor}.

- Kept his secret — {cast:bishop} owes {actor} a favour.

- Under his ribs — The swelling is a canker his chapter has not been told of.

> Make peace with the college Grant the senior physician that his college's rule has saved lives before tonight. He thinks better of the mortal for it.

> Stand by the art Say plainly at the bedside that the stars rule a bleeding, not the college. The bishop trusts the mortal more, and the senior physician takes against them.

**`fallback/success`** · 102 words

The bishop's household trusts {actor}'s figure over the college's haste.

- Word from the palace — {location} thinks well of {actor}.

- Kept his secret — {cast:bishop} owes {actor} a favour.

- Under his ribs — The swelling is a canker his chapter has not been told of.

> Make peace with the college Grant the senior physician that his college's rule has saved lives before tonight. He thinks better of the mortal for it.

> Stand by the art Say plainly at the bedside that the stars rule a bleeding, not the college. The bishop trusts the mortal more, and the senior physician takes against them.

**`fallback/success_at_cost`** · 111 words

The bishop was bled at the hour, but the physicians' college has not forgiven {actor} for overruling it.

- Word from the palace — {location} still thinks well of {actor}.

- Kept his secret — {cast:bishop} owes {actor} a favour.

- Under his ribs — The swelling is a canker his chapter has not been told of.

> Make peace with the college Grant the senior physician that his college's rule has saved lives before tonight. He thinks better of the mortal for it.

> Stand by the art Say plainly at the bedside that the stars rule a bleeding, not the college. The bishop trusts the mortal more, and the senior physician takes against them.

**`fallback/failure`** · 30 words

The college bled the bishop before the hour, and the palace now asks the physicians, not {actor}, when to bleed.

- Word from the palace — {location} thinks less of {actor}.

**`fallback/critical_failure`** · 27 words

The household believes {actor} cast the figure wrong, and the palace will not send for them again.

- Talk from the bedside — {location} thinks less of {actor}.

</details>

### `encounter.town.silver_drift_rescue`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.silver_drift_rescue) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.silver_drift_rescue) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: drift.carry_faint_knocking, drift.harden_green_timber, drift.rouse_weary_bodies)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 74 words

The rescue at the silver drift is over, and {location} waits to see what the mine does next.

> Seal the old workings The mortal has the reeve wall up the old workings. The village sleeps easier, and the mine gives up the ore past the fall.

> Prop a road for the crews The mortal sets props past the fall, so the mine can dig there. The reeve is grateful; the miners' families are not.

**`fallback/critical_success`** · 103 words

{location} rang its bell for the four miners when they came home. The miners give {actor} a tool from the mine's store in thanks.

- Brought its miners out — {actor} is on the Builders Fellowship's rolls now.

- {cast:reeve} trusts {actor} now.

- {location} thinks well of {actor} now.

> Seal the old workings The mortal has the reeve wall up the old workings. The village sleeps easier, and the mine gives up the ore past the fall.

> Prop a road for the crews The mortal sets props past the fall, so the mine can dig there. The reeve is grateful; the miners' families are not.

**`fallback/success`** · 100 words

The four miners are back with their families in {location}. They give {actor} a tool from the mine's store in thanks.

- Brought its miners out — {actor} is on the Builders Fellowship's rolls now.

- {cast:reeve} trusts {actor} now.

- {location} thinks well of {actor} now.

> Seal the old workings The mortal has the reeve wall up the old workings. The village sleeps easier, and the mine gives up the ore past the fall.

> Prop a road for the crews The mortal sets props past the fall, so the mine can dig there. The reeve is grateful; the miners' families are not.

**`fallback/success_at_cost`** · 100 words

The miners give {actor} a tool from the mine's store in thanks. {cast:reeve} is counting what the rescue cost the mine.

- Brought its miners out — {actor} is on the Builders Fellowship's rolls now.

- {cast:reeve} trusts {actor} now.

- {location} thinks well of {actor} now.

> Seal the old workings The mortal has the reeve wall up the old workings. The village sleeps easier, and the mine gives up the ore past the fall.

> Prop a road for the crews The mortal sets props past the fall, so the mine can dig there. The reeve is grateful; the miners' families are not.

**`fallback/failure`** · 108 words

{cast:reeve} has sent down the valley for another crew to dig the miners out. They are alive behind the fall. The reeve sent for a master, and now has to send again.

- {cast:miner} is wounded from the fall.

- {cast:reeve} trusts {actor} less now.

- {location} thinks less of {actor} now.

> Wait at the mine mouth The mortal waits at the mine mouth until the other crew brings the miners out. The miners' families see who stayed.

> Leave before the other crew comes The mortal goes down the valley before the other master arrives, and does not watch another crew finish the work. The village marks who did not stay.

**`fallback/critical_failure`** · 100 words

The miners are alive, and another crew is coming up the valley for them. {cast:reeve} tells {location} that the master read the rock wrong.

- {cast:miner} is wounded from the fall.

- {cast:reeve} trusts {actor} less now.

- {location} thinks less of {actor} now.

> Wait at the mine mouth The mortal waits at the mine mouth until the other crew brings the miners out. The miners' families see who stayed.

> Leave before the other crew comes The mortal goes down the valley before the other master arrives, and does not watch another crew finish the work. The village marks who did not stay.

</details>

### `encounter.town.sin_eater`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.sin_eater) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.sin_eater) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: sineater.seal_the_lips)

- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 7 words

{actor} carried the confession to the lych-gate.

**`positive/critical_success`** · 36 words

The parish believed the merchant's own words, and the priest said so. {cast:wronged} knows now how the partner died.

- {cast:wronged} trusts {actor} now.

- {location} thinks better of {actor}'s rites.

- {actor} is pursuing Uncover Ancient Secrets now.

**`positive/success`** · 31 words

The parish believed the merchant's own words. {cast:wronged} knows now how the partner died.

- {cast:wronged} trusts {actor} now.

- {location} thinks better of {actor}'s rites.

- {actor} is pursuing Uncover Ancient Secrets now.

**`positive/success_at_cost`** · 33 words

{cast:wronged} knows now how the partner died. The household calls {actor} a forger in every street.

- {cast:wronged} trusts {actor} now.

- {location} thinks better of {actor}'s rites.

- {actor} is pursuing Uncover Ancient Secrets now.

**`positive/failure`** · 31 words

The parish buried the merchant with his name clean. His household has the watch out, looking for the forger.

- Quiet work in {location} is harder now.

- {location} trusts {actor}'s rites less.

**`positive/critical_failure`** · 21 words

The parish called {actor} a forger before the whole lych-gate, and buried the merchant with honour.

- {location} trusts {actor}'s rites less.

**`negative`** · 5 words

{actor} kept the merchant's confession.

**`negative/critical_success`** · 42 words

The merchant went into the ground clean, and the paper went into the graveside fire. {actor} carries his sin now.

- {location} thinks better of {actor}'s rites.

- Rites in {location} take more easily now.

- {actor} is driven to help others for a while.

**`negative/success`** · 38 words

The merchant went into the ground clean. {actor} carries his sin now, as the rite says.

- {location} thinks better of {actor}'s rites.

- Rites in {location} take more easily now.

- {actor} is driven to help others for a while.

**`negative/success_at_cost`** · 35 words

The merchant went into the ground clean. {cast:wronged} believes the sin-eater was bought.

- {location} thinks better of {actor}'s rites.

- Rites in {location} take more easily now.

- {actor} is driven to help others for a while.

**`negative/failure`** · 33 words

The parish says the merchant went down unclean, and that the sin-eater failed him.

- People in {location} keep to their doors after dark.

- {cast:wronged} trusts {actor} less now.

- {location} trusts {actor}'s rites less.

**`negative/critical_failure`** · 30 words

The parish says the merchant went down unclean, and will send for another sin-eater next time.

- People in {location} keep to their doors after dark.

- {location} trusts {actor}'s rites less.

**`fallback`** · 5 words

{actor} kept the merchant's confession.

**`fallback/critical_success`** · 42 words

The merchant went into the ground clean, and the paper went into the graveside fire. {actor} carries his sin now.

- {location} thinks better of {actor}'s rites.

- Rites in {location} take more easily now.

- {actor} is driven to help others for a while.

**`fallback/success`** · 38 words

The merchant went into the ground clean. {actor} carries his sin now, as the rite says.

- {location} thinks better of {actor}'s rites.

- Rites in {location} take more easily now.

- {actor} is driven to help others for a while.

**`fallback/success_at_cost`** · 35 words

The merchant went into the ground clean. {cast:wronged} believes the sin-eater was bought.

- {location} thinks better of {actor}'s rites.

- Rites in {location} take more easily now.

- {actor} is driven to help others for a while.

**`fallback/failure`** · 33 words

The parish says the merchant went down unclean, and that the sin-eater failed him.

- People in {location} keep to their doors after dark.

- {cast:wronged} trusts {actor} less now.

- {location} trusts {actor}'s rites less.

**`fallback/critical_failure`** · 30 words

The parish says the merchant went down unclean, and will send for another sin-eater next time.

- People in {location} keep to their doors after dark.

- {location} trusts {actor}'s rites less.

</details>

## Director's sample

Ruling: Christian reviews **2** of the 8, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.town.returned_heir` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.returned_heir)
- `encounter.town.wool_staple` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.wool_staple)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
