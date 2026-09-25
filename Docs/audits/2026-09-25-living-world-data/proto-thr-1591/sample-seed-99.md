# Sample history — seed 99, medium (THR-1591 prototype, throwaway)

World built in 99 ms; the history pass sketch ran in **9 ms** (worldgen-time only, nothing read per tick).

Claims: **4 FACT** (already true in the t0 graph) · **10 PASS** (new facts the pass would write) · **8 FLAVOR** (prose only).

## The chronicle page — "Before you woke"

### The Elder Age
- **Stone-Set Craft** (The Pale Builders) — 62 ruins: 15 temples, 36 vaults, 11 battlefields.
- **Keepers of the Root Old Growth** (The Root-Speakers) — 26 ruins: 7 temples, 14 vaults, 5 battlefields.
- **The Breaking.** The Pale Builders and The Root-Speakers fought until neither stood. 16 battlefields remember it.
- *They built to last forever. Their empire did not.*
- *They spoke to the deep roots, and the roots answered — until they didn't.*

### The Settling
- **448 years ago** Luthane raised **Clay-shade** for Children of the Shadow-Kept light_forest, on stones The Pale Builders left behind.
- **445 years ago** Quirra raised **Stormborough** for Children of the Untamed river, on stones The Root-Speakers left behind.
- **409 years ago** Ryx raised **East Stormwick** for Shifting Root.
- 32 of 67 settlements belong to a living culture; 35 belong to none (freeholds, camps, crossroads towns).
- 57 of 67 settlements stand within three hexes of an elder ruin.

### Living memory
- **81 years ago** domain of Untamed river and hold of Shifting Root went to war. **Seed Ruins** burned and was never rebuilt. Lorica died there.
- **66 years ago** principality of Shadow-Kept light_forest and domain of Untamed river went to war. **Lost Muck Ruins** burned and was never rebuilt. Kethra died there.

### Wonders
- **Root Circle** — ground where the old rites were paid in blood. Hazel found it and did not come back the same. hold of Shifting Root keeps it now.
- **Sunken Pale Gloom** — a wonder no one has explained. No one keeps it.
- **Luminous Mire Grotto** — a wonder no one has explained. No one keeps it.
- **Stone Gallery** — a cave that sings when the wind turns. hold of Shifting Root keeps it now.
- **Mire Bower** — a wonder no one has explained. No one keeps it.
- **Fray Scatter** — a wonder no one has explained. Torva found it and did not come back the same. domain of Untamed river keeps it now.
- **Stone Geode** — a cave that sings when the wind turns. domain of Untamed river keeps it now.
- **Grey Gallery** — a cave that sings when the wind turns. Celosia found it and did not come back the same. No one keeps it.
- **Honeyed Raven Stand** — a grove whose leaves never fall. Jaxis found it and did not come back the same. No one keeps it.
- **Luminous Bloom Bower** — a wonder no one has explained. hold of Shifting Root keeps it now.

## Two place-sheet lines

> **Clay-shade** · Founded 448 years ago by Luthane. Built on The Pale Builders stone.
> **Battlefield Ruin** · The Root-Speakers battlefield. Fell in the Breaking. Never delved.

## The dead (9)

| Name | Who they were | Where they rest |
|---|---|---|
| Luthane | founder of Clay-shade | grave at Clay-shade |
| Quirra | founder of Stormborough | grave at Stormborough |
| Ryx | founder of East Stormwick | grave at East Stormwick |
| Lorica | fell leading domain of Untamed river against hold of Shifting Root | grave at Seed Ruins |
| Kethra | fell leading principality of Shadow-Kept light_forest against domain of Untamed river | grave at Lost Muck Ruins |
| Hazel | first to find Root Circle | legend at Root Circle |
| Torva | first to find Fray Scatter | legend at Fray Scatter |
| Celosia | first to find Grey Gallery | legend at Grey Gallery |
| Jaxis | first to find Honeyed Raven Stand | legend at Honeyed Raven Stand |

## What the past feeds

- domain of Untamed river ↔ hold of Shifting Root: an old war gives `old_quarrel` (THR-1593's notable package) a reason, and `seek_revenge` a dead commander to avenge
- principality of Shadow-Kept light_forest ↔ domain of Untamed river: an old war gives `old_quarrel` (THR-1593's notable package) a reason, and `seek_revenge` a dead commander to avenge
- `reclaim_homeland`: 57 settlements stand on elder land — a descendant claim needs only a `descends_from`-style fact on a mortal
- `chase_the_wonder`: 10 wonders, 4 with a legend a mortal can chase

## Every claim with its source

| Tag | Claim | Source |
|---|---|---|
| FACT | **Stone-Set Craft** (The Pale Builders) — 62 ruins: 15 temples, 36 vaults, 11 battlefields. | hist culture hist_culture_0; elder_ruin.originCultureId + archetype |
| FACT | **Keepers of the Root Old Growth** (The Root-Speakers) — 26 ruins: 7 temples, 14 vaults, 5 battlefields. | hist culture hist_culture_1; elder_ruin.originCultureId + archetype |
| PASS | **The Breaking.** The Pale Builders and The Root-Speakers fought until neither stood. 16 battlefields remember it. | event node history.war (era I), involves hist_culture_0,hist_culture_1; occurred_at the 16 battlefield ruins on the contested border |
| FLAVOR | *They built to last forever. Their empire did not.* | historical-culture template pale_builders.legacyFlavor |
| FLAVOR | *They spoke to the deep roots, and the roots answered — until they didn't.* | historical-culture template root_speakers.legacyFlavor |
| PASS | **448 years ago** Luthane raised **Clay-shade** for Children of the Shadow-Kept light_forest, on stones The Pale Builders left behind. | location.foundedYearsAgo=448; dead notable (founder) on the capital; nearest elder ruin ≤3 hexes = elder_ruin_67 |
| PASS | **445 years ago** Quirra raised **Stormborough** for Children of the Untamed river, on stones The Root-Speakers left behind. | location.foundedYearsAgo=445; dead notable (founder) on the capital; nearest elder ruin ≤3 hexes = elder_ruin_17 |
| PASS | **409 years ago** Ryx raised **East Stormwick** for Shifting Root. | location.foundedYearsAgo=409; dead notable (founder) on the capital; nearest elder ruin ≤3 hexes = none |
| FACT | 32 of 67 settlements belong to a living culture; 35 belong to none (freeholds, camps, crossroads towns). | settlement belongs_to culture edges at t0 |
| FACT | 57 of 67 settlements stand within three hexes of an elder ruin. | hex distance settlement → nearest elder_ruin |
| PASS | **81 years ago** domain of Untamed river and hold of Shifting Root went to war. **Seed Ruins** burned and was never rebuilt. Lorica died there. | event history.war, involves faction_1,faction_2; occurred_at loc_60; ruin.fellInEventId; dead notable |
| PASS | **66 years ago** principality of Shadow-Kept light_forest and domain of Untamed river went to war. **Lost Muck Ruins** burned and was never rebuilt. Kethra died there. | event history.war, involves faction_0,faction_1; occurred_at loc_47; ruin.fellInEventId; dead notable |
| PASS | **Root Circle** — ground where the old rites were paid in blood. Hazel found it and did not come back the same. hold of Shifting Root keeps it now. | wonder loc_103 (sacrifice_site); controls ← faction_2; dead notable (legend) — the only PASS part |
| FLAVOR | **Sunken Pale Gloom** — a wonder no one has explained. No one keeps it. | wonder loc_104 (shadow_hollow) |
| FLAVOR | **Luminous Mire Grotto** — a wonder no one has explained. No one keeps it. | wonder loc_116 (glowcap_hollow) |
| FLAVOR | **Stone Gallery** — a cave that sings when the wind turns. hold of Shifting Root keeps it now. | wonder loc_118 (crystal_cavern); controls ← faction_2 |
| FLAVOR | **Mire Bower** — a wonder no one has explained. No one keeps it. | wonder loc_119 (glowcap_hollow) |
| PASS | **Fray Scatter** — a wonder no one has explained. Torva found it and did not come back the same. domain of Untamed river keeps it now. | wonder loc_120 (glowcap_hollow); controls ← faction_1; dead notable (legend) — the only PASS part |
| FLAVOR | **Stone Geode** — a cave that sings when the wind turns. domain of Untamed river keeps it now. | wonder loc_123 (crystal_cavern); controls ← faction_1 |
| PASS | **Grey Gallery** — a cave that sings when the wind turns. Celosia found it and did not come back the same. No one keeps it. | wonder loc_125 (crystal_cavern); dead notable (legend) — the only PASS part |
| PASS | **Honeyed Raven Stand** — a grove whose leaves never fall. Jaxis found it and did not come back the same. No one keeps it. | wonder loc_126 (golden_grove); dead notable (legend) — the only PASS part |
| FLAVOR | **Luminous Bloom Bower** — a wonder no one has explained. hold of Shifting Root keeps it now. | wonder loc_128 (glowcap_hollow); controls ← faction_2 |

## Counts behind it

- Historical cultures: 2 · living cultures: 3 · realms: 3
- Elder ruins: 88 (The Pale Builders 62, The Root-Speakers 26) · plain ruins: 10 · settlements: 67 · wonders: 10
- Elder battlefield pair tally: The Pale Builders × The Root-Speakers 16