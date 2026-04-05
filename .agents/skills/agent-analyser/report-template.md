# Encounter Log Analysis — Report Template

Save the analysis to `Docs/analysis/YYYY-MM-DD-encounter-log-analysis-seed<N>.md` using this structure:

```markdown
# Encounter Log Analysis — Seed <N>, <T> Ticks, <A> Agents

**Date:** YYYY-MM-DD
**Seed:** <N>
**Tick range:** <start>–<end>
**Agents analyzed:** <count> (breakdown by type)

## Executive Summary

2-3 sentences: overall health verdict + the single biggest problem.

## Per-Agent Activity Summary

| Agent | Location | Active Ticks | Encounter Types Used | Completions | Abandonments | Status |
|-------|----------|-------------|---------------------|-------------|--------------|--------|

## Key Metrics

Bullet list of the Phase 5 systemic health metrics with actual values and healthy/warning/critical rating.

## Root Cause Analysis

For each major problem found, explain:
1. What the symptom is (what you observed in logs)
2. What engine mechanism causes it (reference specific code/constants)
3. Why it matters for player experience

## Encounter Type Distribution

Per active agent: which encounters they attempted, how many times, completion rate.

## Reach-Based Activity Profile

Group agents by their primary reach domain. For each reach, report:
- How many agents have this as their strongest reach
- What % of those agents are active vs idle
- Which encounter templates in the pool match this reach (as reachPrimary)
- Whether the reach is over-served (many templates) or under-served (few/none)

| Reach | Agents | Active | Idle | Templates Available | Coverage |
|-------|--------|--------|------|--------------------| ---------|

Flag reaches where >50% of agents are idle — this indicates a content gap for that archetype.

## Capability Growth

Table of capability values at start vs end of agent lifespan, for active agents.

## Recommendations

Organized by effort level:
- **Immediate (tuning constants)** — changes to named constants in agent-behavior-constants.ts
- **Short-term (new mechanics)** — small new features or fallbacks
- **Medium-term (system changes)** — architectural or pipeline changes

Each recommendation should reference specific constants or code locations.
```
