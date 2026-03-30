# PROD-01: Vertical Slice Contract

> Written 2026-03-16. Defines the playable vertical slice — what the player loop is, which systems are in-scope, which are out, and what "done" looks like for the next milestone.

---

## 1. The Player Loop (as built)

The game runs a three-act structure within each **cycle**, plus a meta-layer across cycles.

### Act I — World Shaping

1. **Cosmology Configuration.** Player adjusts eight Creation Sphere weights and a world seed. The hex map regenerates live.
2. **Archetype Selection.** Player picks an ascendant archetype (divine identity) and names their avatar. This sets starting sphere affinity, domain leanings, and narrative tone.

### Act II — The Cycle (core loop)

The tick-based simulation runs. Each tick advances ~13 orchestrator phases. The player's moment-to-moment loop is:

1. **Observe.** Watch agents move, act, and interact on the hex map. Read the NarrativeLog for notable events. Hover/click for progressive disclosure (Stranger → Recognised → Known → Intimate → Transparent).
2. **Navigate.** Pan/zoom the hex map. Click a hex to zoom in (hex detail view → location view). Browse sublocations, encounters, agents at each location. Use breadcrumb to zoom back out.
3. **Scry.** Activate scry mode to reveal hidden agents/events within line-of-sight radius. LOS is modified by terrain and traits.
4. **Intervene.** Spend essence to perform divine interventions on agents (8 types: dream, persuade, deceive, intimidate, inspire, coincidence, omen, afflict/bless). Each intervention takes an agenda (40 templates) that decays over time, shaping agent behavior through value overlays.
5. **Track.** Monitor doom clock (escalating threat), mandate progress (victory condition with 3 stages), rival god actions, and essence reserves.
6. **React.** Agents generate encounters, resolve dilemmas (game theory), form dispositions, pursue ambitions. The player's interventions ripple through these systems — there is no direct control, only influence.

### Act III — Twilight & Harvest

When the doom clock expires, the cycle enters twilight (reduced effectiveness, 5-10 wind-down ticks), then harvest:

1. **Harvest Screen.** Cycle summary with chronicle entries and echo options.
2. **Echo Selection.** Player picks divine echoes — metaprogression seeds that carry forward.
3. **Transition.** World resets for next cycle with echoes applied.

### Meta-Loop

Across cycles, the World-Soul layer (fundament + resonance) evolves. Echoes are the persistent thread. The Great Chronicle accumulates history.

---

## 2. In-Scope Systems (the vertical slice includes these)

Every system below is **built, tested, and wired into the live game**. The vertical slice ships with all of them.

### Engine (simulation)

| System | Status | Key files |
|--------|--------|-----------|
| Graph-native world model | Stable | graph.ts, graphOpExecutor.ts |
| Tick orchestrator (13+ phases) | Stable | orchestrator.ts |
| Seeded PRNG (mulberry32) | Stable | All engine modules |
| Terrain generation (42 types, rivers, lakes, coastlines) | Stable | terrain.ts, coastline.ts, riverGeneration.ts, lakeGeneration.ts |
| World seeding (locations, agents, cultures, factions) | Stable | worldSeed.ts, gameInit.ts |
| Agent lifecycle (birth, death, migration) | Stable | agentLifecycle.ts |
| Agent selection pipeline | Stable | agentSelection.ts |
| Movement (Dijkstra pathfinding, terrain costs, colocation) | Stable | phaseMovement.ts, pathfinding.ts, movementCost.ts |
| CRUD action system (36 templates, 9 reaches) | Stable | unifiedActionPhases.ts, unifiedActionResolution.ts |
| Encounter system (64 templates, 10 types, threat filtering) | Stable | encounter.ts, encounterCandidates.ts |
| Disposition (game theory, 5 strategies, dilemmas, reputation) | Stable | disposition.ts |
| Agent ambition (eligibility→desirability pipeline, 9 condition types) | Stable | ambitionSelection.ts, ambitionLifecycle.ts, ambitionTick.ts |
| Attachment system (possessions, conditions, agreements, triggers, reward pools) | Stable | attachmentTriggers.ts, rewardPool.ts, conditionDecay.ts |
| Sublocation system (divine origins, dissolution, axiological scoring) | Stable | sublocation.ts |
| Graph-native modifiers (edge→node attribute deltas) | Stable | modifiers.ts |
| Intervention effects (8 types, agenda decay curves) | Stable | interventionEffects.ts, ascendantFeedback.ts |
| Visibility / LOS (terrain + trait modifiers, fog of war) | Stable | visibility.ts, scry.ts |
| Familiarity / knowledge fog | Stable | familiarity.ts |
| Doom clock (7 archetypes, escalation stages) | Stable | doomClock.ts |
| Mandate system (9 templates, 3-stage, real condition evaluation) | Stable | mandate.ts |
| Rival gods (generated, behavioral archetypes) | Stable | rival.ts |
| Essence generation & pool management | Stable | influence.ts |
| Domain capability (Nine Reaches) | Stable | domainCapability.ts |
| Culture system (generator, traits, tension, insider beats) | Stable | cultureGenerator.ts, culturalTension.ts |
| Narrative prose (routine + notable tiers, context builder) | Stable | narrative.ts, contextBuilder.ts |
| Prose generator framework (10 resolvers, graph-walking) | Stable | proseComposer.ts, proseResolvers.ts |
| World-Soul (fundament, resonance, twilight, harvest, transition) | Stable | cycleEnd.ts, echo.ts |

### Content

| Package | Count |
|---------|-------|
| Encounter templates | 64 across 10 types × 20 subtypes |
| Action templates (CRUD) | 36 (4 per reach × 9 reaches) |
| Agenda templates | 40 (8 types × 5 each) |
| Agenda consequence templates | 240 |
| Mandate templates | 12 (JSON) |
| Doom archetypes | 7 (JSON) |
| Culture content | 163 entries (1,789 lines) |
| Prose layer content | 8 tables (~413 lines) |
| Archetype content | 19 archetypes (enriched) |
| Starter attachments | 8 possessions + 4 conditions |
| Ambition templates | 14 (10 standard + 4 reactive) |
| Graph nodes / edges | 244 / 371 |

### UI (player-facing)

| Component | What it does |
|-----------|-------------|
| HexMap + HexTile | Hex grid with terrain, fog of war, overlays, d3-zoom/pan |
| CoastlineOverlay + RiverOverlay | Organic terrain features |
| RegionLabels | Region name overlays |
| AgentDots + GhostDots + MovementTrails | Agent positions, scry targets, movement paths |
| AvatarHUD | Player avatar status and position |
| SimulationControls | Play/pause/step/speed |
| HexZoomView + LocationView + HexBreadcrumb | Three-level navigation (world → hex → location) |
| AgentInfoCard + AgentProfileModal | Progressive disclosure agent detail (Tier 2 + 3) |
| ActionDrawer + ActionCard | Bottom drawer intervention cards |
| AgendaPicker | Agenda selection overlay |
| InterventionConfirm | Intervention confirmation popover |
| NarrativeLog | Scrollable event narrative with sphere coloring |
| NarrativeFeed | Floating narrative feed |
| DoomBar | Doom clock progress with stage names |
| MandateTracker | Victory condition progress with milestone display |
| RivalPanel | Rival god status cards |
| EssencePanel | Essence pool display |
| RetinuePanel | Retinue member list |
| ScryOverlay | Scry interface |
| HexChronicle | Hex detail chronicle view |
| HarvestScreen | End-of-cycle summary + echo selection |
| DebugPanel | Trace viewer (5 categories, agent follow, tick inspector) |
| Tooltip system | Linked concept chains with resolver routing |
| AnimateMount | Mount/unmount animations |
| GameErrorBoundary | Themed error recovery |

### Testing

~2,790+ tests across 302+ test files. 975+ data-driven content tests. Headless playtest runner for multi-seed validation.

---

## 3. Out-of-Scope (deferred from vertical slice)

These are **not blockers** for the vertical slice. They are future work.

### Content gaps (thin but functional)

- **Ambition templates** — 14 exist (10 standard + 4 reactive). Reasonable variety but may still cluster in practice. Needs playtesting to confirm coverage.
- **Resources system** — hex/location resources (stone, water, timber, ore) not modeled. Land layer in HexChronicle is incomplete without them.
- **Resource icons** — no visual resource indicators on hexes.
- **Death/destruction prose** — only ~4 death templates. LIFECYCLE_TEMPLATES needs redesign before expansion (CB-DEFERRED-001).
- **Seasonal prose variation** — SEASONAL_VOCABULARY exists but narrative engine doesn't inject it. Temporal system needs design review (CB-DEFERRED-002).

### Systems not yet designed

- **OCEAN personality model** — axiomatic personality traits lack openness/extroversion variance.
- **Cultural morals & laws** — culture descriptions may not include moral/legal frameworks.
- **Agent bonds & agreements (deep)** — graph edges exist but no strategic bond formation AI.
- **Leverage & oaths** — political relationship mechanics not designed.
- **Exploration hook generation** — ruin layer uses hardcoded templates, needs proper system.
- **Soul layer prose enrichment** — cross-sphere interaction prose not designed.

### Infrastructure & tooling

- **STRUCT-01 repo cleanup** — loose screenshots, stale markdown, temp artifacts in repo root.
- **Paper MCP** — visual documentation surface not connected.
- **Frontend UI overview in Paper** — no visual map of all UI surfaces and their prose algorithms.

### Polish & accessibility

- **Animation** — audit scored D. Most transitions are instant.
- **Responsiveness** — audit scored D. No mobile/tablet layout.
- **Onboarding** — audit scored D. No tutorial, no contextual help beyond tooltips.

---

## 4. Vertical Slice Definition

**The vertical slice is: one complete cycle that a player can sit down and play through, experiencing every major system at least once.**

Concretely, the slice demonstrates:

1. **World generation** with visible cosmology influence on terrain and culture.
2. **Archetype selection** that meaningfully shapes starting capabilities.
3. **Map exploration** with fog of war, hex zoom, location detail, and sublocation navigation.
4. **Agent observation** through progressive disclosure — watching strangers become known through proximity and interaction.
5. **Divine intervention** — spending essence to influence agents through 8 intervention types with agenda selection and visible behavioral consequences.
6. **Emergent narrative** — agents pursuing ambitions, resolving encounters, forming dispositions, moving between locations, acting through the CRUD action system.
7. **Strategic tension** — doom clock escalation, rival god pressure, mandate progress tracking.
8. **Cycle completion** — twilight phase, harvest screen, echo selection, transition to next cycle.
9. **Prose quality** — generated descriptions that feel authored, not templated, through the layered prose engine.
10. **Determinism** — same seed produces same world. Debug panel traces causality.

**All ten points are currently functional.** The vertical slice exists.

---

## 5. Next Milestone: Playtest-Ready Polish

The vertical slice works mechanically. The next milestone is making it **feel good to play** — the gap between "systems function" and "I want to keep playing."

### Success criteria

| # | Criterion | Measurable test |
|---|-----------|-----------------|
| P1 | **Ambition variety** | 14 templates exist — verify no two agents in a 50-tick run pursue the same ambition text across 3 seeds. If clustering occurs, add templates or tune scoring. |
| P2 | **Intervention feedback loop** | Player can observe a causal chain: intervene → agent behavior shifts → encounter outcome changes → narrative reflects it. Verifiable in debug trace within 10 ticks of intervention. |
| P3 | **Narrative non-repetition** | 100-tick playtest across 3 seeds shows zero duplicate prose strings in NarrativeLog (excluding structural templates like "Tick N"). |
| P4 | **Pacing** | Doom clock reaches stage 3+ in every 100-tick run. At least 5 encounters resolve. At least 1 mandate stage advances. |
| P5 | **Agent readability** | Every agent visible at Known familiarity shows: name, archetype prose, current ambition, current location, at least one domain capability descriptor. No blank fields. |
| P6 | **Map legibility** | Every hex shows terrain-appropriate color. Region labels visible. Rivers/coastlines render without visual artifacts. Agent dots track actual positions. |
| P7 | **Cycle completion** | Player can complete a full cycle (playing → twilight → harvest → transition) without errors or blank screens. At least 2 echo options presented. |
| P8 | **No dead ends** | If essence reaches 0, player can still observe and wait for regeneration. If all retinue agents die, new ones can be recruited. Doom expiry triggers twilight, not a crash. |
| P9 | **Performance** | 100-tick simulation completes in <2s wall time. UI remains responsive (no visible jank on tick advance). |
| P10 | **First-minute clarity** | Within 60 seconds of entering the playing phase, the player has seen: their avatar on the map, at least one agent acting, at least one narrative event, and their essence pool. No blank panels on load. |

### Candidate tasks (to be triaged after contract is accepted)

These are the likely work items to hit the success criteria above. Prioritize by which criteria they unblock.

| Task | Unblocks |
|------|----------|
| Playtest ambition distribution across 5 seeds; add templates or tune scoring if clustering | P1 |
| Add intervention→outcome trace threading so debug panel shows full causal chain | P2 |
| Audit prose pools for duplicates; expand thinnest pools | P3 |
| Tune doom clock / encounter / mandate pacing constants across 5 seeds | P4 |
| Ensure AgentInfoCard at Known level renders all required fields with fallbacks | P5 |
| Verify hex tile colors against STYLE.md palette; fix any mismatches | P6 |
| End-to-end cycle completion test (automated, 3 seeds) | P7 |
| Add essence regeneration floor; handle empty-retinue state | P8 |
| Profile 100-tick run; fix any hot paths exceeding budget | P9 |
| Ensure gameInit seeds visible agents near avatar; NarrativeLog has initial entry | P10 |

---

## 6. What This Contract Settles

- **The player loop is defined.** No more "what does the player do?" — it's observe/navigate/scry/intervene/track/react within a doom-pressured cycle, with meta-progression through echoes.
- **Scope is locked.** Everything in §2 ships. Everything in §3 is future work. No new systems until the polish criteria in §5 are met.
- **Success is measurable.** Ten criteria, each with a concrete test. The milestone is done when all ten pass.
- **Priority is clear.** Feel > features. The next phase is about making existing systems feel good, not adding new ones.
