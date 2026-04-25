# Ubiquitous Language — Index

**The canonical glossary for The Fantasy World Simulator.** When docs, code comments, Obsidian, or agent output disagree on terminology, UL wins.

Load this file at session start (referenced from CLAUDE.md). Load specific shard files on demand when the task references their terms. The full shard files contain entry definitions; this index is the lightweight always-load footprint (~3k tokens).

---

## Shards

| Shard | Content | Content-adjacent |
|---|---|---|
| [Cosmology.md](./Cosmology.md) | Reaches, Spheres, Foundation/Creation, domain capability, prerequisites | ✅ |
| [Agents.md](./Agents.md) | Agent, Actor, Ascendant, The First, Faction, Rival, Thread, Avatar | ✅ |
| [Encounters.md](./Encounters.md) | Encounter, Template, UAT, Aftermath, Reaction, Seed, Hidden Mark, Awareness | ✅ |
| [Prose.md](./Prose.md) | IPK, Enrichment Placeholder, Resolver, Strata, Narrative Lexicon, Chronicle | ✅ |
| [Graph.md](./Graph.md) | Node, Edge, WorldGraph, NodeType, EdgeType, versioning, position model | ❌ |
| [Coordination.md](./Coordination.md) | Cowork/CC/Codex, Linear states, claim discipline, WIP, Coordination Block | ❌ |
| [Process.md](./Process.md) | NFPs, Three-Pillar Rule, Definition of Done, Design Governance, UL, Drift Scan | ❌ |

---

## Term Index

### Cosmology

- **[Reach](./Cosmology.md#reach)** — one of eight action domains (iron, gold, shadow, veil, heart, eye, stone, star); classifies *what* an actor does
- **[Sphere](./Cosmology.md#sphere)** — a cosmic energy that fuels action; orthogonal to Reaches, not a subcategory of them
- **[Foundation](./Cosmology.md#foundation)** — root Sphere anchoring stability and permanence
- **[Creation](./Cosmology.md#creation)** — root Sphere driving change and generativity
- **[Sphere Alignment](./Cosmology.md#sphere-alignment)** — an actor or location's affinity for a Sphere; stored as `aligned_with` edge
- **[Domain Capability](./Cosmology.md#domain-capability)** — tiered proficiency across a Reach; gates action access with a tier + alignment prerequisite check
- **[Cosmology Profile](./Cosmology.md#cosmology-profile)** — the seeded sphere configuration for a world instance; stored in `GameState.cosmology`
- **[Quintessence](./Cosmology.md#quintessence)** — the system that absorbed the deprecated Flesh Reach in TB-075; not a ninth Reach
- **[Prerequisite](./Cosmology.md#prerequisite)** — domain tier + sphere alignment check gating action availability; uniform for Ascendants and mortals

### Agents

- **[Agent](./Agents.md#agent)** — an individual actor node (`actorType: 'individual'`); the basic simulated person
- **[Actor](./Agents.md#actor)** — graph node type `'actor'`; covers individual, faction, culture, group, god, ascendant
- **[ActorType](./Agents.md#actortype)** — actor subtype taxonomy: `god`, `ascendant`, `faction`, `culture`, `group`, `individual`
- **[Ascendant](./Agents.md#ascendant)** — the player-character; a former mortal transcended to divine status; uses same prerequisite system as mortals
- **[The First](./Agents.md#the-first)** — the bonded mortal agent anchoring the Ascendant's divine presence; seeded in `?view=game&seeded`
- **[Thread](./Agents.md#thread)** — a `thread` edge from Ascendant to mortal; the mechanism for divine influence
- **[Faction](./Agents.md#faction)** — structured social entity; `actorType: 'faction'`; agents join via `member_of` edges
- **[Rival](./Agents.md#rival)** — competing divine entity generated from the World-Soul; always procedural, never hand-authored
- **[Portfolio Pin](./Agents.md#portfolio-pin)** — player-marked agent (`isPortfolioPinned: true`) with elevated narrative prominence
- **[Avatar](./Agents.md#avatar)** — a physical Ascendant manifestation connected via `avatar_of` edge

### Encounters

- **[Encounter](./Encounters.md#encounter)** — a narrative event resolved through the encounter pipeline
- **[EncounterTemplate](./Encounters.md#encountertemplate)** — data-driven definition of an encounter's structure, steps, and outcomes
- **[UnifiedActionTemplate (UAT)](./Encounters.md#unifiedactiontemplate)** — unified definition covering divine interventions and mortal encounter actions; replaces fixed action slots
- **[Aftermath](./Encounters.md#aftermath)** — the resolution phase; presents Reactions, applies world-graph consequences
- **[Reaction](./Encounters.md#reaction)** — a player/agent choice in the Aftermath phase; applies world-graph mutations
- **[Encounter Seed](./Encounters.md#encounter-seed)** — a `PendingEncounterSeed` that matures into an encounter at a future tick
- **[Hidden Mark](./Encounters.md#hidden-mark)** — a concealed seed attached to an agent; invisible until triggered
- **[Encounter Awareness](./Encounters.md#encounter-awareness)** — hex-granular visibility; agent sees all encounters on hexes within awareness range
- **[Court Position](./Encounters.md#court-position)** — the role an agent plays in an encounter's framing; affects scoring and prose
- **[Causation](./Encounters.md#causation)** — the `caused_by` edge linking encounter events to their seeds; makes causal chains inspectable

### Prose

- **[IPK (Instant Prose Kernel)](./Prose.md#ipk-instant-prose-kernel)** — the minimal core prose fragment before enrichment resolution
- **[Enrichment Placeholder](./Prose.md#enrichment-placeholder)** — template variable (`{name}`, `{artifact}`, `{ally}`) resolved at display time by walking the graph
- **[Resolver](./Prose.md#resolver)** — prose pipeline component that fills Enrichment Placeholders; implemented via `enrichProse()`
- **[Strata](./Prose.md#strata)** — layered prose tiers that compose a full narrative beat from multiple engine signals
- **[Narrative Lexicon](./Prose.md#narrative-lexicon)** — 10-tier per-Reach vocabulary (`NARRATIVE_LEXICON`); translates capability scores into evocative prose labels
- **[Chronicle Entry](./Prose.md#chronicle-entry)** — persistent record of a significant event in an agent or faction's history
- **[Narrative Event](./Prose.md#narrative-event)** — `TickEvent` carrying a prose message; flows to the UI event feed
- **[Thread Tug](./Prose.md#thread-tug)** — attention signal (`ThreadTug`) directing player focus to stressed divine threads

### Graph

- **[Node](./Graph.md#node)** — `GraphNode`; the basic entity in the world graph; everything is a node
- **[Edge](./Graph.md#edge)** — `GraphEdge`; typed directed relationship between nodes; everything meaningful is an edge
- **[WorldGraph](./Graph.md#worldgraph)** — central data structure; mutated in place; object reference never changes; use version counters for stale-detection
- **[NodeType](./Graph.md#nodetype)** — node categories: `actor`, `location`, `trait`, `artifact`, `action_template`, `event`, `cosmology`, `region`, `ambition`
- **[EdgeType](./Graph.md#edgetype)** — edge categories; see `src/types/graph.ts` for full list; check before adding a new type
- **[Property-vs-Edge Rule](./Graph.md#property-vs-edge-rule)** — relationships are edges, not property fields; traversal is the default
- **[Three-tier Position Model](./Graph.md#three-tier-position-model)** — spatial hierarchy: hex → location → sublocation; agent occupies exactly one tier via a single `located_at` edge
- **[located_at Edge](./Graph.md#located_at-edge)** — the single edge connecting an agent to their current position; authoritative source of agent location
- **[worldVersion / touchWorld()](./Graph.md#worldversion--touchworld)** — version counter bumped on graph mutations; UI selectors depend on this, not object reference
- **[structuralCacheVersion / touchStructure()](./Graph.md#structuralcacheversion--touchstructure)** — version counter for distance matrix and encounter cache; call after structural mutations
- **[SimulationRuntime](./Graph.md#simulationruntime)** — per-session cache owner; scoped to playthrough; module-level singletons were rejected

### Coordination

- **[Cowork](./Coordination.md#cowork)** — design/planning agent; produces plans and Linear transitions; never writes code
- **[Claude Code (CC)](./Coordination.md#claude-code-cc)** — primary executor; claims Ready for Dev; WIP limit 1
- **[Codex](./Coordination.md#codex)** — secondary executor; claims Ready for Codex; WIP limit 1
- **[Linear](./Coordination.md#linear)** — single source of truth for all issues, states, and dependencies
- **[Claim-before-read](./Coordination.md#claim-before-read)** — `save_issue(In Dev, me)` before reading any plan doc; verified with `get_issue` immediately after
- **[WIP Limit](./Coordination.md#wip-limit)** — 1 In Dev issue per executor at a time, across all sessions and worktrees
- **[Handoff Comment](./Coordination.md#handoff-comment)** — Cowork's final comment moving an issue to Ready-for-Dev/Codex; supersedes original description when it diverges
- **[Ready for Dev](./Coordination.md#ready-for-dev)** — Linear state: CC pickup queue; filter `assignee: null`
- **[Ready for Codex](./Coordination.md#ready-for-codex)** — Linear state: Codex pickup queue; filter `assignee: null`
- **[In Dev](./Coordination.md#in-dev)** — Linear state: active implementation; never close manually; use `Fixes THR-XX` auto-close
- **[Coordination Block](./Coordination.md#coordination-block)** — mandatory handoff fields: Suggested model, Parallel-safe with, Mutex with
- **[Parallel-safe](./Coordination.md#parallel-safe)** — issues that can be worked concurrently without file conflicts
- **[Mutex](./Coordination.md#mutex)** — issues that cannot be worked concurrently due to shared file surfaces
- **[Fixes THR-XX](./Coordination.md#fixes-thr-xx)** — commit body keyword that triggers Linear auto-close on merge to main; the only valid Done transition

### Process

- **[Non-Functional Priority (NFP)](./Process.md#non-functional-priority-nfp)** — seven ordered priorities: Tunability, Inspectability, Determinism, Fail-soft, Narrative, Additive, Performance
- **[Three-Pillar Rule](./Process.md#three-pillar-rule)** — every feature addresses Engine, Content, and UI; mark each N/A with rationale if not applicable
- **[Definition of Done](./Process.md#definition-of-done)** — mandatory closeout: commit, push, merge, deploy, update docs, log deferrals + impediments
- **[Design Governance](./Process.md#design-governance)** — 8-step checklist: grill-me → draft → brainstorm → audit → revise → NFP table → three-pillar check → Vision audit → present
- **[Ubiquitous Language (UL)](./Process.md#ubiquitous-language-ul)** — this sharded glossary; authority on terminology when sources disagree
- **[Grill-me](./Process.md#grill-me)** — adversarial pre-design questioning skill; Design Governance step 0 for non-trivial work
- **[Vision Audit](./Process.md#vision-audit)** — Design Governance step 7; verify design doesn't silently contradict a Vision premise
- **[Wiring Checklist](./Process.md#wiring-checklist)** — `Docs/plans/wiring-checklist.md`; verification that new modules are connected across all surfaces
- **[Drift Scan](./Process.md#drift-scan)** — weekly GitHub Action producing `drift-scan`-labeled Linear issues from four codebase health signals
- **[Retrospective](./Process.md#retrospective)** — weekly synthesis of impediment log + drift scan issues; run via `retrospective` skill
- **[UL-proposal](./Process.md#ul-proposal)** — Linear issue label for proposed new terms or retirements; always human-approved, never auto-merged

---

*v1 — 73 canonical terms. Coverage expands via the propose-new-term flow. UL wins on terminology disagreements.*
