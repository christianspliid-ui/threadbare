# Encounter Resolution Overhaul & Divine Intervention — Design Doc

**Date:** 2026-03-18
**Status:** Design complete, pending implementation
**Depends on:** Agent Decision & Encounter Awareness (`2026-03-18`), Generalized Action Targeting (`2026-03-17`)
**Brainstorm source:** `Brainstorms/brainstorm-meet-the-first.md` (Unified Vignette System section)

## Problem

The encounter resolution formula is a stub:

```
P = capability + 0.1 + 0.5 - difficulty/100
```

`ENCOUNTER_SPHERE_FACTOR = 0.1` and `ENCOUNTER_DIFFICULTY_MODIFIER = 0.5` are hardcoded constants with no context sensitivity. Two agents with identical capability have identical odds regardless of sphere alignment, equipment, traits, terrain, or divine support. The formula effectively reduces to `capability + 0.6 - normalizedDifficulty`.

This means:
- Sphere alignment — the second axis of the cosmology — has zero mechanical effect on encounter resolution
- Equipment/possessions exist in the graph but don't help in encounters
- Agent traits (formative, behavioral) have no resolution impact
- Terrain/location advantages don't exist
- The player has no way to influence an agent's encounter outcomes

The resolution system's d100 roll, critical success/failure bands, and outcome classification are solid. The probability calculation feeding into them is the problem.

Additionally, the brainstorm for "Meet The First" describes a Unified Vignette System where the player watches important encounters unfold and intervenes as a divine presence — pulling threads, nudging outcomes. This requires the resolution system to accept a player-driven modifier and the game to surface encounters as interactive moments.

## Design Principles

1. **Modifiers are additive, named, and traceable.** Each factor that influences probability is a separate term in the formula with its own constant, its own trace entry, and its own fail-soft. No opaque combined bonuses.

2. **The player intervenes through resource commitment, not authority.** The god doesn't dictate outcomes — they spend essence to tilt probability. The cost grows exponentially per percentage point, making small nudges cheap and large interventions dramatically expensive.

3. **Sphere alignment finally matters mechanically.** The cosmology's second axis (Spheres) has been defined, themed, and integrated into the world model but never affected encounter resolution. This design fixes that.

4. **Vignettes reuse the encounter system.** Divine intervention scenes are not a new system — they're a configuration of the existing encounter infrastructure with a player choice-point step type, exactly as described in the Meet The First brainstorm.

## Design Decisions

### Decision 1: Modifier Pipeline Replaces Flat Constants

**Chosen:** The probability formula becomes a sum of named modifiers, each computed independently:

```
P = clamp(
    capability
  + sphereAlignmentBonus
  + equipmentModifier
  + terrainModifier
  + traitBonus
  + divineInterventionModifier
  - difficulty
, 0.05, 0.95)
```

**What it replaces:**
- `ENCOUNTER_SPHERE_FACTOR = 0.1` → replaced by computed `sphereAlignmentBonus`
- `ENCOUNTER_DIFFICULTY_MODIFIER = 0.5` → retired entirely (this was compensating for the missing modifiers)

**Why additive?** Multiplicative modifiers create compounding effects that are hard to tune and harder to trace. Additive modifiers are transparent: each one contributes a visible delta to the final probability. The player (and the trace system) can see exactly what helped and what hurt.

**Each modifier in detail:**

#### Sphere Alignment Bonus

Compares the agent's sphere affinity against the encounter's `sphereAffinity`. If the encounter has no sphere affinity, this modifier is 0.

```
if agent sphere matches encounter sphere → +SPHERE_ALIGNMENT_BONUS
if agent sphere opposes encounter sphere → +SPHERE_OPPOSITION_PENALTY (negative)
if no match or no encounter sphere       → 0
```

Sphere opposition is defined by the existing cosmological pairings (e.g., Life opposes Entropy, Light opposes Darkness, Order opposes Chaos).

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `SPHERE_ALIGNMENT_BONUS` | 0.10 | Probability bonus when agent's sphere matches encounter sphere |
| `SPHERE_OPPOSITION_PENALTY` | -0.10 | Probability penalty when agent's sphere opposes encounter sphere |
| `SPHERE_PARTIAL_BONUS` | 0.05 | Bonus for adjacent/related sphere (same Foundation family) |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent has no sphere affinity | Bonus = 0 |
| Encounter has no sphereAffinity | Bonus = 0 |
| Sphere opposition lookup fails | Bonus = 0 |
| `SPHERE_OPPOSITIONS` table doesn't exist yet | All sphere alignment bonuses = 0. System works without it, just without sphere differentiation. This is the expected state until the opposition table is authored. |

#### Equipment Modifier

Checks the agent's attached possessions for items relevant to the encounter's reach domain. A sword helps in Iron encounters. A tome helps in Eye encounters. A holy symbol helps in Star encounters.

```
equipmentModifier = Σ(attachment.reachBonus[step.reach]) for all agent attachments
  capped at EQUIPMENT_MODIFIER_CAP
```

This requires attachments to carry a `reachBonus: Partial<Record<ReachDomain, number>>` property. Many already have category and subcategory data that implies reach relevance — this makes it explicit.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `EQUIPMENT_MODIFIER_CAP` | 0.15 | Maximum total equipment bonus (prevents stacking) |
| `EQUIPMENT_PER_ITEM_CAP` | 0.08 | Maximum bonus from a single item |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent has no attachments | Modifier = 0 |
| Attachment has no reachBonus | Skip that attachment |
| Total exceeds cap | Clamp to EQUIPMENT_MODIFIER_CAP |

#### Terrain Modifier

Checks the encounter location's terrain and ownership for situational advantage. Fighting in a fortress you control is easier. Casting spells at a leyline nexus is easier. Trading at a hostile market is harder.

```
terrainModifier = locationAdvantage + controlBonus
  where locationAdvantage comes from TERRAIN_RESOLUTION_MODIFIERS[terrainType]
  and controlBonus is one of (mutually exclusive):
    +FACTION_CONTROL_BONUS  if agent's faction controls this location
    +HOSTILE_TERRITORY_PENALTY (negative)  if a hostile faction controls it
                                           (hostile = faction with negative trust toward agent's faction)
    0  if location is uncontrolled or controlled by a neutral faction
```

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `TERRAIN_RESOLUTION_MODIFIERS` | `Record<TerrainType, number>` | Per-terrain bonus/penalty (e.g., fortress: +0.05, swamp: -0.05) |
| `FACTION_CONTROL_BONUS` | 0.05 | Bonus for encounters at locations your faction controls |
| `HOSTILE_TERRITORY_PENALTY` | -0.05 | Penalty for encounters at locations controlled by hostile factions |
| `TERRAIN_MODIFIER_CAP` | 0.10 | Maximum total terrain modifier |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Location has no terrain data | Modifier = 0 |
| Terrain type not in modifier table | Modifier = 0 |
| Faction control lookup fails | Skip control bonus |

#### Trait Bonus

Checks the agent's formative and behavioral traits for bonuses relevant to the encounter's reach domain or encounter type. A trait like "battle-hardened" helps in Iron encounters. "Silver-tongued" helps in Gold or Heart encounters.

```
traitBonus = Σ(trait.resolutionBonus[step.reach] ?? trait.resolutionBonus[encounter.encounterType])
  for all agent traits
  capped at TRAIT_BONUS_CAP
```

This requires traits to carry a `resolutionBonus: Partial<Record<ReachDomain | EncounterType, number>>` property. Many traits already have reach associations — this makes the resolution impact explicit.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `TRAIT_BONUS_CAP` | 0.10 | Maximum total trait bonus |
| `TRAIT_PER_BONUS_CAP` | 0.05 | Maximum bonus from a single trait |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent has no traits | Bonus = 0 |
| Trait has no resolutionBonus | Skip that trait |
| Total exceeds cap | Clamp to TRAIT_BONUS_CAP |

#### Divine Intervention Modifier

See Decision 3 for the full divine intervention system. The modifier here is the probability bonus purchased by the player through essence expenditure.

```
divineInterventionModifier = essenceSpent as probability bonus (0.0 to ~0.15 practical max)
```

This modifier is 0 for encounters where the player does not intervene (the vast majority).

**Tracing (full pipeline):**

```typescript
interface ResolutionModifierTrace {
  tick: number;
  category: 'resolution_modifiers';
  agentId: string;
  encounterId: string;
  stepId: string;
  capability: number;
  sphereAlignmentBonus: number;
  equipmentModifier: number;
  terrainModifier: number;
  traitBonus: number;
  divineInterventionModifier: number;
  difficulty: number;
  rawProbability: number;        // before clamp
  clampedProbability: number;    // after clamp
  summary: string;
}
```

**PRNG:** Not needed — modifier computation is deterministic. The d100 roll uses existing seeded PRNG.

### Decision 2: Encounter Vignette Notification System

**Chosen:** A significance-gated notification system determines when the player sees agent encounters as interactive vignettes. The default threshold is high — only encounters where something meaningful is at stake. The player can proactively lower the threshold for specific agents or situations through divine actions.

**Design intent:** The player should never see "your merchant is haggling over grain — will you intervene?" That's noise. Vignettes should feel like dramatic moments where the god's attention is warranted: the agent's life is at risk, a critical ambition milestone hangs in the balance, or a journey beat is unfolding. The player actively chooses to pay closer attention to specific agents through divine actions — the game doesn't spam them.

**Three notification tiers:**

- **Tier 1 — Significant encounters with bonded agents:** Always prompt the player with a narrative vignette. The player can intervene, watch, or dismiss. Significant means the encounter clears the significance threshold (see below).
- **Tier 2 — Routine encounters with bonded agents, or significant encounters within divine awareness:** Optional notification in the narrative log. Player can expand to see the vignette and intervene, but isn't prompted. Serves as a "you could look at this if you want" signal.
- **Tier 3 — Everything else within divine awareness:** Silent chronicle entry. Player can find it in the history but is never notified. Intervention still possible if they dig it up, but at higher cost.

**Significance threshold (default — high bar):**

An encounter is significant when ANY of these conditions are met:

| Condition | Why it matters | Example |
|-----------|---------------|---------|
| Threat rating ≥ hard | Agent could die or suffer serious consequences | "Your agent faces a deadly ritual" |
| Ambition milestone encounter | The encounter directly serves an active ambition milestone | "Your agent has found the market she needs to control" |
| Journey beat (The First only) | The First's sub-ambition crisis point — the hero's trial | "The Ordeal awaits" |
| `questPriority` ≥ 2.0 | Content-flagged as major narrative event | Quest encounters, world events |
| Agent relationship is critical | Bond is strained/breaking — intervention might save or doom it | "Your champion doubts your guidance" |

Note: routine encounters (trivial/easy threat, no ambition relevance, no quest flag) NEVER reach Tier 1 by default. The player doesn't see them unless they've actively expanded their attention.

**Divine actions modify the threshold:**

The player can cast divine actions on agents or locations to expand their intervention access. These actions come from the existing action template system (Generalized Action Targeting) and cost AP/essence like any other divine action:

| Divine Action | Effect on Vignettes | Duration |
|--------------|--------------------|---------|
| **Attune** (cast on agent) | Lowers significance threshold for this agent: trivial+ encounters become Tier 2, easy+ become Tier 1. Also reduces intervention essence cost by `ATTUNE_COST_DISCOUNT`. | Sustained — costs essence/tick while active |
| **Scry** (cast on location) | All encounters at this location become Tier 2 for the player, regardless of bond. Enables intervention on non-bonded agents at this location at reduced cost. | One-time — lasts `SCRY_DURATION_TICKS` |
| **Divine Focus** (cast on agent) | All encounters for this agent become Tier 1. Maximum bond efficiency regardless of actual tier. Dramatically cheaper intervention. | Short burst — lasts `FOCUS_DURATION_TICKS`, high upfront cost |

These actions don't exist yet — they're templates to be authored when the action system is populated. The important architectural point: the vignette significance check reads from a `divineAttention` state on the agent/location, which these actions set. The vignette system doesn't need to know about the specific actions — it just checks "does this agent/location have divine attention, and at what level?"

```typescript
interface DivineAttention {
  level: 'none' | 'scried' | 'attuned' | 'focused';
  costDiscount: number;        // 0.0 to 0.5 — reduces essence cost for intervention
  efficiencyBoost: number;     // 0.0 to 0.5 — added to bond efficiency
  significanceOverride?: ThreatRating;  // encounters at this threat+ become Tier 1
  expiresAtTick?: number;      // when this attention lapses (undefined = sustained)
}
```

**Storage:** `DivineAttention` is stored as a property on the target node — either an agent node (`properties.divineAttention`) or a location node (`properties.divineAttention`). Set by divine action resolution (Attune/Scry/Focus actions write to the target node's properties via GraphOps). Read by the vignette notification system during encounter resolution. Defaults to `{ level: 'none', costDiscount: 0, efficiencyBoost: 0 }` when the property is missing — which is the common case (most agents/locations have no divine attention).

**Divine awareness range:** The player's awareness range for encounter notifications uses the same per-reach formula as agent awareness (Decision 2 in the Agent Decision doc), but keyed to the Ascendant's capabilities instead of an agent's. The Ascendant typically has higher capabilities, giving them wider awareness than any individual agent.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `VIGNETTE_DEFAULT_THREAT_THRESHOLD` | 'hard' | Default minimum threat rating for Tier 1 (before divine attention) |
| `VIGNETTE_SIGNIFICANCE_QUEST_PRIORITY` | 2.0 | Minimum questPriority for Tier 1 |
| `VIGNETTE_UNBONDED_ESSENCE_MULTIPLIER` | 2.0 | Essence cost multiplier for intervening in non-bonded agent encounters |
| `VIGNETTE_MAX_PER_TICK` | 3 | Maximum Tier 1 notifications per tick (prevent overwhelm) |
| `ATTUNE_COST_DISCOUNT` | 0.3 | Essence cost reduction when attuned to agent |
| `SCRY_DURATION_TICKS` | 10 | How long a Scry action grants location awareness |
| `FOCUS_DURATION_TICKS` | 3 | How long Divine Focus lasts (short, powerful) |
| `FOCUS_EFFICIENCY_BOOST` | 0.4 | Bond efficiency bonus during Divine Focus |

**Tracing:**

```typescript
interface VignetteNotificationTrace {
  tick: number;
  category: 'vignette_notification';
  agentId: string;
  encounterId: string;
  tier: 1 | 2 | 3;
  reason: string;        // 'significant_bonded' | 'attuned' | 'focused' | 'scried' | 'routine_bonded' | 'awareness_range'
  divineAttention: 'none' | 'scried' | 'attuned' | 'focused';
  playerNotified: boolean;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Ascendant awareness data missing | Use BASE_AWARENESS_HOPS only |
| Bond tier lookup fails | Treat as non-bonded (Tier 3) |
| Divine attention data missing | Treat as 'none' — default thresholds apply |
| More than VIGNETTE_MAX_PER_TICK qualify for Tier 1 | Keep highest threat/quest priority, demote rest to Tier 2 |
| Divine action expires mid-encounter | Attention drops to 'none' after current step resolves, not mid-resolution |

### Decision 3: Exponential Essence Cost for Divine Intervention

**Chosen:** The player intervenes in an encounter by committing essence. Each percentage point of probability bonus costs more than the last, following a linear-sum-of-integers cost curve:

```
Cost for +N% probability:
  Total essence = Σ(i) for i = 1 to N
  = N × (N + 1) / 2

Examples:
  +1% = 1 essence
  +2% = 3 essence (1 + 2)
  +3% = 6 essence (1 + 2 + 3)
  +5% = 15 essence
  +10% = 55 essence
  +15% = 120 essence
```

**Why this curve?** A small nudge — the god barely whispering — is cheap. A desperate intervention — the god pouring divine power into a mortal's moment of crisis — is ruinous. This creates exactly the "tiny nudges" feel from the Meet The First brainstorm while allowing dramatic, costly interventions at pivotal moments. The player never feels forced to intervene (the cost is always optional) but always feels the weight of choosing to.

**Sphere matching requirement:** The essence spent must match the encounter's `sphereAffinity`. If the encounter is Entropy-aligned, you spend Entropy essence. If it has no sphere affinity, you can spend any essence type. If your sphere opposes the encounter's sphere, the cost per point is multiplied by `OPPOSING_SPHERE_COST_MULTIPLIER` — you *can* fight against the current, but it costs dearly.

**UI presentation:** The player sees a slider or stepped control showing probability bonus vs essence cost. The current probability (from all other modifiers) is shown alongside. The player commits essence, sees the updated probability, and confirms. The encounter then resolves with the modified probability.

**Interaction with the Unified Vignette System:** The intervention is presented as a choice point within the encounter vignette. The narrative scene plays out ("Your agent faces the abyss..."), and the player sees their intervention options:

- **"Pull the threads"** — commit essence to boost probability (the main mechanic)
- **"Watch from afar"** — do nothing, let the agent face it alone (0 modifier, but counts as "chose not to intervene" for the Return convergence in the Meet The First journey)
- **"Withdraw attention"** — dismiss the vignette entirely (only for Tier 2 notifications)

**Influence Tier scaling:** The bond tier between player and agent affects the efficiency of the intervention:

```
effectiveProbabilityBonus = rawProbabilityBonus × BOND_EFFICIENCY[influenceTier]
```

A Tier 1 (Touched) agent receives a fraction of the probability bonus — the bond is weak, the divine energy dissipates. A Tier 5 (Incarnate) agent receives the full bonus — the bond is a direct conduit.

| Influence Tier | Bond Efficiency | Effect |
|----------------|----------------|--------|
| 1 (Touched) | 0.4 | 40% of purchased probability reaches the agent |
| 2 (Drawn) | 0.6 | 60% |
| 3 (Devoted) | 0.8 | 80% |
| 4 (Exalted) | 0.95 | 95% |
| 5 (Incarnate) | 1.0 | Full efficiency |
| Unbonded | 0.2 | 20% — plus the UNBONDED_ESSENCE_MULTIPLIER on cost |

This means investing in a relationship has a concrete mechanical payoff: your divine interventions are more efficient when channeled through a strong bond.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `INTERVENTION_BASE_COST_PER_POINT` | 1 | First percentage point costs this much essence |
| `INTERVENTION_COST_GROWTH` | 'triangular' | Cost growth model: Σ(i) for i=1 to N |
| `INTERVENTION_MAX_BONUS` | 0.20 | Hard cap on probability bonus from intervention (= 210 essence at max) |
| `OPPOSING_SPHERE_COST_MULTIPLIER` | 3.0 | Cost multiplier when player's essence type opposes encounter sphere |
| `NO_SPHERE_AFFINITY_COST` | 1.0 | Cost multiplier when encounter has no sphere (any essence works, no discount) |
| `BOND_EFFICIENCY` | see table above | Per-tier efficiency of divine intervention |

**Tracing:**

```typescript
interface DivineInterventionTrace {
  tick: number;
  category: 'divine_intervention';
  agentId: string;
  encounterId: string;
  stepId: string;
  essenceSpent: number;
  essenceType: SphereName;
  sphereMatch: 'aligned' | 'neutral' | 'opposing';
  rawProbabilityBonus: number;
  bondTier: number;
  bondEfficiency: number;
  effectiveProbabilityBonus: number;
  costBreakdown: {
    baseCost: number;
    sphereMultiplier: number;
    totalCost: number;
  };
  playerChoice: 'intervene' | 'watch' | 'dismiss';
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Player has insufficient essence | Cap bonus at what they can afford, show "insufficient essence" |
| Sphere type mismatch (no matching essence pool) | Apply OPPOSING_SPHERE_COST_MULTIPLIER |
| Bond tier lookup fails | Use efficiency 0.2 (unbonded) |
| Intervention would exceed INTERVENTION_MAX_BONUS | Clamp to max, refund excess essence |
| Encounter resolves before player responds | No intervention applied, no essence spent |

**PRNG:** Not needed — intervention is a player choice, not a random event.

### Decision 4: Intervention Feeds Return Convergence (Meet The First Integration)

**Chosen:** Every divine intervention (or choice not to intervene) on a bonded agent's encounter is recorded and feeds into the Return convergence model described in the Meet The First brainstorm.

**What's tracked:**

```typescript
interface InterventionRecord {
  tick: number;
  encounterId: string;
  stepId: string;
  choice: 'intervene' | 'watch' | 'dismiss';
  essenceSpent: number;
  probabilityBonusGranted: number;
  encounterOutcome: 'success' | 'failure' | 'critical_success' | 'critical_failure';
  // Derived metrics (computed over the full intervention history):
  interventionFrequency: number;     // how often the god intervenes
  averageEssencePerIntervention: number;
  supportiveRatio: number;           // ratio of interventions that helped vs total encounters
}
```

**How it feeds the Return (from brainstorm):**

| Pattern | Convergence signal | Potential Return outcome |
|---------|-------------------|------------------------|
| Constant heavy intervention | God is controlling, micromanaging | Usurper lean (resentment), or Loyal Ascension (dependency) |
| Rare but massive intervention at crisis points | God cares deeply but respects autonomy | Loyal Ascension lean, Sacrifice lean |
| "Watch from afar" at most encounters | God trusts the agent | Vanishing lean (drift), or Loyal Ascension (independence respected) |
| No intervention ever (dismiss all) | God is absent, neglectful | Vanishing, Monster lean (agent turns to other powers) |
| Intervention at opposing-sphere encounters (costly) | God fought against the cosmos for this agent | Strong bond signal — Loyal Ascension or dramatic Sacrifice |

The exact convergence formula is part of the Meet The First full design (future doc). This decision only establishes that intervention history is tracked and available as input.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `INTERVENTION_HISTORY_WINDOW` | 50 | Number of most recent encounters to consider for convergence metrics |
| `INTERVENTION_FREQUENCY_THRESHOLD_HIGH` | 0.7 | Above this ratio = "constant intervention" |
| `INTERVENTION_FREQUENCY_THRESHOLD_LOW` | 0.2 | Below this ratio = "absent god" |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Intervention history empty | Use neutral convergence metrics |
| Agent has no Return tracking (not The First) | Still record interventions for relationship quality, skip Return convergence |

### Decision 5: Vignette Prose Generation via Prose Engine

**Chosen:** Intervention vignettes are generated by a new resolver registry in the prose engine, composing narrative scenes from encounter context, agent state, location, and the ascendant's perception lens. The same architecture that generates entity descriptions (resolvers → layers → composer) generates dramatic scenes.

**Why use the prose engine?** The vignette is a narrative moment, not a data readout. "Your agent faces a deadly ritual" is worse than a scene composed from the actual graph state — the agent's name, their archetype, the location's terrain and culture, the encounter's specific threat, viewed through the god's sphere lens. The prose engine already knows how to walk graph edges and compose layered descriptions. Vignettes are a new *mode* of that same system, not a new system.

**What the player sees:**

A vignette has four parts, each generated by a different resolver:

1. **Scene** (2-3 sentences) — what's happening, grounded in the specific encounter step, location, and cultural context. Written in present tense as observation, following the Threadbare tone rules.

2. **Ascendant Lens** (1 sentence) — how the god perceives this moment, filtered through their sphere and reach. A Mind ascendant reads the agent's thoughts. An Entropy ascendant sees fate-threads converging. A Life ascendant feels the fragility of the body. This sentence reminds the player what kind of god they are.

3. **Stakes** (1-2 sentences) — what success and failure mean, in narrative terms. Not "success: +0.15 reputation" but "If she crosses the abyss, the artifact below will change everything. If she falls, the deep will keep her." Generated from `step.onSuccess.narrative` and `step.onFailure.narrative` but rewritten through the ascendant lens.

4. **Fate Forecast** (1 phrase) — the probability tier as a narrative descriptor, not a number. "The threads favor her" (favorable), "The outcome trembles on a knife's edge" (uncertain), "The currents run against her" (perilous). Varies by ascendant sphere.

**Resolver registry:**

```typescript
const VIGNETTE_RESOLVERS: ProseResolver[] = [
  vignetteSceneResolver,        // Encounter step + location + culture → scene prose
  vignetteLensResolver,         // Ascendant sphere/reach → perception layer
  vignetteStakesResolver,       // Success/failure outcomes → narrative stakes
  vignetteForecastResolver,     // Probability tier → fate descriptor (sphere-flavored)
];
```

Each resolver is a pure function: `(context: VignetteContext, graph: WorldGraph, seed: number) => ProseLayer[]`

The `VignetteContext` carries everything the resolvers need:

```typescript
interface VignetteContext {
  agentId: string;
  encounterId: string;
  stepId: string;
  locationId: string;
  ascendantId: string;
  ascendantSphere: SphereName;
  ascendantReaches: Partial<Record<ReachDomain, number>>;
  forecastTier: ForecastTier;       // from probability classification
  divineAttention: DivineAttention; // from Decision 2
  journeyStage?: string;           // if this is The First's journey beat
  callbackChoices?: string[];       // founding choices to reference (from Meet The First)
}
```

**Ascendant sphere lens — content tables:**

Each sphere has a set of perception verbs and metaphors used by the lens resolver:

| Sphere | Perceives through | Example lens sentence |
|--------|------------------|----------------------|
| Force | Impact, kinetic energy, momentum | "You feel the collision building — two wills about to meet" |
| Matter | Substance, weight, solidity | "The stone of her resolve is cracked but not yet broken" |
| Energy | Heat, light, vibration | "The air hums with the charge of the moment" |
| Life | Growth, vitality, fragility | "You sense the thread of her pulse — strong, but the abyss is hungry" |
| Mind | Thought, intention, clarity | "Her thoughts sharpen to a single bright point of purpose" |
| Spirit | Soul, essence, transcendence | "Something deeper than courage moves through her — you recognize it" |
| Time | Past, future, inevitability | "You have seen this moment before, in a thousand possible futures" |
| Entropy | Decay, endings, probability | "The threads fray. The pattern demands a sacrifice" |
| Chaos | Unpredictability, chance, flux | "Anything could happen here — the currents swirl without pattern" |
| Order | Structure, inevitability, law | "The outcome follows from everything that came before. The equation resolves" |
| Light | Revelation, exposure, truth | "Every detail stands in merciless clarity — her fear, her strength, the precipice" |
| Darkness | Concealment, mystery, the unknown | "The deeper truths hide beneath the surface. What she cannot see may save or doom her" |

**Fate Forecast descriptors (sphere-flavored):**

The forecast tier (doomed/perilous/uncertain/favorable/fated) is rendered as a narrative phrase, not a percentage. The phrasing varies by ascendant sphere:

| Tier | Default | Force | Entropy | Life |
|------|---------|-------|---------|------|
| Doomed | "The outcome is nearly written" | "The force arrayed is overwhelming" | "The threads have already frayed" | "The flame gutters" |
| Perilous | "The currents run against her" | "The blow will be hard to withstand" | "Endings gather at the edges" | "The roots strain against the storm" |
| Uncertain | "The outcome trembles" | "The forces are evenly matched" | "The pattern could break either way" | "Growth and decay are balanced" |
| Favorable | "The threads favor her" | "Momentum is on her side" | "The pattern holds, for now" | "Vitality surges through her" |
| Fated | "This was always going to happen" | "Nothing can stop this force" | "The pattern demands this outcome" | "Life insists" |

These are content tables in the prose content file, selected by sphere + tier. Each cell has 2-3 variants for PRNG variety.

**Callback integration (Meet The First journey):**

When the vignette is for The First and the journey is active, the scene resolver can reference founding choices stored on the agent's graph data. "She stands her ground — the same stubborn defiance you first noticed in her, arguing over grain in the market." This is the callback layer from the brainstorm.

The callback data lives on the agent's node (set during the Meet The First encounter) as `foundingChoices: string[]`. The scene resolver checks for its presence and weaves references in when thematically appropriate (not every vignette — that would be repetitive).

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `VIGNETTE_SCENE_MAX_SENTENCES` | 3 | Maximum sentences in the scene section |
| `VIGNETTE_STAKES_MAX_SENTENCES` | 2 | Maximum sentences in the stakes section |
| `VIGNETTE_CALLBACK_CHANCE` | 0.4 | Probability that a journey vignette references founding choices (seeded PRNG) |
| `VIGNETTE_LENS_VARIANTS_PER_SPHERE` | 3 | Minimum content variants per sphere for the lens resolver |
| `VIGNETTE_FORECAST_VARIANTS_PER_TIER` | 3 | Minimum forecast phrase variants per tier × sphere combo |

**Tracing:**

```typescript
interface VignetteProseTrace {
  tick: number;
  category: 'vignette_prose';
  agentId: string;
  encounterId: string;
  stepId: string;
  ascendantSphere: SphereName;
  forecastTier: ForecastTier;
  layerCount: number;
  hasCallback: boolean;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Ascendant sphere not found | Use default (sphere-neutral) lens and forecast phrases |
| No content variants for sphere × tier | Fall back to default tier descriptors |
| Callback data missing on agent | Skip callback, generate without founding choice reference |
| Scene resolver produces no layers | Use encounter step's authored `narrative` field directly |
| Location/culture data missing | Generate scene from encounter step narrative only (no location color) |

**PRNG:** Scene and lens variant selection uses seeded PRNG (same pattern as existing prose resolvers). The seed combines world seed + agent ID + encounter ID + step index for per-vignette determinism.

## Schema Changes Required

### Attachment — Add Resolution Bonus

```typescript
// Addition to existing attachment properties
reachBonus?: Partial<Record<ReachDomain, number>>;
```

Existing attachments get `reachBonus` backfilled based on their category and subcategory. A "weapon" subcategory attachment gets `{ iron: 0.05 }`. A "tome" gets `{ eye: 0.05 }`. Content authoring work.

### Trait — Add Resolution Bonus

```typescript
// Addition to existing trait properties
resolutionBonus?: Partial<Record<ReachDomain | EncounterType, number>>;
```

Existing traits get `resolutionBonus` backfilled where thematically appropriate. "Battle-hardened" gets `{ iron: 0.03 }`. "Silver-tongued" gets `{ gold: 0.03, heart: 0.02 }`. Content authoring work.

### EncounterStep — Add Choice-Point Type

```typescript
interface EncounterStep {
  // ... existing fields ...
  /** Step type: 'resolution' (default, d100 roll) or 'choice' (player/agent picks) */
  stepType?: 'resolution' | 'choice';
  /** For choice-point steps: available choices with consequences */
  choices?: EncounterChoice[];
}

interface EncounterChoice {
  id: string;
  label: string;
  narrative: string;
  /** Game state changes applied when this choice is selected */
  consequences: EncounterOutcome;
  /** Optional: required sphere for this choice to appear */
  sphereRequirement?: SphereName;
}
```

This extends the encounter step to support the two modes described in the Meet The First brainstorm: resolution steps (existing d100 roll) and choice-point steps (player or agent picks from options). The divine intervention vignette uses choice-point steps where the player's choices are "intervene (commit essence)" or "watch."

## Architectural Dependencies

### 1. Sphere Opposition Table (Priority: High — Needed for sphere alignment bonus)

**Problem:** The modifier pipeline needs to know which spheres oppose each other. This is described in the cosmology (Life opposes Entropy, Light opposes Darkness, etc.) but may not be in a code-accessible format.

**Recommendation:** Create a `SPHERE_OPPOSITIONS: Record<SphereName, SphereName>` lookup table derived from the canonical cosmology. Check if this already exists in the codebase; if not, author it.

### 2. Essence Pool System (Priority: High — Needed for divine intervention)

**Problem:** Divine intervention requires the player to spend sphere-typed essence. The essence system needs pools per sphere type, spend/earn mechanics, and UI.

**Recommendation:** Check current state of essence implementation. The brainstorm references essence costs throughout but the system may be partially implemented.

### 3. Attachment reachBonus Backfill (Priority: Medium — Enriches equipment modifier)

**Problem:** Existing attachments need `reachBonus` properties. This is content authoring across the attachment catalog.

### 4. Trait resolutionBonus Backfill (Priority: Medium — Enriches trait bonus)

**Problem:** Existing traits need `resolutionBonus` properties. This is content authoring across the trait catalog.

### 5. Vignette Prose Content Tables (Priority: Medium — Needed for Decision 5)

**Problem:** Decision 5 requires sphere-flavored content tables for the lens resolver (12 spheres × 3+ variants), the forecast resolver (12 spheres × 5 tiers × 3+ variants = 180+ phrases), and scene templates per encounter type × location type combination.

**Recommendation:** Author incrementally. Start with 4 spheres (Life, Entropy, Force, Mind) and the default/neutral fallbacks. Expand to full 12 once the system is running and the tone is calibrated. The fail-soft uses the step's authored `narrative` field directly when prose content is missing, so partial content coverage works.

## Performance Considerations

The modifier pipeline adds 5 computations per encounter step resolution:
- Sphere lookup: O(1) hash lookup
- Equipment scan: O(K) where K = number of agent attachments (typically 3-8)
- Terrain lookup: O(1) hash lookup
- Trait scan: O(T) where T = number of agent traits (typically 3-6)
- Divine intervention: O(1) (value already determined by player choice)

Total: ~15-20 operations per step resolution. With agents resolving 1-3 steps per tick across 50 agents = 75-300 additional operations per tick. Negligible.

The vignette notification system checks ~50 agents per tick for encounter significance. Each check is a few property lookups. Negligible.

## NFP Compliance Summary

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | Every modifier has its own constant and cap. Intervention cost curve is parameterized. Bond efficiency table is tunable. |
| 2 | Inspectability | PASS | Full modifier breakdown in ResolutionModifierTrace. Divine intervention trace shows essence spent, sphere match, bond efficiency, effective bonus. |
| 3 | Determinism | PASS | All modifiers are deterministic from game state. Player intervention is a choice (inherently non-deterministic but explicitly tracked). D100 roll uses existing seeded PRNG. |
| 4 | Fail-soft | PASS | Every modifier fails to 0 on missing data. Divine intervention gracefully handles insufficient essence, missing bonds, sphere mismatches. |
| 5 | Narrative over mechanical | PASS | Sphere alignment makes the cosmology mechanically meaningful. Divine intervention creates dramatic moments. Intervention tracking feeds the Return narrative arc. |
| 6 | Additive over destructive | PASS | New modifier pipeline replaces only two hardcoded constants. Existing resolution mechanics (d100, critical bands, outcome classification) are fully preserved. |
| 7 | Performance budget | PASS | ~20 operations per step resolution, ~50 significance checks per tick. Both negligible. |
