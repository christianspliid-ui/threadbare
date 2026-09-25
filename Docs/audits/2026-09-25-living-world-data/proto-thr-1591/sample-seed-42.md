# Sample history — seed 42, medium (THR-1591 prototype, throwaway)

World built in 83 ms; the history pass sketch ran in **9 ms** (worldgen-time only, nothing read per tick).

Claims: **5 FACT** (already true in the t0 graph) · **10 PASS** (new facts the pass would write) · **7 FLAVOR** (prose only).

## The chronicle page — "Before you woke"

### The Elder Age
- **The Inner Ash of the Downs** (The Ash-Crowned) — 65 ruins: 26 temples, 23 vaults, 16 battlefields.
- **Children of the Shifting coast** (The Tide-Callers) — 29 ruins: 9 temples, 10 vaults, 10 battlefields.
- **Keepers of the Lore Groves** (The Dream-Weavers) — 9 ruins: 2 temples, 4 vaults, 3 battlefields.
- **The Breaking.** The Tide-Callers and The Ash-Crowned fought until neither stood. 21 battlefields remember it.
- *They crowned themselves in ash and called it glory.*
- *They read the tides like scripture. The sea took them anyway.*
- *They built a civilization in dreams and forgot to wake.*

### The Settling
- **445 years ago** Davin raised **Wraithwood** for The Witness Skyfield, on stones The Tide-Callers left behind.
- **420 years ago** Noctis raised **Great Silverhold** for The Shadow-Kept light of the Thickets, on stones The Ash-Crowned left behind.
- **456 years ago** Ingrid raised **The Shattered Sanctum** for The Open Earth of the mountain_pass, on stones The Ash-Crowned left behind.
- 19 of 47 settlements belong to a living culture; 28 belong to none (freeholds, camps, crossroads towns).
- 45 of 47 settlements stand within three hexes of an elder ruin.

### Living memory
- **16 years ago** hold of Witness Skyfield and sovereignty of Open Earth went to war. **Crumbled Frost Remnant** burned and was never rebuilt. Alethia died there.
- **43 years ago** hold of Witness Skyfield and march of Shadow-Kept light went to war. **Stone Remnant** burned and was never rebuilt. Orin died there.

### Wonders
- **Singing Dawn Anvil** — an anvil that rings with no hammer on it. hold of Witness Skyfield keeps it now.
- **Silent Ice Ground** — ground where the old rites were paid in blood. No one keeps it.
- **Singing Stone Cavern** — a cave that sings when the wind turns. No one keeps it.
- **Raven-shroud** — a grove whose leaves never fall. Vesper found it and did not come back the same. march of Shadow-Kept light keeps it now.
- **Bright Wolf Chamber** — a cave that sings when the wind turns. No one keeps it.
- **Beacon Gallery** — a cave that sings when the wind turns. Serapha found it and did not come back the same. sovereignty of Open Earth keeps it now.
- **Deep Thorn Geode** — a cave that sings when the wind turns. Liora found it and did not come back the same. hold of Witness Skyfield keeps it now.
- **Singing Rock Cavern** — a cave that sings when the wind turns. Erebos found it and did not come back the same. No one keeps it.

## Two place-sheet lines

> **The Shattered Sanctum** · Founded 456 years ago by Ingrid. Built on The Ash-Crowned stone.
> **Battlefield Ruin** · The Ash-Crowned battlefield. Fell in the Breaking. Never delved.

## The dead (9)

| Name | Who they were | Where they rest |
|---|---|---|
| Davin | founder of Wraithwood | grave at Wraithwood |
| Noctis | founder of Great Silverhold | grave at Great Silverhold |
| Ingrid | founder of The Shattered Sanctum | grave at The Shattered Sanctum |
| Alethia | fell leading hold of Witness Skyfield against sovereignty of Open Earth | grave at Crumbled Frost Remnant |
| Orin | fell leading hold of Witness Skyfield against march of Shadow-Kept light | grave at Stone Remnant |
| Vesper | first to find Raven-shroud | legend at Raven-shroud |
| Serapha | first to find Beacon Gallery | legend at Beacon Gallery |
| Liora | first to find Deep Thorn Geode | legend at Deep Thorn Geode |
| Erebos | first to find Singing Rock Cavern | legend at Singing Rock Cavern |

## What the past feeds

- hold of Witness Skyfield ↔ sovereignty of Open Earth: an old war gives `old_quarrel` (THR-1593's notable package) a reason, and `seek_revenge` a dead commander to avenge
- hold of Witness Skyfield ↔ march of Shadow-Kept light: an old war gives `old_quarrel` (THR-1593's notable package) a reason, and `seek_revenge` a dead commander to avenge
- `reclaim_homeland`: 45 settlements stand on elder land — a descendant claim needs only a `descends_from`-style fact on a mortal
- `chase_the_wonder`: 8 wonders, 4 with a legend a mortal can chase

## Every claim with its source

| Tag | Claim | Source |
|---|---|---|
| FACT | **The Inner Ash of the Downs** (The Ash-Crowned) — 65 ruins: 26 temples, 23 vaults, 16 battlefields. | hist culture hist_culture_1; elder_ruin.originCultureId + archetype |
| FACT | **Children of the Shifting coast** (The Tide-Callers) — 29 ruins: 9 temples, 10 vaults, 10 battlefields. | hist culture hist_culture_0; elder_ruin.originCultureId + archetype |
| FACT | **Keepers of the Lore Groves** (The Dream-Weavers) — 9 ruins: 2 temples, 4 vaults, 3 battlefields. | hist culture hist_culture_2; elder_ruin.originCultureId + archetype |
| PASS | **The Breaking.** The Tide-Callers and The Ash-Crowned fought until neither stood. 21 battlefields remember it. | event node history.war (era I), involves hist_culture_0,hist_culture_1; occurred_at the 21 battlefield ruins on the contested border |
| FLAVOR | *They crowned themselves in ash and called it glory.* | historical-culture template ash_crowned.legacyFlavor |
| FLAVOR | *They read the tides like scripture. The sea took them anyway.* | historical-culture template tide_callers.legacyFlavor |
| FLAVOR | *They built a civilization in dreams and forgot to wake.* | historical-culture template dream_weavers.legacyFlavor |
| PASS | **445 years ago** Davin raised **Wraithwood** for The Witness Skyfield, on stones The Tide-Callers left behind. | location.foundedYearsAgo=445; dead notable (founder) on the capital; nearest elder ruin ≤3 hexes = elder_ruin_66 |
| PASS | **420 years ago** Noctis raised **Great Silverhold** for The Shadow-Kept light of the Thickets, on stones The Ash-Crowned left behind. | location.foundedYearsAgo=420; dead notable (founder) on the capital; nearest elder ruin ≤3 hexes = elder_ruin_83 |
| PASS | **456 years ago** Ingrid raised **The Shattered Sanctum** for The Open Earth of the mountain_pass, on stones The Ash-Crowned left behind. | location.foundedYearsAgo=456; dead notable (founder) on the capital; nearest elder ruin ≤3 hexes = elder_ruin_26 |
| FACT | 19 of 47 settlements belong to a living culture; 28 belong to none (freeholds, camps, crossroads towns). | settlement belongs_to culture edges at t0 |
| FACT | 45 of 47 settlements stand within three hexes of an elder ruin. | hex distance settlement → nearest elder_ruin |
| PASS | **16 years ago** hold of Witness Skyfield and sovereignty of Open Earth went to war. **Crumbled Frost Remnant** burned and was never rebuilt. Alethia died there. | event history.war, involves faction_0,faction_2; occurred_at loc_55; ruin.fellInEventId; dead notable |
| PASS | **43 years ago** hold of Witness Skyfield and march of Shadow-Kept light went to war. **Stone Remnant** burned and was never rebuilt. Orin died there. | event history.war, involves faction_0,faction_1; occurred_at loc_56; ruin.fellInEventId; dead notable |
| FLAVOR | **Singing Dawn Anvil** — an anvil that rings with no hammer on it. hold of Witness Skyfield keeps it now. | wonder loc_67 (master_forge); controls ← faction_0 |
| FLAVOR | **Silent Ice Ground** — ground where the old rites were paid in blood. No one keeps it. | wonder loc_68 (sacrifice_site) |
| FLAVOR | **Singing Stone Cavern** — a cave that sings when the wind turns. No one keeps it. | wonder loc_69 (crystal_cavern) |
| PASS | **Raven-shroud** — a grove whose leaves never fall. Vesper found it and did not come back the same. march of Shadow-Kept light keeps it now. | wonder loc_97 (golden_grove); controls ← faction_1; dead notable (legend) — the only PASS part |
| FLAVOR | **Bright Wolf Chamber** — a cave that sings when the wind turns. No one keeps it. | wonder loc_101 (crystal_cavern) |
| PASS | **Beacon Gallery** — a cave that sings when the wind turns. Serapha found it and did not come back the same. sovereignty of Open Earth keeps it now. | wonder loc_107 (crystal_cavern); controls ← faction_2; dead notable (legend) — the only PASS part |
| PASS | **Deep Thorn Geode** — a cave that sings when the wind turns. Liora found it and did not come back the same. hold of Witness Skyfield keeps it now. | wonder loc_109 (crystal_cavern); controls ← faction_0; dead notable (legend) — the only PASS part |
| PASS | **Singing Rock Cavern** — a cave that sings when the wind turns. Erebos found it and did not come back the same. No one keeps it. | wonder loc_110 (crystal_cavern); dead notable (legend) — the only PASS part |

## Counts behind it

- Historical cultures: 3 · living cultures: 3 · realms: 3
- Elder ruins: 103 (The Ash-Crowned 65, The Tide-Callers 29, The Dream-Weavers 9) · plain ruins: 7 · settlements: 47 · wonders: 8
- Elder battlefield pair tally: The Tide-Callers × The Ash-Crowned 21; The Ash-Crowned × The Dream-Weavers 8