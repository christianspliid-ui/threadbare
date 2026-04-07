# Editorial Review: upgrade-arms-t1t2
> Reviewer: Editorial Agent | Date: 2026-04-06
> Mode: upgrade (names, flavor, tags preserved from originals)

## Verdict: PASS WITH REVISIONS

Minor mechanical summary and tag issues found. Names and flavor text are excellent originals -- no changes needed there. Primitive variety is outstanding for an 8-item batch.

---

## Per-Item Review

### 1. Bronze Spear

- **Name Quality:** PASS. Specific, material-grounded, no fantasy inflation. Preserved from original.
- **Flavor Text:** PASS. "Pitted and green with age, but the point still bites." -- Threadbare-perfect. Wear, age, pragmatic menace.
- **Tags:** PASS. `#iron #weapon #melee #combat` -- correct for a melee combat weapon.
- **Mechanical Summary:** PASS. "+0.03 Iron, +0.02 Iron in combat" -- accurately describes passive + conditional(in_combat).
- **ID Convention:** PASS. `reward_arms_bronze_spear` matches `reward_<subcategory>_<snake_case>`.

### 2. Hunting Bow

- **Name Quality:** PASS. Functional, unpretentious. Preserved.
- **Flavor Text:** PASS. "Sinew-strung and warped from damp, but deadly enough at close range." -- material texture, honest limitation. Good.
- **Tags:** PASS. `#iron #weapon #ranged #combat` -- correct for a ranged combat weapon.
- **Mechanical Summary:** REVISION. States "+0.04 Iron, +0.01 Iron per combat success (max +0.03)" -- this is accurate to the effects array. However, it omits that stacks decay at 1/tick (`decayPerTick: 1`). The decay is mechanically significant for distinguishing this from other stacking items. Revised to mention decay.
- **ID Convention:** PASS. `reward_arms_hunting_bow`.

### 3. Rusted Mace

- **Name Quality:** PASS. The "Rusted" is earned by the flavor text. Preserved.
- **Flavor Text:** PASS. "The rust is mostly cosmetic. Mostly." -- dry, understated humor with menace. Perfect Threadbare tone.
- **Tags:** PASS. `#iron #weapon #melee #combat`.
- **Mechanical Summary:** PASS. "+0.04 Iron, +0.02 Iron / -0.01 Heart (blunt instrument)" -- accurately describes passive + tradeoff. The parenthetical gives flavor context for the Heart penalty.
- **ID Convention:** PASS. `reward_arms_rusted_mace`.

### 4. Bone Knife

- **Name Quality:** PASS. Stark, evocative of desperation. Preserved.
- **Flavor Text:** PASS. "Carved from the rib of something large. It will not last." -- origin story and mortality in two sentences. Excellent.
- **Tags:** REVISION. `#iron #weapon #melee #survival #combat #wilderness` -- six tags is excessive for a T1 item. The original catalog entry has these same tags so they are preserved, but this is a note for future batches: tag proliferation dilutes matching. No change applied since these match the original.
- **Mechanical Summary:** PASS. "+0.03 Iron, 3 charges of +0.04 Iron burst (desperate strikes)" -- accurately describes passive + consumable_charge with destroyOnEmpty.
- **ID Convention:** PASS. `reward_arms_bone_knife`.

### 5. Iron Blade (Starter)

- **Name Quality:** PASS. "Iron Blade" is deliberately plain -- it is the starter weapon, the baseline. Preserved.
- **Flavor Text:** PASS. "A well-worn blade of folded steel, simple and reliable." -- unpretentious, establishes normalcy. Preserved.
- **Tags:** PASS. `#iron #weapon #melee` -- no `#combat` tag, matching the original starter entry (starters have leaner tags).
- **Mechanical Summary:** REVISION. States "+0.05 Iron, rescues near-miss combat rolls (+1 step)". The effects array has `value: 0.05` passive and a test_shaper with `steps: 1, maxMargin: 1`. The summary says "rescues near-miss combat rolls" which is accurate for `trigger: 'near_miss'`, but should clarify the margin constraint. Also note: the existing catalog entry has `mechanicalSummary: '+0.10 Iron reach'` with `reachBonus: { iron: 0.05 }` -- that is a pre-existing data quality bug in the original (summary says 0.10, actual value is 0.05). The draft correctly uses 0.05 for the passive effect. Revised summary to clarify margin.
- **ID Convention:** PASS. `starter_iron_blade` -- correct starter prefix.
- **Note:** The draft correctly preserves the existing `onUseTriggers` (critical_failure breakage). Good.

### 6. Blackiron Blade

- **Name Quality:** PASS. "Blackiron" -- compound material name with ominous overtone. Preserved.
- **Flavor Text:** PASS. "Forged in a dead forge-town. The metal remembers heat it should not." -- haunted metallurgy, restrained supernatural. Excellent Threadbare.
- **Tags:** PASS. `#iron #weapon #melee #combat`.
- **Mechanical Summary:** REVISION. States "+0.08 Iron, +0.01 Iron per combat success (max +0.04, decays between fights)". The effects array has `decayPerTick: 1`, which means it decays every tick, not just "between fights". "Decays between fights" implies it only resets on combat exit, which is not what `decayPerTick: 1` does. Revised to "decays 1 stack/tick".
- **ID Convention:** PASS. `reward_arms_blackiron_blade`.

### 7. Crossbow of the Watch

- **Name Quality:** PASS. Institutional provenance, specific organization. "of the Watch" grounds it in a world. Preserved.
- **Flavor Text:** PASS. "Issued to border watchers. The sighting marks are worn smooth by anxious thumbs." -- institutional origin, physical detail, emotional undertone (anxiety). Excellent.
- **Tags:** PASS. `#iron #weapon #ranged #eye #combat` -- dual-reach tags correctly reflect the dual passive effects.
- **Mechanical Summary:** PASS. "+0.07 Iron, +0.03 Eye, +1 awareness range (watchman's vigil)" -- accurately describes 2x passive + range_modifier.
- **ID Convention:** PASS. `reward_arms_crossbow_of_the_watch`.

### 8. Thornwood Staff

- **Name Quality:** PASS. Material + form, hints at living nature. Preserved.
- **Flavor Text:** PASS. "The wood is alive. It sprouts small leaves in spring, thorns in winter." -- seasonal detail, understated supernatural. Good.
- **Tags:** PASS. `#iron #weapon #melee #stone #combat` -- dual-reach tags correctly reflect iron + stone passives.
- **Mechanical Summary:** REVISION. States "+0.06 Iron, +0.03 Stone, thorns emerge when attacked (+0.03 Iron for 6 ticks)". The effects array has a reactive with `cooldown: 12` and the inner duration effect has `destroyOnExpiry: true`. The summary omits the 12-tick cooldown, which is important for understanding uptime. Revised to include cooldown.
- **ID Convention:** PASS. `reward_arms_thornwood_staff`.

---

## Batch-Level Checks

### Variety Assessment

- **Reach diversity:** Primary reach is Iron for all 8 items (expected -- these are arms). Secondary reaches appear on 3 items: Eye (Crossbow), Stone (Thornwood Staff), Heart penalty (Rusted Mace). Acceptable for an arms-subcategory batch.
- **Tier spread:** 5 T1 + 3 T2. Reasonable. No T3/T4 in scope (those are a separate batch).
- **Primitive variety:** EXCELLENT. Six distinct non-passive primitives across 8 items:
  - conditional (1): Bronze Spear
  - stacking (2): Hunting Bow (T1, fast decay), Blackiron Blade (T2, higher cap)
  - tradeoff (1): Rusted Mace
  - consumable_charge (1): Bone Knife
  - test_shaper (1): Iron Blade
  - range_modifier (1): Crossbow of the Watch
  - reactive wrapping duration (1): Thornwood Staff

  The two stacking items have meaningfully different tuning (3 vs 4 max stacks, both decay at 1/tick). This is good variety.
- **Loss condition variety:** breakable (5), consumable (1), stealable (1), cursed (0), permanent (0). The stealable on Crossbow is a nice touch -- military-issue equipment gets stolen.

### Data Quality Issues Found

1. **Mechanical summary accuracy:** 4 items needed minor summary revisions to match effects[] precisely (Hunting Bow, Iron Blade, Blackiron Blade, Thornwood Staff). All were minor omissions of decay/cooldown details, not structural mismatches.
2. **Pre-existing bug noted:** Iron Blade original has `mechanicalSummary: '+0.10 Iron reach'` with `reachBonus: { iron: 0.05 }`. The draft correctly uses 0.05 for the passive value.

### Automatic REVISE Triggers -- None Hit

1. Generic fantasy names? No -- all names are specific and grounded.
2. Exclamatory or epic-scale flavor text? No -- all flavor text is Threadbare-compliant.
3. All items on same reach? All are Iron-primary, but that is correct for an arms batch. Secondary reach diversity exists.
4. Mechanical summary doesn't match effects[]? Minor inaccuracies found and corrected in revised file. None were structurally wrong.

---

## Summary of Revisions Applied

| # | Item | Issue | Revision |
|---|------|-------|----------|
| 2 | Hunting Bow | mechanicalSummary omits decay rate | Added "decays 1/tick" |
| 5 | Iron Blade | mechanicalSummary unclear on margin constraint | Added "(within 1 margin)" |
| 6 | Blackiron Blade | mechanicalSummary says "decays between fights" | Changed to "decays 1 stack/tick" |
| 8 | Thornwood Staff | mechanicalSummary omits 12-tick cooldown | Added "12-tick cooldown" |
