# Encounter Pipeline: The Spy in the Guildhall
> Scale: short (local) | Slug: guildhall-spy | Pass: draft
> Date: 2026-10-14 | Pipeline version: 2.0 (factory batch master-everyday-2, slot 5, THR-1757)

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
| Accepted limits | No band-keyed step write: `success_at_cost` takes the same join + seed as success; its cost (the spy fled, every councillor knows who asked) is prose only. A mortal already on the Consortium's rolls gets no new membership (`already_member`); a world with no Consortium node writes none (`faction_not_found`). The `#consortium_errand` query keeps the family eligibility filter, so the errand withers if the mortal is outside a town, city or capital when it ripens; the chip claims only that the Consortium has heard. |

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

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | The spy named with proof before the bell; the vote closes the gates | — | On the Consortium's rolls; Consortium work coming; the warden tells the inner council who found the spy |
| success | The spy named before the bell; the vote closes the gates | — | Rolls; work coming |
| success_at_cost | The spy named, but fled the town; every councillor knows who asked | quiet | Rolls; work coming |
| failure | No name by the bell; the spy votes; the gates stay open | {actor}'s name with the town | The town thinks less of {actor} |
| critical_failure | An honest councillor named; the council quarrels; the gates stay open | {actor}'s name | The town thinks less of {actor} |

## 9b. Stakes Line

```
goal:      name the spy on the council before the vote
risk:      name an honest councillor as the traitor
won:       named the spy on the council before the vote
lost:      let the spy sit through the vote unnamed
lostBadly: named an honest councillor as the traitor
```

Description: "A rival city has an agent on the town council, and the council votes at the next bell on closing the gates to its trade. The warden of the guildhall wants the spy named quietly before the vote."

## 10. Sample Opening (narrator mode, `urban`)

> {actor} is at an inn in {location} where the town councillors drink before each sitting. {cast:warden}, warden of the guildhall, sits down at their table.
>
> The council votes at the next bell on closing the gates to a rival city's trade. One of the councillors is that city's spy.
>
> {cast:warden} asks {actor} to name the spy before the bell, without the council learning it was asked. The Merchant Consortium will take in whoever does it.

Opening (P1) 25 words; step spine (P2 + P3) 47 words. Total 72 / 80.

## Step spine (narrativeTemplate)

P2 + P3 above.

### Afterimages

| Band | Afterimage |
|---|---|
| critical_success | The spy is the councillor who keeps the minutes. {actor} found the rival city's letters sewn into the minute book's cover and gave them to {cast:warden} before the bell. |
| success | The spy is the councillor who keeps the minutes. {actor} matched the hand in the minutes to a letter bound for the rival city. |
| success_at_cost | {actor} named the keeper of the minutes before the bell, but asked too many councillors on the way. The spy heard of it and fled the town. |
| failure | {actor} had two names and no proof when the bell rang. The spy took a seat in the hall and voted. |
| critical_failure | {actor} named the wrong councillor. The council quarrelled in open hall, and the real spy voted with the rest. |

## 11. The Hand

### Step 0: purposeLine "Name the spy quietly" · difficulty 0.78 · `deal: { count: 3, tags: ['shadow', 'social'] }`

| id | Card (library type) | `libraryCardId` | Sphere | Essence | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `spy.send_a_guilty_dream` | **Send A Guilty Dream** (Whisper) | — | mind | 2 | 0.10 | generic.memory | Fill one sleeper's night with being found out, so they wake afraid and show it. |
| `spy.show_an_honest_face` | **Show An Honest Face** (Trait card, `requiredTrait: 'trait.core.core_integrity.virtue'`) | `card.trait_card.core` | — | 0 | 0.07 | generic.oath | Let their plain dealing disarm suspicion, so the guilty answer them without guarding their words. |

Forecast ceiling: 0.78 + 0.10 + 0.07 = 0.95 ≤ 1.00.

Band fragments:

- **Send A Guilty Dream**
  - critical_success: "The keeper of the minutes woke the inn in the night, shouting the rival city's name."
  - success: "The keeper of the minutes came down pale at dawn and would not meet {actor}'s eye."
  - success_at_cost: "The keeper of the minutes woke from the dream and was packing before dawn."
  - near_miss: "Half the council slept badly that night, and every one of them looked guilty at dawn."
  - failure: "The dream fell on an honest councillor, who told the whole inn about it at breakfast."
  - critical_failure: "The dream fell on an honest councillor, and {actor} took the councillor's fear for guilt."
- **Show An Honest Face**
  - success: "{actor} asked every councillor straight out, and the keeper of the minutes was the only one who lied."
  - failure: "{actor} asked straight out, and the councillors took offence and stopped talking."

Coverage: Send A Guilty Dream alone covers all six bands, so the hand stays covered off-trait when Show An Honest Face is hidden.

### Trait hooks (four questions)

1. **Gate?** None (everyday board).
2. **Variant?** Yes, three, template-level:

   | `traitId` | Δ | `factorLine` | `addNudgeIds` |
   |---|---|---|---|
   | `trait.core.core_integrity.virtue` | −0.05 | "Being True, they cannot hide what they are asking about." | `['spy.show_an_honest_face']` |
   | `trait.core.core_hope.vice` | −0.05 | "Being Bitter, they suspect every councillor alike." | — |
   | `trait.core.core_integrity.vice` | +0.05 | "Being False, they lie to the council as easily as the spy." | — |

3. **Trait-only nudge?** Yes: Show An Honest Face, unlocked by the True variant.
4. **Trait fragment?** Yes: Show An Honest Face's two fragments read only when the True mortal's god played it.

## 12. Linear continuation

None: single test. The spine is the whole scene.

## 13. Aftermath Paragraph (fallback overview)

> The council has voted on the gates.

## 14. Aftermath Reaction Choices

Success side only (authored on critical_success, success and success_at_cost; the fallback carries none, so failure bands show none):

- **Name the spy in open hall**: "The whole council hears who betrayed it. The warden wanted it kept inside the inner council, and will hold that against the mortal." → `reputation_with $here +0.03`, `bond_change $cast:warden −0.10`.
- **Keep the name inside the council**: "Only the inner council ever learns who it was. The warden will remember the discretion." → `bond_change $cast:warden +0.10`.

Failure side: no reaction choices; the consequence is clean.

## 15. Aftermath Kit Summary (byOutcome)

| Band | Overview | Chips |
|---|---|---|
| critical_success | The council voted to close the gates to the rival city. {cast:warden} told the inner council who found the spy. | **bond** a guild membership ($faction:merchant_consortium), cause "Vouched for by {cast:warden}", "{actor} is on the rolls of the Merchant Consortium now." **path** seed, "Word of the spy reaches the Merchant Consortium, which has work for {actor}." |
| success | The council voted to close the gates to the rival city, with its spy held. | same two |
| success_at_cost | The council voted to close the gates. Every councillor now knows who was asking questions at the inn. | same two |
| failure | The vote to close the gates failed by one voice, and the spy's voice was among them. {location} sent for a master and still does not know who sold it. | **bond** reputation with {location} (loss), "{location} thinks less of {actor} now." |
| critical_failure | The council quarrelled over the wrong name until the bell, and the gates stay open to the rival city. {location} sent for a master, and that master called an honest councillor a traitor. | **bond** reputation with {location} (loss), "{location} thinks less of {actor} now." |

Writes backing every chip:

- **Step `successMetadata`:** `membership_change` join `merchant_consortium` → membership chip; `encounter_seed` `#consortium_errand` → path chip. Fires on every success-side band.
- **Step `failureMetadata`:** `reputation_with $here −0.06` → the loss chip on failure and critical_failure.

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| warden (actor) | lazy-materialize-on-trigger | reuse `merchant`, spawn `merchant` "Odile Marchbank", supportRole `guild_warden` | must-persist | bond reactions | ready |
| Membership | effect (`membership_change` join) | step success | persists (`member_of`) | Consortium errands | ready |
| Consortium work | effect (`encounter_seed` query) | step success | pending seed | `#consortium_errand` | ready |
| Standing with {location} | effect (`reputation_with $here`) | step failure | persists | reputation | ready |

## 17. Self-Audit

- Opening: skeleton, ≤80 words (72), graph names only. PASS.
- Hand: 2 specials + deal 3 (1 + 3 off-trait). PASS; sphere spread delegated to the dealer, FLAG until `check:encounter` prints the composed hand.
- Forecast ceiling 0.95. PASS.
- Band coverage: all six by Send A Guilty Dream. PASS.
- Failure fragments on every nudge. PASS.
- Effect lines: no digits; no word shared with the card's name. PASS.
- Zero-essence card: trait card only. PASS.
- Law 56: every chip backed (above). PASS.
- Prose rule 7: no asserted history. PASS. Rule 7b: "The Merchant Consortium will take in whoever does it" is enacted by `membership_change` on success; reaction futures by `bond_change`. PASS.
- Over-exposed cards: none taken. PASS.

## Concept Art Direction

1. Emotions: a trusted room with a rot inside it; a quiet question that could break a council; belonging bought by exposing someone.
2. Image: a guildhall's long council table after the sitting, empty chairs pushed back, one minute book left open with its cover slit along the spine, a cold candle beside it. No people.

## Narrator's 12 questions

1 P1 arrival with {actor} and {location}: yes. 2 P2 events: the vote at the next bell; a councillor is the rival city's spy. 3 P3 one stake: opportunity (whoever names the spy is taken in), with the bell as the clock. 4 ≤80: 72. 5 Read aloud as report: yes. 6 Stated, never encoded: yes. 7 Every sentence works: yes. 8 Nothing unintroduced: the minutes and the letters are revealed only behind the test. 9 One named person: {cast:warden}. 10 Stake in a sentence: can {actor} name the spy before the bell without the council learning it was asked? 11 Cards verb + noun: Send A Guilty Dream, Show An Honest Face. 12 Opening per class: urban.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (the councillors, the spy, the inn before the sitting) · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (a dream on the guilty vs plain questions answered) · 9b YES · 10 YES · 11 YES · 11b YES · 12 N/A (short; reactions authored anyway) · 13 YES (open truth vs discretion) · 14 YES.
