# Fill T4 Legendaries: Tools & Provisions — Revised

**Batch:** `fill-t4-legendaries`
**Date:** 2026-04-07
**Pass:** Editorial revision (naming, tone, data quality). Effects unchanged from draft.

---

## Items

### Tool 1: The Trembling Needle

A compass needle carved from a splinter of the world's first boundary stone. It does not point north. It points toward what is hidden.

**Archetype:** The world-reader. Reveals the map's secrets and reshapes how the wielder perceives terrain. An exploration/divination tool that makes the bearer the most informed agent on the board.

**Name change:** "The Cartographer's Needle" -> "The Trembling Needle." Drops the possessive-profession pattern (T2-T3 register) in favor of the T4 adjective-noun pattern. "Trembling" is drawn from the flavor text's own language ("it trembles when you face a direction no one has walked") and captures the needle's nature without naming its user.

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

**Changes from draft:**
- **Name:** "The Cartographer's Needle" -> "The Trembling Needle" (T4 register)
- **ID:** updated to match new name
- **Flavor text:** Tightened from 3 compound sentences to 3 short declarative ones. "The needle is warm to the touch, and it has never pointed north" split — dropped the warm-to-touch detail (doesn't pay off mechanically or thematically), moved the boundary stone origin from the description into the flavor text (earns its second sentence), kept "It has never pointed north" as the final stone-drop beat.
- **mechanicalSummary:** "globally (permanent rule override)" simplified to "(permanent, self only)" — clearer and matches the scope field.

**Passive total:** 0.08 + 0.05 + 0.03 (conditional) = 0.13 base, 0.16 in exploration
**Effect count:** 5 (within cap)

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
      { type: 'create_structure', what: 'landmark', onHex: 'self', permanent: true, properties: { name: 'Anvilbone Foundation', subtype: 'shrine' } },
      { type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: 0.005, limitValue: 0.40 },
    ],
  } as PossessionNodeProperties,
}
```

**Changes from draft:**
- **Name:** Unchanged. PASS.
- **Flavor text:** Middle sentence revised. "Walls rise where you set them down" (generic) -> "Where you set them down, the ground remembers how to hold weight" (the ground *remembering* threads the uncanny through the middle beat rather than saving it for the close; "hold weight" is more tactile than "walls rise").
- **mechanicalSummary:** "creates a landmark on the wielder's hex" -> "creates a shrine on the wielder's hex" — matches the actual `subtype: 'shrine'` in the effect.

**Passive total:** 0.10 + 0.04 + 0.03 (conditional) = 0.14 base, 0.17 at home
**Effect count:** 5 (within cap)

---

### Provision 1: The Quiet Cup

A cup that never empties. The liquid inside is not water, not wine — it is whatever the drinker most needs. Those who drink from it heal, but they also forget what pain felt like, and that forgetting makes them gentle.

**Archetype:** The divine sustainer. An immortal provision that heals, restores essence, and radiates calm — but slowly erodes the bearer's capacity for violence.

**Name change:** "The Still Chalice" -> "The Quiet Cup." "Cup" is grounded where "chalice" is liturgical — this catalog uses flask, vial, vessel, not courtly vocabulary. "Quiet" echoes the same restrained-power quality as "The Quiet Blade" but in a different domain (peace vs. violence). The echo is intentional: the Blade is quiet because it kills silently; the Cup is quiet because it makes people stop fighting. Two faces of stillness.

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

**Changes from draft:**
- **Name:** "The Still Chalice" -> "The Quiet Cup" (grounded vocabulary, T4 register)
- **ID:** updated to match new name
- **Flavor text:** Compressed from 4 sentences to 3. "The liquid tastes different each time — like the first meal you remember, like the last drink before sleep" merged with the preceding sentence by dropping "The liquid tastes different each time" (the similes already convey variety). Closing line preserved unchanged — it's the best line.
- **mechanicalSummary:** "restores 1 essence per 12 ticks" -> "restores 1 essence per tick (requires Star > 0.10)" — corrected to match the actual `mode: 'per_tick'` with `condition: 'reach_above:star:0.10'`.

**Passive total:** 0.08 + 0.06 = 0.14 base
**Effect count:** 5 (within cap)

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

**Changes from draft:** None. Name, flavor text, tags, mechanicalSummary, and ID all passed editorial review without changes. This is the strongest item in the batch.

**Passive total:** 0.07 + 0.06 - 0.04 = 0.09 net (0.13 gross positive)
**Effect count:** 5 (within cap)

---

### Provision 3: The Black Mead

Fermented from honey gathered by insects that nest in the cracks between worlds. One draught and the drinker sees the architecture of fate. Two draughts and fate sees them back.

**Archetype:** The cursed elixir. A veil/shadow provision that grants enormous mystical power and sight, but actively corrupts the bearer's moral framework and draws hostile attention.

**Name change:** "Dreamer's Mead" -> "The Black Mead." Drops the possessive pattern. Adds the definite article. "Black" is drawn directly from the flavor text ("the mead is black") and carries the right weight — plain, factual, ominous. The color-as-name pattern ("The Pale Pilgrim," "The Quiet Blade") is established T4 territory. "Mead" is kept — it's concrete and grounded, and it contrasts well with "The Quiet Cup" (one heals, the other corrupts; one is always full, the other is black).

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

**Changes from draft:**
- **Name:** "Dreamer's Mead" -> "The Black Mead" (T4 register, definite article, grounded adjective)
- **ID:** updated to match new name
- **Flavor text:** Two changes. (1) "After drinking" -> "After the first draught" — ties back to the description's "one draught / two draughts" framing and is more specific than "after drinking." (2) "You start pulling at them" -> "You pull at them" — removed the hedging verb "start." T4 flavor text delivers certainty.

**Passive total:** 0.09 + 0.05 + 0.04 (tradeoff bonus) - 0.02 (tradeoff penalty) = 0.16 gross positive, 0.14 net
**Effect count:** 5 (within cap)

---

## Summary Table

| Item | Subcategory | Tier | Reaches | Passive Total | Effects | Loss | Tier 3 Primitive | Archetype |
|------|-------------|------|---------|---------------|---------|------|------------------|-----------|
| The Trembling Needle | tools_instruments | 4 | Eye, Veil | 0.13 (0.16 in exploration) | 5 | permanent | modify_rules | World-reader / divination |
| The Anvilbone | tools_instruments | 4 | Stone, Star | 0.14 (0.17 at home) | 5 | permanent | create_structure | World-shaper / creation |
| The Quiet Cup | provisions | 4 | Star, Heart | 0.14 | 5 | permanent | aura, action_gate | Divine sustainer / peacemaker |
| The Last Harvest | provisions | 4 | Iron, Stone | 0.09 net (0.13 gross) | 5 | cursed | modify_rules | Immortal ration / endurance |
| The Black Mead | provisions | 4 | Veil, Shadow | 0.14 net (0.16 gross) | 5 | cursed | reveal, axiological_drift | Cursed elixir / forbidden sight |

## Revision Changelog

| Item | Field | Draft | Revised | Reason |
|------|-------|-------|---------|--------|
| Tool 1 | name | The Cartographer's Needle | The Trembling Needle | Possessive pattern is T2-T3; T4 uses adjective+noun |
| Tool 1 | flavorText | 3 compound sentences | 3 short declarative sentences | Tighter landing, thread origin detail into flavor |
| Tool 1 | mechanicalSummary | "globally (permanent rule override)" | "(permanent, self only)" | Matches scope field |
| Tool 2 | flavorText | "Walls rise where you set them down" | "the ground remembers how to hold weight" | Thread uncanny through middle beat |
| Tool 2 | mechanicalSummary | "creates a landmark" | "creates a shrine" | Matches effect subtype |
| Prov 1 | name | The Still Chalice | The Quiet Cup | "Chalice" is liturgical; "cup" is Threadbare register |
| Prov 1 | flavorText | 4 sentences | 3 sentences | Compressed; preserved best line as closer |
| Prov 1 | mechanicalSummary | "1 essence per 12 ticks" | "1 essence per tick (requires Star > 0.10)" | Corrected to match actual effect |
| Prov 3 | name | Dreamer's Mead | The Black Mead | Possessive pattern; added article; grounded adjective |
| Prov 3 | flavorText | "start pulling" | "pull" | Removed hedging verb |
| Prov 3 | flavorText | "After drinking" | "After the first draught" | More specific, ties to description framing |
