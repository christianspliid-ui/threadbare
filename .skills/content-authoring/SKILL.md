---
name: content-authoring
description: Use when generating, creating, or designing items, possessions, conditions, curses, blessings, divine powers, spells, agreements, pacts, retainers, or any attachment that connects to an agent in The Fantasy World Simulator. Triggers on "create item", "generate possession", "new condition", "design spell", "write curse", "create blessing", "divine power", "agreement", "pact", "retainer", "attachment content", "reward pool", "encounter reward", or any work involving the attachment system.
---

# Content Authoring — Attachments, Possessions, Conditions, Powers & Agreements

## Overview

This skill guides the creation of **attachments** — anything that connects to an agent and modifies what they can do, unlock, or experience. The Fantasy World Simulator uses a unified attachment model where items, conditions, spells, divine powers, agreements, and retainers are all expressed through existing graph infrastructure.

**Before using this skill**, read the full design document: `Docs/plans/2026-03-10-attachment-system-design.md`

**Also load the `prose-resolver` skill** if you are writing narrative templates or flavor text — it contains the Threadbare aesthetic guidelines and prose conventions.

## Core Principle

**Every attachment must tell a story.** If it doesn't change what the agent can do, unlock a new encounter, or create a narrative beat, it should not exist. There are no generic items, no filler conditions, no mechanical-only effects. A "+0.10 Iron" modifier should feel like a *story*, not a spreadsheet entry.

## The Six Attachment Categories

| Category | When to Use | Node/Edge Type |
|----------|------------|----------------|
| **Possession** | Physical or magical object the agent carries | `artifact` node + `possesses` edge |
| **Condition** | Transient state: wound, disease, battle rage, enchantment | `trait` node (category: `condition`) + `has_trait` edge with `ticksRemaining` |
| **Blessing/Curse** | Divine or magical condition, longer-lasting | `trait` node (category: `condition`) + `has_trait` edge, longer/permanent duration |
| **Bestowed Power** | Ability granted by a divine source | `trait` node (category: `bestowed`) + `has_trait` edge |
| **Agreement** | Pact, debt, favour, oath between two agents | Enriched `relates_to` edge with `agreement` property block |
| **Retainer** | A follower who serves the agent | `actor` node in the retinue system |

## Four-Tier Rarity System

Every attachment has a tier. Tier determines narrative weight, not just mechanical power.

| Tier | Name | Color | Guideline |
|------|------|-------|-----------|
| 1 | **Mundane** | Pale silver/grey | Useful but ordinary. One simple modifier, one or no tags beyond the minimum. Flavor text optional. |
| 2 | **Storied** | Copper/warm bronze | Has history. Named, 1-2 modifiers, 1+ grants, flavor text required. Should feel like it belongs to someone specific. |
| 3 | **Mythic** | Deep violet/indigo | Changes what's possible. Multiple modifiers, grants, and on-use triggers. Flavor text must be evocative. Should feel dangerous or wondrous. |
| 4 | **Legendary** | Gold/ember glow | World-shaping. Complex modifier sets, multiple grants, dramatic on-use triggers. Reserved for artifact_legendary nodes or the most extreme conditions/agreements. |

**Scaling rule:** Higher tiers have more mechanical complexity AND more narrative depth. A Legendary item should have flavor text that makes the reader want to know its story. A Mundane item needs only a line.

## Creating a Possession

### Required Fields

**Node properties:**
- `name` — Evocative and specific. "Ashenmane, Horse of the Western Reach" not "Warhorse"
- `type` — `artifact` (common) or `artifact_legendary` (tier 4 only)
- `subcategory` — One of: `arms`, `mounts_beasts`, `vestments`, `tomes_scrolls`, `relics_talismans`, `tools_instruments`, `provisions`
- `tier` — 1-4
- `tags` — Must include at least one reach tag (`#iron`, `#gold`, etc.) and one item-type tag (`#weapon`, `#mount`, etc.)
- `mechanicalSummary` — Human-readable, one line: "+Iron, grants cavalry_charge, +movement"
- `lossCondition` — One of: `consumable` (removed on use), `breakable` (can break via on-use trigger), `stealable`, `cursed` (can't be willingly discarded), `permanent`

**Edge properties (on `possesses` or `bonded_to`):**
- `modifiers` — Record of attribute → delta. These feed into the modifier engine automatically.
- `grants` — String array of qualitative unlocks: encounter types, abilities, perceptions.
- `tags` — Edge-level tags (may differ from node tags).

### Optional Fields
- `flavorText` — 1-2 sentences, in-world voice, no mechanical language
- `image` — Path to concept art (generated asynchronously via Imagen)
- `source` — Encounter/event of origin
- `sphereAffinity` — Creation Sphere alignment
- `onUseTriggers` — Array of trigger definitions (see On-Use Triggers below)

### Possession Subcategories

| Subcategory | Primary Reach | What Belongs Here |
|-------------|--------------|-------------------|
| `arms` | Iron | Weapons, shields, war banners, siege equipment |
| `mounts_beasts` | Iron / Flesh | Warhorses, trained hawks, dire wolves, pack animals |
| `vestments` | Star / Veil | Armor, robes, crowns, cloaks, masks |
| `tomes_scrolls` | Eye / Veil | Grimoires, maps, coded messages, research notes |
| `relics_talismans` | Star / Veil | Holy relics, cursed amulets, lodestones, spirit-touched objects |
| `tools_instruments` | Stone / Gold | Forge tools, merchant scales, healer kits, musical instruments |
| `provisions` | Flesh / Gold | Food, drink, medicine, alchemical supplies — always consumable |

### Provisions: Special Rules

Provisions are **always consumable**. When used, they:
1. Grant a temporary condition trait (with `ticksRemaining` and modifiers)
2. The provision node is removed from the graph

The encounter where the agent *acquired* the provision is the story. The mechanical effect is just a condition. Example: "Rations from the Copper Market" → on use, grants condition "Well-Provisioned" with `ticksRemaining: 15`, `modifiers: { iron: +0.05 }`, then the rations node is removed.

## Creating a Condition

### Required Fields

**Trait node:**
- `name` — Descriptive, evocative
- `subcategory` — `condition`
- `tier` — 1-4
- `tags` — Must include effect-type tags: `#disease`, `#wound`, `#poison`, `#curse`, `#blessing`, `#magical`
- `description` — What this means narratively (for the vault/wiki, not the detail card)
- `visibility` — `public` (everyone can see), `discoverable` (requires Eye check), `divine_only`
- `domainContributions` — Reach contributions (positive or negative)
- `importance` — 0.0-1.0

**Edge properties (on `has_trait`):**
- `level` — Usually 1 (binary). Up to 3 for scaling conditions.
- `acquiredTick` — When applied
- `ticksRemaining` — Ticks until auto-removal. `null` for permanent-until-dispelled.
- `source` — What caused this
- `modifiers` — Attribute deltas

### Condition Design Guidelines

**Wounds** (`#wound`): Physical damage. Short duration (5-15 ticks). Negative Iron/Flesh modifiers. Always `public` visibility. Self-heal via decay.

**Diseases** (`#disease`): Spreading afflictions. Medium duration (15-40 ticks). Negative across multiple domains. Can spread to co-located agents. Requires healing to remove early.

**Poisons** (`#poison`): Targeted chemical/alchemical effects. Short-medium duration. Often hidden (`discoverable`). Severe single-domain penalty.

**Curses** (`#curse`): Supernatural afflictions. Often permanent (`ticksRemaining: null`). May require specific ritual/sphere action to remove. Should include a narrative hook — curses have *stories*.

**Blessings** (`#blessing`): Divine or spiritual buffs. Medium duration (8-20 ticks). Positive modifiers. Higher tiers may grant abilities. Always have a source (who blessed them and why).

**Magical effects** (`#magical`): Arcane conditions from spells or artifacts. Variable duration. Can be positive or negative. Often interact with Veil reach.

### Making Conditions Interesting

Bad conditions should still be *narratively interesting*, not just stat penalties. A Mythic curse is more engaging than a Mundane bruise:

- **Mundane wound:** "Bruised ribs. Hurts to breathe." `{ iron: -0.05 }`, 5 ticks
- **Storied curse:** "The tomb's cold follows her. Fires dim when she enters a room." `{ heart: -0.10, star: -0.05 }`, null duration
- **Mythic disease:** "Touched by the Void. Sees things others can't, but the visions are eating her sanity." `{ eye: +0.15, heart: -0.20, mind: -0.10 }`, 30 ticks

## Creating a Bestowed Power

Same structure as conditions, with key differences:

- `subcategory` is `bestowed` (not `condition`)
- `ticksRemaining` is typically `null` (permanent while divine relationship holds)
- `source` references the divine entity that granted it
- Must include `grants` for qualitative abilities, not just modifiers
- Tags must include `#divine` and the relevant sphere

**Loss condition:** Bestowed powers are lost when the `worships` or `aligned_with` relationship to the granting entity breaks. This is checked by the attachment resolver, not by tick decay.

**Example pattern:** "Turn Undead" — tags: `#divine`, `#spirit`, `#life`, `#star`. Modifiers: `{ star: +0.10 }`. Grants: `["turn_undead_encounter", "sense_undead"]`. On-use trigger on critical success: "Radiant Surge" condition for 10 ticks.

## Creating an Agreement

Agreements live on `relates_to` edges between two agents. They modify the relationship and can carry modifiers that affect the source agent.

### Required Fields

**On the `relates_to` edge:**
- Standard: `sentiment`, `strength`, `basis`
- `name` — Display name for UI
- `agreement` block:
  - `type` — `pact`, `debt`, `favour`, `oath`, `treaty`, `bargain`
  - `tier` — 1-4
  - `tags` — `#dark`, `#binding`, `#divine`, `#commercial`, etc.
  - `terms` — Human-readable description
  - `ticksRemaining` — null for permanent, number for time-limited
  - `fulfillmentCondition` — What resolves the agreement
- `modifiers` — Attribute deltas on the source agent

### Agreement Types

| Type | Typical Tags | Duration | Example |
|------|-------------|----------|---------|
| `pact` | `#binding`, `#supernatural` | Permanent until fulfilled | Dark bargain with a demon |
| `debt` | `#commercial`, `#binding` | Until repaid | Loan from a merchant prince |
| `favour` | `#social` | Until called in | Life debt to a healer |
| `oath` | `#binding`, `#divine` | Permanent | Sacred vow at a shrine |
| `treaty` | `#political` | Tick-limited or permanent | Peace between factions |
| `bargain` | `#commercial` | Until fulfilled | Trade deal with a caravan |

## On-Use Triggers

Any attachment can carry an `onUseTriggers` array. These fire when the attachment's tags overlap with an encounter being resolved, creating dramatic micro-story moments.

### Trigger Fields

| Field | Required | Description |
|-------|----------|-------------|
| `triggerCondition` | Yes | When: `critical_failure`, `failure`, `critical_success`, `success`, `any_use`, `first_use` |
| `probability` | Yes | Chance of firing (0.0-1.0) when condition is met |
| `effect` | Yes | What happens — add/remove traits, possessions, edges |
| `narrativeTemplate` | Yes | Prose template using `{actor}`, `{target}`, `{item_name}`, `{location}`, `{they}`, `{them}`, `{their}`, `{adj}` |
| `tags` | No | Tags on the trigger itself: `#breakage`, `#backfire`, `#bonus`, `#revelation` |

### Probability Guidelines

- **Breakage/loss:** 10-25% on critical failure. Items should feel durable but mortal.
- **Backfire:** 10-20% on critical failure. Dramatic, not constant annoyance.
- **Bonus on success:** 20-40% on critical success. Reward should feel special but not guaranteed.
- **Periodic drain (cursed items):** 5-15% on any use. Slow erosion, mounting dread.
- **First use revelation:** 50-100% on first use. Discovery moment for the player.

### Trigger Design Principles

1. **Triggers tell stories.** A sword breaking is a character moment. A spell backfiring is a plot twist. If the trigger doesn't create a story beat, don't add it.
2. **Bad triggers should be interesting, not frustrating.** "Your sword breaks" is interesting if it's a named blade in a critical battle. It's frustrating if it happens randomly to a minor item.
3. **Match tier to drama.** Mundane items: simple triggers (break, deplete). Storied items: narratively flavored triggers. Mythic/Legendary: dramatic triggers with cascading effects.
4. **Narrative templates must read well in context.** They're inserted after encounter outcome prose. They must work grammatically and tonally as a continuation.

### Example Triggers by Category

**Arms — sword breaking:**
- triggerCondition: `critical_failure`, probability: 0.25
- effect: remove possession, grant condition "Disarmed" for 5 ticks
- narrative: "{item_name} shatters against {target}'s defense. {actor} stands empty-handed, fragments ringing on the ground."

**Relics — cursed amulet draining:**
- triggerCondition: `any_use`, probability: 0.10
- effect: grant condition "Drained" `{ heart: -0.1, flesh: -0.1 }` for 8 ticks
- narrative: "The Whispering Eye drinks deep. {actor} feels {adj} cold spread through {their} chest."

**Bestowed power — summoning backfire:**
- triggerCondition: `critical_failure`, probability: 0.15
- effect: spawn hostile actor at location, remove the bestowed power
- narrative: "The summoning circle flares {adj} and wrong. What steps through is not what {actor} called."

**Tomes — forbidden knowledge revelation:**
- triggerCondition: `critical_success`, probability: 0.40
- effect: grant condition "Revelation" `{ eye: +0.3 }` for 20 ticks
- narrative: "The {item_name} pulses with {adj} light. For a moment, {actor} sees the world as it truly is."

## Tag Vocabulary Reference

### Reach Tags
`#iron`, `#gold`, `#shadow`, `#veil`, `#heart`, `#eye`, `#stone`, `#star`, `#flesh`

### Sphere Tags
`#force`, `#matter`, `#energy`, `#life`, `#mind`, `#spirit`, `#time`, `#entropy`

### Effect Type Tags
`#disease`, `#wound`, `#poison`, `#curse`, `#blessing`, `#magical`, `#divine`, `#supernatural`

### Item Type Tags
`#weapon`, `#mount`, `#armor`, `#consumable`, `#tool`, `#relic`, `#tome`, `#instrument`

### Narrative Tags
`#cursed`, `#blessed`, `#ancient`, `#forbidden`, `#legendary`, `#dark`, `#holy`, `#binding`

### Agreement Tags
`#pact`, `#debt`, `#favour`, `#oath`, `#treaty`, `#commercial`, `#binding`

### Trigger Tags
`#breakage`, `#backfire`, `#bonus`, `#revelation`, `#transformation`, `#drain`

Tags can be freely combined. New content can introduce new tags without engine changes. The vocabulary grows organically.

## Writing Flavor Text

**Rules:**
- Maximum 2 sentences
- In-world voice — no mechanical language, no game terms
- Imply history, don't explain it
- Leave room for imagination — suggest, don't specify

**Good:** "The blade remembers every hand that held it. Yours is the coldest yet."
**Bad:** "This sword gives +0.15 to Iron and has a 25% chance to break on critical failure."

**Good:** "She remembers what you said on the third day of the second month."
**Bad:** "A scribe retainer that provides +0.10 Eye when co-located."

**Good:** "It sees what you refuse to look at."
**Bad:** "A cursed amulet that grants Eye domain bonus but penalizes Heart."

## Writing Narrative Templates

Templates use variable substitution: `{actor}`, `{target}`, `{item_name}`, `{location}`, `{they}`, `{them}`, `{their}`, `{adj}`

**Rules:**
- One sentence, two at most
- Must work grammatically when inserted after encounter outcome prose
- Should feel like a dramatic beat, not a status update
- Good triggers make the player react emotionally

## Reward Pool Integration

When creating encounter templates, use the reward pool recipe system to connect encounters to attachment generation. See `Docs/plans/2026-03-10-attachment-system-design.md` Section "Encounter-Driven Acquisition Flow" for the full pool recipe spec.

**Quick reference — pool recipe fields:**
- `categoryWeights` — How likely each attachment type is
- `tierCurve` — Probability distribution across 4 tiers
- `tagFilters` — Constrain pool to matching tags
- `sphereTint` — Favor sphere-aligned items
- `badOutcomeChance` — 0% (critical success) to 90% (critical failure)

## Checklist: Before Submitting Content

1. Does every attachment have a `name` that is evocative and specific?
2. Does every attachment have appropriate tags (at least one reach tag and one type tag)?
3. Does every attachment tier 2+ have flavor text?
4. Are modifiers reasonable? (Typical range: ±0.05 for Mundane, ±0.10-0.15 for Storied, ±0.15-0.25 for Mythic, ±0.25-0.40 for Legendary)
5. Do on-use triggers have narrative templates that read well in context?
6. Does the content follow the Threadbare aesthetic? (Dark world, hidden magic, beauty with darkness emerging from details)
7. Would this attachment make a player say "tell me more" or "oh no" or "I need that"?

If the answer to #7 is no, make it more interesting or don't create it.
