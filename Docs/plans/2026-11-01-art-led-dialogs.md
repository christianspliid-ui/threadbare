> **title:** Art-led pass, slice 5 — the dialogs (THR-2101)
> **linear_issue:** THR-2101
> **author:** Claude Code (design lane, unattended, 2026-11-01)
> **created:** 2026-11-01
> **three_pillars:** Engine N/A — one presentation helper beside the Ledger rows; no tick, graph, rule or trace change · Content done — the court's sentences, two quiet-slot lines, one fallback line · UI done

# Art-led pass, slice 5 — the dialogs (THR-2101)

*Slices 1–4 dressed the Inspector, the chrome and the Stage. This slice dresses the dialogs: the Chapter Ledger, what your act bought, a choice, a beat, a world message, your court, the warm-start wait and settings.*

## Why this is load-bearing

Christian, chat 2026-10-31: *"this type of treatment should be done to all the UI layers"*, after approving the person-page [mock](https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM). Rules R1–R8 and their primitives are settled in the programme doc, [§ The dressing rules](2026-10-31-art-led-ui-pass.md#the-dressing-rules). Slice 1 ([PR #2663](https://github.com/christianspliid-ui/threadbare/pull/2663)) built the primitives. This plan states which rules apply to each dialog.

Measured on `main` at 039b50c7:

- **Seven of the eight are homed dialogs** (`src/data/homed-surfaces.ts:66-80`). SettingsPanel is not homed; it is a plain `Modal size="m"` (`SettingsPanel.tsx:219`). Every one caps at `--modal-max-h` through `dialogSizeStyle` (`dialogSize.ts:68`), so Law 33 holds today.
- **Five draw no art at all:** ChapterLedger and ChapterView, ChoiceSetModal, WarmStartOverlay, SettingsPanel (imports checked). AscendantBeatModal draws only granted-card art. DivineReceiptModal draws the act's art as a 150px header (`DivineReceiptModal.tsx:80-88`). EventPopup's ceremonial tier draws a sphere medallion (`EventPopup.tsx:78-80`).
- **The court hand-rolls its faces.** Seats draw raw `<img src={agent.portraitUrl}>` with a gradient fallback (`ScryOverlay.tsx:114-118, 326-327, 849-854`), outside `resolveEntityVisual`.
- **No dialog heading draws a carved icon.** `Modal.Header` takes no icon (`Modal.tsx:152`). The Ledger's only icon is the per-row `threads` mark (`ChapterLedger.tsx:245`).
- **Label-and-value strips (Law 16), all in the court:** "Position: … / Minimum tier: …" (`ScryOverlay.tsx:294-296`), "Cost: N sphere essence" (`:464-465`), "Insufficient … Required: N, Available: M" (`:510-511`), "**Structure Bonus:** …" (`:738`). Title picks show "2 bonuses" / "1 weakness" as counts (`:493-502`). Empty slots read "◇ Coming Soon" (`:758, 780`).
- **One raw key leaks:** a beat's granted card with no template prints `You will learn: {actionId}` (`AscendantBeatModal.tsx:323`), against Law 14.
- **Settings uses emoji** for its two notification modes: ⏱ and 📌 (`SettingsPanel.tsx:319, 337`).
- **Registry ideas that fit:** `chapter-ledger`, `receipt`, `dilemma`, `settings`, `place`, `relic`, `essence`, `waiting`, the `season-*` family (`ICON_FOR_SEASON`), and `ICON_FOR_CONSEQUENCE`. There is no idea for *court*, *beat*, *apex*, *inner circle*, *outer reaches* or *the First* (grep of `iconRegistry.ts` `meaning:` lines).
- **Levers:** `openHomedSurface(kind)` opens none of the seven; each is `later(...)` with a hint (`useStageDebugBridge.ts:255-273`). The warm start opens with `?view=game&seeded&warm=<ticks>`; the beat with `__DEBUG.forceOffering()` (`debug-bridge.d.ts:1941`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Homed dialogs (`homed-surfaces.ts`, `DialogHost`) and `Modal` | 🟢 ACTIVE | extends: optional `icon` on `Modal.Header` |
| Entity visuals (`resolveEntityVisual`, knowledge gate) | 🟢 ACTIVE | reuses: new read sites, the slice-4 pattern |
| Slice-1 primitives (`SectionLabel` `icon`, `QuietSlot`, `ChipPill`, `CardTile` `image`) | 🟢 ACTIVE | reuses |
| Carved icon registry, `ICON_FOR_CONSEQUENCE`, `ICON_FOR_SEASON` | 🟢 ACTIVE | reads existing ideas only; no new shape |
| Stage debug bridge (`openHomedSurface`, `useStageDebugBridge`) | 🟢 ACTIVE | extends: real levers for four dialogs |

## Decided by the design lane (delegation, process.md rule 4 — veto in chat)

1. **A dialog about a mortal shows that mortal's face.** The Chapter Ledger shows the chapter's mortal, a choice shows the mortal choosing, a beat shows the mortal it is about. One face path: `resolveEntityVisual` with the mortal's knowledge level.
2. **What your act bought shows who it touched.** The act's painting stays the header. The target (a mortal's face, a place's picture, a faction's arms) sits as a medallion before the sentence that names the target.
3. **The court's seats draw their faces through the same path as everywhere else**, so an unknown or unpainted mortal gets the designed tile, not a gradient.
4. **The court speaks in sentences.** "Position / Minimum tier", "Cost", "Insufficient … Required / Available" and "Structure Bonus" become sentences; a title's bonuses and weaknesses show as their own words, not as counts.
5. **The court's two "Coming Soon" rows become quiet empty slots**, one line each, with their `place` and `relic` heading shapes.
6. **World messages (doom stages, a failed Mandate) keep their sphere medallion** and get no new picture. Nothing in the engine sends one a picture today, and new art is out of scope.
7. **The warm-start wait draws the current season's shape** beside the season words. It shows no face: it is a short wait, not a moment.
8. **Settings stays plain** (Law 30). The title draws `settings`; the six section headings draw none, because they are not game ideas. The two emoji become carved shapes: ⏱ → `waiting`, 📌 → `held`.
9. **Headings with no fitting idea draw none** and join Christian's icon pick ([THR-2104](https://linear.app/threadbare/issue/THR-2104)): "Divine Court", "The First", "Apex", "Inner Circle", "Outer Reaches", and the beat's eyebrow. This is the programme doc's rule (S1.2), applied as slices 2–4 applied it.

Decision 2 and the receipt's change shapes follow [slice 4](2026-11-01-thr-2100-art-led-stage.md)'s decisions 4–5 (carved consequence shapes, relic paintings on chips), which the design lane made at 02:15 UTC today. The `Claimable from` hold covers both windows.

## Per-surface dressing

R1 subject art · R2 icons · R3 art tiles · R4 bond strip · R5 highlight · R6 sentences · R7 chips/bars · R8 quiet slot. R4 is N/A everywhere: no dialog shows a tie the engine holds between two parties that the person page does not already draw.

| Surface | Applies | N/A, with reason |
|---|---|---|
| Chapter Ledger | R1 a chip face on each index row; ChapterView opens with the mortal's 3:4 face beside its title. R2 header `chapter-ledger`. R8 the empty list becomes `QuietSlot` | R3: a chapter lists no gains. R5/R6: rows are already one line of words |
| What your act bought | R1 target medallion (decision 2). R2 header `receipt`. R3 a change naming a relic shows its painting; a change with a `category` draws `ICON_FOR_CONSEQUENCE` before its title | R5: the act's band word is already the one emphasis. R6: changes are already sentences |
| A choice | R1 the chooser's face beside the heading. R2 heading `dilemma` | R3: options name no relic. R6: the countdown is a timer, not a fact |
| A beat | R1 the subject's face in `RevealCard.Medallion` when `subjectRef` is a mortal; else as today. Law 14 fix for the raw key | R2: no idea for a beat (decision 9). R3: granted cards are already card art |
| World message | — (decision 6) | R1 met by the sphere medallion. R2: titles are world prose, not concept headings |
| Your court | R1 seat faces (decision 3). R2 `place`, `relic`. R6, R7 (decision 4). R8 (decision 5) | R2: seat headings (decision 9). R5: no one line outranks the seats |
| Warm-start wait | R2 season shape (decision 7) | R1: decision 7 |
| Settings | R2 title, mode buttons (decision 8) | R1, R3–R8: a reference surface on the neutral ramp (Law 30) |

## UI pillar

### S5.1 Faces (R1)

- A new `ledgerRowFace(gameState, row): EntityVisualDescriptor | null` in `threadedChapters.ts` resolves one row's face. ChapterLedger calls it for the rows on the shown page only (`pageRows`), never for the whole archive. The receipt's `targetVisual` is built in `DialogHost` beside the receipt it passes. Both go through `resolveEntityVisual` with the subject's knowledge level. Components draw the descriptor and never pass `graph`, so the gate is not re-opened (slice 4's rule).
- Ledger rows draw `EntityVisual size="chip"` before the template name. `ChapterView` draws `size="portrait"` at `--dialog-subject-portrait-w`, 3:4, left of its title block; it reuses slice 4's `StageSubjectPortrait` if that has merged, else draws `EntityVisual` directly.
- The receipt's closing sentence, which names the target, opens with the target `Medallion size="sm"` holding the descriptor. A target with no visual family draws nothing.
- ChoiceSetModal reads `PendingChoiceData.actorId`; AscendantBeatModal reads `subjectRef` when its kind is `agent`. Both resolve in `DialogHost`, which already holds the graph.
- The court: each `RetinueAgent` seat, the picker and The First's seat draw `EntityVisual` from a descriptor built in `DialogHost` beside `retinueAgents`. The raw `<img>` and gradient fallback go. `RetinueAgent.portraitUrl` stays (the map reads it, `mapViewAdapters.ts:28`).

### S5.2 Heading shapes (R2)

- `Modal.Header` gains `icon?: IconName`, drawn at `chip` size before the title, decorative, in the title's colour (Law 27; styleguide entry, Law 29).
- Add `DIALOG_HEADING_ICONS` to `src/data/view-content.ts`: one row per heading in the table above, value `IconName | null`. Components read the row (Law 58). Export `DIALOG_NO_IDEA_HEADINGS`; a test asserts every `null` row is in it.
- WarmStartOverlay draws `ICON_FOR_SEASON[season]` before the progress line, from the same `deriveSeasonAndYear` call `formatWarmSeason` makes.
- Settings' ⏱ and 📌 become `<Icon name="waiting" />` and `<Icon name="held" />`; their `title` and `aria-label` stay.
- After merge, post `DIALOG_NO_IDEA_HEADINGS` as one comment on [THR-2104](https://linear.app/threadbare/issue/THR-2104).

### S5.3 The receipt's changes (R3)

- A change whose `conceptRefs` name an `attachment` shows the relic's painting as a 40px tile before its title, through `getAttachmentArtUrl(entityId, subcategory)`; no art → no tile.
- A change with `category` draws `ICON_FOR_CONSEQUENCE[category]` before its title. The polarity border stays: the shape says what kind of change, the border and words say which way (Law 31).

### S5.4 The court in sentences (R6, R7, R8)

- Words live in a new `COURT_WORDS` block in `src/data/ui-content.ts`, beside `SCRY_BACK_TO_COURT_LABEL` (Law 43).
- The seat picker's two lines become one sentence; the cost and shortfall become sentences with the `essence` shape (it carries the `ui.essence_panel` tooltip, Law 17). The structure bonus becomes a sentence with the bonus's own words.
- A title's bonuses and weaknesses render as chips of words: green bonus chips and red weakness chips, each with its word (Law 31). The counts go. A weakness chip shows its `description` as written ("Diminished social grace", `scry-content.ts:262`). A bonus's `description` is built as `+${value} to ${target}` (`scry.ts:377`), a numeral and a raw key, so a bonus chip reads its words from a new `TITLE_BONUS_WORDS` table keyed by `BonusRule.target` (`scry-content.ts:218`), not from `description`.
- The structure bonus line reads "In {structure name}, {bonus description, first letter lowered}." using the structure's existing words (`scry-content.ts:52-105`).
- "◇ Coming Soon" becomes `QuietSlot` with one line per row.

### S5.5 The beat's fallback line (Law 14)

`You will learn: {actionId}` becomes the card's display name when the catalog has one ("You will learn Peer Through the Thread."); otherwise the row is dropped and the existing console warning stays.

### Player-facing display

At 1920×1080: the Ledger's index rows open with a small face; a chapter opens on its mortal's face beside the title. The court shows faces in every seat and speaks in sentences. The receipt keeps the act's painting on top and puts the target's medallion before the sentence that names them. Settings looks as it does, with two carved shapes for its emoji.

### Player-facing text

| Surface | Exact text the player reads | Picture / hover | Complaint class | How the player understands it |
|---|---|---|---|---|
| Ledger row | template name, stakes line, "Maren Ashfold · active · step 2" (as today, `threadedChapters.ts:108`) | chip face, alt = name | PC-6 | Same face as her page |
| Ledger empty | "No chapters yet. Weave threads and the world will start writing them." (as today, now in a dashed frame) | none | none | Unchanged words |
| Receipt target | the existing closing sentence, which already names the target: "You spent 4 Heart essence on Maren Ashfold, and the working took four days to resolve." (`technicalSentence`, `DivineReceiptModal.tsx:43-65`; numbers and name illustrative). The medallion sits before it | target medallion, alt = "Maren Ashfold" | PC-6 | Same face as her page; a silhouette there if she is below `recognised` |
| Receipt framing | unchanged, e.g. "It went as you meant it to. The world took the shape you gave it." (`receipt-content.ts:70`) | none | none | Unchanged words |
| ChapterView | template name and stakes line as today | 3:4 face, alt = the mortal's name | PC-6 | Same face and the same silhouette rule as her page and the Ledger row |
| Beat | eyebrow and title as today, e.g. "The world calls" (`AscendantBeatModal.tsx:111-153`) | the subject's face in the medallion, alt = name | PC-6 | Same face as her page |
| Court seats and picker | each seat's name as today | face, alt = name; designed tile, not a gradient, when unpainted | PC-6 | Same face as the mortal's page and the map |
| Choice | "A choice presents itself." (as today) | `dilemma` decorative; chooser face | none | Same heading |
| Beat fallback | "You will learn Peer Through the Thread." | none | PC-1 | A card name, not a key |
| Court seat picker | "The Steward's seat takes a mortal who is Devoted or more." (archetype and tier illustrative) | none | PC-1 | The tier word keeps its tooltip |
| Court cost | "Moving them costs 12 heart essence." | `essence` shape with the existing `ui.essence_panel` tooltip: "Divine Essence — Your power reserve. Spent on Your cards. It flows in every day from your threads, your Seat, the places of power you hold and your aspects." | PC-1 | The essence number was already shown; now it sits in a sentence and the shape explains the word |
| Court shortfall | "You hold 8 heart essence; this needs 12." | `essence` shape, same tooltip | PC-1 | Both numbers in one sentence, replacing "Required: / Available:" |
| Court bonus | "In The High House, top 3 positions cost 1 less essence for tier maintenance." (`scry-content.ts:46, 54`) | none | none | The structure's existing words in a sentence; no "Label:" |
| Bonus chip | green chip "Sharper in their first reach" (`TITLE_BONUS_WORDS.primary_domain`); the others: "Sharper in their second reach", "Closer to your sphere", "Steadier in their seat", "Harder to notice" | tooltip: "This title makes {name} stronger here while they hold it." | PC-1 | A word for what the title helps, no number |
| Weakness chip | red chip "Diminished social grace" | tooltip: "This title costs {name} here while they hold it." | PC-1 | The weakness's own words |
| Empty court rows | "No sacred site is bound to your court yet." / "No divine artifact rests in your court yet." | `place`, `relic` on the headings | none | A plain empty state |
| Warm start | "Autumn, year 3 — catching up to Spring, year 4" (as today) | season shape decorative | none | Unchanged words |

### Event notifications

None.

### Debug inspection

- `openHomedSurface` gains real levers for `chapter-ledger`, `divine-court`, `choice-set` (a fixture choice on the seeded First) and `ascendant-beat` (calls `forceOffering`). `divine-receipt`, `event-popup` and `warm-start` keep their hints: each needs a real act, a doom stage or a reload.
- `DebugOpenHomedSurfaceResult` gains `dressing?: { face: 'art' | 'fallback' | 'none'; headingIcons: string[]; quietSlots: number }`, read from the open dialog's DOM (`data-dialog-face`, `data-dialog-heading-icon`).

### Visual presence (HexMapV2)

N/A. The map is out of scope.

### UI Laws engaged

3, 4, 5, 8, 14, 16, 17, 27, 29, 30, 31, 33, 43, 58.

Screenshot tool: Playwright (DOM surfaces) at 1920×1080 and 2560×1440.

### Playtest signal

A tester who opens the court can say who sits where and what a move costs without reading a label.

## Interface impact

Read sites only; no new cross-system write.

| Contract | Change |
|---|---|
| Chapter Ledger rows ← entity visuals, familiarity | **add read**: `threadedChapters.ts` (`ledgerRowFace`) |
| Dialog host ← entity visuals (receipt target, chooser, beat subject, court seats) | **add read**: `DialogHost.tsx` |
| Receipt changes ← attachment art (`getAttachmentArtUrl`) | **add read**: `DivineReceiptModal.tsx` |
| `Modal.Header`, `DebugOpenHomedSurfaceResult` | **extend**: optional fields |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the read sites in the build PR.

## Engine pillar

N/A. No tick, graph, PRNG, rule or trace change. `threadedChapters.ts` gains one presentation helper, `ledgerRowFace`, built from a node id its rows already carry.

## Content pillar

Encounter templates, prose tables and attachment content: N/A. The authored words are the court sentences, the two empty-slot lines and the beat fallback in § Player-facing text, as `COURT_WORDS` in `ui-content.ts`; the five bonus words and two chip tooltips as `TITLE_BONUS_WORDS` in `scry-content.ts`; and `DIALOG_HEADING_ICONS` in `view-content.ts`. Two of the four structure-bonus descriptions carry a decimal ("+0.1 sphere influence bonus", `scry-content.ts:71`); they stay verbatim here, because rewriting authored data is content work outside a dressing slice.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace | Debug visibility |
|---|---|---|---|---|---|
| `threadedChapters.ts` (`ledgerRowFace`) | none (render-time) | ChapterLedger, ChapterView | none | none | `dressing.face` |
| `DialogHost.tsx` (descriptors) | none | receipt, choice, beat, court | none | none | `dressing.face` |
| `view-content.ts` (`DIALOG_HEADING_ICONS`) | none | all eight | none | none | `dressing.headingIcons` |
| `ui-content.ts` (`COURT_WORDS`) | none | ScryOverlay | none | none | DOM |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `--dialog-subject-portrait-w` | 7rem / 9rem / 9rem (1920 / 2560 / 3440) | Face width in ChapterView; mirrored in `layoutContract.ts` |
| `DIALOG_HEADING_ICONS` | table in § Per-surface dressing | Which shape each dialog heading draws |
| `DIALOG_NO_IDEA_HEADINGS` | court, The First, apex, inner, outer, beat eyebrow | Headings waiting on the icon pick |
| `RECEIPT_RELIC_TILE_PX` | 40 | Relic tile on a receipt change |

## Tracing

N/A — nothing new happens in the simulation to trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| No subject id (choice with no actor, beat with no `subjectRef`) | No face; the dialog draws as today |
| Subject id names a node no longer in the graph (a dead mortal's archived chapter) | The resolver's designed tile with the stored name (Law 4); never a throw |
| Mortal below `recognised` | Silhouette (Law 8) |
| No portrait | The resolver's designed tile (Law 4) |
| Receipt target is not a mortal, place or faction | No medallion |
| Relic has no art | No tile |
| Icon name missing from the registry | Fallback mark, warns once (existing `iconShape`) |
| Bonus or weakness has no words | That chip is dropped (Law 14) |

## Kill criteria

- **At 1920×1080 the court's seats or ChapterView's prose fall below the fold** inside the 85vh cap: lower `--dialog-subject-portrait-w` at the 1920 tier to 5rem; if still below, ChapterView keeps only the chip face.
- **Christian calls the dialogs "busy"**: keep the faces and the court sentences, drop the heading shapes (`DIALOG_HEADING_ICONS` set to `null`).

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. North star "the mortal has to feel like a person" is served by a face on every dialog about one. Non-negotiable #3 (mechanics through prose) is served by the court's sentences.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-01-art-led-dialogs-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | One width token, one tile size; icons and words are data tables |
| 2. Inspectability | PASS | `openHomedSurface(...).dressing` |
| 3. Determinism | PASS | No randomness; fallback tiles are id-hashed |
| 4. Fail-soft | PASS | § Fail-soft table |
| 5. Narrative over mechanical perfection | PASS | The court speaks in sentences |
| 6. Additive over destructive | PASS | Optional fields; the court's raw `<img>` and count lines replaced deliberately |
| 7. Performance budget | PASS | One resolver call per face when a dialog opens |

## Done when

- [ ] The Chapter Ledger, court, choice and beat open with `await window.__DEBUG.openHomedSurface(kind)`, and each reports `dressing.face` of `'art'` or `'fallback'` on the seeded First.
- [ ] Every heading in `DIALOG_HEADING_ICONS` with a value draws its shape; `dressing.headingIcons` lists them.
- [ ] The court renders no "Label: value" line and no bonus or weakness count (a render test scans for `Position:`, `Cost:`, `Required:`, `Structure Bonus:`, and for a bonus chip containing a digit or `_`).
- [ ] A test covers a receipt change naming a relic drawing its painting, and a mortal below `recognised` drawing the silhouette in the Ledger.
- [ ] No dialog prints a raw action id (a test covers the beat fallback).
- [ ] At 1920×1080 and 2560×1440 every one of the eight fits 85vh with nothing below the fold (Law 33).
- [ ] Four-part browser evidence: one 1920×1080 screenshot per dialog the levers reach plus one at 2560×1440, console output, a `dressing` assertion, a UI-Laws judgment line.
- [ ] `npm run gate` green; the THR-2104 comment posted after merge.
- [ ] Closing commit body includes `Fixes THR-2101` on its own line.

## Coordination block

**Suggested model:** opus. Eight surfaces across the dialog host, the court is 960 lines, and the build edits `src/engine/threadedChapters.ts`, so it passes the `review-gate` skill before auto-merge (THR-1691, THR-1949).

**Parallel-safe with:** THR-2098, THR-2099 (Inspector and rail; disjoint files), THR-2104 and THR-1908 (icon picks).

**Mutex with:**
- THR-2100 (Stage moments): both edit `useStageDebugBridge.ts` and `debug-bridge.d.ts`, and this slice may reuse its `StageSubjectPortrait`. Build after it merges.
- Any open ticket editing `ScryOverlay.tsx`, `ChapterLedger.tsx`, `ChapterView.tsx`, `DivineReceiptModal.tsx`, `AscendantBeatModal.tsx` or `hosts/DialogHost.tsx`.

**Files to touch:**
- Edit: `src/components/Game/{ChapterLedger,ChapterView,DivineReceiptModal,ChoiceSetModal,AscendantBeatModal,ScryOverlay,WarmStartOverlay,SettingsPanel}.tsx`, `src/components/Game/hosts/DialogHost.tsx`, `src/components/shared/Modal.tsx`, `src/engine/threadedChapters.ts`, `src/data/view-content.ts`, `src/data/ui-content.ts`, `src/data/scry-content.ts`, `src/components/Game/stage/useStageDebugBridge.ts`, `src/debug-bridge.d.ts`, `src/index.css`, `src/components/shared/layoutContract.ts`, the styleguide, `Docs/design-system/component-selection.md`.

## Notes for the executor

- EventPopup is untouched (decision 6). `PopupItem.art` is never set by any producer (`phaseDoom.ts:408`, `phaseMandate.ts:494`, `unrestPressure/turns.ts:182`); leave the field.
- Do not invent shapes for `DIALOG_NO_IDEA_HEADINGS`.
- `title.bonuses` / `title.weaknesses` are `TitleEffect[]` (`types/scry.ts:95-100`). A weakness chip's label is its `description`; a bonus chip's label is `TITLE_BONUS_WORDS[target]`, never its `description` (which reads "+N to primary_domain"). No chip prints a `value` numeral.
- Tests likely to need updating: the court's render tests, `ChapterLedger` tests, `AscendantBeatModal` text-fallback tests, `styleguideSync.test.ts`.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-11-01. Notes resolved inline after the run: Performance (faces resolved for the shown page only, `ledgerRowFace`); Fail-soft (dangling subject id row); Pillar (Player-facing display subsection added).*

### NFP audit

PASS-with-notes:
- 1 Tunability, 3 Determinism, 5 Narrative, 6 Additive: PASS.
- 2 Inspectability: note. Receipt, world message and warm start keep hint-only levers, so `dressing` cannot be read on them by automation. Accepted: each needs a real act, a doom stage or a reload.
- 4 Fail-soft: note. No row for a dangling subject id. Now added.
- 7 Performance: note. Faces for every archived Ledger row. Now resolved per shown page.

### Three-pillar audit

PASS-with-notes:
- Engine: N/A-with-rationale (one presentation helper in `threadedChapters.ts`, review gate named). Content: present-and-substantive. UI: present-and-substantive.
- Note: no "Player-facing display" subsection. Now added. Blast Radius correctly omitted.

### Vision audit

PASS-with-notes. No contradictions:
- North star: extended. Non-negotiable #3: confirmed. Taste profile "no emoji": confirmed.
- Note: the court's cost and shortfall sentences keep essence numerals. They carry over a number shown today, as card costs do, and are not a new number.

### Intent-judge verdict

2026-11-01. First pass: **Revise**, one GAP on dimension 12 (player legibility): the receipt line, the chip words and tooltips, the essence tooltip and the court-bonus sample were not quoted, and three new face surfaces had no row. All fixed.

Second pass: **Allow** (Reversible). Its one GAP (dimension 3, an executor note contradicting S5.4 on bonus-chip words) is fixed.
