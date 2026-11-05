> **title:** The god-rail hand gets room — one-line card rows, a tighter pool row, and a hand floor the folded rows cannot take (THR-2177)
> **linear_issue:** THR-2177
> **author:** Claude Code (design lane, unattended, 2026-11-05 — run dl-20261105T1419Z)
> **created:** 2026-11-05
> **three_pillars:** Engine N/A — no file under `src/engine/` or `src/types/` changes · Content N/A — no player-facing word changes · UI done

# The god-rail hand gets room (THR-2177)

*At 1920×1080 the god rail shows two and a half cards of a five-card hand, and with one folded row open it shows none. A single card gets cut to a sliver. The fix: each card row becomes one line (name left, price right, as in a deck list), each essence row loses the 8 px its trend arrow adds, and the hand gets a floor of three rows that an opened folded row can never take.*

## Why this is load-bearing

Warm playtest round 3, the skimmer: *"It's a tiny window, about 3 cards tall … 12 cards in a slot that fits 3."* A second report, [the hand clips its only card](https://linear.app/threadbare/issue/THR-2176), found one card cut top and bottom with a scrollbar beside it. The hand is the god's main act surface. Christian's period focus (chat, 2026-11-01): *"legibility and usability of the different UI modules: are we using tried and true ux patterns"*.

## Substrate inventory

Measured, not inferred.

Deployed build (`a57d0a18`), `https://threadbearer.co/?view=game&seeded&size=medium&warm=150`, 2026-11-05 14:20Z, DOM reads in the in-app browser:

| At 1920×1080 | Height |
|---|---|
| rail (`.bar`, padding 14, gap `--space-6` = 24 px) | 1032 px |
| identity (pinned) | 157 px |
| essence (pinned): heading 24, primary line 24, Seat line 32, pool grid 234 (four grid rows of 50 px pool rows, two to a row, plus the refill key), Attention 24, inner gaps 8 | 374 px, plus 56 px while the essence first-use caption shows (430 measured) |
| hand (fill): header 24, rest line 24 (while a moment is open), Move/Investiture row 30, inner gaps 8 | 270 px, of which `hand-region` = 168 px |
| hand card row (`hand-card`): two lines, name `--text-sm` 700 + "Mind · 10 essence" `--text-xs` | 55 px, gap 6 px → 61 px per card |
| folded rows (four, closed) | about 128 px |

The ticket's 456 px essence figure and the 374 px here describe the same live layout: two pools to a grid row (`EssenceBlock.tsx:354`, `repeat(2, …)`), measured once with the first-use caption showing and once after it closed. After U1 and U4 the hand region with no moment open is about 232 px, against the 225 px six one-line rows need. That 7 px margin is thin, so the third kill criterion in the [intent proposal](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/.intent-proposals/2026-11-05-thr-2177-god-rail-hand-room.md) is a live risk.

So 168 px holds 2.75 card rows, and `data-hand-free-height` reads 0. With the caption showing, the hand region is 112 px. At 2560×1440 the hand region is 450 px (card 61 px, pool row 54 px), so the fault is at the floor.

Why each piece is the height it is:

- **A pool row is 50 px because of its trend arrow.** Line 1 (word + "59 / 60") is 22.5 px. Line 2 is the bar slot (`min-height: 8px`, `.essenceFillSlot`), but the trend arrow sits on that line at `--text-xs` with `lineHeight: 1` (`EssenceBlock.tsx:252`), so line 2 is 16 px. 4 + 22.5 + 3 + 16 + 4 = 49.5.
- **A card row is 55 px because it is two lines.** Name 23 px and price 23 px (`HandSection.tsx:136–157`), padding 4/4, border 1/1. One line of 22.5 px would make the row 32.5 px.
- **The folded block takes the hand.** `.foldedRows` is `flex-shrink: 0; max-height: 50%` (`styles.module.css:21–31`). The hand is `flex: 1; minHeight: 0` (`AscendantBar.tsx:244`). An open folded row grows to half the rail, and the hand, which has no floor, drops to 0 px.

One line is wide enough. The card's inner width is 263 px. Measured with canvas at the live fonts: the longest names in play are "Illuminating Whisper" 155 px and "Breath of the Sphere" 147 px (700 18 px), and the price "Mind · 10 essence" 107 px / "Spirit · 15 essence" 106 px (16 px). 147 + 8 + 107 = 262 fits. 155 + 6 + 106 = 267 fits only with the padding change in U1.

## Decisions (made by the design lane under delegation, 2026-11-05 — veto in chat)

1. **A hand card is one line: name on the left, price on the right.** This is the deck-list row from deck-building games, and the list-row rule this map already decided ([Text positions](https://linear.app/threadbare/issue/THR-2119): one left text edge, one right trailing edge, numbers right-aligned and tabular). The price keeps its exact words ("Mind · 10 essence"), its hover and its sphere tint on the left border. The name gives way first (ellipsis, full name in its hover as today). The price never shrinks. The unpayable reason stays a second line under the name, only on that card.
2. **The essence row keeps every part it has** (icon, word, "59 / 60", bar to the limit, refill rung, trend arrow), but the arrow fits the bar line instead of making it taller. The row goes from 50 to about 42 px. Christian chose "53 / 55" and the bar ending at the limit himself ([The pool says how full it can get](https://linear.app/threadbare/issue/THR-2148)), so both stay on every row.
3. **The hand has a floor of three card rows** (`GOD_RAIL_HAND_MIN_ROWS`). The folded block can still grow to half the rail, but it now gives way first. Once the hand reaches its floor, an open folded row scrolls inside its own region (Law 57: it grew before it scrolled).

Rejected, one line each: **compact icon-and-number cells for the less-used pools.** An icon with no word beside it must be drawn at 34 px (Law 11), which cancels the saving. **Hiding pools behind a summary.** The Done-when needs every pool readable, and Law 53 counts essence as always-on. **Dropping "essence" from the price.** The words fit, so nothing has to change. **Two-column folded rows.** "Reaches · Eye · Blinkered" is about 190 px against a 142 px column.

## UI pillar

Browser-verify tool: the in-app browser / Playwright DOM reads on the deployed or local build (no WebGL needed; the rail is DOM).

### U1 — one-line card row (`frame/HandSection.tsx`)

1. The `hand-card` button becomes `flexDirection: 'row'`, `alignItems: 'baseline'`, `gap: HAND_ROW_PRICE_GAP_PX` (6), padding `'4px 6px 4px 8px'` (was `'4px 8px 4px 10px'`). Its left border, armed borders and opacity rules are unchanged.
2. The name span gets `flex: 1 1 auto; minWidth: 0` (ellipsis stays). The price span (with or without its `ui.hand_price` tooltip) gets `flexShrink: 0; marginLeft: auto; textAlign: right` and keeps `tabular-nums`, `--text-xs`, `--text-secondary`.
3. `hand-card-reason`, when present, wraps onto a second line under the name: the button gets `flexWrap: 'wrap'`, and the reason gets `flexBasis: '100%'`.
4. `data-row-layout="line"` on each `hand-card`, so tests and the debug reader can see the shape.

### U2 — the hand's fit numbers (`frame/handFit.ts`)

1. `HAND_ROW_EST_PX` 52 → 33 (a one-line row at the 16 px floor). The measured `rowPx` still replaces it once a row has been measured.
2. New `GOD_RAIL_HAND_MIN_ROWS = 3`, and a pure `handFloorPx(rowPx, gapPx, chromePx)` = chrome (header, rest line if shown, core verbs and their gaps) + `handWholeHeight(3, rowPx, gapPx)`. `HandSection` writes it as the hand section's `minHeight`, measured the same way it measures `rowPx`, and exposes it as `data-hand-floor`.

### U3 — the folded block gives way (`ascendant-bar/styles.module.css`, `AscendantBar.tsx`)

1. `.foldedRows`: `flex-shrink: 0` → `flex-shrink: 1; min-height: 0`. `max-height: 50%` and `overflow-y: auto` stay. Each `FoldedRow` header keeps `flex-shrink: 0`, so a closed row is never cut. Only the open body scrolls.
2. The hand's fill wrapper (`AscendantBar.tsx:244`) keeps `flex: 1`. Its `minHeight` comes from U2's floor, not 0.

### U4 — the pool row's arrow fits the bar line (`ascendant-bar/EssenceBlock.tsx`)

1. The `essence-trend-*` span: `lineHeight: 1` → `lineHeight: 'var(--essence-bar-line, 8px)'`, and `alignSelf: 'center'`. The glyph stays `--text-xs` (16 px, above Law 11's 14 px floor), and it may overhang the line box into the row's padding.
2. Nothing else on the row changes: words, numbers, bar, rung, colours, hover, click-to-expand.

### Player-facing display

At 1920×1080 the hand shows at least six cards with no moment open, and five while one is open, where today it shows two and a half. Each card reads like a line in a deck list: its name, then on the same line, to the right, what it costs. The essence pools look the same, just a little closer together. Opening a folded row (Reaches, Mandate, Signatures, Hooks) never hides the hand: the row's contents scroll inside their own box instead.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Hand card | "Breath of the Sphere" … "Mind · 4 essence", now on one line (was two) | PC-6 (the same fact shown the same way) | The name, then its price, as in a deck list. The price hover (`ui.hand_price`, "The price on Foreign ground: …") and the name hover (the card's description) are unchanged |
| Unpayable card | Its reason line, "Not enough Mind essence" (`HAND_UNPAYABLE_REASON`), under the name, unchanged words | PC-6 | Why it is dimmed, on the card itself |
| Essence row | Unchanged ("Mind", "59 / 60", bar, rung, arrow) | — | Same row, 8 px shorter |

No string is added or changed.

### UI Laws engaged

Law 1 (sphere icons and words stay on every pool row; card names keep their hover), Law 11 (arrow glyph stays 16 px; no icon is left without a word), Law 13 (no numeral added), Law 17 (tooltips unchanged), Law 31 (the sphere tint on the card's left border is a category tint, with the sphere word in the price beside it), Law 33 (nothing below the fold, nothing clipped: this is the fault being fixed), Law 36 / 57 (the hand grows to its room, then groups by sphere at the limit as `handFit` already does; the folded block grows, then scrolls inside itself), Law 46 (a card row is 32.5 px tall, above the 24 px hit floor), Law 53 (essence stays always-on, every pool shown).

### Playtest signal

- Asked how many cards they hold, a warm tester counts them in the rail without scrolling.
- No tester describes the hand as "a tiny window" or a card as cut off.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

No events; nothing on the map. Debug: `data-row-layout`, `data-hand-floor` and the existing `data-hand-free-height` / `data-hand-mode` attributes are read straight from the DOM. No bridge change.

## Canon pillar (lands in the same PR)

`Docs/design-system/layout-zones.md` § God rail (left), after the density paragraph: "A hand card is one line, name then price, the price on the trailing edge. The hand keeps a floor of `GOD_RAIL_HAND_MIN_ROWS` card rows: the folded rows give way first and scroll inside their own block (THR-2177)."

## Content pillar

N/A. No template, prose table or string changes. The price keeps its words; only its position moves.

## Engine pillar

N/A. No file under `src/engine/` or `src/types/` changes. `HandCardVM` (`engine/views/godRail.ts`) already carries `name`, `line2`, `priceTooltip` and `reason`, which is everything U1 lays out.

## Interface impact

| Contract | Change |
|---|---|
| `HandCardVM` → `HandSection` | preserve (same fields, new layout) |
| `GOD_RAIL_SECTIONS` places (pinned / fill / folded) | preserve; the fill section gains a floor, the folded block becomes shrinkable |

No cross-system read or write is added; `interface-map.md` is untouched.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `HandSection`, `handFit`, `AscendantBar`, `EssenceBlock` | none | god rail | none | none | `data-row-layout`, `data-hand-floor`, `data-hand-free-height`, `data-hand-mode` |

UI only: `HandSection` (measures and writes the floor), `handFit` (pure numbers), `AscendantBar` (fill wrapper's min height), `styles.module.css` (folded shrink), `EssenceBlock` (arrow line height). No orchestrator phase, GameState field, trace or prose hook. Wiki: no Design Reference Wiki page lists these files as `sources` (grep of `public/*.html`, 2026-11-05). Run `check:wiki-freshness:blocking` anyway.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| `HAND_ROW_EST_PX` | 33 (was 52) | A one-line card row at the 16 px floor, before measuring | `frame/handFit.ts` |
| `HAND_ROW_PRICE_GAP_PX` | 6 | Gap between a card's name and its price | `frame/handFit.ts` |
| `HAND_ROW_PADDING` | `'4px 6px 4px 8px'` (was `'4px 8px 4px 10px'`) | A card row's padding; the 4 px it frees lets the longest name and price share one line | `frame/handFit.ts` |
| `GOD_RAIL_HAND_MIN_ROWS` | 3 | Card rows the hand always keeps, whatever the folded rows do | `frame/handFit.ts` |
| `--essence-bar-line` | 8px | The bar line's height, which the trend arrow now fits | `ascendant-bar/styles.module.css` (local custom property) |

## Tracing

N/A — layout only; nothing new happens in the simulation. Inspectability is through the DOM attributes above.

## Fail-soft table

| Failure | Fallback |
|---|---|
| A name plus its price does not fit | The name ellipsizes; the full name is in its hover (today's truncation behaviour) |
| `rowPx` not measured yet (first paint, jsdom) | `HAND_ROW_EST_PX` (33) is used for the floor and the fit |
| No `ResizeObserver` | The floor uses the estimate, and the hand region scrolls inside itself (today's `nextHandFitMode` null path) |
| The pinned sections alone leave less than the floor (a smaller window than 1920×1080) | The floor holds and the folded block shrinks to its closed headers. Below 1920 the Law 33 contract is panel-level only |
| A card has a reason line | That row is two lines. `handFit` measures the first row, so a hand of mostly unpayable cards can group a little later. The region still scrolls inside itself |

## Kill criteria

- At 1920×1080, any card name in the warm-150 hand loses more than its last two letters: the price drops to its own second line on **that row only** (`flexWrap` already allows it), and the PR says so.
- The arrow change makes the arrow overlap the rung or the bar's end: revert U4, and lower the rail gap from `--space-6` to `--space-5` instead. That is Legibility 4's sanctioned fallback ([Legibility 4](https://linear.app/threadbare/issue/THR-2125), kill criteria).

## Three-pillar check

- [x] Engine pillar N/A with rationale (no engine or type file; the view model already carries every field)
- [x] Content pillar N/A with rationale (no word changes)
- [x] UI pillar present (U1–U4 plus one canon line)
- [x] Wiring connects them (DOM attributes only, no new module)

## Vision audit

- [x] No Vision premise is contradicted. Prose-first UI holds: no number is added, and the essence balance is existing persistent chrome (Law 13 exception; vault `Vision/taste-profile.md`). The map stays the table: the rail gets no wider. The hand, where the god acts through cards, gets its room first.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-05-thr-2177-god-rail-hand-room-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Every number is a named constant (table above) |
| 2. Inspectability | PASS | `data-row-layout`, `data-hand-floor`, `data-hand-free-height`, `data-hand-mode` |
| 3. Determinism | PASS | No simulation input |
| 4. Fail-soft | PASS | Fail-soft table above; the hand never renders at 0 px |
| 5. Narrative over mechanical perfection | PASS | N/A to layout; no words change |
| 6. Additive over destructive | PASS | New constants and one new pure helper; nothing deleted |
| 7. Performance budget | PASS | One extra measured number per resize, on the observer `HandSection` already runs |

## Done when

These checks narrow the ticket's unconditioned Done-when to the playable state. The essence first-use caption shows only on first use. While a moment is open the cards rest (dimmed, presses swallowed), so that state gets its own, lower bar.

- [ ] With a moment open (the rest line showing), same view: `hand-region` holds at least five whole one-line rows.
- [ ] At 1920×1080 on `?view=game&seeded&size=medium&warm=150`, once the essence first-use caption has closed and with no moment open: every `[data-testid="hand-card"]` has `data-row-layout="line"` and is ≤ 34 px tall; `hand-region`'s `clientHeight` ≥ `handWholeHeight(6, <measured row height>, 6)`; `data-hand-mode` is `whole` for the five-card hand.
- [ ] The same view after `await window.__DEBUG.grantAction(id)` brings the hand to 12 cards (any seven god cards): nothing below the fold, no row cut at the region's edge, and the open group or whole hand shows at least six whole rows.
- [ ] The one-card case from [the hand clips its only card](https://linear.app/threadbare/issue/THR-2176) (`?view=game&seeded&size=medium`, `await window.__DEBUG.grantAction('whisper_insight')`): the card shows whole, with no scrollbar beside it.
- [ ] With every folded row opened at 1920×1080 on the warm-150 view: `hand-region`'s height ≥ three rows (`data-hand-floor` honoured), and the folded block scrolls inside itself.
- [ ] Every `essence-row-*` is ≤ 43 px tall at 1920×1080 and still contains its icon, word, `essence-balance-*` ("N / M"), `essence-fill-*`, `essence-refill-*` (where it has one) and `essence-trend-*`.
- [ ] Unit tests: `handFit` (`handFloorPx`, the new estimate), and a `HandSection` jsdom test that one card renders name and price inside one `data-row-layout="line"` button, and an unpayable card adds its reason. Existing god-rail and hand tests pass, updated only where they pinned the two-line row or the 52 px estimate.
- [ ] Four-part browser evidence (UI pillar; a layout change, so 2560×1440 too): a 1920×1080 screenshot of the god rail on the warm-150 view; a 2560×1440 screenshot; console output with no new errors; a `__DEBUG`/DOM assertion of the three predicates above; a UI-Laws judgment line for Laws 1, 11, 13, 17, 21, 31, 33, 37, 46, 57.
- [ ] `layout-zones.md` carries the Canon pillar line.
- [ ] `npm run gate` is green.
- [ ] The closing commit body has the close keyword for this ticket on its own line, and one for [the hand clips its only card](https://linear.app/threadbare/issue/THR-2176) if the third check passes.

## Coordination block

**Suggested model:** sonnet. Five files of layout edits with measured anchors, plus one small pure helper.
**Parallel-safe with:** [Town encounters, the one-line records](https://linear.app/threadbare/issue/THR-2162) and [the overviews and carryover lines](https://linear.app/threadbare/issue/THR-2163) (content files only); ["Waits for you" / "Theirs alone"](https://linear.app/threadbare/issue/THR-2178) (Ledger rows and the Stage, not the god rail).
**Mutex with:** anything editing `frame/HandSection.tsx`, `frame/handFit.ts`, `ascendant-bar/EssenceBlock.tsx`, `ascendant-bar/styles.module.css` or `ascendant-bar/AscendantBar.tsx`. Today that is only [the hand clips its only card](https://linear.app/threadbare/issue/THR-2176), which this plan covers: do not build it separately.

**Files to touch:**
- Edit: `src/components/Game/frame/{HandSection.tsx,handFit.ts}`, `src/components/Game/ascendant-bar/{AscendantBar.tsx,EssenceBlock.tsx,styles.module.css}`, their tests under `__tests__/`, `Docs/design-system/layout-zones.md`.

## Notes for the executor

- Line numbers are from `main` @ `2b3bebee`. Anchor on the test ids.
- `HandSection` already measures `rowPx`. Measure the chrome (header, rest line, verbs) with the same observer, so the floor follows the 2560 type step.
- `essence-trend-*` at `lineHeight` 8 px: check that the arrow's glyph box does not catch the row's hover target oddly. It is inside the row's `Tooltip`, so the whole row stays one hover target (THR-1713 D1).

## Forked-audit verdicts

| Axis | Verdict | Note |
|---|---|---|
| NFP | PASS-with-notes | The padding literal became `HAND_ROW_PADDING` in the constants table. Changing `HAND_ROW_EST_PX` and the folded block's shrink alters behaviour in place, which the plan states |
| Three-pillar | PASS-with-notes | The Wiring section now carries the checklist pointer and its table |
| Vision | PASS | UI layout only; no premise touched |

### Intent-judge verdict

**Allow** (Reversible). One GAP, on kill criteria: the narrowed Done-when and the thin budget. Both were fixed before handoff: a moment-open Done-when line, the narrowing stated, the 456 px vs 374 px figures reconciled, and the 7 px margin named.
