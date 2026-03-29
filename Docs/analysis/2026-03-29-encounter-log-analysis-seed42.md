# Encounter Log Analysis — Seed 42, 210 Ticks, 16 Agents

**Date:** 2026-03-29
**Seed:** 42
**Tick range:** 1–210
**Agents analyzed:** 16 (12 individuals + 2 born-later + 2 shadow threads + 1 oracle)

## Executive Summary

Of 16 agents, only 5 are actively encountering. The other 11 are permanently idle due to `no_candidates_after_filter`. The 5 active agents never move from their spawn location and cycle the same 5-7 encounters in a predictable round-robin. No agent ever travels. No difficulty escalation occurs. Born-later agents get zero encounters.

## Per-Agent Activity Summary

| Agent | Location | Active Ticks | Encounter Types Used | Completions | Abandonments | Status |
|-------|----------|-------------|---------------------|-------------|--------------|--------|
| Fen (ind_9) | Tall Grey Tower | 1–210 | arcane_duel, spell_bargain, relic_hunt, forbidden_tome, mystic_trade, knowledge_test | ~8 | ~25+ | Active, cycling |
| Dara (ind_10) | Fieldbridge | 1–210 | merchants_gambit, merchant_caravan, recruit_militia, market_day_festival, tavern_brawl | ~6 | ~20+ | Active, cycling |
| Hestia (ind_5) | Wraithwood | 1–210 | market_day_festival, arena_combat, pickpocket, smuggle_goods, guild_negotiation, the_haggle | ~6 | ~20+ | Active, cycling |
| Kael (ind_0) | High Greymarket | 1–209 | recruit_militia, guild_aid, aid_refugees, market_haggle, merchant_caravan | ~6 | ~20+ | Active, cycling |
| Jorik (ind_2) | Fieldcross | 1–209 | market_day_festival, guild_negotiation, smuggler_pact, the_haggle, caravan_deal, pickpocket, smuggle_goods | ~5 | ~25+ | Active, cycling |
| Dren (ind_4) | Wind Cathedral | 1–11 | arcane_duel, shadow_ambush, tavern_brawl | 1 | 2 | Dead at tick 12 |
| Isolde (ind_3) | Wind Cathedral | 1–5 | smuggler_pact, barter_survival, tribute_exchange | 0 | 2 | Dead at tick 6 |
| Ashara (ind_1) | Tall Grey Tower | 1–2 | arcane_duel | 0 | 0 | Dead at tick 3 |
| Brynn (ind_8) | Tall Grey Tower | 1–5 | arcane_duel | 0 | 0 | Dead at tick 6 |
| Gale (ind_7) | Tall Grey Tower | 1–5 | arcane_duel | 0 | 0 | Dead at tick 6 |
| Mirael (ind_11) | Tall Grey Tower | 1–12 | mystic_trade | 0 | 0 | Dead at tick 13 |
| The Expected (born_lc_1) | unknown | 64–210 | none | 0 | 0 | 100% idle from birth |
| The Expected (born_lc_2) | unknown | 65–210 | none | 0 | 0 | 100% idle from birth |
| Shadow's New Thread (born_lc_3) | unknown | 145–210 | none | 0 | 0 | 100% idle from birth |
| Shadow's New Thread (born_lc_4) | unknown | 146–210 | none | 0 | 0 | 100% idle from birth |
| The Ashen Oracle | unknown | — | none | 0 | 0 | No events recorded |

## Key Metrics

- **Active agent rate:** 5/16 (31%)
- **Idle rate across all agent-ticks:** ~85%+
- **Unique locations visited (total):** 5 (Tall Grey Tower, Fieldbridge, Wraithwood, High Greymarket, Fieldcross)
- **Agents that traveled to a new location:** 0/16
- **Unique encounter types used:** ~20 out of 64+ available templates
- **Difficulty range observed:** 25/35/45 only (trivial/easy band)
- **Score values observed:** All display as 0.00

## Root Cause Analysis

### 1. Filter Pipeline Creates Content Deserts
The encounter awareness filter (Stage 1) limits visibility by capability-scaled hops. Locations without mapped templates produce zero candidates. No fallback mechanism exists.

### 2. Zero Movement Pressure
travelCost divides score, so local encounters always win. No exploration bonus, novelty multiplier, or familiarity discount exists.

### 3. Small Closed Encounter Pools
5-7 templates per location + 8-tick cooldown = predictable round-robin cycling. Pool exhausts before cooldown matters.

### 4. No Difficulty Escalation
All encounters use diff=25/35/45 regardless of agent growth. No harder variants unlock.

### 5. Born-Later Agents Starved
No encounter content at spawn locations for mid-game-born agents. No bootstrap mechanism.

### 6. Capability Doesn't Differentiate Behavior
Agent values/personality have no visible effect because local pool is too small to choose between.

### 7. Score Display Bug
All scores show 0.00 — either a rounding/display issue or the scoring system produces near-zero values.

## Encounter Type Distribution (Active Agents)

### Fen (Tall Grey Tower) — Magic/Knowledge
- arcane_duel (eye/veil): ~8 attempts, ~3 completions
- spell_bargain (veil/gold): ~8 attempts, ~3 completions
- relic_hunt (eye/shadow): ~6 attempts, ~2 completions
- forbidden_tome (eye/veil): ~6 attempts, ~1 completion
- mystic_trade (veil/gold): ~6 attempts, ~2 completions
- knowledge_test (eye): ~2 attempts, ~0 completions

### Dara (Fieldbridge) — Trade/Military
- merchants_gambit (gold/eye): ~8 attempts, ~3 completions
- merchant_caravan (gold/eye): ~5 attempts, ~3 completions
- recruit_militia (heart/iron): ~8 attempts, ~1 completion
- market_day_festival (gold/heart): ~5 attempts, ~2 completions
- tavern_brawl (iron/flesh): ~3 attempts, ~1 completion

### Capability Growth Observed
| Agent | Reach | Start Cap | End Cap | Growth |
|-------|-------|-----------|---------|--------|
| Fen | eye | 100 | 100 | 0 (already capped) |
| Fen | veil | 100 | 100 | 0 (already capped) |
| Dara | gold | 100 | 100 | 0 (already capped) |
| Dara | heart | 77 | ~86 | +9 over 210 ticks |
| Dara | eye | 83 | ~91 | +8 over 210 ticks |
| Hestia | gold | 96 | ~98 | +2 |
| Hestia | heart | 94 | ~97 | +3 |
| Kael | heart | 100 | 100 | 0 |
| Kael | gold | 100 | 100 | 0 |

Most agents start near capability cap (100) for their primary reaches, making growth invisible.

## Recommendations

### Immediate (tuning constants)
1. **Repetition penalty**: `score *= 1 / (1 + timesCompleted * REPETITION_DECAY)` — reduces score for oft-repeated encounters
2. **Longer/scaling cooldowns**: Scale cooldown by completion count, not fixed 8 ticks
3. **Exploration bonus in scoring**: Add novelty multiplier for unvisited locations
4. **Fix score display**: Show actual float values in log, not rounded to 0.00

### Short-term (new mechanics)
5. **Fallback ambient encounters**: Every location gets 1-2 trivial encounters (rest, forage, survey) to prevent permanent idle
6. **Born-later bootstrap**: Place new agents at locations with content, or give them an arrival encounter
7. **Difficulty progression**: Unlock harder encounter variants after N completions of easier ones

### Medium-term (system changes)
8. **Familiarity discount**: After N encounters at a location, all local scores decay — natural push to move
9. **Encounter chains**: Completing one encounter unlocks follow-ups at same or different locations
10. **Larger/dynamic template pools**: Generate encounters from location properties rather than fixed lists
11. **Cross-location visibility**: Let agents see encounters further away to create movement goals
