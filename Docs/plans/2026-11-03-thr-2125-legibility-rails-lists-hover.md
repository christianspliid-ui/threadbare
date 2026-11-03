> **title:** Legibility 4 — the god rail, the Ledger rail, lists and the hover tier (THR-2125)
> **linear_issue:** THR-2125
> **author:** Claude Code (design lane, unattended, 2026-11-03 — run 2026-11-03d)
> **created:** 2026-11-03
> **three_pillars:** Engine N/A — no file under `src/engine/`, `src/types/` or `src/data/` logic changes · Content: two label strips become sentences ("Your First is …", "Your primary sphere is …") · UI done

# Legibility 4 — the god rail, the Ledger rail, lists and the hover tier (THR-2125)

*The god rail's spendable numbers are the same size as every caption around them, and two of its lines are "Label: value" strips. In the Ledger rail the mortal you act on is named in 17 px uppercase Cinzel and cut to "KAEL T…", inside a frame inside a frame. "Threads" and "Chronicle" head the rail two different ways. Tooltips and the hover card draw Cinzel below its 22 px minimum. This slice puts the rails, the list rows and the hover tier on the ladder the other three slices use.*

## Why this is load-bearing

Christian's period focus (chat, 2026-11-01): *"legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels"*. The closed map [UI legibility and usability](https://linear.app/threadbare/issue/THR-2114) decided the rules and carved four plan docs. [Legibility 1](https://linear.app/threadbare/issue/THR-2122) shipped the shared blocks (`6b65b44b`). [Legibility 2](https://linear.app/threadbare/issue/THR-2123) and [Legibility 3](https://linear.app/threadbare/issue/THR-2124) are in Ready for Dev. This is the last one. Its blockers, Legibility 1 and [art-led slice 7](https://linear.app/threadbare/issue/THR-2103), are Done.

Measured on `main` @ `c87a8c94`:

- **Already shipped, not re-planned.** "Your cards" is `SectionLabel` with an inline count (`HandSection.tsx:233`, Legibility 1 U3.4). `SectionHeading` renders "Agents · 1", not "Agents (1)" (`SectionHeading.tsx:20`, `Section.tsx:72`). The hover card already puts its picture beside a kind-above-name block (`HoverCard.tsx:97–100`, art-led slice 7 decision 5).
- **The god rail's numbers are caption-sized.** `essence-balance-*` is `--text-xs` 600, tabular, right-aligned (`EssenceBlock.tsx:213–218`): right shape, wrong size.
- **Two label strips (Law 16).** `godRailComponents.tsx:76` draws `{YOUR_FIRST_LABEL}:` before the First's chip; `:100–107` floats `{ESSENCE_PRIMARY_LABEL}: Mind` to the far right of the Essence heading (`marginLeft: 'auto'`). The census measured the second gap at 134 px. The Essence heading is a local `labelStyle` span (`:55–60`, `:96–99`), a fourth spelling of the label rule.
- **The thread row's name.** `ThreadsPanel.tsx:547–561`: `className="truncate"`, `var(--font-display)`, `fontSize: 17` for agents (`--text-xs` for other kinds: Cinzel at 16 px), uppercase, `letterSpacing: '0.04em'`, `flex: 1`. The sustained-control row's name is Cinzel at `fontSize: 15` (`:988–990`). The champion chip and the Aspect badge are `fontSize: 11` italic (`:687`, `:711`).
- **Frame depth 4.** `ThreadsPanel.tsx:1130, :1159`: `className="panel"`, which is a 1 px `--border-subtle` box (`index.css:712–715`), inside the rail, around entry cards that draw their own border (`:503–508`), around the "Asks you" toggle's pill (`:338`).
- **Three rail heads, three ways.** "Threads" is Cinzel `--text-lg` 700 (`ThreadsPanel.tsx:1161–1173`, again at `:1131–1141` for the empty state). "Chronicle" is `LABEL_STYLE` (`ChroniclePanel.tsx:529–534`), inside a box with a gold border and its own background (`:517–520`). "Before you woke" is gold 700 (`:183–189`).
- **List row names are 400.** `ListRow.Title` is `--text-sm`, no weight (`ListRow.tsx:12–25`): Chronicle, Notables and Rivals rows use it.
- **The hover tier.** The tooltip heading is `var(--font-display)` at `--text-xs` 600 gold (`Tooltip.tsx:574–583`). The hover card's name is `fontSize: '1.05rem'` (`HoverCard.tsx:113–118`), and its subtitle is a third 700 line in label colour (`:120–128`).
- **Importers:** `shared/Tooltip.tsx` 69, `shared/ListRow.tsx` 6, `shared/HoverCard.tsx` 3 (`grep -rlE` over `src`, tests excluded). No Blast Radius section is owed.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| God rail (`AscendantBar`, `frame/godRailComponents.tsx`, `ascendant-bar/EssenceBlock.tsx`) | 🟢 ACTIVE | extends: balance size, two sentences, one heading spelling |
| Ledger rail (`ThreadsPanel`, `ChroniclePanel`, `frame/LedgerRail.tsx`) | 🟢 ACTIVE | extends: one rail Title, row names, frames |
| List rows (`shared/ListRow.tsx`) | 🟢 ACTIVE | extends: the row name is Text 700 |
| Hover tier (`shared/Tooltip.tsx`, `shared/HoverCard.tsx`) | 🟢 ACTIVE | extends: faces and sizes onto the ladder |
| List debug reader (`Game/listDressing.ts`, `getListDressing()`) | 🟢 ACTIVE | extends: `rowName`, `frameDepth` |

## Decisions this plan builds on

The design lane decided all four under delegation (process.md rule 4) on 2026-11-01. Each passed its veto window with no veto.

- [Panel anatomy](https://linear.app/threadbare/issue/THR-2117/panel-anatomy-one-reading-order-that-every-core-panel-follows) ([audit](../audits/2026-11-01-ui-panel-anatomy.md)): § 2, a list row's name is its whole job and never the part that truncates; § 5, the hover card's second line is Now.
- [Type hierarchy](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) ([audit](../audits/2026-11-01-ui-type-hierarchy.md)): § 3.1, rail Title `--text-lg` and a row name as Text 700; § 3.3, the god rail, Ledger rail and tooltip rows.
- [Text positions](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit) ([audit](../audits/2026-11-01-ui-text-positions.md)): rule 1, Law 16 first ("Your First: Kael" becomes a sentence); rule 3, numbers right-aligned and tabular; rule 6, badges after their word.
- [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) ([audit](../audits/2026-11-01-ui-modules-and-composition.md)): § 3, the Threads panel loses its frame; § 4, the same block on every surface and rails no denser than a docked page.

**Decided in this plan** (by the lane, under the same delegation, as consequences of the decisions above):

1. **The two strips become sentences.** "Your First is" + the First's chip. "Your primary sphere is Mind." on its own line under the Essence heading, in the caption style the rail already uses. *Would change it:* Christian preferring the label above ("Your First" over the chip); that is one style change, no new words.
2. **The Chronicle loses its box too.** Modules § 3 names the Threads panel. The Chronicle's gold-bordered box is the same case (a section of the rail, not a thing you press), and leaving it would draw the two rail sections two ways. Both are grouped by the rail Title and the space between them. *Would change it:* a tester losing where Threads ends and the Chronicle begins; the fallback is a `--border-subtle` rule above the Chronicle's Title, not a box.
3. **"Before you woke" is a Label, not gold.** It is a group head inside the Chronicle (Type hierarchy § 3.3), and gold is the god's attention (Law 31).
4. **The tooltip stays a one-size surface.** Its heading becomes Alegreya Sans 700 at `--text-xs`, gold kept. The census found tooltips already within rule 11 at one size. Raising the heading to `--text-sm` would make the doom tooltip's two-line heading wrap to three.
5. **A long row name wraps; it is never cut.** The thread name wraps to a second line; the marks after it keep their size.
6. **The hover card's Now is the page's R5 headline.** The anatomy asks for the subject's most important current state, and the Inspector already names exactly one per page (R5). The hover card reuses it rather than inventing a second source. *Would change it:* a playtest showing the want reads as a fact about the place or person rather than its state; the fallback is no Now line on the hover card.

## UI pillar

Screenshot tool: Playwright (DOM; nothing on the WebGL map changes).

### R1 — god rail (`frame/godRailComponents.tsx`, `ascendant-bar/EssenceBlock.tsx`)

1. `essence-balance-*`: `fontSize: 'var(--text-sm)'`; weight 600, tabular figures and right alignment stay. `minWidth: 22` becomes `minWidth: '2ch'`, so the column scales with its size.
2. The Essence heading becomes `<SectionLabel label={ESSENCE_LABEL} icon={icon} flush />` (Legibility 1's one heading). The local `labelStyle` constant is deleted.
3. Under it, before `SeatLine`, a line `data-testid="god-rail-primary"`: `{ESSENCE_PRIMARY_LEAD} ` + the existing `Tooltip`-wrapped sphere word + `.` In `--text-xs`, `--text-secondary`; the sphere word stays primary 700.
4. `god-rail-your-first`: `{YOUR_FIRST_LEAD} ` + the chip or link, no colon. Its `paddingLeft: 8` goes, so it shares the rail's one left edge (Text positions rule 2).
5. Literal gaps in the two bodies (`gap: 4`, `6`, `8`) become `var(--space-1)` / `var(--space-2)`. Between rail sections, `.bar`'s `gap: 12px` becomes `var(--space-6)` (Modules § 2, docked density).

### R2 — Ledger rail (`ThreadsPanel.tsx`, `ChroniclePanel.tsx`, new `frame/RailTitle.tsx`)

1. **One rail Title.** `RailTitle({ icon, children })` draws today's Threads title: `--font-display`, `--text-lg`, 700, `--text-primary`, the `ListHeadingIcon` before the words, `paddingBottom: var(--space-2)`. It sets `data-rail-title`. Threads (both states) and the Chronicle use it; the Chronicle's `Tooltip` wraps it as it wraps the label today.
2. **Frames.** Threads' two `className="panel"` go, and so does their padding (the rail already pads). The Chronicle's container drops `background`, `border`, `borderRadius` and `padding`; `gap` becomes `var(--space-3)`. `LedgerRail`'s column gap between the two becomes `var(--space-6)`. Entry cards keep their border: each is one thing you press. The toggle is a control, so it does not count.
3. **The thread row's name** (`:547–561`): `fontFamily: 'var(--font-body)'`, `fontSize: 'var(--text-sm)'`, `fontWeight: 700`, no `letterSpacing`, no `textTransform`, for every category. The `truncate` class goes; the name takes `flex: '1 1 auto'`, `minWidth: 0`, `overflowWrap: 'anywhere'`; the marks after it keep `flexShrink: 0`. It sets `data-row-name`. The sustained-control row's name (`:988–996`) takes the same treatment.
4. The champion chip and the Aspect badge: `fontSize: 'var(--text-xs)'`; italics and letter-spacing go.
5. "Before you woke" becomes `SectionLabel` (no `gold`), inside its existing `Tooltip`.

### R3 — list rows (`shared/ListRow.tsx`)

`Title` gains `fontWeight: 700` and `data-row-name`, and takes the thread row's wrap rule (decision 5): `whiteSpace`, `overflow` and `textOverflow` go, `overflowWrap: 'anywhere'` comes in. Chronicle, Notables and Rivals rows read a bold, whole name in front of their subtitle (Type hierarchy § 3.1, "700 for the row's name"; Panel anatomy § 2).

### R4 — hover tier (`shared/Tooltip.tsx`, `shared/HoverCard.tsx`)

1. Tooltip heading: `fontFamily: 'var(--font-body)'`, `fontWeight: 700`; size and gold stay (decision 4). It sets `data-tooltip-heading`.
2. Hover card name: `fontSize: 'var(--text-sm)'` (from 1.05rem), 700, `data-row-name`.
3. **The sub-kind joins the kind label** (Panel anatomy § 5). The kind line reads `{page.kindLabel} · {page.subtitle}` in the label rule, the kind keeping its sphere colour and the subtitle `--text-tertiary`; the separate subtitle line goes. An empty subtitle draws the kind alone.
4. **The Now line is the page's one highlighted line** (decision 6). Under the name, the hover card draws the `headline` of the first section in `page.sections` that carries a `highlight` (art-led R5; at most one per page): `--text-sm` 400, `--text-secondary`, its `highlight.icon` before it at `size="floor"`, `data-hover-now`. For a mortal that is their strongest want ("Seek Revenge", "Found a Dynasty", `personRows.ts:431–444`); for the god it is the Mandate's name (`pageResolvers.ts:181`). The third producer is the faction page, whose headline is the faction's own name (`detailPageResolvers.ts:642`): a headline equal to `page.displayName` (trimmed, case-insensitive) is skipped, so a faction's card has no Now line and its "How they hold her" section renders as today. No usable highlight → no Now line, nothing drawn in its place (Panel anatomy § 1, "leave it empty").
5. The body section the card already shows (`HOVER_CARD_MAX_SECTIONS = 1`) renders without its `highlight` when that headline was promoted, so the card never says it twice.

### R5 — debug reader (`Game/listDressing.ts`, `src/debug-bridge.d.ts`)

`DebugListDressing` gains `rowName: { family: string; sizePx: number; weight: number; clipped: boolean } | null`, read from the surface's first `[data-row-name]` (`clipped` = `scrollWidth > clientWidth`), and `frameDepth: number`: the count of bordered ancestors between that row and the surface root, the row's own border included (THR-2120 § 3 counting; controls excluded because they are not row ancestors).

### Player-facing display

On the god rail the essence numbers are a step larger than the words around them, so the pools you can spend read first. "Your First is Kael Thornweaver" and "Your primary sphere is Mind." read as sentences. In the Ledger rail, "Threads" and "Chronicle" head the rail the same way and neither sits in a box. The mortal's name in a thread row is bold and whole, not capitals cut short. List names are bold. Tooltip headings and the hover card's name use the game's plain face, and the hover card's second line reads as what is going on with its subject.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| God rail, after the bond | "Your First is Kael Thornweaver" (was "Your First: Kael Thornweaver") | PC-1 (unexplained terms: a label strip, Law 16); PC-6 | A sentence that names the First. The same name, with the same chip, heads the Threads row and the First's Inspector page |
| God rail, Essence | "Your primary sphere is Mind." on its own line (was "Primary: Mind" at the heading's far edge) | PC-1 | Which pool is the god's own, said once. The explanation lives where it does today: the sphere word keeps its `sphere.mind` tooltip (`godRailComponents.tsx:103`), which `tooltipResolver.ts:120–131` fills from `creation.mind` in `world-model.json`: "Mind" / "The sphere of thought, perception, memory, consciousness, and intellect. …" (truncated by `truncateDescription`) |
| Champion chip, Aspect badge | Unchanged words (the row's `championLabel`, "Aspect"), 11 px italic → 16 px upright | PC-6 | Readable at the floor (Law 11) |
| Chronicle, Notables, Rivals rows | Unchanged names, now bold (700) | PC-6 | The row's name leads |
| Hover card, kind line | "Actor · Gatekeeper of the Iron Market · sworn to Order" (was two lines, "ACTOR" then the role) | PC-6 | What it is, in one label line |
| Hover card, Now line | A mortal's strongest want, e.g. "Seek Revenge"; the god's Mandate name; nothing for a subject with no highlighted line | PC-1 | What is going on with it, before opening its page. The same words head the R5 line on that subject's Inspector page |
| Hover card, faction | No Now line (its headline is its own name); the card's body keeps "How they hold her" as today, e.g. "They have not yet noticed her." | PC-6 | The name is said once |
| God rail, pools | Unchanged numbers ("42"), 16 px → 18 px | PC-1, PC-6 (the same fact shown the same way) | The spendable amounts read first. The explanation is unchanged: each row's hover (`essenceRowHover`, `godSheet.ts:192–214`) opens on the refill word, then the sphere's role, e.g. for Mind "The inward eye. Sphere of thought, memory, intent. What it sees, it keeps; what it keeps, it carries." (`ascendant-bar-content.ts:42`), then the trend word. The same balance is read by the god's Inspector page from the same `godSheet` rows, so the figures match |
| Threads row | "Kael Thornweaver" in bold sentence case (was "KAEL T…") | PC-6 | The row's whole name |
| Chronicle | "Chronicle" as the rail title; "Before you woke" as a plain label (was gold) | PC-6 | Two rail sections headed the same way |
| Tooltips, hover card name | Unchanged words; face, size and weight change | PC-6 | Same order, plainer face |

### UI Laws engaged

Law 1 (identity chips unchanged), Law 13 (no numeral added; the balance is an existing persistent-chrome number), Law 16 (two label strips become sentences), Law 17 (tooltip contents unchanged), Law 21 (chips and links unchanged), Law 31 (gold leaves "Before you woke" and the Chronicle's border), Law 33 (both rails keep their fold at 1920×1080, see kill criteria), Law 36 (counts unchanged), Law 37 (rail chrome holds still), Law 57 (rail geometry unchanged; Threads still scrolls inside its share).

### Playtest signal

- Asked what they can afford, a tester answers from the god rail's numbers without hovering a row.
- A tester names their First in full from the Threads row without opening their page (no "KAEL T…" in their notes).
- A tester who hovers a mortal's name can say what that mortal wants without opening the page, and does not read "Seek Revenge" as an action offered to them. If one does, decision 6's fallback applies.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

No new events; nothing changes on the map. Debug: `getListDressing()` gains `rowName` and `frameDepth` (R5).

## Canon pillar (lands in the same PR)

1. **`Docs/design-system/typography.md`** § The ladder: the rail row (rail Title `--text-lg` Cinzel; row names Text 700; essence balance Text 600 tabular), and "tooltip headings are Alegreya Sans 700; Cinzel is never drawn below `--text-lg`".
2. **`Docs/design-system/layout-zones.md`** § God rail and § Ledger rail: one rail Title per section, no section box, "a row's name wraps and is never truncated".

## Content pillar

Two constants change in `src/data/frame-content.ts`: `YOUR_FIRST_LABEL = 'Your First'` becomes `YOUR_FIRST_LEAD = 'Your First is'`, and `ESSENCE_PRIMARY_LABEL = 'Primary'` becomes `ESSENCE_PRIMARY_LEAD = 'Your primary sphere is'`. Each has one caller (`godRailComponents.tsx:76, :102`; `grep -rn` over `src`). No other words change. UL: "First" and "sphere" are existing terms. Encounter templates, prose tables and attachment content: N/A, none is touched. Data tables: N/A beyond these two string constants.

## Engine pillar

N/A. Every change is in `src/components/`, `src/data/frame-content.ts` (two strings), `src/debug-bridge.d.ts` and canon. No file under `src/engine/` or `src/types/` changes, so the review gate's engine and types scope does not apply (THR-1949).

## Interface impact

| Contract | Disposition |
|---|---|
| `godRail` VM → god rail bodies | preserve: same fields read |
| `ThreadsPanel` / `ChroniclePanel` props | preserve |
| `DebugListDressing` | extend: `rowName`, `frameDepth` |

No cross-system read or write is added. `Docs/canon/interface-map.md` is unchanged.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| god rail, Ledger rail, `ListRow`, `Tooltip`, `HoverCard`, `RailTitle` | none | god rail, Threads, Chronicle, Notables, Rivals, every tooltip, the hover card | none | none | `getListDressing()` `rowName` / `frameDepth` |

The executor updates the Design Reference Wiki pages whose `sources` include the touched components; this change is not behaviour-neutral.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| Essence balance | `--text-sm` 600, `minWidth: 2ch` | existing token (Type hierarchy § 3.3) |
| Rail Title | `--text-lg` Cinzel 700 | existing token; `RailTitle` is its one spelling |
| Row name | `--text-sm` 700 Alegreya Sans | existing token |
| Between rail sections | `--space-6` | existing token (Modules § 2) |
| `YOUR_FIRST_LEAD`, `ESSENCE_PRIMARY_LEAD` | "Your First is", "Your primary sphere is" | renamed constants, `frame-content.ts` |
| `THREAD_NAME_MAX_LINES` | 2 | used only if the wrap kill criterion fires: the clamp on a thread name, in `ThreadsPanel.tsx` |
| Thread name `fontSize: 17`, sustained `15`, badges `11`, hover `1.05rem` | deleted | replaced by tokens |

## Tracing

N/A — a presentation change; nothing new happens in the simulation.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| No primary sphere | `god-rail-primary` is not drawn (as the right-hand span today) |
| No First yet | `god-rail-your-first` is not drawn (unchanged gate, Law 56) |
| Hover card subject with no highlighted section, or one whose headline is its own name (factions) | No Now line; the body section renders as today, highlight included |
| Empty `page.subtitle` | The kind line shows the kind alone, no trailing " · " |
| A surface with no `[data-row-name]` | `rowName` is `null` and `frameDepth` is `0`, never a throw |
| A name longer than two lines in a 340 px rail | it wraps to a third; see kill criteria |

## Kill criteria

- If at 1920×1080 on `?view=game&seeded&size=medium` the essence balance (including "53 / 55" once [The pool says how full it can get](https://linear.app/threadbare/issue/THR-2148) has merged) pushes a pool's bar below 24 px wide in the two-column grid, the balance stays `--text-sm` and the grid becomes one column. If that pushes the hand below one full card row, the balance goes back to `--text-xs` and the PR says so.
- If `--space-6` between rail sections leaves the hand less than one full card row at 1920×1080 at tick 0, the gap drops to `--space-5` (the Modules § 2 fallback).
- If any thread name in the census routes wraps to three lines, the name keeps two lines with `WebkitLineClamp: THREAD_NAME_MAX_LINES` and a `title` attribute carrying the whole name.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar present (two strings, one caller each)
- [x] UI pillar present (R1–R5 plus canon)
- [x] Wiring connects them (one row, the wiki pages)

## Vision audit

- [x] No Vision premise is contradicted. Prose-first UI holds: two label strips become sentences, and no number is added (vault `Vision/taste-profile.md`, "Prose-first UI, no numbers visible"; the essence balance is existing chrome). Art-led R1 holds: no picture changes size.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-03-thr-2125-legibility-rails-lists-hover-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Four px literals and two label constants become tokens and named sentences |
| 2. Inspectability | PASS | `rowName` and `frameDepth` reach the debug bridge |
| 3. Determinism | PASS | No simulation input |
| 4. Fail-soft | PASS | Fail-soft table above |
| 5. Narrative over mechanical perfection | PASS | Label strips become sentences |
| 6. Additive over destructive | PASS with note | Two constants are renamed (one caller each); two section boxes are removed, as decided |
| 7. Performance budget | PASS | DOM reads run only inside the existing debug reader |

## Done when

- [ ] `grep -n "fontSize: 17\|fontSize: 15\|fontSize: 11" src/components/Game/ThreadsPanel.tsx` prints nothing; `grep -n "font-display" src/components/shared/Tooltip.tsx` prints nothing; `grep -c "className=\"panel\"" src/components/Game/ThreadsPanel.tsx` prints 0; `grep -n "YOUR_FIRST_LABEL\|ESSENCE_PRIMARY_LABEL" -r src` prints nothing.
- [ ] A new test, `src/components/Game/__tests__/railsListsHover.thr2125.test.tsx`, asserts: (a) `essence-balance-*` has `fontSize` `var(--text-sm)` and tabular figures; (b) `god-rail-your-first` text starts "Your First is" with no colon, and `god-rail-primary` reads "Your primary sphere is Mind."; (c) a thread entry's `[data-row-name]` has `fontFamily` `var(--font-body)`, `fontWeight` 700, no `textTransform`, and no `truncate` class; (d) `threads-panel` has no `panel` class; (e) Threads and the Chronicle each render one `[data-rail-title]`; (f) `ListRow.Title` is weight 700 with no `textOverflow`; (g) the tooltip heading's `fontFamily` is `var(--font-body)`; (h) the hover card's name is `var(--text-sm)`; for a person page whose first section carries `highlight: { headline: 'Seek Revenge' }`, `[data-hover-now]` reads "Seek Revenge" at weight 400 and the body draws no `HighlightBlock`; for a page with no highlight, and for a faction page whose highlight headline equals its `displayName`, there is no `[data-hover-now]`; the kind line reads "Actor · <subtitle>".
- [ ] Existing god-rail, Threads, Chronicle, list-dressing, tooltip and hover-card tests pass, updated only where they pinned old sizes, faces, the colon or the box.
- [ ] Browser evidence (UI pillar, larger visible change). At 1920×1080 on `?view=game&seeded&size=medium`: the god rail, the Ledger rail, an essence tooltip, a hover card on a place name and a hover card on a mortal's name (the First's, from a Chronicle line). On the mortal's card, `document.querySelector('[data-hover-now]')` is present when their page has a known want, and absent on the place's card. One 2560×1440 screenshot of the Ledger rail. Console output with no new errors. A `__DEBUG` assertion: for the `threads` entry of `await __DEBUG.getListDressing()`, `rowName.clipped === false`, `rowName.weight === 700` and `frameDepth <= 2`; for `hover-card`, `rowName.family` contains "Alegreya". A DOM read of `essence-balance-*`'s computed size equal to the computed `--text-sm`. A UI-Laws judgment line for Laws 1, 13, 16, 17, 21, 31, 33, 36, 37, 57.
- [ ] The two canon files carry the edits listed under Canon pillar.
- [ ] `npm run gate` is green.
- [ ] The closing commit body has the close keyword for this ticket on its own line.

## Coordination block

**Suggested model:** sonnet. Eight files, all style edits with measured line anchors; the debug reader is the one piece of logic.
**Parallel-safe with:** [Legibility 2 — Inspector pages](https://linear.app/threadbare/issue/THR-2123) (inspector files only), [Legibility 3 — the Stage and the dialogs](https://linear.app/threadbare/issue/THR-2124) (Stage, dialogs, card face), [The answer comes here](https://linear.app/threadbare/issue/THR-2151) (veil and GameView).
**Mutex with:** [The pool says how full it can get](https://linear.app/threadbare/issue/THR-2148): both edit `ascendant-bar/EssenceBlock.tsx`, and the balance-fit kill criterion should be measured on its "53 / 55". Anything else editing `ThreadsPanel.tsx`, `ChroniclePanel.tsx`, `shared/Tooltip.tsx`, `shared/HoverCard.tsx`, `shared/ListRow.tsx` or `frame/godRailComponents.tsx`.

**Files to touch:**
- Create: `src/components/Game/frame/RailTitle.tsx`, `src/components/Game/__tests__/railsListsHover.thr2125.test.tsx`.
- Edit: `src/components/Game/frame/{godRailComponents,LedgerRail}.tsx`, `src/components/Game/ascendant-bar/{EssenceBlock.tsx,styles.module.css}`, `src/components/Game/{ThreadsPanel,ChroniclePanel,listDressing}.tsx|ts`, `src/components/shared/{ListRow,Tooltip,HoverCard}.tsx`, `src/data/frame-content.ts`, `src/debug-bridge.d.ts`, `Docs/design-system/{typography,layout-zones}.md`, the matching Design Reference Wiki pages.

## Notes for the executor

- Line numbers are from `main` @ `c87a8c94`; THR-2148 will move `EssenceBlock.tsx`. Anchor on the test ids.
- The identity strip's "Vara · Quintessence Rooted" line and the folded rows ("Reaches Eye · Blinkered") are not in this slice. A folded row is a list row in miniature (name, then state word), which the anatomy allows.
- The Threads group heads keep `ornamental`: the rule under them is a divider, not a frame.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Inspectability, Narrative and Performance PASS; Determinism N/A (presentation only). Notes: Tunability, the fallback two-line clamp was an unnamed literal; Fail-soft, no `frameDepth` fallback for a surface with no row; Additive, two constants renamed and two section boxes removed, as decided.

**Answer:** `THREAD_NAME_MAX_LINES` is in the Constants table; the fail-soft row now says `frameDepth` is `0`. The renames have one caller each and the boxes are decisions 2 and Modules § 3.

### Three-pillar audit

PASS-with-notes. Engine N/A with rationale; Content present (small); UI present and substantive. Note: the Content pillar did not mark the template's other content kinds N/A one by one.

**Answer:** added (encounter templates, prose tables, attachment content, data tables).

### Vision audit

PASS-with-notes. No contradiction. Note: R1 makes an existing number more prominent, which leans against "Prose-first UI, no numbers visible to the player", and the plan did not say why.

**Answer:** Law 13 sanctions the essence pool balances in persistent chrome; Type hierarchy § 3.3 set this size so the spendable state reads first (rule 16); and Christian chose "53 / 55" in that row himself ([The pool says how full it can get](https://linear.app/threadbare/issue/THR-2148), his (b) + (c) answer). No number is added, and mortal-facing magnitudes stay words.

### Intent-judge verdict

**Revise** ×3, then **Allow** (impact class Reversible, judge-confirmed). Run 1: the hover card's "Now" restyled the role subtitle instead of the anatomy's state line, and two changed surfaces had no player-text row. Fixed: the subtitle joins the kind label and Now is the page's R5 headline (decision 6). Run 2: the faction page's R5 headline is its own name. Fixed: a headline equal to the name is skipped; list row names wrap too. Run 3: tooltip words not quoted, playtest signal not log-checkable, no mortal hover in the evidence. Fixed: words quoted, three predicates, a mortal hover added. Run 4: **Allow**, 0 GAPs. "Your First is Kael Thornweaver" ends on a chip, so it carries no full stop; the sphere line ends on a word and does.
