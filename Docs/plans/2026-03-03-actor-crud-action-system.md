# Actor CRUD Action System — Design Document

**Date:** 2026-03-03
**Status:** Approved
**Origin:** Brainstorm refining the Actor CRUD Model design seed

---

## 1. Overview

This document defines a **universal action system** where all actors in the simulation — gods, ascendants, factions, cultures, groups, and individuals — interact with the world through **constrained CRUD operations on the world graph**. Every meaningful activity in the game decomposes into Create, Read, Update, or Delete operations on nodes and edges.

The system is designed for **epic-scale narrative**, not tactical resolution. Actions operate at timescales from days to seasons, generating the kind of events that would merit a chapter in a fantasy novel or a scene in a TV series.

### 1.1 Design Principles

- **Graph-first:** Every action is a typed graph operation with a defined signature
- **Actor-agnostic templates:** The same action template works for any actor type; only the narrative flavor and success probability change
- **Narrative coherence:** Actions are chosen to be interesting, story-generating, and meaningful — not operational
- **Extensible:** New actions, domains, and actor types can be added without architectural changes
- **Connected to motivation:** The axiological engine determines which actions actors *want* to perform (see Section 7)

---

## 2. The Action Framework

### 2.1 ActionTemplate Schema

```typescript
interface ActionTemplate {
  id: string;                    // unique slug, e.g. "create.found-settlement"
  name: string;                  // display name, e.g. "Found Settlement"
  crudType: "create" | "read" | "update" | "delete";
  domain: ActionDomain;
  durationRange: {               // how long this activity takes
    min: Duration;               // e.g. "weeks"
    max: Duration;               // e.g. "months"
  };
  scaleRange: ScaleLevel[];      // which view levels this action is visible at
  actorAffinity: ActorType[];    // which actor types naturally perform this
  graphSignature: GraphOp[];     // atomic graph operations this action performs
  narrativeTemplates: Record<ActorType, string>;  // prose per actor type
  prerequisites: Prerequisite[]; // what the actor needs (skills, resources, knowledge, edges)
  outcomes: {                    // possible results
    success: GraphOp[];
    failure: GraphOp[];          // "cool failure" — complications, not nothing
    critical: GraphOp[];         // exceptional success with bonus effects
  };
}
```

### 2.2 Action Domains

Eight domains, drawn from the recurring concerns of epic fantasy narrative:

| Domain | Description | Sphere Alignment |
|--------|-------------|-----------------|
| **Military** | Violence, defense, warfare, conquest | Force |
| **Economic** | Trade, resources, wealth, production | Matter |
| **Political** | Alliances, treaties, governance, succession | Mind, Spirit |
| **Magical** | Spells, rituals, enchantments, ley lines | Energy, Mind |
| **Social** | Reputation, culture, religion, movements | Spirit, Life |
| **Knowledge** | Lore, secrets, prophecy, intelligence | Mind, Time |
| **Geographic** | Terrain, structures, settlements, infrastructure | Matter, Force |
| **Spiritual** | Souls, afterlife, divine connection, corruption | Spirit, Entropy |

Domains are extensible — new domains can be added by creating new category nodes in the taxonomy.

The **Cosmological Taxonomy** influences action success: a world where the Creation Sphere of Force is dominant makes Military actions slightly easier; a world low in Spirit makes Spiritual actions harder. This is the subtle link between the metaphysical and the practical.

### 2.3 Scale Levels

Actions are presented based on the current camera/view level:

| Level | Scope | Example Actions |
|-------|-------|-----------------|
| **Cosmic** | World-spanning, divine | Cataclysm, Birth Champion, Terraform |
| **Regional** | Multi-hex, national | Raise Force, Establish Trade Route, Siege |
| **Local** | Single hex, settlement | Found Institution, Fortify, Consecrate Ground |
| **Personal** | Individual actor | Train, Assassinate, Research Lore |

### 2.4 Duration Model

Actions take real simulation time, reinforcing the epic scale:

| Duration | Real-world Feel | Examples |
|----------|----------------|----------|
| **Days** | Quick actions | Assess Threat, Read Intentions, Exile |
| **Weeks** | Short campaigns | Explore Territory, Negotiate, Probe Defenses |
| **Months** | Major undertakings | Establish Trade Route, Siege, Research Lore |
| **A Season** | Transformative efforts | Craft Artifact, Terraform, Raise Force |

---

## 3. Actor Types as a Network

### 3.1 Actor Type Categories

Six actor types, defined as **node categories in the graph**, not a hierarchy:

| Type | Description | Natural Scale | Narrative Voice |
|------|-------------|---------------|-----------------|
| **God / Primordial** | Cosmic entities, Creation Sphere avatars | Cosmic → Regional | Creation myths, divine edicts |
| **Ascendant / Demigod** | Player-like agents, subtle manipulators | Regional → Local | Intervention, rivalry, hidden hands |
| **Faction / Organization** | Institutions with doctrine and structure | Regional → Local | Ambition, doctrine, expansion |
| **Tribe / Culture / Nation** | Peoples with shared identity and territory | Regional | Civilizational momentum, migration |
| **Group / Party** | Small bands with shared purpose | Local → Personal | Adventure arcs, fellowship |
| **Individual** | Single persons, heroes, villains | Local → Personal | Personal destiny, moral dilemma |

### 3.2 Network Relationships Between Actor Types

Actor types connect through typed edges. These are not hierarchical — any actor can relate to any other:

**Containment / Membership (natural but not mandatory):**
- Individual ←`member_of`→ Group
- Individual ←`citizen_of`→ Culture/Nation
- Individual ←`member_of`→ Faction
- Group ←`operates_within`→ Culture/Nation
- Group ←`serves`→ Faction
- Faction ←`rooted_in`→ Culture/Nation
- Culture ←`worships`→ God

**Leadership / Authority (individuals can punch above their scale):**
- Individual ←`leads`→ Group
- Individual ←`rules`→ Culture/Nation
- Individual ←`leads`→ Faction
- Ascendant ←`champions`→ Individual
- God ←`empowers`→ Ascendant

**Cross-type influence (the messy, story-generating connections):**
- God ←`blesses`/`curses`→ *any actor type*
- Ascendant ←`nudges`→ *any actor type* (the player's channel)
- Individual ←`inspires`/`corrupts`→ Group, Faction, Culture (a hero's deeds ripple upward)
- Faction ←`rivals`→ Faction
- Faction ←`infiltrates`→ Culture/Nation
- Culture ←`assimilates`/`resists`→ Culture
- Group ←`defects_from`→ Faction

**Key principle:** Scale is a property, not a constraint. A peasant *could* attempt "Overthrow a Kingdom" — it's just that without the right edges (allies, resources, divine backing), the probability is near zero. But if that peasant has built `inspires → rebel group → allies_with → rival faction → supported_by → Ascendant`, now you have a revolution. Every intermediate edge was itself a CRUD action.

### 3.3 Example Actors (20+)

**Gods (T1):** Solaris (Energy/Light), The Earthshaper (Matter/Force), The Dreaming One (Mind/Spirit), The Entropy Wyrm (Entropy/Time)

**Ascendants (T2):** The Weaver (Shadow/Cunning), The Butcher (Death/Ruthlessness), The Hierophant (Order/Stasis), The Player's Ascendant

**Factions (T3):** The Iron Church (Spirit-militant religion), The Merchant League (Economic guild network), The Shadow Court (Political espionage ring), The Arcane Collegium (Magical research institution), The Green Wardens (Life-focused druidic order)

**Cultures (T4):** The Dwarven Holds (Matter/Economic, mountain civilization), The Nomad Clans (Force/Freedom, steppe peoples), The Tidal Elves (Time/Spiritual, coastal ancients), The Ember Kingdoms (Energy/Military, volcanic humans)

**Groups (T5):** The Silver Company (mercenary band), A merchant caravan, A temple missionary expedition, A bandit warband, A questing fellowship

**Individuals (T6):** Kael the Exiled Knight (Military/Courage), Whisper the Spy (Knowledge/Cunning), Elder Miriam the Healer (Life/Mercy), Thane Volkar the Warlord (Force/Ambition), Lyra the Artificer (Matter+Mind/Novelty)

---

## 4. The Action Catalog

### 4.1 Atomic Graph Operations

Every action decomposes into combinations of these primitives:

```typescript
type GraphOp =
  | { op: "CREATE_NODE"; type: string; properties: Record<string, any> }
  | { op: "CREATE_EDGE"; source: string; target: string; type: string; properties?: Record<string, any> }
  | { op: "READ_NODE"; query: NodeQuery }
  | { op: "READ_EDGES"; query: EdgeQuery }
  | { op: "UPDATE_NODE"; id: string; changes: Record<string, any> }
  | { op: "UPDATE_EDGE"; id: string; changes: Record<string, any> }
  | { op: "DELETE_NODE"; id: string }
  | { op: "DELETE_EDGE"; id: string };
```

### 4.2 CREATE — Acts of Genesis

| # | Action | Domain | Duration | Graph Signature | Narrative Examples |
|---|--------|--------|----------|----------------|-------------------|
| 1 | **Found Settlement** | Geographic | Weeks–Months | `CREATE_NODE(settlement)` + `CREATE_EDGE(founder→settlement, "founded")` + `CREATE_EDGE(settlement→hex, "located_at")` | God: "Shape a sacred city from living coral." Culture: "The nomad clans settle at the river confluence." Individual: "A pioneer builds a homestead in the wilderness." |
| 2 | **Forge Alliance** | Political | Days–Weeks | `CREATE_EDGE(actor_a→actor_b, "allied_with", {terms, strength})` | God: "Ordain a covenant in fire." Culture: "The dwarves and elves sign the Iron Accord." Group: "Two mercenary bands swear to fight as one." |
| 3 | **Raise Force** | Military | Weeks–Season | `CREATE_NODE(military_group)` + `CREATE_EDGE(actor→group, "commands")` + `CREATE_EDGE(group→location, "stationed_at")` | God: "Forge a warrior race from volcanic stone." Culture: "The Ember Kingdoms call the banners." Individual: "A veteran rallies outcasts into a warband." |
| 4 | **Establish Trade Route** | Economic | Weeks–Months | `CREATE_EDGE(settlement_a→settlement_b, "trades_with")` + `UPDATE_NODE(both settlements, {trade_income += X})` | God: "Bless the sea lanes." Culture: "Caravans begin crossing the Glass Desert." Faction: "The Merchant League opens a new corridor." |
| 5 | **Found Institution** | Social | Months–Season | `CREATE_NODE(faction)` + `CREATE_EDGE(founder→faction, "leads")` + `CREATE_EDGE(faction→location, "headquartered_at")` | God: "Inspire a new order through divine dreams." Culture: "A university rises in the capital." Individual: "A disgraced noble creates a secret society." |
| 6 | **Craft Artifact** | Magical | Season | `CREATE_NODE(artifact)` + `CREATE_EDGE(creator→artifact, "crafted")` | God: "Breathe cosmic power into a relic." Faction: "The Collegium creates a ward-stone." Individual: "A smith forges a blade that sings at the volcano's heart." |
| 7 | **Compose Prophecy** | Knowledge | Days–Months | `CREATE_NODE(prophecy)` + `CREATE_EDGE(author→prophecy, "authored")` + `CREATE_EDGE(prophecy→targets, "concerns")` | God: "Speak prophecy into every seer's dreams." Faction: "The Collegium codifies a new magical discipline." Individual: "A dying oracle inscribes words that shape generations." |
| 8 | **Consecrate Ground** | Spiritual | Weeks–Months | `CREATE_NODE(holy_site)` + `CREATE_EDGE(holy_site→hex, "sanctifies")` + `UPDATE_NODE(hex, {spiritual_saturation += X})` | God: "Sanctify a peak as hallowed ground." Faction: "The Iron Church consecrates a cathedral." Individual: "A hermit meditates for months, creating a place of power." |
| 9 | **Pioneer Cultivation** | Geographic/Life | Season | `CREATE_NODE(resource)` + `CREATE_EDGE(resource→hex, "grows_at")` | God: "Dream a new species into existence." Culture: "Selective breeding produces an unmatched warhorse." Individual: "A druid nurtures a grove of whispering trees." |
| 10 | **Open Gateway** | Magical | Days–Months | `CREATE_EDGE(location_a→location_b, "gateway", {stability, cost})` | God: "Tear a rift between planes." Ascendant: "Thin the veil at a place of power." Individual: "A wizard folds space between standing stones." |
| 11 | **Spawn Anomaly** | Magical/Spiritual | Varies | `CREATE_NODE(anomaly)` + `UPDATE_NODE(hex, {magical_saturation, terrain_modifier})` | God: "Divine grief warps reality — the Weeping Marsh appears." Culture: "Centuries of necromancy saturate the swamp." Ascendant: "The Butcher's corruption spawns a Blighted Grove." |
| 12 | **Birth Champion** | Spiritual/Social | Instant–Months | `CREATE_NODE(individual, {special_properties})` + `CREATE_EDGE(patron→individual, "champions")` | God: "Incarnate an aspect as a mortal." Culture: "A child of prophecy is born." Faction: "The order trains a candidate for the rite of ascension." |

### 4.3 READ — Acts of Revelation

| # | Action | Domain | Duration | Graph Signature | Narrative Examples |
|---|--------|--------|----------|----------------|-------------------|
| 1 | **Explore Territory** | Geographic | Days–Weeks | `READ_NODE(hexes in range)` → reveal hidden properties + `CREATE_EDGE(actor→hex, "explored")` | Culture: "Scouts push beyond the frontier." Group: "The fellowship ventures into uncharted ruins." Individual: "A ranger maps the northern wastes." |
| 2 | **Gather Intelligence** | Knowledge/Political | Days–Months | `READ_NODE(target_actor)` → reveal hidden stats, plans, edges | Ascendant: "Pierce the veil to witness a crisis." Faction: "The Shadow Court's spies report troop movements." Individual: "A spy infiltrates the enemy court." |
| 3 | **Perform Divination** | Spiritual/Knowledge | Days | `READ_NODE(future_events)` → reveal upcoming simulation events | God: "Gaze across branching timelines." Faction: "Twelve mages perform a great augury." Individual: "A seer enters a death-trance to read fate." |
| 4 | **Survey Resources** | Economic | Days–Weeks | `READ_NODE(hex, "economic_properties")` → reveal resource nodes | Culture: "Prospectors find mithril in the hills." Faction: "The Merchant League assesses a new market." Group: "Miners explore a cave system for gems." |
| 5 | **Assess Threat** | Military | Days | `READ_NODE(military_group, "strength, composition")` | Culture: "Border watchers report the horde is ten times larger." Faction: "Templars scout the undead incursion." Individual: "A veteran reads strategy in the enemy's camp layout." |
| 6 | **Research Lore** | Knowledge | Weeks–Season | `READ_NODE(knowledge)` → unlock knowledge node + `CREATE_EDGE(actor→knowledge, "knows")` | Faction: "The Collegium deciphers a codex that rewrites history." Group: "The fellowship puzzles over dungeon inscriptions." Individual: "A scholar spends months in the grand library." |
| 7 | **Sense Magic** | Magical | Days–Weeks | `READ_NODE(hex, "magical_properties")` → reveal ley lines, anomalies | God: "Feel a disturbance in the cosmic weave." Faction: "The Wardens commune with the forest." Individual: "A mage traces a ley line to its source." |
| 8 | **Read Intentions** | Social/Political | Days | `READ_NODE(actor, "axiological_profile, goals")` | Ascendant: "Peer into a soul's war between duty and desire." Faction: "Diplomats gauge the rival king's true goals." Individual: "A courtier senses the assassination plot." |
| 9 | **Commune with Dead** | Spiritual | Days–Weeks | `READ_NODE(echo_layer)` → access L3 historical data | God: "Consult memories of fallen civilizations." Faction: "Shamans contact ancestral spirits." Individual: "A medium channels the ghost of a murdered king." |
| 10 | **Map Power Network** | Knowledge/Political | Weeks–Months | `READ_EDGES(political, economic, military in region)` → reveal hidden relationships | Ascendant: "See the entire web of alliances and debts." Faction: "The Shadow Court maps the true power structure." Individual: "A courtier untangles who owes whom." |
| 11 | **Probe Defenses** | Military/Knowledge | Days–Weeks | `READ_NODE(settlement, "defensive_properties")` | Culture: "Probing raids test garrison strength." Group: "Scouts test the dungeon's outer wards." Individual: "A thief cases the fortress for a week." |
| 12 | **Detect Influence** | Spiritual/Magical | Days | `READ_EDGES(divine_nudge, ascendant_thread)` → reveal hidden manipulation | God: "Sense another god's fingerprints on a mortal's fate." Faction: "Inquisitors investigate suspicious miracles." Individual: "A skeptic notices improbable 'lucky' events." |

**Architectural note:** READ actions create `knows_about` edges. This enables the constraint system: you can't Update what you haven't Read. Knowledge is itself a graph resource.

### 4.4 UPDATE — Acts of Transformation

| # | Action | Domain | Duration | Graph Signature | Narrative Examples |
|---|--------|--------|----------|----------------|-------------------|
| 1 | **Train / Improve** | Military/Knowledge | Weeks–Season | `UPDATE_NODE(actor, {stats, skills})` | Culture: "A generation adopts a new fighting style." Faction: "The Collegium runs advanced training." Individual: "A warrior trains under a legendary master." |
| 2 | **Enchant / Bless / Curse** | Magical/Spiritual | Days–Months | `UPDATE_NODE(target, {magical_properties})` + `CREATE_EDGE(caster→target, "enchanted_by")` | God: "Bless the harvest across a kingdom." Ascendant: "Curse a rival's champion with paranoia." Individual: "A witch curses a noble bloodline." |
| 3 | **Negotiate / Persuade** | Political | Days–Weeks | `UPDATE_EDGE(relationship, {weight, terms})` | Culture: "Envoys renegotiate the border treaty." Faction: "The Church pressures the crown to outlaw rivals." Individual: "A diplomat delays the invasion by a month." |
| 4 | **Trade / Exchange** | Economic | Days–Months | `UPDATE_NODE(actor_a, {resources})` + `UPDATE_NODE(actor_b, {resources})` | Culture: "The annual trade fair redistributes wealth." Faction: "The League renegotiates terms." Group: "A caravan exchanges spices for iron." |
| 5 | **Fortify / Prepare** | Military/Geographic | Weeks–Season | `UPDATE_NODE(location, {defenses, garrison})` | Culture: "Build a great wall along the border." Faction: "Transform the cathedral into a fortress." Individual: "A veteran sets traps and kill zones." |
| 6 | **Corrupt / Purify** | Spiritual | Weeks–Season | `UPDATE_NODE(location, {spiritual_alignment, corruption})` | God: "Withdraw blessing, letting darkness seep in." Faction: "The Wardens perform a season-long purification." Individual: "A paladin cleanses a desecrated temple." |
| 7 | **Reform / Restructure** | Political/Social | Months–Season | `UPDATE_NODE(faction, {governance, structure})` | Culture: "Adopt a new legal code freeing the serfs." Faction: "Reorganize into hidden cells after a purge." Individual: "A queen abolishes trial by combat." |
| 8 | **Inspire / Demoralize** | Social | Days–Weeks | `UPDATE_NODE(actors, {morale, axiological_values})` | God: "Send a vision of hope to a besieged city." Culture: "A great victory restores national pride." Individual: "A bard's song rallies the defenders." |
| 9 | **Terraform / Reshape** | Geographic | Season–Years | `UPDATE_NODE(hex, {elevation, moisture, terrain_type})` | God: "Raise a mountain range." Ascendant: "Shift weather patterns toward drought." Culture: "Centuries of irrigation transform desert to farmland." |
| 10 | **Convert / Proselytize** | Spiritual/Social | Weeks–Season | `UPDATE_NODE(settlement, {religion})` + `CREATE_EDGE(faction→settlement, "converted")` | God: "Manifest miracles to win followers." Faction: "The Church sends missionaries continent-wide." Individual: "A prophet preaches radical doctrine." |
| 11 | **Siege / Blockade** | Military/Economic | Weeks–Months | `UPDATE_NODE(target, {supply, morale, condition})` + `UPDATE_EDGE(trade_routes, {blocked})` | Culture: "The navy blockades enemy ports." Faction: "The army besieges the rebel fortress." Group: "Bandits control the mountain pass." |
| 12 | **Evolve / Mutate** | Magical/Life | Season–Years | `UPDATE_NODE(species, {traits, abilities})` | God: "Reshape a species for a colder world." Culture: "Magical exposure changes the mountain people." Ascendant: "The Butcher warps wildlife into twisted predators." |

### 4.5 DELETE — Acts of Ending

| # | Action | Domain | Duration | Graph Signature | Narrative Examples |
|---|--------|--------|----------|----------------|-------------------|
| 1 | **Conquer / Raze** | Military/Geographic | Weeks–Months | `DELETE_NODE(settlement)` or `UPDATE_NODE(settlement, {condition: "ruins"})` + cascade `DELETE_EDGE(trade, political edges)` | God: "Smite a city — nothing remains but salt." Culture: "The horde leaves ashes." Faction: "Crusaders sack the heretic stronghold." |
| 2 | **Assassinate / Slay** | Military/Political | Days–Weeks | `DELETE_NODE(individual)` + cascade effects on led groups/factions | Ascendant: "Arrange a fatal 'accident'." Faction: "The Shadow Court poisons the ambassador." Individual: "A hero faces the dragon." |
| 3 | **Sever Alliance** | Political | Days–Months | `DELETE_EDGE(alliance)` + `UPDATE_NODE(parties, {trust, hostility})` | God: "Send conflicting visions to sow distrust." Culture: "A massacre shatters the peace." Individual: "A betrayer reveals shared secrets." |
| 4 | **Disrupt Trade** | Economic | Days–Months | `DELETE_EDGE(trade_route)` + `UPDATE_NODE(settlements, {trade_income -= X})` | Culture: "State-sponsored pirates choke the lanes." Faction: "The League embargoes the rebellious city." Group: "Bandits raid caravans." |
| 5 | **Desecrate / Profane** | Spiritual | Days–Weeks | `DELETE_NODE(holy_site)` or `UPDATE_NODE(holy_site, {corrupted})` + `DELETE_EDGE(divine_blessing)` | God: "Withdraw presence — the temple goes dark." Faction: "Heretics defile the sacred grove." Individual: "A necromancer desecrates burial ground." |
| 6 | **Suppress Knowledge** | Knowledge | Weeks–Months | `DELETE_NODE(knowledge)` or `DELETE_EDGE(knows_about)` | Culture: "The regime orders the library burned." Faction: "The Collegium bricks up dangerous research." Individual: "An assassin kills the last speaker of an ancient tongue." |
| 7 | **Exile / Banish** | Political/Social | Days | `DELETE_EDGE(member_of, citizen_of)` + `UPDATE_NODE(actor, {location})` | God: "Cast out a fallen champion." Culture: "The council exiles dissenting clans." Individual: "A king banishes his brother." |
| 8 | **Dissolve Organization** | Social/Political | Weeks–Months | `DELETE_NODE(faction)` + cascade `DELETE_EDGE(membership, leadership)` | God: "Withdraw patronage." Culture: "Revolution disbands the noble houses." Faction: "Schism tears the order apart." |
| 9 | **Dispel / Unmake** | Magical | Days–Weeks | `DELETE_NODE(enchantment)` + `DELETE_EDGE(magical connections)` | God: "Seal a rift with a word." Faction: "The Collegium unravels an ancient enchantment." Individual: "A mage sacrifices years to break the curse." |
| 10 | **Cataclysm** | Geographic | Days–Season | `DELETE_NODE(settlements in area)` + `UPDATE_NODE(hexes, {terrain: devastated})` | God: "Sink the island empire in a night." Ascendant: "Trigger a volcanic eruption." |
| 11 | **Extinguish Bloodline** | Social/Spiritual | Months–Years | Series of `DELETE_NODE(individual)` targeting lineage + `DELETE_EDGE(bloodline)` | Ascendant: "Engineer the end of a prophesied line across decades." Faction: "The Shadow Court eliminates the heirs." Individual: "The last heir falls." |
| 12 | **Sever Ley Line** | Magical | Weeks–Months | `DELETE_EDGE(ley_line)` + `UPDATE_NODE(hexes, {magical_saturation -= X})` | God: "Rearrange cosmic energy flow." Faction: "The Collegium redirects a ley line." Individual: "A wizard cuts the line, knowing the backlash may kill her." |

---

## 5. Scalability Analysis

### 5.1 Why This Architecture Scales

- **48 action templates** decompose into at most 3–5 atomic graph operations each
- Adding a new actor type requires only writing narrative templates — graph signatures stay the same
- Adding a new action requires defining one template with one graph signature — it automatically works for all actor types
- Compound activities (a war, a crusade, a golden age) are sequences of atomic actions triggered by the AI's goal-selection engine — no special compound action system needed

### 5.2 Taxonomy Integration

Action templates can be stored as nodes in the cosmological taxonomy graph:
- Category: `"action-template"`
- Edges: `draws_from` → Creation Spheres (determining cosmological influence on success)
- Edges: `affinity` → Actor types (determining which actors naturally use this action)
- This makes the action library itself queryable, filterable, and extensible through the same tools used for the rest of the taxonomy

---

## 6. UI Integration: View-Level Filtering

When the player observes the world at different camera levels, the action system filters to show relevant activity:

| View Level | What You See | Relevant Actions |
|------------|-------------|-----------------|
| **Map (Hex)** | Civilizations, trade routes, wars | Raise Force, Establish Trade Route, Conquer/Raze, Cataclysm, Terraform |
| **Area (Multi-hex)** | Regional politics, faction moves | Forge Alliance, Siege, Convert, Reform, Explore Territory |
| **Location (Site)** | Local events, buildings, groups | Found Institution, Fortify, Consecrate, Trade/Exchange |
| **Agent (Individual)** | Personal arcs, skill use, decisions | Train, Assassinate, Research Lore, Craft Artifact |

The Coincidence Deck's three hands (Macro, Location, Micro) map directly to these levels — the player's cards are CRUD actions applied through the "divine nudge" channel.

---

## 7. Connection to Motivation Engine

The action system serves a dual purpose:

1. **AI autonomy:** Actors autonomously select and execute actions based on their axiological profiles
2. **Player influence menu:** The player sees which actions an agent is *motivated* to perform, and can spend **Influence Essence** to nudge, amplify, or unlock specific actions from that filtered list

This means the axiological engine is the **bridge** between the action catalog and the player experience. The motivation filter determines what the player sees as "available to buy."

### 7.1 How Motivations Filter Actions

The axiological engine (10 value pairs) determines which actions an actor is inclined toward:

- **Mercy vs. Ruthlessness** → Filters DELETE actions. A Merciful actor's action menu hides Assassinate, Raze, Extinguish Bloodline. A Ruthless actor sees these prominently.
- **Courage vs. Prudence** → Influences risk tolerance. Courageous actors show high-risk/high-reward actions. Prudent actors show safe, incremental actions.
- **Honesty vs. Cunning** → Filters READ and Political actions. Honest actors show direct Negotiate; Cunning actors show Gather Intelligence, Infiltrate.
- **Loyalty vs. Ambition** → Filters CREATE and Political actions. Loyal actors show "strengthen existing" (UPDATE); Ambitious actors show "found new / sever old" (CREATE/DELETE).
- **Tradition vs. Novelty** → Influences Reform, Pioneer, Open Gateway. Traditional actors resist structural change; Novel actors seek it.
- **Stoicism vs. Passion** → Influences Inspire/Demoralize and Social actions. Stoic actors show measured diplomatic actions; Passionate actors show dramatic gestures.
- **Asceticism vs. Extravagance** → Filters Economic actions. Ascetic actors show spiritual and knowledge pursuits; Extravagant actors show trade, build, craft.
- **Humility vs. Pride** → Influences scale of ambition. Humble actors show local actions; Proud actors show grand, regional actions.
- **Frankness vs. Propriety** → Filters Social and Political actions. Frank actors show direct confrontation; Proper actors show formal diplomatic channels.
- **Sacrifice vs. Survival** → Influences willingness to attempt costly actions. Sacrificial actors show dangerous actions with high costs; Survival-focused actors avoid them.

### 7.2 The Player Influence Loop

```
1. Player selects an actor at any view level (map, area, location, agent)
2. System computes the actor's motivated action list:
   a. Start with all 48 action templates
   b. Filter by actor's skills, resources, knowledge, range
   c. Score remaining actions against axiological profile
   d. Rank by motivation score → present as the "action menu"
3. Player sees ranked list of actions the actor is inclined toward
4. Player spends Influence Essence to:
   a. NUDGE: Increase probability of an already-motivated action (cheap)
   b. AMPLIFY: Boost an action the actor is mildly interested in (moderate)
   c. FORCE: Push an action the actor wouldn't naturally choose (expensive, risks detection)
   d. BLOCK: Prevent an action the actor wants to take (moderate, risks detection)
5. The more aligned the nudge is with the actor's values, the cheaper it is
6. Unaligned nudges cost more Essence AND raise the actor's Divine Awareness
```

This creates a natural tension: the player wants to work *with* an actor's personality (cheap, subtle) vs. *against* it (expensive, risky, potentially revealing). This connects directly to the Stealth mechanics and the rival Ascendant detection system.

### 7.3 The Autonomous Selection Algorithm (To Be Designed)

```
For each actor, each tick:
  1. Compute W_active for all 10 axiological values (including any divine nudge D_n)
  2. Generate candidate actions from available templates (filtered by skills, resources, knowledge, range)
  3. Score each candidate: H = sum(W_active * action.axiological_alignment)
  4. Apply domain modifiers from cosmological sphere weights
  5. Select highest-scoring action (with randomness for narrative variety)
  6. Resolve: P = relevant_stat * difficulty_modifier (d100 roll)
  7. Apply graph operations from success/failure/critical outcomes
  8. Generate narrative prose via lexicon template
```

### 7.4 Open Questions for Future Design

- How does the action economy work? (Action points? Opportunity-based? Resource-constrained?)
- How do contested actions resolve? (Two factions Update the same city's allegiance simultaneously)
- How does the "cool failure" model generate Complication Nodes from failed actions?
- What is the exact Influence Essence cost formula for nudge/amplify/force/block?
- What is the tick/turn structure for actor decision-making?
- How does Divine Awareness interact with the nudge cost model?

---

## 8. Next Steps

1. **Motivation Engine Design** — Brainstorm the connection between axiological profiles and action selection (Section 7)
2. **Action Data Files** — Create `src/data/taxonomy/action-templates.json` with all 48 templates as taxonomy nodes
3. **Graph Engine** — Implement the atomic graph operations as a transaction system
4. **Action Resolution** — Implement the success/failure/critical outcome pipeline
5. **UI Integration** — Wire action visibility to camera zoom level and actor selection
