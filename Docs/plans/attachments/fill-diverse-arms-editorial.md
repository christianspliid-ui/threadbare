# Editorial Review: fill-diverse-arms
> Reviewer: Editorial Agent | Date: 2026-04-07
> Mode: fill (new items -- full name/tone/quality review)

## Verdict: PASS WITH REVISIONS

Strong batch with excellent reach diversity and good primitive spread. The core concept -- reinterpreting "arms" through six non-Iron reaches -- produces genuinely distinct items that read as weapons-of-their-domain rather than reskinned swords. Threadbare tone is mostly solid; a few items drift toward generic fantasy naming or have mechanical summary inaccuracies. The batch summary header contains a tier count error. Six items need revision.

---

## Per-Item Review

### 1. Grave-Robber's Stiletto

- **Name Quality:** PASS. The possessive tells a provenance story -- this belonged to a grave-robber, which implies a specific criminal trade. "Stiletto" is precise (a thin stabbing blade, not a dagger or knife). The name communicates both the former owner's profession and the weapon's form.
- **Flavor Text:** PASS. "Thin as a finger bone and just as cold. The grip is wrapped in linen from a burial shroud." -- Two physical details, both grounded in the grave-robbing trade. The finger-bone simile is specific and morbid without being theatrical. The burial shroud linen is a detail that earns the name. Threadbare-correct.
- **Tags:** PASS. `#shadow #weapon #melee #stealth #assassination` -- five tags, all standard. Shadow-primary with stealth/assassination niche tags appropriate for a lone-operator blade.
- **Mechanical Summary:** PASS. "+0.03 Shadow, +0.02 Shadow when alone (ambush bonus)" accurately describes the passive + conditional(alone). The parenthetical "(ambush bonus)" is an acceptable flavor gloss on the mechanical condition.
- **ID Convention:** PASS. `reward_arms_grave_robbers_stiletto` follows `reward_<subcategory>_<snake_case>`.
- **Duplicate Check:** PASS. No collision.

### 2. Strangler's Cord

- **Name Quality:** PASS. "Strangler's" is specific to a method of killing -- not "Assassin's" (generic) or "Silent" (adjective-only). "Cord" is honest about what it is: a length of rope or wire for throttling. The name is menacing through specificity.
- **Flavor Text:** PASS. "Braided from horsehair and treated with tallow. It leaves no mark on the throat if you know the twist." -- Material detail (horsehair, tallow) grounds it in a low-tech craft tradition. The second sentence implies expertise and a community of knowledge ("if you know the twist" -- someone taught someone). The clinical pragmatism is Threadbare-perfect.
- **Tags:** PASS. `#shadow #weapon #melee #stealth #assassination` -- same tag set as the Stiletto, which is correct; both are shadow assassination tools. The mechanical differentiation (stacking vs conditional) is where they diverge, not the tags.
- **Mechanical Summary:** PASS. "+0.05 Shadow, +0.03 Shadow / -0.02 Heart (silent killer), +0.01 Shadow per combat success (max 3 stacks, decays 1/tick)" accurately describes all three effects: passive, tradeoff (bonus shadow / penalty heart), stacking with decay. The parenthetical "(silent killer)" explains the Heart penalty thematically.
- **ID Convention:** PASS. `reward_arms_stranglers_cord`.
- **Duplicate Check:** PASS.

### 3. Hedge-Witch's Wand

- **Name Quality:** REVISION. "Hedge-Witch's Wand" is functional but leans generic. "Wand" is the most default magical weapon noun in fantasy. The "Hedge-Witch" modifier helps -- it grounds it in folk magic rather than high sorcery -- but the overall package reads like a loot table entry from a standard RPG. The item's flavor text and mechanics describe something much more specific: a hazel rod stripped by moonlight, with a scraped-out name, that wards instinctively when threatened. The name should reflect that haunted, personal quality. Revised to foreground the hazel material and the sense of something reclaimed or repurposed.
- **Flavor Text:** PASS. "Hazel wood stripped white by moonlight. Someone carved a name into the base and then scraped it out." -- The moonlight stripping is atmospheric without being purple. The scraped-out name is the best detail: it implies a previous owner, a deliberate erasure, and a history the wand carries silently. Threadbare-excellent.
- **Tags:** PASS. `#veil #weapon #implement #mystical` -- four tags, lean and appropriate. The `#implement` tag distinguishes it from melee/ranged martial weapons.
- **Mechanical Summary:** PASS. "+0.04 Veil, +0.03 Veil in mystical encounters, when attacked: +0.03 Veil for 4 ticks (10-tick cooldown)" accurately describes all three effects. The cooldown is correctly included (unlike some prior batches where it was omitted).
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** PASS.

### 4. Captain's War Horn

- **Name Quality:** REVISION. "Captain's War Horn" is generic military fantasy. Both "Captain's" and "War Horn" are stock elements -- a captain is a generic rank, a war horn is a generic instrument. Compare this to existing catalog names like "Crossbow of the Watch" (institutional provenance) or "Bone Ward" (material-specific). The item's flavor text describes something far more specific: a dented brass horn with a cracked bell that still carries across a valley. The name should pull from that worn, specific physicality rather than a title and function. Revised to foreground the battered-but-effective quality and remove the generic rank.
- **Flavor Text:** PASS. "Dented brass with a cracked bell. It still carries across a valley when the wind is right." -- Physical damage (dented, cracked) is followed by stubborn functionality (still carries). "When the wind is right" is a quietly honest limitation. This reads like an object a real person would describe. Threadbare-correct.
- **Tags:** PASS. `#heart #weapon #instrument #command #social` -- appropriate for a Heart command instrument. The `#instrument` tag is correct for a non-melee, non-ranged arms item.
- **Mechanical Summary:** PASS. "+0.03 Heart, +0.02 Heart in social encounters, +0.3 cooperation with allies (rallying call)" accurately describes the passive + conditional(in_social) + social_modifier(ally, +0.3). The parenthetical "(rallying call)" explains the cooperation bias.
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** PASS.

### 5. Iron Marshal's Banner

- **Name Quality:** REVISION. "Iron Marshal" is a respectable compound title, but the construction is formulaic: "[Adjective] [Rank]'s [Object]". It reads like a D&D magic item. "Iron" collides with the Iron reach name, creating an ambiguity -- is "Iron" the material, the reach, or the rank? (The flavor text describes a splintered pole re-bound with wire and an unrecognizable sigil -- the "iron" in the name has no material connection to the item.) The banner itself is well-described in the flavor text as something old, repaired, and bearing a forgotten heraldry. The name should lean into that weathered anonymity. Revised to foreground the forgottenness.
- **Flavor Text:** PASS. "The pole is splintered and re-bound with wire. The cloth shows a sigil no living heraldist recognizes." -- Physical disrepair (splintered, re-bound) paired with lost meaning (no living heraldist recognizes). This is a banner from a dead army, and no one remembers whose. Excellent Threadbare.
- **Tags:** REVISION. `#heart #iron #weapon #banner #command #combat` -- six tags. The `#banner` tag is not used elsewhere in the catalog. Since this is a one-off category, it functions as noise rather than a meaningful filter. Replace with `#melee` or remove it. Revised to drop `#banner` and keep five tags.
- **Mechanical Summary:** PASS. "+0.05 Heart, +0.03 Iron in combat, +0.5 cooperation with same-faction allies, drives wielder toward combat encounters (1.3x behavior weight)" accurately describes all four effects: passive(heart), conditional(in_combat, iron), social_modifier(same_faction, +0.5), behavior_weight(iron, 1.3).
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** PASS.

### 6. Cartographer's Marking Bolt

- **Name Quality:** REVISION. "Cartographer's" collides with the existing "Cartographer's Survey" (a T2 tomes_scrolls Eye item). Having two "Cartographer's [noun]" items creates a naming echo that suggests a set when no set relationship exists. The Survey is a map document; the Marking Bolt is expendable ammunition. They share the Eye reach and scouting theme, but the possessive pattern makes them feel like parts of a kit that the attachment system does not support. Revised to use a different military-scouting provenance.
- **Flavor Text:** PASS. "Crossbow quarrels with red-dyed fletching. The cartographer who carried them marked enemy positions, not map edges." -- The subversion of expectation (marking enemies, not maps) is a good detail. The red-dyed fletching is specific and functional. Threadbare-correct.
- **Tags:** PASS. `#eye #weapon #ranged #precision #reconnaissance` -- appropriate for an Eye scout's expendable.
- **Mechanical Summary:** PASS. "+0.03 Eye, +1 awareness range (surveyor sight), 4 charges of +0.03 Eye burst (mark target)" accurately describes the passive + range_modifier(awarenessRangeBonus: 1) + consumable_charge(4, eye 0.03, destroyOnEmpty). The parentheticals "(surveyor sight)" and "(mark target)" provide flavor context.
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** REVISION. Collides with "Cartographer's Survey". See name quality above.

### 7. Lens-Sighted Arbalest

- **Name Quality:** PASS. "Lens-Sighted" is a compound that communicates the modification (a lens on a crossbow) without being generic. "Arbalest" is specific -- it is a heavier crossbow, not a bow or crossbow, which distinguishes it from the Hunting Bow. The name reads as a field modification description, which fits the flavor text's emphasis on the lens over the weapon.
- **Flavor Text:** PASS. "The lens is ground from quartz and sits in a brass cradle. The crossbow itself is unremarkable. The lens is everything." -- Material detail (quartz, brass cradle), followed by a deliberate deflation of the weapon and elevation of the attachment. "The lens is everything" is a statement of mechanical identity in three words. Strong.
- **Tags:** PASS. `#eye #iron #weapon #ranged #precision #combat` -- dual-reach tags correctly reflect the dual passive effects (Eye + Iron).
- **Mechanical Summary:** REVISION. States "rescues near-miss Eye tests (+1 step, within 2 margin)". The effects array has `type: 'test_shaper', reach: 'eye', trigger: 'near_miss', steps: 1, maxMargin: 2`. The summary accurately describes the trigger, steps, and margin. However, the phrasing "rescues near-miss Eye tests" implies it only applies to Eye-reach tests. The `test_shaper` primitive's scope depends on implementation -- does the `reach: 'eye'` field mean "only on Eye tests" or "provides Eye-themed rescue on any near miss"? The summary should match the data literally: "on near-miss (within 2 margin): +1 step on Eye tests". Revised for precision.
- **ID Convention:** PASS. `reward_arms_lens_sighted_arbalest`.
- **Duplicate Check:** PASS.

### 8. Basalt Maul

- **Name Quality:** PASS. Material + form, both specific. "Basalt" is a specific rock type (not "stone" or "rock"), and "Maul" is a specific heavy hammer (not "hammer" or "weapon"). The compound communicates heaviness and geological origin in two words.
- **Flavor Text:** PASS. "A column of black stone lashed to a shaft of green oak. Whoever swings it does not swing it twice in quick succession." -- Construction detail (lashed stone on oak) and an honest limitation (slow to swing). The phrasing is laconic and tells you exactly what wielding this is like. Threadbare-correct.
- **Tags:** PASS. `#stone #weapon #melee #heavy #combat` -- appropriate for a Stone heavy melee weapon.
- **Mechanical Summary:** PASS. "+0.04 Stone, +0.02 Stone / -0.01 Eye (heavy and unwieldy), blocks bruise conditions" accurately describes passive + tradeoff(stone bonus, eye penalty) + tag_immunity(bruise). The parenthetical "(heavy and unwieldy)" explains the Eye penalty.
- **ID Convention:** PASS. `reward_arms_basalt_maul`.
- **Duplicate Check:** PASS.

### 9. Petrified Ironwood Glaive

- **Name Quality:** PASS. "Petrified Ironwood" is a specific compound -- wood that has turned to stone over geological time, from a tree named for its hardness. "Glaive" is specific (a polearm with a blade, not a sword or spear). The name tells the item's origin story in three words: an ironwood shaft that petrified. The "Petrified" in the catalog already appears in the worldSeed name generators (line 219: 'Petrified') which is appropriate -- it is a world-term, not a cliche.
- **Flavor Text:** PASS. "The wood turned to stone a thousand years ago. The blade edge is a geological accident. It cuts like a bad intention." -- Three escalating sentences: geological fact, unexpected utility, menacing simile. "A geological accident" is an unusually good phrase -- the blade was not forged, it happened. "It cuts like a bad intention" anthropomorphizes without mythologizing. Strong.
- **Tags:** PASS. `#stone #iron #weapon #melee #heavy #combat #ancient` -- seven tags is on the high side for a T2 item but all are standard and descriptive. The `#ancient` tag is earned by the petrification backstory.
- **Mechanical Summary:** REVISION. States "when attacked: +0.03 Stone for 6 ticks (12-tick cooldown), 20% slower movement (weight penalty)". The reactive effect in the effects array has `destroyOnExpiry: true` on the duration sub-effect. This property means the reactive's duration buff self-destructs after expiry. The summary omits this detail. For consistency with how other items document reactive durations, and because `destroyOnExpiry: true` on a reactive's sub-effect is mechanically unusual (it might mean the reactive itself is consumed, not just the buff), this should be noted. However, looking at the Hedge-Witch's Wand (#3) and Thornwood Staff (existing catalog), both have the same `destroyOnExpiry: true` pattern on reactive durations and their summaries also omit it. This appears to be a standard pattern for reactive durations. No revision needed on that point. The "20% slower movement" correctly describes `movementCostMultiplier: 1.2`. PASS on re-examination.
- **ID Convention:** PASS. `reward_arms_petrified_ironwood_glaive`.
- **Duplicate Check:** PASS.

### 10. Assessor's Weighted Scales

- **Name Quality:** PASS. "Assessor's" grounds it in a bureaucratic profession (tax assessment), not a generic merchant class. "Weighted Scales" does double duty: scales for weighing goods, and scales that are weighted (rigged, biased). The dual meaning communicates both function and corruption in two words. Good.
- **Flavor Text:** PASS. "Brass pans on a chain, with lead weights sewn into the handle. The Assessors Guild calls it a tool. The people they assess call it a weapon." -- Material detail (brass pans, lead weights sewn into the handle -- confirming the "weighted" pun). The Guild vs. assessed-people perspective shift is structurally effective. Threadbare-correct: institutional violence, not heroic combat.
- **Tags:** PASS. `#gold #weapon #melee #commercial #social` -- appropriate for a Gold-primary economic weapon with social effects.
- **Mechanical Summary:** PASS. "+0.05 Gold, +0.03 Gold in social encounters, -0.02 Iron (not a fighting weapon), -0.2 cooperation with enemies (economic intimidation)" accurately describes all four effects: passive(gold, +0.05), conditional(in_social, gold, +0.03), passive(iron, -0.02), social_modifier(enemy, -0.2). The parentheticals explain the penalties thematically.
- **ID Convention:** PASS. `reward_arms_assessors_weighted_scales`.
- **Duplicate Check:** PASS.

---

## Batch-Level Checks

### Variety Assessment

- **Reach diversity:** PASS. Six reaches represented across 10 items: Shadow(2), Veil(1), Heart(2), Eye(2), Stone(2), Gold(1). No Iron-primary items (the entire point of this batch). Strong coverage of previously-unserved reaches. The gap: Star has no representation, but Star-primary arms are hard to justify thematically (stars do not stab people). Acceptable omission.
- **Tier spread:** REVISION. The batch summary header (line 11) claims "T1 x4, T2 x5, T3 x1" but every item in the batch is either T1 or T2. No item has `tier: 3`. The summary table confirms: 4 T1 items (#1, #4, #6, #8) and 6 T2 items (#2, #3, #5, #7, #9, #10). Wait -- recounting: #2 is T2, #3 is T2, #5 is T2, #7 is T2, #9 is T2, #10 is T2. That is 4 T1 + 6 T2 = 10. The batch summary should read "T1 x4, T2 x6". The Balance Check table (line 375) also claims "T3: 1 item at ~0.11" which does not correspond to any actual item.
- **Primitive variety:** PASS. Eleven distinct primitives across 10 items: passive(10), conditional(5), tradeoff(2), stacking(1), reactive(2), social_modifier(3), behavior_weight(1), range_modifier(3), consumable_charge(1), test_shaper(1), tag_immunity(1). Excellent variety. Every target primitive listed in the batch summary is represented.
- **Loss condition variety:** PASS. breakable(6), stealable(3), consumable(1). The stealable items (#1, #5, #10) are thematically appropriate: a grave-robber's tool gets stolen, a banner gets captured, weighted scales represent seizable institutional power.

### Naming Patterns

- **No automatic REVISE triggers for all-same-reach:** PASS. Six different reaches.
- **Generic fantasy names:** Three items flagged: Hedge-Witch's Wand (#3), Captain's War Horn (#4), Iron Marshal's Banner (#5). All revised.
- **Naming collision:** Cartographer's Marking Bolt (#6) collides with existing Cartographer's Survey. Revised.
- **Internal variety:** Good. Possessive names (#1, #2, #3, #4, #5, #6, #10) dominate -- seven of ten items use the "'s" pattern. The remaining three (Lens-Sighted Arbalest, Basalt Maul, Petrified Ironwood Glaive) are material-form compounds. Consider whether the possessive dominance is a problem -- in this batch it works because each possessive references a different profession/role, but future batches should vary construction more.

### Tone Consistency

- No exclamation marks.
- No epic-scale language. No "legendary", "mighty", "supreme", "ultimate".
- Flavor text is uniformly strong. Highlights: Strangler's Cord's clinical pragmatism ("if you know the twist"), Petrified Ironwood Glaive's "geological accident", Assessor's Weighted Scales' institutional perspective shift.
- The Design Rationale section (lines 18-28) is well-written and demonstrates understanding of how each reach reinterprets the concept of "arms".

### Mechanical Summary Accuracy

- Eight of ten summaries accurately describe their effects arrays.
- One potential precision issue: Lens-Sighted Arbalest's test_shaper phrasing could be tighter (minor).
- No cases of summaries describing effects not present in the effects array (the most common editorial failure in prior batches).

### Tag Conventions

- All reach tags are valid: shadow, veil, heart, eye, stone, gold, iron (secondary on #5, #7, #9).
- One non-standard tag: `#banner` on item #5. Not used elsewhere. Revised to remove.
- Tag count ranges from 4 to 7. The higher counts (7 on #9) are acceptable for dual-reach T2 items with distinct mechanical identity.

### Batch Summary Data Quality

- **Tier count error:** Header says "T3 x1" -- no T3 items exist. Should be "T1 x4, T2 x6".
- **Balance Check table error:** Claims T3 row with 1 item at ~0.11. No T3 items.

---

## Summary of Revisions

| # | Item | Issue | Action |
|---|------|-------|--------|
| 3 | Hedge-Witch's Wand | Name is generic fantasy ("Wand") | Renamed to "Hazel Switch" |
| 4 | Captain's War Horn | Name is generic military ("Captain's", "War Horn") | Renamed to "Cracked Brass Horn" |
| 5 | Iron Marshal's Banner | "Iron" collides with reach name; generic "[Rank]'s [Object]" | Renamed to "Banner of the Lost Company"; dropped `#banner` tag |
| 6 | Cartographer's Marking Bolt | "Cartographer's" collides with existing "Cartographer's Survey" | Renamed to "Spotter's Marking Bolt" |
| 7 | Lens-Sighted Arbalest | Summary phrasing could be more precise on test_shaper scope | Minor summary revision |
| -- | Batch Summary | "T3 x1" in header; T3 row in Balance Check | Corrected to "T1 x4, T2 x6"; removed phantom T3 row |
