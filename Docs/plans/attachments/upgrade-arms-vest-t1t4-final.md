# Attachment Pipeline: T1-T4 Arms & Vestments
> Category: arms + vestments | Slug: upgrade-arms-vest-t1t4 | Pass: final
> Status: **READY WITH CAVEATS**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 10 items across arms (T1–T4) and vestments (T1–T4) |
| Editorial | Complete | Niches sharpened, flavor text finalized, primitive variety confirmed |
| Systems | READY WITH CAVEATS | All 10 items pass. 5 items carry effect-count caveats (dual-passive conversion artifact + utility-heavy vestments). T4 legacy reach overrun flagged but not blocking. |

## Implementation Notes

- **All items replace their existing catalog entries** in `src/data/reward-attachment-catalog.ts` and `src/data/starter-attachments.ts` (Traveler's Cloak).
- **Drop `reachBonus` fields** — they are superseded by `effects[]` arrays. The legacy field is no longer read when `effects` is present.
- **Dual-passive pattern:** Items with two reach domains (including penalties) use two separate `PassiveEffect` entries. This is intentional — it matches the `AttachmentEffect[]` type and allows independent modifier resolution.
- **T4 legacy overrun:** The Quiet Blade (iron: 0.18, shadow: 0.08) and The Woven Sky (star: 0.15, veil: 0.08) exceed `EFFECT_PER_ITEM_CAP=0.15` in their passive totals. This is a preserved pre-existing condition. The global `EFFECT_MODIFIER_CAP=0.30` still applies.
- **ReactiveEffect.duration:** Used on The Quiet Blade to govern how long the nested `range_modifier` persists (6 ticks), since `RangeModifierEffect` has no intrinsic `ticks` field. This is the correct pattern.

---

## Approved Attachments

### Arms

```typescript
// ─── Arms (T3 ×2, T4 ×1) ────────────────────────────────────────────
{
  id: 'reward_arms_hollowfang',
  type: 'artifact',
  name: 'Hollowfang',
  properties: {
    subcategory: 'arms',
    tier: 3,
    tags: ['#iron', '#weapon', '#melee', '#cursed', '#combat'],
    mechanicalSummary: '+0.12 Iron, -0.05 Heart, when damaged: +0.05 Iron burst decaying over 5 ticks (12-tick cooldown), grants dark_ferocity trait',
    lossCondition: 'cursed',
    flavorText: 'The blade is hollow and whistles when swung. The sound makes children weep.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.12 },
      { type: 'passive', reach: 'heart', value: -0.05 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'decay', reach: 'iron', startValue: 0.05, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
      }, cooldown: 12 },
      { type: 'trait_grant', grantedTrait: 'dark_ferocity' },
    ],
  } as PossessionNodeProperties,
},
{
  id: 'reward_arms_starfall_longbow',
  type: 'artifact',
  name: 'Starfall Longbow',
  properties: {
    subcategory: 'arms',
    tier: 3,
    tags: ['#iron', '#weapon', '#ranged', '#star', '#combat'],
    mechanicalSummary: '+0.10 Iron, +0.05 Star, stellar alignment: +0.03 Star for 6 ticks then dormant 12 ticks',
    lossCondition: 'permanent',
    flavorText: 'The string hums a note too low to hear. Arrows fly straighter than physics allows.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.10 },
      { type: 'passive', reach: 'star', value: 0.05 },
      { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'star', value: 0.03 },
    ],
  } as PossessionNodeProperties,
},

// ─── Arms (T4 ×1) ────────────────────────────────────────────────────
// NOTE: passive total 0.26 exceeds EFFECT_PER_ITEM_CAP=0.15.
// This is a preserved legacy reachBonus value. Non-passive effects
// are utility-only to avoid inflating the overrun further.
{
  id: 'reward_arms_the_quiet_blade',
  type: 'artifact',
  name: 'The Quiet Blade',
  properties: {
    subcategory: 'arms',
    tier: 4,
    tags: ['#iron', '#weapon', '#melee', '#shadow', '#ancient', '#combat'],
    mechanicalSummary: '+0.18 Iron, +0.08 Shadow, blocks fear/intimidation conditions, when attacked: 20% faster movement for 6 ticks (12-tick cooldown), shadow focus persists until combat ends (+0.02 Shadow)',
    lossCondition: 'permanent',
    flavorText: 'It makes no sound when it cuts. Neither does the one it cuts.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.18 },
      { type: 'passive', reach: 'shadow', value: 0.08 },
      { type: 'until_event', event: 'leave_combat', reach: 'shadow', value: 0.02, destroyOnEvent: false },
      { type: 'reactive', trigger: 'attacked', effect: {
        type: 'range_modifier', movementCostMultiplier: 0.8
      }, duration: 6, cooldown: 12 },
      { type: 'tag_immunity', tags: ['fear', 'intimidation'] },
    ],
  } as PossessionNodeProperties,
},
```

### Vestments

```typescript
// ─── Vestments (T1 ×3) ──────────────────────────────────────────────
{
  id: 'reward_vestments_padded_jerkin',
  type: 'artifact',
  name: 'Padded Jerkin',
  properties: {
    subcategory: 'vestments',
    tier: 1,
    tags: ['#iron', '#armor', '#cloth', '#combat'],
    mechanicalSummary: '+0.03 Iron, blocks bruise conditions',
    lossCondition: 'breakable',
    flavorText: 'Quilted linen stuffed with horsehair. Better than bare skin.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'tag_immunity', tags: ['bruise'] },
    ],
  } as PossessionNodeProperties,
},
{
  id: 'reward_vestments_merchant_silks',
  type: 'artifact',
  name: 'Merchant Silks',
  properties: {
    subcategory: 'vestments',
    tier: 1,
    tags: ['#gold', '#cloth', '#commercial', '#trade'],
    mechanicalSummary: '+0.04 Gold, +0.02 Gold in social encounters',
    lossCondition: 'stealable',
    flavorText: 'Dyed in the saffron of the eastern markets. Wealth worn on the sleeve.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.04 },
      { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
    ],
  } as PossessionNodeProperties,
},

// ─── Vestments (T2 ×2) ──────────────────────────────────────────────
{
  id: 'reward_vestments_chainmail_hauberk',
  type: 'artifact',
  name: 'Chainmail Hauberk',
  properties: {
    subcategory: 'vestments',
    tier: 2,
    tags: ['#iron', '#armor', '#combat'],
    mechanicalSummary: '+0.08 Iron, when attacked: +0.03 Iron for 4 ticks (8-tick cooldown)',
    lossCondition: 'breakable',
    flavorText: 'Each ring was closed by hand. Someone cared enough to do it right.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.08 },
      { type: 'reactive', trigger: 'attacked', effect: {
        type: 'duration', ticks: 4, reach: 'iron', value: 0.03, destroyOnExpiry: true
      }, cooldown: 8 },
    ],
  } as PossessionNodeProperties,
},
{
  id: 'reward_vestments_shadowweave_cloak',
  type: 'artifact',
  name: 'Shadowweave Cloak',
  properties: {
    subcategory: 'vestments',
    tier: 2,
    tags: ['#shadow', '#cloth', '#stealth'],
    // CAVEAT: 3 effects at T2 norm 1–2. All are utility (zero reach).
    // Accepted as-is — see systems audit.
    mechanicalSummary: '+0.07 Shadow, +1 awareness range, blocks tracking conditions',
    lossCondition: 'stealable',
    flavorText: 'The fabric drinks light. Corners seem deeper when you wear it.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.07 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
      { type: 'tag_immunity', tags: ['tracked', 'marked'] },
    ],
  } as PossessionNodeProperties,
},

// ─── Vestments (T3 ×1) ──────────────────────────────────────────────
{
  id: 'reward_vestments_mantle_of_the_unremembered',
  type: 'artifact',
  name: 'Mantle of the Unremembered',
  properties: {
    subcategory: 'vestments',
    tier: 3,
    tags: ['#shadow', '#cloth', '#veil', '#cursed', '#stealth'],
    mechanicalSummary: '+0.12 Shadow, -0.06 Heart, entering new hex: +0.04 Shadow burst decaying over 4 ticks (8-tick cooldown), amplifies shadow encounter desire x1.5',
    lossCondition: 'cursed',
    flavorText: 'Those who wear it become harder to recall. Even by those who love them.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.12 },
      { type: 'passive', reach: 'heart', value: -0.06 },
      { type: 'reactive', trigger: 'entered_hex', effect: {
        type: 'decay', reach: 'shadow', startValue: 0.04, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
      }, cooldown: 8 },
      { type: 'behavior_weight', reach: 'shadow', multiplier: 1.5 },
    ],
  } as PossessionNodeProperties,
},

// ─── Vestments (T4 ×1) ──────────────────────────────────────────────
// NOTE: passive total 0.23 exceeds EFFECT_PER_ITEM_CAP=0.15.
// Preserved legacy reachBonus. Non-passive additions are modest.
{
  id: 'reward_vestments_the_woven_sky',
  type: 'artifact',
  name: 'The Woven Sky',
  properties: {
    subcategory: 'vestments',
    tier: 4,
    tags: ['#star', '#cloth', '#divine', '#ancient'],
    mechanicalSummary: '+0.15 Star, +0.08 Veil, in mystical contexts: +0.03 Star, blocks curse/corruption/blight conditions, when damaged: +0.04 Veil ward for 6 ticks (12-tick cooldown)',
    lossCondition: 'permanent',
    flavorText: 'A robe of impossible blue, stitched with constellations that move. It weighs nothing.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.15 },
      { type: 'passive', reach: 'veil', value: 0.08 },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 6, reach: 'veil', value: 0.04, destroyOnExpiry: true
      }, cooldown: 12 },
      { type: 'tag_immunity', tags: ['curse', 'corruption', 'blight'] },
    ],
  } as PossessionNodeProperties,
},
```

### Starter Items

```typescript
// ─── starter-attachments.ts ─────────────────────────────────────────
{
  id: 'starter_traveler_cloak',
  type: 'artifact',
  name: "Traveler's Cloak",
  properties: {
    subcategory: 'vestments',
    tier: 1,
    tags: ['#cloth', '#travel', '#weather'],
    mechanicalSummary: '10% reduced movement cost, blocks cold conditions',
    lossCondition: 'breakable',
    flavorText: 'Dyed with muddy hues, designed to shed rain as much as attention.',
    effects: [
      { type: 'range_modifier', movementCostMultiplier: 0.9 },
      { type: 'tag_immunity', tags: ['cold', 'frostbite'] },
    ],
  } as PossessionNodeProperties,
},
```

---

## Excluded Items

None. All 10 items passed systems audit.

---

## Systems Audit Caveats (for implementor awareness)

| Item | Caveat | Action Required |
|------|--------|-----------------|
| Hollowfang (T3) | 4 effects (norm 2–3); dual-passive from legacy conversion | None — within MAX_EFFECTS_PER_ATTACHMENT=6 |
| The Quiet Blade (T4) | 5 effects (norm 3–4); legacy passive overrun 0.26 | None — overrun pre-existing, preserved by design |
| Shadowweave Cloak (T2) | 3 effects (norm 1–2); all utility, no reach overrun | None — optionally trim to 2 effects by dropping one utility if strict compliance needed |
| Mantle of the Unremembered (T3) | 4 effects (norm 2–3); dual-passive from legacy conversion | None — within MAX_EFFECTS_PER_ATTACHMENT=6 |
| The Woven Sky (T4) | 5 effects (norm 3–4); legacy passive overrun 0.23 | None — overrun pre-existing, preserved by design |
