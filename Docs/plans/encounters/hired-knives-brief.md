# Encounter brief — The Hired Knives (THR-1703)

> Single encounter, default mode (not a batch). Authored for THR-1703: the rival strike
> that regional detection pressure plants (`recordDetectionCrossings`,
> `src/engine/orchestrator/phaseDetectionPressure.ts`) has had no encounter to land on.
> Date: 2026-10-03 · Lane: tb-opus-pickup

## Why this encounter exists (the corpus need)

When a god's nudges in one region push its detection pressure to the encounter band
(1.0), a rival notices and strikes: one `shadow.rival_strike` seed lands on the mortal
whose god's help was loud. No template answers that family, so the strike has been held
back by a content gate (`seedSkipped: 'no_content'`). The same family is also planted by
`the-infiltrators-approach.ts` ("The betrayed master moves first"). This encounter is the
payoff of the detection-pressure cost channel: the player paid for loud help with
attention, and this is what the attention costs.

## Game design (fixed before any fiction)

| Axis | Decision | Why |
|---|---|---|
| Template id | `encounter.rival.hired_knives` | Compiler requires `encounter.<family>.<name>`; resolves via the `#rival_strike` family tag |
| Family tag | `#rival_strike` (new, seated on its runtime readers: the detection planter and the infiltrators' seed) | `ENCOUNTER_FAMILY_TAGS['shadow.rival_strike'] → '#rival_strike'` |
| Drawable | `false` — seed-only | A strike is caused by detection pressure, never offered by the board |
| Reach | Shadow (primary) | Seeing the tail, losing it, going unseen |
| Scale | short — 2 steps, linear (0 branches) | A payoff beat, not a chapter |
| Rarity | 2 | Two-family consequence hand |
| Settings | `rural`, `urban`, `wayside` | The seed lands wherever the mortal stands; these cover where mortals live and travel. A mortal at a stronghold/sacred/arcane/ruin/battlefield site is not struck (seed withers to the family word) — accepted |
| Step 1 | Shadow — notice and lose the tail. Difficulty ≈ 0.40 | Journeyman band (mean 0.35–0.50) |
| Step 2 | Iron — the knives close; survive the attack. Difficulty ≈ 0.45 | The cost lands here; a step-1 success should help (carryover line) |
| Mean difficulty | ≈ 0.43 | Journeyman — the strike should be a real threat to an ordinary mortal |
| Opposition | Willed: agents hired or sworn to the rival god | Override of the rolled `time itself` (the strike is by definition a person sent) |
| Cost channel | Cards may carry `detectionDelta` both ways: a loud card raises it further, a quiet card (the Veil type) lowers it | Closes the loop: the region's attention is the encounter's subject |

### Consequence hand (rolled, binding — `npm run draw:consequences -- encounter.rival.hired_knives --reach shadow --rarity 2`)

- **relationship** — wire `bond_change`
- **drive** — wire `assign_ambition` or `plant_compulsion`

Design intent for each (the draft may refine, must not drop):

- *drive*: on survival the mortal is left wary of being watched — a compulsion (watchfulness)
  or an ambition aimed at whoever sent the knives. On the worst failure the drive is fear.
- *relationship*: the strike tests a tie — someone who sheltered, warned, or sold out the
  mortal. A bond moves up or down by band.

### Band payoffs

| Band | Payoff |
|---|---|
| critical_success | The tail is turned: the mortal learns who sent them (drive aimed outward), a bond strengthens |
| success | Lost the knives clean; watchfulness drive |
| success_at_cost | Escaped, but someone close paid for it (bond strained) |
| near_miss / failure | Cut and run: `trait.condition.wounded`, bond strained |
| critical_failure | Badly hurt and afraid; drive is fear, bond broken |

## Rolled constraints

```
plotHookRolled: hook.siege_and_hold, hook.death_and_return, hook.followed_on_the_road
plotHookTaken:  hook.followed_on_the_road
p3Shape:        unmitigated_risk (kept: being followed, nothing has struck yet)
opposition:     time itself → OVERRIDDEN: willed opposition (the rival's hired knives). Reason: the encounter is defined as a person sent.
disposition:    hostile (follows from the override)
agentRole:      bystander pulled in → kept loosely: the mortal did nothing to the rival; their god did
scale:          personal
```

## Evidence the encounter owes (THR-1703 Done-when)

- `encounterFamilyHasContent('shadow.rival_strike')` is true.
- The un-mocked case in `nudgeDetectionEscalation.test.ts` plants the seed.
- `?view=game&seeded&size=medium&spawn=encounter.rival.hired_knives` opens the encounter.
