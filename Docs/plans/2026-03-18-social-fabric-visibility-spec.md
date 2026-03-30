# Social Fabric Visibility — UI Spec

**Date:** 2026-03-18
**Status:** Spec complete, pending implementation
**Depends on:** Social Fabric & Faction Formation (`2026-03-18`), Agent Decision & Encounter Awareness (`2026-03-18`), Encounter Resolution & Divine Intervention (`2026-03-18`)
**Type:** UI/UX specification (not a full engine design doc)

## Purpose

The four design docs produced today (Agent Decision, Resolution/Intervention, Tier Promotion, Social Fabric) define rich behavioral systems with full tracing. This spec defines how that behavior becomes **visible** to both the player and the designer, across two layers:

1. **Player-facing layer** — what the god sees, filtered by divine awareness. Narrative, not mechanical.
2. **Dev inspection layer** — raw data, full traces, debugging tools. For tuning constants and watching the system work.

Both layers read from the same trace and graph data. The player layer filters and narrativizes. The dev layer shows everything.

## Layer 1: Player-Facing UI

### 1.1 Agent Profile — Relationships Section

**Where:** AgentProfileModal, new section between "Prowess" and "Bonds" (or replacing the current minimal bonds display).

**Knowledge-gated (existing pattern from backstory strata):**

| Influence Tier | What the player sees |
|----------------|---------------------|
| 1 (Touched) | Faction membership only (if any). "Member of the Merchant Guild." |
| 2 (Drawn) | Faction + 1-2 strongest bonds with sentiment label |
| 3 (Devoted) | All bonds with trust descriptor + faction rank |
| 4+ (Exalted/Incarnate) | Full relationship map: all bonds, trust levels, interaction history summary, cooperation strategy hint |

**Trust descriptors (narrative, not numeric):**

| Trust range | Descriptor |
|------------|-----------|
| 0.8 to 1.0 | "Sworn ally" |
| 0.5 to 0.8 | "Trusted" |
| 0.2 to 0.5 | "Cautious acquaintance" |
| -0.2 to 0.2 | "Unknown quantity" |
| -0.5 to -0.2 | "Distrusted" |
| -0.8 to -0.5 | "Hostile" |
| -1.0 to -0.8 | "Sworn enemy" |

**Faction display:**
- Faction name + narrative rank title ("Recruit" / "Member" / "Officer" / "Guild Master")
- Faction primary reach shown as a subtle icon or color (gold coin for Gold reach, sword for Iron, etc.)
- If multiple factions: list all with rank

### 1.2 HexChronicle — Social Event Entries

**Where:** HexChronicle event feed, alongside existing encounter/economic/movement events.

**New event types for the chronicle:**

| Event | Template example | Trigger |
|-------|-----------------|---------|
| Bond formed | "{agent1} and {agent2} forged a bond at {location} — {basis}." | New `relates_to` edge created |
| Trust change (major) | "Trust deepened between {agent1} and {agent2} after their cooperation." / "Trust shattered between {agent1} and {agent2} after the betrayal." | Trust crosses a threshold boundary (e.g., 0.5 → 0.6 or 0.3 → -0.1) |
| Faction founded | "The {factionName} was founded at {location} — {memberCount} members united under {leaderName}." | Faction node created |
| Faction joined | "{agent} joined the {factionName} as a {rankTitle}." | New `member_of` edge |
| Faction rank change | "{agent} rose to {newRankTitle} within the {factionName}." | Rank property updated |
| Faction dissolution | "The {factionName} dissolved — {reason}." | Faction node archived |
| Dilemma event | "{agent1} and {agent2} faced a test of trust. {outcome}." | Dilemma resolution |
| Social encounter outcome | "{agent1} {verb} {agent2} at {location}. {result}." | Social encounter completed |

These use the same prose content table pattern as existing chronicle entries. Cultural vocabulary overlays apply. Threadsafe tone rules apply.

### 1.3 Notification System — Social Events

**Where:** AlertBar (existing toast/alert notification system).

**New TickEvent types:**

```typescript
// Additions to TickEvent.type union
| 'faction_founded'
| 'faction_dissolved'
| 'trust_shattered'      // trust crossed below HOSTILE_BOND_THRESHOLD
| 'trust_deepened'        // trust crossed above STRONG_BOND_THRESHOLD
| 'bond_formed'
| 'social_encounter'      // significant social encounter completed
| 'faction_rank_changed'
| 'dilemma_resolved'
```

**Notification tiers:**

| Event | Bonded agent involved | Non-bonded agent (within awareness) | Outside awareness |
|-------|----------------------|-------------------------------------|-------------------|
| Faction founded | **Alert** (prominent, stays until dismissed) | Toast (3s) | Silent chronicle |
| Faction dissolved | **Alert** | Toast | Silent chronicle |
| Trust shattered | **Alert** + possible vignette | Toast | Silent chronicle |
| Trust deepened | Toast | Silent chronicle | — |
| Bond formed | Toast | Silent chronicle | — |
| Dilemma (betrayal) | **Alert** + vignette trigger | Toast | Silent chronicle |
| Dilemma (cooperation) | Toast | Silent chronicle | — |
| Faction rank change | Toast | — | — |
| Social encounter (significant) | **Alert** + vignette trigger | Toast | Silent chronicle |

**Alert format:** Same as existing alerts — icon + short message + tap-through to agent.

```
🤝 The Iron Pact was founded — Kael leads 3 warriors.     [Tap to view]
⚔️ Trust shattered between Mira and the Guild Master.     [Tap to view]
```

**Vignette trigger integration:** Events marked with "vignette trigger" check the `DivineAttention` state on the agent/location. If the player has Attuned/Focused on the agent, the event escalates to a full narrative vignette with intervention options (per Decision 2 in the Resolution doc). Otherwise, it's just a notification.

### 1.4 Map — Faction Presence Indicators

**Where:** HexMap, as an optional overlay layer.

**Implementation:** Subtle, not dominating. Faction presence at a location is shown as a small faction icon or colored dot at the location marker. Not territory borders — factions don't own hexes, they have members at locations.

**Display rules:**
- Only show factions the player is aware of (divine awareness range)
- Locations with 2+ faction members show the faction's associated color
- Faction headquarters (leader's location) gets a slightly larger or brighter indicator
- Toggle-able via a map layer control (same pattern as existing terrain/sphere overlays)

## Layer 2: Dev Inspection Tools

### 2.1 Debug Panel — Social Tab

**Where:** DebugPanel (backtick key), new tab alongside feed/agent-follow/tick.

**Sub-views:**

#### 2.1.1 Relationship Graph

For the currently followed agent (or a selected agent):

- List all `relates_to` edges with raw values:
  ```
  → Mira (trader): trust=0.72, sentiment=0.55, strength=0.8, basis=trade
    Last interaction: tick 45, cooperate/cooperate (mutual_trust)
    Strategy: tit-for-tat
  → Kael (warrior): trust=-0.35, sentiment=-0.2, strength=0.4, basis=rivalry
    Last interaction: tick 38, cooperate/defect (betrayed)
    Strategy: grudger
  ```
- Clickable names to follow that agent
- Color-coded by trust (green/grey/red gradient)

#### 2.1.2 Reputation Walk Inspector

Input: source agent + target agent (from dropdowns or click-to-select).
Output: the full `ReputationWalkTrace` rendered visually:

```
Reputation walk: Agent A → Agent X
  Direct experience: none
  Path found: A → B → C → X (3 hops)
    A→B: trust 0.8
    B→C: trust 0.7
    C→X: trust 0.6
  Raw reputation: 0.8 × 0.7 × 0.6 = 0.336
  Shadow distortion:
    B (shadow=0.3, likes X): +0.045
    C (shadow=0.1, neutral): +0.0
  Heart resistance (A, heart=0.5): reduces distortion by 15%
  Effective distortion: +0.038
  Faction rank bonus: B is rank 0.7 in shared faction: +0.07
  Final perceived reputation: 0.336 + 0.038 + 0.07 = 0.444
```

#### 2.1.3 Decision Breakdown

For the current tick, for a selected agent:

```
Decision breakdown: Mira (tick 52)
  Encounter cache: 847 entries
  After awareness filter: 234 (Iron: 45, Gold: 89, Shadow: 23, ...)
  After visibleTo: 228
  After prerequisites: 201
  After threat gate: 156
  Social encounters generated: 12 (from 4 visible agents)
  After performance cap: 40 (32 location + 8 social)

  Top 5 scored candidates:
  1. [SOCIAL] Negotiate Deal with Kael (market, 2 hexes) — value/tick: 0.82, desire: 1.4, bond: +0.4
  2. [LOCATION] Market Haggle (local) — value/tick: 0.75, desire: 0.9
  3. [SOCIAL] Forge Alliance with Trader Fen (market, 2 hexes) — value/tick: 0.71, desire: 1.1, bond: stranger+curious
  4. [LOCATION] Deep Descent (ruins, 4 hexes) — value/tick: 0.45, desire: 1.3, growth: near tier boundary!
  5. [SOCIAL] Spy on Guild Master (remote, 3 hexes) — value/tick: 0.42, desire: 0.8, bond: -0.35

  Selected: #1 Negotiate Deal with Kael → queuing movement to market
```

#### 2.1.4 Faction Inspector

List all factions:

```
Factions (4 active):
  🏛️ Merchant Guild (Gold 0.8, Heart 0.3)
    Members: 7 | Leader: Master Wen (rank 1.0)
    Locations: Eastern Market, Port Town, Capital
    Founded: tick 12 | Type: guild (seeded)

  ⚔️ The Iron Pact (Iron 0.7, Stone 0.4)
    Members: 3 | Leader: Kael (rank 1.0)
    Locations: Border Fort
    Founded: tick 48 | Type: emergent
```

Clickable to expand: full member list with ranks, reach preferences breakdown, encounter intelligence feed.

### 2.2 Debug Panel — Map Overlays

Toggle-able overlays on the hex map (dev mode only):

| Overlay | What it shows | Visual |
|---------|--------------|--------|
| Bond lines | `relates_to` edges between agents | Lines colored by trust: green (0.5+), grey (neutral), red (negative). Thickness = strength. |
| Decision vectors | Where each agent wants to go and why | Arrow from agent to target location/agent. Color = encounter type (gold=trade, red=combat, blue=social). |
| Awareness radii | Per-reach awareness circles for selected agent | Concentric colored rings: gold ring for Gold awareness, iron ring for Iron awareness, etc. |
| Faction territories | Hexes where faction members are located | Faint color wash per faction. Overlapping presence shows mixed colors. |
| Social density heatmap | Agent count per location | Warm colors at locations with many agents, cool at sparse. |

### 2.3 Constants Tuning Panel

A dedicated section in the debug panel (or a separate overlay) that shows all the social fabric constants and allows live editing:

```
Social Constants:
  STRONG_BOND_THRESHOLD:     [0.6 ] ← editable
  HOSTILE_BOND_THRESHOLD:    [-0.3] ← editable
  COOPERATIVE_BOND_BOOST:    [0.4 ] ← editable
  TRUST_PER_POSITIVE:        [0.03] ← editable
  TRUST_PER_NEGATIVE:        [-0.08] ← editable
  REPUTATION_MAX_HOPS:       [4   ] ← editable
  SHADOW_DISTORTION_FACTOR:  [0.15] ← editable
  ...
  [Reset to defaults] [Export current values]
```

Changes take effect on next tick. This is the "tweak it" part — you watch behavior, adjust a constant, watch again.

## Implementation Priority

| Priority | Component | Why |
|----------|-----------|-----|
| 1 (Critical) | Debug Panel — Decision Breakdown (2.1.3) | Can't tune agent behavior without seeing why they make choices |
| 2 (Critical) | Debug Panel — Relationship Graph (2.1.1) | Can't see social fabric forming without seeing bonds |
| 3 (High) | Notifications — Social TickEvents (1.3) | Player needs to know social events are happening |
| 4 (High) | Debug Panel — Map Overlays: Bond lines + Decision vectors (2.2) | Visual confirmation that movement/social seeking works |
| 5 (Medium) | Chronicle — Social Events (1.2) | Narrative record of social history |
| 6 (Medium) | Agent Profile — Relationships Section (1.1) | Player-facing relationship display |
| 7 (Medium) | Debug Panel — Reputation Walk Inspector (2.1.2) | Tuning reputation propagation |
| 8 (Medium) | Constants Tuning Panel (2.3) | Live constant editing |
| 9 (Low) | Map — Faction Presence (1.4) | Nice to have, not blocking |
| 10 (Low) | Debug Panel — Faction Inspector (2.1.4) | Detailed faction view |
