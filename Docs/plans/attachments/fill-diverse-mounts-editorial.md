# Editorial Review: fill-diverse-mounts
> Reviewer: Editorial Agent | Date: 2026-04-07
> Mode: fill (new items -- full name/tone/quality review)

## Verdict: PASS WITH REVISIONS

Strong batch that fulfills its brief well -- every underserved reach gets a mount/beast that reads as a creature shaped by its cosmic domain, not a warhorse with different paint. Threadbare tone is consistently good across all eight items; no exclamation marks, no epic inflation. Mechanical summary accuracy is high with only one discrepancy found. Two items need name revisions (one generic, one internal collision), one needs a tag correction, and one has a summary inaccuracy. The batch's greatest strength is its design rationale -- each reach's interpretation of "mount/beast" is distinct and earns its flavor.

---

## Per-Item Review

### 1. Dustwalker

- **Name Quality:** PASS. A single compound noun that communicates movement ("walker") through a specific medium ("dust"). It implies terrain, silence, and something lean. The name avoids the "[Adjective] [Animal]" pattern that dominates the existing mount catalog, which is good for variety. It reads more as a title the creature earned than a breed name.
- **Flavor Text:** PASS. "A gaunt grey thing with hooves wrapped in rags. It makes no sound on any surface and will not approach firelight." -- Three details that earn the Shadow reach: gaunt (underfed or bred lean), rags on hooves (pragmatic stealth modification), and aversion to firelight (behavioral, not magical). The physical description is grounded -- "a gaunt grey thing" refuses to name what kind of animal it is, which is more unsettling than specificity. Threadbare-correct.
- **Tags:** PASS. `#beast #mount #shadow #stealth #wilderness` -- five tags, all standard. Shadow-primary with stealth and wilderness niche. The `#mount` tag is earned (it is ridden, unlike the Hearthbound Hound).
- **Mechanical Summary:** PASS. "+0.04 Shadow, 15% reduced movement cost, +0.03 Shadow in enemy territory (ambush positioning)" accurately describes the passive(shadow, 0.04) + range_modifier(0.85) + conditional(in_enemy_territory, shadow, 0.03). The parenthetical "(ambush positioning)" is a valid flavor gloss.
- **ID Convention:** PASS. `reward_mounts_beasts_dustwalker`.
- **Duplicate Check:** PASS. No collision with existing names.

### 2. Cindermaw

- **Name Quality:** REVISION. "Cindermaw" is a compound of two high-fantasy nouns ("cinder" + "maw") that reads as a generated-fantasy-name-generator output. It belongs in the same bucket as "Shadowfang," "Dreadmaw," or "Ashclaw" -- compound words where each half is independently evocative but the combination is generic fantasy shorthand for "scary beast." The flavor text describes the creature far more specifically: a wolf the size of a yearling calf, black as wet charcoal, with smoke leaking from between its teeth. The name should pull from that grounded physical specificity rather than assembling two dark-sounding syllables. The "maw" suffix in particular is overused in fantasy creature naming (Deathclaw, Shadowmaw, Cindermouth, etc.). Revised to foreground the smoke and the wolf's physicality.
- **Flavor Text:** PASS. "A wolf the size of a yearling calf, black as wet charcoal. Smoke leaks from between its teeth when it breathes. It chose you. You did not choose it." -- Four images: size comparison (yearling calf -- specific livestock reference), color simile (wet charcoal -- not "midnight" or "obsidian"), physical detail (smoke from teeth), and the relationship inversion (it chose you). The final two sentences establish agency and menace without theatricality. The smoke detail earns the Shadow reach through sensory description, not magical assertion. Threadbare-excellent.
- **Tags:** PASS. `#beast #mount #shadow #combat #intimidation` -- five tags, appropriate for a T3 shadow predator mount. The `#intimidation` tag is well-earned by the shroud aura.
- **Mechanical Summary:** PASS. "+0.07 Shadow, +0.03 Iron, 15% reduced movement cost, grants shadow_strike trait, enemies in 1 hex: -0.03 Eye (shroud aura)" accurately describes all five effects: passive(shadow, 0.07), passive(iron, 0.03), range_modifier(0.85), trait_grant(shadow_strike), aura(1, enemies, eye, -0.03). The "(shroud aura)" parenthetical correctly characterizes the enemy Eye debuff.
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** PASS. No collision.

### 3. Veilstag

- **Name Quality:** REVISION. "Veilstag" follows the exact same compound pattern as "Cindermaw" -- [ReachName][Animal]. It is literally "[reach]+[creature type]" with no additional specificity, which is the naming equivalent of calling an Iron sword "Ironsword." Compare this to the existing catalog: "Tracking Hound" (function + animal), "Steppe Mare" (habitat + breed), "Pack Goat" (purpose + animal). None embed the reach name as a prefix. The flavor text describes a white hart with too many antler points whose hooves leave no prints but shimmer the air. The name should draw from the physical description -- the whiteness, the excess antler points, or the heat-shimmer trail. Revised to foreground the creature's most distinctive physical feature.
- **Flavor Text:** PASS. "A white hart with too many antler points. Its hooves leave no prints but the air shimmers where it stepped, as if heat were rising from snow." -- "Too many antler points" is the standout detail: it marks the creature as wrong, not magical. The heat-from-snow simile contradicts normal physics in a specific, observable way -- anyone would notice this, not just a sorcerer. The description works because it describes phenomena a tracker would see (no prints, shimmer) rather than effects a mage would detect. Threadbare-correct.
- **Tags:** PASS. `#beast #mount #veil #mystical #exploration` -- five tags, appropriate for a Veil-primary exploration mount.
- **Mechanical Summary:** PASS. "+0.04 Veil, 10% reduced movement cost, +1 awareness hex range, +0.03 Veil in mystical encounters" accurately describes the passive(veil, 0.04) + range_modifier(0.9, awarenessRangeBonus: 1) + conditional(in_mystical, veil, 0.03).
- **ID Convention:** Will need update after name revision.
- **Duplicate Check:** PASS. No collision.

### 4. Glimmermoth

- **Name Quality:** PASS. "Glimmermoth" uses the same compound pattern as Cindermaw and Veilstag, but it works here because there is no reach called "Glimmer" -- the first element describes the creature's visual quality (luminescence), not its cosmic domain. "Moth" is an unexpected mount/companion form that immediately distinguishes this item from every other beast in the catalog (horses, hounds, goats, wolves, stags). The compound reads as a naturalist's field name rather than a fantasy epithet: you can imagine a scholar naming this species. Acceptable.
- **Flavor Text:** PASS. "Larger than any moth should be and luminous at the wing-edges. It navigates by ley-lines that no cartographer has mapped. When it lands on your shoulder the weight is barely there, but the world looks different." -- "Larger than any moth should be" establishes wrongness through understatement. "Luminous at the wing-edges" is specific (edges, not entire wings). "The weight is barely there" is a physical detail that explains why this creature works as a companion despite being an insect. "The world looks different" is a restrained way to describe altered perception. Threadbare-correct.
- **Tags:** PASS. `#beast #mount #veil #mystical #arcane` -- five tags. However, note that the niche description says the Glimmermoth "is not ridden in the traditional sense" -- the `#mount` tag is borderline. The existing Tracking Hound (a companion, not ridden) uses `#beast` without `#mount`, which is a precedent. That said, the Glimmermoth "carries its bonded through liminal spaces" according to the niche, which is functionally mounting. The `#mount` tag is defensible. PASS with note.
- **Mechanical Summary:** PASS. "+0.06 Veil, +0.03 Eye, 15% reduced movement cost, +2 awareness hex range, immune to fear/illusion tags, amplifies mystical encounters (1.3x)" accurately describes all five effects: passive(veil, 0.06), passive(eye, 0.03), range_modifier(0.85, awarenessRangeBonus: 2), tag_immunity([fear, illusion]), behavior_weight(veil, 1.3). The summary says "amplifies mystical encounters" but the behavior_weight reach is `veil`, not a direct "mystical" amplifier -- behavior_weight multiplies the encounter steering weight for that reach, which indirectly amplifies mystical-flavored encounters. The summary's phrasing is a reasonable shorthand. PASS.
- **ID Convention:** PASS. `reward_mounts_beasts_glimmermoth`.
- **Duplicate Check:** PASS. No collision.

### 5. Hearthbound Hound

- **Name Quality:** PASS. "Hearthbound" is a good compound: it communicates loyalty (bound), domesticity (hearth), and the Heart reach through association rather than direct naming. "Hound" is honest about the creature type. The name reads as a folk term villagers would use. However, note the existing "Tracking Hound" and "War Hound" in the catalog -- this is the third "[Modifier] Hound." The pattern is not yet overused (three out of ten mounts is defensible, and each modifier is distinct: purpose, martial role, emotional bond), but future batches should avoid adding a fourth. PASS with note.
- **Flavor Text:** PASS. "It followed a dead woman for nine days before it found you. Now it sleeps across your doorway and will not let strangers pass without your word." -- The dead woman detail is the standout: the hound's previous bond ended in death, and the nine-day following (a specific number, not "days" or "a long time") implies either grief or instinct that persists past its object. The doorway behavior is immediately recognizable to anyone who has owned a protective dog. The shift from past (dead woman) to present (your doorway) tells a compressed story. Threadbare-excellent.
- **Tags:** REVISION. `#beast #heart #loyalty #social #companion` -- missing `#mount` tag. This is correct if the hound is not ridden (the niche says "Not a mount but a bonded beast -- it walks beside you, not beneath you"), but the existing Tracking Hound also lacks `#mount` and has `#beast #eye #survival #wilderness`. The Hearthbound Hound should be consistent. The concern is the missing subcategory-typical tags: no `#wilderness`, no `#travel`. These are appropriate to omit for a social-domain companion that operates in settlements, not wild terrain. However, all three existing non-mount hounds/beasts in the catalog include `#wilderness`. The omission here is intentional and defensible -- the Hearthbound Hound is a doorstep creature, not a trail companion. PASS on the wilderness omission, but the tag set has five tags where the Tracking Hound has four and the War Hound has five, so the count is fine. No revision needed on re-examination.
- **Mechanical Summary:** REVISION. States "+0.04 Heart, +0.02 Iron, cooperation +0.15 toward allies, when damaged: +0.04 Heart for 3 ticks (8-tick cooldown, protective instinct)". The effects array shows a reactive with `destroyOnExpiry: true` on the duration sub-effect. This is the standard reactive pattern (same as Steppe Mare's flee-on-damage). The summary omits `destroyOnExpiry: true` but this is consistent with how every other item in the catalog documents reactive durations -- none include it. PASS on that point. The rest accurately describes all four effects: passive(heart, 0.04), passive(iron, 0.02), social_modifier(ally, cooperationBias: 0.15), reactive(damaged, duration 3 ticks heart 0.04, cooldown 8). PASS on re-examination. No revision needed.
- **ID Convention:** PASS. `reward_mounts_beasts_hearthbound_hound`.
- **Duplicate Check:** PASS. No collision with "Tracking Hound" or "War Hound" -- all three share "Hound" but the modifiers are distinct.

### 6. Sorrowheart Mare

- **Name Quality:** PASS. "Sorrowheart" is an excellent compound: "sorrow" communicates the emotional weight the creature carries, and "heart" anchors the reach without being literal (it is not called "Heartmare"). "Mare" specifies breed and gender, echoing "Steppe Mare" in the existing catalog -- but the modifier is so different (geographic vs. emotional) that the echo reads as a deliberate parallel, not a collision. The name tells you what riding this horse feels like. Strong.
- **Flavor Text:** PASS. "She carries grief the way other horses carry weight -- steadily, without stumbling. Wounded soldiers stop screaming when she walks through camp. No one knows why." -- The opening simile redefines "carry" from physical to emotional. "Wounded soldiers stop screaming" is visceral and immediate -- the effect is not gentle calm but the cessation of agony, which is more specific and more disturbing. "No one knows why" refuses to explain the mechanism, which is Threadbare-perfect: the world contains phenomena that resist classification. Outstanding.
- **Tags:** PASS. `#beast #mount #heart #empathy #social #healing` -- six tags, on the high side but all earned. The `#healing` tag is justified by the calming aura and empathic_bond trait.
- **Mechanical Summary:** PASS. "+0.08 Heart, +0.03 Gold, 20% reduced movement cost, allies in 1 hex: +0.02 Heart (calming aura), grants empathic_bond trait" accurately describes all five effects: passive(heart, 0.08), passive(gold, 0.03), range_modifier(0.8), aura(1, allies, heart, 0.02), trait_grant(empathic_bond).
- **ID Convention:** PASS. `reward_mounts_beasts_sorrowheart_mare`.
- **Duplicate Check:** PASS. "Steppe Mare" exists but the names are clearly distinct.

### 7. Dawnfeather Kestrel

- **Name Quality:** PASS. "Dawnfeather" is a compound that communicates the bird's visual quality (dawn-colored plumage) and the Star reach's association with celestial timing. "Kestrel" is a specific raptor species -- not "hawk," "eagle," or "falcon," but a small, hovering hunter known for exceptional eyesight. The species choice is mechanically coherent: kestrels hunt by hovering and watching, which maps to the +3 awareness range. The name reads as a falconer's breed designation. Good.
- **Flavor Text:** PASS. "It perches on your shoulder at dawn and screams at things that have not happened yet. By the time you understand its warning, you are already moving." -- Two sentences with a time-logic structure: the bird perceives the future; you react before comprehension catches up. "Screams at things that have not happened yet" is a clean description of prescience without using the word "prophecy" or "oracle." The second sentence captures the feeling of instinct overriding cognition. Threadbare-correct.
- **Tags:** PASS. `#beast #star #prophecy #awareness #companion` -- five tags, appropriate for a Star-primary awareness companion. No `#mount` tag, which is correct -- kestrels are not ridden. The `#companion` tag is appropriate (compare the Hearthbound Hound's `#companion` tag).
- **Mechanical Summary:** REVISION. States "+0.06 Star, +0.04 Eye, +3 awareness hex range, amplifies exploration encounters (1.2x), when encounter starts: +0.03 Star for 4 ticks (6-tick cooldown, prescient warning)". The behavior_weight in the effects array has `reach: 'eye'` with `multiplier: 1.2`. The summary says "amplifies exploration encounters" -- but behavior_weight does not amplify "exploration encounters" directly. It multiplies the Eye-reach steering weight for encounter selection, which biases the agent toward Eye-flavored encounters (which tend to be exploratory). The phrasing is a reasonable shorthand for a player-facing summary, and is consistent with how existing items describe behavior_weight (the Tracking Hound's summary says "amplifies exploration encounters (1.3x)" with the same pattern: behavior_weight on eye). PASS on re-examination.

  The rest accurately describes all five effects. However, note that the summary includes the cooldown value "(6-tick cooldown)" which is correct per the effects array. PASS.
- **ID Convention:** PASS. `reward_mounts_beasts_dawnfeather_kestrel`.
- **Duplicate Check:** PASS. No collision.

### 8. The Pale Pilgrim

- **Name Quality:** PASS. "The Pale Pilgrim" uses the definite article ("The") to signal singularity -- there is one of these, not a breed. "Pale" is specific without being cliche (not "White," "Silver," or "Moonlit"). "Pilgrim" implies purposeful travel toward something sacred, which maps to the Star/Veil dual-reach and the fate-touched narrative. The name suggests the creature is on its own journey and you are part of it, not that it serves you. The construction mirrors "The Quiet Blade" in the existing catalog (definite article + adjective + noun for legendary items). Appropriate for the game's first T4 mount.
- **Flavor Text:** PASS. "No breed anyone can name. Coat like moonlight on still water. It appeared at the crossroads on the longest night and waited, as though it had always known you would come. The old woman at the wayshrine said it had been waiting for a century." -- Four sentences that build from mystery (no breed) through beauty (moonlight on water) to encounter (crossroads, longest night) to temporal scope (a century). The old woman at the wayshrine is the best detail: she provides third-party testimony and a folk-memory frame. "As though it had always known" does not confirm the creature's prescience, only your impression. The paragraph is longer than other flavor texts in this batch but appropriate for a T4 legendary. Threadbare-correct.
- **Tags:** PASS. `#beast #mount #star #veil #legendary #celestial` -- six tags. The `#legendary` tag is appropriate for the only T4 in the batch. The `#celestial` tag is earned by the Star reach and the starborne_rider trait.
- **Mechanical Summary:** PASS. "+0.06 Star, +0.04 Veil, +0.03 Eye, 25% reduced movement cost, +2 awareness hex range, immune to fear/curse tags, allies in 1 hex: +0.02 Star (fate-touched aura), grants starborne_rider trait" accurately describes all seven effects: passive(star, 0.06), passive(veil, 0.04), passive(eye, 0.03), range_modifier(0.75, awarenessRangeBonus: 2), tag_immunity([fear, curse]), aura(1, allies, star, 0.02), trait_grant(starborne_rider).
- **ID Convention:** PASS. `reward_mounts_beasts_pale_pilgrim`.
- **Duplicate Check:** PASS. No collision.

---

## Batch-Level Checks

### Variety Assessment

- **Reach diversity:** PASS. Five reaches represented across 8 items: Shadow(2), Veil(2), Heart(2), Star(1 primary + T4 primary), multi-reach(1). No Iron, Gold, Eye, or Stone as primary -- which is correct, as the batch summary explicitly states these are the underserved reaches. The existing catalog covers Iron (T2-T3), Gold (T1-T2), Eye (T1), Stone (T1).
- **Tier spread:** PASS. T2(4), T3(3), T4(1). No T1 items, which is appropriate -- T1 mounts are already well-served (Draft Pony, Tracking Hound, Pack Goat in reward catalog + Road-Worn Mule in starters). The batch fills upward gaps.
- **Primitive variety:** PASS. Ten distinct primitives across 8 items: passive(8), range_modifier(7), conditional(2), trait_grant(3), aura(3), tag_immunity(2), behavior_weight(2), social_modifier(1), reactive(2). All target primitives listed in the batch summary are represented. Excellent variety.
- **Loss condition variety:** PASS. stealable(2) on T2 items (Dustwalker, Veilstag), permanent(6) on T2-T4 items with narrative bond justification. The split is defensible: T2 mundane-ish mounts can be stolen; bonded/mystical creatures cannot.

### Naming Patterns

- **No automatic REVISE triggers for all-same-reach:** PASS. Four different primary reaches.
- **Generic fantasy names:** One item flagged: Cindermaw (#2). Compound of two generic dark-fantasy syllables. Revised.
- **Reach-as-prefix names:** One item flagged: Veilstag (#3). Literal [ReachName][Animal] construction. Revised.
- **Internal collision:** None.
- **External collision with existing catalog:** None. No collision with Draft Pony, Road-Worn Mule, Pack Goat, Tracking Hound, War Hound, Steppe Mare, Ashenmane Horse, or Ashenmane Destrier.
- **Construction variety:** Good. Single compound (Dustwalker, Glimmermoth), compound+animal (Dawnfeather Kestrel), emotion+breed (Sorrowheart Mare), possessive-less compound+animal (Hearthbound Hound), definite article (The Pale Pilgrim). After revisions, all eight names use distinct constructions.

### Tone Consistency

- No exclamation marks.
- No epic-scale language. The Pale Pilgrim's flavor text approaches grandeur ("a century") but earns it through a folk-memory frame (the old woman's testimony) rather than authorial assertion. Appropriate for T4.
- Flavor text is uniformly strong. Highlights: Hearthbound Hound's dead woman detail, Sorrowheart Mare's "wounded soldiers stop screaming," Dustwalker's refusal to name the species, The Pale Pilgrim's old woman at the wayshrine.
- The Design Rationale section is clear and demonstrates understanding of how each reach reinterprets the mount/beast concept.

### Mechanical Summary Accuracy

- All eight summaries accurately describe their effects arrays when read against the data.
- No cases of summaries describing effects not present in the effects array -- an improvement over some prior batches.
- No cases of summaries inventing conditionals or cooldown cycles not in the data.

### Tag Conventions

- All reach tags are valid: shadow, veil, heart, star, iron (secondary on #2 and #5), gold (secondary on #6), eye (secondary on #4 and #7).
- No non-standard tags found.
- Tag counts range from 5 to 6, which is consistent across the batch and within catalog norms.

### Batch Summary Data Quality

- Tier spread in header (line 11): "T2 x4, T3 x3, T4 x1" -- PASS, matches items.
- Reach spread in header (line 12): "Shadow x2, Veil x2, Heart x2, Star x1, multi-reach x1 (T4)" -- PASS, matches items.
- Summary table (lines 289-298): All rows accurate.
- Reach Coverage table (lines 300-308): Accurate.
- Primitive Coverage table (lines 310-322): Accurate.
- Balance Audit table (lines 324-335): Accurate.

---

## Summary of Revisions

| # | Item | Issue | Action |
|---|------|-------|--------|
| 2 | Cindermaw | Name is generic fantasy compound ([dark syllable]+[body part]) | Renamed to "Smoke-Tooth" |
| 3 | Veilstag | Name is literal [ReachName][Animal] construction | Renamed to "Shimmer Hart" |
