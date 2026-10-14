# Encounter Pipeline: The Spy in the Guildhall
> Scale: short (single test, `scale: 'local'`) | Slug: guildhall-spy | Pass: final
> Date: 2026-10-14 | Pipeline version: 3.0 (master-everyday-2, slot 5, THR-1757)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | single shadow test; membership + seed on the success side |
| Editorial (cold critic) | PASS WITH REVISIONS | three overviews and one reaction pair fixed on the page read; near-miss afterimage added |
| Systems (cold critic) | READY WITH CAVEATS | every id resolves; caveats are accepted engine limits |
| Package (cold critic) | PACKAGE PASS · connected | Consortium membership + errand seed + town and warden standing |
| Gate | GREEN | `check:encounter --package` (private bundle), 0 warnings |

### Caveats

1. No band-keyed writes: crit / success / success_at_cost / near-miss share the join + seed; failure and critical failure share the −0.06. Gradation is prose.
2. The `#consortium_errand` query keeps the family eligibility filter; the errand withers outside a settlement. Fails soft.
3. A world with no Merchant Consortium node writes no membership (`joinFaction` fails soft).

### Editorial Notes Summary

success_at_cost no longer asserts an unbacked exposure standing; its cost is the spy escaping (scene-closed, claimed by no chip). Crit overview no longer repeats the chip. Failure overviews no longer leak the band word "master" or assert a summons the scene never staged. Membership chip noun aligned to corpus (`a membership`, `ui.faction_member`); seed chip concept points at the Consortium.

### Implementation File Map

Compiled set only (`compile:encounter`). No engine, type or art-pipeline edits.

---

## Encounter Packet

> The prose below is generated from `guildhall-spy.package.json` and matches it byte for byte. Design sections are carried from the revised pass.

## Mechanical design block (fixed before prose: brief slot 5)

| Row | Value |
|---|---|
| Crux | A rival city has an agent on the town council, and the guildhall's warden asks {actor} to name the spy quietly before the vote. |
| Title | **The Spy in the Guildhall**. Glance test: there is a spy, in the guildhall, and someone has to find them. |
| templateId | `encounter.town.guildhall_spy` · reach `shadow` · `rarityTier: 2` · `intrinsicTier: 'shaping'` · `scale: 'local'` |
| Shape | **Single Test** (catalog). One step, shadow **0.78**, `fail_action`. Linear, branch count 0. Mean 0.78 (severe), window fit 0.92. |
| Settings | `urban` only. The rolled `wayside` is overridden per the brief and survives as the inn where the councillors drink before each sitting. |
| Consequence hand (binding) | `story_seed` + `membership`. No swap. `membership` → `membership_change { factionId: 'merchant_consortium', op: 'join', targetAgentId: '$actor', chronicle: true }` on step success: the guild that keeps the guildhall takes in the one who found its spy. `story_seed` → placeless `encounter_seed` by `query { kind: 'encounter_template', tags: ['#consortium_errand'] }`, delay 48, on step success: the council's quiet gratitude comes back as Consortium work. Both on the same success side, so the errand's own premise (the Consortium sent them) is true by the time it ripens (prose rule 7). |
| Standing (third system) | `reputation_with $here` −0.06 on step failure: the town that sent for a master did not get one. |
| Opposition | **The mortal's own trait**, read from the graph through template-level `traitVariants`. True (`trait.core.core_integrity.virtue`, −0.05: cannot hide what they are asking about; unlocks a trait card that turns plain dealing into an asset). Bitter (`trait.core.core_hope.vice`, −0.05: suspects every councillor alike). False (`trait.core.core_integrity.vice`, +0.05) is the one variant for. Chosen so the shadow job's demand (ask without being seen to ask) is what the trait fights. |
| Seed dice | p3 **opportunity** (a place on the guild's rolls for whoever names the spy) · opposition **own_trait** · disposition **neutral** · agentRole **judge_asked_to_rule** (the warden asks {actor} to name one councillor out of many) · scale **region** (a city's trade, the gates of a town) · system **conditions** (advisory; not taken: the hand is seed + membership, and the brief caps `apply_condition` on `$actor`). |
| Plot hook | Rolled `hook.stranger_bargain, hook.stronghold_mobilization, hook.assassination_succeeded`. Taken: **`hook.stranger_bargain`**: a stranger's bargain that holds a house together, and the price is whose terms. Here a stranger is asked to clean the council's house, and the price is a place inside it. Mobilization survives as the vote to close the gates. |
| Cost channels | Both specials essence-priced or trait-priced. No Heavy Hand (the brief's one is left unspent), no rider, no darkness Undertow (left to slot 8), no grants. |
| Cool failure | Nobody is killed, jailed or branded. Master failure is the name before the purse: the vote goes the rival city's way and the town that sent for a master did not get one; at critical failure the master names an honest councillor a traitor in open hall. |
| Reactions | Success side only: name the spy in open hall (revelation: `reputation_with $here +0.03`, `bond_change $cast:warden −0.10`) or keep the name inside the inner council (discretion: `bond_change $cast:warden +0.10`). |
| Systems | cast (`warden`) · seeds (`#consortium_errand`) · factions (`membership_change`) · reputation (`reputation_with $here`) = 4. |
| Accepted limits | No band-keyed step write: `success_at_cost` takes the same join + seed as success; its cost is the spy escaping, a scene fact claimed by no chip (cold critic). A mortal already on the Consortium's rolls gets no new membership (`already_member`); a world with no Consortium node writes none (`faction_not_found`). The `#consortium_errand` query keeps the family eligibility filter, so the errand withers if the mortal is outside a town, city or capital when it ripens; the chip claims only that the Consortium has heard. |


## 1. Inspiration Anchors

- **hook.stranger_bargain** (the stranger whose bargain holds a family together, priced in whose terms): the council is the family, the warden strikes the bargain, and the price is a place on the guild's rolls. It changed the payoff: the prize is *belonging*, not coin, which is what the drawn `membership` family wants.
- **hook.stronghold_mobilization**: survives as the vote to close the gates to a rival city's trade. It supplies the clock (the next bell) and the scale (region).
- Anti-patterns avoided:
  - The helpful passerby. The mortal is asked to judge one councillor among many (rolled role), and the town's verdict on them is the failure stake.
  - Repeating the shadow verbs on the board: `coiners_mint` finds and seizes dies, `pawnbrokers_strongroom` cracks a strongroom, `tithe_barn_raid` raids a barn. This encounter **unmasks a person** and takes nothing.
  - A rule gate. There is none.


## 2. Scale Justification

Short, one test. The question is a single one (which councillor?) and the bell ends it. A master is sent for because the warden cannot ask the question openly without splitting the council; the weight is in who is across the table and what the town decides about {actor}, not in length.


## 3. Pressure Knot

The council votes at the next bell on closing the gates to a rival city's trade. That city has an agent among the councillors, who will vote and argue its way. The warden knows there is a spy and does not know who.


## 4. Intervention Fantasy

The god plays a spymaster's hand on a room full of councillors: a guilty dream sent to one sleeper, so the spy wakes afraid and shows it; and, for a True mortal, plain questions that the guilty answer without guarding. The dealt fill adds the god's own repertoire on shadow and social work.


## 5. Cast and World Objects

- **{cast:warden}**: warden of the merchants' guildhall. Reuse `merchant` (seeded at town, city and capital at chance 1.0), spawn `merchant`, spawnName **Odile Marchbank**, supportRole `guild_warden`. `must-persist`, because the reactions write bonds to them. Never gendered in prose.
- **The spy**: the councillor who keeps the council's minutes. Role noun only. Revealed behind the test, in the afterimages and band fragments, never in the opening.
- **The councillors**, **the watch**: role nouns.
- **The Merchant Consortium**: the guild that keeps the guildhall. `membership_change join merchant_consortium` (`$faction:merchant_consortium` chip anchor).
- **The Consortium's work**: `encounter_seed` query `#consortium_errand` (five apprentice-rank errands, town/city/capital).
- **Standing**: `reputation_with { targetLocationId: '$here' }` ({location}).


## 6. Beat Structure

1. **Name the spy quietly** (shadow 0.78, `fail_action`): the whole encounter. The reveal (the keeper of the minutes, the letters to the rival city) lives in the afterimages and fragments.


## 7. Branching Profile

Linear, no branching. Branch count 0.


## 8. Branching Map

N/A: linear encounter.


## Stakes

```
goal       name the spy on the council before the vote
risk       name an honest councillor as the traitor
won        named the spy on the council before the vote
lost       let the spy sit through the vote unnamed
lostBadly  named an honest councillor as the traitor
```

Description: "A rival city has a spy on the town council, and the council votes at the next bell on closing the gates to its trade. The warden of the guildhall wants the spy named quietly before the vote."

## Opening (`urban`)

> {actor} is at an inn in {location} where the town councillors drink before each sitting. {cast:warden}, warden of the guildhall, sits down at their table.

## Step 1 — Name the spy quietly (shadow 0.78, fail_action)

### Spine

> The council votes at the next bell on closing the gates to a rival city's trade. One of the councillors is that city's spy.
>
> {cast:warden} asks {actor} to name the spy before the bell, and to do it without the council knowing. The Merchant Consortium will take in whoever does it.

### Afterimages

- **criticalSuccessAfterimage:** The spy is the councillor who keeps the minutes. {actor} found the rival city's letters sewn into the minute book's cover and gave them to {cast:warden} before the bell.
- **successAfterimage:** The spy is the councillor who keeps the minutes. {actor} matched the hand in the minutes to a letter bound for the rival city.
- **nearMissAfterimage:** {actor} named the keeper of the minutes as the bell was ringing. The spy was out of the hall before the watch reached the door.
- **successAtCostAfterimage:** {actor} named the keeper of the minutes before the bell, but asked too many councillors on the way. The spy heard of it and fled the town.
- **failureAfterimage:** {actor} still had no proof when the bell rang. The spy took a seat in the hall and voted.
- **criticalFailureAfterimage:** {actor} named the wrong councillor before the whole hall. The real spy sat quiet and voted with the rest.

### Hand

Deal fill: count 3, tags ["shadow","social"].

**Send A Guilty Dream** (`spy.send_a_guilty_dream`, mind, essence 2, Δ 0.1, image generic.memory)

> Fill one sleeper's night with being found out, so they wake afraid and show it.

- critical_success: The keeper of the minutes woke the inn in the night, shouting the rival city's name.
- success: The keeper of the minutes came down pale at dawn and would not meet {actor}'s eye.
- success_at_cost: The keeper of the minutes woke from the dream and was packing before dawn.
- near_miss: Half the council slept badly that night, and every one of them looked guilty at dawn.
- failure: The dream fell on an honest councillor, who told the whole inn about it at breakfast.
- critical_failure: The dream fell on an honest councillor, and {actor} took the councillor's fear for guilt.

**Show An Honest Face** (`spy.show_an_honest_face`, card.trait_card.core, essence 0, Δ 0.07, requires trait.core.core_integrity.virtue, image generic.oath)

> Let their plain dealing disarm suspicion, so the guilty answer them without guarding their words.

- success: {actor} asked every councillor straight out, and the keeper of the minutes was the only one who lied.
- failure: {actor} asked straight out, and the councillors took offence and stopped talking.

### Trait variants

- `trait.core.core_integrity.virtue` Δ -0.05: Being True, they cannot hide what they are asking about. (adds spy.show_an_honest_face)
- `trait.core.core_hope.vice` Δ -0.05: Being Bitter, they suspect every councillor alike.
- `trait.core.core_integrity.vice` Δ 0.05: Being False, they lie to the council as easily as the spy.

### Step effects

- successMetadata: membership_change join merchant_consortium; encounter_seed query #consortium_errand delay 48 — "Word of the spy reaches the Merchant Consortium, which has work for {actor}."
- failureMetadata: reputation_with $here -0.06

## Narrative templates

- initiation: The warden of a town's guildhall asks {actor} to name the rival city's spy on the council before the vote.
- success: The spy on the council was named, and the vote closed the gates to the rival city.
- failure: The spy on the council was not named, and the gates stay open to the rival city.

## Aftermath (fallback.byOutcome)

Fallback overview: The council has voted on the gates.

### critical_success

The council voted to close the gates to the rival city once the letters were read to the inner council.

- BOND · a membership — **Taken In** — Vouched for by {cast:warden}. {actor} is on the rolls of the Merchant Consortium now.
- PATH · seed — **Work From the Consortium** Word of the spy reaches the Merchant Consortium, which has work for {actor}.
> **Name the spy in open hall** — The whole council hears who betrayed it. The warden wanted it kept quiet, and will hold that against the mortal. (reputation_with $here 0.03; bond_change $cast:warden -0.1)
> **Keep the name inside the council** — Only the inner council keeps the name. The warden will remember the discretion. (bond_change $cast:warden 0.1)

### success

The council voted to close the gates to the rival city, with its spy held.

- BOND · a membership — **Taken In** — Vouched for by {cast:warden}. {actor} is on the rolls of the Merchant Consortium now.
- PATH · seed — **Work From the Consortium** Word of the spy reaches the Merchant Consortium, which has work for {actor}.
> **Name the spy in open hall** — The whole council hears who betrayed it. The warden wanted it kept quiet, and will hold that against the mortal. (reputation_with $here 0.03; bond_change $cast:warden -0.1)
> **Keep the name inside the council** — Only the inner council keeps the name. The warden will remember the discretion. (bond_change $cast:warden 0.1)

### success_at_cost

The council voted to close the gates to the rival city, with its spy gone and nobody held for it.

- BOND · a membership — **Taken In** — Vouched for by {cast:warden}. {actor} is on the rolls of the Merchant Consortium now.
- PATH · seed — **Work From the Consortium** Word of the spy reaches the Merchant Consortium, which has work for {actor}.
> **Name the spy in open hall** — The whole council hears who fled and why. The warden wanted it kept quiet, and will hold that against {actor}. (reputation_with $here 0.03; bond_change $cast:warden -0.1)
> **Keep the name inside the council** — The town hears only that a councillor has left. The warden will remember the discretion. (bond_change $cast:warden 0.1)

### failure

The vote to close the gates failed by the spy's own vote. {location} asked {actor} for a name and never got one.

- BOND · reputation with {location} — **Not Trusted** {location} thinks less of {actor} now.

### critical_failure

The council spent the sitting on the wrong name, and the gates stay open to the rival city. {location} asked {actor} for the spy and was handed an honest councillor instead.

- BOND · reputation with {location} — **Named Wrongly** {location} thinks less of {actor} now.

## Support bundle

- `warden` (Odile Marchbank), guild_warden, lazy-materialize-on-trigger, must-persist, reuse merchant, spawn merchant

## Concept Art Direction

1. Emotions: a trusted room with a rot inside it; a quiet question that could break a council; belonging bought by exposing someone.
2. Image: a guildhall's long council table after the sitting, empty chairs pushed back, one minute book left open with its cover slit along the spine, a cold candle beside it. No people.

