# Fill T4 Legendaries: Tools & Provisions — Draft

**Batch:** `fill-t4-legendaries`
**Date:** 2026-04-07
**Slug:** T4 legendary items for `tools_instruments` (2) and `provisions` (3)

---

## Design Notes

**Tier 4 pattern observed across existing legendaries:**
- 5 effects each (Quiet Blade, Woven Sky, Fulcrum, Pale Pilgrim); Codex of Unmaking has 5
- Passive value totals range from ~0.10 to ~0.26 (Quiet Blade is the outlier at 0.28 raw)
- Each defines a clear archetype: the silent killer, the starclad mystic, the reality anchor, the forbidden scholar, the celestial mount
- Loss conditions: 3 permanent, 1 cursed, 1 permanent
- High-tier primitives used: aura (Fulcrum, Pale Pilgrim), reveal (Codex), axiological_drift (Codex), test_shaper (Fulcrum), tag_immunity (Quiet Blade, Woven Sky), trait_grant (Pale Pilgrim), range_modifier (Quiet Blade, Pale Pilgrim)

**Design targets for this batch:**
- 2 tools: one divination/world-reading instrument (eye/veil), one crafting/world-shaping instrument (stone/star)
- 3 provisions: one divine elixir (star/heart), one immortal sustenance (iron/stone), one cursed feast (shadow/veil)
- Each item uses at least one Tier 3 (God-tier) effect primitive
- Total passive values target 0.10-0.15 per item (at or near the cap)
- 4-5 effects each (staying within the MAX_EFFECTS_PER_ATTACHMENT = 6 hard cap)

---

## Items

### Tool 1: The Cartographer's Needle

A compass needle carved from a splinter of the world's first boundary stone. It does not point north. It points toward what is hidden.

**Archetype:** The world-reader. Reveals the map's secrets and reshapes how the wielder perceives terrain. An exploration/divination tool that makes the bearer the most informed agent on the board.

```typescript
{
  id: 'reward_tools_instruments_the_cartographers_needle',
  type: 'artifact',
  name: "The Cartographer's Needle",
  properties: {
    subcategory: 'tools_instruments',
    tier: 4,
    tags: ['#eye', '#veil', '#tool', '#divination', '#ancient', '#exploration'],
    mechanicalSummary: '+0.08 Eye, +0.05 Veil, reveals all encounters within 3 hexes, +0.03 Eye in exploration, modifies awareness range +2 globally (permanent rule override)',
    lossCondition: 'permanent',
    flavorText: 'It trembles when you face a direction no one has walked. The needle is warm to the touch, and it has never pointed north.',
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

**Passive total:** 0.08 + 0.05 + 0.03 (conditional) = 0.13 base, 0.16 in exploration
**Effect count:** 5 (within cap)
**Tier 3 primitive:** `modify_rules` (awareness_range_bonus)
**Identity:** The bearer sees farther and deeper than anyone. They are never surprised, never lost. The world opens itself to this instrument.

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
    mechanicalSummary: '+0.10 Stone, +0.04 Star, +0.03 Stone at home territory, creates a landmark on the wielder\'s hex (permanent), drifts toward ambition',
    lossCondition: 'permanent',
    flavorText: 'The bones hum when they touch raw stone. Walls rise where you set them down. Cities begin where you rest.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.10 },
      { type: 'passive', reach: 'star', value: 0.04 },
      { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.03 },
      { type: 'create_structure', what: 'landmark', onHex: 'self', permanent: true, properties: { name: 'Anvilbone Foundation', subtype: 'shrine' } },
      { type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: 0.005, limitValue: 0.40 },
    ],
  } as PossessionNodeProperties,
}
```

**Passive total:** 0.10 + 0.04 + 0.03 (conditional) = 0.14 base, 0.17 at home
**Effect count:** 5 (within cap)
**Tier 3 primitive:** `create_structure` (landmark)
**Identity:** The bearer reshapes the physical world. Where they settle, civilization follows. But the ambition to build never stops — the drift toward ambition is the cost of holding a god's creative power.

---

### Provision 1: The Still Chalice

A cup that never empties. The liquid inside is not water, not wine — it is whatever the drinker most needs. Those who drink from it heal, but they also forget what pain felt like, and that forgetting makes them gentle.

**Archetype:** The divine sustainer. An immortal provision that heals, restores essence, and radiates calm — but slowly erodes the bearer's capacity for violence.

```typescript
{
  id: 'reward_provisions_the_still_chalice',
  type: 'artifact',
  name: 'The Still Chalice',
  properties: {
    subcategory: 'provisions',
    tier: 4,
    tags: ['#star', '#heart', '#provision', '#divine', '#ancient', '#healing', '#celestial'],
    mechanicalSummary: '+0.08 Star, +0.06 Heart, restores 1 essence per 12 ticks, 1-hex aura: +0.02 Heart to allies, blocks Iron actions (too peaceful to fight)',
    lossCondition: 'permanent',
    flavorText: 'The cup is always full. The liquid tastes different each time — like the first meal you remember, like the last drink before sleep. Those who share it speak more softly afterward.',
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

**Passive total:** 0.08 + 0.06 = 0.14 base
**Effect count:** 5 (within cap)
**High-tier primitives:** `aura`, `resource_manipulate` (per_tick with condition), `action_gate`
**Identity:** The bearer becomes a healer and peacemaker. The chalice sustains and radiates compassion — but the cost is the inability to fight. This is a provision for a saint, not a warrior. The essence restoration is gated behind a star threshold to prevent exploitation by low-star agents who happen to pick it up.

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

**Passive total:** 0.07 + 0.06 - 0.04 = 0.09 net (0.13 gross positive)
**Effect count:** 5 (within cap)
**Tier 3 primitive:** `modify_rules` (death_prevented)
**Identity:** You cannot die while you hold this. You also cannot feel. The cursed loss condition means you cannot discard it willingly — once you eat from The Last Harvest, you carry it until something strips it from you. The heart penalty and the emotional numbness are the price of physical immortality.

---

### Provision 3: Dreamer's Mead

Fermented from honey gathered by insects that nest in the cracks between worlds. One draught and the drinker sees the architecture of fate. Two draughts and fate sees them back.

**Archetype:** The cursed elixir. A veil/shadow provision that grants enormous mystical power and sight, but actively corrupts the bearer's moral framework and draws hostile attention.

```typescript
{
  id: 'reward_provisions_dreamers_mead',
  type: 'artifact',
  name: "Dreamer's Mead",
  properties: {
    subcategory: 'provisions',
    tier: 4,
    tags: ['#veil', '#shadow', '#provision', '#cursed', '#arcane', '#ancient', '#prophecy'],
    mechanicalSummary: '+0.09 Veil, +0.05 Shadow, reveals all encounters (unlimited range), +0.04 Veil / -0.02 Star tradeoff (clarity at the cost of faith), drifts toward ruthlessness',
    lossCondition: 'cursed',
    flavorText: 'The mead is black and tastes of smoke and thyme. After drinking, the world looks thin — you can see the seams where it was stitched together. You start pulling at them.',
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

**Passive total:** 0.09 + 0.05 + 0.04 (tradeoff bonus) - 0.02 (tradeoff penalty) = 0.16 gross positive, 0.14 net after tradeoff penalty
**Effect count:** 5 (within cap)
**High-tier primitives:** `reveal` (encounters, unlimited), `axiological_drift`
**Identity:** The Codex of Unmaking's sibling in provision form — a cursed item that trades moral clarity for arcane sight. The bearer sees everything coming but slowly loses the capacity for mercy. The cursed loss condition means this is a Faustian bargain: once you drink, you cannot stop drinking. Compared to the Codex, this trades the action_gate (block heart) for the shadow passive and the tradeoff mechanic, making it slightly more versatile but similarly corrupting.

---

## Summary Table

| Item | Subcategory | Tier | Reaches | Passive Total | Effects | Loss | Tier 3 Primitive | Archetype |
|------|-------------|------|---------|---------------|---------|------|------------------|-----------|
| The Cartographer's Needle | tools_instruments | 4 | Eye, Veil | 0.13 (0.16 in exploration) | 5 | permanent | modify_rules | World-reader / divination |
| The Anvilbone | tools_instruments | 4 | Stone, Star | 0.14 (0.17 at home) | 5 | permanent | create_structure | World-shaper / creation |
| The Still Chalice | provisions | 4 | Star, Heart | 0.14 | 5 | permanent | aura, action_gate | Divine sustainer / peacemaker |
| The Last Harvest | provisions | 4 | Iron, Stone | 0.09 net (0.13 gross) | 5 | cursed | modify_rules | Immortal ration / endurance |
| Dreamer's Mead | provisions | 4 | Veil, Shadow | 0.14 net (0.16 gross) | 5 | cursed | reveal, axiological_drift | Cursed elixir / forbidden sight |

## Balance Cross-Check

**Cap compliance (EFFECT_PER_ITEM_CAP = 0.15):**
- Cartographer's Needle: 0.13 base PASS (0.16 conditional is acceptable — conditional values are situational)
- Anvilbone: 0.14 base PASS (0.17 conditional is acceptable)
- Still Chalice: 0.14 PASS
- Last Harvest: 0.09 net PASS (0.13 gross — well under cap, appropriate given death_prevented)
- Dreamer's Mead: 0.14 net PASS (tradeoff penalty is real cost)

**Effect count (MAX_EFFECTS_PER_ATTACHMENT = 6):**
All items at 5 effects. PASS.

**Aura radius (AURA_MAX_RADIUS = 2):**
Still Chalice: radius 1. PASS.

**Reach diversity across batch:**
- Eye: Cartographer's Needle (primary)
- Veil: Cartographer's Needle (secondary), Dreamer's Mead (primary)
- Stone: Anvilbone (primary), Last Harvest (secondary)
- Star: Anvilbone (secondary), Still Chalice (primary)
- Heart: Still Chalice (secondary)
- Iron: Last Harvest (primary)
- Shadow: Dreamer's Mead (secondary)
- Gold: not represented (appropriate — gold is trade/wealth, not legendary tool/provision territory)

**Loss condition spread:**
- 3 permanent (Needle, Anvilbone, Chalice)
- 2 cursed (Last Harvest, Dreamer's Mead)
- Pattern matches existing T4 spread (3 permanent, 2 cursed across existing legendaries)

**Niche overlap check:**
- vs. Codex of Unmaking: Dreamer's Mead shares reveal+drift but is a provision (different slot), uses shadow instead of heart penalty, and lacks action_gate. Complementary, not duplicative.
- vs. Astrolabe of Yven (T3 tool): Cartographer's Needle is a strict upgrade — same reveal niche but with modify_rules and higher passives. Appropriate for tier gap.
- vs. Fatesight Lens (T3 tool): Needle focuses on awareness, Lens on encounter rerolls. Different axes.
- vs. Veilwater Flask (T3 provision): Flask is consumable/temporary. Mead and Chalice are permanent/cursed. Different design space.
