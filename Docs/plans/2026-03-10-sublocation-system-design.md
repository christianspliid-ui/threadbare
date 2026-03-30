# Sublocation System Design — Agent-Centric Encounter Organization

**Date:** 2026-03-10
**Goal:** Realize the original sublocation vision: encounters organized under sublocations, agents selecting sublocations based on axiological motivations, encounters chaining as ordeals — all presented through an agent-centric UI that shows *where agents are and what they're doing*.

---

## 1. Gap Analysis — Where the Vision Slipped

Three specific drift points between design and implementation:

1. **Sublocations became implicit step names, not graph entities.** The `EncounterStep.sublocationId` optional field exists (encounter.ts line 96) but is never populated. Sublocations in the Obsidian vault (7 types) have no runtime representation.

2. **Motivation drives encounter-type selection, not sublocation selection.** `encounterCandidates.ts` maps `locationSubtype → encounter templates` directly. The axiological scoring in `agentSelection.ts` scores *encounter candidates*, not *sublocation affinity*. Agents never "choose a place" — they choose an activity.

3. **The UI shows flat lists, not spatial groupings.** `LocationView.tsx` renders agents (left column) and encounters (right column, Active/Available) independently. No spatial narrative: no sense of "Kael is in the Temple Quarter doing a Rite of Ascension."

---

## 2. Design Decisions

### 2.1 Approach: Sublocations Organize Everything (Option A)

All encounters at a location are scoped to sublocations — not just ordeals, not just special encounters. This prevents a split mental model and makes sublocation choice the *first* spatial decision an agent makes at a location.

**Rejected alternatives:**
- (B) Sublocations only for ordeals — creates two parallel encounter systems
- (C) Hybrid implicit — unclear when sublocations apply, confusing for player

### 2.2 Architecture: Hybrid Lazy Creation (Approach 3)

Sublocation *types* are defined in content (graph model). Sublocation *instances* are created lazily as graph nodes when first needed at a location. This avoids prepopulating hundreds of nodes at game start while giving each sublocation a real identity once it matters.

**Rejected alternatives:**
- (1) Full reification at game start — wasteful, most sublocations never visited
- (2) Lightweight property bags — no identity, can't hold edges or persistent state

### 2.3 UI Model: Agent-Centric Presentation (Option iii)

The LocationView groups encounters *by sublocation*, and within each sublocation shows *agents first* with their encounter status inline. Available encounters are muted secondary information below the agent rows.

**Player narrative:** "I open Thornwall and see that Kael is in the Temple Quarter, midway through his Rite of Ascension (step 2 of 4). Reva is in a Moonlit Garden I created for her — she's just started A Chance Encounter."

**Rejected alternatives:**
- (i) Intermediate navigation step — too many clicks, breaks overview
- (ii) All-visible grouped list — lacks spatial narrative, reads as data table

---

## 3. Graph Architecture

### 3.1 Sublocation Instance as Graph Node

```typescript
interface SublocationNode extends GraphNode {
  category: 'sublocation';
  sublocationTypeId: string;      // e.g. 'sublocation.temple-quarter'
  parentLocationId: string;       // backref for fast lookup
  persistence: SublocationPersistence;
  divineOrigin?: {
    creatorGodId: string;
    purpose: string;              // e.g. 'arrange_meeting', 'test_resolve'
    createdAtTick: number;
  };
}

type SublocationPersistence =
  | { type: 'permanent' }
  | { type: 'temporal'; dissolvesOn: TemporalTrigger }
  | { type: 'conditional'; predicate: string };

type TemporalTrigger =
  | 'encounter_completed'
  | 'visited'
  | { type: 'tick_expiry'; expiresAtTick: number };
```

### 3.2 Edge Relationships

| Edge | From | To | Purpose |
|------|------|----|---------|
| `contains` | Location | Sublocation instance | Spatial hierarchy |
| `typed_as` | Sublocation instance | Sublocation type | Content lookup |
| `located_at` | Agent | Sublocation instance | Agent's current sublocation |
| `created_by` | Sublocation instance | God node | Divine origin tracking |

### 3.3 Lazy Instantiation

```
ensureSublocations(graph, locationId):
  locationTypeNode = graph.getNode(location.locationSubtype)
  sublocationTypes = graph.getEdges(locationTypeNode, 'contains_type')
  for each type:
    if no existing instance of this type at this location:
      create sublocation instance node
      add 'contains' edge from location
      add 'typed_as' edge to type
```

Called on first agent arrival at location, or on LocationView render. Idempotent.

### 3.4 Divine Sublocation Creation

A god action that spawns a thematic sublocation at a location to influence agent behavior indirectly. The god arranges the world; agents discover it through normal sublocation selection.

```
createDivineSublocation(graph, {
  locationId, sublocationTypeId, godId, purpose,
  persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' }
})
```

Example: An Entropy god creates a "Moonlit Garden" at a city to stage a chance meeting between an agent and a faction leader — maximizing the probability of alliance without directly commanding either party.

---

## 4. Sublocation Lifecycle & Persistence

### 4.1 Three Persistence Types

| Type | Created by | Removed when | Example |
|------|-----------|-------------|---------|
| **Permanent** | `ensureSublocations` | Never | Temple Quarter, Market District, Barracks |
| **Temporal** | God action or event | Trigger fires | Moonlit Garden (dissolves on encounter complete) |
| **Conditional** | System event | Predicate fails | War Camp (persists while faction conflict active) |

### 4.2 Dissolution Mechanics

When a temporal or conditional sublocation dissolves:

1. Active encounters → `status: 'abandoned'`, `reason: 'sublocation_dissolved'`
2. Agents at sublocation → `located_at` edge moved to parent location
3. Narrative event fired: `sublocation_dissolved` with context (which agents displaced, what was interrupted)
4. Graph node removed (edges cascade)

### 4.3 Tick-Based Expiry

Temporal sublocations with `tick_expiry` are checked each tick loop iteration. `expiresAtTick` is set at creation time (e.g. `currentTick + 20`). Checked in the dissolution sweep phase of the tick.

---

## 5. Agent Sublocation Selection Pipeline

Five-step pipeline replacing the current flat encounter selection:

```
1. ensureSublocations(graph, locationId)
   → Guarantees sublocation instances exist for this location type

2. scoreSublocations(agent, sublocations)
   → Score each sublocation by motivation alignment
   → Uses same axiological math as encounter scoring (ENCOUNTER_TYPE_MOTIVATIONS)
   → Sublocation type's "Hosts" edges → encounter types → motivation profiles → dot product with agent's axiological vector

3. weightedRandomSelect(scoredSublocations, prng)
   → Seeded PRNG weighted random from scored list
   → Highest-affinity sublocations most likely, but not deterministic

4. generateEncounterCandidates(agent, sublocation)
   → Encounter templates filtered by sublocationTypes (new field)
   → Falls back to locationTypes if sublocationTypes undefined

5. selectEncounter(candidates, agent)
   → Existing encounter selection logic (threat filter, goal alignment scoring)
```

### 5.1 Fallback Behavior

If a location type has no sublocation type mappings (`contains_type` edges in graph), the pipeline skips steps 1-3 entirely and falls back to current flat behavior. This ensures all 64 existing encounter templates work without changes.

### 5.2 Agent `located_at` Updates

When an agent selects a sublocation, a `located_at` edge is created (or moved) from the agent to the sublocation instance. This is what the UI reads to show "Kael is in the Temple Quarter."

---

## 6. Encounter Template Extension

### 6.1 New Field

```typescript
interface EncounterTemplate {
  // ... existing fields ...
  locationTypes: string[];        // existing, kept for backward compat
  sublocationTypes?: string[];    // NEW — if present, used for sublocation filtering
}
```

### 6.2 Resolution Order

```
if template.sublocationTypes defined:
  match against sublocation's type
else:
  match against location's type (current behavior)
```

### 6.3 Migration

No migration needed. Existing templates without `sublocationTypes` continue to work via `locationTypes` fallback. New templates and enriched existing ones can add `sublocationTypes` progressively.

---

## 7. UI — Agent-Centric LocationView

### 7.1 Layout

```
┌──────────────────────────────────────────┐
│ THORNWALL (city)                         │
│ Establishing shot prose                  │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ Temple Quarter              PERMANENT│ │
│ │ [K] Kael the Devoted                 │ │
│ │     Rite of Ascension  ●●○○  2/4     │ │
│ │ [S] Sister Maren                     │ │
│ │     Idle — considering options        │ │
│ │ + Vigil of the Undying, Sanctum...   │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ The Moonlit Garden           DIVINE  │ │
│ │ [R] Reva the Exile                   │ │
│ │     A Chance Encounter  ●○  1/2      │ │
│ │ Dissolves when encounter completes   │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Market District             PERMANENT│ │
│ │ [V] Voss the Cunning                 │ │
│ │     The Grand Bargain  ●●●○  3/4     │ │
│ │ + Merchant's Gambit, Pickpocket Chase│ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Barracks (permanent)  ·  Docks (permanent)│
└──────────────────────────────────────────┘
```

### 7.2 Sorting & Collapse Rules

1. Active sublocations (agents present) sort first, ordered by agent count descending
2. Empty sublocations collapse to a single muted row at bottom
3. Divine sublocations get purple gradient tint and border
4. Temporal sublocations show dissolution condition in italic

### 7.3 Step Dots

Multi-step encounter progress shown as inline dots: green (done), amber with glow (current), dark (pending). Compact and scannable.

### 7.4 Wireframe & Style Reference

- Full wireframe: `Design/sublocation-wireframe.html`
- Style tile section: `Design/style-tile.html` → "Sublocation Cards" section
- CSS variables: `src/index.css` → "Sublocation & Persistence" block

---

## 8. Content Alignment

### 8.1 Existing Assets

| Asset | Location | Status |
|-------|----------|--------|
| 7 sublocation types | Obsidian vault `Locations/Sub-locations/` | Ready — have Hosts edges |
| `SUBLOCATION_FLAVOR` | `src/data/chronicler-content.ts` | Ready — unwired |
| `getSubLocations()` | `src/engine/viewLevel.ts` | Ready — follows `contains` edges |
| Ordeal templates (10) | `Docs/plans/2026-03-08-content-population-design.md` §3.2 | Designed, unimplemented |

### 8.2 New Content Needed

| Content | Description | Scope |
|---------|------------|-------|
| `sublocationTypes` on templates | Add field to encounter templates that should be sublocation-specific | ~20-30 templates |
| Sublocation ↔ location type mappings | `contains_type` edges in graph model | 7 types × ~3-5 location types each |
| Divine sublocation purpose tags | Vocabulary of god action purposes | ~8-10 purpose strings |
| Dissolution event prose | Narrative text for sublocation removal | ~3-4 templates per dissolution type |

---

## 9. Non-Functional Alignment

| Priority | How this design honors it |
|----------|--------------------------|
| **Tunability** | Sublocation scoring weights, dissolution tick counts, divine spawn costs — all named constants |
| **Inspectability** | `located_at` edges are traceable graph state; selection pipeline produces scored list with reasons |
| **Determinism** | `weightedRandomSelect` uses seeded PRNG; same seed = same sublocation choice |
| **Fail-soft** | Missing sublocation types → skip pipeline, use flat fallback. Missing `sublocationTypes` → use `locationTypes`. Never crash. |
| **Narrative > mechanics** | Agent-centric UI tells spatial stories. Divine sublocations enable god-as-narrator. |
| **Additive** | New optional field on templates. New node category. No existing schema changes. |

---

## 10. Open Questions for Implementation

1. **Sublocation capacity limits?** Should sublocations have a max agent count? Probably not for MVP — let it emerge from encounter availability.
2. **God action UI for divine sublocations?** Needs its own design pass — what does the god see when choosing to create a sublocation? Deferred to god-action design phase.
3. **Ordeal chaining within sublocations?** The ordeal system (multi-encounter sequences) maps naturally to sublocation encounters. Design the ordeal engine to be sublocation-aware from day one, but implement chaining after the base sublocation system works.
