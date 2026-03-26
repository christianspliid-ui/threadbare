# Hex Actions Expansion & Control Mechanic — Full System Design

**Date:** 2026-03-26
**Status:** Design complete, pending implementation
**Backlog:** TB-036
**Depends on:** Generalized Action Targeting (✅), Mutable Hex State (✅), Location State Extensions (✅), HexActionBridge (✅)
**Brainstorm source:** `brainstorm-hex-actions-and-control-mechanic.md`
**Related:** Meet The First (TB-035) — encounter system, thread edges, court positions

## Problem

The god has almost no way to project power onto the world map. Five hex action templates exist (Bless the Land, Corrupt the Land, Survey Territory, Seed Life, and one more), all targeting the Land narrative layer. The Soul, People, and Ruins layers have zero player actions from hex context. More fundamentally, all existing actions are fire-and-forget: you spend essence, something happens, done. There is no sustained divine presence — no way to claim territory, maintain influence, or build an economic engine that funds further expansion.

The god-game fantasy is about *holding* things, not just *doing* things. You claim dominion over a hex and project your sphere's influence outward. You tap ancient essence sources and build income that funds your divine ambitions. You install champions in key locations and maintain their loyalty through ongoing investment. Without sustained effects, the simulation has actions but no strategy.

## Scope

This design covers five interconnected subsystems:

1. **The Control Verb & ControlEffect Runtime** — sustained effects with per-tick costs, economic constraints, and LIFO lapse ordering
2. **The Essence Economy Expansion** — creation spheres as starting currency (tall vs. wide), elder magic (foundation spheres) as discovered late-game resource, income-generating control effects
3. **Layer Revelation & Find-Gating** — per-layer visibility state on hexes, soft-gating Change/Control/Destroy behind Find actions
4. **Visibility & Contestation** — control effects as persistent encounter nodes, prerequisite-gated, usurp/destroy outcomes
5. **Action Template Matrix** — 43 templates across 5 verbs × 4 narrative layers (Land, Soul, People, Ruins)

**Out of scope:** Elder magic type system implementation (deferred — design defines interface shape), resource extraction economic loop (deferred — depends on resource system design, TB-TBD), onboarding auto-trigger (TB-037), Meet The First integration (TB-035/TB-040).

**Two interaction modes (architectural principle, carried from TB-035):**
- **Encounter interventions** (TB-035): in-the-moment divine presence during encounters. Vignettes, choices, essence spending. Dramatic, reactive.
- **Strategic actions** (this design): long-term investment on hexes, locations, agents NOT in encounters. Cards, hex map, sustained effects. Planning, tactical.

---

## System 1: The Control Verb & ControlEffect Runtime

### The Five Action Verbs

| Verb | CRUD Mapping | Character | Duration |
|------|-------------|-----------|----------|
| **Create** | `create` | Bring something into existence | One-shot |
| **Find** | `read` | Perceive, search, reveal hidden information | One-shot |
| **Change** | `update` | One-time modification for a one-time cost | One-shot |
| **Destroy** | `delete` | Remove, corrupt, scatter, erase | One-shot |
| **Control** | `update` (sustained) | Sustained effort requiring continuous resources | Persistent |

Change vs. Control: Change is a one-time modification. Control is a sustained commitment that drains resources every tick in exchange for ongoing effects. Control is the god-game signature — you don't just *do* things, you *hold* things.

### Two-Object Lifecycle

Control actions use a two-object model:

**Phase 1: Establishment** — uses the existing `UnifiedAction` pipeline unchanged. Same steps, same resolution, same traces. The template specifies `durationMode: 'sustained'` to distinguish from one-shot `'instant'` actions. If the establishment action resolves successfully, it spawns a `ControlEffect`. If it fails, nothing happens.

**Phase 2: Persistence** — the `ControlEffect` lives on `GameState.controlEffects[]` and is ticked every turn by `phaseControlEffects`. It drains essence, checks sustain conditions, applies per-tick mutations, and can be contested via its encounter node.

### Template Extension

```typescript
// Extension to UnifiedActionTemplate
interface UnifiedActionTemplate {
  // ... existing fields ...

  /** 'instant' (default) = fire-and-forget. 'sustained' = spawns ControlEffect on success. */
  readonly durationMode?: 'instant' | 'sustained';

  /** Only for durationMode: 'sustained'. Defines the persistent effect. */
  readonly controlSpec?: ControlSpec;
}

interface ControlSpec {
  /** Per-tick essence cost by sphere. Empty = no drain (threshold-only). */
  readonly perTickCost: Partial<Record<EssenceType, number>>;

  /** Per-tick essence income generated. Only for income-producing effects. */
  readonly perTickIncome?: Partial<Record<EssenceType, number>>;

  /** World-state condition that must remain true. Undefined = no threshold. */
  readonly sustainThreshold?: SustainThreshold;

  /** Per-tick mutations applied while active (hex state changes). */
  readonly perTickMutations?: readonly HexMutationSpec[];

  /** Per-tick graph operations applied while active (node property changes). */
  readonly perTickGraphOps?: readonly GraphOp[];

  /** Prerequisites for rivals to contest this effect. */
  readonly contestPrerequisites?: {
    readonly usurp?: ActorPrerequisites;   // Must match to take over
    readonly destroy?: ActorPrerequisites; // Must match to destroy
  };

  /** Prose shown when the effect is established, active, and lapsed. */
  readonly narrativeTemplates: {
    readonly established: string;
    readonly active: string;
    readonly lapsed: string;
    readonly usurped?: string;
    readonly destroyed?: string;
  };
}

interface SustainThreshold {
  readonly field: string;          // e.g. 'corruption', 'divineInfluence', 'magicalSaturation'
  readonly target: 'hex' | 'location';
  readonly operator: '>=' | '<=' | '>' | '<';
  readonly value: number;
}

interface ActorPrerequisites {
  readonly reach?: { domain: ReachDomain; minTier: number };
  readonly sphere?: { name: SphereName; relation: 'aligned' | 'opposing' };
}
```

| Constant | Default | Purpose |
|----------|---------|---------|
| `CONTROL_EFFECT_LAPSE_ORDER` | `'lifo'` | Lapse ordering when essence runs out (last-in-first-out) |
| `CONTROL_EFFECT_PAYMENT_ORDER` | `'established_asc'` | Payment ordering (oldest-first) |
| `CONTROL_THRESHOLD_CHECK_INTERVAL` | `1` | Ticks between threshold evaluations |

### ControlEffect Runtime Type

```typescript
interface ControlEffect {
  readonly effectId: string;
  readonly templateId: string;
  readonly ownerId: string;             // Ascendant who established it
  readonly targetHexCol: number;
  readonly targetHexRow: number;
  readonly targetNodeId?: string;       // Specific location/agent on the hex

  // Establishment
  readonly establishedTick: number;
  readonly ritualEssenceInvested: number;   // Sunk cost — what was paid to set up

  // Sustain (copied from ControlSpec at creation, immutable)
  readonly perTickCost: Partial<Record<EssenceType, number>>;
  readonly perTickIncome?: Partial<Record<EssenceType, number>>;
  readonly sustainThreshold?: SustainThreshold;

  // Ongoing effects
  readonly perTickMutations: readonly HexMutationSpec[];
  readonly perTickGraphOps: readonly GraphOp[];

  // State
  readonly active: boolean;
  readonly ticksActive: number;
  readonly lapseReason?: LapseReason;

  // Contestation
  readonly encounterNodeId?: string;    // Spawned encounter node
  readonly contestPrerequisites?: {
    readonly usurp?: ActorPrerequisites;
    readonly destroy?: ActorPrerequisites;
  };
}

type LapseReason =
  | 'essence_depleted'
  | 'threshold_failed'
  | 'usurped'
  | 'destroyed'
  | 'voluntarily_released';

// EssenceType: unified type covering both creation and elder spheres
type EssenceType = SphereName | ElderSphereName;
type ElderSphereName = 'chaos' | 'order' | 'light' | 'darkness';
```

**Tracing:**

```typescript
interface ControlEffectTickTrace extends TraceBase {
  category: 'control_effect';
  type: 'control_effect_tick';
  effectId: string;
  templateId: string;
  targetHex: { col: number; row: number };
  essenceDrained: Partial<Record<EssenceType, number>>;
  essenceGenerated: Partial<Record<EssenceType, number>>;
  thresholdChecked: boolean;
  thresholdPassed: boolean;
  active: boolean;
  ticksActive: number;
}

interface ControlEffectLapseTrace extends TraceBase {
  category: 'control_effect';
  type: 'control_effect_lapsed';
  effectId: string;
  templateId: string;
  targetHex: { col: number; row: number };
  lapseReason: LapseReason;
  totalTicksActive: number;
  totalEssenceDrained: Partial<Record<EssenceType, number>>;
}

interface ControlEffectEstablishedTrace extends TraceBase {
  category: 'control_effect';
  type: 'control_effect_established';
  effectId: string;
  templateId: string;
  ownerId: string;
  targetHex: { col: number; row: number };
  ritualEssenceInvested: number;
  encounterNodeId?: string;
}
```

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| `GameState.controlEffects` missing | Treat as empty array |
| Effect references non-existent hex | Lapse with `'threshold_failed'`, log warning |
| Threshold field missing on target | Treat field value as 0 |
| `perTickCost` references sphere with 0 pool | Lapse with `'essence_depleted'` |
| Effect owner no longer exists in graph | Lapse with `'voluntarily_released'` |
| `encounterNodeId` references deleted node | Clear field, skip contestation (effect still active) |

**PRNG:** Not needed for control effect ticking — deterministic arithmetic. Contestation resolution uses existing encounter PRNG.

### No Slots — Pure Economic Constraint

There are no artificial caps on control effects. The constraint is economic: you can hold whatever you can afford. Every control effect has a per-tick essence cost by sphere type. If total drain exceeds income, the newest effects lapse first (LIFO).

This creates three natural phases of play that emerge from economics:

- **Early game** — tiny income, maybe one cheap control effect. Most actions are one-shot.
- **Mid game** — built income from tapping sources. Several control effects projecting power. Each new one is a real cost decision.
- **Late game** — substantial income, network of control effects. Overextension is the threat — rivals contest your edges.

### phaseControlEffects — Tick Phase

Runs **after** `phaseEssence` (so income is credited first) and **before** one-shot action resolution.

```
Algorithm:
1. Collect all active ControlEffects from GameState.controlEffects[]
2. Sort by establishedTick ascending (oldest first for payment)
3. For each effect (oldest first):
   a. If sustainThreshold defined → query actual hex/location state
      - If condition fails → lapse with 'threshold_failed'. No essence charge. Emit trace. Continue.
   b. For each sphere in perTickCost:
      - If essencePool[sphere] >= cost → debit. Continue.
      - Else → mark for lapse (don't lapse yet — finish payment pass first)
   c. If still active → apply perTickMutations and perTickGraphOps
   d. If perTickIncome defined → credit to essencePool by sphere
   e. Increment ticksActive
   f. Emit ControlEffectTickTrace
4. Lapse all marked effects in LIFO order (newest first)
   - For each lapsed effect: set active=false, set lapseReason='essence_depleted'
   - Remove associated encounter node from graph
   - Emit ControlEffectLapseTrace
5. Return updated { controlEffects, essencePool }
```

| Constant | Default | Purpose |
|----------|---------|---------|
| `CONTROL_LAPSE_GRACE_TICKS` | `0` | Ticks of deficit tolerated before lapse (0 = immediate) |

---

## System 2: Essence Economy Expansion

### Two Tiers of Divine Currency

**Creation spheres** (Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy) — the worldly currency. Most hex actions cost creation sphere essence. You start with 1-3 creation spheres based on character generation choices. Building creation sphere income is the early game activity.

**Elder magic** (Chaos, Order, Light, Darkness) — discovered, not chosen. These are the game's name for the foundation spheres. Elder magic essence is found through ruins exploration: agents uncover hidden sites with elder magic traces, the god establishes control effects to tap them. You start with zero elder essence and no income. Discovering and tapping elder magic sources is the mid-to-late game progression. Elder magic actions are rare, powerful, and qualitatively different from creation sphere actions.

### Character Generation: Tall vs. Wide

In character generation, the player's ascendant archetype determines starting creation sphere alignment:

- **Tall** — deep affinity in one sphere (e.g., high entropy). Strong income in that sphere, weak elsewhere. Powerful single-sphere control effects early but brittle if disrupted.
- **Wide** — moderate affinity across 2-3 spheres (e.g., force + life + mind). Flexible but can't afford expensive single-sphere effects yet.

This is already modeled by `SphereAlignment.primary` and `SphereAlignment.secondary` on ascendant properties. The generation distribution (`EssenceDistribution.primaryFraction: 0.35, secondaryFraction: 0.25`) shapes the income curve.

### Income Sources

Base income exists: `BASE_ESSENCE_PER_TICK = 1.0`, plus `ESSENCE_PER_THREAD = 0.1` per threaded mortal and `ESSENCE_PER_PLACE_OF_POWER = 0.5`. Control effects add a fourth source:

**Control effect income** — `computeEssenceGeneration()` must be extended to iterate `GameState.controlEffects[]` and sum `perTickIncome` from active income-generating effects. This makes Tap the Source and similar effects visible in the `EssencePanel` as part of the player's total generation rate.

| Constant | Default | Purpose |
|----------|---------|---------|
| `BASE_ESSENCE_PER_TICK` | `1.0` | Already exists — starting trickle |
| `ESSENCE_PER_THREAD` | `0.1` | Already exists — per threaded mortal |
| `ESSENCE_PER_PLACE_OF_POWER` | `0.5` | Already exists — per controlled location |
| `TAP_SOURCE_BASE_INCOME` | `0.8` | Per-tick essence from Tap the Source |
| `TAP_SOURCE_SUSTAIN_COST` | `0.2` | Per-tick cost for Tap the Source |
| `CLAIM_RESOURCE_INCOME_MULTIPLIER` | `1.0` | Resource deposit quality → income rate |

### Elder Magic — Deferred Type System

The design defines `ElderSphereName = 'chaos' | 'order' | 'light' | 'darkness'` and `EssenceType = SphereName | ElderSphereName`. Implementation of this type expansion is deferred. For the initial implementation pass, all control effects use creation spheres only. The `ControlSpec.perTickCost` and `perTickIncome` use `Partial<Record<EssenceType, number>>` to be forward-compatible.

**Tracing:** Existing `TickSummaryTrace.essenceTotal` extended to include control effect drain/income breakdown.

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| Elder sphere referenced but type not yet in pool | Skip — effect cannot be established until type system supports it |
| Income-generating effect produces negative net (cost > income) | Allowed — it's a valid state (paying for strategic position) |

---

## System 3: Layer Revelation & Find-Gating

### Per-Layer Visibility State

Each hex has four independent revelation flags per player: Land, Soul, People, Ruins. These are tracked in a new `GameState.hexRevelation` map.

```typescript
type NarrativeLayer = 'land' | 'soul' | 'people' | 'ruins';

type HexRevelation = Record<NarrativeLayer, boolean>;

// On GameState:
hexRevelation: Record<string, HexRevelation>;  // key: `${col}_${row}`
```

Default: all layers start unrevealed. Land is auto-revealed when fog of war is lifted (existing visibility system). Soul, People, and Ruins require explicit Find actions.

### Find Actions Set Revelation

When a Find action resolves successfully, its target layer is set to revealed:

| Find Action | Layer Revealed |
|------------|----------------|
| Survey Territory | `land` (+ fog of war lift) |
| Dowse for Resources | `land` (resource deposits become visible) |
| Sense the Leylines | `soul` (partial — existence only, not detail) |
| Read the Currents | `soul` (full detail) |
| Divine the Populace | `people` (full detail) |
| Scry the Factions | `people` (partial — factions only) |
| Read the Stones | `ruins` (full detail — expensive direct divine action) |
| Whisper of Intuition | `ruins` (partial — through agent encounter) |

### Soft-Gating Through Visibility

Action templates for Change, Control, and Destroy only appear in the ActionDrawer if the relevant layer is revealed on the target hex. This is a new seventh filter gate in `getTargetActionSlots()` / `targetActions.ts`:

```
Gate 7: Layer Revelation
  - Template specifies requiredLayer: NarrativeLayer
  - Check hexRevelation[hexKey][requiredLayer] === true
  - If not revealed → template filtered out (not shown)
```

**Exception:** Create actions bypass this gate. You're bringing something new into existence — you don't need to know what was there before.

### Template Extension

```typescript
interface UnifiedActionTemplate {
  // ... existing fields ...

  /** Which narrative layer this template belongs to. Used for revelation gating. */
  readonly narrativeLayer?: NarrativeLayer;

  /** If true, this template bypasses layer revelation gating. Default: false.
   *  Typically true for Create actions. */
  readonly bypassRevelationGate?: boolean;
}
```

### Hidden Sites

Some sublocations are seeded as hidden during world generation (especially elder magic sites in ruins). Hidden sublocations have `properties.hidden: true` and don't appear in the hex detail view until a Find action or agent exploration encounter flips the flag.

```typescript
// On sublocation node properties:
hidden?: boolean;  // true = invisible until discovered
```

Find actions that reveal hidden sites use a `GraphOp`: `{ op: 'update_node', nodeId: '$sublocation', changes: { hidden: false } }`.

| Constant | Default | Purpose |
|----------|---------|---------|
| `HIDDEN_SITE_ELDER_MAGIC_PROBABILITY` | `0.15` | Chance a ruin hex has a hidden elder magic site |
| `HIDDEN_SITE_RESOURCE_PROBABILITY` | `0.25` | Chance a hex has a hidden resource deposit |

**Tracing:**

```typescript
interface LayerRevealedTrace extends TraceBase {
  category: 'revelation';
  type: 'layer_revealed';
  hexCol: number;
  hexRow: number;
  layer: NarrativeLayer;
  revealedBy: string;  // action template ID or encounter ID
}

interface HiddenSiteRevealedTrace extends TraceBase {
  category: 'revelation';
  type: 'hidden_site_revealed';
  hexCol: number;
  hexRow: number;
  sublocationId: string;
  sublocationName: string;
  hasElderMagic: boolean;
}
```

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| `hexRevelation` missing for a hex | Treat all layers as unrevealed |
| Template has no `narrativeLayer` | No revelation gate applied (backward compatible) |
| Hidden site reveal targets non-existent node | Skip reveal, log warning |

---

## System 4: Visibility & Contestation

### Control Effects as Encounter Nodes

When a control effect is established, `phaseControlEffects` creates a persistent encounter node on the hex. This node is:

- **Persistent** — doesn't despawn after one resolution (unlike normal encounters)
- **Prerequisite-gated** — only agents/ascendants meeting reach + sphere requirements can see it
- **Contestable** — resolution outcomes are usurp or destroy, not normal encounter outcomes

### Encounter Node Creation

```typescript
// When ControlEffect is established:
const encounterNode = {
  id: `control_encounter_${effectId}`,
  type: 'encounter',        // Existing node type
  category: 'encounter',
  name: controlTemplate.name,  // e.g. "Bound Entropy Well"
  properties: {
    persistent: true,
    controlEffectId: effectId,
    controlOwnerId: ownerId,
    encounterType: 'control_contestation',
    // Usurp prerequisites — must match to take over
    usurpPrerequisites: controlSpec.contestPrerequisites?.usurp,
    // Destroy prerequisites — must match to destroy
    destroyPrerequisites: controlSpec.contestPrerequisites?.destroy,
    // Display
    sphereAffinity: template.sphereAffinity,
    description: controlSpec.narrativeTemplates.active,
  }
};
```

### Prerequisite Filter Implementation

The encounter filter pipeline's `filterByPrerequisites()` (currently a no-op) must be implemented for control contestation encounters:

```
For each control_contestation encounter:
  Check agent's Domain Capability tier in required reach
  Check agent's sphere alignment against required sphere
  If usurpPrerequisites met → agent can see encounter, usurp path available
  If destroyPrerequisites met → agent can see encounter, destroy path available
  If neither met → encounter invisible to this agent
```

This does NOT affect normal encounters — they continue passing through unfiltered until a broader prerequisites system is designed.

### Contestation Outcomes

**Usurp** — rival meets usurp prerequisites AND wins the encounter resolution:
- Control effect transfers to the rival. `ownerId` changes. Rival inherits all infrastructure (sunk ritual investment, sustain conditions, ongoing effects).
- Rival begins paying the sustain cost from their essence pool.
- Original owner receives a narrative event: "Your [effect name] at [hex] has been seized by [rival]."
- **Intelligence bonus:** Usurper gains visibility into what the original owner was investing in (the effect's template, sphere costs, and duration become visible).

**Destroy** — rival meets destroy prerequisites AND wins:
- Control effect is permanently destroyed. `active = false`, `lapseReason = 'destroyed'`.
- Encounter node removed. Infrastructure gone — nobody gets it.
- Both parties receive narrative events.

**Failed contestation** — rival loses the encounter:
- Nothing changes. Effect remains active. Rival may suffer encounter failure consequences (damage, detection, etc.).

**Usurp inherits investment.** The pre-work is done — the usurper just steals the running operation. This makes defense urgent and offense rewarding. The usurper skips the entire establishment action (no ritual cost, no multi-tick setup).

| Constant | Default | Purpose |
|----------|---------|---------|
| `CONTESTATION_BASE_DIFFICULTY` | `0.5` | Base encounter difficulty for contesting a control effect |
| `CONTESTATION_TICKS_ACTIVE_SCALING` | `0.01` | Per-tick difficulty increase (older effects are harder to contest) |
| `CONTESTATION_MAX_DIFFICULTY` | `0.85` | Cap on difficulty scaling |
| `USURP_DETECTION_RISK` | `0.8` | Chance the original owner detects the usurp attempt |

**Tracing:**

```typescript
interface ControlContestationTrace extends TraceBase {
  category: 'control_effect';
  type: 'control_contestation';
  effectId: string;
  contestantId: string;
  contestType: 'usurp' | 'destroy';
  outcome: 'success' | 'failure';
  newOwnerId?: string;  // Only on successful usurp
}
```

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| Encounter node exists but control effect doesn't | Remove orphaned encounter node |
| Control effect exists but encounter node missing | Recreate encounter node on next tick |
| Usurp target effect lapsed between encounter start and resolution | Treat as failed contestation — nothing to take over |
| Contestant doesn't have enough essence to sustain usurped effect | Usurp succeeds but effect immediately enters lapse evaluation next tick |

---

## System 5: Action Template Matrix

### Design Philosophy Per Layer

**The Land** — direct divine action on terrain and resources. This is where you feel most powerful.
**The Soul** — the god's sensing network and magical infrastructure. Extend perception through agents and artifacts.
**The People** — the god works through mortals. Augment agents via threads (ongoing) or artifacts (one-time).
**The Ruins** — the god does NOT enter personally (too dangerous). Nudge agents toward discovery. Direct action exists but is expensive and inefficient.

### THE LAND (terrain, biome, resources, divineInfluence, corruption)

**Create:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.seed_life` | Seed Life ✅ | flesh | life | 6 | land | Terraform barren land, +divineInfluence |
| `hex.raise_landmark` | Raise Landmark | stone | — | 8 | land | Sculpt geographic feature → becomes sublocation + settlement site |

**Find:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.survey` | Survey Territory ✅ | eye | — | 0 | land | Reveal fog of war on hex + adjacent |
| `hex.dowse_resources` | Dowse for Resources | eye | — | 2 | land | Reveal hidden resource deposits. Gates resource-related actions. |
| `hex.sense_leylines` | Sense the Leylines | eye | — | 1 | land | Detect whether hex has latent sphere influence (existence only) |

**Change:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.bless_land` | Bless the Land ✅ | star | — | 3 | land | One-time +divineInfluence bump |
| `hex.corrupt_land` | Corrupt the Land ✅ | veil | entropy | 4 | land | One-time +corruption |
| `hex.shift_season` | Shift Season | flesh | life/entropy | 3 | land | Alter growing conditions. Boost/suppress location prosperity for N ticks. |
| `hex.scorch_earth` | Scorch Earth | iron | force | 7 | land | Immediate terrain degradation. Fast, expensive, dramatic. Destroys resource deposits. |

**Destroy:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.rend_earth` | Rend the Earth | stone | force | 12 | land | Create broken_lands. Destroys all locations and resources. Catastrophic. |

**Control:**

| ID | Name | Reach | Sphere | Cost/tick | Sustain | Layer | Description |
|----|------|-------|--------|-----------|---------|-------|-------------|
| `hex.claim_dominion` | Claim Dominion | star | primary | 0.3 primary | — | land | Consecrate hex to your sphere. Slows divineInfluence decay, resists corruption. |
| `hex.cultivate` | Cultivate | flesh | life | 0.4 life | — | land | Sustained fertility boost. Locations gain prosperity faster. |
| `hex.claim_resource` | Claim Resource | gold | — | varies | — | land | Bind discovered resource deposit. Generates resource income/tick. Requires Dowse. |

### THE SOUL (sphere influence, magical saturation, leylines, sensing)

**Create:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.attune_leyline` | Attune Leyline | veil | target sphere | 5 | soul | Inject sphere influence where none exists |
| `hex.forge_seer_token` | Forge Seer's Token | eye | veil | 8 | soul | Create artifact: passive sphere sight wherever bound agent travels. One-time cost. |

**Find:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.read_currents` | Read the Currents | eye | veil | 3 | soul | Reveal sphere influences + intensities. Full Soul layer reveal. |

**Change:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.shift_dominion` | Shift Dominion | veil | — | 4 | soul | Push one sphere up at cost of another. Rebalance magical ecology. |
| `hex.amplify_flow` | Amplify the Flow | veil | — | 3 | soul | One-time magicalSaturation boost at all locations on hex |

**Destroy:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.sever_flow` | Sever the Flow | veil | entropy | 6 | soul | Cut all sphere influence, create dead zone. |
| `hex.dispel_wild` | Dispel the Wild | veil | opposing | 4 | soul | Purge uncontrolled/hostile magical effects. |

**Control:**

| ID | Name | Reach | Sphere | Cost/tick | Sustain | Layer | Description |
|----|------|-------|--------|-----------|---------|-------|-------------|
| `hex.anchor_sphere` | Anchor the Sphere | veil | target sphere | 0.5 target | sphere influence ≥ 0.3 | soul | Lock dominant sphere. Prevents drift and rival Shift Dominion. Hybrid sustain. |
| `hex.tap_source` | Tap the Source | veil | source sphere | 0.2 source | varies by source | soul | Siphon essence/tick from sphere-aligned site. The canonical income effect. |
| `hex.attune_thread` | Attune Thread | eye | — | scales w/tier | thread exists | soul | Passive sphere sensing on threaded agent. Cheaper at higher thread tiers. |
| `hex.channel_current` | Channel the Current | veil | — | 0.4 primary | — | soul | Sustained sphere flow redirection. Pull/push influence from adjacent hexes. |

### THE PEOPLE (cultures, factions, agents, encounters, locations)

**Create:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.send_herald` | Send a Herald | heart | star | 7 | people | Spawn sphere-aligned wandering agent on hex |
| `hex.forge_instrument` | Forge Divine Instrument | star | varies | 10 | people | Create artifact boosting specific reach. Bind to agent. Permanent until lost. |
| `hex.spark_encounter` | Spark an Encounter | shadow | — | 4 | people | Force-generate encounter at location. Player chooses type. |

**Find:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.divine_populace` | Divine the Populace | eye | heart | 3 | people | Reveal hidden agents, factions, disposition, unrest. Full People reveal. |
| `hex.scry_factions` | Scry the Factions | eye | shadow | 2 | people | Expose faction presence and influence. Partial People reveal. |

**Change:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.stir_people` | Stir the People | heart | — | 3 | people | One-time shift to cultural values or faction disposition |
| `hex.summon_congregation` | Summon Congregation | heart | star | 5 | people | Draw agents from adjacent hexes toward this one |
| `hex.bestow_vision` | Bestow Vision | mind | heart | 2 | people | Send dream/omen to specific agent. Influences next ambition. Thread required. |

**Destroy:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.scatter` | Scatter | iron | force | 5 | people | Force agents to flee, dissolve faction presence |
| `hex.smite` | Smite | iron | force | 15 | people | Kill specific agent. Extremely expensive, high detection. Nuclear option. |
| `hex.incite_exodus` | Incite Exodus | shadow | chaos | 4 | people | Trigger mass departure, tank prosperity. Slower than Scatter. |

**Control:**

| ID | Name | Reach | Sphere | Cost/tick | Sustain | Layer | Description |
|----|------|-------|--------|-----------|---------|-------|-------------|
| `hex.shepherd_flock` | Shepherd the Flock | heart | star | 0.5 star | — | people | Sustained conversion pressure. Agents drift toward worship. |
| `hex.install_champion` | Install a Champion | shadow | gold | 0.6 primary | — | people | Elevate agent to faction leadership. Neglect → betrayal. Requires Divine the Populace. |
| `hex.strengthen_thread` | Strengthen Thread | heart | varies | scales w/tier | thread exists | people | Enhance agent capabilities via thread. Cheaper at higher tiers. Flexible reach boost. |
| `hex.impose_decree` | Impose Decree | shadow | order | 0.4 primary | — | people | Sustained behavioral constraint on all agents at hex. High-independence resists. |

### THE RUINS (historical culture, archaeology, elder magic)

*The ascendant does NOT enter ruins directly. Work through agents. Direct actions exist but are expensive.*

**Create:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.mark_ground` | Mark the Ground | eye | — | 1 | ruins | Plant exploration hook on any hex. Makes agents more likely to investigate. |
| `hex.plant_dream` | Plant a Dream of the Past | mind | — | 3 | ruins | Implant vision in agent → new ambition to seek ruins here. Thread required. |

**Find:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.read_stones` | Read the Stones | eye | veil | 8 | ruins | Direct divine perception. Full ruins reveal + elder magic traces. Expensive brute force. |
| `hex.whisper_intuition` | Whisper of Intuition | mind | eye | 2 | ruins | Grant agent divine hunch. Boosts next Find encounter in ruins. Partial reveal. Thread required. |

**Change:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.consecrate_past` | Consecrate the Past | star | primary | 5 | ruins | Align ruins to your sphere. Changes encounter spawning. |
| `hex.restore_fragment` | Restore a Fragment | stone | — | 8 | ruins | Partially rebuild ruin → create functional blended sublocation |
| `hex.rewrite_history` | Rewrite History | mind | shadow | 6 | ruins | Alter historical culture legacy. Powerful, may attract rival attention. |

**Destroy:**

| ID | Name | Reach | Sphere | Essence | Layer | Description |
|----|------|-------|--------|---------|-------|-------------|
| `hex.bury_past` | Bury the Past | stone | entropy | 6 | ruins | Collapse ruins, erase traces. Deny rivals elder magic access. |
| `hex.desecrate` | Desecrate | veil | entropy | 4 | ruins | Corrupt ruins into hostile encounter source. Cheaper denial, leaves structure. |

**Control:**

| ID | Name | Reach | Sphere | Cost/tick | Sustain | Layer | Description |
|----|------|-------|--------|-----------|---------|-------|-------------|
| `hex.bind_echoes` | Bind the Echoes | veil | — | 0.3 primary | — | ruins | Claim ruins as influence node. Resists rival interference. Prerequisite for elder tapping. |
| `hex.compel_exploration` | Compel Exploration | mind | heart | 0.4 mind | — | ruins | Sustained pressure on all threaded agents to seek ruins in target area. |
| `hex.seal_tomb` | Seal the Tomb | shadow | order | 0.2 primary | — | ruins | Lockdown. Nobody interacts — including you. Cheap denial play. |
| `hex.ward_against_deep` | Ward Against the Deep | veil | star/light | 0.5 varies | — | ruins | Protect exploring agent. Reduces elder-magic encounter danger. |

---

## Integration Assessment

### What Exists and Works

| System | Status | Notes |
|--------|--------|-------|
| Generalized Action Targeting | ✅ Ready | Target context builders, filter pipeline, slot assignment |
| ActionDrawer + ActionCard | ⚠️ Partial | Selection works for one-shot actions. No control-action visual variant, no ongoing cost display. |
| Hex mutable state | ✅ Ready | divineInfluence, corruption, terrain transformation, phaseHexState |
| Location state extensions | ✅ Ready | unrest, magicalSaturation, phaseUnrest, phaseMagicalSaturation |
| HexActionBridge | ✅ Ready | Template → HexMutation mapping |
| Essence system | ✅ Ready | Sphere-typed pool, per-tick generation, spending, maintenance |
| EssencePanel UI | ✅ Ready | Per-sphere display with net income |
| Resource system (types) | ✅ Ready | ResourceDefinition, ResourceInstance, seeding |
| Artifact system | ✅ Ready | Node types, edges, domainContributions, lossCondition |
| Thread edge system | ✅ Ready | Tier, maintenance, awareness, court position |
| Ambition system | ✅ Ready | pursues edges, milestones, priorities |
| Encounter system | ⚠️ Partial | 64 templates, filter pipeline, resolution — but no persistent encounters, no prerequisite filter, no multi-actor |
| GraphOp executor | ⚠️ Partial | add_node, add_edge, update_node exist — relative changes implemented. Never used for artifact creation from player action. |

### What Needs New Architecture

| System | Scope | Blocks |
|--------|-------|--------|
| `ControlEffect` on GameState | New type, new array on state | All control actions |
| `phaseControlEffects` | New tick phase | Control effect ticking, income, lapse |
| Layer revelation map | New state + filter gate | Find-gating, Soul/People/Ruins actions |
| Hidden site property + seeding | Property + worldgen change | Resource discovery, elder magic discovery |
| Persistent encounter nodes | Encounter system extension | Control effect contestation |
| Prerequisite filter implementation | Encounter pipeline fix | Contestation visibility gating |
| HexControlPanel (or HexChronicle section) | New UI | Showing active effects on hexes |
| ActionCard control variant | Component extension | Distinguishing sustained from one-shot |

### What Can Be Deferred

| System | Why Deferrable | Dependency |
|--------|---------------|------------|
| Elder magic type system | All creation-sphere effects work without it | Only elder-magic-specific actions blocked |
| Resource extraction loop | Claim Resource template authored but needs economic loop | Separate resource system design |
| Artifact creation via action | Forge Seer's Token/Instrument templates authored but need GraphOp chain | GraphOp executor extension |
| Ambition assignment via action | Plant a Dream template authored but needs pursues-edge GraphOp | Ambition system extension |
| Multi-sphere cost actions | All initial templates use single-sphere costs | Complex intervention cost model |

---

## Wiring

### Orchestrator

`phaseControlEffects` — new phase after `phaseEssence` (Phase 6), before action resolution. Iterates active effects, checks thresholds, debits/credits essence, applies mutations, lapses underfunded effects.

### UI Rendering

| Component | What it shows | Status |
|-----------|--------------|--------|
| `ActionDrawer` / `ActionCard` | New templates + control variant visual | Needs extension |
| `HexChronicle` | Active control effects section per layer | Needs new section |
| `EssencePanel` | Net income including control effect drain/income | Needs `computeEssenceGeneration` extension |
| `HexSidebar` | Revelation state indicators per layer | Needs new indicators |

### GameState Flow

| Field | Written by | Read by |
|-------|-----------|---------|
| `controlEffects[]` | `phaseControlEffects`, action resolution | `phaseControlEffects`, UI components, `computeEssenceGeneration` |
| `hexRevelation` | Find action resolution | `getTargetActionSlots()`, `HexChronicle`, `HexSidebar` |
| `essencePool` | `phaseEssence`, `phaseControlEffects` | `EssencePanel`, `ActionCard` (affordability), intervention system |

### Traces

| Category | Emitted by |
|----------|-----------|
| `control_effect` (tick, lapsed, established) | `phaseControlEffects` |
| `revelation` (layer_revealed, hidden_site_revealed) | Find action resolution |
| `control_contestation` | Encounter resolution (contestation path) |

### Debug Visibility

- DebugPanel: new "Control Effects" tab showing all active effects, costs, thresholds, ticks active
- DebugPanel: "Revelation" tab showing per-hex layer revelation state
- Trace viewer: control_effect and revelation categories

### Prose Pipeline

Control effect narrative templates pass through `enrichProse()` for world-state injection (titles, sphere names, location names, agent names).

### Player Controls

- ActionDrawer: new templates appear when revelation + prerequisites met
- HexChronicle: "Release" button on active control effects (voluntary lapse)
- HexChronicle: click on contestation encounter to inspect prerequisites

---

## NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | PASS | 20+ new named constants. All costs, thresholds, income rates, and scaling factors are tunable. Template matrix is pure data. |
| 2 | Inspectability | PASS | 6 new trace types across 3 categories. Every control effect tick, lapse, establishment, and contestation is traced with full before/after state. |
| 3 | Determinism | PASS | Control effect ticking is deterministic arithmetic. Threshold checks are pure comparisons. Contestation uses existing encounter PRNG. Payment/lapse ordering is deterministic (established_asc / LIFO). |
| 4 | Fail-soft | PASS | Every new field defaults gracefully when missing. Orphaned encounter nodes auto-cleaned. Lapsed effects handled without crashes. Missing revelation map treated as all-unrevealed. |
| 5 | Narrative > mechanical | PASS | Control effects are "holding territory" and "tapping ancient power," not "incrementing counters." Ruins layer explicitly designed around divine danger and working through mortals. Elder magic is discovered through story, not granted. |
| 6 | Additive > destructive | PASS | New `controlEffects[]` array on GameState. New `hexRevelation` map. New `durationMode` and `controlSpec` on template. New `narrativeLayer` on template. All optional, backward compatible. No existing fields removed. |
| 7 | Performance budget | PASS | `phaseControlEffects` iterates once per active effect per tick. Expected count: 5-20 active effects in typical gameplay. Revelation map is O(1) lookup. No per-frame costs. |

---

## Appendix A: Resolved Design Decisions (Grey Zones)

These decisions were explicitly discussed and resolved during the design review session (2026-03-26).

### A1. Lapse Behavior: Immediate + Notify

When a control effect can't be paid for, it lapses immediately on the tick it can't afford. The player receives a notification after the fact ("Claim Dominion at hex 5,3 has lapsed — insufficient Star essence"). No warning tick, no grace period. This forces proactive budget management. The `CONTROL_LAPSE_GRACE_TICKS` constant stays at `0`.

### A2. Ruins Layer: God Acts at a Distance, Not in Person

The "god doesn't enter ruins" rule is about *encounters*, not *all interaction*. The god can:
- **Perceive** ruins from above (Read the Stones — expensive but allowed)
- **Create** things in or around ruins (Mark the Ground, Consecrate the Past — very godly acts)
- **Leave things to be found** (exploration hooks, consecrations, hidden gifts)

The god does NOT:
- Personally enter an encounter inside ruins
- Do "the dirty work" — that's what agents are for

Direct divine ruins actions remain available but should be more expensive than agent-mediated alternatives where both exist. The cost differential reinforces the design without hard-blocking the god.

### A3. Artifact Loss: Via Encounters + Transferable

Artifacts created by player actions (Forge Seer's Token, Forge Divine Instrument) can be lost as a specific consequence of an encounter. They can also be transferred between agents, but that transfer is itself an encounter (a social encounter type — handing over a divine gift). This means:
- Artifact loss is always narratively meaningful (encounter consequence, not random)
- Transfer requires agents to be co-located (same encounter)
- The encounter system is the universal mechanism for artifact movement

Implementation: encounter outcome GraphOps that remove `possesses`/`bonded_to` edges and optionally create new ones on a different agent. This is a future encounter content task, not a system architecture change.

### A4. Thread Tier Scaling: Cheaper at High Tier

Thread-based control effects (Attune Thread, Strengthen Thread) cost less to sustain at higher thread tiers. A tier-4 Champion thread is a deep, efficient channel — sustaining effects through it is cheap because the connection is strong.

Scaling formula: `effectiveCost = baseCost * (1.0 - (threadTier * THREAD_TIER_DISCOUNT_FACTOR))`

| Constant | Default | Purpose |
|----------|---------|---------|
| `THREAD_TIER_DISCOUNT_FACTOR` | `0.15` | Per-tier cost reduction (15%). Tier 4 = 40% discount. |
| `THREAD_TIER_MIN_COST_FRACTION` | `0.4` | Floor — never cheaper than 40% of base cost |

### A5. Discovery Flow: Attention Mode Determines Timing

When an agent explores ruins and discovers an elder magic site (or any hidden site):
- **Attention mode `'pause'`** — the god sees the discovery immediately. The game pauses, showing the discovery vignette. Full detail revealed.
- **Attention mode `'auto_resolve'`** — the discovery is queued. The god learns about it next time they check on that agent (click on them, or review the narrative log). Detail level depends on thread tier.
- **No thread** — the god never learns about the discovery through this agent. The site exists in the world but the god has no way to know about it unless another threaded agent finds it or the god uses Read the Stones directly.

This ties discovery into the existing attention mode system from TB-035 and creates a real reason to have high-attention threads on explorer agents.
