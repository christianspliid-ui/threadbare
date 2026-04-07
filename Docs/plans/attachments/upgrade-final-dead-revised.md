# Attachment Upgrade Pipeline: Final Dead Items
> Slug: upgrade-final-dead | Pass: revised | Mode: upgrade
> Items: 10 items (7 possessions + 3 conditions) | Date: 2026-04-07
> Editorial verdict: PASS WITH REVISIONS -- 2 mechanicalSummary fixes applied

**Reach remap note:** Item 8 (Plague-Touched) had legacy `domainContributions: { flesh: -0.10 }` and tag `#flesh`. `flesh` is not a valid `ReachDomain`. Remapped to `iron` (physical endurance/capability). Tag `#flesh` remapped to `#iron`.

**Cap exceedance note:** Item 10 (Revelation) has total passive reach of 0.25 absolute (0.15 Star + 0.10 Eye), exceeding EFFECT_PER_ITEM_CAP (0.15). Preserved as legacy values per spec.

---

## 1. Pilgrim's Robe

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

---

## 2. Vessen Shrine Map

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

---

## 3. Trade Route Dossier

```typescript
{
  id: 'reward_intelligence_trade_route_dossier',
  type: 'artifact',
  name: 'Trade Route Dossier',
  properties: {
    subcategory: 'intelligence',
    tier: 2,
    tags: ['#shadow', '#intelligence', '#trade', '#economic'],
    mechanicalSummary: '+0.03 Shadow, +0.02 Gold, +1 awareness range, +0.02 Gold in social encounters',
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

---

## 4. Faded Treasure Map

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

---

## 5. Cartographer's Survey

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

---

## 6. Tomb Raider's Journal

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

---

## 7. Ancient Waystone Rubbing

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

---

## 8. Plague-Touched

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
    mechanicalSummary: '-0.10 Iron (decays slowly, ~40 ticks to clear), -0.3 cooperation bias (contagion avoidance), when damaged: -0.03 Iron for 6 ticks',
    flavorText: 'A fever that never quite breaks. Others wisely keep their distance.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.10, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
      { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
      { type: 'reactive', trigger: 'damaged', effect: { type: 'duration', ticks: 6, reach: 'iron', value: -0.03, destroyOnExpiry: true }, cooldown: 12 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 9. Sun-Touched

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

---

## 10. Revelation

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

---

## Summary Table

| # | ID | Name | Tier | Effects | Cap Status | Editorial |
|---|-----|------|------|---------|------------|-----------|
| 1 | reward_vestments_pilgrim_robe | Pilgrim's Robe | T1 | passive + conditional | OK (0.05) | PASS |
| 2 | reward_intelligence_shrine_map | Vessen Shrine Map | T2 | passive + reveal + conditional | OK (~0.08) | PASS |
| 3 | reward_intelligence_trade_route_dossier | Trade Route Dossier | T2 | passive x2 + range_modifier + conditional | OK (~0.09) | mechanicalSummary revised |
| 4 | reward_tomes_scrolls_faded_treasure_map | Faded Treasure Map | T1 | passive + conditional | OK (0.05) | PASS |
| 5 | reward_tomes_scrolls_cartographers_survey | Cartographer's Survey | T2 | passive + reveal | OK (0.05+) | PASS |
| 6 | reward_tomes_scrolls_tomb_raiders_journal | Tomb Raider's Journal | T2 | passive x2 + conditional | OK (0.09) | PASS |
| 7 | reward_tomes_scrolls_ancient_waystone_rubbing | Ancient Waystone Rubbing | T3 | passive + reveal + conditional | OK (0.09+) | PASS |
| 8 | starter_plague_touched | Plague-Touched | T2 | decay + social_modifier + reactive | OK (~0.13) | mechanicalSummary revised |
| 9 | starter_sun_touched | Sun-Touched | T1 | decay + conditional | OK (0.13 peak) | PASS |
| 10 | starter_revelation | Revelation | T2 | passive x2 + axiological_drift + behavior_weight | **EXCEEDS CAP** (0.25, legacy) | PASS |
