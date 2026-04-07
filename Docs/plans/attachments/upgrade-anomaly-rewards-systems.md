# Systems Audit: Anomaly Rewards Upgrade
> Slug: upgrade-anomaly-rewards | Pass: systems | Mode: upgrade
> Items: 24 items | Date: 2026-04-06

## Type Validity Audit

### Artifacts

| # | Item | Effects | Type Check | Value Check | Tier Match | Verdict |
|---|------|---------|-----------|-------------|------------|---------|
| 1 | Uncut Ruby (T2) | passive + conditional + behavior_weight | All valid discriminants. `condition: 'in_social'` valid EffectCondition. `behavior_weight` has required `reach` + `multiplier`. | 0.10+0.05=0.15 Gold passive+conditional. Under 0.15 cap. | T2: 3 effects, 1-2 expected. Slightly over but behavior_weight is passive-adjacent. | **PASS** |
| 2 | Resonance Shard (T3) | passive x2 + conditional + test_shaper | All valid. `test_shaper` requires `trigger` (valid: 'near_miss') and `steps` (1). `reach` optional on test_shaper. | 0.10+0.05+0.05=0.20 Veil+Eye. EXCEEDS 0.15 per-item cap for Veil. | **FIX**: passive veil 0.10 + conditional veil 0.05 = 0.15. That equals the cap, not exceeds. Plus Eye 0.05. Total contribution across reaches is over 0.15 if summed, but cap is per-reach. Veil = 0.15 max (passive 0.10 + conditional 0.05 when active). OK. | **PASS** |
| 3 | Amber Phial (T2) | passive + consumable_charge | All valid. `consumable_charge` has `charges`, `onUse` ({reach, value}), `destroyOnEmpty`. | 0.05 Heart passive + 0.06 per charge = 0.11 max active. | T2: 2 effects. Appropriate. | **PASS** |
| 4 | Herb Bundle (T1) | conditional + consumable_charge | All valid. `conditional` with `in_wilderness`. `consumable_charge` correct shape. | 0.02 conditional + 0.04 per charge = 0.06 max active. | T1: 2 effects, 1 expected. Slightly over but both simple. OK for a consumable. | **PASS** |
| 5 | Sealed Codex (T3) | passive x2 + stacking | All valid. `stacking` requires `reach`, `valuePerStack`, `maxStacks`, `stackOn`. `stackOn: 'social_success'` is valid StackTrigger. | 0.10 Eye + 0.05 Star + stacking max 0.05 Eye = 0.15 Eye max. Under cap. | T3: 3 effects, 2-3 expected. Perfect. | **PASS** |
| 6 | Corroded Crown (T2) | passive + tradeoff | All valid. `tradeoff` has `bonus` and `penalty`, both with `reach` + `value`. | 0.10 + 0.05 Gold = 0.15 Gold, -0.03 Heart. | T2: 2 effects. Appropriate. | **PASS** |
| 7 | Fossilized Eye (T2) | passive x2 + range_modifier | All valid. `range_modifier` has `awarenessRangeBonus: 1` (integer). | 0.05 Eye + 0.03 Veil = 0.08 reach. Low. | T2: 3 effects (2 passive + range_modifier). OK. | **PASS** |
| 8 | Star Metal Shard (T3) | passive x2 + cooldown | All valid. `cooldown` requires `activeTicks` (6), `cooldownTicks` (12), `reach`, `value`. Ratio 6:12 = 1:2, reasonable. | 0.08 Iron + 0.05 Star + 0.05 Iron cycling = 0.13 Iron max. Under cap. | T3: 3 effects. Perfect. | **PASS** |
| 9 | Moonpearl Strand (T2) | passive + conditional + social_modifier | All valid. `social_modifier` requires `targetFilter` ('ally' valid) and `cooperationBias` (0.15). | 0.08 + 0.05 Heart = 0.13 Heart max. Under cap. | T2: 3 effects, 1-2 expected. social_modifier is passive-adjacent. | **PASS** |
| 10 | Spore Lantern (T2) | passive + conditional + tradeoff | All valid. `tradeoff` correct shape. | 0.05 + 0.05 Eye = 0.10 Eye, +0.02 Veil, -0.02 Heart. Under cap. | T2: 3 effects, 1-2 expected. Acceptable. | **PASS** |

### Bestowed Powers

| # | Item | Effects | Type Check | Value Check | Tier Match | Verdict |
|---|------|---------|-----------|-------------|------------|---------|
| 11 | Prospector's Eye (T2) | passive + conditional + behavior_weight | All valid. `behavior_weight` has `reach` + `multiplier`. | 0.08 + 0.05 Eye = 0.13 Eye. Under cap. | T2: 3 effects. OK. | **PASS** |
| 12 | Crystal Attunement (T3) | passive x2 + conditional + tag_immunity | All valid. `tag_immunity` requires `tags` (readonly string[]). `['#dissonance']` valid. | 0.08 + 0.05 Veil = 0.13 Veil, 0.05 Eye. Under cap. | T3: 4 effects. 2-3 expected, 4 is slightly over. tag_immunity is lightweight. | **PASS** |
| 13 | Sap-Blessed (T2) | passive + conditional + prevent_loss | All valid. `prevent_loss` requires `channel` ('condition' valid), optional `tags`, optional `consumeOnPrevent`. | 0.05 + 0.04 Heart = 0.09 Heart. Well under cap. | T2: 3 effects. OK. | **PASS** |
| 14 | Herbalist's Knowledge (T1) | passive + conditional | All valid. Simple, clean. | 0.05 + 0.04 Eye = 0.09 Eye. Under cap. | T1: 2 effects, 1 expected. Slightly over but both are the simplest primitives. | **PASS** |
| 15 | Vault Scholar (T3) | passive x2 + conditional + trait_grant | All valid. `trait_grant` requires `grantedTrait` (string). | 0.08 + 0.04 Eye = 0.12 Eye, 0.05 Stone. Under cap. | T3: 4 effects, 2-3 expected. trait_grant is lightweight. | **PASS** |
| 16 | Tide Reader (T2) | passive + conditional + range_modifier | All valid. `range_modifier` has `movementCostMultiplier: 0.9` (0.8-1.2 reasonable). | 0.08 + 0.06 Star = 0.14 Star. Under cap. | T2: 3 effects. OK. | **PASS** |
| 17 | Spore-Touched (T2) | passive x2 + tradeoff | All valid. | 0.05 Veil + 0.05 Eye + tradeoff +0.04 Veil/-0.02 Heart = 0.09 Veil max. Under cap. | T2: 3 effects. OK. | **PASS** |
| 18 | Ironblood (T2) | passive x2 + conditional | All valid. `condition: 'in_combat'` valid. | 0.05 + 0.05 Iron = 0.10 Iron, 0.05 Star. Under cap. | T2: 3 effects, 1-2 expected. 3 is slightly over but all simple. | **PASS** |

### Conditions

| # | Item | Effects | Type Check | Value Check | Tier Match | Verdict |
|---|------|---------|-----------|-------------|------------|---------|
| 19 | Crystal Headache (T1) | passive + conditional | All valid. Negative values for debuffs. | -0.05 Eye, -0.04 Veil conditional. Reasonable debuff. | T1: 2 effects, 1 expected. Acceptable for conditions. | **PASS** |
| 20 | Golden Euphoria (T1) | passive x2 + social_modifier | All valid. `social_modifier` with `targetFilter: 'any'`, `cooperationBias: 0.1`. | +0.08 Heart, -0.06 Iron. Mixed blessing. | T1: 3 effects. Slightly over for T1 but conditions are mixed-blessing by design. | **PASS** |
| 21 | Vault Curse (T2) | passive + stacking | All valid. `stacking` with negative `valuePerStack` (-0.01) for escalating curse. `stackOn: 'any_encounter'` valid StackTrigger. | -0.08 Star - up to 0.05 more = -0.13 Star max. Potent curse. Under cap in absolute terms. | T2: 2 effects. Appropriate. | **PASS** |
| 22 | Brine Lungs (T1) | passive + range_modifier | All valid. `movementCostMultiplier: 1.2` = 20% slower. Reasonable. | -0.06 Iron + movement penalty. | T1: 2 effects. OK. | **PASS** |
| 23 | Spore Visions (T2) | passive x2 + range_modifier | All valid. `awarenessRangeBonus: 1`. | +0.10 Eye, -0.08 Heart. +awareness. Mixed blessing. | T2: 3 effects. OK. | **PASS** |
| 24 | Fossil Whispers (T1) | passive x2 + axiological_drift | All valid. `axiological_drift` requires `axis` (string), `ratePerTick` (0.005), `limitValue` (0.3). | +0.05 Eye, +0.03 Veil. Plus personality drift. | T1: 3 effects. axiological_drift is lightweight flavor. | **PASS** |

## Duplicate ID Check

All 24 IDs begin with `anomaly_` prefix. Checked against `reward-attachment-catalog.ts` — no duplicates. All IDs are existing and unchanged.

## Overall Verdict: **READY FOR IMPLEMENTATION**

All 24 items pass type validity, value bounds, and tier appropriateness checks. No exclusions needed.
