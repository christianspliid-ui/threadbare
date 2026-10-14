> **title:** Type and icons rollout — ship Alegreya, the label rule, and the carved icon registry with its credits (THR-1879)
> **linear_issue:** THR-1879
> **author:** Claude Code (design session, 2026-10-14, spawned from the attended map carve-up session)
> **created:** 2026-10-14
> **three_pillars:** Engine N/A — no tick, graph, trace or rule change; one presentation field under `src/engine/` changes type (§ Interface impact) · Content done — the concept → shape table (228 ideas), the vendored carved subset with licence metadata, the font files, the credits words · UI done

# Type and icons rollout — Alegreya, the label rule, and the carved icon registry with its credits (THR-1879)

*The new screen is built on three faces and one carved icon family; this plan ships the faces and the label rule, fills the icon registry with one carved shape per idea, credits the artists, and sets the order in which the old glyphs leave.*

## Why this is load-bearing

The map Christian closed today (THR-1823, *The Map Is the Table*) settled how the game should read: three faces with one job each ([THR-1833](https://linear.app/threadbare/issue/THR-1833)) and one carved icon family for everything not drawn by hand ([THR-1834](https://linear.app/threadbare/issue/THR-1834)). The four foundation plans merged today build the parts those decisions need: the type steps ([THR-1819](https://linear.app/threadbare/issue/THR-1819)), the `Icon` primitive and its registry format ([THR-1821](https://linear.app/threadbare/issue/THR-1821), built by [THR-1885](https://linear.app/threadbare/issue/THR-1885)) and the UI-debt ratchet that counts glyphs, capitals and monospace. None of them ships the contents.

Without this plan:

- **The story keeps its third face.** Georgia is the prose face today (`src/index.css:47`), renders differently on every platform and cannot go into a Unity build. The prose shorthands `--type-body-prose` and `--type-flavor` do not even use it; they set story text in the UI sans.
- **Labels stay as tiny spaced capitals.** `uppercase` appears on 264 lines in 115 files of `src/` (205 in 82 files inside the ratchet's player scope); the shared label classes (`.section-heading`, `.topbar-section-label`, `--type-section-label`) set Cinzel at 16 px, below Cinzel's 22 px floor.
- **The `Icon` primitive draws only its fallback.** THR-1885 seeds one entry. Every new surface (the frame, the Inspector, the Stage, the lens bar) needs real shapes from day one, and none of those plans vendors a shape (the brief gives that to this ticket alone).
- **The credits are owed the moment a carved shape ships.** CC BY 3.0 requires the authors' names, the licence and a note that the icons are changed. The deployed build is public.
- **About 330 ideas keep about 163 glyphs.** Five classes break Law 9 and about twelve glyphs break Law 10 (THR-1826).

Law 58 (Christian, today) adds the shape the result must have: the concept → shape table is **the one icon list**, a missing entry fails a test that names it, and an unknown concept shows a plain fallback mark, never an emoji.

**Authoring note.** Christian asked in chat on 2026-10-14 for the five carve-up plan docs to be written now, in parallel, in the attended session. That waives the design lane's one-day veto window on the lane decisions they build on (THR-1828 to THR-1833). Those decisions are settled input here; Christian's veto stays open in chat but does not block this plan.

## Settled input (cited, not re-opened)

| Source | What this plan takes from it |
|---|---|
| [`Docs/audits/2026-10-13-thr-1833-type-system-decision.md`](../audits/2026-10-13-thr-1833-type-system-decision.md) (lane decision; label rule **confirmed by Christian in chat 2026-10-14**, THR-1833 comment) | Cinzel names things at 22 px and up; **Alegreya tells the story** and replaces Georgia; Alegreya Sans runs the game. **Small labels: Alegreya Sans 700, sentence case, tertiary colour, 16 px floor, letter-spacing 0.** Tabular lining figures where numbers line up; no monospace on player surfaces. Map weights 800/700/500/400. Files to ship: Alegreya 400, 400 italic, 500, and Alegreya Sans 800; "the type-and-icons plan doc measures the added bytes" and "checks each font's Reserved Font Name clause" |
| [`Docs/audits/2026-10-14-thr-1834-icon-family-decision.md`](../audits/2026-10-14-thr-1834-icon-family-decision.md) (Christian, chat 2026-10-14; human gate satisfied via chat review) | One curated game-icons.net family (CC BY 3.0, recoloured, credited on the credits screen) for content **and** chrome; lucide leaves player surfaces; our drawings keep spheres, reaches and heraldry; filled silhouettes in `currentColor`; sizes 14/18/24/34 px; one shape per concept with a uniqueness test; path data only (Unity). The 44 sheet picks. **Swaps:** Disease `plague-doctor-profile`, Ambition `holy-grail`, Poison `poison-bottle`. **Call 2b (places carved):** capital `tower-flag`, city `medieval-gate`, town `village`, hamlet `wood-cabin`, castle `white-tower`, temple `greek-temple`, shrine `fire-shrine`, ruins `ancient-ruins`, mine `mine-wagon`, camp `camping-tent`, lair `cave-entrance`; the other place types get carved shapes "under the same rules"; size classes and lair tints stay; sublocations use the parent's shape unless they have their own. Icons must read as fantasy-period objects (Christian rejected a bacteriophage and mountain summits) |
| THR-1826 inventory (Linear comment, 2026-10-11) | ~330 concepts in 22 classes, ~163 codepoints, the Law 9/10 breaks, the six broken escapes (now [THR-1874](https://linear.app/threadbare/issue/THR-1874), Ready for Dev, lands first) |
| [`Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`](2026-10-14-thr-1819-1440p-layout-contract.md) § 3 | Six type steps; **story prose is `--text-base` = 20 px at 1080p** (22.5 px at 1440p), line-height 1.6, `--measure-prose: 34em`. Its feed to this plan: *"when it switches the face it also moves every `--font-prose` site to `--text-base`, so the face never ships without its step."* Faces and the typography.md roles rewrite are this plan's |
| [`Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`](2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md) § Icon, § Content pillar, § rows | `Icon` (name → shape, named sizes, `currentColor`, label-or-decorative), one resolver `iconShape.ts`, the registry format `{ meaning, shape: { viewBox, paths }, source }`, `fallback` (ours), `ICON_CREDITS` generated from the registry, the uniqueness tests. **The credits line ships in the same PR as the first carved shape.** Class maps are total `Record`s keyed on live unions, each beside the data it labels. Ratchet rows `glyph-icon` (325/74), `glyph-icon-data` (171/30), `lucide-import` (5/5), `uppercase` (205/82), `monospace` (26/16), `font-face-literal` (17/11). Its measured sweep input (shared primitives first; skip what THR-1827/1828 retire) |
| `Docs/design-system/laws.md` Laws 9–12, 15, 57, **58** | One vocabulary per class; distinct meanings, distinct shapes; legible sizes; legends at first contact; the sanctioned magnitude marks; grow before scroll; **one list per kind, a missing entry fails a named test, an unknown kind shows a plain fallback, every list has a row in `extending.md`** |
| Feeds posted on THR-1879 by the sibling plans (2026-10-14) | **Frame (THR-1875):** top-bar names (pause, play, faster, slower, needs-you, find, doom, omen, rivals, notables, read-the-threads, settings, close); rails (disclosure, threads, chronicle, chapter-ledger, move, investiture); one icon per Needs-you group (waiting, held, news) and per `AlertIcon` kind (12). **Map (THR-1878):** a total place table its texture builder reads through `iconShape()`; lens icons (Dominion, Threads, Trouble, Trade); map controls (zoom in, zoom out, centre on my First, show known land, minimap); Trouble marks (unrest, battle, siege, scheme, drain, omen, lair); THR-1878's build edits `locationIconTextures.ts`, `LocationIconMesh.ts` and drops the drawings from `LOCATION_ICON_REGISTRY`. Every name is in Appendix B; zoom in and out stay typographic "+" and "−" on their buttons |
| Christian, chat 2026-10-14 (map carve-up brief) | Places carved on the map and in panels; Disease, Ambition, Poison swaps; labels bold sentence case; Laws 57/58 ratified; the Inspector and frame own their surfaces; **icon registry contents, the concept → shape table, vendoring and the credits line belong to THR-1879**; place icons on the map (texture path, size classes, lair tints) belong to [THR-1878](https://linear.app/threadbare/issue/THR-1878) and read this registry |

## Substrate inventory

No engine subsystem in `Docs/canon/systems-inventory.md` is touched. The design-system and asset substrate, measured on `main` @ `0afcfc2b` (2026-10-14):

| Existing piece | Status | This plan |
|---|---|---|
| `public/fonts/` — Cinzel variable + Alegreya Sans 400, 400 italic, 500, 700 (124 KB) | 🟢 live | **extends**: Alegreya (roman variable + italic) and Alegreya Sans 800; a licence file for all three families |
| `src/index.css` `--font-prose` (Georgia), `--type-body-prose` / `--type-flavor` (on `--font-body`), `--type-section-label` (Cinzel 700 at `--text-xs`), `.section-heading`, `.section-heading-gold`, `.topbar-section-label` (uppercase, tracked) | 🟢 live | **repoints** the tokens (one edit reaches every user) |
| `--font-prose` users: 61 sites in 31 files (MeetTheFirst, Remembrance, ThreadingRite, chronicle cards, the encounter Stage shells, PremonitionModal, LairMonsterCard…) | 🟢 live | **classifies** each site: story → the prose shorthand at `--text-base`; not story → `--font-body` |
| `src/data/icons/iconRegistry.ts`, `src/components/shared/Icon.tsx`, `iconShape.ts` (THR-1885) | ⚪ building (THR-1885, Todo) | **fills** the registry; adds the vendoring script and the generated shapes |
| `HexMapV2/locations/locationIconRegistry.ts` (49 keys, 41 drawings) + `locationIconTextures.ts` | 🟢 live | **replaced for places** by `place-*` registry entries; the texture switch is THR-1878's |
| Glyph tables: `attachmentGlyphs.ts`, `nudge-card-display.ts`, `calling-content.ts`, `ambition-categories.ts` (+ a Codex copy), `codexRegistry.ts`, `undertakingCodex.ts`, `charteredKindsCodex.ts`, `sublocation-concept-art.ts`, `entity-visual-fallbacks.ts`, `ToastStack` `NAV_GLYPHS`, the omen maps (two copies), the season maps (two copies), `encounterActivityPresentation.ts`, the faction `iconGlyph` fields | 🟢 live | **each gets its class map** (additive) in the registry slice; the glyph columns go in the sweep |
| `EFFECT_TYPE_GLYPHS`, `WHEEL_SLOT_GLYPHS`, `getEncounterActivityGlyph`, `HexPoiPanel.SUBTYPE_GLYPHS`, `LOCATION_TYPE_CONCEPT_ART` | 🟠 dead (no reader) | **deleted**, nothing vendored (§ 9) |
| `SphereIcon`, `ReachIcon`, `CoatOfArms`; `OddsPips`, `CostPips`, `DeltaCluster`, `ForecastDie`, `DifficultyScales` | 🟢 live drawn sets | **kept** (our drawings; Law 15 marks) |
| `src/components/StartPage/CreditsModal.tsx` (reached from the start page's *Credits* item) | 🟢 live | **extends** with an *Icons* and a *Fonts* section |
| `Docs/design-system/extending.md` row "An icon for a concept" (**several places**) | 🟢 live | **replaced** (§ 11) |

## Engine pillar

Engine: N/A — no tick phase, graph node or edge, trace, PRNG call or rule changes. Two presentation helpers that live under `src/engine/` change a field: `engine/calling.ts`'s `CallingPresentation` gains `icon: IconName` (its `glyph: string` goes once no reader is left), and `engine/strategicPresentation.ts`'s `BEHAVIOR_FAMILY_PRESENTATION` derives its icon from each family's seed calling. `engine/attachmentTooltip.ts` reads attachment glyphs today and moves to the class map. These are display data, not simulation; they are listed under § Interface impact.

## Content pillar

Encounter templates, prose tables and attachment content: N/A — no words, templates or attachments change; the story keeps its text and only its face changes.

### Data tables

| Table | File | Contents | Slice |
|---|---|---|---|
| **The icon registry** (the one icon list) | `src/data/icons/iconRegistry.ts` (format by THR-1885) | 235 entries: `IconName` → `{ meaning, shape, source }`. The 228 carved ideas of Appendix A (a `carved('<slug>')` helper fills `shape` and `source` from the vendored file), plus `fallback` (ours, THR-1885) and the six temporary own place entries of § 6 | S2 |
| **The vendored shapes** | `src/data/icons/carvedShapes.generated.ts` | One record per carved slug: `{ slug, authorDir, author, d }`, plus `GAME_ICONS_SOURCE` (repo, pinned commit, licence name and URL, the date vendored). Generated, never edited by hand | S2 |
| **The class maps** | `src/data/icons/conceptIcons.ts` (maps keyed on a type-only union) and an `icon` field on rows of tables that already exist | `ICON_FOR_WORLD_REF_KIND`, `ICON_FOR_LOCATION_SUBTYPE`, `ICON_FOR_SUBLOCATION_TYPE`, `ICON_FOR_ATTACHMENT_CATEGORY`, `ICON_FOR_ATTACHMENT_SUBCATEGORY`, `ICON_FOR_ACTIVITY`, `ICON_FOR_ALERT`, `ICON_FOR_CONSEQUENCE`, `ICON_FOR_UNDERTAKING_OBJECT`, `ICON_FOR_RESOURCE_CLASS`, `ICON_FOR_AMBITION`, `ICON_FOR_SEASON`, `ICON_FOR_OMEN`; `icon` fields on the calling rows, the nudge card types, `MAP_LENSES`, the Codex `catDefs` and the chartered card groups. The map controls and Trouble marks are lists THR-1878 owns; they name entries of this registry | S2 (additive); S4 moves readers and deletes glyph columns |
| **The font files** | `public/fonts/alegreya-variable.woff2`, `alegreya-400-italic.woff2`, `alegreya-sans-800-regular.woff2`, `public/fonts/OFL.txt` | § 1 | S1 |
| **The credits words** | `src/components/StartPage/CreditsModal.tsx` | § 8 | S1 (fonts), S2 (icons) |

### The concept → shape table

This is the one icon list. It has three layers, and only the first holds shapes:

1. **The registry** names each *idea* once, with its meaning and its one shape (Appendix A, 228 entries). Two ideas never share a shape; one idea (`forward`) is another's shape mirrored, which is a different shape.
2. **The class maps** say which idea each game key draws (Appendix B, 301 keys in 15 classes). Several keys may draw the same idea when they mean the same thing: `debt` and `bargain` are one idea (THR-1834 grouped them), the card type `kindled_ambition` draws `ambition`, the activity `boot` and the toast target `journey` both draw `journey`. That is Law 10 kept, not bent: one meaning, one shape, used wherever the meaning appears.
3. **Open classes** (Appendix C, 28 ideas in five classes) have no obvious period object. Their candidates go to Christian; until he picks, those surfaces keep today's glyph (and the map keeps today's drawing for the places among them, § 6).

**How the picks were made.** The 54 shapes THR-1834 and Christian settled are kept exactly. Every other pick was chosen from the game-icons.net set (4,133 names at Iconify, 4,176 files upstream) as a fantasy-period object a player would name at 18 px, then checked by eye on the sheet below in the game's gold at 40 px and 18 px and, for places, in the map's ink on map colours. Picks that read as modern were replaced before the sheet was published (a camper van for *trade route*, an org chart for *legacy*, a fedora spy for *someone will notice*, a rank chevron for *boost*). **114 picks are proposed with confidence and 60 are marked unsure**; an unsure pick is still the plan's choice, and swapping it later is one registry entry.

**The sheet:** [`Docs/audits/2026-10-14-thr-1879-icon-table/icon-table.html`](../audits/2026-10-14-thr-1879-icon-table/icon-table.html), published for review at <https://claude.ai/artifact/X9woLDsYia4iP3uQkk6QjN>. It shows every class beside today's glyph, the places in map ink, the classes that stay ours, the dead tables, the open classes with three candidates each, and the credits line the picks would ship.

**Coverage of the inventory.** The ~330 concepts THR-1826 counted are all accounted for: 301 keys in Appendix B (the inventory's keys plus the names the frame and map plans asked for on this ticket), 28 open ideas in Appendix C, the 12 spheres, 8 reaches and 20 faction marks that stay ours (§ 9), and the dead tables (§ 9). Classes the inventory listed that retire with their surface (the ActionDrawer's narrative layers, `LiveLocationBar`'s pulses, the AgentProfileModal tabs' journey and chronicle marks) are not mapped; they leave with the surface.

## Interface impact

| Contract | Producer → consumer | Change | Verdict |
|---|---|---|---|
| Calling presentation | `engine/calling.ts` `getCallingPresentation` → `strategicPresentation.ts` → `ThreadsPanel` | `CallingPresentation` gains `icon: IconName` (read from the calling row); `glyph` stays until S4b moves its two readers, then goes | extend, then retire `glyph` |
| Behaviour family presentation | `BEHAVIOR_FAMILY_PRESENTATION` → the thread row's "doing" line | `icon` derives from the family's seed calling (the seed-title table that already exists), not a second hand-kept list (Law 58) | extend |
| Attachment glyph | `attachmentGlyphs.ts` → `engine/attachmentTooltip.ts`, `AttachmentRow`, the Codex | glyph strings → `IconName` via the attachment class maps | replace (S4b) |
| Place shape | registry `place-*` → `HexMapV2/locations/locationIconTextures.ts` (THR-1878) and every place row | one entry per place type, read by the map's texture builder as `{ d, opacity: 1 }` | add (S2), consumed by THR-1878 |

No subsystem in `Docs/canon/interface-map.md` is touched; the doom seam it lists (`DOOM_ARCHETYPE_SPHERE`) is untouched because the doom kinds are an open class.

## UI pillar

*Screenshot tool: Playwright (DOM) for every slice. The map's place textures are THR-1878's evidence (Claude-in-Chrome, WebGL).*

### 1. Fonts and tokens (S1)

**Files.** Fetched once from Google Fonts' css2 API, latin subset, the same source as the five shipped files, and checked in:

| File | Covers | Size (latin) |
|---|---|---|
| `alegreya-variable.woff2` | Alegreya roman, weights 400–900 in one variable file (Google serves 400 and 500 from the same file) | 42.5 KB |
| `alegreya-400-italic.woff2` | Alegreya italic 400 (afterimages, card flavour) | 22.6 KB |
| `alegreya-sans-800-regular.woff2` | Alegreya Sans 800 (capital labels on the map, THR-1831/1833) | 23.4 KB |

**Added: 88.5 KB**, on top of today's 124 KB (measured 2026-10-14). Each `@font-face` uses `font-display: swap` like the others; Alegreya's roman block declares `font-weight: 400 900`.

**Licence.** All three families are SIL Open Font Licence 1.1. Their `OFL.txt` files (google/fonts, `ofl/alegreya`, `ofl/alegreyasans`, `ofl/cinzel`) were checked on 2026-10-14: **none names a Reserved Font Name** (each carries only the licence's definition of the term). So a Unity port may convert and rename the files (TextMeshPro SDF) without a renaming restriction, which settles THR-1833 call 7's check. S1 adds `public/fonts/OFL.txt` with the three copyright lines and the licence text, because the fonts are redistributed with every page load.

**Tokens** (`src/index.css`):

```css
--font-prose: 'Alegreya', Georgia, 'Times New Roman', serif;   /* was Georgia; Georgia stays only as the fallback */
--type-body-prose:  400 var(--text-base)/1.6 var(--font-prose); /* face moves here; size and line-height are THR-1819's */
--type-flavor: italic 400 var(--text-base)/1.6 var(--font-prose);
--type-section-label: 700 var(--text-xs)/1.2 var(--font-body);  /* was Cinzel 700: the label rule */
--figures-tabular: lining-nums tabular-nums;                    /* new: numbers that line up */
```

- `h1`–`h6` letter-spacing goes from `0.04em` to `0.02em` (THR-1833: the only tracked text is Cinzel titles at `0.02em`).
- `.section-heading`, `.section-heading-gold`, `.topbar-section-label`, `.quote-block .quote-attr`, `.subloc-badge` and `.avail-label` take the label rule: Alegreya Sans 700, no `text-transform`, letter-spacing 0, `--text-xs`. `.section-heading` takes the tertiary text colour (the rule); `.section-heading-gold` keeps gold, since it is the named ornamental variant. The 26 call sites of these classes and of `--type-section-label` have their label strings made sentence case in the same PR, because removing the transform shows the strings as written ("Domain Affinities" → "Domain affinities", "Creation Spheres" → "Creation spheres"). The top bar's labels ("Attention", "Doom", "Omen") are single words already in sentence case, so S1 edits no top-bar file for labels.
- `.figures-tabular { font-variant-numeric: var(--figures-tabular); }` is the utility; inline styles write `fontVariantNumeric: 'var(--figures-tabular)'`.

**The `--font-prose` sites (THR-1819's feed).** Each of the 61 sites in 31 files is one of two kinds, and the executor sorts them in the S1 PR (listing the sort in the PR body):

- **Story prose** (step text, afterimages, chronicle entries, ceremony narration, premonitions, lair lore, card flavour): the site uses `font: var(--type-body-prose)` or `var(--type-flavor)`, so it takes the face, `--text-base` and line-height 1.6 together. A site that set its own smaller size (for example `'1.1rem'` in `TransformationBeat`) moves up to the step.
- **Not story** (a caption, a label or a button set in the serif, for example `SensingBeat.tsx:207` at `--text-xs`): the site moves to `--font-body` and, if it is a label, the label rule.
- `WorldSoulIndicator.tsx:67`'s `var(--font-prose, serif)` is a one-line reading of the world, not story prose: it moves to `--font-body` (the frame build moves the component into the Ledger rail, THR-1875).

The ceremonies (Meet the First, Remembrance, the Threading Rite) are full screen and fixed at one viewport; their prose grows by one step, so S1's browser evidence covers one beat of each at both sizes (Law 33, Law 57).

### 2. The label rule and its sweep (S1, S3)

**The rule** (THR-1833 call 2, confirmed by Christian 2026-10-14): small labels are **Alegreya Sans 700, sentence case, tertiary text colour, at the 16 px floor, letter-spacing 0**. Big titles keep Cinzel's carved capitals, and only at 22 px and up. A name below 22 px is Alegreya Sans 700.

- **Sentence case is written in the string, never produced by a transform.** `text-transform: capitalize` is not a substitute, and a helper that lower-cases strings would break proper nouns ("the Iron reach", "Kael Thorne"). Strings that arrive from data keys go through the display vocabularies that already exist (Law 14).
- **The ratchet** counts `uppercase` (THR-1821's row, 205/82 in its scope). **S1 registers one more row**, `display-face-small` (owner THR-1879, type system): a style object or CSS rule block that sets `var(--font-display)` (or names Cinzel) together with a size below `--text-lg` (`--text-xs`, `--text-sm`, `--text-base`, or a `px`/`rem` value under 22 px / 1.375 rem) in the same block. Sanctioned: Cinzel at `--text-lg` and up, or Alegreya Sans 700. The executor measures its baseline at landing.
- **New surfaces** (the frame, the Inspector, the Stage, the lens bar, Find) are built on the rule from day one; a capital label there is a review failure even though the ratchet only sees the total.
- **S1** fixes the shared label homes (the six classes and the token above), which reaches every surface using them at once. **S3** sweeps the remaining kept surfaces in the order of § 10.

### 3. Figures and monospace (S1)

- **Tabular lining figures** (`--figures-tabular`) on: essence and Attention counts (`EssencePanel`, `AttentionPoolIndicator`; the god rail's `ascendant-bar/EssenceBlock` takes it in the frame build's rebuild, THR-1875), costs on card faces and hand rows (`CardFace`), the doom clock (`DoomBar`, `DoomClockDetail`), dates in the chronicle (`ChroniclePanel`, `ChapterLedger`), the date and speed in the top bar (`SimulationControls`), and every count chip (THR-1885's `Chip role="count"` — whichever of S1 and THR-1885 lands second adds it). Proportional figures everywhere else, including prose.
- **Monospace leaves the player surfaces:** 19 sites in 14 files (a grep on 2026-10-14; the ratchet's own detector counts 26 in 16 files, comments and World Pulse included) go to `--font-body` plus `--figures-tabular` where the digits line up: `EssencePanel` (4), `NudgeStageHeader` (2), `NarrativeFeed` (2), `IconButton`, `CardFace`, `MagicGlowTiles`, `InfoPanel`, `NudgePhaseShell`, `SimulationControls`, `MandateTracker`, `EventLog`, `DoomClockDetail`, `DoomBar`, `CosmologyPanel`. World Pulse (5 more) retires with the frame (THR-1828) and is not touched; `HexMapV2/interaction/HexTooltip` (1) is the map's tooltip and goes with THR-1878's build. Debug, CMS, the style guide and the UL viewer keep monospace (outside the ratchet's scope).

### 4. Vendoring the carved subset (S2)

The shapes are fetched **once, by a script, from the game-icons repository at a pinned commit**, stored as single-path data with licence metadata, and checked in. Nothing is fetched at runtime; no icon font and no npm icon package ship.

**Why the upstream repository and not Iconify.** Iconify's game-icons collection carries the paths but not each icon's author, and the credits must name authors. The upstream repository (`github.com/game-icons/icons`) stores every icon as `<author-dir>/<slug>.svg`, so the author is the directory. Pinned commit: `82d948812bfe3f269ef8f731dcdb07b08160edc4` (the tree read on 2026-10-14: 4,176 files by 37 authors). 63 slugs exist under two authors; an entry for one of those must name its author, and the script stops and names both otherwise. Eleven of the 228 picks are among them: `crown`, `cog`, `anvil`, `sun`, `spade`, `book-cover`, `dragon-head`, `horse-head` and `fairy` take the Lorc file, `tombstone` and `clover` the Sbed file. In each case that is the file whose path Iconify serves, so the vendored shape is the one on the sheet (compared path by path on 2026-10-14), and the entry names its author: `carved('crown', { author: 'lorc' })`.

**`scripts/vendor-game-icons.ts`** (`npm run icons:vendor`, `node --experimental-strip-types`, never in CI because it needs the network):

1. Read the registry's carved slugs from `src/data/icons/iconRegistry.ts` (every `carved('<slug>'…)` call, parsed with the TypeScript compiler API as the ratchet does).
2. Read the pinned tree once (`GET /repos/game-icons/icons/git/trees/<sha>?recursive=1`) to map slug → author directory.
3. For each slug not yet in the generated file, fetch `raw.githubusercontent.com/game-icons/icons/<sha>/<author>/<slug>.svg`. Each upstream file is a 512 × 512 SVG with a black background square (`M0 0h512v512H0z`) and one white glyph path. The script drops the square, keeps the one path's `d`, and **fails** if there is not exactly one glyph path or the view box is not `0 0 512 512`.
4. Apply the one transform the registry may ask for, a horizontal mirror (`carved('return-arrow', { mirror: true })` for `forward`): absolute x becomes 512 − x, relative dx becomes −dx, and each arc's sweep flag flips. The mirrored path is stored as its own path, so the registry stays one path per entry.
5. Round every coordinate to `ICON_PATH_DECIMALS` = 1 decimal place. Measured on the 227 distinct files: path data 314 KB raw / 141 KB gzip as published, **248 KB / 104 KB** at one decimal (0.1 of a 512 unit is 1/150 of a pixel at 34 px; integer rounding would halve the size again but drifts on relative path commands).
6. Map the author directory to the name the authors use on game-icons.net through `GAME_ICONS_AUTHOR_NAMES` (`lorc` → *Lorc*, `delapouite` → *Delapouite*, `caro-asercion` → *Caro Asercion*, `heavenly-dog` → *HeavenlyDog*, `lucasms` → *Lucas*, …). An unknown directory stops the script and names it.
7. Write `src/data/icons/carvedShapes.generated.ts`, sorted by slug, with a header naming the source, the commit, the licence and the rounding, and drop slugs no entry uses. Print the total size and warn above `ICON_SHAPES_GZIP_BUDGET_KB` = 150.

**Adding an icon is then one entry plus one command**: write the registry entry, run `npm run icons:vendor`, commit both files. `carvedShapes.test.ts` fails, naming the entry, the slug and the command, if an entry names a slug that is not vendored; it also fails on a vendored slug no entry uses.

**Colour.** A carved icon fills `currentColor`, so it takes its parent's text colour: tertiary or secondary text on rows, chips and chrome at rest, the sphere colour when the concept is tied to a sphere, and gold only where the surface already marks the god's attention or a selected state (Law 31; the taste profile's "one gold emphasis per panel"). The review sheet draws every shape in gold only so it can be judged; it is not the in-game colour rule.

**Licence metadata in the data** (`GAME_ICONS_SOURCE`): `{ site: 'https://game-icons.net', repo: 'https://github.com/game-icons/icons', commit, licence: 'CC BY 3.0', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/', changes: 'recoloured through currentColor; coordinates rounded to one decimal; return-arrow also stored mirrored' }`. `ICON_CREDITS` (THR-1885) reads the distinct `author` values from the registry's carved entries.

### 5. The uniqueness test and the coverage tests (S2)

- **Uniqueness** (THR-1885's registry test, now on real data): no two registry entries have the same shape; every `meaning` is a non-empty sentence fragment; every carved entry is one path. On the 228 picks: 228 distinct shapes from 227 files (checked; `forward` is `back` mirrored).
- **A missing entry fails a test that names it** (Law 58):
  - A map keyed on a union (`Record<WorldRefKind, IconName>` and the rest) is a type error when a member is added without an icon (the THR-890 pattern).
  - An `icon` field on a row (callings, card types, lenses, Codex categories) is a required `IconName`; a new row without one does not type-check.
  - String-keyed content that can grow at runtime gets a test that walks the live source and names any key without an entry: sublocation types (every `sublocation-type.*` id the world model and the sublocation templates can produce) and omen categories as stored in saves.
- **Carved coverage:** `carvedShapes.test.ts` as above.

### 6. The place shapes (S2; the map switch is THR-1878's)

Every `LocationSubtype` member (49 map types plus `farmland`, `oasis`, `bridge`, `wilderness`, `wilderness_waypoint`, `elder_ruin`, `trade_route`) has a key in `ICON_FOR_LOCATION_SUBTYPE`; the twelve sublocation types with their own art have keys in `ICON_FOR_SUBLOCATION_TYPE`, and every other sublocation takes its parent's place shape (THR-1834 call 2b). The 11 settled shapes are in Appendix A; the others are proposed there and shown in map ink on the sheet.

- **The map's key type.** THR-1878 asked (comment on THR-1879) for one total table over the 49-member `LocationType`. `ICON_FOR_LOCATION_SUBTYPE` is total over `LocationSubtype`, which contains every `LocationType` member, so the map indexes it with a `LocationType` key and no cast; `conceptIcons.test.ts` also asserts that every `LocationType` member has an entry, so a new map type without a shape fails a test that names it. If THR-1878 moves `LocationType` to `src/types/`, nothing here changes.
- **A cleared lair is the lair's shape with the muted fill**, as the map draws it today (`CLEARED_LAIR_FILL_COLOR`). State is carried by the fill and the words ("cleared"), not by a second cave.
- **Resource anomalies get their own shapes** (gems, honey, ammonite, ore, oyster, mushrooms…) instead of today's reuse of the grove, ruins and wreck drawings, so each reads at a glance; their sphere tint stays.
- **The seven open places** (convergence, time scar, ley nexus, shadow hollow, place of power, corruption, elder ruin) are an open class (Appendix C). Until Christian picks, S2 copies today's map drawings for the six that have one into the registry as temporary `own` entries (`place-convergence`, …), and `elder_ruin` draws `fallback`. Each becomes carved by swapping its one entry. These are the only `own` place entries, and they exist only until the pick.
- **The map** (THR-1878): its texture builder reads `iconShape('place-…')` for every place type and keeps its near-black ink, outline pass, size classes and lair tints. One note for that build: the outline width is set in view-box units today (100 × 100 drawings); on the 512 grid it must scale by 5.12 to look the same.

### 7. The unknown-concept fallback mark (Law 58)

- **The mark:** THR-1885 draws `fallback`. This plan fixes how it should look: **an empty roundel**, a plain ring (outer radius 200, ring width 48, on the 512 grid) with nothing inside. It reads as "a mark with nothing on it", it is unlike every carved shape, and it is never an emoji. Its `meaning` is "Not yet drawn".
- **When it shows:** a key reaches a surface at runtime with no entry, for example a sublocation type added to content without an icon, or an off-union string from an old save. Every class map is read through one resolver, `iconForKey(map, key, kindWord)` in `conceptIcons.ts`, which returns the entry or `'fallback'`.
- **What the player reads:** the caller's label, which already names the thing ("Market district", "Smuggler"); the fallback replaces only the shape. If the surface has no word for it, the label is the class's kind word ("A place within a place").
- **What the developer sees:** `console.warn` once per class and key: `[icon] no icon for sublocation type "sublocation-type.mint" — add it to ICON_FOR_SUBLOCATION_TYPE in src/data/icons/conceptIcons.ts`. Never a throw, never a blank (Law 4, NFP 4). The coverage tests of § 5 catch the same gap at build time for every source they can enumerate.

### 8. The credits screen line (S2; fonts in S1)

`CreditsModal` (start page → *Credits*) gains two sections after *Built with*. Its own capital, tracked *Built With* label takes the label rule in S1 ("Built with").

- **Icons** (S2, in the same PR as the first carved shape, because the build is public):

  > Icons by Caro Asercion, Cathelineau, DarkZaitzev, Delapouite, Faithtoken, Guard13007, HeavenlyDog, Lorc, Lucas, Quoting, Sbed and Skoll, from game-icons.net, used under the Creative Commons Attribution 3.0 licence (creativecommons.org/licenses/by/3.0). Recoloured for this game.

  The author list is rendered from `ICON_CREDITS`, so it changes with the vendored set; this is the list the 228 carved picks produce. *game-icons.net* and the licence address are links. "Recoloured" is THR-1834's wording; the coordinate rounding (§ 4) is recorded in `GAME_ICONS_SOURCE.changes`.
- **Fonts** (S1): "Cinzel, Alegreya and Alegreya Sans, under the SIL Open Font Licence 1.1."

**The DRM clause.** CC BY 3.0 § 4(a) says a licensee may not impose effective technological measures on the work that restrict a recipient's rights under the licence. The web build has none, so nothing changes now. **Before any build ships on a storefront that wraps the game in DRM** (for example Steam's optional DRM wrapper), whoever handles legal checks this clause (THR-1834 call 1; many Steam games ship these icons). Shipping without the wrapper avoids the question. This note sits in `GAME_ICONS_SOURCE` and in `Docs/design-system/icons.md` (§ Docs), so a future port finds it.

### 9. Retiring the duplicate sets (Law 9)

Our drawings keep three classes; their copies leave. Dead tables leave with no replacement.

| Class | The one vocabulary | Retired copies | Slice |
|---|---|---|---|
| Spheres (12) | `SphereIcon` | `SPHERE_ICONS.symbol` read by `ArchetypeCard`, `SphereSlider` and the avatar sigil; `SphereIcon`'s `useImage` path (no caller passes it). The 12 PNGs in `public/icons/spheres` stay as assets of `public/the-game.html`, a static reference page outside the game UI that nothing in `src/` links to; they are not a game vocabulary, so Law 9 does not reach them | S4a (the avatar sigil is a map texture: THR-1878 draws it from `SphereIcon`'s path data) |
| Reaches (8) | `ReachIcon` | `REACH_GLYPHS` in `codexRegistry.ts` and its copy in `CodexTagFilter` (with the stray `time` and `life` keys); the 41 tiered PNGs in `public/assets/reaches` leave with `DomainCard` once `ProwessTab` retires (THR-1876) | S4a |
| Faction heraldry | `CoatOfArms` | the `iconGlyph` emoji on 20 faction definitions, the realm and order glyphs, `FACTION_ALERT_GLYPH`; `CoatOfArms`' no-heraldry fallback draws the carved `faction` mark on its field instead of the emoji, and the field is removed from `FactionDefinition` | S4a |
| Places | the carved `place-*` entries | the map's `LOCATION_ICON_REGISTRY` drawings (THR-1878), the place emoji in `sublocation-concept-art.ts`, ⌂ / 🏘 in the Codex and toasts | S2 / S4 / THR-1878 |
| Encounter activity | the carved activity ideas via `ICON_FOR_ACTIVITY` | `ActivityIcon`'s own drawings (it becomes a thin wrapper over `Icon`, export kept), the map's `activityIndicatorRegistry` drawings (THR-1878 reads the registry), the text glyphs | S4a / THR-1878 |
| Seasons, omens, ambitions | one map each | the second copies (`WorldPulse` retires; `OmenDetail` / `OmenIndicator`; `charteredKindsCodex`'s ambition map) | S4b |
| Lucide on player surfaces | carved chrome | `StartPage` (music), `chronicle/SoulCard` and `Encounter/ProseTtsButton` (read aloud, stop, busy). `HexChronicle` and `LocationView` are rebuilt or retired by the Inspector (THR-1876) | S4a |
| — (dead) | — | `EFFECT_TYPE_GLYPHS` + `getEffectTypeGlyph` (no importer: the six broken escapes THR-1874 fixes never reach a screen today), `WHEEL_SLOT_GLYPHS` + `getWheelSlotGlyph` (tests only), `getEncounterActivityGlyph` (no caller), `HexPoiPanel.SUBTYPE_GLYPHS` (deprecated; the file retires with THR-1876), `LOCATION_TYPE_CONCEPT_ART` + `getLocationConceptArt` (no reader), `AlertBar`'s `ALERT_GLYPHS` (the component is not mounted; its kinds move to `ICON_FOR_ALERT` for Needs-you News) | S4a |

**Law 15 marks stay** (`OddsPips`, `CostPips`, `DeltaCluster`, `ForecastDie`, `DifficultyScales`, the essence price pip). Their glyphs in `src/data/nudge-pip-vocabulary.ts`, `ascendant-bar-content.ts` and `nudge-stage-content.ts` are sanctioned, so S4b adds those three files to the `glyph-icon-data` row's homes in `scripts/ui-debt-rows.ts` (one line, a deliberate re-baseline named in the commit).

**Ornaments are not icons.** The ✦ dividers (`FlavorQuote`, the Divine Court header, the chronicle) become a plain rule; the tag-axis glyphs in `ChipPill` (◇ ○ ●) go, because the chip's word is the axis.

### 10. Sweep order for legacy surfaces the Inspector does not retire

New surfaces use `Icon` and the label rule from day one. Legacy surfaces move once, in this order (by reach: a shared primitive fixes every surface that uses it), and **skip** what THR-1827 and THR-1828 retire: the detail column, the profile and sheet modals and their tabs, `AttachmentDetailView`, `DetailModal`, `LocationView`, `HexBreadcrumb`, `HexSidebar`, `HexChronicle` as a view, the ActionDrawer, `LiveLocationBar`, `HexZoomView`, `HexFlavorPanel`, `HexPoiPanel` and World Pulse. They also skip surfaces another build rebuilds now: the god rail (`ascendant-bar/*`, THR-1875), the encounter Stage shells (`EncounterVeil`, `NudgeStageHeader`, `NudgePhaseShell`, `OpponentHeader`, `ClearanceGatePanel`, THR-1877), the five dialogs THR-1880 moves (`SettingsPanel`, `ChoiceSetModal`, `ScryOverlay`, the Codex layer, `WarmStartOverlay` — whichever of THR-1880 and the sweep lands second does that dialog's icons and labels), the top bar (`GameViewTopBar`, `SimulationControls`, THR-1875) and the map's own labels and markers (THR-1878).

**Icons (S4a, then S4b):**

1. **Shared primitives.** `Modal.Header` × and `Card.Header` ✕ → `close`; `Medallion`'s ✦ fallback → the subject's kind icon, else `fallback`; `FlavorQuote` ✦ → a rule; `Section`'s ⚡ prefix → none (the words say "when"); `ChipPill` axis glyphs → none; `CardFace` ⓘ → `codex`; `CardKeywordChip` takes an `IconName`; `EntityVisual`'s fallback tile draws the kind icon from `ICON_FOR_WORLD_REF_KIND` on its gradient (person kinds keep their initial); `RivalIcon`'s dots → small `SphereIcon`s.
2. **Chips and rows.** `ToastStack` (× → `close`; `NAV_GLYPHS` → `ICON_FOR_WORLD_REF_KIND`), `AttachmentRow`, `ActiveEffectChips`, `contentTagChips`, the thread-row badges and row extras in `ThreadsPanel` (the frame build moves `ThreadsPanel` into the Ledger rail: whichever lands second does them), `CardKeywordChip`'s card types.
3. **The Law 9 duplicates** of § 9: sphere symbols, reach glyphs, faction emoji, activity drawings, lucide.
4. **Kept dialogs and panels with chrome glyphs.** `Codex` and `CodexDetailPanel` (close), `DoomClockDetail` (✓ → `done`; "∞ UNMADE" → the word only), `MandateDetail` and `MandateTracker` (✓ → `done`), `ChapterLedger` and `ChapterView`, `AscendantBeatModal` (✦ waiting pill → `needs-you`; "Enter ▸" → "Enter"), `AgentInfoCard` (close, show on map, outcome marks), `PlaceOfPowerInspector` (👁 → `show-on-map`), `StrandView` (close; strands wait for the open pick), `ThreadsPanel`'s map magnifier → `show-on-map`.
5. **Data tables, largest first** (S4b): `attachmentGlyphs.ts` (after THR-1874; the subcategory column → the attachment maps; `EFFECT_TYPE_GLYPHS` deleted), `codexRegistry.ts` (category icons, resource classes, reach glyphs → `ReachIcon`, fallbacks), `undertakingCodex.ts`, `charteredKindsCodex.ts`, `sublocation-concept-art.ts`, `nudge-card-display.ts`, `calling-content.ts` + `engine/calling.ts` + `strategicPresentation.ts`, `ambition-categories.ts`, the omen maps, `entity-visual-fallbacks.ts`.

**Labels (S3),** after S1 fixed the shared label classes:

1. **Shared primitives:** `Section`, `RevealCard`, `HoverCard`, `CardKeywordChip`, `DetailBreadcrumb`.
2. **The Codex:** `Codex`, `CodexCard`, `CodexDetailPanel`, `CodexTagFilter`.
3. **Kept dialogs:** `MandateDetail` (12), `DoomClockDetail` (5), `OmenDetail`, `DivineReceiptModal`, `StoryBeatModal`, `PremonitionModal`, `JourneyVignetteModal`, `AscendantBeatModal`, `ChapterView`, `ChapterLedger`, `HarvestScreen`, `EmergenceDilemmaModal`, `InterventionConfirm` (unless the Inspector's armed-card cast has retired it, THR-1827 call 14), `CreditsModal`, `SettingsModal` (start page).
4. **Kept panels and rows:** `StrandView` (10), `NotablesPanel` (5), `RivalPanel`, `IntentSection`, `MomentCard`, `MandateTracker`, `NotableLine`, `ActiveEffectChips`, `AttachmentRow`, `AgentInfoCard`, `EncounterLog`, `RecentActivityLog`, `ChroniclePanel` and the chronicle cards, `DominionBox`, `EssencePanel`, `ReadTheThreadsPanel`, `OpeningDirectionLine`, `ruins/*`, `UI/MagicGlowTiles`, `Ascendant/AscendantSelection`, `Remembrance/StirringBeat`, `App.tsx`.

### 11. The `extending.md` row (S2 writes it; this plan's PR points the old row here)

This plan's PR updates the "several places" row's status to name this plan and S2. S2 replaces the row with:

| You are adding | The one place | What catches a missing entry | Where to see it | Status |
|---|---|---|---|---|
| An icon for a concept | One entry in `src/data/icons/iconRegistry.ts` (`IconName` → `meaning` + `carved('<slug>')`), then `npm run icons:vendor`; plus the concept's key in its class map (`src/data/icons/conceptIcons.ts`, or the `icon` field on its data row) | A class map is total over its union (type error); `conceptIcons.test.ts` names any live content key with no entry; `carvedShapes.test.ts` names an unvendored slug and the command; the registry tests fail on a shared shape or an empty meaning; at runtime an unknown key draws the fallback mark and warns once, naming the map | `?view=styleguide` § Icon (every entry at four sizes) and the start page's Credits (the authors) | One place |

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Every small label in the shared label classes (S1) and on kept surfaces (S3) | The same words in sentence case, bold, no spacing: "Essence", "Attention", "Quintessence" (was "QUINTESSENCE"), "Built with" (was "BUILT WITH") | PC-1 | Labels read as words; nothing else changes |
| Story prose (S1): steps, afterimages, the chronicle, ceremonies | The same words in Alegreya, one step larger, e.g. step 1 of *The Beast in the Granary*: "A bear has denned inside, asleep on the bins of winter grain. Two men who went in were carried out." and its afterimage in italic: "They got across the dark floor and reached the pack." | none | Story reads as story, set apart from the controls |
| Credits screen (S1, S2) | "Icons by Caro Asercion, Cathelineau, DarkZaitzev, Delapouite, Faithtoken, Guard13007, HeavenlyDog, Lorc, Lucas, Quoting, Sbed and Skoll, from game-icons.net, used under the Creative Commons Attribution 3.0 licence (creativecommons.org/licenses/by/3.0). Recoloured for this game." · "Cinzel, Alegreya and Alegreya Sans, under the SIL Open Font Licence 1.1." | none | A plain credit |
| Every carved icon (S2, S4) | **The call site's words, not the registry's.** The surface passes its own label (THR-1821 § Icon: "the owner's label as `aria-label`, plus a registry tooltip where new"), e.g. a calling row reads "Smuggler", a toast "Open the army". The registry `meaning` ("A smuggler", "An army") is only the tooltip text where the surface has none, and the styleguide caption | PC-1 | Shape first, word always there (Laws 11, 12); new icons arrive with their word on the same row |
| The start page music toggle (S4a) | The harp icon (`music`) with "Music on" / "Music off" as its label (was a speaker with no word) | PC-8 | The state is in the word, and changes on the click |
| Read aloud (S4a) | "Read aloud" / "Stop reading" as labels on the lips (`narrate`) and pause icons | PC-8 | The button says what it will do |
| Thread-row badges (S4a) | The icon changes; the words do not. A waiting beat: the bell, with the tooltip heading the encounter's name and the body "step 2 of 4 · faltered" (today's `encounterBadgeModel` words); the thread's pull: the yarn, "The thread pulls" with its threat and attention price; news of a person: the herald's trumpet, "Word of them" or the news category's heading; a turn in a long work: the compass, the newest record's class word. Each keeps its `aria-label` | PC-1 | The tooltip explains the badge as it does today; the icon now matches the same idea elsewhere (the bell is Needs you everywhere) |
| The waiting pill on an ascendant beat (S4a) | The bell (`needs-you`) before the beat's own words, in sentence case after S3: "An offering", "A path opens", "A divine cadence" (was ✦ and capitals) | PC-1 | The bell means "this waits on you", as in the top bar |
| The ascendant beat's proceed button (S4a) | "Enter" (was "Enter ▸") | PC-8 | A plain button word; the arrow added nothing |
| The doom clock dialog when the doom is unmade (S4a) | "Unmade" on its own (was "∞" above "UNMADE") | PC-1 | The word carries it; the ∞ added nothing |
| Unknown-concept fallback | The thing's own name beside an empty ring | PC-1 | Visible and named, never blank |

### Playtest signal

- A tester who hovers any icon on a kept or new surface can say what it means without guessing (its word is beside it or in its tooltip).
- No tester describes an icon as modern (a speech bubble, a speaker, a camper van) or as a symbol they could not name.
- A tester quoting a label quotes it in sentence case.

### Event notifications

N/A — no game events are added. Toasts keep their words; their navigation mark becomes the kind icon.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getIconReport(): Promise<{ registry: number; carved: number; own: number; fallbacksDrawn: { classId: string; key: string }[]; credits: string[] }>` (S2) — counts and every key that fell back since load, from the `iconForKey` warn-once set. Declared in `src/debug-bridge.d.ts`. It is the assertion behind the S2 and S4 browser evidence ("no fallbacks drawn on the seeded screen").
- `?view=styleguide` § Icon (THR-1885) shows every entry at four sizes with its meaning and source; it iterates the registry, so the 235 entries appear with no styleguide edit.

### Visual presence (HexMapV2)

The place textures, the activity sprites and the avatar sigil switch in THR-1878's build, from this registry. This plan supplies `place-*`, the activity ideas and the sphere path data; it edits no file under `src/components/HexMapV2/`.

### UI Laws engaged

1 (concepts carry image, tooltip, link) · 3 (one resolver: `iconShape`; one key resolver: `iconForKey`) · 4 (the fallback mark is designed) · **9** (one vocabulary per class; the duplicates retire) · **10** (one idea, one shape, enforced by test) · 11 (named sizes; meaning alone at 34 px) · 12 (word or tooltip at first contact) · 13/14 (no numerals or raw keys; the fallback never shows a key) · 15 (magnitude marks unchanged) · 17 (tooltips from the registry) · 21 (kind icons on links route as before) · 29 (the styleguide sheet iterates the registry) · 30 (tokens only) · 33 (one viewport; the ceremonies' larger prose is checked at both sizes) · 44/45 (contrast of gold icons on dark is unchanged) · **57** (the prose step-up and the wider label text grow panels to their limit before they scroll; the evidence checks the ceremonies and the Codex) · **58** (one icon list; missing entries fail named tests; unknown kinds draw the fallback; the `extending.md` row).

## Build slices

Six tickets share this plan doc. THR-1879 is S1.

| Slice | Ticket | Contents | Blocked by |
|---|---|---|---|
| **S1 — Alegreya and the type tokens** | [THR-1879](https://linear.app/threadbare/issue/THR-1879) | § 1 (files, licence, tokens, the 61 `--font-prose` sites), the shared label classes of § 2, § 3 (figures, monospace), the Fonts credit line, the `display-face-small` row, `typography.md` | [THR-1821](https://linear.app/threadbare/issue/THR-1821) (the ratchet the rows re-baseline). [THR-1819](https://linear.app/threadbare/issue/THR-1819), the type steps the face must ship with, merged on 2026-10-14 ([PR #2382](https://github.com/christianspliid-ui/threadbare/pull/2382)) |
| **S2 — the carved registry and its credits** | [THR-1904](https://linear.app/threadbare/issue/THR-1904) | § 4–8: the vendoring script, the generated shapes, the 228 entries plus the open places as temporary `own` entries, the class maps (additive), the coverage tests, `getIconReport`, the Icons credit line, `icons.md`, the `extending.md` row | [THR-1885](https://linear.app/threadbare/issue/THR-1885) (registry format, `Icon`), [THR-1874](https://linear.app/threadbare/issue/THR-1874) (same file) |
| **S3 — the label sweep** | [THR-1905](https://linear.app/threadbare/issue/THR-1905) | § 2 and § 10 labels on kept surfaces; `uppercase` and `display-face-small` go down | S1 |
| **S4a — icons: primitives, chrome and the Law 9 duplicates** | [THR-1906](https://linear.app/threadbare/issue/THR-1906) | § 10 icons 1–4, § 9 (duplicates, dead tables, lucide) | S2 |
| **S4b — icons: the data tables and the Codex** | [THR-1907](https://linear.app/threadbare/issue/THR-1907) | § 10 icons 5; the calling presentation field; the Law 15 homes line | S2 |
| **Open classes** (Christian's pick) | [THR-1908](https://linear.app/threadbare/issue/THR-1908) | Appendix C: Christian picks one shape per idea on the sheet; then the entries are added and the five tables switch | S2 (for the build half) |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — the engine rows (orchestrator phase, GameState field, traces) are N/A for every module here; the UI, debug and player-control rows apply.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Font files + type tokens | — | every surface through `--font-*`, `--type-*`, `--figures-tabular` | — | — | `?view=styleguide` § Type; computed style in Playwright |
| `iconRegistry.ts` + `carvedShapes.generated.ts` | — | `Icon` (THR-1885) | — | — | `?view=styleguide` § Icon; `getIconReport()` |
| `conceptIcons.ts` + row `icon` fields | — | every icon on a kept or new surface | — (reads content types only) | — | `getIconReport().fallbacksDrawn` |
| `scripts/vendor-game-icons.ts` | — (tooling, run by hand) | — | — | — | its own size report |
| `CreditsModal` sections | — | start page → Credits | — | — | Playwright DOM |
| Ratchet row `display-face-small` | — (gate) | — | — | — | `npm run check:ui-debt` |

Player controls: none added. Prose pipeline: not involved (the face changes, not the words).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `GAME_ICONS_REPO_COMMIT` | `82d948812bfe3f269ef8f731dcdb07b08160edc4` | The upstream commit every carved shape is vendored from |
| `ICON_PATH_DECIMALS` | 1 | Decimal places kept in vendored path coordinates |
| `ICON_SHAPES_GZIP_BUDGET_KB` | 150 | The vendoring script warns when the generated shapes pass this size (measured 104 at 228 shapes) |
| `GAME_ICONS_AUTHOR_NAMES` | 12 entries for the shipped authors (+ the rest of the 37 directories as names are needed) | Directory → credited name |
| `--font-prose` | `'Alegreya', Georgia, 'Times New Roman', serif` | The story face |
| `--type-section-label` | `700 var(--text-xs)/1.2 var(--font-body)` | The label rule |
| `--figures-tabular` | `lining-nums tabular-nums` | Numbers that line up |
| Cinzel title tracking | `0.02em` | `h1`–`h6` letter-spacing |
| `CINZEL_MIN_PX` | 22 (THR-1819's constant) | The `display-face-small` row's threshold |
| Fallback roundel | outer radius 200, ring 48, on the 512 grid | The unknown-concept mark (drawn by THR-1885) |

## Tracing

N/A — presentation only; nothing reaches the simulation's trace buffer. Inspectability comes from `getIconReport()`, the warn-once line and the styleguide sheet:

```ts
// window.__DEBUG.getIconReport() — S2
interface IconReport {
  registry: number;                                  // entries in the registry
  carved: number;                                    // entries with a game-icons source
  own: number;                                       // fallback + temporary own place entries
  fallbacksDrawn: { classId: string; key: string }[]; // keys that drew the fallback since load
  credits: string[];                                 // ICON_CREDITS, as the credits screen renders it
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A content key with no class-map entry reaches a surface | `iconForKey` returns `'fallback'`; the empty roundel draws with the caller's label; `console.warn` once per class and key; `getIconReport` lists it |
| An `IconName` with no registry entry at runtime (data from content) | `Icon` draws `fallback` and warns once (THR-1821 § Icon) |
| A registry entry names a carved slug that is not in the generated file (the vendoring script was not re-run) | `carved()` returns the `fallback` shape and warns once naming the slug and `npm run icons:vendor`; the registry still loads. `carvedShapes.test.ts` fails the build on the same case, so it never ships |
| A font file fails to load | `font-display: swap` shows the fallback stack (Georgia for prose, the system sans for UI); nothing blocks |
| The vendoring script meets a slug with two authors, more than one path, an unknown author directory or no network | It stops with a message naming the slug or directory; nothing is written; the checked-in file stays as it was |
| A vendored slug no entry uses | `carvedShapes.test.ts` fails naming it (the script would have dropped it) |
| The generated shapes pass the size budget | The script warns; the PR body says why, or the set is trimmed |

## Blast Radius

Not required: no file with ≥ 100 importers is edited. The widest are `src/types/faction.ts` (61 importing files; S4a removes the `iconGlyph` field from `FactionDefinition`, and its readers are the faction definitions, `CoatOfArms`, `faction-sigil-assets.ts` and `agentDetail.ts`), `src/index.css` (imported once, read by every surface through tokens: S1 changes three token values and adds one) and `shared/Modal.tsx` (24 importers; S4a swaps its close glyph for `Icon`, props unchanged).

## Kill criteria

- **A carved shape does not read at 18 px in play.** If testers or Christian misname a shape, swap that one entry (the sheet's unsure picks first). If more than a handful of a class fail, that class becomes an open class and goes to Christian's eye.
- **Alegreya makes prose harder to read at 1080p** (THR-1833's own criterion). The fix is THR-1819's step, not the face; if the step does not help, raise it with Christian before swapping the face.
- **The ceremonies overflow at 1920×1080 after the prose step.** Then the ceremony's prose column narrows to `--measure-prose` and wraps more; the step is not reverted.
- **The vendored shapes push the bundle past its budget.** Then the generated file moves to a lazily loaded chunk keyed by the first icon request; the registry API does not change.

## Three-pillar check

- [x] Engine pillar present (N/A with rationale; the presentation fields under `src/engine/` are in § Interface impact)
- [x] Content pillar present (the concept → shape table, the vendored shapes with licence data, the font files and licence, the credits words)
- [x] UI pillar present (§ 1–11, text, signals, debug, laws)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The faces and the icon family were chosen by Christian (THR-1833 label rule confirmed 2026-10-14; THR-1834 human gate 2026-10-14). *Always dark* holds. *One gold emphasis per panel* holds because icons take their parent's text colour and are gold only where the surface already marks importance (§ 4, Colour); the review sheet draws every shape in gold only so it can be judged.
- [x] The Vision edit is part of this ticket and is done: the vault's `Vision/taste-profile.md` entry on spaced-capital labels was corrected with Christian's THR-1833 confirmation (2026-10-14), and this session updated its soft entry *Cinzel + Alegreya Sans typography* (which still said "labels in Cinzel, prose in Alegreya Sans") to the three faces and their roles, citing THR-1833 and this plan.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No rulebook edit.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1879-type-and-icons-rollout-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every face, label rule, figure setting, path precision, size budget and pinned commit is a named token or constant (§ Constants); swapping an icon is one entry |
| 2. Inspectability | PASS | `getIconReport()`, the warn-once line naming the map, the styleguide sheet, the committed review sheet, the generated file's header naming its source |
| 3. Determinism | PASS | No randomness; the vendoring script sorts its output and pins the upstream commit, so re-running it gives the same file |
| 4. Fail-soft | PASS | § Fail-soft: an unknown concept draws a designed mark and warns; a missing font swaps; the script fails closed |
| 5. Narrative over mechanical perfection | PASS | Story prose gets its own face and a larger step; icons are period objects that belong to the world, and every icon keeps its word |
| 6. Additive over destructive | PASS with note | Tokens are repointed, not renamed; class maps are added beside the glyph tables before readers move; `CallingPresentation.glyph` stays until its readers move. Deletions are limited to dead tables and to duplicates Law 9 already forbids |
| 7. Performance budget | PASS with note | Fonts +88.5 KB (latin). Path data 104 KB gzip at one decimal, shipped eagerly in the main bundle, with a warn budget of 150 KB and a lazy-chunk fallback in § Kill criteria; the S2 PR reports the main bundle's gzip size before and after from `npx vite build`. `Icon` is inline SVG with no fetch |

## Done when

**S1 — [THR-1879](https://linear.app/threadbare/issue/THR-1879) (Alegreya and the type tokens):**

- [ ] The three font files and `public/fonts/OFL.txt` are in the repo; `@font-face` blocks load them; the built CSS references them
- [ ] `--font-prose`, `--type-body-prose`, `--type-flavor`, `--type-section-label`, `--figures-tabular` and the `h1`–`h6` tracking are as § 1; the six label classes follow the label rule and their 26 call sites read in sentence case
- [ ] Every one of the 61 `--font-prose` sites is sorted (story → the prose shorthand; not story → `--font-body`), with the sort in the PR body; `proseFontToken.test.tsx` and `encounterVeilLaws.test.ts` updated to the new face
- [ ] `monospace` row: the 19 sites of § 3 moved (what remains is World Pulse, which retires, and the map tooltip, THR-1878's); tabular figures on the § 3 list
- [ ] `display-face-small` row registered with its measured baseline and fixtures (a Cinzel `--text-xs` block counted; a Cinzel `--text-lg` block and an Alegreya Sans 700 block not counted); `uppercase` and `font-face-literal` re-baselined downward
- [ ] `CreditsModal` has the Fonts line, and its own label reads "Built with"
- [ ] `Docs/design-system/typography.md` rewritten from THR-1833 (faces and roles, the label rule, figures, no monospace, italics belong to the story face, "one face per role; never a fourth"), leaving THR-1819's § Type Scale as THR-1819 wrote it
- [ ] Code gates: `npm run gate`, then `npm run gate -- --final` last before push
- [ ] Browser evidence at **1920×1080 and 2560×1440** (Playwright): `?view=game&seeded&size=medium` with a step of an encounter open (`?forceencounters`), one beat of Meet the First (`?view=game&firstunmet&size=medium`), the Remembrance opening and the start page's Credits; `getComputedStyle` of a story paragraph reports `Alegreya` at 20 px / 22.5 px and of a section label `Alegreya Sans` 700 with `text-transform: none`; nothing below the fold at either size; console clean; UI-Laws line for 1, 13/14, 17, 21, 33, 37, **57** and **58**
- [ ] Closing commit and PR body carry `Fixes THR-1879` alone on its line

**S2 — [THR-1904](https://linear.app/threadbare/issue/THR-1904) (the carved registry and its credits):**

- [ ] `scripts/vendor-game-icons.ts` and `npm run icons:vendor` exist as § 4; `src/data/icons/carvedShapes.generated.ts` holds one shape for every carved registry entry (one per upstream file, plus the mirrored `forward`) with `GAME_ICONS_SOURCE`; re-running the script on a clean tree changes nothing
- [ ] The registry has the Appendix A entries (the open places as temporary `own` entries per § 6); the uniqueness, meaning and one-path tests pass on it; `carvedShapes.test.ts` passes, and a negative fixture (an entry naming an unvendored slug) fails with the slug and the command in the message
- [ ] The class maps of Appendix B exist (additive; no reader moved yet), total over their unions; `conceptIcons.test.ts` covers the string-keyed sources and fails, naming map and key, on a fixture key with no entry; `iconForKey` returns `fallback` and warns once
- [ ] `ICON_CREDITS` equals the distinct credited names of the carved entries (twelve for Appendix A as written); `CreditsModal` renders the Icons line with its two links **in the same PR**
- [ ] `getIconReport()` in the bridge and `.d.ts`; `Docs/design-system/icons.md` (the vendoring steps, the licence and DRM note, the open classes) with its row in `Docs/design-system/INDEX.md`, and the `extending.md` row of § 11
- [ ] Code gates as S1
- [ ] Browser evidence at 1920×1080 and 2560×1440: `?view=styleguide` § Icon shows every entry; the start page's Credits shows both lines; `await window.__DEBUG.getIconReport()` on `?view=game&seeded&size=medium` reports `carved` equal to the Appendix A entries, `own` equal to `fallback` plus the temporary place entries, `credits` equal to `ICON_CREDITS`, and `fallbacksDrawn` empty; console clean; UI-Laws line for 9, 10, 11, 12, 57, 58

**S3 — [THR-1905](https://linear.app/threadbare/issue/THR-1905) (the label sweep):**

- [ ] Every file in § 10 labels, groups 1–4, follows the label rule; `uppercase` and `display-face-small` re-baselined downward; no file on the skip list edited
- [ ] Code gates as S1; browser evidence at both sizes of the Codex, `MandateDetail`, `DoomClockDetail` and `StrandView` (a section label's computed style as in S1), console clean, UI-Laws line for 13/14, 33, 57

**S4a — [THR-1906](https://linear.app/threadbare/issue/THR-1906) and S4b — [THR-1907](https://linear.app/threadbare/issue/THR-1907) (the icon sweep):**

- [ ] Every surface in their part of § 10 draws `Icon`; the duplicates and dead tables of § 9 are gone; `glyph-icon`, `glyph-icon-data` and `lucide-import` re-baselined downward (S4a: `lucide-import` reaches 2, both in files the Inspector rebuilds); no skip-list file edited
- [ ] S4a: `SphereIcon`'s `useImage` path deleted; the sphere PNGs left in place as `public/the-game.html`'s own assets (§ 9). Reach PNGs: if `ProwessTab` has already gone when S4a lands, S4a deletes `DomainCard`, its styleguide sample and `public/assets/reaches/*`; if not, S4a adds that deletion to the Inspector build slice that retires `ProwessTab` (a comment on that ticket naming the files)
- [ ] `CallingPresentation.glyph` removed after its readers moved (S4b); the three Law 15 data files are `glyph-icon-data` homes (S4b)
- [ ] Code gates as S1; browser evidence at both sizes: a thread row with its calling and activity icons, a toast, the Codex's attachment and undertaking tabs, the hand's card keyword chips; `getIconReport().fallbacksDrawn` empty; console clean; UI-Laws line for 1, 9, 10, 11, 12, 17, 21, 57, 58

## Coordination block

**S1 — THR-1879 (this handoff):**

**Suggested model:** sonnet — token edits, three files to add and a site-by-site sort with a clear rule; the label sweep of the six shared classes is mechanical. Advisory only.

**Blocked by:** [THR-1821](https://linear.app/threadbare/issue/THR-1821) — the ratchet (`scripts/ui-debt-rows.ts`, `ui-debt-baseline.json`) must exist before S1 adds its row and re-baselines. THR-1819 is merged.

**Parallel-safe with:** [THR-1822](https://linear.app/threadbare/issue/THR-1822) (view models in `src/engine/views/`; no shared file), [THR-1881](https://linear.app/threadbare/issue/THR-1881) (the GameView split moves code; S1 edits no `GameView*` file), [THR-1874](https://linear.app/threadbare/issue/THR-1874) (`attachmentGlyphs.ts` only), [THR-1886](https://linear.app/threadbare/issue/THR-1886) (the action prefix table).

**Mutex with:** none on the type block now that [THR-1819](https://linear.app/threadbare/issue/THR-1819) has merged (it set the steps, `--measure-prose` and line-height 1.6, and rewrote `typography.md` § Type Scale, which S1 keeps). [THR-1821](https://linear.app/threadbare/issue/THR-1821) and [THR-1884](https://linear.app/threadbare/issue/THR-1884) / [THR-1885](https://linear.app/threadbare/issue/THR-1885) — `src/index.css` and `scripts/ui-debt-rows.ts` / `ui-debt-baseline.json` (S1 adds a row and re-baselines); one at a time. The frame build ([THR-1875](https://linear.app/threadbare/issue/THR-1875)) and the Stage build ([THR-1877](https://linear.app/threadbare/issue/THR-1877)) touch `NudgeStageHeader`, `NudgePhaseShell`, `EssencePanel`, `SimulationControls` and `DoomBar`, which S1 edits for monospace and figures: whichever lands second rebases.

**Files to touch:** (S1)
- Create: `public/fonts/alegreya-variable.woff2`, `public/fonts/alegreya-400-italic.woff2`, `public/fonts/alegreya-sans-800-regular.woff2`, `public/fonts/OFL.txt`
- Edit: `src/index.css` (font faces, tokens, label classes, `h1`–`h6`), the 31 `--font-prose` files, the 14 monospace files, the § 3 figure surfaces, the label-class call sites, `src/components/StartPage/CreditsModal.tsx`, `scripts/ui-debt-rows.ts` + `ui-debt-baseline.json`, `src/components/MeetTheFirst/__tests__/proseFontToken.test.tsx`, `src/components/Game/__tests__/encounterVeilLaws.test.ts`, `Docs/design-system/typography.md`

The other slices carry their own coordination blocks on their tickets. In short: **S2** is mutex with THR-1885 (it fills the file THR-1885 creates), THR-1874 (`attachmentGlyphs.ts`), THR-1878 (`map-lenses.ts` gains lens rows there; S2 adds an `icon` field) and THR-1886 (`codexRegistry.ts` `catDefs`); every plan of the five adds an `extending.md` row, so that file merges by union. **S3, S4a and S4b** are mutex with the frame, Inspector, Stage and dialog builds only on the files their skip lists already exclude, and with each other on `ThreadsPanel`, `AgentInfoCard` and the Codex files (one at a time).

## Notes for the executor

- **Do not decide the open classes.** Doom kinds, strands, card verbs, places of power and rival tempers wait for Christian's pick ([THR-1908](https://linear.app/threadbare/issue/THR-1908)). Leave their tables as they are; S2 only adds the temporary place entries of § 6.
- **The face never ships without its step** (THR-1819's feed). THR-1819's build merged on 2026-10-14: `--text-base` is 20 px and the prose shorthands already carry line-height 1.6 on `main`, so S1 only moves their face and sorts the sites.
- **Sentence case lives in the strings.** Removing `uppercase` without fixing a Title-Case or lower-case string is half the job.
- **Fetch fonts and icons once, by hand, and commit them.** No runtime fetch, no CDN font link, no icon package.
- **Re-run the vendoring script after any registry edit** and commit both files; the test tells you if you forgot.
- **Do not edit `src/components/HexMapV2/`.** The map switch is THR-1878's.
- **The sheet is the review record.** If a pick changes during the build (a shape that reads badly at 18 px in the real UI), regenerate the sheet from the same data and say so in the PR; THR-1834 allows that swap as long as the shape stays unique.
- Close keyword only in each slice's own closing commit and PR body, never in this plan's PR.

## Decisions taken in this session

The technical *how* of agreed outcomes (process.md rule 4), each open to Christian's veto in chat:

1. **Fonts:** one variable Alegreya roman file (it covers 400 and 500) plus italic 400 and Alegreya Sans 800; +88.5 KB; an `OFL.txt` beside them; no Reserved Font Names, so the Unity port may rename.
2. **The label rule enters through the shared classes first**, then sweeps the kept surfaces; sentence case is written in the strings; a new ratchet row stops small Cinzel.
3. **Vendoring from the upstream repository at a pinned commit**, not Iconify, because the credits need each icon's author; coordinates rounded to one decimal. Eleven picks exist under two authors upstream; each names the author whose file matches the sheet. One registry transform exists, a horizontal mirror, for `forward`.
4. **The table has 228 ideas, one shape each,** with class maps saying which keys draw which idea; 54 shapes settled, 114 proposed, 60 unsure; dead tables are deleted, not mapped.
5. **Five classes are left open for Christian** (28 ideas): doom kinds, strands, card verbs, places of power, rival tempers.
6. **A cleared lair keeps the lair's shape with its muted fill;** resource anomalies get their own shapes.
7. **The unknown-concept mark is an empty ring** with the thing's own name beside it.
8. **Six tickets:** S1 is this ticket; [THR-1904](https://linear.app/threadbare/issue/THR-1904) (S2, registry and credits), [THR-1905](https://linear.app/threadbare/issue/THR-1905) (S3, labels), [THR-1906](https://linear.app/threadbare/issue/THR-1906) and [THR-1907](https://linear.app/threadbare/issue/THR-1907) (S4a and S4b, icons) follow on this plan; [THR-1908](https://linear.app/threadbare/issue/THR-1908) holds Christian's pick of the open classes.
9. **The effect-type glyph table is dead code.** Nothing imports `EFFECT_TYPE_GLYPHS`, so the six broken escapes of THR-1874 never reach a screen today. THR-1874 stays as filed (it is cheap and lands first); S4a deletes the table.

## Appendix A — the registry (228 ideas, one shape each)

*Status:* **settled** = THR-1834 or Christian chose it; **proposed** = this plan, confident; **unsure** = this plan, low confidence (dashed on the sheet). *Author dir* is the upstream directory; the credited names are in § 4.

| # | `IconName` | Meaning (its `meaning` field) | game-icons shape | Author dir | Status |
|---|---|---|---|---|---|
| 1 | `pause` | Pause time | `pause-button` | guard13007 | settled |
| 2 | `play` | Let time run | `play-button` | guard13007 | settled |
| 3 | `faster` | Run time faster | `fast-forward-button` | delapouite | settled |
| 4 | `slower` | Run time slower | `fast-backward-button` | delapouite | proposed |
| 5 | `step` | Step one day while paused | `next-button` | delapouite | proposed |
| 6 | `find` | Find a place, person, power or card | `magnifying-glass` | lorc | settled |
| 7 | `needs-you` | Something waits on you | `ringing-bell` | lorc | settled |
| 8 | `doom` | The doom clock | `sands-of-time` | lorc | settled |
| 9 | `omen` | An omen | `crystal-ball` | lorc | settled |
| 10 | `rivals` | Rival gods | `duel` | sbed | settled |
| 11 | `notables` | Notable mortals | `crown` | lorc (named: two authors upstream) | settled |
| 12 | `read-the-threads` | Read the Threads, the divine digest | `sewing-string` | delapouite | settled |
| 13 | `settings` | Settings | `cog` | lorc (named: two authors upstream) | settled |
| 14 | `close` | Close | `cancel` | sbed | settled |
| 15 | `back` | Go back | `return-arrow` | lorc | **unsure** |
| 16 | `forward` | Go forward (the back arrow, mirrored) | `return-arrow` (mirrored) | lorc | **unsure** |
| 17 | `widen` | Widen the panel | `expand` | delapouite | **unsure** |
| 18 | `pin` | Keep it (pinned) | `pin` | delapouite | **unsure** |
| 19 | `waiting` | Waiting | `hourglass` | lorc | settled |
| 20 | `show-on-map` | Show on the map | `position-marker` | delapouite | **unsure** |
| 21 | `codex` | The Codex | `book-cover` | lorc (named: two authors upstream) | proposed |
| 22 | `chronicle` | The Chronicle | `open-book` | lorc | proposed |
| 23 | `threads` | Your threaded mortals | `yarn` | delapouite | **unsure** |
| 24 | `news` | News | `trumpet-flag` | delapouite | proposed |
| 25 | `held` | Held behind the chapter on screen | `closed-doors` | delapouite | proposed |
| 26 | `chapter-ledger` | The Chapter Ledger | `bookmark` | lorc | **unsure** |
| 27 | `move` | Move | `walk` | delapouite | **unsure** |
| 28 | `investiture` | Investiture | `kneeling` | delapouite | proposed |
| 29 | `hooks` | Hooks: a story you can pull on | `fishing-hook` | lorc | proposed |
| 30 | `pact` | A pact or oath | `shaking-hands` | delapouite | settled |
| 31 | `signature` | Signature: the god’s own mark | `wax-seal` | lorc | proposed |
| 32 | `essence` | Essence | `water-drop` | sbed | proposed |
| 33 | `attention` | Attention, the god’s regard | `candle-flame` | lorc | **unsure** |
| 34 | `detection` | Someone will notice | `cowled` | lorc | **unsure** |
| 35 | `narrate` | Read the prose aloud | `lips` | lorc | **unsure** |
| 36 | `music` | Music | `harp` | delapouite | **unsure** |
| 37 | `done` | Done, met | `check-mark` | delapouite | proposed |
| 38 | `failed` | Failed | `cross-mark` | lorc | **unsure** |
| 39 | `locked` | Locked, not yet revealed | `padlock` | lorc | proposed |
| 40 | `new` | New since you last looked | `sparkles` | delapouite | **unsure** |
| 41 | `disclosure` | Open or fold a section (turned by state) | `triangle-target` | delapouite | **unsure** |
| 42 | `person` | A mortal | `person` | delapouite | proposed |
| 43 | `faction` | A faction | `flying-flag` | lorc | settled |
| 44 | `place` | A place | `house` | delapouite | proposed |
| 45 | `area` | An area of land | `hills` | delapouite | proposed |
| 46 | `place-within` | A place within a place | `doorway` | lorc | proposed |
| 47 | `hex` | A hex of the map | `nested-hexagons` | delapouite | **unsure** |
| 48 | `artifact` | An artifact | `glowing-artifact` | delapouite | proposed |
| 49 | `attachment` | Something granted to a mortal | `present` | delapouite | **unsure** |
| 50 | `companion` | A companion | `hooded-figure` | darkzaitzev | settled |
| 51 | `army` | An army | `knight-banner` | delapouite | settled |
| 52 | `encounter` | An encounter: a mortal’s moment | `drama-masks` | lorc | proposed |
| 53 | `journey` | A journey | `footprint` | lorc | settled |
| 54 | `receipt` | A divine receipt | `incense` | lorc | **unsure** |
| 55 | `monster` | A monster | `dragon-head` | lorc (named: two authors upstream) | proposed |
| 56 | `place-capital` | Capital | `tower-flag` | delapouite | settled |
| 57 | `place-city` | City | `medieval-gate` | delapouite | settled |
| 58 | `place-town` | Town | `village` | delapouite | settled |
| 59 | `place-hamlet` | Hamlet | `wood-cabin` | delapouite | settled |
| 60 | `place-castle` | Castle | `white-tower` | lorc | settled |
| 61 | `place-temple` | Temple | `greek-temple` | delapouite | settled |
| 62 | `place-shrine` | Shrine | `fire-shrine` | delapouite | settled |
| 63 | `place-ruins` | Ruins | `ancient-ruins` | delapouite | settled |
| 64 | `place-mine` | Mine | `mine-wagon` | delapouite | settled |
| 65 | `place-camp` | Camp | `camping-tent` | delapouite | settled |
| 66 | `place-lair` | Lair | `cave-entrance` | delapouite | settled |
| 67 | `place-fort` | Fort | `hill-fort` | delapouite | proposed |
| 68 | `place-tower` | Tower | `watchtower` | delapouite | proposed |
| 69 | `place-ruined-city` | Ruined city | `castle-ruins` | delapouite | proposed |
| 70 | `place-ruined-tower` | Ruined tower | `tower-fall` | lorc | proposed |
| 71 | `place-ruined-village` | Ruined village | `damaged-house` | quoting | proposed |
| 72 | `place-battleground` | Battleground | `arrows-shield` | lorc | proposed |
| 73 | `place-unexplored` | Unexplored place | `fog` | delapouite | **unsure** |
| 74 | `place-healing-spring` | Healing spring | `water-fountain` | delapouite | proposed |
| 75 | `place-master-forge` | Master forge | `sword-smithing` | lorc | proposed |
| 76 | `place-living-archive` | Living archive | `book-aura` | lorc | proposed |
| 77 | `place-fey-crossing` | Fey crossing | `fairy` | lorc (named: two authors upstream) | proposed |
| 78 | `place-sacrifice-site` | Sacrifice site | `star-altar` | delapouite | **unsure** |
| 79 | `place-standing-stones` | Standing stones | `stone-stack` | delapouite | **unsure** |
| 80 | `place-cavern` | Cavern | `underground-cave` | delapouite | proposed |
| 81 | `place-grove` | Grove | `circle-forest` | delapouite | proposed |
| 82 | `place-hot-spring` | Hot spring | `steam` | delapouite | **unsure** |
| 83 | `place-shipwreck` | Shipwreck | `ship-wreck` | delapouite | proposed |
| 84 | `road` | A road or route | `stone-path` | delapouite | proposed |
| 85 | `place-monument` | Monument | `obelisk` | delapouite | proposed |
| 86 | `place-gem-deposit` | Gem deposit | `gems` | lorc | proposed |
| 87 | `place-golden-grove` | Golden grove | `honey-jar` | delapouite | **unsure** |
| 88 | `place-crystal-cavern` | Crystal cavern | `crystal-cluster` | lorc | proposed |
| 89 | `place-ancient-vault` | Ancient vault | `locked-door` | delapouite | **unsure** |
| 90 | `place-sunken-treasury` | Sunken treasury | `open-treasure-chest` | skoll | proposed |
| 91 | `place-herb-garden` | Herb garden | `herbs-bundle` | delapouite | proposed |
| 92 | `place-fossil-bed` | Fossil bed | `ammonite-fossil` | lorc | proposed |
| 93 | `place-iron-seep` | Iron seep | `minerals` | faithtoken | proposed |
| 94 | `place-pearl-shoal` | Pearl shoal | `oyster-pearl` | delapouite | proposed |
| 95 | `place-glowcap-hollow` | Glowcap hollow | `mushrooms-cluster` | delapouite | proposed |
| 96 | `place-nest` | Nest | `hive` | sbed | proposed |
| 97 | `place-haunted-ground` | Haunted ground | `graveyard` | delapouite | proposed |
| 98 | `place-farmland` | Farmland | `wheat` | lorc | proposed |
| 99 | `place-oasis` | Oasis | `oasis` | delapouite | proposed |
| 100 | `place-bridge` | Bridge | `stone-bridge` | delapouite | proposed |
| 101 | `place-wilderness` | Wilderness | `forest` | delapouite | proposed |
| 102 | `place-waypoint` | Waypoint | `wooden-sign` | lorc | proposed |
| 103 | `place-trade-route` | Trade route | `old-wagon` | delapouite | proposed |
| 104 | `place-market` | Market district | `shop` | delapouite | proposed |
| 105 | `place-temple-quarter` | Temple quarter | `church` | delapouite | **unsure** |
| 106 | `place-barracks` | Barracks | `medieval-barracks` | delapouite | proposed |
| 107 | `place-throne-room` | Throne room | `throne-king` | delapouite | proposed |
| 108 | `place-garden` | Garden | `vine-flower` | lorc | proposed |
| 109 | `place-dungeon` | Dungeon | `dungeon-gate` | delapouite | proposed |
| 110 | `place-prison` | Prison | `window-bars` | delapouite | proposed |
| 111 | `place-library` | Library | `bookshelf` | delapouite | proposed |
| 112 | `place-archive` | Archive | `archive-research` | delapouite | **unsure** |
| 113 | `place-crypt` | Crypt | `crypt-entrance` | delapouite | proposed |
| 114 | `place-forge` | Forge | `blacksmith` | delapouite | proposed |
| 115 | `place-tavern` | Tavern | `beer-stein` | lorc | proposed |
| 116 | `possession` | A possession | `chest` | delapouite | proposed |
| 117 | `condition` | A condition | `bandaged` | lorc | proposed |
| 118 | `arms` | Arms: weapons | `broadsword` | lorc | proposed |
| 119 | `mount` | A mount or beast | `horse-head` | lorc (named: two authors upstream) | proposed |
| 120 | `vestments` | Vestments: clothing and armour | `robe` | lorc | proposed |
| 121 | `tome` | A tome or scroll | `scroll-unfurled` | lorc | settled |
| 122 | `relic` | A relic or talisman | `gem-pendant` | lorc | settled |
| 123 | `tools` | Tools and instruments | `claw-hammer` | lorc | proposed |
| 124 | `provisions` | Provisions | `knapsack` | lorc | proposed |
| 125 | `wound` | A wound | `bleeding-wound` | lorc | settled |
| 126 | `disease` | Disease | `plague-doctor-profile` | delapouite | settled |
| 127 | `poison` | Poison | `poison-bottle` | lorc | settled |
| 128 | `blessing` | A blessing | `angel-wings` | lorc | settled |
| 129 | `curse` | A curse | `cursed-star` | lorc | settled |
| 130 | `bestowed-power` | A power a god bestowed | `glowing-hands` | lorc | proposed |
| 131 | `innate-power` | A power the bearer was born with | `inner-self` | lorc | proposed |
| 132 | `bargain` | A debt or bargain | `scales` | lorc | settled |
| 133 | `favour` | A favour owed | `ring` | delapouite | **unsure** |
| 134 | `treaty` | A treaty | `rolled-cloth` | delapouite | **unsure** |
| 135 | `retainer` | A retainer | `swordman` | cathelineau | **unsure** |
| 136 | `holding` | A holding the bearer owns | `house-keys` | delapouite | proposed |
| 137 | `spell` | A spell | `magic-swirl` | lorc | settled |
| 138 | `boost` | Boost: better odds at a fair price | `clover` | sbed (named: two authors upstream) | proposed |
| 139 | `heavy-hand` | Heavy hand: a big push that draws notice | `hand-of-god` | delapouite | proposed |
| 140 | `insurance` | Insurance: no worse than success | `checked-shield` | lorc | proposed |
| 141 | `mercy` | Mercy: disaster becomes failure | `dove` | lorc | proposed |
| 142 | `gambit` | Gambit: all or nothing | `coinflip` | caro-asercion | proposed |
| 143 | `side-bet` | Side bet: a small push and a worldly extra | `rolling-dice-cup` | delapouite | proposed |
| 144 | `long-game` | Long game: plants a mark for later | `acorn` | lorc | proposed |
| 145 | `reveal` | Reveal: see the hidden | `all-seeing-eye` | delapouite | settled |
| 146 | `trait` | Trait card: from who the mortal is | `mirror-mirror` | lorc | **unsure** |
| 147 | `undertow` | Undertow: an ugly method that shifts values | `big-wave` | lorc | **unsure** |
| 148 | `stumble` | Stumble: weakens the opposition | `foot-trip` | lorc | proposed |
| 149 | `ambition` | An ambition | `holy-grail` | lorc | settled |
| 150 | `cache` | Cache: leaves something to find | `spade` | lorc (named: two authors upstream) | proposed |
| 151 | `balm` | Balm: removes a condition | `cloth-jar` | delapouite | **unsure** |
| 152 | `veil` | Veil: help that no one sees | `cloak` | lucasms | proposed |
| 153 | `company` | A company: a group travelling together | `three-friends` | delapouite | **unsure** |
| 154 | `compel` | Compel: bend a will | `puppet` | lorc | settled |
| 155 | `trader` | Trader | `coins-pile` | delapouite | **unsure** |
| 156 | `smuggler` | Smuggler | `wooden-crate` | delapouite | proposed |
| 157 | `magnate` | Magnate | `crown-coin` | lorc | proposed |
| 158 | `mason` | Mason | `brick-wall` | delapouite | proposed |
| 159 | `founder` | Founder | `stake-hammer` | delapouite | **unsure** |
| 160 | `discovery` | Discovery | `spyglass` | lorc | proposed |
| 161 | `archivist` | Archivist | `quill-ink` | lorc | proposed |
| 162 | `zealot` | Zealot | `torch` | delapouite | proposed |
| 163 | `prophet` | Prophet | `third-eye` | lorc | **unsure** |
| 164 | `spider` | Spider: a court schemer | `masked-spider` | lorc | proposed |
| 165 | `chancellor` | Chancellor | `gavel` | lorc | **unsure** |
| 166 | `knife` | Knife: an underworld agent | `plain-dagger` | lorc | proposed |
| 167 | `fence` | Fence | `swap-bag` | lorc | proposed |
| 168 | `reaver` | Reaver | `battle-axe` | lorc | proposed |
| 169 | `captain` | Captain | `crested-helmet` | lorc | proposed |
| 170 | `warden` | Warden | `templar-shield` | delapouite | **unsure** |
| 171 | `healing` | Healing and care | `healing` | delapouite | settled |
| 172 | `steward` | Steward | `watering-can` | delapouite | **unsure** |
| 173 | `crafter` | Crafter | `chisel` | delapouite | proposed |
| 174 | `maker` | Maker | `spinning-wheel` | caro-asercion | proposed |
| 175 | `wayfarer` | Wayfarer | `walking-boot` | lorc | proposed |
| 176 | `pathfinder` | Pathfinder | `walking-scout` | delapouite | proposed |
| 177 | `vengeance` | Vengeance | `bloody-sword` | lorc | **unsure** |
| 178 | `dominion` | Ambition to rule | `winged-scepter` | delapouite | **unsure** |
| 179 | `mastery` | Ambition to master a craft | `gauntlet` | delapouite | **unsure** |
| 180 | `legacy` | Ambition to leave a legacy | `oak` | lorc | proposed |
| 181 | `survival` | Ambition to survive | `campfire` | lorc | proposed |
| 182 | `devotion` | Devotion to a faith | `prayer` | lorc | proposed |
| 183 | `battle` | A fight or battle | `crossed-swords` | lorc | settled |
| 184 | `trade` | Trade | `two-coins` | delapouite | settled |
| 185 | `work` | Work, craft or building | `anvil` | lorc (named: two authors upstream) | settled |
| 186 | `source-bound` | Holding a source of power | `well` | delapouite | **unsure** |
| 187 | `claim` | Holding a place under claim | `flag-objective` | delapouite | **unsure** |
| 188 | `siege` | A siege | `catapult` | heavenly-dog | settled |
| 189 | `scheme` | A scheme | `spider-web` | lorc | settled |
| 190 | `unrest` | Unrest | `mailed-fist` | lorc | settled |
| 191 | `death` | A death | `tombstone` | sbed (named: two authors upstream) | proposed |
| 192 | `birth` | A birth | `stork-delivery` | delapouite | **unsure** |
| 193 | `mandate` | The mandate | `scroll-quill` | delapouite | settled |
| 194 | `dilemma` | A dilemma | `crossroad` | delapouite | proposed |
| 195 | `harvest` | The harvest | `sickle` | delapouite | proposed |
| 196 | `revelation` | A revelation | `sunbeams` | lorc | proposed |
| 197 | `social` | A meeting or friendship | `beer-horn` | delapouite | **unsure** |
| 198 | `trust` | Trust | `chained-heart` | lorc | **unsure** |
| 199 | `scar` | A scar: what it cost | `scar-wound` | lorc | **unsure** |
| 200 | `bond` | A bond: who it changed | `linked-rings` | lorc | proposed |
| 201 | `boon` | A boon: what was earned | `laurels` | lorc | proposed |
| 202 | `path` | A path: what it opened | `open-gate` | delapouite | proposed |
| 203 | `champion` | The god’s champion | `winged-sword` | lorc | proposed |
| 204 | `aspect` | An Aspect of the god | `aura` | lorc | **unsure** |
| 205 | `undertaking` | An undertaking | `compass` | lorc | settled |
| 206 | `divine-actions` | The god’s own actions | `sun-radiations` | lorc | **unsure** |
| 207 | `cards` | The repertoire of cards | `card-pickup` | quoting | **unsure** |
| 208 | `resources` | Resources | `barrel` | delapouite | **unsure** |
| 209 | `pilgrimage` | A pilgrim way | `pilgrim-hat` | delapouite | proposed |
| 210 | `network` | A network of contacts | `cobweb` | lorc | **unsure** |
| 211 | `standing` | Standing: how one is held | `ribbon-medal` | delapouite | **unsure** |
| 212 | `legendary` | A legendary artifact | `star-medal` | delapouite | **unsure** |
| 213 | `hunger` | Hunger cards | `fangs` | skoll | **unsure** |
| 214 | `earned` | Cards earned in play | `card-draw` | faithtoken | **unsure** |
| 215 | `staple` | Staple goods: food and field | `bread` | delapouite | proposed |
| 216 | `strategic` | Strategic goods: war and works | `metal-bar` | lorc | proposed |
| 217 | `luxury` | Luxury goods | `perfume-bottle` | lorc | proposed |
| 218 | `arcane` | Arcane goods | `magic-potion` | delapouite | proposed |
| 219 | `season-spring` | Spring | `sprout` | lorc | settled |
| 220 | `season-summer` | Summer | `sun` | lorc (named: two authors upstream) | settled |
| 221 | `season-autumn` | Autumn | `falling-leaf` | lorc | settled |
| 222 | `season-winter` | Winter | `snowflake-1` | lorc | settled |
| 223 | `cultural-omen` | A cultural omen | `totem` | delapouite | **unsure** |
| 224 | `show-known-land` | Show all the land you know | `globe` | lorc | **unsure** |
| 225 | `minimap` | The minimap | `treasure-map` | lorc | proposed |
| 226 | `drain` | A drain on a source | `leeching-worm` | lorc | proposed |
| 227 | `lens-dominion` | Dominion lens: your ground | `hill-conquest` | delapouite | proposed |
| 228 | `lens-trouble` | Trouble lens | `burning-embers` | lorc | **unsure** |

## Appendix B — the class maps (301 keys in 15 classes)

Each line reads `key (today's glyph) → IconName`. A key that names the same idea as another class draws the same entry.

**Top bar and controls** — new surfaces (frame THR-1875, Inspector THR-1876) and kept chrome. Source today: GameViewTopBar, SimulationControls, Modal, Card, ToastStack, SettingsPanel, StartPage. Map: `none: chrome names its icon at the call site`.

`pause` (⏸) → `pause` · `play` (⏵) → `play` · `faster` (▶) → `faster` · `slower` (◀) → `slower` · `step` (⏭) → `step` · `find` (—) → `find` · `needs-you` (—) → `needs-you` · `doom` (◈) → `doom` · `omen` (◇) → `omen` · `rivals` (⚔) → `rivals` · `notables` (♛) → `notables` · `read-the-threads` (📖) → `read-the-threads` · `settings` (⚙) → `settings` · `close` (✕ ×) → `close` · `back` (←) → `back` · `forward` (—) → `forward` · `widen` (—) → `widen` · `pin` (📌) → `pin` · `timer` (⏱) → `waiting` · `show-on-map` (👁) → `show-on-map` · `codex` (ⓘ) → `codex` · `chronicle` (📖) → `chronicle` · `threads` (—) → `threads` · `news` (—) → `news` · `held` (—) → `held` · `chapter-ledger` (📖) → `chapter-ledger` · `move` (—) → `move` · `investiture` (—) → `investiture` · `hooks` (—) → `hooks` · `covenants` (—) → `pact` · `signatures` (★) → `signature` · `essence` (◆) → `essence` · `attention` (—) → `attention` · `detection` (👁) → `detection` · `busy` (Loader2) → `waiting` · `narrate` (Volume2) → `narrate` · `narrate-stop` (Square) → `pause` · `music` (Volume2/VolumeX) → `music` · `done` (✓) → `done` · `failed` (✕) → `failed` · `locked` (◈ ⊘) → `locked` · `new` (✦) → `new` · `disclosure` (▸ ▾) → `disclosure` · `ornament` (✦ ─ ✦) → *no icon (a plain rule)*

**Object kinds** — kept + new (Find results, Connections, toasts, entity fallbacks). Source today: WorldRefKind (src/types/worldRef.ts); ToastStack NAV_GLYPHS; entity-visual-fallbacks CATEGORY_GLYPHS. Map: `ICON_FOR_WORLD_REF_KIND: Record<WorldRefKind, IconName>`.

`agent` (→ (initial)) → `person` · `faction` (⚑ ⚜) → `faction` · `location` (🏘 ⌂) → `place` · `area` (⛰) → `area` · `sublocation` (◈) → `place-within` · `hex` (⬡) → `hex` · `artifact` (◈ ◆) → `artifact` · `attachment` (❖) → `attachment` · `companion` (♟) → `companion` · `army` (⚔) → `army` · `encounter` (⚔ ✦) → `encounter` · `journey` (↝) → `journey` · `receipt` (✦) → `receipt` · `monster` (☠) → `monster` · `unknown` (◇) → *fallback mark (ours)*

**Places (map and panels)** — kept: the map (THR-1878 switches textures), the land page, Find. Source today: LocationSubtype (src/types/index.ts) — 49 map types + 7 more. Map: `ICON_FOR_LOCATION_SUBTYPE: Record<LocationSubtype, IconName>`.

`capital` (👑 (map: keep)) → `place-capital` · `city` (🏙) → `place-city` · `town` (🏘) → `place-town` · `hamlet` (🏘) → `place-hamlet` · `castle` (🏰) → `place-castle` · `temple` (🕍 🕌) → `place-temple` · `shrine` (⛩) → `place-shrine` · `ruins` (🏚) → `place-ruins` · `mining` (⛏) → `place-mine` · `camp` (⛺) → `place-camp` · `lair` ((map drawing)) → `place-lair` · `cleared_lair` ((map drawing)) → `place-lair` · `fort` (🛡) → `place-fort` · `tower` (🗼) → `place-tower` · `ruined_city` (🏚) → `place-ruined-city` · `ruined_tower` (🏚) → `place-ruined-tower` · `ruined_village` (🏚) → `place-ruined-village` · `battleground` (⚔) → `place-battleground` · `unexplored_poi` (❓) → `place-unexplored` · `healing_spring` ((map)) → `place-healing-spring` · `master_forge` ((map)) → `place-master-forge` · `living_archive` ((map)) → `place-living-archive` · `fey_crossing` ((map)) → `place-fey-crossing` · `sacrifice_site` ((map)) → `place-sacrifice-site` · `standing_stones` ((map)) → `place-standing-stones` · `cavern` ((map)) → `place-cavern` · `grove` ((map)) → `place-grove` · `hot_spring` ((map)) → `place-hot-spring` · `shipwreck` ((map)) → `place-shipwreck` · `ancient_road` ((map)) → `road` · `monument` ((map)) → `place-monument` · `gem_deposit` ((map)) → `place-gem-deposit` · `golden_grove` ((map, grove)) → `place-golden-grove` · `crystal_cavern` ((map)) → `place-crystal-cavern` · `ancient_vault` ((map, ruins)) → `place-ancient-vault` · `sunken_treasury` ((map, wreck)) → `place-sunken-treasury` · `herb_garden` ((map, grove)) → `place-herb-garden` · `fossil_bed` ((map, gem)) → `place-fossil-bed` · `iron_seep` ((map, mine)) → `place-iron-seep` · `pearl_shoal` ((map, gem)) → `place-pearl-shoal` · `glowcap_hollow` ((map, fey)) → `place-glowcap-hollow` · `nest` ((map)) → `place-nest` · `haunted_ground` ((map)) → `place-haunted-ground` · `farmland` (🌾) → `place-farmland` · `oasis` (🌴) → `place-oasis` · `bridge` (—) → `place-bridge` · `wilderness` (🌿) → `place-wilderness` · `wilderness_waypoint` (—) → `place-waypoint` · `trade_route` (—) → `place-trade-route`

**Places within (sublocation types)** — kept: the land page’s places-within rows. Source today: SUBLOCATION_CONCEPT_ART (src/data/sublocation-concept-art.ts). Map: `ICON_FOR_SUBLOCATION_TYPE (others take their parent’s place shape)`.

`market-district` (⚖) → `place-market` · `temple-quarter` (❀) → `place-temple-quarter` · `barracks` (⚔) → `place-barracks` · `throne-room` (♚) → `place-throne-room` · `garden` (❦) → `place-garden` · `dungeon` (⛓) → `place-dungeon` · `prison` (⛓) → `place-prison` · `library` (📜) → `place-library` · `archive` (📚) → `place-archive` · `crypt` (☠) → `place-crypt` · `forge` (⚒) → `place-forge` · `tavern` (🍺) → `place-tavern`

**What a mortal carries (attachments)** — kept: AttachmentRow, the Codex, the Inspector’s Connections. Source today: attachmentGlyphs.ts SUBCATEGORY_GLYPHS; AttachmentCategory, PossessionSubcategory, AgreementType. Map: `ICON_FOR_ATTACHMENT_CATEGORY + ICON_FOR_ATTACHMENT_SUBCATEGORY (total over the unions)`.

`possession` (◈) → `possession` · `condition` (◈) → `condition` · `agreement` (◈) → `pact` · `arms` (⚔) → `arms` · `mounts_beasts` (◈) → `mount` · `vestments` (◇) → `vestments` · `tomes_scrolls` (📜) → `tome` · `relics_talismans` (◆) → `relic` · `tools_instruments` (⚒) → `tools` · `provisions` (⊕) → `provisions` · `wound` (✕) → `wound` · `disease` (☠) → `disease` · `poison` (☠) → `poison` · `blessing` (✦) → `blessing` · `curse` (⊘) → `curse` · `bestowed_power` (⟡) → `bestowed-power` · `innate_power` (✵) → `innate-power` · `pact` (☍) → `pact` · `debt` (⚖) → `bargain` · `favour` (⚖) → `favour` · `treaty` (☍) → `treaty` · `retainer` (♟) → `retainer` · `companion` (♟) → `companion` · `holding` (⌂) → `holding` · `spell` (✨) → `spell`

**Card types (keyword chips)** — kept: CardKeywordChip on the hand and the Stage. Source today: NUDGE_CARD_TYPE_ICONS (src/data/nudge-card-display.ts), NudgeCardTypeId. Map: `NUDGE_CARD_TYPE_ICONS becomes Record<NudgeCardTypeId, IconName>`.

`boost` (◈) → `boost` · `heavy_hand` (✊) → `heavy-hand` · `insurance` (⛨) → `insurance` · `mercy` (☙) → `mercy` · `gambit` (⚄) → `gambit` · `side_bet` (⚂) → `side-bet` · `long_game` (⧗) → `long-game` · `whisper` (❧) → `reveal` · `trait_card` (❖) → `trait` · `signature` (✶) → `signature` · `bargain` (⚖) → `bargain` · `undertow` (≈) → `undertow` · `stumble` (⤫) → `stumble` · `kindled_ambition` (✧) → `ambition` · `omen` (☄) → `omen` · `cache` (◫) → `cache` · `balm` (❦) → `balm` · `veil` (☁) → `veil` · `favor` (⚭) → `favour` · `fellowship` (⚯) → `company` · `compulsion` (➶) → `compel` · `price` (✦) → *Law 15 mark, unchanged* · `legend` (● ▼) → *Law 15 mark, unchanged* · `detection-ch` (👁) → `detection` · `doom-ch` (⧖) → `doom`

**Callings (and the families they seed)** — kept: thread rows. Source today: CALLING_PRESENTATION (src/data/calling-content.ts); BehaviorFamily presentation derives from each family’s seed calling. Map: `an icon field on each calling row`.

`trader` (¤) → `trader` · `smuggler` (¤) → `smuggler` · `magnate` (¤) → `magnate` · `mason` (⚒) → `mason` · `founder` (⚒) → `founder` · `seeker` (📜) → `discovery` · `archivist` (📜) → `archivist` · `zealot` (✦) → `zealot` · `prophet` (✦) → `prophet` · `spider` (⚜) → `spider` · `chancellor` (⚜) → `chancellor` · `knife` (🗡) → `knife` · `fence` (🗡) → `fence` · `reaver` (⚔) → `reaver` · `captain` (⚔) → `captain` · `warden` (⚔) → `warden` · `mender` (✚) → `healing` · `steward` (✚) → `steward` · `crafter` (◈) → `crafter` · `maker` (◈) → `maker` · `wayfarer` (⇢ ◆) → `wayfarer` · `pathfinder` (⇢) → `pathfinder` · `avenger` (✕) → `vengeance`

**Ambitions** — kept: AgentInfoCard, IntentSection, the Codex (the Codex copy retires). Source today: AMBITION_CATEGORY_ICONS (src/data/ambition-categories.ts) and its copy in charteredKindsCodex.ts. Map: `Record<AmbitionCategory, IconName> (one map; the Codex copy is deleted)`.

`dominion` (◈ ♔) → `dominion` · `mastery` (⚗ ✹) → `mastery` · `vengeance` (⚔ †) → `vengeance` · `legacy` (⟟ ⚜) → `legacy` · `survival` (⬡ ⚕) → `survival` · `discovery` (◎ ☼) → `discovery` · `devotion` (✦ ❋) → `devotion`

**Encounter activity and alerts** — kept: thread rows, map activity sprites (THR-1878), Needs-you News (THR-1875). Source today: ActivityKind (shared/ActivityIcon), activityIndicatorRegistry, AlertIcon (types/notification.ts). Map: `ICON_FOR_ACTIVITY: Record<ActivityKind, IconName>; ICON_FOR_ALERT: Record<AlertIcon, IconName>`.

`boot` (⇢) → `journey` · `swords` (⚔) → `battle` · `coin` (¤) → `trade` · `hammer` (⚒) → `work` · `bandage` (✚) → `healing` · `hourglass` (⌛) → `waiting` · `hex-claim` ((drawing)) → `hex` · `source-bound` ((drawing)) → `source-bound` · `claim-flag` ((drawing)) → `claim` · `siege` (⚔) → `siege` · `scheme` (—) → `scheme` · `unrest` (◉ ◎) → `unrest` · `alert-death` (✝) → `death` · `alert-birth` (✦) → `birth` · `alert-doom` (◈) → `doom` · `alert-mandate` (⬡) → `mandate` · `alert-discovery` (◎) → `discovery` · `alert-rival` (⚔) → `rivals` · `alert-dilemma` (⚖) → `dilemma` · `alert-harvest` (⟡) → `harvest` · `alert-revelation` (📖) → `revelation` · `alert-social` (🤝) → `social` · `alert-faction` (⚜) → `faction` · `alert-trust` (🔗) → `trust`

**Consequences and thread-row marks** — kept: the Stage aftermath (THR-1877), thread rows. Source today: EncounterStageConsequenceCategory; ThreadsPanel badges and row extras. Map: `ICON_FOR_CONSEQUENCE: Record<EncounterAftermathCategory, IconName>`.

`scar` (✕) → `scar` · `bond` (◈) → `bond` · `boon` (✦) → `boon` · `path` (◆) → `path` · `badge-encounter` (!) → `needs-you` · `badge-notice` (·) → `news` · `champion` (✦) → `champion` · `aspect` (❂) → `aspect` · `appointment` (⌛) → `waiting` · `badge-aftermath` (✦) → `new` · `badge-tug` (∿) → `threads` · `badge-moment` (◆) → `undertaking`

**Codex categories, undertaking kinds, resources** — kept: the Codex (an XL dialog). Source today: codexRegistry catDefs, undertakingCodex (UndertakingObjectTypeId), charteredKindsCodex, RESOURCE_CATEGORY_GLYPHS. Map: `catDefs icon field; ICON_FOR_UNDERTAKING_OBJECT: Record<UndertakingObjectTypeId, IconName>; ICON_FOR_RESOURCE_CLASS`.

`cat-divine` (★) → `divine-actions` · `cat-hex` (⬡) → `hex` · `cat-location` (⌂) → `place` · `cat-artifact` (✦) → `artifact` · `cat-company` (⁂) → `company` · `cat-threads` (⁘) → `threads` · `cat-actions` (⚔) → `person` · `cat-undertakings` (⚒) → `undertaking` · `cat-possessions` (◆) → `possession` · `cat-conditions` (✕) → `condition` · `cat-agreements` (☍) → `pact` · `cat-companions` (♟) → `companion` · `cat-ambitions` (❧) → `ambition` · `cat-cards` (❖) → `cards` · `cat-resources` (⚖) → `resources` · `u-area` (⛰) → `area` · `u-location` (⌂) → `place` · `u-place` (▣) → `place-within` · `u-route` (⇢) → `road` · `u-pilgrim_way` (✶) → `pilgrimage` · `u-faction` (⚑) → `faction` · `u-company` (⁂) → `company` · `u-army` (⚔) → `army` · `u-network` (⌗) → `network` · `u-companion` (♟) → `companion` · `u-item` (◆) → `possession` · `u-power` (✧) → `spell` · `u-condition` (✕) → `condition` · `u-agreement` (☍) → `pact` · `u-standing` (⚖) → `standing` · `u-mortal` (♙) → `person` · `u-monster` (♞) → `monster` · `legendary` (✪) → `legendary` · `card_core` (❖) → `cards` · `card_signature` (✦) → `signature` · `card_hunger` (☽) → `hunger` · `card_earned` (✧) → `earned` · `res-staple` (☘) → `staple` · `res-strategic` (⚒) → `strategic` · `res-luxury` (◈) → `luxury` · `res-arcane` (✴) → `arcane`

**Seasons** — kept: the top bar date (THR-1875). Source today: SEASON_ICONS (SimulationControls; the WorldPulse copy retires). Map: `Record<Season, IconName> from the SEASONS tuple`.

`spring` (∿) → `season-spring` · `summer` (☼) → `season-summer` · `autumn` (◇) → `season-autumn` · `winter` (❋) → `season-winter`

**Omen kinds** — kept: the top bar Omen and its flyout (THR-1875). Source today: OMEN glyph maps in OmenIndicator.tsx and OmenDetail.tsx (two copies), OmenCategory. Map: `Record<OmenCategory, IconName> (one map; the copy is deleted)`.

`doom_echo` (⊘) → `doom` · `sphere_surge` (◈) → *its sphere’s SphereIcon* · `cultural` (⬡) → `cultural-omen` · `seasonal` (◇) → *its season’s icon*

**Map controls and Trouble marks** — new: the map chrome and the Trouble lens (THR-1878 names them and owns the lists). Source today: THR-1878 plan (map controls, Trouble marks). Map: `THR-1878 lists; shapes from this registry`.

`zoom-in` (+) → *typographic + / − on the button (THR-1878)* · `zoom-out` (−) → *typographic + / − on the button (THR-1878)* · `centre-on-first` (—) → `show-on-map` · `show-known-land` (—) → `show-known-land` · `minimap` (—) → `minimap` · `trouble-unrest` (—) → `unrest` · `trouble-battle` (—) → `battle` · `trouble-siege` (—) → `siege` · `trouble-scheme` (—) → `scheme` · `trouble-drain` (—) → `drain` · `trouble-omen` (—) → `omen` · `trouble-lair` (—) → `place-lair`

**Map lenses** — new: the lens bar (THR-1878). Source today: MAP_LENSES (src/data/map-lenses.ts). Map: `an icon field on each MapLensDef`.

`dominion` (—) → `lens-dominion` · `threads` (—) → `threads` · `trouble` (—) → `lens-trouble` · `trade` (—) → `trade`

## Appendix C — for Christian's eye: classes with no obvious period object

Not decided. Three candidates per idea, drawn side by side on the [sheet](https://claude.ai/artifact/X9woLDsYia4iP3uQkk6QjN) (last section). Until he picks, these keep today's glyph, and the six places among them keep today's map drawing (§ 6). No candidate is a shape the table already uses, and no candidate appears twice, so any pick passes the uniqueness test; "reuse `find`" and "reuse `compel`" mean the verb draws that existing idea, which adds no shape. Candidates that read as modern were replaced, as the picks were.

**Doom kinds** (today: DOOM_ARCHETYPE_GLYPHS (doom-archetype-presentation.ts); DoomBar shows SphereIcon for four of them today)

| Idea | Today | Candidate 1 | Candidate 2 | Candidate 3 |
|---|---|---|---|---|
| Breach | ◈ | `broken-wall` | `earth-crack` | `magic-portal` |
| Convergence | ⬡ | `convergence-target` | `nested-eclipses` | its sphere’s `SphereIcon` |
| Changing | ∿ | `transform` | `moebius-triangle` | its sphere’s `SphereIcon` |
| Sundering | ⚡ | `split-cross` | `shatter` | `lightning-tree` |
| Failing | ◇ | `dead-wood` | `candle-skull` | `broken-pottery` |
| Ascension | ✦ | `stairs-goal` | `angel-outfit` | its sphere’s `SphereIcon` |
| Reckoning | ⚔ | `tarot-20-judgement` | `sword-altar` | its sphere’s `SphereIcon` |

**Strands of a mortal** (today: STRAND_ICONS (StrandView.tsx); Bonds and Ambitions are already decided (bond, ambition))

| Idea | Today | Candidate 1 | Candidate 2 | Candidate 3 |
|---|---|---|---|---|
| Presence | ◉ | `chess-king` | `crowned-heart` | `castle` |
| Desires | ✦ | `heart-plus` | `flame` | `apple-seeds` |
| Beliefs | ◈ | `prayer-beads` | `holy-symbol` | `ankh` |
| Fears | ◆ | `terror` | `screaming` | `ghost` |

**Action verbs on card faces** (today: ACTION_CARD_KEYWORD_ICONS (action-card-display.ts), ActionCrudType)

| Idea | Today | Candidate 1 | Candidate 2 | Candidate 3 |
|---|---|---|---|---|
| Create | ✸ | `hammer-nails` | `spark-spirit` | `painted-pottery` |
| Find out | ◉ | reuse `find` (same idea) | `semi-closed-eye` | `crystal-eye` |
| Change | ⟳ | `magic-palm` | `card-exchange` | `cauldron` |
| Destroy | ✖ | `hammer-break` | `fire` | `shattered-sword` |
| Control (sustained) | ∞ | `hand-grip` | `crossed-chains` | reuse `compel` (same idea) |
| Upkeep while it holds | ↻ | `candle-holder` | `magic-lamp` | `water-mill` |

**Places of power** (today: LocationSubtype wonders; the map draws them today)

| Idea | Today | Candidate 1 | Candidate 2 | Candidate 3 |
|---|---|---|---|---|
| Convergence | (map) | `vortex` | `double-ringed-orb` | `cosmic-egg` |
| Time scar | (map) | `time-trap` | `backward-time` | `extra-time` |
| Ley nexus | (map) | `star-swirl` | `unstable-orb` | `rune-stone` |
| Shadow hollow | (map) | `shadow-follower` | `bottled-shadow` | `evil-moon` |
| Place of power | (map) | `crystal-shrine` | `stone-sphere` | `sun-priest` |
| Corruption | (map) | `tentacles-skull` | `infested-mass` | `poison-cloud` |
| Elder ruin | — | `broken-tablet` | `stone-block` | `dolmen` |

**Rival temperaments** (today: RIVAL_BEHAVIOR glyphs (uiColorPalette.ts), RivalPanel)

| Idea | Today | Candidate 1 | Candidate 2 | Candidate 3 |
|---|---|---|---|---|
| Aggressive | ⚔ | `fist` | `barbarian` | `war-axe` |
| Subtle | ◇ | `domino-mask` | `hooded-assassin` | `invisible` |
| Territorial | ▪ | `defensive-wall` | `guarded-tower` | `spiked-wall` |
| Expansionist | ⬆ | `star-flag` | `sword-array` | `mounted-knight` |

## Intent-judge verdict

**Pass 1 (2026-10-14): Revise**, impact class corrected to External. Dimensions 1, 2, 4–11 PASS; dimension 3 GAP (names the frame and map plans posted on THR-1879 were missing; `disclosure` was an own drawing; `held` merged into `waiting`; Appendix C candidates collided with picks and with each other; S1's blocker was stale) and dimension 12 GAP (music toggle named the wrong shape; badge, pill and "Unmade" words not quoted; unclear whether the player reads the call-site label or the registry meaning). All fixed in this revision: see the proposal's revision notes.

**Pass 2 (2026-10-14): Allow**, impact class External confirmed; all twelve dimensions PASS (11 N/A), 0 GAPs. Its non-blocking recommendations were applied before commit: Appendix C candidates that read as modern were replaced (`wrecking-ball`, `recycle`, `cycle`, `orbital`, `eye-target`) along with candidates that twinned a pick or each other (`candle-light`, `crystal-growth`, `egyptian-temple`, `imperial-crown`, `banging-gavel`, `beams-aura`, `world`, `magic-gate`, `cracked-glass`); more near twins joined the sheet's strip; stale counts fixed; the S1 row's cells split; S2's Done-when restated as predicates; the reach PNGs given an owner; the IconName `spymaster` renamed `spider` to match the UL calling; the "Enter ▸" row added to Player-facing text.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14. Three auditors in parallel (sonnet), cold context. Each note was answered in this doc before commit; the answers follow each verdict.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | The Constants table names `ICON_PATH_DECIMALS`, `ICON_SHAPES_GZIP_BUDGET_KB`, `GAME_ICONS_REPO_COMMIT`, the font tokens, the Cinzel tracking and the roundel geometry. Swapping an icon is "one registry entry". |
| 2. Inspectability | PASS | `getIconReport()` is declared in `debug-bridge.d.ts`, with a warn-once line that names the class map and key. The styleguide § Icon iterates the registry. The Wiring table has a debug-visibility column. Tracing is marked N/A with a reason. |
| 3. Determinism | PASS | There is no PRNG. The vendoring script pins the upstream commit and sorts its output, and "re-running it on a clean tree changes nothing". |
| 4. Fail-soft | PASS-with-note | The Fail-soft table covers an unknown key, a missing `IconName`, a font load failure and a script failure. Note: it doesn't say what `carved('<slug>')` does at registry load if a slug isn't vendored. Only a test is named for that case. |
| 5. Narrative over mechanical | PASS | Story prose gets its own face and a larger step. Icons must be "fantasy-period objects", and every icon keeps its word. |
| 6. Additive over destructive | PASS-with-note | Class maps are added before readers move, and `CallingPresentation.glyph` stays until its readers move. Note: the plan also deletes the `FactionDefinition.iconGlyph` field, about nine dead or duplicate glyph tables, and the second copies of the sphere, reach, season and omen maps. Each deletion is justified by Law 9 or by having no reader. |
| 7. Performance budget | PASS-with-note | Fonts add 88.5 KB. Shapes are 103 KB gzip against a 150 KB warn budget, with a lazy-chunk fallback in Kill criteria. Note: all 219 shapes ship eagerly in the main bundle, and no total-bundle measurement is given. |

NFP AUDIT: PASS-with-notes

*Answered:* a Fail-soft row now covers an unvendored `carved()` slug (fallback shape and warn once; the test blocks it from shipping). NFP 7 now says the shapes ship eagerly and the S2 PR reports the main bundle's gzip size before and after. The deletions stand as justified.

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | No tick, graph, trace, PRNG or rule change. The three presentation fields under `src/engine/` are named and carried in § Interface impact. |
| Content | present-and-substantive | Covers the icon registry (226 entries), the generated vendored shapes with licence metadata, the 15 class maps, the font files, the credits words, and Appendices A–C. |
| UI | present-and-substantive | § 1–11 cover tokens, the label rule, figures and monospace, vendoring, tests, places, the fallback mark, credits and retirement. Player-facing text (with PC-n mapping), playtest signal, event notifications, debug inspection, visual presence and the UI Laws list are all present. |

Missing required sections: none. Two small gaps: no literal "Player-facing display" heading (the numbered § 1–11 do that job); the Content pillar's encounter templates, prose tables and attachment content subsections are neither filled nor marked N/A. Wiring is consistent with a presentation-only scope. Substrate inventory present.

PILLAR AUDIT: PASS-with-notes

*Answered:* the Content pillar now marks encounter templates, prose tables and attachment content N/A with a reason.

### Vision audit

Vision premises touched: north star (story told in prose: extended), "Narrative over mechanical perfection" (confirmed), "Additive over destructive" (confirmed with a note on deleted dead tables and duplicates), "Three pillars" (confirmed); taste profile "Austere voice" (bold sentence-case labels, Cinzel at 22 px and up, no emoji: confirmed), "Always dark, one gold emphasis per panel" (touched), "Cinzel + Alegreya Sans typography" (soft, touched), "Prose-first, no numbers" (touched). No contradictions; the label rule matches the taste profile's amended entry. Three soft notes: (1) `taste-profile.md` lines 228–232 still said "labels in Cinzel; prose in Alegreya Sans" while the plan said no Vision edit was owed; (2) the plan did not address "a panel with three gold accents is a bug" with 219 `currentColor` icons on chips, rows and chrome; (3) tabular figures formalise numeric display, though no numbers are added and Law 15 marks are sanctioned.

VISION AUDIT: PASS-with-notes

*Answered:* (1) this session updated the taste profile's typography entry to the three faces and their roles (Vision audit section above); (2) § 4 now states the colour rule: icons take their parent's text colour and are gold only where the surface already marks importance; the sheet's all-gold drawing is for review only, and the sheet now says so; (3) no change: figures change only where numbers are already allowed (Law 13's pool exception, costs as Law 15 marks, dates).
