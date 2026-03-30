# Trait System — Design Document

**Date:** 2026-03-03
**Status:** Approved
**Origin:** Brainstorm building a flexible tagging system for emergent node properties
**Related:** Actor CRUD Action System, Axiological Motivation Engine, Cosmological Taxonomy

---

## 1. Overview

The trait system is a **flexible tagging mechanism** that attaches emergent properties to any node in the world graph. Traits are not a separate system bolted onto actors — they are **taxonomy nodes** connected via `has_trait` edges, fully integrated with the graph-native architecture.

Traits serve three purposes:

1. **Emergent characterization** — nodes accumulate traits through their actions, giving them identity and narrative weight
2. **Mechanical feedback loops** — traits modify future action availability, success probability, and capability stats, creating reinforcement cycles (e.g., repeated intrigue → "Master of Intrigue" trait → better intrigue actions → deeper mastery)
3. **Content designer extensibility** — new traits are data, not code. A content designer adds traits by creating taxonomy nodes with typed properties; no implementation changes required.

### 1.1 Design Principles

- **Graph-native:** Trait definitions are taxonomy nodes (category: "trait"). Trait assignments are `has_trait` edges with properties. No special data structures.
- **Generic with validation:** Any trait can apply to any node type in principle; each trait definition declares which node types are valid targets. The engine validates before assigning.
- **Organic acquisition:** Most traits are earned through patterns of behavior, not explicitly granted. The system watches action history and probabilistically awards traits when thresholds are met.
- **Diverse persistence:** Different trait categories have different lifespans — some permanent, some decaying, some evolving. This creates rich temporal dynamics.
- **Layered visibility:** Traits exist at three visibility levels (public, discoverable, divine-only), supporting both information gameplay and dramatic irony.

---

## 2. Architecture

### 2.1 TraitDefinition (Taxonomy Node)

Every trait is defined as a node in the cosmological taxonomy with `category: "trait"`.

```typescript
interface TraitDefinition extends TaxonomyNode {
  category: "trait";
  properties: {
    subcategory: TraitCategory;
    description: string;
    importance: number;               // 0.0–1.0, affects display priority
    validNodeTypes: NodeType[];        // which node types can hold this trait
    maxLevel: number;                  // 1 for binary traits, 3-5 for scaled traits
    visibility: "public" | "discoverable" | "divine_only";

    // Persistence
    persistence: PersistenceModel;

    // Effects applied while trait is active
    effects: TraitEffect[];

    // How this trait is acquired
    acquisitionRules: AcquisitionRule[];

    // Content designer metadata
    tags: string[];                   // free-form tags for filtering/grouping
    narrativeHooks: string[];         // story prompts for event generation
    flavorText: string;               // display text for players
  };
}
```

### 2.2 TraitAssignment (Graph Edge)

When a node acquires a trait, a `has_trait` edge is created:

```typescript
interface TraitAssignment {
  type: "has_trait";
  source: string;                     // node ID (the entity that has the trait)
  target: string;                     // trait definition ID (taxonomy node)
  properties: {
    level: number;                    // current level (1 to maxLevel)
    acquiredTick: number;             // simulation tick when acquired
    lastReinforcedTick: number;       // last time this trait was reinforced
    decayRate?: number;               // levels lost per decay period (mastery traits)
    evolutionState?: string;          // current state for evolving traits
    source: string;                   // what caused acquisition (action ID, event, etc.)
    visibility: "public" | "discoverable" | "divine_only";
  };
}
```

### 2.3 Trait Categories

Six categories, each with distinct persistence behavior:

| Category | Persistence | Lifecycle |
|----------|------------|-----------|
| **Innate** | Permanent | Assigned at creation or inherited; never removed |
| **Mastery** | Decaying | Earned through repeated action patterns; decays without reinforcement |
| **Reputation** | Evolving | Shifts based on ongoing behavior; can transform into related traits |
| **Scar** | Permanent | Earned from pivotal events; marks the node's history forever |
| **Condition** | Temporary | Applied by actions; removed by counter-actions or time expiry |
| **Destiny** | Permanent until fulfilled | Assigned by divine/spiritual forces; removed when destiny is completed or broken |

```typescript
type TraitCategory = "innate" | "mastery" | "reputation" | "scar" | "condition" | "destiny";

interface PersistenceModel =
  | { type: "permanent" }
  | { type: "decaying"; decayPeriod: Duration; decayAmount: number }
  | { type: "evolving"; states: string[]; transitions: EvolutionTransition[] }
  | { type: "temporary"; maxDuration: Duration }
  | { type: "conditional"; fulfillmentCondition: string };
```

---

## 3. Trait Effects

Every active trait produces one or more mechanical effects. Four effect types:

### 3.1 Action Modifier

Changes the probability, availability, or outcome of CRUD actions.

```typescript
interface ActionModifierEffect {
  effectType: "action_modifier";
  targetActions: {
    domain?: ActionDomain[];          // filter by domain (e.g., "political", "military")
    crudType?: CrudType[];            // filter by CRUD type
    specificActions?: string[];       // filter by action template ID
  };
  modifiers: {
    successProbability?: number;      // additive modifier, e.g., +0.15
    unlockActions?: string[];         // action template IDs now available
    lockActions?: string[];           // action template IDs no longer available
    durationModifier?: number;        // multiplier on action duration
  };
}
```

### 3.2 Stat Modifier

Adjusts a node's capability stats directly.

```typescript
interface StatModifierEffect {
  effectType: "stat_modifier";
  stats: Record<string, number>;      // stat name → additive modifier
}
```

### 3.3 Axiological Drift

Gradually shifts a node's value profile, influencing future motivation and action selection.

```typescript
interface AxiologicalDriftEffect {
  effectType: "axiological_drift";
  drift: Partial<Record<ValuePair, number>>;  // value pair → drift per tick
  // e.g., { "order_chaos": -0.02 } means 0.02 drift toward chaos per tick
}
```

### 3.4 Range Modifier

Adjusts the geographic or social range of CRUD operations.

```typescript
interface RangeModifierEffect {
  effectType: "range_modifier";
  rangeType: "geographic" | "social" | "read";
  modifier: number;                   // multiplier on base range
  terrainFilter?: TerrainType[];      // only applies in these terrains
}
```

---

## 4. Acquisition Rules

Five acquisition mechanisms. Each trait definition declares one or more rules; the first satisfied rule triggers acquisition.

### 4.1 Pattern Acquisition

Earned through repeated action patterns. The engine tracks rolling action windows and probabilistically grants traits when patterns are detected.

```typescript
interface PatternAcquisition {
  ruleType: "pattern";
  requiredActions: {
    domain?: ActionDomain[];
    crudType?: CrudType[];
    specificActions?: string[];
    minCount: number;                 // minimum actions matching this filter
    withinDuration: Duration;         // rolling window (e.g., "4 seasons")
  };
  probability: number;               // chance per check once pattern satisfied (0.0–1.0)
  levelUpThreshold?: number;         // additional actions needed per level
}
```

### 4.2 Event Acquisition

Earned from specific action outcomes — pivotal moments.

```typescript
interface EventAcquisition {
  ruleType: "event";
  triggerCondition: string;           // condition expression evaluated after actions
  // e.g., "action.crudType == 'delete' && target.type == 'dragon'"
}
```

### 4.3 Threshold Acquisition

Earned when a node property crosses a value boundary.

```typescript
interface ThresholdAcquisition {
  ruleType: "threshold";
  property: string;                   // node property to watch
  operator: ">" | "<" | ">=" | "<=";
  value: number;
}
```

### 4.4 Assigned Acquisition

Directly applied by another action (e.g., a god blessing a mortal).

```typescript
interface AssignedAcquisition {
  ruleType: "assigned";
  validSources: NodeType[];           // which node types can assign this trait
  requiredEdge?: string;              // edge type that must exist between source and target
}
```

### 4.5 Inherited Acquisition

Inherited from parent node relationships (e.g., a child born to a noble house).

```typescript
interface InheritedAcquisition {
  ruleType: "inherited";
  parentEdgeType: string;             // edge type connecting parent to child
  parentTraitRequired: string;        // trait ID the parent must have
  inheritProbability: number;         // chance of inheriting (0.0–1.0)
}
```

---

## 5. Visibility Model

Three visibility tiers control what information is available to the player:

| Level | Who sees it | Examples |
|-------|------------|---------|
| **Public** | Always visible on any node the player can inspect | "At War", "Noble-Blooded", "Feared" |
| **Discoverable** | Revealed through successful READ actions (espionage, investigation, divination) | "Master of Intrigue", "Oathbreaker" (before public reveal), "Cursed" |
| **Divine-only** | Only visible to the player through the World-Soul layer / divine awareness | "Prophesied King", "The Betrayer", "Doombringer" |

The player's divine awareness (determined by cosmology profile and spiritual sphere investment) determines the baseline for what destiny traits are visible. Heavy investment in the Spirit sphere reveals more divine-only traits.

---

## 6. Trait Catalog (Starting Set)

The following catalog is a **starting point**. The system is designed so content designers can add new traits by creating taxonomy node entries — no code changes required. Each entry below maps directly to a `TraitDefinition` taxonomy node.

### Content Designer Workflow

To add a new trait:
1. Create a new entry in the trait taxonomy data file (JSON)
2. Define: name, subcategory, validNodeTypes, effects, acquisitionRules, visibility
3. The engine automatically picks up the new trait definition at next taxonomy load
4. No code changes, no recompilation, no schema migration

To iterate on existing traits:
- Adjust numeric values (probabilities, modifiers, thresholds) in the data file
- Add/remove effects or acquisition rules
- Change visibility levels
- All changes take effect on next load

### 6.1 Innate Traits

| ID | Name | Valid Nodes | Effects | Acquisition |
|----|------|------------|---------|-------------|
| `innate.dragonborn` | Dragonborn | Individual, God, Ascendant | Action Mod: +0.15 military, +0.10 magical; Stat Mod: +resilience | Inherited: divine/draconic parent edge |
| `innate.noble_blooded` | Noble-Blooded | Individual | Action Mod: +0.15 political; Axio Drift: +authority, +tradition | Inherited: faction with "noble_house" tag |
| `innate.earthbound` | Earthbound | Culture, Faction | Stat Mod: +geographic range; Action Mod: +0.10 economic (mining, farming) | Assigned at creation based on origin terrain |
| `innate.seafaring` | Seafaring | Culture, Group, Faction | Action Mod: +0.10 economic (trade), +0.10 military (naval); Range Mod: +coastal/ocean | Assigned at creation OR Threshold: coastal territory >40% |
| `innate.fey_touched` | Fey-Touched | Individual, Group | Action Mod: +0.15 magical, +0.10 spiritual; Axio Drift: toward chaos/freedom | Inherited: spirit-layer edge OR Event: fey encounter |

### 6.2 Mastery Traits

| ID | Name | Valid Nodes | Effects | Acquisition | Decay |
|----|------|------------|---------|-------------|-------|
| `mastery.intrigue` | Master of Intrigue | Individual, Faction | Action Mod: +0.20 political espionage; Unlocks: "Shadow Network", "Double Agent" | Pattern: 5+ political/espionage actions within 4 seasons, p=0.6 | −1 level / 2 seasons without intrigue |
| `mastery.battle_hardened` | Battle-Hardened | Individual, Group | Stat Mod: +military capability; Action Mod: +0.15 military success | Pattern: 3+ military engagements survived, p=0.5 | −1 level / 3 seasons without combat |
| `mastery.lorekeeper` | Lorekeeper | Individual, Faction | Action Mod: +0.15 knowledge; Range Mod: +read range for hidden lore | Pattern: 4+ knowledge/discovery actions, p=0.5 | −1 level / 4 seasons without study |
| `mastery.trade_baron` | Trade Baron | Individual, Faction, Culture | Action Mod: +0.15 economic; Unlocks: "Monopoly", "Price War" | Pattern: 3+ trade routes + wealth threshold, p=0.4 | −1 level / 2 seasons without trade |
| `mastery.arcane_adept` | Arcane Adept | Individual, Ascendant | Action Mod: +0.20 magical all domains; Unlocks: "Ritual Casting", "Spell Weaving" | Pattern: 5+ magical actions across 2+ domains, p=0.4 | −1 level / 3 seasons without magic |

### 6.3 Reputation Traits

| ID | Name | Valid Nodes | Effects | Evolution |
|----|------|------------|---------|-----------|
| `reputation.feared` | Feared | Any | Action Mod: +0.15 military intimidation, −0.10 political diplomacy; Axio Drift on others: toward submission | Strengthens with destructive actions; weakens with merciful/generous actions |
| `reputation.beloved` | Beloved | Any | Action Mod: +0.15 social recruitment, +0.10 political legitimacy; Axio Drift on others: toward loyalty | Strengthens with generous/protective actions; weakens with tyrannical actions |
| `reputation.trustworthy` | Trustworthy | Any | Action Mod: +0.15 economic deals, +0.10 political alliances | Strengthens with honored agreements; shatters with betrayal → becomes "Oathbreaker" scar |
| `reputation.mysterious` | Mysterious | Individual, Faction | Action Mod: +0.10 knowledge (secrets), +0.10 spiritual; Range Mod: −read range for others targeting this node | Strengthens with hidden actions; weakens with public displays |
| `reputation.infamous` | Infamous | Any | Action Mod: +0.10 military recruitment of rogues, −0.15 political with lawful factions | Strengthens with criminal/destructive actions; can evolve into "Feared" or "Notorious" |

### 6.4 Scar Traits

| ID | Name | Valid Nodes | Effects | Acquisition |
|----|------|------------|---------|-------------|
| `scar.dragon_slayer` | Dragon-Slayer | Individual, Group | Action Mod: +0.20 military vs magical creatures; auto-grants "Feared" among dragonkin | Event: successful DELETE on dragon-type node |
| `scar.oathbreaker` | Oathbreaker | Any | Action Mod: −0.20 political alliances, −0.15 social trust; Axio Drift: toward chaos | Event: breaking a sworn edge (alliance, oath, pact) |
| `scar.kingmaker` | Kingmaker | Individual, Faction | Action Mod: +0.15 political succession; Unlocks: "Install Puppet", "Crown Pretender" | Event: successful CREATE of ruler edge on another node |
| `scar.godtouched` | Godtouched | Individual | Action Mod: +0.15 spiritual all types; Stat Mod: +divine awareness | Event: direct interaction with God-type node |
| `scar.ruined` | Ruined | Faction, Culture, Group | Stat Mod: −all capabilities; Action Mod: +0.10 knowledge (desperation innovations) | Event: losing >60% territory or membership in single action |

### 6.5 Condition Traits

| ID | Name | Valid Nodes | Effects | Duration | Removal |
|----|------|------------|---------|----------|---------|
| `condition.cursed` | Cursed | Any | Stat Mod: −targeted capability; Action Mod: −specific domain | Until removed | Spiritual DELETE on curse edge |
| `condition.blessed` | Blessed | Any | Stat Mod: +targeted capability; Action Mod: +specific domain | 1–4 seasons | Expires naturally or negated by opposing spiritual action |
| `condition.at_war` | At War | Faction, Culture, Group | Action Mod: +military, −economic (non-military); Range Mod: locked to conflict zone | Until peace or destruction | Political CREATE (treaty) or military DELETE (conquest) |
| `condition.plague_stricken` | Plague-Stricken | Any with population | Stat Mod: −all proportional to severity; Action Mod: −social, −economic | Until healed or burned out | Spiritual/knowledge healing or natural decay 2–4 seasons |
| `condition.siege` | Siege | Faction, Group (localized) | Action Mod: only defensive military + desperate actions; Stat Mod: decaying resources | Until siege broken | Military action or capitulation |

### 6.6 Destiny Traits

| ID | Name | Valid Nodes | Effects | Acquisition | Fulfillment |
|----|------|------------|---------|-------------|-------------|
| `destiny.prophesied_king` | Prophesied King | Individual | Axio Drift: toward authority/justice; hidden Action Mod: +0.20 political in rightful territory | Assigned by God-type node or inherited through prophecy edge | CREATE ruler edge on prophesied territory |
| `destiny.doombringer` | Doombringer | Individual, Faction | Axio Drift: toward entropy/destruction; hidden Stat Mod: +military in final season | Assigned by spiritual layer event | DELETE on major civilization node |
| `destiny.the_seeker` | The Seeker | Individual | Axio Drift: toward knowledge/freedom; hidden Action Mod: +0.15 knowledge discovery | Assigned through inherited quest edge | READ uncovering the sought artifact/truth |
| `destiny.chosen_of_sphere` | Chosen of [Sphere] | Individual, Ascendant | Hidden Stat Mod: +all actions aligned with sphere; Axio Drift: toward sphere values | Assigned by World-Soul layer pattern matching | Completing the sphere's grand purpose |
| `destiny.the_betrayer` | The Betrayer | Individual | Hidden Action Mod: +0.15 political deception; tragic Axio Drift: away from loyalty | Assigned — often unknown even to the node | Breaking the pivotal alliance/oath |

---

## 7. Reinforcement Loops

The trait system creates natural feedback loops that drive emergent narrative:

**Positive reinforcement:** Repeated military actions → "Battle-Hardened" → better military outcomes → more military actions chosen by motivation engine → deeper mastery. This makes actors specialize over time, developing distinct identities.

**Reputation cascades:** A faction that repeatedly breaks alliances → "Oathbreaker" → harder to form alliances → forced into military solutions → "Feared" reputation → other factions preemptively arm → regional arms race. Traits drive the narrative forward.

**Destiny tension:** A "Prophesied King" individual drifts toward authority but their faction might be "Ruined." The tension between personal destiny and collective condition creates story.

**Decay pressure:** Mastery traits require ongoing investment. A "Trade Baron" who pivots to war loses trading expertise, forcing meaningful choices about node identity.

---

## 8. Connection to Existing Systems

### 8.1 CRUD Action System

Traits modify actions through their effects:
- **Action Modifier effects** directly change success probability and unlock/lock specific action templates
- **Range Modifier effects** change the geographic/social reach of CRUD operations
- Trait acquisition rules reference CRUD actions by domain and type, closing the feedback loop

### 8.2 Axiological Motivation Engine

Traits connect to the 10 value pairs through:
- **Axiological Drift effects** gradually shift a node's value profile, changing future action preferences
- **Acquisition rules** can reference value thresholds (e.g., "gain Oathbreaker when loyalty value drops below 0.2")
- The motivation engine considers active traits when scoring action desirability

### 8.3 Cosmological Taxonomy

Trait definitions live in the taxonomy graph:
- Category: "trait", with subcategory for the six trait types
- Connected to relevant sphere nodes via taxonomy edges (e.g., "Battle-Hardened" → connects to Force sphere)
- Visible in the TaxonomyViewer as filterable "trait" category nodes

### 8.4 Player Interaction

Players interact with traits through the influence system:
- **Observe:** Public traits visible on inspection; discoverable traits revealed through READ actions
- **Influence:** Players can nudge actors toward actions that trigger trait acquisition (e.g., pushing a faction toward repeated intrigue to earn "Master of Intrigue")
- **Destiny awareness:** Spiritual sphere investment reveals divine-only destiny traits, giving the player dramatic irony and strategic foresight

---

## 9. Open Questions for Implementation

- **Trait interaction/stacking:** How do conflicting traits resolve? (e.g., "Blessed" + "Cursed" on same node)
- **Trait capacity:** Should nodes have a maximum number of active traits, or is the catalog self-limiting through acquisition difficulty?
- **Trait-to-trait dependencies:** Can traits require other traits as prerequisites? (e.g., "Archmage" requires "Arcane Adept" level 3)
- **Trait display in UI:** How do traits surface in the hex map, info panel, and taxonomy viewer?

---

## 10. Next Steps

1. **Implementation planning** — break this design into implementable tasks
2. **Trait data file** — create the initial JSON taxonomy entries for the starting catalog
3. **Acquisition engine** — implement the pattern/event/threshold/assigned/inherited rule evaluators
4. **Effect resolver** — implement the four effect types as modifiers on the action system
5. **Connect to motivation engine** — wire axiological drift effects into the value profile update loop
6. **UI integration** — display traits on nodes in info panel, taxonomy viewer, and hex tooltips
