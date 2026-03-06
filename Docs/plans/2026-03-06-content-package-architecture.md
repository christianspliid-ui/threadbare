# Content Package Architecture — Unified Story Engine Content Management

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract all narrative text, configuration data, and flavor content from scattered engine/type files into a consistent set of `src/data/*-content.ts` content packages, following the proven pattern established by `scry-content.ts` and `mandate-content.ts`.

**Architecture:** Each game system gets a dedicated content package file (`src/data/{system}-content.ts`) that owns all tunable text, names, templates, and configuration data for that system. Engine files import from these packages and contain only logic. Type files contain only type definitions (no `const` data exports). The existing `world-model.json` continues to own structural graph data (nodes + edges).

**Tech Stack:** TypeScript, existing project patterns

---

## 1. Problem Statement

Narrative text, game configuration, and flavor content are currently scattered across 4 different kinds of files with no consistent pattern:

| Location | Example | Problem |
|---|---|---|
| Inline in engine code | `narrative.ts` has `ROUTINE_TEMPLATES`, `NOTABLE_TEMPLATES`, `VALUE_FLAVORS` (~100 lines of content data mixed into a 290-line engine file) | Can't tune content without reading through engine logic |
| Inline in type files | `narrative.ts` has `SPHERE_VOCABULARY`, `dream.ts` has `MANIPULATION_DEFINITIONS` and `INTERVENTION_DEFINITIONS`, `doomClock.ts` has `DOOM_STAGE_NAMES`, `rival.ts` has `RIVAL_NAME_PREFIXES/SUFFIXES` | Type files should define shapes, not hold tunable data |
| Dedicated content files | `scry-content.ts`, `mandate-content.ts` | ✅ This is the right pattern — but only 2 systems use it |
| Structural graph | `world-model.json` | ✅ Correct for structural data — but doesn't cover prose/text content |

**The two content files that exist (`scry-content.ts`, `mandate-content.ts`) are excellent.** They have clear `CONTENT MANAGER` headers, sectioned organization, and clean separation from engine logic. The goal is to apply this pattern everywhere.

### Content Surfaces Inventory

Here is every content surface in the codebase, where it currently lives, and where it should live:

| Content Surface | Current Location | Lines | Target Content Package |
|---|---|---|---|
| Routine prose templates (11 event types) | `engine/narrative.ts` | ~70 | `narrative-content.ts` |
| Notable prose templates (5 event types) | `engine/narrative.ts` | ~30 | `narrative-content.ts` |
| Value pair flavor clauses (10 pairs) | `engine/narrative.ts` | ~20 | `narrative-content.ts` |
| Sphere vocabulary (8 spheres × 3 categories) | `types/narrative.ts` | ~40 | `narrative-content.ts` |
| Manipulation definitions (6 types) | `types/dream.ts` | ~50 | `dream-content.ts` |
| Intervention definitions (8 types) | `types/dream.ts` | ~80 | `dream-content.ts` |
| Tier modifiers, delivery range, local encounter | `types/dream.ts` | ~15 | `dream-content.ts` |
| Doom archetype stage names (7 × 5) | `engine/doomClock.ts` | ~10 | `doom-content.ts` |
| Doom stage thresholds | `engine/doomClock.ts` | ~3 | `doom-content.ts` |
| Rival name prefixes + suffixes (12+12) | `types/rival.ts` | ~10 | `rival-content.ts` |
| Rival behavior list + behavior weights | `engine/rival.ts` | ~15 | `rival-content.ts` |
| Tier names | `types/influence.ts` | ~8 | `influence-content.ts` |
| Scry court structures, archetypes, titles, etc. | `data/scry-content.ts` | ~350 | ✅ Already correct |
| Mandate templates | `data/mandate-content.ts` | ~varies | ✅ Already correct |

**Total content to move:** ~350 lines across 5 new content packages.

## 2. The Content Package Pattern

Every content package follows this structure, modeled on the existing `scry-content.ts`:

```typescript
/**
 * {System} Content Package — All data-driven content for {description}.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change {what}.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. {SECTION_1} — {description}
 * 2. {SECTION_2} — {description}
 * ...
 */

import type { ... } from '../types/...';

// ═══════════════════════════════════════════════════════════════════
// 1. {SECTION NAME}
// ═══════════════════════════════════════════════════════════════════

export const SECTION_DATA = { ... };
```

### Rules

1. **Content packages are in `src/data/`**, named `{system}-content.ts`
2. **Engine files import from content packages.** Engine files contain only logic (functions).
3. **Type files contain only type definitions.** No `const` data exports except for type-adjacent enums like `SPHERE_NAMES` (which define the domain, not content).
4. **Content packages can import types** but never import engine functions.
5. **Content packages can define interface shapes** for their own data structures (like `scry-content.ts` defines `TitleFragments`, `BonusRule`, etc.) — these are content-structure types, not game-engine types.
6. **`world-model.json` owns structural graph data** (nodes, edges, categories). Content packages own prose, templates, names, configuration values.

### What stays where it is

Some `const` exports in type files are **type-adjacent** — they define the domain rather than tunable content:

- `SPHERE_NAMES` in `types/index.ts` — defines the sphere enum values
- `NARRATIVE_TIERS` in `types/narrative.ts` — defines the tier enum values
- Type union literals (e.g., `ManipulationType`, `InterventionType`) — these are type constraints

These stay. The rule is: **if you'd never want to tune it for game feel, it's a type constraint, not content.**

## 3. The Five New Content Packages

### 3A. `src/data/narrative-content.ts`

Extracted from: `engine/narrative.ts` (templates + flavors) and `types/narrative.ts` (vocabulary)

```
Sections:
1. SPHERE_VOCABULARY — per-sphere adjectives, verbs, nouns for tonal coloring
2. ROUTINE_TEMPLATES — event-keyed prose templates for routine-tier events
3. NOTABLE_TEMPLATES — event-keyed prose templates for notable-tier events
4. VALUE_FLAVORS — personality value-pair → prose clause mappings
5. CHRONICLE_PROMPTS — (placeholder) prompt templates for LLM-generated chronicle prose
```

**Migration:** Move `SPHERE_VOCABULARY` from `types/narrative.ts`, move `ROUTINE_TEMPLATES`, `NOTABLE_TEMPLATES`, `VALUE_FLAVORS` from `engine/narrative.ts`. The `SphereVocabulary` interface moves too (it's a content-structure type). Update all imports.

### 3B. `src/data/dream-content.ts`

Extracted from: `types/dream.ts` (definitions + constants)

```
Sections:
1. MANIPULATION_DEFINITIONS — 6 manipulation types with costs, effects, risk levels
2. INTERVENTION_DEFINITIONS — 8 intervention types with costs, detection, sphere affinities
3. TIER_MODIFIERS — actor-type cost multipliers
4. DELIVERY_CONSTANTS — range values and local encounter modifiers
```

**Migration:** Move `MANIPULATION_DEFINITIONS`, `INTERVENTION_DEFINITIONS`, `TIER_MODIFIERS`, `DELIVERY_RANGE`, `LOCAL_ENCOUNTER` from `types/dream.ts`. The `ManipulationDefinition` and `InterventionDefinition` interfaces stay in the types file (they define shapes used by the engine). Update all imports.

### 3C. `src/data/doom-content.ts`

Extracted from: `engine/doomClock.ts`

```
Sections:
1. ARCHETYPE_STAGE_NAMES — 7 archetype × 5 stage name arrays
2. DEFAULT_THRESHOLDS — stage trigger fractions
3. DOOM_NARRATIVE_HOOKS — (placeholder) future narrative beat content per archetype/stage
```

**Migration:** Move `ARCHETYPE_STAGE_NAMES` and `DEFAULT_THRESHOLDS` from `engine/doomClock.ts`. Update imports.

### 3D. `src/data/rival-content.ts`

Extracted from: `types/rival.ts` (names) and `engine/rival.ts` (behaviors + weights)

```
Sections:
1. RIVAL_NAME_FRAGMENTS — prefix and suffix arrays for procedural naming
2. RIVAL_BEHAVIORS — behavior list
3. BEHAVIOR_WEIGHTS — per-behavior action probability weights
```

**Migration:** Move `RIVAL_NAME_PREFIXES`, `RIVAL_NAME_SUFFIXES` from `types/rival.ts`. Move `BEHAVIORS` and `BEHAVIOR_WEIGHTS` from `engine/rival.ts`. Update all imports.

### 3E. `src/data/influence-content.ts`

Extracted from: `types/influence.ts`

```
Sections:
1. TIER_NAMES — influence tier display names
2. TIER_THRESHOLDS — (if present) tier boundary values
```

**Migration:** Move `TIER_NAMES` from `types/influence.ts`. Update imports.

## 4. Implementation Tasks

### Task 1: Create `narrative-content.ts`

**Files:**
- Create: `src/data/narrative-content.ts`
- Modify: `src/types/narrative.ts` — remove `SPHERE_VOCABULARY` and `SphereVocabulary` interface
- Modify: `src/engine/narrative.ts` — remove `ROUTINE_TEMPLATES`, `NOTABLE_TEMPLATES`, `VALUE_FLAVORS`, add imports from content package
- Test: `src/engine/__tests__/narrative.test.ts` — update imports if needed

**Step 1: Create the content file**
- Copy `SPHERE_VOCABULARY` (with `SphereVocabulary` interface) from `types/narrative.ts`
- Copy `ROUTINE_TEMPLATES`, `NOTABLE_TEMPLATES`, `VALUE_FLAVORS` from `engine/narrative.ts`
- Add the standard `CONTENT MANAGER` header with section listing

**Step 2: Update imports in engine/narrative.ts**
- Remove the 3 inline constants
- Add: `import { ROUTINE_TEMPLATES, NOTABLE_TEMPLATES, VALUE_FLAVORS, SPHERE_VOCABULARY } from '../data/narrative-content';`

**Step 3: Update imports in types/narrative.ts**
- Remove `SphereVocabulary` interface and `SPHERE_VOCABULARY` const
- Add re-export if any external consumers imported from types: `export { SPHERE_VOCABULARY, type SphereVocabulary } from '../data/narrative-content';`

**Step 4: Run tests**
- Run: `npx vitest run src/engine/__tests__/narrative.test.ts`
- Expected: All existing tests pass (no behavior change)

**Step 5: Commit**

### Task 2: Create `dream-content.ts`

**Files:**
- Create: `src/data/dream-content.ts`
- Modify: `src/types/dream.ts` — remove 5 const exports, keep type definitions
- Test: `src/engine/__tests__/delivery.test.ts`, any dream-related tests

**Step 1: Create the content file**
- Copy `MANIPULATION_DEFINITIONS`, `INTERVENTION_DEFINITIONS`, `TIER_MODIFIERS`, `DELIVERY_RANGE`, `LOCAL_ENCOUNTER` from `types/dream.ts`
- Add the standard header

**Step 2: Update imports in types/dream.ts**
- Remove the 5 const blocks
- Add re-exports for backwards compatibility: `export { MANIPULATION_DEFINITIONS, INTERVENTION_DEFINITIONS, TIER_MODIFIERS, DELIVERY_RANGE, LOCAL_ENCOUNTER } from '../data/dream-content';`

**Step 3: Find and update all direct importers**
- Grep for any file importing these constants from `types/dream`
- Update to import from `data/dream-content` (or rely on re-exports)

**Step 4: Run tests**
- Run: `npx vitest run`
- Expected: All existing tests pass

**Step 5: Commit**

### Task 3: Create `doom-content.ts`

**Files:**
- Create: `src/data/doom-content.ts`
- Modify: `src/engine/doomClock.ts` — remove inline constants, import from content package

**Step 1: Create the content file**
- Move `ARCHETYPE_STAGE_NAMES` and `DEFAULT_THRESHOLDS`
- Add placeholder section for `DOOM_NARRATIVE_HOOKS`
- Add the standard header

**Step 2: Update engine/doomClock.ts**
- Remove the 2 inline constants
- Add import from content package

**Step 3: Run tests**
- Run: `npx vitest run src/engine/__tests__/doomClock.test.ts`
- Expected: All pass

**Step 4: Commit**

### Task 4: Create `rival-content.ts`

**Files:**
- Create: `src/data/rival-content.ts`
- Modify: `src/types/rival.ts` — remove name arrays
- Modify: `src/engine/rival.ts` — remove behaviors + weights, import from content package

**Step 1: Create the content file**
- Move `RIVAL_NAME_PREFIXES`, `RIVAL_NAME_SUFFIXES` from `types/rival.ts`
- Move `BEHAVIORS`, `BEHAVIOR_WEIGHTS` from `engine/rival.ts`
- Add the standard header

**Step 2: Update imports in both files**
- Re-export from `types/rival.ts` for backwards compat
- Import in `engine/rival.ts` from content package

**Step 3: Run tests**
- Run: `npx vitest run src/engine/__tests__/rival.test.ts`
- Expected: All pass

**Step 4: Commit**

### Task 5: Create `influence-content.ts`

**Files:**
- Create: `src/data/influence-content.ts`
- Modify: `src/types/influence.ts` — remove `TIER_NAMES`, add re-export

**Step 1: Create the content file**
- Move `TIER_NAMES` from `types/influence.ts`
- Add the standard header

**Step 2: Update imports**
- Re-export from `types/influence.ts`
- Check for direct importers

**Step 3: Run tests**
- Run: `npx vitest run src/engine/__tests__/influence.test.ts`
- Expected: All pass

**Step 4: Commit**

### Task 6: Full test suite verification

**Step 1: Run full test suite**
- Run: `npx vitest run`
- Expected: All ~806 tests pass

**Step 2: Verify no content remains in engine files**
- Grep for content-like constants in `src/engine/*.ts` (excluding test files)
- Grep for content-like constants in `src/types/*.ts`
- Everything tunable should now live in `src/data/*-content.ts`

**Step 3: Final commit**

### Task 7: Documentation updates

**Step 1: Update Obsidian vault**
- Create note: `Systems/Content Packages.md` describing the pattern and listing all 7 content packages
- Update: `Systems/Narrative Engine.md` to reference `narrative-content.ts`
- Update: `Systems/Doom Clock.md` to reference `doom-content.ts`

**Step 2: Update CLAUDE.md changelog**

**Step 3: Update Notion backlog**

## 5. What This Enables

After this refactor:

- **Content tuning is isolated.** Want to change how Force sphere reads in prose? Edit one section of `narrative-content.ts`. Want new doom stage names? Edit `doom-content.ts`. No risk of breaking engine logic.
- **Content review is easy.** All 7 `*-content.ts` files in `src/data/` are the complete inventory of tunable game content. A content designer can read just these files.
- **Future content expansion has a home.** When we add trait flavor text, culture aesthetic descriptions, echo degradation variants, or chronicle prompt templates — each gets a section in the appropriate content package (or a new one if it's a new system).
- **The pattern is proven.** `scry-content.ts` and `mandate-content.ts` already work exactly this way. We're just applying the same pattern to the remaining 5 systems.

### Content Map After Migration

```
src/data/
├── world-model.json          ← structural graph (198 nodes, 290 edges)
├── scry-content.ts           ← divine court (existing, ✅)
├── mandate-content.ts        ← victory mandates (existing, ✅)
├── narrative-content.ts      ← NEW: prose templates, sphere vocab, value flavors
├── dream-content.ts          ← NEW: manipulations, interventions, delivery
├── doom-content.ts           ← NEW: archetype stage names, thresholds
├── rival-content.ts          ← NEW: rival names, behaviors, weights
└── influence-content.ts      ← NEW: tier names
```

## 6. Decisions Log

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Content location | `src/data/*-content.ts` files | Single mega content file, JSON-based content, content in world-model.json | Per-system files match existing pattern; TypeScript gives type safety; world-model.json is for graph structure not prose |
| Backwards compatibility | Re-export from original locations | Hard-break all imports, migration guide | Re-exports are zero-cost, prevent churn in test files, can be removed later |
| Type/content boundary | Interfaces stay in types, const data moves to content | Move interfaces too, keep everything in types | Types define shapes (used by engine); content packages provide data (used by content managers). Different audiences. |
| Scope | Only move existing content, don't expand | Also write missing content (doom narrative beats, trait flavors, culture aesthetics) | Separation first, expansion second. Don't mix refactoring with new content creation. |
