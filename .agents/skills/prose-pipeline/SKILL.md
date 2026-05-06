---
name: prose-pipeline
description: >
  Resolver architecture and pipeline guide for the graph-walking prose
  generator. Covers the 4-system pipeline overview, graph-walking resolver
  implementation, ProseLayer interface, resolver registry tables, composition
  constants, prose cache, how to write a new resolver, writing guidelines
  (Threadbare aesthetic), content authoring checklist, and PRNG seed offsets.
  Load when implementing a new resolver, modifying the prose pipeline
  architecture, or understanding how entity descriptions are generated.
  NOT needed for adding content to existing systems (use prose-content-systems
  instead). Triggers on "new resolver", "prose generator", "ProseLayer",
  "prose composer", "prose pipeline", "prose architecture", "graph-walking",
  "resolver registry".
model: opus
---

# Prose Pipeline — Resolver Architecture Guide

This skill covers the **graph-walking prose generator architecture**: how resolvers work, how to implement new ones, and the Threadbare writing aesthetic. Load `prose-content-systems` for adding encounter templates, faction content, or spell flavor text. Load `prose-vignettes-and-enrichment` for enrichment placeholders and vignette authoring.

> **See also:** `Docs/plans/2026-04-16-systemic-wiring-guide.md` — explains the other side of the prose-to-graph bridge: how encounter outcomes *create* the graph state that resolvers later walk. Resolvers consume graph data; encounters produce it. Both skills together form the full loop.

## Step 0: Canon-First Pre-Read

Before doing any work in this skill, read [`Docs/canon/prose.md`](../../../Docs/canon/prose.md) first. The Canon page is the Step-0 entrypoint for all prose-domain authoring: it identifies the four pipelines, points to the active design plans and engine wiring, asserts the Threadbare voice rules, and lists current rejected approaches. Skim it once, then return here for resolver-architecture detail. If a pointer in this skill disagrees with the Canon page, the Canon page wins and this skill needs an update — open a `drift-scan`-labeled Linear issue.

## Architecture Overview

Prose generation is a **multi-layer pipeline** where content flows through four distinct systems:

```
Graph-Walking Resolvers → Prose Composer → Final Entity Description
Narrative Engine       → Sphere-Flavored Event Prose
Vignette Generator     → Encounter Step Narratives
Prose Enrichment       → Dynamic Placeholder Injection
```

Each system draws from **data tables in `src/data/`**, never hardcoded strings in engine code.

---

## System 1: Graph-Walking Prose Generator

**Files:** `src/engine/proseGenerator.ts`, `src/engine/proseResolvers.ts`, `src/engine/proseComposer.ts`
**Content:** `src/data/prose-layer-content.ts`
**Types:** `src/types/prose.ts`
**Design doc:** `Docs/plans/2026-03-09-prose-generator-framework-design.md`

### How It Works

1. `generateEntityProse(nodeId, graph, seed, mode, tick)` is the public API
2. It looks up resolvers based on node type (location, actor, faction)
3. Each resolver **walks graph edges** from the target node and returns `ProseLayer[]`
4. The composer sorts by priority, caps per category (max 2), and joins into paragraphs

### Resolver Registry

**Location resolvers** (10 total, in priority order):

| Resolver | Priority | Category | Graph Walk | Content Table |
|----------|----------|----------|-----------|---------------|
| `subtypeResolver` | 90 | origin | node properties → `locationSubtype` | `SUBTYPE_ESTABLISHING_PROSE` |
| `biomeResolver` | 80 | atmosphere | `located_at` → hex → terrain | `BIOME_PROSE` |
| `resourcesResolver` | 65 | economic | `produces` edges → resource nodes | `RESOURCE_PROSE` (from `resource-content.ts`) |
| `cultureResolver` | 60 | origin | `influenced_by` → culture node | `CULTURE_LOCATION_PROSE`, `HISTORICAL_CULTURE_PROSE`, `REGION_ETYMOLOGY_PROSE` |
| `sphereResolver` | 55 | atmosphere | `influenced_by` → culture → spheres | `SPHERE_LOCATION_PROSE` |
| `factionResolver` | 50 | tension | `controlled_by` → faction node | `FACTION_CONTROL_PROSE` |
| `guildIdentityResolver` | 48 | character | `member_of` → guild → identity | `GUILD_IDENTITY_PROSE` |
| `populationResolver` | 45 | economic | node properties → population + prosperity | `POPULATION_PROSE_TEMPLATES`, `PROSPERITY_PROSE`, `PROSPERITY_TERRAIN_PROSE` |
| `tradeRouteResolver` | 40 | economic | `trade_route` edges → partner nodes | `TRADE_ROUTE_VOLUME_PROSE`, `TRADE_ROUTE_GOODS_PROSE`, `TRADE_ROUTE_STATUS_PROSE`, `TRADE_ROUTE_CROSSROADS_PROSE` |
| `locationEncounterHistoryResolver` | 40 | atmosphere | `occurred_at` edges from event nodes | `LOCATION_ENCOUNTER_HISTORY_PROSE` |

**Actor resolvers** (6 total):

| Resolver | Priority | Category | Graph Walk | Content Table |
|----------|----------|----------|-----------|---------------|
| `archetypeResolver` | 70 | character | `archetype` property | `ARCHETYPE_PROSE` (from `archetype-content.ts`) |
| `agentCultureResolver` | 60 | origin | `member_of` → culture node | `CULTURE_LOCATION_PROSE` (reused) |
| `agentFactionResolver` | 55 | tension | `member_of` → faction edges | `FACTION_CONTROL_PROSE` (reused) |
| `wealthResolver` | 45 | economic | `wealth` property → tier | `WEALTH_PROSE` |
| `dispositionResolver` | 40 | character | `disposition` property | `DISPOSITION_PROSE` |
| `agentEncounterBiographyResolver` | 35 | character | `participated_in` → event nodes | `AGENT_ENCOUNTER_BIOGRAPHY_PROSE` |

**Faction resolvers** (1 total):

| Resolver | Priority | Category | Graph Walk | Content Table |
|----------|----------|----------|-----------|---------------|
| `guildFactionIdentityResolver` | 70 | character | node properties → `guildType` | `GUILD_IDENTITY_PROSE` |

### ProseLayer Interface

```typescript
interface ProseLayer {
  text: string;        // The prose fragment
  priority: number;    // Higher = more likely to survive composition (0-100)
  category: ProseCategory;  // Grouping for per-category caps
  source: string;      // Resolver name for debug tracing
}

type ProseCategory = 'origin' | 'atmosphere' | 'character' | 'economic' | 'tension' | 'history';
```

### Composition Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `MAX_LAYERS_PER_CATEGORY` | 2 | Max layers per category in composed output |
| `FULL_MAX_PARAGRAPHS` | 6 | Max total paragraphs in 'full' mode |
| `SUMMARY_MAX_CHARS` | 200 | Truncation limit for 'summary' mode |
| `CULTURE_FLAVOR_CHANCE` | 0.4 | Probability of cultural vocabulary substitution |

### Prose Cache

Module-level cache keyed by `${nodeId}:${tick}:${mode}`. Auto-evicts all entries when tick advances. Prevents redundant resolver calls on same-tick panel re-opens.

### How to Write a New Resolver

1. **Add content table** to `src/data/prose-layer-content.ts` (or a separate content file)
2. **Write resolver function** in `src/engine/proseResolvers.ts`:
   - Accept `(nodeId, graph, seed)` → return `ProseLayer[]`
   - Walk graph edges from `nodeId` to find relevant data
   - Use `pickTemplate(templates, seed + UNIQUE_OFFSET)` for deterministic selection
   - Return `[]` on any missing data (fail-soft)
3. **Register** in `src/engine/proseGenerator.ts` → appropriate `*_RESOLVERS` array
4. **Export** the resolver from `proseResolvers.ts` and import in `proseGenerator.ts`

### Template Placeholder Syntax

Content tables use `{placeholder}` syntax resolved by each resolver:

```
{name}     → Entity name
{count}    → Numeric count
{them}     → Gendered pronoun (him/her/them)
{terrain}  → Terrain type name
{sphere}   → Sphere name
{faction}  → Faction name
{goods}    → Trade goods description
```

Each resolver calls `replacePlaceholder(template, key, value)` for substitution.

---

## Writing Guidelines

### Tone: The Threadbare Aesthetic

All prose follows the project's aesthetic:
- **Dark world, hidden magic, threads that break through**
- Short, declarative sentences with one vivid detail
- No exclamation marks, no breathless enthusiasm
- Wear and age over polish and perfection
- The uncanny over the fantastic
- Dry wit over comedy; irony over sentimentality

### Content Authoring Checklist

When adding new prose content:

- [ ] **Minimum 3-5 variants** per key in content tables (avoids repetition)
- [ ] **Use `{placeholder}` syntax** — never hardcode entity names
- [ ] **Seeded PRNG** for variant selection — use unique seed offsets per resolver
- [ ] **Fail-soft** — resolver returns `[]` on any missing data, never throws
- [ ] **Priority 0-100** — higher survives composition. Check existing ranges to avoid collisions
- [ ] **Category balance** — max 2 per category in output. Don't overload one category
- [ ] **Test with CLI** — run `npm run cli`, advance ticks, inspect agents/locations to verify prose appears
- [ ] **No orphan content** — every table must have a resolver that uses it, registered in the generator

### PRNG Seed Offset Convention

Each resolver uses `seed + OFFSET` for deterministic variant selection. Existing offsets:

| Offset Range | Used By |
|-------------|---------|
| 0-99 | biomeResolver, subtypeResolver |
| 100-199 | cultureResolver |
| 200-299 | sphereResolver |
| 300-399 | factionResolver |
| 1000-1099 | populationResolver |
| 2000-2099 | tradeRouteResolver |
| 3000-3099 | resourcesResolver |
| 5000-5099 | guildIdentityResolver |
| 7700-7799 | locationEncounterHistoryResolver |
| 7710-7799 | agentEncounterBiographyResolver |

**New resolvers** should claim a unique range and document it here.
