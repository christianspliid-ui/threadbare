> **title:** The commit stays on screen when the hand wraps — THR-1732
> **linear_issue:** THR-1732
> **author:** Claude Code (design lane, run 2026-10-04c — decided under delegation, process.md rule 4)
> **created:** 2026-10-04
> **three_pillars:** Engine N/A — layout only, no state or tick change · Content N/A — no copy, card or template change · UI done

# The commit stays on screen when the hand wraps — THR-1732

*When the hand wraps to a second row, the player cannot reach the commit button without scrolling. That button is how the god acts at all.*

## Why this is load-bearing

Christian's 2026-10-04 layout pass ([THR-1724](https://linear.app/threadbare/issue/THR-1724)) asked for card rows of at most four. Each card gets a 16:9 picture band. He also asked that the screen *"still fit the 1920×1080 viewport contract with two card rows — verify with 5 cards."* The executor shipped the rows and the bands and found that five cards do not fit. It filed this ticket with three options: five per row, a tighter card, or accept the scroll.

Measured on the live build (below), the gap is wider than the ticket thought. Hands are dealt **4 to 8 cards** (`DEAL_HAND_MIN = 4`, `DEAL_HAND_MAX = 8`, `src/data/nudge-constants.ts:575-576`), so a second row is ordinary, not an edge case. With the card format locked and four cards per row, **two full rows cannot fit above the fold for any authored scene.** The two rows alone are 656px of a 986px column. The parts above the hand can only be trimmed by about 30px, while 269px are needed.

The harm the player feels is narrower than "it doesn't fit". **The commit button sits at y = 1276–1325, below the 1080 fold.** It is the second beat of Law 48's two-beat act, and the only way to commit. A player who has staged their hand looks for the button and finds nothing until they scroll the column. This plan fixes that harm. It bends **neither** of Christian's approved rules (four per row, Law 33; the locked card, [THR-890](https://linear.app/threadbare/issue/THR-890)) and needs no law amendment.

## Measured, not assumed

Live build `https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge`, Playwright at 1920×1080, 2026-10-04 ~12:22Z. Main at `cb58a9d6` includes THR-1724 and THR-1727 (the stakes line). The coachmark legend was showing.

| Element | Measured | Source of the number |
|---|---|---|
| `veil-content-column` | 1248 × 986 at (336, 94); inner width 1088; `scrollHeight` **1255** vs `clientHeight` **986**, so it overflows by **269px** | `getBoundingClientRect` / `scrollHeight` |
| Page | `document.scrollingElement.scrollHeight == 1080`, so the page never scrolls (Law 33 holds at page level) | same |
| Cards | 5 dealt; row 1 at y = 620 (four cards, 210 × 322); row 2 at y = 954 (one card, 210 × 298) | `[data-testid^="nudge-card-slice"]` |
| Card band | 208 × 118 (16:9 at card width) | `nudge-card-art-*` |
| `nudge-card-row` | 876px wide (4 × 210 + 3 × 12): exactly `CARDS_PER_ROW` | `NudgePhaseShell.tsx:358` |
| Commit button | **y = 1276–1325**, below the fold | `button` "Let fate decide" |
| Above the hand | step dots 48 · title row 34 · context strip 84 (30 of it the coachmark) · stakes line 24 · scene columns 166 · essence-and-legend row 24 + 10 gap | column children |

The arithmetic of a full fit is: column 986 − top padding 32 − bottom clearance 24 − commit row ~73 = **857px** for the title-to-hand stack. Two rows need 656px, which leaves **201px** for step dots, title, context strip, stakes line and scene prose. Without the prose those already take ~190px; the prose here is 166px and other scenes run longer. No trim of the chrome closes that.

The dealt hand range was read from source:

```
src/data/nudge-constants.ts:575  export const DEAL_HAND_MIN = 4;
src/data/nudge-constants.ts:576  export const DEAL_HAND_MAX = 8;
```

There is one more fact the ticket did not have. When the scene carries art, the column is `52%` wide instead of `65%` (`EncounterVeil.tsx` content column, `width: hasArt ? '52%' : '65%'`), so only about three cards fit per row there. Even a four-card hand wraps on an art scene. Making "five per row" the fix would not help that case at all.

## The decision

**Decided by delegation — design lane, 2026-10-04 (process.md rule 4). Veto in chat.**

1. **The hand's footer pins to the bottom of the encounter column.** The essence-left counter, the glyph legend (price · odds · setback) and the commit button move into one bar. The bar is `position: sticky; bottom: 0` inside the existing scroll column, over a fade to the veil's void colour. When the hand fits, the bar sits where it would anyway, right under the cards. When the hand overflows, the bar stays on screen and the cards scroll beneath it. **The god can always act.**
2. **The essence-and-legend row above the cards goes away** (it moves into the bar), which gives its ~34px to the hand.
3. **Four per row and the locked card stay exactly as Christian approved them.** No law text changes.
4. **The second row shows its top under the bar's fade.** On the measured bridge scene that is ~96px of the second row: its picture band, which reads as "more cards below". With the coachmark dismissed it is ~126px, which adds the chip row. The column scroll Law 33 sanctions reveals the rest.

**Why:** the harm is an unreachable commit, and only option 1 fixes it for every hand size and on art scenes. Five per row (ticket option A) helps only five-card hands on art-less scenes and needs a Law 33 amendment. A tighter card (option B) changes the format Christian locked in THR-890. Accepting the scroll as it is (option C) leaves Law 48's commit beat off screen, the defect [THR-1410](https://linear.app/threadbare/issue/THR-1410) already fixed once for the legacy veil.

**Options weighed:**

- **A — five per row when there is room.** It does not fit as specified: 5 × 210 + 4 × 12 = 1098 against the 1088 inner width. It needs a gap cut or a padding cut, it helps only 5-card hands on art-less scenes, and it bends Law 33's "at most four". Kept as the veto alternative (below).
- **B — a tighter card body** (two-line effect text, less padding). It saves ~40–60px per row, nowhere near 269, and it changes the locked card.
- **C — accept the column scroll.** This is today's behaviour, with the commit below the fold.
- **D — one row, wider veil.** The veil grows to hold up to eight cards in a line (8 × 210 + 7 × 12 = 1764px), which is the best fit for big hands. It reverses Christian's same-day choice of wrapping rows, so it is not the lane's to take.
- **E — move the step dots into the title row.** That saves 48px, but it changes the title row Christian composed this morning. Not taken.

**Would change the call:** Christian saying "five across" or "one row". Either one is a Law 33 amendment and his to make. The pinned bar stays under either, because neither helps hands of six or more. A measurement could also change it: if sticky positioning fails inside the veil's column on the shipped browser matrix, the fallback is the same bar as an absolutely positioned footer, the THR-1410 pattern (Notes for the executor).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounter veil (`EncounterVeil.tsx`, attended render) | 🟢 ACTIVE | **extends**: the content column already scrolls (`overflowY: 'auto'`); no column change beyond what the bar needs |
| Nudge stage shell (`NudgePhaseShell.tsx`) | 🟢 ACTIVE | **extends**: the essence counter, glyph legend and commit regroup into one sticky footer bar |
| Card face (`CardFace.tsx`) | 🟢 ACTIVE | **untouched**: locked format |
| Legacy veil footer (`veil-footer`, THR-1410) | 🟢 ACTIVE (non-nudge path) | **untouched**: still draws for `!model.nudgePhase`; its clearance constants are the precedent this bar follows |

## Engine pillar

Engine: N/A. This is a pure layout change inside two components. No graph, tick, resolution or PRNG path is read or written. The commit still calls the same `onCommit(hand.selectedIds, hand.selectedCost)`.

## Content pillar

Content: N/A. No copy changes. The essence-left string, the legend labels (`NUDGE_GLYPH_LEGEND`) and the commit label (`NUDGE_COMMIT_LABEL`, or whatever [THR-1714](https://linear.app/threadbare/issue/THR-1714) ships) move as they are. No card, template or prose table is touched.

## UI pillar

*Screenshot tool: Playwright (DOM surface; the veil is not WebGL).*

### Player-facing display

**U1 — The hand footer bar** (`data-testid="nudge-hand-bar"`), last child of `NudgePhaseShell`:

- Contents, left to right: the essence-left counter (`nudge-remaining-essence`, its Tooltip unchanged) · the commit button (`nudge-commit`) with its running cost pips (`nudge-selected-cost`) · the glyph legend (`nudge-glyph-legend`, right-aligned, Tooltip unchanged). Every existing `data-testid` keeps its name.
- `position: 'sticky'`, `bottom: 0`, `zIndex` from the veil's own band (above cards, below the veil's overlays; Law 35: it is part of the veil's content zone, not a new zone).
- Background: a vertical fade from transparent to the veil void, `HAND_BAR_FADE_PX` tall above a solid base, so a card sliding under it reads as continuing rather than cut. Colours come from existing veil tokens (Law 30), with no new hex.
- Height: the button's own height plus `HAND_BAR_PAD_Y_PX` top and bottom. It is not the legacy 94px strip.
- Spacing from the last card row: the existing commit `marginTop: 24` becomes the bar's top padding plus fade, so the in-flow look when the hand fits is unchanged within a few pixels.

**U2 — The row above the hand goes.** The `display: flex; alignItems: baseline; gap: 12; marginBottom: 10` row that holds the essence counter and the legend (`NudgePhaseShell.tsx` ~292–342) is removed, and its two children move into U1. The hand's `marginTop: 22` stays.

**U3 — Column clearance.** The veil column's nudge-stage `paddingBottom` stays `VEIL_FOOTER_CLEARANCE_PX` (24). A sticky bar sits *in* the flow, so the column needs no extra reservation. That is the difference from THR-1410's floating footer, and it is why the unclickable-at-max-scroll bug cannot recur here: the bar is the last thing in the scroll content, so at maximum scroll it sits at its natural place.

**U4 — The standalone placement (Meet The First) gets the same bar.** The shell mounts with `renderTestHeader` on the meeting beats, inside the meeting's own scroll column. Sticky resolves against that column, so the commit stays visible there too. This is the same benefit and needs no separate branch. If the meeting column has no overflow, the bar simply sits in place.

### UI Laws engaged

- **1:** the essence counter and legend keep their tooltips; nothing loses its presentation.
- **5 / 7:** the card band is untouched at 16:9.
- **10 / 12:** the glyph legend still introduces price · odds · setback, now next to the commit where the price is paid.
- **13:** the essence balance stays the sanctioned pool numeral; no new numbers.
- **23:** the commit keeps `focus-ring`. A sticky bar does not trap focus, and Tab still reaches the cards first.
- **25:** no inert control is added.
- **30:** veil tokens only.
- **33:** at most four per row, unchanged. The page never scrolls. The column scrolls internally, which the law sanctions, and **the act control is never below the fold**.
- **35:** within the veil content zone.
- **37:** step dots and the title row are untouched.
- **46:** the commit hit area is unchanged.
- **47:** staging still updates the bar's cost pips at once.
- **48:** both beats (stage, then commit) are on screen together for the first time on two-row hands.
- **52:** untouched.

No exception is needed.

### Event notifications

N/A. No toast, chronicle line or beat is added.

### Debug inspection

No new `window.__DEBUG` accessor. Verification reads the DOM (Done-when). The bar exposes `data-hand-overflow="true|false"`, set from the column's measured overflow (a single `ResizeObserver` on the shell). Evidence can then assert the overflow state without pixel math. It is presentation state only and never feeds game state.

### Visual presence (HexMapV2)

N/A. The encounter veil covers the map, and nothing on the map changes.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| Hand footer bar | none (render only) | `NudgePhaseShell` → `EncounterVeil` content column; `MeetTheFirst` standalone shell | none | none: no game event happens; the commit's existing traces are unchanged | `data-testid="nudge-hand-bar"`, `data-hand-overflow` |

Wiring checklist (`Docs/plans/wiring-checklist.md`): no new module, orchestrator phase, GameState field, prose path or player control. The existing commit control moves. `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` need no change, because no cross-system read or write is added.

## Interface impact

| Contract | Disposition |
|---|---|
| `NudgePhaseShell` props (`onCommit`, `phase`, `renderTestHeader`, …) | **preserve**: no prop added or removed |
| `EncounterVeil` ↔ shell (content column scroll) | **preserve**: the column stays the scroll owner; the bar is sticky within it |
| Test ids `nudge-commit`, `nudge-remaining-essence`, `nudge-glyph-legend`, `nudge-selected-cost` | **preserve**, with new parent `nudge-hand-bar` (**add**) |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `HAND_BAR_PAD_Y_PX` | `12` | Vertical padding of the pinned hand bar, above and below the commit button |
| `HAND_BAR_FADE_PX` | `28` | Height of the fade above the bar's solid base, so cards sliding under it read as continuing |
| `CARDS_PER_ROW` | `4` (unchanged) | Law 33 cap, amended 2026-10-04; **not** changed by this plan |

All three live in `NudgePhaseShell.tsx` beside `CARD_GAP_PX`.

## Tracing

N/A — no game event happens. Nothing happens in the game: the bar is presentation, and the commit's existing resolution traces are untouched. Inspectability for this change is the DOM attribute `data-hand-overflow` and the Done-when assertions.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A future ancestor between the column and the shell gains `overflow: hidden`, which breaks sticky | The bar renders in flow exactly where the commit row sits today: the current behaviour, never worse. The guard is the browser-verify Done-when (commit above the fold on the five-card bridge), because the ancestors that could break sticky live in `EncounterVeil.tsx` (column → shell mount at ~2409) and the meeting beats (`FormativeTestBeat.tsx`, `BondBeat.tsx`), which a shell unit test cannot see. Executor: add a code comment at each of those mount points naming the no-`overflow` requirement |
| `ResizeObserver` unavailable (jsdom, old engine) | `data-hand-overflow` stays `"false"`; the layout does not depend on it |
| Empty hand (`hand.cards.length === 0`) | The bar still renders the commit (the empty-hand "let fate decide" path, THR-1724 item 11) and the essence counter; the legend is hidden, because no glyphs are on screen to explain |
| Designer view with withheld cards | The withheld list stays in flow above the bar; the bar stays last |

## Blast Radius

Not required. The files touched are `NudgePhaseShell.tsx` (mounted by `EncounterVeil.tsx:2409`, `FormativeTestBeat.tsx:231`, `BondBeat.tsx:155`, plus tests) and possibly `EncounterVeil.tsx` (only if U3 needs a comment update). Neither is near 100 importers.

## Three-pillar check

- [x] Engine pillar: N/A with rationale (layout only)
- [x] Content pillar: N/A with rationale (no copy or content change)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The god's act (stage, then fire) is easier to perform. Nothing is hidden or added.
- [x] No Vision edit is owed.

## Rulebook impact

- [x] This plan does not change a rule of play. The hand, its size, its costs and its resolution are unchanged.
- [x] No `Docs/canon/rulebook.md` edit is owed, because no rule of play changes.

> Brainstorm companion: `Docs/plans/2026-10-04-thr-1732-five-card-hand-fit-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Two new named constants; the row cap stays a named constant |
| 2. Inspectability | PASS with note | No game event, so no trace; `data-hand-overflow` makes the layout state assertable |
| 3. Determinism | PASS | No randomness |
| 4. Fail-soft | PASS | Sticky failure degrades to today's in-flow commit row |
| 5. Narrative over mechanical perfection | PASS | Scene prose keeps its full height; nothing in the story is clipped to make room |
| 6. Additive over destructive | PASS | Elements move, none is deleted; every test id survives |
| 7. Performance budget | N/A | One `ResizeObserver` on one element while the veil is open |

## Done when

- [ ] On `https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge` (and the local dev equivalent) at 1920×1080, with five cards dealt: `document.querySelector('[data-testid="nudge-commit"]').getBoundingClientRect().bottom <= 1080` **without scrolling**, and `document.scrollingElement.scrollHeight === 1080`.
- [ ] Same route: `[data-testid="nudge-hand-bar"]` has `data-hand-overflow="true"`, and after `veil-content-column.scrollTop = veil-content-column.scrollHeight` every card's bottom edge is above the bar's top edge (every card reachable).
- [ ] A one-row hand (≤4 cards — the [Riders route](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) if its step deals ≤4, else any step that does) shows `data-hand-overflow="false"`, and the bar sits under the cards within 8px of where the commit sat before (in flow, no gap).
- [ ] Meet The First (`?view=game&firstunmet&size=medium`), a formative test: the commit is above the fold.
- [ ] Unit: `NudgePhaseShell` renders `nudge-hand-bar` containing `nudge-commit`, `nudge-remaining-essence` and (non-empty hand) `nudge-glyph-legend`; the empty-hand case renders the commit without the legend; `CARDS_PER_ROW` is still `4`.
- [ ] Four-part browser evidence (verification-gates.md § Browser-verify): a 1920×1080 screenshot, console output, the DOM assertions above as the `window`-side check, and a UI-Laws line citing 1, 10, 12, 13, 23, 30, 33, 35, 37, 47 and 48.
- [ ] `npm run gate` green.

## Coordination block

**Suggested model:** sonnet. One component, a CSS move, no engine. Advisory only.

**Parallel-safe with:** [THR-1716](https://linear.app/threadbare/issue/THR-1716) (arrival: `GameView` / beats, not the nudge shell); [THR-1715](https://linear.app/threadbare/issue/THR-1715) (attention cadence and ledger filter, not the veil layout).

**Mutex with:** [THR-1714](https://linear.app/threadbare/issue/THR-1714). Both edit `NudgePhaseShell.tsx`'s commit block: 1714 changes the commit label and adds the card's lean tag, and this plan moves the commit into the bar. Build whichever is claimed first; the second merges main and keeps the other's label. Also mutex with [THR-1725](https://linear.app/threadbare/issue/THR-1725) while its PR is open, because both are in the nudge stage's components and a merge conflict is likely in the same hunk region.

**Files to touch:**

- Edit: `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` (regroup the counter, legend and commit into the sticky bar; two constants; remove the row above the hand)
- Edit: `src/components/Game/encounter-stage/__tests__/` (a new or extended test for the bar; update any test that located the legend by its old parent)
- Possibly edit: `src/components/Game/EncounterVeil.tsx` (comment only, at the nudge-stage `paddingBottom`, recording why no reservation is needed)
- Edit: `Docs/design-system/` styleguide / `component-selection.md` only if the executor extracts the bar as a shared primitive. Not required, and not expected.

## Notes for the executor

- **Do not change `CARDS_PER_ROW`, `CARD_WIDTH_PX` or the card body.** Both are Christian-approved; bending either is a Law 33 / THR-890 amendment that only he makes.
- **Do not reintroduce the THR-1410 floating footer for the nudge stage** unless sticky proves unworkable. If it does, use that pattern exactly (`position: absolute; bottom: 0` over the column, with the column reserving the bar height plus `VEIL_FOOTER_CLEARANCE_PX`), and say so in the PR.
- The shell's root is a plain block inside the veil's content column. There is no `overflow` declaration between `veil-content-column` (`overflowY: 'auto'`) and the shell; verified by reading `EncounterVeil.tsx` 2084–2450, where the next `overflow` is at line 2902, inside CastStrip, a sibling subtree. Keep it that way.
- The column uses `justifyContent: 'safe center'` (THR-925). A sticky last child in a flex column works there. Verify at both the one-row and the two-row hand.
- If THR-1714 has merged first, the commit's label is its two-state label ("Play your hand, let fate answer" / "Stay silent, let fate answer"). Move it as it is.

## Intent-judge verdict

**Pass 1 (2026-10-04, fable, cold context): Allow.** 9 PASS, 2 GAP. Dimension 4: the fail-soft row named a shell unit test that cannot see the ancestors that could break sticky. Fixed the same pass: the guard is now the browser-verify Done-when, plus a comment at each mount point. Dimension 9: the importer list named `PackageBlocks.tsx`, which imports `NudgeCard`, not the shell. Corrected to the real mounts (`EncounterVeil.tsx:2409`, `FormativeTestBeat.tsx:231`, `BondBeat.tsx:155`). The judge confirmed U4: both meeting beats wrap the shell directly in an `overflow-y-auto` column with no intervening overflow.

## Forked-audit verdicts

### NFP audit

**PASS-with-notes.** Tunability: two named constants, row cap unchanged. Inspectability: no game event, so no trace, which is justified; `data-hand-overflow` and the bar test id make the layout assertable. Determinism: N/A. Fail-soft: four cases, and sticky failure degrades to today. Narrative: the prose keeps full height. Additive: every test id and prop is preserved. Performance: N/A, one ResizeObserver.

### Three-pillar audit

**PASS.** Engine and Content are N/A with rationale. UI is present and substantive (U1–U4, Laws engaged, debug hook, HexMapV2 N/A, Playwright named). No required section is missing. The wiring row covers phase, component, state, trace and debug visibility.

### Vision audit

**PASS-with-notes.** No contradictions. Core loop: stage and commit are now visible together. Non-negotiables: no rule of play changes. Note: the plan cites Christian's 2026-10-04 layout pass, not the taste profile by file. That is a soft concern and needs no change.
