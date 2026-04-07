# Attachment Pipeline: Final Dead Items
> Category: mixed (possessions + conditions) | Slug: upgrade-final-dead | Pass: draft
> Status: **DRAFT**

## Batch Overview

The last 10 items in the catalog that still use legacy `reachBonus` or `domainContributions` without composable `effects[]`. This batch eliminates all remaining mechanically-dead items.

| Group | Count | Items |
|-------|-------|-------|
| Vestments | 1 | Pilgrim's Robe |
| Intelligence | 2 | Vessen Shrine Map, Trade Route Dossier |
| Treasure Maps | 4 | Faded Treasure Map, Cartographer's Survey, Tomb Raider's Journal, Ancient Waystone Rubbing |
| Starter Conditions | 3 | Plague-Touched, Sun-Touched, Revelation |

### Design Approach

- **Pilgrim's Robe**: T1 vestment -- add conditional bonus for mystical encounters (pilgrim on a sacred path)
- **Intelligence items**: reveal effects are a perfect thematic fit -- intelligence literally reveals hidden information. Add conditional bonuses tied to the intelligence domain.
- **Treasure maps**: the existing Smuggler's Chart (already alive) sets the pattern -- passive + conditional in exploration. Higher-tier maps add reveal or range_modifier for awareness. All preserve `grantsTraitWhileHeld`, `grantedTraitLevel`, `consumeOnEvent`.
- **Starter conditions**: convert `domainContributions` to passive effects, then add decay (for the disease/blessing that should fade), reactive triggers (for contagion), social modifiers (for plague avoidance), behavior_weight and axiological_drift (for revelation).

### Reach remapping

- `flesh` is not a valid `ReachDomain`. Item 8 (Plague-Touched) has `domainContributions: { flesh: -0.10 }` and tag `#flesh`.
- **Remapped to `iron`**: physical endurance/health is the closest valid reach for disease debilitation. Iron represents physical capability, which is what plague diminishes. Tag `#flesh` remapped to `#iron`.

### Cap exceedance notes

- **Plague-Touched**: -0.10 Iron passive -- legacy value, preserved as-is. Below EFFECT_PER_ITEM_CAP (0.15) in absolute terms. Total with added effects: ~0.13 absolute. Within cap.
- **Sun-Touched**: +0.10 Star passive -- legacy value. Total with added effects: ~0.13 absolute. Within cap.
- **Revelation**: +0.15 Star, +0.10 Eye -- legacy values. Total passive reach: 0.25 absolute, **exceeds EFFECT_PER_ITEM_CAP (0.15)**. Preserved as legacy values per spec. This is a powerful T2 supernatural condition and the large values are intentional -- "forbidden knowledge burns."

---

## Upgraded Items

### Item 1: Pilgrim's Robe (vestments, T1)

**Design rationale**: A pilgrim's garb is threadbare and humble, but on sacred ground or in mystical encounters it carries weight -- the divine recognizes devotion. The conditional bonus for mystical encounters reflects this. Total: 0.03 passive + 0.02 conditional = 0.05 max, appropriate for T1.

```typescript
{
  id: 'reward_vestments_pilgrim_robe',
  type: 'artifact',
  name: "Pilgrim's Robe",
  properties: {
    subcategory: 'vestments',
    tier: 1,
    tags: ['#star', '#cloth', '#divine'],
    mechanicalSummary: '+0.03 Star, +0.02 Star in mystical encounters (pilgrim devotion)',
    lossCondition: 'breakable',
    flavorText: 'Threadbare and sun-bleached. It smells of incense and long roads.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.03 },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes**: Removed `reachBonus: { star: 0.03 }`. Added `effects[]` with passive (exact legacy value) + conditional. Updated `mechanicalSummary`.

---

### Item 2: Vessen Shrine Map (intelligence, T2)

**Design rationale**: Intelligence about a rival shrine's location is literally a reveal effect -- it exposes hidden information about enemy positions. The conditional bonus for exploration reflects using the map to navigate toward the shrine. Preserves all intelligence metadata fields.

```typescript
{
  id: 'reward_intelligence_shrine_map',
  type: 'artifact',
  name: 'Vessen Shrine Map',
  properties: {
    subcategory: 'intelligence',
    tier: 2,
    tags: ['#shadow', '#intelligence', '#shrine_location', '#rival_god'],
    mechanicalSummary: '+0.03 Shadow, reveals encounters within 2 hexes, +0.02 Shadow in exploration',
    lossCondition: 'permanent',
    flavorText:
      'Six pages of careful hand — route notes, guardian schedules, a margin sketch ' +
      'of the approach from the river side. Seventeen years of trade route intelligence ' +
      'compressed into a map fragment that changes the regional balance of power.',
    intelligenceType: 'shrine_location',
    targetRegion: 'vessen_uplands',
    detailLevel: 'full',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.03 },
      { type: 'reveal', target: 'encounters', range: 2 },
      { type: 'conditional', condition: 'in_exploration', reach: 'shadow', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes**: Removed `reachBonus: { shadow: 0.03 }`. Added `effects[]` with passive (exact legacy value) + reveal (thematic: intelligence reveals encounters) + conditional. Updated `mechanicalSummary`. All intelligence metadata fields preserved.

---

### Item 3: Trade Route Dossier (intelligence, T2)

**Design rationale**: A trade network dossier reveals economic information and improves commercial awareness. The range_modifier for awareness fits perfectly -- knowledge of trade routes expands how far you can see commercial opportunities. The conditional for social encounters reflects using trade knowledge in negotiations.

```typescript
{
  id: 'reward_intelligence_trade_route_dossier',
  type: 'artifact',
  name: 'Trade Route Dossier',
  properties: {
    subcategory: 'intelligence',
    tier: 2,
    tags: ['#shadow', '#intelligence', '#trade', '#economic'],
    mechanicalSummary: '+0.03 Shadow, +0.02 Gold, +1 awareness range, +0.02 Gold in social (trade leverage)',
    lossCondition: 'stealable',
    flavorText:
      'A broker\'s working file — commodity flows, caravan schedules, price spreads ' +
      'between settlements. The margins are annotated in a cipher that takes patience to read.',
    intelligenceType: 'trade_network',
    detailLevel: 'partial',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.03 },
      { type: 'passive', reach: 'gold', value: 0.02 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
      { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes**: Removed `reachBonus: { shadow: 0.03, gold: 0.02 }`. Added `effects[]` with 2 passives (exact legacy values) + range_modifier (trade route knowledge expands awareness) + conditional. Updated `mechanicalSummary`. All intelligence metadata fields preserved.

---

### Item 4: Faded Treasure Map (tomes_scrolls, T1)

**Design rationale**: Follows the Smuggler's Chart pattern (already alive) -- passive + conditional in exploration. The faded map is barely legible, so the exploration bonus is modest. T1 budget: 0.03 passive + 0.02 conditional = 0.05 max.

```typescript
{
  id: 'reward_tomes_scrolls_faded_treasure_map',
  type: 'artifact',
  name: 'Faded Treasure Map',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 1,
    tags: ['#eye', '#map', '#ruin_seeker', '#ancient'],
    mechanicalSummary: '+0.03 Eye, grants ruin_seeker, +0.02 Eye in exploration (consumed on discovery)',
    lossCondition: 'consumable',
    grantsTraitWhileHeld: 'ruin_seeker',
    grantedTraitLevel: 1,
    consumeOnEvent: 'hidden_site_discovered',
    flavorText: 'The parchment is brittle and the ink barely legible, but the landmarks are unmistakable.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes**: Removed `reachBonus: { eye: 0.03 }`. Added `effects[]` with passive (exact legacy value) + conditional. Updated `mechanicalSummary`. All special fields preserved.

---

### Item 5: Cartographer's Survey (tomes_scrolls, T2)

**Design rationale**: A professional survey is precise and detailed -- it doesn't just hint at locations, it reveals them. The reveal effect (encounters within 1 hex) represents the survey's superior cartographic detail. T2 budget: 0.05 passive + reveal = ~0.07 effective.

```typescript
{
  id: 'reward_tomes_scrolls_cartographers_survey',
  type: 'artifact',
  name: "Cartographer's Survey",
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 2,
    tags: ['#eye', '#map', '#ruin_seeker', '#ancient', '#professional'],
    mechanicalSummary: '+0.05 Eye, grants ruin_seeker L2, reveals encounters within 1 hex (consumed on discovery)',
    lossCondition: 'consumable',
    grantsTraitWhileHeld: 'ruin_seeker',
    grantedTraitLevel: 2,
    consumeOnEvent: 'hidden_site_discovered',
    flavorText: 'Meticulous measurements and triangulations. Someone spent months on this.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.05 },
      { type: 'reveal', target: 'encounters', range: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes**: Removed `reachBonus: { eye: 0.05 }`. Added `effects[]` with passive (exact legacy value) + reveal (professional cartography reveals encounters). Updated `mechanicalSummary`. All special fields preserved.

---

### Item 6: Tomb Raider's Journal (tomes_scrolls, T2)

**Design rationale**: The journal covers traps, burial customs, and hidden passages -- it's knowledge that shines in exploration. The conditional bonus for exploration is a strong fit. The dual-reach (eye + shadow) is preserved as two passives. T2 budget: 0.04 + 0.03 passive + 0.02 conditional = 0.09 max, slightly high for T2 but the journal has two reaches and is consumable.

```typescript
{
  id: 'reward_tomes_scrolls_tomb_raiders_journal',
  type: 'artifact',
  name: "Tomb Raider's Journal",
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 2,
    tags: ['#eye', '#shadow', '#map', '#ruin_seeker', '#ancient'],
    mechanicalSummary: '+0.04 Eye, +0.03 Shadow, grants ruin_seeker L2, +0.02 Eye in exploration (consumed on discovery)',
    lossCondition: 'consumable',
    grantsTraitWhileHeld: 'ruin_seeker',
    grantedTraitLevel: 2,
    consumeOnEvent: 'hidden_site_discovered',
    flavorText: 'Detailed notes on trap mechanisms, burial customs, and which walls sound hollow when tapped.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'passive', reach: 'shadow', value: 0.03 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes**: Removed `reachBonus: { eye: 0.04, shadow: 0.03 }`. Added `effects[]` with 2 passives (exact legacy values) + conditional. Updated `mechanicalSummary`. All special fields preserved.

---

### Item 7: Ancient Waystone Rubbing (tomes_scrolls, T3)

**Design rationale**: The elder waystone rubbing is the most powerful treasure map in the set. T3 calls for 2-3 effects. The reveal (hexes within 2) represents the waystone's ancient geographic knowledge -- it reveals the landscape itself. The conditional for exploration is the standard map pattern. T3 budget: 0.06 passive + reveal + 0.03 conditional = 0.09+ effective, well within T3 range.

```typescript
{
  id: 'reward_tomes_scrolls_ancient_waystone_rubbing',
  type: 'artifact',
  name: 'Ancient Waystone Rubbing',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 3,
    tags: ['#eye', '#map', '#ruin_seeker', '#ancient', '#elder'],
    mechanicalSummary: '+0.06 Eye, grants ruin_seeker L3, reveals hexes within 2, +0.03 Eye in exploration (consumed on discovery)',
    lossCondition: 'consumable',
    grantsTraitWhileHeld: 'ruin_seeker',
    grantedTraitLevel: 3,
    consumeOnEvent: 'hidden_site_discovered',
    flavorText: 'Charcoal on vellum, taken from a stone older than the kingdom. The symbols shift when you look away.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.06 },
      { type: 'reveal', target: 'hexes', range: 2 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes**: Removed `reachBonus: { eye: 0.06 }`. Added `effects[]` with passive (exact legacy value) + reveal (ancient cartographic knowledge reveals terrain) + conditional. Updated `mechanicalSummary`. All special fields preserved.

---

### Item 8: Plague-Touched (condition, T2)

**Design rationale**: Plague is a serious T2 disease condition. The legacy `flesh` reach is remapped to `iron` (physical capability). The passive penalty decays slowly -- the plague doesn't last forever, but it takes a long time to shake. The social_modifier reflects contagion fear -- people avoid the plague-touched. The reactive trigger on `damaged` (when wounded, the weakened body worsens) adds a stacking penalty that makes combat dangerous for the infected.

**Reach remap**: `flesh` -> `iron` (physical endurance). Tag `#flesh` -> `#iron`.

```typescript
{
  id: 'starter_plague_touched',
  type: 'trait',
  name: 'Plague-Touched',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#disease', '#iron', '#contagious'],
    description: 'The sickness spreads from contact, patient zero unknown.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.10 Iron (decays slowly, ~40 ticks to clear), others avoid cooperation, when damaged: -0.03 Iron for 6 ticks',
    flavorText: 'A fever that never quite breaks. Others wisely keep their distance.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.10, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
      { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
      { type: 'reactive', trigger: 'damaged', effect: { type: 'duration', ticks: 6, reach: 'iron', value: -0.03, destroyOnExpiry: true }, cooldown: 12 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes**: Removed `domainContributions: { flesh: -0.10 }`. Remapped `#flesh` -> `#iron` in tags. Added `effects[]` with decay (preserves -0.10 legacy value as starting point, heals over ~40 ticks) + social_modifier (contagion avoidance) + reactive (wounded body weakens further). Added `mechanicalSummary`.

---

### Item 9: Sun-Touched (condition, T1)

**Design rationale**: A divine blessing that fades over time -- the warmth of a god's gaze is transient, not permanent. The decay effect preserves the legacy +0.10 Star value as a starting point that gradually fades. The conditional for mystical encounters reflects the blessing shining brightest in sacred contexts. Total starts at 0.10 + 0.03 = 0.13, which is within T1's actual budget since it decays toward 0.03 conditional-only.

```typescript
{
  id: 'starter_sun_touched',
  type: 'trait',
  name: 'Sun-Touched',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#blessing', '#star', '#divine'],
    description: "The warmth of a god's gaze lingers on the skin.",
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '+0.10 Star (fades slowly, ~40 ticks), +0.03 Star in mystical encounters',
    flavorText: 'Golden light seems to follow you, however briefly.',
    effects: [
      { type: 'decay', reach: 'star', startValue: 0.10, changePerTick: -0.0025, limitValue: 0, destroyAtLimit: true },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes**: Removed `domainContributions: { star: 0.10 }`. Added `effects[]` with decay (preserves +0.10 legacy value, fades over ~40 ticks -- the blessing is temporary) + conditional (divine resonance in mystical contexts). Added `mechanicalSummary`.

---

### Item 10: Revelation (condition, T2)

**Design rationale**: Revelation is the most mechanically dense condition in the starter set. "Forbidden knowledge burns behind the eyes, impossible to unlearn" and "the mind is expanded, the heart is diminished" are deeply evocative -- the effects should match. The large legacy passives are preserved (0.15 Star, 0.10 Eye) per spec. The axiological_drift toward ruthlessness reflects how forbidden knowledge erodes empathy. The behavior_weight amplifies eye-domain curiosity -- the revealed mind craves more knowledge.

**Cap exceedance**: Total passive reach = 0.25 absolute (0.15 Star + 0.10 Eye). Exceeds EFFECT_PER_ITEM_CAP (0.15). **Preserved as legacy values per spec.** This is a powerful T2 supernatural condition.

```typescript
{
  id: 'starter_revelation',
  type: 'trait',
  name: 'Revelation',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#magical', '#star', '#knowledge'],
    description: 'Forbidden knowledge burns behind the eyes, impossible to unlearn.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '+0.15 Star, +0.10 Eye [EXCEEDS CAP: legacy values preserved], drifts toward ruthlessness, 1.5x desire for Eye encounters (knowledge craving)',
    flavorText: 'The mind is expanded, the heart is diminished.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.15 },
      { type: 'passive', reach: 'eye', value: 0.10 },
      { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.002, limitValue: 0.3 },
      { type: 'behavior_weight', reach: 'eye', multiplier: 1.5 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes**: Removed `domainContributions: { star: 0.15, eye: 0.10 }`. Added `effects[]` with 2 passives (exact legacy values, cap exceedance flagged) + axiological_drift (knowledge erodes mercy -- "the heart is diminished") + behavior_weight (revealed mind craves Eye-domain encounters). Added `mechanicalSummary`.

---

## Summary Table

| # | ID | Name | Tier | Source | Effects | Primitives Used | Cap Status |
|---|-----|------|------|--------|---------|----------------|------------|
| 1 | reward_vestments_pilgrim_robe | Pilgrim's Robe | T1 | reward catalog | passive + conditional | passive, conditional | OK (0.05 max) |
| 2 | reward_intelligence_shrine_map | Vessen Shrine Map | T2 | reward catalog | passive + reveal + conditional | passive, reveal, conditional | OK (~0.08) |
| 3 | reward_intelligence_trade_route_dossier | Trade Route Dossier | T2 | reward catalog | passive x2 + range_modifier + conditional | passive, range_modifier, conditional | OK (~0.09) |
| 4 | reward_tomes_scrolls_faded_treasure_map | Faded Treasure Map | T1 | reward catalog | passive + conditional | passive, conditional | OK (0.05 max) |
| 5 | reward_tomes_scrolls_cartographers_survey | Cartographer's Survey | T2 | reward catalog | passive + reveal | passive, reveal | OK (0.05 + reveal) |
| 6 | reward_tomes_scrolls_tomb_raiders_journal | Tomb Raider's Journal | T2 | reward catalog | passive x2 + conditional | passive, conditional | OK (0.09 max) |
| 7 | reward_tomes_scrolls_ancient_waystone_rubbing | Ancient Waystone Rubbing | T3 | reward catalog | passive + reveal + conditional | passive, reveal, conditional | OK (0.09 + reveal) |
| 8 | starter_plague_touched | Plague-Touched | T2 | starter-attachments | decay + social_modifier + reactive | decay, social_modifier, reactive | OK (~0.13 absolute) |
| 9 | starter_sun_touched | Sun-Touched | T1 | starter-attachments | decay + conditional | decay, conditional | OK (0.13 peak, decays) |
| 10 | starter_revelation | Revelation | T2 | starter-attachments | passive x2 + axiological_drift + behavior_weight | passive, axiological_drift, behavior_weight | **EXCEEDS CAP** (0.25 abs, legacy preserved) |

### Primitive Coverage

| Primitive | Items Using It |
|-----------|---------------|
| passive | 1, 2, 3, 4, 6, 10 |
| conditional | 1, 2, 3, 4, 6, 7, 9 |
| reveal | 2, 5, 7 |
| range_modifier | 3 |
| decay | 8, 9 |
| social_modifier | 8 |
| reactive | 8 |
| axiological_drift | 10 |
| behavior_weight | 10 |

**9 distinct primitives** used across 10 items. Strong coverage of the target primitives from the batch spec: reveal (3 items), conditional (7 items), range_modifier (1), decay (2), social_modifier (1), reactive (1), behavior_weight (1), axiological_drift (1).

### Identity Preservation Checklist

| Field | Preserved? |
|-------|-----------|
| id | All 10 unchanged |
| name | All 10 unchanged |
| type | All 10 unchanged |
| tier | All 10 unchanged |
| tags | 9 unchanged, 1 remapped (#flesh -> #iron on Plague-Touched) |
| subcategory | All 10 unchanged |
| lossCondition | All 7 possessions unchanged |
| flavorText | All 10 unchanged |
| grantsTraitWhileHeld | All 4 treasure maps preserved |
| grantedTraitLevel | All 4 treasure maps preserved |
| consumeOnEvent | All 4 treasure maps preserved |
| intelligenceType | Both intelligence items preserved |
| targetRegion | Vessen Shrine Map preserved |
| detailLevel | Both intelligence items preserved |
| description | All 3 conditions preserved |
| maxLevel | All 3 conditions preserved |
| visibility | All 3 conditions preserved |

### Fields Removed

| Field | Items | Reason |
|-------|-------|--------|
| reachBonus | Items 1-7 | Replaced by passive effects with exact same values |
| domainContributions | Items 8-10 | Replaced by passive/decay effects with exact same values |

### Fields Added

| Field | Items | Value |
|-------|-------|-------|
| effects | All 10 | Composable effect arrays |
| mechanicalSummary | Items 8-10 | Conditions lacked this field; now added |
| mechanicalSummary (updated) | Items 1-7 | Updated to reflect new effects |
