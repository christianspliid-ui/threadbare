# Encounter Pipeline: The Healer at the Ward-Gate
> Scale: short | Slug: wandering-healer-shrine-access | Pass: systems
> Date: 2026-04-04 | Pipeline version: 1.0

---

## 1. Support Bundle Honesty

The revised file declares eight support objects. Assessment of each:

### Maret (wandering healer NPC)
- **Declared delivery:** lazy-materialize-on-trigger
- **Assessment: REALISTIC WITH CAVEATS.** The `healer` NPC role exists in `LOCATION_ROLE_ROSTERS` for town/city/capital settlements (chance 0.8-1.0). The encounter support bundle system (`encounterSupportBundle.ts`) supports `EncounterSupportActorSpec` with `reuseNpcRoles`, `supportRole`, `spawnNpcRole`, and `spawnName` fields. An existing healer NPC at the target location can be bound via reuse-first resolution. If none exists, the system can spawn one. The `must-persist` contract is achievable -- support actors are created as real graph nodes with `located_at` edges.
- **Caveat:** Maret is described as an *itinerant, unaffiliated* healer. The NPC seeding system places healers at fixed locations (`sublocation-type.temple-quarter`). Maret's concept is a wandering healer who has *arrived* at the settlement, which means she should not be bound to an existing temple-quarter healer who has always been there. The reuse rule in the support bundle ("if an itinerant healer NPC already exists in the settlement area, bind to that NPC") is aspirational -- the current NPC seeding system does not tag NPCs as itinerant vs. resident. Implementation would need to either: (a) always spawn Maret fresh as encounter-specific support cast, or (b) reuse any existing healer but accept the narrative mismatch. Option (a) is more honest.

### Jorik (ward gate-warden NPC)
- **Declared delivery:** lazy-materialize-on-trigger
- **Assessment: REALISTIC WITH CAVEATS.** The `guard` and `guard_captain` NPC roles exist and are mapped to `sublocation-type.gatehouse`. There is no `gate_warden` role in the NPC taxonomy. The closest match is `guard` or `guard_captain`, both of which seed at gatehouses. The support bundle can use `reuseNpcRoles: ['guard', 'guard_captain']` with `supportRole: 'gate_warden'` and `spawnNpcRole: 'guard'` as a fallback. This is a clean fit -- the gatehouse is a real sublocation type.
- **Caveat:** The `gate_warden` supportRole string would be encounter-specific flavor, not a live NPC role in the taxonomy. This is acceptable for v1 but means Jorik would appear as a `guard` in any system that reads NPC roles generically.

### Thornwall Ward (district/community)
- **Declared delivery:** pre-seeded
- **Assessment: NOT REALISTIC AS DECLARED.** The world generation system does not create named "wards" or "districts" as distinct graph nodes. Settlements are single location nodes with sublocations (gatehouse, market-district, temple-quarter, etc.). There is no "residential ward" sublocation type. The concept of a self-governing ward with its own assembly and outsider policy is a narrative object that does not map to any existing graph entity. The encounter can approximate this by treating the settlement itself as the ward, or by binding to the settlement location node, but the idea of a sub-settlement political unit with its own governance rules is not a live primitive.

### Ward-gate (sublocation feature)
- **Declared delivery:** pre-seeded
- **Assessment: PARTIALLY REALISTIC.** The `sublocation-type.gatehouse` exists and is generated at town/city/capital settlements. This is the closest structural match. However, a "ward-gate" (internal district boundary) is narratively distinct from a settlement gatehouse (external perimeter). The encounter can bind to an existing gatehouse sublocation and narratively frame it as a ward boundary gate. This is an acceptable approximation for a short encounter.

### Shrine garden (sublocation)
- **Declared delivery:** pre-seeded
- **Assessment: REALISTIC.** The `sublocation-type.garden` exists and is generated at temples, shrines, and some settlements. The concept of a shrine garden with altar stones and moonwort maps cleanly to this sublocation type. If the target settlement has a shrine or temple with a garden sublocation, binding is straightforward. If not, lazy materialization can create one.

### Moonwort (medicinal herb)
- **Declared delivery:** scene-only
- **Assessment: REALISTIC.** Declared as a narrative prop with no persistent item object. The `scene-only` persistence contract means no graph node is needed. This is honest.

### Thornwall Ward reputation channel
- **Declared delivery:** pre-seeded
- **Assessment: NOT REALISTIC AS DECLARED.** The reputation system operates through `reputationScore` (a 0-1 float on actor nodes) and `reputationTallies` (a key-value map on actor nodes). Both are per-actor properties. There is no per-ward, per-district, or per-community reputation channel. The encounter could approximate ward reputation by: (a) storing a reputation tally key like `thornwall_ward_trust` on the player's agent node, or (b) using the settlement location's reputation properties. Option (a) works within existing aftermath reaction effects (`reputation_tally` effect kind exists). Option (b) would require treating a location node as a reputation carrier, which is not currently wired.

### Maret disposition channel
- **Declared delivery:** lazy-materialize-on-trigger
- **Assessment: REALISTIC WITH CAVEATS.** If Maret is materialized as a persistent NPC graph node, her `reputationScore` property can carry disposition toward the player's agent. However, the current reputation system is not directional -- `reputationScore` is a single scalar on the actor, not a per-relationship value. An NPC does not have "disposition toward agent X" as a distinct channel; they have a single global reputation score. The `relates_to` edge type with `RelationshipEdgeProperties` (trust, respect, fear fields) could carry directional disposition, but the aftermath reaction system does not currently write to `relates_to` edges. This is a gap.

### Summary

| Support object | Declared | Honest assessment |
|---|---|---|
| Maret (healer NPC) | lazy-materialize | Achievable -- spawn as encounter support cast |
| Jorik (gate-warden NPC) | lazy-materialize | Achievable -- reuse guard/guard_captain at gatehouse |
| Thornwall Ward (district) | pre-seeded | **Not a live primitive** -- no ward/district graph entity |
| Ward-gate (sublocation) | pre-seeded | Approximate via existing gatehouse sublocation |
| Shrine garden (sublocation) | pre-seeded | Achievable via garden sublocation |
| Moonwort (herb) | scene-only | Achievable -- narrative prop only |
| Ward reputation channel | pre-seeded | **Not directly achievable** -- approximate via reputation tally key |
| Maret disposition channel | lazy-materialize | Partially achievable -- scalar reputationScore exists, directional disposition does not |

---

## 2. Missing Primitives

### Confirmed missing primitives:

1. **Sub-settlement political units (wards/districts).** The world graph has settlements as atomic location nodes with sublocations (gatehouse, market, temple, etc.). There is no concept of a self-governing district within a settlement that has its own governance, assembly, or outsider policy. This is a structural gap in the world model, not something that can be approximated with existing nodes.

2. **Directional NPC disposition.** The encounter expects Maret to have "disposition toward the player's agent" as a distinct channel. The current reputation system is a single scalar per actor, not per-relationship. The `relates_to` edge has trust/respect/fear fields, but the aftermath reaction system cannot write to those fields. The `reputation_tally` effect can approximate this with a keyed tally, but it lives on the actor's own node, not as a relationship.

3. **Community-level reputation.** The encounter expects "Thornwall Ward's outsider policy" to be a trackable, mutable state that colors future encounters. There is no per-community or per-sublocation reputation system. Per-actor reputation tallies can approximate this, but the meaning is different (player remembers the ward vs. ward remembers the player).

### Primitives that exist but need encounter-specific wiring:

4. **Itinerant NPC tagging.** The NPC system seeds residents at fixed locations. There is no concept of a wandering/itinerant NPC that arrives at a settlement temporarily. Maret could be spawned as encounter support cast, but she would appear identical to a resident NPC in all other systems.

### Primitives NOT missing (confirmed available):

- Five-tier outcome ladder: `critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure` -- fully supported in `StepOutcome` and `UnifiedActionOutcome`.
- Support bundle resolution with reuse-first actor binding.
- Aftermath summary with curated changes.
- Reputation tally accumulation via `EncounterAftermathReactionEffect` of kind `reputation_tally`.
- Reputation score delta via `EncounterAftermathReactionEffect` of kind `reputation_score`.
- Recent event emission via `EncounterAftermathReactionEffect` of kind `recent_event`.

---

## 3. Runtime Feasibility

### Beat count
The encounter is a single beat (one intervention, one resolution pass). The unified action system supports single-step actions cleanly. A single `ActionStep` with reach, difficulty, and duration is the simplest case.

### Outcome ladder
The five-tier outcome ladder (critical_success through critical_failure) is fully supported. `StepOutcome` carries exactly these five values. `computeFinalActionOutcome` in the lifecycle handles the mapping. For a single-step action, the step outcome IS the action outcome. This is clean.

### Resolution
The encounter is typed as `assist` (encounter type), which maps to `mercy_ruthlessness` and `loyalty_ambition` value pairs. The player's divine intervention is resolved through the standard sigmoid/d100 pipeline. The reach should be something in the social/spiritual domain -- `Diplomacy` or `Counsel` would be natural fits. The unified action resolution system handles this.

### Encounter type
The encounter maps to `encounterType: 'assist'` and would use `crudType: 'update'` (helping/changing an existing situation). `threatRating: 'easy'` or `'moderate'` depending on tuning.

### Choice system
The encounter is linear with no branching choices. The player fires the intervention and the outcome ladder determines results. The `EncounterInterventionChoice` system supports this -- the player can commit essence for a probability boost or disregard. No authored choice bundles needed.

### Duration
A short encounter with a single step. Duration of 1-2 ticks is appropriate. Fully supported.

**Runtime feasibility: PASS.** The core encounter mechanics can carry this.

---

## 4. Aftermath Supportability

### What the encounter declares vs. what the runtime can deliver:

| Aftermath consequence | Declared | Runtime support | Gap |
|---|---|---|---|
| Maret's disposition toward player agent | Per-outcome tier | `reputation_score` on Maret's actor node | Scalar only, not directional -- but functional for v1 |
| Thornwall Ward disposition | Per-outcome tier | `reputation_tally` key on player agent | Approximation -- "ward remembers" becomes "player tracks ward trust" |
| Child recovery timing | Narrative (success = fast, failure = slow) | `recent_event` aftermath effect | Narrative-only -- no persistent child health state |
| Jorik's authority status | Per-outcome tier | `reputation_tally` key on Jorik's node | Approximation -- no "authority standing" primitive |
| Maret's settlement access | Per-outcome tier | `reputation_score` on Maret's node | Can model as low reputation = unwelcome, but no access-control primitive |
| Family standing in ward | Per-outcome tier | Not directly supportable | No named family entity or social-standing primitive |
| Ward outsider policy hardening/softening | Per-outcome tier | Not directly supportable | No ward policy state; would need a tally key approximation |
| Future encounter hooks | "Exception creates precedent" | `future_hook` aftermath change kind exists | The kind exists in the type system but has no consumer yet |

### Reputation channels assessment:

The encounter declares two reputation channels:
1. **Thornwall Ward disposition toward the player's agent** -- Can be approximated with a `reputation_tally` entry keyed as something like `ward_trust:thornwall` on the player's agent node. The `reputation_tally` aftermath reaction effect is live and wired.
2. **Maret's personal disposition toward the player's agent** -- Can use Maret's `reputationScore` property. This works for "Maret likes/dislikes the agent" but loses directionality (it changes how Maret is perceived globally, not just by the player's agent).

**Aftermath supportability: PARTIAL.** Core reputation mechanics work. Community-level and directional NPC disposition are approximations, not clean mappings.

---

## 5. New Hooks Needed

| Hook | Description | Scope estimate | Blocked? |
|---|---|---|---|
| Encounter template registration | Register `wandering-healer-shrine-access` in the canonical unified template registry (`UNIFIED_ACTION_TEMPLATES` or encounter content). | Small -- add template to content file + register in unified array. | No |
| Support bundle spec | Author `EncounterSupportBundle` with specs for Maret (actor), Jorik (actor), gatehouse (location), garden (location). | Small -- data authoring using existing types. | No |
| Aftermath summary builder | Author the `EncounterAftermathSummary` with outcome-tier-specific overview text and curated changes. | Medium -- per-outcome prose + change list authoring. | No |
| Aftermath reaction effects | Wire reputation_tally and reputation_score effects to the outcome tiers. | Small -- use existing `EncounterAftermathReaction` types. | No |
| Ward-level reputation tally key | Define a convention for sub-settlement reputation keys (e.g., `ward_trust:SETTLEMENT_ID`). | Small -- naming convention only, uses existing tally system. | No |
| `future_hook` consumer | The `future_hook` aftermath change kind exists in the type system but has no runtime consumer that seeds follow-on encounters or pressures. | Medium-large -- new system required. | Yes -- not required for v1, encounter works without it. |
| Directional NPC disposition edges | Writing aftermath effects to `relates_to` edge trust/respect fields instead of scalar `reputationScore`. | Medium -- new aftermath effect kind + graph write logic. | Yes -- not required for v1, scalar approximation works. |

---

## 6. Implementation File Map

### Files to create:
| File | Purpose |
|---|---|
| `src/data/encounter-healer-shrine-access.ts` | Encounter template definition: steps, outcomes, support bundle, aftermath |

### Files to modify:
| File | Modification |
|---|---|
| `src/data/unified-action-templates.ts` | Import and register the new template in the canonical unified registry |
| `src/data/encounter-content.ts` | Add template to encounter content array (if using legacy registration path) |

### Files that need NO modification (confirmed working):
| File | Why |
|---|---|
| `src/engine/encounterSupportBundle.ts` | Existing support bundle resolution handles actor + location specs |
| `src/engine/unifiedActionLifecycle.ts` | Single-step action lifecycle is the simplest supported case |
| `src/engine/unifiedActionResolution.ts` | Standard resolution pipeline handles all outcome tiers |
| `src/engine/encounterAftermath.ts` | Existing aftermath reaction effects cover reputation_score, reputation_tally, recent_event |
| `src/engine/encounterChoiceMemory.ts` | Linear encounter with optional player intervention -- standard path |
| `src/types/encounter.ts` | All required types exist: EncounterSupportActorSpec, EncounterSupportLocationSpec, etc. |
| `src/types/unifiedAction.ts` | All required types exist: EncounterAftermathSummary, EncounterAftermathChange, etc. |

---

## 7. Verdict

**READY WITH CAVEATS**

The encounter can be implemented on the current runtime with the following caveats:

### Caveats (acceptable approximations for v1):

1. **Thornwall Ward is not a distinct graph entity.** The encounter must bind to the settlement location node and narratively frame a ward as a sub-area. Ward-level governance and outsider policy exist only in prose, not in world state. Ward reputation is approximated via a `reputation_tally` key on the player's agent.

2. **NPC disposition is scalar, not directional.** Maret's disposition toward the player's agent is stored as her global `reputationScore`, not as a per-relationship value. This means changing Maret's disposition changes how all systems perceive her reputation, not just her attitude toward one agent. For a short encounter with modest consequence, this is acceptable.

3. **No `future_hook` consumer exists.** The "exception creates a precedent" follow-on declared in the critical success outcome cannot be wired to a live system that seeds future encounters. It can be recorded as an aftermath change of kind `future_hook` for display purposes, but nothing will read it to generate follow-on content.

4. **Maret's itinerant status is not modeled.** She will appear as a standard NPC at the settlement, indistinguishable from resident NPCs in all systems except the encounter's own prose.

5. **Family social standing has no mechanical surface.** The critical failure consequence ("family is shamed") can be narrated in the aftermath summary but cannot be tracked as persistent state. No family entity or social-standing primitive exists.

### Not blocked:
- Core encounter mechanics (single beat, five-tier outcome ladder, support bundle, aftermath).
- NPC support cast creation (healer + guard roles exist, gatehouse + garden sublocations exist).
- Reputation consequences (tally keys and score deltas are live).
- Narrative aftermath (curated change list, overview prose, recent events).

---

## 8. Backlog Items

### Items to route to existing backlog tracks:

1. **Sub-settlement political units (wards/districts)**
   - Primitive family: world model / graph node types
   - Source encounter: `wandering-healer-shrine-access`
   - Why blocked: the encounter's narrative premise depends on a self-governing district within a settlement. The world graph does not model intra-settlement political boundaries.
   - Routing: this is a world model design question, not a component library gap. If multiple encounters need wards/districts, it deserves a dedicated TB item. For now, note under settlement model design.

2. **Directional NPC disposition (per-relationship, not per-actor)**
   - Primitive family: social fabric / reputation
   - Source encounter: `wandering-healer-shrine-access`, likely also needed by social encounters generally
   - Why blocked: aftermath reaction effects can only write `reputationScore` (scalar on actor) and `reputation_tally` (key-value on actor). Neither models "NPC X feels Y about agent Z" as a directional relationship.
   - Routing: TB-104 (Procedural Content Component Library) or a dedicated social fabric enhancement item. The `relates_to` edge already has trust/respect/fear fields -- the gap is in the aftermath reaction pipeline not being able to write to those fields.

3. **`future_hook` consumer**
   - Primitive family: encounter pipeline / follow-on seeding
   - Source encounter: `wandering-healer-shrine-access` (critical success precedent), likely needed by many encounters
   - Why blocked: the `future_hook` aftermath change kind exists as a type but has no runtime consumer. Recording a hook that nothing reads is display-only.
   - Routing: TB-104 or a dedicated encounter follow-on seeding item. This is a cross-cutting concern for any encounter that wants to create future narrative pressure.
