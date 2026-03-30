# Encounter Log Analysis — Seed 42, ~397 Ticks, 11 Agents (V2)

**Date:** 2026-03-29
**Seed:** 42
**Tick range:** 1–397
**Agents analyzed:** 11 individuals (Lyssa, Cael, Brynn, Ashara, Kira, Jorik, Isolde, Hestia, Fen, Dren, Dara)
**Compared to:** V1 baseline (same date, 210 ticks, 16 agents — different world generation)

## Executive Summary

Of 11 agents, **7 are actively encountering** (63.6%) and **4 are permanently idle** due to `no_candidates_after_filter`. This is an improvement over the V1 baseline (31% active → 64% active). However, the same core problems persist: **zero movement** (no agent ever travels), **all scores display 0.0000**, **difficulty is static at 25/35/45**, and active agents cycle a small closed pool of encounters in round-robin fashion. The idle agents are trapped at content-desert locations with no fallback behavior to seek encounters elsewhere.

The single biggest problem: **agents never move**, which means idle agents stay idle forever and active agents never discover new content.

## Per-Agent Activity Summary

| Agent | ID | Location | Hex | Ticks | Enc. Types | Completions | Abandonments | Idle % | Status |
|-------|-----|----------|-----|-------|------------|-------------|--------------|--------|--------|
| Lyssa | ind_6 | Great Widehaven | (45,38) | 1–397 | 5 | 6 | ~25 | 0% | Active, cycling |
| Cael | ind_7 | Hawktown | (37,22) | 1–375 | 11 | 23 | 38 | 0% | Active, cycling |
| Brynn | ind_2 | Raven Rest | (34,44) | 1–371 | 12 | 22 | 25 | 0% | Active, cycling |
| Jorik | ind_10 | Thorn Farms | (34,22) | 1–392 | 4 | 25 | 47 | 0% | Active, tiny pool |
| Hestia | ind_9 | Wideton | (61,17) | 1–384 | 9 | 36 | 50 | 0% | Active, cycling |
| Fen | ind_0 | High Vastbridge | (38,25) | 1–380 | 7 | 18 | 43 | 0% | Active, cycling |
| Dren | ind_5 | Drifter's Bitter Rest | (51,47) | 1–379 | 12 | 39 | 50 | 0% | Active, cycling |
| Ashara | ind_3 | Pale Cairn | (34,47) | 1–371 | 5 | 1 | 4 | 94.6% | Idle trap (tick 22+) |
| Kira | ind_1 | Frost Cairn | (27,6) | 1–395 | 1 | 0 | 0 | 99.7% | Idle trap (tick 4+) |
| Isolde | ind_8 | Lost Bitter Cairn | (32,0) | 1–386 | 4 | 1 | 3 | 96.4% | Idle trap (tick 27+) |
| Dara | ind_4 | Ice Cairn | (29,46) | 1–377 | 2 | 1 | 0 | 98.9% | Idle trap (tick 6+) |

## Key Metrics

| Metric | Value | Rating | V1 Baseline |
|--------|-------|--------|-------------|
| Active agent rate | 7/11 (63.6%) | WARNING | 5/16 (31%) |
| Permanently idle agents | 4/11 (36.4%) | WARNING | 11/16 (69%) |
| Agents that traveled | 0/11 (0%) | CRITICAL | 0/16 (0%) |
| Unique locations with active agents | 7 | OK | 5 |
| Unique locations with idle agents | 4 (all "cairn/hollow" frontier types) | CRITICAL | 11 |
| Score variance | 0 (all 0.0000) | CRITICAL | all 0.00 |
| Difficulty bands used | 1 (easy: 25/35/45 only) | CRITICAL | 1 |
| Avg completion rate (active agents) | ~38% | OK | ~25% |
| Encounter template utilization | ~35 unique templates seen | WARNING | ~25 |
| Capability growth | Negligible (caps near 100 at start) | WARNING | Similar |
| Duplicate DECIDE events per tick | 2 (every agent) | BUG | Same |

## What Improved Since V1

1. **Active agent rate doubled** (31% → 64%) — more locations now have encounter content
2. **More encounter variety** — active agents see 4–12 templates vs 5–7 before
3. **Higher completion rate** (~38% vs ~25%) — step probabilities seem better tuned
4. **Longer runs** (~380-397 ticks vs 210) — simulation runs longer without crashing
5. **No agent deaths** — all 11 agents survived the full run (V1 had 6 early deaths)

## What Remains Broken

### 1. Zero Movement (CRITICAL)

No agent ever produces a MOVE event. All travelCost values are 0 (already at target). The scoring formula has no exploration bonus to counteract the zero-cost local advantage. Consequences:
- Idle agents are **permanently trapped** — they can't seek encounters elsewhere
- Active agents never discover new content beyond their spawn location
- The map is functionally meaningless — agents are pinned to spawn hexes

**Root cause:** `encounterScoring.ts` divides by `(1 + travelCost)`, making local encounters always score higher. No exploration bonus, wander impulse, or idle-triggered relocation exists.

### 2. All Scores Display 0.0000 (CRITICAL)

Every DECIDE event across all 11 agents shows `score=0.0000`, `desire=?`, `prob=0.00`. Either:
- The scoring formula produces near-zero values that round to 0.0000 in the log
- The desire system is not wired (all `?`)
- The score/prob fields in the trace are not being populated from the actual decision

**Impact:** Cannot verify encounter selection is intelligent. May be random.

### 3. Static Difficulty (CRITICAL)

Every encounter uses the same difficulty ladder: step 1 = 25, step 2 = 35, step 3 = 45. No scaling based on:
- Agent capability growth
- Number of completions
- Game progression / tick count
- Location danger level

**Result:** Encounters never become easier (growth doesn't pay off) or harder (no challenge escalation). The game feels flat.

### 4. Content Desert Locations (HIGH)

The 4 idle agents are all at frontier/wilderness locations:
- **Frost Cairn** (27,6) — Kira, 0 encounters available
- **Ice Cairn** (29,47) — Dara, 0 encounters after arrival
- **Pale Cairn** (34,47) — Ashara, 0 encounters after tick 22
- **Lost Bitter Cairn** (32,0) — Isolde, 0 encounters after tick 27

All idle reasons are `no_candidates_after_filter`. These locations either:
- Have no encounter templates assigned
- Have templates that are immediately filtered out by prerequisites/awareness

The pattern is clear: "cairn" and "hollow" frontier settlements have no content. All active agents are at established towns/cities.

### 5. Small Closed Encounter Pools (MEDIUM)

Active agents cycle through their location's pool predictably:
- **Jorik** at Thorn Farms: only 3 encounters (recruit_militia, harvest_bounty, merchant_caravan) — cycles endlessly
- **Lyssa** at Great Widehaven: 5 encounters — predictable rotation
- **Fen** at High Vastbridge: 6 encounters — round-robin

With 8-tick cooldowns and pools of 3–12, agents exhaust their options and start repeating within 30–50 ticks.

### 6. Duplicate DECIDE Events (BUG)

Every agent logs exactly 2 DECIDE events per decision tick. This appears to be the encounter pipeline firing twice per tick, not just a logging artifact (idle agents also get 2 IDLE events per tick). Worth investigating whether this causes double resource consumption or is just a trace issue.

## Encounter Type Distribution (Active Agents)

| Agent | Top 3 Encounters (by attempts) | Unique Types |
|-------|-------------------------------|--------------|
| Cael | market_haggle(16), merchants_gambit(14), healers_oath(12) | 11 |
| Brynn | tavern_brawl(16), shadow_ambush(16), trial_of_flame(13) | 12 |
| Dren | tavern_brawl(20), shadow_ambush(20), caravan_deal(16) | 12 |
| Hestia | market_day_festival(19), market_haggle(16), barter_survival(16) | 9 |
| Jorik | recruit_militia(27), harvest_bounty(27), merchant_caravan(17) | 4 |
| Fen | compose_saga(16), tavern_brawl(14), pickpocket(13) | 7 |
| Lyssa | raise_monument(~10), compose_saga(~8), temple_expansion(~5) | 5 |

**Observations:**
- Top 2–3 encounters dominate 60–80% of attempts for every agent
- Jorik is the worst case: 3 encounters account for 98.6% of all attempts
- tavern_brawl and shadow_ambush appear across multiple locations (Brynn, Dren, Fen) — shared templates
- Location-specific templates (raise_monument, harvest_bounty) add flavor but the pool is still tiny

## Capability Growth

| Agent | Weakest Reach (Start → End) | Growth |
|-------|----------------------------|--------|
| Cael | gold: 77 → 99 | +22 |
| Brynn | shadow: 69 → 95 | +26 |
| Jorik | flesh: 83 → 98 | +15 |
| Hestia | flesh: prob 0.75 → 0.90 | Modest |
| Fen | iron: 97 → 99 | +2 |
| Dren | shadow: prob 0.72 → 0.86 | Modest |
| Lyssa | heart: 98 → 99, stone: 100 (flat) | Negligible |

Most agents start with caps near 95–100, leaving almost no room for visible growth. Only Cael (gold 77→99) and Brynn (shadow 69→95) show meaningful progression. The growth system exists but is invisible because starting caps are too high.

## Root Cause Analysis

### Problem 1: No Movement
- **Symptom:** Zero MOVE/ARRIVE events across all active agents; idle agents permanently stuck
- **Cause:** Encounter scoring in `encounterScoring.ts` uses `valuePerTick / (1 + travelCost)` which always favors local (cost=0). No exploration bonus, no idle-triggered wander, no diminishing returns on repeated local encounters.
- **Player impact:** Map is decorative. Settlement variety is wasted. Idle agents are death-sentenced at spawn.

### Problem 2: Score Display Bug
- **Symptom:** All DECIDE events show score=0.0000, desire=?, prob=0.00
- **Cause:** Either the trace emitter in `encounterTimeline.ts` rounds/truncates values, or the desire system genuinely isn't wired (all `?` suggests desire multiplier is undefined/NaN)
- **Player impact:** Cannot debug encounter selection; unclear if agents make intelligent choices

### Problem 3: Content Deserts
- **Symptom:** 4 agents idle at frontier locations with `no_candidates_after_filter`
- **Cause:** `encounter-content.ts` templates are concentrated on established settlement archetypes (market, harbor, academic). Frontier/cairn/hollow locations likely don't match any archetype's location prerequisites.
- **Player impact:** 36% of agents do literally nothing for the entire game

### Problem 4: No Difficulty Scaling
- **Symptom:** diff=25/35/45 on every encounter for every agent across all 397 ticks
- **Cause:** Encounter template definitions use hardcoded difficulty values with no scaling function
- **Player impact:** No sense of progression; completing 20 encounters feels identical to completing the first

## Recommendations

### Immediate (Tuning Constants)

1. **Add exploration bonus to scoring** — New constant `EXPLORATION_BONUS` in `agent-behavior-constants.ts`. When an agent has been at the same location for N ticks without completing an encounter, add a growing bonus to distant locations. Even a small value (0.1–0.3) would break the local-only trap.

2. **Add idle-triggered relocation** — If an agent is idle for `IDLE_RELOCATION_THRESHOLD` ticks (e.g., 10), force a move toward the nearest location with known encounter content. This alone would fix the 4 permanently-idle agents.

3. **Lower starting capability caps** — Reduce initial `cap` values from 95–100 to 60–80 so growth is visible and meaningful. Currently most reaches start near-capped.

4. **Increase encounter pool per location** — Add 3–5 "universal" encounter templates that work at any settlement type (e.g., rest, forage, explore_surroundings, local_tale, patrol). This would expand Jorik's 3-encounter pool to 6–8.

### Short-Term (New Mechanics)

5. **Difficulty scaling function** — Replace hardcoded diff values with `baseDiff + scalingFactor * completionCount`. After 10 completions of the same encounter, difficulty should increase meaningfully. Reference: `encounter-content.ts` template definitions.

6. **Wire the desire system** — All desire values are `?`. Either connect the desire multiplier from agent personality/needs, or remove the field from traces to avoid confusion. Check `phaseAgentDecision.ts` for where desire should be populated.

7. **Add frontier encounter content** — Create 5–10 templates for wilderness/frontier locations: foraging, survival camps, ruins exploration, wildlife encounters. These would serve the cairn/hollow locations where agents currently starve.

8. **Fix duplicate DECIDE logging** — Investigate why the decision pipeline fires twice per tick. Check `phaseAgentDecision.ts` for double-invocation. If intentional (e.g., backup decision), document it; if not, fix it.

### Medium-Term (System Changes)

9. **Diminishing returns on repeated encounters** — After completing the same encounter N times, reduce its score by a decay factor. This creates pressure to try different encounters or travel to new locations.

10. **Location reputation / discovery system** — Agents that travel to new locations gain awareness of that location's encounter pool. Combined with exploration bonus, this creates a natural exploration → discovery → exploitation loop.

11. **Encounter unlock chains** — Completing certain encounters unlocks harder versions or new templates. This is the natural path to difficulty escalation and variety expansion.
