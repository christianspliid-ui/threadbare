# Reputation Trait System — Design & Implementation Plan

## Context

The game has two numeric reputation systems (`factionReputation.ts` for faction standing, `reputationWalk.ts` for agent-to-agent perception) but no **trait-based** reputation that the encounter pipeline, social systems, and prose layer can parse and react to. The user wants reputation traits that make the world feel alive — a feared warlord gets different encounters, NPC reactions, and faction behavior than a beloved healer. The system should have positive and negative reputation per reach, plus a generic power-level renown.

## Design

### 1. The 17 Reputation Traits

**16 reach reputations** (8 reaches x 2 polarities) + **1 power renown**:

| Reach | Positive (virtue pole) | Negative (flaw pole) | Value Pair |
|-------|----------------------|---------------------|------------|
| **Iron** | Feared Champion — martial honor | Brutal Thug — senseless violence | mercy / ruthlessness |
| **Gold** | Generous Patron — shared prosperity | Ruthless Profiteer — exploitation | asceticism / extravagance |
| **Shadow** | Enigmatic — useful discretion | Infamous — criminal notoriety | honesty / cunning |
| **Veil** | Arcane Sage — protective magic | Dangerous Sorcerer — feared power | tradition / novelty |
| **Heart** | Beloved — genuine warmth | Manipulator — emotional exploitation | loyalty / ambition |
| **Eye** | Oracle — sought as advisor | Spy — invasive knowledge | revelation / discretion |
| **Stone** | Steadfast Builder — community trust | Immovable Tyrant — crushes change | preservation / transformation |
| **Star** | Blessed — inspires devotion | Zealot — dangerous conviction | sacrifice / survival |
| **Power** | Renowned — raw capability tier | (no negative — power is power) | computeTier() |

IDs follow: `trait.reputation.<reach>.<polarity>` (e.g., `trait.reputation.iron.positive`, `trait.reputation.shadow.negative`). Power renown: `trait.reputation.power.renown`.

### 2. Trait Levels and Scope

Each reputation trait has **3 levels** that map to awareness scope:

| Level | Name | Scope | Hex Range | Threshold (completions) |
|-------|------|-------|-----------|------------------------|
| 1 | Whispered | Local | Same hex | 3 |
| 2 | Known | Regional | 3 hexes | 8 |
| 3 | Legendary | World | Unlimited | 15 |

Power renown levels derive from max `computeTier()` across all reaches:

| Max Tier | Renown Level | Name |
|----------|-------------|------|
| 1-3 | 0 (none) | Unknown |
| 4-5 | 1 | Noted |
| 6-7 | 2 | Renowned |
| 8+ | 3 | Legendary |

### 3. Polarity Determination

When an agent completes an encounter, which polarity does it feed?

**Layer 1 — Explicit template tag** (content author control):
Add optional `reputationPolarity?: 'positive' | 'negative'` to `EncounterTemplate`. When present, this wins. E.g., "Defend the Village" = `{ reputationPolarity: 'positive' }`.

**Layer 2 — Encounter type heuristic** (when no explicit tag):
- Positive types: `assist`, `build`, `create`, `lead`
- Negative types: `steal`, `duel`
- Neutral types: `explore`, `trade`, `hire`, `acquire` → fall through to Layer 3

**Layer 3 — Axiological profile tiebreaker** (for neutral encounters):
Use the agent's value pair for the encounter's primary reach. `REACH_VALUE_PAIR[reach]` gives the pair; if agent leans toward virtue pole (> 0), positive. Flaw pole (< 0), negative. Exactly 0, skip (no reputation contribution).

This means the same "trade route" encounter feeds Gold-positive for an ascetic merchant and Gold-negative for an extravagant one — emergent polarity from character.

### 4. ReputationEffects — The Parseable Payload

Each reputation trait definition carries a `reputationEffects` field (new on `TraitDefinitionProperties`):

```typescript
interface ReputationEffects {
  /** How other entities react to the bearer */
  reactions: ReputationReaction[];
  /** Encounters this reputation unlocks (via requiredTraits) or blocks */
  encounterGates: {
    unlocks: string[];  // encounter template IDs
    blocks: string[];   // encounter template IDs
  };
  /** Per-reach scoring modifiers applied in encounterScoring */
  scoringModifiers: Partial<Record<ReachDomain, number>>;
  /** Scope per level — how far knowledge of this reputation spreads */
  scopeByLevel: [number, number, number]; // hex range per level (0=same hex, 99=world)
}

interface ReputationReaction {
  /** Who reacts: 'merchant', 'guard', 'commoner', 'faction_rival', 'faction_ally', 'monster' */
  target: string;
  /** What they do: 'defer', 'flee', 'approach', 'hostility', 'reverence', 'price_gouge', 'discount' */
  effect: string;
  /** Strength of reaction (0.0-1.0), scaled by reputation level */
  magnitude: number;
}
```

### 5. Accumulation Tracking

**New property on agent nodes**: `reputationTallies`:

```typescript
interface ReputationTallies {
  [key: `${ReachDomain}.positive` | `${ReachDomain}.negative`]: number;
}
```

Each qualifying encounter completion increments the appropriate tally by 1 (or by `weight` if the encounter specifies one). The orchestrator phase checks tallies against thresholds and assigns/reinforces traits.

**Decay**: Tallies decay by `REPUTATION_TALLY_DECAY_PER_TICK` (default: 0.02 per tick). This means reputations fade if not maintained — a warlord who stops fighting eventually loses "Feared Champion". Active agents sustain their reputation naturally.

**Polarity competition**: If both positive AND negative tallies for the same reach cross threshold, the higher one wins. The loser is removed. You can't be both "Feared Champion" and "Brutal Thug" — but you can be "Feared Champion" (Iron+) and "Manipulator" (Heart-) simultaneously.

### 6. Integration Points

#### 6a. Encounter Gating (Stage 3 filter)
**File**: `src/engine/encounterFilterPipeline.ts` — `filterByPrerequisites()`
- Already checks `requiredTraits` on encounter templates
- Reputation traits use the existing mechanism: encounter templates list `requiredTraits: [{ traitId: 'trait.reputation.iron.positive', minLevel: 2 }]`
- For blocking: new `blockedByTraits?: string[]` field on `EncounterTemplate`. If agent has any listed trait, encounter is filtered out.
- **Scope check**: new helper `isReputationVisible(graph, agentId, locationId, traitId)` — checks trait level against hex distance to encounter location. Level 1 = same hex only, Level 2 = 3 hexes, Level 3 = anywhere.

#### 6b. Encounter Scoring Modifiers
**File**: `src/engine/encounterScoring.ts` — `scoreAndSelect()`
- New function `computeReputationScoringBonus(graph, agentId, entry)`:
  - Reads agent's reputation traits
  - Sums `reputationEffects.scoringModifiers` for the encounter's `reachPrimary`
  - Returns additive bonus (like `factionScoringBoost`)
- Injected at line ~709: `const baseScore = valuePerTick * desireMultiplier + factionScoringBoost + reputationScoringBonus + resonance`

#### 6c. Social Encounter Reactions
**File**: `src/engine/socialEncounterGeneration.ts` — `computeBondModifier()`
- New function `computeReputationBondShift(graph, sourceId, targetId)`:
  - Reads target's reputation traits and their `reactions` arrays
  - Matches source agent against reaction targets (merchant, guard, etc. — derived from agent archetype or faction role)
  - Returns a trust shift value
- Applied to bond modifier: shifts the effective trust before threshold checks

#### 6d. Disposition System
**File**: `src/engine/disposition.ts` — `applyDispositionModifier()`
- Reputation reactions feed into disposition calculation
- A "feared" agent gets `hostility` reactions from rivals, `defer` reactions from weaker agents

#### 6e. Prose Enrichment
**File**: `src/engine/proseEnrichment.ts` — `gatherNarrativeContext()`
- Already extracts `titles[]` from reputation-category traits (line 134-138)
- Reputation trait names flow directly into prose templates via `{?titles}...{/titles}`
- `reactions` effects become prose tokens: "Stalls close as the feared champion passes"

#### 6f. New Orchestrator Phase: `phaseReputationTraits`
**File**: new `src/engine/phaseReputationTraits.ts`
- Runs after encounter resolution (after `processFactionEncounterReputation`)
- Suggested phase: 6.64 (after phaseEconomicTraits at 6.632)
- For each actor:
  1. Decay all tallies by `REPUTATION_TALLY_DECAY_PER_TICK`
  2. Check tallies against thresholds
  3. Assign/reinforce/remove reputation traits via existing `assignTrait`/`removeTrait`/`reinforceTrait`
  4. Compute power renown from max tier
  5. Emit `reputation_trait` traces

#### 6g. Encounter Completion Hook
**File**: `src/engine/orchestrator.ts` — where `processFactionEncounterReputation` is called
- New function `processReputationTally(graph, agentId, encounterId, stepSuccess, tick)`:
  - Looks up encounter's `reachPrimary`
  - Determines polarity (Layer 1 → 2 → 3)
  - Increments the appropriate tally on the agent node
  - Called alongside `processFactionEncounterReputation`

### 7. Encounter Template Changes

Add to `EncounterTemplate` interface:

```typescript
/** Polarity for reputation accumulation. When absent, derived from encounterType or agent values. */
reputationPolarity?: 'positive' | 'negative';
/** Traits that BLOCK this encounter (inverse of requiredTraits). */
blockedByTraits?: string[];
```

Existing encounter templates don't need immediate changes — they work with the Layer 2/3 fallback. Content authors can add explicit polarity tags over time for precision.

### 8. Constants (all in `agent-behavior-constants.ts`)

| Constant | Default | Purpose |
|----------|---------|---------|
| `REPUTATION_LEVEL_1_THRESHOLD` | 3 | Completions for "Whispered" |
| `REPUTATION_LEVEL_2_THRESHOLD` | 8 | Completions for "Known" |
| `REPUTATION_LEVEL_3_THRESHOLD` | 15 | Completions for "Legendary" |
| `REPUTATION_TALLY_DECAY_PER_TICK` | 0.02 | Tally decay rate |
| `REPUTATION_POWER_TIER_NOTED` | 4 | Min tier for Noted renown |
| `REPUTATION_POWER_TIER_RENOWNED` | 6 | Min tier for Renowned |
| `REPUTATION_POWER_TIER_LEGENDARY` | 8 | Min tier for Legendary |
| `REPUTATION_SCOPE_LOCAL` | 0 | Hex range for Level 1 |
| `REPUTATION_SCOPE_REGIONAL` | 3 | Hex range for Level 2 |
| `REPUTATION_SCOPE_WORLD` | 99 | Hex range for Level 3 |
| `REPUTATION_SCORING_WEIGHT` | 0.1 | Weight of reputation scoring bonus |

### 9. Trace Emissions

New trace category: `reputation_trait`

```typescript
interface ReputationTraitTrace {
  tick: number;
  category: 'reputation_trait';
  agentId: string;
  reach: ReachDomain | 'power';
  polarity: 'positive' | 'negative' | 'renown';
  action: 'tally_increment' | 'trait_assigned' | 'trait_reinforced' | 'trait_removed' | 'trait_decayed';
  tallyValue?: number;
  traitLevel?: number;
  cause?: string; // encounter template ID or 'tier_change'
  summary: string;
}
```

### 10. Monsters and Factions

Both are `actor` nodes with different `actorType`. They already support `has_trait` edges via the existing trait API.

- **Monsters**: Can earn reputation traits through combat encounters (e.g., a dragon that wins many fights becomes Iron-positive "Feared Champion"). Monster reputation affects how agents decide whether to engage.
- **Factions**: Faction nodes themselves get reputation traits based on aggregate member activity. A faction whose members complete many Shadow encounters becomes Shadow-negative "Infamous" — which gates faction-level encounters and affects recruitment.
- **Faction reputation aggregation**: New helper scans `member_of` edges, tallies member reputation, and assigns faction-level reputation traits. Runs in `phaseReputationTraits`.

---

## Implementation Plan

### Phase 1: Types & Definitions
1. Add `ReputationEffects`, `ReputationReaction` interfaces to `src/types/traits.ts`
2. Add optional `reputationEffects` to `TraitDefinitionProperties`
3. Add `reputationPolarity`, `blockedByTraits` to `EncounterTemplate` in `src/types/encounter.ts`
4. Add `reputationTallies` to agent node properties type in `src/types/agent.ts`
5. Add constants to `src/data/agent-behavior-constants.ts`
6. Add trace type to `src/types/trace.ts`

### Phase 2: Trait Content
7. Create `src/data/reputation-trait-content.ts` — define all 17 reputation trait nodes with ReputationEffects
8. Wire trait definitions into graph initialization (ensure nodes exist at game start)

### Phase 3: Accumulation Engine
9. Create `src/engine/phaseReputationTraits.ts` — tally decay, threshold checks, trait assignment/removal
10. Create reputation tally increment hook (`processReputationTally`)
11. Wire into orchestrator: tally hook after encounter resolution, phase at 6.64

### Phase 4: Pipeline Integration
12. Add `blockedByTraits` check to `filterByPrerequisites()` in `encounterFilterPipeline.ts`
13. Add scope-aware visibility helper for reputation-gated encounters
14. Add `computeReputationScoringBonus()` to `encounterScoring.ts`
15. Add `computeReputationBondShift()` to `socialEncounterGeneration.ts`

### Phase 5: Content Tagging
16. Tag existing encounter templates with `reputationPolarity` where appropriate (high-value templates only — most use Layer 2/3 fallback)
17. Add `requiredTraits` / `blockedByTraits` to select encounter templates to create reputation-gated content

### Phase 6: Tests
18. Unit tests for `phaseReputationTraits` — tally accumulation, threshold crossing, decay, polarity competition
19. Unit tests for `processReputationTally` — polarity determination (all 3 layers)
20. Integration tests for encounter pipeline — gating, scoring, blocking
21. Contract tests for reputation trait ↔ encounter scoring boundary

### Phase 7: Wiring & Docs
22. Update `Docs/plans/wiring-checklist.md` with new orchestrator phase, trace category, GameState fields
23. Update Obsidian vault reputation trait notes to match implemented system
24. Update CMS registry if reputation traits should be browsable

## Key Files to Modify

| File | Change |
|------|--------|
| `src/types/traits.ts` | Add `ReputationEffects`, `ReputationReaction` interfaces; add optional `reputationEffects` to `TraitDefinitionProperties` |
| `src/types/encounter.ts` | Add `reputationPolarity`, `blockedByTraits` fields to `EncounterTemplate` |
| `src/types/agent.ts` | Add `ReputationTallies` interface |
| `src/types/trace.ts` | Add `ReputationTraitTrace` type |
| `src/data/agent-behavior-constants.ts` | Add 11 new constants |
| `src/data/reputation-trait-content.ts` | **NEW** — 17 trait definitions with ReputationEffects |
| `src/engine/phaseReputationTraits.ts` | **NEW** — orchestrator phase for tally decay + trait assignment |
| `src/engine/encounterFilterPipeline.ts` | Add `blockedByTraits` check in Stage 3 |
| `src/engine/encounterScoring.ts` | Add `computeReputationScoringBonus()` |
| `src/engine/socialEncounterGeneration.ts` | Add `computeReputationBondShift()` |
| `src/engine/orchestrator.ts` | Wire `processReputationTally` hook + phase 6.64 |

## Verification

1. `npm test` — all existing tests pass (no regressions)
2. `npx tsc --noEmit` — type check clean
3. `npx vite build` — production build succeeds
4. New unit tests for phaseReputationTraits, processReputationTally, polarity determination
5. CLI smoke test: `npm run cli -- --seed 42`, run `tick 50`, check `traces` for `reputation_trait` emissions
6. Verify encounter gating works by adding `requiredTraits` to a test encounter and confirming it filters correctly
