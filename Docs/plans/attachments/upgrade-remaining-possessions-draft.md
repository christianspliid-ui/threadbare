# Attachment Upgrade Pipeline: Remaining Possessions (Relics, Tomes, Tools, Provisions, Mounts)
> Slug: remaining-possessions | Pass: draft | Mode: upgrade
> Items: 41 items (Relics x7, Tomes x8, Tools x7, Provisions x7, Mounts x6, Starters x6) | Date: 2026-04-06
> Skipped: `reward_tomes_scrolls_letters_of_introduction`, `reward_tomes_scrolls_fading_ward`, `reward_provisions_battle_salve` (already alive with effects[])

**ID corrections from task spec vs actual catalog:**
- Task says `reward_tomes_scrolls_codex_of_the_unmaking` -- actual ID is `reward_tomes_scrolls_codex_of_unmaking`
- Task says `reward_provisions_traveler_wine` -- actual ID is `reward_provisions_travelers_wine`
- Task says `reward_provisions_hardtack` -- actual ID is `reward_provisions_hardtack_and_salt`
- Task says `reward_mounts_beasts_destrier` -- actual ID is `reward_mounts_beasts_ashenmane_destrier`
- Task says `reward_tools_instruments_astrolabe_of_yven` -- actual ID is `reward_tools_instruments_the_astrolabe_of_yven`

**Note on `flesh` reach:** Flesh is NOT a valid `ReachDomain`. The Herbalist's Pouch, Bone Ward, Healing Poultice, Hardtack and Salt, and Full Waterskin reference `flesh` in their `reachBonus`. In migration, `flesh` is remapped to the closest valid reach: `heart` for healing/empathic care, `stone` for bodily endurance, `iron` for physical toughness. Original `reachBonus` fields are removed entirely and replaced by `effects[]`.

**Primitives spread across this batch (19 distinct):** passive, conditional, consumable_charge, cooldown, stacking, decay, tradeoff, test_shaper, prevent_loss, trait_grant, duration, transform, reactive, behavior_weight, social_modifier, range_modifier, tag_immunity, reveal, until_event, aura, action_gate

---

## RELICS & TALISMANS

---

## 1. Wayfarer's Charm (T1 Relic)

**Niche:** Traveler's talisman -- warmth and hospitality on the road. Strangers are kinder, campfires burn brighter, and the bearer finds welcome where others find suspicion.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The heart passive preserves the original reachBonus. The conditional in_social captures the charm's nature as a traveler's social token -- it smooths first encounters and loosens suspicion. Simple, appropriate for T1. Total reach value: 0.03 passive + 0.02 conditional = 0.05 max.

---

## 2. Bone Ward (T1 Relic)

**Niche:** Primal protection charm -- old body magic close to blood and bone. Wards off disease and poisons, the deep fears of the road.

```typescript
{
  id: 'reward_relics_talismans_bone_ward',
  type: 'artifact',
  name: 'Bone Ward',
  properties: {
    subcategory: 'relics_talismans',
    tier: 1,
    tags: ['#flesh', '#talisman', '#survival'],
    mechanicalSummary: '+0.04 Iron, blocks poison conditions',
    lossCondition: 'breakable',
    flavorText: 'Carved from a knucklebone and hung on gut string. Old magic, close to the body.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.04 },
      { type: 'tag_immunity', tags: ['poison'] },
    ],
    // reachBonus removed — migrated to effects[]
    // flesh reach remapped to iron (bodily toughness / survival endurance)
  } as PossessionNodeProperties,
},
```

**Design notes:** Flesh 0.04 remaps to iron -- the bone ward protects the body through toughness, not empathy. The tag_immunity for poison reflects the ward's nature as old protective magic, keeping toxins at bay. The knucklebone-and-gut-string aesthetic screams "keep bad things out." Total reach value: 0.04 passive.

---

## 3. Ember Sigil (T2 Relic)

**Niche:** Divine ember -- a blessed fire-disc that burns with persistent warmth. It flares protectively when the bearer is blessed, amplifying divine favor.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passive values preserved exactly. The reactive-on-blessed fits the sigil's divine nature -- it responds to divine attention by flaring brighter. The 6-tick duration with 12-tick cooldown prevents constant uptime while making blessings feel meaningful. Total reach value: 0.06 + 0.03 passive + 0.03 reactive = 0.12 max.

---

## 4. Shadowglass Pendant (T2 Relic)

**Niche:** Stealth amplifier with hidden depths -- the glass pendant conceals and reveals, rewarding those who embrace the shadows. Something moves inside it, watching.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves the original 0.07 shadow. The reveal effect fits the pendant's flavor perfectly -- "something moves inside when no one watches" implies it sees things the bearer cannot. Revealing nearby encounters makes the pendant a scout's tool: you know what lurks before you step into it. Total reach value: 0.07 passive.

---

## 5. Heart of the Barrow (T3 Relic)

**Niche:** Ancient earth relic -- a stone heart ripped from a king's grave. It roots the bearer in place and time, granting deep mastery of construction and craft at the cost of subtlety and stealth.

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
    flavorText: 'A stone pulled from a king\'s grave. It pulses like a heartbeat when pressed to earth.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.12 },
      { type: 'passive', reach: 'shadow', value: -0.04 },
      { type: 'aura', radius: 1, target: 'allies', reach: 'stone', value: 0.02 },
      { type: 'stacking', reach: 'stone', valuePerStack: 0.01, maxStacks: 3, stackOn: 'any_encounter' },
    ],
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved exactly (0.12 stone, -0.04 shadow). The aura is small (1 hex, allies only, +0.02 stone) -- the barrow heart makes nearby companions more grounded and capable builders. The stacking effect rewards consistent engagement: the stone grows heavier with experience, up to +0.03 at max. For T3, passive + aura + stacking is rich without being overwhelming. Total reach value: 0.12 - 0.04 passive + 0.02 aura + 0.03 stacking = 0.13 max.

---

## 6. The Weeping Icon (T3 Relic)

**Niche:** Empathic divine artifact -- a cursed saint figure that forces the bearer to feel what others feel. Devastating social power at the cost of analytical clarity.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.10 heart, -0.05 eye). The reactive on damaged fits the flavor -- when the bearer suffers, the icon weeps harder and empathy surges. The axiological drift toward mercy (negative rate = toward mercy pole) captures the long-term personality cost of carrying something that forces you to feel everyone's pain. For T3, passive + reactive + axiological drift is a strong composition. Total reach value: 0.10 - 0.05 passive + 0.04 reactive = 0.09 max.

---

## 7. The Fulcrum (T4 Relic)

**Niche:** Reality anchor -- a sphere of perfect obsidian around which the world bends. It amplifies magical potential, enhances fate-reading, and warps the rules of engagement in its vicinity. The ultimate arcane relic.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.15 veil hits the per-item cap alone, 0.08 star). The Fulcrum warps reality -- the aura gives everyone nearby a veil boost (reality bends toward it), the conditional amplifies mystical encounters, and the test_shaper rescues near-miss veil tests (reality wants you to succeed near the Fulcrum). For T4, this is a rich 5-effect composition where every piece reinforces the "reality anchor" fantasy. Total reach value: 0.15 + 0.08 passive + 0.03 aura + 0.04 conditional = high, but most is existing reachBonus migration; the T4 budget accommodates this.

---

## TOMES & SCROLLS

---

## 8. Field Journal (T1 Tome)

**Niche:** Naturalist's notebook -- observation and study aid. The degrading handwriting hints at obsessive documentation. Rewards careful exploration.

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
    flavorText: 'A naturalist\'s notes. The handwriting degrades toward the end.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
    ],
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves the original 0.03 eye. The conditional in_exploration is a natural fit for a field journal -- it's most useful when you're out observing the world, not in combat or at court. Clean T1 design. Total reach value: 0.03 passive + 0.02 conditional = 0.05 max.

---

## 9. Prayer Scroll (T1 Tome)

**Niche:** Fading devotional text -- one reading left, perhaps. A consumable burst of divine clarity, fitting for its consumable loss condition.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.04 star. The consumable_charge with 2 charges and destroyOnEmpty matches the flavor -- "one reading left, perhaps" suggests very limited uses. The scroll is already marked as consumable lossCondition, making the auto-destruction feel right. Two prayer-bursts of divine guidance, then the ink is gone. Total reach value: 0.04 passive + 0.04 per charge.

---

## 10. Merchant's Ledger (T1 Tome)

**Niche:** Trade intelligence -- price lists, contacts, route annotations. A practical reference that makes the bearer a better negotiator.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.04 gold. The conditional in_social reflects using the ledger's trade intelligence during negotiations -- knowing fair prices, supply chains, and who owes whom is leverage. Total reach value: 0.04 passive + 0.02 conditional = 0.06 max.

---

## 11. Chronicle of the Falling (T2 Tome)

**Niche:** Historical study of collapsed empires -- a scholar's warning text. The blank final chapter implies the current age may be next. Deep knowledge with an edge of prophecy.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.08 eye. The test_shaper on near-miss eye tests reflects the chronicle's deep historical knowledge -- when your analysis is almost right, the patterns of fallen empires nudge you toward the correct conclusion. The maxMargin 5 keeps it from rescuing wild misses. Total reach value: 0.08 passive.

---

## 12. Veilscript Fragment (T2 Tome)

**Niche:** Arcane cipher text -- letters that rearrange themselves. Grants veil knowledge with a study-stacking mechanic that rewards sustained engagement with the text.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.06 veil, 0.03 eye). The stacking effect captures the fragment's living nature -- the letters rearrange, and each encounter gives the reader another glimpse of the rearranged pattern. Over time, understanding accumulates (up to +0.03 veil), but it fades without sustained attention (decayPerTick: 1). Total reach value: 0.06 + 0.03 passive + 0.03 stacking = 0.12 max.

---

## 13. Smuggler's Chart (T1 Tome)

**Niche:** Underworld navigation aid -- a stained map to hidden caches. Grants ruin-seeking and shadow knowledge. The chart's existing ruin_seeker trait grant stays; effects add the mechanical layer.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.03 shadow. The conditional in_exploration reflects the chart's utility when actively searching -- better shadow reach when poking around ruins and old foundations. The existing grantsTraitWhileHeld/consumeOnEvent mechanics stay untouched. Total reach value: 0.03 passive + 0.02 conditional = 0.05 max.

---

## 14. Codex of Unmaking (T4 Tome)

**Niche:** Apocalyptic grimoire -- blank pages that reveal endings when fed blood. Massive arcane power with severe empathic cost. The ultimate veil artifact, gating forbidden knowledge behind sacrifice.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.15 veil, -0.08 heart). For T4, three powerful non-passives: the action_gate blocks heart-reach actions entirely (reading how everything ends makes empathy impossible), the reveal shows all encounters everywhere (omniscient awareness of destruction patterns), and the axiological_drift toward ruthlessness (positive rate = toward the ruthlessness pole) captures the long-term corruption of carrying a book that shows you endings. This is the anti-Weeping Icon -- where that relic forces mercy, this one strips it away. Total reach value: 0.15 - 0.08 passive.

---

## 15. The Silent Testament (T3 Tome)

**Niche:** Dead god's eulogy -- every page is a truth written by a god who chose to die. Grants profound knowledge of fate and observation, with a protective layer that preserves understanding.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.10 star, 0.05 eye). The prevent_loss on condition channel reflects the testament's protective wisdom -- a god's dying words shield the reader from mental afflictions. The conditional health_low star bonus means that when the bearer is in danger, the testament's truths become clearer (facing death brings you closer to the dead god's perspective). For T3, passive + prevent_loss + conditional is a solid 4-effect composition. Total reach value: 0.10 + 0.05 passive + 0.03 conditional = 0.18 max (within T3 budget given mythic nature).

---

## TOOLS & INSTRUMENTS

---

## 16. Surveyor's Glass (T1 Tool)

**Niche:** Observation lens -- cracked but functional. Magnifies details at the cost of edge distortion. A scholar's and explorer's basic instrument.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.04 eye. The range_modifier with +1 awareness range is the natural fit for a surveyor's glass -- you literally see farther. Simple, practical, T1. Total reach value: 0.04 passive.

---

## 17. Iron Tongs (T1 Tool)

**Niche:** Blacksmith's grip -- practical forge tool. Best used in craft contexts where hot metal needs shaping.

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
    flavorText: 'Blacksmith\'s tongs, well-used. The handles are polished smooth by grip.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.03 },
      { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.02 },
    ],
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.03 stone. The conditional at_home_territory reflects that tongs are most useful in a workshop with an anvil and forge -- you need infrastructure to get the most from them. Out in the field, they're just heavy metal. Total reach value: 0.03 passive + 0.02 conditional = 0.05 max.

---

## 18. Herbalist's Pouch (T1 Tool)

**Niche:** Field medicine kit -- dried herbs and a mortar for wilderness healing. Consumable charges of healing that run out.

```typescript
{
  id: 'reward_tools_instruments_herbalists_pouch',
  type: 'artifact',
  name: "Herbalist's Pouch",
  properties: {
    subcategory: 'tools_instruments',
    tier: 1,
    tags: ['#flesh', '#tool', '#survival', '#craft', '#wilderness', '#healing'],
    mechanicalSummary: '+0.04 Heart, 3 charges of +0.03 Heart burst (field dressing)',
    lossCondition: 'consumable',
    flavorText: 'Dried leaves, crushed roots, and a mortar small enough to carry. The smell is medicinal.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'heart', value: 0.03 }, destroyOnEmpty: true },
    ],
    // reachBonus removed — migrated to effects[]
    // flesh reach remapped to heart (healing care / tending wounds)
  } as PossessionNodeProperties,
},
```

**Design notes:** Flesh 0.04 remaps to heart -- herbalism is healing care, empathic tending, which maps to heart rather than iron or stone. The consumable_charge with 3 charges and destroyOnEmpty reflects the pouch running out of supplies. Once the herbs are used, the pouch is empty. Total reach value: 0.04 passive + 0.03 per charge.

---

## 19. Gate Seal Case (T1 Tool)

**Niche:** Bureaucratic toolkit -- customs stamps, wax seals, and official paperwork. Power hidden in paperwork, useful for navigating authority.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.03 eye, 0.02 gold). The conditional in_social gold bonus reflects the seal case's nature as an authority tool -- in negotiations and official encounters, having the right stamps and seals gives you leverage. The flavor text nails it: "power hides in paperwork." Total reach value: 0.03 + 0.02 passive + 0.02 conditional = 0.07 max.

---

## 20. Master Chisel (T2 Tool)

**Niche:** Guild craftsman's precision tool -- the mark of a guild that no longer exists. Rewards sustained craft work with stacking mastery.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.08 stone. The stacking on combat_success (which encompasses encounter success broadly) reflects mastery deepening through use -- the chisel "never dulls" and the guild mark implies continuous refinement. Max stacks of 4 = +0.04 bonus at peak. Total reach value: 0.08 passive + 0.04 stacking = 0.12 max.

---

## 21. Alchemist's Crucible (T2 Tool)

**Niche:** Arcane laboratory instrument -- stained with unnatural substances. Enables mystical experimentation, cycling between active distillation and cooling periods.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.07 veil, 0.03 eye). The cooldown effect represents the crucible's distillation cycle -- active for 6 ticks as the alchemical reaction runs, then dormant for 12 ticks while it cools and the residue is cleaned. The flavor text's "glows faintly at dusk" maps beautifully to a cyclical power pattern. Total reach value: 0.07 + 0.03 passive + 0.03 cooldown (intermittent) = 0.13 max.

---

## 22. Astrolabe of Yven (T3 Tool)

**Niche:** Celestial navigation instrument of mythic provenance -- it speaks with stars. Grants deep fate and observation power with stellar revelation effects.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.10 star, 0.05 eye). The reveal for agents within 3 hexes reflects the astrolabe's ability to "speak with stars" and know where others are through celestial calculation. The conditional in_mystical star bonus means the instrument resonates during arcane activities, when the boundary between mortal and cosmic is thinnest. For T3, passive + reveal + conditional is a clean composition. Total reach value: 0.10 + 0.05 passive + 0.03 conditional = 0.18 max.

---

## PROVISIONS

---

## 23. Traveler's Wine (T1 Provision)

**Niche:** Social lubricant -- cheap sour wine that loosens tongues. A temporary heart boost that fades as the wine is drunk.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The original 0.04 heart becomes a decay effect -- wine is inherently temporary. Starting at 0.04 and losing 0.005 per tick, it lasts about 8 ticks (16 hours game-time) before it's gone. The destroyAtLimit removes the empty bottle. This is the quintessential provision pattern: starts strong, fades to nothing. Total reach value: 0.04 decaying.

---

## 24. Hardtack and Salt (T1 Provision)

**Niche:** Imperishable trail rations -- no flavor, pure function. Endurance food that provides steady, boring sustenance.

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
    // reachBonus removed — migrated to effects[]
    // flesh reach remapped to iron (physical endurance / sustained energy)
  } as PossessionNodeProperties,
},
```

**Design notes:** Flesh 0.03 remaps to iron -- hardtack is about physical endurance, keeping the body going, which is iron's domain of toughness and labor. The conditional in_wilderness reflects that trail rations matter most when you're far from settlements and can't resupply. In town, you'd eat something better. Total reach value: 0.03 passive + 0.02 conditional = 0.05 max.

---

## 25. Full Waterskin (T1 Provision)

**Niche:** Essential hydration -- clean water is survival. A decaying resource that fades as the water is consumed.

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
    // reachBonus removed — migrated to effects[]
    // flesh reach remapped to iron (hydration sustains physical capacity)
  } as PossessionNodeProperties,
},
```

**Design notes:** Flesh 0.03 remaps to iron (hydration sustains physical capacity). Water is the ultimate decaying provision -- it runs out. Starting at 0.03 iron and losing 0.003 per tick, it lasts about 10 ticks (roughly 20 hours game-time). The destroyAtLimit removes the empty skin. Total reach value: 0.03 decaying.

---

## 26. Firestarter Kit (T1 Provision)

**Niche:** Survival essential -- the difference between living and dying. Limited charges of fire-starting, each one a burst of warmth and capability.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.03 stone (having fire-making tools is a baseline craft capability). The consumable_charge represents actual fire-starts -- each use is a burst of stone capability (building, warming, forging). Three charges before the tinder is gone. Total reach value: 0.03 passive + 0.03 per charge.

---

## 27. Healing Poultice (T2 Provision)

**Niche:** Field medicine, T2 grade -- moss, spider silk, and bitter compounds. A healing burst that starts strong and fades as the body absorbs it.

```typescript
{
  id: 'reward_provisions_healing_poultice',
  type: 'artifact',
  name: 'Healing Poultice',
  properties: {
    subcategory: 'provisions',
    tier: 2,
    tags: ['#potion', '#provision', '#flesh', '#healing', '#wilderness'],
    mechanicalSummary: '+0.07 Heart, decays -0.007/tick to 0 (poultice absorbed)',
    lossCondition: 'consumable',
    flavorText: 'Moss, spider silk, and something bitter. Applied to wounds, it numbs and knits.',
    effects: [
      { type: 'decay', reach: 'heart', startValue: 0.07, changePerTick: -0.007, limitValue: 0, destroyAtLimit: true },
    ],
    // reachBonus removed — migrated to effects[]
    // flesh reach remapped to heart (wound care / healing empathy)
  } as PossessionNodeProperties,
},
```

**Design notes:** Flesh 0.07 remaps to heart -- applying poultices is tending, caring, which maps to heart. The decay effect captures the poultice's nature perfectly: strong initial healing that fades as the body absorbs the medicine. At -0.007/tick, it lasts about 10 ticks (~20 hours game-time). Total reach value: 0.07 decaying.

---

## 28. Sanctuary Incense (T2 Provision)

**Niche:** Sacred fumigant -- smoke that soothes troubled spirits. Temporary divine comfort with a lingering effect that persists until the incense is used up.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The original reachBonus values (0.06 star, 0.03 heart) become until_event effects -- incense burns and provides its benefit until you rest (sanctuary ends). The destroyOnEvent removes the incense after resting, since it's been fully consumed. This is a more interesting provision pattern than pure decay: you get full value until a specific trigger, then it's gone. Total reach value: 0.06 + 0.03 until rest.

---

## 29. Veilwater Flask (T3 Provision)

**Niche:** Arcane elixir -- perfectly clear liquid that casts no reflection. Drinking it peels back the veil between worlds, granting temporary omniscience at the mystical level.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both reach values become dual decay effects -- the veilwater wears off. Veil starts at 0.10 and fades over ~12 ticks; eye starts at 0.05 and fades similarly. The reveal effect for all hexes with a 12-tick duration captures "see the world peeled back" -- for a brief time, you see everything. The first decay has destroyAtLimit: true to destroy the attachment when the primary effect expires. For T3, dual decay + reveal is a dramatic one-shot composition. Total reach value: 0.10 + 0.05 decaying.

---

## MOUNTS & BEASTS

---

## 30. Draft Pony (T1 Mount)

**Niche:** Pack animal -- short-legged, ill-tempered, carries everything. Reduces movement cost and enables trade hauling.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.03 gold. The range_modifier with 0.9 movement cost (10% faster) reflects the pony's pack carrying ability -- you move faster because your goods are on the pony instead of your back. Simple, practical, T1 mount. Total reach value: 0.03 passive.

---

## 31. Tracking Hound (T1 Beast)

**Niche:** Scout companion -- scarred ears and a cold nose. Finds things you didn't know were lost. Amplifies exploration awareness.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.04 eye. The behavior_weight amplifies eye-reach encounter desire by 1.3x -- the hound's tracking instinct pulls the agent toward observation and discovery encounters. "It finds things you did not know were lost" maps perfectly to increased eye encounter weight. Total reach value: 0.04 passive.

---

## 32. Pack Goat (T1 Beast)

**Niche:** Mountain climber -- eats anything, climbs anything, carries supplies. A versatile wilderness companion with a bonus slot for consumables.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The passive preserves 0.03 stone. The slot_bonus for consumable captures the goat's role as pack carrier -- it carries an extra provision or consumable item that the agent couldn't carry alone. "Carries twice its weight" from the pony is about movement; "eats anything, climbs anything" from the goat is about expanding what you can bring. Total reach value: 0.03 passive.

---

## 33. Steppe Mare (T2 Mount)

**Niche:** Swift cavalry mount -- wind-quick and open-grassland bred. Fast movement with exploration range, plus reactive flight capability.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.05 gold, 0.03 iron). The range_modifier with 0.8 movement cost (20% faster) -- she runs fast. The reactive on damaged represents the mare's flight instinct: when the rider takes damage, the horse's adrenaline kicks in, providing a burst of movement/trade capability (gold) for 4 ticks. "She runs like she remembers open grassland" is a flight response. Total reach value: 0.05 + 0.03 passive + 0.04 reactive = 0.12 max.

---

## 34. War Hound (T2 Beast)

**Niche:** Combat companion -- bred for violence, trained to silence. Absolute loyalty, terrifying presence. Amplifies combat capability and grants initiative advantage.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.06 iron, 0.03 eye). The conditional in_combat iron bonus reflects the hound fighting alongside its master -- it's a weapon in fur. The social_modifier with -0.2 cooperation bias toward enemies means the hound's presence makes enemies less willing to negotiate -- "Its loyalty is absolute and terrifying" means opponents face both master and beast. Total reach value: 0.06 + 0.03 passive + 0.03 conditional = 0.12 max.

---

## 35. Ashenmane Destrier (T3 Mount)

**Niche:** Legendary warhorse -- grey as smoke, born on a battlefield, never left one. Peak combat mount with cavalry charge capability and fearless temperament.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved (0.10 iron, 0.05 gold). The range_modifier provides speed (20% faster). The trait_grant unlocks cavalry_charge -- a qualitative capability for mounted combat encounters. The behavior_weight amplifies iron encounter desire by 1.4x -- "born on a battlefield, never left one" means the destrier and rider seek combat. For T3, passive + range_modifier + trait_grant + behavior_weight is a rich 5-effect composition that makes this the definitive warhorse. Total reach value: 0.10 + 0.05 passive.

---

## STARTER ATTACHMENTS

---

## 36. Ashenmane's Fang (Starter, T2 Arms)

**Niche:** Legendary beast trophy -- pulled from a monster's jaw. Raw combat power from a storied kill. Currently has a dead reachBonus and nonsensical mechanicalSummary.

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
    // reachBonus removed — migrated to effects[]
    // mechanicalSummary fixed — old one referenced nonexistent "Fang reach"
  } as PossessionNodeProperties,
},
```

**Design notes:** The old mechanicalSummary said "+0.15 Iron, +0.05 Fang reach" -- "Fang" is not a valid reach domain. The reachBonus was iron: 0.08 only. The passive preserves that 0.08. The conditional in_combat adds +0.04 iron -- wielding a monster's fang in battle channels the beast's fury. This brings total combat potential to 0.12, fitting for a T2 legendary trophy. Total reach value: 0.08 passive + 0.04 conditional = 0.12 max.

---

## 37. Road-Worn Mule (Starter, T1 Mount)

**Niche:** Stubborn pack animal -- strong legs, stronger opinions. Basic travel companion that carries goods and reduces movement cost.

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
    // reachBonus removed — migrated to effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The reachBonus of gold: 0.03 becomes a passive. The range_modifier with 0.9 movement cost gives the same 10% speed benefit as the Draft Pony -- mules and ponies fill the same niche at T1. "Strong legs" = faster movement. Total reach value: 0.03 passive.

---

## 38. Ashenmane Horse (Starter, T2 Mount)

**Niche:** Endurance cavalry mount -- bred in the western reaches, runs until its heart gives out. Speed plus the cavalry_charge trait for mounted combat.

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
    // reachBonus removed (had none) — old mechanicalSummary said "+movement_speed, grants cavalry_charge" with no numerical effects
  } as PossessionNodeProperties,
},
```

**Design notes:** The original had no reachBonus, so no passives to preserve. The old mechanicalSummary was "+movement_speed, grants cavalry_charge" -- entirely qualitative. Now expressed as real effects: range_modifier at 0.8 (20% faster, matching the Steppe Mare as a T2 mount), and trait_grant for cavalry_charge. "Run until their hearts give out" = pure speed. Total reach value: 0 passive (all qualitative).

---

## 39. Copper Market Rations (Starter, T1 Provision)

**Niche:** Basic travel food -- dried meat, hard bread, a waterskin. Temporary sustenance that fades as it's consumed.

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
    // Old mechanicalSummary said "+movement for 3 ticks" — no numerical effects existed; now expressed as decaying iron sustenance
  } as PossessionNodeProperties,
},
```

**Design notes:** The original had no reachBonus and a vague mechanicalSummary ("+movement for 3 ticks"). Now expressed as a decaying iron effect -- food sustains physical endurance (iron) but runs out. Starting at 0.03 and losing 0.003/tick, lasts ~10 ticks (~20 hours). Rations are the most mundane of provisions. Total reach value: 0.03 decaying.

---

## 40. Burned Codex (Starter, T2 Tome)

**Niche:** Half-destroyed tome of forbidden knowledge -- the surviving pages whisper dark truths. Currently has onUseTriggers but no effects[]. Add the passive layer beneath the existing trigger system.

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
    // No reachBonus existed — old mechanicalSummary said "+0.10 Star, grants dark_knowledge" but had no effects
    // Keeping existing onUseTriggers intact — they are a separate system from effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** The original had no reachBonus or effects[], just onUseTriggers. The old mechanicalSummary claimed "+0.10 Star" but nothing delivered it mechanically. New effects provide a real passive star bonus (0.06, conservative for a half-burned book) and a conditional eye bonus in exploration (studying fragments in the field). The existing onUseTrigger for the revelation condition is preserved unchanged. For T2, passive + conditional + onUseTrigger interaction is appropriate. Total reach value: 0.06 passive + 0.03 conditional = 0.09 max (plus onUseTrigger).

---

## 41. The Whispering Eye (Starter, T3 Relic)

**Niche:** Cursed omniscience artifact -- sees what you cannot, shows what you must not know. Massive eye power at devastating heart cost. Currently has reachBonus and onUseTriggers but no effects[].

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
    // reachBonus removed — migrated to effects[]
    // Old mechanicalSummary said "+0.20 Eye, -0.10 Heart" but reachBonus was only eye: 0.08, heart: -0.04
    // Keeping existing onUseTriggers intact — they are a separate system from effects[]
  } as PossessionNodeProperties,
},
```

**Design notes:** Both passives preserved exactly from reachBonus (0.08 eye, -0.04 heart). The old mechanicalSummary claimed "+0.20 Eye, -0.10 Heart" but the actual reachBonus was much lower -- the summary is corrected. The reveal for attachments within 2 hexes fits "It sees what you cannot" -- the Eye reveals what others are carrying. The reactive on cursed deepens the heart penalty when additional curses land -- "shows what you must not know" makes curse experiences worse. The existing onUseTrigger is preserved. For T3, passive + reveal + reactive + onUseTrigger is a rich cursed artifact. Total reach value: 0.08 - 0.04 passive.

---

## Summary Table

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Wayfarer's Charm | T1 | Traveler's social talisman | passive + conditional | 0.05 max | +effects[], -reachBonus, updated summary |
| 2 | Bone Ward | T1 | Primal body protection | passive + tag_immunity | 0.04 | +effects[], -reachBonus, flesh->iron, updated summary |
| 3 | Ember Sigil | T2 | Divine fire amplifier | passive x2 + reactive(duration) | 0.12 max | +effects[], -reachBonus, updated summary |
| 4 | Shadowglass Pendant | T2 | Stealth scout pendant | passive + reveal | 0.07 | +effects[], -reachBonus, updated summary |
| 5 | Heart of the Barrow | T3 | Ancient earth anchor | passive x2 + aura + stacking | 0.13 max | +effects[], -reachBonus, updated summary |
| 6 | The Weeping Icon | T3 | Empathic curse relic | passive x2 + reactive(duration) + axiological_drift | 0.09 max | +effects[], -reachBonus, updated summary |
| 7 | The Fulcrum | T4 | Reality anchor | passive x2 + aura + conditional + test_shaper | 0.15+ | +effects[], -reachBonus, updated summary |
| 8 | Field Journal | T1 | Naturalist's field notes | passive + conditional | 0.05 max | +effects[], -reachBonus, updated summary |
| 9 | Prayer Scroll | T1 | Fading divine invocation | passive + consumable_charge | 0.04+ | +effects[], -reachBonus, updated summary |
| 10 | Merchant's Ledger | T1 | Trade intelligence | passive + conditional | 0.06 max | +effects[], -reachBonus, updated summary |
| 11 | Chronicle of the Falling | T2 | Scholarly warning text | passive + test_shaper | 0.08 | +effects[], -reachBonus, updated summary |
| 12 | Veilscript Fragment | T2 | Living cipher text | passive x2 + stacking | 0.12 max | +effects[], -reachBonus, updated summary |
| 13 | Smuggler's Chart | T1 | Underworld navigation | passive + conditional | 0.05 max | +effects[], -reachBonus, updated summary |
| 14 | Codex of Unmaking | T4 | Apocalyptic grimoire | passive x2 + action_gate + reveal + axiological_drift | 0.15-0.08 | +effects[], -reachBonus, updated summary |
| 15 | The Silent Testament | T3 | Dead god's eulogy | passive x2 + prevent_loss + conditional | 0.18 max | +effects[], -reachBonus, updated summary |
| 16 | Surveyor's Glass | T1 | Observation lens | passive + range_modifier | 0.04 | +effects[], -reachBonus, updated summary |
| 17 | Iron Tongs | T1 | Blacksmith's tool | passive + conditional | 0.05 max | +effects[], -reachBonus, updated summary |
| 18 | Herbalist's Pouch | T1 | Field medicine kit | passive + consumable_charge | 0.04+ | +effects[], -reachBonus, flesh->heart, updated summary |
| 19 | Gate Seal Case | T1 | Bureaucratic authority | passive x2 + conditional | 0.07 max | +effects[], -reachBonus, updated summary |
| 20 | Master Chisel | T2 | Guild craft mastery | passive + stacking | 0.12 max | +effects[], -reachBonus, updated summary |
| 21 | Alchemist's Crucible | T2 | Arcane lab instrument | passive x2 + cooldown | 0.13 max | +effects[], -reachBonus, updated summary |
| 22 | Astrolabe of Yven | T3 | Celestial navigator | passive x2 + reveal + conditional | 0.18 max | +effects[], -reachBonus, updated summary |
| 23 | Traveler's Wine | T1 | Social lubricant | decay | 0.04 decaying | +effects[], -reachBonus, updated summary |
| 24 | Hardtack and Salt | T1 | Trail endurance | passive + conditional | 0.05 max | +effects[], -reachBonus, flesh->iron, updated summary |
| 25 | Full Waterskin | T1 | Essential hydration | decay | 0.03 decaying | +effects[], -reachBonus, flesh->iron, updated summary |
| 26 | Firestarter Kit | T1 | Fire-making charges | passive + consumable_charge | 0.03+ | +effects[], -reachBonus, updated summary |
| 27 | Healing Poultice | T2 | Field medicine | decay | 0.07 decaying | +effects[], -reachBonus, flesh->heart, updated summary |
| 28 | Sanctuary Incense | T2 | Sacred fumigant | until_event x2 | 0.09 until rest | +effects[], -reachBonus, updated summary |
| 29 | Veilwater Flask | T3 | Arcane elixir | decay x2 + reveal | 0.15 decaying | +effects[], -reachBonus, updated summary |
| 30 | Draft Pony | T1 | Pack carrier | passive + range_modifier | 0.03 | +effects[], -reachBonus, updated summary |
| 31 | Tracking Hound | T1 | Scout companion | passive + behavior_weight | 0.04 | +effects[], -reachBonus, updated summary |
| 32 | Pack Goat | T1 | Mountain pack animal | passive + slot_bonus | 0.03 | +effects[], -reachBonus, updated summary |
| 33 | Steppe Mare | T2 | Swift cavalry mount | passive x2 + range_modifier + reactive(duration) | 0.12 max | +effects[], -reachBonus, updated summary |
| 34 | War Hound | T2 | Combat companion | passive x2 + conditional + social_modifier | 0.12 max | +effects[], -reachBonus, updated summary |
| 35 | Ashenmane Destrier | T3 | Legendary warhorse | passive x2 + range_modifier + trait_grant + behavior_weight | 0.15 | +effects[], -reachBonus, updated summary |
| 36 | Ashenmane's Fang | T2 | Beast trophy weapon | passive + conditional | 0.12 max | +effects[], -reachBonus, fixed summary |
| 37 | Road-Worn Mule | T1 | Stubborn pack mule | passive + range_modifier | 0.03 | +effects[], -reachBonus, updated summary |
| 38 | Ashenmane Horse | T2 | Endurance cavalry | range_modifier + trait_grant | 0 passive | +effects[], updated summary |
| 39 | Copper Market Rations | T1 | Basic travel food | decay | 0.03 decaying | +effects[], updated summary |
| 40 | Burned Codex | T2 | Forbidden fragment tome | passive + conditional | 0.09 max | +effects[], updated summary, kept onUseTriggers |
| 41 | The Whispering Eye | T3 | Cursed omniscience | passive x2 + reveal + reactive(duration) | 0.08-0.04 | +effects[], -reachBonus, fixed summary, kept onUseTriggers |

### Primitive Distribution

| Primitive | Count | Items |
|-----------|-------|-------|
| passive | 37 | Nearly all items (base layer) |
| conditional | 14 | Wayfarer's, Field Journal, Merchant's, Smuggler's, Gate Seal, Iron Tongs, Hardtack, War Hound, Astrolabe, Fulcrum, Silent Testament, Ashenmane Fang, Burned Codex, Steppe Mare (as part of reactive) |
| decay | 5 | Traveler's Wine, Waterskin, Copper Market Rations, Healing Poultice, Veilwater Flask |
| consumable_charge | 3 | Prayer Scroll, Herbalist's Pouch, Firestarter Kit |
| reactive(duration) | 4 | Ember Sigil, Weeping Icon, Steppe Mare, Whispering Eye |
| reveal | 4 | Shadowglass Pendant, Codex of Unmaking, Veilwater Flask, Astrolabe of Yven, Whispering Eye |
| range_modifier | 5 | Surveyor's Glass, Draft Pony, Road-Worn Mule, Steppe Mare, Ashenmane Destrier, Ashenmane Horse |
| stacking | 3 | Barrow, Veilscript, Master Chisel |
| behavior_weight | 2 | Tracking Hound, Ashenmane Destrier |
| trait_grant | 2 | Ashenmane Destrier, Ashenmane Horse |
| test_shaper | 2 | Chronicle of the Falling, The Fulcrum |
| tag_immunity | 1 | Bone Ward |
| aura | 2 | Heart of the Barrow, The Fulcrum |
| axiological_drift | 2 | Weeping Icon, Codex of Unmaking |
| social_modifier | 1 | War Hound |
| until_event | 1 | Sanctuary Incense |
| action_gate | 1 | Codex of Unmaking |
| prevent_loss | 1 | Silent Testament |
| cooldown | 1 | Alchemist's Crucible |
| slot_bonus | 1 | Pack Goat |
| tradeoff | 0 | (used in arms batch already; not natural for these categories) |

**19 distinct primitives** used across the batch, with good distribution. Every item has at least one non-passive effect. The Codex of Unmaking and The Fulcrum (both T4) have the richest compositions at 5 effects each.
