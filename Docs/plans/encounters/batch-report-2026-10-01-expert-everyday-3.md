# Encounter batch report — 2026-10-01

**Batch:** 3 encounter(s) (ruling 1 sets the batch at 6)
**Brief:** `Docs/plans/encounters/expert-everyday-3-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.town.mill_lease_auction` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, reputation, appointments | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.mill_lease_auction) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.mill_lease_auction) |
| `encounter.town.inheritance_wake` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, reputation, factions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.inheritance_wake) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.inheritance_wake) |
| `encounter.town.flood_dyke_mending` | ✅ green | ❌ failed | 🔗 connected | failure | cast, rewards, seeds, conditions, reputation, content_query | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.flood_dyke_mending) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.flood_dyke_mending) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Content-query census

**1 of 3** encounter(s) author a content query; **1** resolved one live.

Authored by: `encounter.town.flood_dyke_mending`.

## Appointment census

**1 of 3** encounter(s) author an appointment; **0** kept one live (mortal present at the due tick) and **0** missed one live (mortal absent, the promise broken).

Authored by: `encounter.town.mill_lease_auction`.

> 1 authored appointment(s) did not prove both arms on their live run — either the path carrying the seed was not taken, or the mortal was not judged inside the drive. The `appointment_kept` / `appointment_missed` claim rows say which.

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.town.mill_lease_auction` | 🔗 connected | The expert's standing with the town rises or falls, and the town's page shows it. A written note of where the mill's missing grain went (sold off the abbey's books to the merchant) lands in their intelligence, where merchant- and trade-keyed encounters score it. A won bid books them to be back at the mill in the town in three days for quarter day, with the abbey's cellarer. If they keep it, the fellowship pays their fee in kind, the town thinks better of them, and the cellarer warms to them. If they miss it, the cellarer comes to find them wherever they are, and thinks less of them if they cannot answer for the lease. |
| `encounter.town.inheritance_wake` | 🔗 connected | A mortal who keeps faith with the widow wins the eldest heir's trust, joins the local Temple of the Spheres congregation on the parish roll and raises the village's regard; one who writes a fair split instead wins the youngest's trust and the same parish place; a loss lowers the village's regard and costs either the eldest's or the widow's trust, by name. |
| `encounter.town.flood_dyke_mending` | 🔗 connected | Closing the dyke before the crest pays the mortal an #ancient possession from under the culvert's old keystone, raises their standing with the village, and plants a Builders' Fellowship errand that finds them later; failing leaves the village under Blighted Harvest and thinking less of them, and the rival crew's leader (Tam Hesketh, or a reused wanderer) stays in the world with whatever bond the mortal's reaction wrote. |

## Verdict roll-up

- **Gate green:** 3 / 3
- **Live proved:** 1 / 3
- **Live vacuous:** 0 / 3

## Per-encounter detail

### `encounter.town.mill_lease_auction`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.mill_lease_auction) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.mill_lease_auction) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (3 tick(s), hand: mill.stretch_the_morning, mill.read_out_the_rule)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `reward_node` — declared a reward on this run's path but nothing persistent landed — no item/trait change and no persistent effect trace
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- ❌ `appointment_kept` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block
- ❌ `appointment_missed` — declared an appointment on this run's path but pendingEncounterSeeds carries no seed with an appointment block

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 12 words

The abbey's water-mill in {location} has been bid for, won or lost.

**`fallback/critical_success`** · 67 words

The cellarer wrote the fellowship's name into the abbey's book with the merchant still in the room. {actor}'s fee is paid when the lease is sealed.

- The fellowship's word on it — {location} thinks well of their work.

- Sold by the old miller — {actor} knows where the mill's missing grain went.

- Quarter day at the mill — {cast:cellarer} seals the lease in {location} in three days.

**`fallback/success`** · 59 words

The abbey has the fellowship down for the mill. {actor}'s fee is paid when the lease is sealed.

- The fellowship's word on it — {location} thinks well of their work.

- Sold by the old miller — {actor} knows where the mill's missing grain went.

- Quarter day at the mill — {cast:cellarer} seals the lease in {location} in three days.

**`fallback/success_at_cost`** · 63 words

The fellowship will be short of coin all year to pay its rent. {actor}'s fee is paid when the lease is sealed.

- The fellowship's word on it — {location} thinks well of their work.

- Sold by the old miller — {actor} knows where the mill's missing grain went.

- Quarter day at the mill — {cast:cellarer} seals the lease in {location} in three days.

**`fallback/failure`** · 30 words

The fellowship has no mill this year, and it sent for an expert so that would not happen.

- The bid did not stand — {location} thinks less of their work.

**`fallback/critical_failure`** · 26 words

The merchant has the mill, and {location} remembers an expert's mistake longer than a stranger's.

- Said out of turn — {location} thinks less of their work.

</details>

### `encounter.town.inheritance_wake`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.inheritance_wake) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.inheritance_wake) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: wake.remember_the_dead)

- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect
- · `content_query_resolved` — template authors no content query
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 18 ending(s), read each for repetition, verbosity, conflict</summary>

**`positive`** · 5 words

The farmer's wake is over.

**`positive/critical_success`** · 111 words

The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together. {cast:widow} has had {actor}'s name put on the parish roll. Everyone at the wake saw {actor} hold that family together.

- {cast:eldest} trusts {actor} after that night.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Sit with the widow Stay beside the widow through the burial. The widow will think better of the mortal.

> Walk the fields with the eldest Spend the morning with the one who gave up the most. The eldest will trust the mortal more.

**`positive/success`** · 101 words

The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together. {cast:widow} has had {actor}'s name put on the parish roll.

- {cast:eldest} trusts {actor} after that night.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Sit with the widow Stay beside the widow through the burial. The widow will think better of the mortal.

> Walk the fields with the eldest Spend the morning with the one who gave up the most. The eldest will trust the mortal more.

**`positive/success_at_cost`** · 100 words

The farmer is buried, and the farm stays whole under {cast:widow}. {cast:eldest} agreed only at dawn, and the whole wake heard the hard words first. {cast:widow} has had {actor}'s name put on the parish roll.

- {cast:eldest} trusts {actor} after that night.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Sit with the widow Stay beside the widow through the burial. The widow will think better of the mortal.

> Walk the fields with the eldest Spend the morning with the one who gave up the most. The eldest will trust the mortal more.

**`positive/failure`** · 48 words

{cast:eldest} still claims the whole farm by custom, and the family is split over it. {actor} was asked because they can calm a room, and this room did not calm.

- The village thinks less of {actor} as a peacemaker.

- {cast:eldest} trusts {actor} less, for taking the widow's side.

**`positive/critical_failure`** · 43 words

The wake ended in a quarrel no one could stop, and the family stood apart at the burial. The whole village has heard that {actor} was asked to keep the peace, and did not.

- The village thinks less of {actor} as a peacemaker.

**`negative`** · 5 words

The farmer's wake is over.

**`negative/critical_success`** · 125 words

The farmer is buried, and the farm is settled in writing. The deed gives the eldest the whole farm and gives the other two a written share of its harvests. The parish priest witnessed the deed and put {actor}'s name on the parish roll. The widow did not get her wish. Every neighbour at the wake calls the split fair.

- {cast:youngest} trusts {actor} more.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Make peace with the widow Sit with the widow and explain the split. The widow will think better of the mortal.

> Stand by the youngest Stand beside the youngest at the grave, where the eldest can see it. The youngest will trust the mortal more.

**`negative/success`** · 115 words

The farmer is buried, and the farm is settled in writing. The deed gives the eldest the whole farm and gives the other two a written share of its harvests. The parish priest witnessed the deed and put {actor}'s name on the parish roll. {cast:widow} did not get her wish.

- {cast:youngest} trusts {actor} more.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Make peace with the widow Sit with the widow and explain the split. The widow will think better of the mortal.

> Stand by the youngest Stand beside the youngest at the grave, where the eldest can see it. The youngest will trust the mortal more.

**`negative/success_at_cost`** · 101 words

The farm is settled in writing, but {cast:youngest}'s share is smaller than it should be. The parish priest witnessed the deed and put {actor}'s name on the parish roll. The widow did not get her wish.

- {cast:youngest} trusts {actor} more.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Make peace with the widow Sit with the widow and explain the split. The widow will think better of the mortal.

> Stand by the youngest Stand beside the youngest at the grave, where the eldest can see it. The youngest will trust the mortal more.

**`negative/failure`** · 41 words

No one signed, and the family buried the farmer still quarrelling over the land. {actor} set the widow's wish aside for a deed, and came back without one.

- The village thinks less of {actor} as a peacemaker.

- {cast:widow} trusts {actor} less.

**`negative/critical_failure`** · 43 words

The wake ended in a quarrel no one could stop, and the family stood apart at the burial. The whole village has heard that {actor} was asked to keep the peace, and did not.

- The village thinks less of {actor} as a peacemaker.

**`fallback`** · 5 words

The farmer's wake is over.

**`fallback/critical_success`** · 111 words

The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together. {cast:widow} has had {actor}'s name put on the parish roll. Everyone at the wake saw {actor} hold that family together.

- {cast:eldest} trusts {actor} after that night.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Sit with the widow Stay beside the widow through the burial. The widow will think better of the mortal.

> Walk the fields with the eldest Spend the morning with the one who gave up the most. The eldest will trust the mortal more.

**`fallback/success`** · 101 words

The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together. {cast:widow} has had {actor}'s name put on the parish roll.

- {cast:eldest} trusts {actor} after that night.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Sit with the widow Stay beside the widow through the burial. The widow will think better of the mortal.

> Walk the fields with the eldest Spend the morning with the one who gave up the most. The eldest will trust the mortal more.

**`fallback/success_at_cost`** · 100 words

The farmer is buried, and the farm stays whole under {cast:widow}. {cast:eldest} agreed only at dawn, and the whole wake heard the hard words first. {cast:widow} has had {actor}'s name put on the parish roll.

- {cast:eldest} trusts {actor} after that night.

- {actor} is a member of the Temple of the Spheres.

- The village thinks better of {actor}.

> Sit with the widow Stay beside the widow through the burial. The widow will think better of the mortal.

> Walk the fields with the eldest Spend the morning with the one who gave up the most. The eldest will trust the mortal more.

**`fallback/failure`** · 48 words

{cast:eldest} still claims the whole farm by custom, and the family is split over it. {actor} was asked because they can calm a room, and this room did not calm.

- The village thinks less of {actor} as a peacemaker.

- {cast:eldest} trusts {actor} less, for taking the widow's side.

**`fallback/critical_failure`** · 43 words

The wake ended in a quarrel no one could stop, and the family stood apart at the burial. The whole village has heard that {actor} was asked to keep the peace, and did not.

- The village thinks less of {actor} as a peacemaker.

</details>

### `encounter.town.flood_dyke_mending`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.flood_dyke_mending) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.town.flood_dyke_mending) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (5 tick(s), hand: dyke.raise_hidden_water, dyke.hound_a_rival, dyke.call_a_hard_frost)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `seed_planted` — declared a seed effect on this run's path but pendingEncounterSeeds carries none
- · `appointment_kept` — template plants no appointment
- · `appointment_missed` — template plants no appointment

<details>
<summary><strong>The aftermath as a page</strong> — 6 ending(s), read each for repetition, verbosity, conflict</summary>

**`fallback`** · 64 words

The river falls again, and {location} counts what it kept.

> Credit the other crew The mortal says the other crew's sacks bought time. Their leader will remember it kindly.

> Name the sack wall for what it was The mortal tells the village the sacks alone would have failed. The village thinks the better of them, and the other crew's leader will not forget it.

**`fallback/critical_success`** · 108 words

The lower fields are dry, and not one row of wheat was lost. The reeve gives {actor} what the first builders left under the culvert's old keystone, in front of the whole village.

- Their mend stood through the crest — {location} thinks well of {actor} now.

- Word of {actor}'s work reaches the Builders' Fellowship.

> Credit the other crew The mortal says the other crew's sacks bought time. Their leader will remember it kindly.

> Name the sack wall for what it was The mortal tells the village the sacks alone would have failed. The village thinks the better of them, and the other crew's leader will not forget it.

**`fallback/success`** · 95 words

The lower fields stayed dry. The reeve lets {actor} keep what the first builders left under the culvert's old keystone.

- Their mend stood through the crest — {location} thinks well of {actor} now.

- Word of {actor}'s work reaches the Builders' Fellowship.

> Credit the other crew The mortal says the other crew's sacks bought time. Their leader will remember it kindly.

> Name the sack wall for what it was The mortal tells the village the sacks alone would have failed. The village thinks the better of them, and the other crew's leader will not forget it.

**`fallback/success_at_cost`** · 108 words

The dyke holds. It took {actor} longer than it should have, and the reeve saw every slip. The reeve still lets them keep what the first builders left under the culvert's old keystone.

- Their mend stood through the crest — {location} thinks well of {actor} now.

- Word of {actor}'s work reaches the Builders' Fellowship.

> Credit the other crew The mortal says the other crew's sacks bought time. Their leader will remember it kindly.

> Name the sack wall for what it was The mortal tells the village the sacks alone would have failed. The village thinks the better of them, and the other crew's leader will not forget it.

**`fallback/failure`** · 90 words

The river is over the lower fields, and the winter wheat is drowned. The reeve thanks {cast:ganger}'s crew for their sacks, and walks past {actor} without a word.

- Food in {location} will run short this year.

- Sent for, and found wanting — {location} thinks less of {actor} now.

> Help dig out the drains The mortal stays to clear the flooded ditches, and the village marks who stayed.

> Blame the sack wall The mortal tells the reeve the sacks made the breach worse, and the other crew's leader hears of it.

**`fallback/critical_failure`** · 71 words

The reeve sent for a mason to save the dyke, and now blames {actor} for breaking it, in front of everyone in {location}.

- {location} thinks less of {actor} now.

> Help dig out the drains The mortal stays to clear the flooded ditches, and the village marks who stayed.

> Blame the sack wall The mortal tells the reeve the sacks made the breach worse, and the other crew's leader hears of it.

</details>

## Live proof beyond the default run

The table above renders one seed (42) with the cheapest hand. At expert difficulty the proof's ascendant is not an expert, so all three natural runs land on `failure` and the success-side blocks are never on the path the proof takes. As in batches 1 and 2, the live evidence is the proof run with the engine's `setOutcomePin` (the `?outcome=` lever) set before the spawn, through a scratch wrapper (`--pin <band>`, `--drop <cardId>`). Every pinned run's verdict was `band_rendered`. The wake's fork was driven down each arm by dropping one step-0 lean card per run.

**Pinned bands, seed 42, `--play all`:**

| Encounter | `critical_success` | `success` | `success_at_cost` | `failure` | `critical_failure` |
|---|---|---|---|---|---|
| `encounter.town.mill_lease_auction` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| `encounter.town.inheritance_wake` — Sworn arm (positive) | ✅ | ✅ | ✅ | ✅ | ❌ ¹ |
| `encounter.town.inheritance_wake` — Renegade arm (negative) | ✅ | ✅ | ✅ | ✅ | ❌ ¹ |
| `encounter.town.flood_dyke_mending` | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |

**Every success-side pinned band proves on every arm.**

**The appointment, live (pinned success).** The mill lease's seed planted with its appointment block (the lease sealed at the mill on quarter day, the cellarer as counterparty). In the **kept** arm the mortal was present at tick 40 (due 40, window 12) and `town.mill_lease_sealed` spawned at tick 40. In the **missed** arm the mortal stood elsewhere, the miss closed at tick 53 (`unreachable`, window closed 52), the seed was consumed, and `town.mill_lease_forfeit` found the mortal at tick 65. `encounterSeedLiveness.test.ts` passes (17).

**The query prize.** The dyke pays its prize through a tag-filtered step `rewardPool` (`#ancient`, 19 candidates on seed 42). It landed on all three pinned success bands and on no failure band. The `#fellowship_errand` query seed planted on all three success bands.

¹ **The harness's known false negative** (impediments #1111, #1113, #1118; fifth batch running). The proof expects success-side or later-step writes on a run that failed earlier. On the wake and the dyke, `critical_failure` stops the action after step 0, so the later writes are never reached.

## Judgement calls for the director (veto welcome)

- **Three encounters, not four.** The ticket allows a flex slot; the gauge shows only three reaches under the floor, and counts are ceilings. Every reach now meets the expert floor of 2.
- **The wake's shape is a personality fork, not the rolled appointment.** The mill lease carries the batch's appointment floor; two appointments in three slots would have doubled the sequel work and thinned shape variance.
- **The wake's fork reads Heart's own value axis (`loyalty_ambition`)**, the first shipped fork on it. The Renegade arm tests Gold (0.62) on a Heart-first mortal.
- **The dyke's worst ending does not blight the harvest; a plain failure does.** A critical failure stops at the survey (step 0), before the river is fought, so the blight write is not reached. The critical-failure page claims only the breach in the mortal's name and the blame, so nothing on it is false.
- **The dyke repeats `harvest_blight` on `$here`**, as `encounter.town.levee_breach` does. It is the only honest condition for drowned fields.
- **The wake's Temple join is a no-op for a mortal who already belongs**, and the chip still reads as a join (the same exposure `well-sinking` shipped with).

## The board after the batch — the signal for THR-1681

`npm run gameplay-report -- --seeds 42,99,7`, 120 ticks, after:

| | seed 42 | seed 99 | seed 7 |
|---|---|---|---|
| expert success | 61.0% | 59.2% | 69.0% |
| expert mean attempted | 0.13 | 0.16 | 0.12 |
| journeyman mean attempted | 0.17 | 0.18 | 0.15 |

Every reach now meets the expert floor, and expert mean attempted difficulty still does not rise above journeyman's. THR-1679 named this outcome in advance: the problem is the board (draw weights, subtype gating or the too-easy fit), not the count. It is the same shape as the plan's S3 kill criterion, one band up. No expert rung was added (never tuned to pass).

## Director's sample

Ruling: Christian reviews **2** of the batch, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- **The Mill Lease** (the batch's appointment) — [open it at the success ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.mill_lease_auction&outcome=success)
- **The Inheritance Wake** (the warm one) — [open it at the success ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.town.inheritance_wake&outcome=success)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
