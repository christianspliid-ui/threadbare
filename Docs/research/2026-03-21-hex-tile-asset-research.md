# Hex Tile Asset Research — Terrain, Building & POI Sprites

**Date:** 2026-03-21
**Goal:** Find pre-made black/dark sprite icons to overlay on programmatically-colored hex tiles. Classic hex-crawl cartography style (Mystara / Known World aesthetic).

**Target approach:** Engine generates colored hex fills per biome. Small icon sprites (terrain indicators like trees, mountains; settlement indicators like cities, villages; POI markers like ruins, shrines) are composited on top as overlays.

---

## Tier 1 — Best Fit (black/dark icons designed as hex overlays)

### 1. Inkwell Ideas — Hexographer/Worldographer Public Domain Icons
- **What:** Black & white classic hex map icons — the exact style from old-school D&D hex maps
- **Coverage:** Terrain (mountains, forests, hills, swamps, desert), settlements (city, town, village, castle, fortress), POIs (ruins, shrine, cave, mine)
- **License:** **Public domain** — no attribution, full commercial use
- **Format:** PNG icons designed to sit inside hex cells
- **Cost:** Free
- **Links:**
  - [B&W Classic Icons](https://www.hexographer.com/extra-icon-sets/black-white-classic/)
  - [Extra Icon Sets (includes multicolor + B&W)](https://worldographer.com/extra-icon-sets/)
  - [Alternate Classic Hex Map Icons on DriveThruRPG](https://www.drivethrurpg.com/en/product/101879/alternate-classic-hex-map-icons)
- **Why it fits:** This IS the Mystara map style. Public domain. Black icons on colored hexes. Exactly the reference images you shared. The "1e World Style" premium set ($5) adds 200+ icons for even more variety.
- **Concerns:** Icons are designed for Hexographer's grid size — may need scaling. Style is very old-school; may want to pair with a more polished set for final release.

### 2. Simple Hex Map Icons — Hexed Press
- **What:** Clean, hand-drawn hex map icons with transparent background overlay versions
- **Coverage:** Terrain types (mountains, forests, desert, hills), settlements, POIs
- **License:** Commercial license included
- **Format:** PNG with transparent backgrounds; includes both hex-bordered and borderless overlay versions
- **Cost:** ~$1.60
- **Link:** [Simple Hex Map Icons on itch.io](https://hexedpress.itch.io/simple-hex-map-icons)
- **Why it fits:** Overlay versions without hex borders are exactly what you need — black icons with white outline to pop against any colored hex fill. Still expanding with regular updates.
- **Concerns:** Smaller set than Inkwell; may not cover all biomes yet.

### 3. Basic Fantasy RPG — Hex Mapping Symbols
- **What:** Community-created silhouette-style hex symbols
- **Coverage:** Cities, ruins, castles, shrines, temples, tropical forests, bamboo, bogs, swamps, desert, badlands, oasis
- **License:** Community project; check thread for specifics (generally permissive)
- **Format:** PNG silhouettes
- **Cost:** Free
- **Link:** [Basic Fantasy RPG Forums — Hex Mapping Symbols](https://www.basicfantasy.org/forums/viewtopic.php?t=4295)
- **Why it fits:** Silhouette style works perfectly as dark overlays. Good coverage of unusual biomes (tropical, bamboo, cypress swamp) that other packs miss.
- **Concerns:** Community project — inconsistent quality between contributors. Need to manually download from forum thread.

---

## Tier 2 — Strong Candidates (full hex tiles, but elements are extractable)

### 4. Hexcrawl Hex Tiles — Aledroid
- **What:** Cartography-style hex tiles inspired by old master cartographers, hand-drawn with K.M. Alexander brushes
- **Coverage:** 9+ POI sprites, forests, hills, mountains, rivers, plains, farms, cities, towns, caves, swamps, deserts, wetlands
- **Format:** 420×480 PNG with transparent backgrounds
- **License:** Commercial use allowed
- **Cost:** From $2
- **Link:** [Hexcrawl Hex Tiles on itch.io](https://ipainthings.itch.io/hexcrawltiles)
- **Why it fits:** Classic cartographic style. Transparent backgrounds mean the drawn elements could potentially be extracted or used as overlays. Recently updated (v1.3) with POI sprites.
- **Concerns:** Designed as complete hex tiles (terrain fill + icons together), not as separate overlay sprites. Would need to evaluate whether the terrain elements are separable from the fill.

### 5. HPS Cartography Kit — Highland Paranormal Society
- **What:** 400–600+ hand-drawn hex map images covering terrain, structures, water/ships, and icons
- **Coverage:** Terrain (comprehensive), structures (buildings, settlements, fortifications), water features, generic icons in two sizes
- **License:** Commercial use with credit to Highland Paranormal Society
- **Format:** Designed for Hex Kit but usable in other tools
- **Cost:** Paid (check itch.io for current price)
- **Links:**
  - [HPS Cartography Kit on itch.io](https://natetreme.itch.io/cartographykit)
  - [HPS Cartography Kit on DriveThruRPG](https://www.drivethrurpg.com/en/product/310328/hps-cartography-kit)
- **Why it fits:** Huge library with consistent hand-drawn style. Icons come in two sizes. Dark ink aesthetic matches the old-school hex crawl look.
- **Concerns:** May be full hex tiles rather than separable icon overlays. Attribution required for commercial use.

### 6. Perplexing Ruins Hex Kit Tiles
- **What:** 70+ hand-drawn tiles including terrain, encounters, and "strange objects"
- **Coverage:** Trees, mountains, water, towers, islands, ghosts, hills, encounters
- **License:** Donation-based ($2 minimum)
- **Format:** Both colored AND black-and-white versions included
- **Cost:** $2 minimum
- **Link:** [Perplexing Ruins Hex Kit Tiles on itch.io](https://perplexingruins.itch.io/perplexing-ruins-hex-kit-tiles)
- **Why it fits:** Explicitly includes B&W versions — perfect for dark overlay use. Dark fantasy art style. Includes "strange objects" that work as POI markers.
- **Concerns:** Only 70 tiles — smaller set. Designed for Hex Kit.

---

## Tier 3 — Supplementary / Prototyping

### 7. Kenney — Hexagon Kit + Map Pack (CC0)
- **What:** Clean, stylized hex tiles and map icons
- **Coverage:**
  - Hexagon Kit (70 assets): Fantasy buildings, landscape elements, path/river tiles
  - Map Pack (180 assets): Map markers, terrain icons, settlement symbols
- **License:** **CC0** — completely unrestricted commercial use
- **Format:** PNG (2D) + FBX/GLB/OBJ (3D kit)
- **Cost:** Free
- **Links:**
  - [Kenney Hexagon Kit](https://kenney.nl/assets/hexagon-kit)
  - [Kenney Hexagon Tiles](https://kenney.nl/assets/hexagon-tiles)
  - [Kenney Hexagon Buildings](https://kenney.nl/assets/hexagon-buildings)
  - [Kenney Map Pack](https://kenney.nl/assets/map-pack)
- **Why it fits:** Zero-risk licensing. Great for rapid prototyping. Map Pack icons could work as POI markers.
- **Concerns:** Clean/modern art style may clash with old-school hex crawl aesthetic. Hexagon Kit is primarily 3D models. Would need heavy restyling for the Threadbare look.

### 8. Isle of Lore 2: Hex Tiles + Terrain Icons — Steven Colling
- **What:** Comprehensive hex tile system with 2160 tiles, 30 location icons, 60 flairs, 60 markers, plus separate terrain icon pack
- **Coverage:** Forests, grasslands, meadows, hills, valleys, mountains, deserts, jungles, swamps, cities, wheat fields, oceans. Winter variants. Paths, roads, rivers.
- **License:** Commercial use
- **Format:** PNG, source files (Krita/Photoshop) included
- **Cost:** Paid (check itch.io)
- **Links:**
  - [Isle of Lore 2 Hex Tiles](https://stevencolling.itch.io/isle-of-lore-2-hex-tiles-regular)
  - [Isle of Lore 2 Terrain Icons](https://stevencolling.itch.io/terrain-icons)
- **Why it fits:** Most comprehensive hex tile ecosystem available. Source files mean icons could be extracted and restyled. 26 terrain icons available as a separate pack.
- **Concerns:** Full-color painterly style, not the old-school B&W aesthetic. Would need significant restyling to use as dark overlay sprites.

### 9. David Baumgart — Hex Terrain Series
- **What:** Hand-painted 2D terrain hex tiles, sold in themed packs
- **Coverage:** Basic set (13 biomes × 4 variations), rivers/coasts/seas (42 decor sprites), tropics/wetlands, deserts, cold lands, volcanic wastes
- **License:** Commercial use
- **Format:** 256×384 PNG (taller than wide for overlap effects)
- **Cost:** Paid per pack; free sample available
- **Links:**
  - [Hex Basic Terrain Set](https://dgbaumgart.itch.io/hex-basic-set-terrain)
  - [Free Sample Set](https://dgbaumgart.itch.io/hex-and-tile-terrain-sample-set)
  - [Rivers, Coasts & Seas](https://dgbaumgart.itch.io/hex-rivers-costs-and-seas)
- **Why it fits:** Beautiful hand-painted style. Rivers/coasts pack includes 42 decor sprites (bridges, docks, ships) that could work as overlays.
- **Concerns:** Painted/colorful style — would need to be converted to silhouettes or monochrome for the overlay approach.

---

## Tier 4 — Tools & Platforms (extract icons from)

### 10. CartographyAssets.com
- **What:** Community marketplace with 1000+ symbols and icon packs
- **Coverage:** Mountains (volcanic, rounded), settlements, terrain symbols — wide variety
- **License:** Varies per asset; many are free for commercial use
- **Link:** [CartographyAssets Symbols](https://cartographyassets.com/asset-category/symbols/)
- **Note:** Designed for Wonderdraft/Dungeondraft but icons are standard PNG — extractable.

### 11. Pandius Hex Mapping Legend
- **What:** Comprehensive hex icon reference from the Mystara community
- **Coverage:** Mountains, hills, forests (many types), deserts, badlands, settlements, special features
- **Link:** [Pandius Hex Legend](https://pandius.com/rdhxlgnd.html)
- **Note:** Reference/inspiration for what icon categories exist in classic hex maps. May include downloadable icons.

### 12. Hex Kit (Software)
- **What:** Desktop app for building hex maps with emphasis on art
- **Link:** [Hex Kit](https://coneofnegativeenergy.com/hex-kit/)
- **Note:** Not an asset pack itself, but its tile pack ecosystem (HPS, Perplexing Ruins, etc.) produces the exact aesthetic you're going for.

---

## Recommendation Strategy

### For immediate prototyping:
1. **Inkwell Ideas B&W Classic Icons** (free, public domain) — drop these directly onto colored hexes. This is the fastest path to the Mystara look.
2. **Kenney Map Pack** (free, CC0) — supplement with POI markers and settlement icons.

### For production quality:
3. **Hexed Press Simple Hex Map Icons** ($1.60) — cleaner overlay versions with white outlines.
4. **HPS Cartography Kit** (paid) — largest hand-drawn collection with consistent style.
5. **Perplexing Ruins** ($2) — specifically for the B&W versions and dark fantasy POIs.

### For maximum flexibility:
6. **Isle of Lore 2 Terrain Icons** (paid) — 26 clean terrain icons designed for UI/legend use, could be restyled.
7. **CartographyAssets.com** — browse for specific missing categories.

### Recommended pipeline:
1. Start with Inkwell Ideas public domain icons for the prototype
2. Evaluate style fit against the Threadbare dark aesthetic
3. If the classic B&W style works, supplement with Hexed Press + Perplexing Ruins for POIs
4. If we want a custom style, use these as reference and commission/generate custom icon sprites

---

## Coverage Matrix

| Category | Inkwell PD | Hexed Press | Basic Fantasy | Aledroid | HPS | Perplexing Ruins | Kenney |
|----------|-----------|-------------|---------------|----------|-----|-----------------|--------|
| Mountains | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Forests | ✅ | ✅ | ✅ (incl. tropical) | ✅ | ✅ | ✅ | ✅ |
| Hills | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Desert | ✅ | ✅ | ✅ (incl. oasis) | ✅ | ✅ | ? | ✅ |
| Swamp/Wetland | ✅ | ? | ✅ (cypress, bog) | ✅ | ✅ | ? | ? |
| Ocean/Water | ✅ | ? | ? | ✅ | ✅ | ✅ | ✅ |
| City/Town | ✅ | ? | ✅ | ✅ | ✅ | ? | ✅ |
| Village | ✅ | ? | ? | ✅ | ✅ | ? | ✅ |
| Castle/Fortress | ✅ | ? | ✅ | ? | ✅ | ✅ | ? |
| Ruins | ✅ | ? | ✅ | ? | ✅ | ✅ | ? |
| Shrine/Temple | ? | ? | ✅ | ? | ? | ? | ? |
| Cave/Mine | ✅ | ? | ? | ✅ | ? | ? | ? |
| Roads/Paths | separate | ? | ? | ? | ? | ? | ✅ |
| Rivers | separate | ? | ? | ✅ | ✅ | ? | ✅ |
| B&W versions | ✅ native | ✅ overlay | ✅ silhouette | ❌ | ? | ✅ explicit | ❌ |
| Public domain | ✅ | ❌ (commercial license) | check thread | ❌ | ❌ (credit req) | ❌ ($2 min) | ✅ CC0 |
