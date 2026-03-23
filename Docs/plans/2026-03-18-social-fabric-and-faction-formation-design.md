# Social Fabric & Faction Formation — Design Doc

**Date:** 2026-03-18
**Status:** Design complete, pending implementation
**Depends on:** Agent Decision & Encounter Awareness (`2026-03-18`), Encounter Resolution & Divine Intervention (`2026-03-18`), Tier Promotion & Capability Growth (`2026-03-18`)
**Connects to:** Game Theory Disposition System (`2026-03-07`), Meet The First (`brainstorm-meet-the-first.md`)

## Problem

Agents are social islands. The game theory disposition system gives them cooperation strategies and interaction logs, but these only activate when two agents happen to be at the same location. Agents never seek each other out, never form lasting groups, and never organize into factions through play. Reputation is a single global score that everyone sees equally — there's no gossip, no information asymmetry, no political manipulation of perception.

The result: a world of individuals who occasionally bump into each other. No alliances, no rivalry networks, no merchant cartels forming from shared trade interests, no warlords building retinues. The social dimension of the simulation is flat.

## Design Principles

1. **Social interactions ARE encounters.** Agent-to-agent interactions use the same encounter system, same CRUD framework, same scoring pipeline. Social encounters compete with location encounters on equal footing in the agent decision system.

2. **Reputation is graph-walked, not global.** There is no omniscient reputation score. An agent learns about another's trustworthiness by walking the relationship graph through intermediaries. The signal degrades with distance and can be distorted by manipulators. This creates information asymmetry as a first-class game mechanic.

3. **Factions are agent-initiated, not system-detected.** Forming a group is an encounter — a leader decides to organize, recruits members, and formalizes the structure. This makes faction creation visible, intentional, and fallible.

4. **Bonds are the foundation of everything social.** Trust, reputation, faction membership, social seeking — all flow from the `relates_to` edges in the graph. Strong bonds create strong factions, reliable reputation chains, and intentional social movement.

## Design Decisions

### Decision 1: Social Encounter Templates — CRUD Applied to Agents

**Chosen:** Every agent generates a set of social encounter opportunities that other agents can perceive and pursue. These use the same encounter template system as location encounters, filtered through the same scoring pipeline, competing on value/tick × desire.

**Social encounter CRUD mapping:**

| CRUD Verb | Social Expression | ReachPrimary | Threat Model |
|-----------|------------------|-------------|--------------|
| **Create** | Form bond, recruit, hire, propose alliance | Heart | Low risk — rejection, not harm |
| **Find** | Investigate reputation, assess capability, spy on | Eye / Shadow | Low risk — discovery if caught spying |
| **Change** | Persuade, negotiate, charm, threaten, deceive, manipulate | Heart / Shadow / Gold | Medium risk — two-way influence, can backfire |
| **Destroy** | Duel, sabotage, rob, assassinate, punish | Iron / Shadow | High risk — two-way combat/conflict |
| **Control** | Establish patronage, political leverage, mentorship, sustained loyalty | Heart / Shadow | Ongoing cost — sustained social investment |

**How social encounters enter the pipeline:**

During the decision phase, after pulling location encounters from the global cache, the system generates social encounter candidates for each visible agent:

```
For each agent within awareness range (reach-based, same as Decision 2 in Agent Decision doc):
  For each social encounter template:
    If agent meets template prerequisites (reach capability, threat band):
      Create candidate with targetId = other agent's ID
      Candidate carries bond data: trust, sentiment, interaction history
```

Social encounter templates are a new category in `ENCOUNTER_TEMPLATES` with `targetCategories: ['agent']` (using the Generalized Action Targeting system). They don't need to be at a specific location type — they're available wherever two agents are colocated or within remote-encounter range.

**Target availability (cross-reference with Decision 5 in this doc and Agent Decision doc, Decision 2):** A social encounter with a target agent is "available" when: (a) the target is visible to the source agent — either through a bond (bonds bypass distance, always visible) or through Heart/Shadow capability within range (see Decision 5 below); AND (b) the encounter's presence/remote requirements are met — physical-presence encounters require colocation, remote-capable encounters require the target to be within `remoteAttempt.maxRange` (see Agent Decision doc, Decision 4).

**Bond influence on scoring:**

The existing scoring formula (`valuePerTick × desireMultiplier`) gains a bond modifier for social encounters:

```
bondModifier =
  if strong positive bond (trust > STRONG_BOND_THRESHOLD):
    COOPERATIVE_BOND_BOOST for cooperative encounters
    RIVAL_BOND_PENALTY for destructive encounters
  if strong negative bond (trust < HOSTILE_BOND_THRESHOLD):
    RIVAL_BOND_BOOST for destructive encounters
    COOPERATIVE_BOND_PENALTY for cooperative encounters
  if no bond:
    STRANGER_MODIFIER (base: slightly negative — unknown agents are less attractive)
    UNLESS agent's Heart axis leans toward Ambition (> STRANGER_CURIOSITY_THRESHOLD)
      → STRANGER_CURIOSITY_BONUS instead (ambitious agents seek new connections)
    OR agent's Eye capability > STRANGER_PERCEPTION_THRESHOLD
      → STRANGER_PERCEPTION_BONUS (perceptive agents are drawn to investigate unknowns)

socialDesireMultiplier = desireMultiplier × (1.0 + bondModifier)
```

This means: agents with strong positive bonds seek each other out for cooperation. Agents with grudges seek each other out for conflict. Most agents slightly prefer known entities over strangers — but ambitious agents and perceptive agents actively seek out new connections. A cautious, loyal farmer ignores passing strangers. An ambitious merchant or a curious scholar approaches them.

**Colocation vs remote social encounters:**

Some social encounters require physical presence (duel, hire). Others can be done remotely (send message, negotiate via intermediary, spy from afar). This uses the same `remoteAttempt` schema from Decision 4 in the Agent Decision doc.

| Social type | Requires presence? | Remote penalty |
|-------------|-------------------|---------------|
| Duel, Rob, Assassinate | Yes | N/A |
| Recruit, Hire | Yes (in-person commitment) | N/A |
| Negotiate, Trade deal | Partial — remote with penalty | 0.15 |
| Persuade, Charm | Partial — remote with heavy penalty | 0.25 |
| Spy on, Investigate | No — inherently remote | 0.05 |
| Threaten, Intimidate | Partial | 0.10 |
| Send message, Propose alliance | No | 0.05 |

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `STRONG_BOND_THRESHOLD` | 0.6 | Trust level above which cooperative social encounters get a boost |
| `HOSTILE_BOND_THRESHOLD` | -0.3 | Trust level below which destructive social encounters get a boost |
| `COOPERATIVE_BOND_BOOST` | 0.4 | Score multiplier for cooperative encounters with trusted agents |
| `RIVAL_BOND_BOOST` | 0.3 | Score multiplier for destructive encounters with hostile agents |
| `STRANGER_MODIFIER` | -0.1 | Base score penalty for encounters with unknown agents |
| `STRANGER_CURIOSITY_THRESHOLD` | 0.3 | Heart axis (Ambition pole) above which strangers become attractive |
| `STRANGER_CURIOSITY_BONUS` | 0.15 | Score bonus replacing STRANGER_MODIFIER for ambitious agents |
| `STRANGER_PERCEPTION_THRESHOLD` | 0.3 | Eye capability above which strangers become attractive |
| `STRANGER_PERCEPTION_BONUS` | 0.1 | Score bonus replacing STRANGER_MODIFIER for perceptive agents |
| `MAX_SOCIAL_CANDIDATES_PER_AGENT` | 3 | Maximum social encounter templates generated per visible agent (performance) |

**Tracing:**

```typescript
interface SocialEncounterTrace {
  tick: number;
  category: 'social_encounter_generation';
  agentId: string;
  targetAgentId: string;
  templateId: string;
  bondStrength: number;
  bondModifier: number;
  score: number;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| No social templates match prerequisites | Skip social encounters for this pair |
| Bond data missing between agents | Use STRANGER_MODIFIER (no bond = stranger) |
| Target agent has no location (orphan) | Skip — can't generate encounter for unreachable agent |
| Too many social candidates generated | Cap at MAX_SOCIAL_CANDIDATES_PER_AGENT × visible agents |

**PRNG:** Template selection uses seeded PRNG (agent pair hash + tick).

### Decision 2: Graph-Walked Reputation

**Chosen:** There is no global reputation score. When Agent A wants to assess the trustworthiness of Agent X, the system walks the `relates_to` graph from A to X, accumulating trust along the path. The result is A's *perceived reputation* of X — which may be accurate, misleading, or completely wrong depending on the intermediaries.

**Why graph-walked?** Global reputation assumes perfect information. In a world of spies, politicians, and liars, that's wrong. A merchant's reputation in the Merchant Guild should be different from their reputation among the Shadow Guild. A skilled manipulator should be able to maintain a false reputation. Graph-walking creates all of this emergently.

**The walk algorithm:**

```
perceiveReputation(sourceId, targetId, graph, maxHops):
  // Direct knowledge — strongest signal
  directEdge = graph.getEdge(sourceId, targetId, 'relates_to')
  if directEdge exists:
    return directEdge.trust  // personal experience trumps everything

  // Walk through intermediaries — find ALL paths up to maxHops
  paths = findAllPaths(sourceId, targetId, maxHops, edgeType='relates_to')
  if no paths found:
    return UNKNOWN_REPUTATION  // no information available

  // Score each path by cumulative trust product
  // A 1-hop path through trust 0.4 = 0.4
  // A 3-hop path through 0.8 × 0.8 × 0.8 = 0.51 (trusted chain wins despite length)
  for each path:
    path.trustScore = Π(edge.trust for each edge in path)

  // Select best path: highest cumulative trust product
  // This means trusted long chains beat unreliable short ones — you'd rather
  // hear from your trusted friend's trusted friend than from someone you distrust
  bestPath = path with highest abs(trustScore)

  rawReputation = bestPath.trustScore

  // Each intermediary's Shadow capability can distort the signal
  // Direction: positive bond with target → positive spin, negative bond → slander
  distortion = Σ(
    intermediary.shadowCapability × SHADOW_DISTORTION_FACTOR
    × sign(intermediary's bond with target)
  ) for each intermediary

  // Source agent's Heart capability resists distortion (empaths see through lies)
  distortionResistance = source.heartCapability × HEART_TRUST_FACTOR
  effectiveDistortion = distortion × (1.0 - distortionResistance)

  // Faction rank of intermediaries boosts trust signal
  // A guild master's report is more credible than a recruit's
  rankBonus = Σ(
    intermediary.factionRank × FACTION_RANK_TRUST_BONUS
    — only if intermediary shares a faction with source
  ) for each intermediary

  // Final perceived reputation
  perceived = rawReputation + effectiveDistortion + rankBonus
  return clamp(perceived, -1.0, 1.0)
```

**Key properties:**

1. **Direct experience trumps hearsay.** If A has interacted with X directly, A uses their personal trust score regardless of what the network says.

2. **Trust degrades over distance.** Each hop multiplies trust, so a 3-hop chain with 0.8 trust per hop gives 0.51 — barely reliable. A 4-hop chain of 0.7 each gives 0.24 — nearly useless.

3. **Shadow capability distorts.** A high-Shadow intermediary can present a false picture. This is what political/spy agents DO — they control information flow. The `SHADOW_DISTORTION_FACTOR` determines how much a single Shadow-skilled node can shift the perceived reputation. A Shadow 0.8 agent in the chain can swing the result significantly.

4. **Isolated agents are unknowable.** If there's no path from A to X, A perceives `UNKNOWN_REPUTATION` (neutral, slightly cautious). This makes loners opaque and makes bond-building valuable for intelligence.

5. **Faction membership creates trust highways.** Members of the same faction have many short, high-trust paths between them. Guild members can quickly and accurately assess each other's reputation. This is a concrete benefit of faction membership.

**How distortion works narratively:**

A Shadow-skilled manipulator in the chain doesn't just passively degrade the signal. The distortion reflects their *active interest*. If the intermediary has a positive bond with the target, they give positive spin. If they have a negative bond, they slander. If they're neutral, they report honestly (no distortion). The formula:

```
intermediaryDistortion =
  intermediary.shadowCapability × SHADOW_DISTORTION_FACTOR
  × sign(intermediary's bond with target)  // positive spin or slander
```

This means: asking a spy about their friend gives you an inflated picture. Asking a spy about their enemy gives you a deflated picture. Asking an honest person (low Shadow) gives you the truth regardless of their feelings.

**Heart capability resists distortion.** A high-Heart agent (empath, socially perceptive) partially sees through manipulation. The distortion is scaled by `(1.0 - source.heartCapability × HEART_TRUST_FACTOR)`. A Heart 0.8 agent resists 24% of incoming distortion. This creates a natural interplay: Shadow agents control information, Heart agents see through it.

**Faction rank boosts credibility.** When an intermediary shares a faction with the source agent, their faction rank adds a trust bonus. The guild master's report about a fellow merchant is more credible than a recruit's report about the same person. This makes faction networks not just wider (more paths) but more reliable (higher-quality signal through high-rank members).

**When is reputation computed?**

Not every tick for every pair — that would be expensive. Reputation is computed:

1. When an agent evaluates a social encounter candidate (during decision phase)
2. When an agent considers joining a faction (reputation of the leader matters)
3. When a dilemma event fires (reputation of the opponent informs strategy choice)

The result can be cached per-tick per-pair (like the distance matrix) since the graph doesn't change within a tick.

**Impact on existing systems:**

The existing `reputationScore` field on agents becomes deprecated. The `applyDispositionModifier` in `agentSelection.ts` currently reads `targetNode.properties.reputationScore` — this changes to `perceiveReputation(actorId, targetId, graph)`. The function signature stays the same; only the reputation lookup changes.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `REPUTATION_MAX_HOPS` | 4 | Maximum graph hops to walk for reputation |
| `REPUTATION_WALK_MAX_NODES` | 100 | Hard cap on BFS nodes visited. If exceeded, return UNKNOWN_REPUTATION. Safety valve for unexpectedly dense graphs. |
| `UNKNOWN_REPUTATION` | 0.0 | Default when no path exists (neutral/cautious) |
| `SHADOW_DISTORTION_FACTOR` | 0.15 | Maximum distortion per Shadow-capable intermediary |
| `HEART_TRUST_FACTOR` | 0.3 | Heart capability scales distortion resistance (0.3 means a Heart 1.0 agent resists 30% of distortion) |
| `FACTION_RANK_TRUST_BONUS` | 0.1 | Per-intermediary trust bonus scaled by faction rank (guild master at 1.0 rank adds +0.1) |
| `DIRECT_EXPERIENCE_WEIGHT` | 1.0 | Weight of personal experience vs hearsay (1.0 = personal always wins) |
| `TRUST_PER_POSITIVE_INTERACTION` | 0.03 | Trust increase per cooperative interaction |
| `TRUST_PER_NEGATIVE_INTERACTION` | -0.08 | Trust decrease per defection (asymmetric: trust is slow to build, fast to lose) |
| `TRUST_DECAY_PER_TICK` | 0.002 | Trust drifts toward 0 (neutral) without reinforcement |

**Tracing:**

```typescript
interface ReputationWalkTrace {
  tick: number;
  category: 'reputation_walk';
  sourceId: string;
  targetId: string;
  pathLength: number;
  pathNodes: string[];
  rawReputation: number;
  distortions: Array<{ nodeId: string; shadowCap: number; distortion: number }>;
  perceivedReputation: number;
  directExperience: boolean;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| No path found within maxHops | Return UNKNOWN_REPUTATION |
| Intermediary node missing | Skip that hop, use shorter path if available |
| Shadow capability missing on intermediary | Assume 0 (no distortion) |
| Path-finding exceeds REPUTATION_WALK_MAX_NODES (100 nodes visited) | Return UNKNOWN_REPUTATION, log warning |

**PRNG:** Not needed — reputation walk is deterministic from graph state.

### Decision 3: Trust on Relationship Edges

**Chosen:** The `relates_to` edge gains an explicit `trust` property (separate from `sentiment` and `strength`) that tracks accumulated reliability between two agents. Trust is the primary signal for reputation walks and social encounter scoring.

**Why separate from sentiment?** Sentiment is how you *feel* about someone (like/dislike). Trust is how *reliable* you believe they are. You can like someone you don't trust (a charming liar) or trust someone you dislike (a cold but dependable ally). These are different axes that produce different social behaviors.

**Trust mechanics:**

```
trust: number  // -1.0 to +1.0
  +1.0 = complete trust (they have never let me down)
  0.0  = neutral (unknown, or balanced history)
  -1.0 = complete distrust (known betrayer)
```

Trust changes from interactions:
- Cooperative interaction: `trust += TRUST_PER_POSITIVE_INTERACTION` (slow build: +0.03)
- Defection/betrayal: `trust += TRUST_PER_NEGATIVE_INTERACTION` (fast loss: -0.08)
- No interaction: `trust` decays toward 0 at `TRUST_DECAY_PER_TICK` (relationships fade)

The asymmetry (losing trust ~3× faster than gaining it) means: it takes ~27 cooperative interactions to go from neutral to fully trusted, but only ~13 defections to go from fully trusted to fully distrusted. Trust is earned slowly and destroyed quickly.

**Relationship to existing edge properties:**

| Property | What it represents | Used by |
|----------|-------------------|---------|
| `sentiment` | How you feel — like/dislike (-1 to +1) | Prose generation, relationship flavor |
| `strength` | How strong the connection is (0 to 1) | Bond detection, faction clustering |
| `trust` (new) | How reliable you believe them to be (-1 to +1) | Reputation walks, social encounter scoring, cooperation strategy |
| `interactionLog` | History of cooperative/defective moves | Strategy evaluation (existing) |
| `basis` | Why the relationship exists (trade, kinship, rivalry, etc.) | Bond type filtering in ambitions |

**Impact on existing systems:**

- `applyDispositionModifier` in `agentSelection.ts`: uses trust instead of (or in addition to) global reputation
- `resolveDilemma` in `disposition.ts`: updates trust alongside sentiment/strength
- Graph conditions (`agent_has_bonds`): can now filter by trust threshold
- Social encounter scoring: uses trust for bond modifier calculation

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Trust property missing on edge | Default to 0.0 (neutral) |
| Trust outside [-1, 1] range | Clamp to boundaries |

### Decision 4: Faction Formation as Social Encounter

**Chosen:** Forming a group or faction is an agent-initiated encounter. A leader with sufficient social capability and existing strong bonds can attempt "Found a Group" — a multi-step social encounter whose success creates a faction node in the graph.

**Why agent-initiated?** Factions don't appear from thin air. Someone decides to organize. Making it an encounter means: it can fail, it costs time (ticks), it requires capability (Heart/Shadow), and it requires existing social capital (bonds). The system doesn't magically detect clusters — a leader steps up.

**The "Found a Group" encounter:**

This encounter does NOT require all members to be colocated. The leader initiates from wherever they are, reaching out through their social network. Each step uses the `remoteAttempt` system — the leader sends messages, dispatches emissaries, and negotiates across distance. This dramatically increases the likelihood of faction formation, since it only requires the *leader* to act, not 3+ agents to converge on one hex.

```
Encounter: Found a Group
  targetCategories: ['self']  // agent acts on themselves
  reachPrimary: heart
  reachSecondary: shadow
  threatRating: moderate
  remoteAttempt: { allowed: true, probabilityPenalty: 0.10, maxRange: undefined }
  Prerequisites:
    - Heart capability ≥ 0.3 (can inspire people)
    - At least 2 agents with trust > FACTION_FORMATION_TRUST_THRESHOLD within awareness
    - Not already leading a faction

  Step 1: "Gather the Like-Minded"
    reach: heart
    difficulty: 35
    duration: 3
    Description: The agent reaches out to trusted allies — through letters, emissaries,
    or shared contacts — with a shared purpose. Distance adds difficulty but doesn't
    prevent the attempt.
    Success: Identified willing members. Lock recruited agent list.
    Failure: The allies are not interested or the timing is wrong. Cooldown.

  Step 2: "Define the Purpose"
    reach: shadow  // political organization
    difficulty: 45
    duration: 2
    Description: Through negotiation and correspondence, the group agrees on a shared
    goal and structure. The further apart the members, the harder this is.
    Success: Faction reachPreferences set from leader's primary reach + members' overlap.
    Failure: Disagreement fractures the group before it forms.

  Step 3: "Seal the Pact"
    reach: heart
    difficulty: 40
    duration: 2
    Description: The founding moment. Oaths are sworn across distance — by bonded word,
    sealed letter, or shared ritual. Presence would make this easier, but isn't required.
    Success: Faction node created. member_of edges with ranks assigned. Leader = 1.0.
    Failure: The pact falls apart at the last moment.
```

The `probabilityPenalty: 0.10` means remote founding is harder than in-person (−10% probability per step), but very much possible for a socially capable leader. An agent who travels to meet their allies in person gets the full probability — rewarding intentional colocation without requiring it.

**What happens on success:**

1. New faction node created in the graph with:
   - `actorType: 'faction'`
   - `reachPreferences`: derived from leader's primary reach + members' shared capabilities
   - Properties inherited from the founding context (location, culture)

2. `member_of` edges created:
   - Leader → faction: rank 1.0
   - Recruited members → faction: rank 0.3–0.5 (based on trust with leader)

3. Faction immediately enters the encounter cache system (Decision 3 in Agent Decision doc) — members start receiving faction intelligence.

4. A narrative vignette fires describing the founding.

**Faction growth after founding:**

New members join through a "Recruit to Faction" social encounter (Create verb):
- Leader or high-rank member initiates
- Target must have some trust with the recruiter
- Success adds `member_of` edge at starting rank (0.1)
- Rank increases through loyalty, service, and faction-relevant encounters (ties into tier promotion — faction rank bumps when you promote in the faction's primary reach)

**Faction dissolution:**

If the leader dies or leaves, and no member meets the leadership threshold (highest rank + highest capability in faction's primary reach), the faction dissolves — `member_of` edges removed, faction node archived.

If trust between members drops below critical thresholds (too many defections), the faction fractures — a "Faction Schism" event.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_FORMATION_TRUST_THRESHOLD` | 0.4 | Minimum trust with potential members to attempt founding |
| `FACTION_FORMATION_MIN_MEMBERS` | 2 | Minimum allies needed (plus the leader = 3 total) |
| `FACTION_STARTING_RANK_MIN` | 0.3 | Minimum rank for founding members |
| `FACTION_STARTING_RANK_MAX` | 0.5 | Maximum rank for founding members (leader is 1.0) |
| `FACTION_RECRUIT_STARTING_RANK` | 0.1 | Rank of newly recruited members |
| `FACTION_DISSOLUTION_THRESHOLD` | 1 | If members drop to this count (just the leader), faction dissolves |
| `FACTION_LEADERSHIP_CAPABILITY_MIN` | 0.4 | Minimum capability in faction primary reach to succeed as leader |

**Tracing:**

```typescript
interface FactionFormationTrace {
  tick: number;
  category: 'faction_formation';
  leaderId: string;
  factionId: string;
  memberIds: string[];
  reachPreferences: Partial<Record<ReachDomain, number>>;
  outcome: 'founded' | 'failed_recruitment' | 'failed_purpose' | 'failed_pact';
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Not enough eligible allies | Encounter fails at Step 1, cooldown |
| Leader loses capability mid-encounter | Encounter can still succeed (capability checked at start) |
| Faction node creation fails | Log error, encounter reports failure, no graph mutation |
| Member already in another faction | Can still join (dual faction membership allowed, rank split) |

### Decision 5: Social Awareness in the Filter Pipeline

**Chosen:** The encounter awareness system (Agent Decision doc, Decision 2) extends to social encounters. Agents perceive social encounter opportunities based on their Heart and Shadow capability — the social/political reaches.

**How social awareness works:**

Social encounters target agents, not locations. But agents are *at* locations, so the awareness check becomes: "can I see the agents at that location?" rather than "can I see the encounters at that location?"

```
For each location within awareness range:
  agents = getAgentsAtLocation(locationId)
  For each agent at location:
    if I have a bond with this agent → always visible (regardless of reach)
    if no bond → visible based on Heart or Shadow capability distance check

    For each visible agent:
      Generate social encounter templates matching our pair's state
      Add to candidate list
```

**Bonds bypass distance for awareness.** If you have a `relates_to` edge with someone, you always know where they are (within reason — the bond is the connection). This creates the "I know where my ally is" and "I know where my rival is" behavior without needing a separate tracking system.

**Social density signals.** Locations with many agents generate more social encounters. A bustling marketplace with 5 agents offers more social options than a lonely outpost with 1. This naturally creates congregation at social hubs — agents seeking social encounters go where the people are.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `BOND_AWARENESS_ALWAYS` | true | Bonded agents are always visible regardless of distance |
| `SOCIAL_AWARENESS_REACH` | ['heart', 'shadow'] | Which reaches grant social perception of unbonded agents |
| `SOCIAL_DENSITY_BONUS` | 0.1 | Per-agent score bonus for locations with multiple agents (encourages congregation) |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent at location has no properties | Skip — can't generate social encounters for unknown agents |
| Bond edge exists but target location unknown | Skip awareness for this bond |

## Schema Changes Required

### relates_to Edge — Add Trust Property

```typescript
// Addition to existing relates_to edge properties
trust: number;  // -1.0 to +1.0, starts at 0.0 for new relationships
```

Existing edges get `trust` initialized from `sentiment × 0.5` (approximate migration from the existing sentiment data).

### Faction Node — Formalized Schema

```typescript
// Faction node properties (some exist on guilds, now formalized)
interface FactionProperties {
  actorType: 'faction';
  reachPreferences: Record<ReachDomain, number>;  // domain focus
  foundedTick: number;
  founderId: string;
  factionType: 'guild' | 'military' | 'religious' | 'political' | 'criminal' | 'emergent';
  // Optional
  territoryLocationIds?: string[];  // locations the faction claims
  axiologicalBias?: Partial<AxiologicalProfile>;  // collective value leanings
}
```

### member_of Edge — Add Rank

```typescript
// Addition to existing member_of edge properties
rank: number;       // 0.0 to 1.0 (1.0 = leader)
joinedTick: number;
role?: string;      // 'leader' | 'officer' | 'member' | 'recruit'
```

### Social Encounter Templates

New encounter templates with `targetCategories: ['agent']` for each social CRUD type. Initial set:

| Template | CRUD | ReachPrimary | Threat | Duration (total ticks) |
|----------|------|-------------|--------|----------------------|
| Forge Alliance | Create | heart | easy | 4 |
| Recruit to Faction | Create | heart | moderate | 5 |
| Investigate Reputation | Find | eye | trivial | 2 |
| Spy On | Find | shadow | easy | 3 |
| Negotiate Deal | Change | gold | easy | 3 |
| Persuade | Change | heart | moderate | 3 |
| Intimidate | Change | iron | moderate | 2 |
| Deceive | Change | shadow | moderate | 4 |
| Challenge to Duel | Destroy | iron | hard | 3 |
| Sabotage | Destroy | shadow | hard | 5 |
| Rob | Destroy | iron/shadow | moderate | 2 |
| Establish Patronage | Control | gold | moderate | 6 |
| Political Leverage | Control | shadow | hard | 5 |
| Found a Group | Create (self) | heart | moderate | 7 |

14 initial social encounter templates. Each uses the standard encounter template schema with social-specific motivations and outcomes.

## Architectural Dependencies

### 1. Deprecated Global Reputation Migration (Priority: High)

**Problem:** The existing `reputationScore` field on agents and `updateReputation()` / `decayReputation()` in `disposition.ts` need to be replaced by the graph-walked model. `applyDispositionModifier` needs to call `perceiveReputation()` instead of reading a flat field.

**Recommendation:** Keep the old field during migration (fail-soft reads it as fallback), add the new `perceiveReputation()` function, and update call sites incrementally.

### 2. Social Encounter Template Authoring (Priority: High — Blocks Social Behavior)

**Problem:** The 14 social encounter templates need to be authored with steps, difficulty curves, outcomes, motivations, and narrative prose. This is content authoring work using the existing encounter template schema.

### 3. Shortest-Path Utility for Reputation Walks (Priority: Medium)

**Problem:** The reputation walk needs a bounded shortest-path function on the graph filtered by edge type. The existing A* pathfinding works on location nodes. We need a general graph BFS/DFS limited to `relates_to` edges with a hop cap.

**Recommendation:** Implement `findShortestRelationshipPaths(sourceId, targetId, maxHops)` as a general graph utility. Bounded BFS with edge type filter. Returns all paths up to maxHops for trust multiplication.

## Performance Considerations

### Social Encounter Generation

Per agent per decision tick: scan visible agents (bounded by awareness range), generate up to `MAX_SOCIAL_CANDIDATES_PER_AGENT` templates per visible agent. With 5 visible agents × 3 templates = 15 social candidates, merged with ~40 location candidates. Total: ~55 candidates entering the scoring phase. Well within the performance budget.

### Reputation Walks

Per social encounter evaluation: BFS up to 4 hops on `relates_to` edges. Agents typically have 3-8 relationship edges. At 4 hops with branching factor ~5: worst case ~625 nodes visited. But most paths are short (1-2 hops) and the BFS terminates early on finding the target. Practical cost: ~20-50 edge reads per walk.

Per-tick caching: if the same pair is evaluated multiple times in one tick (unlikely but possible), the result is cached. Cache invalidates on tick boundary.

### Faction Formation

Rare event — most agents will never found a faction. When it happens, it's one encounter that creates a faction node + a few edges. Negligible cost.

## NFP Compliance Summary

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | Bond thresholds, trust rates, distortion factors, formation prerequisites — all named constants |
| 2 | Inspectability | PASS | Reputation walk trace shows full path, distortions, and perceived result. Social encounter trace shows bond modifier computation. Faction formation trace shows full founding context. |
| 3 | Determinism | PASS | Reputation walks are deterministic from graph state. Social encounter generation uses seeded PRNG. Trust updates are deterministic from interaction outcomes. |
| 4 | Fail-soft | PASS | Unknown reputation defaults to neutral. Missing bonds default to stranger. Missing trust defaults to 0.0. Failed faction formation has explicit cooldown. |
| 5 | Narrative over mechanical | PASS | Reputation is a story told through intermediaries, not a database field. Faction formation is a dramatic multi-step encounter. Trust asymmetry (slow to build, fast to lose) creates inherent narrative tension. |
| 6 | Additive over destructive | PASS | Adds trust to existing edge properties. Adds social encounter templates alongside existing ones. Graph-walked reputation replaces the flat score but the flat score remains as fallback during migration. |
| 7 | Performance budget | PASS | ~15 social candidates per agent per tick. Reputation walks bounded at 4 hops. Faction formation is rare. All within budget. |
