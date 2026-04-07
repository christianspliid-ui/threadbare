# Attachment Pipeline: Systems Audit
> Slug: upgrade-arms-vest-t1t4 | Pass: systems | Mode: upgrade
> Auditor: Systems Audit Agent | Date: 2026-04-06

## Reference Constants

| Constant | Value | Source |
|----------|-------|--------|
| EFFECT_PER_ITEM_CAP | 0.15 | effect-constants.ts |
| EFFECT_MODIFIER_CAP | 0.30 | effect-constants.ts |
| MAX_EFFECTS_PER_ATTACHMENT | 6 | effect-constants.ts |
| COOLDOWN_MINIMUM_TICKS | 5 | effect-constants.ts (applies to CooldownEffect.cooldownTicks) |
| T1 norm | 1–2 effects | systems prompt |
| T2 norm | 1–2 effects | systems prompt |
| T3 norm | 2–3 effects | systems prompt |
| T4 norm | 3–4 effects | systems prompt |

## Valid Primitives Confirmed

All effect discriminants used in this batch are present in `src/types/effects.ts`:
`passive`, `conditional`, `cooldown`, `decay`, `until_event`, `reactive`, `duration` (nested),
`range_modifier` (nested), `trait_grant`, `behavior_weight`, `tag_immunity`.

Valid `ReactiveTrigger` values used: `damaged`, `attacked`, `entered_hex` — all in the `ReactiveTrigger` union.
Valid `ExpiryEvent` used: `leave_combat` — present in `ExpiryEvent` union.
Valid `EffectCondition` used: `in_social`, `in_mystical` — both in `EffectCondition` union.
Valid `ReachDomain` values used: `iron`, `shadow`, `gold`, `star`, `veil`, `heart` — all in `ReachDomain` union.

---

## Per-Item Audit

---

### 1. Hollowfang (`reward_arms_hollowfang`) — T3 Arms

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive×2, reactive, trait_grant — all valid. Nested DecayEffect inside ReactiveEffect.effect is valid (AttachmentEffect union). |
| Reach values | PASS | Max 0.12 Iron passive. Reactive burst is 0.05 decaying to 0.00, each tick value ≤ 0.15. Net negative Head of -0.05 is a penalty, not a bonus. |
| Predicate validity | PASS | No predicates used. |
| Tier appropriateness | CAVEAT | 4 effects at T3 (norm: 2–3). Two passives (iron/heart) reflect the legacy dual-reach pattern; trait_grant + reactive add flavor. Under the MAX_EFFECTS_PER_ATTACHMENT=6 hard cap. Flagging but not failing: the dual-passive conversion is mandated by the upgrade pipeline, and editorial approved the trait_grant. |
| Cooldown/duration sanity | PASS | Reactive cooldown=12. Decay: 0.05 → 0.00 at -0.01/tick = 5 ticks at trigger. Within 3–30 range. |
| Stacking sanity | N/A | No stacking effect. |
| Decay sanity | PASS | Item is cursed (permanent until event) so decay sanity (10–50 tick item lifespan) does not apply here. Nested decay effect lifespan = 5 ticks, which is the burst duration — by design. |
| Loss condition | PASS | `cursed` — correct for a cursed hunger-blade. |
| On-use triggers | N/A | None. |

**FIX:** None required.

**Verdict: PASS with caveat (4 effects at T3 norm 2–3).**

---

### 2. Starfall Longbow (`reward_arms_starfall_longbow`) — T3 Arms

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive×2, cooldown — all valid CooldownEffect fields correct. |
| Reach values | PASS | passive iron=0.10, passive star=0.05 (total 0.15), cooldown star=0.03. No single passive exceeds 0.15. Cooldown active contribution is 0.03, well within cap. |
| Predicate validity | PASS | No predicates used. |
| Tier appropriateness | PASS | 3 effects at T3 (norm: 2–3). Fits cleanly. |
| Cooldown/duration sanity | PASS | activeTicks=6, cooldownTicks=12. cooldownTicks=12 ≥ COOLDOWN_MINIMUM_TICKS=5. Active:dormant ratio 1:2 — reasonable cycling. |
| Stacking sanity | N/A | No stacking effect. |
| Decay sanity | N/A | No decay effect. |
| Loss condition | PASS | `permanent` — correct for a rare T3 magical weapon. |
| On-use triggers | N/A | None. |

**Verdict: PASS.**

---

### 3. The Quiet Blade (`reward_arms_the_quiet_blade`) — T4 Arms

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

**Legacy overrun flag (expected per brief):** Original reachBonus iron=0.18, shadow=0.08 total 0.26 exceeds EFFECT_PER_ITEM_CAP=0.15. Preserved as two passive entries per pipeline rule. Non-passive effects are utility-only.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive×2, until_event, reactive (with nested range_modifier), tag_immunity — all valid. `until_event` field `destroyOnEvent: false` is correct type (boolean). `range_modifier` as nested in reactive effect is valid: ReactiveEffect.effect accepts any AttachmentEffect. |
| Reach values | FLAG (legacy, expected) | Passive total 0.26 exceeds 0.15 cap. Preserved per "sacred legacy values" rule. until_event adds +0.02 Shadow — small. No additional reach in reactive or tag_immunity. Total max 0.28. |
| Predicate validity | PASS | No predicates on conditionals (none used). |
| Tier appropriateness | CAVEAT | 5 effects at T4 (norm: 3–4). Two passives are the converted legacy reachBonus. Until_event + reactive + tag_immunity = 3 mechanically distinct effects. Functionally this is 3 new effects on a T4 legendary — defensible for the tier. Under MAX_EFFECTS_PER_ATTACHMENT=6. |
| Cooldown/duration sanity | PASS | Reactive cooldown=12, duration=6 ticks (within 3–30). ratio 1:2 — fine. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | No decay. |
| Loss condition | PASS | `permanent` — correct for a T4 legendary item. |
| On-use triggers | N/A | None. |

**FIX:** None required. Legacy overrun flagged; not a FAIL per audit brief.

**Verdict: PASS with caveat (5 effects at T4 norm 3–4; legacy reach overrun flagged).**

---

### 4. Padded Jerkin (`reward_vestments_padded_jerkin`) — T1 Vestments

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive, tag_immunity — both valid. `tags: ['bruise']` is a string array on TagImmunityEffect — correct. |
| Reach values | PASS | 0.03 Iron passive — well within cap. No conditional bonus. |
| Predicate validity | PASS | No predicates used. |
| Tier appropriateness | PASS | 2 effects at T1 (norm: 1–2). Fits. Existing catalog T1 items (Bronze Spear, Bone Knife) also use 2 effects. |
| Cooldown/duration sanity | PASS | No time-based effects. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | No decay. |
| Loss condition | PASS | `breakable` — correct for padded cloth armor. |
| On-use triggers | N/A | None. |

**Verdict: PASS.**

---

### 5. Merchant Silks (`reward_vestments_merchant_silks`) — T1 Vestments

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive, conditional — both valid. `condition: 'in_social'` is a valid EffectCondition. |
| Reach values | PASS | 0.04 passive + 0.02 conditional = 0.06 max Gold. Both within 0.15 cap. |
| Predicate validity | PASS | `in_social` is in EffectCondition union. |
| Tier appropriateness | PASS | 2 effects at T1 (norm: 1–2). Fits. |
| Cooldown/duration sanity | PASS | No time-based effects. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | No decay. |
| Loss condition | PASS | `stealable` — correct for valuable cloth worn in social contexts. |
| On-use triggers | N/A | None. |

**Verdict: PASS.**

---

### 6. Chainmail Hauberk (`reward_vestments_chainmail_hauberk`) — T2 Vestments

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive, reactive (with nested DurationEffect) — both valid. `destroyOnExpiry: true` on nested duration destroys the *buff instance*, not the item — correct usage. |
| Reach values | PASS | 0.08 passive + 0.03 reactive burst = 0.11 max Iron. Both within 0.15 cap. |
| Predicate validity | PASS | No predicates. |
| Tier appropriateness | PASS | 2 effects at T2 (norm: 1–2). Fits. |
| Cooldown/duration sanity | PASS | Reactive cooldown=8 (≥5), duration=4 ticks (within 3–30). Ratio 1:2 active:cooldown — fine. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | No decay on item (item is breakable). |
| Loss condition | PASS | `breakable` — correct for metal armor. |
| On-use triggers | N/A | None. |

**Verdict: PASS.**

---

### 7. Shadowweave Cloak (`reward_vestments_shadowweave_cloak`) — T2 Vestments

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive, range_modifier, tag_immunity — all valid. `awarenessRangeBonus: 1` on RangeModifierEffect is integer, correct. `tags: ['tracked', 'marked']` string array on TagImmunityEffect — correct. |
| Reach values | PASS | 0.07 Shadow passive. range_modifier and tag_immunity are utility, no reach contribution. |
| Predicate validity | PASS | No predicates. |
| Tier appropriateness | FIX | 3 effects at T2 (norm: 1–2). Exceeds T2 norm by 1. However: passive is the base reach conversion; range_modifier and tag_immunity are both utility (zero reach contribution). This is a lightweight 3-effect item — all three effects are simple, none complex. Recommended fix: consolidate tag_immunity into a single effect with both tags (already done — `['tracked', 'marked']` is one TagImmunityEffect), and accept 3 effects as a modest T2 overdesign. **Soft fix: acceptable as-is given utility-only over-count, but flag for editorial if item count needs trimming.** |
| Cooldown/duration sanity | PASS | No time-based effects. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | No decay. |
| Loss condition | PASS | `stealable` — correct for infiltrator's cloak. |
| On-use triggers | N/A | None. |

**FIX:** Minor — 3 effects at T2 norm of 1–2. No structural issue; utility effects are lightweight. Accepted as-is with caveat.

**Verdict: PASS with caveat (3 effects at T2 norm 1–2; all are utility — no reach overrun).**

---

### 8. Mantle of the Unremembered (`reward_vestments_mantle_of_the_unremembered`) — T3 Vestments

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive×2, reactive (with nested DecayEffect), behavior_weight — all valid. BehaviorWeightEffect `reach: 'shadow', multiplier: 1.5` — correct fields. |
| Reach values | PASS | 0.12 Shadow passive + 0.04 max reactive burst (decays to 0) - 0.06 Heart = 0.10 net max positive. No single passive exceeds 0.15. |
| Predicate validity | PASS | No predicates on behavior_weight (optional field, omitted). |
| Tier appropriateness | CAVEAT | 4 effects at T3 (norm: 2–3). Same dual-passive pattern as Hollowfang (converted from legacy reachBonus with penalty). behavior_weight + reactive = 2 mechanically distinct new effects. Consistent with other T3 cursed items in this batch. Under MAX_EFFECTS_PER_ATTACHMENT=6. |
| Cooldown/duration sanity | PASS | Reactive cooldown=8. Decay: 0.04 → 0.00 at -0.01/tick = 4 ticks at trigger. Within 3–30 range. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | Item is cursed — permanent until removed. Nested decay lifespan = 4 ticks; by design (burst fades). |
| Loss condition | PASS | `cursed` — correct for a cursed garment of oblivion. |
| On-use triggers | N/A | None. |

**Verdict: PASS with caveat (4 effects at T3 norm 2–3; dual-passive from legacy conversion).**

---

### 9. The Woven Sky (`reward_vestments_the_woven_sky`) — T4 Vestments

**ID check:** Exists in `reward-attachment-catalog.ts` (upgrade, not new). No conflict.

**Legacy overrun flag (expected per brief):** Original reachBonus star=0.15, veil=0.08 total 0.23 exceeds EFFECT_PER_ITEM_CAP=0.15. Preserved as two passive entries per pipeline rule.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | passive×2, conditional, reactive (with nested DurationEffect), tag_immunity — all valid. `condition: 'in_mystical'` is a valid EffectCondition. |
| Reach values | FLAG (legacy, expected) | Passive total 0.23 exceeds 0.15 cap. Preserved per pipeline rule. Conditional adds +0.03 Star, reactive adds +0.04 Veil burst. Max total 0.30 — at EFFECT_MODIFIER_CAP. |
| Predicate validity | PASS | `in_mystical` is in EffectCondition union. |
| Tier appropriateness | CAVEAT | 5 effects at T4 (norm: 3–4). Two passives are converted legacy reachBonus. Conditional + reactive + tag_immunity = 3 new effects. Consistent with Quiet Blade treatment. Defensible for T4 legendary. Under MAX_EFFECTS_PER_ATTACHMENT=6. |
| Cooldown/duration sanity | PASS | Reactive cooldown=12, duration=6 ticks (within 3–30). Ratio 1:2 — fine. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | No decay. |
| Loss condition | PASS | `permanent` — correct for a T4 legendary divine vestment. |
| On-use triggers | N/A | None. |

**FIX:** None required. Legacy overrun flagged; not a FAIL per audit brief.

**Verdict: PASS with caveat (5 effects at T4 norm 3–4; legacy reach overrun flagged).**

---

### 10. Traveler's Cloak (`starter_traveler_cloak`) — T1 Vestments

**ID check:** `starter_traveler_cloak` exists in `src/data/starter-attachments.ts` (upgrade of starter item, not in reward catalog). No conflict within reward catalog. The ID is correct for a starter item.

| Check | Result | Notes |
|-------|--------|-------|
| Type validity | PASS | range_modifier, tag_immunity — both valid. `movementCostMultiplier: 0.9` on RangeModifierEffect is a number — correct. `tags: ['cold', 'frostbite']` string array on TagImmunityEffect — correct. |
| Reach values | PASS | No reach contribution (pure utility). Appropriate for a practical T1 travel item with no previous reachBonus. |
| Predicate validity | PASS | No predicates. |
| Tier appropriateness | PASS | 2 effects at T1 (norm: 1–2). Fits. Both are utility effects with no reach contribution. |
| Cooldown/duration sanity | PASS | No time-based effects. |
| Stacking sanity | N/A | No stacking. |
| Decay sanity | N/A | No decay. |
| Loss condition | PASS | `breakable` — correct for a practical travel cloak. |
| On-use triggers | N/A | None. |

**Verdict: PASS.**

---

## Summary Table

| # | Name | Tier | Effect Count | Norm | Verdict | Notes |
|---|------|------|-------------|------|---------|-------|
| 1 | Hollowfang | T3 | 4 | 2–3 | PASS (caveat) | +1 over norm, dual-passive from legacy conversion |
| 2 | Starfall Longbow | T3 | 3 | 2–3 | PASS | Clean |
| 3 | The Quiet Blade | T4 | 5 | 3–4 | PASS (caveat) | +1 over norm, legacy reach overrun flagged |
| 4 | Padded Jerkin | T1 | 2 | 1–2 | PASS | Clean |
| 5 | Merchant Silks | T1 | 2 | 1–2 | PASS | Clean |
| 6 | Chainmail Hauberk | T2 | 2 | 1–2 | PASS | Clean |
| 7 | Shadowweave Cloak | T2 | 3 | 1–2 | PASS (caveat) | +1 over norm, all utility effects |
| 8 | Mantle of the Unremembered | T3 | 4 | 2–3 | PASS (caveat) | +1 over norm, dual-passive from legacy conversion |
| 9 | The Woven Sky | T4 | 5 | 3–4 | PASS (caveat) | +1 over norm, legacy reach overrun flagged |
| 10 | Traveler's Cloak | T1 | 2 | 1–2 | PASS | Clean |

## Caveats Requiring Implementation Awareness

1. **Dual-passive pattern at T3 (Hollowfang, Mantle):** The dual passive from legacy two-reach conversions consistently produces 4 effects at T3. This is a structural artifact of the upgrade pipeline; implementors should be aware that these items are intentionally slightly denser than fresh T3 designs.

2. **T4 legacy reach overrun (The Quiet Blade, The Woven Sky):** These items' passive reach values exceed EFFECT_PER_ITEM_CAP=0.15. This is a pre-existing data state, not introduced by this upgrade. The engine's `EFFECT_MODIFIER_CAP=0.30` will catch any combined overruns. No implementation change needed; the items will function within global caps.

3. **ReactiveEffect.duration field:** On items 3 and 6, `ReactiveEffect` uses a `duration` field (not `cooldown`). The `duration` field is typed as `number | undefined` on `ReactiveEffect` in effects.ts — this is read by the engine as how long the reactive buff persists before reverting (distinct from `cooldown`). For Chainmail Hauberk and The Quiet Blade, `duration` on the outer ReactiveEffect is superfluous because the inner effect is a `DurationEffect` or `RangeModifierEffect` with its own duration semantics. The outer `duration` field should be **removed** from items 3 and 6 — the inner effect's `ticks` / behavior governs lifespan.

   **FIX for item 3 (The Quiet Blade):** Remove `duration: 6` from the outer ReactiveEffect — the inner `range_modifier` has no intrinsic duration, so this is the correct place to specify it. **Correction: the `range_modifier` nested inside has no `ticks` field itself, so the outer `duration: 6` IS needed to tell the engine how long the movement buff lasts.** This is a valid use of `ReactiveEffect.duration`. No fix needed.

   **Revised assessment:** `ReactiveEffect.duration` = how long the triggered sub-effect persists. For Chainmail Hauberk, the inner DurationEffect already has `ticks: 4` — the outer `duration` field is not set, so no conflict. For Quiet Blade, outer `duration: 6` governs how long the `range_modifier` (which has no `ticks`) persists. This is the correct pattern. No fix needed.

4. **Shadowweave Cloak effect count at T2:** 3 effects at T2 norm of 1–2. Recommend editorial review if the catalog target is strict T2 compliance — reducing to 2 effects would mean dropping either `range_modifier` or `tag_immunity`. Given both are utility-only (zero reach), the item is not overpowered; it is just slightly over-designed.

## Verdict

**READY WITH CAVEATS**

All 10 items pass structural validity checks. No items use invalid discriminants, out-of-range values, or unsupported predicates. The caveats are:
- Effect count slightly over tier norms on 5 items (structural artifact of dual-passive conversion + utility-heavy vestments)
- Legacy reach overrun on T4 items (pre-existing, flagged per brief, not a blocker)
- No items require exclusion
