# Ruins Layer — Brainstorm Prep

**Date:** 2026-04-18 (prep for 2026-04-19 session)
**Status:** Research compiled · not yet a design · 50+ opportunities to triage
**Authors:** Cowork (overnight research pass), to be discussed with Christian in the morning

---

## How to read this document

This is **not a design proposal**. It is a divergent opportunity catalogue assembled from (a) the existing Obsidian vault, (b) the Mystara wiki, (c) the Malazan wiki, (d) the repo's 9 archetype packs, (e) the foundation/creation sphere pages, (f) the Linear backlog, and (g) the Tonal Bible + Thematic Pillars.

The intent is for us to **compare and contrast many options**, pick what feels true, kill what doesn't, and only then converge on a plan. Where I've flagged a preferred direction, it's because the vault/memory already implies a settled answer — but I've still listed the alternatives so we can stress-test them.

Sections:
1. **Framing** — why now, what's a "ruins layer" even supposed to be
2. **What's already built** — the half-finished substrate (a lot of it)
3. **The big unresolved questions** — 10 to answer tomorrow
4. **Opportunity families** — 8 families × 3–5 divergent approaches each
5. **Integration map** — how the ruins layer would plug into every existing system
6. **Source highlights** — the best 10 things pulled from Mystara / Malazan / existing archetypes
7. **The brainstorm agenda** — suggested 90-minute flow
8. **Scope / prioritization** — MVP vs. later

---

## 1. Framing

### What this layer is for, in plain language

The ruins layer is where the game **stops being a social-political simulation and starts being an exploration-mystery simulation.** Right now, Threadbearer simulates living cultures, factions, agents, encounters, and divine pressure — all acting on the present tick. The ruins layer adds a second axis: **the past acting on the present through the physical landscape.**

It answers three things the current engine can't:

- **Where does lost knowledge live?** Dead cultures, Foundation sphere (elder) magic, pre-cycle history — right now these exist as vault content but have no in-world host. Ruins become the host.
- **What do curious mortals *do*?** The current action cards are largely social/political. Exploring a lost place is a different verb, and it needs its own encounter grammar.
- **How does history become pressure?** Without a ruins layer, the past is inert lore. With one, the past can *intrude* — a seal breaks, a god stirs, an artifact surfaces — and the present has to react.

### Why this is urgent *now* (not later)

1. **The Echo System already promises it.** Monument Echoes explicitly manifest as "ruins with resonant properties" and Relic Echoes as "discoverable items" — but the system has no ruins to seed into. It's a pipeline with no output target.
2. **The Unified Rarity Model already reserves hooks.** Encounter scoring has `ruins` and `anomaly` additive bonuses in the formula. Empty hooks.
3. **The Foundation spheres have been called "elder magic" for months.** Memory: *"Foundation spheres are 'elder magic' in-game — discovered through ruins, not at chargen."* But there are no ruins to discover them *in*.
4. **8 dead empires are already authored** (`historical-culture-content.ts`) and already shape region naming — but they leave no physical imprint on the map. The naming is the only ghost of them.
5. **The Tonal Bible explicitly says ruins are the history-delivery vehicle.** *"The player discovers it Malazan-style: through ruins, cultural memories, contradictory legends."* No ruins = the tonal target is unachievable.

We are in the rare situation where the *absence* of the ruins layer is actively blocking multiple shipped systems from having narrative payoff. This isn't greenfield design — it's the keystone that locks an arch already 80% built.

### What "fleshing out the ruins layer" should produce

A brainstorm outcome looks like an answer to four questions, in order:

1. **What is a ruin, as a graph object?** (node type / subtype / sublocation pattern / something new)
2. **Where do ruins come from?** (origin stories: worldgen seed, destruction aftermath, first-cycle legacy, all three)
3. **What does a mortal do at one?** (delve core loop — the verbs)
4. **What does a god do about one?** (divine intervention surfaces — how the ruins layer feeds back into the player's interface)

Everything else — adventurer factions, artifact recovery, lost languages, elder magic schools, secret societies, dormancy — hangs off those four.

---

## 2. What's already built — the substrate

The ruins layer is not a greenfield design. Every one of these already exists and should be assumed:

### 2.1 Content substrate (authored, not generative)

| Artifact | Location | What it provides |
|----------|----------|------------------|
| 8 historical culture templates | `src/data/historical-culture-content.ts` | Pale Builders, Root-Speakers, Ash-Crowned, Tide-Callers, Iron Reclaimers, +3. These shape region naming today and are the obvious seed cultures for first-cycle ruins. |
| 20+ ruin-adjacent Place Archetypes | `TheFantasyWorldSimulator/Archetypes/Place Archetypes.md` | Ruined Fortress, Wizard's Tower, Living Archive, Master Forge, Ancestral Monument, Jungle Pyramid, Haunted Tower, Underground Temple, Floating Ruin-City, Living Prison, Interior World, Healing Waters, Sacrifice Site, Subterranean Metropolis, Underground City, Island Sacred Temple, Isolated Laboratory |
| 7+ lost-civ/expedition quest archetypes | `Adventure & Quest Archetypes.md` | Lost Civilization Expedition (C1/D2/D3), Haunted Relic Recovery, Mad Artificer Stronghold, Underground City Intrigue, Warren Expedition, Planar Incursion, Prophetic Investigation, Artifact Recovery |
| 10+ elder-race monster archetypes | `Monster Archetypes.md` | Vow-Bound Undead Host (T'lan Imass), Eusocial Extinction (K'Chain), Genocide Survivor (Jaghut), Imprisoned God, Fractured God-Fragment, Mad Archmage, Nest-World, Binding Beast, Ancient Wanderer (Icarium), Corrupted Noble |
| 11+ iconic artifact archetypes | `Artifact Archetypes.md` | Soul-Bound Weapon, Planar Gate, Timeless Container, Curse Object, Archive Crystal, Soul-Prison Blade (Dragnipur), Magic-Deadening Sword (Otataral), Screaming Blade (Hust), Invested Flint, Soul-Bound Craft, Sealed Treaty, Bloodline Sigil |
| 9+ elder magic traditions | `Spell & Magic Archetypes.md` | Warren Walker, Blood-Forged Path (K'rul), Anti-Magic Ore, Deck Reading, Runic Inscriber, Craft-Bound Spell, Oath-Binding Pact, Shadow Weaver, Genie Bargainer |
| 7+ lost-region archetypes | `Region Archetypes.md` | Preservation Prison, Techno-Magical Ruin, Cursed Realm, Shattered Warren, Sleeping God's Body, Convergence Point, Underground Kingdom |

### 2.2 Engine hooks (reserved, not filled)

- **Echo System** — Monument Echoes "manifest as ruins with resonant properties"; Relic Echoes "manifest as discoverable items." No current code path populates them because the ruin-node target doesn't exist yet.
- **Unified Rarity Model** — encounter scoring formula includes additive bonuses for `exploration`, `ruins`, and `anomaly`. Values currently stubbed at zero.
- **Encounter Awareness** — hex-distance-based; already supports any node type at any tier. Ruins just need to exist to be discovered.
- **Knowledge Fog of War** — familiarity 0-1 across five levels; Eye reach reveals faster; Shadow reveals traits. Already ready to be applied to ruins.
- **Sublocation System** — lazy-created, three-tier (hex → location → sublocation). Existing subtypes include `archive`, `crypt`, `dungeon`, `forge`, `library`, `prison`. All currently stubs with one-line descriptions.
- **Conflict/Destruction brainstorm** — TB-073 explicitly: *"Ruined city → explorable ruins site, potential monster lair, artifact recovery location"* and *"Ruins become Entropy sphere concentration."* The creation path exists in design; the target node type does not.
- **Attachment System** — `possessions` category with `relics` subcategory + four-tier rarity (Mundane/Storied/Mythic/Legendary). On-use triggers. Reward pools. **Loot is solved; delivery mechanism is not.**
- **HexMapV2** — already renders ruins as Small/Tiny sublocations with ring placement. Visually ready.
- **Generalized Action Targeting** — divine actions *Shatter Artifact*, *Attune to Sphere*, *Curse Object* already exist.

### 2.3 Tonal / thematic substrate

- **Tonal Bible** — "discovery through ruins" is an explicit canonical directive. "Wonder layered over grief." Malazan-style discovery (fragments, contradictions, not textbooks).
- **Thematic Pillars** — Memory vs. Forgetting is already a named pillar. The Cost of Empire / Weight of Deep Time is already a named pillar. Ruins are the primary in-world host for both.
- **Sovereignty vs. Consumption** (canonical reframing) — ruins often contain *bargains* that offer power at the cost of sovereignty. The tonal register is already set.

### 2.4 What is missing

- No `ruin` node type or `locationSubtype: "ruin"` tag
- No "first-cycle" ruin worldgen pass
- No Adventurer faction archetype (closest fits: Academic Institution, Mercenary Company, Hidden Cabal)
- No Explorer / Pathfinder / Scholar-Delver role archetype
- No Foundation-sphere "discovery" mechanic (how elder magic is learned from ruins)
- No stratigraphic / layered-ruin model (per-hex vertical depth)
- No dormancy / awakening model for artifacts in ruins
- No ruin-specific encounter type or encounter grammar
- No "expedition" or "delve" as a distinct agent action
- No Linear project for this work (closest adjacent: Content Architecture, Procedural Hex Vignettes, Thematic Pressure)

---

## 3. The big unresolved questions (answer tomorrow)

In rough priority order. Each is phrased as a choice to force the discussion.

### Q1. Is a ruin a `locationSubtype`, a new `locationType`, or a dedicated `ruin` node category?

- **Option A: Subtype flag on Location.** A ruin is any Location with `locationSubtype: "ruin"` plus a `ruinState` property bag. Cheapest; rides existing infrastructure.
- **Option B: Dedicated `Ruin` node type with explicit schema.** Ruin has its own required properties (origin culture, age tier, decay rate, seal state, stratum count). Heavier but unambiguous.
- **Option C: Ruin is a *property* of other node types.** A Fortress can *become* a Ruin via a `ruinState.ageState` field; the fortress keeps its identity but gains ruin properties. Models the "living → dormant → lost" transition gracefully.
- **My weak lean:** C. It matches the Echo System's cross-cycle framing (a settlement ruins into a Monument Echo) and the conflict brainstorm's "settlement becomes ruins" mechanic, without inventing a new node category. But A is also viable.

### Q2. Where do first-cycle ruins come from?

- **Option A: Worldgen seed pass.** `seedWorld()` gets a new ruins phase that places N ruins per biome using the 8 historical cultures, after region/culture generation.
- **Option B: Generated from within existing Echoes/Relics even in cycle 1.** Fake a shallow history — generate fictional prior Monument Echoes at worldgen to seed the ruins.
- **Option C: Ruins only exist from tick 0 via pre-game catastrophe.** The worldgen tells a story: one cataclysm wiped the old world, ruins are its debris. No mid-game-generated ruins until cycle 2 Echoes fire.
- **My weak lean:** A + C combined — a worldgen phase that seeds ruins framed narratively as debris from a generated pre-game cataclysm (using the 8 dead empires as the debris sources). B feels like a hack.

### Q3. What is the relationship between Foundation spheres (elder magic) and ruins?

- **Option A: One-to-one.** Each ruin is aligned to exactly one Foundation sphere (or Shadow as emergent). Discovering its deepest sublocation grants sphere attunement.
- **Option B: Many-to-one.** Ruins are aligned to *original civilization*, which had affinity to 1-2 Foundation spheres. Several ruins together reveal the sphere's full pattern.
- **Option C: Elder magic ≠ Foundation spheres.** Foundation is cosmological; elder magic is the *lost techniques* cultures developed to channel them. Ruins contain the *techniques* (Runic Inscriber, Warren Walker, Blood-Forged Path), not the spheres themselves.
- **My weak lean:** B + C. Ruins hold *techniques* aligned to Foundation spheres, and a technique fully unlocks only after visiting multiple ruins of the same tradition. This fits "cultural partial knowledge" from the cosmological-symmetry brainstorm.

### Q4. Who explores ruins — is it the Ascendant's bonded agents (Firsts), a new Adventurer agent type, or both?

- **Option A: Firsts and bonded agents do it.** No new actor type. The action card "Delve" appears in the god's action drawer when an agent is near a ruin.
- **Option B: Adventurers are a new agent type.** Scaled-down army/faction templates — a party of 3-6 specialist NPCs with a leader. They respond to contracts.
- **Option C: Adventurers are a faction archetype.** "Adventurer's Guild" as a Mercenary Company + Academic Institution hybrid faction. Individual adventurers are NPC agents sponsored by that faction.
- **Option D: All three.** Firsts can delve personally; adventurer NPCs roam the map and encounter ruins emergently; an Adventurer's Guild faction issues contracts.
- **My weak lean:** D. But we need a clear v1 scope — probably C (the faction) with Firsts able to delve. B (NPC parties as new agent type) is where we'd go in v2 if we want roving archaeologists.

### Q5. Is the ruin a single location, or does it have internal structure (chambers, layers, levels)?

- **Option A: Single sublocation.** A ruin is a single node; encounters happen "at" it. Simplest. Loses the Dungeons-&-Dragons delve fantasy.
- **Option B: Multi-sublocation cluster.** A ruin is a Location containing N sublocations (chambers, crypts, libraries). Uses existing sublocation infrastructure; each chamber has its own encounter pool.
- **Option C: Vertical stratigraphy.** A hex has *age-stacked* layers — current settlement (top), dormant ruin (middle), lost ruin (bottom). Excavation reveals deeper layers across ticks. Strongest Malazan move.
- **Option D: Internal-world pockets (Dragnipur / Interior World).** Some ruins are also gates into full realms (a Warren, an Azath house, a Throne of Shadow). Treated as a hex-external sub-map.
- **My weak lean:** B for v1; C (stratigraphy) and D (pocket worlds) as v2+ expansions. All three can coexist because they're composable.

### Q6. What is the delve encounter grammar — is it a new encounter type, or reuses "explore"?

- **Option A: Reuse `explore`.** The existing `explore` encounter type handles ruins. Just give it ruin-contextual prose and rewards.
- **Option B: New `delve` encounter type.** A multi-step encounter that consumes ticks: entry → peril → chamber → discovery → escape. Sub-encounter stages.
- **Option C: Ruin-specific encounter *pipeline*.** The ruin itself is an encounter-issuer that mints new encounters into its containing hex over time as the ruin is disturbed.
- **My weak lean:** A for v1 plus a `ruin:` tag family that unlocks ruin-specific prose/rewards. B is richer but heavier to author. C is elegant but complicates encounter cache invalidation.

### Q7. What's the loot path — how do artifacts get from ruins into agents' possession?

- **Option A: Reward pool entry.** Ruin encounters reference a reward-pool recipe seeded with the ruin's originating culture's artifacts.
- **Option B: Authored unique artifact per ruin.** Each ruin has a named artifact (or artifact bundle) that is *the* prize; there is no procedural loot pool.
- **Option C: Hybrid — tiered.** Minor ruins have procedural loot pools; Storied+ ruins have named unique artifacts.
- **My weak lean:** C. Matches the unified rarity tiers and the Echo System's Relic Echo concept. Named artifacts create memorable moments; pools handle the long tail.

### Q8. What does an Ascendant's player *do* with a ruin?

- **Option A: Same actions as anywhere.** Nudge/whisper/vision targeted at agents near ruins. Indirect.
- **Option B: Ruin-specific divine actions.** Bless a seal, curse an altar, attune a ruin to a sphere, summon the original culture's memory-spirit to speak through prose.
- **Option C: Mandate surfaces.** Ruins generate mandates (seal/open, preserve/loot, purge/coexist) that the god can accept or reject.
- **My weak lean:** A + C. Ascendants already work through agents; mandate-issuing makes ruins narrative engines. B adds bloat unless the ruin-specific actions are unusually flavorful.

### Q9. Do ruins have agency — are they active or passive?

- **Option A: Passive terrain.** A ruin is a static site. Things happen *to* it, not *through* it.
- **Option B: Reactive — responds to disturbance.** A ruin tracks `disturbance` as a property; past a threshold, it wakes guardians, breaks seals, emits mandates.
- **Option C: Active — a ruin is an actor.** The Azath House model. The ruin has its own decision-making, its own edges to the world, its own encounter generation.
- **My weak lean:** B for most ruins; C only for *specific* ruin archetypes (Living Archive, Living Prison, Convergence Point, Sleeping God's Body). These have "intent" in the archetype text already.

### Q10. What's the v1 scope — where do we draw the MVP line?

- **Option A: Paper ruins only.** Tag Location with `ruin:`, give it themed encounter prose, ship. 1–2 weeks.
- **Option B: First-cycle worldgen pass + basic delve action + themed reward pools.** ~3–4 weeks. Minimum viable feel.
- **Option C: Full MVP with stratigraphy, adventurer guild, elder-magic discovery, and mandate hooks.** 2+ months.
- **My weak lean:** B. Paper ruins are insufficient; full MVP is too much. Ship the kernel, iterate.

---

## 4. Opportunity families

Each family contains 3–5 divergent approaches. These are not mutually exclusive across families — we'll mix and match.

### Family A — What IS a ruin? (node model)

**A1. Ruin-as-subtype** — Location gets `locationSubtype: "ruin"`. Add a `ruinState` property bag: `{ originCultureId, ageTier, integrity, sealState, dominantSphere, disturbance }`. Cheap, backwards-compatible.

**A2. Ruin-as-lifecycle-stage** — Any Location can be `ageState: living | dormant | lost`. `living` = normal settlement/site. `dormant` = half-abandoned (Master Forge, Healing Waters). `lost` = ruin. Transitions are graph operations. This matches the archetype data pattern I pulled from Place Archetypes.

**A3. Ruin-as-node-type** — Introduce `Ruin` as its own node category. Required properties enforced at schema level. Clear but schema-heavy.

**A4. Ruin-as-cluster** — A ruin is a named collection of sublocations sharing a `part_of_ruin` edge. The "ruin" has no node of its own; it's an emergent thing computed by walking edges. Flexible but harder to reference.

**A5. Ruin-as-property-on-sublocation** — Individual sublocations carry `ruin: true` + origin data. A Dungeon sublocation in a Fortress might be a ruin even if the Fortress is still occupied. Supports the "old crypt beneath the living town" motif natively.

### Family B — Where do ruins come from?

**B1. Worldgen seed phase** — `seedWorld()` gets a `seedRuins()` step that places N ruins per region using the 8 historical cultures and terrain biases. Deterministic per seed. Canonical answer.

**B2. Destruction aftermath** — Ruins are *only* created by in-game events (settlement destruction, TB-073). First cycle has few or no ruins; later cycles have more. Narratively pure, mechanically thin for v1.

**B3. Pre-game cataclysm** — Worldgen tells a brief story: "three centuries ago, X happened." Ruins are the debris. Best of both worlds but needs storytelling infrastructure.

**B4. Generated from Echo System** — Even first-cycle, pretend cycle 0 existed and generate Monument Echoes retroactively to seed ruins. Elegant reuse of Echo pipeline.

**B5. Hybrid — seed + aftermath** — Worldgen places a stratum of ancient ruins; in-game events add fresh ones. Gives temporal variety. This is probably the right answer.

### Family C — Elder magic grounding (Foundation sphere → ruin)

**C1. One ruin, one sphere.** Every ruin has a dominant Foundation sphere. Discovering the ruin's deepest chamber grants an attunement stack in that sphere.

**C2. Traditions, not spheres.** Ruins hold *techniques* (Runic Inscriber, Warren Walker, Blood-Forged Path) that are sphere-aligned but not identical to spheres. A scholar learns a technique from ruin studies; the sphere is the raw material, the technique is the craft.

**C3. Fragmentary knowledge.** Each ruin of a given tradition holds 1 "fragment." Collecting N fragments of the same tradition unlocks the full technique. Creates expedition serial plot.

**C4. Sphere-wound model.** Some ruins are "wounded sphere nodes" — a piece of a shattered Foundation sphere embedded in the world. Near them, that sphere is abnormally strong; they produce corrupt sphere effects for other spheres. (Malazan shattered Emurlahn.)

**C5. Attunement is a capability, not an ability.** The ascendant player doesn't gain access to elder magic by discovery — they gain the *ability to bestow* elder magic on their agents. Elder magic is always a divine gift, but only discoverable at ruins.

### Family D — The adventurer layer

**D1. Adventurer's Guild faction.** A single faction archetype with reputation tiers. Commissions expeditions. Internal factions (scholars / mercs / collectors) drive its internal politics.

**D2. Adventurer as agent role.** Individual agents can hold the `role: adventurer` property, which grants a specific action template pool (delve, scout, exhume, translate).

**D3. Adventurer parties as faction-lite.** Small groups of 3-6 agents bound by a temporary contract, tracked as a light-weight agent cluster. Form → expedition → dissolve or recontract.

**D4. No adventurer structure at all.** Any sufficiently curious agent delves. No special faction, no special role. The distinction between "adventurer" and "curious blacksmith" is just which agent happens to visit.

**D5. Multi-faction sponsorship.** There's no single Adventurer's Guild — every faction (Academic, Mercenary, Hidden Cabal) can sponsor expeditions. The "adventurer" label is a transient sponsored-action status, not a permanent identity.

### Family E — Artifact and loot economy

**E1. Named artifacts per ruin.** Each ruin has 0-3 named, hand-authored artifacts. Procedural role: which ruin gets which artifact is seeded at worldgen.

**E2. Tiered reward pools.** Low-tier ruins draw from procedural pools; high-tier ruins have named artifacts. Hybrid.

**E3. Artifacts as dormant seeds.** Artifacts in ruins are *dormant* — they don't grant their effects until they're claimed AND a trigger fires (sphere pressure, ritual, blood-spill). Pairs with the conflict brainstorm's "dormant artifact activates under siege" spotlight.

**E4. Artifact interlocks.** Some artifacts are multi-part (Rod of Seven Parts pattern) and assemble across multiple ruins. Or some artifacts can only be *destroyed* by other specific artifacts (Hand/Eye of Vecna pattern).

**E5. Artifacts as NPC-equivalents.** Named legendary artifacts have their own `intent` property and behave as near-agents — a sword wants its wielder, a crown wants its head. Models the Soul-Bound Weapon archetype.

**E6. Loot economy — what happens after claim.** Adventurers can (a) sell to factions, (b) enshrine at a faction HQ boosting reputation, (c) carry personally, (d) destroy. Each path has different mandate implications.

### Family F — Knowledge as reward

**F1. IPK keyword unlocks.** Ruin discovery grants IPK keywords tied to the originating culture. "The Pale Builders" becomes a known term after visiting their ruins; prose elsewhere starts using it unexplained.

**F2. Lost languages.** Each historical culture has a `language` property. Translating requires scholars + time. Discovery prose is partially garbled until the language is decoded.

**F3. Secret Crafts (Glantri model).** Certain elder techniques only transmit via initiation. A scholar who learns Warren Walker at a ruin can later initiate an apprentice. Killing the last initiate loses the craft forever.

**F4. Lore as graph edges.** Visiting a ruin adds `knows_about: ruinId` edges from the visiting agent. Other agents can then query the graph for "who knows about X" — scholarship becomes a social graph.

**F5. Knowledge thresholds gate access.** A ruin has a `knowledge_required` threshold on deeper chambers — without enough scholarly familiarity, some doors are physically impassable. The Living Archive pattern.

### Family G — Sublocation / internal structure

**G1. Flat ruin.** No internal structure. A ruin is one node. Simplest.

**G2. Chamber-sublocation cluster.** A ruin Location contains N sublocations (entry, guard chamber, library, sanctum). Existing sublocation infrastructure. Good fit for v1.

**G3. Vertical stratigraphy.** A hex has layered ruins at different `ageState` values. Excavation reveals layers. Most Malazan. Strong candidate for v2.

**G4. Internal-world pocket.** Some ruins gate into a pocket realm (Warren, Interior World, Azath garden). Extends the map. Strong candidate for v3.

**G5. Mobile ruin.** A Moon's Spawn — a ruin-location that moves across the hex grid. Very small number of unique instances only. v3+.

### Family H — Wiring into existing systems

This is less about *divergent options* and more about *integration checklist*. Every one of these is a required touchpoint.

- **Encounter scoring** — populate the reserved `ruins` and `anomaly` additive bonuses.
- **Echo System** — Monument Echoes read/write ruin nodes; Relic Echoes read/write artifact nodes. Close the pipeline.
- **Fog of War** — ruins have their own familiarity curve. Eye reach gets bonus familiarity at ruins; Shadow reveals hidden chambers.
- **Action Drawer** — new action card family (`Delve`, `Scout`, `Exhume`, `Translate`) that appears contextually when an agent is at/near a ruin.
- **Mandates** — ruin-generated mandates (seal/open, preserve/loot, purge/coexist). These plug into the existing mandate system as a new mandate source.
- **Doom Clock / Unmaking** — disturbed ruins contribute to Entropy pressure. Awakening a god ticks the clock.
- **Conflict brainstorm (TB-073)** — settlement destruction creates ruins. This is the bridge from war to ruins.
- **Culture Generator** — current cultures layer on top of historical culture territories; ruins are the physical manifestation of the historical layer.
- **Rarity Model** — ruins are classified Mundane/Storied/Mythic/Legendary; affects encounter scoring, divine visibility, artifact tier.
- **Progressive Disclosure** — ruin reveals follow the familiarity tiers (Stranger → Recognised → Intimate → Known → Transparent). First visit: archetype. Deeper: contradictions. Deepest: the elder evil or the true original founder.
- **Tonal Bible** — ruin prose leads with beauty, surfaces grief. Wonder first, compassion later.
- **Sovereignty vs. Consumption** — ruins often offer bargains. Claiming an artifact risks sovereignty. This is the canonical tension applied to delving.
- **Three-pillar check** — Engine (ruin node + worldgen phase + delve action), Content (ruins authored using 8 historical cultures, 20+ archetypes), UI (HexMap signifier + ruin tooltip + delve modal + IPK unlock feed).

---

## 5. Integration map (system-by-system)

Condensed table. Rough effort estimate for v1 (S/M/L).

| System | How ruins plug in | v1 effort |
|--------|-------------------|-----------|
| Graph / node types | `locationSubtype: ruin` + `ruinState` property bag | S |
| Worldgen | New `seedRuins()` phase after culture/region | M |
| Historical Cultures | 8 existing dead empires become ruin originators | S |
| Culture Generator | Current culture + historical culture already layered; ruins are the historical layer's *physical* manifestation | S |
| Echo System | Monument Echoes seed ruins; Relic Echoes seed artifacts inside ruins | M |
| Encounter Scoring | Fill reserved `ruins` + `anomaly` additive bonuses | S |
| Fog of War | Ruin-specific familiarity curve; Eye reach bonus | S |
| Sublocation System | Add `ruin:<archetype>` subtypes (crypt, archive, sanctum, chamber) | S |
| Attachment System | Artifact archetype templates authored as possessions in reward pools | M |
| Action Targeting | New template family: Delve / Scout / Exhume / Translate | M |
| Mandates | Ruin-mandate generator — mints seal/open, preserve/loot pairs | S |
| Doom Clock | Disturbance contributes to Entropy pressure | S |
| Conflict brainstorm | Settlement destruction path creates ruin nodes | M |
| Rarity Model | Ruins are classified and affect scoring | S |
| HexMapV2 | Ruin signifier + click-through | S |
| Action Drawer UI | Contextual Delve / Scout / Exhume cards | M |
| Tooltip / Modal | Ruin archetype card with tier-gated reveals | M |
| IPK / Keywords | Visiting a ruin grants culture-tagged keywords | M |
| Tonal prose | Ruin prose target — 20+ archetype templates to write | L |
| Adventurer faction | New faction archetype (Adventurer's Consortium) | M |
| Elder magic | Technique discovery + transmission | L |
| Stratigraphy | Vertical layer model | L (v2) |
| Pocket realms / Warrens | Internal-world ruins | L (v3) |
| Sentient ruins (Azath) | Ruin-as-actor | L (v3) |
| Mobile ruins (Moon's Spawn) | Movable ruin instances | L (v3) |

---

## 6. Source highlights

The 10 best portable ideas across all research sources, ranked by fit for Threadbearer specifically.

### H1 — The Azath House as sentient-ruin regulator (Malazan)

A ruin that *is itself an agent*, spontaneously manifesting when a dangerous ascendant's power crosses a threshold, binding them into imprisonment. Functions as the world's immune system against power creep. No other fantasy setting has this. If we ever want a diegetic way to cap ascendant power without an invisible dev hand, this is it. Pairs perfectly with the Sovereignty vs. Consumption canonical tension — the Azath is the cosmic pruner.

### H2 — Stratigraphic hexes (Malazan, First Empire / Lether)

Every hex holds N vertical layers. Current settlement on top, dormant ruin in the middle, lost ruin at bottom. Excavation reveals layers over ticks. Turns every hex into an archaeological artifact. Pairs with Mystara's layered cataclysms (Blackmoor under Nithia under Thyatis). If we build stratigraphy, the map develops temporal depth without adding map space.

### H3 — The Lost City / Cynidicea template for procedural ruin generation (Mystara B4)

Ancient culture → N splintered successor factions devoted to fragments of its original patrons → elder evil beneath them all. Produces ruins where delvers pick sides among decayed cultists and the real story is the elder evil they all deny. Reusable for dozens of ruin instances. Directly answers "what happens *inside* a ruin when a delver arrives?"

### H4 — The Radiance / siphoned-sphere dilemma (Mystara Blackmoor)

An elder artifact that drains a cosmic sphere worldwide while empowering its users. Finite. Visible only to the aware. Creates a silent cartel. Classic "good for you, bad for the world." Maps directly onto our 12+1 sphere system — pick which sphere is being drained and the whole world-feel shifts. Fits Sovereignty vs. Consumption.

### H5 — The Nithia pattern: erased by decree (Mystara)

A civilization *deliberately removed from memory* — the Immortals scrub its name from history, and its ruins can't be properly identified unless you possess a specific artifact or sphere attunement. Creates progression through *forgetting*: you gain familiarity not by exposure but by recovering a specific key. Builds an asymmetric discovery mechanic on top of the existing fog system.

### H6 — Finnests: artifacts that mature into ruins (Malazan)

A soul-vessel carried through the world that, under the right conditions, *becomes* a ruin when buried. Artifacts don't stay in inventory — they mature into map features. Powerful graph move: a `Finnest` artifact node has a `becomes_ruin_on` condition edge; when fired, the artifact is converted to a ruin at the location of its holder. Converts item-economy into map-economy.

### H7 — Warrens as walkable spheres (Malazan)

Each Foundation sphere isn't just a fuel source — it's a *realm you can physically enter*. Elder magic begins with the realization that you can open a door to Darkness and step through. Spheres can be *wounded*, producing corrupt effects; fragments of shattered spheres embed in the physical world as hex biomes. Makes sphere-discovery a spatial verb, not just a chargen-analog.

### H8 — The Five Paths of Immortality (Mystara)

Sphere-keyed ascension paths that interlock: to ascend on the Thought path, you must *destroy* a major Entropy artifact. Because artifacts are finite, paths form a zero-sum cosmological economy. For every new Immortal of one sphere, an artifact of another sphere leaves the world. Maps onto our Ascendant system directly. Ruins host the target artifacts.

### H9 — The Deck of Dragons as map-oracle (Malazan)

A living tarot where cards are *gates* to ruins, and drawings physically summon or affect ascendants. The god uses the Deck as a diegetic interface for map-scale interventions. Every card corresponds to an Azath-style ruin. The Deck becomes the god-player's action-selection UI, diegetically justified. A candidate reframing of the Action Drawer.

### H10 — The Wandering Scholar-Monster / Witness-Historian (Malazan Icarium, Duiker)

The lone immortal survivor of a ruin's catastrophe. Wanders the world with amnesia and catastrophic power. A unique NPC archetype: `last-of-kind`, `knows-ruin`, `imprints-on-none`. Plays narratively as the ruin *walking* — the ruin has left its site to grieve across the map. Perfect for a small number of hand-authored unique agents tied to specific ruins.

### Honorable mentions (worth discussing but lower rank for v1)

- The Floating Ruin-City (Moon's Spawn) — mobile ruin. Engine-heavy. v3+.
- The Sleeping God's Body (Burn) — whole region is a dormant deity. v3.
- The Interior World (Dragnipur) — artifact contains a realm. v2/3.
- Otataral / anti-magic ore — ruins with magic-null biomes. Tactical variety. v2.
- Cinnabryl / region-wide curse + material antidote (Mystara Savage Coast) — economic imprisonment dynamic. v2.
- Prosthetic artifacts (Hand / Eye of Vecna) — body-horror activation cost. v2+.

---

## 7. Suggested brainstorm agenda (90 minutes)

Rough flow. We can blow through or linger as needed.

1. **Framing** (5 min) — agree on what the ruins layer is *for*, in one paragraph.
2. **Q1–Q3** (20 min) — answer the three foundational structural questions (node model, origin, elder-magic grounding).
3. **Q4–Q6** (15 min) — agent/adventurer, internal structure, delve grammar.
4. **Q7–Q8** (10 min) — loot economy, divine-player interface.
5. **Q9–Q10** (10 min) — ruin agency, v1 scope.
6. **Top 5 highlight portabilities** (15 min) — which of H1–H10 make the v1 cut, which are explicitly v2/v3, which are rejected.
7. **Linear next step** (5 min) — do we create a "Ruins Layer" project, or split across existing projects? My lean: a new project.
8. **Skills / documentation followup** (5 min) — what skills or wiki pages need updating *before* design starts.
9. **Open bin** (5 min) — anything I didn't surface that you want to add.

---

## 8. Scope / prioritization notes

### v1 (MVP — what should ship first)

Based on my weak-lean answers to Q1–Q10:

- **Ruin as lifecycle stage** on existing Location (A2). `ageState` property with living/dormant/lost. No new node type.
- **Worldgen seed phase** (B1) that places N ruins per region using the 8 historical cultures, framed as pre-game cataclysm debris (B3 narrative).
- **Elder magic = techniques, not spheres** (C3 fragmentary). Visiting N ruins of the same tradition unlocks the full technique.
- **Adventurer's Guild faction** (D1) as a single Mercenary-Company + Academic-Institution hybrid archetype. Individual adventurer NPCs sponsored by the guild. No new agent *type*.
- **Multi-sublocation cluster** (G2) for internal structure. Reuse existing sublocation infrastructure.
- **Reuse `explore` encounter with `ruin:` tag family** (Q6 Option A). No new encounter type yet.
- **Hybrid loot — pools + named artifacts for Storied+** (Q7 Option C).
- **Reactive ruins — disturbance threshold model** (Q9 Option B). Not full agency.
- **v1 bounds wiring:** ruins + adventurers guild + delve action + elder-magic fragment discovery + mandate surfacing + HexMap signifier + IPK unlocks. Skip stratigraphy, pocket realms, mobile ruins, Azath-style sentient ruins, and mobile artifact-Finnest conversion.

### v2 (after v1 ships and we've validated the delve loop)

- Stratigraphy (G3): per-hex vertical layers.
- Internal-world pockets (G4): at least one warren-style ruin.
- Finnest / artifact-matures-into-ruin conversion pipeline (H6).
- Otataral-style anti-magic ruin regions (H-honorable).
- Cinnabryl region-curse/antidote pattern (H-honorable).

### v3 (post-validation)

- Sentient ruins / Azath model (H1).
- Mobile ruins (H-honorable Moon's Spawn).
- Sleeping-god regions (H-honorable).
- Last-of-kind wandering NPCs (H10).

### Hard rejects (don't pursue)

- Ruins as standalone map instances detached from hexes — breaks the graph model.
- Real-time multi-step dungeon crawl encounters — undermines the turn-based, portfolio-driven core loop.
- Number-forward loot (damage values, armor class) — violates the prose-first mandate.

### Linear project shape

Propose: new project **"Ruins, Elder Magic & Adventurers"** (or cleaner name TBD).

Suggested initial issue breakdown:
- THR-XX · Ruin node model + worldgen seed phase (Engine)
- THR-XX · 8 historical cultures → physical ruin placement (Content)
- THR-XX · Ruin Place archetypes authored (Content)
- THR-XX · Delve action + explore-encounter ruin tags (Engine + Content)
- THR-XX · Adventurer's Guild faction archetype (Content + Engine)
- THR-XX · Elder magic technique discovery / transmission (Engine)
- THR-XX · Ruin mandate generator (Engine)
- THR-XX · HexMap ruin signifier + tooltip (UI)
- THR-XX · Action Drawer delve card family (UI)
- THR-XX · IPK keyword grants from ruin visits (Engine + UI)
- THR-XX · Echo System → ruin / Relic pipeline wiring (Engine)
- THR-XX · Encounter scoring ruins/anomaly hooks (Engine)

First dev pick-up: the node model + worldgen phase (THR-XX #1) — everything else depends on that.

---

## Appendix A — Source research documents

The four sub-agents' research outputs are available on request. Rough table of contents:

- **Mystara research (~3000 words):** layered cataclysms, Nithia erasure, Hollow World, Immortal paths, Vecna/Rod/Kas artifact patterns, Radiance, Lost City template, Glantri Secret Crafts, cultural templates.
- **Malazan research (~3000 words):** Azath Houses, Jaghut tower-ruins, T'lan Imass patrols, K'Chain Che'Malle skykeeps, Warrens as walkable spheres, Dragnipur/Finnest/Otataral/Deck, First Empire palimpsest, Bridgeburner sapper pattern, shattering events, continent-scale density variance.
- **Obsidian brainstorm extraction:** inventory of 4 prior brainstorms, open threads, cross-refs.
- **Archetype pack extraction:** 10 archetype files, ruin-relevant inspirations per file, cross-archetype patterns, 20 ranked hooks.

All four documents' full text is preserved in the session transcript.

---

## Appendix B — Terminology to agree on

Before we design, we should pick words and stick to them. Brainstorm-prompt candidates:

- Is "ruin" the right word, or something like "relic site", "remnant", "the Old Places"?
- Is "elder magic" the right framing, or "deep magic", "old craft", "the First Arts"?
- Is "adventurer" the right word for the delver role, or "pathfinder", "delver", "witness", "finder"?
- Is "delve" the right verb, or "excavate", "descend", "scout", "explore"?
- What do we call the 8 dead empires collectively — "the Lost Peoples", "the Elder Civilizations", "the Fallen"?

The word choices will affect every piece of prose that touches this layer — agreeing on vocabulary upfront saves a lot of retrospective renaming.

---

## Closing note

This research ran overnight. I kept my context lean by spawning sub-agents for the heavy lifts (Mystara wiki, Malazan wiki, vault brainstorms, archetype packs), so the synthesis above reflects many more source hours than it reads.

The single strongest signal across all sources: **the ruins layer isn't a new feature — it's the connective tissue between at least six existing systems that are currently idle or incomplete.** The Echo System, the Unified Rarity Model, the Foundation spheres, the 8 historical cultures, the Tonal Bible's discovery mandate, and the Conflict brainstorm's ruin-aftermath path are all in an unresolved state without this layer. Building it is less "add a feature" and more "close six open loops at once."

See you in the morning.
