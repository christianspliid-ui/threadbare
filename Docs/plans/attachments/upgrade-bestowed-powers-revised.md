# Attachment Upgrade Pipeline: Bestowed Powers
> Slug: bestowed-powers | Pass: revised | Mode: upgrade
> Items: 10 items (T1 x4, T2 x3, T3 x2, T4 x1) | Date: 2026-04-06
> Skipped: `reward_bestowed_patrons_backing` (already alive with test_shaper)

**Editorial changes applied:**
- Spirit Sight: flavor text revised (removed grandiose "for those who dare to look")
- Gatehouse Commendation: tags corrected (added `#bestowed`, `#iron`; mechanicalSummary clarified)
- Several mechanicalSummary strings tightened for precision (no mechanical changes)
- Beast-Tongue/Iron Gut/Bloodward/The Undying Flame: `#flesh` tag confirmed removed

---

## 1. Ember Hands (T1 Bestowed)

```typescript
{
  id: 'reward_bestowed_ember_hands',
  type: 'trait',
  name: 'Ember Hands',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#stone', '#survival', '#craft', '#wilderness'],
    description: 'Hands radiate gentle warmth. Fire comes easily.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'Tinder catches at your touch. You have not felt cold since the gift was given.',
    mechanicalSummary: '+0.04 Stone, trait: fire_touch (fire manipulation unlocked)',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.04 },
      { type: 'trait_grant', grantedTrait: 'fire_touch' },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 2. Beast-Tongue (T1 Bestowed)

```typescript
{
  id: 'reward_bestowed_beast_tongue',
  type: 'trait',
  name: 'Beast-Tongue',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#heart', '#eye', '#wilderness'],
    description: 'Animals understand your intent, if not your words.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'Horses calm at your voice. Wolves turn aside. You are kin to things that do not speak.',
    mechanicalSummary: '+0.04 Heart, +0.02 Eye in wilderness',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'conditional', condition: 'in_wilderness', reach: 'eye', value: 0.02 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 3. Iron Gut (T1 Bestowed)

```typescript
{
  id: 'reward_bestowed_iron_gut',
  type: 'trait',
  name: 'Iron Gut',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#iron', '#survival', '#wilderness'],
    description: 'Immunity to common poisons and spoiled food.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'You eat what would kill others and suffer nothing but a sour taste.',
    mechanicalSummary: '+0.05 Iron, immune to poison/disease conditions',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.05 },
      { type: 'tag_immunity', tags: ['poison', 'disease'] },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 4. Night Eyes (T1 Bestowed)

```typescript
{
  id: 'reward_bestowed_night_eyes',
  type: 'trait',
  name: 'Night Eyes',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#eye', '#shadow', '#wilderness', '#stealth'],
    description: 'See clearly in near-total darkness.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The dark is merely dim. Your pupils are wider than they should be.',
    mechanicalSummary: '+0.05 Eye, +0.02 Shadow in exploration',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.05 },
      { type: 'conditional', condition: 'in_exploration', reach: 'shadow', value: 0.02 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 5. Gatehouse Commendation (T1 Bestowed)

```typescript
{
  id: 'reward_bestowed_gatehouse_commendation',
  type: 'trait',
  name: 'Gatehouse Commendation',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#checkpoint', '#order', '#heart', '#eye', '#iron'],
    description: 'The watch remembers you as someone who kept a hard line without turning the city against itself.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'A quiet nod from a captain, a gate waved open half a beat sooner, a ledger mark that says you made the city easier to govern instead of harder.',
    mechanicalSummary: '+0.03 Heart, +0.03 Eye, +0.02 Iron, same-faction cooperation bias +0.1',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'passive', reach: 'iron', value: 0.02 },
      { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.1 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 6. Spirit Sight (T2 Bestowed)

```typescript
{
  id: 'reward_bestowed_spirit_sight',
  type: 'trait',
  name: 'Spirit Sight',
  properties: {
    subcategory: 'bestowed',
    tier: 2,
    tags: ['#bestowed', '#eye', '#veil', '#supernatural', '#arcane', '#ruins'],
    description: 'See beyond the veil of the material into the spirit world.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The world peels back its skin. You see what it is hiding underneath.',
    mechanicalSummary: '+0.07 Eye, +0.03 Veil, on hex entry: reveals encounters within 2 hexes (6 ticks)',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.07 },
      { type: 'passive', reach: 'veil', value: 0.03 },
      { type: 'reactive', trigger: 'entered_hex', effect: {
        type: 'reveal', target: 'encounters', range: 2, duration: 6,
      }},
    ],
  } as TraitDefinitionProperties,
},
```

---

## 7. Bloodward (T2 Bestowed)

```typescript
{
  id: 'reward_bestowed_bloodward',
  type: 'trait',
  name: 'Bloodward',
  properties: {
    subcategory: 'bestowed',
    tier: 2,
    tags: ['#bestowed', '#iron', '#heart', '#combat', '#healing'],
    description: 'Wounds close faster than nature allows. Scars form in hours.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The blood knows what to do. Cut the skin and watch it knit like thread drawn tight.',
    mechanicalSummary: '+0.05 Iron, +0.03 Heart, when damaged: +0.04 Iron for 8 ticks (12-tick cooldown)',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.05 },
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 8, reach: 'iron', value: 0.04, destroyOnExpiry: false,
      }, cooldown: 12 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 8. Voices of the Departed (T2 Bestowed)

```typescript
{
  id: 'reward_bestowed_voices_of_the_departed',
  type: 'trait',
  name: 'Voices of the Departed',
  properties: {
    subcategory: 'bestowed',
    tier: 2,
    tags: ['#bestowed', '#shadow', '#heart', '#ruins'],
    description: 'Hear the whispers of the recently dead. They offer counsel, sometimes unbidden.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The dead speak softly, but they never stop. You learn to listen selectively.',
    mechanicalSummary: '+0.06 Shadow, +0.04 Heart, awareness range +1 hex (dead whisper warnings)',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.06 },
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 9. Stormcaller (T3 Bestowed)

```typescript
{
  id: 'reward_bestowed_stormcaller',
  type: 'trait',
  name: 'Stormcaller',
  properties: {
    subcategory: 'bestowed',
    tier: 3,
    tags: ['#bestowed', '#star', '#stone', '#divine', '#wilderness'],
    description: 'Command the weather within a small radius. The sky answers, reluctantly.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'Thunder follows your anger. Rain follows your grief. The sky has learned your moods.',
    mechanicalSummary: '+0.10 Star, +0.05 Stone, enemy aura -0.03 Iron (1 hex), 1.3× Iron encounter desire',
    effects: [
      { type: 'passive', reach: 'star', value: 0.10 },
      { type: 'passive', reach: 'stone', value: 0.05 },
      { type: 'aura', radius: 1, target: 'enemies', reach: 'iron', value: -0.03 },
      { type: 'behavior_weight', reach: 'iron', multiplier: 1.3 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 10. Veilwalk (T3 Bestowed)

```typescript
{
  id: 'reward_bestowed_veilwalk',
  type: 'trait',
  name: 'Veilwalk',
  properties: {
    subcategory: 'bestowed',
    tier: 3,
    tags: ['#bestowed', '#veil', '#shadow', '#supernatural', '#arcane', '#stealth'],
    description: 'Step briefly between worlds. Physical barriers become suggestions.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The wall is there, and then it is not. You pass through the space where it chose not to be.',
    mechanicalSummary: '+0.10 Veil, +0.05 Shadow, movement cost ×0.8 (phase-walking), unlocks Veil-domain actions',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.10 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'action_gate', mode: 'unlock', reach: 'veil' },
    ],
  } as TraitDefinitionProperties,
},
```

---

## 11. The Undying Flame (T4 Bestowed)

```typescript
{
  id: 'reward_bestowed_the_undying_flame',
  type: 'trait',
  name: 'The Undying Flame',
  properties: {
    subcategory: 'bestowed',
    tier: 4,
    tags: ['#bestowed', '#star', '#iron', '#divine', '#ancient'],
    description: 'A spark of divine fire burns within. Death is delayed, not prevented.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'You burned once and did not die. The fire lives inside now, patient and eternal. It will outlast you.',
    mechanicalSummary: '+0.12 Star, +0.03 Iron, blocks one quintessence loss, on damage: +0.05 Star for 6 ticks then +1 step on failures (24-tick cooldown)',
    effects: [
      { type: 'passive', reach: 'star', value: 0.12 },
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'prevent_loss', channel: 'quintessence', amount: 1, consumeOnPrevent: false },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'cascade', triggerEffect: {
          type: 'duration', ticks: 6, reach: 'star', value: 0.05, destroyOnExpiry: false,
        }, then: [
          { type: 'test_shaper', trigger: 'failure', steps: 1 },
        ],
      }, cooldown: 24 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## Summary Table

| # | Name | Tier | Editorial Changes | Status |
|---|------|------|-------------------|--------|
| 1 | Ember Hands | T1 | mechanicalSummary format | PASS WITH REVISIONS |
| 2 | Beast-Tongue | T1 | `#flesh` tag removed (confirmed in revised) | PASS |
| 3 | Iron Gut | T1 | `#flesh` tag removed (confirmed in revised) | PASS |
| 4 | Night Eyes | T1 | None | PASS |
| 5 | Gatehouse Commendation | T1 | Tags: +`#bestowed`, +`#iron`; mechanicalSummary clarified | PASS WITH REVISIONS |
| 6 | Spirit Sight | T2 | Flavor text revised; mechanicalSummary adds duration | PASS WITH REVISIONS |
| 7 | Bloodward | T2 | `#flesh` tag removed (confirmed in revised) | PASS |
| 8 | Voices of the Departed | T2 | mechanicalSummary clarified | PASS WITH REVISIONS |
| 9 | Stormcaller | T3 | mechanicalSummary tightened | PASS WITH REVISIONS |
| 10 | Veilwalk | T3 | mechanicalSummary: "faster" → "cost ×0.8" | PASS WITH REVISIONS |
| 11 | The Undying Flame | T4 | Tags: `#flesh`→`#iron` confirmed; mechanicalSummary clarified | PASS WITH REVISIONS |
