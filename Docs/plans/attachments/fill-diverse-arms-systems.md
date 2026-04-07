# Attachment Systems Audit: Non-Iron Arms Across Underserved Reaches
> Slug: fill-diverse-arms | Pass: systems | Date: 2026-04-07

Source files checked:
- `src/types/effects.ts` — 39 effect discriminants, all EffectCondition, StackTrigger, ReactiveTrigger, TestShaperTrigger types
- `src/types/attachments.ts` — PossessionNodeProperties, LossCondition
- `src/types/traits.ts` — ReachDomain (`iron | gold | shadow | veil | heart | eye | stone | star`)
- `src/data/effect-constants.ts` — EFFECT_PER_ITEM_CAP = 0.15, MAX_EFFECTS_PER_ATTACHMENT = 6, COOLDOWN_MINIMUM_TICKS = 5, STACKING_GLOBAL_CAP = 10
- `src/data/reward-attachment-catalog.ts` — ID collision check (0 of 10 new IDs present — confirmed new)

**Tier effect-count rule applied:** T1: 1–2 effects, T2: 2–3 effects (design doc). Runtime cap is MAX_EFFECTS_PER_ATTACHMENT = 6.
**Balance cap applied:** EFFECT_PER_ITEM_CAP = 0.15 total passive reach contribution from all always-on effects per item.
**Catalog precedent for T1 3-effect items:** `reward_tools_instruments_gate_seal_case` (T1) has 3 effects (passive, passive, conditional) — already in catalog.

---

## Audit Results

### 1. Grave-Robber's Stiletto — `reward_arms_grave_robbers_stiletto`

**Effects:**
```typescript
{ type: 'passive', reach: 'shadow', value: 0.03 }
{ type: 'conditional', condition: 'alone', reach: 'shadow', value: 0.02 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): `reach: ReachDomain`, `value: number` — correct. `conditional` (Type 6): `condition: EffectPredicate`, `reach: ReachDomain`, `value: number` — correct. `alone` is a valid `EffectCondition`. |
| Reach Values | PASS | `shadow` is valid `ReachDomain`. 0.03 passive + 0.02 conditional = 0.05 max. No single effect exceeds 0.15. |
| Predicate Validity | PASS | `alone` is in `EffectCondition` union. |
| Tier Appropriateness | PASS | T1 with 2 effects. Exactly within T1 budget (1–2). |
| Stacking Sanity | N/A | No stacking effects. |
| Cooldown/Duration | N/A | No time-based effects. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `stealable` appropriate for a concealable stiletto. |

**Verdict: PASS**

---

### 2. Strangler's Cord — `reward_arms_stranglers_cord`

**Effects:**
```typescript
{ type: 'passive', reach: 'shadow', value: 0.05 }
{ type: 'tradeoff', bonus: { reach: 'shadow', value: 0.03 }, penalty: { reach: 'heart', value: 0.02 } }
{ type: 'stacking', reach: 'shadow', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) valid. `tradeoff` (Type 13): `bonus: { reach: ReachDomain, value: number }`, `penalty: { reach: ReachDomain, value: number }` — both fields match `TradeoffEffect` exactly. `stacking` (Type 9): `reach`, `valuePerStack`, `maxStacks`, `stackOn: StackTrigger`, `decayPerTick?: number` — all fields match `StackingEffect`. `combat_success` is a valid `StackTrigger`. |
| Reach Values | PASS | `shadow` and `heart` are valid `ReachDomain`. Passive 0.05 + tradeoff bonus 0.03 = 0.08 always-on Shadow. Max 0.11 at full stacks. Heart penalty is -0.02. No individual effect exceeds 0.15. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 3 effects. Within T2 budget (2–3). |
| Stacking Sanity | PASS | `maxStacks: 3` is within [2, STACKING_GLOBAL_CAP=10]. `decayPerTick: 1` is the optional `decayPerTick?: number` field — correctly typed. |
| Cooldown/Duration | N/A | No time-based effects. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `breakable` appropriate for braided horsehair under strain. |

**Verdict: PASS**

---

### 3. Hazel Switch — `reward_arms_hazel_switch`

**Effects:**
```typescript
{ type: 'passive', reach: 'veil', value: 0.04 }
{ type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.03 }
{ type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 4, reach: 'veil', value: 0.03, destroyOnExpiry: true }, cooldown: 10 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) valid. `conditional` (Type 6): `in_mystical` is valid `EffectCondition`. `reactive` (Type 11): `trigger: ReactiveTrigger` — `attacked` is valid. `effect: AttachmentEffect` — inner `DurationEffect` has `type: 'duration'`, `ticks: number`, `reach: ReachDomain`, `value: number`, `destroyOnExpiry: boolean` — all required fields present, all types correct. `cooldown?: number` field is optional in `ReactiveEffect`, 10 provided. |
| Reach Values | PASS | `veil` is valid `ReachDomain`. 0.04 passive + 0.03 conditional + 0.03 reactive burst = 0.10 max. No effect exceeds 0.15. |
| Predicate Validity | PASS | `in_mystical` is in `EffectCondition` union. |
| Tier Appropriateness | PASS | T2 with 3 effects. Within T2 budget (2–3). |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | PASS | Reactive cooldown 10 ticks > COOLDOWN_MINIMUM_TICKS (5). Duration 4 ticks is reasonable for a brief ward. `destroyOnExpiry: true` applies to the inner temporary buff, not the item itself — correct semantics. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `breakable` appropriate for a wood implement. |

**Verdict: PASS**

---

### 4. Cracked Brass Horn — `reward_arms_cracked_brass_horn`

**Effects:**
```typescript
{ type: 'passive', reach: 'heart', value: 0.03 }
{ type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.02 }
{ type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.3 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) valid. `conditional` (Type 6): `in_social` valid `EffectCondition`. `social_modifier` (Type 31): `targetFilter: 'ally' \| 'enemy' \| 'any' \| 'same_faction' \| 'different_faction'` — `ally` is valid. `cooperationBias: number` — 0.3 is valid. |
| Reach Values | PASS | `heart` is valid `ReachDomain`. 0.03 passive + 0.02 conditional = 0.05 max. `social_modifier` contributes no reach value — cooperation bias is a disposition modifier. Total under 0.15. |
| Predicate Validity | PASS | `in_social` is in `EffectCondition` union. |
| Tier Appropriateness | CAVEAT | T1 with 3 effects. Exceeds T1 design rule (1–2). However: the `social_modifier` is a zero-reach utility effect (not a numerical bonus). Catalog precedent exists: `reward_tools_instruments_gate_seal_case` (T1) has 3 effects. Recommend noting in implementation or bumping to T2 if designers want strict compliance. |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | N/A | No time-based effects. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `breakable` appropriate for brass instrument. |

**Verdict: PASS WITH CAVEAT** — 3 effects on T1; consistent with existing Gate Seal Case precedent but exceeds the design doc rule. Acceptable as-is or can be resolved by dropping `{ type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.02 }` to reach exactly 2 effects.

---

### 5. Banner of the Lost Company — `reward_arms_banner_of_the_lost_company`

**Effects:**
```typescript
{ type: 'passive', reach: 'heart', value: 0.05 }
{ type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.03 }
{ type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.5 }
{ type: 'behavior_weight', reach: 'iron', multiplier: 1.3 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) valid. `conditional` (Type 6): `in_combat` is valid `EffectCondition`, `iron` and `heart` are valid `ReachDomain`. `social_modifier` (Type 31): `same_faction` is valid `targetFilter`. `behavior_weight` (Type 30): `reach: ReachDomain` (`iron` valid), `multiplier: number` (1.3 valid) — matches `BehaviorWeightEffect` exactly. |
| Reach Values | PASS | Heart 0.05 passive + Iron 0.03 conditional = 0.08 max. No effect exceeds 0.15. `social_modifier` and `behavior_weight` contribute no reach value. |
| Predicate Validity | PASS | `in_combat` is in `EffectCondition` union. |
| Tier Appropriateness | CAVEAT | T2 with 4 effects. Exceeds T2 design rule (2–3). The `social_modifier` and `behavior_weight` are zero-reach utility effects. If counted as 2 reach effects (passive + conditional) + 2 utility modifiers, the design intent is T2-appropriate. Runtime cap MAX_EFFECTS_PER_ATTACHMENT = 6 is not violated. Recommend noting as a 4-effect T2 item. |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | N/A | No time-based effects. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `stealable` appropriate for a battle standard that can be captured. |

**Verdict: PASS WITH CAVEAT** — 4 effects on T2. All type-valid. Recommend accepting as a rich T2 item or splitting by removing `behavior_weight` (the effect is implied by a Heart-primary bearer carrying a battle standard).

---

### 6. Spotter's Marking Bolt — `reward_arms_spotters_marking_bolt`

**Effects:**
```typescript
{ type: 'passive', reach: 'eye', value: 0.03 }
{ type: 'range_modifier', awarenessRangeBonus: 1 }
{ type: 'consumable_charge', charges: 4, onUse: { reach: 'eye', value: 0.03 }, destroyOnEmpty: true }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) valid. `range_modifier` (Type 34): `awarenessRangeBonus?: number` — field name matches `RangeModifierEffect` exactly. `consumable_charge` (Type 2): `charges: number`, `onUse: { reach: ReachDomain, value: number }`, `destroyOnEmpty: boolean` — all required fields present and correctly typed. |
| Reach Values | PASS | `eye` is valid `ReachDomain`. 0.03 passive + 0.03 per charge burst. No effect exceeds 0.15. `range_modifier` contributes no reach value. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | CAVEAT | T1 with 3 effects. Exceeds T1 design rule (1–2). However, `range_modifier` is a zero-reach utility; this is structurally a 1-passive + 1-utility + 1-consumable item. Catalog precedent (Gate Seal Case) supports 3-effect T1. `lossCondition: 'consumable'` is consistent with `destroyOnEmpty: true`. |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | N/A | Charges are finite, not time-based. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `consumable` matches `destroyOnEmpty: true` on the charge effect. |

**Verdict: PASS WITH CAVEAT** — 3 effects on T1. Structurally sound (1 passive + 1 utility + 1 consumable). Consistent with Gate Seal Case precedent.

---

### 7. Lens-Sighted Arbalest — `reward_arms_lens_sighted_arbalest`

**Effects:**
```typescript
{ type: 'passive', reach: 'eye', value: 0.05 }
{ type: 'passive', reach: 'iron', value: 0.02 }
{ type: 'test_shaper', reach: 'eye', trigger: 'near_miss', steps: 1, maxMargin: 2 }
{ type: 'range_modifier', awarenessRangeBonus: 1 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects valid — different reach domains. `test_shaper` (Type 19e): `reach?: ReachDomain` (optional, `eye` provided), `trigger: TestShaperTrigger` (`near_miss` is valid), `steps: number` (1), `maxMargin?: number` (2) — all fields match `TestShaperEffect` exactly. `range_modifier` (Type 34): `awarenessRangeBonus?: number` (1) — field name matches exactly. |
| Reach Values | PASS | `eye` and `iron` are valid `ReachDomain`. 0.05 Eye + 0.02 Iron = 0.07 total passive. `test_shaper` shifts outcome quality (no numeric reach contribution). `range_modifier` contributes no reach value. All under 0.15. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | CAVEAT | T2 with 4 effects. Exceeds T2 design rule (2–3). Two passives + test_shaper + range_modifier. Structurally: 2-reach passive (split across two domains, as established in Crossbow of the Watch precedent) + 2 utility modifiers. The two utility effects (test_shaper, range_modifier) add mechanical texture without reach inflation. Runtime cap (6) not violated. |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | N/A | No time-based effects. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `breakable` appropriate — the quartz lens is fragile. |

**Verdict: PASS WITH CAVEAT** — 4 effects on T2. All type-valid. The 4-effect count is the only concern; the two utility effects (test_shaper, range_modifier) carry no reach value and the item reads as a precision instrument with two reach domains, which is established T2 pattern (cf. Crossbow of the Watch).

---

### 8. Basalt Maul — `reward_arms_basalt_maul`

**Effects:**
```typescript
{ type: 'passive', reach: 'stone', value: 0.04 }
{ type: 'tradeoff', bonus: { reach: 'stone', value: 0.02 }, penalty: { reach: 'eye', value: 0.01 } }
{ type: 'tag_immunity', tags: ['bruise'] }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1) valid. `tradeoff` (Type 13): `bonus: { reach: ReachDomain, value: number }`, `penalty: { reach: ReachDomain, value: number }` — matches `TradeoffEffect` exactly. `tag_immunity` (Type 35): `tags: readonly string[]` — `['bruise']` is valid; `bruise` is a semantic tag string, not an enum value. |
| Reach Values | PASS | `stone` and `eye` are valid `ReachDomain`. 0.04 Stone passive + 0.02 Stone tradeoff bonus = 0.06 Stone always-on; Eye -0.01 penalty. `tag_immunity` contributes no reach value. Total under 0.15. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | CAVEAT | T1 with 3 effects. Exceeds T1 design rule (1–2). `tag_immunity` is a zero-reach utility. Catalog precedent (Gate Seal Case) supports 3-effect T1. Structurally: 1 passive + 1 tradeoff + 1 utility. |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | N/A | No time-based effects. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `breakable` appropriate — stone can shatter under extreme force. |

**Verdict: PASS WITH CAVEAT** — 3 effects on T1. All type-valid. Consistent with Gate Seal Case precedent.

---

### 9. Petrified Ironwood Glaive — `reward_arms_petrified_ironwood_glaive`

**Effects:**
```typescript
{ type: 'passive', reach: 'stone', value: 0.05 }
{ type: 'passive', reach: 'iron', value: 0.03 }
{ type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'stone', value: 0.03, destroyOnExpiry: true }, cooldown: 12 }
{ type: 'range_modifier', movementCostMultiplier: 1.2 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects valid. `reactive` (Type 11): `trigger: 'attacked'` valid `ReactiveTrigger`. Inner `DurationEffect`: `type: 'duration'`, `ticks: 6`, `reach: 'stone'`, `value: 0.03`, `destroyOnExpiry: true` — all required fields present, all types correct. `cooldown?: number` (12) is correctly typed optional field. `range_modifier` (Type 34): `movementCostMultiplier?: number` (1.2) — field name matches `RangeModifierEffect` exactly. |
| Reach Values | PASS | `stone` and `iron` are valid `ReachDomain`. 0.05 Stone + 0.03 Iron + 0.03 reactive burst = 0.11 max. `range_modifier` with `movementCostMultiplier` contributes no reach value. No individual effect exceeds 0.15. |
| Predicate Validity | N/A | No conditional predicates. |
| Tier Appropriateness | CAVEAT | T2 with 4 effects. Exceeds T2 design rule (2–3). Two passives (established dual-reach T2 pattern) + reactive + penalty range_modifier. The `range_modifier` here is a cost/penalty, not a bonus — it is mechanically significant (20% slower movement) and justifies dedicated effect slot. Runtime cap (6) not violated. |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | PASS | Reactive cooldown 12 ticks > COOLDOWN_MINIMUM_TICKS (5). Duration 6 ticks is within normal range. `destroyOnExpiry: true` on inner effect means buff expires — the glaive itself is not destroyed. Cooldown active ratio: 6 active / 12 cooldown = 0.5, consistent with Thornwood Staff precedent. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `breakable` appropriate for petrified wood under sustained combat stress. |

**Verdict: PASS WITH CAVEAT** — 4 effects on T2. All type-valid. The `movementCostMultiplier: 1.2` penalty is load-bearing to the item's identity (weight tradeoff) and warrants its own effect slot.

---

### 10. Assessor's Weighted Scales — `reward_arms_assessors_weighted_scales`

**Effects:**
```typescript
{ type: 'passive', reach: 'gold', value: 0.05 }
{ type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.03 }
{ type: 'passive', reach: 'iron', value: -0.02 }
{ type: 'social_modifier', targetFilter: 'enemy', cooperationBias: -0.2 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects valid — `gold` and `iron`. Negative value (`-0.02`) is valid for `PassiveEffect.value: number`. `conditional` (Type 6): `in_social` valid `EffectCondition`. `social_modifier` (Type 31): `targetFilter: 'enemy'` is valid. `cooperationBias: -0.2` is valid (negative = reduces cooperation). |
| Reach Values | PASS | `gold` and `iron` are valid `ReachDomain`. Gold 0.05 passive + 0.03 conditional = 0.08 max; Iron -0.02 passive. `social_modifier` contributes no reach value. No individual effect exceeds ±0.15. |
| Predicate Validity | PASS | `in_social` is in `EffectCondition` union. |
| Tier Appropriateness | CAVEAT | T2 with 4 effects. Exceeds T2 design rule (2–3). Two passives (dual-reach pattern) + conditional + social_modifier. `social_modifier` is a zero-reach utility. Structurally: 1 reach passive (gold) + 1 penalty passive (iron) + 1 conditional + 1 social utility. Runtime cap (6) not violated. |
| Stacking Sanity | N/A | No stacking. |
| Cooldown/Duration | N/A | No time-based effects. |
| No Duplicate IDs | PASS | ID not found in catalog — new entry. |
| Loss Condition | PASS | `stealable` appropriate — institutional instrument representing transferable authority. |

**Note on negative passive:** A `PassiveEffect` with `value: -0.02` is a valid Iron penalty. The resolver sums all passive contributions, so this correctly reduces Iron reach by 0.02. This is the same mechanic as Hollowfang (`passive heart -0.05`) which is already in catalog.

**Verdict: PASS WITH CAVEAT** — 4 effects on T2. All type-valid. Negative passive is valid and has catalog precedent.

---

## Summary Table

| # | Name | Tier | Effects | Type Valid | Reach Valid | Predicate Valid | Balance | Dupe ID | Verdict |
|---|------|------|---------|-----------|------------|----------------|---------|---------|---------|
| 1 | Grave-Robber's Stiletto | T1 | 2 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| 2 | Strangler's Cord | T2 | 3 | PASS | PASS | N/A | PASS | PASS | **PASS** |
| 3 | Hazel Switch | T2 | 3 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| 4 | Cracked Brass Horn | T1 | 3 | PASS | PASS | PASS | PASS | PASS | **PASS WITH CAVEAT** |
| 5 | Banner of the Lost Company | T2 | 4 | PASS | PASS | PASS | PASS | PASS | **PASS WITH CAVEAT** |
| 6 | Spotter's Marking Bolt | T1 | 3 | PASS | PASS | N/A | PASS | PASS | **PASS WITH CAVEAT** |
| 7 | Lens-Sighted Arbalest | T2 | 4 | PASS | PASS | N/A | PASS | PASS | **PASS WITH CAVEAT** |
| 8 | Basalt Maul | T1 | 3 | PASS | PASS | N/A | PASS | PASS | **PASS WITH CAVEAT** |
| 9 | Petrified Ironwood Glaive | T2 | 4 | PASS | PASS | N/A | PASS | PASS | **PASS WITH CAVEAT** |
| 10 | Assessor's Weighted Scales | T2 | 4 | PASS | PASS | PASS | PASS | PASS | **PASS WITH CAVEAT** |

### Caveat Summary

| Caveat | Items Affected | Severity | Resolution |
|--------|---------------|----------|------------|
| T1 items with 3 effects (design rule says 1–2) | #4, #6, #8 | Low — catalog precedent exists (Gate Seal Case, T1, 3 effects) | Accept as-is or drop one utility effect per item to reach 2 |
| T2 items with 4 effects (design rule says 2–3) | #5, #7, #9, #10 | Low — runtime cap (6) not violated; extra effects are zero-reach utility | Accept as-is or defer one utility effect per item |
| No blocker-level type errors found | — | — | — |

## Overall Systems Verdict

**READY WITH CAVEATS**

All 10 items are type-valid. Every effect field name matches its TypeScript interface exactly. All reach values use valid `ReachDomain` literals. All predicates use valid `EffectCondition` values. All trigger types are from supported enums. No item exceeds the EFFECT_PER_ITEM_CAP (0.15) on passive reach. No duplicate IDs introduced.

The caveats are effect-count violations of the design doc's T1:1–2 / T2:2–3 tier rule. These are not runtime errors — the engine enforces only MAX_EFFECTS_PER_ATTACHMENT = 6, which is not violated. The pattern (zero-reach utility effects inflating the count) is already established in the catalog (Gate Seal Case T1 has 3 effects; The Quiet Blade T4 has 5 effects). Implementors may accept these items as drafted, or apply the suggested reductions.
