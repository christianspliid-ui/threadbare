# Ubiquitous Language — Index

**The canonical glossary for Threadbearer** — the game at [threadbearer.co](https://threadbearer.co); "Threadbare" is the repo codename, "The Fantasy World Simulator" the retired working title. When docs, code comments, Obsidian, or agent output disagree on terminology, UL wins.

> **In-app dashboard:** browse + search this glossary at [`?view=ul`](http://localhost:5173/?view=ul) (UL Interactive Dashboard, THR-289). Cross-shard search, See-Also navigation, drift badges. Reads a build-generated snapshot of the markdown shards.

Load this file at session start (referenced from CLAUDE.md). Load specific shard files on demand when the task references their terms. The full shard files contain entry definitions; this index is the lightweight always-load footprint (~3k tokens).

---

## Shards

| Shard | Content | Content-adjacent |
|---|---|---|
| [Cosmology.md](./Cosmology.md) | Reaches, Spheres, Foundation/Creation, domain capability, prerequisites | ✅ |
| [Agents.md](./Agents.md) | Agent, Actor, Ascendant, The First, Faction, Rival, Thread, Avatar | ✅ |
| [Encounters.md](./Encounters.md) | Encounter, Template, UAT, Aftermath, Reaction, Seed, Hidden Mark, Awareness | ✅ |
| [Traits.md](./Traits.md) | Trait, Trait Category, Destiny, Trait Ref, TraitPredicate, Trait Hook, Visibility — plus the attachment layer: Attachment, Effect, Power, Spell, Bestowal, Innate Power | ✅ |
| [Prose.md](./Prose.md) | IPK, Enrichment Placeholder, Resolver, Strata, Narrative Lexicon, Chronicle | ✅ |
| [Graph.md](./Graph.md) | World Object, Area, Location, Place, Route, Node, Edge, WorldGraph, NodeType, EdgeType, versioning, position model | ❌ |
| [Coordination.md](./Coordination.md) | CC session types, Linear states, claim discipline, WIP, Coordination Block (+ retired Cowork/Codex terms) | ❌ |
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
- **[Retinue](./Agents.md#retinue)** — the mortals an Ascendant holds close (`CourtPosition: 'retinue'`); arbitrated 2026-08-13 to the divine-court sense only, never a mortal's companions
- **[Faction](./Agents.md#faction)** — structured social entity; `actorType: 'faction'`; agents join via `member_of` edges
- **[Reputation](./Agents.md#reputation)** — the social score that modifies interactions between a and b; directional, band-worded, four legs behind one `getReputationWith`
- **[Reputation Tally](./Agents.md#reputation-tally)** — what a mortal is becoming known *for*, on a `<reach>.<polarity>` key; not reputation with anyone
- **[Reputation Score](./Agents.md#reputation-score)** — one-sided world renown ("how the world at large regards X"); shares the band vocabulary, not the concept
- **[reputation_set](./Agents.md#reputation_set)** — *deprecated*: absolute-value standing effect; retired from authoring, handler retained for saved worlds
- **[standing_welcome](./Agents.md#standing_welcome)** — *deprecated*: bespoke welcome condition, zero writers; superseded by reputation-with-a-place
- **[Rival](./Agents.md#rival)** — competing divine entity generated from the World-Soul; always procedural, never hand-authored
- **[Portfolio Pin](./Agents.md#portfolio-pin)** — player-marked agent (`isPortfolioPinned: true`) with elevated narrative prominence
- **[Avatar](./Agents.md#avatar)** — a physical Ascendant manifestation connected via `avatar_of` edge
- **[AxiologicalProfile](./Agents.md#axiologicalprofile)** — signed score across every ValuePair; drives epithet, social response, ambition selection
- **[ValuePair](./Agents.md#valuepair)** — a single virtue/flaw axis (e.g. mercy_ruthlessness); nine pairs total, eight Reach-bound plus one meta
- **[mentor](./Agents.md#mentor)** — agent at Domain Capability tier ≥ `MENTOR_MIN_TIER` (6) on the source end of an active `mentors` edge; teaches via Train Apprentice
- **[apprentice](./Agents.md#apprentice)** — agent at tier 2–4 in the taught Reach, on the target end of a `mentors` edge in `offered` or `training` phase
- **[mentors (edge)](./Agents.md#mentors-edge)** — directed `mentor → apprentice` edge carrying domain, progress, phase, and bondQuality; outlives the backing initiative
- **[bondQuality](./Agents.md#bondquality)** — narrative health of a mentorship bond, clamped `[−1, +1]`; failures cut deeper than successes heal; decides the terminal arc
- **[Train Apprentice](./Agents.md#train-apprentice)** — the multi-tick `social` initiative wrapping a mentorship; the edge is the relationship, the initiative is the occupation
- **[The Surpassing](./Agents.md#the-surpassing)** — terminal mentorship arc: apprentice matches or passes the mentor's tier on a good bond; pride and loss in the same breath
- **[Falling Out](./Agents.md#falling-out)** — terminal mentorship arc below `FALLING_OUT_BOND_THRESHOLD`; seeds hostility, apprentice keeps half the Mastery gain
- **[Quiet Parting](./Agents.md#quiet-parting)** — terminal mentorship arc on a completed initiative with a middling bond; neither graduation nor rupture
- **[Dissolution](./Agents.md#dissolution)** — terminal mentorship arc when the backing initiative fails (death, exile, separation); carries no hostility, unlike Falling Out
- **[Group](./Agents.md#group)** — engine-layer collective of 2–10 named agents; `actorType: 'group'` + `groupType`, no `located_at` edge
- **[Company](./Agents.md#company)** — the player-facing word for a Group; prose and UI never say "party"
- **[Companion](./Agents.md#companion)** — a person-shaped attachment travelling with one mortal, granting always-on bonuses; not an agent, and not a Company
- **[Group Cohesion](./Agents.md#group-cohesion)** — event-driven 0–1 aggregate on a group node; UI renders bound/holding/frayed/breaking, never the number
- **[Draw Together](./Agents.md#draw-together)** — Ascendant action; pulls scattered threaded mortals toward an anchor until a company forms
- **[Bless this Company](./Agents.md#bless-this-company)** — Ascendant action; boosts group cohesion and suppresses disputes for a window
- **[Broken](./Agents.md#broken)** — behavioural state of a worn-out mortal: out of the story, drifting home, mendable; read via `isBrokenMortal()`
- **[Dissolution Threshold](./Agents.md#dissolution-threshold)** — the `QuintessenceThresholdState` literal `'broken'` (ratio zero); renamed in prose to avoid colliding with Broken
- **[Undertaking](./Agents.md#undertaking)** — a multi-tick project an agent takes on of its own motion; the proactive counterpart to an Encounter
- **[Undertaking Verb](./Agents.md#undertaking-verb)** — create · change (raise | lower) · use · control (claim | seize) · destroy · observe; a *cell* is one verb on one World Object kind, and the grid of all of them is generated
- **[Kind Row](./Agents.md#kind-row)** — registry entry declaring one undertaking kind; must name a reachable, motive-gated destroy — until a kind can be undone, it is not a kind
- **[Work](./Agents.md#work)** — the named object a completed undertaking leaves behind; outlives its maker and its owner
- **[Christening](./Agents.md#christening)** — naming at completion, and only at completion; a working possessive holds until then and failures are never christened
- **[Failure-Name Register](./Agents.md#failure-name-register)** — where a *visible* failed undertaking is recorded on the ground; a register, not a name, and clean failures write nothing
- **[Freehold](./Agents.md#freehold)** — the attachment category for an owned place or resource; engine literal `'holding'`, said *freehold* in prose so it never collides with the Group Cohesion band
- **[Undertaking Contract](./Agents.md#undertaking-contract)** — the authoring-time contract a strategic action template must satisfy; ten structural-first blocks, a shrinking ratchet instead of exemptions; not the encounter line's Composition Contract
- **[Calling](./Agents.md#calling)** — the player-visible identity title a mortal carries for what they do; derived on life-changes, never stored as a stat
- **[Moment](./Agents.md#moment)** — one of six turns of an Undertaking a long work reports to the player; presentation (interrupt / badge / none) stamped at emission
- **[Follow](./Agents.md#follow)** — the attention the player confers on a mortal, upgrading that mortal's Moments from badge to interrupt; mute is its negative
- **[Grievance](./Agents.md#grievance)** — a drive minted from a harm, naming its culprit; a `grievance` block on a `pursues` edge, one slot per agent, per-instance not per-ambition
- **[Grudge](./Agents.md#grudge)** — standing blood as a bidirectional `hostile_to` edge with an *injury* provenance; relationship colour, never a driver — one edge, band and grievance senses reconciled
- **[Rivalry](./Agents.md#rivalry)** — the non-injury reading of the same `hostile_to`: two in each other's way, neither wronged; licenses a motive-gated destroy but can never mint a vendetta
- **[Covet Rivalry](./Agents.md#covet-rivalry)** — the rivalry the world writes from frustrated wanting: refused a destroy against the same owner enough boards running, a mortal comes to hate them
- **[Heat](./Agents.md#heat)** — a grievance's decaying urgency on the one decision board; player-facing only as *burning · hot · cooling*, never a number

### Encounters

- **[Encounter](./Encounters.md#encounter)** — a narrative event resolved through the encounter pipeline
- **[EncounterTemplate](./Encounters.md#encountertemplate)** — retired format (THR-108); the live authored unit is [UnifiedActionTemplate](./Encounters.md#unifiedactiontemplate)
- **[UnifiedActionTemplate (UAT)](./Encounters.md#unifiedactiontemplate)** — unified definition covering divine interventions and mortal encounter actions; replaces fixed action slots
- **[Aftermath](./Encounters.md#aftermath)** — the resolution phase; presents Reactions, applies world-graph consequences
- **[Reaction](./Encounters.md#reaction)** — a player/agent choice in the Aftermath phase; applies world-graph mutations
- **[Consequence Chip](./Encounters.md#consequence-chip)** — one line in an ending reporting a single real state change; the surface SCAR/BOND/BOON/PATH are categories of; Law 56 forbids a chip nothing wrote
- **[SCAR](./Encounters.md#scar)** — consequence category: what the encounter cost the character; absorbs TOLL + WOUND, and carries the four-category taxonomy note
- **[BOND](./Encounters.md#bond)** — consequence category: who now stands with or against the character; absorbs STANDING; not Bond Reception
- **[BOON](./Encounters.md#boon)** — consequence category: what they earned *and why*; absorbs PRIZE + growth chips
- **[PATH](./Encounters.md#path)** — consequence category: a way that has opened; absorbs SEED; the one category with no magnitude
- **[Encounter Seed](./Encounters.md#encounter-seed)** — a `PendingEncounterSeed` that matures into an encounter at a future tick
- **[Hidden Mark](./Encounters.md#hidden-mark)** — a concealed seed attached to an agent; invisible until triggered
- **[Encounter Awareness](./Encounters.md#encounter-awareness)** — hex-granular visibility; agent sees all encounters on hexes within awareness range
- **[Court Position](./Encounters.md#court-position)** — the role an agent plays in an encounter's framing; affects scoring and prose
- **[Causation](./Encounters.md#causation)** — the `caused_by` edge linking encounter events to their seeds; makes causal chains inspectable
- **[Chapter](./Encounters.md#chapter)** — the reading unit of a resolved or in-progress encounter; opening, steps, interventions, aftermath
- **[Chapter Record](./Encounters.md#chapter-record)** — compact post-`enrichProse()` snapshot of a resolved encounter (`ChapterRecord`) appended to `chapterArchive`
- **[Chapter Ledger](./Encounters.md#chapter-ledger)** — always-readable list (`game.chapter-ledger`) merging active encounters and resolved chapters
- **[Scene](./Encounters.md#scene)** — the world context of one action or encounter: its Target, its Cast, and its place; what makes prose name real graph entities
- **[Cast](./Encounters.md#cast)** — an encounter's `supportBindings` viewed as characters; prose uses `{cast:<key>}`, aftermath effects use `$cast:<key>`; declared keys always resolve
- **[Target](./Encounters.md#target)** — the node an action is performed on (`action.targetId`), distinct from the actor; addressable in aftermath via the `$target` sentinel
- **[Support Bundle](./Encounters.md#support-bundle)** — the template-side declaration of supporting entities, resolved into the Cast at instantiation; the bundle is the recipe, the Cast is the dish
- **[Nudge](./Encounters.md#nudge)** — authored, essence-priced micro-intervention played into an attended step; shifts the odds, never picks the outcome
- **[Rider](./Encounters.md#rider)** — mechanical remap of an already-resolved band (`no_crit_fail`, `floor_at_cost`); zero PRNG draws, never stacks
- **[Band Fragment](./Encounters.md#band-fragment)** — prose appended when a nudge was active for that band; **not** a Rider, **not** a Context Fragment
- **[Repertoire](./Encounters.md#repertoire)** — the nudge cards a god holds for a run, gated by access (sphere identity) **and** unlock (earned); per-run and library-level, **not** a per-step hand
- **[Sphere Attunement](./Encounters.md#sphere-attunement)** — lifetime essence earned per sphere (`essenceEarnedBySphere`); the fourth card-unlock channel, deepening families the sphere identity already opens
- **[Play Profile](./Encounters.md#play-profile)** — the mechanical half of a library card (`PLAY_PROFILES`), joined to the face at mint time; data that *becomes* a Nudge, and is not one
- **[Dealt Hand](./Encounters.md#dealt-hand)** — the part of a step's hand supplied by the god's Repertoire rather than authored as the encounter's specials; zero-PRNG, so "dealt" never means random
- **[Deal Declaration](./Encounters.md#deal-declaration)** — the authored `ActionStep.deal` opt-in (`count`, `tags`, `exclude`); its tag vocabulary is a **closed** union, and absence means byte-identical behavior
- **[Rebuild Road](./Encounters.md#rebuild-road)** — quintessence-rebuilding encounter; the only content a Broken mortal may draw
- **[Surface](./Encounters.md#surface)** — a template bound to its context axes (`SurfaceKey`); the unit novelty and recency are tracked at, not a prose variant
- **[Context Fragment](./Encounters.md#context-fragment)** — context-keyed authored prose spliced via `{frag:<slot>}`, `'*'` default required; **not** a Band Fragment, and its axes are not Surface-key axes
- **[Formative Test](./Encounters.md#formative-test)** — present-tense trial in Meet The First; the god leans a value pole, fate writes which pole is true; replaces the retired "Defining Moment" choice scene
- **[Bond Reception](./Encounters.md#bond-reception)** — how the mortal receives the god at the bond climax (`awe | devotion | bargain | doubt | defiance`); the bond always forms, the reception colors it
- **[Unset Weave](./Encounters.md#unset-weave)** — **rejected** framing (nudging inside a still-settling past); recorded so it is not reintroduced from the brainstorm doc
- **[Batch Brief](./Encounters.md#batch-brief)** — the Stage 0 planning doc opening a factory batch of six; names variance (reaches/shapes/settings, or the kind × CRUD grid), never content; agent-drafted, chat-approved

### Traits

- **[Trait](./Traits.md#trait)** — a named piece of identity on a graph object; definitions are nodes, assignments are `has_trait` edges; inert on the bearer, powered by whoever references it
- **[Trait Assignment](./Traits.md#trait-assignment)** — the `has_trait` edge carrying level, source, visibility, and the `ticksRemaining` countdown; bearers are actor, location, sublocation
- **[Trait Category](./Traits.md#trait-category)** — one of ten classes stored as `subcategory`; a lifecycle contract (acquisition, removal, trigger), not a label
- **[Destiny](./Traits.md#destiny)** — the forward-contract category: a world-minted promise, always visible; currently reserved and empty
- **[Trait Ref](./Traits.md#trait-ref)** — how content names a trait: node id, short id, display name, or tag; resolves to a set, predicates ANY-match
- **[TraitPredicate](./Traits.md#traitpredicate)** — the canonical gate `{ traitId, minLevel? }`; settles the ambition-key vs template-predicate `requiredTraits` collision
- **[Trait Visibility](./Traits.md#trait-visibility)** — `public` / `discoverable` / `divine_only`; governs whether a trait is known yet, never whether a known trait is shown
- **[Trait Hook](./Traits.md#trait-hook)** — any authored reaction to a trait: gate, variant, trait-only nudge, or trait fragment; every hook names its trait
- **[Selection-Competence Separation](./Traits.md#selection-competence-separation)** — selection steers through `scoringModifiers`; competence only through capped `domainContributions` and the resolution-bonus cap
- **[Attachment](./Traits.md#attachment)** — the broad code umbrella for anything borne by a bearer that changes what it can do; eight `AttachmentCategory` members, not a player-facing word
- **[Effect](./Traits.md#effect)** — the substrate word: the `AttachmentEffect` primitives powers and items are built from; never player-facing as a family name
- **[Power](./Traits.md#power)** — player-facing family name for a carried, capability-granting thing: spell, bestowal, innate power; a conceptual family, not an `AttachmentCategory`
- **[Spell](./Traits.md#spell)** — a Power learned from a magic tradition; carries an agency, an arena, and a price
- **[Bestowal](./Traits.md#bestowal)** — a god-given Power; player-facing name for the `bestowed_power` kind, whose code identifier stays; not the `bestowed` trait category
- **[Innate Power](./Traits.md#innate-power)** — a Power that is anatomy, stamped at seeding; no code anchor yet, and not the `innate` trait category
- **[Tag Namespace](./Traits.md#tag-namespace)** — every content tag is written `#`-prefixed across one shared namespace; `normalizeTag` strips one leading `#` as a safety net, but the convention is the rule

### Prose

- **[IPK (Instant Prose Kernel)](./Prose.md#ipk-instant-prose-kernel)** — the minimal core prose fragment before enrichment resolution
- **[Enrichment Placeholder](./Prose.md#enrichment-placeholder)** — template variable (`{name}`, `{artifact}`, `{ally}`) resolved at display time by walking the graph
- **[Resolver](./Prose.md#resolver)** — prose pipeline component that fills Enrichment Placeholders; implemented via `enrichProse()`
- **[Strata](./Prose.md#strata)** — layered prose tiers that compose a full narrative beat from multiple engine signals
- **[Narrative Lexicon](./Prose.md#narrative-lexicon)** — 10-tier per-Reach vocabulary (`NARRATIVE_LEXICON`); translates capability scores into evocative prose labels
- **[Chronicle Entry](./Prose.md#chronicle-entry)** — persistent record of a significant event in an agent or faction's history
- **[Narrative Event](./Prose.md#narrative-event)** — `TickEvent` carrying a prose message; flows to the UI event feed
- **[Thread Tug](./Prose.md#thread-tug)** — attention signal (`ThreadTug`) directing player focus to stressed divine threads
- **[Narrator Mode](./Prose.md#narrator-mode)** — the binding encounter-prose mode since 2026-08-25: a GM reading a module aloud, reporting from outside the scene; reverses foreshadow-never-announce and show-don't-tell by name
- **[Register](./Prose.md#register)** — the three-way classification of every player-facing string (`baseline` / `character` / `peak`); absent `register?` means baseline, and peak is rationed to non-encounter surfaces
- **[Band Fragment (Prose)](./Prose.md#band-fragment)** — the authoring side of the term the Encounters shard owns mechanically: every nudge owes a failure-band fragment, and base band text must read with any subset of the hand active
- **[Vagueness Field Class](./Prose.md#vagueness-field-class)** — the scope a prose field is linted under (`outcome` / `scene` / `interactive`); decides whether natural indefinites are a defect or correct prose
- **[Register Compliance](./Prose.md#register-compliance)** — the deterministic prose-QA dimension measuring register drift; **report-only by settled verdict** (THR-1250) — it ranks, it does not identify defects

### Graph

- **[World Object](./Graph.md#world-object)** — a kind of thing the world keeps, in game words: a node/edge/state shape plus a named subtype; registry `src/data/world-objects.ts`, catalogue `Docs/canon/world-objects.md`
- **[Area](./Graph.md#area)** — a multi-hex terrain cluster containing its Locations; the `region` node; geographic, never political
- **[Location](./Graph.md#location)** — the outer place tier: a `location` node without `parentLocationId`; seven classes over `locationSubtype`
- **[Place](./Graph.md#place)** — the inner place tier inside a Location: a `location` node with `parentLocationId`; the code word is *sublocation*; never "room" or "structure"
- **[Route](./Graph.md#route)** — an edge between two Locations (`road`, `trades_with`, `sacred_route`) that grows an identity node when nameable or ownable; classes road · trail · trade_lane · pilgrim_way · portal
- **[Node](./Graph.md#node)** — `GraphNode`; the basic entity in the world graph; everything is a node
- **[Edge](./Graph.md#edge)** — `GraphEdge`; typed directed relationship between nodes; everything meaningful is an edge
- **[WorldGraph](./Graph.md#worldgraph)** — central data structure; mutated in place; object reference never changes; use version counters for stale-detection
- **[NodeType](./Graph.md#nodetype)** — node categories: `actor`, `location`, `trait`, `artifact`, `action_template`, `event`, `cosmology`, `region`, `ambition`
- **[EdgeType](./Graph.md#edgetype)** — edge categories; see `src/types/graph.ts` for full list; check before adding a new type
- **[Property-vs-Edge Rule](./Graph.md#property-vs-edge-rule)** — relationships are edges, not property fields; traversal is the default
- **[Three-tier Position Model](./Graph.md#three-tier-position-model)** — spatial hierarchy: hex → location → sublocation; agent occupies exactly one tier via a single `located_at` edge
- **[located_at Edge](./Graph.md#located_at-edge)** — the single edge connecting an agent to their current position; authoritative source of agent location
- **[worldVersion / touchWorld()](./Graph.md#worldversion-touchworld)** — version counter bumped on graph mutations; UI selectors depend on this, not object reference
- **[structuralCacheVersion / touchStructure()](./Graph.md#structuralcacheversion-touchstructure)** — version counter for distance matrix and encounter cache; call after structural mutations
- **[SimulationRuntime](./Graph.md#simulationruntime)** — per-session cache owner; scoped to playthrough; module-level singletons were rejected
- **[GameState](./Graph.md#gamestate)** — per-session simulation container; mutated in place per tick; UI reads via worldVersion
- **[HexTile](./Graph.md#hextile)** — one cell on the world's hex grid; top tier of the three-tier position model
- **[TerrainType](./Graph.md#terraintype)** — 42-value biome enum on every HexTile; drives encounter scoring and awareness
- **[WorldRef](./Graph.md#worldref)** — the normalised reference to a world object (13 kinds); the membership spine the anchor catalog projects seven consumer vocabularies against; deliberately not called "anchor"

### Coordination

- **[Cowork](./Coordination.md#cowork)** — *deprecated* (retired 2026-07-21, THR-654) — the design/planning agent of the two-runtime model; replaced by the CC design session
- **[Claude Code (CC)](./Coordination.md#claude-code-cc)** — the single runtime; executor sessions claim Ready for Dev; WIP limit 1
- **[Codex](./Coordination.md#codex)** — *deprecated* (retired 2026-06-23, THR-486) — secondary executor on the Ready for Codex queue
- **[Linear](./Coordination.md#linear)** — single source of truth for all issues, states, and dependencies
- **[Claim-before-read](./Coordination.md#claim-before-read)** — `save_issue(In Dev, me)` before reading any plan doc; verified with `get_issue` immediately after
- **[WIP Limit](./Coordination.md#wip-limit)** — 1 In Dev issue per executor at a time, across all sessions and worktrees
- **[Handoff Comment](./Coordination.md#handoff-comment)** — the design session's final comment moving an issue to Ready for Dev; supersedes original description when it diverges
- **[Ready for Dev](./Coordination.md#ready-for-dev)** — Linear state: CC pickup queue; filter `assignee: null`
- **[Ready for Codex](./Coordination.md#ready-for-codex)** — *deprecated* (retired 2026-06-23, THR-486) — the Linear state that fed the Codex queue
- **[In Dev](./Coordination.md#in-dev)** — Linear state: active implementation; never close manually; use `Fixes THR-XX` auto-close
- **[Coordination Block](./Coordination.md#coordination-block)** — mandatory handoff fields: Suggested model, Parallel-safe with, Mutex with
- **[Parallel-safe](./Coordination.md#parallel-safe)** — issues that can be worked concurrently without file conflicts
- **[Mutex](./Coordination.md#mutex)** — issues that cannot be worked concurrently due to shared file surfaces
- **[Fixes THR-XX](./Coordination.md#fixes-thr-xx)** — commit body keyword that triggers Linear auto-close on merge to main; the only valid Done transition

### Process

- **[Threadbearer](./Process.md#threadbearer)** — the game's name (threadbearer.co); "Threadbare" = repo/Linear codename, "The Fantasy World Simulator" = retired working title surviving only in paths
- **[Non-Functional Priority (NFP)](./Process.md#non-functional-priority-nfp)** — seven ordered priorities: Tunability, Inspectability, Determinism, Fail-soft, Narrative, Additive, Performance
- **[Three-Pillar Rule](./Process.md#three-pillar-rule)** — every feature addresses Engine, Content, and UI; mark each N/A with rationale if not applicable
- **[Definition of Done](./Process.md#definition-of-done)** — mandatory closeout: commit, push, merge, deploy, update docs, log deferrals + impediments
- **[Design Governance](./Process.md#design-governance)** — the pre-implementation design checklist; authoritative home `Docs/canon/design-governance.md` (this index deliberately carries no step list — the last copy drifted to 8 steps against the authority's 15)
- **[Ubiquitous Language (UL)](./Process.md#ubiquitous-language-ul)** — this sharded glossary; authority on terminology when sources disagree
- **[Domain Canon Page](./Process.md#domain-canon-page)** — ≤200-line navigation doc at `Docs/canon/<domain>.md`; agent Step 0 for authoring; points at specs, never owns definitions
- **[Grill-me](./Process.md#grill-me)** — adversarial pre-design questioning skill; Design Governance step 0 for non-trivial work
- **[Vision Audit](./Process.md#vision-audit)** — Design Governance step 7; verify design doesn't silently contradict a Vision premise
- **[Wiring Checklist](./Process.md#wiring-checklist)** — `Docs/plans/wiring-checklist.md`; verification that new modules are connected across all surfaces
- **[Drift Scan](./Process.md#drift-scan)** — weekly GitHub Action producing `drift-scan`-labeled Linear issues from four codebase health signals
- **[Retrospective](./Process.md#retrospective)** — weekly synthesis of impediment log + drift scan issues; run via `retrospective` skill
- **[UL-proposal](./Process.md#ul-proposal)** — Linear issue label for proposed new terms or retirements; always human-approved, never auto-merged
- **[Implementation Plan](./Process.md#implementation-plan)** — design-session-authored artifact in Docs/plans/; the executor's input
- **[claim-without-anchor](./Process.md#claim-without-anchor)** — interface text names a simulation object without declaring a referent; alias *Law 56-hollow*; badged 🟣 HOLLOW on the interface map
- **[write-without-consumer](./Process.md#write-without-consumer)** — a write nothing acts on; the interface map's 🔴 LEAKED class, now derived by the consumption ledger rather than asserted
- **[render-private-pipeline](./Process.md#render-private-pipeline)** — a surface rendering from a pipeline no other consumer can reach; the map covers it only partially, stated rather than badged

---

*v1.16 — 8 shards, **177 terms: 169 canonical, 5 deprecated, 1 rejected, 1 proposed, 1 retired** (THR-1391 seated `Agents#rivalry` and `Agents#covet-rivalry`). Per-shard census: Agents 51, Encounters 37, Graph 20, Process 17, Traits 16, Coordination 14, Prose 13, Cosmology 9. **The v1.14 tally above this one was stale by 12** — it read `161 / 153 canonical` with `Agents 41, Graph 15` while the shards actually held 173 headings (`Agents 48, Graph 20`), because terms were seated without the recount this very line mandates. Caught by running the measured diff below rather than trusting the assertion; the count has now been caught stale four times. **Recount after any term change** with `grep -h "^\*\*Status:\*\*" Docs/ubiquitous-language/*.md | sort | uniq -c` — count every `**Status:**` line, not only the statuses you expect (the tally has been caught stale three times, twice by an unexpected status). Coverage expands via the propose-new-term flow. UL wins on terminology disagreements.*

*Index coverage: **177 of 177** — index every term in the same commit that seats it. `band-fragment` is shard-crossing and carries one row per shard, so 177 headings resolve to 177 anchors. **Measured both directions at THR-1391, not asserted:** that run diffed 177 shard headings against 177 index anchors with zero unindexed terms and zero dead anchors, seating `rivalry` and `covet-rivalry` in the same commit as their index rows. This line is an assertion, not a guard — it has been wrong twice while reading true (`141 of 141` with 15 terms unrecorded; `161 of 161` with 3), and only a measured diff can tell you which it is today. Verify with the shard-vs-index diff (THR-806): slugify every shard `### ` heading with `slugifyHeading` from `scripts/generate-ul-dashboard-data.ts` and diff both directions against the anchors above. Use that function, never a hand-rolled slugifier (it collapses repeated hyphens, which a naive one misreports as two dead anchors), and never the dashboard generator's warning list (its one-liner fallback stays silent on unindexed terms). **Match anchors with `[a-z0-9_-]+`, not `[a-z0-9-]+`** — three seated terms carry an underscore (`agents#reputation_set`, `agents#standing_welcome`, `graph#located_at-edge`), and a hyphen-only anchor pattern reports exactly those three as unindexed: a false alarm in the same family as the hand-rolled slugifier this line already warns about (caught and corrected mid-run at THR-1391). Self-detecting guard tracked as THR-959.*

*Footer compressed at THR-1334 (2026-08-28, single-authority sweep): the full recount archaeology of v1.7–v1.12 — which additions landed when, and the three times the tally was caught stale and why — lives in this file's git history, where history belongs.*
