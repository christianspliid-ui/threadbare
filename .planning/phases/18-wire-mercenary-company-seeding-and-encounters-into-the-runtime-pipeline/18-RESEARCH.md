# Phase 18: Wire Mercenary Company Seeding and Encounters — Research

**Researched:** 2026-03-30
**Domain:** Faction runtime pipeline wiring (seeding, encounter generation, reputation, army spawning)
**Confidence:** HIGH — all findings verified against live source files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use generic `seedAllFactions` path — no merc-specific seeder
- 2 mercenary companies per world, placed at maximum-distance settlements
- Reuse `guild_hall` sublocation type with merc-flavored naming
- mc.* templates added to encounter cache at world init — same pipeline as generic encounters
- mc.join scored through normal pipeline — agents with Iron affinity naturally score it higher
- Rank-gated encounters filtered via `encounterAccess` patterns already on rank tiers; filter applied in encounter scoring/filtering layer (not template prerequisites)
- Wire one static ambition per merc company (`resource_acquisition`) at seeding time
- 1 army per company spawned at primary hall location using existing `armySpawning.ts`
- Use existing `factionReputation.ts` — no merc-specific reputation logic
- Promotion encounters auto-triggered: when agent reputation crosses rank threshold (0.3, 0.6, 0.85), `mc.promotion` injected as high-priority encounter at next opportunity
- Expulsion mechanics deferred

### Claude's Discretion
- Exact distance calculation for "maximum distance" placement of 2 companies
- How mc.* templates integrate into encounterCache population
- Promotion encounter injection mechanism (priority boost vs explicit queue)
- Army naming for merc company armies
- How 2-company seeding interacts with existing faction count limits (if any)
- Test strategy for verifying the full pipeline end-to-end

### Deferred Ideas (OUT OF SCOPE)
- Full faction ambition system (6 types, evaluation intervals, grievance tracking)
- Expulsion mechanics
- Mercenary-specific army naming/heraldry
- Cross-faction hiring (Gold->Iron crossover)
- Monster encounters (TB-051/M2.5)
</user_constraints>

---

## Summary

Phase 18 wires the already-authored mercenary company content into the live runtime. The content layer (definition, encounter templates, meta registry) is complete and proven by existing tests. The integration gaps are in four areas: (1) the seeder needs to spawn two distinct faction instances of the same definition at maximum-distance settlements, (2) `factionQuestGeneration.ts`'s `getAccessibleTemplates` only searches `FACTION_ENCOUNTER_TEMPLATES` (ag.* templates) — it will return no results for `mercenary_company` unless mc.* templates are included in the searchable array, (3) a static ambition of type `resource_acquisition` must be created at seeding time rather than waiting for the evaluation loop (which requires military force), and (4) army spawning at seeding time bypasses the normal eligibility check (which requires existing members) so needs a direct call.

A pre-existing property key mismatch also surfaces here: `factionSeeding.ts` writes `factionDefId` on the faction node but `factionAmbitions.ts` reads `factionDefinitionId`. This has prevented faction ambitions from ever firing for seeded factions. Phase 18 must fix this mismatch (or the static-ambition-at-seed approach sidesteps it).

**Primary recommendation:** Extend `seedFactionFromDefinition` to accept an optional `instanceIndex` + distance constraint for 2-instance spawning; fix the `factionDefId`/`factionDefinitionId` key mismatch; add mc.* templates to the searchable pool in `getAccessibleTemplates`; seed the static ambition + army directly in `worldSeed.ts` after the faction nodes exist.

---

## Standard Stack

### Core (already in project — no new dependencies)
| Module | Version | Purpose | Notes |
|--------|---------|---------|-------|
| `factionSeeding.ts` | — | Creates faction actor nodes + guild halls | Needs 2-instance + distance constraint extension |
| `factionQuestGeneration.ts` | — | Produces faction encounter candidates per agent | Needs mc.* template inclusion fix |
| `factionReputation.ts` | — | Reputation gain/decay, rank recalc | Ready — mc encounters already in `FACTION_ENCOUNTER_META` |
| `armySpawning.ts` | — | Army actor node creation | Ready — call directly at seed time |
| `factionAmbitions.ts` | — | Evaluates + creates faction ambition nodes | Property key bug must be fixed |
| `encounterCache.ts` | — | Pre-computed location→template entries | No changes needed — mc.* handled via sublocation pattern |
| `worldSeed.ts` | — | World initialization, calls seedAllFactions at line 851 | Integration point for 2-company spawn |

**No new npm packages required.**

---

## Architecture Patterns

### Pattern 1: Two-Instance Same-Definition Seeding with Distance Constraint

`seedAllFactions` currently calls `seedFactionFromDefinition` once per definition entry in the map. For mercenary companies, it must be called twice with different seeds and a distance constraint ensuring the two chosen primary halls are as far apart as possible.

**Approach:** Add a `seedMercenaryCompanies` function (or extend `seedAllFactions` to handle `instanceCount > 1` on the definition) that:
1. Collects all qualifying settlement locations
2. Selects location pair with maximum hex distance (use existing `distanceMatrix` or a simpler O(n²) pass at seed time — only runs once)
3. Calls `seedFactionFromDefinition` twice, providing a fixed `primaryLocationId` override per call

**Distance calculation:** The simplest approach for a one-time seed operation is O(n²) brute force over qualifying locations using axial hex distance. Qualifying locations for mercenary_company are `['town', 'city', 'capital']`. There are typically 10-30 such locations on a medium map. O(n²) = at most ~900 comparisons — acceptable for a one-time seed.

Axial hex distance formula (already used in hexGrid.ts):
```typescript
// Source: src/engine/hexGrid.ts — standard cube distance
Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds))
// where s = -q - r
```

**worldSeed.ts change:** Replace the single `seedAllFactions` call with individual calls that handle the 2-company distance constraint, then seed ambition + army for each result.

### Pattern 2: mc.* Templates in factionQuestGeneration

`getAccessibleTemplates` in `factionQuestGeneration.ts` filters `FACTION_ENCOUNTER_TEMPLATES` — a static array that only contains ag.* templates. The fix is to change the function to use a combined template source that includes mc.* templates.

**Current (broken for mc):**
```typescript
// src/engine/factionQuestGeneration.ts line 135
return FACTION_ENCOUNTER_TEMPLATES.filter(template => {
  const meta = FACTION_ENCOUNTER_META.get(template.id);
  if (!meta || meta.factionDefId !== definition.id) return false;
  return accessPrefixes.some(prefix => template.id.startsWith(prefix));
});
```

**Fix — add `getAllFactionTemplates()` helper in faction-encounter-content.ts:**
```typescript
// Source: derived from faction-encounter-content.ts + mercenary-encounter-content.ts
export function getAllFactionTemplates(): EncounterTemplate[] {
  return [
    ...FACTION_ENCOUNTER_TEMPLATES,
    ...MERCENARY_ENCOUNTER_TEMPLATES,
    ...MERCENARY_SOCIAL_TEMPLATES,
    MC_JOIN_TEMPLATE,
    MC_PROMOTION_TEMPLATE,
  ];
}
```
Then `getAccessibleTemplates` calls `getAllFactionTemplates()` instead of referencing `FACTION_ENCOUNTER_TEMPLATES` directly.

Alternatively, the simplest fix: use `FACTION_ENCOUNTER_META` as the source of truth (it already has all mc.* entries). Look up each template via `getFactionEncounterById` (which already includes mc.* via the delegation chain):
```typescript
return [...FACTION_ENCOUNTER_META.entries()]
  .filter(([id, meta]) => meta.factionDefId === definition.id
    && accessPrefixes.some(prefix => id.startsWith(prefix)))
  .map(([id]) => getFactionEncounterById(id))
  .filter((t): t is EncounterTemplate => t !== undefined);
```
This approach uses the already-correct `FACTION_ENCOUNTER_META` (which already spreads `MERCENARY_ENCOUNTER_META` at line 58 of `faction-encounter-content.ts`) and `getFactionEncounterById` (which already delegates to `getMercenaryEncounterById`). No new export needed.

### Pattern 3: Static Ambition at Seeding Time

`phaseFactionAmbitions` creates ambitions during tick evaluation but requires `factionDefinitionId` on the node (currently stored as `factionDefId` — a bug). For Phase 18, seeding the static `resource_acquisition` ambition directly in `worldSeed.ts` after the faction node exists:

```typescript
// Directly after seedFactionFromDefinition returns:
const ambitionId = `amb_${factionId}_seed`;
graph.addNode({
  id: ambitionId,
  type: 'ambition',
  name: `${factionName} — resource acquisition`,
  properties: {
    ambitionType: 'resource_acquisition',
    priority: 0.5,
    targetNodeId: null,
    grievanceDecay: 0,
    createdTick: 0,
  },
});
graph.addEdge({
  id: `e_pursues_${factionId}_${ambitionId}`,
  source: factionId,
  target: ambitionId,
  type: 'pursues',
  properties: { priority: 0.5, status: 'active', milestones: [] },
});
```

`resource_acquisition` maps to `requiresMilitaryForce('resource_acquisition')` — need to verify this returns `true`:

```typescript
// src/types/faction.ts
export function requiresMilitaryForce(type: FactionAmbitionType): boolean {
  return type === 'territorial_expansion' || type === 'revenge';
}
```

**Critical: `resource_acquisition` does NOT require military force.** Army spawning won't be triggered by `phaseFactionAmbitions` for `resource_acquisition` ambitions. The army must be spawned **directly at seeding time**, separately from the ambition system. Use `spawnArmy` directly, but it requires a commander (agent with sufficient Iron capability) — which won't exist at world init for a freshly seeded faction.

**Resolution: Spawn army without commander requirement.** Create a simplified `spawnArmyForNewFaction` that places the army at the primary hall location without a commander edge (commanderId = null / army self-commands initially). OR create a minimal "faction soldier" agent as commander. Look at how existing faction tests handle this in `armySpawning.test.ts` — tests create a member agent manually.

**Recommended approach:** At seeding time, create a placeholder commander agent node belonging to the merc company. This is simpler and matches narrative intent (merc companies have leadership from day one). The commander is an NPC agent, not player-controlled.

### Pattern 4: Property Key Fix (factionDefId vs factionDefinitionId)

`factionSeeding.ts` (line 203) writes: `factionDefId: definition.id`
`factionAmbitions.ts` (line 147) reads: `faction.properties.factionDefinitionId`

This mismatch means `phaseFactionAmbitions` skips all seeded factions. Fix: standardize on `factionDefId` (the field already used by member_of edges, sublocation properties, and factionReputation) by updating `factionAmbitions.ts` to read `factionDefId`:

```typescript
// factionAmbitions.ts line 147
const definitionId = faction.properties.factionDefId as string | undefined
  ?? faction.properties.factionDefinitionId as string | undefined; // backward compat
```

Update the factionAmbitions tests to use `factionDefId` (tests currently use `factionDefinitionId` — this is what caused the mismatch in the first place).

### Pattern 5: Promotion Encounter Injection

The CONTEXT.md decision: when reputation crosses a rank threshold, inject `mc.promotion` as high-priority at next opportunity.

The cleanest mechanism: in `processFactionEncounterReputation` (called from orchestrator after each encounter step), after `applyFactionReputationGain` returns `{ rankChanged: true }`, set a flag on the agent's `member_of` edge: `promotionPending: true`. Then in `generateFactionLifecycleCandidates`, check for this flag and inject `MC_PROMOTION_TEMPLATE` with elevated `questPriority` (e.g. 10.0) regardless of the `PROMOTION_PARTIAL_SUCCESS_MARGIN` proximity check.

Current `generateFactionLifecycleCandidates` already generates promotion candidates when agent is within `PROMOTION_PARTIAL_SUCCESS_MARGIN` (0.10) of next rank. The auto-trigger just needs to bypass this gate and boost priority.

**Alternative (simpler):** Don't use a flag. Instead, use a broader window for mc.* factions — when reputation crosses a threshold exactly (the rank changed), the next call to `generateFactionLifecycleCandidates` will already see the agent at exactly the new rank minimum, with gap = 0.0 to the threshold they just passed. The `gap <= 0.10` check will fire naturally. The only issue is the priority isn't boosted. Setting `questPriority` to a higher value for `MC_PROMOTION_TEMPLATE` (e.g. 9.0 instead of 7.0) and relying on the standard proximity window may be sufficient.

**Recommendation:** Use the flag approach for explicitness. Add `promotionPending?: boolean` to `MemberOfEdgeProperties` (or as a separate transient field), set it in `processFactionEncounterReputation` on rank change, clear it after the promotion encounter is offered.

### Anti-Patterns to Avoid

- **Don't modify `FACTION_ENCOUNTER_TEMPLATES` array directly** — it's the ag.* array and should stay ag.-only. Add a combined lookup function instead.
- **Don't use `isEligibleForArmySpawn` at seed time** — it requires existing members with Iron capability which don't exist yet. Bypass it with a direct `spawnArmy` call after creating a placeholder commander.
- **Don't seed 2 companies by adding `mercenary_company` twice to FACTION_DEFINITIONS** — the map key must be unique. Use a loop or explicit double-call in worldSeed.ts.
- **Don't rely on tick-loop ambition evaluation for the seed-time army** — `resource_acquisition` doesn't require military force, so the army will never spawn via the normal evaluation path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Hex distance between settlements | Custom grid math | Axial cube distance (already in `hexGrid.ts`; or inline the formula — it's 3 lines) |
| Reputation tracking for mc members | Custom mc reputation table | `factionReputation.ts` — already handles any `factionDefId` |
| Template lookup by ID | Custom mc lookup | `getAnyEncounterById` already delegates to `getMercenaryEncounterById` |
| Quest candidate generation | New mc-specific generator | Fix `getAccessibleTemplates` to include mc.* templates — existing generator handles the rest |
| Rank computation | Custom mc rank logic | `computeRankFromReputation(reputation, MERCENARY_COMPANY_DEFINITION)` |

---

## Common Pitfalls

### Pitfall 1: factionDefId / factionDefinitionId Property Key Mismatch
**What goes wrong:** `phaseFactionAmbitions` skips the seeded merc company nodes because it reads `factionDefinitionId` but the seeder wrote `factionDefId`. The static seed-time ambition avoids this for army creation, but the ongoing evaluation loop (used for ambition updates) will silently skip the faction.
**Why it happens:** The seeder was written with `factionDefId` (matching member_of edges), but factionAmbitions was written independently using a different convention.
**How to avoid:** Fix `factionAmbitions.ts` to read `factionDefId` (canonical key). Update its tests to use `factionDefId`. Run the factionAmbitions test suite after the fix.
**Warning signs:** `phaseFactionAmbitions` test passes but live game never shows faction creating ambitions.

### Pitfall 2: getAccessibleTemplates Returns Empty Array for mc Members
**What goes wrong:** Agents who join a mercenary company never receive mc.quest.* candidates — `generateFactionQuestCandidates` searches `FACTION_ENCOUNTER_TEMPLATES` which only has ag.* templates.
**Why it happens:** The filter function references the concrete ag.* template array, not the unified FACTION_ENCOUNTER_META registry.
**How to avoid:** Change `getAccessibleTemplates` to use `FACTION_ENCOUNTER_META` + `getFactionEncounterById` as the source (both already include mc.* entries).
**Warning signs:** Agent joins mc.join successfully, has `member_of` edge, but zero mc.quest.* candidates in phaseAgentDecision traces.

### Pitfall 3: Army Spawning Requires Members — But Seeding Has None Yet
**What goes wrong:** `isEligibleForArmySpawn` checks for `member_of` members with Iron capability tier >= 4. At seed time, no agents are members yet. Direct `spawnArmy` call will fail at `selectCommander` (returns null).
**Why it happens:** The army spawning system was designed for mid-game runtime use, not world initialization.
**How to avoid:** Create a placeholder commander agent at seeding time, OR create an overridden `spawnArmyAtSeed` that accepts a location and skips the commander requirement (army starts without a commander edge, or with a stub NPC).
**Warning signs:** `spawnArmy` returns null silently at world init; no army nodes appear in the graph.

### Pitfall 4: Two Companies Get Identical Faction Node IDs
**What goes wrong:** `seedFactionFromDefinition` generates the faction ID as `faction_def_${definition.id}`. Calling it twice for `mercenary_company` creates `faction_def_mercenary_company` twice — second call fails or overwrites the first.
**Why it happens:** The ID is derived purely from `definition.id`, not from an instance index.
**How to avoid:** Pass an instance suffix: `faction_def_${definition.id}_0` and `faction_def_${definition.id}_1`. This requires either a parameter to `seedFactionFromDefinition` (e.g. `instanceSuffix?: string`) or a wrapper that patches the result.
**Warning signs:** Second `seedFactionFromDefinition` throws on `graph.addNode` duplicate ID, or the first faction node is silently replaced.

### Pitfall 5: generateFactionLifecycleCandidates Checks for `locationSubtype === 'guild-hall'`
**What goes wrong:** The lifecycle candidate generator (line 168) checks `node.properties?.locationSubtype === 'guild-hall'`. But `factionSeeding.ts` sets `sublocationTypeId: 'sublocation-type.faction-hall'` — not `locationSubtype`.
**Why it happens:** The lifecycle generator was written for guild halls which may use a different property key. The faction seeder uses the canonical sublocation property schema.
**How to avoid:** Verify what property key the lifecycle generator uses vs. what `factionSeeding.ts` writes. If the condition `locationSubtype === 'guild-hall'` never fires for faction-seeded halls, join/promotion encounters won't be offered. Fix the check to include `sublocationTypeId === 'sublocation-type.faction-hall'`.
**Warning signs:** Agents at merc hall locations are never offered `mc.join` even when non-members.

### Pitfall 6: distance calculation at seed time
**What goes wrong:** If the world model uses `q, r` axial hex coordinates but the location nodes store `hexQ, hexR` or `x, y` pixel positions, the distance formula must use the correct fields.
**How to avoid:** Check the location node properties from `worldSeed.ts` for the coordinate field names. Use the same coordinate lookup as `hexGrid.ts`.

---

## Code Examples

### Two-Company Seeding with Distance Constraint
```typescript
// In worldSeed.ts, replacing single seedAllFactions call for mercenary:

// Collect qualifying settlement locations (town/city/capital)
const mercQualifying = locationIds.filter(id => {
  const node = graph.getNode(id);
  const sub = node?.properties.locationSubtype as string | undefined;
  return sub === 'town' || sub === 'city' || sub === 'capital';
});

// Find max-distance pair (O(n²) acceptable for seed-time, one-time cost)
function findMaxDistancePair(graph: WorldGraph, ids: string[]): [string, string] {
  let bestA = ids[0], bestB = ids[1], bestDist = 0;
  for (let i = 0; i < ids.length; i++) {
    const a = graph.getNode(ids[i])?.properties;
    for (let j = i + 1; j < ids.length; j++) {
      const b = graph.getNode(ids[j])?.properties;
      const dq = (a?.hexQ ?? 0) - (b?.hexQ ?? 0);
      const dr = (a?.hexR ?? 0) - (b?.hexR ?? 0);
      const ds = -dq - dr;
      const d = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
      if (d > bestDist) { bestDist = d; bestA = ids[i]; bestB = ids[j]; }
    }
  }
  return [bestA, bestB];
}

const [locA, locB] = findMaxDistancePair(graph, mercQualifying);
// Seed company 0 anchored to locA, company 1 anchored to locB
```

### mc.* Templates in getAccessibleTemplates (recommended fix)
```typescript
// Source: src/engine/factionQuestGeneration.ts
// Replace lines 135-141

return [...FACTION_ENCOUNTER_META.entries()]
  .filter(([id, meta]) =>
    meta.factionDefId === definition.id &&
    accessPrefixes.some(prefix => id.startsWith(prefix)))
  .map(([id]) => getFactionEncounterById(id))
  .filter((t): t is EncounterTemplate => t !== undefined);
```

### Static Ambition + Direct Army Seed
```typescript
// After seedFactionFromDefinition for each merc company:
const ambitionId = `amb_${factionId}_seed`;
graph.addNode({
  id: ambitionId, type: 'ambition',
  name: `${factionName} — resource acquisition`,
  properties: {
    ambitionType: 'resource_acquisition',
    priority: 0.5, targetNodeId: null,
    grievanceDecay: 0, createdTick: 0,
  },
});
graph.addEdge({
  id: `e_pursues_${factionId}_seed`,
  source: factionId, target: ambitionId, type: 'pursues',
  properties: { priority: 0.5, status: 'active', milestones: [] },
});
```

---

## State of the Art

| Old Status | Current Status | Impact |
|------------|---------------|--------|
| mc.* content authored but not wired | Content complete (definition + templates + meta) | Phase 18 is purely pipeline wiring — no new content |
| `FACTION_ENCOUNTER_META` already spreads `MERCENARY_ENCOUNTER_META` | Meta registry unified | `processFactionEncounterReputation` will handle mc.* encounters automatically once agents join |
| `getAnyEncounterById` delegates to `getMercenaryEncounterById` | Template lookup unified | Encounter resolution already handles mc.* templates |
| `factionSeeding.ts` uses `factionDefId`; `factionAmbitions.ts` uses `factionDefinitionId` | **Bug** — ambitions never fire for seeded factions | Must fix key mismatch in Phase 18 |
| `getAccessibleTemplates` only searches `FACTION_ENCOUNTER_TEMPLATES` (ag.* only) | **Bug** — mc members never get mc.quest.* candidates | Must add mc.* to searchable pool |

---

## Open Questions

1. **Coordinate field names on location nodes**
   - What we know: `hexGrid.ts` uses `q, r` axial coordinates. Location nodes are created in `worldSeed.ts`.
   - What's unclear: Whether they're stored as `hexQ`/`hexR` or `q`/`r` or `col`/`row` on the node `properties` object.
   - Recommendation: Grep for `hexQ` or `q:` in `worldSeed.ts` before writing the distance calculation. High-confidence fix in 2 minutes.

2. **`guild_hall` sublocation type vs. faction seeder's `sublocationTypeId`**
   - What we know: `factionSeeding.ts` writes `sublocationTypeId: 'sublocation-type.faction-hall'`. `generateFactionLifecycleCandidates` checks `properties?.locationSubtype === 'guild-hall'`.
   - What's unclear: Whether this check ever succeeds for faction-seeded halls.
   - Recommendation: Inspect a seeded hall node in a test or CLI run. Likely needs a fix to check `sublocationTypeId` instead.

3. **instanceSuffix parameter approach vs. wrapper**
   - What we know: `seedFactionFromDefinition` hardcodes `faction_def_${definition.id}` as the node ID.
   - Recommendation: Add optional `instanceSuffix?: string` parameter (defaults to `''`). Minimal change, keeps backward compatibility with single-instance factions.

4. **Army at seed time — placeholder commander vs. commanderless army**
   - What we know: `spawnArmy` requires a `commanderId`. `isEligibleForArmySpawn` requires members with Iron tier >= 4.
   - What's unclear: Whether a commanderless army is valid in the battle resolution system.
   - Recommendation: Check `battleResolution.ts` for whether `commanded_by` edge is required for battle resolution. If not strictly required, spawn without commander. If required, seed one NPC commander per company.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Area | Behavior | Test Type | File |
|------|----------|-----------|------|
| Two-company seeding | `seedAllFactions` (or wrapper) creates 2 distinct merc company nodes | unit | `src/engine/__tests__/factionSeeding.test.ts` (extend) |
| Distance constraint | Two company halls are placed at maximum-distance locations | unit | `src/engine/__tests__/factionSeeding.test.ts` (extend) |
| mc.* quest candidates | Agent with mc member_of edge gets mc.quest.* candidates from `generateFactionQuestCandidates` | unit | `src/engine/__tests__/factionQuestGeneration.test.ts` (new) |
| mc.join lifecycle | Non-member agent at merc hall location gets mc.join candidate | unit | extend existing `generateFactionLifecycleCandidates` tests |
| Rank-gated filtering | Agent at sellsword rank gets mc.quest.* but NOT mc.senior.* | unit | `src/engine/__tests__/factionQuestGeneration.test.ts` |
| Static ambition seeding | Each merc company has `resource_acquisition` ambition at tick 0 | unit | `src/engine/__tests__/factionSeeding.test.ts` (extend) |
| Army at seed | Each merc company has 1 army node at primary hall location | unit | `src/engine/__tests__/factionSeeding.test.ts` (extend) |
| factionDefId key fix | `phaseFactionAmbitions` processes seeded faction nodes (factionDefId key) | unit | `src/engine/__tests__/factionAmbitions.test.ts` (update) |
| Reputation via mc encounter | Completing mc.quest.patrol step increments reputation on member_of edge | unit | `src/engine/__tests__/factionReputation.test.ts` (extend) |
| Promotion trigger | Agent whose reputation crosses 0.3 gets mc.promotion candidate at elevated priority | unit | new test in factionQuestGeneration tests |

### Wave 0 Gaps
- [ ] `src/engine/__tests__/factionQuestGeneration.test.ts` — new file for mc.* quest candidate generation
- No framework gaps — vitest already installed and configured

---

## Sources

### Primary (HIGH confidence)
- `src/data/mercenary-company-definition.ts` — definition, rank tiers, constants (read directly)
- `src/data/mercenary-encounter-content.ts` — all mc.* templates and meta registry (read directly)
- `src/engine/factionSeeding.ts` — full seeder logic, property keys written (read directly)
- `src/engine/factionQuestGeneration.ts` — `getAccessibleTemplates` gap confirmed (read directly)
- `src/engine/factionAmbitions.ts` — `factionDefinitionId` key read vs. seeder's `factionDefId` write (read directly)
- `src/engine/armySpawning.ts` — eligibility requirements, commander selection (read directly)
- `src/data/faction-encounter-content.ts` — FACTION_ENCOUNTER_META already includes mc.* (read directly)
- `src/engine/factionReputation.ts` — `processFactionEncounterReputation` hooks on `FACTION_ENCOUNTER_META` (read directly)
- `src/engine/encounterCache.ts` — `buildFullCache` does not need changes (read directly)
- `src/engine/phaseAgentDecision.ts` — already calls `generateFactionQuestCandidates` + `generateFactionLifecycleCandidates` (read directly)
- `src/engine/worldSeed.ts` line 851 — existing `seedAllFactions` call (read directly)

### Secondary (MEDIUM confidence)
- `src/engine/__tests__/mercenaryEncounterLookup.test.ts` — confirms getAnyEncounterById includes mc.* (read directly, tests pass)
- `src/engine/__tests__/factionSeeding.test.ts` — confirms `factionDefId` is the written property (read directly)
- `src/engine/__tests__/factionAmbitions.test.ts` — confirms tests use `factionDefinitionId` as the key (the source of the mismatch)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all modules read and verified
- Architecture: HIGH — gaps identified from source code, not inference
- Pitfalls: HIGH — confirmed from live source (not theoretical)
- Distance calculation coordinate field names: MEDIUM — not verified in worldSeed.ts location node creation

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase, no external dependencies)
