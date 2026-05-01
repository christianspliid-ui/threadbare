# Ubiquitous Language — Agents

Content-adjacent shard. Terms covering entities in the simulation: agents, actors, Ascendant, factions, and their relationships.

---

### Agent

**Aliases:** Individual, Mortal Agent
**Also see:** `[[Actor]]`, `[[ActorType]]`, `[[NPC]]`
**Status:** canonical

An individual entity (actor node with `actorType: 'individual'`) in the world simulation. Agents have spatial position, traits, domain capability, relationships, and ambitions. They move, encounter each other, form factions, and develop through tick-driven behavior. "Agent" means a living individual — not all actors are agents.

---

### Actor

**Aliases:** Actor Node
**Also see:** `[[Agent]]`, `[[ActorType]]`, `[[Node]]`
**Status:** canonical

The graph node type (`type: 'actor'`) representing any simulated entity: individual, faction, culture, group, god, or ascendant. The `actorType` property on the node distinguishes the subtype. "Actor" is the graph-level term; "agent" is the semantic term for individuals.

---

### ActorType

**Aliases:** Actor Subtype
**Also see:** `[[Actor]]`, `[[Agent]]`, `[[Faction]]`
**Status:** canonical

The taxonomy of actor subtypes stored in `actor.properties.actorType`: `god`, `ascendant`, `faction`, `culture`, `group`, `individual`. Drives behavior routing, action availability, and encounter scoring. Do not add new actor types without verifying they don't already exist under a different name.

---

### Ascendant

**Aliases:** The Ascendant, Player Character, God-Self
**Also see:** `[[The First]]`, `[[Thread]]`, `[[Actor]]`
**Status:** canonical

The player-character: a powerful former mortal who has transcended to divine status. Stored as an actor node with `actorType: 'ascendant'`. Uses the same Domain Capability prerequisite system as mortal agents — no special-cased entity logic. Power level is tunable via constants, not architecturally different.

---

### The First

**Aliases:** Bonded First, First Agent
**Also see:** `[[Ascendant]]`, `[[Thread]]`
**Status:** canonical

The bonded mortal agent who anchors the Ascendant's divine presence in the world. The First is a regular individual agent who has been formally bonded via a `thread` edge. They are the Ascendant's narrative anchor and the primary interface to mortal affairs. Seeded automatically in `?view=game&seeded` — use that URL for all standard testing.

---

### Thread

**Aliases:** Divine Thread
**Also see:** `[[Ascendant]]`, `[[The First]]`, `[[EdgeType]]`
**Status:** canonical

A `thread` edge type connecting an Ascendant to a mortal agent. Threads are the mechanism by which divine influence flows into the world. Thread stress produces Thread Tugs in the attention system. The Ascendant can maintain multiple threads but the First thread is the anchor.

---

### Faction

**Aliases:** Organization, Group (formal)
**Also see:** `[[Actor]]`, `[[ActorType]]`, `[[Member Of]]`
**Status:** canonical

A structured social entity modeled as an actor node with `actorType: 'faction'`. Agents join factions via `member_of` edges. Factions have agency, goals, and can be created or dissolved dynamically during simulation. Faction behavior is simulation-driven, not hand-scripted.

---

### Rival

**Aliases:** Rival God, Rival Ascendant
**Also see:** `[[Ascendant]]`, `[[Actor]]`
**Status:** canonical

A competing divine entity generated from the World-Soul at world creation. Rivals are not hand-authored — they emerge from the seeded cosmological configuration. The fixed rival pantheon design was rejected; rivals are always procedurally generated. Stored as actor nodes with `actorType: 'god'`.

---

### Portfolio Pin

**Aliases:** Pinned Agent, Portfolio Agent
**Also see:** `[[Agent]]`, `[[Ascendant]]`
**Status:** canonical

A player-marked agent (`isPortfolioPinned: true` on the actor node properties) designated for elevated attention in the UI. Pinned agents receive higher narrative prominence in the digest and thread panel. The Ascendant chooses which agents to pin; unpinned agents still receive full simulation treatment.

---

### Avatar

**Aliases:** Divine Avatar
**Also see:** `[[Ascendant]]`, `[[EdgeType]]`
**Status:** canonical

An agent created as a physical manifestation of the Ascendant's divine presence. Connected to the Ascendant via an `avatar_of` edge. Avatars are rare and structurally distinct from the Ascendant's normal thread-based influence.

---

### AxiologicalProfile

**Aliases:** Axiological Profile, Value Profile, Agent Values
**Also see:** `[[ValuePair]]`, `[[Reach]]`, `[[Agent]]`
**Status:** canonical

An actor's signed score across every `ValuePair` — `Record<ValuePair, number>` ranging from −1.0 (flaw pole) to +1.0 (virtue pole). Drives epithet generation, social-encounter responses, ambition selection, and cross-agent compatibility scoring. The eight Reach-bound pairs plus the meta pair `courage_prudence` make nine slots per profile. Definition: `src/types/agent.ts`.

---

### ValuePair

**Aliases:** Axiological Pair, Virtue/Flaw Axis
**Also see:** `[[AxiologicalProfile]]`, `[[Reach]]`
**Status:** canonical

A single virtue-flaw axis composing an `AxiologicalProfile`. The eight Reach-bound pairs are: `mercy_ruthlessness` (Iron), `asceticism_extravagance` (Gold), `honesty_cunning` (Shadow), `tradition_novelty` (Veil), `loyalty_ambition` (Heart), `revelation_discretion` (Eye), `preservation_transformation` (Stone), `sacrifice_survival` (Star). Plus one meta pair: `courage_prudence`. Convention: +1.0 = first pole (virtue), −1.0 = second pole (flaw). The pre-TB-075 pairs `frankness_propriety`, `humility_pride`, and `stoicism_passion` are deprecated; do not reintroduce them.
