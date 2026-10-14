> **Decision record for THR-1834** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Attended session 2026-10-14. Christian judged the comparison sheet and chose in chat: **the carved game-icons.net set for world and story icons**, and **option A, the same carved set for the top bar and controls** (option B, lucide thin-line icons, rejected). Human gate satisfied via chat review 2026-10-14. Input: the THR-1826 icon inventory (Linear resolution comment, 2026-10-11). Substrate counts below were measured against `origin/main` at `3cf81086`.

# THR-1834 — The icon family

## The decision in one paragraph

The game gets **one carved icon family** for everything that is not already drawn by hand: a curated subset of **game-icons.net** (CC BY 3.0), recoloured through `currentColor`, used for world and story concepts **and** for the top bar and controls. The game's **own drawings stay** for the four classes that already have them (spheres, reaches, heraldry and map places), and they replace the emoji and symbol copies that sit beside them today, so a castle looks the same on the map and in the panel next to it. **lucide leaves the player surfaces.** Emoji and symbol characters used as icons may only go down, counted by the THR-1821 ratchet.

**Assets:** the comparison sheet Christian judged — [published page](https://claude.ai/artifact/W3kwE3ZamWQNC3QBVKwV9r) · source [`icon-family.html`](2026-10-14-thr-1834-icon-family/icon-family.html) · render at 1440 wide [`sheet-1440.png`](2026-10-14-thr-1834-icon-family/sheet-1440.png). It shows 32 world concepts, 9 places, 6 spheres, 4 reaches and 12 controls, each next to the glyph it replaces, plus the top bar drawn in both candidate styles.

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
| Places | the map's `LOCATION_ICON_REGISTRY` (`src/components/HexMapV2/locations/locationIconRegistry.ts`) | emoji in `HexPoiPanel.tsx`, `sublocation-concept-art.ts`, ⌂ / 🏘 in codex and toasts |
| Factions | `CoatOfArms` heraldry | emoji `iconGlyph` in the faction definitions |
| Odds, cost, forecast, difficulty | the THR-972 drawn set (`ForecastDie`, `DifficultyScales`, pips) | none; already separated |
| Terrain | `signifierRegistry` | none |

The place registry renders in panels as well as on the map (it is `{d, opacity}[]` path data already). Places with no drawn icon yet fall back to a carved icon until drawn; a missing place icon is never an emoji.

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

The sheet fixes the family and proves it on 44 concepts. Mapping the remaining concepts to shapes is executor work inside the migration, under the rules above: one shape per concept, chosen from the family, recorded in the registry. An executor may swap a shape the sheet picked when a better one reads more clearly at 18 px (the sheet's *Rivals* pick, `duel`, is the weakest), as long as the shape stays unique. The picks on the sheet:

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
| Undertaking | `compass` | Ambition | `summits` |
| Faction (generic) | `flying-flag` | Spell | `magic-swirl` |
| Disease | `virus` | Wound | `bleeding-wound` |
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
| The map's plan docs | Every new surface draws from this registry from day one |
