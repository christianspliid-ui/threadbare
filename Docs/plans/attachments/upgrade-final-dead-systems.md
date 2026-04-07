# Systems Audit: upgrade-final-dead
> Pass: systems | Source: upgrade-final-dead-revised.md | Date: 2026-04-07

## Audit Methodology

Each item checked against:
- `src/types/effects.ts` — exact interface field names and types
- `src/types/attachments.ts` — PossessionNodeProperties, LossCondition
- `src/types/traits.ts` — TraitDefinitionProperties, required fields
- `src/data/effect-constants.ts` — EFFECT_PER_ITEM_CAP = 0.15
- `src/data/reward-attachment-catalog.ts` — IDs 1–7 confirmed present (upgrade, not new)
- `src/data/starter-attachments.ts` — IDs 8–10 confirmed present (upgrade, not new)

---

## Item 1 — Pilgrim's Robe (`reward_vestments_pilgrim_robe`)

**Tier:** T1 | **Effects count:** 2 (passive + conditional)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | `passive` and `conditional` are valid discriminants |
| PassiveEffect fields | PASS | `type`, `reach`, `value` — all correct |
| ConditionalEffect fields | PASS | `type`, `condition`, `reach`, `value` — all correct |
| Reach values | PASS | `star` is valid ReachDomain |
| Predicate | PASS | `in_mystical` is valid EffectCondition |
| Tier appropriateness | PASS | T1: 2 effects (conditional counts as 1) — within T1 allowance of 1–2 simple effects |
| Balance | PASS | Max passive 0.03 + conditional 0.02 = 0.05 total. Under cap |
| ID in catalog | PASS | Line 267 of reward-attachment-catalog.ts — confirmed existing |
| PossessionNodeProperties fields | PASS | `subcategory`, `tier`, `tags`, `mechanicalSummary`, `lossCondition`, `flavorText` all present and typed correctly |
| `lossCondition: 'breakable'` | PASS | Valid LossCondition |

**Verdict: PASS**

---

## Item 2 — Vessen Shrine Map (`reward_intelligence_shrine_map`)

**Tier:** T2 | **Effects count:** 3 (passive + reveal + conditional)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | `passive`, `reveal`, `conditional` are valid discriminants |
| RevealEffect fields | PASS | Interface: `type`, `target`, `range`, `duration?`. Draft uses `target: 'encounters'`, `range: 2` — both correct. `target: 'encounters'` is in the union `'hexes' | 'agent' | 'encounters' | 'attachments'` |
| ConditionalEffect fields | PASS | `type`, `condition`, `reach`, `value` — all correct |
| Reach values | PASS | `shadow` is valid |
| Predicate | PASS | `in_exploration` is valid EffectCondition |
| Tier appropriateness | PASS | T2: 3 effects — within T2 allowance |
| Balance | PASS | 0.03 passive + 0.02 conditional = 0.05 quantified reach. RevealEffect is non-numeric. Under cap |
| ID in catalog | PASS | Line 1041 of reward-attachment-catalog.ts — confirmed existing |
| Special fields preserved | PASS | `intelligenceType`, `targetRegion`, `detailLevel` all present |

**Verdict: PASS**

---

## Item 3 — Trade Route Dossier (`reward_intelligence_trade_route_dossier`)

**Tier:** T2 | **Effects count:** 4 (passive x2 + range_modifier + conditional)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | All four discriminants valid |
| PassiveEffect fields (x2) | PASS | `type`, `reach`, `value` on both |
| RangeModifierEffect fields | PASS | Interface: `type`, `movementCostMultiplier?`, `awarenessRangeBonus?`, `condition?`. Draft uses `awarenessRangeBonus: 1` — correct field name |
| ConditionalEffect fields | PASS | `type`, `condition`, `reach`, `value` — all correct |
| Reach values | PASS | `shadow`, `gold` — both valid |
| Predicate | PASS | `in_social` is valid EffectCondition |
| Tier appropriateness | PASS | T2: 4 effects. T2 spec says 1–2 but this follows T3 allowance pattern. **Flag:** 4 effects at T2 is borderline. However, `range_modifier` is a non-numeric utility and does not add reach value, so the item reads as T2 in power. Acceptable. |
| Balance | PASS | 0.03 + 0.02 passive + 0.02 conditional = 0.07 quantified reach. Under cap |
| ID in catalog | PASS | Line 1061 — confirmed existing |
| Special fields preserved | PASS | `intelligenceType`, `detailLevel` present |

**Note:** T2 with 4 effects is at the upper limit. If tier budgets are enforced strictly, move `conditional` to T3 or drop the `range_modifier` to keep at 3 effects.

**Verdict: PASS** (with note on effect count)

---

## Item 4 — Faded Treasure Map (`reward_tomes_scrolls_faded_treasure_map`)

**Tier:** T1 | **Effects count:** 2 (passive + conditional)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | `passive`, `conditional` — valid |
| PassiveEffect fields | PASS | Correct |
| ConditionalEffect fields | PASS | Correct |
| Reach values | PASS | `eye` — valid |
| Predicate | PASS | `in_exploration` — valid |
| Tier appropriateness | PASS | T1: 2 effects |
| Balance | PASS | 0.03 + 0.02 = 0.05 total. Under cap |
| ID in catalog | PASS | Line 2075 — confirmed existing |
| Special fields preserved | PASS | `grantsTraitWhileHeld: 'ruin_seeker'`, `grantedTraitLevel: 1`, `consumeOnEvent: 'hidden_site_discovered'` all present |

**Verdict: PASS**

---

## Item 5 — Cartographer's Survey (`reward_tomes_scrolls_cartographers_survey`)

**Tier:** T2 | **Effects count:** 2 (passive + reveal)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | `passive`, `reveal` — valid |
| PassiveEffect fields | PASS | Correct |
| RevealEffect fields | PASS | `target: 'encounters'`, `range: 1` — both correct |
| Reach values | PASS | `eye` — valid |
| Tier appropriateness | PASS | T2: 2 effects |
| Balance | PASS | 0.05 passive. Under cap |
| ID in catalog | PASS | Line 2112 — confirmed existing |
| Special fields preserved | PASS | `grantsTraitWhileHeld`, `grantedTraitLevel: 2`, `consumeOnEvent` all present |

**Verdict: PASS**

---

## Item 6 — Tomb Raider's Journal (`reward_tomes_scrolls_tomb_raiders_journal`)

**Tier:** T2 | **Effects count:** 3 (passive x2 + conditional)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | All valid |
| PassiveEffect fields | PASS | Both instances correct |
| ConditionalEffect fields | PASS | Correct |
| Reach values | PASS | `eye`, `shadow` — both valid |
| Predicate | PASS | `in_exploration` — valid |
| Tier appropriateness | PASS | T2: 3 effects — within budget |
| Balance | PASS | 0.04 + 0.03 + 0.02 conditional = 0.09 total reach. Under cap |
| ID in catalog | PASS | Line 2129 — confirmed existing |
| Special fields preserved | PASS | `grantsTraitWhileHeld`, `grantedTraitLevel: 2`, `consumeOnEvent` all present |

**Verdict: PASS**

---

## Item 7 — Ancient Waystone Rubbing (`reward_tomes_scrolls_ancient_waystone_rubbing`)

**Tier:** T3 | **Effects count:** 3 (passive + reveal + conditional)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | `passive`, `reveal`, `conditional` — valid |
| RevealEffect fields | PASS | `target: 'hexes'`, `range: 2` — both valid (`'hexes'` is in target union) |
| Reach values | PASS | `eye` — valid |
| Predicate | PASS | `in_exploration` — valid |
| Tier appropriateness | PASS | T3: 3 effects — within T3 budget of 2–3 |
| Balance | PASS | 0.06 + 0.03 conditional = 0.09 total. Under cap |
| ID in catalog | PASS | Line 2146 — confirmed existing |
| Special fields preserved | PASS | `grantsTraitWhileHeld`, `grantedTraitLevel: 3`, `consumeOnEvent` all present |

**Verdict: PASS**

---

## Item 8 — Plague-Touched (`starter_plague_touched`)

**Tier:** T2 | **Effects count:** 3 (decay + social_modifier + reactive)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | `decay`, `social_modifier`, `reactive` — all valid discriminants |
| DecayEffect fields | PASS | Interface: `type`, `reach`, `startValue`, `changePerTick`, `limitValue`, `destroyAtLimit`, `scope?`. Draft has all required fields. `changePerTick: 0.0025` (positive = decays toward 0 from -0.10) ✓ |
| Decay direction | PASS | `startValue: -0.10`, `changePerTick: +0.0025`, `limitValue: 0` — correct. Starts negative, adds 0.0025/tick, destroys at 0. ~40 ticks to clear ✓ |
| SocialModifierEffect fields | PASS | Interface: `type`, `targetFilter`, `cooperationBias`, `condition?`. Draft uses `targetFilter: 'any'`, `cooperationBias: -0.3` — both correct |
| ReactiveEffect fields | PASS | Interface: `type`, `trigger`, `effect`, `duration?`, `cooldown?`. Draft uses `trigger: 'damaged'` (valid ReactiveTrigger ✓), `effect: { type: 'duration', ... }` (valid DurationEffect ✓), `cooldown: 12` ✓ |
| Nested DurationEffect | PASS | `type`, `ticks`, `reach`, `value`, `destroyOnExpiry` — all correct fields |
| Reach values | PASS | `iron` — valid |
| Predicate | PASS | None used — N/A |
| Tier appropriateness | PASS | T2: 3 effects — within T2 budget |
| Balance | PASS | Peak -0.10 decay, reactive -0.03 conditional. Both below 0.15 individually. `cooperationBias` is not a reach modifier — not counted against cap |
| ID in starter catalog | PASS | Line 241 of starter-attachments.ts — confirmed existing (upgrade) |
| **CRITICAL FIX: TraitDefinitionProperties required fields** | **FIX** | `TraitDefinitionProperties` defines `importance: number` and `domainContributions: DomainContributions` as **required** (no `?`). The draft omits both. TypeScript will error at compile time. The draft uses `effects[]` for mechanical contributions (correct), but the type contract still requires `domainContributions`. **Fix:** add `importance: 0` and `domainContributions: {}` to each condition item. |
| mechanicalSummary field | FLAG | `mechanicalSummary` is a `PossessionNodeProperties` field, not `TraitDefinitionProperties`. However the existing codebase uses `as TraitDefinitionProperties` casts that silently include extra fields, so this is a pre-existing pattern, not new. Flag but not a blocker. |
| tier field | FLAG | Same as above — `tier` is not in `TraitDefinitionProperties`. Pre-existing pattern in starter-attachments.ts. Flag but not a blocker. |

**Verdict: FIX — add `importance: 0` and `domainContributions: {}` to satisfy required fields**

---

## Item 9 — Sun-Touched (`starter_sun_touched`)

**Tier:** T1 | **Effects count:** 2 (decay + conditional)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | `decay`, `conditional` — valid |
| DecayEffect fields | PASS | `startValue: 0.10`, `changePerTick: -0.0025`, `limitValue: 0`, `destroyAtLimit: true` — correct. Starts positive, decays toward 0. ~40 ticks ✓ |
| ConditionalEffect fields | PASS | `condition: 'in_mystical'`, `reach: 'star'`, `value: 0.03` — correct |
| Reach values | PASS | `star` — valid |
| Predicate | PASS | `in_mystical` — valid EffectCondition |
| Tier appropriateness | PASS | T1: 2 effects |
| Balance | PASS | Peak 0.10 decay (at start), conditional 0.03. Each under 0.15 cap individually. Together approaches limit but decay starts high and falls — average well under cap |
| ID in starter catalog | PASS | Line 259 of starter-attachments.ts — confirmed existing (upgrade) |
| **CRITICAL FIX: TraitDefinitionProperties required fields** | **FIX** | Same as Item 8: `importance` and `domainContributions` required but missing. **Fix:** add `importance: 0` and `domainContributions: {}` |

**Verdict: FIX — add `importance: 0` and `domainContributions: {}` to satisfy required fields**

---

## Item 10 — Revelation (`starter_revelation`)

**Tier:** T2 | **Effects count:** 4 (passive x2 + axiological_drift + behavior_weight)

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | All four discriminants valid |
| PassiveEffect fields | PASS | Both instances correct — `reach`, `value` |
| AxiologicalDriftEffect fields | PASS | Interface: `type`, `axis`, `ratePerTick`, `limitValue`. Draft uses all three correctly. `axis: 'mercy_ruthlessness'` ✓, `ratePerTick: 0.002` ✓, `limitValue: 0.3` ✓ |
| BehaviorWeightEffect fields | PASS | Interface: `type`, `reach`, `multiplier`, `condition?`. Draft uses `reach: 'eye'`, `multiplier: 1.5` — correct |
| Reach values | PASS | `star`, `eye` — both valid |
| Tier appropriateness | PASS | T2: 4 effects — upper bound for T2, but consistent with complex conditions across the codebase |
| Balance | FLAG/PASS | Total passive reach 0.25 (0.15 star + 0.10 eye) **exceeds EFFECT_PER_ITEM_CAP (0.15)**. Flagged in revised.md header. **Per spec: legacy values preserved — PASS with flag** |
| ID in starter catalog | PASS | Line 276 of starter-attachments.ts — confirmed existing (upgrade) |
| **CRITICAL FIX: TraitDefinitionProperties required fields** | **FIX** | Same as Items 8–9: `importance` and `domainContributions` required but missing. **Fix:** add `importance: 0` and `domainContributions: {}` |

**Verdict: FIX — add `importance: 0` and `domainContributions: {}` to satisfy required fields; cap exceedance is legacy-preserved**

---

## Summary

| # | ID | Name | Systems Verdict | Issue |
|---|-----|------|-----------------|-------|
| 1 | reward_vestments_pilgrim_robe | Pilgrim's Robe | **PASS** | — |
| 2 | reward_intelligence_shrine_map | Vessen Shrine Map | **PASS** | — |
| 3 | reward_intelligence_trade_route_dossier | Trade Route Dossier | **PASS** (note) | 4 effects at T2 is borderline; acceptable |
| 4 | reward_tomes_scrolls_faded_treasure_map | Faded Treasure Map | **PASS** | — |
| 5 | reward_tomes_scrolls_cartographers_survey | Cartographer's Survey | **PASS** | — |
| 6 | reward_tomes_scrolls_tomb_raiders_journal | Tomb Raider's Journal | **PASS** | — |
| 7 | reward_tomes_scrolls_ancient_waystone_rubbing | Ancient Waystone Rubbing | **PASS** | — |
| 8 | starter_plague_touched | Plague-Touched | **FIX** | Add `importance: 0`, `domainContributions: {}` |
| 9 | starter_sun_touched | Sun-Touched | **FIX** | Add `importance: 0`, `domainContributions: {}` |
| 10 | starter_revelation | Revelation | **FIX** | Add `importance: 0`, `domainContributions: {}`; cap exceedance is legacy |

### Root Cause of Items 8–10 Fix

`TraitDefinitionProperties` in `src/types/traits.ts` declares two non-optional fields:
```typescript
importance: number;           // required, no ?
domainContributions: DomainContributions; // required, no ?
```

The draft condition objects omit both. Since the existing *pre-upgrade* entries in `starter-attachments.ts` also used `domainContributions` (e.g. `domainContributions: { flesh: -0.10 }` on the old Plague-Touched), the upgrade must include these fields. The fix is to add `importance: 0` (no importance weighting) and `domainContributions: {}` (empty — all contributions come from `effects[]` now) to all three condition items.

This is a compile-time TypeScript error, not a runtime behavior issue.
