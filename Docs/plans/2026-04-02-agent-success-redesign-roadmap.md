# Agent Success Redesign Roadmap

> **Date:** 2026-04-02
> **Status:** Implementation roadmap
> **Scope:** Reaches, quintessence, unified actions, encounters, rewards, fail-forward, balance evaluation
> **Related:** `2026-04-02-encounter-redesign-guidelines.md`, `2026-04-02-sovereignty-vs-consumption-design.md`

## Summary

The game already has the right broad ingredients for a compelling "innkeeper to goddess" journey:

- 8 reaches with strong thematic identity
- a rich encounter catalog
- a large attachment/reward vocabulary
- quintessence as an abstract power and survival concept
- a newer unified action system that is closer to the right runtime shape

What it does not yet have is one coherent gameplay contract. Right now the game still mixes:

- legacy encounter math and unified action math
- binary abandon-on-failure flows and partial fail-forward flows
- debug logging and tuneable balance telemetry
- steep early seeded power and a desired long growth arc

This roadmap reorganizes the redesign into phases that preserve the current content investment while moving the runtime toward one stable model:

- 8 reaches remain the long-term proficiency axes
- quintessence becomes current/max spendable resilience and power ceiling
- unified actions become the only runtime action model
- most failures become `success_at_cost`, weakened completion, strain, or reroute
- balance evaluation becomes cheap, machine-readable, and good enough to run continuously

---

## Goals

### Player-facing goals

- Basic agents start weak enough that growth is legible.
- Agents still feel competent in genuinely low-tier content.
- Failure creates motion, burden, and drama more often than dead ends.
- Quintessence, items, allies, blessings, and conditions together form a spendable resilience economy.
- A full hero journey feels motivating and varied over `2-3` hours at the current tick cadence.

### System goals

- One shared forecast and resolution model.
- One shared action pipeline.
- One shared balance telemetry layer.
- Content labels that mean the same thing across packs.
- Growth curves with real room from starter to mythic play.

### Developer goals

- Balance checks are cheap enough to run often.
- Results are machine-readable, not just prose logs.
- Agents and future automation can inspect balance outcomes without bespoke scraping.
- New content has clear authoring constraints so it does not silently destabilize the run.

---

## Design Principles

1. Keep authored content; replace the contract underneath it.
2. Do not stretch debug traces into a balance system. Build dedicated telemetry.
3. Normalize runtime first, then retune content against the normalized model.
4. Prefer a single source of truth for probabilities, outcomes, and expected utility.
5. Make resilience interactive before making content harsher.
6. Build eval support before deep balance rewrites so tuning stays cheap.

---

## Phase Overview

| Phase | Name | Core outcome |
|---|---|---|
| 1 | Balance Eval Foundation | Build the telemetry, targets, CLI/debug surfaces, and cheap replay/eval workflow needed to tune safely |
| 2 | Shared Resolution and Quintessence Foundation | Introduce the new success model, crit model, quintessence current/max semantics, and spend/resist hooks |
| 3 | Unified Action Outcome Expansion | Teach unified actions to preserve rich outcomes like `critical_success`, `near_miss`, `success_at_cost`, and resource spends |
| 4 | Agent Decision and Forecast Rewrite | Make planning use the same math as live resolution and reason about cost, resilience, and reward utility |
| 5 | Encounter Migration and Early-Game Retune | Move legacy encounter content onto unified actions and retune starter packs to the new progression bands |
| 6 | Reward and Attachment Economy Expansion | Convert items, allies, blessings, curses, and conditions into a deeper spendable resilience layer |
| 7 | Mid/Late-Game Growth and Ascension Ladder | Retune hard/deadly/epic content, introduce ascension gating, and shape the endgame arc |
| 8 | Continuous Balance Workflow | Lock in recurring eval suites, guardrails for new content, and tuning dashboards/reports |

---

## Phase 1: Balance Eval Foundation

### Purpose

Create the infrastructure that tells us whether the redesign is working.

This phase comes first because the game already has:

- traces
- encounter timelines
- reward history
- a debug bridge
- a CLI
- a playtest runner

Those are enough to bootstrap a proper balance-eval layer, but not enough to safely tune a long-run, high-frequency agent simulation. We need dedicated metrics, stable outputs, and clear target bands before we start rewriting core math.

### Deliverables

- versioned balance target definitions
- dedicated runtime telemetry owned by `SimulationRuntime`
- machine-readable run summaries and cohort summaries
- hero-journey summaries for tracked agents
- CLI commands for running and inspecting evals
- debug bridge accessors for balance summaries
- seed profiles for cheap repeatable eval suites
- baseline reports for current behavior

### Exit criteria

- We can run cheap balance sweeps locally across many seeds.
- We can answer "are we inside target?" without reading raw logs.
- Agents and future automation can consume eval output directly.

---

## Phase 2: Shared Resolution and Quintessence Foundation

### Purpose

Replace the split between forecast math, encounter math, and unified action math with one shared resolver and one shared probability model.

### Main changes

- move to a single resolution service used by:
  - unified action runtime
  - encounter migration paths
  - candidate scoring / expected utility
  - any simulation-side previews
- replace flat critical failure tails with a skill-scaled approach such as `d100 + doubles`
- define a canonical outcome ladder:
  - `critical_success`
  - `success`
  - `success_at_cost`
  - `failure`
  - `critical_failure`
- split quintessence into:
  - `quintessence` as current reserve
  - `quintessenceMax` as durable capacity / power ceiling
- add canonical spend hooks:
  - `push`
  - `resist`
  - `overreach`

### Exit criteria

- Live resolution and forecast use the same math.
- Quintessence can support both survival pressure and long-term progression.
- Crit frequency scales with competence instead of staying flat.

---

## Phase 3: Unified Action Outcome Expansion

### Purpose

Turn unified actions into the true runtime action system instead of a thin wrapper around binary success/failure.

### Main changes

- preserve rich step outcomes end-to-end
- add `success_at_cost` and `weakened_success` as real action-level results
- represent per-step resource spending, condition uptake, and reward downgrades
- let step failure continue the action when the template says so
- keep authored consequence hooks rich enough for items, conditions, curses, allies, and quintessence pressure

### Exit criteria

- Unified actions can express the target outcome ladder cleanly.
- They no longer discard most of the nuance needed for fail-forward play.

---

## Phase 4: Agent Decision and Forecast Rewrite

### Purpose

Make agents choose content using the same model the content resolves with.

### Main changes

- replace the current scorer/runtime mismatch with one shared forecast API
- score options by expected utility, not motivation alone
- include:
  - completion chance
  - expected quintessence spend
  - risk of breaking point
  - likely condition burden
  - likely reward value by durability and category
  - time/travel cost
- teach agents to react to strain thresholds and resource posture

### Exit criteria

- Agents stop taking content they consistently misjudge.
- Planner confidence matches live results closely enough to tune intentionally.

---

## Phase 5: Encounter Migration and Early-Game Retune

### Purpose

Retune the first playable journey slice around the new system and get the early game feeling right.

### Main changes

- migrate priority legacy encounter packs into unified action templates with preserved outcomes
- normalize threat labels across content packs
- retune reach/difficulty assumptions for:
  - trivial
  - easy
  - moderate
  - hard
  - deadly
  - authored `epic` convention on top of late-game deadly content
- revise starter content so agents:
  - succeed reliably in bread-and-butter content
  - still feel fragile in the broader world
  - can visibly grow over the first hour

### Recommended first content slice

- `borderland-encounter-content.ts`
- adjacent early social/economic packs
- early ruins/scavenging content

### Exit criteria

- The first hour of a run produces a clear, motivating growth curve.
- Early-game content obeys the new fail-forward and reward-size rules.

---

## Phase 6: Reward and Attachment Economy Expansion

### Purpose

Make the attachment system part of the resilience and motivation loop, not just a reward catalog.

### Main changes

- define active roles for:
  - possessions
  - consumables
  - allies
  - blessings
  - curses
  - conditions
  - debts / marks / pacts
- add "spendable resilience" behaviors:
  - cancel or downgrade consequences
  - reroll or push success thresholds
  - absorb curses or strain
  - convert failure into weakened progress
- define decay, charges, rarity, and slot pressure so inventories do not bloat

### Exit criteria

- Failure can often be answered with resource management instead of pure surrender.
- Rewards feel strategically meaningful, not just decorative.

---

## Phase 7: Mid/Late-Game Growth and Ascension Ladder

### Purpose

Shape the upper half of the hero journey so growth stays legible past the early game.

### Main changes

- retune reach growth curves and quintessenceMax growth bands
- define hard/deadly/epic content expectations more sharply
- introduce ascension gates based on a mix of:
  - high reaches
  - high quintessenceMax
  - specific attachments, blessings, scars, or mythic conditions
- prevent accidental godhood from short lucky streaks

### Exit criteria

- The game supports a satisfying arc from grounded local competence to mythic power.
- Endgame progression has gates stronger than raw numeric growth alone.

---

## Phase 8: Continuous Balance Workflow

### Purpose

Make continuous tuning a normal part of development, not a one-off sprint.

### Main changes

- add repeatable eval profiles:
  - smoke
  - cadence
  - journey
  - content-pack-specific
- add report comparisons against previous baselines
- make new encounter packs run through structural and balance linting
- give authors checklists and target bands at authoring time
- leave room for future automation or agent-driven regression sweeps

### Exit criteria

- Balance drift becomes visible quickly.
- New content is harder to land in a broken state.

---

## Recommended Ordering

The critical path is:

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5

Phases 6-8 should begin once the runtime contract is stable enough that content retuning will not be invalidated every few days.

---

## Cross-Cutting Risks

### 1. Instrumentation drift

If telemetry is bolted onto ad hoc locations, different systems will report incompatible definitions of "success," "cost," or "completion."

Mitigation:

- central balance event schema
- central summary builder
- runtime-owned buffers instead of new module globals

### 2. Content migration loss

The current encounter-to-unified-action migration path already drops too much meaning. If we migrate content naively, we may technically "finish" migration while losing feel.

Mitigation:

- treat migration as semantic translation, not field copying
- start with a narrow pack and verify outcomes before bulk migration

### 3. Over-saturation of rewards

At the current tick cadence, large durable rewards will flood the run quickly.

Mitigation:

- keep most rewards consumable, decaying, or situational
- use explicit durability budgets in the encounter guidelines

### 4. Hidden planner/runtime mismatch

If the planner and live runtime diverge again after phase 2, balance will keep drifting even when metrics look good locally.

Mitigation:

- shared resolution package
- explicit tests asserting forecast/live parity

---

## What Success Looks Like

At the end of this roadmap:

- a basic agent begins small and vulnerable
- low-tier content still affirms their identity
- setbacks create scars, debt, strain, and side effects more often than dead stops
- rewards help them push further instead of only inflating numbers
- quintessence becomes the emotional center of risk, survival, and transformation
- the team can continuously evaluate the system cheaply across many seeds and content packs

That combination is what gives the game the best chance of feeling fair, motivating, and narratively alive over a full hero journey.
