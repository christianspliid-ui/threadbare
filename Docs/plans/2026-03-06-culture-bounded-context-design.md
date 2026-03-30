# Culture Bounded Context Design

**Date:** 2026-03-06
**Status:** Approved
**Scope:** Full bounded context for the Culture system — data model, trait mechanics, location/artifact/narrative integration, content production requirements

## Design Principles

1. **Culture is a graph node.** Follows the load-bearing decision that everything is a graph node/edge. Culture must be central to the storytelling graph, not a parallel system.
2. **Narrative first.** If a cultural mechanic doesn't produce visible, interesting narrative, it's not worth having. Every number must drive prose, art, or player-facing events.
3. **Generated within constraints.** Cultures are procedurally generated from composite modifiers (foundation spheres + creation spheres + biomes), not hand-authored. The content pipeline provides seeds; the generator combines them.
4. **Budget model.** Cultural identity is a finite resource. Actors carry at most two cultures whose strengths sum to ≤1.0. This creates natural narrative tension without combinatorial explosion.

## 1. The Culture Model

### Definition

Culture is the history, language, ideas, customs, and social behavioral patterns of a particular group of people. These subcategories map to game systems as follows:

| Subcategory | Game Expression | Mechanical Weight |
|---|---|---|
| **History** | Narrative flavor, location historical layer, artifact lore | Narrative only — no direct stat effects |
| **Language** | Prose coloring, metaphor palette, naming conventions | Narrative only — shapes generated text |
| **Ideas** | Values, beliefs, venerated spheres → behavioral traits | Mechanical — modifies agent behavior through traits |
| **Customs** | Rituals, social rules, insider beats → culture-gated events | Mechanical — gates narrative events and interactions |
| **Behavior patterns** | Action tendencies, hierarchy norms → domain modifiers | Mechanical — influences action selection and resolution |

History and language are purely narrative. Ideas, customs, and behavior patterns have mechanical teeth through the trait and event systems.

### Budget System

Every actor (individual, group, faction, army, population) carries 0–2 culture edges. Cultural strengths sum to **≤1.0** — culture is a budget, not a stack.

| Configuration | Narrative State | Example |
|---|---|---|
| **1 culture, 0.5–1.0** | Singular identity | Dwarven craftsman, strength 0.85 |
| **2 cultures, split** | Dual-culture tension | Desert nomad (0.6) raised among forest elves (0.35) |
| **2 cultures, one dominant** | Primary with coloring | Ember Kingdom noble (0.75) with Tidal Elf education (0.2) |
| **Below 0.3 total** | Culturally neutral | Wanderer with no strong cultural ties |
| **0 cultures** | Cultureless | Newly created construct, feral creature |

### Strength Threshold Table

| Range | Label | Narrative Effect |
|---|---|---|
| **0.8–1.0** | Fanatical | Saturated cultural voice in prose. Culture dominates decision-making. Insider beats fire frequently. Extreme reactions to cultural insults. |
| **0.5–0.79** | Strong | Clear cultural identity in prose. Culture meaningfully influences behavior. Most insider beats available. |
| **0.3–0.49** | Fading | Faint cultural coloring in prose. Only major cultural traits active. Few insider beats available. |
| **0.0–0.29** | Silent | Narrative engine ignores culture entirely. No cultural traits active. No insider beats. |

### Who Carries Culture

Culture edges can attach to any actor node type:

- **Individuals** — personal cultural identity
- **Groups** — shared cultural identity of a band, company, or party
- **Factions** — organizational cultural identity (may differ from members' individual cultures)
- **Populations** — the dominant culture of a settlement's inhabitants
- **Locations** — see Section 3 (historical + current culture model)

## 2. Cultural Traits

Culture manifests on agents through two distinct trait mechanisms:

### Formative Traits (Innate Category, Permanent)

Skills and knowledge acquired during youth in a particular culture. These use the existing `innate` trait category.

- **Permanent** — once acquired, they never fade regardless of cultural strength changes
- **Not strength-gated** — they represent learned capabilities, not current cultural alignment
- **Examples:** "Desert Navigation" (all desert nomads learn to read dunes), "Rune Literacy" (dwarven children learn to read runes), "Tidal Reading" (coastal elves learn the tides)
- **Granted at:** Agent creation, based on the culture(s) present at that time
- **Domain contributions:** Fixed, independent of cultural strength

### Behavioral Traits (New `cultural` Category, Strength-Gated)

Customs, values, and behavioral patterns that scale with cultural strength. These introduce a **new 7th trait category: `cultural`**.

- **Strength-gated** — effective level = `baseLevel × culturalStrength`
- **Threshold-dependent** — different effects activate at different strength ranges (see threshold table)
- **Examples:** "Blood Oath Honor" (at 0.8+ triggers duel-to-the-death events; at 0.5 triggers formal challenges; below 0.3 dormant), "Ancestor Communion" (at 0.8+ daily ritual; at 0.5 seasonal observance; below 0.3 ignored)
- **Drift with strength** — as cultural strength changes, behavioral traits scale up or down automatically
- **Domain contributions:** Scaled by cultural strength — `baseDomainContribution × culturalStrength`

### Trait Category Extension

Current trait categories: `'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny'`

New: `'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny' | 'cultural'`

The `cultural` category traits have an additional property: `strengthThresholds` — a map defining which effects activate at which cultural strength ranges.

## 3. Culture on Locations

Locations use a **dual-layer culture model**:

### Historical Culture (Permanent)

The culture that originally built or shaped the location. This is a permanent edge — it never changes even if the location changes hands.

- **Shapes architecture descriptions** — "The walls bear the angular script of the Ember Kingdoms, though no ember-tongue has spoken here in three generations"
- **Determines sub-locations** — cultural buildings (forges, temples, arenas, libraries) are historical artifacts
- **Influences art generation** — the location's visual style draws from historical culture's material vocabulary
- **Provides deep lore** — archaeological narrative, founding myths, hidden cultural artifacts

### Current Culture (Dynamic)

The culture of the current occupants/owners. This changes when ownership changes.

- **Shapes daily life descriptions** — market sounds, street customs, guard behavior
- **Determines available cultural events** — which insider beats can fire at this location
- **Influences population traits** — new inhabitants gradually absorb (or resist) the local culture

### Cultural Mismatch & Conquest

When historical and current cultures differ, the system generates **tension narratives**:

- "The old temple of Life still stands in the market square, but the new lords have converted it to a grain store"
- "The street names are in the old tongue, but the signs are painted over in the conqueror's script"

**Conquest dynamics:** When a location's current culture changes due to conquest, the narrative engine classifies the *effect* from observed actions (post-hoc, not player-chosen):

| Observable Pattern | Classification | Narrative Effect |
|---|---|---|
| Conquerors destroy cultural buildings, suppress insider beats | **Suppress** | Historical culture strength drops faster; rebellion events spawn at higher frequency |
| Conquerors maintain existing cultural structures, allow mixed practice | **Coexist** | Both cultures persist; dual-culture tension creates narrative richness; stability |
| Conquerors introduce own rituals, replace cultural traits gradually | **Assimilate** | Current culture slowly shifts to conqueror's; less rebellion but loss of identity narratives |
| Conquerors ignore cultural dimension entirely | **Neglect** | Historical culture persists strongly underground; surprise resurgence events |

The classification is emergent — not an explicit policy choice. The narrative engine observes what happened and labels it for prose generation. This preserves the design principle that player intent is inferred from actions, not declared.

**Three-layer scenario (historical A, current B, conqueror C):**

- Historical culture stays A (architecture, ruins, deep lore — permanent)
- Current culture transitions from B toward C over time
- B's remaining cultural strength determines rebellion probability
- If B was already weak (they conquered from A and assimilated), the transition is smoother
- If B was strong and distinct from C, expect sustained resistance narrative arcs
- The budget model still applies — location cultural strengths sum to ≤1.0

## 4. Culture on Artifacts

Artifacts carry culture through a `culture_origin` edge — a permanent connection to the culture that created them.

### Lore Shaping

The culture_origin edge shapes how the artifact is described:

- **Name generation** draws from the origin culture's naming conventions
- **Provenance text** uses the culture's metaphor palette ("Forged in the deep-fires beneath the Holds" vs. "Woven from tide-silk under a new moon")
- **Visual description** uses the culture's material vocabulary

### Interaction Modifiers

When an agent wields or uses a culturally-significant artifact, interaction modifiers apply:

| Scenario | Modifier Direction | Narrative Expression |
|---|---|---|
| Wielder shares artifact's culture | Positive | "The blade sings in your hand — it knows its own" |
| Wielder's culture is opposed to artifact's | Negative | "The runes burn cold against your skin, rejecting your touch" |
| Wielder is culturally neutral | None | No cultural resonance — artifact functions mechanically without lore flavor |

Modifier magnitude scales with the wielder's cultural strength. A fanatical wielder of the right culture gets maximum resonance; a fading cultural identity gets a whisper.

## 5. Culture-Gated Narrative Beats

Some narrative events only fire when specific cultural conditions are met. These are **insider beats** — stories that belong to a culture and only make sense within its context.

### Examples of Insider Beats

| Beat | Required Culture | Min Strength | Trigger |
|---|---|---|---|
| Blood Oath Challenge | Force-venerating culture | 0.5 | Two agents of same culture in conflict |
| Trial by Element | Any elemental sphere culture | 0.6 | Agent accused of crime in home territory |
| Ritual of Exile | Any culture with strong community bonds | 0.7 | Agent betrays cultural values |
| Ancestor Communion | Spirit-venerating culture | 0.5 | Agent at sacred site of own culture |
| Name-Day Tournament | Force+Order culture | 0.4 | Cultural festival tick |
| Shadow Market | Darkness-venerating culture | 0.6 | Economic interaction in home territory |
| Dream Walk | Spirit+Mind culture | 0.8 | Agent seeks guidance at threshold moment |
| Cultural Reclamation | Any conquered culture | 0.4 | Historical culture different from current at location |

### Gating Rules

- The acting agent must have the required culture at or above the minimum strength
- The location must be culturally appropriate (own territory, sacred site, or neutral ground)
- Beat frequency scales with cultural strength — fanatical cultures trigger insider beats more often
- Dual-culture agents can trigger beats from *either* culture, but never from both in the same tick

## 6. Composite Culture Modifiers

When a culture is generated, it draws from three modifier sources that combine into its identity. This connects culture to the World-Soul and the landscape.

### Foundation Sphere Modifiers (4 Sets)

Each foundation sphere contributes broad tonal shaping. A culture's foundation modifier is weighted by the World-Soul's current foundation balance.

| Foundation | Social Structure | Accountability | Metaphor Seeds |
|---|---|---|---|
| **Chaos** | Fluid hierarchy, oral tradition over written law, distrust of institutions | Personal honor, might-makes-right | "Shifting sands," "storm-born," "untamed" |
| **Order** | Rigid social roles, codified law, reverence for precedent | Institutional justice, trial by law | "Stone-set," "the old way," "by the book" |
| **Light** | Communal decision-making, public ceremony, transparency | Shame-based, public accountability | "In the open," "sun-sworn," "nothing hidden" |
| **Darkness** | Initiation rites, hidden knowledge, personal loyalty over public duty | Secret tribunals, inner-circle justice | "Veiled," "shadow-kept," "the inner circle" |

A world tilted toward Chaos+Darkness produces cultures that value secrecy and improvisation. Order+Light produces cultures of public ritual and codified law.

### Creation Sphere Modifiers (8 Sets)

Each creation sphere the culture venerates adds specific behavioral and material coloring:

| Sphere | Behavioral Coloring | Material Vocabulary | Trait Seeds |
|---|---|---|---|
| **Force** | Martial honor codes, strength-based hierarchy, trial by combat | Heavy metals, war trophies, fortified architecture | Formative: weapon mastery. Behavioral: challenge compulsion |
| **Matter** | Craft guilds, material perfectionism, hoarding instincts | Stone, worked metal, monumental building | Formative: craft expertise. Behavioral: material obsession |
| **Energy** | Kinetic culture (dance, sport, racing), restlessness, migration | Light materials, mobile architecture, flame imagery | Formative: endurance training. Behavioral: restlessness |
| **Life** | Fertility rites, agricultural cycles, ancestor worship, healing | Living materials (wood, bone, leather), garden cities | Formative: herbalism. Behavioral: birth/death reverence |
| **Mind** | Scholarly castes, debate traditions, puzzle-locks, knowledge hoarding | Paper, ink, glass, observatory architecture | Formative: literacy. Behavioral: knowledge hoarding |
| **Spirit** | Meditation, dream interpretation, communion rituals, thin-place reverence | Incense, crystal, open-air temples | Formative: meditation. Behavioral: spirit sensitivity |
| **Time** | Elder councils, prophecy traditions, calendar obsession, long-game politics | Astronomical instruments, sundials, layered architecture | Formative: calendar mastery. Behavioral: patience/fatalism |
| **Entropy** | Death cults, recycling/renewal rituals, acceptance of decay, memento mori | Bone, ash, corroded metal, deliberately crumbling architecture | Formative: decay-reading. Behavioral: death acceptance |

Combinations create cultural distinctiveness: Force+Entropy = warrior-monks in bone armor who believe strength proves readiness to die. Mind+Light = open universities and public debate amphitheaters.

### Biome Modifiers (~20 Sets, One Per Terrain Type)

The landscape shapes material culture, survival skills, and metaphor. Representative examples:

| Biome | Survival Traits | Material Culture | Metaphor Palette |
|---|---|---|---|
| **Desert** | Water discipline, night travel, sun worship/fear | Sand-glass, woven fabric, underground cisterns | "Dry as oath-breaking," "oasis of truth" |
| **Tundra** | Communal warmth rituals, blubber-lamps, oral history (too cold for ink) | Bone, fur, ice-carved, buried stores | "Cold as betrayal," "thaw of forgiveness" |
| **Deep Forest** | Canopy navigation, fungal knowledge, tree-marking | Living wood, resin, woven bark | "Rooted loyalty," "branch of the family" |
| **Coastal** | Tidal calendar, boat-building mastery, salt-trade | Shell, driftwood, coral, sail-cloth | "Tide of fortune," "harbor of the soul" |
| **Mountain** | Altitude endurance, mine-craft, avalanche reading | Stone, crystal, iron, terraced fields | "Summit of ambition," "avalanche of war" |
| **Swamp** | Poison knowledge, stilted building, fog navigation | Wicker, peat, preserved-in-bog artifacts | "Murky intention," "what the bog remembers" |
| **Volcanic** | Heat endurance, glass-working, eruption prediction | Obsidian, pumice, basalt, hot-spring baths | "Forge of the earth," "eruption of anger" |

### Combination During Generation

When a culture is generated, the system:

1. **Selects foundation bias** from World-Soul's current foundation balance (weighted random)
2. **Selects venerated creation spheres** (1–2, from the culture's graph node properties)
3. **Selects primary biome** from the location where the culture originated
4. **Composes modifier sets** — each layer adds its contributions to:
   - Behavioral keyword pool → used for behavioral trait generation
   - Material vocabulary → used for art prompts and prose
   - Metaphor palette → used for narrative voice
   - Formative trait seeds → instantiated as innate traits on agents
   - Behavioral trait seeds → instantiated as cultural traits on agents

Conflicts between layers create distinctiveness. A Mind-venerating desert culture values knowledge but carries it orally (too hot for ink, paper crumbles in sand). A Force-venerating tundra culture has warriors who fight in fur armor and settle disputes by endurance contest rather than single combat.

## 7. Content Production Requirements

### Modifier Definition Sets (~32 Total)

| Category | Count | Per Set Contents |
|---|---|---|
| Foundation sphere modifiers | 4 | 3–5 behavioral keywords, social structure tendency, accountability mode, 3–4 metaphor seeds |
| Creation sphere modifiers | 8 | 4–6 behavioral keywords, 4–6 material vocabulary terms, 1–2 formative trait seeds, 1–2 behavioral trait seeds |
| Biome modifiers | ~20 | 3–5 survival trait keywords, 4–6 material culture terms, 3–4 metaphor templates |

### Cultural Trait Definitions

| Trait Type | Estimated Count | Per Trait Contents |
|---|---|---|
| Formative traits (innate, permanent) | ~30–40 | Name, description, domain contributions, tags, source conditions (which sphere/biome combinations grant them) |
| Behavioral traits (cultural, strength-gated) | ~40–50 | Name, description, domain contributions, strength threshold table, tags, decay behavior |

Traits are not hand-authored per culture — they're drawn from modifier seeds. A Force+Desert culture generates "Sand Warrior" (formative) and "Trial by Thirst" (behavioral) by combining modifier seeds. The content pipeline provides seeds; the generator combines them.

### Narrative Palette Templates (Per Culture, Generated)

| Element | Source | Content Strategy Reference |
|---|---|---|
| Characteristic metaphors | Biome metaphor palette + creation sphere coloring | §4 Cultural Narrative Palettes |
| Honor/shame vocabulary | Foundation sphere modifier + behavioral trait names | §4 Cultural Narrative Palettes |
| Oath forms | Foundation sphere (Chaos=fluid, Order=rigid) + creation sphere flavor | §4 Cultural Narrative Palettes |
| Death language | Entropy modifier if present, otherwise biome death customs | §4 Cultural Narrative Palettes |
| Storytelling tradition | Foundation (oral vs. written) + Mind modifier if present | §4 Cultural Narrative Palettes |
| Material vocabulary | Biome materials + creation sphere materials, merged | §4 Cultural Narrative Palettes |

These six elements already exist in the content strategy (§4). What changes is that they're now *generated from modifiers* rather than hand-written per culture.

### Art & Location Content

| Asset Type | Trigger | Content Needed |
|---|---|---|
| Location image variant tags | Culture + building type combination | Tag vocabulary for prompt construction (e.g., "bone-and-fur fortress" for Tundra+Force) |
| Sub-location templates | Cultural trait grants access | ~15–20 sub-location templates (bazaar, shrine, arena, library, etc.) with cultural variant descriptors |
| Artifact lore templates | culture_origin edge exists | 5–6 sentence patterns for culturally-shaped provenance |

### Culture-Gated Beat Definitions

| Content | Count | Per Beat Contents |
|---|---|---|
| Insider narrative beats | ~20–30 | Event type trigger, minimum cultural strength, required cultural trait or sphere, prose template seeds, archetype affinity |

### Content Strategy Updates Required

The content strategy doc (`Docs/plans/2026-03-06-content-strategy.md`) needs updating:

- **§4 Cultural Narrative Palettes:** Add reference to modifier-based generation pipeline. Palettes are now composed from foundation+creation+biome modifiers, not hand-authored per culture.
- **§7 Content Production Workflow:** Add `culture-content.ts` to the content package map with its estimated scope (~32 modifier sets, ~70–90 trait definitions, ~20–30 beat definitions).
- **New §4a Content Production Manifest:** Enumerate all required content authoring for culture system (this section's tables).

## 8. Narrative Engine Integration

How culture plugs into the existing narrative context pipeline (harvest → rank → select → feed).

### Harvest Stage Changes

The pipeline already harvests "Culture that owns this territory." Extended to also harvest:

- The actor's culture(s) and strength(s)
- Cultural mismatch between actor and location (tension source)
- Culture-gated beats that the actor qualifies for
- Historical culture of the location (if different from current)
- Composite modifier profile of involved cultures

### Rank Stage Changes

Cultural tension becomes a first-class opposition type in the tension scoring table:

| Tension Type | Score | Trigger |
|---|---|---|
| Cultural mismatch (actor vs. location) | 3 | Actor's culture differs from location's current culture |
| Cultural conquest tension | 4 | Location's historical culture differs from current occupiers |
| Dual-culture internal tension | 2 | Actor with two cultures at similar strength (±0.15) |
| Cultural fanaticism encounter | 3 | Actor with cultural strength ≥0.8 encountering a different culture |

These stack with existing opposition types. A fanatical True Believer from a Darkness-worshipping desert culture entering an Order+Light forest temple could score: foundation sphere opposition (5) + archetype tension (4) + cultural mismatch (3) + fanaticism (3) = 15. That's a high-priority scene.

### Select Stage

No structural changes. Existing variety caps handle culture objects naturally — cultures manifest through characters, locations, and factions, which are already capped categories.

### Feed Stage Changes

The NarrativeContext interface already has `culturalPalette: CulturalPalette`. Enriched with:

```typescript
// Added to NarrativeContext
culturalStrength: number;             // how strongly to apply cultural voice (0-1)
culturalTension?: {
  type: 'mismatch' | 'conquest' | 'dual' | 'fanaticism';
  cultures: string[];                  // involved culture IDs
  severity: number;                    // tension score
};
culturalBeats: CultureGatedBeat[];    // insider beats available this scene
```

The prose generator uses `culturalStrength` to dial cultural voice intensity:

- **0.8+:** Prose is *saturated* with cultural metaphor and vocabulary
- **0.5–0.79:** Clear cultural coloring — metaphors appear, material vocabulary used
- **0.3–0.49:** Faint coloring — occasional cultural reference
- **Below 0.3:** Culture is absent from prose

## 9. Cultural Drift Mechanics

Cultural strength is not static — it changes through play.

### Strength Increases

| Cause | Rate | Condition |
|---|---|---|
| Same-culture majority environment | +0.01/tick | Agent lives in location where their culture is dominant |
| Cultural ritual/ceremony | +0.03 per event | Insider beat fires successfully |
| Faction cultural reinforcement | +0.02/tick | Faction has active cultural policy |
| Conquest cultural momentum | +0.05 per event | Conqueror's culture strengthened at newly taken location |

### Strength Decreases

| Cause | Rate | Condition |
|---|---|---|
| Different-culture environment | −0.005/tick | Agent lives in location of different dominant culture |
| Cultural isolation | −0.01/tick | No same-culture agents in local area |
| Traumatic worldview shattering | −0.1 per event | Specific scar traits can reduce cultural strength |
| Assimilation pressure | −0.01/tick | Dominant local culture is strong (≥0.6) and different |

### Budget Rebalancing

When an actor's cultural environment changes (moved to new location, conquered, exiled):

- The budget still sums to ≤1.0
- If a new culture gains influence, an existing one must fade
- Rate of change governed by:
  - **Existing cultural strength** — high = resistant to change
  - **Environmental pressure** — how dominant is the local culture?
  - **Actor's archetype** — True Believers resist change; Wanderers adapt faster
  - **Duration of exposure** — change accelerates over time (sigmoid curve, not linear)

### Conquest Dynamics (Emergent Classification)

When a location's current culture changes due to conquest, the system classifies the effect from observed actions rather than explicit player choice:

| Observable Pattern | Classification | Effect on Historical Culture | Rebellion Risk |
|---|---|---|---|
| Destroy cultural buildings, suppress insider beats | **Suppress** | Strength drops −0.03/tick | High — rebellion events spawn frequently |
| Maintain structures, allow mixed practice | **Coexist** | Strength holds steady | Low — but dual-culture tension narratives |
| Introduce own rituals, replace cultural traits | **Assimilate** | Strength drops −0.01/tick | Medium — identity-loss narratives spawn |
| Ignore cultural dimension entirely | **Neglect** | Strength holds or slowly rises | Medium-High — underground resurgence events |

Classification is post-hoc. The narrative engine observes tick-by-tick actions (building destruction events, ritual suppression, trait replacement) and computes a rolling classification. This feeds prose generation: "The Iron Lords have ruled Ashenmere for three cycles now. The old tongue is forbidden in the markets, but it thrives in the cellars."

## Tradeoffs and Rejected Alternatives

| Decision | Alternative Considered | Why Rejected |
|---|---|---|
| Culture as graph node | Separate culture subsystem alongside the graph | Culture must be central to stories; separate systems become invisible modifiers. The user's first principle: "if it is just a super invisible modifier… it is not worth having." |
| Budget model (≤1.0) | Unbounded cultural strength stacking | Unbounded creates cultural soup. The budget forces meaningful identity choices and natural tension between cultures. |
| 0–2 cultures per actor | Unlimited culture edges | Combinatorial explosion in trait interactions. Two cultures already create rich dual-identity tension; three+ becomes noise. |
| New `cultural` trait category | Extend existing trait categories | Cultural behavioral traits have unique mechanics (strength-gating) that don't fit existing categories. A dedicated category makes the system explicit and inspectable. |
| Composite modifiers (foundation+creation+biome) | Hand-authored cultural profiles | Hand-authoring doesn't scale. Composite modifiers generate unique cultures from ~32 seed sets while ensuring every culture takes color from its World-Soul and landscape context. |
| Emergent conquest classification | Explicit conquest policy choice | Explicit choices feel game-y and break immersion. Emergent classification observes what the player *does*, not what they *declare*, honoring the principle of narrative over mechanical perfection. |
| Formative + behavioral trait split | Single cultural trait type | Some cultural knowledge is permanent (skills learned in youth), while behavioral customs scale with cultural identity strength. Collapsing them loses this narratively important distinction. |
| Post-hoc conquest strategy labeling | No conquest dynamics | Conquest without cultural consequences would feel hollow. The system needs rebellion, assimilation, and resistance narratives to make the world feel alive. |

## Implementation Dependencies

This design builds on existing systems:

- **Graph model** — culture nodes and edges already exist in world-model.json (4 cultures, 12 edges)
- **Trait system** — needs `cultural` category added to `TraitCategory` union type
- **Narrative context pipeline** — already has `culturalPalette` field; needs enrichment
- **Content package pattern** — follows established `*-content.ts` pattern
- **World seeding** — needs culture generation step using composite modifiers

## Content Package: `culture-content.ts`

Estimated scope for the new content package:

- **~32 modifier definition sets** (4 foundation + 8 creation + ~20 biome)
- **~30–40 formative trait seed definitions**
- **~40–50 behavioral trait seed definitions**
- **~20–30 culture-gated beat definitions**
- **~15–20 sub-location templates**
- **~5–6 artifact lore sentence patterns**
- **Estimated size:** 800–1200 lines (comparable to enriched archetype-content.ts at 894 lines)
