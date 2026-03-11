# Doom Clock Content Authoring Guide

The doom clock tracks existential threats to the world through 7 archetypes, each with 5 escalation stages. Content is split across archetype JSON files and a shared vocabulary file, all validated at load time by `doom-loader.ts`.

## Adding a New Doom Archetype

1. Create `src/data/doom/<archetype-name>.json`
2. Import it in `src/data/doom-loader.ts` (add to the `rawArchetypes` array)
3. Run `npm test -- doom-loader` to verify validation passes

## Modifying Vocabulary

Edit `src/data/doom/vocabulary.json` directly. The loader validates all 7 stages are present with the required word banks.

## Archetype JSON Schema

```json
{
  "archetype": "breach",
  "description": "An outside force breaking through reality.",
  "stageNames": [
    "Strange Whispers",
    "Reality Cracks",
    "The Thinning",
    "Barriers Fail",
    "The Breach"
  ],
  "thresholds": [0.20, 0.40, 0.60, 0.80, 1.0]
}
```

### Field Reference

| Field | Required | Constraints |
|-------|----------|-------------|
| `archetype` | yes | One of the valid archetype names (see below) |
| `description` | yes | Non-empty string describing the doom theme |
| `stageNames` | yes | Exactly 5 non-empty strings |
| `thresholds` | yes | Exactly 5 numbers, strictly increasing, final value must be `1.0` |

### Valid Archetype Names

`breach`, `convergence`, `changing`, `sundering`, `failing`, `ascension`, `reckoning`

### Stage Names

Each of the 5 stage names is a short, evocative phrase describing escalating doom. They progress from subtle unease to catastrophic culmination:

- Stage 1: First whispers, subtle wrongness
- Stage 2: Visible signs, growing tension
- Stage 3: Undeniable change, systems straining
- Stage 4: Critical failure, barriers breaking
- Stage 5: The final event — the doom is realized

### Thresholds

Progress percentages (0.0–1.0) that define when each stage triggers. Standard pattern is 20% increments (`[0.20, 0.40, 0.60, 0.80, 1.0]`), but you can adjust for different pacing:

- Front-loaded: `[0.15, 0.30, 0.50, 0.75, 1.0]` — early stages come fast, final stage lingers
- Back-loaded: `[0.25, 0.50, 0.70, 0.85, 1.0]` — slow burn, rapid escalation at the end

## Vocabulary Schema (`vocabulary.json`)

A single object with 7 stage keys, each containing word banks for prose generation.

```json
{
  "whispers": {
    "adjectives": ["faint", "distant", "strange", "subtle", "eerie"],
    "verbs": ["whisper", "drift", "echo", "stir", "murmur"],
    "nouns": ["breeze", "shadow", "rumor"],
    "atmosphere": "Something stirs at the edge of perception."
  }
}
```

### Required Stage Keys (all 7)

`whispers`, `signs`, `tremors`, `cracks`, `the_breaking`, `the_breach`, `the_unmaking`

These represent escalating doom intensity, from barely perceptible to world-ending.

### Vocabulary Entry Fields

| Field | Required | Constraints |
|-------|----------|-------------|
| `adjectives` | yes | Array of 3+ strings — atmospheric descriptors |
| `verbs` | yes | Array of 3+ strings — active verbs for prose |
| `nouns` | yes | Array of 3+ strings — concrete nouns/concepts |
| `atmosphere` | yes | Single sentence — the overall feel of this stage |

### Vocabulary Progression

Words should escalate in intensity across the 7 stages:

| Stage | Tone | Example adjectives |
|-------|------|-------------------|
| `whispers` | Barely there, unsettling | faint, distant, subtle |
| `signs` | Noticeable, concerning | troubling, persistent, growing |
| `tremors` | Visceral, alarming | violent, deep, relentless |
| `cracks` | Breaking, urgent | jagged, spreading, irreversible |
| `the_breaking` | Catastrophic onset | shattering, overwhelming, consuming |
| `the_breach` | Beyond containment | absolute, boundless, unstoppable |
| `the_unmaking` | Existential dissolution | final, hollow, annihilating |

## Prose Style

Follow the Threadbare aesthetic:

- Lead with observed detail, not explanation
- Each `atmosphere` sentence should be a camera observation, not narration
- Words should feel physical — "crack", "seep", "grind" over "mystical", "ethereal"
- Escalation should feel inevitable, not melodramatic
- No superlatives ("the greatest doom"), no exclamation marks

## Validation

The loader validates at import time:

- Archetype name must be one of the 7 valid names
- Description must be non-empty
- Exactly 5 stage names, all non-empty
- Exactly 5 thresholds, strictly increasing, ending at 1.0
- Vocabulary: all 7 stages present, each with 3+ adjectives, 3+ verbs, 3+ nouns, non-empty atmosphere

## Existing Archetypes (7)

| File | Theme |
|------|-------|
| `breach.json` | An outside force breaking through reality |
| `convergence.json` | Separate powers drawn toward dangerous unity |
| `changing.json` | The world itself mutating beyond recognition |
| `sundering.json` | Reality splitting apart at fundamental seams |
| `failing.json` | The slow erosion of everything that sustains life |
| `ascension.json` | Something rising beyond control or containment |
| `reckoning.json` | The accumulated weight of past actions demanding payment |
