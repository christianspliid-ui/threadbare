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

**Goal:** The World-Soul is the cosmic metabolism of the world. Player actions, agent behavior, and doom progression shift sphere balance, which ripples into encounter ecology, prosperity, agent behavior, and terrain. The world *reacts* to what happens in it.

**Why first:** The World-Soul is the connective tissue between all other systems. Without it, player actions feel local and isolated — you curse a hex and nothing else notices. With it, every action shifts cosmic balance, creating consequences the player can see and respond to. It also provides the infrastructure that doom effects (Gap A) and economic mandates will eventually plug into.

**Gap coverage:** Partially addresses Gap A (doom effects can inject through World-Soul modifiers), Gap D (World-Soul disconnection — the primary target).

### Phases

#### M1.1 — World-Soul Tick Integration
Wire `worldSoul.ts` into the orchestrator. Each tick:
- Compute current sphere balance from graph state (agent sphere alignments, control effects, divine influence, location sphere properties)
- Drift harmony/entropy based on player actions vs. natural equilibrium
- Emit `world_soul_pulse` trace with full sphere breakdown

**Needs:** Design doc specifying what graph state feeds into sphere balance, drift rate constants, and the computation model.

#### M1.2 — Sphere Balance Effects
World-Soul sphere balance affects downstream systems:
- **Prosperity modifier:** Sphere alignment at a location modifies prosperity target (a Life-dominant world boosts food; an Entropy-dominant world decays infrastructure)
- **Encounter weighting:** Sphere balance shifts which encounter types are more/less common globally (high Force → more combat encounters everywhere; high Spirit → more mystical/social encounters)
- **Agent behavior bias:** Global sphere tilt adds a small modifier to all agents' axiological scoring (high Order world → agents slightly more tradition-leaning)
- **Terrain drift (stretch):** Extreme sphere imbalance slowly shifts terrain types (high Entropy → fertile land degrades; high Life → barren land blooms)

**Needs:** Design doc specifying the modifier injection points, constants, and fail-soft for each downstream system.

#### M1.3 — World-Soul UI & Player Visibility
- World-Soul health indicator in the HUD (complements existing DoomBar, EssencePanel)
- Sphere balance visualization (which spheres are dominant/weak)
- Chronicle entries when sphere balance shifts significantly
- Debug panel tab showing full World-Soul state

#### M1.4 — World-Soul Player Interaction
- Connect existing hex actions (Shift Dominion, Attune Leyline, Anchor the Sphere, etc.) to World-Soul: successful sphere actions should shift global balance, not just local hex state
- New awareness: the player can *feel* the World-Soul's health through prose and visual indicators
- Foundation for doom effects (M-future): doom archetypes will inject through World-Soul modifiers

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
| M1.1–M1.2 | World-Soul Tick Integration & Effects | Needs design |
| M1.3–M1.4 | World-Soul UI & Player Interaction | Needs design |
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
| M1 | Medium | Mostly wiring existing code + modifier injection. World-Soul engine exists. |
| M2 | Large | New entity type, new movement patterns, battle resolution, destruction mechanics, significant UI. Most new-code-intensive milestone. |
| M3 | Medium-Large | Many small connections (M3.1–M3.6) plus the CRUD action expansion (M3.7) and resource system (M3.8). |
