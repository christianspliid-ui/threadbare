# Mandate Content Authoring Guide

Mandates are the player's win conditions — multi-stage objectives tied to sphere affinities. Each mandate is a standalone JSON file validated at load time by `mandate-loader.ts`.

## Adding a New Mandate

1. Create `src/data/mandates/<kebab-name>.json`
2. Import it in `src/data/mandate-loader.ts` (add to the `rawMandates` array)
3. Run `npm test -- mandate-loader` to verify validation passes

## JSON Schema

```json
{
  "id": "mandate.<kebab_id>",
  "type": "graph_state | narrative | sphere_dominance | simulation_achievable",
  "name": "Display Name",
  "description": "Player-facing description of the win condition.",
  "sphereAffinities": ["force", "matter"],
  "targetSphere": "force",
  "stages": [
    {
      "stage": "setup",
      "description": "What this stage represents.",
      "conditions": [
        {
          "type": "node_count",
          "description": "Control at least 2 settlements.",
          "params": { "nodeType": "settlement", "edgeType": "controls", "minCount": 2 }
        }
      ]
    },
    {
      "stage": "escalation",
      "description": "...",
      "conditions": [{ "type": "...", "description": "...", "params": {} }]
    },
    {
      "stage": "culmination",
      "description": "...",
      "conditions": [{ "type": "...", "description": "...", "params": {} }]
    }
  ],
  "prose": {
    "setup_to_escalation": "Narrative when advancing from setup to escalation.",
    "escalation_to_culmination": "Narrative when advancing from escalation to culmination.",
    "completed": "Narrative when mandate is completed.",
    "failed": "Narrative when mandate fails."
  }
}
```

## Field Reference

| Field | Required | Constraints |
|-------|----------|-------------|
| `id` | yes | Format: `mandate.<kebab_case>`. Must be unique across all mandates. |
| `type` | yes | One of: `graph_state`, `narrative`, `sphere_dominance`, `simulation_achievable` |
| `name` | yes | Non-empty display name |
| `description` | yes | Non-empty player-facing description |
| `sphereAffinities` | yes | 1+ valid sphere names (see below) |
| `targetSphere` | no | Valid sphere name. Used by `sphere_dominance` type. |
| `stages` | yes | Exactly 3 stages in order: `setup` → `escalation` → `culmination` |
| `prose` | yes | Object with all 4 prose keys (see below) |

### Valid Sphere Names

`force`, `matter`, `energy`, `life`, `mind`, `spirit`, `time`, `entropy`

### Condition Types

| Type | Params | What it checks |
|------|--------|---------------|
| `node_count` | `nodeType`, `edgeType`, `minCount` | Count of nodes connected by edge type |
| `edge_count` | `edgeType`, `minCount` | Count of edges of a given type |
| `sphere_weight` | `sphere`, `minWeight` | Accumulated influence in a sphere |
| `actor_tier` | `minTier` | Player's tier level |

Each stage must have at least one condition with `type`, `description`, and `params`.

### Prose Keys (all 4 required)

| Key | When it displays |
|-----|-----------------|
| `setup_to_escalation` | Player advances from stage 1 to stage 2 |
| `escalation_to_culmination` | Player advances from stage 2 to stage 3 |
| `completed` | All conditions in culmination stage are met |
| `failed` | Mandate is abandoned or fails |

## Prose Style

Follow the Threadbare aesthetic — dark world, hidden magic, beauty first with darkness emerging from details.

- Lead with sensory detail, not abstraction
- Use concrete nouns ("stone", "ash") over vague ones ("structure", "destruction")
- Write in present tense as observation
- No superlatives, no generic fantasy adjectives ("eldritch", "mystical")
- 1-3 sentences per prose value

## Validation

The loader validates at import time. Any error will crash the app immediately with a clear message:

- ID must start with `mandate.`
- Type must be one of the 4 valid types
- Sphere affinities must be non-empty with valid sphere names
- Exactly 3 stages in correct order
- Each stage needs a description and at least 1 condition
- Condition types must be valid
- All 4 prose keys must be present and non-empty

## Existing Mandates (12)

| File | Type | Spheres |
|------|------|---------|
| `dominion-of-stone.json` | graph_state | force, matter |
| `builders-legacy.json` | graph_state | matter, energy |
| `web-of-allegiance.json` | graph_state | mind, spirit |
| `tide-of-life.json` | sphere_dominance | life |
| `entropic-cascade.json` | sphere_dominance | entropy |
| `illumination.json` | sphere_dominance | energy |
| `ascendants-champion.json` | narrative | force, spirit |
| `devoted-circle.json` | narrative | spirit, mind |
| `shadow-sovereign.json` | narrative | entropy, mind |
| `threads-of-fate.json` | simulation_achievable | time, spirit |
| `the-gathering.json` | simulation_achievable | life, mind |
| `cultural-convergence.json` | simulation_achievable | matter, spirit |
