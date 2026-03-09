# Content Package Audit Report
**Generated:** 2026-03-09
**Total data files audited:** 20 content packages
**Total lines:** 8,999
**Total unique entries:** 500+ (265+ named IDs)

---

## Quick Reference: Variant Counts by Package

| File | Lines | Variants | Coverage | Status |
|------|-------|----------|----------|--------|
| archetype-content.ts | 894 | 19 archetypes | Complete | ✓ Enriched |
| agenda-content.ts | 448 | 40 (5-6/type) | 8 types | ⚠ coincidence/omen thin |
| agenda-consequence-templates.ts | 526 | 240 (30/type) | 8 types | ✓ Well-balanced |
| mandate-content.ts | 1034 | 12 mandates | 3 per category | ✓ Complete |
| culture-content.ts | 1996 | 133 insider beats | 22 biomes | ⚠ underground/glacier thin |
| encounter-content.ts | 819 | 10 templates | 10 domains | ✓ Complete |
| narrative-content.ts | 642 | 120+ prose | 8 spheres | ✓ Well-covered |
| rival-content.ts | 359 | 40 actions (4/type) | 8 types | ⚠ Only 4 variants/type |
| scry-content.ts | 351 | 4 courts, 8 weaknesses | — | ⚠ weaknesses thin |
| domain-words.ts | 146 | 45 scales | Complete | ✓ Efficient |
| worldsoul-content.ts | 142 | 20 entries | Complete | ✓ Complete |
| intervention-feedback-content.ts | 169 | 24 consequences | 8 types | ✓ Good |
| opposition-content.ts | 112 | 3 matrices | All pairs | ✓ Dense |
| dream-content.ts | 204 | 8 intervention types | Complete | ✓ Complete |
| influence-content.ts | 65 | 5 tiers | Complete | ✓ Complete |
| doom-content.ts | 76 | 5 stages | Complete | ✓ Complete |
| ui-content.ts | 69 | 13 tooltips | HUD only | ✓ By design |
| hex-tile-assets.ts | 102 | 22 terrains + 12 spheres | Complete | ✓ Complete |
| game-theory-content.ts | 374 | 95 weights | 19×5 matrix | ✓ Complete |
| chronicler-content.ts | 471 | 108 entries | — | ⚠ sublocation thin |

---

## File-by-File Details

### archetype-content.ts (894 lines)
**NARRATIVE_ARCHETYPES:** 19 unique archetypes

Each contains:
- Story shape (e.g., "Rise, hubris, fall")
- Prose tone description
- 3-6 reach affinities
- Tone keywords (5+ adjectives, 5+ verbs, rhythm descriptor)
- 3-4 beat patterns with event types
- Vignette seeds (5-8 each)
- Narrative requirements

**Status:** ✓ Fully enriched with all supporting data layers
**Coverage:** Complete (one per major character archetype)

---

### agenda-content.ts (448 lines)
**AGENDA_TEMPLATES:** 40 total

Breakdown by intervention type:
- dream: 5 agendas
- persuade: 6 agendas
- deceive: 5 agendas
- intimidate: 5 agendas
- inspire_intervention: 6 agendas
- **coincidence: 4 agendas** ⚠
- **omen: 4 agendas** ⚠
- afflict_bless: 5 agendas

Each agenda contains:
- Narrative hook (player-facing flavor text)
- Value pair + direction (left/right pole)
- Behavior tag (for action selection)
- Reach boost (domain bonus)
- Archetype affinities

**Status:** Good overall, thin spots in coincidence/omen
**Thin Pools:** Coincidence and Omen only have 4 variants (others 5-6)
**Recommendation:** Expand coincidence/omen to 6 each (add fate/opportunity/prophecy variants)

---

### agenda-consequence-templates.ts (526 lines)
**AGENDA_CONSEQUENCE_TEMPLATES:** 240 total (30 per intervention type)

Structure:
- DREAM_CONSEQUENCES: 30 (3 reach categories × 10 prose variants)
- PERSUADE_CONSEQUENCES: 30
- DECEIVE_CONSEQUENCES: 30
- INTIMIDATE_CONSEQUENCES: 30
- INSPIRE_CONSEQUENCES: 30
- COINCIDENCE_CONSEQUENCES: 30
- OMEN_CONSEQUENCES: 30
- AFFLICT_BLESS_CONSEQUENCES: 30

**Status:** ✓ Excellent coverage (30 per type = comprehensive)
**Decay Hints:** Constants for decay curve behavior tuning

---

### mandate-content.ts (1034 lines)
**MANDATE_TEMPLATES:** 12 total

Organization:
1. **Graph-State Mandates (3):**
   - dominion_of_stone (settle settlement control)
   - web_of_allegiance (relationship bond mastery)
   - builder's_legacy (object creation dominance)

2. **Sphere Dominance Mandates (3):**
   - tide_of_life (life sphere prevalence)
   - entropic_cascade (entropy sphere dominance)
   - illumination (light sphere dominance)

3. **Narrative Mandates (3):**
   - ascendant's_champion (agent tier mastery)
   - devoted_circle (worship accumulation)
   - shadow_sovereign (shadow reach dominance)

Each mandate has 3 stages: setup → escalation → culmination

**Status:** ✓ Complete (3 per category)
**Conditions:** All use mechanically verifiable types (node_count, edge_count, sphere_weight, actor_tier)

---

### culture-content.ts (1996 lines) ★ LARGEST FILE
**FOUNDATION_MODIFIERS:** 4
- chaos (fluid hierarchy, personal honor)
- order (rigid roles, institutional justice)
- light (communal, transparency)
- darkness (initiation circles, secret tribunals)

**CREATION_SPHERE_MODIFIERS:** 8
- force, matter, energy, life, mind, spirit, time, entropy

**BIOME_MODIFIERS:** 22
- Water (4): ocean, coastal_shallows, lake, river
- Lowlands (4): grassland, farmland, wetland, savanna
- Highlands (4): mountains, plateau, badlands, glacier
- Forests (4): sparse_forest, dense_forest, jungle, swamp
- Special (6): volcanic, canyon, ruins, settlement, oasis, underground_cavern

**INSIDER_BEATS (Cultural Traits):** 133 entries

Each trait contains:
- id, name, description
- Source tags (foundation/sphere/biome origins)
- Strength thresholds (fanatical, strong, fading)
- Domain contributions
- Tags (spiritual, ritual, social, nature, material, temporal, philosophical)

**Thin Pools:**
- **Underground caverns:** Only 1-2 insider beats (should be 4-5 like ocean)
- **Glacier/tundra:** Only 3 insider beats (should be 5 like grassland)

**Other structures:**
- SUB_LOCATION_TEMPLATES: 18 (only 82% coverage for 22 biomes)
- ARTIFACT_LORE_PATTERNS: 6
- CULTURE_NAME_FRAGMENTS: Pattern templates
- CULTURAL_PROSE_PALETTES: 12 (foundation × creation sphere)
- CULTURAL_TENSION_TEMPLATES: 4

**Status:** Excellent overall, but geographic gaps in extreme biomes
**Recommendations:**
1. Add 3-4 underground cavern insider beats (mineral worship, depth reverence, void meditation)
2. Add 2-3 glacier/tundra insider beats (ice preservation, frozen memory, eternal winter reverence)
3. Add 4 more sublocation templates to reach full coverage

---

### encounter-content.ts (819 lines)
**ENCOUNTER_TEMPLATES:** 10 total

1. deep_descent (ruins, Iron/Shadow)
2. merchant_caravan (trade, Iron/Gold)
3. political_intrigue (negotiation, Heart/Eye)
4. arcane_breach (magic conflict, Veil/Spirit)
5. beast_hunt (creatures, Iron/Stone)
6. plague_outbreak (life crisis, Veil/Life)
7. rebellion (social, Heart/Shadow)
8. divine_omen (mystical, Veil/Star)
9. artifact_discovery (exploration, Eye/Spirit)
10. cultural_festival (celebration, Heart/Matter)

Each encounter has:
- 3 steps with escalating difficulty
- Success/failure narratives
- Reputation deltas per step
- Tier promotion eligibility

**ENCOUNTER_DIFFICULTY_TIERS:** 3
- early (0.8 multiplier)
- mid (1.0 multiplier)
- late (1.3 multiplier)

**Status:** ✓ Complete coverage of major domain types
**Note:** All encounters use standard 3-step pattern; could expand to 4-5 steps for late-game complexity

---

### narrative-content.ts (642 lines)
**SPHERE_VOCABULARY:** 8 spheres × 15 words per sphere = 120 total words

Each sphere has 5 adjectives, 5 verbs, 5 nouns

**ROUTINE_TEMPLATES:** ~15 event-type categories with 3-5 variants each

Categories include:
- action_resolved
- action_failed
- action_critical
- relationship_change
- bond_formed
- bond_broken
- discovery
- And 8+ others

Total: ~60+ routine prose templates

**NOTABLE_TEMPLATES:** ~15 event-type categories (mirrors ROUTINE with personality coloring)

Total: ~60+ notable prose templates

**LIFECYCLE_TEMPLATES:** 3 event types
- birth
- death
- migration

Each has 3-4 prose variants

**VALUE_FLAVORS:** 10 domain value pairs with flavor text
- ambition_contentment
- courage_prudence
- loyalty_treachery
- dominance_humility
- greed_generosity
- cruelty_compassion
- tradition_innovation
- And 3 more

**ARCHETYPE_EVENT_TEMPLATES:** 58+ templates (19 archetypes × 3+ event types)

**DILEMMA_STAKES_PROSE:** 12 prose variants (one per stakes level)

**SPHERE_INFLUENCE_EVENTS:** 12 (one per sphere)

**SEASONAL_VOCABULARY:** 4 (spring, summer, autumn, winter)

**ECHO_FLAVOR_TEXTS:** 12 echo resonance flavors

**STEALTH_DETECTION_PROSE:** 8 detection event prose

**Status:** ✓ Strong across all categories
**Coverage:** Well-distributed; no obvious thin pools

---

### rival-content.ts (359 lines)
**RIVAL_ACTION_TEMPLATES:** 40+ variants

Breakdown:
- blessing: 4 variants
- corruption: 4 variants
- theft: 4 variants
- sabotage: 4 variants
- revelation: 4 variants
- alliance_offer: 4 variants
- betrayal: 4 variants
- natural_disaster: 4 variants

Total: 32+ action variants

**RIVAL_PERSONALITY_PROFILES:** 8 profiles
- Ambitious, Chaotic, Mercurial, Vindictive
- Mysterious, Benevolent, Stoic, Zealous

**ACTION_TYPES:** 8

**BEHAVIOR_WEIGHTS:** Weights for each action type

**RIVAL_NAME_PREFIXES/SUFFIXES:** Fragment pools

**Status:** Good, but action variants are thin
**Thin Pools:** Only 4 variants per action type (recommend 5-6)
**Recommendation:** Expand each action type from 4 → 5-6 variants (+4-8 new entries)

---

### scry-content.ts (351 lines)
**COURT_STRUCTURES:** 4
- triumvirate (3 equal positions)
- hierarchy (1 apex, 2 lesser, 1 outcast)
- council (4 equal, rotating chair)
- duarchy (2 paired opposites, 1 wild card)

**POSITION_ARCHETYPES:** 5

**TITLE_FRAGMENTS:** 20+ fragments

**TITLE_TEMPLATES:** 5 pattern templates

**BONUS_RULES:** 8

**WEAKNESS_POOL:** 8 weakness types ⚠

**DOMAIN_DISPLAY_NAMES:** Reach domain display names

**Status:** Good variety from 4 structures × 5 positions × 20 titles
**Thin Pools:** WEAKNESS_POOL only has 8 types (recommend 12)
**Recommendation:** Expand weaknesses to 12 (add context-specific weakness categories)

---

### domain-words.ts (146 lines)
**DOMAIN_WORD_SCALES:** 9 reaches × 5 tiers = 45 total word scales

Each reach has verbal equivalents (I-V scale) instead of numeric values:
- Tier I: nascent/fledgling/whispered
- Tier II: developing/growing/known
- Tier III: established/confirmed/proven
- Tier IV: dominant/renowned/mastered
- Tier V: supreme/legendary/transcendent

**VALUE_WORD_MAP:** 10 value pairs with 5-word scales

**REPUTATION_WORDS:** 5 levels
- Despised → Tolerated → Neutral → Respected → Admired

**BOND_STRENGTH_WORDS:** 5 levels
- Unconnected → Acquainted → Familiar → Close → Intimate

**Status:** ✓ Complete and extremely data-efficient
**Notes:** One of most compact packages (146 lines = 45+ entries)

---

### worldsoul-content.ts (142 lines)
**FUNDAMENT_DESCRIPTIONS:** 12 entries

One description for each sphere pair combination in World-Soul fundament ledger

**RESONANCE_FRAGMENT_PROSE:** 8 prose pieces

Memory fragment flavor text for echo system

**Status:** ✓ Complete coverage

---

### intervention-feedback-content.ts (169 lines)
**CONSEQUENCE_TEMPLATES:** 24 total

Organized by intervention effect type with prose variants

**DIVINE_INFLUENCE_CONSTANTS:** 40 tunable values
- Decay rates
- Magnitude ranges
- Behavior modifiers

**SPHERE_AUDIO_CONFIG:** 12 (one per sphere)
- Pitch ranges
- Detection overlay colors

**Status:** ✓ Good coverage (3+ consequence templates per major intervention type)

---

### opposition-content.ts (112 lines)
**FOUNDATION_OPPOSITION_MATRIX:** 4×4 matrix

How foundation spheres oppose each other (e.g., chaos ↔ order, light ↔ darkness)

**CREATION_SPHERE_TENSIONS:** 8×8 matrix

Creation sphere tension weights

**ARCHETYPE_FRICTION_PAIRS:** 19×19 matrix

Which archetypes clash

**Status:** ✓ Complete via matrix lookup (all combinations covered)
**Notes:** Very dense package (112 lines, 3 full matrices)

---

### dream-content.ts (204 lines)
**MANIPULATION_DEFINITIONS:** 3 types
- fatigue
- emotion
- memory

**INTERVENTION_DEFINITIONS:** 8 types
- dream, persuade, deceive, intimidate
- inspire_intervention, coincidence, omen, afflict_bless

**TIER_MODIFIERS:** 5 (one per influence tier)

**Status:** ✓ Complete

---

### influence-content.ts (65 lines)
**TIER_NAMES:** 5
- Whisper → Breath → Voice → Echo → Avatar

**TIER_MAINTENANCE:** Maintenance costs

**TIER_PROMOTION_THRESHOLDS:** Promotion requirements

**Status:** ✓ Complete and compact

---

### doom-content.ts (76 lines)
**ARCHETYPE_STAGE_NAMES:** 5 doom stages

Unmaking progression stages

**DOOM_VOCABULARY:** 20+ vocabulary words

For doom prose coloring

**DEFAULT_THRESHOLDS:** 5 threshold values

**Status:** ✓ Complete

---

### ui-content.ts (69 lines)
**UI_TOOLTIPS:** 13 entries

- Core HUD (3): doom_bar, essence_panel, mandate_tracker
- Avatar Actions (3): avatar_move, avatar_wheel, avatar_scry
- Simulation Controls (2): sim_play_pause, sim_speed
- Panels (5): rival_panel, retinue_panel, debug_panel, etc.

**Status:** ✓ Intentionally minimal (HUD-level tooltips only)
**Note:** Detail tooltips (sphere, reach, archetype) resolved from their respective packages

---

### hex-tile-assets.ts (102 lines)
**TERRAIN_TILE_MAP:** 22 terrain types

Asset paths for all biome tiles

**MAGIC_OVERLAY_MAP:** 12 sphere magic overlays

Sphere color/form overlays

**OVERLAY_ICON_MAP:** 8+ icon references

**Status:** ✓ Complete (all terrain types, all spheres)

---

### game-theory-content.ts (374 lines)
**ARCHETYPE_STRATEGY_WEIGHTS:** 19 archetypes × 5 strategies = 95 total weights

For cooperation strategy selection

**SOCIAL_ORIENTATION_MAP:** Orientation weights

**Status:** ✓ Complete (all archetypes × all strategies)

---

### chronicler-content.ts (471 lines)
**CHRONICLER_VIGNETTES:** 15 vignettes

**SUBLOCATION_FLAVOR:** 14 sublocation flavor descriptions ⚠

Only 64% coverage for 22 biomes (need 22)

**ARTIFACT_LORE:** 30 artifact lore entries

**LOCATION_TYPE_FLAVOR:** 15 location type flavor descriptions

**MAGIC_TRADITION_FLAVOR:** 34 magic tradition flavor descriptions

**Status:** Good across categories
**Thin Pools:**
- SUBLOCATION_FLAVOR: 14 for 22 biomes (need +8)
- CHRONICLER_VIGNETTES: 15 (could expand to 20-25)

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total lines | 8,999 |
| Total packages | 20 |
| Total unique entries | 500+ |
| Named IDs | 265+ |
| Largest file | culture-content.ts (1,996 lines) |
| Smallest file | influence-content.ts (65 lines) |
| Most entries | agenda-consequence-templates.ts (240) |
| Most efficient | opposition-content.ts (112 lines, 3 matrices) |

---

## Coverage Assessment

### Well-Covered Categories ✓

| Category | Count | Status |
|----------|-------|--------|
| Archetypes | 19 | Complete (one per major type) |
| Agendas | 40 | Good (5-6 per intervention type) |
| Consequence prose | 240 | Excellent (30 per type) |
| Sphere vocabulary | 120 | Complete (8 × 15 words) |
| Narrative templates | 120+ | Strong (routine + notable) |
| Cultural traits | 133 | Excellent (insider beats) |
| Biome modifiers | 22 | Complete |
| Encounter types | 10 | Complete (major domains) |
| Mandates | 12 | Complete (3 per category) |
| Opposition matrices | 64+ | Complete (all pairs) |

### Thin Pools (fewer than 4-5 variants) ⚠

| Category | Current | Recommended | Gap |
|----------|---------|-------------|-----|
| Coincidence agendas | 4 | 6 | +2 |
| Omen agendas | 4 | 6 | +2 |
| Rival action variants | 4 | 5-6 | +1-2 |
| Scry weaknesses | 8 | 12 | +4 |
| Sublocation templates | 14 | 22 | +8 |
| Underground traits | 1-2 | 4-5 | +3-4 |
| Glacier/tundra traits | 3 | 5+ | +2-3 |
| Chronicler vignettes | 15 | 20-25 | +5-10 |
| Magic tradition flavor | 34 | 50+ | +16 |

---

## Expansion Recommendations

### IMMEDIATE (2-3 entries each)
1. **Coincidence agendas:** Expand 4 → 6
   - Add fate/opportunity angle variants
   - Example: "Serendipity's Gift", "Chance Convergence"

2. **Omen agendas:** Expand 4 → 6
   - Add warning/prophecy/doom variants
   - Example: "Shadow Omens", "Prophetic Dread"

3. **Rival actions:** Expand 4 → 5-6 per type
   - Add context-specific variants per action type
   - Total expansion: +4-8 entries

4. **Scry weaknesses:** Expand 8 → 12
   - Add context-specific weakness categories
   - Example: ambition traps, secret vulnerabilities

### SHORT-TERM (expand thin biome regions)
5. **Underground cavern insider beats:** Add 3-4 new traits
   - Mineral worship
   - Depth reverence
   - Void meditation
   - Subterranean isolation

6. **Glacier/tundra insider beats:** Add 2-3 new traits
   - Ice preservation
   - Frozen memory
   - Eternal winter reverence

7. **Sublocation templates:** Add 8 to reach full 22-biome coverage
   - One template type per biome

### MEDIUM-TERM (content enrichment)
8. **Chronicler vignettes:** Expand 15 → 20-25
   - Add 5-10 new vignettes for diverse encounter flavor

9. **Magic tradition flavors:** Expand 34 → 50+
   - Currently adequate but thin for magic system depth
   - Add 16+ new tradition flavors

10. **Rare encounter types:** Add 2-3 specialized encounters
    - Boss-level encounters
    - Catastrophic events
    - Miraculous manifestations

---

## Structural Health

| Aspect | Status | Notes |
|--------|--------|-------|
| Overall balance | Good | Major categories well-covered |
| Geographic coverage | Mixed | Extreme biomes under-represented |
| Intervention types | Excellent | All 8 types have 30+ consequences each |
| Prose variety | Strong | 120+ narrative templates across tiers |
| Archetype coverage | Complete | 19 unique archetypes fully enriched |
| Opposition systems | Complete | All pairs covered by matrix lookup |
| Content efficiency | Good | Most packages 100-400 lines |
| Tunability | Excellent | 40+ constants for flavor tuning |

---

## Key Insights

1. **culture-content.ts is the content anchor:** At 1,996 lines with 133 insider beats, it drives most world flavor. Geographic gaps here propagate through the system.

2. **agenda-consequence-templates.ts is exceptionally well-balanced:** 240 entries = 30 per intervention type is the gold standard for variety.

3. **Thin pools are predictable:** Coincidence/omen agendas (4) and rival actions (4 per type) suggest these systems were populated first and not expanded as others grew.

4. **Opposition matrices are genius:** Using 4×4, 8×8, and 19×19 matrices to avoid 64+ manual entries is smart design.

5. **UI content is intentionally minimal:** Only 13 tooltips by design — detail resolution delegated to other packages avoids duplication.

6. **Most expansion opportunities are in breadth, not depth:** Adding 8 sublocation templates, 4 underground traits, etc., is low-hanging fruit.

---

## Files Worth Reading First

If expanding content, prioritize these files for understanding:
1. `/src/data/culture-content.ts` — Understand insider beat structure
2. `/src/data/agenda-consequence-templates.ts` — Understand prose organization (your gold standard)
3. `/src/data/narrative-content.ts` — Understand event-type template patterns
4. `/src/data/archetype-content.ts` — Understand enrichment pattern for future archetype-adjacent content

