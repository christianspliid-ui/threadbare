# Narrative Context Pipeline — World-Aware Prose Generation

**Goal:** Define the technical system that harvests world objects from the graph and feeds them to the prose generator, enabling narrative that references specific locations, artifacts, factions, rival agents, and historical events rather than operating in a vacuum.

**Companion doc:** `2026-03-06-content-strategy.md` covers the creative rules (prose voice, archetypes, themes, exclusions) that this pipeline serves.

**Architecture:** A four-stage pipeline — Harvest → Rank → Select → Feed — runs before any Notable or Chronicle prose generation. An optional fifth stage (Spawn) creates new world objects when the narrative demands them and none exist.

---

## 1. The Context Builder

The Context Builder runs before Notable and Chronicle prose generation. Routine events skip it — they're too frequent and too minor to justify world-object lookups.

### Stage 1: Harvest

Query the world graph outward from the event's actors and location. Collect:

| Category | What to Harvest | Graph Query |
|----------|-----------------|-------------|
| **Artifacts/Objects** | Items at the location or carried by actors | Nodes with edges to location or actor nodes |
| **Factions** | Factions with influence in this location or region | Faction nodes with territory/influence edges |
| **Rival Agents** | Enemy god agents operating nearby | Actor nodes with `rival_affiliation` edges within range |
| **Culture** | Culture that owns this territory | Culture node linked to the location's region |
| **Historical Events** | Prior notable events at this location or involving these actors | Event nodes with location/actor edges matching current event |
| **Nearby Characters** | Other named characters present or adjacent | Actor nodes at same location or connected locations |
| **Terrain/Geography** | Physical features of the location | Location node properties + terrain edges |

The harvest radius depends on narrative tier:
- **Notable:** immediate location + directly connected locations (1 hop)
- **Chronicle:** region-wide (2 hops) + any graph-connected actors regardless of distance

### Stage 2: Rank

Score each harvested object by narrative relevance. The ranking formula:

```
Score = Proximity + Involvement + Opposition Tension
```

**Proximity** (0–3):
- Same location as event: 3
- Adjacent location: 2
- Same region: 1
- Connected by graph edge only: 0.5

**Involvement** (0–5):
- Direct participant in the event: 5
- Causal connection (faction whose treaty was broken): 3
- Owner/creator of an involved object: 2
- Atmospheric (looming ruin, passing caravan): 1

**Opposition Tension** (0–5, the most important factor):

| Tension Type | Score | Example |
|--------------|-------|---------|
| **Foundation sphere opposition** (Chaos↔Order, Light↔Darkness) | 5 | An Order-aligned artifact in a Chaos-sphere event |
| **Creation sphere opposition** (Force↔Mind, Life↔Entropy, etc.) | 3 | An Entropy-aligned ruin in a Life-sphere healing event |
| **Value opposition** | 3 | A loyal faction near a treacherous character |
| **Archetype friction** | 4 | A True Believer and a Trickster in the same scene |
| **Historical grudge** | 4 | Two factions with a prior `conflict` edge in the graph |
| **Cultural clash** | 2 | Characters from cultures with opposing honor systems |

Opposition tension is scored additively — a single harvested object can accumulate tension from multiple sources. A rival agent who serves an opposing sphere AND has a historical grudge with the protagonist scores very high.

### Stage 3: Select

Pick the top N objects by score, where N depends on narrative tier:
- **Notable:** 2–3 objects
- **Chronicle:** 4–5 objects

Enforce variety — don't select 3 artifacts and 0 characters. Apply a soft category cap:
- Max 2 from any single category (artifacts, factions, characters, locations, events)
- At least 1 character or faction if available (stories need agents, not just objects)

### Stage 4: Feed

Pass the selected objects to the prose generator as named context. The prose template system receives:

```typescript
interface NarrativeContext {
  // The event being narrated
  event: NarrativeEvent;

  // Primary actor's archetype (drives tone selection)
  archetype: ArchetypeId;

  // Cultural palette of the primary actor
  culturalPalette: CulturalPalette;

  // Harvested and ranked world objects
  contextObjects: ContextObject[];

  // Historical fragments (pre-formatted short text)
  historicalFragments: string[];

  // Opposition summary (what's creating tension in this scene)
  oppositionSummary: OppositionSummary;
}

interface ContextObject {
  nodeId: string;
  name: string;
  category: 'artifact' | 'faction' | 'character' | 'location' | 'event';
  relevanceScore: number;
  tensionType?: string;  // Why this object is interesting
  briefDescription: string;  // 1 sentence, from chronicler vignette data
}
```

The prose generator uses these context objects as named substitutions in templates, or as structured prompt context for LLM-generated Chronicle prose.

---

## 2. Opposition Tension Scoring — Detailed Rules

Opposition is the engine of narrative. The ranking system actively seeks it out.

### Sphere Opposition Matrix

Foundation sphere pairs are maximally opposed:

| | Chaos | Order | Light | Darkness |
|---|---|---|---|---|
| **Chaos** | — | 5 | 2 | 2 |
| **Order** | 5 | — | 2 | 2 |
| **Light** | 2 | 2 | — | 5 |
| **Darkness** | 2 | 2 | 5 | — |

Creation spheres have natural tensions (not strict opposites, but narrative friction):

| Pair | Tension Score | Narrative Reason |
|------|--------------|------------------|
| Force ↔ Mind | 3 | Brute strength vs. cunning strategy |
| Life ↔ Entropy | 4 | Growth vs. decay — the oldest tension |
| Energy ↔ Spirit | 2 | Physical power vs. ethereal transcendence |
| Matter ↔ Time | 2 | Permanence vs. change |

### Archetype Friction Matrix

Some archetype pairings create natural narrative foils:

| Pairing | Friction | Why |
|---------|----------|-----|
| True Believer ↔ Trickster | 5 | Faith vs. irreverence |
| Oathkeeper ↔ Schemer | 5 | Honor vs. manipulation |
| Noble Savage ↔ Poisoned Court | 4 | Raw honesty vs. civilized corruption |
| Maker ↔ Monster | 4 | Creation vs. destruction |
| Reluctant King ↔ Kingmaker | 3 | Resisting power vs. wielding it through others |
| Seeker ↔ True Believer | 3 | Questioning vs. faith |
| Folk Hero ↔ Fallen Noble | 3 | Common virtue vs. aristocratic failure |
| Doomed Innocent ↔ Monster | 4 | Vulnerability vs. predation |
| Wanderer ↔ Oathkeeper | 3 | Rootlessness vs. absolute commitment |

These scores are additive with sphere and value tension. A Trickster serving Chaos who encounters a True Believer serving Order near a historical betrayal site scores: 5 (archetype) + 5 (foundation sphere) + 4 (historical grudge) = 14. That's a scene the narrative engine should never skip.

---

## 3. Narrative-Driven Spawning

Sometimes the story needs something that doesn't exist yet. A Schemer's plot needs a poisoned dagger, but there isn't one in the graph. A Seeker's discovery needs an ancient ruin, but the hex is empty.

### When to Spawn

Spawning triggers when:
1. An archetype's beat pattern requires a specific category of object (see Content Strategy §3, Narrative Requirements)
2. The harvest found no objects matching that category within range
3. The event is Notable or Chronicle tier (never spawn for Routine events)

### Spawn Pipeline

Spawned objects go through the existing content pipeline's four constraint layers:

1. **Schema constraint** — the object must be a valid graph node type with correct properties
2. **Tonal constraint** — the object must match the local culture's material vocabulary and the current sphere coloring
3. **Balance constraint** — the object's power/significance must be proportional to the narrative tier (a Routine event never spawns a legendary artifact)
4. **Coherence constraint** — the object must make sense in its location (no desert oasis in a tundra hex, no ocean artifact on a mountaintop)

### Cultural Shaping

Spawned objects inherit the local culture's material vocabulary:
- A poisoned weapon in a nomadic culture → a short curved blade with bone handle
- A poisoned weapon in a merchant republic → a jeweled letter opener
- An ancient ruin in a warrior culture → a collapsed fortress with shattered gates
- An ancient ruin in a merchant culture → a buried counting house with corroded scales

### Tiered History for Spawned Objects

| Narrative Tier | Spawned Object History |
|----------------|----------------------|
| **Notable** | Minimal — the object can simply be discovered. "Kaelen found an unmarked blade in the ruins." Mystery is evocative. |
| **Chronicle** | Full provenance — a creation event node, cultural origin, possibly a prior owner. "The Thorn Crown was forged in the workshops of Ashenmere, worn by three kings, lost when the city fell." |

Important objects (those that score high in subsequent events) can have their history retroactively enriched — a discovered blade that turns out to matter can gain a backstory later.

### Persistence

**Spawned objects are permanent graph nodes.** They don't vanish after the story beat. A poisoned dagger spawned for a Schemer's plot exists forever — it can be found by other characters, change hands, become a historical artifact. This creates emergent narrative chains: an object spawned for one story becomes context for another.

---

## 4. Archetype Beat Patterns

Each archetype has a set of narrative beat patterns that define which event types are significant for that archetype and what world context they demand. These are stored in `archetype-content.ts`.

### Beat Pattern Structure

```typescript
interface BeatPattern {
  // Event types that trigger this beat
  eventTypes: NarrativeEventType[];

  // Minimum tier for this beat to fire
  minimumTier: NarrativeTier;

  // Tier to PROMOTE TO if conditions match (e.g., a Tragic Hero's death promotes to Chronicle)
  promoteTo?: NarrativeTier;

  // World objects this beat demands (triggers spawning if absent)
  narrativeRequirements: NarrativeRequirement[];

  // Additional context the beat wants (doesn't trigger spawning, just harvest priority)
  contextPreferences: string[];
}

interface NarrativeRequirement {
  category: 'artifact' | 'location' | 'character' | 'faction';
  tags: string[];  // e.g., ['weapon', 'cursed'] or ['ruin', 'ancient']
  required: boolean;  // true = spawn if absent; false = nice to have
  culturallyShape: boolean;  // true = use local culture's material vocabulary
}
```

### Example Beat Patterns

**Tragic Hero — death event:**
```
eventTypes: ['actor_death']
minimumTier: 'notable'
promoteTo: 'chronicle'
narrativeRequirements:
  - { category: 'location', tags: ['battlefield', 'monument'], required: false }
  - { category: 'artifact', tags: ['weapon', 'legendary'], required: false }
contextPreferences: ['historical_events_at_location', 'witnesses', 'faction_reactions']
```

**Schemer — contested action (success):**
```
eventTypes: ['contested_action', 'action_critical']
minimumTier: 'routine'
promoteTo: 'notable'
narrativeRequirements:
  - { category: 'artifact', tags: ['tool_of_betrayal', 'document', 'poison'], required: true }
  - { category: 'character', tags: ['witness', 'victim'], required: false }
contextPreferences: ['rival_agents', 'faction_alliances', 'prior_betrayals']
```

**Seeker — trait acquired (knowledge):**
```
eventTypes: ['trait_acquired']
minimumTier: 'routine'
promoteTo: 'notable'
narrativeRequirements:
  - { category: 'location', tags: ['ruin', 'library', 'sacred_site'], required: true }
  - { category: 'artifact', tags: ['text', 'cryptic', 'ancient'], required: true }
contextPreferences: ['warnings', 'prior_seekers_fate', 'sphere_opposition']
```

---

## 5. Chronicler Vignette Generation

When the player inspects a world object (location, artifact, faction, character), the chronicler voice generates a short vignette. This is a separate prose path from event narration.

### Vignette Data Sources

| Source | What It Provides |
|--------|-----------------|
| Node properties | Name, type, creation tick, sphere alignment |
| Edge connections | Who made it, who owns it, what it's connected to |
| Event history | Notable events involving this node |
| Cultural context | The culture that claims this territory/object |
| Current state | Active traits, damage, occupation, modifications |

### Vignette Template

Chronicler vignettes follow a consistent internal structure:
1. **Present observation** — what you see now (1 sentence)
2. **Historical weight** — what this has been (1 sentence)
3. **Lingering resonance** — what it means or what remains (1 sentence, optional)

> "The Salt Bridge spans the Thornwater in three arches of blackened stone. It has been contested in every war since the Sundering — the bloodstains have seeped so deep they've become part of the mortar. Locals say the river runs red for a week each spring, though no one remembers why."

Not every vignette needs all three layers. A newly spawned object might only have present + cultural context. An ancient location might emphasize history over present. The chronicler adapts to what data exists.

---

## Decisions Log

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Pipeline trigger | Notable + Chronicle only | All tiers, Chronicle only | Routine events are too frequent for graph queries; Notable events deserve grounding |
| Ranking formula | Proximity + Involvement + Opposition Tension | Proximity only, random selection, ML-scored | Opposition tension is the key insight — the engine should prefer narrative friction |
| Spawn persistence | Permanent graph nodes | Temporary/ephemeral, tagged as spawned | Permanent spawns create emergent narrative chains; a spawned dagger can become next cycle's legendary artifact |
| Spawn history | Tiered (Notable=discovery, Chronicle=full provenance) | Always full history, always mysterious | Lets minor objects be evocative mysteries while important ones have weight |
| Category variety | Soft cap (max 2 per category) | Hard cap, no cap | Prevents "3 artifacts and nothing else" while allowing flexibility |
| Cultural shaping | Spawned objects inherit local culture | Random, sphere-determined, archetype-determined | Culture is the most visible texture — a weapon should look like it belongs here |
