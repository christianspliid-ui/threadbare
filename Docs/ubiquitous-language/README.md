# Ubiquitous Language — Index

**The canonical glossary for The Fantasy World Simulator.** When docs, code comments, Obsidian, or agent output disagree on terminology, UL wins.

> **In-app dashboard:** browse + search this glossary at [`?view=ul`](http://localhost:5173/?view=ul) (UL Interactive Dashboard, THR-289). Cross-shard search, See-Also navigation, drift badges. Reads a build-generated snapshot of the markdown shards.

Load this file at session start (referenced from CLAUDE.md). Load specific shard files on demand when the task references their terms. The full shard files contain entry definitions; this index is the lightweight always-load footprint (~3k tokens).

---

## Shards

| Shard | Content | Content-adjacent |
|---|---|---|
| [Cosmology.md](./Cosmology.md) | Reaches, Spheres, Foundation/Creation, domain capability, prerequisites | ✅ |
| [Agents.md](./Agents.md) | Agent, Actor, Ascendant, The First, Faction, Rival, Thread, Avatar | ✅ |
| [Encounters.md](./Encounters.md) | Encounter, Template, UAT, Aftermath, Reaction, Seed, Hidden Mark, Awareness | ✅ |
| [Traits.md](./Traits.md) | Trait, Trait Category, Destiny, Trait Ref, TraitPredicate, Trait Hook, Visibility | ✅ |
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
- **[Retinue](./Agents.md#retinue)** — the mortals an Ascendant holds close (`CourtPosition: 'retinue'`); arbitrated 2026-08-13 to the divine-court sense only, never a mortal's companions
- **[Faction](./Agents.md#faction)** — structured social entity; `actorType: 'faction'`; agents join via `member_of` edges
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

### Encounters

- **[Encounter](./Encounters.md#encounter)** — a narrative event resolved through the encounter pipeline
- **[EncounterTemplate](./Encounters.md#encountertemplate)** — data-driven definition of an encounter's structure, steps, and outcomes
- **[UnifiedActionTemplate (UAT)](./Encounters.md#unifiedactiontemplate)** — unified definition covering divine interventions and mortal encounter actions; replaces fixed action slots
- **[Aftermath](./Encounters.md#aftermath)** — the resolution phase; presents Reactions, applies world-graph consequences
- **[Reaction](./Encounters.md#reaction)** — a player/agent choice in the Aftermath phase; applies world-graph mutations
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
- **[Sphere Attunement](./Encounters.md#sphere-attunement)** — lifetime essence earned per sphere (`essenceEarnedBySphere`); the fourth card-unlock channel, deepening families the sphere identity already opens
- **[Rebuild Road](./Encounters.md#rebuild-road)** — quintessence-rebuilding encounter; the only content a Broken mortal may draw
- **[Surface](./Encounters.md#surface)** — a template bound to its context axes (`SurfaceKey`); the unit novelty and recency are tracked at, not a prose variant
- **[Context Fragment](./Encounters.md#context-fragment)** — context-keyed authored prose spliced via `{frag:<slot>}`, `'*'` default required; **not** a Band Fragment, and its axes are not Surface-key axes
- **[Formative Test](./Encounters.md#formative-test)** — present-tense trial in Meet The First; the god leans a value pole, fate writes which pole is true; replaces the retired "Defining Moment" choice scene
- **[Bond Reception](./Encounters.md#bond-reception)** — how the mortal receives the god at the bond climax (`awe | devotion | bargain | doubt | defiance`); the bond always forms, the reception colors it
- **[Unset Weave](./Encounters.md#unset-weave)** — **rejected** framing (nudging inside a still-settling past); recorded so it is not reintroduced from the brainstorm doc

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
- **[worldVersion / touchWorld()](./Graph.md#worldversion-touchworld)** — version counter bumped on graph mutations; UI selectors depend on this, not object reference
- **[structuralCacheVersion / touchStructure()](./Graph.md#structuralcacheversion-touchstructure)** — version counter for distance matrix and encounter cache; call after structural mutations
- **[SimulationRuntime](./Graph.md#simulationruntime)** — per-session cache owner; scoped to playthrough; module-level singletons were rejected
- **[GameState](./Graph.md#gamestate)** — per-session simulation container; mutated in place per tick; UI reads via worldVersion
- **[HexTile](./Graph.md#hextile)** — one cell on the world's hex grid; top tier of the three-tier position model
- **[TerrainType](./Graph.md#terraintype)** — 42-value biome enum on every HexTile; drives encounter scoring and awareness

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
- **[Domain Canon Page](./Process.md#domain-canon-page)** — ≤200-line navigation doc at `Docs/canon/<domain>.md`; agent Step 0 for authoring; points at specs, never owns definitions
- **[Grill-me](./Process.md#grill-me)** — adversarial pre-design questioning skill; Design Governance step 0 for non-trivial work
- **[Vision Audit](./Process.md#vision-audit)** — Design Governance step 7; verify design doesn't silently contradict a Vision premise
- **[Wiring Checklist](./Process.md#wiring-checklist)** — `Docs/plans/wiring-checklist.md`; verification that new modules are connected across all surfaces
- **[Drift Scan](./Process.md#drift-scan)** — weekly GitHub Action producing `drift-scan`-labeled Linear issues from four codebase health signals
- **[Retrospective](./Process.md#retrospective)** — weekly synthesis of impediment log + drift scan issues; run via `retrospective` skill
- **[UL-proposal](./Process.md#ul-proposal)** — Linear issue label for proposed new terms or retirements; always human-approved, never auto-merged
- **[Implementation Plan](./Process.md#implementation-plan)** — Cowork-authored design artifact in Docs/plans/; the executor's input

---

*v1.10 — 8 shards, **127 terms: 123 canonical, 2 deprecated, 1 rejected, 1 proposed** — recounted from `**Status:**` lines at THR-991, which added `rejected` to `ULTermStatus` and flipped Unset Weave onto it; the v1.9 line read "3 deprecated (one of them semantically rejected)" because the status did not yet exist to hold it. (v1.9 counted 127 at THR-1099, which added Companion and Retinue to Agents and arbitrated the two candidate senses of *retinue* in favour of the incumbent divine-court one.) (v1.8 read 125/121 at THR-1098, which added the four consequence categories to Encounters: SCAR, BOND, BOON, PATH.) Two corrections to how this line is written, since it has now been wrong twice: the v1.7 line read "117 canonical + 1 rejected + 2 deprecated", which was right about the canonical count but **silently dropped the one `proposed` term** (Rebuild Road), so its implied total was 120 against an actual 121. Count every `**Status:**` line, not only the statuses you expect to find — the previous footer before that read 118 against an actual 115. (THR-715 added the encounter-volume vocabulary to Encounters: Surface, Context Fragment — the latter declared two-word because bare *Fragment* collides with the pre-existing Band Fragment. THR-782/774 added the nudge-model vocabulary: Nudge, Rider, Band Fragment, Rebuild Road in Encounters; Broken, Dissolution Threshold in Agents. THR-788 added the Traits shard: Trait, Trait Assignment, Trait Category, Destiny, Trait Ref, TraitPredicate, Trait Visibility, Trait Hook, Selection-Competence Separation). THR-873 added the Meet-The-First nudge vocabulary to Encounters: Formative Test, Bond Reception — plus Unset Weave, which shipped carrying `deprecated` because no `rejected` status existed yet and was flipped onto the real one at THR-991 — `rejected` marks a term that was never admitted, `deprecated` one retired from canon. Coverage expands via the propose-new-term flow. UL wins on terminology disagreements.*

*Index coverage: **127 of 127** — every shard term is listed above, and every index anchor resolves to a live shard heading (re-measured THR-1099, 2026-08-13; the two new Agents terms were indexed in the same commit that seated them, which is the discipline the drift below came from skipping). Backfilled in the THR-806 pass: the nine mentorship terms in Agents, the four scene-cast terms in Encounters, and Domain Canon Page in Process. The two Graph versioning terms were a different defect — they were already indexed, but under hand-typed double-hyphen anchors (`#worldversion--touchworld`) that no heading slugifies to, so both links were dead; they were repaired rather than duplicated.*

*Keeping it at 125 of 125: verify with the shard-vs-index diff described in THR-806 — slugify every shard `### ` heading with `slugifyHeading` (`scripts/generate-ul-dashboard-data.ts`) and diff both directions against the anchors here. **Use that function, not a hand-rolled slugifier:** it collapses repeated hyphens (`-+` → `-`), so the two Graph versioning headings slug to `#worldversion-touchworld` / `#structuralcacheversion-touchstructure` — single-hyphen, exactly as indexed. An ad-hoc slugifier that omits the collapse reports both anchors dead and both terms unindexed, which is a false positive on the one pair of entries whose anchors were already repaired once (THR-1098 hit this). **Do not use the dashboard generator's warning list for this** — its `missing_one_liner` warning falls back to each term's first body sentence, so it stays silent on an unindexed term. That fallback is why this drift accumulated across three separate waves unnoticed. A self-detecting guard is tracked as THR-959.*
