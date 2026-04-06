# Attachment Upgrade Pipeline: Disease, Supernatural, Remaining Curse & Social Conditions
> Slug: upgrade-diseases-supernatural | Pass: revised | Mode: upgrade
> Items: 11 items | Date: 2026-04-06
> Editorial verdict: PASS WITH REVISIONS — 3 mechanicalSummary fixes applied

**Reach mapping note:** The original `domainContributions` on several items use `flesh` as a reach key. `flesh` is not a valid `ReachDomain` (valid: iron, gold, shadow, veil, heart, eye, stone, star). For this revised draft, `flesh` penalties on disease/wound items are mapped to `iron` (physical endurance degradation) or `heart` (vitality/social stigma) depending on the condition's primary expression. Tags are preserved unchanged per upgrade rules.

---

## 1. Road Fever

```typescript
{
  id: 'reward_condition_road_fever',
  type: 'trait',
  name: 'Road Fever',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#disease', '#flesh', '#wilderness'],
    description: 'A common illness from exposure and bad water.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.04 Iron, +20% movement cost, gains -0.01 Iron per encounter (max -0.03 extra)',
    flavorText: 'The shivers come and go. Sweat and chill, sweat and chill.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.04 },
      { type: 'range_modifier', movementCostMultiplier: 1.2 },
      { type: 'stacking', reach: 'iron', valuePerStack: -0.01, maxStacks: 3, stackOn: 'any_encounter', decayPerTick: 0.002 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 2. Gut Rot

```typescript
{
  id: 'reward_condition_gut_rot',
  type: 'trait',
  name: 'Gut Rot',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#disease', '#flesh', '#wilderness'],
    description: 'Contaminated food or water. Debilitating cramps and weakness.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.03 Iron (worsens by -0.001/tick to max -0.07 Iron), -0.02 Gold',
    flavorText: 'The stomach rebels against everything, including emptiness.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.03, changePerTick: -0.001, limitValue: -0.07, destroyAtLimit: false },
      { type: 'passive', reach: 'gold', value: -0.02 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 3. Greyscale

```typescript
{
  id: 'reward_condition_greyscale',
  type: 'trait',
  name: 'Greyscale',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#disease', '#flesh', '#stone'],
    description: 'Skin hardens and cracks. Mobility and appearance degrade.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.08 Iron, -0.04 Heart, others avoid cooperation (contagion fear), transforms into Spine Wound on doom threshold (15% chance)',
    flavorText: 'The skin turns grey and stiff at the edges. People step back when they see it.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.08 },
      { type: 'passive', reach: 'heart', value: -0.04 },
      { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
      { type: 'transform', trigger: 'doom_threshold', probability: 0.15, intoTemplate: 'reward_condition_spine_wound', narrativeTemplate: 'The greyscale has reached the spine. The numbness is total now.' },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 4. The Wasting

```typescript
{
  id: 'reward_condition_the_wasting',
  type: 'trait',
  name: 'The Wasting',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#disease', '#flesh', '#veil'],
    description: 'A supernatural consumption that devours vitality and thins the boundary to death.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.08 Iron (worsens by -0.001/tick to max -0.14), +0.05 Veil until rest, personality drifts toward fatalism',
    flavorText: 'The body withers but the eyes brighten. Something feeds on the difference.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.08, changePerTick: -0.001, limitValue: -0.14, destroyAtLimit: false },
      { type: 'until_event', event: 'rest', reach: 'veil', value: 0.05, destroyOnEvent: false },
      { type: 'axiological_drift', axis: 'hope_despair', ratePerTick: 0.003, limitValue: 0.4 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 5. Spine Wound

> Editorial fix: mechanicalSummary "avoids combat encounters" → "strongly suppresses iron encounters (0.2× desire weight)"

```typescript
{
  id: 'reward_condition_spine_wound',
  type: 'trait',
  name: 'Spine Wound',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#wound', '#physical', '#iron', '#flesh', '#combat'],
    description: 'Catastrophic injury to the back. Movement and combat severely impaired.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.12 Iron, -0.05 Heart, blocks Iron actions in combat, +50% movement cost, strongly suppresses iron encounters (0.2× desire weight)',
    flavorText: 'The body remembers what the spine cannot. Every step is borrowed time.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.12 },
      { type: 'passive', reach: 'heart', value: -0.05 },
      { type: 'action_gate', mode: 'block', reach: 'iron', condition: 'in_combat' },
      { type: 'range_modifier', movementCostMultiplier: 1.5 },
      { type: 'behavior_weight', reach: 'iron', multiplier: 0.2 },
    ],
  } as TraitDefinitionProperties,
}
```

**Cap flag preserved from draft:** -0.12 Iron + -0.05 Heart = -0.17 total reach. Flagged for systems audit.

---

## 6. Fey-Touched

> Editorial fix: mechanicalSummary "Veil bonus persists until combat (resets on violence)" → "Eye bonus active until combat begins (paused on event, not removed)"

```typescript
{
  id: 'reward_condition_fey_touched',
  type: 'trait',
  name: 'Fey-Touched',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#supernatural', '#veil', '#eye'],
    description: 'Brief exposure to the otherworld leaves lingering perception.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '+0.03 Veil, +0.03 Eye until combat begins (paused on event, not removed), +1 awareness range',
    flavorText: 'Colors seem too vivid. Time moves strangely at the edges of the day.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.03 },
      { type: 'until_event', event: 'enter_combat', reach: 'eye', value: 0.03, destroyOnEvent: false },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 7. Death-Marked

```typescript
{
  id: 'reward_condition_death_marked',
  type: 'trait',
  name: 'Death-Marked',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#supernatural', '#shadow', '#eye'],
    description: 'Survived something that should have killed. The shadow world notices.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '+0.06 Shadow, +0.04 Eye, -0.04 Heart, damage triggers +0.04 Shadow for 6 ticks (12-tick cooldown)',
    flavorText: 'Crows follow you. The dying look at you with recognition.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'passive', reach: 'heart', value: -0.04 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 6, reach: 'shadow', value: 0.04, destroyOnExpiry: true,
      }, cooldown: 12 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 8. Void-Scarred

```typescript
{
  id: 'reward_condition_void_scarred',
  type: 'trait',
  name: 'Void-Scarred',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#supernatural', '#star', '#shadow', '#veil'],
    description: 'Touched by the space between worlds. Reality sits uneasy around you.',
    maxLevel: 1,
    visibility: 'divine_only',
    mechanicalSummary: '+0.08 Star, +0.05 Shadow, -0.08 Heart, +0.04 Star in mystical contexts, reveals hidden encounters within 2 hexes',
    flavorText: 'The air shimmers where you stand. Small animals will not approach. Gods pay attention.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.08 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'passive', reach: 'heart', value: -0.08 },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.04 },
      { type: 'reveal', target: 'encounters', range: 2 },
    ],
  } as TraitDefinitionProperties,
}
```

**Cap flag preserved from draft:** +0.12 Star peak + 0.05 Shadow = 0.17 positive reach in mystical contexts. Flagged for systems audit.

---

## 9. Mark of Debt

> Editorial fix: mechanicalSummary "Gold penalty deepens on social encounters" → "Gold penalty deepens on social successes"

```typescript
{
  id: 'reward_condition_mark_of_debt',
  type: 'trait',
  name: 'Mark of Debt',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#curse', '#gold', '#veil'],
    description: 'A supernatural debt that drains material fortune.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.08 Gold, -0.03 Veil, drains quintessence (-1 per tick), Gold penalty deepens on social successes (max -0.03 extra)',
    flavorText: 'A scar on the palm in the shape of a coin. Wealth slips through your fingers like water.',
    effects: [
      { type: 'passive', reach: 'gold', value: -0.08 },
      { type: 'passive', reach: 'veil', value: -0.03 },
      { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: -1, mode: 'per_tick' },
      { type: 'stacking', reach: 'gold', valuePerStack: -0.01, maxStacks: 3, stackOn: 'social_success' },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 10. The Hollow

```typescript
{
  id: 'reward_condition_the_hollow',
  type: 'trait',
  name: 'The Hollow',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#curse', '#heart', '#shadow', '#veil'],
    description: 'Something essential has been taken. Joy, purpose, or identity — something is missing.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.12 Heart, +0.05 Shadow, personality erodes toward nihilism, avoids social encounters, -0.3 cooperation bias with all',
    flavorText: 'You feel nothing where feeling should be. Others sense the void and flinch.',
    effects: [
      { type: 'passive', reach: 'heart', value: -0.12 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: -0.004, limitValue: -0.5 },
      { type: 'behavior_weight', reach: 'heart', multiplier: 0.3 },
      { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## 11. Watch Scrutiny

```typescript
{
  id: 'reward_condition_watch_scrutiny',
  type: 'trait',
  name: 'Watch Scrutiny',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#checkpoint', '#curse', '#eye', '#shadow'],
    description: 'The checkpoint remembers your face. Inspections linger, questions multiply, and every small irregularity now feels one witness away from becoming a problem.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.04 Shadow, -0.03 Gold, -0.02 Heart, extra -0.02 Shadow when alone',
    flavorText: 'A name in the wrong ledger, a guard who squints too long, a merchant who suddenly decides not to meet your eye.',
    effects: [
      { type: 'passive', reach: 'shadow', value: -0.04 },
      { type: 'passive', reach: 'gold', value: -0.03 },
      { type: 'passive', reach: 'heart', value: -0.02 },
      { type: 'conditional', condition: 'alone', reach: 'shadow', value: -0.02 },
    ],
  } as TraitDefinitionProperties,
}
```

---

## Summary Table

| # | Name | Tier | Editorial Change | Cap Flag |
|---|------|------|-----------------|---------|
| 1 | Road Fever | T1 | None | No |
| 2 | Gut Rot | T1 | None | No |
| 3 | Greyscale | T2 | None | No |
| 4 | The Wasting | T3 | None | At cap (-0.14 Iron per reach) |
| 5 | Spine Wound | T3 | mechanicalSummary fix | Yes (-0.17 total) |
| 6 | Fey-Touched | T1 | mechanicalSummary fix | No |
| 7 | Death-Marked | T2 | None | No |
| 8 | Void-Scarred | T3 | None | Yes (+0.17 peak positive) |
| 9 | Mark of Debt | T2 | mechanicalSummary fix | No |
| 10 | The Hollow | T3 | None | No |
| 11 | Watch Scrutiny | T1 | None | No |
