# Roadmap: Living World Systems

> Supersedes Hex Map V2 roadmap (all 9 phases complete, archived to `.snapshots/`).
> Created 2026-03-27. Three milestones that turn the simulation into a game with cosmic stakes, conflict, and economic depth.

## Milestone Overview

| # | Milestone | Focus | Key Deliverable |
|---|-----------|-------|-----------------|
| M1 | World-Soul Connection | Cosmic metabolism | Player actions shift sphere balance; the world responds systemically |
| M2 | Conflict & Destruction | Iron Reach scale-up | Armies, sieges, sacking — visible on map, faction-driven, leader-led |
| M3 | Dynamic Economy | Gold+Stone connections | Economy feeds back through encounters, factions, actions, and player CRUD |

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

**Plans:** 3/8 plans executed
**Requirements:** SPHR-01 through SPHR-27

Plans:
- [ ] 10-01-PLAN.md — SphereAffinity types, triangle math, entity initialization
- [ ] 10-02-PLAN.md — Pressure resolution engine + aggregation + orchestrator wiring
- [ ] 10-03-PLAN.md — Upstream wiring (6 phases push sphere pressure events)
- [ ] 10-04-PLAN.md — Downstream modifiers (prosperity, encounter, agent decision)
- [ ] 10-05-PLAN.md — Magic power calculation + overchannel
- [ ] 10-06-PLAN.md — IPK component, WorldSoulIndicator, HexChronicle Soul, debug panel
- [ ] 10-07-PLAN.md — Integration smoke test + human visual verification

---

## M2: Conflict & Destruction

**Goal:** Scale up Iron Reach from individual encounters into army-scale conflict. Armies are visible on the map, move with leader agents toward factional goals, and produce large-scale storytelling events: sieges, sacking of cities, great battles. Destruction of locations as a real mechanic.

**Why second:** The world needs danger and stakes. Economy without conflict is a spreadsheet. Agents without adversaries are tourists. Armies give factions teeth, give the player something to fear and fight, and make Iron Reach matter the way Gold Reach matters for commerce.

**Gap coverage:** Addresses Gap F (no danger), partially Gap B (rivals become dangerous when they can field armies). Connects to economy (M3): armies cost wealth, sacking destroys infrastructure, war disrupts trade.

### Phases

#### M2.1 — Army Entities & Faction Warfare Design
Full design pass covering:
- **Army as graph entity:** Army node type with properties (size, strength, morale, leader agent, faction allegiance, current goal). Connected to faction via `commanded_by` edge, to location via `located_at`.
- **Army movement:** Armies move on the hex map like agents but slower, following roads, visible at all zoom tiers. Movement uses existing pathfinding but with army-specific cost weights.
- **Faction war goals:** Factions can declare war goals (capture settlement, destroy rival, raid trade route, defend territory). War goals drive army movement decisions.
- **Army composition:** Drawn from faction members + hired mercenaries (connects to Gold Reach crossover: wealth → hire mercenaries → army grows).
- **Supply & morale:** Armies need supply lines (trade routes!) — severed supply degrades morale. Morale affects battle outcomes.

**Needs:** Full design doc with NFP compliance, wiring section, constants tables, trace schemas.

#### M2.2 — Battle Resolution
- **Encounter-scale battles:** Small skirmishes as multi-step encounters (existing encounter system, new templates). Agent capability checks, Iron Reach resolution.
- **Army-scale battles:** When two armies meet at the same hex, trigger a battle event. Resolution based on army strength, morale, leader capability, terrain, and sphere alignment. Multi-step with narrative beats.
- **Sieges:** Army at a settlement triggers siege. Multi-tick encounter with escalating stakes. Defender can sortie, negotiate, or hold. Attacker can assault, starve, or negotiate.
- **Divine intervention in battle:** Player can spend essence to tip battles (bless army, curse enemy, inspire defenders, break siege).

**Needs:** Design doc for battle/siege resolution math, encounter templates, and divine intervention integration.

#### M2.3 — Destruction & Consequences
- **Sacking:** Victorious army at a settlement can sack it. Destroys sublocations, tanks prosperity, spikes unrest, generates massive chronicle event. Displaced population.
- **Location destruction:** Settlements can be reduced (city→town→hamlet→ruins). Ruins become explorable sites (connects to existing ruins layer).
- **Trade route disruption:** Armies on a trade route hex set `threatened: true`. Active warfare severs routes.
- **Refugee generation:** Sacked settlements produce agent migration toward safe locations (connects to economy — refugees boost receiving settlement population).
- **War chronicle:** Major battles generate multi-paragraph chronicle entries. Siege narratives unfold over multiple ticks. The player reads war stories, not stat blocks.

#### M2.4 — Army Visibility & UI
- Army sprites on HexMapV2 (faction-colored, size-indicating, leader portrait)
- Army movement animation (marching along roads)
- Battle indicators on contested hexes
- Siege visual (encirclement indicator around settlement)
- War declaration events in notification system
- Army detail view (strength, morale, leader, goal, supply status)
- Debug panel: army state, war goals, battle log

#### M2.5 — Monster Encounters Integration
- Fold TB-051 (Monster Encounters) into the conflict layer
- Monsters as wilderness threats: territorial creatures on the map, hostile to armies and agents alike
- Province danger gradient (capital→heartland→borderland→wilderness) drives monster density
- Monster lairs as locations that must be cleared before settlement
- Armies can be sent to clear monster threats (faction quest variant)

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
| **D: World-Soul disconnected** | M1 (primary target) |
| **E: Economy one-directional** | M3 (primary target) |
| **F: No danger** | M2 (primary target) |
| **G: Character sheet** | TB-070 already designed, can land between milestones |
| **H: Culture seeding** | TB-031/032, can land between milestones |
| **I: NPCs** | M3 partial (workforce model), full NPC system later |
| **J: Chain reactions** | TB-017, natural extension after M1 (World-Soul provides the propagation channel) |

---

## Open Design Work Needed

| Milestone | Design Doc Needed | Status |
|-----------|------------------|--------|
| M1.1–M1.5 | Universal Sphere Affinity (all phases) | ✅ Design complete — rewritten 2026-03-28 with per-entity architecture (`Docs/plans/2026-03-28-world-soul-connection-design.md`) |
| M2.1 | Army Entities & Faction Warfare | Needs full design |
| M2.2 | Battle Resolution & Sieges | Needs full design |
| M2.3 | Destruction & Consequences | Needs design (partially covered by economy brainstorm) |
| M3.1–M3.2 | Economy feedback loops | Brainstormed (TB-071), needs design doc |
| M3.3 | Wealth spending crossovers | Designed in Gold Reach doc, needs implementation plan |
| M3.7 | Gold+Stone CRUD actions | Brainstormed (TB-071 section I), needs design doc |

---

## Estimated Scope

Not calendar estimates — relative sizing:

| Milestone | Relative Size | Notes |
|-----------|--------------|-------|
| M1 | Medium-Large | New per-entity data model + pressure engine + aggregation + IPK UI + magic/overchannel. Larger scope than original "wire existing engine" estimate. |
| M2 | Large | New entity type, new movement patterns, battle resolution, destruction mechanics, significant UI. Most new-code-intensive milestone. |
| M3 | Medium-Large | Many small connections (M3.1–M3.6) plus the CRUD action expansion (M3.7) and resource system (M3.8). |
