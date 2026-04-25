# Ubiquitous Language — Encounters

Content-adjacent shard. Terms covering the encounter pipeline: templates, resolution, aftermath, awareness, and causation.

---

### Encounter

**Aliases:** Encounter Event
**Also see:** `[[EncounterTemplate]]`, `[[Aftermath]]`, `[[Encounter Awareness]]`
**Status:** canonical

A narrative event resolved through the encounter pipeline. Encounters are instantiated from templates, progress through steps, and conclude with an Aftermath phase that produces consequences in the world graph. Encounters are the primary narrative output of the simulation tick loop.

---

### EncounterTemplate

**Aliases:** Encounter Definition, Template
**Also see:** `[[Encounter]]`, `[[UnifiedActionTemplate]]`
**Status:** canonical

A data-driven definition specifying an encounter's structure: premise, steps, reactions, outcome branches, scope, scale, and prerequisite checks. Templates are the authored unit of encounter content. A template becomes an Encounter when instantiated at a location for a specific agent. Stored as `action_template` nodes with encounter-specific properties.

---

### UnifiedActionTemplate

**Aliases:** UAT, Action Template, Unified Action
**Also see:** `[[EncounterTemplate]]`, `[[Reach]]`, `[[Sphere]]`
**Status:** canonical

The unified definition covering both divine interventions (Ascendant actions on agents) and mortal encounter actions. Stored as `action_template` nodes in the world graph. Replaces the deprecated Intervention Wheel and fixed action slot designs. The full pool is filtered per target context at runtime — there is no fixed action count.

---

### Aftermath

**Aliases:** Encounter Aftermath, Resolution Phase
**Also see:** `[[Encounter]]`, `[[Reaction]]`
**Status:** canonical

The resolution phase of an encounter, reached after all encounter steps complete. The Aftermath presents the player with Reactions to choose from and applies the selected consequences to the world graph. Aftermath picks can be made headlessly via `aftermath pick` in the CLI or `window.__DEBUG.pickAftermathReaction()`.

---

### Reaction

**Aliases:** Aftermath Reaction, Player Choice
**Also see:** `[[Aftermath]]`, `[[Encounter]]`
**Status:** canonical

A player or agent choice presented during the Aftermath phase. Each Reaction has an ID, label, and a set of world-graph mutations it applies when selected. Reactions are the primary mechanism through which players shape the simulation through encounter outcomes.

---

### Encounter Seed

**Aliases:** Pending Seed, Seed
**Also see:** `[[Encounter]]`, `[[Hidden Mark]]`, `[[Causation]]`
**Status:** canonical

A `PendingEncounterSeed` that catalyzes an encounter at a future tick. Seeds are created by engine phases, prior encounter outcomes, and divine actions. When a seed matures, it instantiates an encounter at the appropriate location. Seeds represent the causal prehistory of encounters.

---

### Hidden Mark

**Aliases:** Concealed Seed, Mark
**Also see:** `[[Encounter Seed]]`, `[[Encounter]]`
**Status:** canonical

A concealed encounter seed (`HiddenMark`) attached to an agent and invisible to other agents until triggered by a convergence condition. Hidden Marks are the engine's mechanism for slow-burn narrative setups — the player can see them via the Debug Panel but they are not visible in normal play.

---

### Encounter Awareness

**Aliases:** Awareness, Agent Awareness
**Also see:** `[[Encounter]]`, `[[Hex]]`, `[[Three-tier Position Model]]`
**Status:** canonical

The hex-granular visibility system determining which encounters an agent can see. If an agent can see a hex, they can see all encounters on it (all locations, sublocations). Within-hex visibility is automatic. Cross-hex visibility is computed as hex coordinate distance vs. per-reach awareness hops. The old location-hop awareness model (BFS via `adjacent` edges) was replaced — do not reintroduce it.

---

### Court Position

**Aliases:** Position, Encounter Role
**Also see:** `[[Encounter]]`, `[[EncounterTemplate]]`
**Status:** canonical

The role an agent plays in an encounter's social or political framing. Court Position affects encounter scoring, available reactions, and prose generation. Stored as a numeric property; can be specified when spawning encounters via the CLI `--courtPosition` flag.

---

### Causation

**Aliases:** Encounter Causation, Causal Chain
**Also see:** `[[Encounter Seed]]`, `[[Encounter]]`
**Status:** canonical

The `caused_by` edge linking one encounter event to the encounter seed or prior event that triggered it. Causation makes the causal chain of encounters inspectable — you can trace why an encounter happened back through prior seeds and events. Used by the trace system and the Debug Panel's encounter inspector.
