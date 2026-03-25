# Culture & Agent Seeding — Preliminary Design

**Date:** 2026-03-25
**Status:** 🎨 Early design — initial ideas for discussion
**Backlog:** TB-031 (culture seeding), TB-032 (agent seeding)

---

## Problem

The current world seed creates agents and cultures procedurally, but the results feel generic. Every world has 8–12 nameless individuals scattered across random locations with randomly assigned archetypes, and 2–3 cultures composed from foundation×sphere×biome modifiers. The mechanical pipeline works, but there's no narrative gravity — no sense that these people and cultures have history, relationships, or reasons for being where they are.

Two distinct problems, both about the opening minutes of the game:

1. **Culture seeding** — Cultures appear fully formed with no sense of origin, territory, or tension with neighboring cultures. The player (as a newly awakened god) sees labels but not stories.

2. **Agent seeding** — Individuals appear as isolated strangers. No pre-existing relationships, no family structures, no political positions, no grudges or alliances. The social graph starts empty and takes many ticks to develop any texture.

---

## Design Goals

- The world should feel **lived-in** from tick 0 — not like everything was just spawned
- Cultures should have **geographic coherence** — clustered populations, border zones, diaspora
- Agents should have **pre-existing relationships** — some bonds, some tensions, some history
- Everything must remain **procedural and seeded** — same seed = same world
- Must stay **within the existing graph model** — no new node types unless absolutely necessary
- Player should be able to **read** the social fabric at a glance, even before interacting

---

## Culture Seeding — Initial Ideas

### What exists now

The culture generator (`cultureGenerator.ts`) already does solid compositional work: foundation × sphere × biome → identity, with keywords, reach preferences, trait seeds, and flag SVGs. Cultures are assigned to actors (70/20/10 split: one culture / two cultures / cultureless). Historical cultures create dead empires with ruin territories.

### What's missing

**Geographic clustering.** Currently, culture assignment ignores location. A Verdant-Force mountain culture might have its members scattered across deserts and coastlines. The `belongs_to` edges exist but carry no spatial logic.

**Inter-cultural tension.** Cultures with opposing foundations (chaos vs order) or competing sphere affinities should start with latent tension. Currently they're just parallel labels.

**Cultural landmarks.** A culture should be associated with specific locations (a capital, sacred sites, ancestral lands) beyond just "members live here."

### Proposed approach

**Phase 1: Territory-aware culture assignment**

Instead of assigning cultures to actors randomly, assign cultures to *regions* first, then assign actors to the culture of their region:

1. Each culture gets a "homeland" — a cluster of 3–5 adjacent hexes chosen by biome affinity (cultures prefer their `preferredBiomes`)
2. Locations within a homeland get a `cultural_heartland` edge to the culture
3. Actors at homeland locations get `belongs_to` with high strength (0.7–0.9)
4. Actors at border locations (adjacent to two homelands) get dual culture or reduced strength
5. A small percentage of actors are "diaspora" — culture members living outside their homeland

This creates a visible cultural map: when the player looks at the hex grid, they see culture A dominating the forests in the west and culture B controlling the mountain passes in the east, with a contested border zone between them.

**Phase 2: Cultural infrastructure**

Each culture starts with one "seat" location that has special significance:

- The seat is the location with the most culture members (or a designated capital hex)
- A `cultural_seat` edge connects culture → location
- The seat location gets a bonus to reputation events and social encounter availability
- If the seat is captured/destroyed, cultural cohesion drops (future mechanic)

**Phase 3: Inter-cultural relationships**

At world seed, generate a tension score between each culture pair based on:

- Foundation opposition (chaos↔order, light↔darkness): high tension
- Sphere competition (same venerated sphere): moderate tension (competing for cosmic influence)
- Territory adjacency: amplifies whatever tension exists
- Shared biome preferences: moderate tension (competing for the same land)

Store as `relates_to` edges between culture nodes with sentiment/tension properties. These seed initial diplomatic state.

---

## Agent Seeding — Initial Ideas

### What exists now

Individuals get: name, axiological profile, domain capabilities, location, archetype, cooperation strategy, reputation, and optionally a faction membership (70%) and ambitions. No relationships between agents exist at tick 0.

### What's missing

**Pre-existing bonds.** In a real world, people know each other. Some are family, some are rivals, some are mentor-student pairs. The `relates_to` edge type already exists but is never seeded — it only develops through gameplay encounters.

**Social clusters.** Agents at the same location should be more likely to know each other than agents across the map. Currently they're all strangers.

**Power structures.** Factions have members, but there's no leader, no hierarchy, no founding story. The `rank` property exists on `member_of` edges but all seeded members get rank 0.3.

**Narrative hooks.** Agents have archetypes and ambitions, but no "opening situation" — no ongoing conflict, no active quest, no visible motivation that the player can read.

### Proposed approach

**Phase 1: Seed initial bonds**

At world seed, after all agents are placed, generate `relates_to` edges between agents:

1. **Colocation bonds:** Agents at the same location have a 60% chance of a bond. Sentiment seeded from axiological compatibility (similar profiles → positive, opposing profiles → negative). Trust starts at 0.3–0.6 (known quantities, not strangers).

2. **Faction bonds:** All members of the same faction get bonds to each other. The faction's axiological profile biases the sentiment (aligned members → positive, misaligned → tension within the faction).

3. **Cross-location bonds:** 10–20% of agents have one bond to an agent at a different location. These represent trade contacts, old friends, or family that moved away. Creates natural movement motivation (agents will want to visit bonded agents).

4. **Rival pairs:** For each faction with 3+ members, generate one internal rival pair (competing for influence) and one external rival (an agent in a different faction with opposing archetype). These create narrative tension from tick 0.

**Phase 2: Faction leadership**

Instead of all faction members having rank 0.3:

- One member per faction starts as leader (rank 0.8–0.9, `isFactionLeader: true`)
- Leader is the member with the highest compatible domain capability (Iron for militant factions, Gold for merchant factions, Heart for religious factions — based on faction's reach preference)
- 1–2 members start as lieutenants (rank 0.5–0.6)
- Remaining members keep rank 0.2–0.4
- Leadership creates a visible power structure the player can read and manipulate

**Phase 3: Opening situations**

After bonds and leadership are seeded, generate 2–3 "opening situations" — narrative hooks visible from tick 0:

- A faction leader whose ambition conflicts with a lieutenant's (succession tension)
- Two agents at the same location with a negative bond and competing ambitions (local conflict)
- An agent pursuing an ambition that requires traveling to a distant location where they have no bonds (lonely quest)
- A diaspora agent far from their culture's homeland with a `reclaim_homeland` reactive ambition

These aren't scripted events — they're emergent from the seeded data. The player discovers them by inspecting agents.

---

## Constants (preliminary)

| Constant | Default | Purpose |
|----------|---------|---------|
| `CULTURE_HOMELAND_SIZE` | 3–5 hexes | Territory cluster per culture |
| `CULTURE_BORDER_DUAL_CHANCE` | 0.4 | Probability of dual-culture at borders |
| `CULTURE_DIASPORA_FRACTION` | 0.1 | Fraction of members outside homeland |
| `COLOCATION_BOND_CHANCE` | 0.6 | Chance of bond between colocated agents |
| `CROSS_LOCATION_BOND_CHANCE` | 0.15 | Chance of bond to a distant agent |
| `INITIAL_BOND_TRUST_RANGE` | [0.3, 0.6] | Trust range for seeded positive bonds |
| `RIVAL_PAIR_TRUST_RANGE` | [-0.4, -0.1] | Trust range for seeded rivalries |
| `LEADER_RANK` | 0.85 | Faction leader starting rank |
| `LIEUTENANT_RANK_RANGE` | [0.5, 0.6] | Lieutenant starting rank |
| `MEMBER_RANK_RANGE` | [0.2, 0.4] | Regular member starting rank |

---

## Open Questions

1. **How many cultures?** Currently 2–3. Should this scale with map size? With location count?
2. **Culture visibility on the map.** Should culture homelands tint hexes? Add a colored border? Show a flag icon? This is a HexMapV2 rendering question.
3. **Pre-seeded encounters.** Should some agents start mid-encounter (already negotiating, already traveling to a target)? Or is bonds + ambitions enough?
4. **Player's culture.** Does the player's ascendant have a cultural affiliation? Does the player *choose* a culture to favor at game start?
5. **Historical culture interaction.** How do the existing historical (dead empire) cultures interact with the living cultures? Are they layered on the same territory?
6. **Born agent culture.** Born agents inherit culture from a parent at their location — does this work correctly with territory-aware assignment? (Should be fine, since the parent already has the local culture.)

---

## Next Steps

- Discuss these ideas — which phases matter most for the testing-ready state?
- Promote to full 🎨 design with NFP compliance audit once direction is confirmed
- Culture seeding (TB-031) and agent seeding (TB-032) are now on the backlog as 💡 ideas
