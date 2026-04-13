# Backlog — RETIRED

> **This file is no longer the source of truth.** All backlog items have been migrated to [Linear (Threadbare team)](https://linear.app/threadbare). Use Linear for all issue tracking, state management, and dependency tracking.
>
> **Migrated:** 2026-04-13. All active items (TB-069 through TB-129) are now THR-6 through THR-38 in Linear. Original TB-XXX IDs are preserved in each Linear issue description.
>
> **Protocol:** See `Docs/plans/2026-04-13-linear-coordination-protocol.md` for the new workflow.
>
> **Historical record:** Completed items remain in `BACKLOG_HISTORY.md` for reference. New completed items are tracked via Linear's "Done" state.
>
> **Next ID (if ever needed for legacy reference):** TB-130

---

## ✅ TB-129 · Definition of Done — Hook Enforcement (2026-04-13) — DONE 2026-04-13

Implemented. Archived to `BACKLOG_HISTORY.md`.

---

## 📋 TB-124 · Procedural Hex Vignettes — Phase 2: Chunked Filler Layer (2026-04-12)

Replace clone-per-tree rendering in the terrain lab with chunked instanced batches using a custom unlit instance shader. Currently the lab clones GLTF scenes for each tree placement (~100 per hex), which won't scale to the full game map.

**Scope:**
- Introduce chunk registry (12×12 hex chunks)
- Implement filler profiles per terrain type (forest trees, mountain rocks, etc.)
- Build chunked InstancedMesh filler batches with per-instance attributes (aVisibilityState, aHoverMix, aSelectionMix)
- Custom unlit shader: sRGB→linear in attributes, blend in shader, SRGBColorSpace output
- Buffer attribute lifecycle: allocate once, update in place, set needsUpdate
- Validate density and readability at scale

**Design doc:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` § Phase 2, § 5 (Rendering Architecture)
**Depends on:** TB-123 (✅)
**Needs design:** No — architecture doc covers this in detail

---

## 📋 TB-125 · Procedural Hex Vignettes — Phase 3: Landmark Batch Layer (2026-04-12)

Convert repeated landmark archetypes (village, city, temple, etc.) from clone-based to chunked instanced landmark batches. Enforce Blender export contracts (max material slots, merge-by-material, bake rotation). Register click targets from slot anchors for production-ready interaction.

**Scope:**
- Chunked instanced landmark batches (same shader as filler, different geometry/material)
- Enforce Blender export limits (≤10 primitives after merge-by-material)
- Click target registration from slot anchors
- Integration with `compositionResolver.ts` slot suppression/priority rules

**Design doc:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` § Phase 3
**Depends on:** TB-124

---

## 📋 TB-126 · Procedural Hex Vignettes — Phase 4: Interaction & UI Validation (2026-04-12)

Add hover/selection feedback to vignette models in the terrain lab. Prove click behavior works on instanced landmarks before game integration.

**Scope:**
- Hover highlight on instanced filler and landmarks (per-instance aHoverMix attribute)
- Selection ring/outline on clicked landmarks (per-instance aSelectionMix)
- Direct click on instanced landmark meshes via raycaster
- Terrain lab selection panel showing clicked landmark details
- Debug toggles for chunk bounds and zone visualization

**Design doc:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` § Phase 4
**Depends on:** TB-125

---

## 📋 TB-127 · Procedural Hex Vignettes — Phase 5: Profiling & Resilience (2026-04-12)

Performance hardening and resilience pass before game integration.

**Scope:**
- WebGL context loss recovery (re-create buffers, re-upload instance data)
- Chunk-priority cap behavior (limit max active chunks based on zoom)
- Shader LOD: reduce fBm octaves (5→3→2) based on camera distance
- Chrome profiling on integrated GPU — target ≤4ms terrain + vignette at 1080p
- Validate on `large` and `epic` map presets (584–805 locations)

**Design doc:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` § Phase 5
**Depends on:** TB-126
**After this:** Phase 6 game integration (only if prototype proves readability, click behavior, draw-call budget, and fog states)

---

## 📋 TB-122 · Strategic Actions — UI/Threads Visibility & HexMap Overlays (2026-04-12)

Phase 8 data expansion is shipped (36 templates across 6 behavior families, hint-driven mutations, 54 tests). The remaining work is making strategic actions **visible to the player** through existing UI surfaces.

**UI/Threads visibility:**
- Strategic action badges in Threads sidebar rows (show active strategic project alongside encounter activity)
- Strategic project progress indicators (multi-tick project % complete, ticks remaining)
- Strategic control indicators (active controls with neglect state)
- Strategic history in agent detail panel (completed strategic actions, intelligence gathered)

**HexMap strategic overlays:**
- Garrison/shrine/estate/workshop sublocations visible as map signifiers at appropriate zoom
- Control territory shading (hex tint for actor-controlled locations)
- Strategic project activity markers (construction-in-progress icon on target hex)

**Touches:** `src/components/Game/ThreadsPanel.tsx`, `src/components/Game/AgentDetailPanel.tsx`, `src/components/HexMapV2/` (signifier + overlay layers)
**Depends on:** Strategic actions Phase 8 data expansion (✅ done)
**Needs design:** Yes — Cowork should draft the thread row layout changes and hex overlay visual language

---

## ✅ TB-121 · CI/CD Pipeline Setup (2026-04-11) — DONE 2026-04-13

Archived to `BACKLOG_HISTORY.md`.

---

## 📋 TB-115 · Culture-Seeded Agent Name Generation (2026-04-06)

Replace the syllable-concatenation placeholder name generator (`generateCandidateName`) with culture-aware name tables. Agent names should draw from the culture seedings of their origin location — each culture produces names with distinct phonetic patterns, syllable structures, and naming conventions. Currently produces awkward names like "DakDraGar". Location and city names shown in dilemma prose (`{agent.location}`) should also draw from the same culture-seeded tables rather than using raw graph node names.

**Touches:** `src/engine/meetingEncounter.ts` (`generateCandidateName`), culture data in world-model, location name generation
**Depends on:** Culture seeding system
**Needs design:** Yes — name table structure, per-culture phoneme pools, gendered/ungendered options, location name conventions per culture

---

## 📐▶ TB-110 · Attention Tier Model — Phase 6 UI (2026-04-06)

**Milestone: Attention & Notification Tiers**

UI integration for the three-tier attention model engine foundation. Thread tug visuals on HexMapV2 (reach-coloured vibrating thread lines, click-to-attend), ambient activity icons (per-reach micro-icons on agent dots), story beat modal (dramatic prose + multi-phase choices), gathering storm indicator (hex glow for queued beats), Read the Threads panel (divine vision digest grouped by reach), attention overload visuals (thread network aesthetic degradation), agent character sheet enhancements (recent activity log, capability growth indicators, new badges, last-viewed tracking), dormant/reactivate divine action templates, thread management panel.

**Depends on:** Attention Tier Engine Foundation (✅ TB-110 prerequisite work shipped 2026-04-06)
**Design:** `Docs/plans/2026-04-05-attention-tier-model-design.md` Sections 3 (thread tugs), 5 (Read the Threads), 6 (ambient icons), 7 (character sheet)

---

## 📋 TB-111 · Curator Metadata Wiring (2026-04-06)

Wire real encounter metadata into curator scoring factors. Currently `isChainStage`, `isFinalChainStage`, `factionThreadCount`, `matchesAmbition` are stubbed. Requires encounter chain tracking, faction thread counting, and ambition-encounter alignment detection.

**Depends on:** Attention Tier Engine Foundation (✅)

---

## 📋 TB-112 · Wound Detection for Mid-Encounter Promotion (2026-04-06)

Add `woundApplied` flag to encounter step outcomes so mid-encounter promotion can precisely detect wounds instead of using `!result.success` as proxy.

**Depends on:** Attention Tier Engine Foundation (✅)

---

## 📋 TB-113 · Siege Template Attention Tier Classification (2026-04-06)

`siege-encounter-content.ts` uses `SiegeSpotlightTemplate`/`SiegeRegionalTemplate` (not `EncounterTemplate`), so `intrinsicTier` wasn't added. Either add the field to siege types or create a mapping layer.

**Depends on:** Attention Tier Engine Foundation (✅)

---

## 🏗️ TB-104 · Procedural Content Component Library Foundation (2026-04-03)

**Milestone: Cross-cutting Content Architecture**

Expand the generic effect system into a reusable procedural content grammar for encounters, items, spells, conditions, talents, bonds, reputations, achievements, and artifacts. Keep the work additive to the existing attachment/spell runtime: new primitives (`test_shaper`, `prevent_loss`, `resource_delta`, `action_trigger`, `choice_set`, `content_grant`), new lifecycle shells (`flip_table`, `clearance_gate`, duplicate-gain policy, `task_progress`, `service`, `support_retainer`), then starter content libraries and governance caps.

**Plan doc:** `Docs/plans/2026-04-03-procedural-content-component-library-foundation-plan.md`  
**Audit:** `Docs/plans/2026-04-03-procedural-content-component-library-audit.md`  
**Creates:** Reusable content primitives and shells that future authoring can recombine instead of relying on one-off item/talent/condition logic.  
**Depends on:** Generic Effect System (✅), Attachment System (✅), Encounter Reward Wiring (✅)

**Implementation status (2026-04-03):** First foundation slice shipped — `test_shaper`, `prevent_loss`, `content_grant`, immediate `service` reward resolution, and proof-pack content/examples.

**Phase 1B (2026-04-13):** ✅ `resource_delta` + `action_trigger` shipped. `choice_set` separated to TB-128.  
**Phase 1B spec:** `Docs/plans/2026-04-13-tb104-phase1b-resource-delta-action-trigger.md`  
**Phase 1B plan:** `Docs/plans/2026-04-13-tb104-phase1b-implementation-plan.md`

**Remaining:** `choice_set` (TB-128), stateful shells (Phase 2), governance caps, broader authoring libraries.

---

## 📋 TB-128 · `choice_set` Content Primitive with Player Choice UI (2026-04-13)

**Milestone: Cross-cutting Content Architecture**

The `choice_set` primitive from TB-104 Phase 1 — a "pick one of N" effect that presents filtered options at resolution/reward time. Requires both the data primitive (type definition, predicate filtering, auto-resolve for AI agents) AND the player-facing choice UI (modal or inline picker for player-controlled agents). Shipping without the UI would leave a half-finished primitive.

**Creates:** `ChoiceSetEffect` type with `ChoiceOption[]`, predicate-filtered option availability, `selectionMode` (player vs agent_auto), player choice modal/UI surface, auto-resolve logic for AI agents, traces, proof-pack content.
**Depends on:** TB-104 Phase 1B (✅ once `resource_delta` + `action_trigger` ship — `choice_set` payloads may include these)

---

## 🎨 TB-105 · Omen Agenda System (2026-04-03)

**Milestone: v1.2 Thematic Pressure & Living World Pass (do first)**

Create a small-number, world-facing pressure system that turns diffuse background tension into legible beats. Agendas should sit above ordinary tick churn and make the world's current fear readable: seasonal omens, cultural omens, sphere-echo omens, and similar pressure tracks that bias events, color prose, and shape what the player expects next. This is the preferred replacement for adding more invisible upkeep rules when the real goal is atmosphere and pressure.

**Creates:** Omen agenda data model, agenda selection/rotation rules, agenda tick-phase or event injection seam, omen beat TickEvents, chronicle/world-pulse surfacing, hooks into doom/culture/sphere systems, design language for when to use agenda pressure instead of raw upkeep.
**Depends on:** Doom Clock system (✅), culture/sphere pressure surfaces (✅)

---

## 🎨 TB-106 · Cool Failure & Complication Outcome Pass (2026-04-03)

**Milestone: v1.2 Thematic Pressure & Living World Pass (do second)**

Audit encounter, intervention, and control outcomes so failure creates pressure instead of dead air. Replace flat negation with costly forward motion: witnesses, scars, rival attention, debt, collateral success, location fallout, broken trust, partial progress, or worsening convergence. This should operationalize the existing Complication Nodes direction as a system rule and content-authoring standard.

**Creates:** Complication taxonomy, outcome authoring rules, resolver hooks for complication-first failure states, encounter/action/control audit checklist, prose hooks for failure consequences, guidance on when to use numeric punishment vs. changed options and story pressure.
**Depends on:** Shared resolution/outcome ladder foundation (✅), encounter and unified action pipelines (✅)

---

## 🎨 TB-107 · Doom Archetype Identity Pass (2026-04-03)

**Milestone: v1.2 Thematic Pressure & Living World Pass (do third)**

Make each Doom Clock feel like a distinct scenario identity instead of a differently named timer. By tick 10-20, the player should feel what kind of world-ending pressure this run is generating through omen language, event composition, rival behavior, location change, social strain, and tonal bias. Two Doom archetypes should not produce mostly the same play with different labels.

**Creates:** Doom identity matrix, per-archetype omen lexicon, biased event pool rules, rival behavior biases, world-state pressure hooks, archetype-specific narrative beats, criteria for "felt identity" during early and mid run.
**Depends on:** TB-105 (Omen Agenda System)

---

## 🎨 TB-108 · Intent & Activity Visibility for the Living World (2026-04-03)

**Milestone: v1.2 Thematic Pressure & Living World Pass (do fourth)**

Surface enough agent momentum that places feel inhabited before the player opens a deep panel. Show what agents are doing, moving toward, conflicted about, or reacting to, and make locations feel busy with visible social and narrative current. This should revive the older intent-visibility direction from archived Notion work, but expand it beyond character sheets into location/world-pulse presentation.

**Creates:** Agent intent/activity summary surfaces, location-level activity presence, world-pulse or chronicle cues for ongoing motion, reaction visibility when interventions bend behavior, knowledge-gated presentation rules, design seam between deep inspectability and anti-spreadsheet immersion.
**Depends on:** Ambition/intention systems (✅), movement and encounter history foundations (✅)

---

## 📋 TB-109 · Encounter Packet Pass for Component-Driven Seeds (2026-04-03)

**Milestone: Cross-cutting Content Architecture / Encounter Quality Pass**

Turn the first TB-104 proof-pack rewards and shells into real production encounter packets that meet `Docs/encounter-building-checklist.md` and the reusable `fws-encounter-builder` standard. Current state: `Duelist's Luck Token`, `Hearthglass Ward`, `Letters of Introduction`, and `Patron's Backing` are live support objects, but they currently appear only in resolution tests and proof-pack content. They still need authored encounters with pressure knots, intervention fantasy, cast, place specificity, five-tier meaning, downstream fallout, and living-world follow-up hooks.

**Creates:** 3-5 authored production encounters built around the new component primitives (`test_shaper`, `prevent_loss`, `content_grant`, `service`), support matrices for each packet, required NPC/faction/location/reputation wiring, and a reusable authoring pattern for future component-first encounter design.
**Encounter targets:** Duel/courtyard pressure encounter for `Duelist's Luck Token`; brink/rescue or survival pressure encounter for `Hearthglass Ward`; audience/patronage/social proof encounter chain for `Letters of Introduction` into `Patron's Backing`.
**Acceptance bar:** Each encounter packet must include a pressure knot, 2-3 meaningful beats, authored five-tier outcome meaning, cool-failure consequences, specific NPC/faction/location support, and explicit follow-on hooks into reputation, obligations, witnesses, or future asks. If a packet still exposes a primitive gap, log it honestly in the migration ledger instead of flattening it into a bland stat check.
**Depends on:** TB-104 first foundation slice (✅), `Docs/encounter-building-checklist.md` (✅), encounter redesign guidelines (✅), encounter migration gap ledger (✅)

---

## 📋 TB-101 · Rarity-Driven Prose Tier Bias (2026-04-01)

**Milestone: Rarity Model — Deferred from Phase D**

Wire `rarityTier` from node properties into the prose tier selection logic so higher-rarity entities receive richer narrative treatment. Mundane → Tier 1, Storied → Tier 1-2, Mythic → Tier 2, Legendary → Tier 3.

**Hook point:** `// PHASE-D-DEFERRED` comment at `src/engine/narrative.ts:316` in `classifyEvent()`.
**Creates:** Rarity-aware prose tier selection in the narrative engine.
**Depends on:** TB-100 (✅)

---

## 📋 TB-102 · Divine Proximity Importance Accumulation (2026-04-01)

**Milestone: Rarity Model — Deferred from Phase D**

Entities near the active ascendant's hex accumulate importance at `IMPORTANCE_DIVINE_PROXIMITY` (1 point) per tick, driving organic rarity graduation for entities the player interacts with spatially. Requires a per-tick spatial scan of entities within N hexes of the ascendant avatar.

**Hook point:** `// PHASE-D-DEFERRED` comment at `src/engine/orchestrator.ts:1461` after Phase 6.6.
**Creates:** New tick-phase scan, `accumulateImportance(node, getImportanceDelta('divine_proximity'))` calls for nearby entities.
**Depends on:** TB-100 (✅)

---

## 📋 TB-103 · Hex Map Rarity Signifiers for Legendary/Mythic Locations (2026-04-01)

**Milestone: Rarity Model — Deferred from Phase D**

Legendary and Mythic locations should have distinct visual overlays on the hex map — a glow, border, or icon treatment that makes them stand out at the world scale. Uses `RARITY_LEGENDARY_PULSE_ANIMATION` from `rarity-constants.ts`.

**Hook point:** `// PHASE-D-DEFERRED` comment at `src/components/HexMapV2/scene/LocationIconMesh.ts:69` on the `LocationNode` interface.
**Creates:** Rarity-aware visual signifiers in HexMapV2 composition layer, reading `rarityTier` from location node properties.
**Depends on:** TB-100 (✅)

---

## 🎨 TB-095 · Social Expansion D: Tavern & Party System (2026-03-31)

**Milestone: v1.2 Social Systems Expansion — Phase D (do first)**

Taverns as social hub sublocations that seed automatically in settlements (hamlet: 1, city: 2-3). Party formation as a multi-step social encounter ("Seeking Companions") where agents assemble groups at taverns. Party group nodes with shared movement, group encounter resolution, and intra-party social dynamics (disputes, trust tests, romance, betrayal, sacrifice). Tavern-exclusive encounters: brawls, rumors, drinking contests, bardic performances, shady deals, recruiting drives. Party dissolution as a social encounter.

**Creates:** Tavern sublocation type, `party` group nodes, `member_of` edges for parties, shared movement logic, 10-12 tavern encounter templates, party lifecycle encounters.
**Design doc:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` → Expansion D
**Depends on:** Nothing (foundational — enables all other social expansions)

---

## 🎨 TB-096 · Social Expansion A: Deep Social Scenes (2026-03-31)

**Milestone: v1.2 Social Systems Expansion — Phase A (do second)**

Replace thin 2-step social encounters with rich 3-5 step social scenes featuring dramatic arcs: opening gambit → reading the room → the pitch → the counter → resolution. Leverage system (0-1 score accumulating across steps from secrets, wealth, bonds, power). Personality-driven target responses based on axiological values. Relationship memory affecting difficulty. Sphere coloring of dialogue prose. ~30-40 new templates: tavern negotiations, political audiences, recruitment pitches, intimidation, romantic pursuit, mentorship, betrayal reveals, war councils, trade fairs, religious debates, spy debriefs, oaths, trials, peace negotiations, gossip, confessions, extortion, eulogies, ceremonies, festivals.

**Creates:** Leverage mechanic, personality-driven counter-arguments, group scene resolution, ~30-40 encounter templates across all reaches.
**Design doc:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` → Expansion A
**Depends on:** TB-095 (Tavern & Party System — taverns as encounter locations)

---

## 🎨 TB-098 · Social Expansion C: Faction Agency (2026-03-31)

**Milestone: v1.2 Social Systems Expansion — Phase C (do fourth)**

Factions become autonomous actors that proactively create quests, build infrastructure, form alliances, and organize events. 10 faction action types: commission quest, build guild hall, establish chapter, declare rivalry, propose alliance, sponsor agent, excommunicate, hold conclave, issue bounty, territorial claim. Faction decision-making personality derived from faction type + current leader's axiological values. Faction wealth/treasury system. Leader personality biases faction actions (cautious merchant guild → defensive; reckless → aggressive expansion).

**Creates:** Expanded `phaseFactionAmbitions`, faction action evaluation, quest commissioning pipeline, guild hall/chapter sublocations, `rivals`/`allied_with`/`sponsors`/`claims` edge types, faction treasury.
**Design doc:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` → Expansion C
**Depends on:** TB-097 (Agent Initiatives — physical construction), TB-096 (Deep Social Scenes — conclaves, alliance negotiations)

---

## 🎨 TB-099 · Social Expansion E: Information Economy (2026-03-31)

**Milestone: v1.2 Social Systems Expansion — Phase E (do fifth)**

Information (rumors, secrets, favors) as game resources flowing through social encounters. Rumors heard at taverns spread via gossip, create temporary encounter awareness, can be true/false/partial, decay over 10-20 ticks. Secrets as leverage enabling extortion encounters and modifying social scene difficulty via `knows_secret_of` edges. Favors as `owes_favor` edges with magnitude — callable during social scenes to reduce difficulty, unpaid favors create tension. Information flow chains: rumor → party formation → expedition → discovery → deal → sponsorship → political power.

**Creates:** `knows_rumor`, `knows_secret_of`, `owes_favor` edge types, rumor propagation mechanic, secret discovery/reveal system, favor tracking, leverage modifier integration into social scenes.
**Design doc:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` → Expansion E
**Depends on:** TB-096 (Deep Social Scenes — leverage mechanic), TB-095 (Tavern & Party System — information exchange venues)

---

## 📋 TB-094 · Faction Encounter Prose Enrichment (2026-03-31)

Replace functional placeholder prose in 10 faction encounter content files (~150 templates) with flavorful, faction-voiced narrative. Each faction should have distinct voice: Thieves Guild (streetwise, sardonic), Holy Order (solemn, righteous), Arcane Circle (scholarly, precise), etc. Cover all step narratives, success/failure outcomes, join/promotion ceremonies, and social encounters. Use `cw-prose-writing` skill for consistency.

**Depends on:** Classical Faction Catalog (done), Encounter Templates (done)

---

## 📋 TB-089 · Reputation-Gated Encounter Content (2026-03-31)

Author encounter templates that require or are blocked by reputation traits. E.g., "Warlord's Tribute" requiring `trait.reputation.iron.positive` level 2, "Assassination Plot" requiring `trait.reputation.iron.negative` level 2, "Court Audience" blocked by `trait.reputation.shadow.negative`. Create 10-20 templates across reaches to make reputation meaningful in gameplay.

**Depends on:** Reputation Trait System (✅)

---

## 📋 TB-090 · Reputation Polarity Tags on Existing Encounters (2026-03-31)

Tag high-value existing encounter templates with explicit `reputationPolarity` for precision. Currently Layer 2 (encounter type heuristic) and Layer 3 (axiological profile) handle all encounters — explicit tags give content authors fine-grained control over which polarity an encounter feeds.

**Depends on:** Reputation Trait System (✅)

---

## 💡 TB-091 · Social Bond Shift from Reputation Reactions (2026-03-31)

Add `computeReputationBondShift()` to `socialEncounterGeneration.ts` — when agent A evaluates agent B for social encounters, B's reputation traits' `reactions` array modifies the bond modifier. A feared warlord gets different social encounters than a beloved healer. Plug into `computeBondModifier()`.

**Depends on:** Reputation Trait System (✅)

---

## 💡 TB-092 · Faction Reputation Aggregation (2026-03-31)

Faction nodes themselves should earn reputation traits based on aggregate member activity. Scan `member_of` edges, tally member reputations, assign faction-level traits. A faction whose members complete many Shadow encounters becomes Shadow-negative "Infamous". Affects faction-level encounters and recruitment.

**Depends on:** Reputation Trait System (✅)

---

## 💡 TB-093 · Reputation Traits in CMS Registry (2026-03-31)

Add reputation trait definitions to the CMS content browser registry so they can be browsed alongside other traits. Show reach, polarity, reactions, scoring modifiers, and encounter gates.

**Depends on:** Reputation Trait System (✅)

---

## 💡 TB-071 · Economy Second Pass — Dynamic System Connections (2026-03-27)

Make the economy dynamic by connecting encounters, factions, locations, and actions into the prosperity/wealth/trade systems. Key opportunities: encounter outcomes generating prosperity shocks, economic context modifying encounter scoring, wealth spending crossover actions (Gold→Iron/Shadow/Heart/Stone), trade route lifecycle driven by agent behavior (bandits, patrols, guild competition), unrest from economic causes (inequality, monopoly), divine economic interventions, and resource consumption creating scarcity pressure.

**Brainstorm:** Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-economy-second-pass.md`
**Depends on:** Gold Reach Phase 1-2 (✅), Faction Vertical Slice (✅), Control Effects (✅), Encounter Reward Wiring (✅)

---

## 💡 TB-069 · Location Non-Agent Characters (NPCs) (2026-03-27)

Locations should be populated with non-agent characters — named or unnamed NPCs that give places a sense of life and population without being full graph-walking agents. Think innkeepers, market vendors, town guards, wandering scholars, shrine keepers. They provide flavor, potential encounter hooks, quest givers, and a sense that the world exists beyond the player's spotlight agents. Design questions: how are NPCs represented (lightweight graph nodes? location properties? a new sublocation feature?), how do they interact with encounters and the action system, can agents have relationships with them, and do they ever "graduate" to full agent status?

**Brainstorm:** Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-location-npcs.md` (link truncated — verify actual filename)
**Depends on:** Nothing specific

---
