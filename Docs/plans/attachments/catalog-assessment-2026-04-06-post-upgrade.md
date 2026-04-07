# Content Catalog Assessment — 2026-04-06 (Post-Upgrade)

> Full re-assessment after 121 items upgraded with composable effects.
> Previous assessment: `catalog-assessment-2026-04-06.md`

## Executive Summary

- **Total items scanned:** 157 across 6 catalog files
  - Reward catalog: 93 items (59 possessions, 26 conditions, 13 bestowed powers, 5 treasure maps)
  - Starter attachments: 12 items (8 possessions, 4 conditions)
  - Anomaly rewards: 24 items (10 artifacts, 8 bestowed powers, 6 conditions)
  - Agreement templates: 6 items
  - Artifact templates: 3 items (T4 legendary)
  - Spell templates: 5 items (T2-T4)
- **Alive:** 147 (94%) -- has composable effects with non-passive primitives
- **Dead:** 10 (6%) -- reachBonus/domainContributions only, no effects array
- **Empty cells:** 236 of 308 in the reach x subcategory x tier matrix (77%)
- **Effect primitives unused (of 39):** 5 (haste, slow, freeze_duration, hex_effect, graph_mutation)
- **Effect primitives THIN (1-2 uses):** 6 (permanent, content_grant, resource_manipulate, slot_bonus, transform, dispel)
- **Spheres with < 3 items:** 12 of 12 (no items have sphereAffinity; only spells/encounters do)
- **Tags with supply deficit:** 3 (#survival, #healing, #craft)

### Top 5 Critical Gaps

1. **5 primitives completely unused:** haste, slow, freeze_duration, hex_effect, graph_mutation -- zero items exercise these mechanics
2. **No Time, Flesh, or Life reach items in any possession subcategory** -- three entire reaches have zero possession coverage
3. **10 dead items remain** (7 treasure maps + Pilgrim's Robe + 2 intelligence items + 3 starter conditions) -- these still use reachBonus/domainContributions only
4. **No sphereAffinity on any non-spell item** -- sphere dimension is completely uncovered for possessions/conditions/bestowed powers
5. **Mounts & Beasts have no T4 items** and only 1 T3 item -- thin coverage at higher tiers

### Recommended First Batch
`/content-catalog upgrade "Dead items: 7 treasure maps + Pilgrim's Robe + 2 intelligence items"` -- eliminates all remaining dead possessions in the reward catalog

---

## Dimension 1: Reach x Subcategory x Tier Matrix

Items are classified by primary reach (determined from `effects[]` reach values and tags). Items touching multiple reaches are counted under their primary reach.

### Arms

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron | 4 Alive + 1 Alive (starter) | 4 Alive | 2 Alive | 1 Alive |
| Gold | -- | -- | -- | -- |
| Shadow | -- | -- | 1 Alive (Double-Edged) | 1 partial (Quiet Blade, iron+shadow) |
| Veil | -- | -- | -- | -- |
| Heart | -- | -- | -- | -- |
| Eye | -- | -- | -- | -- |
| Stone | -- | -- | -- | -- |
| Star | -- | -- | 1 Alive (Starfall Longbow) | -- |
| Flesh | -- | -- | -- | -- |
| Time | -- | -- | -- | -- |
| Life | -- | -- | -- | -- |

**Notes:** Arms are heavily Iron-dominated (12 of 14 arms items are #iron). Star Metal Shard (anomaly, T3) also classified as Iron+Star arms. Zero arms items for Gold, Veil, Heart, Eye, Stone, Flesh, Time, or Life reaches.

### Mounts & Beasts

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron | -- | 1 Alive (War Hound) | 1 Alive (Destrier) | -- |
| Gold | 1 Alive (Draft Pony) + 1 Alive (starter Mule) | 1 Alive (Steppe Mare) | -- | -- |
| Shadow | -- | -- | -- | -- |
| Veil | -- | -- | -- | -- |
| Heart | -- | -- | -- | -- |
| Eye | 1 Alive (Tracking Hound) | -- | -- | -- |
| Stone | 1 Alive (Pack Goat) | -- | -- | -- |
| Star | -- | -- | -- | -- |
| Flesh | -- | -- | -- | -- |
| Time | -- | -- | -- | -- |
| Life | -- | -- | -- | -- |

**Notes:** No T4 mounts exist. No mounts for Shadow, Veil, Heart, Star, Flesh, Time, or Life. Starter has 1 T2 mount (Ashenmane Horse, Iron-adjacent).

### Vestments

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron | 1 Alive (Padded Jerkin) | 1 Alive (Chainmail) | -- | -- |
| Gold | 1 Alive (Merchant Silks) | -- | -- | -- |
| Shadow | -- | 1 Alive (Shadowweave) | 1 Alive (Mantle Unremembered) | -- |
| Veil | -- | -- | -- | 1 Alive (Woven Sky, star+veil) |
| Heart | -- | 1 Alive (Moonpearl, anomaly) | -- | -- |
| Eye | -- | -- | -- | -- |
| Stone | -- | -- | -- | -- |
| Star | 1 Dead (Pilgrim's Robe) | -- | -- | 1 Alive (Woven Sky) |
| Flesh | -- | -- | -- | -- |
| Time | -- | -- | -- | -- |
| Life | -- | -- | -- | -- |

**Notes:** Starter has 1 T1 vestment (Traveler's Cloak). Pilgrim's Robe is the only dead vestment.

### Tomes & Scrolls

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron | -- | -- | -- | -- |
| Gold | 1 Alive (Merchant's Ledger) + 1 Alive (Letters of Introduction) | -- | -- | -- |
| Shadow | 1 Alive (Smuggler's Chart) | -- | -- | -- |
| Veil | -- | 2 Alive (Veilscript, Fading Ward) | -- | 1 Alive (Codex of Unmaking) |
| Heart | -- | -- | -- | -- |
| Eye | 1 Alive (Field Journal) + 1 Dead (Faded Treasure Map) | 1 Alive (Chronicle) + 2 Dead (Cartographer's Survey, Tomb Raider's Journal) | -- | -- |
| Stone | -- | -- | -- | -- |
| Star | 1 Alive (Prayer Scroll) | 1 Alive (starter Burned Codex) | 1 Alive (Silent Testament) | -- |
| Flesh | -- | -- | -- | -- |
| Time | -- | -- | -- | -- |
| Life | -- | -- | -- | -- |

**Notes:** 3 dead treasure maps (reachBonus only). Anomaly has 1 T3 tome (Sealed Codex, Eye+Star). Ancient Waystone Rubbing (T3) also dead.

### Tools & Instruments

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron | -- | -- | -- | -- |
| Gold | 1 Alive (Gate Seal Case, eye+gold) | -- | -- | -- |
| Shadow | -- | -- | -- | -- |
| Veil | -- | 1 Alive (Alchemist's Crucible) | -- | -- |
| Heart | 1 Alive (Herbalist's Pouch) | -- | -- | -- |
| Eye | 1 Alive (Surveyor's Glass) | 1 Alive (Spore Lantern, anomaly) | 1 Alive (Astrolabe of Yven) | -- |
| Stone | 1 Alive (Iron Tongs) | 1 Alive (Master Chisel) | -- | -- |
| Star | -- | -- | 1 Alive (Astrolabe, star+eye) | -- |
| Flesh | -- | -- | -- | -- |
| Time | -- | -- | -- | -- |
| Life | -- | -- | -- | -- |

**Notes:** No T4 tools. No tools for Iron, Shadow, Flesh, Time, or Life reaches.

### Relics & Talismans

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron | 1 Alive (Bone Ward) + 1 Alive (Duelist's Luck Token) | -- | -- | -- |
| Gold | -- | 1 Alive (Uncut Ruby, anomaly) + 1 Alive (Corroded Crown, anomaly) | -- | -- |
| Shadow | -- | 1 Alive (Shadowglass Pendant) | -- | -- |
| Veil | -- | 1 Alive (Moonstone Pendant) | -- | 1 Alive (The Fulcrum) |
| Heart | 1 Alive (Wayfarer's Charm) | -- | 1 Alive (Weeping Icon) | -- |
| Eye | -- | 1 Alive (Fossilized Eye, anomaly) | -- | -- |
| Stone | -- | -- | 1 Alive (Heart of the Barrow) | -- |
| Star | -- | 1 Alive (Ember Sigil) + 1 Alive (Hearthglass Ward) | -- | -- |
| Flesh | -- | -- | -- | -- |
| Time | -- | -- | -- | -- |
| Life | -- | -- | -- | -- |

**Notes:** Starter has 1 T3 relic (Whispering Eye, eye+heart). Anomaly contributes 3 relics. Anomaly Resonance Shard (T3, veil) also exists.

### Provisions

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron | 2 Alive (Hardtack, starter Rations) | -- | -- | -- |
| Gold | -- | -- | -- | -- |
| Shadow | -- | -- | -- | -- |
| Veil | -- | -- | 1 Alive (Veilwater Flask) | -- |
| Heart | 1 Alive (Traveler's Wine) + 1 Alive (anomaly Herb Bundle) | 1 Alive (Healing Poultice) + 1 Alive (anomaly Amber Phial) | -- | -- |
| Eye | -- | -- | -- | -- |
| Stone | 1 Alive (Firestarter Kit) | -- | -- | -- |
| Star | -- | 1 Alive (Sanctuary Incense) | -- | -- |
| Flesh | 1 Alive (Battle Salve) | -- | -- | -- |
| Time | -- | -- | -- | -- |
| Life | -- | -- | -- | -- |

**Notes:** No T4 provisions. No provisions for Gold, Shadow, Eye, Time, or Life reaches.

### Intelligence (non-standard subcategory)

| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Shadow | -- | 2 Dead (Shrine Map, Trade Route Dossier) | -- | -- |

### Coverage Summary by Reach

| Reach | Total Items (Possessions) | Subcategories Covered | Notes |
|-------|---------------------------|----------------------|-------|
| Iron | 19 | arms, vestments, relics, provisions, mounts | Heavily concentrated in arms |
| Gold | 6 | vestments, tomes, tools, mounts, relics | Spread thinly |
| Shadow | 7 | vestments, tomes, relics, arms | No tools, provisions, mounts |
| Veil | 8 | vestments, tomes, tools, relics, provisions | Good spread, no arms or mounts |
| Heart | 8 | vestments, tools, relics, provisions, mounts | No arms or tomes |
| Eye | 12 | tomes, tools, relics, mounts | No arms, vestments, provisions |
| Stone | 6 | tools, relics, provisions, mounts | No arms, vestments, tomes |
| Star | 9 | tomes, vestments, relics, provisions, arms | Moderate spread |
| Flesh | 1 | provisions (Battle Salve) | **CRITICAL: only 1 item across all subcategories** |
| Time | 0 | -- | **CRITICAL: zero items in any subcategory** |
| Life | 0 | -- | **CRITICAL: zero items in any subcategory** |

---

## Dimension 2: Sphere Affinity Coverage

No possession, condition, or bestowed power item in any catalog has a `sphereAffinity` field. Only spell templates and encounter templates carry sphere affinities.

| Sphere | Items with sphereAffinity | Notes |
|--------|--------------------------|-------|
| chaos | 0 | No items |
| order | 0 | No items |
| light | 0 | No items |
| darkness | 0 | No items |
| force | 0 | Spell backlash only |
| matter | 0 | Anomaly encounters only |
| energy | 0 | Soulfire spell only |
| life | 0 | Last Breath spell only |
| mind | 0 | Hollow Crown spell only |
| spirit | 0 | Veilwalk + Crystal Gate spells only |
| time | 0 | Anomaly encounters only |
| entropy | 0 | Anomaly encounters only |

**CRITICAL:** The entire sphere dimension is vacant for gear/condition/bestowed content. This is a structural gap -- the system supports `sphereAffinity` but no authored items use it.

---

## Dimension 3: Effect Primitive Usage Deep-Dive

### Tier 1 Gear Effects (Types 1-14)

#### 1. passive (Usage: 87+ items)
**Status: OVERUSED** -- present on nearly every item as foundation modifier
- **Tiers:** T1, T2, T3, T4 -- all tiers
- **Categories:** Possessions (all subcategories), conditions (all), bestowed powers (all), anomaly artifacts, anomaly bestowed, anomaly conditions
- Used as the base modifier on virtually every item. Not a problem per se -- passive is the bread-and-butter primitive -- but items with ONLY passive effects are effectively "dead" in terms of mechanical interest.
- Notable items using passive as sole mechanical effect: Pilgrim's Robe (dead), Watch Scrutiny (4x passive, alive via conditional)

#### 2. consumable_charge (Usage: 7 items)
**Status: ADEQUATE**
- **Items:** Bone Knife (arms T1), Prayer Scroll (tomes T1), Herbalist's Pouch (tools T1), Battle Salve (provisions T1), Firestarter Kit (provisions T1), Amber Phial (anomaly provisions T2), Herb Bundle (anomaly provisions T1)
- **Tiers:** T1-T2 only
- **Categories:** Possessions only (arms, tomes, tools, provisions)
- **Gap:** No T3-T4 items with charges. No conditions or bestowed powers use charges (by design -- charges are a possession mechanic).

#### 3. duration (Usage: 16 items, but primarily as sub-effect inside reactive)
**Status: ADEQUATE** -- used extensively as nested effect inside reactive triggers
- **Standalone items:** Sanctuary Incense (provisions T2, via until_event actually)
- **As nested reactive effect:** Chainmail Hauberk, Thornwood Staff, Hollowfang, Mantle of Unremembered, Ember Sigil, Weeping Icon, Woven Sky, Quiet Blade, Deep Stab Wound, Death-Marked, Bloodward, Undying Flame, Steppe Mare, Healer's Touch, Earthblood Vigor, Spirit Sight
- **Tiers:** T1-T4
- **Categories:** Possessions, conditions, bestowed powers
- Spells: Veilwalk (T2), Last Breath (T4), backlash effects

#### 4. permanent (Usage: 1 item)
**Status: THIN**
- **Items:** Worldforge Anvil (artifact T4, -0.04 Shadow permanent penalty)
- **Tiers:** T4 only
- **Categories:** Artifact templates only
- **Gap:** No gear/condition/bestowed uses permanent effect. Consider for cursed items where a penalty persists even after removal.

#### 5. cooldown (Usage: 4 items)
**Status: MODERATE**
- **Items:** Moonstone Pendant (relics T2), Alchemist's Crucible (tools T2), Star Metal Shard (anomaly arms T3), Starfall Longbow (arms T3)
- **Tiers:** T2-T3
- **Categories:** Possessions only (relics, tools, arms)
- **Gap:** No T1 or T4 items. No conditions or bestowed powers with cooldown cycling.

#### 6. conditional (Usage: 39 items)
**Status: WELL-USED**
- Heavily used across all categories and tiers
- Conditions used: in_combat (8), in_social (7), in_exploration (6), in_mystical (5), in_wilderness (5), at_home_territory (1), health_low (1), near_water (1), alone (1), in_enemy_territory (0), health_high (0), outnumbered (0)
- **Gap:** Conditions `in_enemy_territory`, `health_high`, and `outnumbered` are never used. Parametrized conditions (`biome:`, `has_trait:`, `lacks_trait:`, `reach_above:`, `faction_rank:`) are never used.

#### 7. trait_grant (Usage: 6 items)
**Status: MODERATE**
- **Items:** Ashenmane Horse (mounts T2, cavalry_charge), Hollowfang (arms T3, dark_ferocity), Ashenmane Destrier (mounts T3, cavalry_charge), Vault Scholar (anomaly bestowed T3, ancient_reader), Ember Hands (bestowed T1, fire_touch), Worldforge Anvil (artifact T4, master_smith)
- **Tiers:** T1-T4
- **Categories:** Possessions (mounts, arms), bestowed powers, artifacts

#### 8. transform (Usage: 1 item)
**Status: THIN**
- **Items:** Greyscale (condition T2) -- transforms into Spine Wound on doom_threshold
- **Tiers:** T2 only
- **Categories:** Conditions only
- **Gap:** No possessions or bestowed powers use transform. This is a rich design space for cursed items that evolve.

#### 9. stacking (Usage: 13 items)
**Status: WELL-USED**
- **Items:** Hunting Bow (arms T1), Blackiron Blade (arms T2), Veteran's Shield (arms T2), Master Chisel (tools T2), Veilscript Fragment (tomes T2), Heart of Barrow (relics T3), Sealed Codex (anomaly tomes T3), Vault Curse (anomaly condition T2), Ill Luck (condition T1), Road Fever (disease T1), Tonguebound (curse T2), Mark of Debt (curse T2), Soulfire spell (T3)
- **Tiers:** T1-T3
- **Categories:** Possessions, conditions, spells
- **Triggers used:** combat_success (5), any_encounter (4), social_success (2), combat_failure (1)
- **Gap:** per_tick, on_damaged, on_kill, on_heal triggers never used.

#### 10. aura (Usage: 7 items)
**Status: MODERATE**
- **Items:** Heart of Barrow (relics T3), Saint's Ward (blessing T2), Stormcaller (bestowed T3), Hollow Crown spell (T3), Heartseed artifact (T4, 2x aura), Fulcrum (relics T4)
- **Tiers:** T2-T4
- **Categories:** Possessions, conditions, bestowed powers, artifacts, spells
- **Gap:** No T1 auras. No aura items in arms, vestments, tomes, tools, provisions, or mounts.

#### 11. reactive (Usage: 17 items)
**Status: WELL-USED**
- **Triggers used:** damaged (7), attacked (3), entered_hex (2), blessed (1), cursed (1), healed (2), ally_damaged (0)
- **Items:** Thornwood Staff, Hollowfang, Mantle Unremembered, Quiet Blade, Chainmail Hauberk, Woven Sky, Ember Sigil, Weeping Icon, Whispering Eye (starter), Deep Stab Wound, Death-Marked, Healer's Touch, Earthblood Vigor, Spirit Sight, Bloodward, Steppe Mare, Undying Flame
- **Tiers:** T1-T4
- **Categories:** Possessions, conditions, bestowed powers
- **Gap:** ally_damaged trigger never used. encounter_started never used.

#### 12. decay (Usage: 19 items)
**Status: WELL-USED**
- **Items:** Starter Copper Market Rations, Full Waterskin, Traveler's Wine, Healing Poultice, Veilwater Flask, Fading Ward, Hollowfang (via reactive), Mantle (via reactive), Bruised Ribs (starter), Fractured Arm, Bruised Knuckles, Gashed Leg, Gut Rot, Shattered Shield Arm, The Wasting, Earthblood Vigor (via reactive), Voidgate Shard (artifact T4), Soulfire backlash
- **Tiers:** T1-T4
- **Categories:** Possessions (provisions, tomes, arms), conditions (wounds, diseases), artifacts, spells

#### 13. tradeoff (Usage: 5 items)
**Status: MODERATE**
- **Items:** Rusted Mace (arms T1), Double-Edged Blade (arms T3), Corroded Crown (anomaly relics T2), Spore Lantern (anomaly tools T2), Spore-Touched (anomaly bestowed T2)
- **Tiers:** T1-T3
- **Categories:** Possessions, bestowed powers
- **Gap:** No T4 tradeoffs. No conditions with tradeoff.

#### 14. until_event (Usage: 5 items)
**Status: MODERATE**
- **Items:** Quiet Blade (arms T4, leave_combat), Sanctuary Incense (provisions T2, rest), Fey-Touched (condition T1, enter_combat), The Wasting (disease T3, rest)
- **Tiers:** T1-T4
- **Categories:** Possessions, conditions
- **Events used:** leave_combat (1), rest (2), enter_combat (1)
- **Gap:** Events leave_territory, enter_territory, take_damage, encounter_complete, faction_change, dawn_cycle, doom_threshold never used.

### Tier 2 Spell Effects (Types 15-23)

#### 15a. teleport (Usage: 4 items)
- **Items:** Veilwalk spell (T2), Crystal Gate spell (T3), Voidgate Shard ability (artifact T4), Crystal Gate backlash
- **Categories:** Spells, artifacts

#### 15b. forced_move (Usage: 1 item)
**Status: THIN**
- **Items:** Veilwalk spell backlash only
- **Gap:** No gear uses forced_move.

#### 16. reveal (Usage: 7 items)
- **Items:** Whispering Eye (starter relics T3), Shadowglass Pendant (relics T2), Veilwater Flask (provisions T3), Codex of Unmaking (tomes T4), Astrolabe of Yven (tools T3), Void-Scarred (condition T3), Spirit Sight (bestowed T2, via reactive)

#### 17. spawn (Usage: 1 item)
**Status: THIN**
- **Items:** Voidgate Shard Unmake ability (artifact T4, spawns void_horror encounter)
- **Gap:** No gear spawns things.

#### 18a. dispel (Usage: 1 item)
**Status: THIN**
- **Items:** Last Breath spell (T4, dispels death condition)
- **Gap:** No gear dispels conditions. Rich design space for holy water, cure potions, etc.

#### 18b. suppress (Usage: 0 items)
**Status: CRITICAL GAP**
- No items use suppress. This primitive temporarily disables effects within a scope. Useful for anti-magic fields, silence effects, etc.

Wait -- suppress is not in the 39 primitives list as a separate countable type since it's part of the DispelEffect family. It IS defined as a separate type `suppress` in effects.ts. Counting it separately:

#### 18b. suppress (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage

#### 19a. auto_succeed (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage
- Defined but never used in any content. Could be used for encounter-skipping legendary items.

#### 19b. reroll (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage
- Defined but never used. Natural fit for luck charms, prayer beads, etc.

#### 19c. swap_reach (Usage: 1 item)
**Status: THIN**
- **Items:** Soulfire spell (T3, swaps iron to star)
- **Gap:** No gear swaps reaches. Rich design space for shapeshifting items.

#### 19d. outcome_shift (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage
- Defined but never used. The test_shaper primitive covers similar ground more granularly.

#### 19e. test_shaper (Usage: 9 items)
**Status: WELL-USED**
- **Items:** Iron Blade (starter arms T1), Resonance Shard (anomaly relics T3), Chronicle of the Falling (tomes T2), Duelist's Luck Token (relics T1), Fulcrum (relics T4), Fortune-Marked (blessing T1), The Anointing (blessing T3), Patron's Backing (bestowed T1), Undying Flame (bestowed T4, via cascade)
- **Tiers:** T1-T4
- **Categories:** Possessions, conditions, bestowed powers
- **Triggers used:** near_miss (8), failure (1)
- **Gap:** success and any triggers never used.

#### 19f. prevent_loss (Usage: 4 items)
**Status: MODERATE**
- **Items:** Hearthglass Ward (relics T2, quintessence), Silent Testament (tomes T3, condition), Sap-Blessed (anomaly bestowed T2, wound condition), Undying Flame (bestowed T4, quintessence)
- **Tiers:** T2-T4
- **Categories:** Possessions, bestowed powers
- **Gap:** No T1 prevent_loss. No condition prevents loss.

#### 19g. content_grant (Usage: 1 item)
**Status: THIN**
- **Items:** Letters of Introduction (tomes T1, grants Patron's Backing)
- **Gap:** Only one item uses content_grant. Rich design space for treasure chests, gift packages, reward scrolls.

#### 20a. alter_terrain (Usage: 2 items)
- **Items:** Heartseed artifact ability (sacred_ground), Worldforge Anvil ability (volcanic)
- **Categories:** Artifact abilities only

#### 20b. create_barrier (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage

#### 21. transfer (Usage: 1 item)
**Status: THIN**
- **Items:** Hollow Crown spell backlash (transfers blessings from self to target)
- **Gap:** No gear transfers conditions/possessions.

#### 22a. haste (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage

#### 22b. slow (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage

#### 22c. freeze_duration (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage

#### 23. compel (Usage: 2 items)
- **Items:** Voidgate Shard backlash (flee), Voidgate Shard Unmake backlash (flee)
- **Categories:** Artifact backlash only
- **Gap:** No gear compels behavior.

### Tier 3 God-Tier Effects (Types 24-29)

#### 25. create_structure (Usage: 2 items)
- Heartseed (landmark), Worldforge Anvil (sublocation)
- Artifacts only -- appropriate scope

#### 26. destroy_structure (Usage: 3 items)
- Worldforge backlash, Voidgate Unmake, Voidgate Unmake backlash
- Artifacts only -- appropriate scope

#### 27. modify_rules (Usage: 6 items)
- Heartseed abilities (healing_multiplier, spawn_rate_multiplier, doom_rate_multiplier), Worldforge (tier_advancement_cost_multiplier), Voidgate (doom_rate_multiplier)
- Artifacts only -- appropriate scope

#### 28. faction_manipulate (Usage: 1 item)
- Voidgate Unmake ability (shift_relationship)
- Artifacts only

#### 29. cascade (Usage: 5 items)
- Worldforge Anvil, Heartseed World-Tree, Voidgate Unmake, Voidgate Unmake backlash, Undying Flame (bestowed T4)
- Artifacts + 1 bestowed power

### Query-Layer Effects (Types 30-38)

#### 30. behavior_weight (Usage: 12 items)
**Status: WELL-USED**
- **Items:** Tracking Hound (mounts T1), Ashenmane Destrier (mounts T3), Mantle Unremembered (vestments T3), Stormcaller (bestowed T3), Blinded Eye (wound T2), Nightmares (curse T1), Spine Wound (wound T3), The Hollow (curse T3), Prospector's Eye (anomaly bestowed T2), Uncut Ruby (anomaly relics T2), Alliance Pact (agreement T2), Oath of Service (agreement T2)
- **Tiers:** T1-T3
- **Categories:** Possessions, conditions, bestowed powers, agreements

#### 31. social_modifier (Usage: 10 items)
**Status: WELL-USED**
- **Items:** War Hound (mounts T2), Moonpearl Strand (anomaly vestments T2), Golden Euphoria (anomaly condition T1), Greyscale (disease T2), The Hollow (curse T3), Gatehouse Commendation (bestowed T1), Minor Debt (agreement T1), Favour Owed (agreement T1), Alliance Pact (agreement T2), Trade Treaty (agreement T1), Watch Scrutiny (condition T1)
- **Tiers:** T1-T3
- **Categories:** Possessions, conditions, bestowed powers, agreements

#### 32. action_gate (Usage: 6 items)
**Status: MODERATE**
- **Items:** Codex of Unmaking (tomes T4, block heart), Shattered Shield Arm (wound T2, block iron in combat), Spine Wound (wound T3, block iron in combat), Tonguebound (curse T2, block heart in social), Oath of Service (agreement T2, block shadow), Veilwalk (bestowed T3, unlock veil)
- **Tiers:** T2-T4
- **Categories:** Possessions, conditions, bestowed powers, agreements
- **Gap:** No T1 action gates. Only 1 unlock (Veilwalk).

#### 33. axiological_drift (Usage: 7 items)
**Status: MODERATE**
- **Items:** Codex of Unmaking (tomes T4), Weeping Icon (relics T3), Nightmares (curse T1), The Hollow (curse T3), The Wasting (disease T3), Dark Bargain (agreement T3), Fossil Whispers (anomaly condition T1)
- **Tiers:** T1-T4
- **Axes used:** mercy_ruthlessness (4), loyalty_ambition (1), hope_despair (1), caution_curiosity (1)

#### 34. range_modifier (Usage: 21 items)
**Status: WELL-USED**
- movementCostMultiplier used: Road-Worn Mule, Ashenmane Horse, Draft Pony, Steppe Mare, Ashenmane Destrier, Traveler's Cloak (starter), Gashed Leg, Brine Lungs, Road Fever, Spine Wound, Tide Reader, Veilwalk (bestowed), Quiet Blade (via reactive)
- awarenessRangeBonus used: Crossbow of Watch, Shadowweave Cloak, Surveyor's Glass, Fossilized Eye, Spore Visions, Voices of Departed, Fey-Touched, Blinded Eye (-1)

#### 35. tag_immunity (Usage: 8 items)
**Status: MODERATE**
- **Items:** Traveler's Cloak (starter, cold/frostbite), Padded Jerkin (bruise), Bone Ward (poison), Shadowweave Cloak (tracked/marked), Woven Sky (curse/corruption/blight), Quiet Blade (fear/intimidation), Iron Gut (bestowed, poison/disease), Crystal Attunement (anomaly, dissonance)
- **Tiers:** T1-T4
- **Categories:** Possessions, bestowed powers

#### 36. resource_manipulate (Usage: 1 item)
**Status: THIN**
- **Items:** Mark of Debt (curse T2, quintessence drain per tick)
- **Gap:** No items restore resources. No essence manipulation. Rich design space for mana wells, prayer beads, etc.

#### 37. hex_effect (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage
- Modifies hex tile properties. Useful for consecration, corruption spreading, fertility effects.

#### 38. graph_mutation (Usage: 0 items)
**Status: CRITICAL GAP** -- Zero usage
- Direct world graph CRUD. Very powerful; may be appropriate to keep restricted to artifacts/spells.

#### 39. slot_bonus (Usage: 1 item)
**Status: THIN**
- **Items:** Pack Goat (mounts T1, +1 consumable slot)
- **Gap:** Only one item grants slot bonuses. Could be used for bandoliers, pack animals, magical bags.

### Unused Primitives Summary (CRITICAL GAPS)

| Primitive | Type # | Design Space |
|-----------|--------|-------------|
| suppress | 18b | Anti-magic fields, silence zones, curse dampening |
| auto_succeed | 19a | Legendary keys, perfect disguises, diplomatic immunity |
| reroll | 19b | Lucky charms, prayer beads, second chances |
| outcome_shift | 19d | Covered by test_shaper; lower priority |
| create_barrier | 20b | Walls, wards, territorial boundaries |
| haste | 22a | Speed potions, blessings of swiftness, battle rage |
| slow | 22b | Curses of lethargy, binding spells, exhaustion |
| freeze_duration | 22c | Temporal stasis, preservation magic, curse delay |
| hex_effect | 37 | Land blessing/blighting, territory marking |
| graph_mutation | 38 | World-reshaping events, high-tier only |

**10 primitives have zero usage.** Of these, outcome_shift overlaps heavily with test_shaper, and graph_mutation may intentionally be restricted. The remaining 8 represent genuine creative opportunities.

---

## Dimension 4: Encounter Reward Pool Demand

Tag filter analysis across all encounter content files:

| Tag | Encounter Steps Demanding | Items Available (tagged) | Deficit? |
|-----|--------------------------|------------------------|----------|
| #beast | 18 (monster + faction) | 10 (mounts primarily) | Moderate supply |
| #ancient | 20 (faction + encounter) | 12 | Moderate supply |
| #survival | 10 (faction + encounter) | 8 | Adequate |
| #gold | 6 (faction) | 12 | No |
| #shadow | 10 (social + faction + encounter) | 14 | No |
| #knowledge | 10 (faction + encounter) | 9 | Adequate |
| #combat | 10 (faction + social + encounter) | 15 | No |
| #divine | 6 (encounter) | 7 | No |
| #veil | 12 (arcane circle + encounter) | 10 | Adequate |
| #arcane | 10 (encounter + arcane circle) | 6 | **THIN** |
| #heart | 6 (faction + social + merchant) | 11 | No |
| #healing | 4 (encounter) | 6 | No |
| #eye | 4 (arcane circle) | 14 | No |
| #craft | 2 (encounter) | 4 | No |
| #stone | 2 (encounter) | 7 | No |

**Deficits:**
- `#arcane` is thin relative to demand (10 encounters requesting, 6 items tagged)
- All other tags have adequate or surplus supply

---

## Dimension 5: Category Balance

| Category | Total | Alive | Dead | % Alive | Notes |
|----------|-------|-------|------|---------|-------|
| **Possessions** | 82 | 72 | 10 | 88% | 7 treasure maps dead, 1 Pilgrim's Robe, 2 intelligence items |
| **Conditions** | 30 | 27 | 3 | 90% | 3 starter conditions dead (Plague-Touched, Sun-Touched, Revelation) |
| **Bestowed Powers** | 21 | 21 | 0 | 100% | All alive -- includes Ruin Seeker trait (has domainContributions but special-purpose) |
| **Agreements** | 6 | 6 | 0 | 100% | All alive |
| **Artifacts** | 3 | 3 | 0 | 100% | All alive (T4 legendary) |
| **Spells** | 5 | 5 | 0 | 100% | All alive (T2-T4) |
| **Anomaly Artifacts** | 10 | 10 | 0 | 100% | All alive |
| **Anomaly Bestowed** | 8 | 8 | 0 | 100% | All alive |
| **Anomaly Conditions** | 6 | 6 | 0 | 100% | All alive |
| **TOTAL** | **157** | **147** | **10** | **94%** | Dramatic improvement from pre-upgrade |

### Dead Items Detail

**Reward Catalog -- Possessions (7 dead):**

1. `reward_vestments_pilgrim_robe` -- Pilgrim's Robe (vestments T1, #star, reachBonus only)
2. `reward_intelligence_shrine_map` -- Vessen Shrine Map (intelligence T2, #shadow, reachBonus only)
3. `reward_intelligence_trade_route_dossier` -- Trade Route Dossier (intelligence T2, #shadow, reachBonus only)
4. `reward_tomes_scrolls_faded_treasure_map` -- Faded Treasure Map (tomes T1, #eye, reachBonus only)
5. `reward_tomes_scrolls_cartographers_survey` -- Cartographer's Survey (tomes T2, #eye, reachBonus only)
6. `reward_tomes_scrolls_tomb_raiders_journal` -- Tomb Raider's Journal (tomes T2, #eye, reachBonus only)
7. `reward_tomes_scrolls_ancient_waystone_rubbing` -- Ancient Waystone Rubbing (tomes T3, #eye, reachBonus only)

**Starter Attachments -- Conditions (3 dead):**

8. `starter_plague_touched` -- Plague-Touched (condition T2, #flesh, domainContributions only)
9. `starter_sun_touched` -- Sun-Touched (condition T1, #star, domainContributions only)
10. `starter_revelation` -- Revelation (condition T2, #star, domainContributions only)

**Note:** `reward_bestowed_patrons_backing` has domainContributions BUT also has effects[], so it is Alive. The Ruin Seeker trait has domainContributions and no effects but is a special-purpose meta-trait, not a reward item.

---

## Prioritized Work Plan

### Phase 1: Upgrade Batches (Dead Items)

| Batch | Items | Impact | Spec |
|-------|-------|--------|------|
| upgrade-batch-1 | 10 items: `reward_vestments_pilgrim_robe`, `reward_intelligence_shrine_map`, `reward_intelligence_trade_route_dossier`, `reward_tomes_scrolls_faded_treasure_map`, `reward_tomes_scrolls_cartographers_survey`, `reward_tomes_scrolls_tomb_raiders_journal`, `reward_tomes_scrolls_ancient_waystone_rubbing`, `starter_plague_touched`, `starter_sun_touched`, `starter_revelation` | Eliminates all 10 remaining dead items, achieves 100% alive | `/content-catalog upgrade "All remaining dead items: Pilgrim's Robe (add conditional), intelligence items (add reveal/conditional), treasure maps (add conditional/reveal), starter conditions (add decay/conditional/reactive)"` |

### Phase 2: Fill Batches (New Items)

Ordered by impact -- fills the most critical gaps first.

| Batch | Gap Addressed | Spec |
|-------|--------------|------|
| fill-batch-1 | **Zero-usage primitives: haste, slow, freeze_duration** -- No items exercise time-manipulation mechanics | `/content-catalog fill "T2-T3 conditions and provisions using haste (speed potions, battle frenzy blessings), slow (binding curses, exhaustion conditions), and freeze_duration (temporal stasis relics, curse-delaying talismans). Mix across Iron/Veil/Star reaches."` |
| fill-batch-2 | **Time and Life reaches have ZERO possession items** | `/content-catalog fill "T1-T3 Time reach items: hourglasses (tools), temporal vestments, chronometer relics. T1-T3 Life reach items: hearthstone provisions, lifewood arms (staff), vitality vestments. Use cooldown, decay, and until_event effects."` |
| fill-batch-3 | **Flesh reach has only 1 item (Battle Salve)** | `/content-catalog fill "T1-T3 Flesh reach items across subcategories: bone-crafted arms, hide vestments, anatomical tomes, surgical tools, beast-blood provisions. Use tradeoff, reactive, and stacking effects."` |
| fill-batch-4 | **Zero-usage primitives: suppress, reroll, create_barrier** | `/content-catalog fill "T2-T3 items exercising suppress (anti-magic talismans, silence stones), reroll (lucky coins, prayer beads, fate tokens), create_barrier (ward stones, boundary markers). Spread across relics, provisions, and tools."` |
| fill-batch-5 | **No Shadow/Veil/Heart/Eye arms at any tier** | `/content-catalog fill "T1-T3 non-Iron arms: Shadow daggers/garrotes, Veil spectral weapons, Heart commanding banners/horns, Eye precision instruments/scrying weapons. Use conditional, stacking, reactive effects."` |
| fill-batch-6 | **No mounts for Shadow/Veil/Heart/Star reaches; no T4 mounts** | `/content-catalog fill "T2-T4 mounts: Shadow nightmares, Veil phase-beasts, Heart empathy companions, Star celestial mounts. Use trait_grant, behavior_weight, range_modifier, aura effects."` |
| fill-batch-7 | **sphereAffinity is completely vacant** | `/content-catalog fill "Add sphereAffinity to 12 existing T3-T4 items (1 per sphere) as field additions, then create 6 new T2-T3 items with sphere affinity: chaos relics, order tools, light vestments, darkness arms, force provisions, matter tomes."` |
| fill-batch-8 | **Thin primitives: resource_manipulate (1), slot_bonus (1), content_grant (1)** | `/content-catalog fill "T1-T3 items exercising resource_manipulate (mana wells, prayer foci, essence siphons), slot_bonus (bandoliers, magical bags, pack frames), content_grant (treasure chests, gift scrolls, sealed packages)."` |
| fill-batch-9 | **#arcane tag deficit; unused conditional predicates** | `/content-catalog fill "T1-T3 #arcane tagged items across subcategories (especially arms, vestments, mounts). Use unused conditional predicates: in_enemy_territory, health_high, outnumbered, biome:X. Mix with stacking and reactive."` |
| fill-batch-10 | **No T4 items for tools, mounts, or provisions** | `/content-catalog fill "T4 legendary items: 1 tool (world-shaping instrument), 1 mount (divine steed), 1 provision (immortal sustenance). Use cascade, aura, modify_rules, create_structure effects."` |

### Priority Summary

1. **Immediate:** Upgrade batch 1 -- eliminate all 10 dead items (simple conversions)
2. **High:** Fill batches 1-3 -- unused primitives (haste/slow/freeze), missing reaches (Time/Life/Flesh)
3. **Medium:** Fill batches 4-6 -- more unused primitives, subcategory gaps
4. **Low:** Fill batches 7-10 -- sphere coverage, thin primitives, tier gaps

---

## Appendix: Effect Primitive Reference Count

| # | Primitive | Usage | Status |
|---|-----------|-------|--------|
| 1 | passive | 87+ | Overused (expected) |
| 2 | consumable_charge | 7 | Adequate |
| 3 | duration | 16 | Adequate (mostly nested) |
| 4 | permanent | 1 | THIN |
| 5 | cooldown | 4 | Moderate |
| 6 | conditional | 39 | Well-used |
| 7 | trait_grant | 6 | Moderate |
| 8 | transform | 1 | THIN |
| 9 | stacking | 13 | Well-used |
| 10 | aura | 7 | Moderate |
| 11 | reactive | 17 | Well-used |
| 12 | decay | 19 | Well-used |
| 13 | tradeoff | 5 | Moderate |
| 14 | until_event | 5 | Moderate |
| 15a | teleport | 4 | Spells/artifacts |
| 15b | forced_move | 1 | THIN |
| 16 | reveal | 7 | Adequate |
| 17 | spawn | 1 | THIN (artifacts only) |
| 18a | dispel | 1 | THIN |
| 18b | suppress | 0 | **UNUSED** |
| 19a | auto_succeed | 0 | **UNUSED** |
| 19b | reroll | 0 | **UNUSED** |
| 19c | swap_reach | 1 | THIN |
| 19d | outcome_shift | 0 | **UNUSED** (overlap with test_shaper) |
| 19e | test_shaper | 9 | Well-used |
| 19f | prevent_loss | 4 | Moderate |
| 19g | content_grant | 1 | THIN |
| 20a | alter_terrain | 2 | Artifacts only |
| 20b | create_barrier | 0 | **UNUSED** |
| 21 | transfer | 1 | THIN |
| 22a | haste | 0 | **UNUSED** |
| 22b | slow | 0 | **UNUSED** |
| 22c | freeze_duration | 0 | **UNUSED** |
| 23 | compel | 2 | Backlash only |
| 25 | create_structure | 2 | Artifacts only |
| 26 | destroy_structure | 3 | Artifacts only |
| 27 | modify_rules | 6 | Artifacts only |
| 28 | faction_manipulate | 1 | Artifacts only |
| 29 | cascade | 5 | Artifacts + 1 bestowed |
| 30 | behavior_weight | 12 | Well-used |
| 31 | social_modifier | 10 | Well-used |
| 32 | action_gate | 6 | Moderate |
| 33 | axiological_drift | 7 | Moderate |
| 34 | range_modifier | 21 | Well-used |
| 35 | tag_immunity | 8 | Moderate |
| 36 | resource_manipulate | 1 | THIN |
| 37 | hex_effect | 0 | **UNUSED** |
| 38 | graph_mutation | 0 | **UNUSED** |
| 39 | slot_bonus | 1 | THIN |

**Totals:**
- Well-used (7+): 9 primitives (passive, conditional, reactive, decay, stacking, behavior_weight, social_modifier, range_modifier, test_shaper)
- Moderate (3-6): 9 primitives
- Thin (1-2): 11 primitives
- Unused (0): 10 primitives
