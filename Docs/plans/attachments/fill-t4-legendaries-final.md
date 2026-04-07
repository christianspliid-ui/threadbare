# Fill T4 Legendaries: Tools & Provisions — Final

**Batch:** `fill-t4-legendaries`
**Date:** 2026-04-07
**Pass:** Systems audit corrections applied.

**Status: READY FOR IMPLEMENTATION**

One correction applied from systems audit (Issue 1 — The Anvilbone `create_structure` subtype placement). All other effects unchanged from the revised pass.

---

## Items

### Tool 1: The Trembling Needle

A compass needle carved from a splinter of the world's first boundary stone. It does not point north. It points toward what is hidden.

**Archetype:** The world-reader. Reveals the map's secrets and reshapes how the wielder perceives terrain. An exploration/divination tool that makes the bearer the most informed agent on the board.

```typescript
{
  id: 'reward_tools_instruments_the_trembling_needle',
  type: 'artifact',
  name: 'The Trembling Needle',
  properties: {
    subcategory: 'tools_instruments',
    tier: 4,
    tags: ['#eye', '#veil', '#tool', '#divination', '#ancient', '#exploration'],
    mechanicalSummary: '+0.08 Eye, +0.05 Veil, reveals all encounters within 3 hexes, +0.03 Eye in exploration, modifies awareness range +2 (permanent, self only)',
    lossCondition: 'permanent',
    flavorText: 'It trembles when you face a direction no one has walked. Carved from the world\'s first boundary stone. It has never pointed north.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.08 },
      { type: 'passive', reach: 'veil', value: 0.05 },
      { type: 'reveal', target: 'encounters', range: 3 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.03 },
      { type: 'modify_rules', scope: { scope: 'self' }, rule: 'awareness_range_bonus', value: 2, ticks: 'permanent' },
    ],
  } as PossessionNodeProperties,
}
```

**Passive total:** 0.08 + 0.05 + 0.03 (conditional) = 0.11 Eye (0.08 base + 0.03 in exploration), 0.05 Veil
**Effect count:** 5 / 6

**Implementer note:** The `modify_rules` effect with `awareness_range_bonus` creates an `ActiveRuleOverride` on GameState. Verify the awareness range calculation reads `RuleOverrideKey` entries. If the system exclusively reads `RangeModifierEffect`, swap effect 5 for `{ type: 'range_modifier', awarenessRangeBonus: 2 }`.

---

### Tool 2: The Anvilbone

A hammer-and-tongs set fused from the ribcage of a dead god. Where it strikes, foundations rise. It does not repair — it creates.

**Archetype:** The world-shaper. A crafting instrument that literally builds new structures into the world graph. The mason-god's right hand.

```typescript
{
  id: 'reward_tools_instruments_the_anvilbone',
  type: 'artifact',
  name: 'The Anvilbone',
  properties: {
    subcategory: 'tools_instruments',
    tier: 4,
    tags: ['#stone', '#star', '#tool', '#craft', '#ancient', '#divine', '#creation'],
    mechanicalSummary: '+0.10 Stone, +0.04 Star, +0.03 Stone at home territory, creates a shrine on the wielder\'s hex (permanent), drifts toward ambition',
    lossCondition: 'permanent',
    flavorText: 'The bones hum when they touch raw stone. Where you set them down, the ground remembers how to hold weight. Cities begin where you rest.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.10 },
      { type: 'passive', reach: 'star', value: 0.04 },
      { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.03 },
      { type: 'create_structure', what: 'landmark', subtype: 'shrine', onHex: 'self', permanent: true, properties: { name: 'Anvilbone Foundation' } },
      { type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: 0.005, limitValue: 0.40 },
    ],
  } as PossessionNodeProperties,
}
```

**Passive total:** 0.10 + 0.04 + 0.03 (conditional) = 0.13 Stone (0.10 base + 0.03 at home), 0.04 Star
**Effect count:** 5 / 6

**Correction from systems audit:** `subtype: 'shrine'` moved from inside `properties` dict to top-level field on `create_structure`. `properties` now contains only `{ name: 'Anvilbone Foundation' }`. Engine reads `CreateStructureEffect.subtype` at the top level.

---

### Provision 1: The Quiet Cup

A cup that never empties. The liquid inside is not water, not wine — it is whatever the drinker most needs. Those who drink from it heal, but they also forget what pain felt like, and that forgetting makes them gentle.

**Archetype:** The divine sustainer. An immortal provision that heals, restores essence, and radiates calm — but slowly erodes the bearer's capacity for violence.

```typescript
{
  id: 'reward_provisions_the_quiet_cup',
  type: 'artifact',
  name: 'The Quiet Cup',
  properties: {
    subcategory: 'provisions',
    tier: 4,
    tags: ['#star', '#heart', '#provision', '#divine', '#ancient', '#healing', '#celestial'],
    mechanicalSummary: '+0.08 Star, +0.06 Heart, restores 1 essence per tick (requires Star > 0.10), 1-hex aura: +0.02 Heart to allies, blocks Iron actions (too peaceful to fight)',
    lossCondition: 'permanent',
    flavorText: 'The cup is always full. It tastes like the first meal you remember, like the last drink before sleep. Those who share it speak more softly afterward.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.08 },
      { type: 'passive', reach: 'heart', value: 0.06 },
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'per_tick', condition: 'reach_above:star:0.10' },
      { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
      { type: 'action_gate', mode: 'block', reach: 'iron' },
    ],
  } as PossessionNodeProperties,
}
```

**Passive total:** 0.08 Star + 0.06 Heart = 0.14 base
**Effect count:** 5 / 6

---

### Provision 2: The Last Harvest

Grain that grew in soil watered by the blood of the earth. It does not rot. Eating it makes you harder — bones denser, sinew tighter, skin like bark. But you stop feeling the cold, and then you stop feeling anything at all.

**Archetype:** The immortal ration. Iron/stone sustenance that makes the bearer physically indestructible but emotionally numb. The soldier's final meal.

```typescript
{
  id: 'reward_provisions_the_last_harvest',
  type: 'artifact',
  name: 'The Last Harvest',
  properties: {
    subcategory: 'provisions',
    tier: 4,
    tags: ['#iron', '#stone', '#provision', '#ancient', '#cursed', '#survival', '#fortification'],
    mechanicalSummary: '+0.07 Iron, +0.06 Stone, blocks poison/disease/blight conditions, -0.04 Heart (numbing), modifies death_prevented rule (cannot die while held)',
    lossCondition: 'cursed',
    flavorText: 'The grain is pale and heavy as lead. It tastes of nothing. After the third handful you stop noticing hunger, and after the tenth you stop noticing most things.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.07 },
      { type: 'passive', reach: 'stone', value: 0.06 },
      { type: 'tag_immunity', tags: ['poison', 'disease', 'blight'] },
      { type: 'passive', reach: 'heart', value: -0.04 },
      { type: 'modify_rules', scope: { scope: 'self' }, rule: 'death_prevented', value: true, ticks: 'permanent' },
    ],
  } as PossessionNodeProperties,
}
```

**Passive total:** 0.07 Iron + 0.06 Stone - 0.04 Heart = 0.09 net (0.13 gross positive)
**Effect count:** 5 / 6

---

### Provision 3: The Black Mead

Fermented from honey gathered by insects that nest in the cracks between worlds. One draught and the drinker sees the architecture of fate. Two draughts and fate sees them back.

**Archetype:** The cursed elixir. A veil/shadow provision that grants enormous mystical power and sight, but actively corrupts the bearer's moral framework and draws hostile attention.

```typescript
{
  id: 'reward_provisions_the_black_mead',
  type: 'artifact',
  name: 'The Black Mead',
  properties: {
    subcategory: 'provisions',
    tier: 4,
    tags: ['#veil', '#shadow', '#provision', '#cursed', '#arcane', '#ancient', '#prophecy'],
    mechanicalSummary: '+0.09 Veil, +0.05 Shadow, reveals all encounters (unlimited range), +0.04 Veil / -0.02 Star tradeoff (clarity at the cost of faith), drifts toward ruthlessness',
    lossCondition: 'cursed',
    flavorText: 'The mead is black and tastes of smoke and thyme. After the first draught the world looks thin — you can see the seams where it was stitched together. You pull at them.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.09 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'reveal', target: 'encounters', range: 'all' },
      { type: 'tradeoff', bonus: { reach: 'veil', value: 0.04 }, penalty: { reach: 'star', value: 0.02 } },
      { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.006, limitValue: 0.45 },
    ],
  } as PossessionNodeProperties,
}
```

**Passive total:** 0.09 Veil + 0.04 tradeoff bonus - 0.02 tradeoff penalty + 0.05 Shadow = 0.13 Veil, 0.05 Shadow, -0.02 Star
**Effect count:** 5 / 6

---

## Summary Table

| Item | Subcategory | Tier | Reaches | Passive Total | Effects | Loss | Key Primitive | Audit |
|------|-------------|------|---------|---------------|---------|------|---------------|-------|
| The Trembling Needle | tools_instruments | 4 | Eye, Veil | 0.08 Eye / 0.05 Veil (0.11 Eye in exploration) | 5 | permanent | modify_rules, reveal | PASS |
| The Anvilbone | tools_instruments | 4 | Stone, Star | 0.10 Stone / 0.04 Star (0.13 Stone at home) | 5 | permanent | create_structure, axiological_drift | PASS (1 fix applied) |
| The Quiet Cup | provisions | 4 | Star, Heart | 0.14 base | 5 | permanent | aura, action_gate, resource_manipulate | PASS |
| The Last Harvest | provisions | 4 | Iron, Stone | 0.09 net (0.13 gross) | 5 | cursed | modify_rules, tag_immunity | PASS |
| The Black Mead | provisions | 4 | Veil, Shadow | 0.14 net (0.16 gross) | 5 | cursed | tradeoff, axiological_drift, reveal | PASS |

---

## Corrections Applied (from systems audit)

| Item | Field | Revised → Final | Reason |
|------|-------|-----------------|--------|
| The Anvilbone | `create_structure` effect | `subtype` moved from `properties` dict to top-level field | Engine reads `CreateStructureEffect.subtype` at top level, not from `properties` bag |

## Implementer Notes

1. **Awareness range integration point (The Trembling Needle):** Confirm whether the awareness range calculation reads `ActiveRuleOverride` entries (from `modify_rules`) or only `RangeModifierEffect` (query-layer). If query-layer only, swap effect 5 to `{ type: 'range_modifier', awarenessRangeBonus: 2 }`.

2. **Essence restoration rate (The Quiet Cup):** `amount: 1, mode: 'per_tick'` is 12 essence/day when the Star gate is met. Strong for T4, appropriate for permanent legendary with a condition gate. First value to tune if T4 balance needs adjustment.

3. **create_structure trigger timing (The Anvilbone):** Clarify when a permanent `create_structure` fires — on acquisition, or on each tick? If it fires repeatedly, a `permanent: true` guard must deduplicate. If it fires once on acquisition, this is correct as-is.
