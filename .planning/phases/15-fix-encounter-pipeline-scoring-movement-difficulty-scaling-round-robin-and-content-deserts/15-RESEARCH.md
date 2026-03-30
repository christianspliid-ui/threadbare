# Phase 15: Fix Encounter Pipeline — Research

**Researched:** 2026-03-30
**Domain:** Engine — encounter decision pipeline, scoring, content authoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Score Display Bug (Quick Fix)**
- `phaseAgentDecision.ts:387` uses `c.templateId` but `ScoredCandidate` has `c.entry.templateId`
- Fix: change `c.templateId` to `c.entry.templateId` in the `.find()` call
- This is prerequisite for all tuning work — without real scores in logs, constant changes cannot be verified

**Movement Incentives**
- Primary lever: reduce `TRAVEL_COST_WEIGHT` (currently 0.5)
- Personality-driven wanderlust: agents with high curiosity/ambition travel sooner; cautious/loyal agents stay put longer
- Use existing axiological profile to modulate the travel cost penalty or exploration bonus per agent

**Difficulty Scaling (both layered)**
1. Max completions per template per agent — after N completions, removed from that agent's pool entirely
2. Outgrowth lock — when agent cap exceeds template difficulty by threshold, encounter drops from filter
- New templates should span diff=20 through diff=90

**Round-Robin Breaking**
- Target 20+ hand-authored templates per location archetype (up from 5-8)
- Universal terrain-flavored encounters available at every location with terrain-specific flavor text
- Hand-authored only (no procedural generation)
- Cross-location awareness already implemented; will become effective once travel cost weight is reduced

**Content Desert Fallback**
- After 10 consecutive idle ticks, agent picks nearest location with available content and initiates travel
- Named constant: `IDLE_FORCED_TRAVEL_THRESHOLD = 10`
- Universal terrain-flavored encounters should eliminate most content deserts; this is the safety net

### Claude's Discretion
- Exact `TRAVEL_COST_WEIGHT` value after reduction
- How personality maps to wanderlust (which axiological pairs, what multiplier range)
- Max completions threshold for encounter retirement
- Outgrowth lock cap-diff threshold
- Travel range selection algorithm (nearest-interesting vs best-within-awareness)
- How terrain-flavored universal encounters are structured in encounter-content.ts
- DECIDE log format improvements (score component breakdown)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 15 fixes 5 systemic encounter pipeline problems identified in seed-42 analysis (644 ticks, 8 agents). The problems are: (1) a property access bug making all scored decisions show score=0.0000 and desire=?, (2) zero agent movement because travel cost always dominates scoring, (3) encounter round-robin from small closed pools, (4) no difficulty escalation despite growing agent capabilities, and (5) two agents permanently idle at content-desert locations.

The codebase is already well-structured for these fixes. The scoring pipeline is a clean deterministic function chain. The `FamiliarityRecord` and `ExplorationRecord` types already exist and are partially plumbed. Constants are centralized in `agent-behavior-constants.ts`. The idle path already routes through `resolveIdleBehavior()` — the forced travel fallback integrates there. Content is all in `encounter-content.ts` with a clear template schema.

The score display bug at `phaseAgentDecision.ts:387` is confirmed: `decision.topCandidates.find(c => c.templateId === ...)` should be `c.entry.templateId`. The `ScoredCandidate` type has `entry: EncounterCacheEntry` as its first field — `templateId` is on `c.entry`, not directly on `c`. This explains the perpetual `score=0.0000` (`.find()` never matches, falls back to `?? 0`).

**Primary recommendation:** Fix the score display bug first, then tune constants and add retirement mechanics, then expand content, then wire forced travel fallback. The bug fix is a prerequisite for verifying all other changes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | All engine code | Project-wide, no exceptions |
| Vitest | existing | Test verification | All engine tests use Vitest |

No new dependencies required. All changes are to existing engine files and data files.

**Installation:** None needed.

---

## Architecture Patterns

### Existing Pipeline Flow

```
phaseAgentDecision.ts
  └─ runFilterPipeline()          (encounterFilterPipeline.ts)
       Stage 1: filterByAwareness()  (encounterAwareness.ts)
       Stage 2: Visibility           (questVisibility.ts)
       Stage 3: Prerequisites        (placeholder)
       Stage 4: Threat               (capability vs threat-rating)
       Stage 5: Cap + Diversity
  └─ filterByCooldown()           (phaseAgentDecision.ts)
  └─ scoreAndSelect()             (encounterScoring.ts)
       - completionProb
       - growthValue
       - travelCost (TRAVEL_COST_WEIGHT dampening)
       - valuePerTick = expectedReward / totalCost
       - desireMultiplier (axiological profile + personality exponent)
       - resonance (sphere alignment)
       - familiarityPenalty  ← extends into retirement
       - explorationBonus    ← already exists, just ineffective
       - finalScore
  └─ decision.selected?
       'start_local' | 'queue_movement' | 'attempt_remote'
       OR idle → resolveIdleBehavior()  ← forced travel hooks here
```

### Pattern 1: Score Display Bug Fix

**What:** `phaseAgentDecision.ts` line 387 does `.find(c => c.templateId === sel.entry.templateId)`. `ScoredCandidate.templateId` does not exist — the template ID is at `c.entry.templateId`.

**Fix:**
```typescript
// Before (line 387):
const selCandidate = decision.topCandidates.find(c => c.templateId === sel.entry.templateId);

// After:
const selCandidate = decision.topCandidates.find(c => c.entry.templateId === sel.entry.templateId);
```
This is a single-character change (`c.templateId` → `c.entry.templateId`). Once fixed, all DECIDE events will show real scores, making constant tuning verifiable.

### Pattern 2: Travel Cost + Personality Wanderlust

**What:** `TRAVEL_COST_WEIGHT = 0.5` currently means every hop of distance adds 0.5 to the denominator, consistently suppressing distant encounters below IDLE_SCORE_THRESHOLD.

**Tuning target:** Reduce `TRAVEL_COST_WEIGHT` from 0.5 to ~0.1–0.15. This makes a 3-hop encounter cost 0.3–0.45 additional ticks instead of 1.5 — competitive with local encounters when the distant one has higher value.

**Personality wanderlust:** Per-agent travel cost modifier using existing axiological profile. The `tradition_progress` pair maps to curiosity/conservatism. An agent with high `tradition_progress` (progress pole) gets a lower effective travel cost. Implementation options:
- Option A: Multiply `TRAVEL_COST_WEIGHT` by `(1 - curiosityFactor)` per agent. `curiosityFactor` derived from `tradition_progress` value clamped to [0, 1].
- Option B: Add a personality-driven exploration bonus additive to `explorationBonus` for distant locations.

Option A is cleaner — it operates at the source (travelCost calculation) rather than patching downstream. `tradition_progress` is a suitable proxy: progress-oriented agents value new experiences, tradition-oriented agents value staying put.

**New constant to add:**
```typescript
/** Per-agent travel cost scalar modifier range. At 0 = full cost (loyal/traditional), at 1 = cost * (1 - WANDERLUST_MAX_DISCOUNT).
 * @range 0.2–0.6 */
export const WANDERLUST_MAX_DISCOUNT = 0.4;

/** Axiological pair used to derive wanderlust tendency. Positive = tradition (stay), negative = progress (explore).
 * Read directly from agent.axiologicalProfile.tradition_progress */
export const WANDERLUST_PAIR = 'tradition_progress' as const;
```

The effective travel cost per agent becomes:
```typescript
const wanderlust = Math.max(0, -(profile.tradition_progress ?? 0)); // 0..1, higher = more curious
const personalTravelCostWeight = TRAVEL_COST_WEIGHT * (1 - wanderlust * WANDERLUST_MAX_DISCOUNT);
travelCost = distance * personalTravelCostWeight;
```

### Pattern 3: Encounter Retirement (Max Completions + Outgrowth Lock)

**What:** Two independent mechanisms retire encounters from an agent's pool.

**Mechanism 1 — Max completions:** The `FamiliarityRecord.attemptCount` already tracks attempt counts per template in `encounterScoring.ts`. Extend `computeFamiliarityPenalty()` to return `Infinity` (effectively retirement) when `attemptCount[templateId] >= MAX_COMPLETIONS_PER_TEMPLATE`. This converts the familiarity system into a hard-retirement system.

New constant:
```typescript
/** After this many completions of the same template, it is permanently retired for that agent.
 * @range 3–10 */
export const MAX_COMPLETIONS_PER_TEMPLATE = 5;
```

Implementation: In `filterByCooldown()` or as a separate pre-filter stage, check `familiarityRecord.attemptCount[c.templateId] >= MAX_COMPLETIONS_PER_TEMPLATE` and exclude those candidates. The filter is cleaner than having scoring return Infinity.

**Mechanism 2 — Outgrowth lock:** When an agent's capability in the template's primary reach exceeds the template's average difficulty by `OUTGROWTH_CAP_THRESHOLD`, the encounter is filtered out. This is a new filter stage (Stage 3.5, between Prerequisites and Threat, or as part of Stage 3).

New constants:
```typescript
/** How much higher than template difficulty the agent's cap must be (0–100 scale) before the encounter is outgrown.
 * @range 25–50 (lower = more aggressive retirement) */
export const OUTGROWTH_CAP_THRESHOLD = 35;

/** Whether outgrowth filtering is active. Toggle for tuning.
 * @range boolean */
export const OUTGROWTH_FILTER_ENABLED = true;
```

Implementation location: `encounterFilterPipeline.ts` Stage 3 (Prerequisites) is currently a placeholder — outgrowth filtering fits naturally here. It uses `computeCapability()` (already imported) and `entry.stepDifficulties` (already on `EncounterCacheEntry`).

### Pattern 4: Forced Travel Fallback (Content Desert Recovery)

**What:** When `no_candidates_after_filter` persists for `IDLE_FORCED_TRAVEL_THRESHOLD` ticks, the agent initiates travel to the nearest location with available content.

**Where to add:** `resolveIdleBehavior()` in `idleBehavior.ts` is called on every idle tick. It receives `localEntries` but not awareness of all locations. Options:
- Option A: Pass idle tick count and distant available entries into `resolveIdleBehavior()` — extend function signature.
- Option B: Handle in `phaseAgentDecision.ts` after `resolveIdleBehavior()` returns — count consecutive idle ticks per agent, then initiate travel if threshold exceeded.

Option B is cleaner — it does not change `resolveIdleBehavior`'s signature and keeps count tracking where the pipeline state lives.

**Idle tick tracking:** Store `consecutiveIdleTicks` in agent node properties. Increment on idle, reset to 0 on any non-idle decision or arrival.

New constant:
```typescript
/** Consecutive idle ticks before agent is forced to travel to nearest content-bearing location.
 * @range 5–20 */
export const IDLE_FORCED_TRAVEL_THRESHOLD = 10;
```

**Target selection for forced travel:** Use the `distanceMatrix` already available in `phaseAgentDecision.ts`. Iterate all encounter cache entries, exclude current location, find nearest location by hop count that has at least one entry not on cooldown. Use `findShortestPath()` to build the movement state (same as `queue_movement` path).

### Pattern 5: Content Expansion (Universal Terrain-Flavored Encounters)

**What:** Universal encounters use `locationTypes: ALL_LOCATION_SUBTYPES` — available everywhere. The file already has `ALL_LOCATION_SUBTYPES` and 18 universal templates (diff=20/25). New universal templates add terrain-flavor while keeping the same mechanics.

**Structure insight from codebase:** The template schema supports a `locationTypes` array — using `ALL_LOCATION_SUBTYPES` already makes an encounter available everywhere. The "terrain-flavored" requirement is prose differentiation, not a new schema field. Templates are selected per location by locationTypes match in the encounter cache build.

For location-type-specific flavor within a universal encounter, the simplest approach is multiple templates with the same mechanics but different `locationTypes` restriction. Example: `forage_forest` (locationTypes: woodland/dense_forest/boreal_forest), `forage_desert` (locationTypes: sand_desert/rocky_desert), etc. Same reach/difficulty, different name/narrative.

**Expansion targets identified:**
- Pale Cairn and Grey Meadowguard are permanently idle — these likely have `ruins` or `unexplored_poi` archetype. Need templates that match their locationTypes.
- Target: 20+ templates per archetype means roughly 10–12 new templates per major type (hamlet/town/city, ruins, wilderness, shrine/temple, fort/castle, mining, camp).

### Recommended Project Structure (No Changes to Existing)

```
src/
├── data/
│   ├── agent-behavior-constants.ts  ← add new constants (WANDERLUST_*, OUTGROWTH_*, MAX_COMPLETIONS_*, IDLE_FORCED_TRAVEL_*)
│   └── encounter-content.ts         ← add new templates (terrain-flavored universal + higher-difficulty location-specific)
├── engine/
│   ├── phaseAgentDecision.ts        ← fix score display bug, add forced travel logic, idle tick tracking
│   ├── encounterScoring.ts          ← add personality wanderlust to travelCost calculation
│   └── encounterFilterPipeline.ts   ← add outgrowth lock + max completions pre-filter
```

### Anti-Patterns to Avoid

- **Touching idleBehavior.ts signature for forced travel:** Counter to NFP #6 (additive over destructive). Handle forced travel in phaseAgentDecision.ts instead.
- **Procedural template generation:** CONTEXT.md locked this as hand-authored only. No dynamic template synthesis.
- **Changing encounter cache schema to add difficulty-scaling on load:** The cache already has `stepDifficulties`. Outgrowth uses these directly. No schema change needed.
- **Modifying DIFFICULTY_TIER_MULTIPLIERS for difficulty escalation:** The tier multiplier approach (early/mid/late by tick count) does not solve the problem — it applies globally and doesn't respond to per-agent capability. The outgrowth lock is the correct mechanism.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tracking attempt counts per template | Custom tracking | `FamiliarityRecord.attemptCount` already exists | Already stored on agent node properties, already incremented in phaseAgentDecision.ts line 421 |
| Pathfinding for forced travel | Custom hex walker | `findShortestPath()` + `initMovementState()` already used in queue_movement path | Same code path as encounter-motivated travel |
| Distance lookup for target selection | Scanning hex grid | `distanceMatrix` + `getDistance()` | Already passed into phaseAgentDecision |
| Personality profile access | New API | `node.properties.axiologicalProfile as AxiologicalProfile` | Standard pattern throughout scoring |
| Consecutive idle counting | Redis / external store | Agent node properties (same as movementState, familiarityRecord) | Consistent with graph-as-state architecture |

**Key insight:** All the mechanical infrastructure is present. This phase is 80% wiring existing systems correctly + 20% new data (content templates).

---

## Common Pitfalls

### Pitfall 1: Score Display Bug Is Not Just Cosmetic
**What goes wrong:** Treating the `score=0.0000` as only a display bug.
**Why it happens:** The `.find()` call at line 387 uses `c.templateId` not `c.entry.templateId`. When the find fails (always), it falls back to `selCandidate?.finalScore ?? 0`, so the DECIDE event logs `score=0`. But the actual `decision.selected` was chosen by the real score — so agents do make reasonable decisions. The bug is in the logging path, not the decision path.
**How to avoid:** Fix it early, re-run the seed-42 analysis, verify real scores appear before tuning constants.
**Warning signs:** If after the fix, scores still show 0 — the scoring formula itself has a problem.

### Pitfall 2: TRAVEL_COST_WEIGHT Reduction Makes All Agents Wander
**What goes wrong:** Reducing TRAVEL_COST_WEIGHT too aggressively causes all agents to prefer distant encounters over local ones (overcorrection).
**Why it happens:** `explorationBonus` (0.3 flat for unvisited) plus a near-zero travel cost makes all unvisited locations attractive.
**How to avoid:** Reduce in steps: 0.5 → 0.2 → 0.1. Verify with CLI runs (`npm run cli -- --seed 42`). Target: at least 50% of agents travel, but not all agents abandoning local encounters instantly.
**Warning signs:** If `score_for_distant_encounter >> score_for_local` after the fix, reduce the exploration bonus or increase travel weight slightly.

### Pitfall 3: Max Completions Filter Placement
**What goes wrong:** Adding max completions check inside `scoreAndSelect()` (post-scoring) vs `filterByCooldown()` (pre-scoring).
**Why it happens:** Scoring is expensive — filtering before scoring is correct for performance.
**How to avoid:** Add max completions to `filterByCooldown()` (it already reads `encounterProgress` and `familiarityRecord`). Or add as a new function `filterByRetirement()` called between the filter pipeline and cooldown filter. The `familiarityRecord` is available at that point via the agent node.
**Warning signs:** If implemented in scoring, agents with full retirement lists will still waste scoring cycles on eliminated candidates.

### Pitfall 4: Forced Travel Selects Inaccessible Locations
**What goes wrong:** `distanceMatrix` returns finite distances for locations connected by `adjacent` edges, but the agent may be on a disconnected island.
**Why it happens:** The distance matrix is graph-distance, not hex-path distance. Content deserts (Pale Cairn, Grey Meadowguard) may be far from any encounter-bearing location.
**How to avoid:** In forced travel target selection, verify `findShortestPath()` returns a valid path (non-null) before initiating movement. Fall back to `stay` if no reachable location has content.
**Warning signs:** Agents in forced travel ending up with empty movement queues or infinitely retrying.

### Pitfall 5: Universal Encounters Need locationTypes Match
**What goes wrong:** Adding new templates but they never appear in the encounter cache for Pale Cairn / Grey Meadowguard.
**Why it happens:** The encounter cache is built from templates filtered by `locationTypes` match to the actual location node's `locationType` property. If the new template's `locationTypes` doesn't include the location's type, it won't appear.
**How to avoid:** Before authoring, check what locationTypes Pale Cairn and Grey Meadowguard have. If `ALL_LOCATION_SUBTYPES` is used, every location is covered by definition.
**Warning signs:** `no_candidates_after_filter` persists for content-desert locations after adding templates — the locationTypes don't match.

### Pitfall 6: Idle Tick Counter State Persistence
**What goes wrong:** `consecutiveIdleTicks` stored in agent node properties gets corrupted by serialization or reset on game restart.
**Why it happens:** Agent node properties are serialized/deserialized as plain objects. A missing field at startup reads as `undefined`.
**How to avoid:** Treat missing field as 0 (`(actor.properties?.consecutiveIdleTicks as number | undefined) ?? 0`). Consistent with how `familiarityRecord` and `movementState` are already accessed.
**Warning signs:** Agents immediately triggering forced travel on game load (counter was persisted incorrectly across sessions).

---

## Code Examples

Verified patterns from existing codebase:

### Score Display Bug Fix
```typescript
// phaseAgentDecision.ts line 387 — CURRENT (broken):
const selCandidate = decision.topCandidates.find(c => c.templateId === sel.entry.templateId);

// FIXED:
const selCandidate = decision.topCandidates.find(c => c.entry.templateId === sel.entry.templateId);
```
Source: Direct read of `ScoredCandidate` type in `encounterScoring.ts` line 267 — field is `entry: EncounterCacheEntry`, not `templateId`.

### Personality-Driven Travel Cost (scoreAndSelect in encounterScoring.ts)
```typescript
// Replace current travelCost calculation (step 4):
const wanderlust = Math.max(0, -(profile.tradition_progress ?? 0)); // 0..1
const personalTravelCostWeight = TRAVEL_COST_WEIGHT * (1 - wanderlust * WANDERLUST_MAX_DISCOUNT);
travelCost = distance === 0 ? 0
  : !entry.requiresPresence ? 0
  : !isFinite(distance) ? 9999
  : distance * personalTravelCostWeight;
```

### Max Completions Pre-Filter (phaseAgentDecision.ts)
```typescript
// After filterByCooldown(), before scoreAndSelect():
const familiarityRecord = (actor.properties?.familiarityRecord as FamiliarityRecord | undefined) ?? { attemptCount: {} };
const candidatesAfterRetirement = candidatesAfterCooldown.filter(c => {
  const completions = familiarityRecord.attemptCount[c.templateId] ?? 0;
  return completions < MAX_COMPLETIONS_PER_TEMPLATE;
});
```
Source: Pattern from `computeFamiliarityPenalty()` in `encounterScoring.ts` line 228 — same `attemptCount` record.

### Forced Travel Fallback (phaseAgentDecision.ts, after idle path)
```typescript
// In the idle branch, after resolveIdleBehavior():
const idleTicks = ((actor.properties?.consecutiveIdleTicks as number | undefined) ?? 0) + 1;
graph.updateNode(agentId, { properties: { ...actor.properties, consecutiveIdleTicks: idleTicks } });

if (idleReason === 'no_candidates_after_filter' && idleTicks >= IDLE_FORCED_TRAVEL_THRESHOLD) {
  // Find nearest location with any unfiltered content
  let nearestContentLocId: string | null = null;
  let nearestDist = Infinity;
  for (const entry of allEntries) {
    if (entry.locationId === locationId) continue;
    const dist = getDistance(distanceMatrix, locationId, entry.locationId);
    if (dist < nearestDist) { nearestDist = dist; nearestContentLocId = entry.locationId; }
  }
  if (nearestContentLocId) {
    const graphPath = findShortestPath(graph, agentId, locationId, nearestContentLocId);
    if (graphPath) {
      // initMovementState (same as queue_movement path)
    }
  }
}
```
Source: Existing `queue_movement` block in `phaseAgentDecision.ts` lines 441–525 — identical movement initiation pattern.

### New Universal Encounter Template Structure
```typescript
// In encounter-content.ts, template using ALL_LOCATION_SUBTYPES:
{
  id: 'encounter.forage_wilderness',
  name: 'Forage the Land',
  locationTypes: ALL_LOCATION_SUBTYPES, // available everywhere
  reachPrimary: 'stone',
  reachSecondary: 'eye',
  encounterType: 'explore',
  threatRating: 'trivial',
  motivations: ['tradition_progress', 'mercy_ruthlessness'],
  steps: [
    {
      id: 'forage_wilderness.search',
      reach: 'eye',
      difficulty: UNIVERSAL_DIFFICULTY_BASE,      // 20
      duration: 2,
      narrative: '{actor} searches the terrain for useful resources.',
      onSuccess: { narrative: '{actor} finds what {they} need.', reputationDelta: 0.02 },
      onFailure: { narrative: '{actor} finds little of use.', reputationDelta: 0 },
    },
    {
      id: 'forage_wilderness.gather',
      reach: 'stone',
      difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,  // 25
      duration: 1,
      narrative: '{actor} gathers what the land offers.',
      onSuccess: { narrative: '{actor} returns with provisions.', reputationDelta: 0.03 },
      onFailure: { narrative: 'The effort yields little.', reputationDelta: 0 },
    },
  ],
},
```
Source: Existing universal template structure in `encounter-content.ts` lines 39–43, 100–103.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flesh Reach (9 reaches) | 8 reaches (flesh removed) | Phase 12 | `MAX_AWARENESS_HOPS` now uniform across all reaches |
| AgentWheel / fixed actions | ActionDrawer + encounter pipeline | Earlier phases | All agent activity flows through phaseAgentDecision |
| HexMap V1 (SVG) | HexMapV2 (Three.js) | Phase 8 | No relation to encounter pipeline |
| `FLESH_MAX_HOPS` constant | Removed — uniform `MAX_AWARENESS_HOPS` | Phase 12 | Simplification; don't reference old constant |

**Current score formula (verified from encounterScoring.ts):**
```
baseScore = valuePerTick * desireMultiplier + factionScoringBoost + resonance + globalResonance
finalScore = baseScore * (1 - familiarityPenalty) + explorationBonus + chainBonus
```
where `valuePerTick = expectedReward / totalCost` and `totalCost = max(travelCost + entry.totalTickCost, 1)`.

**Key observation:** `EXPLORATION_NOVELTY_BONUS = 0.3` is an additive bonus. With `IDLE_SCORE_THRESHOLD = 0.0001`, the exploration bonus alone is sufficient to push most distant encounters above threshold — but it does NOT help if `travelCost` makes the `valuePerTick` component collapse to near-zero before the additive bonus. The fundamental issue is that the travel cost inflates the denominator of `valuePerTick`, not the numerator — no additive bonus can fix a zero numerator. Reducing `TRAVEL_COST_WEIGHT` directly addresses the denominator problem.

---

## Open Questions

1. **Exact `TRAVEL_COST_WEIGHT` reduction value**
   - What we know: Currently 0.5, analysis shows 0 movement at this value
   - What's unclear: How much reduction causes balanced movement vs overcorrection
   - Recommendation: Start at 0.1, validate with `npm run cli -- --seed 42` 100 ticks, check MOVE event count. Claude's discretion per CONTEXT.md.

2. **Personality wanderlust axiological pair choice**
   - What we know: CONTEXT.md says "use existing axiological profile to modulate travel cost penalty"; `SPHERE_AXIOLOGICAL_MAP` maps Mind→honesty_cunning, suggesting Mind-sphere agents are curious
   - What's unclear: Whether `tradition_progress` or `loyalty_ambition` is the better proxy for "wanderlust"
   - Recommendation: `tradition_progress` (positive=conservative/stay, negative=progressive/explore) is more semantically accurate than `loyalty_ambition`. Claude's discretion per CONTEXT.md.

3. **Max completions threshold**
   - What we know: 5–8 templates per location currently, agents cycle them; CONTEXT.md says retirement after N completions
   - What's unclear: Whether N=3, 5, or 7 is balanced
   - Recommendation: `MAX_COMPLETIONS_PER_TEMPLATE = 5` (enough to feel the encounter, not so low it feels punishing). After retirement, agents should naturally need to travel or wait for new content. Claude's discretion per CONTEXT.md.

4. **Outgrowth lock threshold**
   - What we know: Difficulties are 20/25/35/45 for existing templates; agent caps reach 88–100 by tick 400
   - What's unclear: Whether threshold of 35 (35 points above diff=20 → triggers at cap=55) or 50 (triggers at cap=70) creates better progression
   - Recommendation: `OUTGROWTH_CAP_THRESHOLD = 35` — at diff=20, outgrowth kicks in at cap=55 (mid tier). This creates pressure to grow past mediocre and find harder content. Claude's discretion per CONTEXT.md.

5. **How many new templates to author**
   - What we know: CONTEXT.md says "20+ per archetype"; current file has ~76 location-specific + 18 universal = 94 total across ~10 archetypes
   - What's unclear: Which archetypes are underserved (Pale Cairn/Grey Meadowguard)
   - Recommendation: Prioritize locations that match Pale Cairn / Grey Meadowguard location types. Check their `locationType` property in `world-model.json` before authoring.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing config at vitest.config.ts) |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --testPathPattern encounterScoring\|encounterFilter\|phaseAgentDecision` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Score display bug fix: `c.entry.templateId` finds match | unit | `npm test -- --testPathPattern encounterScoring` | Partial — test file exists, new assertion needed |
| `TRAVEL_COST_WEIGHT` reduction produces non-zero movement decisions | unit | `npm test -- --testPathPattern encounterScoring` | Partial |
| Familiarity retirement: template excluded after N completions | unit | `npm test -- --testPathPattern encounterFilter\|encounterScoring` | Partial — familiarity tests exist |
| Outgrowth lock: high-cap agent doesn't see low-diff encounters | unit | `npm test -- --testPathPattern encounterFilter` | Partial |
| Forced travel: agent with idle_ticks >= threshold initiates movement | unit | `npm test -- --testPathPattern phaseAgentDecision` | ❌ Wave 0 |
| New universal encounter templates: load without schema errors | unit | `npm test -- --testPathPattern encounter-content` | Partial — content test exists |
| Score components appear in DECIDE log (desire != ?) | integration | `npm run cli -- --seed 42` (manual inspect) | manual-only |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern encounterScoring`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + CLI seed-42 100-tick run showing MOVE events + real scores

### Wave 0 Gaps
- [ ] `src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts` — unit test for forced travel trigger after N idle ticks
- [ ] Assertion in `encounterScoring.test.ts` verifying `scoreAndSelect` returns `entry.templateId` (not `templateId`) on candidates — confirms the bug fix coverage

*(Existing test infrastructure covers most scenarios. Two targeted additions needed.)*

---

## Sources

### Primary (HIGH confidence)
- Direct read of `src/engine/phaseAgentDecision.ts` — bug confirmed at line 387, `queue_movement` and idle patterns documented
- Direct read of `src/engine/encounterScoring.ts` — full scoring formula, FamiliarityRecord/ExplorationRecord types, all constants
- Direct read of `src/data/agent-behavior-constants.ts` — 56 constants, all tunable values and current defaults
- Direct read of `src/engine/idleBehavior.ts` — idle decision tree, resolveIdleBehavior signature
- Direct read of `src/data/encounter-content.ts` — template structure, ALL_LOCATION_SUBTYPES, difficulty constants, 94 templates
- Direct read of `src/engine/encounterTimeline.ts` + `encounterLogExporter.ts` — DECIDE event format, desireMultiplier field exists
- Direct read of `Docs/analysis/2026-03-30-encounter-log-analysis-seed42.md` — empirical evidence for all 5 problems
- Direct read of `.planning/phases/.../15-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- Grep of test file inventory — confirms test files exist for all major modules
- Count of templates and difficulty distribution — 94 templates, existing difficulty bands confirmed as 20/25/35/45

### Tertiary (LOW confidence)
- None — all findings are from direct code inspection

---

## Metadata

**Confidence breakdown:**
- Score display bug location: HIGH — directly confirmed by reading `ScoredCandidate` type and line 387
- Travel cost root cause: HIGH — scoring formula fully read and traced; `valuePerTick` denominator analysis is correct
- Retirement mechanism implementation path: HIGH — `FamiliarityRecord` already exists and is plumbed
- Forced travel integration point: HIGH — `resolveIdleBehavior` call site and movement init pattern directly confirmed
- Content expansion template schema: HIGH — existing template structure is clear and consistent
- Exact constant values (TRAVEL_COST_WEIGHT target, MAX_COMPLETIONS, OUTGROWTH_CAP): MEDIUM — Claude's discretion per CONTEXT.md; recommendations are reasoned but require validation

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (engine files are stable; no external dependencies)
