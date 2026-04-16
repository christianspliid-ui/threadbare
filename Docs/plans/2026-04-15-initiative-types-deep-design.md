# Initiative Types — Deep Design

> **Date:** 2026-04-15
> **Status:** Design Detail (supplements `2026-04-14-agent-initiatives-implementation.md`)
> **Issue:** THR-51
> **Purpose:** Detailed specification of all 6 initiative types — corrects errors in the implementation plan, specifies exact graph mutations, checkpoint narratives, and interaction patterns.

---

## Corrections to Implementation Plan

The implementation plan references types and edges that don't exist in the codebase:

| Plan Reference | Actual Codebase | Fix |
|---------------|----------------|-----|
| `axis: 'cooperation_independence'` | Not a real ValuePair | Use `loyalty_ambition` (left = loyalty = cooperation-adjacent) |
| `axis: 'faith_reason'` | Not a real ValuePair | Use `sacrifice_survival` (left = sacrifice = faith-adjacent) |
| `axis: 'cunning_honesty'` | Reversed in codebase | Use `honesty_cunning` (left = honesty, right = cunning) |
| `axis: 'generosity_frugality'` | Not a real ValuePair | Use `asceticism_extravagance` (right = extravagance = generosity-adjacent) |
| `bondType: 'allied_with'` | No `allied_with` edge type in schema | Use `relates_to` with high sentiment/strength/trust and `basis: 'sworn_ally'` |
| `edgeType: 'spy_network'` | No `spy_network` edge type | Use `relates_to` with `basis: 'espionage'` + `recordIntelligence()` |
| `sublocationTypeId: 'sublocation-type.shrine'` | No shrine sublocation type | Create new `sublocation-type.shrine` or use `sublocation-type.garden` |
| `factionDefId: 'faction.player-founded'` | No such definition | Need dynamic faction definition generation (see Found Organization below) |

All corrections are incorporated in the detailed specs below.

---

## Canonical Reference: Axiological Axes

For quick reference — the 9 value pair axes with their domain mapping:

| ValuePair | Left (-1.0) | Right (+1.0) | Domain |
|-----------|------------|--------------|--------|
| `mercy_ruthlessness` | Mercy | Ruthlessness | iron |
| `asceticism_extravagance` | Asceticism | Extravagance | gold |
| `honesty_cunning` | Honesty | Cunning | shadow |
| `tradition_novelty` | Tradition | Novelty | veil |
| `loyalty_ambition` | Loyalty | Ambition | heart |
| `revelation_discretion` | Revelation | Discretion | eye |
| `preservation_transformation` | Preservation | Transformation | stone |
| `sacrifice_survival` | Sacrifice | Survival | star |
| `courage_prudence` | Courage | Prudence | (meta) |

"Left" means negative values. "Right" means positive values. `direction: 'left'` in a prerequisite means the agent's axis value must be ≤ `-minStrength`.

---

## Initiative Type 1: Found Organization

### Fantasy

A wealthy, ambitious agent sees a gap in the world — no guild for their craft, no order for their faith, no company for their sword. They invest their savings, recruit a handful of allies, and raise a banner. The chronicle reads: *"Kael Thornweaver hammered a sign above the door of a rented hall in Thornfield: 'The Order of the Green Thread.' Three others signed the charter before nightfall."*

### Prerequisites

```typescript
{
  id: 'initiative.found-organization',
  name: 'Found Organization',
  category: 'founding',
  minWealth: 25,
  wealthCost: 20,
  requiredReaches: { heart: 2, gold: 1 },
  requiredAxiologicalBias: {
    axis: 'loyalty_ambition',
    direction: 'right',           // Ambitious agents found organizations
    minStrength: 0.3,
  },
  locationFilter: {
    requiredSubtype: 'town',      // town, city, or capital (resolved as "town or above")
    minPopulation: 4,             // Need people to recruit
  },
  baseDuration: 10,
  durationVariance: 2,
  checkInterval: 3,
}
```

**Why these gates:** Founding an organization requires charisma (heart 2), some wealth management skill (gold 1), personal ambition (loyalty_ambition right ≥ 0.3), enough capital (25 wealth, 20 spent), and a settlement large enough to sustain a guild hall (town+ with 4+ agents present).

### Progression (3-4 checkpoints over 10 ticks)

Each checkpoint represents a phase of founding:

| Checkpoint | Tick ~3 | Tick ~6 | Tick ~9 | Completion ~10 |
|-----------|---------|---------|---------|----------------|
| **Phase** | Charter Drafting | Recruitment | Hall Preparation | Grand Opening |
| **Check** | heart capability roll | heart + gold capability roll | gold capability roll | Automatic (duration elapsed) |
| **On Pass** | Progress normally | Progress normally | Progress normally | Execute outcomes |
| **On Fail** | +2 ticks delay, "The charter is rewritten..." | +3 ticks delay, "Recruits hesitate..." | +2 ticks delay, "The timber delivery is late..." | N/A |
| **Chronicle** | "X drafts a charter for a new order" | "X seeks allies for the venture" | "Hammers ring in a rented hall" | "A new banner rises: {factionName}" |

### Outcome: Dynamic Faction Generation

The founded faction is **not** a copy of an existing faction definition. Instead, it's generated from the founder's profile:

```typescript
function generateFoundedFaction(
  founder: GraphNode,
  location: GraphNode,
  graph: WorldGraph,
  rng: SeededRNG,
): { factionNode: GraphNode; definition: FactionDefinition }
```

**Faction type** derived from founder's strongest reach domain:
| Founder's Top Reach | Faction Type | Name Pattern |
|---------------------|-------------|-------------|
| iron | military | "The [Adjective] Company" |
| gold | guild (economic) | "The [Noun] Consortium" |
| shadow | criminal | "The [Noun] Network" |
| veil | guild (scholarly) | "The [Adjective] Circle" |
| heart | guild (social) | "The Order of [Noun]" |
| eye | guild (intelligence) | "The [Adjective] Watch" |
| stone | guild (builders) | "The [Noun] Fellowship" |
| star | religious | "The [Adjective] Covenant" |

**Name generation** uses the same seeded pattern as tavern names (THR-27): `{adjective} {noun}` from culture word pools, slotted into the pattern above.

**Generated FactionDefinition properties:**
- `reachWeights`: founder's normalized reach capabilities (their strengths become faction strengths)
- `locationTypes`: `[location.properties.locationSubtype]` (starts local)
- `rankTiers`: 3 tiers — Initiate (0), Member (0.3), Founder (0.8) — kept simple; can elaborate later
- `joinPrerequisites`: founder's top 2 reaches at tier 1 (faction attracts similar agents)
- `ambitionWeights`: derived from founder's axiological profile
- `reputationDecayPerTick`: 0.005 (standard)
- `joinEncounterTemplateId`: `'founded-faction.join'` (generic join template)
- `promotionEncounterTemplateId`: `'founded-faction.promotion'` (generic promotion template)
- `questTemplateIds`: `[]` (empty at start — faction acquires quest templates via THR-29 Commission Quest)
- `dispositions`: neutral (0) toward all existing factions initially

**Graph mutations on completion:**
1. Create faction actor node: `{ type: 'actor', actorType: 'faction', name: generatedName, properties: { factionDefId: generatedDef.id, foundedTick, founderId, factionType, wealth: 5 } }`
2. Add `member_of` edge: founder → faction, with `{ rank: 1.0, role: 'Founder', reputation: 1.0, joinedTick }`
3. Create guild hall sublocation via `createSublocation()`: `sublocation-type.guild-hall` at initiative's location
4. Add `controls` edge: faction → guild hall sublocation
5. Add `located_at` edge: faction → location
6. Register generated FactionDefinition in `FACTION_DEFINITIONS` map

**Interaction with other agents during initiative:** None during progression. On completion, agents at the same location with matching reach preferences (top 2 reaches overlap with faction's reach weights) gain a small scoring boost toward the faction's join encounter — the faction is "recruiting."

### Failure Modes

| Condition | Trigger | Narrative | Partial Outcome |
|-----------|---------|-----------|----------------|
| `wealth_below: 5` | Founder's wealth drops below 5 | "The funds have dried up. The charter lies unsigned." | None — total loss |
| `agent_leaves_location` | Founder moves to different location | "X departed before the guild hall was finished." | None |
| `agent_dies` | Founder killed | "The dream died with its dreamer." | None |

### Scoring

```typescript
motivations: [
  { left: 'loyalty_ambition', right: 'ambition', weight: 0.8 },  // Ambitious agents score highest
  { left: 'asceticism_extravagance', right: 'extravagance', weight: 0.3 }, // Wealth-minded helps
],
```

Ambition alignment bonus: agents with ambition milestone `agent_controls_location` or similar leadership ambitions get `+INITIATIVE_AMBITION_ALIGNMENT_BONUS`.

---

## Initiative Type 2: Recruit Party

### Fantasy

A social agent reaches out to nearby allies and acquaintances, forging bonds of mutual support. Not a formal organization — just a group of people who trust each other and will fight together. The chronicle reads: *"Serafina Windrider shared a meal with three strangers at The Crowned Stag. By dawn, they were no longer strangers."*

### Prerequisites

```typescript
{
  id: 'initiative.recruit-party',
  name: 'Recruit Party',
  category: 'social',
  minWealth: 5,
  wealthCost: 3,              // Buy drinks, fund the initial journey
  requiredReaches: { heart: 1 },
  requiredAxiologicalBias: {
    axis: 'loyalty_ambition',
    direction: 'left',           // Loyal agents recruit parties (they value bonds)
    minStrength: 0.2,
  },
  locationFilter: {
    minPopulation: 3,            // Need people nearby to recruit
  },
  baseDuration: 6,
  durationVariance: 2,
  checkInterval: 2,
}
```

**Why these gates:** Low bar — almost any social agent can recruit. Requires loyalty (not ambition — parties are about bonds, not power), a small investment, and enough people in the vicinity.

### Progression (2-3 checkpoints over 6 ticks)

| Checkpoint | Tick ~2 | Tick ~4 | Completion ~6 |
|-----------|---------|---------|---------------|
| **Phase** | Making Friends | Testing Trust | Sworn Companions |
| **Check** | heart capability roll | heart + eye capability roll | Automatic |
| **On Pass** | "X shares stories and finds common ground" | "A shared danger cements the bond" | Execute outcomes |
| **On Fail** | +2 ticks, "Conversations fizzle. X tries again." | +2 ticks, "Trust takes longer to build than hoped." | N/A |

### Outcome: Bond Creation

**Target selection:** Find up to 3 agents at the same location (or within 1 hex) who:
- Don't already have a strong `relates_to` edge (sentiment > 0.5) with the recruiter
- Don't have opposing axiological profiles (no value pair where both agents are at extreme opposites)
- Are not currently in an encounter or initiative

**Tiebreaker:** Agents with shared faction membership or ambition alignment preferred. Seeded PRNG for determinism.

**Graph mutations on completion (per recruited agent):**
1. Create or update `relates_to` edge (recruiter → target):
   ```typescript
   {
     sentiment: 0.6,           // Warm
     strength: 0.4,            // New but real
     basis: 'sworn_ally',      // Special basis for party bonds
     trust: 0.5,               // Moderate trust
   }
   ```
2. Create or update reciprocal `relates_to` edge (target → recruiter):
   ```typescript
   {
     sentiment: 0.5,
     strength: 0.3,
     basis: 'sworn_ally',
     trust: 0.4,               // Slightly less — recruiter was the initiator
   }
   ```
3. For each pair of recruits (not just recruiter↔recruit), create weak cross-bonds:
   ```typescript
   {
     sentiment: 0.3,
     strength: 0.2,
     basis: 'shared_party',
     trust: 0.2,
   }
   ```

**Mechanical effect:** Agents with `basis: 'sworn_ally'` or `basis: 'shared_party'` on their `relates_to` edge gain a scoring boost for cooperative encounters (assist, hire, lead) with each other. This feeds into THR-28's initial leverage computation for social scenes between party members.

### Failure Modes

| Condition | Trigger | Narrative | Partial Outcome |
|-----------|---------|-----------|----------------|
| `agent_dies` | Recruiter killed | "The campfire grows cold." | None |
| `min_population_drops` | Location population drops below 2 | "There's no one left to recruit." | Bonds with any agents already befriended (partial outcome: 1 bond instead of 3) |

### Scoring

```typescript
motivations: [
  { left: 'loyalty_ambition', right: 'loyalty', weight: 0.7 },  // Loyal agents recruit
  { left: 'courage_prudence', right: 'courage', weight: 0.3 },  // Brave enough to approach strangers
],
```

Social density bonus: +0.05 per agent at location beyond 3 (more people = better recruiting).

---

## Initiative Type 3: Organize Festival

### Fantasy

A charismatic agent with coin to spare throws a celebration — music, food, games, stories. For a few days the settlement buzzes with social energy. Old grudges soften over shared wine, new connections form in the crowd. The chronicle reads: *"Garek Ironhand opened his purse and his heart. For three days, Millhaven forgot its troubles."*

### Prerequisites

```typescript
{
  id: 'initiative.organize-festival',
  name: 'Organize Festival',
  category: 'social',
  minWealth: 12,
  wealthCost: 10,             // Food, entertainment, venue
  requiredReaches: { heart: 2 },
  requiredAxiologicalBias: {
    axis: 'asceticism_extravagance',
    direction: 'right',         // Extravagant/generous agents throw festivals
    minStrength: 0.2,
  },
  locationFilter: {
    minPopulation: 3,           // Need a crowd
  },
  baseDuration: 5,
  durationVariance: 1,
  checkInterval: 2,
}
```

**Why these gates:** Festivals require generosity (asceticism_extravagance right = extravagance), social skill (heart 2), capital (10 wealth), and enough people to celebrate with.

### Progression (2 checkpoints over 5 ticks)

| Checkpoint | Tick ~2 | Tick ~4 | Completion ~5 |
|-----------|---------|---------|---------------|
| **Phase** | Preparations | The Festival Begins | Festival Concludes |
| **Check** | gold capability roll (logistics) | heart capability roll (hosting) | Automatic |
| **On Pass** | "Supplies arrive. Musicians tune their instruments." | "The square fills with laughter and song." | Execute outcomes |
| **On Fail** | +1 tick, "A crate of wine goes missing." | +1 tick, "Rain dampens spirits but doesn't drown them." | N/A |

### Outcome: Temporary Location Boost

**Graph mutations on completion:**
1. Set location property: `properties.festivalBoost = 0.5`
2. Set location property: `properties.festivalExpiresAtTick = state.tick + FESTIVAL_DURATION`
3. Chronicle event: major — "A festival has begun in {location}!"

**Mechanical effects (active for `FESTIVAL_DURATION` = 10 ticks):**
- Social encounter generation at this location boosted by `festivalBoost` (same mechanism as `TAVERN_SOCIAL_ENCOUNTER_BOOST` from THR-27)
- All agents at the location get positive sentiment drift toward each other: `+0.02` per tick on existing `relates_to` edges (festival bonding)
- Agents within 2 hex distance have increased movement score toward festival location (attraction effect, similar to THR-27's Sanctify Tavern)

**Expiry mechanism:** In `phaseInitiativeProgress` (or a new `phaseTemporaryEffects`), check all locations for `festivalExpiresAtTick <= state.tick`. On expiry:
- Clear `festivalBoost` and `festivalExpiresAtTick` properties
- Chronicle event: minor — "The festival in {location} has ended. The square falls quiet."

**Side effect:** The festival organizer gains `+0.1` sentiment from all agents present at the location during the festival (they appreciate the generosity). This modifies existing `relates_to` edges or creates new ones with `basis: 'festival_host'`.

### Failure Modes

| Condition | Trigger | Narrative | Partial Outcome |
|-----------|---------|-----------|----------------|
| `wealth_below: 3` | Organizer runs out of money | "The funds dried up before the musicians arrived." | None |
| `agent_leaves_location` | Organizer leaves | "The host departed. The festival never materialized." | None |

### Scoring

```typescript
motivations: [
  { left: 'asceticism_extravagance', right: 'extravagance', weight: 0.7 },
  { left: 'loyalty_ambition', right: 'loyalty', weight: 0.3 },  // Community-minded
],
```

Social density bonus: +0.08 per agent at location beyond 3 (more people = bigger party).

---

## Initiative Type 4: Consecrate Holy Site

### Fantasy

A devout agent kneels at a place of power and begins the long work of consecration — prayers, offerings, rituals that transform mundane ground into sacred space. The sphere of the agent's faith colors the site. A Life-aligned shrine heals; an Entropy-aligned one whispers of endings. The chronicle reads: *"For seven days, Brother Aldric spoke the old words at the crossroads outside Thornfield. On the eighth day, the stones hummed."*

### Prerequisites

```typescript
{
  id: 'initiative.consecrate-holy-site',
  name: 'Consecrate Holy Site',
  category: 'religious',
  minWealth: 15,
  wealthCost: 12,              // Offerings, ritual materials
  requiredReaches: { star: 2, veil: 1 },  // Spiritual mastery + knowledge of tradition
  requiredAxiologicalBias: {
    axis: 'sacrifice_survival',
    direction: 'left',            // Self-sacrificing agents consecrate (sacrifice side)
    minStrength: 0.3,
  },
  baseDuration: 8,
  durationVariance: 2,
  checkInterval: 3,
}
```

**Why these gates:** Consecration requires spiritual power (star 2), knowledge of ritual (veil 1), willingness to sacrifice (sacrifice_survival left ≥ 0.3), and material investment. No location filter — holy sites can be consecrated anywhere, even in the wilderness. This is intentional — a shrine at a remote crossroads is narratively interesting.

### Progression (2-3 checkpoints over 8 ticks)

| Checkpoint | Tick ~3 | Tick ~6 | Completion ~8 |
|-----------|---------|---------|---------------|
| **Phase** | Ground Preparation | The Long Vigil | Consecration Complete |
| **Check** | veil capability roll (ritual knowledge) | star capability roll (spiritual power) | Automatic |
| **On Pass** | "The ground is cleared and the first stones laid." | "Three nights of prayer. The air changes." | Execute outcomes |
| **On Fail** | +2 ticks, "The old rites are harder to remember than expected." | +3 ticks, "The connection wavers. More prayer is needed." | N/A |

### Outcome: Sphere-Colored Shrine Sublocation

**Sphere determination:** The shrine's sphere alignment comes from the consecrator's dominant sphere affinity (from `sphereAffinity.ts` — `SPHERE_AXIOLOGICAL_MAP`). This means the shrine's nature reflects the agent who built it.

**New sublocation type needed:** `sublocation-type.shrine`

```typescript
{
  id: 'sublocation-type.shrine',
  name: 'Shrine',
  motivations: [
    { left: 'sacrifice_survival', right: 'sacrifice', weight: 0.8 },
    { left: 'tradition_novelty', right: 'tradition', weight: 0.5 },
  ],
}
```

**Graph mutations on completion:**
1. Create shrine sublocation via `createSublocation()`:
   ```typescript
   {
     sublocationTypeId: 'sublocation-type.shrine',
     name: generateShrineName(agent, sphere, rng),  // e.g., "Aldric's Shrine of Renewal"
     persistence: { type: 'permanent' },
     properties: {
       sphereAlignment: dominantSphere,  // e.g., 'life', 'entropy', 'mind'
       consecratedByAgentId: agent.id,
       consecratedAtTick: state.tick,
     }
   }
   ```
2. Add `constructed_by` edge: shrine → agent (standard from createSublocation)
3. Chronicle event: major — "A shrine to {sphere} has been consecrated at {location} by {agent}."

**Shrine name generation:**
| Sphere | Pattern | Example |
|--------|---------|---------|
| life | "{Agent}'s Garden of {LifeNoun}" | "Aldric's Garden of Renewal" |
| entropy | "The {EntropyAdj} Shrine" | "The Fading Shrine" |
| mind | "The {MindAdj} Sanctum" | "The Whispering Sanctum" |
| force | "{Agent}'s {ForceNoun}" | "Aldric's Bastion" |
| spirit | "The {SpiritAdj} Font" | "The Luminous Font" |
| matter | "The {MatterAdj} Cairn" | "The Unbroken Cairn" |

**Mechanical effects of shrine:**
- Agents at the shrine sublocation gain sphere-aligned encounter scoring: encounters matching the shrine's sphere get a `+SHRINE_SPHERE_BOOST` (0.15) scoring bonus
- Shrine attracts agents with matching sphere affinity (movement scoring bonus toward shrine location, like tavern attraction but weaker)
- If the shrine's sphere matches the player's ascendant sphere: the player gains `+1 essence per 10 ticks` while the shrine exists (passive income from aligned worship)

### Failure Modes

| Condition | Trigger | Narrative | Partial Outcome |
|-----------|---------|-----------|----------------|
| `agent_leaves_location` | Consecrator leaves | "The vigil was broken. The ground forgets." | None — half-consecrated ground has no effect |
| `agent_dies` | Consecrator killed | "The prayer died on their lips." | None |
| `location_destroyed` | Location razed | "The sacred ground was desecrated before it was finished." | None |

---

## Initiative Type 5: Commission Quest

### Fantasy

A wealthy agent with a problem hires others to solve it. They post a notice, spread word, offer a reward. The quest exists as a standing offer — any capable agent nearby can attempt it. The chronicle reads: *"Miravel the Merchant nailed a notice to the board at The Rusty Anchor: 'Escort my caravan to Ashgrove. Twenty gold for the brave.'"*

### Prerequisites

```typescript
{
  id: 'initiative.commission-quest',
  name: 'Commission Quest',
  category: 'quest',
  minWealth: 10,
  wealthCost: 8,               // The reward money, held in escrow
  requiredReaches: { gold: 1 },  // Basic commercial sense
  requiredAxiologicalBias: {
    axis: 'loyalty_ambition',
    direction: 'right',           // Ambitious agents commission quests (they want things done)
    minStrength: 0.15,
  },
  baseDuration: 4,
  durationVariance: 1,
  checkInterval: 2,
}
```

**Why these gates:** Low bar — any agent with money and a goal can commission a quest. The quest itself is the interesting part, not the commissioning.

### Progression (1-2 checkpoints over 4 ticks)

| Checkpoint | Tick ~2 | Completion ~4 |
|-----------|---------|---------------|
| **Phase** | Writing the Notice | Quest Posted |
| **Check** | gold capability roll (terms, reward) | Automatic |
| **On Pass** | "The terms are fair. The notice goes up." | Execute outcomes |
| **On Fail** | +1 tick, "The first draft was too vague. Rewritten." | N/A |

### Outcome: Dynamic Quest Encounter

The commissioned quest is NOT a fixed template. It's generated from the commissioner's context:

```typescript
function generateCommissionedQuest(
  commissioner: GraphNode,
  location: GraphNode,
  graph: WorldGraph,
  rng: SeededRNG,
): EncounterTemplate
```

**Quest type selection** based on commissioner's situation:

| Commissioner Context | Quest Type | Example |
|---------------------|-----------|---------|
| Has rival (`relates_to` with sentiment < -0.3) | Investigation / Subterfuge | "Find evidence of {rival}'s dealings" |
| Has faction membership | Faction-aligned task | "Retrieve {artifact} for the {faction}" |
| At a location with low prosperity | Protection / Escort | "Guard the trade road to {destination}" |
| High wealth, high ambition | Acquisition | "Acquire the {rare item} from {location}" |
| Agent's top reach is eye | Scouting / Intelligence | "Map the approaches to {location}" |
| Fallback | Generic explore/acquire | "Clear the {danger} near {location}" |

**Graph mutations on completion:**
1. Create quest encounter node: a one-off `EncounterTemplate` with 2-3 steps, threat based on quest reward
2. Attach encounter to commissioner's location via `encounter_at` edge
3. Set encounter property: `commissionerId: agent.id`, `reward: wealthCost * 0.8` (commissioner keeps 20% as overhead/profit)
4. Set encounter property: `expiresAtTick: state.tick + QUEST_EXPIRY_TICKS` (30 ticks to complete)
5. Chronicle event: minor — "A quest has been posted at {location}: {questDescription}"

**Quest lifecycle:**
- Any agent at the location can discover and attempt the quest through normal encounter scoring
- On quest completion by another agent: that agent gains wealth (`reward`), commissioner gains a `relates_to` edge with the completer (`basis: 'employer'`, moderate trust)
- On quest expiry: notice taken down, commissioner's escrowed wealth returned (50% — some was spent on posting)

### Failure Modes

| Condition | Trigger | Narrative | Partial Outcome |
|-----------|---------|-----------|----------------|
| `wealth_below: 2` | Commissioner goes broke | "No coin for the reward. The notice is torn down." | None |
| `agent_dies` | Commissioner killed | "The patron of the quest is dead. No one will pay." | Quest cancels if unstarted. If in progress, quest reward comes from commissioner's estate (remaining wealth). |

---

## Initiative Type 6: Establish Spy Network

### Fantasy

A cunning agent plants eyes and ears throughout a settlement — bribing servants, cultivating informants, setting up dead drops. The network doesn't do anything visible, but it quietly generates intelligence about agents and factions at the location. The chronicle reads: *"No one noticed when Shade Blackwood started buying drinks for the innkeeper's boy. They noticed even less when she stopped."*

### Prerequisites

```typescript
{
  id: 'initiative.establish-spy-network',
  name: 'Establish Spy Network',
  category: 'espionage',
  minWealth: 20,
  wealthCost: 18,              // Bribes, safe houses, dead drops
  requiredReaches: { shadow: 3, eye: 2 }, // High cunning + observation
  requiredAxiologicalBias: {
    axis: 'honesty_cunning',
    direction: 'right',           // Cunning agents (right side of honesty_cunning)
    minStrength: 0.4,
  },
  locationFilter: {
    requiredSubtype: 'city',      // City or capital only — too few people in towns to hide a network
  },
  baseDuration: 10,
  durationVariance: 2,
  checkInterval: 3,
}
```

**Why these gates:** Highest bar of all initiatives. Requires exceptional cunning (shadow 3), strong observation (eye 2), serious investment (18 wealth), a large settlement (city+), and a genuinely cunning personality. This ensures spy networks are rare — maybe 1-2 in a typical game.

### Progression (3 checkpoints over 10 ticks)

| Checkpoint | Tick ~3 | Tick ~6 | Tick ~9 | Completion ~10 |
|-----------|---------|---------|---------|----------------|
| **Phase** | Identifying Assets | Recruiting Informants | Testing the Network | Operational |
| **Check** | eye capability roll | shadow + gold capability roll | shadow capability roll | Automatic |
| **On Pass** | "X watches. Notes who talks, who listens, who lies." | "Gold changes hands in dark corners." | "A test message arrives. The network works." | Execute outcomes |
| **On Fail** | +2 ticks, "The city is harder to read than expected." | +3 ticks, "A potential informant gets cold feet." | +2 ticks, "A message goes astray. Adjustments needed." | N/A |

### Outcome: Intelligence-Generating Edge

**Graph mutations on completion:**
1. Create `relates_to` edge (agent → location):
   ```typescript
   {
     sentiment: 0.0,             // Business relationship
     strength: 0.6,              // Strong operational connection
     basis: 'espionage',         // Special basis marking this as spy network
     trust: 0.3,                 // Moderate (spies don't fully trust anyone)
     networkEstablishedTick: state.tick,
     networkActive: true,
   }
   ```
2. Record intelligence via `recordIntelligence()`:
   ```typescript
   recordIntelligence(graph, agent.id, location.id, 'spy_network_established', state.tick)
   ```
3. Chronicle event: none (covert — spy networks don't announce themselves). Only appears in traces and debug panel.

**Ongoing intelligence generation (in `phaseInitiativeProgress` or separate phase):**

Every `SPY_NETWORK_INTEL_INTERVAL` (5) ticks, for each agent with an active spy network edge:
- Scan agents at the network's location
- For each agent, roll `shadow` capability vs target's `eye` capability (detection avoidance)
- On success: generate one intelligence fact about the target, stored as a `knows_secret_of` edge (integrates with THR-30 Secrets & Favors)
  - Secret type distribution: `hidden_allegiance` (30%), `secret_ambition` (25%), `financial_secret` (20%), `hidden_weakness` (15%), `past_crime` (10%)
  - Magnitude: 0.2–0.5 (spy networks discover moderate secrets, not devastating ones)
- On failure: no intelligence this cycle (target was too careful)
- Small chance (`SPY_NETWORK_DETECTION_CHANCE` = 0.05) that the scan is detected: target gains `relates_to` edge toward spy with negative sentiment (`basis: 'suspected_spy'`)

**Network maintenance:** Every `SPY_NETWORK_DECAY_INTERVAL` (15) ticks, spy network costs `SPY_NETWORK_UPKEEP` (2) wealth. If agent can't pay, network degrades: `strength` on the edge decreases by 0.1. At `strength < 0.2`, network dissolves (edge removed, chronicle: "A network of whispers falls silent.").

### Failure Modes

| Condition | Trigger | Narrative | Partial Outcome |
|-----------|---------|-----------|----------------|
| `wealth_below: 5` | Agent goes broke during setup | "Can't pay the informants. They scatter." | None |
| `agent_leaves_location` | Agent leaves city | "The spymaster left. The network withers." | None (network requires local presence to establish) |
| `disrupted_by_encounter: ['investigation', 'interrogation']` | Agent investigated/interrogated | "Someone asked the right questions." | None — network compromised before completion |
| `agent_dies` | Agent killed | "Dead spies tell no tales." | None |

---

## Cross-Initiative Interactions

The 6 types aren't isolated — they create narrative chains:

| Chain | Story |
|-------|-------|
| Recruit Party → Found Organization | Agent builds a core group, then formalizes it into a faction |
| Commission Quest → Recruit Party | Agent commissions a quest, then bonds with the agent who completed it |
| Consecrate Holy Site → Organize Festival | Agent builds a shrine, then celebrates its consecration |
| Establish Spy Network → Commission Quest | Agent discovers intelligence, then commissions a quest based on what they learned |
| Found Organization → Commission Quest | New faction founder commissions quests to build the faction's reputation |
| Organize Festival → Recruit Party | Festival creates social proximity; recruitment follows |

These chains emerge naturally from the scoring system — completing one initiative changes the agent's state (new bonds, new faction, new location properties) which shifts the scoring for subsequent initiatives.

---

## Initiative Frequency Tuning

**Problem:** If initiative scoring is too high, agents spend all their time on projects instead of having encounters. If too low, initiatives never fire.

**Target frequency:** ~1 initiative per 30-50 ticks per qualifying agent. Most agents (low wealth, low capability) never qualify. The 2-3 wealthiest, most capable agents in the game should be the primary initiative-takers.

**Tuning levers:**
- `INITIATIVE_MAX_SCORE = 0.6` — hard cap prevents domination
- `INITIATIVE_COOLDOWN_TICKS = 20` — minimum gap between initiatives
- `INITIATIVE_MIN_WEALTH_FLOOR = 5` — excludes poor agents entirely
- Wealth cost is self-limiting: founding costs 20 wealth, which takes many ticks of encounters to re-accumulate
- Axiological requirements filter most agents: `minStrength: 0.3+` eliminates agents without strong personality leanings

**Expected distribution in a typical game (medium map, 20-30 agents, 100 ticks):**
- 0-2 Founded Organizations (only the wealthiest ambitious agent in a populated town)
- 2-4 Recruited Parties (most social agents at populated locations)
- 1-3 Organized Festivals (generous agents at populated locations)
- 0-1 Consecrated Shrines (rare — needs star 2 + veil 1 + devotion)
- 2-5 Commissioned Quests (most common — low bar)
- 0-1 Spy Networks (rarest — needs shadow 3 + eye 2 + cunning + city)
