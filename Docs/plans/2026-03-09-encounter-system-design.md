# Encounter System Design — Replacing Ordeals with Motivation-Driven Encounters

**Date:** 2026-03-09
**Status:** Design
**Scope:** Rename ordeals → encounters, broaden template schema, wire real selection pipeline, create templates for all location subtypes, update LocationView UI

---

## Problem Statement

The ordeal system exists in full (types, engine, content, tests) but has never triggered in live play due to a location type mismatch: `worldSeed.ts` stores `locationType: 'location'` on all locations while ordeal templates match on fantasy names (`'dungeon'`, `'forge'`, `'grove'`). Additionally, `phaseAgentActions` in the orchestrator is a stub that uses 15% random chance instead of the full Maslow action selection pipeline (`runSelectionPipeline` in `agentSelection.ts`), which exists but is never called from the tick loop.

The user wants encounters to be the primary agent activity visible in the simulation — personality-driven, sphere-flavored, threat-matched, and player-nudgeable.

---

## Decision 1: Rename Ordeals → Encounters

**Choice:** Rename across the codebase. "Ordeal" implies hardship; "encounter" is broader and covers non-dangerous activities.

**What changes:**
- Type files: `OrdealDefinition` → `EncounterDefinition` (the multi-step template), `OrdealProgress` → `EncounterProgress`
- Engine: `ordeal.ts` → `encounter.ts`, all function names updated
- Data: `ordeal-content.ts` → `encounter-content.ts`
- State: `gameState.ordealProgress` → `gameState.encounterProgress`
- Orchestrator: `phaseOrdealProgression` → `phaseEncounterProgression`

**Trade-off:** Broad rename touches many files but prevents permanent terminology confusion. The existing `EncounterDefinition` (inner step) will become `EncounterStep` to disambiguate from the outer template.

---

## Decision 2: Broaden Template Schema with Encounter Types

**Choice:** Add an `encounterType` enum and `threatRating` to templates. Keep the existing linear encounter-step structure (2-4 steps with sigmoid→d100 resolution).

**New types:**

```typescript
export type EncounterType =
  | 'explore'    // go through ordeal for knowledge/boon (original ordeals)
  | 'acquire'    // obtain item, ally, spell, service
  | 'create'     // craft item, spell, artifact
  | 'hire'       // recruit ally, army, faction
  | 'duel'       // combat another agent at location
  | 'steal'      // take from agent or location
  | 'trade'      // establish trade route, pact, deal
  | 'assist'     // save, help, team up with another agent
  | 'build'      // construct shrine, mine, farm, fortification
  | 'lead';      // organize army, faction, expedition

export type ThreatRating = 'trivial' | 'easy' | 'moderate' | 'hard' | 'deadly';
```

**On the template:**
- `encounterType: EncounterType` — drives selection priority by agent personality
- `threatRating: ThreatRating` — compared against agent capability for filtering
- `locationTypes` — remapped to actual `LocationSubtype` values

**Why not a flat action system:** The multi-step encounter structure (2-4 steps with escalating difficulty and narrative beats) is the distinguishing feature. A duel isn't "roll once" — it's "sizing up the opponent → initial exchange → decisive moment." This creates narrative texture that flat actions lack.

---

## Decision 3: Replace Stub phaseAgentActions with Real Selection Pipeline

**Choice:** `phaseAgentActions` will generate `ActionCandidate[]` from available encounter templates, then call `runSelectionPipeline()` to select which encounter each agent attempts.

**How it works:**

1. For each actor, get their location's `locationSubtype`
2. Query encounter templates matching that subtype
3. Filter by threat rating vs agent capability (±1 tier tolerance)
4. Build `ActionCandidate` for each, with:
   - `templateId` = encounter template ID
   - `domain` = encounter's primary reach
   - `motivations` = mapped from encounter type (see §4)
   - `targetId` = location ID (or another agent ID for duel/steal/trade/assist)
5. Run through `runSelectionPipeline()` (goal alignment → divine overlay → disposition → personality → top-N → probabilistic select)
6. If selected candidate is an encounter, initiate it

**What stays:** The existing `scoreByGoalAlignment`, divine influence overlay, disposition modifier, personality weights, top-N selection, and probabilistic select all work as-is.

**What's new:** A `generateEncounterCandidates()` function that builds the ActionCandidate array from location-available encounter templates.

---

## Decision 4: Encounter Type → Value Pair Mapping

**Choice:** Each encounter type maps to 1-2 axiological value pairs, connecting agent personality to encounter preference.

| Encounter Type | Primary Motivation | Secondary | Why |
|---|---|---|---|
| explore | courage_prudence | ambition_contentment | Bold agents explore; cautious ones don't |
| acquire | greed_generosity | ambition_contentment | Greedy/ambitious agents seek items |
| create | tradition_innovation | devotion_independence | Innovators craft; traditionalists follow recipes |
| hire | dominance_humility | loyalty_treachery | Leaders recruit; humble agents don't |
| duel | wrath_patience | courage_prudence | Wrathful agents seek combat |
| steal | cunning_honesty | greed_generosity | Cunning + greedy → thief |
| trade | greed_generosity | cunning_honesty | Trade needs both avarice and cunning |
| assist | cruelty_compassion | loyalty_treachery | Compassionate/loyal agents help |
| build | tradition_innovation | devotion_independence | Devoted builders create structures |
| lead | dominance_humility | ambition_contentment | Ambitious dominators lead |

The selection pipeline's `scoreByGoalAlignment` already sums profile values for motivation pairs, so agents with high `courage_prudence` (positive = courageous) will naturally prefer `explore` encounters.

---

## Decision 5: Threat Rating Filtering

**Choice:** Compare agent's average capability in the encounter's primary + secondary reach against difficulty tiers. Agents prefer encounters within ±1 tier of their power level, with personality modifying tolerance.

```typescript
const THREAT_CAPABILITY_BANDS: Record<ThreatRating, [number, number]> = {
  trivial:  [0, 20],
  easy:     [15, 40],
  moderate: [30, 60],
  hard:     [50, 80],
  deadly:   [70, 100],
};
```

**Filtering rules:**
- Default: agent attempts encounters where their capability falls within the band ± one tier
- Courageous agents (courage_prudence > 0.3): expand upward by one tier
- Prudent agents (courage_prudence < -0.3): restrict downward by one tier
- Player divine nudge (inspire intervention): bypasses threat filtering entirely

---

## Decision 6: Location Subtype → Encounter Template Coverage

**Choice:** Every `LocationSubtype` must have at least 3 encounter templates available. Templates can span multiple subtypes.

**Coverage matrix (minimum):**

| Subtype | Expected Types | Reach Emphasis |
|---|---|---|
| hamlet | trade, assist, hire, build | heart, gold, stone |
| town | trade, acquire, hire, create, steal | gold, shadow, heart |
| city | trade, acquire, steal, lead, create, duel | gold, shadow, heart, iron |
| capital | lead, trade, duel, hire, acquire | heart, gold, iron |
| camp | explore, assist, build, hire | iron, stone, heart |
| farmland | build, trade, assist, create | stone, gold, flesh |
| castle | duel, lead, hire, acquire | iron, heart, star |
| fort | duel, lead, build, hire | iron, stone, heart |
| tower | explore, create, acquire | veil, eye, star |
| shrine | explore, assist, create | spirit, veil, heart |
| temple | explore, assist, lead, create | spirit, heart, veil |
| mining | build, acquire, trade, create | stone, gold, iron |
| ruins | explore, acquire, steal, duel | shadow, iron, eye |
| ruined_tower | explore, acquire, steal | shadow, veil, eye |
| ruined_city | explore, steal, acquire, duel | shadow, iron, gold |
| ruined_village | explore, assist, build | shadow, heart, stone |
| battleground | duel, lead, explore, assist | iron, star, heart |
| oasis | trade, assist, hire, explore | gold, heart, flesh |
| unexplored_poi | explore, acquire, steal | eye, shadow, veil |
| wilderness | explore, build, assist | star, stone, iron |

**Target:** ~60-80 encounter templates total (vs the current 10 ordeal templates), ensuring every subtype has 3-6 options across different encounter types.

---

## Decision 7: LocationView UI — Available Encounters + Active Logs

**Choice:** Replace the hardcoded "No active Ordeals" with two sections:

### Available Encounters
- List of encounter templates available at this location
- Each shows: name, type icon/badge, threat rating, primary reach
- Dimmed encounters that no present agent could attempt (all agents too weak/strong)
- Click to see full description (future: player can nudge agent toward it)

### Active Encounter Logs
- Positioned to the right of the establishing shot
- Each active encounter gets a log window: "{agentName} faces {encounterName}"
- Stacked vertically if multiple agents are in encounters at the location
- Shows encounter step progress and narrative outcomes as they resolve
- Completed/abandoned encounters fade and collapse after ~3 ticks

**Data flow:** LocationView receives `gameState.encounterProgress` filtered to current location, plus available encounter templates from `generateEncountersForLocation()`.

---

## Decision 8: Player Nudge via Existing Systems

**Choice:** Use the existing `inspire` intervention + agenda system to let players nudge agents toward specific encounters. No new system needed.

**How it works:**
1. Player inspires an agent (existing action card)
2. Agenda picker shows encounter-flavored agendas (e.g., "Seek the Deep Descent", "Trade at the Market")
3. Inspire intervention creates a `DivineInfluenceEntry` that boosts the encounter's motivation pairs
4. `buildValueOverlay` in the selection pipeline amplifies the agent's preference for that encounter type
5. Agent naturally selects the inspired encounter on next tick

**Future:** Direct "command" intervention that forces an agent into a specific encounter (higher cost, higher risk of detection).

---

## Files Changed

### New Files
- `src/types/encounter.ts` — EncounterType, ThreatRating, broadened template types
- `src/data/encounter-content.ts` — 60-80 encounter templates across all subtypes
- `src/engine/encounter.ts` — renamed + broadened ordeal engine
- `src/engine/encounterCandidates.ts` — generates ActionCandidate[] from location encounter templates

### Modified Files
- `src/types/gameState.ts` — `ordealProgress` → `encounterProgress`
- `src/engine/orchestrator.ts` — replace stub `phaseAgentActions` with real pipeline, rename `phaseOrdealProgression`
- `src/engine/agentSelection.ts` — no changes needed (already generic)
- `src/components/Game/LocationView.tsx` — available encounters list + active encounter logs
- `src/components/Game/GameView.tsx` — pass encounter data to LocationView
- `src/engine/worldSeed.ts` — fix: use `locationSubtype` for encounter matching
- `src/data/ordeal-content.ts` → rename + remap location types
- `src/types/ordeal.ts` → rename to encounter types
- `src/engine/ordeal.ts` → rename to encounter engine
- Various test files — update imports and names

### Deleted Files
- `src/types/ordeal.ts` (replaced by encounter.ts)
- `src/engine/ordeal.ts` (replaced by encounter.ts)
- `src/data/ordeal-content.ts` (replaced by encounter-content.ts)

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Broad rename breaks many imports | Systematic find-and-replace, run full test suite after rename |
| 60-80 templates is a lot of content | Templates share structure; use encounter type patterns to batch-create |
| Selection pipeline may produce degenerate results (always same choice) | Top-N + probabilistic selection + personality variance ensures diversity |
| Threat filtering too aggressive (no valid encounters) | Always include at least one "trivial" encounter per location as fallback |
| LocationView UI becomes cluttered with many encounters | Cap visible list at 5, show "N more available" expander |
