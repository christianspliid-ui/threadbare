> **Decision record for THR-1834** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Attended session 2026-10-14. Christian judged the comparison sheet and chose in chat: **the carved game-icons.net set for world and story icons**, and **option A, the same carved set for the top bar and controls** (option B, lucide thin-line icons, rejected). Human gate satisfied via chat review 2026-10-14. Input: the THR-1826 icon inventory (Linear resolution comment, 2026-10-11). Substrate counts below were measured against `origin/main` at `3cf81086`.

# THR-1834 — The icon family

## The decision in one paragraph

The game gets **one carved icon family** for everything that is not already drawn by hand: a curated subset of **game-icons.net** (CC BY 3.0), recoloured through `currentColor`, used for world and story concepts **and** for the top bar and controls. **Places are carved too**, on the map and in every panel, so a castle looks the same everywhere and each kind of place reads at a glance. The game's **own drawings stay** for the three classes that have them (spheres, reaches, heraldry), and they replace the emoji and symbol copies that sit beside them today. **lucide leaves the player surfaces.** Emoji and symbol characters used as icons may only go down, counted by the THR-1821 ratchet.

**Assets:** the comparison sheet Christian judged — [published page](https://claude.ai/artifact/W3kwE3ZamWQNC3QBVKwV9r) · source [`icon-family.html`](2026-10-14-thr-1834-icon-family/icon-family.html) · render at 1440 wide [`sheet-1440.png`](2026-10-14-thr-1834-icon-family/sheet-1440.png). It shows 33 world concepts, 11 places, 6 spheres, 4 reaches and 12 controls, each next to the glyph it replaces, plus the top bar drawn in both candidate styles.

**Swaps after review (Christian, chat 2026-10-14):** the first sheet's *Disease* (`virus`, a bacteriophage) and *Ambition* (`summits`) read wrong for the world. Christian picked from shown alternatives: **Disease → `plague-doctor-profile`**, **Ambition → `holy-grail`**. The crown stays with Notables (one shape per concept). Disease and Poison shared ☠ today, so **Poison** now gets its own shape, `poison-bottle`. The sheet (version 2) and its render show the swaps.

**Places carved (Christian, chat 2026-10-14):** he found the map's place drawings "very alike at a glance and a bit too abstract". Version 3 of the sheet adds a glance test: all 11 place types in the map's near-black ink on map colours, at 30 px and 20 px, today's drawings above the carved picks ([`places-glance.png`](2026-10-14-thr-1834-icon-family/places-glance.png)). He chose **carved everywhere**: on the map and in every panel. The other two options were carved in panels only, which would bring back two looks per place (Law 9), and redrawing our own more distinctly. This replaces the earlier call that the map's place registry wins its class. The ask conforms to Laws 10 and 11 (distinct shapes, legible at size).

## What the game has today

From the THR-1826 inventory unless marked *measured*:

- About **330 concepts** drawn with about **163 distinct glyph and emoji codepoints** across 145 files, plus 9 drawn systems, 2 PNG sets and lucide.
- **5 classes break Law 9** (more than one vocabulary for one class): spheres ×3, reaches ×3, places ×3, encounter activity ×3, factions ×2.
- **About 12 glyphs break Law 10** (one glyph, several meanings): ⬡ carries 7 meanings, ✦ about 10, ⚖ 5; ◈ is both Time and Order.
- Emoji render in the operating system's colour emoji font, so they break the dark-gold palette, look different per platform and do not carry to Unity.
- **Six effect glyphs are broken** in `src/components/Game/attachmentGlyphs.ts` (malformed 5-digit escapes; Reveal shows "ὄ1", Compel "ᾟF"). Filed as [THR-1874](https://linear.app/threadbare/issue/THR-1874) (Ready for Dev) so it is fixed before the migration reaches that file.
- *Measured:* lucide is imported by 5 player-surface files: `Game/chronicle/SoulCard.tsx`, `Game/Encounter/ProseTtsButton.tsx`, `Game/HexChronicle.tsx`, `Game/LocationView.tsx`, `StartPage/StartPage.tsx`.

## The calls

### 1. One family: game-icons.net, curated

- **Scope:** every content concept (effects, attachments, conditions, encounter activity, codex and undertaking kinds, card types, alerts, omens, doom, callings, ambitions, seasons, factions' generic marks) **and** all UI chrome (pause, play, faster, find, needs-you, doom, omen, rivals, notables, read the threads, settings, close, disclosure).
- **Curated, not the whole set:** about 200 shapes, chosen per concept, vendored into the repo as single-path SVG data. No runtime fetch, no icon font, no npm icon package at runtime.
- **Licence:** CC BY 3.0. Credit Lorc, Delapouite and the other authors whose icons ship, with the licence name and link, on the credits screen, and note that they are recoloured. CC BY 3.0 forbids "effective technological measures" on the work itself: check with whoever handles legal before shipping on a DRM storefront (many Steam games ship these icons).
- **Why carved over drawing our own:** the set covers about 85–90% of the non-map concepts at once, its woodcut weight sits well beside Cinzel and the gold tokens, and each in-house icon would cost drawing time for about 200 shapes.

### 2. Our own drawings stay, and win their classes

| Class | The one vocabulary | Retired duplicates |
|---|---|---|
| Spheres | `SphereIcon` (`src/components/icons/SphereIcon.tsx`) | `SPHERE_ICONS.symbol` in `src/data/sphereIcons.ts`; PNG `public/icons/spheres` |
| Reaches | `ReachIcon` | `REACH_GLYPHS` in `codexRegistry.ts` and its copy in `CodexTagFilter`; tiered PNG `public/assets/reaches/*` |
| Factions | `CoatOfArms` heraldry | emoji `iconGlyph` in the faction definitions |
| Odds, cost, forecast, difficulty | the THR-972 drawn set (`ForecastDie`, `DifficultyScales`, pips) | none; already separated |
| Terrain | `signifierRegistry` | none |

### 2b. Places: carved, on the map and in panels

Each place type gets one carved shape, used by the map and by every panel. The emoji in `HexPoiPanel.tsx`, `sublocation-concept-art.ts` and the ⌂ / 🏘 in codex and toasts all retire, and so do the drawings in `LOCATION_ICON_REGISTRY` (`src/components/HexMapV2/locations/locationIconRegistry.ts`).

| Place | Shape | Also tried |
|---|---|---|
| Capital | `tower-flag` | `medieval-gate` |
| City | `medieval-gate` | `triple-gate` |
| Town | `village` | `medieval-village-01` |
| Hamlet | `wood-cabin` | `huts-village` |
| Castle | `white-tower` | `stone-tower` |
| Temple | `greek-temple` | `church`, `byzantin-temple` |
| Shrine | `fire-shrine` | `star-altar`, `obelisk` |
| Ruins | `ancient-ruins` | `castle-ruins` |
| Mine | `mine-wagon` | `gold-mine` |
| Camp | `camping-tent` | `barracks-tent` |
| Lair | `cave-entrance` | `mountain-cave` |

- **On the map:** the same near-black ink and outline pass as today (`locationIconTextures.ts`). A carved shape is one SVG path (viewBox `0 0 512 512`), so the texture builder takes it as `{ d, opacity: 1 }`. The size classes stay, so a capital still draws larger than a town.
- **Lair tints** by sphere (`LAIR_SPHERE_FILL_COLORS`) carry over unchanged. A cleared lair keeps its muted fill.
- **The other registry types** (fort, tower, ruined city/tower/village, battleground, unexplored point of interest, cleared lair) get carved shapes in the rollout under the same rules. A missing place shape is never an emoji.
- **Sublocations** use their parent type's shape unless they have their own.

### 3. lucide leaves the player surfaces

Christian picked the carved set for the top bar (option A on the sheet: one look for the whole game). The 5 lucide importers above move to carved icons. Debug, CMS, the style guide and lab tools may keep lucide.

### 4. Style rules

- **Filled silhouettes, one colour, `currentColor`.** No outline variants, no second tone.
- **Sphere colour tints, never repaints:** a sphere-tied icon takes the sphere colour through `color`; the shape stays the same.
- **Named sizes:** 14 px floor for a meaning-bearing icon, 18 px inside a chip, 24 px in a list row, 34 px when the icon carries meaning alone with no word beside it (Law 11). At 1440p the THR-1819 root step-up scales these with the rest of the UI.
- **One idea, one icon (Laws 9, 10):** the registry is keyed by concept, and a build test fails if two concepts share one shape.
- **Accessibility:** shape first, colour second; every meaning-bearing icon has an `aria-label` that states the meaning in words.

### 5. Labels

| Where | Rule |
|---|---|
| Top bar | Icon and word, always (THR-1828) |
| Ledger strip (folded rail) | Icon with a count and a tooltip; it is a strip of icons by THR-1828's design, so the tooltip carries the word |
| Chips, rows, buttons | Icon and word |
| A lone icon (card corner, map marker, odds) | 34 px, tooltip, and a legend at first contact (Law 12; the hand's glyph legend is the pattern) |

### 6. Coverage

The sheet fixes the family and proves it on 45 concepts. Mapping the remaining concepts to shapes is executor work inside the migration, under the rules above: one shape per concept, chosen from the family, recorded in the registry. An executor may swap a shape the sheet picked when a better one reads more clearly at 18 px (the sheet's *Rivals* pick, `duel`, is the weakest), as long as the shape stays unique. The picks on the sheet:

| Concept | Shape | Concept | Shape |
|---|---|---|---|
| Battle | `crossed-swords` | Siege | `catapult` |
| Army | `knight-banner` | Trade | `two-coins` |
| Work | `anvil` | Healing | `healing` |
| Journey | `footprint` | Waiting | `hourglass` |
| Scheme | `spider-web` | Unrest | `mailed-fist` |
| Relic | `gem-pendant` | Curse | `cursed-star` |
| Blessing | `angel-wings` | Debt, bargain | `scales` |
| Pact, oath | `shaking-hands` | Mandate | `scroll-quill` |
| Reveal | `all-seeing-eye` | Compel | `puppet` |
| Undertaking | `compass` | Ambition | `holy-grail` |
| Faction (generic) | `flying-flag` | Spell | `magic-swirl` |
| Disease | `plague-doctor-profile` | Poison | `poison-bottle` |
| Wound | `bleeding-wound` | | |
| Companion | `hooded-figure` | Tome | `scroll-unfurled` |
| Omen | `crystal-ball` | Doom | `sands-of-time` |
| Spring / Summer | `sprout` / `sun` | Autumn / Winter | `falling-leaf` / `snowflake-1` |
| Pause / Play | `pause-button` / `play-button` | Faster | `fast-forward-button` |
| Find | `magnifying-glass` | Needs you | `ringing-bell` |
| Rivals | `duel` | Notables | `crown` |
| Read the Threads | `sewing-string` | Settings / Close | `cog` / `cancel` |

### 7. Enforcement

Folded into THR-1821's single UI-debt ratchet: emoji and symbol characters used as icons in components, and lucide imports in player surfaces, may only go down. The concept registry's uniqueness test (call 4) guards Law 10.

### 8. Unity

Every icon is one flat path. The registry stores path data, not React components, so a build step can bake a sprite atlas (or MSDF) and TextMeshPro sprite assets for icons inside running text. Our drawn sets are already path data.

## What this feeds

| Ticket | Takes |
|---|---|
| THR-1821 (component library) | The `Icon` primitive (registry name → path data, named sizes, `currentColor`, `aria-label`) and the two ratchet patterns |
| THR-1828 (frame) | Top-bar and Ledger-strip icons |
| THR-1819 (layout contract) | The size constants scale with the root step-up |
| THR-1874 (bug) | Fix the six broken escapes before the migration |
| THR-1878 (map lenses and chrome plan doc) | Place icons on the map switch to the carved shapes (call 2b) |
| THR-1879 (type and icons rollout plan doc) | The place shapes join the registry; the map's `LOCATION_ICON_REGISTRY` drawings and the place emoji retire |
| The map's plan docs | Every new surface draws from this registry from day one |
