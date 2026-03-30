# Phase 18: Wire Mercenary Company Seeding and Encounters into the Runtime Pipeline - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect the already-authored mercenary company definition (`mercenary-company-definition.ts`) and encounter templates (`mercenary-encounter-content.ts`) to the live runtime pipeline: seeding 2 opposing companies at distant settlements, populating the encounter cache with mc.* templates, wiring rank-gated encounter filtering, reputation tracking through existing factionReputation, auto-triggered promotion encounters, and spawning 1 army per company. The content exists; this phase makes it playable.

</domain>

<decisions>
## Implementation Decisions

### Seeding scope
- Use the **generic `seedAllFactions` path** — no merc-specific seeder. The existing `factionSeeding.ts` already handles hall placement, domain caps from reachWeights, and naming.
- **2 mercenary companies** spawned per world (not 1). Two opposing companies enable observing inter-company interaction and the battle system.
- Companies placed at settlements with **maximum distance** between them. Natural territory/conflict zones emerge from geography.
- Reuse **`guild_hall` sublocation type** with merc-flavored naming (e.g. "The Free Company Barracks"). No new sublocation type.

### Encounter wiring
- mc.* templates added to the **encounter cache at world init** alongside other templates. Same pipeline as generic encounters — no special path.
- **mc.join scored through normal pipeline** — agents with Iron affinity naturally score it higher. No auto-offer or special-case triggering at hall locations.
- **Rank-gated encounters** filtered via the `encounterAccess` patterns already defined on rank tiers in `MERCENARY_COMPANY_DEFINITION`. Filter applied in the encounter scoring/filtering layer (not template prerequisites). mc.senior.* requires Sergeant-at-Arms+, mc.elite.* requires Captain+, mc.leadership.* requires War Chief.

### Faction ambitions
- **Minimum viable**: Wire one **static ambition per merc company** (`resource_acquisition`). No ambition evaluation loop, no evolving autonomy model. Full faction ambition system is a separate future phase.
- **1 army per company** spawned at their primary hall location using existing `armySpawning.ts`. Two armies in play enables the 2-company battle interaction.

### Reputation & rank
- Use **existing `factionReputation.ts` system** — no merc-specific reputation logic. `MC_REPUTATION_DECAY_PER_TICK` (0.004) already defined in the merc definition.
- **Promotion encounters auto-triggered**: when agent reputation crosses a rank threshold (0.3, 0.6, 0.85), `mc.promotion` is injected as high-priority encounter at next opportunity. Ensures rank progression isn't left to chance.
- **Expulsion deferred** — Phase 18 focuses on the positive flow: join -> quest -> promote. The definition has `expulsionConsequences` but wiring them can wait for a refinement phase.

### Claude's Discretion
- Exact distance calculation for "maximum distance" placement of 2 companies
- How mc.* templates integrate into encounterCache population (likely at the same point guild encounters are registered)
- Promotion encounter injection mechanism (priority boost vs explicit queue)
- Army naming for merc company armies
- How the 2-company seeding interacts with existing faction count limits (if any)
- Test strategy for verifying the full pipeline end-to-end

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mercenary company content (already authored)
- `src/data/mercenary-company-definition.ts` — FactionDefinition with 4 rank tiers, reachWeights, hall count constants, ambition weights, encounter template ID lists
- `src/data/mercenary-encounter-content.ts` — All mc.* encounter templates (4 quest, 3 social, 1 join, 1 promotion, 2 senior, 1 elite), encounter meta registry, difficulty constants

### Faction system
- `src/data/faction-definitions.ts` — FACTION_DEFINITIONS map (includes mercenary_company), FactionDefinition type
- `src/engine/factionSeeding.ts` — Generic faction seeder: seedAllFactions(), hall placement, domain cap derivation
- `src/types/faction.ts` — FactionDefinition, RankTier, FactionEncounterMeta, FactionSeedTrace types

### Encounter pipeline
- `src/engine/encounter.ts` — Core encounter resolution
- `src/engine/encounterCache.ts` — Encounter template population and lookup
- `src/engine/encounterAwareness.ts` — Location-based encounter discovery (hop system)
- `src/engine/factionReputation.ts` — Per-agent faction reputation tracking
- `src/engine/factionQuestGeneration.ts` — Faction quest encounter generation

### Army system
- `src/engine/armySpawning.ts` — Army entity creation, faction-to-army wiring
- `src/engine/battleResolution.ts` — Battle resolution between armies

### Design documents
- `Docs/plans/2026-03-29-conflict-and-destruction-design.md` — M2 design doc, mercenary company Phase 0 spec, faction ambition type definitions
- `Docs/plans/2026-03-27-faction-vertical-slice-design.md` — Faction vertical slice design (adventuring guild pattern)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `seedAllFactions()` in `factionSeeding.ts`: Already processes FACTION_DEFINITIONS including mercenary_company. Creates halls, domain caps, axiological profiles. May need extension for 2-company spawning with distance constraint.
- `factionReputation.ts`: Per-agent reputation tracking with factions. Handles decay, reward application. Ready for merc reputation.
- `armySpawning.ts`: Army entity creation with faction ownership edges. Used by existing factions.
- `encounterCache.ts`: Template population at world init. Needs mc.* templates registered.
- `MERCENARY_ENCOUNTER_META` Map: Already maps template IDs to faction metadata (minRank, reputationReward). Ready for filter integration.

### Established Patterns
- Guild seeding pattern: `seedGuilds()` creates guilds at qualifying settlements, places guild hall sublocations. `seedAllFactions()` generalizes this.
- Encounter meta registry: `FACTION_ENCOUNTER_META` in `faction-encounter-content.ts` provides the pattern. `MERCENARY_ENCOUNTER_META` follows it.
- Rank-gated access: `encounterAccess` arrays on rank tiers define prefix patterns (e.g. `['mc.quest.', 'mc.senior.']`). Filter layer matches template IDs against allowed prefixes.

### Integration Points
- `worldSeed.ts:851` — `seedAllFactions(graph, FACTION_DEFINITIONS, locationIds, seed + 41449)` already includes merc company. May need to be called twice or parameterized for 2-company + distance constraint.
- `encounterCache.ts` — Population function needs to include mc.* templates
- `phaseAgentDecision.ts` — Encounter scoring/filtering needs rank-gate check using MERCENARY_ENCOUNTER_META
- `factionReputation.ts` — Reputation rewards from mc.* encounter completions
- Promotion trigger — New logic needed: on reputation threshold cross, inject mc.promotion

</code_context>

<specifics>
## Specific Ideas

- 2 opposing merc companies is specifically to observe battle system interaction between them — the design doc's "narrative over mechanical perfection" applies
- The evolving autonomy model (hired tool -> warlord -> political force) is explicitly deferred. Phase 18 proves the pipeline with static ambitions only.

</specifics>

<deferred>
## Deferred Ideas

- Full faction ambition system (6 types, evaluation intervals, grievance tracking, evolving autonomy) — future phase, extracts from design doc
- Expulsion mechanics (reputation floor, consequence application) — refinement phase
- Mercenary-specific army naming/heraldry — cosmetic pass
- Cross-faction hiring (other factions pay mercs for army services via Gold->Iron crossover) — requires full ambition system
- Monster encounters (TB-051/M2.5) — separate brainstorm needed per design doc

</deferred>

---

*Phase: 18-wire-mercenary-company-seeding-and-encounters-into-the-runtime-pipeline*
*Context gathered: 2026-03-30*
