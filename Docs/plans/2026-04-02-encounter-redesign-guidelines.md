# Encounter Redesign and Authoring Guidelines

> **Date:** 2026-04-02
> **Status:** Design guidance for content refactor
> **Scope:** Legacy encounters, unified-action migration, future encounter authoring
> **Related:** Unified actions, quintessence, reward pools, reach progression

## Summary

The encounter system already has strong thematic bones: broad reach coverage, rich prose, multi-step structure, and a reward pool system that can express items, curses, blessings, allies, and conditions. What it does not yet have is one stable gameplay contract.

Right now, authored content is tuned around multiple different assumptions:

- Some packs assume early agents should fail often.
- Some packs label roughly the same numeric difficulty as `easy`; others label it `moderate` or `hard`.
- Most migrated encounter steps still default to hard-stop failure.
- Reward pools and promotion flags are dense enough that growth and loot cadence risk becoming noisy instead of meaningful.

This document defines how to bring existing encounters in line with the redesigned system and how future encounters should be authored so they reinforce:

- low starting power with room to grow
- fail-forward play instead of binary dead ends
- spendable resilience through quintessence, items, allies, blessings, and conditions
- unified actions as the single runtime action model

---

## 1. Current Encounter Data Assessment

### What is strong already

- The game has a large encounter catalog with good thematic spread across wilderness, ruins, monsters, factions, guilds, and social play.
- Most authored encounters already use 2-3 step arcs, which is a good shape for suspense and escalation.
- Reach pairings are generally intuitive and help reinforce character identity.
- Reward pools already provide a strong content substrate for a richer resilience economy.

### What is misaligned with the redesign

#### 1. Threat labels are not normalized across content packs

Different encounter packs use different internal baselines for the same threat label.

Examples:

- Borderland `easy` starts at `12` in [borderland-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/borderland-encounter-content.ts#L28).
- Social content uses base `30` in [social-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/social-encounter-content.ts#L20).
- General faction content uses base `25` in [faction-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/faction-encounter-content.ts#L32).
- Arcane Circle `easy` quests use base `30` in [arcane-circle-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/arcane-circle-encounter-content.ts#L14).

This means `easy` is currently a pack-local word, not a game-wide promise.

#### 2. Part of the source content is explicitly tuned for low early success

The general encounter pack says early agents should pass step 1 only around `10-20%` of the time in [encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/encounter-content.ts#L35). That is the opposite of the target heroic loop.

For the redesign, starting agents should feel weak in the world overall, but reliable in truly low-tier content.

#### 3. Fail-forward exists in architecture but not as the default content contract

Unified actions already support `continue_weakened` in [unifiedActionLifecycle.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/unifiedActionLifecycle.ts#L96), but migrated encounter steps mostly still author as `fail_action` in [unified-action-templates.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/unified-action-templates.ts#L73).

Current migration snapshot:

- `continue_weakened`: 10 steps
- `fail_action`: 74 steps

That ratio is too binary for the intended psychology.

#### 4. Promotion eligibility is too dense

In the general encounter pack:

- `159` templates
- `201` reward pool declarations
- `235` `tierPromotionEligible` flags

This suggests that advancement opportunities are spread too broadly and too often. Growth should be frequent early, but promotion-significant beats should not trigger on almost every meaningful step.

#### 5. Reward pools are dense, but not yet governed by a resilience economy

A lot of packs already put reward pools on both success and failure outcomes. That is not inherently wrong, but under the redesign:

- success rewards should help momentum and build resilience
- failure rewards should mostly mean wounds, curses, debts, stains, or salvage

Without that distinction, failure reward pools can read as "loot anyway" instead of "progress came at a cost."

#### 6. Encounter structure is good, but consequence language is still often retreat-oriented

Many failure outcomes still narrate:

- retreat
- withdrawal
- loss of opportunity
- inability to continue

Those are fine for some beats, but they should not be the dominant result shape across the catalog. More encounters should move the fiction forward while charging a cost.

#### 7. The content catalog currently tops out at `deadly`, not a true endgame `epic` band

The current `ThreatRating` type ends at `deadly` in [encounter.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/encounter.ts#L20). That leaves no authored label for late-game "god-approach" content unless `deadly` is stretched to cover too many jobs.

Until the type system is expanded, "epic" should be treated as an authored convention layered on top of `deadly`:

- `threatRating: 'deadly'`
- high `questPriority`
- high rarity
- stronger gating
- stronger quintessence pressure

### Useful current shape numbers

These are rough authored-content counts from the current data files.

#### General encounter pack

- `159` templates in [encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/encounter-content.ts)
- threat mix:
  - `34` trivial
  - `37` easy
  - `48` moderate
  - `32` hard
  - `8` deadly
- structure mix:
  - `60` two-step templates
  - `98` three-step templates

#### Borderland pack

- `20` templates in [borderland-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/borderland-encounter-content.ts)
- threat mix:
  - `8` trivial
  - `12` easy

#### Social pack

- `14` templates in [social-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/social-encounter-content.ts)
- threat mix:
  - `1` trivial
  - `3` easy
  - `7` moderate
  - `3` hard

### Overall conclusion

The current encounter data is content-rich but balance-fragile. It is best described as a strong authored library built on top of inconsistent tuning assumptions. The redesign should preserve the themes, prose, and reward vocabulary while replacing the numerical and consequence contract underneath.

---

## 2. Target Encounter Contract

Every authored encounter should assume the following runtime model.

### Core assumptions

- There are still 8 reaches.
- Basic agents start low and uneven, not competent at everything.
- Quintessence is current/max resilience and a power ceiling.
- Unified actions are the only real runtime action model.
- Most encounter failures should convert into cost, strain, delay, damage, corruption, or weakened completion.

### Step-level success bands

These are the intended probabilities for an appropriately matched actor attempting one step before spending extra resilience.

| Encounter band | Intended feel | Target step success |
|---|---|---|
| `trivial` | Bread-and-butter competence | `85-95%` |
| `easy` | Hero feels capable | `75-85%` |
| `moderate` | Meaningful risk, usually worth attempting | `60-75%` |
| `hard` | Tense and costly | `40-60%` |
| `deadly` | Serious danger, preparation expected | `25-45%` |
| `epic` | Late-game or ascension-tier | `10-25%` before spending/resources |

### Outcome ladder

Every encounter step should conceptually resolve into one of these outcome shapes:

- `critical_success`
- `success`
- `success_at_cost`
- `failure`
- `critical_failure`

Even if the implementation temporarily stores this as simpler booleans, authored content should already be written with these five meanings in mind.

### Quintessence and resilience expectations

Encounters should be authored assuming agents can:

- spend quintessence to push or resist
- absorb consequences through items, allies, blessings, and some possessions
- suffer strain through conditions, curses, and quintessence erosion

That means encounter authors should stop thinking only in terms of pass/fail and start thinking in terms of:

- What progress was made?
- What was spent?
- What new burden or opening was created?

---

## 3. Run Pace and Magnitude Model

This section translates the redesign into concrete pacing guidance for a game where:

- `1 tick = 1 second`
- an agent averages about `1 encounter every 5 ticks`
- a full hero journey should fit inside roughly `2-3 hours`

### Run-scale implication

At this cadence, a single hero has roughly:

- `2 hours` -> `7,200` ticks -> about `1,440` encounter opportunities
- `3 hours` -> `10,800` ticks -> about `2,160` encounter opportunities

That means the game cannot treat every encounter as a major event.

If every encounter gives:

- a permanent stat increase
- a durable item
- a large reputation swing
- or a severe persistent penalty

then the run will either explode upward too fast or collapse into clutter and attrition.

### Design conclusion

The encounter economy must be layered:

- **micro rewards/penalties** happen often
- **mid rewards/penalties** happen every few minutes
- **major milestones** happen every `5-15` minutes
- **phase-shift events** happen every `20-30` minutes

### Target milestone cadence

Use this as the default heroic-journey tempo.

| Beat size | Typical cadence | Real-time feel | Examples |
|---|---|---|---|
| Micro | every `3-8` encounters | every `15-40` seconds | small quintessence spend/recover, a temporary condition, a common consumable, minor reputation drift |
| Mid | every `15-30` encounters | every `75-150` seconds | a useful item, a blessing, a meaningful setback, a reach-progress threshold, a faction bump |
| Major | every `60-120` encounters | every `5-10` minutes | a reach tier-up, a new action family, a durable ally/item, quintessence-max growth, title change |
| Phase shift | every `240-360` encounters | every `20-30` minutes | village nobody -> local hero -> realm actor -> mythic figure -> ascension candidate |

### Quintessence pacing

At the current global setting, passive quintessence regeneration is `0.002` per tick in [quintessence.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/quintessence.ts#L35). At `1 encounter every 5 ticks`, that means an actor recovers about:

- `0.01` quintessence between average encounters
- a full normalized bar in `500` ticks, or about `8.3 minutes`

That is too fast if quintessence is meant to be the main resilience economy for a full hero journey.

#### Recommended regen target

If quintessence remains an always-on passive regen resource, the safer design band is:

- `0.0003-0.0007` passive regen per tick

That implies:

- `0.0015-0.0035` recovered between average encounters
- a full refill in roughly `24-56` minutes instead of `8.3`

This keeps quintessence meaningful while still allowing recovery over the course of a run.

#### Recommended quintessence magnitudes per encounter band

These are authoring-size guidelines for costs and recoveries on a normalized `0-1` quintessence scale.

| Band | Typical spend to push/resist | Failure or cost hit | Typical success-side recovery |
|---|---|---|---|
| `trivial` | `0.005-0.010` | `0-0.010` | `0-0.010` |
| `easy` | `0.010-0.020` | `0.010-0.020` | `0.005-0.015` |
| `moderate` | `0.020-0.040` | `0.020-0.050` | `0.010-0.030` |
| `hard` | `0.040-0.080` | `0.050-0.100` | `0.020-0.050` |
| `deadly` | `0.080-0.150` | `0.100-0.200` | `0.030-0.080` |
| `epic` | `0.150-0.250` | `0.200-0.350` | `0.050-0.120` |

Guidance:

- `trivial` should almost never be able to break an otherwise healthy hero
- `moderate` should steadily tax the bar
- `hard` should force spending decisions
- `deadly` and `epic` should be capable of changing the whole next phase of the run

### Condition and blessing durations

Because encounters happen fast, effect durations also need to be thought of in encounter-count terms.

| Duration class | Ticks | Approx encounter span | Use for |
|---|---|---|---|
| Fleeting | `20-60` | `4-12` encounters | rattled, winded, inspired, lucky break |
| Short | `60-180` | `12-36` encounters | injuries, bargains, temporary boons, marked status |
| Long | `180-600` | `36-120` encounters | curses, scars, sworn aid, powerful blessings |
| Persistent | `600+` or explicit removal | `120+` encounters | trauma, destiny marks, divine favor, major corruption |

### Growth pacing for reaches

Because encounter frequency is so high, most encounter resolution should not grant large direct permanent reach increases.

#### Preferred model

Use encounters to grant:

- progress toward reach growth
- not large direct reach value jumps

That progress can be represented as:

- hidden experience
- advancement pips
- practice traits
- milestone counters

#### If keeping direct numeric growth

The current base encounter growth constant is `0.5` in [agent-behavior-constants.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/agent-behavior-constants.ts#L166). That is much too hot for a hero journey with hundreds or thousands of encounter opportunities.

If encounter growth continues to feed directly into raw reach contribution, safer default sizes are:

- `trivial` success: `0-0.005`
- `easy` success: `0.005-0.015`
- `moderate` success: `0.010-0.020`
- `hard` success: `0.015-0.030`
- `deadly` success: `0.025-0.050`
- `epic` success: `0.040-0.080`

Failure or success-at-cost growth should usually be:

- `25-50%` of success growth

This keeps early progress visible while preserving enough runway for a full run.

### Reputation pacing

Reputation deltas in encounter content should be small by default because the encounter count is very high.

Recommended bands:

- micro reputation shift: `0.005-0.015`
- solid encounter win/loss: `0.015-0.035`
- major public feat or disgrace: `0.040-0.080`
- anything above `0.10` should be rare and phase-defining

### Reward size bands

Encounters should produce different sizes of rewards.

#### Micro rewards

Give these often.

- one-use consumable
- minor salvage item
- small quintessence restore
- fleeting blessing
- tiny reputation shift

#### Mid rewards

Give these every few minutes.

- 2-3 use item
- ally that absorbs one consequence
- long blessing
- moderate condition removal
- a small quintessence-max increase

#### Major rewards

Give these on milestone beats.

- durable named item
- permanent ally or oath
- new action tag/family
- a real reach tier-up
- a meaningful quintessence-max increase

### Suggested quintessence-max growth cadence

If the run is meant to go from humble mortal to ascension candidate:

- early-game milestone increase: `+0.01 to +0.02`
- mid-game milestone increase: `+0.02 to +0.04`
- major mythic milestone increase: `+0.04 to +0.08`

These should happen on major beats, not routine encounter resolution.

### Inventory and attachment bloat rule

Because the encounter rate is high, most rewards should not become permanent clutter.

Healthy distribution:

- `60-75%` of rewards: consumable, decaying, or narrow-use
- `20-30%` of rewards: medium-duration attachments or conditions
- `5-10%` of rewards: durable, identity-shaping assets

### Penalty sizing rule

Setbacks should slow and redirect the run more often than they brick it.

Default penalty logic:

- a normal setback should matter for the next `5-20` encounters
- a serious setback should matter for the next `20-60` encounters
- a run-defining setback should be rare, telegraphed, and usually paired with strong upside or a major fiction change

### Fail-forward pacing rule

To keep the game motivating at this speed:

- a failed step should usually still give the player a new state to react to
- a penalty should usually create the next decision, not erase the current thread
- an encounter should not often end with "nothing happened"

If an authored failure does not change at least one of:

- quintessence
- conditions
- rewards
- available future choices
- time position
- world state

then it is probably too weak to be interesting.

---

## 4. Guidelines for Modifying Existing Encounters

These rules are for refactoring the current catalog without rewriting everything from scratch.

### 1. Normalize threat by target play experience, not by content pack

Refactor each pack so `trivial`, `easy`, `moderate`, `hard`, and `deadly` mean the same thing everywhere.

Do:

- lower early-content numeric difficulty so starter agents can succeed in true low-tier content
- move pack-specific difficulty flavor into duration, consequences, and reward type
- keep faction, social, and magical content distinct in feel without giving them private difficulty languages

Do not:

- use `easy` to mean "easy for experts in this faction"
- use `hard` as a catch-all for "important story moment"

### 2. Convert most early and mid-step failures into weakened continuation

When revising legacy encounters for unified actions:

- first steps should usually be `continue_weakened`
- middle steps should usually be `continue_weakened`
- final steps can be `fail_action` when the fiction truly collapses

Good `continue_weakened` consequences:

- lose quintessence
- gain a temporary condition
- consume a useful item
- downgrade the reward tier
- add time or noise
- create a hostile follow-up state

Bad `continue_weakened` consequences:

- "nothing happens"
- "the encounter ends and you leave"
- "same as failure but with slightly nicer prose"

### 3. Reduce promotion density

For revised encounters:

- use `tierPromotionEligible` at most once per template in most cases
- place it on the decisive success beat, usually the final step
- reserve multiple promotion-eligible beats for long-form legendary content only

As a rule of thumb:

- `trivial`: never promotion eligible
- `easy`: rarely
- `moderate`: sometimes
- `hard`: often on final success
- `deadly/epic`: usually on final success, possibly stronger growth multiplier

### 4. Make failure rewards clearly costly or compromised

When a failure outcome still uses a reward pool, it should signal one of these:

- salvage
- corruption
- harm
- debt
- tainted gain
- dangerous knowledge

Failure reward pools should skew toward:

- `condition`
- `curse`
- occasionally `possession` as salvage
- occasionally `bestowed_power` only when it is dangerous or warped

Success reward pools should skew toward:

- `possession`
- `ally` or equivalent agreement/blessing outcomes
- `bestowed_power`
- positive conditions only when clearly framed as boons

### 5. Rewrite failure prose as complication, not incompetence

Refactor prose so the actor still acts and the world still changes.

Prefer:

- "The wards hold, but only after draining the caster."
- "The beast retreats deeper, leaving the hunter wounded but wiser."
- "The pact is signed, though under terms that will hurt later."

Avoid overusing:

- "The actor fails."
- "The actor gives up."
- "Nothing is gained."

### 6. Use quintessence pressure as a content dial

When revising encounters, decide deliberately whether a beat should tax:

- reputation
- quintessence
- attachments
- time
- future safety

Not every encounter should hit quintessence, but any encounter that is meant to feel dangerous should threaten it directly or indirectly.

Suggested revision rule:

- `trivial`: little or no quintessence loss
- `easy`: low quintessence risk on failure
- `moderate`: regular quintessence cost on failure or weakened success
- `hard`: significant quintessence pressure
- `deadly/epic`: major quintessence pressure plus persistent downside risk

### 7. Keep step count meaningful

When revising existing templates:

- 2 steps is best for trivial/easy
- 2-3 steps is best for moderate/hard
- 3 steps is best for deadly/epic
- avoid making content longer just to make it feel important

If a template is long, each step must justify itself by changing one of:

- reach tested
- fictional position
- cost mode
- reward horizon

### 8. Preserve thematic identity, change the consequence contract

The prose and fantasy of the current packs are worth keeping. The main thing to rewrite is not the premise of the encounters, but:

- what failure means
- what rewards mean
- how much growth is attached
- how the unified action fail behavior is assigned

---

## 5. Encounter Authoring Standard for Future Content

This section is the future-safe authoring contract.

### A. Required template shape

Every new encounter should define:

- a clear `reachPrimary`
- a support or contrasting `reachSecondary`
- a threat band with a game-wide meaning
- 2-3 meaningful steps
- a consequence model that supports fail-forward
- one clear reward identity

### B. Reach usage rules

Use reaches to express the kind of challenge, not just the theme of the prose.

Examples:

- `iron`: force, endurance, martial dominance
- `heart`: persuasion, nerve, emotional authority
- `eye`: perception, deduction, pattern reading
- `shadow`: stealth, deceit, indirect control
- `veil`: magic, ritual, occult fluency
- `gold`: wealth, leverage, bargaining, logistics
- `stone`: structure, crafting, fortification, material mastery
- `star`: navigation, destiny, vision, far-seeing patterning

Guideline:

- step 1 should often test setup, reading, approach, or positioning
- step 2 should often test execution
- step 3, if present, should test culmination, price, or transformation

### C. Fail behavior rules

Default policy:

- step 1: `continue_weakened`
- step 2: `continue_weakened` unless the fiction truly breaks
- step 3: `fail_action` only when the action really cannot proceed

Only use `fail_action` on early steps if:

- the encounter premise logically collapses
- there is already enough low-risk content in the same band
- the actor had strong forecast information that this was a gamble

### D. Promotion rules

Promotion should mark a meaningful accomplishment.

Default:

- zero or one `tierPromotionEligible` success beats per template
- final step only
- early-tier content should teach, not elevate too quickly

### E. Reward rules

Each encounter should have one dominant reward identity:

- material
- social
- occult
- strategic
- dangerous knowledge
- resilience

If the encounter has reward pools:

- put them mostly on final outcomes
- make success rewards constructive
- make failure rewards compromised or harmful

### F. Quintessence rules

Every authored encounter should answer:

1. What threatens the actor's quintessence here?
2. What could the actor spend to stay in the game?
3. What condition, curse, ally, item, or blessing interacts with that cost?

If the encounter cannot answer those questions, it is probably too disconnected from the redesigned system.

### G. Threat rules

Threat is not just numeric difficulty. It is the total pressure package:

- probability
- duration
- quintessence risk
- persistence of consequences
- reward quality

Do not stack all pressure dimensions at once unless the encounter is meant to be deadly or epic.

Bad combination for mid-tier content:

- low odds
- long duration
- hard-stop fail
- heavy quintessence loss
- curse-heavy failure reward
- no meaningful upside

### H. Future `epic` guidance

Until the data model explicitly supports `epic`, author epic encounters as:

- `threatRating: 'deadly'`
- 3-step structure
- high rarity
- high quest priority
- explicit quintessence drain or spend requirement
- final beat that changes long-term state, not just grants loot

---

## 6. Recommended Revision Order

Refactor the catalog in this order.

### Phase 1: Make the catalog psychologically safe

- re-normalize low-tier content
- reduce hard-stop failure in starter and mid-tier encounters
- reduce promotion flag density

### Phase 2: Make consequences meaningful

- introduce quintessence cost semantics into encounter outcomes
- rewrite failure prose toward complications
- split reward logic into constructive success vs compromised failure

### Phase 3: Make unified actions the source of truth

- convert revised encounters into unified action templates with deliberate `failBehavior`
- preserve multi-step arcs
- preserve reward pool identity
- preserve consequence meaning

### Phase 4: Add late-game authored content

- create a real authored ladder from trivial to deadly, then epic
- reserve epic content for mythic or ascension-adjacent play

---

## 7. Encounter QA Checklist

Before shipping a new or revised encounter, verify all of the following.

- The threat label means the same thing it means everywhere else.
- The intended actor has a believable chance of success for that tier.
- At least one failure result still changes the world or the actor's state meaningfully.
- The encounter does not rely on hard-stop failure unless that is essential.
- The reward identity is clear.
- If the encounter gives a failure reward, that reward is compromised, harmful, or clearly salvage.
- Promotion eligibility is sparse and intentional.
- Quintessence pressure is either present on purpose or intentionally absent.
- The encounter would still feel interesting if the actor failed the first step.
- The encounter can be migrated into unified actions without losing its meaning.

---

## 8. Short Authoring Heuristics

Use these when writing quickly.

- Low-tier content should build confidence.
- Mid-tier content should trade certainty for texture.
- High-tier content should demand spending and preparation.
- Failure should usually bend the story, not stop it.
- Rewards should often solve tomorrow's problem, not just celebrate today's win.
- If an encounter cannot interact with quintessence or attachments in any way, it is probably too thin.
- If a template has more than one "main event," it should probably be split into two encounters.
