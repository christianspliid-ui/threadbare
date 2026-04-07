# Editorial Review: fill-time-manipulation
> Reviewer: Editorial Agent | Date: 2026-04-07
> Mode: fill (new items — full name/tone/quality review)

## Verdict: PASS WITH REVISIONS

Strong batch overall. The temporal theme is well-executed with real naming variety — no two items feel like reskins. Flavor text is consistently Threadbare: weathered, practical, no exclamation marks, no epic inflation. Three items need minor revisions (mechanical summary accuracy, one name refinement, one tag correction). Reach and tier diversity are good.

---

## Per-Item Review

### 1. Berserker's Draught

- **Name Quality:** PASS. Specific, functional, implies a tradition of use. The possessive ("Berserker's") gives it provenance without mythologizing.
- **Flavor Text:** PASS. "Thick as tar and smells worse. The old soldiers swear by it. The young ones vomit first, then swear by it." -- Voice of experience, wry humor, physical detail. Threadbare-perfect.
- **Tags:** PASS. `#iron #consumable #combat #alchemy` -- correct for an iron-reach consumable combat stimulant.
- **Mechanical Summary:** REVISION. States "Grants 1 extra action for 4 ticks, but -0.03 Heart for 6 ticks (fades). Consumable, 2 charges." The summary mentions the Heart decay but not the on-use Iron bonus from charges (+0.02 Iron per use). That on-use effect is part of the consumable_charge definition and is mechanically relevant. Revised to include.
- **ID Convention:** PASS. `reward_provisions_berserker_draught` matches `reward_<subcategory>_<snake_case>`.
- **Duplicate Check:** PASS. No existing item named "Berserker's Draught".

### 2. Timekeeper's Last Vial

- **Name Quality:** PASS. Excellent. The "Last" implies a dead craftsman, a final work. Specific and storied.
- **Flavor Text:** PASS. "The liquid inside does not slosh when shaken. It remembers where it was." -- Uncanny, restrained, shows rather than tells. Outstanding.
- **Tags:** PASS. `#veil #consumable #temporal #alchemy` -- correct reach and category.
- **Mechanical Summary:** PASS. "+0.04 Veil passive while held" and the freeze/charge description accurately reflect the effects array.
- **ID Convention:** PASS. `reward_provisions_timekeepers_last_vial`.
- **Duplicate Check:** PASS.

### 3. Stasis Pearl

- **Name Quality:** PASS. Clean compound name. "Stasis" is direct but not generic because it's paired with a specific physical form.
- **Flavor Text:** PASS. "A pearl the color of frozen smoke. Hold it to your chest and feel time hesitate." -- Sensory and specific. The verb "hesitate" is a good choice — time doesn't stop, it pauses uncertainly.
- **Tags:** PASS. `#veil #temporal #relic #preservation` -- correct.
- **Mechanical Summary:** REVISION. States "freezes debuff/disease countdowns for 6 ticks (active 6 ticks, dormant 18 ticks -- cooldown cycle)". The effects array shows `freeze_duration` targeting `debuff`, not `debuff/disease`. The summary adds "disease" which is not in the target field. Either the target should include disease or the summary should say debuff only. Since I cannot change effects, the summary must say "debuff" not "debuff/disease". Also the cooldown effect's reach bonus (veil: 0.02) during active phase is not mentioned. Revised.
- **ID Convention:** PASS. `reward_relics_talismans_stasis_pearl`.
- **Duplicate Check:** PASS.

### 4. Hourglass of the Unraveling

- **Name Quality:** PASS. Strong T3 name. "Unraveling" implies entropy and decay without being overwrought. The "of the" construction is earned at T3.
- **Flavor Text:** PASS. "The sand flows upward. The glass is warm to the touch, as if something inside is still dying." -- Two precise images. The warmth implying trapped life/death is excellent Threadbare.
- **Tags:** PASS. `#veil #shadow #temporal #relic #ancient` -- appropriate for a T3 dual-reach relic with history.
- **Mechanical Summary:** REVISION. States "slows one nearby enemy (skip actions for 3 ticks)" but the effects array has `skipActions: true` on the slow, which is correct. However, the summary also says "freezes own condition countdowns for 6 ticks when health is low" -- there is no health conditional in the effects array. The `freeze_duration` targets `condition` for 6 ticks with no `condition` gate. The "when health is low" is editorializing beyond the effects. Revised to remove the false health condition.
- **ID Convention:** PASS. `reward_relics_talismans_hourglass_of_the_unraveling`.
- **Duplicate Check:** PASS.

### 5. Chronoscope

- **Name Quality:** REVISION. The name is functional but reads slightly clinical — more like a Victorian scientific instrument than a Threadbare artifact. It works within the tools_instruments subcategory, but the tone is borderline. Revised to "Chronoscope" is acceptable for a tool/instrument (compare: "Surveyor's Glass", "Astrolabe of Yven" in existing catalog), but adding a grounding detail would improve it. However, compound neologisms are acceptable in the existing catalog ("Shadowglass Pendant", "Veilwater Flask"). PASS on reflection — the name fits the tools_instruments subcategory convention.
- **Flavor Text:** PASS. "A lens ground from something that is not glass. When you look through it, moments stack upon each other like pages." -- The simile ("like pages") is specific and literary without being purple. The mystery of the material is well-handled.
- **Tags:** REVISION. `#eye #veil #temporal #tool #mystical` -- five tags. The `#mystical` tag is not a standard reach or established category tag. Existing tools use `#tool` without `#mystical`. Remove `#mystical` to match catalog conventions. The tagged freeze condition already references `#blessing` and `#divine` in the effects array, so the mystical flavor is expressed mechanically. Revised.
- **Mechanical Summary:** PASS. Accurately describes the tagged freeze (divine/blessing buffs only), awareness bonus, and passive values.
- **ID Convention:** PASS. `reward_tools_instruments_chronoscope`.
- **Duplicate Check:** PASS.

### 6. Swiftness of the Wind

- **Name Quality:** REVISION. This is the weakest name in the batch. "Swiftness of the Wind" is generic fantasy blessing language — it could appear in any MMORPG buff bar. Compare to the existing catalog's condition names: "Dawn-Kissed", "Fortune-Marked", "Fey-Touched", "Earthblood Vigor" — these are specific and hint at origin. "Swiftness of the Wind" tells you what it does rather than where it came from or what it feels like. Revised to something with more provenance.
- **Flavor Text:** PASS. "Your feet leave the ground a heartbeat before they should. Gods move in small mercies." -- The second sentence is strong Threadbare. But paired with the generic name, the whole entry feels like it needs grounding.
- **Tags:** PASS. `#blessing #star #divine #combat` -- correct for a divine star-aligned combat blessing.
- **Mechanical Summary:** PASS. "+0.03 Star, grants 1 extra action for 6 ticks" accurately describes the effects.
- **ID Convention:** Will need update after name revision. Currently `reward_condition_swiftness_of_the_wind`.
- **Duplicate Check:** PASS.

### 7. Temporal Anchor

- **Name Quality:** PASS. Clean metaphor that communicates the mechanic (anchoring time) without being literal. Feels like a term people in-world would use.
- **Flavor Text:** PASS. "The candle burns but does not shorten. The wound bleeds but does not deepen. Something holds." -- Three images building the same idea. The final "Something holds" is understated and effective. Excellent.
- **Tags:** PASS. `#blessing #veil #temporal #preservation` -- correct.
- **Mechanical Summary:** PASS. Accurately describes freeze_duration on buffs, passive veil, and conditional star.
- **ID Convention:** PASS. `reward_condition_temporal_anchor`.
- **Duplicate Check:** PASS.

### 8. Leaden Limbs

- **Name Quality:** PASS. Physical, evocative, implies weight without explanation. Good curse name.
- **Flavor Text:** PASS. "The air thickens. Each step forward requires a step of will first." -- Sensory and psychological in two sentences. Threadbare.
- **Tags:** PASS. `#curse #shadow #iron #combat` -- correct for a shadow/iron debilitating curse.
- **Mechanical Summary:** PASS. "-0.03 Iron, slowed (actions halved, not skipped) for 6 ticks, +30% movement cost" accurately describes all three effects.
- **ID Convention:** PASS. `reward_condition_leaden_limbs`.
- **Duplicate Check:** PASS.

### 9. Time-Eaten

- **Name Quality:** PASS. Strong. Compound adjective implying something consumed part of your timeline. Specific to this world's temporal vocabulary without being jargon.
- **Flavor Text:** PASS. "You blink and the sun has moved. Your companions look at you strangely, as if you were not there a moment ago." -- Disorienting, told from the victim's perspective. The social dimension (companions noticing) adds depth.
- **Tags:** PASS. `#curse #shadow #veil #temporal` -- correct.
- **Mechanical Summary:** PASS. Accurately describes all four effects including the self-reinforcing freeze_duration on debuffs.
- **ID Convention:** PASS. `reward_condition_time_eaten`.
- **Duplicate Check:** PASS.

### 10. Battle Fury

- **Name Quality:** REVISION. "Battle Fury" is generic. It is a stock RPG buff name — every game from Diablo to World of Warcraft has some version of "Battle Fury" or "Battle Rage". Compare to the existing catalog's supernatural conditions: "Void-Scarred", "Fey-Touched", "The Hollow". These are specific and atmospheric. A T3 supernatural berserker trance deserves a name with more texture. Revised.
- **Flavor Text:** PASS. "The blood sings. Time splits in two: one half for killing, one half for forgetting." -- This is excellent. The temporal framing ties it to the batch theme. The "forgetting" implies the Heart/Eye penalties.
- **Tags:** PASS. `#supernatural #iron #heart #combat` -- correct for a T3 supernatural combat condition.
- **Mechanical Summary:** PASS. Accurately describes all six effects at cap.
- **ID Convention:** Will need update after name revision. Currently `reward_condition_battle_fury`.
- **Duplicate Check:** PASS (but "Battle Fury" is so generic it should be renamed regardless).

---

## Batch-Level Assessment

### Variety
- **Reach spread:** PASS. iron(2), veil(3), shadow(2), heart(2), star(1), eye(1). Veil dominance is appropriate for a temporal-magic batch — veil is the temporal reach. No single-reach problem.
- **Tier spread:** PASS. T1(3), T2(4), T3(3). Good distribution.
- **Primitive variety:** PASS. haste(3), slow(4), freeze_duration(6). All three target primitives well-represented. Several items combine two primitives.
- **Subcategory variety:** PASS. provisions(2), relics_talismans(2), tools_instruments(1), conditions(5). The 5 conditions vs 5 possessions split is balanced.

### Naming Patterns
- Two names triggered the generic-name automatic REVISE flag: "Swiftness of the Wind" and "Battle Fury".
- Remaining 8 names are strong: specific, storied, Threadbare-appropriate.

### Tone Consistency
- No exclamation marks. No epic-scale language. No MMO loot descriptions.
- Flavor text is uniformly strong — this is one of the better-written batches in the pipeline.
- The design notes section is well-written and demonstrates clear authorial intent.

### Tag Conventions
- One non-standard tag found: `#mystical` on the Chronoscope. Removed in revised version.

---

## Summary of Revisions

| # | Item | Issue | Action |
|---|------|-------|--------|
| 1 | Berserker's Draught | Mechanical summary omits on-use Iron bonus | Revised summary |
| 3 | Stasis Pearl | Summary says "debuff/disease" but target is only "debuff" | Revised summary |
| 4 | Hourglass of the Unraveling | Summary adds "when health is low" not in effects | Revised summary |
| 5 | Chronoscope | Non-standard `#mystical` tag | Tag removed |
| 6 | Swiftness of the Wind | Generic blessing name (auto-REVISE trigger) | Name revised to "Gale-Touched" |
| 10 | Battle Fury | Generic condition name (auto-REVISE trigger) | Name revised to "The Red Divide" |
