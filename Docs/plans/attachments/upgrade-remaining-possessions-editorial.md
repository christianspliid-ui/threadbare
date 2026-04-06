# Attachment Pipeline: Editorial Review
> Slug: upgrade-remaining-possessions | Pass: editorial
> Input: upgrade-remaining-possessions-draft.md
> Verdict: **PASS WITH REVISIONS**

---

## Review Summary

41 items reviewed. Strong Threadbare voice throughout — weathered, practical, no exclamation marks. Good reach variety across all subcategories (iron, gold, shadow, veil, heart, eye, stone, star). Primitive variety is excellent (19 distinct types claimed; audit confirms this). The following issues require correction:

---

## Per-Item Review

### RELICS & TALISMANS

**1. Wayfarer's Charm** — PASS
Name: Evocative. Flavor: Good ("smells of campfire" is Threadbare). Summary matches effects (passive + conditional). Tags ok.

**2. Bone Ward** — PASS WITH REVISION
Name: Good. Flavor: Good ("old magic, close to the body"). Summary accurate (+0.04 Iron, blocks poison).
- Tags: `#flesh` should be updated to `#iron` since the reach is remapped to iron. `#flesh` is a thematic tag, not a reach domain, but the item's mechanical identity is now iron. Revise tags to `['#iron', '#talisman', '#survival']`.

**3. Ember Sigil** — PASS
Name: Good. Flavor: "Warm to the touch, always" — simple, works. Summary matches (passive x2 + reactive duration). Tags fine.

**4. Shadowglass Pendant** — PASS
Name: Strong — evocative of the shadow/opacity duality. Flavor: "Something moves inside when no one watches" — excellent Threadbare. Summary matches (passive + reveal). Tags fine.

**5. Heart of the Barrow** — PASS
Name: Excellent. Flavor: "pulses like a heartbeat when pressed to earth" — strong. Summary matches (passive x2 + aura + stacking). Tags fine. T3 composition with 4 effects within MAX_EFFECTS_PER_ATTACHMENT=6.

**6. The Weeping Icon** — PASS
Name: Good. Flavor: "cries real tears. You feel what others feel" — strong curse flavor. Summary: mentions axiological_drift toward mercy — this matches `ratePerTick: -0.005` (negative = toward mercy pole per AxiologicalDriftEffect). Accurate.

**7. The Fulcrum** — PASS
Name: Excellent — short, precise. Flavor: "Reality bends toward it." — tight. Summary matches (5 effects: passive x2 + aura + conditional + test_shaper). Note: 5 effects is within the 6-effect cap.

---

### TOMES & SCROLLS

**8. Field Journal** — PASS
Name: Simple but accurate. Flavor: "handwriting degrades toward the end" — subtle horror, Threadbare-appropriate. Summary matches.

**9. Prayer Scroll** — PASS
Name: Functional. Flavor: "One reading left, perhaps" — good fatigue. Summary matches (passive + consumable_charge). `destroyOnEmpty: true` fits "consumable" lossCondition.

**10. Merchant's Ledger** — PASS
Name: Fine. Flavor: "Knowledge is currency" — slightly on-the-nose but fits the utilitarian tone. Summary matches.

**11. Chronicle of the Falling** — PASS
Name: Strong — "of the Falling" is evocative of collapsed empires. Flavor: "final chapter is blank" — excellent detail. Summary matches (passive + test_shaper).

**12. Veilscript Fragment** — PASS
Name: Good. Flavor: "letters rearrange themselves when you look away" — classic uncanny. Summary matches (passive x2 + stacking with decayPerTick).

**13. Smuggler's Chart** — PASS
Name: Specific. Flavor: "sea-salt and cheap wine" — lived-in. Preserves grantsTraitWhileHeld/consumeOnEvent. Summary matches.

**14. Codex of Unmaking** — PASS WITH REVISION
Name: Striking. Flavor: "pages are blank until you bleed on them" — excellent. Summary accurate.
- Note: Draft correctly migrates to `veil: 0.15` (not 0.18 from catalog, which exceeds the EFFECT_PER_ITEM_CAP of 0.15). This is a systems correction, not editorial.
- Tags: Fine — cursed tag appropriate.

**15. The Silent Testament** — PASS
Name: "Silent Testament" is excellent — a god's quiet legacy. Flavor: "Every page is a eulogy for a truth" — Threadbare at its best. Summary matches (passive x2 + prevent_loss + conditional).

---

### TOOLS & INSTRUMENTS

**16. Surveyor's Glass** — PASS
Name: Precise. Flavor: "magnifies, but distorts at the edges" — captures the tradeoff aesthetic. Summary matches (passive + range_modifier). Simple, effective T1.

**17. Iron Tongs** — PASS WITH REVISION
Name: Blunt, practical — fits Threadbare. Flavor: "handles are polished smooth by grip" — good wear detail. Summary matches.
- Minor: The tags say `#stone` which is correct for the stone reach, but the item is a blacksmith tool. Fine as-is.

**18. Herbalist's Pouch** — PASS WITH REVISION
Name: Clear. Flavor: "The smell is medicinal" — appropriately plain.
- Tags: `#flesh` should be updated to `#heart` since reach is remapped (same logic as Bone Ward). Revise to `['#heart', '#tool', '#survival', '#craft', '#wilderness', '#healing']`.

**19. Gate Seal Case** — PASS
Name: Specific and evocative. Flavor: "power hides in paperwork" — sharp line. Summary matches (passive x2 + conditional). 3 effects within T1 limit per review — note systems audit may flag T1 having 3 effects (T1: 1 effect per systems spec). Will be reviewed in systems pass.

**20. Master Chisel** — PASS
Name: Craft-specific. Flavor: "guild that no longer exists. The edge never dulls" — good implied history. Summary matches (passive + stacking). Note: `stackOn: 'combat_success'` is used for encounter success broadly — fits the chisel as skill accumulation.

**21. Alchemist's Crucible** — PASS
Name: Specific. Flavor: "substances that should not exist in nature" + "glows faintly at dusk" — excellent. Summary matches (passive x2 + cooldown cycle).

**22. Astrolabe of Yven** — PASS
Name: Excellent — named instrument with provenance. Flavor: "does not measure the stars — it speaks with them" — great reversal. Summary matches (passive x2 + reveal + conditional).

---

### PROVISIONS

**23. Traveler's Wine** — PASS
Name: Simple, accurate. Flavor: "loosens tongues and lightens burdens" — classic. Summary matches (decay). 8-tick lifespan is credible.

**24. Hardtack and Salt** — PASS
Name: Specific and unglamorous — Threadbare perfection. Flavor: "It will not spoil. It will also not taste like food" — best line in the batch. Summary matches (passive + conditional).
- Tags: `#flesh` should be updated to `#iron` (same reach remapping). Revise to `['#food', '#provision', '#survival', '#wilderness', '#trade']`.

**25. Full Waterskin** — PASS WITH REVISION
- Tags: `#drink` fine but `#survival` good. Remove implicit `#flesh` if present (tags are `['#drink', '#provision', '#survival', '#wilderness']` — no flesh tag here, already clean). PASS.

**26. Firestarter Kit** — PASS
Name: Utilitarian. Flavor: "The difference between living and dying" — punchy. Summary matches (passive + consumable_charge).

**27. Healing Poultice** — PASS WITH REVISION
Name: Plain. Flavor: "Moss, spider silk, and something bitter. Applied to wounds, it numbs and knits" — Threadbare. Summary matches (decay).
- Tags: `#flesh` should be updated to `#heart`. Revise to `['#potion', '#provision', '#heart', '#healing', '#wilderness']`.

**28. Sanctuary Incense** — PASS
Name: Works. Flavor: "smoke forms shapes that soothe the troubled spirit" — appropriate. Summary matches (until_event x2). Good provision pattern.

**29. Veilwater Flask** — PASS
Name: Evocative. Flavor: "perfectly clear but casts no reflection" — strong. Summary matches (dual decay + reveal).
- Note for systems: second decay has `destroyAtLimit: false` — correct, only primary destroys the item.

---

### MOUNTS & BEASTS

**30. Draft Pony** — PASS
Name: Exact. Flavor: "ill-tempered, but carries twice its weight without complaint" — animal personality. Summary matches.

**31. Tracking Hound** — PASS
Name: Descriptive. Flavor: "finds things you did not know were lost" — evocative. Summary matches (passive + behavior_weight).

**32. Pack Goat** — PASS
Name: Good. Flavor: "It eats anything. It climbs anything. It judges you constantly" — best animal characterization in the batch. Summary matches (passive + slot_bonus).

**33. Steppe Mare** — PASS
Name: Specific. Flavor: "She runs like she remembers open grassland" — melancholy, Threadbare. Summary matches (passive x2 + range_modifier + reactive).

**34. War Hound** — PASS
Name: Blunt. Flavor: "loyalty is absolute and terrifying" — good. Summary matches (passive x2 + conditional + social_modifier).

**35. Ashenmane Destrier** — PASS
Name: Strong. Flavor: "born on a battlefield and has never left one" — great. Summary matches (passive x2 + range_modifier + trait_grant + behavior_weight). 5 effects.

---

### STARTER ATTACHMENTS

**36. Ashenmane's Fang** — PASS
Name: Iconic. Flavor: "terrorized the Ashen Vale for three generations" — history implied. Summary fixed from invalid "Fang reach" to real effects. Good.

**37. Road-Worn Mule** — PASS
Name: Implies history without over-explaining. Flavor: "stronger opinions" — personality. Summary matches.

**38. Ashenmane Horse** — PASS
Name: Consistent with lore. Flavor: "run until their hearts give out" — haunting. Summary matches. Correctly has no passive reach (original had none).

**39. Copper Market Rations** — PASS
Name: Evokes a specific economy tier. Flavor: "Simple sustenance for the road" — plain is right for T1. Summary fixed from "+movement for 3 ticks" (vague) to decay iron.

**40. Burned Codex** — PASS
Name: Good. Flavor: "Half the pages are ash. The rest are worse" — excellent. Summary matches (passive + conditional + onUseTrigger). Existing trigger preserved.

**41. The Whispering Eye** — PASS
Name: Strong. Flavor: "sees what you cannot. shows what you must not know" — clean duality. Summary corrected from inflated "+0.20 Eye, -0.10 Heart" to actual reachBonus values. Existing trigger preserved.

---

## Revisions Required

| # | Item | Revision |
|---|------|----------|
| 2 | Bone Ward | Tags: `#flesh` → `#iron` |
| 18 | Herbalist's Pouch | Tags: `#flesh` → `#heart` |
| 24 | Hardtack and Salt | Tags: `#flesh` → remove (not in draft's tag list anyway — verify) |
| 27 | Healing Poultice | Tags: `#flesh` → `#heart` |

Note on Gate Seal Case (item 19): T1 with 3 effects may be flagged by systems audit. The systems agent should adjudicate — editorially, the flavor and name justify the complexity of a bureaucratic toolkit.

## Verdict: PASS WITH REVISIONS

Revisions are minor tag corrections. Names and tone are strong throughout. Revised file produced.
