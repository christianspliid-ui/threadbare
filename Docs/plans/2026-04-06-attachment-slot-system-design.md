# Attachment Slot System Design

> **Date:** 2026-04-06
> **Status:** Design — awaiting implementation
> **Purpose:** Prevent power creep via per-subcategory slot caps on attachments, unify possession and condition inventory management, and introduce quality tags for encounter reward filtering.

---

## Problem

Agents can accumulate unlimited attachments with no mechanical constraint. A single agent could hold 10 weapons, 5 vestments, and 8 blessings simultaneously. This produces:

- **Power creep** — modifier stacking beyond `EFFECT_MODIFIER_CAP` is capped, but diverse-reach item hoarding is not
- **Narrative incoherence** — an agent carrying 10 swords breaks fiction
- **No meaningful loot decisions** — every item is pure upside, nothing forces trade-offs
- **No social/economic pressure** — surplus items have no disposal path

## Design Principles

1. **Slots are "where you put it", quality tags are "what it feels like."** Slot tags describe the physical/conceptual category. Quality tags (`#trinket`, `#relic`, `#artifact`) describe significance and can appear on any slot.
2. **Caps create choices, not frustration.** Overflow items become inactive, then the agent tries to sell/gift them — creating social encounters and reputation opportunities.
3. **Conditions use the same cap pattern** but with different overflow behavior (severity escalation, not disposal).
4. **Slot-expanding items are valid.** An attachment can grant bonus capacity in another slot, spending its own slot to do so.
5. **Any effect type can appear on any slot.** The slot/effect mapping in the assessment is a *tendency*, not a constraint. A weapon can have `axiological_drift`. A ring can have `spawn`. Content authors have full freedom.
6. **Quest items are pinned.** They occupy their own slot, are never auto-sold, and are only lost through specific narrative outcomes.
7. **`categoryWeights` selects the structural category, `tagFilters` refines within it.** The reward pool recipe uses `categoryWeights` (possession, condition, curse, blessing, etc.) to decide which node type to scan, and `tagFilters` to narrow by slot tag, quality tag, and reach/context tags. Category answers "item or condition?"; tags answer "which kind?"

---

## Possession Slot Tags

| Slot Tag | Base Max | Covers |
|----------|----------|--------|
| `weapon` | 2 | Swords, bows, staves, daggers |
| `vestment` | 1 | Armor, robes, cloaks, shields, insignia, banners |
| `ring` | 2 | Rings, finger-slot enchantments |
| `necklace` | 1 | Amulets, pendants, torcs |
| `tome` | 2 | Spellbooks, grimoires, maps, ledgers |
| `spell` | 3 | Learned incantations, bound magics |
| `consumable` | 4 | Potions, rations, reagents, scrolls |
| `utility` | 2 | Lockpicks, lanterns, rope, instruments |
| `mount` | 1 | Horses, griffons, war-boars |
| `ally` | 1 | Squires, hired swords, bound spirits |
| `companion` | 1 | Wolves, hawks, familiars |
| `wealth` | 3 | Coin purses, gems, trade goods, deeds |
| `brand` | 2 | Divine marks, ritual scars, tattoos, body modifications |

**Total base capacity:** 25 possession slots.

### Special Slot: Agreements

| Slot Tag | Base Max | Covers |
|----------|----------|--------|
| `agreement` | 4 | Oaths, pacts, debts, favours, treaties, bargains |

Agreements are `relates_to` edges with agreement properties, not possession nodes. They use the same cap system but have no physical representation to sell/gift. Overflow agreements must be resolved narratively (fulfil, betray, or renegotiate).

**Runtime seam — agreements as mechanical participants:**

Currently, agreements are excluded from the effect system. The effect walker (`effectWalker.ts`) only reads `possesses`, `bonded_to`, and `has_trait` edges, all of which point to **nodes** — the walker reads `node.properties.effects` from the target node and uses `node.id` as the runtime-state key. Agreements are **edge-backed**, not node-backed: they live as properties on `relates_to` edges with no target node to read from. This is a structural mismatch that requires a different collection path.

**Agreement effect storage contract:**

- **Where effects live:** `edge.properties.effects: AttachmentEffect[]` — stored directly on the `relates_to` edge, not on a target node. This is a new convention; no other edge type carries effects.
- **Identity key:** `edge.id` — used as both the `attachmentId` in `AttachedEffect` and the key into the `EffectRuntimeState` map.
- **Attachment name:** `edge.properties.agreementName ?? 'Agreement'` — human-readable label.
- **Tier:** `edge.properties.tier ?? 1` — agreements have tiers like possessions.
- **Active flag:** `edge.properties.active ?? true` — same deactivation seam as possessions.

**Walker extension:** `collectAttachmentEffects()` gains a second loop after the node-backed loop. For `relates_to` edges where `edge.properties.agreement` is truthy, it reads `edge.properties.effects` directly (instead of `node.properties.effects`) and uses `edge.id` as identity. The `AttachedEffect` output shape is unchanged — consumers don't need to know the backing is edge-based.

**Reward pool extension:** `assembleRewardPool()` needs an agreement-drawing path. Agreement rewards create `relates_to` edges (not nodes), so instantiation differs:
- `instantiateAgreementReward(graph, recipientId, counterpartyId, template, tick)` creates a `relates_to` edge with `agreement: true`, `effects`, `tier`, `tags`, and `active: true` in edge properties.
- Agreement templates live in the reward catalog alongside possession and condition templates, distinguished by a `category: 'agreement'` field.

Until both seams are extended, agreement effects remain design-only. Implementation order: walker first (enables existing manually-created agreements to carry effects), then reward pool (enables encounter-granted agreements).

### Special Slot: Quest Items

| Slot Tag | Base Max | Covers |
|----------|----------|--------|
| `quest` | 3 | Keys, prophecy fragments, sealed letters, macguffins |

Quest items are **pinned** — they are:
- Never auto-sold or auto-gifted by overflow logic
- `lossCondition: 'permanent'` by default — lost only through specific encounter outcomes
- Not counted against other slot caps (a quest ring doesn't compete with the `ring` slot)
- The game's story threads made tangible

---

## Condition Slot Tags

Conditions are trait nodes connected via `has_trait` edges with tick-based decay. They use the same slot cap pattern but with different overflow behavior.

| Condition Slot | Base Max | Covers |
|----------------|----------|--------|
| `wound` | 3 | Physical injuries, fractures, stab wounds |
| `disease` | 2 | Illnesses, infections, plagues |
| `curse` | 2 | Supernatural afflictions, hexes, ill fortune |
| `blessing` | 2 | Divine boons, supernatural grace |
| `bestowed` | 2 | Permanent granted powers (Spirit Sight, Bloodward) |

**Total base capacity:** 11 condition slots.

### Condition Overflow Behavior

Conditions do NOT trigger sell/gift behavior. Instead:

- **Wounds at cap:** A 4th wound triggers an **incapacitation check** — the agent may become unable to act for a duration, or suffer a permanent `scar` trait.
- **Diseases at cap:** A 3rd disease triggers a **mortality check** — risk of death or permanent `scar` trait.
- **Curses at cap:** A 3rd curse triggers a **corruption check** — risk of `axiological_drift` toward darker values or behavioral compulsion.
- **Blessings at cap:** A 3rd blessing triggers a **transcendence check** — the oldest blessing fades (divine attention is fickle) OR the agent gains a temporary `bestowed` power.
- **Bestowed at cap:** A 3rd bestowed power is **rejected** — mortal vessels have limits. The granting entity may react narratively.

These overflow events are encounter-generating — they produce narrative moments, not silent cap enforcement.

---

## Quality Tags

Quality tags describe the significance of an item and can appear on **any slot tag**. They are the primary mechanism for mapping encounter tiers to reward significance.

| Quality Tag | Meaning | Typical Encounter Tier | Tier Range |
|-------------|---------|----------------------|------------|
| `#trinket` | Minor, common, easily replaced | Background | 1–2 |
| `#relic` | Historically/spiritually significant, storied | Shaping / Story beat | 2–3 |
| `#artifact` | Unique, world-shaping, legendary | Story beat only | 3–4 |

### Quality Tags in Reward Recipes

Encounter templates use `categoryWeights` to select the structural type, and `tagFilters` (which includes quality tags) to refine:

```typescript
// Background encounter — minor loot from any possession slot
rewardPool: {
  categoryWeights: { possession: 1.0 },
  tagFilters: ['#trinket'],
}

// Shaping encounter — a significant spell
rewardPool: {
  categoryWeights: { possession: 1.0 },
  tagFilters: ['#relic', '#spell'],
}

// Story beat — a legendary possession from any slot
rewardPool: {
  categoryWeights: { possession: 1.0 },
  tagFilters: ['#artifact'],
}

// Precise filtering — a cursed ancient war-blade
rewardPool: {
  categoryWeights: { possession: 1.0 },
  tagFilters: ['#relic', '#weapon', '#iron', '#cursed'],
}
```

### Condition Tags in Reward Recipes

Negative outcomes use condition/curse/blessing categories with tag refinement. When an encounter says "inflict a curse," it doesn't hardcode which one:

```typescript
// Failed a duel — suffer a combat wound
rewardPool: {
  categoryWeights: { condition: 1.0 },
  tagFilters: ['#wound', '#combat'],
}

// Critical failure exploring ruins — get cursed
rewardPool: {
  categoryWeights: { curse: 1.0 },
  tagFilters: ['#shadow'],
}

// Swamp exploration failure — contract a disease
rewardPool: {
  categoryWeights: { condition: 1.0 },
  tagFilters: ['#disease', '#flesh', '#wilderness'],
}

// Shrine blessing on success
rewardPool: {
  categoryWeights: { blessing: 1.0 },
  tagFilters: ['#star'],
}

// Eldritch horror encounter — madness
rewardPool: {
  categoryWeights: { curse: 1.0 },
  tagFilters: ['#veil', '#madness'],
}

// Mixed outcome — loot and wounds
rewardPool: {
  categoryWeights: { possession: 0.6, condition: 0.3, curse: 0.1 },
  tagFilters: ['#combat'],
}
```

**Condition tag vocabulary** (content-extensible, not exhaustive):

| Tag | Category | Examples |
|-----|----------|---------|
| `#wound` | Physical injury | Fractured Arm, Deep Stab Wound, Spine Wound |
| `#disease` | Illness/infection | Road Fever, Gut Rot, Greyscale, The Wasting |
| `#curse` | Supernatural affliction | Ill Luck, Tonguebound, Void-Touched |
| `#blessing` | Divine/supernatural boon | Dawn-Kissed, Saint's Ward, The Anointing |
| `#madness` | Psychological/cognitive | Paranoia, Obsession, Fractured Memory, Voices |
| `#corruption` | Entropic/moral degradation | Creeping Darkness, Soul Taint, Entropy's Kiss |
| `#exhaustion` | Fatigue/depletion | Road-Weary, Essence-Drained, Overextended |
| `#combat` | Context: from fighting | Combat wounds, battle curses |
| `#wilderness` | Context: from nature | Diseases, beast wounds, exposure |
| `#arcane` | Context: from magic | Spell backlash, ritual scars, veil sickness |
| `#divine` | Context: from gods | Divine brands, blessings, holy burns |
| `#social` | Context: from betrayal/loss | Heartbreak, broken trust, shame |

Tags combine freely: a `#wound #arcane #veil` is a magical injury from spell backlash. A `#curse #divine #star` is a god's punishment. A `#disease #corruption #entropy` is an entropic plague.

### Filtering Model

The reward system filters on two axes:

1. **`categoryWeights`** (structural) — selects which node type to scan. `possession` scans `artifact` nodes, `condition`/`curse`/`blessing` scan `trait` nodes, `agreement` scans `relates_to` edges. This axis is required and cannot be replaced by tags.
2. **`tagFilters`** (refinement) — narrows within the selected category. Includes slot tags (`#weapon`, `#spell`), quality tags (`#trinket`, `#relic`, `#artifact`), reach tags (`#iron`, `#shadow`), and context tags (`#combat`, `#wilderness`).

`categoryWeights` answers "item or condition?" — `tagFilters` answers "which kind?"

---

## Slot Expansion via Effects

Slot expansion uses a dedicated `SlotBonusEffect` (type 39). `PassiveEffect` only supports `{ reach, value }` and `modify_rules` uses `EffectScope` (self/target/hex), neither of which can carry a slot tag. A new typed primitive is cleaner than overloading existing ones.

```typescript
// New effect type — add to AttachmentEffect union in src/types/effects.ts
export interface SlotBonusEffect {
  readonly type: 'slot_bonus';
  readonly slotTag: string;    // target slot to expand (e.g. 'consumable')
  readonly bonus: number;      // additional slots granted
}
```

The slot cap resolver is the only consumer. It collects all active `slot_bonus` effects for the agent and sums `bonus` per `slotTag`. The effect walker reads it like any other effect — no special query function needed.

```typescript
// Bag of Holding — a utility item that grants +2 consumable slots
{
  slotTag: 'utility',
  effects: [{ type: 'slot_bonus', slotTag: 'consumable', bonus: 2 }]
}
```

**Design examples:**

| Item | Occupies Slot | Grants |
|------|--------------|--------|
| Bag of Holding | `utility` | +2 `consumable` |
| Weapon Rack | `utility` | +1 `weapon` |
| Tome of Binding | `tome` | +1 `spell` |
| Signet of Office | `ring` | +1 `agreement` |
| Saddlebags | `mount` effect | +2 `wealth` |
| Reliquary | `vestment` (worn container) | +1 `blessing` |

The trade-off is real: a utility slot spent on a Bag of Holding is a utility slot not spent on a lantern or lockpicks.

**Resolution:** The effective cap for a slot is `BASE_MAX + sum(slot_bonus effects targeting that slotTag from all active attachments)`.

---

## Overflow Behavior (Possessions)

When an agent gains an attachment that exceeds the effective cap for its slot:

### Phase 1: Deactivation
The lowest-priority item in the overflowing slot becomes **inactive**:
- A property `active: false` is set on the `possesses`/`bonded_to`/`has_trait` edge
- **The suppression seam lives in `effectWalker.ts`**, not individual resolvers. `collectAttachmentEffects()` must skip edges where `edge.properties.active === false`. This ensures ALL effect consumers (resolver, queries, events, tick effects) respect deactivation uniformly — no leaking of behavior_weight, social_modifier, action_gate, etc. from inactive items.
- Priority is determined by: tier (lower first), then acquisition tick (older first)

**Slot-expanding cascade rule:** When deactivating an item causes a slot-expanding item to become inactive (shrinking another slot's cap), the system must re-evaluate caps in a fixed-point loop. Cap: `MAX_DEACTIVATION_CASCADES = 3` — if not stable after 3 passes, emit a warning trace and stop. In practice cascades should be rare (requires a slot-expanding item to itself be in an overflowing slot).

### Phase 2: Disposal Motivation
Inactive items create a **disposal motivation** in the agent's Maslow pipeline:
- Feeds into the `esteem` or `belonging` need layer
- Agent seeks social encounters to sell or gift the surplus item:
  - **Sell** — at a trade location, converts to `wealth` slot item or prosperity boost
  - **Gift** — to a nearby agent, grants `reputation` trait boost and/or positive `agreement` (favour owed)
  - **Offer** — at a shrine/temple, converts to divine influence or blessing

### Phase 3: Fallback
If no disposal opportunity arises within `OVERFLOW_DISPOSAL_TIMEOUT_TICKS` ticks, the item is **dropped** (removed from inventory) and may become lootable at the agent's current location.

---

## Reach Coverage Assessment

How well the slot system serves agents across all Nine Reaches:

| Reach | Primary Slots | Secondary Slots | Coverage |
|-------|--------------|----------------|----------|
| **Iron** | weapon, vestment | brand, ally | Strong |
| **Gold** | wealth | utility, consumable, agreement | Strong (distributed) |
| **Shadow** | ring, agreement | necklace, consumable | Adequate |
| **Veil** | spell, tome | ring, necklace, consumable | Excellent |
| **Heart** | necklace, ally, companion, agreement | ring, brand | Excellent |
| **Eye** | tome | utility, companion | Thin — narratively correct (perception, not gear) |
| **Stone** | utility | mount, brand | Thin — narratively correct (landscape, not personal) |
| **Star** | necklace, brand | blessing (condition), agreement | Strong (faith-themed) |
| **Flesh** | mount, consumable, brand | vestment, companion | Strong |

Eye and Stone are intentionally thin — these reaches are about perception and landscape, not personal equipment. Agents strong in Eye carry tomes; agents strong in Stone carry tools. The fiction holds.

---

## Effect Primitive Opportunities

Key effect types and their natural (not exclusive) slot affinities:

| Effect | Natural Slots | Design Opportunity |
|--------|--------------|-------------------|
| `passive` (1) | Any | Bread-and-butter reach modifier |
| `consumable_charge` (2) | consumable, utility | Limited-use items with charges |
| `conditional` (6) | weapon, vestment, ring | Context-dependent bonuses (in_combat, health_low) |
| `trait_grant` (7) | tome, brand, quest | Unlock qualitative capabilities |
| `transform` (8) | quest, consumable | Items that evolve into other items — quest chains |
| `stacking` (9) | weapon, companion | Bloodthirst swords, loyalty-building companions |
| `aura` (10) | necklace, ally, brand | Area effects on nearby agents |
| `reactive` (11) | vestment, weapon, companion | Triggers when attacked/damaged |
| `tradeoff` (13) | weapon, brand | +Iron/-Heart cursed blade, +Veil/-Flesh dark mark |
| `axiological_drift` (33) | ring, agreement, brand | Slowly shifts agent values — the One Ring effect |
| `social_modifier` (31) | wealth, agreement, ally | Modifies cooperation/reputation |
| `behavior_weight` (30) | agreement, tome | Oath compels Iron actions, grimoire encourages Veil |
| `action_gate` (32) | agreement, quest, wealth | Oath forbids Shadow, money opens doors |
| `compel` (25) | agreement, brand | Override agent decisions — binding oaths |
| `range_modifier` (34) | mount, utility, companion | Movement speed, awareness range |
| `tag_immunity` (35) | vestment, necklace, brand | Immune to #poison, #curse, #disease |
| `reveal` (17) | tome, utility, companion | Bypass awareness range |
| `faction_manipulate` (28) | agreement, wealth | Political/economic influence |
| `hex_effect` (37) | brand, mount | Corrupts/blesses ground beneath agent |

---

## Constants Table

```typescript
// --- Possession Slot Caps ---
export const SLOT_CAPS: Record<string, number> = {
  weapon: 2,
  vestment: 1,
  ring: 2,
  necklace: 1,
  tome: 2,
  spell: 3,
  consumable: 4,
  utility: 2,
  mount: 1,
  ally: 1,
  companion: 1,
  wealth: 3,
  brand: 2,
  agreement: 4,
  quest: 3,
};

// --- Condition Slot Caps ---
export const CONDITION_CAPS: Record<string, number> = {
  wound: 3,
  disease: 2,
  curse: 2,
  blessing: 2,
  bestowed: 2,
};

// --- Overflow Behavior ---
export const OVERFLOW_DISPOSAL_TIMEOUT_TICKS = 24; // 2 game days
export const OVERFLOW_GIFT_REPUTATION_BONUS = 0.05;
export const OVERFLOW_SELL_WEALTH_BONUS = 5; // added to agent wealth score
export const OVERFLOW_OFFER_DIVINE_INFLUENCE_BONUS = 0.03;

// --- Condition Overflow ---
export const WOUND_INCAPACITATION_CHECK_DIFFICULTY = 0.4;
export const DISEASE_MORTALITY_CHECK_DIFFICULTY = 0.5;
export const CURSE_CORRUPTION_DRIFT_PER_TICK = 0.01;
export const BLESSING_FADE_OLDEST_FIRST = true;
export const BESTOWED_REJECTION_THRESHOLD = 3; // === cap + 1

// --- Slot Expansion ---
export const MAX_SLOT_BONUS_PER_ITEM = 3; // no single item grants more than +3 to any slot
export const MAX_DEACTIVATION_CASCADES = 3; // fixed-point loop cap for cascade deactivation
```

---

## Tracing

All traces extend `TraceBase` (`id`, `tick`, `timestamp`, `category`, `agentId?`, `summary`) from `src/types/trace.ts`. New categories must be registered in `TraceCategory` and `TRACE_CATEGORIES` before use.

**New TraceCategory values to register:** `'slot_overflow'`, `'slot_disposal'`, `'condition_overflow'`, `'slot_expansion'`

```typescript
// All extend TraceBase. Fields below are the category-specific payload.

// category: 'slot_overflow'
// summary: "Deactivated {itemName} — {slotTag} slots full ({currentCount}/{effectiveCap})"
{
  category: 'slot_overflow',
  agentId: string,
  slotTag: string,
  currentCount: number,
  effectiveCap: number,
  deactivatedItemId: string,
  deactivatedItemName: string,
}

// category: 'slot_disposal'
// summary: "{agentName} {method} {itemName} at {locationName}"
{
  category: 'slot_disposal',
  agentId: string,
  slotTag: string,
  itemId: string,
  itemName: string,
  method: 'sell' | 'gift' | 'offer' | 'drop',
  recipientId?: string,
  reputationDelta?: number,
  wealthDelta?: number,
}

// category: 'condition_overflow'
// summary: "{agentName} suffers {overflowEvent} — {conditionSlot} at {currentCount}/{cap}"
{
  category: 'condition_overflow',
  agentId: string,
  conditionSlot: string,
  currentCount: number,
  cap: number,
  overflowEvent: 'incapacitation_check' | 'mortality_check' | 'corruption_check' | 'transcendence_check' | 'rejection',
  outcome: 'passed' | 'failed',
  consequenceTraitId?: string,
}

// category: 'slot_expansion'
// summary: "{itemName} expands {targetSlot} cap to {newEffectiveCap}"
{
  category: 'slot_expansion',
  agentId: string,
  sourceItemId: string,
  targetSlot: string,
  bonusSlots: number,
  newEffectiveCap: number,
}
```

---

## PRNG Callouts

| Location | Needs Seeded Roll | Why |
|----------|-------------------|-----|
| Overflow priority tiebreaker | Yes | When two items share tier + acquisition tick |
| Condition overflow checks | Yes | Incapacitation, mortality, corruption checks use sigmoid → d100 |
| Disposal method selection | Yes | Agent chooses sell/gift/offer based on personality + PRNG |
| Blessing fade selection | No | Deterministic: oldest blessing fades first (`BLESSING_FADE_OLDEST_FIRST`) |

---

## Fail-Soft Table

| Failure Case | Fallback |
|-------------|----------|
| Attachment has no `slotTag` | Treat as uncapped — no slot enforcement, emit warning trace |
| `slotTag` not in `SLOT_CAPS` | Treat as uncapped — forward-compatible with new tags |
| Condition has no condition slot tag | Treat as uncapped — no overflow check |
| Slot bonus modifier resolves to negative | Clamp to 0 — effective cap never below base |
| Agent has no disposal opportunities after timeout | Drop item at location — becomes lootable node |
| Overflow check on condition fails to resolve | Skip consequence — condition still applies, emit error trace |

---

## Wiring

| Surface | Integration Point |
|---------|------------------|
| **Orchestrator phase** | New `enforceSlotCaps` phase runs after reward granting, before end-of-tick |
| **Reward granting** | `instantiateReward()` checks slot cap immediately; if over, flags item inactive |
| **Agent AI (Maslow)** | Inactive items feed `disposal_motivation` into esteem/belonging layer |
| **Encounter system** | Disposal encounters (sell, gift, offer) as new encounter subtypes |
| **Effect walker** | `collectAttachmentEffects()` skips edges with `active: false`; gains second loop for agreement edges reading `edge.properties.effects` |
| **Effect resolver** | No changes — inactive suppression handled by walker upstream |
| **Slot cap resolver** | New `getSlotBonuses()` query collects `slot_bonus` effects, sums `bonus` per `slotTag` |
| **UI — Detail modal** | `AttachmentDetailModal` for every possession, condition, agreement, quest item. Uses `EntityCard` + `Modal`. Shows effects, tags, slot usage, duration, history. |
| **UI — Agent character sheet** | Attachments tab grouped by slot tag with `(count/cap)` headers. Inactive section at bottom. Each row clickable → detail modal. |
| **UI — Codex** | Browsable encyclopedia of all discovered items/conditions. Category tabs, quality tag filters, reach filters, knowledge gating. Entry states: Held / Known / Unseen. |
| **UI — Encounter aftermath** | Every gained attachment and suffered condition is a clickable `AttachmentRow`. Opens detail modal overlaid on aftermath. Slot overflow warnings inline. |
| **Debug panel** | `slots <agent>`, `overflow <agent>`, `conditions <agent>`, `codex` CLI commands |
| **Traces** | `slot_overflow`, `slot_disposal`, `condition_overflow`, `slot_expansion` |

---

## Migration

### Existing Attachment Data

The current `subcategory` field on possessions (`arms`, `vestments`, `mounts_beasts`, `tomes_scrolls`, `relics_talismans`, `tools_instruments`, `provisions`) must be migrated to the new `slotTag` system:

| Old Subcategory | New Slot Tag | Notes |
|----------------|-------------|-------|
| `arms` | `weapon` | Direct rename |
| `vestments` | `vestment` | Direct rename |
| `mounts_beasts` | `mount` | Direct rename |
| `tomes_scrolls` | `tome` or `consumable` | Tomes → `tome`; scrolls → `consumable` |
| `relics_talismans` | Add `#relic` quality tag | Slot determined by item nature (ring, necklace, etc.) |
| `tools_instruments` | `utility` | Direct rename |
| `provisions` | `consumable` | Direct rename |

New slot tags with no old equivalent: `ring`, `necklace`, `spell`, `wealth`, `ally`, `companion`, `brand`, `agreement`, `quest`.

### Condition Data

Existing condition tags (`#wound`, `#disease`, `#blessing`, `#curse`) already map directly to condition slot tags. Bestowed powers (`subcategory: 'bestowed'`) map to the `bestowed` condition slot. No migration needed for conditions.

---

## UI / Visibility

Every attachment and condition in this system must be inspectable by the player. Three access paths, one detail modal.

### 1. Detail Modal (per item/condition)

Every possession, condition, agreement, and quest item opens an **AttachmentDetailModal** when clicked. Uses the existing `EntityCard` renderer inside a `Modal` shell.

**Modal layout:**

```
┌─────────────────────────────────────────────┐
│  [Slot Icon]  Iron Blade            [✕]     │
│  weapon · tier 2 · #relic                   │
│  ─────────────────────────────────────────  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  [Image / Glyph fallback]          │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  "Forged in a dead forge-town. The metal    │
│   remembers heat it should not."            │
│                                             │
│  ── Effects ──────────────────────────────  │
│  +0.08 Iron reach (passive)                 │
│  Bloodthirst: +0.01 Iron per kill (max 5)   │
│                                             │
│  ── Details ──────────────────────────────  │
│  Loss condition: breakable                  │
│  Active: ✓  │  Slot: weapon 2/2             │
│                                             │
│  ── History ──────────────────────────────  │
│  Acquired tick 34 · Found in Ashenmane Lair │
│                                             │
│  [ View in Codex ]                          │
└─────────────────────────────────────────────┘
```

**Sections (EntitySection-based, compositional):**

| Section | Content | Structured Block |
|---------|---------|-----------------|
| **Header** | Name, slot tag, tier, quality tags (#relic, #artifact, #trinket) | — |
| **Image** | Hero image or glyph fallback (tier-colored) | — |
| **Flavor** | `flavorText` prose | — |
| **Effects** | All `effects[]` rendered as human-readable lines | `domain_grid` for reach modifiers, `trigger` for activated/reactive |
| **Details** | Loss condition, active/inactive status, slot usage, duration (for conditions) | `keyword_cloud` for tags |
| **History** | Acquisition tick, source encounter, location found | `timeline` |
| **Codex link** | "View in Codex" button in footer | — |

**Condition-specific sections:**

| Section | Content |
|---------|---------|
| **Duration** | Progress bar showing `ticksRemaining / totalTicks`, tier-colored |
| **Severity** | Current condition count vs cap (e.g., "Wounds: 2/3") |
| **Cure** | What removes it — rest, healing, dispel, specific encounter |

**Fail-soft:** Missing fields render as absent sections, never as errors. An attachment with no `flavorText` simply skips the flavor section. An attachment with no `effects[]` shows "No mechanical effects" in muted text.

### 2. Agent Character Sheet (Attachments Tab)

The existing `AgentProfileModal` has an **Attachments tab**. This tab must display slot-organized inventory:

```
┌─ Attachments ────────────────────────────────┐
│                                              │
│  ── Weapons (2/2) ─────────────────────────  │
│  ⚔ Iron Blade          Tier 2  #relic       │
│  ⚔ Hunting Bow          Tier 1              │
│                                              │
│  ── Vestment (1/1) ────────────────────────  │
│  🛡 Shadowweave Cloak    Tier 2              │
│                                              │
│  ── Rings (1/2) ───────────────────────────  │
│  💍 Ring of Whispers     Tier 2  #trinket    │
│                                              │
│  ── Spells (2/3) ──────────────────────────  │
│  ✦ Flamebind            Tier 2              │
│  ✦ Warding Circle        Tier 1              │
│                                              │
│  ── Wealth (1/3) ──────────────────────────  │
│  ◆ Pouch of Silver       Tier 1              │
│                                              │
│  ── Conditions ────────────────────────────  │
│  ── Wounds (1/3) ──                          │
│  ✦ Bruised Ribs         Tier 1  ████░░ 12t  │
│  ── Blessings (1/2) ──                       │
│  ✦ Dawn-Kissed          Tier 1  █████░  8t  │
│                                              │
│  ── Agreements (2/4) ──────────────────────  │
│  📜 Oath to the Wardens   pact              │
│  📜 Favour Owed (Smith)   debt              │
│                                              │
│  ── Quest Items ───────────────────────────  │
│  🔑 Sealed Letter         (pinned)          │
│                                              │
│  ── Inactive ──────────────────────────────  │
│  ⚔ Rusty Mace  Tier 1  (overflow — seeking  │
│     buyer)                                   │
│                                              │
└──────────────────────────────────────────────┘
```

**Layout rules:**

- Grouped by slot tag, each group shows `(count/cap)` in the section header
- Slot groups with 0 items are hidden (don't show empty "Necklace (0/1)")
- Each row is an `AttachmentRow` — clickable, opens detail modal
- Quality tags (#relic, #artifact, #trinket) shown as colored pills after tier badge
- Conditions show duration progress bar inline
- Agreements show subtype (pact, debt, oath, favour) as subtitle
- Quest items show "(pinned)" label, visually distinct (gold border or accent)
- **Inactive section** at bottom — muted styling, shows overflow reason and disposal status
- Slot groups sorted by: quest (top, always visible) → possessions (by slot tag alpha) → conditions → agreements → inactive (bottom)

### 3. Codex (Encyclopedia)

The Codex is a browsable collection of all discovered items and conditions. It serves as both a reference and a collection tracker.

**Access points:**
- "View in Codex" button from any detail modal
- Codex tab in a top-level game menu (alongside Chronicle, Map, etc.)
- Agent character sheet → click any attachment → detail modal → "View in Codex"

**Codex structure:**

```
┌─ Codex ──────────────────────────────────────┐
│                                              │
│  [Search: _______________]  [Filter ▾]       │
│                                              │
│  ── Categories ────────────────────────────  │
│  Weapons (4)  Vestments (1)  Rings (2)       │
│  Spells (3)   Tomes (1)     Consumables (6)  ���
│  Mounts (1)   Allies (0)    Companions (1)   │
│  Wealth (2)   Brands (0)    Utility (3)      │
│  Agreements (3)  Quest Items (1)             │
│  ────────────────────────────────────────    │
│  Wounds (2)  Diseases (0)  Curses (1)        │
│  Blessings (2)  Bestowed (0)                 │
│                                              │
│  ── Weapons ───────────────────────────────  │
│  ⚔ Iron Blade       T2 #relic    [Held: ✓]  │
│  ⚔ Hunting Bow      T1           [Held: ✓]  │
│  ⚔ Rusty Mace       T1           [Lost]     │
│  ⚔ The Quiet Blade  T4 #artifact [Unseen]   │
│                                              │
└──────────────────────────────────────────────┘
```

**Codex entry states:**

| State | Meaning | Visual |
|-------|---------|--------|
| **Held** | Currently in an agent's inventory (any agent) | Full detail, bright text |
| **Known** | Previously held or encountered, now lost/used | Full detail, muted text |
| **Unseen** | Exists in catalog but never encountered | Name + slot + tier only, blurred/redacted prose, "???" effects |

**Codex vs detail modal:**
- The **detail modal** shows one item in context (who holds it, when acquired, active/inactive)
- The **Codex entry** shows the item as a reference (all known effects, full prose, acquisition history across all agents)
- Clicking an item in the Codex opens its detail modal with the reference view (no agent context)

**Filtering:**
- By slot tag (category tabs or pills)
- By quality tag (#trinket / #relic / #artifact toggle)
- By reach affinity (Iron, Shadow, etc.)
- By state (held / known / unseen)
- Free text search on name + tags

**Knowledge gating:** The Codex respects the existing `insightTier` system on `EntitySection`. Sections the player hasn't earned insight into show as redacted. This applies to Unseen items (visible as placeholders to hint at what exists) and to hidden effects on Known items (e.g., a cursed ring's drift effect isn't shown until the player discovers it).

### 4. Encounter Aftermath (Reward/Penalty Display)

When an encounter resolves and grants rewards or inflicts conditions, the aftermath view must make every attachment and condition **clickable**.

**Aftermath reward/penalty display:**

```
┌─ Encounter Complete ─────────────────────────┐
│                                              │
│  Road Ambush — Success                       │
│                                              │
│  "The bandits scatter. Among the wreckage,   │
│   something catches your eye..."             │
│                                              │
│  ── Gained ────────────────────────────────  │
│  ⚔ Blackiron Blade     Tier 2  weapon  [→]  │
│  ◆ Stolen Coin Purse    Tier 1  wealth  [→]  │
│  ★ +0.05 reputation                          │
│                                              │
│  ── Suffered ──────────────────────────────  │
│  ✦ Bruised Ribs        Tier 1  wound   [→]  │
│                                              │
│  [ Continue ]                                │
└──────────────────────────────────────────────┘
```

**Rules:**

- Every attachment/condition line is a clickable `AttachmentRow`
- Clicking opens the **detail modal** for that specific item/condition, overlaid on the aftermath view
- The `[→]` indicator signals clickability (or the whole row highlights on hover)
- Non-attachment rewards (reputation, wealth score, prosperity) are shown as plain text lines — not clickable
- Gained items show slot tag as a subtle label (helps player understand inventory impact)
- Suffered conditions show condition slot tag + duration if applicable
- If gaining an item triggers a slot overflow, show an inline warning: "Rusty Mace deactivated — weapon slots full (2/2)"
- The aftermath view does NOT auto-dismiss — player must click "Continue" (this is a learning moment)

**Penalty display for conditions:**

- Wounds, diseases, curses show with a red/amber left-border accent
- Blessings show with gold/warm accent
- Duration shown inline: "Bruised Ribs · 20 ticks"
- Clicking opens the condition detail modal with cure information

### 5. Debug Panel

The debug CLI gains slot inspection commands:

| Command | Output |
|---------|--------|
| `slots <agent>` | All slot usage: tag, count/cap, active/inactive breakdown |
| `overflow <agent>` | Items currently inactive + disposal status |
| `conditions <agent>` | All conditions with remaining ticks + slot usage |
| `codex` | Summary: total items known, held, unseen per category |

---

## NFP Compliance

| Priority | Status | Notes |
|----------|--------|-------|
| 1. Tunability | PASS | All caps, thresholds, and bonuses are named constants |
| 2. Inspectability | PASS | Four trace types cover overflow, disposal, condition overflow, and expansion |
| 3. Determinism | PASS | PRNG callouts identified; tiebreakers and checks use seeded rolls |
| 4. Fail-soft | PASS | Unknown tags treated as uncapped; missing data → skip, don't crash |
| 5. Narrative over mechanical | PASS | Condition overflow produces story events, not silent caps. Disposal creates social encounters. |
| 6. Additive | PASS | New `slotTag` field added; old `subcategory` deprecated but not removed immediately |
| 7. Performance | PASS | Slot cap check is O(n) over agent's attachments — trivial cost |
