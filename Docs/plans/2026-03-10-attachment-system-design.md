# Attachment System Design — Possessions, Conditions, Powers, Agreements & Retainers

**Date:** 2026-03-10
**Status:** Design
**Scope:** Unified model for everything that attaches to agents — items, conditions, spells, divine powers, agreements, and retainers. Includes content taxonomy, tiering, encounter-driven acquisition, UI detail cards, on-use triggers, and content authoring guide.

---

## Problem Statement

The engine has graph types for artifacts (`artifact`, `artifact_legendary`), enchantment edges (`enchanted`, `warded`, `cursed`, `blessed`), condition traits (category: `condition`), and a working retinue system — but no unified design for how these things are authored, acquired, displayed, or interact with each other. The modifier engine already resolves effects from any edge with a `modifiers` property, so the mechanical infrastructure is ~95% built. What's missing is the content taxonomy, the acquisition pipeline, the UI, and the documentation that lets future agents generate content correctly.

---

## Core Design Decision: One System, Not Five

There is no separate "spell system," "item system," or "ally system." There is **one unified attachment model** expressed through existing graph infrastructure, differentiated only by node type, edge type, permanence, and narrative framing.

**Why:** The modifier engine already walks all edges on a node and collects anything with a `modifiers` property, regardless of edge type. A warhorse connected via a `possesses` edge with `modifiers: { iron: 0.15 }` resolves identically to a trait connected via `has_trait` with the same modifiers. Building parallel systems would duplicate resolution logic and fragment content authoring.

---

## The Six Attachment Categories

| Category | Node Type | Edge Type | Permanence | Example |
|----------|-----------|-----------|------------|---------|
| **Possessions** | `artifact` / `artifact_legendary` | `possesses` / `bonded_to` | Until lost, broken, or consumed | Warhorse, cursed amulet, rations from the Copper Market |
| **Conditions** | `trait` (category: `condition`) | `has_trait` | `ticksRemaining` → auto-expires | Festering wound, plague, broken arm, battle rage |
| **Blessings & Curses** | `trait` (category: `condition`) | `has_trait` | Until dispelled or expired | Blessed by the Sun God, cursed by a dying witch |
| **Bestowed Powers** | `trait` (category: `bestowed`) | `has_trait` | Permanent while source relationship holds | Turn Undead, Call Spirits, Flame Ward |
| **Agreements** | Enriched `relates_to` edge | `relates_to` with `agreement` property block | Until fulfilled, broken, or dispelled | Dark pact, favour owed, blood oath, trade debt |
| **Retainers** | `actor` (subtype: `individual`) | `member_of` / `worships` | Until killed, dismissed, or lured away | Scribe, bodyguard, warhorse handler |

### How Each Category Uses Existing Infrastructure

**Conditions, Blessings & Curses:** Already designed in the Obsidian vault (Blessed, Cursed, Plague-Stricken, At War, Under Siege). The intervention effects design doc (`2026-03-08-intervention-effects-design.md`) specifies `ticksRemaining` on `has_trait` edges, decremented each tick by the orchestrator. Zero new engine work — just content.

**Bestowed Powers:** One new trait category (`bestowed`). Granted via the `worships` or `aligned_with` relationship to a god or sphere. Lost if the relationship breaks. The modifier engine already resolves them through `has_trait` edges.

**Possessions:** Existing `artifact` nodes and `possesses` / `bonded_to` edges. The modifier engine already walks these edges. Needs content taxonomy, UI, and the on-use trigger system (see below).

**Agreements:** Enriched `relates_to` edges with an `agreement` property block. The modifier engine already walks incoming `relates_to` edges. An agreement that says "your Iron is diminished while the pact holds" just needs `modifiers: { iron: -0.1 }` on the edge.

**Retainers:** Existing actor nodes in the retinue system. They don't modify the owner directly — they're independent agents whose presence at the same location enables specific encounter types or provides adjacency bonuses.

---

## Tags: The Universal Content Scripting Language

**Decision:** Tags are load-bearing gameplay mechanics, not just metadata.

Every trait definition, artifact node, and agreement edge carries a `tags: string[]` array. The trait system already has this field on `TraitDefinitionProperties`. We extend it to artifact node properties and agreement edge properties.

**What tags enable:**

- A healing flask doesn't list specific conditions it cures — it says "cures all conditions tagged `#disease`"
- A holy ritual doesn't name specific agreements — it "breaks all `#dark` `#binding` agreements"
- An encounter template doesn't enumerate eligible items — it "requires a `#mount` possession"
- A spell doesn't hardcode targets — it "affects all entities with `#undead` conditions"

**Resolution helper:** `getByTag(graph, nodeId, tag)` — walks edges on the node, checks if the connected node/edge properties include the target tag. Small, pure function, ~15 lines.

**Tag vocabulary conventions:**

- Reach tags: `#iron`, `#gold`, `#shadow`, `#veil`, `#heart`, `#eye`, `#stone`, `#star`, `#flesh`
- Sphere tags: `#force`, `#matter`, `#energy`, `#life`, `#mind`, `#spirit`, `#time`, `#entropy`
- Effect tags: `#disease`, `#wound`, `#poison`, `#magical`, `#divine`, `#dark`, `#binding`
- Item tags: `#weapon`, `#mount`, `#armor`, `#consumable`, `#tool`, `#relic`, `#tome`
- Narrative tags: `#cursed`, `#blessed`, `#ancient`, `#forbidden`, `#legendary`

Tags can be freely combined. A cursed plague-sword is tagged `#weapon` `#cursed` `#disease` `#iron` `#dark`.

---

## Four-Tier Rarity System

Every attachment has a tier that communicates its narrative significance at a glance.

| Tier | Color | Name | Narrative Weight |
|------|-------|------|-----------------|
| **1** | Pale silver / grey | **Mundane** | Useful but ordinary. A sturdy tool, a minor blessing, a simple favour. |
| **2** | Copper / warm bronze | **Storied** | Has history. A named blade, a trained warhorse, a healer's oath. |
| **3** | Deep violet / indigo | **Mythic** | Changes what's possible. A grimoire of forbidden lore, a blood pact with a spirit. |
| **4** | Gold with ember glow | **Legendary** | World-shaping. An artifact of the gods, a creature of legend, a prophecy made flesh. |

**Display:** Tier color shows on the icon border and name text in the detail card. Subtle but immediately readable at a glance in the agent panel.

**Tier applies universally** — not just possessions. A Mundane condition is "bruised ribs." A Mythic condition is "touched by the Void — sees things others can't, but the visions are eating her sanity." A Storied agreement is "owes a favour to a merchant prince." A Legendary agreement is "bound to serve the World-Soul for seven seasons."

---

## Possession Taxonomy

Seven subcategories for possessions, each with a distinct icon:

| Subcategory | Icon Concept | Primary Reach | Examples |
|-------------|-------------|---------------|---------|
| **Arms** | Crossed swords | Iron | Named sword, siege bow, war banner |
| **Mounts & Beasts** | Horse head | Iron / Flesh | Warhorse, trained hawk, dire wolf |
| **Vestments** | Cloak/mantle | Star / Veil | Blessed robes, warded armor, crown of thorns |
| **Tomes & Scrolls** | Open book | Eye / Veil | Forbidden grimoire, ancient map, coded ledger |
| **Relics & Talismans** | Glowing gem | Star / Veil | Saint's fingerbone, cursed amulet, lodestone |
| **Tools & Instruments** | Hammer/compass | Stone / Gold | Master forge-key, merchant's scales, healer's kit |
| **Provisions** | Wrapped bundle | Flesh / Gold | Rations from the Copper Market, healing flask, dreamwine |

**Provisions** are consumable possessions: when used, they grant a temporary condition trait (with `ticksRemaining` and modifiers), and the provision node is removed from the graph. The encounter where the agent acquired the provisions is the story; the mechanical effect is a condition trait.

**Guiding rule:** Every possession must be narratively significant. If it doesn't change what the agent can do, unlock a new encounter, or create a story beat, it doesn't exist in the system. No backpack of 25 torches.

---

## On-Use Trigger System

Certain attachments can generate effects when "used" — that is, when the attachment's tags are relevant to an encounter being resolved. This creates micro-story moments: a sword that might shatter, a summoning spell that might backfire, a healing flask that might heal the wrong thing.

### Trigger Definition

Each attachment can carry an optional `onUseTriggers` array in its properties:

| Field | Type | Description |
|-------|------|-------------|
| `triggerCondition` | string | When this fires: `'critical_failure'`, `'failure'`, `'critical_success'`, `'any_use'`, `'first_use'` |
| `probability` | number | Chance of firing when condition is met (0.0–1.0) |
| `effect` | object | What happens — same shape as encounter outcomes (add/remove traits, possessions, edges) |
| `narrativeTemplate` | string | Prose template for the trigger event |
| `tags` | string[] | Tags for content scripting (e.g., `#breakage`, `#backfire`, `#bonus`) |

### Example Triggers

**Sword breaking on critical failure:**
- triggerCondition: `critical_failure`
- probability: 0.25 (25% chance on critical fail)
- effect: remove the `possesses` edge, grant condition trait "Disarmed" with `ticksRemaining: 5`
- narrativeTemplate: "{item_name} shatters against {target}'s defense. {actor} stands empty-handed, fragments of {adj} steel ringing on the ground."

**Summoning spell backfiring:**
- triggerCondition: `critical_failure`
- probability: 0.15
- effect: spawn hostile actor node at location, remove the `has_trait` (bestowed power) edge
- narrativeTemplate: "The summoning circle flares {adj} and wrong. What steps through is not what {actor} called. The {summoned_name} turns {adj} eyes on its would-be master."

**Legendary relic revealing hidden knowledge on critical success:**
- triggerCondition: `critical_success`
- probability: 0.40
- effect: grant condition trait "Revelation" with `modifiers: { eye: +0.3 }` and `ticksRemaining: 20`
- narrativeTemplate: "The {item_name} pulses with {adj} light. For a moment, {actor} sees the world as it truly is — every thread, every connection, every hidden name."

**Cursed amulet draining the wearer periodically:**
- triggerCondition: `any_use`
- probability: 0.10
- effect: grant condition trait "Drained" with `modifiers: { heart: -0.1, flesh: -0.1 }` and `ticksRemaining: 8`
- narrativeTemplate: "The Whispering Eye drinks deep. {actor} feels {adj} cold spread through {their} chest, a familiar price for {adj} sight."

### Resolution Integration

When an encounter step resolves, the resolution engine checks all attachments on the acting agent whose tags overlap with the encounter's tags. For each match, it checks `onUseTriggers` against the outcome tier. If a trigger fires (PRNG roll against probability), its effect is applied alongside the encounter outcome and its narrative template is woven into the encounter prose.

This is additive — triggers don't replace encounter outcomes, they layer on top. A successful combat encounter might also trigger the sword's "on critical success" effect, giving the agent both the encounter reward and the triggered bonus.

---

## Encounter-Driven Acquisition Flow

### How Attachments Enter the World

Every encounter outcome can specify a **reward pool recipe** — not hardcoded items, but a template for assembling candidates at resolution time.

### Pool Recipe Fields

| Field | Type | Description |
|-------|------|-------------|
| `categoryWeights` | Record | How likely each attachment type is. A tomb raid weights possessions and curses. A diplomatic summit weights agreements and retainers. |
| `tierCurve` | number[] | Probability distribution across 4 tiers, shifted by outcome quality. |
| `tagFilters` | string[] | Constrain pool to items matching these tags. Mountain encounter: `#beast`, `#survival`, `#stone`. |
| `sphereTint` | string? | If present, favors items aligned with this Creation Sphere. |
| `badOutcomeChance` | number | 0.0 for critical success, 0.05 for success, 0.50 for failure, 0.90 for critical failure. |

### Tier Curves by Outcome

| Outcome | Mundane | Storied | Mythic | Legendary | Bad Chance |
|---------|---------|---------|--------|-----------|------------|
| Critical Success | 10% | 40% | 40% | 10% | 0% |
| Success | 40% | 40% | 15% | 0% | 5% |
| Failure | 20% | 10% | 5% | 0% | 65% (conditions, wounds, losses) |
| Critical Failure | 5% | 5% | 5% | 0% | 85% (scars, curses, forced agreements) |

Note: even in failure, the tier of the *consequence* can be high. A Mythic-tier curse is more narratively interesting than a Mundane bruise.

### The Draw Sequence

1. **Encounter resolves.** Outcome tier determined by the existing resolution engine.
2. **Pool assembles.** The recipe generates 3-5 concrete candidates from the content registry, filtered by tags, weighted by tier curve and category weights. Uses the location's sphere influence and the agent's existing tags to flavor the pool.
3. **God nudge window.** The player sees the pool as a set of 3-5 slots displaying only the tier color and category icon (not full details — veiled knowledge). The player can spend Influence Essence to nudge one candidate's weight up or another's down. This uses the existing intervention cost and detection risk systems.
4. **Draw.** Seeded PRNG selects from the weighted pool. Deterministic, replayable, inspectable via trace.
5. **Assign.** The drawn attachment is connected to the agent via the appropriate graph mechanism (new `possesses` edge, new `has_trait` edge, enriched `relates_to` edge, or new retainer actor node).
6. **Narrate.** The prose engine generates the acquisition story, drawing on the encounter context, the attachment's flavor text, the agent's personality, and the cultural vocabulary system.

### God Nudge UI

After encounter resolution, a small panel shows 3-5 slots. Each slot displays a tier-colored border and a subcategory icon. The player sees "there's a Mythic relic and a Storied mount in the pool" without knowing the exact items. They can tap one slot to nudge toward it, or tap "leave to fate." Quick interaction, not fiddly. Reinforces the god fantasy — you're tipping scales, not choosing from a menu.

---

## UI: The Universal Detail Card

A single detail card model serves all six attachment categories. Renders beautifully with or without art.

### Data Model

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name — evocative, specific |
| `category` | Yes | Possession, condition, bestowed, agreement, retainer |
| `subcategory` | Yes | Arms, Mounts, disease, dark pact, etc. |
| `tier` | Yes | 1-4 (Mundane, Storied, Mythic, Legendary) |
| `icon` | Yes | Small silhouette icon by subcategory — always present |
| `image` | No | Concept art, ~200×200, Threadbare aesthetic. Card looks good without it. |
| `flavorText` | No | 1-2 sentences of narrative color |
| `mechanicalSummary` | Yes | Human-readable effect: "+Iron, grants cavalry charge" |
| `tags` | Yes | Visible tag pills for content scripting categories |
| `source` | No | Where/when acquired — encounter name, tick, location |
| `duration` | When applicable | Ticks remaining bar, or "permanent," "until dispelled," "until fulfilled" |
| `onUseTriggers` | No | Trigger definitions for on-use effects (see On-Use Trigger System) |

### Display Modes

**Inline (agent panel):** Icon with tier-colored border + name. Compact, no clutter.

**Hover tooltip:** Icon + name + mechanical summary + duration if transient. Quick glance, no art.

**Expanded detail card:** Everything — art (if available), flavor text, tags, source, full mechanical breakdown, on-use trigger descriptions. This is where the attachment feels real.

### Subcategory Icons

Fifteen small Threadbare-style silhouette icons, readable at 16×16 and 32×32:

**Possessions (7):** Arms (crossed swords), Mounts & Beasts (horse head), Vestments (cloak/mantle), Tomes & Scrolls (open book), Relics & Talismans (glowing gem), Tools & Instruments (hammer/compass), Provisions (wrapped bundle)

**Conditions (5):** Wound/Injury (broken bone), Disease/Poison (droplet), Curse (eye with slash), Blessing (radiant star), Magical Effect (spiral)

**Agreements (3):** Pact/Oath (clasped hands), Debt/Favour (hanging scale), Alliance/Treaty (linked rings)

### Image Generation

When an attachment is created, art can optionally be generated via the Imagen API using a prompt template built from the item's subcategory, tags, sphere affinity, tier, and name. The Threadbare style guide (STYLE.md) defines the visual language. Generation is asynchronous and non-blocking — the attachment exists and functions immediately, art arrives when it arrives.

---

## Architectural Alignment

### Non-Functional Priorities Check

1. **Tunability** — Every effect is a named constant or a number on an edge property. Rebalancing = changing numbers.
2. **Inspectability** — All effects trace through the existing modifier resolution system. On-use triggers emit their own trace events.
3. **Determinism** — Pool assembly and draws use seeded PRNG. Same seed = same items.
4. **Fail-soft** — Missing art → card renders without it. Missing triggers → no triggers fire. Missing tags → no tag-based effects apply. Nothing crashes.
5. **Narrative over mechanical perfection** — Tags and flavor text exist specifically to serve story. On-use triggers exist to create dramatic moments.
6. **Additive over destructive** — No existing types or edges are modified. One new trait category (`bestowed`), enriched `agreement` property on `relates_to` edges, `onUseTriggers` array on attachment properties. Everything else is content.
7. **Performance budget** — Tag queries are O(degree) on the node, same as existing modifier collection. No new hot paths.

### New Code Required

| Module | Size Estimate | Purpose |
|--------|--------------|---------|
| `getByTag()` helper | ~15 lines | Query attachments/traits by tag |
| `assembleRewardPool()` | ~60-80 lines | Build candidate pool from recipe + context |
| `resolveOnUseTriggers()` | ~40-50 lines | Check triggers against outcome, fire if PRNG passes |
| `bestowed` trait category | Type update only | Add to `TraitCategory` union |
| `agreement` edge properties | Type definition | Shape for agreement block on `relates_to` edges |
| Detail card component | ~150-200 lines | Universal card with art-optional layout |
| Subcategory icons | 15 SVGs | Sprite sheet |
| Reward pool UI | ~80-100 lines | God nudge panel |
| Content packages | Variable | The actual items, conditions, powers, agreements |

### What Doesn't Change

- The modifier engine (`modifiers.ts`) — already resolves from any edge with modifiers
- The trait system (`traits.ts`) — already supports conditions with decay
- The encounter engine (`encounter.ts`) — we add reward pool recipes to templates, not new resolution logic
- The retinue system (`retinue.ts`) — retainers are actors in the existing system
- The `relates_to` edge type — agreements enrich it with properties, not a new edge type
- The resolution system (`resolution.ts`) — on-use triggers wrap around it, not inside it

---

## Rejected Alternatives

- ❌ Separate spell/item/ally systems — unified model is simpler and more expressive
- ❌ Pure tag-driven resolution (Option C) — duplicates the existing trait system without adding capability
- ❌ Backpack/inventory model — every attachment must be narratively significant
- ❌ Fixed loot tables — pool recipes + tag filtering + sphere tint produce contextual, emergent rewards
- ❌ Hardcoded effect lists — tag-based resolution lets future content automatically interact with existing mechanics

---

## Content Authoring Guide

This section is the reference for any agent generating attachments. It will also be extracted into a dedicated content authoring skill.

### How to Create a Possession

A possession is an `artifact` or `artifact_legendary` graph node connected to an agent via a `possesses` or `bonded_to` edge.

**Required node properties:**
- `name` — evocative, specific, never generic. "Ashenmane, Horse of the Western Reach" not "Warhorse"
- `subcategory` — one of: `arms`, `mounts_beasts`, `vestments`, `tomes_scrolls`, `relics_talismans`, `tools_instruments`, `provisions`
- `tier` — 1 (Mundane), 2 (Storied), 3 (Mythic), 4 (Legendary)
- `tags` — array of strings. Must include at least one reach tag and one item-type tag. Add narrative tags as appropriate.
- `mechanicalSummary` — human-readable effect description
- `lossCondition` — one of: `consumable`, `breakable`, `stealable`, `cursed` (can't discard), `permanent`

**Optional node properties:**
- `flavorText` — 1-2 sentences. Evocative, in-world voice. Not mechanical.
- `image` — path to concept art if generated
- `source` — encounter/event that created this possession
- `sphereAffinity` — Creation Sphere alignment (force, matter, energy, life, mind, spirit, time, entropy)
- `onUseTriggers` — array of trigger definitions (see below)

**Required edge properties (on `possesses` / `bonded_to`):**
- `modifiers` — Record of attribute → delta. These feed directly into the modifier engine.
- `grants` — string array of qualitative unlocks: encounter types, action templates, perceptual abilities.
- `tags` — edge-level tags (may differ from node tags for contextual effects)

**Example — a Storied warhorse:**

Node:
- name: "Ashenmane, Horse of the Western Reach"
- type: `artifact`
- subcategory: `mounts_beasts`
- tier: 2
- tags: `["#mount", "#beast", "#iron", "#flesh"]`
- mechanicalSummary: "+Iron in open terrain, grants cavalry_charge encounters, +movement range"
- lossCondition: `stealable`
- flavorText: "Won in a border raid. Still bites strangers."
- onUseTriggers: `[{ triggerCondition: "critical_failure", probability: 0.10, effect: { remove_possession: true, grant_condition: "Thrown from Mount", ticksRemaining: 5 }, narrativeTemplate: "Ashenmane rears in terror. {actor} hits the ground hard, the horse bolting into the {adj} distance." }]`

Edge (`possesses`):
- modifiers: `{ iron: 0.10, movement_range: 1 }`
- grants: `["cavalry_charge", "rapid_retreat", "overland_speed"]`
- tags: `["#mount"]`

### How to Create a Condition

A condition is a `trait` node (category: `condition`) connected via a `has_trait` edge with `ticksRemaining`.

**Required trait node properties:**
- `name` — descriptive, evocative
- `subcategory` — `condition`
- `tags` — must include effect-type tags (`#disease`, `#wound`, `#poison`, `#curse`, `#blessing`, `#magical`)
- `description` — what this condition means narratively
- `tier` — 1-4
- `importance` — 0.0-1.0 (how much narrative weight it carries)
- `maxLevel` — usually 1 (binary: you have it or you don't), up to 3 for scaling conditions
- `visibility` — `public`, `discoverable`, or `divine_only`
- `domainContributions` — per-level contributions to reaches (positive or negative)

**Required edge properties (on `has_trait`):**
- `level` — current level (1 for binary conditions)
- `acquiredTick` — when this was applied
- `ticksRemaining` — ticks until auto-removal. `null` for permanent-until-dispelled.
- `source` — what caused this condition
- `modifiers` — attribute deltas fed into modifier engine

**Example — a Mythic curse:**

Trait node:
- name: "The Whispering Hunger"
- subcategory: `condition`
- tier: 3
- tags: `["#curse", "#dark", "#mind", "#supernatural"]`
- description: "A voice behind the teeth. It knows your name and it is always hungry."
- visibility: `discoverable`
- domainContributions: `{ mind: -0.15, veil: +0.10 }`

Edge (`has_trait`):
- level: 1
- ticksRemaining: null (permanent until dispelled)
- source: "Failed the Binding in the Tomb of Whispers"
- modifiers: `{ heart: -0.15, veil: +0.10 }`

### How to Create a Bestowed Power

A bestowed power is a `trait` node (category: `bestowed`) connected via `has_trait`. It represents a gift from a divine source — lost if the relationship to that source breaks.

**Same structure as conditions, with these differences:**
- `subcategory` is `bestowed` instead of `condition`
- `ticksRemaining` is typically `null` (permanent while source relationship holds)
- `source` references the divine entity that granted the power
- Should include `grants` for qualitative abilities, not just numeric modifiers
- Tags should include `#divine` and the relevant sphere

**Example — Turn Undead:**

Trait node:
- name: "Turn Undead"
- subcategory: `bestowed`
- tier: 2
- tags: `["#divine", "#spirit", "#life", "#star"]`
- description: "The god's light burns in your palms. The dead remember what they were, and they are afraid."
- domainContributions: `{ star: +0.10 }`

Edge (`has_trait`):
- source: "Granted by Solhaven, the Undying Flame"
- modifiers: `{ star: +0.10 }`
- grants: `["turn_undead_encounter", "sense_undead"]`
- onUseTriggers: `[{ triggerCondition: "critical_success", probability: 0.30, effect: { grant_condition: "Radiant Surge", ticksRemaining: 10, modifiers: { star: +0.20 } }, narrativeTemplate: "The light blazes beyond {actor}'s control — holy fire erupts outward, and for a moment even the living shield their eyes." }]`

### How to Create an Agreement

An agreement is an enriched `relates_to` edge between two agents. It modifies both parties and can be resolved, broken, or dispelled.

**Required edge properties:**
- Standard `relates_to` properties: `sentiment`, `strength`, `basis`
- `agreement` property block containing:
  - `type` — `pact`, `debt`, `favour`, `oath`, `treaty`, `bargain`
  - `tier` — 1-4
  - `tags` — tag array for content scripting (`#dark`, `#binding`, `#divine`, `#commercial`)
  - `terms` — human-readable description of the agreement
  - `ticksRemaining` — `null` for permanent, number for time-limited
  - `fulfillmentCondition` — what resolves the agreement (narrative description, checked by content scripting)
- `modifiers` — attribute deltas on the edge, affecting the source agent
- `name` — display name for UI

**Example — a dark pact:**

Edge (`relates_to`) from Sorcerer → Demon:
- basis: `dark_pact`
- sentiment: -0.3 (the sorcerer fears the demon)
- strength: 0.9
- agreement:
  - type: `pact`
  - tier: 3
  - tags: `["#dark", "#binding", "#supernatural", "#veil"]`
  - terms: "Service in exchange for power. Seven tasks, then freedom — if the demon keeps its word."
  - ticksRemaining: null
  - fulfillmentCondition: "Complete seven tasks assigned by the demon"
- modifiers: `{ veil: +0.20, star: -0.15 }`
- name: "The Seven-Task Bargain"

### How to Create a Retainer

A retainer is an `actor` node (subtype: `individual`) connected to the owning agent's ascendant via `worships` or to a faction via `member_of`. They function as independent agents in the retinue system.

**What makes a retainer different from a regular agent:** They exist primarily to serve another agent's story. Their own goals are secondary. They provide adjacency bonuses when at the same location as their master.

**Retainer adjacency bonuses** are expressed as modifiers on the `worships` or `member_of` edge connecting them to their patron. When the retainer and patron are co-located, these modifiers apply. This is a new convention, not a new engine feature.

**Example — a scribe retainer:**

Actor node:
- name: "Mireth, Keeper of the Unfiled"
- actorType: `individual`
- tier: 2
- tags: `["#retainer", "#scribe", "#eye", "#scholar"]`
- flavorText: "She remembers what you said on the third day of the second month. She will remind you at the worst possible moment."

Edge (`worships` → patron's ascendant):
- tier: 2 (Devoted)
- modifiers: `{ eye: +0.10, gold: +0.05 }` (only when co-located)
- grants: `["research_encounter", "translate_ancient_text"]`

### Tag Vocabulary Reference

**Reach tags:** `#iron`, `#gold`, `#shadow`, `#veil`, `#heart`, `#eye`, `#stone`, `#star`, `#flesh`

**Sphere tags:** `#force`, `#matter`, `#energy`, `#life`, `#mind`, `#spirit`, `#time`, `#entropy`

**Effect type tags:** `#disease`, `#wound`, `#poison`, `#curse`, `#blessing`, `#magical`, `#divine`, `#supernatural`

**Item type tags:** `#weapon`, `#mount`, `#armor`, `#consumable`, `#tool`, `#relic`, `#tome`, `#instrument`

**Narrative tags:** `#cursed`, `#blessed`, `#ancient`, `#forbidden`, `#legendary`, `#dark`, `#holy`, `#binding`

**Agreement tags:** `#pact`, `#debt`, `#favour`, `#oath`, `#treaty`, `#commercial`, `#binding`

**Resolution tags:** `#breakage`, `#backfire`, `#bonus`, `#revelation`, `#transformation`

Tags can be freely combined. Content scripts query by tag to create expressive cross-cutting effects. The vocabulary grows organically — new content can introduce new tags without engine changes.

### Writing Flavor Text

Flavor text is the soul of an attachment. It's what makes a "+0.10 Iron" modifier feel like a *story*.

**Rules:**
- Maximum 2 sentences
- In-world voice — no mechanical language, no game terms
- Imply history, don't explain it. "Won in a border raid. Still bites strangers." not "This warhorse was acquired during the Western Border Conflict of Year 3."
- Personality matters — a cursed amulet's flavor text should feel unsettling, a divine blessing should feel weighty
- Leave room for imagination — suggest, don't specify

**Good:** "The blade remembers every hand that held it. Yours is the coldest yet."
**Bad:** "This sword gives +0.15 to Iron and has a 25% chance to break on critical failure."

**Good:** "She remembers what you said on the third day of the second month. She will remind you at the worst possible moment."
**Bad:** "A scribe retainer that provides +0.10 Eye when co-located."

### Writing Narrative Templates for On-Use Triggers

On-use trigger narrative templates are woven into encounter prose. They use the same variable substitution as encounter templates.

**Available variables:** `{actor}`, `{target}`, `{item_name}`, `{location}`, `{they}`, `{them}`, `{their}`, `{adj}` (contextual adjective from cultural vocabulary)

**Rules:**
- One sentence, two at most
- Must work grammatically when inserted after the encounter outcome prose
- Should feel like a dramatic beat, not a status update
- Good triggers make the player go "oh no" or "oh YES"

**Good:** "Ashenmane rears in terror. {actor} hits the ground hard, the horse bolting into the {adj} distance."
**Bad:** "The warhorse is lost. The agent no longer has the mount."

---

## Change Audit

| Date | Where | What Changed | Why |
|------|-------|-------------|-----|
| 2026-03-10 | Docs/plans/ | Created attachment system design | Design session for unified possession/condition/power/agreement/retainer model |
