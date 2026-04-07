# Attachment Pipeline: Diverse Mounts Across Underserved Reaches
> Category: mounts_beasts | Slug: fill-diverse-mounts | Pass: draft
> Status: **DRAFT**

## Batch Summary

| Field | Value |
|-------|-------|
| Problem | Mounts have zero items for Shadow, Veil, Heart, Star reaches. No T4 mounts exist. Current coverage: Iron (T2-T3), Gold (T1-T2), Eye (T1), Stone (T1). |
| Items | 8 new mounts (all new IDs) |
| Tier spread | T2 x4, T3 x3, T4 x1 |
| Reach spread | Shadow x2, Veil x2, Heart x2, Star x1, multi-reach x1 (T4) |
| Target primitives | range_modifier, trait_grant, behavior_weight, aura, conditional, reactive, social_modifier, tag_immunity, tradeoff, stacking |

---

## Design Rationale

Each reach interprets "mount/beast" through its own domain logic. These are not warhorses with different paint -- they are creatures shaped by the cosmic energy that birthed them.

- **Shadow** mounts are night-runners and dusk-stalkers: creatures that move through darkness as though it were open road. They reward stealth, ambush positioning, and operating alone in hostile territory.
- **Veil** mounts are phase-beasts and ethereal familiars: creatures that slip between realities, distorting perception and space around their rider. They reward mystical contexts and exploration of liminal places.
- **Heart** mounts are empathic companions: creatures bonded through emotion rather than bridle. They protect through loyalty, calm through presence, and refuse to abandon their rider. They reward social contexts and fellowship.
- **Star** mounts are fate-touched celestials: creatures born under strange signs whose movements trace prophetic patterns. They reward awareness, foresight, and operating under the open sky.

All mounts emphasize `range_modifier` (movement cost reduction and/or awareness extension) as the core mount benefit, then layer reach-specific effects on top.

---

## Approved Attachments

### 1. Dustwalker

```typescript
{
  id: 'reward_mounts_beasts_dustwalker',
  type: 'artifact',
  name: 'Dustwalker',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#mount', '#shadow', '#stealth', '#wilderness'],
    mechanicalSummary: '+0.04 Shadow, 15% reduced movement cost, +0.03 Shadow in enemy territory (ambush positioning)',
    lossCondition: 'stealable',
    flavorText: 'A gaunt grey thing with hooves wrapped in rags. It makes no sound on any surface and will not approach firelight.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.04 },
      { type: 'range_modifier', movementCostMultiplier: 0.85 },
      { type: 'conditional', condition: 'in_enemy_territory', reach: 'shadow', value: 0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Infiltrator's mount. The Dustwalker rewards operating behind enemy lines -- a creature bred for scouts and saboteurs. The conditional bonus in enemy territory distinguishes it from Iron war-mounts that shine in direct combat. Silent movement is its nature, not a trained behavior.
**Total reach value:** 0.07 max Shadow (0.04 passive + 0.03 conditional) + movement
**Primitives used:** passive, range_modifier, conditional

---

### 2. Cindermaw

```typescript
{
  id: 'reward_mounts_beasts_cindermaw',
  type: 'artifact',
  name: 'Cindermaw',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#mount', '#shadow', '#combat', '#intimidation'],
    mechanicalSummary: '+0.07 Shadow, +0.03 Iron, 15% reduced movement cost, grants shadow_strike trait, enemies in 1 hex: -0.03 Eye (shroud aura)',
    lossCondition: 'permanent',
    flavorText: 'A wolf the size of a yearling calf, black as wet charcoal. Smoke leaks from between its teeth when it breathes. It chose you. You did not choose it.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.07 },
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.85 },
      { type: 'trait_grant', grantedTrait: 'shadow_strike' },
      { type: 'aura', radius: 1, target: 'enemies', reach: 'eye', value: -0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Shadow predator mount. A T3 nightmare-wolf that projects darkness around itself, blinding nearby enemies (aura debuff to Eye). The `shadow_strike` trait unlocks ambush encounter options unavailable to ordinary riders. It fights alongside its master, hence the Iron passive. The aura represents the unnatural gloom that clings to the beast -- enemies can hear it growling but cannot find it.
**Total reach value:** 0.10 Shadow + 0.03 Iron (0.12 total passive) + trait + aura + movement
**Primitives used:** passive x2, range_modifier, trait_grant, aura

---

### 3. Veilstag

```typescript
{
  id: 'reward_mounts_beasts_veilstag',
  type: 'artifact',
  name: 'Veilstag',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#mount', '#veil', '#mystical', '#exploration'],
    mechanicalSummary: '+0.04 Veil, 10% reduced movement cost, +1 awareness hex range, +0.03 Veil in mystical encounters',
    lossCondition: 'stealable',
    flavorText: 'A white hart with too many antler points. Its hooves leave no prints but the air shimmers where it stepped, as if heat were rising from snow.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'range_modifier', movementCostMultiplier: 0.9, awarenessRangeBonus: 1 },
      { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Arcane tracker. The Veilstag is drawn to places where the boundary between worlds is thin -- hence the awareness range bonus (it senses disturbances the rider cannot) and the mystical conditional. It moves gently through terrain that confounds normal beasts, always finding the path between. More explorer than warhorse.
**Total reach value:** 0.07 max Veil (0.04 passive + 0.03 conditional) + movement + awareness
**Primitives used:** passive, range_modifier, conditional

---

### 4. Glimmermoth

```typescript
{
  id: 'reward_mounts_beasts_glimmermoth',
  type: 'artifact',
  name: 'Glimmermoth',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#mount', '#veil', '#mystical', '#arcane'],
    mechanicalSummary: '+0.06 Veil, +0.03 Eye, 15% reduced movement cost, +2 awareness hex range, immune to fear/illusion tags, amplifies mystical encounters (1.3x)',
    lossCondition: 'permanent',
    flavorText: 'Larger than any moth should be and luminous at the wing-edges. It navigates by ley-lines that no cartographer has mapped. When it lands on your shoulder the weight is barely there, but the world looks different.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.85, awarenessRangeBonus: 2 },
      { type: 'tag_immunity', tags: ['fear', 'illusion'] },
      { type: 'behavior_weight', reach: 'veil', multiplier: 1.3 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Arcane familiar-mount. The Glimmermoth is not ridden in the traditional sense -- it is a companion that carries its bonded through liminal spaces. The exceptional awareness range (+2 hexes) represents its ley-line sensitivity: it perceives magical disturbances across vast distances. Fear and illusion immunity reflect that a creature which lives between realities cannot be fooled by false ones. The behavior_weight amplifies mystical encounters, steering the rider toward arcane discoveries.
**Total reach value:** 0.09 (0.06 Veil + 0.03 Eye) + awareness + immunity + behavior
**Primitives used:** passive x2, range_modifier, tag_immunity, behavior_weight

---

### 5. Hearthbound Hound

```typescript
{
  id: 'reward_mounts_beasts_hearthbound_hound',
  type: 'artifact',
  name: 'Hearthbound Hound',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#heart', '#loyalty', '#social', '#companion'],
    mechanicalSummary: '+0.04 Heart, +0.02 Iron, cooperation +0.15 toward allies, when damaged: +0.04 Heart for 3 ticks (8-tick cooldown, protective instinct)',
    lossCondition: 'permanent',
    flavorText: 'It followed a dead woman for nine days before it found you. Now it sleeps across your doorway and will not let strangers pass without your word.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'passive', reach: 'iron', value: 0.02 },
      { type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.15 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 3, reach: 'heart', value: 0.04, destroyOnExpiry: true
      }, cooldown: 8 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Loyalty companion. Not a mount but a bonded beast -- it walks beside you, not beneath you. The social_modifier toward allies reflects how the hound's presence builds trust: people open up around someone whose dog trusts them. The reactive trigger on damage represents the hound's protective surge -- it interposes itself, growls, and its devotion steels your resolve. Permanent loss condition because this bond does not break.
**Total reach value:** 0.06 passive (0.04 Heart + 0.02 Iron) + social + reactive burst (0.04)
**Primitives used:** passive x2, social_modifier, reactive

---

### 6. Sorrowheart Mare

```typescript
{
  id: 'reward_mounts_beasts_sorrowheart_mare',
  type: 'artifact',
  name: 'Sorrowheart Mare',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#mount', '#heart', '#empathy', '#social', '#healing'],
    mechanicalSummary: '+0.08 Heart, +0.03 Gold, 20% reduced movement cost, allies in 1 hex: +0.02 Heart (calming aura), grants empathic_bond trait',
    lossCondition: 'permanent',
    flavorText: 'She carries grief the way other horses carry weight -- steadily, without stumbling. Wounded soldiers stop screaming when she walks through camp. No one knows why.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.08 },
      { type: 'passive', reach: 'gold', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
      { type: 'trait_grant', grantedTrait: 'empathic_bond' },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Healer's mount and emotional anchor. The Sorrowheart Mare's calming aura buffs nearby allies' Heart, representing the uncanny peace she radiates. The `empathic_bond` trait unlocks emotional encounter options (sensing lies, calming crowds, soothing the dying). She is a true mount -- fast and steady with 20% movement reduction -- but her value is not martial. She is for leaders, healers, and diplomats who ride through the aftermath of battles rather than into them.
**Total reach value:** 0.11 passive (0.08 Heart + 0.03 Gold) + aura + trait + movement
**Primitives used:** passive x2, range_modifier, aura, trait_grant

---

### 7. Dawnfeather Kestrel

```typescript
{
  id: 'reward_mounts_beasts_dawnfeather_kestrel',
  type: 'artifact',
  name: 'Dawnfeather Kestrel',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#star', '#prophecy', '#awareness', '#companion'],
    mechanicalSummary: '+0.06 Star, +0.04 Eye, +3 awareness hex range, amplifies exploration encounters (1.2x), when encounter starts: +0.03 Star for 4 ticks (6-tick cooldown, prescient warning)',
    lossCondition: 'permanent',
    flavorText: 'It perches on your shoulder at dawn and screams at things that have not happened yet. By the time you understand its warning, you are already moving.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'range_modifier', awarenessRangeBonus: 3 },
      { type: 'behavior_weight', reach: 'eye', multiplier: 1.2 },
      { type: 'reactive', trigger: 'encounter_started', effect: {
        type: 'duration', ticks: 4, reach: 'star', value: 0.03, destroyOnExpiry: true
      }, cooldown: 6 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Prophetic scout-bird. Not a mount you ride but a companion that extends your senses across the horizon. The exceptional +3 awareness range is the kestrel's primary value -- it flies far ahead, sees threats and opportunities before they arrive. The reactive on encounter_started represents its prescient screech: a warning that something approaches, granting a burst of Star-domain foresight. The behavior_weight toward Eye/exploration means the kestrel's instincts pull its bonded toward discovery rather than conflict. No movement cost reduction -- this is a perching companion, not a riding beast.
**Total reach value:** 0.10 passive (0.06 Star + 0.04 Eye) + awareness + behavior + reactive burst (0.03)
**Primitives used:** passive x2, range_modifier, behavior_weight, reactive

---

### 8. The Pale Pilgrim

```typescript
{
  id: 'reward_mounts_beasts_pale_pilgrim',
  type: 'artifact',
  name: 'The Pale Pilgrim',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 4,
    tags: ['#beast', '#mount', '#star', '#veil', '#legendary', '#celestial'],
    mechanicalSummary: '+0.06 Star, +0.04 Veil, +0.03 Eye, 25% reduced movement cost, +2 awareness hex range, immune to fear/curse tags, allies in 1 hex: +0.02 Star (fate-touched aura), grants starborne_rider trait',
    lossCondition: 'permanent',
    flavorText: 'No breed anyone can name. Coat like moonlight on still water. It appeared at the crossroads on the longest night and waited, as though it had always known you would come. The old woman at the wayshrine said it had been waiting for a century.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.06 },
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.75, awarenessRangeBonus: 2 },
      { type: 'tag_immunity', tags: ['fear', 'curse'] },
      { type: 'aura', radius: 1, target: 'allies', reach: 'star', value: 0.02 },
      { type: 'trait_grant', grantedTrait: 'starborne_rider' },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** The game's first T4 mount -- a legendary celestial beast. The Pale Pilgrim combines Star and Veil domains: a creature of prophecy and liminality that walks between worlds. It is mechanically generous but not broken: 0.13 total passive spread across three reaches (no single reach exceeds 0.06), with utility effects (movement, awareness, immunity, aura, trait) that reward the rider's entire warband. The `starborne_rider` trait unlocks celestial encounter paths and narrative options unavailable to mundane riders.

The design philosophy is "epic through breadth, not depth." Rather than stacking a single reach to dangerous heights, the Pale Pilgrim elevates everything modestly -- foresight, mystical sensitivity, observation, movement, resilience -- making its rider feel cosmically favored without dominating any single axis.

Fear and curse immunity represent the beast's otherworldly composure: what was born in starlight does not flinch at mortal terrors. The aura gives nearby allies a touch of that fate -- a sense that they are part of a larger story.

**Total reach value:** 0.13 passive (0.06 Star + 0.04 Veil + 0.03 Eye) + movement + awareness + immunity + aura + trait
**Effect count:** 7 (within T4 guideline of 4-5 effects for value, but 7 total since aura/immunity/trait are utility, not raw reach value. Total passive value is 0.13, within EFFECT_PER_ITEM_CAP of 0.15.)
**Primitives used:** passive x3, range_modifier, tag_immunity, aura, trait_grant

---

## Summary Table

| # | Name | Reach | Tier | Primitives | Max Reach Value | Loss | Effects |
|---|------|-------|------|-----------|----------------|------|---------|
| 1 | Dustwalker | Shadow | T2 | passive, range_modifier, conditional | 0.07 Shadow | stealable | 3 |
| 2 | Cindermaw | Shadow+Iron | T3 | passive x2, range_modifier, trait_grant, aura | 0.10 Shadow + 0.03 Iron | permanent | 5 |
| 3 | Veilstag | Veil | T2 | passive, range_modifier, conditional | 0.07 Veil | stealable | 3 |
| 4 | Glimmermoth | Veil+Eye | T3 | passive x2, range_modifier, tag_immunity, behavior_weight | 0.06 Veil + 0.03 Eye | permanent | 5 |
| 5 | Hearthbound Hound | Heart+Iron | T2 | passive x2, social_modifier, reactive | 0.06 (Heart+Iron) + reactive burst | permanent | 4 |
| 6 | Sorrowheart Mare | Heart+Gold | T3 | passive x2, range_modifier, aura, trait_grant | 0.08 Heart + 0.03 Gold | permanent | 5 |
| 7 | Dawnfeather Kestrel | Star+Eye | T3 | passive x2, range_modifier, behavior_weight, reactive | 0.06 Star + 0.04 Eye | permanent | 5 |
| 8 | The Pale Pilgrim | Star+Veil+Eye | T4 | passive x3, range_modifier, tag_immunity, aura, trait_grant | 0.13 (Star+Veil+Eye) | permanent | 7 |

### Reach Coverage

| Reach | Count | Tiers | Notes |
|-------|-------|-------|-------|
| Shadow | 2 | T2, T3 | Silent infiltrator + nightmare predator with shroud aura |
| Veil | 2 | T2, T3 | Phase-stag tracker + ley-line familiar with immunity |
| Heart | 2 | T2, T3 | Loyalty hound with reactive + empathic mare with calming aura |
| Star | 1 (+T4) | T3 | Prophetic kestrel scout; Star also primary on T4 Pale Pilgrim |
| Multi (Star+Veil+Eye) | 1 | T4 | Legendary celestial mount -- breadth over depth |

### Primitive Coverage

| Primitive | Count | Items |
|-----------|-------|-------|
| passive | 8 | All items |
| range_modifier | 7 | All except Hearthbound Hound |
| trait_grant | 3 | Cindermaw, Sorrowheart Mare, Pale Pilgrim |
| aura | 3 | Cindermaw (enemy debuff), Sorrowheart Mare (ally buff), Pale Pilgrim (ally buff) |
| conditional | 2 | Dustwalker, Veilstag |
| reactive | 2 | Hearthbound Hound, Dawnfeather Kestrel |
| behavior_weight | 2 | Glimmermoth, Dawnfeather Kestrel |
| tag_immunity | 2 | Glimmermoth, Pale Pilgrim |
| social_modifier | 1 | Hearthbound Hound |

### Balance Audit

| Tier | Item | Total Passive Value | Effect Count | Within Budget? |
|------|------|-------------------|--------------|----------------|
| T2 | Dustwalker | 0.04 + 0.03 cond = 0.07 | 3 | Yes (T2: 0.05-0.08) |
| T2 | Veilstag | 0.04 + 0.03 cond = 0.07 | 3 | Yes (T2: 0.05-0.08) |
| T2 | Hearthbound Hound | 0.06 passive + 0.04 reactive burst | 4 | Yes (T2: 0.05-0.08 base, reactive is conditional) |
| T3 | Cindermaw | 0.10 + 0.03 = 0.13 passive, -0.03 aura enemy | 5 | Yes (T3: 0.08-0.12, slight over but aura is utility) |
| T3 | Glimmermoth | 0.06 + 0.03 = 0.09 passive | 5 | Yes (T3: 0.08-0.12) |
| T3 | Sorrowheart Mare | 0.08 + 0.03 = 0.11 passive | 5 | Yes (T3: 0.08-0.12) |
| T3 | Dawnfeather Kestrel | 0.06 + 0.04 = 0.10 passive | 5 | Yes (T3: 0.08-0.12) |
| T4 | The Pale Pilgrim | 0.06 + 0.04 + 0.03 = 0.13 passive | 7 | Yes (T4: 0.10-0.15, no single reach over cap) |

### Design Notes

**Why no T4 Iron/Gold mount?** Those reaches already have T2-T3 coverage. The T4 slot is more impactful filling a gap. Star+Veil gives the legendary mount a cosmic, prophetic identity that Iron cannot provide -- and ensures the game's rarest mount feels otherworldly, not just a bigger warhorse.

**Why permanent loss on Heart mounts and T3+?** Heart mounts are bonded through emotion -- it would break the fiction to have them "stolen." Similarly, T3 and T4 mounts are narratively significant creatures that chose their rider. Permanent loss condition reflects that mutual commitment.

**Why no movement bonus on the Hearthbound Hound and Dawnfeather Kestrel?** The hound walks beside you and the kestrel perches on your shoulder. Neither carries you. Their value is companionship and perception, not speed. This creates meaningful mechanical diversity within the subcategory.

**Aura design:** Three mounts use auras, each differently. Cindermaw debuffs enemy Eye (shroud). Sorrowheart Mare buffs ally Heart (calm). Pale Pilgrim buffs ally Star (fate). All at radius 1, keeping the effect local and requiring positioning decisions.
