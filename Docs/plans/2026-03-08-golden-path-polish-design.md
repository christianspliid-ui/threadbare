# Golden Path Polish Sprint — Design Document

> Fixes the 5 critical/major findings from the 2026-03-08 playtest batch so the headless simulation produces a living, evolving world.

## Problem Statement

The first playtest batch (seeds 42, 7, 100 at 50 ticks) revealed that the simulation is essentially frozen: doom clock stays at stage 1, every agent action produces identical prose, no dilemmas fire, mandate never progresses, reputation is static, and the population is fixed. The underlying systems work mechanically (tests pass), but their activation conditions are too strict for the tick budgets and world states that occur naturally.

## Scope

Five focused fixes to the orchestrator and supporting engines. No new UI work. No new systems. Just tuning existing systems to actually fire during normal simulation runs.

---

## Fix 1: Doom Clock Advances in Short Runs

**Root cause:** `DEFAULT_DOOM_TICKS = 360` means stage 2 starts at tick 72. A 50-tick playtest never reaches 20% progress.

**Decision:** Add a `doomSpeed` multiplier to GameState initialization, defaulting to 1.0. The playtest runner passes a higher multiplier (e.g., 3.0) to compress doom progression into shorter runs. For real gameplay the default 360-tick cycle remains untouched.

**Implementation:**
- Add optional `doomSpeed` param to `initializeGameState()`
- In `advanceDoomClock()`, advance by `tickModifier * doomSpeed` instead of just `tickModifier`
- Playtest runner passes `doomSpeed: 3.6` (360/100 = stages every ~20 ticks in 100-tick runs)

**Alternative rejected:** Lowering `DEFAULT_DOOM_TICKS` globally. This changes the feel of real gameplay. We want the fix to be playtest-scoped.

---

## Fix 2: Narrative Prose Differentiates

**Root cause:** `phaseAgentActions` generates static messages `"{name} acted in the realm of {sphere}."` with significance 0.3–0.8. The narrative engine only processes events with significance ≥ 0.8, and even those just route to `generateRoutineProse()` which uses templates. But the *message field* on the TickEvent is what shows up in logs — and it's always the static string.

**Decision:** Three changes:
1. **Use routine prose for agent actions** — call `generateRoutineProse()` in `phaseAgentActions` to produce varied messages for every agent action, not just static text
2. **Ensure some events reach notable tier** — bump the significance formula so ~10% of agent actions hit ≥ 0.8 (currently max is 0.8, so nothing reaches notable)
3. **Add notable action events** — every N ticks, force one high-significance (0.85) event that routes through the full narrative pipeline

**Implementation:**
- Import `generateRoutineProse` into orchestrator
- Replace static message with `generateRoutineProse('action_resolved', { actorName, sphere, ... }, seed)`
- Change significance formula from `0.3 + rng() * 0.5` (max 0.8) to `0.3 + rng() * 0.6` (max 0.9) — this gives ~17% chance of ≥ 0.8
- Every 5 ticks, select a random agent and generate a significance-0.85 "notable action" event

---

## Fix 3: Dilemmas Fire at Realistic Rates

**Root cause:** Stakes accumulate from domain (iron=0.4, gold=0.3) + sentiment (threshold > 0.7, never met because sentiment starts at 0) + factionLeader (almost never set) + territory (hardcoded false). Most events get stakes 0-0.4, never reaching the 0.6 threshold.

**Decision:** Three changes:
1. **Lower stakes threshold** from 0.6 to 0.3 — this means iron domain alone triggers a dilemma
2. **Add a base stakes floor** — every dilemma candidate gets a base 0.1 stakes just for existing
3. **Seed initial relationship sentiments** — during world seeding, give relationships non-zero sentiment (-0.5 to 0.5) so the extreme sentiment bonus can contribute

**Implementation:**
- Change `DILEMMA_STAKES_THRESHOLD` from 0.6 to 0.3
- Add `STAKES_BASE = 0.1` to computeStakes
- In `worldSeed.ts`, set initial `sentiment` to `rng() * 1.0 - 0.5` (range -0.5 to 0.5) for seeded relationships
- Also fix the actor selection bug: line 137 always uses `allActors[0]` as the primary actor — should find the actor whose name matches the event message

**Expected rate:** With threshold 0.3 and base 0.1, any domain sphere reaching 0.2+ (iron=0.4, gold=0.3, others=0.0) plus base 0.1 = 0.5 for iron, 0.4 for gold. With sentiment bonus (0.2 when |sentiment| > 0.7), most iron/gold actions will trigger. Plus some non-iron/gold actions with extreme sentiment. Expected: ~20-30% of agent actions generate dilemmas.

---

## Fix 4: Mandate Progress Advances

**Root cause:** Mandate conditions check for graph structures that don't exist naturally:
- `node_count` checks (settlements, structures, alliances) — no player is building anything in headless mode
- `sphere_weight` checks — locations have sphere influence but the evaluation may not be finding them
- `actor_tier` checks — no agents are being elevated to higher tiers

**Decision:** Two changes:
1. **Seed initial graph structures** — during world seeding, create a few `controls` and `constructed_by` edges so graph-state mandates have something to measure
2. **Add agent-driven world changes** — when agents act in a sphere, increase that sphere's influence at their location slightly. This means sphere_weight mandates will gradually progress as agents act.

**Implementation:**
- In `worldSeed.ts`: for each location, add 1-2 `constructed_by` edges to random agents and 1 `controls` edge to the strongest faction
- In `phaseAgentActions`: when an agent acts in sphere X at location Y, increment `location.properties.sphereInfluence[X]` by a small amount (0.02)
- Verify `evaluateCondition` for sphere_weight actually reads from the location properties correctly

---

## Fix 5: Agent Population Evolves

**Root cause:** No lifecycle mechanics exist. Agents are created at world seed and persist unchanged.

**Decision:** Add a lightweight lifecycle phase to the orchestrator:
- **Death:** Each tick, agents with reputation < 0.1 have a small chance (2%) of dying (removed from graph). Agents over 200 ticks old also have a 1% death chance.
- **Birth:** When a location has ≥ 3 agents and no death occurred this tick, 1% chance of a new agent being born at that location, inheriting cultural traits from the location's dominant culture.
- **Migration:** Each tick, 2% chance per agent to move to an adjacent location. Agents prefer locations with fewer agents (load balancing) and higher sphere influence matching their dominant domain.

**Implementation:**
- New `phaseAgentLifecycle(state)` in orchestrator, runs after agent actions
- `agentDeath()`: scan agents, check conditions, remove node + edges, emit `agent_death` event
- `agentBirth()`: check location density, create new agent node with inherited traits, emit `agent_birth` event
- `agentMigration()`: pick random agents, find adjacent locations, move `contains` edge, emit `agent_migration` event
- Add narrative beat templates for death/birth/migration

---

## Verification

After implementing all 5 fixes, re-run the playtest:
```bash
npm run playtest -- --seeds 42,7,100 --ticks 100
```

**Success criteria:**
1. Doom clock reaches stage 2+ by tick 40 (with doomSpeed 3.6)
2. Agent action messages show varied prose (no identical messages in sequence)
3. At least 5 dilemma_resolved events across 100 ticks
4. Mandate progress > 0 by tick 50
5. Agent count changes (at least 1 birth, death, or migration) by tick 100
6. All existing tests still pass
