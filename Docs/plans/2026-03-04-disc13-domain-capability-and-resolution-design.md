# DISC-13: Domain Capability, Resolution System & World Object Ontology — Design Document

**Date:** 2026-03-04
**Status:** Approved
**Origin:** Completing DISC-13 (Classical Stats ↔ Capability Stats Alignment) with extensions into resolution mechanics, world object ontology, and cosmological revisions
**Related:** Nine Reaches Domain System, Trait System, Turn Economy & Player Influence, Actor CRUD Action System, Cosmological Taxonomy
**Resolves:** DISC-13 (fully), partially advances DISC-07 (Resolution System Integration)

---

## 1. Overview

This document completes the domain capability system design and extends it into three connected areas: (1) how domain capability is computed from the world graph, (2) how actions resolve using that capability, and (3) how artifacts, enchantments, and resources participate in the model. It also records two cosmological revisions that emerged during design.

### 1.1 Design Principles

- **"D under the hood, C on screen":** No stored domain scores. The system walks the graph at resolution time to compute capability. The UI shows narrative descriptors, never raw numbers.
- **Explainability over accuracy:** The player must always be able to trace an outcome back to identifiable factors. Outcomes that feel "random" aren't ones with variance — they're ones the player can't explain. Every outcome must be attributable.
- **Weber-Fechner perception:** Humans perceive differences logarithmically. A sigmoid/diminishing returns curve matches intuitive expectations — early gains feel significant, later gains feel marginal.
- **Miller's 7±2:** The player should be able to mentally model 3-7 contributing factors for any outcome. More than that becomes noise.
- **Unified contribution pool:** Traits, artifacts, enchantments, resources, sphere alignment — all feed one resolution pipeline. No separate modifier channels. The narrative attribution engine identifies the swing factor for close outcomes.

### 1.2 Three Orthogonal Dimensions of Capability

All action in the simulation is described by three independent dimensions:

| Dimension | Question | Examples |
|-----------|----------|---------|
| **Foundation Spheres** | *How* is this done? (philosophical alignment, intent) | Chaos, Order, Light, Darkness |
| **Creation Spheres** | *What* supernatural domain does this touch? | Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy |
| **Nine Reaches** | *Where* in the world of action does this happen? | Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star, Flesh |

No predetermined coupling between them. A Life-Spirit-Heart character who leans Chaos+Light is a wild shaman healer. The same spheres and domains leaning Order+Darkness produce a necromantic cult leader. Identity emerges from play, not from character creation.

---

## 2. Cosmological Revisions

### 2.1 Foundation Spheres — Two Opposed Pairs

**Previous:** Chaos, Darkness, Light, Shadow (4 spheres, arbitrary relationship matrix)
**Revised:** Two fundamental cosmological axes:

```
        Light
          |
  Chaos --+-- Order
          |
       Darkness
```

**Chaos ↔ Order:** Entropy/freedom vs. structure/law
**Light ↔ Darkness:** Revelation/creation vs. concealment/destruction

Every entity has a position along both axes. The opposition relationships are immediately intuitive, and the four quadrants map to classic fantasy archetypes (lawful good paladin = Order+Light, trickster fey = Chaos+Light, tyrant = Order+Darkness, demon = Chaos+Darkness).

**Impact:** All references to the Shadow Foundation Sphere must be updated to remove it. "Shadow" now refers exclusively to the Nine Reaches domain (intrigue/covert action). The `foundation-spheres.json` data file needs updating.

### 2.2 Creation Spheres — Independent of Foundation Alignment

**Previous:** Implied affinities between Creation Spheres and Foundation Spheres
**Revised:** No fixed mapping. Creation Spheres are contextually colored by Foundation alignment.

Examples of the same Creation Sphere expressed through different Foundation alignments:

| Creation Sphere | + Light | + Darkness | + Order | + Chaos |
|----------------|---------|------------|---------|---------|
| **Life** | Healing, growth, renewal | Necromancy, parasitic growth, forced animation | Regulated medicine, selective breeding | Wild mutation, uncontrolled evolution, plague |
| **Mind** | Enlightenment, clarity, teaching | Domination, madness, psychic assault | Logic, law, codified knowledge | Inspiration, dream, intuition |
| **Force** | Protection, shielding, justice | Destruction, domination, annihilation | Discipline, fortification, martial order | Chaos magic, wild strikes, entropy |

**Design rationale:** This maximizes narrative emergence. A Life-god who gradually slides into Darkness isn't breaking the cosmology — they're exploring a valid expression of their sphere. Different cultures associating the same sphere with different Foundation quadrants IS worldbuilding. Elves might see Life as Light+Order (sacred cycle of nature). Orcs might see Life as Chaos+Light (ferocious vitality). Neither is wrong.

---

## 3. The Computation Model — Explainable Sigmoid

### 3.1 Algorithm

The domain capability computation answers: "How capable is this actor in domain X right now?"

```
1. COLLECT — Walk the actor's graph neighborhood:
   - has_trait edges → trait domain contributions
   - possesses/bonded_to edges → artifact domain contributions
   - enchanted/warded edges → enchantment domain contributions
   - controls edges → resource domain contributions (if valid control chain)

2. SCORE — For each connected node/edge, look up its domain contribution
   for the target domain. Sum all contributions → raw_score

3. CURVE — Apply sigmoid:
   capability = 1 / (1 + e^(-k × (raw_score - midpoint)))

4. TIER — Map capability (0.0–1.0) to the 10-tier narrative lexicon

5. ATTRIBUTE — Sort contributing factors by absolute contribution,
   return top 3-5 for display in Fate Forecast and Dream Interface
```

### 3.2 Sigmoid Parameters

The sigmoid midpoint and steepness (k) are tuned so that:

| Actor Profile | Expected Raw Score Range | Expected Tier Range |
|--------------|-------------------------|-------------------|
| Mortal with origin traits only | 2–4 in strong domains | 3–4 (Sturdy–Trained) |
| Mortal with origin + 2-3 mastery traits | 6–10 | 5–6 (Steeled–Tempered) |
| Veteran with origin + mastery + artifacts | 10–15 | 6–7 (Tempered–Fearsome) |
| Legendary figure (ancient dragon, archmage) | 15–25 | 8–9 (Dread–Ruinous) |
| God-tier entity | 25+ | 9–10 (Ruinous–Cataclysmic) |

Negative contributions (curses, wounds, negative traits) reduce raw_score meaningfully but the sigmoid floor prevents capability from going below ~0.05 (tier 1).

### 3.3 Contribution Sources

| Source | Edge Type | Contribution Style | Notes |
|--------|-----------|-------------------|-------|
| **Origin traits** | `has_trait` (innate) | Fixed per species | The baseline anchor |
| **Mastery traits** | `has_trait` (mastery) | Scaled by level (×1, ×2, ×3) | Decays without reinforcement |
| **Scar traits** | `has_trait` (scar) | Fixed, permanent | Marks of pivotal events |
| **Reputation traits** | `has_trait` (reputation) | Evolving | Shifts based on behavior |
| **Condition traits** | `has_trait` (condition) | Fixed, temporary | Applied/removed by actions |
| **Destiny traits** | `has_trait` (destiny) | Fixed, hidden | Only visible at divine awareness |
| **Common artifacts** | `possesses` | Fixed per artifact | Transferable, destructible |
| **Legendary artifacts** | `bonded_to` | Variable (artifact has own traits) | Rare, semi-autonomous |
| **Enchantments** | `enchanted` / `warded` / `cursed` | Fixed per enchantment, with duration | Dispellable, traceable to source |
| **Resources** | `controls` | Fixed while controlled | Conditional on control chain |
| **Consumable resources** | `possesses` | One-time boost, then destroyed | Economy decision |

---

## 4. The 10-Tier Narrative Lexicon

Each domain has its own tonal register. The words escalate from personal weakness to cosmic power.

| Tier | Range | Iron | Gold | Shadow | Veil | Heart | Eye | Stone | Star | Flesh |
|------|-------|------|------|--------|------|-------|-----|-------|------|-------|
| 1 | 0.0–0.1 | Frail | Destitute | Exposed | Mundane | Hollow | Blind | Rootless | Godless | Frail |
| 2 | 0.1–0.2 | Soft | Poor | Clumsy | Dull | Cold | Dim | Loose | Doubting | Weak |
| 3 | 0.2–0.3 | Sturdy | Thrifty | Cautious | Touched | Warm | Keen | Grounded | Pious | Hardy |
| 4 | 0.3–0.4 | Trained | Comfortable | Sly | Sensitive | Kind | Alert | Settled | Faithful | Tough |
| 5 | 0.4–0.5 | Steeled | Prosperous | Veiled | Gifted | Devoted | Perceptive | Rooted | Devoted | Vigorous |
| 6 | 0.5–0.6 | Tempered | Wealthy | Shadowed | Adept | Inspiring | Watchful | Entrenched | Blessed | Robust |
| 7 | 0.6–0.7 | Fearsome | Affluent | Masked | Arcane | Radiant | Prescient | Enduring | Anointed | Mighty |
| 8 | 0.7–0.8 | Dread | Magnate | Spectral | Eldritch | Luminous | Oracular | Immovable | Exalted | Titanic |
| 9 | 0.8–0.9 | Ruinous | Sovereign | Invisible | Transcendent | Incandescent | Omniscient | Eternal | Sacred | Undying |
| 10 | 0.9–1.0 | Cataclysmic | Imperial | Void | Mythic | Absolute | All-Seeing | Primordial | Divine | Deathless |

**Display format:** *"Thorin is **Steeled** at Iron"* or *"The Silvervein Guild is **Prosperous** at Gold."*

**Tier distribution:** Tiers 1-3 are common mortals. 4-6 are competent/experienced. 7-8 are legendary. 9-10 are reserved for gods, ancient beings, and world-shaking powers. Most actors spend their lives in the 3-6 range.

---

## 5. Origin Trait Clusters (Species Domain Profiles)

Each species/being type carries a single innate origin trait with domain contributions. These are the perceptual anchor — the baseline before mastery, scars, and equipment modify things.

| Species | Origin Trait ID | Iron | Gold | Shadow | Veil | Heart | Eye | Stone | Star | Flesh | Signature |
|---------|----------------|------|------|--------|------|-------|-----|-------|------|-------|-----------|
| Dwarf | `origin.mountainborn` | +3 | +3 | +0 | +0 | +1 | +1 | +4 | +2 | +2 | Rooted at Stone |
| Elf | `origin.starborn` | +0 | +1 | +1 | +4 | +2 | +4 | +0 | +2 | +3 | Perceptive at Eye |
| Human | `origin.worldborn` | +2 | +2 | +2 | +1 | +2 | +2 | +2 | +1 | +2 | Trained at everything |
| Orc | `origin.bloodborn` | +4 | +0 | +1 | +0 | +2 | +1 | +2 | +1 | +4 | Fearsome at Iron |
| Fey | `origin.dreamborn` | +0 | +1 | +3 | +5 | +3 | +2 | +0 | +2 | +1 | Adept at Veil |
| Dragon | `origin.fireborn` | +5 | +2 | +1 | +5 | +0 | +4 | +3 | +3 | +5 | Mythic beings |
| Treant | `origin.rootborn` | +1 | +0 | +0 | +2 | +3 | +2 | +5 | +4 | +3 | Eternal at Stone |
| Undead | `origin.deathborn` | +2 | +0 | +3 | +2 | -2 | +1 | +1 | -1 | +4 | Hollow at Heart |
| Goblin | `origin.scrapborn` | +1 | +3 | +3 | +0 | +1 | +2 | +1 | +0 | +2 | Sly at Shadow |

**Design notes:**
- Humans are generalists (no domain below +1, none above +2). Their strength is versatility.
- Dragons are intentionally overpowered. Their Heart deficit (+0) means people *fear* dragons, they don't *follow* them.
- Undead have negative Heart and Star — severed connection to bonds and faith.
- The "-born" naming pattern connects to cosmological origin stories.

---

## 6. Mastery Traits

Mastery traits are the primary growth mechanism. They contribute domain points scaled by level (×1 at level 1, ×2 at level 2, ×3 at level 3). They decay without reinforcement, forcing meaningful identity choices.

| Mastery Trait | ID | Level Range | Domain Contributions (per level) | Acquisition | Decay |
|--------------|-----|-------------|----------------------------------|-------------|-------|
| Battle-Hardened | `mastery.battle_hardened` | 1–3 | Iron +2, Flesh +1 | 3+ military engagements survived | −1 level / 3 seasons without combat |
| Master of Intrigue | `mastery.intrigue` | 1–3 | Shadow +2, Eye +1 | 5+ covert actions within 4 seasons | −1 level / 2 seasons without intrigue |
| Lorekeeper | `mastery.lorekeeper` | 1–3 | Eye +2, Veil +1 | 4+ knowledge actions | −1 level / 4 seasons without study |
| Trade Baron | `mastery.trade_baron` | 1–3 | Gold +2, Heart +1 | 3+ trade routes + wealth threshold | −1 level / 2 seasons without trade |
| Arcane Adept | `mastery.arcane_adept` | 1–3 | Veil +3 | 5+ magical actions across 2+ domains | −1 level / 3 seasons without magic |
| Stonewarden | `mastery.stonewarden` | 1–3 | Stone +2, Iron +1 | 3+ fortification/territorial actions | −1 level / 3 seasons without building |
| Faith-Keeper | `mastery.faith_keeper` | 1–3 | Star +2, Heart +1 | 4+ spiritual actions | −1 level / 3 seasons without devotion |
| Healer | `mastery.healer` | 1–3 | Flesh +2, Heart +1 | 3+ healing/restoration actions | −1 level / 3 seasons without healing |
| Diplomat | `mastery.diplomat` | 1–3 | Heart +2, Shadow +1 | 4+ successful negotiations | −1 level / 2 seasons without diplomacy |

**Worked example — Orc veteran:**
- Origin: Bloodborn (Iron +4, Flesh +4)
- Battle-Hardened level 2: Iron +4, Flesh +2
- Scar: Dragon-Slayer (Iron +2, Star +1)
- Possesses: Fine War-Axe (Iron +1)
- **Total Iron raw_score: 4 + 4 + 2 + 1 = 11** → sigmoid → ~tier 7 → **"Fearsome at Iron"**
- **Total Flesh raw_score: 4 + 2 = 6** → sigmoid → ~tier 5 → **"Vigorous at Flesh"**

---

## 7. Resolution Formula — The Fate Forecast

### 7.1 Unified Pool Resolution

```
P = sigmoid(actor_domain_score + sphere_factor - difficulty + Σ(action_modifiers))
    clamped to [0.05, 0.95]
```

Where:
- **actor_domain_score:** 0.0–1.0 from the trait graph walk (Section 3)
- **sphere_factor:** 0.0 to +0.2, how aligned the actor's sphere investment is with this action
- **difficulty:** 0.0 to 1.0, inherent difficulty of the action template
- **action_modifiers:** specific trait effects (ActionModifierEffect from the trait system), capped at ±0.20 total
- **Floor/ceiling:** no action ever has <5% or >95% success probability

### 7.2 The Fate Forecast (Pre-Resolution)

Before an action resolves, the player sees a narrative assessment computed from the full resolution formula:

| P Range | Forecast Tier | Meaning |
|---------|--------------|---------|
| 0.05–0.20 | **Doomed** | Almost certain to fail |
| 0.20–0.40 | **Perilous** | Odds are against it |
| 0.40–0.60 | **Uncertain** | Could go either way |
| 0.60–0.80 | **Favorable** | Odds are with it |
| 0.80–0.95 | **Fated** | Almost certain to succeed |

The forecast also shows the **top 2-4 contributing factors** as narrative phrases, sorted by contribution magnitude. These come from the attribution engine (Section 7.4).

### 7.3 Player Nudging via Influence Essence

The player (as an Ascendant) can spend sphere-typed Influence Essence to shift P before resolution:

| Influence Level | P Shift | Essence Cost | Detection Risk | Narrative |
|----------------|---------|-------------|----------------|-----------|
| **Nudge** | ±0.05 | Low | Minimal | "A strange coincidence..." |
| **Amplify** | ±0.10 | Moderate | Noticeable | "Fortune seemed to favor..." |
| **Force** | ±0.20 | High | Significant | "As if guided by an unseen hand..." |
| **Block** | Action cancelled | Very High | Extreme | "Fate itself intervened." |

The nudge is visible in the Fate Forecast in real-time — the player sees the tier shift as they commit essence and can decide if the cost is worth it.

### 7.4 Narrative Attribution (Post-Resolution)

When the d100 roll resolves, the system identifies the **marginal factor** — the contribution closest to the success/failure margin.

**Close outcome (roll within ±10 of threshold):** The marginal factor becomes the narrative focus.
- *"Thorin's ancestral blade blazed with fire, and the shield wall buckled."* (artifact was marginal)
- *"Years of campaign hardened his resolve where lesser warriors would have faltered."* (mastery trait was marginal)
- *"A strange wind caught the arrow mid-flight — call it fate."* (player's Influence nudge was marginal)

**Decisive outcome (roll far from threshold):** No single factor highlighted — the outcome was overdetermined.
- *"The siege broke as expected — the garrison never stood a chance."*

**Critical success/failure:** The system generates a dramatic narrative beat regardless of margin.

This ensures that every close outcome tells a *specific story* about *why* it happened, satisfying the human need for causal attribution.

---

## 8. World Object Ontology — Artifacts, Enchantments, Resources

### 8.1 Artifacts (Two Tiers)

**Common Artifacts** (node type: `artifact`)
- Fixed domain contributions declared at creation
- Connected to owner via `possesses` edge
- Can be transferred, stolen, destroyed via CRUD actions
- No trait graph of their own — they are tools
- Examples: fine steel sword (Iron +1), merchant's ledger (Gold +1), scout's spyglass (Eye +1)

**Legendary Artifacts** (node type: `artifact_legendary`)
- Full trait graph: accumulate scars, reputation, even mastery over centuries
- Connected via `bonded_to` edge (semi-autonomous bond, not mere possession)
- Can have agency: destiny traits, axiological profiles, AP allocation
- Their trait contributions stack with the wielder's in the unified pool
- Rare: 5-20 in a world at any time. Finding one is a major story event.
- Examples: Stormbringer (Iron +5, Veil +3, Heart -2, plus scar traits from centuries of battle), an ancient crown (Shadow +4, Star +3, carries the reputation "Kingmaker")

### 8.2 Enchantments (Edge Properties)

Enchantments are properties on directed edges, not separate nodes. They are inherently relational — a blessing has a blesser, a curse has a curser.

| Edge Type | Source → Target | Domain Contributions | Duration | Removal |
|-----------|----------------|---------------------|----------|---------|
| `enchanted` | Caster → Person | Variable per spell | Temporary (ticks) | Dispel action targeting source's sphere |
| `warded` | Ritual site → Place | Defensive domain bonuses | Until broken | Counter-ritual or overwhelming force |
| `cursed` | Source → Target | Negative domain contributions | Until lifted | Specific counter-condition or divine intervention |
| `blessed` | Source → Target | Positive domain contributions | Temporary | Expires naturally or negated by opposing action |

Edge properties include: domain contributions (per domain), sphere type (for dispelling), duration (in ticks), source signature (caster ID), and visibility level (public/discoverable/divine-only).

The sigmoid walk collects enchantment contributions alongside trait and artifact contributions — all in the same unified pool.

### 8.3 Resources (Controlled Nodes)

Resources are world graph nodes connected to controllers via `controls` edges.

**Steady resources** contribute domain points while controlled:
- Gold mine → Gold +2 to controlling faction
- Ley line nexus → Veil +3 to actions at that location
- Fertile farmland → Flesh +1 to controlling settlement

**Consumable resources** can be spent for a one-time boost:
- Dragonstone gems → Veil +5 for a single action, then resource node destroyed
- Siege supplies → Iron +3 for a single military action, then depleted
- Sacred relics → Star +4 for a single ritual, then consumed

Resource contributions are **conditional**: they flow through the `controls` edge and only contribute when the acting entity has a valid control chain to the resource. Lose the mine (via conquest, exhaustion, or sabotage), lose the Gold bonus.

---

## 9. Updated Backlog Impact

### DISC-13: RESOLVED ✅
All remaining pieces completed:
- ✅ Origin trait clusters (Section 5)
- ✅ Computation model — explainable sigmoid (Section 3)
- ✅ Narrative lexicon — 10-tier, domain-specific (Section 4)
- ✅ Mastery traits with domain contributions (Section 6)
- ✅ Resolution formula with Fate Forecast (Section 7)
- ✅ Shadow naming collision — resolved by removing Shadow as Foundation Sphere (Section 2.1)

### Additional items resolved:
- ✅ Foundation Spheres revised to two opposed pairs (Chaos/Order, Light/Darkness)
- ✅ Creation Spheres declared independent of Foundation alignment
- ✅ Artifacts, Enchantments, Resources added to world object ontology
- ✅ Unified contribution pool with narrative attribution engine
- ✅ Fate Forecast system (pre-resolution player information)
- ✅ Player nudging mechanics integrated with Influence Essence

### Items partially advanced:
- 🟡 DISC-07 (Resolution System Integration) — resolution formula defined, but implementation-level specification still needed
- 🟡 DISC-04 (Action Economy) — consumable resources add economy decisions, needs integration with tick budget

### New items generated:
- [ ] Update `foundation-spheres.json` — remove Shadow, add Order
- [ ] Update all source code references to old Foundation Sphere set
- [ ] Design: Legendary Artifact creation/discovery system
- [ ] Design: Enchantment spell effect catalog (starter set)
- [ ] Design: Resource node generation rules (what resources exist where)
- [ ] Implementation: Sigmoid trait graph walk algorithm
- [ ] Implementation: Fate Forecast UI component
- [ ] Implementation: Narrative attribution engine

---

## 10. Next Steps

1. **Update cosmological data files** — `foundation-spheres.json` needs Order added, Shadow removed
2. **Update GDD** — reflect all decisions from this document
3. **DISC-14: View Level Model Unification** — next queued foundation item
4. **Sprint 2 readiness** — with DISC-13 resolved, Sprint 2 (Core Simulation Loop) is unblocked
