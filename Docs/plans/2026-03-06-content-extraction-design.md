# Content Package Extraction — Design Document

**Date:** 2026-03-06
**Goal:** Establish canonical data containers so a content writer can produce text within the right data shapes without rework.
**Approach:** Pure mechanical refactor — extract ~350 lines of embedded content from engine/type files into 5 new `*-content.ts` packages. No logic changes, no new features, all existing tests pass.

## Problem

Content is scattered across engine and type files. A content writer looking at the codebase today would find:

- 3 well-structured content packages (scry, mandate, archetype) in `src/data/`
- ~350 lines of content data embedded in `src/engine/narrative.ts`, `src/types/dream.ts`, `src/engine/doomClock.ts`, `src/types/rival.ts`, `src/engine/rival.ts`, `src/types/influence.ts`, and `src/engine/strands.ts`

The embedded content is hard to discover, has no consistent interface pattern, and mixes data with logic. A writer can't see "here are all the doom stage names" without reading engine code.

## Solution

Create 5 new content packages following the proven `scry-content.ts` pattern:

- Exported typed arrays/objects with lookup functions
- TypeScript interfaces defining the data shape
- Engine files import from content packages (logic only in engine, data only in content)

## The Five New Packages

### 1. `src/data/narrative-content.ts`

Extract from `src/engine/narrative.ts` and `src/types/narrative.ts`:

| Content | Source | ~Lines |
|---------|--------|--------|
| Sphere vocabulary (8 spheres × 3 categories: adjectives, verbs, nouns) | `types/narrative.ts` | 40 |
| Routine prose templates (11 event types) | `engine/narrative.ts` lines 56–96 | 70 |
| Notable prose templates (5 event types) | `engine/narrative.ts` lines 154–173 | 30 |
| Value flavor clauses (10 pairs) | `engine/narrative.ts` lines 130–141 | 20 |

**Interface shape:**
```typescript
export interface SphereVocabulary {
  adjectives: string[];
  verbs: string[];
  nouns: string[];
}
export type SphereVocabularyMap = Record<SphereName, SphereVocabulary>;

export interface ProseTemplate {
  eventType: NarrativeEventType;
  templates: string[];  // with {actor}, {target}, {adj}, {verb}, {noun} placeholders
}

export interface ValueFlavor {
  valuePair: string;
  positive: string;  // clause for positive values
  negative: string;  // clause for negative values
}
```

### 2. `src/data/dream-content.ts`

Extract from `src/types/dream.ts`:

| Content | Source | ~Lines |
|---------|--------|--------|
| 6 manipulation definitions | `types/dream.ts` | 50 |
| 8 intervention definitions (costs, detection, sphere affinities) | `types/dream.ts` | 80 |
| Tier modifiers | `types/dream.ts` | 8 |
| Delivery range constants | `types/dream.ts` | 7 |
| Local encounter constants | `types/dream.ts` | 5 |

### 3. `src/data/doom-content.ts`

Extract from `src/engine/doomClock.ts`:

| Content | Source | ~Lines |
|---------|--------|--------|
| 7 archetype × 5 stage names | `engine/doomClock.ts` lines 21–29 | 10 |
| Default stage thresholds | `engine/doomClock.ts` line 18 | 3 |

### 4. `src/data/rival-content.ts`

Extract from `src/types/rival.ts` and `src/engine/rival.ts`:

| Content | Source | ~Lines |
|---------|--------|--------|
| Rival name prefixes + suffixes (12+12) | `types/rival.ts` | 10 |
| Rival behavior list + weights | `engine/rival.ts` line 25 | 15 |

### 5. `src/data/influence-content.ts`

Extract from `src/types/influence.ts`:

| Content | Source | ~Lines |
|---------|--------|--------|
| Tier names | `types/influence.ts` | 8 |

## Boundary Decision: strands.ts

`VALUE_LABELS` and `FEAR_DESCRIPTIONS` in `src/engine/strands.ts` (~30 lines) are content-adjacent but tightly coupled to the strand extraction logic. **Leave them in strands.ts for now.** They can migrate later if a content writer needs to edit them, but today they're stable and colocated with their only consumer.

## Pattern Rules

Consistent with the existing content-package-architecture design doc:

1. Content packages live in `src/data/`, named `{system}-content.ts`
2. Each package exports typed arrays/objects + lookup functions
3. Engine files import from content packages — no `const` data arrays in engine files
4. Type files contain shapes only (interfaces, enums, type aliases) — no `const` data
5. `world-model.json` owns structural graph data; content packages own prose/text/configuration

## Risk Assessment

**Zero logic risk.** This is a move-and-reexport refactor. The data doesn't change, the types don't change, the function signatures don't change. Only import paths change. Every existing test should pass without modification.

## What This Enables

After extraction, the codebase has 8 content packages:

| Package | Status | Content Writer Can... |
|---------|--------|----------------------|
| scry-content.ts | Mature (351 lines) | Add court structures, title fragments |
| mandate-content.ts | Mature (645 lines) | Add mandate templates |
| archetype-content.ts | Minimal (44 lines) | See shape, needs enrichment next |
| narrative-content.ts | **New** | Edit prose templates, sphere vocabulary, value flavors |
| dream-content.ts | **New** | Edit intervention descriptions, manipulation text |
| doom-content.ts | **New** | Edit doom stage names, add narrative hooks |
| rival-content.ts | **New** | Edit rival name fragments, behavior descriptions |
| influence-content.ts | **New** | Edit tier names |

A content writer can then:
1. Look at `scry-content.ts` as the gold-standard example
2. See every TypeScript interface that defines what data they need to produce
3. Write content that slots into the existing shapes
4. Know that if it type-checks, it fits

## Sequencing After Extraction

Once extraction lands:
1. **Enrich archetype-content.ts** — add tone keywords, beat patterns, vignette seeds, narrative requirements per the content strategy doc
2. **Create culture-content.ts** — narrative palettes (metaphors, honor/shame vocab, oath forms, death language, storytelling tradition, material vocabulary)
3. **Build narrative context pipeline** — harvest→rank→select→feed, consuming all content packages
4. **Create content writing skills** — style-enforcing skills per the content strategy workflow
