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
**Also see:** `[[Encounter]]`, `[[UnifiedActionTemplate]]`, `[[mentorship.graduation]]`, `[[mentorship.the-falling-out]]` (mentorship terminal-arc templates)
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

---

### Chapter

**Aliases:** Encounter Chapter
**Also see:** `[[Encounter]]`, `[[Aftermath]]`, `[[Chapter Record]]`, `[[Chapter Ledger]]`
**Status:** canonical

The reading unit of a resolved (or in-progress) encounter: its opening, each step as the player read it, the player's own interventions, complications, and aftermath. "The encounter is the chapter" — a Chapter is the same event as an Encounter, viewed as a persistent, readable narrative record rather than an in-flight simulation object. Active chapters are read live from `gameState.unifiedActions`; resolved chapters are snapshotted into `gameState.chapterArchive` as Chapter Records (THR-603).

---

### Chapter Record

**Aliases:** ChapterRecord
**Also see:** `[[Chapter]]`, `[[Chapter Ledger]]`, `[[Encounter]]`, `[[Aftermath]]`, `[[UnifiedActionTemplate]]`
**Status:** canonical

The compact, self-contained snapshot of a resolved encounter (`ChapterRecord`, `src/types/chapterRecord.ts`) appended to `gameState.chapterArchive` at orchestrator cleanup, before resolved `UnifiedAction`s are pruned after `RESOLVED_ACTION_RETENTION_TICKS`. It captures the opening, steps (each with the prose the player read, the outcome band, complications, and the player's own interventions), aftermath, and participants. Prose is snapshotted post-`enrichProse()`, so a resolved chapter reads identically forever — even after the actor dies or the world moves on. Lives in its own file rather than `unifiedAction.ts` to keep its blast radius small.

---

### Chapter Ledger

**Aliases:** the Ledger
**Also see:** `[[Chapter]]`, `[[Chapter Record]]`, `[[Encounter]]`
**Status:** canonical

The always-readable list (`ChapterLedger` UI, IA surface `game.chapter-ledger`) that merges active encounters (live `unifiedActions`) and resolved chapters (`chapterArchive`) into one newest-first, filterable view. It is the load-management answer to player-authored encounter density: the player can revisit any chapter's full narrative for the whole run instead of losing it to the resolved-action prune (THR-603).

---

### Scene

**Aliases:** Encounter Scene, Scene Context
**Also see:** `[[Cast]]`, `[[Target]]`, `[[Support Bundle]]`, `[[Encounter]]`, `[[Encounter Seed]]`
**Status:** canonical

The world context of one action or encounter: its Target, its Cast, and its place. The Scene is what makes an encounter's prose refer to real graph entities rather than invented ones — target enrichment placeholders (THR-694), `{cast:*}` tokens (THR-696), aftermath scene sentinels (THR-695), and seed `inheritContext` (THR-697) are all mechanisms for carrying Scene through the pipeline. A continuation seed that inherits its source's target and cast preserves Scene across encounters, so the same people and places return.

---

### Cast

**Aliases:** Encounter Cast, Cast Bindings
**Also see:** `[[Scene]]`, `[[Support Bundle]]`, `[[Encounter]]`
**Status:** canonical

An encounter's support-bundle bindings viewed as characters: the keyed `supportBindings` on a `UnifiedAction` (`EncounterSupportBinding` — key, bound node id, actor/location kind, delivery, persistence, reuse flag). Prose references cast members with `{cast:<key>}` tokens; the declared-key invariant guarantees a declared key always resolves — bound keys render the live graph node's name, unbound keys fall back to the spec's `spawnName`. Aftermath effects may address cast members via `$cast:<key>` / `role:<key>` sentinels.

---

### Target

**Aliases:** Action Target, Encounter Target
**Also see:** `[[Scene]]`, `[[UnifiedActionTemplate]]`, `[[Aftermath]]`
**Status:** canonical

The node an action is performed on or with (`action.targetId`) — distinct from the actor performing it. Targets are bound at action creation, enrichable in prose via target placeholders, and addressable in aftermath effects via the `$target` sentinel (kind-checked at fire time, per the reach-signature binding pattern). Seeds created with `inheritContext` copy the source action's target so follow-on encounters stay about the same entity.

---

### Support Bundle

**Aliases:** EncounterSupportBundle, Support Specs
**Also see:** `[[Cast]]`, `[[Scene]]`, `[[EncounterTemplate]]`
**Status:** canonical

The authored, template-side declaration of an encounter's supporting entities: `EncounterSupportBundle` is a list of `EncounterSupportSpec`s (in use since 2026-04-03), each describing a keyed supporting actor or location — how it is delivered (reused from the graph or spawned), its `spawnName` fallback, and its persistence after the encounter. At instantiation the bundle resolves into the action's `supportBindings` — the Cast. The bundle is the recipe; the Cast is the dish.

---

### Surface

**Aliases:** Encounter Surface, SurfaceKey
**Also see:** `[[Context Fragment]]`, `[[EncounterTemplate]]`, `[[UnifiedActionTemplate]]`, `[[Encounter]]`
**Status:** canonical

A template **bound to its context axes** — the player-facing unit of encounter identity, and the granularity at which novelty and recency are tracked (THR-475). One template yields many surfaces: the same template at a market district, on a road, and against a shadow-court counterpart are three surfaces, and a player who has seen one has not seen the others.

Identity is a canonical string, `SurfaceKey`, of the form `templateId|axis=val|axis=val` — `templateId` always first, axis components in alphabetical axis-name order, absent axes **omitted rather than serialised as `null`**, so the same inputs always produce the same byte sequence. The participating axes are `SURFACE_KEY_AXES` in `src/engine/encounterSurface.ts`: `sublocationTypeId`, `reachPrimary`, `socialRole`. Every axis must map to a closed enum, which is what bounds surface cardinality by construction. `computeSurfaceKey` is fail-soft per NFP #4 — any malformed or missing axis degrades to a templateId-only key and it never throws.

The volume model's tunable constants live beside it (`SURFACES_PER_RUN_TARGET`, `RELEVANT_FRACTION`, `RUNS_BEFORE_REPETITION`) — read them from the file rather than quoting a figure here, since a number copied into prose is the thing that rots.

**A surface is not a variant of the prose.** It is an identity: what the recency tracker counts. What *changes the words* at that identity is a `[[Context Fragment]]`, and the two use different axis vocabularies — see the warning in that entry.

---

### Context Fragment

**Aliases:** ContextFragmentSet, surface fragment, Fragment
**Also see:** `[[Surface]]`, `[[Band Fragment]]`, `[[UnifiedActionTemplate]]`, `[[Scene]]`
**Status:** canonical

A **context-keyed authored prose variant**, declared on a template as `contextFragments: ContextFragmentSet[]` and spliced into prose at render through a `{frag:<slot>}` token. Each set names a `slot` (the token it answers to), an `axis` it varies on, and a `variants` map of axis-value → authored prose.

The **declared-default invariant** is the load-bearing rule: every `variants` map MUST contain the `'*'` key (`FRAGMENT_DEFAULT_KEY`), so a declared slot always resolves and an unmatched context falls through to the default instead of rendering empty. `fragmentResolution.ts` errors when a `{frag:}` token references a slot the template does not declare, and `proseEnrichment.ts` strips malformed tokens as a residual so none can leak to the player. Authoring is capped for compactness (`MAX_FRAGMENT_SLOTS_PER_TEMPLATE`).

**⚠ Fragment axes are not Surface-key axes.** `SURFACE_FRAGMENT_AXES` is `place | counterpartRole | setting` (`setting` added by THR-884's envelopes); `SURFACE_KEY_AXES` is `sublocationTypeId | reachPrimary | socialRole`. Both are called "axes" and they are different closed sets — treating a fragment axis as a surface axis type-checks nowhere but reads plausibly in prose and in review, which is why the two lists are named here together.

**Not a `[[Band Fragment]]`.** A Context Fragment varies prose by **where and with whom** the encounter happens, chosen before the step resolves. A Band Fragment varies prose by **how the roll landed** with a given `[[Nudge]]` active, chosen after. They are authored on different objects and keyed on different things.

**Prefer the two-word term.** The bare word *Fragment* is ambiguous inside this shard — `[[Band Fragment]]` predates it and is also "an authored prose variant selected by a key" — so `Context Fragment` is canonical and `Fragment` is recorded only as an alias. Use the bare form solely where a `contextFragments` field or a `{frag:}` token is already in view.

### Nudge

**Aliases:** StepNudge, nudge card
**Also see:** `[[Rider]]`, `[[Band Fragment]]`, `[[Encounter]]`, `[[Rebuild Road]]`
**Status:** canonical

An authored, per-encounter, sphere-flavoured micro-intervention the god plays during an **attended** (`story_beat`) encounter step. Each nudge names a concrete physical cause — a tremor leaving a hand, a lamp catching a second time — is essence-priced, and shifts the fate forecast through a named modifier (`nudge:<id>`). It may also carry a `[[Rider]]`.

**A nudge never picks an outcome; fate rolls.** That is the whole distinction from the rejected authored-futures model, in which the player chose the ending directly. The god acts in the physics of the scene, never in the dramaturgy of the story.

Nudges are content, not configuration: options are authored per encounter, and only the six families in `SHARED_GENERIC_NUDGE_FAMILIES` are reused across them. Schema: `StepNudge` on `ActionStep.nudges` (`src/types/unifiedAction.ts`). A step with no `nudges` resolves exactly as it did before the schema landed — the feature is opt-in.

---

### Rider

**Aliases:** NudgeRider, band rider
**Also see:** `[[Nudge]]`, `[[Band Fragment]]`
**Status:** canonical

A **mechanical** remap of an already-resolved `StepOutcome`, carried by a `[[Nudge]]`. Exactly two exist: `no_crit_fail` (`critical_failure` → `failure`) and `floor_at_cost` (`failure` **and** `near_miss` → `success_at_cost`).

Riders take **zero draws** from any PRNG stream — they are pure band-mapping applied after the d100 has landed, so the same seed plus the same nudges yields the same roll and every downstream stream consumer is untouched. A rider that re-rolled was considered and rejected for exactly that reason. At most one rider applies per step; the strongest wins (`NUDGE_RIDER_PRIORITY`) and they never stack.

**Not a `[[Band Fragment]]`.** A rider changes what happened.

---

### Band Fragment

**Aliases:** bandProse entry
**Also see:** `[[Nudge]]`, `[[Rider]]`, `[[Context Fragment]]`
**Status:** canonical

A line of **prose** appended to a step's outcome text when a given `[[Nudge]]` was active for that band. Authored as `StepNudge.bandProse`, keyed on the six-value `StepOutcome` — *not* the five-band `EncounterOutcomeBand` and *not* `OutcomeBand` from `outcomeConsequences.ts`, either of which would type-check while being the wrong domain.

**Not a `[[Rider]]`.** A fragment says the god was there when it happened. The two words are not interchangeable, and the disambiguation is load-bearing because both are authored on the same object.

**Not a `[[Context Fragment]]` either.** This one is keyed on **how the roll landed**, after resolution, and is authored on a `[[Nudge]]`. A Context Fragment is keyed on **where and with whom**, before resolution, and is authored on the template. Both are "an authored prose variant selected by a key", which is exactly why the bare word *Fragment* is not used alone for either.

Every nudge must carry at least one fragment in a failure band (`near_miss`, `failure`, `critical_failure`): the god's hand has to be traceable in failure at any size. Nudge-specific payoffs belong in fragments and never in the step's base text, which must read correctly with any subset of the hand active.

---

### Rebuild Road

**Aliases:** rebuild encounter
**Also see:** `[[Broken]]`, `[[Nudge]]`, `[[Encounter]]`
**Status:** proposed

A quintessence-rebuilding encounter — the road back out of the `[[Broken]]` state. A few per Reach (the tavern drunk, absolution, retiring home, old friends, hard labour), each restoring slowly over repeat visits rather than in one beat.

Rebuild Roads are the **only** content a Broken mortal may draw, via `UnifiedActionTemplate.drawableWhileBroken`. This is why `BROKEN_GATE_ENABLED` ships `false`: a mortal locked out of all candidacy with no road back is stun-locked, not broken. Flipping the gate is a WS5 Done-when, gated on these encounters actually existing.
