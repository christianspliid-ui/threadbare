# Faction Agency — Implementation Plan

> **Date:** 2026-04-14
> **Status:** Implementation Planning
> **Issue:** THR-29
> **Depends on:** THR-51 (Agent Initiatives — faction founding), THR-28 (Deep Social Scenes — conclaves)
> **Blocks:** THR-30 (Secrets & Favors — faction secrets, espionage)

---

## Problem

Factions exist as a mature infrastructure — 11 defined types, rank tiers, reputation system, guild halls, encounter templates, inter-faction dispositions, ambitions, army spawning — but they don't *act*. The Adventuring Guild has 13 quest templates, a rank ladder, and guild halls in three cities, yet it never commissions a quest, recruits a promising agent, or responds to a rival faction's expansion.

`phaseFactionAmbitions` selects ambitions (territorial_expansion, resource_acquisition, etc.) but the only behavior those ambitions drive is army spawning for military ambitions. Non-military ambitions have no execution path. A Merchant Consortium with a `resource_acquisition` ambition does... nothing.

The result: factions are scenery. They provide structure for agent encounters but have no narrative agency of their own. The chronicle never reads "The Arcane Circle commissioned an expedition to the Sunken Library" or "The Merchant Consortium declared rivalry with the Thieves Guild."

## Solution

**Faction Actions** — a behavior loop where factions evaluate their ambition, assess their situation (wealth, membership, territorial control, inter-faction sentiment), and select an action to execute. Actions produce world changes through the existing encounter pipeline and graph operations.

10 action types, split into two tiers:

**Tier 1 — Core (implement in v1):** 7 actions with highest narrative yield
| Action | Ambition Fit | Output | Narrative Feel |
|--------|-------------|--------|----------------|
| Commission Quest | resource_acquisition, territorial_expansion | Quest encounter injected into member candidate pools | "A notice appears on the guild board" |
| Declare Rivalry | revenge, territorial_expansion | `rivals` edge between factions + conflict encounters | "Banners torn down, merchants turned away" |
| Propose Alliance | defensive_consolidation, cultural_dominance | `allied_with` edge + shared encounter visibility | "A hand extended across a crowded hall" |
| Sponsor Agent | resource_acquisition, cultural_dominance | Wealth transfer + `sponsors` edge | "The guild's coin purse opens for a promising recruit" |
| Excommunicate | revenge, defensive_consolidation | Remove `member_of` edge + hostile edge + reputation consequences | "The doors close. The name is struck from the rolls." |
| Hold Conclave | Any (crisis or periodic) | Group social scene using Deep Social Scenes | "The faction gathers to choose its path" |
| Issue Bounty | revenge | Targeted bounty encounter visible to members | "A price on a head, posted where only the faithful can read it" |

**Tier 2 — Deferred:** 3 actions requiring upstream systems
| Action | Deferred Until | Reason |
|--------|---------------|--------|
| Build Guild Hall | Economy system | `createSublocation()` exists but guild hall construction should cost faction treasury + time (initiative pattern) |
| Establish Chapter | Economy system | Similar to guild hall but in new region — needs expansion economy |
| Territorial Claim | Military system maturity | Needs control + defense encounter loop; army system is v0 |

---

## Architecture Decision: Faction Action Selection

**Option A: Expand `phaseFactionAmbitions` with action execution inline.**
- After ambition selection/re-evaluation, immediately evaluate and execute one action
- Pro: single phase. Con: `phaseFactionAmbitions` becomes a monolith; ambition evaluation and action execution have different cadences.

**Option B: New `phaseFactionActions` phase, separate from ambition evaluation.**
- `phaseFactionAmbitions` continues selecting/maintaining ambitions (every 5 ticks)
- New `phaseFactionActions` runs at a different interval, reads the active ambition, and selects + executes one action
- Pro: clean separation of "what to want" from "what to do." Con: two phases.

**Chosen: Option B.** Ambition evaluation is strategic (every 5 ticks, broad direction). Action execution is tactical (every `FACTION_ACTION_INTERVAL` ticks, specific deed). Different cadences, different logic. The action phase reads the ambition as context, not as a direct command — a faction with `resource_acquisition` ambition might commission a quest *or* sponsor an agent, depending on current state.

---

## Architecture Decision: Faction Treasury

The design doc asks whether faction wealth is separate from member wealth. Research shows faction nodes already have a `wealth` property set during seeding.

**Chosen: Faction treasury is the existing `properties.wealth` on the faction node, separate from member wealth.** Actions that cost wealth deduct from the faction treasury via `applyWealthDelta()`. Treasury income comes from:
- Quest completion rewards (percentage tribute from member quest payouts)
- Existing guild hall income (already modeled implicitly via prosperity)
- Player divine action ("Tithe" — transfer essence into faction wealth, stretch goal)

No new system needed — just explicit deductions in action execution.

---

## Architecture Decision: How Faction Actions Reach Agents

Faction actions affect agents in two ways:

1. **Encounter injection** — some actions (Commission Quest, Issue Bounty) create encounters that members can discover and attempt. These inject into the encounter candidate pool during `phaseAgentDecision`, gated by `member_of` edge existence.
2. **Direct graph mutation** — some actions (Declare Rivalry, Propose Alliance, Sponsor Agent, Excommunicate) are immediate graph operations that change the world state. These execute in `phaseFactionActions` directly.
3. **Scene spawning** — Hold Conclave spawns a group social scene (using THR-28 group resolution) involving the faction's leadership.

This hybrid avoids creating a new pipeline — faction actions use existing encounter injection for agent-facing actions and direct graph ops for structural changes.

---

## Implementation Phases

### Phase 1: Faction Action Framework (Engine)

**1.1 Define FactionAction types**

File: new `src/types/factionAction.ts`

```typescript
export type FactionActionType =
  | 'commission_quest'
  | 'declare_rivalry'
  | 'propose_alliance'
  | 'sponsor_agent'
  | 'excommunicate'
  | 'hold_conclave'
  | 'issue_bounty';

export interface FactionActionTemplate {
  type: FactionActionType;
  name: string;
  treasuryCost: number;
  cooldownTicks: number;
  minMembers: number;                    // Minimum faction membership to attempt
  ambitionAffinity: FactionAmbitionType[]; // Which ambitions make this action more likely
  prerequisite?: FactionActionPrerequisite;
}

export type FactionActionPrerequisite =
  | { type: 'has_rival'; }
  | { type: 'has_ally'; }
  | { type: 'member_count_above'; count: number }
  | { type: 'treasury_above'; amount: number }
  | { type: 'leader_exists'; }
  | { type: 'no_active_conclave'; };

export interface FactionActionRecord {
  actionType: FactionActionType;
  executedTick: number;
  targetId?: string;           // Target faction, agent, or location
  outcome: 'success' | 'pending' | 'failed';
  details?: Record<string, unknown>;
}
```

**1.2 Store action history on faction node**

Add to faction node properties:
```typescript
factionActionHistory?: FactionActionRecord[];  // Last N actions for cooldown + chronicle
lastActionTick?: number;                        // For global action cooldown
```

---

### Phase 2: Faction Action Evaluation & Selection (Engine)

**2.1 Create phaseFactionActions**

File: new `src/engine/phaseFactionActions.ts`

```typescript
export function phaseFactionActions(state: GameState): void
```

Runs every `FACTION_ACTION_INTERVAL` ticks. For each faction:

1. **Cooldown check** — skip if `lastActionTick + FACTION_ACTION_COOLDOWN > state.tick`
2. **Read active ambition** — from `pursues` edge to ambition node
3. **Score eligible actions** — for each FactionActionTemplate:
   - Base weight from `ambitionAffinity` match (high if action aligns with ambition)
   - Treasury check: faction wealth >= treasuryCost
   - Membership check: member count >= minMembers
   - Prerequisite check: specific conditions met
   - Cooldown per-action-type: last action of this type was > cooldownTicks ago
   - Leader personality bias: leader's axiological profile shifts weights (aggressive leaders favor rivalry/bounty; cooperative leaders favor alliance/sponsor)
4. **Select action** — weighted random selection from eligible actions (seeded PRNG)
5. **Execute action** — dispatch to type-specific executor (see Phase 3)
6. **Record** — append to `factionActionHistory`, set `lastActionTick`, emit trace

**2.2 Leader personality bias**

The faction's leader (highest-ranked member via `member_of` edges) biases action selection:

```typescript
function getLeaderBias(leader: GraphNode): Partial<Record<FactionActionType, number>> {
  const profile = leader.properties.axiologicalProfile as AxiologicalProfile;
  return {
    declare_rivalry: axisBias(profile, 'courage_prudence', 'left'),     // Courageous → rivalry
    propose_alliance: axisBias(profile, 'cooperation_independence', 'left'), // Cooperative → alliance
    sponsor_agent: axisBias(profile, 'generosity_frugality', 'left'),   // Generous → sponsor
    excommunicate: axisBias(profile, 'justice_mercy', 'left'),          // Just → excommunicate
    issue_bounty: axisBias(profile, 'cunning_honesty', 'left'),         // Cunning → bounty
    hold_conclave: axisBias(profile, 'tradition_progress', 'left'),     // Traditional → conclave
    commission_quest: axisBias(profile, 'loyalty_ambition', 'right'),   // Ambitious → quest
  };
}
```

**2.3 Wire into orchestrator**

File: `src/engine/orchestrator.ts`

Add after `phaseFactionAmbitions` (Phase 6.651):

```typescript
// Phase 6.652: Faction Action Evaluation (THR-29 — faction agency)
phaseFactionActions(s);
```

This ensures faction actions run after ambitions are evaluated in the same tick, using fresh ambition state.

---

### Phase 3: Action Executors (Engine)

**3.1 Commission Quest**

File: `src/engine/factionActionExecutors.ts`

```typescript
function executeCommissionQuest(faction, state, rng): void
```

- Read faction's `questTemplateIds` from definition
- Select a quest template that members haven't recently completed (cooldown)
- Create a `faction_quest` node in the graph with the template reference, expiry tick, and reward
- Members discover this quest via encounter candidate injection in `phaseAgentDecision` (quest scored with faction affinity bonus)
- Quest completion: member gains reputation, faction gains treasury income from loot share

**3.2 Declare Rivalry**

```typescript
function executeDeclareRivalry(faction, state, rng): void
```

- Find factions with negative `relates_to` sentiment (< `RIVALRY_SENTIMENT_THRESHOLD`)
- If none exist, find factions competing for same territory (overlapping `controls` edges or guild halls in same settlement)
- Create or strengthen `relates_to` edge with `basis: 'rivalry'`, `sentiment` pushed to -0.8
- Set `properties.isRival = true` on the edge for fast filtering
- Emit `FactionRivalryDeclaredTrace`
- Chronicle: "The [Faction A] has declared [Faction B] rivals. Members of each look upon the other with suspicion."

Consequences:
- Members of rival factions at same location get `rivalry_encounter` candidates (confrontation, espionage, recruitment poaching)
- Faction scoring boost for encounters that harm rival faction interests

**3.3 Propose Alliance**

```typescript
function executeProposeAlliance(faction, state, rng): void
```

- Find factions with positive `relates_to` sentiment (> `ALLIANCE_SENTIMENT_THRESHOLD`) or shared rivals
- Create or strengthen `relates_to` edge with `basis: 'alliance'`, `sentiment` pushed to +0.8
- Set `properties.isAlliance = true`
- Alliance benefits: shared encounter visibility (allied faction members see each other's faction quests), coordinated ambition bonus
- Emit `FactionAllianceProposedTrace`

**3.4 Sponsor Agent**

```typescript
function executeSponsorAgent(faction, state, rng): void
```

- Find non-member agents at faction guild hall locations with high capability in faction's preferred reaches
- Or find existing members with high reputation but low wealth
- Transfer `SPONSOR_WEALTH_AMOUNT` from faction treasury to agent wealth
- Create `sponsors` edge (faction → agent) with `sponsoredTick`, `amount`, `purpose`
- Sponsored agents get scoring bonus for faction-aligned encounters
- Emit `FactionSponsoredAgentTrace`

**3.5 Excommunicate**

```typescript
function executeExcommunicate(faction, state, rng): void
```

- Find members with lowest reputation OR members who also belong to a rival faction
- Remove `member_of` edge
- Create `hostile_to` edge (faction → ex-member) — ex-member loses access to faction encounters, may be targeted by faction bounties
- Apply reputation loss to ex-member's other faction memberships (guilt by association, scaled by `EXCOMMUNICATION_REPUTATION_SPLASH`)
- Emit `FactionExcommunicatedTrace`
- Chronicle: "The [Faction] has struck [Agent] from its rolls. The doors are closed."

**3.6 Hold Conclave**

```typescript
function executeHoldConclave(faction, state, rng): void
```

- Requires THR-28 group scene resolution
- Select faction's top-ranked members (up to `CONCLAVE_MAX_PARTICIPANTS`) at or near guild hall
- Spawn a group social scene encounter using the `conclave` template
- Conclave resolution determines: ambition shift (new ambition adopted?), leadership challenge (rank changes?), policy change (faction personality bias shift?)
- Each participant's axiological profile influences their debate position
- Emit `FactionConclaveTrace`

**3.7 Issue Bounty**

```typescript
function executeIssueBounty(faction, state, rng): void
```

- Find agents who have harmed the faction (excommunicated members, rival faction's sponsor targets, agents who failed/abandoned faction quests)
- Create `bounty` node in graph: target agent, reward amount, issuing faction, expiry tick
- Members discover bounty as encounter candidate (bounty_hunt template)
- Bounty completion: hunter gains reputation + bounty reward, faction deducts bounty from treasury at creation
- Emit `FactionBountyIssuedTrace`

---

### Phase 4: Encounter Integration (Engine + Content)

**4.1 Faction quest injection into candidate pool**

File: `src/engine/phaseAgentDecision.ts`

During candidate generation, after standard encounter candidates:
```typescript
const factionQuestCandidates = generateFactionQuestCandidates(agent, graph, state);
allCandidates.push(...factionQuestCandidates);
```

`generateFactionQuestCandidates()` checks:
- Agent has `member_of` edge to a faction
- Faction has active `faction_quest` nodes
- Agent meets quest prerequisites (rank, reach capability)
- Quest hasn't expired

Score includes faction loyalty bonus (reputation × `FACTION_QUEST_LOYALTY_MULTIPLIER`).

**4.2 Rivalry encounter injection**

When an agent shares a location with a rival faction member, inject rivalry-specific encounter candidates:
- Confrontation (Iron/Shadow) — direct clash
- Subterfuge (Shadow/Eye) — steal faction secrets
- Recruitment Poaching (Heart/Gold) — convince rival member to defect
- Sabotage (Shadow) — undermine rival operations

**4.3 Bounty encounter injection**

Active bounty nodes inject `bounty_hunt` encounter candidates for faction members near the bounty target.

**4.4 Conclave encounter template**

New group scene template (requires THR-28):
- 4-step group scene: Opening Address → Debate → Vote → Resolution
- Each participant's axiological profile shapes their position
- Leverage mechanic (from THR-28) tracks the debate's momentum
- Outcome: new faction ambition adopted, or leadership affirmed, or schism (rare)

---

### Phase 5: Faction Action Content (Content)

**5.1 Faction action encounter templates**

File: new `src/data/faction-action-encounters.ts`

| Template | Type | Steps | Used By |
|----------|------|-------|---------|
| Faction Quest Board | quest | 3 | Commission Quest — agent discovers posted quest |
| Rivalry Confrontation | duel | 3 | Declare Rivalry — members of rival factions clash |
| Recruitment Pitch | social | 3 | Sponsor Agent — faction representative approaches prospect |
| Loyalty Test | social | 2 | Excommunicate — pre-excommunication questioning |
| Bounty Hunt | combat | 3 | Issue Bounty — member pursues bounty target |
| Alliance Ceremony | social | 2 | Propose Alliance — formal alliance declaration |
| Conclave Debate | group_social | 4 | Hold Conclave — multi-agent faction debate |
| Rivalry Subterfuge | stealth | 3 | Declare Rivalry — espionage against rival |
| Defection Pitch | social | 3 | Declare Rivalry — recruiting from rival faction |

9 new encounter templates, each following the existing `EncounterTemplate` shape. Conclave uses THR-28 group scene resolution.

**5.2 Chronicle prose for faction actions**

Each action type gets 3 chronicle prose variants:
- **Execution:** "The Adventuring Guild has commissioned a quest: clear the goblin warrens near Thornfield."
- **Success:** "The bounty on Shade Blackwood has been collected. The Thieves Guild's coffers are lighter."
- **Failure/expiry:** "The quest goes unclaimed. The notice yellows on the board."

---

### Phase 6: Player Agency — Divine Actions (Player)

**6.1 "Divine Edict" — influence conclave**

```typescript
{
  id: 'action.divine-edict',
  name: 'Divine Edict',
  sphere: 'mind',
  reach: 'star',
  essenceCost: 18,
  targetCategories: ['actor'],
  targetFilter: { actorType: 'faction', hasActiveConclave: true },
  steps: [{
    id: 'edict.pronounce',
    name: 'The God Speaks',
    narrative: 'Your voice echoes in the minds of the gathered faithful. The conclave\'s debate shifts.',
    effects: [
      { type: 'conclave_influence', leverageShift: 0.3 },  // Shift conclave leverage toward god's preferred outcome
    ],
  }],
}
```

Requires a bonded agent to be present at the conclave. The god's influence adds leverage (THR-28) toward the outcome that aligns with the god's sphere.

**6.2 "Anoint Champion" — boost faction agent**

```typescript
{
  id: 'action.anoint-champion',
  name: 'Anoint Champion',
  sphere: 'force',
  reach: 'iron',
  essenceCost: 14,
  targetCategories: ['actor'],
  targetFilter: { actorType: 'agent', hasFactionMembership: true },
  steps: [{
    id: 'anoint.blessing',
    name: 'Champion\'s Mantle',
    narrative: 'You mark {target} as your chosen instrument. The faction watches with awe.',
    effects: [
      { type: 'modifier', target: 'agent', property: 'factionReputationGainMultiplier', value: 2.0, duration: 15 },
      { type: 'modifier', target: 'agent', property: 'encounterScoreBoost', value: 0.2, duration: 15 },
    ],
  }],
}
```

---

### Phase 7: UI (UI)

**7.1 Faction action log in FactionSheet**

File: `src/components/Game/FactionSheet.tsx`

Add a "Recent Actions" section showing the last 5 `factionActionHistory` entries with prose descriptions and outcomes. This gives the player visibility into what factions are doing.

**7.2 Faction event notifications**

Faction actions involving the player's bonded agents trigger notifications:
- Bonded agent's faction commissions a quest → toast
- Bonded agent sponsored → alert (positive)
- Bonded agent excommunicated → alert (dramatic)
- Bonded agent's faction declares rivalry → toast
- Conclave involving bonded agent → alert (opportunity for Divine Edict)

Notification tier follows existing `notificationTier` pattern.

**7.3 Inter-faction relationship display**

Enhance FactionSheet's relations section:
- Rivalries shown with red accent + "Rival" badge
- Alliances shown with blue accent + "Allied" badge
- Active bounties listed under rivalry entries
- Sponsored agents listed under faction details

**7.4 Chronicle entries**

Faction action chronicle entries use the existing chronicle pipeline. Each action type maps to a chronicle event with appropriate importance tier:
- Commission Quest: minor (frequent)
- Declare Rivalry / Propose Alliance: major (world-shaping)
- Excommunicate: moderate (personal stakes)
- Hold Conclave: major (faction direction change)
- Issue Bounty: moderate
- Sponsor Agent: minor

---

## Wiring Checklist

| Surface | Integration |
|---------|------------|
| **Orchestrator** | New `phaseFactionActions` at Phase 6.652, after `phaseFactionAmbitions` |
| **GameState** | `factionActionHistory` and `lastActionTick` on faction node properties |
| **UI: FactionSheet** | Recent Actions section, enhanced relations display |
| **UI: Notifications** | Faction events involving bonded agents |
| **UI: Chronicle** | Faction action chronicle entries (7 action types × 3 variants) |
| **Encounter pipeline** | Faction quest, rivalry, bounty candidates injected into phaseAgentDecision |
| **Prose pipeline** | Faction action prose in templates. Enrichment placeholders. |
| **Traces** | 7 trace types (one per action type) + conclave trace |
| **Debug panel** | Faction action history visible in faction inspection |
| **Player controls** | "Divine Edict" and "Anoint Champion" divine action templates |
| **Wealth system** | Faction treasury deductions for action costs |
| **Ambition system** | Actions scored by ambition affinity. Conclave can shift ambition. |
| **Graph ops** | `relates_to` mutations for rivalry/alliance. `sponsors` edge. `hostile_to` edge. `bounty` nodes. |

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_ACTION_INTERVAL` | 8 | Ticks between faction action evaluations |
| `FACTION_ACTION_COOLDOWN` | 5 | Min ticks between consecutive actions by same faction |
| `COMMISSION_QUEST_COST` | 5 | Treasury cost to commission a quest |
| `COMMISSION_QUEST_EXPIRY` | 30 | Ticks before unclaimed quest expires |
| `RIVALRY_SENTIMENT_THRESHOLD` | -0.3 | Minimum negative sentiment to declare rivalry |
| `ALLIANCE_SENTIMENT_THRESHOLD` | 0.3 | Minimum positive sentiment to propose alliance |
| `SPONSOR_WEALTH_AMOUNT` | 15 | Wealth transferred to sponsored agent |
| `SPONSOR_COST` | 15 | Treasury cost (same as transfer) |
| `EXCOMMUNICATION_REPUTATION_SPLASH` | 0.1 | Reputation loss applied to ex-member's other factions |
| `CONCLAVE_MAX_PARTICIPANTS` | 6 | Max agents in a conclave scene |
| `CONCLAVE_TRIGGER_INTERVAL` | 50 | Min ticks between conclaves (or crisis trigger) |
| `BOUNTY_REWARD` | 10 | Wealth reward for completing a bounty |
| `BOUNTY_COST` | 12 | Treasury cost to issue bounty (includes reward + overhead) |
| `BOUNTY_EXPIRY` | 40 | Ticks before bounty expires |
| `FACTION_QUEST_LOYALTY_MULTIPLIER` | 0.3 | Reputation-based scoring bonus for faction quests |
| `FACTION_TREASURY_TRIBUTE_RATE` | 0.1 | Percentage of quest rewards that go to faction treasury |
| `DIVINE_EDICT_ESSENCE_COST` | 18 | Essence cost for Divine Edict |
| `ANOINT_CHAMPION_ESSENCE_COST` | 14 | Essence cost for Anoint Champion |
| `ANOINT_CHAMPION_DURATION` | 15 | Ticks the champion blessing lasts |

---

## Tracing

One trace type per action, all sharing a common base:

```typescript
interface FactionActionTrace {
  tick: number;
  category: 'faction_action';
  actionType: FactionActionType;
  factionId: string;
  factionName: string;
  ambitionType: FactionAmbitionType;
  leaderBias: string;             // Which personality trait drove the bias
  treasuryCost: number;
  treasuryAfter: number;
  targetId?: string;
  targetName?: string;
  outcome: 'executed' | 'failed_prerequisite' | 'failed_treasury';
  summary: string;
}
```

Additional trace for conclave resolution:
```typescript
interface FactionConclaveTrace extends FactionActionTrace {
  participants: string[];          // Agent IDs
  debatePositions: Record<string, string>;  // agentId → position
  leverageFinal: number;
  ambitionShifted: boolean;
  newAmbition?: FactionAmbitionType;
  leadershipChallenged: boolean;
}
```

---

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Faction has no active ambition | Default to `defensive_consolidation`, which favors low-risk actions (sponsor, alliance) |
| No eligible actions this tick | Skip faction — no action taken, try again next interval |
| Faction has no leader (all members gone) | Skip conclave and leadership-dependent actions. Other actions still available. |
| Treasury insufficient for any action | Skip faction. Factions below `FACTION_MIN_TREASURY` take no actions. |
| Target faction for rivalry/alliance no longer exists | Skip that action, select next-best candidate |
| Sponsored agent dies before benefit realized | `sponsors` edge orphaned — cleaned up by edge pruning (existing mechanism) |
| Conclave participants unavailable (occupied) | Reduce participants to available members. If < 2, cancel conclave. |
| Quest commission for template that no longer exists | Use first available template from faction definition. If none, skip. |
| Bounty target no longer in game | Bounty expires immediately. Treasury not refunded (cost of intelligence failure). |
| `factionActionHistory` grows unbounded | Cap at `FACTION_ACTION_HISTORY_MAX` entries, discard oldest |

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — 19 named constants covering costs, intervals, thresholds, and durations |
| 2 | Inspectability | PASS — per-action traces with treasury state, leader bias, and outcome. Conclave trace with participant positions. |
| 3 | Determinism | PASS — action selection uses seeded PRNG. Leader bias is deterministic from axiological profile. |
| 4 | Fail-soft | PASS — see table above. No action = faction idles. No crashes. |
| 5 | Narrative > mechanics | PASS — every action has 3 chronicle prose variants. Conclave is a full dramatic scene. Excommunication and rivalry have personal stakes. |
| 6 | Additive | PASS — new phase, new types, new templates. Existing `phaseFactionAmbitions` unchanged. Encounter injection alongside existing candidates. |
| 7 | Performance | PASS — O(factions × action_types) per evaluation tick. Factions ≈ 11, actions = 7. Trivial. |

---

## Implementation Order for CC

1. Define `FactionActionType`, `FactionActionTemplate`, `FactionActionRecord` types (new `src/types/factionAction.ts`)
2. Create 7 action template definitions with costs, cooldowns, prerequisites
3. Create `phaseFactionActions()` — evaluation, scoring, selection loop (new `src/engine/phaseFactionActions.ts`)
4. Wire into orchestrator at Phase 6.652
5. Implement action executors: Commission Quest, Declare Rivalry, Propose Alliance (3 highest-value first)
6. Implement action executors: Sponsor Agent, Excommunicate, Issue Bounty
7. Implement Hold Conclave (depends on THR-28 group scene resolution)
8. Create faction quest/rivalry/bounty candidate injection in phaseAgentDecision
9. Create 9 faction action encounter templates (new `src/data/faction-action-encounters.ts`)
10. Add "Divine Edict" and "Anoint Champion" divine action templates
11. Add Recent Actions section to FactionSheet
12. Add faction event notifications for bonded agents
13. Add chronicle entries for faction actions
14. Extend debug panel for faction action inspection
15. Write tests: action selection, treasury deduction, rivalry/alliance edge creation, quest injection, bounty lifecycle
16. Smoke test via CLI: `tick 80`, check `factions` for action history, `encounters` for faction quest candidates, `events` for faction action chronicle
17. Visual verification: `?view=game&seeded` — check FactionSheet shows recent actions

## Estimated Scope

~4 CC sessions. Phase 3 executors are the bulk (7 action types, each with graph ops + encounter wiring). Content is moderate (9 encounter templates + chronicle prose). Conclave (Phase 3.6) depends on THR-28 group scenes and can be implemented last.
