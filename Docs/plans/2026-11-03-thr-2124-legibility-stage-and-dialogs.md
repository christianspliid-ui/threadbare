> **title:** Legibility 3 — the Stage and the dialogs: a title you see first, the stakes as the Now line, one box deep (THR-2124)
> **linear_issue:** THR-2124
> **author:** Claude Code (design lane, unattended, 2026-11-03 — run dl-20261103T0518Z)
> **created:** 2026-11-03
> **three_pillars:** Engine N/A — no file under `src/engine/`, `src/types/` or `src/data/` changes · Content N/A — no sentence, label or tooltip changes · UI done

# Legibility 3 — the Stage and the dialogs (THR-2124)

*On the Stage the encounter's title is the faintest text in its header and the story is smaller than the legend above it. In the dialogs the title is drawn four different ways, and once twice. This slice makes the title the first thing you read, the stakes the second, and draws every dialog title one way.*

## Why this is load-bearing

Christian's period focus (chat, 2026-11-01): *"legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels"*. The closed map [UI legibility and usability](https://linear.app/threadbare/issue/THR-2114) decided one reading order for every core panel. [Legibility 1](https://linear.app/threadbare/issue/THR-2122) shipped the shared blocks; [Legibility 2](https://linear.app/threadbare/issue/THR-2123) (Ready for Dev) does the Inspector. This slice does the Stage and the dialogs. The weekly UX review (comment on this ticket, 2026-11-02) will judge the result on two Stage moments that today fill only the top half of the panel.

Measured on `main` @ `290f9dc3`:

- **The Stage title is a 16 px ghost label.** `EncounterVeil.tsx:2346–2356`: `data-testid="veil-title"` is `FONT_DISPLAY`, `var(--text-xs)`, `letterSpacing: '0.14em'`, uppercase, `TEXT_GHOST` (`--veil-text-ghost`, 5.0:1). The census measured the forecast pill beside it at 12.9:1 ([census § Encounter Stage](../audits/2026-11-01-ui-legibility-census.md)).
- **The stakes line whispers.** `:2425–2435`: `EncounterStakesLine` with `FONT_PROSE`, italic, `var(--text-xs)`, `TEXT_WHISPER` (5.7:1).
- **The story is smaller than the UI.** Scene paragraphs (`:2514–2523`) and the earlier step's answer (`:2500–2504`) are `FONT_PROSE` italic `var(--text-xs)` (16 px); the census measured the forecast legend above them at 18 px.
- **A fourth face.** `FONT_DISPLAY = "'Palatino Linotype', …"` is declared in `EncounterVeil.tsx:396` (22 uses), `NudgePhaseShell.tsx:55`, `NudgeStageHeader.tsx:85`, `OpponentHeader.tsx:36` and `shared/CardFace.tsx:82`. The drop cap (`:2535`) is already em-relative (`3.4em`) but in Palatino.
- **The "fixed 11 px" is an undefined token.** `--text-2xs` is not declared in `src/index.css` (the scale is `--text-xs` … `--text-2xl`, lines 102–107). `var(--text-2xs, 11px)` therefore always draws 11 px (`CardFace.tsx:680, :719, :777` — the rarity word), and bare `var(--text-2xs)` is invalid and inherits (`NudgeStageHeader.tsx:201, :340, :477, :522`, `EncounterVeil.tsx:1414`, `DeltaCluster.tsx:149`). The legend glyph is `LEGEND_GLYPH_PX = 12` (`NudgePhaseShell.tsx:70`) and a card's channel-delta pips are `size={10}` (`CardFace.tsx:662`), both below Law 11's ~14 px floor. The census's 14 px card glyphs are `CARD_COST_PIP_PX` / `CARD_ODDS_PIP_PX` (`CardFace.tsx:146, :148`), named glyph constants at the floor.
- **The step column paints a second surface.** The Stage `Panel level="page"` paints its own background (`Stage.tsx:274`, `Panel.tsx:54`), then the veil's step column (`EncounterVeil.tsx:2237–2243`) and left column (`:248`) each paint `--veil-void` over it. The census counted depth 4: Stage → step column → card → art.
- **Dialog titles are drawn four ways.** `Modal.Header` is Cinzel `--text-lg` (`Modal.tsx:164–166`) — used by Chapter Ledger, Read the Threads, Doom, Mandate, Story beat and the start-page dialogs. The receipt draws its own Cinzel `--text-lg` (`DivineReceiptModal.tsx:114–115`). Settings draws an `<h2>` at `--text-sm` 600 sans (`SettingsPanel.tsx:125–129`). The court draws `<h1 className="text-3xl font-bold">` (`ScryOverlay.tsx:749`), 30 px, off the scale.
- **The choice dialog says its title twice and boxes its story.** `AscendantBeatModal.tsx:517–521`: `RevealCard.Title` (the eyebrow, centred Cinzel `--text-lg`), then `RevealCard.Banner` (the title again, centred 700 in an `inset-well`), then `RevealCard.Quote` (a framed flavour quote). For the "A path opens" beat the eyebrow and the title are the same words.
- **The court's section heads are a third rank.** `ScryOverlay.tsx:796–948`: six `<h2 className="text-sm font-bold uppercase tracking-wider … text-center">`, one of them gold (`:857–861`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Stage frame (`stage/Stage.tsx`) and the veil (`EncounterVeil.tsx`, `encounter-stage/*`) | 🟢 ACTIVE | extends: title, stakes, prose, faces, one surface |
| Card face (`shared/CardFace.tsx`) | 🟢 ACTIVE | preserve layout; faces and the 11 px rarity go to tokens |
| Dialog shell (`shared/Modal.tsx` `Header`) | 🟢 ACTIVE | extends: one title size, optional kind line |
| Stage and dialog debug readers (`useStageDebugBridge.ts`) | 🟢 ACTIVE | extends: `anatomy`, dialog `titles` |

## Decisions this plan builds on

The design lane decided all four under delegation (process.md rule 4) on 2026-11-01. Each passed its veto window with no veto.

- [Panel anatomy](https://linear.app/threadbare/issue/THR-2117/panel-anatomy-one-reading-order-that-every-core-panel-follows) ([audit](../audits/2026-11-01-ui-panel-anatomy.md)): § 2, the Stage and dialog orders; § 4, what sits above the fold.
- [Type hierarchy](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) ([audit](../audits/2026-11-01-ui-type-hierarchy.md)): § 3.1, the Title at `--text-xl` in dialogs and on the Stage and a card name as Headline; § 3.3, the Stage and Dialogs rows.
- [Text positions](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit) ([audit](../audits/2026-11-01-ui-text-positions.md)): § 2, one left edge; the choice dialog's centred title moves left; centred text stays only on ceremonies and the start page.
- [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) ([audit](../audits/2026-11-01-ui-modules-and-composition.md)): § 3, frames to depth ≤ 2, and the Stage's step column and the choice dialog's inner panel lose their frames.

**Decided in this plan** (by the lane, under the same delegation, as consequences of the decisions above):

1. **Palatino goes by role.** A use at `--text-lg` or above (the drop cap, a card name) takes `--font-display` (Cinzel). Every smaller use takes `--font-body` (Alegreya Sans). The five `FONT_DISPLAY` constants are deleted. *Would change it:* a playtest saying the Stage lost its period feel; the answer then is the Story face, not a fourth face.
2. **`--text-2xs` is not added.** Every use becomes `--text-xs`, the floor. The type scale stays six steps (Type hierarchy § 3.1).
3. **The Stage's primary text is `--veil-text-bright`** (9.5:1), the veil's own primary. Title and stakes take it; scene prose keeps `--veil-text-warm`, the Story colour.
4. **One surface on the Stage.** The Stage panel paints `--veil-void` when it hosts the veil, and the veil's columns paint nothing. The in-place veil (no Stage) keeps its own void, because there it is the surface.
5. **Every dialog title is `Modal.Header`.** Settings and the court move onto it. `Modal.Header` gains an optional `kind` line (the label rule) above the title, which the choice dialog uses for its eyebrow. An eyebrow equal to the title (case-insensitive) is not drawn. The receipt keeps its art band, so it keeps its own title line at the same size.
6. **The choice dialog drops the Banner and the Quote frame.** Who is `Modal.Header` (eyebrow as kind, beat title as title). Now is the beat's prose as unframed Story, left-aligned, `--measure-prose`. The cards are Detail. "Let it pass" stays last. `RevealCard` itself is unchanged; the ceremonies keep their centred display lines.

## UI pillar

Screenshot tool: Playwright (DOM; the Stage's map window is WebGL but nothing on it changes).

### S1 — Stage header: Who first (`EncounterVeil.tsx`)

1. `veil-title`: `fontFamily: 'var(--font-display)'`, `fontSize: 'var(--text-xl)'`, `color: 'var(--veil-text-bright)'`, no `letterSpacing`, no `textTransform`. The reading marks, narrate button and `StageLabelIcon` stay in the row.
2. The aftermath title (`aftermath-encounter-title`, `:986–994`, the same ghost uppercase style today) takes the same treatment.
3. The stakes line (`:2426–2435`): `fontFamily: 'var(--font-body)'`, upright, `fontSize: 'var(--text-sm)'`, `color: 'var(--veil-text-bright)'`, `marginBottom: 'var(--space-6)'`. Its gold name links stay. The subtitle fallback below it takes the same style. A `data-stage-now` attribute marks it.

### S2 — Stage story text

1. Scene paragraphs (`:2514–2523`): `font: 'var(--type-body-prose)'` (20 px upright Alegreya, 1.6), `color: TEXT_WARM`, `maxWidth: PROSE_MEASURE`, `marginBottom: 'var(--space-3)'`.
2. The earlier step's answer prose (`:2500–2504`) is a quoted line: `font: 'var(--type-flavor)'`, `TEXT_WHISPER` unchanged.
3. The drop cap keeps `3.4em` and takes `--font-display` (decision 1). At 20 px prose it draws 68 px.

### S3 — faces and the floor

1. Delete `FONT_DISPLAY` in `EncounterVeil.tsx`, `NudgePhaseShell.tsx`, `NudgeStageHeader.tsx`, `OpponentHeader.tsx` and `CardFace.tsx`; map each use per decision 1. A card name on the card face (`CardFace.tsx:605`) is the Headline: `--font-display`, `--text-lg`.
2. Every `var(--text-2xs…)` in `src/components` outside `debug/` becomes `var(--text-xs)` (decision 2).
3. `LEGEND_GLYPH_PX` (12) is deleted; the legend glyphs use `fontSize: 'var(--text-xs)'`, the size of the legend words beside them (Law 11). The channel-delta pips on the card face (`CardFace.tsx:662`, `size={10}`) take `CARD_ODDS_PIP_PX`. The card's 14 px price and odds pips (`CARD_COST_PIP_PX`, `CARD_ODDS_PIP_PX`, `:146–148`) are glyph constants at the floor and stay.
4. Letter-spacing on the Stage labels this slice touches goes; others stay (no blanket sweep).

### S4 — one surface (decision 4)

1. `Stage.tsx` takes the veil's surface: when the `right` content is the veil's step column, the panel style gets `background: 'var(--veil-void)'`. The executor picks the seam (a `surface` field on `EncounterVeilFrame`, or a `data-` check); the rule is that the void still shows and only one element paints it.
2. `veil-step-column` and `veil-left-column` drop `background`. `InPlaceVeilFrame` (`:208`) keeps it.

### S5 — dialogs: Who once, left edge

1. `Modal.Header`: `fontSize: 'var(--text-xl)'`. New optional `kind?: string`: rendered above the title as the label rule (`--text-xs`, 700, `--text-tertiary`), in a column with the title. No `kind` → as today.
2. Settings (`SettingsPanel.tsx:222–240`): the custom header becomes `<Modal.Header onClose={onClose} icon={settingsIcon}>Settings</Modal.Header>`. `headerStyle` and `headerTitleStyle` are deleted. The close button's label becomes the header's "Close".
3. Court (`ScryOverlay.tsx:747–762`): the `<h1>` header becomes `Modal.Header` with `onClose`. Its six section `<h2>`s become `SectionLabel` (label rule, `gold={false}`, left-aligned); the portrait grids below them keep their centring.
4. Receipt (`DivineReceiptModal.tsx:114–115`): the title line becomes `--text-xl`. The art band and band word stay.
5. Choice (`AscendantBeatModal.tsx:506–531`), decision 6: `<Modal.Header kind={eyebrowOrNull}>{title}</Modal.Header>` above the scroll region; inside, the prose as `<p>` with `font: 'var(--type-flavor)'`, `color: 'var(--text-secondary)'`, `maxWidth: 'var(--measure-prose)'`, left-aligned, marked `data-dialog-now`; then the card rows. `RevealCard.Frame`, `.Title`, `.Banner`, `.Quote` are no longer used here. `frame-ceremonial` on the panel stays.
6. Read the Threads: `PreReadState`'s intro paragraph (`ReadTheThreadsPanel.tsx:302–306`, `--text-sm` italic secondary) is the Now line — upright, `--text-primary`, `data-dialog-now`.

### S6 — debug readers

1. `getStage()` gains `anatomy: { titleSizePx: number; titleIsLargestHeaderText: boolean; fold: { title: boolean; now: boolean | null; firstSceneLine: boolean | null; firstHandRow: boolean | null; commit: boolean | null } }`, read off the open panel's DOM like `dressing`. A fold value is true when the element's top edge lies inside `[data-stage-panel]`'s visible rect; `null` when absent. `titleIsLargestHeaderText` compares computed font sizes of the title row, the context strip and the stakes line.
2. The dialog dressing (`dialogDressing`, `useStageDebugBridge.ts:97`) gains `titles: number` (count of `[data-dialog-title]`, which `Modal.Header` and the receipt title set) and `titleAlign: string` (the first title's computed `text-align`).
3. `src/debug-bridge.d.ts` documents both.

### Player-facing display

The encounter's name now heads the Stage in large Cinzel, the brightest text in its header. The sentence saying what is at stake sits under it in plain upright text. The story reads at the size of story text elsewhere, upright, under a larger drop cap. The Stage stops painting a dark box inside itself. Every dialog's title reads the same: left edge, one size. The choice dialog says its title once and its story is no longer in a box.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Stage, every moment | Unchanged words (e.g. "The Unsafe Bridge"); size, face, colour and case change | PC-6 (the same fact shown the same way) | The title reads first, the stakes second |
| Stage scene prose | Unchanged story text; 16 px italic becomes 20 px upright, under a 68 px Cinzel drop cap | PC-6 | The story reads as story, larger than the labels around it |
| Stage hand and choice cards | Unchanged card names (e.g. "Balm"); Palatino 18 px becomes Cinzel `--text-lg`; the rarity word ("Storied") rises from 11 px to 16 px | PC-6 | The name is the card's headline; the rarity word is readable |
| Choice dialog | The eyebrow ("A path opens") is no longer drawn when it repeats the title; the story loses its box | PC-6 | One title, then the story, then the cards |
| Settings | "Settings" — from an 18 px sans heading to the 26 px Cinzel dialog title | PC-6 | It reads as a dialog title, the same as every other dialog |
| Divine Court | "Divine Court" — from 30 px bold to the 26 px dialog title; section heads such as "The First" go from centred gold capitals to the ordinary left-aligned label | PC-6 | One title; the sections read as sections, and gold stays on the god's own marks |
| Divine receipt | Unchanged act name in the art band, 22 px to 26 px | PC-6 | The receipt's title matches the other dialogs |
| Read the Threads | Unchanged intro sentence; italic secondary becomes upright primary | PC-6 | The question the dialog asks reads as its Now line |

No words are written or removed beyond that repeated title. Every other row is a change of size, face, colour or position.

### UI Laws engaged

Law 1 (identity chips unchanged), Law 11 (legend glyphs rise to the floor), Law 13 (no numeral added), Law 17 (tooltips untouched), Law 21 (stakes-line links unchanged), Law 27 (heading icons still in the title's colour), Law 31 (the court's gold heading goes; gold stays on names and the god's marks), Law 33 (anatomy § 4 fold at 1920×1080), Law 37 (the title row is still the fixed chrome across steps), Law 38 (scene → test → hand → fate order unchanged), Law 45 (title 9.5:1, up from 5.0:1), Law 57 (Stage and dialog geometry unchanged).

### Playtest signal

A tester names the encounter before describing its art, and can say what is at stake without rereading. The UX review's two Stage moments (first encounter, mid-game arrival) fill more of the panel's height.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

There are no new events and nothing changes on the map. Debug: `getStage().anatomy` and the dialog dressing's `titles` / `titleAlign` (S6). No Blast Radius section is owed: `shared/Modal.tsx` has 22 importers and `shared/CardFace.tsx` 12 (`grep -rlE` over `src`), both under 100.

## Canon pillar (lands in the same PR)

1. **`Docs/design-system/typography.md`** § The ladder: the Stage row (title Cinzel `--text-xl` `--veil-text-bright`; stakes Text; prose `--type-body-prose`), "no fourth face: Palatino is retired", and "`--text-2xs` does not exist; the floor is `--text-xs`".
2. **`Docs/design-system/layout-zones.md`** § Stage and § Dialogs: the anatomy § 2 orders, `Modal.Header` as the one dialog title, and the kind line.
3. **`Docs/design-system/layout.md`** § Frames: "a hosted column paints no surface inside its host" with the Stage as the example.

## Engine pillar

N/A. Every change is in `src/components/` and canon. No file under `src/engine/`, `src/types/` or `src/data/` changes, so the review gate's engine and types scope does not apply (THR-1949).

## Content pillar

N/A. No sentence, label or tooltip is written. The only text change is that a repeated title is drawn once.

## Interface impact

| Contract | Disposition |
|---|---|
| `StageVM` → `Stage` / veil | preserve: same fields read |
| `Modal.Header` props | extend: optional `kind` |
| `getStage()`, `openHomedSurface()` dressing | extend: `anatomy`, `titles`, `titleAlign` |

No cross-system read or write is added. `Docs/canon/interface-map.md` is unchanged.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| veil, Stage, card face, `Modal.Header`, five dialogs | none | Stage moments; Ledger, Read the Threads, receipt, court, settings, choice | none | none | `getStage().anatomy`; dialog `dressing.titles` / `titleAlign` |

The executor updates the Design Reference Wiki pages whose `sources` include the touched components; this change is not behaviour-neutral.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| Stage / dialog title | `--text-xl` (26 px) | existing token (Type hierarchy § 3.1) |
| Stakes line | `--text-sm`, `--veil-text-bright` | existing tokens |
| Scene prose | `--type-body-prose` | existing shorthand (20 px / 1.6) |
| Drop cap | `3.4em` | unchanged; now of 20 px prose |
| Stakes-to-scene gap | `--space-6` | existing token; between-block distance |
| `FONT_DISPLAY` ×5, `LEGEND_GLYPH_PX` | deleted | replaced by tokens |

## Tracing

N/A — a presentation change; nothing new happens in the simulation.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| No stakes line and no subtitle | The Now slot is empty; nothing is drawn in its place |
| A beat with no eyebrow | `Modal.Header` without `kind`, as today |
| A fold target absent when `getStage()` reads | its `fold` value is `null`, never a throw |
| A card name too long at `--text-lg` | it wraps to two lines (card height is already flexible); see kill criteria |

## Kill criteria

- If at 1920×1080 on `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge` any of `getStage().anatomy.fold.{title, now, firstSceneLine, firstHandRow, commit}` is `false`, the drop cap drops to `2.4em` and the stakes margin to `--space-3`. If one is still `false`, the prose size change is left out of the PR and the slice goes back to the design lane with the measurement.
- If a card name at `--text-lg` wraps to three lines on any card in the census routes, card names take Text 700 `--text-sm` instead (the Type hierarchy's "options' names Text 700") and the PR says which.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar present (S1–S6 plus canon)
- [x] Wiring connects them (one row, the wiki pages)

## Vision audit

- [x] No Vision premise is contradicted. Prose-first UI holds and grows: the story is bigger and upright, and no number is added (vault `Vision/taste-profile.md`, "Prose-first UI, no numbers visible"). Art-led R1 holds: the art column is untouched.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-03-thr-2124-legibility-stage-and-dialogs-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Five face constants and one sub-floor px constant become tokens |
| 2. Inspectability | PASS | `anatomy` and dialog `titles` reach the debug bridge |
| 3. Determinism | PASS | No simulation input |
| 4. Fail-soft | PASS | Fail-soft table above |
| 5. Narrative over mechanical perfection | PASS | The story and the stakes read before the mechanics |
| 6. Additive over destructive | PASS with note | `Modal.Header` gains an optional prop; two custom headers and two RevealCard zones in one dialog are replaced, as decided |
| 7. Performance budget | PASS | DOM reads run only inside the existing debug readers |

## Done when

- [ ] `grep -rn "Palatino" src/components/Game/EncounterVeil.tsx src/components/Game/encounter-stage src/components/shared/CardFace.tsx` prints nothing; `grep -rn "text-2xs" src/components --include=*.tsx | grep -v -e /debug/ -e __tests__` prints nothing; `grep -c LEGEND_GLYPH_PX src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` prints 0.
- [ ] A new test, `src/components/Game/__tests__/stageDialogAnatomy.thr2124.test.tsx`, asserts: (a) a rendered veil's `veil-title` has `fontFamily` `var(--font-display)`, `fontSize` `var(--text-xl)` and no `textTransform`; (b) the stakes line is upright at `var(--text-sm)`; (c) scene paragraphs use `var(--type-body-prose)`; (d) `veil-step-column` has no inline `background`; (e) `Modal.Header` renders at `var(--text-xl)` and draws its `kind` line before the title; (f) `AscendantBeatModal` for the path-opens beat renders exactly one `[data-dialog-title]`, no `reveal-banner` and no `reveal-card-frame`; (g) `SettingsPanel` and the court render their titles through `[data-dialog-title]`.
- [ ] Existing Stage, veil, card-face and dialog tests pass, updated only where they pinned old sizes, faces or the Banner.
- [ ] Browser evidence (UI pillar, larger visible change). At 1920×1080: the Stage on the route above, the Chapter Ledger, Read the Threads and Settings. One 2560×1440 Stage screenshot. Console output with no new errors. A `__DEBUG` assertion: `(await __DEBUG.getStage()).anatomy` has `titleIsLargestHeaderText === true` and no `fold` value `false`; for `openHomedSurface('chapter-ledger')`, `('divine-court')` and `('ascendant-beat')`, `dressing.titles === 1` and `dressing.titleAlign !== 'center'`. Settings has no homed-surface lever: open it from its top-bar control and read the same two values off the DOM (`document.querySelectorAll('[data-dialog-title]').length === 1`, computed `text-align` not `center`). No lever is added, so `HomedSurfaceKind` is unchanged. A frame-depth measurement of the Stage (THR-2120 § 3 counting, as Legibility 2 does) ≤ 2. A UI-Laws judgment line for Laws 1, 11, 13, 17, 21, 27, 31, 33, 37, 38, 45, 57.
- [ ] The three canon files carry the edits listed under Canon pillar.
- [ ] `npm run gate` is green.
- [ ] The closing commit body has the close keyword for this ticket on its own line.

## Coordination block

**Suggested model:** opus. The veil is 4,160 lines and the fold reader has to measure layout.
**Parallel-safe with:** [Legibility 2 — Inspector pages](https://linear.app/threadbare/issue/THR-2123) (no shared file), [The pool says how full it can get](https://linear.app/threadbare/issue/THR-2148) (god rail only).
**Mutex with:** [The answer comes here](https://linear.app/threadbare/issue/THR-2151) — both edit `EncounterVeil.tsx` and the Stage frame. [Every card says what it buys](https://linear.app/threadbare/issue/THR-2147) — both edit `shared/CardFace.tsx`. Anything else editing `EncounterVeil.tsx`, `encounter-stage/shells/*`, `stage/Stage.tsx`, `shared/Modal.tsx` or the five dialogs named in S5.

**Files to touch:**
- Create: `src/components/Game/__tests__/stageDialogAnatomy.thr2124.test.tsx`.
- Edit: `src/components/Game/{EncounterVeil,AscendantBeatModal,DivineReceiptModal,ScryOverlay,SettingsPanel,ReadTheThreadsPanel}.tsx`, `src/components/Game/encounter-stage/{OpponentHeader,shells/NudgePhaseShell,shells/NudgeStageHeader}.tsx`, `src/components/Game/stage/{Stage,useStageDebugBridge}.tsx|ts`, `src/components/shared/{CardFace,DeltaCluster,Modal}.tsx`, `src/debug-bridge.d.ts`, `Docs/design-system/{typography,layout-zones,layout}.md`, the matching Design Reference Wiki pages.

## Notes for the executor

- Line numbers are from `main` @ `290f9dc3`; THR-2151 and THR-2147 will move them. Anchor on the test ids.
- The MeetTheFirst and Remembrance beats also carry Palatino (`SparkBeat.tsx`, `SensingBeat.tsx`, `StirringBeat.tsx`, `TransformationBeat.tsx`). They are ceremonies, not this slice; leave them.
- The court's portrait grids stay centred; only their headings move to the left edge.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability, Inspectability, Fail-soft, Narrative and Performance PASS; Determinism N/A (presentation only). Note: Additive over destructive — two custom headers and two RevealCard zones in one dialog are replaced and Palatino is retired, all stated as decided.

**Answer:** those are the decided rules (Text positions § 2, Modules § 3, Type hierarchy § 3.3); the only API change is an optional prop.

### Three-pillar audit

PASS-with-notes. Engine and Content N/A with rationale; UI present and substantive (S1–S6, player text, Laws, debug). Notes: the Event notifications / Visual presence subsection was missing, and Blast Radius was unverified for the shared Modal and CardFace.

**Answer:** the subsection is added under the UI pillar; importer counts are measured there (22 and 12, both under 100), so no Blast Radius section is owed.

### Vision audit

PASS. No contradiction with any premise. Prose-first UI and no-numbers hold; the Palatino-to-Cinzel/Alegreya change is a feel risk with a stated reversal condition, not a premise breach.

### Intent-judge verdict

**Revise** on the first run (2 GAPs): the player-facing text table missed six changed surfaces, and the Done-when named a `ledger` lever and a `settings` lever that do not exist. Both fixed (rows added; `chapter-ledger`, `divine-court`, `ascendant-beat`; Settings read off the DOM). **Allow** on the re-run, 0 findings, impact class Reversible (judge-confirmed).
