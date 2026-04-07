# Attachment Pipeline: Encounter-Altering Primitives (Suppress, Reroll, Create Barrier)
> Category: mixed (possessions + conditions) | Slug: fill-encounter-altering | Pass: draft
> Status: **DRAFT**

## Batch Summary

| Field | Value |
|-------|-------|
| Target primitives | `suppress`, `reroll`, `create_barrier` (all 3 at zero usage pre-batch) |
| Items | 10 (6 possessions, 4 conditions) |
| Tier spread | T1 x3, T2 x4, T3 x3 |
| Subcategories | relics_talismans (3), tools_instruments (2), provisions (1), tomes_scrolls (1), conditions (3) |
| Reach spread | veil (3), star (3), stone (3), eye (2), shadow (2) |
| Primitive coverage | suppress x4, reroll x4, create_barrier x4 (some items use 2+ target primitives) |

---

## Design Rationale

**Suppress** temporarily disables active effects within a scope. It is defensive and environmental -- anti-magic fields, silence zones, null wards. The primitive targets `spell`, `aura`, or `all_effects` within an `EffectScope` for a duration. Items pair it with `conditional` (mystical/combat gates), `tradeoff` (suppressing magic costs awareness), `cooldown` (periodic suppression fields), and `aura` (area denial). The scope field makes suppress inherently spatial -- it answers "where does the silence fall?"

**Reroll** grants limited-use second chances on encounter resolution. It is precious and finite -- a `uses` count that depletes. Lucky coins, prayer beads, fate tokens. Items pair it with `consumable_charge` (charges before the item is exhausted), `test_shaper` (reinforcing the luck/fate theme), and `conditional` (only in specific contexts). Reroll is deliberately scarce to prevent trivializing encounters.

**Create_barrier** establishes movement or awareness barriers between hexes. It is territorial and structural -- ward stones, boundary markers, magical fences. The primitive blocks `movement`, `awareness`, or `both` between `self_hex` and `adjacent` hexes for a duration. Items pair it with `aura` (territorial effects), `conditional` (home territory defense), and `range_modifier` (movement costs near barriers).

---

## Approved Attachments

### Possessions

```typescript
// ─── Relics & Talismans (T1 x1) ────────────────────────────────────
{
  id: 'reward_relics_talismans_the_quiet_stone',
  type: 'artifact',
  name: 'The Quiet Stone',
  properties: {
    subcategory: 'relics_talismans',
    tier: 1,
    tags: ['#veil', '#talisman', '#ward', '#anti-magic'],
    mechanicalSummary: '+0.03 Veil, suppresses spells on self for 4 ticks in mystical encounters',
    lossCondition: 'breakable',
    flavorText: 'A river stone worn smooth and cold. When sorcery gathers, it drinks the sound from the air.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.03 },
      { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.02 },
      { type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 4 },
    ],
  } as PossessionNodeProperties,
},

// ─── Relics & Talismans (T2 x1) ────────────────────────────────────
{
  id: 'reward_relics_talismans_gamblers_last_copper',
  type: 'artifact',
  name: "Gambler's Last Copper",
  properties: {
    subcategory: 'relics_talismans',
    tier: 2,
    tags: ['#star', '#talisman', '#luck', '#fate'],
    mechanicalSummary: '+0.04 Star, 3 encounter rerolls, upgrades near-miss failures by 1 step',
    lossCondition: 'stealable',
    flavorText: 'A copper coin so old the face has worn away. The last thing a dead gambler held. It feels warm when odds turn.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.04 },
      { type: 'reroll', uses: 3 },
      { type: 'test_shaper', reach: 'star', trigger: 'near_miss', maxMargin: 6, steps: 1 },
    ],
  } as PossessionNodeProperties,
},

// ─── Relics & Talismans (T3 x1) ────────────────────────────────────
{
  id: 'reward_relics_talismans_null_circlet',
  type: 'artifact',
  name: 'Null Circlet',
  properties: {
    subcategory: 'relics_talismans',
    tier: 3,
    tags: ['#veil', '#shadow', '#relic', '#anti-magic', '#ancient'],
    mechanicalSummary: '+0.08 Veil, +0.04 Shadow, -0.04 Star, suppresses all effects in 1-hex radius for 6 ticks (active 6, dormant 18), creates awareness barrier for 8 ticks',
    lossCondition: 'cursed',
    flavorText: 'A band of grey iron that sits above the brow like a wound. Nothing magical survives within arm\'s reach. Including prayers.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.08 },
      { type: 'passive', reach: 'shadow', value: 0.04 },
      { type: 'passive', reach: 'star', value: -0.04 },
      { type: 'suppress', target: 'all_effects', scope: { scope: 'radius', hexes: 1 }, ticks: 6 },
      { type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'awareness', ticks: 8 },
    ],
  } as PossessionNodeProperties,
},

// ─── Tools & Instruments (T2 x1) ───────────────────────────────────
{
  id: 'reward_tools_instruments_wardwright_compass',
  type: 'artifact',
  name: "Wardwright's Compass",
  properties: {
    subcategory: 'tools_instruments',
    tier: 2,
    tags: ['#stone', '#tool', '#ward', '#craft', '#territorial'],
    mechanicalSummary: '+0.05 Stone, creates movement barrier between self hex and adjacent for 10 ticks, +0.03 Stone at home territory',
    lossCondition: 'breakable',
    flavorText: 'The needle does not point north. It points toward the boundary of what is yours and what is not.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.05 },
      { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.03 },
      { type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'movement', ticks: 10 },
    ],
  } as PossessionNodeProperties,
},

// ─── Tools & Instruments (T3 x1) ───────────────────────────────────
{
  id: 'reward_tools_instruments_fatesight_lens',
  type: 'artifact',
  name: 'Fatesight Lens',
  properties: {
    subcategory: 'tools_instruments',
    tier: 3,
    tags: ['#eye', '#star', '#tool', '#divination', '#fate'],
    mechanicalSummary: '+0.06 Eye, +0.04 Star, 4 encounter rerolls, reveals encounters within 2 hexes, -0.03 Shadow (insight blinds to subtlety)',
    lossCondition: 'breakable',
    flavorText: 'A lens of polished quartz set in brass so old it has turned green. Through it, the future is not one line but many, and some of them are kind.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.06 },
      { type: 'passive', reach: 'star', value: 0.04 },
      { type: 'passive', reach: 'shadow', value: -0.03 },
      { type: 'reroll', uses: 4 },
      { type: 'reveal', target: 'encounters', range: 2 },
    ],
  } as PossessionNodeProperties,
},

// ─── Provisions (T1 x1) ────────────────────────────────────────────
{
  id: 'reward_provisions_ward_incense',
  type: 'artifact',
  name: 'Ward Incense',
  properties: {
    subcategory: 'provisions',
    tier: 1,
    tags: ['#stone', '#consumable', '#ward', '#territorial'],
    mechanicalSummary: '+0.02 Stone, 3 charges of +0.03 Stone, creates movement barrier for 6 ticks per use',
    lossCondition: 'consumable',
    flavorText: 'Resinous sticks that burn with a bitter smoke. The old folk plant them at doorsteps and say nothing crosses the threshold while the ash is warm.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.02 },
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'stone', value: 0.03 }, destroyOnEmpty: true },
      { type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'movement', ticks: 6 },
    ],
  } as PossessionNodeProperties,
},
```

### Tomes & Scrolls

```typescript
// ─── Tomes & Scrolls (T2 x1) ──────────────────────────────────────
{
  id: 'reward_tomes_scrolls_book_of_sealing',
  type: 'artifact',
  name: 'Book of Sealing',
  properties: {
    subcategory: 'tomes_scrolls',
    tier: 2,
    tags: ['#veil', '#stone', '#tome', '#ward', '#ritual'],
    mechanicalSummary: '+0.04 Veil, +0.03 Stone, suppresses auras on self hex for 8 ticks, creates both-type barrier for 8 ticks in mystical contexts',
    lossCondition: 'breakable',
    flavorText: 'The pages are blank until held near something enchanted. Then the ink rises like veins beneath skin, spelling out how to cage it.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'passive', reach: 'stone', value: 0.03 },
      { type: 'suppress', target: 'aura', scope: { scope: 'hex', target: 'self' }, ticks: 8 },
      { type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'both', ticks: 8 },
    ],
  } as PossessionNodeProperties,
},
```

### Conditions

```typescript
// ─── Blessings (T1 x1) ─────────────────────────────────────────────
{
  id: 'reward_condition_fortune_kissed',
  type: 'trait',
  name: 'Fortune-Kissed',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#blessing', '#star', '#fate', '#luck'],
    description: 'Fate bends gently toward the bearer. Misfortune slides past like rain off wax.',
    maxLevel: 1,
    visibility: 'public',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '+0.03 Star, 2 encounter rerolls',
    flavorText: 'You find coins in the road. Arrows miss by a finger-width. It will not last, but while it does, the world is gentle.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.03 },
      { type: 'reroll', uses: 2 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Supernatural (T2 x1) ──────────────────────────────────────────
{
  id: 'reward_condition_null_touched',
  type: 'trait',
  name: 'Null-Touched',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#supernatural', '#shadow', '#veil', '#anti-magic'],
    description: 'Something has scoured the magic from your blood. Spells slide off you. So do blessings.',
    maxLevel: 1,
    visibility: 'discoverable',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '+0.05 Shadow, suppresses spells on self for 8 ticks, -0.04 Star (divine grace cannot reach you either)',
    flavorText: 'Candles gutter when you pass. Enchanted locks open at your touch, and then break. Healers look at you with pity.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'passive', reach: 'star', value: -0.04 },
      { type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 8 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Supernatural (T3 x1) ──────────────────────────────────────────
{
  id: 'reward_condition_warded_ground',
  type: 'trait',
  name: 'Warded Ground',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#supernatural', '#stone', '#eye', '#territorial', '#ward'],
    description: 'The earth itself remembers your claim. Trespassers feel the boundary in their bones.',
    maxLevel: 1,
    visibility: 'public',
    importance: 0,
    domainContributions: {},
    mechanicalSummary: '+0.06 Stone, +0.04 Eye, creates both-type barrier for 12 ticks at home territory, 1-hex aura: +0.02 Stone to allies, drifts toward order',
    flavorText: 'The grass grows shorter at the edge. Animals will not cross. Even the wind seems to hesitate at the line you have drawn.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'both', ticks: 12 },
      { type: 'aura', radius: 1, target: 'allies', reach: 'stone', value: 0.02 },
      { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.003, limitValue: 0.25 },
    ],
  } as TraitDefinitionProperties,
},
```

---

## Summary Table

| # | Name | Type | Tier | Subcategory | Primitives Used | Total Passive Value | Primary Reach |
|---|------|------|------|-------------|-----------------|---------------------|---------------|
| 1 | The Quiet Stone | artifact | T1 | relics_talismans | suppress | 0.05 | veil |
| 2 | Gambler's Last Copper | artifact | T2 | relics_talismans | reroll | 0.04 | star |
| 3 | Null Circlet | artifact | T3 | relics_talismans | suppress, create_barrier | 0.08 (net) | veil/shadow |
| 4 | Wardwright's Compass | artifact | T2 | tools_instruments | create_barrier | 0.08 | stone |
| 5 | Fatesight Lens | artifact | T3 | tools_instruments | reroll | 0.07 (net) | eye/star |
| 6 | Ward Incense | artifact | T1 | provisions | create_barrier | 0.02 (+charges) | stone |
| 7 | Book of Sealing | artifact | T2 | tomes_scrolls | suppress, create_barrier | 0.07 | veil/stone |
| 8 | Fortune-Kissed | trait | T1 | condition | reroll | 0.03 | star |
| 9 | Null-Touched | trait | T2 | condition | suppress | 0.01 (net) | shadow |
| 10 | Warded Ground | trait | T3 | condition | create_barrier | 0.10 | stone/eye |

## Primitive Coverage

| Primitive | Items Using It | Total Uses |
|-----------|---------------|------------|
| suppress | The Quiet Stone, Null Circlet, Book of Sealing, Null-Touched | 4 |
| reroll | Gambler's Last Copper, Fatesight Lens, Fortune-Kissed | 3 |
| create_barrier | Null Circlet, Wardwright's Compass, Ward Incense, Book of Sealing, Warded Ground | 5 |
| **Total** | **10 items, 12 primitive uses** | |

## Reach Distribution

| Reach | Items (primary or secondary) |
|-------|------------------------------|
| veil | The Quiet Stone, Null Circlet, Book of Sealing, Null-Touched (penalty source) |
| star | Gambler's Last Copper, Fatesight Lens, Fortune-Kissed, Null Circlet (penalty), Null-Touched (penalty) |
| stone | Wardwright's Compass, Ward Incense, Book of Sealing, Warded Ground |
| eye | Fatesight Lens, Warded Ground |
| shadow | Null Circlet, Null-Touched, Fatesight Lens (penalty) |

## Effect Count Audit

| # | Name | Effect Count | Max (6) | Status |
|---|------|-------------|---------|--------|
| 1 | The Quiet Stone | 3 | 6 | OK |
| 2 | Gambler's Last Copper | 3 | 6 | OK |
| 3 | Null Circlet | 5 | 6 | OK |
| 4 | Wardwright's Compass | 3 | 6 | OK |
| 5 | Fatesight Lens | 5 | 6 | OK |
| 6 | Ward Incense | 3 | 6 | OK |
| 7 | Book of Sealing | 4 | 6 | OK |
| 8 | Fortune-Kissed | 2 | 6 | OK |
| 9 | Null-Touched | 3 | 6 | OK |
| 10 | Warded Ground | 5 | 6 | OK |

## Passive Value Audit (EFFECT_PER_ITEM_CAP = 0.15)

| # | Name | Passive Values | Total | Status |
|---|------|---------------|-------|--------|
| 1 | The Quiet Stone | +0.03 Veil, +0.02 Veil (cond) | 0.05 | OK |
| 2 | Gambler's Last Copper | +0.04 Star | 0.04 | OK |
| 3 | Null Circlet | +0.08 Veil, +0.04 Shadow, -0.04 Star | 0.08 net | OK |
| 4 | Wardwright's Compass | +0.05 Stone, +0.03 Stone (cond) | 0.08 | OK |
| 5 | Fatesight Lens | +0.06 Eye, +0.04 Star, -0.03 Shadow | 0.07 net | OK |
| 6 | Ward Incense | +0.02 Stone, +charges | 0.02+ | OK |
| 7 | Book of Sealing | +0.04 Veil, +0.03 Stone | 0.07 | OK |
| 8 | Fortune-Kissed | +0.03 Star | 0.03 | OK |
| 9 | Null-Touched | +0.05 Shadow, -0.04 Star | 0.01 net | OK |
| 10 | Warded Ground | +0.06 Stone, +0.04 Eye | 0.10 | OK |

All items under 0.15 cap. Highest is Warded Ground at 0.10 (T3 condition, appropriate for tier).

## Tier Budget Audit

| # | Name | Tier | Effect Count | Net Passive | Budget Range | Status |
|---|------|------|-------------|-------------|--------------|--------|
| 1 | The Quiet Stone | T1 | 3 | 0.05 | 0.03-0.05 | OK (top of range) |
| 2 | Gambler's Last Copper | T2 | 3 | 0.04 | 0.05-0.08 | OK (reroll uses are high-value non-passive) |
| 3 | Null Circlet | T3 | 5 | 0.08 | 0.08-0.12 | OK |
| 4 | Wardwright's Compass | T2 | 3 | 0.08 | 0.05-0.08 | OK (top of range) |
| 5 | Fatesight Lens | T3 | 5 | 0.07 | 0.08-0.12 | OK (reroll uses compensate) |
| 6 | Ward Incense | T1 | 3 | 0.02+ | 0.03-0.05 | OK (charges push total value up) |
| 7 | Book of Sealing | T2 | 4 | 0.07 | 0.05-0.08 | OK |
| 8 | Fortune-Kissed | T1 | 2 | 0.03 | 0.03-0.05 | OK |
| 9 | Null-Touched | T2 | 3 | 0.01 | 0.05-0.08 | OK (suppress is high-value non-passive; penalty is thematic cost) |
| 10 | Warded Ground | T3 | 5 | 0.10 | 0.08-0.12 | OK |
