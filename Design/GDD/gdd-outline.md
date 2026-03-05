# The Fantasy World Simulator - Game Design Document

## 1. Overview
- **Title:** The Fantasy World Simulator
- **Genre:** Systemic "God-Game" / Rogue-lite Simulation
- **Platform:** Web (Browser-based)
- **Tech Stack:** React + TypeScript, Vite, SVG rendering, Tailwind CSS
- **Status:** Active development — MVP hex map implemented, 9+ system designs approved (incl. Nine Reaches domain system, species profiles, hybrid iconography)

## 2. Vision Statement

FantasyWorld is a systemic world-building simulation that prioritizes the "poetry of emergence" over mechanical dominance. Players act as a **Weaver of Fate**, a minor deity tasked with fulfilling a cosmic mandate. Direct power is dangerous — players must nudge history through subtle coincidences, managing autonomous agents they do not fully control while remaining hidden from all-powerful Rival Ascendants.

The core fantasy: *You are not the hero. You are the architect of heroes.* The player experiences the world as a living system where every choice ripples outward unpredictably, where intervention carries risk, and where the most satisfying victories are those earned through patient observation and subtle manipulation.

## 3. Core Pillars

1. **The Invisible Hand ("Godly Poker")** — Deciding whether to intervene carries detection risk. Players manage uncertainty and consequence, not omnipotence.
2. **Anti-Spreadsheet Immersion** — Verbal and visual experience prioritized over numerical bloat. The game feels like a living novel, not a simulator spreadsheet.
3. **Cosmic Melancholy** — Cyclic Unmaking and curation of Echoes that survive cosmic fire. Beauty in transience and meaningful loss.
4. **The Sand Castle Spite** — Psychological rivalry with Rival Ascendants through indirect value manipulation and emergence exploitation.
5. **The Weight of the Threads** — Patient observation of autonomous agents who believe their choices are their own. Nudging, not controlling.

## 4. Core Mechanics (Designed & Documented)

### 4.1 World Graph
The foundational data structure: a self-describing property graph where **nodes represent entities** (gods, factions, places, artifacts) and **edges represent relationships** (rules, alliances, enmities, influences).

Five graph layers organize emergence by scale:
- **L1: World-Soul** — Cosmic entities and universal forces
- **L2: Divine** — Gods and supreme beings
- **L3: Faction** — Organizations, cultures, societies
- **L4: Group** — Settlements, armies, organizations within factions
- **L5: Object** — Individual characters, items, locations, events

*See Obsidian vault (~150 files) for visual graph structure and relationship ontology.*

### 4.2 Cosmology & Spheres
The metaphysical foundation of all creation and influence.

**Foundation Spheres (4):** Chaos, Darkness, Light, Shadow — primordial forces
**Creation Spheres (8):** Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy — emergent aspects of being

Spheres have **amplification and suppression relationships** that influence all actions and magic. The player's influence essence is typed by sphere, creating asymmetric power structures.

*See Notion design pages for sphere relationship matrices and cosmological mechanics.*

### 4.3 CRUD Action System & The Nine Reaches (Action Domains)
48 action templates organized across **9 domains** called **The Nine Reaches**:

| Domain | Color | Scope | Examples |
|--------|-------|-------|---------|
| **Iron** (force/war) | Steel Red #c45c5c | Military action, physical dominance | Attack, Defend, Conquer, Fortify |
| **Gold** (wealth/trade) | Amber Gold #c4a535 | Economic action, resource management | Trade, Tax, Monopolize, Embargo |
| **Shadow** (intrigue) | Deep Purple #7b5ea7 | Covert action, manipulation | Spy, Assassinate, Sabotage, Deceive |
| **Veil** (magic/arcane) | Mystic Teal #4a9b8e | Magical action, supernatural effects | Enchant, Summon, Ward, Dispel |
| **Heart** (bonds/loyalty) | Warm Rose #c47a7a | Social bonds, loyalty, morale | Rally, Inspire, Betray, Negotiate |
| **Eye** (knowledge) | Silver Blue #6a8fb5 | Information, research, discovery | Scout, Research, Decode, Teach |
| **Stone** (territory/place) | Earth Brown #8b7d6b | Geographic, territorial, structural | Build, Claim, Terraform, Excavate |
| **Star** (faith/divine) | Celestial Gold #b8a04a | Religious, spiritual, cosmic | Pray, Consecrate, Prophesy, Convert |
| **Flesh** (body/physical) | Living Copper #b07850 | Physical capability, health, craft | Heal, Train, Craft, Endure |

**Design philosophy — "D under the hood, C on screen":** Actors don't store domain scores as stats. Instead, the system walks the actor's trait graph at resolution time to compute a domain capability score. The UI displays this computed score using 5-tier narrative descriptors (Feeble → Modest → Capable → Formidable → Legendary), never raw numbers.

**Domains scale across all actor types:** Iron means "military force" for a kingdom, "physical combat" for an individual, and "cosmic dominion" for a god. The same nine categories organize all action at every graph layer.

Each action is:
- **Domain-typed** (effects vary by actor's nature and domain capability)
- **Sphere-typed** (uses typed Influence Essence)
- **Probability-modifiable** (via Dream Interface)
- **Consequence-bearing** (temporal, relational, reputation cascades)

Actions are executed by autonomous actors (Gods, Ascendants, Factions, Cultures, Groups, Individuals) on daily ticks based on their intentions and available AP.

*See `Design/domain-exploration.html` for interactive domain visualization. Implementation plans: /Docs/plans/ directory. Notion backlog: detailed action sequencing and consequence systems.*

### 4.3.1 Species Domain Profiles (Origin Traits)
**Decision locked 2026-03-04.** Rather than a separate "nature" domain, ecological and natural capability emerges from **species domain profiles** — innate domain affinities carried by different being types as origin traits.

Each species/being type has a characteristic domain profile:
- **Dwarves:** Iron ●●●● / Gold ●●●● / Stone ●●●●● (martial, mercantile, territorial)
- **Elves:** Eye ●●●● / Veil ●●●● / Flesh ●●● (perceptive, magical, graceful)
- **Humans:** Flat profile, ●●–●●● across all domains (adaptable generalists)
- **Dragons:** Iron ●●●●● / Veil ●●●●● / Eye ●●●● (nearly everything except Heart)
- **Fey:** Veil ●●●●● / Heart ●●●● / Shadow ●●● (magical, bond-weaving, trickster)
- **Treants:** Stone ●●●●● / Star ●●●● / Heart ●●● (rooted, ancient faith, communal)

**Key insight — nature emerges from inhabitants, not labels:** A forest hex doesn't need a "nature score." Its aggregate domain profile is computed from what lives there — wood elves bring Eye/Veil, treants bring Stone/Star, wolf packs bring Flesh/Heart. Burn the forest, scatter the fey, and the Veil collapses. The hex's "nature" is dynamic, not a static label.

*See `Design/domain-exploration.html` sections on species profiles and "The Proof" for worked hex examples.*

### 4.3.2 Domain Iconography & Cultural Naming
**Decision locked 2026-03-04.** Domains use a **hybrid icon system** (Approach C): each domain has a unique geometric frame shape containing a simplified pictographic element.

- At small sizes (16–24px), the frame silhouette alone identifies the domain
- At large sizes (36–64px), the inner element adds detail
- Icons and colors are the **cosmological constant** — they never change

**Cultural naming:** Every mortal culture names the same nine domains differently based on their values. The game engine uses canonical IDs; the UI renders culture-specific labels. Example: dwarves call Shadow "Soft-Tongue" (derogatory); goblins call Star "Shiny" (confused with Gold). Naming differences ARE worldbuilding.

*See `Design/domain-iconography.html` for icon prototypes and six cultural naming sets. See Notion Inspiration Board §6 for full decision rationale.*

### 4.4 Trait System
Six trait categories capture actor state and evolution:

1. **Innate** — Unchangeable nature (bloodline, species, class)
2. **Mastery** — Learned skills and expertise
3. **Reputation** — How others perceive them
4. **Scar** — Permanent trauma or change
5. **Condition** — Temporary states (blessed, cursed, diseased)
6. **Destiny** — Fated outcomes and narrative arcs

Each trait has **4 effect types**: Mechanical (% bonuses), Cognitive (preference shifts), Social (relationship modifiers), Narrative (flavor and emergence hooks).

### 4.5 Turn Economy
Time progression balances simulation depth with player perception:

- **Daily ticks** drive all actor behavior
- **AP (Action Points) by actor type:**
  - God: 1 AP/day
  - Ascendant: 1–2 AP/day
  - Faction: 2–3 AP/day
  - Culture: 1 AP/day
  - Group: 3–5 AP/day
  - Individual: 1 AP/day
- **Momentum model** — Actions queue and compound across turns
- **Paradox-style speed controls** — Players control timeline velocity (pause, 1x, 2x, 4x, 8x)

### 4.6 Player Influence System
The primary lever of godly power:

**Dream Interface:** Players see actor intentions before they act, can manipulate probability of outcomes, and plant suggestions without direct command.

**Influence Essence:** Sphere-typed currency (Chaos, Darkness, Light, Shadow, Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy). Spending essence on an action increases its likelihood of success. Detection risk scales with magnitude.

**Influence Tiers (5):**
1. Whisper (0–5% detection risk)
2. Nudge (5–15% detection risk)
3. Intervention (15–35% detection risk)
4. Manipulation (35–60% detection risk)
5. Domination (60%+ detection risk, alerts Rival Ascendants)

High tiers risk detection by Rival Ascendants, triggering counterplay and story escalation.

### 4.7 Performance Scaling ("Spotlight Model")
Manages simulation complexity by varying fidelity across actors:

**Fidelity Tiers:**
- **Full:** Detailed intention rolls, multi-step cascades, trait interactions
- **Standard:** Simplified rolls, single-step effects, basic trait application
- **Background:** Deterministic outcomes based on aggregate statistics
- **Statistical:** Pure numerical abstraction (no individual representation)

Spotlight tracks which actors are "in focus" (Full fidelity) and automatically downgrades distant/irrelevant actors. This allows for seamless world simulation at arbitrary scale.

### 4.8 Terrain Generation
Procedurally generates 22 biome types across 6 categories (Water, Lowlands, Forest, Wet, Elevated, Extreme).

Pipeline: Elevation → Temperature → Moisture → **Whittaker biome classification** with cosmological bias (sphere influence creates regional variation).

*See implementation plan for noise functions, elevation models, and cosmological sampling.*

## 5. World Systems (Designed)

### 5.1 Terrain & Biomes
**22 biome types** organized into 6 categories:

- **Water (3):** Tropical Reef, Temperate Ocean, Polar Sea
- **Lowlands (4):** Tropical Grassland, Temperate Grassland, Savanna, Desert
- **Forest (3):** Tropical Rainforest, Temperate Forest, Taiga
- **Wet (3):** Tropical Wetland, Temperate Wetland, Tundra Wetland
- **Elevated (5):** Highlands, Alpine Meadow, Alpine Desert, Badlands, Peak
- **Extreme (4):** Volcanic, Geothermal, Crystalline, Void-Touched

Each biome has:
- **Ecological traits** (flora, fauna, climate patterns)
- **Cultural resonance** (which cultures thrive here)
- **Magical saturation** (sphere distribution)
- **Resource distribution** (rare materials, power sites)

### 5.2 Cosmology & Spheres
**4 Foundation + 8 Creation Spheres** define the metaphysical fabric.

- **Amplification relationships:** Pairs that reinforce each other's effects
- **Suppression relationships:** Opposing pairs that weaken each other
- **Cascade rules:** How sphere influence spreads through the graph

Regional sphere distribution (cosmological bias) makes certain actions more/less effective by location. A stronghold in a Light-dominant region may favor healing and protection magic, while a Dark stronghold amplifies stealth and necromancy.

*See Notion cosmology board for relationship matrices and visualization.*

### 5.3 Magic System
**32+ magical traditions** across 4 schools:

- **Elemental** — Force, Matter, Energy manipulation
- **Nature** — Life, Growth, Ecosystem integration
- **Spiritual** — Mind, Spirit, Connection across boundaries
- **Abstract** — Time, Entropy, Narrative and paradox magic

Each tradition:
- Has a **sphere type** (determines Influence Essence cost)
- Requires **cultural or personal mastery traits**
- Scales with regional sphere saturation
- Can trigger unintended consequences (Paradox, Cascades)

*Design discovery in progress. See Notion backlog for full tradition mechanics.*

## 6. Actor Types & Motivation

Six canonical actor types, each with distinct:
- **AP allocation** (daily actions available)
- **Intention formation** (what drives their choices)
- **Trait categories** (which trait types matter most)
- **Scale of influence** (scope of their effects)

| Actor Type | AP | Example | Scale |
|------------|-------|---------|-------|
| **God** | 1 | Weaver of Fate (player) | Cosmic |
| **Ascendant** | 1–2 | Ancient sorcerer, Demon lord | Continental |
| **Faction** | 2–3 | Kingdom, Merchant Guild | Regional |
| **Culture** | 1 | Ethnicity, Ideology | Distributed |
| **Group** | 3–5 | Army, Settlement, Order | Local |
| **Individual** | 1 | Hero, Scholar, Merchant | Personal |

*See Notion actor design board for motivation profiles and example actor hierarchies.*

## 7. Art & Audio Direction

### 7.1 Visual Style — "The Veil Between Worlds" (Proposal C)
**Direction locked 2026-03-04.** Dual-layer visual philosophy:

**Core Principle — "Muted World, Radiant Magic":** The gameworld is muted and naturalistic; magic, divine intervention, and sphere influence are rendered in radiant, almost-neon color. This duality IS the visual identity.

**Dual-layer approach:**
- **Divine layer (world zoom):** Clean cartographic clarity (Mystara tradition). Dark, elegant, minimal UI chrome. Geometric/cosmic iconography. The god's omniscient perspective.
- **Mortal layer (close zoom):** Painterly atmospheric richness (Endless Legend / Simonetti tradition). Warm scene-art for actor panels and events. Organic, hand-drawn feeling. The living world beneath.
- **The transition between layers** is the signature visual experience — zooming from cosmic strategy to intimate mortal drama.

**Implementation path:** Start with cartographic clarity for hex map MVP → layer in atmospheric elements for actor/event panels → design architecture with dual-layer zoom as long-term target.

**Typography:** Cinzel serif headings, Inter body text. **Color:** Naturalistic biome base, sphere-typed accent colors, divine gold highlights, domain-typed colors (see §4.3). **Borders:** Endless Legend-inspired layered transparency with diamond-rotated nodes and 4-level depth hierarchy.

**Iconography:** Hybrid geometric frame + pictographic element system for domain icons (see §4.3.2). Culture-neutral visual identity where icons/colors are cosmological constants and names vary by culture.

**Key references:** Elden Ring, Endless Legend (UI + [concept art album](https://imgur.com/a/endless-legend-wallpapers-4o4gb)), Humankind, Arkham Horror LCG, Marc Simonetti's Malazan art.

*See Notion Inspiration Board and `Design/style-tile.html` for full reference gallery, color swatches, and interactive mockups. See `Design/domain-iconography.html` for domain icon prototypes and cultural naming sets.*

### 7.2 Audio Direction
**TBD.** Current framework:
- Avoid aggressive dynamic music; favor ambient soundscapes that fade into background
- World sounds (wind, water, civilization hum) communicate biome and time of day
- Magical effects subtle (tones, chimes) rather than bombastic
- Voice: Minimal narrative voiceover; text-driven immersion

*Audio discovery in progress.*

## 8. Technical Architecture

### 8.1 Three Engine Pillars

1. **Taxonomy System** — The cosmology, spheres, and trait categories that define what exists and how it interacts
2. **CRUD Action System** — The 48-action framework that drives all autonomous behavior and consequences
3. **Performance Scaling** — The spotlight model that allows seamless simulation across arbitrary actor populations

### 8.2 MVP Implementation
- **Framework:** React + TypeScript, Vite build tooling
- **Rendering:** SVG (hex grid, world visualization), Tailwind CSS for UI
- **State Management:** React useState/useReducer (MVP); planned migration to graph-based state representation
- **Current MVP:** 20×15 hex grid with cosmology-driven terrain generation, basic actor placement

### 8.3 World Graph Data Structure
- **Nodes:** Entities (actors, places, artifacts, relationships, events) with property maps
- **Edges:** Typed relationships (rule, alliance, enmity, influence, causation, etc.)
- **Layers:** 5-layer hierarchy (L1 World-Soul through L5 Object) for emergence management
- **Queries:** Efficient traversal for intention formation, consequence cascade, spotlight updates

*See /Docs/plans/ for graph schema and database architecture.*

### 8.4 Save & Load
**TBD.** Current design philosophy:
- Full graph serialization (all actors, relationships, and history)
- Optional consequence pruning (very old historical events may be archived)
- Intention journal (track player interventions for narrative/consequence replay)

## 9. Design Documentation & Workflow

### 9.1 Primary Design Home: Notion
[Development Backlog](https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf) — Sequenced discovery roadmap covering:
- Resolution System mechanics
- Agent Action Selection algorithms
- Adversarial AI (Rival Ascendant behavior)
- Doom Clock (time pressure & cosmic cycle)
- Echo System (persistence through Unmaking)
- Narrative Prose Generation (world events as story)
- And more...

*All design decisions are tracked here with reasoning and dependencies.*

### 9.2 Graph Visualization: Obsidian Vault
~150 files capturing:
- Cosmological relationship diagrams
- Actor hierarchies and networks
- Trait effect matrices
- Action consequence chains
- Reference materials and inspiration

*Used for visual design reasoning and system validation.*

### 9.3 Implementation Plans
**/Docs/plans/** directory contains technical design for:
- Graph schema and queries
- Action resolution algorithms
- Spotlight model fidelity transitions
- Terrain generation pipeline
- UI component architecture

### 9.4 This GDD
**Consolidated index and summary**, NOT the authoritative spec. Use this document to:
- Onboard new contributors
- Validate high-level coherence
- Link to detailed design homes
- Track approved systems vs. discovery backlog

## 10. Open Design Questions (Discovery Backlog)

See [Notion Development Backlog](https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf) for the full sequenced discovery roadmap. Key open questions include:

- **Resolution System:** How do we resolve contested actions when multiple actors want conflicting outcomes?
- **Agent Action Selection:** What algorithm drives autonomous actor decision-making? How do intentions form?
- **Adversarial AI:** How do Rival Ascendants learn and counter player strategies?
- **Doom Clock:** What triggers Unmaking cycles? How does cosmological decay create tension?
- **Echo System:** Which historical echoes survive Unmaking? How do they shape the next cycle?
- **Narrative Prose Generation:** How do we transform system events into emergent fiction?
- **Detection & Consequence:** What patterns reveal the player's existence to Rival Ascendants?

---

**Document Status:** Living document. Last updated: 2026-03-04. Reflects approved system designs and active development state. See Notion for real-time design decisions and discovery backlog.
