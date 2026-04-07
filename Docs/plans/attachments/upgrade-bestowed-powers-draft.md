# Attachment Upgrade Pipeline: Bestowed Powers
> Slug: bestowed-powers | Pass: draft | Mode: upgrade
> Items: 10 items (T1 x4, T2 x3, T3 x2, T4 x1) | Date: 2026-04-06
> Skipped: `reward_bestowed_patrons_backing` (already alive with test_shaper)

**Note on Flesh reach removal (TB-075):** Several items had `domainContributions` referencing `flesh`, which is no longer a valid `ReachDomain`. In the effects migration, `flesh` contributions are remapped to thematically appropriate valid reaches (iron for resilience/combat, heart for empathy/body-awareness, stone for endurance). The original `domainContributions` are removed entirely and replaced by `effects[]`.

---

## 1. Ember Hands (T1 Bestowed)

**Niche:** Fire manipulation and survival utility -- hands that kindle flame, ward off cold, and shape hot materials. A practical gift for forge work, wilderness survival, and improvised weaponry.

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
    mechanicalSummary: '+0.04 Stone, grants fire_touch trait',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.04 },
      { type: 'trait_grant', grantedTrait: 'fire_touch' },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The original stone contribution becomes a passive. The trait_grant adds a qualitative capability (fire_touch) that unlocks fire-related encounter options -- lighting forges, starting campfires, cauterizing wounds. For T1, one passive + one trait_grant is the right weight: the power feels real without being mechanically dominant. Total reach value: 0.04 passive.

---

## 2. Beast-Tongue (T1 Bestowed)

**Niche:** Animal communication and empathy -- creatures trust and obey, opening wilderness encounter paths unavailable to others. The gift extends to reading animal behavior as intelligence.

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
    // domainContributions removed — migrated to effects[]
    // flesh tag removed — reach no longer exists
  } as TraitDefinitionProperties,
},
```

**Design notes:** Heart captures the empathic bond with animals. The conditional Eye bonus in wilderness reflects reading animal tracks, sensing danger through animal behavior, and interpreting the forest through its creatures' eyes. The `#flesh` tag is dropped from tags since flesh reach no longer exists; `#eye` replaces it to match the new conditional. Total reach value: 0.04 passive + 0.02 conditional = 0.06 max.

---

## 3. Iron Gut (T1 Bestowed)

**Niche:** Poison and disease resistance -- an unbreakable constitution that shrugs off toxins, tainted food, and alchemical hazards. A survival power that keeps the bearer standing where others fall.

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
    // domainContributions removed — migrated to effects[]
    // flesh reach remapped to iron (bodily endurance → martial toughness)
  } as TraitDefinitionProperties,
},
```

**Design notes:** The original flesh 0.05 remaps to iron -- both express physical toughness, and iron is the surviving reach that best captures "your body is harder to break." The tag_immunity blocks incoming conditions tagged with poison or disease, which is exactly what "immunity to common poisons" means mechanically. Clean, definitive, very T1. Total reach value: 0.05 passive.

---

## 4. Night Eyes (T1 Bestowed)

**Niche:** Darkness vision and nocturnal awareness -- pupils that drink in starlight, turning night into advantage. The bearer sees what others miss in shadow and gloom.

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
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** Eye is the obvious primary reach -- seeing in darkness. The conditional Shadow bonus during exploration reflects using darkness as an advantage: the bearer moves unseen because they don't need torches. This creates a natural synergy where Night Eyes makes the bearer both perceptive AND stealthy in dark environments. Total reach value: 0.05 passive + 0.02 conditional = 0.07 max.

---

## 5. Gatehouse Commendation (T1 Bestowed)

**Niche:** Social standing with authority -- a mark of civic trust that smooths interactions with guards, officials, and anyone who respects order. The commendation is a social key, not a weapon.

```typescript
{
  id: 'reward_bestowed_gatehouse_commendation',
  type: 'trait',
  name: 'Gatehouse Commendation',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#checkpoint', '#order', '#heart', '#eye'],
    description: 'The watch remembers you as someone who kept a hard line without turning the city against itself.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'A quiet nod from a captain, a gate waved open half a beat sooner, a ledger mark that says you made the city easier to govern instead of harder.',
    mechanicalSummary: '+0.03 Heart, +0.03 Eye, +0.02 Iron, allies in same faction cooperate more easily',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'passive', reach: 'iron', value: 0.02 },
      { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.1 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The three passive reaches preserve the original domainContributions exactly (heart 0.03, eye 0.03, iron 0.02 = 0.08 total). The social_modifier adds a cooperation bias with same-faction agents -- the commendation makes fellow faction members more inclined to cooperate, reflecting the "city easier to govern" flavor text. A +0.1 cooperation bias is modest but meaningful for a T1 item. Total reach value: 0.08 passive.

---

## 6. Spirit Sight (T2 Bestowed)

**Niche:** Perceiving the supernatural -- eyes that pierce the veil between worlds, revealing hidden spirits, magic, and wards. The sight intensifies reactively when encountering the unknown.

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
    flavorText: 'The world peels back its skin for those who dare to look.',
    mechanicalSummary: '+0.07 Eye, +0.03 Veil, reveals encounters within 2 hexes when entering new hex',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.07 },
      { type: 'passive', reach: 'veil', value: 0.03 },
      { type: 'reactive', trigger: 'entered_hex', effect: {
        type: 'reveal', target: 'encounters', range: 2, duration: 6,
      }},
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The passives preserve the original values exactly (eye 0.07, veil 0.03). The reactive reveal fires when the bearer enters a new hex, revealing encounters within 2 hexes for 6 ticks (half a day). This is Spirit Sight in action: the bearer's vision flares as they step onto new ground, briefly illuminating the supernatural landscape. The 6-tick duration prevents permanent omniscience while giving meaningful scouting advantage. Total reach value: 0.10 passive + reveal (no reach value, information effect).

---

## 7. Bloodward (T2 Bestowed)

**Niche:** Regenerative blood magic -- wounds close unnaturally fast, and the blood itself fights back against harm. A defensive power that activates most strongly when the bearer is hurt.

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
    // domainContributions removed — migrated to effects[]
    // flesh 0.08 remapped to iron 0.05 + heart 0.03 (bodily healing → martial resilience + empathic body-awareness)
  } as TraitDefinitionProperties,
},
```

**Design notes:** The original flesh 0.08 and iron 0.03 totaled 0.11. Remapping flesh to iron + heart (0.05 + 0.03 = 0.08) preserves the total investment. The reactive fires when the bearer takes damage, granting a temporary Iron surge as the blood magic activates -- wounds knitting, adrenaline flooding, pain suppressed. The 12-tick cooldown prevents constant triggering. Total reach value: 0.08 passive + 0.04 reactive = 0.12 max.

---

## 8. Voices of the Departed (T2 Bestowed)

**Niche:** Communion with the dead -- whispers from beyond that offer knowledge, social insight, and warnings. The departed speak most clearly in places where death lingers.

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
    mechanicalSummary: '+0.06 Shadow, +0.04 Heart, +1 awareness range',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.06 },
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** Shadow (the dead are hidden) and Heart (they speak, they counsel) preserve the original reach split exactly. The range_modifier extends awareness by 1 hex -- the dead whisper warnings about what lies ahead, people approaching, dangers lurking. This is information-as-power without being a direct reach bonus. The voices don't fight for you; they tell you what's coming. Total reach value: 0.10 passive + awareness range (no reach value, spatial effect).

---

## 9. Stormcaller (T3 Bestowed)

**Niche:** Weather command -- a mythic gift that bends sky and storm to the bearer's will. The power radiates outward, affecting the local environment and driving the bearer toward dramatic, high-impact encounters.

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
    mechanicalSummary: '+0.10 Star, +0.05 Stone, nearby enemies -0.03 Iron (storm aura, 1 hex), 1.3x desire for Iron encounters (storm-seeking)',
    effects: [
      { type: 'passive', reach: 'star', value: 0.10 },
      { type: 'passive', reach: 'stone', value: 0.05 },
      { type: 'aura', radius: 1, target: 'enemies', reach: 'iron', value: -0.03 },
      { type: 'behavior_weight', reach: 'iron', multiplier: 1.3 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The passives preserve the original domainContributions exactly. The aura (1-hex radius, enemies only) applies a -0.03 Iron penalty -- the storm batters those who oppose the bearer, making enemies less effective in combat. The behavior_weight drives the bearer toward Iron encounters at 1.3x desire -- a stormcaller doesn't hide from confrontation; the weather mirrors their aggression. These two effects compose: the aura weakens enemies, the behavior_weight ensures the bearer seeks those fights. Total reach value: 0.15 passive + aura (reach penalty to enemies, not a self-bonus).

---

## 10. Veilwalk (T3 Bestowed)

**Niche:** Reality phasing -- the power to step between worlds, bypassing physical barriers and moving unseen. An evasive, infiltration-oriented gift that unlocks supernatural movement options.

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
    mechanicalSummary: '+0.10 Veil, +0.05 Shadow, 20% faster movement (phase-walking), unlocks Veil-domain actions',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.10 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'action_gate', mode: 'unlock', reach: 'veil' },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The passives preserve the original domainContributions exactly. The range_modifier with 0.8 movement cost multiplier represents phasing through terrain -- walls, dense forest, mountains all become easier when you can step sideways through reality. The action_gate unlocks Veil-domain actions, representing the ability to interact with the supernatural plane that phasing makes accessible. These two compose: faster travel to reach mystical encounters + the ability to engage with them once there. Total reach value: 0.15 passive + movement modifier (no reach value, mobility effect).

---

## 11. The Undying Flame (T4 Bestowed)

**Niche:** Legendary regeneration and death defiance -- a divine spark that refuses to be extinguished. The bearer survives what should kill them, their flame burning brightest at the edge of annihilation. The most powerful bestowed gift, with multiple reinforcing layers.

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
    mechanicalSummary: '+0.12 Star, +0.03 Iron, prevents quintessence loss once, when damaged: cascade — +0.05 Star for 6 ticks then rescues near-miss failures (+1 step)',
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
    // domainContributions removed — migrated to effects[]
    // flesh 0.08 remapped to iron 0.03 (bodily vitality → martial endurance, scaled down to stay within cap)
  } as TraitDefinitionProperties,
},
```

**Design notes:** The original star 0.12 + flesh 0.08 = 0.20 exceeded the per-item cap (0.15). Since flesh is removed, the remapping to iron 0.03 brings the passive total to 0.15 -- exactly at cap. The prevent_loss on quintessence channel is the signature T4 effect: the flame catches the bearer at the moment of spiritual death, preventing one quintessence loss. It does NOT consume on prevent (the flame is undying, after all), but the protection is limited to one instance per trigger. The reactive cascade fires when damaged: first a 6-tick Star surge (the flame flaring up), then a test_shaper that rescues failures (the divine fire refusing to let the bearer fall). The 24-tick cooldown (two full days) prevents the cascade from trivializing danger. Total reach value: 0.15 passive + 0.05 reactive = 0.20 max (within T4 budget given the cascade cooldown).

---

## Summary Table

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Ember Hands | T1 | Fire manipulation, forge/survival utility | passive + trait_grant | 0.04 | +effects[], -domainContributions, updated summary |
| 2 | Beast-Tongue | T1 | Animal empathy, wilderness perception | passive + conditional | 0.06 | +effects[], -domainContributions, flesh→heart remap, updated tags & summary |
| 3 | Iron Gut | T1 | Poison/disease resistance | passive + tag_immunity | 0.05 | +effects[], -domainContributions, flesh→iron remap, updated tags & summary |
| 4 | Night Eyes | T1 | Darkness vision, nocturnal stealth | passive + conditional | 0.07 | +effects[], -domainContributions, updated summary |
| 5 | Gatehouse Commendation | T1 | Civic trust, faction cooperation | passive x3 + social_modifier | 0.08 | +effects[], -domainContributions, updated summary |
| 6 | Spirit Sight | T2 | Supernatural perception, encounter reveal | passive x2 + reactive(reveal) | 0.10 | +effects[], -domainContributions, updated summary |
| 7 | Bloodward | T2 | Regenerative blood magic | passive x2 + reactive(duration) | 0.12 | +effects[], -domainContributions, flesh→iron+heart remap, updated tags & summary |
| 8 | Voices of the Departed | T2 | Dead communion, extended awareness | passive x2 + range_modifier | 0.10 | +effects[], -domainContributions, updated summary |
| 9 | Stormcaller | T3 | Weather command, storm aura | passive x2 + aura + behavior_weight | 0.15 | +effects[], -domainContributions, updated summary |
| 10 | Veilwalk | T3 | Reality phasing, barrier bypass | passive x2 + range_modifier + action_gate | 0.15 | +effects[], -domainContributions, updated summary |
| 11 | The Undying Flame | T4 | Death defiance, divine regeneration | passive x2 + prevent_loss + reactive(cascade) | 0.15+reactive | +effects[], -domainContributions, flesh→iron remap, updated tags & summary |

### Primitive Variety Check

| Primitive | Used By |
|-----------|---------|
| passive | All 10 items (base layer from domainContributions) |
| trait_grant | Ember Hands |
| conditional | Beast-Tongue, Night Eyes |
| tag_immunity | Iron Gut |
| social_modifier | Gatehouse Commendation |
| reactive + reveal | Spirit Sight |
| reactive + duration | Bloodward |
| range_modifier | Voices of the Departed, Veilwalk |
| aura | Stormcaller |
| behavior_weight | Stormcaller |
| action_gate | Veilwalk |
| prevent_loss | The Undying Flame |
| reactive + cascade | The Undying Flame |
| test_shaper | The Undying Flame (inside cascade) |

13 distinct primitives across 10 items. No two items use the same non-passive combination.

### Flesh Reach Remapping Summary

| Item | Original Flesh Value | Remapped To | Rationale |
|------|---------------------|-------------|-----------|
| Beast-Tongue | flesh 0.04 (via tag) | heart 0.04 (already there) | Heart already present; flesh tag was thematic overlap |
| Iron Gut | flesh 0.05 | iron 0.05 | Bodily endurance → martial toughness |
| Bloodward | flesh 0.08 | iron 0.05 + heart 0.03 | Split: physical resilience (iron) + body empathy (heart) |
| The Undying Flame | flesh 0.08 | iron 0.03 | Scaled down to hit 0.15 cap; divine fire is star-primary |
