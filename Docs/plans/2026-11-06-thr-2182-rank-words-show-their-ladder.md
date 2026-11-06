> **title:** Rank words show their ladder — a reach tile says where its word sits and the word above it, the word's hover lists the whole ladder, the row card count reads "4 cards", and the faction ladder stops reusing "Formidable" (THR-2182)
> **linear_issue:** THR-2182
> **author:** Claude Code (design lane, unattended, 2026-11-06 — run dl-20261106-0841)
> **created:** 2026-11-06
> **three_pillars:** Engine done (one view-model line and a tile field, no rule) · Content done (exact words below) · UI done

# Rank words show their ladder (THR-2182)

*A warm tester read a mortal's sheet as "Rank words (Formidable, Bartering, Phantom, Handy, Destined): no scale, no numbers, no tooltip", and "the small number next to every person, hall and resource (4 / 3 / 2)" as a mystery. Both are true on main. A reach tile shows one word and nothing about the four words around it. The number beside a row is a count of the god's castable cards, drawn as a card icon and a bare digit. The fix uses the same pattern as [the rail rows](2026-11-05-thr-2175-rail-rows-say-what-they-are.md): the visible text says what it is. The tile gets a second, muted line naming its rung and the next word up. The count says "cards".*

## Why this is load-bearing

[Warm playtest round 3](https://linear.app/threadbare/issue/THR-2175): the veteran tester named both, and the class has recurred six times. Slice 1 ([THR-2183](https://linear.app/threadbare/issue/THR-2183)) fixes the god rail. This is the same complaint on the Inspector. It also falls in Christian's period focus (chat, 2026-11-01: *"are we using tried and true ux patterns for how humans read UI panels"*). The standard pattern for a rank is the current level plus the next level (skill trees, loyalty tiers, rank badges). The standard pattern for a count chip is the number with its noun.

## Substrate inventory

Measured on `main` @ `dd214308`, 2026-11-06.

| Surface | What the player reads today | Source |
|---|---|---|
| Person sheet reach tile | kind word "Reach", title "Iron", one line "Formidable" (with ▲ after a recent gain). No hover on the title or the word | `personRows.ts:689-705` `domains`; renderer `Section.tsx:623-681` `CardsSectionRenderer` (`durationWord` at `:669`) |
| Shared Reach standing | `ReachStanding.tsx`: a Reach name with its `reach.*` hover and its word, used by `NudgeStageHeader` and `DomainCard`; per-tier prose in `domain-prose.ts` `getDomainProse` | not the Inspector tile, which is a `CardsSection` tile. This plan extends `CardTile`; `ReachStanding` is the natural later adopter of `rankLadderHover` (not in this slice) |
| The ladders | five words per Reach, e.g. iron `Meek · Trained · Formidable · Fearsome · Legendary`; tier = `getCapabilityTier` (0–4) | `data/domain-words.ts:20-46, 82-91` |
| Row card count | card icon + digit ("4"); "4 cards" only as `aria-label` and hover label, desc `ui.inspector.cards` | `inspector/RowCards.tsx:60-79`; `Chip.tsx:384-398` (full count form draws `word` *before* the number, no noun after) |
| Faction "Strongest Reaches" | chip "Might · Formidable" for a faction score ≥ 75; ladder `Slight · Able · Strong · Formidable` | `data/subject-sheet-words.ts:241-246`, `factionRows.ts:208-217` |

Three things follow:

- **The tile has room and no reading of position.** `CardTile` already has optional lines below the word (`durationWord`, `clock`, `meter`), so a second muted line is the tile's own pattern, not a new one.
- **The digit is the god's cards, not a fact about the person.** The tester read it as a stat of the person or hall. The noun is already written (`INSPECTOR_WORDS.rowCards`, `view-content.ts:122`); it is only hidden.
- **"Formidable" names two places.** It is the middle of a mortal's Iron ladder and the top of the faction ladder, both in the Inspector. One word, two places on two ladders, is the confusion the tester listed it under.

## Decisions (made by the design lane under delegation, 2026-11-06 — veto in chat)

1. **A reach tile's second line says where its word sits on the ladder and names the word above it**, muted, under the word: *"Middle of the ladder · next Fearsome"*. The top word reads *"Top of the ladder"* alone. The places are words, not numbers (Law 13): bottom, low, middle, high, top. The god's card ladder already owns the word "rung" (UL `Cosmology.md` § Rung), so the sheet never says it.
2. **The rank word gets a hover listing its whole ladder**, low to high, built from `DOMAIN_WORD_SCALES` so it can never disagree with the tile: *"Iron, low to high: Meek, Trained, Formidable, Fearsome, Legendary."* The tile's title ("Iron") gets the existing `reach.iron` hover, as the faction chips already do.
3. **The row card count shows its noun:** card icon, then *"4 cards"* (*"1 card"*). The hover is unchanged. This is a new optional `noun` on the full count chip, drawn after the number, so the other count chips (Needs you, the strip) do not change.
4. **The faction ladder's top word becomes "Foremost"** (`Slight · Able · Strong · Foremost`). Then "Formidable" means one place in the game. "Foremost" is used nowhere in `src/` (`grep Foremost src` → none). "Mighty" was rejected because it sits beside the fight screen's concept word "Might" (`fight-screen-content.ts`).

Rejected, one line each: **a five-step meter or pips on the tile.** Pips mean odds only (Law 10/15), and a third magnitude glyph language needs a ruling. **"3 of 5".** A visible raw magnitude (Law 13; Law 11 allows that form only in an `aria-label`). **A "?" on the tile.** A second hover target, and an icon the player would need a legend for (Law 12). **Hover only.** The tester said "no tooltip", and slice 1 measured that players do not hover a label they have not been told is a question. **Renaming the mortal ladders.** They are content canon and can be learned once the scale shows.

**Not in this slice:** the same words elsewhere (the encounter skill line, the thread row). Those sit beside a forecast word that already gives their meaning. The god's own Reaches row is slice 1's.

## Content pillar

| Surface | Today | After |
|---|---|---|
| Reach tile, line 2 (new) | — | `RANK_PLACE_LINE` `'{place} · next {next}'`, e.g. "Middle of the ladder · next Fearsome"; top: `RANK_TOP_LINE` `'Top of the ladder'` |
| Place words (new) | — | `RANK_PLACE_WORDS` `['Bottom of the ladder', 'Low on the ladder', 'Middle of the ladder', 'High on the ladder', 'Top of the ladder']` |
| Rank word hover (new) | — | label: the word; desc `RANK_LADDER_HOVER` `'{reach}, low to high: {ladder}.'` with `{ladder}` = the five words joined by ", " (measured: the longest is 70 characters, under Law 18's 200; the longest second line is 38, "High on the ladder · next Transcendent") |
| Reach tile title hover | none | `reach.{domain}` (existing registry entry) |
| Row card count | "4" | "4 cards" / "1 card" (new `INSPECTOR_WORDS.rowCardsNoun` `{ one: 'card', many: 'cards' }`; the hover's `rowCards` words are unchanged) |
| Faction top word | "Formidable" | "Foremost" |

All new words live in `data/person-sheet-words.ts` beside `SHEET_GAIN_MARK_HOVER`.

## Engine pillar

One view-model change, no rule. `personRows.ts` `domains` fills two new optional `CardTile` fields from the tier it already reads: `subline` (decision 1, from `getCapabilityTier` and the domain's `DOMAIN_WORD_SCALES` row) and `wordHover` (decision 2), plus `titleTooltipId: 'reach.{domain}'`. A pure helper `rankPlaceLine(domain, tier)` / `rankLadderHover(domain)` lives in `data/domain-words.ts`, next to the ladders. No tick, graph, phase or PRNG change. `personRows.ts` is under `src/engine/`, so the review gate applies.

`d.word` already comes from the same tier (`engine/agentDetail.ts:1803`), so the subline and the word cannot disagree. The tile reads the tier from `s.card.domains[*].tier`.

## UI pillar

Browser-verify tool: in-app browser / Playwright DOM (the Inspector is DOM, no WebGL).

### U1 — the tile's second line and hovers (`types/detailPage.ts`, `shared/Section.tsx`)

1. `CardTile` gains three optional fields (additive): `subline?: string`, `wordHover?: { label: string; desc: string }`, `titleTooltipId?: string`.
2. `CardsSectionRenderer` draws `subline` right after the lines, as `<div data-tile-subline="">` in the `durationWord` style (`--text-xs`, `--text-tertiary`). It wraps rather than clips.
3. When `wordHover` is set, the first line's text sits inside `<Tooltip label desc>`. The ▲ mark keeps its own hover beside it. When `titleTooltipId` is set and the tile has no `ref`, the title sits inside `<Tooltip id>`.

### U2 — the count's noun (`shared/Chip.tsx`, `inspector/RowCards.tsx`)

1. `CountChipFullProps` gains `noun?: string`, drawn after the number in the same span style, `aria-hidden` like the number (the chip's `ariaLabel` already speaks "4 cards").
2. `INSPECTOR_WORDS` (`data/view-content.ts`) gains `rowCardsNoun: { one: 'card', many: 'cards' }`. `RowCardCount` passes `noun` from a `rowCardsNoun(n)` beside `rowCardsWord`, which reads that entry (no string slicing).
3. Styleguide: the count chip entry gains one sample with a noun, and the cards-section entry gains a tile with a `subline` and a `wordHover` (Law 29).

### U3 — faction ladder (`data/subject-sheet-words.ts`)

The faction ladder moves out of inline literals into `FACTION_REACH_WORDS` `['Slight', 'Able', 'Strong', 'Foremost']` and `FACTION_REACH_THRESHOLDS` `[25, 50, 75]` in the same file, and `factionReachWord` reads them, so it returns `'Foremost'` for ≥ 75. Its hover chip is unchanged.

### Player-facing text

| Surface | Exact text the player reads | Class | How the player understands it |
|---|---|---|---|
| Reach tile, tier 2 Iron | "Formidable" / "Middle of the ladder · next Fearsome" | PC-1 (unexplained terms) | The word is a rank, it sits in the middle, and the next one up is Fearsome |
| Reach tile, tier 4 Star | "Cosmic" / "Top of the ladder" | PC-1 | Nothing above it |
| Reach tile, tier 0 Stone | "Clumsy" / "Bottom of the ladder · next Handy" | PC-1 | The bottom, and what growth leads to |
| Rank word hover | "Iron, low to high: Meek, Trained, Formidable, Fearsome, Legendary." | PC-1 | The whole scale, in order |
| Reach title hover | the existing `reach.iron` entry | PC-1 | What the Reach itself covers |
| Row card count | "[card icon] 2 cards" / "[card icon] 1 card" | PC-1 | The number counts the god's cards for this thing, not a fact about it |
| Faction strongest Reaches | "Might · Foremost" for a score of 75 or more | PC-6 (one fact told two ways: "Formidable" named two different places) | "Formidable" is now only ever the middle of a mortal's Iron ladder |

**PC-1:** the explanation lives in visible text first (the subline, the noun), then in the two hovers.

**PC-6:** every other surface that shows a mortal rank word (the encounter skill line, the thread row) reads the same `DOMAIN_WORD_SCALES` word through `getCapabilityWord`, so the ladder the hover lists is the ladder those surfaces use. The god rail's Reach tiers (slice 1, [THR-2183](https://linear.app/threadbare/issue/THR-2183)) are the god's own register and are not changed here. The faction "Strongest Reaches" chip is the one place a ladder word meant a different place, and decision 4 removes it.

### Player-facing display

A mortal's Prowess row reads, per tile: *Reach* / **Iron** / *Formidable* / *Middle of the ladder · next Fearsome*. Hovering *Formidable* shows *"Iron, low to high: Meek, Trained, Formidable, Fearsome, Legendary."* A Connections row ends with *[card icon] 2 cards*.

### UI Laws engaged

Law 1 and 17 (the word and the title gain hovers; the title's is a registry id. The word's hover is a reading built in the view model from a content file, the same shape as THR-2149's ▲ `mark` hover, because the ladder differs per Reach. `tooltipValidation.test.ts` does not see inline hovers, so this plan's own unit test is the Law 18 gate for it), Law 10/15 (no pips added; the scale is words), Law 11 (no meaning carried by an icon alone: the card count now says "cards"), Law 13 (the places are words, no "3 of 5"; the count was already a count of things the player can press), Law 18 (ladder hover ≤ 200 characters, measured 70), Law 27/29 (both changes go into the shared primitives, each with a styleguide sample), Law 33 and Law 57 (the subline wraps inside the tile, at most two lines at the 10rem minimum (the longest is 38 characters); the tile grows before anything is cut, and the Inspector page already scrolls internally).

### Playtest signal

No warm round-4 tester says a rank word has "no scale" or that the row number is unexplained.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

No events; nothing on the map. Debug: DOM attributes `data-tile-subline` and the count chip's existing `data-count-of="inspector-row-cards"` (read by `__DEBUG.getCountChips()`).

## Interface impact

| Contract | Change |
|---|---|
| `CardsSection.tiles[*]` (`types/detailPage.ts`) → `CardsSectionRenderer` | extend (three optional fields) |
| `Chip role="count"` full form | extend (optional `noun`) |

No cross-system read or write is added, so `interface-map.md` is untouched.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `personRows.ts` `domains`, `domain-words.ts` helpers, `person-sheet-words.ts`, `subject-sheet-words.ts` | none (render-time) | `CardsSectionRenderer`, `Chip`, `RowCardCount` | none | none | `data-tile-subline`, `getCountChips()` |

Wiki: grep `public/*.html` for `personRows.ts` / `Section.tsx` / `Chip.tsx` as `sources` and update the matching page; run `check:wiki-freshness:blocking` either way.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| `RANK_PLACE_WORDS` | `['Bottom of the ladder', 'Low on the ladder', 'Middle of the ladder', 'High on the ladder', 'Top of the ladder']` | Where each of the five tiers sits | `data/person-sheet-words.ts` |
| `RANK_PLACE_LINE` | `'{place} · next {next}'` | The tile's second line below the top | `data/person-sheet-words.ts` |
| `RANK_TOP_LINE` | `'Top of the ladder'` | The second line at the top | `data/person-sheet-words.ts` |
| `RANK_LADDER_HOVER` | `'{reach}, low to high: {ladder}.'` | The rank word's hover | `data/person-sheet-words.ts` |
| `INSPECTOR_WORDS.rowCardsNoun` | `{ one: 'card', many: 'cards' }` | The count chip's visible noun | `data/view-content.ts` |
| `FACTION_REACH_WORDS` | `['Slight', 'Able', 'Strong', 'Foremost']` | The faction ladder, low to high | `data/subject-sheet-words.ts` |
| `FACTION_REACH_THRESHOLDS` | `[25, 50, 75]` | Faction score at which each word above the lowest starts | `data/subject-sheet-words.ts` |

## Tracing

N/A — words and layout only; nothing new happens in the simulation.

## Fail-soft table

| Failure | Fallback |
|---|---|
| A domain has no ladder row in `DOMAIN_WORD_SCALES` | No subline and no word hover; the tile is today's |
| The capability is not finite | `getCapabilityTier` already reads tier 0; the line says "Bottom of the ladder · next {word}" |
| `tier` is not an integer in 0–4 when it reaches the helpers | `rankPlaceLine` / `rankLadderHover` return `undefined`: no subline and no word hover (unit-tested) |
| `reach.{domain}` does not resolve | The title renders without a hover (the `Tooltip` id path already draws plain text) |
| The count is 0 | No chip, as today (Law 25) |

## Kill criteria

- At 1920×1080 the subline takes more than two lines in any reach tile, or the Prowess row pushes the Inspector into scrolling where it did not (Law 57): shorten the line to `'next {next}'` and say so in the PR.
- A warm round-4 tester reads "Middle of the ladder" as a score to fill: drop the place words, keep "next {word}".
- A tester still asks what the row count is with "cards" showing: the next step is the tray opening on hover, a new slice.

## Three-pillar check

- [x] Engine pillar present (one view-model fill; two pure helpers; no rule)
- [x] Content pillar present (every word in the table)
- [x] UI pillar present (U1–U3)
- [x] Wiring connects them

## Vision audit

- [x] No Vision premise is contradicted. Words, never numerals, holds: the scale is shown in the game's own rank words, and no number is added. The sheet does not grow a new section.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play. Tiers, capability and the faction score are untouched.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-06-thr-2182-rank-words-show-their-ladder-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Every word is a named constant in a content file |
| 2. Inspectability | PASS | DOM attributes; the count chip's existing debug read |
| 3. Determinism | PASS | No simulation input |
| 4. Fail-soft | PASS | Table above; missing data draws today's tile |
| 5. Narrative over mechanical perfection | PASS | The game's own rank words carry the scale |
| 6. Additive over destructive | PASS | Optional fields and props; one faction word replaced in its own table |
| 7. Performance budget | PASS | One array read per tile at render |

## Done when

- [ ] On `?view=game&seeded&size=medium` at 1920×1080, opening The First's sheet shows every revealed reach tile with a `data-tile-subline` that reads "{place} · next {word}", or "Top of the ladder" at tier 4; the next word is the one above the tile's word in `DOMAIN_WORD_SCALES`.
- [ ] Hovering a tile's rank word shows its ladder hover; a unit test walks every Reach and every tier and asserts the subline names the next word and the hover lists all five words, low to high, under 200 characters.
- [ ] A Connections row with castable cards shows "N cards" (or "1 card") as visible text in its count chip; `RowCards.render.test.tsx` asserts the visible noun, and the existing aria-label test still passes.
- [ ] Other count chips (Needs you, the strip) render as before: their tests are unchanged and pass.
- [ ] `factionReachWord(80)` returns "Foremost"; no player-facing string from `subject-sheet-words.ts` says "Formidable".
- [ ] The styleguide's count-chip entry shows a noun sample, and its cards-section entry shows a tile with a `subline` (Law 29).
- [ ] Browser evidence: one 1920×1080 screenshot of the Prowess row and one of a Connections row with its count (a small visible change, ≤400 UI lines).
- [ ] `npm run gate` is green; the review gate has passed (engine file).

## Coordination block

**Suggested model:** sonnet. Content words, two pure helpers, three optional fields and one prop, all with measured anchors.
**Parallel-safe with:** [the rail rows](https://linear.app/threadbare/issue/THR-2183) (god rail and Doom panel only), [the while-you-were-away recap](https://linear.app/threadbare/issue/THR-2184), [a rival's move has a place](https://linear.app/threadbare/issue/THR-2185) (toasts, rival temper, Chronicle), and ["See the work" lands on the work](https://linear.app/threadbare/issue/THR-2186) (Inspector tab state and two `ui-content.ts` hovers; checked against its build list, it touches none of the files below).
**Mutex with:** none on the shelf. Any later build that edits `CardsSectionRenderer` in `shared/Section.tsx` or the count form in `shared/Chip.tsx` collides on those primitives.

**Files to touch:**
- Edit: `src/engine/views/subjects/personRows.ts`, `src/data/{domain-words.ts,person-sheet-words.ts,subject-sheet-words.ts,view-content.ts}`, `src/types/detailPage.ts`, `src/components/shared/{Section.tsx,Chip.tsx}`, `src/components/Game/inspector/RowCards.tsx`, `src/components/StyleGuide/StyleGuide.tsx`, their tests.

## Notes for the executor

- Line numbers are from `main` @ `dd214308`. Anchor on function names and test ids.
- The word hover goes on the first line's text only; the ▲ mark keeps its own `Tooltip`.
- `DOMAIN_TIER_WORD_FORMS` is untouched: no ladder word changes.

## Forked-audit verdicts

| Axis | Verdict | Note |
|---|---|---|
| NFP | PASS-with-notes → fixed | The card noun was to be cut from `rowCards`, but its `one` form has no `{n}`. It is now its own `rowCardsNoun` entry. The faction ladder's inline literals became `FACTION_REACH_WORDS` / `FACTION_REACH_THRESHOLDS`. An out-of-range tier now has a fail-soft row and a test |
| Three-pillar | PASS-with-notes → fixed | `ReachStanding` and `getDomainProse` were added to the inventory, with why the tile extends `CardTile`. The inline word hover now cites the THR-2149 `mark` precedent and its own Law 18 test. The Law 11 citation for the "?" moved to Law 12. Law 57 is now cited. The `Section.tsx` anchor is corrected to `623-681`, and a styleguide tile sample was added |
| Vision | REVISE → fixed | "Rung" is a UL term for the god's card ladder, so the places now read "… of the ladder". "Mighty" sat beside the fight screen's "Might", so the faction top word is "Foremost". Nothing goes to Christian |

### Intent-judge verdict

Run 1: **Revise**. Dimension 12 found no `### Player-facing text` subsection with complaint classes, and the `rowCards` noun could not be cut from its `one` form. Both were fixed, and the faction words were lifted into constants.

Run 2: **Allow** (Reversible), after the audit fixes as well. One minor GAP: two different figures were given for the longest second line. The plan now says 38 in both places. Two advisories were also applied: the PC-6 gloss and the `engine/agentDetail.ts` path.
