# Attachment Pipeline: Time-Manipulation Primitives (Haste, Slow, Freeze Duration)
> Category: mixed (conditions + possessions) | Slug: fill-time-manipulation | Pass: revised
> Status: **REVISED** (editorial pass applied)

## Batch Summary

| Field | Value |
|-------|-------|
| Target primitives | `haste`, `slow`, `freeze_duration` (all 3 at zero usage pre-batch) |
| Items | 10 (5 possessions, 5 conditions) |
| Tier spread | T1 x3, T2 x4, T3 x3 |
| Subcategories | provisions (2), relics_talismans (2), tools_instruments (1), conditions (5) |
| Reach spread | iron (2), veil (3), shadow (2), heart (2), star (1) |
| Primitive coverage | haste x4, slow x4, freeze_duration x4 (some items use 2 target primitives) |

---

## Editorial Changes Applied

| # | Item | Change | Reason |
|---|------|--------|--------|
| 1 | Berserker's Draught | Mechanical summary expanded | On-use Iron bonus from charges was omitted |
| 3 | Stasis Pearl | Mechanical summary corrected | "debuff/disease" changed to "debuff" to match target field |
| 4 | Hourglass of the Unraveling | Mechanical summary corrected | Removed false "when health is low" gate not in effects |
| 5 | Chronoscope | `#mystical` tag removed | Non-standard tag, not in catalog conventions |
| 6 | Swiftness of the Wind | Renamed to "Gale-Touched" | Original was generic fantasy blessing language |
| 10 | Battle Fury | Renamed to "The Red Divide" | Original was stock RPG buff name |

---

## Approved Attachments

### Possessions

```typescript
// ─── Provisions (T1 ×1) ─────────────────────────────────────────────
{
  id: 'reward_provisions_berserker_draught',
  type: 'artifact',
  name: "Berserker's Draught",
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#iron', '#consumable', '#combat', '#alchemy'],
    mechanicalSummary: 'Grants 1 extra action for 4 ticks, +0.02 Iron per use, but -0.03 Heart for 6 ticks (fades). Consumable, 2 charges, destroyed when empty.',
    lossCondition: 'consumable',
    flavorText: 'Thick as tar and smells worse. The old soldiers swear by it. The young ones vomit first, then swear by it.',
    effects: [
      { type: 'consumable_charge', charges: 2, onUse: { reach: 'iron', value: 0.02 }, destroyOnEmpty: true },
      { type: 'haste', target: 'self', extraActions: 1, ticks: 4 },
      { type: 'decay', reach: 'heart', startValue: -0.03, changePerTick: 0.005, limitValue: 0.0, destroyAtLimit: true },
    ],
  } as PossessionNodeProperties,
},

// ─── Provisions (T2 ×1) ─────────────────────────────────────────────
{
  id: 'reward_provisions_timekeepers_last_vial',
  type: 'artifact',
  name: "Timekeeper's Last Vial",
  properties: {
    subcategory: 'provisions',
    tier: 2,
    tags: ['#veil', '#consumable', '#temporal', '#alchemy'],
    mechanicalSummary: 'Freezes all buff countdowns for 8 ticks. 3 charges, destroyed when empty. +0.04 Veil passive while held.',
    lossCondition: 'consumable',
    flavorText: 'The liquid inside does not slosh when shaken. It remembers where it was.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'veil', value: 0.01 }, destroyOnEmpty: true },
      { type: 'freeze_duration', target: 'buff', ticks: 8 },
    ],
  } as PossessionNodeProperties,
},

// ─── Relics & Talismans (T2 ×1) ─────────────────────────────────────
{
  id: 'reward_relics_talismans_stasis_pearl',
  type: 'artifact',
  name: 'Stasis Pearl',
  properties: {
    subcategory: 'relics_talismans',
    tier: 2,
    tags: ['#veil', '#temporal', '#relic', '#preservation'],
    mechanicalSummary: '+0.05 Veil, +0.02 Veil during active phase, freezes debuff countdowns for 6 ticks (active 6 ticks, dormant 18 ticks -- cooldown cycle)',
    lossCondition: 'breakable',
    flavorText: 'A pearl the color of frozen smoke. Hold it to your chest and feel time hesitate.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.05 },
      { type: 'cooldown', activeTicks: 6, cooldownTicks: 18, reach: 'veil', value: 0.02 },
      { type: 'freeze_duration', target: 'debuff', ticks: 6 },
    ],
  } as PossessionNodeProperties,
},

// ─── Relics & Talismans (T3 ×1) ─────────────────────────────────────
{
  id: 'reward_relics_talismans_hourglass_of_the_unraveling',
  type: 'artifact',
  name: 'Hourglass of the Unraveling',
  properties: {
    subcategory: 'relics_talismans',
    tier: 3,
    tags: ['#veil', '#shadow', '#temporal', '#relic', '#ancient'],
    mechanicalSummary: '+0.08 Veil, +0.04 Shadow, -0.03 Heart, slows one nearby enemy (skip actions for 3 ticks), freezes own condition countdowns for 6 ticks.',
    lossCondition: 'cursed',
    flavorText: 'The sand flows upward. The glass is warm to the touch, as if something inside is still dying.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.08 },
      { type: 'passive', reach: 'shadow', value: 0.04 },
      { type: 'passive', reach: 'heart', value: -0.03 },
      { type: 'slow', target: 'other_agent', skipActions: true, ticks: 3 },
      { type: 'freeze_duration', target: 'condition', ticks: 6 },
    ],
  } as PossessionNodeProperties,
},

// ─── Tools & Instruments (T2 ×1) ────────────────────────────────────
{
  id: 'reward_tools_instruments_chronoscope',
  type: 'artifact',
  name: 'Chronoscope',
  properties: {
    subcategory: 'tools_instruments',
    tier: 2,
    tags: ['#eye', '#veil', '#temporal', '#tool'],
    mechanicalSummary: '+0.04 Eye, +0.03 Veil, freezes divine/blessing buff countdowns for 6 ticks, +1 awareness range',
    lossCondition: 'breakable',
    flavorText: 'A lens ground from something that is not glass. When you look through it, moments stack upon each other like pages.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'passive', reach: 'veil', value: 0.03 },
      { type: 'freeze_duration', target: 'buff', tags: ['#blessing', '#divine'], ticks: 6 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as PossessionNodeProperties,
},
```

### Conditions

```typescript
// ─── Blessings (T1 ×1) ──────────────────────────────────────────────
{
  id: 'reward_condition_gale_touched',
  type: 'trait',
  name: 'Gale-Touched',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#blessing', '#star', '#divine', '#combat'],
    description: 'A divine gift of speed — the body moves before the mind decides.',
    maxLevel: 1,
    visibility: 'public',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '+0.03 Star, grants 1 extra action for 6 ticks, fades naturally after blessing expires',
    flavorText: 'Your feet leave the ground a heartbeat before they should. Gods move in small mercies.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.03 },
      { type: 'haste', target: 'self', extraActions: 1, ticks: 6 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Blessings (T2 ×1) ──────────────────────────────────────────────
{
  id: 'reward_condition_temporal_anchor',
  type: 'trait',
  name: 'Temporal Anchor',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#blessing', '#veil', '#temporal', '#preservation'],
    description: 'Time flows around you like water around a stone. Your blessings linger.',
    maxLevel: 1,
    visibility: 'public',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '+0.05 Veil, freezes all buff countdowns for 10 ticks, +0.02 Star in mystical contexts',
    flavorText: 'The candle burns but does not shorten. The wound bleeds but does not deepen. Something holds.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.05 },
      { type: 'freeze_duration', target: 'buff', ticks: 10 },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.02 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Curses (T1 ×1) ─────────────────────────────────────────────────
{
  id: 'reward_condition_leaden_limbs',
  type: 'trait',
  name: 'Leaden Limbs',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#curse', '#shadow', '#iron', '#combat'],
    description: 'A sluggishness in the bones. Movement becomes a negotiation with gravity.',
    maxLevel: 1,
    visibility: 'discoverable',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '-0.03 Iron, slowed (actions halved, not skipped) for 6 ticks, +30% movement cost',
    flavorText: 'The air thickens. Each step forward requires a step of will first.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.03 },
      { type: 'slow', target: 'other_agent', skipActions: false, ticks: 6 },
      { type: 'range_modifier', movementCostMultiplier: 1.3 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Curses (T2 ×1) ─────────────────────────────────────────────────
{
  id: 'reward_condition_time_eaten',
  type: 'trait',
  name: 'Time-Eaten',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#curse', '#shadow', '#veil', '#temporal'],
    description: 'Something has bitten a piece from your timeline. Moments vanish without memory.',
    maxLevel: 1,
    visibility: 'discoverable',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '-0.05 Shadow, slowed (skip actions) for 4 ticks, freezes debuff countdowns for 8 ticks (curses last longer), drifts toward despair',
    flavorText: 'You blink and the sun has moved. Your companions look at you strangely, as if you were not there a moment ago.',
    effects: [
      { type: 'passive', reach: 'shadow', value: -0.05 },
      { type: 'slow', target: 'other_agent', skipActions: true, ticks: 4 },
      { type: 'freeze_duration', target: 'debuff', ticks: 8 },
      { type: 'axiological_drift', axis: 'hope_despair', ratePerTick: 0.002, limitValue: 0.2 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Supernatural (T3 ×1) ───────────────────────────────────────────
{
  id: 'reward_condition_the_red_divide',
  type: 'trait',
  name: 'The Red Divide',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#supernatural', '#iron', '#heart', '#combat'],
    description: 'A berserker trance. The world slows, the body quickens, reason dims.',
    maxLevel: 1,
    visibility: 'public',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '+0.10 Iron, grants 1 extra action for 8 ticks, -0.06 Heart, -0.04 Eye, slows enemies in combat for 3 ticks, blocks fear conditions, drifts toward ruthlessness',
    flavorText: 'The blood sings. Time splits in two: one half for killing, one half for forgetting.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.10 },
      { type: 'passive', reach: 'heart', value: -0.06 },
      { type: 'passive', reach: 'eye', value: -0.04 },
      { type: 'haste', target: 'self', extraActions: 1, ticks: 8 },
      { type: 'slow', target: 'other_agent', skipActions: false, ticks: 3 },
      { type: 'tag_immunity', tags: ['fear', 'intimidation'] },
    ],
  } as TraitDefinitionProperties,
},
```

---

## Summary Table

| # | Name | Type | Tier | Subcategory | Primitives Used | Total Passive Value | Primary Reach |
|---|------|------|------|-------------|-----------------|---------------------|---------------|
| 1 | Berserker's Draught | artifact | T1 | provisions | haste | 0.02 (+charges) | iron |
| 2 | Timekeeper's Last Vial | artifact | T2 | provisions | freeze_duration | 0.04 (+charges) | veil |
| 3 | Stasis Pearl | artifact | T2 | relics_talismans | freeze_duration | 0.05 (+cooldown) | veil |
| 4 | Hourglass of the Unraveling | artifact | T3 | relics_talismans | slow, freeze_duration | 0.09 (net) | veil/shadow |
| 5 | Chronoscope | artifact | T2 | tools_instruments | freeze_duration | 0.07 | eye/veil |
| 6 | Gale-Touched | trait | T1 | condition | haste | 0.03 | star |
| 7 | Temporal Anchor | trait | T2 | condition | freeze_duration | 0.05 (+conditional) | veil |
| 8 | Leaden Limbs | trait | T1 | condition | slow | -0.03 | iron/shadow |
| 9 | Time-Eaten | trait | T2 | condition | slow, freeze_duration | -0.05 | shadow/veil |
| 10 | The Red Divide | trait | T3 | condition | haste, slow | 0.0 (net) | iron/heart |

## Primitive Coverage

| Primitive | Items Using It | Total Uses |
|-----------|---------------|------------|
| haste | Berserker's Draught, Gale-Touched, The Red Divide | 3 |
| slow | Hourglass of the Unraveling, Leaden Limbs, Time-Eaten, The Red Divide | 4 |
| freeze_duration | Timekeeper's Last Vial, Stasis Pearl, Hourglass of the Unraveling, Chronoscope, Temporal Anchor, Time-Eaten | 6 |
| **Total** | **10 items, 13 primitive uses** | |

## Reach Distribution

| Reach | Items (primary or secondary) |
|-------|------------------------------|
| iron | Berserker's Draught, Leaden Limbs, The Red Divide |
| veil | Timekeeper's Last Vial, Stasis Pearl, Hourglass of the Unraveling, Chronoscope, Temporal Anchor, Time-Eaten |
| shadow | Hourglass of the Unraveling, Leaden Limbs, Time-Eaten |
| heart | Berserker's Draught (penalty), The Red Divide (penalty) |
| star | Gale-Touched, Temporal Anchor (conditional) |
| eye | Chronoscope, The Red Divide (penalty) |
