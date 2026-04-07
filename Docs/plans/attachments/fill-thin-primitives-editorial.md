# Editorial Review: fill-thin-primitives
> Reviewer: Editorial Agent | Date: 2026-04-07
> Mode: fill (new items -- full name/tone/quality review)

## Verdict: PASS WITH REVISIONS

Good batch that accomplishes its goal -- three single-usage primitives each gain meaningful coverage, and the items create genuine economy/inventory/discovery moments rather than just flat stat bumps. Threadbare tone is solid throughout with one exception. Reach diversity is acceptable but Star-heavy in the resource_manipulate section (3 of 5 items). Seven items need revision: two generic names, one subcategory mismatch, one flavor text that breaks tone, two mechanical summary inaccuracies, and one batch-header data error. Effects are not touched.

---

## Per-Item Review

### 1. Spring Water Vial

- **Name Quality:** PASS. "Spring Water" is specific -- water from a spring, not a river, well, or rain barrel. "Vial" is honest about quantity (small, precious). The name is plain in a way that earns the item's low tier and consumable nature. It reads like something a pilgrim would carry.
- **Flavor Text:** PASS. "Drawn from a spring that remembers its source. Drink it near somewhere holy and feel the world lean closer." -- "Remembers its source" personifies without mythologizing. "The world lean closer" is restrained divinity -- presence, not intervention. Threadbare-correct.
- **Tags:** PASS. `#star #provision #divine #restoration` -- four tags, all standard. Star-primary with provision and divine niche.
- **Mechanical Summary:** REVISION. States "Restores 1 essence (one-shot), +0.02 Star near water". The effects array has a `resource_manipulate` (essence, 1, one_shot) and a `conditional` (near_water, star, 0.02). However, the summary omits the fact that there is no `passive` effect -- most items lead with their passive stat. This item genuinely has no passive, only a conditional and a one-shot. The summary is technically accurate but misleading by placement: it leads with the one-shot resource effect and trails with the conditional as if secondary. Should be reordered to lead with the conditional (the persistent effect) and trail with the one-shot (the consumable burst). Minor reorder: "+0.02 Star near water, restores 1 essence (one-shot)".
- **ID Convention:** PASS. `reward_provisions_spring_water_vial` follows `reward_<subcategory>_<snake_case>`.
- **Duplicate Check:** PASS. No collision with existing catalog. "Full Waterskin" and "Veilwater Flask" exist but are distinct items.

### 2. Prayer Focus

- **Name Quality:** REVISION. "Prayer Focus" is generic devotional-RPG language. It reads like a loot category tag, not a specific object. The flavor text describes something far more particular: "A thumb-worn bead of river clay, shaped by a hundred thousand whispered prayers." The name should pull from that physical description. A bead is not a focus -- it is a worry-bead, a rosary element, a tactile thing held during repetition. The flavor text earns a specific material name. Revised to foreground the clay bead.
- **Flavor Text:** PASS. "A thumb-worn bead of river clay, shaped by a hundred thousand whispered prayers. It hums when the veil thins." -- "Thumb-worn" is a precise physical detail that implies years of use. "River clay" is specific material. "Shaped by a hundred thousand whispered prayers" is a good conceit -- the prayers shaped the bead physically, not magically. "It hums when the veil thins" is restrained and sensory. Threadbare-correct.
- **Tags:** PASS. `#star #relic #divine #restoration #faith` -- five tags, all standard.
- **Mechanical Summary:** PASS. "+0.04 Star, restores 1 essence per tick during mystical encounters" accurately describes the passive(star, 0.04) and resource_manipulate(essence, 1, per_tick, condition: in_mystical).
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** PASS. No collision.

### 3. Essence Siphon

- **Name Quality:** REVISION. "Essence Siphon" is a mechanical descriptor, not a name. It describes the item's game function (siphoning essence) using the game's own vocabulary ("essence" is a named resource in this system). Compare to existing catalog items: "Shadowglass Pendant" (material + form), "Ember Sigil" (element + type), "Stasis Pearl" (function + form). None embed a game-mechanical term as the noun. The flavor text describes "a glass tube bound in tarnished silver" that "draws something out of the air near living things." The name should foreground the physical object -- the glass tube, the tarnished silver, the parasitic draw -- without naming the game resource it manipulates. Revised to emphasize the physical form and its unsettling behavior.
- **Flavor Text:** PASS. "A glass tube bound in tarnished silver. It draws something out of the air near living things. They seem not to notice." -- Material specificity (glass, tarnished silver), euphemistic function ("draws something out"), and the chilling final detail ("They seem not to notice"). The ambiguity of "something" is correct: the item's wielder does not fully understand what it takes. Threadbare-excellent.
- **Tags:** PASS. `#veil #relic #arcane #parasitic` -- four tags, lean and appropriate. The `#parasitic` tag is earned by the drain-other mechanic.
- **Mechanical Summary:** PASS. "+0.06 Veil / -0.03 Star (tradeoff), drains 1 quintessence from other agent per tick" accurately describes the tradeoff(veil +0.06, star -0.03) and resource_manipulate(quintessence, -1, per_tick, target: other_agent).
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** PASS. No collision. "Alchemist's Crucible" exists but is a different subcategory and concept.

### 4. Meditation Stones

- **Name Quality:** PASS. "Meditation Stones" is borderline -- "meditation" is slightly generic, but "stones" (plural, unspecified type) saves it from feeling like a yoga-shop product because the flavor text immediately specifies "Five flat stones, each a different shade of grey." The name is a descriptor for a set, not a category label. Acceptable.
- **Flavor Text:** PASS. "Five flat stones, each a different shade of grey. Arranged in the right order, they settle the mind like still water." -- The count and color specificity ("five," "each a different shade of grey") make these concrete objects. "Arranged in the right order" implies a ritual practice with a correct sequence. "Settle the mind like still water" is a simile that matches the function without overstating it. Threadbare-correct.
- **Tags:** PASS. `#star #provision #divine #calm #restoration` -- five tags, all standard.
- **Mechanical Summary:** PASS. "+0.03 Star, restores 1 essence (one-shot) when alone" accurately describes the passive(star, 0.03) and resource_manipulate(essence, 1, one_shot, condition: alone).
- **ID Convention:** PASS. `reward_provisions_meditation_stones`.
- **Duplicate Check:** PASS.

### 5. Quintessence Crucible

- **Name Quality:** REVISION. "Quintessence Crucible" has the same problem as "Essence Siphon" (#3) -- it embeds a game-mechanical resource name ("quintessence") as the defining word in the item name. Players should encounter the name as a physical object, not a system component. The flavor text describes "a vessel of fused obsidian, warm to the touch" that "sweats a clear liquid that smells of lightning." The name should foreground the obsidian vessel, the warmth, or the sweating-lightning detail. Additionally, "Crucible" now collides with the existing "Alchemist's Crucible" (reward_tools_instruments_alchemists_crucible) in the catalog. Having two "[Modifier] Crucible" items creates an echo. Revised to break the collision and remove the game-term.
- **Flavor Text:** PASS. "A vessel of fused obsidian, warm to the touch. It sweats a clear liquid that smells of lightning. The priests who made it did not survive the process." -- Three escalating details: material (fused obsidian, warm), secretion (clear liquid, lightning-smell), and cost (makers died). The final sentence is the strongest -- it communicates power through sacrifice without theatricality. Threadbare-correct.
- **Tags:** PASS. `#veil #relic #arcane #ancient #restoration` -- five tags, all standard.
- **Mechanical Summary:** REVISION. States "+0.08 Veil, restores 2 quintessence per tick, -0.04 Star, decays from +0.08 to +0.02 Veil over time". The effects array shows: decay(veil, startValue: 0.08, changePerTick: -0.003, limitValue: 0.02, destroyAtLimit: false), passive(star, -0.04), resource_manipulate(quintessence, 2, per_tick). The summary says "+0.08 Veil" as if it is a separate passive -- it is not. The +0.08 is the starting value of the decay effect. The summary should clarify that the Veil bonus is decaying, not that there is a flat +0.08 Veil plus a separate decay. Revised: "Veil bonus decays from +0.08 to +0.02 over time, -0.04 Star, restores 2 quintessence per tick".
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** REVISION. "Crucible" collides with "Alchemist's Crucible". See name quality.

### 6. Leather Bandolier

- **Name Quality:** PASS. "Leather" is material-specific. "Bandolier" is the correct term for a cross-body ammunition/weapon carrier. The name is plain and functional in a way that fits T1. It reads like something you buy from a leatherworker, not loot from a dungeon.
- **Flavor Text:** PASS. "Cracked leather and brass buckles, fitted to cross the chest. Room enough for one more blade." -- Worn-out materials (cracked leather), functional construction (cross the chest), and honest capacity ("one more blade" -- not ten, one). Threadbare-correct.
- **Tags:** PASS. `#iron #tool #equipment #carrying` -- four tags, appropriate for an iron-aligned utility item.
- **Mechanical Summary:** PASS. "+0.02 Iron, +1 weapon slot" accurately describes passive(iron, 0.02) and slot_bonus(weapon, 1).
- **ID Convention:** PASS. `reward_tools_instruments_leather_bandolier`.
- **Duplicate Check:** PASS.

### 7. Quartermaster's Harness

- **Name Quality:** PASS. "Quartermaster's" grounds the item in a specific military logistics role -- not "soldier's" or "warrior's," but the person who manages supplies. The possessive tells you who designed it. "Harness" is the correct term for a load-bearing body rig. The name communicates purpose (carrying more) and provenance (military supply chain).
- **Flavor Text:** PASS. "Canvas and ironwork, distributing weight across shoulders and hips. You carry more. You carry it slower." -- Material detail, then two short sentences that state the tradeoff with zero embellishment. The parallel construction ("You carry more. You carry it slower.") is rhythmically effective. Threadbare-correct.
- **Tags:** PASS. `#stone #gold #tool #equipment #carrying #trade` -- six tags. The dual-reach tags (stone + gold) correctly reflect the passive reach and the carrying/trade identity.
- **Mechanical Summary:** PASS. "+0.04 Stone, +1 consumable slot, +1 utility slot, 20% slower movement" accurately describes passive(stone, 0.04), slot_bonus(consumable, 1), slot_bonus(utility, 1), range_modifier(movementCostMultiplier: 1.2).
- **ID Convention:** PASS. `reward_tools_instruments_quartermasters_harness`.
- **Duplicate Check:** PASS.

### 8. Scroll Case

- **Name Quality:** PASS. Simple and correct. A scroll case is a scroll case. The name does not try to be more than what the object is, which is appropriate for a T1 carrying item.
- **Flavor Text:** PASS. "Oiled leather, sealed with wax. Keeps the rain off what matters." -- Two sentences, twelve words of actual description. Material, function, and a quiet value judgment ("what matters" -- the contents are more valuable than the case). Laconic and Threadbare.
- **Tags:** PASS. `#veil #tool #equipment #carrying #scholarly` -- five tags. The `#scholarly` tag is earned by the tome slot bonus.
- **Mechanical Summary:** PASS. "+0.02 Veil, +1 tome slot" accurately describes passive(veil, 0.02) and slot_bonus(tome, 1).
- **ID Convention:** PASS. `reward_tools_instruments_scroll_case`.
- **Duplicate Check:** PASS.

### 9. Bag of Conveyance

- **Name Quality:** PASS. "Conveyance" is a slightly formal word for transport/carrying, which gives the name a bureaucratic or archival quality -- as if this bag was cataloged by someone who did not fully understand it. "Bag" is deliberately plain against the magical function. The contrast works.
- **Flavor Text:** REVISION. "The interior is larger than the exterior. This is not a metaphor. The stitching hums when you reach inside." -- The first two sentences are a problem. "The interior is larger than the exterior" is a direct description of a bag-of-holding trope from D&D/fantasy RPG tradition. "This is not a metaphor" is a knowing, winking aside to the reader that breaks the Threadbare voice. Threadbare flavor text describes phenomena as observed by people who live in this world, not as references to genre conventions the reader will recognize. The third sentence ("The stitching hums when you reach inside") is excellent and Threadbare -- a physical, sensory detail. The first two sentences should be replaced with grounded description of the bag's physical appearance and the unsettling experience of using it.
- **Tags:** PASS. `#gold #veil #arcane #equipment #carrying #ancient` -- six tags, appropriate for a T3 dual-reach item.
- **Mechanical Summary:** PASS. "+0.06 Gold, +0.04 Veil, +2 consumable slots, +1 wealth slot, restores 1 essence (one-shot)" accurately describes all five effects.
- **ID Convention:** PASS. `reward_tomes_scrolls_bag_of_conveyance`. However, note the subcategory mismatch: the ID says `tomes_scrolls` and the properties set `subcategory: 'tomes_scrolls'`, but the item is a bag. It is not a tome or a scroll. This should be `tools_instruments` with a corresponding ID update. See batch-level notes.
- **Duplicate Check:** PASS.
- **Subcategory:** REVISION. A bag is not a tome or scroll. The existing Pack Goat (reward_mounts_beasts) demonstrates that carrying items go in their physical-form subcategory, not the subcategory of what they carry. The Bag of Conveyance should be `tools_instruments` with ID `reward_tools_instruments_bag_of_conveyance`.

### 10. Sealed Bounty Scroll

- **Name Quality:** PASS. "Sealed" communicates the unopened/charged state. "Bounty" implies reward and mercantile value. "Scroll" is the physical form. The name tells you what the item is (sealed document) and what it promises (bounty) without overselling.
- **Flavor Text:** PASS. "Heavy parchment sealed with a merchant-guild stamp. Break the wax, and something of value falls out. Twice." -- Material (heavy parchment), institutional provenance (merchant-guild stamp), physical interaction (break the wax), and the charge count stated as a one-word sentence ("Twice."). Laconic, functional, Threadbare-correct.
- **Tags:** PASS. `#gold #scroll #reward #discovery` -- four tags, appropriate.
- **Mechanical Summary:** PASS. "+0.04 Gold, 2 charges -- each use grants a random item from a curated pool" accurately describes the passive, consumable_charge(2), and content_grant(random selection from template list).
- **ID Convention:** PASS. `reward_tomes_scrolls_sealed_bounty_scroll`.
- **Duplicate Check:** PASS.

### 11. Tithe Box

- **Name Quality:** PASS. "Tithe" is specific -- a religious tax or offering, not a donation or gift. "Box" is plain and physical. The combination evokes roadside shrines and institutional religion at the village level. The name is both an object and a practice.
- **Flavor Text:** PASS. "A wooden box carved with a saint's face, left at a crossroads shrine. Someone filled it. Someone always fills it." -- Material and location (wooden box, crossroads shrine), the saint's face implies institutional religion, and the repetition ("Someone filled it. Someone always fills it.") creates an eerie sense of inevitability. The anonymous generosity is more unsettling than comforting. Threadbare-correct.
- **Tags:** PASS. `#heart #star #offering #divine #discovery` -- five tags. Dual-reach tags correctly reflect the passive(heart) and the divine/offering theme.
- **Mechanical Summary:** REVISION. States "+0.03 Heart, restores 1 essence (one-shot), grants a prayer scroll or healing poultice". The content_grant's templateIds list three items, not two: `reward_tomes_scrolls_prayer_scroll`, `reward_provisions_healing_poultice`, and `reward_condition_fortune_kissed`. The summary says "a prayer scroll or healing poultice" but omits the third option (Fortune-Kissed condition). Revised to include all three.
- **ID Convention:** PASS. `reward_tomes_scrolls_tithe_box`. Same subcategory concern as the Bag of Conveyance -- a wooden box is not a tome or scroll. However, the Tithe Box functions as a sealed document/offering container and is consumed upon opening, which is closer to the tomes_scrolls consumption pattern than tools_instruments. Borderline. PASS with note -- if the Bag of Conveyance subcategory is changed, this one should be reviewed too, but the case is weaker.
- **Duplicate Check:** PASS.

### 12. Salvage Kit

- **Name Quality:** PASS. "Salvage" communicates purpose (recovering useful things from wreckage/wilderness). "Kit" is functional and low-tier-appropriate. The name sounds like something a quartermaster would issue. Clean and honest.
- **Flavor Text:** PASS. "Wire cutters, a pry bar, three sizes of bag. Everything you need to take apart what someone else put together." -- The tool list (wire cutters, pry bar, bags) is specific and physical. The second sentence reframes salvage as a mirror of construction -- taking apart vs. putting together. The implied disrespect for previous builders gives the item character. Threadbare-correct.
- **Tags:** PASS. `#stone #tool #scavenging #discovery #wilderness` -- five tags, appropriate for a stone-aligned exploration/scavenging tool.
- **Mechanical Summary:** PASS. "+0.04 Stone, grants a random provision or tool when exploring, +0.02 Stone in wilderness" accurately describes the passive(stone, 0.04), conditional(in_wilderness, stone, 0.02), and content_grant(random from template list).
- **ID Convention:** PASS. `reward_tools_instruments_salvage_kit`.
- **Duplicate Check:** PASS.

---

## Batch-Level Checks

### Variety Assessment

- **Reach diversity:** MARGINAL PASS. Star(3), Veil(2), Gold(2), Stone(2), Iron(1), Heart(1). Star dominates the resource_manipulate section -- Spring Water Vial, Prayer Focus, and Meditation Stones are all Star-primary. The three Star items also share the `#restoration` and `#divine` tags, making them feel like a graduated set (T1 consumable, T1 provision, T2 relic) rather than three distinct designs. The batch is not all-same-reach (six reaches are present), so no automatic REVISE trigger fires, but future batches should avoid concentrating three items in a single reach within one primitive section.
- **Tier spread:** PASS. T1(4), T2(6), T3(2). Good distribution with no T3+ bloat.
- **Primitive variety:** PASS. All three target primitives well-represented: resource_manipulate(7), slot_bonus(6), content_grant(3). Good pairing variety with conditional, tradeoff, decay, passive, range_modifier, and consumable_charge as supporting primitives.
- **Subcategory variety:** PASS after revision. relics_talismans(3), tools_instruments(5 after Bag of Conveyance move), provisions(2), tomes_scrolls(2). Reasonable distribution.

### Naming Patterns

- **Generic names:** Two items flagged: Prayer Focus (#2, generic devotional RPG), Essence Siphon (#3, game-mechanical term). Both revised.
- **Game-term-as-name:** Two items flagged: Essence Siphon (#3, "Essence" is a game resource), Quintessence Crucible (#5, "Quintessence" is a game resource). Both revised.
- **External collision:** Quintessence Crucible collides with Alchemist's Crucible (existing catalog). Revised.
- **Internal collision:** None.
- **Construction variety:** Adequate. Material-form (Spring Water Vial, Leather Bandolier, Scroll Case), possessive (Quartermaster's Harness), noun-noun (Meditation Stones, Salvage Kit, Tithe Box), compound (Sealed Bounty Scroll), article-compound (Bag of Conveyance). After revisions, all twelve items use at least four distinct naming constructions.

### Tone Consistency

- No exclamation marks.
- No epic-scale language.
- One tone break: Bag of Conveyance flavor text uses a meta-narrative wink ("This is not a metaphor") that addresses the reader rather than describing the world. Revised.
- Flavor text is otherwise solid. Highlights: Essence Siphon's "They seem not to notice," Scroll Case's twelve-word compression, Quintessence Crucible's "The priests who made it did not survive the process."

### Mechanical Summary Accuracy

- Two summaries contain inaccuracies:
  - Quintessence Crucible (#5): presents decaying Veil bonus as if it were a flat passive plus separate decay.
  - Tithe Box (#11): omits one of three content_grant template options (Fortune-Kissed).
- One summary has a misleading ordering:
  - Spring Water Vial (#1): leads with one-shot effect before the persistent conditional.
- These are the common editorial failure mode: the author wrote the summary from intent rather than from the effects[] data.

### ID Convention

- All IDs follow `reward_<subcategory>_<snake_case_name>`.
- One subcategory mismatch: Bag of Conveyance uses `tomes_scrolls` but should be `tools_instruments`.

### Tag Conventions

- All reach tags are valid against REACH_DOMAINS: iron, gold, shadow, veil, heart, eye, stone, star.
- No non-standard tags found.
- Tag counts range from 4 to 6, consistent with catalog norms.

### Batch Summary Data Quality

- **Item count in header (line 10):** "12 possessions" -- the batch contains 12 items. PASS.
- **Tier spread in header (line 11):** "T1 x4, T2 x6, T3 x2" -- PASS, matches items.
- **Subcategories in header (line 12):** "relics_talismans (4), tools_instruments (4), provisions (2), tomes_scrolls (2)" -- after the Bag of Conveyance subcategory correction, this should read "relics_talismans (3), tools_instruments (5), provisions (2), tomes_scrolls (2)". REVISION.
- **CONTENT_GRANT section header (line 220):** States "CONTENT_GRANT items (4 -- includes Bag of Conveyance above)". The Bag of Conveyance uses resource_manipulate and slot_bonus but does NOT use content_grant. The section header incorrectly claims 4 content_grant items including it. Actual content_grant items: Sealed Bounty Scroll, Tithe Box, Salvage Kit = 3. REVISION.
- **Summary table (lines 320-335):** Row 12 (Bag of Conveyance) lists Target Primitive(s) as "slot_bonus (x2), resource_manipulate" -- this is correct. The CONTENT_GRANT section header is the error, not the summary table.

---

## Summary of Revisions

| # | Item | Issue | Action |
|---|------|-------|--------|
| 1 | Spring Water Vial | Mechanical summary leads with one-shot before persistent conditional | Reordered summary |
| 2 | Prayer Focus | Name is generic devotional-RPG ("Focus") | Renamed to "River Clay Bead" |
| 3 | Essence Siphon | Name uses game-mechanical resource term ("Essence") | Renamed to "Tarnished Draw-Tube" |
| 5 | Quintessence Crucible | Name uses game-mechanical resource term ("Quintessence"); "Crucible" collides with existing Alchemist's Crucible; summary misrepresents decay as flat passive | Renamed to "The Sweating Vessel"; revised summary |
| 9 | Bag of Conveyance | Flavor text breaks Threadbare tone with meta-narrative wink; subcategory should be tools_instruments, not tomes_scrolls | Revised flavor text; changed subcategory and ID |
| 11 | Tithe Box | Summary omits third content_grant option (Fortune-Kissed) | Revised summary |
| -- | Batch Summary | Subcategory counts wrong after #9 move; CONTENT_GRANT section header falsely claims 4 items including Bag of Conveyance | Corrected header data |
