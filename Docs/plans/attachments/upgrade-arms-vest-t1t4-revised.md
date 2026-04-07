# Attachment Upgrade Pipeline: T1-T4 Arms & Vestments
> Slug: upgrade-arms-vest-t1t4 | Pass: revised | Mode: upgrade
> Items: 10 items | Date: 2026-04-06

## Primitive Distribution Plan

Batch 1 (T1-T2 arms) leaned heavily on: conditional, stacking, tradeoff, consumable_charge, test_shaper, range_modifier. This batch deliberately emphasizes different primitives for variety across the catalog:

| Primitive | Items Using It | Notes |
|-----------|---------------|-------|
| reactive | Hollowfang, Chainmail Hauberk, The Woven Sky | Trigger-based responses to events |
| cooldown | Starfall Longbow, The Quiet Blade | Intermittent power cycling |
| decay | Hollowfang, Mantle of the Unremembered | Fading buffs |
| until_event | The Quiet Blade | Event-terminated effects |
| tag_immunity | Padded Jerkin, Shadowweave Cloak, The Woven Sky | Condition blocking |
| range_modifier | Shadowweave Cloak, Traveler's Cloak | Movement/awareness |
| conditional | Merchant Silks, Chainmail Hauberk | Situational (but not overused) |
| behavior_weight | Mantle of the Unremembered | Personality shaping |

---

## Upgraded Attachments

### 1. Hollowfang

**Niche:** Cursed hunger-blade. Feeds on violence -- grows stronger with each wound dealt but the power fades quickly, like blood cooling on steel. The hollow whistling unsettles the wielder's empathy (existing Heart penalty).

```typescript
{
  id: 'reward_arms_hollowfang',
  type: 'artifact',
  name: 'Hollowfang',
  properties: {
    subcategory: 'arms',
    tier: 3,
    tags: ['#iron', '#weapon', '#melee', '#cursed', '#combat'],
    mechanicalSummary: '+0.12 Iron, -0.05 Heart, when damaged: +0.05 Iron burst decaying over 5 ticks (12-tick cooldown), grants dark_ferocity trait',
    lossCondition: 'cursed',
    flavorText: 'The blade is hollow and whistles when swung. The sound makes children weep.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.12 },
      { type: 'passive', reach: 'heart', value: -0.05 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'decay', reach: 'iron', startValue: 0.05, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
      }, cooldown: 12 },
      { type: 'trait_grant', grantedTrait: 'dark_ferocity' },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.12 Iron passive + 0.05 max reactive burst (decays to 0) - 0.05 Heart = 0.12 net positive max
**Primitives:** passive + reactive (damaged trigger) + decay (nested) + trait_grant

---

### 2. Starfall Longbow

**Niche:** Celestial precision weapon. The star-aligned string pulses with intermittent cosmic insight -- periods of supernatural accuracy followed by dormant phases as the stellar resonance recharges.

```typescript
{
  id: 'reward_arms_starfall_longbow',
  type: 'artifact',
  name: 'Starfall Longbow',
  properties: {
    subcategory: 'arms',
    tier: 3,
    tags: ['#iron', '#weapon', '#ranged', '#star', '#combat'],
    mechanicalSummary: '+0.10 Iron, +0.05 Star, stellar alignment: +0.03 Star for 6 ticks then dormant 12 ticks',
    lossCondition: 'permanent',
    flavorText: 'The string hums a note too low to hear. Arrows fly straighter than physics allows.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.10 },
      { type: 'passive', reach: 'star', value: 0.05 },
      { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'star', value: 0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.15 passive (0.10 Iron + 0.05 Star) + 0.03 Star intermittent = 0.15 sustained average well below cap
**Primitives:** passive + cooldown

---

### 3. The Quiet Blade

**Niche:** Legendary shadow-assassin's weapon. Silent and lethal -- the blade exists in the threshold between seen and unseen. In combat it grants terrifying focus that persists until the fight ends. When attacked, the blade's shadow nature lets the wielder partially dissolve, reducing movement cost as they slip between strikes.

Note: existing reachBonus (iron: 0.18, shadow: 0.08 = 0.26) already exceeds the 0.15 per-item cap. Per the "reachBonus values are sacred" rule, passive conversions preserve those exact values. Non-passive effects use utility primitives (no additional reach bonuses) to stay within the design intent.

```typescript
{
  id: 'reward_arms_the_quiet_blade',
  type: 'artifact',
  name: 'The Quiet Blade',
  properties: {
    subcategory: 'arms',
    tier: 4,
    tags: ['#iron', '#weapon', '#melee', '#shadow', '#ancient', '#combat'],
    mechanicalSummary: '+0.18 Iron, +0.08 Shadow, blocks fear/intimidation conditions, when attacked: 20% faster movement for 6 ticks (12-tick cooldown), shadow focus persists until combat ends (+0.02 Shadow)',
    lossCondition: 'permanent',
    flavorText: 'It makes no sound when it cuts. Neither does the one it cuts.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.18 },
      { type: 'passive', reach: 'shadow', value: 0.08 },
      { type: 'until_event', event: 'leave_combat', reach: 'shadow', value: 0.02, destroyOnEvent: false },
      { type: 'reactive', trigger: 'attacked', effect: {
        type: 'range_modifier', movementCostMultiplier: 0.8
      }, duration: 6, cooldown: 12 },
      { type: 'tag_immunity', tags: ['fear', 'intimidation'] },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.26 passive (sacred, preserved) + 0.02 until_event Shadow = 0.28 max. Exceeds cap due to legacy values; non-passive additions are utility-only (tag_immunity, range_modifier) or small (+0.02). Legacy budget consumed by the passives.
**Primitives:** passive + until_event + reactive (attacked trigger with range_modifier nested) + tag_immunity

---

### 4. Padded Jerkin

**Niche:** Basic combat padding. Absorbs the worst of blunt trauma. Simple, honest protection -- the horsehair stuffing cushions blows that would otherwise crack bone.

```typescript
{
  id: 'reward_vestments_padded_jerkin',
  type: 'artifact',
  name: 'Padded Jerkin',
  properties: {
    subcategory: 'vestments',
    tier: 1,
    tags: ['#iron', '#armor', '#cloth', '#combat'],
    mechanicalSummary: '+0.03 Iron, blocks bruise conditions',
    lossCondition: 'breakable',
    flavorText: 'Quilted linen stuffed with horsehair. Better than bare skin.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'tag_immunity', tags: ['bruise'] },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.03 Iron passive + tag_immunity utility
**Primitives:** passive + tag_immunity

---

### 5. Merchant Silks

**Niche:** Trade-floor attire. The saffron dye and fine weave mark the wearer as someone of means -- opens doors in social encounters that rough clothing cannot.

```typescript
{
  id: 'reward_vestments_merchant_silks',
  type: 'artifact',
  name: 'Merchant Silks',
  properties: {
    subcategory: 'vestments',
    tier: 1,
    tags: ['#gold', '#cloth', '#commercial', '#trade'],
    mechanicalSummary: '+0.04 Gold, +0.02 Gold in social encounters',
    lossCondition: 'stealable',
    flavorText: 'Dyed in the saffron of the eastern markets. Wealth worn on the sleeve.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.04 },
      { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.06 max (0.04 passive + 0.02 conditional)
**Primitives:** passive + conditional (in_social)

---

### 6. Chainmail Hauberk

**Niche:** Reliable battlefield armor. The handcrafted rings distribute impact force -- most effective when blows are raining down. When struck, the armor's weight steadies the wearer's stance.

```typescript
{
  id: 'reward_vestments_chainmail_hauberk',
  type: 'artifact',
  name: 'Chainmail Hauberk',
  properties: {
    subcategory: 'vestments',
    tier: 2,
    tags: ['#iron', '#armor', '#combat'],
    mechanicalSummary: '+0.08 Iron, when attacked: +0.03 Iron for 4 ticks (8-tick cooldown)',
    lossCondition: 'breakable',
    flavorText: 'Each ring was closed by hand. Someone cared enough to do it right.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.08 },
      { type: 'reactive', trigger: 'attacked', effect: {
        type: 'duration', ticks: 4, reach: 'iron', value: 0.03, destroyOnExpiry: true
      }, cooldown: 8 },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.11 max (0.08 passive + 0.03 reactive burst)
**Primitives:** passive + reactive (attacked trigger with duration nested)

---

### 7. Shadowweave Cloak

**Niche:** Infiltrator's garment. The light-drinking fabric makes the wearer harder to notice and easier to lose in a crowd. Grants expanded awareness -- the shadows whisper of approaching threats -- and blocks attempts to track the wearer.

```typescript
{
  id: 'reward_vestments_shadowweave_cloak',
  type: 'artifact',
  name: 'Shadowweave Cloak',
  properties: {
    subcategory: 'vestments',
    tier: 2,
    tags: ['#shadow', '#cloth', '#stealth'],
    mechanicalSummary: '+0.07 Shadow, +1 awareness range, blocks tracking conditions',
    lossCondition: 'stealable',
    flavorText: 'The fabric drinks light. Corners seem deeper when you wear it.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.07 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
      { type: 'tag_immunity', tags: ['tracked', 'marked'] },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.07 Shadow passive + awareness/immunity utility
**Primitives:** passive + range_modifier + tag_immunity

---

### 8. Mantle of the Unremembered

**Niche:** Cursed garment of oblivion. The wearer fades from memory and mind -- powerful concealment that erodes social bonds. When entering new territory, a surge of obscuring power floods outward but fades rapidly. The mantle also draws its wearer toward shadow encounters, reinforcing the isolation.

```typescript
{
  id: 'reward_vestments_mantle_of_the_unremembered',
  type: 'artifact',
  name: 'Mantle of the Unremembered',
  properties: {
    subcategory: 'vestments',
    tier: 3,
    tags: ['#shadow', '#cloth', '#veil', '#cursed', '#stealth'],
    mechanicalSummary: '+0.12 Shadow, -0.06 Heart, entering new hex: +0.04 Shadow burst decaying over 4 ticks (8-tick cooldown), amplifies shadow encounter desire x1.5',
    lossCondition: 'cursed',
    flavorText: 'Those who wear it become harder to recall. Even by those who love them.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.12 },
      { type: 'passive', reach: 'heart', value: -0.06 },
      { type: 'reactive', trigger: 'entered_hex', effect: {
        type: 'decay', reach: 'shadow', startValue: 0.04, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
      }, cooldown: 8 },
      { type: 'behavior_weight', reach: 'shadow', multiplier: 1.5 },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.12 Shadow passive + 0.04 max burst (decays) - 0.06 Heart = 0.10 net positive max
**Primitives:** passive + reactive (entered_hex trigger with decay nested) + behavior_weight

---

### 9. The Woven Sky

**Niche:** Legendary celestial vestment. A robe stitched with living constellations -- the ultimate protective garment of divine origin. It wraps the wearer in cosmic awareness, shields against curses and corruption, and responds to injury with a veil of protective starlight. In mystical contexts the constellations align, amplifying divine perception.

Note: existing reachBonus (star: 0.15, veil: 0.08 = 0.23) already exceeds the 0.15 per-item cap. Per the "reachBonus values are sacred" rule, passive conversions preserve those exact values. Non-passive effects use utility primitives and small conditional bonuses.

```typescript
{
  id: 'reward_vestments_the_woven_sky',
  type: 'artifact',
  name: 'The Woven Sky',
  properties: {
    subcategory: 'vestments',
    tier: 4,
    tags: ['#star', '#cloth', '#divine', '#ancient'],
    mechanicalSummary: '+0.15 Star, +0.08 Veil, in mystical contexts: +0.03 Star, blocks curse/corruption/blight conditions, when damaged: +0.04 Veil ward for 6 ticks (12-tick cooldown)',
    lossCondition: 'permanent',
    flavorText: 'A robe of impossible blue, stitched with constellations that move. It weighs nothing.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.15 },
      { type: 'passive', reach: 'veil', value: 0.08 },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 6, reach: 'veil', value: 0.04, destroyOnExpiry: true
      }, cooldown: 12 },
      { type: 'tag_immunity', tags: ['curse', 'corruption', 'blight'] },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.23 passive (sacred, preserved) + 0.03 conditional + 0.04 reactive burst = 0.30 max. Exceeds per-item cap due to legacy values; non-passive additions are modest and appropriate for T4 legendary status.
**Primitives:** passive + conditional (in_mystical) + reactive (damaged trigger with duration nested) + tag_immunity

---

### 10. Traveler's Cloak

**Niche:** Road-worn travel garment. Practical and unassuming -- sheds rain and attention equally. The cloak's true value is in covering ground: it reduces movement cost slightly, letting the wearer travel further between rests.

```typescript
{
  id: 'starter_traveler_cloak',
  type: 'artifact',
  name: "Traveler's Cloak",
  properties: {
    subcategory: 'vestments',
    tier: 1,
    tags: ['#cloth', '#travel', '#weather'],
    mechanicalSummary: '10% reduced movement cost, blocks cold conditions',
    lossCondition: 'breakable',
    flavorText: 'Dyed with muddy hues, designed to shed rain as much as attention.',
    effects: [
      { type: 'range_modifier', movementCostMultiplier: 0.9 },
      { type: 'tag_immunity', tags: ['cold', 'frostbite'] },
    ],
  } as PossessionNodeProperties,
}
```

**Total reach value:** 0.00 reach (pure utility item -- movement + immunity)
**Primitives:** range_modifier + tag_immunity

Note: The Traveler's Cloak had no reachBonus in the original, only a mechanicalSummary of '+weather_resistance'. This upgrade gives it concrete mechanical identity through utility primitives rather than reach bonuses, fitting its practical travel-gear niche.

---

## Summary Table

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Hollowfang | T3 | Cursed hunger-blade, feeds on violence | passive + reactive(damaged) + decay + trait_grant | 0.12 net max | +effects[], -reachBonus, updated summary |
| 2 | Starfall Longbow | T3 | Celestial precision, intermittent stellar alignment | passive + cooldown | 0.15 passive + 0.03 intermittent | +effects[], -reachBonus, updated summary |
| 3 | The Quiet Blade | T4 | Shadow-assassin's silent blade | passive + until_event + reactive(attacked/range_modifier) + tag_immunity | 0.28 max (legacy passives) | +effects[], -reachBonus, updated summary |
| 4 | Padded Jerkin | T1 | Basic blunt-trauma padding | passive + tag_immunity | 0.03 + immunity utility | +effects[], -reachBonus, updated summary |
| 5 | Merchant Silks | T1 | Trade-floor social attire | passive + conditional(in_social) | 0.06 max | +effects[], -reachBonus, updated summary |
| 6 | Chainmail Hauberk | T2 | Reactive battlefield armor | passive + reactive(attacked/duration) | 0.11 max | +effects[], -reachBonus, updated summary |
| 7 | Shadowweave Cloak | T2 | Infiltrator's awareness garment | passive + range_modifier + tag_immunity | 0.07 + utility | +effects[], -reachBonus, updated summary |
| 8 | Mantle of the Unremembered | T3 | Cursed oblivion cloak, fading presence | passive + reactive(entered_hex/decay) + behavior_weight | 0.10 net max | +effects[], -reachBonus, updated summary |
| 9 | The Woven Sky | T4 | Legendary celestial vestment | passive + conditional(in_mystical) + reactive(damaged/duration) + tag_immunity | 0.30 max (legacy passives) | +effects[], -reachBonus, updated summary |
| 10 | Traveler's Cloak | T1 | Practical road garment | range_modifier + tag_immunity | 0.00 reach (utility only) | +effects[], updated summary |

## Primitive Variety Scorecard

| Primitive | Batch 1 (T1-T2 arms) | This Batch | Variety Goal |
|-----------|----------------------|------------|-------------|
| passive | 8/8 items | 9/10 items | Expected (reachBonus conversion) |
| conditional | 1 item | 2 items | Light use, different conditions (in_social, in_mystical) |
| stacking | 2 items | 0 items | Avoided -- heavy in Batch 1 |
| tradeoff | 1 item | 0 items | Avoided -- used in Batch 1 |
| consumable_charge | 1 item | 0 items | Avoided -- used in Batch 1 |
| test_shaper | 1 item | 0 items | Avoided -- used in Batch 1 |
| reactive | 1 item | 4 items | Heavy use -- primary variety driver this batch |
| cooldown | 0 items | 1 item | New to catalog |
| decay | 0 items | 2 items (nested in reactive) | New to catalog |
| until_event | 0 items | 1 item | New to catalog |
| tag_immunity | 0 items | 5 items | New to catalog, vestment specialty |
| range_modifier | 1 item | 3 items | Expanded use for vestments |
| behavior_weight | 0 items | 1 item | New to catalog |
| trait_grant | 0 items | 1 item | New to catalog |
| duration | 0 items | 3 items (nested in reactive) | New to catalog (as nested effect) |

## Design Notes

**Legacy budget overruns (T4 items):** The Quiet Blade and The Woven Sky have existing reachBonus values that exceed the 0.15 per-item cap. The draft preserves these values exactly as passives per the "reachBonus values are sacred" rule. Non-passive effects on these items prioritize utility primitives (tag_immunity, range_modifier, behavior_weight) over additional reach bonuses to avoid inflating the overrun further. The editorial pass should flag whether the T4 legacy values themselves need rebalancing -- that decision is outside the scope of this upgrade pipeline.

**Vestment identity:** Vestments are defensive/utility gear. Their effects lean toward reactive (respond to being attacked), tag_immunity (block conditions), range_modifier (movement/awareness), and conditional (situational bonuses). This distinguishes them from arms, which favor offensive primitives like stacking, cooldown, and test_shaper.

**Nested effects:** Several reactive effects contain nested duration or decay effects. These are valid compositions per the AttachmentEffect union type -- ReactiveEffect's `effect` field accepts any AttachmentEffect. The inner effect's `destroyOnExpiry`/`destroyAtLimit` flags control whether the *nested buff* expires, not the parent attachment.

**Traveler's Cloak:** This is the only item with zero reach contribution. It's a pure utility item -- movement speed and weather immunity. This is appropriate for a T1 vestment with no existing reachBonus and flavor text about practical travel.
