# Faction Vertical Slice — Design Plan

**Date:** 2026-03-27
**Status:** Design complete, ready for implementation
**Depends on:** Encounter system (✅), Social Fabric design (2026-03-18), Guild Seeding (✅), Tier Promotion (✅)
**Brainstorm:** `brainstorm-faction-vertical-slice.md`
**Backlog:** TB-058 (parent), TB-059–TB-062 (phases)

## Problem

Factions exist as graph nodes with membership edges, but they're inert. Agents join factions at world seed (70% chance, random faction) and never interact with them again. The faction awareness pipeline filters encounters by membership, but there are no faction-specific encounters to filter. Tier promotion bumps faction rank, but rank unlocks nothing. The result: factions are invisible decoration on the graph, not a system that drives agent behavior.

## Goal

Build an end-to-end vertical slice using a prototype faction — the **Adventuring Guild** — that proves the full loop: discover → join → do quests → build reputation → get promoted → access higher-tier content. The system must be **data-driven and generalizable** so that procedurally generated factions (merchant guilds, mercenary bands, religious orders) plug into the same machinery.

## Design Principles

1. **Reputation is the single lever.** Everything follows from faction reputation: rank, access, bonuses, expulsion. One number, many consequences.
2. **Factions are jobs, not identities.** Guild membership doesn't change how agents score non-guild encounters. Agents pursue personal goals independently. The guild provides work and rewards; agents stay active if the incentives are good enough.
3. **Decay creates turnover.** Reputation decays without reinforcement. Agents who stop doing guild work gradually lose standing. No explicit kick/expulsion mechanic needed — just the natural consequence of neglect.
4. **Physical presence matters.** Guild halls are sublocations at specific towns. Agents must travel there to join. Geographic gameplay emerges from guild placement.
5. **Quest generation is layered.** Three stacked scoring layers on a shared template pool: (1) faction reach preferences, (2) leader priorities (future), (3) divine patronage (future). The vertical slice implements Layer 1.

---

## Phase 1: Faction Definition & Seeding (TB-059)

### System 1.1: FactionDefinition Schema

A new data type that describes what a faction IS — its structure, encounters, hierarchy, and behavior. This is the generalizable pattern that all factions share.

```typescript
// src/types/faction.ts (NEW FILE)

export interface FactionRankTier {
  id: string;                    // e.g., 'journeyman', 'sergeant', 'lieutenant', 'leader'
  name: string;                  // Display name: "Journeyman", "Sergeant", etc.
  minReputation: number;         // Reputation threshold to hold this rank (0.0–1.0)
  maxSlots: number | null;       // null = unlimited, number = competitive slots
  bonuses: FactionRankBonus[];   // What this rank grants
  encounterAccess: string[];     // Template ID prefixes unlocked at this rank
}

export interface FactionRankBonus {
  type: 'scoring_boost' | 'reputation_walk_bonus' | 'encounter_reward_multiplier';
  value: number;
  description: string;
}

export interface FactionDefinition {
  id: string;                                     // e.g., 'adventuring_guild'
  nameTemplate: string;                           // "The {adj} Adventurers Guild"
  factionType: 'guild' | 'military' | 'religious' | 'political' | 'criminal';
  reachWeights: Partial<Record<ReachDomain, number>>;  // Template pool weighting
  locationTypes: LocationSubtype[];               // Where guild halls can appear
  rankTiers: FactionRankTier[];                   // Ordered lowest → highest
  reputationDecayPerTick: number;                 // How fast reputation fades
  joinEncounterTemplateId: string;                // Which encounter to join
  promotionEncounterTemplateId: string;           // Which encounter for promotion
  questTemplateIds: string[];                     // Available quest templates
  socialTemplateIds: string[];                    // Faction-scoped social templates
  expulsionConsequences: ExpulsionConsequence[];  // What happens at rep=0
}

export interface ExpulsionConsequence {
  type: 'remove_encounters' | 'add_encounter' | 'reputation_penalty' | 'trait_grant';
  params: Record<string, unknown>;
}
```

**Adventuring Guild definition:**

```typescript
export const ADVENTURING_GUILD_DEFINITION: FactionDefinition = {
  id: 'adventuring_guild',
  nameTemplate: 'The Adventurers Guild',
  factionType: 'guild',
  reachWeights: {
    iron: 0.6, eye: 0.8, stone: 0.5, shadow: 0.3,
    heart: 0.2, gold: 0.3, green: 0.4, song: 0.1, tide: 0.2,
  },
  locationTypes: ['town', 'city', 'capital'],
  rankTiers: [
    {
      id: 'journeyman',
      name: 'Journeyman',
      minReputation: 0.0,   // entry level — you start here on joining
      maxSlots: null,
      bonuses: [],
      encounterAccess: ['ag.quest.'],  // basic quests
    },
    {
      id: 'sergeant',
      name: 'Sergeant',
      minReputation: 0.3,
      maxSlots: null,
      bonuses: [
        { type: 'encounter_reward_multiplier', value: 1.15, description: '+15% quest rewards' },
      ],
      encounterAccess: ['ag.quest.', 'ag.senior.'],  // senior quests unlock
    },
    {
      id: 'lieutenant',
      name: 'Lieutenant',
      minReputation: 0.6,
      maxSlots: null,
      bonuses: [
        { type: 'encounter_reward_multiplier', value: 1.30, description: '+30% quest rewards' },
        { type: 'reputation_walk_bonus', value: 0.15, description: '+0.15 trust via guild network' },
      ],
      encounterAccess: ['ag.quest.', 'ag.senior.', 'ag.elite.'],
    },
    {
      id: 'leader',
      name: 'Guild Master',
      minReputation: 0.85,
      maxSlots: 1,     // only one leader per guild instance
      bonuses: [
        { type: 'encounter_reward_multiplier', value: 1.50, description: '+50% quest rewards' },
        { type: 'reputation_walk_bonus', value: 0.25, description: '+0.25 trust via guild network' },
        { type: 'scoring_boost', value: 0.2, description: '+0.2 scoring for all guild encounters' },
      ],
      encounterAccess: ['ag.quest.', 'ag.senior.', 'ag.elite.', 'ag.leadership.'],
    },
  ],
  reputationDecayPerTick: 0.003,   // ~333 ticks from full to zero without activity
  joinEncounterTemplateId: 'ag.join',
  promotionEncounterTemplateId: 'ag.promotion',
  questTemplateIds: [],   // populated in Phase 2
  socialTemplateIds: [],  // populated in Phase 4
  expulsionConsequences: [
    { type: 'remove_encounters', params: {} },  // mild — just lose access
  ],
};
```

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_REPUTATION_DECAY_PER_TICK` | 0.003 | Base decay rate (overridable per faction definition) |
| `FACTION_JOIN_STARTING_REPUTATION` | 0.05 | Reputation on joining (just above zero) |
| `FACTION_QUEST_REPUTATION_GAIN` | 0.04 | Base reputation per completed quest step |
| `FACTION_QUEST_REPUTATION_BONUS_SUCCESS` | 0.08 | Bonus on full quest completion |
| `FACTION_PROMOTION_REPUTATION_BOOST` | 0.05 | Bonus reputation for passing promotion encounter |
| `FACTION_EXPULSION_THRESHOLD` | 0.0 | Reputation at which membership becomes inert |
| `FACTION_GUILD_HALL_COUNT_MIN` | 3 | Minimum guild halls per faction instance |
| `FACTION_GUILD_HALL_COUNT_MAX` | 5 | Maximum guild halls per faction instance |

### System 1.2: member_of Edge Extension

The `member_of` edge gains a `reputation` property alongside the existing `rank` and `role`.

```typescript
// Extension to MemberOfEdgeProperties
interface MemberOfEdgeProperties {
  role: string;           // existing — now derived from rank tier
  rank: number;           // existing — now computed from reputation + tier thresholds
  joinedTick: number;     // existing
  reputation: number;     // NEW — 0.0 to 1.0, the single lever
  factionDefId: string;   // NEW — links to FactionDefinition for lookup
}
```

**Rank is computed, not stored independently.** When reputation changes, rank is recalculated from the faction definition's tier thresholds. If reputation drops below the current tier's `minReputation`, the agent is automatically demoted to the highest tier they qualify for. The `role` field is updated to match the tier's `id`.

### System 1.3: Adventuring Guild Seeding

Extend `worldSeed.ts` (or a new `factionSeeding.ts` module) to:

1. Create one Adventuring Guild faction node per world, with `reachPreferences` derived from the definition's `reachWeights`
2. Place 3–5 "Adventurers Guild Hall" sublocations at qualifying towns/cities (same pattern as guild seeding in `guildSeeding.ts`)
3. Connect the faction to its guild hall locations via `located_at` edges
4. Do NOT pre-assign any agents — they join through encounters during gameplay

**Why separate from existing guild seeding?** The existing `guildSeeding.ts` creates economic guilds (merchants, artisans, miners) with Gold-heavy profiles. The Adventuring Guild is a different faction type — generalist, exploration-focused. It uses the same sublocation pattern but different reach preferences and encounter sets. The seeding function should take a `FactionDefinition` and produce the faction + guild halls generically.

```typescript
// src/engine/factionSeeding.ts (NEW FILE)
export function seedFactionFromDefinition(
  graph: WorldGraph,
  definition: FactionDefinition,
  locationIds: string[],
  rng: () => number,
): { factionId: string; guildHallIds: string[] }
```

**Tracing:**

```typescript
interface FactionSeedTrace {
  tick: 0;
  category: 'faction_seed';
  factionId: string;
  definitionId: string;
  guildHallCount: number;
  locationIds: string[];
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| No qualifying locations for guild halls | Place at any location with a settlement (hamlet+) |
| Zero locations at all | Skip faction creation, log warning |
| FactionDefinition missing fields | Use defaults from constants table |

**PRNG:** Seeded from world seed + faction definition ID hash.

---

## Phase 2: Quest Board & Reputation (TB-060)

### System 2.1: Faction Encounter Templates

New encounter templates for the Adventuring Guild, using standard `EncounterTemplate` shape with a `factionRequired` field extension.

**Template extension:**

```typescript
// Addition to EncounterTemplate (or a wrapper)
interface FactionEncounterMeta {
  factionDefId: string;           // Which faction definition this belongs to
  minRank: string;                // Rank tier ID required ('journeyman', 'sergeant', etc.)
  reputationReward: number;       // Faction reputation gained on completion
  questType: 'standard' | 'senior' | 'elite' | 'leadership';
}
```

**Adventuring Guild Quest Templates (initial set):**

| Template ID | Name | Reach | Type | Min Rank | Location Types | Duration |
|-------------|------|-------|------|----------|----------------|----------|
| `ag.quest.ruin_delve` | Delve into Ruins | eye/iron | explore | journeyman | ruins, cave | 5 ticks |
| `ag.quest.monster_hunt` | Hunt the Beast | iron/stone | duel | journeyman | wilderness, borderland | 4 ticks |
| `ag.quest.wilderness_survey` | Survey the Wilds | eye/green | explore | journeyman | wilderness, forest | 3 ticks |
| `ag.quest.escort_caravan` | Guard the Caravan | iron/heart | assist | journeyman | road, town | 4 ticks |
| `ag.quest.recover_artifact` | Recover Lost Artifact | eye/shadow | acquire | journeyman | ruins, dungeon | 6 ticks |
| `ag.senior.deep_expedition` | Lead Deep Expedition | eye/iron | explore | sergeant | ruins, cave | 8 ticks |
| `ag.senior.bounty_hunt` | Track Dangerous Quarry | shadow/iron | duel | sergeant | any | 6 ticks |
| `ag.senior.map_uncharted` | Map Uncharted Territory | eye/green | create | sergeant | wilderness | 5 ticks |
| `ag.elite.dragon_lair` | Breach the Dragon's Lair | iron/stone | explore | lieutenant | mountain, cave | 10 ticks |
| `ag.elite.lost_city` | Expedition to Lost City | eye/shadow | explore | lieutenant | ruins | 12 ticks |

Each template has 2–4 steps with increasing difficulty, standard reward pools, and `tierPromotionEligible: true` on final steps.

**Quest board as encounter source:**

Quests are NOT location-specific — the Adventuring Guild assigns missions that send agents to remote locations. The quest board works as follows:

1. During `phaseAgentDecision`, after pulling location encounters and social encounters, a new function `generateFactionQuestCandidates()` runs for each agent with active faction membership
2. It reads the agent's `member_of` edges, finds faction definitions, and filters quest templates by rank access
3. Each eligible template is scored with the faction's `reachWeights` as a modifier
4. Candidates enter the normal scoring pipeline alongside location and social encounters
5. The quest's `locationId` targets the nearest qualifying location on the map (the agent must travel there)

```typescript
// src/engine/factionQuestGeneration.ts (NEW FILE)
export function generateFactionQuestCandidates(
  graph: WorldGraph,
  agentId: string,
  encounterCache: EncounterCacheEntry[],
  tick: number,
  rng: () => number,
): EncounterCacheEntry[]
```

### System 2.2: Faction Reputation Tracking

**Reputation gain:** When an agent completes a faction quest encounter step, their `member_of` edge `reputation` increases by `FACTION_QUEST_REPUTATION_GAIN` (0.04). Full quest completion adds `FACTION_QUEST_REPUTATION_BONUS_SUCCESS` (0.08) on top.

**Reputation decay:** New orchestrator phase `phaseFactionReputationDecay` runs after `phaseReputationDecay` (phase 7.1). For every `member_of` edge with `reputation > 0`, subtract the faction definition's `reputationDecayPerTick`. Clamp at 0.

**Rank recalculation:** After any reputation change (gain or decay), recalculate the agent's rank from the faction definition's tier thresholds. If rank changed, update the `role` field on the `member_of` edge.

```typescript
// src/engine/factionReputation.ts (NEW FILE)

export function applyFactionReputationGain(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  amount: number,
  tick: number,
): { newReputation: number; rankChanged: boolean; newRank: string }

export function tickFactionReputationDecay(
  graph: WorldGraph,
  factionDefinitions: Map<string, FactionDefinition>,
  tick: number,
): FactionReputationDecayTrace[]

export function computeRankFromReputation(
  reputation: number,
  definition: FactionDefinition,
): FactionRankTier
```

**Orchestrator integration:** New phase `phaseFactionReputationDecay` at position 7.15 (after `phaseReputationDecay`).

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_REPUTATION_GAIN_PER_STEP` | 0.04 | Reputation per completed quest step |
| `FACTION_REPUTATION_COMPLETION_BONUS` | 0.08 | Extra reputation for completing all steps |
| `FACTION_RANK_CHANGE_COOLDOWN_TICKS` | 5 | Minimum ticks between rank changes (prevents flicker at boundary) |

**Tracing:**

```typescript
interface FactionReputationTrace {
  tick: number;
  category: 'faction_reputation';
  agentId: string;
  factionId: string;
  oldReputation: number;
  newReputation: number;
  cause: 'quest_step' | 'quest_complete' | 'decay' | 'promotion';
  rankChanged: boolean;
  oldRank: string;
  newRank: string;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| member_of edge missing reputation field | Initialize to 0.0 |
| FactionDefinition not found for factionDefId | Skip decay, log warning |
| Reputation below 0 | Clamp to 0, mark membership inert |

**PRNG:** Not needed — reputation changes are deterministic from encounter outcomes.

---

## Phase 3: Join & Promotion Encounters (TB-061)

### System 3.1: Join Encounter

A new encounter template `ag.join` ("Apply to the Adventurers Guild") available at guild hall sublocations. Only visible to agents who are NOT already members.

```
Encounter: Apply to the Adventurers Guild
  id: 'ag.join'
  locationTypes: ['town', 'city', 'capital']
  sublocationTypes: ['guild_hall']
  reachPrimary: heart
  reachSecondary: iron
  encounterType: 'hire'
  threatRating: 'easy'

  Visibility: agents WITHOUT member_of edge to this faction

  Step 1: "Approach the Guild Hall"
    reach: heart, difficulty: 20, duration: 1
    Success: "The guild clerk sizes you up and nods toward the trial grounds."
    Failure: "The guild is not accepting recruits today. Try again later."

  Step 2: "The Initiation Trial"
    reach: iron, difficulty: 25, duration: 2
    Success: Creates member_of edge (reputation: 0.05, rank: 0, role: 'journeyman')
    Failure: "You stumble through the trial. The guild suggests you return when better prepared."
```

**GraphOp on success:** The encounter resolution path must create a `member_of` edge. This requires extending `socialOutcome.ts` (or a new `factionOutcome.ts`) to handle faction join outcomes:

```typescript
// src/engine/factionOutcome.ts (NEW FILE)
export function processFactionJoinOutcome(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  definition: FactionDefinition,
  tick: number,
): void
```

**Key constraint:** The join encounter must be visible ONLY at guild hall sublocations AND only to non-members. This uses the existing `visibleTo` field on encounter cache entries plus a new negative filter (`excludeIfMemberOf`).

### System 3.2: Promotion Encounter

A threshold-triggered encounter that becomes visible when an agent's reputation crosses the next rank tier's threshold.

```
Encounter: Guild Promotion Trial
  id: 'ag.promotion'
  locationTypes: ['town', 'city', 'capital']
  sublocationTypes: ['guild_hall']
  reachPrimary: varies by target rank
  reachSecondary: varies by target rank
  encounterType: 'lead'
  threatRating: 'moderate'

  Visibility: agents whose reputation >= next tier's minReputation
              AND current rank < highest eligible rank

  Step 1: "Summoned Before the Board"
    reach: heart, difficulty: 30, duration: 1
    Success: Proceed to trial.
    Failure: "The board is unimpressed with your bearing. Perhaps next season."

  Step 2: "The Trial of Worth"
    reach: [faction's primary reach], difficulty: 40, duration: 3
    Success: Rank promoted. Reputation boost. Reward (gold, trait).
    Partial failure (roll within 10% of threshold): Promoted but with complication.
      - Complication: trait granted with a downside, or obligation encounter queued
    Full failure: "You fought well, but the standard was not met. Your reputation stands."

  Step 3 (for lieutenant+ only): "The Oath of Office"
    reach: heart, difficulty: 35, duration: 1
    Success: Full rank privileges granted.
    Failure: Promoted to rank but without full bonus access for 20 ticks.
```

**Partial success mechanic:** The encounter resolution already has a probability roll. If the roll fails but is within `PROMOTION_PARTIAL_SUCCESS_MARGIN` (0.10) of the success threshold, it's a partial success — promoted but with a complication trait. The complication is drawn from a small pool per rank tier.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROMOTION_PARTIAL_SUCCESS_MARGIN` | 0.10 | Roll margin for "promoted with complication" |
| `PROMOTION_ENCOUNTER_COOLDOWN` | 30 | Ticks before promotion encounter can reappear after failure |
| `PROMOTION_REWARD_GOLD` | 50 | Gold reward on promotion |

**Tracing:**

```typescript
interface FactionPromotionTrace {
  tick: number;
  category: 'faction_promotion';
  agentId: string;
  factionId: string;
  fromRank: string;
  toRank: string;
  outcome: 'full_success' | 'partial_success' | 'failure';
  complication?: string;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent already at max rank | Hide promotion encounter |
| Promotion encounter fails to update edge | Log error, agent stays at current rank |
| Complication pool empty | Skip complication, grant clean promotion |

---

## Phase 4: Faction Social Encounters & Network (TB-062)

### System 4.1: Faction-Scoped Social Encounters

New social encounter templates only visible between agents who share faction membership. These use the existing social encounter generation pipeline with an additional `sharedFactionRequired: true` filter.

**Templates:**

| Template ID | Name | CRUD | Reach | Min Rank |
|-------------|------|------|-------|----------|
| `ag.social.sparring` | Training Bout | Change | iron | journeyman |
| `ag.social.tavern` | Guild Hall Gathering | Create | heart | journeyman |
| `ag.social.mentorship` | Take an Apprentice | Create | heart/eye | sergeant |
| `ag.social.rivalry` | Challenge for Standing | Destroy | iron/shadow | sergeant |
| `ag.social.guild_politics` | Lobby for Influence | Change | shadow/heart | lieutenant |
| `ag.social.coordinated_mission` | Plan Joint Expedition | Create | eye/heart | lieutenant |

**Integration:** Extend `generateSocialCandidates()` in `socialEncounterGeneration.ts` to check shared faction membership and include faction-specific templates when both agents are members of the same faction.

### System 4.2: Rank Bonus Application

Rank bonuses from `FactionRankTier.bonuses` are applied at the relevant system integration points:

- `encounter_reward_multiplier` → applied in encounter resolution when computing rewards
- `reputation_walk_bonus` → applied in `reputationWalk.ts` when computing faction rank trust bonus (extends existing `FACTION_RANK_TRUST_BONUS`)
- `scoring_boost` → applied in encounter scoring when evaluating faction quest candidates

These are read from the faction definition at the point of use — no new state, just a lookup.

**Tracing:**

```typescript
interface FactionBonusTrace {
  tick: number;
  category: 'faction_bonus';
  agentId: string;
  factionId: string;
  bonusType: string;
  value: number;
  context: string;  // e.g., "encounter_reward for ag.quest.ruin_delve"
  summary: string;
}
```

---

## Phase 5: Faction UI & Visibility (TB-063)

Without UI, the entire faction system runs invisibly. This phase makes faction state visible to both the player and the developer.

### System 5.1: Agent Profile — Faction Section

**Where:** `AgentProfileModal.tsx`, new section between "Bonds" and "Traits". Also a compact display in `AgentDetailPanel.tsx` (sidebar).

**Knowledge-gated (follows existing backstory strata pattern):**

| Influence Tier | What the player sees |
|----------------|---------------------|
| 1 (Touched) | Faction name only. "Member of the Adventurers Guild." |
| 2 (Drawn) | Faction name + rank title ("Sergeant of the Adventurers Guild") |
| 3 (Devoted) | Faction + rank + reputation bar (narrative descriptor, not number) |
| 4+ (Exalted) | Full faction detail: rank, reputation, active quests, rank bonuses |

**Reputation descriptors (narrative, not numeric):**

| Reputation range | Descriptor |
|-----------------|-----------|
| 0.8 to 1.0 | "Legendary standing" |
| 0.6 to 0.8 | "Highly regarded" |
| 0.4 to 0.6 | "Well known" |
| 0.2 to 0.4 | "Establishing a name" |
| 0.05 to 0.2 | "Fresh recruit" |
| 0.0 to 0.05 | "Fading from memory" |

**AgentDetailPanel (compact sidebar):** Replace the existing inline faction tag with a small card showing faction name, rank title, and a thin reputation bar. Clickable to open full profile.

### System 5.2: HexChronicle — Faction Events

**Where:** `HexChronicle.tsx`, new event entries alongside existing encounter/economic events.

New chronicle event types, using the same prose content table pattern:

| Event | Template | Trigger (TickEvent type) |
|-------|----------|-------------------------|
| Faction joined | "{agent} joined the {factionName} as a {rankTitle}." | `faction_joined` |
| Rank change | "{agent} rose to {newRankTitle} within the {factionName}." | `faction_rank_changed` |
| Faction expelled | "{agent} is no longer associated with the {factionName}." | `faction_expelled` |
| Quest completed | "{agent} completed a commission for the {factionName}: {questName}." | `faction_quest_complete` |
| Promotion trial | "{agent} faced the trials of the {factionName}. {outcome}." | `faction_promotion` |

### System 5.3: Notifications — Faction TickEvents

**Where:** `AlertBar.tsx` and `ToastStack.tsx`.

**New alert glyph:** `⚜` (faction events). Color: amber/gold (#D4A574, matches the Threadbare palette).

**Notification tiers:**

| Event | Threaded agent | Non-threaded (awareness) | Outside awareness |
|-------|---------------|--------------------------|-------------------|
| Joined faction | Toast (3s) | Silent chronicle | — |
| Rank promotion | **Alert** (stays until dismissed) | Toast (3s) | Silent chronicle |
| Expulsion | **Alert** | Toast (3s) | Silent chronicle |
| Quest completed | Toast (3s) | Silent chronicle | — |
| Promotion trial (significant) | **Alert** + vignette trigger | Toast (3s) | Silent chronicle |

### System 5.4: Debug Panel — Factions Tab

**Where:** `DebugPanel.tsx`, new tab `factions` (8th tab).

**Contents:**

1. **Faction List** — all factions with: name, type, member count, guild hall locations, reach preferences as colored dots
2. **Per-faction expandable:**
   - Member table: agent name, rank title, reputation (numeric), joined tick, last quest tick
   - Reputation histogram: distribution of member reputations (how healthy is the guild?)
   - Recent traces: faction_reputation, faction_promotion, faction_quest_generation filtered to this faction
3. **Selected agent view** (when agent is followed):
   - All faction memberships with reputation values
   - Current rank bonuses applied
   - Available faction quest candidates this tick
   - Reputation decay rate and projected ticks until next demotion

### System 5.5: Guild Hall Signifier on HexMapV2

**Where:** HexMapV2 signifier layer.

Guild hall sublocations should be visually identifiable on the hex map. A small guild hall icon/signifier at locations that have an Adventurers Guild Hall sublocation. Uses the existing signifier system — just needs a new signifier entry for the guild hall sublocation type.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_ALERT_GLYPH` | '⚜' | AlertBar icon for faction events |
| `FACTION_ALERT_COLOR` | '#D4A574' | Amber/gold, Threadbare palette |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Faction definition not found for member_of edge | Show faction name from node, skip rank/reputation |
| Agent has no faction memberships | Hide faction section entirely |
| Guild hall sublocation has no signifier art | Use default sublocation signifier |

---

## Wiring

### Per new module → integration surface:

| Module | Orchestrator | UI | GameState | Traces | Debug | Prose | Player Control |
|--------|-------------|-----|-----------|--------|-------|-------|----------------|
| `factionSeeding.ts` | Called from `seedWorld()` | — | Faction nodes + guild hall sublocations in graph | `faction_seed` | Faction Inspector tab | — | — |
| `factionQuestGeneration.ts` | Called from `phaseAgentDecision` | Quests appear in encounter lists | Quest cache entries added to candidates | `faction_quest_generation` | Decision Breakdown shows faction quests | Quest prose via `enrichProse()` | — |
| `factionReputation.ts` | New phase 7.15 `phaseFactionReputationDecay` | Rank display in agent profile (future) | `member_of` edge reputation/rank updated | `faction_reputation` | Relationship Graph shows rank | — | — |
| `factionOutcome.ts` | Called from encounter resolution | Join/promote notifications via TickEvent | `member_of` edges created/updated | `faction_promotion` | Social tab shows membership changes | Promotion prose | — |
| Faction social templates | Via `socialEncounterGeneration.ts` | Social encounters in candidate list | Bond/trust updates via existing pipeline | `social_encounter_generation` | Decision Breakdown shows faction social | Social prose | — |
| AgentProfileModal faction section | — | Faction name, rank, reputation in agent profile | Reads `member_of` edges + faction definitions | — | — | Narrative rank/reputation descriptors | — |
| HexChronicle faction events | — | Chronicle entries for join/promote/expel | Reads TickEvents | — | — | Faction event prose templates | — |
| AlertBar faction notifications | — | Alert glyph ⚜ for faction events | Reads TickEvents | — | — | — | Tap-through to agent |
| DebugPanel factions tab | — | Faction list, member table, reputation histogram | Reads graph + faction definitions | All faction traces | Full faction state inspector | — | — |
| Guild hall signifier | — | Guild hall icon on hex map | Reads sublocation types | — | — | — | — |

### New orchestrator phase:

| Position | Phase | Function |
|----------|-------|----------|
| 7.15 | Faction reputation decay | `phaseFactionReputationDecay` |

### New trace categories:

| Category | Emitted from |
|----------|-------------|
| `faction_seed` | `factionSeeding.ts` |
| `faction_quest_generation` | `factionQuestGeneration.ts` |
| `faction_reputation` | `factionReputation.ts` |
| `faction_promotion` | `factionOutcome.ts` |
| `faction_bonus` | Various (encounter resolution, reputation walk, scoring) |

### TickEvent types:

| Event | Trigger |
|-------|---------|
| `faction_joined` | agent completes join encounter |
| `faction_rank_changed` | reputation crosses tier threshold |
| `faction_expelled` | reputation hits 0 |

---

## Implementation Ordering

Each phase is independently testable and deployable. Phase N's output is visible in the running game before Phase N+1 starts.

| Phase | Ticket | What it delivers | Test signal |
|-------|--------|-----------------|-------------|
| 1 | TB-059 | FactionDefinition schema, Adventuring Guild data, guild hall seeding, member_of extension | Guild halls visible on map at towns. Faction node in graph with reachPreferences. |
| 2 | TB-060 | 10 quest templates, quest board generation, reputation tracking, decay phase | Agents travel to guild halls, join, receive quests, build reputation. Reputation decays when idle. Visible in debug traces. |
| 3 | TB-061 | Join encounter (creates member_of), promotion encounter (rank-up with complications), partial success | Agents organically join the guild through gameplay. Promotions fire with narrative tension. Rank changes visible in traces. |
| 4 | TB-062 | 6 faction social templates, rank bonus application, shared-faction social filter | Guild members interact socially. Higher ranks get tangible bonuses. Full loop running. |
| 5 | TB-063 | Agent profile faction section, chronicle events, alert notifications, debug factions tab, guild hall signifier | Player sees faction membership, rank, events. Developer can inspect full faction state. System is visible. |

**Critical path:** Phase 1 → Phase 2 → Phase 3 (join encounter depends on Phase 1 seeding; promotion depends on Phase 2 reputation). Phase 4 can run in parallel with Phase 3. Phase 5 can start after Phase 1 (basic display) and expand as later phases land.

---

## NFP Compliance Summary

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | All thresholds, decay rates, rewards, rank boundaries are named constants in FactionDefinition. Changing guild feel = changing numbers in the definition object. |
| 2 | Inspectability | PASS | 5 new trace categories cover seeding, quest generation, reputation changes, promotions, and bonus application. Every rank change is traced with before/after. |
| 3 | Determinism | PASS | Quest generation uses seeded PRNG. Reputation decay is deterministic. Guild hall placement uses world seed. |
| 4 | Fail-soft | PASS | Missing faction definitions → skip. Missing reputation → initialize to 0. No qualifying locations → fallback placement. Zero guild halls → faction still functions via social recruitment path. |
| 5 | Narrative over mechanical | PASS | Promotion encounters have partial success with complications — not a binary pass/fail. Join encounters have narrative steps, not instant membership. Reputation decay tells a story of neglect. |
| 6 | Additive over destructive | PASS | New `reputation` and `factionDefId` fields on existing `member_of` edges. New encounter templates alongside existing ones. New orchestrator phase slots in without moving existing phases. |
| 7 | Performance budget | PASS | Quest generation per agent: iterate member_of edges (typically 0–2), filter templates (10–15), score candidates. Reputation decay: iterate all member_of edges once per tick. Both well within budget. |
