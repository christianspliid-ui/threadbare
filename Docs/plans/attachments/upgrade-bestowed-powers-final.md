# Attachment Pipeline: Bestowed Powers Upgrade
> Category: bestowed | Slug: bestowed-powers | Pass: final
> Status: **READY FOR IMPLEMENTATION**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 10 items (T1×4, T2×3, T3×2, T4×1); flesh reach remapped throughout |
| Editorial | PASS WITH REVISIONS | Spirit Sight flavor revised; Gatehouse Commendation tags fixed; 5 mechanicalSummaries tightened |
| Systems | READY FOR IMPLEMENTATION | All 10 items pass; 1 note (Gatehouse Commendation T1 effect count is representation artifact) |

## Approved Attachments

```typescript
// ─── Bestowed (T1 ×4) ───────────────────────────────────────────────

{
  id: 'reward_bestowed_ember_hands',
  type: 'trait',
  name: 'Ember Hands',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#stone', '#survival', '#craft', '#wilderness'],
    description: 'Hands radiate gentle warmth. Fire comes easily.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'Tinder catches at your touch. You have not felt cold since the gift was given.',
    mechanicalSummary: '+0.04 Stone, trait: fire_touch (fire manipulation unlocked)',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.04 },
      { type: 'trait_grant', grantedTrait: 'fire_touch' },
    ],
  } as TraitDefinitionProperties,
},

{
  id: 'reward_bestowed_beast_tongue',
  type: 'trait',
  name: 'Beast-Tongue',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#heart', '#eye', '#wilderness'],
    description: 'Animals understand your intent, if not your words.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'Horses calm at your voice. Wolves turn aside. You are kin to things that do not speak.',
    mechanicalSummary: '+0.04 Heart, +0.02 Eye in wilderness',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'conditional', condition: 'in_wilderness', reach: 'eye', value: 0.02 },
    ],
  } as TraitDefinitionProperties,
},

{
  id: 'reward_bestowed_iron_gut',
  type: 'trait',
  name: 'Iron Gut',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#iron', '#survival', '#wilderness'],
    description: 'Immunity to common poisons and spoiled food.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'You eat what would kill others and suffer nothing but a sour taste.',
    mechanicalSummary: '+0.05 Iron, immune to poison/disease conditions',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.05 },
      { type: 'tag_immunity', tags: ['poison', 'disease'] },
    ],
  } as TraitDefinitionProperties,
},

{
  id: 'reward_bestowed_night_eyes',
  type: 'trait',
  name: 'Night Eyes',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#eye', '#shadow', '#wilderness', '#stealth'],
    description: 'See clearly in near-total darkness.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The dark is merely dim. Your pupils are wider than they should be.',
    mechanicalSummary: '+0.05 Eye, +0.02 Shadow in exploration',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.05 },
      { type: 'conditional', condition: 'in_exploration', reach: 'shadow', value: 0.02 },
    ],
  } as TraitDefinitionProperties,
},

// NOTE: reward_bestowed_patrons_backing — SKIPPED (already live with effects[])

{
  id: 'reward_bestowed_gatehouse_commendation',
  type: 'trait',
  name: 'Gatehouse Commendation',
  properties: {
    subcategory: 'bestowed',
    tier: 1,
    tags: ['#bestowed', '#checkpoint', '#order', '#heart', '#eye', '#iron'],
    description: 'The watch remembers you as someone who kept a hard line without turning the city against itself.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'A quiet nod from a captain, a gate waved open half a beat sooner, a ledger mark that says you made the city easier to govern instead of harder.',
    mechanicalSummary: '+0.03 Heart, +0.03 Eye, +0.02 Iron, same-faction cooperation bias +0.1',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'passive', reach: 'iron', value: 0.02 },
      { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.1 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Bestowed (T2 ×3) ───────────────────────────────────────────────

{
  id: 'reward_bestowed_spirit_sight',
  type: 'trait',
  name: 'Spirit Sight',
  properties: {
    subcategory: 'bestowed',
    tier: 2,
    tags: ['#bestowed', '#eye', '#veil', '#supernatural', '#arcane', '#ruins'],
    description: 'See beyond the veil of the material into the spirit world.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The world peels back its skin. You see what it is hiding underneath.',
    mechanicalSummary: '+0.07 Eye, +0.03 Veil, on hex entry: reveals encounters within 2 hexes (6 ticks)',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.07 },
      { type: 'passive', reach: 'veil', value: 0.03 },
      { type: 'reactive', trigger: 'entered_hex', effect: {
        type: 'reveal', target: 'encounters', range: 2, duration: 6,
      }},
    ],
  } as TraitDefinitionProperties,
},

{
  id: 'reward_bestowed_bloodward',
  type: 'trait',
  name: 'Bloodward',
  properties: {
    subcategory: 'bestowed',
    tier: 2,
    tags: ['#bestowed', '#iron', '#heart', '#combat', '#healing'],
    description: 'Wounds close faster than nature allows. Scars form in hours.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The blood knows what to do. Cut the skin and watch it knit like thread drawn tight.',
    mechanicalSummary: '+0.05 Iron, +0.03 Heart, when damaged: +0.04 Iron for 8 ticks (12-tick cooldown)',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.05 },
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 8, reach: 'iron', value: 0.04, destroyOnExpiry: false,
      }, cooldown: 12 },
    ],
  } as TraitDefinitionProperties,
},

{
  id: 'reward_bestowed_voices_of_the_departed',
  type: 'trait',
  name: 'Voices of the Departed',
  properties: {
    subcategory: 'bestowed',
    tier: 2,
    tags: ['#bestowed', '#shadow', '#heart', '#ruins'],
    description: 'Hear the whispers of the recently dead. They offer counsel, sometimes unbidden.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The dead speak softly, but they never stop. You learn to listen selectively.',
    mechanicalSummary: '+0.06 Shadow, +0.04 Heart, awareness range +1 hex (dead whisper warnings)',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.06 },
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as TraitDefinitionProperties,
},

// ─── Bestowed (T3 ×2) ───────────────────────────────────────────────

{
  id: 'reward_bestowed_stormcaller',
  type: 'trait',
  name: 'Stormcaller',
  properties: {
    subcategory: 'bestowed',
    tier: 3,
    tags: ['#bestowed', '#star', '#stone', '#divine', '#wilderness'],
    description: 'Command the weather within a small radius. The sky answers, reluctantly.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'Thunder follows your anger. Rain follows your grief. The sky has learned your moods.',
    mechanicalSummary: '+0.10 Star, +0.05 Stone, enemy aura -0.03 Iron (1 hex), 1.3× Iron encounter desire',
    effects: [
      { type: 'passive', reach: 'star', value: 0.10 },
      { type: 'passive', reach: 'stone', value: 0.05 },
      { type: 'aura', radius: 1, target: 'enemies', reach: 'iron', value: -0.03 },
      { type: 'behavior_weight', reach: 'iron', multiplier: 1.3 },
    ],
  } as TraitDefinitionProperties,
},

{
  id: 'reward_bestowed_veilwalk',
  type: 'trait',
  name: 'Veilwalk',
  properties: {
    subcategory: 'bestowed',
    tier: 3,
    tags: ['#bestowed', '#veil', '#shadow', '#supernatural', '#arcane', '#stealth'],
    description: 'Step briefly between worlds. Physical barriers become suggestions.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The wall is there, and then it is not. You pass through the space where it chose not to be.',
    mechanicalSummary: '+0.10 Veil, +0.05 Shadow, movement cost ×0.8 (phase-walking), unlocks Veil-domain actions',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.10 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'action_gate', mode: 'unlock', reach: 'veil' },
    ],
  } as TraitDefinitionProperties,
},

// ─── Bestowed (T4 ×1) ───────────────────────────────────────────────

{
  id: 'reward_bestowed_the_undying_flame',
  type: 'trait',
  name: 'The Undying Flame',
  properties: {
    subcategory: 'bestowed',
    tier: 4,
    tags: ['#bestowed', '#star', '#iron', '#divine', '#ancient'],
    description: 'A spark of divine fire burns within. Death is delayed, not prevented.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'You burned once and did not die. The fire lives inside now, patient and eternal. It will outlast you.',
    mechanicalSummary: '+0.12 Star, +0.03 Iron, blocks one quintessence loss, on damage: +0.05 Star for 6 ticks then +1 step on failures (24-tick cooldown)',
    effects: [
      { type: 'passive', reach: 'star', value: 0.12 },
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'prevent_loss', channel: 'quintessence', amount: 1, consumeOnPrevent: false },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'cascade', triggerEffect: {
          type: 'duration', ticks: 6, reach: 'star', value: 0.05, destroyOnExpiry: false,
        }, then: [
          { type: 'test_shaper', trigger: 'failure', steps: 1 },
        ],
      }, cooldown: 24 },
    ],
  } as TraitDefinitionProperties,
},
```

## Excluded Items

None. All 10 items passed audit.

## Implementation Notes

1. **In-place replacement** — Modify the `REWARD_BESTOWED_POWERS` array in `src/data/reward-attachment-catalog.ts`.
2. **Skip `reward_bestowed_patrons_backing`** — already has `effects[]` with working test_shaper. Do not touch it.
3. **domainContributions removal** — Remove the `domainContributions` field from each item. Do NOT add `domainContributions: {}` — the field accepts `Partial<Record<ReachDomain, number>>` so simply remove it entirely. The `as TraitDefinitionProperties` cast handles the missing required field.
4. **Tags** — Update Beast-Tongue (remove `#flesh`, keep `#eye`), Iron Gut (remove `#flesh`), Bloodward (replace `#flesh` with `#heart`), Gatehouse Commendation (add `#bestowed` and `#iron`), The Undying Flame (replace `#flesh` with `#iron`).
5. **Spirit Sight flavor** — Update flavorText to revised version.
