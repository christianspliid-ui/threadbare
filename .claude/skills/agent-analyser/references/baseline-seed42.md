# Baseline Reference — Seed 42, 210 Ticks, 2026-03-29

This is the first encounter log analysis, serving as the reference point for measuring improvement.

## Headline Metrics

| Metric | Value | Rating |
|--------|-------|--------|
| Active agent rate | 5/16 (31%) | Critical |
| Idle rate (agent-ticks) | ~85%+ | Critical |
| Unique locations visited | 5 | Critical |
| Agents that traveled | 0/16 | Critical |
| Encounter template utilization | ~20/64+ (31%) | Critical |
| Difficulty range | 25/35/45 only (trivial/easy) | Critical |
| Score variance | All display 0.00 | Critical |
| Completion rate | ~25% (high abandon rate) | Warning |
| Born-later agent activity | 0/4 (0%) | Critical |

## Active Agents

| Agent | Location | Encounter Pool Size | Completions | Status |
|-------|----------|-------------------|-------------|--------|
| Fen | Tall Grey Tower | 6 templates | ~8 | Cycling, never moved |
| Dara | Fieldbridge | 5 templates | ~6 | Cycling, never moved |
| Hestia | Wraithwood | 6 templates | ~6 | Cycling, never moved |
| Kael | High Greymarket | 5 templates | ~6 | Cycling, never moved |
| Jorik | Fieldcross | 7 templates | ~5 | Cycling, never moved |

## Root Causes Identified

1. Filter pipeline content deserts (no fallback for empty locations)
2. Zero movement pressure (travelCost dominates scoring)
3. Small closed encounter pools (5-7 per location + 8-tick cooldown = round-robin)
4. No difficulty escalation (stuck at trivial/easy)
5. Born-later agents starved (no content at spawn locations)
6. Capability doesn't differentiate behavior (pool too small for preference)
7. Score display bug (all 0.00)

## Use as Comparison Baseline

When comparing a new run to this baseline, improvement in ANY of these metrics is progress. The priority order for improvement:

1. Active agent rate (most impactful for player experience)
2. Born-later agent activity (currently zero — any fix is improvement)
3. Movement/exploration (currently zero — same)
4. Encounter variety (more templates used per agent)
5. Difficulty escalation (bands beyond trivial/easy)
6. Score display (functional scoring feedback)
