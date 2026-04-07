# Attachment Pipeline: Thin Primitives (resource_manipulate, slot_bonus, content_grant)
> Category: possessions | Slug: fill-thin-primitives | Pass: draft
> Status: **DRAFT**

## Batch Summary

| Field | Value |
|-------|-------|
| Target primitives | `resource_manipulate` (1 existing usage), `slot_bonus` (1 existing usage), `content_grant` (1 existing usage) |
| Items | 12 possessions |
| Tier spread | T1 x4, T2 x6, T3 x2 |
| Subcategories | relics_talismans (4), tools_instruments (4), provisions (2), tomes_scrolls (2) |
| Reach spread | star (3), veil (2), gold (2), stone (2), iron (1), heart (1), multi (1) |
| Primitive coverage | resource_manipulate x7, slot_bonus x6, content_grant x3 (some items use 2+ target primitives) |

---

## Design Rationale

**resource_manipulate** has exactly one existing usage: the Miser's Mark curse drains quintessence per tick as a penalty. This batch introduces the positive, player-facing side of the primitive -- essence and quintessence restoration. Items pair resource manipulation with `conditional` (shrine/mystical context gates), `tradeoff` (drain one resource to fuel another), and `decay` (restoration that fades as the item is consumed). The primitive creates genuine economy moments -- agents with prayer foci can sustain themselves in divine encounters, while parasitic relics impose hard choices.

**slot_bonus** has exactly one existing usage: the Pack Goat grants +1 consumable slot. This batch widens coverage to weapon, tome, and utility slots, establishing slot expansion as a legitimate item design axis. Items pair slot bonuses with `passive` (small reach bonus), `range_modifier` (heavy packs slow movement), and `conditional` (bonus slots only in certain contexts). Slot expansion items are fundamentally utility plays -- they don't make you stronger directly, they let you carry more of what makes you stronger.

**content_grant** has exactly one existing usage: the Letters of Introduction service reward grants Patron's Backing. This batch creates discovery items -- sealed packages, offering boxes, scavenging kits -- that reward the player with randomly selected items from a curated template list. Items pair content grants with `consumable_charge` (limited openings) and `conditional` (context-gated loot). The moment of opening is the fantasy.

---

## Approved Attachments

### Possessions

```typescript
// ═══════════════════════════════════════════════════════════════════
// RESOURCE_MANIPULATE items (5)
// ═══════════════════════════════════════════════════════════════════

// ─── Provisions (T1 x1) ──────────────────────────────────────────
{
  id: 'reward_provisions_spring_water_vial',
  type: 'artifact',
  name: 'Spring Water Vial',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#star', '#provision', '#divine', '#restoration'],
    mechanicalSummary: 'Restores 1 essence (one-shot), +0.02 Star near water',
    lossCondition: 'consumable',
    flavorText: 'Drawn from a spring that remembers its source. Drink it near somewhere holy and feel the world lean closer.',
    effects: [
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
      { type: 'conditional', condition: 'near_water', reach: 'star', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},

// ─── Relics & Talismans (T2 x1) ──────────────────────────────────
{
  id: 'reward_relics_talismans_prayer_focus',
  type: 'artifact',
  name: 'Prayer Focus',
  properties: {
    subcategory: 'relics_talismans',
    tier: 2,
    tags: ['#star', '#relic', '#divine', '#restoration', '#faith'],
    mechanicalSummary: '+0.04 Star, restores 1 essence per tick during mystical encounters',
    lossCondition: 'breakable',
    flavorText: 'A thumb-worn bead of river clay, shaped by a hundred thousand whispered prayers. It hums when the veil thins.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.04 },
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'per_tick', condition: 'in_mystical' },
    ],
  } as PossessionNodeProperties,
},

// ─── Relics & Talismans (T2 x1) ──────────────────────────────────
{
  id: 'reward_relics_talismans_essence_siphon',
  type: 'artifact',
  name: 'Essence Siphon',
  properties: {
    subcategory: 'relics_talismans',
    tier: 2,
    tags: ['#veil', '#relic', '#arcane', '#parasitic'],
    mechanicalSummary: '+0.06 Veil / -0.03 Star (tradeoff), drains 1 quintessence from other agent per tick',
    lossCondition: 'stealable',
    flavorText: 'A glass tube bound in tarnished silver. It draws something out of the air near living things. They seem not to notice.',
    effects: [
      { type: 'tradeoff', bonus: { reach: 'veil', value: 0.06 }, penalty: { reach: 'star', value: 0.03 } },
      { type: 'resource_manipulate', resource: 'quintessence', target: 'other_agent', amount: -1, mode: 'per_tick' },
    ],
  } as PossessionNodeProperties,
},

// ─── Provisions (T1 x1) ──────────────────────────────────────────
{
  id: 'reward_provisions_meditation_stones',
  type: 'artifact',
  name: 'Meditation Stones',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#star', '#provision', '#divine', '#calm', '#restoration'],
    mechanicalSummary: '+0.03 Star, restores 1 essence (one-shot) when alone',
    lossCondition: 'consumable',
    flavorText: 'Five flat stones, each a different shade of grey. Arranged in the right order, they settle the mind like still water.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.03 },
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot', condition: 'alone' },
    ],
  } as PossessionNodeProperties,
},

// ─── Relics & Talismans (T3 x1) ──────────────────────────────────
{
  id: 'reward_relics_talismans_quintessence_crucible',
  type: 'artifact',
  name: 'Quintessence Crucible',
  properties: {
    subcategory: 'relics_talismans',
    tier: 3,
    tags: ['#veil', '#relic', '#arcane', '#ancient', '#restoration'],
    mechanicalSummary: '+0.08 Veil, restores 2 quintessence per tick, -0.04 Star, decays from +0.08 to +0.02 Veil over time',
    lossCondition: 'cursed',
    flavorText: 'A vessel of fused obsidian, warm to the touch. It sweats a clear liquid that smells of lightning. The priests who made it did not survive the process.',
    effects: [
      { type: 'decay', reach: 'veil', startValue: 0.08, changePerTick: -0.003, limitValue: 0.02, destroyAtLimit: false },
      { type: 'passive', reach: 'star', value: -0.04 },
      { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: 2, mode: 'per_tick' },
    ],
  } as PossessionNodeProperties,
},

// ═══════════════════════════════════════════════════════════════════
// SLOT_BONUS items (4)
// ═══════════════════════════════════════════════════════════════════

// ─── Tools & Instruments (T1 x1) ─────────────────────────────────
{
  id: 'reward_tools_instruments_leather_bandolier',
  type: 'artifact',
  name: 'Leather Bandolier',
  properties: {
    subcategory: 'tools_instruments',
    tier: 1,
    tags: ['#iron', '#tool', '#equipment', '#carrying'],
    mechanicalSummary: '+0.02 Iron, +1 weapon slot',
    lossCondition: 'breakable',
    flavorText: 'Cracked leather and brass buckles, fitted to cross the chest. Room enough for one more blade.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.02 },
      { type: 'slot_bonus', slotTag: 'weapon', bonus: 1 },
    ],
  } as PossessionNodeProperties,
},

// ─── Tools & Instruments (T2 x1) ─────────────────────────────────
{
  id: 'reward_tools_instruments_quartermasters_harness',
  type: 'artifact',
  name: "Quartermaster's Harness",
  properties: {
    subcategory: 'tools_instruments',
    tier: 2,
    tags: ['#stone', '#gold', '#tool', '#equipment', '#carrying', '#trade'],
    mechanicalSummary: '+0.04 Stone, +1 consumable slot, +1 utility slot, 20% slower movement',
    lossCondition: 'breakable',
    flavorText: 'Canvas and ironwork, distributing weight across shoulders and hips. You carry more. You carry it slower.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.04 },
      { type: 'slot_bonus', slotTag: 'consumable', bonus: 1 },
      { type: 'slot_bonus', slotTag: 'utility', bonus: 1 },
      { type: 'range_modifier', movementCostMultiplier: 1.2 },
    ],
  } as PossessionNodeProperties,
},

// ─── Tools & Instruments (T1 x1) ─────────────────────────────────
{
  id: 'reward_tools_instruments_scroll_case',
  type: 'artifact',
  name: 'Scroll Case',
  properties: {
    subcategory: 'tools_instruments',
    tier: 1,
    tags: ['#veil', '#tool', '#equipment', '#carrying', '#scholarly'],
    mechanicalSummary: '+0.02 Veil, +1 tome slot',
    lossCondition: 'breakable',
    flavorText: 'Oiled leather, sealed with wax. Keeps the rain off what matters.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.02 },
      { type: 'slot_bonus', slotTag: 'tome', bonus: 1 },
    ],
  } as PossessionNodeProperties,
},

// ─── Tomes & Scrolls (T3 x1) ─────────────────────────────────────
{
  id: 'reward_tomes_scrolls_bag_of_conveyance',
  type: 'artifact',
  name: 'Bag of Conveyance',
  properties: {
    subcategory: 'tomes_scrolls',
    slotTag: 'utility',
    tier: 3,
    tags: ['#gold', '#veil', '#arcane', '#equipment', '#carrying', '#ancient'],
    mechanicalSummary: '+0.06 Gold, +0.04 Veil, +2 consumable slots, +1 wealth slot, restores 1 essence (one-shot)',
    lossCondition: 'stealable',
    flavorText: 'The interior is larger than the exterior. This is not a metaphor. The stitching hums when you reach inside.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.06 },
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'slot_bonus', slotTag: 'consumable', bonus: 2 },
      { type: 'slot_bonus', slotTag: 'wealth', bonus: 1 },
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
    ],
  } as PossessionNodeProperties,
},

// ═══════════════════════════════════════════════════════════════════
// CONTENT_GRANT items (4 — includes Bag of Conveyance above)
// ═══════════════════════════════════════════════════════════════════

// Note: The Bag of Conveyance (above) also uses resource_manipulate.
// These remaining 3 items are pure content_grant themed.

// ─── Tomes & Scrolls (T2 x1) ─────────────────────────────────────
{
  id: 'reward_tomes_scrolls_sealed_bounty_scroll',
  type: 'artifact',
  name: 'Sealed Bounty Scroll',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 2,
    tags: ['#gold', '#scroll', '#reward', '#discovery'],
    mechanicalSummary: '+0.04 Gold, 2 charges — each use grants a random item from a curated pool',
    lossCondition: 'consumable',
    flavorText: 'Heavy parchment sealed with a merchant-guild stamp. Break the wax, and something of value falls out. Twice.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.04 },
      { type: 'consumable_charge', charges: 2, onUse: { reach: 'gold', value: 0.01 }, destroyOnEmpty: true },
      {
        type: 'content_grant',
        templateIds: [
          'reward_provisions_healing_poultice',
          'reward_provisions_travelers_wine',
          'reward_relics_talismans_bone_ward',
          'reward_relics_talismans_wayfarers_charm',
          'reward_provisions_hardtack_and_salt',
        ],
        selection: 'random',
        narrativeTemplate: 'The seal cracks. Inside: {grantedName}.',
      },
    ],
  } as PossessionNodeProperties,
},

// ─── Tomes & Scrolls (T2 x1) ─────────────────────────────────────
{
  id: 'reward_tomes_scrolls_tithe_box',
  type: 'artifact',
  name: 'Tithe Box',
  properties: {
    subcategory: 'tomes_scrolls',
    slotTag: 'utility',
    tier: 2,
    tags: ['#heart', '#star', '#offering', '#divine', '#discovery'],
    mechanicalSummary: '+0.03 Heart, restores 1 essence (one-shot), grants a prayer scroll or healing poultice',
    lossCondition: 'consumable',
    flavorText: 'A wooden box carved with a saint\'s face, left at a crossroads shrine. Someone filled it. Someone always fills it.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
      {
        type: 'content_grant',
        templateIds: [
          'reward_tomes_scrolls_prayer_scroll',
          'reward_provisions_healing_poultice',
          'reward_condition_fortune_kissed',
        ],
        selection: 'random',
        narrativeTemplate: 'The tithe box opens with a faint sigh. Within: {grantedName}.',
      },
    ],
  } as PossessionNodeProperties,
},

// ─── Tools & Instruments (T2 x1) ─────────────────────────────────
{
  id: 'reward_tools_instruments_salvage_kit',
  type: 'artifact',
  name: 'Salvage Kit',
  properties: {
    subcategory: 'tools_instruments',
    tier: 2,
    tags: ['#stone', '#tool', '#scavenging', '#discovery', '#wilderness'],
    mechanicalSummary: '+0.04 Stone, grants a random provision or tool when exploring, +0.02 Stone in wilderness',
    lossCondition: 'consumable',
    flavorText: 'Wire cutters, a pry bar, three sizes of bag. Everything you need to take apart what someone else put together.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.04 },
      { type: 'conditional', condition: 'in_wilderness', reach: 'stone', value: 0.02 },
      {
        type: 'content_grant',
        templateIds: [
          'reward_provisions_hardtack_and_salt',
          'reward_arms_bronze_spear',
          'reward_provisions_travelers_wine',
          'reward_relics_talismans_bone_ward',
        ],
        selection: 'random',
        narrativeTemplate: 'The kit finds purchase. Salvaged: {grantedName}.',
      },
    ],
  } as PossessionNodeProperties,
},
```

---

## Summary Table

| # | Name | ID | Tier | Subcategory | Target Primitive(s) | Other Primitives | Total Effects | Reach | Value Est |
|---|------|----|------|-------------|---------------------|------------------|---------------|-------|-----------|
| 1 | Spring Water Vial | `reward_provisions_spring_water_vial` | T1 | provisions | resource_manipulate | conditional | 2 | Star | ~0.03 |
| 2 | Meditation Stones | `reward_provisions_meditation_stones` | T1 | provisions | resource_manipulate | passive | 2 | Star | ~0.04 |
| 3 | Leather Bandolier | `reward_tools_instruments_leather_bandolier` | T1 | tools_instruments | slot_bonus | passive | 2 | Iron | ~0.04 |
| 4 | Scroll Case | `reward_tools_instruments_scroll_case` | T1 | tools_instruments | slot_bonus | passive | 2 | Veil | ~0.04 |
| 5 | Prayer Focus | `reward_relics_talismans_prayer_focus` | T2 | relics_talismans | resource_manipulate | passive | 2 | Star | ~0.06 |
| 6 | Essence Siphon | `reward_relics_talismans_essence_siphon` | T2 | relics_talismans | resource_manipulate | tradeoff | 2 | Veil | ~0.07 |
| 7 | Quartermaster's Harness | `reward_tools_instruments_quartermasters_harness` | T2 | tools_instruments | slot_bonus (x2) | passive, range_modifier | 4 | Stone | ~0.07 |
| 8 | Sealed Bounty Scroll | `reward_tomes_scrolls_sealed_bounty_scroll` | T2 | tomes_scrolls | content_grant | passive, consumable_charge | 3 | Gold | ~0.06 |
| 9 | Tithe Box | `reward_tomes_scrolls_tithe_box` | T2 | tomes_scrolls | content_grant, resource_manipulate | passive | 3 | Heart/Star | ~0.06 |
| 10 | Salvage Kit | `reward_tools_instruments_salvage_kit` | T2 | tools_instruments | content_grant | passive, conditional | 3 | Stone | ~0.07 |
| 11 | Quintessence Crucible | `reward_relics_talismans_quintessence_crucible` | T3 | relics_talismans | resource_manipulate | decay, passive | 3 | Veil | ~0.10 |
| 12 | Bag of Conveyance | `reward_tomes_scrolls_bag_of_conveyance` | T3 | tomes_scrolls | slot_bonus (x2), resource_manipulate | passive (x2) | 5 | Gold/Veil | ~0.12 |

### Primitive Coverage

| Primitive | Pre-batch usages | New usages | Post-batch total |
|-----------|-----------------|------------|------------------|
| `resource_manipulate` | 1 (Miser's Mark) | 7 (Spring Water Vial, Prayer Focus, Essence Siphon, Meditation Stones, Quintessence Crucible, Bag of Conveyance, Tithe Box) | 8 |
| `slot_bonus` | 1 (Pack Goat) | 6 (Leather Bandolier, Quartermaster's Harness x2, Scroll Case, Bag of Conveyance x2) | 7 |
| `content_grant` | 1 (Letters of Introduction) | 3 (Sealed Bounty Scroll, Tithe Box, Salvage Kit) | 4 |

### Reach Distribution

| Reach | Count |
|-------|-------|
| Star | 3 (Spring Water Vial, Meditation Stones, Prayer Focus) |
| Veil | 2 (Essence Siphon, Scroll Case) |
| Gold | 2 (Sealed Bounty Scroll, Bag of Conveyance) |
| Stone | 2 (Quartermaster's Harness, Salvage Kit) |
| Iron | 1 (Leather Bandolier) |
| Heart | 1 (Tithe Box) |

### Effect Budget Audit

| Item | Effects | Estimated Total Value | Within Tier Budget? |
|------|---------|----------------------|---------------------|
| Spring Water Vial (T1) | 2 | ~0.03 (passive equivalent) + 1 essence | Yes (T1: 0.03-0.05) |
| Meditation Stones (T1) | 2 | 0.03 + conditional 1 essence | Yes |
| Leather Bandolier (T1) | 2 | 0.02 + slot expansion | Yes |
| Scroll Case (T1) | 2 | 0.02 + slot expansion | Yes |
| Prayer Focus (T2) | 2 | 0.04 + conditional resource | Yes (T2: 0.05-0.08) |
| Essence Siphon (T2) | 2 | 0.06-0.03 net + drain | Yes |
| Quartermaster's Harness (T2) | 4 | 0.04 + 2 slots - movement | Yes |
| Sealed Bounty Scroll (T2) | 3 | 0.04 + charges + grant | Yes |
| Tithe Box (T2) | 3 | 0.03 + 1 essence + grant | Yes |
| Salvage Kit (T2) | 3 | 0.04 + 0.02 cond + grant | Yes |
| Quintessence Crucible (T3) | 3 | 0.08 decay - 0.04 + 2q/tick | Yes (T3: 0.08-0.12) |
| Bag of Conveyance (T3) | 5 | 0.06 + 0.04 + 3 slots + essence | Yes |
