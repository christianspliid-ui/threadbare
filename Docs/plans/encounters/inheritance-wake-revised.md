# Encounter Pipeline: The Inheritance Wake
> Scale: medium | Slug: inheritance-wake | Pass: revised (editorial PASS WITH REVISIONS applied)
> Date: 2026-10-01 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-3, slot 2 (THR-1680)

Every edit from `inheritance-wake-editorial.md` (items 1–9 plus the § 6b success_at_cost conflict) is applied inline below. The design block (§ 0) is unchanged from the draft except where noted.

## 0. Mechanical design block

| Row | Decision |
|---|---|
| **Crux** | A widow asks the agent to keep her family whole through a farmer's wake, while the three children quarrel over a farm too small to feed them all. |
| **Title** | *The Inheritance Wake*: an inheritance in dispute, at a wake. |
| **id** | `encounter.town.inheritance_wake` |
| **Reach** | Heart (primary: step 0 and `positive` arm). `negative` arm Gold (brief, binding). |
| **Steps** | heart 0.60 → fork: `positive` heart 0.66 · `negative` gold 0.62. Mean 0.63, window fit 0.77. Roll-spread reads step 0 only (0.60). |
| **Shape** | Personality Fork, `decidedBy: { axis: 'loyalty_ambition' }`, `branchOnStep: 0`. |
| **Value axis** | `loyalty_ambition`, Heart's own (`REACH_VALUE_PAIR.heart`); Sworn/Loyal (+) ↔ Renegade/Disloyal (−). First shipped fork on it. |
| **Fork** | **Sworn (`positive`, also `fallback`)**: keep faith with the widow; hold the eldest to her terms (heart 0.66). **Renegade (`negative`)**: set her wish aside and write a fair split; bring the youngest to sign (gold 0.62). |
| **Dice** | unmitigated_risk · terrain-indifference (the land itself) · bystander_pulled_in · personal. |
| **plotHook** | Rolled hook.stranger_bargain, hook.market_collapse, hook.celestial_sign. **Taken: hook.stranger_bargain**, drifted (the stranger strikes the family's bargain, and the price is whose terms). |
| **Consequence hand** | `relationship` (`bond_change`) + `membership` (`membership_change` join `temple_of_spheres`), no swap. |
| **Standing** | `reputation_with $here` +0.05 win, −0.06 loss, −0.03 step-0 failure. |
| **Systems quota** | cast + rewards (`bond_change`) + reputation + faction = 4. |
| **Trait hooks** | Loyal +0.04 · Disloyal −0.04. |
| **Tier** | rarity 2, local, shaping. No tags. |

## 10. Opening (P1 13 + spine 61 = 74 words)

`openings.rural`:
> {actor} comes to a farm near {location} on the night of a wake.

Step 0 `narrativeTemplate` (P2 + P3):
> The farmer is dead and lies in the barn. His three children are already quarrelling over the land, and the farm is too small to feed all three. His widow, {cast:widow}, asks {actor}, who can calm a room, to keep the family whole through the night.
>
> If it comes to blows tonight, the family will not mend.

## 11. The Hand Per Step

### Step 0: Calm the wake (heart 0.60, `continue_weakened`) · deal `{ count: 4, tags: ['presence', 'social'] }` · `failureMetadata`: `reputation_with $here −0.03`

**Remember The Dead** · `wake.remember_the_dead` · Omen · time · essence 2 · Δ 0.10 · lean `loyalty_ambition` → positive · `generic.memory`
- effectLine: "Fill the room with old memories of the one who died, so tempers cool. Grief for one shared loss pulls a family together."
- success: "The middle child told an old story about the farmer, and the whole barn laughed."
- near_miss: "The old stories quieted the barn, until the last one started the quarrel again."
- failure: "The old stories only reminded each child what they had been promised."

**Stoke Their Pride** · `wake.stoke_their_pride` · Kindled Ambition (special, not the library card) · energy · essence 2 · Δ 0.10 · lean → negative · `generic.energy`
- effectLine: "Fire up a wish to be the one who settles things, so they speak over the noise. Wanting credit, they care less for old wishes."
- critical_success: "{actor} spoke over every voice in the barn, and every voice stopped."
- success_at_cost: "{actor} spoke over the children, and the widow did not like the tone."
- failure: "{actor} spoke loudly, and the children only shouted louder."
- critical_failure: "{actor} spoke over the widow, and the whole barn turned on {actor}."

Afterimages:
- critical_success: "{actor} had the three children sitting together within the hour, and the barn went quiet."
- success: "{actor} calmed the barn, and the children stopped shouting."
- success_at_cost: "{actor} calmed the barn, but only after the middle child walked out into the yard."
- failure: "The shouting stopped when {actor} spoke, and started again when {actor} sat down."
- critical_failure: "The quarrel came to blows beside the coffin, in front of the whole wake."

### Step 1 `positive` (Sworn; also step `fallback`): Keep the farm whole (heart 0.66, `fail_action`) · deal `{ count: 4, tags: ['social', 'lore'] }`

Narrative: "{actor} backs the widow's wish: keep the farm whole under her, and have all three children work it. By custom the whole farm passes to the eldest, {cast:eldest}. {cast:eldest} promised the farmer to look after the others, and now refuses the widow's wish in front of the wake."

**Soften A Hard Heart** · `wake.soften_a_hard_heart` · Balm · life · essence 2 · Δ 0.12 · `generic.warmth`
- effectLine: "Warm the one holding out toward the family, so a kind word lands where an argument would not."
- success: "{cast:eldest} heard the youngest out to the end, and did not interrupt."
- near_miss: "{cast:eldest} softened toward the widow, but not toward the others."
- failure: "{cast:eldest} softened, was ashamed of it, and dug in harder."

**Call The Promise** · `wake.call_the_promise` · Compulsion · order · essence 2 · Δ 0.09 · `generic.oath`
- effectLine: "Make an old vow weigh on whoever gave it, so breaking it before witnesses is hard to do."
- critical_success: "{cast:eldest} spoke the promise aloud and gave up the claim before anyone asked."
- success_at_cost: "{cast:eldest} kept the promise, but asked for the best field in return."
- failure: "{cast:eldest} said the promise was to look after them, not to share with them."
- critical_failure: "{cast:eldest} said the farmer had asked for no promise, and called the widow a liar."

Afterimages:
- critical_success: "{cast:eldest} gave up the claim in front of the wake and shook hands with the youngest."
- success: "{cast:eldest} agreed to the widow's terms and sat back down."
- success_at_cost: "{cast:eldest} agreed to the widow's terms near dawn, after a night of hard words."
- failure: "{cast:eldest} would not give up the claim, and left the wake before the burial."
- critical_failure: "{cast:eldest} left the wake swearing to take the farm by law, and the middle child went too."

`successMetadata`: `bond_change { withAgentId: '$cast:eldest', sentimentDelta: 0.12, trustDelta: 0.15 }`; `membership_change { factionId: 'temple_of_spheres', op: 'join', targetAgentId: '$actor', chronicle: true }`; `reputation_with { targetLocationId: '$here', delta: 0.05 }`.
`failureMetadata`: `reputation_with $here −0.06`; `bond_change { withAgentId: '$cast:eldest', sentimentDelta: -0.12, trustDelta: -0.1 }`.

### Step 1 `negative` (Renegade): Write a fair split (gold 0.62, `fail_action`) · deal `{ count: 4, tags: ['insight', 'social'] }`

Narrative: "{actor} sets the widow's wish aside and offers to settle the land in writing. The eldest would keep the farm whole, and the other two would take written shares of its harvests. The youngest, {cast:youngest}, has old grudges against the eldest and will sign only if the shares are fair."

**Weigh Every Share** · `wake.weigh_every_share` · Boost · matter · essence 2 · Δ 0.12 · `generic.matter`
- effectLine: "Set each sum plain before them, so the parts add up and each party can check them."
- success: "{actor} had every field's yield right, and {cast:youngest} could find no fault in the sums."
- near_miss: "{actor} had the yields right, but the eldest argued every one of them."
- failure: "{actor} had the yields right, and {cast:youngest} still thought the shares were small."

**Dim Old Grudges** · `wake.dim_old_grudges` · Veil · darkness · essence 1 · Δ 0.09 · `generic.dark`
- effectLine: "Dull each person's memory of past slights, so terms are read as terms and never as insults."
- critical_success: "No one raised an old slight all night, and the signing went quickly."
- success_at_cost: "No one raised an old slight, but the widow raised the farmer's wishes instead."
- failure: "The children forgot old slights, and found new ones in the terms."
- critical_failure: "The children forgot old slights, and {cast:youngest} called the terms the worst slight yet."

Afterimages:
- critical_success: "{actor} wrote terms all three children signed before the burial, and {cast:youngest} signed first."
- success: "{actor} wrote fair terms, and all three children signed them."
- success_at_cost: "All three signed by dawn, but only after {actor} cut {cast:youngest}'s share to win the eldest's mark."
- failure: "{cast:youngest} read the terms and would not sign them."
- critical_failure: "{cast:youngest} tore up the terms in front of the wake and said {actor} had sold the share to the eldest."

`successMetadata`: `bond_change { withAgentId: '$cast:youngest', sentimentDelta: 0.12, trustDelta: 0.15 }`; `membership_change` join `temple_of_spheres` for `$actor`; `reputation_with $here +0.05`.
`failureMetadata`: `reputation_with $here −0.06`; `bond_change { withAgentId: '$cast:widow', sentimentDelta: -0.12, trustDelta: -0.1 }`.

### Trait variants
- `trait.personality.heart.virtue` +0.04: "Being Loyal, they know what a family owes its dead."
- `trait.personality.heart.vice` −0.04: "Being Disloyal, they do not much care whose side wins."

## 13. Aftermath

Base overview (both arms): "The farmer's wake is over." Base `changes: []`. `fallback` = Sworn copy.

**Sworn (`positive`)**
- critical_success: "The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together. {cast:widow} has had {actor}'s name put on the parish roll. Everyone at the wake saw {actor} hold that family together."
- success: "The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together. {cast:widow} has had {actor}'s name put on the parish roll."
- success_at_cost: "The farmer is buried, and the farm stays whole under {cast:widow}. {cast:eldest} agreed only at dawn, and the whole wake heard the hard words first. {cast:widow} has had {actor}'s name put on the parish roll."
- failure: "{cast:eldest} still claims the whole farm by custom, and the family is split over it. {actor} was asked because they can calm a room, and this room did not calm."
- critical_failure: "The wake ended in a quarrel no one could stop, and the family stood apart at the burial. The whole village has heard that {actor} was asked to keep the peace, and did not."

**Renegade (`negative`)**
- critical_success: "The farmer is buried, and the farm is settled in writing. The deed gives the eldest the whole farm and gives the other two a written share of its harvests. The parish priest witnessed the deed and put {actor}'s name on the parish roll. The widow did not get her wish. Every neighbour at the wake calls the split fair."
- success: "The farmer is buried, and the farm is settled in writing. The deed gives the eldest the whole farm and gives the other two a written share of its harvests. The parish priest witnessed the deed and put {actor}'s name on the parish roll. {cast:widow} did not get her wish."
- success_at_cost: "The farm is settled in writing, but {cast:youngest}'s share is smaller than it should be. The parish priest witnessed the deed and put {actor}'s name on the parish roll. The widow did not get her wish."
- failure: "No one signed, and the family buried the farmer still quarrelling over the land. {actor} set the widow's wish aside for a deed, and came back without one."
- critical_failure: as Sworn.

**Chips** (scar · bond · boon · path). No `causeClause` anywhere.
- Sworn success bands: BOND `reputation with {target}` @ `$cast:eldest` (agent) "{cast:eldest} trusts {actor} after that night." · BOND `a membership` @ `$faction:temple_of_spheres` "{actor} is a member of the Temple of the Spheres." · BOON `reputation with {target}` @ `$here` "The village thinks better of {actor}."
- Renegade success bands: BOND @ `$cast:youngest` "{cast:youngest} trusts {actor} more." · BOND membership (as above) · BOON village (as above).
- Sworn failure: SCAR village "The village thinks less of {actor} as a peacemaker." · BOND (loss) @ `$cast:eldest` "{cast:eldest} trusts {actor} less, for taking the widow's side."
- Renegade failure: SCAR village (as above) · BOND (loss) @ `$cast:widow` "{cast:widow} trusts {actor} less."
- Both critical_failure: SCAR village only.

**Reactions** (success-side bands, medium scale)
- Sworn. **Sit with the widow** — "Stay beside the widow at the grave. The widow will think better of the mortal." → `reputation_with { targetAgentId: '$cast:widow', delta: 0.1 }`. **Walk the fields with the eldest** — "Spend the morning with the one who gave up the most. The eldest will trust the mortal more." → `bond_change { withAgentId: '$cast:eldest', sentimentDelta: 0.1, trustDelta: 0.05 }`.
- Renegade. **Make peace with the widow** — "Sit with the widow and explain the split. The widow will think better of the mortal." → `reputation_with $cast:widow +0.1`. **Stand by the youngest** — "Stand beside the youngest at the grave, where the eldest can see it. The youngest will trust the mortal more." → `bond_change $cast:youngest` +0.1 / +0.05.

## 14. Support bundle

| key | delivery | spawn | supportRole | persistence |
|---|---|---|---|---|
| `widow` | lazy-materialize-on-trigger | `elder` "Edda Corran" (spawn-only) | `widow` | must-persist |
| `eldest` | lazy-materialize-on-trigger | `steward` "Bram Corran" (spawn-only) | `eldest_heir` | must-persist |
| `youngest` | lazy-materialize-on-trigger | `weaver` "Wenna Corran" (spawn-only) | `youngest_heir` | must-persist |

Spawn-only on all three: a reused local would be some villager standing in for the dead farmer's kin.

## narrativeTemplates
- initiation: "A widow asks a stranger who can calm a room to keep her family whole through a wake."
- success: "The stranger kept the peace at a farmer's wake."
- failure: "The stranger could not keep the peace at a farmer's wake, and their name suffered for it."

## 16. Concept Art Direction

A barn at night: a plain coffin on trestles, a long table with three chairs pushed back at different angles, a lamp, and a half-written sheet of terms. No people.

## Self-audit (post-revision)

Opening 74 words · skeleton held · one named person per beat (widow · eldest · youngest) · 2 specials + deal on all three nudge-bearing steps · six outcomes covered per pair · no Δ ≥ 0.15 · lexicon verbs: remember, stoke, soften, call, weigh, dim · no effect line repeats a name word · specials' spheres time, energy, life, order, matter, darkness · annotation clauses: 0 · outcome-class vagueness: 0 by read · consequence hand wired on both arms · nobody killed, jailed or branded · the wake ends warm on its success side.
