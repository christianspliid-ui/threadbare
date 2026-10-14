# Encounter Pipeline: The Hostage Exchange
> Scale: medium | Slug: hostage-exchange | Pass: revised
> Revisions applied: self-edit against the 35 editorial REVISE triggers — (22) step-0 afterimages no longer echo the spine's "what … each want"; (22) step-1 crit carryover no longer echoes the step-0 crit afterimage; (35) step-1 failure/crit-fail afterimages no longer contradict the overviews over whose heirs went home; (22) crit overview no longer repeats "the heads of the two houses" from the crit afterimage; (35) success and failure overviews rewritten for a cleaner page; Reveal The Price crit_fail fragment no longer repeats the step-0 crit-fail afterimage. Gate: `check:encounter --package` GREEN, 0 warnings.
> Date: 2026-10-14 | Pipeline version: 2.0

> Template: `encounter.town.hostage_exchange` · Batch: master-everyday-2, slot 3 (THR-1757) · Brief: `Docs/plans/encounters/master-everyday-2-brief.md` · Model package: `granary-riot` (heart, master batch 1)

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | Two houses are exchanging the heirs they hold as surety for a peace, and the captain keeping one heir wants a ransom first. Both houses send for {actor} to make the exchange. |
| Title | **The Hostage Exchange** |
| Shape | Puzzle – Investigation – Resolution. heart 0.74 (`continue_weakened`) → heart 0.80 (`fail_action`). Linear, branch count 0. Mean 0.77, window fit 0.91 (master). Carryover lines on step 1 key on the band step 0 rolled, so the exchange uses, or does without, what the questions found. |
| Setting | `urban`, `rural` (brief). The rolled `battlefield` survives as the scene's place inside the town: the bridge with both houses' armed men drawn up at either end. One opening per class. |
| Stake (P3) | choice (rolled): the exchange can be made or lost, and both houses have handed the making of it to {actor}. |
| Opposition | rival agent (greed): {cast:captain}, who holds one heir and wants a ransom before the exchange. |
| Disposition | wary: both houses' men are armed and waiting; nobody wants a fight, nobody trusts the other side to cross first. |
| Agent role | bystander pulled in: the houses send for a master because both will accept that master's terms. |
| Scale | settlement: the peace between two houses of the town. `scale: 'local'`. |
| System target | items (rolled, advisory): read as the companion grant; no item is minted. |
| Plot hook | rolled `hook.mentors_test`, `hook.oath_breaking_scandal`, `hook.rebuilding_trust` · **taken `hook.rebuilding_trust`**: two houses that ended a feud must trust each other for one walk across a bridge. |
| Consequence hand (binding) | `relationship` + `companion`. No swap. relationship = `bond_change` with `$cast:heir` on both sides of step 1 and on step 0 failure. companion = `grant_companion` `companion.sellsword-band` (`targetAgentId: '$actor'`) on step 1 success: the captain's sergeant and the men who would not back the ransom leave the captain and take service with {actor}. |
| Standing | `reputation_with $here` +0.06 on step 1 success, −0.06 on step 1 failure, −0.02 on step 0 failure (backs the critical_failure town chip on both routes). |
| Cast | `captain` (the greedy keeper, must-persist) and `heir` (the held heir, must-persist, always spawned so the prose's "heir" is true). The heads of the two houses and the sergeant are role nouns. |
| Systems | cast · reputation · rewards (bond, standing and companion writes) = 3, plus the companion surface. |
| Mortal choice | None in the steps: this is a test of Heart. The stance lives in the aftermath reactions. |
| Tone | Ends warm on the success side: both heirs cross, the peace holds, and the honest men walk away from the greedy one. |
| Cool failure | Nobody dies, is jailed or branded. Failure is the master's name: both houses sent for a master because a master's terms should end the haggling, and the captain's greed outweighed them. |
| Cost channels | All specials essence-priced except the Integrity trait card (cost 0). No Heavy Hand, no rider, no grants, no over-exposed library card as a special. |
| Expert collision | Heart master is `granary_riot` (rule at a riot); experts `feud_mediation` (make peace between two houses) and `inheritance_wake` (settle a will). This verb is *broker an exchange against a greedy keeper*: the peace is already made; the job is the handover, and the opponent is one man's greed, not two houses' pride. |

## 1. Inspiration Anchors

- **hook.rebuilding_trust** (taken): two houses that have just ended a feud have to trust each other for the length of a bridge. It gave the scene its shape: the peace is agreed, the risk is the handover.
- **hook.oath_breaking_scandal** (rolled, not taken): survives as the captain's move — breaking the terms of a sworn peace for money at the last hour.
- **hook.mentors_test** (rolled, not taken): dropped. A test set by a mentor would make the master a pupil; the brief wants the master as the one both houses defer to.
- Anti-patterns avoided: the houses as villains (both want their heirs home); the captain as a monster (greedy, not murderous; his own men will not back him); a fight gate (no step is won with steel; the danger is steel being drawn).

## 2. Scale Justification

Medium: two beats, the questions and the handover, at master rarity. The outcome decides whether a peace between two houses survives its first test, which is what a master is sent for. Medium owes reaction choices.

## 3. Pressure Knot

Two houses ended a feud and swapped heirs as surety. The term is up and the heirs go home today, at the bridge at noon. Each house's armed men are drawn up at its end. The captain keeping one heir has decided the day is worth a ransom. Neither house will send its heir over first.

## 4. Intervention Fantasy

The god watches one person stand in the middle of a bridge between two lines of armed men. The hand reaches into the wary people being questioned (mind), the captain's hidden demand (light), the armed men's ready hands (order), and the mortal's own honesty (the Integrity trait card). None of it tells the mortal what terms to name.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | the mortal | protagonist; sent for by both houses |
| `{cast:captain}` | actor, must-persist | holds one heir; wants a ransom. Reuse `guard_captain` / `mercenary` / `guard`, spawn `mercenary`, spawnName **Bram Hollis**, supportRole `hostage_keeping_captain` |
| `{cast:heir}` | actor, must-persist | the heir the captain holds. No reuse roles (always spawned, so "heir" is true), spawn `noble`, spawnName **Edric Marrow**, supportRole `held_heir` |
| the two houses, their heads | role nouns | off-stage voices; never chipped |
| the captain's sergeant and men | role noun → companion | become `companion.sellsword-band` on success |
| `{location}` (`$here`) | location | the town; carries the standing edge |
| the bridge | scene fiction | never chipped |

## 6. Beat Structure

1. **Learn what each wants** (heart 0.74, `continue_weakened`). The investigation: {actor} questions the captain, the houses and the heirs before noon. A plain failure lets the captain hear of the questions and raise the price; the held heir stops talking. A critical failure ends it: the captain calls the exchange off.
2. **Make the exchange** (heart 0.80, `fail_action`). The resolution: at noon, on the bridge, {actor} must bring both heirs across before either side draws steel.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Route | Progress | Spent | Burden / opening |
|---|---|---|---|---|
| critical_success | both steps clean, one critical | both heirs home, the peace renewed in front of the town | nothing | sellsword band joins; heir's trust; standing up |
| success | both steps clean | both heirs home, the peace holds | a hard morning | sellsword band joins; heir's trust; standing up |
| success_at_cost | step 0 failed or near-missed, or step 1 at cost | both heirs home | a scuffle at the far end; men hurt | sellsword band joins; standing and trust up net |
| failure | step 1 failed | nothing | the master's name | both heirs still hostages; the held heir trusts them less; standing down |
| critical_failure | step 0 or step 1 critical failure | nothing | the peace itself | the held heir blames them; standing down |

## 9b. Stakes Line

```
goal:      make the hostage exchange on the bridge
risk:      see steel drawn on the bridge and the peace broken
won:       made the hostage exchange on the bridge
lost:      left both heirs hostages when the captain held out
lostBadly: saw steel drawn on the bridge and the peace broken
```

Description: "Two houses are exchanging the heirs they hold as surety for a peace, and the captain keeping one heir wants a ransom first. Someone has to learn what each side wants, then bring both heirs across the bridge before steel is drawn."

## 10. Sample Opening

**Opening (urban):**
> {actor} arrives at {location} in the morning.

**Opening (rural):**
> {actor} walks into {location} at first light.

**Spine (step 0 narrative):**
> Two houses ended a feud, and each gave the other an heir as surety. Today the heirs go home across the bridge at noon. Both houses' armed men wait at either end.
>
> {cast:captain} holds one of the heirs and will not release them without a ransom. Both houses have sent for {actor} to make the exchange. First {actor} must learn what the captain, the houses and the heirs each want.

Word count: 7 + 32 + 38 = 77 (urban); rural 7 + 70 = 77.

## 11. The Hand Per Step

### Step 0 — Learn what each wants (heart 0.74) · purpose "Learn what each wants"
`deal: { count: 3, tags: ['insight', 'social'] }`

**Afterimages**
- critical_success: "Both houses named terms they could live with, and even the captain's own men called the ransom a disgrace."
- success: "Both houses named terms they could live with, and the captain's men want no part of the ransom."
- success_at_cost: "Both houses named their terms, but the captain heard of the questions and raised the price."
- failure: "The captain heard of the questions and raised the price. The held heir stopped answering {actor}."
- critical_failure: "The captain heard of the questions and called the exchange off."

Failure metadata: `bond_change $cast:heir` sentiment −0.06, trust −0.06 · `reputation_with $here −0.02`.

**Specials**
1. **Loosen Guarded Tongues** — Whisper (mind) · essence 2 · Δ 0.10 · `generic.rumor`
   effectLine: "Ease the wariness of everyone being questioned, so they say what they want instead of what they were told."
   - critical_success: "The captain's own men spoke first, and both houses followed."
   - success: "The two houses stopped repeating their terms and said what they feared."
   - near_miss: "The heirs spoke freely, but only once the morning was nearly gone."
   - failure: "The captain's men talked freely, and the captain heard every word."
2. **Reveal The Price** — Omen-type light card (light) · essence 2 · Δ 0.08 · `generic.light`
   effectLine: "Bring a hidden demand into the open, so the one who made it cannot pretend it was never asked."
   - success: "The captain named the real sum, and it was less than the first demand."
   - success_at_cost: "The captain's price came out, along with an insult to the held heir's house."
   - failure: "The captain's price came out in front of the held heir's house, which took it as an insult."
   - critical_failure: "The captain's price came out in front of both houses, and the captain walked away from the bridge."

### Step 1 — Make the exchange (heart 0.80) · purpose "Make the exchange"
`deal: { count: 3, tags: ['presence', 'social'] }`

**Spine:**
> At noon the bridge is clear between the two lines of armed men. {cast:heir} waits at the far end beside the captain's sergeant. The captain will not let {cast:heir} cross unpaid, and the other house will not send its own heir over first. {actor} must bring both heirs across before either side draws steel.

**Carryover (from step 0):** crit "The captain stands alone in asking for a ransom." (+0.06) · success "The go-between knows what will satisfy each side." (+0.04) · s@c "The captain now asks more than either house will pay." (−0.02) · near_miss "Both lines of men grew restless during the questions." (−0.03) · failure "The held heir no longer trusts the go-between." (−0.05) · no crit_fail carryover (a step-0 critical failure ends the action).

**Afterimages**
- critical_success: "Both heirs crossed together, and the heads of the two houses met in the middle of the bridge."
- success: "Both heirs crossed together, and the armed men at both ends stood down."
- success_at_cost: "Both heirs crossed, but the men at the far end came to blows first."
- failure: "The captain would not give up {cast:heir}, and each house led its hostage back off the bridge."
- critical_failure: "Steel was drawn on the bridge, and each house dragged its hostage away."

Success metadata: `bond_change $cast:heir` +0.12 / +0.1 · `grant_companion companion.sellsword-band` → `$actor` · `reputation_with $here +0.06`.
Failure metadata: `bond_change $cast:heir` −0.12 / −0.1 · `reputation_with $here −0.06`.

**Specials**
1. **Still Ready Blades** — Insurance-type order card (order) · essence 2 · Δ 0.10 · `generic.blade`
   effectLine: "Calm the armed men on both sides, so no hand leaves a hilt while the exchange is made."
   - critical_success: "Not one man on either end touched a hilt while the heirs crossed."
   - success: "The men at both ends kept their hands away from their swords."
   - success_at_cost: "The men at the near end kept still, and the far end shoved and shouted."
   - near_miss: "The men kept their swords sheathed, but only after a long shouting match across the bridge."
   - failure: "The men kept their swords sheathed, and the captain kept the heir anyway."
   - critical_failure: "The men held still until the captain drew, and then both lines drew."
2. **Stand As Surety** — Trait card (True) · `requiredTrait: trait.core.core_integrity.virtue` · essence 0 · Δ 0.08 · `generic.oath`
   effectLine: "Lend their own good name to the terms, so both houses believe the exchange will be kept."
   - success: "{actor} gave {their} own word for the terms, and both houses took it."
   - failure: "{actor} gave {their} own word for the terms, and the captain laughed at it."

## 12. Linear continuation

> At noon the bridge is clear between the two lines of armed men. {cast:heir} waits at the far end beside the captain's sergeant. The captain will not let {cast:heir} cross unpaid, and the other house will not send its own heir over first. {actor} must bring both heirs across before either side draws steel.

## 13. Aftermath Paragraph (per band)

- **critical_success:** "The two houses renewed their peace in front of the town that evening. The captain left {location} alone the next morning."
- **success:** "Both heirs are home, and the peace between the two houses holds."
- **success_at_cost:** "Both heirs are home, but men from both houses were hurt in the scuffle at the far end."
- **failure:** "Both heirs are still hostages, and the two houses are counting the days again. They sent for a master because a master's terms should end the haggling. The captain's greed outweighed them."
- **critical_failure:** "The peace between the two houses is broken, and both heirs are still hostages. Both houses sent for {actor}, and both now say {actor} lost them the peace."
- **fallback:** "The bridge empties, and {location} talks about the exchange."

## 13b. Narrative templates

- initiation: "Two houses exchange the heirs they hold as surety, and a greedy captain holds one heir back."
- success: "Both heirs crossed the bridge, and the peace between the houses held."
- failure: "The exchange failed on the bridge, and both heirs stayed hostages."

## 14. Aftermath Reaction Choices

Success side (`fallback.reactions`):
- **Let the captain go quietly**: "The mortal keeps the captain's demand out of the town's talk. The captain will remember the kindness." → `bond_change $cast:captain +0.04`.
- **Tell the town what the captain asked**: "The mortal tells the town what the captain demanded on the bridge, and the town hears who refused to pay it." → `reputation_with $here +0.03`.

Failure side (`byOutcome.failure.reactions` and `byOutcome.critical_failure.reactions`):
- **Stand by the held heir**: "The mortal stays at the held heir's side until the houses part. The heir will remember it kindly." → `bond_change $cast:heir +0.04`.
- **Blame the captain openly**: "The mortal names the captain's greed before both houses. The captain will not forgive it." → `bond_change $cast:captain −0.04`.

Stances: discretion vs open truth (success); comfort for the one who suffers vs accusation of the one who caused it (failure).

## 15. Aftermath Kit Summary (chips)

| Band | Chip | kind / category | stateNoun | Backing write |
|---|---|---|---|---|
| crit / success / s@c | The Town's Thanks: "{location} thinks better of {actor} now." | reputation / bond / gain | `reputation with {location}` (`$here`) | step 1 success +0.06 (net +0.04 after step 0 failure) |
| crit / success / s@c | The Heir's Trust: "{cast:heir} trusts {actor} now." | reputation / bond / gain | `reputation` + concept `{cast:heir}` → `$cast:heir` | step 1 success bond (net +0.06 after step 0 failure) |
| crit / success / s@c | The Sergeant's Band: "The sergeant's sellsword band travels with {actor} now." | shell_state / bond / gain | `companion` (tooltip `ui.companions`) + concept `sellsword band` | step 1 success `grant_companion` |
| failure | Terms Refused: "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | step 1 failure −0.06 |
| failure | The Heir's Doubt: "{cast:heir} trusts {actor} less now." | reputation / bond / loss | `reputation` + concept `$cast:heir` | step 1 failure bond |
| critical_failure | Blamed for the Bridge: "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | −0.02 (step 0) or −0.06 (step 1) |
| critical_failure | The Heir's Blame: "{cast:heir} trusts {actor} less now." | reputation / bond / loss | `reputation` + concept `$cast:heir` | step 0 or step 1 failure bond |

Route check: step-0 failure then step-1 success resolves success_at_cost; net standing +0.04, net heir bond +0.06 / +0.04, companion granted — every gain chip holds. Crit fail at either step is backed by that step's failure writes. The failure-side reactions at ±0.04 on the heir leave the loss chips true (worst case −0.06 + 0.04 = −0.02); the captain carries no chip.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `captain` | lazy-materialize-on-trigger | reuse `guard_captain` / `mercenary` / `guard`, spawn `mercenary` "Bram Hollis" | must-persist | reactions (bond) | live |
| `heir` | lazy-materialize-on-trigger | spawn `noble` "Edric Marrow" (no reuse) | must-persist | bond writes, reactions | live |
| `$here` | the town | resolved location | n/a | standing edge | live |
| `companion.sellsword-band` | `grant_companion` | `src/data/companion-templates.ts` | companion (contracted, `durationTicks`) | Companions row | live |

## 17. Concept Art Direction

1. *Emotions:* a peace that holds only as long as one walk across a bridge; children as surety; greed at the last hour.
2. *Image:* an empty stone bridge at noon, a small folded travelling cloak left on the parapet halfway across, two furled house banners leaning at either end. No people.

## 18. Trait hooks

1. Gate? None (everyday board; no rule gates by brief).
2. Variant? `trait.core.core_integrity.virtue` +0.04 ("Being True, they are believed when they name the terms.") with `addNudgeIds: ['hostage.stand_as_surety']` · `trait.core.core_integrity.vice` −0.04 ("Being False, they are not believed when they name the terms.").
3. Trait-only nudge? Yes: **Stand As Surety** on step 1, cost 0.
4. Trait fragment? The trait card's own band fragments.

## 19. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + one opening per class | PASS (urban, rural) |
| Opening ≤80 words | PASS (77) |
| Hand 4–8 composed, ≤2 specials, deal declared | PASS (2 + 3 per step) |
| Every special has a failure-band fragment | PASS |
| All six StepOutcomes covered per step | PASS |
| Verb+noun names from the lexicon (loosen, reveal, still, stand) | PASS |
| Effect line repeats no word of its name | PASS |
| Consequence hand wired (relationship + companion) | PASS |
| No `$companion` sentinel used | PASS |
| Chips backed per route | PASS |
| No later-tense promise without an effect (rule 7b) | PASS |
| No gendered cast prose | PASS ("the captain", "the heir", `{their}` for the mortal) |
| Systems ≥3 | PASS |
| Reactions for medium | PASS |
| Over-exposed cards | PASS (none used as specials) |

## 20. Narrator's 12 questions

1 Arrival with graph names: yes, `{actor}` / `{location}`. 2 Events with costs paid: a feud ended, heirs held, men armed, a ransom demanded. 3 One stake shape: choice — the exchange is in {actor}'s hands. 4 ≤80: 77. 5 Read aloud as report: yes. 6 Stated: "will not release them without a ransom." 7 Every sentence works: yes. 8 Nothing unintroduced: captain, heirs, houses, bridge, men in step 0; sergeant in step 1 before its hand. 9 One named person per beat: step 0 {cast:captain}, step 1 {cast:heir}. 10 Stake in a sentence: can {actor} get both heirs across the bridge before the captain's greed starts a fight? 11 Cards verb+noun: Loosen Guarded Tongues, Reveal The Price, Still Ready Blades, Stand As Surety. 12 Opening per class: urban, rural.

## 21. Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES (tongues of those questioned, the captain's demand, the armed men, the mortal's word) · 9 YES (what people say / what the captain hides / the men's hands / trust in the terms) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES · 14 YES.
