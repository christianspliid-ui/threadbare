# Social Systems Expansion — Milestone Design

> **Date:** 2026-03-31
> **Status:** Brainstorm / Preliminary Design
> **Milestone:** v1.2 Social Systems Expansion
> **Scope:** 5 interlocking expansions that transform social interaction from transactional exchanges into rich, world-shaping narrative scenes

---

## Problem Statement

The simulation has strong mechanical scaffolding — encounters resolve, factions track reputation, disposition models trust — but the social world feels **shallow** because of three structural gaps:

1. **Social encounters are thin.** 14 templates, all 2-step, all 1-on-1. No group dynamics, no persuasion arcs, no political intrigue scenes. They read like transactions, not conversations.
2. **Agents are reactive.** They select from existing encounters and move to them. They don't *make things happen* — build, found, sponsor, organize. The world acts on them more than they act on the world.
3. **No institutional creation.** Factions exist but agents can't found them. Locations exist but agents can't build new ones. There's no path from "ambitious merchant" to "merchant builds a trading post."

**The goal:** Make the social layer of the simulation the most compelling thing to read in the chronicle, and make agents feel like autonomous beings who shape the world through ambition, relationships, and collective action.

---

## Expansion A: Deep Social Scenes ("The Conversation System")

### Core Idea

Multi-step social encounters that feel like *scenes* — with dialogue beats, leverage, persuasion, counter-arguments, and real consequences. Replace the current 2-step "check → outcome" with 3-5 step sequences featuring **stake escalation** and **personality-driven resolution**.

### New Encounter Structure: Social Scenes

Social scenes follow a dramatic arc:

```
Step 1: Opening Gambit (establish the ask)
  → Reach: Heart/Shadow/Gold (depending on approach)
  → Sets initial leverage score

Step 2: Reading the Room (assess the target)
  → Reach: Eye (always — you can't influence what you don't understand)
  → Success: reveals target's disposition, ambitions, fears → unlocks better Step 3 options
  → Failure: misread → harder Step 3

Step 3: The Pitch (make your case)
  → Reach: varies by approach (Heart = inspire, Shadow = manipulate, Gold = bribe, Iron = threaten)
  → Difficulty modified by Step 2 success and relationship history
  → Sphere coloring: same pitch with Life sphere = "growth opportunity", with Entropy = "or else everything falls apart"

Step 4: The Counter (target pushes back — optional, triggered by partial success)
  → Target's personality drives the counter-argument
  → Agent must adapt approach or double down

Step 5: Resolution (deal struck, refused, or complicated)
  → Outcomes: full agreement, partial concession, refusal + relationship damage, betrayal reveal
```

### Key Mechanical Additions

- **Leverage system**: Social encounters track a `leverage` score (0-1) that accumulates across steps. Higher leverage = easier final pitch. Leverage comes from: knowing secrets (Eye), having wealth (Gold), having military power (Iron), having emotional bonds (Heart).
- **Personality-driven responses**: The *target* agent's personality (courage/prudence, loyalty/ambition, idealism/pragmatism) determines which counter-arguments they use and what approaches they're vulnerable to.
- **Relationship memory**: Social encounters reference the `relates_to` edge history. "You betrayed me 10 ticks ago" makes Heart approaches harder but Gold approaches ("I can make it worth your while") still viable.
- **Group social scenes**: Some scenes involve 3+ agents. A War Council has the faction leader + 2-4 advisors. A Trade Fair has 3-5 merchants. Resolution checks happen for each participant with different stakes.

### Proposed Template Categories (~30-40 new templates)

| Scene | Type | Steps | What Happens |
|-------|------|-------|-------------|
| **Tavern Negotiation** | trade | 3-4 | Two agents haggle over a deal — goods, information, or favors |
| **Political Audience** | lead | 4-5 | Agent petitions a faction leader for support/resources |
| **Recruitment Pitch** | hire | 3-4 | Agent tries to convince another to join their cause/party/faction |
| **Intimidation Confrontation** | lead | 3 | Power play — back down or escalate to violence |
| **Romantic Pursuit** | assist | 4-5 | Heart-driven bond formation with real relationship edges |
| **Mentorship Offer** | assist | 3 | Senior agent teaches junior — trait transfer mechanic |
| **Betrayal Reveal** | steal | 3-4 | Discovery that an ally has been working against you |
| **War Council** | lead | 4-5 | Multi-agent planning session for faction military action |
| **Trade Fair** | trade | 4 | Multi-agent market event with competing interests |
| **Religious Debate** | lead | 4 | Star/Veil reach contest over doctrinal truth |
| **Spy Debrief** | steal | 3 | Shadow agent reports findings — information as currency |
| **Oath Swearing** | assist | 3 | Formal binding commitment with mechanical consequence |
| **Trial & Judgment** | lead | 4-5 | Agent accused of crime — defense vs prosecution |
| **Peace Negotiation** | trade | 4-5 | Factions in conflict attempt ceasefire |
| **Gossip & Rumor** | explore | 2-3 | Information spread — creates new encounter awareness |
| **Confession Over Drinks** | assist | 3 | Reveals hidden trait or secret — vulnerability as trust |
| **Extortion** | steal | 3-4 | Shadow/Gold leverage over a target with a secret |
| **Eulogy / Memorial** | assist | 2-3 | Heart scene after agent death — faction morale effects |
| **Coronation / Ceremony** | lead | 3-4 | Public ritual with faction-wide morale effects |
| **Festival / Celebration** | assist | 3 | Multi-agent social event boosting settlement prosperity + bonds |

### Sphere Coloring

The same social scene produces different prose depending on sphere alignment:

| Approach | + Life | + Entropy | + Mind | + Force |
|----------|--------|-----------|--------|---------|
| **Persuade** | "Together we can grow stronger" | "Without this, everything decays" | "Logic demands cooperation" | "Join me or be left behind" |
| **Negotiate** | "A deal that nurtures both sides" | "Take what you can before it's gone" | "The optimal trade is clear" | "My terms are non-negotiable" |
| **Recruit** | "We need your gifts to flourish" | "The old order is rotting — build the new" | "You see the patterns too" | "Strength recognizes strength" |

### Design Questions (to resolve during implementation)

- How does leverage persist across encounter steps? (Property on EncounterProgress? New field?)
- Do group scenes need a new resolution model or can we compose from existing 1v1?
- Should social scenes generate `DilemmaEvent` entries for the disposition system?

---

## Expansion B: Agent Initiatives ("Agents Make Things Happen")

### Core Idea

A new tick phase — `phaseAgentInitiative` — where agents with sufficient capability + ambition + resources can *create new things in the world*.

### Initiative Gating

An agent's initiative capacity is gated by:
1. **Domain Capability tier** — you need to be competent enough (tier 4+ in the relevant Reach)
2. **Ambition alignment** — the initiative must serve an active ambition
3. **Resource threshold** — wealth, faction rank, or trait prerequisites
4. **Location suitability** — you can only build where it makes sense

### Initiative Types

| Initiative | Reach | Prerequisites | Duration | World Effect |
|-----------|-------|--------------|----------|-------------|
| **Build Structure** | Stone | Tier 4+ Stone, wealth >= 40, at settlement | 5-8 ticks | Creates sublocation node (mine, workshop, guild hall, temple, library, tavern) |
| **Found Settlement** | Stone + Heart | Tier 5+ Stone, tier 3+ Heart, at wilderness hex | 10-15 ticks | Creates new hamlet location node on hex |
| **Establish Trade Post** | Gold | Tier 4+ Gold, wealth >= 60, at any location | 5-7 ticks | Creates sublocation + trade route edges |
| **Sponsor Faction** | Gold | Tier 5+ Gold, wealth >= 80 | 3-5 ticks | Creates `sponsors` edge + wealth transfer to faction |
| **Found Organization** | Heart + relevant | Tier 5+ Heart, tier 4+ secondary reach | 8-12 ticks | Creates new faction node (type depends on secondary reach) |
| **Recruit Party** | Heart | Tier 3+ Heart, at tavern with other agents | 2-3 ticks | Creates `party` group node + `member_of` edges for willing agents |
| **Commission Quest** | Gold/Star | Tier 4+ Gold or Star, at faction guild hall | 2-3 ticks | Creates new encounter node visible to faction members |
| **Organize Festival** | Heart + Gold | Tier 3+ Heart, wealth >= 20, at settlement | 3-5 ticks | Creates temporary multi-agent social encounter, prosperity boost |
| **Establish Spy Network** | Shadow | Tier 5+ Shadow, at settlement | 5-8 ticks | Creates invisible sublocation + information edges |
| **Consecrate Holy Site** | Star | Tier 5+ Star, sphere-aligned | 5-8 ticks | Creates shrine sublocation, shifts hex sphere influence |
| **Fortify Position** | Stone + Iron | Tier 4+ Stone, tier 3+ Iron, at location | 5-8 ticks | Upgrades location defenses, creates fortification sublocation |
| **Write Treatise** | Eye | Tier 5+ Eye, at location with library | 5-8 ticks | Creates knowledge artifact node, spreads trait to readers |
| **Train Apprentice** | Any Reach | Tier 6+ in that Reach, target agent present | 5-10 ticks | Transfers trait/capability to target |

### Sphere Coloring of Initiatives

The same initiative looks different depending on sphere alignment:
- **Build Structure** + Life sphere = "living architecture that grows with the settlement"
- **Build Structure** + Entropy sphere = "a monument to impermanence, beautiful in its planned decay"
- **Build Structure** + Mind sphere = "a perfectly rational design, every angle calculated"
- **Build Structure** + Force sphere = "a fortress disguised as a building — every wall is a weapon"

### Initiative Evaluation Phase

1. For each agent at self-actualization+ in Maslow → check if any initiative type is available
2. Score initiatives by ambition alignment x capability x resource availability
3. Top-scoring initiative becomes a multi-tick action (3-15 ticks depending on scope)
4. On completion: execute GraphOps, spawn sublocations/factions/encounters, emit traces
5. Failure: partial completion, resource loss, reputation consequences

### Integration Points

- **Orchestrator:** New phase `phaseAgentInitiative` between agent decision and movement
- **HexMapV2:** New sublocation signifiers for built structures (mine icon, tavern icon, etc.)
- **Chronicle:** Initiative completion generates tier-2 narrative events
- **Action Targeting:** Built structures become action targets for the player
- **Encounter System:** Built structures spawn new encounter types at their location

### Design Questions

- How often should agents attempt initiatives? Every tick is too frequent. Cooldown? Inspiration resource?
- Should initiative failure consume resources or just time?
- How do built structures interact with settlement promotion? (Mine → prosperity boost → hamlet becomes town?)
- Can initiatives be contested or sabotaged mid-construction?

---

## Expansion C: Faction Agency ("Factions as Actors")

### Core Idea

Factions don't just track reputation and spawn ambitions — they actively *do things* through their collective will and leadership.

### Current Gaps

- Factions have ambitions but can only spawn armies (military ambitions) or passively influence
- No mechanism for factions to create quests, build infrastructure, negotiate treaties, or organize events
- Faction leadership is implicit (highest-ranked member) but leaders don't *lead*

### Faction Action Types

| Action | Trigger | World Effect |
|--------|---------|-------------|
| **Commission Quest** | Faction needs resources/territory/allies | Creates encounter node visible to members with quest rewards + reputation gain |
| **Build Guild Hall** | Faction reaches member threshold, no hall exists | Creates sublocation at strongest settlement — becomes faction HQ |
| **Establish Chapter** | Faction reaches regional spread threshold | Creates new sublocation in distant settlement — extends faction reach |
| **Declare Rivalry** | Two factions compete for same territory/resource | Creates `rivals` edge, unlocks conflict encounters, modifies member behavior |
| **Propose Alliance** | Shared enemy or complementary goals | Creates `allied_with` edge, shared encounter visibility, coordinated ambitions |
| **Sponsor Agent** | Faction has wealth, promising recruit identified | Grants wealth + equipment attachments to agent, creates `sponsored_by` edge |
| **Excommunicate** | Member betrayal or rival faction membership | Removes member, creates `hostile_to` edge, reputation consequences |
| **Hold Conclave** | Annual or triggered by crisis | Multi-agent social scene — faction debates direction, ambition shifts |
| **Issue Bounty** | Enemy agent threatens faction interests | Creates targeted encounter (bounty hunt) visible to members |
| **Territorial Claim** | Faction has military strength + settlement presence | Creates `claims` edge to location, triggers defense encounters |

### Faction Decision-Making

Factions get a lightweight "personality" derived from their type + current leadership:
- **Aggressive** factions (Mercenary Company, Underking Court) → favor military initiatives
- **Economic** factions (Merchant Consortium) → favor trade posts, sponsorship, bounties
- **Knowledge** factions (Arcane Circle, Lorekeepers) → favor research, treatises, conclaves
- **Religious** factions (Temple of Spheres, Holy Order) → favor consecration, pilgrimages, conversion

The faction leader's personality biases faction decisions. A cautious Merchant Guild leader favors defensive consolidation; a reckless one favors aggressive expansion.

### Integration Points

- **Orchestrator:** Expand `phaseFactionAmbitions` (currently runs every 5 ticks) with action evaluation
- **Encounter System:** Faction-commissioned quests feed into existing encounter pipeline
- **Social Encounters:** Conclaves, alliance negotiations are group social scenes (Expansion A)
- **Agent Initiatives:** Faction guild halls are built via agent initiative (Expansion B) triggered by faction action

### Design Questions

- Should factions get a limited action budget per cycle (like player essence)?
- How does faction wealth work? Sum of member wealth? Separate treasury?
- Can factions act without a leader present? Or only through their highest-ranked member?
- How do faction actions interact with the player's influence system?

---

## Expansion D: Tavern & Party System

### Core Idea

Taverns as social hub sublocations that enable party formation, and parties as a new group mechanic that changes how agents move, fight, and interact.

### Taverns

**Sublocation seeding:** Taverns spawn automatically during worldgen:
- Hamlet: 1 tavern
- Town: 1-2 taverns
- City: 2-3 taverns
- Capital: 3-4 taverns

**Social encounter magnet:** Agents at a tavern sublocation have:
- Increased colocation detection radius (see all agents at the parent location, not just sublocation)
- Boosted social encounter spawn rate (x1.5 - x2.0)
- Access to tavern-exclusive encounter templates

**Tavern-exclusive encounters:**

| Scene | Type | What Happens |
|-------|------|-------------|
| **Seeking Companions** | hire | Multi-agent party assembly (see below) |
| **Tavern Brawl** | duel | Two agents with negative sentiment, escalation from insult to fists |
| **Overheard Rumor** | explore | Eye check reveals information about nearby encounters, hidden locations, or agent secrets |
| **Drinking Contest** | duel | Flesh encounter. Winner gains reputation, loser gains "Hungover" condition |
| **Bardic Performance** | assist | Heart encounter. Success boosts tavern's settlement prosperity |
| **Shady Deal** | steal | Shadow + Gold. Fence goods, buy information, hire services |
| **Recruiting Drive** | hire | Faction member pitches membership to unaffiliated agents |
| **The Challenge** | duel | Formal duel challenge with witnesses. Refusal = reputation loss |
| **Confession Over Drinks** | assist | Reveals hidden trait or secret. Deepens bond but creates vulnerability |
| **Merchant's Pitch** | trade | Propose a business venture to another agent |
| **The Warning** | assist | Agent with Eye tier 4+ warns the tavern about approaching danger |

### Party Formation: "Seeking Companions"

**Trigger:** Agent with Heart tier 3+ and an unfulfilled ambition requiring capabilities they lack, at a tavern with 2+ other unattached agents.

```
Step 1: The Announcement (Heart)
  "{actor} stands on a chair in the {tavernName}, raising a mug to quiet the room.
   'I seek bold souls for a venture into {targetDescription}. Who among you has the courage?'"
  → Success: 3-4 candidates interested. Failure: 1-2 candidates, or laughed out.

Step 2: Sizing Each Other Up (Eye)
  "The interested parties eye each other warily. {actor} studies each face —
   the scarred sellsword nursing an ale, the robed figure in the corner..."
  → Reveals candidate capabilities, ambitions, disposition to agent and chronicle reader.

Step 3: The Negotiation (Gold/Heart/Shadow)
  "'What's the split?' the sellsword asks. 'And who leads?'"
  → Gold: promise wealth share. Heart: appeal to shared purpose. Shadow: selective truth.
  → Each candidate evaluates based on Maslow needs and disposition.

Step 4: The Handshake (Heart)
  "One by one, they clasp hands. {memberA} nods curtly. {memberB} raises her glass."
  → Creates party group node. member_of edges. Generated party name.
  → Party cohesion score based on resolution quality.

Step 5 (Optional): The Rejection
  "{rejector} pushes back. 'I've seen your kind before. All ambition, no plan.'"
  → Negative relates_to edge. Potential future rival or surprise ally.
```

### Party Mechanics

**Shared movement:** Party members move together. Leader decides movement candidates. Visually a cluster of agent dots on the hex map.

**Group encounters:** Parties can take on encounters that individuals can't. Resolution checks the *best* party member for each step's required Reach.

**Party dynamics as ongoing social encounters:**
- **Leadership disputes** — when two members have high ambition and disagree on direction
- **Trust tests** — dilemma events within the party (share loot equally or pocket the gem?)
- **Romance/rivalry** — Heart encounters between party members during downtime
- **The betrayal** — Shadow-aligned member working against the party
- **The sacrifice** — one member stays behind to hold the gate

**Party dissolution:** Parties dissolve when:
- Goal achieved (quest complete)
- Trust breaks down (too many defection events)
- Member death or departure
- Better opportunity draws members away

The dissolution itself is a social encounter — bittersweet farewell or bitter betrayal.

### Design Questions

- Is `party` a new graph node category or reuse the existing `group` category?
- How does party movement interact with the existing movement candidate system?
- What's the maximum party size? (Classic 4-6? Or variable based on leader capability?)
- Can the player's avatar join or form parties?

---

## Expansion E: Information Economy

### Core Idea

Information (rumors, secrets, favors) becomes a game resource that flows through social encounters, creating chains of consequence.

### Information Types

**Rumors** — Heard at taverns, spread via Gossip encounters.
- A rumor about a treasure cache creates encounter awareness for agents who hear it
- Rumors can be true, false, or partially true
- Spread mechanic: agents who hear rumors may retell them (Eye check to filter false ones)
- Decay: rumors lose potency over time (10-20 ticks)

**Secrets** — Revealed via Confession, Spy Debrief, or Eye encounters.
- Secrets are leverage — they enable Extortion encounters and modify social scene difficulty
- Secrets are tied to specific agents (graph edges: `knows_secret_of`)
- Revealing a secret in a social scene costs the secret (no longer leverage) but gains trust or damages the target

**Favors** — Created by Assist encounters and social rescue moments.
- `owes_favor` edge type with a `magnitude` property (0.0-1.0)
- Favors can be "called in" during social scenes — reduces difficulty of one step
- Unpaid favors create social tension; breaking a favor creates hostile sentiment
- High-ranking favors ("I saved your life") are more powerful than low-ranking ones ("I bought you a drink")

### Information Flow Chains

```
Tavern Rumor → "There's treasure in the old ruins"
  → Party Formation → agents assemble to explore
  → Dungeon Expedition → party clears the ruins
  → Treasure Discovery → agent gains wealth + artifact
  → Merchant Deal → agent sells artifact at trade fair
  → Faction Sponsorship → merchant uses wealth to sponsor faction
  → Political Power → faction claims territory near the ruins
```

Each link is a social or initiative scene readable in the chronicle.

### Implementation Shape

```typescript
// New edge types
type InformationEdge =
  | { type: 'knows_rumor'; properties: { rumorId: string; truthfulness: number; heardTick: number; source: string } }
  | { type: 'knows_secret_of'; properties: { secretType: string; magnitude: number; discoveredTick: number } }
  | { type: 'owes_favor'; properties: { magnitude: number; context: string; grantedTick: number } };
```

### Integration Points

- **Social encounters:** Leverage score modified by known secrets and owed favors
- **Disposition system:** Favor-breaking creates defection events
- **Encounter awareness:** Rumors create temporary encounter visibility
- **Agent decision:** Agents with unfulfilled favors may seek out the debtor

### Design Questions

- Should rumors be graph nodes (with edges to agents who know them) or properties on agents?
- How does the player interact with the information economy? Can they spread rumors? Reveal secrets?
- Should secret-keeping be an active cost (Shadow maintenance) or passive?
- What prevents information overload? (Max rumors per agent? Decay? Priority scoring?)

---

## System Connections Map

```
                    ┌──────────────────┐
                    │  E: Information  │
                    │     Economy      │
                    │  (rumors,secrets │
                    │   favors)        │
                    └────────┬─────────┘
                             │ modifies leverage
                             ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ D: Tavern &  │───▶│  A: Deep Social  │◀───│ C: Faction       │
│ Party System │    │     Scenes       │    │    Agency         │
│ (hubs,groups)│    │ (conversations)  │    │ (collective will) │
└──────┬───────┘    └────────┬─────────┘    └────────┬─────────┘
       │                     │                       │
       │ enables             │ produces              │ triggers
       │ group encounters    │ relationship edges     │ quests, guild halls
       ▼                     ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   B: Agent Initiatives                       │
│  (agents proactively create structures, organizations,       │
│   events in the world based on ambition + capability)        │
└──────────────────────────────────────────────────────────────┘
       │
       ▼ creates
┌──────────────────────────────────────────────────────────────┐
│                   Existing Systems                           │
│  World Graph, Encounter Pipeline, Maslow, Resolution,        │
│  Faction Reputation, Disposition, HexMapV2, Chronicle        │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Sequence (Recommended)

Ordered by dependency — each expansion builds on the previous:

1. **Expansion D: Tavern & Party System** — Foundation. Taverns as sublocations, party group nodes, shared movement. Enables all other social content by creating the *places* where social interaction happens.

2. **Expansion A: Deep Social Scenes** — Content. 30-40 new encounter templates with the leverage mechanic and personality-driven responses. Requires taverns (D) to exist as encounter locations.

3. **Expansion B: Agent Initiatives** — Agency. The `phaseAgentInitiative` tick phase, 13+ initiative types, sublocation creation. Requires social scenes (A) for initiative-related negotiation encounters.

4. **Expansion C: Faction Agency** — Scale. Faction action evaluation, quest commissioning, guild halls. Requires initiatives (B) for physical construction and social scenes (A) for conclaves.

5. **Expansion E: Information Economy** — Depth. Rumors, secrets, favors as game resources. Requires social scenes (A) and taverns (D) as primary information exchange venues. This is the "polish that makes everything sing" layer.

Each expansion can be broken into multiple implementation phases when we get to it.

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — All thresholds (tier requirements, wealth costs, initiative durations, leverage values) are named constants |
| 2 | Inspectability | PASS — Social scenes emit traces per step; initiatives emit start/progress/complete traces; information edges are graph-queryable |
| 3 | Determinism | PASS — All social resolution uses seeded sigmoid→d100; candidate scoring uses seeded PRNG for tie-breaking |
| 4 | Fail-soft | PASS — Missing tavern → social encounters still trigger at location level; missing party members → party downsizes gracefully; initiative prerequisites not met → skipped silently |
| 5 | Narrative > mechanics | PASS — Social scenes prioritize readable prose over optimal resolution; sphere coloring produces distinct narrative voices |
| 6 | Additive | PASS — All expansions add new node types, edge types, encounter templates, and tick phases. No existing systems are modified destructively |
| 7 | Performance budget | PASS with note — Initiative evaluation adds per-agent work each tick; should profile after implementation and consider cooldown/spotlight optimization |

---

## References

- Existing social encounters: `src/data/social-encounter-content.ts` (14 templates)
- Existing faction system: `src/data/faction-definitions.ts` (11 factions), `src/engine/factionReputation.ts`
- Existing disposition: `src/engine/disposition.ts`, `src/types/disposition.ts`
- Agent decision pipeline: `src/engine/phaseAgentDecision.ts`, `src/engine/actionCandidates.ts`
- Encounter system: `src/types/encounter.ts`, `src/engine/encounter.ts`
- Tick orchestrator: `src/engine/orchestrator.ts`
- Action templates: `src/data/unified-action-templates.ts`, `src/data/action-template-content.ts`
