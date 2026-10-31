> **title:** Art-led pass, slice 2 — every other Inspector page (THR-2098)
> **linear_issue:** THR-2098
> **author:** Claude Code (design lane, unattended, 2026-10-31)
> **created:** 2026-10-31
> **three_pillars:** Engine N/A — presentation builders under `src/engine/views/` only, no tick/graph/rule/trace change · Content done — the sentence clauses for the rows that stop being label strips · UI done

# Art-led pass, slice 2 — every other Inspector page (THR-2098)

*Slice 1 dressed the person page. This slice applies the same eight dressing rules to every other page kind: places, lands, factions, armies, relics, the god, content cards and records.*

## Why this is load-bearing

Christian, chat 2026-10-31: *"this type of treatment should be done to all the UI layers."* The rules (R1–R8) and their primitives are settled in the programme doc, [§ The dressing rules](2026-10-31-art-led-ui-pass.md#the-dressing-rules); slice 1 ([PR #2663](https://github.com/christianspliid-ui/threadbare/pull/2663)) built the primitives. This plan states, per page kind, which rules apply and how. It restates none of the rules.

Measured on today's `main` (95eb1327):

- **Town and city pages show a placeholder, not their landscape.** The place page's header passes `visual: { kind, id }` with no `src` (`subjectPage.ts:200`). `SubjectHeader` gives `EntityVisual` no terrain (`SubjectHeader.tsx:55`), and the resolver's `location` branch returns null without terrain (`entityVisualResolver.ts:179-183`). Headless census, seed 42 medium: `{"top":235,"sub":844,"topWithHex":235,"topWithPainting":0}`. All 235 places carry `hexCol`/`hexRow`, and none has a painting. So every place header draws the glyph tile, while the land page beside it draws a landscape (`landHeroArt`, `subjectPage.ts:346-358`).
- **Non-person headers draw their art as a 12rem thumbnail beside the name** (`SubjectHeader.tsx:88`). Only person kinds got the art-led aside in slice 1.
- **Fifteen rows on these pages are still label strips** (`kind: 'panel'`). Place: `standing`, `place_of_power`, `area_facts`. Faction: `agenda`, `means`, `strongest_reaches`, `ranks`, `reputations_they_hold`. Content: `effect`, `duration`. God: `essence`, `mandate`, `signatures`, `reaches`. Event: `how_it_invokes_now`. (Grep of `kind: 'panel'` across `src/engine/views/subjects/` and `src/engine/detailPageResolvers.ts`.)
- **No section heading on these pages carries an icon.** None of the item, faction, place, group, event, content, land, god or record rows in `detailPageTemplates.ts:219-545` sets `icon`. Of the tabs, `here_now`, `story` and `reaches` are `null` in `INSPECTOR_TAB_ICONS` (`view-content.ts:39-41`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Inspector pages (`SubjectPageVM`, `DETAIL_PAGE_REGISTRY`) and slice 1 primitives | 🟢 ACTIVE | extends: row `icon`, two aside rows, row shapes |
| Entity visuals (`resolveEntityVisual` `location` branch, `pickConceptArt`) | 🟢 ACTIVE | extends: one caller passes terrain it never passed |
| Carved icon registry | 🟢 ACTIVE | reads existing ideas only |

## Decided by the design lane (delegation, process.md rule 4 — veto in chat)

1. **Place pages lead with their landscape.** The header asks the existing art resolver with the place's own terrain. No second art path (Law 3).
2. **The Mandate is the god page's one highlighted line.** It shows its name and its trend in words. The progress bar stays on the god rail and is not repeated on the page.
3. **Lists of strengths become chips; one-fact rows become sentences.** "Might · strong" is a chip, and "Here you are Respected." is a sentence. Bars on single-ended strengths drop, because the word already carries the size (Law 13).
4. **Relics at a place, or held by a faction, show as art tiles** in the aside. This is the same gallery The First's carried relics got in slice 1.
5. **A heading with no carved shape yet draws none.** Its name goes to Christian's icon pick ([THR-2104](https://linear.app/threadbare/issue/THR-2104)). The ticket's Done-when "no heading without its icon" is read as "no heading without its icon *or* a place on the pick list". The person page made the same call in slice 1 (programme doc S1.2).

## Per-kind dressing

R1 header art · R2 icons · R3 tiles · R4 bond strip · R5 highlight · R6 sentences · R7 chips/bars · R8 quiet slot.

| Kind (layout) | R1 | R3 | R4 | R5 | R6 / R7 rows | R8 |
|---|---|---|---|---|---|---|
| place (location, sublocation, area, hex) | hero-led aside. Location: terrain landscape (decision 1). Sublocation: category plate (exists). Area: designed fallback | new `relics_here` (aside) | N/A: a place holds no thread | N/A: `place_prose` already leads in gold | `standing`, `place_of_power` → sentence. `area_facts` → sentence plus new chips row `area_spheres` | empty Here-now tab → quiet line |
| land | hero-led aside (art exists, `landHeroArt`) | N/A: lairs and places are *In this land* links | N/A | N/A | none: all prose | N/A |
| faction | hero-led aside, heraldry | new `relics_held` (aside) | N/A | `how_they_hold_her` | `agenda`, `means` → sentence. `strongest_reaches`, `ranks`, `reputations_they_hold` → chips | no reputations → quiet line (replaces the `'—'` row) |
| group (army) | hero-led aside, designed fallback (no army art) | N/A: holds nothing | N/A | N/A | none | N/A |
| item (relic) | hero-led aside, relic art (exists) | N/A: it *is* the relic | N/A | N/A: the art leads | none: `traits`/`tags` are already chips | N/A |
| god | portrait aside (slice 1, unchanged) | N/A | N/A: the bond strip is drawn on the person | `mandate` (decision 2) | `essence`, `signatures`, `reaches` → chips | N/A |
| content | hero-led aside, designed fallback | N/A | N/A | N/A | `effect`, `duration` → sentence | N/A |
| event / record | hero-led aside, designed fallback | N/A | N/A | N/A | `how_it_invokes_now` → prose of its callback line | N/A |

"Designed fallback" is the id-hashed glyph tile (Law 4). New art is out of scope, per the programme doc.

### R1 — the hero-led aside

- At wide and Full, a non-person header draws its picture at the full aside width, 16:9 `hero` (Law 5), with the name under it. This is the slice 1 column layout without the portrait crop.
- `SubjectHeader`'s `lead` becomes "not compact", and `PERSON_LIKE` now only chooses `portrait` vs `hero`. Docked keeps the 9rem thumbnail beside the name.
- **Place art (decision 1):**
  - `SubjectHeaderVM['visual']` gains optional `terrain?: TerrainType`.
  - The world-ref page builder sets it for a `location` ref from `tileAt(state, hexCol, hexRow)?.terrain`.
  - `SubjectHeader` passes `{ terrain }` in `EntityVisual`'s `opts`, so the resolver's existing `location` branch (`pickConceptArt(terrain, [node], …)`) returns the landscape.
  - A lair's own art wins, as on the land page: if `getOwnLocationConceptArtUrl(locationSubtype)` returns art, the builder sets it as `src`.
- Faction heraldry draws inside the 16:9 frame through `EntityVisual`, unchanged.

### R2 — icons (existing ideas only; no new shape)

**Overview tab:** `overviewIconFor` already covers the world-ref kinds. The god page's Overview has no idea → THR-2104 list. Land, content, record, event and group pages have one tab, so no tab bar is drawn (Law 25).

**`here_now`, `story`, `reaches` tabs** stay `null` until THR-2104 picks them. Each is then a one-line change.

**Section headings** (set `icon` on the registry row in `detailPageTemplates.ts`):

| Kind | Row → idea |
|---|---|
| item | `icon_with_meaning` → `artifact` · `traits` → `trait` · `dominion` → `lens-dominion` · `previous_uses` → `chronicle` |
| faction | `how_they_hold_her`, `reputations_they_hold`, `ranks` → `standing` · `description` → `faction` · `venerates` → `devotion` · `pilgrim_ways` → `pilgrimage` · `dominion` → `lens-dominion` · `fealty` → `pact` · `agenda` → `ambition` · `means`, `purse` → `resources` · `recent_actions` → `chronicle` · `relics_held` → `artifact` |
| place | `place_prose` → the page's world-ref idea · `past_line`, `memory` → `chronicle` · `founded_by` → `founder` · `fortunes` → `trade` · `lair_monster` → `monster` · `settlement_notable` → `notables` · `prayer` → `devotion` · `pilgrim_way` → `pilgrimage` · `livelihood` → `work` · `dominion` → `lens-dominion` · `contested` → `strife` · `conditions_here` → `condition` · `standing` → `standing` · `place_of_power` → `source-bound` · `area_facts` → `area` · `encounters_here` → `encounter` · `relics_here` → `artifact` |
| land | `the_land` → `hex` · `what_came_before` → `chronicle` |
| group | `who_they_are` → `army` |
| content | `effect` → `attachment` |
| god | `essence` → `essence` · `mandate` → `mandate` · `signatures` → `signature` |

**No fitting idea → no icon, listed on THR-2104** (decision 5): the god Overview tab; item `made_by`, `what_it_does`, `tags`; faction `crown`, `conclave`, `strongest_reaches`, `customs`; place `settlement_size`, `walls`, `guild_postings`, `area_spheres`; group `what_they_are_doing`; event and record `what_happened`, `what_it_became`, `how_it_invokes_now`, `outcome`; content `what_it_is`, `its_voice`, `marks`, `duration`, `triggers`, `source`; land `its_soul`; god `divine_nature`, `reaches`. The reach and sphere chips inside a section keep their own vocabularies (Law 9).

### R3 — relic galleries

- `relics_here` (place, order 60) and `relics_held` (faction, order 70) are `cards` sections, `placement: 'aside'`, visible `DWF`.
- They read the same edges the Connections block reads: `lies_at` in, `only: 'artifact'` for a place, and `possesses` out, `only: 'artifact'` for a faction (`connections.ts`). Each tile is built by slice 1's `attachmentTile` path (`getAttachmentArtUrl`, bespoke art, then category plate).
- Label with count: "Relics here · 3", "Relics they hold · 2". No relics → the row returns `null` (no empty gallery).
- Connections keeps its chip row, as on the person page.

### R5–R7 — the rows

- **Sentences (R6)** are prose sections with `parts`, so each fact stays a link with its tooltip (slice 1's `SentencePart`). They are built by one small composer per row, from the words below. A missing fact drops its clause; zero facts → `null`.
- **Chips (R7):** each `PanelRow` maps to `{ label: left, flavour: right, tooltipId, sphere?, sentiment?, clickRef? }`. `reputations_they_hold` keeps its sentiment and links the target (`clickRef`). Essence chips carry `sphere`.
- **The Mandate (R5, decision 2):** a prose section with `highlight: { icon: 'mandate', headline: mandate.name }`. Its sentence is "{trend word}. {flavour line}" from `INSPECTOR_WORDS.mandateTrend` and `mandate.flavorLine`. It is the god page's only highlight. The faction page's only highlight is `how_they_hold_her`.

## Content pillar

Encounter templates, prose tables and attachment content: N/A. No authored story text changes; only sheet clauses.

### Data tables

`SUBJECT_SENTENCE_CLAUSES` in `src/data/subject-sheet-words.ts`. One template per fact. `{x}` is the fact's existing word, linked or tooltipped as its row was:

| Row · fact | Template |
|---|---|
| place `standing` | "Here you are {band}." |
| `place_of_power` · holder / none | "{Holder} holds it." / the existing `PLACE_OF_POWER_LINES.noOne` as a sentence |
| · stream | "Its stream runs {yield} of {sphere}, fading {duration}." · dormant: "Its stream lies dormant." |
| · origin | "Its power came from {origin}." |
| · corrupt / bound | the existing `corruptLine` / `boundLine`, unchanged |
| `area_facts` | "{Size words}, {danger words}." then "{Feature word}." (the size and danger bands are already noun phrases: "Boundless lands", "settled country") |
| faction `agenda` | "{Agenda name}: {status}." then the existing kindled line if set |
| faction `means` | "They are {band}." |
| content `effect` | "{effect line}." · "It is lost {loss condition}." · "Granted by {granter}." · "A {agreement kind}." |
| content `duration` | "It lasts {duration}." |

The executor checks each template's agreement against the live words and quotes one rendered string per row in the PR. A fact the panel showed that this table does not name gets a clause in the same form, never a row.

## UI pillar

Screenshot tool: Playwright (DOM surfaces) at 1920×1080 and 2560×1440.

### Player-facing display

Wide page, any kind: the aside holds the hero picture at full aside width, then the name, where-chips, standing chips, the Act row (or quiet slot), and the relic gallery where one applies. The main column holds the tabs with icons, then rows as sentences, chips and the one highlight.

### Player-facing text

The samples below are composed from the live word tables (`geo-word-bands.ts`, `ruin-words.ts`, `divine-nature-content.ts`, `subject-sheet-words.ts`, `view-content.ts`) and real names. Loremead is seed 42's first area, 150 hexes. Dominion of Stone is a shipped Mandate. The executor replaces each sample with the live string in the PR. For every generated sentence (PC-3): an empty slot drops its clause, and zero clauses hide the row (§ Fail-soft).

| Surface | Exact text (rendered sample) | Complaint class | How the player understands it |
|---|---|---|---|
| Place standing | "Here you are Accepted." | PC-3 | "Accepted" carries `ui.reputation_with`: "The social score between you and someone — a person, a faction, or a place…" |
| Place of power: holder / stream / origin | "Aldric Vane holds it. Its stream runs a steady flow of time, fading within the season. Its power came from the Sunken Abbey." | PC-3 | Holder and origin are links; "time" carries `sphere.time` |
| Place of power: dormant | "Its stream lies dormant." | PC-3 | one plain fact |
| Area facts | "Boundless lands, settled country." (Loremead: 150 hexes; `areaSizeWord`, `positionalDangerWord`) | PC-3 | "settled country" keeps `ui.land.danger` |
| Area spheres chips | "Time · strong" · "Force · faint" | PC-1 | each sphere chip carries `sphere.<id>`, the sphere's own description |
| Faction agenda | "Hold the river crossings: under way." | PC-3 | the agenda's existing status word |
| Faction means | "They are Prosperous." | PC-3 | the band word keeps `ui.econ.means.faction` |
| Faction strengths chips | "Might · Strong" · "Lore · Able" (`factionReachWord`) | PC-1 | `reach.<id>` tooltip, the Reach's own description |
| Faction ranks chips | "Initiate · Accepted and above" | PC-3 | `FACTION_LINES.rankBand`, unchanged words |
| Faction reputations chips | "Ironhold · wary" (sentiment edge) | PC-1 | chip links the faction; the phrase is the engine's own |
| No reputations | "They hold no one in regard yet." | none | replaces the `—` / "no reputations recorded" strip |
| Content effect / duration | "Steadies the hand in a fight. It is lost if the bearer flees. Granted by the Temple of Ash." / "It lasts a season." | PC-3 | `getDurationWord`; granter is a link |
| Event: how it invokes now | "When the bells rang twice at Harrowgate." (the node's `callbackPhrase`, as prose) | PC-3 | one authored line, no label |
| God essence chips | "Chaos · A current" · "Mind · A whisper" (`essenceToProseDescriptor`) | PC-1 | `ui.essence.row`: "The power you have to spend in this sphere. Casting a card of this sphere draws it down…" |
| God signatures chips | "Might · The Iron Path · settling" | PC-1 | `ui.signatures`: "The powers your Reaches have settled into…" |
| God reaches chips | "Might · Adept" | PC-1 | `reach.<id>` |
| Mandate highlight | "Dominion of Stone" / "Rising. Seize control of 2 settlements." (the stage's authored objective, exempted by name in § Done when) | PC-1, PC-7 | the headline carries `ui.mandate_tracker`: "Divine objectives — the second clock, racing the doom bar…"; "Rising" is the trend word, and the rail still holds the bar |
| Gallery labels | "Relics here · 3" · "Relics they hold · 2" | none | count of tiles shown, as slice 1's "What they carry · 4" |

Holder, origin, agenda, granter and event names other than Loremead and Dominion of Stone are illustrative. The headless seed-42 world has no factions or places of power at tick 30 (census: node types `trait,region,actor,location,ambition,artifact,…`).

### Playtest signal

A tester who opens a town's page can say what the land around it looks like and which relics lie there, without opening another page.

### Event notifications

None.

### Debug inspection

None new. `getInspectorLab()`'s slice 1 `dressing` report already covers every page: `asideSections`, `galleryTiles`, `iconFallbacks`. The header's art tier is read from the DOM (`data-entity-visual-tier` on `EntityVisual`).

### Visual presence (HexMapV2)

N/A. The map is out of scope.

### UI Laws engaged

3, 4, 5, 9, 13, 14, 16, 17, 21, 25, 31, 33, 58.

## Interface impact

| Contract | Change |
|---|---|
| Place header VM ← tile terrain (`tileAt`) | **add read**: `subjectPage.ts` world-ref page builder |
| Place/faction page VM ← artifact art (`getAttachmentArtUrl`) | **add read**: `placeRows.ts`, `factionRows.ts` |
| `SubjectHeaderVM.visual` | **extend**: optional `terrain` |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the two read sites in the build PR.

## Engine pillar

N/A. No tick, graph, PRNG, rule or trace change. The edits under `src/engine/views/` are presentation builders behind the THR-1822 seam, reading data those builders already reach.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace | Debug |
|---|---|---|---|---|---|
| `subjectPage.ts` (terrain, lair art) | none (render-time VM) | `SubjectHeader.tsx` | `tiles` (read) | none | `EntityVisual` `data-entity-visual-tier` |
| `placeRows.ts`, `factionRows.ts`, `itemRows.ts`, `pageResolvers.ts`, `detailPageResolvers.ts` (rows) | none | `Section.tsx` | none | none | `getInspectorLab()` |
| `detailPageTemplates.ts` (`icon`, `placement`, new rows) | none | `InspectorPage.tsx` | none | none | `getInspectorLab()` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `INSPECTOR_GALLERY_COLUMNS` (slice 1, reused) | 2 | Relic tiles per row in the aside |
| `--inspector-portrait-w` (slice 1, reused) | 15rem / 18rem / 18rem | Aside width the hero fills at wide and Full |

## Tracing

N/A — no engine behaviour changes; nothing new happens in the simulation to trace.

## Fail-soft table

| Failure | Fallback |
|---|---|
| Place has no `hexCol`/`hexRow`, or no tile | No terrain → the designed glyph tile (today's behaviour) |
| `pickConceptArt` finds nothing | Glyph tile, no layout shift (Law 4) |
| Relic has no bespoke art | Category plate, else the glyph tile |
| A clause's word does not resolve | The clause drops (Law 14); zero clauses → row hidden |
| Mandate absent | No highlight; no other row is promoted |

## Kill criteria

- **The name or Act row falls below the fold at 1920×1080** on a faction or place page. First, cap the hero's height at the aside's 16:9 at `--inspector-portrait-w`. If that still fails, fall back to the thumbnail at the 1920 tier only.
- **Christian says a page reads "too busy".** Drop the section-heading icons first; the tab icons stay.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. Non-negotiable #3 (mechanics through prose) is served by the sentence rows.
- [x] No Vision edit needed. The taste profile's "numbers in UI" anti-pattern is served: this slice removes bars, adding none.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-10-31-thr-2098-art-led-inspector-pages-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Clauses and icon choices are data rows; sizes are slice 1 tokens |
| 2. Inspectability | PASS | `dressing` report plus `data-entity-visual-tier` on the header art |
| 3. Determinism | PASS | `pickConceptArt` and the fallback are id-seeded; no randomness |
| 4. Fail-soft | PASS | § Fail-soft table |
| 5. Narrative over mechanics | PASS | Strips become sentences |
| 6. Additive over destructive | PASS-with-note | Fifteen rows change shape. Their tests are updated, not deleted (§ Notes) |
| 7. Performance budget | PASS | One tile read per open page; no per-tick work |

## Done when

- [ ] A town's wide page (seeded medium) shows a landscape in its header: `EntityVisual` reports `data-entity-visual-tier="art"`. A unit test covers a location with a tile (art) and one without (glyph).
- [ ] On every page kind in § Per-kind dressing, each tab and section heading either draws its carved icon or is on the § R2 no-idea list. `getInspectorLab().dressing.iconFallbacks` is empty on each.
- [ ] No Overview on these kinds renders a `panel` section. A test walks the registry: none of the fifteen rows returns `kind: 'panel'`.
- [ ] A place with relics lying at it, and a faction holding relics, show the gallery in the aside. `dressing.galleryTiles` equals the relic count.
- [ ] The god page's only `[data-highlight]` is the Mandate; the faction page's only one is "How they hold her".
- [ ] No numeral on any of these pages, with two named exemptions (`sheetParity.test.ts` numeral check green, its allow-list extended by exactly these two):
  - the gallery count labels, which follow slice 1's "What they carry · 4";
  - the Mandate highlight's authored objective line ("Seize control of 2 settlements."). It is the Mandate stage's own `description`, the string the god rail's Mandate row shows today. The page carries it unchanged; a count in an objective is a goal, not a magnitude readout (Law 13 bars state magnitudes).
- [ ] A registry-walk test asserts that every non-person row either sets `icon` or has its `typeId` on the § R2 no-idea list (exported as `NO_IDEA_ROWS` beside the registry).
- [ ] The PR's Player-facing text quotes one live rendered string per table row above.
- [ ] At 1920×1080 the name and Act row are above the fold on a town, a faction and a relic page (Law 33).
- [ ] Four-part browser evidence at 1920×1080 and 2560×1440, one page per kind (place, land, faction, army, relic, god, content, record): screenshots, console output, a `getInspectorLab()` assertion, and a UI-Laws judgment line.
- [ ] `npm run gate` green.
- [ ] Closing commit body includes `Fixes THR-2098` on its own line.

## Coordination block

**Suggested model:** opus. It touches the shared header and many resolvers, and the clauses need care with grammar.

**Parallel-safe with:** THR-2104 and THR-1908 (icon picks; registry swaps are one line each). Also THR-2099 (god rail and top bar), which touches files disjoint from this slice.

**Mutex with:**
- THR-2100..THR-2103 and THR-2094: none share these files today; recheck at claim.
- Any open ticket editing `SubjectHeader.tsx`, `detailPageTemplates.ts`, `placeRows.ts`, `factionRows.ts` or `pageResolvers.ts`: the same render path.

**Files to touch:**
- `src/engine/views/subjects/{subjectPage,subjectTypes,placeRows,factionRows,itemRows,pageResolvers}.ts`
- `src/engine/detailPageResolvers.ts` (`reputations_they_hold`, `how_it_invokes_now`)
- `src/data/detailPageTemplates.ts`, `src/data/subject-sheet-words.ts`
- `src/components/Game/inspector/SubjectHeader.tsx`
- `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`
- the Design Reference Wiki page whose `sources` match

## Notes for the executor

- Tests to update, not delete: `SubjectHeader.render.test.tsx`, `sheetParity.test.ts`, `sheetParity.s2b.test.ts`, `subjectPages.test.ts`, `detailPageGenerator.test.ts`, `labSubjects.test.ts`, plus any test asserting the fifteen rows' `panel` shape (grep each `typeId`).
- Do not add a second art path. The place landscape comes from the resolver's `location` branch, given terrain.
- Post the § R2 no-idea list as one comment on THR-2104 when the PR merges.

## Forked-audit verdicts

*Generated by the design-audit pipeline, 2026-10-31. Notes resolved inline after the run: the constants table now names the reused slice 1 tokens; the reputation and rank chips carry band words only (§ Player-facing text).*

### NFP audit

PASS-with-notes. Tunability: clauses and icons are data rows. The note was that the hero size and chip mapping have no named constant; the hero size reuses `--inspector-portrait-w`, now in § Constants. Inspectability: `dressing` plus `data-entity-visual-tier`. Determinism: no randomness. Fail-soft: five cases covered. Narrative: strips become sentences. Additive: optional `terrain` and new rows; fifteen rows change shape, with tests updated and not deleted. Performance: one `tileAt` read per open page.

### Three-pillar audit

PASS. Engine N/A with rationale. Content present and substantive (`SUBJECT_SENTENCE_CLAUSES` per-row table). UI present and substantive (display, exact text, a predicate playtest signal, debug, Laws, screenshot tool). Wiring connects every active pillar; Interface impact lists both read sites.

### Vision audit

PASS-with-notes. Non-negotiable #3 and the taste profile's "no numbers visible" are confirmed: bars are removed and none added. No contradiction. Soft note: the faction rank and reputation chips must stay word-only at build time, never raw 0–1 values.

### Intent-judge verdict

2026-10-31. First pass: **Revise**, one dimension-12 GAP. The player-facing text table lacked rendered samples, complaint classes and tooltip sources for the new sentences and chips, and the count labels clashed with the no-numeral Done-when. Both fixed. Second pass: **Revise**, one GAP. The Mandate's authored objective line carries a numeral; it is now a named exemption, and a registry-walk test was added for the icon predicate. Third pass: **Allow** (Reversible, 0 GAPs). Its notes are applied: decision 5 is named in the veto invitation, and the executor tags PC-6 on the Mandate row.
