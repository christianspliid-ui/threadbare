> **title:** Text positions — where labels, values, numbers, captions, chips and tooltips sit — THR-2119
> **linear_issue:** THR-2119
> **author:** Claude Code (design lane run 2026-11-01f, wayfinder grilling ticket on the THR-2114 legibility map, unattended — decided by delegation, process.md rule 4; veto in chat)
> **created:** 2026-11-01

# Text positions — THR-2119

*One rule per case, for every core panel. Decided against the census (THR-2115), the reading-patterns rulebook (THR-2116, cited as "rule N") and the panel anatomy (THR-2117, cited as "anatomy § N"). It places text; it decides no sizes, weights or colours — those are THR-2118's, which is reserved for Christian. The rules land in canon (`layout.md`, `typography.md`) through the map's plan docs, not here.*

Inputs: [`2026-11-01-ui-legibility-census.md`](2026-11-01-ui-legibility-census.md), [`2026-11-01-ui-reading-patterns-research.md`](2026-11-01-ui-reading-patterns-research.md), [`2026-11-01-ui-panel-anatomy.md`](2026-11-01-ui-panel-anatomy.md), `Docs/design-system/laws.md` (Laws 13, 16, 18, 19, 33, 36, 57, 58), `Docs/design-system/typography.md`.

## What the code does today (measured)

- **The one shared facts row pushes its value to the far edge.** `PanelSectionRenderer` (`src/components/shared/Section.tsx`, the `panel` section kind) draws each row as `display: flex; justifyContent: 'space-between'` — label at the left padding edge, value at the right one — at `fontSize: '0.8rem'`. So the label-to-value gap is whatever width the panel has left: the census measured 35 px and 239 px gaps in one carried-items block on the person page at wide (census § Inspector, per-page counts). Rule 7 fails by construction, and gets worse the wider the panel grows.
- **Who uses it.** Seven person-page sections, all through the `panel()` helper in `src/engine/views/subjects/personRows.ts` (`allegiance`, `core`, `personality`, `reputation`, `knows`, `disposition`, `designs` — `grep -n "panel('" src/engine/views/subjects/personRows.ts`). Fixing the row fixes all seven at once (Law 58).
- **Elsewhere, labels sit above** — the kind label over the name, every section label over its body (census § Inspector, shared shape). The exceptions are hand-built: the god rail's "Your First:" + chip and "Essence … Primary: Mind" (8 px to 134 px gaps, census § God rail), the place page's "City" moving left of its description at wide, and the top bar's "Doom ◈ Strange Whispers".
- **The list row's trailing slot** (`ListRow.tsx`) sits at the row's right edge (`flexShrink: 0` after a `flex: 1` body) — a deliberate second axis, used for counts, toggles and the "go there" mark.
- **Tooltips** (`Tooltip.tsx`): a root tooltip centres above its trigger and flips below at the viewport edge; a chained tooltip opens beside its parent (right, then left, then below).
- **Line length.** Story prose is capped at `--measure-prose` (34em, about 70 characters). Nothing caps UI text: Inspector body reached 90–99 characters per line at 2560 wide (census finding 8).

## The rules

### 1. Label above, by default

A label sits **above** its value: the kind label over a name, a section label over its body, a short label over a chip row. It is the convention the panels already use almost everywhere; it is the fastest label-to-value path in the one study we have (rule 7); and it holds at every panel width, so growing a panel (Law 57) never moves a value away from its label.

**Beside is allowed in one place only — a facts block:** three or more pairs whose values are each one short line (a word, a phrase, an identity chip, a pole bar). There:

- the labels form **one column, right-aligned**, so each label ends tight against its value (rule 7);
- the column is as wide as the block's longest label (CSS grid `max-content` then `1fr`), and the gap between label and value is one fixed spacing token — **never `space-between`**, never a gap that depends on the panel's width;
- a value that wraps to a second line, or is prose, or is a row of several chips, leaves the block: that pair takes label-above.

**Law 16 still decides first.** A label bolted onto a sentence, or a lone label:value in a header or rail, becomes a sentence or a chip before this rule applies — "Your First: Kael" becomes a sentence that names Kael, or the label goes above. The facts block is for the pairs left after that, the section shape Law 58 already sanctions.

**One exception — the top bar.** It is one 48 px line (56 px at 2560) and cannot stack. A top-bar item may put its label before its value on the same line, with the one fixed gap.

### 2. Alignment axes — two edges and one seam

- **One left text edge per panel**, or per column at wide and Full (anatomy § 3). It is the reading axis.
- **One right edge**, the panel's padding edge, for the trailing slot only: a list row's toggle or "go there" mark, a numeric column. Never for a label's value, never for a sentence.
- **At most one seam per facts block** — the line between its label column and its value column. Two facts blocks in one section share one seam (one label column width for the section).

Nothing else gets its own axis. **Centred text** is kept for the single display lines of the ceremonies and the start page (rule 6, sparse screens). Panels, dialogs, tooltips, rows and tile captions are left-aligned; the choice dialog's centred title moves to the left edge. No player text is justified (rule 15).

### 3. Numbers in columns

Where numerals are allowed at all (Law 13: the essence pool balances in persistent chrome, the designer view, debug), a column of numbers is **right-aligned and tabular** (`--figures-tabular`), and anything that heads it is right-aligned over it (rule 16). Text columns stay left-aligned.

A **count that belongs to a heading** — "Agents", "Your cards", a fold's "Their allies" (Law 36, rule 17) — follows its heading's words on the same line, not pushed to the panel's far edge. A count at the far right reads as a separate thing (proximity, rule 8), and it is the part of a wide line the eye skips (rule 5). The god rail's "Your cards … 0" (count at *x* 297 of a 320 rail) and the Ledger rail's "Agents (1)" become one form.

This rule adds no numbers anywhere: on mortal-facing surfaces magnitudes stay words, pips and delta clusters.

### 4. Captions and pictures

- **A thumbnail or face (docked, rows, hover card): the words sit to its right**, their first line level with the picture's top. This is the Inspector's docked header, the art-led list rows (THR-2103) and the hover card (anatomy § 5).
- **A large picture (wide and Full): the name goes above it**, left-aligned (anatomy § 1, already decided). Lines that describe the subject (the where-line, status chips) go under it, left-aligned.
- **A tile in a grid** (the `cards` section's small tiles, the court's seats): its label sits **under** the tile, aligned with the tile's left edge, one line; a label that needs two lines wraps on that edge, never centred.
- **An illustration's own words** (card art, a relic's painting) belong to that object's anatomy — card faces keep their card layout; this rule does not reach inside a card.

### 5. Line length for UI text

UI text that wraps to **three lines or more** — an Inspector body paragraph, a facts sentence, a dialog's news line, a first-use caption — takes the same cap as story prose: **`--measure-prose`** (34em). Because the cap is in em, it gives about the same characters per line at every size and both viewports. When a wide or Full panel has more width than the cap uses, the width goes to margin, a second column or the picture (rule 15), never to longer lines. No new token.

Short-form text is exempt from the 50-character lower bound: a tooltip (at most 200 characters, Law 18) keeps its narrow box, and a one- or two-line row is not a measure question at all.

### 6. Chips, badges and tooltips

- **A chip about the subject** (a status, a bond) sits in the subject's chip row under its Who line (docked) or under its picture (wide), left-aligned, after the where-line (anatomy § 1).
- **A chip about one row** comes **after** the row's name on the same line — the name leads (rule 3), the chip qualifies it. Never before the name, never floated to the far edge.
- **A badge** (a count on a tab, "new", a rarity word outside a card face) sits **right after the word it qualifies**, on its baseline. A dot on an icon-only control sits on the icon's top-right corner. A badge never floats free of its word.
- **Tooltips keep today's placement as the rule:** a root tooltip and a hover card open above the trigger, centred on it, and flip below at the viewport edge; a chained tooltip opens beside its parent, so the chain stays anchored (Law 19, rule 18's note on CK3). A tooltip never covers its own trigger. Its text is left-aligned, heading included.

## What this does not decide

- **Sizes, weights, colours, heading style** — THR-2118 (reserved for Christian). The facts row's `0.8rem` (12.8 px) is below the 16 px floor that `typography.md` already sets; that is a settled-canon defect the plan doc fixes, not a size choice made here.
- **The blocks each slot is built from** — THR-2120. It should carry rule 1's facts block as one block (the `panel` section kind, re-laid), and rule 6's chip row as another.
- **Which panels get a plan doc, and in what order** — the map's "Not yet specified".
- No new container, no engine change, no new art, no new token.

## Would change the call

- Christian preferring label-beside as the default ("labels on the left, like a character sheet") — rule 1 would flip, and the facts-block grid would become the default shape everywhere a value fits on one line.
- A playtest showing players miss counts placed after headings — rule 3's counts would move back to the right edge.
- THR-2118 choosing sizes where the 34em cap gives under 50 characters on some UI face — rule 5 would take its own `--measure-ui` token.
