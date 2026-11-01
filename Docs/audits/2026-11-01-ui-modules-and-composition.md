> **title:** Modules and composition — the small set of blocks every panel is built from — THR-2120
> **linear_issue:** THR-2120
> **author:** Claude Code (design lane run 2026-11-01h, wayfinder grilling ticket on the THR-2114 legibility map, unattended — decided by delegation, process.md rule 4; veto in chat)
> **created:** 2026-11-01

# Modules and composition — THR-2120

*Every core panel is built from **seven blocks**, one per anatomy slot plus the Detail slot's five body shapes, and every block already exists as a primitive. Nothing new is invented: the work is to make one implementation of each block the only one, space them on the existing `--space-*` grid, and take frames off everything that is not a thing you press. Decided against the census (THR-2115), the reading-patterns rulebook (THR-2116, "rule N"), the anatomy (THR-2117), text positions (THR-2119) and the type ladder (THR-2118).*

## What the code does today (measured)

- **Three section-heading implementations, not one.** `SectionLabel` in `src/components/shared/Section.tsx` (inline style, icon, gold variant, `marginBottom: '6px'`) heads every Inspector section. `SectionHeading` (`src/components/shared/SectionHeading.tsx`, the `.section-heading` class, count as `(3)`) heads the Threads, Chronicle, Notables and Rival panels (`grep -rl SectionHeading src/components --include=*.tsx`: 9 files with the primitive and styleguide). The god rail's "Your cards" uses a local `labelStyle` constant in `src/components/Game/frame/HandSection.tsx`. Three spellings of the same label rule is how the census found 2–3 heading treatments per panel.
- **`primitives.md` § 1 SectionHeading is stale.** It specifies `--font-display`, uppercase and 0.12em tracking. The code and `index.css` follow the label rule (Alegreya Sans 700, sentence case, no tracking, THR-1879). Canon describes a heading nobody draws.
- **No spacing tokens in the section model.** `Section.tsx` has 39 px literals and 0 uses of `var(--space-*)`. Sections are 20 px apart (`marginBottom: '20px'`, 9 renderers); a heading is 6 px from its body. Elsewhere the grid is in use (`--space-2` 106 uses, `--space-3` 61, `--space-1` 38 across `src/components`).
- **Frames on blocks that are not objects.** The census measured depth 4 on the person page, the Ledger rail (rail → Threads panel → entry card → toggle), the Stage (Stage → step column → card → art) and the choice dialog (dialog → panel → card → chip). The R5 highlight (`HighlightBlock`), event-card sections and cards-grid tiles each draw their own bordered box in `Section.tsx`.

## Decision

### 1. The seven blocks

| Block | Slot (anatomy § 1) | The one implementation | Absorbs |
|---|---|---|---|
| **Header** | Who | `SubjectHeader` (Inspector) — kind label, name, picture, where-line, status chips. `Modal.Header` and `Card.Header` keep their own components but follow the same order and the THR-2118 Title role | the Stage title strip (Law 37 chrome) follows it too |
| **Now line** | Now | `HighlightBlock` (R5) or `BondStrip` (R4). At most one per surface | — |
| **Act row** | Act | `ActOnRow` (Inspector); `Modal.Footer` in a dialog; the Stage's commit | its empty state is `QuietSlot` (R8) |
| **Section** | Detail | `Section`: one heading + one body shape (below) | — |
| **Section heading** | inside Section | `SectionLabel` — the label rule, the R2 icon, an inline count (THR-2119 § 3: "Your cards 2") | `SectionHeading` becomes a thin wrapper over it; HandSection's `labelStyle` and the ledger heads call it |
| **Link group** | Out | `ConnectionsBlock` / the `links` section shape | "show on map", deeper-page doors |
| **Empty** | any slot | `QuietSlot` | headings over nothing |

**The Section's body takes one of five shapes, all existing `Section` kinds:**

| Body shape | `Section` kind | Rule it carries |
|---|---|---|
| Prose | `prose` | Story or UI text; UI text of 3+ lines takes `--measure-ui` (THR-2118 § 3.4) |
| Facts block | `panel`, re-laid as a two-column grid | THR-2119 rule 1: right-aligned label column, one fixed gap, never `space-between` |
| Chip row | `chips` | THR-2119 rule 6: wraps, left-aligned, chips after the row name |
| Tile grid | `cards` | THR-2119 § 4: label under the tile on its left edge |
| List | `links`, and `ListRow` outside the Inspector | a row is the five slots in miniature (anatomy § 2) |

`event-card`, `portrait` and `triggers` stay as specialised kinds. They render inside the same Section shell (heading and spacing) and are not new blocks. A panel that needs something these seven do not cover adds a `Section` kind; it does not hand-build a block (Law 58, `component-selection.md` anti-pattern 1).

### 2. Spacing rhythm: three distances on the existing grid

| Distance | Token | Today |
|---|---|---|
| Between blocks (above a section heading, between Header / Now / Act / Detail / Out) | `--space-6` (24 px) | 20 px |
| From a heading to its body; between rows inside a block | `--space-2` (8 px) | 6 px; 4–10 px |
| Facts-block label-to-value gap; picture-to-words gap | `--space-3` (12 px) | `space-between`, 35–239 px |

Panel inner padding stays `--panel-padding`. The 24 / 8 ratio is THR-2118 § 3.2's "space above ≥ 3× below" put on the grid (its mock drew 1.625rem / 0.5rem; 26→24 is the rounding). A block with a frame gets `--space-2`/`--space-3` inner padding (today's `10px 12px`, onto the grid). No new spacing token.

### 3. Frames: whitespace first, a box only for a thing you press

- **A block gets a frame only when it is one object the player acts on as a whole**: a card, a tile, a dialog option, a list entry that opens something. Plus the surface's one Now highlight (R5 already asks for it, Law 31's one gold emphasis).
- **Sections, facts blocks, chip rows, lists and link groups are grouped by space and their heading, never a box** (rule 9, NN/g common region: add a container only when spacing is not enough).
- **Depth ≤ 2 containers: surface → card.** Controls inside a card (a chip, a toggle, a button) are not containers and do not count. What changes: the Ledger rail's Threads panel loses its frame (the rail is the surface, the entry is the card); the Stage's step column loses its frame; the choice dialog's inner panel loses its frame. The event-card section keeps its box, because it is clickable as a whole.

### 4. Learned once: the same block on every surface

A block looks the same wherever it appears: the same component, the same THR-2118 roles, the same spacing. Only two things vary by surface, and both are already decided:

- **The Title size** per panel kind (THR-2118 § 3.1: Inspector `2xl`, dialog and Stage `xl`, rail `lg`).
- **Density:** the god rail and Ledger rail use the docked Inspector's layout for every block they share (section heading, chip row, list rows). A rail is never denser than a docked page.

A section heading in the Inspector, a dialog and the god rail is the same `SectionLabel` with the same icon rule. That is the test a reviewer runs on a screenshot.

## What lands where

- `primitives.md`: § 1 SectionHeading rewritten to the label rule and as a wrapper over `SectionLabel`; a new § *Blocks* table (§ 1 above) above the Usage Decision Tree.
- `layout.md`: the three distances (§ 2) and the frame rule (§ 3) under *Panel Padding*.
- `component-selection.md`: "Show entity details" points to the seven blocks; anti-pattern added: a box around a section.
- Build: `Section.tsx` literals → tokens, the `panel` grid (THR-2119), the three headings → one, three frames removed. Each plan doc builds after the art-led slice for its surface, as the map's coordination note says.

## Would change the call

- Christian wanting sections in boxes ("keep the section boxes"): § 3 would let a section take a `Panel level="inset"` frame, at depth 3.
- A page whose deciding state needs two Now lines (anatomy § 7): the second goes to the first Detail section. The inspector-lab sweep in the plan doc checks every kind.
- A playtest showing 24 px block gaps make the docked Inspector overflow at 1920×1080 (Law 33): the between-block step drops to `--space-5` (20 px), keeping the ratio above 2×.
