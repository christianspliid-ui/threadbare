# THR-821 — Nudge headroom: capability vs difficulty

**Date:** 2026-07-27
**Issue:** [THR-821](https://linear.app/threadbare/issue/THR-821)
**Parent observation:** THR-775 (Nudge Model WS2 — the interface)
**Reproduce:** `npm run measure:nudge-headroom` (seeds 42/99, medium map, tick 0)

## The question

THR-821 measured the nudge stage on seven seeded mortals (`npc_1/5/13/20/33/47/60/88`)
running the golden exemplar's step 0 (reach `eye`, difficulty 0.45). Every one read
`FORECAST Doomed p=0.050` — exactly `PROBABILITY_FLOOR` — and no combination of the
five playable cards (up to ~0.37 combined) moved it.

The ticket named two candidate causes wanting different fixes:

1. **The exemplar is deliberately brutal** — a bad demo fixture, content fix.
2. **Seeded mortals genuinely lack capability in most reaches**, so *any* step above
   `fair` floors for them — tuning/engine fix.

The distinguishing measurement: the distribution of `computeCapability(agent, reach)`
across seeded mortals per reach, against the difficulty distribution of nudge-bearing
steps.

## Verdict

**Neither, as stated.** Three findings, and the headline is that the parent
observation measured a population that cannot reach the nudge stage at all.

### A — the measured population is unreachable by construction (not a defect)

`npc_*` nodes are all `spotlightTier: 'ambient'`, and `npcSeeding.ts:276-287` creates
them with **no `domainCapabilities` property at all**. `computeRawScore` therefore
returns 0 and `sigmoid(0) = 0.018`. Measured:

| seed | ambient individuals | carrying `domainCapabilities` | capability p50 |
| -- | -- | -- | -- |
| 42 | 351 | **0** | 0.018 |
| 99 | 459 | **0** | 0.018 |

That alone explains the `p=0.050` reading. But those agents also *cannot be attended*:
the nudge stage is `story_beat`-only, and `resolveEffectiveTier`
([src/engine/attentionTier.ts:39](../../src/engine/attentionTier.ts)) returns
`'invisible'` for a null or `dormant` court position. `story_beat` survives only at
`retinue` / `the_first`. An unthreaded ambient NPC never sees a nudge hand in play.

The observation is real and the forecast was telling the truth — it was staged through
the debug panel on agents outside the feature's audience.

### B — for the population that *can* be attended, the exemplar is fine

`spotlight` agents (14 per seed, all carrying capabilities) sit at capability
p25 = 0.973, p50 = 0.999. Fraction of `(agent, reach)` pairs above `PROBABILITY_FLOOR`:

| probe | difficulty | unaided | +2 cards | +full hand |
| -- | -- | -- | -- | -- |
| exemplar step 0 (`eye`) | 0.45 | **98.2%** | 100% | 100% |
| exemplar step 1 (`shadow`) | 0.60 | 94.6–98.2% | 100% | 100% |

The exemplar is not too brutal for its actual audience. Candidate 1 is refuted.

### C — the real gap is the `notable` tier, off-reach

A mortal the player has just threaded lands at `notable`
(`NOTABLE_THRESHOLD = 10`, `IMPORTANCE_PLAYER_ACTION = 3`, so ~4 player actions), and
`generateRoleCapabilities` gives that tier a steep internal spread:

| reach role | raw range | capability min | p50 | max |
| -- | -- | -- | -- | -- |
| primary | 8..15 | 0.310 | 0.690 | 0.881 |
| secondary | 5..10 | 0.119 | 0.310 | 0.500 |
| **other** | **1..5** | **0.027** | **0.057** | **0.119** |

Fraction above `PROBABILITY_FLOOR`:

| reach role | d=0.26 (shipped p50) | d=0.45 (`steep`) | d=0.60 (`severe`) |
| -- | -- | -- | -- |
| primary | 100% / 100% / 100% | 63% / 100% / 100% | 50% / 75% / 100% |
| secondary | 50% / 100% / 100% | 0% / 50% / 83% | 0% / 17% / 50% |
| **other** | 0% / 20% / 100% | **0% / 0% / 0%** | **0% / 0% / 0%** |

*(cells are `unaided / +2 cards (0.22) / +the measured ascendant's playable subset (0.37)`
— **not** the hand's ceiling; see the correction under § *Open question spun out*)*

**A nudge hand cannot rescue an off-reach `steep`-or-worse step for a notable-tier
mortal** — not with two cards, not with the whole hand, and not at the documented
`±0.20` `actionModifiers` cap. That is the honest constraint the feature has.

## Recommendation: content, not tuning

Do **not** move `PROBABILITY_FLOOR` (0.05) or the sigmoid
(`SIGMOID_MIDPOINT = 10`, `SIGMOID_K = 0.4`, [src/engine/domainCapability.ts](../../src/engine/domainCapability.ts)).
They are load-bearing for the entire resolution ladder — every encounter in the game,
not just nudge-bearing ones — and the calibration THR-571 measured
(`success_at_cost` dominant at 45–60%) rides on them. Raising the floor to make one
feature's cards visible would re-tune every outcome band in the game.

The shipped step population does not need it either:

```
templates=672 steps=1232 steps carrying nudges[]=0
difficulty  min=0.000 p25=0.140 p50=0.260 p75=0.400 max=1.000 mean=0.278
bands  gentle(<0.30)=688  fair(0.30-0.45)=304  steep(0.45-0.60)=159  severe(>=0.60)=81
```

p50 difficulty is 0.26 — comfortably reachable at every tier. Only 240 of 1232 steps
sit at `steep` or worse.

**Note the last count in that block: zero shipped steps carry `nudges[]`.** The only
nudge-bearing template in the repo is the exemplar fixture, which is deliberately
registered nowhere. The "difficulty distribution of shipped nudge-bearing steps" the
ticket asks for is an empty population — WS5 ([THR-778](https://linear.app/threadbare/issue/THR-778))
is what creates it. So this measurement lands as a **constraint on WS5's authoring**
rather than a fix to existing content.

### The constraint WS5 inherits

Encoded as `NUDGE_OFF_REACH_MAX_DIFFICULTY` in
[src/data/content-eval/nudgeAuthoringConstants.ts](../../src/data/content-eval/nudgeAuthoringConstants.ts)
and written into the authoring spec:

> A nudge-bearing step whose reach the acting mortal is unlikely to hold should stay at
> `fair` (< 0.45) or below. Above that, the hand is decorative for every actor below
> spotlight tier.

Encounters that *want* to be `steep`/`severe` are fine — they should be authored for
actors who plausibly hold the reach (role-gated, faction-gated, or late-run), which is
what the exemplar does: a vault theft in `eye`/`shadow` drawn by a thief.

## Open question spun out — answered 2026-07-28 (THR-827)

`ResolutionInput.actionModifiers` was documented "capped at ±0.20"
([src/types/resolution.ts](../../src/types/resolution.ts)) but
`computeResolutionThreshold` never clamped it. The exemplar's step-0 hand sums past the
documented cap with nothing enforcing it. Either the comment was stale or the cap wanted
enforcing; the two answers give the nudge model very different ceilings. Filed as
THR-827.

**Verdict: the comment was stale — and had never been true.** Not merely overtaken by the
nudge model. `resolutionModifiers.ts` has always bounded each *contributor* and never
their sum:

| contributor | cap | constant |
| -- | -- | -- |
| sphere alignment | ±0.10 | `SPHERE_ALIGNMENT_BONUS` |
| equipment | 0.15 | `EQUIPMENT_MODIFIER_CAP` |
| terrain | ±0.10 | `TERRAIN_MODIFIER_CAP` |
| traits | 0.10 | `TRAIT_BONUS_CAP` |
| effects | 0.30 | `EFFECT_MODIFIER_CAP` |
| divine intervention | — | unbounded |
| `modify_rules` override | — | unbounded |

The bounded sources alone sum to **0.75**, and `EFFECT_MODIFIER_CAP` on its own exceeds
the claimed ±0.20 total. A committed nudge hand then adds on top
(`useNudgeHand.ts`). No caller has ever clamped the term, so enforcing 0.20 now would not
have restored an old contract — it would have imposed a new one, silently truncating
equipment/effect stacking that shipped content already relies on and making cards 3–8 of
an authored hand inert (the player spends essence and the forecast does not move), which
is precisely the decorative-hand failure mode this audit's finding C exists to prevent.

Actions taken under THR-827:

* The `±0.20` notes on `ResolutionInput.actionModifiers` and `ResolutionModifiers.total`
  are replaced with the real contract; `resolutionService.ts` documents it at the
  computation.
* `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70 — 0.65 was this bullet's first value and the
  conformance test rejected it; the exemplar's step 1 sums to 0.68) added to
  `data/content-eval/nudgeAuthoringConstants.ts` — the authoring-time bound on hand
  strength, warn-level and director-tunable, asserted against the golden exemplar. There
  is deliberately **no** runtime clamp.
* `resolutionService.test.ts` pins the pass-through in both signs, so a clamp cannot
  reappear silently.

**Correction to § B above.** The `+full hand` column reads `0.37`, which is the subset the
*measured ascendant's* accessible spheres allowed — not the hand's ceiling. The exemplar's
five non-trait-gated cards sum to **0.55**, and sphere access is pool-driven
(`buildNudgePhaseModel`: any sphere with essence > 0), so a god holding light/mind/time/
entropy plays all five. At 0.55 the off-reach cohort in § C **clears** the floor
(0.127..0.219 across raws 1–5) rather than staying pinned to it. `NUDGE_OFF_REACH_MAX_DIFFICULTY`
is therefore calibrated to the common case, not the reachable worst case; whether that is
the intended calibration is spun out as THR-831.

## § B verdict — answered 2026-08-24 (THR-831)

**`NUDGE_OFF_REACH_MAX_DIFFICULTY = 0.45` stands. The floored-cohort measurement was
never an invariant to preserve — it described the pathology the ceiling exists to
prevent, observed at the boundary.**

THR-831 offered two readings: (1) the constant is right and its justification was
overstated, or (2) the constant is mis-set and wants *lowering* until a 0.55 hand no
longer clears the floor. Re-derived from `computeResolutionThreshold`, reading 2 does
not exist in the direction it names:

```
p = capability − difficulty + modifiers,  clamped to [0.05, 0.95]
floored  ⟺  difficulty ≥ capability + modifiers − 0.05
```

Difficulty sits on the **same side as the floor**. Lowering this ceiling makes a hand
clear the floor *more* easily, never less. To keep even the strongest off-reach notable
(capability 0.119) pinned against a 0.55 hand you would have to **raise** the ceiling to
**0.6192** — past the `severe` band floor (0.60), the band this rule exists to keep
open-draw content out of. The retune option was arithmetically backwards, so the
ceiling's *direction* was always right and only its rationale was wrong.

Measured at the ceiling (d = 0.45), across the notable off-reach cohort (raws 1–5):

| hand played | raw 1 | raw 2 | raw 3 | raw 4 | raw 5 | reading |
| -- | -- | -- | -- | -- | -- | -- |
| unaided (0) | 0.050 | 0.050 | 0.050 | 0.050 | 0.050 | all floored |
| +2 cards (0.22) | 0.050 | 0.050 | 0.050 | 0.050 | 0.050 | all floored |
| measured subset (0.37) | 0.050 | 0.050 | 0.050 | 0.050 | 0.050 | all floored |
| Swollen Ford step 0 (0.46) | 0.050 | 0.050 | **0.067** | **0.093** | **0.129** | graded |
| full non-trait hand (0.55) | **0.127** | **0.139** | **0.157** | **0.183** | **0.219** | all clear |
| rubric maximum (0.70) | **0.277** | **0.289** | **0.307** | **0.333** | **0.369** | all clear |

The graded row is the answer in game terms. **A god with essence across many spheres
lifting an off-reach mortal off the floor is the feature working, not a leak.** You are
still bending a mortal's odds rather than substituting your competence for theirs
(`rulebook.md` § *The nudge*) — but a wide pool bends them further than a narrow one, and
the cohort's own spread still decides who benefits. A ceiling tuned to keep the cohort
floored *through* a full hand would make broad sphere access buy nothing, which is the
decorative-hand failure in its other form.

Note the crossover sits between 0.3808 (strongest floored below this) and 0.4734
(weakest floored below this) — so the shipped exemplar's own 0.46 step-0 hand already
lands inside the graded band. This is not a hypothetical about a retired fixture.

Actions taken under THR-831:

* Verdict recorded on `NUDGE_OFF_REACH_MAX_DIFFICULTY` in
  [nudgeAuthoringConstants.ts](../../src/data/content-eval/nudgeAuthoringConstants.ts).
  No constant changed.
* `nudgeModel.test.ts` pins the boundary in **both** directions — the floored side it
  already had, plus the whole cohort clearing at a full non-trait hand (probabilities as
  literals) and the monotonicity of the difficulty term, so the retune question cannot be
  re-derived from silence. Pinning only the floored side is how the rationale came to
  claim more than it had measured.
