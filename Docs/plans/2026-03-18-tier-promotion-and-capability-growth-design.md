# Tier Promotion & Capability Growth — Design Doc

**Date:** 2026-03-18
**Status:** Design complete, pending implementation
**Depends on:** Agent Decision & Encounter Awareness (`2026-03-18`), Encounter Resolution & Divine Intervention (`2026-03-18`)
**Connects to:** Domain Capability system (`domainCapability.ts`), Ambition system, Meet The First journey

## Problem

Agents don't grow through play. The capability system computes a sigmoid over graph edge weights (traits, artifacts, resources), producing a 0–1 capability per reach domain. But nothing in the encounter system adds to those edge weights. An agent who completes 50 Iron encounters is no stronger than one who completed 0 — their capability is determined entirely by what traits they were born with and what items they carry.

The `tierPromotionEligible` flag on encounter outcomes is a dead stub — no code reads it, no promotion system exists, no growth tracking exists. The tier system itself (1-10, derived from `ceil(capability * 10)`) is a pure derivation with no events, no narrative moments, and no player visibility.

The result: agents are static. Their capabilities are set at creation and only change through external graph mutations (gaining an artifact, acquiring a trait through a scripted event). There's no sense of characters growing through their experiences.

## Design Principles

1. **Growth is encounter-driven.** Agents get stronger by doing things, not by waiting. Every successful encounter step in a reach domain makes the agent fractionally better in that domain.

2. **Tier promotion is a narrative moment.** When capability crosses a tier boundary, the player sees a story vignette — the god observing their agent's growth. This is a signal: "this agent is becoming someone. Maybe invest in them."

3. **Promotion is recognized, not gated.** Capability growth is continuous (sigmoid). Tier boundaries are milestone markers that trigger events, not gates that require special encounters to pass. The `tierPromotionEligible` flag becomes a modifier on *how much* growth a step grants, not a binary gate on promotion.

4. **Visible signifiers make growth legible.** Tier crossings produce visible changes: new traits, title upgrades, faction rank bumps, court position upgrades. The player sees the change without reading a stat sheet.

## Design Decisions

### Decision 1: Encounter-Driven Trait Accumulation

**Chosen:** Successful encounter steps add a small trait contribution to the step's reach domain. This is the growth mechanism — each success makes the agent fractionally stronger, and the sigmoid handles diminishing returns naturally.

**Mechanic:**

When an encounter step resolves successfully:

```
growthAmount = BASE_ENCOUNTER_GROWTH
             × (tierPromotionEligible ? PROMOTION_ELIGIBLE_MULTIPLIER : 1.0)
             × difficultyScaling(step.difficulty)
             × (1.0 - currentCapability × DIMINISHING_RETURNS_FACTOR)
```

The growth is applied by adding to (or creating) an `encounter_experience` trait edge with a domain contribution for the step's reach:

```
trait: "encounter_experience_{domain}"
  domainContributions: { [step.reach]: += growthAmount }
  level: accumulated total
```

This trait is a synthetic "experience" trait distinct from the agent's innate formative traits. It represents learned capability from practice. The existing `computeRawScore` walks all `has_trait` edges, so it picks up this accumulated experience automatically — no changes to the capability computation needed.

**Why trait accumulation instead of a separate XP system?** The capability system already reads from trait edges. Adding a parallel "XP" tracking system would mean two numbers that need to agree about how strong an agent is. By using the existing trait infrastructure, growth feeds directly into the same sigmoid that everything else reads. One source of truth.

**Difficulty scaling:** Harder encounters grant more growth. Trivial encounters grant almost nothing — you don't learn much from something you could do in your sleep.

```
difficultyScaling(difficulty):
  if difficulty < 20: return 0.2   // trivial — minimal learning
  if difficulty < 40: return 0.5   // easy — some learning
  if difficulty < 60: return 1.0   // moderate — full learning
  if difficulty < 80: return 1.3   // hard — accelerated learning
  return 1.5                       // deadly — intense learning
```

**Diminishing returns:** The `(1.0 - currentCapability × DIMINISHING_RETURNS_FACTOR)` term means agents near the sigmoid cap gain less per encounter. An agent at capability 0.1 gets full growth. An agent at 0.8 gets much less. This naturally creates the "easy to start, hard to master" curve and prevents runaway growth.

**`tierPromotionEligible` reinterpretation:** The flag on encounter outcomes is no longer a gate — it's a multiplier. Promotion-eligible steps grant `PROMOTION_ELIGIBLE_MULTIPLIER` × more growth than non-eligible steps. Mid-to-late encounter steps (the challenging climaxes) are promotion-eligible and give bigger growth chunks. Easy first steps are not, and give minimal growth.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `BASE_ENCOUNTER_GROWTH` | 0.5 | Base raw score contribution per successful step |
| `PROMOTION_ELIGIBLE_MULTIPLIER` | 2.0 | Growth multiplier for promotion-eligible steps |
| `DIMINISHING_RETURNS_FACTOR` | 0.7 | How aggressively growth diminishes at high capability |
| `FAILURE_GROWTH_FRACTION` | 0.2 | Fraction of normal growth granted on failure (you learn from failure too) |
| `CRITICAL_SUCCESS_MULTIPLIER` | 1.5 | Extra growth on critical success |
| `CRITICAL_FAILURE_GROWTH` | 0.0 | No growth on critical failure (too catastrophic to learn from) |

**Tracing:**

```typescript
interface CapabilityGrowthTrace {
  tick: number;
  category: 'capability_growth';
  agentId: string;
  domain: ReachDomain;
  encounterId: string;
  stepId: string;
  success: boolean;
  baseGrowth: number;
  promotionMultiplier: number;
  difficultyScale: number;
  diminishingFactor: number;
  finalGrowth: number;
  previousCapability: number;
  newCapability: number;
  previousTier: number;
  newTier: number;
  tierCrossed: boolean;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent has no experience trait for domain | Create one with initial contribution = growthAmount |
| Capability computation fails after growth | Revert trait addition, log warning |
| Growth amount is negative (shouldn't happen) | Clamp to 0 |
| Step has no reach domain | Skip growth, log warning |

**PRNG:** Not needed — growth is deterministic from encounter outcome and current state.

### Decision 2: Tier Crossing Detection and Promotion Event

**Chosen:** After each encounter step that grants growth, check if the agent's tier in the step's reach domain changed. If it crossed upward, trigger a promotion event — a composite of narrative vignette, visible signifiers, and system notifications.

**Detection:**

```
previousTier = computeTier(previousCapability)
newTier = computeTier(newCapability)
if newTier > previousTier → trigger promotionEvent(agent, domain, previousTier, newTier)
```

This is checked after every growth application, not on a timer. Promotion happens immediately when it happens — the player sees it in the context of the encounter that caused it.

**Promotion event components:**

#### 1. Narrative Vignette

A tier promotion generates a Tier 1 vignette notification (always prompt, regardless of divine attention level). This uses the same prose engine infrastructure from the Resolution & Intervention doc (Decision 5), but with a promotion-specific resolver registry:

```typescript
const PROMOTION_VIGNETTE_RESOLVERS: ProseResolver[] = [
  promotionSceneResolver,      // What the agent just accomplished + growth context
  promotionLensResolver,       // Ascendant perceives the change through their sphere
  promotionSignificanceResolver, // What this means for the agent's future
];
```

The vignette reads like a narrative observation, not a level-up screen: "You feel the shift in her — the iron in her spine has hardened. The girl who faltered at the labyrinth entrance now carries the abyss in her eyes. She is not what she was."

The promotion vignette has no intervention choice — it's informational. The player watches and understands. But it serves as a **signal** that this agent is worth investing in.

#### 2. Visible Trait Signifier

Each tier crossing grants a visible narrative trait that appears on the agent's profile. These are drawn from the existing Narrative Lexicon (Domain Word Scales) and serve as readable badges of achievement:

```
Tier 2 in Iron → gains trait: "Blooded"
Tier 4 in Iron → gains trait: "Forged in Battle"
Tier 6 in Iron → gains trait: "Warblade"
Tier 8 in Iron → gains trait: "Living Weapon"
```

These are purely narrative — they don't have mechanical effects (the capability itself handles that). They exist so the player and the prose engine can reference them. "The Warblade strode into the marketplace" reads better than "the Iron tier-6 agent walked somewhere."

The traits come from a content table: `PROMOTION_TRAITS: Record<ReachDomain, Record<number, string>>` — one entry per reach per even tier (promotions at tiers 2, 4, 6, 8, 10 get traits; odd-tier crossings are smaller milestones).

#### 3. Faction Rank Bump

If the agent is in a faction whose `reachPreferences` primary reach matches the promoted domain, their faction rank increases by `FACTION_RANK_PER_PROMOTION`. A Gold-reach promotion for a Merchant Guild member bumps their guild rank. An Iron promotion for the same merchant doesn't affect their guild rank (wrong domain).

This directly feeds Decision 3 in the Agent Decision doc — higher faction rank means more faction intelligence. Growth in your faction's domain makes you a better-connected member.

#### 4. Court Position Upgrade

If the agent is in the player's court, check if the new tier qualifies them for a higher court position. Court position thresholds are content-defined. This is a future integration point — the court system isn't fully designed yet.

#### 5. Encounter Access Expansion

Higher tier means higher capability, which means the threat gate in the filter pipeline (Agent Decision doc, Decision 6, Filter 4) admits harder encounters. The agent naturally starts seeing and attempting harder challenges. This isn't a separate system — it's an automatic consequence of the capability increase flowing through the existing scoring pipeline.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROMOTION_VIGNETTE_ALWAYS_TIER_1` | true | Tier promotions always generate Tier 1 notifications |
| `PROMOTION_TRAIT_TIERS` | [2, 4, 6, 8, 10] | Which tier crossings grant visible narrative traits |
| `FACTION_RANK_PER_PROMOTION` | 0.1 | Faction rank increase when domain matches faction primary reach |
| `FACTION_RANK_SECONDARY_FRACTION` | 0.05 | Fraction of rank increase for secondary-reach promotions |

**Tracing:**

```typescript
interface TierPromotionTrace {
  tick: number;
  category: 'tier_promotion';
  agentId: string;
  domain: ReachDomain;
  previousTier: number;
  newTier: number;
  triggeringEncounter: string;
  triggeringStep: string;
  traitGranted?: string;
  factionRankChange?: { factionId: string; oldRank: number; newRank: number };
  vignetteGenerated: boolean;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Promotion trait table has no entry for domain × tier | Skip trait grant, still trigger vignette |
| Faction rank update fails | Log warning, skip faction rank, continue with other promotion effects |
| Vignette generation fails | Log warning, still apply mechanical effects (trait, rank) |
| Agent promoted multiple tiers in one step (extreme edge case) | Trigger one promotion event for the final tier, note the skip in trace |

### Decision 3: Payoff Estimation Integration

**Chosen:** The encounter scoring system (Agent Decision doc, Decision 7) can now value growth potential. The `successRewardEstimate` on encounter cache entries gains a growth component that scales with how close the agent is to their next tier boundary.

**Enhancement to successRewardEstimate:**

```
successRewardEstimate =
  Σ(step.onSuccess.reputationDelta × REPUTATION_REWARD_WEIGHT)
  + (hasAnyRewardPool ? LOOT_REWARD_WEIGHT : 0)
  + DOMAIN_EXERCISE_WEIGHT
  + growthValue

where:
  growthValue = estimatedGrowth × proximityToNextTier × GROWTH_REWARD_WEIGHT

  estimatedGrowth = BASE_ENCOUNTER_GROWTH × difficultyScaling × promotionMultiplier
  proximityToNextTier = 1.0 - (distanceToNextTierBoundary / tierWidth)
    → approaches 1.0 as agent nears the boundary, 0.0 right after promoting
```

This means: an agent at 95% of the way to tier 5 values tier-promotion-eligible encounters **much** more than one who just reached tier 4. The scoring naturally drives agents toward encounters that will push them over the edge — which is exactly the "seeking the next challenge" behavior we want.

**Impact on agent behavior:** Early-game agents (tier 1-2) value growth highly because every encounter gives meaningful capability improvement. Mid-game agents (tier 4-5) seek specific promotion-eligible encounters to push through tier boundaries. Late-game agents (tier 7+) get diminishing growth returns and focus more on ambition milestones and reward payoffs — growth matters less because the sigmoid flattens.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `GROWTH_REWARD_WEIGHT` | 0.4 | Weight of growth value in successRewardEstimate |
| `PROXIMITY_EXPONENT` | 2.0 | Exponent on proximity-to-tier — higher values make near-threshold encounters much more attractive |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Can't compute proximity to next tier | Use flat DOMAIN_EXERCISE_WEIGHT instead |
| Agent already at max tier (10) | Growth value = 0 (no growth possible) |

## Schema Changes Required

### Experience Trait — New Synthetic Trait Type

```typescript
// Experience traits are auto-created and managed by the growth system
// They follow the existing trait infrastructure but have a special category
interface ExperienceTrait {
  type: 'experience';
  domain: ReachDomain;
  domainContributions: DomainContributions;  // accumulated from encounter successes
  accumulatedGrowth: number;  // total raw growth applied (for debugging)
}
```

These traits are created lazily on first growth application and updated in-place on subsequent growth.

### Promotion Trait Content Table

```typescript
// New content table in a data file
const PROMOTION_TRAITS: Record<ReachDomain, Partial<Record<number, string>>> = {
  iron: { 2: 'Blooded', 4: 'Forged in Battle', 6: 'Warblade', 8: 'Living Weapon', 10: 'Avatar of Iron' },
  gold: { 2: 'Shrewd', 4: 'Merchant Prince', 6: 'Master of Coin', 8: 'Gilded Hand', 10: 'Avatar of Gold' },
  // ... 7 more reaches
};
```

Content authoring work — 5 entries per reach × 9 reaches = 45 promotion traits to name.

### Promotion Vignette Content Tables

Same infrastructure as Decision 5 in the Resolution doc — sphere-flavored scene fragments, lens sentences, significance phrases. Content for promotion-specific resolvers. Can start with defaults and 4 key spheres, expand incrementally.

## Architectural Dependencies

### 1. Domain Word Scales / Narrative Lexicon Review (Priority: Low)

The existing `NARRATIVE_LEXICON` in `types/traits.ts` already has 10-tier labels per domain. These should be reviewed for consistency with the new promotion trait names. The lexicon labels are for prose generation ("a capable warrior"); the promotion traits are achievement badges ("Warblade"). They serve different purposes and should complement, not contradict.

### 2. Court System Integration (Priority: Low — Future)

Court position upgrades on tier promotion require the court system to define position thresholds. This is a forward integration point — the promotion system fires a `court_promotion_eligible` event that the court system can listen for once it exists.

## Performance Considerations

Growth application: 1 trait edge update per successful encounter step. This is a single graph mutation — O(1).

Tier crossing check: 2 calls to `computeCapability` (before and after growth) per step. Each is a graph walk of trait + artifact + resource edges — typically O(10-20) edge reads. Already happening during resolution; the second call is the marginal cost.

Promotion event: vignette generation + trait creation + optional faction update. All O(1) graph operations. The vignette prose generation is the same cost as any prose resolver chain — negligible.

Total: ~20-30 additional operations per encounter step resolution. Across ~50 encounter steps per tick = ~1,500 operations. Negligible.

## NFP Compliance Summary

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | Growth rate, diminishing returns, difficulty scaling, proximity exponent — all named constants |
| 2 | Inspectability | PASS | Full growth trace per step showing every component. Promotion trace with all effects. |
| 3 | Determinism | PASS | Growth is deterministic from encounter outcome + current state. No randomness in growth or tier detection. |
| 4 | Fail-soft | PASS | Missing traits created lazily. Failed promotions log warnings, don't crash. Vignette failures don't block mechanical effects. |
| 5 | Narrative over mechanical | PASS | Tier promotion is primarily a narrative moment — vignette, trait name, title change. The mechanical effect (capability increase) is a byproduct of the narrative event, not the other way around. |
| 6 | Additive over destructive | PASS | Adds growth system alongside existing capability computation. No changes to `computeCapability`, `computeRawScore`, or `computeTier`. Experience traits are a new category that flows through existing infrastructure. |
| 7 | Performance budget | PASS | ~1,500 additional lightweight operations per tick. All O(1) graph operations. |
