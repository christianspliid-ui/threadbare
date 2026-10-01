# Encounter Pipeline: The Inheritance Wake
> Scale: medium | Slug: inheritance-wake | Pass: draft
> Date: 2026-10-01 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-3, slot 2 (THR-1680)

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| **Crux** | A widow asks the agent to keep her family whole through a farmer's wake, while the three children quarrel over a farm too small to feed them all. |
| **Title** | *The Inheritance Wake*. Glance test: an inheritance (who gets the land) and a wake (a family gathered over a death) are both in the title. |
| **id** | `encounter.town.inheritance_wake` (binding, brief row 2) |
| **Reach** | Heart (binding; primary by `primaryReachOf`: step 0 and the `positive` arm are Heart). Step 0 is *about* calming a grieving room. The `positive` arm is *about* holding one person to a family promise. The `negative` arm is Gold (brief, binding): pricing a farm into fair written shares. |
| **Steps** | Step 0 heart 0.60 → fork: `positive` heart 0.66 · `negative` gold 0.62. Mean 0.63, window fit 0.77 (expert band 0.65–0.85). Measurement note as toll-gate-writ: the fork step has no top-level difficulty, so `measure:roll-spread` reads step 0 only (0.60). |
| **Shape** | Personality Fork (brief override from the rolled appointment; reason in the brief). A test, then an agent-decided branch (THR-894). |
| **System target** | Cards (packet roll). The fork is the shape. `decidedBy: { axis: 'loyalty_ambition' }` on step 1, `branchOnStep: 0`. |
| **Value axis (verified)** | `loyalty_ambition` is a live `ValuePair` (`src/types/agent.ts:14`) and Heart's own axis (`REACH_VALUE_PAIR.heart`, `src/types/agent.ts:49`; `src/types/axisRegistry.ts` → `heart_axis`, Sworn/Loyal ↔ Renegade/Disloyal). Legacy pole names Sworn (+1) / Renegade (−1). No shipped fork uses it yet (shipped forks: `revelation_discretion`, `tradition_novelty`, `honesty_cunning`, `courage_prudence`, `sacrifice_survival`, `asceticism_extravagance`, `mercy_ruthlessness`). |
| **The fork** | **Sworn (`positive`)**: the agent keeps faith with the widow who asked. The farm stays whole under her, and the three children work it together. The eldest, heir by custom, must be held to it (heart 0.66). **Renegade (`negative`)**: the agent sets the widow's wish aside and settles the land in writing by a fair split, the eldest keeping the farm and the others holding shares. The youngest must be brought to sign (gold 0.62). Step 0's two specials carry opposite pole leans. |
| **Rolled dice** | p3Shape **unmitigated_risk** (P3: if it comes to blows tonight the family will not mend; nobody else can stop it) · opposition **terrain (indifference)**, read per the brief as the land itself: the farm cannot be split three ways and still feed anyone · agentRole **bystander_pulled_in** (the agent is at the wake and the widow pulls them in; justified per trigger 24 because the problem lands on the agent the moment she asks, and every outcome is the agent's) · scale **personal**. |
| **plotHook** | Rolled: hook.stranger_bargain, hook.market_collapse, hook.celestial_sign. **Taken: hook.stranger_bargain**, drifted: a stranger is asked to strike the bargain that holds a family together, and the price of the bargain is whose terms it is struck on. Market collapse would have made grain prices the story; a celestial sign would have needed an omen the brief does not allow on this slot's hand. |
| **Whose problem?** | The agent's, from the widow's ask on. Whatever they settle, their name is on the settling. |
| **Why here?** | `chance`: the agent comes to the farm on the night of the wake. |
| **Consequence hand (binding)** | `npm run draw:consequences -- encounter.town.inheritance_wake --reach heart --rarity 2` → **`relationship` (`bond_change`) + `membership` (`membership_change`)**, no swap. **relationship**: `bond_change` on both arms, both directions. Sworn win: with `$cast:eldest` (+). Sworn loss: with `$cast:eldest` (−). Renegade win: with `$cast:youngest` (+). Renegade loss: with `$cast:widow` (−). **membership**: `membership_change` `join` `temple_of_spheres` for `$actor` on both arms' success half; the local Temple congregation is the parish (`resolveFactionNodeId` picks the nearest chapter, `src/engine/factionMembership.ts:105`). |
| **Standing** | `reputation_with $here`: +0.05 both arms' success; −0.06 both arms' failure; −0.03 on step-0 failure (backs the step-0 crit-fail SCAR). Reputation before money: the expert penalty. |
| **Cool failure?** | Nobody killed, jailed or branded. A family splits, an heir walks out, and the village thinks less of a peacemaker who could not keep the peace. |
| **Systems quota** | cast (`widow`, `eldest`, `youngest`) + rewards (`bond_change`, persistent) + reputation (`reputation_with`) + faction (`membership_change`) = four, over the floor of three. |
| **Trait hooks** | Gate: none. Variant: **Loyal** (`trait.personality.heart.virtue`) +0.04; **Disloyal** (`trait.personality.heart.vice`) −0.04. Trait-only nudge: none (both special slots per step spent). Trait fragment: none. |
| **Mortal choice?** | Yes, on `loyalty_ambition`. `motivations: ['loyalty_ambition', 'tradition_novelty']`: the fork's axis unpinned, plus custom against writing. |
| **Promise → payoff** | The spine states the quarrel and the stake (blows tonight). Step 0 pays off whether the room calms. Each arm pays off whose terms the land is settled on. |
| **Prose rule 7 / 7b** | The farmer, the farm, the custom, the promise and the parish priest are scene-local. "who can calm a room" reads the draw (expert-band Heart). Forward sentences: see § 13. |
| **Tier** | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'`. |
| **Tags** | None authored. |

## 1. Inspiration Anchors

- **hook.stranger_bargain** (taken, drifted): the stranger who strikes a bargain. Here the bargain is between the family and itself, and the stranger chooses whose terms.
- **Thematic Pillars, Compassion vs Power**: the widow's wish (compassion) against a fair written split (the power of a deed). Neither is wrong.
- **Anti-Patterns avoided**: villain heir (the eldest has custom on their side and a promise on their back); Player as Savior (the god leans the room; the mortal decides); failure as punishment.
- **Seed dice**: terrain-indifference read as the land itself. A farm that cannot feed three is what makes both arms cost something.

## 2. Scale Justification

Medium: a calming test, then a pole-specific settling, then an aftermath where the player chooses whom the mortal stands beside. A third beat (the burial, the first harvest) restages what the aftermath carries.

## 3. Pressure Knot

A farmer has died. By custom the whole farm passes to the eldest child. The farm is too small to feed three households. The eldest promised the farmer to look after the others; the youngest wants a fair share; the widow wants the farm kept whole and all three working it, as their father did.

## 4. Intervention Fantasy

The god works memory, pride, warmth, oaths, sums and grudges. It fills a barn with old stories, stokes a stranger's wish to be the one who ends a quarrel, softens a hard heir, makes an old promise weigh, sets a field's yield plain, and dulls old slights. It leans the mortal toward the widow or toward the deed, and never makes the choice.

## 5. Cast and World Objects

| Object | What | Binding |
|---|---|---|
| `{cast:widow}` | the farmer's widow, who asks | `supportBundle` actor, spawn-only `elder` "Edda Corran", must-persist (reaction `reputation_with` target; Renegade-loss `bond_change`) |
| `{cast:eldest}` | the eldest child, heir by custom | spawn-only `steward` "Bram Corran", must-persist (`bond_change` both directions) |
| `{cast:youngest}` | the youngest child, who wants a fair share | spawn-only `weaver` "Wenna Corran", must-persist (`bond_change`) |
| the middle child | sides with whoever spoke last | scene-local, unnamed |
| the farmer | dead, in the barn | scene-local |
| the farm | too small for three | scene-local |
| the parish / Temple of the Spheres | the local congregation | `membership_change` `temple_of_spheres` (real faction, congregations seeded per culture) |
| `{location}` / `$here` | the village | `reputation_with` anchor |

## 6. Beat Structure

1. **Step 0: Calm the wake** (heart 0.60, `continue_weakened`). Specials: Remember The Dead (lean +), Stoke Their Pride (lean −); deal 4 (`presence`, `social`). `failureMetadata`: `reputation_with $here −0.03`.
2. **Step 1**, forked on `loyalty_ambition` (`branchOnStep: 0`):
   - `positive` (Sworn, and the step `fallback`): **Keep the farm whole** (heart 0.66, `fail_action`). Specials: Soften A Hard Heart, Call The Promise; deal 4 (`social`, `lore`).
   - `negative` (Renegade): **Write a fair split** (gold 0.62, `fail_action`). Specials: Weigh The Harvest, Dim Old Grudges; deal 4 (`insight`, `social`).

## 7. Branching Profile

- Branch depth `light` · count **2** · Personality Fork (agent-decided).
- Branching lives in step-1 prose, hand and reach, the outcome ladder, the aftermath and the reactions.
- Convergence: both wins end with the farmer buried, the land settled, a bond with one child, and the agent on the parish roll. Both losses end with the village thinking less of the agent.

## 8. Branching Map

Step 0 resolves. The engine reads the agent's `loyalty_ambition` plus the committed step-0 cards' net pole lean and records `positive` or `negative`. A step-0 `critical_failure` ends the action at the recorded arm's `critical_failure` band.

- `positive` → the agent backs the widow; the eldest must be held to it. Win: eldest bond +, parish roll, village +. Loss: eldest bond −, village −.
- `negative` → the agent writes a split; the youngest must sign. Win: youngest bond +, parish roll (witness to the deed), village +. Loss: widow bond −, village −.

## 9. Outcome Ladder

| Band | Sworn | Renegade |
|---|---|---|
| critical_success | the eldest gives up the claim before the wake | all three sign before the burial |
| success | the eldest agrees | all three sign |
| success_at_cost | the eldest agrees at dawn after hard words | all three sign, the youngest's share cut to win the eldest |
| failure | the eldest walks out | the youngest will not sign |
| critical_failure | the eldest leaves swearing to take the farm by law | the youngest tears up the terms |

## 10. Sample Opening (≤80 words: P1 13 + spine 61 = 74)

> {actor} comes to a farm near {location} on the night of a wake.
>
> The farmer is dead and lies in the barn. His three children are already quarrelling over the land, and the farm is too small to feed all three. His widow, {cast:widow}, asks {actor}, who can calm a room, to keep the family whole through the night.
>
> If it comes to blows tonight, the family will not mend.

## 11. The Hand Per Step

### Step 0: Calm the wake (heart 0.60) · deal `{ count: 4, tags: ['presence', 'social'] }`

**Remember The Dead**: `wake.remember_the_dead` · type Omen · sphere time · essence 2 · Δ 0.10 · `poleLean: { axis: 'loyalty_ambition', toward: 'positive' }` · image `generic.memory`
- effectLine: "Fill the room with old memories of the one who died, so tempers cool. Grief for one shared loss pulls a family together."
- success: "The middle child told an old story about the farmer, and the whole barn laughed."
- near_miss: "The old stories quieted the barn, until the last one started the quarrel again."
- failure: "The old stories only reminded each child what they had been promised."

**Stoke Their Pride**: `wake.stoke_their_pride` · type Kindled Ambition · sphere energy · essence 2 · Δ 0.10 · `poleLean: { axis: 'loyalty_ambition', toward: 'negative' }` · image `generic.energy`
- effectLine: "Fire up a wish to end the quarrel themselves, so they speak over the noise. Wanting credit, they care less for old wishes."
- critical_success: "{actor} spoke over every voice in the barn, and every voice stopped."
- success_at_cost: "{actor} spoke over the children, and the widow did not like the tone."
- failure: "{actor} spoke loudly, and the children only shouted louder."
- critical_failure: "{actor} spoke over the widow, and the whole barn turned on {actor}."

Afterimages:
- critical: "{actor} had the three children sitting together within the hour, and the barn went quiet."
- success: "{actor} calmed the barn, and the children stopped shouting."
- success_at_cost: "{actor} calmed the barn, but only after the middle child walked out into the yard."
- failure: "The shouting stopped when {actor} spoke, and started again when {actor} sat down."
- critical_failure: "The quarrel came to blows beside the coffin, in front of the whole wake."

### Step 1 `positive` (Sworn; also `fallback`): Keep the farm whole (heart 0.66) · deal `{ count: 4, tags: ['social', 'lore'] }`

Narrative: "{actor} backs the widow. The farm stays whole under her while she lives, and all three children work it together. By custom the whole farm was the eldest's. {cast:eldest} promised the farmer to look after the others, and now refuses the widow's terms in front of the wake."

**Soften A Hard Heart**: `wake.soften_a_hard_heart` · type Balm · sphere life · essence 2 · Δ 0.12 · image `generic.warmth`
- effectLine: "Warm the one holding out toward the family, so a kind word lands where an argument would not."
- success: "{cast:eldest} heard the youngest out to the end, and did not interrupt."
- near_miss: "{cast:eldest} softened toward the widow, but not toward the others."
- failure: "{cast:eldest} softened, was ashamed of it, and dug in harder."

**Call The Promise**: `wake.call_the_promise` · type Compulsion · sphere order · essence 2 · Δ 0.09 · image `generic.oath`
- effectLine: "Make an old vow weigh on whoever gave it, so breaking it before witnesses is hard to do."
- critical_success: "{cast:eldest} spoke the promise aloud and gave up the claim before anyone asked."
- success_at_cost: "{cast:eldest} kept the promise, but asked for the best field in return."
- failure: "{cast:eldest} said the promise was to look after them, not to share with them."
- critical_failure: "{cast:eldest} said the farmer had asked for no promise, and called the widow a liar."

Afterimages:
- critical: "{cast:eldest} gave up the claim in front of the wake and shook hands with the youngest."
- success: "{cast:eldest} agreed to the widow's terms and sat back down."
- success_at_cost: "{cast:eldest} agreed to the widow's terms near dawn, after a night of hard words."
- failure: "{cast:eldest} would not give up the claim, and left the wake before the burial."
- critical_failure: "{cast:eldest} left the wake swearing to take the farm by law, and the middle child went too."

### Step 1 `negative` (Renegade): Write a fair split (gold 0.62) · deal `{ count: 4, tags: ['insight', 'social'] }`

Narrative: "{actor} sets the widow's wish aside and offers to settle the land in writing. The eldest keeps the farm whole and pays the other two their shares from every harvest. The youngest, {cast:youngest}, will sign only if the shares are fair."

**Weigh The Harvest**: `wake.weigh_the_harvest` · type Boost · sphere matter · essence 2 · Δ 0.12 · image `generic.matter`
- effectLine: "Set each field's yield plain before them, so every share adds up and each child can check it."
- success: "{actor} had every field's yield right, and {cast:youngest} could find no fault in the sums."
- near_miss: "{actor} had the yields right, but the eldest argued every one of them."
- failure: "{actor} had the yields right, and {cast:youngest} still thought the shares were small."

**Dim Old Grudges**: `wake.dim_old_grudges` · type Veil · sphere darkness · essence 1 · Δ 0.09 · image `generic.dark`
- effectLine: "Dull each child's memory of past slights, so the terms are read as terms and never as insults."
- critical_success: "No one raised an old slight all night, and {cast:youngest} signed first."
- success_at_cost: "No one raised an old slight, but the widow raised the farmer's wishes instead."
- failure: "The children forgot old slights, and found new ones in the terms."
- critical_failure: "The children forgot old slights, and {cast:youngest} called the terms the worst slight yet."

Afterimages:
- critical: "{actor} wrote terms all three children signed before the burial, and {cast:youngest} signed first."
- success: "{actor} wrote fair terms, and all three children signed them."
- success_at_cost: "All three signed by dawn, but only after {actor} cut {cast:youngest}'s share to win the eldest's mark."
- failure: "{cast:youngest} read the terms and would not sign them."
- critical_failure: "{cast:youngest} tore up the terms in front of the wake and said {actor} had sold the share to the eldest."

## 12. Branch-Dependent Later Paragraphs

The step-1 narratives above.

## 13. Aftermath (overviews per arm per band, chips, reactions)

`branchOnStep: 0`. `fallback` = Sworn copy. Base overview both arms: "The wake is over, and the land is settled one way or another." Base `changes: []`.

**Sworn (`positive`)**
- critical_success: "The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together. Everyone at the wake saw {actor} hold that family together."
- success: "The farmer is buried with all three children at the grave. The farm stays whole under {cast:widow}, and the children have agreed to work it together."
- success_at_cost: "The farmer is buried, and the farm stays whole under {cast:widow}. {cast:eldest} agreed only at dawn, and has not forgiven the others for the night."
- failure: "{cast:eldest} left before the burial and means to claim the farm by custom. The widow sent for a peacemaker, and the peacemaker could not keep the eldest at the table."
- critical_failure: "The wake ended in a quarrel no one could stop, and the family stood apart at the burial. The whole village has heard that {actor} was sent for to keep the peace, and did not."

**Renegade (`negative`)**
- critical_success: "The farmer is buried, and the farm is settled in writing. The eldest keeps it whole and pays the other two their shares from every harvest. The widow did not get her wish, but every neighbour at the wake calls the split fair."
- success: "The farmer is buried, and the farm is settled in writing. The eldest keeps it whole and pays the other two their shares from every harvest. {cast:widow} did not get her wish."
- success_at_cost: "The farm is settled in writing, but {cast:youngest}'s share is smaller than it should be. The widow did not get her wish."
- failure: "No one signed, and the family buried the farmer still quarrelling over the land. {actor} set aside the widow's wish to write the split, and has neither the split nor the widow's trust to show for it."
- critical_failure: as Sworn critical_failure.

**Chips** (scar · bond · boon · path):
- Sworn success bands: BOND · `reputation with {target}` on `$cast:eldest` ("{cast:eldest} trusts {actor} after that night.") ← `bond_change $cast:eldest` (sentiment +0.12, trust +0.15); BOND · `a membership` on `$faction:temple_of_spheres`, causeClause "Put forward by {cast:widow}", detail "{actor} is on the roll of the Temple of the Spheres." ← `membership_change join`; BOON · `reputation with {target}` on `$here` ("The village thinks well of {actor}'s work at the wake.") ← `reputation_with $here +0.05`.
- Renegade success bands: BOND · youngest ("{cast:youngest} trusts {actor} for a fair share.") ← `bond_change $cast:youngest`; BOND · membership, causeClause "Witness to the deed"; BOON · village.
- Sworn failure: SCAR · village ("The village thinks less of {actor} as a peacemaker."); BOND loss · eldest ("{cast:eldest} blames {actor} for taking the widow's side.") ← `bond_change $cast:eldest` (−0.12 / −0.1).
- Renegade failure: SCAR · village; BOND loss · widow ("{cast:widow} trusts {actor} less for setting her wish aside.") ← `bond_change $cast:widow`.
- Both critical_failure: SCAR · village only (step-0 crit-fail route fires only step 0's −0.03).

**Reactions** (success-side bands):
- Sworn: **Sit with the widow** ("Stay beside the widow at the grave. The widow will think better of the mortal." → `reputation_with $cast:widow +0.1`) · **Walk the fields with the eldest** ("Spend the morning with the one who gave up the most. The eldest will trust the mortal more." → `bond_change $cast:eldest` sentiment +0.1, trust +0.05).
- Renegade: **Make peace with the widow** ("Sit with the widow and explain the split. The widow will think better of the mortal." → `reputation_with $cast:widow +0.1`) · **Stand by the youngest** ("Stand beside the youngest at the grave, where the eldest can see it. The youngest will trust the mortal more." → `bond_change $cast:youngest` +0.1 / +0.05).

## 14. Support Bundle Contract

| Object | Delivery | Source | Persistence | Status |
|---|---|---|---|---|
| `widow` | lazy-materialize-on-trigger | spawn `elder` "Edda Corran", `supportRole: 'widow'` | must-persist | ready |
| `eldest` | lazy-materialize-on-trigger | spawn `steward` "Bram Corran", `supportRole: 'eldest_heir'` | must-persist | ready |
| `youngest` | lazy-materialize-on-trigger | spawn `weaver` "Wenna Corran", `supportRole: 'youngest_heir'` | must-persist | ready |
| parish membership | effect write | `membership_change` `temple_of_spheres` | must-persist edge | ready |

## 15. Self-Audit

| Item | Verdict |
|---|---|
| Envelope `rural`, one opening | PASS |
| Opening ≤80 words | PASS (74) |
| Skeleton P1/P2/P3, one stake (unmitigated risk) | PASS |
| One named person per beat (step 0 widow; Sworn eldest; Renegade youngest) | PASS |
| 2 specials + deal on every nudge-bearing step | PASS |
| Six outcomes covered per step by the special pair | PASS |
| Every special has a failure fragment; no Δ ≥ 0.15 | PASS (max 0.12) |
| Names imperative verb + noun (remember, stoke, soften, call, weigh, dim all in `IMPERATIVE_VERB_LEXICON`) | PASS |
| Specials' spheres: time, energy, life, order, matter, darkness | PASS |
| Consequence hand wired (relationship + membership) | PASS |
| Law 56 | PASS (see chips) |
| Nobody killed, jailed or branded | PASS |

## 16. Concept Art Direction

- **Emotions:** grief pulled two ways; a family on the edge of breaking.
- **Image:** a barn at night, a plain coffin on trestles, a long table with three chairs pushed back at different angles, a lamp, and a sheet of paper half-written. No people.

## Experience Differentiator Gate

1. YES (skeleton, 74 words). 2. YES. 3. YES (widow, children, farm, promise before their cards). 4. YES: "A stranger at a wake must keep a family from breaking over the land: on the widow's terms, or by a written split."
5. YES. 6. YES. 7. YES. 8. YES. 9. YES (memory vs pride; warmth vs oath; sums vs grudges). 9b. YES.
10. YES. 11. YES. 11b. Not yet read as pages (editorial). 12. YES. 13. YES. 14. YES.
