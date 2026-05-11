---
name: state-of-game-design
description: >
  The single source of truth for game design in The Fantasy World Simulator.
  Load this FIRST before any domain-specific skill. Contains: core concepts,
  load-bearing systems, how systems connect, major architectural decisions,
  deprecated concepts, and links to the Obsidian world model.
  Triggers on ANY game design work — automatically load as prerequisite for
  engine-architecture, content-worldbuilding, frontend-ui, art-direction,
  and content authoring tasks.
last_validated_against: 2026-05-11
---

# State of the Game Design — Source of Truth

> **The Fantasy World Simulator** — A systemic god-game / rogue-lite narrative simulation.
> The player is an Ascendant (a former mortal turned demigod) shaping a procedurally generated fantasy world through indirect influence, divine interventions, and sustained control — all while a Doom Clock ticks toward the Unmaking.

This skill is the canonical reference for game design context. Load it before any domain-specific skill.

**Primary synthesis surface (Step 0 for rules-of-play work):** [`Docs/canon/rulebook.md`](../../../Docs/canon/rulebook.md) — the rulebook canon page synthesizes the rules of play from the player's seat across eight sections, each carrying `[IMPL] / [DESIGN] / [OPEN]` status flags. When your work touches **turn structure, action verbs, prerequisites, resources, encounters, clocks, or win/loss**, load the full rulebook alongside this skill — it is the single page that answers "how do these systems combine into a game?" without forcing you to reassemble it from five sources. The always-loaded companion is [`Docs/canon/rulebook-quick-reference.md`](../../../Docs/canon/rulebook-quick-reference.md) (the board-game card, ~80 lines, current rules only).

**Obsidian world model:** `TheFantasyWorldSimulator/Index.md` via Obsidian MCP — follow wikilinks for deep dives.
**Agent-domain cross-reference:** For actor/agent/faction/Ascendant/thread/archetype/value-pair questions, read `Docs/canon/agents.md` as Step 0 before domain implementation.

---

## Part 0: Game Design Direction (Experiential Compass)

**Read `Docs/plans/2026-04-16-game-design-direction.md` before any design or content work.** That document defines what Threadbearer is supposed to *feel like* to play. This skill (state-of-game-design) covers the mechanical foundations — reaches, spheres, verbs, graph architecture. The game design direction covers the experiential foundations — what the player does, how they feel, and what makes moments matter. Both are required context.

**Core principles from the game design direction (summary — read the full doc for depth):**

**The core fantasy:** You are a nascent god who discovers interesting mortals, follows their stories like a living novel, and shapes their arcs through subtle divine intervention.

**The three-beat core loop** (every play session):
1. **Portfolio scan** — "How are my people doing?" Read protagonist states at a glance via emotional/iconic signals + human-textured prose.
2. **Curated moment** — The game identifies emotionally significant encounters and pulls the player in for branching decision-making under uncertainty.
3. **Aftermath** — Resolution reshapes the protagonist's trajectory. Failure is not a loss state — it's a story turn.

**Six principles every feature and content piece must satisfy:**
1. **Emotional read at every level** — the player understands state through human conditions (alone, ashamed, triumphant), not numbers.
2. **Genuine dilemmas** — choices where there's no obviously right answer and the "best" option depends on understanding the protagonist.
3. **Cool failure** — every failure state produces narrative texture that makes the next chapter more interesting. Failure is plot, not punishment.
4. **Turn-based pacing** — each tick is a turn the player controls. Features must work in quick turns (scan and advance) AND deep turns (stop and engage).
5. **Prose carries narrative, UI carries status** — mechanics are communicated through story, never through exposed numbers.
6. **Content is design** — authored prose, encounter templates, and complication moments are not implementation details. They ARE the player experience. A structurally correct template with bland prose is a design failure.

**Anti-patterns to avoid:** Six new actions listed without dilemmas, engine-first design without player experience scenarios, binary succeed/fail outcomes, mechanical surfaces instead of emotional reads, isolated systems, missing UI vision.

**Design quality gate:** `Docs/plans/2026-04-16-design-quality-gate.md` — 9-section checklist required before any player-facing feature moves to Implementation Planning. Section 9 (Content Benchmark Moments) is mandatory for all content-heavy features.

**When authoring content:** Every template, encounter, attachment, omen beat, and prose line must pass a simple test: *Does this create a moment the player cares about? Does it make them want to know what happens next? If the answer is "it fills the right fields but doesn't pull the player in," it's not done.*

---

## Part 1: Core Concepts

### The Two Orthogonal Axes — Reaches × Spheres

Every action in the world is described by two independent dimensions.

**Reaches = What You Do** (activity categories). Eight domains covering every type of action:

| Reach | Theme | God-Scale |
|-------|-------|-----------|
| **Iron** | Force, destruction, protection, dominance | Cataclysm, annihilation, wrath |
| **Gold** | Wealth, craft, industry, trade | Shape abundance, blight, plenty |
| **Shadow** | Deception, persuasion, intrigue | Fate-weaving, hidden influence |
| **Veil** | Spells, rituals, sphere channeling | Sphere dominion, cosmic magic |
| **Heart** | Bonds, love, loyalty, inspiration, culture | Universal love, binding oath |
| **Eye** | Perception, understanding, memory, truth | Omniscience, deep memory, oracle |
| **Stone** | Building, shaping land, territory, travel | Terraform, reshape landscape |
| **Star** | Faith, devotion, divine connection, transcendence | Divine communion, cosmic pact |

Each Reach operates at four scales: **Individual** → **Group** → **Faction** → **God**.

Agent competence per-Reach is computed via the **Domain Capability** system: sigmoid curve over trait contributions → 10-tier narrative lexicon (e.g., Iron tier 5 = "Steeled", Veil tier 7 = "Arcane").

**Spheres = What Fuels It** (cosmic energies). Threads that power activities, making some easier, others harder.

Foundation Spheres (2 opposed pairs — cosmic structure): **Chaos ↔ Order**, **Light ↔ Darkness**
Creation Spheres (8 independent — domains of existence): **Force**, **Matter**, **Energy**, **Life**, **Mind**, **Spirit**, **Time**, **Entropy**

No inherent alignment — context determines expression. Entropy is freedom and dissolution, not evil. Life is growth and mutation, not goodness.

**They combine freely.** The same Reach fueled by different Spheres produces fundamentally different actions:

| Reach | + Life | + Entropy | + Mind |
|-------|--------|-----------|--------|
| **Iron** | Rally living troops | Raise undead soldiers | Dominate enemy's will to fight |
| **Veil** | Growth ritual | Decay curse | Psychic ward |
| **Shadow** | Covert healer network | Poisoner's guild | Psychic espionage |

Canonical Obsidian reference: `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md`

**Cultural naming:** Each culture names the same Reaches differently. The Aurelian Empire calls Iron "Imperium"; the Warrens goblins call it "Smash". These naming differences ARE worldbuilding — they encode what a culture values and despises without exposition.

### Actor Types

Six types as graph node categories (not a strict hierarchy):

| Type | Natural Scale | Role |
|------|--------------|------|
| **God / Primordial** | Cosmic → Regional | Creation myths, divine edicts |
| **Ascendant / Demigod** | Regional → Local | The player (and rivals). Subtle manipulation, indirect influence |
| **Faction / Organization** | Regional → Local | Doctrine, expansion, institutional ambition |
| **Culture / Nation** | Regional | Civilizational momentum, migration, identity |
| **Group / Party** | Local → Personal | Adventure arcs, fellowship, small-band purpose |
| **Individual** | Local → Personal | Personal destiny, moral dilemma |

Scale is a property, not a constraint. A peasant *could* attempt "Overthrow a Kingdom" — near-zero probability without the right graph edges. But with `inspires → rebel group → allies_with → rival faction → supported_by → Ascendant`... revolution.

**Ascendants use the same systems as agents.** Domain Capability tiers, sphere alignment, prerequisite checks — all apply equally. Ascendants are powerful former mortals, not a special-cased entity type. Power level is tunable, not structurally different.

### The 5 Action Verbs

| Verb | CRUD | Character |
|------|------|-----------|
| **Create** | `create` | Bring something into existence |
| **Find** | `read` | Perceive, search, reveal hidden information |
| **Change** | `update` (one-time) | One-time modification for a one-time cost. Fire and forget. |
| **Destroy** | `delete` | Remove, corrupt, scatter, erase |
| **Control** | `update` (sustained) | Sustained commitment requiring continuous resources, focus, or stability |

**Change vs Control:** Change is a one-shot. Control is sustained — you don't just *do* things, you *hold* things. Control is the god-game signature verb.

**"You can't Update what you haven't Read"** — Find actions gate Change/Control actions. Natural chains: Find → Change/Create → Control.

### Hex Chronicle Layers

The hex detail view has 4 narrative layers, each an action target context:

- **The Land** — terrain, biome, resources, divineInfluence, corruption
- **The Soul** — sphere influence, magical saturation, leylines
- **The People** — cultures, factions, agents, encounters, locations
- **The Ruins** — historical culture, archaeology, exploration hooks (context-gated: only where historical culture exists)

---

## Part 2: Load-Bearing Systems

### The World Graph

**Everything is a graph node/edge.** No separate relational tables. This is the foundational architectural decision.

- All entities (actors, locations, objects, traits) are graph nodes
- All relationships are typed edges with properties
- `world-model.json` is the canonical data file
- Current: 244 nodes, 371 typed edges, 18 categories, 19 content packages

**Exception:** Hexes are NOT graph nodes. They live in `GameState.tiles[]` indexed by coordinate. Hex actions produce `HexMutation[]` instead of `GraphOp[]`.

### Generalized Action Targeting

Any graph node the player focuses on in a detail view becomes an action target. The ActionDrawer populates with contextually-filtered action cards.

Pipeline: `TargetContext` → `getTargetActionSlots()` → `ActionDrawer`

Filtering cascade: node-type → subtype → traits → sphere → essence → range.

Templates declare `targetCategories` (actor, location, sublocation, hex, artifact) and `targetSubtypes`. The system is open-ended — no fixed cap on action variety.

**Template inventory:** 119+ unified templates across CRUD (36), encounters (68), divine (8), location (4), attachment (4), sublocation (3), hex (4). ~40+ additional hex concepts across 5 verbs × 4 layers in design phase.

### The Control Mechanic (Design Phase)

**Control slots:** Limited number, scaling with Domain Capability tier.

**Three sustain models (can combine):**
1. **Essence drain** — continuous per-tick cost
2. **State threshold** — world condition must hold (e.g., hex corruption ≥ 0.5)
3. **Ritual investment** — upfront essence + ticks, self-sustaining if threshold holds

**Contestation:** Active control effects spawn visible encounter nodes. Only agents/ascendants who meet prerequisite thresholds can see and contest them. Rivals can **usurp** (take over if they meet prerequisites) or **destroy** (shatter the effect).

**Canonical example:** Tap Entropic Source — invest 5 essence over 5 ticks to bind an entropy ruin. Generates entropic essence/tick while hex corruption ≥ 0.5. Spawns "Bound Entropy Well" encounter visible to Veil-capable + entropy-aligned rivals.

### Actor Prerequisites (Two-Axis)

Actions are gated by two orthogonal checks:
- **Reach prerequisite** — Domain Capability tier (competence: "can you do this type of activity?")
- **Sphere prerequisite** — sphere alignment match (alignment: "does your cosmic energy resonate?")

Both optional per template. Some actions only need reach competence. Some only need sphere alignment. The interesting ones need both. Prerequisites also gate *visibility* — you don't see what you can't attempt.

### Resolution System

Unified sigmoid pool → d100:
1. Gather domain capability scores for the relevant Reach
2. Feed through sigmoid curve → probability (0–1)
3. Roll d100 against that probability
4. No alternative dice systems, no special-case resolution

### Player Influence System

The Ascendant's core loop: influence mortal agents through tiers of connection.

- **Influence Tiers:** Unaware → Curious → Recognized → Devoted → Enthralled → Aspect
- **Influence Essence:** Sphere-typed divine currency. Regenerates from worshippers and places of power
- **Stealth:** Two-audience detection (mortals notice your meddling, rival gods detect your presence)
- Higher tiers = cheaper aligned nudges, but higher detection risk

### The Avatar

The player's physical anchor in the world. An individual actor node linked via `avatar_of` edge.

- Tick-based movement with terrain costs (unified with agent movement system)
- Location determines range for actions (local, regional, astral)
- Avatar HUD: center, move, actions

### Agent Action Selection (Maslow Pipeline)

Six-layer need hierarchy: survival → safety → belonging → esteem → self-actualization → transcendence.

- Higher layers only activate when lower needs are met
- No utility-function AI, no behaviour trees (rejected approaches)
- Agents score candidates by goal alignment, divine overlay, disposition, personality weights
- Select top-N probabilistically via seeded PRNG

### Disposition System

Game theory cooperation/defection layer: 5 strategies (Tit-for-Tat, Grudger, Pavlov, Always-Cooperate, Always-Defect). Modifies action scores, produces dilemma events, tracks reputation.

### Encounter System

68 multi-step encounter templates across 10 types (explore, acquire, create, hire, duel, steal, trade, assist, build, lead). Location-driven triggers, threat-rated, personality-driven selection. Each encounter is a sequence of resolution steps producing graph operations.

### Trait System (6 Categories)

Graph-native: traits are taxonomy nodes, assignments are `has_trait` edges with level/decay/evolution.

| Category | Duration | Example |
|----------|----------|---------|
| **Innate** | Permanent | Species traits, birth gifts |
| **Mastery** | Decaying (needs reinforcement) | Battle-Hardened, Trade Baron |
| **Reputation** | Evolving | Feared, Beloved, Infamous |
| **Scar** | Permanent | Battle wound, trauma |
| **Condition** | Temporary | Poisoned, Blessed, Cursed |
| **Destiny** | Until fulfilled | Prophecy, doom, calling |

### Attachment System

Unified model for possessions, conditions, spells, powers, agreements, retainers. 6 categories expressed via graph infrastructure. Tags enable semantic scripting; 4-tier rarity; modifier engine resolves all effects through edges.

### Mutable World State

**Hex state** (on HexTile, NOT graph nodes):
- `divineInfluence` (0.0–1.0) — player's presence, decays 0.02/tick
- `corruption` (0.0–1.0) — entropy/chaos, decays 0.01/tick (slower — corruption lingers)
- Terrain transformation at thresholds: corruption ≥ 0.7 degrades, divineInfluence ≥ 0.8 restores

**Location state** (on node properties):
- `prosperity` (0–100) — 5 tiers, tick-driven, trade/disruption/population effects
- `unrest` (0–100) — political instability, decays naturally, prosperity dampens
- `magicalSaturation` (0.0–1.0) — divine/magical energy, decays naturally

### Settlement & Economy

- **Prosperity** ticks via baseIncome + trade bonuses − disruptions. 5 tiers trigger promotions (hamlet↔town↔city).
- **Trade Routes:** `trades_with` edges track economic volume. Active routes boost prosperity; disruption breaks them.
- **Wealth:** Per-actor (0–100), 5 tiers (Magnate→Destitute).

### Culture System

Cultures generated at world seed via foundation bias + sphere selection + biome. 2–4 per world. Assigned to actors and locations (dual-layer: historical + current). Drives identity, naming, values, behavior. Cultural tension detects mismatch, conquest, dual-identity, and fanaticism.

### Narrative Engine

Hybrid layered prose: Tier 1 (routine → template stitching), Tier 2 (notable → enhanced templates), Tier 3 (chronicle → structured generation). Sphere-colored, personality-influenced, foundation-biased.

### Metaprogression Loop

1. **Doom Clock** — 7 archetypes, 5-stage escalation, ticks toward the Unmaking
2. **Victory Mandate** — Graph-state win conditions (dominance/culture/completion), 3-stage structure
3. **The Unmaking** — Cycle transition: Twilight Phase → echo selection → resonance capture → fundament update
4. **World-Soul** — Persistent: Fundament (coefficient ledger) + Resonance (memory fragments)
5. **Echo System** — Legacy/Monument/Relic echoes inject thematic content into next cycle

---

## Part 3: How Systems Connect

### The Core Loop (per tick)

```
Agent Action Selection (Maslow) → Encounter/Action Choice → Resolution (sigmoid→d100)
    → GraphOp Execution → State Updates (prosperity, unrest, traits, attachments)
    → Narrative Engine (prose for the event) → Trace Emission
```

### The Player Loop

```
Observe (Fog of War, Hex Chronicle, Detail Views)
    → Focus (enter detail view → TargetContext constructed)
    → Act (ActionDrawer shows filtered actions → player picks one)
    → Resolve (action enters tick pipeline as UnifiedAction)
    → Consequence (state changes, narrative feedback, detection risk)
```

### The Metaprogression Loop

```
World Generation (seeded by World-Soul)
    → Play (ticks, actions, influence, doom clock advancing)
    → Unmaking (doom expires or mandate completes → Twilight Phase)
    → Harvest (echo selection, resonance capture)
    → World-Soul Update (fundament shifts, new resonance)
    → Next Cycle (new world, shaped by accumulated echoes)
```

### System Dependency Map

| System | Feeds Into | Fed By |
|--------|-----------|--------|
| World Graph | Everything | World Generation, GraphOp Executor |
| Trait System | Domain Capability, Modifier Engine, Action Selection | Encounters, Attachments, Culture |
| Domain Capability | Action Prerequisites, Resolution | Trait System (sigmoid computation) |
| Action Selection (Maslow) | Encounter System, Action System | Traits, Disposition, Prosperity, Threats |
| Resolution System | GraphOp Executor | Domain Capability, PRNG |
| Encounter System | Trait/State Updates, Narrative | Action Selection, Location triggers |
| Narrative Engine | Player-facing prose | All state-changing systems |
| Player Influence | Avatar, Stealth, Essence | Worshippers, Places of Power |
| Doom Clock | Unmaking trigger | Tick count, Rival actions |
| World-Soul | Next cycle generation | Unmaking, Echo selection |

---

## Part 4: Non-Functional Priorities (in order)

When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel = changing a number.
2. **Inspectability** — Trace *why* something happened. Flat state, pure functions, causal event trails.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs.
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback.
5. **Narrative over mechanical perfection** — When mechanics and story diverge, lean toward story.
6. **Additive over destructive changes** — Add new fields/functions; don't rewrite.
7. **Performance budget, not premature optimization** — Profile before optimizing.

---

## Part 5: Architectural Decisions (Settled — Do Not Revisit)

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Neither subsumes the other. They combine freely.
- **Ascendants use the same prerequisite system as agents.** No special-casing.
- **Hexes are NOT graph nodes.** They live in `GameState.tiles[]`, mutated via `HexMutation`.
- **Content is generated-within-constraints.** Never freeform, never pure LLM. Player iterates within bounds.
- **Maslow pipeline for agent AI.** No utility functions, no behaviour trees.
- **Sigmoid → d100 for resolution.** One system, no special cases.

---

## Part 6: Deprecated Concepts (Do Not Reintroduce)

| Deprecated | Replaced By |
|-----------|-------------|
| Classical stats (STR/DEX/INT) | Domain Capability across Eight Reaches |
| Fixed rival pantheon | Generated rivals from World-Soul |
| Old 5-force cosmology | Foundation + Creation Sphere model |
| Pure template-based prose | Hybrid layered engine |
| Pure LLM-generated content | Generated-within-constraints with player iteration |
| Intervention wheel (AgentWheel) | ActionDrawer with context-filtered cards |
| Fixed action count / capped slots | Open-ended data-driven template pool |
| React Three Fiber (R3F) | Raw Three.js with canvas ref |
| V1 SVG hex map | HexMapV2 (Three.js InstancedMesh) |
| Spheres as fixed Reach pairings | Orthogonal axes that combine freely |
| 9 Reaches (including Flesh) | 8 Reaches + Quintessence meta-property |
| Utility-function AI | Maslow need hierarchy |
| Behaviour trees | Maslow need hierarchy |

---

## Part 7: Key References

| What | Where |
|------|-------|
| Obsidian vault index | `TheFantasyWorldSimulator/Index.md` via Obsidian MCP |
| Spheres and Reaches | `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md` via Obsidian MCP |
| Generalized Action Targeting | `Docs/plans/2026-03-17-generalized-action-targeting-design.md` |
| Hex state + hex actions | `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md` |
| Hex action brainstorm | `Docs/plans/2026-03-17-brainstorm-hex-actions-and-control-mechanic.md` |
| Domain Capability design | `Docs/plans/2026-03-04-disc13-domain-capability-and-resolution-design.md` |
| Original CRUD design | `Docs/plans/2026-03-03-actor-crud-action-system.md` |
| Visual style guide | `STYLE.md` |
| Design system | `Docs/design-system/INDEX.md` |
| Backlog & issue tracking | [Linear (Threadbare team)](https://linear.app/threadbare) — `.planning/BACKLOG.md` retired 2026-04-13 |
| Project status | `Docs/project-status.md` |
| Project history | `Docs/project-history.md` |

---

## After Loading This Skill

Load the domain-specific skill for your task:

| Domain | Skill | When |
|--------|-------|------|
| Engine code | `engine-architecture` | Tick loop, tracing, resolution, PRNG, graph ops |
| Frontend & UI | `frontend-ui` | Components, styling, layout, design system tokens |
| Content & worldbuilding | `content-worldbuilding` | Content packages, graph data, constraint layers |
| Art direction | `art-direction` | Hex tiles, prompt construction, Threadbare aesthetic |
| Creative prose & content | `cw-*` (platform) | Brainstorming, prose drafting, wiki docs, critique |
| Post-implementation docs | `gamedocumenter` | Linear/Obsidian/changelog updates |
| Image manipulation | `image-manipulation` | Geometric clipping, alpha masks, hex pipeline |
| QA sweeps | `qa-orchestrator` | Systematic UI/UX/frontend QA |
