# Editorial Review: upgrade-final-dead
> Pass: editorial | Date: 2026-04-07
> **Verdict: PASS WITH REVISIONS**

## Review Summary

10 items reviewed (7 possessions, 3 conditions). All pass name quality, flavor text, tag format, and ID convention checks. Two items have mechanicalSummary issues where the summary doesn't precisely match the effects[] semantics. One item has a missing `#eye` tag that should be present given its Eye reach passive. No automatic REVISE triggers hit.

---

## Item-by-Item Notes

### 1. Pilgrim's Robe -- PASS
- Name: Evocative and humble. "Pilgrim's" immediately conveys the bearer's station.
- Flavor: "Threadbare and sun-bleached. It smells of incense and long roads." Good Threadbare register -- sensory, worn, quiet.
- mechanicalSummary: "+0.03 Star, +0.02 Star in mystical encounters (pilgrim devotion)" -- accurate. Passive matches `{ type: 'passive', reach: 'star', value: 0.03 }`, conditional matches `{ type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.02 }`.
- Tags: `#star #cloth #divine` -- all valid, match original.
- ID: `reward_vestments_pilgrim_robe` -- correct convention.
- No changes needed.

### 2. Vessen Shrine Map -- PASS
- Name: Geographic specificity ("Vessen") makes it feel real. Not generic.
- Flavor: Long (3 sentences), but preserved from original. The detail is appropriate for an intelligence item -- it justifies its mechanical weight.
- mechanicalSummary: "+0.03 Shadow, reveals encounters within 2 hexes, +0.02 Shadow in exploration" -- accurate. All three effects correctly described.
- Tags: `#shadow #intelligence #shrine_location #rival_god` -- match original.
- ID: `reward_intelligence_shrine_map` -- correct convention.
- Metadata preserved: `intelligenceType`, `targetRegion`, `detailLevel` -- all present and unchanged.
- No changes needed.

### 3. Trade Route Dossier -- PASS WITH REVISION
- Name: Professional and grounded. A dossier is a working document, not a treasure.
- Flavor: "A broker's working file" -- exactly right register.
- mechanicalSummary: "+0.03 Shadow, +0.02 Gold, +1 awareness range, +0.02 Gold in social (trade leverage)" -- accurate for all four effects.
- Tags: `#shadow #intelligence #trade #economic` -- match original.
- ID: `reward_intelligence_trade_route_dossier` -- correct convention.
- Metadata preserved: `intelligenceType`, `detailLevel` -- present and unchanged. No `targetRegion` in original, correctly absent.
- Tag issue: The item has a `passive` effect on `reach: 'gold'` but no `#gold` tag. However, the original item also lacks `#gold` -- the tag set is preserved from legacy. Since upgrade rules say tags should be preserved, this is acceptable. No change.
- **However:** The mechanicalSummary parenthetical "(trade leverage)" is a narrative gloss, not a mechanical description. The condition is `in_social`, which means "in social encounters" -- "trade leverage" implies something more specific than the predicate delivers. This is minor but imprecise.
- **Fix:** Change "(trade leverage)" to "(social encounters)" to match the actual condition predicate.

### 4. Faded Treasure Map -- PASS
- Name: "Faded" tells you this is a T1 map. Not much to go on.
- Flavor: "The parchment is brittle and the ink barely legible, but the landmarks are unmistakable." Good -- describes a physical object with history.
- mechanicalSummary: "+0.03 Eye, grants ruin_seeker, +0.02 Eye in exploration (consumed on discovery)" -- accurate.
- Tags: `#eye #map #ruin_seeker #ancient` -- match original.
- ID: `reward_tomes_scrolls_faded_treasure_map` -- correct convention.
- Special metadata preserved: `grantsTraitWhileHeld`, `grantedTraitLevel`, `consumeOnEvent` -- all present and unchanged.
- No changes needed.

### 5. Cartographer's Survey -- PASS
- Name: Professional. "Cartographer's" implies expertise, justifying T2.
- Flavor: "Meticulous measurements and triangulations. Someone spent months on this." Spare but effective. The second sentence is doing the Threadbare work -- it gestures at the unseen person.
- mechanicalSummary: "+0.05 Eye, grants ruin_seeker L2, reveals encounters within 1 hex (consumed on discovery)" -- accurate.
- Tags: `#eye #map #ruin_seeker #ancient #professional` -- match original.
- ID: `reward_tomes_scrolls_cartographers_survey` -- correct convention.
- Special metadata preserved: all three fields present and unchanged.
- No changes needed.

### 6. Tomb Raider's Journal -- PASS
- Name: "Tomb Raider's" is specific enough. A journal is a personal document.
- Flavor: "Detailed notes on trap mechanisms, burial customs, and which walls sound hollow when tapped." The specificity of "which walls sound hollow when tapped" is excellent. Practical. Physical.
- mechanicalSummary: "+0.04 Eye, +0.03 Shadow, grants ruin_seeker L2, +0.02 Eye in exploration (consumed on discovery)" -- accurate for all three effects.
- Tags: `#eye #shadow #map #ruin_seeker #ancient` -- match original.
- ID: `reward_tomes_scrolls_tomb_raiders_journal` -- correct convention.
- Special metadata preserved: all three fields present and unchanged.
- No changes needed.

### 7. Ancient Waystone Rubbing -- PASS
- Name: "Ancient Waystone" -- geographic specificity with age. "Rubbing" is the physical act. Grounded.
- Flavor: "Charcoal on vellum, taken from a stone older than the kingdom. The symbols shift when you look away." The shift from mundane to supernatural in one sentence is good Threadbare.
- mechanicalSummary: "+0.06 Eye, grants ruin_seeker L3, reveals hexes within 2, +0.03 Eye in exploration (consumed on discovery)" -- accurate for all three effects.
- Tags: `#eye #map #ruin_seeker #ancient #elder` -- match original.
- ID: `reward_tomes_scrolls_ancient_waystone_rubbing` -- correct convention.
- Special metadata preserved: all three fields present and unchanged.
- No changes needed.

### 8. Plague-Touched -- PASS WITH REVISION
- Name: "Plague-Touched" -- clinical and to the point. The compound adjective works.
- Flavor: "A fever that never quite breaks. Others wisely keep their distance." Good. The second sentence does double duty -- flavor and mechanical hint (social_modifier).
- Tags: `#disease #iron #contagious` -- correctly remapped from `#flesh`. Valid.
- Reach remap: `flesh` -> `iron`. Correct per batch spec. Iron represents physical capability.
- Special metadata preserved: `description`, `maxLevel`, `visibility` -- all present and unchanged.
- mechanicalSummary: "-0.10 Iron (decays slowly, ~40 ticks to clear), others avoid cooperation, when damaged: -0.03 Iron for 6 ticks" -- mostly accurate but the decay description is slightly misleading. The effect `startValue: -0.10, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true` means the penalty starts at -0.10 and improves by +0.0025 per tick toward 0, then the condition is destroyed. "Decays slowly" is correct but the parenthetical says "~40 ticks to clear" -- 0.10 / 0.0025 = 40 ticks exactly. That's fine. The reactive effect is correctly described.
- **However:** The summary says "others avoid cooperation" which is a narrative paraphrase. The actual effect is `cooperationBias: -0.3` on `targetFilter: 'any'`. "-0.3 cooperation bias" is the mechanical reality. "Others avoid cooperation" could mean they refuse entirely. This is borderline but should be tightened.
- **Fix:** Change "others avoid cooperation" to "-0.3 cooperation bias (contagion avoidance)"

### 9. Sun-Touched -- PASS
- Name: "Sun-Touched" -- mirrors "Plague-Touched" structurally. Divine version of the same pattern.
- Flavor: "Golden light seems to follow you, however briefly." The "however briefly" does mechanical work -- it hints at the decay. Good.
- Tags: `#blessing #star #divine` -- match original. Valid.
- mechanicalSummary: "+0.10 Star (fades slowly, ~40 ticks), +0.03 Star in mystical encounters" -- accurate. Decay math checks out (0.10 / 0.0025 = 40 ticks). Conditional correctly described.
- Special metadata preserved: `description`, `maxLevel`, `visibility` -- all present and unchanged.
- No changes needed.

### 10. Revelation -- PASS
- Name: Single word. Heavy. Appropriate for T2 supernatural knowledge.
- Flavor: "The mind is expanded, the heart is diminished." Economical. The two clauses mirror each other. Threadbare.
- Tags: `#magical #star #knowledge` -- match original. Valid. Note: no `#eye` tag despite having an Eye passive. This is preserved from legacy. Acceptable.
- Cap exceedance: Total passive reach 0.25 absolute (0.15 Star + 0.10 Eye). Correctly flagged in mechanicalSummary with "[EXCEEDS CAP: legacy values preserved]". Per spec, this is preserved as-is.
- mechanicalSummary: "+0.15 Star, +0.10 Eye [EXCEEDS CAP: legacy values preserved], drifts toward ruthlessness, 1.5x desire for Eye encounters (knowledge craving)" -- accurate for all four effects. `axiological_drift` on `mercy_ruthlessness` axis is correctly glossed as "drifts toward ruthlessness". `behavior_weight` with `multiplier: 1.5` is correctly described as "1.5x desire".
- Special metadata preserved: `description`, `maxLevel`, `visibility` -- all present and unchanged.
- No changes needed.

---

## Variety Check

| Axis | Assessment |
|------|-----------|
| Reach spread | star, shadow, gold, eye, iron -- 5 of 8 reaches touched. Heart, veil, stone absent but appropriate for these item types. |
| Tier spread | T1 x3, T2 x5, T3 x1 -- slightly T2-heavy but these are the last legacy items, not a designed batch. Acceptable. |
| Primitive variety | 9 distinct primitives across 10 items: passive, conditional, reveal, range_modifier, decay, social_modifier, reactive, axiological_drift, behavior_weight. Excellent coverage. |
| Subcategory spread | vestments x1, intelligence x2, tomes_scrolls x4, condition x3 -- mixed. Good. |

---

## Revisions Applied

| Item | Field | Original | Revised |
|------|-------|---------|---------|
| Trade Route Dossier | mechanicalSummary | "...+0.02 Gold in social (trade leverage)" | "...+0.02 Gold in social encounters" |
| Plague-Touched | mechanicalSummary | "...others avoid cooperation..." | "...-0.3 cooperation bias (contagion avoidance)..." |

No effect types, values, or compositions changed.
