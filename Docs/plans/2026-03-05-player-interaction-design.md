# Player Interaction Layer — Design Document

**Date:** 2026-03-05
**Status:** Approved
**Scope:** How the player reads, navigates, and acts on the world

---

## Design Philosophy

The player is a Godling — a nascent divine entity. The interaction model should feel like directing divine attention, not clicking UI buttons. Three principles:

1. **Map-first**: The hex map is always the spatial anchor. The player is a god looking down.
2. **Influence-as-access**: You see what your network sees. Fog of war lifts where you have connections. The retinue list IS your field of vision into the mortal world.
3. **Understand before acting**: The game rewards players who engage with character stories. Observation and action are distinct modes — the Wheel separates them.

---

## Screen Layout

Five persistent zones:

| Zone | Position | Contents |
|------|----------|----------|
| **DoomBar** | Top edge | Doom clock progress (existing) |
| **Divine Identity** | Left sidebar | Ascendant info, sphere alignment, essence pool, stealth exposure, maintenance cost, simulation controls |
| **Hex Map** | Center | The world. Always visible. Wheel appears here on selected nodes. |
| **Retinue Panel** | Right sidebar | Scrollable influence network — agents, locations, artifacts. Each entry shows name, current action, active story beats. Tabs/filters by node type. |
| **Narrative Feed** | Bottom | Layered feed (story/intel toggle) + mandate progress bar above it |

Additionally:
- **The Wheel** — Radial context menu, appears on the map centered on a selected node
- **Strand View** — Large overlay (~70% screen, semi-transparent backdrop) for deep-diving into agents or the Ascendant
- **Popup Notifications** — Brief alerts for significant events (doom escalation, mandate progress, agent detected, champion challenged)

---

## The Retinue Panel (Right Sidebar)

A compact scrollable list of everything the player influences (Tier 1+).

### Entry Types (phased)

- **Agents** (Layer 1): Individuals the player has influence over. Shows: name, title (if Tier 3+), current action one-liner, 1-2 active story beats auto-surfaced by the simulation (strongest motivation, most pressing relationship/goal).
- **Locations** (Layer 4): Holy sites, controlled settlements, places of power. Shows: name, essence generation, contested status, agents present.
- **Artifacts** (Layer 4): Empowered objects. Shows: name, current wielder, enchantment, power level.

### Interactions

- Click entry → map zooms to node's location, node selected, wheel appears
- Click node on map → highlighted in retinue list
- Entries auto-update each tick with current simulation state
- Story beats are auto-surfaced (not player-pinned) — the player is paying essence to maintain these connections, so they deserve full visibility

---

## The Wheel (Radial Action Menu)

Appears on the map centered on a selected node. Context-specific to node type.

### Agent Wheel (10 slots)

| Position | Action | Type | Description |
|----------|--------|------|-------------|
| 12 o'clock | **Scry** | Observation | Dive into agent's mind — opens Strand View |
| ~1:30 | **Dream** | Intervention | Subtle subconscious nudging during sleep. Low cost, low detection. |
| ~2:30 | **Persuade** | Intervention | Add temporary goal alignment. Low-medium detection. |
| ~3:30 | **Deceive** | Intervention | Plant false information. Medium detection. |
| ~5:00 | **Intimidate** | Intervention | Amplify survival instinct / fear. Medium detection. |
| ~6:00 | **Inspire** | Intervention | Boost personality weight, charisma surge. Low detection. |
| ~7:30 | **Coincidence** | Intervention | Alter environmental prerequisites. High cost, high detection. |
| ~8:30 | **Omen** | Intervention | Plant symbolic event. Low-medium detection. |
| ~10:00 | **Afflict/Bless** | Intervention | Apply temporary condition trait. High detection. |
| Center | Agent name + title | Info | Shows who this is |

### Visual Design

- Each slot: sphere-colored glyph/icon + tooltip on hover (name, essence cost in relevant sphere, detection risk percentage)
- Unavailable slots (wrong tier, can't afford, wrong phase): dimmed with lock icon
- Click outside wheel: dismiss
- Wheel has subtle ambient animation (gentle rotation of outer ring, sphere energy particles)

### Context Variants (future)

- **Location Wheel**: Scry (survey), Consecrate, Ward, Summon, Blight, etc.
- **Artifact Wheel**: Scry, Empower, Attune, Corrupt, etc.
- **Ascendant Wheel**: Scry (cosmic view — see below), Meditate (recover essence?), etc.

---

## The Strand View (Agent Deep Dive)

Triggered by choosing Scry on an agent's wheel. A large overlay panel (~70% screen width/height) with semi-transparent backdrop so the map peeks through.

### 6 Strands

Each strand is a focused, narrative-driven lens into one facet of the character. Shows 2-3 active insights pulled from the axiological engine and graph state, plus relevant traits and conditions. The tone is godlike observation — "you peer into their dreams and see..."

| Strand | Source Data | What You Learn |
|--------|------------|----------------|
| **Presence** | Physical state, location, companions, equipment, current action | Their health, who they're with, what they're doing right now, what items they carry. The "zoom in and observe" strand. |
| **Desires** | Survival, Comfort, Pleasure values | Immediate wants, physical needs, material cravings. Vulnerability to Persuade, Intimidate. |
| **Bonds** | Loyalty, Belonging, Love values + relationship edges | Who they love, serve, fear losing. Visualized as a connection web. Vulnerability to Coincidence (arrange meetings), Deceive (strain bonds). |
| **Ambitions** | Power, Achievement, Legacy values | Long-term goals, what they want to become. Vulnerability to Inspire, Reshape. |
| **Beliefs** | Justice, Truth, Faith values + sphere alignment | Moral framework, worldview, divine sensitivity. Vulnerability to Dream, Omen. |
| **Fears** | Shadow side of all value pairs | What haunts them, worst-case scenarios, phobias. Vulnerability to Intimidate, Afflict. |

### Navigation

- Strands presented as tabs, a visual selector, or a metaphorical navigation (threads you follow)
- Each strand view shows: narrative intro text, 2-3 key insights with flavor text, relevant traits as tags, any active conditions
- Close button → return to map with wheel still active on the agent
- The strand visit is read-only — no action buttons inside strands (clean separation of observation and action)

---

## The Ascendant Scry (Cosmic View)

Triggered by selecting the avatar on the map → wheel → Scry. Same overlay format as agent strands but with cosmic-scale content.

### 4 Cosmic Strands

| Strand | What It Shows |
|--------|--------------|
| **The Web** | Your influence network visualized: all agents, locations, artifacts as nodes with threads connecting to you. Titled agents glow brightest. Shows essence flow, maintenance cost per node, who's strongest. Your "pantheon overview" — the Malazan Deck of Dragons view. |
| **The Currents** | Sphere energy flows across the world. See concentrations of sphere energy (heavy Death in a distant city, Force surge near mountains) without knowing why. Fog-of-war applies — you sense patterns, not details. Early warning system and exploration motivation. |
| **The Rivals** | What you know about other gods. Their names, sphere alignments, any of their agents you've identified (with their divine titles). Partial intelligence. Builds over time as your network discovers more. |
| **The Mandate** | Your victory condition as a narrative arc. Current stage (Setup/Escalation/Culmination), conditions met/remaining, narrative framing ("Two kingdoms stand united. The third resists."). |

---

## The Title System

### How Titles Are Earned

When an agent reaches Influence Tier 3 (Champion) or Tier 4 (Aspect), they earn a divine title based on:
1. **Primary Reach affinity** — which of the Nine Reaches they're strongest in
2. **Agent personality/history** — defensive vs aggressive, scholarly vs practical, etc.

### Title Structure

**"The [Role Word] of [God Name]"**

Role words by Reach:

| Reach | Role Words |
|-------|-----------|
| Iron (warfare) | Sword, Shield, Hammer, Fist |
| Gold (trade) | Hand, Purse, Scale, Broker |
| Shadow (stealth) | Whisper, Shade, Dagger, Veil |
| Veil (magic) | Seer, Weaver, Flame, Conduit |
| Heart (social) | Voice, Herald, Emissary, Muse |
| Eye (knowledge) | Oracle, Sage, Lens, Witness |
| Stone (construction) | Mason, Pillar, Architect, Foundation |
| Star (navigation/fate) | Navigator, Prophet, Compass, Beacon |
| Flesh (biology) | Vessel, Bloom, Thorn, Warden |

The specific word is chosen by personality — a defensive warrior gets "Shield," an aggressive one gets "Fist."

### Where Titles Appear

- Retinue Panel (next to agent name)
- Ascendant Scry — Web strand (your pantheon)
- Ascendant Scry — Rivals strand (enemy titled agents)
- Narrative feed (when titled agents act)
- Wheel center (when selecting a titled agent)
- Agent Summary Card

### Rival Titles

Same structure, same Reach-based words — so "The Fist of Korrath" immediately tells you it's a warfare-focused champion of the rival god Korrath.

---

## Narrative Feed (Bottom Panel)

### Dual-Mode Feed

Toggle between two modes:

**Story Mode** (default): Chronicle-style prose. Events wrapped in narrative that fits the world's tone.
- Influenced agents: detailed descriptions ("Kael the Wanderer arrives at the Iron Gate, drawn by rumors of ancient power.")
- Fog-of-war edges: vague hints ("Distant tremors of Force shake the eastern mountains. Something stirs.")
- Color-tinted by sphere, high-significance events visually distinct (larger text, border glow)

**Intel Mode**: Compact strategic ticker, CK3/Stellaris style.
- One-liner per event with icon (sphere + event type) and timestamp
- Grouped/filterable by type: agent actions, rival movements, doom escalation, essence, mandate
- High information density for scanning

### Popup Notifications

Significant events get promoted to brief popup alerts regardless of feed mode:
- Doom stage escalation
- Mandate stage advancement
- Agent detected by mortals or rivals
- Champion challenged or fallen
- New agent eligible for title

Popups appear near the top of the feed or map edge, auto-dismiss after a few seconds, are clickable (zoom to relevant location/agent).

### Mandate Progress Bar

Compact bar above the narrative feed showing:
- Mandate name
- Current stage indicator (Setup / Escalation / Culmination)
- Progress within current stage (visual bar + "2 of 3 conditions met")

---

## Interaction Flows (Summary)

### Flow A: Quick Action (familiar agent)
Retinue Panel → click agent → map zooms → wheel appears → choose intervention → confirm → execute

### Flow B: Deep Dive Then Act
Select agent → wheel → Scry → browse strands → close → wheel still active → choose intervention → confirm → execute

### Flow C: Strategic Overview
Select avatar → wheel → Scry → browse cosmic strands (Web/Currents/Rivals/Mandate) → close → navigate to point of interest

### Flow D: React to Event
Narrative feed shows event → click event → map zooms to location → agent selected → wheel → act or Scry

---

## Implementation Layers

| Layer | Scope | Components |
|-------|-------|-----------|
| **1: Core Interaction** | Agent selection + wheel + scry + strands | RetinuePanel, AgentWheel, StrandView (6 strands), AgentSummaryCard |
| **2: Strategic Layer** | Ascendant scry + titles + mandate | AscendantScry (4 cosmic strands), TitleSystem, MandateProgressBar |
| **3: Feed Upgrade** | Dual-mode feed + popups | NarrativeFeed v2 (story/intel toggle), PopupNotifications, clickable events |
| **4: Node Expansion** | Locations + artifacts in retinue | LocationWheel, ArtifactWheel, location/artifact retinue entries, fog of war visualization |

---

## Open Questions (for future sessions)

- Exact visual design of the wheel (glyph set, animation style, sizing)
- Strand view internal layout and transitions between strands
- How much the narrative engine needs to improve for Story Mode feed quality
- Fog of war visualization on the hex map (gradients? darkness? sphere-colored mist?)
- Avatar movement and interaction (does the player direct the avatar's movement?)
- Sound design for wheel actions, strand transitions, popup alerts
