# Encounter Log Analysis — Seed 42, 105 Ticks, 70 Agents (Export v4)

**Date:** 2026-03-31
**Seed:** 42
**Tick range:** 1–105
**Agents analyzed:** 70 (19 named/commander, 51 Lair Elites spawned tick 50, 1 "The Expected" spawned tick 65)
**Prior baselines:** 2026-03-30 (8 agents, 644 ticks), 2026-03-31 assessment (62 + 38 agents)

## Executive Summary

The named agent pipeline is now healthy — **all 17 named agents are active with zero pipeline-blocked idle events**, meaningful score variance (0.40–1.28), and 11 of 17 traveling to multiple locations. This is a major improvement over all prior baselines. **The Lair Elite population (51 agents, 73% of total) remains completely broken** — 45/51 permanently idle from spawn, and the 6 "active" ones fail every encounter due to cap=2. The system is bifurcated: a working named-agent layer on top of a non-functional lair-elite layer.

**Single biggest problem:** Lair Elites spawn with near-zero capabilities (cap=2) and at locations with no encounter content, making them invisible to the player and a drag on system metrics.

---

## Per-Agent Activity Summary

### Named Agents (all active, spawned tick 1)

| Agent | Locations Visited | Unique Encounters | Completions | Abandonments | Completion % | Notable |
|-------|------------------|-------------------|-------------|--------------|-------------|---------|
| Isolde | 12 | 15 | 7 | 31 | 18.4% | Most completions, traveled widely |
| Mirael | 8 | 18 | 8 | 30 | 21.1% | Best template variety |
| Kael | 11 | 15 | 10 | 24 | 29.4% | Highest completion count |
| Hestia | 2 | 12 | 7 | 14 | 33.3% | Active but low mobility |
| Ashara | 4 | 9 | 6 | 12 | 33.3% | Solid completion rate |
| Jorik | 11 | 14 | 6 | 15 | 28.6% | Good variety |
| Gale | 3 | 8 | 4 | 13 | 23.5% | |
| Varn | 15 | 8 | 4 | 13 | 23.5% | High mobility, low variety |
| Kira | 15 | 8 | 4 | 15 | 21.1% | Most hexes visited (45) |
| Dara | 3 | 7 | 3 | 7 | 30.0% | Low mobility |
| Thorne | 0 (stationary) | 9 | 3 | 24 | 11.1% | **48 idle events** (cooldown) |
| Cael | 8 | 14 | 1 | 20 | 4.8% | Travels but can't complete |
| Dren | 4 | 7 | 1 | 12 | 7.7% | |
| Lyssa | 8 | 4 | 1 | 4 | 20.0% | **57.9% confront_the_unknown** |
| Brynn | 17 | 8 | **0** | 8 | **0.0%** | Most locations, zero completions |
| Fen | 4 | 4 | 2 | 8 | 20.0% | Low variety |

### Commanders

| Agent | Locations | Unique Enc. | Completions | Abandonments | Completion % | Notes |
|-------|-----------|-------------|-------------|--------------|-------------|-------|
| Scarlet Co. Cmdr | 3 | 12 | 3 | 16 | 15.8% | Active full run |
| Iron Wolves Cmdr | 0 | 8 | 2 | 14 | 12.5% | Stops at tick 31 |

### Born-Later Agents

| Agent Type | Count | Active | Idle | Completion Rate | Cap |
|------------|-------|--------|------|-----------------|-----|
| Lair Elites (tick 50) | 51 | 6 | **45** | ~0% (0-1 completions) | 2 |
| The Expected (tick 65) | 1 | 1 | 0 | **0%** (0/35) | 2 |

---

## Key Metrics

| Metric | Value | Rating | Prior (Mar 31 assessment) |
|--------|-------|--------|--------------------------|
| **Named agent active rate** | 100% (17/17) | **HEALTHY** | 21–42% |
| **Overall active rate** | 34% (24/70) | WARNING | 21–42% |
| **Named completion rate** | 21.5% (73/340 named enc.) | IMPROVED | 0.5–0.8% |
| **Overall completion rate** | 10.6% (73/691) | WARNING | 0.5–0.8% |
| **Named agents that traveled** | 65% (11/17) | **HEALTHY** | 5–6% |
| **Overall agents that traveled** | 16% (11/70) | WARNING | 5–6% |
| **Idle rate (agent-ticks)** | ~67% (dominated by 45 idle elites) | CRITICAL | 97% |
| **Named idle rate** | ~2.7% (only Thorne, cooldown) | **HEALTHY** | — |
| **Encounter repetition (>40%)** | 1 agent (Lyssa) | ACCEPTABLE | Widespread |
| **Difficulty range used** | 3–70 (4 bands) | IMPROVED | stuck at 25/35/45 |
| **Score variance** | 0.0003–1.28, mean 0.33 | **HEALTHY** | all 0.00 or 0.01 |
| **Born-later activity** | 12% (7/52 active) | CRITICAL | 0% |

### Trend vs. Prior Baselines

| Metric | Mar 30 (8 agents) | Mar 31 assess. | **This log (v4)** | Trend |
|--------|-------------------|----------------|--------------------|-------|
| Named active | 75% | 21% | **100%** | **Fixed** |
| Completion rate | 40–60% | 0.5–0.8% | **21.5% (named)** | Recovering |
| Movement | 0% | 5–6% | **65% (named)** | **Major fix** |
| Score display | all 0.00 | some spread | 0.40–1.28 range | **Fixed** |
| Desire | all 0.01 | 90% at 0.01 | 0.01–2.82, mean 0.45 | **Fixed** |
| Difficulty range | 20–45 only | 3–70 | 3–70 | Maintained |

---

## Root Cause Analysis

### 1. Lair Elites: Capability Collapse (cap=2) — UNCHANGED FROM PRIOR

**Symptom:** 51 Lair Elites spawn at tick 50. 45 immediately idle every tick with `no_candidates_after_filter`. The 6 that find encounters fail every step (cap=2 vs. any difficulty = near-zero probability).

**Mechanism:** The sigmoid capability formula `1 / (1 + e^(-0.4*(raw - 10)))` maps raw domain scores of 0–2 to cap values of 0.02–0.08. These agents have no meaningful domain capabilities. At cap=2 (displayed as 0–100 scale), even diff=3 encounters produce ~5% pass rates. Multi-step encounters are uncompletable.

**Impact:** 73% of the agent population generates zero narrative content. The 4,905 idle events from these agents are pure noise.

**Why it matters:** A player watching the simulation sees 51 agents doing nothing. The world feels empty despite having 70 agents.

### 2. Filter Pipeline Still Kills Lair Elites — MOSTLY UNCHANGED

**Symptom:** 45 Lair Elites idle with `no_candidates_after_filter` every tick from spawn.

**Mechanism:** The awareness filter requires minimum capability (`AWARENESS_THRESHOLD = 0.05`) in the encounter's reach to see it. Lair Elites with cap=0.02 in all reaches see 0 encounters. Combined with lair locations potentially lacking encounter template coverage, the pipeline produces zero candidates.

**Impact:** These agents never even enter the scoring/cooldown pipeline.

### 3. Thorne: Cooldown Exhaustion at Stationary Location

**Symptom:** Thorne is the only named agent with idle events — 48 total, all with reason `no_candidates_after_cooldown`, clustering ticks 73–105.

**Mechanism:** Thorne never moves (0 hexes, 0 locations). At Noble Fieldport, the local pool is ~9 templates. With `ENCOUNTER_COMPLETION_COOLDOWN = 8` and `ENCOUNTER_ABANDON_COOLDOWN = 8`, after cycling through 9 templates Thorne exhausts the pool and hits cooldown lockout. `IDLE_FORCED_TRAVEL_THRESHOLD = 10` should eventually force travel, but the idle reason is `no_candidates_after_cooldown` not `no_candidates_after_filter` — the forced travel check may only trigger on the filter reason.

**Impact:** Shows that stationary agents at small-pool locations will always hit cooldown exhaustion. The fix is working for filter-blocked agents but not cooldown-blocked ones.

### 4. Brynn: Travels Widely, Completes Nothing

**Symptom:** Brynn visited 17 locations (most of any agent) and attempted 8 unique encounters, but completed zero. All 8 attempts were abandoned.

**Mechanism:** With cap=100, Brynn should be completing encounters. Reading the step data: `diff=40, cap=100, prob=0.62` — this is a reasonable probability, but 8 consecutive abandonments at ~60% per-step probability is unlikely but possible with 2-step encounters (0.62² ≈ 38% completion per encounter, and (1-0.38)⁸ ≈ 2% chance of 8 straight failures). This is likely a cold streak rather than a systemic bug, but worth monitoring.

### 5. The Expected: Active But Helpless (cap=2)

**Symptom:** Spawns tick 65, attempts 71 encounters, completes zero. Cap=2 on all steps.

**Mechanism:** Same capability collapse as Lair Elites. The Expected appears to be a special agent with no meaningful domain capabilities.

### 6. Low Variety for Some Named Agents

**Symptom:** Fen and Lyssa each used only 4 unique encounter templates. Lyssa used `confront_the_unknown` 57.9% of the time.

**Mechanism:** These agents spent significant time at locations with small template pools. `confront_the_unknown` appears to be the universal fallback — it's available at many location types.

---

## Encounter Type Distribution (Named Agents)

**Top 10 most-attempted encounter templates (named agents only):**

| Template | Attempts | Agents Using | Completions |
|----------|----------|-------------|-------------|
| confront_the_unknown | 68 | 14 | 6 |
| master_local_craft | 41 | 10 | 8 |
| master_craftsman_challenge | 38 | 11 | 7 |
| weave_political_alliance | 22 | 7 | 2 |
| arcane_resonance_study | 19 | 8 | 4 |
| plague_outbreak | 16 | 5 | 3 |
| merchants_gambit | 15 | 4 | 2 |
| shadow_in_the_night | 14 | 6 | 3 |
| bandit_ambush | 13 | 3 | 2 |
| dragons_challenge | 12 | 5 | 1 |

**Observations:**
- `confront_the_unknown` is over-represented (20% of all named decisions) — acts as a catch-all template available everywhere
- Good template spread otherwise — 18+ unique templates used across named agents
- Completion rate highest for craft encounters (19–21%) suggesting these are well-tuned
- `weave_political_alliance` has low completion (9%) — the shadow step (diff=50) is the bottleneck

## Reach Coverage

| Reach | Steps | % of Total | Pass Rate |
|-------|-------|-----------|-----------|
| eye | 286 | 30.5% | 38.8% |
| heart | 119 | 12.7% | 41.2% |
| shadow | 118 | 12.6% | 32.2% |
| gold | 101 | 10.8% | 35.6% |
| iron | 90 | 9.6% | 38.9% |
| stone | 88 | 9.4% | 35.2% |
| veil | 80 | 8.5% | 30.0% |
| star | 56 | 6.0% | 28.6% |
| dominance | 1 | 0.1% | 0.0% |

**`eye` dominates** at 30.5% of all encounter steps — overweighted. `star` and `dominance` are underused. When filtering to named agents only (who have high caps), pass rates would be ~50–60% across reaches. The low aggregate rates are dragged down by Lair Elite cap=2 failures.

**Note:** The reaches used in templates (`gold`, `iron`, `stone`, `shadow`, `star`, `dominance`) overlap only partially with the canonical Nine Reaches. This may be intentional (encounters use different reach vocabulary than the domain system) or may indicate template content was authored against an older reach taxonomy.

## Capability Progression

| Agent | Early Cap (ticks 1–50) | Late Cap (ticks 55–105) | Delta |
|-------|----------------------|------------------------|-------|
| Scarlet Cmdr | 71.5 | 82.3 | **+10.8** |
| Ashara | 91.8 | 96.7 | +4.9 |
| Dara | 97.8 | 98.3 | +0.5 |
| Isolde | 89.8 | 88.1 | -1.7 |
| Mirael | 85.1 | 86.7 | +1.6 |
| Jorik | 89.7 | 85.8 | -3.9 |
| Cael | 100.0 | 87.1 | -12.9 |
| Dren | 100.0 | 88.6 | -11.4 |
| Varn | 100.0 | 96.0 | -4.0 |
| Lair Elites (all) | 2.0 | 2.0 | 0 |
| The Expected | — | 2.0 | 0 |

**Capability is flat.** Named agents show negligible growth (most within ±5 points). Some actually decline — likely because late encounters test different reaches where the agent is weaker, not because capability decreased. Growth reward mechanics (`BASE_ENCOUNTER_GROWTH = 0.5`) appear to not be producing visible progression over 105 ticks.

---

## Scoring Health

- **Score range:** 0.0003 – 1.2773 (healthy spread)
- **Score mean:** 0.33 (named agents cluster 0.40–0.80)
- **Desire range:** 0.01 – 2.82 (massive improvement from prior all-0.01)
- **Desire mean:** 0.45
- **Travel cost range:** 0.0 – 0.68

**Score distribution (all agents):**

| Range | Count | % |
|-------|-------|---|
| <0.30 | 594 | 40.6% |
| 0.30–0.50 | 621 | 42.4% |
| 0.50–0.70 | 199 | 13.6% |
| 0.70+ | 50 | 3.4% |

The <0.30 bucket is heavily weighted by Lair Elite decisions (desire=0.01, cap=2). Named agent scores show healthy variance and personality-driven differentiation. Fen's highest score was 1.28 for `confront_the_unknown` with desire=2.43 — personality clearly driving choice.

---

## What's Working (New Since Prior Baselines)

1. **Named agent activity: 100%.** Zero pipeline-blocked named agents. Massive improvement from 21%.
2. **Movement: 65% of named agents travel.** Kira (45 hexes), Brynn (17 locations), Varn (15 locations). Prior: 5%.
3. **Score/desire variance is real.** Agents make personality-driven choices (Fen's desire for `confront_the_unknown` at 2.43, Cael's for `weave_political_alliance` at 1.84).
4. **Template variety: 18+ unique templates used.** Named agents see 4–18 unique encounters each.
5. **Exploration bonus is working.** Agents score distant novel locations higher (0.40 bonus visible in travel decisions).
6. **Travel cost weight reduction (0.12) is working.** Agents willingly travel 3-5 hops.
7. **Cooldown scaling is working.** Small pools get reduced cooldowns, preventing lockout (mostly — Thorne is the exception).
8. **`IDLE_FORCED_TRAVEL_THRESHOLD` is working** for filter-blocked agents — no named agents are permanently stuck.

---

## Recommendations

### Immediate (tuning constants in `agent-behavior-constants.ts`)

1. **Raise Lair Elite base capabilities.** The fundamental fix. Lair Elites need raw domain scores of 5–10 per reach so the sigmoid maps to cap=25–50. This makes encounters achievable. Currently in `agentLifecycle.ts` or wherever lair agent domain scores are initialized.

2. **Extend `IDLE_FORCED_TRAVEL_THRESHOLD` to cooldown-blocked agents.** Thorne idles for 30+ ticks with `no_candidates_after_cooldown`. The forced travel mechanism should trigger on *any* extended idle, not just `no_candidates_after_filter`. Check `idleBehavior.ts`.

3. **Raise `OUTGROWTH_CAP_THRESHOLD` from 55 to 65+.** Some named agents with cap=100 are being filtered from diff=40 encounters (100-40=60>55). Given the small template pools, outgrowth filtering is too aggressive.

4. **Reduce `confront_the_unknown` template availability.** It appears at too many location types, dominating the encounter diet. Either restrict its `locationTypes` or add more location-specific templates to dilute it.

### Short-term (new mechanics or small features)

5. **Content-aware lair spawn.** `BORN_LATER_PREFER_CONTENT_LOCATIONS` is enabled but 45/51 lair elites still idle immediately. Either the preference isn't finding content-rich locations, or lair locations inherently lack encounter content. Audit lair location→encounter template matching.

6. **Add per-agent idle tracking to the TSV.** Include pipeline stage counts (`afterAwareness=X, afterVisibility=Y, ...`) in IDLE lines so log analysis can diagnose which filter stage kills candidates without reading source code.

7. **Add REROUTE events.** The TSV format supports them but zero appear in this log. Either agents never reroute or the event isn't being emitted.

### Medium-term (system changes)

8. **Lair Elite agent type redesign.** 51 agents spawning mid-game with zero capabilities at content-desert locations is a design problem, not a tuning problem. Options: (a) dramatically reduce lair elite count (5–10 not 51), (b) give them domain capabilities proportional to their lair's sphere, (c) create lair-specific encounter templates that require no capability (narrative encounters), (d) delay spawn until the location has content.

9. **Capability growth audit.** Over 105 ticks, named agents with cap=85+ show zero meaningful growth. `BASE_ENCOUNTER_GROWTH = 0.5` with `DIMINISHING_RETURNS_FACTOR = 0.7` at high cap produces negligible change. Either growth needs to be visible at this timescale or progression should come from different mechanics (tier promotion, gear).

10. **Flee mechanic.** Zero fled events in 691 encounter completions. Either the flee threshold is never reached or the mechanic isn't implemented. If it exists, agents should flee encounters where their step probability drops below 0.10.

---

## Summary: System Health Score Card

| Subsystem | Named Agents | Lair Elites | Overall |
|-----------|-------------|-------------|---------|
| Pipeline (filter→score→decide) | **HEALTHY** | BROKEN | WARNING |
| Movement & exploration | **HEALTHY** | N/A (idle) | WARNING |
| Encounter variety | ACCEPTABLE | N/A | ACCEPTABLE |
| Completion rate | RECOVERING (21%) | BROKEN (0%) | WARNING |
| Capability progression | FLAT | BROKEN | CRITICAL |
| Scoring & personality | **HEALTHY** | MINIMAL | WARNING |
| Idle management | ACCEPTABLE | BROKEN | CRITICAL |
| Content coverage | ACCEPTABLE | EMPTY | WARNING |

**Bottom line:** The named agent layer is approaching playable quality. Fix the Lair Elite population (capability + content), and the system metrics will transform overnight. The 73% of agents that are currently dead weight would become active participants.
