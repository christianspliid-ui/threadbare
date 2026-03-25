# Agent Spawn Assessment Framework

> Created 2026-03-25. Purpose: verify that every agent in the game is spawned with correct, complete data so they don't misbehave during map testing.

## Overview: Agents in the Game

The game spawns two categories of agents at world creation, and a third emerges during gameplay:

| Category | Actor Type | Count | Created By | Lifecycle |
|----------|-----------|-------|------------|-----------|
| **Seeded individuals** | `individual` | 8–12 per world | `worldSeed.ts` | Persistent (can die via reputation < 0.1) |
| **Seeded factions** | `faction` | 2–3 per world | `worldSeed.ts` | Persistent |
| **Born individuals** | `individual` | 0–1 per tick | `agentLifecycle.ts` | Dynamic birth/death |

All agents are graph nodes with `type: 'actor'` and an `actorType` property that distinguishes them.

---

## Required Properties per Agent Type

### Individuals (seeded)

| Property | Type | Range/Values | Source | Risk if Missing |
|----------|------|-------------|--------|-----------------|
| `actorType` | string | `'individual'` | worldSeed | **Fatal** — tick phases filter on this; agent invisible to game |
| `axiologicalProfile` | Record (10 pairs) | each –1.0 to +1.0 | `generateAxiologicalProfile()` | Decision scoring breaks; movement profile defaults to neutral |
| `domainCapabilities` | Record (9 reaches) | each 10–50 (1–2 boosted to 30–70) | `generateDomainCapabilities()` | Encounter eligibility fails; capability growth stalls |
| `locationId` | string | valid location node ID | random from locationIds | Agent has no position; decision phase skips agent |
| `narrativeArchetype` | string | one of 19 archetype IDs | random from NARRATIVE_ARCHETYPES | Prose generation fails; vignette seeds empty |
| `cooperationStrategy` | string | tit-for-tat, grudger, pavlov, always-cooperate, always-defect | `assignCooperationStrategy()` | Disposition phase crashes or produces unpredictable results |
| `reputationScore` | number | 0.0–1.0 (default 0.5) | DEFAULT_REPUTATION | Reputation decay targets undefined; possible NaN cascade |

### Required Edges for Individuals

| Edge Type | Target | Cardinality | Risk if Missing |
|-----------|--------|-------------|-----------------|
| `located_at` | location node | exactly 1 | Decision phase skips agent (fail-soft); agent invisible on map |
| `member_of` | faction node | 0 or 1 (70% chance at seed) | No faction affiliation — cosmetic only, not a bug |
| `pursues` | ambition node | 1+ | No ambitions — agent idles indefinitely, reduced narrative |
| `worships` | god/ascendant | 0–1 (assigned later by player) | `getAgentDetail()` returns null — **agent invisible in UI** |

### Factions (seeded)

| Property | Type | Range/Values | Risk if Missing |
|----------|------|-------------|-----------------|
| `actorType` | string | `'faction'` | Faction invisible to game |
| `axiologicalProfile` | Record (10 pairs) | each –1.0 to +1.0 | Faction disposition broken |
| `domainCapabilities` | Record (9 reaches) | each 10–50 | Faction power level undefined |

### Born Individuals (runtime)

Same required properties as seeded individuals, but with these **known differences** that could cause problems:

| Property | Seeded Value | Born Value | Concern |
|----------|-------------|------------|---------|
| `axiologicalProfile` | Full 10-pair record | **Empty object `{}`** | Decision scoring, disposition, and cultural tension all read specific pairs — empty profile means all lookups return `undefined` |
| `domainCapabilities` | 10–50 per reach | 0.1–0.5 per reach | Very weak — may never qualify for any encounter |
| `bornTick` | not set | set to current tick | Not a problem — used correctly for lifecycle tracking |

---

## Assessment Framework: Validation Checklist

For each agent in the game, verify the following. Results should be pass/fail per agent.

### Check 1: Node Integrity
- [ ] Node exists in graph with `type: 'actor'`
- [ ] `actorType` is one of: `individual`, `faction`, `culture`, `group`, `god`, `ascendant`
- [ ] `name` is a non-empty string
- [ ] `id` is unique

### Check 2: Axiological Profile Completeness
- [ ] `axiologicalProfile` is a non-empty object (not `{}`)
- [ ] Contains all 10 canonical pairs: mercy_ruthlessness, asceticism_extravagance, honesty_cunning, loyalty_ambition, tradition_innovation, order_freedom, pride_humility, patience_wrath, courage_caution, idealism_pragmatism
- [ ] Each value is a number in range [–1.0, +1.0]

### Check 3: Domain Capabilities Completeness
- [ ] `domainCapabilities` is a non-empty object
- [ ] Contains all 9 reaches: iron, gold, shadow, veil, heart, eye, stone, star, flesh
- [ ] Each value is a number ≥ 0

### Check 4: Location Binding (individuals only)
- [ ] Has exactly one `located_at` outgoing edge
- [ ] Target of that edge is a valid location node in the graph
- [ ] `properties.locationId` matches the `located_at` edge target (or at least one is valid)

### Check 5: Identity Properties (individuals only)
- [ ] `narrativeArchetype` is a string matching a known archetype ID
- [ ] `cooperationStrategy` is one of: tit-for-tat, grudger, pavlov, always-cooperate, always-defect
- [ ] `reputationScore` is a number in range [0.0, 1.0]

### Check 6: Edge Relationships
- [ ] If `member_of` edge exists → target is a valid faction node
- [ ] If `pursues` edges exist → each target is a valid ambition node with status/priority properties
- [ ] If `worships` edge exists → target is a valid god/ascendant node
- [ ] If `belongs_to` edge exists → target is a valid culture node

### Check 7: Movement State Integrity (if present)
- [ ] `movementState.destinationId` references a valid location node
- [ ] `movementState.movementQueue` is an array of valid location node IDs
- [ ] `movementState.ticksAccumulated` is a non-negative number
- [ ] `movementState.currentEdgeCost` is a positive number
- [ ] If `roadHexQueue` present → each entry has valid `col` and `row`

---

## Known Risks and Defects Found

### RISK 1: Born agents have empty axiological profiles — HIGH
**Impact:** Every phase that reads axiologicalProfile will get `undefined` for each pair. The movement phase has a fallback (defaults all pairs to 0), but the decision phase and disposition system may not.

**Evidence:** `agentLifecycle.ts` birth function sets `axiologicalProfile: {}` — an empty object. The seeding function uses `generateAxiologicalProfile(rng, cosmology)` which produces all 10 pairs.

**Recommendation:** Born agents should call `generateAxiologicalProfile()` or at minimum inherit a blended profile from agents at the birth location. This is a code fix for Claude Code.

### RISK 2: No centralized agent validation — MEDIUM
**Impact:** Each tick phase independently handles missing data with different strategies (skip, default, crash). No single point verifies an agent is "well-formed" before it enters the tick loop.

**Recommendation:** Add a `validateAgentIntegrity(graph, agentId)` function that runs the checklist above. Call it after world seed and after each birth event. Emit a trace warning for any failure.

### RISK 3: Dual location source of truth — MEDIUM
**Impact:** `locationId` property and `located_at` edge can diverge. `phaseAgentDecision` reads the edge; `agentDetail` falls back to the property. If they disagree, the agent appears in different places depending on which code path asks.

**Recommendation:** Canonicalize on the `located_at` edge. Deprecate or remove `properties.locationId`. Add a migration to clean up any divergences.

### RISK 4: `worships` edge is required for UI visibility — MEDIUM
**Impact:** `getAgentDetail()` returns `null` if the agent doesn't have a `worships` edge to the player's ascendant. At world seed, agents may not have this edge yet. They will be invisible in the UI until the player establishes worship.

**Expected?** Possibly by design (only show agents your deity has influence over). Verify this is intentional.

### RISK 5: MovementState shape not validated — LOW
**Impact:** If `movementState` is present but has missing/malformed fields (e.g., `movementQueue` is empty, `currentEdgeCost` is 0), movement phase will silently malfunction.

**Recommendation:** Add a `isValidMovementState()` type guard before processing.

### RISK 6: Uneven fail-soft coverage — LOW
**Impact:** `phaseAgentDecision` wraps the entire agent loop in try-catch (good), but `phaseMovement` does not. A single malformed agent could crash the movement phase and halt the tick loop.

**Recommendation:** Add try-catch wrapping in `phaseMovement` consistent with `phaseAgentDecision`.

---

## Agent Name Pools

| Pool | Count | Used By | Notes |
|------|-------|---------|-------|
| Seeded individuals | 16 names | worldSeed | Kael, Mirael, Thorne, Lyssa, Dren, Isolde, Varn, Ashara, Brynn, Cael, Dara, Fen, Gale, Hestia, Jorik, Kira |
| Born individuals | separate pool | agentLifecycle | BORN_NAMES array (different from seed pool) |
| Factions | 6 names | worldSeed | The Iron Covenant, The Verdant Circle, The Ashen Hand, The Silver Tide, The Obsidian Watch, The Gilded Pact |

---

## Narrative Archetypes (19 total)

Each archetype drives cooperation strategy, reach affinities, prose tone, and beat patterns:

tragic_hero, trickster, coming_of_age, brooding_warrior, fallen_noble, true_believer, schemer, wanderer, monster, folk_hero, reluctant_king, oathkeeper, poisoned_court, doomed_innocent, old_power, kingmaker, seeker, maker, noble_savage

---

## Ambition Templates (14 total)

Standard (10): dominate_trade, conquer_territory, forge_legend, arcane_enlightenment, found_dynasty, escape_cursed_land, uncover_secrets, spread_faith, great_work, greatest_healer

Reactive (4, triggered by events): seek_revenge, reclaim_homeland, avenge_fallen, fulfill_destiny

Each has reach floor requirements, trait blockers, sphere affinities, milestones, and abandonment triggers.

---

## Suggested Next Steps

1. **Implement `validateAgentIntegrity()`** — a pure function that runs Checks 1–7 above on any agent node and returns a structured result. Call it post-seed and post-birth.
2. **Fix born agent axiological profiles** — generate a real profile instead of `{}`.
3. **Add try-catch to `phaseMovement`** — match `phaseAgentDecision`'s fail-soft pattern.
4. **Canonicalize location source of truth** — pick `located_at` edge, remove `locationId` property.
5. **Add a runtime agent roster dump** — a debug command (or trace output) that lists every active agent with their check results, viewable from the dev console.
