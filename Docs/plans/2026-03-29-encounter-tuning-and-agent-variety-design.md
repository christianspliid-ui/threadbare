# Encounter Tuning & Agent Variety — Full Tuning Pass

> **Date:** 2026-03-29
> **Status:** 📐 Plan
> **Backlog:** TB-074
> **Depends on:** Encounter system (✅), Agent Decision Pipeline (✅), Capability Growth (✅), Social Fabric (✅), Sphere Affinity Phase 10 (✅)
> **Source analysis:** `Docs/analysis/2026-03-29-encounter-log-analysis-seed42.md`
> **Purpose:** Fix the 7 root causes identified in the seed-42 encounter analysis: content deserts, zero movement, small encounter pools, no difficulty escalation, born-later starvation, undifferentiated capability, and score display bug. Introduces 4 new mechanics alongside constant tuning.

---

## Problem Statement

The seed-42 analysis (210 ticks, 16 agents) revealed that the encounter system is structurally broken:

- **31% active agent rate** — 11 of 16 agents are permanently idle
- **0 agents traveled** — no movement pressure exists
- **85%+ idle rate** across all agent-ticks
- **~20 of 88+ templates used** — 75% of content is invisible
- **Difficulty stuck at 25/35/45** — no escalation as agents grow
- **Born-later agents get nothing** — 100% idle from birth
- **All scores display 0.00** — scoring feedback broken

This plan addresses all 7 root causes through a combination of broader template mapping, new scoring mechanics, difficulty scaling, and pipeline fixes. Organized into 5 implementation phases that can be shipped incrementally.

---

## Phase A: Template Coverage Expansion (Content Desert Fix)

### Problem
The encounter cache builds entries by matching `template.locationTypes` against each hex's `locationType`. Many hex location types — especially terrain-specific ones like `oasis`, `farmland`, and `wilderness` — have few or zero matching templates. The awareness filter then returns 0 candidates for agents at those locations.

### Current Location Type Coverage

From the encounter template `locationTypes` arrays (64 templates):

| Location type | # Templates matching | On-map frequency |
|---------------|---------------------|-----------------|
| capital | 19 | 1 per map (guaranteed) |
| city | 18 | Common (default terrain) |
| town | 16 | Common (default terrain) |
| castle | 10 | Moderate |
| tower | 12 | Moderate |
| temple | 12 | Moderate |
| shrine | 11 | Moderate |
| fort | 10 | Common (default + mountains) |
| ruins | 10 | Very common (all terrains) |
| camp | 9 | Common (all terrains) |
| hamlet | 6 | Common (default + many terrains) |
| mining | 5 | Common (mountains, hills, volcano) |
| battleground | 5 | Moderate (broken_lands) |
| oasis | 4 | Desert-only |
| farmland | 3 | Moderate (default terrain) |
| wilderness | 3 | Default fallback (very common) |
| ruined_city | 3 | Rare |
| ruined_tower | 2 | Rare |
| ruined_village | 2 | Rare |
| unexplored_poi | 2 | ~5% of locations |

**Content deserts**: `wilderness`, `farmland`, `hamlet`, `mining`, `oasis` — these are among the most common map locations but have the fewest templates. An agent spawned at a wilderness or farmland hex has almost nothing to do.

### Design: Broader Template Mapping

Expand existing templates' `locationTypes` arrays so every location type has at least 8 matching templates. The principle: an encounter's narrative premise determines which locations make sense, not artificial exclusivity.

**Mapping rules** (which templates gain which location types):

1. **Generic activity encounters** (market_day_festival, tavern_brawl, recruit_militia, guild_negotiation, the_haggle, merchant_caravan, smuggle_goods, pickpocket, caravan_deal, smuggler_pact) — these happen wherever people gather. Add `hamlet`, `camp`, `farmland`, `oasis` to all of them that don't already include these.

2. **Exploration/discovery encounters** (deep_descent, relic_hunt, forbidden_tome, shadow_ambush, ancient_ward) — these happen at ruins and old places, but also at `wilderness`, `unexplored_poi`, `mining` (underground). Add these where thematically appropriate.

3. **Spiritual/mystical encounters** (arcane_duel, spell_bargain, knowledge_test, mystic_trade, arena_combat) — these happen at places of power. Add `ruins` (old magic), `wilderness` (ley lines), `camp` (travelling mystics).

4. **Military/conflict encounters** (arena_combat, recruit_militia, siege encounters) — add `camp`, `hamlet` (militia mustering).

5. **Nature/survival encounters** — currently underrepresented. Add a `locationTypes` pass to include `wilderness`, `farmland`, `oasis` more broadly for encounters involving survival, natural resources, and exploration.

**Target**: Every location type has ≥8 templates. No location type has fewer than 5.

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `MIN_TEMPLATES_PER_LOCATION_TYPE` | 8 | Design target — not enforced in code, used for content audits |

**Tracing:** No new traces — encounter cache rebuild already traces entry counts per location.

**PRNG:** Not applicable — static content mapping.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Location type has 0 templates after expansion | Encounter cache returns empty for that location (existing behavior, but now much rarer) |
| New mapping creates thematic mismatch | Prose layer handles it — encounter prose is location-agnostic by design |

---

## Phase B: Movement Pressure & Exploration Incentive

### Problem
The scoring formula divides expected reward by travel cost: `valuePerTick = expectedReward / (travelCost + tickCost)`. When `travelCost = 0` (local encounter), the denominator is just `tickCost` (2–4 ticks). When `travelCost > 0`, the denominator grows quickly. Result: **local encounters always dominate**. No agent ever has a reason to move.

Additionally, agents repeatedly cycle the same encounters at their spawn location. There's no penalty for repetition and no bonus for novelty.

### Design: Three Interlocking Scoring Modifiers

#### B.1 — Familiarity Discount (Repetition Penalty)

Track how many times an agent has attempted each encounter template. Each repetition reduces the encounter's score.

```typescript
interface FamiliarityRecord {
  /** templateId → number of times attempted (started, not just scored) */
  attemptCount: Record<string, number>;
}
```

Stored as a property on the agent node: `agent.properties.familiarityRecord`.

**Scoring integration** (in `encounterScoring.ts`):

```
familiarityPenalty = min(attemptCount * FAMILIARITY_DECAY_PER_ATTEMPT, FAMILIARITY_MAX_PENALTY)
finalScore = (valuePerTick * desireMultiplier + factionBoost + resonance + globalResonance) * (1 - familiarityPenalty)
```

As an encounter is repeated, its score decays toward `(1 - FAMILIARITY_MAX_PENALTY)` of its base score. Fresh encounters stay at full value.

**Constants table:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `FAMILIARITY_DECAY_PER_ATTEMPT` | 0.12 | 0.05–0.25 | Score reduction per repetition |
| `FAMILIARITY_MAX_PENALTY` | 0.7 | 0.5–0.9 | Maximum total discount (0.7 = repeated encounters score at 30% of base) |

**PRNG:** None — deterministic.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Missing familiarityRecord on agent | Treat as empty (0 attempts for all) |
| attemptCount missing for a template | Treat as 0 |

#### B.2 — Exploration Bonus (Novelty Reward)

Agents get a flat scoring bonus for encounters at locations they haven't visited before. Visiting a new location is inherently interesting.

```typescript
interface ExplorationRecord {
  /** locationId → tick of first visit */
  visitedLocations: Record<string, number>;
}
```

Stored as `agent.properties.explorationRecord`.

**Scoring integration** (additive, in `encounterScoring.ts`):

```
explorationBonus = visitedLocations[entry.locationId] ? 0 : EXPLORATION_NOVELTY_BONUS
finalScore = ... + explorationBonus
```

**Constants table:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `EXPLORATION_NOVELTY_BONUS` | 0.3 | 0.1–0.6 | Flat score bonus for unvisited locations |
| `EXPLORATION_BONUS_DECAY_TICKS` | 50 | 20–100 | Ticks after first visit before bonus fully decays (gradual, not cliff) |

**Why a flat bonus instead of a multiplier:** Travel cost is in the denominator. A multiplicative bonus on `valuePerTick` still can't overcome a large travel cost. A flat additive bonus can — it makes the distant-unvisited location competitive with the local-familiar one.

**PRNG:** None.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Missing explorationRecord | Treat all locations as unvisited (bonus applies everywhere — safe default since it pushes activity) |

#### B.3 — Travel Cost Dampening

The current formula makes travel cost dominate: `valuePerTick = expectedReward / (travelCost + tickCost)`. For a 3-hop journey + 3-tick encounter, the denominator is 6 vs 3 for local. That's a 2x penalty for being just 3 hops away.

Replace with a softer function:

```
effectiveTravelCost = travelCost * TRAVEL_COST_WEIGHT
totalCost = max(effectiveTravelCost + tickCost, 1)
valuePerTick = expectedReward / totalCost
```

**Constants table:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `TRAVEL_COST_WEIGHT` | 0.5 | 0.2–1.0 | Dampens travel distance impact on scoring. 0.5 = travel costs half as much per tick as encounter work |

At 0.5, a 3-hop journey adds 1.5 to the denominator instead of 3. Combined with exploration bonus, distant locations become competitive.

**Fail-soft:** Same as current — unreachable locations get travelCost=9999, still effectively eliminated.

---

## Phase C: Difficulty Escalation & Encounter Chains

### Problem
All encounters use `DIFFICULTY_BASE = 25` with `DIFFICULTY_STEP = 10`, producing steps at difficulty 25/35/45. Agents grow in capability but never face harder challenges. The 3 difficulty tiers (`early`/`mid`/`late`) exist in code but are never applied dynamically.

### Design: Dynamic Difficulty Selection

#### C.1 — Capability-Scaled Difficulty Tier

When the encounter cache builds entries, apply difficulty tier multipliers based on the template's threat rating mapped to a target capability range. But scoring already computes `estimateStepProbability` per the agent's actual capability — the issue is that all templates use the same base difficulty numbers.

**Solution:** Add a `difficultyTier` property to encounter cache entries and select it based on the location's sphere alignment intensity + a global game-progression proxy (average agent capability across all living agents).

```typescript
function selectDifficultyTier(tick: number, gameState: GameState): string {
  if (tick < EARLY_GAME_THRESHOLD) return 'early';
  if (tick < MID_GAME_THRESHOLD) return 'mid';
  return 'late';
}
```

This is simple and predictable: the world gets harder over time. It doesn't need to be per-agent — the encounter system already scores based on individual capability. A harder world means agents must grow or struggle.

**Constants table:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `EARLY_GAME_THRESHOLD` | 40 | 20–80 | Ticks before difficulty shifts from early to mid |
| `MID_GAME_THRESHOLD` | 120 | 60–200 | Ticks before difficulty shifts from mid to late |
| `DIFFICULTY_TIER_MULTIPLIERS` | `{early: 0.8, mid: 1.0, late: 1.3}` | Already exists | Applied to DIFFICULTY_BASE and DIFFICULTY_STEP |

**Integration:** The encounter cache rebuild (which runs on graph changes) passes the current difficulty tier. `buildEntry()` applies the multiplier to each step's difficulty. This means the entire encounter pool shifts in difficulty over time.

**Tracing:** Emit `difficulty_tier_change` trace when the tier advances. Include old tier, new tier, tick, and average agent capability.

**PRNG:** None — deterministic tier based on tick count.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Tick count unavailable | Default to 'early' |
| Multiplier missing for tier | Use 1.0 |

#### C.2 — Encounter Chains (Sequential Narrative)

Add encounter chains: completing one encounter unlocks the next. This creates narrative arcs and gives agents goals beyond "cycle available encounters."

```typescript
interface EncounterChain {
  id: string;
  name: string;
  /** Ordered list of template IDs. Agent must complete [i] before [i+1] is visible. */
  stages: string[];
  /** Reward multiplier applied to the final stage completion */
  chainCompletionBonus: number;
}
```

**Chain progression stored on agent:**

```typescript
interface ChainProgress {
  /** chainId → index of highest completed stage */
  progress: Record<string, number>;
}
```

Stored as `agent.properties.chainProgress`.

**Filter pipeline integration:** In `filterByPrerequisites` (Stage 3, currently a placeholder), check: if a template is part of a chain and isn't the first stage, require that the agent has completed the previous stage.

**Starter chains (3, proving the mechanic):**

1. **"The Scholar's Path"** — `knowledge_test` → `forbidden_tome` → `arcane_duel` (Lore → Shadow → Arcane escalation)
2. **"Rise Through the Ranks"** — `recruit_militia` → `guild_negotiation` → `arena_combat` (Iron → Heart → Iron escalation)
3. **"The Merchant's Gambit"** — `merchants_gambit` → `caravan_deal` → `smuggler_pact` (Gold → Gold → Shadow escalation)

Each chain's later stages use higher difficulty tiers. Completing a chain grants a one-time capability bonus in the chain's primary reach.

**Constants table:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `CHAIN_COMPLETION_CAPABILITY_BONUS` | 0.05 | 0.02–0.10 | One-time capability boost on chain completion |
| `CHAIN_STAGE_SCORE_BONUS` | 0.15 | 0.05–0.30 | Flat scoring bonus for the next stage in an active chain (pulls agents toward chain progression) |
| `MAX_ACTIVE_CHAINS` | 2 | 1–5 | Maximum concurrent chain progressions per agent |

**Tracing:** `chain_progress` trace on stage completion: agentId, chainId, stageIndex, templateId, isChainComplete.

**PRNG:** None — progression is deterministic (complete stage → next unlocks).

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Missing chainProgress on agent | Initialize empty — agent starts all chains from stage 0 |
| Chain references nonexistent template | Skip that stage in the chain |
| Agent has more than MAX_ACTIVE_CHAINS | Soft cap — don't prevent progression, just don't add chain bonus to scoring for excess chains |

---

## Phase D: Agent Personality & Born-Later Fix

### Problem
1. Agent axiological profiles and sphere alignments don't meaningfully differentiate encounter choice because the encounter pool at each location is too small (5–7 templates). With Phase A expanding pools, this becomes solvable.
2. Born-later agents (spawned mid-game) arrive at locations with no encounter content. They need to spawn at locations that have content, or content needs to come to them.

### Design

#### D.1 — Personality-Weighted Scoring Amplification

The desire multiplier already uses axiological profiles, but `MINIMUM_DESIRE = 0.1` floors it so low that personality barely matters. With larger encounter pools (Phase A), we can make personality more decisive.

**Tuning changes:**

| Constant | Old Value | New Value | Rationale |
|----------|-----------|-----------|-----------|
| `MINIMUM_DESIRE` | 0.1 | 0.05 | Lower floor lets personality differentiate more |
| `AMBITION_REACH_BOOST` | 0.2 | 0.3 | Ambitions pull harder toward matching encounters |

**New constant:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `PERSONALITY_SCORE_EXPONENT` | 1.5 | 1.0–2.0 | Exponent applied to desireMultiplier. >1.0 amplifies differences between liked and disliked encounters |

**Integration** (in `encounterScoring.ts`):

```
desireMultiplier = max(axiologicalScore + ambitionBoost, MINIMUM_DESIRE)
desireMultiplier = desireMultiplier ^ PERSONALITY_SCORE_EXPONENT  // amplify personality signal
```

With exponent 1.5: a desire of 0.5 becomes 0.35 (penalized), a desire of 1.0 stays 1.0, a desire of 1.5 becomes 1.84 (amplified). This spreads out the scoring distribution so personality has real teeth.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Exponent causes NaN (negative base) | Clamp desireMultiplier to ≥0.01 before exponentiation |

#### D.2 — Born-Later Spawn Location Selection

Born-later agents currently spawn at arbitrary locations. Fix: spawn them at locations that have encounter content.

**Integration** (in worldSeed or wherever born-later agents are created):

```typescript
function selectSpawnLocation(graph: WorldGraph, encounterCache: EncounterCacheManager): string {
  // Prefer locations with encounter cache entries
  const locationsWithContent = encounterCache.getLocationsWithEntries();
  if (locationsWithContent.length > 0) {
    return pickRandom(locationsWithContent, rng);
  }
  // Fallback: any location
  return pickRandom(allLocations, rng);
}
```

**Constants table:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `BORN_LATER_PREFER_CONTENT_LOCATIONS` | true | boolean | Whether born-later agents prefer locations with encounters |
| `BORN_LATER_MIN_TEMPLATES` | 3 | 1–10 | Minimum encounter templates at spawn location |

**Tracing:** Include spawn location and available template count in the agent birth trace.

**PRNG:** Uses seeded RNG for spawn location selection.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| No location has ≥BORN_LATER_MIN_TEMPLATES | Spawn at any location (existing behavior) |
| Encounter cache not yet built | Spawn at any location (existing behavior) |

---

## Phase E: Cooldown Scaling & Score Display Fix

### Problem
1. 8-tick cooldowns on both abandon and completion are too long for small encounter pools. With 5–7 templates and 8-tick cooldown, agents cycle predictably and often hit `all_on_cooldown`.
2. All scores display as `0.00` in the encounter logs, making debugging impossible.

### Design

#### E.1 — Dynamic Cooldowns

Scale cooldowns based on available encounter pool size. Large pools can afford long cooldowns. Small pools need short ones.

```typescript
function getEffectiveCooldown(
  baseCooldown: number,
  availableTemplateCount: number,
): number {
  if (availableTemplateCount >= COOLDOWN_FULL_POOL_SIZE) return baseCooldown;
  const scale = availableTemplateCount / COOLDOWN_FULL_POOL_SIZE;
  return Math.max(COOLDOWN_MINIMUM, Math.round(baseCooldown * scale));
}
```

**Constants table:**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `COOLDOWN_FULL_POOL_SIZE` | 15 | 8–30 | Template count at which full cooldown applies |
| `COOLDOWN_MINIMUM` | 2 | 1–4 | Minimum cooldown ticks regardless of pool size |
| `ENCOUNTER_ABANDON_COOLDOWN` | 8 → 6 | 4–12 | Reduced base abandon cooldown |
| `ENCOUNTER_COMPLETION_COOLDOWN` | 8 → 6 | 4–12 | Reduced base completion cooldown |

With a pool of 5 templates and `COOLDOWN_FULL_POOL_SIZE = 15`: effective cooldown = `round(6 * 5/15)` = 2 ticks. With 15+ templates: full 6 ticks.

**Integration:** In `filterByCooldown()` inside `phaseAgentDecision.ts`, compute `availableTemplateCount` from the encounter cache for the agent's location, then use `getEffectiveCooldown()` instead of the raw constant.

**Tracing:** Include effective cooldown in the idle decision trace when `reason=all_on_cooldown`.

**PRNG:** None.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Can't determine template count | Use base cooldown (existing behavior) |

#### E.2 — Score Display Fix

Investigate and fix the `0.00` score display in encounter logs. Two hypotheses:

1. **Rounding to 2 decimal places hides small scores** — scores may be real but tiny (e.g., 0.003). Fix: use `.toFixed(4)` in `encounterLogExporter.ts`.
2. **Scores are genuinely near-zero** — `valuePerTick` is very small because `expectedReward` is small and `totalCost` is moderate. Fix: verify reward estimates in encounter cache and adjust if needed.

**Investigation task:** Run the CLI for 30 ticks, inspect `ScoringTrace` entries in the trace buffer. Check if `finalScore` values are genuinely near-zero or just poorly formatted.

**Fix in `encounterLogExporter.ts`:**

```typescript
// Change from
`score=${event.score.toFixed(2)}`
// To
`score=${event.score.toFixed(4)}`
```

Also add `prob` (completion probability) and `desire` (desire multiplier) to the DECIDE event detail for richer diagnostics:

```typescript
case 'DECIDE':
  return `target=${event.targetLocation} | encounter=${event.targetEncounter} | score=${event.score.toFixed(4)} | desire=${event.desireMultiplier?.toFixed(2) ?? '?'} | prob=${event.completionProb.toFixed(2)} | travelCost=${event.travelCost} | hex=${formatHex(event.targetHex)}`;
```

**Tracing:** No new traces — this is a display fix.

**Fail-soft:** If `desireMultiplier` is missing from older events, display `?`.

---

## UI Phase

### Player-Facing Display

- **Agent Profile → Journey tab**: Show familiarity counts ("has attempted The Deep Descent 5 times"), exploration record ("has visited 3 of 12 known locations"), and chain progress ("Scholar's Path: stage 2/3 complete").
- **Chronicle**: Difficulty tier transitions generate chronicle entries ("The world grows harder — challenges that once seemed manageable now test even seasoned heroes").
- **Encounter Modal**: Show chain context when an encounter is part of a chain ("Part 2 of The Scholar's Path").

### Event Notifications

| Event | Channel | Glyph | When |
|-------|---------|-------|------|
| Difficulty tier advance | Toast | ⚔️ | On tick crossing threshold |
| Chain stage complete | Toast | 🔗 | On encounter completion that advances a chain |
| Chain fully complete | Alert | 🏆 | On final chain stage completion |
| Agent first travel | Silent chronicle | 🗺️ | First time an agent moves to a new location |

### Debug Inspection

- **DebugPanel → Encounter tab**: Add columns for familiarity count, exploration bonus, effective cooldown, and chain progress per agent.
- **DebugPanel → Scoring tab**: Show full score breakdown including familiarity penalty, exploration bonus, personality exponent effect. Use 4 decimal places.

### Visual Presence

- No new map overlays needed. Agent movement trails (already in HexMapV2) become visible once agents actually travel.
- Chain progress could be shown as a subtle icon on the agent dot in future, but not required for this phase.

---

## Wiring

| Module | Orchestrator | UI rendering | GameState | Traces | Debug | Prose | Controls |
|--------|-------------|-------------|-----------|--------|-------|-------|----------|
| Familiarity tracking | `phaseAgentDecision` updates on encounter start | Journey tab | `agent.properties.familiarityRecord` | None (scoring trace includes familiarity penalty) | Encounter tab shows counts | `enrichProse` could reference familiarity | None |
| Exploration tracking | `phaseMovement` updates on ARRIVE | Journey tab | `agent.properties.explorationRecord` | None (scoring trace includes bonus) | Encounter tab shows visited count | Chronicle on first visit | None |
| Travel cost dampening | `encounterScoring.scoreAndSelect()` | N/A (internal) | N/A | Scoring trace shows effective cost | Scoring tab | N/A | N/A |
| Difficulty tier | `encounterCache.rebuild()` applies multiplier | Chronicle, Encounter Modal | `gameState.difficultyTier` (new) | `difficulty_tier_change` | Encounter tab | Chronicle prose on tier change | N/A |
| Encounter chains | `filterByPrerequisites` (Stage 3) + scoring bonus | Journey tab, Encounter Modal | `agent.properties.chainProgress` | `chain_progress` | Journey tab shows chain state | Chain context in encounter prose | N/A |
| Personality amplification | `encounterScoring.scoreAndSelect()` | N/A (internal) | N/A | Scoring trace already has desireMultiplier | Scoring tab | N/A | N/A |
| Born-later spawn | Agent birth logic | N/A | N/A | Birth trace includes location + template count | N/A | N/A | N/A |
| Dynamic cooldowns | `phaseAgentDecision.filterByCooldown()` | N/A (internal) | N/A | Idle trace includes effective cooldown | Encounter tab | N/A | N/A |
| Score display fix | `encounterLogExporter.formatDetail()` | N/A (export only) | N/A | N/A | N/A | N/A | N/A |

---

## Implementation Ordering

Ship in this order. Each phase is independently valuable and testable:

| Phase | What | Effort | Impact | Can ship alone? |
|-------|------|--------|--------|----------------|
| **A** | Template coverage expansion | Small (content editing) | **Highest** — fixes the #1 problem (content deserts) | ✅ |
| **E.2** | Score display fix | Tiny (1-line change) | Medium — enables debugging everything else | ✅ |
| **E.1** | Dynamic cooldowns | Small (1 function + constant) | Medium — reduces round-robin cycling | ✅ |
| **B.3** | Travel cost dampening | Small (1 constant change) | Medium — softens anti-travel bias | ✅ |
| **B.1** | Familiarity discount | Medium (new agent property + scoring change) | **High** — breaks encounter cycling | ✅ |
| **B.2** | Exploration bonus | Medium (new agent property + scoring change) | **High** — creates movement pressure | ✅ |
| **D.1** | Personality amplification | Small (constant tuning + 1 line) | Medium — differentiates agents | ✅ |
| **D.2** | Born-later spawn fix | Small (spawn location logic) | Medium — fixes 25% of agents | ✅ |
| **C.1** | Difficulty escalation | Medium (cache rebuild change) | Medium — creates progression | ✅ |
| **C.2** | Encounter chains | Large (new data type + filter wiring + 3 chains) | **High** — creates narrative arcs | ✅ but best after A+B |

**Recommended grouping for Claude Code sessions:**

- **Session 1:** A + E.2 + E.1 (content + display + cooldowns — immediate impact, low risk)
- **Session 2:** B.1 + B.2 + B.3 + D.1 (movement pressure + personality — the scoring overhaul)
- **Session 3:** D.2 + C.1 (born-later fix + difficulty — spawn and progression)
- **Session 4:** C.2 (encounter chains — largest single feature)

---

## Verification Plan

After each session, export encounter logs and run the `agent-analyser` skill. Compare against the seed-42 baseline:

| Metric | Baseline (seed 42) | Target after Session 1 | Target after all 4 |
|--------|--------------------|-----------------------|--------------------|
| Active agent rate | 31% | >60% | >80% |
| Idle rate | 85%+ | <50% | <25% |
| Agents that traveled | 0 | 0 (travel not addressed yet) | >50% |
| Template utilization | 31% | >50% | >70% |
| Difficulty bands used | 1 (trivial/easy) | 1 (not addressed yet) | 3+ |
| Born-later activity | 0% | 0% (not addressed yet) | >50% |
| Score display | all 0.00 | meaningful values | meaningful values |
| Unique encounters per active agent | 5–7 | >10 | >15 |

---

## All New & Modified Constants (Master Table)

| Constant | File | Default | New/Modified | Phase |
|----------|------|---------|-------------|-------|
| `FAMILIARITY_DECAY_PER_ATTEMPT` | agent-behavior-constants.ts | 0.12 | New | B.1 |
| `FAMILIARITY_MAX_PENALTY` | agent-behavior-constants.ts | 0.7 | New | B.1 |
| `EXPLORATION_NOVELTY_BONUS` | agent-behavior-constants.ts | 0.3 | New | B.2 |
| `EXPLORATION_BONUS_DECAY_TICKS` | agent-behavior-constants.ts | 50 | New | B.2 |
| `TRAVEL_COST_WEIGHT` | agent-behavior-constants.ts | 0.5 | New | B.3 |
| `EARLY_GAME_THRESHOLD` | agent-behavior-constants.ts | 40 | New | C.1 |
| `MID_GAME_THRESHOLD` | agent-behavior-constants.ts | 120 | New | C.1 |
| `CHAIN_COMPLETION_CAPABILITY_BONUS` | agent-behavior-constants.ts | 0.05 | New | C.2 |
| `CHAIN_STAGE_SCORE_BONUS` | agent-behavior-constants.ts | 0.15 | New | C.2 |
| `MAX_ACTIVE_CHAINS` | agent-behavior-constants.ts | 2 | New | C.2 |
| `MINIMUM_DESIRE` | agent-behavior-constants.ts | 0.1 → 0.05 | Modified | D.1 |
| `AMBITION_REACH_BOOST` | agent-behavior-constants.ts | 0.2 → 0.3 | Modified | D.1 |
| `PERSONALITY_SCORE_EXPONENT` | agent-behavior-constants.ts | 1.5 | New | D.1 |
| `BORN_LATER_PREFER_CONTENT_LOCATIONS` | agent-behavior-constants.ts | true | New | D.2 |
| `BORN_LATER_MIN_TEMPLATES` | agent-behavior-constants.ts | 3 | New | D.2 |
| `COOLDOWN_FULL_POOL_SIZE` | agent-behavior-constants.ts | 15 | New | E.1 |
| `COOLDOWN_MINIMUM` | agent-behavior-constants.ts | 2 | New | E.1 |
| `ENCOUNTER_ABANDON_COOLDOWN` | types/encounter.ts | 8 → 6 | Modified | E.1 |
| `ENCOUNTER_COMPLETION_COOLDOWN` | types/encounter.ts | 8 → 6 | Modified | E.1 |

---

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | **PASS** — 19 named constants, all in agent-behavior-constants.ts. Zero magic numbers. |
| 2 | Inspectability | **PASS** — scoring trace extended with familiarity/exploration/chain data. New `chain_progress` and `difficulty_tier_change` traces. Encounter log exporter enhanced. |
| 3 | Determinism | **PASS** — all new mechanics are deterministic. Born-later spawn uses seeded PRNG. No new randomness. |
| 4 | Fail-soft | **PASS** — every new data structure has documented missing-data fallbacks. All degrade to existing behavior. |
| 5 | Narrative over mechanical | **PASS** — encounter chains create narrative arcs. Familiarity and exploration are narratively motivated ("the hero seeks new horizons"). Difficulty tiers use existing prose tone adjectives. |
| 6 | Additive over destructive | **PASS** — all changes add new agent properties and scoring terms. No existing fields removed. Score formula extended, not replaced. Filter pipeline Stage 3 placeholder filled, not restructured. |
| 7 | Performance budget | **PASS with note** — familiarity and exploration lookups are O(1) record access per candidate. Chain prerequisite check is O(chains × stages) per candidate but bounded by MAX_ACTIVE_CHAINS. Encounter cache rebuild with difficulty tier is same complexity. No profiling concern anticipated, but should measure after Session 2 with 30-tick CLI run. |
