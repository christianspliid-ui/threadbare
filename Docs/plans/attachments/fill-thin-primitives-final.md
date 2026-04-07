# Attachment Pipeline: Thin Primitives (resource_manipulate, slot_bonus, content_grant)
> Category: possessions | Slug: fill-thin-primitives | Pass: final
> Status: **READY WITH CAVEATS**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 12 items drafted (T1 ×4, T2 ×6, T3 ×2) across resource_manipulate, slot_bonus, content_grant primitives |
| Editorial | Approved with refinements | 7 changes: 2 renames, 2 summary corrections, 1 subcategory move, 1 flavor revision, 1 batch header fix |
| Systems | READY WITH CAVEATS | All 12 items type-valid, zero hard-cap violations, zero templateId gaps, zero duplicate IDs. 3 consumable-coherence WARNs (implementor notes, no authoring changes required) |

## Corrections Applied Since Revised Pass

None required. All 12 items passed systems audit without authoring changes.

Systems WARNs are implementor notes only:

| Item | WARN | Implementor Note |
|------|------|-----------------|
| Spring Water Vial (#1) | Consumable + persistent conditional passive + unconditioned one_shot | If `one_shot` fires on first use, consumable is marked used and passive ends. If `one_shot` fires only near water, passive runs until then. Accept as intentional or add tick-expiry fallback. |
| Meditation Stones (#2) | Consumable + persistent passive + one_shot gated on `alone` | Passive runs until the agent is alone and one_shot fires. Social agents may never consume it. Accept as intended flavor (the stones wait) or add fallback expiry. |
| Tithe Box (#9) | Two fire-once effects (`one_shot` + `content_grant`) on a consumable | Engine should fire both at use-time then consume the item. Verify multi-fire-once ordering in tick phase. |

## Implementation Notes

These are **new entries** — all 12 IDs are absent from `reward-attachment-catalog.ts`.

**Target file:** `src/data/reward-attachment-catalog.ts`
**Target array:** `REWARD_POSSESSIONS`
**Suggested placement:** Append to the respective subcategory sections:
- `provisions` — add Spring Water Vial and Meditation Stones after existing provisions block
- `relics_talismans` — add River Clay Bead, Tarnished Draw-Tube, The Sweating Vessel after existing relic block
- `tools_instruments` — add Leather Bandolier, Quartermaster's Harness, Scroll Case, Bag of Conveyance, Salvage Kit after existing tools block
- `tomes_scrolls` — add Sealed Bounty Scroll, Tithe Box after existing tomes block

**Minor prose fix (optional, not required):** Salvage Kit `mechanicalSummary` says "grants a random provision or tool when exploring" — the grant has no `in_exploration` condition and fires at use-time regardless of context. Consider changing to "on use, grants a random provision or tool" before catalog merge.

---

## Approved Attachments

### 1. Spring Water Vial

```typescript
{
  id: 'reward_provisions_spring_water_vial',
  type: 'artifact',
  name: 'Spring Water Vial',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#star', '#provision', '#divine', '#restoration'],
    mechanicalSummary: '+0.02 Star near water, restores 1 essence (one-shot)',
    lossCondition: 'consumable',
    flavorText: 'Drawn from a spring that remembers its source. Drink it near somewhere holy and feel the world lean closer.',
    effects: [
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
      { type: 'conditional', condition: 'near_water', reach: 'star', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Pilgrim's provision. Rewards visiting holy sites before use. The conditional Star bonus while near water means devout agents naturally benefit before consumption.
**Total reach value:** 0.02 Star conditional + 1 essence one-shot
**Systems:** PASS — 2 effects, type-valid, balance-compliant.

---

### 2. Meditation Stones

```typescript
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
}
```

**Niche:** Solitary practitioner's tool. The persistent Star passive rewards carrying them even before the meditative use. The `condition: 'alone'` gate means they never fire in crowd or encounter — they wait for a moment of stillness.
**Total reach value:** 0.03 Star passive + conditional 1 essence one-shot
**Systems:** PASS — 2 effects, type-valid, balance-compliant.

---

### 3. Leather Bandolier

```typescript
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
}
```

**Niche:** Fighter's load-out extender. Mirrors Pack Goat pattern (T1, passive + slot_bonus) for weapon slots. Lean and functional.
**Total reach value:** 0.02 Iron passive + 1 weapon slot
**Systems:** PASS — 2 effects, type-valid, balance-compliant.

---

### 4. Scroll Case

```typescript
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
}
```

**Niche:** Scholar's carry expansion. Widens tome slot access for agents who rely on written knowledge. The Veil bonus reflects the arcane value of well-preserved scrolls.
**Total reach value:** 0.02 Veil passive + 1 tome slot
**Systems:** PASS — 2 effects, type-valid, balance-compliant.

---

### 5. River Clay Bead

```typescript
{
  id: 'reward_relics_talismans_river_clay_bead',
  type: 'artifact',
  name: 'River Clay Bead',
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
}
```

**Niche:** Devotional sustainer. The conditional per-tick restore means agents with prayer foci can outlast long mystical encounters without essence exhaustion. Faith-domain support item.
**Total reach value:** 0.04 Star passive + conditional per-tick essence in mystical
**Systems:** PASS — 2 effects, type-valid, balance-compliant.

---

### 6. Tarnished Draw-Tube

```typescript
{
  id: 'reward_relics_talismans_tarnished_draw_tube',
  type: 'artifact',
  name: 'Tarnished Draw-Tube',
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
}
```

**Niche:** Parasitic arcane relic. Hard choice: strong Veil gain costs Star and imposes ongoing drain on a nearby agent. The stealable loss condition adds risk — rivals will want it.
**Total reach value:** +0.06 Veil / -0.03 Star (tradeoff) + per-tick quintessence drain on adjacent agent
**Systems:** PASS — 2 effects, type-valid, balance-compliant. Note: `target: 'other_agent'` drain targeting semantics should be verified consistent with Miser's Mark precedent at implementation.

---

### 7. Quartermaster's Harness

```typescript
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
}
```

**Niche:** Logistics carrier. Slot expansion with a real movement cost. For agents who prioritize loadout over mobility. The 20% slowdown makes this a deliberate choice, not a pure upgrade.
**Total reach value:** 0.04 Stone passive + 2 slot expansions - 20% movement penalty
**Systems:** PASS — 4 effects, type-valid, balance-compliant.

---

### 8. Sealed Bounty Scroll

```typescript
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
}
```

**Niche:** Discovery item. Two uses, each granting a random T1 provision or talisman. The persistent Gold passive makes it worth carrying before use. The fantasy is breaking the wax seal.
**TemplateIds:** All 5 confirmed present in catalog.
**Total reach value:** 0.04 Gold passive + 0.01 Gold per-use + content grants
**Systems:** PASS — 3 effects, type-valid, balance-compliant, all templateIds resolved.

---

### 9. Tithe Box

```typescript
{
  id: 'reward_tomes_scrolls_tithe_box',
  type: 'artifact',
  name: 'Tithe Box',
  properties: {
    subcategory: 'tomes_scrolls',
    slotTag: 'utility',
    tier: 2,
    tags: ['#heart', '#star', '#offering', '#divine', '#discovery'],
    mechanicalSummary: '+0.03 Heart, restores 1 essence (one-shot), grants a random item: prayer scroll, healing poultice, or Fortune-Kissed blessing',
    lossCondition: 'consumable',
    flavorText: "A wooden box carved with a saint's face, left at a crossroads shrine. Someone filled it. Someone always fills it.",
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
}
```

**Niche:** Divine offering box. The content grant includes a blessing condition (`Fortune-Kissed`) as well as provisions and scrolls — higher ceiling than pure provisions grants. The `slotTag: 'utility'` correctly overrides subcategory for slot enforcement.
**TemplateIds:** All 3 confirmed present in catalog.
**Total reach value:** 0.03 Heart passive + 1 essence one-shot + content grant
**Systems:** PASS — 3 effects, type-valid, balance-compliant, all templateIds resolved.

---

### 10. Salvage Kit

```typescript
{
  id: 'reward_tools_instruments_salvage_kit',
  type: 'artifact',
  name: 'Salvage Kit',
  properties: {
    subcategory: 'tools_instruments',
    tier: 2,
    tags: ['#stone', '#tool', '#scavenging', '#discovery', '#wilderness'],
    mechanicalSummary: '+0.04 Stone, grants a random provision or tool on use, +0.02 Stone in wilderness',
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
}
```

> **Prose correction applied:** `mechanicalSummary` updated from "grants a random provision or tool when exploring" to "grants a random provision or tool on use" — the content_grant has no `in_exploration` condition and fires at use-time regardless of context.

**Niche:** Wilderness scavenger. The conditional Stone bonus rewards operating in wilderness. The content grant covers both provisions and a spare weapon — appropriately rough salvage.
**TemplateIds:** All 4 confirmed present in catalog.
**Total reach value:** 0.04 Stone passive + 0.02 Stone conditional + content grant
**Systems:** PASS — 3 effects, type-valid, balance-compliant, all templateIds resolved.

---

### 11. The Sweating Vessel

```typescript
{
  id: 'reward_relics_talismans_the_sweating_vessel',
  type: 'artifact',
  name: 'The Sweating Vessel',
  properties: {
    subcategory: 'relics_talismans',
    tier: 3,
    tags: ['#veil', '#relic', '#arcane', '#ancient', '#restoration'],
    mechanicalSummary: 'Veil bonus decays from +0.08 to +0.02 over ~20 ticks, -0.04 Star, restores 2 quintessence per tick',
    lossCondition: 'cursed',
    flavorText: 'A vessel of fused obsidian, warm to the touch. It sweats a clear liquid that smells of lightning. The priests who made it did not survive the process.',
    effects: [
      { type: 'decay', reach: 'veil', startValue: 0.08, changePerTick: -0.003, limitValue: 0.02, destroyAtLimit: false },
      { type: 'passive', reach: 'star', value: -0.04 },
      { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: 2, mode: 'per_tick' },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Cursed arcane engine. Strong initial Veil value decays over ~1.7 game days to a modest floor. Persistent Star penalty and ongoing quintessence generation create a three-way tension. `cursed` loss condition means the player cannot escape it — they chose to pick it up. The decay math: (0.08 - 0.02) / 0.003 = 20 ticks to reach limitValue; item persists at 0.02 Veil floor indefinitely.
**Total reach value:** 0.08→0.02 Veil (decay) - 0.04 Star (permanent) + 2 quintessence/tick
**Systems:** PASS — 3 effects, type-valid, balance-compliant.

---

### 12. Bag of Conveyance

```typescript
{
  id: 'reward_tools_instruments_bag_of_conveyance',
  type: 'artifact',
  name: 'Bag of Conveyance',
  properties: {
    subcategory: 'tools_instruments',
    slotTag: 'utility',
    tier: 3,
    tags: ['#gold', '#veil', '#arcane', '#equipment', '#carrying', '#ancient'],
    mechanicalSummary: '+0.06 Gold, +0.04 Veil, +2 consumable slots, +1 wealth slot, restores 1 essence (one-shot)',
    lossCondition: 'stealable',
    flavorText: 'A leather satchel with seams that do not line up with its edges. You reach in past the elbow and your hand keeps going. The stitching hums when you find what you were looking for.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.06 },
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'slot_bonus', slotTag: 'consumable', bonus: 2 },
      { type: 'slot_bonus', slotTag: 'wealth', bonus: 1 },
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Arcane extradimensional bag. T3 slot expander with genuine passive value across two reaches. The `one_shot` essence restore fires on acquisition — a "pickup bonus" pattern. The `stealable` loss condition creates risk appropriate to a powerful utility item. The `slotTag: 'utility'` correctly overrides subcategory for slot enforcement.
**Total reach value:** 0.06 Gold + 0.04 Veil passive + 3 slot expansions + 1 essence on pickup
**Systems:** PASS — 5 effects, type-valid, balance-compliant.

---

## Summary Table

| # | Name | Reach | Tier | Effects | Max Passive Value | Loss | Systems |
|---|------|-------|------|---------|------------------|------|---------|
| 1 | Spring Water Vial | Star | T1 | 2 | 0.02 Star (conditional) | consumable | **PASS** |
| 2 | Meditation Stones | Star | T1 | 2 | 0.03 Star | consumable | **PASS** |
| 3 | Leather Bandolier | Iron | T1 | 2 | 0.02 Iron | breakable | **PASS** |
| 4 | Scroll Case | Veil | T1 | 2 | 0.02 Veil | breakable | **PASS** |
| 5 | River Clay Bead | Star | T2 | 2 | 0.04 Star | breakable | **PASS** |
| 6 | Tarnished Draw-Tube | Veil/Star | T2 | 2 | +0.06 Veil / -0.03 Star | stealable | **PASS** |
| 7 | Quartermaster's Harness | Stone | T2 | 4 | 0.04 Stone | breakable | **PASS** |
| 8 | Sealed Bounty Scroll | Gold | T2 | 3 | 0.04 Gold | consumable | **PASS** |
| 9 | Tithe Box | Heart | T2 | 3 | 0.03 Heart | consumable | **PASS** |
| 10 | Salvage Kit | Stone | T2 | 3 | 0.04 Stone + 0.02 cond | consumable | **PASS** |
| 11 | The Sweating Vessel | Veil/Star | T3 | 3 | 0.08→0.02 Veil / -0.04 Star | cursed | **PASS** |
| 12 | Bag of Conveyance | Gold/Veil | T3 | 5 | 0.06 Gold / 0.04 Veil | stealable | **PASS** |

### Primitive Coverage Delivered

| Primitive | Pre-batch | New usages | Post-batch |
|-----------|-----------|------------|------------|
| `resource_manipulate` | 1 (Miser's Mark) | 7 | 8 |
| `slot_bonus` | 1 (Pack Goat) | 6 | 7 |
| `content_grant` | 1 (Letters of Introduction) | 3 | 4 |

### Reach Coverage Delivered

| Reach | Items | Tiers |
|-------|-------|-------|
| Star | 3 | T1, T2, T1 |
| Veil | 2 (+ T2 tradeoff, T3 tradeoff) | T1, T2, T3 |
| Gold | 2 | T2, T3 |
| Stone | 2 | T2, T2 |
| Iron | 1 | T1 |
| Heart | 1 | T2 |

---

## Overall Pipeline Verdict

**READY WITH CAVEATS**

All 12 items are fully type-valid and implementation-ready as written, with one minor prose correction applied to item #10 (Salvage Kit mechanicalSummary).

The three WARNs from the systems pass are implementor notes about engine behavior for consumable items with persistent passives and conditional one-shot effects. None require authoring changes. The engine will handle these items consistently — the WARNs describe the expected behavior so implementors know what to verify, not what to fix.

Implementors should also:
- Verify `resource_manipulate` with `target: 'other_agent'` resolves targeting consistently with Miser's Mark (Tarnished Draw-Tube, #6)
- Verify multi-fire-once effect ordering for Tithe Box (#9) at consumption time
- Note that `slotTag: 'utility'` on Bag of Conveyance (#12) and Tithe Box (#9) overrides their subcategory for slot enforcement per `attachments.ts` line 87
