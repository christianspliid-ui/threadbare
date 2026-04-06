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
7. **One unified tag filter for all rewards — possessions and conditions alike.** The reward pool recipe uses `tags[]` to filter both items and conditions from the same catalog. `{ tags: ['#curse', '#shadow'] }` draws a shadow-aligned curse; `{ tags: ['#relic', '#weapon'] }` draws a storied blade. The system doesn't distinguish between "gain an item" and "suffer a condition" at the filtering level — tags select, tier curves weight, and the node type determines how it's attached.

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

Encounter templates use quality tags to describe rewards without specifying slots:

```typescript
// Background encounter — minor loot from any slot
rewardPool: { tags: ['#trinket'] }

// Shaping encounter — a significant spell
rewardPool: { tags: ['#relic', '#spell'] }

// Story beat — a legendary item from any slot
rewardPool: { tags: ['#artifact'] }

// Precise filtering — a cursed ancient war-blade
rewardPool: { tags: ['#relic', '#weapon', '#iron', '#cursed'] }

// Loose filtering — any minor item
rewardPool: { tags: ['#trinket'] }
```

### Condition Tags in Reward Recipes

The same `tags[]` filter works for negative outcomes — conditions are tagged in the catalog alongside possessions. When an encounter says "inflict a curse," it doesn't hardcode which one:

```typescript
// Failed a duel — suffer a combat wound
rewardPool: { tags: ['#wound', '#combat'] }

// Critical failure exploring ruins — get cursed
rewardPool: { tags: ['#curse', '#shadow'] }

// Swamp exploration failure — contract a disease
rewardPool: { tags: ['#disease', '#flesh', '#wilderness'] }

// Shrine blessing on success
rewardPool: { tags: ['#blessing', '#star'] }

// Eldritch horror encounter — madness
rewardPool: { tags: ['#curse', '#veil', '#madness'] }

// Betrayal consequence — social/psychological wound
rewardPool: { tags: ['#wound', '#heart'] }

// Divine overreach — branded by the gods
rewardPool: { tags: ['#brand', '#star', '#divine'] }
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

### Unified Filtering Model

The reward system filters on three independent axes — all using the same `tags[]` mechanism:

- **Slot/condition tag** — what kind of thing (weapon, ring, wound, curse...)
- **Quality tag** — how significant (#trinket, #relic, #artifact)
- **Reach/context tags** — thematic flavor (#iron, #shadow, #combat, #wilderness...)

The pool assembler doesn't distinguish possessions from conditions at the filtering level. Tags select candidates, tier curves weight them, and the node type (`artifact` vs `trait`) determines how the result is attached to the agent.

---

## Slot Expansion via Effects

Attachments can grant bonus capacity in another slot using the existing `passive` effect type with a `slot_bonus:<slotTag>` modifier key.

```typescript
// Bag of Holding — a utility item that grants +2 consumable slots
{
  slotTag: 'utility',
  effects: [{ type: 'passive', modifiers: { 'slot_bonus:consumable': 2 } }]
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

**Resolution:** The effective cap for a slot is `BASE_MAX + sum(slot_bonus:<slotTag> from all active effects)`.

---

## Overflow Behavior (Possessions)

When an agent gains an attachment that exceeds the effective cap for its slot:

### Phase 1: Deactivation
The lowest-priority item in the overflowing slot becomes **inactive**:
- Its effects stop resolving (not counted by `resolveEffectModifiers`)
- It remains in the agent's inventory but is flagged `active: false`
- Priority is determined by: tier (lower first), then acquisition tick (older first)

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
export const SLOT_BONUS_MODIFIER_PREFIX = 'slot_bonus:';
export const MAX_SLOT_BONUS_PER_ITEM = 3; // no single item grants more than +3 to any slot
```

---

## Tracing

```typescript
interface SlotOverflowTrace {
  type: 'slot_overflow';
  agentId: string;
  slotTag: string;
  currentCount: number;
  effectiveCap: number;
  deactivatedItemId: string;
  deactivatedItemName: string;
}

interface SlotDisposalTrace {
  type: 'slot_disposal';
  agentId: string;
  slotTag: string;
  itemId: string;
  itemName: string;
  method: 'sell' | 'gift' | 'offer' | 'drop';
  recipientId?: string; // for gift
  reputationDelta?: number;
  wealthDelta?: number;
}

interface ConditionOverflowTrace {
  type: 'condition_overflow';
  agentId: string;
  conditionSlot: string;
  currentCount: number;
  cap: number;
  overflowEvent: 'incapacitation_check' | 'mortality_check' | 'corruption_check' | 'transcendence_check' | 'rejection';
  outcome: 'passed' | 'failed';
  consequenceTraitId?: string; // scar, drift, etc.
}

interface SlotExpansionTrace {
  type: 'slot_expansion';
  agentId: string;
  sourceItemId: string;
  targetSlot: string;
  bonusSlots: number;
  newEffectiveCap: number;
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
| **Effect resolver** | `resolveEffectModifiers` skips effects from inactive items; reads `slot_bonus:` modifiers |
| **UI — Attachment detail** | Show active/inactive status; show effective cap with bonuses |
| **UI — Agent panel** | Slot usage summary (e.g., "Weapons: 2/2") |
| **Debug panel** | `attachments <agent>` CLI command shows slot usage + overflow status |
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
