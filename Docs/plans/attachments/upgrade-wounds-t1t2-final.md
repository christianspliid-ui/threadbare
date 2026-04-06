# Attachment Pipeline: T1-T2 Wound Conditions Upgrade
> Category: condition | Slug: upgrade-wounds-t1t2 | Pass: final
> Status: **READY WITH CAVEATS**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 8 items |
| Editorial | Revised | `flesh` → `heart` reach corrections on Gashed Leg and Deep Stab Wound |
| Systems | READY WITH CAVEATS | All 8 PASS; caveats on T2 effect counts (design choices, not blockers) |

---

## Approved Attachments

### reward-attachment-catalog.ts — REWARD_CONDITIONS array (in-place replacements)

```typescript
  // ─── Wounds (T1 ×4) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_fractured_arm',
    type: 'trait',
    name: 'Fractured Arm',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#iron', '#combat'],
      description: 'A broken bone limits striking power and grip strength.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.05 Iron (decays toward 0 over 24 ticks, self-removes on heal)',
      flavorText: 'The bone set crooked. Every swing ends in a wince.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.05, changePerTick: 0.002, limitValue: 0, destroyAtLimit: true },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_gashed_leg',
    type: 'trait',
    name: 'Gashed Leg',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#heart', '#combat'],
      description: 'Deep laceration impairs movement and endurance.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.04 Heart (decays over 30 ticks), +30% movement cost while wounded',
      flavorText: 'The bandage is soaked through again. Walking is a negotiation with pain.',
      effects: [
        { type: 'decay', reach: 'heart', startValue: -0.04, changePerTick: 0.0013, limitValue: 0, destroyAtLimit: true },
        { type: 'range_modifier', movementCostMultiplier: 1.3 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_cracked_ribs',
    type: 'trait',
    name: 'Cracked Ribs',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#iron', '#combat'],
      description: 'Breathing hurts. Fighting hurts more.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.02 Iron always, -0.04 Iron in combat (total -0.06 in combat)',
      flavorText: 'Each breath is shallow. Laughter is out of the question.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.02 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: -0.04 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_bruised_knuckles',
    type: 'trait',
    name: 'Bruised Knuckles',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#stone', '#combat'],
      description: 'Swollen hands make delicate work impossible.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.03 Stone (heals fast, gone in ~12 ticks)',
      flavorText: 'Purple and fat, the fingers refuse to close properly.',
      effects: [
        { type: 'decay', reach: 'stone', startValue: -0.03, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Wounds (T2 ×3) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_deep_stab_wound',
    type: 'trait',
    name: 'Deep Stab Wound',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#wound', '#physical', '#iron', '#heart', '#combat'],
      description: 'Internal damage that risks infection and limits exertion.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.07 Iron, -0.05 Heart; worsens when damaged (-0.03 Iron for 6 ticks)',
      flavorText: 'The blade went deep. Something inside is not where it should be.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.07 },
        { type: 'passive', reach: 'heart', value: -0.05 },
        { type: 'reactive', trigger: 'damaged', effect: { type: 'duration', ticks: 6, reach: 'iron', value: -0.03, destroyOnExpiry: true }, cooldown: 12 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_shattered_shield_arm',
    type: 'trait',
    name: 'Shattered Shield Arm',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#wound', '#physical', '#iron', '#combat'],
      description: 'The arm that blocks can no longer bear weight.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.08 Iron (decays over 36 ticks), blocks Iron actions in combat',
      flavorText: 'The bones ground together like millstones. The shield hangs useless.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.08, changePerTick: 0.0022, limitValue: 0, destroyAtLimit: true },
        { type: 'action_gate', mode: 'block', reach: 'iron', condition: 'in_combat' },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_blinded_eye',
    type: 'trait',
    name: 'Blinded Eye',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#wound', '#physical', '#eye', '#combat'],
      description: 'Lost depth perception impairs awareness and aim.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.08 Eye, -1 awareness range, 0.6x combat desire (fear of fighting blind)',
      flavorText: 'The world is flat now. Distance is a guess, and guesses get you killed.',
      effects: [
        { type: 'passive', reach: 'eye', value: -0.08 },
        { type: 'range_modifier', awarenessRangeBonus: -1 },
        { type: 'behavior_weight', reach: 'iron', multiplier: 0.6 },
      ],
    } as TraitDefinitionProperties,
  },
```

---

### starter-attachments.ts — STARTER_CONDITIONS array (in-place replacement)

```typescript
  // ─── Wounds ─────────────────────────────────────────────────────────
  {
    id: 'starter_bruised_ribs',
    type: 'trait',
    name: 'Bruised Ribs',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#iron'],
      description: 'Cracked bones protest every swing.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.03 Iron (decays fast, gone in ~12 ticks), -0.02 Iron extra in combat',
      flavorText: 'Every breath is a reminder of the blow you survived.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.03, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: -0.02 },
      ],
    } as TraitDefinitionProperties,
  },
```

---

## Excluded Items

None. All 8 items passed audit.

---

## Systems Audit Notes

| Item | Caveat |
|------|--------|
| Deep Stab Wound | 3 effects at T2 (norm is 1-2). Accepted: two are simple passives, reactive adds thematic depth, total value at cap |
| Blinded Eye | 3 effects at T2. Accepted: each from different primitive class (stat/awareness/behavioral), no power creep |
| Gashed Leg | T1 with 2 effects. Accepted: `range_modifier` is non-reach, read as flavor/movement effect |

---

## Tag Corrections (applied vs. original catalog)

| Item | Original tag | Corrected tag |
|------|-------------|---------------|
| Gashed Leg | `#flesh` | `#heart` |
| Deep Stab Wound | `#flesh` | `#heart` |

`flesh` is not a valid `ReachDomain` — removed in TB-075 Phase 1.
