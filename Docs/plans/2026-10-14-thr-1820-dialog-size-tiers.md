> **title:** Dialogs grow before they scroll — four size tiers and Law 57 — THR-1820
> **linear_issue:** THR-1820
> **author:** Claude Code (design session, 2026-10-14, from the attended groundwork session's shared brief)
> **created:** 2026-10-14
> **three_pillars:** Engine `N/A — presentation only; one UI-consumed constant in an engine file changes value, nothing in the tick reads it` · Content `N/A — no authored content; two static UI lines added, two truncation strings disappear` · UI `done — size tokens, Modal/RevealCard size prop, SheetColumns, Law 57, migration list, a debug report; Playwright DOM`

# Dialogs grow before they scroll — four size tiers and Law 57 — THR-1820

*Every dialog picks one of four sizes (S · M · L · XL) that scale with the 1440p contract, and a new UI law says a panel grows to its size limit before it scrolls or cuts a list short.*

## Why this is load-bearing

The 2026-10-11 UI review measured the game at 2560×1440 and found panels that scroll or cut a list while most of the screen is empty. Christian's words: *"ensure we actually use the screen real estate and not end up with under sized dialogues that push us to scroll"*. The evidence in the issue: the hex column lists five places, then "and 24 further places besides", with ~600 px of empty column under it; the agent column scrolls a 14-row list; the location sheet opens at the 600 px default with 900 px of screen unused; the encounter aftermath sits in a 540 px column on a 2560 px screen.

Two things cause this, and both are measured on `origin/main` at `3cf81086`:

1. **Widths are free numbers.** `Modal` takes `maxWidth?: number` (`src/components/shared/Modal.tsx:25`), defaulting to 600 (`:62`, `:84`), drawn as `width: '90%'` under that cap with `maxHeight: '75vh'` (`:68-70`). There are **17 `maxWidth=` attributes in 17 files** under `src/components/` (0 in tests), holding ten different fixed widths (420, 480, 520, 560, 700, 720, 760, 780, 960, plus the 600 default) and one computed width (`AscendantBeatModal.tsx:238-241,458-460`, 600–1008). None of them changes at 2560. `DetailModal` adds its own per-kind sizes (`src/types/detailPage.ts:25-63`, 720×620 and 800×720), and the hand-built overlays add more (`min(32rem, 92vw)`, `min(28rem, 90vw)`, `max-w-md`, `max-w-2xl`, `max-w-4xl`).
2. **No rule says when a panel may scroll or cut a list.** Law 33 says panels scroll internally and modals cap at 85vh; Law 36 says long lists go progressive. Neither says a panel must first use the room it has. So `HexDetailView` cuts places at `HEX_DETAIL_MAX_LOCATIONS = 5` (`HexDetailView.tsx:21,92`), `RevealCard` cuts consequence chips at `REVEAL_CONSEQUENCE_CHIP_MAX = 4` into a `+N` chip (`RevealCard.tsx:36,154`), and the Divine Court's pickers scroll inside a 384 px box (`ScryOverlay.tsx:304,475`, `max-h-96`) in an overlay that has the whole screen.

Most of the issue's evidence surfaces are retired by the Inspector (THR-1827) or move to the Stage (THR-1829). This plan does not re-decide them. It gives every surface that **keeps a dialog home** a size from one vocabulary, gives every container (dialog, Inspector, Stage, rails) one law about when it may scroll, and makes the free width a counted debt that can only go down. The Inspector, the Stage and the new frame are built on these tiers and this law from day one (brief rule 10).

## Settled input (not re-opened)

| Source | What it fixes for this plan |
|---|---|
| Groundwork brief, attended session 2026-10-14 (Christian present) | 2560×1440 primary, 1920×1080 the floor, 3440 extra width only; three `min-width` blocks at 1920 / 2560 / 3440; root 16 → 18 px at ≥ 2560; **one modal height rule, 85vh**; one UI-debt ratchet owned by THR-1821; **containers are not modal tiers**; the new law **ratified by Christian in chat 2026-10-14** (human gate satisfied via chat review 2026-10-14) |
| `Docs/audits/2026-10-11-thr-1827-inspector-decision.md` (Christian "yes" to 18 calls) | The Inspector docked ≈ 28vw (560 / 717), wide ≈ 50vw (960 / 1280), Full on request; it retires the detail column, the profile and sheet modals, `DetailModal`, the `location` / `hex-zoom` views, the ActionDrawer subject hand and `LiveLocationBar`; Doom, Mandate, Omen, the Codex, the Chapter Ledger, Settings and the Notables list keep their own homes; call 9: "Wide and full open every group (THR-1820's no-truncation rule)"; Full's page is two columns |
| `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md` | God rail 320 / 400, Ledger rail 340 / 420, strip 56, top bar 48 / 56; the Needs-you drop-down (~440 px, capped at 60vh); Chapter Ledger launcher becomes a Chronicle tab that "still opens the existing Chapter Ledger reader" |
| `Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md` | Three homes for a moment: **the Stage** (encounters, story beats, journey moments, undertaking moments, premonitions, the emergence dilemma), **a dialog** (gifts and offerings, receipts, effect choice sets, popups, the Chapter Ledger, omen/doom/mandate, the Divine Court), **full-screen ceremony** (Meet the First, the Threading Rite's full and short shapes, the Remembrance); the Stage panel is about 1270 × 984 at 1080p and 1590 × 1336 at 1440p |
| `Docs/audits/2026-10-13-thr-1833-type-system-decision.md` | 16 px floor; prose one size step above UI text ("THR-1819 sets it") |
| UI Laws 26, 29, 33, 34, 35, 36, 49, 50 | Surface chosen by what the player must do; a primitive lands with its styleguide entry and selection row; one viewport; safe centering; z-bands from the table; progressive lists; coalesced counts; focus follows the surface |

**What this plan takes from THR-1819.** THR-1819's plan was written in parallel and merged while this one was in review (`Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`); the numbers below are the brief's and the names are that plan's, checked against its merged text.

- **The tiers and their blocks.** `base` (< 1920), `fhd` (≥ 1920), `qhd` (≥ 2560), `uwqhd` (≥ 3440): `:root` plus three `@media (min-width: …)` blocks in `src/index.css`. The size tokens below are declarations added to those blocks; this plan adds no `@media` rule of its own.
- **Two token families.** Frame geometry is px, restated in every tier block; text containers are rem, declared once, so they step with the root. This plan follows the same split: S and M are text containers (rem), L and XL are frame-scale (px per tier).
- **The root step-up.** 112.5 % (18 px) at ≥ 2560 wide and ≥ 1200 px tall. Everything in rem scales ×1.125.
- **`--modal-max-h: 85vh`**, the one modal height rule, which THR-1819 applies to `Modal.tsx:70` (75vh today). Every tier reads it; this plan adds no second 85vh value.
- **`--panel-padding`** stays 1.25rem from 1920 up (20 px, then 22.5 px after the root step); `Modal.Header` / `Modal.Body` already read it.
- **Type.** `--text-base` (story prose) becomes 20 px at 1080p and `--measure-prose` is 34em; used below only to check the S width.
- **The layout-contract module and its parity test** (`src/components/shared/layoutContract.ts`: `FRAME_TOKENS_PX` per tier, `TEXT_TOKENS_REM` once). The size tokens join those tables so one test pins CSS and TS together.
- **Not consumed:** the frame tokens (`--rail-left-w`, `--rail-right-w`, `--inspector-w`, `--inspector-wide-w`, the Stage tokens). They are cited only to check that L sits beside the Stage panel (derived 1272 / 1592 / 1592 in THR-1819's plan) and the Inspector at a sensible scale.

## Substrate inventory

Presentation-only plan; the substrate is UI primitives. Grep evidence at `3cf81086`: `<Modal` callers in 24 files, `maxWidth=` in 17, `fixed inset-0` overlays in 9 files plus `absolute inset-0 … z-` overlays in 5.

| Existing subsystem | Status | This plan |
|---|---|---|
| `Modal` (`src/components/shared/Modal.tsx`, 24 importers) | 🟢 ACTIVE | **extends** — a `size` prop replaces free `maxWidth` (kept, deprecated); a `data-dialog-size` attribute; provides the sheet-layout context |
| `RevealCard` (`src/components/shared/RevealCard.tsx`) | 🟢 ACTIVE | **extends** — `size` prop; the `+N` consequence cap retires (Law 57) |
| Dialogue contexts registry (`src/components/shared/dialogContext.ts`, THR-1586) | 🟢 ACTIVE | **pattern reused** — the new size registry mirrors its surface → value list and its `__DEBUG.getDialogContexts()` accessor |
| `useEscapeLayer`, `useDialogFocus` | 🟢 ACTIVE | preserved — unchanged |
| `DetailModal` + `DetailModalStackContext` (THR-1490) | 🟢 ACTIVE | **untouched here; retired by THR-1827's build** (its per-kind sizes are not migrated) |
| `Dropdown` (anchored flyouts) | 🟢 ACTIVE | preserved — flyouts are not dialog tiers; Law 57 binds their own limits |
| UI-debt ratchet (THR-1821, not yet built) | ⚪ PLANNED | **extends** — this plan supplies one counted row, `modal-maxwidth`, and its baseline |

## Engine pillar

Engine: N/A — presentation only. No tick phase, graph node, edge, trace or PRNG call changes. One UI-consumed constant that lives in an engine file changes value: `CHAPTER_LEDGER_PAGE_SIZE` in `src/engine/chapterArchive.ts:61` goes from 25 to 40 (see § Migration list, Chapter Ledger). Its only reader is `ChapterLedger.tsx:197-201`; nothing in the tick reads it.

## Content pillar

Content: N/A — no authored content (no encounter, prose table, attachment or data-table change). Two lines of static UI copy are added, both in `src/data/ui-content.ts` with no enrichment tokens: the Chapter Ledger's fail-soft line "This chapter has no record to show yet." (slice 1) and the Divine Court picker's "Back to the court" (slice 2, THR-1880). Two truncation strings stop appearing on surfaces this plan touches (the `+N` consequence chip and its `"N more"` title in `RevealCard`); the Inspector build retires the third ("and N further places besides"). See § Player-facing text.

## UI pillar

*Screenshot tool: Playwright (DOM). Every surface here is DOM; no WebGL.*

*UI Laws engaged: 26 (choose the surface by what the player must do), 29 (new primitive lands with styleguide entry and selection row), 33 (one viewport, 85vh), 34 (safe centering), 35 (z-band from the table), 36 (progressive lists), 49 (coalesced counts are not truncation), 50 (focus follows the surface), and the new Law 57.*

### 1. The law — Law 57

Next free number in `Docs/design-system/laws.md` is **57** (the book ends at 56). It enters as **[E]**, ratified by Christian in chat 2026-10-14, in a new section XV (laws are numbered in order of adoption; 55 and 56 also opened their own sections). This docs PR adds it, plus a one-line cross-reference under Law 36. Final text:

> **57. [E] A panel grows to its size limit before it scrolls or truncates.** While a panel still has room to grow, it shows its content whole: no "and 24 more", no list cut at a fixed count, no scroll box shorter than the panel it sits in, no strip that scrolls sideways. It grows first. Only at its size limit do long lists go progressive (Law 36): grouped, counted on the header, folded, with the rest one click away.
> - **The limit is the container's own.** A dialog's limit is its size tier (S · M · L · XL) and the 85vh height cap. A surface picks the tier its content needs, never a free width. The Inspector's limit is the size the player chose (docked, wide or full); it never widens itself (THR-1827). The Stage's and the rails' limits are their frame geometry (THR-1828, THR-1829).
> - **Order with Laws 33 and 36.** Law 33 keeps scrolling inside the panel and never on the page. Law 36 says what a long list becomes. This law says *when*: after the panel has grown to its limit, not before.
> - **Not in membership.** The hover tier (tooltips and hover cards are summaries by design and lead deeper, Law 20) and counts that coalesce a queue (Law 49).
> - Ratified by Christian in chat 2026-10-14 (THR-1820). Source: the 2026-10-11 UI review at 2560×1440 — *"ensure we actually use the screen real estate and not end up with under sized dialogues that push us to scroll"*. Tier values: `Docs/plans/2026-10-14-thr-1820-dialog-size-tiers.md` § 2, and `tokens.md` § Dialog sizes once the build lands.

**How it relates to the existing laws.** Law 33 stays as it is: internal scroll is still the only scroll. Law 57 makes internal scroll the *last* resort, after growth. Law 36 stays as it is: a list that is too long is grouped and folded. Its sentence *"a panel that needs its own scrollbar within the first screenful of items should be collapsing groups instead"* now reads with Law 57 in front of it: the "screenful" is the panel at its limit. Law 36's "within a session" clause is already superseded by Law 51; nothing here changes that.

**What the law means for the sibling containers** (consequences, not new decisions):

| Container | Its limit | What Law 57 asks of its build |
|---|---|---|
| Dialog (this plan) | its size tier × 85vh | no inner scroll box, no fixed-count cut, until the panel is at the cap |
| Inspector docked / wide / Full (THR-1827) | the size the player chose | docked sorts then folds big groups (call 9); under Law 57 a group folds only when showing it whole would push the page past the docked column's height. Wide and Full open every group (call 9 already cites this rule). The land page's "In this land" is never cut by count |
| Stage (THR-1829) | the panel's frame geometry | the scene column may scroll at the panel's height (the decision says so); the veil's 540 px aftermath blocks (`EncounterVeil.tsx:911…3869`) do not survive the move |
| God rail hand, Ledger rail (THR-1828) | rail width × the rail's free height | the hand scrolls inside itself only when it fills the rail (the decision says so); Threads sections fold at the rail's height |
| Needs-you drop-down (THR-1828) | ~440 px × 60vh | the list fills its 60vh cap before the "and N earlier, in the Chronicle" row replaces the rest. `NEEDS_YOU_NEWS_MAX` must be large enough that the cap, not the count, is reached first at 2560×1440 (60vh = 864 px, so at least 20 rows) |
| Anchored flyouts (Notables, Rivals) | their own cap (`NOTABLES_PANEL_MAX_HEIGHT` 70vh) | lawful as they are: they scroll only at that cap |

### 2. The four size tiers

Width per tier at each screen; every tier caps its height at **85vh** (918 px at 1080, 1224 px at 1440). Values below 1920 equal the 1920 values (out of scope; the gutter clamp keeps any narrower window safe).

| Tier | 1920×1080 | 2560×1440 | 3440×1440 | Height | Why this width |
|---|---|---|---|---|---|
| **S** | 600 (37.5rem) | 675 | 675 | auto, ≤ 85vh | One column of prose. Rem, declared once, so it steps with the type. 600 is today's `Modal` default, so every default caller is unchanged at 1080p. 600 − 2 × 20 padding = 560 px of text, about 60 characters of 20 px Alegreya (`--text-base` after THR-1819); at 2560 the same 60 characters, because width and type both step ×1.125. Shorter than `--measure-prose` (680 px) on purpose: S holds notices, not long reading |
| **M** | 960 (60rem) | 1080 | 1080 | auto, ≤ 85vh | One column of structured content. Rem, declared once. 960 holds one row of four hand cards (`CARD_WIDTH_PX` 210 × 4 + 3 × 12 px gap = 876 px, the Stage's row of `CARDS_PER_ROW` 4) inside 2 × 20 px of padding; at 2560 the row has 1035 px |
| **L** | 1280 | 1600 | 1600 | auto, ≤ 85vh | A subject and its record side by side (§ 4). Px per tier, like the frame. Matches the Stage panel (1272 / 1592 / 1592 in THR-1819's plan), so a moment and a dialog read at the same scale; 1600 leaves 480 px of screen visible on each side at 2560 |
| **XL** | 1760 | 2240 | 2880 | **fixed 85vh** | A work surface that brings its own panes (the Codex). Px per tier. Fixed height so its panes have a height to fill and do not jump as a filter changes. The only tier that takes 3440's extra width |

**Why S, M and L stop growing at 3440.** The 3440 screen gets extra width, not a type step (brief rule 1). A prose dialog wider than its text is harder to read, and a row of four cards does not become five. The extra width goes to XL and to the map behind every dialog; this matches the Stage panel, which also holds its 2560 size at 3440.

**Why two units.** S and M exist to hold text and cards at a reading size, so they are text containers in THR-1819's sense: rem, declared once, stepping exactly with the type (and staying at 1080p sizes on a 2560 × 1080 screen, where THR-1819's height guard keeps the root at 16 px). L and XL exist to use the screen, so they are frame-scale: px, one value per tier.

**Why fixed values per tier, not `min(px, vw)`.** The issue's examples were fluid (`min(960px, 55vw)`). Fixed values per tier give exactly two designs to verify, at the two screens the browser-verify contract captures, and the same seed renders the same panel for every tester. The fluid part is only the safety clamp below.

**The tokens** (declarations added to THR-1819's existing `:root` blocks in `src/index.css`):

```css
/* :root — text-container tokens (declared once) and base values of the frame-scale ones */
--dialog-s-w: 37.5rem;      /* 600 at 16 px, 675 at 18 px */
--dialog-m-w: 60rem;        /* 960 at 16 px, 1080 at 18 px */
--dialog-l-w: 1280px;
--dialog-xl-w: 1760px;
--dialog-gutter: 24px;      /* least space between a panel and the viewport edge */
--sheet-aside-w: 400px;     /* SheetColumns left column (§ 4) */
--sheet-gap: 24px;
/* @media (min-width: 1920px) :root — restate the frame-scale values (THR-1819's convention) */
--dialog-l-w: 1280px;  --dialog-xl-w: 1760px;  --dialog-gutter: 24px;  --sheet-aside-w: 400px;  --sheet-gap: 24px;
/* @media (min-width: 2560px) :root */
--dialog-l-w: 1600px;  --dialog-xl-w: 2240px;  --dialog-gutter: 32px;  --sheet-aside-w: 480px;  --sheet-gap: 28px;
/* @media (min-width: 3440px) :root */
--dialog-l-w: 1600px;  --dialog-xl-w: 2880px;  --dialog-gutter: 32px;  --sheet-aside-w: 480px;  --sheet-gap: 28px;
```

A panel's width is `min(var(--dialog-<t>-w), calc(100vw - 2 * var(--dialog-gutter)))`. Its max height is `var(--modal-max-h)`; XL also sets `height` to it. The seven tokens join THR-1819's layout-contract tables (S and M with the rem text tokens, the rest with the px frame tokens), so THR-1819's parity test pins CSS and TS together.

### 3. Choosing a tier

The tier is chosen by what the content is, from four names only (Law 26 picks the *family* by what the player must do; the tier then picks the *size* by what the content needs):

| Tier | Holds | Surfaces (after THR-1827 / THR-1829) |
|---|---|---|
| S | one message or one decision: a notice, a receipt, a reveal, a short choice list, a short form | event popups (both shapes), divine receipts, the omen, gifts with fewer than three cards, effect choice sets, the start page's Settings and Credits, the warm-start card |
| M | one column of structured content: a ladder or a clock, a row of up to four cards, a grouped digest, a form in sections | the doom clock, the mandate, gifts and offerings with three or four cards, the Threading Rite's bond-only reveal, Read the Threads, the in-game Settings |
| L | a subject and its record side by side (§ 4): an index beside its reader, identity beside facts, a court beside its seats | the Chapter Ledger, the Divine Court |
| XL | a work surface with its own panes | the Codex (until its placement is decided, THR-1827 *Deferred*) |

- **A surface may pick its tier from its content when it opens** (the gift modal: S below three cards, M from three), but only from these four names.
- **Step up before you fold.** When a surface's typical content reaches its cap (the debug report in § Debug inspection shows `atCap` with a scrolling body), the fix is the next tier up. Folding comes only at the largest tier that fits the surface's job. That is Law 57 applied to tier choice.

### 4. The two-column sheet layout — `SheetColumns`

A new shared primitive, `src/components/shared/SheetColumns.tsx`, for L and above:

```tsx
<SheetColumns aside={<>{hero art}{name + identity line}{at-a-glance words}</>}>
  {facts · tabs · lists · the record}
</SheetColumns>
```

- **Two columns when its container says so.** A small context, `SheetLayoutContext` (`'one' | 'two'`, default `'one'`), is provided by the container. `Modal` provides `'two'` at L and XL and `'one'` at S and M. The Inspector's build provides it per Inspector size; THR-1827 already fixes Full's page as two columns, and docked is one column. A context, not a container query, because the column count is then a plain value a jsdom test can assert, and no threshold number is hidden in CSS.
- **Two columns:** CSS grid, `grid-template-columns: var(--sheet-aside-w) minmax(0, 1fr)`, gap `var(--sheet-gap)`. The aside holds the hero art at 16:9 across the column (Law 5: 400 → 225 px tall at 1080p, 480 → 270 px at 1440p), the name, the identity line, and the few words a reader needs at a glance. The main column holds the facts, tabs and the record. Each column is its own scroll region, and each scrolls only when the panel is at its cap (Law 57), so at the cap the identity stays in view while the record scrolls.
- **One column:** the aside stacks above the main content, one scroll region.
- **In a dialog** `SheetColumns` takes the place of `Modal.Body` (it carries the body's `--panel-padding` and its own scroll regions); `Modal.Header` and `Modal.Footer` stay as they are.
- **Uses at landing:** the Chapter Ledger (index left, chapter right) and the styleguide. Then the Divine Court (slice 2) and the Inspector's two-column sizes (THR-1827's build).
- Law 29: lands with its `?view=styleguide` entry and its `component-selection.md` row in the same PR.

### 5. The Modal primitive API change

```ts
// src/components/shared/dialogSize.ts (new)
export type DialogSize = 's' | 'm' | 'l' | 'xl';
export const DIALOG_SIZES: readonly DialogSize[] = ['s', 'm', 'l', 'xl'];
export const DIALOG_SIZE_DEFAULT: DialogSize = 's';
export const DIALOG_SIZE_WIDTH_VAR: Record<DialogSize, string>;      // 's' → '--dialog-s-w', …
export const DIALOG_SIZE_FALLBACK: Record<DialogSize, string>;       // { s: '37.5rem', m: '60rem', l: '1280px', xl: '1760px' }
export function dialogSizeStyle(size: DialogSize): React.CSSProperties; // width clamp, max-height, xl height
export const DIALOG_SIZE_SURFACES: ReadonlyArray<{ surface: string; file: string; sizes: readonly DialogSize[] }>;
```

```ts
// src/components/shared/Modal.tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Size tier (THR-1820, Law 57). Default 's'. */
  size?: DialogSize;
  /**
   * @deprecated THR-1820 — a free width, counted by the UI-debt ratchet (row `modal-maxwidth`).
   * Honoured only when `size` is absent, drawn exactly as before. Kept so surfaces that
   * THR-1827 / THR-1829 retire need no edit before they are deleted.
   */
  maxWidth?: number;
  animation?, zIndex?, closeOnEscape?, 'aria-label'?, panelClassName?, context?, children  // unchanged
}
export function modalPanelStyle(sizeOrMaxWidth: DialogSize | number = 's'): React.CSSProperties;
```

| Call | Panel |
|---|---|
| `size` given | `dialogSizeStyle(size)`; `data-dialog-size="<size>"` on the panel |
| only `maxWidth` | today's shape (`width: 90%`, `maxWidth: <n>px`, THR-1819's height cap); `data-dialog-size="free"` |
| neither | `'s'` (600 at 1080p, today's default width) |
| both | `size` wins; one `console.warn` per mount in development |

- `Modal` provides `SheetLayoutContext`: `'two'` for `l` / `xl`, otherwise `'one'`.
- Each `var()` carries its fallback from `DIALOG_SIZE_FALLBACK` (the `:root` values), so a test environment without the stylesheet still lays out (fail-soft); `dialogSize.test.ts` pins the fallbacks to the `:root` values in `index.css`.
- `RevealCard` **replaces** `maxWidth` with `size` (default `'s'`) and forwards it as `<Modal size={size}>`. No deprecated path here: its only `maxWidth` caller, `ThreadingRite`'s bond-only reveal, moves to `size="m"` in the same slice, so nothing would use one, and the forwarding line leaves the `modal-maxwidth` count. `REVEAL_CARD_MAX_WIDTH` (520) and `REVEAL_CONSEQUENCE_CHIP_MAX` leave `RevealCard.tsx` and `shared/index.ts` (no other importer; `RevealCard.test.tsx` is updated). `RevealCard.Consequences` renders every chip, wrapping (Law 57).
- **THR-1821's `Overlay` sizes nothing** (its draft: "Sizes belong to `Modal`'s tiers (THR-1820), the Inspector's and Stage's own geometry … and the owner"). The tiers live on `Modal` only. When THR-1821's Overlay slice re-bases `Modal` on `Overlay` + `Panel`, `size` stays a `Modal` prop and its behaviour above is unchanged. A surface that draws its own panel on an `Overlay` (a cover with a card, for example) sizes that panel with `dialogSizeStyle(<tier>)`, never a free width.
- **`DetailModal`'s fate: retired by the Inspector (THR-1827).** World refs and content refs both open in the Inspector, so the stack has no caller left. Until that build lands it stays mounted and untouched: its per-kind sizes (`DETAIL_*_W` / `_H`) are not converted to tiers and do not count in the ratchet (they are not `maxWidth=` attributes). THR-1827's build deletes `DetailModal`, `DetailModalStackContext`, the `DETAIL_*` constants and the styleguide entry together.

### 6. The free-width ratchet row

For THR-1821's single UI-debt script (brief rule 5; `scripts/check-ui-debt.ts` with its rows in `scripts/ui-debt-rows.ts` and the committed `ui-debt-baseline.json`, in THR-1821's draft). THR-1821's draft reserves the row name `modal-maxwidth` for this plan and leaves its definition here:

| Field | Value |
|---|---|
| Row id | `modal-maxwidth` |
| Counts | every opening tag of `<Modal` or `<RevealCard` (from `<` to its closing `>`, across lines) that carries a `maxWidth=` attribute, in a `.tsx` file under `src/components/`, excluding `__tests__/`. Today this equals every `\bmaxWidth=` attribute under `src/components/`: no other element takes one |
| Baseline, measured 2026-10-14 at `3cf81086` | **17**, one each in: `ThreadingRite/ThreadingRite.tsx` (`<RevealCard`), `shared/RevealCard.tsx` (its own `<Modal`), `ruins/EmergenceDilemmaModal.tsx`, and in `Game/`: `AscendantSheet`, `ChapterLedger`, `AscendantBeatModal`, `AgentProfileModal`, `MomentCard`, `GameView`, `MeetingEncounterModal`, `MandateDetail`, `PremonitionModal`, `OmenDetail`, `ReadTheThreadsPanel`, `EventPopup`, `DoomClockDetail`, `DivineReceiptModal`. Six of the 17 are multi-line tags (`RevealCard`, `AscendantBeatModal`, `MomentCard`, `ReadTheThreadsPanel`, `EmergenceDilemmaModal`, `ThreadingRite`); a one-line regex finds 11 |
| After slice 1 of this plan | **7** — the surfaces left are all retired by THR-1827 (`AgentProfileModal`, `AscendantSheet`, `GameView`'s attachment sheet) or move to the Stage under THR-1829 (`MomentCard`, `PremonitionModal`, `EmergenceDilemmaModal`, `MeetingEncounterModal`) |
| Floor | 0, when the Inspector and Stage builds delete those surfaces |
| Who adds it | This plan's executor, in slice 1: it registers the row with baseline 7. THR-1821's ratchet ships first (THR-1820 is blocked by THR-1821 for this reason, and THR-1821's draft tells its own executor not to add sister rows) |

The hand-built overlays' free widths (`min(32rem, 92vw)`, `max-w-md`, …) are not a second row: THR-1821 counts those overlays themselves, and when they move onto a primitive they take a tier.

### 7. Migration list — every modal, overlay and detail surface in `src/components`

Measured at `3cf81086` from every `<Modal`, `<RevealCard`, `<DetailModal`, `maxWidth=`, `fixed inset-0`, `absolute inset-0 … z-`, `position: 'fixed'` and `createPortal(` hit. Slice 1 is this ticket; slice 2 is the follow-up (§ Slicing).

**A. Keeps a dialog home — gets a tier**

| Surface | Today | Tier | Slice | Law 57 notes |
|---|---|---|---|---|
| `EventPopup` compact (`Game/EventPopup.tsx:90`) | `Modal` 420 | S | 1 | the `+N` queue badge is a coalesced count (Law 49), not truncation |
| `EventPopup` ceremonial (`:71`, `RevealCard`) | `RevealCard` 520 | S | 1 | — |
| `DivineReceiptModal` (`:75`) | `Modal` 560, `gain` | S | 1 | — |
| `OmenDetail` (`:107`) | `Modal` 480 | S | 1 | — |
| `DoomClockDetail` (`:79`) | `Modal` 760 | M | 1 | — |
| `MandateDetail` (`:276`) | `Modal` 780 | M | 1 | — |
| `AscendantBeatModal` — gifts and offerings (`:458-475`) | computed 600–1008 | S below 3 cards, M from 3 (`BEAT_MODAL_M_MIN_CARDS`) | 1 | `unlockRowMaxWidth` retires; the card row uses the hand's gap so four cards fit in M |
| `ThreadingRite` bond-only reveal (`ThreadingRite.tsx:67,395`) | `RevealCard` 760 | M | 1 | the bond-only shape stays a dialog (THR-1829) |
| `ChapterLedger` (`:325`) | `Modal` 720, list *or* chapter | L, `SheetColumns`: index left, chapter right | 1 | opens with the newest row selected, so the right column is not empty while chapters exist. That row may be a live encounter (`source: 'active'`, label "active · step 2"): the right column then shows its chapter so far, read-only, exactly what clicking that row shows today (`buildChapterRecord` → `ChapterView`, whose only control is Back). Selecting a row never opens, resumes or acts on the encounter. **The selection is the row's key (`actionId`), not a snapshot:** the right column re-derives the record from the current row whenever the rows recompute, so a live row's "active · step 3" and the chapter beside it never disagree, and when that encounter resolves the same key shows its archived chapter. **A click always answers:** the clicked row takes the selection highlight within one `--anim-fast` (Law 47), and if its record does not build (`buildChapterRecord` returns null, today a silent no-op at `ChapterLedger.tsx:211-213`) the right column shows the line "This chapter has no record to show yet." instead of keeping the previous chapter. On open, a row whose record does not build is skipped for the next one; with none, the chapter column is not rendered and the index fills the panel. `CHAPTER_LEDGER_PAGE_SIZE` 25 → 40, so one page overfills the index column's cap at both screens (a one-line row is about 36 px at 1080p and 40 px at 1440p, so 40 rows are about 1440 / 1600 px against caps of 918 / 1224 px) and paging begins only past a full column; browser verify confirms the index column reaches its cap before the pager shows |
| `ReadTheThreadsPanel` (`:507-512`) | `Modal` 700 | M | 1 | the read digest's Reach groups flow in two columns, about halving its height |
| `SettingsModal`, start page (`StartPage/SettingsModal.tsx:49`) | `Modal` default 600 | S (explicit) | 1 | — |
| `CreditsModal`, start page (`:12`) | `Modal` default 600 | S (explicit) | 1 | — |
| `RevealCard.Consequences` (`RevealCard.tsx:154`) | cut at 4, `+N` chip | — | 1 | every chip renders, wrapping |
| `StyleGuide` (`StyleGuide.tsx:420,718`) | sample `Modal`, `modalPanelStyle(260)` | gallery of all four tiers + `SheetColumns` | 1 | Law 29 |
| `SettingsPanel`, in game (`Game/SettingsPanel.tsx:139-154`) | hand-built `position: fixed` flyout, 280 wide, 85vh, scrolls | M | 2 | a dialog, not an anchored flyout (table E): it is a hand-built `position: fixed` panel, not a `Dropdown` child, and the brief (rule 7) and THR-1827 give Settings a dialog home. Sections laid side by side so every section shows without scrolling |
| `ChoiceSetModal` — effect choice sets (`:65,80-81`) | hand-built `absolute inset-0`, `min(32rem, 92vw)`, 85vh | S | 2 | THR-1821's Overlay slice moves it onto `Modal` (its draft); slice 2 then passes `size="s"`. Options grow to the cap before the list scrolls |
| `ScryOverlay` — the Divine Court (`:699,718`, `SCRY_PANEL_MAX_HEIGHT` 75vh `:527`) | hand-built full-screen overlay, panel `max-w-4xl`, body scrolls at 75vh | L dialog (`Modal`), `SheetColumns`: the court's name, flavour and art left, the seats right | 2 | a dialog, not a ceremony (THR-1829's three homes; brief rule 7). **Conflict on record:** THR-1821's draft moves it onto `Overlay backdrop="void"` as a "full-screen ceremony"; THR-1829 and the brief govern, so THR-1821's Overlay slice should leave it to THR-1880 (or move it straight onto `Modal` at L) — noted on THR-1821 and THR-1880. The two pickers (`:274-304`, `:452-475`) become views in the main column, not nested overlays; their `max-h-96` boxes go |
| Codex in game (`GameView.tsx:6792`, `fixed inset-0`, z 60) | hand-built full screen | XL dialog (`Modal`) | 2 | a dialog until its placement is decided (brief rule 7); if THR-1827's open Codex placement puts it in Inspector Full, this row retires. Same conflict on record as the court: THR-1821's draft calls this layer a void-backdrop ceremony; the brief governs |
| `HarvestScreen` — cycle end (`:57-58,86`) | hand-built `fixed inset-0`, `max-w-2xl`, echo row `overflow-x-auto` | none: full-screen ceremony | 2 | **Christian, chat 2026-10-14:** the cycle end stays a full-screen ceremony, like Meet the First and the Threading Rite. It takes THR-1821's ceremony backdrop, not a modal tier. Law 57 still applies inside it: the echo cards wrap, with no sideways strip |
| `WarmStartOverlay` (`:44,47`) | hand-built opaque cover, `max-w-xl` card | S (its card) | 2 | the cover stays opaque (THR-1821's backdrop); the card takes S through `dialogSizeStyle('s')` |

**B. Retired by THR-1827 (Inspector) — not tiered, not migrated**

| Surface | Today |
|---|---|
| `AgentProfileModal` (`:120`, plus its inner overlays `:321`, `:346`) | `Modal` 960 |
| `LocationProfileModal` (`:211`), `FactionSheet` (`:106`, `:182`), `ArmySheet` (`:85`), `ArtifactSheet` (`:168`) | `Modal` default 600 |
| `AscendantSheet` (`:247`) — "the god's own sheet opens in the Inspector" | `Modal` 960 |
| `AttachmentDetailView` sheet (`GameView.tsx:~6520`) | `Modal` 720 |
| `DetailModal` (`shared/DetailModal.tsx`, sizes in `types/detailPage.ts:25-63`) | stacked 720×620 / 800×720 at z 70 + 2·depth |
| `ThreadDetailView`, `HexDetailView` (the 280 px detail column) | `HEX_DETAIL_MAX_LOCATIONS` 5 / `_AGENTS` 4 (`:21-22`) → "and N further places besides"; `ThreadDetailView.tsx:926` `+N more` |
| `LocationView`, `HexZoomView` (view levels) | whole-view swaps |
| `ActionDrawer` subject hand (`:258`, `fixed bottom-0`) and its `AgendaPicker` (`:27,43`) and `InterventionConfirm` (`:72,89`) popovers, reached only from the drawer's slot click | hand-built `absolute inset-0`, `min(28rem, 90vw)`; if either is touched before the drawer retires, it takes S |
| `LiveLocationBar` | floating box |
| `StrandView` (`:290,296`) | hand-built `fixed inset-0`, 70% × 70%; **unreachable today**: `handleViewPsyche` is destructured at `GameView.tsx:696` and passed to nothing. Retire with the detail column it was built for; its psyche content belongs on the agent page |

**C. Moves to the Stage (THR-1829) — not tiered**

| Surface | Today |
|---|---|
| `EncounterVeil` (three portals, `:719`, `:1617`, `:2069`) | full-screen veil; aftermath blocks capped at 540 |
| `StoryBeatModal` (`:53`) | `Modal` default 600, `story` |
| `JourneyVignetteModal` (`:153-158`) | `Modal` with a dead `size="md"` → 600, `story` |
| `MomentCard` (`:151-158`) — undertaking moments | `Modal` 560, `gain` |
| `PremonitionModal` (`:293`) | `Modal` 520 |
| `EmergenceDilemmaModal` (`:36,201`) | `Modal` 720, `elder` |
| `MeetingEncounterModal` (`:579`) — never mounted | `Modal` 560; the Stage build deletes it or mounts it on the Stage |

`JourneyVignetteModal`'s `size="md"` is a type error today (one entry in `typecheck-baseline.json`). Slice 1 changes it to `size="s"`, which keeps its 600 px and removes the error; the Stage build then replaces the surface.

**D. Full-screen ceremony (THR-1829) — not tiered:** `MeetTheFirstFlow` (`:245`), `ThreadingRite` full and short shapes (`:206`), `RemembranceFlow` (pre-world, `App.tsx`).

**E. Anchored flyouts — not dialog tiers; Law 57 binds their own limit:** `NotablesPanel` and `RivalPanel` (inside `Dropdown`), the Needs-you drop-down (THR-1828, not built), `MandateTracker`'s expanded panel (`:216`; **unmounted** — no `<MandateTracker` in `src/`; THR-1828 folds the Mandate into the god rail).

**F. Not panels — out of scope:** `Tooltip`, `HoverCard` (`HOVER_CARD_MAX_SECTIONS` is the hover tier, lawful), `Dropdown` itself, `ToastStack` (`MAX_VISIBLE_TOASTS`, Law 49), the beat-offer pill (`AscendantBeatModal.tsx:613`), `AscendantSelection`'s decorative layer (`:35`), `MandateTracker`'s click-catcher (`:338`), `DoomClockDetail`'s ring glow (`:167`), the debug panel and the designer routes (CMS, taxonomy, UL), HexMapV2 overlays and their ring limits (map signifiers, not panels).

### Player-facing display

- **At 1920×1080** every slice-1 dialog keeps or gains width but one: S callers that used the 600 default are unchanged; the popup grows 420 → 600, the omen 480 → 600, the receipt 560 → 600; the doom clock and mandate grow 760 / 780 → 960; the Threading Rite's bond-only reveal grows 760 → 960; the Chapter Ledger grows 720 → 1280 and shows the index beside the chapter instead of one at a time. **The exception:** a three-card gift grows 774 → 960, but a four-card gift narrows 1008 → 960, because its card row closes from a 24 px to the hand's 12 px gap (the four cards keep their size).
- **At 2560×1440** every tier grows with the root step (S 675, M 1080) or more (L 1600, XL 2240), so the same dialog no longer reads as a 1080p box on a 1440p screen.
- **Heights** grow with content to 85vh; nothing inside a dialog scrolls before then.
- **Unchanged:** z-bands (60 / 65), backdrop, escape order, focus (Law 50), dialogue contexts (Law 30), animations.

### Player-facing text

Two new lines: the Chapter Ledger's fail-soft line (slice 1) and "Back to the court" (slice 2). Otherwise no new words. What changes:

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| `RevealCard.Consequences` (today only the styleguide sample renders it; any future reveal inherits the fix) | before: a medallion titled **"2 more"** after four chips; after: every chip, each with its own tooltip (`item.title`, `item.desc`). The heading stays **"What follows (6)"** | PC-1 (an unexplained "+2" chip), PC-6 (the heading says six, the row shows four) | the count in the heading and the chips shown now agree; each chip still explains itself on hover |
| Chapter Ledger | the header **"Chapter Ledger"**, the filter line (e.g. **"Threaded chapters · 31"**), the row labels (e.g. **"active · step 2"** for a live encounter) and the chapter text are unchanged; the chapter now reads beside the index instead of replacing it, and the newest row is selected on open. **One new line**, shown in the chapter column when a clicked row has no record: **"This chapter has no record to show yet."** | PC-6 (the row's step and the chapter must agree); PC-4 (something is selected for the player); PC-8 (a row click must answer) | the selected row is highlighted on the left and is the chapter shown on the right; selecting is reading only — a live encounter's row shows its chapter so far, kept current as the encounter moves, and nothing is opened, resumed or played. A click always changes something within a moment: the highlight moves and the right column shows that row's chapter or the line above. No "Back" step is needed to see the list again |
| Threading Rite, bond-only reveal | unchanged words (portrait, name, the bond-only hand), panel 760 → M | none | — |
| Doom, Mandate, Omen, receipt, popups, gifts, Read the Threads, start-page Settings, Credits | unchanged words, panel at its tier | none | — |
| *Slice 2 (THR-1880):* the Divine Court's pickers | the picker headings are unchanged: **"Choose Agent"**, **"Select Title for Kael Thorne"** (rendered sample), **"No eligible agents available."**. Each picker now opens as a view in the court's right column instead of a box over it. Its ✕ ("Close (Esc)") becomes one text button: **"Back to the court"** | PC-8 (a pick and a back must answer); PC-7 (where am I) | the court's name and art stay on the left, so the player sees which court they are in (Law 24). **"Back to the court"** or Escape returns to the seats; a second Escape closes the court (Law 23). A pick returns to the seats within one `--anim-fast` with the filled seat highlighted, and a title reassignment visibly moves the essence it cost (Law 47) |
| *Slice 2:* the Codex in game | unchanged words, including its close control (**"Close codex"**) | none | it opens as an XL dialog over the dimmed game instead of replacing the screen; Escape or **"Close codex"** closes it, as today |
| *Slice 2:* the cycle harvest | unchanged words (**"Cycle 3 Complete"**, the harvest title, **"Echoes Preserved — three cosmic"**, **"Begin Next Cycle"**) | none | it stays full screen (Christian, 2026-10-14); the echo cards wrap in rows instead of scrolling sideways, so every echo is visible without a hidden strip |
| *Slice 2:* the warm-start card, effect choice sets | unchanged words | none | panel at S; a choice set's options show whole before its list scrolls |
| *Slice 2:* Settings in game | unchanged words, including its header **"Settings"** | none | it opens as a centred M dialog instead of a 280 px flyout under the top bar, its sections side by side; the ⚙ button, Escape and the header's close still close it |
| Hex detail column (retired by THR-1827, not this plan) | **"and 24 further places besides"** stops existing with the column | PC-6 | the land page lists every place (THR-1827 call 17) |

### Playtest signal

A tester at 2560×1440 who opens the doom clock, the mandate, a gift or the Chapter Ledger never has to scroll a dialog that has empty screen around it, and never meets a list that stops with "N more" while the panel could have shown it.

### Event notifications

N/A — no alerts, toasts or chronicle lines are added or changed.

### Debug inspection (DebugPanel)

`window.__DEBUG.getDialogSizes(): Promise<DialogSizeReport>` (shape in § Tracing), modelled on `getDialogContexts()`. It returns the registry and, for every open dialog panel (`[data-dialog-size]`), its tier, its measured size, its cap at this viewport, whether it is at the cap, and **`scrollingBelowCap`**: every scroll box inside the panel that scrolls (vertically, or sideways at all) while the panel is still below its cap. **An empty `scrollingBelowCap` on every open dialog is Law 57's machine check** (Enforcement: "a law a machine can check should acquire its check in the same PR that first relies on it"). It reads the DOM, so it runs in the browser, not in jsdom.

### Visual presence (HexMapV2)

N/A — no map change. Dialogs keep their backdrop; an L dialog leaves 320 / 480 px of the dimmed screen visible on each side at 1080 / 1440.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — slice 1 adds a "Dialog sizes (THR-1820)" section beside "Dialogue contexts (THR-1586)".

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `src/index.css` size tokens | none | every tiered panel | none | none | computed styles; `getDialogSizes().open[].capWidthPx` |
| `src/components/shared/dialogSize.ts` (new) | none | `Modal`, `RevealCard`; in slice 2 the owner-drawn panels on THR-1821's `Overlay` (`dialogSizeStyle`) | none | none | `getDialogSizes().surfaces` |
| `Modal` `size` / `data-dialog-size` / `SheetLayoutContext` | none | all slice-1 surfaces | none | none | `getDialogSizes().open` |
| `SheetColumns` (new) | none | `ChapterLedger`; later Divine Court, Inspector | none | none | `data-testid="sheet-columns"` with `data-layout="one"\|"two"` |
| `CHAPTER_LEDGER_PAGE_SIZE` 25 → 40 | none (no tick reader) | `ChapterLedger` | none | none | the pager renders only past 40 rows |
| `__DEBUG.getDialogSizes()` | none | — | none | none | `src/debug-bridge.ts` + `.d.ts` |

- **Prerequisite health (for browser verify):** the dialogs need something to show. Start at `?view=game&seeded&size=medium&forceencounters`. Run `window.__DEBUG.tick(n)` until the Chapter Ledger lists both an active row and resolved rows. Its filter line ("Threaded chapters · N", or "All chapters · N") shows the source is alive. Open a gift with `__DEBUG.forceOffering()` (three cards, M). The doom clock and the mandate open from the top bar on any bonded world (`?seeded` is pre-bonded). Check each with `await window.__DEBUG.getDialogSizes()` before taking the screenshot.
- **Prose pipeline (`enrichProse()`):** N/A. The two new lines ("This chapter has no record to show yet.", slice 1; "Back to the court", slice 2) are static UI copy in `src/data/ui-content.ts` with no tokens; no generated text changes.
- **Player controls:** none added. Existing behaviour that changes, all in the Chapter Ledger:
  - A row click now fills the right column instead of replacing the list, and always answers: the highlight moves, and the column shows the chapter or the fail-soft line.
  - "Back" is hidden in the two-column layout and kept in the one-column `embedded` mode.
  - The newest row is selected on open (reading only).
  - The selection follows its row's key as the world moves.

  Elsewhere, a dialog's width changes with its tier; no control is added, moved or removed.

## Interface impact

N/A — presentation only. No subsystem in `Docs/canon/interface-map.md` is touched; no cross-system read or write is added, changed or retired.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `--dialog-s-w` | 37.5rem (600 / 675 / 675 px) | S width at 1920 / 2560 / 3440; text-container family, declared once |
| `--dialog-m-w` | 60rem (960 / 1080 / 1080 px) | M width; text-container family, declared once |
| `--dialog-l-w` | 1280 / 1280 / 1600 / 1600 px (base / fhd / qhd / uwqhd) | L width; frame family, restated per tier |
| `--dialog-xl-w` | 1760 / 1760 / 2240 / 2880 px | XL width; frame family |
| `--dialog-gutter` | 24 / 24 / 32 / 32 px | least space between a panel and the viewport edge (the clamp) |
| `--sheet-aside-w` | 400 / 400 / 480 / 480 px | `SheetColumns` left column |
| `--sheet-gap` | 24 / 24 / 28 / 28 px | `SheetColumns` gap |
| `--modal-max-h` | 85vh (THR-1819's token) | every tier's max height; XL's fixed height |
| `DIALOG_SIZE_DEFAULT` | `'s'` | tier when a caller passes neither `size` nor `maxWidth` |
| `DIALOG_SIZE_FALLBACK` | `{ s: '37.5rem', m: '60rem', l: '1280px', xl: '1760px' }` | `var()` fallbacks; pinned to the `:root` values in `index.css` by a test |
| `DIALOG_CAP_TOLERANCE_PX` | 2 | debug report: a panel within this of its cap counts as at its cap |
| `BEAT_MODAL_M_MIN_CARDS` | 3 | gift and offering dialogs take M from three cards up, S below |
| `CHAPTER_LEDGER_PAGE_SIZE` | 25 → **40** | one Ledger page overfills the index column's cap at both screens |

## Tracing

N/A for engine traces — presentation only, nothing in the tick changes. Inspectability comes from the debug report:

```ts
// window.__DEBUG.getDialogSizes() — src/debug-bridge.d.ts
interface DialogSizeReport {
  /** The registry: every dialog-home surface and the tiers it may take. */
  surfaces: ReadonlyArray<{ surface: string; file: string; sizes: ReadonlyArray<'s' | 'm' | 'l' | 'xl'> }>;
  open: Array<{
    label: string | null;              // the dialog's aria-label
    size: 's' | 'm' | 'l' | 'xl' | 'free';
    widthPx: number;
    heightPx: number;
    capWidthPx: number;                // the tier's width at this viewport, after the gutter clamp
    capHeightPx: number;               // 85vh at this viewport
    atCap: boolean;                    // heightPx >= capHeightPx - DIALOG_CAP_TOLERANCE_PX
    /** Law 57: scroll boxes inside the panel that scroll while it is below its cap. Empty when lawful. */
    scrollingBelowCap: Array<{ element: string; axis: 'y' | 'x' }>;
  }>;
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A size token is missing (stylesheet not loaded, e.g. a test) | each `var()` falls back to `DIALOG_SIZE_FALLBACK` (the `:root` values) and `var(--modal-max-h, 85vh)` |
| Viewport narrower than the tier | width clamps to `100vw - 2 × gutter`; height still caps at 85vh |
| An unknown `size` string reaches `Modal` at run time | treated as `'s'`; one `console.warn` |
| Both `size` and `maxWidth` passed | `size` wins; one `console.warn` in development |
| `SheetColumns` rendered with no provider | `'one'` (stacked), which is lawful at any width |
| Chapter Ledger opened with no chapters | the existing empty state in the index column; the chapter column is not rendered |
| A clicked Ledger row's record does not build | the row is selected and the chapter column shows "This chapter has no record to show yet." (never the previous chapter, never nothing) |
| `getDialogSizes()` with no open dialog | `open: []` |
| THR-1819's tokens or THR-1821's ratchet not on `main` yet | does not happen: THR-1820 is blocked by both and executes after them |

## Slicing

- **Slice 1 — this ticket.** Tokens, `dialogSize.ts`, `Modal` and `RevealCard` `size`, `SheetColumns`, the debug report, the ratchet row, the styleguide gallery, the docs, and the twelve `Modal` / `RevealCard` callers in table A marked slice 1 (plus the `JourneyVignetteModal` type fix). Only files that call `Modal` or `RevealCard` today; none of THR-1821's hand-built overlays.
- **Slice 2 — [THR-1880](https://linear.app/threadbare/issue/THR-1880)** (filed with this plan, `Deferral`, blocked by THR-1820 and THR-1821). The six hand-built dialogs in table A marked slice 2 take the tier given there, after THR-1821's Overlay slice has given them their backdrop and re-based `Modal`. For `ChoiceSetModal`, `SettingsPanel` and `WarmStartOverlay` that is one rebuild each. `HarvestScreen` takes no tier: Christian ruled in chat on 2026-10-14 that it stays a full-screen ceremony, so THR-1880 only makes its echo row wrap. **The exception is a recorded conflict:** THR-1821's draft moves the Divine Court and the Codex layer onto a void "ceremony" backdrop, while THR-1829's three homes and the brief (rule 7) make them dialogs. The brief governs. If THR-1821's Overlay slice still moves them, THR-1880 moves them a second time, onto `Modal` at L / XL. The note on THR-1821 asks its slice to leave them alone to avoid that.
- **Not sliced here:** the Inspector ([THR-1876](https://linear.app/threadbare/issue/THR-1876)) and the Stage ([THR-1877](https://linear.app/threadbare/issue/THR-1877)) adopt Law 57 and `SheetColumns` in their own plan docs (map THR-1823 destinations); the retiring surfaces in tables B and C are deleted by those builds, which takes the ratchet to 0. The GameView split ([THR-1881](https://linear.app/threadbare/issue/THR-1881)) moves the dialog mounts into a host; slice 1 does not edit `GameView.tsx`.

## Three-pillar check

- [x] Engine pillar present (or N/A with rationale) — N/A: presentation only; one UI-consumed constant changes value
- [x] Content pillar present (or N/A with rationale) — N/A: no authored content; two static UI lines, quoted; two truncation strings disappear
- [x] UI pillar present (or N/A with rationale) — the law, the tiers, the primitive change, `SheetColumns`, the migration list
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it serves the map's destination ("The Map Is the Table": the frame, the Inspector and the Stage use the screen; dialogs are the god's own business and no longer read as 1080p boxes on a 1440p screen).
- [x] If it does, the Vision edit is part of this ticket's scope — no edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)
- [x] If it does, `Docs/canon/rulebook.md` is updated in the same PR — not applicable

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1820-dialog-size-tiers-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every width is a named token per screen; the gift threshold, page size and debug tolerance are named constants |
| 2. Inspectability | PASS | `data-dialog-size` on every panel; `__DEBUG.getDialogSizes()` reports tier, size, cap and every below-cap scroll box; the registry is data |
| 3. Determinism | PASS | fixed widths per breakpoint, no fluid `vw` widths except the safety clamp; no randomness |
| 4. Fail-soft | PASS | `var()` fallbacks, viewport clamp, unknown size → S, stacked layout without a provider (fail-soft table) |
| 5. Narrative over mechanical perfection | PASS with note | presentation only; the Chapter Ledger reading beside its index keeps a story and its place in the record on one screen (Law 55) |
| 6. Additive over destructive | PASS with note | `Modal` gains `size` and keeps `maxWidth` (deprecated), so retiring surfaces need no edit. Removed: `RevealCard`'s `maxWidth` (its one caller moves to `size` in the same slice) and its two constants (the `+N` cap is exactly what Law 57 forbids) |
| 7. Performance budget | PASS | CSS tokens and one context value; the debug report runs only on request |

## Kill criteria

- Browser verify at 2560×1440 shows an S or M dialog whose content fills under a third of its panel's width on most rows: the tier width is too generous; lower that tier's 2560 value before migrating more surfaces.
- Christian says a dialog "feels like a page, not a dialog" at L: L drops toward 1440 at 2560 and the Stage-matching rationale is recorded as overridden.
- `scrollingBelowCap` is non-empty on a migrated surface at either screen: the migration is not done; fix the surface, not the law.

## Done when

- [ ] `src/index.css` declares the seven size tokens in THR-1819's `:root` blocks with the values in § 2; they are registered in THR-1819's layout-contract tables and its parity test passes; `dialogSize.test.ts` asserts `DIALOG_SIZE_FALLBACK` equals the `:root` values
- [ ] `Modal` and `RevealCard` take `size`; `Modal`'s `maxWidth` is deprecated and draws exactly as before; `RevealCard` no longer takes `maxWidth`; `Modal.test.tsx` covers size → `data-dialog-size` and width variable, the default `'s'`, the free path (`data-dialog-size="free"`), both-passed, and the context value per tier
- [ ] `SheetColumns` renders two columns under `'two'` and stacks under `'one'` / no provider (jsdom test), and has its styleguide entry and `component-selection.md` row (Law 29)
- [ ] every slice-1 surface in table A passes its tier; `dialogSize.test.ts` asserts that each `DIALOG_SIZE_SURFACES` entry's file passes a `size` from its registered sizes and no `maxWidth`
- [ ] the `modal-maxwidth` row is registered in THR-1821's ratchet with the definition in § 6, and `npm run check:ui-debt` reports it at 7
- [ ] `RevealCard.Consequences` renders every chip; `RevealCard.test.tsx` updated
- [ ] the Chapter Ledger renders in `SheetColumns` at L; a jsdom test covers the newest row selected on open, the fail-soft line on a null record, and a live row's step label agreeing with its chapter after the rows recompute
- [ ] browser evidence at **1920×1080 and 2560×1440** (Playwright DOM): screenshots of the doom clock, a three-card offering (`__DEBUG.forceOffering()`; `OFFERING_SIZE` is 3, so it opens at M) and the Chapter Ledger; the four-card row is covered by a jsdom test of the gift modal's tier choice; console output; `await window.__DEBUG.getDialogSizes()` with `scrollingBelowCap` empty on each; a UI-Laws judgement line (Laws 1, 13/14, 17, 21, 33, 37, 57)
- [ ] docs updated with the code: `tokens.md` § Dialog sizes, `primitives.md` § 6 Modal (API; the rule "`maxWidth` never exceeds 900px" is replaced by the tiers) and § 10 RevealCard, `component-selection.md` (modal rows and the viewport-zone row), `layout-zones.md` § Modal Layer, `wiring-checklist.md` § Dialog sizes, the `frontend-ui` skill's modal lines (or a follow-up issue if the skill edit is refused)
- [ ] `npm test`, `npm run check:typecheck` (the `JourneyVignetteModal` error leaves the baseline; `--update` last), `npx vite build` pass; `npm run gate -- --final` verdict pasted
- [ ] Closing commit body includes `Fixes THR-1820` on its own line

## Coordination block

**Suggested model:** opus — a shared primitive with 24 importers, a new layout primitive, twelve surface migrations, two sibling contracts (THR-1819 tokens, THR-1821 ratchet) and browser evidence at two screens.

**Parallel-safe with:** THR-1822 (view-model seam: `src/engine/views/`, no UI primitive or CSS overlap); THR-1821's Chip and Icon slices (they do not edit `Modal.tsx`, `RevealCard.tsx` or the slice-1 surfaces' sizing).

**Mutex with:** THR-1819 — both edit `src/index.css`'s `:root` blocks and `src/components/shared/Modal.tsx` (also its blocker). THR-1821's Overlay slice (its own ticket, filed at THR-1821's handoff) — it re-bases `src/components/shared/Modal.tsx` on `Overlay` + `Panel`; whichever runs second merges onto the other. THR-1821 itself — `scripts/ui-debt-rows.ts` and `ui-debt-baseline.json`, where this executor registers `modal-maxwidth` (also its blocker).

**Blocked by:** THR-1819 (the tier blocks, the root step-up and `--modal-max-h` this plan's styles read); THR-1821 (the ratchet script this plan registers its row in).

**Files to touch:**
- Create: `src/components/shared/dialogSize.ts`, `src/components/shared/SheetColumns.tsx`, `src/components/shared/__tests__/dialogSize.test.ts`, `src/components/shared/__tests__/SheetColumns.test.tsx`
- Edit: `src/index.css` (size tokens), `src/components/shared/Modal.tsx` (`size`, context, `modalPanelStyle`), `src/components/shared/RevealCard.tsx` (`size`; constants retire), `src/components/shared/index.ts` (exports), `src/components/Game/{EventPopup,DivineReceiptModal,OmenDetail,DoomClockDetail,MandateDetail,AscendantBeatModal,ChapterLedger,ReadTheThreadsPanel,JourneyVignetteModal}.tsx`, `src/components/ThreadingRite/ThreadingRite.tsx`, `src/components/StartPage/{SettingsModal,CreditsModal}.tsx`, `src/components/StyleGuide/StyleGuide.tsx`, `src/engine/chapterArchive.ts` (`CHAPTER_LEDGER_PAGE_SIZE` at `:61` and its doc-comment table at `:16`), `src/data/ui-content.ts` (the Ledger's fail-soft line), `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, THR-1819's layout-contract module and its parity test (token rows), `scripts/ui-debt-rows.ts` + `ui-debt-baseline.json` (the `modal-maxwidth` row), tests `Modal.test.tsx`, `RevealCard.test.tsx`, `typecheck-baseline.json`, the docs listed in § Done when

## Notes for the executor

- **Do not touch** tables B and C surfaces beyond the `JourneyVignetteModal` one-word fix: they are deleted by THR-1827 / THR-1829 builds (brief rule 10).
- **Do not touch** the slice-2 hand-built dialogs (`SettingsPanel`, `ChoiceSetModal`, `ScryOverlay`, the Codex overlay, `HarvestScreen`, `WarmStartOverlay`); they belong to THR-1821's Overlay slice and then THR-1880. The court and the Codex are **dialogs** (THR-1829's three homes, brief rule 7), whatever THR-1821's draft calls them; that conflict is on record on THR-1821 and THR-1880, and THR-1880 settles it with THR-1821's executor.
- **Names from sibling plans.** `--modal-max-h`, the tier names and `layoutContract.ts` come from THR-1819's merged plan. `scripts/ui-debt-rows.ts`, `ui-debt-baseline.json` and the row name `modal-maxwidth` come from THR-1821's draft. If THR-1821's merged plan renamed any of them, use the merged name; the values and definitions here do not change.
- **The gift row:** the four-card M fit relies on the hand's card gap (`NudgePhaseShell`'s row of four, 876 px). If `RevealCard.Frame`'s side chrome leaves less than 876 px inside 960, narrow the gap, do not widen M.
- **The Chapter Ledger reader** keeps `ChapterView` as it is (the right column); the "Back" button is hidden in the two-column layout (the index is already visible) and kept in the one-column `embedded` mode. Store the selection as the row key and derive the record from the current rows (memoised on the rows), not as a `ChapterRecord` snapshot. A jsdom test covers: newest row selected on open; a click on a row whose record is null shows "This chapter has no record to show yet."; a live row's step label and its chapter agree after the rows recompute.
- **`.claude/skills/frontend-ui/SKILL.md`** still says "Max-height 75vh, default max-width 600px". THR-1819 fixes the height; this plan owns the width line. If the skill edit is refused in your session, file a small follow-up issue and say so in the closeout.
- **Law 57 is already in `laws.md`** (this plan's docs PR). Do not re-add it; the build's PR adds the line "machine check: `__DEBUG.getDialogSizes()`" to `tokens.md` § Dialog sizes, not to the law.
- 2560×1440 browser capture: resize the Playwright page to 2560×1440 before capture and report the measured `innerWidth` / `innerHeight`.

## Intent-judge verdict

**Allow** (fourth run, 2026-10-14; cold Opus judge; impact class High-risk, the explicit sign-off being Christian's chat ratification of Law 57 recorded on THR-1820). History, each finding fixed in this doc before the next run:

1. **Revise.** Fixes made:
   - Player-facing text: added the Threading Rite reveal, the Chapter Ledger's live row, and the four-card gift narrowing.
   - The ratchet count against `RevealCard`'s forwarding: `RevealCard` now replaces `maxWidth` outright.
   - The human gate is recorded on THR-1820.
   - The impact class is corrected to High-risk.
2. **Revise.** Fixes made:
   - PC-8 on a Ledger row click: a click always answers, with a quoted fail-soft line.
   - The selection is a row key, so a live row's step and its chapter agree.
   - Prose-pipeline and player-controls lines added to § Wiring.
3. **Revise.** Fixes made:
   - Player-facing rows for every slice-2 surface, including the court pickers' "Back to the court".
   - The THR-1821 ceremony-versus-dialog conflict for the court and the Codex is recorded in § 7, § Slicing and the notes.
4. **Allow**, with 1 GAP on dimension 3 (prerequisite health). It is fixed after the verdict by the § Wiring "Prerequisite health" line. Two further recommendations were also applied: the Settings classification line in § 7, and the offering lever (`forceOffering` gives three cards, so M) in § Done when.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14 (three independent Sonnet auditors, one message). They read the doc after the intent judge's second run. The later fixes only added player-facing text rows, § Wiring lines and conflict notes; no NFP, pillar or Vision claim changed.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS-with-note | Every width is a named token per screen (`--dialog-s-w` … `--sheet-gap`). `BEAT_MODAL_M_MIN_CARDS`, `DIALOG_CAP_TOLERANCE_PX` and `CHAPTER_LEDGER_PAGE_SIZE` are named constants. Note: each width lives in three places (`index.css`, `DIALOG_SIZE_FALLBACK`, the layout-contract tables), kept in step by parity tests. |
| 2. Inspectability | PASS | `data-dialog-size` on every panel. `__DEBUG.getDialogSizes()` reports tier, measured size, cap and `scrollingBelowCap`. The surface registry is data. The Wiring table and a new "Dialog sizes" checklist section are specified. The "no engine trace" claim holds. |
| 3. Determinism | PASS | "Fixed values per tier, not `min(px, vw)`". The only viewport-relative term is the gutter clamp, a pure function of viewport size. No PRNG. |
| 4. Fail-soft | PASS | The fail-soft table covers a missing token (`var()` fallbacks), a narrow viewport (clamp), an unknown `size` (treated as `'s'`), no `SheetLayoutContext` provider (stacked layout), a Ledger record that fails to build (next row selected), and no open dialog (`open: []`). |
| 5. Narrative over mechanical | PASS | Presentation only; no mechanic-versus-story tension arises. The Chapter Ledger reading beside its index keeps the story and the record in view together. |
| 6. Additive over destructive | PASS-with-note | `Modal` keeps `maxWidth` as deprecated. Note: `RevealCard`'s `maxWidth` prop, `REVEAL_CARD_MAX_WIDTH` and `REVEAL_CONSEQUENCE_CHIP_MAX` are removed outright, along with their `shared/index.ts` exports, rather than deprecated. A four-card gift narrows 1008 to 960 px. `CHAPTER_LEDGER_PAGE_SIZE` changes from 25 to 40. |
| 7. Performance budget | PASS | CSS tokens plus one context value. The debug report runs only on request. The page-size change renders 40 index rows. The newest row's chapter is built on open. No profiling-sensitive path is touched. |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | Presentation only. It names the one engine-file change, `CHAPTER_LEDGER_PAGE_SIZE` 25 → 40 at `chapterArchive.ts:61`. Its only reader is `ChapterLedger.tsx:197-201`; confirmed against the source. |
| Content | N/A-with-rationale | No new player words. The Player-facing text table covers the removed `+N` / "N more" strings and the Chapter Ledger, and maps them to PC-1, PC-4 and PC-6. |
| UI | present-and-substantive | Covers Law 57, four size tiers with tokens, the `Modal` / `RevealCard` API, `SheetColumns`, and a migration list split into slices; the ratchet row, `getDialogSizes()`, the Playwright DOM evidence plan, and the Law 29 styleguide entry. |

No missing required sections. Blast Radius is conditional and correctly omitted (`Modal` has 24 importers). Wiring: the table ties the tokens, `dialogSize.ts`, `Modal`, `SheetColumns` and `__DEBUG.getDialogSizes()` to UI components and debug visibility; "none" for orchestrator phase, GameState and trace is justified for a presentation-only plan; the "Dialog sizes (THR-1820)" checklist section is scheduled for slice 1 and listed in Done when. Substrate check: N/A (no Engine pillar).

PILLAR AUDIT: PASS-with-notes

### Vision audit

- `02-non-negotiables.md` → "Narrative over mechanical perfection" — **confirmed** (the Chapter Ledger reads beside its index, so the story and its place in the record stay on one screen). `00-north-star.md`, `01-core-loop.md`, `03-design-tensions.md`, `taste-profile.md` → not referenced. "The Map Is the Table" is a UI-direction decision, not a Vision file — silent, consistent.
- No contradictions found.
- North star: no conflict. Core loop: no conflict (selecting a Chapter Ledger row is read-only and never opens or resumes a live encounter). Non-negotiables: no conflict. Design tensions: none engaged (the Law 57 / Law 36 ordering is a UI-law question the plan resolves). Taste profile: not engaged; Christian ratified Law 57 in chat on 2026-10-14.
- Notes: the Vision checkbox cites no Vision file by path; checks rest on the `vision-audit` script report and the plan text.

VISION AUDIT: PASS-with-notes
