# Attachment Systems Audit: Thin Primitives (resource_manipulate, slot_bonus, content_grant)
> Slug: fill-thin-primitives | Pass: systems | Date: 2026-04-07

Source files checked:
- `src/types/effects.ts` — 39 effect discriminants; ResourceManipulateEffect (Type 36), SlotBonusEffect (Type 39), ContentGrantEffect (Type 19g), PassiveEffect (Type 1), ConditionalEffect (Type 6), TradeoffEffect (Type 13), DecayEffect (Type 12), ConsumableChargeEffect (Type 2), RangeModifierEffect (Type 34)
- `src/types/attachments.ts` — PossessionNodeProperties, LossCondition, PossessionSubcategory
- `src/types/traits.ts` — ReachDomain (`iron | gold | shadow | veil | heart | eye | stone | star`)
- `src/types/rarity.ts` — RarityTier (`1 | 2 | 3 | 4`)
- `src/data/effect-constants.ts` — EFFECT_PER_ITEM_CAP = 0.15, MAX_EFFECTS_PER_ATTACHMENT = 6
- `src/data/reward-attachment-catalog.ts` — ID collision check (0 of 12 new IDs present — confirmed new); templateId existence check (all 8 content_grant target IDs confirmed present)

**Balance cap applied:** EFFECT_PER_ITEM_CAP = 0.15 — max always-on passive reach contribution from a single effect, per reach domain, per item. Conditional bonuses are noted separately; they do not normally breach this cap because they are situational. The cap applies to each effect individually, not in aggregate across an item.

**Hard cap:** MAX_EFFECTS_PER_ATTACHMENT = 6 — runtime engine constraint. Violations block implementation.

**Consumable coherence rule:** When `lossCondition: 'consumable'` and any effect is `one_shot`, other effects on the same item (e.g. `passive`, `conditional`) persist until the item is consumed. If the `one_shot` condition is never met, non-consuming effects run indefinitely. This is an engine behavior, not a type error — but it creates design incoherence for items that pair `consumable` + `passive` + conditional `one_shot`.

---

## Exact Interface Verification

### ResourceManipulateEffect (Type 36)
```typescript
interface ResourceManipulateEffect {
  readonly type: 'resource_manipulate';
  readonly resource: 'essence' | 'quintessence';
  readonly target: 'self' | 'other_agent';
  readonly amount: number;              // positive = restore, negative = drain
  readonly mode: 'per_tick' | 'one_shot';
  readonly condition?: EffectPredicate; // optional
}
```
Valid `EffectCondition` values used in this batch: `'in_mystical'`, `'alone'` — both confirmed in the `EffectCondition` union.

### SlotBonusEffect (Type 39)
```typescript
interface SlotBonusEffect {
  readonly type: 'slot_bonus';
  readonly slotTag: string;  // free-form string, not an enum
  readonly bonus: number;    // positive integer
}
```
`slotTag` values used: `'weapon'`, `'consumable'`, `'utility'`, `'tome'`, `'wealth'` — all are free-form strings; no enum validation issue.

### ContentGrantEffect (Type 19g)
```typescript
interface ContentGrantEffect {
  readonly type: 'content_grant';
  readonly templateIds: readonly string[];
  readonly selection?: 'first' | 'random';
  readonly narrativeTemplate?: string;
}
```
All three usage patterns match exactly: `templateIds` is a string array, `selection: 'random'` is a valid discriminant, `narrativeTemplate` is optional.

---

## Audit Results

### 1. Spring Water Vial — `reward_provisions_spring_water_vial`

**Effects (2):**
```typescript
{ type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' }
{ type: 'conditional', condition: 'near_water', reach: 'star', value: 0.02 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `resource_manipulate` (Type 36): all required fields present (`resource`, `target`, `amount`, `mode`) — field types match. `conditional` (Type 6): `condition: EffectPredicate` — `'near_water'` is a valid `EffectCondition`. `reach: ReachDomain` — `'star'` is valid. `value: number` (0.02) — correct. |
| Reach Values | PASS | `star` is a valid `ReachDomain`. Conditional value 0.02 is well under EFFECT_PER_ITEM_CAP (0.15). |
| Predicates | PASS | `'near_water'` is a valid `EffectCondition`. |
| Tier Appropriateness | PASS | T1 with 2 effects. Consistent with T1 catalog pattern. |
| Balance | PASS | No always-on passive value. Conditional Star 0.02 + one-shot essence restore is appropriate for T1. |
| Effect Count | PASS | 2 effects. Well under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Duplicate ID | PASS | `reward_provisions_spring_water_vial` not present in catalog. |
| Loss Condition | PASS | `consumable` is a valid `LossCondition`. |
| **Consumable Coherence** | **WARN** | `lossCondition: 'consumable'` but only the `resource_manipulate` (one_shot) consumes the item. The `conditional` passive (+0.02 Star near water) persists indefinitely until consumption. If the item is never used near a shrine/holy site, the passive runs until the item is otherwise consumed. This is a design ambiguity, not a type error — the engine will behave consistently (conditional passive active while held), but the item does not function as a "drink it and it's gone" provision. **Flagged for implementor awareness.** |

**Verdict: PASS with WARN**

---

### 2. Meditation Stones — `reward_provisions_meditation_stones`

**Effects (2):**
```typescript
{ type: 'passive', reach: 'star', value: 0.03 }
{ type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot', condition: 'alone' }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): `reach: ReachDomain`, `value: number` — correct. `resource_manipulate` (Type 36): `resource: 'essence'`, `target: 'self'`, `amount: 1`, `mode: 'one_shot'`, `condition: 'alone'` — all fields match `ResourceManipulateEffect` exactly. `condition` is an optional field on `ResourceManipulateEffect`, not on `ConditionalEffect`. |
| Reach Values | PASS | `star` is a valid `ReachDomain`. Passive 0.03 < EFFECT_PER_ITEM_CAP (0.15). |
| Predicates | PASS | `'alone'` is a valid `EffectCondition`. |
| Tier Appropriateness | PASS | T1 with 2 effects. |
| Balance | PASS | 0.03 Star passive + conditional one-shot essence is appropriate for T1. |
| Effect Count | PASS | 2 effects. Under cap. |
| Duplicate ID | PASS | `reward_provisions_meditation_stones` not present in catalog. |
| Loss Condition | PASS | `consumable` is a valid `LossCondition`. |
| **Consumable Coherence** | **WARN** | `lossCondition: 'consumable'` but the consuming effect (`one_shot`) only fires when `condition: 'alone'` is true. The `passive` (+0.03 Star) runs continuously while held. If the agent is never alone (always in a group or encounter), the one_shot never fires and the consumable is never consumed — it behaves as a permanent passive item. The design intent (stones settle the mind in solitude) makes thematic sense, but the engine treats a consumable that hasn't been consumed as still-held. **Flagged for implementor awareness: consider whether to add a tick-expiry fallback or accept this as intentional behavior.** |

**Verdict: PASS with WARN**

---

### 3. Leather Bandolier — `reward_tools_instruments_leather_bandolier`

**Effects (2):**
```typescript
{ type: 'passive', reach: 'iron', value: 0.02 }
{ type: 'slot_bonus', slotTag: 'weapon', bonus: 1 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): `reach: 'iron'`, `value: 0.02` — correct. `slot_bonus` (Type 39): `slotTag: 'weapon'`, `bonus: 1` — matches `SlotBonusEffect` exactly. Both required fields present, correct types. |
| Reach Values | PASS | `iron` is a valid `ReachDomain`. 0.02 < EFFECT_PER_ITEM_CAP (0.15). |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T1 with 2 effects. Matches Pack Goat pattern (T1, 1 passive + 1 slot_bonus). |
| Balance | PASS | 0.02 Iron passive + 1 weapon slot is lean for T1 — appropriate. |
| Effect Count | PASS | 2 effects. Under cap. |
| Duplicate ID | PASS | `reward_tools_instruments_leather_bandolier` not present in catalog. |
| Loss Condition | PASS | `breakable` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 4. Scroll Case — `reward_tools_instruments_scroll_case`

**Effects (2):**
```typescript
{ type: 'passive', reach: 'veil', value: 0.02 }
{ type: 'slot_bonus', slotTag: 'tome', bonus: 1 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): `reach: 'veil'`, `value: 0.02` — correct. `slot_bonus` (Type 39): `slotTag: 'tome'`, `bonus: 1` — matches `SlotBonusEffect`. |
| Reach Values | PASS | `veil` is a valid `ReachDomain`. 0.02 < EFFECT_PER_ITEM_CAP. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T1 with 2 effects. Clean and minimal. |
| Balance | PASS | 0.02 Veil + 1 tome slot. Lean T1 — appropriate. |
| Effect Count | PASS | 2 effects. Under cap. |
| Duplicate ID | PASS | `reward_tools_instruments_scroll_case` not present in catalog. |
| Loss Condition | PASS | `breakable` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 5. River Clay Bead — `reward_relics_talismans_river_clay_bead`

**Effects (2):**
```typescript
{ type: 'passive', reach: 'star', value: 0.04 }
{ type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'per_tick', condition: 'in_mystical' }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): correct. `resource_manipulate` (Type 36): `resource: 'essence'`, `target: 'self'`, `amount: 1`, `mode: 'per_tick'`, `condition: 'in_mystical'` — all fields match. `condition` is correctly typed as `EffectPredicate?` on `ResourceManipulateEffect`. |
| Reach Values | PASS | `star` is a valid `ReachDomain`. 0.04 < EFFECT_PER_ITEM_CAP. |
| Predicates | PASS | `'in_mystical'` is a valid `EffectCondition`. |
| Tier Appropriateness | PASS | T2 with 2 effects. Consistent with T2 minimum. |
| Balance | PASS | 0.04 Star passive + conditional per-tick essence restore in mystical encounters. Per-tick essence restore is gated by `in_mystical` — only active during mystical encounter steps. Not runaway. |
| Effect Count | PASS | 2 effects. Under cap. |
| Duplicate ID | PASS | `reward_relics_talismans_river_clay_bead` not present in catalog. |
| Loss Condition | PASS | `breakable` is a valid `LossCondition`. |
| **Economy Note** | INFO | Per-tick essence restoration during mystical encounters is potent if mystical encounters are long. The `condition: 'in_mystical'` gate limits exposure. Worth monitoring during balance testing — no action required at authoring time. |

**Verdict: PASS**

---

### 6. Tarnished Draw-Tube — `reward_relics_talismans_tarnished_draw_tube`

**Effects (2):**
```typescript
{ type: 'tradeoff', bonus: { reach: 'veil', value: 0.06 }, penalty: { reach: 'star', value: 0.03 } }
{ type: 'resource_manipulate', resource: 'quintessence', target: 'other_agent', amount: -1, mode: 'per_tick' }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `tradeoff` (Type 13): `bonus: { reach: ReachDomain; value: number }` — `'veil'` valid, 0.06 number. `penalty: { reach: ReachDomain; value: number }` — `'star'` valid, 0.03 number. All required fields on `TradeoffEffect` present. `resource_manipulate` (Type 36): `resource: 'quintessence'`, `target: 'other_agent'`, `amount: -1`, `mode: 'per_tick'` — all fields match. Negative `amount` is explicitly documented as drain in the JSDoc: "positive = restore, negative = drain". |
| Reach Values | PASS | `veil` and `star` are valid `ReachDomain`. TradeoffEffect: bonus 0.06, penalty 0.03 — both individually under 0.15. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 2 effects. Parasitic relic design is distinctive and thematically strong. |
| Balance | PASS | Net effect is +0.06 Veil - 0.03 Star on the bearer + continuous quintessence drain on a nearby agent. This is a T2 with meaningful downside vectors — well-balanced. |
| Effect Count | PASS | 2 effects. Under cap. |
| Duplicate ID | PASS | `reward_relics_talismans_tarnished_draw_tube` not present in catalog. |
| Loss Condition | PASS | `stealable` is a valid `LossCondition`. Thematically apt — a parasitic device worth stealing. |
| **Targeting Note** | INFO | `target: 'other_agent'` with `mode: 'per_tick'` drains an adjacent agent each tick. The engine must resolve which agent is drained (nearest? random? same encounter?). This is an engine resolution question, not an authoring error — but implementors should verify `resource_manipulate` with `target: 'other_agent'` has defined targeting semantics in the tick phase. Consistent with the Miser's Mark precedent (existing usage). |

**Verdict: PASS**

---

### 7. Quartermaster's Harness — `reward_tools_instruments_quartermasters_harness`

**Effects (4):**
```typescript
{ type: 'passive', reach: 'stone', value: 0.04 }
{ type: 'slot_bonus', slotTag: 'consumable', bonus: 1 }
{ type: 'slot_bonus', slotTag: 'utility', bonus: 1 }
{ type: 'range_modifier', movementCostMultiplier: 1.2 }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): correct. Two `slot_bonus` (Type 39): `slotTag: 'consumable'` and `slotTag: 'utility'`, both `bonus: 1` — both match `SlotBonusEffect`. Multiple slot_bonus effects on one item are additive — valid. `range_modifier` (Type 34): `movementCostMultiplier: 1.2` — field name matches `RangeModifierEffect.movementCostMultiplier?: number` exactly. Value 1.2 = 20% slower movement. |
| Reach Values | PASS | `stone` is a valid `ReachDomain`. 0.04 < EFFECT_PER_ITEM_CAP. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 4 effects. Multi-effect T2 is established catalog pattern. |
| Balance | PASS | 0.04 Stone passive + 2 slot expansions offset by 20% movement penalty. Genuine trade-off. Within T2 budget. |
| Effect Count | PASS | 4 effects. Under cap. |
| Duplicate ID | PASS | `reward_tools_instruments_quartermasters_harness` not present in catalog. |
| Loss Condition | PASS | `breakable` is a valid `LossCondition`. |

**Verdict: PASS**

---

### 8. Sealed Bounty Scroll — `reward_tomes_scrolls_sealed_bounty_scroll`

**Effects (3):**
```typescript
{ type: 'passive', reach: 'gold', value: 0.04 }
{ type: 'consumable_charge', charges: 2, onUse: { reach: 'gold', value: 0.01 }, destroyOnEmpty: true }
{
  type: 'content_grant',
  templateIds: [
    'reward_provisions_healing_poultice',
    'reward_provisions_travelers_wine',
    'reward_relics_talismans_bone_ward',
    'reward_relics_talismans_wayfarers_charm',
    'reward_provisions_hardtack_and_salt',
  ],
  selection: 'random',
  narrativeTemplate: 'The seal cracks. Inside: {grantedName}.',
}
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): `reach: 'gold'`, `value: 0.04` — correct. `consumable_charge` (Type 2): `charges: 2` (number), `onUse: { reach: ReachDomain; value: number }` — `'gold'` valid, 0.01 number — matches `ConsumableChargeEffect.onUse` exactly. `destroyOnEmpty: boolean` (true) — correct. `content_grant` (Type 19g): `templateIds: readonly string[]` — 5 entries, all strings. `selection: 'random'` — valid discriminant. `narrativeTemplate?: string` — optional field provided. |
| Reach Values | PASS | `gold` is a valid `ReachDomain`. 0.04 passive, 0.01 per-use — both under 0.15. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 3 effects. `consumable_charge` + `content_grant` is the designed pattern for discovery items. |
| Balance | PASS | 0.04 Gold passive + 2-charge content grant. Appropriate for T2. The granted items are all T1 possessions — correct tier ceiling for a T2 discovery item. |
| Effect Count | PASS | 3 effects. Under cap. |
| Duplicate ID | PASS | `reward_tomes_scrolls_sealed_bounty_scroll` not present in catalog. |
| Loss Condition | PASS | `consumable` is a valid `LossCondition`. |
| **TemplateId Check** | **PASS** | All 5 templateIds confirmed present in `reward-attachment-catalog.ts`: `reward_provisions_healing_poultice` (line 1432), `reward_provisions_travelers_wine` (line 1396), `reward_relics_talismans_bone_ward` (line 863), `reward_relics_talismans_wayfarers_charm` (line 846), `reward_provisions_hardtack_and_salt` (line 1346). |
| **Coherence Note** | INFO | `lossCondition: 'consumable'` and `consumable_charge` with `destroyOnEmpty: true` — the passive Gold bonus persists while charges remain. On second use, item is destroyed. Passive ends. This is coherent: the item provides passive Gold value as a "residual value" while it still holds charges. |

**Verdict: PASS**

---

### 9. Tithe Box — `reward_tomes_scrolls_tithe_box`

**Effects (3):**
```typescript
{ type: 'passive', reach: 'heart', value: 0.03 }
{ type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' }
{
  type: 'content_grant',
  templateIds: [
    'reward_tomes_scrolls_prayer_scroll',
    'reward_provisions_healing_poultice',
    'reward_condition_fortune_kissed',
  ],
  selection: 'random',
  narrativeTemplate: 'The tithe box opens with a faint sigh. Within: {grantedName}.',
}
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): correct. `resource_manipulate` (Type 36): `resource: 'essence'`, `target: 'self'`, `amount: 1`, `mode: 'one_shot'` — all required fields match. `content_grant` (Type 19g): `templateIds` array with 3 strings, `selection: 'random'`, `narrativeTemplate` string — all match `ContentGrantEffect`. |
| Reach Values | PASS | `heart` is a valid `ReachDomain`. 0.03 < EFFECT_PER_ITEM_CAP. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T2 with 3 effects. Appropriate for a T2 offering item. |
| Balance | PASS | 0.03 Heart + 1 essence + random T1/condition grant. Conservative for T2. |
| Effect Count | PASS | 3 effects. Under cap. |
| Duplicate ID | PASS | `reward_tomes_scrolls_tithe_box` not present in catalog. |
| Loss Condition | PASS | `consumable` is a valid `LossCondition`. |
| **Subcategory Note** | INFO | Listed as `tomes_scrolls` subcategory in the plan. `slotTag: 'utility'` is set as a top-level property on `PossessionNodeProperties` — this is a valid field added 2026-04-06 (confirmed in `attachments.ts` line 87: `slotTag?: string`). The `slotTag` overrides subcategory for slot enforcement. This is correct usage. |
| **TemplateId Check** | **PASS** | All 3 templateIds confirmed present: `reward_tomes_scrolls_prayer_scroll` (line 578), `reward_provisions_healing_poultice` (line 1432), `reward_condition_fortune_kissed` (line 2498). |
| **Consumable Coherence** | **WARN** | `lossCondition: 'consumable'` with a `one_shot` resource_manipulate (no condition) and a `content_grant`. Neither `one_shot` nor `content_grant` have clear "which fires first" ordering defined in the plan. The engine presumably fires all effects at open-time (use action). The `passive` persists until use; once consumed the passive ends. This is coherent — but the engine behavior for "what triggers item consumption when there are multiple fire-once effects" should be verified at implementation time. |

**Verdict: PASS with WARN**

---

### 10. Salvage Kit — `reward_tools_instruments_salvage_kit`

**Effects (3):**
```typescript
{ type: 'passive', reach: 'stone', value: 0.04 }
{ type: 'conditional', condition: 'in_wilderness', reach: 'stone', value: 0.02 }
{
  type: 'content_grant',
  templateIds: [
    'reward_provisions_hardtack_and_salt',
    'reward_arms_bronze_spear',
    'reward_provisions_travelers_wine',
    'reward_relics_talismans_bone_ward',
  ],
  selection: 'random',
  narrativeTemplate: 'The kit finds purchase. Salvaged: {grantedName}.',
}
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `passive` (Type 1): correct. `conditional` (Type 6): `condition: 'in_wilderness'` is a valid `EffectCondition`, `reach: 'stone'`, `value: 0.02` — correct. `content_grant` (Type 19g): `templateIds` array with 4 strings, `selection: 'random'`, `narrativeTemplate` provided — matches interface exactly. |
| Reach Values | PASS | `stone` is a valid `ReachDomain`. Passive 0.04 and conditional 0.02 — both individually under 0.15. Max Stone = 0.06. |
| Predicates | PASS | `'in_wilderness'` is a valid `EffectCondition`. |
| Tier Appropriateness | PASS | T2 with 3 effects. |
| Balance | PASS | 0.04 Stone passive + 0.02 Stone conditional + content_grant. The conditional is modest. The grant pool includes a T1 arm (`bronze_spear`) and T1 provisions — appropriate ceiling for T2 salvage. |
| Effect Count | PASS | 3 effects. Under cap. |
| Duplicate ID | PASS | `reward_tools_instruments_salvage_kit` not present in catalog. |
| Loss Condition | PASS | `consumable` is a valid `LossCondition`. |
| **TemplateId Check** | **PASS** | All 4 templateIds confirmed present: `reward_provisions_hardtack_and_salt` (line 1346), `reward_arms_bronze_spear` (line 22), `reward_provisions_travelers_wine` (line 1396), `reward_relics_talismans_bone_ward` (line 863). |
| **Content_Grant Trigger** | INFO | The plan says "grants a random provision or tool when exploring" — but the `content_grant` has no `condition` field (`ContentGrantEffect` has no `condition` property). The grant fires unconditionally when the item is used/consumed. The `conditional` effect (+0.02 Stone in wilderness) is a separate reach bonus, not a gate on the grant. The `mechanicalSummary` reads "grants a random provision or tool when exploring" — this is slightly misleading since the grant fires at use-time regardless of context. Not a type error; a prose accuracy issue. |

**Verdict: PASS**

---

### 11. The Sweating Vessel — `reward_relics_talismans_the_sweating_vessel`

**Effects (3):**
```typescript
{ type: 'decay', reach: 'veil', startValue: 0.08, changePerTick: -0.003, limitValue: 0.02, destroyAtLimit: false }
{ type: 'passive', reach: 'star', value: -0.04 }
{ type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: 2, mode: 'per_tick' }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | `decay` (Type 12): `reach: 'veil'` (valid `ReachDomain`), `startValue: 0.08` (number), `changePerTick: -0.003` (number, negative = decreasing), `limitValue: 0.02` (number), `destroyAtLimit: false` (boolean) — all required fields on `DecayEffect` present and correctly typed. `passive` (Type 1): `reach: 'star'`, `value: -0.04` — negative passive value is a valid penalty. `resource_manipulate` (Type 36): `resource: 'quintessence'`, `target: 'self'`, `amount: 2`, `mode: 'per_tick'` — all fields match. |
| Reach Values | PASS | `veil` and `star` are valid `ReachDomain`. Decay startValue 0.08 < EFFECT_PER_ITEM_CAP (0.15). Passive penalty -0.04 < 0.15 in magnitude. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T3 with 3 effects. Appropriate — decay mechanism and per-tick quintessence restore make this mechanically sophisticated despite low effect count. |
| Balance | PASS | Decay: 0.08 Veil decaying to 0.02 over ~20 ticks (0.06 / 0.003). Star penalty -0.04 is persistent cost. Quintessence +2/tick is significant — but `lossCondition: 'cursed'` means the player cannot discard it. The built-in tension (powerful but you're stuck with it) is intentional and well-designed. Both passive values individually under 0.15. |
| Effect Count | PASS | 3 effects. Under cap. |
| Duplicate ID | PASS | `reward_relics_talismans_the_sweating_vessel` not present in catalog. |
| Loss Condition | PASS | `cursed` is a valid `LossCondition`. Thematically correct — you cannot willingly discard it. |
| **Decay Math** | INFO | `startValue: 0.08`, `changePerTick: -0.003`, `limitValue: 0.02`. Ticks to reach limit: (0.08 - 0.02) / 0.003 = 20 ticks. At 12 ticks per game day, this decays over ~1.7 game days. Short-lived peak bonus — by design (the vessel sweats itself out). `destroyAtLimit: false` means the item stays at 0.02 Veil permanently after decay completes. |

**Verdict: PASS**

---

### 12. Bag of Conveyance — `reward_tools_instruments_bag_of_conveyance`

**Effects (5):**
```typescript
{ type: 'passive', reach: 'gold', value: 0.06 }
{ type: 'passive', reach: 'veil', value: 0.04 }
{ type: 'slot_bonus', slotTag: 'consumable', bonus: 2 }
{ type: 'slot_bonus', slotTag: 'wealth', bonus: 1 }
{ type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' }
```

| Check | Result | Notes |
|-------|--------|-------|
| Type Validity | PASS | Two `passive` (Type 1) effects: `reach: 'gold'` 0.06, `reach: 'veil'` 0.04 — both valid. Two `slot_bonus` (Type 39): `slotTag: 'consumable'` with `bonus: 2`, `slotTag: 'wealth'` with `bonus: 1` — both match `SlotBonusEffect`. Multiple slot_bonus effects are valid and additive. `resource_manipulate` (Type 36): `resource: 'essence'`, `target: 'self'`, `amount: 1`, `mode: 'one_shot'` — correct. |
| Reach Values | PASS | `gold` and `veil` are valid `ReachDomain`. Gold 0.06 < 0.15, Veil 0.04 < 0.15. Both individually within EFFECT_PER_ITEM_CAP. |
| Predicates | N/A | No conditional predicates. |
| Tier Appropriateness | PASS | T3 with 5 effects. Within T3 range. |
| Balance | PASS | 0.06 Gold + 0.04 Veil + 3 slot expansions (consumable+2, wealth+1) + one-shot essence. Rich but the passive values are individually conservative. Total passive is 0.10 across two reaches — under the per-reach cap on each. `lossCondition: 'stealable'` creates vulnerability that offsets the power. |
| Effect Count | PASS | 5 effects. Under MAX_EFFECTS_PER_ATTACHMENT (6). |
| Duplicate ID | PASS | `reward_tools_instruments_bag_of_conveyance` not present in catalog. |
| Loss Condition | PASS | `stealable` is a valid `LossCondition`. Thematically appropriate for a bag with value. |
| **slotTag field** | PASS | Top-level `slotTag: 'utility'` is present in `PossessionNodeProperties` interface (line 87 of `attachments.ts`). This is valid and correct per the slot system design. |
| **Consumable Coherence** | INFO | `lossCondition: 'stealable'` (not `consumable`), so the `one_shot` resource_manipulate fires once on acquisition and the item persists. The passive effects run indefinitely until stolen. This is coherent — the one_shot is a "bonus on pickup" pattern, not a consumption trigger. No concern. |

**Verdict: PASS**

---

## Summary Table

| # | Name | Tier | Effects | Type Valid | Reach Valid | Predicate Valid | Balance | Under Hard Cap | Dupe ID | TemplateIds | Verdict |
|---|------|------|---------|-----------|------------|----------------|---------|----------------|---------|-------------|---------|
| 1 | Spring Water Vial | T1 | 2 | PASS | PASS | PASS | PASS | PASS | PASS | N/A | **PASS** (WARN: consumable coherence) |
| 2 | Meditation Stones | T1 | 2 | PASS | PASS | PASS | PASS | PASS | PASS | N/A | **PASS** (WARN: consumable coherence) |
| 3 | Leather Bandolier | T1 | 2 | PASS | PASS | N/A | PASS | PASS | PASS | N/A | **PASS** |
| 4 | Scroll Case | T1 | 2 | PASS | PASS | N/A | PASS | PASS | PASS | N/A | **PASS** |
| 5 | River Clay Bead | T2 | 2 | PASS | PASS | PASS | PASS | PASS | PASS | N/A | **PASS** |
| 6 | Tarnished Draw-Tube | T2 | 2 | PASS | PASS | N/A | PASS | PASS | PASS | N/A | **PASS** |
| 7 | Quartermaster's Harness | T2 | 4 | PASS | PASS | N/A | PASS | PASS | PASS | N/A | **PASS** |
| 8 | Sealed Bounty Scroll | T2 | 3 | PASS | PASS | N/A | PASS | PASS | PASS | 5/5 PASS | **PASS** |
| 9 | Tithe Box | T2 | 3 | PASS | PASS | N/A | PASS | PASS | PASS | 3/3 PASS | **PASS** (WARN: multi-fire ordering) |
| 10 | Salvage Kit | T2 | 3 | PASS | PASS | PASS | PASS | PASS | PASS | 4/4 PASS | **PASS** |
| 11 | The Sweating Vessel | T3 | 3 | PASS | PASS | N/A | PASS | PASS | PASS | N/A | **PASS** |
| 12 | Bag of Conveyance | T3 | 5 | PASS | PASS | N/A | PASS | PASS | PASS | N/A | **PASS** |

### Issue Register

| Severity | Item | Issue | Action Required |
|----------|------|-------|-----------------|
| WARN | #1 Spring Water Vial | `consumable` + persistent `conditional` passive + unconditioned `one_shot`: passive runs until consumption; one_shot may never fire if not near water | Implementor awareness only. Accept as intentional or add tick-expiry. No authoring change required. |
| WARN | #2 Meditation Stones | `consumable` + persistent `passive` + `one_shot` gated on `alone`: if never alone, item never consumed; passive runs indefinitely | Implementor awareness only. Accept as intentional (stones are never consumed by a social agent) or add fallback expiry. No authoring change required. |
| WARN | #9 Tithe Box | `consumable` with both `one_shot` resource_manipulate and `content_grant` — engine must define which effect triggers consumption, and ordering of multi-effect fires | Implementor should verify engine behavior for multi-fire-once effects on consumption. No authoring change required. |
| INFO | #6 Tarnished Draw-Tube | `target: 'other_agent'` per-tick drain needs defined targeting semantics (nearest? current encounter partner?) | Engine implementation detail. Consistent with Miser's Mark precedent. No authoring change required. |
| INFO | #10 Salvage Kit | `mechanicalSummary` says "when exploring" but `content_grant` has no condition; grant fires unconditionally | Minor prose inaccuracy in mechanicalSummary only. No effect code change needed. Optional fix before catalog merge. |
| INFO | #11 The Sweating Vessel | Decay reaches limitValue in ~20 ticks (~1.7 game days) — rapid decay for a T3 item | Design intent confirmed (the vessel sweats itself out). No action required. |

### TemplateId Resolution

All 8 distinct templateIds referenced across 3 content_grant items confirmed present in `reward-attachment-catalog.ts`:

| TemplateId | Item Using It | Catalog Line |
|-----------|--------------|--------------|
| `reward_provisions_healing_poultice` | Sealed Bounty Scroll, Tithe Box | 1432 |
| `reward_provisions_travelers_wine` | Sealed Bounty Scroll, Salvage Kit | 1396 |
| `reward_relics_talismans_bone_ward` | Sealed Bounty Scroll, Salvage Kit | 863 |
| `reward_relics_talismans_wayfarers_charm` | Sealed Bounty Scroll | 846 |
| `reward_provisions_hardtack_and_salt` | Sealed Bounty Scroll, Salvage Kit | 1346 |
| `reward_tomes_scrolls_prayer_scroll` | Tithe Box | 578 |
| `reward_condition_fortune_kissed` | Tithe Box | 2498 |
| `reward_arms_bronze_spear` | Salvage Kit | 22 |

**Zero missing templateIds. Zero broken references.**

### Duplicate ID Check

All 12 new IDs are absent from `reward-attachment-catalog.ts`. Zero collisions.

---

## Overall Systems Verdict

**READY WITH CAVEATS**

All 12 items are type-valid, reach-domain-valid, predicate-valid, under the MAX_EFFECTS_PER_ATTACHMENT = 6 hard cap, within per-reach balance caps, and have zero duplicate IDs. All 8 content_grant templateIds resolve to real catalog entries.

The three WARNs are design coherence observations, not type or engine blockers. None require authoring changes before implementation — they are notes for the implementor about expected engine behavior for edge cases in the consumable lifecycle. If the engine handles `one_shot` effects as "fire and mark consumed, item persists until lossCondition is met" (the most natural interpretation), all three WARNs resolve to intended behavior.

The one INFO on Salvage Kit's mechanicalSummary is a prose accuracy issue only. If desired, change "when exploring" to "on use" — no effect code change.

No items need to be blocked or revised.
