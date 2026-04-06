# Content Catalog Assessment -- 2026-04-06

## Executive Summary

- **Total items scanned:** 146 across 6 catalog files
  - Possessions (reward + starter + anomaly + treasure maps): 75
  - Conditions (reward + starter + anomaly): 37
  - Bestowed Powers (reward + anomaly): 21
  - Agreements: 6
  - Spells: 5
  - Artifacts (legendary): 3
- **Alive:** 24 (16%) -- has composable effects with non-passive primitives
  - Possessions: 8 of 75 (11%)
  - Conditions: 0 of 37 (0%)
  - Bestowed Powers: 1 of 21 (5%)
  - Agreements: 6 of 6 (100%)
  - Spells: 5 of 5 (100%)
  - Artifacts: 3 of 3 (100%)
- **Dead:** 122 (84%) -- reachBonus/domainContributions only, or onUseTriggers only (old pattern)
- **Empty cells:** 262 of 308 in the reach x subcategory x tier matrix (85%)
- **Effect primitives unused:** 18 of 39 (46%)
- **Spheres with < 3 items:** 12 of 12 (no catalog uses sphereAffinity except spells and agreements)
- **Tags with supply deficit:** 13 distinct tag filters have encounter demand exceeding available alive items

### Top 5 Critical Gaps

1. **All 37 conditions are Dead** -- wounds, blessings, curses, diseases, and supernatural conditions use only `domainContributions` (flat modifiers). Zero composable effects. These are the most-issued reward category in encounters.
2. **67 of 75 possessions are Dead** -- only 8 possessions use effects[]. The remaining 67 rely solely on `reachBonus` (flat modifiers) or `onUseTriggers` (old pattern). Massive mechanical sameness.
3. **20 of 21 bestowed powers are Dead** -- only `reward_bestowed_patrons_backing` has an effect (test_shaper). The rest are pure `domainContributions`.
4. **18 of 39 effect primitives have zero usage** in any catalog item -- including powerful Tier 2/3 types like `reveal`, `auto_succeed`, `reroll`, `outcome_shift`, `haste`, `slow`, `freeze_duration`, `suppress`, `create_barrier`, and all query-layer effects except those used in agreements.
5. **#combat tag has 41 encounter demand points but zero alive items** with that tag -- the single highest-demand tag filter across all encounters has no items with composable effects.

### Recommended First Batch

```
/content-catalog upgrade "T1-T2 combat arms and vestments with iron/shadow reach"
```
Addresses the #combat supply deficit (41 encounters demand it) by upgrading the 10 Dead arms items that already carry `#combat` tags. These items already exist, have flavor text, and serve the highest-demand encounter tag. Upgrading them to use conditional, stacking, decay, and tradeoff effects gives the most immediate gameplay impact.

---

## Dimension 1: Reach x Subcategory x Tier Matrix

Items are classified by their primary reach tag (first `#reach` in tags array, or first key in `reachBonus`). Items touching multiple reaches are counted under their primary reach only.

### Arms

| Reach   | T1           | T2           | T3           | T4           |
|---------|--------------|--------------|--------------|--------------|
| Iron    | 4 Dead + 1 Dead (starter) | 3 Dead + 1 Alive (ember_edge) + 1 Alive (veteran's shield) + 1 Dead (starter) | 2 Dead + 1 Alive (double-edged) + 1 Dead (anomaly) | 1 Dead |
| Gold    | --           | --           | --           | --           |
| Shadow  | --           | --           | --           | --           |
| Veil    | --           | --           | --           | --           |
| Heart   | --           | --           | --           | --           |
| Eye     | --           | --           | --           | --           |
| Stone   | --           | --           | --           | --           |
| Star    | --           | --           | --           | --           |
| Flesh   | --           | --           | --           | --           |
| Time    | --           | --           | --           | --           |
| Life    | --           | --           | --           | --           |

**Notes:** Arms are exclusively Iron-reach. No coverage for any other reach. 12 Dead, 3 Alive across all tiers.

### Mounts & Beasts

| Reach   | T1           | T2           | T3           | T4 |
|---------|--------------|--------------|--------------|-----|
| Iron    | --           | 1 Dead (war hound) | 1 Dead (destrier) | -- |
| Gold    | 1 Dead (draft pony) + 1 Dead (starter mule) | 1 Dead (steppe mare) | -- | -- |
| Shadow  | --           | --           | --           | -- |
| Veil    | --           | --           | --           | -- |
| Heart   | --           | --           | --           | -- |
| Eye     | 1 Dead (hound) | --           | --           | -- |
| Stone   | 1 Dead (pack goat) | --           | --           | -- |
| Star    | --           | --           | --           | -- |
| Flesh   | --           | --           | --           | -- |
| Time    | --           | --           | --           | -- |
| Life    | --           | --           | --           | -- |

**Notes:** 8 items, all Dead. No Alive items. No T4 coverage. No Shadow/Veil/Heart/Star/Flesh mounts at any tier. The starter Ashenmane Horse has no reachBonus at all.

### Vestments

| Reach   | T1           | T2           | T3           | T4 |
|---------|--------------|--------------|--------------|-----|
| Iron    | 1 Dead (padded jerkin) | 1 Dead (chainmail) | -- | -- |
| Gold    | 1 Dead (merchant silks) | -- | -- | -- |
| Shadow  | --           | 1 Dead (shadowweave) | 1 Dead (mantle) | -- |
| Veil    | --           | --           | --           | -- |
| Heart   | --           | --           | --           | -- |
| Eye     | --           | --           | --           | -- |
| Stone   | --           | --           | --           | -- |
| Star    | 1 Dead (pilgrim robe) + 1 Dead (starter cloak) | -- | -- | 1 Dead (woven sky) |
| Flesh   | --           | --           | --           | -- |
| Time    | --           | --           | --           | -- |
| Life    | --           | --           | --           | -- |
| Spirit  | --           | 1 Dead (anomaly moonpearl) | -- | -- |

**Notes:** 9 items, all Dead. Massive gaps: no Veil/Heart/Eye/Stone/Flesh vestments at any tier. No T3 Iron vestments, no T2-T4 Gold vestments.

### Tomes & Scrolls

| Reach   | T1           | T2           | T3           | T4 |
|---------|--------------|--------------|--------------|-----|
| Iron    | --           | --           | --           | -- |
| Gold    | 1 Dead (ledger) + 1 Alive (letters of intro) | -- | -- | -- |
| Shadow  | 1 Dead (smuggler's chart) | -- | -- | -- |
| Veil    | --           | 1 Dead (veilscript) + 1 Alive (fading ward) | -- | 1 Dead (codex of unmaking) |
| Heart   | --           | --           | --           | -- |
| Eye     | 1 Dead (field journal) + 2 Dead (maps) | 1 Dead (chronicle) + 2 Dead (maps) | 1 Dead (silent testament) + 1 Dead (waystone rubbing) | -- |
| Stone   | --           | --           | --           | -- |
| Star    | 1 Dead (prayer scroll) + 1 Dead (starter codex) | -- | -- | -- |
| Flesh   | --           | --           | --           | -- |
| Time    | --           | --           | --           | -- |
| Life    | --           | --           | --           | -- |

**Notes:** 17 items (incl. treasure maps). 2 Alive (letters of introduction, fading ward). Heavy Eye bias from treasure maps. No Iron/Heart/Stone/Flesh/Time/Life coverage.

### Relics & Talismans

| Reach   | T1           | T2           | T3           | T4 |
|---------|--------------|--------------|--------------|-----|
| Iron    | 1 Alive (duelist's luck) | -- | -- | -- |
| Gold    | --           | 1 Dead (anomaly corroded crown) + 1 Dead (anomaly uncut ruby) | -- | -- |
| Shadow  | --           | 1 Dead (shadowglass pendant) | -- | -- |
| Veil    | --           | 1 Alive (moonstone pendant) | -- | 1 Dead (the fulcrum) |
| Heart   | 1 Dead (wayfarer's charm) | -- | 1 Dead (weeping icon) | -- |
| Eye     | --           | 1 Dead (anomaly fossilized eye) + 1 Dead (anomaly spore lantern via tools) | -- | -- |
| Stone   | --           | --           | 1 Dead (heart of barrow) | -- |
| Star    | --           | 1 Dead (ember sigil) + 1 Alive (hearthglass ward) | -- | -- |
| Flesh   | 1 Dead (bone ward) | -- | -- | -- |
| Time    | --           | --           | --           | -- |
| Life    | --           | --           | --           | -- |

**Notes:** 14 items. 3 Alive (duelist's luck, moonstone pendant, hearthglass ward). The anomaly relics and starter Whispering Eye use onUseTriggers (Dead). No T4 Iron/Gold/Shadow/Heart/Eye/Stone/Star/Flesh relics.

### Tools & Instruments

| Reach   | T1           | T2           | T3           | T4 |
|---------|--------------|--------------|--------------|-----|
| Iron    | --           | --           | --           | -- |
| Gold    | --           | --           | --           | -- |
| Shadow  | --           | --           | --           | -- |
| Veil    | --           | 1 Dead (alchemist's crucible) | -- | -- |
| Heart   | --           | --           | --           | -- |
| Eye     | 1 Dead (surveyor's glass) + 1 Dead (gate seal case) | 1 Dead (anomaly spore lantern) | -- | -- |
| Stone   | 1 Dead (iron tongs) | 1 Dead (master chisel) | -- | -- |
| Star    | --           | --           | 1 Dead (astrolabe of yven) | -- |
| Flesh   | 1 Dead (herbalist's pouch) | -- | -- | -- |
| Time    | --           | --           | --           | -- |
| Life    | --           | --           | --           | -- |

**Notes:** 9 items, all Dead. Enormous gaps. No Iron/Gold/Shadow/Heart/Time/Life tools at any tier. No T4 tools. Only Star has a T3.

### Provisions

| Reach   | T1           | T2           | T3           | T4 |
|---------|--------------|--------------|--------------|-----|
| Iron    | --           | --           | --           | -- |
| Gold    | --           | --           | --           | -- |
| Shadow  | --           | --           | --           | -- |
| Veil    | --           | --           | 1 Dead (veilwater flask) | -- |
| Heart   | 1 Dead (traveler's wine) + 1 Dead (anomaly amber phial via heart) | 1 Dead (sanctuary incense) | -- | -- |
| Eye     | --           | --           | --           | -- |
| Stone   | 1 Dead (firestarter kit) | -- | -- | -- |
| Star    | --           | 1 Dead (sanctuary incense -- secondary) | -- | -- |
| Flesh   | 1 Dead (hardtack) + 1 Dead (waterskin) + 1 Alive (battle salve) + 1 Dead (starter rations) | 1 Dead (healing poultice) | -- | -- |
| Time    | --           | --           | --           | -- |
| Life    | --           | --           | --           | -- |

**Notes:** 11 items. 1 Alive (battle salve). No Iron/Gold/Shadow/Eye provisions at any tier. No T4 provisions. Herb Bundle (anomaly) has empty reachBonus.

---

## Dimension 2: Sphere Affinity Coverage

Only spells and agreements explicitly use `sphereAffinity`. Possessions, conditions, and bestowed powers have no sphere affinity assigned.

| Sphere    | Items | Alive | Dead | Notes |
|-----------|-------|-------|------|-------|
| chaos     | 0     | 0     | 0    | **EMPTY** -- no items |
| order     | 0     | 0     | 0    | **EMPTY** -- no items |
| light     | 0     | 0     | 0    | **EMPTY** -- no items |
| darkness  | 0     | 0     | 0    | **EMPTY** -- no items |
| force     | 0     | 0     | 0    | **EMPTY** -- no items |
| matter    | 0     | 0     | 0    | **EMPTY** -- no items |
| energy    | 1     | 1     | 0    | spell_soulfire only |
| life      | 1     | 1     | 0    | spell_last_breath only |
| mind      | 1     | 1     | 0    | spell_hollow_crown only |
| spirit    | 2     | 2     | 0    | spell_veilwalk + spell_crystal_gate |
| time      | 0     | 0     | 0    | **EMPTY** -- no items |
| entropy   | 0     | 0     | 0    | **EMPTY** -- no items |

**Critical:** 8 of 12 spheres have zero items. The remaining 4 are covered only by spells. No possessions, conditions, or bestowed powers carry sphere affinities at all.

---

## Dimension 3: Effect Primitive Usage

Count of items using each of the 39 effect primitives across all catalogs (including spells and artifacts).

| # | Primitive | Usage Count | Tier Range | Notes |
|---|-----------|-------------|------------|-------|
| 1 | passive | 1 | T3 (agreement) | Only used in Dark Bargain agreement |
| 2 | consumable_charge | 1 | T1 | battle_salve only |
| 3 | duration | 4 | T2-T4 | All in spells (veilwalk, soulfire, last_breath x2) |
| 4 | permanent | 1 | T4 | Worldforge Anvil passive |
| 5 | cooldown | 1 | T2 | moonstone_pendant only |
| 6 | conditional | 2 | T2-T3 | ember_edge (T2), spell_hollow_crown (T3) |
| 7 | trait_grant | 1 | T4 | Worldforge Anvil |
| 8 | transform | 0 | -- | **UNUSED** |
| 9 | stacking | 2 | T2-T3 | veteran's_shield (T2), spell_soulfire (T3) |
| 10 | aura | 3 | T3-T4 | spell_hollow_crown, heartseed (x2) |
| 11 | reactive | 0 | -- | **UNUSED** |
| 12 | decay | 3 | T2-T4 | fading_ward (T2), voidgate_shard (T4), spell_soulfire backlash |
| 13 | tradeoff | 1 | T3 | double-edged_blade |
| 14 | until_event | 0 | -- | **UNUSED** |
| 15a | teleport | 4 | T2-T4 | spells (veilwalk, crystal_gate x2), voidgate_shard |
| 15b | forced_move | 1 | T2 | spell_veilwalk backlash |
| 16 | reveal | 0 | -- | **UNUSED** |
| 17 | spawn | 1 | T4 | voidgate_shard Unmake cascade |
| 18a | dispel | 1 | T4 | spell_last_breath |
| 18b | suppress | 0 | -- | **UNUSED** |
| 19a | auto_succeed | 0 | -- | **UNUSED** |
| 19b | reroll | 0 | -- | **UNUSED** |
| 19c | swap_reach | 1 | T3 | spell_soulfire |
| 19d | outcome_shift | 0 | -- | **UNUSED** |
| 19e | test_shaper | 2 | T1 | duelist's_luck_token, patron's_backing |
| 19f | prevent_loss | 1 | T2 | hearthglass_ward |
| 19g | content_grant | 1 | T1 | letters_of_introduction |
| 20a | alter_terrain | 2 | T4 | worldforge_anvil, heartseed |
| 20b | create_barrier | 0 | -- | **UNUSED** |
| 21 | transfer | 1 | T3 | spell_hollow_crown backlash |
| 22a | haste | 0 | -- | **UNUSED** |
| 22b | slow | 0 | -- | **UNUSED** |
| 22c | freeze_duration | 0 | -- | **UNUSED** |
| 23 | compel | 2 | T4 | voidgate_shard (both abilities) |
| 24 | (scope -- cross-cutting, not counted) | -- | -- | -- |
| 25 | create_structure | 2 | T4 | worldforge_anvil, heartseed |
| 26 | destroy_structure | 3 | T4 | voidgate_shard (main + backlash), worldforge_anvil backlash |
| 27 | modify_rules | 6 | T4 | heartseed (x4), voidgate_shard, worldforge_anvil |
| 28 | faction_manipulate | 1 | T4 | voidgate_shard |
| 29 | cascade | 4 | T4 | worldforge_anvil, heartseed, voidgate_shard (x2) |
| 30 | behavior_weight | 2 | T2 | agreements (alliance pact, oath of service) |
| 31 | social_modifier | 4 | T1-T2 | agreements only (debt, favour, alliance, trade) |
| 32 | action_gate | 1 | T2 | agreement (oath of service) |
| 33 | axiological_drift | 1 | T3 | agreement (dark bargain) |
| 34 | range_modifier | 0 | -- | **UNUSED** |
| 35 | tag_immunity | 0 | -- | **UNUSED** |
| 36 | resource_manipulate | 0 | -- | **UNUSED** |
| 37 | hex_effect | 0 | -- | **UNUSED** |
| 38 | graph_mutation | 0 | -- | **UNUSED** |
| 39 | slot_bonus | 0 | -- | **UNUSED** |

### Unused Primitives (18 total -- creative opportunities)

**Tier 1 (Gear):** transform, reactive, until_event
**Tier 2 (Spell):** reveal, suppress, auto_succeed, reroll, outcome_shift, create_barrier, haste, slow, freeze_duration
**Query-layer:** range_modifier, tag_immunity, resource_manipulate, hex_effect, graph_mutation
**Slot system:** slot_bonus

**Concentration of usage:** 13 of the 21 used primitives appear only in spells or legendary artifacts (T3-T4). The T1-T2 possession/condition/bestowed pool uses only 8 distinct primitives: test_shaper, prevent_loss, content_grant, conditional, cooldown, stacking, consumable_charge, tradeoff, decay.

---

## Dimension 4: Encounter Reward Pool Demand vs Supply

Tags are extracted from all `rewardPool.tagFilters` across all encounter content files. Supply counts items (alive or dead) with matching tags.

| Tag | Encounters Demanding | Items with Tag (Total) | Items Alive with Tag | Deficit? |
|-----|---------------------|----------------------|---------------------|----------|
| #combat | 41 | 26 | 3 (ember_edge, veteran's_shield, double-edged) | **YES -- 3 alive of 26; tag demands active effects** |
| #gold | 29 | 10 | 1 (letters_of_intro via content_grant) | **YES -- 1 alive of 10** |
| #beast | 27 | 9 | 0 | **YES -- 0 alive** |
| #ancient | 27 | 13 | 0 | **YES -- 0 alive** |
| #shadow | 26 | 10 | 0 | **YES -- 0 alive** |
| #knowledge | 26 | 9 | 0 | **YES -- 0 alive** |
| #heart | 18 | 11 | 0 | **YES -- 0 alive** |
| #divine | 18 | 10 | 0 | **YES -- 0 alive** |
| #veil | 13 | 9 | 2 (fading_ward, moonstone_pendant) | **YES -- 2 alive of 9** |
| #survival | 13 | 12 | 1 (battle_salve) | **YES -- 1 alive of 12** |
| #star | 11 | 10 | 0 | **YES -- 0 alive** |
| #arcane | 8 | 5 | 0 | **YES -- 0 alive** |
| #iron | 7 | 10 | 3 (ember_edge, veteran's_shield, duelist's_luck) | Marginal |
| #eye | 7 | 13 | 0 | **YES -- 0 alive** |
| #stone | 5 | 6 | 0 | **YES -- 0 alive** |
| #healing | 4 | 6 | 1 (battle_salve) | Marginal |
| #craft | 4 | 6 | 0 | **YES -- 0 alive** |
| #trade | 2 | 3 | 1 (letters_of_intro) | Marginal |
| #stealth | 2 | 4 | 0 | **YES -- 0 alive** |
| #checkpoint | 2 | 3 | 0 | **YES -- 0 alive** |
| #wilderness | -- (not directly demanded) | 15 | 1 (battle_salve) | Indirect demand through #survival |

### Multi-tag Filters (encounters requesting 2+ tags simultaneously)

| Tag Combo | Encounters | Matching Items | Notes |
|-----------|-----------|---------------|-------|
| #ancient + #knowledge | 2 | 3 Dead | 0 alive |
| #ancient + #arcane | 2 | 2 Dead | 0 alive |
| #ancient + #time | 1 | 0 | **Empty** |
| #ancient + #relic | 1 | 2 Dead | 0 alive |
| #crystal + #arcane | 1 | 1 Dead | anomaly_resonance_shard |
| #star_metal + #fate | 1 | 1 Dead | anomaly_star_metal_shard |
| #pearl + #spirit | 1 | 1 Dead | anomaly_moonpearl_strand |
| #nature + #healing | 1 | 1 Dead | anomaly_amber_phial |
| #healing + #herb | 1 | 1 Dead | anomaly_herb_bundle |
| #gold + #cursed | 1 | 1 Dead | anomaly_corroded_crown |
| #fungus + #mind | 1 | 0 | **Empty** |
| #gem | 1 | 1 Dead | anomaly_uncut_ruby |

---

## Dimension 5: Category Balance

| Category | Total | Alive | Dead | % Alive | Notes |
|----------|-------|-------|------|---------|-------|
| Possessions (all catalogs) | 75 | 8 | 67 | **11%** | **Critical -- 89% dead.** 8 alive items use only 8 distinct primitives. |
| Conditions (all catalogs) | 37 | 0 | 37 | **0%** | **Critical -- all dead.** Only domainContributions. No effects[]. |
| Bestowed Powers (all catalogs) | 21 | 1 | 20 | **5%** | **Critical -- 95% dead.** Only patron's_backing has test_shaper. |
| Agreements | 6 | 6 | 0 | **100%** | Healthy. All use query-layer effects. |
| Spells | 5 | 5 | 0 | **100%** | Healthy. Rich effect compositions. |
| Artifacts (legendary) | 3 | 3 | 0 | **100%** | Healthy. Complex cascade/scope compositions. |

**The problem is structural:** The three highest-volume categories (possessions, conditions, bestowed powers) that feed the encounter reward pipeline are almost entirely Dead. Encounters frequently award items from these pools, meaning players receive mechanically inert rewards -- items that provide flat stat bonuses but no interesting gameplay interactions.

---

## Prioritized Work Plan

### Phase 1: Upgrade Batches

Ordered by impact: encounter demand (Dimension 4) x category severity (Dimension 5).

#### Upgrade Batch 1: Combat Arms (T1-T2)

**Impact:** Fills #combat demand (41 encounters), #iron demand (7 encounters). Arms are the highest-population subcategory.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| reward_arms_bronze_spear | Bronze Spear | T1 | Dead (reachBonus only) |
| reward_arms_hunting_bow | Hunting Bow | T1 | Dead (reachBonus only) |
| reward_arms_rusted_mace | Rusted Mace | T1 | Dead (reachBonus only) |
| reward_arms_bone_knife | Bone Knife | T1 | Dead (reachBonus only) |
| starter_iron_blade | Iron Blade | T1 | Dead (onUseTriggers only) |
| reward_arms_blackiron_blade | Blackiron Blade | T2 | Dead (reachBonus only) |
| reward_arms_crossbow_of_the_watch | Crossbow of the Watch | T2 | Dead (reachBonus only) |
| reward_arms_thornwood_staff | Thornwood Staff | T2 | Dead (reachBonus only) |

**Spec:** `/content-catalog upgrade "T1-T2 arms with #iron #combat tags. Use conditional (in_combat), stacking (combat_success), consumable_charge, and tradeoff effects. Keep existing reachBonus; add effects[] alongside."`

---

#### Upgrade Batch 2: Combat Arms (T3-T4) + Vestments

**Impact:** Fills #combat demand at higher tiers, adds vestment diversity.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| reward_arms_hollowfang | Hollowfang | T3 | Dead (reachBonus only) |
| reward_arms_starfall_longbow | Starfall Longbow | T3 | Dead (reachBonus only) |
| reward_arms_the_quiet_blade | The Quiet Blade | T4 | Dead (reachBonus only) |
| reward_vestments_padded_jerkin | Padded Jerkin | T1 | Dead (reachBonus only) |
| reward_vestments_merchant_silks | Merchant Silks | T1 | Dead (reachBonus only) |
| reward_vestments_chainmail_hauberk | Chainmail Hauberk | T2 | Dead (reachBonus only) |
| reward_vestments_shadowweave_cloak | Shadowweave Cloak | T2 | Dead (reachBonus only) |
| reward_vestments_mantle_of_the_unremembered | Mantle of the Unremembered | T3 | Dead (reachBonus only) |
| reward_vestments_the_woven_sky | The Woven Sky | T4 | Dead (reachBonus only) |
| starter_traveler_cloak | Traveler's Cloak | T1 | Dead (no reachBonus, no effects) |

**Spec:** `/content-catalog upgrade "T1-T4 arms and vestments. T3+ should use reactive (damaged trigger), decay, until_event. Vestments should emphasize conditional (in_combat for armor, in_social for silks), reactive (attacked), and tag_immunity."`

---

#### Upgrade Batch 3: Wound Conditions (T1-T2)

**Impact:** Conditions are the #1 most-issued reward category (all encounter failures can award them). All 37 are Dead. Wounds are the most common subtype.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| reward_condition_fractured_arm | Fractured Arm | T1 | Dead (domainContributions only) |
| reward_condition_gashed_leg | Gashed Leg | T1 | Dead |
| reward_condition_cracked_ribs | Cracked Ribs | T1 | Dead |
| reward_condition_bruised_knuckles | Bruised Knuckles | T1 | Dead |
| reward_condition_deep_stab_wound | Deep Stab Wound | T2 | Dead |
| reward_condition_shattered_shield_arm | Shattered Shield Arm | T2 | Dead |
| reward_condition_blinded_eye | Blinded Eye | T2 | Dead |
| starter_bruised_ribs | Bruised Ribs | T1 | Dead |

**Spec:** `/content-catalog upgrade "T1-T2 wound conditions. Use decay (healing over time), conditional (in_combat penalty), action_gate (block reach when severe), range_modifier (movement penalty for leg wounds), behavior_weight (avoid combat when wounded). Keep existing domainContributions; add effects[] alongside."`

---

#### Upgrade Batch 4: Blessing and Curse Conditions

**Impact:** Blessings and curses add narrative flavor. 9 items, all Dead.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| reward_condition_dawn_kissed | Dawn-Kissed | T1 | Dead |
| reward_condition_healers_touch | Healer's Touch | T1 | Dead |
| reward_condition_fortune_marked | Fortune-Marked | T1 | Dead |
| reward_condition_saints_ward | Saint's Ward | T2 | Dead |
| reward_condition_earthblood_vigor | Earthblood Vigor | T2 | Dead |
| reward_condition_the_anointing | The Anointing | T3 | Dead |
| reward_condition_ill_luck | Ill Luck | T1 | Dead |
| reward_condition_nightmares | Nightmares | T1 | Dead |
| reward_condition_tonguebound | Tonguebound | T2 | Dead |

**Spec:** `/content-catalog upgrade "Blessings and curses. Blessings: use test_shaper (rescue near-misses), reactive (healed trigger), aura (allies). Curses: use behavior_weight (suppress), axiological_drift, action_gate (block), stacking (worsens on failure). Maintain tension between gift and cost."`

---

#### Upgrade Batch 5: Disease and Supernatural Conditions + Remaining Curses

**Impact:** Completes condition upgrades. 10 items, all Dead.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| reward_condition_mark_of_debt | Mark of Debt | T2 | Dead |
| reward_condition_the_hollow | The Hollow | T3 | Dead |
| reward_condition_road_fever | Road Fever | T1 | Dead |
| reward_condition_gut_rot | Gut Rot | T1 | Dead |
| reward_condition_greyscale | Greyscale | T2 | Dead |
| reward_condition_the_wasting | The Wasting | T3 | Dead |
| reward_condition_spine_wound | Spine Wound | T3 | Dead |
| reward_condition_fey_touched | Fey-Touched | T1 | Dead |
| reward_condition_death_marked | Death-Marked | T2 | Dead |
| reward_condition_void_scarred | Void-Scarred | T3 | Dead |
| reward_condition_watch_scrutiny | Watch Scrutiny | T1 | Dead |

**Spec:** `/content-catalog upgrade "Diseases: decay (worsening symptoms), transform (disease evolves), social_modifier (contagion avoidance). Supernatural conditions: until_event, reactive, reveal (supernatural perception). Curses (mark_of_debt, the_hollow): resource_manipulate (drain), axiological_drift, stacking (deepening curse)."`

---

#### Upgrade Batch 6: Bestowed Powers

**Impact:** 20 Dead items. Bestowed powers are permanent character upgrades -- they should have the richest effects.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| reward_bestowed_ember_hands | Ember Hands | T1 | Dead |
| reward_bestowed_beast_tongue | Beast-Tongue | T1 | Dead |
| reward_bestowed_iron_gut | Iron Gut | T1 | Dead |
| reward_bestowed_night_eyes | Night Eyes | T1 | Dead |
| reward_bestowed_gatehouse_commendation | Gatehouse Commendation | T1 | Dead |
| reward_bestowed_spirit_sight | Spirit Sight | T2 | Dead |
| reward_bestowed_bloodward | Bloodward | T2 | Dead |
| reward_bestowed_voices_of_the_departed | Voices of the Departed | T2 | Dead |
| reward_bestowed_stormcaller | Stormcaller | T3 | Dead |
| reward_bestowed_veilwalk | Veilwalk | T3 | Dead |
| reward_bestowed_the_undying_flame | The Undying Flame | T4 | Dead |

**Spec:** `/content-catalog upgrade "Bestowed powers. T1: trait_grant + conditional or tag_immunity. T2: reactive + range_modifier or social_modifier. T3: aura + behavior_weight or action_gate (unlock). T4: prevent_loss + reactive cascade. These are permanent -- lean into interesting ongoing effects."`

---

#### Upgrade Batch 7: Anomaly Rewards

**Impact:** 24 anomaly items, all Dead. These are discovery rewards -- they should feel special.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| anomaly_uncut_ruby | Uncut Ruby | T2 | Dead |
| anomaly_resonance_shard | Resonance Shard | T3 | Dead (onUseTriggers) |
| anomaly_amber_phial | Amber Phial | T2 | Dead (onUseTriggers) |
| anomaly_herb_bundle | Herb Bundle | T1 | Dead (onUseTriggers) |
| anomaly_sealed_codex | Sealed Codex | T3 | Dead (onUseTriggers) |
| anomaly_corroded_crown | Corroded Crown | T2 | Dead (onUseTriggers) |
| anomaly_fossilized_eye | Fossilized Eye | T2 | Dead |
| anomaly_star_metal_shard | Star Metal Shard | T3 | Dead |
| anomaly_moonpearl_strand | Moonpearl Strand | T2 | Dead |
| anomaly_spore_lantern | Spore Lantern | T2 | Dead (onUseTriggers) |
| anomaly_prospectors_eye | Prospector's Eye | T2 | Dead (bestowed) |
| anomaly_crystal_attunement | Crystal Attunement | T3 | Dead (bestowed) |
| (+ 6 anomaly conditions, 6 anomaly bestowed powers -- all Dead) | -- | T1-T3 | Dead |

**Spec:** `/content-catalog upgrade "Anomaly signature artifacts. Replace onUseTriggers with effects[]. Use consumable_charge (herb/phial), conditional (resonance shard in mystical context), reveal (fossilized eye/spore lantern), decay (corroded crown curse), transform (sealed codex evolves). Anomaly bestowed powers: trait_grant + tag_immunity or range_modifier."`

---

#### Upgrade Batch 8: Remaining Possessions (Relics, Tomes, Tools, Provisions, Mounts)

**Impact:** Fills remaining Dead possessions not covered in earlier batches.

| Item ID | Name | Tier | Current State |
|---------|------|------|---------------|
| reward_relics_talismans_wayfarers_charm | Wayfarer's Charm | T1 | Dead |
| reward_relics_talismans_bone_ward | Bone Ward | T1 | Dead |
| reward_relics_talismans_ember_sigil | Ember Sigil | T2 | Dead |
| reward_relics_talismans_shadowglass_pendant | Shadowglass Pendant | T2 | Dead |
| reward_relics_talismans_heart_of_the_barrow | Heart of the Barrow | T3 | Dead |
| reward_relics_talismans_the_weeping_icon | The Weeping Icon | T3 | Dead |
| reward_relics_talismans_the_fulcrum | The Fulcrum | T4 | Dead |
| reward_tomes_scrolls_field_journal | Field Journal | T1 | Dead |
| reward_tomes_scrolls_prayer_scroll | Prayer Scroll | T1 | Dead |
| reward_tomes_scrolls_merchants_ledger | Merchant's Ledger | T1 | Dead |
| reward_tomes_scrolls_chronicle_of_the_falling | Chronicle of the Falling | T2 | Dead |
| reward_tomes_scrolls_veilscript_fragment | Veilscript Fragment | T2 | Dead |

**Spec:** `/content-catalog upgrade "Relics and tomes T1-T4. Relics: reactive (blessed/cursed triggers), until_event, aura (small radius). Tomes: reveal (knowledge), test_shaper (study bonus), content_grant (unlock further items). The Fulcrum (T4): modify_rules + aura."`

---

### Phase 2: Fill Batches

After all upgrades, the following matrix gaps remain (no items exist at all).

#### Fill Batch 1: Shadow/Veil Vestments

**Gap:** No Shadow vestments at T1/T4. No Veil vestments at any tier.

**Spec:** `/content-catalog fill "T1-T3 Shadow and Veil vestments. Shadow: cloaks, cowls, wrappings. Veil: robes with warding, mantles that blur perception. Use conditional (in_exploration, in_combat), reactive (attacked -- phase out), until_event (leave_combat), tag_immunity (fear, charm). Entropy/spirit sphere affinity."`

---

#### Fill Batch 2: Eye/Heart Mounts and Beasts

**Gap:** No Heart mounts at any tier. Eye only at T1. No T3-T4 mounts outside Iron.

**Spec:** `/content-catalog fill "T1-T3 mounts and beasts with Heart, Eye, Veil reach. Heart: loyal companions (social_modifier, behavior_weight). Eye: scout creatures (reveal, range_modifier awareness). Veil: otherworldly steeds (conditional biome, until_event). Mind/spirit sphere affinity."`

---

#### Fill Batch 3: Gold/Shadow Tools and Instruments

**Gap:** No Gold, Shadow, Heart, Iron tools at any tier. No T4 tools.

**Spec:** `/content-catalog fill "T1-T3 tools with Gold (merchant scales, ledger systems), Shadow (lockpicks, cipher tools), Iron (field repair kits). Use stacking (craft_success), cooldown (periodic bonus), consumable_charge, test_shaper. Matter/force sphere affinity."`

---

#### Fill Batch 4: Multi-reach Provisions

**Gap:** No Iron, Gold, Shadow, Eye provisions. No T3-T4 provisions.

**Spec:** `/content-catalog fill "T2-T3 provisions with Iron (war rations -- conditional in_combat), Gold (trade goods -- social_modifier), Shadow (poisons -- tradeoff), Eye (scrying draughts -- reveal). Use consumable_charge, duration, decay. Include at least one T3 provision per reach."`

---

#### Fill Batch 5: Time/Life/Flesh Reach Coverage

**Gap:** No items in the entire catalog carry Time or Life as primary reach. Flesh is thin (provisions only).

**Spec:** `/content-catalog fill "T1-T3 items across multiple subcategories for Time reach (hourglasses, temporal wards, chrono-tools) and Life reach (vitality totems, life-force talismans, regenerative provisions). Use until_event, freeze_duration, haste, slow, decay (aging/renewing). Time/life sphere affinity."`

---

#### Fill Batch 6: Unused Effect Primitives Showcase

**Gap:** 18 effect primitives have zero usage. Fill items that exercise them.

**Spec:** `/content-catalog fill "One item per unused primitive: transform (T2 arms -- weapon evolves after enough kills), reactive (T2 vestments -- counterattack on damaged), until_event (T1 provisions -- bonus until rest), reveal (T2 tools -- scouting glass), suppress (T3 relics -- anti-magic talisman), auto_succeed (T3 relics -- one guaranteed encounter success), reroll (T2 provisions -- lucky coin), outcome_shift (T2 relics -- fate charm), create_barrier (T3 tools -- ward stone), haste (T2 vestments -- speed cloak), slow (T2 relics -- binding chains), freeze_duration (T2 relics -- preservation ward), range_modifier (T1 mounts), tag_immunity (T1 vestments), resource_manipulate (T2 provisions), hex_effect (T3 tools), slot_bonus (T1 tools). Use appropriate sphere affinities from the 8 uncovered spheres."`

---

#### Fill Batch 7: Sphere Affinity Coverage

**Gap:** 8 of 12 spheres have zero items (chaos, order, light, darkness, force, matter, time, entropy).

**Spec:** `/content-catalog fill "Assign sphereAffinity to all items created in Fill Batches 1-6, ensuring every sphere gets at least 3 items. Chaos: transform/stacking items. Order: tag_immunity/action_gate items. Light: reveal/aura items. Darkness: conditional/decay items. Force: reactive/forced_move items. Matter: create_structure/permanent items. Time: haste/slow/freeze_duration items. Entropy: decay/destroy/transform items."`

---

## Summary Statistics

| Metric | Before Upgrades | After All Batches (Projected) |
|--------|----------------|-------------------------------|
| Total items | 146 | ~195 (146 + ~49 fills) |
| Alive items | 24 (16%) | ~160 (82%) |
| Dead items | 122 (84%) | ~35 (18%) -- remaining anomaly conditions |
| Empty matrix cells | 262/308 (85%) | ~180/308 (58%) |
| Unused primitives | 18/39 (46%) | 0/39 (0%) |
| Spheres < 3 items | 12/12 (100%) | 0/12 (0%) |
| Tags with deficit | 13 | 0 |
