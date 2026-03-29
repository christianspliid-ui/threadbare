---
name: agent-analyser
description: Analyse encounter log TSV exports to assess agent behavior, encounter balance, variety, movement patterns, capability growth, and pipeline health. Use this skill whenever the user uploads encounter logs, asks to analyse agent behavior, wants to check encounter balance or tuning, mentions "encounter logs", "agent analysis", "encounter analysis", "behaviour analysis", "tuning check", or wants to compare runs across seeds or patches. Also trigger when the user mentions idle rates, encounter variety, movement patterns, or repetition problems in the simulation.
---

# Agent Analyser — Encounter Log Analysis Skill

## Purpose

This skill turns raw encounter log TSV exports into actionable tuning insights. It answers the core question: **are agents living interesting, varied lives — or are they stuck in loops, idle, or starved of content?**

The game's encounter system is the beating heart of agent behavior. When it works well, agents explore, grow, face escalating challenges, and make choices shaped by their personality. When it breaks down, agents sit idle, cycle the same 3 encounters, or never leave their spawn hex. This skill helps you catch the difference quickly and consistently.

## When to Use

- User uploads encounter log TSV files (exported from the debug panel)
- User asks about agent behavior, encounter balance, variety, movement, or growth
- User wants to compare behavior across seeds, patches, or tuning changes
- After implementing encounter system changes, to verify improvement
- Periodic health checks during game tuning iteration

## Input: Encounter Log TSV Format

Logs are exported per-agent from the debug panel. Each file has a header block and a tab-separated event table.

### Header
```
# ENCOUNTER LOG
# Seed: 42
# Agent: Fen (ind_9)
# Exported: 2026-03-29T08:55:25.799Z
# Ticks: 1–210
```

If the agent had no events:
```
# (no events recorded)
```

### Event Phases

Each row is `TICK\tPHASE\tDETAIL`. The phases and their detail fields:

| Phase | Detail fields | What it means |
|-------|--------------|---------------|
| `DECIDE` | `target=<location> \| encounter=<id> \| score=<float> \| hex=<(q,r)> \| travelCost=<int> \| prob=<float>` | Agent chose an encounter to pursue |
| `IDLE` | `reason=<string> \| action=<stay\|drift\|trivial_local>` | Agent couldn't or wouldn't act. The `reason` field is diagnostic gold |
| `MOVE` | `(q1,r1)→(q2,r2) \| cost=<string> \| road=<name>` | Agent moved one hex |
| `ARRIVE` | `<location> \| hex=<(q,r)>` | Agent reached destination |
| `ENCOUNTER_START` | `<encounter> \| steps=<int> \| threat=<float> \| reach=<string>` | Encounter began |
| `ENCOUNTER_STEP` | `step=<name> \| reach=<string> \| diff=<int> \| cap=<int> \| prob=<float> \| roll=<float> \| PASS\|FAIL` | One step resolved |
| `ENCOUNTER_END` | `<encounter> \| status=<completed\|abandoned\|fled> \| reward=<string>` | Encounter finished |
| `REROUTE` | `old=<target> \| new=<target> \| reason=<string>` | Agent changed plans mid-travel |

### Key Idle Reasons

The `reason` field in IDLE events is the single most important diagnostic signal:

| Reason | What it means | Healthy? |
|--------|--------------|----------|
| `no_candidates_after_filter` | Filter pipeline returned zero encounters | Unhealthy if persistent — means content desert |
| `all_on_cooldown` | Encounters exist but all cooling down | Somewhat healthy — pool may be too small |
| `below_score_threshold` | Encounters scored below IDLE_SCORE_THRESHOLD (0.0001) | Unhealthy — scoring or desire is broken |
| `in_transit` | Agent is traveling (not truly idle) | Healthy |
| `encounter_in_progress` | Already doing something | Healthy |

## Analysis Procedure

Work through these phases in order. Each phase builds on the previous one.

### Phase 1: Triage — Read Every Log Header

Start by reading just the first 5–10 lines of each TSV file to get the header and first few events. Classify each agent into one of these buckets:

- **Active**: Has DECIDE/ENCOUNTER events across most of their lifespan
- **Short-lived**: Died early (check for ENCOUNTER_END with status indicating death, or events stopping abruptly)
- **Permanently idle**: Nothing but IDLE events from spawn to end
- **Born-later idle**: Spawned mid-game and immediately went idle (born_lc agents, shadow threads)
- **Special**: Oracle, world-soul, or other non-standard agents (may legitimately have no events)

This triage tells you immediately how healthy the run is. A good run should have >70% of agents in the Active bucket. Below 50% signals a systemic pipeline problem.

### Phase 2: Active Agent Deep Dive

For each Active agent, read their full log (use offset/limit for large files — focus on representative sections: early game, mid game, late game). Extract:

**Encounter variety metrics:**
- Count unique encounter template IDs used
- Check for round-robin cycling (same 3–5 encounters repeating in sequence)
- Note the ratio of completions to abandonments
- Flag if any single encounter type accounts for >40% of attempts

**Movement metrics:**
- Did the agent ever travel to a different location? (Look for MOVE/ARRIVE phases)
- How many unique locations did they visit?
- Were travel decisions score-driven or just drift?

**Capability and difficulty progression:**
- Extract `diff` and `cap` values from ENCOUNTER_STEP events
- Check if difficulty increases over the agent's lifespan
- Check if `cap` (agent capability) grows — compare early vs late values
- Look for the `prob` values: are encounters trivially easy (prob > 0.9) or impossibly hard (prob < 0.1)?

**Scoring health:**
- Extract `score` values from DECIDE events
- Are they all 0.00? (display bug or scoring collapse)
- Is there meaningful variance between encounter scores?
- Does `travelCost` appear to dominate (always 0 for local)?

**Completion pipeline:**
- Ratio of ENCOUNTER_START to ENCOUNTER_END with status=completed
- Average number of steps passed vs failed before abandonment
- Are rewards appearing? (Check `reward` field in ENCOUNTER_END)

### Phase 3: Idle Agent Diagnosis

For permanently idle agents, the key question is **why**. Read a sample of their IDLE events (first 10–20 lines is usually enough since they repeat). Check:

- Is the idle reason always the same? (`no_candidates_after_filter` is the usual suspect)
- Does the idle action ever change? (`stay` vs `drift` vs `trivial_local`)
- For born-later agents: what location were they spawned at? Does that location have encounter content?

### Phase 4: Cross-Agent Patterns

Compare across all agents to find systemic issues:

- **Location content coverage**: Which locations produced active agents? Which produced idle ones? This reveals content deserts in the encounter template pool.
- **Encounter template utilization**: Of the 64+ location templates + 14 social + 10 faction templates, how many were actually used? High unused percentage suggests filter pipeline or prerequisite issues.
- **Death clustering**: Do agents tend to die at similar ticks or locations? May indicate a difficulty spike.
- **Score distribution**: Across all DECIDE events, what's the score range? Flat distribution suggests scoring isn't differentiating.

### Phase 5: Systemic Health Checks

These are the high-level pipeline health indicators:

| Metric | Healthy Range | Warning | Critical |
|--------|--------------|---------|----------|
| Active agent rate | >70% | 50–70% | <50% |
| Idle rate (agent-ticks) | <30% | 30–60% | >60% |
| Unique locations visited | >60% of map | 30–60% | <30% |
| Agents that traveled | >50% | 20–50% | <20% |
| Encounter template utilization | >50% of pool | 25–50% | <25% |
| Difficulty range used | 3+ bands | 2 bands | 1 band |
| Score variance | meaningful spread | clustered | all zero |
| Completion rate | 30–60% | <20% or >80% | ~0% or ~100% |
| Born-later agent activity | >50% active | 20–50% | 0% |

## Report Template

Save the analysis to `Docs/analysis/YYYY-MM-DD-encounter-log-analysis-seed<N>.md`. Use this structure:

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

## Capability Growth

Table of capability values at start vs end of agent lifespan, for active agents.

## Recommendations

Organized by effort level:
- **Immediate (tuning constants)** — changes to named constants in agent-behavior-constants.ts
- **Short-term (new mechanics)** — small new features or fallbacks
- **Medium-term (system changes)** — architectural or pipeline changes

Each recommendation should reference specific constants or code locations.
```

## Source Code Reference

When diagnosing root causes, these are the key files to examine:

### Engine Pipeline
| File | What it controls |
|------|-----------------|
| `src/engine/encounterFilterPipeline.ts` | 5-stage filter: Awareness → Visibility → Prerequisites → Threat → Cap with Diversity |
| `src/engine/encounterScoring.ts` | Score formula: `valuePerTick * desireMultiplier + factionBoost + resonance` |
| `src/engine/phaseAgentDecision.ts` | Full decision loop: preconditions → candidates → filter → cooldown → score → act |
| `src/engine/encounterAwareness.ts` | Awareness hop calculation, distance-limited visibility |
| `src/engine/encounter.ts` | Encounter orchestration, step resolution |
| `src/engine/encounterTimeline.ts` | Timeline accumulator that produces the logs |
| `src/engine/encounterLogExporter.ts` | TSV formatter |

### Content Templates
| File | What it contains |
|------|-----------------|
| `src/data/encounter-content.ts` | 64 location encounter templates across 10 archetypes |
| `src/data/social-encounter-content.ts` | 14 social encounter templates |
| `src/data/faction-encounter-content.ts` | 10+ faction/quest encounter templates |

### Constants
| File | What it controls |
|------|-----------------|
| `src/data/agent-behavior-constants.ts` | 60+ tunable constants: cooldowns, thresholds, scoring weights, awareness hops |

### Key Constants to Know

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

### Difficulty Bands

| Band | Range | When it should appear |
|------|-------|----------------------|
| trivial | 0–20 | Tutorial-tier, ambient |
| easy | 15–40 | Early game default |
| moderate | 30–60 | Mid-game, after some growth |
| hard | 50–80 | Late game, high-capability agents |
| deadly | 70–100 | Endgame, should be rare |

## Comparing Across Runs

When the user provides logs from multiple seeds or before/after a patch, compare the same metrics side-by-side. Focus on:

1. **Did the active agent rate improve?** This is the #1 health metric.
2. **Did encounter variety increase?** More unique templates used = better.
3. **Did movement happen?** Agents traveling is a sign the scoring/travel-cost balance is working.
4. **Did difficulty escalation appear?** Different difficulty bands showing up means progression is working.
5. **Did born-later agents get content?** This was a critical gap in the seed-42 baseline.

The seed-42 baseline analysis (2026-03-29) established these reference points: 31% active agent rate, 85%+ idle rate, 0 agents traveled, difficulty stuck at 25/35/45, all scores displaying 0.00, born-later agents 100% idle. Any improvement from those numbers is progress.

## Known Issues From Baseline Analysis (Seed 42, 2026-03-29)

These were identified in the first analysis and should be checked in subsequent runs to track whether fixes are working:

1. **Filter pipeline content deserts** — Awareness filter + missing templates = zero candidates at most locations
2. **Zero movement pressure** — `travelCost` in scoring denominator makes local always win; no exploration bonus
3. **Small closed encounter pools** — 5–7 templates per location + 8-tick cooldown = predictable round-robin
4. **No difficulty escalation** — All encounters use diff=25/35/45 regardless of agent growth
5. **Born-later agents starved** — No encounter content at mid-game spawn locations
6. **Capability doesn't differentiate** — Agent personality has no visible effect on encounter choice (pool too small)
7. **Score display bug** — All scores show 0.00 (rounding or near-zero values)
