# Attachment Pipeline: Remaining Possessions (Final)
> Category: possessions | Slug: upgrade-remaining-possessions | Pass: final
> Status: **READY FOR IMPLEMENTATION**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 41 items across relics(7), tomes(8), tools(7), provisions(7), mounts(6), starters(6) |
| Editorial | PASS WITH REVISIONS | Tag corrections: #flesh → #iron/#heart on items 2, 18, 27 |
| Systems | READY FOR IMPLEMENTATION | 1 value fix (Codex veil 0.18→0.15); 5 soft notes; 0 failures |

## Approved Attachments

All 41 items approved. See `upgrade-remaining-possessions-revised.md` for full TypeScript-formatted objects.

### Quick Reference

| ID | Name | Tier | Effects | Status |
|----|------|------|---------|--------|
| reward_relics_talismans_wayfarers_charm | Wayfarer's Charm | T1 | passive+conditional | PASS |
| reward_relics_talismans_bone_ward | Bone Ward | T1 | passive+tag_immunity | PASS |
| reward_relics_talismans_ember_sigil | Ember Sigil | T2 | passive×2+reactive | PASS |
| reward_relics_talismans_shadowglass_pendant | Shadowglass Pendant | T2 | passive+reveal | PASS |
| reward_relics_talismans_heart_of_the_barrow | Heart of the Barrow | T3 | passive×2+aura+stacking | PASS |
| reward_relics_talismans_the_weeping_icon | The Weeping Icon | T3 | passive×2+reactive+axiological_drift | PASS |
| reward_relics_talismans_the_fulcrum | The Fulcrum | T4 | passive×2+aura+conditional+test_shaper | PASS |
| reward_tomes_scrolls_field_journal | Field Journal | T1 | passive+conditional | PASS |
| reward_tomes_scrolls_prayer_scroll | Prayer Scroll | T1 | passive+consumable_charge | PASS |
| reward_tomes_scrolls_merchants_ledger | Merchant's Ledger | T1 | passive+conditional | PASS |
| reward_tomes_scrolls_chronicle_of_the_falling | Chronicle of the Falling | T2 | passive+test_shaper | PASS |
| reward_tomes_scrolls_veilscript_fragment | Veilscript Fragment | T2 | passive×2+stacking | PASS |
| reward_tomes_scrolls_smugglers_chart | Smuggler's Chart | T1 | passive+conditional | PASS |
| reward_tomes_scrolls_codex_of_unmaking | Codex of Unmaking | T4 | passive×2+action_gate+reveal+axiological_drift | PASS (veil 0.15) |
| reward_tomes_scrolls_the_silent_testament | The Silent Testament | T3 | passive×2+prevent_loss+conditional | PASS |
| reward_tools_instruments_surveyors_glass | Surveyor's Glass | T1 | passive+range_modifier | PASS |
| reward_tools_instruments_iron_tongs | Iron Tongs | T1 | passive+conditional | PASS |
| reward_tools_instruments_herbalists_pouch | Herbalist's Pouch | T1 | passive+consumable_charge | PASS |
| reward_tools_instruments_gate_seal_case | Gate Seal Case | T1 | passive×2+conditional | PASS WITH NOTE |
| reward_tools_instruments_master_chisel | Master Chisel | T2 | passive+stacking | PASS |
| reward_tools_instruments_alchemists_crucible | Alchemist's Crucible | T2 | passive×2+cooldown | PASS |
| reward_tools_instruments_the_astrolabe_of_yven | Astrolabe of Yven | T3 | passive×2+reveal+conditional | PASS |
| reward_provisions_travelers_wine | Traveler's Wine | T1 | decay | PASS WITH NOTE |
| reward_provisions_hardtack_and_salt | Hardtack and Salt | T1 | passive+conditional | PASS |
| reward_provisions_waterskin | Full Waterskin | T1 | decay | PASS |
| reward_provisions_firestarter_kit | Firestarter Kit | T1 | passive+consumable_charge | PASS |
| reward_provisions_healing_poultice | Healing Poultice | T2 | decay | PASS |
| reward_provisions_sanctuary_incense | Sanctuary Incense | T2 | until_event×2 | PASS |
| reward_provisions_veilwater_flask | Veilwater Flask | T3 | decay×2+reveal | PASS |
| reward_mounts_beasts_draft_pony | Draft Pony | T1 | passive+range_modifier | PASS |
| reward_mounts_beasts_hound | Tracking Hound | T1 | passive+behavior_weight | PASS |
| reward_mounts_beasts_pack_goat | Pack Goat | T1 | passive+slot_bonus | PASS |
| reward_mounts_beasts_steppe_mare | Steppe Mare | T2 | passive×2+range_modifier+reactive | PASS WITH NOTE |
| reward_mounts_beasts_war_hound | War Hound | T2 | passive×2+conditional+social_modifier | PASS WITH NOTE |
| reward_mounts_beasts_ashenmane_destrier | Ashenmane Destrier | T3 | passive×2+range_modifier+trait_grant+behavior_weight | PASS WITH NOTE |
| starter_ashenmane_fang | Ashenmane's Fang | T2 | passive+conditional | PASS |
| starter_road_worn_mule | Road-Worn Mule | T1 | passive+range_modifier | PASS |
| starter_ashenmane_horse | Ashenmane Horse | T2 | range_modifier+trait_grant | PASS |
| starter_copper_market_rations | Copper Market Rations | T1 | decay | PASS |
| starter_burned_codex | Burned Codex | T2 | passive+conditional | PASS |
| starter_whispering_eye | The Whispering Eye | T3 | passive×2+reveal+reactive | PASS |

## Excluded Items

None.

## Implementation Notes

- **Codex of Unmaking**: catalog has `veil: 0.18` reachBonus — exceeds EFFECT_PER_ITEM_CAP(0.15). Implementation uses 0.15. This is a balance fix.
- **Bone Ward**: catalog tag `#flesh` updated to `#iron` (reach remapping).
- **Herbalist's Pouch**: catalog tag `#flesh` updated to `#heart` (reach remapping).
- **Healing Poultice**: catalog tag `#flesh` updated to `#heart` (reach remapping).
- **Smuggler's Chart**: preserves `grantsTraitWhileHeld`, `grantedTraitLevel`, `consumeOnEvent` fields.
- **Burned Codex**: preserves existing `onUseTriggers` array.
- **Whispering Eye**: preserves existing `onUseTriggers` array.
- **Ashenmane's Fang**: `type: 'artifact_legendary'` preserved (not standard 'artifact').
- All `reachBonus` fields removed from upgraded items.
