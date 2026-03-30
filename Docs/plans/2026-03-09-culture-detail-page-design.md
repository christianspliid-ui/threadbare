# Culture Detail Page & Generic Entity Detail System — Design Doc

**Date:** 2026-03-09
**Status:** Approved
**Scope:** Generic two-tier entity detail UI, culture-specific content, procedural flag generation, concept art pipeline, content asset strategy

---

## 1. Problem

The game has rich culture data (CultureIdentity with 11 fields, cultural tension detection, insider beats, belongs_to graph edges) but no way for the player to see it. Cultures are invisible — you can't learn about a people's origins, social structure, material traditions, or important members.

Meanwhile, the two-tier agent detail pattern (AgentInfoCard → AgentProfileModal) is hardcoded to agents. Adding cultures, factions, armies, or any other entity type would mean building new sidebar cards and modal pages from scratch each time.

## 2. Decisions

### Decision 1: Generic Entity Detail Framework

**Chosen:** Extract the two-tier pattern into generic `EntityCard` (sidebar) and `EntityCodexPage` (full-screen modal) components. Each entity type provides a config + aggregator; the UI components render any entity.

**Rejected:** Building bespoke culture components. Reason: we know factions, armies, and parties will need the same pattern. Invest in the generic system now.

**Shape:**
- `EntitySection` descriptor: `{ id, title, insightTier, proseVoice, prose, structuredData? }`
- `StructuredBlock` discriminated union: `member_list | trait_grid | territory_summary | keyword_cloud | bond_list | domain_grid | timeline`
- `EntityDetailConfig<T>`: maps entity data `T` → `EntitySection[]` for both card and codex tiers
- Existing `AgentInfoCard` and `AgentProfileModal` become thin config objects feeding the generic system

### Decision 2: Culture Names Clickable Everywhere

**Chosen:** Culture names are interactive links wherever they appear — agent info cards, location views, hex tooltips, retinue panel badges. All lead to the same culture EntityCard → EntityCodexPage flow.

**Rejected:** Dedicated culture list panel (premature), map-only discovery (too narrow).

### Decision 3: Hybrid Cultural Insight

**Chosen:** Cultural insight is a hybrid score fed by multiple sources, with different sources revealing different *kinds* of information:

| Source | Insight gain | What it reveals |
|--------|-------------|-----------------|
| Territory visits | +0.02 per visible hex in their territory | Origins, homeland, architecture |
| Member familiarity | Aggregate of belongs_to agent familiarities × 0.1 | Figures of note, social dynamics |
| Scry on members | +0.15 per scry | Internal tensions, power structures |
| Interventions in territory | +0.10 per intervention | Material culture, daily life |
| Worshippers from culture | +0.05 per tick per worshipper | The Inner Voice (oral tradition) |

Stored as `culturalInsightMap: Map<string, number>` on GameState, parallel to `familiarityMap`.

### Decision 4: Prose Voice Progression

**Chosen:** Two voices that shift based on insight tier:

- **Scholarly chronicle** (stranger → known): Third-person, formal, distanced. "The Keepers of the Lore Wastes trace their origins to the first drought-readers who mapped the aquifers beneath the dunes..."
- **Oral tradition** (intimate → transparent): First-person plural, mythic, intimate. "We are the children of the masked ice. Our mothers learned to read the aurora before they learned to speak..."

The transition happens at `intimate` tier. This voice shift IS the reward for deep cultural exploration.

### Decision 5: Prose-Led with Structured Anchors

**Chosen:** Each section opens with a narrative paragraph (chronicle or oral tradition voice), followed by a compact structured element (member list, trait grid, keyword cloud, territory summary). The prose tells the story, the structure gives the data.

### Decision 6: Flag (SVG, procedural) + Concept Art (Imagen, pipeline)

**Two distinct visual assets per culture:**

**Flag/Emblem:**
- Generated at world seeding time by `generateCultureFlag(identity, rng)` → SVG string
- Stored on culture graph node as a property (no external file)
- Visible at `stranger` tier — the first thing you see
- Used everywhere: sidebar headers, codex headers, agent cards (small badge), hex tooltips, location views, retinue panel pips
- Shape vocabulary from foundation (chaos = asymmetric/jagged, order = geometric/symmetric, light = radial/open, darkness = layered/enclosed)
- Colors from venerated spheres via `getSphereColor()`
- Motif glyph from biome (mountain peak, wave, tree, etc.)

**Concept Art:**
- Imagen-generated during content pipeline (offline), NOT at runtime
- Stored in `public/culture-art/` as tagged PNG assets
- Visible at `recognised` tier on codex page only
- Hero image below header, above first prose section
- Prompt built from: materialVocabulary (objects), biome climate (environment), behavioralKeywords (mood), foundation (lighting), spheres (magic color)

### Decision 7: Content Asset Strategy (Project-Wide)

**Principle:** The app ships with pre-generated static assets. Content generation (Imagen, LLM prose) happens in the build/pipeline phase between releases, never at runtime. The game matches entities to pre-generated content by identity keys.

**Concept art keying:** `foundation × primary_sphere × climate_group` = 4 × 8 × 4 = **128 images**. Each culture maps to its closest key. Multiple cultures can share the same image if they share the same key.

**Climate groups (expandable):**

```typescript
export type ClimateGroup = 'cold' | 'temperate' | 'warm_dry' | 'warm_wet';

export const BIOME_CLIMATE_MAP: Record<TerrainType, ClimateGroup> = {
  // Cold
  tundra: 'cold',
  ice_field: 'cold',
  glacier: 'cold',
  mountain: 'cold',
  // Temperate
  forest: 'temperate',
  grassland: 'temperate',
  hills: 'temperate',
  wetland: 'temperate',
  river: 'temperate',
  lake: 'temperate',
  deciduous_forest: 'temperate',
  // Warm & Dry
  desert: 'warm_dry',
  savanna: 'warm_dry',
  volcanic: 'warm_dry',
  badlands: 'warm_dry',
  mesa: 'warm_dry',
  scrubland: 'warm_dry',
  // Warm & Wet
  swamp: 'warm_wet',
  jungle: 'warm_wet',
  tropical_coast: 'warm_wet',
  coral_reef: 'warm_wet',
  mangrove: 'warm_wet',
  rainforest: 'warm_wet',
};

export const DEFAULT_CLIMATE: ClimateGroup = 'temperate';

/** Get climate group for a terrain type. Falls back to temperate for unknown biomes. */
export function getClimateGroup(terrain: TerrainType): ClimateGroup {
  return BIOME_CLIMATE_MAP[terrain] ?? DEFAULT_CLIMATE;
}
```

Adding a new biome = adding one line to `BIOME_CLIMATE_MAP`. If omitted, defaults to `temperate`. No generation logic changes needed.

**Content tier fallback:** Cultures get the best available content — pre-generated rich asset if a matching `foundation × sphere × climate` entry exists, generic climate-based fallback if not.

**Prose generation:** Same principle. Rich founding myths and chronicle paragraphs can be LLM-generated during pipeline and stored in a content package keyed by identity parameters. Template-based prose (slot-filling from existing narrative engine) serves as the runtime fallback for unmatched combinations.

## 3. Culture Section Layout

### Sidebar Card (EntityCard)

| Section | Insight Tier | Voice | Prose | Structured |
|---------|-------------|-------|-------|------------|
| Header | `stranger` | — | Culture name, foundation glyph, sphere dots, **flag** | — |
| Whispered Rumors | `stranger` | chronicle | 1-2 fragment sentences: "Little is known of this people, save that they venerate [sphere] and dwell among [biome]..." | — |
| Social Structure | `recognised` | chronicle | socialStructure + accountability woven into a prose sentence | — |
| Material Culture | `known` | chronicle | Brief sentence about their craft traditions | `keyword_cloud` — materialVocabulary |

### Codex Page (EntityCodexPage)

| Section | Insight Tier | Voice | Prose | Structured |
|---------|-------------|-------|-------|------------|
| Header | `stranger` | — | Name, flag (large), foundation + sphere badges | — |
| **Concept Art** | `recognised` | — | — | Hero image (Imagen, pipeline-generated) |
| Origins | `stranger` | chronicle | Founding myth paragraph (pre-generated or template) | `territory_summary` — origin biome + homeland hexes |
| Social Order | `recognised` | chronicle | How power works, how justice works | `trait_grid` — formative trait seeds |
| Ways & Materials | `known` | chronicle → oral | Material culture, craft traditions, daily life | `keyword_cloud` — materialVocabulary + behavioralKeywords |
| Figures of Note | `known` | chronicle | Highest-tier members, faction leaders | `member_list` — top 5 by tier |
| Living History | `intimate` | oral | Current encounters, recent dilemmas in their territory | `timeline` — last N significant events |
| The Inner Voice | `transparent` | oral | Metaphor palette woven into mythic self-portrait — "We are the children of..." | `keyword_cloud` — metaphorPalette |

## 4. Generic Entity Framework Types

```typescript
/** Prose voice for entity sections */
type ProseVoice = 'chronicle' | 'oral' | 'rumor' | 'divine';

/** A single section in an entity detail view */
interface EntitySection {
  id: string;
  title: string;
  insightTier: KnowledgeLevel;
  proseVoice: ProseVoice;
  prose: string;
  structuredData?: StructuredBlock;
}

/** Structured data block types — discriminated union */
type StructuredBlock =
  | { type: 'member_list'; members: MemberEntry[] }
  | { type: 'trait_grid'; traits: TraitEntry[] }
  | { type: 'territory_summary'; locations: LocationEntry[] }
  | { type: 'keyword_cloud'; keywords: string[]; accent: string }
  | { type: 'bond_list'; bonds: BondEntry[] }
  | { type: 'domain_grid'; domains: DomainEntry[] }
  | { type: 'timeline'; events: TimelineEntry[] }

/** Entity header data — common across all entity types */
interface EntityHeader {
  name: string;
  subtitle?: string;
  iconSvg?: string;       // SVG string for flag/emblem
  accentColor: string;
  badges?: EntityBadge[];
}

/** Full entity detail descriptor — what the generic components render */
interface EntityDetail {
  header: EntityHeader;
  cardSections: EntitySection[];    // for sidebar EntityCard
  codexSections: EntitySection[];   // for full-screen EntityCodexPage
  heroImageUrl?: string;            // concept art (codex only)
  heroImageTier?: KnowledgeLevel;   // insight tier to reveal hero image
}

/** Config that maps raw entity data to EntityDetail */
interface EntityDetailConfig<TData> {
  getDetail: (data: TData, insightLevel: KnowledgeLevel) => EntityDetail;
}
```

## 5. Migration Path for Existing Agent Components

`AgentInfoCard` and `AgentProfileModal` will be **replaced** by:
1. An `agentDetailConfig: EntityDetailConfig<AgentData>` that maps agent data to `EntityDetail`
2. `EntityCard` rendering the card sections
3. `EntityCodexPage` rendering the codex sections

This is a direct replacement — same data, same visual sections, but rendered by the generic system. The agent's existing sections (domain grid, values compass, bonds, archetype, disposition) map cleanly into the `StructuredBlock` types.

## 6. Future Entity Types

Once the generic system exists, adding a new entity type requires:
1. A data aggregator: `getFactionDetail(graph, factionId, insightLevel)` → raw data
2. A config: `factionDetailConfig: EntityDetailConfig<FactionData>`
3. Content data: prose templates, section definitions
4. A flag generator variant (if the entity type warrants its own emblem)

No new UI components needed.
