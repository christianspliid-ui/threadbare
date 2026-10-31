> **title:** Art-led UI pass — the dressing rules, and slice 1 on the person page (THR-2097)
> **linear_issue:** THR-2097 (slice 1). Programme: THR-2098 · THR-2099 · THR-2100 · THR-2101 · THR-2102 · THR-2103. Icon pick: THR-2104
> **author:** Claude Code (attended design session, 2026-10-31)
> **created:** 2026-10-31
> **three_pillars:** Engine N/A — no tick, graph, rule or trace change; view builders under `src/engine/views/` gain presentation fields only (§ Interface impact) · Content done — words for the who-they-are sentence and the empty Act line, one provisional carved idea · UI done

Plan-size-exempt: multi-slice programme doc. Slice 1 is specified to build level; slices 2–7 are scope cards the design lane plans against § The dressing rules.

# Art-led UI pass (THR-2097 + programme)

*The game ships portraits, relic paintings, heraldry and 229 carved icons, and its pages show almost none of them. This plan sets the rules that put them on every page.*

## Why this is load-bearing

Christian, chat 2026-10-31: *"The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on."* He approved a before/after mock of Kael Thornweaver's wide person page ([mock](https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM)). Then: *"yes. and after that this type of treatment should be done to all the UI layers."*

What the mock fixed, measured on today's build at 1920×1080:
- The portrait is a 7rem box (`SubjectHeader.tsx:39`).
- Four carried relics with painted 16:9 art reach the page only as a "carried" fact in Connections. `attachmentTile` (`personRows.ts:304-335`) gives no image.
- Who they are, Nature, Personality and Dominion render as "Label … Value" panel rows (`Section.tsx:255-286`), which Law 16 calls unfinished UX.
- `Tabs` already accepts an `icon` (`Tabs.tsx:57`), and the Inspector passes none (`InspectorPage.tsx:97`).

Every Inspector page draws through one renderer, so the slice 1 primitives reach all page kinds. The later slices reuse the same primitives on the other homes.

## Settled input (cited, not re-opened)

- One Inspector, three sizes, one renderer. Pages read `SubjectPageVM`, never the graph (THR-1876, THR-1822).
- One carved icon family; `<Icon>` via `iconShape()` only; one idea, one shape (THR-1879, `Docs/design-system/icons.md`).
- Three picture sizes: `hero` 16:9, `portrait` 3:4, `chip` 40px (Law 5). Fallbacks are designed states (Law 4). Person art is knowledge-gated (Law 8).
- The map stays as it is: Golden Hour, dark map parked (Christian, 2026-10-11).

## The dressing rules

Every slice applies these eight rules. A slice plan states, per surface, which rules apply and which it marks N/A, with the reason.

| # | Rule | Primitive (built in slice 1) |
|---|---|---|
| R1 | **Lead with the subject's art at a size that reads.** Portrait 3:4 for people, hero 16:9 for places and scenes, heraldry for factions, relic art for relics. | `SubjectHeader` aside variant; `EntityVisual` |
| R2 | **Every tab and every section heading that names a concept carries its carved icon.** The icon comes from a registry row's `icon` field (Law 58), never chosen in a component. | `Tabs` `icon` (exists); `SectionLabel` `icon` |
| R3 | **Things a subject owns or carries show as art tiles**, never as text chips, when art exists. | `cards` tiles with an `image` band (16:9) |
| R4 | **A tie between two parties is drawn:** face, link icon, face, with the sentence under it. Drawn only when the engine holds the tie. | `BondStrip` |
| R5 | **The one thing that matters most on a surface is a highlighted line:** icon, a display-font headline, one sentence. At most one per surface (Law 31's one gold emphasis). | prose `highlight` |
| R6 | **Label-and-value rows become a sentence or chips** (Law 16). Each fact stays a linked, tooltipped concept inside the sentence (Laws 17, 21). | prose `termRefs` (exists); chips |
| R7 | **A trait list is chips; a scale between two words is a two-pole bar.** The bar never prints a number (Law 13). | `ChipPill` `lead`; `PanelRow.poles` |
| R8 | **An empty state is one quiet line in a dashed frame**, never a full heading over "nothing". | `QuietSlot` |

Out of scope for every slice: new art, the world map, debug/CMS/styleguide/designer views.

## Slice 1 — the primitives, dressed on the person page (THR-2097)

### S1.1 Icons on tabs (R2)

- Add `INSPECTOR_TAB_ICONS: Record<Exclude<InspectorTabId, 'overview'>, IconName>` to `src/data/view-content.ts`, beside `INSPECTOR_TAB_LABELS`. The type is total, so a new tab id without an icon is a type error.
- Values: `prowess → 'prowess'` (new), `attachments → 'attachment'`, `bonds → 'bond'`, `journey → 'journey'`, `chronicle → 'chronicle'`, `chapters → 'chapter-ledger'`.
- `here_now`, `story` and `reaches` get no new shape in slice 1. Slice 2 owns those pages; they draw the fallback mark until THR-2104 picks them.
- The Overview tab draws the subject kind's own icon: `ICON_FOR_WORLD_REF_KIND` for the page's kind, so `person` on a person page.
- `tabsAt` carries the icon on each `TabGroup`. `Body` passes `icon` to `Tabs.Tab`.
- Registry: one new idea, `prowess: { meaning: 'Prowess: what a mortal can do', ...carved('sword-brandish') }`. It is provisional; THR-2104 holds the pick. Run `npm run icons:vendor` and bump `CARVED_IDEA_COUNT` in `iconRegistry.test.ts` to 230. If the slug is not upstream, pick another fantasy-period weapon-in-hand slug and note it on THR-2104.

### S1.2 Icons on section headings (R2)

- `SectionSchemaEntry` and `SectionBase` gain an optional `icon?: IconName`. The generator copies it as it copies `tab` and `visibleAt`.
- `SectionLabel` takes `icon?: IconName` and draws `<Icon size="chip" decorative />` before the label, in the label's own colour.
- Person rows that get an icon. Every value below is an existing idea, so there is no new shape:

| Row | Icon |
|---|---|
| `leading_ambition` | `ICON_FOR_AMBITION[category]` (resolver sets it), else `ambition` |
| `who_they_are` | `person` |
| `dominion` | `lens-dominion` |
| `nature`, `core`, `personality` | `trait` |
| `what_she_is_to_him` | `bond` |
| `slots` | `attachment` |
| `chronicle` rows | `chronicle` |
| `chapters` | `chapter-ledger` |
| `ambitions`, `designs`, `the_work` | `ambition`, `ambition`, `work` |

- Rows with no fitting idea draw no icon. They are listed for slice 2 in the PR body, never given an invented shape.

### S1.3 The portrait-led aside (R1)

- At wide and Full, a person-kind header (agent, companion, god) draws its portrait at `var(--inspector-portrait-w)` wide, 3:4 (Law 5).
- The token is set per layout tier in `src/index.css`: 15rem at 1920, 18rem at 2560, 18rem at 3440. Mirror it in `layoutContract.ts`.
- Docked keeps 5rem. Non-person headers are unchanged in slice 1 (slice 2).
- The name moves under the portrait, at `--font-display`, `--text-3xl` (Cinzel ≥22px holds).
- **Your First badge:** when `courtPosition === 'the_first'`, the standing chip "Your First" moves onto the portrait's bottom edge. It shows as a `Medallion` of the god's face beside the words.
  - The header VM gains `firstOf?: { godName: string; godPortraitSrc: string | null }`, built in `subjectPage.ts`.
  - `selectAscendantIdentityView` needs GameView's archetype (`src/engine/views/subjects/godSheet.ts:71-93`), which the builder does not have. So the slice extracts its portrait line into `ascendantPortraitSrc(state): string | null`: `state.ascendantIdentity?.originFragmentId` → `getOriginPortraitUrl`.
  - `selectAscendantIdentityView` and `firstOf` both call it, so there is still one portrait path (Law 3).
  - `godName` is `state.ascendantIdentity?.divineName`, the same read `godPage` makes (`subjectPage.ts:285`).
  - The chip is not also drawn in the standing row.
- **Where-line place chips** gain their place icon: `iconForSublocation(typeId, parentSubtype)` or `PLACE_ICON`.
  - The VM sets `icon` on each where chip.
  - If `Chip` has no icon slot, add one to the primitive (Law 27) with its styleguide entry (Law 29).

### S1.4 The carried gallery (R3)

- `CardTile` gains an optional `image?: { src: string; alt: string }` and `ref?: NodeRef`.
- `attachmentTile` fills both from the `AttachmentFullEntry` it already reads, via `getAttachmentArtUrl(id, subcategory)` (`artifact-category-art.ts:116`). That is bespoke art first, then the category plate.
- The `cards` renderer draws a tile with an `image` as a 16:9 picture band over its name. Clicking it opens the relic through the router (Law 21).
- `SectionSchemaEntry` and `SectionBase` gain `placement?: 'aside'`. At wide and Full, `InspectorPage` renders sections with `placement: 'aside'` in the aside under the Act row, not in their tab. At docked they stay in their tab.
- The `slots` row ("What they carry") gets `placement: 'aside'`.
- The gallery is two tiles per row (`INSPECTOR_GALLERY_COLUMNS`). The label carries its count: "What they carry · 4".

### S1.5 The bond strip (R4)

- `what_she_is_to_him` moves from the Bonds tab to the Overview tab, first in the main column (order 11). It keeps `visibleAt: ALL`.
- Its prose section gains optional `bond?: { left: { name; src }; right: { name; src } }`. The resolver sets it only when the person holds a thread to the player's god. No thread, no strip: the tie must be engine state.
- `BondStrip` (new, `src/components/shared/BondStrip.tsx`) draws: god `Medallion`, the `bond` icon, person `Medallion`, then the existing sentence.
- The person's face goes through `resolveEntityVisual`, so the knowledge gate holds (Law 8).
- It lands with its styleguide entry and `component-selection.md` row (Law 29).

### S1.6 The highlighted ambition (R5)

- Prose sections gain optional `highlight?: { icon: IconName; headline: string }`.
- `leading_ambition` sets it: the icon from `ICON_FOR_AMBITION`, and the headline `want.displayName`. The existing paragraph becomes the line under it.
- The renderer draws a framed block on `--bg-raised` with a `--accent-gold` hairline, the icon at `list` size in gold, the headline at `--font-display` `--text-xl`, and the sentence at body size.
- This is the page's one gold emphasis (Law 31). The Your First badge uses the neutral chip ramp, not gold.

### S1.7 Who they are as one sentence (R6)

- `who_they_are` returns a prose section instead of a panel. A new pure function `composeWhoTheyAre(facts, name)` in `personRows.ts` builds one or two sentences from the same facts the panel used. Each fact is a `termRefs` entry, so it stays clickable and tooltipped.
- The clause words live in `src/data/person-sheet-words.ts` as `WHO_THEY_ARE_CLAUSES` (one template per fact, `{x}` tokens enriched, Law 43).
- Order: archetype, trade, calling, then means, then the god's mark, path, rite, then "knows the way to".
- A missing fact drops its clause. Zero facts returns `null`, and the row hides. A fact whose word fails to resolve is dropped too (Law 14), never printed as a key.
- The clause templates. `{x}` is the fact's existing display word, linked:

| Fact | Template | Kael |
|---|---|---|
| archetype | "{A archetype}" | "A true believer" |
| trade | " who {trade clause}" (the trade's existing verb phrase) | " who keeps a shrine" |
| calling | ", and a {calling} by calling." | ", and a zealot by calling." |
| means | " {Name} {means phrase}." (the wealth tier's existing phrase) | " Kael gets by." |
| god's mark | " Your mark is on them: {mark}." | " Your mark is on them: Heartfire." |
| path | " {Name} walks {path}." | (none) |
| rite | " {Name} has passed {rite}." | (none) |
| knows the way to | " {Name} knows the way to {place}." | (none) |

- If the archetype is absent, the sentence opens on the next clause with the name ("Kael keeps a shrine…").
- The executor confirms each template's agreement against the panel's existing words in `person-sheet-words.ts`. A fact the panel shows that this table does not name gets a clause in the same form, not a row.
- The rendered sample is under § Player-facing text.

### S1.8 Nature chips, personality bars (R7)

- `nature` returns a `chips` section of its words. `ChipPill` gains `lead?: boolean`. The first value is `lead` and reads "{Word} above all", in primary text with a heavier border.
- `core` and `personality` keep their panel shape. `PanelRow` gains `poles?: [string, string]`, set from the row's "Virtue · Vice" pair.
- A row with `poles` and `meter` renders as a two-pole bar: left word, a track, a marker at `meter`, right word. **The leaning word stays visible** after the bar, as THR-1876 § D6 requires ("the word is always there", `Section.tsx:286-290`). The same word is the `aria-label`.
- No numeral is printed, so the sheetParity numeral check holds.

### S1.9 Dominion as one line (R6)

`dominion` returns prose: "{hold word}. {what it means}." For example, "Foreign ground. Neither yours nor set against you." It draws the `lens-dominion` icon on its label (S1.2).

### S1.10 The quiet Act slot (R8)

When `actOn` has no castable cards, `ActOnRow` renders `QuietSlot`: a dashed `--border-subtle` frame holding the existing `emptyLine`, with no gold heading. `QuietSlot` is a shared primitive for the later slices' empty states.

## Slices 2–7 — scope cards

Each later slice is blocked on THR-2097. The design lane authors its slice plan against the rules table, citing which rules apply per surface and the browser levers that reach it.

| Slice | Issue | Layer | Surfaces |
|---|---|---|---|
| 2 | THR-2098 | The other Inspector page kinds | place and land, faction/Realm, army, relic, god, content card, record. Header art per kind (R1); tab icons for `here_now` / `story` / `reaches` after THR-2104 |
| 3 | THR-2099 | God rail and top bar | `ascendant-bar/*`, `GameViewTopBar`, Needs-you. Law 53: dress only, add nothing |
| 4 | THR-2100 | Stage moments | EncounterVeil, PremonitionModal, JourneyVignetteModal, StoryBeatModal, EmergenceDilemmaModal, MomentCard. Laws 37, 38, 56 hold |
| 5 | THR-2101 | Dialogs | ChapterLedger, DivineReceiptModal, ChoiceSetModal, AscendantBeatModal, EventPopup, ScryOverlay, WarmStartOverlay, SettingsPanel |
| 6 | THR-2102 | Ceremonies and the front door | MeetTheFirstFlow, ThreadingRite, AgeTwilightScreen, HarvestScreen, StartPage |
| 7 | THR-2103 | Lists and notices | Chronicle, Notables, Rivals, Threads, Read the Threads, mandates, doom, omens, toasts, Find, hover card |

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Inspector / subject pages (`SubjectPageVM`, `DETAIL_PAGE_REGISTRY`) | 🟢 ACTIVE | extends: optional row and section fields |
| Carved icon registry (`iconRegistry.ts`, `conceptIcons.ts`) | 🟢 ACTIVE | extends: one idea; reads existing class maps |
| Entity visuals (`resolveEntityVisual`, `getAttachmentArtUrl`) | 🟢 ACTIVE | extends: one new read site |
| Shared primitives (`Section`, `Tabs`, `Chip`, `Medallion`) | 🟢 ACTIVE | extends: optional props; two new primitives |

Runtime count: Kael (seeded medium, The First) carries 4 relics, each with a bespoke painting in `public/assets/items/`. Any other relic falls back to its category plate (`/assets/items/categories/`).

## Interface impact

Read sites only; no new cross-system write.

| Contract | Change |
|---|---|
| Person page VM ← attachment art (`getAttachmentArtUrl`) | **add read**: `personRows.ts` `attachmentTile` |
| Person header VM ← god identity (`ascendantPortraitSrc`, extracted from `selectAscendantIdentityView`) | **add read**: `subjectPage.ts` `firstOf`; the rail keeps its read through the same function |
| Person page VM ← thread to the god | **preserve**: same read as `what_she_is_to_him` today, now also shaping `bond` |
| `SubjectPageVM` / `Section` union | **extend**: optional `icon`, `placement`, `highlight`, `bond`, `CardTile.image/ref`, `PanelRow.poles`, `ChipDescriptor.lead` |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the two read sites in the build PR.

## Engine pillar

N/A. No tick, graph, PRNG, rule or trace change. The edits under `src/engine/views/` are presentation builders behind the THR-1822 seam: optional fields, built from data those builders already read.

## Content pillar

Encounter templates, prose tables and attachment content: N/A. No encounter, vignette or attachment text changes. The only authored words are the sheet clauses below.

### Data tables

- `WHO_THEY_ARE_CLAUSES` in `person-sheet-words.ts` (S1.7).
- `natureLead: '{word} above all'` in the same file.
- `INSPECTOR_TAB_ICONS` in `view-content.ts`.
- The provisional `prowess` idea in `iconRegistry.ts`.

## UI pillar

Screenshot tool: Playwright (DOM surfaces) at 1920×1080 and 2560×1440.

### Player-facing display

Wide person page:
- **Aside:** portrait (with the Your First badge), name, where-chips with place icons, standing chips, Act row or quiet slot, then "What they carry" as art tiles.
- **Main column:** tabs with icons. Overview opens on the bond strip, then the highlighted ambition, then the who-they-are sentence, nature chips, the dominion line and the personality bars.

Docked: one column, 5rem portrait, the same sections in their tabs.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Who they are (Kael) | "A true believer who keeps a shrine, and a zealot by calling. Kael gets by. Your mark is on them: Heartfire." | none | Each term is a link with its existing tooltip |
| Nature chips | "Loyal above all" · "Pious" · "Stubborn" | none | Chip words already carry `tag.*` tooltips |
| Personality bar | "Brave ·····●· Power-hungry  leans brave" | PC-1 | The leaning word is printed beside the bar, and both poles are named, so the position never has to be read alone. No number. |
| Highlight | "Spread the Faith" / then the `leading_ambition` paragraph exactly as today (the build PR quotes Kael's live string) | none | The ambition's existing sentence and tooltip |
| Bond strip | god face · rings · Kael's face / "Kael is bound to you by thread." | none | The existing `what_she_is_to_him` line |
| Your First badge | "Your First" | none | Existing chip words, moved |
| Gallery label | "What they carry · 4" | none | Count of tiles shown |
| Quiet Act slot | "None of your cards works on Kael." | none | Existing `emptyLine` |

### Playtest signal

A tester who opens The First's page can name what The First carries and what they want most, without opening another page.

### Event notifications

None.

### Debug inspection (DebugPanel)

- `InspectorPageReport` gains `dressing`, so `window.__DEBUG.getInspectorLab()` can show what the page drew. The fields:
  - `asideSections: string[]`
  - `bondStrip: boolean`
  - `firstBadge: boolean`
  - `galleryTiles: number`
  - `iconFallbacks: string[]`: section typeIds whose icon drew the fallback mark
- `iconFallbacks` also feeds the existing `getIconReport().fallbacksDrawn`.

### Visual presence (HexMapV2)

N/A. The map is out of scope.

### UI Laws engaged

1, 3, 4, 5, 8, 13, 16, 17, 21, 25, 27, 29, 31, 33, 57, 58.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `personRows.ts` (tiles, who-they-are, nature, poles, dominion) | none (render-time VM) | `Section.tsx` | none | none | `getInspectorLab()` |
| `subjectPage.ts` (`firstOf`, where icons) | none | `SubjectHeader.tsx` | none | none | `getInspectorLab()` |
| `detailPageTemplates.ts` (`icon`, `placement`) | none | `InspectorPage.tsx` | none | none | `getInspectorLab()` |
| `BondStrip`, `QuietSlot` | none | shared | none | none | styleguide |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `--inspector-portrait-w` | 15rem / 18rem / 18rem (1920 / 2560 / 3440) | Aside portrait width at wide and Full |
| `INSPECTOR_GALLERY_COLUMNS` | 2 | Art tiles per row in the aside |
| `BOND_STRIP_MEDALLION` | `chip` size ×1.5 (60px) | Face size in the bond strip |
| `POLE_BAR_TRACK_W` | 8rem | Width of a two-pole bar's track |

## Tracing

N/A — no engine behaviour changes; nothing new happens in the simulation to trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Relic has no bespoke art | Category plate; else the designed glyph fallback (Law 4) |
| Person below `recognised` | Silhouette portrait (Law 8); bond strip draws the silhouette |
| God portrait missing | Badge draws the words only |
| A section's `icon` not in the registry | Fallback mark, warns once (existing `iconShape` behaviour) |
| Who-they-are facts empty | Row returns `null`, hidden |
| `meter` absent on a poles row | Words only, no bar |

## Kill criteria

- **The name and Act row fall below the fold at 1920×1080 on the wide page.** First lower `--inspector-portrait-w` at the 1920 tier. If the floor still fails at 12rem, move the gallery from the aside back into its tab (drop `placement: 'aside'` from `slots`).
- **Christian calls the shipped page "too busy".** First drop the section-label icons and keep the tab icons. Then reassess with him in chat, with a screenshot.
- **Christian reads the personality bar as a number.** Drop the bar and keep the words (one renderer branch).

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. Non-negotiable #3 (mechanics through prose) is served by S1.6 and S1.7.
- [x] No Vision edit is needed.
- Taste profile, "Numbers in UI: percentages, bars with labels": the personality rows already draw a meter bar today (THR-1876 kept a unitless bar beside a word). S1.8 replaces that bar with a two-pole bar that names both ends and prints no number. Christian saw this exact bar in the approved mock. If he reads it as a number after the build, the bar drops to words only. That is one renderer branch to remove.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-10-31-art-led-ui-pass-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Sizes are tokens and named constants (§ Constants) |
| 2. Inspectability | PASS | Placement and sections reported by `getInspectorLab()` |
| 3. Determinism | PASS | No randomness; fallbacks are id-hashed (Law 4) |
| 4. Fail-soft | PASS | § Fail-soft table |
| 5. Narrative over mechanical perfection | PASS | Rows become sentences |
| 6. Additive over destructive | PASS | Optional fields only; panels kept where a scale is shown |
| 7. Performance budget | PASS | Static images through the existing resolver; no new per-tick work |

## Done when

- [ ] On The First's wide page (`?view=game&seeded&size=medium`), every tab and every icon row in S1.2 draws its carved icon.
- [ ] The aside shows the portrait at `--inspector-portrait-w`, 3:4, with the Your First badge carrying the god's face.
- [ ] Every carried relic with art shows as a 16:9 tile that opens its page.
- [ ] The Overview tab renders no panel row for Who they are or Dominion (Law 16).
- [ ] Personality rows render as two-pole bars, with no numeral anywhere on the page (`sheetParity.test.ts` numeral check stays green).
- [ ] The bond strip renders only for a person threaded to the god. A test covers an unthreaded person with no strip.
- [ ] At 1920×1080 the name and Act row are above the fold in the aside (Law 33).
- [ ] `await window.__DEBUG.getInspectorLab()` on The First's wide page reports `dressing.bondStrip === true`, `firstBadge === true`, `galleryTiles` equal to the relics carried, and `iconFallbacks` empty.
- [ ] Four-part browser evidence: 1920×1080 and 2560×1440 screenshots, console output, a `getInspectorLab()` assertion, and a UI-Laws judgment line.
- [ ] `npm run gate` green; `BondStrip` and `QuietSlot` in the styleguide, with `component-selection.md` rows.
- [ ] Closing commit body includes `Fixes THR-2097` on its own line.

## Coordination block

**Suggested model:** opus. It touches the shared section renderer and the VM seam, and the who-they-are sentence needs care with grammar.

**Parallel-safe with:** THR-1908 and THR-2104 (pick sheets; registry swaps are one line each).

**Mutex with:**
- THR-2098..THR-2103: they compose this slice's primitives and are blocked on it.
- Any open ticket editing `src/components/shared/Section.tsx`, `src/engine/views/subjects/personRows.ts` or `src/data/detailPageTemplates.ts`: the same render path.

**Files to touch:**
- Create: `src/components/shared/BondStrip.tsx`, `src/components/shared/QuietSlot.tsx`, plus tests.
- Edit:
  - `src/types/detailPage.ts`: optional fields.
  - `src/data/detailPageTemplates.ts`: `icon`, `placement`, and the `what_she_is_to_him` tab move.
  - `src/engine/views/subjects/personRows.ts`.
  - `src/engine/views/subjects/subjectPage.ts`.
  - `src/engine/views/subjects/godSheet.ts`: extract `ascendantPortraitSrc`.
  - `src/debug-bridge.d.ts`: add `dressing` to `DebugInspectorLabResult`.
  - `src/engine/views/subjects/subjectTypes.ts`.
  - `src/components/shared/Section.tsx`.
  - `src/components/Game/inspector/{InspectorPage,SubjectHeader,InspectorParts}.tsx`.
  - `src/data/view-content.ts`.
  - `src/data/person-sheet-words.ts`.
  - `src/data/icons/iconRegistry.ts` and its generated shapes.
  - `src/index.css`.
  - `src/components/shared/layoutContract.ts`.
  - the styleguide.
  - `Docs/design-system/component-selection.md`.

## Notes for the executor

- Tests that assert the old shapes and will need updating, not deleting:
  - `SubjectHeader.render.test.tsx`
  - `portraitSectionNoEmptyFrame.thr2079.test.tsx`
  - `restoredRows.render.test.tsx`
  - `sheetParity.test.ts` (tab table: `what_she_is_to_him` moves to Overview)
  - `sheetParity.s2b.test.ts`
  - `subjectPages.test.ts`
  - `detailPageGenerator.test.ts`
  - `labSubjects.test.ts`
  - `styleguideSync.test.ts`
  - `src/data/icons/__tests__/iconRegistry.test.ts` (`CARVED_IDEA_COUNT`)
- Do not invent shapes for rows with no fitting idea. List them in the PR body for slice 2.
- Do not add a second portrait resolution path. The god's face comes from `ascendantPortraitSrc`, extracted from the existing selector. The person's face comes from `resolveEntityVisual`.
- The mock's landscape portrait crop is not the spec. 3:4 is (Law 5).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-31. Notes resolved inline after the run: Inspectability (`dressing` report added to § Debug inspection and § Done when); Content (clause templates quoted in S1.7; N/A line for the other content subsections); Vision (taste-profile bar note added to § Vision audit).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | § Constants table names `--inspector-portrait-w`, `INSPECTOR_GALLERY_COLUMNS`, `BOND_STRIP_MEDALLION` and `POLE_BAR_TRACK_W`. Clause words, tab icons and the nature lead are named data tables. |
| 2. Inspectability | PASS-with-note | The wiring table routes every module to `getInspectorLab()`. The plan only says `sectionsShown` shows placement. It does not say that icon fallbacks, the bond strip's presence or absence, or the `firstOf` badge are reported. |
| 3. Determinism | PASS | "No randomness; fallbacks are id-hashed (Law 4)". All of it is render-time VM output. |
| 4. Fail-soft | PASS | § Fail-soft table covers art, knowledge gate, god portrait, icon, empty facts and `meter`. No case for `composeWhoTheyAre` input that is malformed rather than missing. |
| 5. Narrative over mechanical | PASS | Label rows become sentences (R6, S1.7, S1.9). |
| 6. Additive over destructive | PASS-with-note | Optional fields only, and panels are kept for the scale rows. `who_they_are`, `nature` and `dominion` change shape, and `what_she_is_to_him` moves tabs. Ten existing tests are listed to be updated. |
| 7. Performance budget | PASS | "Static images through the existing resolver; no new per-tick work". |

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | Marked N/A in the frontmatter and in § Engine pillar: no tick, graph, PRNG, rule or trace change. The `src/engine/views/` edits are presentation builders only. |
| Content | present-but-thin | Data tables only. The clause templates are not quoted, and Encounter templates, Prose tables and Attachment content are dropped without a reason. |
| UI | present-and-substantive | Screenshot tool, display, an 8-row text table, playtest predicate, notifications, debug, visual presence N/A and the Laws list. |

Missing required sections: none absent outright. Tracing is a one-line N/A. Blast Radius is omitted because it is conditional and no high-impact file is in scope.

Wiring check: present and consistent with Engine N/A. Substrate check: every row extends, with no green-field duplication.

PILLAR AUDIT: PASS-with-notes

### Vision audit

Vision premises touched:
- North star, "the mortal has to feel like a person": extended.
- Non-negotiable #3, mechanics through prose: confirmed.
- Non-negotiable #2, narrative over mechanical perfection: confirmed.
- Non-negotiable #1 (god, not protagonist) and tension #3 (divine remove vs attachment): silent, or a mild lean toward attachment. The god-face medallion and the Your First badge keep the divine side present.
- Taste profile: confirmed. Prose-first, always dark, one gold emphasis.

Contradictions: none.

Note: S1.8's two-pole bar sits near the taste-profile anti-pattern "Numbers in UI: percentages, bars with labels". It prints no numeral and has an aria leaning word, but a marker on a track is still a visual scale.

VISION AUDIT: PASS-with-notes

### Intent-judge verdict

2026-10-31. First pass: **Revise** (three GAPs):
- dim 3, the god-portrait read was unavailable at the seam;
- dim 10, kill criteria were only in the proposal;
- dim 12, the leaning word was aria-only.

All three were fixed. Re-judge: **Allow** (Reversible, no GAPs). Its two non-blocking notes, the executor note and `debug-bridge.d.ts`, are applied.
