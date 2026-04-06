# Attachment Systems Audit: Bestowed Powers Upgrade
> Slug: bestowed-powers | Pass: systems | Mode: upgrade
> Date: 2026-04-06
> Input: upgrade-bestowed-powers-revised.md

## Source files checked
- `src/types/effects.ts` — 39 effect type definitions
- `src/data/effect-constants.ts` — caps (EFFECT_PER_ITEM_CAP=0.15, EFFECT_MODIFIER_CAP=0.30, AURA_MAX_RADIUS=2, COOLDOWN_MINIMUM_TICKS=5)
- `src/data/reward-attachment-catalog.ts` — existing items (duplicate ID check)
- `src/types/traits.ts` — ReachDomain union, TraitDefinitionProperties

## Valid Reach Domains (from traits.ts)
`iron | gold | shadow | veil | heart | eye | stone | star`
Flesh: REMOVED (TB-075). Any use = invalid.

## Tier Complexity Norms
- T1: 1–2 effects. T2: 2–3. T3: 3–4. T4: 3–4 (complex).

---

## Item-by-Item Audit

### 1. Ember Hands (T1) — `reward_bestowed_ember_hands`

**Duplicate ID check:** Not found in existing catalog as upgraded version. Current entry has `domainContributions`, no `effects[]`. ID is valid for upgrade.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:stone value:0.04 | ✓ PassiveEffect | ✓ reach in ReachDomain | ✓ 0.04 < 0.15 cap |
| `trait_grant` grantedTrait:'fire_touch' | ✓ TraitGrantEffect | ✓ grantedTrait:string | N/A (qualitative) |

**Tier check:** T1, 2 effects. PASS (within 1–2 norm).

**Balance:** Total passive reach value: 0.04. Well within T1 range.

**Predicate check:** No predicates used.

**Verdict: PASS**

---

### 2. Beast-Tongue (T1) — `reward_bestowed_beast_tongue`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:heart value:0.04 | ✓ PassiveEffect | ✓ | ✓ |
| `conditional` condition:'in_wilderness' reach:eye value:0.02 | ✓ ConditionalEffect | ✓ EffectCondition | ✓ 0.02 < 0.15 |

**Predicate validity:** `in_wilderness` is in the EffectCondition union. PASS.

**Tier check:** T1, 2 effects. PASS.

**Balance:** 0.04 passive + 0.02 conditional max = 0.06. Appropriate for T1.

**Verdict: PASS**

---

### 3. Iron Gut (T1) — `reward_bestowed_iron_gut`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:iron value:0.05 | ✓ PassiveEffect | ✓ | ✓ |
| `tag_immunity` tags:['poison','disease'] | ✓ TagImmunityEffect | ✓ tags:readonly string[] | N/A (qualitative) |

**Tier check:** T1, 2 effects. PASS.

**Balance:** 0.05 passive. Qualitative tag_immunity adds non-reach value. Appropriate T1.

**Verdict: PASS**

---

### 4. Night Eyes (T1) — `reward_bestowed_night_eyes`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:eye value:0.05 | ✓ PassiveEffect | ✓ | ✓ |
| `conditional` condition:'in_exploration' reach:shadow value:0.02 | ✓ ConditionalEffect | ✓ EffectCondition | ✓ |

**Predicate validity:** `in_exploration` is in EffectCondition union. PASS.

**Tier check:** T1, 2 effects. PASS.

**Balance:** 0.05 + 0.02 conditional = 0.07 max. PASS.

**Verdict: PASS**

---

### 5. Gatehouse Commendation (T1) — `reward_bestowed_gatehouse_commendation`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:heart value:0.03 | ✓ PassiveEffect | ✓ | ✓ |
| `passive` reach:eye value:0.03 | ✓ PassiveEffect | ✓ | ✓ |
| `passive` reach:iron value:0.02 | ✓ PassiveEffect | ✓ | ✓ |
| `social_modifier` targetFilter:'same_faction' cooperationBias:0.1 | ✓ SocialModifierEffect | ✓ targetFilter in union | ✓ bias < 1.0 |

**Tier check:** T1, 4 effects. FIX NEEDED — T1 norm is 1–2 effects. 4 effects is T2/T3 weight.

**Analysis:** The 3 passives together total 0.08 reach — equivalent to a single T2 passive. They could be consolidated. However, the multi-reach spread (heart + eye + iron) is intentional for the "civic authority" flavor — this item models a credential that builds competency across governance-relevant domains. The social_modifier is the signature non-reach effect.

**Resolution:** For a T1, this is at the heavy end. However, this is an upgrade of an existing item that already had heart:0.03 + eye:0.03 + iron:0.02 = 0.08 in domainContributions. The effect count increase (4 effects) comes from splitting the single domainContributions object into individual passives + adding the social_modifier. The total reach value (0.08) is unchanged from the original. The 4-effect count is a representation artifact, not a balance change.

**Decision:** Flag as NOTE (not FIX) — T1 at 4 effects due to upgrade representation. Balance is unchanged from original. Acceptable for upgrade mode where we're preserving original domainContributions values. If this were a new item, 3 passives + social_modifier would be T2.

**Balance:** 0.08 passive. Note: this is above the typical T1 ceiling of ~0.06 but was the original design value. Preserved.

**Verdict: PASS WITH NOTE** — Effect count (4) is high for T1 due to upgrade representation. Balance unchanged from original domainContributions. Consider consolidating to `modifier_rules` with scope in future revision.

---

### 6. Spirit Sight (T2) — `reward_bestowed_spirit_sight`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:eye value:0.07 | ✓ PassiveEffect | ✓ | ✓ 0.07 < 0.15 |
| `passive` reach:veil value:0.03 | ✓ PassiveEffect | ✓ | ✓ |
| `reactive` trigger:'entered_hex' effect:{type:'reveal',...} | ✓ ReactiveEffect | ✓ trigger in ReactiveTrigger | ✓ |
| → inner `reveal` target:'encounters' range:2 duration:6 | ✓ RevealEffect | ✓ target in union | ✓ duration 6 in 3–30 range |

**ReactiveEffect fields:** `trigger`, `effect`, `duration?`, `cooldown?`. The reactive here has no cooldown — the `entered_hex` trigger fires naturally per movement, so the cooldown-less behavior is intentional (move less → fewer reveals). PASS.

**Tier check:** T2, 3 effects (2 passives + 1 reactive). PASS (T2: 1–3 norm with 2–3 preferred).

**Balance:** 0.10 passive. Reactive reveal is an information effect (no reach value). Appropriate T2.

**Verdict: PASS**

---

### 7. Bloodward (T2) — `reward_bestowed_bloodward`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:iron value:0.05 | ✓ PassiveEffect | ✓ | ✓ |
| `passive` reach:heart value:0.03 | ✓ PassiveEffect | ✓ | ✓ |
| `reactive` trigger:'damaged' effect:{type:'duration',...} cooldown:12 | ✓ ReactiveEffect | ✓ trigger in ReactiveTrigger | ✓ |
| → inner `duration` ticks:8 reach:iron value:0.04 destroyOnExpiry:false | ✓ DurationEffect | ✓ all fields | ✓ 8 ticks in range |

**Cooldown check:** cooldown:12 vs COOLDOWN_MINIMUM_TICKS=5. PASS (12 > 5).

**Duration sanity:** 8 ticks active / 12-tick minimum gap. Active ratio acceptable.

**Tier check:** T2, 3 effects (2 passives + 1 reactive). PASS.

**Balance:** 0.08 passive + 0.04 reactive (triggered) = 0.12 max. Within T2 budget.

**Verdict: PASS**

---

### 8. Voices of the Departed (T2) — `reward_bestowed_voices_of_the_departed`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:shadow value:0.06 | ✓ PassiveEffect | ✓ | ✓ |
| `passive` reach:heart value:0.04 | ✓ PassiveEffect | ✓ | ✓ |
| `range_modifier` awarenessRangeBonus:1 | ✓ RangeModifierEffect | ✓ awarenessRangeBonus:number | ✓ integer |

**RangeModifierEffect:** `movementCostMultiplier?` and `awarenessRangeBonus?` — both optional. Using only `awarenessRangeBonus:1` is valid.

**Tier check:** T2, 3 effects. PASS.

**Balance:** 0.10 passive + awareness range bonus (no reach value). Appropriate T2.

**Verdict: PASS**

---

### 9. Stormcaller (T3) — `reward_bestowed_stormcaller`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:star value:0.10 | ✓ PassiveEffect | ✓ | ✓ 0.10 < 0.15 |
| `passive` reach:stone value:0.05 | ✓ PassiveEffect | ✓ | ✓ |
| `aura` radius:1 target:'enemies' reach:iron value:-0.03 | ✓ AuraEffect | ✓ target in 'allies'\|'enemies'\|'all' | ✓ radius 1 ≤ AURA_MAX_RADIUS(2) |
| `behavior_weight` reach:iron multiplier:1.3 | ✓ BehaviorWeightEffect | ✓ reach:ReachDomain, multiplier:number | ✓ |

**Aura value:** -0.03 (debuff to enemies). AuraEffect interface uses `value: number` without sign restriction. Negative value as debuff is the intended design per effect-system docs. PASS.

**Aura radius:** 1 ≤ AURA_MAX_RADIUS(2). PASS.

**Tier check:** T3, 4 effects (2 passives + aura + behavior_weight). PASS (T3: 2–4 norm).

**Balance:** 0.15 passive total. Exactly at EFFECT_PER_ITEM_CAP. Aura and behavior_weight add qualitative value. Appropriate T3.

**Verdict: PASS**

---

### 10. Veilwalk (T3) — `reward_bestowed_veilwalk`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:veil value:0.10 | ✓ PassiveEffect | ✓ | ✓ |
| `passive` reach:shadow value:0.05 | ✓ PassiveEffect | ✓ | ✓ |
| `range_modifier` movementCostMultiplier:0.8 | ✓ RangeModifierEffect | ✓ movementCostMultiplier:number | ✓ |
| `action_gate` mode:'unlock' reach:'veil' | ✓ ActionGateEffect | ✓ mode in 'block'\|'unlock', reach:ReachDomain | ✓ veil valid |

**Tier check:** T3, 4 effects (2 passives + range_modifier + action_gate). PASS.

**Balance:** 0.15 passive. Exactly at cap. movement + action_gate add qualitative value. Appropriate T3.

**Verdict: PASS**

---

### 11. The Undying Flame (T4) — `reward_bestowed_the_undying_flame`

**Duplicate ID check:** PASS.

**Effect validation:**
| Effect | Type Valid | Fields Valid | Value OK |
|--------|-----------|--------------|---------|
| `passive` reach:star value:0.12 | ✓ PassiveEffect | ✓ | ✓ 0.12 < 0.15 |
| `passive` reach:iron value:0.03 | ✓ PassiveEffect | ✓ | ✓ |
| `prevent_loss` channel:'quintessence' amount:1 consumeOnPrevent:false | ✓ PreventLossEffect | ✓ channel in PreventLossChannel | ✓ |
| `reactive` trigger:'damaged' cooldown:24 effect:{type:'cascade',...} | ✓ ReactiveEffect | ✓ trigger:ReactiveTrigger | ✓ |
| → `cascade` triggerEffect:{duration} then:[test_shaper] | ✓ CascadeEffect | ✓ triggerEffect:AttachmentEffect, then:AttachmentEffect[] | ✓ |
| → → `duration` ticks:6 reach:star value:0.05 destroyOnExpiry:false | ✓ DurationEffect | ✓ | ✓ 6 in 3–30 |
| → → `test_shaper` trigger:'failure' steps:1 | ✓ TestShaperEffect | ✓ trigger in TestShaperTrigger | ✓ |

**CASCADE_MAX_DEPTH check:** 1 level of cascade nesting (reactive → cascade → [duration, test_shaper]). Depth 2 total. Under CASCADE_MAX_DEPTH(3). PASS.

**CASCADE_MAX_EFFECTS check:** reactive wraps cascade which has 2 then effects = 3 total effects in the chain. Under CASCADE_MAX_EFFECTS(8). PASS.

**Cooldown check:** cooldown:24 vs COOLDOWN_MINIMUM_TICKS(5). PASS (24 >> 5). 24-tick cooldown = 2 game days. Prevents cascade trivialization.

**Tier check:** T4, 4 effects (2 passives + prevent_loss + reactive-cascade). PASS (T4: 3–4 norm).

**Balance:** 0.15 passive + 0.05 reactive-triggered = 0.20 max. The reactive only fires on damage with 24-tick cooldown — effectively 0.05 burst with significant downtime. T4 budget accommodates this. Prevent_loss adds a qualitative safety net. PASS.

**Verdict: PASS**

---

## Batch Verdict

| Item | Verdict | Notes |
|------|---------|-------|
| Ember Hands | PASS | |
| Beast-Tongue | PASS | |
| Iron Gut | PASS | |
| Night Eyes | PASS | |
| Gatehouse Commendation | PASS WITH NOTE | 4 effects at T1 — artifact of upgrade representation, balance unchanged |
| Spirit Sight | PASS | |
| Bloodward | PASS | |
| Voices of the Departed | PASS | |
| Stormcaller | PASS | |
| Veilwalk | PASS | |
| The Undying Flame | PASS | |

**Overall batch verdict: READY FOR IMPLEMENTATION**

All 10 items use valid effect types from `src/types/effects.ts`. All reach values are within the EFFECT_PER_ITEM_CAP(0.15). All predicates are valid EffectCondition members. No duplicate IDs. The one note (Gatehouse Commendation T1 with 4 effects) is a representation artifact of the upgrade mode, not a balance change.

## Implementation Instructions

Target: `src/data/reward-attachment-catalog.ts` — `REWARD_BESTOWED_POWERS` array.

For each item below:
1. Remove `domainContributions` property
2. Add `mechanicalSummary` field (from revised file)
3. Add `effects[]` array (from revised file)
4. Update `tags` where editorial changes were made
5. Update `flavorText` for Spirit Sight
6. Keep all other properties unchanged (`id`, `type`, `name`, `subcategory`, `tier`, `description`, `maxLevel`, `visibility`)

**SKIP:** `reward_bestowed_patrons_backing` — already has `effects[]` (test_shaper), keep as-is.
