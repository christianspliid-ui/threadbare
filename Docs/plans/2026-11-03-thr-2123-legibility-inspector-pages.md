> **title:** Legibility 2 — Inspector pages read Who, Now, Act, Detail, Out at every size (THR-2123)
> **linear_issue:** THR-2123
> **author:** Claude Code (design lane, unattended, 2026-11-03 — run dl-20261103-0218)
> **created:** 2026-11-03
> **three_pillars:** Engine N/A — the page picks its Now section from the view model it already gets; no file under `src/engine/` or `src/types/` changes · Content N/A — no sentence, label or tooltip changes · UI done

# Legibility 2 — Inspector pages read Who, Now, Act, Detail, Out (THR-2123)

*At wide and Full the name drops to the middle of the page under a centred portrait, and the one line that matters most sits wherever its tab put it. This slice puts the name first, the deciding line second and the Act row third, on every page kind at every size.*

## Why this is load-bearing

Christian's period focus (chat, 2026-11-01): *"legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels"*. The closed map [UI legibility and usability](https://linear.app/threadbare/issue/THR-2114) decided one reading order for every core panel. [Legibility 1](https://linear.app/threadbare/issue/THR-2122) (merged in #2721, `main` @ `fffad27e`) fixed the shared section blocks. This slice applies the order to the Inspector page itself.

Measured on `main` @ `fffad27e`:

- **The wide and Full header is centred, picture first.** `SubjectHeader.tsx:105`: `flexDirection: lead ? 'column' : 'row'`, `alignItems: lead ? 'center'`. `:111`: `textAlign: lead ? 'center'`. The where-line (`:135`) and the chips (`:147`) are also centred. The census measured the god page's name at *y* 446–458 under a 240×320 portrait ([census § Inspector](../audits/2026-11-01-ui-legibility-census.md), "First eye").
- **The wide title is off the ladder.** `:116`: `calc(var(--text-2xl) * ${PORTRAIT_NAME_SCALE})` with `PORTRAIT_NAME_SCALE = 1.25` (`:45`), which is 40 px at 1920. Nothing outside the file imports the constant (`grep -rn PORTRAIT_NAME_SCALE src` hits only `SubjectHeader.tsx`).
- **No Now slot exists.** The R5 highlight is an ordinary Overview section. On the person page it is `leading_ambition`, order 37 (`detailPageTemplates.ts:136`, `personRows.ts:436`). On the god page it is `mandate`, order 30 (`:547`, `pageResolvers.ts:181`). The R4 bond strip is `what_she_is_to_him`, order 11 (`:176`), first in the Overview tab. It sits in the main column at wide, not beside the name. Those are the only producers: `grep -rn "highlight:" src/engine/views` finds `personRows.ts:436` and `pageResolvers.ts:181`, plus the pass-through in `sentenceRows.ts:82`. Only `what_she_is_to_him` sets a `bond`.
- **Frames nest one level too deep.** The host `<aside>` is the surface (`InspectorHost.tsx:290`, `:319`: gold left border, gradient). `InspectorPage.tsx` then wraps the page in `<Panel level="panel">`, which draws its own border and `--bg-surface` (`Panel.tsx:63–65`). The census measured depth 4 on the person page (aside → article → "wants most" card / medallions).
- **Page-level gold remains.** The Act row heading is `SectionLabel gold={true}` (`InspectorParts.tsx:72`), and so is *In this land* (`:158`). Legibility 1 left both for this slice (its § Notes for the executor). Each land row's sub-label is secondary 700 (`:161`), a third heading rank.
- **Page slots sit 16 px apart** (`InspectorPage.tsx:230` `gap: '16px'`), while Legibility 1 put sections 24 px apart (`--space-6`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Inspector page renderer (`InspectorPage`, `SubjectHeader`, `InspectorParts`) | 🟢 ACTIVE | extends: Now slot, header order, frames |
| Detail-page section model (`types/detailPage.ts`, `shared/Section`) | 🟢 ACTIVE | preserve: reads `highlight`, `bond`, `visibleAt` as they are |
| Panel hierarchy (`shared/Panel`, `PanelLevelScope`) | 🟢 ACTIVE | reuses `PanelLevelScope` for the unframed docked page |

## Decisions this plan builds on

The design lane decided all four under delegation (process.md rule 4) on 2026-11-01. Each passed its veto window with no veto.

- [Panel anatomy](https://linear.app/threadbare/issue/THR-2117/panel-anatomy-one-reading-order-that-every-core-panel-follows) ([audit](../audits/2026-11-01-ui-panel-anatomy.md)): § 1 the five slots and "who comes first at every size", § 3 one left text edge and two heading ranks, § 4 what must sit above the fold.
- [Type hierarchy](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) ([audit](../audits/2026-11-01-ui-type-hierarchy.md)): § 3.1, the Inspector title at `--text-2xl` at every size and the Headline at `--text-lg`. § 3.2, one heading treatment and no gold section rank.
- [Text positions](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit) ([audit](../audits/2026-11-01-ui-text-positions.md)): § 4, the name above a large picture and the describing lines under it, left-aligned. § 6, subject chips go under the picture.
- [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) ([audit](../audits/2026-11-01-ui-modules-and-composition.md)): § 3, frames to depth ≤ 2, surface then card.

**Decided in this plan** (by the lane, under the same delegation, as consequences of the decisions above):

1. **The Now slot holds the page's highlight; the bond strip takes it only when there is no highlight.** Anatomy § 1 allows one line, "R5's highlighted line, or R4's bond strip when the tie to the god is the news". R5 is defined as "the one thing that matters most on a surface". On The First's page the bond never changes, while the ambition does and drives what she does next, so the ambition is the news. When the bond strip does not take Now, it stays first in Overview, as today. *Would change it:* Christian saying "the bond comes first on her page".
2. **The Inspector page draws no frame of its own when it is docked or wide.** The host aside is the surface. Inside it the page renders under `PanelLevelScope level="panel"` (so nested Panels still see their parent) with its padding and no border or background. At Full the host is a backdrop beside the trail, so the page keeps `Panel level="page"` and stays the surface. Each size then reads surface → card, where the card is the Now highlight or a tile.
3. **The Act row and *In this land* headings are ordinary section headings** (`gold={false}`). Law 31's one gold on a page is the Now highlight (Type hierarchy § 3.2). A land row's sub-label becomes a Text 700 row (`--text-sm`, primary), not a third rank.
4. **The page's slots sit `--space-6` apart**, the same between-block distance as sections (Modules § 2). The tab panel's top gap (`paddingTop: '10px'`, `:135`) becomes `--space-2`, the heading-to-body distance, because the tab row heads the Detail slot.

## UI pillar

Screenshot tool: Playwright (DOM only; the Inspector has no WebGL).

### U1 — `SubjectHeader.tsx`: Who first, left edge

1. At `lead` (wide and Full), the header is a left-aligned column: the kind label, then the `<h2>` name (and the mortal-shape suffix, the god-title line and the epithet), then the picture block (with the First badge), then the where-line, lede, chips and doing line. Drop `alignItems: 'center'`, `textAlign: 'center'` and both `justifyContent: 'center'`. The picture keeps `--inspector-portrait-w` and stays the largest object (R1).
2. The name is `--text-2xl` at every size. Delete `PORTRAIT_NAME_SCALE`; nothing imports it.
3. Docked is unchanged: thumbnail left, words right, their first line level with the picture's top (Text positions § 4).
4. Implementation: split the words block into a *who* part (kind, name, suffix, title line, epithet) and a *describes* part (where, lede, chips, doing). Docked renders picture | (who + describes) in a row. Lead renders who, picture, describes in a column. One component with two orders, not two components.

### U2 — `InspectorPage.tsx`: the Now slot

1. Add an exported pure function, `nowSectionOf(body, size): DetailSection | null`. It returns the first section visible at `size` (`sectionVisibleAt`) that has `kind === 'prose'` and a `highlight`. If there is none, it returns the first such section with a `bond`. Otherwise it returns `null` (decision 1).
2. `tabsAt` and `inAsideAt` callers skip the Now section, so it is drawn once. `hiddenForWidth` is unchanged: the Now section is visible, so it is never "hidden".
3. Docked order: header → Now → *In this land* (land only) → Act → body → More → Connections. Wide and Full aside: header → Now → *In this land* → Act → aside sections. The main column starts with the tab row.
4. The Now section renders through the same `<Section>` renderer, which already draws `HighlightBlock` or `BondStrip`. A `data-inspector-now` wrapper sits around it. No new component.
5. An empty Now slot renders nothing: no placeholder, and no chip promoted into it (anatomy § 1).
6. `InspectorDressingReport` gains `nowSection: string | null` (the typeId), and the existing `getInspectorLab()` / `getInspectorState()` readers carry it.

### U3 — frames, gold, rhythm

1. Decision 2: when `size !== 'full'`, `InspectorPage` renders the `<article>` itself, wrapped in `<PanelLevelScope level="panel">`, with the same padding, data attributes and flex style, and with no `panelStyle`. Full keeps `<Panel level="page">`.
2. Decision 3: `InspectorParts.tsx:72` and `:158` change to `gold={false}`. The `:161` sub-label becomes Text 700 (`--text-sm`, `--text-primary`, `marginBottom: var(--space-1)`).
3. Decision 4: `gap: 'var(--space-6)'` on the page columns. The tab panel's top padding becomes `var(--space-2)`. `blockStyle`'s `gap: '6px'` becomes `var(--space-2)`.

### U4 — the fold report

`InspectorPageReport` gains `fold: { who: boolean; now: boolean | null; act: boolean | null; tabs: boolean | null }`. Each value is true when that slot's element (`[data-inspector-header]`, `[data-inspector-now]`, `[data-inspector-act]`, the `role="tablist"` row) ends within the scroll container's `clientHeight`, read in the existing report effect. `null` means the slot is absent. The four reads run only when `onReport` is set (the lab and the host's debug report), inside the effect that already reports, so no extra layout pass is added to a page nobody inspects. This is how the Done-when sweeps anatomy § 4 over every kind without eyeballing screenshots.

### Player-facing display

At wide and Full every page now opens on its kind and name at the top left. The portrait sits below the name at the same size, with where, chips and doing under it on the same left edge. The name is 32 px instead of 40. The god's mandate and a person's leading ambition sit right under the name (docked) or under the portrait (wide), above the Act row. A bonded mortal with no known ambition shows the bond strip there. The page loses its inner border, so the docked Inspector reads as one surface. "Act on …" and "In this land" headings are tertiary like every other heading.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Every Inspector page | Unchanged words; only position, size and colour change | PC-6 (the same fact shown the same way) | Kind, name and Now line sit in the same place on every page and at every size |

No words change.

### UI Laws engaged

Law 1 (where-line identity chips unchanged), Law 5 (portrait stays 3:4), Law 8 (bond-strip faces still knowledge-gated), Law 13 (no numeral added), Law 17 (tooltips untouched), Law 21 (links unchanged), Law 25 (no new empty chrome: an empty Now draws nothing), Law 31 (one gold per page: the Now highlight), Law 33 (Who, Now, Act and the tab row above the fold at 1920×1080 docked), Law 37 (toolbar chrome unchanged), Law 50 (focus still lands on the heading), Law 56 (the bond strip still draws only while the thread holds), Law 57 (fit then fold unchanged; growth goes to Detail and Out).

### Playtest signal

A tester who widens the Inspector still names the subject before describing its picture. A tester can say what a mortal wants without opening a tab.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

There are no events and nothing on the map. Debug: `nowSection` and `fold` appear in `getInspectorLab()` and `getInspectorState()` (U2.6, U4).

## Canon pillar (lands in the same PR)

1. **`Docs/design-system/layout-zones.md`** § Inspector: the page order Who → Now → Act → Detail → Out at each size, decision 1's precedence, and the rule that an empty Now draws nothing.
2. **`Docs/design-system/entity-visual-header.md`**: a new paragraph on the Inspector header. At wide and Full the name goes above the lead picture, left-aligned, at `--text-2xl`, with the describing lines under the picture. Docked keeps the thumbnail beside the name. The file says nothing about this today.
3. **`Docs/design-system/layout.md` § Frames** (added by Legibility 1): a hosted page draws no frame inside its host. Inspector example: docked and wide host = surface, Full page = surface.

## Engine pillar

N/A. The Now section is chosen in the UI from fields the view model already carries (`highlight`, `bond`, `visibleAt`). The registry orders (11, 30, 37) stay. No file under `src/engine/`, `src/types/` or `src/data/` changes, so the review gate's engine and types scope does not apply (THR-1949).

## Content pillar

N/A. No sentence, label or tooltip changes.

## Interface impact

| Contract | Disposition |
|---|---|
| `SubjectPageVM` → `InspectorPage` | preserve: same fields read; the UI picks the Now section from `body` |
| `InspectorPageReport` → lab and `getInspectorState()` | extend: `fold`, `dressing.nowSection` |

No cross-system read or write is added. `Docs/canon/interface-map.md` is unchanged.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `SubjectHeader.tsx`, `InspectorPage.tsx`, `InspectorParts.tsx` | none | the Inspector at all three sizes, the lab | none | none | `getInspectorLab()` / `getInspectorState()`: `fold`, `dressing.nowSection` |

The executor updates the Design Reference Wiki page whose `sources` include `InspectorPage.tsx` or `SubjectHeader.tsx`, because this change is not behaviour-neutral.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| Page slot gap | `--space-6` (24 px) | existing token; the same as between sections |
| Tab row to first section | `--space-2` (8 px) | existing token; heading-to-body |
| Wide/Full title | `--text-2xl` (32 px) | existing token; replaces `PORTRAIT_NAME_SCALE` (1.25), which is deleted |
| `NOW_LINE_CLAMP` | unset (kill-criterion fallback: `2`) | lines the Now sentence may take before it clamps; named in `InspectorPage.tsx` only if the kill criterion fires |

## Tracing

N/A — a presentation change; nothing new happens in the simulation.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A page with two highlighted sections | `nowSectionOf` takes the first in body order; the second renders in its tab as today |
| The Now section is not visible at this size | `nowSectionOf` skips it; the slot is empty |
| A slot element is missing when the fold report runs | Its `fold` value is `null`, never a throw |
| A bond section whose faces are missing | `BondStrip` draws the kind marks, as today |

## Kill criteria

- If any kind's docked page at 1920×1080 puts the Act row or the tab row below the fold because of the Now slot (U4 reports `act` or `tabs` false), the Now section's sentence clamps to two lines (`-webkit-line-clamp: 2`) and the whole line opens in its tooltip. Record the kinds in the PR.
- If a playtest shows testers read the wide portrait before the name, anatomy § 7's first condition applies, and the call goes to Christian. Do not flip it back silently.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar present (U1–U4 plus canon)
- [x] Wiring connects them (one row, the wiki page)

## Vision audit

- [x] No Vision premise is contradicted. R1 holds, because the art still leads by size. The prose-first UI holds, because no number is added (vault `Vision/taste-profile.md`, "Prose-first UI, no numbers visible").
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-03-thr-2123-legibility-inspector-pages-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Literals become tokens; one off-ladder multiplier is deleted |
| 2. Inspectability | PASS | `nowSection` and `fold` reach the debug bridge |
| 3. Determinism | PASS | Pure selection in body order |
| 4. Fail-soft | PASS | Fail-soft table above |
| 5. Narrative over mechanical perfection | PASS | The mortal's want reads first |
| 6. Additive over destructive | PASS with note | No VM or type change. One unexported-elsewhere constant is deleted. The visible order changes, as decided |
| 7. Performance budget | PASS | One pass over `body`, memoised like `tabsAt` |

## Done when

- [ ] `grep -nE "lead \? .center." src/components/Game/inspector/SubjectHeader.tsx` prints nothing (the chip rows' own `alignItems: 'center'` stays), and `grep -c PORTRAIT_NAME_SCALE src -r` prints 0.
- [ ] A new test, `src/components/Game/inspector/__tests__/inspectorAnatomy.thr2123.test.tsx`, asserts the following. (a) At `wide`, the header's kind label and `<h2>` come before the picture in document order, and the `<h2>` font size is `var(--text-2xl)`. (b) `nowSectionOf` returns the highlight when a body holds a highlight and a bond, returns the bond when there is no highlight, and returns `null` for a body with neither. (c) A rendered person page puts `[data-inspector-now]` before `[data-inspector-act]`, and the Now section's typeId is absent from every tab panel. (d) At `docked`, `[data-inspector-page]` has no inline `border` or `background`; at `full` it does. (e) No `SectionLabel` on the page renders `var(--accent-gold)`.
- [ ] The existing `SubjectHeader.render.test.tsx` and `InspectorHost.render.test.tsx` pass, updated only where they pinned the old order.
- [ ] Browser evidence (UI pillar, larger visible change). At 1920×1080: `?view=inspector-lab` screenshots of the person page at docked and wide and the god page at wide. One 2560×1440 screenshot of the person page at wide. Console output with no new errors. A `__DEBUG` assertion: in `getInspectorLab()`, every docked cell has `fold.who`, `fold.act` and `fold.tabs` that are not `false`, and the person and god cells have a non-null `dressing.nowSection`. A frame-depth measurement of the person page at docked and wide in the lab: walk up from the deepest framed element (border on 3+ sides or background alpha > 0.04, ≥ 40×24 px; chips, buttons, medallions and images excluded, as THR-2120 § 3 counts) to the host, and expect ≤ 2. A UI-Laws judgment line for Laws 1, 5, 8, 13, 17, 21, 25, 31, 33, 37, 50, 56, 57.
- [ ] The three canon files carry the edits listed under Canon pillar.
- [ ] `npm run gate` is green.
- [ ] The closing commit body has the close keyword for this ticket on its own line.

## Coordination block

**Suggested model:** opus. The header has to keep two orders in one component, and the fold report reads layout.
**Parallel-safe with:** [Every card says what it buys](https://linear.app/threadbare/issue/THR-2147), [The pool says how full it can get](https://linear.app/threadbare/issue/THR-2148), [The answer comes here](https://linear.app/threadbare/issue/THR-2151) — none touches `src/components/Game/inspector/`.
**Mutex with:** [The sheet says what grew](https://linear.app/threadbare/issue/THR-2149) if it edits `InspectorPage.tsx` or `SubjectHeader.tsx`; anything else editing `src/components/Game/inspector/{SubjectHeader,InspectorPage,InspectorParts}.tsx`.

**Files to touch:**
- Create: `src/components/Game/inspector/__tests__/inspectorAnatomy.thr2123.test.tsx`.
- Edit: `src/components/Game/inspector/{SubjectHeader,InspectorPage,InspectorParts}.tsx`, the lab report reader in `lab/InspectorLab.tsx` if it filters report keys, `Docs/design-system/{layout-zones,entity-visual-header,layout}.md`, the matching Design Reference Wiki page.

## Notes for the executor

- `ActOnRow` passes `compact` and hides its heading at docked (`:72`). Keep that.
- The god-title line under a mortal shape is gold (`SubjectHeader.tsx:128`). It is identity, not a section, and is out of this slice.
- `RowCards.tsx:103`'s tray (gold left rule, raised background) opens under a pressed row, so it is a card under the surface (depth 2). Leave it.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability, Inspectability, Determinism, Fail-soft and Narrative PASS. Notes: (1) the kill-criterion clamp was an unnamed literal; (2) the fold report reads layout with no stated gate; (3) visible order and the inner frame change.

**Answer:** (1) `NOW_LINE_CLAMP` is now in the constants table. (2) U4 now runs the reads only when `onReport` is set, inside the existing effect. (3) Those changes are the decided rules (anatomy § 1, Modules § 3); no VM, type or prop is removed.

### Three-pillar audit

PASS-with-notes. Engine and Content N/A with rationale; UI present and substantive (U1–U4, canon, debug fold report). Wiring adequate. Notes: a duplicated Tracing sentence (fixed) and this section still pending at audit time.

### Vision audit

PASS-with-notes. No contradiction. It confirms the non-negotiable "mechanics through prose, never numbers" and the taste profile's prose-first UI. Soft note: putting the ambition ahead of the bond strip on The First's page leans slightly toward a systemic readout over the god–mortal tie (design tensions).

**Answer:** this is recorded as the veto line on decision 1. The bond strip still opens Overview on her page and still takes Now whenever she has no known want.

### Intent-judge verdict

**Allow** on the first run (impact class Reversible, judge-confirmed; 2 GAPs, 0 VIOLATIONs). Both GAPs were fixed. The "center" grep now targets only the lead branch, so the chip rows keep their vertical centring. The browser evidence now measures frame depth on the person page (the ticket's "depth 4 to ≤ 2").
