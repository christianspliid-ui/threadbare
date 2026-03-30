# Encounter Log Analysis — Seed 42, 644 Ticks, 8 Agents

**Date:** 2026-03-30
**Seed:** 42
**Tick range:** 1–644
**Agents analyzed:** 8 (6 active, 2 permanently idle)
**Comparison baseline:** 2026-03-29 seed-42 analysis

## Executive Summary

Active agent rate jumped from 31% to **75%** — a major improvement. Six of eight agents now sustain continuous encounter activity across 644 ticks. However, three critical problems persist unchanged: **zero movement** (no agent ever leaves their spawn hex), **encounter round-robin** (each agent cycles the same 5–7 templates forever), and **no difficulty escalation** (diff=20/25/35/45 from tick 1 to 644). Two agents (Lyssa at Pale Cairn, Hestia at Grey Meadowguard) remain permanently idle due to content deserts.

## Per-Agent Activity Summary

| Agent | ID | Location | Hex | Ticks | Unique Encounters | Completions | Idle? | Status |
|-------|----|----------|-----|-------|-------------------|-------------|-------|--------|
| Dren | ind_6 | Greypolis | (9,37) | 1–644 | ~7 | Many | No | **Active** — round-robin cycling |
| Dara | ind_0 | West Muckwick | (18,19) | 1–644 | ~8 | Many | No | **Active** — round-robin cycling |
| Thorne | ind_2 | Noble Fieldport | (30,30) | 1–644 | ~8 | Many | No | **Active** — round-robin cycling |
| Gale | ind_1 | Meadowgate | (28,21) | 1–644 | ~8 | Many | No | **Active** — round-robin cycling |
| Kira | ind_5 | Iceford | (16,47) | 1–644 | ~7 | Some | No | **Active** — high abandon rate |
| Jorik | ind_3 | Frost Cairn | (27,6) | 1–642 | ~6 | Some | No | **Active** — high abandon rate |
| Lyssa | ind_4 | Pale Cairn | (34,47) | 1–644 | 1 (initial) | 0 | 100% | **Permanently idle** — content desert |
| Hestia | ind_7 | Grey Meadowguard | (61,44) | 1–644 | 1 (initial) | 0 | 100% | **Permanently idle** — content desert |

## Key Metrics

| Metric | Value | Rating | Baseline (03-29) |
|--------|-------|--------|-----------------|
| Active agent rate | 75% (6/8) | **Healthy** | 31% |
| Idle rate (agent-ticks) | 25% (2 agents × 644 ticks) | Warning | 85%+ |
| Unique locations visited | 6/map locations (spawn only) | **Critical** | Same |
| Agents that traveled | 0% (0/8) | **Critical** | 0% |
| Encounter template utilization | ~30 unique templates used | Warning | Similar |
| Difficulty bands used | 1 band (easy: 20/25/35/45) | **Critical** | Same (25/35/45) |
| Score variance | All 0.0000, desire=? | **Critical** | All 0.00 |
| Completion rate | ~40–60% (varies by agent) | Healthy | Similar |
| Born-later agent activity | N/A (all 8 are original) | — | 0% |

## Root Cause Analysis

### 1. Zero Movement (Critical — unchanged from baseline)

**Symptom:** Every active agent stays at their spawn hex for the entire 644-tick run. Zero MOVE events in any log.

**Cause:** The scoring formula includes `travelCost` in the denominator, making local encounters always score higher than distant ones. With no exploration bonus or boredom mechanic, agents have no reason to leave. All DECIDE events show `travelCost=0` — only local encounters are ever considered.

**Impact:** Agents never discover new content, never interact across locations, and the map feels static. Players see 6 dots that never move.

### 2. Encounter Round-Robin (High — unchanged)

**Symptom:** Each agent cycles the same 5–8 encounter templates in predictable rotation. Examples:
- **Dren** (Greypolis): commune_with_stars → local_tales → pickpocket → smuggle_goods → decipher_old_markings → market_haggle → market_day_festival → repeat
- **Jorik** (Frost Cairn): grave_robbery → smuggler_pact → inscribe_ward → relic_hunt → forbidden_tome → scholar_aid → repeat
- **Kira** (Iceford): study_surroundings → recruit_militia → brew_potion → tend_the_weary → forage_provisions → local_tales → repeat

**Cause:** Small closed pool per location (5–8 templates) plus 8-tick cooldowns. With only local encounters visible, the same templates rotate on cooldown timers. No new templates enter the pool over time.

**Impact:** After watching for 30 seconds, the player has seen everything the agent will ever do. No surprise, no escalation, no story arc.

### 3. No Difficulty Escalation (High — unchanged)

**Symptom:** Difficulty values remain exactly `diff=20/25/35/45` from tick 1 to tick 644. No higher-difficulty encounters ever appear.

**Cause:** All encounter templates use fixed difficulty values in the "easy" band. There is no mechanic to scale difficulty based on agent capability or game progression. The cap grows slightly over time (e.g., Dren's veil cap rises from 88→96, improving prob from 0.68→0.91 on the same step), but difficulty never increases to match.

**Impact:** By mid-game (~tick 200), active agents are trivially succeeding at everything. Probability values climb to 0.80–0.95 on most steps. There's no challenge progression.

### 4. Score Display / Scoring Collapse (High — unchanged)

**Symptom:** Every DECIDE event shows `score=0.0000` and `desire=?`. Across all 8 agents, all 644 ticks, there is zero score differentiation.

**Cause:** Either (a) the score is near-zero and rounded to 0.0000 in the exporter, or (b) the scoring formula is producing near-identical values for all candidates, or (c) the `desire` component isn't being calculated (shown as `?`). The `desire=?` consistently appearing suggests the desire multiplier may not be wired.

**Impact:** Without meaningful scoring, agents can't make interesting choices. They just pick the first/random candidate. Personality and ambition have zero influence on behavior.

### 5. Content Deserts at Pale Cairn and Grey Meadowguard (Medium)

**Symptom:** Lyssa and Hestia both get one initial DECIDE, arrive at their location, then emit `no_candidates_after_filter` every single tick for 640+ ticks. They never recover.

**Cause:** These locations have no encounter templates that pass the filter pipeline. Lyssa's initial encounter was `shadow_hunt` (which never starts), and Hestia's was `study_surroundings` (which also never starts). After that, the filter returns zero candidates permanently.

**Impact:** 25% of agents are completely inert. The player sees two agents doing absolutely nothing for the entire game.

## Encounter Type Distribution (Active Agents)

### Dren (Greypolis)
| Encounter | Reach Types | Observed |
|-----------|-------------|----------|
| commune_with_stars | star, veil | Very frequent — high abandon early, easy completions late |
| local_tales | heart, eye | Frequent |
| decipher_old_markings | eye, gold | Frequent |
| pickpocket | shadow, gold, shadow | Frequent — 3 steps, high abandon |
| smuggle_goods | gold, shadow, gold | Frequent — 3 steps |
| market_haggle | gold, heart, ??? | Moderate |
| market_day_festival | gold/heart (2 steps) | Moderate |

### Jorik (Frost Cairn)
| Encounter | Steps | Notes |
|-----------|-------|-------|
| grave_robbery | 3 (shadow, gold, shadow) | Very high abandon rate at step 2 (gold diff=35) |
| smuggler_pact | 3 (shadow, gold, shadow) | Similar pattern |
| inscribe_ward | 3 (eye, veil, eye) | Long multi-tick gaps between steps |
| relic_hunt | 3 (eye, shadow, eye) | Moderate success |
| forbidden_tome | — | Seen in DECIDE but not in samples |
| scholar_aid | — | Seen in DECIDE but not in samples |

### Kira (Iceford)
| Encounter | Notes |
|-----------|-------|
| study_surroundings | veil cap=50 → frequent step-2 fails (prob=0.22–0.28) |
| recruit_militia | iron reach — step 2 fails often (prob=0.61) |
| brew_potion | 3 steps, long duration, high abandon |
| tend_the_weary | heart, star |
| forage_provisions | eye, stone — stone cap=50 is a bottleneck |
| local_tales | heart, eye |

**Notable:** Kira has several very low caps (veil=50, stone=50) creating persistent bottlenecks on specific encounter steps. This is actually interesting differentiation — but without difficulty scaling, it becomes a permanent limitation rather than a challenge to overcome.

## Capability Growth

| Agent | Reach | Early Cap | Late Cap (~tick 400) | Growth |
|-------|-------|-----------|---------------------|--------|
| Dren | eye | 100 | 100 | None (capped) |
| Dren | veil | 88 | 96 | +8 |
| Dren | gold | 89 | 100 | +11 |
| Dren | heart | 97 | 100 | +3 |
| Kira | veil | 50 | 88-89 | +38-39 |
| Kira | stone | 50 | 50 | None |
| Kira | iron | 99 | 99 | None |
| Thorne | shadow | 88 | 99 | +11 |
| Thorne | gold | 98 | 100 | +2 |

**Finding:** Capabilities do grow over time, driven by encounter step successes. Some reaches grow significantly (Kira's veil: 50→89). But many start at or near 100, leaving no room for growth. The game already has a functional capability growth system — it's just invisible because difficulty doesn't scale to match.

## Comparison vs Baseline (2026-03-29)

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Active agent rate | 31% | 75% | **+44pp** |
| Idle rate | 85%+ | 25% | **-60pp** |
| Agents traveled | 0% | 0% | No change |
| Difficulty escalation | None | None | No change |
| Score variance | All 0.00 | All 0.0000 | No change |
| Content deserts | Most locations | 2 locations | **Improved** |

The active agent rate improvement is substantial. The pipeline is now working for most spawn locations. The remaining problems are systemic design gaps, not pipeline bugs.

## Recommendations

### Immediate (Tuning Constants)

1. **Wire desire into scoring** — The `desire=?` in every DECIDE suggests the desire multiplier isn't connected. Check `encounterScoring.ts` — the `desireMultiplier` term should be producing a non-`?` value. This alone could create meaningful score differentiation.

2. **Add an exploration/boredom bonus** — Introduce a constant like `LOCATION_BOREDOM_WEIGHT` that increases scoring for encounters at other locations when the agent has been at their current location for N ticks. Even a small bonus would break the "local always wins" stasis.

3. **Increase encounter pool size per location** — Add 3–5 more templates per location archetype in `encounter-content.ts`, especially at content-desert locations (Pale Cairn, Grey Meadowguard). Target: 10+ templates per location minimum.

### Short-term (New Mechanics)

4. **Difficulty scaling** — Add a `difficultyScale` function that adjusts encounter difficulty based on agent's average capability in that reach. When cap > diff + 30, bump the diff band up. Use the existing difficulty bands (trivial/easy/moderate/hard/deadly).

5. **Fallback encounter for content deserts** — When `no_candidates_after_filter` persists for N ticks (e.g., 10), inject a "wander" or "explore" fallback encounter that gives the agent a travel target. This converts permanently idle agents into wanderers.

6. **Log score components** — Change the DECIDE log format to include the actual score components: `score=<total> | value=<v> | desire=<d> | faction=<f> | resonance=<r>`. This makes diagnosis much faster.

### Medium-term (System Changes)

7. **Travel incentive system** — Rework the scoring formula so that `travelCost` is a subtracted cost, not a divisor. Add a `distanceDiscoveryBonus` for locations the agent hasn't visited. Goal: at least 50% of agents should travel during a 644-tick run.

8. **Progressive encounter unlocks** — Gate higher-difficulty encounters behind capability thresholds. When an agent's reach cap exceeds the current pool's max difficulty, unlock the next tier. This creates natural progression arcs.

9. **Per-agent encounter memory** — Track which encounters an agent has completed more than N times. Apply a diminishing-returns penalty to frequently-completed encounters to push agents toward variety or travel.
