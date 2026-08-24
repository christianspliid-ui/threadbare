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

### SCAR

**Aliases:** SCAR chip, scar consequence
**Also see:** `[[BOND]]`, `[[BOON]]`, `[[PATH]]`, `[[Aftermath]]`, `[[Hidden Mark]]`
**Status:** canonical

A consequence category: **what the encounter cost the character**, written on body or spirit — an injury, a loss, a weight carried away from the scene.

SCAR is one of **four** consequence categories — SCAR, `[[BOND]]`, `[[BOON]]`, `[[PATH]]` — that replace the six display kinds the aftermath used before (`TOLL`, `MARK`, `SEED`, `PRIZE`, `STANDING`, `WOUND`). The four are story-first: each names something that happened *to the character*, where the old six named the engine's own bookkeeping. SCAR absorbs the retired `TOLL` and `WOUND`. Specified in `Docs/plans/2026-08-12-thr-1082-consequence-language.md` § Design decisions 1; the display labels live in `CONSEQUENCE_CATEGORY_LABELS`.

**The words are author-facing, not just display copy.** Encounter authors declare a consequence's `category` per the nudge authoring spec, so the vocabulary crosses engine payload, authoring spec, and UI at once — which is why the four are seated here rather than left as UI strings.

**`MARK` was deleted rather than renamed, and that is the load-bearing part of the taxonomy.** It was the "everything else" bucket, and a bucket named *everything else* can never be story-legible. There is deliberately no fifth catch-all: a change whose kind cannot be classified folds **by polarity** — `loss` and `mixed` become SCAR, `gain` becomes `[[BOON]]`, `info` becomes `[[PATH]]` — never a blank and never a new bucket. A fifth category may be added later only as a design decision with a plan-doc note, never by resurrecting MARK.

**The retired `MARK` display kind is not `[[Hidden Mark]]`.** They share a word and nothing else: `[[Hidden Mark]]` is a live engine concept (a concealed encounter seed on an agent), as are curse marks. Only the aftermath *display* kind retired.

---

### BOND

**Aliases:** BOND chip, bond consequence
**Also see:** `[[SCAR]]`, `[[BOON]]`, `[[PATH]]`, `[[Bond Reception]]`, `[[Aftermath]]`, `[[Reputation]]`
**Status:** canonical

A consequence category: **who now stands with or against the character** — a companion joining them, faction standing, personal reputation. Absorbs the retired `STANDING` display kind. See `[[SCAR]]` for the taxonomy the four categories belong to, and `[[Reputation]]` for the quantity a standing move actually writes.

BOND is the category a companion attachment renders as when an encounter grants one (THR-1096), which is what makes "saved by a passing wanderer, who now walks with you" a single readable consequence rather than an inventory line.

**Not `[[Bond Reception]]`, and not `bondQuality`.** Three different senses of *bond* now coexist and the disambiguation is load-bearing: BOND is a consequence category covering a mortal's ties to other people; `[[Bond Reception]]` is how a mortal receives the *god* at the Meet-The-First climax; `bondQuality` (Agents shard) is the health of a mentorship edge. A BOND chip never reports the god↔mortal `[[Thread]]`.

---

### BOON

**Aliases:** BOON chip, boon consequence
**Also see:** `[[SCAR]]`, `[[BOND]]`, `[[PATH]]`, `[[Aftermath]]`, `[[Domain Capability]]`
**Status:** canonical

A consequence category: **what the character earned, and the story of why** — capability growth with its cause, prizes taken. Absorbs the retired `PRIZE` display kind and the ungrouped growth chips. See `[[SCAR]]` for the taxonomy the four categories belong to.

The second clause is the requirement. A BOON that reports growth without its cause is the defect this taxonomy exists to remove: *"Vara's Stone grew steadily"* named a real change and no reason for it, because the engine generated the sentence and nobody authored the fiction. Authored chips render **cause → change** in that order; engine-derived chips drop the sentence entirely and render as a compact icon-first row, with the step that was rolled as their implicit cause.

---

### PATH

**Aliases:** PATH chip, path consequence
**Also see:** `[[SCAR]]`, `[[BOND]]`, `[[BOON]]`, `[[Encounter Seed]]`, `[[Thread]]`
**Status:** canonical

A consequence category: **a way that has opened** — a plot hook the ending sets in motion. Absorbs the retired `SEED` display kind. See `[[SCAR]]` for the taxonomy the four categories belong to.

PATH is the one category that carries **no magnitude**. Gains and losses render a delta cluster of one to three triangles; a way either opened or it did not, so PATH draws a single scale-less marker (`PATH_MARKER_GLYPH`). An unclassifiable change with `info` polarity folds here.

**Not `[[Encounter Seed]]`.** PATH is the display category; `[[Encounter Seed]]` is the engine object a PATH chip usually reports the planting of. The chip is how the player learns a road opened; the seed is what actually matures into the encounter at the far end of it.

**`THREAD` was considered for this category and rejected.** The UL already owns *thread* as the god↔mortal bond (`[[Thread]]`, Agents shard), and a second referent on a player-facing surface would have collided with the game's most load-bearing word. Recorded here so it is not reintroduced from the design brainstorm, where it reads well.

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

An authored, per-encounter, sphere-flavoured micro-intervention the god plays during an **attended** (`story_beat`) encounter step. Each nudge names a concrete cause somewhere in the god's sphere range — a tremor leaving a hand, a lamp catching a second time, an urge arriving in sleep, a sense that this has happened before — is essence-priced, and shifts the fate forecast through a named modifier (`nudge:<id>`). It may also carry a `[[Rider]]`.

**A nudge never picks an outcome; fate rolls.** That is the whole distinction from the rejected authored-futures model, in which the player chose the ending directly. The god acts through their spheres on the fabric of the scene — matter, minds, dreams, fates — never in the dramaturgy of the story: **influence, never authorship**. The cause need not be physical (THR-1178); what it must never be is an instruction to the mortal or a choice between authored endings.

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

### Repertoire

**Aliases:** card repertoire, RepertoireEntry, buildRepertoire
**Also see:** `[[Nudge]]`, `[[Sphere Attunement]]`, `[[Sphere]]`, `[[Rider]]`
**Status:** canonical

The set of `[[Nudge]]` cards a given god **holds for a run** — assembled from the whole card library by two independent gates, plus any echo cards carried in from previous runs. Built by `buildRepertoire` (`src/engine/nudgeCardRepertoire.ts`); each held card is a `RepertoireEntry` carrying its access band and a `source` naming *why* it is held (`core | signature | hunger | milestone | god_trait | sphere_attunement | echo`).

**A repertoire is per-run and library-level; a hand is per-step and encounter-level.** The repertoire answers *which cards does this god hold*. `buildNudgeHand` answers *which of this authored step's cards may be played right now*, partitioning them into playable / dimmed / hidden. The two meet at exactly one seam — `repertoireCardCost` quotes a price that `effectiveNudgeCost` then charges — and keeping them apart is what stops a repertoire question being answered with one encounter's data.

**Access is not unlock, and both must pass.** *Access* asks whether the god's sphere identity may touch the card at all: universal core and primary-sphere cards `full`, secondary-sphere `discounted`, everything else `locked`. *Unlock* asks whether this member has been earned yet — `starting`, `milestone` (riding the existing `unlockedActionIds` grant set rather than a second ledger), `god_trait`, or `[[Sphere Attunement]]`. `memberAccess` runs **first**, which is exactly why attunement deepens without widening.

**A held card's access is never `locked`.** Locked members are dropped before they enter the list, and the type states it (`HeldCardAccess = Exclude<CardAccess, 'locked'>`) — so a surface rendering access carries no dead branch for a state it cannot receive.

**Echo cards bypass access entirely**, the locked check included, which is why they are appended after the loop rather than filtered through it: a dead god's trick does not ask whether the new god is allowed it. A somber harvest returns one **scarred** — cheaper, and carrying a forecast penalty.

**Pure over run state** (NFP #3). Same sphere identity, same unlock set, same chronicle ⇒ the same repertoire and the same echo card, every time. No PRNG: the run's defining card is *selected* by a total ordering — most played, then the most storied moment, then card id — never rolled. The final id tie-break is what makes a saved run replay rather than merely usually replay.

---

### Sphere Attunement

**Aliases:** attunement, essenceEarnedBySphere, `sphere_attunement`
**Also see:** `[[Nudge]]`, `[[Repertoire]]`, `[[Sphere]]`, `[[Sphere Alignment]]`, `[[Rider]]`
**Status:** canonical

The **lifetime essence a god has drawn through one sphere**, counted monotonically for the whole run (`GameState.essenceEarnedBySphere`) and read as the fourth unlock channel on the nudge card library — beside `starting`, `milestone` and `god_trait`. Crossing an authored mark (`SPHERE_ATTUNEMENT_THRESHOLDS`, `[20, 60]`) brings that sphere's attunement-gated `[[Nudge]]` members within reach: siblings of cards the god already plays, never stronger ones. Each crossing emits one `nudge_attunement_unlock` trace naming the sphere, the mark, and the member ids it opened.

**Earned, not held.** Attunement is a second reading of the divine economy sitting beside the spendable essence pool: the pool says what the god has left, attunement says how much has ever come through. **Spending never lowers it** — a sphere that goes 10 → 4 has not un-earned six, it has spent six. Because a run starts at the essence ceiling, nothing is attuned until essence has actually been spent and re-earned.

**Depth, not a key.** Attunement *deepens* a family the god may already touch; it never widens which families are touchable. Base access stays keyed to the sphere identity — primary at full price, secondary discounted, off-sphere locked — and `memberAccess` runs before the unlock check, so a god who attunes to a sphere they do not hold crosses the mark and gains nothing. This is deliberately **not** THR-870's sphere-governance re-key, which remains parked: attunement adds a deepening channel *on top of* the identity floor and leaves the floor alone.

**Accrual is net movement across one phase merge, not gross grants.** The counter banks at the phase-merge seam (`applyEssenceEarned`), which diffs the pool a phase returned against the pool it was handed and keeps the positive movement — so a grant site added tomorrow is counted without being told to. The stated cost of that choice: a phase that both grants and spends banks only the difference. One shipped phase does both (`phaseControlEffects`, an effect's upkeep against its income), and there the net is the honest number — an effect costing more than it yields has earned the god nothing. Across phases nothing nets.

**An absent counter reads as all-zero, never as a throw.** A legacy save leaves attunement members locked rather than falling open — the same safe direction the unlock switch's exhaustiveness guard takes.

---

### Rebuild Road

**Aliases:** rebuild encounter
**Also see:** `[[Broken]]`, `[[Nudge]]`, `[[Encounter]]`
**Status:** proposed

A quintessence-rebuilding encounter — the road back out of the `[[Broken]]` state. A few per Reach (the tavern drunk, absolution, retiring home, old friends, hard labour), each restoring slowly over repeat visits rather than in one beat.

Rebuild Roads are the **only** content a Broken mortal may draw, via `UnifiedActionTemplate.drawableWhileBroken`. This is why `BROKEN_GATE_ENABLED` ships `false`: a mortal locked out of all candidacy with no road back is stun-locked, not broken. Flipping the gate is a WS5 Done-when, gated on these encounters actually existing.

---

### Formative Test

**Aliases:** formative moment, FormativeTest
**Also see:** `[[Nudge]]`, `[[Band Fragment]]`, `[[Bond Reception]]`, `[[The First]]`, `[[Thread]]`
**Status:** canonical

A **present-tense** trial during the Meet The First encounter, in which the god's played `[[Nudge]]` hand leans one pole of the candidate's value pair and **fate resolves which pole is actually written** into the mortal. Schema: `FormativeTest` (`src/types/meetingEncounter.ts`); resolver: `resolveFormativeTest` (`src/engine/meetingEncounter.ts`).

**The player never picks which way the moment goes.** They lean the odds; fate resolves the band; the band writes the pole. This is the `[[Nudge]]` contract applied to character formation, and it is the whole reason the term exists.

**Replaces the retired "Defining Moment" choice scene**, in which the player picked which of two authored formative moments was true. That is the authored-futures model the nudge pivot rejected.

Band prose is keyed by **which pole the band wrote** (`FormativeBandProse`: `cleanA`, `cleanB`, `tempered`, and the broke-the-other-way slots) rather than by raw band — the same band writes a different pole depending on how the hand leaned, so the prose has to follow the pole, not the roll. Contrast `[[Band Fragment]]`, which is keyed on the six-value `StepOutcome` directly.

---

### Bond Reception

**Aliases:** reception, BondReception
**Also see:** `[[Formative Test]]`, `[[Nudge]]`, `[[Thread]]`, `[[The First]]`
**Status:** canonical

**How the mortal receives the god** at the bond test's climax: one of `awe | devotion | bargain | doubt | defiance`. Written to the thread edge as `bondReception`.

**The bond always forms; the reception colors it.** A reception is never a refusal — the band colors the relationship, it does not deny it. This is what makes the bond test safe to lose.

Derived from the resolved band by `BOND_RECEPTION_BY_BAND` (`src/data/meeting-nudge-constants.ts`), a total map over the six-value `StepOutcome` onto five receptions: `bargain` is the image of **both** middle textures (`success_at_cost` and `near_miss`), since either way the moment did not land cleanly and the mortal negotiates. Every one of the five is reachable from some band — a reception no band can produce is dead content, and a unit test pins that. Malformed templates fall back to `BOND_RECEPTION_FALLBACK` (`bargain`), neutral rather than a refusal.

---

### Unset Weave

**Aliases:** unset-weave framing, still-settling past
**Also see:** `[[Formative Test]]`, `[[Nudge]]`
**Status:** rejected

*Rejected 2026-07-30 (THR-868 grill verdict 13; recorded in code at `src/types/meetingEncounter.ts`).* The framing in which the god nudges **inside a still-settling past** — the candidate's history not yet fixed, the player reaching back into it.

Rejected by Christian in favour of **present-tense trials**: the moment happens now, while the god's attention rests on the mortal. `[[Formative Test]]` is the term that replaced it.

Recorded here rather than left in the brainstorm doc because the rejected framing is *more* evocative than the one that shipped, which is exactly why a later session reading the exploratory draft would reintroduce it.

**This term was never canonical — `rejected` means "considered and refused", not "retired from canon".** That is the distinction `deprecated` cannot carry.
