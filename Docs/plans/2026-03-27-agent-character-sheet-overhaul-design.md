# Agent Character Sheet Overhaul — Audit & Tiered Revelation Design

> **Date:** 2026-03-27
> **Status:** Design
> **Scope:** UI overhaul of AgentProfileModal + narrative revelation system for progressive information disclosure
> **Depends on:** Familiarity system (✅), Encounter system (✅), Social Fabric design (✅), Faction Vertical Slice (✅)

---

## Problem Statement

The current agent character sheet (AgentProfileModal) was built incrementally as systems were added. It now has 15+ sections in a long scroll, mixes debug-level data with player-relevant narrative, and gates information purely by familiarity threshold — a mechanical unlock that doesn't feel like *learning about a person*. The sheet needs:

1. **Room for more information** — Systems like factions, ambitions, social fabric, tier promotion, hex state effects, and encounter history all produce player-relevant data that either isn't shown or is buried.
2. **Progressive narrative discovery** — Information should be *earned* through interaction, not unlocked by crossing a number threshold. The player should feel like they're getting to know someone.
3. **A coherent layout** — Sections should be organized by *what the player wants to know*, not by *which engine system produced the data*.

---

## Part 1: Information Audit

### What exists today (implemented)

Every piece of agent data currently tracked by the engine, organized by player relevance:

#### Identity & First Impression
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Name | Graph node | ✅ | Stranger |
| Portrait | Graph node → URL | ✅ (silhouette at stranger) | Recognised |
| Location | `located_at` edge | ✅ | Stranger |
| Archetype label | `narrativeArchetype` | ✅ | Recognised |
| Primary sphere | `primarySphere` | ✅ (color dot) | Recognised |
| Culture name | `belongs_to` edge | ✅ | Recognised |

#### Values & Personality
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Top 1 value | `axiologicalProfile` | ✅ | Recognised |
| Top 3 values | `axiologicalProfile` | ✅ | Known |
| Full 10 values | `axiologicalProfile` | ❌ (never shown) | — |
| Cooperation strategy | `cooperationStrategy` | ✅ | Intimate |
| Quotes | Generated from values+archetype | ✅ | Known |

#### Capabilities & Growth
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Top 1 domain (vague) | `domainCapabilities` | ✅ | Recognised |
| Top 3 domains | `domainCapabilities` | ✅ | Known |
| Full 9 domains (3×3 grid) | `domainCapabilities` | ✅ | Intimate |
| Influence tier | `influenceTier` | ✅ | Recognised |
| Tier promotion traits | `has_trait` edges | ❌ (subsumed in Traits) | Intimate |
| Capability growth curve | Computed | ❌ | — |
| Experience traits | `encounter_experience_*` | ❌ | — |

#### Social Relationships
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Top 3 bonds (name + sentiment) | `relates_to` edges | ✅ | Known |
| All bonds | `relates_to` edges | ❌ | — |
| Trust level per bond | `relates_to.trust` | ❌ | — |
| Bond basis (why they're connected) | `relates_to.basis` | ❌ | — |
| Faction name | `member_of` edge | ✅ | Recognised |
| Faction rank | `member_of.rank` | ✅ | Recognised |
| Faction reputation | `member_of.reputation` | ✅ (bar) | Known |
| Reputation score (global) | `reputationScore` | ✅ (word) | Intimate |

#### Current Activity & Intent
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Active ambitions | `pursues` edges | ✅ | Always (prototype) |
| Ambition milestones | `pursues` edge data | ✅ (progress bar) | Always (prototype) |
| Movement destination | `movementState` | ❌ | — |
| Current encounter | `encounterProgress` | ❌ | — |
| Target encounter | `movementState.targetEncounterId` | ❌ | — |

#### Possessions (7 subcategories)
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Arms (weapons) | `possesses`/`bonded_to` edges, subcategory `arms` | ✅ (lumped) | Intimate |
| Vestments (armor/clothing) | `possesses`/`bonded_to` edges, subcategory `vestments` | ✅ (lumped) | Intimate |
| Mounts & Beasts | `possesses`/`bonded_to` edges, subcategory `mounts_beasts` | ✅ (lumped) | Intimate |
| Tools & Instruments | `possesses`/`bonded_to` edges, subcategory `tools_instruments` | ✅ (lumped) | Intimate |
| Provisions | `possesses`/`bonded_to` edges, subcategory `provisions` | ✅ (lumped) | Intimate |
| Tomes & Scrolls | `possesses`/`bonded_to` edges, subcategory `tomes_scrolls` | ✅ (lumped) | Intimate |
| Relics & Talismans | `possesses`/`bonded_to` edges, subcategory `relics_talismans` | ✅ (lumped) | Intimate |
| Possession tier (1–4) | Edge + node properties | ✅ | Intimate |
| Loss condition | Node property `lossCondition` | ❌ | — |
| On-use triggers | Node property `onUseTriggers` | ❌ | — |
| Sphere affinity | Node property `sphereAffinity` | ❌ | — |
| Exact modifier values | Edge property `modifiers` | ❌ | — |
| Tier advancement potential | Computed from tier + action system | ❌ | — |

#### Conditions (4 subcategories)
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Wounds (physical damage) | `has_trait` edges, category `condition`, tag `wound` | ✅ | Recognised |
| Diseases | `has_trait` edges, category `condition`, tag `disease` | ✅ | Recognised |
| Blessings (positive supernatural) | `has_trait` edges, category `blessing` | ✅ (as "giftsAndBurdens") | Intimate |
| Curses (hidden negative) | `has_trait` edges, category `curse` | ✅ (as "giftsAndBurdens") | Intimate |
| Duration/countdown | Edge property `ticksRemaining` | ✅ | Recognised |

#### Bestowed Powers
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Power name + flavor | `has_trait` edges, category `bestowed` | ✅ (as "giftsAndBurdens") | Intimate |
| Granting entity | Trait node property `grantedBy` | ❌ | — |
| On-use triggers | Trait node property `onUseTriggers` | ❌ | — |
| Domain contributions | Trait node property `domainContributions` | ❌ | — |

#### Agreements (6 types)
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Agreement type (pact/debt/favour/oath/treaty/bargain) | `relates_to` edge, `agreement.type` | ✅ (as "giftsAndBurdens") | Intimate |
| Counterparty | `relates_to` edge target | ✅ | Intimate |
| Terms | `agreement.terms` | ❌ | — |
| Fulfillment condition | `agreement.fulfillmentCondition` | ❌ | — |
| Expiry countdown | `agreement.ticksRemaining` | ❌ | — |

#### Traits (non-attachment)
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Mastery traits | `has_trait` edges (category `mastery`) | ✅ | Intimate |
| Reputation traits | `has_trait` edges (category `reputation`) | ✅ | Intimate |
| Scar traits | `has_trait` edges (category `scar`) | ✅ | Intimate |
| Destiny traits | `has_trait` edges (category `destiny`) | ✅ | Intimate |

#### Backstory & History
| Data Point | Source | Currently Shown | Knowledge Gate |
|---|---|---|---|
| Tiered backstory strata | Generated per tier | ✅ | Recognised+ (tier-gated) |
| Backstory paragraph 1 | Generated | ✅ | Intimate |
| Full account | Generated | ✅ | Transparent (debug) |
| Interaction history | `InteractionRecord[]` | ✅ | Transparent (debug) |
| Dilemma history | `dilemmaHistory` | ❌ | — |

#### Environmental Context (not shown anywhere)
| Data Point | Source | Relevance |
|---|---|---|
| Location unrest level | Hex/location state | Affects agent morale |
| Hex corruption nearby | Hex state | Affects agent health/fear |
| Hex divine influence | Hex state | Affects agent capability |
| Magical saturation | Location state | Affects action success |
| Trade route access | Edge data | Affects agent wealth |

### What design docs plan (not yet implemented)

| System | New Information | Design Doc |
|---|---|---|
| **Social Fabric** | Trust as separate axis from sentiment; reputation walk (graph-based reputation perception with Shadow distortion); faction intelligence networks | 2026-03-18 social fabric |
| **Tier Promotion** | 45 promotion trait names (5 tiers × 9 reaches); capability growth curve visualization; domain mastery milestones | 2026-03-18 tier promotion |
| **Encounter Awareness** | Awareness range per reach; remote encounter capability; faction network intelligence access | 2026-03-18 agent decision |
| **Encounter Resolution** | Threat assessment (who do they fear); archived goals; encounter modifiers breakdown | 2026-03-18 encounter resolution |
| **Faction Vertical Slice** | Rank titles (Recruit → Guild Master); rank-gated quest access; faction reputation with decay; promotion encounters | 2026-03-27 faction vertical slice |

---

## Part 2: Character Sheet Redesign

### Design Principle: Tabs, Not Scroll

Replace the single scrolling modal with a **tabbed layout**. Each tab answers a distinct player question. The player picks what they want to know about; they're not forced to scroll past domains to find bonds.

### Tab Structure

| Tab | Player Question | Icon Concept |
|---|---|---|
| **Overview** | "Who is this person?" | Portrait/silhouette |
| **Prowess** | "What can they do?" | Sword/shield |
| **Bonds** | "Who do they know?" | Chain links |
| **Journey** | "What are they doing?" | Footprints/compass |
| **Chronicle** | "What has happened to them?" | Scroll/book |

Each tab has its own progressive revelation tiers — some sections within a tab are locked until the player learns more.

### Tab: Overview

The "first impression" tab. Always the default when opening the sheet.

**Layout:** Portrait (left), identity block (right), then sections below.

| Section | Content | Revelation Source |
|---|---|---|
| **Identity** | Name, archetype label, culture, primary sphere | Visible from first sighting |
| **Nature** | Top values with intensity words ("Deeply Merciful") | Revealed through *observation* — watching them act in encounters, or having other agents gossip |
| **Reputation** | Public reputation word + faction standing | Revealed through *social contact* — talking to people who know them, or hearing rumors |
| **Traits** | Visible trait badges (mastery, scars, titles) | Traits have individual visibility: `public` (always), `discoverable` (through interaction), `divine_only` (scry/Eye actions) |
| **Quotes** | Characteristic sayings | One quote per significant interaction |
| **Origin** | Backstory paragraph | Deep relationship only |

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `OVERVIEW_OBSERVATION_THRESHOLD` | 3 | Encounters observed before Nature section populates |
| `OVERVIEW_GOSSIP_THRESHOLD` | 2 | Social contacts about this agent before Reputation word appears |
| `OVERVIEW_QUOTE_PER_INTERACTION` | 1 | Quotes earned per significant interaction (capped at 5) |
| `OVERVIEW_BACKSTORY_INTERACTIONS` | 5 | Interactions before Origin paragraph unlocks |

### Tab: Prowess

What the agent can do — their capabilities, growth, and equipment.

| Section | Content | Revelation Source |
|---|---|---|
| **Domains** (3×3 grid) | Reach capabilities with descriptor words | Domains revealed *one at a time* as the player witnesses the agent act in that domain |
| **Growth** | Recent capability changes, tier promotion traits | Tier promotions are public events (visible to anyone present) |
| **Possessions** | Arms, vestments, mounts, tomes, relics, tools, provisions — grouped by subcategory, sorted by tier | Visibility per subcategory (see table below); tier + loss condition + on-use triggers shown per item |
| **Bestowed Powers** | Divine gifts with granting entity, mechanical summary, on-use triggers | `discoverable` visibility — revealed through divine sight (Eye/Veil), or when the power is used in an encounter the player witnesses |
| **Conditions** | Wounds, diseases (negative), blessings (positive), curses (hidden negative) | Wounds/diseases visible immediately (`public`); blessings visible at Known+; curses only through divine sight (`discoverable`) |

**Progressive domain revelation:** Instead of showing all 9 domains at once (current behavior at Intimate), each domain is individually tracked. The player sees a domain when they witness the agent *use* it — attempting an encounter in that reach, or being observed training/practicing. Unknown domains show as "???" with the reach name only.

**Possession subcategory visibility:**

| Subcategory | Visibility | Rationale |
|---|---|---|
| `arms` | First meeting | Weapons are worn openly |
| `vestments` | First meeting | Clothing/armor is visible |
| `mounts_beasts` | First meeting | Companion animals are obvious |
| `tools_instruments` | Co-location (2+ ticks) | Noticed when agent works |
| `provisions` | Co-location (5+ ticks) | Seen during rest/camp |
| `tomes_scrolls` | Known+ or encounter witness | Seen when agent reads/studies |
| `relics_talismans` | Intimate or divine sight | Hidden on person; powerful items may radiate aura detectable by Star/Veil |

**Possession detail levels:**

| Knowledge Level | What's Shown |
|---|---|
| Subcategory visible | Item name + tier indicator (mundane/storied/mythic/legendary) |
| Known+ | + flavor text + mechanical summary |
| Intimate+ | + loss condition (consumable? breakable? stealable?) + on-use triggers |
| Transparent / divine | + exact modifier values + sphere affinity |

**Attachment tier advancement visibility:** When an agent's possession advances tier (via enchant/empower), the advancement is visible to anyone co-located (visual flash/narrative event). The new tier is reflected on the possession card. Advancement *potential* (whether an item can be advanced further) is only visible at Intimate+.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `DOMAIN_REVEAL_ON_ENCOUNTER` | true | Reveal domain when agent attempts encounter in that reach |
| `DOMAIN_REVEAL_ON_OBSERVATION` | true | Reveal domain when player's agent is co-located during the attempt |
| `DOMAIN_REVEAL_ON_SCRY` | true | Eye divine action reveals all domains at once |
| `POSSESSION_VISIBLE_SUBCATEGORIES` | `['arms','vestments','mounts_beasts']` | Possession subcategories visible on first meeting |
| `POSSESSION_ACTIVITY_SUBCATEGORIES` | `['tools_instruments','provisions']` | Subcategories visible after co-location |
| `POSSESSION_HIDDEN_SUBCATEGORIES` | `['tomes_scrolls','relics_talismans']` | Subcategories requiring Known+ or divine sight |
| `POSSESSION_ACTIVITY_TICKS` | 2 | Co-location ticks before activity subcategories visible |
| `POSSESSION_PROVISIONS_TICKS` | 5 | Co-location ticks before provisions visible |
| `BESTOWED_POWER_REVEAL_ON_USE` | true | Reveal bestowed power when agent uses it in a witnessed encounter |
| `BESTOWED_POWER_REVEAL_ON_DIVINE` | true | Eye/Veil divine action reveals all bestowed powers |
| `OBVIOUS_CONDITION_CATEGORIES` | `['wound','disease']` | Condition categories visible to anyone (public) |
| `HIDDEN_CONDITION_CATEGORIES` | `['curse']` | Conditions requiring divine sight to detect |
| `POSITIVE_CONDITION_GATE` | `'known'` | Knowledge level for blessing visibility |

### Tab: Bonds

The agent's social world — who they know, how they feel, who they serve.

| Section | Content | Revelation Source |
|---|---|---|
| **Faction** | Faction name, rank title, reputation bar | Faction membership is public; rank visible after observation |
| **Relationships** | Bond cards: name, trust descriptor, sentiment, basis | Bonds revealed *one at a time* through witnessing interactions, gossip, or divine insight |
| **Agreements** | Pacts, debts, favours, oaths, treaties, bargains — shown as cards with counterparty, terms, and expiry | Agreements revealed per-agreement: public agreements (oaths, treaties) visible at Recognised+; private agreements (debts, bargains, favours) revealed through witnessing the agreement's creation, gossip from either party, or divine sight |
| **Disposition** | Cooperation strategy hint (narrative, not mechanical label) | Only after witnessing 3+ dilemma outcomes involving this agent |

**Bond revelation model:** The player doesn't see the full social graph. Instead:

- **Witnessed bond:** Player's avatar is present when two agents interact → bond revealed with sentiment.
- **Gossiped bond:** Another agent the player knows tells them about this relationship (via social encounter outcome) → bond revealed with basis but vague sentiment.
- **Divined bond:** Heart or Eye divine action → reveals all bonds at once, with trust values.
- **Inferred bond:** Faction co-membership → faction bond shown automatically.

Trust descriptors (narrative, never numeric):

| Trust Range | Descriptor |
|---|---|
| 0.8 – 1.0 | "Sworn ally" |
| 0.5 – 0.8 | "Trusted companion" |
| 0.2 – 0.5 | "Cautious acquaintance" |
| -0.2 – 0.2 | "Unknown quantity" |
| -0.5 – -0.2 | "Wary of" |
| -0.8 – -0.5 | "Hostile toward" |
| -1.0 – -0.8 | "Sworn enemy" |

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `BOND_REVEAL_ON_WITNESS` | true | Reveal bond when player observes interaction |
| `BOND_REVEAL_ON_GOSSIP` | true | Reveal bond through social encounter gossip outcome |
| `BOND_REVEAL_FACTION_AUTO` | true | Auto-reveal faction co-member bonds |
| `DISPOSITION_DILEMMA_THRESHOLD` | 3 | Dilemmas witnessed before disposition hint |
| `DISPOSITION_LABEL_MAP` | See below | Narrative labels for cooperation strategies |

Disposition narrative labels (never show mechanical names like "tit-for-tat"):

| Strategy | Narrative Label |
|---|---|
| `tit-for-tat` | "Repays in kind" |
| `grudger` | "Forgives slowly" |
| `pavlov` | "Learns from pain" |
| `always-cooperate` | "Trusting soul" |
| `always-defect` | "Looks out for themselves" |

### Tab: Journey

What the agent is doing right now and what they want — the dynamic, changing layer.

| Section | Content | Revelation Source |
|---|---|---|
| **Current Activity** | Movement destination, active encounter, idle state | Location visible if co-located or within awareness; encounter visible if same location |
| **Ambitions** | Active goals with milestone progress | Primary ambition revealed after 2+ interactions; secondary ambitions through deeper knowledge |
| **Threat Awareness** | Who/what this agent is worried about | Intimate knowledge only — requires deep relationship |
| **Environmental** | Location unrest, corruption, divine influence affecting this agent | Visible if player has hex awareness (fog of war revealed) |

**Activity revelation model:** The player doesn't omnisciently know what every agent is doing. Instead:

- **Co-located:** Full activity visible (destination, encounter, idle state).
- **Within awareness range:** Movement visible (you can see them traveling), but encounter details hidden.
- **Out of range:** Last known location and activity shown as stale (grayed out, with "last seen at [location] on tick [N]").
- **Faction intelligence:** If both player's avatar and this agent share a faction, faction-filtered activity visible regardless of range (rank-gated).

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `AMBITION_PRIMARY_INTERACTIONS` | 2 | Interactions before primary ambition revealed |
| `AMBITION_SECONDARY_INTERACTIONS` | 4 | Interactions before secondary ambitions revealed |
| `STALE_ACTIVITY_TICKS` | 15 | Ticks before out-of-range activity shows as stale |
| `FACTION_INTEL_MIN_RANK` | 0.3 | Minimum faction rank for intelligence sharing |
| `THREAT_REVEAL_INTERACTIONS` | 6 | Interactions before threat awareness visible |

### Tab: Chronicle

The agent's personal history — what has happened to them during this game.

| Section | Content | Revelation Source |
|---|---|---|
| **Timeline** | Significant events in reverse chronological order | Events the player *witnessed* or *heard about* |
| **Backstory Strata** | Layered backstory (current tiered system) | Unlocked by influence tier (existing mechanic) |
| **Completed Ambitions** | Archived goals with outcome | Visible if the ambition was known to the player |
| **Dilemma Record** | Past moral choices and outcomes | Visible if player witnessed the dilemma |

**Chronicle event sources — how events enter the timeline:**

| Source | What's Recorded | Player Must... |
|---|---|---|
| Co-location | Movement arrivals, encounters starting | Be at the same location |
| Divine observation | Any event at a hex the player can see | Have fog revealed |
| Gossip | Major events (tier promotions, faction changes) | Know an agent who knows this agent |
| Faction bulletin | Faction-relevant events | Share a faction with this agent |
| Public event | Deaths, births, major disasters | These are always public |

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `CHRONICLE_MAX_ENTRIES` | 30 | Max timeline entries per agent |
| `CHRONICLE_PUBLIC_EVENT_TYPES` | `['death','birth','tier_promotion','faction_founded']` | Events visible to all |
| `CHRONICLE_GOSSIP_SIGNIFICANCE` | 0.7 | Min event significance for gossip propagation |
| `BACKSTORY_STRATA_PER_TIER` | 1 | Backstory strata unlocked per influence tier (existing) |

---

## Part 3: Narrative Revelation System

### Core Concept: Knowledge Facets

Replace the single `knowledgeLevel` scalar with a **multi-dimensional knowledge model**. Instead of "you know this agent at level 3", the player has specific *facets* of knowledge about each agent, earned through different interactions.

```typescript
interface AgentKnowledge {
  /** Which axiological values have been observed in action */
  revealedValues: Set<AxiologicalPairId>;

  /** Which reach domains have been witnessed */
  revealedDomains: Set<ReachDomain>;

  /** Which bonds have been discovered, and how */
  revealedBonds: Map<string, BondRevelationSource>; // targetAgentId → source

  /** Which ambitions are known */
  revealedAmbitions: Set<string>; // ambition node IDs

  /** Chronicle events the player knows about */
  knownEvents: Set<string>; // event IDs

  /** Disposition observed (cooperation strategy hint) */
  dispositionRevealed: boolean;

  /** Number of significant interactions (drives backstory, quotes, etc.) */
  interactionDepth: number;

  /** Possession visibility — tracks hidden subcategory items individually */
  revealedPossessions: Set<string>; // possession node IDs (for hidden subcategories)

  /** Bestowed power visibility */
  revealedPowers: Set<string>; // power trait node IDs

  /** Hidden condition visibility (curses) */
  revealedConditions: Set<string>; // condition trait node IDs (for discoverable conditions)

  /** Agreement visibility — tracks private agreements individually */
  revealedAgreements: Set<string>; // relates_to edge IDs with agreement data

  /** Threat awareness unlocked */
  threatRevealed: boolean;

  /** Co-location tick counter (for possession subcategory gates) */
  coLocationTicks: number;
}

type BondRevelationSource = 'witnessed' | 'gossip' | 'divine' | 'faction';
```

### How Facets Are Earned

Each facet is earned through specific in-game actions — not by crossing a familiarity number.

| Facet | Earned By | Engine Hook |
|---|---|---|
| **Value revealed** | Witnessing the agent in an encounter that tests that value pair | `phaseEncounterResolution` → emit `value_revealed` when encounter reach maps to axiological pair |
| **Domain revealed** | Witnessing the agent attempt an encounter in that reach | `phaseEncounterProgressionV2` → emit `domain_revealed` when agent starts encounter step |
| **Bond revealed** | Witnessing two agents interact; gossip from a mutual contact; divine insight | `phaseDilemmaDetection` / `phaseColocationDetection` → emit `bond_revealed`; social encounter gossip outcome |
| **Ambition revealed** | Repeated interaction or observation; the agent volunteers their goal | `interactionDepth` threshold crossing; or specific encounter outcome text |
| **Chronicle event** | Being present, divine observation, gossip network, faction bulletin, public event | Multiple phases emit `TickEvent`; filter by player awareness at event location |
| **Disposition** | Witnessing 3+ dilemma outcomes | `phaseDilemmaDetection` → count player-witnessed dilemmas per agent |
| **Backstory stratum** | Influence tier milestone (existing) | `phaseInfluenceTierPromotion` (unchanged) |
| **Possession (visible subcategory)** | First meeting — arms, vestments, mounts shown automatically | Immediate on first sighting |
| **Possession (activity subcategory)** | Co-location for 2+ ticks — tools, instruments shown | `coLocationTicks` accumulator in `phaseInteractionDepth` |
| **Possession (hidden subcategory)** | Known+ familiarity, or divine sight, or witnessing use in encounter | `interactionDepth` threshold; or Eye/Veil action; or encounter observation |
| **Possession detail level** | Progressively richer per familiarity — name/tier → flavor/mechanics → loss condition/triggers → exact modifiers | Familiarity + `interactionDepth` thresholds |
| **Bestowed power** | Witnessing the power used in an encounter, or divine sight (Eye/Veil action) | `phaseEncounterResolution` → emit `power_revealed` when agent uses bestowed power; or divine action hook |
| **Condition (public)** | Wounds and diseases visible immediately to anyone | Automatic on sighting |
| **Condition (discoverable)** | Curses revealed through divine sight or Shadow reach action | Eye/Shadow/Veil divine action; or `interactionDepth` at Intimate+ |
| **Condition (positive)** | Blessings visible at Known+ familiarity | Familiarity threshold gate |
| **Agreement (public)** | Oaths and treaties visible at Recognised+ | Familiarity threshold; or witnessing the swearing ceremony |
| **Agreement (private)** | Debts, bargains, favours revealed by witnessing creation, gossip from either party, or divine sight | Social encounter gossip outcome; `phaseDilemmaDetection`; or Heart divine action |
| **Threat awareness** | Deep relationship (6+ interactions) | `interactionDepth` threshold crossing |

### Interaction Depth — The Accumulator

`interactionDepth` is the narrative equivalent of the old `familiarity` score, but it only increases through *meaningful* interactions:

| Interaction Type | Depth Increment | Notes |
|---|---|---|
| Dilemma with this agent | +2 | Most significant — direct moral engagement |
| Encounter at same location | +1 | Observing them in action |
| Divine action targeting this agent | +1 | Worship, blessing, curse, scry |
| Social encounter involving this agent | +1 | Gossip, trade, negotiation |
| Co-location (passive, per 10 ticks) | +0.5 | Slow ambient accumulation |
| Faction co-membership (per 20 ticks) | +0.25 | Very slow, represents ambient awareness |

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `DEPTH_DILEMMA` | 2.0 | Interaction depth per dilemma |
| `DEPTH_ENCOUNTER_OBSERVED` | 1.0 | Depth per encounter witnessed |
| `DEPTH_DIVINE_ACTION` | 1.0 | Depth per divine action on agent |
| `DEPTH_SOCIAL_ENCOUNTER` | 1.0 | Depth per social encounter |
| `DEPTH_COLOCATION_PER_TICK` | 0.05 | Passive co-location depth (0.5 per 10 ticks) |
| `DEPTH_FACTION_PER_TICK` | 0.0125 | Faction ambient depth (0.25 per 20 ticks) |

### Backward Compatibility with Familiarity

The existing `familiarityMap` and `KnowledgeLevel` system is not removed — it continues to function as the *base layer*. The new `AgentKnowledge` facets are an **additive overlay**:

- `KnowledgeLevel` still controls the *maximum* information tier (you can't have Intimate-level access to someone you've never met).
- `AgentKnowledge` facets control *which specific information within that tier* is actually revealed.
- Result: A player at "Known" familiarity who has witnessed 3 Iron encounters sees the Iron domain — but not Gold, even though "Known" would previously have shown top 3 domains.

This means the sheet feels richer and more personal. Two agents at the same familiarity level will have different information revealed based on *how* the player interacted with them.

### Revelation Events

When new information is revealed, the UI should celebrate it subtly:

| Event | UI Treatment | Notification |
|---|---|---|
| New value revealed | Value appears with brief gold shimmer in Nature section | Toast: "[Agent] showed their [value] nature" |
| New domain revealed | Domain cell animates from ??? to descriptor | Toast: "[Agent]'s skill in [reach] becomes apparent" |
| New bond revealed | Bond card slides in with connection animation | Chronicle entry |
| Ambition revealed | Ambition section populates with milestone bar | Toast: "[Agent] confides their ambition" |
| Backstory unlocked | New stratum appears with "✦ New" badge (existing) | Alert (existing) |
| Disposition hint | Subtle label appears in Bonds tab | No notification (ambient) |

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `REVELATION_SHIMMER_DURATION_MS` | 1500 | Gold shimmer animation duration |
| `REVELATION_NEW_BADGE_FADE_S` | 5 | "✦ New" badge fade duration (existing) |
| `REVELATION_TOAST_DURATION_MS` | 4000 | Toast notification display time |

---

## Part 4: Action Cards That Drive Revelation

The revelation system creates a gameplay loop: **interact with agents → learn about them → make better decisions → interact more meaningfully**. Action cards are the primary driver.

### Revelation-Generating Action Cards

| Action Card | Type | What It Reveals | Reach |
|---|---|---|---|
| **Observe** | Divine (low cost) | Reveals 1 domain + current activity | Eye |
| **Scry** | Divine (medium cost) | Reveals all domains + all bonds + hidden gear | Eye |
| **Whisper Insight** | Divine (low cost) | Reveals 1 value + disposition hint | Veil |
| **Dream Sending** | Divine (medium cost) | Reveals primary ambition + 1 threat | Veil / Star |
| **Inspire Encounter** | Divine (medium cost) | Forces two agents to interact → reveals bonds between them + values tested | Heart |
| **Commune** | Encounter (agent-initiated) | Deep interaction → +2 depth, reveals 2 values + 1 ambition | Heart / Eye |
| **Faction Mission** | Encounter (faction) | Co-faction activity → reveals domains used + faction bond | Varies |
| **Trade Negotiation** | Encounter (social) | Reveals Gold domain + 1 value + cooperation disposition | Gold |
| **Sparring/Contest** | Encounter (social) | Reveals Iron/Stone domain + 1 trait | Iron / Stone |
| **Ritual Participation** | Encounter (social) | Reveals Star/Veil domain + primary sphere affinity | Star / Veil |

### Passive Revelation Sources

Not everything requires an action card. Ambient revelation keeps the sheet filling in over time:

| Source | What It Reveals | Rate |
|---|---|---|
| Co-location | +0.05 depth/tick; any encounter at this location reveals that domain | Continuous while co-located |
| Chronicle events | Public events (tier promotions, deaths) add to chronicle automatically | Event-driven |
| Faction bulletin | Faction events for co-faction agents | Per-tick faction phase |
| Gossip propagation | Agents the player knows well share gossip about their bonds | Social encounter outcomes |

---

## Part 5: UI/Visibility Phase

### Player-Facing Display

| Surface | What's Shown | Component |
|---|---|---|
| **AgentProfileModal** (overhauled) | Tabbed layout with 5 tabs, facet-gated content per section | `AgentProfileModal.tsx` (rewrite) |
| **AgentDetailPanel** (sidebar) | Compact summary: portrait, name, top revealed values, current activity | `AgentDetailPanel.tsx` (update) |
| **HexMapV2 agent tooltip** | Name + archetype + current activity (if known) | Existing tooltip (extend) |
| **Notification toasts** | Revelation events ("X showed their Merciful nature") | Existing notification system |
| **Chronicle panel** | Agent-specific events filtered by player knowledge | Existing chronicle (filter extension) |

### Event Notifications

| Event Type | Channel | Glyph | Significance |
|---|---|---|---|
| `value_revealed` | Toast | ◈ (diamond) | 0.3 |
| `domain_revealed` | Toast | ⚔ (domain icon) | 0.3 |
| `bond_revealed` | Chronicle | 🔗 (chain) | 0.4 |
| `ambition_revealed` | Toast | ✦ (star) | 0.5 |
| `possession_revealed` | Toast | ⚙ (gear) | 0.3 |
| `power_revealed` | Alert | ✧ (sparkle) | 0.6 |
| `condition_revealed` | Toast | ⊘ (condition) | 0.4 |
| `agreement_revealed` | Chronicle | ⚖ (scales) | 0.5 |
| `backstory_unlocked` | Alert | 📖 (book) | 0.7 |
| `disposition_revealed` | Silent | — | 0.2 |
| `threat_revealed` | Toast | ⚠ (warning) | 0.5 |

### Debug Inspection

| Debug Panel Tab | New Content |
|---|---|
| **Agent Inspector** (existing) | Add: `AgentKnowledge` facet dump — all revealed values, domains, bonds, depths |
| **Revelation Log** (new sub-tab) | Chronological list of all revelation events with source and tick |
| **Knowledge Comparison** (new sub-tab) | Side-by-side: what the engine knows vs. what the player knows, highlighting gaps |

### Visual Presence on HexMapV2

No new map overlays required. Agent portraits already render at locations. The revelation system is purely informational — it changes what the *profile modal* shows, not what's on the map.

---

## Part 6: Tracing

### New Trace Types

```typescript
interface RevelationTrace {
  category: 'revelation';
  agentId: string;
  facetType: 'value' | 'domain' | 'bond' | 'ambition' | 'disposition' | 'possession' | 'power' | 'condition' | 'agreement' | 'threat' | 'chronicle_event';
  facetId: string; // e.g., "mercy_ruthlessness", "iron", bondTargetId, ambitionId
  source: 'encounter_observation' | 'divine_action' | 'social_gossip' | 'faction_intel' | 'co_location' | 'public_event' | 'dilemma_witness' | 'first_sighting' | 'power_use_witnessed' | 'agreement_witnessed';
  interactionDepthBefore: number;
  interactionDepthAfter: number;
  tick: number;
}

interface InteractionDepthTrace {
  category: 'interaction_depth';
  agentId: string;
  source: 'dilemma' | 'encounter_observed' | 'divine_action' | 'social_encounter' | 'co_location' | 'faction_ambient';
  depthBefore: number;
  depthAfter: number;
  tick: number;
}
```

### PRNG Callouts

The revelation system is **deterministic** — given the same player actions and game state, the same facets are revealed. No randomness in revelation itself (unlike encounter resolution). PRNG is only used in:

- Gossip propagation probability (which agents share which rumors) — uses game PRNG with `gossip_${tick}_${agentId}` seed key.
- Quote selection from the value-based quote pool — uses game PRNG with `quote_${agentId}_${interactionCount}` seed key.

---

## Part 7: Fail-Soft

| Failure Case | Fallback |
|---|---|
| `AgentKnowledge` not found for agent | Fall back to current `KnowledgeLevel` behavior (show everything gated by familiarity threshold) |
| Facet references deleted agent | Skip facet silently; no error |
| Revelation event for already-revealed facet | No-op; idempotent |
| `interactionDepth` exceeds any threshold | Cap at max meaningful value; no overflow behavior |
| Tab has zero revealed content | Show tab with "You haven't learned much about [name]'s [topic] yet" placeholder |
| Missing portrait at Recognised+ | Existing silhouette fallback (unchanged) |
| Chronicle entry references unknown event | Filter out; don't crash |

---

## Part 8: Wiring

### Per-Module Wiring

| Module | Orchestrator | UI Rendering | GameState | Traces | Debug | Prose | Player Controls |
|---|---|---|---|---|---|---|---|
| `AgentKnowledge` state | Read in existing phases that emit events | `AgentProfileModal` reads for gating | New `agentKnowledge: Map<string, AgentKnowledge>` on GameState | `RevelationTrace` | Agent Inspector sub-tab | N/A | N/A |
| `interactionDepth` accumulator | New sub-phase ~4.6 (`phaseInteractionDepth`) after dilemma detection | N/A (internal) | Updated in `agentKnowledge` map | `InteractionDepthTrace` | Shown in Agent Inspector | N/A | N/A |
| Revelation event emitter | Hooks into existing phases (encounter resolution, dilemma, colocation, etc.) | Feeds notification system | Emits `TickEvent` with `revelation_*` types | Category: `revelation` | Revelation Log sub-tab | Revelation toast messages via `enrichProse()` | N/A |
| Tabbed AgentProfileModal | N/A (UI only) | Replaces current scrolling modal in GameView | Reads `agentKnowledge` + existing `AgentDetail` | N/A | N/A | Tab content uses `enrichProse()` | Tab selection, section expand/collapse |
| Action cards (Observe, Scry, etc.) | Existing action resolution phases | ActionDrawer (existing) | Writes to `agentKnowledge` on resolution | Existing action traces | Existing action debug | Card descriptions via prose | Player selects cards from ActionDrawer |

### Orchestrator Phase Addition

| New Phase | Position | What It Does |
|---|---|---|
| `phaseInteractionDepth` | 4.6 (after dilemma detection) | Accumulates co-location and faction ambient depth; processes queued revelation events from earlier phases |

### GameState Extension

```typescript
// Added to GameState
agentKnowledge: Map<string, AgentKnowledge>; // ascendantId → agentId → facets
```

### GameView JSX Changes

- `AgentProfileModal` → rewrite with tab structure (same modal shell, new interior)
- `AgentDetailPanel` → update to read `agentKnowledge` for compact display
- No new modals or overlays

---

## Part 9: Implementation Phases

### Phase 1: Knowledge Facet Infrastructure (Engine)

- Define `AgentKnowledge` type
- Add `agentKnowledge` to GameState
- Implement `phaseInteractionDepth` orchestrator phase
- Wire revelation hooks into existing phases (encounter resolution, dilemma, colocation)
- Add `RevelationTrace` and `InteractionDepthTrace`
- Backward-compatible: if `agentKnowledge` is empty, fall back to current behavior
- **Test signal:** Run 30+ ticks, inspect traces for revelation events firing

### Phase 2: Tabbed Modal UI (Frontend)

- Rewrite `AgentProfileModal` interior with 5-tab layout
- Each tab reads from `AgentKnowledge` facets for gating
- Empty-state placeholders for unrevealed content
- Preserve all existing information display (just reorganized into tabs)
- **Test signal:** Visual verification at `?view=game`; all existing info still accessible

### Phase 3: Revelation Notifications & Polish (Frontend + Engine)

- Wire revelation events to notification system (toasts, chronicle entries)
- Add shimmer/animation for newly revealed facets
- Add Debug Panel sub-tabs (Revelation Log, Knowledge Comparison)
- Tune constants for pacing (too fast = no discovery feel; too slow = frustrating)
- **Test signal:** Play for 50+ ticks, confirm revelations feel meaningful and well-paced

### Phase 4: Action Cards for Discovery (Content + Engine)

- Add Observe, Scry, Whisper Insight, Dream Sending action card templates
- Wire card resolution to revelation system
- Add revelation outcomes to existing encounter templates (Commune, Trade, Sparring)
- **Test signal:** Use each action card, verify correct facets revealed

---

## NFP Compliance Summary

| Priority | NFP | Verdict |
|---|---|---|
| 1 | **Tunability** | PASS — 25+ named constants for all thresholds, rates, and pacing values |
| 2 | **Inspectability** | PASS — RevelationTrace + InteractionDepthTrace + 3 debug sub-tabs trace every knowledge change |
| 3 | **Determinism** | PASS — No randomness in revelation; PRNG only for gossip propagation and quote selection, both with deterministic seed keys |
| 4 | **Fail-soft** | PASS — Full fallback table; missing AgentKnowledge falls back to existing KnowledgeLevel behavior |
| 5 | **Narrative > mechanical** | PASS — Core design: revelation through story interaction, not number thresholds |
| 6 | **Additive** | PASS — New `agentKnowledge` field added to GameState; existing `familiarityMap` and `KnowledgeLevel` preserved as base layer |
| 7 | **Performance** | PASS with note — `AgentKnowledge` maps are per-agent (8–12 agents), not per-hex. Memory footprint negligible. Phase 4.6 does O(agents²) co-location check, same as existing colocation detection. |
