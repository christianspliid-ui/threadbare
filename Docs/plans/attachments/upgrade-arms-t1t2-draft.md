# Attachment Upgrade Pipeline: T1-T2 arms with #iron #combat tags
> Slug: upgrade-arms-t1t2 | Pass: draft | Mode: upgrade
> Items: 8 items | Date: 2026-04-06

---

## 1. Bronze Spear

**Niche:** Reliable formation fighter. A simple weapon that rewards direct confrontation -- the weapon of a soldier who holds the line. The pitted bronze is crude but its length gives advantage in a stand-up fight.

```typescript
{
  id: 'reward_arms_bronze_spear',
  type: 'artifact',
  name: 'Bronze Spear',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee', '#combat'],
    mechanicalSummary: '+0.03 Iron, +0.02 Iron in combat',
    lossCondition: 'breakable',
    flavorText: 'Pitted and green with age, but the point still bites.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (passive + conditional), -reachBonus, updated mechanicalSummary.
**Total reach value:** 0.05 max (0.03 passive + 0.02 conditional)

---

## 2. Hunting Bow

**Niche:** Wilderness scout's weapon. A bow warped from damp and rough use -- not a war weapon, but deadly in the hands of someone who knows open ground and wild country. Rewards exploration and ranging over stand-up fighting.

```typescript
{
  id: 'reward_arms_hunting_bow',
  type: 'artifact',
  name: 'Hunting Bow',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#ranged', '#combat'],
    mechanicalSummary: '+0.04 Iron, +0.01 Iron per combat success (max +0.03)',
    lossCondition: 'breakable',
    flavorText: 'Sinew-strung and warped from damp, but deadly enough at close range.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.04 },
      { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (passive + stacking), -reachBonus, updated mechanicalSummary.
**Total reach value:** 0.07 max (0.04 passive + 0.03 stacking cap)

---

## 3. Rusted Mace

**Niche:** Blunt instrument of attrition. A heavy, ugly weapon that trades finesse for raw punishment. The rust is half the weapon -- wounds from this thing fester. Carries a tradeoff: crushing force at the cost of subtlety.

```typescript
{
  id: 'reward_arms_rusted_mace',
  type: 'artifact',
  name: 'Rusted Mace',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee', '#combat'],
    mechanicalSummary: '+0.04 Iron, +0.02 Iron / -0.01 Heart (blunt instrument)',
    lossCondition: 'breakable',
    flavorText: 'The rust is mostly cosmetic. Mostly.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.04 },
      { type: 'tradeoff', bonus: { reach: 'iron', value: 0.02 }, penalty: { reach: 'heart', value: 0.01 } },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (passive + tradeoff), -reachBonus, updated mechanicalSummary.
**Total reach value:** 0.06 Iron / -0.01 Heart

---

## 4. Bone Knife

**Niche:** Desperate survivor's blade. Carved from a rib, fragile, disposable -- the weapon of someone with nothing better. It will not last, but it has a few good cuts left in it. Consumable charges represent its brittle nature and limited lifespan.

```typescript
{
  id: 'reward_arms_bone_knife',
  type: 'artifact',
  name: 'Bone Knife',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee', '#survival', '#combat', '#wilderness'],
    mechanicalSummary: '+0.03 Iron, 3 charges of +0.04 Iron burst (desperate strikes)',
    lossCondition: 'consumable',
    flavorText: 'Carved from the rib of something large. It will not last.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'iron', value: 0.04 }, destroyOnEmpty: true },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (passive + consumable_charge), -reachBonus, updated mechanicalSummary.
**Total reach value:** 0.07 max (0.03 passive + 0.04 charge burst); charges are limited and item self-destructs.

---

## 5. Iron Blade (Starter)

**Niche:** Dependable workhorse. The default weapon every hero starts with -- simple folded steel, nothing fancy, nothing cursed. Reliable in a fight, with enough weight behind it to turn a near-miss into a clean hit. The test_shaper represents the blade's forgiving balance.

> Note: The existing `onUseTriggers` (critical_failure breakage) is preserved as-is. The effects[] array adds new composable effects alongside the legacy trigger system.

```typescript
{
  id: 'starter_iron_blade',
  type: 'artifact',
  name: 'Iron Blade',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee'],
    mechanicalSummary: '+0.05 Iron, rescues near-miss combat rolls (+1 step)',
    lossCondition: 'breakable',
    flavorText: 'A well-worn blade of folded steel, simple and reliable.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.05 },
      { type: 'test_shaper', reach: 'iron', trigger: 'near_miss', steps: 1, maxMargin: 1 },
    ],
    onUseTriggers: [
      {
        triggerCondition: 'critical_failure',
        probability: 0.25,
        effect: {
          type: 'remove_possession',
        },
        narrativeTemplate: '{item_name} snaps against the blow.',
      },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (passive + test_shaper), -reachBonus, updated mechanicalSummary. Preserved onUseTriggers.
**Total reach value:** 0.05 passive + test_shaper (no additive reach, outcome quality shift only)

---

## 6. Blackiron Blade

**Niche:** Haunted forge-weapon. Metal from a dead forge-town that remembers heat it should not -- the blade grows warm when blood is drawn. A superior weapon that rewards sustained violence with accumulating ferocity, but the warmth fades quickly between fights.

```typescript
{
  id: 'reward_arms_blackiron_blade',
  type: 'artifact',
  name: 'Blackiron Blade',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#iron', '#weapon', '#melee', '#combat'],
    mechanicalSummary: '+0.08 Iron, +0.01 Iron per combat success (max +0.04, decays between fights)',
    lossCondition: 'breakable',
    flavorText: 'Forged in a dead forge-town. The metal remembers heat it should not.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.08 },
      { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success', decayPerTick: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (passive + stacking), -reachBonus, updated mechanicalSummary.
**Total reach value:** 0.12 max (0.08 passive + 0.04 stacking cap)

---

## 7. Crossbow of the Watch

**Niche:** Sentry's instrument of vigilance. Issued to border watchers -- a precision weapon that rewards careful observation over brute force. The worn sighting marks speak of anxious hours scanning the dark. Boosts awareness range, representing the watchman's trained eye scanning further.

```typescript
{
  id: 'reward_arms_crossbow_of_the_watch',
  type: 'artifact',
  name: 'Crossbow of the Watch',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#iron', '#weapon', '#ranged', '#eye', '#combat'],
    mechanicalSummary: '+0.07 Iron, +0.03 Eye, +1 awareness range (watchman\'s vigil)',
    lossCondition: 'stealable',
    flavorText: 'Issued to border watchers. The sighting marks are worn smooth by anxious thumbs.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.07 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (2x passive + range_modifier), -reachBonus, updated mechanicalSummary.
**Total reach value:** 0.10 (0.07 Iron + 0.03 Eye) + awareness range utility

---

## 8. Thornwood Staff

**Niche:** Living weapon. The wood is alive and responds to its wielder's experiences -- it grows thorns in adversity and leaves in peace. Encounters of any kind cause the staff to resonate with the earth, stacking stone reach as the living wood draws strength from use.

```typescript
{
  id: 'reward_arms_thornwood_staff',
  type: 'artifact',
  name: 'Thornwood Staff',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#iron', '#weapon', '#melee', '#stone', '#combat'],
    mechanicalSummary: '+0.06 Iron, +0.03 Stone, thorns emerge when attacked (+0.03 Iron for 6 ticks)',
    lossCondition: 'breakable',
    flavorText: 'The wood is alive. It sprouts small leaves in spring, thorns in winter.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.06 },
      { type: 'passive', reach: 'stone', value: 0.03 },
      { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'iron', value: 0.03, destroyOnExpiry: true }, cooldown: 12 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes:** +effects[] (2x passive + reactive/duration), -reachBonus, updated mechanicalSummary.
**Total reach value:** 0.12 sustained (0.06 Iron + 0.03 Stone + 0.03 reactive Iron burst)

---

## Summary Table

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Bronze Spear | T1 | Reliable formation fighter | passive + conditional | 0.05 | +effects[], -reachBonus, updated summary |
| 2 | Hunting Bow | T1 | Wilderness ranged, improves with kills | passive + stacking | 0.07 | +effects[], -reachBonus, updated summary |
| 3 | Rusted Mace | T1 | Blunt attrition, trades heart for iron | passive + tradeoff | 0.06 / -0.01 | +effects[], -reachBonus, updated summary |
| 4 | Bone Knife | T1 | Desperate survivor, limited charges | passive + consumable_charge | 0.07 burst | +effects[], -reachBonus, updated summary |
| 5 | Iron Blade | T1 | Dependable workhorse, forgiving balance | passive + test_shaper | 0.05 + shaper | +effects[], -reachBonus, updated summary, kept onUseTriggers |
| 6 | Blackiron Blade | T2 | Haunted forge-metal, heats with violence | passive + stacking | 0.12 | +effects[], -reachBonus, updated summary |
| 7 | Crossbow of the Watch | T2 | Sentry's precision, extended vigilance | 2x passive + range_modifier | 0.10 + awareness | +effects[], -reachBonus, updated summary |
| 8 | Thornwood Staff | T2 | Living weapon, thorns on retaliation | 2x passive + reactive(duration) | 0.12 | +effects[], -reachBonus, updated summary |

### Primitive Distribution

| Primitive | Items Using It |
|-----------|---------------|
| passive | All 8 (converted from reachBonus) |
| conditional | Bronze Spear |
| stacking | Hunting Bow, Blackiron Blade |
| tradeoff | Rusted Mace |
| consumable_charge | Bone Knife |
| test_shaper | Iron Blade |
| range_modifier | Crossbow of the Watch |
| reactive (wrapping duration) | Thornwood Staff |

Six distinct non-passive primitives across 8 items. Stacking appears twice (T1 Hunting Bow with fast decay vs T2 Blackiron Blade with higher cap) but with different tuning that creates distinct gameplay feel.

### Cap Compliance

All items are within the 0.15 per-item cap (EFFECT_PER_ITEM_CAP). Highest total is 0.12 (Blackiron Blade, Thornwood Staff). Conditional, stacking, consumable, and reactive values are situational/temporary and do not all apply simultaneously under normal play.
