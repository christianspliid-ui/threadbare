# Encounter Pipeline: The Mason's Commission
> Scale: short (local) | Slug: masons-commission | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.masons_commission` · Batch: journeyman-everyday-1, slot 6 (THR-1676) · Package: `Docs/plans/encounters/masons-commission.package.json`

## 1. Inspiration Anchors

- **Plot hook taken: `hook.environmental_gauntlet`** — "the country itself is the threat". Here the country is the town's own ground: old rubble fill under the site that nobody warned the masons about. The rival mason is the secondary problem, as the hook asks. The other two rolled hooks were set aside: `compassionate_liberation` has nothing to free in a letting, and `impossible_bargain` would make the commission a moral trade rather than a craft test.
- **Seed dice (binding):** p3 opportunity · opposition uncanny (read as the ground, no magic — brief § Overrides) · disposition neutral (the inspector judges the footing, not the mason) · agentRole competitor · scale settlement (the finished work is a fact about the town: the Festival condition and the town's regard).
- **Anti-patterns avoided:** no rule gate (everyday board); no personal condition on the mortal as the failure penalty (brief § Systems quota); no promise of a place/time that no effect enacts (the scaffold day is a real appointment).
- No dilemma-library input: the encounter is a craft contest, not morally charged.

## 2. Scale Justification

`scale: 'local'`, two steps. A commission let in a morning is a single sharp contest: read the ground, build on it. Journeyman weight lives in the fiction (a season's pay, the town's regard, a cheaper rival), not in length.

## 3. Pressure Knot

The town's old pier has cracked top to bottom and nobody may pass under it. The inspector of works lets the rebuilding today, and a rival mason has already bid lower. Under the site is old fill from a building nobody remembered.

## 4. Intervention Fantasy

The god works on ground and hands: loosening a pit so the spade finds the fill, packing rubble under a footing, rushing a rival's mortar, or putting the site's history back into the inspector's head. The god does not pick who wins; the noon load does.

## 5. Cast and World Objects

| Object | Binding | Notes |
|---|---|---|
| Inspector of works | `$cast:inspector` (reuse clerk/elder/steward, spawn clerk "Aldo Venner"), must-persist | Named in step 0; appointment counterparty |
| Rival mason | `$cast:rival` (reuse mason, spawn mason "Brisa Holt"), must-persist | Named in step 1; wins on failure |
| The town | `$here` | Carries Festival (success) and the mortal's reputation (both sides) |
| Fee (first part) | step 1 `successMetadata.rewardPool` `#tool` | PRIZE chip, engine-rendered |
| Scaffold day | `encounter_seed` + `appointment` on `$here` | Kept → `#build`; missed → `#tavern_night` |

## 6. Beat Structure

1. **Read the ground** — stone 0.40, `continue_weakened`. Each mason digs a trial pit and says what the ground will carry.
2. **Set the footing** — stone 0.45, `fail_action`. Both pits struck old fill; each sets a trial footing; the inspector loads both with stone at noon. The holder wins the commission.

## 7. Branching Profile

Linear — no branching (branch count 0). Shape: **Appointment** (Seeded Sequel, placed/timed variant, THR-1479).

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Commission let in front of the town; rival's footing sinks | — | Town regard up, Festival, tool prize, scaffold-day appointment |
| success | Commission let; rival leaves angry | — | same writes |
| success_at_cost | Commission let | Their own money on bought stone | same writes; overview names the out-of-pocket start |
| failure | Rival gets the work | the fee | Town regard down |
| critical_failure | Footing breaks in public; inspector tells the town why | the fee, public standing | Town regard down, prose names the long wait for the next commission |

## 10. Sample Opening (urban, 71 words with spine)

> {actor} arrives in {location} on the morning the town lets the commission to rebuild its market arcade.
>
> The old pier has cracked from top to bottom, and nobody may pass under it. {cast:inspector}, the inspector of works, will let the rebuilding to one mason today.
>
> A rival mason has already bid lower. Each must dig a trial pit and say what the ground will carry. The fee is a season's pay.

Rural P1: "{actor} comes into {location} on the morning the village lets the commission to rebuild its bridge." The spine is class-neutral (a pier stands under an arcade and a bridge alike).

## 11. The Hand Per Step

Specials only; the rest is dealt. Prefix `commission.`. No over-exposed library card is authored.

**Step 0** — `deal: { count: 4, tags: [craft, insight] }`
- **Jog The Record** (Whisper, mind, 2 ess, Δ0.12) — "Bring what once stood on this site back to the inspector's mind, so it is said aloud while they dig." Fragments: success, failure.
- **Loosen The Spoil** (Boost-variant on matter, 1 ess, Δ0.10) — "Soften the topsoil in their pit, so the spade reaches the layer beneath it early." Fragments: critical_success, failure.

**Step 1** — `deal: { count: 3, tags: [craft, labor] }`
- **Firm The Bed** (Signature force, 2 ess, Δ0.13) — "Pack the rubble under their footing tight, so the load bears on solid ground." Fragments: success, failure.
- **Hurry The Rival** (Stumble, chaos, 2 ess, Δ0.11) — "Rush the other mason's hands, so their footing goes down before the mortar has set." Fragments: success, success_at_cost, failure.

No card crosses Δ0.15, so one failure fragment each suffices. No rider authored (the dealer supplies one if the god holds it). No cost channel other than essence; no grants.

## 12. Linear continuation

> Both trial pits struck old rubble fill a spade down, and nobody had warned of it. {cast:rival} says a wide footing will ride on the fill. Each mason sets a trial footing in their pit. At noon the inspector loads both with stone, and the footing that holds wins the commission.

## 13. Aftermath Paragraph (success)

> The inspector let the pier to {actor}. {cast:rival} took the refusal badly and left the site. The first part of the fee came out of the town's store.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean. Every write rides step 1's metadata so it fires on every band of its side (and `applyAftermathOutcomeBand` cannot drop it).

## 15. Aftermath Kit Summary (page order: scar · bond · boon · path)

- **Success bands:** BOND · reputation with {target} (`$here`, `reputation_with +0.06`) · BOON · Festival (`apply_condition trait.condition.location.festival` on `$here`) · BOON · prize (engine PRIZE chip, `rewardPool #tool`) · PATH · appointment (`$appointment`, the seed's appointment block).
- **Failure bands:** SCAR · reputation with {target} (`reputation_with −0.05` on `$here`).
- Growth fallback chip: stone reach.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| inspector | lazy-materialize-on-trigger | reuse clerk/elder/steward, else spawn clerk | must-persist | appointment counterparty (`owes_favor` edge) | live |
| rival | lazy-materialize-on-trigger | reuse mason, else spawn mason | must-persist | inherited into kept sequel via `inheritContext` | live |
| town (`$here`) | pre-seeded | actor's location | must-persist | Festival, reputation, appointment place | live |
| kept sequel | query `#build` (~21 members) | encounter library | seed | — | live |
| missed sequel | query `#tavern_night` (10 members) | encounter library | seed | — | live |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Steps / reach / difficulty per brief | PASS | stone 0.40 → stone 0.45, mean 0.425 (amended: open-draw ceiling 0.45) |
| rarityTier 2, scale local, settings urban+rural, one opening each | PASS | |
| Everyday: no rule gate, no excluded prefix | PASS | |
| Consequence hand wired | PASS | possession = rewardPool; place = apply_condition on `$here` |
| Appointment floor | PASS | `$here`, `$cast:inspector`, missed branch with its own query + seedLabel; both queries on seated tags with members |
| Hand rules | PASS | 2 specials + deal per step; ≥4 spheres and a common option left to the dealer |
| Six StepOutcomes covered | PASS | afterimages ×5 per step + dealer fragments + near_miss via success texture |
| Chips: sheet-word nouns, ≤15 words, backed by writes | PASS | nouns: reputation form, Festival, appointment |
| Cool failure | PASS | money and standing only |
| `$actor` personal condition | PASS | none authored |
| Possession timing | FLAG | brief says "on the kept appointment's success"; the kept sequel is an existing `#build` template this package cannot edit, so the prize lands on the letting (first part of the fee). Critic may prefer a reaction on the kept branch once a bespoke sequel exists. |
| `{target}` in the reputation noun | FLAG | lawful reputation form; on a self-targeted scene `{target}` may render the actor rather than the town — verify at live proof, fall back to a `concepts` anchor if so. |
| Dry run | PASS | `compile-encounter --dry-run` clean |

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (inspector, rival, pit, fill, noon load) · 4 YES · 5 YES · 6 YES (essence) · 7 YES · 8 YES (each card acts on the pit, the fill, the footing, the rival or the inspector) · 9 YES (ground, memory, footing, rival — four questions) · 9b YES · 10 YES · 11 YES (the town, the inspector, the rival) · 11b YES (read as a page per band) · 12 N/A (short scale) · 13 N/A · 14 YES — concept art: an empty scaffold against a pier with a chalked load mark, no people; residue of a contest, not the contest.
