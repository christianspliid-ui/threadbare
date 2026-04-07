# Attachment Systems Audit: Diverse Mounts Across Underserved Reaches
> Slug: fill-diverse-mounts | Pass: systems | Date: 2026-04-07

Source files checked:
- `src/types/effects.ts` — 39 effect discriminants, all EffectCondition, ReactiveTrigger types
- `src/types/attachments.ts` — PossessionNodeProperties, LossCondition
- `src/types/traits.ts` — ReachDomain (`iron | gold | shadow | veil | heart | eye | stone | star`)
- `src/types/rarity.ts` — RarityTier (`1 | 2 | 3 | 4`)
- `src/data/effect-constants.ts` — EFFECT_PER_ITEM_CAP = 0.15, MAX_EFFECTS_PER_ATTACHMENT = 6, COOLDOWN_MINIMUM_TICKS = 5
- `src/data/reward-attachment-catalog.ts` — ID collision check (0 of 8 new IDs present — confirmed new)

**Balance cap applied:** EFFECT_PER_ITEM_CAP = 0.15 — max passive reach contribution from always-on effects **per single reach domain** per item. Items with multi-reach passives are audited per-reach, not in aggregate.
**Hard cap:** MAX_EFFECTS_PER_ATTACHMENT = 6 — this is a runtime engine constraint, not a design guideline. Violations block implementation.
**Tier effect-count guideline:** T2: 2–4 effects, T3: 3–5 effects, T4: 4–6 effects (inferred from catalog and design doc). Design-doc rule is guidance; engine enforces only the hard cap of 6.

---

## Audit Results

### 1. Dustwalker — `reward_mounts_beasts_dustwalker`

**Effects (3):**
```typescript
{ type: 'passive', reach: 'shadow', value: 0.04 }
{ type: 'range_modifier', movementCostMultiplier: 0.85 }
{ type: 'conditional', condition: 'in_enemy_territory', reach: 'shadow', value: 0.03 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): `reach: ReachDomain`, `value: number` — correct. `range_modifier` (Type 34): `movementCostMultiplier?: number` (0.85) — field name matches `RangeModifierEffect` exactly. `conditional` (Type 6): `condition: EffectPredicate`, `reach: ReachDomain`, `value: number` — all required fields present. |
| Reach Values | PASS | `shadow` is a valid `ReachDomain`. 0.04 passive + 0.03 conditional = 0.07 max Shadow. No single effect exceeds 0.15. |
| Predicates | PASS | `in_enemy_territory` is a valid `EffectCondition`. |
| Tier Appropriateness | PASS | T2 with 3 effects. Within T2 range. |
| Balance | PASS | Max Shadow = 0.07. Under EFFECT_PER_ITEM_CAP (0.15). `range_modifier` contributes no reach value. |
| Effect Count | PASS | 3 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Duplicate ID | PASS | `reward_mounts_beasts_dustwalker` not found in catalog. |
| Loss Condition | PASS | `stealable` is a valid `LossCondition`. Thematically appropriate for an infiltrator's beast. |

**Verdict: PASS**

---

### 2. Smoke-Tooth — `reward_mounts_beasts_smoke_tooth`

**Effects (5):**
```typescript
{ type: 'passive', reach: 'shadow', value: 0.07 }
{ type: 'passive', reach: 'iron', value: 0.03 }
{ type: 'range_modifier', movementCostMultiplier: 0.85 }
{ type: 'trait_grant', grantedTrait: 'shadow_strike' }
{ type: 'aura', radius: 1, target: 'enemies', reach: 'eye', value: -0.03 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects: valid. `range_modifier` (Type 34): `movementCostMultiplier?: number` matches `RangeModifierEffect`. `trait_grant` (Type 7): `grantedTrait: string` — `'shadow_strike'` is valid. `aura` (Type 10): `radius: number`, `target: 'allies' \| 'enemies' \| 'all'`, `reach: ReachDomain`, `value: number` — all required fields present and typed correctly. `target: 'enemies'` is a valid discriminant. |
| Reach Values | PASS | `shadow`, `iron`, `eye` are valid `ReachDomain`. Shadow 0.07, Iron 0.03 — neither exceeds 0.15 per-reach. Eye aura = -0.03 on enemies (debuff), not on the bearer — no per-item cap concern. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T3 with 5 effects. Within T3 range. |
| Balance | PASS | Shadow 0.07 and Iron 0.03 both under EFFECT_PER_ITEM_CAP (0.15). Aura debuff does not count against the bearer's cap. |
| Effect Count | PASS | 5 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Duplicate ID | PASS | `reward_mounts_beasts_smoke_tooth` not found in catalog. |
| Loss Condition | PASS | `permanent` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 3. Shimmer Hart — `reward_mounts_beasts_shimmer_hart`

**Effects (3):**
```typescript
{ type: 'passive', reach: 'veil', value: 0.04 }
{ type: 'range_modifier', movementCostMultiplier: 0.9, awarenessRangeBonus: 1 }
{ type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.03 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): correct. `range_modifier` (Type 34): both `movementCostMultiplier?: number` and `awarenessRangeBonus?: number` are optional fields on `RangeModifierEffect` — both provided on a single effect instance, which is valid (the interface allows both optional fields simultaneously). `conditional` (Type 6): `in_mystical` is valid `EffectCondition`. |
| Reach Values | PASS | `veil` is a valid `ReachDomain`. 0.04 passive + 0.03 conditional = 0.07 max Veil. Under 0.15. |
| Predicates | PASS | `in_mystical` is a valid `EffectCondition`. |
| Tier Appropriateness | PASS | T2 with 3 effects. Within T2 range. |
| Balance | PASS | Max Veil 0.07. Under EFFECT_PER_ITEM_CAP (0.15). |
| Effect Count | PASS | 3 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Duplicate ID | PASS | `reward_mounts_beasts_shimmer_hart` not found in catalog. |
| Loss Condition | PASS | `stealable` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 4. Glimmermoth — `reward_mounts_beasts_glimmermoth`

**Effects (5):**
```typescript
{ type: 'passive', reach: 'veil', value: 0.06 }
{ type: 'passive', reach: 'eye', value: 0.03 }
{ type: 'range_modifier', movementCostMultiplier: 0.85, awarenessRangeBonus: 2 }
{ type: 'tag_immunity', tags: ['fear', 'illusion'] }
{ type: 'behavior_weight', reach: 'veil', multiplier: 1.3 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects: valid. `range_modifier` (Type 34): both optional fields present simultaneously — valid (see item #3 note). `tag_immunity` (Type 35): `tags: readonly string[]` — `['fear', 'illusion']` is valid; these are semantic tag strings, not enums. `behavior_weight` (Type 30): `reach: ReachDomain` (`veil` valid), `multiplier: number` (1.3) — matches `BehaviorWeightEffect` exactly. |
| Reach Values | PASS | `veil` and `eye` are valid `ReachDomain`. Veil 0.06, Eye 0.03 — neither exceeds 0.15 per-reach. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T3 with 5 effects. Within T3 range. |
| Balance | PASS | Veil 0.06 and Eye 0.03 both under EFFECT_PER_ITEM_CAP (0.15). `tag_immunity` and `behavior_weight` contribute no reach value. |
| Effect Count | PASS | 5 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Duplicate ID | PASS | `reward_mounts_beasts_glimmermoth` not found in catalog. |
| Loss Condition | PASS | `permanent` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 5. Hearthbound Hound — `reward_mounts_beasts_hearthbound_hound`

**Effects (4):**
```typescript
{ type: 'passive', reach: 'heart', value: 0.04 }
{ type: 'passive', reach: 'iron', value: 0.02 }
{ type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.15 }
{ type: 'reactive', trigger: 'damaged', effect: {
    type: 'duration', ticks: 3, reach: 'heart', value: 0.04, destroyOnExpiry: true
  }, cooldown: 8 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects: valid. `social_modifier` (Type 31): `targetFilter: 'ally'` is valid discriminant, `cooperationBias: number` (0.15) — matches `SocialModifierEffect` exactly. `reactive` (Type 11): `trigger: ReactiveTrigger` — `'damaged'` is a valid `ReactiveTrigger`. `effect: AttachmentEffect` — inner `DurationEffect`: `type: 'duration'`, `ticks: 3`, `reach: 'heart'`, `value: 0.04`, `destroyOnExpiry: true` — all required fields on `DurationEffect` present and correctly typed. `cooldown?: number` (8) is the optional field on `ReactiveEffect` — correctly provided. |
| Reach Values | PASS | `heart` and `iron` are valid `ReachDomain`. Heart 0.04 passive + 0.04 reactive burst = 0.08 max Heart (burst is conditional, not always-on). Iron 0.02 passive. No always-on reach exceeds 0.15. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 4 effects. Acceptable for T2 (utility-heavy: 2 passives + 1 social utility + 1 reactive). |
| Balance | PASS | Heart passive 0.04 and Iron passive 0.02 both under EFFECT_PER_ITEM_CAP (0.15). Reactive burst is conditional. |
| Effect Count | PASS | 4 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Cooldown | PASS | Reactive cooldown 8 ticks > COOLDOWN_MINIMUM_TICKS (5). Duration 3 ticks is short but valid (in the spirit of a momentary surge). |
| Duplicate ID | PASS | `reward_mounts_beasts_hearthbound_hound` not found in catalog. |
| Loss Condition | PASS | `permanent` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 6. Sorrowheart Mare — `reward_mounts_beasts_sorrowheart_mare`

**Effects (5):**
```typescript
{ type: 'passive', reach: 'heart', value: 0.08 }
{ type: 'passive', reach: 'gold', value: 0.03 }
{ type: 'range_modifier', movementCostMultiplier: 0.8 }
{ type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 }
{ type: 'trait_grant', grantedTrait: 'empathic_bond' }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects: valid. `range_modifier` (Type 34): `movementCostMultiplier?: number` (0.8) matches `RangeModifierEffect`. `aura` (Type 10): `radius: number` (1), `target: 'allies'` (valid discriminant), `reach: 'heart'` (valid), `value: number` (0.02) — all required fields present. `trait_grant` (Type 7): `grantedTrait: string` — `'empathic_bond'` is valid. |
| Reach Values | PASS | `heart` and `gold` are valid `ReachDomain`. Heart 0.08, Gold 0.03 — neither exceeds 0.15 per-reach. Aura `heart: 0.02` applies to nearby allies, not the bearer — no per-item cap concern. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T3 with 5 effects. Within T3 range. |
| Balance | PASS | Heart 0.08 and Gold 0.03 both under EFFECT_PER_ITEM_CAP (0.15). |
| Effect Count | PASS | 5 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Duplicate ID | PASS | `reward_mounts_beasts_sorrowheart_mare` not found in catalog. |
| Loss Condition | PASS | `permanent` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 7. Dawnfeather Kestrel — `reward_mounts_beasts_dawnfeather_kestrel`

**Effects (5):**
```typescript
{ type: 'passive', reach: 'star', value: 0.06 }
{ type: 'passive', reach: 'eye', value: 0.04 }
{ type: 'range_modifier', awarenessRangeBonus: 3 }
{ type: 'behavior_weight', reach: 'eye', multiplier: 1.2 }
{ type: 'reactive', trigger: 'encounter_started', effect: {
    type: 'duration', ticks: 4, reach: 'star', value: 0.03, destroyOnExpiry: true
  }, cooldown: 6 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects: valid. `range_modifier` (Type 34): `awarenessRangeBonus?: number` (3) — field name matches `RangeModifierEffect` exactly; `movementCostMultiplier` omitted (optional) — valid. `behavior_weight` (Type 30): `reach: 'eye'`, `multiplier: 1.2` — matches `BehaviorWeightEffect` exactly. `reactive` (Type 11): `trigger: ReactiveTrigger` — `'encounter_started'` is a valid `ReactiveTrigger` (listed in the `ReactiveTrigger` union in `effects.ts`). Inner `DurationEffect`: `type: 'duration'`, `ticks: 4`, `reach: 'star'`, `value: 0.03`, `destroyOnExpiry: true` — all required fields correct. `cooldown?: number` (6) correctly provided. |
| Reach Values | PASS | `star` and `eye` are valid `ReachDomain`. Star 0.06, Eye 0.04 — neither exceeds 0.15 per-reach. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T3 with 5 effects. Within T3 range. |
| Balance | PASS | Star 0.06 and Eye 0.04 both under EFFECT_PER_ITEM_CAP (0.15). Reactive burst is conditional. |
| Effect Count | PASS | 5 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Cooldown | PASS | Reactive cooldown 6 ticks > COOLDOWN_MINIMUM_TICKS (5). Duration 4 ticks is appropriate. |
| Duplicate ID | PASS | `reward_mounts_beasts_dawnfeather_kestrel` not found in catalog. |
| Loss Condition | PASS | `permanent` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 8. The Pale Pilgrim — `reward_mounts_beasts_pale_pilgrim`

**Effects (7):**
```typescript
{ type: 'passive', reach: 'star', value: 0.06 }
{ type: 'passive', reach: 'veil', value: 0.04 }
{ type: 'passive', reach: 'eye', value: 0.03 }
{ type: 'range_modifier', movementCostMultiplier: 0.75, awarenessRangeBonus: 2 }
{ type: 'tag_immunity', tags: ['fear', 'curse'] }
{ type: 'aura', radius: 1, target: 'allies', reach: 'star', value: 0.02 }
{ type: 'trait_grant', grantedTrait: 'starborne_rider' }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Three `passive` (Type 1) effects: valid. `range_modifier` (Type 34): both optional fields simultaneously provided — valid. `tag_immunity` (Type 35): `tags: readonly string[]` — `['fear', 'curse']` valid semantic strings. `aura` (Type 10): `radius: 1`, `target: 'allies'`, `reach: 'star'`, `value: 0.02` — all required fields present. `trait_grant` (Type 7): `grantedTrait: 'starborne_rider'` — valid. All 7 effects are individually type-correct. |
| Reach Values | PASS | `star`, `veil`, `eye` are valid `ReachDomain`. Star 0.06, Veil 0.04, Eye 0.03 — no single reach exceeds 0.15 per-reach. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T4 with 7 effects — **see Effect Count below.** T4 is the only tier where 6 effects is permitted by the design guideline. |
| Balance | PASS | All per-reach passive values (0.06, 0.04, 0.03) are individually under EFFECT_PER_ITEM_CAP (0.15). Aura targets allies (not bearer). Total passive spread is 0.13 — within cap. |
| **Effect Count** | **FAIL** | **7 effects EXCEEDS MAX_EFFECTS_PER_ATTACHMENT = 6 (hard engine cap defined in `src/data/effect-constants.ts`).** This is a runtime constraint, not a design guideline. The engine will reject or truncate this attachment at load time. |
| Duplicate ID | PASS | `reward_mounts_beasts_pale_pilgrim` not found in catalog. |
| Loss Condition | PASS | `permanent` is a valid `LossCondition`. |

**Verdict: FAIL — Effect count violation (7 > 6 hard cap)**

**Required fix:** Remove one effect before implementation. Recommended removal candidates (least thematically load-bearing):
- **Option A (preferred):** Remove `{ type: 'tag_immunity', tags: ['fear', 'curse'] }`. The celestial composure flavor is already conveyed by three passive reaches and the `starborne_rider` trait. Leaves 6 effects exactly.
- **Option B:** Remove `{ type: 'passive', reach: 'eye', value: 0.03 }`. Reduces to Star+Veil dual-reach with Eye moved into aura only (Star aura already present). The eye sensitivity is preserved thematically through `awarenessRangeBonus: 2`. Leaves 6 effects exactly.
- **Option C:** Merge the `tag_immunity` tags into a parameterized predicate on one of the passives using `condition: 'has_trait:fear'` pattern — but this changes semantic meaning and is not cleaner. **Not recommended.**

---

## Summary Table

| # | Name | Tier | Effects | Type Valid | Reach Valid | Predicate Valid | Balance | Under Hard Cap | Dupe ID | Verdict |
|---|------|------|---------|-----------|------------|----------------|---------|----------------|---------|---------|
| 1 | Dustwalker | T2 | 3 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| 2 | Smoke-Tooth | T3 | 5 | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| 3 | Shimmer Hart | T2 | 3 | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| 4 | Glimmermoth | T3 | 5 | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| 5 | Hearthbound Hound | T2 | 4 | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| 6 | Sorrowheart Mare | T3 | 5 | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| 7 | Dawnfeather Kestrel | T3 | 5 | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| 8 | The Pale Pilgrim | T4 | 7 | PASS | PASS | N/A | PASS | **FAIL** | PASS | **FAIL** |

### Issue Register

| Severity | Item | Issue | Fix Required |
|----------|------|-------|--------------|
| **BLOCKER** | #8 The Pale Pilgrim | 7 effects exceeds MAX_EFFECTS_PER_ATTACHMENT = 6 (hard engine cap) | Remove one effect before implementation. See Option A / Option B above. |

## Overall Systems Verdict

**READY WITH CAVEATS — one item requires a one-line fix before implementation**

7 of 8 items are fully type-valid and ready for implementation as-is. Item #8 (The Pale Pilgrim) has a single hard-cap violation: 7 effects against a MAX_EFFECTS_PER_ATTACHMENT = 6 runtime limit. This is not a design taste issue — the engine enforces this limit. The fix is trivial (remove one of the 7 effects; Option A above is the cleanest). Once corrected, the full batch is implementation-ready.

No reach domain errors. No invalid predicate values. No duplicate IDs. No per-reach balance violations.
