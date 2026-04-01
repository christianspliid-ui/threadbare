# Content Files Reference

All prose content lives in `src/data/`. Load this when hunting for a specific content table or adding a new one.

| File | Key Tables | Used By |
|------|-----------|---------|
| `prose-layer-content.ts` | `BIOME_PROSE`, `CULTURE_LOCATION_PROSE`, `SPHERE_LOCATION_PROSE`, `SUBTYPE_ESTABLISHING_PROSE`, `FACTION_CONTROL_PROSE`, `POPULATION_PROSE_TEMPLATES`, `PROSPERITY_PROSE`, `PROSPERITY_TERRAIN_PROSE`, `WEALTH_PROSE`, `GUILD_IDENTITY_PROSE`, `TRADE_ROUTE_*_PROSE`, `GEOGRAPHIC_REGION_*_PROSE`, `LOCATION_ENCOUNTER_HISTORY_PROSE`, `AGENT_ENCOUNTER_BIOGRAPHY_PROSE` | Graph-walking resolvers |
| `narrative-content.ts` | `SPHERE_VOCABULARY`, `ROUTINE_TEMPLATES`, `NOTABLE_TEMPLATES`, `VALUE_FLAVORS` | Narrative engine |
| `culture-content.ts` | `CULTURAL_PROSE_PALETTES` | Cultural prose flavoring |
| `archetype-content.ts` | `ARCHETYPE_PROSE` | Archetype resolver |
| `backstory-content.ts` | `BACKSTORY_LAYERS` | Backstory system |
| `resource-content.ts` | `RESOURCE_PROSE` | Resources resolver |
| `encounter-content.ts` | 115 encounter templates | Encounter system |
| `faction-encounter-content.ts` | Faction-gated encounters | Faction encounter pipeline |
| `*-encounter-content.ts` (10 files) | Per-faction encounter packages | Faction-specific encounters |
| `social-encounter-content.ts` | Social/meeting encounters | Social encounter system |
| `army-encounter-content.ts` | Military encounters | Army encounter system |
| `monster-encounter-content.ts` | Creature encounters | Monster encounter system |
| `mercenary-encounter-content.ts` | Hired combat encounters | Mercenary system |
| `borderland-encounter-content.ts` | Frontier/wilderness encounters | Borderland system |
| `siege-encounter-content.ts` | Siege encounters | Siege system |
| `encounter-anomaly-content.ts` | Supernatural encounters | Anomaly system |
| `battle-spotlight-content.ts` | Battle narratives | Battle spotlight system |
| `spell-templates.ts` | 5 spell templates with flavor | Effect system |
| `reward-attachment-catalog.ts` | Named attachments with descriptions | Reward system |
| `anomaly-reward-catalog.ts` | Anomaly-specific rewards | Anomaly rewards |
| `artifact-templates.ts` | Named artifact templates | Artifact generation |
| `unified-action-templates.ts` | Action templates (122KB) | Action system |
| `action-template-content.ts` | Encounter step actions | Action resolution |
| `agenda-content.ts` | Agent agenda flavor | Agenda system |
| `reputation-trait-content.ts` | Reputation-derived traits | Trait system |
| `movement-content.ts` | Terrain/location movement costs | Movement system |
