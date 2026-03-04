# High-Level Discovery Pass — All Systems
**Date:** 2026-03-04
**Status:** All 14 items resolved
**Method:** Interactive design session, item-by-item analysis with compare/recommend workflow

---

## Summary

This document captures the high-level design decisions for all remaining Discovery Backlog items (DISC-03 through DISC-22, excluding previously resolved DISC-11, DISC-13, DISC-15). DISC-13 was resolved separately in `2026-03-04-disc13-domain-capability-and-resolution-design.md`.

These are **architectural-level decisions** — the "what" and "why" for each system. Implementation-level detail (the "how") will follow in per-system design documents during implementation planning.

---

## Sprint 1: Foundations

### DISC-14: View Level Model Unification ✅

**Decision:** Three canonical zoom levels with nested sub-locations.

| Level | Scope | Contains |
|-------|-------|----------|
| **World** | Full hex map | Regions, hex terrain, major landmarks |
| **Region** | Fluid bounded hex group | Hexes, locations, area features (mountain range, forest, barony) |
| **Location** | Single point of interest within a hex | Sub-locations for sequential storytelling |

**Key details:**
- Hexes are **10km** scale
- Regions are fluid bounded hex groups (a forest, a country, a mountain range) — not rigid grids
- Locations live inside hexes (village, dungeon, city, shrine)
- **Sub-locations** nest inside locations for storytelling sequences:
  - City → marketplace, council seat, temple district, docks
  - Dungeon → entrance, chambers, depths, sanctum
  - Village → market, elder's hall, shrine
- Sub-location sequences enable structured narrative progression: "go to dungeon → entrance test → chamber test → depths test → sanctum boss"
- Actors move to locations; sub-locations provide narrative beats within a location visit

---

## Sprint 2: Core Simulation Loop

### DISC-07: Resolution System Integration ✅

**Decision:** Target-derived difficulty with template floor fallback, amplified criticals, and dual-roll contested actions.

**Difficulty determination:**
- Primary: Difficulty derived from the **target** of the action (fortified city is harder to siege than an open village)
- Fallback: Each action template has a **floor difficulty** for when targets lack explicit difficulty ratings
- Resolution uses the unified sigmoid pool from DISC-13: `domain_capability + sphere_factor - difficulty + modifiers → sigmoid → P`

**Critical hits/failures:**
- Criticals **amplify graph mutation magnitude** — a critical success on a siege doesn't just capture the city, it devastates the defenders and generates scar traits
- Critical failures generate **potential scar traits** on the acting entity
- Both produce Chronicle tier-3 narrative entries

**Contested actions:**
- **Dual independent rolls** — both parties resolve against their own probability
- **Outcome matrix:** Both succeed (stalemate with attrition), attacker succeeds/defender fails (clean victory), attacker fails/defender succeeds (repulsed), both fail (chaotic outcome, mutual harm)

---

### DISC-03: Agent Action Selection Algorithm ✅

**Decision:** Maslow-inspired layered pipeline with probabilistic selection and Divine Toolkit.

**Selection pipeline:**
1. **Filter** — Remove actions the actor lacks prerequisites for
2. **Survival check** — If existential threats exist, prioritize survival actions (flee, defend, seek aid)
3. **Score by goal** — Each candidate action scored against the actor's active goals: `H = sum(W_active × action.goal_alignment)`
4. **Personality weight** — Dominant personality traits bias scores (a Cunning actor weights intrigue actions higher)
5. **Top-N selection** — Keep the top 3-5 scoring candidates
6. **Probabilistic select** — Weighted random from top-N (not deterministic — allows surprising but character-consistent choices)

Step 6 is where the **Dream Interface** connects — the player manipulates the probability distribution at this stage.

**Divine Toolkit — 8 intervention types:**

| Intervention | Mechanism | Detection Risk | Sphere Affinity |
|-------------|-----------|---------------|-----------------|
| **Dream** | Manipulate step 6 probabilities during actor's sleep | Low | Mind, Spirit |
| **Persuade** | Add temporary goal alignment toward desired action | Low-Medium | Heart, Eye |
| **Deceive** | Inject false information into actor's world-model | Medium | Shadow, Veil |
| **Intimidate** | Amplify survival instinct toward/away from action | Medium | Force, Star |
| **Inspire** | Boost personality weight for specific trait expressions | Low | Light spheres |
| **Coincidence** | Alter environmental prerequisites (open a door, remove a guard) | High | Time, Entropy |
| **Omen** | Plant symbolic event that biases actor interpretation | Low-Medium | Spirit, Star |
| **Afflict/Bless** | Apply temporary condition trait (courage, illness, clarity) | High | Life, Flesh |

Each intervention type uses different Influence Essence costs, has different narrative flavor in the prose engine, and carries different risk of detection (feeding into DISC-09).

---

### DISC-09: Stealth / Subtlety Mechanics ✅

**Decision:** Two-audience detection model with tiered consequences.

**Two audiences detect divine intervention independently:**

**Mortal detection** — Connects to the existing 5-tier influence system:
- **Suspicion** — Actors notice unusual coincidences. No mechanical effect, narrative flavor only.
- **Realization** — Actors recognize a pattern. May resist future interventions (reduced P on Dream/Persuade).
- **Revelation** — Actors *know* a god is acting. Triggers dramatic narrative beats. Actor may become devoted OR hostile depending on personality and intervention history.

**Rival god detection** — Separate escalation track:
- **Noticed** — A rival detects activity in their sphere of interest. Increased scrutiny on the region.
- **Identified** — A rival identifies the player's Ascendant as the source. May begin counter-operations.
- **Targeted** — A rival actively opposes the player. Triggers adversarial AI escalation (connects to DISC-05).

Detection probability scales with intervention type (Dream=low, Coincidence/Afflict=high), frequency in a region, and the target's existing awareness tier.

---

### DISC-19: Player Ascendant Creation ✅

**Decision:** Constrained draft + identity drift through play.

**Creation flow:**
1. **Archetype draft** — Player picks from a set of generated Ascendant archetypes, each with a sphere alignment, starting domain affinities, and personality seed
2. **Identity drift** — Through play, the Ascendant's identity evolves based on actions taken. A Life-god who consistently uses Darkness-aligned interventions drifts toward necromantic expression. A Force-god who favors Persuade over Intimidate develops a diplomatic identity.

**Design rationale:** The draft gives players a meaningful starting identity and strategic direction. The drift ensures the Ascendant feels like *their* creation shaped by *their* choices, not a static template. This mirrors the "Creation Spheres are independent of Foundation alignment" principle from DISC-13 — the player's starting sphere doesn't lock them into a playstyle.

---

## Sprint 3: Player Interaction Layer

*(DISC-01, DISC-02, DISC-12 were resolved in the 2026-03-03 session. DISC-09 and DISC-19 covered above.)*

### DISC-18: Victory Mandate System ✅

**Decision:** Hybrid mandate types with universal 3-stage structure.

**Mandate types:**
- **Graph-state mandates** — Achieve a specific world configuration ("your devoted actors control 5+ regions," "eliminate all rival influence in the northern continent")
- **Narrative mandates** — Trigger specific story beats ("a mortal ascends to demigod status through your guidance," "unite two warring cultures")
- **Sphere dominance mandates** — Establish cosmic supremacy in your domain ("Life energy exceeds Death energy globally," "your Creation Sphere is the dominant force in 3+ regions")

**Universal 3-stage structure:**
1. **Setup** — Initial conditions established, mandate revealed to player. World generation ensures the mandate is achievable but not trivial.
2. **Escalation** — Mid-run tension. Rival gods react to player progress. Doom clock interaction intensifies. The mandate's requirements may shift slightly based on world events.
3. **Culmination** — Final push. Clear success/failure conditions. Dramatic narrative beats regardless of outcome.

**Design rationale:** Multiple mandate types prevent runs from feeling samey. The 3-stage structure ensures every run has narrative arc regardless of the specific win condition. Mandates are assigned at Ascendant creation (DISC-19) and may be rerolled once for cost.

---

## Sprint 4: Adversarial Systems

### DISC-05: Rival Gods / Adversarial AI ✅

**Decision:** Generated rival pantheon — variable cast of cosmic forces generated from world state.

**Key design points:**
- **No fixed rivals.** The Weaver, Butcher, and Hierophant are removed.
- Each run generates **2-4 rival cosmic entities** based on the World-Soul state and the player's chosen Ascendant
- Rivals have: a **sphere alignment** (opposed or orthogonal to the player's), **behavioral archetypes** (aggressive, subtle, territorial, expansionist), **themed powers** drawn from their sphere, and **scaling behavior** tied to doom clock progression
- Rivals operate through the same CRUD action system as all actors, using the same Divine Toolkit intervention types
- Rival generation ensures **asymmetric opposition** — not all rivals are equally dangerous or equally opposed. Some may be potential temporary allies against a greater threat.

**Design rationale:** Generated rivals ensure replayability — each run has a unique adversarial landscape. The variable cast enables emergent diplomacy and shifting alliances, which is more narratively interesting than fixed enemies. Rivals generated from world state feel organic rather than arbitrary.

---

### DISC-06: Doom Clock System ✅

**Decision:** Thematic doom clocks with 7 archetypes, variable run lengths.

**Seven doom clock archetypes:**

| Archetype | Theme | Narrative Flavor |
|-----------|-------|-----------------|
| **The Breach** | An outside force breaking through reality | Chaos floods in, barriers fail, alien entities emerge |
| **The Convergence** | All forces drawn to a single point | Powers gathering, alliances forming, a decisive moment approaching |
| **The Changing** | A new cosmic order replacing the old | Guard changing, old powers fading, new ones rising |
| **The Sundering** | The world itself breaking apart | Reality fracturing, lands separating, connections severing |
| **The Failing** | A core force of creation weakening | Slow decline, entropy winning, vitality draining |
| **The Ascension** | Something/someone approaching godhood | A mortal or entity accumulating power, cosmic threshold nearing |
| **The Reckoning** | Past debts coming due | Consequences of old actions manifesting, karma, cosmic justice |

**Run length variation:**
- **Short runs** (~30-50 ticks): Intense, focused. Doom clock escalates quickly. Fewer but more impactful choices.
- **Medium runs** (~80-120 ticks): Standard experience. Full 3-stage mandate arc. Room for exploration and strategy.
- **Long runs** (~150-200 ticks): Epic scope. Multiple doom clock phases. Deep world development. Risk of overextension.

**Doom clock mechanics:**
- Each archetype has a **thematic escalation track** — not just "clock ticks up" but specific world events at each stage
- The doom clock is **woven into the narrative** (Malazan-inspired) — it's not a UI counter but a living story element that actors react to
- Rival gods interact with doom clocks — some accelerate them, some try to control them for their own purposes
- The player can influence doom clock progression through their interventions (delay, accelerate, redirect)

---

### DISC-20: Divine Awareness ✅

**Decision:** Awareness as computed narrative label derived from aggregate influence tier data.

**Five awareness archetypes (not stored — computed from existing data):**

| Archetype | Condition | Narrative Effect |
|-----------|-----------|-----------------|
| **Rationalist** | Low divine exposure, few influenced actors | Actors explain events through natural causes |
| **Providential** | Moderate positive influence, no revelation events | Actors sense "fate" or "luck" but attribute it vaguely |
| **Puppeteered** | High influence, forceful interventions dominate | Actors feel controlled, may resist or despair |
| **Negotiator** | High influence, diverse intervention types, some revelation | Actors consciously bargain with the divine |
| **Awakened** | Widespread revelation events, actors at tier 4-5 | Actors fully aware of divine mechanics, may try to manipulate gods |

**Design rationale:** No new data stored — awareness labels are computed from existing influence tier distributions and intervention history. This means awareness emerges naturally from gameplay rather than being a separate system to manage. Different regions of the world can have different awareness levels simultaneously.

---

## Sprint 5: Narrative & Metaprogression

### DISC-10: Narrative Prose Generation Engine ✅

**Decision:** Hybrid layered prose engine with three tiers.

**Three prose tiers based on event significance:**

| Tier | Trigger | Method | Quality |
|------|---------|--------|---------|
| **Routine** | Most resolved actions | Template-stitched from pre-authored fragments | Consistent, fast, may repeat |
| **Notable** | Trait acquisitions, critical outcomes, tier transitions | Enhanced templates with multiple variants, conditional clauses | Richer, still deterministic |
| **Chronicle** | Doom clock escalations, mandate milestones, legendary actions | LLM-generated prose from structured prompt with full context | Literary quality, unique |

**Narrative voice conventions:**
- **Second person** for player actions: "You whisper into the dream..."
- **Third person omniscient** for world events: "The Mountainborn warband marched..."
- **Dramatic present** for Chronicle entries: "The walls of Iron Gate crack and shudder..."

**Sphere coloring:** Foundation sphere alignment tints vocabulary:
- Chaos → wild, unpredictable, organic metaphors
- Order → structural, measured, architectural language
- Light → clarity, revelation, radiance imagery
- Darkness → depth, concealment, weight imagery

**Actor personality influence:** Dominant traits flavor descriptions — a Cunning leader's victory reads differently from a Mighty one's.

**Chronicle compression:** Routine events within the same location/timeframe compress into paragraph summaries for the Great Chronicle.

---

### DISC-21: World-Soul Layer Mechanics ✅

**Decision:** Layered Resonance model — two layers within the World-Soul.

**Layer 1 — The Fundament (Coefficient Ledger):**
- Numerical balances on each Foundation axis: Chaos↔Order, Light↔Darkness
- Numerical weights per Creation Sphere: how much Life, Entropy, Force, etc. exists in the cosmos
- Shifted by: every resolved action (small nudge based on sphere alignment), doom clock escalations (larger shifts), mandate outcomes (directional push)
- Affects world generation: terrain distribution, species prevalence, cultural starting traits, resource availability

**Layer 2 — The Resonance (Curated Memories):**
- **5-10 memory fragments per cycle**, selected from the most dramatic events (Chronicle tier-3 entries)
- Typed memories: "Life+Darkness dominated" → necromantic cultures, "Force contested between Chaos and Order" → warrior cultures divided between freedom and empire
- Inject specific thematic content into world generation rather than just numerical bias
- Can generate **echo locations** — places that feel like they existed before
- Include both positive and negative memories (doom clock scars, rival god atrocities)

**Player visibility:**
- **Cosmic Memory screen** showing Fundament balances as visual axes
- Resonance memories displayed as brief narrative fragments
- In-game **déjà vu moments** where the prose engine references resonance memories

**Fundament blending:** Final run values are weighted-averaged with existing Fundament (not replaced) to prevent wild swings across cycles.

---

### DISC-22: The Unmaking / Cycle Transition ✅

**Decision:** Playable Twilight Phase with archetype-flavored wind-down.

**Three triggers for the Unmaking:**
1. **Doom clock expires** — Primary trigger. Archetype determines the apocalypse flavor.
2. **Victory mandate complete** — Chosen transition. Triumphant tone.
3. **Player concedes** — Strategic early exit. Bittersweet — prioritize what to save.

**Twilight Phase (5-10 playable ticks):**
- The Unmaking happens *around* the player during this phase
- Doom clock archetype determines the visual/narrative experience (Breach = chaos flooding, Failing = quiet darkening, Convergence = forces rushing together)
- Player actions cost **no Influence Essence** (cosmic economy collapsing) but have **reduced success probability** (reality unraveling)
- Strategic opportunity: protect key actors, secure artifacts, strengthen bonds that might survive as Echoes

**Transition sequence:**
1. **Trigger** → Doom clock / mandate / concession
2. **Twilight Phase** → 5-10 playable ticks
3. **Echo Selection** → Cosmic (automatic) + Divine (player picks) from DISC-08
4. **Resonance Capture** → Top Chronicle events become World-Soul memories
5. **Fundament Update** → Weighted average blend with existing values
6. **Harvest Screen** → Player sees: Echoes preserved, Resonance formed, Fundament shifts, Chronicle completed
7. **Generation** → New world from updated World-Soul

**Outcome coloring:**
- **Mandate complete:** Triumphant Harvest. Bonus Divine Echo pick. Amplified Fundament shifts.
- **Doom clock expired:** Somber Harvest. Fewer Echoes survive. Doom archetype leaves a Resonance scar.
- **Player concession:** Bittersweet Harvest. Standard Echo count. Player-prioritized during Twilight.

---

### DISC-08: The Echo System / Metaprogression ✅

**Decision:** Weighted selection with player picks, three echo types, degradation, and structured Chronicle.

**Three Echo types:**

| Type | Source | Injection Method |
|------|--------|-----------------|
| **Legacy Echo** (Living) | Significant actors | Seeds cultural templates: myths, descendant lineages with inherited trait tendencies, NPC archetypes |
| **Monument Echo** (Structural) | Important locations/institutions | Seeds location features: ruins with resonant properties, sacred/cursed sites with sphere biases, cultural place-memories |
| **Relic Echo** (Artifact) | Pivotal legendary artifacts | Seeds quest lines: discoverable items with descendant trait graphs (modified from original), associated myths |

**Two selection pools:**
- **Cosmic Echoes (automatic):** Top 3-5 nodes by narrative significance score. Represent events so significant they imprinted on reality. May include unwanted echoes (rival champions, cursed locations).
- **Divine Echoes (player choice):** Player picks from top 10-15 eligible nodes. Pick count varies: **victory = 3, concession = 2, defeat = 1.**

**Echo degradation:** Each echo weakens slightly with each cycle it persists. A Legacy echo: cycle 2 = living culture with active myths → cycle 5 = half-forgotten legends and a single inherited trait. Prevents permanent dominance while allowing long narrative threads.

**The Great Chronicle structure:**
- **Volumes** — One per completed cycle, titled by doom clock archetype ("The Age of the Breach")
- **Chapters** — Chronicle tier-3 entries (LLM-generated) within each volume
- **Interludes** — Compressed routine event summaries between chapters
- **Echo Threads** — Cross-volume connections tracking how echoes manifested across cycles ("The blade Griefender, first forged in the Age of the Breach, appeared again as a rusted relic in the Cycle of the Failing...")

---

## Cross-System Dependencies Map

```
World-Soul (DISC-21)
  ├── feeds → World Generation → new cycle
  ├── updated by → The Unmaking (DISC-22)
  └── stores → Resonance from Chronicle (DISC-10)

Doom Clock (DISC-06)
  ├── triggers → The Unmaking (DISC-22)
  ├── escalated by → Rival Gods (DISC-05)
  └── influenced by → Player via Divine Toolkit (DISC-03)

Agent AI (DISC-03)
  ├── uses → Resolution System (DISC-07)
  ├── manipulated by → Divine Toolkit (8 intervention types)
  ├── detection feeds → Stealth System (DISC-09)
  └── operates in → View Levels (DISC-14)

Resolution (DISC-07)
  ├── uses → Domain Capability Sigmoid (DISC-13)
  ├── generates → Narrative Prose (DISC-10)
  └── criticals feed → Chronicle tier-3 entries

Narrative Engine (DISC-10)
  ├── tier-3 entries → Chronicle → Resonance selection
  ├── attribution from → Resolution System (DISC-07)
  └── sphere coloring from → Foundation Spheres (DISC-13)

Echo System (DISC-08)
  ├── selected during → The Unmaking (DISC-22)
  ├── injected into → World Generation
  ├── tracked in → Great Chronicle
  └── degrades across → cycles

Player Layer
  ├── Ascendant Creation (DISC-19) → draft + drift
  ├── Victory Mandates (DISC-18) → 3-stage hybrid
  ├── Divine Awareness (DISC-20) → computed labels
  └── Intervention → Divine Toolkit → Detection → Rival Response
```

---

## Content Pipeline Architecture

**Philosophy:** Generated within constraints as the basis, with player iteration control and a feedback loop for quality improvement.

### Generation Model

All content surfaces (traits, artifacts, locations, prose, names, cultures, doom clock events, mandate instances) use **constraint-based generation** rather than hand-authoring at scale.

**Four constraint layers (outermost → innermost):**

1. **Schema constraints** — Structural validity. A trait must have a domain, magnitude, and tier. A sub-location must have an encounter type and difficulty range. The generator cannot produce structurally invalid content.

2. **Tonal constraints** — Vocabulary banks per domain and sphere. Iron domain pulls from martial/industrial word pools. Heart domain pulls from emotional/relational pools. Foundation sphere tints register: Chaos = wilder synonyms, Order = formal/structured, Light = clarity/radiance, Darkness = concealment/depth.

3. **Balance constraints** — Magnitude ranges, cost curves, rarity distributions, power budgets. A generator cannot produce a trait that gives +0.8 to all domains. These are the game design guardrails that keep generated content mechanically fair.

4. **Coherence constraints** — Relational rules that check context. A necromantic culture cannot generate "fears the undead." A desert hex cannot generate a "dense forest" sub-location. A Chaos-aligned rival cannot use Order-flavored intervention descriptions.

**Authored seeds** establish the quality bar. The 30 starter traits, 9 origin species, 7 doom clock archetypes, and 10-tier narrative lexicon are all seeds. Generators learn the *pattern* from seeds and produce variants within constraints.

### Player Iteration Control

Players can refine generated content through four mechanisms:

| Mechanism | Description | Applies To |
|-----------|-------------|-----------|
| **Regenerate** | "Give me another" within same constraints | Names, descriptions, flavor text, archetypes |
| **Lock + Regenerate** | Lock one field, regenerate the rest | Partial content (keep name, change effect description) |
| **Edit** | Direct text editing of cosmetic fields | Names, descriptions, flavor text only |
| **Parameter Nudge** | Bias generators via sliders/toggles ("more martial," "darker tone") | Culture generation, region flavor, Chronicle rewrites |

**Iteration boundaries:** Players can modify names, descriptions, flavor text, and tonal parameters. Players **cannot** modify mechanical values (trait magnitudes, resolution probabilities, doom clock timing), graph structure (node connections), or victory mandate requirements. This preserves game integrity while giving full cosmetic agency.

**Key iteration surfaces:**
- Ascendant creation: archetype generation → pick and tweak
- World generation: region/culture names, location descriptions, NPC archetypes
- Chronicle entries: LLM prose → request rewrite with different emphasis
- Artifact/relic naming and lore
- Doom clock escalation flavor text

### Content Feedback System

A live quality feedback loop built into the game UI.

**Player-facing — flag button on any generated content, three flag types:**
- **Tone miss** — "This doesn't fit" (wrong mood, breaks immersion, feels generic)
- **Coherence break** — "This contradicts something" (desert culture referencing forests, pacifist with military trait)
- **Quality issue** — "This is bad" (awkward phrasing, repetitive, nonsensical)

**Backend triage pipeline:**
1. **Capture** — Content ID + flag type + context snapshot (screen state, constraint set that produced it, surrounding content)
2. **Auto-classify** (agent) — Four categories:
   - *Constraint gap* — Rules allowed something they shouldn't → propose new constraint rule
   - *Generator weakness* — Rules fine, output quality low → log for prompt tuning / vocabulary expansion
   - *Subjective preference* — Content is valid, player didn't like it → feed into per-player preference profile
   - *Actual bug* — System error → file bug report
3. **Constraint refinement** — Constraint gaps produce candidate rules for review. Generator weaknesses produce vocabulary/template expansion tasks. Subjective preferences tune per-player tone profiles (optional).
4. **Aggregation** — Cross-player patterns surface systematic issues. "70% flag Iron Chronicle entries as repetitive" → Iron vocabulary bank needs expansion.

**Timing:** The agent triages for the next generation cycle, not in real-time. The player's **regenerate** button gives immediate relief. The feedback loop improves the *system* over time.

### Content Source Tagging

Every piece of content carries a `source` field:

| Tag | Meaning |
|-----|---------|
| `seed` | Hand-authored exemplar (designer-created) |
| `generated` | Produced by constraint-based generator |
| `player-edited` | Modified by player (original preserved for diff) |
| `regenerated` | Player requested new version (previous version logged) |

This enables analytics: which content types need better generators vs. better seeds, which constraint layers catch the most issues, and where player editing is most frequent (indicating generator weakness in that area).

---

## Next Steps

All discovery items are resolved at the high level. The next phase is **implementation planning** — breaking each system into implementable units with dependencies, creating per-system detailed design documents, and sequencing the build order.

Recommended implementation sequence follows the existing sprint structure:
1. View Level Model (DISC-14) — foundational data structures
2. Resolution System (DISC-07) — core gameplay loop
3. Agent AI + Divine Toolkit (DISC-03) — simulation heartbeat
4. Detection (DISC-09) — consequence system
5. Rival Gods (DISC-05) + Doom Clocks (DISC-06) — adversarial layer
6. Victory Mandates (DISC-18) + Ascendant Creation (DISC-19) — player layer
7. Narrative Engine (DISC-10) — prose generation
8. World-Soul (DISC-21) + Unmaking (DISC-22) + Echoes (DISC-08) — metaprogression loop
