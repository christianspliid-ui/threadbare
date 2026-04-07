# Attachment Pipeline: Diverse Mounts Across Underserved Reaches
> Category: mounts_beasts | Slug: fill-diverse-mounts | Pass: final
> Status: **READY WITH CAVEATS**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 8 items drafted (T2 ×3, T3 ×4, T4 ×1) across Shadow, Veil, Heart, Star reaches |
| Editorial | Approved with refinements | Items #2 and #3 renamed (Cindermaw → Smoke-Tooth; Veilstag → Shimmer Hart) |
| Systems | READY WITH CAVEATS | 7 of 8 items fully pass; item #8 (The Pale Pilgrim) had 7 effects against hard cap of 6 — corrected by removing `tag_immunity` |

## Corrections Applied Since Revised Pass

| Item | Issue | Fix Applied |
|------|-------|-------------|
| The Pale Pilgrim (#8) | 7 effects exceeded MAX_EFFECTS_PER_ATTACHMENT = 6 (hard engine cap) | Removed `{ type: 'tag_immunity', tags: ['fear', 'curse'] }` (Option A). Effect count now 6. `mechanicalSummary` updated accordingly. |

## Implementation Notes

These are **new entries** — all 8 IDs are absent from `reward-attachment-catalog.ts`. Append to the existing `mounts_beasts` sections, grouped by tier.

**Target file:** `src/data/reward-attachment-catalog.ts`
**Target array:** `REWARD_POSSESSIONS`
**Suggested placement:** After the existing T3 mounts block (`reward_mounts_beasts_ashenmane_destrier`). Insert T2 items first, then T3 items, then T4.

---

## Approved Attachments

### 1. Dustwalker

```typescript
{
  id: 'reward_mounts_beasts_dustwalker',
  type: 'artifact',
  name: 'Dustwalker',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#mount', '#shadow', '#stealth', '#wilderness'],
    mechanicalSummary: '+0.04 Shadow, 15% reduced movement cost, +0.03 Shadow in enemy territory (ambush positioning)',
    lossCondition: 'stealable',
    flavorText: 'A gaunt grey thing with hooves wrapped in rags. It makes no sound on any surface and will not approach firelight.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.04 },
      { type: 'range_modifier', movementCostMultiplier: 0.85 },
      { type: 'conditional', condition: 'in_enemy_territory', reach: 'shadow', value: 0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Infiltrator's mount. Rewards operating behind enemy lines — bred for scouts and saboteurs. The conditional bonus in enemy territory distinguishes it from Iron war-mounts that shine in direct combat.
**Total reach value:** 0.07 max Shadow (0.04 passive + 0.03 conditional) + movement
**Systems:** PASS — 3 effects, type-valid, balance-compliant.

---

### 2. Smoke-Tooth

```typescript
{
  id: 'reward_mounts_beasts_smoke_tooth',
  type: 'artifact',
  name: 'Smoke-Tooth',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#mount', '#shadow', '#combat', '#intimidation'],
    mechanicalSummary: '+0.07 Shadow, +0.03 Iron, 15% reduced movement cost, grants shadow_strike trait, enemies in 1 hex: -0.03 Eye (shroud aura)',
    lossCondition: 'permanent',
    flavorText: 'A wolf the size of a yearling calf, black as wet charcoal. Smoke leaks from between its teeth when it breathes. It chose you. You did not choose it.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.07 },
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.85 },
      { type: 'trait_grant', grantedTrait: 'shadow_strike' },
      { type: 'aura', radius: 1, target: 'enemies', reach: 'eye', value: -0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Shadow predator mount. A T3 nightmare-wolf that projects darkness around itself, blinding nearby enemies (aura debuff to Eye). The `shadow_strike` trait unlocks ambush encounter options unavailable to ordinary riders. The aura represents the unnatural gloom that clings to the beast — enemies can hear it but cannot find it.
**Total reach value:** 0.10 Shadow + 0.03 Iron passive; enemy aura -0.03 Eye (not on bearer)
**Systems:** PASS — 5 effects, type-valid, balance-compliant.

---

### 3. Shimmer Hart

```typescript
{
  id: 'reward_mounts_beasts_shimmer_hart',
  type: 'artifact',
  name: 'Shimmer Hart',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#mount', '#veil', '#mystical', '#exploration'],
    mechanicalSummary: '+0.04 Veil, 10% reduced movement cost, +1 awareness hex range, +0.03 Veil in mystical encounters',
    lossCondition: 'stealable',
    flavorText: 'A white hart with too many antler points. Its hooves leave no prints but the air shimmers where it stepped, as if heat were rising from snow.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'range_modifier', movementCostMultiplier: 0.9, awarenessRangeBonus: 1 },
      { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.03 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Arcane tracker. Drawn to places where the boundary between worlds is thin — the awareness range bonus represents it sensing disturbances the rider cannot. More explorer than warhorse.
**Total reach value:** 0.07 max Veil (0.04 passive + 0.03 conditional) + movement + awareness
**Systems:** PASS — 3 effects, type-valid, balance-compliant.

---

### 4. Glimmermoth

```typescript
{
  id: 'reward_mounts_beasts_glimmermoth',
  type: 'artifact',
  name: 'Glimmermoth',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#mount', '#veil', '#mystical', '#arcane'],
    mechanicalSummary: '+0.06 Veil, +0.03 Eye, 15% reduced movement cost, +2 awareness hex range, immune to fear/illusion tags, amplifies mystical encounters (1.3x)',
    lossCondition: 'permanent',
    flavorText: 'Larger than any moth should be and luminous at the wing-edges. It navigates by ley-lines that no cartographer has mapped. When it lands on your shoulder the weight is barely there, but the world looks different.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.85, awarenessRangeBonus: 2 },
      { type: 'tag_immunity', tags: ['fear', 'illusion'] },
      { type: 'behavior_weight', reach: 'veil', multiplier: 1.3 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Arcane familiar-mount. The exceptional awareness range (+2 hexes) represents its ley-line sensitivity. Fear and illusion immunity reflect that a creature which lives between realities cannot be fooled by false ones. The behavior_weight steers its bonded toward arcane discoveries.
**Total reach value:** 0.06 Veil + 0.03 Eye passive; immunity and behavior contribute no reach value
**Systems:** PASS — 5 effects, type-valid, balance-compliant.

---

### 5. Hearthbound Hound

```typescript
{
  id: 'reward_mounts_beasts_hearthbound_hound',
  type: 'artifact',
  name: 'Hearthbound Hound',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 2,
    tags: ['#beast', '#heart', '#loyalty', '#social', '#companion'],
    mechanicalSummary: '+0.04 Heart, +0.02 Iron, cooperation +0.15 toward allies, when damaged: +0.04 Heart for 3 ticks (8-tick cooldown, protective instinct)',
    lossCondition: 'permanent',
    flavorText: 'It followed a dead woman for nine days before it found you. Now it sleeps across your doorway and will not let strangers pass without your word.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'passive', reach: 'iron', value: 0.02 },
      { type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.15 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 3, reach: 'heart', value: 0.04, destroyOnExpiry: true
      }, cooldown: 8 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Loyalty companion. Walks beside you, not beneath you. The social_modifier toward allies reflects the trust the hound's presence builds. The reactive on damage represents the hound's protective surge — it interposes itself, steeling its bonded's resolve.
**Total reach value:** 0.04 Heart + 0.02 Iron passive; reactive burst 0.04 Heart (conditional on being damaged)
**Systems:** PASS — 4 effects, type-valid, balance-compliant. Reactive cooldown 8 ticks > COOLDOWN_MINIMUM_TICKS (5).

---

### 6. Sorrowheart Mare

```typescript
{
  id: 'reward_mounts_beasts_sorrowheart_mare',
  type: 'artifact',
  name: 'Sorrowheart Mare',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#mount', '#heart', '#empathy', '#social', '#healing'],
    mechanicalSummary: '+0.08 Heart, +0.03 Gold, 20% reduced movement cost, allies in 1 hex: +0.02 Heart (calming aura), grants empathic_bond trait',
    lossCondition: 'permanent',
    flavorText: 'She carries grief the way other horses carry weight -- steadily, without stumbling. Wounded soldiers stop screaming when she walks through camp. No one knows why.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.08 },
      { type: 'passive', reach: 'gold', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.8 },
      { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
      { type: 'trait_grant', grantedTrait: 'empathic_bond' },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Healer's mount and emotional anchor. The calming aura buffs nearby allies' Heart. The `empathic_bond` trait unlocks emotional encounter options (sensing lies, calming crowds, soothing the dying). A true mount — fast and steady at 20% movement reduction — whose value is diplomatic rather than martial.
**Total reach value:** 0.08 Heart + 0.03 Gold passive; ally aura 0.02 Heart (not on bearer)
**Systems:** PASS — 5 effects, type-valid, balance-compliant.

---

### 7. Dawnfeather Kestrel

```typescript
{
  id: 'reward_mounts_beasts_dawnfeather_kestrel',
  type: 'artifact',
  name: 'Dawnfeather Kestrel',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 3,
    tags: ['#beast', '#star', '#prophecy', '#awareness', '#companion'],
    mechanicalSummary: '+0.06 Star, +0.04 Eye, +3 awareness hex range, amplifies exploration encounters (1.2x), when encounter starts: +0.03 Star for 4 ticks (6-tick cooldown, prescient warning)',
    lossCondition: 'permanent',
    flavorText: 'It perches on your shoulder at dawn and screams at things that have not happened yet. By the time you understand its warning, you are already moving.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'range_modifier', awarenessRangeBonus: 3 },
      { type: 'behavior_weight', reach: 'eye', multiplier: 1.2 },
      { type: 'reactive', trigger: 'encounter_started', effect: {
        type: 'duration', ticks: 4, reach: 'star', value: 0.03, destroyOnExpiry: true
      }, cooldown: 6 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Prophetic scout-bird. Not a mount you ride but a companion that extends your senses across the horizon. The +3 awareness range is its primary value. The reactive on encounter_started represents its prescient screech — a burst of Star-domain foresight before the encounter resolves. No movement cost reduction: this is a perching companion, not a riding beast.
**Total reach value:** 0.06 Star + 0.04 Eye passive; reactive burst 0.03 Star (conditional)
**Systems:** PASS — 5 effects, type-valid, balance-compliant. Reactive cooldown 6 ticks > COOLDOWN_MINIMUM_TICKS (5).

---

### 8. The Pale Pilgrim

> **Systems correction applied:** Original draft had 7 effects, exceeding MAX_EFFECTS_PER_ATTACHMENT = 6. `tag_immunity` removed (Option A). `mechanicalSummary` updated to reflect correction.

```typescript
{
  id: 'reward_mounts_beasts_pale_pilgrim',
  type: 'artifact',
  name: 'The Pale Pilgrim',
  properties: {
    subcategory: 'mounts_beasts',
    tier: 4,
    tags: ['#beast', '#mount', '#star', '#veil', '#legendary', '#celestial'],
    mechanicalSummary: '+0.06 Star, +0.04 Veil, +0.03 Eye, 25% reduced movement cost, +2 awareness hex range, allies in 1 hex: +0.02 Star (fate-touched aura), grants starborne_rider trait',
    lossCondition: 'permanent',
    flavorText: 'No breed anyone can name. Coat like moonlight on still water. It appeared at the crossroads on the longest night and waited, as though it had always known you would come. The old woman at the wayshrine said it had been waiting for a century.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.06 },
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'range_modifier', movementCostMultiplier: 0.75, awarenessRangeBonus: 2 },
      { type: 'aura', radius: 1, target: 'allies', reach: 'star', value: 0.02 },
      { type: 'trait_grant', grantedTrait: 'starborne_rider' },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** The game's first T4 mount — a legendary celestial beast combining Star and Veil domains. Design philosophy is "epic through breadth, not depth": 0.13 total passive spread across three reaches, no single reach exceeding 0.06, with utility effects (movement, awareness, aura, trait) that reward the rider's entire warband. The `starborne_rider` trait unlocks celestial encounter paths unavailable to mundane riders.

The original fear/curse immunity design intent is preserved through the `starborne_rider` trait — what was born in starlight does not flinch at mortal terrors, and the trait can gate immunity-related encounter options in the authoring layer without consuming an effect slot.

**Total reach value:** 0.13 passive (0.06 Star + 0.04 Veil + 0.03 Eye); ally aura 0.02 Star (not on bearer)
**Effect count:** 6 — exactly at MAX_EFFECTS_PER_ATTACHMENT.
**Systems:** PASS (after correction) — 6 effects, type-valid, balance-compliant.

---

## Summary Table

| # | Name | Reach | Tier | Effects | Max Passive Value | Loss | Systems |
|---|------|-------|------|---------|------------------|------|---------|
| 1 | Dustwalker | Shadow | T2 | 3 | 0.07 Shadow | stealable | **PASS** |
| 2 | Smoke-Tooth | Shadow+Iron | T3 | 5 | 0.10 Shadow / 0.03 Iron | permanent | **PASS** |
| 3 | Shimmer Hart | Veil | T2 | 3 | 0.07 Veil | stealable | **PASS** |
| 4 | Glimmermoth | Veil+Eye | T3 | 5 | 0.06 Veil / 0.03 Eye | permanent | **PASS** |
| 5 | Hearthbound Hound | Heart+Iron | T2 | 4 | 0.04 Heart / 0.02 Iron | permanent | **PASS** |
| 6 | Sorrowheart Mare | Heart+Gold | T3 | 5 | 0.08 Heart / 0.03 Gold | permanent | **PASS** |
| 7 | Dawnfeather Kestrel | Star+Eye | T3 | 5 | 0.06 Star / 0.04 Eye | permanent | **PASS** |
| 8 | The Pale Pilgrim | Star+Veil+Eye | T4 | 6 | 0.13 spread (max 0.06 Star) | permanent | **PASS** (corrected) |

### Reach Coverage Delivered

| Reach | Count | Tiers | Gap Filled? |
|-------|-------|-------|-------------|
| Shadow | 2 | T2, T3 | Yes — was zero |
| Veil | 2 | T2, T3 | Yes — was zero |
| Heart | 2 | T2, T3 | Yes — was zero |
| Star | 1 (+T4) | T3 | Yes — was zero; also primary on T4 |
| Multi (Star+Veil+Eye) | 1 | T4 | Yes — first T4 mount |

## Overall Pipeline Verdict

**READY WITH CAVEATS**

All 8 items are type-valid and balance-compliant after the correction to item #8. The systems correction (removing `tag_immunity` from The Pale Pilgrim) is the only change required since the revised pass. The corrected flavor intent for fear/curse resilience is preserved through the `starborne_rider` trait rather than a discrete effect slot.

No duplicate IDs. No invalid reach domains. No invalid predicate values. No per-reach balance violations. No cooldown violations.

The single caveat: implementors should note that `starborne_rider` and `empathic_bond` and `shadow_strike` are new trait strings that must be recognized by the encounter authoring system to unlock their respective gated content. These traits have no engine effect on their own — they are semantic gates for encounter template prerequisites. This is intentional and consistent with how `cavalry_charge` (Ashenmane Destrier) works.
