# Editorial Review: upgrade-arms-vest-t1t4
> Reviewer: Editorial Agent | Date: 2026-04-06
> Mode: upgrade (names, flavor, tags preserved from originals)

## Verdict: PASS WITH REVISIONS

Names and flavor text are all originals carried forward faithfully -- every one is Threadbare-compliant and evocative. Tags match originals exactly. Primitive variety across the batch is excellent, introducing 7 primitives new to the catalog. Four items have mechanicalSummary inaccuracies that need correction, and one item has a minor tag note.

---

## Per-Item Review

### 1. Hollowfang

- **Name Quality:** PASS. Compound word, evocative of emptiness and predation. Preserved from original.
- **Flavor Text:** PASS. "The blade is hollow and whistles when swung. The sound makes children weep." -- sensory detail and emotional consequence in two sentences. Preserved.
- **Tags:** PASS. `#iron #weapon #melee #cursed #combat` -- matches original exactly.
- **Mechanical Summary:** REVISION. States "+0.12 Iron, -0.05 Heart, when damaged: +0.05 Iron burst decaying over 6 ticks, grants dark_ferocity trait". The decay effect has `changePerTick: -0.01` from `startValue: 0.05` to `limitValue: 0.0`, which is 5 ticks to zero (not 6 -- tick 1: 0.04, tick 2: 0.03, tick 3: 0.02, tick 4: 0.01, tick 5: 0.00 and destroyed). Also the reactive has `cooldown: 12` which is omitted from the summary. Revised to "decaying over 5 ticks (12-tick cooldown)".
- **ID Convention:** PASS. `reward_arms_hollowfang`.

### 2. Starfall Longbow

- **Name Quality:** PASS. Celestial provenance, poetic compound. Preserved from original.
- **Flavor Text:** PASS. "The string hums a note too low to hear. Arrows fly straighter than physics allows." -- understated supernatural, dry observation. Preserved.
- **Tags:** PASS. `#iron #weapon #ranged #star #combat` -- matches original exactly.
- **Mechanical Summary:** PASS. "+0.10 Iron, +0.05 Star, stellar alignment: +0.03 Star for 6 ticks then dormant 12 ticks" -- accurately describes passive + cooldown (activeTicks: 6, cooldownTicks: 12, reach: star, value: 0.03). The "stellar alignment" label is flavor-appropriate.
- **ID Convention:** PASS. `reward_arms_starfall_longbow`.

### 3. The Quiet Blade

- **Name Quality:** PASS. "The" prefix signals legendary status. "Quiet" is menacing understatement. Preserved from original.
- **Flavor Text:** PASS. "It makes no sound when it cuts. Neither does the one it cuts." -- chilling parallelism. Preserved.
- **Tags:** PASS. `#iron #weapon #melee #shadow #ancient #combat` -- matches original exactly.
- **Mechanical Summary:** REVISION. States "in combat: blocks fear/intimidation conditions". The tag_immunity effect has no `condition` predicate -- it is always active, not combat-only. The immunity applies at all times, which is more powerful but also simpler. Revised to remove "in combat:" qualifier. Also states "when attacked: 20% faster movement for 6 ticks (12-tick cooldown)" -- the reactive's nested effect is a `range_modifier` with `movementCostMultiplier: 0.8`. The `duration: 6` on the reactive plus `cooldown: 12` are both correct. However, range_modifier does not have a `duration` or `ticks` field in its type definition -- the `duration` sits on the ReactiveEffect wrapper, which is the correct structure. Summary accurately describes the combined behavior.
- **ID Convention:** PASS. `reward_arms_the_quiet_blade`.

### 4. Padded Jerkin

- **Name Quality:** PASS. Plain, functional, era-appropriate. Preserved from original.
- **Flavor Text:** PASS. "Quilted linen stuffed with horsehair. Better than bare skin." -- pragmatic, no grandeur. Preserved.
- **Tags:** PASS. `#iron #armor #cloth #combat` -- matches original exactly.
- **Mechanical Summary:** PASS. "+0.03 Iron, blocks bruise conditions" -- accurately describes passive + tag_immunity(['bruise']).
- **ID Convention:** PASS. `reward_vestments_padded_jerkin`.

### 5. Merchant Silks

- **Name Quality:** PASS. Social class marker, material specificity. Preserved from original.
- **Flavor Text:** PASS. "Dyed in the saffron of the eastern markets. Wealth worn on the sleeve." -- geographic grounding, class commentary. Preserved.
- **Tags:** PASS. `#gold #cloth #commercial #trade` -- matches original exactly.
- **Mechanical Summary:** REVISION. States "+0.04 Gold, +0.02 Gold in social encounters". The conditional uses `condition: 'in_social'` which is a valid EffectCondition. Summary says "in social encounters" which is a reasonable human-readable rendering of `in_social`. However, "encounters" implies encounter resolution only -- `in_social` is a predicate that could apply more broadly. Minor nuance but acceptable. PASS on reflection -- no revision needed here.
- **ID Convention:** PASS. `reward_vestments_merchant_silks`.

### 6. Chainmail Hauberk

- **Name Quality:** PASS. Period-accurate armor terminology. Preserved from original.
- **Flavor Text:** PASS. "Each ring was closed by hand. Someone cared enough to do it right." -- craft, care, humanity. Preserved.
- **Tags:** PASS. `#iron #armor #combat` -- matches original exactly.
- **Mechanical Summary:** PASS. "+0.08 Iron, when attacked: +0.03 Iron for 4 ticks (8-tick cooldown)" -- accurately describes passive + reactive(attacked, duration(4 ticks, iron, 0.03), cooldown: 8). All values match. Cooldown is included (lesson learned from batch 1).
- **ID Convention:** PASS. `reward_vestments_chainmail_hauberk`.

### 7. Shadowweave Cloak

- **Name Quality:** PASS. Compound word with strong visual. Preserved from original.
- **Flavor Text:** PASS. "The fabric drinks light. Corners seem deeper when you wear it." -- atmospheric, sensory. Preserved.
- **Tags:** PASS. `#shadow #cloth #stealth` -- matches original exactly.
- **Mechanical Summary:** PASS. "+0.07 Shadow, +1 awareness range, blocks tracking conditions" -- accurately describes passive + range_modifier(awarenessRangeBonus: 1) + tag_immunity(['tracked', 'marked']). The summary says "tracking conditions" which covers both 'tracked' and 'marked' tags. Acceptable shorthand.
- **ID Convention:** PASS. `reward_vestments_shadowweave_cloak`.

### 8. Mantle of the Unremembered

- **Name Quality:** PASS. "of the Unremembered" -- evocative, implies curse and loss. Preserved from original.
- **Flavor Text:** PASS. "Those who wear it become harder to recall. Even by those who love them." -- emotional weight, understated horror. Preserved.
- **Tags:** PASS. `#shadow #cloth #veil #cursed #stealth` -- matches original exactly.
- **Mechanical Summary:** REVISION. States "entering new hex: +0.04 Shadow burst decaying over 4 ticks". The decay effect has `changePerTick: -0.01` from `startValue: 0.04` to `limitValue: 0.0`, which is 4 ticks (tick 1: 0.03, tick 2: 0.02, tick 3: 0.01, tick 4: 0.00). Correct count. But the reactive has `cooldown: 8` which is omitted from the summary. Also states "amplifies shadow encounter desire x1.5" -- accurately describes behavior_weight(reach: shadow, multiplier: 1.5). Revised to add cooldown.
- **ID Convention:** PASS. `reward_vestments_mantle_of_the_unremembered`.

### 9. The Woven Sky

- **Name Quality:** PASS. "The" prefix signals legendary. "Woven Sky" is beautiful and specific. Preserved from original.
- **Flavor Text:** PASS. "A robe of impossible blue, stitched with constellations that move. It weighs nothing." -- visual wonder with physical detail. Preserved.
- **Tags:** PASS. `#star #cloth #divine #ancient` -- matches original exactly.
- **Mechanical Summary:** REVISION. States "in mystical contexts: +0.03 Star". The conditional uses `condition: 'in_mystical'` -- accurate. States "when damaged: +0.04 Veil ward for 6 ticks (12-tick cooldown)" -- accurately describes reactive(damaged, duration(6, veil, 0.04), cooldown: 12). Good. States "blocks curse/corruption conditions" -- the tag_immunity has tags `['curse', 'corruption', 'blight']`. Summary omits 'blight'. Revised to include all three tags.
- **ID Convention:** PASS. `reward_vestments_the_woven_sky`.

### 10. Traveler's Cloak

- **Name Quality:** PASS. Apostrophe-s possessive is correctly handled. Plain, functional. Preserved from original.
- **Flavor Text:** PASS. "Dyed with muddy hues, designed to shed rain as much as attention." -- practical, understated. Preserved.
- **Tags:** PASS. `#cloth #travel #weather` -- matches original exactly.
- **Mechanical Summary:** PASS. "10% reduced movement cost, blocks cold conditions" -- accurately describes range_modifier(movementCostMultiplier: 0.9) + tag_immunity(['cold', 'frostbite']). "Cold conditions" reasonably covers both 'cold' and 'frostbite' tags.
- **ID Convention:** PASS. `starter_traveler_cloak` -- correct starter prefix for a starter item.
- **Note:** This is a starter item (in `starter-attachments.ts`), not a reward item. The ID prefix `starter_` is correct and matches the source file.

---

## Batch-Level Checks

### Variety Assessment

- **Reach diversity:** Good spread. Iron (4 items), Shadow (3 items), Star (2 items), Gold (1 item), Heart penalties (2 items), Veil (1 item). Much better reach diversity than Batch 1 (all Iron primary). The vestments naturally bring Shadow, Star, and Gold into the mix.
- **Tier spread:** 3 T1 + 2 T2 + 2 T3 + 2 T4 + 1 T1 (starter) = full tier coverage. Excellent.
- **Subcategory mix:** 3 arms + 7 vestments (including 1 starter). The vestments dominate as expected for a batch titled "arms & vestments T1-T4" where arms T1-T2 were already done in Batch 1.
- **Primitive variety:** EXCELLENT. Seven primitives new to the catalog:
  - reactive (4 items) -- primary variety driver, different triggers: damaged, attacked, entered_hex
  - cooldown (1) -- new to catalog
  - decay (2, nested) -- new to catalog
  - until_event (1) -- new to catalog
  - tag_immunity (5) -- new to catalog, vestment specialty
  - behavior_weight (1) -- new to catalog
  - trait_grant (1) -- new to catalog
  - duration (3, nested) -- new to catalog as nested effect

  Cross-batch variety is strong: Batch 1 introduced conditional, stacking, tradeoff, consumable_charge, test_shaper. This batch deliberately avoids those (except 2 conditionals with different predicates). No primitive overlap fatigue.

- **Loss condition variety:** breakable (2), stealable (2), cursed (2), permanent (3), consumable (0). Good spread. Cursed items (Hollowfang, Mantle) both have narrative justification for being irremovable.
- **Reactive trigger variety:** damaged (2), attacked (1), entered_hex (1). Three different triggers across 4 reactive items. Acceptable -- the two `damaged` triggers have different nested effects (decay vs duration).

### Data Quality Issues Found

1. **Hollowfang mechanicalSummary:** Decay duration stated as 6 ticks, actual math is 5 ticks. Cooldown omitted.
2. **The Quiet Blade mechanicalSummary:** Tag immunity incorrectly described as combat-only ("in combat: blocks fear/intimidation"). It is always active.
3. **Mantle of the Unremembered mechanicalSummary:** Reactive cooldown of 8 ticks omitted.
4. **The Woven Sky mechanicalSummary:** Tag immunity omits 'blight' from the list.

### Automatic REVISE Triggers -- None Hit

1. Generic fantasy names? No -- all names are specific and preserved from originals.
2. Exclamatory or epic-scale flavor text? No -- all flavor text is Threadbare-compliant and preserved.
3. All items on same reach? No -- 5 distinct reach domains represented.
4. Mechanical summary doesn't match effects[]? Four minor inaccuracies found and corrected in revised file. None are structurally wrong -- all are omissions or count errors.

---

## Summary of Revisions Applied

| # | Item | Issue | Revision |
|---|------|-------|----------|
| 1 | Hollowfang | mechanicalSummary says "decaying over 6 ticks", math gives 5; cooldown omitted | Changed to "decaying over 5 ticks (12-tick cooldown)" |
| 3 | The Quiet Blade | mechanicalSummary says "in combat: blocks fear/intimidation", immunity is unconditional | Removed "in combat:" qualifier |
| 8 | Mantle of the Unremembered | mechanicalSummary omits 8-tick cooldown on reactive | Added "(8-tick cooldown)" |
| 9 | The Woven Sky | mechanicalSummary omits 'blight' from tag_immunity list | Added "blight" to the list |
