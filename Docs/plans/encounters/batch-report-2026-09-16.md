# Encounter batch report — 2026-09-16

**Batch:** 13 encounter(s) (ruling 1 sets the batch at 6)
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.anomaly.wild_apothecary` | 🟡 ratchet | ❌ failed | — not run | failure | rewards, reputation | 0 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.anomaly.wild_apothecary) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.anomaly.wild_apothecary) |
| `encounter.slice.riders_behind_caravan` | ✅ green | ❌ failed | — not run | critical_failure | cast, rewards, conditions, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.riders_behind_caravan) |
| `encounter.slice.grateful_kin` | ✅ green | ✅ proved | — not run | failure | cast, rewards, seeds, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.grateful_kin) |
| `encounter.slice.the_table_that_holds` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, conditions, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.the_table_that_holds) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.the_table_that_holds) |
| `encounter.company.gate_held` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, seeds, conditions, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.company.gate_held) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.company.gate_held) |
| `encounter.company.two_roads_named` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, seeds, conditions, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.company.two_roads_named) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.company.two_roads_named) |
| `encounter.apotheosis.ascension` | 🟡 ratchet | ❌ failed | — not run | success_at_cost | cast, rewards, conditions, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.apotheosis.ascension) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.apotheosis.ascension) |
| `encounter.delve.the_broken_seal` | ✅ green | ✅ proved | ⚠️ `package pass` | critical_failure | cast, rewards, seeds, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_broken_seal) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_broken_seal) |
| `encounter.delve.the_drowned_archive` | ✅ green | ✅ proved | ⚠️ `package pass` | critical_failure | cast, rewards, seeds, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_drowned_archive) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_drowned_archive) |
| `encounter.border.toll_of_blades` | ✅ green | ✅ proved | 🔗 connected | success_at_cost | cast, rewards, conditions, reputation, factions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.toll_of_blades) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.toll_of_blades) |
| `encounter.border.the_sign_over_the_ruin` | ✅ green | ✅ proved | 🔗 connected | critical_failure | cast, rewards, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_sign_over_the_ruin) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_sign_over_the_ruin) |
| `encounter.delve.the_unfinished_rite` | ✅ green | ✅ proved | — not run | failure | cast, rewards, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_unfinished_rite) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_unfinished_rite) |
| `encounter.realm.tithe_demanded` | ✅ green | ✅ proved | — not run | failure | cast, rewards, conditions, reputation, factions | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.realm.tithe_demanded) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.realm.tithe_demanded) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**0 of 13** encounter(s) author a content query; **0** resolved one live.

> ⚠️ **Zero queries authored.** The batch brief's die-B floor (`query_prize`, ≥1 per batch of six) exists to stop this. Two consecutive batches at zero is the retro's "dead primitive" finding for the content query — record it if this is the second.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.anomaly.wild_apothecary` | — not run | — |
| `encounter.slice.riders_behind_caravan` | — not run | — |
| `encounter.slice.grateful_kin` | — not run | — |
| `encounter.slice.the_table_that_holds` | — not run | — |
| `encounter.company.gate_held` | — not run | — |
| `encounter.company.two_roads_named` | — not run | — |
| `encounter.apotheosis.ascension` | — not run | — |
| `encounter.delve.the_broken_seal` | ⚠️ `package pass` | On the good endings the agent walks out holding a real object — a Veilscript Fragment, or on the rarest ending The Silent Testament as well — which sits in their possessions and can be looked at, carried and lost like any other item; on the bad endings the keepers bring the stair down and the place itself is marked closed, which shows up on that location's own sheet with a term in words and makes every route through it eight times more expensive for anyone in the world, agent or army, until it lifts; and on the worst ending the agent walks away wanting to know what was in the coffer, which is written as a real ambition that steers which encounters they are offered and what they do when idle for the rest of their life — measured on a live world, three-quarters of agents are carrying no ambition at all, so this encounter is one of the few things in the game that gives someone a reason of their own. |
| `encounter.delve.the_drowned_archive` | ⚠️ `package pass` | On the best ending the agent walks out with a clue about a real ruin somewhere in the world, and that clue is the strongest thing this encounter plants — the Adventurer's Guild reads it, and once the evidence at that ruin crosses its threshold with a guild hall within five hexes the guild posts a delve quest and a toast names the ruin and the direction to it, so the player watches a rumour they created turn into work somebody else takes; on the middle ending the vault's own settlement is marked Under Watch for a week of game time and that shows on the place's own sheet with a countdown, and its chip clicks straight through to that sheet, though nothing in the simulation yet acts on being watched; the keeper — a real person who stays in the world — ends up trusting the agent, or on the worst ending grieving the records they lost, both of which sit on their sheet; and every single ending mints an intelligence record the agent carries for the rest of their life, readable in the Intelligence section of their own sheet, which a later court, intrigue or ritual encounter will pick up as an advantage. That record does **not** know which settlement it is about — the engine has no way for an author to say so — and the shipped encounter no longer pretends otherwise: the five chips reporting it now point at the agent who carries it rather than at the settlement, so nothing sends the player to a place sheet where this ending wrote nothing, and the charter's tie to the ground it names lives in the chip's own sentence, where it is honest. |
| `encounter.border.toll_of_blades` | 🔗 connected | A favour the column's serjeant owes the agent that a real verb can call in, a place on the mercenary company's rolls that its quest, rank and member-work systems read, and detection pressure in the region that a rival god's strike is watching. |
| `encounter.border.the_sign_over_the_ruin` | 🔗 connected | A Terrified condition the capability stack really reads and a journey the agent actually walks on the map — to the nearest settlement when the reading lands, three hexes off this ground when it does not — plus a cultural omen about the two readings that shifts what the world offers next, and an Under Watch mark on the ruin the player can read on its Location Profile that no system in the game acts on. |
| `encounter.delve.the_unfinished_rite` | — not run | — |
| `encounter.realm.tithe_demanded` | — not run | — |

## Verdict roll-up

- **Gate green:** 11 / 13
- **Live proved:** 10 / 13
- **Live vacuous:** 0 / 13

## Per-encounter detail

### `encounter.anomaly.wild_apothecary`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.anomaly.wild_apothecary) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.anomaly.wild_apothecary) *(pending THR-1046)*

**Stage 3 — gate:**

- `[hand]` encounter.anomaly.wild_apothecary: no nudge-bearing step — nothing to check
- `[setting]` declares no `settings` — the envelope is what binds cast and openings
- `[cast]` no actor support binding — declare a `supportBundle` actor spec, or an `encounter.*` id whose setting class carries a family default
- `[aftermath]` authors 0 outcome band(s), under the floor of 3 (success / failure / one extreme)
- `[aftermath]` no success-side band — the encounter has no authored win
- `[aftermath]` no failure-side band — the encounter has no authored loss
- `[aftermath]` no extreme band — author at least one of critical_success, critical_failure, success_at_cost; the tails are the endings a playthrough never reaches
- `[aftermath]` change 'wild_apothecary_botanical' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[systems]` connects to 2 game system(s) [rewards, reputation], under the quota of 3

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: none)

- · `hand_committed` — no step authors a nudge hand
- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `concepts_declared` — 1 of 3 change(s) carry no concepts (Law 2)
- · `cast_bound` — template declares no cast
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 1 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 100 words

The impossible herb garden at {location} persists in its improbability. Whether {name} harvested cleanly or damaged the network, the knowledge of what grows here and how is worth carrying forward.

> Record the plant combinations. This knowledge has value. The assembly's properties come from the network it forms. {name} keeps a working map of the roots, the pairings, and what each can do.

> {name} treated the network as a system, not a resource. The distinction between foraging and stewardship is sometimes the only thing that keeps a garden alive. Whatever {name} took, {they} took{s} it knowing what the network could afford.

</details>

### `encounter.slice.riders_behind_caravan`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.riders_behind_caravan) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (1 tick(s), hand: slice.caravan.a_loose_tongue, slice.caravan.hushed_steps)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `concepts_declared` — 1 of 2 change(s) carry no concepts (Law 2)
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 5 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 62 words

The column goes in through the gates. The two riders come down off the ridge and follow it in at a walk, in no more hurry than they were four days ago.

- Four days walked inside a hunted column — The caravan roads are open to them.

> Part ways at the gates The column scatters into the town, and the road resumes.

**`fallback/critical_success`** · 70 words

By dawn the hunted one was a day gone on a road with no watchers, and the riders were following a cart that mattered to no one. The master says nothing at the gates. He does not have to — twenty-nine people watched a bedroll stay empty and worked the rest out for themselves.

> Part ways at the gates The column scatters into the town, carrying the story with it.

**`fallback/success_at_cost`** · 72 words

The hunted one got clear, and the getting clear made noise. Somebody in the column watched the traveler ask the questions, and somebody in the column will be asked questions of their own once the riders reach the gate.

- Someone watched them ask the questions — A walker can point them out later.

> Part ways at the gates The column scatters into the town, and so does everyone who saw them asking.

**`fallback/failure`** · 70 words

Nobody left the column. The gates take all thirty in, the riders come down off the ridge at their leisure, and the hunted one walks to an inn they will not walk out of.

- Four days spent on the wrong questions — They reach the gate knowing how it ends.

> Part ways at the gates The column scatters into the town. The traveler goes in with it, and sleeps badly.

**`fallback/critical_failure`** · 73 words

The riders came down at the worst hour and the camp woke to shouting. They took what they came for and put down what stood in the way. The column reached the gates in daylight, quiet, and shorter than it had been.

- They took the blow meant for another — It travels into the town with them.

> Walk in with the rest The gates do not ask what happened at the river bend.

</details>

### `encounter.slice.grateful_kin`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.grateful_kin) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (1 tick(s), hand: slice.kin.easy_grace)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `cast_bound` — bundle is a bind-only family default, not an authored cast; no matching NPC at loc_0. Defaults attach opportunistically and stay unresolved by design
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 5 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 51 words

The family remembers who helped, and tonight they wrote the traveler down. There is a roof in this town that opens for them now.

- The coin went back twice, publicly — {target} keeps a door open for them.

> Accept the thanks A meal, a story told rightly, and a standing welcome.

**`fallback/critical_success`** · 82 words

By the second bowl she was telling the whole room, and the room was listening. By morning their name is in three more taprooms, and it comes off well in every telling.

- They let her say it to the room — {target} says the door is open.

- She pressed it on them, no discussion — Her people will know it on sight.

> Accept the thanks A meal, a story told rightly, a standing welcome — and a room that will repeat it.

**`fallback/success_at_cost`** · 63 words

The thanks was taken, and taken, and taken — three retellings and a toast, each one a little further from what happened. The bowl went cold twice. Underneath all of it the welcome is real.

- A long public thanks, three times over — The open door cost them the evening.

> Accept the thanks A meal, a story told rightly, and a standing welcome.

**`fallback/failure`** · 90 words

She stood up to say it and the traveler waved it off — too fast, too light, the way a man declines a second helping. The whole room saw the shrug. She sat back down with the sentence unfinished, and the door stays open anyway, because kin are stubborn that way. It opens the width of an unfinished sentence.

- They waved the thanks away, publicly — {target} keeps the door open, barely.

> Let it drop She meant every word she got out. The room heard the ones she did not.

**`fallback/critical_failure`** · 80 words

The thanks ran long, in front of half the room, and the traveler stood in it all evening. She meant every word of it. It still landed like a bill. The family stays welcoming — kin are stubborn that way — just less than they were going to be.

- They stood the public thanks badly — The door stays open, narrower than intended.

> Take the thanks anyway Let her finish. Kin forgive a bad thank-you faster than a refused one.

</details>

### `encounter.slice.the_table_that_holds`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.the_table_that_holds) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.the_table_that_holds) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: slice.table.borrowed_hours)

- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 11 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 61 words

The town went out to the causeway together and came back off it together. Whatever the two families still hold against each other, they held one width of wet stone first.

- Two camps held one causeway — {target} keeps the door open, and both ends know why.

> Stand with them Lamps up on the causeway until the riders do the arithmetic.

**`positive/critical_success`** · 81 words

The riders turned at a distance and never came close enough to test the line. The town is still telling it the following week, and telling it as one story instead of two.

- The riders turned without testing the line — {target} opens the door wider.

- The keeper put it in their hand — It stood at the near end that night.

> Stand with them Lamps up, the line does not move, and the keeper presses the lamp on them after.

**`positive/success_at_cost`** · 61 words

The causeway held and two of the town went into the fen water holding it. They were pulled out cold and coughing, and the argument about whose fault that was started before they were dry.

- Holding it put people in the fen — {target} keeps the door open, counting.

> Stand with them Hold the width, and pull out whoever goes in.

**`positive/failure`** · 66 words

The line bent at the end where the two families met, and the riders came through the gap it left. The town spent the rest of the night deciding which camp had bent first.

- The plan was theirs, and it had a gap — {target} keeps a cooler door now.

> Take the blame for the plan It was their plan, and the gap was in it.

**`positive/critical_failure`** · 68 words

The line went down in the dark on wet stone and the town came back off the causeway carrying people. It is {cast:mender} who works through the small hours, and the traveler who stood at the door counting them in.

- People were carried off the causeway — {target} keeps the door open out of habit.

> Take the blame for the plan They stood where the traveler put them.

**`negative`** · 75 words

The fen side came in behind the ditch overnight — people first, stock after, and the grain left standing where it was. Two families did the carrying in the same carts, which is further than they had got in a year.

- Both camps loaded the same carts overnight — {target} keeps the door open on their count.

> Move them tonight Carts are for people tonight. The riders can have what is still in the fields.

**`negative/critical_success`** · 90 words

People, stock and grain all came in behind the ditch, because the order they went in was worked out before the first cart moved. The riders found empty yards and shut barns and rode on down the fen.

- Nothing was left for the riders — {target} opens the door wider, barns still full.

- The keeper copied it out fair — They carry the order the fen side emptied by.

> Move them tonight Every cart in an order worked out before it rolled, and the keeper copies it out fair after.

**`negative/success_at_cost`** · 64 words

Everyone came in behind the ditch and half a winter’s grain stayed in the barns for the riders to find. The households that lost theirs are counting it out loud, and counting it at the traveler.

- Half the winter’s grain stayed behind — {target} keeps the door open; two households go short.

> Move them tonight People and stock. The grain can be grown again.

**`negative/failure`** · 62 words

The carts were still loading at first light, out where the fen road runs open, and what the riders took they took off the road. Both camps had loaded their own barns first.

- Their order ran long into first light — {target} keeps a cooler door now.

> Take the blame for the order It was their order, and it ran past dawn.

**`negative/critical_failure`** · 73 words

The wrong barn was emptied first and the household told to wait was still waiting at dawn on the fen side. It is {cast:mender} who goes out to them with the warden at midday, and the town watches the traveler while they go.

- Their order emptied the wrong barn first — {target} keeps the door open from habit.

> Take the blame for the order They waited because the traveler’s order told them to.

**`fallback`** · 60 words

The riders came up the fen road and the town met them the way the table had settled it. By morning the keeper’s floor is a floor again.

- They sat until the table settled — {target} keeps the door open, and the town watched.

> Stay until it is settled See the night out with them, then sleep before the road.

</details>

### `encounter.company.gate_held`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.company.gate_held) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.company.gate_held) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: company.gate.shoulder_to_shoulder)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 5 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 83 words

The company is on open ground with the arch behind them and the passage quiet. They count heads out of habit and then stop counting, because the number is the number. What happens next is whether they carry the name out of here with them or walk on and let the place keep it.

> Say the name The company names who held the arch, out loud, before it moves.

> Walk on quiet The company moves off without saying it. Somebody else will, later.

**`fallback/critical_success`** · 110 words

The pursuit spent four people on the arch and then stopped spending them. The company came out through the gate at a walk, in order, with {actor} last and unhurried. The one who came through the passage first watched them go and did not follow. That is the version that gets told, and for once it is the version that happened.

- They held a two-wide gateway until the pursuit stopped paying for it — The company walks off knowing what it is worth in a doorway, and it shows in how they take the next one.

> Walk out together Nobody was left. The company goes on with its number intact.

**`fallback/success_at_cost`** · 102 words

The company is out. {actor} is not, and the arch is shut, and the passage on the other side of it has gone quiet in the way that answers the question. They stand on the open ground for longer than they need to before somebody says it is time to move.

- The gate shut with {actor} on the wrong side of it — The company walks with a gap in it, and the ones who came out did not come out clean.

> Go back for them Shut is not the same as certain. Somebody goes back to the passage to find out.

**`fallback/failure`** · 108 words

The arch was carried while half the company was still in the passage, and what came out came out in ones and twos over the next hour, by ways nobody had planned to use. They find each other on the open ground by walking until they do. Everybody is accounted for and nobody is pleased about how.

- The gateway went while the company was still coming through it — They came out by separate ways and spent the night finding each other. The legs will do tomorrow and say so.

> Regroup and move Everyone is out. The order they came out in is a thing to fix later.

**`fallback/critical_failure`** · 113 words

The arch went in the first rush and the passage did the rest. The company that reaches open ground is smaller than the one that went in, and it is not only {actor} missing from it. The one who came through first is still counting them from the gateway, out loud, so the ones walking away can hear the number.

- The gateway went in the first rush and took more than the rearguard — The company knows exactly how many it is now, and it slows at the next doorway it has to use.

> Carry what is left The ones still walking keep walking, and carry the rest as far as they can.

</details>

### `encounter.company.two_roads_named`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.company.two_roads_named) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.company.two_roads_named) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: company.dispute.hear_it_out)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `condition_applied` — condition authored only on an outcome band this run did not roll (rolled 'critical_failure')
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 5 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 103 words

The map is off the stone and the cup has been emptied into the grass. Whichever way the company is about to walk, the question underneath it — who names the road when the road is not obvious — is still sitting there. It can be settled now, while everyone is present and it is only about a road, or it can be carried to the next fork.

> Settle the say Have it out now, in the open. The company walks with one voice or it does not walk.

> Leave it for the next fork Nobody wants the second argument tonight. It keeps.

**`fallback/critical_success`** · 112 words

It took eleven minutes and ended with the one who named the ridge folding the map himself and handing it over. Nobody had to be talked round in private afterwards. The company picked its loads up and was walking inside the hour, and the person camped at the same fork watched the whole thing and did not hear a raised voice.

- They named the road in the open and nobody had to be handled afterwards — The company knows who decides when the map is ambiguous, and it will move faster at the next fork for knowing it.

> Walk it The road is named and the light is going. The company moves.

**`fallback/success_at_cost`** · 111 words

The company is on the river road, which is the road {actor} named, and has been on it for three hours. The one who named the ridge is walking at the back of the column where he does not usually walk. Nothing was said that has to be taken back. That is not the same as nothing having happened.

- The road was decided against him in front of the whole company — A full day's march on a road he argued against, taken at the back of the column. The legs will say so tomorrow.

> Let him walk it off It is a road, not a grievance. Give it a day.

**`fallback/failure`** · 103 words

The light went while they were still on it, so the company is camped thirty paces short of the fork it was going to take, which is the worst available place to camp and everybody knows it. The loads are down. The map is still on the stone. In the morning this starts from the beginning.

- Neither road was named before the light went — A day spent standing at a fork, and a night camped where nobody wanted to camp. The company starts tomorrow already behind.

> Camp, and start again at first light Nothing is getting decided tonight. Put it down properly.

**`fallback/critical_failure`** · 141 words

Both roads were taken. The ridge party went up at first light without a great deal of discussion about it, and what is on the river road now is a smaller company than the one that stopped here. Neither half has said the word for what this is. The person camped at the same fork saw which way each of them went, and what this company's name is worth is now being carried down two roads by people who are not speaking to each other.

- The company could not name one road, so it took both — The one camped at the same fork watched both halves choose, and word of which way the other half went will reach whoever is still on the river road.

> Take the river road The ones still here are still here. Walk, and count later.

</details>

### `encounter.apotheosis.ascension`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.apotheosis.ascension) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.apotheosis.ascension) *(pending THR-1046)*

**Stage 3 — gate:**

- `[hand]` encounter.apotheosis.ascension step 0 (star): never pays off the critical_success band
- `[hand]` encounter.apotheosis.ascension step 0 (star): never pays off the success band
- `[hand]` encounter.apotheosis.ascension step 0 (star): never pays off the success_at_cost band
- `[hand]` encounter.apotheosis.ascension step 0 (star): never pays off the critical_failure band
- `[aftermath]` change 'apotheosis_aspect_attained' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_clean_vessel' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_the_tremor' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_unmade' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_ruined_vessel' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_declined' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_closed_clean' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_held_shut' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_the_withdrawal_felt' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_the_pause_on_the_step' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_declined' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_closed_clean' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_held_shut' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_the_withdrawal_felt' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_the_pause_on_the_step' declares no anchor (Law 2) — give it a `stateNoun` naming the state that changed, or a `concepts` entry for vocabulary the narrative linker cannot reach on its own
- `[aftermath]` change 'apotheosis_closed_clean' on negative/critical_success reports a 'reputation_tally', which has no player surface (Law 13 visibility parity, THR-1136 §5). The tally effect keeps running and keeps minting its threshold traits — delete the chip and fold its sentence into the band overview, or report the sheet-visible thing the ending wrote instead

**Stage 4 — live proof:** ❌ failed (6 tick(s), hand: apotheosis.steady_hands)

- ❌ `concepts_declared` — 1 of 2 change(s) carry no concepts (Law 2)
- · `cast_bound` — bundle is a bind-only family default, not an authored cast; no matching NPC at loc_0. Defaults attach opportunistically and stay unresolved by design
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- · `seed_planted` — template declares no encounter seed
- ❌ `condition_applied` — declared a condition effect on this run's path but none applied — no trait change and no additive condition effect trace
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 15 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 97 words

By the next dawn those who knew the mortal best could not say what had changed, only that it had. They stand the same and speak the same and answer to the same name, and to be near them is to feel the air go close and strange, as before a storm that never quite breaks. The faithful call it blessing. The fearful call it wrongness. Both are right. An aspect of the god moves among mortals now, and the world will bend a little, here and there, around the place where heaven has learned to walk.

**`positive/critical_success`** · 53 words

The filling ran clean to the brim. No strain showed at the seams, and by dawn the faithful one was moving through their own house as though they had been built to carry this and had only been waiting to be handed it. They cooked breakfast. The bread rose higher than bread rises.

**`positive/success_at_cost`** · 56 words

The vessel held, and the holding cost. The aspect is made and will outlast the body, and the body now has a tremor in the left hand that was not there at dusk and will not leave. They notice it while pouring water. They set the jug down, look at the hand, and go on pouring.

**`positive/failure`** · 93 words

The frame did not hold. The god felt it go — a seam parting under the pouring, the same sound a green log makes in a hot fire — and drew back before more went in than could be got out again. The mortal lived. They are at their own table by morning, eating, answering to their name, and there is a stillness behind the eyes that arrives one breath late to everything now.

> Let them be No second pouring. Whatever came back eats and answers, and that is enough to leave alone.

**`positive/critical_failure`** · 100 words

The frame came apart. Not all at once and not quietly: the god had a portion of itself already through the doorway when the mortal gave under it, and pulling back tore what it was pulling back from. What sits at the table by morning eats when food is put in front of it. The village still uses the old name. Whether the old name still fits is a question the village will spend the winter not asking aloud.

> Let them be Nothing is asked of what sits there. The god does not try to put back what it tore.

**`negative`** · 78 words

The mortal woke to an ordinary sky and an ordinary body and went about the work of being alive, with no memory of the threshold and the faintest residue of an ache, like the ghost of a dream about flying. The thread to the god held. The devotion held. The faithful one remains what they have always been, wholly and finitely their own, and there is a grace in that which the god chose not to argue with.

**`negative/critical_success`** · 53 words

The closing was so gentle that what the faithful one kept was a good morning. They woke rested for the first time in a season, prayed at the usual hour, and meant it more than they had in years. Whatever the god had almost done, what it did instead was let them sleep.

**`negative/success_at_cost`** · 54 words

The doorway closed, and closing it took more out of the god than opening it had. The faithful one is fine, and better than fine — they slept through it. The god spent the rest of the night holding a thin place shut against its own appetite for the person on the other side.

**`negative/failure`** · 87 words

The doorway did not thin so much as snap, and the faithful one felt it go. They could not name it. They knew a door had been open and was shut, that it had been about them, and that they had not been asked in a language they could hear. They prayed the next morning at the usual hour and listened afterward, which they had never done before.

> Let them listen Do not answer the listening. A doubt earned honestly is worth more than one talked away.

**`negative/critical_failure`** · 76 words

The doorway tore closed and took a strip of the devotion out with it. The faithful one woke with the certainty that they had been weighed and set down, and no memory of the weighing. They went to the shrine at the usual hour and stood outside it for a while first. Twenty years of unhesitating mornings, and now a pause on the step.

> Let them stand outside a while They will go in. Not yet.

**`fallback`** · 78 words

The mortal woke to an ordinary sky and an ordinary body and went about the work of being alive, with no memory of the threshold and the faintest residue of an ache, like the ghost of a dream about flying. The thread to the god held. The devotion held. The faithful one remains what they have always been, wholly and finitely their own, and there is a grace in that which the god chose not to argue with.

**`fallback/critical_success`** · 53 words

The closing was so gentle that what the faithful one kept was a good morning. They woke rested for the first time in a season, prayed at the usual hour, and meant it more than they had in years. Whatever the god had almost done, what it did instead was let them sleep.

**`fallback/success_at_cost`** · 54 words

The doorway closed, and closing it took more out of the god than opening it had. The faithful one is fine, and better than fine — they slept through it. The god spent the rest of the night holding a thin place shut against its own appetite for the person on the other side.

**`fallback/failure`** · 87 words

The doorway did not thin so much as snap, and the faithful one felt it go. They could not name it. They knew a door had been open and was shut, that it had been about them, and that they had not been asked in a language they could hear. They prayed the next morning at the usual hour and listened afterward, which they had never done before.

> Let them listen Do not answer the listening. A doubt earned honestly is worth more than one talked away.

**`fallback/critical_failure`** · 76 words

The doorway tore closed and took a strip of the devotion out with it. The faithful one woke with the certainty that they had been weighed and set down, and no memory of the weighing. They went to the shrine at the usual hour and stood outside it for a while first. Twenty years of unhesitating mornings, and now a pause on the step.

> Let them stand outside a while They will go in. Not yet.

</details>

### `encounter.delve.the_broken_seal`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_broken_seal) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_broken_seal) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: seal.draw_on_character, seal.press_the_odds)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — seed authored only on an outcome band this run did not roll (rolled 'critical_failure')
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 16 words

The seal is broken either way. What came up the stair is the rest of it.

**`fallback/critical_success`** · 125 words

The coffer is up and still sealed. {actor} has it, and the keepers did not take it off them. What comes out of it is the reason {actor} will not leave buried ground alone again. {cast:rival} is still below, and still looking.

- Carried up clean, before the light went — A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move when they look away.

- The lid came off at the top of the stair — The Silent Testament was under the seal. It is {actor}'s to carry, and it is not going to be given back.

> Let them open it here In front of everyone who wanted it kept shut. Let them see what the seal was for.

**`fallback/success`** · 94 words

The keepers argued about it at the head of the stair and then let the coffer pass. {cast:rival} came up empty an hour later and will tell everyone what is down there. The stair will not be quiet for long.

- It came up the stair on the last of the light — A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move when they look away.

> Let the stair stand open Nobody shuts it behind them. Whatever else is down there is down there for the taking.

**`fallback/success_at_cost`** · 108 words

{actor} came up under the weight of the coffer with their hands and shins torn open. The keepers watched from the head of the stair and did not help.

- They hauled it up broken stone with bare hands — {actor} is wounded. Lifting and gripping will hurt until it heals.

- It came up, and the stair took its fee off the carrier — A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move when they look away.

> Let them carry the hurt out with it No one binds the hands. The coffer goes on the road with them as they are.

**`fallback/failure`** · 109 words

{actor} came up empty and is on the road away from here now. {cast:rival} is still down there, and nobody is going to stop them coming up with it.

- A climb up broken stone with no rest at the top — {actor} is exhausted, and will be slow on the road until they have rested.

- The keepers had the head of the stair and would not let them back on it — {actor} is travelling away from {location} now, and will not stop until they are well clear of it.

> Let the failure sit with them No one softens it for them. They walk out of here carrying it.

**`fallback/critical_failure`** · 98 words

{cast:rival} came out beside {actor}, and neither of them got the lid off the coffer. Nobody is going down that stair again this season.

- The keepers brought the head of the stair down behind them — {target} is closed. The descent is broken in, and no one is getting down it until somebody digs.

- They were dragged out before the lid came off — {actor} is pursuing Uncover Ancient Secrets now, and the coffer they never opened is the reason.

> Let them shut it The keepers get their stair back. What was under the seal stays under it.

</details>

### `encounter.delve.the_drowned_archive`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_drowned_archive) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_drowned_archive) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: archive.find_what_remains, archive.kindle_a_wanting, archive.draw_on_character)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — seed authored only on an outcome band this run did not roll (rolled 'critical_failure')
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 18 words

The water keeps rising, and the shelves it has not reached yet are the last of the record.

**`fallback/critical_success`** · 117 words

{actor} came up with the charter dry and {cast:keeper} read it at the vault door. The founding families of {location} held this ground on another house's grant, and the charter names where that grant was filed. The water is over the low shelves now and nobody minds.

- A stranger with no claim brought the record up — {cast:keeper} thinks well of {actor} now and will say so to anyone who asks.

- It came up dry and was read at the door — {actor} carries an intelligence record on {location} now: the founding families held this ground on another house's grant.

> Read it aloud at the door The charter is read out where the families can hear it.

**`fallback/success`** · 106 words

{actor} brought the charter up wet and readable. {cast:keeper} has it and the families have heard. There is a watcher at the vault door now.

- The page is public and the rest of the records are not — {target} is under watch now. Quiet work here is seen, and everyone with a claim knows how to get down there.

- It came up wet and still legible — {actor} carries an intelligence record on {location}: the founding families were granted this ground by another house.

> Leave it in the keeper's hands The charter stays with the office that kept it, and the vault door gets a watcher.

**`fallback/success_at_cost`** · 111 words

{actor} got the charter out and the warden set a price on it. The mark it left has not faded, and {cast:keeper} will not say what it means.

- They carried a record past the warden that kept it — {actor} is cursed. The mark sits where the warden set it and does not fade on its own.

- It came out, and the warden took its price for it — {actor} carries an intelligence record on {location}, bought at the warden's price: the founding families held this ground on a grant.

> Take the mark and say nothing Nobody lifts what the warden set. The charter is out, and that is the trade.

**`fallback/failure`** · 124 words

{actor} came up without the charter. The warden would not have the answer and put the box back on the shelf. {cast:keeper} sat with them afterwards and asked what they had read. One name is all they had, and they gave it. The water drops in the dry season, and the shelf will still be there.

- The warden refused them at arm's length — {actor} is terrified. It will pass in a couple of days.

- They read one line before the warden turned them out — {actor} carries an unreliable intelligence record on {location}: one name from the charter, and no proof of it.

> Sit down and hear what they read The keeper sits with them and hears what they got off the shelf.

**`fallback/critical_failure`** · 109 words

The shelf went into the water with the box on it. {actor} got out. {cast:keeper} has lost the whole record of {location} and is grieving it. One line of the charter is still in {actor}'s head.

- The shelf went into the water with the records on it — {cast:keeper} is grieving. The records of {location} are gone and the loss was watched.

- They read a line off the charter before the shelf tipped — {actor} carries an unreliable intelligence record on {location}: one line of a charter nobody can produce now.

> Tell the keeper plainly Nothing is softened. The keeper hears it whole, from the one who was there.

</details>

### `encounter.border.toll_of_blades`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.toll_of_blades) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.toll_of_blades) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: toll.a_little_more, toll.a_little_more_again)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 55 words

What went onto the tablet and what stayed off it is riding north with the column.

> Let them rest before the road Sit them down. The road will still be there when the shaking stops.

> Let the column carry the story The company's telling of it outlives the afternoon. Let it go north with them.

**`fallback/critical_success`** · 131 words

The pack never came off. {cast:serjeant} walked back up the line before the tail was clear, asked for a name, and wrote it in the margin of the tablet. The company keeps a list of people who do not step aside.

- A war column that came forward and stopped — {actor}'s capability in the iron reach moved. Standing a war column down teaches it faster than a drill yard does.

- A recruiting question, asked in the road — {actor} is on the company's member list now, at the lowest rank it keeps.

> Let them rest before the road Sit them down. The road will still be there when the shaking stops.

> Let the column carry the story The company's telling of it outlives the afternoon. Let it go north with them.

**`fallback/success`** · 104 words

Two carters watched the whole row and told it again at the next halt. By evening the column's officers had heard about the traveler who would not move. Before it moved on, the company took their name for its rolls.

- A name taken for the rolls, on the way past — {actor} is on the company's member list now, at the lowest rank it keeps.

> Let them rest before the road Sit them down. The road will still be there when the shaking stops.

> Let the column carry the story The company's telling of it outlives the afternoon. Let it go north with them.

**`fallback/success_at_cost`** · 97 words

A sack went onto the cart and the rest stayed on their back. {cast:serjeant} closed the tablet two rows early to end it there, in front of the whole line, and did not explain why.

- Less taken than the column was owed — The serjeant, {cast:serjeant}, owes {actor} a favour now — and owes the column an explanation.

> Let them rest before the road Sit them down. The road will still be there when the shaking stops.

> Let the column carry the story The company's telling of it outlives the afternoon. Let it go north with them.

**`fallback/failure`** · 96 words

The road is clear again by evening. What it cost is in the shoulder and the hip, and in the next few days. Getting up takes a while, and walking takes longer.

- Boots and spear-butts, and no room at the roadside — {actor} is carrying a wound from it, deep enough to show in how they move.

> Let them rest before the road Sit them down. The road will still be there when the shaking stops.

> Let the column carry the story The company's telling of it outlives the afternoon. Let it go north with them.

**`fallback/critical_failure`** · 103 words

They went down, and the column went past them either way. What the column did not take, the mud did. They woke at the roadside with the tail of the column already small in the distance.

- A row the column found easy — {actor}'s standing with the mercenary company went down. The company thinks less of them than it did before the column stopped.

> Let them rest before the road Sit them down. The road will still be there when the shaking stops.

> Let the column carry the story The company's telling of it outlives the afternoon. Let it go north with them.

</details>

### `encounter.border.the_sign_over_the_ruin`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_sign_over_the_ruin) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_sign_over_the_ruin) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: sign.a_little_more, sign.a_reading_offered)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 86 words

The camp has its answer now, or it has its argument. Everyone here will retell it later as if they had known all along.

> Steady the one who stayed The pilgrim did not look away and did not pick a side. Give that a fire to burn on.

> Take the fear off them A fear taken off the stone can be handed back to it. Let them put it down.

> Let the country carry it Neither reading needs you now. Let the roads argue it out.

**`fallback/critical_success`** · 145 words

The reading came out whole and the camp took it whole. Both sides went quiet at once. Two of the loudest walked up to the stone afterwards and looked at it properly for the first time. People will keep watch on this place from now on.

- The reading was said out loud and taken, in front of everyone camped here — {target} carries Under Watch now — people keep eyes on it, and quiet work here is harder and likelier to be seen.

> Steady the one who stayed The pilgrim did not look away and did not pick a side. Give that a fire to burn on.

> Take the fear off them A fear taken off the stone can be handed back to it. Let them put it down.

> Let the country carry it Neither reading needs you now. Let the roads argue it out.

**`fallback/success`** · 137 words

The reading is out and enough people took it. The argument will go on another week, but it will be a better argument now. There is a road down from here, and people willing to walk it with them.

- The reading landed, and half the camp wanted it said again where more people could hear it — {actor} is set on the road to the nearest settlement, to say it where it will travel further.

> Steady the one who stayed The pilgrim did not look away and did not pick a side. Give that a fire to burn on.

> Take the fear off them A fear taken off the stone can be handed back to it. Let them put it down.

> Let the country carry it Neither reading needs you now. Let the roads argue it out.

**`fallback/success_at_cost`** · 98 words

They got it said. From the second sentence on, the question stopped being the sign and became the stranger claiming to read it. Both old readings still stand. So does a third one now, about them.

> Steady the one who stayed The pilgrim did not look away and did not pick a side. Give that a fire to burn on.

> Take the fear off them A fear taken off the stone can be handed back to it. Let them put it down.

> Let the country carry it Neither reading needs you now. Let the roads argue it out.

**`fallback/failure`** · 138 words

The reading did not hold on the stone or in front of the crowd. Both sides keep what they came with. {cast:witness} has not moved. The stone put a fear into them that will need walking off.

- They stood in front of the remnant longer than anyone else on the ground and came down with no reading — {actor} carries Terrified — a fear from the stone that takes the steadiness out of standing their ground.

> Steady the one who stayed The pilgrim did not look away and did not pick a side. Give that a fire to burn on.

> Take the fear off them A fear taken off the stone can be handed back to it. Let them put it down.

> Let the country carry it Neither reading needs you now. Let the roads argue it out.

**`fallback/critical_failure`** · 186 words

They were certain, and certain of the wrong shape. The camp heard the difference before they finished. By dusk both sides had agreed on one thing: the reader was to blame. {cast:witness} walks them off the ground, points them at a road, and does not say which reading was right.

- They stared it down, got the shape wrong, and heard the whole ground turn while they were still talking — {actor} carries Terrified — a fear from the stone that takes the steadiness out of standing their ground.

- Both sides settled on the same answer about who was to blame, and it was the one who read it — {actor} is set on the road away from {target}, with no destination past being elsewhere.

> Steady the one who stayed The pilgrim did not look away and did not pick a side. Give that a fire to burn on.

> Take the fear off them A fear taken off the stone can be handed back to it. Let them put it down.

> Let the country carry it Neither reading needs you now. Let the roads argue it out.

</details>

### `encounter.delve.the_unfinished_rite`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_unfinished_rite) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_unfinished_rite) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (1 tick(s), hand: rite.loosen_their_nerve)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 7 words

The working stands where it stood, half-finished.

**`fallback/critical_success`** · 108 words

{actor} read the whole working and named what it would take to finish — and what it would cost the six who started it. {cast:keeper} stopped the rite that evening. Word of the reading has left the settlement.

- A true reading was given here in front of everyone — {location} is under watch now — people are coming to see where the rite was stopped.

- The reading was given where everyone could hear it — The story of a rite against death, stopped by a reader, is being carried out of {location}.

> Let the reading be told The story travels, and the country hears what was attempted here.

**`fallback/success`** · 98 words

{actor} followed the working far enough to say it would not hold, and said so. {cast:rival} did not argue it. {cast:keeper} has not decided what to do with the answer.

- A reader gave an answer here that the makers did not want — {location} is under watch now — the argument about the rite has not ended.

- The reading was given in front of the makers — Word of an unfinished rite against death is travelling out of {location}.

> Let the word go with them The reading is repeated on the road, and the country starts hearing it.

**`fallback/success_at_cost`** · 92 words

{actor} gave a true answer and the makers will not speak to them now. {cast:keeper} asked them to leave before dark. The working has not been touched since.

- The reading was given and the reader was sent away for it — {location} is under watch now, and the people there are counting who comes to look.

- They said the working would not hold, and said it out loud — {cast:keeper} does not want them back at {location}.

> Let them go before dark The reader leaves, and the answer stays behind without them.

**`fallback/failure`** · 89 words

{actor} could not follow the working far enough to judge it. {cast:rival} gave the answer the makers had paid for, and the rite goes on tonight.

- The rite went on with nobody able to say what it would do — {location} has a name now, and travellers are going around it.

- A paid reader blessed a working nobody had read — Word is travelling that a rite against death was blessed without being understood.

> Let them finish it Whatever the working does now, the country will hear of it.

**`fallback/critical_failure`** · 97 words

{actor} went too far into the working and lost their way in it. {cast:keeper} and two others pulled them out. {cast:rival}'s answer stands unopposed, and the rite is being finished.

- A reader was carried out of the working in front of everyone — {location} is being avoided now, and the people there know it.

- The reader who came to rule had to be carried out — The story leaving {location} is that the working beat the person sent to read it.

> Let them be pulled clear The story goes out ahead of them, and nobody slows it.

</details>

### `encounter.realm.tithe_demanded`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.realm.tithe_demanded) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.realm.tithe_demanded) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: tithe.steady_the_collector)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `content_query_resolved` — template authors no content query

<details>
<summary><strong>The aftermath as a page</strong> — 5 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 29 words

The cart is gone and the year is reckoned. What the crown took is what the book will say it took.

> Let them sit down once it is over

**`fallback/success`** · 47 words

The crown took the true figure and the ledger was corrected in front of the place. The cart went on lighter than it came for.

- Found the bad year in the ledger — Their standing with the crown rose.

> Let them sit down once it is over

**`fallback/success_at_cost`** · 45 words

The collector settled for the true figure and made it up off the nearest cart. The book is right and somebody is still short.

- Corrected the figure off a neighbour — Their standing with the crown rose.

> Let them sit down once it is over

**`fallback/failure`** · 58 words

The cart left full. {actor} met the difference between the book and the year, and will be meeting it for a while.

- Squeezed for a shortfall the book invented — {actor} left the square shaken.

- Argued the due and did not carry it — Their standing with the crown slipped.

> Let them sit down once it is over

**`fallback/critical_failure`** · 51 words

{cast:collector} wrote the whole figure, took a note of who had argued it, and left the place owing more than it did that morning. The difference came out of {actor}.

- Held to the whole figure in public — {actor} left the square shaken.

> Let them sit down once it is over

</details>

## Director's sample

Ruling: Christian reviews **2** of the 13, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.anomaly.wild_apothecary` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.anomaly.wild_apothecary)
- `encounter.slice.riders_behind_caravan` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
