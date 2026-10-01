# Encounter Pipeline: The Inheritance Wake
> Scale: medium | Slug: inheritance-wake | Pass: final
> Date: 2026-10-01 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-3, slot 2 (THR-1680)
> Status: **READY FOR IMPLEMENTATION** (with caveats)

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Personality Fork on `loyalty_ambition` (Heart's own axis; first shipped fork on it). Calm the wake (heart 0.60), then Sworn holds the eldest to the widow's terms (heart 0.66) or Renegade writes a fair split the youngest must sign (gold 0.62). `relationship` + `membership` wired on both arms. |
| Editorial | PASS WITH REVISIONS | Nine local fixes: a false "sent for" premise in three overviews; a harvest-payment promise with no enacting effect (trigger 34); a self-contradicting Sworn narrative; an ungrounded Dim Old Grudges; scene prose on three card faces (Weigh The Harvest renamed Weigh Every Share); `way` in an outcome field; one not-but clause; four page repetitions or conflicts; and a membership chip with no prose behind it. |
| Systems | READY WITH CAVEATS | One real defect fixed: a loss `bond_change` on a fresh edge cannot lower trust below zero (`clamp01`), so the loss chips named an unchanged reputation. Each loss now writes `reputation_with` on the person, plus a sentiment-only bond. One echo fixed in the Sworn narrative. The opening is recounted at 70 words. |
| Package | PACKAGE PASS (connected) | 36 chips anchored; no fold or bind. An in-memory run of the `check:encounter` gate functions found one `[page]` overlap ("at the grave the"): the Sworn reaction "Sit with the widow" intent now reads "through the burial". The re-run is clean: 0 violations, 0 warnings. |

### Caveats

`already_member` no-op for a mortal already in the Temple (the same exposure as well-sinking). Off-reach Renegade arm (gold 0.62 on a Heart expert; brief-bound, `shaping`). Roll-spread reads step 0 only. Dealt-hand sphere spread is owed at the live proof. Card types (Omen, Kindled Ambition, Balm, Compulsion, Boost, Veil) live only in design comments.

### Implementation File Map

`Docs/plans/encounters/inheritance-wake.package.json` → `compile:encounter`. No engine, type, UI or art change.

---

## Encounter Packet

## 0. Mechanical design block

| Row | Decision |
|---|---|
| **Crux** | A widow asks the agent to keep her family whole through a farmer's wake, while the three children quarrel over a farm too small to feed them all. |
| **Title** | *The Inheritance Wake*. Glance test: an inheritance in dispute, at a wake. |
| **id** | `encounter.town.inheritance_wake` (binding) |
| **Reach** | Heart (primary: step 0 and the `positive` arm). The `negative` arm is Gold (brief). |
| **Steps** | heart 0.60 (`continue_weakened`) → fork: `positive` heart 0.66 · `negative` gold 0.62 (both `fail_action`). Mean 0.63, window fit 0.77. |
| **Shape** | Personality Fork: `branchOnStep: 0`, `decidedBy: { axis: 'loyalty_ambition' }`. |
| **Value axis (verified)** | `loyalty_ambition`: `ValuePair` (`src/types/agent.ts:14`) = `REACH_VALUE_PAIR.heart` (`agent.ts:49`) = `heart_axis` in `src/types/axisRegistry.ts` (Sworn/Loyal ↔ Renegade/Disloyal). **positive = Sworn**: keep faith with the widow who asked. **negative = Renegade**: set her wish aside for the deed. |
| **System target** | Cards (packet). |
| **Dice** | p3 unmitigated_risk · opposition terrain-indifference (the land itself: too small to feed three) · agentRole bystander_pulled_in (the widow's ask lands it on the agent; every outcome is the agent's) · scale personal. |
| **plotHook** | Rolled hook.stranger_bargain, hook.market_collapse, hook.celestial_sign. **Taken: hook.stranger_bargain**, drifted. |
| **Consequence hand** | `relationship` + `membership`, no swap. relationship: `bond_change` (win: eldest / youngest; loss: sentiment on eldest / widow). membership: `membership_change` join `temple_of_spheres` (the local congregation is the parish) on both wins. |
| **Standing** | `reputation_with $here` +0.05 win / −0.06 loss / −0.03 step-0 failure. Person standing −0.08 on each loss (eldest / widow). |
| **Cool failure** | No death, jail or brand. A split family, a lost name as a peacemaker. |
| **Systems quota** | cast (3) + rewards (`bond_change`) + reputation + faction = 4. |
| **Trait hooks** | Loyal (`trait.personality.heart.virtue`) +0.04 · Disloyal (`.vice`) −0.04. |
| **Mortal choice** | `motivations: ['loyalty_ambition', 'tradition_novelty']`. |
| **Prose rule 7 / 7b** | Farmer, farm, custom, promise, deed and parish priest are scene-local. "who can calm a room" reads the draw. No forward promise without an effect: the deed's terms are stated as the deed's present content; "put {actor}'s name on the parish roll" is backed by `membership_change`. |
| **Tier** | rarity 2 · local · shaping · no tags. |

## 10. Opening (P1 13 + spine 57 = 70 words)

`openings.rural`:
> {actor} comes to a farm near {location} on the night of a wake.

Step 0 `narrativeTemplate`:
> The farmer is dead and lies in the barn. His three children are already quarrelling over the land, and the farm is too small to feed all three. His widow, {cast:widow}, asks {actor}, who can calm a room, to keep the family whole through the night.
>
> If it comes to blows tonight, the family will not mend.

## 11. The Hand Per Step

### Step 0: Calm the wake (heart 0.60) · `purposeLine: 'Calm the wake'` · deal `{ count: 4, tags: ['presence', 'social'] }` · `failureMetadata`: `reputation_with { targetLocationId: '$here', delta: -0.03 }`

**Remember The Dead** · `wake.remember_the_dead` · Omen · time · essence 2 · Δ 0.10 · `poleLean: { axis: 'loyalty_ambition', toward: 'positive' }` · `generic.memory`
- effectLine: "Fill the room with old memories of the one who died, so tempers cool. Grief for one shared loss pulls a family together."
- success: "The middle child told an old story about the farmer, and the whole barn laughed."
- near_miss: "The old stories quieted the barn, until the last one started the quarrel again."
- failure: "The old stories only reminded each child what they had been promised."

**Stoke Their Pride** · `wake.stoke_their_pride` · Kindled Ambition (special) · energy · essence 2 · Δ 0.10 · `poleLean: { axis: 'loyalty_ambition', toward: 'negative' }` · `generic.energy`
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

### Step 1 `positive` (Sworn; also step `fallback`): Keep the farm whole (heart 0.66) · `purposeLine: 'Keep the farm whole'` · deal `{ count: 4, tags: ['social', 'lore'] }`

Narrative: "{actor} backs the widow's wish: keep the farm whole under her, and have all three children work it. By custom the whole farm passes to the eldest, {cast:eldest}, who promised the farmer to look after the others and now refuses the widow's wish in front of the wake."

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

### Step 1 `negative` (Renegade): Write a fair split (gold 0.62) · `purposeLine: 'Write a fair split'` · deal `{ count: 4, tags: ['insight', 'social'] }`

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

### Step effects

| Site | `successMetadata.effects` | `failureMetadata.effects` |
|---|---|---|
| step 0 | none | `reputation_with $here −0.03` |
| `positive` + `fallback` | `bond_change { withAgentId: '$cast:eldest', sentimentDelta: 0.12, trustDelta: 0.15 }`; `membership_change { factionId: 'temple_of_spheres', op: 'join', targetAgentId: '$actor', chronicle: true }`; `reputation_with $here +0.05` | `reputation_with $here −0.06`; `reputation_with { targetAgentId: '$cast:eldest', delta: -0.08 }`; `bond_change { withAgentId: '$cast:eldest', sentimentDelta: -0.12 }` |
| `negative` | `bond_change { withAgentId: '$cast:youngest', sentimentDelta: 0.12, trustDelta: 0.15 }`; `membership_change` (as above); `reputation_with $here +0.05` | `reputation_with $here −0.06`; `reputation_with { targetAgentId: '$cast:widow', delta: -0.08 }`; `bond_change { withAgentId: '$cast:widow', sentimentDelta: -0.12 }` |

### Trait variants
- `trait.personality.heart.virtue`, +0.04: "Being Loyal, they know what a family owes its dead."
- `trait.personality.heart.vice`, −0.04: "Being Disloyal, they do not much care whose side wins."

## 13. Aftermath

`branchOnStep: 0`. Base overview both arms: "The farmer's wake is over." Base `changes: []`. `fallback` = Sworn copy.

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

**Chips** (scar · bond · boon · path; no `causeClause`):

| Faces | Chip | kind / category / direction | stateNoun | concepts | detail |
|---|---|---|---|---|---|
| Sworn wins | eldest | `reputation` / `bond` / gain | `reputation with {target}`, `$cast:eldest`, agent, `ui.reputation_with` | "trusts" → `ui.standing` | "{cast:eldest} trusts {actor} after that night." |
| Renegade wins | youngest | same | `$cast:youngest` | "trusts" | "{cast:youngest} trusts {actor} more." |
| all wins | membership | `faction_reputation` / `bond` / gain | `a membership`, `$faction:temple_of_spheres`, faction, `ui.faction_member` | "the Temple of the Spheres" → `$faction:temple_of_spheres`, faction | "{actor} is a member of the Temple of the Spheres." |
| all wins | village | `reputation` / `boon` / gain | `reputation with {target}`, `$here`, location, `ui.reputation_with` | "thinks better of" → `ui.standing` | "The village thinks better of {actor}." |
| all failure + crit-fail | village | `reputation` / `scar` / loss | as above | "thinks less of" → `ui.standing` | "The village thinks less of {actor} as a peacemaker." |
| Sworn failure | eldest | `reputation` / `bond` / loss | `$cast:eldest` | "trusts" | "{cast:eldest} trusts {actor} less, for taking the widow's side." |
| Renegade failure | widow | `reputation` / `bond` / loss | `$cast:widow` | "trusts" | "{cast:widow} trusts {actor} less." |

## 14. Reactions (success-side bands)

- Sworn. **Sit with the widow**: "Stay beside the widow through the burial. The widow will think better of the mortal." → `reputation_with { targetAgentId: '$cast:widow', delta: 0.1 }`. **Walk the fields with the eldest**: "Spend the morning with the one who gave up the most. The eldest will trust the mortal more." → `bond_change { withAgentId: '$cast:eldest', sentimentDelta: 0.1, trustDelta: 0.05 }`.
- Renegade. **Make peace with the widow**: "Sit with the widow and explain the split. The widow will think better of the mortal." → `reputation_with $cast:widow +0.1`. **Stand by the youngest**: "Stand beside the youngest at the grave, where the eldest can see it. The youngest will trust the mortal more." → `bond_change { withAgentId: '$cast:youngest', sentimentDelta: 0.1, trustDelta: 0.05 }`.

## 16. Support Bundle

| key | delivery | spawn (spawn-only) | supportRole | persistence |
|---|---|---|---|---|
| `widow` | lazy-materialize-on-trigger | `elder` "Edda Corran" | `widow` | must-persist |
| `eldest` | lazy-materialize-on-trigger | `steward` "Bram Corran" | `eldest_heir` | must-persist |
| `youngest` | lazy-materialize-on-trigger | `weaver` "Wenna Corran" | `youngest_heir` | must-persist |

## narrativeTemplates
- initiation: "A widow asks a stranger who can calm a room to keep her family whole through a wake."
- success: "The stranger kept the peace at a farmer's wake."
- failure: "The stranger could not keep the peace at a farmer's wake, and their name suffered for it."

## 18. Concept Art Direction

A barn at night: a plain coffin on trestles, a long table with three chairs pushed back at different angles, a lamp, and a half-written sheet of terms. No people.

## Narrator's checklist evidence (for the package doc block)

P1 arrival with `{location}` · P2 events with costs paid (a death; a quarrel already begun; land too small) · P3 one stake, unmitigated risk · one named person per beat · no interior sensation · no numerals · no second person · the god never authors a result · annotation clauses 0 · outcome-class vagueness 0 by read.
