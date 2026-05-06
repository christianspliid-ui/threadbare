---
domain: agents
last_reviewed: 2026-05-06
reviewer: cowork
ul_shards: [Agents, Cosmology]
status: live
---

# Canon — Agents

> Every entity in the simulation is an actor node. Every actor has a type, a position in space, a domain capability profile, and relationships encoded as graph edges. The Ascendant is one of them — architecturally identical, cosmologically distinct.

## How to use this page

Load this page once at session start when working on agents, actor behavior, factions, the Ascendant, threads, archetypes, or axiological profiles. Every link below is a pointer; the linked target is authoritative. When a pointer disagrees with the target, the target wins and the pointer needs an update — open a `drift-scan`-labeled Linear issue.

**Two skills divide the actor/encounter work.** Pick one before you write.

## Authoring entrypoint — pick the skill that matches your task

| If you are doing… | Load skill |
|---|---|
| Debugging encounter pipelines, actor capability, awareness, scoring, resolution, or iterating on actor behavior | [`encounter-actor-systems`](../../.claude/skills/encounter-actor-systems/SKILL.md) |
| Broad game design context, reach/sphere system, graph architecture, or designing a new system | [`state-of-game-design`](../../.claude/skills/state-of-game-design/SKILL.md) |

Both skills must load this Canon page (Step 0) before beginning work in the agents domain.

## Actor type taxonomy

All simulated entities are actor nodes (`type: 'actor'`) distinguished by `actorType`:

| actorType | What it is |
|-----------|-----------|
| `individual` | A mortal agent — position, traits, domain capability, ambitions, encounters |
| `ascendant` | The player character — same prerequisite system as individuals; power tunable via constants |
| `faction` | A structured social entity — agents join via `member_of` edges; goals are simulation-driven |
| `culture` | A cultural grouping — drives trait and value defaults for agents born in the region |
| `group` | An informal collective — lighter than a faction; no formal membership mechanics |
| `god` | A rival divine entity — always procedurally generated from World-Soul; never hand-authored |

**Source:** `src/types/graph.ts` → actor node schema; [Docs/ubiquitous-language/Agents.md](../ubiquitous-language/Agents.md) → ActorType.

Do not add new actor types without verifying the type doesn't already exist under a different name. New types require full design before code — define category, properties, edge types, tick participation, and traces.

## The Ascendant

Actor node with `actorType: 'ascendant'`. A former mortal who has transcended to divine status. Architecturally:
- Uses the same **Domain Capability prerequisite system** as mortal `individual` agents.
- Power level is tunable via constants — there is no special-cased entity logic in the tick loop.
- Stored and traversed like any other actor node; divine status is a content and UI distinction, not a graph exception.

**Active plans:** [2026-03-04-phase2a-influence-essence-and-ascendant.md](../plans/2026-03-04-phase2a-influence-essence-and-ascendant.md), [2026-04-06-ascendant-remembrance-flow-design.md](../plans/2026-04-06-ascendant-remembrance-flow-design.md).

## The First

A regular `individual` agent formally bonded to the Ascendant via a `thread` edge. Key properties:
- The First is the Ascendant's **narrative anchor** — the primary interface to mortal affairs.
- Structurally a normal `individual`; the bond is carried in the edge, not the node's actorType.
- Pre-bonded in `?view=game&seeded` — use this URL for all standard testing involving threads.

## Threads and Thread-Tug

A **thread** (`thread` edge type) connects the Ascendant to a mortal agent, carrying divine influence into the world:

- Thread stress accumulates when the bonded agent faces danger, conflict, or narrative tension.
- Elevated stress produces a **Thread Tug** — an attention-system prompt surfaced to the player for intervention.
- The Ascendant can maintain multiple threads; The First thread is the primary anchor.

**Source:** [Docs/ubiquitous-language/Agents.md](../ubiquitous-language/Agents.md) → Thread, The First; `src/engine/` → thread edge reads in attention system.

## Factions

Factions are `actorType: 'faction'` actor nodes. Agents join via `member_of` graph edges. Key properties:
- Goals and behavior are **simulation-driven** — factions are not hand-scripted.
- Factions can be created or dissolved dynamically during simulation.
- Faction rank progression fires on tier promotion events.
- Agent→faction relationships are graph edges, not property fields (load-bearing: see CLAUDE.md "Relationships between entities").

## Archetypes — cite cosmology, don't duplicate

Each of the 8 Reaches maps to an archetype-pair axis (the moral dimension in the Cosmological Pattern). See [Docs/canon/cosmology.md](cosmology.md) §Cosmological Pattern for the authoritative reach × archetype-axis table. Do not reproduce the table here — that Canon page is the single source of truth for the archetype pairs.

Archetype axes drive: encounter tilt (per encounter design plan), epithet generation, and axiological scoring.

## Axiological profile and value pairs

An actor's **AxiologicalProfile** is a `Record<ValuePair, number>` ranging from −1.0 (flaw pole) to +1.0 (virtue pole). Nine slots total — 8 Reach-bound pairs plus one meta pair:

| ValuePair | Reach | Virtue pole (+1.0) → Flaw pole (−1.0) |
|-----------|-------|--------------------------------------|
| `mercy_ruthlessness` | Iron | Mercy → Ruthlessness |
| `asceticism_extravagance` | Gold | Asceticism → Extravagance |
| `honesty_cunning` | Shadow | Honesty → Cunning |
| `tradition_novelty` | Veil | Tradition → Novelty |
| `loyalty_ambition` | Heart | Loyalty → Ambition |
| `revelation_discretion` | Eye | Revelation → Discretion |
| `preservation_transformation` | Stone | Preservation → Transformation |
| `sacrifice_survival` | Star | Sacrifice → Survival |
| `courage_prudence` | (meta) | Courage → Prudence |

**Source:** `src/types/agent.ts` → AxiologicalProfile; [Docs/ubiquitous-language/Agents.md](../ubiquitous-language/Agents.md) → ValuePair.

Drives: epithet generation, social-encounter responses, ambition selection, cross-agent compatibility scoring.

The deprecated pairs `frankness_propriety`, `humility_pride`, `stoicism_passion` were removed in TB-075 — do not reintroduce.

## Rivals

Rivals are `actorType: 'god'` actor nodes — competing divine entities generated from the World-Soul at world creation. They are always procedurally generated; the fixed rival pantheon design was rejected (see Rejected Approaches below).

**Active plan:** [2026-03-04-phase3a-rival-gods-and-doom-clock.md](../plans/2026-03-04-phase3a-rival-gods-and-doom-clock.md).

## Active design plans

- [2026-03-04-phase2a-influence-essence-and-ascendant.md](../plans/2026-03-04-phase2a-influence-essence-and-ascendant.md) — Ascendant mechanics, thread system, essence flow.
- [2026-03-04-phase3a-rival-gods-and-doom-clock.md](../plans/2026-03-04-phase3a-rival-gods-and-doom-clock.md) — rival generation, Doom Clock.
- [2026-05-05-canonical-documentation-strategy.md](../plans/2026-05-05-canonical-documentation-strategy.md) — Phase 2b plan for this Canon page (THR-314).

## Rejected approaches

- ❌ **Fixed rival pantheon** — replaced by generated rivals from the World-Soul. Never hand-author rival actor nodes.
- ❌ **Classical stats (STR/DEX/INT)** — replaced by Domain Capability across Eight Reaches. Do not reintroduce stat blocks.
- ❌ **Ascendant as a special-cased entity type** — same graph schema and tick logic as mortals; power tuning happens via constants. No special-case branching.
- ❌ **Deprecated value pairs** (`frankness_propriety`, `humility_pride`, `stoicism_passion`) — removed TB-075. Do not reintroduce.
- ❌ **Faction relationships as property fields** — model agent↔faction bonds as `member_of` graph edges, not string ID fields in a property bag.

## Open questions

- **Avatar spawn mechanics** — `avatar_of` edge is defined in the graph schema; player-accessible avatar creation is not yet implemented. When it lands, update this page with spawn conditions and tick behavior.
- **Portfolio Pin engine integration** — `isPortfolioPinned` property is currently UI-only; the tick loop does not differentiate pinned agents. When the attention tier model ships (THR series), add the engine behavior here.
- **Thread count cap** — no hard engine limit on thread count; narrative guidelines suggest 3–5 active threads. If a cap is implemented, add it here.

## Last-reviewed

2026-05-06 by Cowork. Review trigger: monthly, or when any listed plan's status changes, or when `src/types/agent.ts` or `src/types/graph.ts` actor schema changes significantly.
