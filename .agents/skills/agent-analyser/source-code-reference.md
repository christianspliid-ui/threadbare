# Source Code Reference — Encounter Analysis

## Engine Pipeline

| File | What it controls |
|------|-----------------|
| `src/engine/encounterFilterPipeline.ts` | 5-stage filter: Awareness → Visibility → Prerequisites → Threat → Cap with Diversity |
| `src/engine/encounterScoring.ts` | Score formula: `valuePerTick * desireMultiplier + factionBoost + resonance` |
| `src/engine/phaseAgentDecision.ts` | Full decision loop: preconditions → candidates → filter → cooldown → score → act |
| `src/engine/encounterAwareness.ts` | Awareness hop calculation, distance-limited visibility |
| `src/engine/encounter.ts` | Encounter orchestration, step resolution |
| `src/engine/encounterTimeline.ts` | Timeline accumulator that produces the logs |
| `src/engine/encounterLogExporter.ts` | TSV formatter |

## Content Templates

| File | What it contains |
|------|-----------------|
| `src/data/encounter-content.ts` | 64 location encounter templates across 10 archetypes |
| `src/data/social-encounter-content.ts` | 14 social encounter templates |
| `src/data/faction-encounter-content.ts` | 10+ faction/quest encounter templates |

## Constants

| File | What it controls |
|------|-----------------|
| `src/data/agent-behavior-constants.ts` | 60+ tunable constants: cooldowns, thresholds, scoring weights, awareness hops |

## Key Constants

| Constant | Value | Effect |
|----------|-------|--------|
| `ENCOUNTER_ABANDON_COOLDOWN` | 8 ticks | Cooldown after abandoning an encounter |
| `ENCOUNTER_COMPLETION_COOLDOWN` | 8 ticks | Cooldown after completing an encounter |
| `IDLE_SCORE_THRESHOLD` | 0.0001 | Minimum score to attempt an encounter |
| `BASE_AWARENESS_HOPS` | varies | Base distance agents can "see" encounters |
| `MAX_AWARENESS_HOPS` | varies | Cap on awareness distance |
| `MINIMUM_DESIRE` | 0.1 | Floor on desire multiplier |
| `GROWTH_REWARD_WEIGHT` | 0.4 | How much growth potential affects scoring |
| `STEP_PROBABILITY_OFFSET` | 0.6 | Base probability bonus for encounter steps |
| `ENCOUNTER_RESONANCE_MULTIPLIER` | 0.1 | Sphere resonance scoring bonus |
| `AMBITION_REACH_BOOST` | 0.2 | Bonus for encounters matching agent ambition |
| `THREAT_FLOOR_FILTER` | false | Whether threat filtering is active (currently off) |

## Difficulty Bands

| Band | Range | When it should appear |
|------|-------|----------------------|
| trivial | 0–20 | Tutorial-tier, ambient |
| easy | 15–40 | Early game default |
| moderate | 30–60 | Mid-game, after some growth |
| hard | 50–80 | Late game, high-capability agents |
| deadly | 70–100 | Endgame, should be rare |
