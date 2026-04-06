# Attachment Upgrade Pipeline: Remaining Possessions (Revised)
> Slug: remaining-possessions | Pass: revised | Mode: upgrade
> Items: 41 items (Relics x7, Tomes x8, Tools x7, Provisions x7, Mounts x6, Starters x6) | Date: 2026-04-06
> Revisions from editorial: tag corrections on items 2, 18, 27 (flesh → correct reach domain)

---

## RELICS & TALISMANS

---

## 1. Wayfarer's Charm (T1 Relic)

```typescript
{
  id: 'reward_relics_talismans_wayfarers_charm',
  type: 'artifact',
  name: "Wayfarer's Charm",
  properties: {
    subcategory: 'relics_talismans',
    tier: 1,
    tags: ['#heart', '#talisman', '#travel'],
    mechanicalSummary: '+0.03 Heart, +0.02 Heart in social encounters',
    lossCondition: 'breakable',
    flavorText: 'A knot of twine and feathers, blessed by a roadside saint. It smells of campfire.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 2. Bone Ward (T1 Relic)

```typescript
{
  id: 'reward_relics_talismans_bone_ward',
  type: 'artifact',
  name: 'Bone Ward',
  properties: {
    subcategory: 'relics_talismans',
    tier: 1,
    tags: ['#iron', '#talisman', '#survival'],
    mechanicalSummary: '+0.04 Iron, blocks poison conditions',
    lossCondition: 'breakable',
    flavorText: 'Carved from a knucklebone and hung on gut string. Old magic, close to the body.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.04 },
      { type: 'tag_immunity', tags: ['poison'] },
    ],
  } as PossessionNodeProperties,
},
```

---

## 3. Ember Sigil (T2 Relic)

```typescript
{
  id: 'reward_relics_talismans_ember_sigil',
  type: 'artifact',
  name: 'Ember Sigil',
  properties: {
    subcategory: 'relics_talismans',
    tier: 2,
    tags: ['#star', '#relic', '#divine'],
    mechanicalSummary: '+0.06 Star, +0.03 Heart, when blessed: +0.03 Star for 6 ticks',
    lossCondition: 'stealable',
    flavorText: 'A disc of fired clay stamped with a burning eye. Warm to the touch, always.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.06 },
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'reactive', trigger: 'blessed', effect: {
        type: 'duration', ticks: 6, reach: 'star', value: 0.03, destroyOnExpiry: true
      }, cooldown: 12 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 4. Shadowglass Pendant (T2 Relic)

```typescript
{
  id: 'reward_relics_talismans_shadowglass_pendant',
  type: 'artifact',
  name: 'Shadowglass Pendant',
  properties: {
    subcategory: 'relics_talismans',
    tier: 2,
    tags: ['#shadow', '#relic', '#stealth'],
    mechanicalSummary: '+0.07 Shadow, reveals encounters within 2 hex range',
    lossCondition: 'stealable',
    flavorText: 'The glass is black but not opaque. Something moves inside when no one watches.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.07 },
      { type: 'reveal', target: 'encounters', range: 2 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 5. Heart of the Barrow (T3 Relic)

```typescript
{
  id: 'reward_relics_talismans_heart_of_the_barrow',
  type: 'artifact',
  name: 'Heart of the Barrow',
  properties: {
    subcategory: 'relics_talismans',
    tier: 3,
    tags: ['#stone', '#relic', '#ancient', '#ruins'],
    mechanicalSummary: '+0.12 Stone, -0.04 Shadow, 1-hex aura: +0.02 Stone to allies, +0.01 Stone per encounter (max +0.03)',
    lossCondition: 'permanent',
    flavorText: "A stone pulled from a king's grave. It pulses like a heartbeat when pressed to earth.",
    effects: [
      { type: 'passive', reach: 'stone', value: 0.12 },
      { type: 'passive', reach: 'shadow', value: -0.04 },
      { type: 'aura', radius: 1, target: 'allies', reach: 'stone', value: 0.02 },
      { type: 'stacking', reach: 'stone', valuePerStack: 0.01, maxStacks: 3, stackOn: 'any_encounter' },
    ],
  } as PossessionNodeProperties,
},
```

---

## 6. The Weeping Icon (T3 Relic)

```typescript
{
  id: 'reward_relics_talismans_the_weeping_icon',
  type: 'artifact',
  name: 'The Weeping Icon',
  properties: {
    subcategory: 'relics_talismans',
    tier: 3,
    tags: ['#heart', '#relic', '#divine', '#cursed'],
    mechanicalSummary: '+0.10 Heart, -0.05 Eye, when damaged: +0.04 Heart for 6 ticks (12-tick cd), drifts toward mercy',
    lossCondition: 'cursed',
    flavorText: 'A small wooden saint that cries real tears. You feel what others feel, whether you wish to or not.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.10 },
      { type: 'passive', reach: 'eye', value: -0.05 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 6, reach: 'heart', value: 0.04, destroyOnExpiry: true
      }, cooldown: 12 },
      { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: -0.005, limitValue: 0.30 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 7. The Fulcrum (T4 Relic)

```typescript
{
  id: 'reward_relics_talismans_the_fulcrum',
  type: 'artifact',
  name: 'The Fulcrum',
  properties: {
    subcategory: 'relics_talismans',
    tier: 4,
    tags: ['#veil', '#relic', '#ancient', '#divine', '#arcane', '#ruins'],
    mechanicalSummary: '+0.15 Veil, +0.08 Star, 1-hex aura: +0.03 Veil to all, mystical encounter bonus +0.04 Veil, outcome shift in mystical (+1 step)',
    lossCondition: 'permanent',
    flavorText: 'A sphere of perfect obsidian that balances on any surface. Reality bends toward it.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.15 },
      { type: 'passive', reach: 'star', value: 0.08 },
      { type: 'aura', radius: 1, target: 'all', reach: 'veil', value: 0.03 },
      { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.04 },
      { type: 'test_shaper', reach: 'veil', condition: 'in_mystical', trigger: 'near_miss', steps: 1, maxMargin: 5 },
    ],
  } as PossessionNodeProperties,
},
```

---

## TOMES & SCROLLS

---

## 8. Field Journal (T1 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_field_journal',
  type: 'artifact',
  name: 'Field Journal',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 1,
    tags: ['#eye', '#tome', '#knowledge'],
    mechanicalSummary: '+0.03 Eye, +0.02 Eye in exploration',
    lossCondition: 'breakable',
    flavorText: "A naturalist's notes. The handwriting degrades toward the end.",
    effects: [
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 9. Prayer Scroll (T1 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_prayer_scroll',
  type: 'artifact',
  name: 'Prayer Scroll',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 1,
    tags: ['#star', '#scroll', '#divine'],
    mechanicalSummary: '+0.04 Star, 2 charges of +0.04 Star burst (divine invocation)',
    lossCondition: 'consumable',
    flavorText: 'The words are old and the ink fading. One reading left, perhaps.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.04 },
      { type: 'consumable_charge', charges: 2, onUse: { reach: 'star', value: 0.04 }, destroyOnEmpty: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 10. Merchant's Ledger (T1 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_merchants_ledger',
  type: 'artifact',
  name: "Merchant's Ledger",
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 1,
    tags: ['#gold', '#tome', '#commercial'],
    mechanicalSummary: '+0.04 Gold, +0.02 Gold in social (trade leverage)',
    lossCondition: 'breakable',
    flavorText: 'Columns of numbers, trade routes inked in margins. Knowledge is currency.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.04 },
      { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 11. Chronicle of the Falling (T2 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_chronicle_of_the_falling',
  type: 'artifact',
  name: 'Chronicle of the Falling',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 2,
    tags: ['#eye', '#tome', '#knowledge'],
    mechanicalSummary: '+0.08 Eye, rescue near-miss Eye tests (+1 step, margin 5)',
    lossCondition: 'stealable',
    flavorText: 'A history of empires that collapsed. The final chapter is blank.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.08 },
      { type: 'test_shaper', reach: 'eye', trigger: 'near_miss', steps: 1, maxMargin: 5 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 12. Veilscript Fragment (T2 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_veilscript_fragment',
  type: 'artifact',
  name: 'Veilscript Fragment',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 2,
    tags: ['#veil', '#scroll', '#knowledge', '#arcane'],
    mechanicalSummary: '+0.06 Veil, +0.03 Eye, +0.01 Veil per encounter (max +0.03, decays 1/tick)',
    lossCondition: 'breakable',
    flavorText: 'The letters rearrange themselves when you look away.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'stacking', reach: 'veil', valuePerStack: 0.01, maxStacks: 3, stackOn: 'any_encounter', decayPerTick: 1 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 13. Smuggler's Chart (T1 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_smugglers_chart',
  type: 'artifact',
  name: "Smuggler's Chart",
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 1,
    tags: ['#shadow', '#map', '#ruin_seeker', '#ancient'],
    mechanicalSummary: '+0.03 Shadow, grants ruin_seeker, +0.02 Shadow in exploration',
    lossCondition: 'consumable',
    flavorText: 'Stained with sea-salt and cheap wine. The cross marks a cache beneath old foundations.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.03 },
      { type: 'conditional', condition: 'in_exploration', reach: 'shadow', value: 0.02 },
    ],
    grantsTraitWhileHeld: 'ruin_seeker',
    grantedTraitLevel: 1,
    consumeOnEvent: 'hidden_site_discovered',
  } as PossessionNodeProperties,
},
```

---

## 14. Codex of Unmaking (T4 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_codex_of_unmaking',
  type: 'artifact',
  name: 'Codex of Unmaking',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 4,
    tags: ['#veil', '#tome', '#knowledge', '#ancient', '#cursed', '#arcane', '#ruins'],
    mechanicalSummary: '+0.15 Veil, -0.08 Heart, blocks Heart actions (too detached to empathize), reveals all encounters, drifts toward ruthlessness',
    lossCondition: 'cursed',
    flavorText: 'The pages are blank until you bleed on them. Then they show you how everything ends.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.15 },
      { type: 'passive', reach: 'heart', value: -0.08 },
      { type: 'action_gate', mode: 'block', reach: 'heart' },
      { type: 'reveal', target: 'encounters', range: 'all' },
      { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.008, limitValue: 0.50 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 15. The Silent Testament (T3 Tome)

```typescript
{
  id: 'reward_tomes_scrolls_the_silent_testament',
  type: 'artifact',
  name: 'The Silent Testament',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 3,
    tags: ['#star', '#tome', '#knowledge', '#ancient', '#ruins'],
    mechanicalSummary: '+0.10 Star, +0.05 Eye, prevents 1 condition loss, +0.03 Star at low health',
    lossCondition: 'permanent',
    flavorText: 'Written by a god who chose to die. Every page is a eulogy for a truth.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.10 },
      { type: 'passive', reach: 'eye', value: 0.05 },
      { type: 'prevent_loss', channel: 'condition', consumeOnPrevent: false },
      { type: 'conditional', condition: 'health_low', reach: 'star', value: 0.03 },
    ],
  } as PossessionNodeProperties,
},
```

---

## TOOLS & INSTRUMENTS

---

## 16. Surveyor's Glass (T1 Tool)

```typescript
{
  id: 'reward_tools_instruments_surveyors_glass',
  type: 'artifact',
  name: "Surveyor's Glass",
  properties: {
    subcategory: 'tools_instruments',
    tier: 1,
    tags: ['#eye', '#tool', '#craft'],
    mechanicalSummary: '+0.04 Eye, +1 awareness range',
    lossCondition: 'breakable',
    flavorText: 'A single cracked lens in a brass tube. It magnifies, but distorts at the edges.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 17. Iron Tongs (T1 Tool)

```typescript
{
  id: 'reward_tools_instruments_iron_tongs',
  type: 'artifact',
  name: 'Iron Tongs',
  properties: {
    subcategory: 'tools_instruments',
    tier: 1,
    tags: ['#stone', '#tool', '#craft'],
    mechanicalSummary: '+0.03 Stone, +0.02 Stone at home territory (workshop access)',
    lossCondition: 'breakable',
    flavorText: "Blacksmith's tongs, well-used. The handles are polished smooth by grip.",
    effects: [
      { type: 'passive', reach: 'stone', value: 0.03 },
      { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 18. Herbalist's Pouch (T1 Tool)

```typescript
{
  id: 'reward_tools_instruments_herbalists_pouch',
  type: 'artifact',
  name: "Herbalist's Pouch",
  properties: {
    subcategory: 'tools_instruments',
    tier: 1,
    tags: ['#heart', '#tool', '#survival', '#craft', '#wilderness', '#healing'],
    mechanicalSummary: '+0.04 Heart, 3 charges of +0.03 Heart burst (field dressing)',
    lossCondition: 'consumable',
    flavorText: 'Dried leaves, crushed roots, and a mortar small enough to carry. The smell is medicinal.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'heart', value: 0.03 }, destroyOnEmpty: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 19. Gate Seal Case (T1 Tool)

```typescript
{
  id: 'reward_tools_instruments_gate_seal_case',
  type: 'artifact',
  name: 'Gate Seal Case',
  properties: {
    subcategory: 'tools_instruments',
    tier: 1,
    tags: ['#checkpoint', '#order', '#eye', '#gold'],
    mechanicalSummary: '+0.03 Eye, +0.02 Gold, +0.02 Gold in social (official authority)',
    lossCondition: 'stealable',
    flavorText: 'Wax seals, chalk, and a customs stamp wrapped in oilcloth. Boring to everyone except the people who know how power hides in paperwork.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'passive', reach: 'gold', value: 0.02 },
      { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 20. Master Chisel (T2 Tool)

```typescript
{
  id: 'reward_tools_instruments_master_chisel',
  type: 'artifact',
  name: 'Master Chisel',
  properties: {
    subcategory: 'tools_instruments',
    tier: 2,
    tags: ['#stone', '#tool', '#craft', '#ruins'],
    mechanicalSummary: '+0.08 Stone, +0.01 Stone per encounter success (max +0.04)',
    lossCondition: 'stealable',
    flavorText: 'Engraved with the mark of a guild that no longer exists. The edge never dulls.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.08 },
      { type: 'stacking', reach: 'stone', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success' },
    ],
  } as PossessionNodeProperties,
},
```

---

## 21. Alchemist's Crucible (T2 Tool)

```typescript
{
  id: 'reward_tools_instruments_alchemists_crucible',
  type: 'artifact',
  name: "Alchemist's Crucible",
  properties: {
    subcategory: 'tools_instruments',
    tier: 2,
    tags: ['#veil', '#tool', '#knowledge', '#craft', '#arcane'],
    mechanicalSummary: '+0.07 Veil, +0.03 Eye, +0.03 Veil for 6 ticks then dormant 12 ticks (distillation cycle)',
    lossCondition: 'breakable',
    flavorText: 'Stained with substances that should not exist in nature. The inside glows faintly at dusk.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.07 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'veil', value: 0.03 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 22. Astrolabe of Yven (T3 Tool)

```typescript
{
  id: 'reward_tools_instruments_the_astrolabe_of_yven',
  type: 'artifact',
  name: 'Astrolabe of Yven',
  properties: {
    subcategory: 'tools_instruments',
    tier: 3,
    tags: ['#star', '#tool', '#ancient', '#knowledge', '#craft'],
    mechanicalSummary: '+0.10 Star, +0.05 Eye, reveals agents within 3 hexes, +0.03 Star in mystical',
    lossCondition: 'permanent',
    flavorText: 'The rings spin of their own accord. It does not measure the stars — it speaks with them.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.10 },
      { type: 'passive', reach: 'eye', value: 0.05 },
      { type: 'reveal', target: 'agent', range: 3 },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
    ],
  } as PossessionNodeProperties,
},
```

---

## PROVISIONS

---

## 23. Traveler's Wine (T1 Provision)

```typescript
{
  id: 'reward_provisions_travelers_wine',
  type: 'artifact',
  name: "Traveler's Wine",
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#drink', '#provision', '#heart', '#trade'],
    mechanicalSummary: '+0.04 Heart, decays -0.005/tick to 0 (wine runs out)',
    lossCondition: 'consumable',
    flavorText: 'Cheap and sour, but it loosens tongues and lightens burdens.',
    effects: [
      { type: 'decay', reach: 'heart', startValue: 0.04, changePerTick: -0.005, limitValue: 0, destroyAtLimit: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 24. Hardtack and Salt (T1 Provision)

```typescript
{
  id: 'reward_provisions_hardtack_and_salt',
  type: 'artifact',
  name: 'Hardtack and Salt',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#food', '#provision', '#survival', '#wilderness', '#trade'],
    mechanicalSummary: '+0.03 Iron, +0.02 Iron in wilderness (trail sustenance)',
    lossCondition: 'consumable',
    flavorText: 'It will not spoil. It will also not taste like food.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'conditional', condition: 'in_wilderness', reach: 'iron', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 25. Full Waterskin (T1 Provision)

```typescript
{
  id: 'reward_provisions_waterskin',
  type: 'artifact',
  name: 'Full Waterskin',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#drink', '#provision', '#survival', '#wilderness'],
    mechanicalSummary: '+0.03 Iron, decays -0.003/tick to 0 (water runs out)',
    lossCondition: 'consumable',
    flavorText: 'Clean water. Worth more than gold in the dry places.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: 0.03, changePerTick: -0.003, limitValue: 0, destroyAtLimit: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 26. Firestarter Kit (T1 Provision)

```typescript
{
  id: 'reward_provisions_firestarter_kit',
  type: 'artifact',
  name: 'Firestarter Kit',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#tool', '#provision', '#survival', '#wilderness'],
    mechanicalSummary: '+0.03 Stone, 3 charges of +0.03 Stone burst (fire-making)',
    lossCondition: 'consumable',
    flavorText: 'Flint, steel, and a bundle of tinder wrapped in oilcloth. The difference between living and dying.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.03 },
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'stone', value: 0.03 }, destroyOnEmpty: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 27. Healing Poultice (T2 Provision)

```typescript
{
  id: 'reward_provisions_healing_poultice',
  type: 'artifact',
  name: 'Healing Poultice',
  properties: {
    subcategory: 'provisions',
    tier: 2,
    tags: ['#potion', '#provision', '#heart', '#healing', '#wilderness'],
    mechanicalSummary: '+0.07 Heart, decays -0.007/tick to 0 (poultice absorbed)',
    lossCondition: 'consumable',
    flavorText: 'Moss, spider silk, and something bitter. Applied to wounds, it numbs and knits.',
    effects: [
      { type: 'decay', reach: 'heart', startValue: 0.07, changePerTick: -0.007, limitValue: 0, destroyAtLimit: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 28. Sanctuary Incense (T2 Provision)

```typescript
{
  id: 'reward_provisions_sanctuary_incense',
  type: 'artifact',
  name: 'Sanctuary Incense',
  properties: {
    subcategory: 'provisions',
    tier: 2,
    tags: ['#star', '#provision', '#divine', '#healing'],
    mechanicalSummary: '+0.06 Star, +0.03 Heart, lasts until rest (sanctuary ends when you move on)',
    lossCondition: 'consumable',
    flavorText: 'When burned, the smoke forms shapes that soothe the troubled spirit.',
    effects: [
      { type: 'until_event', event: 'rest', reach: 'star', value: 0.06, destroyOnEvent: true },
      { type: 'until_event', event: 'rest', reach: 'heart', value: 0.03, destroyOnEvent: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 29. Veilwater Flask (T3 Provision)

```typescript
{
  id: 'reward_provisions_veilwater_flask',
  type: 'artifact',
  name: 'Veilwater Flask',
  properties: {
    subcategory: 'provisions',
    tier: 3,
    tags: ['#veil', '#potion', '#provision', '#arcane'],
    mechanicalSummary: '+0.10 Veil (decays -0.008/tick), +0.05 Eye (decays -0.004/tick), reveals all hexes while active',
    lossCondition: 'consumable',
    flavorText: 'The liquid is perfectly clear but casts no reflection. Those who drink it see the world peeled back.',
    effects: [
      { type: 'decay', reach: 'veil', startValue: 0.10, changePerTick: -0.008, limitValue: 0, destroyAtLimit: true },
      { type: 'decay', reach: 'eye', startValue: 0.05, changePerTick: -0.004, limitValue: 0, destroyAtLimit: false },
      { type: 'reveal', target: 'hexes', range: 'all', duration: 12 },
    ],
  } as PossessionNodeProperties,
},
```

---

## MOUNTS & BEASTS

---

## 30. Draft Pony (T1 Mount)

```typescript
{
  id: 'reward_mounts_beasts_draft_pony',
  type: 'artifact',
  name: 'Draft Pony',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 1,
    tags: ['#beast', '#mount', '#travel', '#wilderness'],
    mechanicalSummary: '+0.03 Gold, 10% reduced movement cost (pack animal)',
    lossCondition: 'stealable',
    flavorText: 'Short-legged and ill-tempered, but carries twice its weight without complaint.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.9 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 31. Tracking Hound (T1 Beast)

```typescript
{
  id: 'reward_mounts_beasts_hound',
  type: 'artifact',
  name: 'Tracking Hound',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 1,
    tags: ['#beast', '#eye', '#survival', '#wilderness'],
    mechanicalSummary: '+0.04 Eye, amplifies exploration encounters (1.3x)',
    lossCondition: 'breakable',
    flavorText: 'Scarred ears and a cold nose. It finds things you did not know were lost.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'behavior_weight', reach: 'eye', multiplier: 1.3 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 32. Pack Goat (T1 Beast)

```typescript
{
  id: 'reward_mounts_beasts_pack_goat',
  type: 'artifact',
  name: 'Pack Goat',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 1,
    tags: ['#beast', '#travel', '#survival', '#wilderness'],
    mechanicalSummary: '+0.03 Stone, +1 consumable slot (pack carrier)',
    lossCondition: 'stealable',
    flavorText: 'It eats anything. It climbs anything. It judges you constantly.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.03 },
      { type: 'slot_bonus', slotTag: 'consumable', bonus: 1 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 33. Steppe Mare (T2 Mount)

```typescript
{
  id: 'reward_mounts_beasts_steppe_mare',
  type: 'artifact',
  name: 'Steppe Mare',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#mount', '#travel', '#wilderness'],
    mechanicalSummary: '+0.05 Gold, +0.03 Iron, 20% reduced movement cost, flee on damage (+0.04 Gold for 4 ticks, 12-tick cd)',
    lossCondition: 'stealable',
    flavorText: 'Long-legged and wind-quick. She runs like she remembers open grassland.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.05 },
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 4, reach: 'gold', value: 0.04, destroyOnExpiry: true
      }, cooldown: 12 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 34. War Hound (T2 Beast)

```typescript
{
  id: 'reward_mounts_beasts_war_hound',
  type: 'artifact',
  name: 'War Hound',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#iron', '#weapon', '#combat', '#wilderness'],
    mechanicalSummary: '+0.06 Iron, +0.03 Eye, +0.03 Iron in combat, cooperation bias toward enemies: -0.2 (the hound snarls)',
    lossCondition: 'breakable',
    flavorText: 'Bred for violence and trained to silence. Its loyalty is absolute and terrifying.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.03 },
      { type: 'social_modifier', targetFilter: 'enemy', cooperationBias: -0.2 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 35. Ashenmane Destrier (T3 Mount)

```typescript
{
  id: 'reward_mounts_beasts_ashenmane_destrier',
  type: 'artifact',
  name: 'Ashenmane Destrier',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#mount', '#iron', '#combat', '#wilderness'],
    mechanicalSummary: '+0.10 Iron, +0.05 Gold, 20% reduced movement cost, grants cavalry_charge trait, amplifies combat encounters (1.4x)',
    lossCondition: 'permanent',
    flavorText: 'Grey as smoke and fearless in battle. It was born on a battlefield and has never left one.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.10 },
      { type: 'passive', reach: 'gold', value: 0.05 },
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'trait_grant', grantedTrait: 'cavalry_charge' },
      { type: 'behavior_weight', reach: 'iron', multiplier: 1.4 },
    ],
  } as PossessionNodeProperties,
},
```

---

## STARTER ATTACHMENTS

---

## 36. Ashenmane's Fang (Starter, T2 Arms)

```typescript
{
  id: 'starter_ashenmane_fang',
  type: 'artifact_legendary',
  name: "Ashenmane's Fang",
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#iron', '#weapon', '#legendary_beast'],
    mechanicalSummary: '+0.08 Iron, +0.04 Iron in combat (beast fury)',
    lossCondition: 'permanent',
    flavorText: 'Pulled from the jaw of the beast that terrorized the Ashen Vale for three generations.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.08 },
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.04 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 37. Road-Worn Mule (Starter, T1 Mount)

```typescript
{
  id: 'starter_road_worn_mule',
  type: 'artifact',
  name: 'Road-Worn Mule',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 1,
    tags: ['#beast', '#mount', '#travel'],
    mechanicalSummary: '+0.03 Gold, 10% reduced movement cost (pack carrier)',
    lossCondition: 'stealable',
    flavorText: 'A stubborn creature with strong legs and stronger opinions.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.9 },
    ],
  } as PossessionNodeProperties,
},
```

---

## 38. Ashenmane Horse (Starter, T2 Mount)

```typescript
{
  id: 'starter_ashenmane_horse',
  type: 'artifact',
  name: 'Ashenmane Horse',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#mount', '#cavalry'],
    mechanicalSummary: '20% reduced movement cost, grants cavalry_charge trait',
    lossCondition: 'breakable',
    flavorText: 'Bred in the western reaches, these horses run until their hearts give out.',
    effects: [
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'trait_grant', grantedTrait: 'cavalry_charge' },
    ],
  } as PossessionNodeProperties,
},
```

---

## 39. Copper Market Rations (Starter, T1 Provision)

```typescript
{
  id: 'starter_copper_market_rations',
  type: 'artifact',
  name: 'Copper Market Rations',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#food', '#consumable', '#travel'],
    mechanicalSummary: '+0.03 Iron, decays -0.003/tick to 0 (rations consumed)',
    lossCondition: 'consumable',
    flavorText: 'Dried meat, hard bread, and a waterskin. Simple sustenance for the road.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: 0.03, changePerTick: -0.003, limitValue: 0, destroyAtLimit: true },
    ],
  } as PossessionNodeProperties,
},
```

---

## 40. Burned Codex (Starter, T2 Tome)

```typescript
{
  id: 'starter_burned_codex',
  type: 'artifact',
  name: 'Burned Codex',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 2,
    tags: ['#star', '#tome', '#knowledge'],
    mechanicalSummary: '+0.06 Star, +0.03 Eye in exploration (fragment research), on first use: revelation condition',
    lossCondition: 'permanent',
    flavorText: 'Half the pages are ash. The rest are worse.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.06 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.03 },
    ],
    onUseTriggers: [
      {
        triggerCondition: 'first_use',
        probability: 1.0,
        effect: {
          type: 'add_condition',
          tags: ['#revelation'],
          modifiers: { star: 0.15 },
          ticksRemaining: 20,
        },
        narrativeTemplate:
          "The pages of the Burned Codex whisper truths that burn behind {actor}'s eyes.",
      } as OnUseTrigger,
    ],
  } as PossessionNodeProperties,
},
```

---

## 41. The Whispering Eye (Starter, T3 Relic)

```typescript
{
  id: 'starter_whispering_eye',
  type: 'artifact',
  name: 'The Whispering Eye',
  properties: {
    subcategory: 'relics_talismans',
    tier: 3,
    tags: ['#eye', '#cursed', '#supernatural'],
    mechanicalSummary: '+0.08 Eye, -0.04 Heart, reveals attachments within 2 hexes, when cursed: -0.03 Heart for 6 ticks (12-tick cd)',
    lossCondition: 'cursed',
    flavorText: 'It sees what you cannot. It shows what you must not know.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.08 },
      { type: 'passive', reach: 'heart', value: -0.04 },
      { type: 'reveal', target: 'attachments', range: 2 },
      { type: 'reactive', trigger: 'cursed', effect: {
        type: 'duration', ticks: 6, reach: 'heart', value: -0.03, destroyOnExpiry: true
      }, cooldown: 12 },
    ],
    onUseTriggers: [
      {
        triggerCondition: 'any_use',
        probability: 0.15,
        effect: {
          type: 'add_condition',
          modifiers: { heart: -0.05 },
          ticksRemaining: 10,
        },
        narrativeTemplate:
          "The Eye drinks deep of {actor}'s resolve.",
      } as OnUseTrigger,
    ],
  } as PossessionNodeProperties,
},
```
