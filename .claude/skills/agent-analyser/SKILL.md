---
name: agent-analyser
description: Analyse encounter log TSV exports to assess agent behavior, encounter balance, variety, movement patterns, capability growth, and pipeline health. Use this skill whenever the user uploads encounter logs, asks to analyse agent behavior, wants to check encounter balance or tuning, mentions "encounter logs", "agent analysis", "encounter analysis", "behaviour analysis", "tuning check", or wants to compare runs across seeds or patches. Also trigger when the user mentions idle rates, encounter variety, movement patterns, or repetition problems in the simulation.
---

# Agent Analyser — Encounter Log Analysis Skill

## Purpose

This skill turns raw encounter log TSV exports into actionable tuning insights. The core question is: **are agents moving from encounter to encounter, creating cool stories — or are they stuck, repeating, or starved of content?**

The encounter system is the narrative engine of the game. A healthy system produces agents who travel between locations doing different encounters that tell a story. Repeating the same encounter should be very rare. Generic/trivial encounters are acceptable as occasional filler during idle gaps, but the main diet should be varied, location-specific, story-producing encounters. Optimize for **narrative variety and movement**, not busy-ness.

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
| `no_candidates_after_filter` | The 5-stage filter pipeline returned zero encounters | **Most critical.** Means content desert at agent's location — the pipeline has nothing to offer. |
| `no_candidates_after_cooldown` | Filter pipeline found candidates, but all on cooldown or max-familiarity | Pool too small for the cooldown window — agent needs to travel elsewhere. |
| `below_score_threshold` | Encounters scored below IDLE_SCORE_THRESHOLD (0.0001) | Scoring or desire is broken — encounters exist but score too low to pursue. |
| `in_transit` | Agent is traveling (not truly idle) | Healthy — agent is moving between encounters. |
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

| Metric | Healthy Range | Warning | Critical | Why it matters |
|--------|--------------|---------|----------|----------------|
| Encounter repetition rate | <20% same encounter twice | 20–40% | >40% | Stories need variety, not loops |
| Unique locations visited per agent | 3+ locations | 2 | 1 (stuck at spawn) | Nomadic lifestyle = cool stories |
| Agents that traveled | >50% | 20–50% | <20% | No travel = no story arcs |
| Encounter template utilization | >50% of pool | 25–50% | <25% | Content exists but isn't reaching agents |
| Reach coverage (templates used) | 5+ reaches | 3–4 | 1–2 | Some agent archetypes starved |
| Completion rate | 30–60% | <20% or >80% | ~0% or ~100% | 0% = can't progress; 100% = no challenge |
| Difficulty range used | 3+ bands | 2 bands | 1 band | No escalation = flat story arc |
| Score variance | meaningful spread | clustered | all zero | Scoring not differentiating choices |
| Idle rate (agent-ticks) | <30% | 30–60% | >60% | Secondary — symptom of above problems |
| Born-later agent activity | >50% active | 20–50% | 0% | Mid-game spawns need content too |

### Phase 6: Reach-Based Agent Profiling

Group agents by their primary reach domain capabilities and check whether certain reaches are systematically starved of content. The encounter template pool may be rich in one reach (e.g., `eye`) but sparse in another (e.g., `veil`). This creates reach-dependent activity rates.

For each agent:
- Identify the agent's strongest reach(es) from ENCOUNTER_STEP `cap` values or from world-model data
- Map which encounter templates they could access (by reachPrimary/reachSecondary)
- Check if agents with specific reach strengths are disproportionately idle

**What to look for:**
- All `veil`-primary agents idle while `iron`-primary agents are active → veil encounter content gap
- Agents with high capability in a reach that has few templates → content/reach mismatch
- Encounters attempted only use 2-3 of the 9 reaches → reach coverage gap in template pool

## Pipeline Diagnostic Checklist (Ordered by Impact)

Run this checklist in order when diagnosing why agents aren't moving between encounters. Each item maps to a specific pipeline stage in the code. Earlier items block more agents more severely.

### 1. Encounter Cache Coverage (the encounter even exists at the location?)

**Code:** `encounterCache.ts` → `buildEntriesForLocationAndSublocations()`

The cache maps encounter templates to locations by matching `template.locationTypes` against `location.locationType`. If a location has sublocations, ONLY sublocation-matched templates are cached (line 212-225) — general location-type templates are skipped.

**Check from logs:**
- Agent DECIDEs encounter X at location Y, ARRIVEs, then gets `no_candidates_after_filter` forever
- Multiple agents at the same location ALL idle → the location has no cached encounters

**Check from code:**
- Does the location's `locationType` or `locationSubtype` match any template's `locationTypes` array?
- Does the location have sublocations? If yes, does `getEncountersBySublocationAndLocation()` return templates for those sublocation types?
- Is the location type `'location'` (generic)? These are skipped (line 241).

**Common failure:** Location has sublocations → cache uses sublocation lookup → sublocation type has no matching templates → 0 entries cached.

### 2. Awareness Filter (can the agent see the encounter from their location?)

**Code:** `encounterAwareness.ts` → `filterByAwareness()`

Per-reach distance-limited visibility. Agent needs sufficient capability in the encounter's `reachPrimary` or `reachSecondary` to see it at the given distance. Distance 0 (same location) always passes if capability >= `AWARENESS_THRESHOLD` (0.05).

**Check from logs:**
- Agent at location X is idle, but encounter templates exist for location X in the cache
- Agent's ENCOUNTER_STEP shows low `cap` values in relevant reaches

**Check from code:**
- `computeAwarenessHops(capability, reach)`: below `AWARENESS_THRESHOLD` (0.05) → 0 hops → can only see distance-0 encounters
- `getDistance()` returns `Infinity` for unknown pairs → encounter invisible
- Self-distance is always 0 (BFS seeds with `dist.set(sourceId, 0)`)

**Common failure:** Agent has near-zero capability in the encounter's primary reach → 0 awareness hops → can't see encounters at other locations. At distance 0, should still pass.

### 3. Chain Prerequisites (is the encounter locked behind a chain stage?)

**Code:** `encounterChains.ts` → `isChainStageUnlocked()`

Encounters that are part of a multi-stage chain require completing previous stages. First-stage and non-chain encounters always pass.

**Check from logs:**
- Agent arrives at a location with known encounter content, but the encounter is part of a chain
- No ENCOUNTER_END with status=completed for previous chain stages

**Check from code:**
- Is the encounter template part of a chain? Check `templateToChains` index.
- If yes, what stage is it? If stage > 0, has the agent completed stage - 1?

**Common failure:** Multiple chain encounters at a location, agent has never completed any chain → only first-stage encounters available → tiny pool.

### 4. Outgrowth Filter (has the agent outgrown the encounter?)

**Code:** `encounterFilterPipeline.ts` → `filterByOutgrowth()` | **Currently ENABLED** (`OUTGROWTH_FILTER_ENABLED = true`, threshold = 35)

Removes encounters where `(agentCapability * 100) - avgDifficulty >= OUTGROWTH_CAP_THRESHOLD (35)`. High-capability agents outgrow easy encounters.

**Check from logs:**
- Agent has high `cap` values (70+) in ENCOUNTER_STEP events
- Agent was active early (with lower-difficulty encounters) but became idle later (outgrew the pool)
- DECIDE scores were declining over time before agent went idle

**Check from code:**
- Agent's capability in the encounter's reach × 100 minus encounter's average step difficulty
- If gap ≥ 35, encounter is filtered out
- Example: cap=0.80 (80), avg_diff=40 → gap=40 ≥ 35 → **outgrown**

**Common failure:** Agent starts capable (cap ≥ 0.70) and all local encounters are easy/moderate (diff 30-40) → all outgrown from the start. Agent was NEVER going to engage.

### 5. Visibility Restrictions (is the encounter gated to specific factions/agents?)

**Code:** `encounterFilterPipeline.ts` → `filterByVisibility()` + `questVisibility.ts`

Encounters with a `visibleTo` array are only available to agents matching those visibility criteria (faction membership, agent type, archetype, culture).

**Check from logs:**
- Agent at a location with many cached encounters, but idle with `no_candidates_after_filter`
- Other agents at the same location are active → visibility is agent-specific

**Check from code:**
- Does the encounter template have a `visibleTo` array?
- Does `isEncounterVisibleToAgent()` return true for this agent?

**Common failure:** Encounter templates gated to a faction the agent hasn't joined → invisible. Usually a minor factor since most location encounters have no `visibleTo`.

### 6. Threat Tolerance (is the encounter too dangerous/trivial?)

**Code:** `encounterFilterPipeline.ts` → `filterByThreat()` | **Currently DISABLED** (`THREAT_FLOOR_FILTER = false`)

When enabled, checks whether the encounter's `threatRating` aligns with the agent's capability band and courage axis. Currently off, so this stage passes everything through.

**Check:** Skip unless `THREAT_FLOOR_FILTER` is changed to `true`.

### 7. Cooldown + Familiarity (did the agent already do this recently?)

**Code:** `phaseAgentDecision.ts` → `filterByCooldown()` (line 65-96) + familiarity filter (line 372-376)

Post-filter stage. Removes encounters the agent recently abandoned (`ENCOUNTER_ABANDON_COOLDOWN`) or completed (`ENCOUNTER_COMPLETION_COOLDOWN`). Also removes encounters at max completions (`MAX_COMPLETIONS_PER_TEMPLATE`).

Cooldown is dynamically scaled by pool size (`getEffectiveCooldown()`, line 53-57): smaller pools get shorter cooldowns.

**Check from logs:**
- Idle reason = `no_candidates_after_cooldown` (NOT `no_candidates_after_filter`)
- Agent was active, abandoned/completed encounters, then went idle
- Count how many unique encounters the agent had before going idle — if < 3, pool was too small for cooldown

**Check from code:**
- `ENCOUNTER_ABANDON_COOLDOWN` (8 ticks base)
- `ENCOUNTER_COMPLETION_COOLDOWN` (8 ticks base)
- `COOLDOWN_FULL_POOL_SIZE` — pool size at which full cooldown applies
- `COOLDOWN_MINIMUM` — minimum cooldown even for tiny pools
- `MAX_COMPLETIONS_PER_TEMPLATE` — permanent exclusion after N completions

**Common failure:** Location has 2-3 encounter templates, all on cooldown simultaneously → `no_candidates_after_cooldown` for 8+ ticks. Agent should travel elsewhere but doesn't.

### 8. Scoring (does the encounter score high enough to be chosen?)

**Code:** `encounterScoring.ts` → `scoreAndSelect()` | `phaseAgentDecision.ts` line 379-387

After filtering and cooldown, remaining candidates are scored. The top-scored candidate is selected if its score exceeds `IDLE_SCORE_THRESHOLD` (0.0001).

**Check from logs:**
- Idle reason = `below_score_threshold`
- DECIDE events show very low `score` values (< 0.01)
- All scores clustered near 0 → scoring formula collapse

**Check from code:**
- Score formula components: `valuePerTick`, `desireMultiplier`, `factionBoost`, `resonance`
- `travelCost` penalty: remote encounters get penalized, making local always win
- `IDLE_SCORE_THRESHOLD` (0.0001) — very low, so this stage rarely blocks

**Common failure:** All remaining candidates score below threshold → agent idles. Usually means desire multiplier or value estimate is broken. Very rare with current threshold of 0.0001.

### 9. Movement Escape (does the agent travel when local encounters dry up?)

**Code:** `idleBehavior.ts` → `resolveIdleBehavior()` | `phaseAgentDecision.ts` line 552-559

When an agent goes idle, `resolveIdleBehavior` determines what they do: `stay`, `trivial_local`, or `drift` toward a location. Drift is the only mechanism that could lead to travel, but it doesn't guarantee the agent will actually move to a new encounter-rich location.

**Check from logs:**
- Idle action = `stay` or `trivial_local` exclusively → agent never even drifts
- Idle action = `drift` with `driftTarget` → agent drifts but never arrives (drift may be very slow or the target may also be empty)
- Count ticks idle at a single location → if > 10, escape mechanism is failing

**What we want:** When an agent exhausts local encounters (cooldown or filter), it should actively seek a new location with different encounters. Currently this depends on drift being activated and the drift target having content.

### Summary: Diagnostic Priority Order

| Priority | Stage | Blocked? | Fix complexity |
|----------|-------|----------|----------------|
| 1 | Encounter cache coverage | Entire location dead | Content authoring |
| 2 | Awareness filter | Agent can't see encounters | Constants tuning |
| 3 | Chain prerequisites | Chain progression blocks | Template design |
| 4 | Outgrowth filter | High-cap agents locked out | Constants or disable |
| 5 | Visibility restrictions | Faction-gated content | Template design |
| 6 | Threat tolerance | (Currently off) | — |
| 7 | Cooldown + familiarity | All local encounters exhausted | Constants + movement |
| 8 | Scoring | Score too low to pursue | Scoring formula |
| 9 | Movement escape | Agent stuck at empty location | Idle behavior system |

### Improvement: Filter Stage Counts in TSV

The engine already emits `FilterPipelineTrace` with per-stage counts (line 576-583 in `phaseAgentDecision.ts`) but these aren't included in the TSV export. Adding `afterAwareness`, `afterVisibility`, `afterPrerequisites`, `afterThreat`, `afterCap` to the IDLE line would make log analysis immediately diagnostic without needing to guess which stage is the bottleneck.

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

When the user provides logs from multiple seeds or before/after a patch, compare the same metrics side-by-side. Focus on story-producing behavior:

1. **Are agents moving between locations doing different encounters?** This is the #1 health metric — nomadic variety creates stories.
2. **Is encounter repetition rare?** Same encounter twice in a row = failure. Occasional repeat after many others = acceptable.
3. **Are all reaches served?** Check whether any reach archetype is starved of content.
4. **Did difficulty escalation appear?** Different difficulty bands showing up means progression is working.
5. **Did born-later agents get content?** Mid-game spawns need stories too.
6. **Is the filter pipeline letting encounters through?** The `no_candidates_after_filter` rate should be <20%.

The seed-42 baseline analysis (2026-03-29) established these reference points: 31% active agent rate, 85%+ idle rate, 0 agents traveled, difficulty stuck at 25/35/45, all scores displaying 0.00, born-later agents 100% idle. The 2026-03-30 analysis showed score display fixed (0.30-0.70 range) and Thorne traveling to 3 locations, but 5/7 agents still permanently stuck after arrival due to `no_candidates_after_filter`.

## Known Issues From Baseline Analysis (Seed 42, 2026-03-29)

These were identified in the first analysis and should be checked in subsequent runs to track whether fixes are working:

1. **Filter pipeline content deserts** — Awareness filter + missing templates = zero candidates at most locations
2. **Zero movement pressure** — `travelCost` in scoring denominator makes local always win; no exploration bonus
3. **Small closed encounter pools** — 5–7 templates per location + 8-tick cooldown = predictable round-robin
4. **No difficulty escalation** — All encounters use diff=25/35/45 regardless of agent growth
5. **Born-later agents starved** — No encounter content at mid-game spawn locations
6. **Capability doesn't differentiate** — Agent personality has no visible effect on encounter choice (pool too small)
7. **Score display bug** — All scores show 0.00 (rounding or near-zero values)
