# Attachment Pipeline: Blessings & Curses Conditions
> Category: condition | Slug: upgrade-blessings-curses | Pass: final
> Status: **READY FOR IMPLEMENTATION**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 9 items (6 blessings, 3 curses) |
| Editorial | Revised | `#flesh` tags → `#stone`; mechanicalSummary corrections; Tonguebound trigger clarified |
| Systems | READY FOR IMPLEMENTATION | All 9 PASS; fixes applied: flesh→stone in effects, Earthblood passive consolidated, Anointing conditional trimmed to 0.02 |

---

## Approved Attachments

### reward-attachment-catalog.ts — REWARD_CONDITIONS array (in-place replacements)

```typescript
  // ─── Blessings (T1 ×3) ──────────────────────────────────────────────
  {
    id: 'reward_condition_dawn_kissed',
    type: 'trait',
    name: 'Dawn-Kissed',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#star', '#divine', '#healing'],
      description: 'A faint warmth lingers, granting minor divine favor.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'The first light of morning seems to linger on your skin longer than it should.',
      mechanicalSummary: '+0.04 Star, +0.02 Eye when exploring',
      effects: [
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_healers_touch',
    type: 'trait',
    name: "Healer's Touch",
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#heart', '#stone', '#healing'],
      description: 'Hands carry a soothing warmth that eases pain.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'Your palms tingle. The wounded lean toward you without knowing why.',
      mechanicalSummary: '+0.03 Heart, +0.03 Stone, temporary +0.03 Stone when healed',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'reactive', trigger: 'healed', effect: {
          type: 'duration', ticks: 6, reach: 'stone', value: 0.03, destroyOnExpiry: false,
        }},
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_fortune_marked',
    type: 'trait',
    name: 'Fortune-Marked',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#gold', '#divine', '#trade'],
      description: 'Luck bends slightly in your direction.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'Coins turn up in pockets. Doors left ajar swing the right way.',
      mechanicalSummary: '+0.04 Gold, rescues near-miss Gold outcomes (+1 step)',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.04 },
        { type: 'test_shaper', reach: 'gold', trigger: 'near_miss', steps: 1 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Blessings (T2 ×2) ──────────────────────────────────────────────
  {
    id: 'reward_condition_saints_ward',
    type: 'trait',
    name: "Saint's Ward",
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#blessing', '#star', '#divine', '#heart', '#healing'],
      description: 'A protective aura that dulls hostile intent nearby.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'Blades hesitate. Arrows veer. The faithful call it grace; the skeptical call it luck.',
      mechanicalSummary: '+0.06 Star, +0.04 Heart, allies within 1 hex gain +0.02 Heart',
      effects: [
        { type: 'passive', reach: 'star', value: 0.06 },
        { type: 'passive', reach: 'heart', value: 0.04 },
        { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_earthblood_vigor',
    type: 'trait',
    name: 'Earthblood Vigor',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#blessing', '#stone', '#wilderness'],
      description: 'Vitality drawn from the land itself. Wounds close faster, muscles ache less.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'You sleep on bare earth and wake restored. The soil knows your name.',
      mechanicalSummary: '+0.10 Stone, temporary +0.04 Stone buff that fades over 10 ticks after resting',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.10 },
        { type: 'reactive', trigger: 'healed', effect: {
          type: 'decay', reach: 'stone', startValue: 0.04, changePerTick: -0.004, limitValue: 0.0, destroyAtLimit: true,
        }, cooldown: 12 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Blessings (T3 ×1) ──────────────────────────────────────────────
  {
    id: 'reward_condition_the_anointing',
    type: 'trait',
    name: 'The Anointing',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#blessing', '#star', '#divine', '#eye', '#ruins'],
      description: 'Marked by divine purpose. Perception and faith burn bright.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'A smear of oil that will not wash away. You see the world as a god sees it — and it is not kind.',
      mechanicalSummary: '+0.10 Star, +0.05 Eye, +0.02 Eye in mystical contexts, rescues near-miss Star outcomes (+1 step)',
      effects: [
        { type: 'passive', reach: 'star', value: 0.10 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'conditional', condition: 'in_mystical', reach: 'eye', value: 0.02 },
        { type: 'test_shaper', reach: 'star', trigger: 'near_miss', steps: 1, maxMargin: 0.05 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Curses (T1 ×2) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_ill_luck',
    type: 'trait',
    name: 'Ill Luck',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#curse', '#shadow', '#gold'],
      description: 'Misfortune clings like smoke. Commerce and stealth suffer.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'Things break in your hands. Deals sour. People stop meeting your eyes.',
      mechanicalSummary: '-0.04 Gold, bad luck compounds: -0.01 Gold per combat failure (max -0.03, slow decay)',
      effects: [
        { type: 'passive', reach: 'gold', value: -0.04 },
        { type: 'stacking', reach: 'gold', valuePerStack: -0.01, maxStacks: 3, stackOn: 'combat_failure', decayPerTick: 0.005 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_nightmares',
    type: 'trait',
    name: 'Nightmares',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#curse', '#heart', '#veil'],
      description: 'Restless sleep erodes composure and empathy.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'You wake gasping. The dreams fade but the dread does not.',
      mechanicalSummary: '-0.04 Heart, slow drift toward ruthlessness, suppresses social encounters',
      effects: [
        { type: 'passive', reach: 'heart', value: -0.04 },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.002, limitValue: 0.15 },
        { type: 'behavior_weight', reach: 'heart', multiplier: 0.7 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Curses (T2 ×2) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_tonguebound',
    type: 'trait',
    name: 'Tonguebound',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#curse', '#heart', '#shadow'],
      description: 'Cannot speak truths about a particular subject. Social reach impaired.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'The words form but the throat closes. Some truths have been locked away.',
      mechanicalSummary: '-0.07 Heart, -0.03 Shadow, blocks Heart actions in social contexts, -0.01 Heart per nearby social success (max -0.03)',
      effects: [
        { type: 'passive', reach: 'heart', value: -0.07 },
        { type: 'passive', reach: 'shadow', value: -0.03 },
        { type: 'action_gate', mode: 'block', reach: 'heart', condition: 'in_social' },
        { type: 'stacking', reach: 'heart', valuePerStack: -0.01, maxStacks: 3, stackOn: 'social_success', decayPerTick: 0.003 },
      ],
    } as TraitDefinitionProperties,
  },
```

---

## Excluded Items

None. All 9 items passed audit.

---

## Systems Fixes Summary

| Item | Fix | Reason |
|------|-----|--------|
| Healer's Touch | `reach: 'flesh'` → `reach: 'stone'` (passive + nested duration) | `flesh` is not a valid `ReachDomain` (removed TB-075) |
| Earthblood Vigor | Merged two stone passives into one `{ reach: 'stone', value: 0.10 }` | Consolidation after flesh→stone correction |
| Earthblood Vigor | Nested decay `reach: 'flesh'` → `reach: 'stone'` | Same reason |
| The Anointing | Conditional Eye value 0.03 → 0.02 | Cap compliance: total Eye capped at 0.07 conditional max |

## Caveats

- **Ill Luck stacking trigger**: `combat_failure` on a Gold-reach curse. Thematically imperfect (commerce vs combat) but `trade_failure`/`gold_failure` do not exist in `StackTrigger`. Accepted as-is.
- **Nightmares effect count**: 3 effects for T1 (guideline: 1). The two behavioral effects (`axiological_drift`, `behavior_weight`) carry no reach value and are query-layer only. Accepted: curse identity relies on personality corruption, which requires behavioral primitives.
- **Tonguebound effect count**: 4 effects for T2 (guideline: 1–2). `action_gate` is a qualitative block (no reach value); `stacking` is conditional. Accepted for T2 curse with strong narrative identity.
