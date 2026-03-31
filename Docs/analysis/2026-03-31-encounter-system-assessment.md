# Encounter System Assessment — Seed 42, March 31 2026

**Logs analysed:** 2 exports (62-agent run, ticks 1–200; 38-agent run, ticks 1–262)
**Prior baseline:** 2026-03-30 analysis (8-agent, 644 ticks)

---

## Executive Summary

The encounter system is failing at its core purpose: producing varied, dynamic agent stories. Across both logs the pattern is the same — agents are either permanently idle or trapped in a near-zero-completion loop where they attempt encounters, fail step 1, abandon, immediately re-decide, and repeat. The numbers are stark:

| Metric | Log 1 (62 agents) | Log 2 (38 agents) | Healthy Target |
|--------|-------------------|-------------------|----------------|
| Active rate | 21% (13/62) | 42% (16/38) | >70% |
| Completion rate | 0.8% (7/881) | 0.5% (7/1394) | 30–60% |
| Pipeline filter kill | 97.3% | 98.1% | <50% |
| Mean probability | 0.08 | 0.06 | 0.30–0.50 |
| Mean capability | 8/100 | 4/100 | 40–60 |
| Agents that moved | 6% (4/62) | 5% (2/38) | >50% |
| Desire at 0.01 (minimum) | 90% of decides | 87% of decides | <20% |

**The system has too many layers of complexity producing a single emergent failure mode: nothing works.**

---

## The Five Root Causes

### 1. Capability Collapse — Agents Are Born Nearly Powerless

The sigmoid capability formula (`1 / (1 + e^(-0.4*(raw - 10)))`) requires a raw score of ~10 to produce capability 0.50. But most agents — especially Lair Elites — have raw domain scores of 0–2. The sigmoid maps this to capability 0.02–0.08 (cap 2–8 in the logs).

The resolution formula is `probability = clamp(capability - difficulty/100, 0.05, 0.95)`. So an agent with cap=0.05 and diff=5 gets: `0.05 - 0.05 = 0.00 → clamps to 0.05`. That's a 5% success chance per step. For a 2-step encounter: `0.05 × 0.05 = 0.25%` completion probability.

**This is the primary failure.** It doesn't matter how good the encounter templates, scoring, or variety are — if agents can't pass step 1, the whole system produces nothing but abandoned encounters.

The Lair Elites (30–40 agents per run) are the worst affected. They have essentially zero capability in every reach, so every encounter is a guaranteed failure. They cycle through templates at maximum speed because each one fails immediately, producing the illusion of "activity" (130+ decides per 200 ticks) with zero completions.

### 2. The Filter Pipeline Kills 97–98% of Candidates

The encounter filter pipeline passes through 5+ stages and eliminates almost everything. The pipeline numbers in IDLE events show the cascade:

```
pipeline=29396>753>753>0>0>0
         total  aware vis  prereq outgrowth cap
```

Typical pattern: ~30,000 total entries → ~750 survive awareness → 0 survive prerequisites/threat/outgrowth. This means for most agents, at most ticks, there are literally zero encounter candidates. They idle permanently.

For the named agents that DO get candidates (Jorik, Kira, Hestia, etc.), the pool is tiny — 1–5 encounters at their location. Combined with 6-tick cooldowns, they cycle the same templates endlessly.

### 3. Desire/Scoring Is Flatlined

90% of DECIDE events show `desire=0.01` (the minimum). The axiological profile scoring, which is supposed to make agents prefer encounters that match their personality and values, is producing near-zero differentiation. Encounter selection is effectively random from whatever tiny pool survives the filter.

Scores cluster in two bands: `~0.00` (the 341 Lair Elite decisions with no real preference) and `~0.30` (the named agents with a slight base score). There is no meaningful score variance within an agent's options — they're not choosing, they're taking whatever exists.

### 4. Zero Movement Economy

Only 4–6% of agents ever move. The travel cost in the scoring formula makes local encounters always win over distant ones. Since most agents have 0–5 local encounters (after filtering), they exhaust local content immediately and then idle forever.

Even the few agents that travel (Kira, Iron Wolves Commander) do so slowly and visit limited locations. Kira made 127 move events in log 1 but only visited 6 locations. The map is large but agents experience almost none of it.

### 5. Encounter Templates Are Tuned for Agents That Don't Exist

The 68+ encounter templates assume agents with meaningful domain capabilities (cap 40–80) facing moderate difficulties (diff 20–50). But the actual agent population has cap 2–8. The templates are designed for a different game than the one that's running.

Similarly, the 10 encounter types and axiological motivation mapping are sophisticated systems producing zero behavioral differentiation because desire is always 0.01.

---

## Per-Agent-Type Assessment

### Lair Elites (30–45 per run, ~70% of agents)

These are the worst-performing agent class. They have near-zero capabilities, spawn at lair locations with limited encounter content, never move, and fail every encounter they attempt. In log 1: 7 "active" Lair Elites collectively made 862 decisions and completed 1 encounter (0.1%). They cycle through `listen_for_rumors`, `trace_ley_lines`, `study_surroundings` etc. — all trivial encounters they still can't complete.

### Named Agents (Dara, Dren, Gale, Jorik, Kira, etc.)

Better but still broken. They have higher capabilities in 1–2 reaches (cap 50–100) but low in others (cap 2–10). They can complete encounters in their strong reaches but cycle the same 3–7 templates at their spawn location. Jorik's pattern across both logs: master_local_craft → master_craftsman_challenge → weave_political_alliance → repeat. Kira gravitates to master_craftsman_challenge and salvage_operation.

Notable: Dara and Gale are permanently idle in log 1 (200 ticks of `no_candidates_after_filter`) but Dara is active in log 2. This suggests their starting location matters enormously — a content desert location = permanent death sentence.

### Faction Commanders (Iron Wolves, Scarlet Company)

The healthiest agents. They have moderate capabilities, travel between locations, and attempt varied encounters. Iron Wolves Commander made 100 move events in log 1 and visited 8 locations. But even they repeat: `festival_of_spheres` 15 times, `rally_the_locals` a few times.

### Special Agents (Shadow's New Thread, Fen)

Interesting edge cases. Fen in log 2 attempted `merchants_gambit` 164 out of 170 times — a single encounter consuming 96% of all decisions. This is the most extreme round-robin in either log. Shadow's New Thread attempted 11 unique encounters but completed zero.

---

## System Complexity vs. Value Delivered

The encounter system currently has:

- 16-component encounter scoring formula
- 5-stage filter pipeline with awareness, visibility, prerequisites, threat tolerance, outgrowth
- 10 encounter types with axiological motivation mapping
- 68+ encounter templates with multi-step sequences
- Sigmoid capability computation walking graph neighborhood (traits, artifacts, resources)
- Per-step difficulty with escalation
- 6-tick completion and abandonment cooldowns
- Encounter chains with prerequisite stages
- Familiarity penalties, exploration bonuses, chain bonuses
- Faction boost, local resonance, global resonance

**All of this complexity is currently producing: agents that either idle permanently or fail everything.** The elaborate machinery is not generating varied, dynamic behavior — it's generating a single degenerate state.

---

## Simplification Proposal

The goal: agents should move around the map doing different encounters that create stories. Everything else is secondary. Rather than tuning 50 constants in a 16-component formula, strip back to what's needed to produce that core behavior and rebuild complexity once the foundation works.

### Phase 1: Make Encounters Completable (the crisis fix)

**Problem:** cap=2–8 agents can't pass diff=3–5 encounters.

**Option A — Flatten difficulty to capability.** Set all encounter step difficulties to 0 (or very low) and have probability be purely `clamp(capability, 0.15, 0.85)`. This makes even weak agents ~15% per step. A 2-step encounter = ~2.25% → still low. So probably need to also collapse multi-step encounters to single-step.

**Option B — Give agents meaningful base capabilities.** Set `domainCapabilities` base values on all agent nodes to 5–15 per reach (instead of 0). With raw=10, sigmoid outputs 0.50, giving prob ~0.45 against diff=5. This is the "raise the floor" approach.

**Option C — Simplify resolution to a flat probability.** Skip the sigmoid entirely. Every encounter step has a flat success probability (e.g., 0.60 for easy, 0.40 for moderate, 0.20 for hard). Agents always have this probability regardless of capability. Capability then modifies it by ±0.10 as a bonus/penalty.

**Recommendation: Option B + reduce step count.** Give all agents base capabilities of 8–12 per reach (adjustable constant). Reduce most encounters to 1–2 steps max. This preserves the capability system's eventual depth while making the game playable now.

### Phase 2: Kill the Filter Pipeline (for now)

**Problem:** 97% of candidates are filtered out, leaving 0 options for most agents.

**Proposal:** Bypass the 5-stage filter entirely. Every encounter at the agent's location (and adjacent hexes) is a candidate. Replace filtering with scoring — bad-fit encounters score low rather than being invisible. This means:

- Remove awareness filter (all local encounters are visible)
- Remove prerequisite filter (prerequisites modify score, not visibility)
- Remove outgrowth filter (outgrown encounters score low, not invisible)
- Remove threat tolerance filter (overly dangerous encounters score low)
- Keep only a hard cap on scored candidates (40) for performance

This alone would turn most idle agents into active ones. A bad encounter choice is better than no encounter choice.

### Phase 3: Fix Desire / Make Personality Matter

**Problem:** 90% of desire values are 0.01.

**Proposal:** Audit the axiological scoring path. Either the motivation mapping is producing near-zero values, or the desire multiplier formula has a bug (the `?` in earlier logs suggested it wasn't wired). A simple fix: set a minimum desire of 0.30 for any encounter that matches at least one of the agent's top-2 value pairs.

### Phase 4: Force Movement

**Problem:** Local encounters always outscore distant ones.

**Proposal:** After an agent completes (or abandons) N encounters at the same location, add a "boredom" multiplier that decays local scores and boosts distant ones. Even a simple counter (`ticksAtLocation > 20 → localScore × 0.5, distantScore × 2.0`) would break the stasis.

### Phase 5: Rebuild Complexity (only after the above works)

Once agents are reliably moving, completing encounters, and showing personality-driven choices, THEN re-add:
- Prerequisite-gated encounter visibility (for progression arcs)
- Difficulty scaling based on capability growth
- Multi-step encounters with escalating difficulty
- Encounter chains

---

## Comparison: Prior Baseline (Mar 30, 8 agents, 644 ticks)

| Metric | Mar 30 (8 agents) | Mar 31 Log 1 (62) | Mar 31 Log 2 (38) | Trend |
|--------|--------------------|---------------------|---------------------|-------|
| Active rate | 75% | 21% | 42% | **Regressed** (diluted by Lair Elites) |
| Completion rate | ~40–60% | 0.8% | 0.5% | **Catastrophic regression** |
| Movement | 0% | 6% | 5% | Slightly improved but still critical |
| Difficulty range | 20–45 only | 3–70 | 3–70 | Wider range but too hard for population |
| Score variance | all 0.00 | some spread | some spread | Slightly improved |

The Mar 30 analysis showed 6/8 agents active with reasonable completion rates. The difference: those 8 agents were all named agents with real capabilities (cap 50–100). The new logs include 30–45 Lair Elites with cap 2–8, which are the majority of the agent population and are entirely broken.

---

## Summary: What to Do Next

The encounter system is over-engineered for the current state of the game. It has 16 scoring components and 5 filter stages producing a single outcome: nothing happens. The path forward is aggressive simplification:

1. **Give agents base capabilities** (constant, ~10 raw per reach) so they can actually pass encounters
2. **Collapse multi-step encounters to 1–2 steps** so completion is achievable
3. **Remove the filter pipeline** and let scoring handle fit (bad fit = low score, not invisible)
4. **Fix desire** so personality influences choices
5. **Add a boredom/movement incentive** so agents don't stay at spawn forever
6. **Verify with logs**, then rebuild complexity incrementally

Each step should be verifiable with a new log export. Don't add the next layer until the current one shows healthy metrics.
