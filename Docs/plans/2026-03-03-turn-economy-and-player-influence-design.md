# Turn Economy & Player Influence System — Design Document

**Date:** 2026-03-03
**Status:** Draft
**Origin:** Brainstorm session resolving open questions from discovery backlog (DISC-01, DISC-02, DISC-03, DISC-04, DISC-07, DISC-09, DISC-12, DISC-16, DISC-17)
**Related:** Actor CRUD Action System, Trait System, Performance Scaling, Cosmological Taxonomy

---

## 1. Overview

This document consolidates all decisions from the 2026-03-03 brainstorm session covering the turn/tick model, action economy, player influence system, contested actions, and trait conflict resolution. These form the **core gameplay loop** — how the simulation advances, how actors make decisions, and how the player interacts with it all.

### 1.1 Design Principles

- **Constraint drives creativity:** The player is a godling with limited divine bandwidth. Interesting decisions come from choosing *which* stories to invest in, not from having unlimited power.
- **Work with actors, not against them:** Influencing actors aligned with their nature is cheap; forcing them against their nature is expensive and risky. The player learns to read personalities and work with them.
- **Simulate to tell stories:** All systems exist to produce coherent, interesting narrative. Accuracy is secondary to dramatic impact.
- **Same system for everyone:** The player's Ascendant is an actor in the graph, using the same action system as every other actor. Influence Essence is the meta-layer on top.

---

## 2. The Tick Model

### 2.1 Time Structure

The simulation uses a **daily tick** system with variable speed controls, inspired by Paradox grand strategy games (EU4, Stellaris).

| Concept | Value |
|---------|-------|
| Minimum tick | 1 day |
| Ticks per season | ~90 (3 months) |
| Ticks per year | ~360 |
| Player speed controls | Pause, 1x, 2x, 3x, 5x |

### 2.2 Speed Controls

```
⏸  Pause    — Issue commands, review actors, manipulate motivations
▶  1x       — ~1 day/second (follow individual adventures)
▶▶ 2x       — ~3 days/second (watch events unfold)
▶▶▶ 3x      — ~1 week/second (regional-scale observation)
▶▶▶▶ 5x     — ~2 weeks/second (empire-scale fast-forward)
```

**Auto-pause triggers:**
- Major events near player's focus (contested actions, actor deaths, prophecy fulfillment)
- Actions completing for Tier 1 actors
- Player's avatar threatened or engaged
- Seasonal transitions (narrative rhythm checkpoint)
- New actors discovered in player's vicinity

### 2.3 How Actions Map to Ticks

Actions have duration ranges (from the CRUD Action System design). These map to ticks:

| Duration Category | Tick Range | Effect |
|-------------------|-----------|--------|
| **Days** | 1–7 ticks | Resolves quickly, often within a single speed-1 session |
| **Weeks** | 7–30 ticks | Visible progress bar, resolves within a season |
| **Months** | 30–90 ticks | Major undertaking, spans a significant portion of a season |
| **A Season** | 60–120 ticks | Transformative effort, nearly an entire season |

Actions in progress advance their progress counter by 1 each tick. When the counter reaches the action's duration, the action resolves (success/failure roll, graph mutations applied). This is the **momentum model** — ongoing actions progress automatically, and the expensive "choose new action" logic only fires when an action completes.

### 2.4 Performance Implications

At high speeds, the system processes many ticks per second. Since most actors have multi-week actions, the majority of ticks are cheap: just increment progress counters. The expensive decision logic (action scoring, trait evaluation) only fires when an actor's current action completes — typically every 30–90 ticks. This makes the daily tick model *cheaper* per unit of game-time than a seasonal model where every actor decides every turn.

See Performance Scaling Design for how the fidelity tier system interacts with tick processing.

---

## 3. Action Economy

### 3.1 Action Points by Actor Type

Each actor type has a base number of Action Points (AP) that determines how many concurrent actions they can sustain. AP represents bandwidth, not discrete turn-by-turn choices — an actor with 2 AP can have 2 actions in progress simultaneously.

| Actor Type | Base AP | Natural Scale | Notes |
|------------|---------|--------------|-------|
| God / Primordial | 1 | Cosmic | One massive action at a time; glacial but world-shaping |
| Ascendant / Demigod | 1–2 | Regional | Player's Ascendant operates at this tier |
| Faction / Organization | 2–3 | Regional → Local | Can run multiple operations simultaneously |
| Culture / Nation | 1–2 | Regional | Slow, deliberate civilizational momentum |
| Group / Party | 1–2 | Local → Personal | Small, focused; one mission at a time |
| Individual | 1 | Local → Personal | One thing at a time, but quick resolution |

**AP regeneration:** When an action completes, the AP slot frees up. The actor's autonomous motivation engine immediately begins selecting the next action for that slot. There is no "idle" state — actors always have intent.

### 3.2 AP is Not Player Currency

The player does **not** spend AP. The player spends **Influence Essence** (sphere-typed divine currency) to manipulate what actors do with *their own* AP. This separation is fundamental:

- AI actors manage their own AP autonomously
- The player manipulates the *decision-making process*, not the action execution
- The player's Ascendant also has AP (as a regular actor) for direct actions

---

## 4. The Player Influence System

### 4.1 The Godling

The player is a nascent divine being — a godling. They experience the world through:

1. **Their Avatar** — a mortal form walking the hex map (an old wizard, a wandering shaman, a veiled oracle — chosen at creation). The avatar is a regular Individual actor node with a special `avatar_of` edge to the Godling entity. The avatar provides line-of-sight, local action capability, and a physical anchor in the world.

2. **Divine Influence** — the meta-layer. The godling accumulates Influence Essence and spends it to discover, recruit, and manipulate actors across the world.

**Loss condition:** The avatar is destroyed, the godling loses all power and influence. They are forgotten. (Malazan-style: a god without worshippers or anchor fades from existence.)

### 4.2 Influence Essence

The godling's primary resource. It accumulates passively and is spent on all divine interactions.

**Base generation:** +1 Essence per tick (day).

**Generation scaling:** Essence generation increases through three growth paths:

| Growth Path | Mechanism | Gameplay Pattern |
|-------------|-----------|-----------------|
| **Cult growth** | More worshippers (actors with `worships` edge to godling) → more essence per tick | Social/political — build a religion, convert settlements |
| **Places of power** | Control narratively significant locations (The Throne of Darkness, The Tree of Life) → bonus essence | Geographic/military — capture and hold contested sites |
| **Sphere dominance** | Your aligned spheres dominate large geographic areas → bonus essence | Long-term strategic — shape the world's cosmological profile |

**Risk scaling:** Each growth path increases visibility:
- More worshippers → larger religious footprint → easier for rivals to detect
- Places of power → continuously contested → military drain
- Sphere dominance → reshapes the world → attracts cosmic attention

**Maximum pool:** Essence pools up to a maximum (scales with total influence level). Unspent essence is not wasted — saving for a big play is a valid strategy.

### 4.3 Sphere-Typed Essences

Influence Essence is not generic — it is **typed by cosmological sphere**. The godling's sphere alignment (chosen at creation) determines the mix of essences they generate:

```
Example: A Life/Spirit godling generates:
  Life essence:    35%
  Spirit essence:  25%
  Mind essence:    10%
  Energy essence:  10%
  Force essence:    5%
  Matter essence:   5%
  Time essence:     5%
  Entropy essence:  5%
```

Each divine action costs essence of a specific sphere type:
- Military influence costs **Force** essence
- Economic influence costs **Matter** essence
- Magical influence costs **Energy** essence
- Social/spiritual influence costs **Spirit** or **Life** essence
- Knowledge influence costs **Mind** or **Time** essence

**This is the identity constraint:** A Life god naturally excels at social, spiritual, and healing influences. Attempting military coercion costs rare Force essence — possible but expensive. This prevents narrative incoherence (nature gods accidentally playing as war gods) while still allowing creative cross-domain play at a premium.

### 4.4 Actor Discovery and Recruitment

The godling discovers and recruits actors through a progression:

| Step | Cost | Effect |
|------|------|--------|
| **Discover** | ~1 essence | Search for actors at the avatar's location. The system generates a contextually appropriate encounter — someone whose traits, sphere alignment, and situation make them a natural story hook for what's happening nearby. |
| **Recruit** | ~5 essence | Begin influencing a discovered actor. They become an agent of the godling at Influence Tier 1. Establishes a persistent relationship with ongoing maintenance cost. |
| **Maintain** | ~0.5–4 essence/tick | Passive drain to keep the influence channel open. Higher tiers cost more. If the godling can't pay, influence degrades. |

### 4.5 Actor Influence Tiers

Once recruited, the godling's influence over an actor deepens over time automatically (as long as maintenance is paid). Influence accumulates each tick and hits thresholds that promote to the next tier:

| Tier | Working Name | Unlock | Maintenance | Visibility Risk |
|------|-------------|--------|-------------|----------------|
| 0 | **Unaware** | Actor exists in the world; godling can observe if within range | Free | None |
| 1 | **Touched** | Basic motivation viewing; can Whisper (subtle nudges) | ~0.5/tick | Low |
| 2 | **Devoted** | Full Dream Interface; can Inspire and Suppress; unlock sphere-aligned powers | ~1/tick | Medium |
| 3 | **Champion** | Deep influence; can Reshape and Implant motivations; unlock advanced powers | ~2/tick | High — radiates divine signature |
| 4 | **Aspect** | Near-total alignment; can Command; actor becomes an extension of the godling's will | ~4/tick | Very high — obvious to any divine observer |

**Tier naming:** These are working names. Final names should evoke the Malazan "Deck of Dragons" feel — actors ascending through tiers of divine significance. At Tier 3+, the actor might take on a title within the godling's emerging pantheon (Champion of Life, Hand of the Verdant God, etc.).

**Awareness:** Higher-tier agents radiate divine signature. Rival Ascendants and perceptive actors can detect high-tier agents, potentially targeting them or tracing the influence back to the godling.

### 4.6 Dropping Agents

The godling can withdraw influence from any agent at any time (stops paying maintenance). This is not just an economic decision — it's a **narrative beat**. When a god withdraws their attention, something happens:

| Agent Tier When Dropped | Narrative Outcome |
|------------------------|-------------------|
| Tier 1 (Touched) | The agent shakes off strange dreams, returns to ordinary life. Minimal narrative impact. |
| Tier 2 (Devoted) | **Crisis of faith.** The agent felt divine purpose; now it's gone. May gain Scar trait: "Abandoned by the Divine." Drives future autonomous behavior — bitterness, seeking a new patron, trying to prove worthiness. |
| Tier 3 (Champion) | **Wild card.** The agent retains accumulated power and traits but loses guidance. May become a rival, a tragic figure, or seek an opposing Ascendant. Classic "fallen champion" arc. Generates a major event. |
| Tier 4 (Aspect) | **Catastrophic severance.** The agent may be destroyed by the withdrawal of divine essence, or may survive as a fundamentally changed being — bitter, powerful, and dangerous. Always generates a world-shaking event. |

**Design intent:** Dropping agents has consequences that scale with investment. The player might be creating a future antagonist. This discourages churning through agents and rewards building long-term relationships.

The system generates a closing narrative beat based on the actor's traits, their influence tier, and their axiological profile. A loyal agent gets a tragic farewell. An ambitious one turns dangerous. A humble one fades quietly.

---

## 5. The Dream Interface — Motivation Manipulation

### 5.1 Core Concept

The Dream Interface is the primary way the player influences their agents' decisions. Instead of choosing actions for actors directly, the player **manipulates the probability distribution of the actor's own decision-making**.

When the player selects an influenced actor and "pays attention" (small essence cost), they enter the Dream Interface — appearing to the actor as a vision, a dream, an omen, a whisper. What the player sees is the actor's **Intentions**: the top 3–5 candidate actions that the actor's autonomous motivation engine has computed.

### 5.2 What the Player Sees

Each Intention displays:
- **The action** — what the actor is considering doing ("March on the Border Fortress")
- **The motivation** — which axiological values drive this choice (Ambition, Courage)
- **The probability** — the actor's current lean toward this choice (65%, 20%, 15%)
- **The sphere cost** — what essence type the player would need to interfere

```
Example: Thane Volkar is considering...

  ███████████░░░░  "March on the Border Fortress"     [Force]  65%
                    Driven by: Ambition, Courage

  ████░░░░░░░░░░░  "Strengthen the Mountain Alliance"  [Mind]   20%
                    Driven by: Prudence, Loyalty

  ██░░░░░░░░░░░░░  "Train the New Recruits"            [Force]  15%
                    Driven by: Prudence, Tradition
```

### 5.3 Influence Actions

The player's manipulation options scale with influence tier and essence investment:

| Action | Effect | Essence Cost | Min Tier | Risk |
|--------|--------|-------------|----------|------|
| **Whisper** | Nudge probability of an existing intention (+10–15%) | 1 (matching sphere) | 1 | None |
| **Inspire** | Boost an intention significantly (+25–30%) | 2 (matching sphere) | 2 | Low — actor feels "strangely motivated" |
| **Suppress** | Reduce probability of an intention (−20%) | 2 (matching sphere) | 2 | Low |
| **Reshape** | Morph an existing intention into a variation (e.g., "March on fortress" → "March on fortress but negotiate first") | 3 (matching sphere) | 3 | Medium — actor may feel conflicted |
| **Implant** | Insert a completely new intention from the valid action pool that the actor wasn't considering | 5 (matching sphere) | 3 | High — actor may resist, awareness increases |
| **Command** | Force a specific action regardless of motivation | 8+ (matching sphere) | 4 | Very high — actor may rebel, obvious to rival powers |

### 5.4 The Alignment Multiplier

All influence costs are modified by how well the nudge aligns with the actor's axiological profile:

```
final_cost = base_cost × alignment_factor × tier_modifier

alignment_factor:
  Aligned with actor's values:     1.0x (cheap — working with their nature)
  Neutral to actor's values:       2.0x (moderate)
  Against actor's values:          3.0–5.0x (expensive — fighting their nature)

tier_modifier (target's actor type):
  Individual:  1.0x (easy to sway)
  Group:       1.5x
  Faction:     2.0x (institutional inertia)
  Culture:     3.0x (civilizational momentum)
  God:         10.0x (near impossible)
```

**Design intent:** The cheapest path is always to find actors whose natural inclinations align with your goals and give them a gentle push. The expensive path is forcing unwilling actors against their nature. This creates the core gameplay tension: "Do I invest in cultivating the right actors, or force the wrong ones?"

### 5.5 Generic Actions (Always Available)

Outside the Dream Interface, the avatar and their agents always have access to generic actions that don't require motivation manipulation:

| Action | Effect | Cost |
|--------|--------|------|
| **Search** | Discover actors, locations, secrets at current location | 1 essence |
| **Move** | Travel across hexes | Free (costs time) |
| **Observe** | Gain information about nearby nodes, reveal hidden properties | 0.5 essence |
| **Establish Influence** | Begin recruiting a discovered actor | 5 essence |
| **Pray / Meditate** | Actor restores condition, reinforces divine connection | Free (actor's AP) |

These are the bread-and-butter actions that keep the game moving when the player isn't doing deep motivation work.

---

## 6. Contested Action Resolution

### 6.1 Uncontested Actions (90% of cases)

When an action has no competing action targeting the same node in the same tick window, it resolves via simple success/failure:

1. Compute success probability: `P = relevant_stat × trait_modifiers × sphere_alignment × difficulty`
2. Roll d100
3. Outcomes: Critical success (≤ P×0.1), Success (≤ P), Failure (> P), Critical failure (≥ 95)
4. Apply graph operations from the appropriate outcome template

**Resolution order:** Actions resolve in initiative order when multiple uncontested actions complete on the same tick:
```
initiative = actor_tier_bonus + domain_stat + random(1-20)
```

### 6.2 Contested Actions (The Dramatic 10%)

When two or more actors' actions target the same node in the same tick window, they become **contested**:

1. **Detection:** Group completing actions by target node. If a target has 2+ actions, it's contested.
2. **Opposed roll:** Each contestant rolls: `score = relevant_stat + trait_modifiers + sphere_alignment + d100`
3. **Winner:** Highest score. Their action succeeds normally.
4. **Loser(s):** Action fails. Generate a **template complication** from the action's failure outcomes. The complication creates a new node or edge representing the fallout.

**Event notification:** Contested actions always generate a player-facing event, regardless of fidelity tier. "Two powers clash over the fate of the Free City" is exactly the kind of dramatic moment the player should see.

### 6.3 Template Complications (Cool Failures)

Each action template defines 1–2 failure outcomes that create specific complications:

```typescript
interface ActionTemplate {
  // ... existing fields ...
  outcomes: {
    success: GraphOp[];
    failure: {
      graphOps: GraphOp[];           // what happens in the world
      complicationNode?: {           // optional complication node to create
        type: string;                // e.g., "exposed_plot", "blood_feud", "refugee_crisis"
        traits?: string[];           // traits applied to the complication
        narrativeTemplate: string;   // prose template for the event
      };
    };
    critical: GraphOp[];
  };
}
```

**Examples:**
- Failed Assassination → creates "Exposed Plot" node + "Hunted" condition on attacker + target gains "Forewarned" condition
- Failed Siege → creates "Stalemate" condition + attacker gains "Overextended" condition + defender gains "Emboldened" condition
- Failed Alliance → creates "Diplomatic Incident" node + both parties gain "Suspicious" edge modifier

**Design intent:** Failure should never mean "nothing happened." Every failed action creates a new story hook — a complication, a revelation, a shifted balance of power. The world gets more interesting whether actions succeed or fail.

---

## 7. Trait System Amendments

Based on brainstorm decisions, the following amendments apply to the Trait System design:

### 7.1 Social Traits → Edge Properties

**Change:** "Feared," "Beloved," "Trustworthy," and similar social-perception traits are **not node traits**. They are **edge properties** on relationship edges between actors.

A warlord isn't "Feared" in the abstract — he's feared *by specific actors*. This is modeled as:

```typescript
interface RelationshipEdge extends TaxonomyEdge {
  type: "relates_to";
  properties: {
    sentiment: "feared" | "beloved" | "respected" | "distrusted" | "neutral";
    strength: number;    // 0.0–1.0
    basis: string;       // what drove this sentiment ("witnessed_massacre", "received_aid")
  };
}
```

**Benefit:** The same warlord can be feared by one faction and beloved by another. This is far more realistic and creates richer narrative possibilities.

The Reputation trait category still exists for *self-perception* traits (e.g., "Infamous" as a measure of how widely known someone's dark deeds are — not who specifically fears them, but how far the reputation has spread).

### 7.2 Trait Conflict Resolution

**Rule:** Traits stack independently. A node with both "Blessed" and "Cursed" receives both modifiers, which partially cancel:

```
Blessed: +0.15 military
Cursed:  −0.10 military
Net:     +0.05 military
```

Both traits remain active, both show in the UI, both feed narrative hooks. "A warrior blessed by the Light yet cursed by the Entropy Wyrm — her power is great but unpredictable" is inherently interesting.

**Same-source cancellation:** If the *same source node* (e.g., the same god) applies both Blessed and Cursed to the same target, they annul each other (both removed). Inspired by Eldritch Horror board game mechanics. Different sources stack normally.

### 7.3 Trait Capacity

**Rule:** No hard cap. Soft cap via narrative importance weight.

Each trait has an `importance` property (0.0–1.0). The UI shows the top 5–7 traits by importance. All traits apply mechanically regardless of display. Minor traits are visible on detailed inspection.

This is naturally self-limiting because trait acquisition is already difficult (pattern matching, event triggers, threshold crossing). The system won't produce runaway trait accumulation under normal play.

---

## 8. Resolved Discovery Items

This design resolves or significantly advances the following items from the Notion Discovery Backlog:

| DISC ID | Item | Status |
|---------|------|--------|
| DISC-01 | Coincidence Deck | **Resolved.** Replaced by the Dream Interface (motivation manipulation system). The "Coincidence Deck" concept is subsumed into the Influence Essence economy + Dream Interface + generic actions. No separate card mechanic. |
| DISC-02 | Divine Economy | **Resolved.** Sphere-typed Influence Essence, generated from base alignment + cult + places of power + sphere dominance. Section 4.2–4.3. |
| DISC-03 | Agent Action Selection Algorithm | **Partially resolved.** Actors compute top 3–5 intentions from axiological profiles; player sees and manipulates these via Dream Interface. Full scoring algorithm still needs implementation-level specification. |
| DISC-04 | Action Economy / Tick Budget | **Resolved.** Daily ticks, AP by actor type, momentum model (ongoing actions progress automatically, decisions on completion). Sections 2–3. |
| DISC-07 | Resolution System Integration | **Partially resolved.** d100 roll with trait/sphere modifiers. Contested vs. uncontested paths defined. Exact formula for P (success probability) needs implementation-level specification. |
| DISC-09 | Stealth / Subtlety | **Partially resolved.** Higher influence tiers = more visible. Awareness concept defined (rivals can detect high-tier agents). Full detection math needs separate design. |
| DISC-12 | Coincidence Deck ↔ Influence Reconciliation | **Resolved.** Unified into a single system: the Dream Interface IS the player interaction mechanism. No separate card system needed. |
| DISC-16 | Trait Interaction / Stacking | **Resolved.** Stack independently, same-source cancels. Social traits moved to edge properties. Section 7. |
| DISC-17 | Contested CRUD Operations | **Resolved.** Priority queue for uncontested, opposed roll for contested. Template complications for failures. Section 6. |

### 8.1 Remaining Discovery Items (Not Addressed)

| DISC ID | Item | Notes |
|---------|------|-------|
| DISC-05 | Adversarial AI / Rival Gods | Depends on this design (they use the same action system) but their specific profiles/behaviors need separate design |
| DISC-06 | Doom Clock System | Time pressure mechanic — still undesigned |
| DISC-08 | Echo System / Metaprogression | End-of-run mechanics — still undesigned |
| DISC-10 | Narrative Prose Generation | Descriptor engine — still undesigned |
| DISC-11 | Force → Taxonomy Reconciliation | Audit task, not design task |
| DISC-13 | Classical Stats ↔ Capability Stats | Still needs formal declaration |
| DISC-14 | View Level Unification | Still needs canonical model |
| DISC-15 | GDD Reconciliation | Administrative decision |
| DISC-18 | Victory Mandate System | Win conditions — still undesigned |
| DISC-19 | Player Ascendant Creation | Partially informed by this design; needs full creation flow |
| DISC-20 | Divine Awareness as Trait Extension | Could model awareness archetypes as evolving traits |
| DISC-21 | World-Soul Layer Mechanics | Persistence layer — still undesigned |
| DISC-22 | Unmaking / Cycle Transition | End-of-run — still undesigned |

---

## 9. Open Questions for Future Design

- **Influence Essence pool maximum:** What determines the cap? Should it scale with total worshippers, number of places of power, or be a fixed progression?
- **Tier promotion speed:** How many ticks of maintained influence to reach each tier threshold? Should this be fixed or modifiable by traits/spheres?
- **Avatar creation choices:** What options does the player have? Sphere alignment, avatar form, starting location, starting traits? (DISC-19)
- **Rival Ascendant AI:** How do rival gods use the same influence system? Do they have the same constraints? (DISC-05)
- **Multiplayer:** If multiple players exist, how do their influence zones interact? Can two players influence the same actor?
- **Action hand generation details:** The exact algorithm for computing which 3–5 intentions an actor generates from their axiological profile + traits + world state. (Implementation-level design needed for DISC-03)

---

## 10. Next Steps

1. **Update Notion backlog** — Mark resolved DISC items, update sprint plan
2. **Continue discovery** — Godling creation (DISC-19), win/loss conditions (DISC-18), stat model (DISC-13)
3. **Implementation planning** — Once sufficient design coverage exists, create implementation plan starting with the IndexedGraph foundation
