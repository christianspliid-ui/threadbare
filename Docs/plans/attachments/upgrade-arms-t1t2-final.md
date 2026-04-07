# Attachment Pipeline: T1-T2 arms with #iron #combat tags
> Category: arms | Slug: upgrade-arms-t1t2 | Pass: final
> Status: **READY FOR IMPLEMENTATION**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 8 items drafted (T1 ×4, T2 ×3, T1 starter ×1) |
| Editorial | Approved with refinements | Flavor text sharpened; niches clarified; stacking/reactive mechanics tightened |
| Systems | PASS — all 8 items | All effects valid against src/types/effects.ts; all values within caps; no type errors |

## Implementation Notes

These are **upgrades** to existing items in the catalog. The upgrade replaces the legacy `reachBonus` property with a typed `effects[]` array. IDs are preserved. The engine's `resolveEffectModifiers` will consume `effects[]` when present, ignoring `reachBonus`.

- Items 1–4 and 6–8 are in `src/data/reward-attachment-catalog.ts`
- Item 5 (Iron Blade) is in `src/data/starter-attachments.ts`

**No new IDs. No new files.** Modify existing entries in place.

---

## Approved Attachments

### 1. Bronze Spear

```typescript
{
  id: 'reward_arms_bronze_spear',
  type: 'artifact',
  name: 'Bronze Spear',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee', '#combat'],
    mechanicalSummary: '+0.03 Iron, +0.02 Iron in combat',
    lossCondition: 'breakable',
    flavorText: 'Pitted and green with age, but the point still bites.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Reliable formation fighter. Rewards direct confrontation — better in a stand-up fight than out of one.
**Total reach value:** 0.05 max (0.03 passive + 0.02 conditional)

---

### 2. Hunting Bow

```typescript
{
  id: 'reward_arms_hunting_bow',
  type: 'artifact',
  name: 'Hunting Bow',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#ranged', '#combat'],
    mechanicalSummary: '+0.04 Iron, +0.01 Iron per combat success (max +0.03, decays 1/tick)',
    lossCondition: 'breakable',
    flavorText: 'Sinew-strung and warped from damp, but deadly enough at close range.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.04 },
      { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Wilderness scout's weapon. Rewards sustained combat performance; stacks evaporate quickly between fights (1/tick decay).
**Total reach value:** 0.07 max (0.04 passive + 0.03 at full stacks)

---

### 3. Rusted Mace

```typescript
{
  id: 'reward_arms_rusted_mace',
  type: 'artifact',
  name: 'Rusted Mace',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee', '#combat'],
    mechanicalSummary: '+0.04 Iron, +0.02 Iron / -0.01 Heart (blunt instrument)',
    lossCondition: 'breakable',
    flavorText: 'The rust is mostly cosmetic. Mostly.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.04 },
      { type: 'tradeoff', bonus: { reach: 'iron', value: 0.02 }, penalty: { reach: 'heart', value: 0.01 } },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Blunt attrition weapon. Trades social grace for crushing force. The tradeoff is always active — no condition, no toggling.
**Total reach value:** 0.06 Iron / −0.01 Heart

---

### 4. Bone Knife

```typescript
{
  id: 'reward_arms_bone_knife',
  type: 'artifact',
  name: 'Bone Knife',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee', '#survival', '#combat', '#wilderness'],
    mechanicalSummary: '+0.03 Iron, 3 charges of +0.04 Iron burst (desperate strikes)',
    lossCondition: 'consumable',
    flavorText: 'Carved from the rib of something large. It will not last.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'iron', value: 0.04 }, destroyOnEmpty: true },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Desperate survivor's blade. Limited lifespan modeled as consumable charges; item self-destructs when charges are spent. `lossCondition: 'consumable'` consistent with `destroyOnEmpty: true`.
**Total reach value:** 0.03 passive + 0.04 burst (3 uses); item destroyed on last charge.

---

### 5. Iron Blade

```typescript
{
  id: 'starter_iron_blade',
  type: 'artifact',
  name: 'Iron Blade',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#iron', '#weapon', '#melee'],
    mechanicalSummary: '+0.05 Iron, rescues near-miss combat rolls (+1 step, within 1 margin)',
    lossCondition: 'breakable',
    flavorText: 'A well-worn blade of folded steel, simple and reliable.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.05 },
      { type: 'test_shaper', reach: 'iron', trigger: 'near_miss', steps: 1, maxMargin: 1 },
    ],
    onUseTriggers: [
      {
        triggerCondition: 'critical_failure',
        probability: 0.25,
        effect: {
          type: 'remove_possession',
        },
        narrativeTemplate: '{item_name} snaps against the blow.',
      },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Dependable starter workhorse. The `test_shaper` (near_miss, +1 step, maxMargin 1) gives the blade a forgiving quality — it turns close failures into successes, representing a blade with good balance that covers for the wielder's mistakes. The breakage trigger (25% on critical_failure) provides natural attrition.

**Note:** The pre-existing `mechanicalSummary` in `starter-attachments.ts` incorrectly read `'+0.10 Iron reach'` while `reachBonus` was `{ iron: 0.05 }`. The revised summary corrects this housekeeping error.

**Total reach value:** 0.05 passive + test_shaper (no additive reach contribution — outcome quality shift only)

---

### 6. Blackiron Blade

```typescript
{
  id: 'reward_arms_blackiron_blade',
  type: 'artifact',
  name: 'Blackiron Blade',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#iron', '#weapon', '#melee', '#combat'],
    mechanicalSummary: '+0.08 Iron, +0.01 Iron per combat success (max +0.04, decays 1 stack/tick)',
    lossCondition: 'breakable',
    flavorText: 'Forged in a dead forge-town. The metal remembers heat it should not.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.08 },
      { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success', decayPerTick: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Haunted forge-weapon. Rewards sustained violence — grows stronger in a fight, cools quickly out of one. Higher floor (0.08) and higher cap (0.04 max stacking) than the T1 Hunting Bow, with the same decay rate creating a tenser resource loop.
**Total reach value:** 0.12 max (0.08 passive + 0.04 at full stacks)

---

### 7. Crossbow of the Watch

```typescript
{
  id: 'reward_arms_crossbow_of_the_watch',
  type: 'artifact',
  name: 'Crossbow of the Watch',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#iron', '#weapon', '#ranged', '#eye', '#combat'],
    mechanicalSummary: '+0.07 Iron, +0.03 Eye, +1 awareness range (watchman\'s vigil)',
    lossCondition: 'stealable',
    flavorText: 'Issued to border watchers. The sighting marks are worn smooth by anxious thumbs.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.07 },
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Sentry's precision weapon. The two passives replace the legacy dual-reach `reachBonus`; `range_modifier` is the genuinely new primitive. `awarenessRangeBonus: 1` means the wielder sees one extra hex ring — the watchman's trained eye scanning further into the dark.
**Total reach value:** 0.10 (0.07 Iron + 0.03 Eye) + awareness range utility

---

### 8. Thornwood Staff

```typescript
{
  id: 'reward_arms_thornwood_staff',
  type: 'artifact',
  name: 'Thornwood Staff',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#iron', '#weapon', '#melee', '#stone', '#combat'],
    mechanicalSummary: '+0.06 Iron, +0.03 Stone, thorns emerge when attacked (+0.03 Iron for 6 ticks, 12-tick cooldown)',
    lossCondition: 'breakable',
    flavorText: 'The wood is alive. It sprouts small leaves in spring, thorns in winter.',
    effects: [
      { type: 'passive', reach: 'iron', value: 0.06 },
      { type: 'passive', reach: 'stone', value: 0.03 },
      { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'iron', value: 0.03, destroyOnExpiry: true }, cooldown: 12 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Living weapon. The reactive triggers when the agent is attacked, granting a 6-tick iron burst (the thorn-emergence). Cooldown of 12 ticks prevents spam. `destroyOnExpiry: true` on the inner `DurationEffect` means the buff expires after 6 ticks — the staff itself is not destroyed (the flag is on the effect, not the node).
**Total reach value:** 0.12 max sustained (0.06 Iron + 0.03 Stone + 0.03 reactive burst when active)

---

## Excluded Items

None. All 8 items passed the systems audit without modification.

---

## Systems Audit Corrections Applied

The following corrections were made relative to the revised draft:

| Item | Correction |
|------|-----------|
| Iron Blade | None to effects. `mechanicalSummary` text corrected from pre-existing catalog error (`'+0.10 Iron reach'` → `'+0.05 Iron, rescues near-miss combat rolls (+1 step, within 1 margin)'`). |

All other items are carried forward without modification from `upgrade-arms-t1t2-revised.md`.
