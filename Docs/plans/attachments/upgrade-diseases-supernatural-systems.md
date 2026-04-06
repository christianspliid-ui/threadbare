# Systems Audit: upgrade-diseases-supernatural
> Pass: systems | Date: 2026-04-06
> **Verdict: READY WITH CAVEATS**

## Validation Sources

- `src/types/effects.ts` — effect discriminants, ReachDomain, StackTrigger, ReactiveTrigger, ExpiryEvent, EffectCondition
- `src/data/effect-constants.ts` — EFFECT_PER_ITEM_CAP = 0.15 (per-reach), STACKING_GLOBAL_CAP = 10
- `src/data/reward-attachment-catalog.ts` — existing item IDs (no duplicate check needed: all 11 IDs exist and are being upgraded in-place)

## Cap Clarification

`EFFECT_PER_ITEM_CAP = 0.15` is per-reach, not total. The draft flagged Spine Wound (-0.17 "total") and Void-Scarred (+0.17 "peak total") as over-cap, but neither item has a single reach exceeding 0.15. Both PASS per-reach cap checks.

---

## Item-by-Item Audit

### 1. Road Fever — PASS (with T1 effect-count note)

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` ✓, `range_modifier` ✓, `stacking` ✓ |
| Reach values | iron: -0.04 passive + max -0.03 stacking = -0.07 peak. All within 0.15. |
| Predicate validity | No conditions used. ✓ |
| Tier count | T1 with 3 effects. Guideline says T1=1. **Soft flag** — existing catalog (Nightmares T1) has 3. Accepted. |
| Stacking sanity | maxStacks: 3 ✓, stackOn: 'any_encounter' ✓ (valid StackTrigger), decayPerTick: 0.002 (very slow but intentional for disease) ✓ |
| ID | 'reward_condition_road_fever' exists in catalog. Upgrade in-place. ✓ |

### 2. Gut Rot — PASS

| Check | Result |
|-------|--------|
| Effect discriminants | `decay` ✓, `passive` ✓ |
| Reach values | iron: -0.03 start, -0.07 limit. Both within 0.15. gold: -0.02. ✓ |
| Decay sanity | (-0.07 - (-0.03)) / 0.001 = 40 ticks to reach limit. Within 10-50 tick guideline. ✓ |
| destroyAtLimit | false ✓ (correct — disease stays at max severity, doesn't destroy itself) |
| ID | Exists. ✓ |

### 3. Greyscale — FIX REQUIRED

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` x2 ✓, `social_modifier` ✓, `transform` ✓ |
| Reach values | iron: -0.08 ✓, heart: -0.04 ✓. Both within 0.15. |
| Transform trigger | `trigger: 'doom_threshold'` — valid ExpiryEvent ✓ |
| Transform probability | 0.15 ✓ (reasonable) |
| **Issue: transform intoTemplate** | intoTemplate: 'reward_condition_spine_wound' — this ID exists in the catalog ✓. **BUT**: this effect type adds the new attachment; it does not remove Greyscale first. The `TransformEffect` interface implies replacement: "On trigger, attachment replaces itself with another template." Engine behavior needs to replace Greyscale with Spine Wound, not add Spine Wound alongside it. This is an engine-side concern, not a content bug. Flag as implementation note. |
| Tier count | T2 with 4 effects. Guideline says T2=1-2. **Soft flag** — T2 complexity is high but design-intentional for a transformation disease. Accepted given existing catalog precedent. |
| ID | Exists. ✓ |

**No content fix required.** Transform is correctly structured per the TransformEffect interface. Engine note only.

### 4. The Wasting — PASS (with decay note)

| Check | Result |
|-------|--------|
| Effect discriminants | `decay` ✓, `until_event` ✓, `axiological_drift` ✓ |
| Reach values | iron: -0.08 start, -0.14 limit. Both within 0.15. veil: +0.05 ✓ |
| Decay sanity | (-0.14 - (-0.08)) / 0.001 = 60 ticks to reach limit. **Slightly over 50-tick guideline** but acceptable for T3 supernatural disease. |
| until_event event | 'rest' — valid ExpiryEvent ✓ |
| until_event destroyOnEvent | false ✓ (persists through rest events) |
| axiological_drift | axis: 'hope_despair', ratePerTick: 0.003, limitValue: 0.4. All fields valid per interface ✓ |
| Tier count | T3 with 3 effects. Within T3 guideline (2-3). ✓ |
| ID | Exists. ✓ |

### 5. Spine Wound — PASS

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` x2 ✓, `action_gate` ✓, `range_modifier` ✓, `behavior_weight` ✓ |
| Reach values | iron: -0.12 ✓ (< 0.15), heart: -0.05 ✓ (< 0.15). Per-reach cap not exceeded. |
| action_gate | mode: 'block' ✓, reach: 'iron' ✓, condition: 'in_combat' — valid EffectCondition ✓ |
| range_modifier | movementCostMultiplier: 1.5 ✓ |
| behavior_weight | reach: 'iron' ✓, multiplier: 0.2 ✓ |
| Tier count | T3 with 5 effects. Over T3 guideline (2-3). **Soft flag** — catastrophic wound complexity justified. Existing catalog Tonguebound (T2) has 4 effects. Accepted. |
| ID | Exists. ✓ |

### 6. Fey-Touched — PASS

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` ✓, `until_event` ✓, `range_modifier` ✓ |
| Reach values | veil: +0.03 ✓, eye: +0.03 ✓. Both within 0.15. |
| until_event event | 'enter_combat' — valid ExpiryEvent ✓ |
| range_modifier | awarenessRangeBonus: 1 ✓ |
| Tier count | T1 with 3 effects. Soft flag — see Road Fever note. Accepted. |
| ID | Exists. ✓ |

### 7. Death-Marked — PASS

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` x3 ✓, `reactive` ✓, `duration` (nested in reactive) ✓ |
| Reach values | shadow: +0.06 ✓, eye: +0.04 ✓, heart: -0.04 ✓. Shadow peak with reactive: 0.06 + 0.04 = 0.10 ✓ (< 0.15) |
| reactive trigger | 'damaged' — valid ReactiveTrigger ✓ |
| reactive cooldown | 12 ticks ✓ (> COOLDOWN_MINIMUM_TICKS = 5) |
| duration ticks | 6 ✓ (within 3-30 guideline) |
| duration destroyOnExpiry | true ✓ |
| Tier count | T2 with 4 effects (3 passive + 1 reactive). Over T2 guideline (1-2). **Soft flag** — reactive(duration) compound counts as 1 effect behaviorally. Accepted. |
| ID | Exists. ✓ |

### 8. Void-Scarred — PASS

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` x3 ✓, `conditional` ✓, `reveal` ✓ |
| Reach values | star: +0.08 passive + 0.04 conditional = 0.12 peak ✓ (< 0.15), shadow: +0.05 ✓, heart: -0.08 ✓ |
| conditional condition | 'in_mystical' — valid EffectCondition ✓ |
| reveal target | 'encounters' — valid RevealEffect target ✓ |
| reveal range | 2 ✓ |
| Tier count | T3 with 5 effects. Soft flag — same as Spine Wound. Accepted for T3. |
| ID | Exists. ✓ |

### 9. Mark of Debt — PASS (with stacking note)

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` x2 ✓, `resource_manipulate` ✓, `stacking` ✓ |
| Reach values | gold: -0.08 passive + max -0.03 stacking = -0.11 peak ✓, veil: -0.03 ✓ |
| resource_manipulate | resource: 'quintessence' ✓, target: 'self' ✓, amount: -1, mode: 'per_tick' ✓ |
| stacking stackOn | 'social_success' — valid StackTrigger ✓ |
| **Stacking note** | No `decayPerTick` on the stacking effect. Stacks accumulate permanently until condition is removed. With maxStacks: 3 and social_success as trigger, stacks will max out after 3 social successes and stay there. This is intentional curse behavior. No fix required. |
| Tier count | T2 with 4 effects. Soft flag. Accepted. |
| ID | Exists. ✓ |

### 10. The Hollow — PASS

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` x2 ✓, `axiological_drift` ✓, `behavior_weight` ✓, `social_modifier` ✓ |
| Reach values | heart: -0.12 ✓ (< 0.15), shadow: +0.05 ✓ |
| axiological_drift | axis: 'loyalty_ambition', ratePerTick: -0.004 (valid — negative direction means toward ambition pole), limitValue: -0.5 ✓ |
| behavior_weight | reach: 'heart' ✓, multiplier: 0.3 ✓ |
| social_modifier | targetFilter: 'any' ✓, cooperationBias: -0.3 ✓ |
| Tier count | T3 with 5 effects. Soft flag. Accepted for T3 existential curse. |
| ID | Exists. ✓ |

### 11. Watch Scrutiny — PASS

| Check | Result |
|-------|--------|
| Effect discriminants | `passive` x3 ✓, `conditional` ✓ |
| Reach values | shadow: -0.04 passive + -0.02 conditional = -0.06 peak ✓, gold: -0.03 ✓, heart: -0.02 ✓ |
| conditional condition | 'alone' — valid EffectCondition ✓ |
| Tier count | T1 with 4 effects. Soft flag. Accepted — existing upgrade items with 3-4 T1 effects already in catalog. |
| ID | Exists. ✓ |

---

## Summary

| # | Item | Verdict | Issues |
|---|------|---------|--------|
| 1 | Road Fever | PASS | T1 effect count soft flag (accepted) |
| 2 | Gut Rot | PASS | Clean |
| 3 | Greyscale | PASS | Transform replacement semantics = engine note only |
| 4 | The Wasting | PASS | Decay takes 60 ticks (slightly over 50-tick guideline, accepted for T3) |
| 5 | Spine Wound | PASS | T3 effect count soft flag (accepted); per-reach cap met |
| 6 | Fey-Touched | PASS | T1 effect count soft flag (accepted) |
| 7 | Death-Marked | PASS | T2 effect count soft flag (accepted) |
| 8 | Void-Scarred | PASS | T3 effect count soft flag (accepted); per-reach cap met |
| 9 | Mark of Debt | PASS | Stacking has no decayPerTick (intentional) |
| 10 | The Hollow | PASS | T3 effect count soft flag (accepted) |
| 11 | Watch Scrutiny | PASS | T1 effect count soft flag (accepted) |

**All 11 items PASS systems audit. No content corrections required.**

## Caveats

1. **Tier effect-count guidelines** are soft in this catalog. Existing items (Nightmares T1 = 3 effects, Tonguebound T2 = 4 effects, Earthblood Vigor T2 = 2 effects including nested reactive) set precedent for exceeding nominal T1=1, T2=1-2, T3=2-3 counts. This is accepted catalog practice.

2. **Transform engine behavior** (Greyscale → Spine Wound): the TransformEffect interface says "replaces itself with another template." Implementation must ensure Greyscale is removed when Spine Wound is granted. Content is correct; engine must handle replacement semantics.

3. **until_event semantics** (The Wasting, Fey-Touched): `destroyOnEvent: false` means the attachment survives the trigger event. The bonus applies until the event fires once. If the intent is for the bonus to be ongoing-until-event (applying every tick until the event), the engine should handle this as "bonus is active until the event fires once, then suspends until re-evaluation." Content matches intended behavior as documented.

4. **Mark of Debt stacking decay**: No `decayPerTick` on the stacking effect. This is intentional — the curse permanently accumulates. If gameplay testing reveals this reaches max-stack too quickly, add `decayPerTick: 0.002` to allow slow recovery.
