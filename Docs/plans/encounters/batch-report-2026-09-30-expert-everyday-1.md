# Encounter batch report — 2026-09-30

**Batch:** 6 encounter(s)
**Brief:** `Docs/plans/encounters/expert-everyday-1-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.debt_arbitration` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.debt_arbitration) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.debt_arbitration) |
| `encounter.town.feud_mediation` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.feud_mediation) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.feud_mediation) |
| `encounter.town.tithe_barn_raid` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.tithe_barn_raid) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.tithe_barn_raid) |
| `encounter.town.comet_disputation` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.comet_disputation) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.comet_disputation) |
| `encounter.town.bell_tower_shoring` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.bell_tower_shoring) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.bell_tower_shoring) |
| `encounter.town.drowned_mans_testimony` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.drowned_mans_testimony) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.drowned_mans_testimony) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**0 of 6** encounter(s) author a content query; **0** resolved one live.

> ⚠️ **Zero queries authored.** The batch brief's die-B floor (`query_prize`, ≥1 per batch of six) exists to stop this. Two consecutive batches at zero is the retro's "dead primitive" finding for the content query — record it if this is the second.

## Appointment census

**1 of 6** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.bell_tower_shoring`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.debt_arbitration` | 🔗 connected | A mortal who calls the arbitration leaves with a gold-tagged item from the warehouses (on a win), the house's lending record naming the claimant noble's household, and their standing with the town up or down, and can then make the noble owe them a favour for silence or turn the noble against them by telling the town; a mortal who takes the third leaves the house master owing them a favour, or leaves the town thinking less of them if the strongroom ran dry. |
| `encounter.town.feud_mediation` | 🔗 connected | A mortal who ends the feud leaves with the house scribe as a companion, a favour owed by the house head Osric Venn, and the town thinking better of them; a failed peace leaves the town thinking less of them, and the mortal may side openly with Maud Carrow's house against Osric Venn's. |
| `encounter.town.tithe_barn_raid` | 🔗 connected | Clearing the mortal's name leaves the village thinking better of them, the reeve trusting them, the god's thread stronger and a good-luck omen about old passages opening across the country; quietly returning the grain leaves a stronger thread and a hidden mark (they know the carved passage under the tithe barn) that pulls them toward later shadow and settlement work until it surfaces; any failure leaves the village calling them the tithe thief, the reeve trusting them less, a thinner thread and a bad-luck omen. |
| `encounter.town.comet_disputation` | 🔗 connected | Winning the dawn disputation raises the mortal's standing with the town where it happened and gives them the Achieve Arcane Enlightenment ambition, and if they kept the champion's chart quiet, the college's champion (a persistent sage NPC) owes them a favour; losing lowers that standing and leaves them restless to explore for a while. |
| `encounter.town.bell_tower_shoring` | 🔗 connected | Saving the tower leaves the mortal's current town thinking better of them, a stone-working item from the town's stores in their hands, a record on their sheet of how the lodge's hidden arch carries the bell, and a promise to be back at the tower in three days when the councillor pays the rest of the fee (kept → the first peal, the fee paid and the town keeps a feast day; missed → the councillor comes looking with the money held back) — while a failed job leaves the town thinking less of them. |
| `encounter.town.drowned_mans_testimony` | 🔗 connected | A true reading gives the mortal a relic drawn from the world's #relic items (paid from the drowned man's river finds), raises their standing in the town or village where the court sat, strengthens the god's thread to them and sets them on the Uncover Ancient Secrets ambition; a wrong reading lowers that standing, thins the thread and sends them off searching for the missing will for six days, while the dead man's heir stays in the world as a persistent claimant a later run in that place can meet again. |

## Verdict roll-up

- **Gate green:** 6 / 6
- **Live proved:** 2 / 6
- **Live vacuous:** 0 / 6

## Per-encounter detail

### `encounter.town.debt_arbitration`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.debt_arbitration) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.debt_arbitration) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: debt.counsel_patience)

- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 16 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 4 words

{actor} called the arbitration.

**`positive/critical_success`** · 106 words

The elders read the house's books aloud. Most of its money had gone out as loans to {cast:claimant}'s household, never repaid. {actor} was paid in full, in goods from the warehouses, before the noble saw a coin.

- The town trusts {actor}'s judgement with money more.

- {actor} keeps the house's lending record.

> Keep the noble's debts quiet Say no word outside the hall about the noble's loans. The noble owes the mortal for the silence.

> Tell the town who emptied the bank Let every counting house hear whose household borrowed the money. The town thinks better of the mortal for it, and the noble thinks far worse.

**`positive/success`** · 98 words

The elders read the house's books aloud, and most of its money had gone out as loans to {cast:claimant}'s household. {actor}'s bill was paid in goods from the warehouses.

- The town trusts {actor}'s judgement with money more.

- {actor} keeps the house's lending record.

> Keep the noble's debts quiet Say no word outside the hall about the noble's loans. The noble owes the mortal for the silence.

> Tell the town who emptied the bank Let every counting house hear whose household borrowed the money. The town thinks better of the mortal for it, and the noble thinks far worse.

**`positive/success_at_cost`** · 44 words

{actor}'s bill was paid in goods from the warehouses, though only after a long hearing. The books, read aloud, showed that {cast:claimant}'s household had borrowed most of the house's money.

- The town trusts {actor}'s judgement with money more.

- {actor} keeps the house's lending record.

**`positive/failure`** · 95 words

The deed went to {cast:claimant}. The books, read aloud, showed that the noble's own household had borrowed most of the house's money. The ruling stands anyway.

- The town trusts {actor}'s judgement with money less.

- {actor} keeps the house's lending record.

> Keep the noble's debts quiet Say no word outside the hall about the noble's loans. The noble owes the mortal for the silence.

> Tell the town who emptied the bank Let every counting house hear whose household borrowed the money. The town thinks better of the mortal for it, and the noble thinks far worse.

**`positive/critical_failure`** · 52 words

{actor}'s bill is worthless now. The books showed that {cast:claimant}'s household had borrowed most of the house's money, and the deed still went to the noble. Every counting house in town knows who called the arbitration and lost.

- The town trusts {actor}'s judgement with money less.

- {actor} keeps the house's lending record.

**`negative`** · 5 words

{actor} took the house's offer.

**`negative/critical_success`** · 28 words

{cast:master} counted {actor}'s third out first, ahead of the whole queue. The deed goes to the noble.

- Spared the house an arbitration — {cast:master} owes {actor} a favour.

**`negative/success`** · 24 words

{actor} was paid before the strongroom emptied. The deed goes to the noble.

- Spared the house an arbitration — {cast:master} owes {actor} a favour.

**`negative/success_at_cost`** · 23 words

{actor} has their third. The house is left to its other creditors.

- Spared the house an arbitration — {cast:master} owes {actor} a favour.

**`negative/failure`** · 25 words

{actor} holds the master's note for the third, and no coin. The deed goes to the noble.

- The town trusts {actor}'s judgement with money less.

**`negative/critical_failure`** · 31 words

The merchants in the queue saw {actor} take the master's paper for coin. By evening every counting house in town has heard it.

- The town trusts {actor}'s judgement with money less.

**`fallback`** · 10 words

{actor} left the banking house before any count or ruling.

**`fallback/success`** · 9 words

{actor} left the banking house with the matter settled.

**`fallback/failure`** · 12 words

{actor} left the banking house unpaid. The deed goes to the noble.

**`fallback/critical_failure`** · 21 words

{actor} took the master's false figures on trust and left before any count or ruling. The deed goes to the noble.

</details>

### `encounter.town.feud_mediation`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.feud_mediation) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.feud_mediation) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (6 tick(s), hand: feud.loosen_a_tongue, feud.dull_a_suspicion, feud.lay_grudges_down)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 57 words

The hall empties, and {location} goes home to talk about the two houses.

> See the contract kept The mortal stays where both houses can see the terms kept, and the town marks who stayed.

> Write down how the feud began The truth about the letter stays with the mortal, written down, however either house tells it later.

**`fallback/critical_success`** · 114 words

Both houses sign a new mill contract, and both heads thank {actor} before the whole hall. In private, {cast:accused} admits writing the letter in anger and ordering it burned.

- Ended the feud in one sitting — {location} thinks well of {actor} now.

- Kept the letter's author a secret — {cast:accused} owes {actor} a favour.

- Sent the letter by mistake and left service — the house scribe travels with {actor} now.

> See the contract kept The mortal stays where both houses can see the terms kept, and the town marks who stayed.

> Write down how the feud began The truth about the letter stays with the mortal, written down, however either house tells it later.

**`fallback/success`** · 110 words

The two houses sign a new mill contract before the hall empties. In private, {cast:accused} admits writing the letter in anger and ordering it burned.

- Ended the feud at the table — {location} thinks well of {actor} now.

- Kept the letter's author a secret — {cast:accused} owes {actor} a favour.

- Sent the letter by mistake and left service — the house scribe travels with {actor} now.

> See the contract kept The mortal stays where both houses can see the terms kept, and the town marks who stayed.

> Write down how the feud began The truth about the letter stays with the mortal, written down, however either house tells it later.

**`fallback/success_at_cost`** · 121 words

The houses sign a new mill contract. To show that no house paid for the peace, {actor} turns down any fee for the work. In private, {cast:accused} admits writing the letter in anger and ordering it burned.

- Ended the feud at sundown — {location} thinks well of {actor} now.

- Kept the letter's author a secret — {cast:accused} owes {actor} a favour.

- Sent the letter by mistake and left service — the house scribe travels with {actor} now.

> See the contract kept The mortal stays where both houses can see the terms kept, and the town marks who stayed.

> Write down how the feud began The truth about the letter stays with the mortal, written down, however either house tells it later.

**`fallback/failure`** · 83 words

The mill stands idle between the two houses for another season. {location} sent for {actor} because other peacemakers had already failed.

- Could not make the peace — {location} thinks less of {actor} now.

> Stay on in town, taking no side The mortal stays where both houses can see them, still unbought, and the town marks it.

> Side with the house that was insulted With the peace lost, the mortal backs the house that received the letter, and the other house will remember it.

**`fallback/critical_failure`** · 88 words

Each head tells their own house that {actor} took the other side. A peacemaker both sides call bought has lost the name that got them sent for.

- Lost the one meeting — {location} thinks less of {actor} now.

> Stay on in town, taking no side The mortal stays where both houses can see them, still unbought, and the town marks it.

> Side with the house that was insulted With the peace lost, the mortal backs the house that received the letter, and the other house will remember it.

</details>

### `encounter.town.tithe_barn_raid`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.tithe_barn_raid) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.tithe_barn_raid) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: barn.dull_the_sentries)

- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 7 words

{actor} named the elder to the reeve.

**`positive/critical_success`** · 70 words

The reeve caught {cast:elder} with the first sack and opened the road that morning. The reeve told {location} who had found the thief. The hungry houses get none of the grain. The village calls the passage under the barn a sign of good luck.

- {cast:reeve} no longer counts {actor} a suspect.

- {location} thinks better of {actor}.

- The god kept close in the dark — The thread to {actor} runs stronger.

**`positive/success`** · 60 words

The reeve took the grain back from {cast:elder} and opened the road by noon. The hungry houses get none of it. The village calls the passage under the barn a sign of good luck.

- {cast:reeve} no longer counts {actor} a suspect.

- {location} thinks better of {actor}.

- The god kept close in the dark — The thread to {actor} runs stronger.

**`positive/success_at_cost`** · 59 words

Half the grain had already gone into the village's bread. The reeve took back the rest and opened the road. The village calls the passage under the barn a sign of good luck.

- {cast:reeve} no longer counts {actor} a suspect.

- {location} thinks better of {actor}.

- The god kept close in the dark — The thread to {actor} runs stronger.

**`positive/failure`** · 57 words

The reeve takes {actor}'s night in the passage as proof of the theft, and {location} now calls {actor} the tithe thief. The village calls the passage under the barn a sign of bad luck.

- {location} thinks less of {actor}.

- {cast:reeve} trusts {actor}'s word less.

- The god watched the blame land — The thread to {actor} runs thinner.

**`positive/critical_failure`** · 54 words

The reeve told every house in {location} that the best sneak in the country had robbed the lord. The village calls the passage under the barn a sign of bad luck.

- {location} thinks less of {actor}.

- {cast:reeve} trusts {actor}'s word less.

- The god watched the blame land — The thread to {actor} runs thinner.

**`negative`** · 8 words

{actor} tried to return the tithe grain unseen.

**`negative/critical_success`** · 48 words

The reeve called the lost cartload a miscount and opened the road at dawn. {cast:elder} left a loaf on {actor}'s pack without a word.

- The god kept close in the dark — The thread to {actor} runs stronger.

- {actor} knows of the carved passage under the tithe barn.

**`negative/success`** · 42 words

The reeve found the tithe whole at dawn, called the lost cartload a miscount, and opened the road.

- The god kept close in the dark — The thread to {actor} runs stronger.

- {actor} knows of the carved passage under the tithe barn.

**`negative/success_at_cost`** · 41 words

The reeve opened the road, but told {location} that one sack of the tithe is still owed.

- The god kept close in the dark — The thread to {actor} runs stronger.

- {actor} knows of the carved passage under the tithe barn.

**`negative/failure`** · 53 words

The reeve counts the sack on {actor}'s back as proof, and {location} now calls {actor} the tithe thief. The village says the old passages under the barns are walked again.

- {location} thinks less of {actor}.

- {cast:reeve} trusts {actor}'s word less.

- The god watched the blame land — The thread to {actor} runs thinner.

**`negative/critical_failure`** · 59 words

The reeve showed all of {location} the passage under the barn and the sack on {actor}'s back. The village now calls {actor} the tithe thief and says the old passages under the barns are walked again.

- {location} thinks less of {actor}.

- {cast:reeve} trusts {actor}'s word less.

- The god watched the blame land — The thread to {actor} runs thinner.

**`fallback`** · 7 words

{actor} named the elder to the reeve.

**`fallback/critical_success`** · 70 words

The reeve caught {cast:elder} with the first sack and opened the road that morning. The reeve told {location} who had found the thief. The hungry houses get none of the grain. The village calls the passage under the barn a sign of good luck.

- {cast:reeve} no longer counts {actor} a suspect.

- {location} thinks better of {actor}.

- The god kept close in the dark — The thread to {actor} runs stronger.

**`fallback/success`** · 60 words

The reeve took the grain back from {cast:elder} and opened the road by noon. The hungry houses get none of it. The village calls the passage under the barn a sign of good luck.

- {cast:reeve} no longer counts {actor} a suspect.

- {location} thinks better of {actor}.

- The god kept close in the dark — The thread to {actor} runs stronger.

**`fallback/success_at_cost`** · 59 words

Half the grain had already gone into the village's bread. The reeve took back the rest and opened the road. The village calls the passage under the barn a sign of good luck.

- {cast:reeve} no longer counts {actor} a suspect.

- {location} thinks better of {actor}.

- The god kept close in the dark — The thread to {actor} runs stronger.

**`fallback/failure`** · 57 words

The reeve takes {actor}'s night in the passage as proof of the theft, and {location} now calls {actor} the tithe thief. The village calls the passage under the barn a sign of bad luck.

- {location} thinks less of {actor}.

- {cast:reeve} trusts {actor}'s word less.

- The god watched the blame land — The thread to {actor} runs thinner.

**`fallback/critical_failure`** · 54 words

The reeve told every house in {location} that the best sneak in the country had robbed the lord. The village calls the passage under the barn a sign of bad luck.

- {location} thinks less of {actor}.

- {cast:reeve} trusts {actor}'s word less.

- The god watched the blame land — The thread to {actor} runs thinner.

</details>

### `encounter.town.comet_disputation`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.comet_disputation) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.comet_disputation) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: comet.part_the_clouds)

- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 11 words

The council has ruled on the gates before the whole square.

**`positive/critical_success`** · 31 words

The gates stay open for the fair. By noon the college's doctrine was the joke of the market.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`positive/success`** · 26 words

The gates stay open. The college lost in public, on its own chart.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`positive/success_at_cost`** · 29 words

The gates stay open for the fair. {cast:champion} left the square without a word to {actor}.

- {location} thinks better of {actor}'s star-reading.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`positive/failure`** · 28 words

The gates are shut on the college's word, and the spring fair is called off.

- {location} trusts {actor}'s star-reading less.

- {actor} is restless to explore for a while.

**`positive/critical_failure`** · 25 words

The gates are shut, the spring fair is called off, and the council thanked the college before the whole square.

- {location} trusts {actor}'s star-reading less.

**`negative`** · 11 words

The council has ruled on the gates before the whole square.

**`negative/critical_success`** · 41 words

The gates stay open for the fair. {cast:champion} found {actor} after the vote and thanked them for leaving the chart on the table.

- {location} thinks better of {actor}'s star-reading.

- {cast:champion} owes {actor} a favour.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`negative/success`** · 35 words

The gates stay open. The college's chart was never mentioned, and {cast:champion} knows {actor} kept it quiet.

- {location} thinks better of {actor}'s star-reading.

- {cast:champion} owes {actor} a favour.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`negative/success_at_cost`** · 34 words

The gates stay open for the fair. {cast:champion} left the square knowing {actor} had held back.

- {location} thinks better of {actor}'s star-reading.

- {cast:champion} owes {actor} a favour.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`negative/failure`** · 37 words

The gates are shut on the college's word, and the spring fair is called off. {cast:champion} took the win and never mentioned the chart.

- {location} trusts {actor}'s star-reading less.

- {actor} is restless to explore for a while.

**`negative/critical_failure`** · 34 words

The gates are shut, and the council thanked the college before the whole square. {cast:champion}'s own chart showed the comet leaving, and it went back to the college unread.

- {location} trusts {actor}'s star-reading less.

**`fallback`** · 11 words

The council has ruled on the gates before the whole square.

**`fallback/critical_success`** · 41 words

The gates stay open for the fair. {cast:champion} found {actor} after the vote and thanked them for leaving the chart on the table.

- {location} thinks better of {actor}'s star-reading.

- {cast:champion} owes {actor} a favour.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`fallback/success`** · 35 words

The gates stay open. The college's chart was never mentioned, and {cast:champion} knows {actor} kept it quiet.

- {location} thinks better of {actor}'s star-reading.

- {cast:champion} owes {actor} a favour.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`fallback/success_at_cost`** · 34 words

The gates stay open for the fair. {cast:champion} left the square knowing {actor} had held back.

- {location} thinks better of {actor}'s star-reading.

- {cast:champion} owes {actor} a favour.

- {actor} is pursuing Achieve Arcane Enlightenment now.

**`fallback/failure`** · 37 words

The gates are shut on the college's word, and the spring fair is called off. {cast:champion} took the win and never mentioned the chart.

- {location} trusts {actor}'s star-reading less.

- {actor} is restless to explore for a while.

**`fallback/critical_failure`** · 34 words

The gates are shut, and the council thanked the college before the whole square. {cast:champion}'s own chart showed the comet leaving, and it went back to the college unread.

- {location} trusts {actor}'s star-reading less.

</details>

### `encounter.town.bell_tower_shoring`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.bell_tower_shoring) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.bell_tower_shoring) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: bell.slow_the_settling, bell.press_the_wall)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- ❌ `appointment_kept` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block
- ❌ `appointment_missed` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 10 words

The bell tower in {location} has been saved, or lost.

**`fallback/critical_success`** · 64 words

{cast:lodgemaster} came up the scaffold at dusk to see how the courses were cut. The council added a gift from {location}'s stores.

- Where the lodge had failed — {location} thinks well of their work.

- Seen from inside the wall — {actor} knows how the lodge's hidden arch carries the bell.

- Half still owed — {cast:councillor} pays it at the tower when the bell rings.

**`fallback/success`** · 60 words

The families below the tower are back in their houses. The council added a gift from {location}'s stores.

- Where the lodge had failed — {location} thinks well of their work.

- Seen from inside the wall — {actor} knows how the lodge's hidden arch carries the bell.

- Half still owed — {cast:councillor} pays it at the tower when the bell rings.

**`fallback/success_at_cost`** · 67 words

The work ran a day long and used up the half fee on timber. The council added a gift from {location}'s stores all the same.

- Where the lodge had failed — {location} thinks well of their work.

- Seen from inside the wall — {actor} knows how the lodge's hidden arch carries the bell.

- Half still owed — {cast:councillor} pays it at the tower when the bell rings.

**`fallback/failure`** · 22 words

The lodge failed first, and now {actor} has failed after it.

- The new courses failed — {location} thinks less of their work.

**`fallback/critical_failure`** · 29 words

{location} counts the half fee it paid as thrown away. The lodge's failure looks small beside this one.

- A tower left worse — {location} thinks less of their work.

</details>

### `encounter.town.drowned_mans_testimony`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.drowned_mans_testimony) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.drowned_mans_testimony) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: testimony.call_up_the_dead)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 13 words

The hearing is over. The court has ruled on the drowned man's estate.

**`fallback/critical_success`** · 69 words

The will was read in court before noon. It leaves {cast:heir} the house and the almshouse the savings. The magistrate thanked {actor} before the whole court and paid the fee from the dead man's river finds.

- {location} holds their readings in higher regard.

- Read the dream with the god close — The thread to {actor} runs stronger.

- Curious about old finds — {actor} is pursuing Uncover Ancient Secrets now.

**`fallback/success`** · 60 words

The magistrate read the will aloud. It splits the estate between {cast:heir} and the almshouse. The court paid the reader's fee from the dead man's river finds.

- {location} holds their readings in higher regard.

- Read the dream with the god close — The thread to {actor} runs stronger.

- Curious about old finds — {actor} is pursuing Uncover Ancient Secrets now.

**`fallback/success_at_cost`** · 69 words

{cast:heir} called the second answer luck in front of the whole court. The will was found all the same, and the almshouse gets its share. The court paid the fee from the dead man's river finds.

- {location} holds their readings in higher regard.

- Read the dream with the god close — The thread to {actor} runs stronger.

- Curious about old finds — {actor} is pursuing Uncover Ancient Secrets now.

**`fallback/failure`** · 53 words

The magistrate ruled for {cast:heir}, who takes the whole estate. The almshouse is left out, and the will is still missing.

- Misread the dream with the god watching — The thread to {actor} runs thinner.

- For a while they put the search for the will before other work.

- {location} doubts their readings now.

**`fallback/critical_failure`** · 58 words

The magistrate ruled for {cast:heir} and closed the case. By evening all of {location} had heard the reading, and the almshouse was calling it a lie.

- Misled the court with the god watching — The thread to {actor} runs thinner.

- For a while they put the search for the will before other work.

- {location} doubts their readings now.

</details>

## Director's sample

Ruling: Christian reviews **2** of the 6, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.town.debt_arbitration` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.debt_arbitration)
- `encounter.town.feud_mediation` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.feud_mediation)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.

## Live proof beyond the default run

The table above renders one seed (42) with the cheapest hand. At expert difficulty (steps 0.55–0.68) the proof's ascendant is not an expert, so it loses every natural run. Success-side blocks are then never on the path it takes. As in both journeyman batches, the batch's live evidence is two sweeps with the proof itself, run with the engine's `setOutcomePin` (the `?outcome=` lever) set before the spawn. The pin substitutes the band at the tail of step resolution, so every downstream consequence fires as a real one would.

**Natural rolls, `--play all`:**

| Encounter | seed 42 | seed 99 | seed 7 |
|---|---|---|---|
| `encounter.town.debt_arbitration` | ❌ failure ¹ | ❌ failure ¹ | ❌ failure ¹ |
| `encounter.town.feud_mediation` | ❌ failure ¹ | ❌ failure ¹ | ❌ failure ¹ |
| `encounter.town.tithe_barn_raid` | ✅ failure | ✅ failure | ✅ failure |
| `encounter.town.comet_disputation` | ❌ failure ¹ | ❌ failure ¹ | ❌ failure ¹ |
| `encounter.town.bell_tower_shoring` | ❌ failure ¹ | ❌ failure ¹ | ❌ failure ¹ |
| `encounter.town.drowned_mans_testimony` | ✅ failure | ✅ failure | ✅ failure |

**Pinned bands, seed 42, `--play all`:**

| Encounter | `critical_success` | `success` | `success_at_cost` | `failure` | `critical_failure` |
|---|---|---|---|---|---|
| `encounter.town.debt_arbitration` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.feud_mediation` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.tithe_barn_raid` | ✅ | ✅ | ✅ | ✅ | ❌ ¹ |
| `encounter.town.comet_disputation` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.bell_tower_shoring` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.drowned_mans_testimony` | ✅ | ✅ | ✅ | ✅ | ✅ |

**Every success-side pinned band proves on all six.**

**The appointment, live (pinned `success`, seed 42).** The seed planted with its appointment block ("The rest of the fee is paid at the tower when the bell rings on market day"). In the **kept** arm the mortal was present at tick 40 (due 40, window 12), and sequel `town.bell_tower_first_peal` spawned at tick 40. In the **missed** arm the mortal stood elsewhere, the miss closed at tick 53 (`unreachable`), the seed was consumed, and sequel `town.bell_tower_cracked` spawned at tick 65. The census row above reads 0 kept / 0 missed only because the default run failed its step.

¹ **The harness's known false negative** (impediments #1111, #1113, now a third recurrence). `systemSurfacesForOutcome` treats a step's `successMetadata` as band-less, and so unconditional. On a run whose step failed, the proof still expects the success-side reward, seed or appointment. Every ❌ here names `reward_node` (the step's success-side `rewardPool`) or `seed_planted` (bell tower's success-side appointment). None names a block that failed to arrive on a run that reached it.
