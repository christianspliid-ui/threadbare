# Mandate & Doom Clock Content Pipeline Design

**Date:** 2026-03-10
**Status:** Approved
**Goal:** Separate mandate and doom clock content from TypeScript into declarative JSON files so content changes don't require touching engine code.

## Problem

All 12 mandate templates, their milestone prose, and all 7 doom clock archetypes are defined as TypeScript constants in `mandate-content.ts` and `doom-content.ts`. Adding a new win condition or doom archetype means editing TypeScript, understanding nested object shapes, and risking type errors. Content and code are entangled.

## Decision

**Approach A: JSON content files.** Each mandate and doom archetype gets its own `.json` file. Vite handles JSON imports natively — zero new dependencies. A thin loader validates and re-exports the same shapes consumers already use.

### Why not YAML or Markdown?

- **YAML:** Adds a dependency, introduces a second data format alongside the existing `world-model.json` JSON precedent.
- **Markdown with frontmatter:** Requires custom parsing infrastructure. The mandate data is fundamentally structured (typed conditions with params), not prose — the prose is just string values within the structure.

## File Structure

```
src/data/
  mandates/                          # One JSON file per mandate
    dominion-of-stone.json
    builders-legacy.json
    web-of-allegiance.json
    tide-of-life.json
    entropic-cascade.json
    illumination.json
    ascendants-champion.json
    devoted-circle.json
    shadow-sovereign.json
    threads-of-fate.json
    the-gathering.json
    cultural-convergence.json
  doom/                              # One JSON file per archetype
    breach.json
    convergence.json
    changing.json
    sundering.json
    failing.json
    ascension.json
    reckoning.json
  mandate-loader.ts                  # Imports, validates, re-exports
  doom-loader.ts                     # Imports, validates, re-exports
  mandate-content.ts                 # Becomes thin re-export (backward compat)
  doom-content.ts                    # Keeps DOOM_VOCABULARY + DEFAULT_THRESHOLDS, delegates archetypes to loader
```

## Mandate JSON Schema

Each mandate file is self-contained: definition + conditions + prose in one place.

```json
{
  "id": "mandate.dominion_of_stone",
  "type": "graph_state",
  "name": "Dominion of Stone",
  "description": "Control settlements across the realm. Establish architectural supremacy.",
  "sphereAffinities": ["matter", "force"],
  "stages": [
    {
      "stage": "setup",
      "description": "Seize control of 2 settlements.",
      "conditions": [
        {
          "type": "node_count",
          "description": "Control at least 2 settlements",
          "params": {
            "nodeType": "settlement",
            "edgeType": "controls",
            "edgeTarget": "player",
            "minCount": 2
          }
        }
      ]
    },
    {
      "stage": "escalation",
      "description": "Control 4 settlements, expanding architectural influence.",
      "conditions": [
        {
          "type": "node_count",
          "description": "Control at least 4 settlements",
          "params": {
            "nodeType": "settlement",
            "edgeType": "controls",
            "edgeTarget": "player",
            "minCount": 4
          }
        }
      ]
    },
    {
      "stage": "culmination",
      "description": "Achieve absolute dominion: control 5 settlements.",
      "conditions": [
        {
          "type": "node_count",
          "description": "Control at least 5 settlements",
          "params": {
            "nodeType": "settlement",
            "edgeType": "controls",
            "edgeTarget": "player",
            "minCount": 5
          }
        }
      ]
    }
  ],
  "prose": {
    "setup_to_escalation": "Stone answers the call. Two settlements bend their walls toward your will.",
    "escalation_to_culmination": "Four cities now pulse with your dominion. Their stones hum in unison.",
    "completed": "Five settlements stand as monuments to your reign.",
    "failed": "The stones slip from your grasp. Settlements refuse your dominion."
  }
}
```

## Doom Archetype JSON Schema

```json
{
  "archetype": "breach",
  "stageNames": ["Strange Whispers", "Reality Cracks", "The Thinning", "Barriers Fail", "The Breach"],
  "thresholds": [0.20, 0.40, 0.60, 0.80, 1.0]
}
```

Shared data stays in TypeScript:
- `DOOM_VOCABULARY` — word banks used across all archetypes
- `DEFAULT_THRESHOLDS` — fallback if a JSON file omits `thresholds`

## Loader Design

### mandate-loader.ts

```typescript
import type { MandateTemplate } from './mandate-content';

// Static imports — Vite resolves at build time
import dominionOfStone from './mandates/dominion-of-stone.json';
import buildersLegacy from './mandates/builders-legacy.json';
// ... all 12

function validateMandateJson(data: unknown, filename: string): MandateTemplate { ... }

export const MANDATE_TEMPLATES: MandateTemplate[] = [
  dominionOfStone, buildersLegacy, /* ... */
].map((raw, i) => validateMandateJson(raw, filenames[i]));

export const MANDATE_MILESTONE_PROSE: Record<string, string> = Object.fromEntries(
  MANDATE_TEMPLATES.flatMap(t => {
    const key = t.id.replace('mandate.', '');
    return Object.entries(t.prose).map(([transition, text]) => [`${key}.${transition}`, text]);
  })
);
```

### Validation rules (enforced at load time)

| Rule | Check |
|------|-------|
| Required fields | `id`, `type`, `name`, `description`, `sphereAffinities`, `stages`, `prose` |
| Exactly 3 stages | `stages.length === 3` |
| Stage order | setup → escalation → culmination |
| Valid condition types | Only `node_count`, `edge_count`, `sphere_weight`, `actor_tier` |
| Valid sphere names | Must match `SphereName` union |
| Valid mandate types | `graph_state`, `narrative`, `sphere_dominance`, `simulation_achievable` |
| Prose completeness | All 4 keys present: `setup_to_escalation`, `escalation_to_culmination`, `completed`, `failed` |

Validation errors throw at import time with the filename and specific violation — fail-fast, not fail-silent.

### doom-loader.ts

Same pattern. Validates archetype name, exactly 5 stage names, thresholds ascending and ending at 1.0.

## Migration Strategy

1. Extract each mandate constant from `mandate-content.ts` into its own JSON file
2. Extract each mandate's prose entries from `MANDATE_MILESTONE_PROSE` into the JSON's `prose` field
3. Replace `mandate-content.ts` body with a re-export from `mandate-loader.ts` (backward compatibility)
4. Extract `ARCHETYPE_STAGE_NAMES` entries from `doom-content.ts` into 7 JSON files
5. Update `doom-content.ts` to delegate archetype data to `doom-loader.ts`
6. All existing tests pass without modification (same exported shapes)

## Type Fix

`MandateType` in `types/mandate.ts` is missing `simulation_achievable`. Three mandates already use it in content. The type union must be updated:

```typescript
export type MandateType =
  | 'graph_state'
  | 'narrative'
  | 'sphere_dominance'
  | 'simulation_achievable';  // <-- add
```

## Testing

- **Existing tests unchanged** — they import `MANDATE_TEMPLATES` and `MANDATE_MILESTONE_PROSE` which keep the same shape
- **New: loader validation tests** — malformed JSON files are rejected with clear errors
- **New: content integrity tests** — every JSON file in `mandates/` and `doom/` passes validation (wired into `npm test`)
- **Extend `npm run validate-model`** — validate mandate and doom JSON alongside `world-model.json`

## What Stays in TypeScript

| Content | File | Why |
|---------|------|-----|
| `DOOM_VOCABULARY` | `doom-content.ts` | Shared word banks across all archetypes, not per-archetype data |
| `DEFAULT_THRESHOLDS` | `doom-content.ts` | Fallback value, not content |
| `MandateTemplate` interface | `mandate-content.ts` | Type definition, not content |
| Loader + validation functions | `*-loader.ts` | Infrastructure, not content |

## What Moves to JSON

| Content | From | To |
|---------|------|----|
| 12 mandate definitions | `mandate-content.ts` constants | `mandates/*.json` |
| 48 prose entries | `MANDATE_MILESTONE_PROSE` record | Co-located in each mandate's `prose` field |
| 7 archetype stage names | `ARCHETYPE_STAGE_NAMES` record | `doom/*.json` |
| 7 archetype thresholds | (were using `DEFAULT_THRESHOLDS`) | `doom/*.json` (optional override) |
