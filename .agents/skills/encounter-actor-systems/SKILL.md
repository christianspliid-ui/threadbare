---
name: encounter-actor-systems
description: >
  Use when analysing, debugging, iterating, or tuning the encounter and actor systems.
  Triggers on "encounter", "actor", "agent decision", "encounter pool", "awareness",
  "eligibility", "scoring", "resolution", "capability", "sigmoid", "domain capability",
  "filter pipeline", "encounter cache", "threat", "cooldown", "familiarity", "quintessence",
  "reward pool", "doubles", "fate forecast", "tier promotion", "mastery decay", "attachment",
  "encounter template", "encounter seeding", "encounter aftermath", or when debugging why
  an agent is idle, stuck, choosing wrong encounters, or failing resolution unexpectedly.
  Also use when updating encounters-agents-reference.html or tick-cycle-reference.html.
last_validated_against: 2026-05-08
---

# Encounter & Actor Systems — Analysis, Debugging & Iteration

> **Prerequisite:** Load the `state-of-game-design` router first; for encounter work pull in `reference/cosmology.md` (Reaches/Spheres) + `reference/verbs-resolution.md` (verbs, resolution, prerequisites).
> **Step 0 (Canon pre-read):** Read `Docs/canon/agents.md` and `Docs/canon/encounters.md` before using this skill. This skill spans both domains; both canon pages are required context.

This skill is for **working with** the encounter and actor systems — debugging pipelines, tuning constants, understanding why agents behave a certain way, iterating on encounter design, and keeping reference documentation current. For *authoring new encounter content*, use `encounter-pipeline` instead.

## Quick Orientation

The encounter system is a **multi-stage pipeline** that answers one question per idle agent per tick: *"What should this agent do next?"* The answer is always one of: start a local encounter, attempt a remote action, queue movement toward a distant encounter, or idle.

**Two reference documents** cover the human-facing rules:
- `public/encounters-agents-reference.html` — Agent stats, attachments, encounter types, resolution, divine intervention, decision pipeline
- `public/tick-cycle-reference.html` — All 40+ orchestrator phases in tick order, with reads/writes/RNG tags

**Both files are maintained as part of this skill's responsibility** (see Maintenance section at the end).

---

## 1. The Pipeline at a Glance

```
Tick Phase 2a.5: Encounter Progression (resolve active encounters)
    → 2a.7: Encounter Revelations (nearby agents learn about outcomes)
    → 2a.6: Encounter Visibility (notify threaded agents)
    → 2a.8: Encounter Seeding (aftermath spawns follow-up encounters)
    → 2a.9: Divine Premonition (whisper hints to idle threaded agents)

Tick Phase 2b: Agent Decision (the big one — choose next encounter)
    → 2.35: Agent Movement (advance one hex toward destination)
```

**Phase 2b is where most debugging happens.** It runs the full 8-stage filter/score pipeline for each idle spotlight agent.

---

## 2. File Map — Where Everything Lives

### Core Pipeline (read these first for any encounter work)

| File | What it does | Key exports |
|------|-------------|-------------|
| `src/engine/phaseAgentDecision.ts` | Orchestrator phase: runs filter→score→select for each idle agent | `phaseAgentDecision()` |
| `src/engine/encounterFilterPipeline.ts` | 5-stage reduction: awareness → visibility → prereqs → outgrowth → threat → diversity cap → cooldown | `filterByAwareness()`, `filterByVisibility()`, `filterByPrerequisites()`, `filterByOutgrowth()`, `isWithinThreatTolerance()` |
| `src/engine/encounterScoring.ts` | Deterministic scoring: value-per-tick × desire + resonance + bonuses | `scoreEncounters()`, `computeResonance()` |
| `src/engine/encounterCache.ts` | Pre-computed template×location cache entries | `EncounterCacheManager`, `buildFullCache()`, `selectDifficultyTier()` |
| `src/engine/encounterAwareness.ts` | Hex-distance visibility per reach domain | `filterByAwareness()`, `computeAwarenessHops()`, `resolveLocationToHex()` |

### Resolution (how outcomes are determined)

| File | What it does | Key exports |
|------|-------------|-------------|
| `src/engine/resolutionService.ts` | Shared resolver: P = cap + sphere - difficulty + mods + nudge, clamped [0.05, 0.95], doubles-based crits | `computeResolutionThreshold()`, `classifyResolutionRoll()` |
| `src/engine/resolutionModifiers.ts` | Modifier assembly: sphere + equipment + terrain + faction + traits + test shapers | `computeResolutionModifiers()` |
| `src/engine/encounter.ts` | Encounter lifecycle: initiate → resolve step → advance → abandon | `initiateEncounter()`, `resolveEncounter()`, `advanceEncounter()` |
| `src/engine/phaseEncounterProgression.ts` | Tick-down active encounters, resolve when step duration expires | `phaseEncounterProgressionV2()` |

### Actor Capability (the "stat sheet")

| File | What it does | Key exports |
|------|-------------|-------------|
| `src/engine/domainCapability.ts` | Graph walk → raw score → sigmoid → 0–1 capability per reach | `computeRawScore()`, `computeCapability()`, `computeTier()`, `computeFullProfile()`, `getNarrativeLabel()` |
| `src/engine/capabilityGrowth.ts` | Post-resolution growth: base × difficulty × diminishing returns | `applyEncounterGrowth()` |
| `src/engine/tierPromotion.ts` | On tier crossing: faction rank bump, narrative event | `handleTierPromotion()` |

### Agent Selection & Detail

| File | What it does | Key exports |
|------|-------------|-------------|
| `src/engine/agentSelection.ts` | 6-step probabilistic selection: alignment → divine → disposition → personality → top-N → softmax | `runSelectionPipeline()` |
| `src/engine/agentDetail.ts` | Full agent snapshot for UI/debug | `getAgentDetail()` |

### Encounter Content & Templates

| File | What it does | Key exports |
|------|-------------|-------------|
| `src/data/encounter-content.ts` | Registry of all encounter templates | `getAnyEncounterById()`, `getEncountersByLocationType()` |
| `src/data/encounters/*.ts` | Individual encounter template files | Each exports an `EncounterTemplate` |
| `src/types/encounter.ts` | Type definitions + tuning constants | `EncounterTemplate`, `EncounterStep`, `EncounterProgress`, `ENCOUNTER_TYPE_MOTIVATIONS` |

### Awareness & Visibility

| File | What it does | Key exports |
|------|-------------|-------------|
| `src/engine/encounterAwareness.ts` | Hex-distance awareness: `hops = BASE + floor(cap / PER_HOP)` | `computeAwarenessHops()` |
| `src/engine/factionAwareness.ts` | Faction network intel: rank → how many top encounters visible | Faction encounter awareness |
| `src/engine/questVisibility.ts` | `visibleTo` gate checks: faction/agent/archetype/culture | `isEncounterVisibleToAgent()` |

### Seeding, Aftermath & Consequences

| File | What it does | Key exports |
|------|-------------|-------------|
| `src/engine/encounterSeeding.ts` | Spawn follow-up encounters from aftermath seeds | `evaluateEncounterSeeds()` |
| `src/engine/encounterAftermath.ts` | Apply outcome: trait mods, reputation, reward pool | `applyEncounterOutcome()`, `processRewardPool()` |

### Constants — The Tuning Surface

| File | What it contains |
|------|-----------------|
| `src/data/agent-behavior-constants.ts` | **~56 named constants** — the single tuning surface for encounter behavior. Covers scoring, awareness, filtering, resolution modifiers, growth, reputation, familiarity, travel, exploration. **Edit here, not in logic files.** |

---

## 3. The 8-Stage Filter/Score Pipeline (Phase 2b Detail)

When debugging "why didn't agent X pick encounter Y?", trace through these stages in order:

| Stage | What it does | Common failure modes |
|-------|-------------|---------------------|
| **1. Gather** | Merge static encounter-cache + dynamic social/faction/lifecycle candidates | Template not registered in content registry; location subtype not in template's `locationTypes` |
| **2. Awareness + Faction** | Hex-distance visibility per reach + faction network intel | Agent too far away; agent's best reach capability gives too few awareness hops; faction rank too low for intel |
| **3. Visibility** | `visibleTo` gates: faction, agent, archetype, culture | Template has `visibleTo` restriction agent doesn't match |
| **4. Prerequisites + Outgrowth** | Chain gates, trait gates, blocked traits, outgrowth retirement | Agent missing prerequisite trait/attachment; agent has a blocked trait; capability far exceeds difficulty (outgrown) |
| **5. Threat** | Threat tolerance (currently **disabled**: `THREAT_FLOOR_FILTER = false`) | Only relevant if re-enabled |
| **6. Diversity Cap** | Cap at `MAX_SCORED_CANDIDATES` (40) preserving `MIN_DIVERSITY_SLOTS` per type | Rare — only matters with huge candidate pools |
| **7. Cooldown + Retirement** | Recently abandoned (6 ticks) / completed (20 ticks) / exhausted templates | Agent just finished that encounter; template hit max completions |
| **8. Score + Select** | Rank by: `(rewardEstimate / tickCost) × desire × personality + resonance + bonuses - travelCost - familiarity` | Best score below `IDLE_SCORE_THRESHOLD` (0.0001) → agent idles |

### Key Scoring Signals

- **Value-per-tick**: `computeRewardEstimate(template) / computeTotalTickCost(steps)`
- **Desire multiplier**: axiological motivation alignment (encounter type → value pair → agent's value score)
- **Resonance**: hex sphere + world-soul sphere alignment with encounter's reach
- **Travel cost**: hex distance × `TRAVEL_COST_WEIGHT` (same-hex = free, remote-no-presence = free)
- **Familiarity penalty**: `FAMILIARITY_DECAY_PER_ATTEMPT` per previous attempt, up to `FAMILIARITY_MAX_PENALTY`
- **Exploration bonus**: `EXPLORATION_NOVELTY_BONUS` for unvisited locations, decays over `EXPLORATION_BONUS_DECAY_TICKS`
- **Context bonuses**: chain progress, rarity, social bonds, reputation, ruins, anomalies, divine hunch

---

## 4. Resolution Formula

```
P = capability + sphereFactor + actionModifiers + influenceNudge - difficulty
    clamped to [0.05, 0.95]

Roll d100:
  roll ≤ P  AND doubles → Critical Success
  roll ≤ P  NOT doubles → Success
  roll > P  NOT doubles → Failure
  roll > P  AND doubles → Critical Failure
```

**Doubles** = both digits match (11, 22, 33, ..., 99). This means higher capability shifts doubles toward crits-success and away from crits-failure.

**Modifier sources** (collapsed into `actionModifiers`):
- Sphere alignment/opposition
- Equipment bonuses (capped: `EQUIPMENT_PER_ITEM_CAP=0.08`, total `EQUIPMENT_MODIFIER_CAP=0.15`)
- Terrain modifiers
- Faction control bonus / hostile penalty
- Trait resolution bonuses
- Test shapers (equipment-based outcome shifts)

**Fate Forecast tiers** (pre-resolution, player-visible):
| P range | Forecast |
|---------|----------|
| 0.05–0.20 | Doomed |
| 0.20–0.40 | Perilous |
| 0.40–0.60 | Uncertain |
| 0.60–0.80 | Favorable |
| 0.80–0.95 | Fated |

---

## 5. Actor Capability (The Sigmoid)

```
raw_score = sum of: origin traits + mastery (×level) + scars + reputation
            + conditions + destiny + artifacts + enchantments + resources

capability = 1 / (1 + e^(-SIGMOID_K × (raw_score - SIGMOID_MIDPOINT)))
             clamped to [0.05, 0.95]

SIGMOID_MIDPOINT = 10, SIGMOID_K = 0.4
```

**10-tier narrative lexicon**: capability maps to tier 1–10, each reach has its own adjective vocabulary (e.g., Iron tier 7 = "Fearsome", Gold tier 7 = "Affluent").

**Expected ranges by actor profile**:
| Profile | Raw score | Expected tier |
|---------|-----------|---------------|
| Mortal, origin only | 2–4 | 3–4 (Sturdy–Trained) |
| Mortal + 2–3 masteries | 6–10 | 5–6 (Steeled–Tempered) |
| Veteran + artifacts | 10–15 | 6–7 (Tempered–Fearsome) |
| Legendary figure | 15–25 | 8–9 (Dread–Ruinous) |
| God-tier entity | 25+ | 9–10 (Ruinous–Cataclysmic) |

**Capability growth post-encounter**:
```
growth = BASE_ENCOUNTER_GROWTH × difficulty × (1 - diminishing_returns)
  success: full growth
  failure: × FAILURE_GROWTH_FRACTION (0.2)
  tier promotion eligible: × PROMOTION_ELIGIBLE_MULTIPLIER (2.0)
```

---

## 6. Debugging Checklists

### "Agent is idle / not picking encounters"

1. **Check the agent is unoccupied**: CLI `agent <name>` — look for `occupiedUntilTick` or active `encounterProgress`
2. **Check encounter cache exists**: CLI `encounters <name>` — if empty, the cache may not have built for their location
3. **Check awareness range**: The agent's best reach capability determines their awareness hops. Low capability = tiny vision radius. Use `eval` to check: `computeAwarenessHops(state, agentId, 'iron')`
4. **Check cooldowns**: Recently completed/abandoned encounters are cooled down. CLI `encounters <name>` shows cooldown state
5. **Check scoring threshold**: If best score < `IDLE_SCORE_THRESHOLD` (0.0001), agent idles. Trace scoring output
6. **Check starvation counter**: After 10 consecutive starvation ticks, agent force-travels to nearest content location
7. **Check location subtype**: Does the agent's location have encounter templates? Settlement promotions change subtypes, which changes available encounters

### "Agent keeps picking the wrong encounter"

1. **Check desire multiplier**: The encounter type's axiological motivation pair must align with the agent's values. Misaligned values = low desire score
2. **Check familiarity penalty**: Repeated encounters decay in score. High familiarity = agent avoids it
3. **Check travel cost**: Distant encounters are penalized by hex distance. A good encounter far away loses to a mediocre one nearby
4. **Check resonance**: Sphere alignment between agent, location hex, and world-soul boosts/dampens encounter scores
5. **Check context bonuses**: Chain progress, rarity, social bonds, divine hunch all modify scores
6. **Compare scores**: Use traces to see the actual score breakdown for competing candidates

### "Resolution outcomes seem wrong"

1. **Verify the noun first** (CLAUDE.md debugging protocol): Confirm the actor identity. Check `actorId` is who you think. `@hero` may resolve to the wrong entity
2. **Check capability in the step's reach**: The step's `reach` field determines which domain capability is used. Agent might be strong in Iron but the step tests Eye
3. **Check difficulty normalization**: Legacy templates use 0–100 difficulty; the resolver divides by 100. Templates with normalized 0–1 difficulty should NOT be divided again
4. **Check modifier assembly**: Trace `computeResolutionModifiers()` output — equipment caps (0.08/item, 0.15 total), sphere alignment, terrain
5. **Check the roll**: Doubles mechanics shift crit distribution with capability. Low capability → more crit failures from doubles. High → more crit successes
6. **Check clamping**: P is clamped to [0.05, 0.95] — even impossible-seeming situations have a 5% floor/ceiling

### "Encounter not appearing for an agent"

1. **Template registered?** Check `src/data/encounter-content.ts` — template must be in the registry
2. **Location match?** Template's `locationTypes` must include the agent's location subtype
3. **Awareness range?** Agent must be within hex-distance awareness hops for the encounter's location
4. **Visibility gate?** Check template's `visibleTo` — might require specific faction, archetype, or culture
5. **Prerequisites?** Template may require traits, attachments, or chain completion the agent lacks
6. **Outgrown?** If agent's capability far exceeds difficulty (`OUTGROWTH_CAP_THRESHOLD`), template is retired
7. **Cooldown?** Check if agent recently completed/abandoned this template

---

## 7. CLI Commands for Encounter Debugging

```bash
# Overview
encounters [agent]        # list encounter state for agent (or all)
status                    # game overview including encounter counts

# Spawn encounters directly
spawn encounter <agent|@hero> <encounterId> [--courtPosition X]
spawn encounter-context <encounterId> [--agent <agent|@hero>] [--at <location|actor>] [--hex <col> <row>]

# Inspect agents
agent <name>              # full agent detail including capabilities, traits, attachments
agents                    # list all agents with summary

# Debug pipeline
traces [N]                # recent trace events (encounter decisions emit traces)
eval <expr>               # JS with `state` in scope — inspect any internal state

# Health checks
tick 30 && encounters     # advance 30 ticks then check encounter activity
run 5 && status           # auto-run ~30 ticks then check overall health
```

### Debug Bridge (browser console / preview_eval)

```javascript
// Pipeline diagnostics
await window.__DEBUG.inspectEncounterPipeline()    // active encounters, notifications, thread state
await window.__DEBUG.getHealthReport()              // overall system health

// Manual encounter spawning
window.__DEBUG.spawnEncounter('Serafina', 'wandering-healer-shrine-access')

// Action system
window.__DEBUG.listActions('Serafina')              // available action templates
window.__DEBUG.fireAction('Serafina', 'charm')      // fire action immediately

// Encounter log export (for agent-analyser skill)
const logs = await window.__DEBUG.exportEncounterLogAll()  // TSV per agent

// Navigate to agent
window.__DEBUG.gotoAgent('Serafina')                // zoom camera to agent's hex
```

---

## 8. Key Constants Quick Reference

All live in `src/data/agent-behavior-constants.ts`. Edit here to tune behavior.

### Scoring
| Constant | Default | What it controls |
|----------|---------|-----------------|
| `IDLE_SCORE_THRESHOLD` | 0.0001 | Below this → agent idles instead of forcing a weak pick |
| `MINIMUM_DESIRE` | (check file) | Floor on desire multiplier |
| `GROWTH_REWARD_WEIGHT` | (check file) | How much growth potential boosts encounter value |
| `PERSONALITY_SCORE_EXPONENT` | (check file) | How much personality amplifies/dampens scores |

### Awareness
| Constant | Default | What it controls |
|----------|---------|-----------------|
| `BASE_AWARENESS_HOPS` | (check file) | Minimum hex visibility for all agents |
| `CAPABILITY_PER_HOP` | (check file) | How much capability grants one additional awareness hop |
| `MAX_AWARENESS_HOPS` | (check file) | Hard ceiling on awareness range |

### Filtering
| Constant | Default | What it controls |
|----------|---------|-----------------|
| `MAX_SCORED_CANDIDATES` | 40 | Performance cap on scored candidates |
| `MIN_DIVERSITY_SLOTS` | (check file) | Minimum slots per encounter type in diversity cap |
| `THREAT_FLOOR_FILTER` | false | Whether threat tolerance stage is active |
| `OUTGROWTH_CAP_THRESHOLD` | (check file) | Capability threshold for retiring trivial encounters |

### Resolution
| Constant | Default | What it controls |
|----------|---------|-----------------|
| `PROBABILITY_FLOOR` | 0.05 | Minimum success probability |
| `PROBABILITY_CEILING` | 0.95 | Maximum success probability |
| `EQUIPMENT_PER_ITEM_CAP` | 0.08 | Max modifier from a single piece of equipment |
| `EQUIPMENT_MODIFIER_CAP` | 0.15 | Max total equipment modifier |

### Growth & Decay
| Constant | Default | What it controls |
|----------|---------|-----------------|
| `BASE_ENCOUNTER_GROWTH` | 0.5 | Base capability growth per resolved encounter |
| `FAILURE_GROWTH_FRACTION` | 0.2 | Growth multiplier on failure (learn from mistakes) |
| `FAMILIARITY_DECAY_PER_ATTEMPT` | (check file) | Per-attempt penalty on repeated encounters |
| `FAMILIARITY_MAX_PENALTY` | (check file) | Hard cap on familiarity penalty |

### Cooldowns
| Constant | Default | What it controls |
|----------|---------|-----------------|
| `ENCOUNTER_ABANDON_COOLDOWN` | 6 ticks | Cooldown after abandoning an encounter |
| `ENCOUNTER_COMPLETION_COOLDOWN` | 20 ticks | Cooldown after completing an encounter |

---

## 9. Common Iteration Patterns

### "Agents are too passive / idle too much"
- Lower `IDLE_SCORE_THRESHOLD` to make agents accept weaker encounters
- Increase `BASE_AWARENESS_HOPS` so agents see more candidates
- Check location subtype coverage — are there enough templates for the location types on the map?
- Check if `OUTGROWTH_FILTER_ENABLED` is removing too many candidates for high-capability agents

### "Encounters are too easy / too hard"
- Adjust template difficulty values in the encounter templates themselves
- Check the sigmoid curve: `SIGMOID_MIDPOINT` and `SIGMOID_K` shape how raw scores map to capability
- Check equipment modifier caps — are items pushing capability too high?
- Review `BASE_ENCOUNTER_GROWTH` — faster growth means agents outpace content faster

### "Same encounters keep repeating"
- Increase `FAMILIARITY_DECAY_PER_ATTEMPT` to penalize repetition harder
- Increase `EXPLORATION_NOVELTY_BONUS` to reward trying new things
- Check diversity cap — `MIN_DIVERSITY_SLOTS` ensures type variety in the candidate pool
- Add more encounter templates for the common location subtypes

### "Resolution crits feel wrong"
- Remember: doubles-based crits are probability-aware. High capability → more crit success, fewer crit failure
- The crit rate is fixed at ~9% of all rolls (doubles 11–99), but which side they land on shifts with P
- If crits feel too common/rare overall, the issue is likely the base probability (capability vs difficulty), not the crit system itself

---

## 10. Reference HTML Maintenance

This skill owns the accuracy of two public reference documents:

### `public/encounters-agents-reference.html`
**Covers:** Nine Reaches, Domain Capability (sigmoid, tiers, narrative lexicon), Species profiles, Traits & Mastery, Attachments (6 categories, rarity tiers, equipment mechanics), Encounters (10 types, threat ratings, location coverage, reward pool), Resolution Pipeline (formula, modifiers, fate forecast, doubles, contested actions), Divine Intervention (nudge levels, thread tiers, dream interface, alignment costs, notifications), Agent Decisions (8-stage pipeline, scoring signals, decision outcomes, runtime guards, quintessence).

**Structure:** JavaScript `CHAPTERS` array of `{ num, title, color, summary, rules[] }`. Each rule has `{ name, desc, tags[], table?, formula? }`. The HTML renders these as collapsible chapters with searchable rule cards.

### `public/tick-cycle-reference.html`
**Covers:** All 12 orchestrator acts (40+ phases) in tick order. Each phase has `{ id, name, fn, desc, reads[], writes[], tags[] }`.

**Structure:** JavaScript `ACTS` array of `{ num, title, color, summary, phases[] }`. Rendered as collapsible acts with phase cards showing reads/writes/RNG tags.

### When to Update

Update these files whenever:
- A new orchestrator phase is added, removed, or reordered
- Encounter pipeline stages change (filter logic, scoring formula, awareness rules)
- Resolution formula or modifier sources change
- New encounter types, attachment categories, or trait categories are added
- Constants referenced in the docs change default values
- Agent decision pipeline logic changes
- New divine intervention actions or thread tier mechanics are added

### How to Update

1. Read the relevant section of the HTML file (the JS data arrays, not the CSS/rendering)
2. Identify which `CHAPTERS` entry (encounters ref) or `ACTS` entry (tick cycle ref) needs updating
3. Edit the JavaScript data inline — the rendering code is generic and doesn't need changes
4. Verify the page renders correctly by loading it in the browser
5. Note the update in `Docs/changelog.md`

---

## 11. Related Skills

| Skill | When to use instead |
|-------|-------------------|
| `encounter-pipeline` | *Authoring* new encounter content (4-pass draft→editorial→audit→merge) |
| `attachment-pipeline` | *Authoring* new attachments using the primitive vocabulary |
| `agent-analyser` | Post-hoc *analysis* of exported encounter log TSVs |
| `engine-architecture` | General engine patterns (tracing, PRNG, fail-soft, graph ops) |
| `state-of-game-design` (router) | Foundational context — routes to `reference/cosmology.md` (cosmology, reaches, spheres) + `reference/verbs-resolution.md` (action system) |
| `testing-patterns` | Writing tests for encounter/actor changes |
