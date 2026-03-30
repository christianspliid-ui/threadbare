# Roadmap: Living World Systems

> Supersedes Hex Map V2 roadmap (all 9 phases complete, archived to `.snapshots/`).
> Created 2026-03-27. Three milestones that turn the simulation into a game with cosmic stakes, conflict, and economic depth.

## Milestone Overview

| # | Milestone | Focus | Key Deliverable | Status |
|---|-----------|-------|-----------------|--------|
| M1 | World-Soul Connection | Cosmic metabolism | Player actions shift sphere balance; the world responds systemically | ✅ Complete |
| M2 | Conflict & Destruction | Iron Reach scale-up | Armies, sieges, sacking — visible on map, faction-driven, leader-led | ✅ Core complete |
| M3 | Dynamic Economy | Gold+Stone connections | Economy feeds back through encounters, factions, actions, and player CRUD | 💡 Design needed |

**Guiding principle:** Each milestone makes the world *feel* more alive and gives the player more meaningful choices. Gaps from the journey audit (Gaps A–J) are woven in where they naturally fit rather than treated as separate work items.

---

## M1: World-Soul Connection

**Goal:** Every entity in the world tracks its connection to all 8 creation spheres as integer scores on the triangle number scale. The global World-Soul emerges from the aggregate. Player actions, agent behavior, doom progression, and sustained control effects create sphere pressure that builds up or erodes entity scores. Magic is sphere fluency — no separate magic system. The world resists change through homeostasis, and the player must push hard to overcome its inertia.

**Why first:** Per-entity sphere affinity is the connective tissue between all systems. Without it, entities are interchangeable game pieces. With it, every hex, agent, artifact, and location has a unique sphere character that determines its strengths, vulnerabilities, and magical potential. It provides the infrastructure that armies (M2), economy (M3), doom effects, and magic all plug into.

**Gap coverage:** Addresses Gap D (World-Soul disconnection — the primary target). Partially addresses Gap A (doom injects entropy pressure on affected hexes), Gap J (chain reactions through sphere pressure propagation).

### Phases

#### M1.1 — Sphere Pressure Resolution (Data Model + Engine)
Per-entity sphere affinity data model + pressure resolution:
- `SphereAffinity` type on all entity graph nodes (8 creation spheres × integer score + construction progress)
- Starting scores from terrain type (hexes), archetype (agents), type bias (locations)
- `SpherePressureEvent` accumulator — upstream phases push pressure, `phaseSpherePressure` resolves all at once
- Opposition cancellation, allied defense (50% of ally score), threshold comparison, erosion, cumulative construction
- Triangle number scale creates natural homeostasis — higher levels harder to reach and harder to erode

#### M1.2 — Sphere Balance Effects (Downstream Modifiers)
Per-entity sphere scores feed into existing systems:
- **Prosperity modifier:** Settlement Life/Energy boost prosperity; Entropy erodes it
- **Encounter resonance:** Location sphere alignment modifies encounter scoring
- **Agent decision influence:** Agent's dominant sphere shifts their axiological profile

#### M1.3 — World-Soul UI & Player Visibility
All communicated through prose with IPK (Interactive Prose Keywords), never numbers:
- `WorldSoulIndicator` — prose status line in top bar from aggregate sphere state
- HexChronicle Soul layer — per-hex sphere character in narrative prose
- `ProseKeyword` (IPK) — bold + underline + sphere-colored keywords, tooltippable
- Action preview prose — sphere consequences of pending actions
- Debug panel Sphere State tab (numbers for developers only)

#### M1.4 — Magic as Sphere Fluency
Magic = sphere fluency, not a separate system:
- Power = caster score + location contribution − location opposition
- No cap on location draw — overchannel damages caster permanently (agent choice, never forced)
- Trait design space: Conduit, Glass Cannon, Martyr's Path, Self-Preservation, Sphere Anchor
- Reaches × Spheres: Reach = domain of application, Sphere = power source

#### M1.5 — Global World-Soul Aggregation
Global state derived from entity aggregate, not independently maintained:
- `phaseSphereAggregation` computes global sphere balance from weighted entity scores
- `FundamentState.sphereWeights` populated from aggregate for backward compatibility
- Foundation axes (chaos↔order, light↔darkness) = global-only, derived from aggregate

### Phase 10: Sphere Affinity — Implementation Plans

**Plans:** 9/9 plans complete
**Requirements:** SPHR-01 through SPHR-27

Plans:
- [x] 10-01-PLAN.md — SphereAffinity types, triangle math, entity initialization
- [x] 10-02-PLAN.md — Pressure resolution engine + aggregation + orchestrator wiring
- [x] 10-03-PLAN.md — Upstream wiring (6 phases push sphere pressure events)
- [x] 10-04-PLAN.md — Downstream modifiers (prosperity, encounter, agent decision)
- [x] 10-05-PLAN.md — Magic power calculation + overchannel
- [x] 10-06-PLAN.md — IPK component, WorldSoulIndicator, HexChronicle Soul, debug panel
- [x] 10-07-PLAN.md — Integration smoke test + human visual verification
- [x] 10-08-PLAN.md — Gap closure: HexChronicle Soul layer data bridge (sphereAffinity to sphereInfluence adapter)

**Phase 10 complete (2026-03-28).** Sphere pipeline stable over 30+ ticks. All plans executed including gap closure. Action drawer hover effects deferred by user.

### Phase 11: Agent Character Sheet Overhaul

**Goal:** Overhaul the agent character sheet (AgentProfileModal) from a long-scroll list to a 5-tab layout (Overview, Prowess, Bonds, Journey, Chronicle). Replace scalar familiarity-gated visibility with a multi-faceted knowledge model (AgentKnowledge) where individual data points are revealed through specific narrative interactions. Includes new action cards for deliberate discovery and an interactionDepth accumulator. Backward-compatible with existing familiarity system.
**Plans:** 6/6 plans complete
**Requirements:** TB-070

Plans:
- [x] 11-01-PLAN.md — AgentKnowledge types, revelation hooks, phaseInteractionDepth, traces
- [x] 11-02-PLAN.md — Tabbed AgentProfileModal rewrite with 5-tab layout and facet-gated sections
- [x] 11-03-PLAN.md — Revelation emitters wired to existing phases, debug panel tabs
- [x] 11-04-PLAN.md — Observe/Scry/Whisper Insight/Dream Sending action cards
- [x] 11-05-PLAN.md — Gap closure: DebugPanel wiring, ProwessTab import fix, revelationEmitter type fixes
- [x] 11-06-PLAN.md — Gap closure: phaseInteractionDepth TS2353 fix, agentKnowledge mock in 11 test files

**Phase 11 complete (2026-03-29).** All plans executed including gap closure. Type-check clean.

### Phase 12: Conflict & Destruction — Implementation Plans

**Plans:** 7/7 complete
**Requirements:** TB-073

Plans:
- [x] 12-01-PLAN.md — Mercenary Company + faction ambition system (wave 1)
- [x] 12-02-PLAN.md — Army entity types + army spawning encounters (wave 2)
- [x] 12-03-PLAN.md — Army movement + Quintessence attrition (wave 3)
- [x] 12-04-PLAN.md — Battle resolution + spotlight encounters (wave 4)
- [x] 12-05-PLAN.md — Siege resolution + regional encounters (wave 4)
- [x] 12-06-PLAN.md — Destruction + aftermath consequences (wave 5)
- [x] 12-07-PLAN.md — Army visibility + UI + debug panel (wave 6)

**Phase 12 complete (2026-03-29).** Full M2 conflict engine operational. 102 new tests.

**M1 complete.** All 5 sub-goals delivered across Phases 10-11. Sphere affinity pipeline, pressure resolution, downstream modifiers, magic-as-sphere-fluency, World-Soul UI, agent character sheet overhaul.

---

## M2: Conflict & Destruction — ✅ Core Complete

**Goal:** Scale up Iron Reach from individual encounters into army-scale conflict. Armies are visible on the map, move with leader agents toward factional goals, and produce large-scale storytelling events: sieges, sacking of cities, great battles. Destruction of locations as a real mechanic.

**Gap coverage:** Addresses Gap F (no danger), partially Gap B (rivals become dangerous when they can field armies). Connects to economy (M3): armies cost wealth, sacking destroys infrastructure, war disrupts trade.

**Implementation:** Delivered across Phases 12 (core engine) + 12-Flesh (Quintessence migration) + 13 (gap closure + army visuals).

### Delivered (M2.1–M2.4)

- ✅ **M2.1 — Army Entities & Faction Warfare:** Army as `actor` graph nodes with `ArmyState`, `commanded_by`/`member_of` edges, faction ambition system, mercenary company vertical slice (Phase 12, plans 12-01/12-02)
- ✅ **M2.2 — Battle Resolution:** Momentum-based field battles (log2 size ratio), siege resolution (accelerating pacing, fortification multipliers, starvation), spotlight encounters, Quintessence attrition with threshold encounters (Phase 12, plans 12-03/12-04/12-05)
- ✅ **M2.3 — Destruction & Consequences:** Minor/major/total severity, prosperity loss, settlement downgrade/ruins, sublocation destruction, trade route severance, commander capture/kill (Phase 12, plan 12-06)
- ✅ **M2.4 — Army Visibility & UI:** Army sprites on HexMapV2, battle/siege indicators, Armies debug tab (Phase 12 plan 12-07 + Phase 13 plan 13-04)
- ✅ **M2 Gap Closure (Phase 13):** Aftermath sphere pressure, refugee trace stub, 13 deferred tests, army visual layers verified

### Remaining (M2.5)

#### M2.5 — Monster Encounters Integration
- Fold TB-051 (Monster Encounters) into the conflict layer
- Monsters as wilderness threats: territorial creatures on the map, hostile to armies and agents alike
- Province danger gradient (capital→heartland→borderland→wilderness) drives monster density
- Monster lairs as locations that must be cleared before settlement
- Armies can be sent to clear monster threats (faction quest variant)
- **Status:** 💡 Needs separate brainstorm and design doc

---

## M3: Dynamic Economy

**Goal:** Connect encounters, factions, locations, and player actions into the prosperity/wealth/trade systems so the economy is dynamic and interactive rather than autonomous. Implement Gold+Stone CRUD actions for building economic infrastructure.

**Why third:** With World-Soul providing cosmic context and conflict providing stakes, the economy becomes the *third pillar* — the thing you build and protect. Economy without conflict is boring; conflict without economy has no logistics; both without World-Soul have no cosmic meaning.

**Gap coverage:** Addresses Gap E (economy one-directional). Partially addresses Gap I (NPCs as workforce), Gap J (chain reactions through economic cascading).

### Phase sequence (from brainstorm priority list)

#### M3.1 — Encounter → Economy Feedback
Encounter outcomes generate prosperity shocks. A "Rich Vein" boosts local resources, a "Pirate Raid" damages trade routes, a "Labor Dispute" resolved cruelly tanks prosperity. Low effort, high impact — adds shock entries to existing encounter outcome handlers.

#### M3.2 — Economic Context → Encounter Scoring
Prosperity tiers modify encounter weights. Flourishing settlements favor trade/create/assist encounters. Destitute settlements favor steal/duel/survival encounters. Every settlement *feels* different based on its economic state.

#### M3.3 — Wealth Spending Crossover Actions
Implement the 5 crossover actions from the Gold Reach design: Hire Mercenaries (Gold→Iron, connects to M2 armies), Commission Assassination (Gold→Shadow), Buy Influence (Gold→Heart), Fund Construction (Gold→Stone), Establish Monopoly (Gold→Gold). Makes wealth meaningful — it's spent to cross Reaches.

#### M3.4 — Trade Route Lifecycle
Route threatening from encounters and factions (bandits, patrols, army disruption from M2). Trade routes as living infrastructure that agents and the player must actively maintain and defend.

#### M3.5 — Unrest from Economic Causes
Wealth inequality between co-located factions generates unrest. Monopolies spike unrest. Failed economic encounters push unrest up. Feeds the existing unrest→prosperity feedback loop.

#### M3.6 — Guild Activation
Make economic guilds active participants: choosing trade/tax/expand actions, competing for route control, reacting to prosperity changes. Guilds as visible economic actors, not static bonuses.

#### M3.7 — Gold+Stone Player CRUD Actions
Divine economic actions: Found Market, Open Mine, Consecrate Pastureland, Establish Trade Post, Build Harbor (CREATE); Bless Harvest, Fortify Trade Route, Upgrade Settlement (UPDATE); Survey the Land (READ); Raze Structure, Curse the Land, Sever Trade Route (DESTROY). Player builds and destroys economic infrastructure.

#### M3.8 — Resource Consumption & Scarcity
Resources consumed by trade routes and population. Creates scarcity pressure — the engine for economic drama. Higher effort but drives all other economic dynamics.

---

## Cross-Cutting Concerns (woven into milestones)

These gaps from the journey audit get addressed as part of milestone work, not as standalone items:

| Gap | Where It Lands |
|-----|---------------|
| **A: Doom has no teeth** | Post-M1 (doom injects through World-Soul modifiers) + Post-M2 (doom spawns armies/monsters, triggers sieges) |
| **B: Rivals are inert** | M2 (rivals field armies, declare wars, compete for territory) |
| **C: No onboarding** | After M1-M3 (onboarding makes sense once the game has content to onboard into) |
| **D: World-Soul disconnected** | ✅ M1 complete (Phase 10) |
| **E: Economy one-directional** | M3 (primary target) |
| **F: No danger** | ✅ M2 core complete (Phase 12 + 13) |
| **G: Character sheet** | ✅ Phase 11 complete (TB-070) |
| **H: Culture seeding** | TB-031/032, can land between milestones |
| **I: NPCs** | M3 partial (workforce model), full NPC system later |
| **J: Chain reactions** | TB-017, natural extension after M1 (World-Soul provides the propagation channel) |

---

## Open Design Work Needed

| Area | Design Doc Needed | Status |
|------|------------------|--------|
| M2.5 | Monster Encounters Integration | 💡 Needs brainstorm + design doc (TB-051) |
| M3.1–M3.2 | Economy feedback loops | Brainstormed (TB-071), needs design doc |
| M3.3 | Wealth spending crossovers | Designed in Gold Reach doc, needs implementation plan |
| M3.7 | Gold+Stone CRUD actions | Brainstormed (TB-071 section I), needs design doc |

---

## Post-Milestone Implementation Phases

### Phase 12-Flesh: Flesh Reach Migration to Quintessence — ✅ Complete (2026-03-30)

Removed Flesh reach (9→8 reaches), elevated to Quintessence runtime (0-1.0 entity health), replaced Stone/Eye axiological pairs, retired stoicism_passion, archetype epithet system, 2x4 grid layout. 4/4 plans.

### Phase 13: M2 Gap Closure — ✅ Complete (2026-03-30)

Aftermath sphere pressure, refugee trace stub, 13 deferred tests across battle/siege, HexMapV2 army visual layers (sprites, battle indicators, siege indicators). 4/4 plans, 20/20 must-haves verified.

### Phase 14: Auto-Pause During Encounters — ✅ Complete (2026-03-30)

Game automatically pauses while encounter modals are open. 1/1 plan, 5/5 must-haves verified.

### Phase 15: Encounter Pipeline Fixes — ✅ Complete (2026-03-30)

Score display bug fix, travel cost reduction, wanderlust modifier, encounter retirement (max completions + outgrowth lock), 40 higher-difficulty encounter templates (diff 40-90), forced travel fallback for content desert agents. 4/4 plans, 6/6 must-haves verified.

### Phase 16: Threads Area (Retinue Sidebar Expansion) — Gap Closure

Expanded retinue sidebar to show all thread-connected nodes (agents, armies, factions, artifacts, locations). ThreadsPanel + getThreadedNodes engine query, ThreadDetailView with stub modals, thread-creation action templates for location/faction/army/artifact. 3/3 plans + 1 gap closure.

**Plans:** 4 plans (3 complete + 1 gap closure)
**Requirements:** THRD-01 through THRD-07

Plans:
- [x] 16-01-PLAN.md — Engine getThreadedNodes + ThreadsPanel compact rows
- [x] 16-02-PLAN.md — ThreadDetailView floating detail + stub profile modals
- [x] 16-03-PLAN.md — Thread-creation action templates
- [ ] 16-04-PLAN.md — Gap closure: Escape key handler for ThreadDetailView

### Phase 17: Action Description Fields & Activation Feedback — 📐 Planned

MTG-style ActionCard redesign (art frame + spell name + technical description + flavor text), activation feedback (glow burst + audio + particle burst + consequence toast). 4 plans written across 3 waves. Context gathered, UI-SPEC complete.

### Phase 18: Mercenary Company Runtime Wiring — 📐 Planned

Wire existing mercenary company definition + encounter templates into runtime pipeline: seed 2 opposing companies at distant settlements, encounter cache population, rank-gated filtering, reputation tracking, auto-triggered promotions, 1 army per company. Plans written. Context gathered.