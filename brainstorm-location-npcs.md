# Brainstorm: Location Non-Agent Characters (NPCs)

**Date:** 2026-03-27
**Context:** Locations currently feel empty — agents pass through but nothing *lives* there permanently. No innkeeper, no market vendor, no town guard. This brainstorm explores what location-bound NPCs could be, how they differ from agents, and where the unique design opportunities are.

---

## The Gap

- Locations have sublocations (Market District, Temple Quarter, Barracks) but nobody *staffs* them
- Agents are transient visitors — they arrive, do encounters, leave
- Population is currently just prose flavor (`PopulationBand`: empty/sparse/moderate/bustling) — not engine state
- Faction guild halls exist as sublocations but have no guild master, no receptionist, no senior member present
- The world feels like a set of encounter machines rather than inhabited places

## What NPCs Are NOT

- NOT full agents (no movement, no decision phase, no spotlight)
- NOT just prose flavor text (they should have *some* engine state)
- NOT a new node type without careful design (graph architecture rule)

## Core Identity: NPCs as Location Fixtures

- Bound to a location or sublocation permanently (or semi-permanently)
- Have a **role** that connects them to the sublocation's function
- Have lightweight state: name, role, maybe a few axiological leanings, maybe a reach affinity
- <AI>Could be `actor` nodes with `actorType: 'npc'` or a new actorType, connected via `located_at` edges with a `resident: true` property — avoids new node type while distinguishing from mobile agents</AI>

---

## Unique Feature Opportunities

### 1. NPCs as Encounter Anchors

- Encounters at a sublocation could *involve* the resident NPC
- "The blacksmith offers you a commission" — the blacksmith is a named NPC at the Forge sublocation
- NPC's axiological profile colors the encounter: a merciful temple keeper offers different dilemmas than a ruthless one
- Repeat visits to the same NPC could track relationship — adds continuity that random encounters lack
- <AI>This is the big differentiator from generic roguelikes: NPCs aren't quest dispensers, they're characters whose values shape encounters</AI>

### 2. NPCs as Faction Representatives

- Guild halls already exist — they need a guild master NPC
- The NPC *is* the faction's local face: their axiological profile could drift from the faction's official line
- A corrupt guild master at one hall vs an honorable one at another — same faction, different local flavor
- Promotion encounters gain weight: you're being evaluated by a specific person with specific values, not an abstract system
- <AI>Faction rep NPCs could also gate faction encounters: the NPC's attitude toward an agent affects which quests are offered</AI>

### 3. NPCs as Knowledge Sources

- NPCs know things about their locale — rumors, hidden sublocations, nearby threats
- Talking to the innkeeper could reveal a `hidden` sublocation (tavern gossip → secret entrance to ruins)
- NPCs in the Eye reach (knowledge) could serve as lore dispensers
- Different NPCs know different things based on their role and reach affinity
- <AI>This could tie into the existing discovery/fog system: NPCs as a discovery mechanism alongside exploration</AI>

### 4. NPCs as Relationship Anchors

- Agents currently have relationships with other agents — but those agents move around
- NPC relationships are *geographically stable* — "my contact in Thornhaven"
- Creates reasons for agents to *return* to specific locations
- An agent's network of NPC contacts becomes a kind of soft territory / home range
- Social Fabric system gains spatial anchoring: factions and relationships aren't just abstract, they're tied to places through people

### 5. NPCs as World-State Signifiers

- NPC presence/absence signals location state: a bustling market has many vendor NPCs; after a war event, some are gone
- NPC mood/attitude could reflect local conditions (doom level, faction control, recent events)
- Player can read the world through NPCs without needing explicit UI — "the guards look nervous" = high doom nearby
- <AI>NPCs as a narrative readout of hex state changes — more evocative than stat bars</AI>

### 6. NPCs as Intervention Targets

- The god-game layer gains new targets: bless a specific NPC, curse them, inspire them
- Intervening on an NPC changes a *location's* character, not just one agent's path
- "Corrupt the guild master" as an action — changes how the entire local faction branch operates
- NPCs could be promoted to full agent status via divine intervention ("Awaken this shopkeeper to a hero's destiny")
- <AI>NPC → agent graduation is thematically rich: the god lifts someone from ordinary life into the spotlight</AI>

### 7. NPCs and the Prose Engine

- Named NPCs with roles give the prose resolver much richer material than generic location descriptions
- "The shrine keeper, a weathered woman with iron-grey hair, tends the eternal flame" vs "you visit the shrine"
- NPC names, roles, and traits become prose variables — huge quality uplift for vignettes
- <AI>Could extend the prose-layer-content resolver system: `{npc.name}`, `{npc.role}`, `{npc.trait}` variables</AI>

### 8. NPCs as Population Simulation (Lightweight)

- NPC count at a location could *replace* the prose-only PopulationBand with actual state
- Settlements grow: new NPCs appear as a town prospers; NPCs leave or die when doom rises
- Ties into the mutable hex state system — NPC population as a hex property that changes over time
- Not full demographic sim — just enough to make locations feel alive and responsive

---

## Design Questions (Open)

- **Representation:** New `actorType` value? Sublocation property? Something else entirely?
- **Scale:** How many NPCs per location? Handful of named ones? Or dozens of unnamed + a few named?
- **Tick participation:** Do NPCs do anything in the tick loop? Or are they purely reactive (only matter when agents interact with them)?
- **Generation:** Seeded at world gen? Created dynamically as sublocations are discovered? Both?
- **Mortality:** Can NPCs die? Be replaced? What happens to relationships when they do?
- **Promotion:** Can an NPC become a full agent? Under what conditions?
- **Performance:** If there are 50+ locations with 3-5 NPCs each, that's 150-250 new graph nodes — is that within budget?

---

## What Makes This Unique (vs Other Games)

Most games treat NPCs as either quest dispensers (Skyrim) or pure flavor (Dwarf Fortress legends). The opportunity here:

- NPCs whose **axiological values shape encounters** — not fixed dialogue trees, but value-driven interaction
- NPCs as **spatial anchors for the social fabric** — relationships have geography
- NPCs as the **god-game's local lever** — intervene on a person to change a place
- NPC → agent **graduation** as a divine act — narratively powerful, mechanically interesting
- NPCs as **readable world state** — the player learns to read locations through their inhabitants
