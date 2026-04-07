# Attachment Systems Audit: T1-T2 arms with #iron #combat tags
> Slug: upgrade-arms-t1t2 | Pass: systems | Date: 2026-04-06

Source files checked:
- `src/types/effects.ts` — 39 effect discriminants, all EffectCondition and trigger types
- `src/types/attachments.ts` — PossessionNodeProperties, LossCondition, OnUseTrigger
- `src/data/effect-constants.ts` — EFFECT_PER_ITEM_CAP = 0.15, STACKING_GLOBAL_CAP = 10, COOLDOWN_MINIMUM_TICKS = 5
- `src/data/reward-attachment-catalog.ts` — 7 of 8 IDs present (upgrades, not new entries)
- `src/data/starter-attachments.ts` — `starter_iron_blade` present (upgrade target in different catalog)

---

## Audit Results

### 1. Bronze Spear — `reward_arms_bronze_spear`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.03 }
{ type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.02 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) and `conditional` (Type 6) both valid. `in_combat` is in `EffectCondition`. All field names correct. |
| Reach Values | PASS | 0.03 passive + 0.02 conditional = 0.05 max. No single effect exceeds 0.15. |
| Predicate Validity | PASS | `in_combat` is a valid `EffectCondition`. |
| Tier Appropriateness | PASS | T1 with 2 effects (1 passive + 1 conditional). Compliant with T1: 1-2 effects. |
| Cooldown/Duration | N/A | No time-based effects. |
| Stacking Sanity | N/A | No stacking effects. |
| No Duplicate IDs | PASS | ID exists in catalog — this is an upgrade (same ID, replacing reachBonus with effects[]). |
| Loss Condition | PASS | `breakable` is standard for `arms` subcategory. |

**Verdict: PASS**

---

### 2. Hunting Bow — `reward_arms_hunting_bow`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.04 }
{ type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) and `stacking` (Type 9) both valid. `combat_success` is in `StackTrigger`. All field names match `StackingEffect` interface exactly. |
| Reach Values | PASS | 0.04 passive + 0.03 max stacking = 0.07 max. No single effect exceeds 0.15. `valuePerStack: 0.01` × `maxStacks: 3` = 0.03 total stacking value. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T1 with 2 effects. Compliant. |
| Cooldown/Duration | PASS | `decayPerTick: 1` means stacks evaporate quickly between fights. Reasonable. |
| Stacking Sanity | PASS | `maxStacks: 3` is within 2-10 range. `combat_success` is an achievable trigger. |
| No Duplicate IDs | PASS | Upgrade of existing catalog entry. |
| Loss Condition | PASS | `breakable` appropriate for arms. |

**Verdict: PASS**

---

### 3. Rusted Mace — `reward_arms_rusted_mace`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.04 }
{ type: 'tradeoff', bonus: { reach: 'iron', value: 0.02 }, penalty: { reach: 'heart', value: 0.01 } }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) and `tradeoff` (Type 13) both valid. `TradeoffEffect` shape: `bonus: { reach, value }`, `penalty: { reach, value }` — matches exactly. |
| Reach Values | PASS | Passive 0.04 Iron + Tradeoff bonus 0.02 Iron − 0.01 Heart. Individual effect values all under 0.15. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T1 with 2 effects. Compliant. |
| Cooldown/Duration | N/A | No time-based effects. |
| Stacking Sanity | N/A | No stacking effects. |
| No Duplicate IDs | PASS | Upgrade of existing catalog entry. |
| Loss Condition | PASS | `breakable` appropriate for arms. |

**Verdict: PASS**

---

### 4. Bone Knife — `reward_arms_bone_knife`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.03 }
{ type: 'consumable_charge', charges: 3, onUse: { reach: 'iron', value: 0.04 }, destroyOnEmpty: true }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) and `consumable_charge` (Type 2) both valid. `ConsumableChargeEffect` shape: `charges: number`, `onUse: { reach, value }`, `destroyOnEmpty: boolean` — matches exactly. |
| Reach Values | PASS | 0.03 passive + 0.04 per charge. Charge burst (0.04) does not exceed 0.15 per-effect cap. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T1 with 2 effects. Compliant. |
| Cooldown/Duration | N/A | Charges are finite, not time-based. |
| Stacking Sanity | N/A | No stacking. `destroyOnEmpty: true` matches `lossCondition: 'consumable'`. |
| No Duplicate IDs | PASS | Upgrade of existing catalog entry. |
| Loss Condition | PASS | `consumable` is appropriate — the item self-destructs when charges are exhausted. Consistent with `destroyOnEmpty: true`. |

**Note:** The original catalog entry had `lossCondition: 'consumable'` (preserved). The revised draft also sets `consumable`. Consistent.

**Verdict: PASS**

---

### 5. Iron Blade — `starter_iron_blade`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.05 }
{ type: 'test_shaper', reach: 'iron', trigger: 'near_miss', steps: 1, maxMargin: 1 }
```

**onUseTriggers** (preserved):
```typescript
{
  triggerCondition: 'critical_failure',
  probability: 0.25,
  effect: { type: 'remove_possession' },
  narrativeTemplate: '{item_name} snaps against the blow.',
}
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) valid. `test_shaper` (Type 19e) valid. `TestShaperEffect` shape: `reach?: ReachDomain` (optional, provided), `trigger: TestShaperTrigger` (`near_miss` is valid), `steps: number` (1), `maxMargin?: number` (1) — all fields match. |
| Reach Values | PASS | 0.05 passive. `test_shaper` does not add a numeric reach modifier — it shifts outcome quality. No cap concern. |
| Predicate Validity | N/A | No conditional predicates on effects. |
| Tier Appropriateness | PASS | T1 with 2 effects (passive + test_shaper). Compliant. |
| Cooldown/Duration | N/A | No time-based effects. |
| Stacking Sanity | N/A | No stacking. |
| No Duplicate IDs | PASS | Upgrade of existing entry in `src/data/starter-attachments.ts`. Not in reward catalog — different file, no collision. |
| Loss Condition | PASS | `breakable` consistent with onUseTrigger that removes possession on critical_failure (0.25 probability). |
| onUseTrigger Validity | PASS | `triggerCondition: 'critical_failure'` is valid `TriggerCondition`. `effect.type: 'remove_possession'` is valid `OnUseTriggerEffect` type. `probability: 0.25` is in 0.0-1.0 range. |

**Note:** This item lives in `starter-attachments.ts`, not the reward catalog. The pipeline note correctly identifies this as an upgrade to an existing starter item. The `mechanicalSummary` in the existing catalog incorrectly says `'+0.10 Iron reach'` when `reachBonus` is `{ iron: 0.05 }` — the revised summary `'+0.05 Iron, rescues near-miss combat rolls (+1 step, within 1 margin)'` is more accurate and should be applied.

**Verdict: PASS**

---

### 6. Blackiron Blade — `reward_arms_blackiron_blade`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.08 }
{ type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success', decayPerTick: 1 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) and `stacking` (Type 9) both valid. All field names match `StackingEffect` interface. |
| Reach Values | PASS | 0.08 passive + 0.04 max stacking = 0.12 total. No single effect exceeds 0.15. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 2 effects (passive + stacking). Within T2: 1-2 beyond passive range. |
| Cooldown/Duration | PASS | `decayPerTick: 1` means 4 stacks decay in 4 ticks without combat. Reasonable active/dormant ratio. |
| Stacking Sanity | PASS | `maxStacks: 4` is within 2-10 range. Higher cap than Hunting Bow (T1) — appropriate tier progression. |
| No Duplicate IDs | PASS | Upgrade of existing catalog entry. |
| Loss Condition | PASS | `breakable` appropriate for arms. |

**Verdict: PASS**

---

### 7. Crossbow of the Watch — `reward_arms_crossbow_of_the_watch`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.07 }
{ type: 'passive', reach: 'eye', value: 0.03 }
{ type: 'range_modifier', awarenessRangeBonus: 1 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects are valid — same type, different reach domains, both distinct entries. `range_modifier` (Type 34) is `RangeModifierEffect`: `awarenessRangeBonus?: number` — field name matches exactly. |
| Reach Values | PASS | 0.07 Iron + 0.03 Eye = 0.10 total reach value. No per-effect violation. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 3 effects (2x passive + range_modifier). The two passives replace the single legacy `reachBonus: { iron: 0.07, eye: 0.03 }` — effectively 1 passive reach bonus (split across two domains) + 1 utility modifier. Within T2 budget. |
| Cooldown/Duration | N/A | No time-based effects. |
| Stacking Sanity | N/A | No stacking. |
| No Duplicate IDs | PASS | Upgrade of existing catalog entry. |
| Loss Condition | PASS | `stealable` preserved from original catalog entry. Appropriate for issued military equipment. |

**Note on effect count:** The two `passive` entries are mechanically equivalent to a single dual-reach passive that the original `reachBonus` represented. The `range_modifier` is the only genuinely new primitive. This is architecturally clean — 2 passives + 1 utility = T2 appropriate.

**Verdict: PASS**

---

### 8. Thornwood Staff — `reward_arms_thornwood_staff`

**Effects:**
```typescript
{ type: 'passive', reach: 'iron', value: 0.06 }
{ type: 'passive', reach: 'stone', value: 0.03 }
{ type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'iron', value: 0.03, destroyOnExpiry: true }, cooldown: 12 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) valid. `reactive` (Type 11) valid: `trigger: ReactiveTrigger` — `attacked` is in `ReactiveTrigger`. `effect: AttachmentEffect` — `DurationEffect` is part of `AttachmentEffect`. `cooldown?: number` field is optional, 12 provided. Inner `DurationEffect`: `type: 'duration'`, `ticks: 6`, `reach: 'iron'`, `value: 0.03`, `destroyOnExpiry: true` — all required fields present and correctly typed. |
| Reach Values | PASS | 0.06 Iron + 0.03 Stone + 0.03 reactive burst = 0.12 max. All individual effect values under 0.15. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 3 effects (2x passive + reactive). Two passives replace old `reachBonus` dual-reach; reactive adds new behavior. T2 budget maintained. |
| Cooldown/Duration | PASS | Reactive cooldown is 12 ticks; duration buff lasts 6 ticks. Active/dormant ratio: 6 active / 12 cooldown = 0.5. Reasonable — not spam-able. Duration 6 ticks is within 3-30 range. Cooldown 12 > COOLDOWN_MINIMUM_TICKS (5). |
| Stacking Sanity | N/A | No stacking. |
| No Duplicate IDs | PASS | Upgrade of existing catalog entry. |
| Loss Condition | PASS | `breakable` appropriate for a living wood weapon. |

**Note on `destroyOnExpiry`:** This flag is on the inner `DurationEffect`, not the staff node. It means the temporary buff expires after 6 ticks — the staff itself is not destroyed. This is the correct semantics: the thorn-burst fades, the staff persists.

**Verdict: PASS**

---

## Summary Table

| # | Name | Tier | Verdict | Issues |
|---|------|------|---------|--------|
| 1 | Bronze Spear | T1 | PASS | None |
| 2 | Hunting Bow | T1 | PASS | None |
| 3 | Rusted Mace | T1 | PASS | None |
| 4 | Bone Knife | T1 | PASS | None |
| 5 | Iron Blade | T1 | PASS | Minor: existing mechanicalSummary bug in starter catalog (+0.10 label for 0.05 value) corrected by revised summary |
| 6 | Blackiron Blade | T2 | PASS | None |
| 7 | Crossbow of the Watch | T2 | PASS | None |
| 8 | Thornwood Staff | T2 | PASS | None |

**All 8 items pass. No items excluded.**

## Overall Systems Verdict

**READY FOR IMPLEMENTATION**

All 8 attachment upgrades are mechanically correct. Every effect type matches a valid `AttachmentEffect` discriminant. All field names and value types are correct. Reach values are within per-effect and per-item caps. All predicates, triggers, and condition values are from the supported type enums. No new duplicate IDs introduced. Loss conditions are consistent with subcategory norms. Time-based effects have reasonable active/dormant ratios.

The one minor pre-existing data error (Iron Blade's `mechanicalSummary` incorrectly stated `'+0.10 Iron reach'` in starter-attachments.ts when `reachBonus` was `{ iron: 0.05 }`) is corrected by the revised summary. This is a housekeeping fix bundled with the upgrade.
