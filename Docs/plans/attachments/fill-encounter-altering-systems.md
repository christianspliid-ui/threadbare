# Systems Audit: Encounter-Altering Primitives (Suppress, Reroll, Create Barrier)
> Batch: fill-encounter-altering | Pass: systems | Auditor: Claude Code
> Source: fill-encounter-altering-revised.md
> Date: 2026-04-07

## Verification Sources

| Source | Notes |
|--------|-------|
| `src/types/effects.ts` | Canonical interface definitions for all 39 effect types |
| `src/types/attachments.ts` | PossessionNodeProperties, LossCondition, PossessionSubcategory |
| `src/types/traits.ts` | TraitDefinitionProperties, ReachDomain (8 valid values) |
| `src/data/effect-constants.ts` | `EFFECT_PER_ITEM_CAP = 0.15`, `MAX_EFFECTS_PER_ATTACHMENT = 6` |
| `src/data/reward-attachment-catalog.ts` | No ID collisions found for all 10 new items |
| `src/engine/effectExecutors.ts` | suppress/reroll/create_barrier registered as pass-throughs |
| `src/engine/effectResolver.ts` | suppress/reroll/create_barrier return 0 reach contribution |

## Schema Reference (Verified)

### SuppressEffect (Type 18b)
```typescript
interface SuppressEffect {
  readonly type: 'suppress';
  readonly target: 'spell' | 'aura' | 'all_effects';
  readonly scope: EffectScope;        // REQUIRED — not optional
  readonly ticks: number;
}
```

### RerollEffect (Type 19b)
```typescript
interface RerollEffect {
  readonly type: 'reroll';
  readonly uses: number;
}
```

### CreateBarrierEffect (Type 20b)
```typescript
interface CreateBarrierEffect {
  readonly type: 'create_barrier';
  readonly between: 'self_hex';       // ONLY valid value
  readonly and: 'adjacent';           // ONLY valid value
  readonly blocks: 'movement' | 'awareness' | 'both';
  readonly ticks: number;
}
```

### EffectScope (cross-cutting)
```typescript
type EffectScope =
  | { scope: 'self' }
  | { scope: 'target' }
  | { scope: 'hex'; target: 'self' | 'target' }
  | { scope: 'radius'; hexes: number }
  | { scope: 'region'; regionId: string | 'self_region' }
  | { scope: 'faction'; faction: string | 'self' | 'enemy' }
  | { scope: 'biome'; biome: string }
  | { scope: 'global' };
```

NOTE: The `scope` discriminant is `scope`, NOT `type`. A scope of `{ scope: 'self' }` is the correct form.
The draft consistently uses the `scope` key — this is correct.

### PassiveEffect (Type 1)
```typescript
interface PassiveEffect {
  readonly type: 'passive';
  readonly reach: ReachDomain;
  readonly value: number;
  readonly scope?: EffectScope;
}
```

### ConditionalEffect (Type 6)
```typescript
interface ConditionalEffect {
  readonly type: 'conditional';
  readonly condition: EffectPredicate;
  readonly reach: ReachDomain;
  readonly value: number;
  readonly scope?: EffectScope;
}
```

### ConsumableChargeEffect (Type 2)
```typescript
interface ConsumableChargeEffect {
  readonly type: 'consumable_charge';
  readonly charges: number;
  readonly onUse: { readonly reach: ReachDomain; readonly value: number };
  readonly destroyOnEmpty: boolean;
  readonly scope?: EffectScope;
}
```

### TestShaperEffect (Type 19e)
```typescript
interface TestShaperEffect {
  readonly type: 'test_shaper';
  readonly reach?: ReachDomain;       // optional
  readonly condition?: EffectPredicate;
  readonly trigger: TestShaperTrigger;
  readonly maxMargin?: number;        // optional
  readonly steps: number;
  readonly scope?: EffectScope;
}
```

### AuraEffect (Type 10)
```typescript
interface AuraEffect {
  readonly type: 'aura';
  readonly radius: number;
  readonly target: 'allies' | 'enemies' | 'all';
  readonly reach: ReachDomain;
  readonly value: number;
}
```

### RevealEffect (Type 16)
```typescript
interface RevealEffect {
  readonly type: 'reveal';
  readonly target: 'hexes' | 'agent' | 'encounters' | 'attachments';
  readonly range: number | 'all';
  readonly duration?: number;
}
```

### AxiologicalDriftEffect (Type 33)
```typescript
interface AxiologicalDriftEffect {
  readonly type: 'axiological_drift';
  readonly axis: string;
  readonly ratePerTick: number;
  readonly limitValue: number;
}
```

---

## Balance Constants

| Constant | Value | Source |
|----------|-------|--------|
| EFFECT_PER_ITEM_CAP | 0.15 | effect-constants.ts |
| EFFECT_MODIFIER_CAP | 0.30 | effect-constants.ts |
| MAX_EFFECTS_PER_ATTACHMENT | 6 | effect-constants.ts |
| AURA_MAX_RADIUS | 2 | effect-constants.ts |

---

## Critical Interface Finding: SuppressEffect Scope Key

**FINDING (affects items 1, 7, 9):** The `SuppressEffect` interface uses `scope: EffectScope` where `EffectScope` members use the discriminant key `scope`, NOT `type`. The draft correctly uses `{ scope: 'self' }` form. However, the draft for item 1 (The Hush Stone) writes:

```typescript
{ type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 4 }
```

This is syntactically correct — `scope` field contains `{ scope: 'self' }`, which matches `EffectScope`. PASS.

Item 3 (Null Circlet) uses `scope: { scope: 'radius', hexes: 1 }` — matches `{ scope: 'radius'; hexes: number }`. PASS.

Item 7 (Book of Sealing) uses `scope: { scope: 'hex', target: 'self' }` — matches `{ scope: 'hex'; target: 'self' | 'target' }`. PASS.

All suppress scope expressions are valid.

---

## Per-Item Audits

---

### Item 1: The Hush Stone
**ID:** `reward_relics_talismans_the_hush_stone` | **Type:** artifact | **Tier:** T1

**Effects declared:**
```typescript
{ type: 'passive', reach: 'veil', value: 0.03 }
{ type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.02 }
{ type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 4 }
```

**Effect count:** 3 (T1 guideline 1–3). PASS

**Type validity:**
- `passive`: `reach: 'veil'` (valid ReachDomain), `value: 0.03`. PASS
- `conditional`: `condition: 'in_mystical'` — present in EffectCondition union. `reach: 'veil'`, `value: 0.02`. PASS
- `suppress`: `target: 'spell'` (valid union member), `scope: { scope: 'self' }` (valid EffectScope), `ticks: 4`. All required fields present. PASS

**Reach values:** `veil` — valid. PASS

**Balance (EFFECT_PER_ITEM_CAP = 0.15 per reach):**
- Veil passive: 0.03 — under cap. PASS
- Veil conditional: 0.02 — under cap. PASS
- Peak simultaneous Veil: 0.03 + 0.02 = 0.05 — under cap. PASS

**Tier appropriateness (T1):** 3 effects with modest passive value and a limited-scope suppress. Appropriately T1. PASS

**Summary vs effects consistency:**
- Summary claims "+0.03 Veil, +0.02 Veil in mystical encounters, suppresses spells on self for 4 ticks"
- Effects match exactly. PASS

**Name collision check:** Editorial pass renamed "The Quiet Stone" → "The Hush Stone" to avoid collision with `reward_arms_the_quiet_blade`. Confirmed. PASS

**ID uniqueness:** No collision in catalog. PASS

**VERDICT: PASS**

---

### Item 2: Gambler's Last Copper
**ID:** `reward_relics_talismans_gamblers_last_copper` | **Type:** artifact | **Tier:** T2

**Effects declared:**
```typescript
{ type: 'passive', reach: 'star', value: 0.04 }
{ type: 'reroll', uses: 3 }
{ type: 'test_shaper', reach: 'star', trigger: 'near_miss', maxMargin: 6, steps: 1 }
```

**Effect count:** 3. PASS

**Type validity:**
- `passive`: `reach: 'star'` (valid), `value: 0.04`. PASS
- `reroll`: `uses: 3` — the only required field. PASS
- `test_shaper`: `reach: 'star'` (optional, present), `trigger: 'near_miss'` (valid TestShaperTrigger), `maxMargin: 6` (optional, present), `steps: 1`. No `condition` or `scope` (both optional). PASS

**Reach values:** `star` — valid. PASS

**Balance:**
- Star passive: 0.04 — under 0.15 cap. PASS
- test_shaper adds no reach value directly (it modifies outcome resolution, not modifier totals). PASS

**Tier appropriateness (T2):** 3 effects including a passive, a tactical reroll, and an outcome shaper. Well-constructed T2. PASS

**Mechanical summary vs effects:**
- Summary: "+0.04 Star, 3 encounter rerolls, upgrades near-miss failures by 1 step"
- `reroll`: 3 uses. PASS
- `test_shaper`: trigger 'near_miss', steps 1. The word "failures" in the summary is slightly imprecise — 'near_miss' is a specific trigger type, not generic failure — but the effect itself is correct. Minor prose note, not a mechanical error. PASS

**lossCondition:** `'stealable'` — valid. PASS

**ID uniqueness:** No collision. PASS

**VERDICT: PASS**

---

### Item 3: Null Circlet
**ID:** `reward_relics_talismans_null_circlet` | **Type:** artifact | **Tier:** T3

**Effects declared:**
```typescript
{ type: 'passive', reach: 'veil', value: 0.08 }
{ type: 'passive', reach: 'shadow', value: 0.04 }
{ type: 'passive', reach: 'star', value: -0.04 }
{ type: 'suppress', target: 'all_effects', scope: { scope: 'radius', hexes: 1 }, ticks: 6 }
{ type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'awareness', ticks: 8 }
```

**Effect count:** 5 (T3 guideline 3–4; engine hard cap is 6). One over guideline.

**NOTE:** 5 effects is above the T3 convention of 3–4. However, three of the five are simple passive/penalty effects (the simplest effect type), and the hard cap is 6. Precedent exists in prior batches (time-manipulation Hourglass passed at 5 effects). Acceptable for a T3 cursed relic.

**Type validity:**
- Three `passive` effects: all valid fields. PASS
- `suppress`: `target: 'all_effects'` (valid union member), `scope: { scope: 'radius', hexes: 1 }` — matches `{ scope: 'radius'; hexes: number }`. PASS. `ticks: 6`. PASS
- `create_barrier`: `between: 'self_hex'` (only valid value), `and: 'adjacent'` (only valid value), `blocks: 'awareness'` (valid union member), `ticks: 8`. PASS

**Reach values:** `veil`, `shadow`, `star` — all valid. PASS

**Balance:**
- Veil: 0.08 — under 0.15 cap. PASS
- Shadow: 0.04 — under 0.15 cap. PASS
- Star: -0.04 (penalty) — no cap concern. PASS
- Net passive: 0.08 + 0.04 - 0.04 = 0.08. PASS

**Tier appropriateness (T3):** Strong anti-magic identity. Suppresses ALL effects in 1-hex radius — powerful but tightly scoped and time-bounded. The cursed lossCondition is appropriate for this level of power. PASS

**lossCondition:** `'cursed'` — valid enum. PASS

**Editorial check:** Mechanical summary does NOT include the "(active 6, dormant 18)" cooldown cycle that appeared in the draft — this was corrected in the editorial pass. Confirmed: no CooldownEffect in the effects array. PASS

**ID uniqueness:** No collision. PASS

**CAVEAT:** 5 effects at T3 (one over convention). All three passive effects are simple scalars; acceptable within engine hard cap of 6.

**VERDICT: PASS (with note: 5 effects at T3)**

---

### Item 4: Wardwright's Compass
**ID:** `reward_tools_instruments_wardwright_compass` | **Type:** artifact | **Tier:** T2

**Effects declared:**
```typescript
{ type: 'passive', reach: 'stone', value: 0.05 }
{ type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.03 }
{ type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'movement', ticks: 10 }
```

**Effect count:** 3. PASS

**Type validity:**
- `passive`: `reach: 'stone'` (valid), `value: 0.05`. PASS
- `conditional`: `condition: 'at_home_territory'` — present in EffectCondition union. `reach: 'stone'`, `value: 0.03`. PASS
- `create_barrier`: `between: 'self_hex'`, `and: 'adjacent'`, `blocks: 'movement'`, `ticks: 10`. All fields correct. PASS

**Reach values:** `stone` — valid. PASS

**Balance:**
- Stone passive: 0.05 — under 0.15. PASS
- Stone conditional: 0.03 — under 0.15. PASS
- Peak Stone: 0.05 + 0.03 = 0.08 — under cap. PASS

**Tier appropriateness (T2):** Clean 3-effect T2 tool with defensive territorial identity. PASS

**Summary vs effects consistency:**
- Summary: "+0.05 Stone, creates movement barrier between self hex and adjacent for 10 ticks, +0.03 Stone at home territory"
- Effects match exactly. PASS

**Note on mechanical summary "at home territory" qualifier:** The editorial log flagged removal of "at home territory" from item 10 (Warded Ground), but this item (Wardwright's Compass) legitimately retains it as a `conditional` effect `at_home_territory`. This is mechanically present in the effects array. No issue. PASS

**ID uniqueness:** No collision. PASS

**VERDICT: PASS**

---

### Item 5: Fatesight Lens
**ID:** `reward_tools_instruments_fatesight_lens` | **Type:** artifact | **Tier:** T3

**Effects declared:**
```typescript
{ type: 'passive', reach: 'eye', value: 0.06 }
{ type: 'passive', reach: 'star', value: 0.04 }
{ type: 'passive', reach: 'shadow', value: -0.03 }
{ type: 'reroll', uses: 4 }
{ type: 'reveal', target: 'encounters', range: 2 }
```

**Effect count:** 5. One over the T3 convention of 3–4.

**NOTE:** Again three passives (including a penalty) plus two Tier-2 primitives (reroll + reveal). The same effect-count caveat applies. Precedent established in Null Circlet (Item 3). Acceptable.

**Type validity:**
- Three `passive` effects: valid. PASS
- `reroll`: `uses: 4` — only required field. PASS
- `reveal`: `target: 'encounters'` (valid union member — 'hexes' | 'agent' | 'encounters' | 'attachments'), `range: 2` (valid number). No `duration` (optional, omission valid). PASS

**Reach values:** `eye`, `star`, `shadow` — all valid. PASS

**Balance:**
- Eye: 0.06 — under 0.15. PASS
- Star: 0.04 — under 0.15. PASS
- Shadow: -0.03 — penalty, no cap concern. PASS
- Net passive: 0.06 + 0.04 - 0.03 = 0.07. PASS

**Tier appropriateness (T3):** The reroll + reveal combination is Tier-2 power territory; anchoring them together on a T3 item with a penalty is appropriate. PASS

**Summary vs effects consistency:**
- "+0.06 Eye, +0.04 Star, 4 encounter rerolls, reveals encounters within 2 hexes, -0.03 Shadow"
- All match exactly. PASS

**ID uniqueness:** No collision. PASS

**CAVEAT:** 5 effects at T3. Same caveat as Items 3 and the Hourglass in the prior batch.

**VERDICT: PASS (with note: 5 effects at T3)**

---

### Item 6: Ward Incense
**ID:** `reward_provisions_ward_incense` | **Type:** artifact | **Tier:** T1

**Effects declared:**
```typescript
{ type: 'passive', reach: 'stone', value: 0.02 }
{ type: 'consumable_charge', charges: 3, onUse: { reach: 'stone', value: 0.03 }, destroyOnEmpty: true }
{ type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'movement', ticks: 6 }
```

**Effect count:** 3. PASS

**Type validity:**
- `passive`: `reach: 'stone'`, `value: 0.02`. PASS
- `consumable_charge`: `charges: 3`, `onUse: { reach: 'stone', value: 0.03 }`, `destroyOnEmpty: true`. All fields match interface exactly. PASS
- `create_barrier`: `between: 'self_hex'`, `and: 'adjacent'`, `blocks: 'movement'`, `ticks: 6`. PASS

**Reach values:** `stone` — valid. PASS

**Balance:**
- Stone passive: 0.02 — under 0.15. PASS
- On-use Stone: 0.03 (temporary, per charge). PASS
- lossCondition `'consumable'` signals this item destroys on empty; `destroyOnEmpty: true` is consistent. PASS

**Tier appropriateness (T1):** Single-reach provision with consumable charges. Standard T1 consumable structure. PASS

**Summary vs effects consistency:**
- "+0.02 Stone, 3 charges of +0.03 Stone, creates movement barrier for 6 ticks per use"
- Passive 0.02 Stone matches. 3 charges of 0.03 Stone matches.
- SEMANTIC NOTE: The `create_barrier` is not on the `consumable_charge` — it is a separate always-active (or at least persistent) effect, not "per use." The summary says "per use" which implies the barrier is charge-gated, but the effect structure makes it always active while the item is held.
- **ISSUE (minor):** The mechanical summary implies barrier creation is per-charge, but the create_barrier effect is a standalone persistent effect. This is a prose description mismatch, not a type error. The intent (barrier ward incense creates) is clear. Flagged as a summary clarification needed — not blocking.

**ID uniqueness:** No collision. PASS

**VERDICT: PASS (with caveat: mechanicalSummary should clarify barrier is always-on while held, not per charge)**

---

### Item 7: Book of Sealing
**ID:** `reward_tomes_scrolls_book_of_sealing` | **Type:** artifact | **Tier:** T2

**Effects declared:**
```typescript
{ type: 'passive', reach: 'veil', value: 0.04 }
{ type: 'passive', reach: 'stone', value: 0.03 }
{ type: 'suppress', target: 'aura', scope: { scope: 'hex', target: 'self' }, ticks: 8 }
{ type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'both', ticks: 8 }
```

**Effect count:** 4. T2 guideline is 2–3; this is 4.

**NOTE:** 4 effects at T2 is borderline. The two passives are simple scalars. The core identity is the suppress+barrier combination. Precedent from prior batches (Time-Eaten had 4 at T2). Acceptable for a T2 tome with a strong thematic identity.

**Type validity:**
- Two `passive` effects: valid. PASS
- `suppress`: `target: 'aura'` (valid union member), `scope: { scope: 'hex', target: 'self' }` — matches `{ scope: 'hex'; target: 'self' | 'target' }`. PASS. `ticks: 8`. PASS
- `create_barrier`: `between: 'self_hex'`, `and: 'adjacent'`, `blocks: 'both'`, `ticks: 8`. PASS

**Reach values:** `veil`, `stone` — both valid. PASS

**Balance:**
- Veil: 0.04 — under 0.15. PASS
- Stone: 0.03 — under 0.15. PASS
- Combined: 0.07. PASS

**Tier appropriateness (T2):** Dual-primitive (suppress aura + create barrier) tome. Strong identity. The 4-effect count is borderline but acceptable. PASS

**Editorial fix check:** Mechanical summary no longer includes "in mystical contexts" qualifier. Confirmed: no conditional effect with 'in_mystical' in effects array. PASS

**ID uniqueness:** No collision. PASS

**CAVEAT:** 4 effects at T2 (one over convention). Same precedent-case as prior batches.

**VERDICT: PASS (with note: 4 effects at T2)**

---

### Item 8: Fortune-Kissed
**ID:** `reward_condition_fortune_kissed` | **Type:** trait | **Tier:** T1

**Effects declared:**
```typescript
{ type: 'passive', reach: 'star', value: 0.03 }
{ type: 'reroll', uses: 2 }
```

**Effect count:** 2. PASS

**Type validity:**
- `passive`: `reach: 'star'`, `value: 0.03`. PASS
- `reroll`: `uses: 2`. PASS

**Reach values:** `star` — valid. PASS

**Balance:** Star passive 0.03 — well under 0.15 cap. PASS

**Tier appropriateness (T1):** 2 effects. Textbook T1 blessing. PASS

**Condition fields check (TraitDefinitionProperties):**
- `subcategory: 'condition'` — valid TraitCategory. PASS
- `description`: present. PASS
- `maxLevel: 1` — valid. PASS
- `visibility: 'public'` — valid TraitVisibility. PASS
- `importance: 0` — valid (0.0–1.0). Present but not strictly required by TraitDefinitionProperties (the `as` cast handles it). Matches catalog convention. PASS
- `domainContributions: {}` — valid empty object. PASS
- `flavorText`: present. PASS
- `mechanicalSummary`: present. Not declared in TraitDefinitionProperties but present in all existing catalog condition items via `as TraitDefinitionProperties` cast. Established catalog pattern. PASS
- `tier: 1` — not in TraitDefinitionProperties interface but established catalog pattern for conditions. PASS
- `tags`: present. PASS

**ID uniqueness:** No collision. PASS

**VERDICT: PASS**

---

### Item 9: Null-Touched
**ID:** `reward_condition_null_touched` | **Type:** trait | **Tier:** T2

**Effects declared:**
```typescript
{ type: 'passive', reach: 'shadow', value: 0.05 }
{ type: 'passive', reach: 'star', value: -0.04 }
{ type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 8 }
```

**Effect count:** 3. PASS

**Type validity:**
- Shadow passive: `reach: 'shadow'`, `value: 0.05`. PASS
- Star passive: `reach: 'star'`, `value: -0.04` (penalty). PASS
- `suppress`: `target: 'spell'` (valid), `scope: { scope: 'self' }` (valid EffectScope), `ticks: 8`. All required fields present. PASS

**Reach values:** `shadow`, `star` — both valid. PASS

**Balance:**
- Shadow: 0.05 — under 0.15. PASS
- Star: -0.04 — penalty. Net positive: 0.05 - 0.04 = 0.01. PASS

**Tier appropriateness (T2):** 3 effects: two passives (one penalty) + suppress. Matched to a supernatural condition with anti-magic identity. PASS

**Summary vs effects consistency:**
- "+0.05 Shadow, suppresses spells on self for 8 ticks, -0.04 Star (divine grace cannot reach you either)"
- Effects match exactly. PASS

**Condition fields check:** All present. `visibility: 'discoverable'` — valid TraitVisibility. PASS

**ID uniqueness:** No collision. PASS

**VERDICT: PASS**

---

### Item 10: Warded Ground
**ID:** `reward_condition_warded_ground` | **Type:** trait | **Tier:** T3

**Effects declared:**
```typescript
{ type: 'passive', reach: 'stone', value: 0.06 }
{ type: 'passive', reach: 'eye', value: 0.04 }
{ type: 'create_barrier', between: 'self_hex', and: 'adjacent', blocks: 'both', ticks: 12 }
{ type: 'aura', radius: 1, target: 'allies', reach: 'stone', value: 0.02 }
{ type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.003, limitValue: 0.25 }
```

**Effect count:** 5. One over the T3 convention of 3–4. Same caveat as Items 3 and 5. Acceptable.

**Type validity:**
- Two `passive` effects: valid. PASS
- `create_barrier`: `between: 'self_hex'`, `and: 'adjacent'`, `blocks: 'both'`, `ticks: 12`. PASS
- `aura`: `radius: 1` (≤ AURA_MAX_RADIUS of 2), `target: 'allies'` (valid union member), `reach: 'stone'` (valid), `value: 0.02`. PASS
- `axiological_drift`: `axis: 'mercy_ruthlessness'` (string, valid), `ratePerTick: 0.003`, `limitValue: 0.25`. All three required fields present. PASS

**Reach values:** `stone`, `eye` — both valid. PASS

**Balance:**
- Stone passive: 0.06 — under 0.15. PASS
- Eye passive: 0.04 — under 0.15. PASS
- Stone aura: 0.02 (applied to nearby allies, not the agent's own modifier total). PASS
- Net agent passive: 0.06 + 0.04 = 0.10. PASS

**Tier appropriateness (T3):** The combination of barrier + aura + axiological drift is a distinctive T3 territorial condition. The drift is gentle (0.003/tick toward mercy, capped at 0.25). PASS

**Editorial fix check:** Summary no longer includes "at home territory" qualifier. Confirmed: no `conditional` effect with 'at_home_territory'. The drift axis description corrected to "mercy-ruthlessness axis." Confirmed: `axis: 'mercy_ruthlessness'`. PASS

**Condition fields check:** All present. `visibility: 'public'` — valid. PASS

**ID uniqueness:** No collision. PASS

**CAVEAT:** 5 effects at T3. Within engine hard cap of 6.

**VERDICT: PASS (with note: 5 effects at T3)**

---

## Summary Table

| # | Name | Type | Tier | Effect Count | Type Validity | Reach Validity | Balance | Condition Fields | ID Unique | Verdict |
|---|------|------|------|-------------|--------------|----------------|---------|-----------------|-----------|---------|
| 1 | The Hush Stone | artifact | T1 | 3 | PASS | PASS | PASS | N/A | PASS | PASS |
| 2 | Gambler's Last Copper | artifact | T2 | 3 | PASS | PASS | PASS | N/A | PASS | PASS |
| 3 | Null Circlet | artifact | T3 | 5 | PASS | PASS | PASS | N/A | PASS | PASS (5 effects, note) |
| 4 | Wardwright's Compass | artifact | T2 | 3 | PASS | PASS | PASS | N/A | PASS | PASS |
| 5 | Fatesight Lens | artifact | T3 | 5 | PASS | PASS | PASS | N/A | PASS | PASS (5 effects, note) |
| 6 | Ward Incense | artifact | T1 | 3 | PASS | PASS | PASS | N/A | PASS | PASS (summary note) |
| 7 | Book of Sealing | artifact | T2 | 4 | PASS | PASS | PASS | N/A | PASS | PASS (4 effects, note) |
| 8 | Fortune-Kissed | trait | T1 | 2 | PASS | PASS | PASS | PASS | PASS | PASS |
| 9 | Null-Touched | trait | T2 | 3 | PASS | PASS | PASS | PASS | PASS | PASS |
| 10 | Warded Ground | trait | T3 | 5 | PASS | PASS | PASS | PASS | PASS | PASS (5 effects, note) |

---

## Primitive Engine Status

| Effect Type | In AttachmentEffect union | Executor registered | Resolver registered | Notes |
|-------------|--------------------------|---------------------|---------------------|-------|
| suppress | YES (Type 18b) | YES (pass-through) | YES (returns 0) | Declared; suppression runtime tracked via runtimeState.suppressed |
| reroll | YES (Type 19b) | YES (pass-through) | YES (returns 0) | Declared; no encounter-resolution consumer yet |
| create_barrier | YES (Type 20b) | YES (pass-through) | YES (returns 0) | Declared; no movement/awareness system consumer yet |
| passive | YES (Type 1) | YES (active) | YES (returns value) | Fully wired |
| conditional | YES (Type 6) | YES (active) | YES (returns value) | Fully wired |
| consumable_charge | YES (Type 2) | YES (pass-through) | YES (returns 0) | Charges tracked in runtimeState.chargesRemaining |
| test_shaper | YES (Type 19e) | YES (pass-through) | YES (returns 0) | Returned in testShapers[] from resolveEffectModifiers |
| aura | YES (Type 10) | YES (pass-through) | YES (returns 0) | Aura entries tracked on GameState |
| reveal | YES (Type 16) | YES (pass-through) | YES (returns 0) | Declared; no reveal-range consumer yet |
| axiological_drift | YES (Type 33) | YES (pass-through) | YES (returns 0) | Query-layer effect |

**IMPORTANT NOTE:** The three target primitives (`suppress`, `reroll`, `create_barrier`) are registered in both effectExecutors.ts and effectResolver.ts as pass-throughs — they do not crash the engine but their behavioral effects are not yet fully wired downstream. Specifically:
- `suppress`: Runtime suppression state (`runtimeState.suppressed`) is tracked, and suppressed effects are skipped in effectWalker and effectResolver. The suppress-to-runtime-state pipeline appears partially wired. Full behavioral suppression of the target effects (spell/aura/all_effects) depends on downstream consumers checking this state.
- `reroll`: No downstream encounter-resolution consumer observed. Rerolls are declared but won't function until wired into encounter outcome processing.
- `create_barrier`: No movement or awareness system consumer observed. Barriers are declared but won't block movement or awareness until wired into those systems.

This is the same partial-implementation status as haste/slow/freeze_duration in the prior batch. **Not a blocker for authoring** — the engine won't crash and the items will attach correctly. The behavioral gaps are pre-existing engine work items.

---

## Issues Found

### Blocking Issues
None.

### Caveats (non-blocking)

1. **Effect count above T3 convention (Items 3, 5, 10):** Three T3 items carry 5 effects (convention is 3–4). All are within the engine hard cap of 6. Each has 2–3 simple passive effects as part of the count. Consistent with precedent from the time-manipulation batch (Hourglass). No change required.

2. **Effect count above T2 convention (Item 7):** Book of Sealing has 4 effects (convention is 2–3). Within engine hard cap. Justified by the dual-primitive identity. No change required.

3. **Ward Incense mechanical summary imprecision (Item 6):** The summary says "creates movement barrier for 6 ticks per use" but the `create_barrier` effect is a standalone always-active effect, not charge-gated. The barrier fires separately from the consumable charges. Recommend updating the summary to: "+0.02 Stone, 3 charges of +0.03 Stone burst, creates movement barrier on adjacent hexes for 6 ticks (always-on while held)" — but this is a prose note, not a type error. Implementation will work correctly as authored.

4. **Gambler's Last Copper — "near-miss" vs "failures" (Item 2):** The summary says "upgrades near-miss failures." The trigger is specifically `near_miss`, which is a distinct outcome category. Minor imprecision in prose, no mechanical impact.

5. **Three target primitives partially implemented:** suppress, reroll, create_barrier are all pass-throughs with no full downstream wiring. Pre-existing engine state. Not introduced by this batch. Items will attach without errors but full behavior depends on future engine work.

6. **Condition items include `importance` and `domainContributions`:** The draft includes these fields on all three condition traits. These fields are declared in `TraitDefinitionProperties` (`importance: number` and `domainContributions: DomainContributions` are both in the interface). However, existing catalog condition items omit them (relying on the `as` cast). Including them is more correct, not less. PASS — this is an improvement over existing catalog convention.

---

## Overall Verdict

**READY WITH CAVEATS**

All 10 items pass type validity, reach validity, balance, and ID uniqueness checks. No blocking issues. Caveats are non-blocking and either (a) match established precedent from prior batches, (b) are pre-existing engine implementation gaps, or (c) are minor prose imprecision in mechanical summaries that don't affect engine behavior.

The batch is ready for implementation in `src/data/reward-attachment-catalog.ts`.
