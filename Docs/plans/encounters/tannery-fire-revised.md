# Encounter Pipeline: The Tannery Fire
> Scale: medium | Slug: tannery-fire | Pass: revised
> Revisions applied: opening P2/P3 (seam echo, the watch sends for {actor}); step-1 spine (lane, stake names {actor}); Still The Wind effect line made generic; cs/sac/failure/cf overviews (page repetition, seam echoes, "the master" ambiguity, failure-vs-cf ladder); sac carryover factor line; rebuild + vats reaction intents. No mechanic changed.
> Date: 2026-10-15 | Pipeline version: 2.0
> Batch: master-everyday-3 (THR-1840), slot 4 · id `encounter.town.tannery_fire` · reach iron

## 0. Game design (fixed before the premise — brief slot 4, binding)

| Field | Value |
|---|---|
| Steps | iron 0.76 (`continue_weakened`) → iron 0.82 (`fail_action`); mean 0.79, window fit 0.93 |
| Shape | danger → confrontation → aftermath (rolled personality fork, overridden by the brief) |
| Settings | `urban` (rolled *arcane* survives as the dyers' and tanners' vats, whose fumes take fire) |
| Consequence hand | **standing + place** (binding, no swap). `draw:consequences` prints: standing = `reputation_score` / `reputation_tally` / `reputation_set` / `faction_reputation_gain` / `reputation_with`; place = `spawn_unique_location` / `condition_attachment` / `apply_condition` / `remove_condition` with `targetLocationId` |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` |
| Opposition | rival_agent (greed): the master tanner, who will not see the stock lost |
| Rule gates | none — no fight, confront, monster, army or rank gate |
| Cost channels | essence only; no Heavy Hand, no rider, no grant |

**Payoffs band by band.** critical_success / success / success_at_cost: the street stands (`reputation_with $here +0.06`), the watch keeps the burnt quarter **Under Watch** (`apply_condition` on `$here`), and the master tanner counts the lost stock against the master (`bond_change $cast:tanner` −). success_at_cost adds a prose cost (two hook men hurt; the journeymen blame the master). failure: the fire is stopped two streets past the sheds, the tanning pits burst into the river, and `$here` takes **Plague Scare**; the town and the watch sergeant think less of the master. critical_failure: the fire spreads past the quarter unchecked until the wind turns; the town and the sergeant think less of the master (backed on both routes into the band).

**Cool failure.** Nobody is killed, jailed or branded. The master's cost is their name: the watch sent for them, and the town says so.

plotHookRolled: hook.festival_of_fools, hook.gods_fall, hook.environmental_gauntlet
plotHookTaken:  hook.environmental_gauntlet — the burning quarter is the ground the master must hold, then cut through.

## 1. Inspiration Anchors

- **hook.environmental_gauntlet** — the environment is the opponent in step 0 (wind, fumes, falling roofs); the shape's confrontation (step 1) puts a person in front of the only way through.
- **Ordeal archetype (the fire line):** the master's test is leadership under falling roofs, not personal combat — iron as nerve and command.
- **Anti-patterns avoided:** the villain-for-villainy's-sake (the tanner wants to keep a season's stock, which is honest greed); punishment failure (failure leaves the town with a foul river and the master with a spent name — a story, not a stat loss); the bystander agent (the watch sends for the master; the lines are theirs to hold).

## 2. Scale Justification

Medium: two beats (the bucket lines, the firebreak), one confrontation, a curated aftermath with reactions. A master job, but one night's work in one quarter.

## 3. Pressure Knot

The fire started before the mortal arrived. Three roofs are burning, the wind is dry, the vats' fumes burn, and the bucket lines are already breaking each time a roof falls.

## 4. Intervention Fantasy

The god works the fabric around the fire: the wind, the fear in a line of frightened men, old timbers, a stubborn man's eyes. The mortal does the leading; the god decides what the night gives them to lead with.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:sergeant}` | actor, guard, `lazy-materialize-on-trigger`, must-persist (spawn name Hob Ketteridge) | sends for the master in the opening; bond moves on failure routes; credited in a reaction |
| `{cast:tanner}` | actor, merchant, `lazy-materialize-on-trigger`, must-persist (spawn name Gerold Ashby) | the master tanner; owns the sheds; bond falls on every success side |
| `$here` | location | `reputation_with`; `under_watch` (success) / `plague_scare` (failure) |
| intelligence record "The Tanners' Vats" | cultural_knowledge | failure-side reaction |

## 6. Beat Structure

1. **Hold the bucket lines** (iron 0.76, danger). Opening + spine: see § 10.
2. **Pull down the sheds** (iron 0.82, confrontation). Spine: *"The fire has reached the lane at the edge of the quarter. The drying sheds beside the lane belong to {cast:tanner}, the master tanner, and a season's hides hang in them. {cast:tanner} stands in the doorway with the journeymen and says no one touches the stock. The sheds must come down for a firebreak. Without one, the next street burns tonight, and the town will blame {actor}."*

Step 1 carries `carryoverFactorLines` keyed on step 0 (cs +0.06, s +0.04, sac −0.02, near_miss −0.03, failure −0.05; critical_failure ends the action):

| Step-0 band | Text | Polarity |
|---|---|---|
| critical_success | The bucket lines are holding the fire at the river stair. | for |
| success | The fire has stopped gaining on the street. | for |
| success_at_cost | They are working with a burned arm. | against |
| near_miss | One more roof caught at the top of the stair. | against |
| failure | The fire has taken the drying yard along the river. | against |

Trait variants: Brave (`trait.personality.iron.virtue`, +0.04) "Being Brave, they stay on the stair while roofs fall." · Brutal Thug (`trait.reputation.iron.negative`, −0.04) "Known as a Brutal Thug, they are not trusted to give orders to frightened men."

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | not one house beyond the quarter burns; no one hurt at the sheds | the tanner's sheds and stock | town regard up; Under Watch; tanner counts the loss against the master |
| success | the street beyond stands; half the quarter is ash | as above | as above |
| success_at_cost | the street stands | two hook men with broken bones; the journeymen blame the master | as above |
| failure | the fire is stopped two streets past the sheds | the river, fouled by the burst pits | Plague Scare on the town; town and sergeant think less of the master |
| critical_failure | the fire spreads past the quarter, unchecked until the wind turns | the master's name | town and sergeant think less of the master |

## 9b. Stakes Line

```
goal:      stop a fire spreading out of the tanners' quarter
risk:      see the fire take the street beyond the quarter
won:       stopped a fire spreading out of the tanners' quarter
lost:      lost two streets before the fire was stopped
lostBadly: saw the fire take the street beyond the quarter
```

description: *"Fire has taken the tanners' quarter on a dry wind. Someone has to hold the bucket lines at the river stair, then pull down the master tanner's sheds for a firebreak before the fire reaches the next street."*

narrativeTemplates: initiation *"Fire has taken the tanners' quarter, and the watch has sent for someone to stop it spreading."* · success *"{actor} held the bucket lines and cut a firebreak, and the fire stopped at the edge of the quarter."* · failure *"The fire spread out of the tanners' quarter, and {actor} could not stop it."* · fallback overview *"The fire bell stops, and the watch walks the burnt quarter until dawn."*

## 10. Sample Opening (urban; narrator mode)

> {actor} arrives in {location} as the fire bell rings over the tanners' quarter.
>
> A dry wind is spreading the fire. The fumes from the dye vats burn as well, and three roofs are alight. {cast:sergeant} of the town watch has formed bucket lines from the river stair.
>
> Each time a roof falls, men drop their buckets and run. {cast:sergeant} sends for {actor} to hold the lines. If the lines break, the fire will reach the next street.

(74 words.)

## 11. The Hand Per Step

**Step 0 — Hold the bucket lines.** Deal fill `{ count: 3, tags: [might, labor] }` + 2 specials.

| Card | Library type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Still The Wind | Ward | order | 2 | 0.10 | Calm the moving air for a while, so nothing light is carried far. |
| Steady The Line | Focus | mind | 1 | 0.08 | Settle the fear in a working crowd, so each person keeps their place when danger comes close. |

Fragments — Still The Wind: cs "The wind dropped as the lines formed, and the sparks fell back into the burning roofs." · s "The wind slackened, and the sparks stopped carrying to the next row of roofs." · nm "The wind slackened for a while, then gusted once and carried a spark over the stair." · f "The wind slackened, but the vats' fumes kept the fire going without it."
Steady The Line: s "When the next roof fell, the men on the stair kept passing buckets." · sac "The men held their places, and {actor} went in alone for the one who fell." · f "The men on the stair held, but the men at the river end ran." · cf "The men held their places a moment too long, and a falling wall broke the line in two."

**Step 1 — Pull down the sheds.** Deal fill `{ count: 3, tags: [might, presence] }` + 2 specials.

| Card | Library type | Sphere | Cost | Δ | Opposes | Effect line |
|---|---|---|---|---|---|---|
| Crack The Timbers | Decay | entropy | 2 | 0.10 | — | Eat old beams hollow from inside, so a building comes down at the first pull. |
| Show The Danger | Reveal | light | 1 | 0.08 | tanner | Make a coming harm plain to see, so a stubborn person cannot pretend it is far off. |

Fragments — Crack The Timbers: cs "The first shed folded at one pull of the hooks, and the next two went with it." · s "The posts gave at the first pull, and the shed came down across the lane." · nm "The posts gave, but the roof hung on its ridge beam and had to be pulled twice." · f "The posts gave, but the journeymen stood under the roof so no one would pull."
Show The Danger: s "{cast:tanner} saw the sparks landing on the shed roof and stepped out of the doorway." · sac "{cast:tanner} saw the sparks and gave way, but the journeymen did not." · f "{cast:tanner} saw the sparks, and sent the journeymen in to carry out the hides first." · cf "{cast:tanner} saw the sparks, and barred the shed door to save the stock inside."

## 12. Linear continuation (step afterimages)

Step 0: cs "The lines held through every falling roof, and the water reached the fire faster than it spread." · s "The lines held, and the fire stopped gaining on the street." · nm "The lines held, but a gap at the top of the stair let one more roof catch." · sac "The lines held, but {actor} took a burn across the arm pulling a man from under a beam." · f "The lines broke twice, and the fire took the drying yard along the river." · cf "The lines broke and did not form again, and the fire crossed into the next street."

Step 1: cs "{cast:tanner} stood aside, and the journeymen helped the hook crews pull the sheds down." · s "{actor} got the hook crews past the journeymen, and the sheds came down across the lane." · sac "The sheds came down, but the journeymen fought the hook crews first, and two men were hurt." · f "{cast:tanner} held the doorway until the sheds caught, and the fire went over them into the next lane." · cf "The journeymen drove the hook crews off, and the fire took the street beyond the quarter."

## 13. Aftermath Paragraphs (overviews)

- cs: "The fire went out at the gap where the sheds had stood. Not one house beyond the quarter burned, and no one was hurt at the sheds."
- s: "The fire burned out at the gap where the sheds had stood. Half the tanners' quarter is ash, and the street beyond it stands."
- sac: "The fire burned out at the gap, and the street beyond the quarter stands. Two hook men have broken bones from the fight, and the journeymen blame {actor} for it."
- f: "By morning the fire was out, two streets past the sheds. The tanning pits burst in the heat and fouled the river. The watch had sent for {actor} to stop exactly this."
- cf: "The fire spread past the tanners' quarter and did not stop until the wind turned at dawn. {actor} was the one the watch sent for."

## 14. Aftermath Reaction Choices

Success sides (cs / s / sac):
- **Ask the town to rebuild the sheds** (bond_change tanner +0.08, reputation_with $here −0.02) — intent: "The mortal asks the council to pay for the master tanner's sheds. The tanner may let the grudge go, and the town will ask why it should pay."
- **Give the watch the credit** (bond_change sergeant +0.08) — intent: "The mortal tells the town the bucket lines saved the street. The sergeant will remember it."

Failure sides (f / cf):
- **Find roofs for the burned-out families** (reputation_with $here +0.02) — intent: "The mortal spends the next day finding beds for the families the fire turned out. The town will see who stayed."
- **Ask the tanners what caught first** (intelligence "The Tanners' Vats": "The dye vats and the lime pits of a tanners' quarter give off fumes that take fire on a dry wind.") — intent: "The mortal asks the tanners what caught first and why it spread so fast, and keeps the answer."

## 15. Aftermath Kit Summary

Chips, success sides (scar · bond · boon · path order): BOND reputation with {target} (`$cast:tanner`), title "A Season's Stock", "{cast:tanner} counts the lost hides against {actor}." · BOON Under Watch (`trait.condition.location.under_watch`), title "Guards in the Ashes", "The watch keeps men posted in the burnt quarter of {location}." · BOON reputation with {location}, title "The Town's Regard", "{location} thinks well of {actor} now."
failure: SCAR Plague Scare, title "Foul Water", "Travellers keep away from {location}, for fear of sickness." · SCAR reputation with {location}, title "The Town's Regard", "{location} thinks less of {actor} now." · BOND reputation with {target} (`$cast:sergeant`), title "The Watch's Trust", "{cast:sergeant} trusts {actor} less."
critical_failure: SCAR reputation with {location}, title "Lost Before the Town", "{location} thinks less of {actor} now." · BOND reputation with {target} (`$cast:sergeant`), title "The Watch's Trust", "{cast:sergeant} trusts {actor} less."

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| sergeant | lazy-materialize-on-trigger | reuse `guard`, else spawn `guard` | must-persist | bond edges | live |
| tanner | lazy-materialize-on-trigger | spawn `merchant` | must-persist | bond edges | live |
| `$here` conditions | effect | `apply_condition` | condition duration | movement tax (plague_scare), shadow step modifier (under_watch) | live |

## 17. Self-Audit

- Envelope + opening per class: PASS (urban).
- Purpose lines ≤4 words, factor lines derived (carryover + trait variants only): PASS.
- Composed hand 4–8, ≥4 spheres, ≥1 ungated common via deal: PASS (gate green).
- Every nudge ≥1 failure fragment; every band covered: PASS.
- No digits in effect lines; card names imperative lexicon; no effect line shares a content word with its name: PASS.
- Trait hooks: Brave +0.04, Brutal Thug −0.04; no gate, no trait-only nudge: PASS.
- Every family in the hand wired: standing (reputation_with), place (apply_condition on `$here`): PASS.
- Law 56 (chips backed on every route): cf chips backed by step-0 and step-1 failure metadata: PASS.
- Editorial page read (§ 6b, all five bands): no repetition, no conflict after revision.

## Concept Art Direction

Emotions: loss paid on purpose; a line held at a price. Image: a row of blackened shed posts snapped off at knee height, iron hooks still hanging from one, and beyond the gap an untouched timber house front with wet buckets stacked at its door. Morning light, smoke thinning. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (wind, lines, stair, sheds, hides, tanner named before cards act) · 4 YES · 4b YES (revised) · 5 YES (Still The Wind made generic) · 6 YES · 7 YES · 8 YES · 9 YES (air / nerve / timber / the tanner's eyes) · 9b YES · 10 YES · 11 YES · 11b YES (revised) · 12 YES · 13 YES (peace with the loser vs credit to the line; repair vs learn) · 14 YES.
